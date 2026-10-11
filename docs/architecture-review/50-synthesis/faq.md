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
