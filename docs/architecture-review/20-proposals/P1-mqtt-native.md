# 提案 P1：MQTT 原生 — broker 就是樹

> 波次 A 提案架構師 P1。日期：2026-10-10。輸入：`00-requirements.md`、`01-proposal-pcie-tree.md`（P0）、`02-tradeoffs.md`、`03-brief.md`、`10-facts/*.md`。事實引用寫成「`檔名` 列號」；我自己另外查的事實附 URL 與查證日期（皆 2026-10-10）；查不到的標「未查證」。「意見」與「事實」分開標示。

## 1. 結論先講

**立場。** 每個 bridge（每個 device VLAN 或站點）跑一個 Eclipse Mosquitto；bridge 的 broker 以 Mosquitto 的 outbound bridge 連到上游 broker；bridge 0（ERP 旁）的 broker 是 root。topic 命名空間就是樹的路徑，per-client 的 topic ACL（Mosquitto dynamic-security plugin）就是圍堵。管理面（announce / adopt / revoke / dynsec 設定）也走 MQTT。P0 的 register（desired/actual）與 SQ/CQ 語意**原封不動**搬到 retained topic 與 per-key topic 上；MQTT 取代的是 P0 自製的 HTTPS long-poll 那一層，不取代 P0 的語意。

**一句話。** 用一個二十年的、授權乾淨的、單一 C 程式的 broker，把 P0 要自己寫的「連線保持、重連、離線快取、late-joiner、扇出、bridge」全部買回來，代價是最小部署多一個服務、多一個外部時鐘，而且語意層一行都不會少寫。

**三個最強理由。**

1. **P0 帳單上「MQTT 失去的東西」在這裡是原生的，而且 P0 自製傳輸的風險清單整段消失。** `02-tradeoffs.md` §1 列的 reconnect storm、half-open connection、long-poll 被 proxy 砍、retry 放大、thundering herd：Mosquitto 的 bridge 有 jitter backoff（預設 base 5 s、cap 30 s）、`cleansession false` 保留遠端 subscription、`try_private` 讓 retained 正確跨 bridge 傳播（`mqtt-brokers.md` 列 4、5）。第 N 個消費者（MES、現場 HMI）在對應層級的 broker 上訂閱即可，不動裝置、不要 bridge 0 長出 consumer 概念（`02-tradeoffs.md` §1 末段的具體損失直接消失）。
2. **D-06 的現場低延遲 HMI 層與「T1 講 MQTT」有現成答案。** HMI 訂閱站點 broker 的 retained last value，延遲是 LAN 等級；T1 設備以 password 或 cert 連進 bridge broker 的 T1 listener，ACL 只允許它寫 `raw/<id>/#`，bridge 的 node 做 schema 檢查後才轉成正式 topic（§3）。P0 這兩題在 `02-tradeoffs.md` §1 是「沒有答案」。
3. **授權與維護者是可查的，而且乾淨。** Mosquitto 是「EPL-2.0 OR EDL-1.0」雙授權（`mqtt-brokers.md` 列 1），Eclipse Foundation 專案，master 到 2026-10-04 仍有 commit（列 2）；bridge、retained、mTLS CN 對應、動態 ACL、sqlite 持久化都有一手文件依據（列 4～9）。對 M-05 零義務。對照 EMQX 的 BSL、ThingsBoard 4.4 的 BSL（`buy-options.md` T2、T3），這是 M-05 下少數還能選的 broker。

**兩個最弱點。**

1. **F-46/F-47 的語意一行都沒省。** `mqtt-semantics.md` §5 的對照表說得很清楚：版本、CAS、job key、去重、結果槽、deadline、簽章、retention 監控全部還是自己寫；AWS/Azure 也是在 MQTT 之上用服務端自己做（MQ14、MQ15、MQ23）。P1 省掉的是傳輸層與扇出，不是正確性。評審若以 R3 給分，P1 與 P0 的差距接近零，P1 還多了 broker 持久化設定這一組新的 retention window（§4.3）。
2. **第 (c) 種形狀的「失去感」沒有被 MQTT 補回來，反而多一條路。** Mosquitto 的 WebSocket 只有 listener 端，沒有 outbound bridge over WebSocket（我讀 man page 全文：`protocol websockets` 只出現在 listener 選項；bridge 的 `address` 只接受 host:port 的 MQTT 連線；ChangeLog 全文沒有 bridge-over-websocket 條目。來源 https://raw.githubusercontent.com/eclipse-mosquitto/mosquitto/master/man/mosquitto.conf.5.xml 、https://raw.githubusercontent.com/eclipse-mosquitto/mosquitto/master/ChangeLog.txt ，2026-10-10）。客戶只放 443 又有 TLS 檢查 proxy 時，8883 直連會死（`transport-through-networks.md` T15、§5），要靠 bridge 的 node 自己當 MQTT-over-WSS 的軟體 bridge 連雲端（§3.4）。這是第二條 trunk 程式路徑，M-02 淨增加，而且身分得上移到應用層（T1～T5），跟 P0 面對的問題一模一樣。

## 2. 元件清單

| 元件 | 自建或外部 | 授權 | 維護者與時鐘（附來源） | 取代掉什麼 |
|---|---|---|---|---|
| **Eclipse Mosquitto 2.1.x**（每個 bridge 一個、root 一個；含 dynamic-security plugin、persist-sqlite plugin） | 外部 | EPL-2.0 OR EDL-1.0（`mqtt-brokers.md` 列 1） | Eclipse Foundation 專案；最新 tag 2.1.2 = 2026-02-09，master commit 至 2026-10-04，近期 commit 幾乎全由 `ralight` 一人（列 2、3）；`acl_file`/`password_file`/`per_listener_settings` 在 2.1 列為 deprecated、3.0 移除（列 8）；近兩年 Security 修正公開於 ChangeLog（列 10）。arm64 足跡**未查證**（列 11） | P0 的 node 內自製 long-poll 伺服端與客戶端、重連、離線 queue、扇出；Orion 的 subscription 扇出；IOTA 的裝置 ingress |
| **`node`**（一支自己的程式，三種角色：unit agent / bridge node / root adapter；內含 SQLite、reconciler、schema 守門員、dynsec applier、CA 發行、PG writer、WSS trunk 備援） | 自建 | 我們的 | 我們的；語言依 P0 §6 第 2 點 PoC 決定（Python 或 Rust） | 現有 gateway、compose 套件的 south、IOTA、Orion、QuantumLeap、integration hub outbound transport |
| **MQTT client 函式庫**：Python → paho-mqtt；Rust → rumqttc | 外部 | paho-mqtt 2.1.0：EPL-2.0 OR BSD-3-Clause；rumqttc：Apache-2.0（workspace） | paho-mqtt 2.1.0 發布 2024-04-29，之後無新版（約 29 個月），支援 `transport="websockets"`（https://pypi.org/pypi/paho-mqtt/json 、https://raw.githubusercontent.com/eclipse-paho/paho.mqtt.python/master/src/paho/mqtt/client.py 、ChangeLog.txt，2026-10-10；commit 活躍度**未查證**，GitHub 頁被擋）。rumqttc main 0.25.1，有 `websocket` 與 `proxy` feature（https://raw.githubusercontent.com/bytebeamio/rumqtt/main/rumqttc/Cargo.toml 、…/Cargo.toml，2026-10-10）；repo 近期 commit 多在 rumqttc（`mqtt-brokers.md` 列 30） | P0 node 的 HTTP client |
| **function backend**（display、LED、感測、Modbus 輪詢；獨立 process，只綁 localhost，透過本地協定接 node） | 自建 | 我們的 | 我們的（感測服務、LED 控制器 延續） | 不變（P0 同） |
| **Odoo 19 + `iot_*` 模組 + integration hub** | 外部（Odoo）+ 自建（模組） | LGPL-3（Odoo，未查證本次）/ 我們的 | 不變 | 不變；integration hub 的 outbound transport 退場（P0 §6 第 1 點同） |
| **PostgreSQL 18**（ERP 已有叢集的獨立 database；窄表、月分區、drop partition；可選） | 外部 | PostgreSQL License | PG 18 最後一次發行 2030-11-14（`postgres-timeseries.md` F-11） | CrateDB、QuantumLeap、Mongo ×2（P0 同） |
| **Grafana**（可選，只給 ops；PostgreSQL datasource；MQTT datasource plugin 僅即時串流、不存歷史，v1.3.9，Apache-2.0，活躍度**未查證**，https://raw.githubusercontent.com/grafana/mqtt-datasource/main/README.md 、package.json，2026-10-10） | 外部 | AGPL-3（Grafana，未查證本次） | 年度升版（P0 §6 第 4 點） | 不變 |
| **deploy repo**（compose、`mosquitto.conf` 與 dynsec JSON 產生器、三種形狀的防火牆模板，N-01） | 自建 | 我們的 | 我們的 | compose 套件 |
| **e2e repo**（三種形狀各一條 compose、ACL 拒絕測試、斷線/重啟 soak） | 自建 | 我們的 | 我們的 | IoT_e2e 延續 |

**種類數（M-02）。** 引擎：Mosquitto（新）、PostgreSQL、Odoo、Grafana（可選）= 4。語言：Python（Odoo 模組）、node 語言（若選 Python 則與前者合併）、SQL = 3（node 用 Python 時 2）。runtime：Mosquitto 程序、Odoo/Python、node、PostgreSQL = 4。repo：node、ERP 模組、deploy、e2e = 4（IoT_Parts 不計，與架構無關）。**合計 15（node 用 Python 時 14）**；相對 P0（引擎 3、語言 3、runtime 3、repo 4 = 13）淨增 **+2：Mosquitto 作為引擎與作為 runtime**。另有兩個不算「種類」但要維護的方言：`mosquitto.conf` 與 dynsec JSON。

## 3. 拓樸、圍堵、身分

### 3.1 命名空間：topic 就是路徑

```
iot/<env>/<path>/<function>/desired     retained   寫入者：root adapter（代 ERP）
iot/<env>/<path>/<function>/actual      retained   寫入者：該 unit 的 node
iot/<env>/<path>/sq/<job_key>           retained   寫入者：root adapter；刪除 = 空 retained
iot/<env>/<path>/cq/<job_key>           retained   寫入者：unit node
iot/<env>/<path>/m/<function>           retained + Message Expiry   量測，寫入者：unit node
iot/<env>/<path>/presence               retained   birth 與 Will
iot/<env>/<path>/ev/<kind>              QoS 1，不 retained   業務事件（門檻越線、刷卡）
iot/<env>/<bridgepath>/announce/<serial>           bootstrap 身分唯一可寫的 topic
iot/<env>/<bridgepath>/adopt/<serial>   retained   root 簽名的 adopt / revoke 訊息
iot/<env>/<bridgepath>/mgmt/dynsec      retained   root 簽名的 dynsec 期望狀態（版本化）
raw/<t1id>/#                            只存在於 bridge 本地 broker，永不 bridge 往上
```

`<path>` 是 adopt 時指派的樹路徑（例 `b0/b-vlan12/u-7f3a`），re-plug 會變（F-19）；`<env>` 讓 prod/staging 的 topic 不可能互相 bridge（N-04）。每個 bridge broker 的 bridge 設定只轉送 `iot/<env>/<自己的 path>/#`，且**依 topic 類別分方向**：`actual`、`cq`、`m`、`presence`、`ev`、`announce` 設 `out`；`desired`、`sq`、`adopt`、`mgmt` 設 `in`。方向互斥的集合不會形成 loop，也不依賴 `try_private` 的 loop 偵測（`try_private` 仍開，為了 retained 傳播，`mqtt-brokers.md` 列 5）。所有 bridge topic 設 QoS 1，`bridge_protocol_version mqttv50`（預設是 3.1.1，`mqtt-semantics.md` MQ16，必須明設才有 Message Expiry）。

### 3.2 三種部署形狀

**(a) 同主機**（最小部署 = 一片螢幕）：

```
 ┌──────────────── ERP 主機 ───────────────────────────┐      ┌──── CM4 螢幕 ────┐
 │ Odoo ◀─JSON route─▶ node(root adapter) ◀─1883 lo─▶ │      │ node(agent)      │
 │   (iot_*)        · CA 發行 · dynsec applier    │      │  ├ SQLite        │
 │                      · PG writer(可選) · reconciler│      │  └ display backend│
 │                                     Mosquitto(root)│◀─8883 mTLS──┤ (localhost)  │
 │                                     · listener T2  │      └──────────────────┘
 │ PostgreSQL (ERP 叢集；history db 可選)              │
 └────────────────────────────────────────────────────┘
 伺服端服務：Odoo、Mosquitto、node ＝ 3（P0 為 2）
```

**(b) 同站不同 VLAN**：

```
 ERP VLAN                         │  device VLAN 12 (T1 + T2 混雜, C-25)
 Odoo ─ node(root) ─ Mosquitto(root)                      
                         ▲ 8883 mTLS（bridge 連線，由 child 撥出） 
                         │                                
                   ┌─────┴──────────── bridge 主機 ────────────────┐
                   │ Mosquitto(bridge)                             │
                   │  · listener 8883 T2（require_certificate）    │
                   │  · listener 8884 T1（password 或 vendor cert）│
                   │  · bridge → root：只轉 iot/<env>/b0/b-vlan12/#│
                   │ node(bridge)：raw/# → schema → iot/...；       │
                   │   dynsec applier；Modbus backend(localhost)   │
                   └───────▲───────────────▲───────────────────────┘
          T2 unit ─8883────┘          T1 MQTT 設備 ─8884 (只能寫 raw/<id>/#)
          T1 Modbus ◀── node 輪詢（出站，T1 不需任何 listener）
 防火牆：VLAN12 → bridge 主機 8883/8884 only；bridge → root 8883 only；其餘 deny（transport-through-networks.md §3.2 的 8 條）
```

**(c) 雲端 ERP + 站點 outbound-only**：

```
 我們營運的雲端（每個客戶一組）             客戶站點（無 inbound）
 Odoo(客戶) ─ node(root) ─ Mosquitto(root)
                              ▲ 8883 或 443/TCP（MQTT/TLS）── 預設：Mosquitto bridge，mTLS + remote_username
                              │                             
                              ▲ WSS 443 ──────────────────── 備援：node(bridge) 當軟體 bridge（§3.4）
                              │   （客戶有 TLS 檢查 proxy / 只放 HTTP 時）
                   ┌──────────┴─ 站點 bridge 主機 ─┐
                   │ Mosquitto(bridge) + node(bridge)│  ← 其下與 (b) 相同
                   └────────────────────────────────┘
 一個客戶一個 root broker 與 root node（不共用 root，避開 F-40 的 tenant pinning）
```

### 3.3 hostile T1 怎麼被圍堵

事實：Mosquitto dynsec 預設 `publishClientSend` 與 `subscribe` 皆 deny，ACL 支援 `%c`/`%u`（`mqtt-brokers.md` 列 7）；`check_retain_source` 預設 true，發布者 ACL 被撤後其 retained 不再送給新訂閱者（`mqtt-semantics.md` MQ9）；`max_packet_size` 2.1 起預設 2,000,000 bytes、`message_size_limit` 可限 payload（man page，2026-10-10）。

圍堵分四層（意見）：

1. **網路層**：T1 只在它的 VLAN，只能到 bridge 主機的 8884；bridge 的 north 介面在另一個 VLAN，不做 IP forwarding（`transport-through-networks.md` §3.2 第 1～7 條）。這一層與 P0 相同，是 M-04 的必要條件，不是 MQTT 給的。
2. **ACL 層**：T1 的 dynsec client 只有一條 publish 規則 `raw/<id>/#`，沒有 subscribe 規則。它寫不到 `iot/`，讀不到任何東西，也看不到別的 T1。`raw/#` 不在 bridge 的轉送清單裡，結構上出不了這台 broker。
3. **守門員層**：bridge 的 node 訂閱 `raw/#`，對每個 T1 代表做 F-31/F-32 的 schema 檢查、F-01 的限速（超過 1 Hz 丟棄並計數）、時間戳檢查（F-02：T1 若不帶時間，node 以收到時間標記並在 payload 註明 `ts_source: bridge`，不假裝是裝置時間），通過者才以 node 的身分重發到 `iot/<env>/<path>/m/<function>`。這與 P0 §1 第 5 點「bridge 圍堵 hostile child：schema 檢查、限速」是同一段程式，只是輸入從 HTTP body 換成 MQTT payload。
4. **資源層**：`max_packet_size`、`message_size_limit`、`max_queued_messages`、`max_inflight_messages` 對 T1 listener 設小；`$SYS/broker/publish/messages/dropped` 與 `$SYS/broker/load/publish/dropped/+` 由 node 訂閱並上報為 drop 計數（man page mosquitto.8，2026-10-10）。

誠實的弱處：圍堵邊界是 Mosquitto 這支 C 程式的封包解析與 dynsec 的正確性，而且**同一支程式同時持有往上游的 bridge 憑證**。2.0.19 修過「bridge 收到惡意封包 crash」、2.0.21 修過「已驗證 client 的惡意 SUBSCRIBE 造成 leak」（`mqtt-brokers.md` 列 10）。對照 P0：P0 的 node 同樣是「面對 T1 的解析器」與「唯一持憑證的 process」合一（P0 §4），差別只在解析器是誰寫的。我的判斷（意見）：Mosquitto 有 fuzzer 建置與二十年的攻擊面歷史，比我們第一年的自製 HTTP 解析器更可信；但 hostile T1 能把整台 bridge broker 打掛（DoS）這件事在兩案都成立，P1 的後果多一點：trunk 跟著斷，單一 bridge 下所有 T2 的 desired/actual 同步暫停（N-11 讓 T2 繼續用手上的 desired，不停機）。若 PoC 顯示這不可接受，升級版是 T1 listener 改成**第二個 Mosquitto 實例**（不持 bridge 憑證），node 在兩個實例間當守門員：多一個 process、不多一種東西。

### 3.4 身分：誰終結 TLS、誰是唯一發行者

- **一個發行者（SC §2.2）**：root node（bridge 0）持有「本環境」的中繼 CA 私鑰並執行簽發；factory CA 離線（F-35）；ERP 是按鈕（F-33）。每個環境一張中繼 CA（N-04），staging 從 prod 還原的資料庫沒有 prod 中繼 CA 的私鑰也沒有 prod 的 topic 前綴，對真實節點不構成信任。
- **每一跳終結 TLS**：T2 unit → bridge broker（mTLS，`require_certificate true` + `use_identity_as_username true`，CN 即 dynsec username，man page 原文「the password_file option will not be used for this listener」）；bridge broker → parent broker（bridge 以 `bridge_certfile`/`bridge_keyfile` 做 client cert，`mqtt-brokers.md` 列 4）；root broker ↔ root node 在 loopback。**dynsec 與 cert-username 的互動（cert 身分的 client 是否仍被要求密碼）man page 沒寫，標未查證，是 PoC 第一週的項目。**
- **bootstrap → adopt → revoke**：
  1. 出廠：unit 自產金鑰對，factory CA 簽 bootstrap 憑證，CN = `boot:<serial>`；標籤/QR 印 serial（F-36）。
  2. 上電：unit 以 mDNS/DNS 找到 bridge（F-23），以 bootstrap 憑證連 8883。所有環境的 broker 都信任 factory CA，但 dynsec 給 `boot:*` 的角色只能 publish `iot/<env>/<bridgepath>/announce/<serial>`、subscribe `iot/<env>/<bridgepath>/adopt/<serial>`。announce 內容是 config space（序號、功能、class、schema、capability、CSR）。bridge 往上轉送，root adapter 寫入 SQLite，Odoo Fleet 顯示「present, unadopted」（F-26）。
  3. Manage：操作員在 Odoo 按 Manage → root adapter 指派 path、簽營運憑證（CN = `unit:<serial>`，30 天，續期靠 `mgmt/csr`），以 root 私鑰**簽名**後 retained 發到 `adopt/<serial>`；同時更新該 bridge 的 `mgmt/dynsec` 期望文件（版本 +1）。bridge node 收到後對本地 broker 的 `$CONTROL/dynamic-security/v1` 套用（新增 client `unit:<serial>`、角色 = 它的 path 前綴）。unit 收到 adopt、驗簽、換憑證重連。
  4. 續期：到期前 unit 在 `mgmt/csr` 送 CSR，root 回簽，同樣 retained + 簽名。
  5. revoke：root 先發簽名的 revoke 到 `adopt/<serial>`（線上的 unit 立刻知道自己是 **rejected**），再把 dynsec 文件改為 `disableClient`（Mosquitto 停用即斷線，`mqtt-brokers.md` 列 7；dynsec README 的 `disableClient` 指令，2026-10-10）並不再續期。離線的 unit 回來只會收到 CONNACK not authorized，沒有簽名的 revoke 可讀，它必須把這個狀態分類為 **unknown**（T3 規則：破壞性動作只能由正向簽名觸發，`00-requirements.md` §4.2 管理表）。這正好是 F-46 精神：revoke 的事實在 root 的 SQLite，不在那一則訊息。
- **為什麼 payload 要簽名**：F-48 說偽造 intent 是 defacement 風險，而 (c) 形狀在 TLS 檢查 proxy 後 client cert 會失效（`transport-through-networks.md` T1～T5）。所以 `desired`、`sq`、`adopt`、`mgmt` 四類下行 payload 一律由 root 以 Ed25519 簽名，unit 在 adopt 時拿到 root 公鑰。被攻陷的中間 broker 可以丟訊息、不能偽造。這是 P0 §1 第 5 點「T3 加端到端簽章」提前到所有下行，`mqtt-semantics.md` §5 也把簽章列為「自己寫」的項目。
- **(c) 形狀的身分**：預設 Mosquitto bridge 走 MQTT/TLS 到雲端 root 的 8883（或同一服務綁 443/TCP 給只放 443 但不檢查的客戶），mTLS 加 `remote_username`/`remote_password`（man page 列有此二選項，2026-10-10）當 site-scoped 憑證（F-41）。客戶有 TLS 檢查 proxy 時，mTLS 必死（T1～T3），改走 **node 的 WSS trunk**：node 以 paho/rumqttc 的 websocket 傳輸連雲端 root 的 WSS listener，身分 = site username + 由 root 輪替的 secret（經簽名的 `mgmt` 下發），下行靠簽名、上行靠 secret；topic 方向規則與 Mosquitto bridge 相同。雲端 WSS listener 前面放 TLS 終結 proxy 時，Mosquitto 的 `enable_proxy_protocol` 模式不能用 `use_subject_as_username`（`transport-through-networks.md` T14），與 username 身分相容。keepalive 設 ≤ 30 s（T16 的推論）。

## 4. 命令與回報語意

### 4.1 desired/actual（register）

ERP 透過 root adapter 把每個 function 的 desired 寫成一則 retained：`{"v": 42, "issued": "...", "body": {...}, "sig": "..."}`，`v` 由 ERP 單調遞增（N-05 一個事實一個寫入者；`mqtt-semantics.md` §3.1 的推論）。unit 訂閱後，不論在線或剛重連，都拿到最新一則（late-joiner），對照本地 SQLite 的 `applied_v`，較新才 apply（F-54：重複的 identical desired 無副作用）；apply 完把 `actual` 寫成 retained `{"v": 42, "ts": device_time, "state": ...}`。done = `actual.v == desired.v`（F-47）。中間錯過的 desired 版本不重要，因為 register 只在乎最後值——這是 retained 最適合的用法，也避開了 queue 上限的問題（`mqtt-semantics.md` §3.4）。

**owner 是誰？retained 不是 owner。** desired 的 owner 是 ERP（Odoo 的 Postgres），root adapter 的 SQLite 是它的鏡像；actual 的 owner 是 unit 的 SQLite。broker 的 retained 是兩個 owner 之間的**快取**。broker 掛了、重啟而 persistence 沒來得及存：unit 重連時重發 actual 與 presence birth；root adapter 偵測到 root broker 重啟（訂閱 `$SYS/broker/uptime` 歸零，或 bridge `notifications` 的 `$SYS/broker/connection/<id>/state`，man page 2026-10-10）或每 `R_resync` 定期，就把**全部** desired、未結的 sq、各 bridge 的 dynsec 文件重發一遍。幾百個 topic 的重發是秒級的事。這就是 F-46 的「正確性是收斂到 owner 的事實」：broker 只是加速收斂，不是事實所在。

### 4.2 job（SQ/CQ）

issuer（ERP）對每個 job 寫一則 retained 到 `sq/<job_key>`，帶 deadline 與簽名，Message Expiry = deadline 加寬限。unit 訂閱 `sq/+`，重連時收到所有仍未結的 job（同樣是 late-joiner 語意，不是 queue）。unit 以 `job_key` 在 SQLite 去重（修 B-08）、單獨 worker 執行（F-52，修 B-07），結果寫進 SQLite 的 CQ 表並 retained 發到 `cq/<job_key>`（狀態詞彙：`accepted / running / done / rejected / error`，修 B-06、F-53）。root adapter 收到 `done/rejected/error` → 寫 ERP 命令結果（F-49）→ 發空 retained 刪除 `sq/<job_key>`。unit 看到自己訂閱的 sq slot 被刪，才刪自己 retained 的 cq slot；SQLite 的 CQ 保留 `R_cq`。ERP 未收到結果而 deadline 過了 → `unknown` → `timeout`（F-50），結果若之後才到，仍關聯到同一 key（修 B-01 的 7 天刪除問題：key 是永久關聯）。single-flight per device 在 ERP 端（F-51），所以每個 unit 同時未結的 sq 通常只有 1～2 個 retained，不會撐大 retained tree。

### 4.3 retention window 明寫

| window | 預設值（提案） | 誰持有 | 超出會怎樣 / 怎麼監控 |
|---|---|---|---|
| broker retained 持久化 | persist-sqlite plugin（2.1.0 起，`mqtt-brokers.md` 列 9）；若用內建 persistence，`autosave_interval` 60 s（預設 1800 s） | 每台 broker 的檔案（N-09 備份項） | 丟失只影響快取；owner 重發（§4.1）。PoC 必驗 persist-sqlite 的 crash 行為 |
| `max_queued_messages` | 1000（預設）；T1 listener 100 | broker | 超出**靜默丟棄**（`mqtt-semantics.md` MQ11）；node 訂閱 `$SYS/broker/publish/messages/dropped` 計數上報 |
| `persistent_client_expiration` | 7d | broker | session 消失 → unit 重連時重訂閱即可，retained 補齊 |
| `sq/<key>` Message Expiry | deadline + 1h | broker（lazy 清除；`retain_expiry_interval 10`，MQ9） | 過期 = ERP 已判 timeout；若 ERP 當機未判，重發邏輯會重寫 |
| `m/<function>` Message Expiry | 3 × 量測週期（D-02：90 s） | broker | 過期即對新訂閱者消失 = F-04「沒有資料看起來就是沒有」 |
| unit SQLite：CQ `R_cq` | 7d | unit | 超過即丟；ERP 7 天內沒來讀就是 ERP 自己的 F-67 問題 |
| unit SQLite：量測緩衝 `R_buf`（parent 不可達時） | 24h 或 50 MB | unit / bridge node | 超出丟最舊並計數；上報為 drop 事件 |
| root adapter `R_resync` | 1h + 偵測到 broker 重啟時 | root node | 全量重發 desired/sq/dynsec |
| presence Will Delay / keepalive | Will Delay 30 s；keepalive 30 s（偵測 ≈ 45～75 s） | broker | 見 §4.5 |
| ERP inbound 保留 | 2d（F-67 既有） | Odoo | 不變 |

### 4.4 F-46～F-54 逐條

| ID | 判定 | 一句理由 |
|---|---|---|
| F-46 | **成立** | owner 是 ERP Postgres 與 unit SQLite；retained 是快取；漏掉的結果靠 `cq/<key>`（retained）或 unit SQLite 重讀；沒有 per-command poll loop，有 `R_resync` 的全量重發 |
| F-47 | **成立** | register = retained + `v`；job = `sq/<key>` + `cq/<key>` + unit 去重；兩者在 topic 上就分開 |
| F-48 | **成立（有條件）** | 下行 payload 簽名 + dynsec 只讓 root adapter 寫 `desired/sq`；條件：簽名格式與金鑰輪替自己維護，PKI 外部審查仍要付（P0 §3 第 5 項同） |
| F-49 | **成立** | `cq/+` 與 `actual` 是扇出 topic，ERP 與其他消費者同時可見；修 B-05 |
| F-50 | **成立** | PUBACK 不等於完成；ERP 以 deadline 判 `unknown → timeout`；結果遲到仍以 key 關聯 |
| F-51 | **成立** | unit 以 key 去重；ERP single-flight；順序：單一連線、同 topic、QoS 1、`max_inflight_messages 1` 在 unit 的訂閱側（man page：設 1 保證有序）；跨 topic 靠 `v` |
| F-52 | **成立** | PUBACK 是 hop、`cq` 是完成；apply 在 worker 不在 MQTT callback |
| F-53 | **部分** | 應用層狀態詞彙自己定；MQTT Reason Code 只涵蓋協定層（MQ 對照表）。「部分」是因為 T1 的 vendor 錯誤語意仍要在守門員翻譯 |
| F-54 | **成立** | retained 每次重訂閱重送 desired，unit 必須冪等；`rejected` 狀態寫進 actual 的 `refusal` 欄 |

### 4.5 Will 當 liveness：它是提示，不是判定

事實：Will 由 broker 在 keepalive × 1.5 沒收到任何封包時發出（`mqtt-semantics.md` MQ8），所以它偵測的是**連線**死掉，不是裝置死掉；NAT 後的半開連線要等這個窗口；Will Delay Interval 可讓短暫斷線不觸發（MQ3）；Sparkplug 自己承認 Will 可能晚於下一個 NBIRTH，所以用 bdSeq 配對（MQ21）。F-27 要求「以裝置自己的報告時間判定，不以接收時間」。

設計（意見）：unit 連線時 retained 發 birth `{"online":true,"conn":N,"ts":device_time}` 到 `presence`，Will 設為 retained `{"online":false,"conn":N}`，Will Delay 30 s，keepalive 30 s（偵測約 45～75 s；也是 (c) 形狀穿 60 s idle proxy 的需要，`transport-through-networks.md` T16）。`conn` 每次 CONNECT 加一；root adapter 看到 `conn` 比最近 birth 小的 Will 直接丟棄（舊 Will 晚到）。**presence 只會把 Fleet 的狀態標成「可疑」**，online/offline 的判定仍是 unit 每 120 s retained 發到 `actual/heartbeat` 的裝置時間，5 分鐘沒有新的裝置時間才 offline（F-27、N-15）。root broker 重啟時所有 bridge 的 `notifications` 狀態歸零，root adapter 在重連後給 `R_grace`（例 2 分鐘）內的 presence 變化一律當 unknown，不寫 ERP。presence 的每次翻轉都只進 root adapter 的 SQLite，ERP 只收「可疑 → 離線」或「離線 → 在線」的狀態變化事件並帶 hysteresis，F-30 的 14k rows/day 不會重現。得到的是：真正斷線時 Fleet 在一分鐘內顯示可疑（P0 要等心跳週期），而誤判不會污染 ERP。

## 5. 回傳資料

量測由 unit node 發到 `m/<function>`（QoS 1、retained、Message Expiry），payload 含裝置時間（F-02）、感測器狀態（F-05）與 `ts_source`。bridge broker 轉送到 root，**root adapter 是唯一 writer**，寫進 ERP 叢集內獨立 database 的窄表 `(series_id, ts, value)`，月分區，retention = drop partition，roll-up 由 root node 排程做**增量** bucket 寫入（不是 materialized view 全量重算，`postgres-timeseries.md` F-13 的警告；P0 此點成立且本案照抄）。series 維度表讓改名不斷史（F-14）、新屬性不 ALTER（F-11）。寫入前比對 announce 宣告的 schema，未宣告者拒絕並計數（F-31）。store 要認證（N-03）：PG 原生 client cert。

store 是 Postgres，不是 TSDB，理由與 P0 相同（`postgres-timeseries.md` §3.4：≲ 10 億樣本/站時 M-02 與 M-05 最乾淨）。writer 做成介面，W2 以上規模換 VictoriaMetrics 只動 root node 的一個 adapter。

**第 N 個消費者。** 這是 P1 相對 P0 真正的得分：
- 現場 HMI（D-06）：以唯讀 dynsec 角色訂閱**站點 bridge broker** 的 `iot/<env>/<path>/m/#`，拿 retained 得到即時值，不經雲端、不經 ERP，LAN 延遲。
- MES：在 root broker 上一個唯讀角色訂閱它關心的 path；或走 Postgres（有歷史）。F-63 的 MES live board 的 JSON 由 root node 提供（token 保護），資料來源是它自己的訂閱快取。
- Grafana：PostgreSQL datasource 畫歷史；即時面可用 MQTT datasource（live only，v1.3.9，活躍度未查證）。
- 每個消費者都是 broker 上的一個 client + 一條 ACL，不動裝置、不動 node 程式，不需 bridge 0 長出 consumer 概念（`02-tradeoffs.md` §1 末段）。

**F-01～F-15 哪些不成立。** 全部成立，兩條附帶條件：F-04 依賴 Message Expiry 與 `retain_expiry_interval` 的實作行為（MQ9：預設 lazy 清除，要開定期掃描），要 e2e 驗證「過期的 retained 不會送給新訂閱者」；F-15 成立（一片螢幕不開 writer，不建 history db），但 Mosquitto 本身仍在（§7）。

## 6. D-01～D-06 逐一走過

**D-01 螢幕。** desired = `{"playlist_version": V, "doc": {"url": ..., "token": ...}}`（F-56 只帶指標），actual = 已套用版本（修 B-14、B-03：版本不符就不是 In sync）。文件與媒體不走 MQTT（`max_packet_size` 預設 2 MB，媒體不合適）：螢幕以 per-screen token 向 **bridge node 的 HTTPS 快取**拉（bridge node 代為向 ERP 取、本地快取，N-11 斷線仍可重載），(a) 形狀時 bridge node 就是 root node。這代表 unit node 同時講 MQTT 與 HTTPS client——這是 P1 必須承認的第二種傳輸（§7）。display backend 的 reconcile 介面不變（F-61）。Anthias 的 C-18/C-19 限制留在 backend 內。

**D-02 環境感測。** 感測服務 backend 經 localhost 給 node 30 s 平均；node 發 `m/env`（Expiry 90 s）；warm-up/fault 寫在 payload 的 `status`（F-05），store writer 不寫 warm-up 期間的值（F-04）。門檻（HCHO 80 ppb）當 register 推給持有資料的 node，越線以 `ev/threshold` 上報，root adapter 轉成 ERP 事件（F-10 alert 的「wish」在這裡是免費的）。

**D-03 Modbus 旁路感測。** T1 不講 MQTT，bridge node 的 Modbus backend 輪詢（RTU 位址或 TCP 白名單 IP，F-22），算 min/mean/max 後由 node 發 `m/<function>`。這一類 T1 完全不碰 broker，圍堵就是「它沒有任何 inbound」。bridge 代 T1 建立代表並 announce（P0 §5 的回答同）。

**D-04 LED。** `config`、`effect`、`playlist add/remove/resume` 都是 job（sq/cq）；capability（supported effects）在 announce 裡到 ERP 做驗證（F-06，修 B-09）。跨多條 strip 的 show 是對 bridge node 的一個 job，時間線在 bridge 本地展開（F-44）。standalone playlist mode 不受影響（F-45、N-11）。

**D-05 門禁（管理面在、控制面不在）。** 身分走 §3.4 的 T3 路：硬體金鑰簽 announce、attestation 放進 presence birth。刷卡與出勤是**事件**不是 register：發 `ev/access` QoS 1，root adapter 持久化後交 ERP（F-67），這正是 MQTT 比 register 模型自然的地方（`02-tradeoffs.md` §1「非狀態事件天生不適合 register」）。控制通道（鎖、OSDP）**不走這個 broker**，依 class rule 另建 fabric；credential list 與 schedule 若要下發，是 Control-Semantic，本案不碰。

**D-06 機台遙測與低延遲 HMI。** edge controller 當 T2 unit（我們的 node）或 T1（PLC 閘道講 MQTT）接進站點 bridge broker。HMI 層：唯讀角色直接訂閱該 broker，retained 給它當前畫面、QoS 0/1 給它更新。業務層：門檻與狀態變化以 `ev/` 到 ERP/MES。分析層：root adapter 寫 PG。**Sparkplug B：不用在管理面與命令面**（NCMD QoS 0、強制 Clean Session、三層 topic 放不下 F-16 的可堆疊 bridge、沒有 job，`mqtt-semantics.md` MQ17～MQ20）；但若客戶的 HMI 是 Ignition 類、只吃 Sparkplug，允許 D-06 的 edge function backend **另外**以 Sparkplug B 方言在同一 broker 上發 NBIRTH/NDATA 作為資料面副本（MQ19 是 QoS 0，正好符合「HMI 看即時值」）。這是可選模組，Tahu 與 Mosquitto sparkplug-aware plugin 的維護狀態未查證（MQ26、MQ28），所以預設關。

## 7. 妥協清單

| 需求 ID | 妥協內容 | 換到什麼 | 代價 |
|---|---|---|---|
| N-13、錨點 7 | 最小部署伺服端由 2 個服務變 3 個（Odoo、Mosquitto、node） | 不自製 long-poll 伺服端/客戶端、重連、離線快取、扇出；HMI 與 T1 MQTT 有現成接點 | 一個 C 程式的 RAM（arm64 數字未查證，但它在 ERP 主機不在 CM4）；一個設定檔與 dynsec JSON 要產生、備份、升級 |
| M-02 | +1 引擎、+1 runtime（Mosquitto）、+1 client 函式庫、兩個設定方言 | 同上 | 種類 13 → 15（§2） |
| M-06 | 接受 Mosquitto 的時鐘：2.1.x 近 8 個月無 tag、commit 集中一人、3.0 將移除 `acl_file`/`password_file`/`per_listener_settings` | Eclipse 治理、EDL 可 fork、二十年的攻擊面歷史 | 每季查一次活躍度；設計上不用 3.0 要移除的三個選項（只用 dynsec plugin），已納入 §3 |
| N-02 | (c) 形狀遇 TLS 檢查 proxy 時，site→cloud 這一跳的 mTLS 改為 TLS-to-proxy + site secret + 下行簽名 | 不需客戶 IT 做 bypass 就能上線 | 自己維護簽名信封與 secret 輪替；這是所有提案的共同代價（`transport-through-networks.md` §5），不是 P1 獨有 |
| F-17「每個節點只知道 parent 與 children」 | broker 的 topic 樹是全站可見的命名空間；「只知道」由 ACL 實現，不是結構 | 第 N 個消費者在任一層接上 | ACL 寫錯 = C-09 重現；靠 dynsec 預設 deny 與 N-17 的拒絕測試守住 |
| F-46「nothing exists only in flight」 | retained 快取在 broker 重啟到 owner 重發之間，是一段「事實暫時只在 owner、快取尚未恢復」的窗口（`R_resync`） | 不用為快取層寫持久化 | 窗口內新訂閱者看到舊值或空值；幾秒到 1 小時，可調 |
| P0 §6 第 1 點「ERP ↔ bridge 0 統一 pull」 | ERP 不直接拉 broker；Odoo 與 root adapter 之間維持「adapter 拉 Odoo 的 desired/SQ 佇列、推業務事件進 Odoo 的單一 inbound 路由」（F-68、F-69），adapter 才是 MQTT client | C-20（Odoo 交易內不做遠端呼叫）結構上滿足；F-70 kill switch = adapter 停止發布 + dynsec disable adapter client；F-71 無連線即 adapter 拒啟動並回錯誤 | Odoo 不是 MQTT client，多一個 adapter 程式，但它就是 root node，不是新種類 |
| F-56、C-24 | 媒體與文件不走 MQTT，走 bridge node 的 HTTPS 快取 | 不被 `max_packet_size` 綁住；N-11 斷線仍可重載 | node 同時是 MQTT client 與 HTTPS client/server：兩種傳輸在邊緣並存 |
| 「下行一律 pull」（P0） | 改為持久連線上的 push（retained + subscribe） | 命令延遲從 poll 週期變成連線往返 | 無額外代價；`03-brief.md` §2 明列可妥協 |

## 8. 已知弱點

1. **第 (c) 形狀有兩條 trunk 程式路徑**（Mosquitto bridge 與 node WSS trunk），壞在：客戶 IT 某天啟用 TLS 檢查，8883 bridge 斷，要切到 WSS trunk；兩條路徑的 topic 方向與 QoS 行為若有一處不同，就是 e2e 才會抓到的 bug。Mosquitto 沒有 bridge-over-WebSocket 是這個弱點的根（§1）。
2. **圍堵押在 Mosquitto 的解析器與 dynsec 上**（§3.3）。壞在：形狀 (b) 的 T1 VLAN 內一台被攻陷的 T1 送畸形封包，若命中未修的 crash，整台 bridge broker 停，該 VLAN 的 T2 進入 N-11 的 last-known-good 模式直到 broker 重啟。C-09（無驗證、tenant 可自設）會以「dynsec 文件產生器寫錯一條 ACL」的形式重現，在 Manage 那一步；防線是預設 deny 與每次 adopt 後的自動拒絕測試。
3. **retained 是 last-writer-wins 的單槽**，與 C-07 是同一種東西。靠 `v` 與 per-key topic 避開，但若 ACL 讓兩個寫入者都能寫同一個 `desired`，C-07 就回來。只有 root adapter 有 `desired/sq` 的寫入權，這條規則要進 conformance test。
4. **`check_retain_source` 的陷阱**：root adapter 的 cert 輪替後，它過去發布的所有 retained desired 對新訂閱者消失（MQ9），壞在輪替後第一台重連的 unit 收不到 desired，直到 `R_resync` 全量重發。runbook 要寫「輪替後立即觸發重發」。
5. **broker 持久化的時鐘**：persist-sqlite 是 2026-01-29 的 2.1.0 才加的新功能（`mqtt-brokers.md` 列 9），2.1.2 才禁止與內建 persistence 同開；crash 行為未查證。B-14（ERP 當機期間結果丟失）不會重現，因為 CQ 的 owner 是 unit SQLite；會重現的是「快取空窗」。
6. **C-05 的影子**：`max_queued_messages` 超限靜默丟棄（MQ11）。sq 用 retained-per-key 而非 queue，所以 queue 只承載 `m`、`ev`、`cq` 的 QoS 1 補送；長時間斷線後，bridge 對 root 的 queue 可能溢出，量測丟最舊。unit/bridge 的 SQLite 緩衝 `R_buf` 是真正的保證，broker queue 只是加速；drop 計數必須可見。
7. **路徑變更的鬼 topic**（F-19 的代價）：unit re-plug 到另一個 bridge 後，舊 path 下的 retained `actual/cq/m` 還在，像 C-08「佇列中的命令在裝置刪除後仍存在」。root adapter 在改 path 時必須對舊 path 發空 retained 清除；忘了就會有鬼。
8. **Will 的誤判**（§4.5 的設計）：NAT 半開、Wi-Fi 漫遊、broker 重啟都會產生假 offline。處理：Will Delay 30 s 吸收抖動（MQ3）；presence 只是「可疑」提示，ERP 的 online/offline 一律以 unit 自己的 heartbeat 時間判定（F-27，心跳 120 s、5 分鐘離線）；birth 與 Will 都帶 `conn` 連線序號，舊 Will 晚到時以序號丟棄（Sparkplug 的 bdSeq 做法，MQ21）；root adapter 對 presence 做去抖，只在狀態真的改變時才寫一筆 ERP 事件（F-30：不會再有 14k rows/day）。壞在：keepalive 30 s 代表幾十台裝置每 30 s 一個 PINGREQ，量級可忽略；但 C-25 的 Wi-Fi 如果真的每分鐘掉一次，presence 會一直閃，UI 要有 hysteresis。
9. **Mosquitto 單一 committer 與無新 tag**（列 2、3）：不是死亡訊號，但 bus factor 低。壞在：下一個 CVE 若要等三個月，我們的 fleet 就暴露三個月。緩解：EDL 授權允許我們自己 patch 並建置。
10. **arm64 足跡未查證**；bridge 主機多半是 x86 盒子或 CM4 級的閘道。若 bridge 要跑在 CM4 上，PoC 要量 Mosquitto RSS。
11. **B-10（服務綁 0.0.0.0 無認證）**不會重現：backend 只綁 localhost、broker listener 全部 TLS + 認證、root node 的 HTTP 快取有 token。**B-11**（忽略心跳回應）不會重現：unit 必須分類 CONNACK reason code 與簽名 revoke。**B-12**（provisioning 用 admin port、POST-only）不會重現：adopt/revoke 走簽名 topic，dynsec 只在 loopback。**B-13**（compose 停錯專案）與架構無關，deploy repo 重寫時修。
12. **外部對抗審查仍要付**：PKI、簽名格式、dynsec 產生器、WSS trunk 的身分流程。這與 P0 §3 第 5 項相同，不是 P1 省掉的。

## 9. 成本與可逆性

**到第一個客戶價值**（幾片螢幕 + 幾個 D-02/D-03 感測器 + 一個同站或雲端 ERP）的人週估計，假設：1～2 位工程師、AI 輔助、node 語言在第 1 週的 PoC 後定案、Mosquitto 的 dynsec-cert 互動與 persist-sqlite 在 PoC 第一週驗過。

| 工作 | 人週 |
|---|---|
| PoC：CM4 上 Mosquitto RSS、dynsec + cert-username、persist-sqlite crash、bridge QoS/retained 跨兩層、WSS trunk 穿 nginx 60 s idle | 1.5 |
| deploy repo：三種形狀的 compose、`mosquitto.conf` 與 dynsec 產生器、防火牆模板（N-01） | 2 |
| node：MQTT client、SQLite register/SQ/CQ、reconciler、presence、`R_resync`、schema 守門員、限速、HTTPS 文件快取 | 3.5 |
| node（root 角色）：CA 發行、adopt/revoke 流程、簽名、dynsec 期望文件、Odoo 佇列拉取與 inbound 推送、PG writer 與增量 roll-up | 3.5 |
| ERP 模組改造：命令模型對齊 sq/cq、Fleet 的 present/unadopted、結果關聯、zh_TW | 2.5 |
| backend：display reconcile 搬到新 node 介面、感測服務、Modbus generic backend | 2 |
| e2e：三種形狀、ACL 拒絕測試、斷線/重啟/輪替 soak（N-17、N-18） | 2 |
| runbook、備份還原（broker 持久化檔、SQLite、PG）、外部審查準備 | 1 |
| **合計** | **約 18 人週**（不含外部審查費與等待時間） |

意見：與 P0 相比，P1 省掉的是自製 long-poll 伺服端與 reconnect 邏輯（約 2～3 人週），多出的是 Mosquitto 包裝、dynsec 產生器與 WSS trunk 備援（約 3～4 人週），所以第一次交付成本大致持平或略高。P1 的回收在第二個消費者出現時（HMI、MES），那時 P0 要寫 consumer 概念，P1 寫一條 ACL。

**三年後想換掉其中一塊要付多少**（人週，意見）：

| 換掉 | 代價 | 理由 |
|---|---|---|
| Mosquitto → NanoMQ / VerneMQ / FlashMQ（若法務過） | 3～5 | topic 契約與 node 不變；重寫 conf 產生器與 ACL 機制（dynsec 是 Mosquitto 專有；NanoMQ 的 ACL 與 bridge retained 行為未查證，`mqtt-brokers.md` 列 15、16）；VerneMQ bridge 只用 3.1.1 會丟 v5 屬性（列 25），要退回 3.1.1 的設計 |
| MQTT → HTTPS long-poll（回到 P0） | 5～8 | register/SQ/CQ 語意與 SQLite 不變，換 node 的 transport 層與 root adapter 的扇出（要補 consumer 概念）；HMI 與 T1 MQTT 接點消失 |
| Postgres → VictoriaMetrics | 1～2 | writer 介面；Grafana datasource 換；告警不在儲存層 |
| Odoo → 另一個 ERP | 3～4 | root adapter 是邊界；dynsec、CA、broker 全不動；ERP 模組重寫不計 |
| 自製簽名格式 → 標準（例如 COSE） | 2 | 只在 root adapter 與 unit 的驗簽模組 |

**可逆性最差的一塊**是 topic 契約本身：2026 年裝的螢幕到 2029 年還在講 v1 的 topic 與 payload 版本，`02-tradeoffs.md` §1「協定是自己的」那一段在 P1 一樣成立，只是協定從 HTTP 路徑變成 topic 與 JSON 信封。announce 裡的版本協商與相容矩陣（`02-tradeoffs.md` §3 第 1 項）在 P1 第一天同樣要放進去。
