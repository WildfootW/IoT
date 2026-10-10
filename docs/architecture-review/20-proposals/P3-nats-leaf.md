# 提案 P3：NATS 葉節點（leaf node 就是樹）

> 波次 A 提案架構師 P3，2026-10-10。立場：以 nats-server 當每個 bridge 與 bridge 0 的基底；我們只寫薄 agent、T1 poller、ERP adapter。事實引用 `10-facts/` 的檔名與編號（nats.md N1～N24、transport-through-networks.md T1～T30、mqtt-semantics.md MQ1～MQ28、mqtt-brokers.md 列 1～37、postgres-timeseries.md F-1～F-25、precedents.md e01～e24）。凡本文件自己新增的第三方事實主張，若無來源一律標「未查證」。

## 1. 結論先講：立場、一句話、三個最強理由、兩個最弱點

**立場。** P0 的管理模型（樹、register、SQ/CQ、每跳身分、bridge 圍堵）全部保留；P0 自刻的傳輸層（HTTPS long-poll、reconnect、扇出、每跳快取）換成 nats-server：leaf node 當樹、account 當圍堵、JetStream KV 當 desired/actual、JetStream stream 當 SQ/CQ/量測緩衝、內建 MQTT listener 收講 MQTT 3.1.1 的 T1。unit（螢幕、感測器盒）**不跑** nats-server，只當 client；只有「有 children 的節點」（bridge、bridge 0、F-25 那種同時輪詢 T1 的螢幕）才跑 leaf。

**一句話。** 把 P0 的「自己的協定」縮成「自己的語意」：樹、方向、持久化、扇出、MQTT 入口由一個 Apache-2.0 的 Go 二進位提供；版本、job key、去重、deadline、身分流程仍然是我們的。

**三個最強理由。**

1. **形狀同構，而且方向正確。** leaf 由 leaf 端主動 outbound 連 hub、hub 不需連回、可組任意 acyclic graph（nats.md N1）。F-16、F-17、F-21、F-41、M-04「south 連 north、不反過來」不是我們設計出來的，是它預設的樣子。三種部署形狀只是「leaf 的 remotes 指向哪」的差別（§3）。P0 的 pull-only 代價（每個 child 一條掛著的 long-poll、重啟 thundering herd、命令延遲受 poll 週期限制；02 §1）在這裡消失，因為下行是持久連線上的 push，而 02 §2 已允許「下行一律 pull 改成持久連線上的 push」。
2. **MQTT 的失去感被補回一半以上，且不多一種 broker。** 內建 listener 支援 MQTT 3.1.1 的 QoS 0/1/2、retained、will（nats.md N10），所以 02 §1 列的三項「扇出、retained、last-will」都有；D-06 的現場 HMI 直接訂閱 bridge 本地 subject，不經樹上游（nats.md §3.1 的意見，本文採納）。第 N 個消費者（MES、HMI、Grafana）以 NATS 或 MQTT 訂閱接上，不動裝置，這是 02 §1 說的 Orion subscription 通用扇出在這裡的現成對應。代價是 MQTT 5 不在路線上（N11），§7 會誠實記帳。
3. **正確性的零件是現成且耐久的。** JetStream 給 durable stream、KV（CAS、watch、history）、跨 domain 的 mirror/source、`Nats-Msg-Id` 去重（nats.md N6、N7、N8）。P0 的「register、SQ、CQ、每個節點有自己的狀態庫」可以一對一落在這些零件上，而且 bridge 在 bridge 0 不可達時仍能本地運作（domain 隔離，N6，對應 N-11）。B-01、B-03、B-05～B-08、B-14 的根因（送達被當完成、沒有結果槽、沒有 key）在這個對映下結構上消失（§4）。

**兩個最弱點。**

1. **圍堵邊界從「process」退回「server 內的 account/permission」，而這些功能在 2026 年有密集的 advisory。** nats.md N17：MQTT SUBSCRIBE protocol injection 經 leaf/route 轉發、可能跨 account（CVE-2026-58213，High，官方稱除升級外無完整 workaround）；MQTT retained/QoS replay 繞過 subscribe deny filter（CVE-2026-58209）；leafnode pre-auth crash；mTLS DN 對應繞過。本文件的對策是把 T1 MQTT 入口放進**獨立的 nats-server process**（無 leaf、無 route、獨立 account），讓這類漏洞沒有「轉發」可利用（§3.2），但這是設計推論，沒有任何來源證明它足夠。升級因此是被動且必須快的。
2. **語意複雜度沒有消失，只是從「自製傳輸」換成「正確使用別人的複雜系統」。** KV 不保證 read-your-writes（N7）；`sync_interval` 預設 2 分鐘、`store_dir` 預設 `/tmp`、`max_file_store` 預設 1 TB（N8）；去重視窗預設 2 分鐘（N8）；v2.14→v2.15 預告 ack subject 預設變更會打到自訂 ACL（N9）；跨 account 不支援 push consumer（N6）。每一項都是 F-46/F-47 的潛在破口，而且是我們不控制的時鐘（約 5～7 個月一個 minor、只支援最近兩條 series、無開源 LTS；N20、N21）。制度性知識的成本落在這裡，不會比 P0 少，只是換了對象。

另外兩件要先講清楚的誠實話：unit 上**還是要**有自己的 SQLite（actual、CQ、last-known-good desired），因為純 client 在斷線時沒有耐久緩衝；以及**KV 的 revision 不是 desired.version**（§4.1），version 仍由 ERP 放進 payload。

## 2. 元件清單

| 元件 | 自建或外部 | 授權 | 維護者與時鐘（附來源） | 取代掉什麼 |
|---|---|---|---|---|
| **nats-server**（含 JetStream、leafnode、MQTT listener、WebSocket）；每個 bridge 與 bridge 0 各一個 process；有 T1 MQTT 的 bridge 再多一個「ingress 實例」 | 外部，不嵌入、不改碼，以設定檔管理 | Apache-2.0（nats.md N18；https://raw.githubusercontent.com/nats-io/nats-server/main/LICENSE ，2026-10-10） | CNCF 專案，Synadia 為主要貢獻者；2025-05 商標轉 Linux Foundation、repo 留 CNCF（N19，**二手來源**）；最新 v2.15.1 與 v2.14.8 同日 2026-10-09 發布，約 5～7 個月一個 minor（N20）；支援最近兩條 series、無開源 LTS（N21）；2026-03 與 2026-06 兩批 advisory 命中 MQTT/leafnode（N17）；arm64 壓縮檔 6.28 MB、附 SBOM，執行期 RSS **未查證**（N15） | P0 自刻的 HTTPS long-poll 傳輸、每跳快取、reconnect/backoff、扇出；P2 的 MQTT ingress library；「T1 講 MQTT 要另立 broker」 |
| **`node`**：同一份 code 三種角色。`unit`：NATS client + 本地 SQLite + 綁 localhost 的 function backend 介面；`bridge`：auth callout 處理器、T1 驗證器（schema、限速、時間戳）、registry 鏡像套用、文件快取；`root`：ERP adapter（Odoo JSON-RPC ↔ KV/stream）、身分發行者、PostgreSQL writer、roll-up 排程 | 自建 | 自有 | 我們；語言依 P0 §6 第 2 點 PoC 決定（Python 或 Rust） | 現有 gateway、compose 套件 south、IOTA、Orion、integration hub outbound、QuantumLeap |
| NATS client library（Python `nats-py` 或 Rust `async-nats`，依 node 語言擇一） | 外部 library | Apache-2.0（N18） | nats-py 2.16.0 = 2026-09-16，正拆成 nats-core / nats-jetstream / nats-key-value，後兩者要求 Python 3.13+，jetstream 0.2.0 有 breaking 變更（N22；https://pypi.org/project/nats-py/ ）；async-nats 0.50.0，仍 0.x，半年 0.46→0.50（N23；https://github.com/nats-io/nats.rs/releases ） | P0 的 HTTP client + long-poll 邏輯 |
| function backend：display、LED（LED 控制器）、sensor（感測服務）、Modbus RTU/TCP poller（D-03、T1 poller）。獨立 process，只綁 localhost，經本地協定接同機 `node` | 自建 | 自有 | 我們 | 感測服務、LED 控制器 保留但不再暴露網路（修 B-10） |
| SQLite（`node` 內嵌：unit 的 actual/CQ/last-known-good；bridge 的 registry 鏡像快取） | 外部 library | Public Domain | 版本本文件未另查，**未查證**（P2 查過 3.55.0，本文不重複宣稱） | Orion/IOTA 的 Mongo 狀態 |
| Odoo 19 + `iot_*` 模組（Fleet、Manage、command queue、class driver UI、CMS） | 外部 + 自建 | Odoo 授權**未查證** | Odoo 每年一個大版（02 §1 陳述，未另查證） | 不變 |
| PostgreSQL 18（ERP 既有叢集；歷史為同叢集獨立 database，可選） | 外部 | PostgreSQL License | 18.6 = `REL_18_6` 2026-08-11；PG 18 最後發行 2030-11-14（postgres-timeseries.md F-11，後者為摘要） | CrateDB、QuantumLeap、Mongo ×2 |
| Grafana（可選，只給 ops） | 外部 | 未查證 | 12.4.x 支援到 2027-05-24（02 §4） | 不變 |
| 部署工件：三種形狀的 nats.conf 產生器、compose、firewall templates（N-01）；每個 bridge 的 `store_dir`、`max_file_store`、`sync_interval`、domain 都是**明寫**的設定，不留預設（N8） | 自建 | 自有 | 我們 | compose 套件 |
| IoT_e2e（CI 內以容器跑 hub + leaf + ingress 三個 nats-server）、IoT_Parts | 自建 | 自有 | 我們 | 不變 |
| **不採用**：操作 JWT 的 `nsc` 工具鏈、nats-server 的 Go 嵌入（N16 會把 node 鎖成 Go，與 P0 §6 第 2 點衝突）、Mosquitto（除非出現 MQTT 5-only 的 T1，見 §7） | — | — | — | — |

**種類數（M-02）。** 計法沿用 P2：引擎、語言、runtime、repo 各算一種；外部 library 以「時鐘」計一種、不算 runtime。對 owner 的兩個問題直接回答：

- **Go 二進位是一種 runtime 嗎？** 是。它是我們部署、監控、升級、要讓它 N-07「crash 後乾淨重啟」的常駐 process，和 Odoo、node 一樣。它**不是**一種語言，因為我們不寫 Go、不嵌入（N16）。
- **不改它的 code 算不算一種要維護的東西？** 算。要維護的不是 code，是：`nats.conf` 這個方言、JetStream 的語意知識（domain、mirror、KV 一致性、去重視窗）、`store_dir` 的備份還原（N-09）、advisory 追蹤與每半年一次的升級（N17、N20、N21）。種類數算的是「要懂、要顧的東西」，不是「要 commit 的東西」。

| 類別 | 標準部署（Python node、含 Grafana、無 T1 MQTT） | 最小部署（一片螢幕） | 有 T1 MQTT 的站點 |
|---|---|---|---|
| 引擎 | PostgreSQL、SQLite、**nats-server（JetStream）** = 3 | 3 | 3（ingress 實例是同一引擎的第二個 process，不加種類） |
| 語言 | Python = 1（node 選 Rust 則 +1） | 1 | 1 |
| runtime | Odoo、node、**nats-server**、Grafana = 4 | Odoo、node、nats-server = 3 | 4 |
| repo | node、ERP 模組、部署工件、e2e、Parts = 5 | 5 | 5 |
| 外部 library 時鐘 | NATS client library = 1 | 1 | 1 |
| **合計** | **14** | **13** | **14**（若出現 MQTT 5-only T1 而加 Mosquitto：15） |

對照同一計法：P0 = 11，P2 = 12（D-06 站點 13）。P3 **淨增 +3**：nats-server 當引擎與當 runtime各算一次，加 client library 一個時鐘。P3 刪掉的是 P0 的自製傳輸 code 與 P2 的 MQTT ingress library，但「code 變少」不是「種類變少」，M-02 的帳本 P3 是六個提案裡偏差的一方；它要靠 R1、R3、R5 的所得來還。

## 3. 拓樸、圍堵、身分

### 3.1 三種部署形狀

共同規則：**只有有 children 的節點跑 nats-server**。unit 是純 client；bridge 跑一個 leaf（對上 remotes、對下 4222 給 unit）；bridge 0 跑 hub。每個跑 JetStream 的 server 有自己的 domain（N6），bridge 0 是 `root`。有 T1 MQTT 的 bridge 多跑一個 ingress 實例。

**(a) south/north 同一台主機（最小部署就是這個）**

```
┌──────────── 站點主機（單一 hypervisor，C-25）────────────────────────────────┐
│ Odoo ──JSON-RPC/localhost── node[root] ──NATS client/localhost── nats-server[hub] │
│                               ERP adapter、發行者、                  JetStream 域 root   │
│                               callout、PG writer                    :4222 TLS（IoT 腳）  │
└──────────────────────────────────────────────────────────┬────────────────────┘
                                             TLS + NKey（螢幕 VLAN → 主機 IoT 腳，只開 4222）
                                      ┌───────────────────┴───────────────────┐
                                      │ CM4 螢幕：node[unit] + display backend │
                                      │ 純 NATS client；SQLite 持有 actual/CQ/快取  │
                                      └───────────────────────────────────────┘
```

三個服務：Odoo、nats-server、node（root 角色把 adapter、callout、writer 放同一 process）。沒有感測器就沒有量測 stream，JetStream 只放 DESIRED/ACTUAL/SQ/CQ/REGISTRY/DOCS 幾個小 bucket。

**(b) 同站不同 VLAN**

```
VLAN 10（IT/ERP）                 VLAN 20（T2：螢幕、感測器盒）          VLAN 30（T1：Modbus 儀表、講 MQTT 的 PLC 閘道）
┌────────────────────┐            ┌─────────────────────┐              ┌────────────────────────┐
│ Odoo               │            │ CM4 ×N              │              │ 電表 Modbus TCP :502     │
│ node[root]     │            │ node[unit]      │              │ PLC 閘道 MQTT 3.1.1      │
│ nats-server[hub]   │            │ (client → leaf:4222)│              └───────┬────────┬───────┘
│   域 root          │            └──────────┬──────────┘        bridge 主動 Modbus│        │T1 主動 → :8883
│   leaf listener    │                       │                                   ▼        ▼
│   :7422 TLS+mTLS   │◀── leaf outbound ──┐  │        ┌─────────────────────────────────────────────┐
└────────────────────┘                    │  └───────▶│ bridge 主機（VLAN 20 / VLAN 30 雙腳，不轉送 IP）│
                                          └───────────┤ nats-server[leaf] 域 b1  ← node[bridge]  │
                                                      │ nats-server[ingress]：MQTT 8883，帳戶 T1IN，   │
                                                      │   無 leaf、無 route、獨立小 JetStream           │
                                                      │ Modbus poller（function backend，localhost）    │
                                                      └─────────────────────────────────────────────┘
```

防火牆（採 transport-through-networks.md §3.2 的 8 條 default-deny 規則）：VLAN 30 只准 T1 → bridge:8883（有 MQTT T1 時才開）與 bridge → T1:502；VLAN 20 只准 unit → bridge:4222；bridge → VLAN 10 只准 leaf:7422 outbound。south 底下再一個 south（F-16 可堆疊）= 再放一台 bridge 主機、remotes 指向上一層 bridge 的 leaf listener；**三層以上的 leaf 鏈官方只以「任意 acyclic graph」一句話描述，沒有範例與限制資料（N2），列入 PoC**。

**(c) 客戶 ERP 在我們營運的雲端，站點只有 outbound**

```
我們營運的雲端                                        客戶站點（只有 outbound；可能只放 443、可能有 TLS 檢查 proxy）
┌──────────────────────────────────┐                 ┌───────────────────────────────────────────┐
│ Odoo（客戶 A）  node[root A]  │                 │ bridge 主機                               │
│ nats-server[hub]                 │                 │  nats-server[leaf] 域 siteA1              │
│   每客戶一個 account              │◀── wss://:443 ──┤    remotes: wss://hub.<ours>/  （經客戶 proxy）│
│   leaf listener 走 WebSocket     │  TLS + NKey      │    ping ≤ 30 s                             │
│   前面是 L4 LB，或 WS-aware LB    │  （mTLS 若 proxy 放行）│  node[bridge]                        │
│                                  │                 │  nats-server[ingress]（有 T1 MQTT 時）       │
└──────────────────────────────────┘                 │  螢幕、感測器 → leaf:4222（站內）             │
                                                     └───────────────────────────────────────────┘
```

成立條件（事實依 transport-through-networks.md）：

1. **leaf 必須走 WebSocket，不能走 7422。** 只放 443 的網路 7422 直接死（§5 表）；leaf 可用 `ws://` URL 出站（自 v2.2.0，N4）；是否 TLS 由設定區塊決定不是 URL scheme（N4）。
2. **keepalive 要調到路徑最小 idle 之下。** nginx/ALB 預設 60 秒（T7、T8），NATS `ping_interval` 預設 2 分鐘（T16）；本提案把 leaf 的 ping 設 ≤ 30 秒。雲端 LB 要放行 Upgrade 並拉長 idle，或改用 L4 LB 讓 nats-server 自己終結 TLS（T5：L7 LB 終結 TLS 後 client cert 只剩 header 轉述）。
3. **身分不能只靠 TLS client cert。** 有 TLS 檢查 proxy 時 mTLS 要嘛被 bypass、要嘛失敗（T1～T3，皆為摘要）。NATS 的 NKey 認證是應用層的 nonce 簽章（N14），不依賴 client cert，這是 NATS 在 (c) 形狀相對 P0 的結構優勢（transport-through-networks.md §5 表「推論」）。mTLS 在這條邊是「有 bypass 時的加強」，不是唯一防線。
4. **HTTP CONNECT proxy 與 TLS 攔截下的 leaf WebSocket 行為未查證**（N4；transport-through-networks.md §4 第 6 點）。release notes 有「Remote proxies gained TLS support for https:// URLs」一句（v2.15.1 / v2.14.8，N4），細節未讀。這是 (c) 形狀上線前**必做**的 PoC，且在客戶 proxy 要帳密認證時可能需要客戶 IT 配合。
5. **hub 要有人營運。** 每客戶一個 account（N5：account 預設互不可見），hub 的升級節奏由 advisory 推著走（N17）。這是 P0 沒有的營運面。

### 3.2 hostile T1 怎麼被圍堵

T1 有兩種：Modbus（絕大多數）與講 MQTT 的。Modbus 由 bridge 主動輪詢，T1 不開任何連線進來，與 P0 相同。講 MQTT 的 T1 走以下四層：

1. **網路層**：T1 VLAN 只准 T1 → bridge:8883。C-25 的共享 PSK Wi-Fi 在威脅模型裡視為零加密（T27），所以 8883 必須 TLS。
2. **process 層**：MQTT listener 開在**獨立的 ingress 實例**，不是跑 leaf 的那個 nats-server。ingress 沒有 `leafnodes.remotes`、沒有 route、沒有任何往上的憑證。N17 的 CVE-2026-58213 是「MQTT SUBSCRIBE 注入經 leaf/route 轉發」，拿掉 leaf/route 就拿掉那條路（**設計推論，無來源證明充分**）。代價是同一台 bridge 兩個 nats-server process、兩個 JetStream `store_dir`（MQTT 強制 JetStream，N10）；但不多一種東西。
3. **account 與 permission 層**：每個 T1 一個 MQTT 使用者（帳密或 client cert `verify_and_map`，N12），綁 `T1IN` account，只准 publish `t1.<id>.>`、不准 subscribe（T1 不收命令；T1 的下行命令若有，當 P0 的 job 由 bridge agent 以 Modbus 或 MQTT publish 送出，不依賴 MQTT QoS，依 nats.md §3.3）。`max_payload` 在 ingress 設小（N8 預設 1 MB，建議 64 KB，數字是本文件的設計值）。`allowed_connection_types: MQTT` 限定該使用者只能從 MQTT 進（N12）。
4. **應用層（我們的守門員）**：`node[bridge]` 以第二條連線接 ingress 的 `T1IN`，對每筆訊息做 F-31 的 schema 檢查、F-01 的限速、F-02 的時間戳規則，通過者才以 **bridge 自己的身分**重新發到 leaf 的 `fleet.<bridge>.fn.<t1-id>.meas`。`T1IN` 與 `FLEET` 之間**沒有** export/import（N5），hostile T1 的訊息沒有任何路徑不經過我們的 code 進入樹。NATS 不檢查 payload、也沒查到每 client 速率限制（nats.md §5.1 第 3 點），所以限速是我們的。

這比 P0「node 是唯一持有網路憑證的 process」弱，因為 T1 直接對一個外部 server 講話；比 P1「T1 直接進 broker、靠 topic ACL」強，因為多了 process 隔離與一個必經的驗證器。

### 3.3 身分：bootstrap → adopt → revoke

**誰終結 TLS**：每一跳的 nats-server。unit → bridge leaf、bridge leaf → 上層（hub 或上層 bridge）、T1 → ingress，各自是獨立 TLS session；bridge 收到的東西以自己身分重發（P0 §1 第 5 點原封保留）。

**誰是唯一的發行者（SC §2.2）**：`node[root]`。它做三件事：(1) 每環境一張 CA（N-04）簽所有 nats-server 的 server cert 與 bridge 間 leaf 連線的 mTLS cert；(2) 維護 KV `REGISTRY`（domain root），每把 NKey 公鑰一個 key，值為 `{status: manufactured|adopted|revoked, path, functions, ts, sig}`，由 root 以自己的 Ed25519 key 簽；(3) 經 JetStream mirror 把 `REGISTRY` 推到每個 bridge（N6 的跨 domain mirror）。T1 的帳密是 bridge 本地的、不會在樹上說話，所以不算第二個發行者（T1 「registered, not adopted」，00 §4.2 tier 表）。

**身分載體**：每個 T2/T3 節點一把 Ed25519 NKey（seed 在裝置上產生，公鑰印成 QR，F-36）；T3 另有硬體 key 對 announce 簽章（tier 表），NATS 看不到它，由 `node[bridge]` 驗。不用 operator/JWT 模式與 `nsc`：N14 說 revocation 要改 account JWT 並推到每台 server、跨 leaf 的 resolver 傳播未查證，且 MQTT 用的 bearer JWT 可重放（nats.md §3.2）。改用 **auth callout**：nats-server 把每個連線的認證交給我們的服務決定（nats.md N24 提及其存在與 2.15.1 修了 `auth_users` bypass；**callout 的 API 細節與是否適用於 leafnode 連線，本文件未查證**，列 PoC 第一項）。

流程：

1. **bootstrap**：unit 第一次開機以 NKey 連上 bridge 的 4222。callout 查本地 `REGISTRY` 鏡像：公鑰不存在 → 拒絕（裝置收到的是連線層的授權錯誤，與 TCP/TLS 層的網路錯誤可區分，滿足 tier 表「分辨 rejected 與 unknown」；錯誤訊息的確切格式**未查證**）；`manufactured` → 放進 `LOBBY` account，只准 `lobby.<pubkey>.announce` publish 與 `lobby.<pubkey>.>` subscribe。unit 送 announce（config space：序號、功能、class、schema、capability，F-06 修 B-09）。Fleet 看得到「present, unadopted」（F-26）。
2. **adopt**：操作員在 ERP 按 Manage（F-33）→ `node[root]` 先寫 `REGISTRY[pubkey].status = adopted` 並簽章（「寫到別人看得到的地方之後才建自己的紀錄」，F-33）→ mirror 到 bridge → bridge agent 對 `lobby.<pubkey>.adopted` 發一則訊息 → unit 重連 → callout 給 `FLEET` account、permission 限在 `fleet.<pubkey>.>` publish 與 `fleet.<pubkey>.desired.>`、`sq.<pubkey>.>` subscribe。callout 核發的授權帶短效 expiry（設計值 1 小時），到期由 server 斷線、unit 重連再核發；**server 是否確實在 expiry 到時斷線，未查證**。
3. **revoke**：`REGISTRY[pubkey].status = revoked`（簽章）→ mirror → callout 從此拒絕；bridge agent 另發簽過名的 `lobby.<pubkey>.revoke`，T3 據此可做 lock/wipe（tier 表「破壞性動作要正面簽章訊號」）。**立即生效**要靠 system account 踢掉既有連線；該能力是否存在與其 API **未查證**；若無，撤銷窗口 = 授權 expiry（1 小時，可調小到分鐘級，代價是重連頻率）。P0 的「拒絕續期即撤銷」同樣以心跳週期為窗口，兩者等價。
4. **bridge 0 不可達時**：bridge 用手上最後一份 `REGISTRY` 鏡像繼續放行已 adopt 的 unit（N-11）；新 adopt 與 revoke 等鏈路回來。這是 P0 §4 的設計原封搬過來。

N-04（每環境一張 CA、staging 不帶有效 trust）：CA、root 簽章 key、`REGISTRY` 都是每環境一套；從 prod 複製到 staging 的 `REGISTRY` 鏡像簽章對 staging 的 root key 無效，callout 一律拒絕。

## 4. 命令與回報語意

### 4.1 對映

| P0 概念 | JetStream 落點 | owner（N-05 一個事實一個寫入者） | retention window（明寫、要監控） |
|---|---|---|---|
| desired register | KV `DESIRED_<bridge>`（domain root，mirror 到該 bridge）；key `<unit>.<fn>`；值 `{version, payload, issued_at, issuer, sig}` | ERP（經 `node[root]` 以 KV `update(expected_revision)` CAS 寫入） | history 1（只留最新）；bucket `max_bytes` 明寫；ERP 的 Odoo rows 是最終擁有者，KV 是鏡像 |
| actual register | KV `ACTUAL_<bridge>`（domain bridge，source 到 root 的 `ACTUAL_ALL`）；值 `{version_applied, state, device_ts}` | 裝置（unit agent 寫，同時留 SQLite） | history 1；unit SQLite 永久保留最後一份 |
| SQ（job） | stream `SQ_<bridge>`（domain root，mirror 到 bridge）；subject `sq.<unit>.<fn>`；header `Nats-Msg-Id = job_key`；payload `{job_key, body, deadline, sig}` | ERP（F-41 命令佇列由 ERP 擁有；Odoo row 是最終擁有者） | `max_age` = 最長 deadline + 1 天（設計值 8 天）；去重視窗由預設 2 分鐘改為明寫 10 分鐘（N8）；過期訊息被 stream 丟掉時 ERP 的 deadline 狀態機已標 `timeout`（F-50） |
| CQ（結果） | stream `CQ_<bridge>`（domain bridge，source 到 root `CQ_ALL`）；subject `cq.<unit>.<fn>.<job_key>`；`max_msgs_per_subject = 1` | 裝置（unit agent 以 JetStream publish + ack 寫入，同時留 SQLite） | stream `max_age` 90 天；unit SQLite 依 key 保留最近 1000 筆或 90 天；超過即是「結果丟了」，由 ERP 標 `unknown`（02 §1 承認的 retention 問題在此明寫） |
| 量測 | stream `MEAS_<bridge>`（domain bridge，source 到 root `MEAS_ALL`）；subject `meas.<unit>.<fn>` | 裝置（bridge 代 T1 寫，F-01/F-02 由驗證器執行） | bridge 7 天緩衝（N-11 斷線期間）；root 端 writer 寫進 PG 後 ack；PG 3 年 = drop partition |
| 心跳 / presence | core NATS `fleet.<unit>.hb` 每 120 秒；bridge agent 寫 KV `PRESENCE`（device_ts） | bridge（彙總），F-27 以裝置時間判斷 | KV history 1；online/offline **轉變**才成為 ERP 事件（F-30） |
| announce / config space | request/reply `announce.<unit>` 到 bridge agent；bridge 合成子樹寫 KV `TOPOLOGY` | bridge（子樹）、root（整樹） | history 1 |
| 文件（playlist、assets） | Object Store `DOCS`（domain root，mirror 到 bridge）；unit 向本地 bridge agent 取（N-11 在 bridge 快取；消 C-24 的直連防火牆規則） | ERP（F-55） | 由 ERP 的版本決定；bucket `max_bytes` 明寫；object store 檔案須放得進單一檔案系統（N7） |

**KV 的 revision 是否就是 desired.version？不是，原因有三。** (1) revision 是「這個 bucket 實例」的序號；mirror 後的序號是否與來源一致、備份還原或 bucket 重建後是否延續，**未查證**，而 version 必須在 10 年內跨這些事件穩定。(2) N-05 要求 desired 的寫入者是 ERP 且可歸因；version 若由 JetStream 指派就不是 ERP 的事實。(3) 業界先例都把 version 放在服務端文件裡：Azure twin 的 `$version` + ETag（MQ14）、AWS Shadow 的 `version`（MQ15）。所以：**version 由 ERP 單調遞增、放在 payload**；KV revision 只拿來做兩件事：`update(expected_revision)` 強制單寫者，與 watch 重連時的「我有沒有漏掉」水位。

**reconciler 仍是我們的。** `done = ACTUAL.version_applied == DESIRED.version` 由 `node[root]` 比對後寫 ERP；job 的 `unknown → timeout` 狀態機與 single-flight per device 在 root；裝置端依 `job_key` 去重並冪等 apply。NATS 給零件，不給這段邏輯（nats.md §3.3；mqtt-semantics.md §5 對 MQTT 的結論同理）。

### 4.2 F-46～F-54 逐條

| ID | 判定 | 一句理由 |
|---|---|---|
| F-46 | 成立 | 每個事實有耐久擁有者（ERP rows / unit SQLite）並在 JetStream 有可重讀鏡像；ERP 或 unit 任一方 down 時命令留在 `SQ_*`（durable）與 Odoo row，結果留在 unit SQLite 與 `CQ_*`；漏掉的結果靠重讀 `CQ_*` 或 unit 的 `cq.<unit>.<fn>.<key>`，沒有每命令的 poll loop。但 **retention window 之外就是丟**（§4.1 明寫）。 |
| F-47 | 成立 | state intent = KV key；job = stream 訊息帶 `job_key`；done 的兩種定義各有對應的可觀察事實。 |
| F-48 | 部分 | 每跳 TLS、NKey 身分、subject permission 限制誰能寫 `DESIRED`；desired 與 job 由 root 簽章，unit 驗簽（defacement 防線不依賴 NATS）。「部分」是因為在 (c) 形狀過 TLS 檢查 proxy 時，hop 間的機密性讓給 proxy，只剩完整性與身分。 |
| F-49 | 成立 | `CQ_ALL`、`ACTUAL_ALL` 在 root 由 adapter 消費後寫 ERP；第 N 個消費者自行訂閱，不改裝置。B-05「只訂了一個命令的結果」結構上不可能再發生。 |
| F-50 | 成立 | PUBLISH ack 只代表 JetStream 收到（與 F-46 一致）；deadline 狀態機在 root；過期訊息由 stream 丟棄前 ERP 已標 `timeout`。 |
| F-51 | 成立 | 去重：裝置依 `job_key`（SQLite），`Nats-Msg-Id` 只擋 adapter 重送；順序：root 對每裝置 single-flight；過期：ERP 的 deadline。三者都有具名 owner。 |
| F-52 | 成立 | 送達是 JetStream ack，完成是 `CQ_*` 一筆新訊息；長 reconcile 不在任何連線的請求週期內（修 B-07）。 |
| F-53 | 成立 | CQ payload 的 status 列舉含 `error` 與 `rejected`，由 unit agent 讀 backend 回傳值寫入；NATS 不會替我們把失敗寫成成功（修 B-06）。 |
| F-54 | 成立 | KV watch 在每次重連重送最新 desired，裝置必須對重複 desired 冪等；`rejected` 狀態寫進 `ACTUAL`。 |

B 清單對照：B-01（任何例外標 error、7 天刪）→ CQ 90 天 + ERP row 永久，而且 `unknown` 與 `error` 分開；B-02、B-03（無版本檢查）→ `version_applied` 比對；B-08（無 key）→ `job_key` 必填；B-11（忽略心跳回應）→ callout 的拒絕是連線層錯誤，agent 一定看得到；B-14 → `ACTUAL` 是量測，`CQ_*` 可重讀。會重現的見 §8。

## 5. 回傳資料

**量測怎麼到 store。** function backend（感測服務、Modbus poller）→ 本地協定 → `node[unit]` 或 `[bridge]`，在最近感測器的節點打時間戳（F-02），做 ≤ 1 Hz 的本地聚合（F-01）→ JetStream publish 到 `MEAS_<bridge>`（bridge 本地，斷線期間 7 天緩衝）→ source 到 root `MEAS_ALL` → `node[root]` 的 durable pull consumer 批次寫 PostgreSQL 後 ack。bridge 0 仍是 writer 的單點，但緩衝在每個 bridge 本地，與 P0 相同、比 P0 少寫一層緩衝 code。

**store 是什麼。** 採 postgres-timeseries.md §3.2 的選項 A：ERP 叢集內獨立 database，窄表 `(series_id, ts, value)` + 月分區 + `node[root]` 排程跑純 SQL 的增量 roll-up（避開 materialized view 全量重算，F-13；避開 `pg_cron`/`pg_partman` 的 `shared_preload_libraries`，F-14、F-15）。retention = drop partition（F-12）。觸發「搬到獨立 PG 實例或 TSDB」的門檻沿用該檔 §3.4：單站樣本 ≳ 10～30 億或 `history` 大小超過 ERP database 2 倍。writer 做成介面，換 store 只動 root 的一個 adapter。VictoriaMetrics 不選：mTLS、downsampling、LTS 皆 Enterprise（F-21）。

**第 N 個消費者。** 三種接法，都不動裝置：(1) **現場 HMI（D-06）**：以 NATS client 或 MQTT 3.1.1 client 連 bridge 的 leaf server，使用者綁 `FLEET` 的 subscribe-only 權限訂 `meas.>`；MQTT 訂閱者一律收 QoS 0（N10），對 Sparkplug B 的 NDATA 本來就規定 QoS 0（MQ19）所以不衝突，對要 QoS 1 的 HMI 不成立（§7）。(2) **MES**：在 root 建自己的 durable consumer 讀 `MEAS_ALL` 或 `CQ_ALL`，或直接查 PG；跨 account 若要分租戶，export/import 的 stream 可以，但 push consumer 不支援（N6），MES 要用 pull。(3) **Grafana**：PostgreSQL datasource，只給 ops。

**F-01～F-15 哪些不成立。** 全部成立或可成立，兩條要加註：F-04（沒有資料就是沒有）要靠驗證器不把 retained 的舊 T1 值當新值轉發，JetStream 的 retained MQTT 訊息（N10）會讓新訂閱者收到舊值，所以 HMI 端要看 `device_ts`，這是 F-27 同一個「以裝置時間判斷」的規則；F-15（最小部署不需歷史 store）成立，但要說明 JetStream 的 bucket 本身是一個小狀態庫，一片螢幕的部署也有 `store_dir` 要備份（N-09），不是「零狀態」。

## 6. D-01～D-06 逐一走過

**D-01 螢幕。** desired = `{version, playlist_doc_ref}` 寫 KV；文件本體在 Object Store `DOCS` mirror 到 bridge，unit 從本地 bridge agent 取，不再直連 ERP（消 C-24；N-11 在 bridge 快取）。display backend 走 reconcile 介面（F-61），actual 回報 `version_applied`（修 B-14）。三種形狀都成立；(c) 形狀下螢幕只連站內 bridge。MES live board 的「每 5 秒 poll 一個 token 保護的 JSON」（F-63）是螢幕瀏覽器對站內 MES 的 HTTP，不經樹，與本提案無關。最小部署見 §3.1 (a)。

**D-02 環境感測。** 感測服務 為 localhost backend，30 秒均值經 unit agent 進 `MEAS_*`。門檻規則當 desired register 推到持有資料的節點計算（P0 §5），越線事件以 `fleet.<unit>.evt` 送、root 寫 ERP（F-03）。Fleet 看得到、不可管理（D-02 原文）。

**D-03 Modbus 旁路量測。** Modbus RTU/TCP poller 是 bridge 上的 function backend，與 P0 完全相同；T1 的代表由操作員在 bridge 宣告協定與位址（00 §9），bridge 建立並 announce。NATS 在這條路上只是 bridge → root 的搬運。

**D-04 LED。** config、effect、playlist add/remove/resume 是 job（SQ/CQ）；show 是一個 intent，時序在裝置本地（F-44）；capability 隨 announce 進 `TOPOLOGY`，ERP 用它驗 effect（F-06，修 B-09）。F-45 standalone：unit 斷線時用 SQLite 的 last-known-good。

**D-05 門禁（管理面在範圍內，控制通道不在）。** 身分、存活、設定走 §3.3 的 T3 路徑（硬體 key 簽 announce；NKey 只是連線身分）。刷卡、考勤這類**非狀態事件**天生是訊息，放 stream `EVT_<bridge>` durable、source 到 root，比 P0 的 register 模型合適（02 §1 承認的 D-05 限制在此緩解）。鎖的控制通道另建，不走這條；NATS 的 permission 不能取代 DESFire/OSDP 層的安全（nats.md §3.1 意見）。「客戶 IT 會問平台有什麼認證」（02 §1）：nats-server 有 2025-04 Trail of Bits 稽核（N17，README 陳述），這是 P0 自製協定沒有的東西，但不涵蓋我們的 agent。

**D-06 機台遙測。** 低延遲 HMI 層：edge controller（T1，Sparkplug B 或原生 MQTT 3.1.1）→ ingress 實例 → 驗證器 → leaf 的 `meas.>` → HMI 在**同一台 bridge** 訂閱，延遲是本機兩跳、不經樹上游。Sparkplug 的 BIRTH/DATA/Rebirth 語意由驗證器理解（MQ17～MQ19），命令面不用 Sparkplug（NCMD QoS 0、Clean Session，MQ19、MQ20）。業務層與分析層走 §5。若 edge controller 是 MQTT 5-only，見 §7。

**D-05 的管理面補充。** 多站部署「軟體體驗是賣點」：adopt 在 ERP 一鍵、registry 自動 mirror 到該站 bridge、無需到站設定，這是 §3.3 流程的直接結果。

## 7. 妥協清單

| 需求 ID | 妥協內容 | 換到什麼 | 代價 |
|---|---|---|---|
| M-02 | 種類數 11 → 14（nats-server 當引擎 + runtime、client library 一個時鐘） | 樹、方向、持久化、扇出、retained/will、MQTT 3.1.1 入口、KV/stream 零件；刪掉 P0 的自製傳輸與 P2 的 MQTT ingress library | 一個外部引擎的語意知識與 `nats.conf` 方言；client library 正在重構（N22、N23） |
| M-06 | 接受約每半年一次、由 advisory 推動的 nats-server 升級；只支援最近兩條 series、無 LTS（N20、N21） | 有人在審、在修（Trail of Bits 稽核與其回報的 advisory，N17）；P0 自製協定沒有外部審查 | 錯過兩個 series 就沒有修補；fleet 中每台 bridge 都是要升級的 server |
| N-13 / 錨點 7 | 最小部署 2 → 3 個服務（Odoo、nats-server、node） | 一片螢幕就有 push 下行、durable SQ/CQ、未來加感測器與 T1 不改架構 | 多一個 process、多一個 `store_dir` 要備份 |
| N-02 | (c) 形狀 site→cloud 這條邊，有 TLS 檢查 proxy 時 mTLS 退為 TLS + NKey 應用層身分 | 連線穿得過；身分不丟（N14 的 nonce 簽章） | hop 機密性讓給客戶 proxy；靠 payload 簽章保完整性 |
| M-04 / F-18 | T1 MQTT 入口的圍堵從「只有 node 持有網路憑證」退為「獨立 nats-server process + account + 我們的驗證器」 | T1 不需我們寫 MQTT 協定碼；retained、will、QoS 1 上行都有 | 圍堵的最後一層是 NATS 的 permission 實作（N17 有前科） |
| 02 §2「下行一律 pull」 | 改成持久連線上的 push（KV watch、pull consumer 的長連線） | 命令延遲與 poll 週期解耦；沒有 thundering herd 的 long-poll | keepalive 必須 ≤ 30 秒才過得了 60 秒 idle 的 proxy（T7、T16） |
| 02 §2「每個節點都自建」 | bridge 與 bridge 0 的傳輸與持久化改用外部元件 | 見 M-02 列 | 見 M-02 列 |
| R5（T1 MQTT 5） | 內建 listener 只到 3.1.1，維護者明確不收 MQTT 5（N11） | 不多一個 broker | MQTT 5-only 的 T1 出現時要在 ingress 前放 Mosquitto（+1 種，mqtt-brokers.md 列 1～9）或由驗證器當 MQTT 5 client 去訂它（+1 library） |
| R5（D-06 HMI QoS） | MQTT 訂閱者一律 QoS 0（N10） | 本地 HMI 不經樹上游 | 要 QoS 1 的 HMI 不成立；Sparkplug B 資料面不受影響（MQ19） |
| F-46 的 retention | retention window 以 JetStream `max_age`/`max_msgs_per_subject`/去重視窗三個數字明寫 | 數字集中在設定檔、可監控（stream info 的 first_seq 跳動 = 丟棄） | 丟棄對發布端靜默，監控是我們的責任 |
| 無妥協 | F-41、F-21、C-12、N-11、F-33、N-04、N-05 | 不需要：leaf 方向、domain 隔離、CAS 單寫者、每環境一套 key 都是現成的 | — |

## 8. 已知弱點

1. **advisory 密度落在我們依賴的面積上**（N17）。對策是 ingress 隔離（§3.2）與「升級在 advisory 發布後 N 天內完成」的 runbook，但 CVE-2026-58213 類「無 workaround」的項目代表那 N 天內 fleet 是暴露的。這是 C-09（無驗證、tenant 為 header）那一類「平台邊界比想像弱」的教訓在不同位置重現的風險，發生在「T1 MQTT 進 ingress」這一步。
2. **預設值陷阱**（N8）：`store_dir=/tmp`、`max_file_store=1TB`、`sync_interval=2m`。任何一台 bridge 漏設就是 C-14（compose 預設值害人）重現，位置在部署工件。對策：nats.conf 由產生器輸出、e2e 斷言這三個值；單副本 leaf 的 `sync_interval` 設 `always`（吞吐掉到數百 msg/s，對 ≤ 1 Hz 幾百感測器夠；對 eMMC 壽命的影響**未查證**）。
3. **去重視窗與 KV 一致性**：`Nats-Msg-Id` 2 分鐘預設只是 adapter 重送的保護，不是 F-51；KV 無 read-your-writes（N7）表示 adapter 寫完 desired 立刻讀可能讀到舊值，reconciler 要以 revision 水位而非「讀回來」判斷。寫錯就是 C-04（`PENDING` 與 `OK` 競態）在 root adapter 重現。
4. **`<cmd>_info` 式 last-writer-wins（C-07）**：KV `ACTUAL` 本身也是 last-writer-wins；不重現的前提是 version 在 payload 且 CQ 以 `job_key` 分 subject。若有人把兩個 job 的結果寫同一 subject，C-07 回來。
5. **三層以上 leaf 鏈、mirror of mirror、filtered mirror**：N2 無資料；可堆疊 south（F-16）在 PoC 前只能視為「文件說可以」。
6. **auth callout 細節、是否適用 leafnode 連線、revoke 時踢連線的能力、授權 expiry 是否斷線**：皆**未查證**（§3.3）。若 callout 不適用 leaf 連線，bridge 間改用 mTLS `verify_and_map`，而 N13 註明它「取第一個找到的使用者、無法限制」，且曾有 DN 對應繞過 advisory（N17）。
7. **WebSocket leaf 過 HTTP CONNECT proxy 與 TLS 攔截**：未查證（N4）。(c) 形狀的存活率在 transport-through-networks.md §5 表只是「低到中」的推論。失敗的退路是把 site→cloud 這一跳換成 P0 的 HTTPS long-poll（站內仍用 NATS），那就是 P5 的形狀，M-02 再加一種。
8. **client library 時鐘**：nats-py 拆包、新套件要求 Python 3.13+（N22）；async-nats 0.x 半年四個 minor（N23）。node 若選 Python 且 CM4 的 Debian 版本的 Python 低於 3.13，就被卡在舊 nats-py 線。
9. **治理**：2025 年單一商業公司曾試圖改授權（N19，二手）；5 位 maintainer 的組織分布未查到（N19）。Apache-2.0 讓 fork 在法律上可行，但 nats-server 的內部知識我們沒有，fork 等於買一個不會動的時鐘。
10. **B-13 類「停止與重啟」問題**：兩個 nats-server + 一個 node 在同一台 bridge 的 systemd 依賴順序（ingress 先於 leaf？callout 服務先於 server 接受連線？）是 N-07 的新面積；e2e 要覆蓋 reboot 順序。
11. **CM4 足跡全部未查證**（N15、nats.md §4 第 4 點）：有 JetStream + MQTT 的 RSS、數百 MQTT client、leaf 重連 storm。PoC 第一週的事。

## 9. 成本與可逆性

**到第一個客戶價值的人週（假設：1～2 人、AI 輔助、node 語言已由 P0 §6 第 2 點的 PoC 決定、不含外部安全審查的日曆時間）。** 目標：3 片螢幕 + 5 個感測器（2 個 Modbus、3 個 感測服務）+ 一個同站 ERP（形狀 b），(c) 形狀列為第二里程碑。

| 項目 | 人週 | 備註 |
|---|---|---|
| PoC：CM4 上 nats-server（JetStream + MQTT）RSS、`sync_interval=always` 吞吐、callout 可行性、三層 leaf | 2 | 任一項失敗就回 P2 或 P5；這 2 週是「買保險」 |
| nats.conf 產生器 + 三種形狀的 compose/firewall 工件 + e2e 斷言預設值 | 2 | N-01、N8 |
| `node[unit]`：announce、KV watch、SQ pull consumer、CQ publish、SQLite、backend 介面 | 3 | 比 P0 少 long-poll/reconnect，多 JetStream client 語意 |
| `node[bridge]`：callout、registry 鏡像套用、T1 驗證器（schema/限速/時間戳）、DOCS 快取 | 3 | 驗證器是 M-04 的核心 |
| `node[root]`：Odoo adapter（CAS 寫 desired、ACTUAL/CQ 消費、事件）、deadline 狀態機、發行者、PG writer + 分區 + roll-up | 4 | reconciler 邏輯是 P0 也要寫的部分 |
| display backend 接 reconcile 介面、Modbus poller 接 backend 介面 | 1.5 | 多為既有 code 搬家 |
| 身分流程 bootstrap/adopt/revoke 端到端 + N-04 環境隔離 + e2e | 2 | 外部對抗審查另計（02 §3 第 5 點） |
| CI：三個 nats-server 容器 + 無硬體 stub（N-16、N-17） | 1.5 | |
| **合計** | **19（範圍 16～23）** | (c) 形狀再加 2～3（WS/proxy PoC 與雲端 hub 營運工件） |

與 P0 比較（意見）：P3 省掉傳輸層（約 2～3 人週）但多 JetStream 語意與 callout（約 2～3 人週），總量相近；差別在風險分布：P0 的風險在「自製傳輸第五版」，P3 的風險在「別人的預設值與 advisory」。

**三年後想換掉其中一塊要付多少（意見）。**

| 要換的 | 代價 | 理由 |
|---|---|---|
| nats-server → 別的傳輸（Mosquitto + 自製樹、或 P0 的 HTTPS） | 6～10 人週 | `node` 三角色都碰 JetStream API；若第一天就把 KV/stream 操作包在一層薄介面（本提案要求），降到 4～6。資料不鎖：JetStream 只是緩衝，長期事實在 Odoo rows、unit SQLite、PG |
| 只換 site→cloud 那一跳 | 2～3 人週 | 站內不動；變成 P5 形狀 |
| PostgreSQL → 獨立實例或 TSDB | 1～2 人週 | writer 是介面（§5） |
| MQTT 入口 → Mosquitto | 1 人週 | T1 不感知（同協定）；驗證器改訂 Mosquitto；這是 P3 可逆性最好的一塊 |
| node 語言 | 全部重寫，與 P0 相同 | 協定規格與 conformance test 語言中立可救一半 |
| Odoo → 別的 ERP | 只動 `node[root]` 的 adapter | KV/stream 的 schema 是 ERP 中立的 |

備份（N-09）：每個 bridge 的 `store_dir` 用 JetStream 的 stream backup/restore（N9 提及 v2 版）或直接複製目錄於停機時；unit 的 SQLite 複製檔案；PG 與 ERP 同一套。比 P0 多懂一個備份工具，這也是 M-02 的一部分。
