# 事實查核：desired/reported 與 pull 式裝置管理的先例（及其傳輸）

查證日期：2026-10-10。撰寫：波次 A 研究員（Sonnet）。輸入：`03-brief.md`、`00-requirements.md`、`01-proposal-pcie-tree.md`、`02-tradeoffs.md`。

## 1. 結論先講

1. **desired/reported 模型本身不綁傳輸。** AWS Shadow 同時提供 MQTT 與 HTTPS REST（e01）；Azure device twin 的裝置端只走 MQTT/AMQP，HTTPS 不支援（e07）；Kubernetes、Balena、Mender、Apple MDM、Puppet、Tailscale 全部跑在 HTTP(S) 上（e10–e19）。
2. **雲端 IoT 平台（AWS/Azure）把這個模型放在 MQTT 上，官方文件寫出的理由是「推送」與「離線期間的訊息」，不是「電池」。** Azure 明寫 HTTPS 沒有有效率的 server push，裝置只能輪詢，且超過每 25 分鐘一次就被節流（e08）；AWS 的協定比較表寫 MQTT 能收到離線期間錯過的訊息、能偵測斷線，HTTPS 都不行（e03）。我在能讀到的官方文字裡**沒有找到**「電池」「8-bit MCU」「連線數」當理由的句子；02-tradeoffs §2 的這個說法目前是意見，不是查證過的事實（見 §4）。
3. **HTTP 陣營用三種辦法補「推送」：** (a) 接受輪詢延遲（Balena 預設 15 分鐘為論壇來源、Mender 預設 30 分鐘、Puppet 預設 30 分鐘；e10、e12、e19）；(b) 串流式回應（Kubernetes watch、Tailscale 的 map poll；e17、e18）；(c) 另開一條只當「門鈴」的推送通道（Apple MDM 的 APNs，推送內容只有 `{"mdm":"PushMagic"}`；e14）。
4. **有一條重要的更正：** 03-brief/02 把 Balena supervisor 寫成 long-poll；我讀到的 supervisor 原始碼是**固定間隔輪詢 + ETag/304 + jitter + 指數退避**，不是 long-poll（e10）。真正的 long-poll/串流先例是 Tailscale（e18）與 Kubernetes watch（e17）。
5. **Apple MDM 的命令佇列語意與 F-46/F-47 幾乎同構**：命令在收到帶 CommandUUID 的 Acknowledged/Error 之前不算完成、裝置會快取結果並重試到 2xx、同一狀態可能送兩次（e15）。這支持 P0 的「裝置自留結果 by key」設計，也支持它的 retention window 問題是真的。
6. **對 03-brief §1 第 5 條（插電 Linux 盒子）最像我們的是 Tailscale / Kubernetes kubelet / Mender / Balena / Puppet 這一類**（outbound HTTPS、agent 在 Linux 上、控制面持有 desired state）。其中延遲與離線行為最像 P0 §3 設計的是 Tailscale 與 kubelet；Mender/Balena 代表「輪詢也夠用」的下限。MQTT 陣營（AWS/Azure）服務的是更廣的裝置光譜，其中也包含我們不屬於的受限裝置，但它們不是只為受限裝置而設計（e08）。
7. **「樹」本身也有先例：** Salt Syndic（e20）、Azure 對 gateway 的 AMQP 多工建議（e08）、Teleport/Cloudflare 的 outbound-only connector（e22、e23）。其中 Puppet 的持久連線推送元件 PXP 已被封存（e21），是 M-06 的現成例子。

## 2. 事實表

**驗證方式標記：** `[原文]` = 本次實際抓到原文（GitHub raw 的官方文件/原始碼，或 developer.apple.com 的 `.md` 版文件）。`[搜尋摘要]` = 只拿到 WebSearch 回傳的頁面摘要，原頁因本環境的 egress proxy 擋住（docs.aws.amazon.com、learn.microsoft.com、docs.mender.io、docs.balena.io、kubernetes.io、tailscale.com、developers.cloudflare.com、goteleport.com、docs.saltproject.io、docs.oasis-open.org 皆回 403 或無法解析）而無法全文確認；請當作「尚待用原頁複核」。凡是連結的 URL 都是搜尋結果或實際抓取時回傳的位址。

### 2.1 desired/reported 跑在 MQTT（雲端 IoT 平台）

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| e01 | `[搜尋摘要]` AWS IoT Device Shadow：shadow 文件的 `state` 含 `desired`、`reported`、`delta`；app 寫 desired，裝置寫 reported，delta 由服務算出。傳輸有兩種：保留的 MQTT topic，以及 HTTP 的 Device Shadow REST API。shadow 存在雲端，裝置離線時 app 仍可讀寫。官方建議的 `connected` 屬性靠 MQTT Last Will 更新，但送到 `$` 開頭保留 topic 的 LWT 會被 Shadow 服務忽略（即 shadow 本身不追蹤連線）。單一 shadow 上限 8 KB，更新帶版本檢查，版本不符要先 GET 再重試。 | https://docs.aws.amazon.com/iot/latest/developerguide/iot-device-shadows.html ；https://docs.aws.amazon.com/iot/latest/developerguide/device-shadow-data-flow.html ；https://docs.aws.amazon.com/iot/latest/developerguide/diagnosing-shadows.html | 2026-10-10 |
| e02 | `[搜尋摘要]` AWS Shadow 的 MQTT 流程：client 發到 `.../update`，服務回 `/update/accepted` 或 `/update/rejected`；服務接受變更後發 `/update/delta`，內容只含 desired 與 reported 不同的屬性；裝置收到 delta、執行、再往 update 發 reported。 | https://docs.aws.amazon.com/iot/latest/developerguide//device-shadow-mqtt.html | 2026-10-10 |
| e03 | `[搜尋摘要]` AWS 的裝置端協定比較：MQTT（及 MQTT over WSS）支援 publish 與 subscribe，HTTPS 只支援 publish；比較表中 MQTT 有「收到離線期間錯過的訊息」與「偵測裝置斷線」，HTTPS 兩項都沒有；HTTPS 不接受 clientId；文件建議多數裝置通訊用 Secure MQTT 或 MQTT over WSS。 | https://docs.aws.amazon.com/iot/latest/developerguide/protocols.html | 2026-10-10 |
| e04 | `[搜尋摘要]` AWS IoT Jobs：服務在每個目標裝置的 `$aws/things/<thing>/jobs/notify` 與 `notify-next` MQTT topic 發通知；裝置用 DescribeJobExecution / UpdateJobExecution（MQTT API）取得與回報；執行狀態從 QUEUED 到 IN_PROGRESS 到終態；文件明寫 AWS IoT Jobs 與 MQTT 不保證送達順序。另有 Jobs Data Plane 的 HTTP API（SDK 參考有 StartNextPendingJobExecution、GetPendingJobExecutions、DescribeJobExecution、UpdateJobExecution，並有 `stepTimeoutInMinutes` 逾時），故裝置也可不靠 MQTT 通知而主動拉。離線時 job 的行為：**未查證**。 | https://docs.aws.amazon.com/iot/latest/developerguide/jobs-comm-notifications.html ；https://docs.aws.amazon.com/iot/latest/developerguide/jobs-workflow-jobs-online.html ；https://botocore.readthedocs.io/reference/services/iot-jobs-data/client/start_next_pending_job_execution.html | 2026-10-10 |
| e05 | `[搜尋摘要]` Azure IoT Hub device twin：desired properties 由後端設定，reported properties 由裝置回報；官方文字稱 IoT Hub 保證 desired 與 reported 的最終一致，即使裝置離線，裝置上線後收到 desired 並可回報；僅 standard tier 提供。 | https://learn.microsoft.com/azure/iot-hub/how-to-device-twins ；https://docs.azure.cn/en-us/iot-hub/iot-hub-devguide-device-twins | 2026-10-10 |
| e06 | `[搜尋摘要]` Azure direct methods：後端以 HTTPS 呼叫，但裝置必須在線；`connectTimeoutInSeconds` 預設 0（呼叫當下必須已在線），`responseTimeoutInSeconds` 預設 30、範圍 5–300 秒；裝置不在線通常回 404，連上但沒回應回 504。Azure 的 jobs 可包裝「更新 desired properties、更新 tags、呼叫 direct method」，對象由 twin 查詢決定，可排程。「離線時不排隊」這句只在第三方部落格看到，官方頁未確認。 | https://docs.azure.cn/en-us/iot-hub/iot-hub-devguide-direct-methods ；https://docs.azure.cn/en-us/iot-hub/iot-hub-node-node-schedule-jobs | 2026-10-10 |
| e07 | `[搜尋摘要]` Azure endpoints 頁在裝置端功能清單中標明：取得與更新 device twin properties、接收 direct method requests，皆「HTTPS isn't supported」；這兩項只能用 MQTT 或 AMQP。 | https://learn.microsoft.com/sk-sk/azure/iot-hub/iot-hub-devguide-endpoints | 2026-10-10 |
| e08 | `[搜尋摘要]` Azure 協定選擇指引：MQTT（含 over WebSockets）建議給「不需要在同一條 TLS 連線上多工多個各有憑證的裝置」的所有裝置；AMQP 建議給 field/cloud gateway，因其連線可多工；HTTPS 給「無法支援其他協定」的裝置。cloud-to-device 在 HTTPS 上「沒有有效率的 server push」，裝置要輪詢，建議每 25 分鐘或更久一次，更頻繁會被節流；MQTT/AMQP 支援 server push。MQTT 與 HTTPS 每條 TLS 連線只支援單一裝置身分，故不適合多工多身分的 gateway。官方並註明 IoT Hub 對 MQTT 只有「有限功能支援」，需要完整 MQTT 3.1.1/5 要看 Event Grid 的 MQTT broker。 | https://learn.microsoft.com/azure/iot-hub/iot-hub-devguide-protocols | 2026-10-10 |
| e09 | `[搜尋摘要]` OASIS 對 MQTT 5.0 的公告將其描述為 client/server publish/subscribe 傳輸協定，設計輕量、易實作，其特性適合 M2M/IoT 這類受限環境（小 code footprint、頻寬有限），跑在提供有序、無損、雙向連線的 TCP/IP 或其他協定上。此為公告文字，不是規格正文。 | https://www.oasis-open.org/?p=4753 | 2026-10-10 |

### 2.2 desired/reported 或 pull 跑在 HTTP(S)

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| e10 | `[原文]` Balena supervisor（Node.js，package.json 標示 `Apache-2.0`，查證時 master 的版本欄為 19.3.2）：裝置端固定間隔輪詢 `GET <apiEndpoint>/device/v3/<uuid>/state`，帶 `If-None-Match: <etag>`，收到 304 就沿用快取；下一次輪詢間隔 = `appUpdatePollInterval` + 隨機 jitter（上限 `maxApiJitterDelay` = 60 秒）；失敗時 `min(appUpdatePollInterval, 15000ms × 2^失敗次數)` 的指數退避；使用 keep-alive 的 HTTPS agent。我讀到的程式碼**沒有** long-poll 或串流。設定項 `instantUpdates` 存在，關閉時 supervisor 略過第一次立即抓取。預設輪詢間隔 15 分鐘只在論壇看到（`SUPERVISOR_POLL_INTERVAL":"900000"`，社群貼文，非官方文件）。 | https://raw.githubusercontent.com/balena-os/balena-supervisor/master/src/api-binder/poll.ts ；https://raw.githubusercontent.com/balena-os/balena-supervisor/master/src/lib/constants.ts ；https://raw.githubusercontent.com/balena-os/balena-supervisor/master/package.json ；https://forums.balena.io/t/balena-api-poll-interval-jitter/367256 | 2026-10-10 |
| e11 | `[搜尋摘要]` Balena 的「立即更新」：論壇回覆（supervisor 開發者）稱若 `INSTANT_UPDATE_TRIGGER` 關閉，supervisor 會忽略 `POST /v1/update`，只依輪詢間隔（預設 15 分鐘）檢查；balena 員工另稱該設定主要用於「同網路裝置太多時避免過載」，不會真的加速更新。雲端如何把「該更新了」告訴裝置的機制：**未查證**。 | https://forums.balena.io/t/update-strategy-for-factory-devices-with-resin-supervisor-instant-update-trigger/304275 | 2026-10-10 |
| e12 | `[搜尋摘要]` Mender 裝置端輪詢：裝置打 `/api/devices/v1/deployments/device/deployments/next`（需帶 `artifact_name`、`device_type`；裝置日誌中也見過 `/api/devices/v2/...`），無待辦回空、有則回 DeploymentInstructions。`UpdatePollIntervalSeconds` 預設 1800 秒（30 分鐘），inventory 預設 8 小時；連線失敗後改用退避，上限由 `RetryPollIntervalSeconds` 決定（其預設值未查到）。論壇回覆稱除非用於測試的短輪詢，deployment 會維持 queued 直到裝置下次檢查（社群來源）。 | https://docs.mender.io/client-installation/configuration/polling-intervals ；https://docs.mender.io/server-side-api ；https://hub.mender.io/t/deployment-stays-queued/6606 | 2026-10-10 |
| e13 | `[原文]` Mender client 原始碼庫（`mendersoftware/mender`，master）：LICENSE 為 Apache License v2（檔頭「Copyright 2026 Northern.tech AS」），README 自述為「open-source OTA update manager for IoT and embedded Linux」，並可整合 Azure IoT Hub 與 AWS IoT Core；狀態機有 `ScheduleNextPollState`（以計時器排下一次輪詢）與對 `Retry-After` 標頭的處理。 | https://raw.githubusercontent.com/mendersoftware/mender/master/LICENSE ；https://raw.githubusercontent.com/mendersoftware/mender/master/README.md ；https://raw.githubusercontent.com/mendersoftware/mender/master/src/mender-update/daemon/states.cpp | 2026-10-10 |
| e14 | `[原文]` Apple MDM 流程：server 經 APNs 發推送要裝置來輪詢命令，推送內容只能是 `{"mdm":"<PushMagic>"}`（「this is the complete message」），APNs 會合併多則只送最後一則；收到推送後**裝置**對 MDM URL 建立 TLS 連線（以裝置身分憑證當 client cert），用 HTTP PUT 送 plist，內容是 `Idle` 或上一個命令的結果；server 在 HTTP 回應中帶下一個命令（含 `CommandUUID`），裝置執行後再 PUT 結果；Status 值有 `Acknowledged`、`Error`、`CommandFormatError`、`Idle`、`NotNow`。文件註明 visionOS 裝置鎖定或未佩戴時收不到推送。 | https://developer.apple.com/documentation/devicemanagement/sending-mdm-commands-to-a-device.md | 2026-10-10 |
| e15 | `[原文]` Apple MDM 的命令佇列語意：裝置在處理命令中斷線時會快取結果、重連後回報；連線中斷或 server 回非 200 時，裝置快取結果並重試直到收到 2xx；server 端「在收到帶該命令 UUID 的 `Acknowledged` 或 `Error` 之前不要視為裝置已接受並執行，並把最後一個命令留在佇列」；裝置可能重送同一個狀態兩次，須用 `CommandUUID` 判斷屬於哪個命令。 | https://developer.apple.com/documentation/devicemanagement/sending-mdm-commands-to-a-device.md | 2026-10-10 |
| e16 | `[原文]` Kubernetes：官方文件稱 control plane 為「hub-and-spoke」，所有節點（與其 pod）的 API 使用都終止在 API server 的 HTTPS 埠，並稱節點到 control plane 的預設運作模式是「secured by default and can run over untrusted and/or public networks」。反方向（API server 到 kubelet）是 API server 主動連 kubelet 的 HTTPS 端點，或改用 Konnectivity：agent 在節點網路一側**主動**連 Konnectivity server 並維持連線，之後所有 control-plane 到節點的流量走這些連線（beta，v1.18 起）。 | https://raw.githubusercontent.com/kubernetes/website/main/content/en/docs/concepts/architecture/control-plane-node-communication.md | 2026-10-10 |
| e17 | `[原文]` Kubernetes 的 spec/status 與 watch：`spec` 是使用者設定的期望狀態，`status` 是系統提供並更新的當前狀態；client 先 list/get 拿到 `resourceVersion`，再用 `?watch` 取得其後變更的串流，文件稱此機制讓 client「fetch the current state and then subscribe to subsequent changes, without missing any events」，watch 斷線可從最後的 `resourceVersion` 續接或重新 list。kubelet 以 PodSpec 運作，來源主要是 apiserver，另有檔案（預設每 20 秒檢查）與 HTTP 端點（每 20 秒檢查）兩條不經 apiserver 的路。心跳：Lease 預設每 10 秒更新，失敗時指數退避 200 ms 起、上限 7 秒；Node `.status` 有變更或超過預設 5 分鐘才更新；unreachable 判定預設逾時 40 秒。 | https://raw.githubusercontent.com/kubernetes/website/main/content/en/docs/concepts/overview/working-with-objects/_index.md ；https://raw.githubusercontent.com/kubernetes/website/main/content/en/docs/reference/using-api/api-concepts.md ；https://raw.githubusercontent.com/kubernetes/website/main/content/en/docs/reference/command-line-tools-reference/kubelet.md ；https://raw.githubusercontent.com/kubernetes/website/main/content/en/docs/reference/node/node-status.md | 2026-10-10 |
| e18 | `[原文]` Tailscale 控制面（main 分支原始碼）：client 對 control plane `POST /machine/map`（透過 ts2021 的 Noise 通道）；`MapRequest.Stream=true` 時，server 在同一條 HTTP 連線上送多個 `MapResponse`，這個長連線 HTTP 交易稱為「map poll」，第一個 MapResponse 是完整狀態，之後是只含差異的增量；`Stream=false` 則回單一回應就關閉。client 要求 server 送 keep-alive（註解稱約每分鐘一次），超過 `watchdogTimeout` = 120 秒沒收到任何東西就中止並重連。Tailscale repo LICENSE 為 BSD 3-Clause。 | https://raw.githubusercontent.com/tailscale/tailscale/main/tailcfg/tailcfg.go ；https://raw.githubusercontent.com/tailscale/tailscale/main/control/controlclient/direct.go ；https://raw.githubusercontent.com/tailscale/tailscale/main/LICENSE | 2026-10-10 |
| e19 | `[原文]` Puppet agent（源碼 `lib/puppet/defaults.rb`，main）：`runinterval` 預設 `30m`（0 = 持續執行）；`usecacheonfailure` 預設 true（遠端 catalog 無法編譯時使用快取）；預設連 Puppet Server 的埠 8140；`splay` 預設 false。專案授權 Apache 2.0。`[搜尋摘要]` Chef Infra Client 的 `--interval` 預設 1800 秒，`--splay` 加隨機延遲以平衡 server 負載。 | https://raw.githubusercontent.com/puppetlabs/puppet/main/lib/puppet/defaults.rb ；https://raw.githubusercontent.com/puppetlabs/puppet/main/LICENSE ；https://docs.chef.io/client/19/reference/ctl_chef_client/ | 2026-10-10 |
| e20 | `[原文]` SaltStack：官方文件寫 master 與 minion 以 AES 加密的 ZeroMQ 連線溝通，走 TCP 4505（Publisher）與 4506（ReqServer），「No firewall configuration needs to be done on Salt minions」，即連線由 minion 向 master 撥出；publish 用 ZeroMQ pub/sub，預設不用 ZMQ 過濾，所有 publish 送給所有 minion 再由 minion 端依 target 過濾；文件稱 master「always publishing commands to all connected minions」。Syndic：一個 `salt-syndic` 守護程式連到上層 master（Master of Masters），並與同機的 `salt-master` 之間轉送 publications 與 events，用來建立階層式拓撲。專案授權 Apache 2.0。minion 離線時錯過 publish 的行為文件未直接說明，**未查證**。 | https://raw.githubusercontent.com/saltstack/salt/master/doc/topics/tutorials/firewall.rst ；https://raw.githubusercontent.com/saltstack/salt/master/doc/topics/transports/zeromq.rst ；https://raw.githubusercontent.com/saltstack/salt/master/doc/topics/development/architecture.rst ；https://raw.githubusercontent.com/saltstack/salt/master/doc/topics/topology/syndic.rst ；https://raw.githubusercontent.com/saltstack/salt/master/LICENSE | 2026-10-10 |
| e21 | `[原文]` Puppet 的持久連線推送元件：`pxp-agent` 經 `wss://<broker>:8142/pcp/`（secure WebSocket，PCP 協定）連到 PCP broker 執行遠端 action；其 README 開頭寫「This repository is archived and Perforce will no longer be updating this repository」並指向 puppet.com 的 2025 年開源 Puppet 更新公告（該公告本身未抓取）。`pcp-broker` README 寫 PCP v2 不再支援 delayed message delivery 與 multicast。 | https://raw.githubusercontent.com/puppetlabs/pxp-agent/main/README.md ；https://raw.githubusercontent.com/puppetlabs/pcp-broker/main/README.md | 2026-10-10 |
| e22 | `[原文]` Cloudflare Tunnel 的 `cloudflared`：README 稱它是一個把流量從 Cloudflare 網路代理到 origin 的 tunneling daemon，「without requiring you to poke holes on your firewall」；LICENSE 為 Apache License 2.0；原始碼中隱藏旗標 `ha-connections` 預設值為 4（即預設對 edge 維持 4 條連線）。`[搜尋摘要]` 官方文件稱 outbound-only、不需要可公開路由的 IP，可設防火牆只允許這些對外連線；對外埠 7844 與 QUIC 優先、退回 HTTP/2 的說法來自第三方指南，未以官方頁確認。 | https://raw.githubusercontent.com/cloudflare/cloudflared/master/README.md ；https://raw.githubusercontent.com/cloudflare/cloudflared/master/cmd/cloudflared/tunnel/cmd.go ；https://raw.githubusercontent.com/cloudflare/cloudflared/master/LICENSE ；https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/index.md | 2026-10-10 |
| e23 | Teleport。`[原文]` repo README 的授權段：`/api` 為 Apache 2.0，其餘原始碼為 GNU AGPL（自行編譯須遵守），而 goteleport.com/download 上的 Community Edition build 適用「modified Apache 2.0 license」（`build.assets/LICENSE-community`，該檔本次未讀）。`[搜尋摘要]` 官方架構文件：只要 agent 能撥回 cluster 的 Proxy Service 就可以位於防火牆後；Proxy Service 靠 agent 憑證辨識其角色與 UUID，並把使用者連線經該 agent 既有的 reverse tunnel 送回；agent 預設需對每個 Proxy Service 實例維持 tunnel，Proxy Peering 可減少連線數；由 Auth Service 直接加入、Proxy 主動撥 agent 的模式被標為 legacy、僅限自架。 | https://raw.githubusercontent.com/gravitational/teleport/master/README.md ；https://goteleport.com/docs/reference/architecture/agents/ ；https://goteleport.com/docs/ver/19.x/zero-trust-access/management/proxy-peering/ | 2026-10-10 |
| e24 | Home Assistant。`[原文]` MQTT 整合文件（`current` 分支）：整合的 `ha_iot_class` 為 Local Push；要求 broker 支援 MQTT protocol version 5；支援 Birth 與 Last Will and Testament（LWT）訊息，LWT 在乾淨與不乾淨斷線都會發；MQTT discovery 可用 retain 旗標讓 broker 存著、整合啟動時自動處理，但建議的做法是訂閱 Birth 訊息後重送 discovery，並加隨機延遲避免 broker IO 突增；文件稱不支援 ActiveMQ 與 RabbitMQ MQTT plugin，因其 MQTT 訊息保留（retention）有已知問題。遠端存取（Nabu Casa）：`snitun` README 的連線流程是 client 先向 Session Master 認證取得 token，再連 SniTun 並進入 multiplexer 模式，外部 TLS/SNI 連線由 SniTun 經該 multiplexer 送回 client（即 client 撥出）；其授權與維護狀態未查。 | https://raw.githubusercontent.com/home-assistant/home-assistant.io/current/source/_integrations/mqtt.markdown ；https://raw.githubusercontent.com/NabuCasa/snitun/master/README.md | 2026-10-10 |

## 3. 與我們情境的關係

以下是**意見與推論**，引用的事實以 e## 標示。

### 3.1 先例速覽（模型 / 傳輸 / 連線方向 / 離線行為）

| 先例 | 模型 | 傳輸 | 連線方向 | 離線行為（有證據者） | 事實 |
|---|---|---|---|---|---|
| AWS Shadow | desired/reported/delta | MQTT 為主，另有 HTTPS REST | 裝置撥出持久連線 | shadow 存雲端，離線時 app 仍可讀寫 | e01–e03 |
| AWS Jobs | 一次性 job、狀態機 | MQTT 通知 + MQTT/HTTPS API | 裝置撥出 | 未查證 | e04 |
| Azure twin | desired/reported | MQTT / AMQP，裝置端 HTTPS 不支援 | 裝置撥出持久連線 | 最終一致，離線後上線收到 desired | e05、e07 |
| Azure direct method | 同步 RPC | 後端 HTTPS，裝置 MQTT/AMQP | 裝置撥出，由雲端沿該連線送 | 裝置必須在線，預設不等待 | e06 |
| Balena | target state | HTTPS 固定間隔輪詢 + ETag | 裝置撥出 | 本地保留並沿用；退避重試 | e10、e11 |
| Mender | deployment | HTTPS 輪詢 | 裝置撥出 | deployment 排隊到下次檢查 | e12、e13 |
| Apple MDM | 命令佇列 + 門鈴 | APNs 推送 + HTTPS PUT | 推送是 server→APNs→裝置，資料面是裝置撥出 | 裝置快取結果並重試到 2xx；server 保留命令直到 Ack | e14、e15 |
| Kubernetes | spec/status、watch | HTTPS list+watch；Konnectivity 為反向通道 | 節點撥出 | watch 可從 resourceVersion 續接；kubelet 有不經 apiserver 的來源 | e16、e17 |
| Tailscale | netmap，完整 + 增量 | HTTPS 長連線串流 | 裝置撥出 | 120 秒看門狗後重連；離線時用舊 netmap：未查證 | e18 |
| Puppet / Chef | 宣告式 catalog | HTTPS 週期拉取（30 分鐘） | agent 撥出 | 預設用快取 catalog（Puppet） | e19 |
| Salt | 命令 pub/sub | ZeroMQ，TCP 4505/4506 | minion 撥出；Syndic 往上撥 | 未查證 | e20 |
| Puppet PXP | 遠端 action | WebSocket (PCP) | agent 撥出到 broker | 倉庫已封存 | e21 |
| cloudflared / Teleport / snitun | 反向隧道 | QUIC/HTTP2、TLS | 一律由內往外撥 | 未查證 | e22–e24 |

### 3.2 特別要回答：desired/reported 在業界主流跑在 MQTT 還是 HTTP？

**事實面的回答：兩邊都有，而且分界不是「desired/reported」而是「這個系統的裝置要不要由伺服器即時推」。**

- 雲端 IoT 平台（AWS/Azure）：模型在 MQTT 上（e01、e02、e05、e07）。官方文字給出的理由是推送與離線訊息：Azure 說 HTTPS 沒有有效率的 server push、輪詢上限每 25 分鐘（e08）；AWS 說 MQTT 才有「收離線期間錯過的訊息」與斷線偵測（e03）。
- 邊緣/維運軟體（Balena、Mender、Puppet、Chef、kubelet、Tailscale、Apple MDM）：HTTP(S)（e10、e12、e14、e16–e19）。它們沒有 broker，各自用不同方法拿到延遲：容忍 15–30 分鐘輪詢（e10、e12、e19），或用 HTTP 串流（e17、e18），或用一條只傳門鈴的推送通道（e14）。
- 兩邊其實有交會：AWS Shadow 同時提供 HTTPS（e01）、AWS Jobs 有 HTTP 資料面 API（e04）、Mender 官方可整合 AWS IoT 與 Azure IoT Hub（e13）。

**理由面的回答（只有部分被官方文字支持）：**

| 02-tradeoffs §2 的說法 | 查證結果 |
|---|---|
| 「IoT 走 broker 優先，是因為電池供電、8-bit MCU、不能掛連線」 | **官方文字裡找不到。** 我讀到的官方理由是推送與離線訊息（e03、e08）。Azure 還建議 MQTT 給「所有」不需要多工多身分的裝置（e08），不限受限裝置。OASIS 公告確實提到受限環境（e09），但那是 MQTT 協定的定位，不是 AWS/Azure 選它放 twin 的理由。電池與連線數的說法目前是**合理推論，未被證實**。 |
| 「Apple MDM（APNs 只當 doorbell、裝置自己 pull）」 | **成立**（e14），並且比 02 寫的更細：推送內容只有 PushMagic，且命令佇列有 Ack 前不移除的語意（e15）。 |
| 「Kubernetes kubelet pull spec、回報 status」 | **成立**（e16、e17），且 k8s 是「list + watch」串流而非輪詢；也有不經 apiserver 的 PodSpec 來源（檔案/HTTP）。 |
| 「Puppet/Chef/Tailscale 控制面」 | Puppet/Chef 是 30 分鐘週期拉取（e19），不是長連線；Tailscale 是長連線串流（e18）。02 把三者併成一類，實際上延遲特性差很多。 |
| （03-brief 隱含）Balena = long-poll | **不成立**：supervisor 是輪詢 + ETag + jitter（e10）。 |

### 3.3 對 P0 與需求的具體含意

1. **P0 的 `fetch: long-poll`（01 §3）在先例中有對應，且對應的是 Tailscale 與 Kubernetes watch（e17、e18），不是 Balena/Mender。** 這兩個先例都帶 keep-alive、看門狗、重連與「完整 + 增量」。Tailscale 的看門狗 120 秒、keep-alive 約每分鐘（e18）可當 P0 在客戶 proxy 下 idle timeout 問題（02 §1「Pull-only 的代價」）的設計起點；但**客戶 proxy 實際的 idle timeout 沒有查到**，那一項仍是 P0 自己要做 PoC 的事。
2. **F-46/F-47（命令語意）：** Apple MDM（e15）與 Azure（direct method 不排隊、twin 持久，e05、e06）都把「持久的期望狀態」與「一次性命令」分開處理，這與 F-47 的 state intent / job 二分一致；Apple 的「Ack 前不移除、重複狀態以 UUID 判斷、裝置快取結果」是 P0 的 CQ/SQ 與 retention window 的現成參考。
3. **F-27、N-15（心跳 120 秒、離線 5 分鐘）：** 輪詢先例的預設（15–30 分鐘；e10、e12、e19）都比我們的要求慢一個數量級，所以「HTTP pull 足夠」只能被 Tailscale/kubelet 這類先例支持（Lease 10 秒、40 秒判 unreachable；e17），不能被 Balena/Mender 支持。
4. **M-04、F-17、F-18（樹與圍堵）：** 先例中真正有「中間層」的是 Salt Syndic（e20），Azure 對多身分 gateway 的 AMQP 建議（e08），以及 Teleport/Cloudflare 的 outbound connector（e22、e23）。**沒有找到**哪一個先例的中間層是為了圍堵 hostile child 而設計，所以 P0 的 bridge 圍堵在先例上沒有現成對照，這與 02 §2「雲端優先的 IoT 沒有」一致。
5. **F-41（雲端 ERP，站點只有 outbound）：** k8s Konnectivity、Teleport reverse tunnel、cloudflared、snitun、Salt minion 全部是「由內往外撥」（e16、e20、e22–e24）。這個模式在先例中很普遍，支持 P0 的方向，但它是 outbound 本身的證據，不是 HTTPS 比 MQTT 好的證據。
6. **M-06（外部元件時鐘）：** Puppet 的持久連線推送元件 pxp-agent 已封存（e21）是一個具體提醒：如果 P0 或任何替代案選用「持久連線推送」的第三方元件，維護者狀態要在採用前就查。
7. **D-06 與 T1（生態）：** Home Assistant 把 MQTT 當整合層（Local Push、Birth/LWT、retained discovery；e24），並且對 broker 有明確相容性限制（要求 MQTT v5、不支援 ActiveMQ 與 RabbitMQ plugin；e24）。這顯示 MQTT 生態好用，但「broker 相容性」本身是要維護的知識；它是生態面的得，不是 desired/reported 模型的得。
8. **「兩者兼得」的先例存在：** AWS Shadow 同時開 MQTT 與 HTTPS（e01）、Mender 與 AWS/Azure 整合（e13）。這支持 P5 式「語意不變、傳輸可換」在業界不是怪事，但**沒有查到**任何先例為了「傳輸可插拔」而自己維護兩套傳輸 client 的成本資料，那一塊仍是意見。

### 3.4 對 03-brief §1 第 5 條（插電 Linux 盒子）：哪類先例最像我們

**意見：最像的是「Linux agent + outbound HTTPS + 控制面持有 desired state」這一類，依相似度由高到低：**

1. **Kubernetes kubelet 與 Tailscale 控制面（e16–e18）。** 理由：插電的 Linux 節點、需要分鐘級以內的收斂、desired state 由中心持有、連線由節點撥出、斷線時用最後一份、有看門狗與重連。這兩個也是唯一在先例表中同時有「完整 + 增量」與「斷線續接」機制的。
2. **Apple MDM（e14、e15）。** 理由：命令語意（Ack、快取結果、重複狀態）與 F-46/F-47 最接近；但它的門鈴（APNs）是為「睡眠中的行動裝置無法維持連線」而存在，插電盒子可以直接維持連線，所以門鈴這部分我們不需要照搬（意見）。
3. **Mender 與 Balena（e10–e13）。** 理由：同樣是嵌入式 Linux、同樣 outbound HTTPS；但延遲目標差一個數量級，是「輪詢也夠用」的下限案例，不是我們的目標。
4. **Salt（含 Syndic；e20）與 Puppet（e19、e21）。** 理由：Salt 是「持久連線推送 + 階層」的唯一先例；但 Salt 的離線行為沒查到，Puppet 的推送元件已封存。
5. **AWS/Azure（e01–e08）：** 模型最像（desired/reported/delta），傳輸不同。它們的裝置光譜包含受限裝置，但官方文字給的理由是推送與離線訊息而非電池，所以「我們是插電 Linux 所以不需要它們的傳輸」這個推論**只有一半被支持**：插電 Linux 不需要為省電選 MQTT，但如果要「伺服器即時推」，在 HTTP 上就得自己做串流或門鈴（e14、e17、e18）。這正是 P0 選 long-poll 要自己承擔的部分。

## 4. 未查證或有疑慮之處

1. **查證方法的限制（最重要）。** 本環境的 egress proxy 擋住了多數廠商文件站（docs.aws.amazon.com、learn.microsoft.com、docs.azure.cn、docs.mender.io、docs.balena.io、kubernetes.io、tailscale.com、developers.cloudflare.com、goteleport.com、docs.saltproject.io、docs.oasis-open.org、endoflife.date 皆 403 或無法解析），可用的是 GitHub raw 與 developer.apple.com。因此 AWS、Azure、Mender 文件、Chef、Cloudflare 官方頁、Teleport 文件、OASIS 的事實都標 `[搜尋摘要]`，由搜尋工具轉述頁面內容，**我沒有讀到頁面全文**。引號內的字句是搜尋工具轉述的原文，可能有細微差異。建議在能直連的環境用原頁複核 e01–e09、e12、e19（Chef 部分）、e22–e23（文件部分）。我也沒有試圖繞過 proxy 的限制。
2. **版本與日期。** 我刻意不列任何第三方產品的 release 版本與日期，唯一例外是 Balena supervisor 的 package.json 版本欄（19.3.2，master 分支，查證當日；未必是已發布版）與 Mender LICENSE 檔頭的版權年份。維護者活躍度（commits/releases 頁）本次**未查**，因為 github.com 與 api.github.com 回 403。
3. **AWS Jobs 的離線行為**（e04）與 **Salt minion 離線時錯過 publish 的行為**（e20）、**Tailscale 離線時用舊 netmap**（e18）、**cloudflared 與 Teleport 的離線行為**（e22、e23）：未查證。上表中標「未查證」的格子不要當成「沒有」。
4. **Azure direct method「離線不排隊」**：官方部分只確認 `connectTimeoutInSeconds` 預設 0 與 404/504 語意（e06）；「不排隊」一句只有第三方部落格，未確認。
5. **Balena 雲端如何觸發「立即更新」**（e11）、**Balena 預設輪詢 15 分鐘**（e10，僅論壇）、**Mender `RetryPollIntervalSeconds` 預設值**（e12）：未查證。我只讀了 supervisor 與 Mender client 的 master 分支原始碼，沒有讀 balenaCloud 或 Mender server 端。
6. **Kubernetes：** 文件對 watch 的描述是通用的 API 機制；「kubelet 具體用 watch 取得綁到自己節點的 pod」與「apiserver 不可達時 kubelet 持續運行既有 pod」兩點本次**未在文件原文確認**（只確認了 PodSpec 來源與心跳數值，e17）。
7. **Teleport Community Edition 的授權細節**：只看到 README 的轉述，`LICENSE-community` 本文未讀（e23）。**Home Assistant snitun** 的授權與維護狀態未查（e24）。**OpenWrt** 與 **ESPHome** 本次未查（簡報列為可選）。
8. **Puppet 開源版 2025 年更新公告**（e21 所引）未抓取，因此「pxp-agent 封存」對整個 Puppet 開源生態的意義（例如是否有社群 fork）**未查證**；本文只陳述 README 的字面內容。
9. **Salt 目前的維護與 LTS 狀態**：搜尋結果有零星說法（3008 為 LTS、3006 進入僅安全維護等），但來源是搜尋摘要與第三方鏡像，且彼此不一致，故不列入事實表。
10. **「電池 / 連線數」理由**（§1 第 2 點、§3.2）：沒有找到官方文字支持或反駁。它可能仍然正確，只是目前是 02-tradeoffs 的意見，不是已查證的事實。
11. **Home Assistant 要求 MQTT v5**（e24）：這是 `current` 分支文件的字面內容；我沒有比對舊版文件，也沒有驗證實際程式碼行為，引用前建議再確認。
12. **相似度排序（§3.4）與所有「對 P0 的含意」（§3.3）是我的判斷**，不是被先例證明的結論。
