# P6：最小主義（第一個客戶需要的最小東西，以及它怎麼長大）

代號 P6。日期 2026-10-10。輸入：`00-requirements.md`、`01-proposal-pcie-tree.md`（P0）、`02-tradeoffs.md`、`03-brief.md`，以及 `10-facts/` 全部八份事實查核。

引用慣例：第三方事實寫成「（檔名 列號；URL；查證日期）」，`10-facts/` 內所有列的查證日期都是 2026-10-10；我自己查的事實附 URL 與查證日期 2026-10-10，標「搜尋摘要」者表示只讀到搜尋結果摘要、沒開原頁；沒有來源的事實標「未查證」。標「意見」的段落是我的判斷。需求以 ID 引用。

## 1. 結論先講：立場、一句話、三個最強理由、兩個最弱點

**立場。** 第一個客戶（幾片螢幕、幾個掛在螢幕盒子上的感測器、ERP 同站或在我們的雲）需要的最小東西是 **Odoo + 一支 agent**；第一個感測器要留歷史、或第一個 T1 出現時，加 **一支很小的 hub**（與 agent 同一份 code，另一個角色）；第一個講 MQTT 的 T1 或第一個 D-06 現場 HMI 出現時，在 hub 旁加 **一個 Mosquitto**。P0 的樹、自建 PKI、stackable bridge、consumer API、Rust PoC，全部綁在明寫的觸發事件上，第一個客戶不付。

**一句話。** 樹不是過早設計，過早的是樹的**部署**、自建 **PKI** 與 **MQTT**：協定第一天就長成「每個節點只認得 parent」的形狀（這很便宜），但 bridge、CA、broker 都等到有對象才裝；每一步是加法，不是重寫。

**三個最強理由。**

1. **今天已經 proven 的東西覆蓋第一個客戶的大半。** F-55～F-59、F-62、F-68、F-69、F-72 在 Odoo 側全是 proven；螢幕直接向 ERP pull 文件就是今天的設計（C-24）。P0 把 device route 搬進 bridge 0，等於把 proven 的入口重寫一次才能上第一個客戶；P6 把它留在 Odoo，只補 F-38（applied version）與 job 的 key/結果槽，B-03、B-04、B-08、B-14 就一起消掉。
2. **第一個客戶沒有 hostile T1。** 螢幕是 T2，D-02 感測器掛在 T2 盒子上（00 §3）；M-04 的「每個 device VLAN 一個 south」沒有對象，F-18 的「bridge 圍堵 child」沒有 child 要圍。C-25 的鄰居（租戶裝置）仍在同一個 VLAN，但他們能碰到的只有 nginx 上一條需要 token 的路徑；這與今天相同，不比今天差。第一個 T1 進站時，hub 與 VLAN 工件（N-01）才一起進場，而且它們是**加在 agent 與 Odoo 之間**，兩端都不改。
3. **身分先不蓋 CA。** 在 (c) 形狀，客戶若有 TLS 檢查 proxy，client cert 到不了我們的伺服器，身分必須上移到應用層（`transport-through-networks.md` §1 第 1、2 點與 §5 結論 1；T1～T3 為摘要、T5 為原文）。既然應用層身分是 (c) 的底線，就把它當全部形狀的第一版：Odoo 已經是 token 發行者（F-59、F-72 proven），每裝置 token 加 revoke 驗證碼，就是 T2 管理表要的「個別可撤銷、立即生效、可輪替」。02 §1「安全是自己的（最危險的一刀）」在 P6 延後到 T3/D-05 出現（F-42 的 IoT2 觸發）才付，而且那時付的是 P0 的設計，不是另一套。

**兩個最弱點。**

1. **Stage 0 讓裝置 VLAN 看得到 Odoo 的 HTTP 入口。** 擋在前面的只有 nginx 的 location 白名單、每 IP 限速與 token；Odoo 的 web stack（werkzeug、session、JSON-RPC）仍在路徑上。這是**接受**的風險，不是解掉的風險；它的到期日是第一個 T1。若客戶的第一個站點就有 T1，Stage 0 不存在，直接從 Stage 1 開始（成本見 §9）。
2. **「以後再加」的每一步都沒被第一個客戶測過。** hub 插進去的 re-point、第二層 VLAN 工件、Mosquitto 的 ACL、CA 的 bootstrap，第一個客戶都不會跑到；每一步都要重跑 N-18 的 e2e 並承擔「加法比想像貴」的風險。P6 與 P0 賭的是同一件事（02 §2：AI 把寫的成本壓下來），差別是 P6 分期付，而分期的利息是「每次加法都要回頭動 e2e 與部署工件」。

### 1.1 回答任務單的四個問題（摘要，細節在各節）

| 問題 | 答案 |
|---|---|
| 哪些需求暫時不滿足 | §7 表列：F-16/F-17 的可堆疊深度、F-35、F-36 的燒憑證、M-04/F-18 在 Stage 0、N-02 的 mTLS 字面、F-08～F-10/F-13/F-14 在 Stage 0（與 F-15 一致）、N-15 的「秒級收斂」、F-28 的「強制」、02 §3 第 2、5、6 項 |
| 什麼事件觸發下一步 | §2.1 表：第一個要留歷史的感測器 → hub（writer）；第一個 T1 或 (b) 形狀有租戶鄰居 → 站點 hub + VLAN 工件；第一個 MQTT T1 或 D-06 HMI → Mosquitto；T3/D-05 或 F-42 任一觸發 → CA 與 mTLS（P0 §4）；第三個消費者 → consumer API；單站樣本 > 10 億 → 獨立 store |
| 長大會不會逼重寫 | §9.2：不會重寫 agent 與 Odoo 模組，因為 agent 從第一天只認得 `parent_url`，hub 對下講同一套 route、對上是一台 T2（F-24）；會重寫的是部署工件與 e2e（每階段 1～2 人週） |
| P0 哪些部分是第二個客戶的問題 | §9.3 表：stackable bridge 與合成 config space、factory CA 與短效憑證、每跳終結 TLS、bridge 快取文件、直寫 store 後門 PoC、Rust PoC、consumer 概念、語言中立 conformance suite |

## 2. 元件清單

### 2.1 階段與觸發事件（先看這張，元件表依它分欄）

| 階段 | 觸發事件 | 新增的東西 | 此時的服務數（不含裝置上的 agent） |
|---|---|---|---|
| Stage 0 | 第一個客戶、只有螢幕（可帶 D-02 感測器但只看即時值） | Odoo 模組補 device route v1、agent | 1（Odoo；nginx 與 PostgreSQL 是 Odoo 本來就有的） |
| Stage 1a | 第一個要留 3 年歷史的感測器 | hub（writer 角色，與 Odoo 同主機或同雲）、`history` database | 2 |
| Stage 1b | 第一個 T1（Modbus），或 (b) 形狀且裝置 VLAN 有租戶鄰居 | 站點 hub（relay + poller 角色）、VLAN 與防火牆工件（N-01） | 2～3（(c) 形狀是雲端 hub + 站點 hub） |
| Stage 2 | 第一個講 MQTT 的 T1，或 D-06 的現場 HMI | Mosquitto，與站點 hub 同主機、只聽 T1 介面 | +1 |
| Stage 3 | T3 裝置（D-05）、賣出 managed hardware、站點數 > N（F-42） | 每環境一張中繼 CA、短效憑證、bootstrap 憑證（P0 §4 原案） | 不變，但 hub 多一個 issuer 角色 |
| 任何時候 | 第三個消費者（MES、現場 HMI 要樹上游資料） | hub 的 consumer API（list + cursor） | 不變 |
| 任何時候 | 單站 3 年樣本數估計 > 10 億，或 `history` 大小 > ERP database 2 倍 | 歷史搬到獨立 PostgreSQL 實例，再不夠才考慮 TSDB | +1 |

### 2.2 元件表

「取代掉什麼」對照 `00-requirements.md` §7。「階段」欄寫它第一次出現的階段。

| 元件 | 自建或外部 | 授權 | 維護者與時鐘（附來源） | 取代掉什麼 | 階段 |
|---|---|---|---|---|---|
| Odoo 19 Community + `iot_*` 模組：Fleet、Manage、device route v1（announce/report/fetch/complete）、token 發行與撤銷、desired register、job queue、CMS | 外部 + 自建 | Odoo：LGPL-3.0（https://raw.githubusercontent.com/odoo/odoo/19.0/LICENSE ，2026-10-10）；模組自有 | Odoo 官方文件：支援最近 3 個大版；19.0 於 2025-09 發布、支援到 2028-09（planned）；17.0 支援到 2026-10（planned）（https://www.odoo.com/documentation/saas-18.1/administration/supported_versions.html ，搜尋摘要，2026-10-10） | Orion、IoT Agent JSON、Mongo ×2 的「registry 真相」；integration hub outbound transport 退場（P0 §6 第 1 點） | 0 |
| nginx（Odoo 前面的反向代理，終結 TLS；`location /iot/` 的 allow/deny 與 `limit_req`） | 外部 | BSD-2-Clause（https://raw.githubusercontent.com/nginx/nginx/master/LICENSE ，2026-10-10） | Nginx, Inc.；版本線與 EOL：**未查證**（Odoo 部署本來就有它，P6 只多三段設定） | — | 0 |
| `node`：一支自己的 Python 程式，兩個角色由設定決定：**agent**（裝置上；pull desired、跑 job、report、持有 CQ 與量測 ring）與 **hub**（Stage 1 起；對下講同一套 route、對上是一台 T2；writer、緩衝、Modbus poller；Stage 3 起加 issuer） | 自建 | 自有 | 我們；時鐘自控。Python 3.11（Debian 12 內建）安全支援到 2027-10（PEP 664 直讀：https://raw.githubusercontent.com/python/peps/main/peps/pep-0664.rst ，2026-10-10）；Debian 12 LTS 到 2028-06-30（https://www.debian.org/News/2026/20260712.en.html ，搜尋摘要，2026-10-10） | 現有 gateway、compose 套件的 south、QuantumLeap（writer 部分） | 0（agent）/ 1（hub） |
| function backend：display（對 Anthias 的 reconcile 介面，F-61）、sensor（感測服務）、LED（LED 控制器）、Modbus（pymodbus）。獨立 process、只綁 localhost（修 B-10；F-07） | 自建 + 外部 library | pymodbus：BSD-3-Clause（https://raw.githubusercontent.com/pymodbus-dev/pymodbus/dev/LICENSE ，2026-10-10） | pymodbus 3.15.0 = 2026-08-13，前三版 2026-04/06/07，Python ≥ 3.10（https://pypi.org/pypi/pymodbus/json ，2026-10-10） | 感測服務、LED 控制器 保留但不再暴露網路 | 0（display、sensor）/ 1b（Modbus） |
| SQLite（node 內嵌：agent 的 CQ、desired 快取、量測 ring；hub 的上行緩衝） | 外部 library | Public Domain（「written affidavits releasing their work to the public」，https://raw.githubusercontent.com/sqlite/sqlite/master/LICENSE.md ，2026-10-10） | 3.55.0（https://raw.githubusercontent.com/sqlite/sqlite/master/VERSION ，2026-10-10） | Orion/IOTA 的 Mongo 狀態 | 0 |
| aiohttp（hub 的 HTTP server 與 client；agent 只用 stdlib） | 外部 library | Apache-2.0 AND MIT（https://pypi.org/pypi/aiohttp/json ，2026-10-10） | 3.14.4，Python ≥ 3.10（同上）；發布日未讀到 | Flask/Waitress（現有 gateway） | 1 |
| PostgreSQL 18：Odoo 既有叢集；`history` 為同叢集獨立 database，窄表、月分區、drop partition | 外部 | PostgreSQL License | 18.6 = `REL_18_6` 2026-08-11；PG 18 最後發行 2030-11-14（`postgres-timeseries.md` F-11，後者為摘要） | CrateDB、QuantumLeap、Mongo ×2 | 0（Odoo 的）/ 1a（history） |
| Anthias（過渡期 player） | 外部，不 fork | GPLv2 與 Commercial 雙授權（https://raw.githubusercontent.com/Screenly/Anthias/master/LICENSE ，2026-10-10） | 最新 release 2026.09.0 = 2026-09-22，前四版 2026-07/08（https://github.com/Screenly/Anthias/releases.atom ，2026-10-10）；README 稱支援 Raspberry Pi 與 PC，未提 CM4（https://raw.githubusercontent.com/Screenly/Anthias/master/README.md ，2026-10-10） | 由 reconcile 介面換掉（F-61） | 0 |
| Grafana（可選，只給 ops） | 外部 | 未查證 | 12.4.x 支援到 2027-05-24（02 §4；https://endoflife.date/grafana ） | 不變 | 1a |
| Mosquitto（可選；T1 MQTT 入口與 D-06 HMI 本地扇出；**不走命令**） | 外部 | EPL-2.0 OR EDL-1.0（`mqtt-brokers.md` 列 1） | 2.1.2 = 2026-02-09；master 最新 commit 2026-10-04；8 個月無新 tag；dynsec 可用 `%c`/`%u` 做 per-client ACL（列 2、7） | 「T1 講 MQTT 時 bridge 要多一個 adapter」、「D-06 HMI 在 P0 沒有答案」（02 §1） | 2 |
| 部署工件 repo：compose、nginx 片段、firewall templates；Stage 0 只出 (a)(c) 兩組，(b) 在 Stage 1b 補 | 自建 | 自有 | 我們 | compose 套件 | 0 |
| IoT_e2e、IoT_Parts | 自建 | 自有 | 我們 | 不變 | 0 |

**不在清單裡、而 P0 §6 有的：** Rust PoC（P6 用 Python，理由見 §7）、factory CA 與每環境中繼 CA（Stage 3）、「直寫 store 後門」PoC（hub 就是 writer，不需要後門）。

**種類數（M-02）。** 計法沿用 P2（引擎、語言、runtime、repo 各算一；外部 library 以時鐘計一、不算 runtime），另附嚴格計法（把 nginx 當 runtime、把 aiohttp 與 pymodbus 當時鐘）。

| 類別 | Stage 0（一片螢幕） | Stage 1（第一個客戶：螢幕 + 感測器 + 歷史，含 Grafana） | Stage 2（加 Mosquitto） |
|---|---|---|---|
| 引擎 | PostgreSQL、SQLite = 2 | 2 | 2 |
| 語言 | Python = 1 | 1 | 1 |
| runtime | Odoo、node = 2 | Odoo、node、Grafana = 3 | 4 |
| repo | node、ERP 模組、部署工件、e2e、Parts = 5 | 5 | 5 |
| 外部 library 時鐘 | 0 | 0（P2 計法） | 0 |
| **合計（P2 計法）** | **10** | **11** | **12** |
| 嚴格計法（+nginx runtime；Stage 1 起 +aiohttp、+pymodbus 時鐘） | 11 | 14 | 15 |

對照：P0 在 P2 計法下是 11，P2 標準部署 12（`P2-https-pull-defended.md` §2）。P6 的第一個客戶是 11、一片螢幕是 10。意見：P6 的種類數不比 P0 少多少，省下的不是「種類」而是**第一個客戶前要寫完、要審完的東西的數量**（PKI、stackable、consumer）；M-02 在 P6 的意義是「種類數隨階段增加，每次增加都有名字與日期」。

## 3. 拓樸、圍堵、身分

### 3.1 三種部署形狀

圖中 `=>` 是 child 撥出的 HTTPS；沒有任何箭頭指進裝置。Stage 0 與 Stage 1 各畫一張（(a) 合在一張）。

**(a) south/north 同一台主機（小辦公室）**

```
Stage 0                                   Stage 1（第一個感測器要留歷史）
┌─ host ───────────────────────┐          ┌─ host ──────────────────────────────┐
│ nginx:443 ── /iot/v1 ─► Odoo │          │ nginx:443 ──► Odoo ◄── hub(T2 token) │
│                 │             │          │                 │          │  ▲       │
│            PostgreSQL         │          │            PostgreSQL ◄───┘  │       │
│            (odoo db)          │          │        (odoo db + history db) │       │
└──────────────▲───────────────┘          └───────────────────────────────┼───────┘
   LAN         │ token over TLS                  LAN      hub:8443 /iot/v1 │
┌─ CM4 ─────────┴───┐  ×N                     ┌─ CM4 ─────────────────────┴──┐ ×N
│ agent ─ display   │                         │ agent ─ display ─ sensor      │
│       └ sensor    │                         └───────────────────────────────┘
└───────────────────┘
```

**(b) 同站不同 VLAN（工廠）**

```
Stage 0（無 T1；裝置 VLAN 有租戶鄰居）         Stage 1b（第一個 T1）
┌─ ERP VLAN ─────────────────┐              ┌─ ERP VLAN ───────────────────────┐
│ nginx:443 ─ /iot/v1 ─► Odoo │              │ Odoo ◄══ hub (relay+writer+poller)│
│   allow IoT-VLAN /iot/ only │              │           │        ▲ north 介面   │
│   deny  IoT-VLAN 其餘路徑    │              └───────────┼────────┼─────────────┘
└──────────────▲─────────────┘                           │  fw: 只放 hub→Odoo:443
   fw: IoT-VLAN → ERP:443 (一條規則, C-24)                 │
┌─ IoT VLAN ────┴──────────────┐             ┌─ IoT VLAN ─┼───────┼───────────────┐
│ CM4 agent ×N   租戶裝置(鄰居) │             │ hub south 介面:8443 │ Modbus/TCP 502 │
│ 鄰居只碰得到 nginx 的 /iot/   │             │   ▲ token    ▲      ▼               │
└──────────────────────────────┘             │ CM4 agent ×N  │   T1 meter (被輪詢) │
                                             │ T1 VLAN 預設 deny；T1 只被 hub 輪詢  │
                                             └─────────────────────────────────────┘
```

**(c) 客戶 ERP 在我們的雲、站點只有 outbound**

```
Stage 0 / 1a                                  Stage 1b（站點有 T1）
┌─ 我們的雲 ───────────────────────┐          ┌─ 我們的雲 ─────────────────────┐
│ nginx:443 ─► Odoo ◄── hub(writer)│          │ nginx:443 ─► Odoo ◄── hub(writer)│
│              │          │        │          │                        ▲        │
│         PostgreSQL ◄────┘        │          └────────────────────────┼────────┘
└──────────────▲───────────────────┘                 internet, 443 only │ site token
   internet    │ 443 only, device token       ┌─ 站點 ─────────────────┴────────┐
┌─ 站點 ────────┴──────────────┐              │ 站點 hub (relay+poller) ◄═ agents │
│ CM4 agent ×N（直接撥出）      │              │     └─► T1 (Modbus poll)          │
└──────────────────────────────┘              └──────────────────────────────────┘
```

意見：(c) 在 Stage 0 不需要站點 hub；幾十片螢幕各自撥出一條 TLS 到雲，量級與 Tailscale/kubelet 類先例相同（`precedents.md` e17、e18）。站點 hub 只在 T1 出現時進場，因為 T1 需要有人在站內輪詢它。

### 3.2 hostile T1 怎麼被圍堵

- **Stage 0：定義上沒有 T1。** 有的是 C-25 的鄰居。圍堵三件事：(1) agent 只撥出、只對 `parent_url` 講 TLS（N-02 對 T2 成立）；(2) nginx 對 IoT VLAN 來源只放 `location /iot/`，其餘 location `deny`，`limit_req` 每 IP 每秒 2 次、`client_max_body_size 256k`；(3) 每個請求先驗 token 再做任何寫入（F-68 proven），未帶有效 token 的請求只會碰到一個固定回應。這與今天的暴露面相同（今天螢幕就是直接拉 Odoo，C-24），P6 不假裝它更好，只把它寫成部署工件（N-01）。
- **Stage 1b：第一個 T1。** 採 `transport-through-networks.md` §3.2 的八條規則（研究員意見，非標準條文）：T1 VLAN 預設 deny 並記錄；T1 → hub 不開任何 port（Modbus 是 hub 主動輪詢，T1 不發起）；hub → T1 只放 502 到白名單 IP（F-22：T1 位址用 DHCP 保留，RTU 用 RS485 位址）；T1 不能到 ERP、internet、其他 VLAN；hub 不做 IP forwarding；hub 的 south 介面與 north 介面是兩張網卡或兩個 VLAN。hub 對 T1 的資料做 schema 檢查（F-31）、限速（F-01）、時間戳由 hub 蓋（T1 沒有可信時鐘；F-02 的「最近的節點」就是 hub）。
- **Stage 2：T1 講 MQTT。** Mosquitto 只聽 T1 VLAN 的介面（8883，或無 TLS 能力的 T1 用 1883 但只在該 VLAN）、`allow_anonymous false`、每個 T1 一個 dynsec client，ACL 只允許 publish `t1/<client>/#`（`mqtt-brokers.md` 列 7）。hub 以本機 client 訂閱 `t1/#`，做同樣的 schema 檢查與限速後才變成 report。T1 的訊息**永遠不會變成命令**：命令面只在 Odoo ↔ hub ↔ agent 的 route 上（`mqtt-semantics.md` §1 第 5 點：Sparkplug NCMD QoS 0 且 Clean Session，不適合命令面）。
- **一直成立的：** function backend 只綁 localhost（修 B-10）；感測器崩潰只死一個 backend（F-07）；node 是裝置上唯一持有 token 的 process。

### 3.3 bootstrap → adopt → revoke

沒有憑證、沒有 CA；全部是 Odoo 發的 token 與一個 pepper。

1. **建檔。** 操作員在 Odoo Fleet 建立裝置（序號、功能類別、站點），Odoo 產生一次性 **bootstrap token**（`bt_<id>.<secret>`）與 QR。F-36 的 provisioning station 把 `parent_url`、parent 的 **SPKI pin**（nginx 或 hub 的伺服器公鑰指紋）與 bootstrap token 寫進裝置（F-37：裝置區不需要碰 admin plane）。
2. **present, unadopted。** 裝置開機、以 bootstrap token `POST /iot/v1/announce`（序號、功能清單、schema 版本、協定版本）。Odoo 把該裝置標為「seen」，Fleet 看得到但不綁（F-26）。bootstrap token 只能 announce 與讀 `/iot/v1/adoption`，不能 fetch desired、不能 report。
3. **adopt。** 操作員按 Manage（F-33：Odoo 先寫 binding，再建自己的記錄）。裝置下一次輪詢 `/iot/v1/adoption` 拿到 **operational token** 與 **revoke secret**，bootstrap token 立即失效（T2 表：「bootstrap credential invalid after adoption」）。operational token 可由 Odoo 隨時輪替：新 token 透過 desired register 的 `credential` 欄位下發，舊 token 在裝置確認後 24 小時失效。
4. **revoke（立即生效）。** Odoo 刪除 token。裝置下一次請求收到 `401` 加 body `{"status":"revoked","device":id,"ts":t,"mac":HMAC(revoke_secret, "revoked|id|t")}`。agent 驗 HMAC：**驗得過 → rejected**（丟掉 token、停止下行、螢幕顯示「未受管理」、保留 last-known-good 內容不變）；**驗不過或根本連不上 → unknown**（繼續用手上最後一份 desired，N-11，並退避重試）。修 B-11。
5. **N-04（每環境的 trust）。** Odoo 不存 token 明文，存 `sha256(secret || pepper)`，pepper 來自 credential resolver（N-03），**不在 database 裡**；staging 從 prod 還原的 database 沒有 prod 的 pepper，驗不了任何真實裝置的 token，也發不出能被真實裝置接受的 revoke（revoke secret 同樣以 pepper 衍生）。這把「staging 中和」做成內建而不是 runbook（§9 開放問題之一）。
6. **hub 的身分。** hub 自己就是一台 T2（F-24）：同一套 bootstrap/adopt，拿到的是 **site token**（F-41 的 site-scoped credential）。agent 從 Odoo 直連改成經過 hub，是 Odoo 透過 desired register 寫 `config.parent = {url, spki_pin}`，agent 下一次輪詢後 re-point；路徑身分改了、單元身分不變（F-19）。

**誰終結 TLS。** Stage 0：nginx（(c) 用公開 CA 憑證；(a)(b) 用自簽伺服器金鑰並由 Odoo 發 pin）。Stage 1 起：hub 對下終結 TLS（自簽伺服器金鑰、pin 由 Odoo 發），對上以 site token 重新發起。**誰是唯一的發行者（SC §2.2）。** Odoo：它發 token、發 pin、發 revoke；我們不簽任何憑證。Stage 3 的 CA 進場時，issuer 角色落到 hub（P0 §5 的答案），Odoo 仍是按鈕。

意見：這套東西比 P0 §4 少了 factory CA、短效憑證續期、每環境中繼 CA。少掉的安全性是：沒有硬體綁定、沒有 attestation、token 被複製走就是被複製走（撤銷可補救，但要先發現）。對螢幕與感測器，這是可接受的；對 D-05 不是，所以 D-05 是 Stage 3 的觸發。

## 4. 命令與回報語意

P0 的 register 與 SQ/CQ 語意**原封不動**，只是 owner 的位置是 Odoo 與裝置，中間沒有鏡像層（Stage 1 的 hub 只做轉送與緩衝，不持有命令真相）。

### 4.1 落在 HTTPS pull 上

- **register（state intent）。** Odoo 每裝置每功能持有 `desired = {playlist: {version, pointer}, config: {parent, enabled_functions, poll_s}, thresholds, credential}`，每個欄位帶 Odoo 單調遞增的 `version`。agent `GET /iot/v1/desired` 帶 `If-None-Match: <etag>`；Stage 0 的 Odoo 立即回 200/304，agent 每 15 秒輪詢（Balena 的做法：固定間隔 + ETag + jitter，`precedents.md` e10 原文）；Stage 1 的 hub 支援 `?wait=20`（hold ≤ 20 秒，低於 nginx/ALB 60 秒與 Cloudflare 125 秒的預設 idle，`transport-through-networks.md` T7～T9），agent 依回應標頭自動切換。agent 把 desired 存進 SQLite，apply 後在下一次 report 帶 `actual = {playlist_applied_version, config_version}`（F-38，修 B-14）。**done = actual.version == desired.version**（F-47），由 Odoo 判定並顯示（修 B-02、B-03）。
- **job（一次性）。** Odoo 有 `iot.job` 表：`key`（UUID，由 Odoo 產生）、payload、`state ∈ {queued, delivered, done, unknown, timeout}`、`deadline`、result。單飛：每裝置同時最多一個 `delivered`（F-51 的 issuer 端 single-flight）。agent `GET /iot/v1/jobs/next` 拿到 job 的瞬間 Odoo 標 `delivered`（送達事件）；agent 執行後 `POST /iot/v1/jobs/<key>/result`（完成事件；F-52），並把結果寫進自己的 SQLite CQ。agent 以 key 去重（修 B-08）：同一 key 再來，回 CQ 裡的結果不重跑。Odoo 的 cron 每分鐘把過 `deadline` 的 `delivered` 標 `timeout`；送達失敗（agent 沒來拿）保持 `queued`；拿走後沒結果且未過期是 `unknown` 的候選（F-50）。agent 重連後先把 CQ 裡「尚未確認送達」的結果重送，Odoo 以 key 冪等接受（F-46：漏掉的結果靠重讀 owner）。
- **Odoo 側的 C-20。** 命令只在 Odoo 的 transaction 內寫入 `iot.job` row，沒有任何 remote call（agent 來拉，Odoo 不推）；這正是 P0 §6 第 1 點「ERP ↔ bridge 0 統一成 pull-down」的最簡形式，integration hub 的 outbound transport 退場。

### 4.2 每個事實的 owner

| 事實 | owner（耐久持有、可重讀） | 誰可以寫（N-05） | 鏡像 |
|---|---|---|---|
| 綁定、config、credential、pin | Odoo | Odoo（Manage） | agent SQLite（快取） |
| desired（playlist、thresholds、show） | Odoo | Odoo（業務 UI） | agent SQLite |
| job 的存在、state、deadline | Odoo | Odoo（建立、deadline 判定）；agent 只能寫 result | — |
| job result | agent 的 CQ（SQLite） | agent | Odoo `iot.job.result`（複本） |
| actual（applied version、capability） | agent | agent | Odoo 每裝置一列 snapshot（F-30：覆寫不累積） |
| 量測 | Stage 0：agent 的 ring（7 天）；Stage 1：`history` db | agent（Stage 1 經 hub 寫入，以 agent 身分標記 series） | — |
| 線上/離線 | Odoo 以 agent 回報的 `device_time` 判定（F-27） | Odoo | — |
| 門檻事件、job 完成、上下線變化 | Odoo（業務事件 rows，F-03） | Odoo（由 report 觸發） | — |

### 4.3 retention window（全部明寫、可設定、超過就計 drop）

| 項目 | 預設 | 超過時 |
|---|---|---|
| agent CQ（job results） | 500 筆或 30 天，先到者 | 最舊的刪除；刪除計數上報 |
| agent desired 快取 | 永遠保留最後一份（N-11） | — |
| agent 量測 ring（parent 不可達時的緩衝與 Stage 0 的本地歷史） | 7 天 | 最舊的刪除；drop 計數上報 |
| hub 上行緩衝（Odoo 或雲端不可達） | 7 天或 1 GB | 同上 |
| Odoo `iot.job` rows | 30 天（取代 B-01 的 7 天） | 歸檔到 `iot.job.archive` 90 天後刪除 |
| Odoo desired 版本歷史（audit，N-05） | 90 天 | 刪除 |
| Odoo 業務事件 | 180 天 | 刪除 |
| Odoo snapshot（actual、心跳） | 每裝置一列 | 覆寫 |
| `history` 原始 30 s 資料 | 36 個月分區 | drop partition |
| `history` 小時 roll-up（min/mean/max/count） | 60 個月 | drop partition |
| job deadline | 預設 10 分鐘，依 class 覆寫 | → timeout |
| 心跳 / 離線判定 | report 每 120 秒；5 分鐘無 report 為離線（N-15、F-27） | — |

### 4.4 F-46～F-54 逐條對照

| ID | 判定 | 一句理由 |
|---|---|---|
| F-46 | 成立 | owner 是 Odoo 與 agent SQLite；完成由 actual/result 判定，不由 ack；離線期間的 job 留在 `queued`；漏掉的 result 由 agent 重送、Odoo 重讀 |
| F-47 | 成立 | desired register 與 `iot.job` 兩類，別無第三種；done 條件如 §4.1 |
| F-48 | 部分 | 下行只能來自 agent 自己撥去的 parent（pin 驗伺服器）；誰可下命令由 Odoo 的權限模型定；**沒有端到端簽章**，若 hub 被攻破可偽造 desired（Stage 3 補） |
| F-49 | 成立 | 每個 job 的 result 在 `iot.job` 可見；修 B-05、B-06 |
| F-50 | 成立 | `unknown → timeout` 由 Odoo cron 判定 |
| F-51 | 成立 | 去重：agent by key；單飛與 deadline：Odoo；順序：Odoo 的 queue 順序 + 單飛 |
| F-52 | 成立 | delivered 與 done 是兩個 state；reconcile 在 agent 背景跑（修 B-07） |
| F-53 | 成立 | backend 失敗 → agent 寫 `error` result；agent 不會回 OK 給自己沒讀到的結果（修 B-06） |
| F-54 | 成立 | 相同 desired 重複送達，agent 比 version 不動作；agent 可回 `refused` 並帶理由 |

## 5. 回傳資料

- **Stage 0：** 量測留在裝置（agent 的 SQLite ring，7 天）；report 只帶每個量測的**最新值、品質、感測器狀態、裝置時間戳**（F-02、F-04、F-05），Odoo 只存一列 snapshot（F-30）並在越過門檻時產生事件（F-03、F-10 的 alert）。沒有歷史、沒有圖；這與 F-15、N-13 一致，但 F-08、F-09、F-10（line）、F-13、F-14 在 Stage 0 **不成立**（§7）。
- **Stage 1a：** hub（writer 角色）在 Odoo 旁或雲端。agent 的 report 多帶一個 `measurements[]` 批次（上次確認後的 30 s 列，含時間戳），hub 寫進 `history` database（窄表 `measure(series_id, ts, value, quality)`，月分區；`series` 維度表持有裝置、功能、量測名；改名只改維度表，F-14；新量測是新 series，不 ALTER，F-11），然後把去掉 `measurements[]` 的 report 轉給 Odoo。roll-up 由 hub 的排程對**已關閉的小時 bucket**做增量 `INSERT ... ON CONFLICT`（`postgres-timeseries.md` F-13：materialized view 全量重算不可用）；retention = drop partition（F-12）。store 是 PostgreSQL License、同叢集零新種類（該檔 §3.4：樣本 ≲ 10 億/站時最划算）。
- **第 N 個消費者：** Grafana 用 PostgreSQL datasource 讀 `history`（唯讀 role，N-03）；MES 走同一條唯讀 role 或 hub 的 `GET /history/...`（site token 範圍內）；現場 HMI 在 Stage 2 訂 Mosquitto 的本地 topic（hub 把經過檢查的 T1 資料與 agent 報上來的量測同時 publish 到 `site/<unit>/<function>/<measure>`，retained，給 late joiner）。第三個要**樹上游**資料的消費者出現時，hub 加 consumer API（list + cursor），這是 02 §3 第 2 項延後到有對象。
- **(c) 形狀的量：** 幾個感測器 × 3 量測 @30 s ≈ 每天 2.6 萬列，三年 2,800 萬列、窄表約 2 GB（依 `postgres-timeseries.md` §3.1 的 52 B/樣本估算，非實測）；落在「Postgres 內一個 database」的划算區。
- **F-01～F-15 判定：** F-01 成立（agent 以 30 s 平均上傳）；F-02 成立；F-03 成立；F-04 成立（無值就不帶欄位，Odoo 顯示「無資料」與時間差）；F-05 成立；F-06 成立（announce 帶 capability，修 B-09）；F-07 成立；F-08 Stage 1a 起成立；F-09 Stage 1a 起成立；F-10 line Stage 1a 起（Grafana）、alert 成立（Odoo 事件）；F-11 成立；F-12 成立（`history` 只有量測）；F-13 Stage 1a 起（Grafana 以 provisioning 檔管理；C-17 的教訓是「不要手改」）；F-14 成立；F-15 成立。

## 6. D-01～D-06 逐一走過

**D-01 螢幕。** Stage 0 的全部內容。Odoo 是 CMS（F-55），playlist 以版本化文件存在 Odoo，desired 只帶 `{version, pointer}`（F-56）；agent 以 operational token 拉文件（F-72；C-24 的直連在 Stage 0 是刻意的，Stage 1 起文件經 hub 代拉並快取，N-11）。display backend 對 Anthias 做 reconcile（list/create/update/delete/order，F-61；C-18 的 URI 才 reload、C-22 的 id 由 backend 指派都包在 backend 內）。applied version 回報修 B-14；版本比對修 B-03、B-04。MES live board（backlog）是一個內容型別，頁面自己每 5 秒拉 token 保護的 JSON，不經命令面（F-63）。

**D-02 環境感測。** 掛在螢幕盒子上（F-25：既是 endpoint 也是 bridge 的最小例）。感測服務 當 sensor backend、只綁 localhost；30 s 平均、暖機由感測器狀態 gate（F-04）。Stage 0 只看即時值與門檻事件；Stage 1a 起留歷史。「HCHO 欄位與門檻」在 Odoo 的 class driver 模組裡（F-39：一個 backend + 一個管理模組）。

**D-03 Modbus 旁路感測。** 就是 Stage 1b 的觸發。hub 的 Modbus poller（pymodbus）用一份通用的 register map 描述（位址、型別、縮放、間隔），不寫 per-sensor 變體（D-03 原文）；每個 T1 在 Odoo 建成 hub 底下的功能（F-26：在 hub 註冊一次，Fleet 自動看到）。資料面同 D-02 的 Stage 1a。

**D-04 LED。** LED 控制器 當 backend；config/effect/show 走 job（key、單飛、CQ）；capability 從 announce 進 Odoo 驗證（修 B-09）。standalone playlist（F-45）在 agent 本地。LED 需求在第一個客戶若沒有，什麼都不裝，但協定不用改。

**D-05 門禁（Control-Semantic）。** 不在 P6 的命令模型內（00 §3 class rules）。身分、存活、設定走同一套 route，但 D-05 是 T3：需要硬體金鑰、attestation、signed config——這正是 Stage 3 的觸發，P6 在這裡把 PKI 交回給 P0 §4 的設計。意見：在 D-05 之前蓋 CA 是為一個還沒有的產品付利息；在 D-05 之後蓋，是付本金。P6 選後者，並承認 Stage 3 的外部審查（02 §3 第 5 項）不能再延。

**D-06 機台遙測。** 三層介面：**現場 HMI** 訂站點 Mosquitto（Stage 2；retained + will 給 HMI 的習慣，`mqtt-semantics.md` §3.5 認為 Sparkplug 資料面適合這層）；**業務層**走 report → Odoo 事件（只有門檻與狀態變化）；**分析層**讀 `history`。1 Hz × 30 屬性 × 1 台 @1 s 三年約 28 億筆（`postgres-timeseries.md` W2，估算），觸發「獨立 PostgreSQL 實例」的規則。PLC 若經邊緣控制器講 MQTT，就是 Stage 2 的 T1；若講 Modbus，就是 Stage 1b。控制面（配方、溫控）留在邊緣控制器本地，不進這條通道。

## 7. 妥協清單

| 需求 ID | 妥協內容 | 換到什麼 | 代價 |
|---|---|---|---|
| F-16、F-17 | 樹深度 ≤ 2（Odoo → hub → unit），不做 south 底下再一個 south；協定仍是「只認得 parent」 | 第一個客戶不寫合成 config space、子樹彙總、多層 revoke 傳播 | 第一個需要兩層 south 的站點（多廠區單 ERP）要補 hub 的 relay-of-relay，估 2 人週 |
| M-04、F-18 | Stage 0 沒有 south；裝置 VLAN 的鄰居能碰到 nginx 的 `/iot/` | 一片螢幕只有 Odoo 一個服務 | Odoo web stack 在攻擊面上，到期日是第一個 T1 |
| C-24 | Stage 0 接受「IoT → ERP:443 一條規則」 | 不重寫 proven 的直連文件拉取 | 客戶 IT 要開這條規則；Stage 1b 後改為 IoT → hub |
| N-02 | T2 的「mutually authenticated」用 TLS 伺服器驗證（pin）+ 裝置 token，不是 mTLS | 不蓋 CA；(c) 形狀下與 TLS 檢查 proxy 的相處方式和 mTLS 相同（都要 bypass） | token 可被複製；沒有硬體綁定；撤銷要先發現 |
| F-35 | 站點之上的 enrolment root of trust = Odoo 的 database + pepper，不是 CA | 零憑證工具鏈 | 一次 Odoo 遷移 bug 可以撤掉整個 fleet（02 §1「ERP 當 root complex」在 P6 成立，P0 也一樣） |
| F-36 | 製造步驟燒的是 bootstrap token 與 pin，不是憑證 | provisioning station 只需要能寫檔 | RMA 時 token 由 Odoo 作廢重發，沒有硬體序號可驗 |
| F-08、F-09、F-10（line）、F-13、F-14 | Stage 0 不成立 | 一片螢幕零 store（與 F-15、N-13 一致） | 想看圖就進 Stage 1a |
| N-15「螢幕通常幾秒內收斂」 | Stage 0 以 15 秒輪詢，中位數約 7 秒、最差 15 秒 | Odoo 不需要 gevent/long-poll worker；避開 C-20 的 worker 問題 | Stage 1 的 hub 用 20 秒 long-poll 補回到秒級；Stage 0 停在「十幾秒」 |
| F-28 | 「強制立即刷新」= 等下一次 report（最多 120 秒），無推送 | 沒有任何下行連線 | 操作員按鈕只能顯示「等待中」 |
| N-01 | Stage 0 只出 (a)(c) 兩組工件；(b) 的 VLAN 工件在 Stage 1b | 第一個客戶少一組要測的形狀 | 第一個 (b) 客戶前要補並跑 N-18 |
| F-42 的 N | 把「站點數 > N」定為 Stage 3 觸發之一，建議 N = 3 | 觸發有數字 | N 是意見，owner 定 |
| 02 §3 第 2 項（consumer 概念） | 延後到第三個消費者 | Stage 1 的 hub 少一個 API | 第三個消費者出現時 2 人週，且期間 Grafana/MES 用 PostgreSQL 唯讀 role 擋著 |
| 02 §3 第 5 項（外部對抗審查） | 延後到 Stage 3，Stage 0/1 做內部審查 | 第一個客戶前省一筆錢 | token 流程若有洞，受影響的是螢幕與感測器而非門禁，但 defacement（F-48）是真風險 |
| 02 §3 第 6 項（語言中立 conformance suite） | 以 e2e 情境取代（N-17），不另寫 suite | 省 2～3 人週 | 第二個實作者（例如 Rust agent）出現時要補 |
| P0 §6 第 2 點（Rust PoC） | 不做；node 用 Python（感測服務、LED 控制器、現有 gateway 現況） | 第一天就能寫 | CM4 上 Python 的記憶體與啟動時間未量；Python 3.11 到 2027-10、Debian 12 LTS 到 2028-06 是兩個要排進 M-06 的時鐘 |

沒有妥協的：M-05（全部授權不綁客戶：LGPL-3.0 的 Odoo 以 API 介面相鄰、BSD/MIT/Apache/PostgreSQL License/Public Domain、EPL-or-EDL 的 Mosquitto；Anthias 的 GPLv2 是既有狀況且不改碼不散布）、M-06（每個外部元件都有日期）、F-46～F-47、F-67～F-72（Odoo 側 proven 保留）。

## 8. 已知弱點

1. **Odoo 在裝置輪詢的熱路徑上（Stage 0）。** 50 片螢幕 × 15 秒 ≈ 3.3 req/s 的 304，加 120 秒 report；每個請求在 Odoo 開一個 cursor。量級可承受（意見，未量），但 Odoo 每年一個大版（19.0 支援到 2028-09，搜尋摘要），device route 每次升版都要跟著遷移；C-20 的怪癖（SERIALIZABLE、`type='json'` 回 200）會滲進 device route。P0 把這條路徑移出 Odoo是對的方向；P6 只是說「等 hub 進場再移」，而 hub 進場後 Odoo 仍是 root 的那一端，這個耦合不會消失。
2. **C-24 在 Stage 0 重現**，而且是刻意的（§7）。第一個 (b) 客戶若裝置 VLAN 鄰居不可信到連 `/iot/` 都不該看到，Stage 0 不適用，要直接進 Stage 1b。
3. **C-20 會重現在 device route 上**：若把 `measurements[]` 在 Stage 0 誤寫進 Odoo rows，F-30 的 14k rows/day 會回來。P6 的防線是 Stage 0 不收批次、Stage 1a 由 hub 先剝掉；這要寫進 N-17 的 e2e 斷言。
4. **C-19、C-18 留著**（Anthias 不換），由 display backend 包住；Anthias 近期有月更（2026-09-22），但 GPLv2 + Commercial 雙授權與「不提 CM4」兩點要排進 M-06 的檢查。
5. **(c) 形狀的 TLS 檢查 proxy。** 裝置驗伺服器 pin，proxy 的 MITM 憑證會讓驗證失敗；結局只有客戶加 bypass，與所有提案相同（`transport-through-networks.md` T6：Tailscale 也只做偵測告警）。P6 沒有比 P0 好或差。
6. **pepper 是單點。** pepper 遺失等於全 fleet 要重新 adopt；pepper 洩漏加 database 洩漏等於可偽造任何裝置。N-09 的備份要把 pepper 當獨立的、加密的、與 database 分開存的狀態。
7. **re-point 沒被第一個客戶測過。** agent 從 Odoo 直連切到 hub 是靠 desired register 下發 `config.parent`；若 pin 或 URL 寫錯，裝置會連不上新 parent 也不會回舊 parent。agent 必須保留 `previous_parent` 並在新 parent 連續失敗 N 次後回退，這條邏輯要在 N-17 的 soak test 裡。
8. **B-13（compose 套件 stop 對錯 compose project）**那類部署錯誤會以新形式重現：三種形狀、三個階段的 compose 與 nginx 片段是乘法。P6 的解法是每階段只出該階段的工件，不預寫。
9. **沒有第二個實作者、沒有 conformance suite。** 與 P0 同一刀（02 §1「協定是自己的」）。P6 把版本協商放在 announce（第一天就做）但把 suite 延後，fleet 升級慢的問題（2026 年的螢幕到 2029 年還講 v1）在 P6 一樣存在。
10. **Stage 2 的 Mosquitto 是 T1 面前的 C 程式。** `mqtt-brokers.md` 列 10：近兩年有兩個帶 Security 標題的版本（2024-10、2025-03）。它只聽 T1 VLAN、不持有 site token、hub 才是上行的身分持有者，所以被攻破的影響止於資料面；但 Mosquitto 8 個月無新 tag（列 2）要下一季再查。

B-01～B-14 的重現：B-01、B-02、B-03、B-04、B-05、B-06、B-07、B-08、B-09、B-10、B-11、B-14 由 §4、§3 的設計消掉；B-12（provisioning 用 admin port、POST-only）由 bootstrap token 流程消掉；B-13 以上述第 8 點的形式有重現風險。C-01～C-15 隨 FIWARE 退場消失；C-16、C-17 隨 CrateDB 退場與 Grafana provisioning 消失；C-18、C-19 留（Anthias）；C-20 留（Odoo）；C-21、C-22 由 backend 封裝；C-23 隨 integration hub outbound 退場；C-24 Stage 0 重現；C-25 是環境，不是可消的。

## 9. 成本與可逆性

### 9.1 到第一個客戶價值的人週（估算；假設見下）

| 工作 | Stage 0（螢幕） | Stage 1a + 1b（感測器留歷史；若有 T1） |
|---|---|---|
| agent：pull/ETag、desired 快取、job/CQ、bootstrap/adopt/revoke、display 與 sensor backend 接線、re-point 與回退 | 3 | — |
| Odoo 模組：device route v1、token + pepper、`iot.job`、applied version 顯示、Fleet 由 snapshot 驅動、拆掉 FIWARE 依賴 | 3 | 0.5（hub 當 T2 的 site token） |
| hub：relay、上行緩衝、writer、roll-up 排程、Modbus poller | — | 3 |
| `history` schema、分區、roll-up SQL、Grafana provisioning | — | 1 |
| 部署工件：(a)(c) compose + nginx 片段；(b) VLAN/防火牆 template | 1 | 1 |
| e2e：更新到新 route、soak（re-point、revoke、離線重送） | 1.5 | 1 |
| 內部安全審查（token 流程、nginx 白名單） | 0.5 | 0.5 |
| **小計** | **9** | **7** |

**第一個客戶（螢幕 + 感測器 + 歷史，無 T1）≈ 15 人週；若第一站就有 T1，+1 人週的 VLAN 工件與 Modbus register map。** 區間 ±50%。假設：1～2 位工程師、AI 輔助、Python、不做 Rust PoC、Anthias 不換、FIWARE 在同一步退場（不並行維運）、Odoo 19 不升版、沒有外部審查費。沒有算：硬體、客戶 IT 的防火牆協調時間、Stage 2/3。意見：P0 到第一個客戶要多付 PKI（含審查）、stackable、consumer 與 Rust PoC，差額我估 6～10 人週加一筆審查費；這個差額就是 P6 的全部主張，它不是「更好的架構」，是「同一個架構少付一期」。

### 9.2 可逆性：三年後想換掉其中一塊

| 想換掉 | 要動什麼 | 估計 |
|---|---|---|
| Anthias → 別的 player | display backend 一個 reconcile 實作 | 2 人週 |
| HTTPS pull → 持久串流或 MQTT 承載（hub ↔ agent 這一跳） | agent 與 hub 的 link layer；Odoo 不動（它只看到 hub 這台 T2） | 3～4 人週；P5 的「傳輸可換」在 P6 是這一跳的局部性質，不是全局抽象 |
| 加 CA 與 mTLS（Stage 3） | hub 加 issuer、agent 加 cert 續期、provisioning 改燒憑證、Odoo 按鈕不變 | 4～6 人週 + 外部審查費 |
| device route 完全移出 Odoo（Odoo 只留業務模型，root 的協定端交給 hub） | hub 已會講這套 route；Odoo 側改成 hub 以 JSON-RPC 讀寫 `iot.*` 模型 | 2～3 人週；代價是 Odoo 旁永遠多一個服務 |
| `history` → 獨立 PostgreSQL 實例 / VictoriaMetrics | hub 的 writer adapter；Grafana datasource | 1 人週 / 2～3 人週（VM 無 SQL，MES 的 join 要改） |
| Mosquitto → 別的 broker | hub 的訂閱端與 ACL 產生器；T1 設定 | 1～2 人週（Mosquitto 的 `acl_file` 格式 FlashMQ 也認，`mqtt-brokers.md` 列 29 摘要） |
| Odoo 不再是 root（registry、desired、job 搬到獨立服務） | 全部 `iot_*` 的模型與 UI、hub 的上行、e2e | 8 人週以上；這是 P6 與 P0 共有的鎖定（02 §1「ERP 當 root complex」），P6 沒有解它 |

### 9.3 P0 的哪些部分是「第二個客戶的問題」

| P0 的部分 | 第一個客戶需要嗎 | 什麼時候需要 | 延後的代價 |
|---|---|---|---|
| stackable bridge、合成 config space、子樹彙總（F-16） | 不需要 | 多廠區單 ERP、或單站多個 device VLAN 要各自一個 south | 2 人週；協定已預留 path id |
| factory CA、每環境中繼 CA、短效憑證（P0 §4） | 不需要 | D-05 / T3、managed hardware 售出、站點 > N（F-42） | 4～6 人週 + 審查；Stage 3 前的身分是 token |
| 每跳終結 TLS 再以自己身分重發 | 第一個客戶只有一跳（或 hub 一跳） | hub 進場時自然成立 | 0 |
| bridge 快取文件（N-11 在 bridge） | 不需要（agent 自己快取 last-known-good） | hub 進場、或文件大到不該每片螢幕各拉一次 | 0.5 人週 |
| 直寫 store 的後門 PoC（P0 §6 第 3 點） | 不需要 | hub 就是 writer；後門只在「站點 hub 到雲端 writer 的頻寬」成問題時才值得 | — |
| node 語言 Rust PoC（P0 §6 第 2 點） | 不需要 | CM4 上 Python 的 RSS 或啟動時間被量出來不夠 | Python 3.11 的時鐘到 2027-10；到時至少要換 Python 版本 |
| consumer 概念（02 §3 第 2 項） | 不需要（兩個消費者：Odoo、history） | 第三個要樹上游資料的消費者 | 2 人週 |
| 語言中立 conformance suite（02 §3 第 6 項） | 不需要（單一實作） | 第二個實作者 | 2～3 人週 |
| 帶 jitter 的重連與 backoff、announce 版本協商（02 §3 第 1、4 項） | **需要**，第一天 | — | 不延後 |
| retention window 明寫並監控（02 §3 第 3 項） | **需要**，第一天 | — | 不延後（§4.3） |

意見總結：P0 的語意層（register、SQ/CQ、owner、retention）與方向（child 撥出、Odoo 是 root）在第一個客戶就該全部到位，它們便宜而且反悔很貴；P0 的結構層（多層樹、PKI、每跳 TLS、consumer）在第一個客戶沒有對象，它們貴而且等有對象再做不會變得更貴。P6 的賭注是這個分界線畫得對；最可能畫錯的地方是 PKI：若第二個客戶就是 D-05，Stage 3 會在 Stage 1 之後緊接著來，P6 省下的只是順序，不是錢。
