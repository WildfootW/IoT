# 架構問答

> 2026-10-11 起，owner 針對最終方案提出的問題與主審的回答。依 `final.md` 回答；主審自己的判斷標「意見」。

## Q1. device 與 branch 的實作是同一套嗎？

是。unit、branch、root node 是同一支 node release，差別在設定啟用哪些角色與子 process；解析外部位元組、發證、寫 DB、更新 helper 各自獨立 UID。unit 一詞保留給硬體身分（serial、key、unit/function 事實鍵），leaf 是它在樹上的角色。詳見 `roles.md` §0。

## Q2. 用 PostgreSQL 失去的東西沒關係嗎？

有條件的沒關係。失去壓縮、continuous aggregates、retention policy、時間桶查詢速度。後三樣在我們的規模無關或自己補（dirty-bucket roll-up、DROP PARTITION）。壓縮是真的風險：300 條 series 全 1 Hz 時平白 PG 約 150 GB heap 加 90 GB index，TSDB 約 3 到 6 GB。所以 final 設了量化門檻（超 10 億樣本、儲存超六成、查詢 p95 超 2 秒、恢復超 8 小時）才評估替代引擎。意見：第一個 D-06 站點就該跑 G-S 的容量 PoC。詳見 `roles.md` §4。

## Q3. 歷史資料與業務資料的權威在哪？

四本帳不重疊：業務意圖在 Odoo PG；裝置實況在 leaf 的 SQLite；身分與授權在 trust log；量測樣本在獨立 history PG，自 PG commit receipt 起，之前由來源的 spool 暫持。詳見 `roles.md` §7。

## Q4. 如果用 MCU 做 unit 會怎麼樣？

**結論先講。** 可以，而且契約的形狀對 MCU 是友善的；代價是多一個實作（第二種語言與 toolchain），所以要等有產品理由才做。MCU 永遠只能當 leaf，不能當 branch。

**契約哪些部分 MCU 做得到。**

| 契約要求 | MCU 上的狀況 |
|---|---|
| child 撥出 HTTPS、TLS 驗 parent | 可以。mbedTLS 類 stack 在 ESP32 級 MCU 上是常態；TLS session 約 40 到 50 KiB RAM |
| 串流或有限批次 | **用批次模式**。契約本來就允許「有限批次」：每 N 秒一個 HTTPS 請求同時帶 report 與 fetch。命令延遲等於輪詢間隔，對感測與 LED 夠，對螢幕不夠 |
| JWS 驗下行、簽上行 | 可以。Ed25519 驗簽與簽章在 MCU 上是毫秒級；拒重複 key、演算法白名單都是小程式 |
| 裝置產鑰、bootstrap、7 天 cert 續期 | 可以。ESP32 類有 eFuse、secure boot、flash 加密，金鑰硬體保護**比沒有 SE 的 CM4 好**，反而接近 Type 3 的要求 |
| register 式更新、A/B | **比 CM4 容易**。OTA 雙分割區是這類 MCU 的原生功能，final 在 CM4 上要用兩個目錄模擬的事它天生就有 |
| 時間 | 沒有 RTC。契約已規定 announce 回應帶 parent 時間、不確定度超 2 秒不授權；MCU 一定走這條路 |
| 離線時 LKG 繼續 | 可以。desired 很小，放 flash |

**哪些部分要縮。**

| 契約要求 | MCU 上的狀況 | 怎麼縮 |
|---|---|---|
| result log 未獲 receipt 前無 TTL、已交接後 90 天、預留 256 MiB | 沒有這麼大的 flash，也沒有 SQLite | retention window 本來就是「明寫的設定」，MCU 在 announce 裡宣告小窗口（KiB 級的 append-only log 加 CRC）；branch 收到 receipt 後就接手耐久保管。契約的 receipt 交接語意正好讓它成立 |
| telemetry spool 48 小時或 1 GiB | 同上 | 宣告小 spool；超限記來源序號缺口，不假裝完整。30 秒一筆的感測器 48 小時只有 5,760 筆，其實放得下 |
| 文件 plane、媒體快取 | 不適用 | MCU leaf 沒有 display function |
| parser 與持鑰 process 分 UID | 單一韌體沒有 process | leaf 不解析 hostile 輸入（它只讀自己的感測器），所以可接受；這也是 MCU 不能當 branch 的原因 |
| 分 process 的 backend | 無 | 單一韌體內以模組切分，F-07 的「感測器崩潰不拖垮命令服務」改用 watchdog 與獨立 task |

**真正的代價。** 第二個契約實作：C 或 embedded Rust、另一套 toolchain、另一條 CI、另一個要追的 SDK 時鐘。M-02 直接多兩種。好處是它會逼出一份真正語言中立的契約與 conformance suite，這本來就是 P5(A) 要的東西。

**另一條路：MCU 當 Type 1。** 如果只是要便宜的感測盒，讓 MCU 講 Modbus TCP 或 MQTT 進 branch 的 poller 或 intake，零新架構，今天就能做。代價是它被當 hostile、沒有命令下行、沒有我們的身分。對只上報的感測器這常常就夠了。

**意見。** 不要為了 MCU 改契約；契約已經留了批次模式、宣告式 window、parent 授時三個洞給它。觸發條件是「CM4 對感測盒太貴」這種產品理由出現時，先做 Type 1 版本，等到需要命令下行或我們的身分時再做 Type 2 的 constrained leaf profile。電池供電的 MCU 是另一回事：睡眠裝置連批次 HTTPS 都嫌重，那時 CoAP 或 MQTT-SN 的問題會重新打開，但那不在目前錨點內。

## Q5. 新增一種裝置，是不是只要改裝置端跟 root？中間不用動？

**結論先講。** 常態情況下中間不動，而且 root 也不改 code，只記一筆決策。要改的是兩端：leaf 的 function backend，和 ERP 的管理模組。這正是 F-39 的目標，也是最終版相對今天最大的改善之一：今天改一個命令集要動三個 repo（edge 分支、registry 重 provision、ERP subscription spec）。

**常態：新的 Type 2 功能，用既有的 slot class（register、job、量測）。**

| 層 | 要不要改 | 改什麼 |
|---|---|---|
| leaf backend | 要 | 新的 function backend，加一份 **function manifest**：class、schema、單位、capability、分類建議 |
| ERP 管理模組 | 要 | 該功能類別的 class driver：UI、驗證、業務 desired、結果呈現。manifest 生成兩端的對映，不是手改欄位清單 |
| branch | **不改** | 它是 schema 驅動的：validator 依 announce 宣告的 schema 檢查，快取與轉送不看內容。只要沒人往 branch 塞「某類型專用」的邏輯，它就是透明的 |
| root node | **不改 code** | 收到 announce 後，schema 要由管理權威核准並發 activation receipt；功能分類（Intent-Only 或 Control-Semantic）由產品與安全 owner 裁決並寫進 trust log。這是一筆**資料與決策**，不是程式 |
| recorder 與 history PG | 不改 | 窄表加 schema revision，新屬性就是新 rows |
| trust log | 不改 code | 多一筆分類與 schema 核准紀錄 |
| conformance suite 與 e2e | 要加 case | 新功能類別一組 fixture；G-C 要求每個 correctness milestone 綰 case |
| Grafana | 看需要 | dashboard-as-code 加一張 |

**例外：以下情況中間或契約要動。**

| 情況 | 誰要改 | 為什麼 |
|---|---|---|
| 新的 Type 1 講一種 branch 還不會的協定（例如 BACnet） | branch 的 poller backend | 協定轉譯住在 branch。新的 Modbus 暫存器表只是設定，不算 |
| 需要新的 slot class（例如 D-05 的事件型 append） | leaf、branch、root 全部 | 契約 wire minor 要升，slot class 是契約的一部分；混版矩陣要重跑。final §3.3 的 v1 刻意沒定事件型 append，D-05 進來時會碰到 |
| 新類別是 Control-Semantic（會致動） | 不入樹 | 命令面另案，樹只做身分、存活、非控制設定 |
| 新類別要新的 projection 形式給 HMI | branch 的 projection | 例如 Sparkplug 的 BIRTH 點表 |
| 新類別需要不同的 retention 或限速政策 | 只改設定 | window 與速率都是宣告式的 |

**守住這件事的方法（意見）。** F-39 成立的前提是 branch 保持類型無知。在 conformance suite 放一條硬測試：一個 branch 從沒見過的 function class，必須原樣轉送且只被 root 的政策拒絕，branch 自己不得拒也不得改。這條測試壞掉的那天，就是有人把類型邏輯寫進中間層的那天。

## Q6. 同一個區網只能有一個 branch 嗎？

不是協定限制，是 M-04 的部署建議值。掃描（DNS、mDNS）只負責定位，不負責決定：leaf 只接受憑證鏈到預置環境根且符合 voucher 限制（env、tenant、parent）的 parent；真正的 parent 由 registry 在 adopt 時指派並寫進 cfg.parent；搬家就是 re-plug，path 變、unit 身分不變。所以同一 L2 可以有多個 branch（兩個租戶各一個、新舊並存）。一屏最小部署沒有 branch，voucher 直接寫 root node 的 FQDN。

## Q7. 管理攝影機時，狀態走樹，那影像資料流量呢？

**結論先講。** 影像永遠不進樹，也不進 trunk。樹管攝影機的身分、存活、設定與事件；影像是獨立的 media plane，圍堵點在 branch 旁的媒體中繼，授權由樹核發，錄影留在站點。這是 §9 Q17「哪些 channel 走樹、哪些直連」在 HMI projection 之後的第二個明列例外。PCIe 的類比剛好：攝影機像 GPU 或 NIC，config space 很小、DMA 很大，DMA 不會經過 config space，而是在 IOMMU 的映射下直達記憶體；我們的「映射」就是樹核發的 grant。

**為什麼不能走樹。** 樹的回傳資料面是為 F-01 的每量測 ≤ 1 Hz 設計的：每 child ≤ 2 條連線、批次 ≤ 256 KiB、spool 以 GiB 計、history PG 三年幾十到幾百 GB。一路 1080p H.264 約 2 到 8 Mbps，十路就是 20 到 80 Mbps 持續不斷，三年是數百 TB。任何一個數字都和樹差三到五個數量級。

**攝影機是什麼。** 封閉韌體，典型 Type 1，而且正是 O02 說的「關進自己 VLAN、只讓 branch 對外」的對象。

| plane | 走哪裡 | 內容 |
|---|---|---|
| 管理 | 樹 | stand-in 代述：存活（ONVIF 或 RTSP 探測）、設定（解析度、碼率、NTP、帳密輪替）、韌體版本、分類裁決 |
| 事件 | 樹 | 移動偵測、越線、斷訊、儲存滿等業務事件，≤ 1 Hz；縮圖快照當事件附件，不當影像流 |
| 影像 | **media plane，不進樹** | 攝影機 → branch 旁的媒體中繼（intake 的影像版）→ 授權的觀看者；錄影在站點本地磁碟 |

**media plane 的規則。**

1. 攝影機只能到媒體中繼。中繼住在攝影機 VLAN 的邊界，是唯一的 RTSP / ONVIF client；觀看者永遠不直接碰攝影機。這和 intake 的邏輯一樣：hostile 來源只到一個隔離的收口。
2. 觀看授權由樹核發。觀看者向中繼要串流時帶一張 root node 簽的短效 grant（scope 到 camera id、期限幾分鐘），中繼驗 grant 不驗帳密。撤銷走 trust log，和其他 grant 一樣。
3. 錄影留在站點。中繼或 NVR 寫本地磁碟，保留以天或週計，由容量決定；樹只記錄「哪台、哪段時間、在哪個站點、保留到何時」的指針。history PG 永不收影像。
4. 跨站觀看是另一個 profile。(c) 形狀下從雲端看站點影像，要嘛在 root 側放一個媒體中繼（頻寬與雲端出口費用是我們的）、要嘛 WebRTC 加 TURN（多一種元件）。第一版不支援遠端即時觀看，只支援站內 HMI VLAN 觀看與事件快照上送；有客戶需求再開 profile。
5. 不自建影像軟體。媒體中繼與 NVR 是成熟品類：mediamtx、go2rtc、Frigate（含偵測，需較多算力）等皆為寬鬆授權；當 branch 旁的一個 backend process 跑，由樹管它的存活與設定。授權與維護者狀態未查證，採用前照 M-06 查。若客戶已有 NVR 或 VMS，走 F-34：它是一個 ERP connector，不重做。
6. PTZ 這類會動的控制：是物理致動但無危險性，分類建議 Intent-Only（desired preset），由產品與安全 owner 裁決；門禁聯動開門仍是 Control-Semantic，不入樹。

**ERP 看到什麼。** 攝影機在 Fleet 裡是一個 stand-in 功能，有存活與設定；事件進業務 archive 並可綰工作中心或工單；事件附縮圖；點「看影像」是跳到 projection 的播放頁，拿一張短效 grant，不是 ERP 自己轉影像。

**意見。** 這題值得寫進最終版 §5 當第二個明列例外，並加一條 gate：影像流量零封包進 trunk，攝影機零路徑到觀看者。否則第一台攝影機進來時，有人會圖方便讓它直接推到螢幕或 ERP。

## Q8. trust log 放我們雲端，客戶就不能純本地運行了？

**結論先講。** 對，所以不能把位置寫死。trust log 的位置是部署 profile：(a)(b) 預設**本地**，(c) 預設在我們雲端，另有一個可選的「雲端見證」只送 digest 不送內容。純本地要成立，靨的不是多一台機器，是兩個軟體機制：trust log 自己的 append-only hash chain 與獨立備份流，加上 fleet 當 rollback 的見證人。

**trust log 到底在防什麼。** 兩件事：(1) 業務備份還原把撤銷抹掉、復活已撤銷的裝置；(2) 主機整台毀損後安全狀態全失。final 說的「獨立故障域」是為了第二件，但第一件才是常見的，而第一件只需要「不和業務資料放在同一個備份集」就能解，不需要另一台機器。

**純本地 profile 怎麼做（零硬體）。**

| 機制 | 做法 | 成本 |
|---|---|---|
| 分離儲存 | trust log 是 root node 主機上一個獨立的 append-only 資料庫（SQLite 或獨立 PG database），每筆帶前一筆 digest 形成 hash chain；不在 ERP 的 PG 備份集裡 | 軟體，寫一次 |
| 獨立備份流 | 每日加密匿出到客戶指定的位置（NAS、USB、客戶自己的備份系統），與業務備份分開排程；因為是 append-only，匯出只有增量 | 一個 cron |
| fleet 當見證人 | 每個 leaf 與 branch 已經要持久保存「安全 revision 高水位」與撤銷清單鏡像（final §5.2：持久 sequence floor 長存、拒絕非遞增）。root node 若從舊備份還原、revision 倒退，fleet 會拒絕它的新 grant，直到它補齊或換 epoch。這讓 rollback **被偵測**，而不是靜默成功 | 已在設計裡，加一條 conformance case |
| 整台毀損的退路 | trust log 內容真的全失時，不拿舊名冊補權：換 issuer 中繼金鑰、發新 epoch、所有裝置走 recovery route 重新 adopt。幾十片螢幕是幾十分鐘的事。這就是 final 的「隔離重建」 | 流程，寫進 runbook |

**可選的雲端見證。** 客戶若不介意，root node 每次 checkpoint 把 digest（不含內容）送到我們雲端存一份。它只證明「這筆決策在這個時間點存在過」，像時間戳服務。我們雲端消失了客戶照樣運作；客戶的資料一個 byte 都沒離開站點。這對「我們公司哪天不在了怎麼辦」的問題也是乾淨的答案。

**三種 profile 的取捨。**

| profile | 優點 | 缺點 | 適用 |
|---|---|---|---|
| 本地 | 零對外依賴、零額外硬體、客戶資料不出站 | 整台毀損且備份也丟時要全 fleet 重新 adopt；保管人是客戶或我們的現場人 | (a)(b) 預設 |
| 本地加雲端見證 | 多一層 rollback 證據；我們能遠端判斷客戶的 trust log 有沒有被動過 | 多一條對外連線（digest 而已） | 客戶同意時 |
| 雲端 trust authority | 集中保管、一組保管人管所有站點、天然獨立故障域 | 站點斷 WAN 時不能 adopt、不能寫新撤銷（既有 lease 到期照舊生效）；客戶依賴我們 | (c) 形狀；或客戶明確要我們代管 |

**對 v1 的意思。** O05 改成：trust log 預設本地、hash chain、獨立備份流、fleet 見證、整台毀損走重新 adopt；雲端只在 (c) 或客戶要求時。零硬體、零承諾，純本地成立。

**順帶檢查「純本地」還有沒有別的破口。** ERP、root node、history PG 都在站點。新裝置出廠時帶 voucher，不需連我們。軟體更新的 artifact 有簽章，可以離線帶進去（救援 kit 本來就是離線的）。時間用站內 NTP。所以 (a)(b) 可以完全不連外，代價只有兩個：新版軟體要人帶進去或客戶開一條到我們 artifact 伺服器的出口；以及 trust log 的異地副本由客戶自己保管。
