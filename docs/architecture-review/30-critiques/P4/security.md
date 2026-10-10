# P4 批評：安全（security）

> 波次 B 批評者，lens = 安全。日期：2026-10-10。目標：`20-proposals/P4-buy.md`（ThingsBoard 三件組，備案 FIWARE 升版）。輸入：`03-brief.md`、`00-requirements.md`、`01-proposal-pcie-tree.md`、`02-tradeoffs.md`、`10-facts/{transport-through-networks, mqtt-brokers, nats, mqtt-semantics, buy-options}.md`。
>
> 事實來源寫法：`檔名` 列號 指 10-facts；「raw」指我今天（2026-10-10）從 GitHub raw 直接讀到的 ThingsBoard 原始碼或設定檔，附 URL 與該檔列號。沒有一手來源的主張一律標「未查證」。ThingsBoard 的 SECURITY.md 在 master 回 404、GitHub security advisories 頁在本環境被擋，所以**本文對 ThingsBoard 的漏洞揭露流程與 CVE 紀錄全部未查證**。

## 0. 結論先講

**致命 1 條、重大 7 條、次要 3 條。** 一句總評：P4 買到的圍堵（device API 不是通用 broker、裝置不能寫 shared attributes）在「單一裝置」這一層是真的，但 P4 把每片 CM4 都做成 **gateway**，而 ThingsBoard 的 gateway 身分是 **tenant 範圍**的能力——任何一片 CM4 的憑證可以替同 tenant 內任何已存在的裝置回報 actual、接走它的 RPC，還能被 north 端遠端打開 shell；F-18「child 只看得到 parent」在應用層不成立。(c) 形狀的 Edge↔server 這一跳在客戶 TLS 檢查 proxy 下，P4 不是「活不下來」就是「活下來但信任交給 proxy」，而 P4 把後者寫成優點。bootstrap/revoke 流程依賴的 X.509 chain provisioning 會在每次連線時把裝置憑證改寫成當下出示的憑證，使撤銷與輪替都可被出廠憑證撤回。這些大多可修，但修法要麼放棄 IoT Gateway 在 CM4 上的角色（P4 理由 3 的一半），要麼在 ThingsBoard 之上再加一層我們自己的簽章（回到 P0 的「安全是自己的」）。

## 1. Findings

### security-01（重大）gateway 憑證是 tenant 範圍的能力：一片 CM4 可替整站任何裝置說話、接走它的 RPC

- **情境**：形狀 (b)(c)，D-01 加 D-02 同站；C-25 的共享 PSK Wi-Fi；T2 是「per-unit software credential」（§4.2 管理表），CM4 沒有 secure element。一片螢幕被偷、或憑證從 eMMC 被抄走。
- **壞在哪一步**：攻擊者用螢幕 A 的 gateway 憑證發 `v1/gateway/telemetry {"screen-B": [...]}` 或 `v1/gateway/attributes`。server 端 `findOrCreateDevice` 只做「tenant 內同名裝置存在就直接回傳」，**沒有檢查該裝置與這個 gateway 有沒有關係**（關係檢查只存在於 Sparkplug 改名路徑）；接著 `updateLastConnectedGateway` 把 B 的 last-connected gateway 改成 A（raw：`https://raw.githubusercontent.com/thingsboard/thingsboard/master/application/src/main/java/org/thingsboard/server/service/transport/DefaultTransportApiService.java` 列 357–373、392–412、467–479，2026-10-10）。thingsboard.yml 註解明寫 sub-device 的 RPC session 在「下一則該裝置的 gateway 訊息（connect、telemetry、attribute）」時重新註冊到發訊息的 gateway（raw：`…/application/src/main/resources/thingsboard.yml` 列 728–734，2026-10-10）。結果：(1) A 可以偽造 B 的 `applied_playlist_version`，Odoo 的 `done = client == shared` 把 B 標成 In sync（B-03 的新版本，而且是蓄意的）；(2) A 可以偽造 D-02 的 HCHO 量測壓掉 80 ppb 告警；(3) B 的 persistent RPC 與 shared attribute 更新被送到 A，B 收不到新 playlist——defacement by omission。
- **依據**：F-18、F-48、M-04、N-05（「a node writes only its own actual state … under its own identity」）；P4 §3.2 第 2 層自己寫「拿到 gateway 憑證才能替它『連接』過的裝置說話」——事實是替**任何同名裝置**說話，且「連接過」這個限制不存在。
- **可修**：可修，但代價是 P4 理由 3 的一半。選項 A：CM4 不跑 IoT Gateway，每個 function 各持一張 X.509 憑證走 `v1/devices/me/*`（device API 的圍堵才是 per-device 的）；F-20「一單元多功能」改以命名與 server attributes 表達；代價約 3 人週重寫 connector 成 multi-client，且 Modbus 等現成 connector 只能留在 Edge 主機。選項 B：每片 CM4 一個 tenant——與 Odoo 一站一 tenant 的模型衝突，不建議。選項 C：rule chain 在 `Save Timeseries` 前比對 originator 的 `GATEWAY_CREATED_RELATION`——但 `updateLastConnectedGateway` 在 rule chain 之前就已經改寫路由，擋得了資料擋不了 RPC 劫持，不夠。

### security-02（重大）`remoteConfiguration` 預設開、`remoteShell` 可被遠端打開、JWT 簽章金鑰有公開預設值：north 到每片 CM4 的 shell 只隔兩個預設值

- **情境**：所有形狀。D-01 公開螢幕。
- **壞在哪一步**：IoT Gateway 預設 `"remoteConfiguration": true`、`"remoteShell": false`（raw：`https://raw.githubusercontent.com/thingsboard/thingsboard-gateway/master/thingsboard_gateway/config/tb_gateway.json`，2026-10-10）。遠端設定由 shared attributes 送達，進入 `RemoteConfigurator.RECEIVED_UPDATE_QUEUE`（raw：`…/thingsboard_gateway/gateway/tb_gateway_service.py` 列 778–783）；`_handle_general_configuration_update` 接受的欄位包含 `host`/`port`（把 gateway 指到別的 server）與 `remoteShell`，並呼叫 `init_remote_shell`（raw：`…/thingsboard_gateway/tb_utility/tb_gateway_remote_configurator.py` 列 321–325、355–359、926，2026-10-10）。所以：**能寫 gateway 裝置 shared attributes 的人 = 能在每片 CM4 開 shell 的人**。誰能寫？任何 tenant JWT 持有者（見 security-05）；而 server 與 Edge 的 `JWT_TOKEN_SIGNING_KEY` 預設值都是字串 `thingsboardDefaultSigningKey`，且 `SECURITY_USER_TOKEN_ACCESS_ENABLED` 預設 true（sysadmin 可取得任何 tenant admin 的 token）（raw：thingsboard.yml 列 168、170；`https://raw.githubusercontent.com/thingsboard/thingsboard-edge/master/application/src/main/resources/tb-edge.yml` 列 229、231，2026-10-10）。compose 漏設一個環境變數，8080 可達者就能自鑄 tenant admin JWT → 寫 shared attribute → 開 shell → 改螢幕上任何東西。這是 F-48「forged intents are a defacement risk once screens are public」的最短路徑，也違反 N-03「an absent key fails closed」（這裡是 fails open 到公開預設）。
- **依據**：F-48、N-03、N-01；P4 §8 第 6 點對 B-10 只討論 REST connector 的 bind，沒有討論 remote configuration 與 remote shell。
- **可修**：可修，便宜。(1) CM4 映像把 `remoteConfiguration:false`、`remoteShell:false` 寫死並以唯讀掛載設定；(2) N-01 的 compose 模板把 `JWT_TOKEN_SIGNING_KEY`、`SECURITY_USER_TOKEN_ACCESS_ENABLED=false` 列為必填，啟動腳本偵測到預設值就拒絕啟動；(3) e2e 加一條「寫 gateway shared attribute 嘗試開 shell 必須被忽略」。代價 < 0.5 人週，但要寫進 P4 的 1.5 人週「硬化」預算並有測試，否則就是口頭隔離（N-01）。

### security-03（致命，限 (c) 形狀且客戶有 TLS 檢查 proxy）Edge↔server 的信任要麼斷、要麼交給 proxy；P4 把後者寫成優點

- **情境**：形狀 (c)，F-41；客戶 egress 有 TLS 檢查 proxy 且不給 bypass。D-01 公開螢幕在站點。
- **壞在哪一步**：Edge 對 server 的身分是 `CLOUD_ROUTING_KEY` + `CLOUD_ROUTING_SECRET`（bearer，長效，手動輪替），TLS 預設關（`CLOUD_RPC_SSL_ENABLED: false`），唯一的 server 信任錨是 `CLOUD_RPC_SSL_CERT` 一個檔案路徑（raw：tb-edge.yml 列 113–115、144–146，2026-10-10）。遇到檢查 proxy 只有兩個結局（`transport-through-networks.md` 列 17–18、34–36 T1～T3、38 T5）：(a) Edge 用我們的 server cert 做信任錨 → 握手失敗，P4 §8 第 2 點已承認且無退路；(b) 客戶 IT 要求 Edge 信任 proxy 的 CA → 連線成功，但從此 **proxy 可以讀走 routing secret、可以注入 shared attributes 與 RPC**。F-48「each hop verifies its parent」在這一跳變成「Edge 驗證的是 proxy」。routing secret 一旦被 proxy 端記錄，持有者可從任意位置冒充這個站點的 Edge 上傳整站的假 telemetry 與 `applied_*`，因為它不綁 IP、不綁 cert、不會過期。P4 §3.4 說 routing secret「天然不受影響」——方向反了：不受影響的是**連通性**，受影響的是**保密性與下行真偽**。P0 在同一條邊也會失去 mTLS，但 `transport-through-networks.md` 列 99 給 P0 的補法是應用層簽章；P4 的 ThingsBoard 沒有這一層，而 P4 也沒有提議加。
- **依據**：N-02、F-48、F-41；`transport-through-networks.md` 列 17–18、98–99、155。
- **可修**：可修，但要加我們自己的安全層。(1) 連通性：`CLOUD_RPC_SSL_CERT` 釘住我們的 server cert、`CLOUD_RPC_SSL_ENABLED=true` 列為必填——這讓 (b) 結局 fail closed，剩下的是情境擬合問題（gRPC 穿越，P4 已列 PoC）。(2) 真偽：Odoo 對每份 desired（`{playlist_version, playlist_url}`）與每個 RPC params 用 Ed25519 簽章，display/LED custom connector 用釘在映像裡的 Odoo 公鑰驗章，拒絕無簽章的 shared attribute——這讓 ThingsBoard、Edge、proxy 全部降級成不可信傳輸，F-48 端到端成立。代價：約 1～2 人週、一份自己維護的簽章格式（M-02）、金鑰輪替流程，以及 `02-tradeoffs.md` §1 那條「安全是自己的」又回來一半。(3) routing secret 以 REST 定期輪替（是否有 API：未查證）。不做 (2) 的話，(c) 形狀遇到檢查 proxy 時 P4 在安全面不成立。

### security-04（重大）X.509 chain provisioning 每次連線改寫裝置憑證：撤銷與輪替都能被出廠憑證撤回；「唯一發行者」其實是 factory CA

- **情境**：所有形狀；D-01 螢幕 Remove from Management 後、或 F-19 憑證輪替後；RMA 與序號碰撞。
- **壞在哪一步**：`provisionDeviceViaX509Chain`：鏈合法 → 從 CN 取裝置名 → tenant 內同名且同 profile 的裝置存在 → 若其 credentials 型別是 X509，**把 credentials 更新成這次出示的憑證 hash並回 SUCCESS**；不存在則看 `allowCreateNewDevicesByX509Certificate`（raw：`https://raw.githubusercontent.com/thingsboard/thingsboard/master/application/src/main/java/org/thingsboard/server/service/device/DeviceProvisionServiceImpl.java` 列 100–116，2026-10-10）。三個後果：(1) **輪替被撤回**：P4 §3.3 第 4 步說輪替靠 REST 更換 credentials；只要裝置仍在開 chain provisioning 的 profile 裡，舊的出廠憑證再連一次，credentials 就被改回舊 hash——F-19「rotatable」只在沒人持有舊憑證時成立。(2) **身分劫持**：同一 factory CA 簽出、CN 相同的第二張憑證（序號碰撞、RMA 複製、或 factory CA 私鑰外流）會覆寫正牌裝置的 credentials，正牌裝置下次重連被拒；這是 DoS 加冒充。(3) **撤銷語意不明**：P4 的 revoke 是「REST 刪除 credentials（或整個 device）」；只刪 credentials 時 `findDeviceCredentialsByDeviceId` 回 null 會怎樣、把型別換成 ACCESS_TOKEN 時 X509 分支被跳過但仍回 SUCCESS 會怎樣——**未查證**，而 P4 的 e2e 清單（§9「ACL 拒絕測試」）沒有「已撤銷裝置帶出廠憑證重連必須被拒」這一條。另外 tb-edge.yml 裡沒有任何 `provision` 鍵（我 grep 過整份檔，2026-10-10），P4 §3.4 已標 Edge 是否支援 chain provisioning 未查證——(b)(c) 形狀的裝置是連 Edge 不是連 server，整個 bootstrap 流程建立在一個未查證的前提上。
- **依據**：F-19、F-35、§4.2 管理表 T2/T3「bootstrap credential invalid after adoption」、SC §2.2「一個發行者」。P4 §3.4 稱 ThingsBoard 是唯一發行者；實際上裝置的營運身分就是 factory CA 簽的那張出廠憑證（P4 自己承認沒有短效換發），ThingsBoard 只是綁定；加上 Mosquitto dynsec 的 T1 帳號，站點上有三個憑證庫。
- **可修**：可修，便宜但必須測。adopt 完成後由 `iot_tb` 把裝置移到 **provisioning = DISABLED** 的營運 profile，credentials 釘住 hash；chain provisioning 只留在 bootstrap profile。revoke = 刪 device 並在 Odoo 保留序號黑名單（Odoo 預建時拒絕重建）。factory 端做 CN 唯一性檢查。e2e 加「撤銷後帶出廠憑證重連被拒」「舊憑證在輪替後重連被拒」兩條。代價 < 0.5 人週；但 Edge 側 chain provisioning 是否存在要先 PoC，不存在則 (b)(c) 的 bootstrap 要改走 server 端 REST 預綁 hash（operator 掃 QR 時同時上傳公鑰指紋）。

### security-05（重大）desired 的寫入者不只 Odoo：F-48「誰可以命令哪個節點」的答案是「任何 tenant JWT」

- **情境**：形狀 (c) 多客戶共用我們的雲；形狀 (b) 的 Edge 主機 UI。D-01 公開螢幕。
- **壞在哪一步**：P4 §4.2 把 desired 的「誰能寫」填成「Odoo 經 `iot_tb`」。平台上實際能寫同一個 shared attribute 的還有：TB tenant admin 的 UI 與 REST、rule chain 的 save attributes 節點、Edge 本地 UI（Edge 的使用者由 cloud tenant 同步，本地改 shared attributes 是否上行同步：**未查證**）、以及 security-02 的 remote configuration。(c) 形狀下我們的 sysadmin 帳號可憑 `user_token_access_enabled`（預設 true，raw thingsboard.yml 列 170）取得任何客戶 tenant 的 admin token——一個被釣的 ops 帳號 = 所有客戶的螢幕。沒有 per-device 的命令授權：P4 §4.4 F-48 自己標「細粒度 RBAC 是否在 4.4 免費功能內未查證」。N-05「one writer per fact」在 ThingsBoard 這一層沒有執行機制，只有約定。
- **依據**：F-48、N-05、F-40（shared root 需 per-caller pinning）。
- **可修**：部分可修。(1) 不建任何人類 tenant admin；Odoo 用 API key 的 service user；`SECURITY_USER_TOKEN_ACCESS_ENABLED=false`；TB audit log 定期拉進 Odoo 做 N-05 的歸因。(2) Edge 的 HTTP 綁到管理介面並關閉本地登入——但這與 P4 給 D-06 的答案（Edge 本地儀表板當現場 HMI）衝突，HMI 需要 Edge UI 活著；折衷是只留 read-only customer user，而 customer user 的實際權限面未查證。(3) 根本解是 security-03 的簽章：讓「能寫 shared attribute」不等於「能命令螢幕」。不做 (3)，F-48 在 P4 裡永遠是「部分」。

### security-06（重大）N-04：從 prod 還原的 staging Odoo 會直接寫 prod 的 ThingsBoard

- **情境**：所有形狀；N-04 明文情境「staging restored from prod」。
- **壞在哪一步**：`iot_tb` 的 TB 連線設定（URL、service user 密碼或 API key）住在 Odoo DB。還原到 staging 後，staging 的 integration hub 排程照常輪詢（C-23 是連線上的 IT 設定，會一起還原），並在使用者按 Apply 時把 desired 寫進 **prod** 的 shared attributes、發 persistent RPC、甚至執行 Manage/Remove 改 prod 的 registry。P4 §3.4 只提到 routing secret 與裝置憑證「要在 runbook 裡 rotate」，而那兩者在這個情境根本不是破口——破口是 Odoo 側的 TB 憑證。`00-requirements.md` §9 要求「staging neutralisation as a built-in rather than a runbook step」，P4 給的是 runbook。
- **依據**：N-04、N-03（憑證應在 resolver 不在 DB）、F-70（archive = kill switch 的精神）。
- **可修**：可修，便宜。Odoo 啟動時讀 TB 的 tenant 屬性（例如 tenant title 內嵌環境標籤）與本地環境標籤比對，不符就把連線自動 archive（F-70 現成的 kill switch）；TB 憑證走 N-03 的 resolver 而不是 `ir.config_parameter`；每環境一個 tenant、一張 factory CA（P4 已有）。約 0.5 人週。

### security-07（重大）hostile T1 的 MQTT 路徑：裝置名可來自 payload、gateway 可無上限建裝置、retained 幽靈值看起來新鮮

- **情境**：形狀 (b)(c) 有 T1 MQTT 設備的站點；D-02/D-03。C-25：T1 與租戶裝置同 VLAN。
- **壞在哪一步**：P4 §3.2 用 Mosquitto per-client ACL 把 T1 限在 `raw/<id>/#`，然後由 IoT Gateway MQTT connector 轉譯。問題在轉譯：connector 的 `deviceNameExpressionSource` 可以是 `topic`、`constant` 或 **`message`**（官方範例就有從 payload bytes `[0:4]` 取名的設定；raw：`https://raw.githubusercontent.com/thingsboard/thingsboard-gateway/master/thingsboard_gateway/config/mqtt.json`，2026-10-10），`connectRequests` 也可由 topic 觸發。若 converter 取名方式讓 T1 控制名字，T1 就能取名為 `screen-B`——接上 security-01 的整條鏈。即使取名正確，server 端對 gateway 建裝置**沒有** `allowCreateNew` 開關，唯一的上限是 `EntitiesLimitExceededException`（raw：DefaultTransportApiService.java 列 343、371，2026-10-10）；P4 §7 把 F-31 交給 gateway 的 `deviceFiltering`（預設 `enable: false`，且跑在 CM4 這個 client 端）。hostile T1 送 100 個不同名字 → 100 個新 device → 撞 tenant `maxDevices` 或 BSL 的 100 Devices 額度（`buy-options.md` 列 26 T3），正牌螢幕 adopt 失敗。retained：T1 以 retain 位元發布後被移除（P4 的 T1 revoke 是「remove at the south + firewall rule」，不含撤 Mosquitto 帳號），retained 留在 broker（`mqtt-semantics.md` 列 36 MQ9：`check_retain_source` 只在 ACL 被撤時生效）；connector 預設 `cleanSession/cleanStart: true`（mqtt.json raw），每次重啟重新訂閱就再吃一次幽靈值；converter 若沒有 `ts` 對應，gateway 以接收時間蓋章——F-02、F-04 同時破，而且是 N-21 警告的「failure mode is a healthy-looking value」（HCHO 永遠 0 ppb）。
- **依據**：F-18、F-31、F-02、F-04、N-21、M-04；`mqtt-semantics.md` 列 36、`mqtt-brokers.md` 列 28–29（dynsec、`acl_file` 3.0 退場）。
- **可修**：可修，是紀律不是結構。converter 只准 `deviceNameExpressionSource: topic` 且名字取自 dynsec `%c` 綁定的 client id；T1 revoke 必須包含 dynsec disable client（`mqtt-brokers.md` 列 28：停用即斷線，配合 `check_retain_source`）；converter 要求 payload 帶 `ts` 否則丟棄並計數；T1 代表全部由 Odoo 預建、rule chain 對「不在 Odoo 名單」的 originator 直接丟棄並告警（裝置還是會被建出來，所以 `maxDevices` 要設得比名單大但不大很多）。e2e 加「T1 送異名 payload 不得產生新裝置資料」。約 0.5 人週，持續成本是每個 T1 一份 converter 審查。

### security-08（重大）M-05 的逃生門是安全的陷阱門：凍結 4.3.1.x 等於在客戶站點放一台修補期限未知的 JVM web app；整份審查沒有 ThingsBoard 的漏洞處理事實

- **情境**：形狀 (a)(b)，十年；D-05 客戶 IT 問「平台有什麼認證」。
- **壞在哪一步**：P4 §1 弱點 1、§7 把 (a)(b) 的 M-05 解法之一寫成「north 凍結在 Apache-2.0 的 4.3.1.x」，並承認舊線支援期限未查證。這在安全面的意思是：客戶站點上跑一個對 device VLAN 開 8883、對管理網開 8080 的 Spring Boot + Angular 單體，修補由廠商「意願」決定，而且與 4.4 分家後 4.3 線遲早停。對照：`nats.md` 列 37 N17 有 2026 年兩批 advisory 可讀，我們知道 NATS 的洞在哪、修多快；ThingsBoard 的 SECURITY.md 在 master 回 404、advisories 頁在本環境不可達（2026-10-10），`buy-options.md` 全文沒有一條 CVE 或揭露流程事實。P4 §1 說「安全審查這一刀由廠商承擔」——沒有證據。另一面：IoT Gateway 把 15 種 connector 的 Python 相依（pymodbus、OPC-UA、BACnet、CAN……）裝進每片只跑 display 的 CM4，3.8.3→3.8.5 在 2026 年內三個版本（P4 §2），fleet 升級是我們的工，attack surface 是別人的。
- **依據**：M-06、N-10、M-05；`02-tradeoffs.md` §1「安全是自己的」與 §4「過了安全支援」的定義。
- **可修**：部分可修。(1) 在 (a)(b) 直接付商業授權而不凍結——這把 M-05 從「違反」變「要談的合約」，P4 已經這樣寫，但要刪掉凍結選項。(2) 採用前查到 ThingsBoard 的揭露流程與近兩年 advisory（有網路的人補 `buy-options.md`），沒有就把「安全審查由廠商承擔」從 P4 §1 刪掉。(3) CM4 映像只裝 display/LED connector 的相依、pin 版本、自己做 SBOM。代價：授權費（未知）加每年一次 JVM 大版（P4 §8 第 3 點已列）。

### security-09（次要）server 與 Edge 的預設面：1883 明文、0.0.0.0、`MQTT_SSL_ENABLED=false`——P4 圖上的 8883 要靠 compose 才存在

- **情境**：形狀 (a)：ThingsBoard server 與 Odoo 同一台站點主機，C-25 網路。
- **壞在哪一步**：server 與 Edge 的 MQTT transport 預設 `enabled: true`、`bind_address 0.0.0.0`、`bind_port 1883`，SSL listener 預設 `enabled: false`；HTTP 預設 `0.0.0.0:8080`（raw：thingsboard.yml 列 1493–1497；tb-edge.yml 列 10–11、1286–1290、1315，2026-10-10）。P4 §3.1 三張圖都只畫 8883，但沒有一條設定值在文件裡。漏掉一個變數就是 B-10 的 north 版：明文 MQTT 對整個站點網路開放，access token 在 Wi-Fi 上以明文走（`transport-through-networks.md` 列 23、86 T27：共享 PSK 下 Wi-Fi 加密對 insider 視為零）。
- **依據**：N-01、N-02、N-03、B-10、C-25。
- **可修**：可修，便宜。N-01 的 compose 模板：`MQTT_ENABLED=false`（明文）、`MQTT_SSL_ENABLED=true`、`HTTP_BIND_ADDRESS` 綁管理介面、關 CoAP/LwM2M/SNMP/HTTP transport；e2e 用 port scan 斷言每種形狀的開放面。< 0.5 人週，但要寫進 P4 的「硬化」預算。

### security-10（次要）「MES live board = public dashboard 一個 URL」把 Edge/server 的整個 HTTP 面開給 device VLAN，並以公開 URL 取代 F-59/F-72 的 per-record token

- **情境**：形狀 (b)(c)，D-01 的 MES live board（backlog）。
- **壞在哪一步**：螢幕上的頁面要 poll Edge 或 server 的 dashboard，防火牆就要從 device VLAN 放 8080 到 Edge——P4 §3.1 (b) 圖的「VLAN10 → VLAN20 只放 8883」立刻多一條，而 8080 後面是登入頁、REST、WebSocket 與 security-02 的 JWT 端點（預設金鑰）。ThingsBoard 的 public dashboard 機制依賴把實體指派給 public customer，其讀取面有多大（只該 dashboard，還是該實體全部 telemetry/attributes）：**未查證**。D-01 原本的設計是「token-protected JSON」（F-59、F-72），P4 換成公開 URL。
- **依據**：F-59、F-72、N-01、C-24。
- **可修**：可修。live board 繼續由 Odoo 以 per-record token 供應（現成），Edge 儀表板只給 D-06 HMI 且放在獨立介面後面加 auth proxy；或 PoC 查清 public customer 的讀取面再決定。約 0.5 人週。

### security-11（次要）B-10 的另一半（R2「reconcile fetches any URL」）會重現：`playlist_url` 是 shared attribute

- **情境**：所有形狀，D-01。
- **壞在哪一步**：P4 §4.1 的 desired 是 `{playlist_version, playlist_url}`；display connector 拿到 URL 就去拉。P4 §8 對 B-10 只回答 bind 的那一半。配合 security-05 的多寫入者，寫一個 URL 就是 defacement；配合 security-03，proxy 也能寫。
- **依據**：B-10、F-48、F-56。
- **可修**：可修，便宜。connector 不信任 URL：由釘死的 Odoo base 與 version 自己組 URL，或只接受帶 Odoo 簽章的 desired（security-03 (2)）。< 0.2 人週。

## 2. 此點成立（P4 說對了什麼）

1. **device API 不是通用 broker。** 裝置只有 `v1/devices/me/*` 那幾個 topic、不能訂閱別人、不能寫 shared attributes（P4 §3.2 引用 python-client-sdk 的 topic 清單）。在**單一裝置憑證**這一層，這比 P1 的 dynsec ACL 與 `mqtt-semantics.md` 列 36 MQ9 描述的 raw retained（任何有 publish 權者可覆寫）強：裝置結構上無法偽造 desired。security-01 的問題出在 gateway 憑證，不在 device 憑證。
2. **配額層是買來的。** tenant profile 的 rate limit 欄位與 `TB_TRANSPORT_MAX_WRONG_CREDENTIALS_PER_IP`（P4 §3.2 第 3 層）是 P0 要自己寫的；P4 也誠實指出它是配額不是聚合。
3. **選 X.509 而不是 access token 是對的。** chain provisioning 存的是憑證 hash（DeviceProvisionServiceImpl.java 列 95、105），Edge 本地 PG 同步的是 hash 不是 bearer 密鑰；單一 hypervisor（C-25）上的 Edge 被抄走時，裝置身分不會跟著走。security-04 批評的是 provisioning 的重綁語意，不是型別選擇。
4. **誠實的降級。** P4 自己寫明：Edge↔server 不是 mTLS（§3.4）、沒有短效憑證與心跳續期（§3.3）、沒有簽過名的 revoke、F-48 只「部分」、staging 要手動 rotate、(c) 形狀 gRPC 穿越無事實。評審不必替它找這些。
5. **TB → Odoo 不用 webhook。** 以輪詢取代推送（§4.1）避開 C-03/C-05，也不在 Odoo 開任何新的 inbound 面，F-68「一條 inbound 路由」不變。
6. **網路層圍堵照抄 P0 與 `transport-through-networks.md` §3.2 八條**（§3.2 第 1 層），Edge 10 秒 keepalive 小於 60 秒 idle 預設（§3.1，對照 `transport-through-networks.md` 列 45–47 T7～T9）。這兩點成立。

## 3. 作者最怕被問的一句話

「請在 e2e 裡示範：用螢幕 A 的 gateway 憑證發一則 `v1/gateway/telemetry` 給 `screen-B`，然後告訴我 Odoo 有沒有把 B 標成 In sync、B 的下一個 RPC 送到了誰手上。」
