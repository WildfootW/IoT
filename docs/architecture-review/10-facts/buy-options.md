# 事實查核：「買不要做」的現成選項（含留下 FIWARE 升版）

查證日期：2026-10-10。撰寫：波次 A 研究員（buy-options）。範圍見任務單；對照 `03-brief.md` §1 錨點與 `00-requirements.md` 的 ID。

## 1. 結論先講

1. **沒有任何一個「買」的選項同時過得了 §1 的錨點。** 功能上最接近的是 ThingsBoard（含 Edge）：有站點 Edge、對上 outbound 連線、MQTT 原生；但它從 4.4（2026-09-29 發布）起改成 BSL 1.1，商業用途免費額度只到 100 devices / 一台 server，且要保留 "Powered by ThingsBoard" 與授權金鑰。這直接撞上 M-05，而且我們的規模（幾百個感測器加幾十片螢幕）大概超過額度（「Device」的定義未查證）。
2. **ThingsBoard 4.3.x 以前仍是 Apache-2.0**（來源為 LICENSE 與 README，見事實表），所以「凍結在舊線」是選項，但這就把 M-06 的時鐘換成「廠商不再修補舊線」，而且我沒查到舊線的支援期限（未查證）。
3. **Eclipse Hono / Ditto 是零件不是產品**：授權乾淨（EPL-2.0），但 Hono 在 2024-05（2.6.0）到 2026-02（2.7.0）之間沒有 release；Ditto 在 2024-02 的 Eclipse 簡報中，active committers 從 2022 年的 8 人降到 2024 年的 2 人（僅經搜尋摘要，原頁無法開啟）。兩者目前仍有 commit（Ditto 3.9.8 發布於 2026-10-08），但核心貢獻者集中。兩者都沒有「站點閘道、僅 outbound」的概念（我沒查到，標未查證）。
4. **Kura + Kapua（EPL-2.0）** 是形狀最像我們的「Linux 閘道 + 雲端管理」，但 Kapua 2.0 還在 BETA-M25，1.6.x 仍在出 patch，且 Kapua 需要 SQL + NoSQL + event bus 三個後端；Kura 是 Java 框架，等於把邊緣換成另一個 runtime（M-02）。
5. **OpenRemote 是 AGPL-3.0**，另賣商業授權給不想公開「緊密互動」附加程式碼的人（來源：廠商授權頁，經搜尋摘要）。M-05 的反面例子：授權義務會跟著客戶走。
6. **Magistrala（Apache-2.0）** 授權乾淨、發布密集（2026-09-04 發布 v1.0.0 LTS），但前身 Mainflux 已歸檔、改名重整，單一廠商（Abstract Machines），且 1.0 才剛出。
7. **AWS / Azure** 對 (c) 形狀有現成答案，但跟「ERP 持有 desired state」是兩套真相來源，且 Google Cloud IoT Core 於 2023-08-16 停服是廠商時鐘的現成案例（M-06）。台灣資料落地：AWS Taipei region（ap-east-2）已 GA，但 IoT Core 是否在該 region 未查證。
8. **FIWARE 升版**能解決的是「Mongo 6.0 EOL」與少數個別限制；從公開 release notes 看，**C-01～C-15 中真正會消失的很少**（見 §3.3）。Orion 4.2.0 起 MongoDB 參考版本改 8.0；IoT Agent 4.14.0 移除舊的 `IOTA_MONGO_*` 環境變數（升版有破壞性設定變更）。**Docker Hub `fiware/orion` 在查證當日沒有 4.6.0 與 4.7.0 的 tag**（最新 4.5.0，2026-05-18），而 GitHub 有 4.7.0（2026-06-24），這是升版時要先確認的事。

## 2. 事實表

> 欄位「來源」若標【搜尋摘要】，代表原頁因本環境 egress policy 無法直接開啟（`thingsboard.io`、`docs.aws.amazon.com`、`eclipse.dev`、`openremote.io`、`cloud.google.com` 的重新導向目標等），內容僅來自 WebSearch 的摘要，可信度低於直接讀原頁。GitHub 的 `releases.atom` 時間戳為 GitHub 回報的 `<updated>`，不一定等於廠商的正式發布日。

### 2.1 ThingsBoard

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| T1 | ThingsBoard 最新 release 為 4.4（tag `v4.4`），GitHub 時間戳 2026-09-29T08:55:38Z；同日另發 4.3.1.6 與 4.2.2.6，表示舊線仍有 patch | https://github.com/thingsboard/thingsboard/releases.atom | 2026-10-10 |
| T2 | 主 repo 的 LICENSE 是 Business Source License 1.1，Licensed Work 為 "ThingsBoard platform, version 4.4.0 or later"，Licensor 為 ThingsBoard, Inc.，Change License 為 Apache-2.0，Change Date 為發布後四年 | https://raw.githubusercontent.com/thingsboard/thingsboard/master/LICENSE | 2026-10-10 |
| T3 | Additional Use Grant（摘要，非逐字）：免費生產使用需符合 (a) 非商業目的且 ≤1,000 Devices，或 (b) 商業目的且 ≤100 Devices 且生產環境不超過一台 server；並需保留 ThingsBoard 名稱、logo 與 "Powered by ThingsBoard"，使用廠商核發的免費授權金鑰，不得繞過金鑰功能。超出範圍需購買商業授權 | 同上 | 2026-10-10 |
| T4 | README 說 4.4 起授權為 BUSL，稱為 source-available；4.4 之前的版本維持 Apache-2.0 | https://github.com/thingsboard/thingsboard | 2026-10-10 |
| T5 | 4.4 把原 Community 與 Professional 合併為單一產品；原 PE 功能（integrations、scheduler、reporting 等）進入同一 repo；Community Grant 讓已註冊的舊 CE 使用者免費沿用，註冊截止 2027-07-20；white labeling 與超出額度屬付費。【搜尋摘要，且部分來自第三方 WZ-IT 部落格；Grant 範圍以廠商 Grant 協議為準，我未能開啟】 | https://thingsboard.io/blog/one-thingsboard-source-available/ 、https://thingsboard.io/community-grant-program/ | 2026-10-10 |
| T6 | ThingsBoard Edge 最新 release 為 4.3.1.6（GitHub 時間戳 2026-10-01）；Edge repo 的 README 與 LICENSE 為 Apache-2.0，README 稱可免費商用。**Edge 是否隨 4.4 改成 BSL：未查證**（Edge 尚無 4.4 release） | https://github.com/thingsboard/thingsboard-edge/releases.atom 、https://github.com/thingsboard/thingsboard-edge | 2026-10-10 |
| T7 | Edge 與 server 之間走 gRPC（預設 port 7070）；Edge 啟動時由 Edge 端開 stream 並送 ConnectRequestMsg，認證用 server 上建立 Edge instance 時產生的 routing key / secret（`CLOUD_ROUTING_KEY` / `CLOUD_ROUTING_SECRET`）。文件沒有明說「僅 outbound、Edge 端無需任何 inbound」【搜尋摘要】 | https://thingsboard.io/docs/edge/reference/architecture/grpc/ 、https://thingsboard.io/docs/edge/reference/configuration/cloud-config/ | 2026-10-10 |

### 2.2 Eclipse 家族（Hono / Ditto / Kura / Kapua）

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| E1 | Hono、Ditto、Kura、Kapua 的 LICENSE 皆為 EPL-2.0（Hono 與 Ditto 另列 GPL-2.0-or-later 為 Secondary License，需 Exhibit A 聲明才生效） | https://raw.githubusercontent.com/eclipse-hono/hono/master/LICENSE 、…/eclipse-ditto/ditto/master/LICENSE 、…/eclipse-kura/kura/develop/LICENSE 、…/eclipse-kapua/kapua/develop/LICENSE | 2026-10-10 |
| E2 | Hono 最近的 release 是 2.7.0（2026-02-17）；其前一個是 2.6.0（2024-05-28）。兩者之間 atom feed 沒有其他 release | https://github.com/eclipse-hono/hono/releases.atom | 2026-10-10 |
| E3 | Hono master 最近的 commits（2026-05 至 2026-10）作者以 `sophokles73` 為主，其餘為 dependabot 與零星貢獻者；最近一筆為 2026-10-06 的 dependabot | https://github.com/eclipse-hono/hono/commits/master.atom | 2026-10-10 |
| E4 | Hono 結構：protocol adapters（HTTP、MQTT、AMQP、CoAP、Sigfox）→ AMQP 1.0 messaging network → 業務應用；Device Registry 有 MongoDB 與 JDBC 兩種實作；命令經 Command Router 送到持有該裝置連線的 adapter 實例【搜尋摘要】 | https://eclipse.dev/hono/docs/architecture/component-view/ 、https://eclipse.dev/hono/docs/admin-guide/device-registry-config/ | 2026-10-10 |
| E5 | Ditto 最新為 3.9.8 與 3.8.14（皆 2026-10-08），之前 3.9.7（2026-09-01）、3.9.6（2026-07-29）；近 15 筆 commit 以 `thjaeckle` 為主，另有數位外部貢獻者 | https://github.com/eclipse-ditto/ditto/releases.atom 、https://github.com/eclipse-ditto/ditto/commits/master.atom | 2026-10-10 |
| E6 | Eclipse IoT WG 2024-02-27 簡報：Bosch 關閉其 SaaS 後減少 Ditto 開發資源，多數貢獻來自 Bosch 以外；active committers 由 2022 年的 8 降為 2024 年的 2【搜尋摘要，我未能開啟原簡報；此為 2024 年資料，2026 現況未查證】 | https://eclipse.dev/ditto/slides/2024_02_27_eclipse-iot-wg-update/index.html | 2026-10-10 |
| E7 | Ditto README：以 MongoDB 為後端資料庫；快速啟動建議 Docker 配 2 核、4 GB RAM；從原始碼建置需 JDK 25 以上 | https://raw.githubusercontent.com/eclipse-ditto/ditto/master/README.md | 2026-10-10 |
| E8 | Kura 最新為 5.6.2（GitHub 時間戳 2026-07-08），前一個 4.1.5（2025-12-17）；README：Java 21、Linux（x86-64 / arm64，含 Raspberry Pi）、有 Docker image、Web UI、REST API、「可擴充的 cloud connector」；Kapua 被建議為擴展到小規模以外的雲端管理 | https://github.com/eclipse-kura/kura/releases.atom 、https://raw.githubusercontent.com/eclipse-kura/kura/develop/README.md | 2026-10-10 |
| E9 | Kapua：1.6.15（2026-08-05）為 1.x 最新，2.0.0-BETA-M25 為 2026-08-31；README：MQTT broker（1883）、device registry、REST API、Web console；依賴 event bus、SQL、NoSQL 三種後端 | https://github.com/eclipse-kapua/kapua/releases.atom 、https://raw.githubusercontent.com/eclipse-kapua/kapua/develop/README.md | 2026-10-10 |

### 2.3 OpenRemote / Magistrala / Balena / Mender

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| O1 | OpenRemote 的 LICENSE.txt 開頭為 GNU AGPL v3，專案自身元件（or-commons、or-controller、or-shared 等）為 AGPL-3.0；檔內有未確認授權的相依（標示 "TODO GPL?"、"TODO Proprietary?"）。最新 release 1.31.1（GitHub 時間戳 2026-09-28）；atom 順序中 1.31.0（2026-10-07）晚於 1.31.1，時間戳不一致，原因未查證 | https://raw.githubusercontent.com/openremote/openremote/master/LICENSE.txt 、https://github.com/openremote/openremote/releases.atom | 2026-10-10 |
| O2 | OpenRemote 授權模式（廠商頁，摘要）：程式碼以 AGPLv3 公開；與 OpenRemote「緊密互動」的軟體須以 AGPLv3 公開，僅並排執行或透過 API / web components 互動不算緊密互動；不想公開者可購買商業授權（我沒查到公開價格與條款）【搜尋摘要】 | https://openremote.io/open-source/ | 2026-10-10 |
| O3 | OpenRemote README 列出：MQTT broker、HTTP/REST、WS、Edge gateway、multi-tenancy（realms）、rules（when-then、flow、JavaScript、Groovy）、Insights 儀表板 | https://raw.githubusercontent.com/openremote/openremote/master/README.md | 2026-10-10 |
| M1 | Magistrala：Apache-2.0；README 稱 MQTT、HTTP、WebSocket、CoAP 為一等公民協定，可部署於 cloud / edge / hybrid；前身 `mainflux/mainflux` 已被唯讀歸檔，README 指向 Magistrala（Abstract Machines 支持） | https://github.com/absmach/magistrala 、https://github.com/mainflux/mainflux | 2026-10-10 |
| M2 | Magistrala 發布節奏：v0.30.0（2026-06-12）、v0.40.0（07-01）、v0.50.0（08-01）、v0.51.0（08-05）、v1.0.0 LTS（2026-09-04） | https://github.com/absmach/magistrala/releases.atom | 2026-10-10 |
| B1 | openBalena：AGPL-3.0；README 稱仍為 beta，缺完整文件與測試套件，FAQ 稱「永遠 beta」可能有破壞性變更；與 balenaCloud 差異：僅單一使用者、僅 CLI 管理、無 delta 更新、無遠端診斷；最新 tag v4.1.969（2026-10-08） | https://github.com/balena-io/open-balena 、https://github.com/balena-io/open-balena/releases.atom | 2026-10-10 |
| D1 | Mender client（`mendersoftware/mender`）LICENSE 為 Apache-2.0；Mender server monorepo（`mender-server`）LICENSE 檔亦為 Apache-2.0，但其 README 說 Enterprise 組合「沒有付費授權與 registry.mender.io 存取權就無法運作」。最新：client 5.2.0-build4（2026-10-08），server v4.1.4（2026-09-30） | https://raw.githubusercontent.com/mendersoftware/mender/master/LICENSE 、https://raw.githubusercontent.com/mendersoftware/mender-server/main/LICENSE 、https://github.com/mendersoftware/mender-server | 2026-10-10 |
| D2 | Mender 方案：Open Source 為 Apache v2；delta updates、RBAC、multi-tenancy 屬 Professional / Enterprise。Mender 是 OTA 更新系統，不處理感測資料或業務 desired state【搜尋摘要】 | https://mender.io/plans/pricing | 2026-10-10 |

### 2.4 雲端（AWS / Azure / Google）

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| C1 | Google Cloud IoT Core 於 2022-08 宣布停服，2023-08-16 起 Device Manager API 不可用、裝置無法再連 MQTT / HTTP bridge；Google 給一年緩衝，建議找合作夥伴。【多家媒體轉述；Google 官方頁因 egress policy 無法開啟】 | https://www.rcrwireless.com/20220816/internet-of-things/google-cloud-to-shut-down-iot-core-service-next-year 、https://itpro.com/network-internet/internet-of-things-iot/368845/google-cloud-to-retire-iot-core-service-in-2023 | 2026-10-10 |
| C2 | AWS IoT Core 計價項目分開計費：連線、訊息、Device Shadow、registry、rules engine；US East 的數字約為連線 $0.08 / 百萬連線分鐘、訊息 $1 起 / 百萬（5 KB 計量）、Shadow 與 Registry $1.25 / 百萬操作。【第三方與舊部落格，非官方頁即時價；區域價不同】 | https://aws.amazon.com/iot/pricing/ | 2026-10-10 |
| C3 | AWS IoT Device Management Jobs：2020 年公告 US East 每次 job execution $0.0030（前 25 萬/月）、超過部分 $0.0015；為 2020 年資料，現價未查證 | https://aws.amazon.com/about-aws/whats-new/2020/05/aws-announces-a-90-percent-plus-price-reduction-for-aws-iot-device-management-jobs/ | 2026-10-10 |
| C4 | AWS IoT Greengrass v2 nucleus 的 LICENSE 為 Apache-2.0；最新 release 2.18.3（GitHub 時間戳 2026-08-07）。Greengrass 以每月「active core device」計費，第三方列價 $0.16 / core / 月（現價未能從 AWS 頁確認），本機連到 core 的 client devices 不另計 | https://github.com/aws-greengrass/aws-greengrass-nucleus/releases.atom 、https://raw.githubusercontent.com/aws-greengrass/aws-greengrass-nucleus/main/LICENSE 、https://aws.amazon.com/greengrass/pricing/ | 2026-10-10 |
| C5 | Azure IoT Edge（`Azure/iotedge`）LICENSE 為 MIT；最新 1.6.4 LTS（2026-09-30），並同時有 1.5.45 LTS（2026-09-09） | https://github.com/Azure/iotedge/releases.atom 、https://raw.githubusercontent.com/Azure/iotedge/main/LICENSE | 2026-10-10 |
| C6 | Azure IoT Hub：device twin、module twin、device management 僅在 Standard tier，Basic 沒有；S1 每 unit 每月約 $25、每日 40 萬則、4 KB 計量（第三方價目，非 Microsoft 即時頁，未查證） | https://azure.microsoft.com/en-us/pricing/details/iot-hub/ | 2026-10-10 |
| C7 | AWS Asia Pacific (Taipei) region，code `ap-east-2`，三個 AZ，已 GA。**IoT Core 是否在該 region：未查證**（搜尋結果的服務清單被截斷）。Azure Taiwan North 營運中、分階段推出；**IoT Hub 是否在該 region：未查證** | https://aws.amazon.com/blogs/aws/now-open-aws-asia-pacific-taipei-region/ 、https://focustaiwan.tw/business/202609010030 | 2026-10-10 |

### 2.5 FIWARE 現況

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| F1 | Orion（telefonicaid/fiware-orion）授權 AGPL-3.0；GitHub 時間戳最新 release 4.7.0（2026-06-24），之前 4.6.0（2026-05-22）、4.5.0（2026-04-14）、4.4.0（2026-01-16）。我們在跑的 4.1.0 的 Docker 映像時間為 2024-09-24 | https://github.com/telefonicaid/fiware-orion/releases.atom 、https://github.com/telefonicaid/fiware-orion | 2026-10-10 |
| F2 | Orion master 最近 commits：2026-10-06（copilot-swe-agent 提 PR 類 commit，內容為拒絕 PATCH 會改 subservice 的 subscription）、2026-09-14、2026-07；作者 fgalan、orianar、fisuda 等（Telefónica 團隊） | https://github.com/telefonicaid/fiware-orion/commits/master.atom | 2026-10-10 |
| F3 | Docker Hub `fiware/orion` 最新 tag 為 4.5.0（`latest` 同為 2026-05-18）；**查無 4.6.0、4.7.0 tag**（API 回 404）；`fiware/iotagent-json` 有 3.14.0（2026-05-18） | https://hub.docker.com/v2/repositories/fiware/orion/tags/4.7.0 、https://hub.docker.com/v2/repositories/fiware/iotagent-json/tags | 2026-10-10 |
| F4 | Orion 4.2.0 起 MongoDB reference version 由 6.0 改為 8.0；4.7.0 文件稱推薦 MongoDB 8.0，「舊版可能可用但完全不建議」【文件為搜尋摘要】。4.7.0 新增：可用 `TextUnrestricted` metadata 對屬性值略過 forbidden-character 檢查。4.2.0 到 4.7.0 的 release notes 中**沒有**通知重送、命令、驗證相關的變更 | https://github.com/telefonicaid/fiware-orion/releases 、https://fiware-orion.readthedocs.io/en/4.7.0/admin/install.html | 2026-10-10 |
| F5 | Orion 的 CHANGES_NEXT_RELEASE（未發布）僅兩項：失敗的通知以 WARN 記錄；PATCH subscription 不可更改 service path（回 404）。`deprecated.md`：NGSIv1 已於 4.0.0 完全移除；NGSIv2 沒有列出移除計畫 | https://raw.githubusercontent.com/telefonicaid/fiware-orion/master/CHANGES_NEXT_RELEASE 、https://raw.githubusercontent.com/telefonicaid/fiware-orion/master/doc/manuals/deprecated.md | 2026-10-10 |
| F6 | IoT Agent JSON 最新 3.14.0（2026-04-07），iotagent-node-lib 最新 4.14.0（2026-04-07）；皆 AGPL-3.0（IoTA JSON 確認，node-lib 授權未單獨查證）。IoTA JSON 最近的 CHANGES_NEXT_RELEASE：body-parser 升級以修 CVE-2026-12590 | https://github.com/telefonicaid/iotagent-json/releases.atom 、https://github.com/telefonicaid/iotagent-node-lib/releases.atom 、https://raw.githubusercontent.com/telefonicaid/iotagent-json/master/CHANGES_NEXT_RELEASE | 2026-10-10 |
| F7 | node-lib 4.8.0 起新增 notification-based commands；4.10.0 新增 `cmdMode`（legacy / notification / advancedNotification），Node 20 為最低；4.11.0 `IOTA_MONGO_*` 環境變數改為單一 URI 並標 deprecated，**4.14.0 移除舊變數**；4.14.0 新增 `/ready` 與 health-check 設定。4.8.0～4.14.0 沒有列出驗證、device key、TLS、撤銷的變更 | https://github.com/telefonicaid/iotagent-node-lib/releases | 2026-10-10 |
| F8 | Orion-LD 最新 1.12.0（2026-01-28），AGPL-3.0，README 稱「接近」NGSI-LD 1.6.1 相容，且「NGSI v2 落後於 Orion」；2026-09-25 仍有 commits（作者 kzangeli）；Docker Hub 有 PRE 版映像至 2026-09-25 | https://github.com/FIWARE/context.Orion-LD/releases.atom 、https://github.com/FIWARE/context.Orion-LD/commits/develop.atom | 2026-10-10 |
| F9 | Mintaka（FIWARE/mintaka）已於 2026-05-13 由擁有者歸檔，唯讀；最後 release 0.7.1-PRE-209（2025-11-24） | https://github.com/FIWARE/mintaka | 2026-10-10 |
| F10 | Smart Data Models（smart-data-models/data-models）：授權偏好 CC-BY 4.0；13 個應用領域；steering board 為 FIWARE Foundation、IUDX、OASC、TM Forum；該 repo 的 releases feed 為空 | https://github.com/smart-data-models/data-models | 2026-10-10 |
| F11 | FIWARE GitHub 組織仍有 119 個 repo，頁面未顯示歸檔或棄用公告，各 repo 在 2026-10 初有更新。**FIWARE Foundation 本身的財務與治理現況：未查證**（官網被 egress policy 擋下，搜尋也沒有 2026 年的相關報導） | https://github.com/FIWARE | 2026-10-10 |

### 2.6 與 Odoo 整合介面（一般性，非各產品）

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| G1 | Odoo 外部 API 目前是 JSON-RPC 2.0（單一 `/jsonrpc` 路徑，皆為 POST）；Odoo 19 引入後繼的 JSON-2 API，舊 endpoints 預定在 Odoo 22 移除【搜尋摘要，Cybus 文件】 | https://docs.cybus.io/guides/system-connectivity/mes-erp-business-systems/odoo-integration | 2026-10-10 |
| G2 | 我沒查到 ThingsBoard、Hono、Ditto、Kapua、Magistrala、OpenRemote 任何一個有官方 Odoo 連接器；實務做法是自寫 bridge 呼叫 Odoo API。**各產品對 Odoo 的整合介面：未查證** | （搜尋無結果） | 2026-10-10 |

## 3. 與我們情境的關係

### 3.1 逐項對照（意見，建立在上面的事實上）

標記：○ 符合、△ 部分或有條件、× 不符合、？ 未查證。

| 選項 | 授權 / M-05 | 時鐘 / M-06 | outbound-only 站點閘道（F-41, M-03(c)） | 圍堵 hostile T1（M-04, F-18） | 與 ERP-as-root 的關係（§1-1, F-33, N-05） | 重量 / M-02, N-13 |
|---|---|---|---|---|---|---|
| ThingsBoard 4.4+ | × BSL；100 devices / 1 server 免費額度，需保留 branding 與金鑰（T2, T3） | △ 單一廠商，活躍（T1），但舊線支援期未查證 | △ Edge 由 Edge 端發起 gRPC（T7）；Edge 的 4.4 授權未查證（T6） | ？ 未查證；認證在裝置層，不是 VLAN 層，這是意見 | × 自帶 device registry 與 attributes，成為第二個真相來源（違反 F-33 精神與 §4.2 的歷史包袱） | ？ |
| ThingsBoard ≤4.3.x | ○ Apache-2.0（T4） | × 凍結在舊線，等於選擇廠商時鐘 | 同上 | 同上 | 同上 | ？ |
| Hono + Ditto | ○ EPL-2.0（E1） | △ Hono release 間隔 21 個月（E2）；Ditto 2024 資源縮減（E6） | × 沒查到站點閘道概念（E4 只有 server 端 adapters） | △ adapter 對每台裝置認證，但無 bridge-per-VLAN 概念，這是意見 | △ Ditto 的 twin 可當 desired/reported 載體，但那是第二個 registry | × Hono 需 AMQP network + registry，Ditto 需 MongoDB（E7） |
| Kura + Kapua | ○ EPL-2.0 | △ Kapua 2.0 仍 BETA-M25（E9） | △ Kura 是 Linux 閘道、Kapua 內建 MQTT broker（E8, E9）；是否純 outbound 未查證 | ？ | △ Kapua 是獨立管理平台 | × Kapua 需 SQL + NoSQL + event bus；Kura 是 Java 框架 |
| OpenRemote | × AGPL-3.0，緊密互動的附加程式碼須公開（O1, O2） | ？ | △ 有 Edge gateway（O3），細節未查證 | ？ | × 獨立平台 | ？ |
| Magistrala | ○ Apache-2.0（M1） | △ 單一廠商，v1.0 才出（M2） | ？ | ？ | × 獨立平台 | ？ |
| openBalena | × AGPL-3.0 且自述 beta（B1） | × | ？ | ？ | × 管 container 更新，不管業務 | × |
| Mender | △ 客戶端 Apache-2.0，Enterprise 需付費（D1, D2） | ○ 活躍（D1） | ？ | ？ | ○ 只管 OTA，不搶真相來源 | ？ |
| AWS IoT Core + Greengrass | △ Greengrass nucleus Apache-2.0（C4），服務本身是租用 | × 廠商時鐘（C1 是先例） | ○ 裝置自己連出（一般認知，未查證官方文件） | △ 雲端 policy 做裝置授權，這是意見 | × twin / shadow 是第二個真相來源 | ○ 雲端免維運，邊緣 Greengrass 重量未查證 |
| Azure IoT Hub + IoT Edge | △ IoT Edge MIT（C5），服務租用 | × 同上；Microsoft 2024 年 IoT Central 事件顯示廠商訊息可能反覆（來源為 2024 年新聞，非現況） | ○ 同上 | △ | × twin 僅 Standard tier（C6） | ○ |

### 3.2 對三種部署形狀與規模的意義

- **形狀 (c)（客戶 ERP 在我們營運的雲端，站點只有 outbound，F-41）**：雲端 IoT 平台的賣點正是這種形狀，但它把「命令佇列由 ERP 擁有」（F-41）反過來，變成雲端平台持有 twin / jobs，ERP 只好當消費者。這是意見，不是事實。
- **成本量級**：以 C2 的 US East 數字粗算，300 個感測器、30 秒一筆、全數上傳，每月約二千六百萬則訊息，費用是數十美元量級（算式見下，數字依賴 C2 的第三方價目）。真正的成本不在帳單而在 M-06（C1）與資料落地（C7 未查證）。
  - 算式：300 sensors × 2 筆/分鐘 × 43,200 分鐘 ≈ 2,592 萬則/月，× $1/百萬 ≈ $26/月，另加連線分鐘 300 × 43,200 ≈ 1,296 萬分鐘 × $0.08/百萬 ≈ $1/月。屬訊息計費下限估算，不含 rules、shadow、jobs。
- **規模（錨點 4）**：商業 IoT 平台的授權與計價大多以「device 數」為軸（T3、C6）；我們的目標規模落在 BSL 免費額度的邊緣（T3 的 100），這使 ThingsBoard 的授權成本不是 0 也不是很貴，而是「一個要談的合約」，也就是新增一個綁客戶的授權（M-05）。

### 3.3 若留 FIWARE 並升版：C-01～C-15 的去留

判斷依據只有公開 release notes（F4、F5、F7）與 `deprecated.md`；**沒有實測**。「消失」需要我們在 Orion 4.7.0 + IoTA 3.14.0 上跑 e2e 才能確認，標為「未查證」者代表我找不到證據，不代表不會變。

| ID | 升版後 | 證據 / 說明 |
|---|---|---|
| C-01 禁用字元 | 部分緩解 | 4.7.0 的 `TextUnrestricted` 可略過屬性值檢查（F4）；identifier 的限制沒有變更記錄；`b64:` 編碼是否可以拿掉：未查證 |
| C-02 同步轉發 5 s | 未查證 | node-lib 4.8.0 / 4.10.0 加入 notification 式命令模式（F7），可能改變命令路徑；是否取代 registration 轉發與 5 s timeout：未查證 |
| C-03 慢或失敗的 push 不寫入、不重試 | 未查證 | 同 C-02；release notes 沒有重試相關項目 |
| C-04 `PENDING` 與 `OK` 競態 | 未查證 | 同 C-02；notification 模式的狀態寫入順序未查證 |
| C-05 無通知重送 | 留著 | 4.2.0～4.7.0 無重送變更（F4）；未發布的只有失敗通知改為 WARN log（F5） |
| C-06 命令屬性讀回 `""` | 留著（未查證） | 無相關變更記錄 |
| C-07 `<cmd>_info` last-writer-wins | 留著（未查證） | 無相關變更記錄 |
| C-08 polling 一個 device 一個 command slot | 留著（未查證） | 無相關變更記錄 |
| C-09 無驗證、tenant 為 header | 留著 | Orion 與 IoTA 的 release notes 無驗證變更（F4、F7）；Wilma / Keyrock 已列為 dormant（00-requirements §7，非本次查證） |
| C-10 per-device key 限制、不能推撤銷 | 留著 | node-lib 4.8.0～4.14.0 沒有 device key、TLS、撤銷的項目（F7） |
| C-11 屬性集合在 provisioning 固定 | 未查證 | 無相關記錄 |
| C-12 命令推到註冊時的 IP:port | 可能改變 | 若改用 notification / polling 命令模式則不再依賴 IP；但需實測（F7） |
| C-13 heartbeat 產生的 entity 不觸發 `entityCreate` | 未查證 | 無相關記錄 |
| C-14 stale PID、debug log、`-noCache` | 我們的 compose 問題，與升版無關 | 這是 我們的 compose 的預設值；Orion 4.4.0 以後 Dockerfile 基底升到 Debian 13.3（F4）但 PID 行為未查證 |
| C-15 QuantumLeap 限制 | 消失，但不是因為升版 | QuantumLeap 已死（00-requirements §7）；要換成自己的 writer 或別的 sink（那是 P0 的做法，與 FIWARE 升版無關） |

附帶：Mongo 6.0 EOL 的庫存痛點（00-requirements §7）由 Orion 4.2.0 起的 MongoDB 8.0 reference 解掉（F4）；升版同時帶來一次破壞性設定變更（`IOTA_MONGO_*` 在 4.14.0 移除，F7），以及 Node 20 以上的要求。AGPL-3.0（F1, F6, F8）是現況，不是升版新增，但 M-05 該正式回答它。

### 3.4 回答：哪一個「買」的方案最接近錨點，致命缺點是什麼

**意見：ThingsBoard（含 Edge）最接近。** 理由：站點上有 Edge、由 Edge 端對上發起連線（T7，形狀 (b) 與 (c) 都能放）；MQTT 原生，可直接吃講 MQTT 的 T1；規則引擎與儀表板覆蓋 F-08～F-10；活躍度高（T1）。它是唯一一個在「裝置 → 站點 Edge → 雲端」三段都有現成產品的選項。

**致命缺點有兩個，第一個是結構性的：**

1. **授權（M-05）**。4.4 起為 BSL 1.1（T2）；商業用途免費額度為 100 devices、一台 server，並要求 branding 與金鑰（T3）。我們的目標規模超過或貼近這條線。要嘛買商業授權，等於把一份綁客戶的授權帶進每個站點（M-05），要嘛凍結在 Apache-2.0 的 4.3.x，等於把 M-06 的時鐘交給一條不再演進的版本線。
2. **第二個真相來源（§1-1）**。ThingsBoard 自帶 device registry、attributes、RPC 與規則，會與 Odoo 的綁定、playlist、profile 並存；§4.2 的歷史（「沒有餘力維護獨立的管理平台，所以 Odoo 成為管理平台」）就是在說這件事。把它放進來，要嘛它成為管理平台、Odoo 退成 UI（妥協 F-33 與 §1-1 的 ERP 為主），要嘛我們做雙向同步（新增一個要維護的種類，M-02）。

**如果必須授權乾淨**，次佳是 Kura + Kapua（EPL-2.0），致命缺點是 Kapua 2.0 仍為 beta 且需要三種後端（E9），以及它把邊緣換成 Java / OSGi（M-02）。Hono + Ditto 的致命缺點是沒有站點閘道與貢獻者集中（E2、E6）。雲端 IoT 的致命缺點是兩套真相來源加廠商時鐘（C1）。

**留 FIWARE 升版**不是「買新東西」，而是「承認現況」：它延續既有投資，但 §3.3 顯示結構性的命令語意與驗證缺口（C-02～C-10）沒有公開證據會因升版消失，也就是 02-tradeoffs 所列、我們不想再付的那些代價會留下。

## 4. 未查證或有疑慮之處

1. **egress policy 擋下了大部分廠商官網與文件站**（thingsboard.io、docs.aws.amazon.com、learn.microsoft.com、eclipse.dev、projects.eclipse.org、openremote.io、mender.io、balena.io、fiware.org、smartdatamodels.org、readthedocs 等）。標【搜尋摘要】的事實未經原頁驗證，請在採信前複核。依規範我沒有繞過這個限制。
2. **GitHub API 無法使用**（工作階段只綁定了本專案 repo），所以沒有 license 偵測欄位、貢獻者清單、star 趨勢；活躍度只來自 `releases.atom` 與 `commits/*.atom`，沒有「主要貢獻者是否退出」的直接證據。Hono 與 Ditto 的 2026 年 committer 名單：未查證。
3. **GitHub `releases.atom` 的時間戳不一定是正式發布日**，部分 repo 順序異常（OpenRemote 1.31.0 晚於 1.31.1；Kapua 1.6.14 晚於 1.6.15）。日期請視為「GitHub 回報時間」。
4. **ThingsBoard BSL 的 "Device" 定義**與我們的螢幕、感測器、閘道各算不算一個 Device：未查證，需讀完整授權條文。Edge 在 4.4 的授權：未查證。ThingsBoard 舊線（4.2、4.3）的支援期限：未查證。ThingsBoard 的資源需求（最小部署大小）：未查證。
5. **各產品的「hostile 裝置圍堵」與「Odoo 整合介面」**：除了 Odoo 自身 API（G1）之外，沒有取得任何產品的官方說明，§3.1 該欄多為「？」，其中的判斷屬於意見。
6. **雲端價格**皆來自第三方或舊公告，不是廠商即時頁；Azure IoT Hub 價格、AWS Greengrass 現價、Jobs 現價未查證。IoT Core 與 IoT Hub 在台灣 region 的可用性未查證。
7. **FIWARE Foundation 現況**（會員、財務、治理、Smart Data Models 的實際維護頻率）：未查證；只能說 FIWARE GitHub 組織有近期更新、Mintaka 已歸檔、Orion 與 IoTA 有定期 release。
8. **Docker Hub 的 Orion 4.6.0 / 4.7.0 缺 tag**：原因未查證（可能發布到其他 registry，或尚未推送）。若採升版，必須先確認可取得的映像與簽章來源。
9. **Orion / IoTA 的 AGPL-3.0 對我們的法律意義**（未修改、以獨立網路服務執行時的義務）是法律判斷，不在本次查證範圍，建議由 M-05 的擁有者另案確認。
10. **Azure IoT Central 的退場訊息**在 2024 年被報導又被 Microsoft 更正（搜尋摘要）；我沒有取得 2026 年的現況，因此未列入事實表，只當作「廠商訊息可能反覆」的旁證。
