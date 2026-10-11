# 我們的架構對照常見架構：優劣勢比較

> 2026-10-11，主審。依 `10-facts/`（2026-10-10 查證）、六份提案、批評與 `final.md` 寫成。「我們的架構」指 `final.md` 的最終方案：ERP 持業務真相、HTTPS 管理樹、owner 持有事實、端到端簽章、獨立安全 journal、MQTT 只在站內南邊、獨立 PostgreSQL、register 式更新。標「未查證」者沒有事實支撐。

## 1. 比較軸

比較只對我們的錨點有意義：Odoo ERP 是產品、hostile T1、三種部署形狀（同主機 / 同站 VLAN / 站點只出 443）、幾百個感測器與幾十片螢幕、插電 Linux 盒子、小團隊、授權不綰客戶、十年維護。八個軸：

| 軸 | 問什麼 |
|---|---|
| A 圍堵 | hostile T1 與租戶鄰居能不能被結構性隔離 |
| B 形狀 | (a)(b)(c) 是否都自然，特別是 (c) 的 TLS 檢查 proxy |
| C 正確性 | owner 持有事實、UNKNOWN、不重跑這套語意誰給 |
| D 十年 | 授權、維護者時鐘、runtime 種類、升級路徑 |
| E 生態 | T1 設備、第三方工具、SCADA、人才 |
| F 足跡 | 一屏最小部署的服務數與資源 |
| G ERP 中心 | 業務真相是否只有一份、Odoo 是否仍是產品 |
| H 到第一個客戶 | 第一次交付的成本與速度 |

## 2. 逐一對照

### 2.1 雲端 IoT 平台（AWS IoT Core + Greengrass、Azure IoT Hub + IoT Edge）

模型：裝置以 MQTT 連雲端；device shadow / twin 做 desired / reported；jobs 做一次性命令；fleet provisioning 與託管 PKI；OTA；rules engine；按裝置與訊息計費。

| 它強 | 它弱（對我們） |
|---|---|
| PKI、provisioning、撤銷是現成且經審計的；SOC2 / ISO 回答得了客戶 IT 的問卷 | (a)(b) on-prem 不自然：要靠 Greengrass / IoT Edge 當 gateway，那是另一個 runtime 加雲端帳號依賴 |
| shadow / twin 有版本語意（AWS version、Azure `$version`），jobs 有 staged rollout | 業務真相分裂成兩份：ERP 與 twin；每次 Manage 都是雙寫 |
| 人才與文件最多 | 廠商時鐘：Google Cloud IoT Core 2023-08 停服是現成案例；台灣 region 是否有 IoT Core 未查證 |
| 離線訊息與 server push 是它賣 MQTT 的理由 | Azure twin 裝置端不支援 HTTPS；8883 被企業防火牆擋要走 WSS；hostile T1 仍要自己的 gateway 隔離 |

淨判定：客戶在雲、我們不在意雙真相、每月帳單可接受時最強。對「ERP 是產品、站點 on-prem」最不合。相對我們：A 平手（都靨 gateway）、B 它只贏 (c)、C 它給零件我們給語意、D 它的時鐘是別人的、G 它輸。

### 2.2 開源 IoT 平台（ThingsBoard、Eclipse Hono + Ditto、Kura + Kapua、Magistrala、OpenRemote）

模型：自架平台，內含 registry、telemetry store、rule chain、dashboard、RPC，加 gateway 元件收多協定。

| 它強 | 它弱（對我們） |
|---|---|
| 第一天就有 dashboard、registry、RPC 狀態機（QUEUED → SENT → DELIVERED → SUCCESSFUL / TIMEOUT）；這些是我們要自己寫的 | 授權時鐘：ThingsBoard 4.4 起 BSL 1.1，免費額度 100 devices 加一台 server，第二個 on-prem 站點就撞；OpenRemote AGPL；EMQX BSL |
| ThingsBoard gateway 有十五種 connector，D-03 的 Modbus 設定檔可直接參考 | 第二真相來源：平台 registry 對 ERP binding，F-33 的 binding authority 變雙寫 |
| 社群與文件 | 安全預設：JWT 簽章金鑰有公開預設值、gateway 可被遠端開 shell、gateway 憑證可替整站任何裝置說話 |
| | 平台假設裝置可信，hostile T1 圍堵還是自己做；JVM 或 Erlang 進最小部署；Hono / Ditto 貢獻者集中 |

淨判定：示範最快、十年最貴。與 M-05、M-06 直接衝突。相對我們：H 它大勝、D 與 G 它大輸、A 平手、C 它的 RPC 狀態機比我們今天的 code 好但不處理 UNKNOWN 保鎖。

### 2.3 Broker 中心、Unified Namespace、Sparkplug B

模型：一個中央 broker 是全廠資料匯流排；topic 階層對應廠區結構；Sparkplug 做 birth / death / state；SCADA、MES、歷史庫、HMI 全部訂閱。

| 它強 | 它弱（對我們） |
|---|---|
| 第 N 個消費者接近零成本；SCADA、Ignition、Node-RED、Grafana datasource 原生會講 | 管理面與命令面不是它的範圍：Sparkplug NCMD 是 QoS 0、強制 clean session、沒有 command id |
| retained last value 給晚加入者；D-06 機台遙測與現場 HMI 是它的主場 | broker 站在信任鏈中心且持有所有 ACL；ACL 寫錯就是 C-09 重現；hostile T1 共用 broker 要靴帶隔離 |
| IIoT 生態與人才最大 | 跨站 (c) 要 bridge over 8883 或 WSS，面對同一組 proxy 問題；離線 queue 有上限且靨默丟；owner 持有事實還是要自己在上面做（AWS、Azure 也是） |

淨判定：資料面最強，身分與命令面最弱。我們的最終方案把它限制在站內南邊、不載管理面、不持樹的憑證，正是取其長避其短。相對我們：E 它大勝、C 與 A 它輸、B 它輸 (c)、F 它多一個服務。

### 2.4 FIWARE / NGSI context broker（我們的現況）

模型：Orion 實體模型加 subscription 扇出，IoT Agents 做協定轉譯，QuantumLeap 或 Cygnus 寫歷史。

| 它強 | 它弱（對我們） |
|---|---|
| ETSI 標準，歐盟公部門標案會寫 FIWARE-ready | 已踩過的 C-01 到 C-15：同步 5 秒 forward、PENDING 與 OK 競態、無重送、last-writer-wins、無認證、tenant header 客戶端可設 |
| 通用 entity model 與 subscription 扇出，讓 Grafana、writer、ERP 都能掛上 | 周邊元件死亡：QuantumLeap、Cygnus、Mintaka、STH-Comet；Orion 與 IoT Agent 為 AGPL-3.0；升版解不掉命令語意缺口 |

淨判定：除了歐盟標案場景，對我們是負資產。可保留的是「有第三方 reader 需要 NGSI 時提供唯讀 facade」。

### 2.5 Kubernetes 式與 GitOps 邊緣（k3s 加 Fleet 或 Flux，或純 spec / status 控制器）

模型：desired state 在控制面或 git，agent watch 並 reconcile，status 回報；level-triggered。

| 它強 | 它弱（對我們） |
|---|---|
| 語意上和我們最像：spec / status 等於 desired / actual，controller 等於 class driver，list + watch 就是我們的 fetch | k3s 在一屏的 CM4 上太重；containerd、sqlite 或 etcd 都是額外 runtime |
| 成熟的 reconcile 文化、RBAC、secrets、rollout、人才 | 多叢集 fleet 工具是另一個平台與時鐘；不解 T1 ingress、資料面、裝置 PKI；對 ERP 是 Odoo 的我們是兩套控制面 |

淨判定：借模式不借產品，這正是我們做的。幾千台邊緘主機時才值得整套搬進來。

### 2.6 MDM 與 fleet 管理（Balena、Mender、Apple MDM 模式）

模型：agent 輪詢或長連控制面取 target state；OTA、rollback、容器部署是核心；身分與 provisioning 成熟；不管資料面。

| 它強 | 它弱（對我們） |
|---|---|
| OTA、A/B、rollback 成熟，正是我們最大的空白；Mender client Apache-2.0 | 不做資料面與命令結果語意，jobs 很簡單；與 ERP 的業務 desired 無關 |
| outbound-only 天生；Apple MDM 的 CommandUUID 語意與 F-46 幾乎同構 | Balena 是 SaaS，openBalena 自架維護狀態未查證；Mender server 開源與企業版有差；多一個 runtime、server、時鐘 |

淨判定：互補不是替代。最終版選自建 register 式更新是為了 M-02；若 OTA 的 PoC 失敗，Mender 是第一備案。

### 2.7 OPC UA 中心（server / client 與 PubSub）

模型：標準資訊模型、安全內建、PLC 廠商原生支援；PubSub 可跑在 MQTT 或 UDP 上。

| 它強 | 它弱（對我們） |
|---|---|
| 製造業標準，PLC 直接講，D-06 與 D-03 天然；稽核與標案認可 | 重：stack 與憑證管理複雜；open62541 等 stack 的時鐘與 PubSub 工具鏈成熟度未查證 |
| 安全模型內建 | 不解螢幕、LED、ERP 命令面；對 T2 自家裝置是殺雞用牛刀 |

淨判定：D-06 進來時當「南向協定之一」接進 validator，不當架構中心。

### 2.8 現代訊息 fabric（NATS leaf node、Zenoh）

模型：路由樹與葉節點、subject ACL、JetStream KV 與 stream、內建 MQTT 橋。

| 它強 | 它弱（對我們） |
|---|---|
| 形狀同構：leaf 主動 outbound、account 隔離、單一 binary、Apache-2.0 | NATS 內建 MQTT 只到 3.1.1，維護者拒收 MQTT 5；2026 年 advisory 落在 MQTT、leafnode、subscribe deny filter |
| KV 與 stream 是現成零件 | JetStream 語意要自己吃透；bridge 上的 server 沒有升級通道；Zenoh 時鐘快且無 LTS；單公司 bus factor；台灣人才少 |

淨判定：審查判定不當基底，是日後 trunk binding 的候選。

### 2.9 裝置直連 ERP（今天的 signage 設計）

模型：螢幕以 token 直接向 Odoo 拉內容與命令，沒有中間層。

| 它強 | 它弱（對我們） |
|---|---|
| 最小、已 proven、第一個客戶最快 | Odoo web stack 暴露給 device VLAN，逼出 C-24 的防火牆規則；無 hostile T1 圍堵；無身分生命週期；Odoo worker 不適合長連 |

淨判定：只適合一屏可信 LAN。我們把它變成「unit 直連 bridge 0」保住最小部署，同時把 Odoo 從裝置可達面拿掉。

### 2.10 Overlay 網路當圍堵（WireGuard、Tailscale、Headscale、Nebula、ZeroTier）

模型：把「誰看得到誰」交給 overlay 的 ACL，應用層保持簡單。

| 它強 | 它弱（對我們） |
|---|---|
| child 只看得到 parent 可用 AllowedIPs 表達；NAT 穿越；成熟加密 | WireGuard 只有 UDP，在只放 443 的網路死；Headscale pre-1.0 單 tailnet；Nebula relay 標 experimental；ZeroTier 商用要付費 |
| | 最需要圍堵的 T1 是封閉韌體，裝不了 overlay client；應用層身分還是要有 |

淨判定：對 T2 之間的管理網是可選加固，不能替代樹與簽章。

## 3. 總表與誠實的結論

| 架構 | A 圍堵 | B 形狀 | C 正確性 | D 十年 | E 生態 | F 足跡 | G ERP 中心 | H 首客成本 |
|---|---|---|---|---|---|---|---|---|
| 我們的最終方案 | 強 | 強 | 強（自己寫） | 強（時鐘自控）但 bus factor 弱 | **弱** | 中（一屏仍要六加四個角色） | 強 | **弱** |
| 雲端 IoT 平台 | 中 | 只強在 (c) | 中（零件） | 中（別人的時鐘） | 強 | 弱（gateway runtime） | 弱 | 中 |
| 開源 IoT 平台 | 弱 | 中 | 中 | **弱**（BSL、AGPL、JVM） | 強 | 弱 | 弱 | **強** |
| Broker 中心 / UNS | 弱 | 弱在 (c) | 弱 | 中 | **強** | 中 | 中 | 中 |
| FIWARE | 弱 | 中 | **弱** | 弱 | 中（標案） | 弱 | 中 | 已付過 |
| Kubernetes 式 | 中 | 中 | 強（模式） | 中 | 強 | **弱** | 弱 | 弱 |
| MDM / fleet | 中 | 強 | 中（OTA 強、命令弱） | 中 | 中 | 中 | 不相關 | 中 |
| OPC UA | 中 | 中 | 中 | 中 | 強（製造） | 弱 | 不相關 | 弱 |
| NATS / Zenoh | 中 | 強 | 中（零件） | 弱 | 弱 | 中 | 中 | 中 |
| 直連 ERP | **弱** | 弱 | 弱 | 中 | 弱 | **強** | 強 | **強** |
| Overlay 圍堵 | 只對 T2 | 弱在 443-only | 不相關 | 中 | 弱 | 中 | 不相關 | 中 |

**我們真正贏在哪**：錨點擬合。沒有另一個架構同時滿足「ERP 是唯一業務真相、hostile T1 被結構性圍堵、三種形狀含只出 443、授權不綰客戶、控制面時鐘自控」。另外，UNKNOWN 保鎖、不自動重跑、owner 持有事實這套正確性語意，沒有任何平台現成給；AWS、Azure、ThingsBoard 都是在傳輸之上由服務端做，我們只是把那一層寫成自己的。

**我們真正輸在哪**：所有平台免費給的東西都要自己付。PKI 與 provisioning 服務、OTA 框架、dashboard 與 rules engine、第三方工具「訂了就能看」、認證與問卷、人才與詞彙。協定只有一個實作者，安全審查預算是我們的，bus factor 是我們的。到第一個客戶的成本比 ThingsBoard 的 demo 高得多。最終版為了補這些洞加進的安全 journal、雙人復原、archive gate、每個 retention window 的監控，是小團隊真的要營運的流程，不是文件寫完就有。

**哪些情境下該改選別人**：

| 如果 | 應該選 |
|---|---|
| 客戶全在雲端、沒有 on-prem、接受雙真相與月費 | 雲端 IoT 平台 |
| 主要賣機台遙測與 SCADA 整合、ERP 只是旁路消費者 | Broker 中心 / UNS 加 Sparkplug |
| 歐盟公部門標案是主要市場 | 保留 FIWARE 當對外 facade |
| 幾千台邊緣主機、需要容器化 workload | Kubernetes 式 |
| OTA 的自建 PoC 失敗 | 加 Mender |
| 第一個客戶就一屏、可信 LAN、兩年內不會有第二個 | 直連 ERP 就夠 |

我們的方案其實不奇怪：它是 MDM 與 kubelet 的管理模式，加站內南邊的 broker 當資料面，加自己的 PKI 與 Postgres。奇怪的只是 IoT 業界習慣從 broker 開始想，而我們從 ERP 開始想。
