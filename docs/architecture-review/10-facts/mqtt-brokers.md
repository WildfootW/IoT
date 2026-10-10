# 事實查核：MQTT broker 版圖（per-bridge broker 與可嵌入 broker）

查證日期：2026-10-10（除非表內另註）。範圍：Eclipse Mosquitto、NanoMQ、EMQX、HiveMQ CE、rumqttd、VerneMQ、FlashMQ、Aedes，以及可嵌入者 mochi-mqtt、amqtt、rmqtt。

## 1. 結論先講

1. 對 M-05（授權不綁客戶）：**EMQX 出局**。自 5.9.0 起整個專案是 BSL 1.1，免費生產用途只含單節點，且不含「嵌進賣給第三方的產品」。**FlashMQ 要法務看過**：OSL-3.0 把「網路上提供服務」視同散布，修改後的衍生品須維持 OSL。其餘（Mosquitto、NanoMQ、HiveMQ CE、rumqttd、VerneMQ、Aedes、mochi、amqtt、rmqtt）都是 EPL/EDL、MIT、Apache-2.0 或 MIT/Apache 雙授權，不對客戶加義務。
2. 對 M-06（活著的維護者）：Mosquitto（2026-10-04 仍有 commit）、NanoMQ（2026-08 還在出版）、VerneMQ（2026-09 出 2.2.1）、FlashMQ（2026-09）、Aedes（2026-09）、rmqtt（2026-09）活躍。**mochi-mqtt 最後一個 commit 與最後一版都是 2025-03-01**，已閒置約 19 個月。**rumqttd 的最後一版是 2025-09-29，2023-12 到 2025-09 之間沒有任何版本**，repo 的近期 commit 多在 rumqttc。
3. 「往上游 outbound bridge 並保留 retained/QoS」做得最完整、文件最清楚的是 **Mosquitto**：`try_private`（讓 retained 正確傳播）、`bridge_outgoing_retain`、每個 topic 可設 in/out/both 與 QoS、cert 對上游 mTLS、jitter backoff，2.1.0 還加了 MQTT v5 bridge 選項。**HiveMQ CE 沒有 bridge**（bridge 是 Enterprise Extension，CE 不支援 Enterprise Extension）。**Aedes 沒有 outbound bridge**。rumqttd 的 bridge 只出現在註解掉的範例設定裡。
4. 最符合 M-05 + M-06 的 per-bridge broker，依序是 **Mosquitto**、**NanoMQ**、**VerneMQ（有條件）**。理由與保留見 §3。
5. 可嵌進我們自己 node process 的選項取決於 node 的語言（P0 §6 第 2 點：Python 或 Rust）。Rust：**rmqtt library mode**（活躍，但近期 commit 只有一位作者）、**rumqttd**（Apache-2.0、釋出慢）。Python：**amqtt**（MIT，只有 MQTT 3.1.1）。Go 的 mochi 與 Node 的 Aedes 會多引入一種 runtime（M-02），且各有維護或安全紀錄上的疑慮。
6. 本文**查不到可信的 arm64 記憶體數字**（除了 NanoMQ 官方宣稱與我自己量到的 mochi 靜態二進位大小）。足跡要在 CM4 上實測，這是 PoC 項目，不要拿本文當依據。

## 2. 事實表

「來源」欄若註明「搜尋摘要」，表示我只經 WebSearch 取得該頁摘要，WebFetch 無法連到該網域，需要在下次有網路的機會直接打開原頁核對。

### 2.1 Eclipse Mosquitto

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| 1 | 授權：「EPL-2.0 OR EDL-1.0」雙授權；檔內 SPDX 行寫 `EPL-2.0 OR BSD-3-Clause`。 | https://raw.githubusercontent.com/eclipse-mosquitto/mosquitto/master/LICENSE.txt | 2026-10-10 |
| 2 | 版本節奏（ChangeLog 日期）：2.0.19 = 2024-10-02、2.0.20 = 2024-10-16、2.0.21 = 2025-03-06、2.0.22 = 2025-07-11、2.0.23 = 2026-01-14、2.1.0 = 2026-01-29、2.1.1 = 2026-02-04、2.1.2 = 2026-02-09。tags 頁最新 tag 為 v2.1.2。ChangeLog 最上面的 2.1.3 日期寫「2026-02-xx」（未發布）。master 最新 commit 為 2026-10-04（前 8 筆全是 `ralight`，多為 fuzzer 建置修正）。換言之：自 2026-02-09 起約 8 個月沒有新 tag。 | https://raw.githubusercontent.com/eclipse-mosquitto/mosquitto/master/ChangeLog.txt ； https://github.com/eclipse-mosquitto/mosquitto/tags ； https://github.com/eclipse-mosquitto/mosquitto/commits/master | 2026-10-10 |
| 3 | 治理：repo 在 `eclipse-mosquitto` org，SECURITY.md 導向 Eclipse security 流程（Eclipse Foundation 專案）。專案領導人與 committer 名單、贊助方：**未查證**（projects.eclipse.org 無法連線）。 | https://raw.githubusercontent.com/eclipse-mosquitto/mosquitto/master/SECURITY.md | 2026-10-10 |
| 4 | Bridge（outbound）：`bridge_protocol_version` 可選 mqttv50 / mqttv311 / mqttv31（預設 mqttv311）；`topic` 可設 in/out/both，QoS 預設 0，可加 local/remote prefix；`cleansession` 預設 false（遠端 subscription 在斷線後保留）；`local_cleansession` 預設跟隨 `cleansession`；`bridge_certfile` / `bridge_keyfile` 提供對上游的 client cert；`bridge_tls_version` 預設 tlsv1.2；`restart_timeout` 預設 jitter、base 5 s、cap 30 s；`notifications` 預設 true，用 LWT 發布 bridge 連線狀態；`bridge_outgoing_retain` 預設 true。 | https://raw.githubusercontent.com/eclipse-mosquitto/mosquitto/master/man/mosquitto.conf.5.xml | 2026-10-10 |
| 5 | Bridge 與 retained：`try_private`（預設 true）成功時，「retained messages will be propagate correctly」並改善 loop 偵測；遠端 broker 不認時要設 false。文件警告 `cleansession true` 可能讓每次重連都重送大量 retained。`queue_qos0_messages`：bridge topic 設 QoS 1/2 時，進來的 QoS 0 也會排隊。 | 同上 | 2026-10-10 |
| 6 | 2.1.0（2026-01-29）bridge 相關新增：`bridge_receive_maximum`、`bridge_session_expiry_interval`（MQTT v5 bridge）、reconnect backoff 改善、允許遠端在 v5 bridge 上建立 topic alias。 | ChangeLog.txt（同第 2 列） | 2026-10-10 |
| 7 | 認證與 ACL：`use_identity_as_username`（需 `require_certificate true`）把 client cert 的 CN 當 username 做存取控制，不再用密碼；`use_subject_as_username` 用完整 subject。Dynamic Security plugin：以 `$CONTROL/<feature>/v1` topic 上的 JSON 指令在 runtime 改 client / group / role / ACL，`mosquitto_ctrl dynsec` 有 CLI；停用 client 會斷線；預設 `publishClientSend` 與 `subscribe` deny。2.1.0 起 dynsec 的 ACL 支援 `%c`（client id）與 `%u`（username）替換（`subscribeLiteral` / `unsubscribeLiteral` 除外）。 | man page（同第 4 列）；https://raw.githubusercontent.com/eclipse-mosquitto/mosquitto/master/plugins/dynamic-security/README.md ；ChangeLog.txt | 2026-10-10 |
| 8 | 舊式設定將退場：2.1.0 起 `acl_file`、`password_file`、`per_listener_settings` 皆列為 deprecated，預計 3.0 移除；acl-file 與 password-file 改成 plugin（「same code but moved into a plugin」）。 | ChangeLog.txt | 2026-10-10 |
| 9 | 持久化：內建 `persistence`（預設 false）寫 `mosquitto.db`；`autosave_interval` 預設 1800 秒，設 0 則只在結束或收到 SIGUSR1 時存；文件建議改用 plugin 式持久化。2.1.0 新增 `persist-sqlite` plugin；2.1.2 禁止「內建 persistence」與「persistence plugin」同時開。 | man page ；ChangeLog.txt | 2026-10-10 |
| 10 | 近兩年安全處理：ChangeLog 帶「Security」標題的版本為 2.0.19（2024-10-02：subscribe/unsubscribe 錯配、bridge 收到惡意封包 crash）與 2.0.21（2025-03-06：已驗證 client 的惡意 SUBSCRIBE 造成 leak、CVE-2023-28366 的後續修補）。2.0.22、2.0.23、2.1.x 條目沒有 Security 標題；2.0.23 有「惡意或損壞的 persistence 檔導致 crash」的修正，列在一般修正。GitHub 的 security advisories 頁為空。 | ChangeLog.txt ；https://github.com/eclipse-mosquitto/mosquitto/security/advisories | 2026-10-10 |
| 11 | arm64 足跡：**未查證**。沒有找到可靠的現行 Mosquitto 2.x 在 arm64 的 RSS 或二進位大小數字。 | — | 2026-10-10 |

### 2.2 NanoMQ（EMQ）

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| 12 | 授權：MIT（GitHub 頁面標示，連到 LICENSE.txt）。組織：repo 在 `nanomq` org，README 署名「EMQ Edge Computing team」，標示「LF Edge NanoMQ」。MQTT 5 中明列不支援 Auth（enhanced auth）與 Server Redirection。 | https://github.com/nanomq/nanomq | 2026-10-10 |
| 13 | 版本節奏：0.24.14 = 2026-06-03、0.25.1（pre-release）= 2026-06-16、0.25.2 = 2026-06-26、0.25.2-2 = 2026-06-30、0.25.3 = 2026-07-13、0.25.6 = 2026-08-19。約每 2～6 週一個 tag，含頻繁 pre-release。 | https://github.com/nanomq/nanomq/tags ； https://github.com/nanomq/nanomq/releases | 2026-10-10 |
| 14 | 安全處理：release notes 寫 0.24.14「patched several critical memory safety vulnerabilities」、0.25.6「Fix 2 potential security issues」、0.24.13 導入 OSS-Fuzz / ClusterFuzzLite 並修 mqtt_parser 的 out-of-bounds read、0.24.12 更新 SECURITY.md 加 CVE policy。release notes 內**沒有列 CVE 編號**。 | https://github.com/nanomq/nanomq/releases | 2026-10-10 |
| 15 | Bridge：設定在 `bridges.mqtt.<name>`，有 `forwards`（往遠端轉發的 topic，支援 wildcard）與 `subscription`（向遠端訂閱）；啟用 SQLite 時，連線恢復後會重送快取的訊息；兩端 topic tree 與路由表不複製。**retain 與 QoS 在 bridge 上的保留行為：未查證**（搜尋摘要沒涵蓋）。 | https://nanomq.io/docs/en/latest/bridges/tcp-bridge.html （搜尋摘要） | 2026-10-10 |
| 16 | 認證與 ACL：0.19.0 範例設定中有 `auth` 區塊，`password` 與 `acl` 為指向 `nanomq_pwd.conf` / `nanomq_acl.conf` 的 include（範例中被註解）；TLS listener 有 `verify_peer`、`fail_if_no_peer_cert`。**client cert → identity 的對應、per-client topic 限制語法、動態 ACL：未查證**。範例設定的 HTTP 管理介面預設 `admin/public`，匿名 MQTT 為開（範例值，部署時須改）。 | https://raw.githubusercontent.com/nanomq/nanomq/master/etc/nanomq.conf | 2026-10-10 |
| 17 | 足跡（廠商宣稱，非 arm64 實測）：官方文件稱最小功能集開機 footprint 小於 200 KB；官方測試報告的高吞吐設定開機約 1400 KB；EMQX 自家（x86 AWS）benchmark 顯示 1K～10K 連線時約 271～320 MB。README 稱支援 x86_64 與 ARM。 | https://nanomq.io/docs/latest/test-report.html ； https://www.emqx.com/en/blog/open-mqtt-benchmarking-comparison-emqx-vs-nanomq （皆搜尋摘要） | 2026-10-10 |

### 2.3 EMQX

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| 18 | 授權：自 5.9.0 起為 Business Source License 1.1（非 OSI 開源）。Additional Use Grant：單節點生產用途免費；**不得**作為託管服務提供給第三方，也**不得**嵌入賣給第三方的產品（此為 WebFetch 摘要，逐字請看 LICENSE）；學校與非營利有例外。Change Date 為發布後四年，Change License 為 Apache-2.0。5.9 之前的版本維持 Apache-2.0（EMQX 自家 FAQ 的搜尋摘要）。 | https://github.com/emqx/emqx/blob/master/LICENSE ； https://www.emqx.com/en/content/license-faq （搜尋摘要） | 2026-10-10 |
| 19 | 現況：GitHub releases 頁最近 8 個版本的資產全是 `emqx-enterprise-*` 套件；tags 到 6.3.2-rc.2（2026-10-08）。6.2.2 與 6.1.3 的 release notes 寫「Cluster linking now requires a non-community license」。 | https://github.com/emqx/emqx/releases ； https://github.com/emqx/emqx/tags | 2026-10-10 |

### 2.4 HiveMQ Community Edition

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| 20 | 授權：Apache-2.0。公司：HiveMQ（README 稱 CE 是 HiveMQ 企業平台的基礎）。版本：2024.8（2024-10-30）、2024.9（2024-11-26）、2025.1（2025-01-29）、2025.2（2025-03-27）、2025.3（2025-04-30）、2025.4（2025-07-01）、2025.5（2025-11-19）、2026.5（2026-05-27）。最新一版距今約 4.5 個月；release notes 沒有 CVE。 | https://raw.githubusercontent.com/hivemq/hivemq-community-edition/master/LICENSE ； https://github.com/hivemq/hivemq-community-edition/tags ； https://github.com/hivemq/hivemq-community-edition/releases | 2026-10-10 |
| 21 | 功能：MQTT 3.1 / 3.1.1 / 5.0；Java 至少 11 才能執行；Extension SDK 涵蓋 authentication、authorization、client initializer、packet interceptor；有 `EmbeddedHiveMQBuilder` 可在 JVM 程式內嵌入。記憶體需求 README 未寫。 | https://raw.githubusercontent.com/hivemq/hivemq-community-edition/master/README.adoc | 2026-10-10 |
| 22 | Bridge：HiveMQ 的 bridge 是 Enterprise Bridge Extension，需要 Professional 或 Enterprise Edition 並有授權；官方文件稱 Community Edition 不支援 Enterprise Extensions。故 **CE 沒有現成的 outbound bridge**（「CE 不支援 Enterprise Extensions」是文件原話的搜尋摘要；「所以沒 bridge」是我據此的推論）。 | https://docs.hivemq.com/hivemq/4.9/enterprise-extensions/index.html ； https://docs.hivemq.com/bridge （搜尋摘要） | 2026-10-10 |

### 2.5 VerneMQ

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| 23 | 授權：Apache-2.0（repo 頁與 README）。組織：README 沒寫背後公司，只說商業支援、binary 套件與客製版本經 vernemq.com 提供；背後實體：**未查證**。版本：2.1.0 = 2025-04-21、2.1.1 = 2025-07-14、2.1.2 = 2025-11-13、2.1.3-rc1 = 2026-04-21、2.2.0 = 2026-08-09、2.2.1 = 2026-09-17。2.2.0 / 2.2.1 notes 提到拒絕畸形或過大的 cluster frame，沒有 CVE 編號。 | https://github.com/vernemq/vernemq ； https://github.com/vernemq/vernemq/tags ； https://github.com/vernemq/vernemq/releases | 2026-10-10 |
| 24 | 功能：MQTT 3.1 / 3.1.1 / 5.0；離線訊息存在 LevelDB；有 bridge plugin；auth 後端含 MongoDB / Redis / MySQL / PostgreSQL / CockroachDB 與 plugin 架構；以 Erlang 寫成（runtime 為 Erlang VM）。 | https://raw.githubusercontent.com/vernemq/vernemq/master/README.md | 2026-10-10 |
| 25 | Bridge 細節（2.1.0 文件）：`vmq_bridge` 預設關閉（`plugins.vmq_bridge = on`）；bridge 以 **MQTT 3.1.1** 轉發，v5 訊息仍會轉但 user property 等 metadata 會丟掉；topic 方向預設 out、QoS 預設 0；`vmq-admin bridge show` 可看 buffer 大小與丟棄數。retained 在 bridge 上的行為：**未查證**。 | https://docs.vernemq.com/2.1.0/configuring-vernemq/bridge （搜尋摘要） | 2026-10-10 |
| 26 | mTLS：每個 SSL listener 可設 `require_certificate = on` 與 `use_identity_as_username = on`（以 cert CN 當 username），兩者預設 off；文件仍要求另設 authentication / authorization（`allow_anonymous off` + `vmq_acl` / `vmq_passwd` 或 plugin）。 | https://docs.vernemq.com/configuring-vernemq/listeners （搜尋摘要） | 2026-10-10 |

### 2.6 FlashMQ

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| 27 | 授權：**OSL-3.0**（Open Software License 3.0）。LICENSE 第 5 節把「供網路使用的應用」視為散布；衍生作品須維持同授權（1(c)）；要保留版權與商標聲明。擁有者是個人帳號 `halfgaar`，商業服務（客製 plugin、託管）在 flashmq.com。 | https://github.com/halfgaar/FlashMQ/blob/master/LICENSE ； https://github.com/halfgaar/FlashMQ | 2026-10-10 |
| 28 | 版本節奏（tags）：v1.26.0 = 2026-02-28、v1.26.1 = 2026-04-20、v1.26.2 = 2026-05-08、v1.27.0 = 2026-08-15、v1.27.1 = 2026-08-18、v1.27.2 = 2026-09-24。（releases 頁對 1.27.1 / 1.27.2 的日期與 tags 頁不一致，分別顯示 08 Sep 與 28 Sep；此處採 tags 頁。） | https://github.com/halfgaar/FlashMQ/tags ； https://github.com/halfgaar/FlashMQ/releases | 2026-10-10 |
| 29 | 功能（來自 FlashMQ 自家 release notes / man page 的搜尋摘要）：自 1.8.0 起支援 X509 client 驗證，MQTT username 取自 cert 的 CN；1.20.0 起 outgoing bridge 支援 X.509 client cert；1.21.0 起 bridge 的本地 persistent session 從磁碟載入；內建 ACL 採 Mosquitto 的 `acl_file` 格式，支援 `%u` / `%c`；1.15.1 起有 retained 模式 `enabled_without_persistence` 與 `save_state_interval`；auth plugin 介面為 C++（`flashmq_plugin.h`）。**MQTT 5 支援、arm64 足跡：未查證**（README 未提）。 | https://www.flashmq.org/?p=850 ； https://www.flashmq.org/?p=862 ； https://www.flashmq.org/man/flashmq.conf.5 ； https://flashmq.org/2024/06/17/flashmq-1-15-1-released （皆搜尋摘要） | 2026-10-10 |

### 2.7 rumqttd 與其他可嵌入者

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| 30 | rumqttd：授權 Apache-2.0（crates.io 0.20.0 與 repo LICENSE）。組織：`bytebeamio`（Bytebeam 公司）。版本：0.13.0 = 2023-03-08 … 0.19.0 = 2023-12-12、**0.20.0 = 2025-09-29**；0.19.0 到 0.20.0 之間 21 個月沒有版本。repo 最新 commit 2026-05-01（為 rumqttc 的功能），2025-09-26 的 `chore: release rumqttd-0.20.0` 是最近一次 rumqttd 釋出。 | https://crates.io/api/v1/crates/rumqttd ； https://github.com/bytebeamio/rumqtt/tags ； https://github.com/bytebeamio/rumqtt/commits/main | 2026-10-10 |
| 31 | rumqttd 功能面：README 稱「lightweight and embeddable as a library」；範例 `rumqttd.toml` 有 v4、v5、ws 三種 listener 區段；listener 的 TLS 區段只有 `capath` / `certpath` / `keypath`（沒有 client-auth 鍵）；`[bridge]` 只出現在**被註解掉**的範例中（欄位只有 name、addr、qos、sub_path、reconnection_delay 等，一個 sub_path）；沒有 persistence 或 cluster 區段；auth 為註解掉的 `auth` 表。persistence 與 retained 行為：**未查證**。 | https://raw.githubusercontent.com/bytebeamio/rumqtt/main/rumqttd/README.md ； https://raw.githubusercontent.com/bytebeamio/rumqtt/main/rumqttd/rumqttd.toml | 2026-10-10 |
| 32 | rmqtt（Rust）：README 稱 MIT 或 Apache-2.0 雙授權；MQTT v3.1 / v3.1.1 / v5.0；有 MQTT / Kafka / Pulsar / NATS 的 ingress 與 egress bridge；內建 AUTH/ACL、HTTP 與 JWT AUTH/ACL；持久化含 session store、message store、retainer；有「Library Mode」（把 `rmqtt` crate 加進 Cargo.toml）；需要 Rust 1.94.0 以上。版本：0.20.0 = 2026-05-02、0.21.0 = 2026-05-30、0.22.0 = 2026-07-10、0.23.0 = 2026-08-09、0.24.0 = 2026-09-19。master 第一頁 commit 全由同一位作者（`bittcrafter`）。組織背景、TLS client cert 對應：**未查證**。 | https://raw.githubusercontent.com/rmqtt/rmqtt/master/README.md ； https://github.com/rmqtt/rmqtt/tags ； https://github.com/rmqtt/rmqtt/commits/master | 2026-10-10 |
| 33 | amqtt（Python）：MIT；PyPI 最新 0.12.1 = 2026-09-16；0.12.0 = 2026-08-12；0.11.4 = 2026-07-29；其前一版 0.11.3 = 2025-08-12（約 11 個月空窗）。需要 Python ≥ 3.10。README：「Full set of MQTT 3.1.1 protocol specifications」，沒有提 MQTT 5 與 bridge；plugin 含 x509 cert、檔案式密碼、設定檔式 topic 授權、SQL / HTTP / LDAP / JWT；有 session persistence plugin。從 HBMQTT fork（原作者棄置）；repo 在個人帳號 `Yakifo` 下，PyPI owner 兩人；最近 6 筆 commit 主要來自 `ajmirsky`。 | https://pypi.org/pypi/amqtt/json ； https://github.com/Yakifo/amqtt | 2026-10-10 |
| 34 | mochi-mqtt（Go）：MIT；最新版 `v2.7.9` 發布於 2025-03-01（proxy.golang.org 的 `@latest` 直接查得），最新 commit 同日（2025-03-01）。README：可獨立執行或「embedded as a library」，MQTT v5（相容 3.1.1 / 3.0）且通過 Paho interoperability，hooks 做 auth / 持久化（Redis、Badger、Pebble、Bolt），內建規則式 Auth Ledger（ACL）。README 與 pkg.go.dev 沒有提 bridge。 | https://proxy.golang.org/github.com/mochi-mqtt/server/v2/@latest ； https://github.com/mochi-mqtt/server/commits/main ； https://raw.githubusercontent.com/mochi-mqtt/server/main/README.md | 2026-10-10 |
| 35 | mochi 靜態二進位大小（**我在本機實測**，非第三方宣稱）：最小程式（`AllowHook` + 一個 TCP listener + `InlineClient`）用 go1.24.7、`GOOS=linux GOARCH=arm64 CGO_ENABLED=0`、`-ldflags="-s -w"` 交叉編譯，產物為 6,750,392 bytes 的 ARM aarch64 靜態執行檔。執行期記憶體：未量測（本機是 x86_64，沒有 arm64 環境）。 | 本機建置（程式碼在 scratchpad `mochi/main.go`）；模組版本 v2.7.9 | 2026-10-10 |
| 36 | Aedes（Node）：MIT；npm 最新 1.2.0 = 2026-09-16（1.0.2 = 2026-03-27、1.1.0 = 2026-06-24、1.1.1 = 2026-06-30、1.1.2 = 2026-08-31、1.1.3 = 2026-09-15；2.0.0-beta.0 = 2026-07-06）；npm 維護者 `matteo.collina`，近期 commit 與 release 由 `robertsLando` 做。README：只支援 MQTT 3.1 / 3.1.1（MQTT 5.0 標「not support yet」）；持久化模組有 memory / mongodb / redis / sqlite / level / nedb；cluster 需要磁碟型 persistence 搭配 mqemitter-redis 等；「Bridge Protocol support is for incoming connections only」，即**沒有主動往上游連的 bridge**。有 `authenticate`、`authorizePublish` 等 hook。 | https://registry.npmjs.org/aedes ； https://raw.githubusercontent.com/mcollina/aedes/main/README.md ； https://github.com/moscajs/aedes/commits/main | 2026-10-10 |
| 37 | Aedes 近期安全公告（GitHub Security Advisories，皆**未顯示 CVE 編號**）：GHSA-xxqp-5qx8-gj5q（High，2026-06-30，未捕捉例外與資源耗盡）、GHSA-52qw-whmv-87c5（High，2026-09-15，未驗證的單一 SUBSCRIBE / UNSUBSCRIBE / CONNECT 以 `Object.prototype` 屬性名稱使 broker crash）、GHSA-5jvp-3p2v-5qgf（High，2026-09-16，QoS 2 封包狀態無上限）、GHSA-p8r9-qf8w-p73r（Moderate，2026-09-16，QoS 2 去重殘留）。 | https://github.com/moscajs/aedes/security/advisories | 2026-10-10 |

## 3. 與我們情境的關係

對照 `03-brief.md` §1 的錨點。以下「事實」都回指 §2 的列號，「意見」另外標示。

**錨點 2 與 3（台灣工廠、第三方硬體不可信、三種部署形狀）。** M-04 要求每個 device VLAN 至少一個 south instance 且 south 往 north 連出去。對「每個 bridge 一個 broker」這個用法，需要的 broker 能力是：(a) 對 T1 設備終結 TLS 並以 client cert 或帳密辨識身分（F-18、N-02）；(b) 把 topic 限制在 per-client 範圍（M-04 的圍堵）；(c) 往上游 outbound bridge，且在斷線時排隊（F-21、F-41、N-11）。

- 事實：能同時在 (a)(b)(c) 都有文件依據的只有 Mosquitto（列 4、5、7、9）。VerneMQ 有 (a)，(c) 的 bridge 以 3.1.1 轉發（列 25、26）。FlashMQ 三者都有出處但都是搜尋摘要（列 29）。NanoMQ 的 (c) 有、(a)(b) 的細節未查證（列 15、16）。
- 意見：NanoMQ 是「條件很像 Mosquitto 但細節我沒法證實」；是否選它要等 PoC 驗證 mTLS 與 ACL。

**錨點 5（插電的 Linux 盒子，CM4，arm64）與錨點 7（一片螢幕要小）。** N-13、F-15。

- 事實：足跡數字只有 NanoMQ 的廠商宣稱（列 17）與 mochi 靜態二進位大小（列 35）。Mosquitto、FlashMQ、rumqttd 的 arm64 數字未查證（列 11、29、31）。HiveMQ CE 需要 JVM（Java ≥ 11，列 21），VerneMQ 需要 Erlang VM（列 24）。
- 意見：JVM 與 Erlang 對「一片螢幕的 CM4」是額外的 runtime 種類（M-02）。不建議放在最小部署。

**錨點 6（M-02 種類數、M-05 授權、M-06 時鐘）。**

- M-05：事實見列 1、12、18、20、23、27、30、32～34、36。EMQX 的 BSL 授權不符；FlashMQ 的 OSL-3.0 對「修改後再散布或提供服務」會綁住下游（列 27）。意見：我們若只是原樣封裝 FlashMQ 並不改碼，義務可能很輕；但 M-05 的精神是「不留給客戶任何義務」，建議請法務確認後再列入候選。Mosquitto 的「EPL-2.0 OR EDL-1.0」讓我們可選 EDL（等同 BSD-3-Clause，只要保留聲明），這是我對雙授權的解讀，不是法律意見。
- M-06：事實見各表的版本節奏。意見：我把「近 6 個月內有 release 或 commit」且「有至少兩個以上作者或有法人撐腰」當作活著；Mosquitto 在 2026-02-09 後沒有新 tag（列 2），但 master 仍有 commit，這不是死亡訊號，但值得下一季再查。
- 組織風險（意見）：NanoMQ 的維護方 EMQ 也是把 EMQX 從 Apache-2.0 改成 BSL 的公司（列 12、18）。NanoMQ 目前是 MIT，但「同一家公司的另一個產品曾改授權」是一個應該放進 10 年風險評估的信號，不是結論。

**錨點 8（D-05 門禁、D-06 機台遙測）。** D-06 的現場低延遲 HMI 層若走 MQTT，bridge 內的 broker 就是 HMI 的訂閱點。

- 事實：Mosquitto 的 dynsec 可用 `%c` / `%u` 做 per-client topic 隔離（列 7）；retained 的 outbound 傳播有 `try_private`（列 5）。
- 意見：這代表 P0 在 `02-tradeoffs.md` §1 所說的「D-06 在 P0 裡沒有答案」可以用「每個 bridge 旁放一個 Mosquitto」補上，代價是多一種要維護的東西（M-02），也要面對 retained 與 session 持久化的行為（見列 9：預設 1800 秒才存一次；使用 `persist-sqlite` plugin 前須自行驗證）。

**與 F-46 / F-47 的關係。** 事實：Mosquitto bridge 預設 QoS 0（列 4）；要保留 QoS 1/2 必須逐個 topic 設定。意見：即使有 bridge，也不能把「bridge 轉發成功」當成「命令已執行」；F-46 的 register / SQ / CQ 收斂模型仍然需要，MQTT 只是傳輸。這與 `02-tradeoffs.md` §1「收斂模型」一致。

### 3.1 問題一：哪 2～3 個最符合 M-05 與 M-06，作為 per-bridge broker

1. **Mosquitto**。授權不綁客戶（列 1）；活著（列 2，commit 到 2026-10-04）；bridge、retained、mTLS CN 對應、動態 ACL、sqlite 持久化都有文件依據（列 4～9）；近兩年安全修正有公開紀錄（列 10）。保留：近 8 個月沒有新 tag；commit 幾乎全來自一位作者（列 2）；`acl_file` / `password_file` 在 3.0 將移除，要用 plugin 形式（列 8）；arm64 足跡未查證（列 11）。
2. **NanoMQ**。MIT（列 12）；2026-06 到 08 間連續出版（列 13）；定位就是邊緣與 ARM（列 12、17）。保留：bridge 的 retain/QoS、mTLS→identity、ACL 語法與動態 ACL 都未查證（列 15、16）；近期 release notes 多次提到記憶體安全修正且沒有 CVE 編號（列 14），對「不可信的 T1 在同一網段」的情境（M-04）是需要在 PoC 做 fuzz 或隔離的風險；維護方 EMQ 的授權史（上節）。
3. **VerneMQ（有條件）**。Apache-2.0、MQTT 5、mTLS CN、bridge 皆有（列 23～26）；近一年有穩定釋出（列 23）。保留：bridge 只用 3.1.1 轉發、v5 user property 會丟（列 25）；Erlang VM 是新的 runtime 種類（M-02，列 24）；背後實體未查證（列 23）；足跡未查證。我把它放第三，是因為 M-02 的代價大，不是因為授權或活躍度。

不推薦的原因：EMQX（BSL，列 18）；HiveMQ CE（沒有 bridge，且 JVM，列 21、22）；FlashMQ（OSL-3.0 需法務，列 27；功能面是強候選，若法務通過，可取代第三名）；Aedes 與 mochi 不是為了「當站點 broker」（見下）。

### 3.2 問題二：哪些可以嵌進我們自己的 node process

P0 §6 第 2 點：node 用 Python 或 Rust，PoC 後決定。

| 若 node 是 | 候選 | 事實 | 意見 |
|---|---|---|---|
| Rust | rmqtt library mode | 列 32：雙授權、MQTT 5、內建 bridge / ACL / 持久化、月更；但近期 commit 單一作者，組織不明，要求 Rust 1.94+ | 功能最完整，M-06 的風險在 bus factor |
| Rust | rumqttd | 列 30、31：Apache-2.0、公司維護，但 rumqttd 釋出稀疏；bridge 只是註解範例；persistence 未查證；TLS listener 無 client-auth 鍵 | 適合「只要一個進程內 MQTT 3.1.1/5 ingress」；不適合當 bridge 或 mTLS 邊界 |
| Python | amqtt | 列 33：MIT、x509 plugin、只有 MQTT 3.1.1、無 bridge、維護者個人帳號 | 可作為 T1 ingress adapter（P2 的「bridge 內建 MQTT ingress」），但不應承擔安全邊界 |
| Go / Node | mochi、Aedes | 列 34～37：mochi 閒置 19 個月；Aedes 活躍但 2026 年已有 4 份公告含 3 個 High，且只有 MQTT 3.1.1、不能主動 bridge | 兩者都會多引入一種 runtime（M-02）；除非 node 用該語言，否則不建議 |

意見：「嵌進 node」與「每個 bridge 一個 broker」不是同一個問題。嵌入式適合的是「node 作為 MQTT ingress，收 T1 設備的 MQTT」（F-22、M-04 的圍堵邊界仍由 node 的 mTLS 負責）。需要 retained、秒級 LWT 離線偵測、第 N 個消費者扇出（`02-tradeoffs.md` §1）時，獨立的 Mosquitto 比較合適，因為它的 bridge 與 ACL 有現成文件。

## 4. 未查證或有疑慮之處

- **方法限制**：WebFetch 的回答是由小模型摘要，數字與日期可能轉寫錯誤；GitHub 的 releases 頁只顯示「日／月」，所以版本日期優先採 tags 頁、registry API（crates.io、npm、PyPI、proxy.golang.org）與 ChangeLog。重要日期建議抽查。
- **無法直接連線的網域**：mosquitto.org、projects.eclipse.org、emqx.com、docs.emqx.com、nanomq.io、docs.vernemq.com、flashmq.org、services.nvd.nist.gov 在本環境解析失敗。標示「搜尋摘要」的列只看到 WebSearch 回傳的摘要，沒有看到原頁。沒有查 NVD，所以「近兩年 CVE 處理節奏」是由 ChangeLog、release notes 與 GitHub advisories 推得，**沒有交叉比對 CVE 資料庫**。
- **GitHub API 被擋**：`gh api` 回 403（本 session 未綁定這些 repo），所以沒有 star 數、貢獻者數、release 資產大小。
- **Mosquitto**：tags 頁可能是快取，「2.1.2 之後無新 tag」需要再看一次；專案領導人、committer 名單、贊助方未查證（一個第三方鏡像稱由 cedalo.com 贊助，我沒有採信）。
- **NanoMQ**：bridge 的 retain / QoS 保留、mTLS 對應、ACL 語法、動態 ACL、SQLite 持久化的實際語意都未查證；README 對 bridge 只提到 QUIC 建置選項；範例設定是 0.19.0，不是最新版。
- **EMQX**：Additional Use Grant 的逐字條文我只看到摘要；是否有 Community 授權的實際限制（6.x 的「community license」機制）未完整查證。
- **HiveMQ CE**：持久化機制、client cert → identity 的 API 未查證（只有第三方鏡像說用 RocksDB，未採信）。
- **VerneMQ**：背後公司、commit 活躍度（commits 頁抓不到內容）、bridge 的 retained 行為未查證。
- **FlashMQ**：MQTT 5 支援、arm64 足跡、授權在實際散布情境的義務（需法務）未查證；功能列幾乎全來自搜尋摘要。
- **rumqttd**：persistence、retained 行為、library 模式下的 auth 擴充點未查證；範例設定可能落後於程式碼。
- **rmqtt**：授權取自 README 說法，沒有核對 LICENSE 檔；組織背景未查證。
- **足跡（arm64 的 RSS、二進位大小）**：除了 NanoMQ 廠商宣稱與 mochi 的本機建置，其餘全部未查證。必須在 CM4 上以相同負載（例如 50 個 client、1 Hz publish、retained 開關）量 RSS 與冷啟動時間，這是 PoC 項目。
- **未涵蓋的對象**：Mosquitto 之外的 Eclipse Paho 系列、NATS 內建 MQTT listener（屬 P3 的範圍，另有事實檔）、Rust 的 ntex-mqtt 等框架型函式庫。
