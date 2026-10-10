# P4（買不要做：ThingsBoard 三件組）批評：十年維運 lens

> 波次 B 批評者，lens = longevity。日期：2026-10-10。目標：`20-proposals/P4-buy.md`。輸入：`00-requirements.md`、`01-proposal-pcie-tree.md`、`02-tradeoffs.md`、`03-brief.md`、`10-facts/{buy-options,mqtt-brokers,nats,zenoh,postgres-timeseries,precedents}.md`。事實引用寫成「`檔名` 列號」或 URL 加查證日期；沒有來源的主張標「未查證」或「意見」。

## 0. 結論先講

**致命 1 條、重大 6 條、次要 3 條。** 一句總評：P4 把 M-06 的時鐘買成了一個「看得見的時鐘」，這一點是真的；但它把 M-05 的授權、三條廠商版本線的相容矩陣、五個狀態庫的備份還原，全部交給了一家兩週前才改過授權、我們沒有人能讀懂其程式碼的單一私人公司，而對 (a)(b) 形狀唯一不違反 M-05 的路徑（凍結在 4.3.1.x）是一條沒有任何人承諾會修補的死線。P4 在形狀 (c) 是六個提案裡最成熟的現成品；在形狀 (a)(b) 它不是一個十年方案。

## 1. Findings

| 編號 | 嚴重度 | 一句話 | 形狀 | 可修？ |
|---|---|---|---|---|
| longevity-01 | 致命 | (a)(b) 的 M-05 處理是「法務判讀或凍結」，兩者都不是十年路徑；第二個站點就撞「一台 server」 | (a)(b) | 不可修（在 P4 前提內） |
| longevity-02 | 重大 | M-02 重算：IoT Gateway 是獨立引擎與時鐘、設定方言沒算，16 應為 19～20 | 全部 | 可修（誠實重算或換掉 gateway） |
| longevity-03 | 重大 | 三條 ThingsBoard 版本線的相容矩陣不是我們的，Edge 落後 server，升級順序在 (c) 是全客戶同步 | (c)、(b) | 可修（代價是 ops 協調與測試矩陣） |
| longevity-04 | 重大 | N-09 零字：五個狀態庫、還原 TB PG 等於對還原點之後 adopt 的裝置做靜默 revoke | 全部 | 可修（TB 登錄做成可由 Odoo 重建） |
| longevity-05 | 重大 | 退出單位是三件組加整個 CM4 fleet，§9 的 10～13 人週只算了 north 的 code | 全部 | 部分可修 |
| longevity-06 | 重大 | bus factor：單一私人公司、無基金會治理、剛改過一次授權；Change Date 對沖給的是四年前的 Java code | 全部 | 不可修（只能靠 05 的退出演練） |
| longevity-07 | 重大 | Edge 是每站（每 VLAN）一台 JVM 加 PG 的第二台伺服器，十年要顧 N 台 | (b)(c) | 部分可修 |
| longevity-08 | 次要 | M-01：三年後 TB 剩下的理由可能只是「一台 JVM 跑 RPC 佇列」 | 全部 | 可修（限定使用面） |
| longevity-09 | 次要 | 與 Odoo 共叢集：TB 升級腳本、PG 版本相容、TTL 機制未查證，ts_kv 拖著 ERP 備份 | (a)(b) | 可修（獨立 PG 實例） |
| longevity-10 | 次要 | 「備案 FIWARE 升版」過不了錨點 9，所以 (a)(b) 其實沒有備案 | (a)(b) | 不可修 |

### longevity-01（致命）：(a)(b) 的 M-05 處理不是十年路徑

**情境。** 形狀 (a) 或 (b)，D-01 第一個客戶（三片螢幕、六個感測器）之後的**第二個**客戶站點。

**哪一步會壞。** P4 §1 弱點 1 與 §7 給 (a)(b) 三條路：客戶成為 licensee、我們以「代管」持有授權、凍結在 Apache-2.0 的 4.3.1.x。逐條看十年：

- **客戶成為 licensee**：免費額度要求保留 "Powered by ThingsBoard"、使用廠商核發的金鑰、不得繞過金鑰功能（`buy-options.md` 列 26，T3）。這就是 M-05 定義的「綁住客戶的授權義務」，P4 自己也承認「M-05 直接違反」。
- **我們代管**：Additional Use Grant 的商用免費額度是「≤100 Devices 且**生產環境不超過一台 server**」（列 26）。若我們是 licensee，第一個 (a)(b) 站點用掉那一台 server，第二個站點就超額——**與裝置數無關**。所以「代管」只在單一客戶時成立，第二個客戶簽約那天壞掉。P4 把它標成「法律判讀，未查證」，但 server 數不需要法律判讀。
- **凍結 4.3.1.x**：P4 自己標「舊線的修補期限未查證」（§2 表、§7）。事實是 4.3.1.6 與 4.4 同日發（列 24，T1），這證明今天有人修，不證明明年有。一個凍結在客戶內網的 Java/Spring Boot monolith（pom 為 Java 25、Spring Boot 3.5.15，P4 §2 引 pom.xml raw，2026-10-10），在修補停止後就是 Mongo 6.0 EOL 的同型（`02-tradeoffs.md` §4 的四種狀態中的 line ended），而我們沒有人能自己修 Java（P4 §2：Java「不寫」）。另外 IoT Gateway 3.8.x 是否持續相容 4.3 server：未查證。
- **Community Grant**：T5（列 28，搜尋摘要）說「已註冊的舊 CE 使用者」可免費沿用、註冊截止 2027-07-20。我們從未跑過 ThingsBoard，是否符合「舊 CE 使用者」未查證；且 Grant 是給 licensee 的，不解決每個客戶站點各一台 server 的問題。

**依據。** M-05（`00-requirements.md` 列 13）；`buy-options.md` 列 25～29、列 150；P4 §1 弱點 1、§7、§8 第 1 點。

**可不可以修。** 在 P4 的前提（north 是 ThingsBoard server）內不可修：唯一合法又有修補的路是每個站點簽商業授權，而那正是 M-05 禁止的東西。可修的版本是把 P4 縮成「只對 (c) 形狀成立」的提案——站點側全是 Apache-2.0（Edge、Gateway，P4 §1 理由 2），server 在我們的雲、我們是唯一 licensee、一台 server。但那違反錨點 3「三種形狀都要成立」，而且 Edge 在 4.4 是否跟著改 BSL 仍未查證（列 29，T6）。P4 §8 第 1 點已承認「會在第一個 (a)/(b) 客戶簽約那一步壞掉」，我的補充是：它的三條處理路徑沒有一條活過十年，所以這不是「要談的合約」，是方案在 (a)(b) 不成立。

### longevity-02（重大）：M-02 重算

**P4 的算法**（§2 末段）：引擎 4、語言 4、runtime 3、repo 5 = 16，含 Mosquitto 17；對照 P0 的 13 淨增 +3。

**重算。** 任務單要求引擎、語言、runtime、repo、要追的外部時鐘各算一種。

- **引擎**：P4 漏了 **ThingsBoard IoT Gateway**。它有自己的版本線（PyPI 3.8.3 = 2026-03-26、3.8.4 = 2026-08-05、3.8.5 = 2026-09-17，P4 §2 引 PyPI JSON，2026-10-10），自己的設定 schema、自己的 storage 實作、自己的升級步驟，而且跑在**最難升級的那一層**：每一片 CM4。P4 在 §2 表把它列成獨立元件，卻在算種類時把它併進「同廠商」。它與 server、Edge 的關係等同 IoT Agent 與 Orion：同一個基金會不代表同一個時鐘（`00-requirements.md` §7 就是把 Orion 與 IoTA 分列）。引擎 = 5（server、Edge、Gateway、PG、Odoo），含 Mosquitto 6。
- **語言／方言**：Python、Java（讀）、TBEL、SQL 之外，P4 的 tb-config repo 裝的是 rule chain JSON、dashboard JSON、device profile JSON、tenant profile，加 CM4 上的 gateway connector JSON 與 converter 對應（P4 §1 理由 3、§4.3）。P1 §2 把 `mosquitto.conf` 與 dynsec JSON 誠實列為「不算種類但要維護的方言」；P4 的方言至少四種，且全部只在 ThingsBoard 裡有意義。保守算一種。語言 = 5。
- **runtime**：JVM、Python、PG = 3，P4 的算法成立。
- **repo**：5，成立。
- **要追的外部時鐘**（P4 沒有單獨算這一欄）：TB server、TB Edge、TB Gateway、JDK 發行版（master 已 Java 25，JVM 大版每年追，P4 §8 第 3 點）、PostgreSQL（2030-11-14，`postgres-timeseries.md` 列 39）、Odoo（每年一大版，`02-tradeoffs.md` §1）、以及 gateway 相依的廠商 fork `tb-paho-mqtt-client` 與釘死的 `tb-mqtt-client==1.13.14`（P4 §2 引 setup.py raw）。一家廠商自己 fork paho 來維護，意思是 paho 出 CVE 時我們等的是 ThingsBoard 的 fork，不是 Eclipse Paho。時鐘 = 7，含 Mosquitto 8。

**合計**：5 + 5 + 3 + 5 = **18**（含 Mosquitto 19），若把時鐘欄獨立計入則更多。對照 P0 的 13（P1 §2 的算法），淨增 **+5～+6**，不是 +3。P4 §1「種類 13 → 16」的比較基礎是偏的。

**依據。** M-02（`00-requirements.md` 列 10）；P4 §2；P1 §2 列 36。

**可不可以修。** 可修，兩條路：(i) 誠實改數字，讓評審用 19 比 13；(ii) 照 P4 §9 自估的 3 人週把 gateway 換成自己的薄 agent，少一個引擎與一個時鐘，但 P4 §1 理由 3「Modbus 是設定檔」就沒了，D-03 退回 P0 的做法。

### longevity-03（重大）：三條版本線的相容矩陣不是我們的

**情境。** 形狀 (c)，我們的雲上一台 server 服務 10 個客戶站點，每站一個 Edge、每片 CM4 一個 gateway。第一次 server minor 升級。

**哪一步會壞。** 事實：server 最新 4.4（2026-09-29），Edge 最新 **4.3.1.6**（2026-10-01），Edge 尚無 4.4（`buy-options.md` 列 24、列 29）。即 Edge 的版本線落後 server，而 Edge ↔ server 是 gRPC 自有協定、Gateway ↔ Edge 是 TB device API。哪個 Edge 版本能接哪個 server 版本、哪個 gateway 版本能接哪個 Edge 版本：**未查證**（文件站被擋，P4 §2 表頭也這麼說）。`02-tradeoffs.md` §1 把「協定設計的難處在第五版」列為 P0 最深的一刀：fleet 升級很慢，2026 年的螢幕可能到 2029 年還在講 v1。P4 沒有逃過這一刀，只是把相容矩陣的制定權交給廠商。在 (c) 形狀，BSL 的「一台 server」讓所有客戶擠在同一台 server 上（見 01），所以 server 升級的爆炸半徑是**全部客戶**，而 Edge 住在客戶的站點，升級要客戶的維護窗。P4 §9 說「Edge 不可單獨換」是對的，但沒推到下一步：Edge 也不能單獨**不升**。

**依據。** N-10（`00-requirements.md` 列 183）、N-18（列 191）；`buy-options.md` 列 24、29、30；`02-tradeoffs.md` 列 11。

**可不可以修。** 可修，代價是 ops：每個 TB release 跑一次三件組的 N-18 相容測試矩陣、所有站點釘同一條線、集中維護窗。這是 P0 §3 第 1 點「版本協商加相容性矩陣」同一筆帳，只是從「自己定」變成「追著廠商定」。P4 §9 的 14.5 人週沒有這一項。

### longevity-04（重大）：N-09 零字

**情境。** 任何形狀。TB server 的 PostgreSQL 磁碟壞掉，從昨晚的備份還原。今天上午 Odoo 的 Manage 按鈕 adopt 了三片新螢幕。

**哪一步會壞。** P4 全文沒有「備份」、「還原」或 N-09。而 P4 §4.2 列出的狀態庫有五個：Odoo PG、TB server PG（登錄、憑證、`rpc`、attributes、`ts_kv`）、每個 Edge 的 PG（`cloud_events`、本地 ts）、每片 CM4 上 gateway 的 sqlite 緩衝、custom connector 的 sqlite。還原 TB PG 到昨晚：三片新螢幕在 TB 上不存在，下一次 CONNECT 因「憑證鏈合法但 server 上沒有同名 device」被拒（P4 §3.3 第 2 點描述的正是這個狀態）。而 P4 §3.3 第 5 點的 revoke 就是「REST 刪除 credentials → 裝置下一次 CONNECT 收到拒絕」。**一次還原與一次 revoke 對裝置是同一個訊號。** `00-requirements.md` 列 100 寫 T3「破壞性動作需正向簽章訊號，never a bare rejection（a rejection is ambiguous: revoked, registry lost, proxy 404）」——這一行就是在描述這個情境，P4 把「registry lost」做成了一個會發生的事。同時 Odoo 認為那三片是 bound（F-33 先寫了 TB、再寫自己），兩邊真相分叉，P4 §8 第 5 點只談了「寫一邊失敗」的雙寫破口，沒談還原造成的回溯。Edge 的 PG 從頭到尾沒出現在任何備份討論裡；N-04 的 staging 中和被放在 runbook（P4 §3.4），而 `00-requirements.md` 列 284 要的是 built-in。

**依據。** N-09（列 182）、N-04（列 177）、§9 列 284、§4.2 列 100；P4 §3.3、§3.4、§4.2、§8 第 5 點。

**可不可以修。** 可修，而且修法會讓方案更好：把 TB 的登錄當成**可由 Odoo 重建的 cache**。F-33 說 Odoo 是 binding authority；裝置憑證是 factory CA 簽的 X.509、CN = 序號（P4 §3.3），所以在 TB 上重建 device 不需要碰裝置。`iot_tb` 加一個 reconcile：Odoo 的 bound 清單 → TB devices/attributes/Edge 指派，啟動時與定期跑。這樣 TB PG 真正不可重建的只剩 `ts_kv`，備份目標變成兩個（Odoo、`ts_kv`），Edge PG 當 cache。RPC in-flight 丟掉落在 F-50 的 `unknown → timeout`。代價約 1～2 人週加一份寫明順序的還原 runbook；staging 中和則是 tenant 的 routing secret 與裝置憑證輪替腳本（P4 §3.4 自己點出的）。P4 應該把這些寫進 §9。

### longevity-05（重大）：退出單位是三件組加整個 fleet

**情境。** 三年後（2029）要換掉 ThingsBoard server。

**哪一步會壞。** P4 §9 估 server 10～13 人週、gateway 3 人週、「Edge 不可單獨換」。但 gateway 只講 TB device API、Edge 只講 TB gRPC；換掉 server 就是**同時**換掉每一片 CM4 上的 gateway 與每個站點的 Edge。code 的部分加起來 13～16 人週可以接受；沒算的是：(i) fleet rollout——每片 2026 年裝的 CM4 都要換 agent，這正是 `02-tradeoffs.md` 列 11 說最慢的事；(ii) 雙軌期——新舊 north 並行、Odoo 的 `iot_tb` 同時對兩個目標；(iii) rule chain（TBEL）、dashboard、device profile alarm rule、tenant profile 配額全部歸零重寫，P4 自己說「TBEL 無處可去」。P4 把 R7 的可逆性寫成「`ts_kv → 窄表` 一條 SQL」，成立的只有資料層；控制面與邊緣的可逆性沒有被估。公平地說，P0 換掉自己的協定也要 fleet rollout，所以這是**對等**，不是 P4 的獨有劣勢；問題在 P4 §9 把它寫得像優勢。

**依據。** `02-tradeoffs.md` 列 11；P4 §9 三年表；M-01（列 9）。

**可不可以修。** 部分可修：把 TB 的使用面限制在「登錄鏡像、shared/client attributes、persistent RPC、`ts_kv`」四件，rule chain 只做 F-31 filter，告警與儀表板留在 Odoo。這把退出成本壓回資料層加 adapter，但也拿掉 P4 §5 說的 F-10 淨增益與 §6 D-02「最漂亮的一個 D」的一半。這是一個要在採用前就做的選擇，P4 沒做。

### longevity-06（重大）：bus factor 與授權再變的風險

**情境。** 任何形狀，2028～2030 年之間的某一次 release。

**哪一步會壞。** 事實：ThingsBoard, Inc. 是單一私人公司，LICENSE 的 Licensor（`buy-options.md` 列 25）；它在 2026-09-29 把 4.4 從 Apache-2.0 改成 BSL 1.1（列 24、27）。BSL 的 Additional Use Grant 是**逐版本**寫在 LICENSE 裡的，每一版可以不同——M-05 自己引的 Timescale §7.2「條款可隨新版發行而改」（`postgres-timeseries.md` 列 32）是同一種結構。EMQX 走過一模一樣的路（Apache → BSL 5.9，`mqtt-brokers.md` 列 49），而 `mqtt-brokers.md` 列 108 對 NanoMQ 的提醒也適用於此：「同一家公司曾改授權」是十年風險評估要放進去的信號。對照其他候選基底的治理：Mosquitto 是 Eclipse 專案（`mqtt-brokers.md` 列 24）、NATS 的商標已轉 Linux Foundation、repo 留 CNCF（`nats.md` 列 39，二手）、Zenoh 是 Eclipse 專案（`zenoh.md` 列 38）；ThingsBoard 沒有任何基金會層。P4 §8 第 3 點的對沖是「Change Date 四年後轉 Apache」。這個對沖的實際內容是：廠商消失或變臉的那一天，我們能 fork 的是**四年前**的版本，是一個 Java 25 加 Spring Boot 的 monolith，而團隊裡 Java 是「不寫」（P4 §2）。fork 在紙上成立，在人力上不成立。再加上先例：Google Cloud IoT Core 一年通知停服（`buy-options.md` 列 63，C1）、Puppet pxp-agent 封存（`precedents.md` 列 100）。

**依據。** M-06（列 14）、M-05（列 13）；上列事實。

**可不可以修。** 不可修——這是「買」的本質。能做的是把 05 的退出計畫寫成每年演練一次的 e2e（N-17），讓退出成本可量、可預算。P4 沒有把這筆錢列進 §9。

### longevity-07（重大）：Edge 是每站每 VLAN 一台第二伺服器

**情境。** 形狀 (b)，一個工廠有兩個 device VLAN（M-04：至少一個 south per device VLAN）。

**哪一步會壞。** P4 §3.1 的 (b) 圖只畫一個 Edge。M-04 與 F-16 要求每個 device VLAN 一個 south，P4 §3.2 第 1 層也寫「每個 device VLAN 一個 Edge」。每個 Edge = 一個 JVM 加一個自己的 PostgreSQL（P4 §2 表、§4.2）。所以兩個 VLAN 的站點是三個 JVM（server + 2 Edge）加三個 PG。十年維運的意思是：這些 Edge 主機要升 JVM、升 PG 大版（PG 18 到 2030-11-14，`postgres-timeseries.md` 列 39，之後每個 Edge 都要做一次 PG major upgrade）、備份（見 04）、看磁碟（`cloud_events` TTL 值未讀、本地 ts 副本大小未查證，P4 §4.3）。P0 的 bridge 是一支 binary 加一個 SQLite 檔（`01-proposal-pcie-tree.md` 列 32），P1 是一個 Mosquitto。P4 §8 第 8 點承認「足跡未查證」，沒承認的是**乘數**：足跡 × VLAN 數 × 十年的升級與備份次數。

**依據。** M-04（列 12）、N-07（列 180）、N-09、錨點 7；P4 §3.1、§3.2、§4.2、§8 第 8 點。

**可不可以修。** 部分可修。(i) Edge 是否能不用 PG（嵌入式 DB）：未查證，是 PoC 題。(ii) 一站一個 Edge、VLAN 間靠防火牆而非 Edge 分隔：與 M-04 的「一個 VLAN 一個 south」衝突，要 owner 明示妥協。(iii) 把 Edge 的 PG 當純 cache、不備份、壞了重灌——這與 04 的修法一致，能砍掉備份這一項，但升級與足跡仍在。

### longevity-08（次要）：M-01——三年後 TB 剩下的理由是什麼

**情境。** 2029，任何形狀。

**哪一步會壞。** P4 買 TB 的理由（§1）是登錄、RPC 狀態機、離線緩衝、15 種 connector、告警、儀表板。十年看：儀表板——錨點 1 說 ERP 是 UI，D-01 的 MES live board 已是 ERP 內容；告警——D-02 的 wish 寫的是「threshold alerts **in ERP**」；connector——我們用 2～3 種；rule engine——F-31 的 filter 我們的 connector 能做。剩下登錄鏡像（Odoo 才是權威）加 persistent RPC 加 MQTT transport：一台 JVM 加 PG 跑一個佇列。M-01 問的正是「原因消失後還值得維護嗎」。這是意見，不是事實；但 P4 沒有問這個問題。

**可不可以修。** 可修：採用前寫下「TB 只被允許用的面」（與 05 的修法相同），並把它寫進 e2e 讓它不會長。代價是放棄 P4 的一半賣點。

### longevity-09（次要）：與 Odoo 共叢集的耦合

**情境。** 形狀 (a)(b)，TB 的 PG database 放在客戶的 ERP 叢集（P4 §2 表「可與 Odoo 同叢集」）。

**哪一步會壞。** 三件未查證的事同時落在客戶的叢集上：(i) TB 每次升級跑自己的 schema 升級腳本，它支援哪些 PG 大版、與 Odoo 19 要求的 PG 版本是否重疊，未查證；(ii) `ts_kv` 的 TTL 清理是 drop partition 還是 DELETE，未查證——若是 DELETE 就是 C-16 的影子；(iii) 規模到 N-15 高端時 `ts_kv` 窄表約 148～236 GB（`postgres-timeseries.md` 列 121 的 W2 估算），`postgres-timeseries.md` 列 111 已指出「獨立 database 只隔離 schema，不隔離 WAL 與備份」，ERP 的 base backup 與還原時間被歷史主導。

**可不可以修。** 可修：TB 用獨立的 PG 實例（同引擎、M-02 不加種類、多一個服務），PoC 時讀 TB 的 TTL 實作確認是 partition drop。

### longevity-10（次要）：備案不是備案

P4 §1 把「留 FIWARE 並升版」列為備案，§8 第 9 點又承認它 AGPL（`buy-options.md` 列 75、80）、Wilma/Keyrock dormant、C-02～C-10 留著、(c) 形狀不成立、違反錨點 9。一個過不了錨點的方案不能叫備案。後果：若 01 在 (a)(b) 成立，P4 在 (a)(b) **沒有** plan B；評審應把 P4 當成只有主案的提案來打分。不可修——這不是設計問題，是 P4 應該把備案拿掉、誠實寫「(a)(b) 另找方案」。

## 2. 此點成立

1. **「M-06 成立，但推論『所以自建』不必然成立；分水嶺是 M-05」**（P4 §1 末段）。這是整份提案最好的一句話，也是對 02-tradeoffs §1「組織那一刀」最誠實的回應。ThingsBoard 三條線同日修補（`buy-options.md` 列 24）確實比 FIWARE 的時鐘清楚（Orion Docker Hub 缺 4.6/4.7 tag，列 77）。
2. **Java、TBEL 誠實算成新種類，Edge 算第二個引擎**（P4 §2）。多數提案不會把「不寫但要讀」的語言算進 M-02；P4 算了。我在 02 的重算是在它的誠實上再加一層，不是推翻它。
3. **拒絕 `DATABASE_TS_TYPE=timescale`**（P4 §5）。`postgres-timeseries.md` 列 29～31 證實 TSL §2.1(b)、§2.2 正是 M-05 描述的義務，P4 沒有為了壓縮率去碰它。
4. **業務真相留在 Odoo、資料層退出是一條 SQL、Grafana 從清單消失**（P4 §4.2、§5、§9）。這三件事讓資料層的可逆性與時鐘數都比現況好；「Odoo 側不受影響」是 P4 保住的最重要的一件事，這句它自己說對了。
5. **Docker Hub 映像改名列為 N-10 的第一步風險，並對照 Orion 缺 tag**（P4 §2、§8 第 4 點）。這是把 M-06 的「vendor activity 要查」落實到升級路徑的具體例子。
6. **「Edge 不可單獨換」**（P4 §9）。它誠實寫出退出單位比一個元件大；我在 03、05 只是把這句推到它該到的地方。
7. **把 TB → Odoo 的事件改成輪詢而不是 webhook，以避開 C-03/C-05 重現**（P4 §4.1）。從十年看，少一條會吞錯誤的推送路徑就是少一種要追的故障模式。

## 3. 如果我是作者，最怕評審問什麼

「ThingsBoard, Inc. 兩週前才把授權從 Apache 改成 BSL；如果它在 2028 年把 Additional Use Grant 再縮一次，或把 Edge 也改成 BSL，你們在客戶站點上的 server 與每個 VLAN 的 Edge 怎麼辦——團隊沒有人會寫 Java，而 Change Date 給你們的是四年前的 code？」
