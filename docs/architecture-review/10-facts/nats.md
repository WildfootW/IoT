# 事實查核：NATS 作為樹狀節點基底的可行性

查證日期：2026-10-10（下表「查證日期」欄一律為此日）。查證者：波次 A 研究員（Sonnet）。

## 1. 結論先講

- 在「樹」的形狀上，NATS leaf node 與 P0 幾乎同構：leaf 主動 outbound 連到 hub、leaf 不需要被連入、官方文件明說可組成任意 acyclic graph（N1、N2）。F-21、F-41、M-04「south 連 north、不反過來」結構上成立，這是 NATS 比 P0 的 HTTPS long-poll 更自然的地方。
- 在「T1 說 MQTT」上，NATS 內建 MQTT listener 能用，但天花板很低：只支援 MQTT 3.1.1（QoS 0/1/2、retained、will），維護者在 2026-07-07 明確表示不打算收 MQTT 5 的 PR（N10、N11）。MQTT 的 retained、session 都落在 JetStream，所以每個開 MQTT 的 bridge 都必須開 JetStream 並管磁碟（N10）。
- 授權與治理比 2025 年之前乾淨：nats-server 是 Apache-2.0（N18）；2025 年的商標爭議以商標轉給 Linux Foundation、repo 與網域留在 CNCF 收場（N19，但 CNCF 原文無法存取，屬二手來源）。M-05 不構成問題。
- 最大的警訊是安全面：2026-03-24 與 2026-06-29 兩批 advisory 中，有多則直接落在我們要依賴的功能上（MQTT、leafnode、subscribe deny filter、mTLS DN 對應）（N17）。這同時是壞消息（這些面積有洞）與好消息（有人在審、在修）。對 hostile T1（C-25）的含意是：不能只靠 NATS 的 account/permission 當唯一圍堵層。
- JetStream 在 leaf 上能用，但語意要自己吃透：domain 隔離、跨 domain 要靠 mirror/source、KV 不保證 read-your-writes、預設 fsync 間隔 2 分鐘、預設儲存上限 1TB 且 store_dir 預設在 /tmp（N5、N6、N7、N8）。F-46/F-47 的「命令不丟、不重複執行、結果可重讀」NATS 給的是零件（durable stream、KV、`Nats-Msg-Id` 去重，預設視窗 2 分鐘），不是現成語意。
- 就算選 NATS，我們仍要自寫：節點 agent 的協定語意（register/job/CQ）、身分發放與 adopt/revoke 流程、T1 ingress 的 schema 檢查與限速、ERP 端轉接、時序寫入與 roll-up、部署與升級工具。薄的程度取決於我們肯不肯把 P0 的 SQ/CQ 語意也交給 JetStream（見 §3.4）。
- 本文件不下「用或不用」的結論；那是提案與評審的事。

## 2. 事實表

來源 URL 說明：docs.nats.io、nats.io、www.cncf.io、www.synadia.com、thenewstack.io、theregister.com、endoflife.date 在本次查證環境被擋（DNS 解析失敗或 403），因此官方文件改讀其原始碼 repo `nats-io/nats.docs`（GitHub raw，內容即 docs.nats.io 的來源 markdown），並在欄中標明。

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| N1 | Leaf node 由 leaf 端以 `remotes` 設定主動連到 hub 的 leafnodes port（預設 7422）。文件：leaf nodes「do not need to be reachable themselves and can be used to explicitly configure any acyclic graph topologies」。一個 leaf 可有多個 remote 連到不同 cluster。另有 `hub: true` 選項可反轉角色（讓 hub 發起連線）。 | https://raw.githubusercontent.com/nats-io/nats.docs/master/running-a-nats-service/configuration/leafnodes/README.md ；https://raw.githubusercontent.com/nats-io/nats.docs/master/running-a-nats-service/configuration/leafnodes/leafnode_conf.md | 2026-10-10 |
| N2 | 多層樹：文件只以「任意 acyclic graph」一句話描述，未提供三層（leaf 的 leaf）的範例、效能數據或已知限制。 | 同 N1 | 2026-10-10 |
| N3 | Leaf 認證方式：hub 端可用 user/password（單一或多使用者，各自綁 account）、token、NKey、JWT（`credentials` creds 檔）；也可由 hub 端既有 account 的使用者直接當 leaf 使用者。TLS 可設於 remote；v2.10.0 起支援 TLS-first handshake。Leaf 連入後的 pub/sub 權限等於該使用者權限：可 publish 的 subject 會 export 到 hub、可 subscribe 的會 import 進 leaf；另有 `deny_imports` / `deny_exports`。 | 同 N1（leafnode_conf.md 的 Authorization Block、remotes 表） | 2026-10-10 |
| N4 | Leaf 可用 WebSocket 出站（`ws://` URL，自 v2.2.0）；同一 remote 的 URL 要全為 ws 或全不是。TLS 與否由設定區塊是否有 tls 決定，不是由 `wss://`。這是穿過客戶 proxy / 只開 443 的路徑，但文件未說明對 HTTP proxy（CONNECT）的支援；v2.15.1 / v2.14.8 的 release notes 提到「Remote proxies gained TLS support for https:// URLs」（細節未讀到）。 | https://raw.githubusercontent.com/nats-io/nats.docs/master/running-a-nats-service/configuration/leafnodes/leafnode_conf.md ；https://github.com/nats-io/nats-server/releases | 2026-10-10 |
| N5 | Accounts 是隔離的訊息 namespace（預設互不可見）；跨 account 只能透過 `exports`/`imports`（stream = 單向訊息、service = request/reply）。限制：account 不能 self-import；service import 目前不能用萬用字元（要靠 `to` 重寫）；export 未指定 `accounts` 就是公開。文件註記 import/export 的 "stream" 與 JetStream stream 是同名異物。 | https://raw.githubusercontent.com/nats-io/nats.docs/master/running-a-nats-service/configuration/securing_nats/accounts.md | 2026-10-10 |
| N6 | JetStream on leaf：leaf 可跑獨立 JetStream（"islands"），以 `jetstream { domain: ... }` 區分；API 會多出 `$JS.<domain>.API.>`；同一 cluster 內 domain 必須相同、經 leaf 連線才能不同。跨 domain 資料用 `mirror` / `source` 複製（文件稱為「recommended way to exchange persistent data across domains」），複製後讀取與 leaf 連線狀態無關。已知問題（文件原文）：(a) 多個啟用 JetStream 的 leaf 連到另一個 cluster 時，該 cluster 也要啟用 JetStream 並設 domain；(b) 不設 domain 去延伸中央 JetStream 時，中央必須是 clustered mode；(c) 跨 account 目前不支援 push consumer。同一 account 的同一 subject 若在不同 domain 都有 stream 匹配，leaf 連線期間每個 stream 都會存一份。 | https://raw.githubusercontent.com/nats-io/nats.docs/master/running-a-nats-service/configuration/leafnodes/jetstream_leafnodes.md | 2026-10-10 |
| N7 | KV bucket 實作為名稱以 `KV_` 開頭的 stream；支援 put/get/delete/purge/keys、`create`（compare-to-null）與 `update`（CAS）、watch、history（預設 1）、可設 bucket 大小 / 單值大小 / TTL。一致性：保證 monotonic writes/reads，「不保證 read-your-writes」（direct get 可能由 follower 或 mirror 回應）。Object store：chunked 檔案存放，文件註明「not a distributed storage system. All files in a bucket will need to fit on the target file system」。 | https://raw.githubusercontent.com/nats-io/nats.docs/master/nats-concepts/jetstream/key-value-store/README.md ；https://raw.githubusercontent.com/nats-io/nats.docs/master/nats-concepts/jetstream/object-store/obj_store.md | 2026-10-10 |
| N8 | JetStream 儲存與預設值：`store_dir` 預設 `/tmp/nats/jetstream`；`max_memory_store` 預設為可用記憶體 75%；`max_file_store` 預設 1TB；`sync_interval`（fsync 間隔）預設 2m，文件說預設依賴 cluster 內 replication 保證 OS crash 後資料仍在，未複寫或 replica=2 時建議縮短，`always` 會降到「a few hundred msg/s」。account 層可設 `max_mem` / `max_file` / `max_streams` / `max_consumers`。`max_payload` 預設 1MB。文件的 stream 建立範例中 Duplicate tracking window 預設 2 分鐘。 | https://raw.githubusercontent.com/nats-io/nats.docs/master/running-a-nats-service/configuration/README.md ；https://raw.githubusercontent.com/nats-io/nats.docs/master/running-a-nats-service/configuration/jetstream-config/resource_management.md ；https://raw.githubusercontent.com/nats-io/nats.docs/master/running-a-nats-service/configuration/leafnodes/jetstream_leafnodes.md | 2026-10-10 |
| N9 | 近兩版的 JetStream 行為變更：v2.14 起 filestore I/O error 會凍結該 stream 並在 health check 顯示 unhealthy（過去可能繼續跑）；v2.14 升級指南預告「in version 2.15 the default will change」為 v2 的 ack / flow-control subject（含 domain 與 account hash），若 ACL 或跨 account import/export 寫了 `$JS.ACK.<stream>.>` 這類特定 subject 就必須改；v2.15.0 release notes（本次讀到的部分）未提此項，是否已落地**未查證**。v2.15.0 起 stream 預設最多 1000 個 consumer（`default_max_consumers` 可調）。 | https://raw.githubusercontent.com/nats-io/nats.docs/master/release_notes/whats_new_214.md ；https://github.com/nats-io/nats-server/releases/tag/v2.15.0 | 2026-10-10 |
| N10 | 內建 MQTT：「NATS follows as closely as possible to the MQTT v3.1.1 specification」；支援 QoS 0、1、2；retained（含 QoS 0 的 retained 也會持久化）；will message（非 DISCONNECT 結束時送出）；session 一律持久化（即使 clean session）。使用者的 account 必須啟用 JetStream（session 與 retained 需持久化），內部 stream 為 `$MQTT_sess`、`$MQTT_msgs`、`$MQTT_rmsgs`、`$MQTT_qos2in`、`$MQTT_out`。限制（文件原文）：NATS 發佈給 MQTT 訂閱者的訊息一律以 QoS 0 投遞；cluster 模式下 retained 為 best-effort；同 client id 併發 session 可能把新連線踢掉；topic 含空白會被拒（`.` 自 v2.10.0 起轉為 `//`）；MQTT 使用者需有 `$MQTT.sub.>` 的 subscribe 權限才能建 QoS1 訂閱；權限以轉換後的 NATS subject 檢查。 | https://raw.githubusercontent.com/nats-io/nats.docs/master/running-a-nats-service/configuration/mqtt/README.md ；https://raw.githubusercontent.com/nats-io/nats-server/main/server/README-MQTT.md | 2026-10-10 |
| N11 | MQTT 5 不在路線上：nats-server discussion #8362，maintainer（neilalexander，2026-07-07，標為採納答案）：「I don't think we are likely to accept PRs for MQTT 5 support」「MQTT is not our primary API surface, our primary concern is and will continue to be the NATS protocol」；MQTT 3.1.1 的 conformance / bug PR 仍歡迎。外部貢獻者 nberlee 在 2026-09-04 說正以獨立 bridge/broker 形式做 MQTT 5，目標 11 月中旬 alpha（非 nats-server 本體，也非官方）。 | https://github.com/nats-io/nats-server/discussions/8362 | 2026-10-10 |
| N12 | MQTT 認證對應：本地設定模式下，MQTT client 以 CONNECT 的 username/password（或 token）對應到 NATS 使用者，可用 `allowed_connection_types`（STANDARD / WEBSOCKET / LEAFNODE / MQTT）限定某使用者只能由 MQTT 連入；也可用 `mqtt { tls { verify_and_map: true } }` 以 client certificate 對應使用者。Operator（JWT）模式下，MQTT client 把 user JWT 當作 password（任意非空 username），該 JWT 必須是 bearer 類型（`nsc edit user --bearer`）；`mqtt.no_auth_user` 與 operator 模式不相容。 | https://raw.githubusercontent.com/nats-io/nats.docs/master/running-a-nats-service/configuration/mqtt/mqtt_config.md | 2026-10-10 |
| N13 | TLS / mTLS：`tls { verify: true }` 驗證 client cert 由指定 CA 簽發；`verify_and_map: true` 以 cert 的 SAN（先 email 後 DNS）再 subject 對應到使用者，文件註明「picks the user it finds first. There is no configuration to restrict this」。Leafnode 與 MQTT 各自有獨立 `tls` 區塊。2026-03-24 有一則 moderate advisory「mTLS DN-based identity auth bypass for some DN patterns」（見 N17）。 | https://raw.githubusercontent.com/nats-io/nats.docs/master/running-a-nats-service/configuration/securing_nats/auth_intro/tls_mutual_auth.md ；https://github.com/nats-io/nats-server/security/advisories?page=2 | 2026-10-10 |
| N14 | 去中心化認證（operator 模式）：Operator → Account → User 三層 NKey（Ed25519）信任鏈，以 JWT 描述；server 只需信任 operator 並能取得 account JWT（resolver：官方稱 NATS-based resolver 為首選）；使用者以簽 nonce 證明身分，JWT 只是設定不是 session。可帶 expiry；revocation 以「撤銷時間點之前簽發的 JWT 失效」實作，且「adding a revocation will modify the account and therefore has to be pushed」。文件對大型 IoT 佈署建議離線備份 identity key、改用可更換的 signing keys。動態發放使用者時文件要求「SHORTEST POSSIBLE EXPIRATION」。對照：設定檔認證（user/password、nkey、tls map）把帳號寫在每台 server 的設定裡。 | https://raw.githubusercontent.com/nats-io/nats.docs/master/running-a-nats-service/configuration/securing_nats/jwt/README.md ；https://raw.githubusercontent.com/nats-io/nats.docs/master/running-a-nats-service/configuration/securing_nats/jwt/resolver.md ；https://raw.githubusercontent.com/nats-io/nats.docs/master/running-a-nats-service/nats_admin/jwt.md | 2026-10-10 |
| N15 | arm64 足跡：v2.15.1（2026-10-09 發布）提供 `linux-arm64.tar.gz` 6.28 MB（壓縮後）、arm64 的 deb/rpm 各 6.27 MB，並附 SBOM（spdx.json）；另有 arm7、arm6 版本。README 稱可跑在 Raspberry Pi。**執行期 RSS、空載與有 JetStream / MQTT 時的記憶體、解壓後 binary 大小：未查證**（需在 CM4 實測）。 | https://github.com/nats-io/nats-server/releases/expanded_assets/v2.15.1 ；https://github.com/nats-io/nats-server | 2026-10-10 |
| N16 | 可作為 Go library 嵌入：pkg.go.dev 列出 `server.NewServer(opts)`、`server.New`、`NewServerFromConfig`、`Server.InProcessConn()`、`Server.ReadyForConnections(dur)`；文件載明嵌入者可用 `RemoteLeafOpts.SignatureCB`（v2.9.0 起）以回呼簽 nonce 取代 creds 檔。v2.15.0 以 Go 1.27.1 建置。嵌入意味著我們的 node 必須是 Go 程式，與 P0 的「Python 或 Rust」選項衝突（M-02）。 | https://pkg.go.dev/github.com/nats-io/nats-server/v2/server ；https://raw.githubusercontent.com/nats-io/nats.docs/master/running-a-nats-service/configuration/leafnodes/leafnode_conf.md ；https://github.com/nats-io/nats-server/releases/tag/v2.15.0 | 2026-10-10 |
| N17 | 2026 年安全 advisory（nats-server repo，前兩頁共 20 則，共 4 頁，僅讀前兩頁）。2026-06-29 批次含：MQTT partial CONNECT 耗盡 pre-auth 記憶體（High，CVE-2026-58210，影響 ≤2.14.2 與 ≤2.12.11，修於 2.14.3 / 2.12.12，無 workaround）；MQTT SUBSCRIBE protocol injection 經 leaf/route 轉發可注入任意 NATS 指令、可能跨 account（High，CVSS 7.1，CVE-2026-58213，影響 ≤2.14.0 與 ≤2.12.8，修於 2.14.1 / 2.12.9，「no known complete workaround other than upgrading」）；MQTT retained 與 QoS replay 繞過 subscribe deny filter（Moderate，CVE-2026-58209，修於 2.14.3 / 2.12.12）；MQTT subscribe ACL bypass via `$MQTT.deliver.pubrel`；leafnode double INFO pre-auth crash（High）；`no_auth_user` fast path 繞過連線型別限制；Queue Subscribe / Wildcard-overlap authz bypass；Route API auth bypass（High）。2026-03-24 批次含：pre-auth leafnode panic（High）、JetStream stream restore endpoint auth bypass、mTLS DN 對應繞過、`Nats-Request-Info` header 可偽造、WebSocket pre-auth DoS、credentials 經 argv 暴露於 monitoring（High）。nats-server README 稱 2025-04 有 Trail of Bits 第三方稽核，且其中兩則 MQTT advisory（GHSA-r72h-j7qq-v6qg、GHSA-7qmq-8cc4-hxwg）的回報者署名為 Trail of Bits 人員。 | https://github.com/nats-io/nats-server/security/advisories ；https://github.com/nats-io/nats-server/security/advisories?page=2 ；https://github.com/nats-io/nats-server/security/advisories/GHSA-qrcv-3558-gj4f ；https://github.com/nats-io/nats-server/security/advisories/GHSA-r72h-j7qq-v6qg ；https://github.com/nats-io/nats-server/security/advisories/GHSA-7qmq-8cc4-hxwg ；https://github.com/nats-io/nats-server | 2026-10-10 |
| N18 | nats-server 授權：Apache License 2.0（LICENSE 檔首為 Apache License Version 2.0；README 亦寫 Apache Version 2.0）；專案屬 CNCF。nats.py（PyPI nats-py）與 nats.rs（async-nats）亦為 Apache-2.0。 | https://raw.githubusercontent.com/nats-io/nats-server/main/LICENSE ；https://github.com/nats-io/nats-server ；https://pypi.org/project/nats-py/ ；https://github.com/nats-io/nats.rs | 2026-10-10 |
| N19 | 2025 年商標 / 授權爭議（**二手來源**：CNCF 原文與 The New Stack、The Register 皆無法存取，以下來自搜尋結果摘要）：2025-04 Synadia 曾試圖把 NATS 授權由 Apache 2 改為 BSL 並要求取回商標與 repo；2025-05-01 CNCF 與 Synadia 聯合公告達成協議：Synadia 把兩個 NATS 商標註冊轉讓給 Linux Foundation，NATS.io 網域與 GitHub repos 續由 CNCF 持有，維持 Apache-2.0；Synadia 仍可做商業產品，但若 fork server 做專有產品須改名。nats-server 的 GOVERNANCE 連結到 nats-general：採 organization voting（每組織一票）、維護者由現任維護者提名並投票產生；MAINTAINERS.md 列 5 位（Derek Collison、Ivan Kozlovic、Waldemar Quevedo、Oleg Shaldybin、R.I. Pienaar），未註明所屬組織。 | 搜尋結果引用之 https://www.cncf.io/announcements/2025/05/01/cncf-and-synadia-align-on-securing-the-future-of-the-nats-io-project/ （未能抓取原文）；https://github.com/nats-io/nats-general/blob/main/GOVERNANCE.md ；https://github.com/nats-io/nats-server/blob/main/MAINTAINERS.md | 2026-10-10 |
| N20 | Release 節奏：v2.15.1 與 v2.14.8 於 2026-10-09 同日發布（latest 為 2.15.1）；v2.15.0 於 2026-09-17；v2.14.0 於 30 Apr（頁面無年份，依序推定 2026）；v2.12.0 於 22 Sep（推定 2025）；2.13 被跳過（v2.14 升級指南明寫是從 2.12.x 升級）。意即約每 5～7 個月一個 minor，且最新兩條線同時出 patch。 | https://github.com/nats-io/nats-server/releases ；https://github.com/nats-io/nats-server/releases/tag/v2.14.0 ；https://github.com/nats-io/nats-server/releases/tag/v2.15.0 ；https://raw.githubusercontent.com/nats-io/nats.docs/master/release_notes/whats_new.md | 2026-10-10 |
| N21 | 支援政策（nats-general SECURITY.md）：維護者「normally support the most recent two series of releases, in a pattern modelled after that of Go」，security fix 盡量 backport 到這兩個 series；保留僅修最新 series 的權利（文中稱從未發生）。**沒有查到開源側的 LTS 版本線。**（搜尋結果摘要稱 Synadia 商業支援頁有「至少一年」與 LTS 洽談的說法，但該頁無法存取，列為未查證。） | https://github.com/nats-io/nats-general/blob/main/SECURITY.md ；https://github.com/nats-io/nats-server/security/policy | 2026-10-10 |
| N22 | Python client：nats-py 最新 2.16.0（2026-09-16），Apache-2.0，Python >=3.7 標示、README 稱至少相容 3.8；repo 同時出現新拆分的套件 `nats-core`、`nats-jetstream`（v0.3.0）、`nats-key-value`（v0.1.0），release notes 稱 nats-core / nats-key-value 要求 Python 3.13+，nats-jetstream v0.2.0 有 breaking 變更（`Consumer.messages()` 回傳型別、時間欄位改 `datetime`）。拆分後是否取代 nats-py、object store 是否有對應新套件：**未查證**。 | https://pypi.org/project/nats-py/ ；https://github.com/nats-io/nats.py/releases | 2026-10-10 |
| N23 | Rust client：async-nats 最新 v0.50.0（20 Jul，推定 2026）；v0.48.0（07 May）起以 nats-server 2.14 為目標（含 `AckPolicy::FlowControl`、Consumer Reset API）；仍是 0.x 版號，半年內從 0.46 到 0.50，v0.46 把 nkeys、object-store 等放到預設關閉的 feature flag。舊的 `nats` crate 已棄用，「only receives critical security fixes」。 | https://github.com/nats-io/nats.rs/releases ；https://github.com/nats-io/nats.rs | 2026-10-10 |
| N24 | v2.14 起 leaf `remotes` 區塊可由設定 reload 增刪，不必重啟。v2.15.0 修了 cluster 節點間的 leafnode isolation。v2.15.1 / v2.14.8 讓 leafnode 的 publish 權限對「轉換後的 subject」檢查，並修了 auth callout `auth_users` bypass、deny filter 更新時的空窗、TLS cert pin 於 reload 後檢查錯誤的 pin。 | https://raw.githubusercontent.com/nats-io/nats.docs/master/release_notes/whats_new_214.md ；https://github.com/nats-io/nats-server/releases ；https://github.com/nats-io/nats-server/releases/tag/v2.15.1 ；https://github.com/nats-io/nats-server/releases/tag/v2.15.0 | 2026-10-10 |

## 3. 與我們情境的關係

意見與事實分開：以下各小節的「事實」指向 §2 的 N 編號，「意見」是本研究員的判斷，供提案者與評審攻擊。

### 3.1 形狀契合（D-01～D-06、三種部署形狀）

- 事實：leaf 出站連線、不需被連入（N1）；可走 WebSocket（N4）；每個 leaf 連線綁一個 account 並受使用者權限約束（N3）。
- 與需求：F-21（身分不是位址）、F-41（雲端 ERP 站點只有 outbound）、M-04（south 連 north）、C-12（IP 變動打斷下行）在 NATS 上由「持久連線 + 雙向訊息」解決，而不是 P0 的 long-poll。下行 push 回來是 02-tradeoffs 的「Pull-only 的代價」那一欄的直接補償。
- 形狀 (a) 同機、(b) 同站不同 VLAN、(c) 雲端 ERP：三者都只是「leaf 指向哪個 hub」的差別，這點成立。(c) 時 hub 在雲端，每個客戶一個 account；hub 端要有人營運，這是 P0 沒有的東西。
- 意見：D-06 現場低延遲 HMI 層，在 leaf 本地 broker 上直接訂閱本地 subject 即可，不經樹上游；這是 P0 沒有答案的地方，NATS 給出答案。D-05 的事件型訊息（刷卡、按鈕）天生是訊息而非 register，NATS 也比 P0 合適；但 D-05 控制通道（鎖）仍不在本次範圍，且 NATS 的 subject 權限不能取代 D-05 規格要求的 DESFire / OSDP 層安全。
- 最小部署（錨點 7）：一片螢幕 = ERP + bridge 0（nats-server + 我們的 agent）+ 螢幕上的 agent。若螢幕本身也跑 leaf server，就是每個盒子多一個 server process；若螢幕上的 agent 直接當 NATS client 連到 bridge，則不需要。N15 的 6.28 MB 壓縮檔說明磁碟不是問題，記憶體未查證（N15）。

### 3.2 圍堵與安全（F-18、M-04、N-02～N-04、C-25）

- 事實：account 之間預設隔離，跨 account 靠 export/import（N5）；MQTT 使用者可被限制只能由 MQTT 連入、可用 mTLS 對應使用者（N12、N13）；operator 模式有 Ed25519 信任鏈與撤銷（N14）。
- 事實：2026 年的 advisory 有多則直接命中「MQTT + leaf 轉發 + deny filter + account 邊界」（N17），其中一則 CVSS 7.1 的 MQTT 注入可經 leaf/route 轉發、可能跨 account，且官方稱除升級外無完整 workaround。
- 意見：把 hostile T1 的 MQTT 直接接進「同時也持有往上 leaf 憑證」的 nats-server，等於把 F-18 的圍堵押在 NATS 的 permission 實作上。這不是不可行，但與 P0 的做法（node 是唯一持有網路憑證的 process，backend 只在 localhost）相比，圍堵邊界從「process」退回「server 內的 permission」。可補救的方向（需提案者驗證，不是已查證事實）：T1 ingress 用獨立 nats-server 實例（不同 process、不同 account、無 leaf 憑證），再由我們的驗證程式把通過 schema 的資料轉到上行 account。代價是多一個 process，但不多一種東西。
- 意見：operator 模式的 bearer JWT（MQTT 用）本身是可被重放的長效 token；撤銷是「issuedAt 之前失效」並需把更新的 account JWT 推到每台 server（N14）。這與 P0 的「短效憑證 + 心跳續期、拒絕續期即撤銷」模型不同；要採 NATS 模型，adopt / revoke / 續期流程仍要自己設計，且 leaf 端 server 要收得到 account JWT 更新（resolver 如何跨 leaf 傳播，本次未查證）。N-04（每環境一張 CA）在 NATS 對應為每環境一個 operator key，這個對應成立但未見官方範例。

### 3.3 正確性（F-46、F-47、F-50、B-01～B-14）

- 事實：JetStream 提供 durable stream、KV（CAS、watch）、跨 domain mirror / source（N6、N7）；MQTT QoS1/2 在 server 內以 JetStream 持久（N10）；`Nats-Msg-Id` 去重視窗預設 2 分鐘（N8，來自文件範例輸出）；KV 不保證 read-your-writes（N7）；fsync 預設 2 分鐘，單副本的 leaf 在斷電時最多可能丟失這段寫入（N8）。
- 意見：「desired = KV key、actual = 另一個 KV key、job = stream 訊息 + 裝置端依 key 去重、結果 = 裝置自己的 stream」這個 P0 的 register / SQ / CQ 語意可以映射到 JetStream，且 domain + mirror 讓離線期間 leaf 仍可本地運作（N6，對應 N-11）。但 F-46 的「done 是 actual 等於 desired，且結果可重讀」是我們的 reconciler 邏輯，NATS 不提供。「retention window 明寫」的要求在 NATS 變成 stream `max_age` / `max_bytes` 與去重視窗兩個數字，要寫進設定並監控，不會因為用了 NATS 而消失。
- 意見：CM4 若可能被直接斷電（工廠現場常見，但本次未查證 CM4 部署的斷電頻率與是否掛 RTC），F-46 的「結果不只存在飛行中」要求單副本 leaf 把 `sync_interval` 調成 `always`（吞吐掉到數百 msg/s，以 ≤1 Hz、數百感測器規模足夠；但對 eMMC 寫入壽命的影響未查證）。
- MQTT 面向：QoS 1 只在 MQTT 對 MQTT 時才是 QoS 1；NATS 對 MQTT 一律 QoS 0（N10）。若 T1 設備要靠 QoS1 收「命令」，命令必須由 MQTT 端發佈才有 QoS1 語意，這與「ERP / agent 以 NATS 發命令」的方向相反；結論是 T1 的下行命令仍應當成 P0 的 job（有 key、有結果），不要依賴 MQTT QoS。

### 3.4 十年維護（M-01、M-02、M-05、M-06、N-09、N-10）

- M-05：Apache-2.0（N18），無客戶綁定義務。2025 年的授權 / 商標爭議以商標轉 LF、repo 留 CNCF、Apache-2.0 維持收場（N19，二手來源）。意見：授權風險低；治理風險不是零，因為這次爭議證明過單一商業公司曾想改授權，而 5 位 maintainer 中的組織分布本次沒查到（N19）。
- M-06（外部時鐘）：支援兩條最近 series、約 5～7 個月一個 minor、無開源 LTS（N20、N21）。意見：用 NATS 等於接受一個「約每年至少升一次、最好每半年」的時鐘，而且在 2026 年 advisory 的密度下（N17），這個時鐘會被安全修補推著走，不是可選的。fleet 中每一台 bridge 都是一個要升級的 server；P0 的 node 同樣要升級，但那是我們的 code，修補時程自己控制。
- M-02（種類數）：加入 nats-server（Go binary）與 nsc / NKey 工具鏈。若自己的 node 用 Python 或 Rust，client 的狀態見 N22、N23：兩者都是官方維護、Apache-2.0，但都在重構或仍為 0.x（nats-py 正拆成 nats-core / nats-jetstream / nats-key-value，後者要求 Python 3.13+；async-nats 半年內 0.46→0.50）。嵌入式（N16）要求 node 用 Go，等於引入第三種語言，除非整個 node 改用 Go。意見：不要嵌入；以獨立 binary 跑，並用 config 管理。
- N-09（備份）：每個 leaf 的 JetStream `store_dir` 是新的狀態庫，要備份與還原（官方有 stream backup/restore，v2.15.0 有 v2 版，N9 引的 release notes）；比 P0 的「複製 SQLite 檔」多一個要懂的東西。

### 3.5 生態槓桿（R5）

- 事實：T1 若講 MQTT 3.1.1，可直接連 bridge 的 MQTT port，不需我們寫 adapter（N10）；retained、will、wildcard 都在（N10）。
- 事實：MQTT 5 被維護者明確拒絕（N11）。意見：若 T1 設備是 MQTT 5-only（本次未查證 T1 的 MQTT 版本分布），NATS 的 MQTT 帶不進來，那一格價值為零；需要另一個 MQTT 5 broker 才能補，這就回到「多一種東西」。
- 意見：第 N 個消費者（MES、現場 HMI、Grafana datasource）以 NATS subject 訂閱即可，不需動裝置，這是 02-tradeoffs 說的「Orion subscription 通用扇出」在 NATS 上的現成對應；但「第三方工具天生懂」的範圍是 MQTT / NATS client 生態，不是 NGSI，不是標案可引用的標準。

## 4. 未查證或有疑慮之處

1. docs.nats.io、nats.io、www.cncf.io、www.synadia.com、thenewstack.io、theregister.com、endoflife.date 在本環境無法連線（DNS 失敗或 403）。官方文件內容改以 `nats-io/nats.docs` 原始 markdown 取代，該 repo 的文字可能領先或落後於已發布網站，亦可能與 2.15 的行為不同（例如 N9 的 ack subject 預設變更）。
2. N19 的商標 / 授權爭議細節與結果全部來自搜尋結果的摘要，未能讀到 CNCF 公告原文；「Synadia 曾試圖改 BSL」一句亦屬二手。引用前請改以 CNCF 原文核對。
3. Release 日期：GitHub release 頁只顯示日與月；v2.14.0（30 Apr）、v2.12.0（22 Sep）、async-nats 與 nats.py 各版的年份是依序推定。v2.15.0、v2.15.1、nats-py 2.16.0 的年份有 pkg.go.dev 或 PyPI 頁佐證。
4. 效能與足跡：CM4 上的 RSS、CPU、開 JetStream + MQTT 時的記憶體、leaf 重連 storm 行為、數百個 MQTT client 的上限，全部未查證，需 PoC。
5. 多層樹（leaf 的 leaf，三層以上）的官方範例、已知限制、延遲與 account 傳遞行為：未查證（N2）。
6. 運作於 operator 模式的 leaf：account JWT 更新與 revocation 如何傳到各 leaf server（system account 是否要互連、resolver 型別選擇）本次只讀到概念層文件，細節未查證。
7. HTTP proxy（CONNECT）後面的 leaf 出站行為：只查到 WebSocket 與 release notes 一句話（N4），客戶 proxy 的 idle timeout 與 TLS 攔截下是否可行，未查證。
8. Synadia 商業支援 / LTS 條款（N21 括號）、Synadia 與 maintainer 的雇傭關係：未查證。MAINTAINERS.md 未標示所屬組織。
9. N17 僅讀了 4 頁中的前 2 頁 advisory；2.15.x 是否仍受 2026-06 批次中尚未標示修補版本的項目影響，未逐則核對（已核對的三則明確修在 2.14.1～2.14.3 / 2.12.9～2.12.12，現行 2.15.1 較新）。advisory 密度偏高有兩種讀法：攻擊面大，或稽核與回報機制活躍；本文件不裁決。
10. CM4 的 RTC、斷電頻率、eMMC 壽命對 `sync_interval: always` 的影響：未查證（屬我們自己的硬體事實，不在 NATS 範圍）。
11. 時鐘：NATS JWT 以 `iat` / `exp` 判斷有效性（N14）；文件中未查到對「裝置時鐘錯誤」的容忍度說明，故 JWT 型身分在無 RTC 且 NTP 未同步的盒子上的行為，未查證。

## 5. 結尾：若用 NATS 當 bridge 與 bridge 0 的基底

### 5.1 我們自己還需要寫什麼

以下是意見，依事實推導；每項附對應的需求或事實。

1. 節點 agent（unit 上與 bridge 上）：announce / report / fetch / complete 的語意層，包含版本協商、schema、錯誤詞彙。NATS 只給傳輸與儲存；register（desired / actual）、job 的 key 與去重、結果 CQ、`unknown → timeout`（F-47、F-50）都是我們的 reconciler。（N6、N7、N8）
2. 身分與生命週期：factory bootstrap 憑證、「present, unadopted」狀態（需要一個權限極小的 account 供未 adopt 裝置連入）、adopt 後換發營運憑證、續期或撤銷、每環境一個 operator（N-04）。NATS 給的是 NKey / JWT 機制（N14），流程與工具（含 nsc 自動化、account JWT 推送）要自己寫，且 P0 §6 第 5 點要求的外部對抗審查仍要付。
3. T1 ingress 的守門員：MQTT topic → 內部 subject 的映射、payload schema 檢查、限速、per-device 使用者與權限產生器。NATS 不檢查 payload 內容，也沒有查到每 client 速率限制（未查證）；`max_payload` 預設 1MB、account 層可設 JetStream 資源上限（N8），其餘 account 層連線 / 訂閱數上限的細節未逐項核對。Modbus RTU/TCP 輪詢（D-03）完全不受影響，仍是自己的 function backend。
4. ERP 轉接（bridge 0 ↔ Odoo）：把 Odoo 的業務 desired state 寫成 KV / 訊息，把業務事件（門檻越線、job 完成、上下線）轉成 ERP rows（F-03）。NATS client 放進 Odoo process 還是放在 bridge 0 旁、由 bridge 0 與 Odoo 說簡單協定，是需提案者決定的設計題，本次不下結論。
5. 資料面：JetStream → Postgres 的 writer、roll-up、retention；JetStream 本身的 stream 上限與 retention 設定與監控（N8）。
6. 部署與營運工件：三種形狀的 nats-server 設定產生器、store_dir 與 `max_file_store` 的顯式設定（不能留預設，N8）、備份與還原（N-09）、升級流程與 advisory 追蹤（N-10，N17、N20、N21）、health check 與 JetStream filestore 錯誤處理的監控（N9）。
7. 相容性與測試：語言中立的協定 conformance test，以及對 nats-server 版本的升級回歸測試（N9 的 ack subject 預設變更就是會打到自訂 ACL 的例子）。

### 5.2 最大的三個風險

1. 圍堵邊界退化，而且落在近期有密集漏洞的功能上。hostile T1（C-25、F-18）要靠 NATS 的 permission / account / MQTT 實作當最後防線，而 2026 年的 advisory 中，MQTT 與 leaf 轉發、subscribe deny filter、mTLS 對應都出現過 High / Moderate 問題（N17）。緩解需要額外設計（獨立 ingress 實例），而且升級是被動的、必須快（含 MQTT 的 High 項官方稱無 workaround）。
2. 語意仍在我們身上，但現在還要多懂一套複雜的語意。JetStream 的 domain、mirror / source、KV 一致性（無 read-your-writes）、去重視窗 2 分鐘、fsync 2 分鐘、預設 1TB 與 `/tmp` 儲存、版本間 ack subject 的變動（N6～N9）每一項都是 F-46 / F-47 正確性的潛在破口。採 NATS 並沒有取消「自己寫 reconciler」，只是把風險從「自製傳輸」換到「正確使用別人的複雜系統」；制度性知識（錨點 6）的成本落在這裡。
3. 外部時鐘與天花板：約 5～7 個月一版、只支援最近兩個 series、無開源 LTS（N20、N21），再加上 MQTT 被官方鎖定在 3.1.1 且不收 MQTT 5（N11），以及 Python / Rust client 都在重構或 0.x（N22、N23）。MQTT 這條路是「我們得到的東西」的主體，但它的上限由別人決定；治理雖在 2025-05 穩定下來（N19，二手），這個時鐘一旦錯過兩個 series 就沒有修補。
