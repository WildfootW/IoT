# 提案 P4：買不要做 — ThingsBoard 三件組（主）與 FIWARE 升版（備）

> 波次 A 提案架構師 P4。日期：2026-10-10。輸入：`00-requirements.md`、`01-proposal-pcie-tree.md`（P0）、`02-tradeoffs.md`、`03-brief.md`、`10-facts/*.md`。事實引用寫成「`檔名` 列號」；我自己另外查的事實附 URL 與查證日期（皆 2026-10-10，來源一律是 GitHub raw、PyPI JSON API 或 Docker Hub tags API，因為 thingsboard.io 文件站在本環境被 egress policy 擋下，所有「文件怎麼說」的主張一律標未查證）。「意見」與「事實」分開標示。

## 1. 結論先講

**立場。** 用 ThingsBoard 的三件組搭系統：north 是 **ThingsBoard server**（裝置登錄、telemetry 儲存、規則引擎、persistent RPC、儀表板），每個站點或 device VLAN 一個 **ThingsBoard Edge**（south，對上以 gRPC 撥出、離線緩衝、本地規則與本地儀表板），每片 CM4 上跑 **ThingsBoard IoT Gateway**（Python，含 Modbus/MQTT 等 connector，我們只寫 display 與 LED 的 custom connector）。Odoo 退成業務真相與 UI：binding、playlist、profile、show 仍由 Odoo 持有，透過一支 `iot_tb` adapter 把 desired state 寫成 ThingsBoard 的 shared attributes、把 job 送成 persistent RPC，並以 integration hub 式的輪詢拉回結果與告警。**備案**是「留 FIWARE 並升版」（Orion 4.7.0 + IoT Agent JSON 3.14.0 + MongoDB 8.0），它不是買新東西，是承認現況並付掉已知帳單。

**一句話。** 一家活著的單一廠商，用一份 BSL 授權，把 P0 要自己寫的登錄、憑證型別、RPC 狀態機、離線緩衝、15 種協定 connector、告警與儀表板全部賣給我們；代價是 north 的授權會綁住在站點自跑的客戶、裝置登錄變成第二個真相來源、以及 JVM 進入最小部署。

**三個最強理由。**

1. **F-46/F-47 的核心零件這次真的是買來的，不是傳輸零件。** `mqtt-semantics.md` §5 的結論是 MQTT 只給傳輸層，版本、job key、結果槽、deadline 都要自己寫；AWS/Azure 是服務端做掉的（MQ14、MQ15、MQ23）。ThingsBoard 就是那個「服務端」：persistent RPC 的狀態機是 `QUEUED → SENT → DELIVERED → SUCCESSFUL / TIMEOUT / EXPIRED / FAILED / DELETED`，RPC 實體保存 `request`、`response`、`expirationTime`、`status`（事實：https://raw.githubusercontent.com/thingsboard/thingsboard/master/common/data/src/main/java/org/thingsboard/server/common/data/rpc/RpcStatus.java 、…/rpc/Rpc.java，2026-10-10）。F-50 的 `unknown` 與 `timeout`、F-52 的「送達與完成兩個事件」、F-49 的「結果可觀察」在這裡是現成的欄位，不是我們的 reconciler。
2. **三種部署形狀都有同一家廠商的現成零件，而且站點側全是 Apache-2.0。** Edge 由 Edge 端撥出 gRPC（`buy-options.md` T7），設定檔有 exponential backoff 加 jitter（3 s 起、上限 180 s、jitter 0.15）、10 秒 keepalive、以及 **HTTP proxy 的 host/port/帳密** 選項（事實：https://raw.githubusercontent.com/thingsboard/thingsboard-edge/master/application/src/main/resources/tb-edge.yml ，2026-10-10）。Edge 與 IoT Gateway 的 LICENSE 在 master 都是 Apache-2.0（事實：https://raw.githubusercontent.com/thingsboard/thingsboard-edge/master/LICENSE 、https://raw.githubusercontent.com/thingsboard/thingsboard-gateway/master/LICENSE ，2026-10-10）。BSL 只碰 north 那一台。
3. **T1 的生態槓桿是整張清單，不是一個 adapter。** IoT Gateway 的 README 列出 Modbus TCP/RTU、OPC-UA、S7、CAN、ODBC、MQTT、REST、SNMP、BACnet、KNX、BLE、OCPP 等 connector，加 Python custom connector 介面；Modbus connector 以 `pymodbus` 實作，設定檔即 register 位址、function code、divider、poll period（事實：https://raw.githubusercontent.com/thingsboard/thingsboard-gateway/master/README.md 、…/thingsboard_gateway/connectors/modbus/modbus_connector.py 、…/thingsboard_gateway/config/modbus.json ，2026-10-10）。D-03「通用 Modbus backend」在 P0 是要寫的，這裡是設定檔。

**兩個最弱點。**

1. **M-05 在 (a)(b) 形狀上不成立，而且不是我們能設計繞過的。** 4.4 起 BSL 1.1 的免費商用額度是 100 Devices 加一台 server，且 **"Device" 的定義是「每個不同的實體或邏輯資料來源，不論直連或經任何 gateway」**，gateway 自己只以它原生的資料算一個（事實：https://raw.githubusercontent.com/thingsboard/thingsboard/master/LICENSE ，2026-10-10；`buy-options.md` T2、T3）。幾百個感測器加幾十片螢幕一定超過。在 (c) 形狀我們是 licensee、客戶不碰授權；在 (a)(b) 形狀 server 跑在客戶站點，要嘛客戶成為 licensee（M-05 直接違反），要嘛由我們以「代管」名義持有授權（法律判讀，未查證），要嘛 north 凍結在 Apache-2.0 的 4.3.1.x（`buy-options.md` T4），而舊線的修補期限未查證。
2. **第二個真相來源不是可以談掉的。** ThingsBoard 自帶 device registry、attributes、relations、customers；F-33 的 binding authority 若留在 Odoo，每一次 Manage 都是「寫 Odoo、再寫 ThingsBoard、兩邊要一致」的雙寫（`buy-options.md` §3.4 第 2 點）。§4.2 的歷史「沒有餘力維護獨立的管理平台，所以 Odoo 成為管理平台」就是在描述這個代價；P4 把它又帶回來，只是這次的平台活著、有文件、有廠商。

**M-06 的核心主張在 P4 被推翻了嗎？** 沒有，但被削了一塊。P4 證明的是：**「寫很便宜」在 P0 的清單裡至少有一半是對的**（adapter、custom connector、TBEL 規則、PKI 流程、e2e 仍然是我們的 code，§9 估約佔 P0 自建量的四到五成，意見），**但 P0 帳單裡最貴的「組織」那一刀**（`02-tradeoffs.md` §1：安全審查、制度性知識、三年後才來收的帳）在 P4 由廠商承擔：ThingsBoard 在同一天發 4.4、4.3.1.6、4.2.2.6（`buy-options.md` T1；Docker Hub `thingsboard/tb-node` tag 4.4.0 = 2026-09-29、4.3.1.6 與 4.2.2.6 = 2026-09-28，https://hub.docker.com/v2/repositories/thingsboard/tb-node/tags ，2026-10-10），這是一個看得見、三條線同時修補的時鐘。M-06 的原文是「依賴不清楚的元件才貴」；ThingsBoard 的時鐘是清楚的，貴的地方換成了授權。所以 P4 對 M-06 的回答是：**M-06 成立，但它的推論「所以自建」不必然成立；真正的分水嶺是 M-05。**

## 2. 元件清單

| 元件 | 自建或外部 | 授權 | 維護者與時鐘（附來源） | 取代掉什麼 |
|---|---|---|---|---|
| **ThingsBoard server 4.4.x**（north；monolith、`TB_QUEUE_TYPE=in-memory`、`DATABASE_TS_TYPE=sql`） | 外部 | BSL 1.1；Change License Apache-2.0、Change Date 發布後四年；免費商用額度 100 Devices / 1 server（事實：LICENSE raw，2026-10-10） | ThingsBoard, Inc.（單一廠商）。4.4 = 2026-09-29，同日 4.3.1.6、4.2.2.6（`buy-options.md` T1；Docker Hub tb-node，2026-10-10）。master pom 為 4.4.0.1-SNAPSHOT、Java 25、Spring Boot 3.5.15（https://raw.githubusercontent.com/thingsboard/thingsboard/master/pom.xml ，2026-10-10）。**注意**：Docker Hub `thingsboard/tb-postgres` 最新 tag 停在 4.2.1.1（2025-12-23），4.3/4.4 只在 `tb-node`（https://hub.docker.com/v2/repositories/thingsboard/tb-postgres/tags ，2026-10-10）；映像命名已改，部署前要確認，與 Orion 4.6/4.7 缺 tag 是同類風險（`buy-options.md` F3）。舊線支援期限：未查證 | Orion、IoT Agent、MongoDB ×2、QuantumLeap、CrateDB、Grafana、`iot_*` 的 Fleet 與 command queue 半數邏輯、integration hub outbound transport |
| **ThingsBoard Edge 4.3.1.x**（south；每站點或每 device VLAN 一個） | 外部 | Apache-2.0（LICENSE raw master，2026-10-10；README 稱可免費商用） | 同廠商。4.3.1.6 = 2026-10-01（`buy-options.md` T6；Docker Hub `tb-edge` 4.3.1.6EDGE = 2026-10-01，2026-10-10）。**Edge 尚無 4.4 release，4.4 是否改 BSL 未查證**（T6） | 現有 gateway、compose 套件的 south、P0 的 bridge node |
| **ThingsBoard IoT Gateway 3.8.x**（每片 CM4 一個；Python ≥ 3.10） | 外部 | Apache-2.0（LICENSE raw；PyPI classifier，2026-10-10） | 同廠商。PyPI 3.8.5 = 2026-09-17、3.8.4 = 2026-08-05、3.8.3 = 2026-03-26（https://pypi.org/pypi/thingsboard-gateway/json ，2026-10-10）；依賴 `tb-mqtt-client==1.13.14`、`tb-paho-mqtt-client>=2.1.2`（setup.py raw） | P0 的 unit agent、感測服務 的網路面 |
| **custom connectors**（display、LED；Python，跑在 IoT Gateway 內，呼叫 localhost 的 function backend） | 自建 | 我們的 | 我們的 | P0 node 的 backend 介面層 |
| **function backend**（display reconcile、LED、感測；獨立 process，只綁 localhost） | 自建 | 我們的 | 我們的（感測服務、LED 控制器 延續） | 不變（P0 同） |
| **`iot_tb`**（Odoo 模組：binding → TB device/edge 指派；desired → shared attributes；job → persistent RPC；輪詢 RPC status、alarm、activity → Odoo 業務事件） | 自建 | 我們的 | 我們的 | `iot_*` 的 command queue 與 Fleet sync、integration hub outbound |
| **tb-config repo**（device profiles、rule chains（TBEL）、dashboards JSON、tenant profile，全部以 REST 佈建） | 自建 | 我們的 | 我們的 | compose 套件的 provisioning 腳本、Grafana provisioning |
| **PostgreSQL 18**（ThingsBoard 的資料庫；可與 Odoo 同叢集、不同 database；Edge 另有自己的 PG） | 外部 | PostgreSQL License | PG 18 支援到 2030-11-14（`postgres-timeseries.md` F-11） | CrateDB、Mongo ×2 |
| **Odoo 19 + integration hub** | 外部 + 自建 | LGPL-3（https://raw.githubusercontent.com/odoo/odoo/19.0/LICENSE ，2026-10-10） | 不變 | 不變 |
| **Eclipse Mosquitto**（**條件性**：只在有 T1 講 MQTT 的站點，放在 Edge 主機旁） | 外部 | EPL-2.0 OR EDL-1.0（`mqtt-brokers.md` 列 1） | 2.1.2 = 2026-02-09，master commit 至 2026-10-04（`mqtt-brokers.md` 列 2） | P0 的 MQTT ingress adapter |
| **deploy repo**（三種形狀的 compose 與防火牆模板，N-01）、**e2e repo** | 自建 | 我們的 | 我們的 | compose 套件、IoT_e2e 延續 |

**種類數（M-02）。** 引擎：ThingsBoard server、ThingsBoard Edge（同廠商但獨立版本線與升級步驟，各算一）、PostgreSQL、Odoo = **4**。語言：Python（Odoo 模組、custom connector）、Java（**不寫，但除錯與讀 log 一定要讀**，算一）、TBEL（rule chain 腳本）、SQL = **4**。runtime：JVM、Python、PostgreSQL = **3**。repo：`iot_tb` 與其他 ERP 模組、custom connectors、tb-config、deploy、e2e = **5**。**合計 16**；有 T1 MQTT 的站點加 Mosquitto 為 17。對照 P0 的 13（`P1-mqtt-native.md` §2 的算法）淨增 +3。意見：這三個增量裡 Java 與 TBEL 是真的新東西，Edge 算第二個引擎是保守算法。Grafana 從清單消失是 P4 唯一的減項。

## 3. 拓樸、圍堵、身分

### 3.1 三種部署形狀

形狀 (a)：south/north 同一台主機（最小部署，一片螢幕）。

```
 [CM4 螢幕]                         [站點主機]
  display backend (localhost)        +----------------------------------+
        ^                            |  Odoo 19 + iot_tb            |
        | 本地協定                    |      | REST (JWT, 輪詢)          |
  IoT Gateway ---MQTT/TLS 8883------>|  ThingsBoard server (JVM)        |
  (custom connector)                 |      |                            |
                                     |  PostgreSQL 18 (odoo + tb 兩個 DB)|
                                     +----------------------------------+
  服務數：Odoo、ThingsBoard、PostgreSQL = 3（不放 Edge）
```

形狀 (b)：同站不同 VLAN。

```
 device VLAN 10 (T1/T2)        |  mgmt VLAN 20           |  ERP VLAN 30
                               |                         |
 [CM4] IoT Gateway --8883----->| ThingsBoard Edge (JVM) -+-gRPC/TLS 7070-> ThingsBoard server
 [T1 Modbus TCP] <--502 輪詢-- | (自己的 PG)             |        |
 [T1 MQTT] --1883--> Mosquitto | ^                        |   Odoo + iot_tb
   (在 Edge 主機旁)   |         | |                        |   PostgreSQL
                      +--gateway MQTT connector 訂閱       |
 防火牆：VLAN10 → VLAN20 只放 8883（與 1883，若有 T1 MQTT）；VLAN20 → VLAN30 只放 7070；其餘 deny
```

形狀 (c)：客戶 ERP 在我們營運的雲端、站點只有 outbound。

```
 站點（客戶網路，只放 outbound）                 |  我們的雲
 [CM4] IoT Gateway --8883--> ThingsBoard Edge  |
 [T1]  ---------------------> (本地 PG、本地儀表板、|
                               離線緩衝)         |
                                   |             |
                                   +--gRPC/TLS 443（EDGES_RPC_PORT 改 443）、
                                      CLOUD_RPC_PROXY_* 走客戶 proxy ----> NLB(TCP passthrough) -> ThingsBoard server
                                                                                                        |
                                                                                   Odoo（客戶租戶）+ iot_tb、PostgreSQL
 身分：Edge 用 routing key + secret（非 client cert）；TLS 由 ThingsBoard server 終結
```

事實：Edge 設定檔中 `CLOUD_RPC_PORT` 預設 7070、`CLOUD_RPC_SSL_ENABLED` **預設 false**、`CLOUD_RPC_PROXY_ENABLED/HOST/PORT/USERNAME/PASSWORD` 存在、`CLOUD_RPC_KEEP_ALIVE_TIME_SEC` 預設 10（tb-edge.yml raw，2026-10-10）；server 端 `EDGES_RPC_PORT` 預設 7070（https://raw.githubusercontent.com/thingsboard/thingsboard/master/application/src/main/resources/thingsboard.yml ，2026-10-10）。意見：10 秒 keepalive 遠小於 `transport-through-networks.md` T7～T9 的 60 秒 idle 預設，所以 (c) 的「活得過一分鐘」問題不存在；**但 gRPC 是 HTTP/2，穿過會做 TLS 檢查的客戶 proxy 時能不能存活，沒有任何事實**（`transport-through-networks.md` T12 只講 nginx 的 HTTP/2 keepalive；對 TLS 攔截下的 gRPC 無資料），這是 P4 在 (c) 形狀最大的 PoC 項目。P4 沒有 HTTPS long-poll 的退路。

### 3.2 hostile T1 怎麼被圍堵

三層，第一層與 P0 相同、後兩層是買來的。

1. **網路層**（M-04、N-02、C-25）：每個 device VLAN 一個 Edge，防火牆只對 VLAN 開 Edge 的 8883（與 Mosquitto 的 1883，若有）；Edge 的 north 介面在另一個 VLAN；`transport-through-networks.md` §3.2 的八條規則照用。這一層 P0 此點成立，P4 沒有改。
2. **協定層**：ThingsBoard 的 device API **不是通用 broker**。裝置能用的 topic 只有 `v1/devices/me/{telemetry, attributes, attributes/request, attributes/response, rpc/request, rpc/response, claim}`，gateway 憑證多一組 `v1/gateway/{telemetry, attributes, connect, disconnect, rpc, claim}`（事實：https://raw.githubusercontent.com/thingsboard/thingsboard-python-client-sdk/master/tb_device_mqtt.py 、…/tb_gateway_mqtt.py，2026-10-10）。沒有任意 subscribe、沒有看別人 topic 的面。一個拿到自己憑證的 hostile T2 只能偽造自己的量測與 actual；拿到 gateway 憑證才能替它「連接」過的裝置說話，這就是為什麼 gateway 憑證必須只在 CM4 的 IoT Gateway 手上，T1 永遠不拿 gateway 憑證。
3. **配額層**：tenant profile 有 `transportDeviceMsgRateLimit`、`transportDeviceTelemetryDataPointsRateLimit`、`transportGatewayDeviceMsgRateLimit`、`maxDevices`、`maxDPStorageDays` 等欄位（事實：https://raw.githubusercontent.com/thingsboard/thingsboard/master/common/data/src/main/java/org/thingsboard/server/common/data/tenant/profile/DefaultTenantProfileConfiguration.java ，2026-10-10）；transport 層另有 per-IP 錯誤憑證封鎖（`TB_TRANSPORT_MAX_WRONG_CREDENTIALS_PER_IP` 預設 10，thingsboard.yml raw）。F-01 的「超過 1 Hz 不上傳」可以用配額擋，但擋掉的是**整個裝置的訊息**而不是做 min/mean/max，這是配額不是聚合。

**T1 講 MQTT 的路徑**（F-22、F-34）：T1 的封閉韌體不會講 `v1/devices/me/telemetry`，所以 T1 MQTT 進不了 Edge 的 device API，必須先到一個真正的 broker。P4 選 Mosquitto（`mqtt-brokers.md` §3.1 第一名）放在 Edge 主機旁、只對 device VLAN 開 1883、per-client ACL 限制 T1 只能寫 `raw/<id>/#`，再由 CM4 或 Edge 主機上的 IoT Gateway **MQTT connector** 訂閱、經 converter 轉成 ThingsBoard 格式上送。schema 守門（F-31）在 converter（我們寫的 JSON 對應）與 rule chain 的 filter 節點做；未宣告的 key 在 `Save Timeseries` 之前丟掉。這條路徑是 P4 唯一「每個 bridge 旁放一個 broker」的地方，而且只在有 T1 MQTT 的站點才出現。

意見：這三層加起來比 P0 的「node 是唯一持有網路憑證的 process、backend 只在 localhost」**不弱**，而且第 2 層是我們在 P0 要自己寫的 schema 與 topic 守門員的一半。它比 P1（通用 broker 加 dynsec ACL）**強**在裝置面本來就沒有 subscribe 其他人的能力。弱的地方在 §8：IoT Gateway 內的 connector 是同一個 process 的 thread。

### 3.3 bootstrap → adopt → revoke

事實：裝置憑證型別有 `ACCESS_TOKEN`、`X509_CERTIFICATE`、`MQTT_BASIC`、`LWM2M_CREDENTIALS`；device profile 的 provisioning 策略有 `DISABLED`、`ALLOW_CREATE_NEW_DEVICES`、`CHECK_PRE_PROVISIONED_DEVICES`、`X509_CERTIFICATE_CHAIN`；X.509 chain 設定含 `certificateRegExPattern` 與 `allowCreateNewDevicesByX509Certificate`（事實：…/security/DeviceCredentialsType.java、…/DeviceProfileProvisionType.java、…/device/profile/X509CertificateChainProvisionConfiguration.java，皆 thingsboard master raw，2026-10-10）。

流程（意見，依上述事實設計）：

1. **出廠**：factory CA（我們的根，F-35）簽一張 bootstrap 憑證，CN = 序號。device profile `screen-cm4` 設 `X509_CERTIFICATE_CHAIN`、信任 factory CA、`allowCreateNewDevicesByX509Certificate=false`、`certificateRegExPattern` 取 CN。
2. **present, unadopted**：裝置連上 Edge，憑證鏈合法但 server 上沒有同名 device → 連線被拒。P0 的「Fleet 看得到但不綁」在這裡**不成立**：ThingsBoard 不會替一張合法但未登錄的憑證建立「待認領」的影子，除非把 `allowCreateNew…` 開成 true，而那就把 F-31 的「未知 id 不得自動建立」交出去。P4 的妥協：Odoo 的 Fleet 在 Manage 之前就先以序號（QR，F-36）建立 TB device，裝置第一次連上就已經是 adopted 狀態；「未 adopt 先出現在 Fleet」改由 Edge 的 transport log 或我們寫的小規則（記錄 CONNACK 拒絕的 CN）補。
3. **adopt**：Odoo 的 Manage 按鈕 → `iot_tb` 以 REST 建 device（名稱 = 序號）、指派到該站的 Edge、寫入 server attributes（站點、功能清單）。這就是 F-33 的「先寫別人看得到的地方、再寫自己的紀錄」。
4. **營運中**：短效憑證與自動續期 **ThingsBoard 沒有**。X.509 憑證是長效的；F-19 的「可輪替」靠 REST 更換 credentials 加裝置端重連，不是心跳續期。P0 的「短效憑證在心跳時續期」在 P4 不存在。
5. **revoke**：Odoo Remove from Management → REST 刪除 credentials（或整個 device）。裝置下一次 CONNECT 收到拒絕，從協定層可以分辨「被拒」與「連不上」（F-27 的 rejected / unknown 兩分法成立）；**但沒有簽過名的 revoke 訊息**（T3 的「破壞性動作需正向簽章訊號」不成立，與 P0 現況相同）。

### 3.4 誰終結 TLS、誰是唯一的憑證發行者

- **裝置 ↔ Edge**：Edge 的 MQTT transport 終結 TLS，驗 client cert（server 端 `MQTT_SSL_*`、`skip_validity_check_for_client_cert` 預設 false，thingsboard.yml raw；**Edge 的 MQTT transport 是否支援 X.509 chain provisioning 未查證**，Edge 的 yml 有 ssl 區段但我沒讀到 provisioning 相關鍵）。
- **Edge ↔ server**：server 終結 gRPC TLS；Edge 的身分是 `CLOUD_ROUTING_KEY` 與 `CLOUD_ROUTING_SECRET`（`buy-options.md` T7；tb-edge.yml raw），**不是 client cert**。N-02 的「mutually authenticated」在這一跳是「server 以憑證、Edge 以共享密鑰」，比 P0 的每跳 mTLS 弱一級。在 (c) 形狀這反而是優點：`transport-through-networks.md` §1 第 2 點說 TLS 檢查 proxy 會讓 client cert 失效，而 routing secret 是應用層身分，天然不受影響。
- **Odoo ↔ server**：JWT（service user）。
- **唯一的發行者**：ThingsBoard server 是裝置憑證與 Edge routing secret 的唯一發行者；factory CA 只簽 bootstrap 憑證、不簽營運身分。SC §2.2 的「一個發行者」成立，但那個發行者是外部元件而不是 ERP 旁的 bridge 0。每環境一個 tenant 加一張 factory CA（N-04）；staging 從 prod 還原時 tenant 的 routing secret 與裝置憑證仍然有效，**要在 runbook 裡 rotate**，ThingsBoard 不會自動中和。

## 4. 命令與回報語意

### 4.1 desired/actual 與 job 落在哪裡

- **state intent（register）** = ThingsBoard **shared attributes**。Odoo 寫 `{playlist_version: V, playlist_url: ...}`；裝置連上時用 `v1/devices/me/attributes/request` 拉整份、在線時從 `v1/devices/me/attributes` 收更新（topic 事實見 §3.2）。ThingsBoard 不給 version 號（shared attribute 只有 `lastUpdateTs`），所以 **version 由 Odoo 放進 payload、單一遞增**，與 `mqtt-semantics.md` §3.1 對 retained 的結論相同。actual = **client attributes** `applied_playlist_version`（F-38、B-14 修掉），`done = client.applied_playlist_version == shared.playlist_version` 在 Odoo 端比對。
- **job（SQ/CQ）** = **persistent RPC**（`persistent: true`、`expirationTime`、可選 `retries`）。狀態機與欄位見 §1 理由 1。裝置回 `v1/devices/me/rpc/response/<id>`，server 把 response 存進 RPC 實體，Odoo 以 REST 讀。
- **去重**：RPC 有 server 給的 `id`，重連後 `SENT`/`TIMEOUT` 可能重送（RpcStatus 註解：「TIMEOUT is an in-flight peer of SENT (delivery ack timed out, retrying)」）；**裝置端依 RPC id 去重與保留最近結果是我們 custom connector 的 code**，ThingsBoard 不替裝置做。
- **single-flight 與順序**：Odoo 端（F-51 原文的要求），`iot_tb` 每裝置同時只有一個未終結的 RPC。
- **業務事件往 Odoo**：不用 webhook（避免 C-03/C-05 在 TB → Odoo 這一跳重現），由 integration hub 以既有的 polling 連線（C-23）輪詢 REST：RPC status、alarm、device activity 變化、`applied_*` attributes。每筆事件在 Odoo 持久化（F-67），只有管理與業務事件進來（F-30）。

### 4.2 每個事實的 owner

| 事實 | owner | 住哪 | 誰能寫 |
|---|---|---|---|
| binding、客戶、站點、功能清單 | Odoo | Odoo PG | Odoo（F-33）；鏡像到 TB server attributes |
| desired（playlist version、profile、show） | Odoo | Odoo PG；鏡像為 TB shared attributes | Odoo 經 `iot_tb` |
| job 請求、狀態、結果 | ThingsBoard server | TB PG `rpc` 表 | server（狀態）、裝置（response） |
| actual（applied version、capabilities、sensor status） | 裝置 | TB client attributes / latest telemetry；裝置本地 SQLite 留最近結果 | 裝置（經 gateway） |
| 量測 | 裝置 | TB PG `ts_kv`（Edge 本地 PG 亦存一份） | 裝置（經 gateway、Edge） |
| 裝置登錄、憑證 | ThingsBoard server | TB PG | `iot_tb`（REST）；**第二個真相來源** |
| online/offline | ThingsBoard server | TB `active` attribute | server 依**接收時間**判斷（F-27 部分，見 §4.4） |

### 4.3 retention window 明寫

| window | 預設 | P4 設定 | 來源 |
|---|---|---|---|
| persistent RPC 存活 | 每筆請求 `expirationTime`；SQL 清理每 7,200,000 ms 檢查一次 | 每類 job 明寫（playlist apply 24 h、LED effect 10 min）；過期即 `EXPIRED` = F-50 的 `timeout` | thingsboard.yml raw（`sql.ttl.rpc`）；Rpc.java |
| telemetry | `TS_KV_TTL` 0（永久）；`ts_kv` 以 **月** 分區 | tenant profile `maxDPStorageDays` 1095；分區由 TB 管理 | thingsboard.yml raw（`ts_key_value_partitioning: MONTHS`、`ts_key_value_ttl`） |
| server → Edge 事件 | `SQL_TTL_EDGE_EVENTS_TTL` 2,628,000 s（一個月） | 維持；Edge 離線超過一個月，期間的 desired 更新會丟，但 shared attributes 的**當前值**在 Edge 重連時整份同步（這是意見，依 Edge 的 attributes 同步語意推論，未查證） | thingsboard.yml raw |
| Edge → server 事件（離線緩衝） | Edge 本地 PG `cloud_events`；TTL 鍵存在，值未讀 | **未查證**，PoC 項目 | tb-edge.yml raw（`sql.cloud_events` 區段） |
| IoT Gateway 本地緩衝 | `storage.type: memory`、`max_records_count` 100,000、`messages_ttl_in_days` 7；另有 file、sqlite | 改 sqlite，TTL 7 天，記錄滿額丟棄計數 | https://raw.githubusercontent.com/thingsboard/thingsboard-gateway/master/thingsboard_gateway/config/tb_gateway.json 、…/gateway/tb_gateway_service.py（三種 storage 類別），2026-10-10 |
| device inactivity | `DEFAULT_INACTIVITY_TIMEOUT` 600 s、檢查每 60 s | 300 s（N-15 的 offline 5 min） | thingsboard.yml raw |
| 裝置端最近 RPC 結果 | 無（我們的） | custom connector 的 SQLite 留 7 天 | 自建 |
| WebSocket 訂閱佇列（HMI、Odoo UI） | 每 session 1,000 則 | 維持 | thingsboard.yml raw |

### 4.4 F-46～F-54 逐條

| ID | 判定 | 一句理由 |
|---|---|---|
| F-46 | **部分** | desired、job、結果都有耐久 owner 且可重讀（shared attributes、RPC 實體）；但裝置端「保留最近結果 by key」與重連後整份重取仍是我們的 connector；RPC 過期即消失，window 要明寫 |
| F-47 | **成立** | shared attribute = state intent，persistent RPC = job；version 放 payload 由 Odoo 遞增 |
| F-48 | **部分** | 裝置只收自己的 RPC 與 attributes（topic 面事實）；誰可下命令 = 持有 tenant JWT 者，細粒度 RBAC 是否在 4.4 的免費功能內未查證；Edge ↔ server 用共享密鑰非 cert；無端到端簽章 |
| F-49 | **成立** | RPC status 與 response 以 REST 可讀，`iot_tb` 輪詢寫入 Odoo |
| F-50 | **成立** | `DELIVERED` 後無回應 → `TIMEOUT`；未送達逾期 → `EXPIRED`；兩者對應 F-50 的 unknown / timeout，而非「not run」 |
| F-51 | **部分** | 順序由 Odoo single-flight（自建）；去重由 connector 依 RPC id（自建）；ThingsBoard 不提供也不妨礙 |
| F-52 | **成立** | `DELIVERED` 與 `SUCCESSFUL` 是兩個狀態，長工作在裝置端非同步回應 |
| F-53 | **部分** | 裝置 response 可帶 error 結構，狀態為 `FAILED`；但 gateway 是否把 connector 例外轉成 `FAILED` 而非沉默，要在 custom connector 內自己保證（B-06 的教訓） |
| F-54 | **部分** | 裝置每次連上重取 shared attributes，天然要求冪等；拒絕/延後需在 client attributes 自訂欄位回報 |

### 4.5 備案（FIWARE 升版）在這一節的位置

依 `buy-options.md` §3.3：C-01 部分緩解（4.7.0 的 `TextUnrestricted`）、C-05～C-10 留著、C-02～C-04 與 C-11～C-13 未查證、C-14 是我們 compose 的事、C-15 隨 QuantumLeap 死去而消失。也就是說 F-46/F-47 在備案裡**仍然全靠 Odoo 自己做**（`<cmd>_info` 是 last-writer-wins、沒有重送），和 P0 要寫的量相同但多了一層會吞錯誤的中介。備案的價值只有一件：它今天就在跑。

## 5. 回傳資料

**路徑**：function backend → custom connector（本地協定）→ IoT Gateway（converter、本地緩衝）→ MQTT/TLS 8883 → Edge（本地 PG、本地規則、本地儀表板）→ gRPC/TLS → ThingsBoard server → rule chain（F-31 filter、alarm rules）→ `Save Timeseries` → PostgreSQL `ts_kv`（月分區）。IoT Gateway 預設 QoS 1、`minPackSendDelayMS` 50、`maxPayloadSizeBytes` 8196（tb_gateway.json raw）。F-02 成立：telemetry payload 可帶裝置端 `ts`（這是 ThingsBoard device API 的一般知識，原頁未開，標未查證）。

**store 是什麼**：ThingsBoard 的 `ts_kv` 是 key-value 窄表（`entity_id, key, ts, bool_v/long_v/dbl_v/str_v/json_v`），與 `postgres-timeseries.md` §3.1 的窄表估算同一量級；type 變更不會破壞 insert（F-11 成立，不同型別落不同欄）；entity id 是 UUID，改名不斷史（F-14 成立）。退場時 `ts_kv → 自家窄表` 是一條 SQL。壓縮沒有（與 P0 相同）；`DATABASE_TS_TYPE` 有 `timescale` 選項但那會把 TSL 帶回來（M-05），P4 不選。

**第 N 個消費者**：
- **MES**：REST（JWT）拉 latest 或區間；或 rule chain 的外部節點推送（REST call、Kafka、MQTT 節點），4.4 把原 PE 的 integrations 併入同一 repo（`buy-options.md` T5，搜尋摘要）。D-01 的「MES live board」是 Edge 或 server 上的 public dashboard，一個 URL。
- **現場 HMI（D-06）**：**Edge 的本地儀表板與 WebSocket 訂閱**，延遲是 LAN 等級、不經雲端；這是 P0 沒有答案的那一題，P4 的答案是「web 儀表板」而非 MQTT。若 HMI 是 Ignition 這類只吃 MQTT/Sparkplug 的工具，P4 要再加一個 broker 讓 Edge 的 rule chain 往外 publish，這是額外一種（§8）。
- **Grafana**：移出清單；ops 若堅持要它，給 PG 唯讀角色直接讀 `ts_kv`，不經 ThingsBoard。
- 共同點：第 N 個消費者**不動裝置、不動 Edge**，這是 `02-tradeoffs.md` §1 末段「bridge 0 要長出 consumer 概念」的現成解。

**F-01～F-15 哪些不成立或部分**：
- **F-01 部分**：IoT Gateway 不做 min/mean/max；1 Hz 以上的本地聚合要在我們的 backend 或 converter 做（D-02 的 30 秒平均今天就是 感測服務 做的，所以實務上成立）。
- **F-04 部分**：儀表板 widget 預設顯示 last value，stale 不會自己變灰，要靠 widget 設定與 `active` 旗標；不是結構上保證。
- **F-07 不成立（對 gateway 內的 connector）**：IoT Gateway 把每個 connector 跑成同一 process 的 `Thread`（事實：tb_gateway_service.py raw 第 1106 行附近 `Thread(target=self._run_connector…)`，2026-10-10）。一個 connector 崩潰未必帶倒整個 gateway，但一個卡死的 Modbus 輪詢會吃掉 GIL 與 RPC 處理。P4 的緩解：感測與 Modbus 由我們的獨立 backend process 做、connector 只做轉譯；但那就放棄了「Modbus 是設定檔」這個理由 3 的一半。誠實地說，D-03 在 P4 有兩條路，要在 PoC 選。
- **F-09 部分**：retention 有（TTL、月分區）；roll-up 沒有現成的「寫回儲存」機制，README 的 calculated fields 是否能持久化聚合未查證；最壞情況與 P0 一樣是自己的 SQL。
- **F-13 成立但有 C-17 風險**：dashboards、rule chains、device profiles 皆可 JSON 匯出匯入，放進 tb-config repo；重新佈建會覆蓋手改，與 C-17 完全同型。
- **F-15 字面上不成立**：ThingsBoard server 本身就是歷史儲存，最小部署不可能「沒有 history store」；但 N-13 真正的訴求是「小」，見 §8。
- 其餘 F-02、F-03、F-05、F-06、F-08、F-10、F-11、F-12、F-14 成立，F-10 的告警（device profile alarm rules）與門檻線是 P4 相對 P0 的淨增益。

## 6. D-01～D-06 逐一走過

**D-01 螢幕**。desired = shared attributes `{playlist_version, playlist_url}`；文件仍由裝置以 per-screen token 直接向 Odoo 拉（F-56、F-59、F-72），這一點 P0 與 P4 相同，C-24 的防火牆規則在 (b)(c) 形狀仍然存在，P4 沒有解它。display custom connector 收 shared attribute 變更後觸發 reconcile（F-57），回報 `applied_playlist_version`（F-38）。Apply 當 persistent RPC 時 `DELIVERED ≠ SUCCESSFUL`，B-02、B-03、B-07 結構上消失。最小部署三個服務（Odoo、ThingsBoard、PostgreSQL），比 P0 多一個，而且那一個是 JVM。

**D-02 環境感測**。感測服務 保留為獨立 process（F-07），30 秒平均在 感測服務 做（F-01），custom connector 把結果以 gateway telemetry 上送並帶 `ts`。HCHO 80 ppb 門檻是 device profile 的 alarm rule，alarm 經輪詢進 Odoo 成業務事件（F-03、F-10 的 wish 變成成立）。warm-up 狀態是 client attribute（F-05）。這是 P4 最漂亮的一個 D。

**D-03 Modbus 旁路感測**。兩條路：(i) IoT Gateway 的 Modbus connector，register 位址、function code、divider、poll period 全是設定檔（事實見 §1 理由 3），min/mean/max 沒有，RTU 經 serial 支援與否未查證；(ii) 我們的 Modbus backend 獨立 process，connector 只轉譯。(i) 是買的全部價值但踩 F-07 與 F-01；(ii) 是 P0 的做法。意見：先走 (i) 做 PoC，量它在 CM4 上的穩定度，壞了再退 (ii)。

**D-04 LED**。profile/show 是 shared attributes（state intent），effect 是 persistent RPC（job）；`supported_effects` 以 client attribute 回報，Odoo 讀回後做驗證（F-06，B-09 修掉）。LED 控制器 的 standalone playlist（F-45）不受影響。四個 LED 命令全部有 RPC status（B-05 消失）。

**D-05 門禁（管理面）**。身分、存活、設定走 ThingsBoard：T3 的硬體金鑰可對應 X.509 chain provisioning，但 attestation、簽章 config、簽過名的 revoke 都沒有（§3.3 第 5 點）。控制通道不在本次範圍，與 P0 相同。刷卡事件是訊息不是 register，ThingsBoard 的 telemetry 加 rule chain 比 P0 的 register 自然，但 D-05 的客戶 IT 會問「平台有什麼認證」，P4 可以回答「ThingsBoard, Inc.」而 P0 只能回答「我們」，這是 P4 在 R2 的真實加分；代價是我們對那個答案沒有控制權。

**D-06 機台遙測**。PLC → 邊緣控制器 → IoT Gateway（OPC-UA 或 S7 connector，皆在 README 清單）→ Edge。三層介面：**現場 HMI** = Edge 本地儀表板與 WebSocket，LAN 延遲、雲斷不斷；**業務** = Odoo 經輪詢；**分析** = 儀表板或 PG 唯讀。若合作夥伴的 HMI 要 Sparkplug B，`mqtt-semantics.md` §3.5 說它只適合資料面，P4 需加 Mosquitto 或 TBMQ（Apache-2.0，Docker Hub 2.4.1 = 2026-10-08，https://hub.docker.com/v2/repositories/thingsboard/tbmq/tags ，2026-10-10；Java）當 Edge 旁的 broker，這是 M-02 的淨增加，只在需要時付。

## 7. 妥協清單

| 需求 ID | 妥協內容 | 換到什麼 | 代價 |
|---|---|---|---|
| M-05 | north 的 ThingsBoard server 是 BSL；(c) 形狀由我們持有授權；(a)(b) 形狀需法務判讀「代管」是否成立，否則凍結 4.3.1.x Apache-2.0 | 整個登錄、RPC 狀態機、儀表板、告警、15 種 connector | 一份要談的合約；(a)(b) 的客戶可能被綁；凍結舊線則時鐘交給廠商的 patch 意願（4.3.1.6 與 4.4 同日發，今天還活著，期限未查證） |
| F-33 / §1-1 | 裝置登錄住在 ThingsBoard，Odoo 只做 binding 的雙寫 | 不用自己寫 registry、憑證型別、provisioning | 第二個真相來源；Manage 失敗要能回滾兩邊 |
| M-02 | +JVM、+Java（讀）、+TBEL、Edge 算第二引擎 | 上述全部 | 種類 13 → 16（17 含 Mosquitto） |
| N-13 / F-15 | 最小部署三個服務，且含 JVM 與一個永遠在的 history store | 一片螢幕就有告警、儀表板、RPC 狀態 | 記憶體與映像大小未查證，CM4 旁的站點主機要夠大 |
| N-02 | Edge ↔ server 以 routing key/secret 認證而非 client cert | 穿過 TLS 檢查 proxy 不會因 client cert 失效 | 密鑰輪替是手動 runbook；比 mTLS 弱一級 |
| F-19 / SM §6 | 沒有短效憑證與心跳續期；撤銷無簽章訊息 | 用現成的 X.509 chain provisioning 與 REST 撤銷 | T3 的「正向簽章訊號」不成立 |
| F-27 | online/offline 由 server 依接收時間判斷，不是裝置報告時間 | 現成的 inactivity 機制與 `active` 旗標 | 時鐘錯的裝置會被誤判；需另以 payload `ts` 做第二層判斷（自建） |
| F-07 | gateway 內 connector 是 thread | Modbus 等 connector 零 code | D-03 要在 PoC 二選一 |
| F-31 | 未宣告屬性靠 rule chain filter 丟棄、未知裝置靠 gateway `deviceFiltering`，而非結構上拒絕 | ThingsBoard 的 schemaless 寫入 | 守門規則是 TBEL，是我們要維護的另一種語言 |
| 03-brief §2「ERP 當 root」 | ERP 改成 UI 疊在管理服務上 | 被允許的妥協 | 兩套權限模型（Odoo 使用者、TB tenant） |
| F-46 | RPC 過期即消失 | 有明寫的 `expirationTime` | retention window 落在 TB 的 TTL 清理節奏（每 2 小時） |

## 8. 已知弱點

1. **授權是結構性的，不是可修的。** BSL 的 Device 定義（§1 弱點 1）讓我們的規模必然超額；Edge 4.4 是否跟著改 BSL 未查證（`buy-options.md` T6）；若 Edge 也變 BSL，站點側的「Apache-2.0 全部乾淨」就不成立，P4 的理由 2 塌掉一半。這會在**第一個 (a)/(b) 形狀的客戶簽約那一步**壞掉。
2. **(c) 形狀的 gRPC 穿越沒有事實支撐。** HTTP proxy 選項存在、10 秒 keepalive 存在，但 TLS 檢查 proxy 對 HTTP/2 的行為沒有任何一手來源。壞掉的那一步：第一個有 Zscaler/FortiGate deep inspection 的客戶，Edge 連不上，而 P4 沒有 HTTPS long-poll 退路。
3. **單一廠商、單一時鐘。** 三條線同日修補是今天的事實；Google Cloud IoT Core（`buy-options.md` C1）與 Puppet PXP 封存（`precedents.md` e21）是先例。ThingsBoard 的 BSL 把 Change Date 設在四年後轉 Apache，這是一個對沖，但也代表我們用的是四年前的免費版或現在的付費版。master 已在 Java 25（pom raw），JVM 大版每年追一次是強制的。
4. **Docker Hub 映像命名已變**（`tb-postgres` 停在 4.2.1.1、新版在 `tb-node`），升級路徑（N-10）第一步就要先搞清楚哪個映像是哪個，與 Orion 缺 tag 同型。
5. **第二個真相來源的具體破口**：Odoo Manage 寫 TB 成功、寫自己失敗（或反過來）。F-33 的「先寫別人看得到的地方」規定了順序，但補償邏輯是我們的。C-08 的影子版本：**RPC 在裝置被刪除後是否仍排隊** — RpcStatus 有 `DELETED` 狀態且註解寫 device 刪除時推送 delete 通知，所以大概不會重現，但未實測。
6. **C-xx / B-xx 會重現的**：
   - **C-17**（重新佈建覆蓋手改）：**會**，在 tb-config repo 以 REST 佈建 dashboards/rule chains 的那一步；對策與今天相同，禁止手改。
   - **C-05 / C-03**（通知不重送、失敗不寫）：若用 rule chain 的 REST call 節點推 Odoo **會**在 TB → Odoo 那一跳重現；P4 用輪詢避開，但輪詢週期就成了 Odoo 看到結果的延遲（integration hub 的 C-23 現況）。
   - **C-12**（命令推到註冊時的 IP）：不會，裝置是撥出的持久連線。
   - **C-09**（無驗證、tenant 是 header）：不會，但換成「JWT service user 的權限範圍」要設對。
   - **C-11 / C-15**（屬性集合固定、第一個型別永久）：不會，`ts_kv` 分型別欄位。
   - **B-10**（綁 0.0.0.0 無驗證）：IoT Gateway 的 REST connector 若啟用會開 port；P4 不啟用，custom connector 只走 localhost。**B-11**（忽略心跳回應、不知道被拒）：IoT Gateway 對 CONNACK 拒絕的行為未查證，**可能重現**。**B-08**（無 idempotency key）：RPC id 解掉一半，裝置端去重仍是我們寫。
   - **B-01、B-02、B-03、B-05、B-06、B-07、B-14**：結構上消失（§6）。
7. **F-07 的 thread 模型**（§5）與 **TBEL 是第四種語言**（§2）。
8. **足跡全部未查證**：ThingsBoard server 與 Edge 的最小記憶體、IoT Gateway 在 CM4 的 RSS、Edge 的 PG 大小。`buy-options.md` §4 第 4 點也標了同一缺口。一片螢幕的站點主機能不能跑 JVM 兩次（若 (b) 形狀把 Edge 與 server 放同一台）是 PoC 第一題。
9. **備案 FIWARE 的弱點**：AGPL-3.0（法務未判讀）、C-02～C-10 留著、Wilma/Keyrock dormant 所以驗證仍要自己做 proxy、IoT Agent push 到 IP（C-12）在 (c) 形狀直接不成立；它只在 (a)(b) 可用，且錨點 9「已踩過的坑不能再踩」會被多條違反。

## 9. 成本與可逆性

**到第一個客戶價值**（三片螢幕、六個感測器、一個同站 ERP；形狀 (a) 或 (b)），人週估計（意見，假設團隊已熟 Odoo 與 Python、不熟 ThingsBoard）：

| 項目 | 人週 | 假設 |
|---|---|---|
| ThingsBoard server + PG + Edge 部署、TLS、tenant/device profile、硬化 | 2 | 映像命名問題一天內解；JVM 足跡可接受 |
| IoT Gateway 上 CM4、display 與 LED custom connector、本地 SQLite 去重 | 3 | Anthias 的 reconcile 介面沿用 |
| `iot_tb`（binding 雙寫、shared attributes、persistent RPC、輪詢 status/alarm/activity、Fleet 畫面） | 4 | integration hub 的 polling 骨架可重用 |
| rule chains（F-31 filter、alarm、活動事件）、dashboards 當 code | 1.5 | TBEL 學習曲線一週內 |
| factory CA、X.509 chain provisioning、adopt/revoke 流程、staging 中和 runbook | 1.5 | 不做短效憑證 |
| e2e：(a)(b) 兩種形狀、斷線/重啟 soak、ACL 拒絕測試 | 2 | N-17 的 CI 骨架沿用 |
| 授權談判與法務（(a)(b) 的代管判讀） | 0.5 工時，日曆時間不可控 | — |
| **合計** | **約 14.5 人週** | 不含 (c) 形狀的 gRPC 穿越 PoC（+1）與 D-03 二選一 PoC（+1） |

與 P0 比較（意見）：P0 要寫 node 的四個動詞、long-poll、CA 發行、registry、writer、排程，我粗估在 20～25 人週以上；P4 省下的主要是 registry、RPC 狀態機、儀表板與告警，約四到五成。這就是 §1 對 M-06 的回答的數字版。

**備案 FIWARE 升版**到同一個第一價值：升版 Orion 4.7.0 / IoTA 3.14.0 / Mongo 8.0（含 `IOTA_MONGO_*` 破壞性變更與 Docker Hub 缺 tag 確認，`buy-options.md` F3、F7）約 1.5 人週，自寫 writer 取代 QuantumLeap 約 2 人週，驗證 proxy 約 1 人週，修 B-01～B-14 中結構上不會自己消失的七條約 3 人週：**約 7.5 人週**，是最便宜的，但 C-02～C-10 原封不動。

**三年後想換掉其中一塊要付多少**（意見）：

| 要換的 | 代價 | 理由 |
|---|---|---|
| ThingsBoard server（整個 north） | 約 10～13 人週 | 歷史 `ts_kv → 窄表` 一條 SQL（1）；登錄與 attributes 經 REST 匯出（1）；rule chains 與 dashboards **全部重寫**（4，TBEL 無處可去）；`iot_tb` 改寫成對新目標（4）；PKI 流程重做（1～2）。約等於初次建置，與 P0 自建被換掉的成本同量級 |
| IoT Gateway（換成自己的 agent） | 約 3 人週 | custom connector 的 reconcile 邏輯可搬；協定面要重寫 |
| Edge | 不可單獨換 | Edge 與 server 是同一協定，換 server 就一起走 |
| Mosquitto（若有） | 約 0.5 人週 | 只是 T1 ingress，換任何 EPL/MIT broker 即可 |
| Odoo 側 | 不受影響 | 業務真相一直在 Odoo，這是 P4 保住的最重要的一件事 |

**一句收尾**：P4 買到的不是「不用寫」，是「寫的那些東西都不是安全邊界與狀態機」；它付出的不是維護者時鐘（這個時鐘比 FIWARE 清楚得多），而是一份會跟著客戶走的授權與一個不能拆的第二真相。若 owner 把 M-05 放在 M-06 前面，P4 在 (a)(b) 形狀不成立；若 (c) 形狀是主要商業模式，P4 是六個提案裡唯一今天就有三段式現成產品的那一個。
