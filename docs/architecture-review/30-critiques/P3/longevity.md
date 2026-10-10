# P3（NATS 葉節點）批評：十年維運 lens

批評者：波次 B，lens = longevity。日期：2026-10-10。目標：`20-proposals/P3-nats-leaf.md`。事實引用 `10-facts/` 的檔名與列號（nats.md N1～N24、mqtt-brokers.md 列 1～37、postgres-timeseries.md F-1～F-25、buy-options.md T1～G2）；本文件自己新增的第三方事實若無來源一律標「未查證」。「意見」另標。

## 0. 結論先講

**致命 1 條、重大 7 條、次要 3 條。** 一句總評：P3 把 P0「自己的協定」換成「別人的時鐘」——每 5～7 個月一跳、只保最近兩條 series、2026 年 advisory 密集（nats.md N17、N20、N21）——而對這個時鐘的對策只有一句 runbook，沒說誰、用什麼機制把新 binary 送進只有 outbound 的客戶工廠 bridge；在 (b)(c) 加 T1 MQTT 入口時方案不成立。七條重大是同一主題的切面：種類數少算、Python client 線被 3.13 卡住、跨版本 ACL 相容、備份還原只有一句、eMMC 壽命沒進 PoC、M-01 在最小部署失效、可逆性低估。授權、資料不鎖、version 放 payload、不嵌入、不用 JWT 工具鏈，這幾點成立。

## 1. 外部元件時鐘總表（事實，來源見列號）

| 元件 | release 節奏 | LTS | 授權 | 十年含意（意見） |
|---|---|---|---|---|
| nats-server | 約 5～7 個月一個 minor；最新兩條 series 同時出 patch（nats.md N20） | 開源側無；只支援最近兩條 series（N21） | Apache-2.0（N18） | 一條 series 約 10～14 個月後無修補（由 N20×2 推算）；十年約 17～24 個 minor，每個 bridge 都要跟 |
| nats-py | 2.16.0 = 2026-09-16；正拆成 nats-core / nats-jetstream / nats-key-value，後者要求 Python 3.13+，jetstream 0.2.0 有 breaking 變更（N22） | 無 | Apache-2.0（N18） | 舊線 2.x 的維護前景未查證；Object Store 在新套件有無未查證（N22） |
| async-nats | 0.46→0.50 半年四個 minor，仍 0.x（N23） | 無 | Apache-2.0（N18） | 0.x 的每個 minor 都可能破 API |
| natscli（`nats` CLI，P3 §9 備份工具） | 未查證 | 未查證 | 未查證 | P3 沒列進元件表，卻靠它做 N-09 |
| PostgreSQL 18 | 18.6 = 2026-08-11；最後發行 2030-11-14（postgres-timeseries.md F-11） | 5 年 | PostgreSQL License | 共用於所有提案 |
| SQLite | 未查證（P3 亦標） | — | Public Domain | 無慮 |
| Python 3.11（Debian 12，CM4 現況） | 安全支援到 2027-10；Debian 12 LTS 到 2028-06（P6-minimalism.md 列 55，附 PEP 664 與 debian.org 來源） | — | — | 與 N22 的 3.13+ 要求正面相撞 |
| Odoo、Grafana | 02 §1、§4 | — | — | 共用於所有提案，不算 P3 帳 |

## 2. Findings

### longevity-01（致命）nats-server 在客戶站點 bridge 上的升級路徑不存在，而它的時鐘是被 advisory 推著走的

- **情境**：形狀 (b) 或 (c)，有 T1 MQTT 入口的站點（D-03 PLC 閘道、D-06 edge controller）。bridge 是客戶工廠裡一台 CM4 或小主機，只有 outbound。
- **壞在哪一步**：2026-06 那一類「MQTT 注入經 leaf/route 轉發、除升級外無完整 workaround」的 High advisory（nats.md N17）再來一次。P3 §8.1 的對策是「N 天內升級」的 runbook。執行者是誰？P3 的樹管的是 `node` 的設定與命令，不是 nats-server 這個第三方 binary 的安裝；02 §1 把 OTA 列為「以後，也許永遠不會」；§9 的 19 人週沒有一列是 fleet 升級機制。沒有機制，N 天就是「下次有人到站」。再往後：series 只保最近兩條（N21），約 10～14 個月後那台 bridge 就沒有修補，而它開著 8883 對著 hostile T1 VLAN（C-25）。
- **依據**：N17、N20、N21；00 N-10；02 §1；P3 §8.1、§9。nats-server 是否進 Debian / Raspberry Pi OS 套件庫：**未查證**（若無，升級 = 從 GitHub release 拉 binary，簽章驗證方式未查證，N15 只確認附 SBOM）。
- **可不可以修**：可修，但要付 02 不想付的那筆錢：bridge 主機的 binary rollout 走樹（desired register「nats-server = vX」→ `node[bridge]` 拉 binary、驗 SBOM/簽章、重啟、回報 actual），加 health gate 與回滾。意見估 2～3 人週起加每次升級的 ops，且必須在第一個 (b)/(c) 站點上線前就在。還要回答 hub 與 leaf 版本差距多大仍相容（**未查證**），否則 (c) 的雲端 hub 一升級，幾十個客戶的 leaf 同時處於未知相容狀態。

### longevity-02（重大）M-02 的 14 是少算的；誠實重算是 15～16，對 P0 的淨增是 +4～5

- **情境**：所有形狀；這是帳本問題，不是某一步會壞。
- **壞在哪一步**：P3 §2 合計 14，漏算三樣：(1) `nats` CLI（natscli）：§9 末段的 N-09 靠「stream backup/restore」，那是另一個 repo、另一個時鐘（未查證），P3 自己寫「多懂一個備份工具，這也是 M-02 的一部分」卻沒加進表；(2) Python 路線的第二個 Python runtime：nats-py 新套件要 3.13+（N22），CM4 的 Debian 12 是 3.11（P6 列 55），自帶 Python 就是一個 distro 不給的 runtime 時鐘；(3) (c) 的雲端 hub：我們營運十年的多租戶服務，§3.1 (c) 第 5 點承認「要有人營運」卻沒算進任何一欄。ingress 第二個 process「不加種類」照定義成立，但它是第二份 `nats.conf`、第二個 `store_dir`、第二個要升級與備份的單位。
- **依據**：P3 §2、§9 末段；N22；P6-minimalism.md 列 55。
- **可不可以修**：帳可修（15～16，淨增 +4～5），種類數不能修，這是結構代價。評審應以 +4～5 而非 +3 算 R1、R3、R5 要還的帳。

### longevity-03（重大）Python client 線被 Python 3.13 卡住，而 P3 的 DOCS 路徑用到的 Object Store 在新套件裡有無未查證

- **情境**：所有形狀，node 選 Python（P0 §6 第 2 點的預設退路）。D-01 的文件走 Object Store `DOCS` mirror 到 bridge，unit 向 bridge agent 取（P3 §4.1、§6）。
- **壞在哪一步**：nats-py 之後的新功能與修補進 nats-core / nats-jetstream / nats-key-value，後兩者要求 Python 3.13+（N22）；CM4 的 Debian 12 是 3.11（P6 列 55）。第一個只修在新套件的 bug 或 CVE 出現時，我們只能留在 2.x 舊線，舊線是否續維護：未查證。Object Store 在新套件有無：未查證（N22）。所以 D-01「文件沿樹拉」在 Python 路線上建立在一個可能沒有後繼的 API 上。P3 §8.8 承認「被卡在舊線」，但沒決定怎麼辦，代價也沒進 §2 或 §9。
- **依據**：N22、N23；P6 列 55；P3 §8.8。
- **可不可以修**：可修，三選一：(a) node 用 Rust + async-nats，語言 +1，且 async-nats 仍 0.x（N23）；(b) 自帶 Python 3.13，M-02 +1 並自扛 Python 時鐘；(c) DOCS 不走 Object Store，改 bridge agent 的本地 HTTP 快取（P0 §5 做法）。要在 PoC 前選，不能留在弱點清單。

### longevity-04（重大）跨版本相容：P3 的細粒度 subject permission 與 JetStream 的 ack/flow-control subject 變更相撞，而 hub/leaf 版本差距的相容政策未查證

- **情境**：所有形狀；(c) 最嚴重，因為雲端 hub 由我們升級、客戶站點的 leaf 不一定同步。D-01 / D-04 的 job 走 `SQ_<bridge>` 的 pull consumer。
- **壞在哪一步**：P3 §3.3 第 2 步把 adopt 後的 unit 權限限在 `fleet.<pubkey>.>` publish 與 `fleet.<pubkey>.desired.>`、`sq.<pubkey>.>` subscribe。依 JetStream 協定，pull consumer 要對 `$JS.<domain>.API.CONSUMER.MSG.NEXT.>` 發 request、對 `$JS.ACK.>` 發 ack（本文件對協定的理解，**未附來源**）。所以照字面這份權限跑不起來，實作時必補 `$JS.*`。補了就撞上 N9：v2.14 升級指南預告 v2.15 把 ack / flow-control subject 預設改成含 domain 與 account hash 的 v2 格式，「ACL 寫了特定 subject 就必須改」；是否已落地未查證。壞法（意見）：hub 與 leaf 不同版，ack 被 permission 拒絕 → pending 累積到 `max_ack_pending` → 新 job 停止投遞 → ERP 標 `timeout`（F-50），而裝置其實已執行。`job_key` 去重保住 F-51，但命令面停了。
- **依據**：P3 §3.3；nats.md N9；hub/leaf 跨 minor 相容政策：未查證。
- **可不可以修**：可修：(a) 放寬到 `$JS.>` wildcard，圍堵變粗；(b) 每次 nats-server 升級當成我們的一次 release，e2e 跑混版矩陣（hub N+1 / leaf N 與反向）。(b) 正確，但意思是 nats-server 的時鐘從此與我們的 release 綑在一起，每 5～7 個月一次（N20），這筆常態成本 §9 沒有。

### longevity-05（重大）N-09 備份還原只有一句話，而 bridge 上有四個狀態庫，還原後的一致性沒有定義

- **情境**：(b)(c)，一台 bridge 主機的 eMMC 或磁碟壞掉、換機還原。D-02/D-03 的量測、D-04 的 CQ。
- **壞在哪一步**：P3 §9 末段只有一句：「`store_dir` 用 stream backup/restore 或停機複製目錄；unit 的 SQLite 複製檔案」。一台 bridge 上實際有四個狀態庫：leaf `store_dir`、ingress `store_dir`（MQTT session / retained 內部 stream，N10）、registry 鏡像 SQLite、unit SQLite。還原舊備份後：`DESIRED_*`、`REGISTRY`、`DOCS` 是 mirror，會從 root 補齊；但 `CQ_<bridge>`、`MEAS_<bridge>`、`EVT_<bridge>` 是 **origin** stream、以 source 複製到 root，還原等於序號倒退，root 端 source 對已消費序號之前的訊息是跳過還是重送：未查證。P3 §4.1 把 version 放進 payload救了 desired，沒救 CQ/MEAS 的 source 關係。ingress 的 `$MQTT_sess` 還原到舊狀態則是 retained 舊值回來，驗證器不看 `device_ts` 就是 F-04 重現。而 stream restore endpoint 在 2026-03 有 auth bypass advisory（N17）：還原路徑本身是攻擊面。
- **依據**：P3 §9 末段、§4.1；N6、N7、N10、N17；00 N-09（open）、F-04。
- **可不可以修**：可修，且修了反而減種類：把 bridge 的 JetStream 定義為「可重建的快取」，還原 = 乾淨 `store_dir` + mirror 補齊 + 接受「尚未 source 到 root 的那段丟了」（上限就是已明寫的 7 天緩衝與 CQ 90 天），寫 runbook 並以 e2e「bridge 重建」覆蓋；natscli 就不必進 M-02。代價 1 人週，並承認 bridge 不是耐久擁有者——與 F-46 一致，擁有者本來就是 unit SQLite 與 Odoo rows。

### longevity-06（重大）eMMC 十年壽命：`sync_interval: always` 加 MQTT 強制 JetStream，寫入放大沒進 PoC

- **情境**：(b)，D-06 站點：edge controller 以 MQTT 3.1.1 / Sparkplug B 每秒送幾十個 tag 到 ingress；bridge 是 CM4，`store_dir` 在 eMMC。
- **壞在哪一步**：P3 §8.2 把單副本 leaf 的 `sync_interval` 設 `always`（N8：吞吐降到數百 msg/s），自標「對 eMMC 壽命的影響未查證」。但 §9 的 PoC 量的是 RSS、吞吐、callout、三層 leaf，沒有一項是「每天寫多少 bytes」。MQTT 入口強制 JetStream 持久化 session 與 QoS 1 訊息（N10），加 `MEAS_<bridge>` 7 天緩衝、unit SQLite WAL、`$MQTT_*` 內部 stream，每筆都 fsync。十年是這產品的壽命單位，eMMC 的 P/E cycle 不是。這是「標了未查證但 PoC 查不到」的那類。
- **依據**：N8、N10；P3 §8.2、§9；eMMC 壽命數字：未查證（我們的硬體事實）。
- **可不可以修**：可修且便宜：PoC 加「iostat 量寫入 bytes/day 對照 eMMC 規格」；超標則外接 SSD、MQTT 內部 stream 改記憶體（可否設定：未查證）、或 `sync_interval` 回 2 分鐘並明寫與 F-46 的衝突。不修，三到五年後第一批 bridge 的 eMMC 開始壞，longevity-05 的還原就要常跑。

### longevity-07（重大）M-01：在最小部署與純 Modbus 站點，nats-server 的「原因」不存在，它卻全額留下

- **情境**：(a) 一片螢幕（錨點 7、N-13）；以及所有 T1 只講 Modbus 的 (b) 站點（錨點 5：「Modbus RTU/TCP 為主，部分可能講 MQTT」）。D-01、D-03。
- **壞在哪一步**：P3 §1 三個最強理由裡的第二個（MQTT 入口、retained、will、第 N 個消費者、D-06 HMI）在這兩種站點完全用不到：沒有 T1 MQTT 就沒有 ingress，沒有 HMI 就沒有本地訂閱者，MES/Grafana 走 PG。剩下的是 leaf 方向與 KV/stream 零件。對一片螢幕，這等於用一個每 5～7 個月一跳、2026 年兩批 advisory 的外部引擎（N17、N20）把一個 KV key 推給一台裝置，外加一個要備份的 `store_dir`（§5 自承「不是零狀態」）、第三個服務、以及 longevity-01 的升級機制。P3 §7 N-13 列的答案是「未來加感測器與 T1 不改架構」——誠實，但「未來」對很多站點不會來：D-01 是目前唯一已賣出的功能。反向也成立：某站出現 MQTT 5-only T1 時，§7 的解法是在 ingress 前放 Mosquitto，那一刻內建 MQTT listener 的原因消失，它卻還在（兩個 MQTT 實作、兩個 store）。
- **依據**：P3 §1、§5、§7；錨點 4、5、7；00 M-01、N-13。
- **可不可以修**：不可修而不變成別的提案：「無 NATS 的退化模式」就是 P5 的可插拔傳輸，M-02 再 +1。P3 只能承認它是為「有 T1 MQTT 或 D-06 的站點」最佳化的，對一片螢幕是淨負擔。

### longevity-08（重大）可逆性低估：換掉 nats-server 的 6～10 人週只算了 KV/stream 包裝，沒算身分流程、拓樸、文件、入口與第三方消費者

- **情境**：三年後（錨點 6 的時鐘已跳 5～7 次），觸發原因可能是 N19 那類治理事件再發、或 longevity-01 的升級成本不可承受。所有形狀。
- **壞在哪一步**：P3 §9 表第一列：「若第一天就把 KV/stream 操作包在薄介面，降到 4～6」。薄介面包不住的 NATS 專屬物有五樣，都是 §3 的核心：(1) leaf 拓樸與 account 圍堵就是「樹」本身；(2) auth callout 的 bootstrap/adopt/revoke，身分是十年裡最難換的一層，key 已燒在現場裝置上；(3) Object Store `DOCS`；(4) MQTT ingress，T1 的帳密與 topic 對應綁在 nats 使用者模型；(5) **第三方消費者**：§5 明寫 D-06 HMI 與 MES「以 NATS client 連 bridge 的 leaf server」、「在 root 建自己的 durable consumer」，這是客戶或 SI 的 code，換 nats-server 就是通知每個客戶改接法。表裡 Odoo 換 ERP 寫成「只動 adapter」，NATS 的消費者卻沒寫成「要動每個消費者」。
- **依據**：P3 §3、§5、§9；N14；N19。
- **可不可以修**：可部分修。意見估真實代價是「重建 P0 的傳輸層 + 身分層 + 消費者遷移」，12～18 人週起，不含客戶協調。第一天就要做的降法：第 N 個消費者的官方介面是 PG（MES、Grafana）與 MQTT（HMI）而不是 NATS subject——MQTT 恰好是 NATS 與 Mosquitto 都能給的中立介面；裝置身分只依賴 Ed25519 公鑰與 `REGISTRY` 簽章，callout 只是轉接器。這樣 R7 才站得住。

### longevity-09（次要）bus factor 兩端都在，但 P3 沒有寫出「什麼訊號觸發退出」

- **情境**：所有形狀；M-06 推論「廠商活動要定期檢查」。
- **壞在哪一步**：上游：5 位 maintainer、所屬組織未查到、2025 年單一商業公司曾試圖改授權（N19，二手）；同期 EMQX（mqtt-brokers.md 列 18）、ThingsBoard（buy-options.md T2）改 BSL、Mainflux 歸檔改名（buy-options.md M1），這類事件在此生態是常態。我方：JetStream 的 domain/mirror/KV 一致性/callout 知識集中在建它的人手上，P3 §8 承認「不會比 P0 少」。P3 的對策（設定產生器、e2e 斷言、薄介面）是對的，但 M-06 要的是「排進日程的檢查」，P3 沒寫檢查什麼、多久、看到什麼就啟動 longevity-08 的退出。
- **依據**：N19、N21；00 M-06；P3 §8.9。
- **可不可以修**：可修且便宜：runbook 寫三個觸發——「連續兩條 series 沒跟上」、「maintainer 少於 3 位或全屬同一公司」、「CNCF repo 連續 N 個月無 release 而商業 fork 有」——任一成立就啟動退出評估。

### longevity-10（次要）身分流程押在一個未查證的 server 功能上，而身分是十年裡最難換的一層

- **情境**：所有形狀；(b)(c) 的 bridge 間 leaf 連線最先遇到。
- **壞在哪一步**：P3 §3.3 以 auth callout 取代 operator/JWT，理由成立（N14 的 revocation 要推 account JWT、bearer JWT 可重放）。但 callout 是否適用 leafnode 連線、expiry 到時是否斷線、system account 能否踢連線，P3 全標未查證並列為 PoC 第一項。P3 §8.6 的退路是 mTLS `verify_and_map`，而 N13 註明它「取第一個找到的使用者、無法限制」且 2026-03 有 DN 對應繞過 advisory（N17）。若 PoC 的結果是「unit 用 callout、bridge 用 verify_and_map」，就是兩套身分機制要維護十年，且其中一套的語意是文件明寫的弱。
- **依據**：P3 §3.3、§8.6；N13、N14、N17、N24。
- **可不可以修**：可修：PoC 的通過條件要寫成「callout 對 client 與 leafnode 連線皆適用，否則不採 P3」，不要留「退到 verify_and_map」這條路。這點 P3 已排 PoC，本條只要求把退路關掉。

### longevity-11（次要）(c) 形狀的雲端 hub 是一個新的、我們營運十年的多租戶服務，P3 只給了一句「要有人營運」

- **情境**：(c)，多個客戶的 bridge 以 WebSocket 連同一個 hub。
- **壞在哪一步**：每次 advisory 升級 hub = 所有客戶的 leaf 同時斷線重連、mirror 重同步；hub 單機是所有雲端客戶的單點，要 HA 就是 JetStream cluster（RAFT、replicas、N6 (a) 的 domain 限制），一整塊新知識。每新增客戶 = 在共用 hub 的設定檔加一個 account，可否 reload 不重啟：未查證（N24 只確認 leaf `remotes` 可 reload）。§3.1 (c) 第 5 點看到了，§9 沒有一列是它。
- **依據**：P3 §3.1 (c)；N6、N24。
- **可不可以修**：可修：第一版明寫「hub 單機、維護窗口公告、leaf 以 N-11 撐過」，HA 列為 (c) 第二個客戶的觸發；1～2 人週另計。規模小，故次要。

## 3. 此點成立

1. **授權乾淨（M-05）**：nats-server、nats-py、async-nats 皆 Apache-2.0（N18），商標轉 Linux Foundation、repo 留 CNCF（N19，二手）。不綁客戶。
2. **M-02 的計法誠實**：nats-server 同時算引擎與 runtime、「不改 code 也算要顧的東西」寫明、承認「P3 是六個提案裡偏差的一方」。方向對，數字少算（longevity-02）。
3. **不嵌入、不用 operator/JWT 與 `nsc`**：避開 Go 成為第二語言（N16）、避開 bearer JWT 重放與 account JWT 推送（N14）、少一個工具鏈種類；NKey nonce 簽章不依賴裝置時鐘，對 N-14（NTP 回零）是結構性好處。
4. **version 放 payload 而非 KV revision**（§4.1）：三條理由全成立，第一條正是十年視角該問的問題。
5. **長期事實不在 JetStream**：Odoo rows、unit SQLite、PG 是擁有者，JetStream 是緩衝。longevity-08 的退出至少不用搬資料。
6. **MQTT 5 天花板誠實記帳**（N11）：寫明 Mosquitto 是 +1 種。
7. **時序儲存走原生 PG**（postgres-timeseries.md 選項 A）：零新引擎、PG 18 到 2030-11-14（F-11）、避開 `shared_preload_libraries`。

## 4. 如果我是這份提案的作者，最怕評審問什麼

「2029 年某個 High advisory 說除了升級沒有 workaround，你今天的設計裡是誰、用什麼機制、在幾天內，把新的 nats-server binary 送進三十個只有 outbound 的客戶工廠 bridge，而且每一台的 ACL 在混版期間都還能 ack？」
