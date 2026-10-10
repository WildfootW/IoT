# 提案 P5：語意不變、傳輸可換

代號 P5。日期 2026-10-10。輸入：`00-requirements.md`、`01-proposal-pcie-tree.md`（P0）、`02-tradeoffs.md`、`03-brief.md`、`10-facts/` 全部八份事實查核。

引用慣例：`10-facts/` 的事實寫成「`檔名` 列號」，該目錄所有列的查證日期皆為 2026-10-10；我自己另查的事實附 URL 與查證日期；查不到的標「未查證」。「意見」與「事實」分開標示。需求以 ID 引用。P1、P2、P3 已先寫完，本文與它們重疊之處直接引用，不重述。

## 1. 結論先講：立場、一句話、三個最強理由、兩個最弱點

**立場。** P0 的語意層（register 的 desired/actual、SQ/CQ、announce/config space、一個憑證發行者、bridge 圍堵、平白 Postgres）定成**契約**：一份語言中立、傳輸中立的規格，加一套 conformance test。傳輸降級為 link layer，契約只要求它提供三個 primitive（`dial`、`put`、`watch`）加一個 advisory 事件（`link`），語意保證寫死在契約裡，不寫在任何 binding 裡。出貨兩個 binding：**HTTPS 串流**（預設，所有「跨客戶網路」的 hop 一律用它），**MQTT over Mosquitto**（只用在「parent 是一個已經有 broker 的 bridge」的站內 hop：unit → bridge、T1 → bridge）。NATS 不寫 binding，只確認契約能映射。

**一句話。** 語意層在每個提案裡都得自己寫（`mqtt-semantics.md` §5：AWS/Azure 也是在 MQTT 之上由服務端做版本、key、去重、結果槽），所以真正該決定的不是「用不用 MQTT」，而是「語意和傳輸的縫切在哪」；P5 把縫切在事實顯示傳輸真的不同的地方：站內 hop 與跨客戶網路的 hop。

**三個最強理由。**

1. **縫的位置有事實支撐，不是品味。** 在 (c) 形狀下，只有跑在 HTTPS 上的應用層協定能不靠客戶讓步而存活；MQTT 8883 在只放 443 的網路會死，搬到 WSS 443 後面對的 proxy 問題與 HTTPS 相同（`transport-through-networks.md` §5 結論 1、2，研究員標為意見；事實 T7、T14、T15）。同一份文件 §3.4 指出 MQTT 的價值只出現在站內（T1 ingress、D-06 HMI），不在跨網路。所以「跨網路一律 HTTPS、站內可選 MQTT」不是折衷，是把 M-03「拓樸是部署選擇」延伸到傳輸：**每一條 hop 選自己的 binding**。
2. **MQTT 的「失去感」可以逐項買回，而且只在需要的站點付錢。** `02-tradeoffs.md` §1 列的失去是五項：扇出、retained、last-will、T1 講 MQTT、生態。這五項全部是站內 hop 的事。P5 的 MQTT binding 在裝了 Mosquitto 的 bridge 上**原生**拿回全部五項（§3.2 的 binding 表），而且 unit 的自身 hop、T1 ingress、HMI 扇出都走同一個 broker，不像 P2 要「ingress library + 可選 Mosquitto 消費者」兩條路。代價是那個站點 +2 種類（Mosquitto runtime、MQTT client library 時鐘），其他站點 +0，最小部署仍是兩個服務（N-13）。
3. **契約才是資產，code 不是。** `02-tradeoffs.md` §1「協定是自己的（最深的一刀）」的真正痛點是第五版：2026 年裝的螢幕 2029 年還在講 v1。P5 把版本協商、schema 演進、錯誤詞彙放在契約層，與 binding 無關；conformance suite（02 §3 第 6 項）同時跑在 HTTPS、MQTT 與測試用的 in-memory binding 上，所以**N-16/N-17 要的 fake transport 不是額外成本，是第三個 binding**。先例上，AWS Shadow 同時開 MQTT 與 HTTPS REST（`precedents.md` e01）、Mender 可接 AWS/Azure（e13），模型不綁傳輸這件事在業界成立（研究員意見：e01–e19 的歸納）。

**兩個最弱點。**

1. **兩個 binding 就是兩套圍堵實作、兩套 e2e 矩陣。** HTTPS binding 的圍堵在 node（路徑範圍授權、schema、限速）；MQTT binding 多一層 Mosquitto dynsec ACL（`mqtt-brokers.md` 列 7）。契約規定 node 仍是唯一邊界、broker ACL 只是縱深，但安全審查（02 §3 第 5 項）要付兩份，N-18 的「每種部署形狀都 e2e」要乘上 binding 數。這是 M-02 真正的帳，不是 +2 那個數字。
2. **契約取最小公分母，所以 MQTT 的很多原生能力被刻意不用。** retained 只當快取不當 owner、Will 只當 advisory、QoS 2、shared subscription、Response Topic、Message Expiry 全部不進契約（§3.3）。對我們的情境這些不是損失（§3.3 逐項說明），但它意味著 P5 的 MQTT binding 對一個「MQTT 原生思維」的第三方消費者來說，看起來像一個保守的、每個 topic 都帶版本號的 MQTT；他們習慣的「訂了就等事件」在 D-05 事件型資料上仍需 payload 內的 event_id 去重。另一個誠實話：契約的延遲下限由 HTTPS long-poll 退路（hold ≤ 30 s）決定，不由 MQTT 決定。

### 1.1 核心問題正面回答：這層抽象值不值得它的 M-02 成本

先把成本拆成兩塊，因為它們的價格差一個數量級。

**(A) 介面本身**：三個 primitive、slot/version 模型、契約文件、conformance suite。**邊際成本接近零。** 理由（意見）：P0 的 node 本來就必須把 HTTP code 和 register/SQ/CQ 邏輯分開，否則 N-16（無硬體可跑）與 N-17（CI 內 e2e）做不到；fake transport 就是一個 binding。P0 §6 第 2 點已承諾「協定規格與 conformance test 語言中立」，P5 只是把那句話當真。這一塊沒有「以後可能用到」的問題，因為它今天就在用。

**(B) 第二個生產 binding**：MQTT binding 的 code、Mosquitto 的部署與設定生成、dynsec ACL 生成、第二份安全審查、e2e 矩陣加倍、兩個外部時鐘（Mosquitto、client library）。**這一塊才是 M-02 的帳**，估 3～4 人週起步，之後每個 Mosquitto 升版與 advisory 都要追（§9）。

**值得的情境**（任一成立就值得，因為 Mosquitto 在這些情境下**本來就會出現**，binding 只是讓它多做一件事）：

- T-a：某站點有講 MQTT 的 T1 設備，且需要 broker 語意（離線 queue、retained、Will）而不只是「收 PUBLISH」。P2 的 ingress library 路線在 `mqtt-brokers.md` §3.2 被研究員判定「只適合當 ingress adapter，不適合當安全邊界」，三個候選 library 的 bus factor 都差（列 30、32、33）。一旦要放真 broker，unit 的自身 hop 也走它，省掉 bridge 上第二個 listener。
- T-b：D-06 站點要現場低延遲 HMI 層。P0 沒有答案（02 §1），P1、P2、P3 的答案都是「站點放一個 broker」。既然放了，actual register 從 unit 直接進 broker，HMI 訂閱 retained last value，不需要 P2 那種「node 再 publish 一份」的複製路徑。
- T-c：客戶自帶 broker 並要求裝置接上去。我們的 node 當 client，圍堵仍在 node（§3.2 的規則），這是 P1 做不到的（P1 把管理面也放 MQTT，客戶 broker 不會跑我們的 dynsec）。

**不值得、只是 M-01 包袱的情境**：

- 為「以後可能接 NATS」寫 NATS binding。不寫。`nats.md` §5.1 列出即使用 NATS 仍要自寫的七項，與 P5 的語意層完全重疊；契約能映射到 JetStream KV/stream（§3.2 末段）就夠了，真要接時再付 4～6 人週。
- 在沒有 T-a/T-b/T-c 的站點啟用 MQTT binding。不啟用。那裡的 Mosquitto 是純成本。
- 把 MQTT 用在跨客戶網路的 hop（bridge → 雲端 bridge 0）。不用。T15 的 Azure 原話是「許多企業防火牆擋 8883」，WSS 443 又回到 HTTPS 的 proxy 問題（T7、T13、T14）。
- 把管理面（announce、adopt、revoke、憑證）綁在任何 binding 上。不綁。這是 P5 與 P1 的根本差異。

**防止變包袱的規則（寫進 M-01 的執行方式）**：一個 binding 只有在「每次 CI 都跑 conformance suite」且「至少一個站點在生產使用」兩者同時成立時才留在 repo；任一條件失守超過兩個發行週期就刪，刪的時候只刪 binding 目錄，契約與其他 binding 不動。這條規則本身就是對 02 §1「避開廠商鎖定、換來自我鎖定」的回答：我們鎖定的是一份文件，不是一段 code。

**所以對 owner 的問題「我們到底為此得到什麼」**：用 P5 的框架看，P0 放棄 MQTT**失去的全部是站內的東西**，而站內 hop 在 P5 裡可以在需要時用 +2 種類買回全部五項；P0 **得到的**是跨網路 hop 的存活、最小部署兩個服務、以及一個不依賴 broker 的身分與管理面。這兩邊不衝突，前提是縫切對位置。

## 2. 元件清單

「取代掉什麼」對照 `00-requirements.md` §7 庫存表。P5 與 P2 共用的元件只列差異或補充來源。

| 元件 | 自建或外部 | 授權 | 維護者與時鐘（附來源） | 取代掉什麼 |
|---|---|---|---|---|
| **契約規格 + conformance suite**：slot/version 模型、三個 primitive、四個語意動詞、版本協商、錯誤詞彙；suite 對任一 binding 執行 | 自建（文件 + 測試） | 自有 | 我們；放在 IoT_e2e repo，不增 repo | P0 §6 第 2 點承諾的「語言中立規格」；NGSI 作為契約的角色 |
| **`node`**：同一份 code 三種角色（unit agent、bridge、bridge 0）。核心 = 語意層（register/SQ/CQ、registry 鏡像、issuer 只在 bridge 0 啟用、T1 驗證器、store writer、roll-up）；`transport/` 目錄下三個 binding：`https`、`mqtt`、`memory`（測試） | 自建 | 自有 | 我們；語言依 P0 §6 第 2 點 PoC（Python 或 Rust） | 現有 gateway、compose 套件 south、IoT Agent JSON、Orion、QuantumLeap、integration hub outbound |
| function backend（display、LED、sensor、Modbus RTU/TCP）；獨立 process、只綁 localhost | 自建 | 自有 | 我們 | 感測服務、LED 控制器 不再暴露網路（修 B-10） |
| Odoo 19 + `iot_*` 模組 | 外部 + 自建 | Odoo 授權：未查證 | Odoo 每年一大版（02 §1 陳述，未另查證） | 不變 |
| PostgreSQL 18（ERP 既有叢集；歷史為同叢集獨立 database，可選） | 外部 | PostgreSQL License | 18.6 = tag `REL_18_6` 2026-08-11；PG 18 最後發行 2030-11-14（`postgres-timeseries.md` F-11） | CrateDB、QuantumLeap、MongoDB ×2 |
| SQLite（node 內嵌） | 外部 library | Public Domain | 版本見 P2 §2 同列（https://raw.githubusercontent.com/sqlite/sqlite/master/VERSION ，2026-10-10） | Orion/IOTA 的 Mongo 狀態 |
| **Eclipse Mosquitto**（**只在觸發 T-a/T-b/T-c 的 bridge 主機**；設定與 dynsec 由 node 生成，人不手改） | 外部，不改碼 | EPL-2.0 OR EDL-1.0（`mqtt-brokers.md` 列 1；https://raw.githubusercontent.com/eclipse-mosquitto/mosquitto/master/LICENSE.txt ） | Eclipse 專案；2.1.2 = 2026-02-09，master 最新 commit 2026-10-04，近 8 個月無新 tag，commit 幾乎單一作者（列 2）；`acl_file`/`password_file` 2.1 起 deprecated、預計 3.0 移除（列 8）；2.1.0 新增 `persist-sqlite` plugin（列 9） | 「T1 講 MQTT 要另立 broker」；「D-06 HMI 沒有答案」；P2 的 MQTT ingress library |
| **MQTT client library**（node 的 `mqtt` binding 用；依 node 語言擇一） | 外部 library | Python paho-mqtt：EPL-2.0 OR BSD-3-Clause；Rust rumqttc：Apache-2.0 | paho-mqtt 2.1.0 = 2024-04-29，之後約 29 個月無新版（https://pypi.org/pypi/paho-mqtt/json ，2026-10-10）；rumqttc 0.25.1 = 2025-11-21，仍 0.x（https://crates.io/api/v1/crates/rumqttc ，2026-10-10）；兩者維護者組織未查證 | — |
| Grafana（可選，只給 ops） | 外部 | 未查證 | 12.4.x 支援到 2027-05-24（02 §4） | 不變 |
| Anthias（過渡期 player） | 外部，不 fork | 未查證 | 未記錄（00 §7） | 由 reconcile 介面換掉（F-61） |
| 部署工件 repo（compose、firewall 模板、三種形狀 × 兩種 binding） | 自建 | 自有 | 我們 | compose 套件 |
| IoT_e2e、IoT_Parts | 自建 | 自有 | 我們 | 不變 |

**種類數（M-02）。** 計法沿用 P2：引擎、語言、runtime、repo 各算一種；外部 library 以「時鐘」計一種、不算 runtime。

| 類別 | 標準部署（HTTPS binding only、Python node、含 Grafana） | 最小部署（一片螢幕） | 觸發 T-a/T-b/T-c 的站點（啟用 MQTT binding） |
|---|---|---|---|
| 引擎 | PostgreSQL、SQLite = 2 | 2 | 2 |
| 語言 | Python = 1（node 選 Rust 則 +1） | 1 | 1 |
| runtime | Odoo、node、Grafana = 3 | Odoo、node = 2 | 4（+ Mosquitto） |
| repo | node、ERP 模組、部署工件、e2e、Parts = 5 | 5 | 5 |
| 外部 library 時鐘 | 0 | 0 | 1（MQTT client library） |
| **合計** | **11** | **10** | **13** |

對照：P0 = 11、P2 標準 12 / D-06 站點 13、P1 = 14～15、P3 = 14。P5 標準部署與 P0 相同，MQTT 站點與 P2 的 D-06 站點相同，但同樣的 13 在 P5 裡涵蓋 T1 ingress + unit hop + HMI 扇出三件事。另外兩個不算「種類」但要維護的方言：`mosquitto.conf` 與 dynsec JSON，P5 的規則是只由 node 生成、conformance suite 驗證生成結果，人不直接編輯。

## 3. 拓樸、圍堵、身分

### 3.1 契約：slot 模型與三個 primitive

**slot 模型。** 每個事實是一個五元組 `(path, slot, version, payload, owner)`。`path` 是樹上的路徑 id（adopt 時指派，re-plug 會變，F-19）；`slot` 名稱固定幾類：`cfg`（config space，owner = child）、`actual/<reg>`（owner = child）、`desired/<reg>`（owner = ERP，沿樹鏡像）、`sq/<job_key>`（owner = ERP）、`cq/<job_key>`（owner = child）、`meas/<batch_id>`（owner = child，批次量測）、`rev`（簽過名的撤銷通知，owner = issuer）。`version` 由 owner 單調遞增（N-05 一個事實一個寫入者）。

**三個 primitive 與一個事件**（child 視角；child 永遠是撥出方，F-17、M-04）：

| primitive | 語意保證（契約層，與 binding 無關） | 契約明確**不**保證 |
|---|---|---|
| `dial(parent, identity, versions) → session(path, version)` | 連線由 child 發起；雙方在**應用層**互相驗證（child 用單元私鑰簽 parent 給的 nonce，parent 回簽）；協商協定版本；parent 回 path id | TLS 層身分（mTLS 是縱深，不是前提；理由見 §3.4） |
| `put(slot, version, payload)` | child 擁有的事實上傳。at-least-once；以 `(slot, version)` 冪等；parent 的副本單調不倒退；重複與亂序無害；沒收到確認 = unknown，child 從 SQLite 重送直到 parent 回報的 version ≥ 自己的 | 送達 = 完成（F-46 禁止）；跨 slot 順序 |
| `watch(prefix, since) → stream(slot, version, payload)` | parent 擁有的事實下行。每個 slot **最終拿到最新版**（level-triggered）；可以跳過中間版本；cursor 可續接；cursor 舊於 parent 的保留期則回「需全量重同步」 | 跨 slot 順序；每個中間版本都送到；即時性數字 |
| `link(up / down, t)` | advisory：binding 認為連線建立或斷了 | 任何業務判斷。F-27 的 online/offline 只看 child 自己報的時間；完成只看 CQ |

P0 的四個動詞落在上面：`announce` = `put(cfg)`；`report` = `put(actual/*)` + `put(meas/*)` + 心跳（一個 `actual/heartbeat` slot，payload 帶裝置時間）；`fetch` = `watch(desired/*, sq/*, rev)`；`complete` = `put(cq/<job_key>)`。bridge 對上游是 child：把整個子樹的 slot 以自己的 session、加上子樹 path prefix 重新 `put`（這就是 P0 的「合成 config space」）。

**身分如何透傳。** session 身分 = 單元憑證；一個 session 只能 `put` 自己 path 底下的 slot、只能 `watch` 自己 path 底下的 desired/sq/rev，由 **parent 的 node** 強制，與 binding 無關。bridge 向上 `put` 子樹事實時，上游信任的是 bridge 的身分加「bridge 宣告的子樹」（hop-by-hop，F-17、F-18）。需要端到端不可否認的（T3、D-05、defacement 敏感的 desired），payload 內另帶簽章，契約預留 `sig` 欄位，binding 看不懂也不需要懂。

### 3.2 兩個 binding 怎麼實作 primitive

| primitive | HTTPS binding（預設；所有跨客戶網路 hop 強制） | MQTT binding（只在 parent bridge 主機有 Mosquitto 時；站內 hop） |
|---|---|---|
| `dial` | TLS（有 mTLS 就開）→ `POST /v1/hello {nonce_resp, versions}` → `{path, version, nonce}`；之後開一條串流（chunked response，Tailscale map poll / k8s watch 式，`precedents.md` e17、e18），keepalive 25 s；退路為 hold ≤ 30 s 的 long-poll（路徑 idle 預設 nginx 60 s、ALB 60 s、Cloudflare read 125 s，`transport-through-networks.md` T7、T8、T9） | CONNECT 帶 client cert；Mosquitto `require_certificate` + `use_identity_as_username` 把 CN 當 username（`mqtt-brokers.md` 列 7）；未 adopt 的單元用 bootstrap cert 連入、只拿到 `n/boot/<serial>/#` 的權限；應用層 hello 走 `n/<serial>/hello` 與 `n/<serial>/hello/ack` 兩個 topic，由 bridge node 回應（不是 broker） |
| `put` | `PUT /v1/slots/<path>/<slot>`，body 含 version；204 = parent 版本 ≥；409 = parent 已有更新版（child 不重送） | `PUBLISH` QoS 1、retain=true 到 `n/<path>/<slot>`，version 在 payload；bridge node 訂閱 `n/<path>/#`，套單調規則寫 SQLite；**retained 只是快取**，owner 仍是 child 的 SQLite |
| `watch` | `GET /v1/watch/<path>?since=<cursor>` 串流；cursor 舊於 7 天回 410 → child 全量 `GET /v1/slots/<path>/desired` | `SUBSCRIBE n/<path>/desired/#`、`n/<path>/sq/#`、`n/<path>/rev`；retained 給 late-joiner 最新版（`mqtt-semantics.md` MQ9、MQ16 的語意）；cursor = 每個 slot 的 version；broker 重啟後 bridge node 從 SQLite **回灌** retained（因為 Mosquitto `persistence` 預設 false，MQ10） |
| `link` | 串流關閉 / watchdog（2 × keepalive = 50 s 無資料即判 down；Tailscale 用 120 s，e18） | Will 發到 `n/<path>/link`（keepalive ≤ 30 s，偵測 ≈ 45 s，MQ8、T16）；bridge node 訂閱後轉成 advisory |
| 圍堵實作 | node：session 的 path 範圍檢查、schema、限速、payload 大小 | **兩層**：dynsec ACL 以 `%c`/`%u` 模式限制每個 client 只能寫 `n/<自己的 path>/#`、讀自己的 desired（列 7，2.1.0 起支援）；bridge node 在訂閱側**仍然**做 schema/限速/path 檢查。契約規定 node 是邊界、broker 是縱深 |
| T1 ingress | 不在 HTTPS binding 內；T1 講 Modbus 由 function backend 輪詢 | T1 以 password 或 cert 連同一個 Mosquitto，只能寫 `raw/<t1_id>/#`；bridge node 訂閱 raw、驗證後以 bridge 身分 `put` 成正式 slot。raw 命名空間與 `n/` 命名空間在 ACL 上互不可見 |
| bridge → parent | 永遠 HTTPS（bridge node 是 client） | 不用 Mosquitto bridge（`try_private` 等功能，列 4～6，刻意不用；理由見 §3.3） |

**NATS 的映射（只確認，不實作）**：`put` = JetStream KV `update`（CAS）或 stream publish 帶 `Nats-Msg-Id`；`watch` = KV watch + consumer；`dial` = leaf 或 client 連線 + 應用層 hello；`link` = 連線事件。`nats.md` N6～N8 列的語意陷阱（KV 無 read-your-writes、fsync 2 分鐘、去重視窗 2 分鐘）都在契約的「不保證」範圍內，所以映射成立；但不寫。

### 3.3 哪些 MQTT 原生好處因為抽象而用不到

| MQTT 原生能力 | 在 P5 的 MQTT binding 裡 | 為什麼可以接受（意見，附事實） |
|---|---|---|
| retained 當持久 owner | **不用**；只當 late-joiner 快取 | Mosquitto `persistence` 預設 false、`autosave_interval` 1800 s（MQ10）；`check_retain_source` 預設 true，發布者憑證撤銷後 retained 對新訂閱者消失（MQ9）；Azure 不存 retain、AWS Shadow 是服務端版本化文件（MQ13、MQ15）。owner 放 SQLite 是兩大雲端的做法 |
| Will 當 liveness 判定 | **只當 advisory** | 觸發 = keep alive × 1.5，是設定不是能力（MQ8）；F-27 要求以裝置自己的報告時間判斷；Sparkplug 自己要用 bdSeq 對 Will 與 BIRTH 的競態（MQ21） |
| QoS 2 | **不用**，一律 QoS 1 | 只保證單 hop、單 session；AWS、Azure 都不支援（MQ12、MQ13、MQ24）；去重由 job_key 在裝置做（F-51） |
| shared subscription | **不用** | 我們沒有「多個 worker 搶同一條 queue」的消費者；它明確不保證順序（MQ4、MQ5） |
| Response Topic / Correlation Data | **不用** | SQ/CQ 以 job_key 配對，已是標準欄位的超集；3.1.1 的 T1 也沒有它 |
| Message Expiry | **不用** | deadline 是 ERP 擁有的事實（F-50），過期訊息對發布者沒有通知機制（`mqtt-semantics.md` §4 第 1 項） |
| broker 離線 queue 當命令不丟的保證 | **不依賴**；只設定與監控 | `max_queued_messages` 預設 1000、超過靜默丟（MQ11）；契約的 `put` 重送從 SQLite 來，queue 滿只是延遲不是丟失；但仍要明設並輸出 drop 計數（02 §3 第 3 項） |
| Mosquitto bridge（bridge ↔ bridge 0） | **不用** | 它是三個候選裡文件最完整的 outbound bridge（列 4～6），不用它是真實損失。理由：用了，bridge 0 也要跑 broker（最小部署變三個服務）、跨 VLAN/跨網路的 hop 被 broker 語意接管（圍堵從 node 退到 broker）、bridge 預設 3.1.1 與 QoS 0（MQ16）要逐 topic 調。P5 選擇讓 bridge node 自己當上游的 HTTPS client |
| topic wildcard 給第三方消費者 | **保留**，但只給 read-only dynsec 角色、只在 `actual/*` 與 `meas/*` | 這是「第 N 個消費者不動裝置」真正拿回來的地方（`mqtt-semantics.md` §5 F-49 列） |

### 3.4 三種部署形狀

(a) south/north 同一台主機（bridge 0 = bridge；有 D-06 或 MQTT T1 時才有 Mosquitto）：

```
 [Odoo] <-local queue read- [node: bridge 0]  <-HTTPS stream (unit dials)- [node: unit CM4] -localhost- [display backend]
                                 |  ^
             (optional, T-a/T-b) |  | subscribe n/#, raw/#
                                 v  |
                           [Mosquitto] <-MQTT/TLS 8883 (client cert)- [node: unit (MQTT binding)]
                                 ^
                                 +---- MQTT (password/cert) ---- [T1 device speaking MQTT]   [HMI subscribes read-only]
```

(b) 同站不同 VLAN（每個 device VLAN 一個 bridge；bridge → bridge 0 永遠 HTTPS）：

```
 VLAN-ERP:  [Odoo] <-local- [node: bridge 0] <===== HTTPS stream (bridge dials out) =====+
                                                                                          |
 VLAN-IoT-1: [node: bridge A] ----+-- HTTPS (unit dials) ---- [unit CM4 screens]          |
             +[Mosquitto] (T-a)   +-- MQTT 8883 ------------- [unit CM4 sensor box] ------+ (bridge A is the client upward)
                                  +-- MQTT 1883/8883 -------- [T1 MQTT devices]  (raw/ only)
                                  +-- Modbus TCP 502 (bridge polls) -> [T1 Modbus meters]
 VLAN-IoT-2: [node: bridge B]  (no broker)  <-HTTPS- [unit CM4 screens]
 firewall: IoT VLANs -> bridge host:443/8883 only; bridge -> bridge 0:443 only; nothing inbound
```

(c) 客戶 ERP 在我們的雲端，站點只有 outbound（F-41）：

```
 cloud (ours):  [Odoo tenant] <-local- [node: bridge 0 (per tenant)] <- TLS terminated by our LB
                                                                          ^
                                   customer egress: TLS-inspecting proxy, 443 only
                                                                          |
 site:  [node: site bridge] ======= HTTPS stream, app-layer signed hello (mTLS best-effort) =======+
          |  +[Mosquitto] (only if T-a/T-b)
          +-- HTTPS / MQTT (per hop) -- [units]      +-- raw/ -- [T1 MQTT]      +-- Modbus -- [T1]
```

(c) 的身分：客戶若有 TLS 檢查 proxy，client cert 到不了我們的 LB（T1～T5，全為摘要級證據）；我們自己的 LB 若終結 TLS 也只能以 header 轉述 cert（T5）。所以契約把身分放在 `dial` 的應用層簽章，mTLS 開著就多一層，關了不致命。P2 §3 的結論相同；P5 把它寫進契約而不是寫進某個 binding，這是差別。

### 3.5 hostile T1 怎麼被圍堵

事實基礎：C-25 的現場是共享 PSK、無 client isolation、同 VLAN；WPA2-PSK 下知道 PSK 的人抓到 handshake 就能解密同 SSID 其他 client 的流量（T27，摘要，由金鑰導出方式推得），Wi-Fi 層在威脅模型裡算零。圍堵因此全部在 TLS 層與 node：

1. 每個 device VLAN 至少一個 bridge（M-04），防火牆規則集採 `transport-through-networks.md` §3.2 的 8 條（研究員意見，待審）。
2. T1 **永遠**只接觸 bridge 主機上的兩個入口：bridge node 主動輪詢它（Modbus），或它連進 Mosquitto 的 T1 listener 並只能寫 `raw/<id>/#`。它看不到 `n/` 命名空間，看不到任何 unit。
3. bridge node 訂閱 raw、做 schema（F-31、F-32）、限速（F-01）、時間戳（F-02）、大小檢查後，以 **bridge 自己的身分**向上 `put`。上游永遠不會看到 T1 的憑證或 topic。
4. 在 MQTT binding 站點，Mosquitto 是「T1 可以直接打的第二個 process」。這是 P5 比 P0 多出的攻擊面，對策：Mosquitto 只綁 IoT VLAN 介面、node 以 dynsec 停用任何未註冊 client（列 7：停用即斷線）、Mosquitto 升版列入 M-06 排程。Mosquitto 近兩年公開修過「bridge 收到惡意封包 crash」與「已驗證 client 的惡意 SUBSCRIBE 造成 leak」（列 10），所以「已驗證的 T1 仍可能打 broker」是真實風險，不能只靠 ACL。
5. 契約的 `put` 單調規則讓一個被攻陷的 unit 最多能污染自己 path 底下的 slot，無法寫別人的 desired（它沒有 watch 以外的 desired 權限）、無法偽造 CQ（CQ 的 job_key 由 ERP 發，ERP 只接受自己發過的 key）。

### 3.6 bootstrap → adopt → revoke 與唯一發行者

**唯一發行者 = bridge 0 上的 issuer 模組**（SC §2.2），每個環境一張中繼 CA（N-04），factory CA 是根（F-35）。ERP 是按鈕不是發行者。這與 P0 相同，P5 補的是「每一步在兩個 binding 下長什麼樣」：

| 步驟 | 契約層 | HTTPS binding | MQTT binding |
|---|---|---|---|
| bootstrap | unit 以 factory 簽的 bootstrap 憑證 `dial`，進入 `present, unadopted`；只能 `put(cfg)` | hello 回 path 但 session 範圍只有 cfg | bootstrap CN 對應到 dynsec 的 `boot` role，只能寫 `n/boot/<serial>/cfg`、讀 `n/boot/<serial>/adopt` |
| adopt（F-33：管理中心先寫 binding 再建自己的紀錄） | ERP 按 Manage → bridge 0 issuer 簽營運憑證（短效、心跳續期）→ 以 `desired/credential` slot 沿樹下發（payload 內有 issuer 簽章）→ unit 取回後用新憑證重新 `dial` | 下一次 watch 事件 | retained 到 `n/boot/<serial>/adopt`；unit 重連後進 `n/<path>/#`；node 同時更新 dynsec：新增 client、停用 boot client |
| 續期 | 心跳時 parent 在 `desired/credential` 放新憑證；過期未續 = 拒絕 | 同上 | 同上；Mosquitto 本身不做憑證有效期以外的檢查（未查證 Mosquitto 是否檢查 CRL，本文不依賴） |
| revoke（T2 要能分辨 rejected 與 unknown） | issuer 在 `rev` slot 放簽過名的撤銷通知（裝置據此進入 rejected，而非 unknown）；同時拒絕續期 | watch 送出 `rev`；之後 hello 回 403 | `rev` retained；node 以 dynsec 停用 client（即刻斷線，列 7）。注意 `check_retain_source`（MQ9）：ERP/issuer 憑證輪替後，由它發布的 retained desired 會對新訂閱者消失，node 必須在輪替後**重新回灌** |

## 4. 命令與回報語意

### 4.1 desired/actual 與 job 落在契約上

**state intent（F-47 前半）**：ERP 寫 `desired/<reg>`（version = ERP 單調號），沿樹鏡像到 bridge 的 SQLite，unit 以 `watch` 拿到；unit 套用後 `put(actual/<reg>)`，payload 帶 `applied_version`。`done ⇔ actual.applied_version == desired.version`，在 ERP 端由 reconciler 比對，不由任何 ack 推論（F-46）。重複拿到同一版 desired 不做事（F-54）。unit 可在 actual 放 `refused/deferred` 與理由（F-54 的最終裁量）。

**job（F-47 後半）**：ERP 寫 `sq/<job_key>`（payload 含 deadline）；unit 以 `watch` 拿到，先查本地 CQ 有無該 key（去重，F-51、修 B-08），沒有才執行，結果寫自己的 CQ 再 `put(cq/<job_key>)`（F-52：`put` 回應只代表 parent 收到 CQ 複本，不代表任何東西）。ERP 看到 CQ 複本才把 job 標終態；過 deadline 沒看到 → `timeout`；送出後沒收到 → `unknown`（F-50）。ERP 對同一裝置 single-flight（F-51）。

**每個事實的 owner**：

| 事實 | owner | 誰可寫 | 複本在哪 |
|---|---|---|---|
| desired/*、sq/* | ERP | 只有 ERP（經 bridge 0 的 queue） | bridge 的 SQLite、（MQTT 站點）retained 快取 |
| cfg、actual/*、cq/*、meas/* | unit（或 bridge 代 T1） | 只有該 session | parent 鏈上每一跳的 SQLite、bridge 0 → ERP rows（只有業務事件）/ PG（量測） |
| 憑證、binding、path id | bridge 0 issuer / registry | issuer | ERP 顯示用的鏡像 |
| rev | issuer | issuer | 沿樹 |
| link | binding | binding | 不耐久 |

### 4.2 retention window（全部明寫、全部有監控與 drop 計數）

| window | 預設值（設定項） | 超過時發生什麼 |
|---|---|---|
| desired/* | 只留最新，永久（ERP） | 不適用 |
| sq/* 在 ERP | 到終態或 deadline；deadline 預設 24 h | 變 `timeout`，仍可見（F-49） |
| cq/* 在 unit | max(200 筆, 30 天) | ERP 若在此後才來重讀 → 結果真的丟了，ERP 顯示 `unknown`（這是 02 §1 說的「送達假設改寫成 retention 長度」，P5 不假裝它消失） |
| cq/* 鏡像在 bridge | 90 天 | 同上，多一層保險 |
| meas/* 在 unit（parent 不可達時的緩衝） | 72 h × 設定取樣率 | 丟最舊，drop 計數上行 |
| watch cursor 變更紀錄在 parent | 7 天 | child 收到「全量重同步」 |
| MQTT 站點 broker queue | `max_queued_messages` 明設 5000、`persistent_client_expiration` 7d、`persist-sqlite` 開 | queue 滿只是延遲（`put` 從 SQLite 重送）；但 Mosquitto 超限是靜默的（MQ11），所以 node 以 `$SYS` 計數器做監控（`$SYS` 的細節未查證） |
| 心跳 / offline | 120 s / 5 min（N-15），以裝置報告時間判斷 | `link down` advisory 在 Fleet 顯示為提示，不改 online/offline |

### 4.3 F-46～F-54 逐條

| ID | 判定 | 一句理由 |
|---|---|---|
| F-46 | 成立 | 每個 slot 有 owner 與耐久副本；`put` 不被當完成；漏掉的 CQ 由 ERP 重讀 bridge 鏡像；retention 明寫（§4.2） |
| F-47 | 成立 | desired/actual 與 sq/cq 兩種 slot，沒有第三種 |
| F-48 | 成立（部分依賴部署） | 每跳應用層互驗；desired 可帶 issuer/ERP 簽章；(c) 形狀 mTLS 不可靠（T1～T5）故簽章為必要而非可選 |
| F-49 | 成立 | CQ 複本一律到 ERP；ERP 只存結果列，不存每筆量測（F-30） |
| F-50 | 成立 | ERP 端狀態機；契約沒有任何路徑讓「沒送到」被寫成「沒執行」 |
| F-51 | 成立 | 去重在 unit（CQ by key）、single-flight 與 deadline 在 ERP；順序不由傳輸保證（契約明寫） |
| F-52 | 成立 | `put(cq)` 是結果上傳，與 `watch` 收到 sq 是兩個事件；長工作不卡任何 hop（修 B-07） |
| F-53 | 成立 | CQ status 列舉含 `error/refused`，backend 失敗寫 error（修 B-06） |
| F-54 | 成立 | 同版 desired 重複套用為 no-op；unit 可寫 refused |

B-01～B-09、B-14 的根因（送達當完成、無結果槽、無 key、同步 reconcile、結果無版本）在這個模型下結構上消失，與 P0、P2、P3 的主張相同；P5 沒有在這裡比它們多什麼。

## 5. 回傳資料

**量測怎麼到 store。** sensor backend 在 localhost 給 unit node；unit node 在取樣當下蓋時間戳（F-02），30 s 平均（F-01），寫入 SQLite 的 meas 緩衝，每個批次一個 `batch_id`，以 `put(meas/<batch_id>)` 上傳；bridge 轉 put 到 bridge 0；bridge 0 的 writer 以 `batch_id` 去重後寫 PostgreSQL。沒有資料就是沒有列（F-04），感測器狀態是獨立的 `actual/sensor_status` slot（F-05），warm-up 期間 writer 不寫值。

**store 是什麼。** ERP 同叢集的獨立 database，窄表 `(series_id, ts, value)` + 月分區 + `DROP PARTITION` 做 retention（`postgres-timeseries.md` F-12；研究員判定這是 M-02/M-05 最乾淨的選項，P0 此點成立）。roll-up 是 bridge 0 排程對已關閉的 bucket 做增量 `INSERT ... SELECT`，**不是** materialized view（F-13：全量重算）。觸發「搬到獨立 PG 實例或 TSDB」的門檻採研究員建議：單站歷史超過 ERP database 的 2 倍或樣本數估計超過 10 億（§3.4，意見），writer 做成介面讓這件事只動 bridge 0 一個 adapter。N-15 的量級疑義（W2 vs W3，§4 第 2 點）要 owner 澄清，P5 的 store 選擇在 W1、W2 成立，W3 不成立。

**第 N 個消費者怎麼接。** 三條路，由近到遠：

1. **MQTT 站點的現場消費者（HMI、SCADA）**：dynsec read-only 角色訂閱 `n/<site>/+/actual/#`、`n/<site>/+/meas/#`，LAN 延遲，不經樹上游。這是 02 §1 說的「扇出讓第 N 個消費者接上來不用動裝置」原樣拿回來。
2. **任何站點的服務型消費者（MES、live board 代理）**：bridge 或 bridge 0 的 **consumer API** = `watch` primitive 的 read-only 版本（`GET /v1/watch/<prefix>?since=`），以 scoped token 授權（F-59 的 per-record token 精神）。它和 child 的 watch 是同一段 code，所以 02 §3 第 2 項「bridge 0 的 consumer 概念」在 P5 不是額外長出來的，而是契約的 primitive 之一。
3. **分析型消費者（Grafana、報表）**：直接讀 PG（Grafana 內建 PostgreSQL datasource）。

**F-01～F-15 哪些不成立。** 全部成立，兩點要註明：F-10 的「告警」是 wish，P5 採 P0 做法（門檻當 desired register 推到持有資料的 node 計算，事件上行），Grafana 只畫線；F-13 的 dashboard-as-code 要以 Grafana provisioning 做並防 C-17（重佈署覆蓋手改）。F-15/N-13 成立：一片螢幕沒有 history database、沒有 Grafana、沒有 Mosquitto。

## 6. D-01～D-06 逐一走過

**D-01 螢幕。** `desired/playlist = {version, pointer}`（F-56 只帶指標），unit watch 到後經樹拉文件（消掉 C-24 的直連防火牆規則），display backend 走 reconcile 介面（F-61），完成寫 `actual/playlist.applied_version`（F-38，修 B-14）。最小部署 = Odoo + bridge 0 + 一片螢幕，HTTPS binding，兩個服務（N-13）。MES live board：content 類型是一個穩定 URL，board 頁面每 5 s 向 bridge 的 consumer API 拉 token 保護的 JSON（F-63），不打 ERP。

**D-02 環境感測。** sensor backend 獨立 process（F-07），30 s 平均（F-01），`put(meas)` 批次；Fleet 列出但不可管理（F-26）；HCHO 門檻當 desired register 下發、在 unit 算、越線以 CQ-like 事件上行（F-10 wish）。不需要 MQTT binding。

**D-03 Modbus 旁路感測。** bridge 上一個通用 Modbus RTU/TCP function backend（投資在 instrument class 不在個別感測器），操作員在 bridge 註冊協定、位址、VLAN，bridge 建立 T1 代表並 `put(cfg)`（F-22、§9「誰建代表」）。min/mean/max per interval 由 backend 算。Modbus 設備永遠在 bridge 的輪詢端，不會碰 Mosquitto。

**D-04 LED。** `actual/supported_effects` 進 cfg（F-06，修 B-09），ERP 據此驗證；config/effect/playlist 操作是 job（sq/cq），show 是一個 intent（F-44：時序在 node 本地）；standalone playlist 模式在 parent 不可達時繼續（F-45、N-11）。

**D-05 門禁（管理面在範圍內，控制通道不在）。** 身分/存活/設定走契約：T3 的 hello 帶硬體金鑰簽章，config 以 payload 內簽章端到端驗證，destructive 操作要簽過名的正向訊號（`rev` 的語意）。**刷卡/出勤是事件不是 register**：契約以 `put(cq/<event_id>)` 式的唯一 key 上傳（append-only、去重），這是契約在 D-05 上最沒被測過的用法（弱點 §8）。控制通道（鎖）是另一個 fabric，P5 不建、也不讓任何 binding 的 topic 接近它。

**D-06 機台遙測與低延遲 HMI 層。** 這是 MQTT binding 的首要觸發（T-b）。edge controller 以 Sparkplug B 或原生 MQTT 把 ≤ 1 Hz 遙測發到 bridge 的 Mosquitto `raw/`；bridge node 驗證後 `put(meas)`；HMI 訂閱 broker 上 read-only 的正式 topic（或直接訂 raw，若現場接受未驗證資料），延遲是 LAN 等級。Sparkplug 只當資料面不當命令面（`mqtt-semantics.md` §1 第 5 點：NCMD 是 QoS 0 且強制 Clean Session）。業務層：bridge 0 → ERP/MES 只收事件；分析層：PG + Grafana。D-06 若有致動，屬 Control-Semantic，不在本契約。

## 7. 妥協清單

| 需求 ID | 妥協內容 | 換到什麼 | 代價 |
|---|---|---|---|
| M-02 | 觸發 T-a/T-b/T-c 的站點種類數 11 → 13（Mosquitto runtime、MQTT client library 時鐘） | 該站點拿回扇出、retained 快取、Will advisory、T1 MQTT ingress、生態；unit hop 與 HMI 共用一個 broker | 兩套圍堵實作、兩份安全審查、e2e 矩陣 × 2、Mosquitto 升版時鐘（近 8 個月無 tag，列 2）、paho-mqtt 約 29 個月無新版 |
| M-01 | 允許 repo 內存在一個可能在某些期間沒人用的 binding | 可逆性與 (c) 以外形狀的選擇權 | 用 §1.1 的「CI + 至少一個生產站點，否則刪」規則把包袱設上限 |
| N-02「每一跳 mTLS」 | (c) 形狀的 site → cloud 邊，mTLS 降為 best-effort，身分在應用層簽章 | 不靠客戶 IT 加 bypass 就能上線 | 一份自己維護的簽章格式，要進外部審查；與 P2 相同 |
| 「下行一律 pull」（P0） | 持久連線上的 push（HTTPS 串流；MQTT 本來就是） | 命令延遲不受 poll 週期限制 | 要處理 idle timeout、watchdog、重連 jitter；退路是 ≤ 30 s long-poll |
| F-17「每個節點只認得 parent」 | MQTT binding 站點，unit 連的實體是 Mosquitto，邏輯 parent 是 bridge node | 現成 broker | 信任路徑多一個 process；靠 dynsec + node 二次驗證補 |
| 「每個節點都自建」（P0） | Mosquitto 是外部元件 | 二十年的 broker，不自寫 pub/sub | 外部時鐘、`mosquitto.conf` 與 dynsec 兩個方言（由 node 生成） |
| F-69 單一 write gate | 改成「bridge 0 來讀 ERP queue」的單一 queue（P0 §6 第 1 點） | 全鏈同一方向 | 與 P0 相同，非 P5 新增 |
| F-27 秒級離線 | 不承諾；`link down` 只是 advisory | 契約簡單、兩個 binding 行為一致 | HMI 想要秒級「裝置斷線」提示要看 link advisory 而非 online/offline |
| N-13、F-15 | 無妥協 | 最小部署仍兩個服務、無 history store、無 broker | — |
| M-05 | 無妥協 | 所有新元件授權不綁客戶（Mosquitto EDL 可選，paho EPL/BSD 可選，PG License） | — |

## 8. 已知弱點

1. **兩套圍堵、一套審查預算。** HTTPS binding 的邊界在 node，MQTT binding 多 dynsec。若安全審查只買一份、只審 HTTPS，MQTT 站點的 dynsec 生成器就是未審的安全程式碼。**C-09 會在哪一步重現**：node 生成 `mosquitto.conf` 時若 `allow_anonymous` 未明設為 false、或沿用 2.1 已 deprecated 的 `acl_file`（列 8）在 3.0 升版後失效而退回預設，T1 就能寫任意 topic。對策：conformance suite 含「匿名連線必須被拒、跨 path 寫入必須被拒」兩條硬測試，對生成結果執行。
2. **retained 回灌是 N-11/F-29 的隱藏依賴。** broker 重啟（`persistence` 預設 false，MQ10）後 retained 全失；在 bridge node 回灌前新 adopt 的 unit 訂閱會拿到空的 desired。既有 unit 用 SQLite 的 last-known-good 沒事；新 unit 會等到下一次 ERP 寫 desired。對策：bridge node 啟動即回灌、且 unit 在 `watch` 收到空集合時主動以 HTTPS 退路全量拉一次（兩個 binding 的退路相同，這正是契約的用處）。另一個同類陷阱：`check_retain_source`（MQ9）在 ERP/issuer 憑證輪替後讓既有 retained desired 對新訂閱者消失，寫進 runbook 與 e2e（N-17）。
3. **C-07 的誘惑。** MQTT 的 topic 模型會誘使實作者把所有 CQ 寫到一個 `cq` topic（last-writer-wins，正是 C-07）。契約以 `cq/<job_key>` 強制 per-key；conformance suite 要有「兩個 job 亂序完成、兩個結果都可讀」的測試。
4. **HTTPS 串流穿客戶正向 proxy 是否被緩衝沒有文件**（`transport-through-networks.md` §4 第 5 點）。與 P2 共享這個缺口；P5 的退路一樣是短 hold long-poll，而且契約的延遲下限因此是 ~30 s 而不是毫秒。
5. **client library 的時鐘比 broker 差。** paho-mqtt 2.1.0 之後約 29 個月無新版（PyPI，2026-10-10），rumqttc 仍 0.x（crates.io，2026-10-10）；維護者組織未查證。binding 的 MQTT 面只用 CONNECT/PUBLISH/SUBSCRIBE/Will 四種封包，自寫解析器是可行退路（1～2 人週，§9）。
6. **D-05 事件型資料是契約最弱的用法。** `put` 是 slot 升級模型，事件要靠「每個事件一個唯一 key 的 slot」模擬；量大時（出勤高峰）HTTPS binding 需要批次 put，MQTT binding 需要 retained=false 的變體。契約預留了 `append` 語意但 P5 沒有把它當第四個 primitive 定死，這是刻意的（M-01），也是風險。
7. **只有一個實作者的契約沒有對抗式審查。** 02 §1「協定是自己的」這一刀 P5 沒有消掉，只是把它從「HTTP code」搬到「規格文件 + conformance suite」。suite 是我們寫的，它測不出我們沒想到的事。付錢審查時要把契約文件當主要審查對象，不是 code。
8. **B-02/B-03 在 ERP 側仍要自己修。** 契約給了 `applied_version`，但 ERP 模組若仍接受不帶版本的 OK（B-03）或 dispatch 失敗不改狀態（B-02），這些 bug 不會自己消失；它們在 §9 的 ERP 改造工作裡。
9. **Mosquitto 單一作者、8 個月無 tag**（列 2）是 M-06 要每季複查的訊號；研究員判定不是死亡訊號，P5 同意，但 P5 比 P2 更依賴它（unit hop 也走它）。

C-01～C-25 其餘各條：C-01～C-15 隨 FIWARE 退場消失；C-12 不會重現（身分不是位址，F-21）；C-16、C-17 為 store/Grafana 層，與 P0 相同；C-18、C-19 屬 Anthias，由 reconcile 介面隔離；C-20、C-23 屬 Odoo/integration hub，ERP 改造要尊重；C-24 由「文件走樹」消掉；C-25 是 §3.5 的前提。B-10～B-13 分別由 localhost 綁定、`rev` 語意、契約的 bootstrap 流程、部署工件重寫處理。

## 9. 成本與可逆性

**到第一個客戶價值的人週估計。** 定義同 P2：三到五片螢幕 + 三到五個環境感測器 + 一個同站或雲端 ERP，形狀 (a) 或 (c)，無 D-03、無 D-06，**不啟用 MQTT binding**。假設：一到兩位工程師、AI 輔助、P0 §6 第 2 點語言 PoC 已完成、Odoo 既有模組可改不重寫。

| 工作 | 人週 | 備註 |
|---|---|---|
| 契約文件 + conformance suite 骨架 + `memory` binding | 2 | P0 §6 承諾的東西，P5 把它提前到第一週 |
| node 語意層：slot/version、register/SQ/CQ、registry 鏡像、版本協商 | 5～6 | 三種角色同一份 code |
| `https` binding：hello、串流 + long-poll 退路、watchdog、jitter、consumer API | 3～4 | consumer API 與 child watch 同一段 code |
| PKI 與生命週期：env CA、issuer、bootstrap/adopt/續期/revoke、應用層簽章 | 4～5 | 不含外部審查 |
| ERP 模組改造：queue 讀取路由、Fleet、Manage、CQ 可觀察、applied version（修 B-01～B-06、B-14） | 4～5 | — |
| display/sensor backend 搬到 localhost 協定；文件快取；live board 代理 | 2～3 | — |
| 部署工件：三種形狀 × HTTPS binding + 防火牆模板 + N-07/N-08 | 2～3 | N-01、N-18 |
| e2e：三種形狀、soak、race、conformance 接入 CI | 3 | N-17 |
| **小計** | **25～31** | 中位約 **27** 人週；比 P2 的中位多約 1，差在把契約與 suite 提前並做完整 |
| 外部安全審查（買） | 日曆 3～5 週 + 修補 1～2 人週 | 審契約文件 + PKI 流程 + HTTPS binding |
| **之後：`mqtt` binding**（第一個 T-a/T-b/T-c 站點） | **3～4** | binding code 1.5、Mosquitto 設定與 dynsec 生成器 1、e2e 矩陣加 binding 維度 1、審查增補另計 |
| 之後：store writer + 分區 + 增量 roll-up + Grafana provisioning | 2～3 | 第一個要歷史的站點 |
| 之後：D-05 事件型 put 的批次變體 | 1～2 | 第一個門禁站點 |

這些是意見，沒有先例成本資料可對照（`precedents.md` §3.3 第 8 點）。

**三年後想換掉其中一塊要付多少。**

| 想換掉 | 要動什麼 | 估計 | 理由 |
|---|---|---|---|
| 某站點的 binding（HTTPS ↔ MQTT） | 部署工件與該站點的 Mosquitto；node 不改 | < 1 人週 | 兩個 binding 都在 CI 跑；這是 P5 的設計目標 |
| 整個 HTTPS 串流做法（例如換成 WebSocket 或 HTTP/2 push） | `https` binding 內部；契約不動 | 2～3 人週 | 比 P2 估的 3～5 低，因為 binding 已經被 conformance suite 完整定義過一次 |
| 加 NATS binding | 新 binding + JetStream 設定 + 審查 | 4～6 人週 | 映射已確認（§3.2 末段）；`nats.md` N6～N9 的語意陷阱要逐條對 suite |
| Mosquitto → 另一個 broker（NanoMQ、VerneMQ） | dynsec/ACL 生成器、部署工件 | 1～2 人週 | binding 只用四種封包；但 NanoMQ 的 mTLS/ACL 細節未查證（列 16）、VerneMQ 是 Erlang runtime（列 24） |
| MQTT client library | 換 library 或自寫四種封包的解析器 | 1～2 人週 | 契約不使用進階功能 |
| store（PG → 獨立實例 → VictoriaMetrics） | bridge 0 的 writer adapter、roll-up SQL、Grafana datasource | 1 / 2～3 人週 | 與 P2 相同 |
| Odoo 當管理 UI | class driver UI 與 Fleet 重寫；issuer、binding、consumer 不動 | 6～10 人週 | 真相在 bridge 0 的 SQLite/registry，不在 Odoo |
| 契約本身（放棄 P5） | 保留 PG 歷史、ERP 業務資料、function backend；契約、PKI、兩個 binding 沉沒 | 全額 | 自己的東西可逆性最差；P5 讓沉沒的是「一份文件 + 兩個薄 binding」而不是「一個綁死傳輸的 node」，差別是程度不是性質 |

一句總結：P5 對 owner 問題的回答是**不要在「HTTPS 還是 MQTT」上下注，在「縫切在哪」上下注**。縫切在站內與跨網路之間、切在語意與傳輸之間，代價是每個真的需要 broker 的站點 +2 種類與兩份審查，收益是那些站點拿回 MQTT 的全部五項好處、其他站點什麼都不多付、而三年後任何一條 hop 想換傳輸都只動 binding。這層抽象值得它的成本，**但只值得一次**：第二個 binding 要等觸發，第三個不要寫。
