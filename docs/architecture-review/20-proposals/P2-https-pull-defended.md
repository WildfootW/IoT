# P2：HTTPS pull 樹（P0 的辯護與強化版）

代號 P2。日期 2026-10-10。角色：P0 的辯護律師兼修補者，不是重述者。輸入：`00-requirements.md`、`01-proposal-pcie-tree.md`（P0）、`02-tradeoffs.md`、`03-brief.md`，以及 `10-facts/` 全部八份事實查核。

引用慣例：第三方事實寫成「（檔名 列號；URL；查證日期）」，`10-facts/` 內所有列的查證日期都是 2026-10-10；我自己沒有來源的事實標「未查證」；標「意見」的段落是我的判斷，不是事實。需求以 ID 引用。

## 1. 結論先講：立場、一句話、三個最強理由、兩個最弱點

**立場。** P0 的語意層全部保留：PCIe 管理模型、register（desired/actual）與 SQ/CQ、child 撥出且每跳終結 TLS、bridge 圍堵 hostile T1、一個憑證發行者、平白 Postgres。P2 只動傳輸層的四件事（持久串流取代 long-poll、秒級 link 偵測、thundering herd 與 proxy 對策、(c) 形狀的應用層身分），加兩個小東西（bridge 內建 MQTT ingress adapter；D-06 站點可選的本地 Mosquitto），再補一個 P0 自己在 02 §3 承諾的 consumer 概念。

**一句話。** P0「失去 MQTT」其實是失去四樣可以分開買回的東西：server push、秒級離線偵測、T1 MQTT 入口、第 N 個消費者；前兩樣用 HTTPS 持久串流補回且不增加任何種類，後兩樣各加一個小元件；而 MQTT 真正給不了的（F-46/F-47 的語意、穿客戶 proxy）本來就不是失去。

**三個最強理由。**

1. **(c) 形狀的生存條件。** 在「站點只有 outbound、客戶可能有 TLS 檢查 proxy、只放 443」的網路裡，唯一不需要客戶讓步就能工作的傳輸是「跑在 HTTPS 上的應用層協定」；MQTT 8883 會直接死，搬到 WSS 443 後面對的是同一組 proxy 問題再加 Upgrade 與長連線的額外風險（`transport-through-networks.md` §5 結論 1、2，研究員標為意見；事實基礎 T7、T14、T15）。選 HTTPS 不是品味，是 F-41 的前提。
2. **語意本來就要自己寫，換 broker 不會少寫。** MQTT 原生只給傳輸零件（retained 槽、離線 queue、Will、request/response 欄位、扇出）；F-46/F-47 的核心（版本、job key、去重、結果槽、deadline、簽章）在 AWS Shadow/Jobs 與 Azure twin 都是雲端服務在 MQTT 之上自己做的（`mqtt-semantics.md` §1 第 1 點、§5；MQ13、MQ14、MQ15、MQ23）。P0 要寫的 reconciler 在任何提案裡都要寫；用 broker 只多出 broker 的 retention 設定與靜默丟棄要監控（MQ11：Mosquitto `max_queued_messages` 預設 1000，超過 silently dropped）。
3. **時鐘最慢、種類最少。** P2 標準部署比 P0 只多一個外部 library 的時鐘（MQTT ingress）；可選的 Mosquitto 只出現在 D-06 站點，且是三個候選基底裡時鐘最慢的（Mosquitto 2.1.2 為 2026-02-09、master 到 2026-10-04 仍有 commit，`mqtt-brokers.md` 列 2；對照 nats-server 約每 5～7 個月一個 minor、無開源 LTS、2026 年 MQTT/leafnode advisory 密集，`nats.md` N17、N20、N21；Zenoh 22 個月 11 個 minor、查不到 LTS，`zenoh.md` Z4、Z5）。

**兩個最弱點。**

1. **協定、PKI、consumer 機制全是自己的。** 沒有第二個實作者，沒有社群補 CVE。P2 沒有消掉這一刀，只是把 consumer 鎖在一個模式（list + watch with cursor，k8s 與 Tailscale 的做法，`precedents.md` e17、e18），並要求上線前付錢做一次外部審查（02 §3 第 5 項）。
2. **持久串流穿客戶 proxy 的最大缺口沒有文件。** 客戶端正向 proxy 是否緩衝整個回應，查不到任何文件（`transport-through-networks.md` §4 第 5 點）；P2 的退路（短 hold long-poll）是設計不是實測。另一個弱點：MQTT ingress 三個 library 候選的 bus factor 都差（`mqtt-brokers.md` 列 30、32、33）。

### 1.1 02-tradeoffs.md 的帳單逐條裁決

「成立」表示 P0 真的付了這筆；「部分」表示金額算錯；「未查證」表示 02 的說法沒有事實支持。

| 02 §1 的項目 | 裁決 | 依據 | P2 的處置 |
|---|---|---|---|
| 標準與生態（NGSI、FIWARE-ready 標案） | 成立 | FIWARE 升版也解不掉 C-02～C-10 的命令語意與驗證缺口（`buy-options.md` §3.3）；Orion、IoTA 為 AGPL-3.0（F1、F6） | 不補。對台灣工廠客戶低價值是 02 自己的判斷（意見），P2 同意 |
| MQTT：pub/sub 扇出讓第 N 個消費者不用動裝置 | 成立 | `mqtt-semantics.md` §5 F-49 列：扇出是 MQTT 原生 | consumer API（§4、§5）第一天就做；D-06 站點可選 Mosquitto |
| MQTT：retained message | 部分 | retained 是無版本、無 CAS、單槽、依賴 persistence 設定的快取；Azure 不存 retain、AWS Shadow 是服務端有版本的文件（MQ9、MQ10、MQ13、MQ15） | bridge SQLite 裡的 desired 鏡像就是「有版本的 retained」 |
| MQTT：last-will 讓離線偵測是秒級而非五分鐘 | 部分 | Will 觸發 = keep alive × 1.5（MQ8），是設定不是能力；P0 的 5 分鐘（F-27、N-15）也是設定 | §3.4 的 link-down 事件做到秒級 |
| MQTT：幾乎所有 PLC 閘道和感測器廠商都講 | 未查證 | T1 設備的 MQTT 版本分布沒有事實（`nats.md` §3.5 亦標未查證） | ingress adapter 先收 3.1.1；5.0 看 library |
| MQTT：D-06 現場低延遲 HMI 在 P0 沒有答案 | 成立 | 02 原文 | §6 D-06 給三條路，預設不走樹 |
| 協定是自己的（第五版問題） | 成立 | — | announce 版本協商、相容矩陣、語言中立 conformance（02 §3 第 1、6 項）列為第一天工作 |
| reconnect storm、half-open、proxy idle timeout | 成立，但可量化 | idle 預設 nginx 60 s（T7 原文）、ALB 60 s（T8 摘要）、Cloudflare read 125 s（T9 原文）；hold ≤ 25～30 s 在所有表列預設下都過（研究員意見，§3.3） | §3.4 keepalive 25 s、watchdog、jitter backoff、`Retry-After`、ETag 304 |
| Pull-only：每個 child 一條掛著的連線 | 成立 | 但 MQTT/NATS 也都是長連線，不是 pull 獨有 | 接受 |
| Pull-only：命令延遲受 poll 週期限制 | 成立於 long-poll，不成立於串流 | Tailscale map poll 與 k8s watch 皆為串流（e17、e18） | 改用串流 |
| Pull-only：bridge 重啟後 thundering herd | 成立 | — | §3.4 |
| 樹狀資料路徑、bridge 0 單點 | 成立 | — | 不補。規模小（錨點 4）；D-06 HMI 不走樹 |
| 收斂模型：retention window 之外就是丟 | 成立，MQTT 也一樣 | Mosquitto 離線 queue 1000 則靜默丟、預設不落盤（MQ10、MQ11）；AWS session 預設 1 小時（MQ12 摘要） | §4.3 每個 window 明寫並有 drop 計數 |
| 非狀態事件（刷卡、按鈕）不適合 register | 部分 | 事件是裝置自己的 durable log，走 report 加 cursor，不走 register | §6 D-05 |
| 安全是自己的 | 成立 | — | 外部審查；(c) 形狀的應用層簽章一併審 |
| 資料層失去壓縮、continuous aggregates、retention policy | 成立，且 02 漏算兩項 | 三者都在 TSL（`postgres-timeseries.md` F-3）；漏算：Apache-2 edition 不是中間選項；VictoriaMetrics 在 W2 量級可把磁碟壓一到兩個數量級（§3.1 估算，非事實） | §5 寫出換 store 的量化觸發條件 |
| 組織：制度性知識三年後收帳 | 成立 | — | 不補，只能用文件與 conformance test 攤平 |
| ERP 當 root：一次 ERP 遷移 bug 可 revoke 整個 fleet | 成立 | — | 憑證真相在 bridge 0 的 SQLite，ERP 只是按鈕；批次 revoke 要二次確認（§3.5） |
| 功能廣度：OTA、staged rollout、rules engine | 成立 | OTA 可用 Mender 當 F-34 連接器（client Apache-2.0，`buy-options.md` D1） | 不補 |
| Orion subscription 是通用扇出，第三個消費者出現時 bridge 0 得長出 consumer | 成立 | — | §4.4 consumer 概念第一天就有，即使只有 ERP 與 store 兩個 |

### 1.2 P0 哪些主張經不起 10-facts 的事實

| P0 / 02 的主張 | 事實 | 對 P2 的後果 |
|---|---|---|
| 02 §2：「IoT 業界走 broker 優先，是因為電池供電、8-bit MCU、不能掛連線」 | AWS/Azure 官方文字給的理由是 server push 與離線訊息，不是電池；Azure 明寫 HTTPS 沒有有效率的 server push、輪詢上限每 25 分鐘（`precedents.md` e03、e08，摘要）；電池說法未被證實（同檔 §3.2） | 「插電 Linux 所以不需要 MQTT」只對一半：不需要為省電選 MQTT，但 server push 必須在 HTTP 上自己做。P2 的串流就是這個 |
| 02 §2 把 Puppet/Chef/Tailscale/Balena 併成「pull 式先例」 | Puppet 30 分鐘週期拉取（e19 原文）、Balena 是固定間隔輪詢 + ETag 不是 long-poll（e10 原文）；真正的串流先例是 Tailscale map poll 與 k8s watch（e17、e18 原文） | P0 的 `fetch` 要對照的是後兩者：keep-alive、watchdog、完整 + 增量、斷線續接 |
| P0 §3：「每一跳 mTLS」在 (c) 形狀成立 | TLS 檢查 proxy 無法替 client 完成 mTLS，只能 bypass 或失敗（T1～T3，皆為摘要）；終結 TLS 的 proxy 只能用 header 轉述 client cert（T5 原文） | site→cloud 這一跳的身分要上移到應用層（§3.5）；N-02 在這一跳只在客戶 bypass 時成立 |
| P0 §3：「不用 MQTT（理由：多一種要維護的東西）」 | Mosquitto 是 EPL-2.0 OR EDL-1.0、時鐘最慢（列 1、2）；「多一種」的成本是真的但很小 | P0 給的是最弱的理由。真正的理由是 §1 的第 1、2 點；P2 改以那兩點辯護 |
| P0 §5：「roll-up 用 node 的排程跑純 SQL」 | `REFRESH MATERIALIZED VIEW` 是全量重算（F-13 原文）；歷史與 ERP 同叢集時 WAL、base backup、還原時間被歷史拖著走，W2 窄表約 148～236 GB（§3.1 估算） | 必須明寫「增量 bucket 寫入」；寫出換獨立實例的觸發條件 |
| 02 §1：「穿過客戶 proxy 的 long-poll 不一定活得過一分鐘」 | hold ≤ 25～30 s 在表列所有預設下都過（研究員意見）；真正沒文件的是客戶正向 proxy 的回應緩衝（§4 第 5 點） | 問題從「活不過一分鐘」改寫成「要 PoC 緩衝行為」 |
| 02 §1：「幾乎所有 PLC 閘道和感測器廠商都講 MQTT」 | 未查證 | 不拿它當 ingress adapter 的理由；理由是「T1 若講 MQTT，不要為它另立 broker」 |
| P0 §5：「最小部署 Odoo + bridge 0 + 一片螢幕，兩個服務」 | 無事實反駁 | P0 此點成立，P2 維持 |
| P0 §1：「預設全部走樹，直連只當日後最佳化，消掉 C-24」 | 無事實反駁 | P0 此點成立；但 D-06 HMI 層例外（它不是「我們的資料走直連」，是「機台自己的 HMI 本來就不經過我們」） |

## 2. 元件清單

「取代掉什麼」對照 `00-requirements.md` §7 的庫存表。

| 元件 | 自建或外部 | 授權 | 維護者與時鐘（附來源） | 取代掉什麼 |
|---|---|---|---|---|
| `node`：同一份 code 三種角色（unit agent、per-VLAN/per-site bridge、ERP 旁的 bridge 0）。內含：HTTPS 串流 server 與 client、SQLite 狀態、issuer（只在 bridge 0 啟用）、consumer API、MQTT ingress adapter、store writer、roll-up 排程 | 自建 | 自有 | 我們；時鐘自控。語言 Python 或 Rust，依 P0 §6 第 2 點 PoC 決定 | 現有 gateway、compose 套件的 south、IoT Agent JSON、Orion、QuantumLeap、integration hub 的 outbound transport |
| function backend：display、LED（LED 控制器）、sensor（感測服務）、Modbus RTU/TCP。獨立 process、只綁 localhost | 自建 | 自有 | 我們 | 感測服務、LED 控制器 保留但不再暴露網路（修 B-10） |
| Odoo 19 + `iot_*` 模組（Fleet、Manage、command queue、class driver UI、CMS） | 外部 + 自建 | Odoo Community 授權：未查證（本文件沒有來源） | Odoo 每年一個大版（02 §1 的陳述，未另查證）；模組是我們的 | 不變；integration hub 的 outbound 退場 |
| PostgreSQL 18（ERP 既有叢集；歷史資料為同叢集獨立 database，可選） | 外部 | PostgreSQL License | 18.6 = tag `REL_18_6` 2026-08-11；PG 18 最後發行 2030-11-14（`postgres-timeseries.md` F-11；https://github.com/postgres/postgres 、https://www.postgresql.org/support/versioning/ 後者為摘要） | CrateDB、QuantumLeap、MongoDB 6.0 ×2 |
| SQLite（node 內嵌，每個節點自己的事實） | 外部 library | Public Domain | 3.55.0（https://raw.githubusercontent.com/sqlite/sqlite/master/VERSION 與 LICENSE.md，查證 2026-10-10） | Orion/IOTA 的 Mongo 狀態 |
| MQTT ingress library（依 node 語言擇一；只收 T1 的 PUBLISH，不是 broker） | 外部 library | Python amqtt：MIT；Rust rumqttd：Apache-2.0；Rust rmqtt：MIT OR Apache-2.0 | amqtt 0.12.1 = 2026-09-16，MQTT 3.1.1 only，個人帳號、PyPI owner 兩人、前有 11 個月空窗（`mqtt-brokers.md` 列 33；https://pypi.org/pypi/amqtt/json ）；rumqttd 0.20.0 = 2025-09-29，前有 21 個月無版本（列 30；https://crates.io/api/v1/crates/rumqttd ）；rmqtt 0.24.0 = 2026-09-19，近期 commit 單一作者（列 32；https://github.com/rmqtt/rmqtt/tags ） | 「T1 講 MQTT 時要另立一個 broker」 |
| Mosquitto（**可選**，只在 D-06 站點，當 HMI 層的本地 pub/sub 消費者） | 外部 | EPL-2.0 OR EDL-1.0 | 2.1.2 = 2026-02-09；master 最新 commit 2026-10-04；8 個月無新 tag（列 1、2；https://raw.githubusercontent.com/eclipse-mosquitto/mosquitto/master/ChangeLog.txt ） | 「D-06 HMI 在 P0 沒有答案」 |
| Grafana（可選，只給 ops） | 外部 | 未查證 | 12.4.x 支援到 2027-05-24；minor 支援 9 個月、major 末 minor 15 個月（02 §4；https://endoflife.date/grafana ） | 不變 |
| Anthias（過渡期的螢幕 player） | 外部，不 fork | 未查證 | 未記錄（00 §7） | 由 reconcile 介面換掉（F-61） |
| 部署工件 repo：compose、firewall templates、三種形狀各一組（N-01） | 自建 | 自有 | 我們 | compose 套件 |
| IoT_e2e、IoT_Parts | 自建 | 自有 | 我們 | 不變 |

**種類數（M-02）。** 計法：引擎、語言、runtime、repo 各算一種；外部 library 以「時鐘」計一種，但不算 runtime。

| 類別 | 標準部署（Python node、含 Grafana、含 MQTT ingress library、無 Mosquitto） | 最小部署（一片螢幕） | D-06 站點（加 Mosquitto） |
|---|---|---|---|
| 引擎 | PostgreSQL、SQLite = 2 | 2（SQLite 仍在 node 內） | 2 |
| 語言 | Python = 1（node 若選 Rust 則 +1） | 1 | 1 |
| runtime | Odoo、node、Grafana = 3 | Odoo、node = 2 | 4（+ Mosquitto） |
| repo | node、ERP 模組、部署工件、e2e、Parts = 5 | 5 | 5 |
| 外部 library 時鐘 | MQTT ingress library = 1 | 0（不啟用） | 1 |
| **合計** | **12** | **10** | **13** |

對照 P0：P0 §2 的清單在同一計法下是 11（沒有 MQTT ingress library）。P2 的加法是 +1（標準）或 +2（D-06 站點）。

## 3. 拓樸、圍堵、身分

### 3.1 三種部署形狀

共同規則：所有連線由 child 撥向 parent（F-17、F-21）；每個節點終結自己 children 的 TLS，再以自己的身分向上重新發起；T1 永遠在 bridge 後面，不持有樹的憑證。

**(a) south/north 同一台主機**（C-25 的單一 hypervisor）。bridge 0 同時是這個站點的 bridge（F-25：一個節點可同時是 endpoint 與 bridge）。

```
┌─ 站點主機（hypervisor） ──────────────────────────────────────────────────┐
│  ┌────────────────────┐  本機 socket / loopback   ┌──────────────────────┐ │
│  │ Odoo 19 + iot_* │◄────── bridge 0 讀 queue ─│ bridge 0 (node)      │ │
│  │ PostgreSQL          │        推業務事件 ───────►│  SQLite · issuer CA  │ │
│  │  ├ odoo db          │                           │  consumer API        │ │
│  │  └ history db ◄─────┼── store writer ───────────│  store writer        │ │
│  └────────────────────┘                           └──────────┬───────────┘ │
│                                        :443 mTLS，child 撥入 │             │
└──────────────────────────────────────────────────────────────┼─────────────┘
                              south VLAN（T2/T3）              │
      ┌────────────────────────────┐  ┌─────────────────────────┴──┐
      │ CM4 螢幕：node agent        │  │ CM4 感測：node agent        │   串流（下行）
      │  display backend@localhost │  │  感測服務@localhost          │   report（上行）
      └────────────────────────────┘  └────────────────────────────┘
                              T1 VLAN（default deny）
      ┌──────────────┐  Modbus TCP 502 ◄── bridge 輪詢    ┌────────────────┐
      │ Modbus 電表   │                                     │ MQTT 感測器     │──► bridge:8883 ingress（只進）
      └──────────────┘                                     └────────────────┘
```

**(b) 同站不同 VLAN。** ERP VLAN 放 Odoo 與 bridge 0；每個 device VLAN 一個 bridge（M-04），bridge 向 bridge 0 撥出。

```
 ERP VLAN                                  device VLAN #1                     T1 VLAN #1
┌──────────────────┐   ┌──────────────┐    ┌───────────────────────┐          ┌───────────┐
│ Odoo + PostgreSQL│◄──│ bridge 0     │◄───│ bridge (node)         │◄─ 8883 ──│ MQTT T1   │
│  history db      │   │ issuer CA    │:443│  SQLite 鏡像 desired   │          └───────────┘
└──────────────────┘   │ consumer API │mTLS│  文件快取（N-11）       │─ 502 ──►┌───────────┐
                       └──────────────┘    │  MQTT ingress :8883   │          │ Modbus T1 │
                                           └───────────┬───────────┘          └───────────┘
                                                 :443 mTLS ▲
                                           ┌───────────────┴───────┐
                                           │ T2 units (node agent) │   device VLAN #2 同構，
                                           └───────────────────────┘   另一個 bridge
 防火牆：device VLAN → ERP VLAN 只放 bridge→bridge0:443；T1 VLAN → device VLAN 只放 T1→bridge:8883（若有 MQTT T1）；
         device VLAN → T1 VLAN 只放 bridge→白名單 IP:502；其餘 default deny（規則集見 §3.2）
```

**(c) 客戶 ERP 在我們營運的雲端，站點只有 outbound（F-41）。**

```
 我們的雲端                                       │ internet │           客戶站點（只有 outbound）
┌────────────────────────────┐                   │          │   ┌──────────────────────────────┐
│ Odoo（客戶租戶）+ PostgreSQL│                   │          │   │ 客戶 proxy / 防火牆（可能 TLS 檢查）│
│ bridge 0（該租戶）          │◄── TCP passthrough │          │   └──────────────┬───────────────┘
│  自己終結 TLS；issuer CA    │   (NLB/TCP LB)    │  :443    │        bridge (node) 撥出 :443
│  consumer API · writer     │◄──────────────────┼──────────┼───────┤ 若 mTLS 被 proxy 打斷：
└────────────────────────────┘                   │          │       │ 每個請求帶應用層簽章（§3.5）
                                                 │          │       │ 標記 transport.degraded
                                                             device VLAN / T1 VLAN 同 (b)
```

(c) 的兩個硬規則（意見，依據 T5 原文）：雲端前面若放 HTTP 層 LB，client cert 只會以 header 轉述，信任邊界移到 LB；所以 bridge 0 前面只能是 TCP passthrough，或 bridge 0 直接暴露。N-01 的部署工件把這條寫成檢查項，而不是口頭約定。

### 3.2 hostile T1 怎麼被圍堵

T1 看不到樹，只看到它那個 VLAN 裡的 bridge。圍堵分三層，每層都在 N-01 的部署工件裡有對應物：

1. **網路層**：採 `transport-through-networks.md` §3.2 的 8 條最小規則集（研究員標為待審查的設計，非標準條文）。要點：T1 VLAN 全方向 default deny 並記錄；T1→bridge 只放 bridge 實際開的 port（有 MQTT T1 才開 8883，沒有就不開）；bridge→T1 只放輪詢的協定與白名單 IP（Modbus TCP 502）；T1 之間與 T1↔租戶裝置靠交換器 port isolation 或 Wi-Fi client isolation，且 isolation 是 per-BSS、不能在同一 SSID 上部分隔離（T28 摘要）；bridge 的 north 介面在另一個 VLAN 或網卡，不做 IP forwarding。Wi-Fi 加密在威脅模型裡視為零：共享 PSK 下知道 PSK 的人抓到 4-way handshake 即可解密該 client 流量（T27 摘要），所以 N-02 完全靠 TLS。
2. **process 層**（P0 §4 保留）：node 是唯一持有網路憑證的 process；function backend 只綁 localhost；感測器崩潰只死一個 backend（F-07）。
3. **資料層（bridge 內的守門員）**：T1 代表由操作員在 bridge 宣告協定、位址、功能 class、attribute schema（F-22、F-31、F-32）後由 bridge 建立並 announce（P0 §5）。對 MQTT T1：ingress listener 只綁 T1 VLAN 的介面；每個 T1 一組憑證（client cert 或帳密，由 bridge 本地核發，不是樹的 CA）；topic 必須在註冊時宣告並對應到 function/attribute，未宣告的 topic、未知 client、超過 schema 的 payload 一律拒絕並計數（F-31）；每 client 限速與 payload 大小上限（F-01、F-18）；v1 只接受 CONNECT / PUBLISH（QoS 0/1，回 PUBACK）/ PINGREQ / DISCONNECT，SUBSCRIBE 一律拒絕；retained 位元被忽略（bridge 的 SQLite 才是 last value 的擁有者）。

**plaintext 1883 的誠實說明。** 有些 T1 只會講 1883 明文（這是常識層級的判斷，T1 的能力分布未查證）。在 C-25 的網路裡，同 VLAN 任何人都能偽冒這台 T1 的資料；schema 檢查限制的是傷害範圍，不是來源真偽。P2 的做法：listener 預設只開 8883；要開 1883 必須對該 T1 逐台打開 `plaintext_accepted` 旗標，該旗標是代表的一個屬性，Fleet 與 ERP 都看得到（F-26），資料面帶 `source_authenticated=false`。這是把風險變可見，不是消掉它。

### 3.3 bootstrap → adopt → revoke

單一發行者（SC §2.2）：**bridge 0 是唯一簽發營運憑證的地方**；中間 bridge 只驗證、不簽發；ERP 是按鈕；factory CA 是根（F-35）。每個環境一張中繼 CA（N-04），其私鑰只存在 bridge 0 的金鑰檔，不在任何 Postgres 裡，所以「staging 從 prod 還原」帶不走發行能力（N-04 的內建而非 runbook）。

| 步驟 | 誰做 | 傳輸 | 狀態變化 |
|---|---|---|---|
| 1 出廠 | 製造站（F-36） | — | 燒 bootstrap cert（factory CA 簽，長效，權限只有 announce 與 heartbeat）；貼 QR（序號） |
| 2 開機 | unit 的 node | mDNS/DNS 找 parent（F-23）；撥 :443 mTLS | parent 驗 factory CA → `present, unadopted`；Fleet 可見（F-26）；不綁、不拉 desired |
| 3 Manage | 操作員在 ERP 按；bridge 0 執行 | ERP → bridge 0（本機）；bridge 0 → 沿串流下發 | bridge 0 簽營運 cert（短效，例如 24 h）；路徑 id 在此指派（F-19）；寫 binding 給其他讀者看見後才建 ERP 紀錄（F-33） |
| 4 續期 | unit 在心跳 `report` 時 | 同一條 HTTPS | 剩餘有效期 < 50% 時 parent 回應帶新 cert；bridge 轉發 bridge 0 的簽發結果 |
| 5 撤銷 | 操作員在 ERP；bridge 0 執行 | bridge 0 → 串流下發簽過名的 revoke；同時進撤銷清單鏡像到各 bridge | 拒絕續期 + 簽名 revoke 訊息，裝置能分辨 `rejected` 與 `unknown`（修 B-11）；bridge 斷線；裝置進入 standalone 並標 revoked（N-11） |
| 6 批次撤銷保險 | bridge 0 | — | 一次 revoke 超過 N 台（設定，預設 5）要求第二次確認碼，防 ERP 遷移 bug 掃掉 fleet（02 §1「ERP 當 root」那條） |
| 7 release / factory reset | 平台動作或實體 reset | — | 回到步驟 2；bootstrap cert 在 adopt 後對 T3 失效（管理表 T3 列） |

T1 不在這條線上：T1 的身分是 bridge 指派的 id 與本地憑證，撤銷 = 在 bridge 移除 + 防火牆規則（管理表 T1 列）。

### 3.4 傳輸層的四個修補（不加種類）

這四項全部在 node 的 HTTPS 層，沒有新引擎、新 runtime、新 repo。

**(1) 持久串流取代 long-poll。** `fetch` 改成一個掛著的 HTTP 回應，parent 以 NDJSON frame 往下推 desired register 變更與 SQ entry，第一個 frame 是完整快照（帶 cursor），之後只推增量；child 以 `Last-Cursor` 續接，cursor 過期則 parent 回 410 要 child 重新 list。這是 k8s `list + watch` 與 Tailscale map poll 的做法（`precedents.md` e17、e18 原文）。命令延遲從 poll 週期變成一次 RTT。

**(2) 秒級 link 偵測，分兩級。** `link-down`：parent 看到串流的 TCP/TLS 關閉，或 child 連續兩次沒有在 keepalive 間隔內送出心跳 frame（child 每 25 s 送一個空 `report`，見 (3)），即在 parent 端標記，時間尺度為秒到一分鐘；它是 hop 事件，語意等同 MQTT Will（接收端判定），bridge 彙總後只往上送狀態變化（F-30）。`offline`：以裝置自己報告的時間判定（F-27），門檻可設，P2 預設從 5 分鐘縮到 90 s（心跳 25 s × 3 + 餘裕）。兩級分開是因為 F-27 要求「以裝置報告時間，不以接收時間」，而 link 事件本質上是接收端事件（`mqtt-semantics.md` §3.3 的同一個論點）。

**(3) proxy idle timeout 與 keepalive。** parent 每 20 s 送一個 keepalive frame，child 每 25 s 送一個心跳 `report`；兩者都低於表列最短預設 60 s（T7 原文、T8 摘要）。child 的 watchdog 設 90 s（Tailscale 用 120 s，e18）。N-06 的鏈式對齊寫成規則：child watchdog > parent keepalive × 3；ERP 前面的反向代理 `proxy_read_timeout` 必須明設且 > keepalive × 3（T7）。**退路**：child 若 TCP 活著卻連續 2 個 keepalive 週期沒收到 frame，判定路徑在緩衝回應，自動降級為短 hold（25 s）long-poll，並把 `transport.mode=longpoll-fallback` 當 actual register 回報，Fleet 看得見。這條退路是為 `transport-through-networks.md` §4 第 5 點那個沒有文件的缺口設計的，是否需要要靠 PoC。

**(4) thundering herd。** 重連用帶 jitter 的指數退避（Balena e10、Mosquitto bridge `restart_timeout` base 5 s cap 30 s 都是這樣，列 4）；parent 以 token bucket 限制每秒接受的新串流，超過回 503 + `Retry-After`，child 遵守（Mender client 有同樣的處理，e13）。重連時 child 帶 `If-None-Match: <config-space hash>`，parent 若仍持有該 child 的 config space 就回 304，不重送 announce（Balena 的 ETag 做法，e10）。bridge 自己重啟後 SQLite 裡的 child 狀態完整，所以不會觸發 children 重新 announce，只會重建串流。

### 3.5 (c) 形狀的身分：mTLS 失效時仍安全

事實：TLS 檢查 proxy 無法替 client 完成 mTLS（T1～T3 摘要），終結 TLS 的中介最多以 header 轉述 cert（T5 原文）。所以 site→cloud 這一跳的身分不能只靠 TLS client cert。P2 的做法：bridge 對 bridge 0 的每個請求（串流的開頭、每個 `report`、每個 `complete`）帶一個以 bridge 營運金鑰簽的信封（時間戳、nonce、body hash、cert 序號）；bridge 0 以該 bridge 的公鑰驗，重放窗口 60 s。mTLS 仍預設開啟，成功則加分；握手被 proxy 打斷時，bridge 以純 TLS 連上並只靠簽章，同時把 `transport.mtls=false` 當 actual 回報並在 N-01 的部署文件要求客戶 IT 對我們的 FQDN 設 bypass。

同一個簽章機制也解 F-48：**所有下行 frame（desired、SQ entry、revoke）由 bridge 0 簽名**，T2 也驗（不只 T3），所以偽造意圖需要 bridge 0 的私鑰，而不是攻下任何一個中間 bridge。這比 P0 §1 第 5 點（只 T3 加端到端簽章）嚴格，代價是多一份自己維護的簽章格式，必須納入外部審查。

## 4. 命令與回報語意

### 4.1 register 與 job 落在串流上

**register（state intent）**：ERP 是 desired 的唯一寫入者（N-05），每個 register 有單調遞增的 `version`（Azure twin 的 `$version` 與 AWS Shadow 的 version 都是這樣，MQ14、MQ15）。bridge 0 讀 ERP 的 queue 後把 `{register, version, value, sig}` 寫進自己的 SQLite 鏡像並推下串流；中間 bridge 存鏡像（這就是「有版本的 retained」）；unit 收到後只處理比手上更新的版本，套用是冪等的（F-54）；actual register 由裝置寫、沿 report 往上；`done = actual.version == desired.version`（F-47）。parent 不可達時裝置用手上最後一份（N-11）。

**job（一次性）**：SQ entry `{job_key, target, payload, deadline, issued_at, sig}`；ERP 保持 single-flight per device（F-51）；裝置收到後立刻寫 CQ `{job_key, status=accepted}` 並回 `complete`（送達事件），再非同步執行（修 B-07，F-52）；執行完寫 CQ 終態 `done | refused | error` 加結果（F-53、F-54）；重複的 job_key 直接回既有 CQ 項，不重跑（F-51、修 B-08）。ERP 沒收到終態時不輪詢；ERP 重啟或 consumer cursor 續接時，從 bridge 0 的 CQ 鏡像或直接 `GET /nodes/{id}/cq/{job_key}` 重讀（F-46：靠重讀擁有者，不靠送達）。超過 deadline 無終態 → ERP 記 `timeout`；之後若 CQ 終態到達，附記為 `late result`，不覆蓋 timeout 的事實（F-50）。失敗或逾時的投遞一律 `unknown`，絕不寫「未執行」（F-50，修 B-01）。

### 4.2 每個事實的 owner

| 事實 | owner（可重讀的耐久來源） | 鏡像 / 快取（不是事實） | 寫入者 |
|---|---|---|---|
| desired register | ERP（Odoo Postgres） | bridge 0、各 bridge 的 SQLite | ERP |
| actual register | unit 的 SQLite | bridge、bridge 0 的 SQLite | unit |
| SQ entry（未終態） | ERP | bridge 0、bridge | ERP |
| CQ entry | unit 的 SQLite | bridge、bridge 0 | unit |
| binding、路徑 id、憑證狀態 | bridge 0 的 SQLite | ERP 的 Fleet 紀錄 | bridge 0（ERP 按鈕） |
| presence（link-down/up） | 直接 parent 的 SQLite | 上層彙總 | parent |
| 量測 | 歷史 database（PG） | bridge 的上傳緩衝 | bridge 0 的 writer |
| 事件 log（D-05 刷卡等） | unit 的 SQLite event log | 上層 | unit |
| 文件（playlist） | ERP | bridge 的文件快取 | ERP |

### 4.3 retention window 全部明寫

每一個 window 都是設定值，超過就是可見的 drop 計數器（02 §3 第 3 項）；下表是預設值，不是硬編碼。

| window | 預設 | 超過時 | 誰看得到 |
|---|---|---|---|
| unit CQ 保留 | 最近 500 筆或 14 天 | 更舊的結果不可重讀；ERP 的 `unknown` 無法再補正 | `cq.evicted` 計數在 actual register |
| bridge 上傳緩衝（parent 不可達時的量測與 report） | 48 h 或 256 MB | 丟最舊，`buffer.dropped` 計數 | Fleet 告警 |
| consumer change-log（list + watch 的 cursor 可續接範圍） | 24 h 或 64 MB | consumer 收到 410，必須重新 list | consumer 自己與 ops log |
| ERP 的 SQ 終態保留 | 終態後 30 天（取代今天的 7 天刪除，B-01） | 進審計表（只留摘要） | ERP |
| ERP inbound 持久化（F-67） | 2 天 | 現有行為 | ERP |
| 文件快取（bridge） | 最近 3 個版本 | 舊版本 refuse（F-60） | — |
| 營運憑證有效期 | 24 h | 無法續期即失效；裝置進 standalone | Fleet |
| 應用層簽章重放窗口 | 60 s | 拒絕 | ops log |
| 歷史資料（PG partition） | 3 年，月分區 | drop partition | ops |

### 4.4 consumer 概念（bridge 0 與每個 bridge 都有）

consumer = 一個註冊的讀者，有身分（樹核發的 token 或 cert，可沿樹 revoke）、範圍（子樹、功能 class、事實類別：presence / actual / CQ / 量測 / 事件）、投遞模式（串流 NDJSON 或 SSE；或帶 cursor 的批次拉取）、以及 cursor。第一天就有兩個 consumer：ERP（只收業務事件：binding、上下線變化、CQ 終態、門檻事件；F-03、F-30）與 store writer（量測）。第三個以後（MES、現場 HMI）接法見 §5。這是對 02 §1「重新發明一個比較差的 Orion subscription」的回答：是在重新發明，但只實作一種模式（list + watch with cursor），且 cursor 過期是明確的 410，不是 Orion 的 `maxFailsLimit` 靜默停用（C-05）。

### 4.5 F-46～F-54 逐條對照

| ID | 判定 | 一句理由 |
|---|---|---|
| F-46 | 成立 | 每個事實有 owner 表（§4.2）；漏掉的 CQ 靠重讀；沒有 per-command 輪詢；window 之外的事實確實會丟，但丟是可見的計數（§4.3） |
| F-47 | 成立 | register 以 version 收斂、job 以 key 回顯；兩者在協定層是不同 frame 型別，不能混用 |
| F-48 | 成立 | 下行 frame 由 bridge 0 簽名、T2 以上都驗；每跳 mTLS；(c) 形狀 mTLS 失效時以應用層簽章補（§3.5） |
| F-49 | 成立 | CQ 終態經 consumer 進 ERP；ERP 不再只訂閱 `ledConfig`（B-05） |
| F-50 | 成立 | `unknown` → deadline → `timeout`；late result 附記 |
| F-51 | 成立 | 去重在 unit（key）、single-flight 與 deadline 在 ERP、expiry 由 ERP 的 deadline 定義 |
| F-52 | 成立 | `accepted` 與終態是兩個 CQ 項、兩個 `complete` |
| F-53 | 成立 | CQ 的 `error` 是一等狀態；bridge 轉發 backend 失敗時不得改寫為 done（B-06） |
| F-54 | 成立 | 版本比較加冪等套用；`refused` 是終態之一 |

沒有「不成立」，但要誠實：九條全部成立的前提是 node 的實作與 conformance test 真的把這些寫進去；今天 B-01～B-09 的存在證明「設計上成立」與「跑起來成立」是兩回事（N-17 的「每個正確性里程碑要有 e2e 情境」是這張表的生效條件）。

## 5. 回傳資料

**路徑。** backend（localhost）→ node 以裝置時間戳成批 `report`（F-01、F-02）→ bridge（parent 不可達時進上傳緩衝）→ bridge 0 → store-writer consumer → PostgreSQL。

**store。** ERP 既有叢集內的獨立 database `history`：窄表 `sample(series_id, ts, value)` 按月 declarative partitioning，加 `series(id, unit_id, function, attribute, type, unit, created_at)` 維度表。新 attribute 只是 `series` 多一列，永遠不 ALTER 大表（F-11、F-32）；改名只改維度表（F-14）；retention = drop partition，官方文件明寫比 bulk DELETE 快且免 VACUUM（`postgres-timeseries.md` F-12 原文）；roll-up 由 node（bridge 0 角色）排程對「已關閉的時間 bucket」做增量 `INSERT ... SELECT ... ON CONFLICT`，**不用** materialized view（F-13 原文：全量重算），這是 P0 §5 沒寫清楚的一句。不碰 `pg_partman`/`pg_cron`，避免要求客戶改 `shared_preload_libraries` 並重啟（F-14、F-15；對形狀 (a)(b) 客戶自管 Postgres 重要）。store 有認證（每個 writer 一個 PG role、TLS、client cert 可選；N-03）。告警：門檻規則當 register 推到持有資料的節點計算，事件往上（P0 §5 保留）；Grafana 只畫線。

**量的誠實說明。** `postgres-timeseries.md` §3.1 的估算（非事實）：W1（一台 30 屬性 @30 s）約 5～8 GB，W2（28 億筆）窄表約 148～236 GB，會讓 ERP 的 base backup、WAL、還原時間被歷史主導。P2 的規則：單站 `history` 的 `pg_total_relation_size` 超過 ERP database 的 2 倍，或樣本數估計超過 10 億，就把 `history` 搬到**獨立的 PostgreSQL 實例**（同引擎，M-02 種類數不變，多一個要顧的服務）；若還不夠才考慮 VictoriaMetrics（+1 引擎 +1 查詢語言，OSS 無 LTS、mTLS 與 downsampling 是 Enterprise，F-19、F-21）。writer 做成介面，換 store 只動 bridge 0 的一個 adapter。

**第 N 個消費者怎麼接。**

| 消費者 | 即時 | 歷史 | 動裝置嗎 |
|---|---|---|---|
| ERP | consumer（業務事件） | 不收（F-03） | 否 |
| Grafana | 不接即時 | PG 唯讀 role；dashboards 以 provisioning 檔納入 repo（F-13；C-17 的風險見 §8） | 否 |
| MES | (i) ERP 已有的 token 保護 JSON（D-01 的 live board 型態，~5 s 輪詢）；(ii) 或向 bridge 0 註冊為 consumer，範圍限業務事實 | PG 唯讀 role，可與 Odoo 工單 join（這是選 PG 而非 VM 的一個理由，F-22：VM 無 SQL） | 否 |
| 現場 HMI（D-06） | 見 §6 D-06：機台自己的 HMI、bridge 本地 SSE consumer、或可選 Mosquitto | PG（若需要） | 否 |

**直寫 store 的後門。** P0 §6 第 3 點保留為 PoC 條件不變。補一句：在形狀 (b) 啟用它就是重現 C-24（device VLAN → ERP VLAN 多一條防火牆規則）；P2 預設不啟用。

**F-01～F-15 哪些不成立。** 全部成立，兩條帶條件：F-09（roll-up）成立但是自己養的小 ETL，沒有 TSL 的 continuous aggregates（F-3）；F-13 成立的前提是 Grafana 的 dashboards 只從 repo provisioning，手改就會被覆蓋（C-17 的反面）。F-15（最小部署不需歷史 store）成立：一片螢幕的部署沒有 `history` database，actual register 的最新值在 Fleet 可見即可。

## 6. D-01～D-06 逐一走過

**D-01 螢幕。** CM4 上 node agent + display backend（Anthias 的 reconcile 留在 backend，可換，F-61）。desired register `playlist = {version, doc_pointer}`，文件沿樹從 bridge 的快取拉（N-11；消掉 C-24 的 IoT→ERP 防火牆規則）；actual register `applied_playlist_version` 由 backend reconcile 後回報（F-38，修 B-03、B-14）；reconcile 非同步、不阻塞送達（修 B-07）；版本不符的文件請求被拒（F-60，修 B-04）。「MES live board」內容型態的頁面由 bridge 的文件快取代理那個 ~5 s 的 JSON，螢幕不直連 ERP；頁面不自行導航、不連續重繪（C-19）。最小部署 = Odoo + bridge 0（含 issuer、consumer、無 store）+ 一片螢幕 = 兩個服務（P0 此點成立）。

**D-02 環境感測。** 感測服務 當 backend 綁 localhost；1 Hz 本地平均成 30 s 一筆（F-01）；warm-up 與 fault 以 attribute 回報（F-05），bridge 在裝置時間過舊時標 stale 而非補值（F-04）；門檻（HCHO 80 ppb）是推下去的 register，越線事件走 consumer 進 ERP（F-10 的 alert 部分）。最小部署沒有 store 時，Fleet 只看到最新值；加感測器才加 `history` database（F-15）。

**D-03 Modbus bypass 感測。** 這是 bridge 自己的 function backend（Modbus RTU/TCP 輪詢），不是 MQTT。T1 代表由操作員在 bridge 宣告 address（RTU 的 RS485 位址或 TCP 的保留 IP，F-22）、register map 與型別（F-32）；min/mean/max per interval 在 bridge 算（F-01）；差壓帶符號。防火牆只放 bridge→白名單 IP:502。純旁路觀測，不進 PLC 控制迴路（N-21）。

**D-04 LED。** effect、playlist add/remove/resume 是 job（有 key，修 B-08）；config 與 show 是 register（show 的時間軸在 LED 控制器 本地跑，F-44）；`supported_effects` 在 announce 的 capability 裡並驅動 ERP 驗證（F-06，修 B-09）；五個命令的結果全部經 CQ 可觀察（修 B-05、B-06）；standalone playlist 模式不受影響（F-45）。

**D-05 門禁 / 打卡（規劃中）。** 樹只做管理面：身分（T3，硬體金鑰簽 announce）、存活（串流 + 心跳 + attestation 欄位預留）、設定（簽過名的 config register）。刷卡與出勤是**事件**不是 register：裝置的 SQLite event log 是 owner，沿 report 帶 cursor 往上，出勤事件是合法的 ERP 業務列（F-03），門禁原始事件留在 log 與可選的 store。憑證清單、排程、門鎖狀態是 Control-Semantic，**不經過**這條通道（class rules），控制面另建、不在本次範圍。P2 在這裡的貢獻只有一件：下行 frame 全簽名（§3.5）讓未來控制面可以複用同一套金鑰與撤銷。客戶 IT 會問「平台有什麼認證」（02 §1）：答案只能是外部審查報告，P2 沒有更好的答案。

**D-06 機台遙測（含低延遲 HMI 層）。** 機台 PLC 經 edge controller 以 ≤ 1 Hz 送遙測；配方與溫控留在 edge controller（D-06 原文）。三層介面在 P2 的落點：

| 層 | P2 的答案 | 走樹嗎 | M-02 代價 |
|---|---|---|---|
| 現場 HMI（低延遲） | **預設**：HMI 直接訂閱 edge controller（它本來就是機台自己的 HMI/SCADA 來源，Modbus/OPC UA 由機台方提供），我們只旁路觀測（N-21）。**第二選項**：bridge 開一個本地 SSE/NDJSON consumer endpoint（token 保護）給 web HMI，LAN 內延遲是毫秒級，+0 種類。**第三選項**：客戶要 MQTT/Sparkplug B 風格的 SCADA（例如 Ignition 類；其與 Sparkplug 的關係未查證，MQ28）時，在 bridge 旁放一個 Mosquitto，bridge 以 MQTT client 身分把已通過 schema 的遙測發到本地 topic（retained last value，QoS 0/1）；Mosquitto 在 HMI 的 VLAN，不在 T1 VLAN，不持有樹的憑證，只是一個 consumer | 否 | 0 / 0 / +1 runtime（可選） |
| 業務（ERP/MES） | 門檻與狀態事件走 consumer 進 ERP；MES 以 consumer 或 PG 接 | 是 | 0 |
| 分析（dashboards） | PG + Grafana | 是 | 0 |

Sparkplug B 的角色：只在第三選項的資料面，NBIRTH/NDATA 由 bridge 編碼（+1 protobuf 依賴，可選）；不用它當命令面（NCMD QoS 0、Clean Session、無 command id，MQ19、MQ20）。量：30 屬性 @1 Hz 就是 W2，觸發 §5 的獨立 PG 實例規則。任何對機台的致動都是 Control-Semantic，不經此通道。

**D-05 的管理面補充。** 多站部署「軟體體驗是主賣點」：adopt 流程在 ERP 一鍵、憑證沿樹自動、revoke 立即可見，這些在 P2 都是樹的既有能力；D-05 不需要新的管理面，只需要控制面。

## 7. 妥協清單

| 需求 ID | 妥協內容 | 換到什麼 | 代價 |
|---|---|---|---|
| P0 §3「fetch = long-poll」（03-brief §2 允許） | 下行改成 child 撥出連線上的持久串流 push | 命令延遲從 poll 週期變 RTT；secs 級 link 偵測；thundering herd 時 304 不重送 | 串流 + 退路兩種模式要維護；proxy 緩衝行為未查證，要 PoC |
| P0 §3「不用 MQTT」（03-brief §2 允許） | bridge 內建 MQTT ingress adapter（只收 PUBLISH）；D-06 站點可選 Mosquitto 當 HMI 消費者 | T1 MQTT 設備不必另立 broker；D-06 HMI 有 MQTT 選項 | +1 library 時鐘（bus factor 差，列 30/32/33）；可選 +1 runtime；ingress 的 fuzz 與限速是我們的責任 |
| N-02「每一跳 mTLS」 | site→cloud 這一跳允許 mTLS 失敗，改以應用層簽章承擔身分 | (c) 形狀在 TLS 檢查 proxy 下仍能工作，不等客戶 bypass | 一份自己的簽章格式；信任從 TLS 層移到應用層，須納入外部審查 |
| F-27「offline after a configurable 5 min」 | 預設縮到 90 s，並新增 hop 層 `link-down` 事件 | 秒級到一分鐘級的離線感知 | 心跳 25 s；link-down 是接收端事件，必須與 F-27 的裝置時間判定並列呈現，不能混 |
| P0 §1「資料一律走樹」 | D-06 的現場 HMI 層不走樹（機台自己的 HMI 或 bridge 本地 consumer） | 低延遲、不經 bridge 0 單點 | 這一層的資料不在 ERP 的視野；直寫 store 後門維持 PoC 條件 |
| P0 §1 第 5 點「T3 加端到端簽章」 | 擴大為所有下行 frame 由 bridge 0 簽名、T2 以上都驗 | 偽造意圖需要 bridge 0 私鑰，中間 bridge 被攻下不足以 deface | 每個 frame 多一次驗簽（CM4 上成本可忽略，意見）；金鑰輪替流程 |
| 02 §1「ERP 當 root」 | 憑證與 binding 的真相在 bridge 0 的 SQLite，ERP 是按鈕；批次 revoke 要二次確認 | ERP 遷移 bug 不會直接 revoke fleet | 兩份狀態要對帳（F-33 的順序規則處理） |
| M-02 | 標準部署種類數 11 → 12，D-06 站點 13 | 上述全部 | 多一個外部時鐘要排進 M-06 的定期檢查 |
| F-41「command queue is owned by the ERP」 | 無妥協 | — | bridge 0 的 SQ 只是鏡像；P0 §6 第 1 點保留 |
| N-13「最小部署 = 一片螢幕、兩個服務」 | 無妥協 | — | MQTT ingress 與 Mosquitto 都不在最小部署 |
| M-05 | 無妥協 | — | 新增元件授權皆為 Public Domain、MIT、Apache-2.0、EPL/EDL（§2） |

## 8. 已知弱點

先承認，再列哪些 C/B 會在哪一步重現。

1. **三件自己的東西：協定、PKI、consumer。** 沒有第二個實作者就沒有免費的對抗式審查。緩解只有三個：語言中立的 conformance test suite 當第二個「讀者」；announce 第一天就帶版本協商與相容矩陣；上線前付錢審 PKI、bootstrap/adopt/revoke 與應用層簽章。這些是成本，不是解法。
2. **串流穿客戶 proxy 的緩衝行為沒有任何文件**（`transport-through-networks.md` §4 第 5 點）。退路存在但沒實測；若 PoC 顯示常見的客戶 proxy 都緩衝，P2 的「命令延遲 = RTT」在 (c) 形狀退回「= 25 s hold」，與 P0 相同。
3. **MQTT ingress library 的 bus factor。** amqtt 個人帳號、曾 11 個月空窗；rumqttd 曾 21 個月無版本；rmqtt 近期單一作者（列 30、32、33）。對策：adapter 介面極薄（只有 CONNECT/PUBLISH/PING/DISCONNECT），必要時改成自己的 MQTT 3.1.1 server-side 最小解析器；「幾百行」是意見，沒有來源。自己寫等於自己扛解析器的 CVE 面，對 hostile T1 必須 fuzz。
4. **plaintext 1883 T1 的資料可被同 VLAN 任何人偽冒**（§3.2）。P2 只做到可見與逐台核准，沒有消掉。
5. **bridge 0 是單點**，串流讓它還多了「所有 children 的連線同時斷」的重啟形態；§3.4 的 token bucket 與 304 只能緩和。
6. **W2 以上的量**讓「同叢集獨立 database」不再成立，要搬獨立實例（§5）；N-15 的範圍本身有疑義（`postgres-timeseries.md` §4 第 2 點：300 條 series 全 1 Hz 是 284 億筆，平白 Postgres 不成立），需 owner 澄清。
7. **ERP 側的 class driver 與 Fleet 仍活在 Odoo 的年度大版與 C-20 的交易語意裡**；P2 沒有拆出獨立管理服務（03-brief §2 允許但 P2 沒選），因為多一個服務違反 N-13。
8. **MQTT 5 的 T1。** ingress v1 只收 3.1.1；若 T1 是 5.0-only（分布未查證），Python 路線的 amqtt 收不進來（列 33）。

**會重現的 C/B，與在哪一步：**

| 條目 | 會不會重現 | 在哪一步 |
|---|---|---|
| C-24（裝置直連 ERP 迫使 IoT→ERP 防火牆規則） | 會，若在形狀 (b) 啟用直寫 store 後門 | §5 的 PoC 條件；預設不啟用 |
| C-17（re-provision 覆蓋手改 dashboards） | 會，若 ops 手改 Grafana | §5 的 F-13 條件；只允許 repo provisioning |
| C-05 的精神（consumer 掉線後無重送） | 以不同形式出現：cursor 超過 change-log window → 410，必須重新 list | §4.3；差別在它是明確錯誤而非 `maxFailsLimit` 靜默停用 |
| C-20（Odoo SERIALIZABLE：交易內不可遠端呼叫） | 仍在：ERP 在交易外 enqueue，bridge 0 來讀 | P0 §6 第 1 點的 pull-down 路由本來就是為它設計的 |
| B-07 的形狀（長工作擋住送達） | 會，若 backend 在串流 handler 內同步 reconcile | §4.1 的 `accepted` 先回；conformance test 要有這一條 |
| B-01 的形狀（任何例外都標 error） | 會，若 bridge 0 讀 queue 時把網路錯誤寫成 error | §4.1：失敗投遞一律 `unknown` |
| B-11（忽略心跳回應） | 不會：續期與 revoke 都在 `report` 回應裡，node 必須解析 | §3.3 步驟 4、5 |
| C-12（命令推到註冊時的 IP:port） | 不會：下行只走 child 撥出的連線 | 結構性 |
| C-01～C-11、C-13～C-16、C-21、C-22 | 不會：這些是 Orion/IOTA/QuantumLeap/CrateDB/NGSI 的 stack 行，元件不在了 | — |
| B-02～B-06、B-08、B-09、B-14 | 不會：由 register version、CQ、announce capability 結構性消掉 | §4、§6 |
| C-25（現場就是這樣） | 永遠在：它是情境不是 bug | §3.2 的三層圍堵是對它的回答 |

## 9. 成本與可逆性

**到第一個客戶價值的人週估計。** 定義：三到五片螢幕 + 三到五個環境感測器（D-01、D-02）+ 一個同站或雲端 ERP，形狀 (a) 或 (c)，無 D-03 Modbus、無 D-06、無 Mosquitto、MQTT ingress 不啟用。假設：一到兩位工程師、AI 輔助、P0 §6 第 2 點的語言 PoC 已完成、Odoo 既有模組可改不重寫、感測服務 與 Anthias reconcile 可搬。

| 工作 | 人週 | 備註 |
|---|---|---|
| node 核心：announce/report/fetch(串流 + 退路)/complete、SQLite、register/SQ/CQ、版本協商、consumer API（list + watch） | 7～9 | 三種角色同一份 code |
| PKI 與生命週期：env CA、issuer、bootstrap/adopt/續期/revoke、應用層簽章、批次 revoke 保險 | 4～5 | 不含外部審查 |
| ERP 模組改造：queue 路由（bridge 0 來讀）、Fleet、Manage、CQ 結果可觀察、applied version | 4～5 | 修 B-01～B-06、B-14 隨之 |
| display 與 sensor backend 搬到 localhost 協定；文件快取與 live board 代理 | 2～3 | — |
| 部署工件三種形狀 + 防火牆模板 + N-07/N-08 行為 | 2～3 | N-01、N-18 |
| e2e：三種形狀、soak、race、conformance 骨架 | 3～4 | N-17 |
| **小計** | **22～29** | 中位約 26 人週 |
| 外部安全審查（買） | 日曆 3～5 週 + 修補 1～2 人週 | 上線前 |
| 之後：MQTT ingress adapter | 1.5～2 | 第一個講 MQTT 的 T1 出現時 |
| 之後：store writer + 分區 + 增量 roll-up + Grafana provisioning | 2～3 | 第一個要歷史的站點 |
| 之後：D-06 的 Mosquitto 消費者 + Sparkplug 編碼 | 1～2 | 第一個 D-06 站點 |

這些是意見，沒有先例資料可對照（`precedents.md` §3.3 第 8 點：沒有查到任何先例的成本數字）。對照 P0 的隱含估計：P2 多出的部分（串流與退路、簽章、consumer、link 偵測）約 3～4 人週。

**三年後想換掉其中一塊要付多少。**

| 想換掉 | 要動什麼 | 估計 | 理由 |
|---|---|---|---|
| 傳輸層（HTTPS 串流 → MQTT 或 NATS） | node 的 transport 模組與部署工件；語意層（register/SQ/CQ、consumer、PKI 流程）不動 | 3～5 人週 | 語意與傳輸在 node 內是分開的模組；`mqtt-semantics.md` §5 結尾也判定 P0 語意可原封搬到 MQTT topic 上（研究員意見） |
| store（PG → 獨立 PG 實例 → VictoriaMetrics） | bridge 0 的 writer adapter、roll-up SQL、Grafana datasource | 1 / 2～3 人週 | §5 的介面設計；VM 時告警規則仍在 node 不受影響 |
| Odoo 當管理 UI（改獨立管理服務或換 ERP） | class driver UI 與 Fleet 重寫；bridge 0 的 issuer、binding、consumer 不動 | 6～10 人週 | 憑證與 binding 真相已在 bridge 0，不在 Odoo（§3.3） |
| Mosquitto（D-06 可選） | 刪掉一個 publisher adapter | < 1 人週 | 它只是 consumer，不在信任鏈 |
| MQTT ingress library | 換另一個 library 或自寫解析器 | 1～2 人週 | adapter 介面只有四種封包 |
| Anthias | 另一個 display backend 實作 reconcile 介面 | 2～4 人週 | F-61 原本的設計 |
| 整個樹（放棄 P2） | 保留的只有 Postgres 歷史、ERP 業務資料、function backend；協定、PKI、consumer 全部沉沒 | 全額 | 這是最弱點 1 的另一種寫法：自己的東西可逆性最差 |

一句總結：P2 把 02 那張帳單上「MQTT」這一行從「失去感差很多」改寫成「四筆小支出，其中兩筆不加種類、兩筆可選」，而把帳單上真正貴的三行（自己的協定、自己的 PKI、組織的制度性知識）原樣留在那裡，因為任何不換掉 ERP-as-root 的提案都付得一樣多。
