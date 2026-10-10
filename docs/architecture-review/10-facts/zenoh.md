# 事實查核：Eclipse Zenoh 與其他「路由樹」型基底

查證日期：2026-10-10（下表「查證日期」欄一律為此日）。查證者：波次 A 研究員（Sonnet）。

## 查證環境的限制（先講，免得誤讀來源欄）

- `zenoh.io`、`docs.rs`、`lib.rs`、`projects.eclipse.org`、`github.com` 網頁、`api.github.com`、`crates.io/api` 在本次環境 WebFetch / curl 都連不上（DNS 失敗或 proxy 403）。GitHub MCP 與 `gh` 也只開放本專案 repo。
- 可用的一手來源有四類：(1) `raw.githubusercontent.com` 上 eclipse-zenoh 各 repo 的檔案（README、Cargo.toml、DEFAULT_CONFIG.json5、原始碼）；(2) PyPI JSON API；(3) `download.eclipse.org/zenoh/` 的目錄列表；(4) npm registry、`index.crates.io`、Docker Hub tags API。
- 凡來源欄標「搜尋摘要」者，表示我只讀到 WebSearch 回傳的頁面摘要，沒開過原頁，需要在有網路時直接核對。
- 引用 repo 檔案時，內容是 `main` 分支在 2026-10-10 的狀態（Cargo.toml 版本為 1.10.1）。

## 1. 結論先講

1. **Zenoh 的形狀是這幾個候選基底裡最像 P0 的**：client 只對外撥一條連線（F-21、F-41、M-04 方向成立）；1.9.0（2026-04-10）起有 Regions，官方描述可做任意深度的 north/south 階層，一個 region 至多一個 north（Z3）。這是「樹」被一等公民化，不是我們硬拼出來的。但它是 2026-04 才出現的功能，距今約半年，沒有任何三層以上生產案例的證據（未查證）。
2. **授權乾淨**：Rust 核心、MQTT plugin、Python 與 TS binding 都是 `EPL-2.0 OR Apache-2.0`，我們可選 Apache-2.0，M-05 不構成問題（Z6）。
3. **MQTT plugin 的「失去感」沒有被補回來**。從原始碼看：發給 MQTT 訂閱者的訊息一律 QoS 0、subscribe 只回 `AtMostOnce`、整份 plugin 原始碼沒有 retain 或 will 的處理、不收以 `/` 開頭或含 `//` 的 topic、MQTT 端的授權只有全域 allow/deny regex 加一個明文帳密檔（Z10～Z12）。它是「讓 MQTT 設備能把資料丟進 Zenoh」的翻譯器，不是 broker 的替代品。02-tradeoffs 列的「retained、last-will、第 N 個消費者」三項，Zenoh 只補到第三項（pub/sub 扇出本來就是它的本業），前兩項沒補。
4. **安全面的零件比 P0 自刻的多**：transport 層 TLS/mTLS、`close_link_on_expiration`（憑證到期自動斷線，與短效憑證設計相容）、key expression 層級的 ACL，subject 可用 cert common name 或 username（Z15、Z16）。缺口：DEFAULT_CONFIG 內查不到任何 CRL / OCSP / 撤銷設定，撤銷仍要靠短效加拒絕續期，與 P0 現況相同（Z17）。ACL 設定據文件摘要不能 runtime 更新（Z16，搜尋摘要）。
5. **維護者時鐘是 Zenoh 最大的未知**：minor 版本約每 1～4 個月一個（2024-10 到 2026-08 共 11 個 minor），沒找到任何 LTS 或支援期限文件（Z4、Z5）；單一公司（ZettaScale）主導（Z7）；1.9 的 Regions 改了 peer 拓撲與 autoconnect 預設（Z3、Z23），顯示 1.x 的 minor 會帶行為變更。
6. 這份文件**不下「用或不用」的結論**。

## 2. 事實表

### 2.1 角色與拓撲

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| Z1 | 三種角色：**router**（主動在 session 間路由，建議互連成骨幹）、**peer**（預設模式；同網路內直連，靠 multicast 或 gossip 發現）、**client**（只與一個 router 或 peer 建立一條 session，路由全部委派給該附著點）。1.0.0 規格原文：「A Client connects to exactly one Router or Peer and delegates all routing to its attachment point.」。Arm 的教學頁指出 client 對 router 只做一條 outbound 連線，所以能穿 NAT 與防火牆而不開 inbound port。 | https://zenoh.io/docs/getting-started/deployment/ ； https://spec.zenoh.io/spec/1.0.0/architecture/roles.html ； https://learn.arm.com/learning-paths/cross-platform/distributed-ros2-zenoh-lp2/1-understand-the-topology/ （皆為搜尋摘要） | 2026-10-10 |
| Z2 | DEFAULT_CONFIG.json5：`mode` 預設 `"peer"`；`connect.endpoints` 指定要連的 router / peer；client 模式「only allows connecting to a single endpoint」（可對同一 endpoint 建多條 link）；endpoint 可指定 `#iface=`、`#bind=`、`#dscp=`。協定支援 tcp、udp、tls、quic、ws、serial、unixsock-stream、unixpipe、vsock。 | https://raw.githubusercontent.com/eclipse-zenoh/zenoh/main/DEFAULT_CONFIG.json5 | 2026-10-10 |
| Z3 | **Regions（1.9.0 起）**：官方描述為取代固定的 router/peer/client 分層，可設計任意深度的階層；gateway 服務一或多個 south region，在 north region 當它們的代表；routed region 用 router 模式、可為 mesh；peer-to-peer region 用 peer 模式、必須為 clique；一個 region 至多一個 north region。實證：DEFAULT_CONFIG.json5 在 tag `1.9.0` 與 `1.10.0` 含 `gateway` / `region_name` 鍵（各 8 行匹配），在 `1.8.0` 與 `1.0.0` 為 0 行；main 的註解寫 `gateway.south` 只有一個 preset `"auto"`（「puts peers and clients south of routers and client south of peers」），自訂則以 `modes` / `interfaces` / `zids` / `region_names` 過濾。1.9 之前的多層結構：**未查證**（只從搜尋摘要知道是固定 router/peer/client 三層）。 | https://zenoh.io/docs/migration_1.9/regions/ 與 https://zenoh.io/blog/2026-04-16-zenoh-longwang/ （搜尋摘要）； https://raw.githubusercontent.com/eclipse-zenoh/zenoh/1.9.0/DEFAULT_CONFIG.json5 ； https://raw.githubusercontent.com/eclipse-zenoh/zenoh/1.10.0/DEFAULT_CONFIG.json5 ； https://raw.githubusercontent.com/eclipse-zenoh/zenoh/1.8.0/DEFAULT_CONFIG.json5 | 2026-10-10 |

### 2.2 節奏、授權、維護者、語言

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| Z4 | **發行節奏**（PyPI 上傳日與 Eclipse 下載區日期一致）：1.0.0 = 2024-10-21；1.1.0 = 2024-12-11；1.2.0 = 2025-01-30；1.3.0 = 2025-03-21；1.4.0 = 2025-05-22；1.5.0 = 2025-07-25；1.6.1 = 2025-10-14（PyPI 與下載區都沒有 1.6.0）；1.7.0 = 2025-12-04；1.8.0 = 2026-03-13；1.9.0 = 2026-04-10；1.10.0 = 2026-08-14；1.10.1 = 2026-09-07。1.0 到 1.10 共 11 個 minor、約 22 個月；相鄰 minor 的間隔從 28 天到 126 天。nightly Docker 映像最近一次更新 2026-10-09（tag `1.10.1-8-g87cb2d8`）。 | https://pypi.org/pypi/eclipse-zenoh/json ； https://download.eclipse.org/zenoh/zenoh/ ； https://hub.docker.com/v2/repositories/eclipse/zenoh-bridge-mqtt/tags?page_size=5 | 2026-10-10 |
| Z5 | **LTS / 支援期限 / 安全公告流程**：我在可存取的來源中找不到（無 endoflife.date 條目可查、官網打不開）。GitHub Security Advisories 頁也打不開，所以「2026 年 Zenoh 有幾則 CVE」**未查證**。 | （無） | 2026-10-10 |
| Z6 | **授權**：`zenoh` workspace Cargo.toml `license = "EPL-2.0 OR Apache-2.0"`；repo 的 LICENSE 檔內含 Apache License 2.0 全文，檔頭列出 apache-2.0 與 epl-2.0；MQTT plugin 的 Cargo.toml 同為 `EPL-2.0 OR Apache-2.0`，原始碼檔頭 SPDX 同；PyPI 分類同時列 Apache 與 EPL-2.0；npm `@eclipse-zenoh/zenoh-ts` 授權欄 `(Apache-2.0 OR EPL-2.0)`。最低 Rust 版本 `rust-version = "1.75.0"`。 | https://raw.githubusercontent.com/eclipse-zenoh/zenoh/main/Cargo.toml ； https://raw.githubusercontent.com/eclipse-zenoh/zenoh/main/LICENSE ； https://raw.githubusercontent.com/eclipse-zenoh/zenoh-plugin-mqtt/main/Cargo.toml ； https://pypi.org/pypi/eclipse-zenoh/json ； https://registry.npmjs.org/@eclipse-zenoh/zenoh-ts | 2026-10-10 |
| Z7 | **維護者**：原始碼檔頭為「Copyright (c) 2022 ZettaScale Technology」，Contributors 為「ZettaScale Zenoh Team, zenoh@zettascale.tech」。Eclipse 專案頁（搜尋摘要，非原頁）列 Angelo Corsaro 與 Yong He 為 project lead，Corsaro 另為 ZettaScale 的 CEO/CTO；ecosyste.ms 快照（時間不明，約抓取前四個月同步）顯示 43 名 committer、其中 30 名近一年活躍，top 為 Luca Cominardi、Olivier Hécart、Julien Enoch。committer 所屬公司比例、資金來源：**未查證**。 | https://raw.githubusercontent.com/eclipse-zenoh/zenoh-plugin-mqtt/main/zenoh-plugin-mqtt/src/mqtt_helpers.rs ； https://projects.eclipse.org/projects/iot.zenoh/who ； https://commits.ecosyste.ms/hosts/GitHub/repositories/eclipse-zenoh/zenoh （後兩者為搜尋摘要） | 2026-10-10 |
| Z8 | **核心實作是 Rust**；其他語言 binding 都是包 Rust 實作，唯一例外是純 C 的 zenoh-pico。`zenoh` crate 只有 `zenoh` 與 `zenoh-ext` 是穩定 API，`commons` 內部 crate「their public APIs can be changed at any time」。`zenoh-ext` 提供 `AdvancedPublisher` / `AdvancedSubscriber`（README 稱「advanced delivery guarantees」，具體語意、與 F-46/F-47 的對應：**未查證**）。 | https://raw.githubusercontent.com/eclipse-zenoh/zenoh/main/README.md | 2026-10-10 |

### 2.3 MQTT plugin

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| Z9 | **形態與版本**：plugin 可當動態函式庫載入 `zenohd`，或當獨立執行檔 `zenoh-bridge-mqtt`（以 client 或 peer 加入 Zenoh）。版本與核心同步，main 為 1.10.1；Eclipse 下載區有 1.8.0、1.9.0、1.10.0、1.10.1 目錄。官方 Docker 映像 `eclipse/zenoh-bridge-mqtt` 有 amd64 與 arm64（nightly 映像壓縮後約 14.9 MB）。README 描述它「acts as a MQTT broker, accepting connections from MQTT clients (V3 and V5)」，把 MQTT pub/sub 翻成 Zenoh pub/sub：topic `device/123/temperature` ↔ key expression 同名，`device/#` ↔ `device/**`。 | https://raw.githubusercontent.com/eclipse-zenoh/zenoh-plugin-mqtt/main/README.md ； https://raw.githubusercontent.com/eclipse-zenoh/zenoh-plugin-mqtt/main/Cargo.toml ； https://download.eclipse.org/zenoh/zenoh-plugin-mqtt/ ； https://hub.docker.com/v2/repositories/eclipse/zenoh-bridge-mqtt/tags?page_size=5 | 2026-10-10 |
| Z10 | **語意限制（來自原始碼，非官方聲明）**：(a) subscribe 一律以 `s.confirm(QoS::AtMostOnce)` 回覆，推給 MQTT client 時用 `publish_at_most_once`，所以 Zenoh→MQTT 方向恆為 QoS 0；(b) `lib.rs`、`mqtt_helpers.rs`、`mqtt_session_state.rs`、`config.rs` 對 `retain`、`last_will`、`will` 的 grep 都是 0 筆，也沒有任何 Zenoh `get` 查詢來補 late subscriber，所以 retained 與 last-will 看起來都沒實作；(c) v3 handshake 以 `handshake.ack(session, false)` 回覆（session present 恆為 false），沒有跨連線的 session 持久化；(d) MQTT→Zenoh 方向只做 `session.put(ke, payload)`，沒帶 retain、QoS、user property。這些是我讀原始碼的推論，**需要在 PoC 用真實 MQTT client 驗證**。 | https://raw.githubusercontent.com/eclipse-zenoh/zenoh-plugin-mqtt/main/zenoh-plugin-mqtt/src/lib.rs ； https://raw.githubusercontent.com/eclipse-zenoh/zenoh-plugin-mqtt/main/zenoh-plugin-mqtt/src/mqtt_session_state.rs ； https://raw.githubusercontent.com/eclipse-zenoh/zenoh-plugin-mqtt/main/zenoh-plugin-mqtt/src/mqtt_helpers.rs | 2026-10-10 |
| Z11 | **topic 限制**：`mqtt_topic_to_ke` 對以 `/` 開頭、以 `/` 結尾、或含 `//` 的 topic 直接 `bail!`（「MQTT topic with empty level not-supported」）。很多現場設備會用 `/factory/line1/...` 這種前導斜線的 topic，這類 T1 會被拒。多餘的 `+`、`#` 轉成 `*`、`**`。 | https://raw.githubusercontent.com/eclipse-zenoh/zenoh-plugin-mqtt/main/zenoh-plugin-mqtt/src/mqtt_helpers.rs | 2026-10-10 |
| Z12 | **MQTT 端的認證與授權**：支援 MQTTS（伺服器端 TLS，或 `root_ca_certificate` 啟用 mTLS）；帳密為純文字檔 `username:password`（README 自己警告需搭配 MQTTS）；topic 圍堵只有全域 `allow` / `deny` regex，沒有 per-client 規則。原始碼中所有 MQTT client 共用 plugin 的同一個 Zenoh session（推論：Zenoh 的 ACL subject 看到的是 bridge，不是個別設備，所以 cert CN 層級的圍堵只在 MQTT 這一跳之外有效；**需 PoC 確認**）。`allow` / `deny` 在 `route_mqtt_to_zenoh` 內以 `Locality::Any` / `SessionLocal` 實現，附近有一行 `// TODO: check allow/deny`。 | https://raw.githubusercontent.com/eclipse-zenoh/zenoh-plugin-mqtt/main/README.md ； https://raw.githubusercontent.com/eclipse-zenoh/zenoh-plugin-mqtt/main/DEFAULT_CONFIG.json5 ； https://raw.githubusercontent.com/eclipse-zenoh/zenoh-plugin-mqtt/main/zenoh-plugin-mqtt/src/mqtt_session_state.rs | 2026-10-10 |
| Z13 | **動態 plugin 的 ABI 風險**：zenohd 與 MQTT plugin 的 README 都警告 Rust 沒有穩定 ABI，plugin 必須用與 zenohd「exact same Rust version」和同版 `zenoh` 依賴編譯，否則可能 SIGSEGV（zenohd 較新的 README 寫成載入時會被拒絕）。獨立執行檔 `zenoh-bridge-mqtt` 沒有這個限制。 | https://raw.githubusercontent.com/eclipse-zenoh/zenoh/main/zenohd/README.md ； https://raw.githubusercontent.com/eclipse-zenoh/zenoh-plugin-mqtt/main/README.md | 2026-10-10 |

### 2.4 REST、storage

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| Z14 | **REST plugin**：靜態連進 `zenohd`（不用另裝），以 `--rest-http-port` 啟用；`PUT` / `DELETE` 對應 pub/sub、`GET` 對應 query；回應 JSON 的 `value` 為 base64。plugin 的 `Config` 結構只有 `http_port`（測試斷言預設 `[::]:8080`）、`work_thread_num`、`max_block_thread_num`，原始碼對 `tls`、`auth`、`bearer`、`https` 的 grep 為 0 筆。結論：沒有看到 TLS 或認證欄位，不能直接當對外 API；真要用要放在反向代理後面。 | https://raw.githubusercontent.com/eclipse-zenoh/zenoh/main/plugins/zenoh-plugin-rest/README.md ； https://raw.githubusercontent.com/eclipse-zenoh/zenoh/main/plugins/zenoh-plugin-rest/src/config.rs ； https://raw.githubusercontent.com/eclipse-zenoh/zenoh/main/plugins/zenoh-plugin-rest/src/lib.rs | 2026-10-10 |
| Z15 | **Storage manager**：靜態連進 `zenohd`；後端為 `memory`（內建）、filesystem、S3（含 MinIO）、RocksDB、InfluxDB；「volume」是後端加連線設定，「storage」是 key expression → volume 的對映；README 註明 storage 需要訊息帶 timestamp（router 模式預設啟用；`zenohd` 預設為每筆路由資料加 HLC timestamp，可用 `--no-timestamp` 關掉）。**官方後端清單沒有 PostgreSQL 或任何 SQL 後端。** InfluxDB 後端同時支援 InfluxDB 1.x 與 2.x（設定欄位不同）；crates.io 索引上 `zenoh-backend-influxdb` 的最新版仍是 `0.10.0-rc`，而 repo main 的 Cargo.toml 為 1.10.1 並以 git 依賴指向 zenoh main，代表 crates.io 版本不是跟著 1.x 發佈（RocksDB 後端則在 crates.io 為 1.10.1）。 | https://raw.githubusercontent.com/eclipse-zenoh/zenoh/main/plugins/zenoh-plugin-storage-manager/README.md ； https://raw.githubusercontent.com/eclipse-zenoh/zenoh/main/zenohd/README.md ； https://raw.githubusercontent.com/eclipse-zenoh/zenoh-backend-influxdb/main/README.md ； https://raw.githubusercontent.com/eclipse-zenoh/zenoh-backend-influxdb/main/Cargo.toml ； https://index.crates.io/ze/no/zenoh （同一索引站取 `zenoh-backend-influxdb`、`zenoh-backend-rocksdb`） | 2026-10-10 |

### 2.5 認證、TLS、ACL

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| Z16 | **TLS / mTLS**：`transport.link.tls` 有 `root_ca_certificate`、`listen_private_key`、`listen_certificate`、`enable_mtls`（預設 false）、`connect_*`、`verify_name_on_connect`（預設 true）、`close_link_on_expiration`（預設 false；設 true 時，TLS/QUIC link 在對方憑證鏈到期時自動斷線，且 listener 端要踢掉 client 需要 mTLS）。帳密：`auth.usrpwd`（`dictionary_file`）；另有 `auth.pubkey`（公私鑰與 `known_keys_file`）。 | https://raw.githubusercontent.com/eclipse-zenoh/zenoh/main/DEFAULT_CONFIG.json5 | 2026-10-10 |
| Z17 | **撤銷**：DEFAULT_CONFIG.json5 對 `crl`、`revo`、`ocsp` 的 grep 為 0 筆；找不到 Zenoh 內建的憑證撤銷機制。配合 `close_link_on_expiration` 與短效憑證，撤銷可以退化成「不再續期、等到期被踢」，這與 P0 §4 的設計等價，不是 Zenoh 額外送的。 | https://raw.githubusercontent.com/eclipse-zenoh/zenoh/main/DEFAULT_CONFIG.json5 | 2026-10-10 |
| Z18 | **ACL**：`access_control` 區塊（預設註解掉、`enabled: false`、`default_permission` 預設 deny）。rule 指定 `messages`（put、delete、declare_subscriber、query、reply、declare_queryable、liveliness_token、liveliness_query、declare_liveliness_subscriber）、`flows`（ingress / egress）、`permission`、`key_exprs`；subject 可用 `interfaces`、`cert_common_names`（TLS/QUIC）、`usernames`、`link_protocols`、`zids`；policy 把 rule 綁到 subject。設定檔明文警告：ZID 沒有認證機制支撐，「should not be used in production」。官方手冊摘要稱 ACL 不能 runtime 更新、改設定要重啟（搜尋摘要，未讀原頁）。另有 `qos` 區塊可依 key expression 覆寫 congestion_control、priority、reliability，與 `downsampling` 規則（每 key expression 設最高頻率 Hz），可用作 hostile T1 的限速（F-18）。 | https://raw.githubusercontent.com/eclipse-zenoh/zenoh/main/DEFAULT_CONFIG.json5 ； https://zenoh.io/docs/manual/access-control/ （搜尋摘要） | 2026-10-10 |

### 2.6 binding、足跡、採用

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| Z19 | **Python binding**：PyPI `eclipse-zenoh` 最新 1.10.1（2026-09-07），開發狀態分類 `4 - Beta`，`requires_python >=3.8`（README 寫「tested with Python 3.8～3.12」；wheel 為 `cp39-abi3`）。1.10.1 的 wheel 含 `manylinux_2_28_aarch64`、`manylinux_2_17_armv7l`、`linux_armv6l`、x86_64、i686。README 說明它是包 Rust 實作，沒有 wheel 的平台要自備 Rust toolchain 從 sdist 編。 | https://pypi.org/pypi/eclipse-zenoh/json ； https://raw.githubusercontent.com/eclipse-zenoh/zenoh-python/main/README.md | 2026-10-10 |
| Z20 | **其他 binding**：TypeScript `@eclipse-zenoh/zenoh-ts` 最新 1.10.1（2026-09-07），需要 router 上的 `zenoh-plugin-remote-api`（WebSocket server；zenohd README 列為獨立 repo plugin）；Go binding 在 1.9.0 新增（搜尋摘要）。 | https://registry.npmjs.org/@eclipse-zenoh/zenoh-ts ； https://raw.githubusercontent.com/eclipse-zenoh/zenoh/main/zenohd/README.md ； https://discourse.openrobotics.org/t/eclipse-zenoh-1-9-0-longwang-released-regions-quic-multistream-go-binding-rmw-zenoh-impact-inside/54135 （搜尋摘要） | 2026-10-10 |
| Z21 | **arm64 足跡**：官方 `zenoh-1.10.1` 發佈區有 `aarch64-unknown-linux-gnu`（standalone zip 8.6 MB、debian zip 5.7 MB）、`aarch64-unknown-linux-musl`（8.6 MB）、`armv7`、`arm` 的 zip；MQTT plugin 同樣有 aarch64 與 armv7 套件。這些是**壓縮檔大小**，不是執行時 RSS。CM4 上的 RAM、CPU、連線數上限：**未查證**，需 PoC 實測。MQTT plugin 的 `tx_channel_size` 預設 65536 個訊息，滿了新訊息「will be dropped」（背壓是丟棄）。 | https://download.eclipse.org/zenoh/zenoh/1.10.1/ ； https://download.eclipse.org/zenoh/zenoh-plugin-mqtt/ ； https://raw.githubusercontent.com/eclipse-zenoh/zenoh-plugin-mqtt/main/DEFAULT_CONFIG.json5 | 2026-10-10 |
| Z22 | **ROS 2 / rmw_zenoh**：`ros2/rmw_zenoh` README 說其 binary 套件提供給各 distro 的 Tier-1 平台，預設設定下 node 靠 Zenoh router 的 gossip 互相發現（多播預設關閉，沒有 router 則 node 無法互相發現）。ROS 2 Kilted Kaiju 發佈公告稱 Zenoh 為首個支援的 Tier 1 之一、但「not yet the default RMW」（搜尋摘要，原頁未開）。Autoware 文件稱預設 CycloneDDS、相容 Zenoh 並有教學（搜尋摘要）。PX4 有 Zenoh middleware 文件頁（只見到標題，內容未讀）。**具名的生產部署（客戶、規模、年數）：未查證**；Eclipse 的 adopters 頁沒打開。 | https://raw.githubusercontent.com/ros2/rmw_zenoh/rolling/README.md ； https://www.openrobotics.org/blog/2025/5/23/ros-2-kilted-kaiju-released （搜尋摘要）； https://docs.autoware.org/main/installation/additional-settings-for-developers/network-configuration/zenoh-settings/ （搜尋摘要）； https://docs.px4.io/main/en/middleware/zenoh.html （僅標題） | 2026-10-10 |
| Z23 | **minor 版的行為變更**：1.9.0 遷移頁摘要稱 autoconnect 預設對 client 與 peer 改變；第三方 issue 回報 1.9 拿掉了 peer 部署對 clique 要求的豁免，建議改用 router 下的多個 peer subregion（dora-rs 專案 issue #2721，單一第三方，視為軼事）。1.9 還加入 QUIC multistream 與可靠 UDP（搜尋摘要）。 | https://zenoh.io/docs/migration_1.9/regions/ （搜尋摘要）； https://github.com/dora-rs/dora/issues/2721 （搜尋摘要） | 2026-10-10 |

## 3. 其他候選基底（各一段；事實皆來自搜尋摘要，未開原頁）

**MQTT-SN。** 事實：1.2 版最初由 IBM 發佈，2.0 在 OASIS 內開發，搜尋到的是 2023-09-17 的 Working Draft 27，是否定稿未查證；常跑在 UDP 上，需要 gateway 翻成標準 MQTT；EMQX 內建 MQTT-SN 1.2 gateway（預設 UDP 1884）；Eclipse Paho 有 transparent gateway。來源：https://lists.oasis-open.org/archives/mqtt/202311/msg00012.html ； https://docs.emqx.com/en/emqx/latest/gateway/mqttsn.md ； https://docs.zephyrproject.org/3.7.0/connectivity/networking/api/mqtt_sn.html （查證 2026-10-10）。與我們的關係（意見）：MQTT-SN 為電池 MCU 與非 TCP 鏈路而生，我們的錨點 5 是插電 Linux 盒子、T1 以 Modbus 為主，沒有看到它解決的問題。若 D-05 門禁讀卡機或 D-06 的現場感測器是 MCU 且走 802.15.4 / LoRa 類鏈路才會出現，那也是 T1 的事，由 bridge 的 adapter 處理。不建議納入。

**CoAP / LwM2M 的管理模型。** 事實：LwM2M 1.2 規格由 OMA SpecWorks 完成，2020-11-24 董事會核准，新增 MQTT 與 HTTP 傳輸；Eclipse Leshan 是 Java 的 server / client 實作，搜尋到的第三方鏡像寫 1.x 分支對應核心規格 v1.0.2，Eclipse 1.2.0 發佈審查頁寫實作的是 LwM2M 1.0.x，**未找到 Leshan 支援 1.2 的證據**；Wakaama 的 2026 年狀態未查證。來源：https://omaspecworks.org/?p=8615 ； https://ioterop.com/news/lightweight-m2m-1-2-iot-device-management-feature-release ； https://projects.eclipse.org/projects/iot.leshan/releases/1.2.0/review （查證 2026-10-10）。與我們的關係（意見）：LwM2M 的「bootstrap server → registration → object/resource → observe」與 P0 的 adopt / announce / register / report 在管理語意上高度同構，值得當 **P0 詞彙的參照物**（資源模型、bootstrap 與 operational 憑證分離），不值得當傳輸：它建立在 CoAP/UDP（加 DTLS）上，與「HTTPS mTLS、客戶 proxy」不合；T1 是封閉韌體不會講它；參考實作偏 Java（M-02）。

**OPC UA PubSub over MQTT。** 事實：OPC UA Part 14 定義的 PubSub 有 broker 傳輸（MQTT、AMQP），編碼可為 UADP（二進位）或 JSON；open62541 支援 UDP multicast、Ethernet、MQTT 傳輸與兩種編碼，1.3 版釋出說明列有 TLS 加密的 MQTT PubSub；1.2 文件曾稱 PubSub 為實驗性且預設關閉；Fraunhofer IOSB 提供官方商業支援。來源：https://open62541.org/articles/22_05_12_release_1_3 ； https://open62541.org/doc/1.2/pubsub.html ； https://www.open62541.org/doc/open62541_product_sheet_web.pdf （查證 2026-10-10）。與我們的關係（意見）：它只是 MQTT 之上的 payload 與 topic 約定，不是新的基底，也不替代 broker。只有 D-06 的機台本身講 OPC UA PubSub 時才相關，而且它**增加**對 MQTT 的依賴，不減少。這是「放棄 MQTT 的失去」的一個具體實例：若 T1 機台走 OPC UA over MQTT，P0 的 bridge 必須有 MQTT ingress，Zenoh 的 MQTT plugin 在 QoS 與 topic 限制（Z10、Z11）下是否夠用要 PoC。

## 4. 與我們情境的關係（對照 03-brief.md §1 錨點與需求 ID）

以下標「事實」的句子在 §2 有來源；標「意見」的是我的判斷。

- **錨點 3 / M-03 / F-41（三種部署形狀）。** 事實：client 與 gateway 的連線方向是 child 撥向 parent（Z1、Z2、Z3）。意見：cloud 形狀（站點只有 outbound）在連線方向上成立。是否能穿過客戶 HTTP proxy：DEFAULT_CONFIG 的 link protocols 含 `ws`，但**未查證** Zenoh 是否支援 HTTP CONNECT proxy；P0 的 HTTPS long-poll 在這點上最保守，Zenoh 要 PoC。
- **錨點 2 / M-04 / C-25（hostile T1）。** 事實：key expression 層級 ACL 可綁 cert CN 或 username，另有 QoS 覆寫與 downsampling（Z18）。事實：MQTT plugin 的 MQTT 端沒有 per-client 授權（Z12）。意見：若讓 Zenoh 取代 P0 的 node 間協定，bridge 對 child 的圍堵零件（身分到 key expression 的對應、限速）是現成的，這比 P0 要自刻的少；但 T1 若講 MQTT 並經由 plugin 進來，圍堵會退回 bridge 層自己寫的檢查，hostile T1 的 schema 檢查（P0 §1 第 5 點）Zenoh 沒有。
- **錨點 4、7（規模、最小部署）。** 事實：zenohd 的 aarch64 安裝包約 8.6 MB（Z21）。意見：一片螢幕 + ERP 這種最小部署若上 Zenoh，是 Odoo + zenohd（可能再加 zenoh-bridge-mqtt）= 至少三個服務，比 P0 的兩個多一個，這是 03-brief §2 允許的放寬，要拿東西來換（見 §5）。
- **F-46 / F-47（不丟命令、不重複、結果可觀察）。** 事實：Zenoh 核心是 pub/sub + query，plugin 的 storage 需要 timestamp（Z15）；`zenoh-ext` 的 Advanced pub/sub 有「advanced delivery guarantees」但語意未讀（Z8）。意見：Zenoh 沒有現成的「job 依 key 執行一次、結果進耐久 CQ」，P0 的 register 與 SQ/CQ 語意仍要自己在上面做，和 NATS 的結論一致（見 nats.md §1）。
- **M-05（授權）。** 事實：雙授權、可選 Apache-2.0（Z6）。P0 此點不受影響。
- **D-05 / D-06。** 意見：Zenoh 的 query + pub/sub 低延遲的定位（README 自述）對 D-06 的現場 HMI 層比 P0 的樹合理，但 HMI 若要用 MQTT 的 retained / last-will 習慣，Zenoh 的 MQTT plugin 給不了（Z10）。

## 5. 結尾：Zenoh 相對 NATS 與 MQTT broker，在 M-06 與 M-02 上的位置

NATS 與 MQTT broker 的數字取自同目錄 `nats.md` 與 `mqtt-brokers.md`，我沒有重查。

**M-06（維護者時鐘）。**

| 項目 | Zenoh | NATS（nats.md） | MQTT broker（mqtt-brokers.md） |
|---|---|---|---|
| 發行節奏 | 11 個 minor / 22 個月，相鄰間隔 28～126 天（Z4） | 約 5～7 個月一個 minor、支援最近兩條 series、無開源 LTS | Mosquitto 2026-02-09 後 8 個月沒有新 tag，但 master 有 commit；NanoMQ、VerneMQ 等月更或季更 |
| 支援期限文件 | 找不到（Z5） | 有 series 的支援規則，無 LTS | 依專案而異；Mosquitto 屬 Eclipse，細節見該檔 |
| 背後組織 | ZettaScale 為主，Eclipse Foundation 專案（Z7） | Synadia 為主，商標移轉 Linux Foundation、repo 留 CNCF（二手來源） | Mosquitto 為 Eclipse 專案；多個選項各有不同背景 |
| minor 的行為變更 | 1.9 改 autoconnect 預設與 peer 拓撲（Z23） | 2.14 / 2.15 的 JetStream ack subject 變更預告 | 沒有系統性資料 |
| 安全公告密度 | **未查證**（Z5） | 2026 年兩批 advisory、多則落在 MQTT / leafnode（nats.md N17） | Aedes 2026 年 4 份公告含 3 個 High；其餘見該檔 |

意見：Zenoh 的時鐘是三者中**最快**的，而且我們找不到任何承諾「這條線維護多久」的文件，所以 M-06 的推論只能是「約每年要升好幾次」；唯一的緩衝是授權雙選一與 Eclipse Foundation 的治理，這讓「廠商消失」時仍可 fork（可行性取決於 Rust 與 Zenoh 協定的內部知識，我們目前沒有）。bus factor 以 ZettaScale 為主，這點與 NATS 對 Synadia 的狀況類似。MQTT broker（尤其 Mosquitto）的時鐘最慢，也是最「無聊」的，這正是 M-06 要的性質。若採 Zenoh 又保留 MQTT plugin，**plugin 與 zenohd 同版更新**（Z9、Z13），時鐘不會多一個，但也不會比核心慢。

**M-02（種類數）。**

- 意見：Zenoh 帶進 `zenohd`（Rust）、Zenoh 的 key expression 與 query 心智模型（沒有同類東西可類比的新詞彙）、`zenoh-bridge-mqtt`（獨立執行檔，同一個 repo 家族）、若要時序儲存則加後端（沒有 Postgres 後端，Z15）。我們的 node 若用 Python 則是 Python wheel（Z19，Beta）；若用 Rust 則直接連結 crate。
- 對照：NATS 是單一 Go binary，內建 MQTT listener 與 JetStream，種類較少，但 MQTT 路徑強迫開 JetStream 與管磁碟（nats.md N10）。MQTT broker 單一 binary，但沒有「樹」，樹仍要自己做。
- 結論（意見）：**Zenoh 沒有減少種類，而是用「一種新的、功能廣的東西」換掉 P0 的 node 協定與 bridge**。它是否划算取決於 PoC 能否證明兩件事：(1) 只靠 Regions 加 ACL，P0 的 announce / report / fetch / complete 四個動詞能不能用 Zenoh 的 pub/sub + query + liveliness 薄薄地實作，不必自己刻訊息層；(2) T1 的 MQTT 路徑是否只需要 plugin 提供的 QoS 0、無 retain、無 will 的語意。若 (2) 不成立，我們還是要在 bridge 旁放一個真的 MQTT broker（見 mqtt-brokers.md 的 Mosquitto 建議），那 Zenoh 就是在原本的 P0 之上**多加一種**東西，M-02 淨增加。

## 6. 未查證或有疑慮之處

1. Zenoh 的 LTS、支援期限、安全公告：完全沒查到（Z5）。
2. Regions 的三層以上實戰、效能、已知問題：只有官方描述與一則第三方 issue（Z3、Z23）。
3. MQTT plugin 的語意限制是我讀原始碼的推論，而且只讀了 `main` 分支；GitHub issues 與 CHANGELOG 沒打開，可能有計畫中的 retain / will 支援或已知 bug。需要用真實 broker 測試套件（例如對照 `mqtt-semantics.md` 的清單）在 PoC 驗。
4. Zenoh 對 HTTP CONNECT proxy 的支援、`ws` 傳輸對 443 / 客戶 proxy 的行為：未查證。
5. CM4 上的記憶體、CPU、連線上限：未查證；只有安裝包大小（Z21）。
6. `AdvancedPublisher` / `AdvancedSubscriber` 的實際保證與 retention window（對 F-46/F-47、B-01～B-14 的對應）：未讀（Z8）。
7. 生產採用案例：只有 ROS 2 生態的間接證據（Z22），沒有具名客戶與規模；和我們的「工廠 / 辦公室、插電 Linux、IoT 管理」領域相符的案例：**未查證**。
8. 僅憑搜尋摘要的來源（Z1、Z3、Z7、Z18、Z20、Z22、Z23）需要在能開 `zenoh.io` 時回頭核對原頁。
9. 第 3 節三個「其他基底」皆只有搜尋摘要，沒開原頁；LwM2M 與 Leshan 的現況（2026）沒有查到。
10. 我沒有查 Zenoh 對 Python 版本的實際最低需求矛盾：README 寫測過 3.8～3.12、PyPI 寫 `>=3.8`、wheel 是 `cp39-abi3`。對 Debian 12（Python 3.11）的 CM4 來說不影響，但舊系統要小心。
