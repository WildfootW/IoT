# P2 批評：十年維運（longevity）

目標提案：`20-proposals/P2-https-pull-defended.md`（P2）。lens：十年維運（M-01、M-02、M-05、M-06、N-09、N-10、bus factor、升級路徑、可逆性）。日期：2026-10-10。

引用慣例：需求以 ID 引用；第三方事實寫「（`10-facts/檔名` 列號）」，`10-facts/` 內所有列的查證日期為 2026-10-10；我沒有來源的事實標「未查證」；標「意見」的是我的判斷。

## 0. 結論先講

**致命 1 條、重大 8 條、次要 4 條。**

一句總評：P2 在外部元件的時鐘上算得比 P0 誠實，也正確地把憑證與 binding 的真相搬出 Odoo；但它把「時鐘自控」（§2 對 `node` 的描述）當成前提，而整份提案裡**沒有任何一條路可以把新版 node、OS、Python 送到三百台 CM4 上**。沒有升級路徑的自有程式碼在十年尺度不是「時鐘自控」，是「沒有時鐘」：協定第五版、CVE 修補、runtime EOL 全部落不了地。其餘重大問題集中在 PKI 與狀態庫的十年生命週期（24 h 憑證遇上無 RTC 與長假停電；issuer 金鑰保管；trust anchor 輪替不在協定內；兩份真相兩套備份沒有還原規則），以及 M-02 少算了至少三到五個外部時鐘、三個授權「未查證」的元件與「M-05 無妥協」並列。

## 1. Findings

### longevity-01（致命）fleet 沒有升級路徑，「時鐘自控」不成立

- **情境**：形狀 (b) 或 (c)，D-01 幾十片螢幕 + D-02/D-03 感測器，第 3 年。
- **壞在哪一步**：P2 §2 寫 `node` 的維護者「我們；時鐘自控」，§1.1 把 OTA 裁為「成立、不補」，只留一句「Mender 可當 F-34 連接器」。但 node 要升級的理由 P2 自己就列了三個：02 §1 的「第五版問題」（版本協商只讓新舊共存，不讓舊版變新）；node 的 TLS 與串流 library 的 CVE 要重新部署才修得掉；CM4 的 OS 與 Python 十年內至少 EOL 兩次（支援週期未查證，跨兩個 Debian 大版是常識層級判斷）。四個動詞沒有「升級」，§9 人週表沒有 node 自更新或 OS 更新，§2 元件表與 M-02 計數沒有 OTA 元件。第一次要修 node 的 CVE 時，唯一方法是人到現場或逐台 SSH。
- **依據**：N-10、M-06、02 §1 第三段；Mender client Apache-2.0 但 delta update 在付費版（`10-facts/buy-options.md` D1、D2）；Mender 本身也是輪詢 + `Retry-After` 模型（`10-facts/precedents.md` e12、e13）。
- **為什麼是致命**：R4 的全部論證（種類少、時鐘慢、自己的 code 修得快）都以「改得動 fleet 上的 code」為前提。前提不成立時，P2 相對 P1/P3 的最強理由反轉：外部 broker 至少有 apt/docker 的升級路徑，P2 的 node 沒有。
- **可修**：可以，兩條路。(i) 把 node 版本當 register（desired `{version, artifact_pointer, sig}`，actual 回報 applied version，正好是 F-47 的 state intent），bridge 快取 artifact 沿樹拉，裝置做 A/B 與 rollback；貴的是 CM4 的 A/B rootfs 與 bootloader，估 3～5 人週加 e2e，OS/Python 升級另算。(ii) 採 Mender OSS 當 F-34 連接器：+1 runtime、+1 要營運的 server、+1 時鐘，M-02 從 12 變 13～14。兩條都要重算 §2 與 §9；P2 該選一條寫進元件表，不是寫「不補」。

### longevity-02（重大）M-02 少算：標準部署至少 15，D-06 站點至少 18

- **情境**：所有形狀；M-06 的檢查清單照 P2 的 12 項排會漏掉會動的時鐘。
- **壞在哪一步**：§2 的計法「外部 library 以時鐘計一種」只數了 MQTT ingress library。Python node 必然依賴：HTTPS 串流 framework（標準庫沒有生產級 async HTTPS server，常識判斷）、X.509/簽章 library（issuer、24 h 憑證、§3.5 信封；標準庫不能簽憑證）、D-03 的 Modbus library。P6 也把 aiohttp 與 pymodbus 列為嚴格計法的時鐘（`20-proposals/P6-minimalism.md` 第 68 行，提案陳述）。runtime 面：Python 直譯器與 CM4 的 OS 各是一個我們不控制的時鐘，P2 只算成「語言 1」；compose 工件隱含 Docker runtime；Anthias 在元件表內、計數外（longevity-09）。D-06 第三選項 bridge 當 MQTT client，需要 MQTT client library（P5 稱 paho-mqtt 約 29 個月無新版，`20-proposals/P5-pluggable-transport.md` 第 269 行，未另查證）與 protobuf（P2 §6 自標 +1 依賴卻沒計入 13）。
- **重算**（同計法只補漏）：標準 12 + HTTP framework + crypto + Modbus = 15；加 Python 與 OS 時鐘則 17。D-06 站點 13 + 3 + MQTT client + protobuf = 18。P0 的 11 同補法也變 14，所以 P2「+1」的相對差距沒錯，錯的是絕對數與 M-06 清單的完整性。
- **依據**：M-02、M-06 corollary；amqtt 要 Python ≥ 3.10（`10-facts/mqtt-brokers.md` 列 33）、rmqtt 要 Rust ≥ 1.94（列 32）、nats-py 拆分套件要 Python 3.13+（`10-facts/nats.md` N22）：library 把 runtime 時鐘往前拉的三個實例。
- **可修**：便宜：重寫 §2 的表，每個 library 填版本、維護者、授權、最低 runtime，排進 M-06。不改設計，但「種類最少」要改寫成「與 P0 同量級、比 P1/P3 少」。

### longevity-03（重大）24 h 憑證遇上無 RTC 的 CM4 與長假停電

- **情境**：形狀 (a)(b)，台灣工廠農曆年全廠斷電（天數未查證，超過 24 h 是常態）或週末斷電 48 h；D-01、D-02。
- **壞在哪一步**：§3.3 步驟 4 營運憑證 24 h、`report` 時續期；§4.3「無法續期即失效；裝置進 standalone」。斷電 48 h 後全部 T2 憑證過期，復電後以過期憑證撥號，mTLS 握手被拒；P2 沒有「過期未撤銷可在寬限期內續期」的規則，步驟 7 回到 `present, unadopted` 要操作員 Manage。每年每廠至少一次。更前一步：CM4 無 RTC（7A-BOX 是否有 RTC 未查證；N-14 記錄 試點站點 的 NTP 回零時間），開機瞬間時間可能是 epoch，TLS 鏈驗證與 §3.5 的 60 s 重放窗口都依賴正確時間；NTP 在那個站點本來就壞，連 bootstrap 都做不到。`10-facts/nats.md` §4 第 11 點對 JWT 提了同一問題，P2 的 X.509 + 時間戳信封同構卻沒回答。
- **依據**：N-14、N-11（P2 做到「parent 不可達時保持」，但沒定義「回來」）、P2 §3.3、§4.3。
- **可修**：可以。(i) 續期加寬限期：過期 ≤ N 天且不在撤銷清單者可完成握手，server 只對其開放 `report` 與續期；(ii) 或有效期拉到 7～30 天、50% 續期——撤銷本來靠簽名 revoke 與撤銷清單鏡像，不靠短效，代價只是被動撤銷從一天變數天；(iii) announce 回應帶 parent 時間，裝置在 NTP 前以之做鬆弛驗證。合計 1 人週內，要寫進 §3.3、§4.3 與 conformance test，並納入外部審查。

### longevity-04（重大）PKI 十年生命週期：金鑰保管、trust anchor 輪替、演算法敏捷度都不在協定內

- **情境**：所有形狀。bridge 0 磁碟損毀（任一年）；factory CA 要輪替或換演算法（十年內大概一次，意見）；外部審查要求改簽章格式。
- **壞在哪一步**：(a) §3.3 說中繼 CA 私鑰「只存在 bridge 0 的金鑰檔，不在任何 Postgres」並以此宣稱 N-04 內建。但 N-09 要每個狀態庫可還原：私鑰若進備份集，「staging 從 prod 還原」就帶走發行能力，N-04 不成立；若不進，bridge 0 磁碟壞掉等於 issuer 消失，24 h 內全 fleet 過期（與 longevity-03 疊加）。P2 沒選邊，也沒寫保管方式（HSM/TPM/離線/分割）。(b) 出廠 bootstrap 憑證由 factory CA 簽、「長效」。四個動詞沒有「更新 trust anchor」，§3.5 信封沒有演算法識別欄位。factory CA 或中繼 CA 要換代時只能逐台重燒。(c) 外部審查只編一次（§9），但簽章格式、anchor 更新、寬限期規則每改一次都該再審，十年內的重複審查成本不在任何表裡。
- **依據**：N-04、N-09、F-35、F-36；Zenoh 同樣沒有 CRL/OCSP、撤銷只靠短效與不續期（`10-facts/zenoh.md` Z17）——這類系統普遍做了撤銷、漏了 root 輪替。
- **可修**：可以但非零成本。加 `trust_anchors` register（現任金鑰簽新 anchor，cross-sign 接受）、信封加 `alg` 與版本、金鑰保管寫成部署工件（私鑰單獨加密備份、與狀態備份分流、還原 runbook 含測試）。1～2 人週，外部審查範圍擴大，且 §9 要加「年度複審」持續成本。

### longevity-05（重大）N-09：兩份真相、兩套備份、沒有還原對帳；「複製 SQLite 檔」不是備份

- **情境**：形狀 (a)(b)，bridge 0 的 SQLite 從 24 h 前備份還原，ERP 的 Postgres 沒有（或反過來）。
- **壞在哪一步**：§4.2 把 binding、路徑 id、憑證狀態放 bridge 0 的 SQLite，desired 與 SQ 放 ERP；兩者由「複製檔案」與 PG base backup/WAL 分別備份、時間點不同。還原後必然分歧：ERP 認為 X 已 Manage 而 bridge 0 不認得；或 bridge 0 已 revoke 而 Fleet 顯示在線。§7 說「兩份狀態要對帳（F-33 的順序規則處理）」，但 F-33 規範正向寫入順序，不是還原後的收斂方向——誰權威、誰重算、裝置手上的憑證怎麼算。另外 P0 §1 第 6 點「備份 = 複製檔案」被原樣繼承：對正在寫入的 SQLite（尤其 WAL 模式）直接複製可能得到不一致副本，正確做法是 backup API 或 `VACUUM INTO`（SQLite 官方文件，未附 URL，未查證）。
- **依據**：N-09（標 open）、F-33、N-05（還原打破的正是「一個事實一個寫入者」）。
- **可修**：可以。寫還原規則：bridge 0 為憑證與 binding 權威，還原後以裝置重新 announce 出示的憑證序號重建 presence，並經 consumer 的 list 推一輪 binding 全量給 ERP 覆寫 Fleet；ERP 還原則反向重讀。SQLite 備份改為每小時 `VACUUM INTO`。1～2 人週，加一個 N-18 的「還原後收斂」e2e。

### longevity-06（重大）每個節點的 SQLite 寫入負載與儲存媒體壽命沒有設計

- **情境**：形狀 (b)，一個 bridge 下 50 台 T2，每台每 25 s 心跳；十年。
- **壞在哪一步**：§3.4(3) 心跳 25 s，§4.2 presence 的 owner 是「直接 parent 的 SQLite」、actual 的 owner 是 unit 的 SQLite。字面實作就是 unit 每 25 s 一次寫入、bridge 每秒兩次，而 F-46 要求 CQ 與 actual 變更落盤。CM4 跑 eMMC 或 SD 卡；SD 卡在持續小寫入下數年內損壞是 Raspberry Pi 類裝置的常見失效（壽命數字未查證）。P2 沒寫 `PRAGMA synchronous`、WAL、哪些只進記憶體、哪些必須 fsync，也沒把儲存媒體列進部署工件。`10-facts/nats.md` §3.3 對同一塊硬體提了 eMMC 壽命問題（未查證），P2 面對相同問題沒有回答。
- **依據**：F-46、N-07、N-20、P2 §3.4、§4.2。
- **可修**：便宜：presence 與心跳只進記憶體，狀態變化才落盤；actual 只在值變時寫；CQ 與 adopt/revoke fsync；WAL + `synchronous=NORMAL`；部署工件規定工業級 eMMC 或 SD 等級。半人週，但要寫進 conformance test 的寫入量斷言。

### longevity-07（重大）Odoo 年度大版遷移未入帳；三個「未查證」授權與「M-05 無妥協」並列

- **情境**：所有形狀，每年一次。
- **壞在哪一步**：§2 把 Odoo Community、Grafana、Anthias 的授權都寫「未查證」，§7 卻寫「M-05 無妥協：新增元件授權皆為 Public Domain、MIT、Apache-2.0、EPL/EDL」。「新增」讓這句字面為真，但 M-05 問的是綁客戶的授權，綁最多的正是每站的 Odoo、每片螢幕的 Anthias、每個 ops 站的 Grafana。另一面：class driver UI、Fleet、Manage、CMS、SQ 終態保留全留在 `iot_*`（§8 第 7 點承認），Odoo 每年一個大版（02 §1 陳述，未查證；舊版支援年限未查證），十年約十次模組遷移與 C-20 類怪癖重踩。§9 只估「換掉 Odoo 當管理 UI 6～10 人週」，沒估「留著每年付多少」。P2 把憑證與 binding 搬到 bridge 0 是對的，但這讓留在 Odoo 的東西更該被問 M-01：哪些其實是管理服務的邏輯，只因「沒有餘力維護獨立平台」（00 §4.2 歷史）才住在 Odoo？
- **依據**：M-05、M-01、00 §7（Anthias 維護者「未記錄」、Grafana 11.4 出安全支援）、02 §4（Grafana minor 支援 9 個月）、`10-facts/buy-options.md` G1（Odoo 19 引 JSON-2、舊 endpoint 預定 Odoo 22 移除，搜尋摘要：大版帶破壞性變更的現成例子）。
- **可修**：部分。授權查證半天，必須補。年度遷移可壓低不可消：把 class driver 驗證、SQ 的 single-flight 與 deadline 放進 bridge 0（它已持有 SQ 鏡像），Odoo 只剩 UI 與業務表；代價是 F-41「queue owned by the ERP」要改述為「ERP 持有 desired，bridge 0 持有排程」。這是 03-brief §2 允許的妥協，P2 §8 用 N-13 拒絕，但服務數不變，變的只是邏輯歸屬。

### longevity-08（重大）歷史放客戶管的 ERP 叢集：PG 大版升級與「超過門檻再搬」沒有 owner

- **情境**：形狀 (a)(b)，客戶管 Postgres；D-02/D-03 站點，第 2～4 年。
- **壞在哪一步**：§5 選「ERP 既有叢集內獨立 database」，寫了搬到獨立實例的量化觸發。三個問題。(a) PG 18 最後發行 2030-11-14（`10-facts/postgres-timeseries.md` F-11），十年內至少兩次大版升級；客戶管的叢集升級時程由客戶定，writer、roll-up SQL、分區 DDL 要同時相容 fleet 裡所有 PG 大版——P2 自己說 (a)(b) 不能要求客戶改 `shared_preload_libraries`，同理不能要求客戶照我們的時程升版。(b) 觸發有數字沒 owner 沒 playbook：誰量、怎麼在客戶叢集把 148～236 GB（W2 估算，同檔 §3.1，非事實）搬走且不中斷 writer、Grafana 與 MES 的唯讀 role 怎麼切。「超過門檻再搬」把最貴的遷移排在資料最大、客戶最不想動的時候。(c) 歷史的備份隱含在 ERP base backup 裡，而同檔 §3.3 已指出「獨立 database 只隔離 schema，不隔離 WAL 與備份」。
- **依據**：N-09、N-10、F-08、F-15、`10-facts/postgres-timeseries.md` F-11、§3.3、§3.4（≳ 10 億筆/站用獨立實例）。
- **可修**：可以。改成「站點一有 `history` 就用我們管的獨立 PostgreSQL 實例」（同引擎，種類不變，+1 要顧的服務）；ERP 叢集只在最小部署不碰歷史。代價：有感測器的站點多一個 process（錨點 7 反向），MES 跨實例 join 要 `postgres_fdw` 或在 ERP 端拉，P2 §5 選 PG 而非 VM 的那個理由弱一格。

### longevity-09（重大）Anthias：每片螢幕上唯一沒做 M-06 檢查、沒有退場日期的外部元件

- **情境**：任一形狀，D-01 第一個客戶起每一天。
- **壞在哪一步**：§2 列 Anthias「過渡期、外部、不 fork、授權未查證、維護者未記錄」，§9 估換掉 2～4 人週。但「過渡期」沒有結束條件，M-06 的採用前檢查對它沒執行過（00 §7 寫 not recorded，P2 沿用未補），C-18、C-19 仍在。它是唯一裝在每台 unit 上、持有畫面輸出、我們沒有 code 也沒有時鐘資訊的外部 runtime，卻不在 M-02 計數、不在 M-06 排程。十年內它任一次 breaking change 或停更，2～4 人週就變成「在客戶上線的幾十片螢幕上換 player」。
- **依據**：M-06、M-02、N-10、00 §7、C-18、C-19、P2 §2、§9。
- **可修**：可以。最低：補 M-06 檢查寫進 §2；定退場觸發（第一個客戶驗收前，或連續 N 個月無 release），把 2～4 人週排進 §9 的「之後」而不是可逆性表；或直接做最薄的自有 display backend，F-61 的 reconcile 介面本來就為此設計。

### longevity-10（次要）MQTT ingress 三候選無一同時滿足 §3.2 的設計與 P2 自己的活著標準

- **情境**：形狀 (b)，第一個講 MQTT 的 T1 出現。
- **壞在哪一步**：§3.2 第 3 點要「每個 T1 一組憑證（client cert 或帳密）」。rumqttd 的 TLS listener 沒有 client-auth 鍵（`10-facts/mqtt-brokers.md` 列 31），Rust + rumqttd 做不到 per-T1 client cert；amqtt 只有 3.1.1、個人帳號、11 個月空窗（列 33）；rmqtt 單一作者、組織未查證、Rust ≥ 1.94（列 32）。研究員的活著標準是「近 6 個月有 release 且至少兩位作者或法人撐腰」（同檔 §3，意見），三者各有一項不過。P2 §8 第 3 點已承認並給退路「自寫最小解析器」。我認為退路才是十年內真正會走的路：解析器面對 hostile T1，CVE 面與 fuzz 是我們的，這與把 ingress 算成「外部時鐘 +1」矛盾——終局是自寫，就該算「node 內 +1 個要 fuzz 的子系統」。
- **依據**：`10-facts/mqtt-brokers.md` 列 30～33、§3.2；P2 §3.2、§8。
- **可修**：可以。把自寫 3.1.1 子集解析器（CONNECT/PUBLISH/PINGREQ/DISCONNECT）寫成計畫，§9 的 1.5～2 人週加 fuzz harness，§2 這一行改成自有子系統。

### longevity-11（次要）「Mosquitto 時鐘最慢」把 bus factor 1 讀成穩定

- **情境**：D-06 站點第三選項。
- **壞在哪一步**：§1 第 3 個最強理由把「8 個月無新 tag、master 仍有 commit」讀成時鐘最慢。事實是近 8 筆 commit 全是 `ralight`、多為 fuzzer 建置修正（`10-facts/mqtt-brokers.md` 列 2），領導人、committer、贊助方未查證（列 3），研究員自己說「值得下一季再查」。2.1.0 起 `acl_file`、`password_file`、`per_listener_settings` deprecated、3.0 移除（列 8），十年內至少一次設定遷移。第三選項還引入 MQTT client library 與 protobuf，§6 的 M-02 欄只寫「+1 runtime」（見 longevity-02）。
- **依據**：`10-facts/mqtt-brokers.md` 列 2、3、8；P2 §1、§6。
- **可修**：可以。理由 3 改寫成「Eclipse 治理與雙授權讓它可 fork，但現況是單一活躍作者；每季複查」；D-06 的 M-02 欄改 +1 runtime +2 時鐘。

### longevity-12（次要）「換傳輸 3～5 人週」低估：HTTP 語意已滲進語意層，fleet 雙棧多年

- **情境**：第 3 年想換 MQTT 或 NATS（§9 可逆性表第一列）。
- **壞在哪一步**：P2 說語意與傳輸是分開的模組，但文件沒有介面定義，且至少五個 HTTP 專有語意被語意層引用：link-down 定義為「串流 TCP/TLS 關閉或兩個 keepalive 週期無心跳」（§3.4(2)）；`If-None-Match`/304 決定是否重送 announce（§3.4(4)）；cursor 過期用 410（§4.3）；herd 用 503 + `Retry-After`；`transport.mode`、`transport.mtls` 是 actual register（§3.4(3)、§3.5）；信封對 HTTP body hash 簽名。換傳輸要為每條重定等價物並過 conformance。更貴的是 2026 年的裝置會講 v1 HTTPS 到退役（02 §1），換傳輸是「雙棧維護數年」——在 longevity-01 沒解決前，這成本沒有上限。
- **依據**：R7、02 §1、P2 §3.4、§3.5、§4.3、§9。
- **可修**：部分。寫出 transport 介面（link 事件、cursor、backpressure、簽章輸入）並讓 conformance 對介面寫；估計改成「3～5 人週 + 雙棧期間每年 X 人週」。

### longevity-13（次要）consumer API 第一天三種投遞編碼，服務兩個自家消費者

- **情境**：所有形狀，第一天。
- **壞在哪一步**：§4.4 說「只實作一種模式（list + watch with cursor）」，同段又列「NDJSON 或 SSE；或帶 cursor 的批次拉取」三種編碼，而第一天的消費者只有 ERP 與 store writer。三種編碼 = 三組 conformance、三組 proxy 行為（SSE 的緩衝問題與 NDJSON 相同，§8 第 2 點承認無文件）、三份十年文件。M-01：SSE 的原因是瀏覽器 HMI，而 D-06 HMI 在 P2 預設不走樹、第二選項才用 bridge 本地 SSE。
- **依據**：M-01、M-02、P2 §4.4、§6。
- **可修**：零成本：第一天只做 NDJSON list + watch 與 cursor 批次（後者是前者退路，同一狀態機）；SSE 等 D-06 第二選項真被要求再加。

## 2. 嚴重度一覽

| 編號 | 嚴重度 | 一句話 | 可修 |
|---|---|---|---|
| longevity-01 | 致命 | 沒有把新 node/OS/Python 送到 fleet 的路，「時鐘自控」不成立 | 可修，+3～5 人週或 +1 元件，重算 §2 與 §9 |
| longevity-02 | 重大 | M-02 少算 3～5 個外部時鐘，標準部署 12 → ≥ 15 | 可修，重寫表 |
| longevity-03 | 重大 | 24 h 憑證 + 無 RTC + 長假停電 = 每年全 fleet 重新 adopt | 可修，寬限期與 parent 時間，< 1 人週 |
| longevity-04 | 重大 | issuer 金鑰保管兩難、trust anchor 與演算法輪替不在協定、審查只編一次 | 可修，1～2 人週 + 年度複審 |
| longevity-05 | 重大 | 兩份真相兩套備份、無還原對帳；複製活 SQLite 不是備份 | 可修，1～2 人週 + e2e |
| longevity-06 | 重大 | 每 25 s 落盤 × 十年，儲存媒體壽命沒設計 | 可修，半人週 |
| longevity-07 | 重大 | Odoo 年度遷移未入帳；三個授權未查證卻稱 M-05 無妥協 | 部分可修 |
| longevity-08 | 重大 | 歷史在客戶管的 PG 叢集：大版升級與搬遷沒有 owner | 可修，獨立實例 |
| longevity-09 | 重大 | Anthias 無 M-06 檢查、無退場日期 | 可修 |
| longevity-10 | 次要 | ingress 三候選無一同時過 §3.2 與活著標準；終局是自寫 | 可修 |
| longevity-11 | 次要 | Mosquitto bus factor 1 被讀成穩定；3.0 設定退場 | 可修 |
| longevity-12 | 次要 | 換傳輸 3～5 人週低估；HTTP 語意滲入；雙棧多年 | 部分可修 |
| longevity-13 | 次要 | consumer 三種編碼服務兩個自家消費者 | 可修 |

## 3. 此點成立：P2 說對了什麼

1. **憑證與 binding 的真相在 bridge 0 的 SQLite，ERP 只是按鈕，批次 revoke 二次確認**（§3.3、§7）。這是對「ERP 遷移 bug 可 revoke 整個 fleet」的結構性回答。longevity-05、-07 要求把這個方向走完，不是反對它。
2. **平白 PostgreSQL、窄表、月分區、drop partition、增量 roll-up、不碰 `pg_cron`/`pg_partman`**（§5）。M-02 與 M-05 上最乾淨，研究員獨立得到同一結論（`10-facts/postgres-timeseries.md` §3.3、§3.4），P2 還補了 P0 漏寫的「增量」（同檔 F-13）。longevity-08 只攻擊放在誰管的叢集。
3. **不以 NATS 或 Zenoh 當基底，避開最快的時鐘**。nats-server 約 5～7 個月一個 minor、只支援最近兩條 series、無開源 LTS（`10-facts/nats.md` N20、N21）；Zenoh 22 個月 11 個 minor、找不到 LTS 或支援期限（`10-facts/zenoh.md` Z4、Z5）。小團隊十年維運選「無聊的傳輸」是對的。
4. **每個 retention window 明寫並帶 drop 計數**（§4.3）。十年維運最怕靜默行為。
5. **對 ingress library 的 bus factor 誠實列出列號並承認**（§1、§8），Mosquitto 只在 D-06 可選位置、不進信任鏈、1 人週可刪。longevity-10、-11 是在這個誠實上再推一步。
6. **形狀 (a)(b) 不要求客戶改 `shared_preload_libraries` 並重啟**（§5）。對客戶管的基礎設施有正確的敬畏；longevity-08 只要求把同樣的敬畏延伸到 PG 大版時程。

## 4. 如果我是 P2 的作者，最怕評審問什麼

「2029 年 node 的 HTTPS library 出了一個 CVE，請指出這份提案的哪一頁、哪一個元件、哪幾個人週，負責把修好的 node 送到三百台已在客戶工廠跑了三年的 CM4 上？」
