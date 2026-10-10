結論先講：致命 0 條、重大 7 條、次要 2 條。P3 的 outbound leaf 與本地資料扇出值得保留；目前不能交付的是數條未閉合的產品流程，不是已證明 NATS 不適用。重大項是文件內的契約缺口；proxy 相容性、延遲與資源數字另列待測，不冒充架構失敗。

日期：2026-10-11。角色：P3 scenarios critic，依 wave-b-proposal 與 RESUME A.1。模型請求 strongest/high；host 沿用 default，effort 不可設定，未驗證 runtime 模型。只讀指定材料，補讀 NATS 事實；無新網路查證。以下第三方引文均沿用 2026-10-10 的查證日期與證據等級。

## 1. 判斷邊界

不繼承 interim 的淘汰結論，也不重計既有 ACL、PKI、OTA、備份或 M-02 finding。以下以既有安全缺口修正後，正常使用者仍會卡住的步驟為準；修正人週皆為粗估，不能相加當報價。

正常操作者與已授權裝置就能觸發這些缺口，不需要假設攻擊。單台主機停機、網路中斷與資料來源不存在是不同故障，待測表分開注入，避免把「已連線」當成整個產品可用。若作者能指出既有的文件就緒條件、設定回報或事件重讀契約，就應撤回對應 finding；不要求一定採用本文修法。重大不等於不可修，修復後仍應以螢幕、告警與業務結果驗收。

| 材料 | 本文採用的證據與限制 |
|---|---|
| [P3 §3.1](../../20-proposals/P3-nats-leaf.md#L58)、[P3 §4.1](../../20-proposals/P3-nats-leaf.md#L153)、[P3 §6](../../20-proposals/P3-nats-leaf.md#L196) | 部署、stream、產品流程的文字契約，不是已運行的實作 |
| [security.md](security.md)、[longevity.md](longevity.md) | 本文不再計入 security-01～11、longevity-01～11；相依問題並不因此解除 |
| [NATS N1](../../10-facts/nats.md#L21)、[NATS N6](../../10-facts/nats.md#L26) | 官方文件來源：outbound leaf、獨立 JetStream domain 與 mirror/source；支持局部離線，不證明整個產品已完成 |
| [NATS N7](../../10-facts/nats.md#L27)、[NATS N10](../../10-facts/nats.md#L30) | Object Store 是 chunked storage；MQTT listener 依賴 JetStream。不能推成跨 bucket 的業務提交或現成 HMI |
| [transport T1](../../10-facts/transport-through-networks.md#L34)、[transport T3](../../10-facts/transport-through-networks.md#L36) | 廠商 TLS inspection 行為只有摘要；不可擴張成所有客戶一律禁止 WSS |
| [transport T7](../../10-facts/transport-through-networks.md#L45)、[transport T16](../../10-facts/transport-through-networks.md#L59)、[NATS N4](../../10-facts/nats.md#L24) | nginx Upgrade 與 idle、NATS ping/WS 有文件；特定 CONNECT proxy 的完整行為未查證 |
| [precedents e15](../../10-facts/precedents.md#L42)、[precedents e17](../../10-facts/precedents.md#L44) | Apple MDM 結果重送、Kubernetes list/watch 是原文先例；支持重讀 owner，不替 P3 證明原子性 |
| [buy-options G1](../../10-facts/buy-options.md#L91)、[buy-options G2](../../10-facts/buy-options.md#L92) | API 資料是二手摘要，平台 Odoo connector 未查證；不把「有 JSON-RPC」當作完成 ERP 業務整合 |

## 2. 完整流程

下表是必須走通的驗收路徑，不宣稱已實作。「補」指本文要求的契約；三種形狀只替換中間連線，不能刪去端點行為。

| 情境 | 從操作到可觀察結果 | 斷線與失敗出口 |
|---|---|---|
| D-01，(a)(b)(c) | ERP 編輯內容、Preview、Publish/Apply，保存順序、duration、日期及版本 V；root 投影 desired 與 DOCS；(a) unit 取 root 文件，(b)(c) 經 bridge 快取；補完整 V 就緒後取指定版或拒絕；display backend reconcile list/create/update/delete/order、移除 ghost assets；Anthias 換頁，unit 存 actual，root 比對 V 後 ERP 才顯示同步。編輯內容須能 Publish 到全部引用螢幕。 | 已下載的 playlist/assets 留在 unit；文件未完整則保持舊版、回報等待或錯誤，不能假成功。live board 的 JSON 每約 5 秒更新不靠 Apply；補 ERP origin 到站內投影、work centre 綁定、idle、freshness、polling 監測。scenarios-01、02、08。 |
| D-02，(a)(b)(c) | 同一螢幕可選啟 sensor function，獨立 backend；先宣告 schema，warm-up/fault 無有效樣本時顯示 no data；1 Hz 讀值形成 30 秒均值，最近節點標時間；MEAS 本地緩衝到 root writer，PG commit 後 ack；Grafana 查 PG 畫溫濕度/HCHO 與門檻線；Fleet 顯示但無 Manage，越線事件進 ERP。 | ERP 不收逐筆量測；parent 斷線時有效量測續存，超過緩衝須有可見 drop。補越線事件 owner，恢復後歷史補線與 ERP 告警都可對帳。scenarios-03、07。 |
| D-03，(a)(b)(c) | 操作員只在 south 登記一次代表，宣告 id、協定、地址、register map/schema；RTU 經本機 RS485，TCP 由 poller 撥向儀表；解碼比例、單位與 signed differentialPressure，取 min/mean/max；依 D-02 的 MEAS、PG、Grafana 路徑成為歷史。 | 不進 PLC 控制迴路；timeout 留缺口而非補零。換址、換表、schema 更新不能混接歷史或丟掉既有欄位。scenarios-04、07。 |
| D-04，(a)(b)(c) | announce capabilities 到 ERP，先驗效果；config/effect/playlist add/remove/resume 各有 job_key，SQ 到 unit，backend 真正結果存 SQLite/CQ，root 回 ERP；show 是一個版本化 intent，每個 controller 本地跑 timeline；補成員結果聚合。 | backend 拒絕、逾時、離線各別顯示；重送不重執行；parent 掛仍保留 standalone playlist。多條 strip 不因網路時序被承諾同步。scenarios-05。 |
| D-05，(a)(b)(c) | 製造身分、announce、Fleet 未採用；ERP Manage 寫 REGISTRY，鏡像到站點後重連授權；補管理 config desired/applied；heartbeat/attestation、Refresh、release/revoke 各有結果；刷卡與考勤進 EVT、root、ERP 業務紀錄。 | 已採用 reader 依本地有效設定運作，重連補報；身分與事件完整性依既有 security findings。credential lists、門禁 schedules、door state 屬 Control-Semantic，不能偷塞一般 desired；鎖控制 fabric 不在本次交付。scenarios-06、07。 |
| D-06，(a)(b)(c) | PLC 經 edge controller；依 P3 的 MQTT 3.1.1 假設進 ingress，validator 解碼、驗 schema/時間，重發本地量測；HMI 從 leaf 讀取，不繞 cloud；上行限制 ≤1 Hz，MEAS/source 到 PG；業務投影連 machine/work centre 到 ERP/MES，Grafana 負責分析。 | PLC 實際介面尚待 partner 資料，不假定必有 MQTT。配方與溫控保持 local。拔 WAN 後 HMI 須繼續且資料變 stale 可見；聚合前後的 HMI 延遲另測。scenarios-07、09。 |

## 3. 元件與防火牆

以下是 P3 的可部署清單加上必要補項，不是已驗證工件。箭頭表示 NEW 連線發起方向，回應走既有連線；未列者 default-deny。埠為部署設定，不作第三方預設值宣稱。

| 形狀 | north 與站內元件 | 必要連線與禁止方向 |
|---|---|---|
| (a) 同主機 | 同機 Odoo、ERP PostgreSQL、node[root]、hub/JetStream；CM4 有 node[unit]、SQLite、display backend、Anthias。有 T1 才加 poller 或隔離 ingress，依 device VLAN 配 south 邊界，不因同 hypervisor 取消隔離。 | unit → 主機 IoT 介面:4222；root → Odoo 內部 RPC、root/Odoo → PG 僅 loopback 或私網。ERP UI 僅管理端可入。DOCS 選既有 NATS request/reply，或明列獨立 HTTPS listener；不能藏一條 unit → ERP 規則。 |
| (b) 同站分 VLAN | north 同上；每個 device VLAN 的 south 有 node[bridge]、leaf/JetStream、registry/cache；Modbus poller 獨立，MQTT T1 才加 ingress/獨立 store_dir；T2 unit/backends；HMI、Grafana 依功能加入。 | T2 → leaf:4222；T1 → ingress:8883；poller → 白名單儀表:502，RTU 不開網路埠；leaf → hub:7422，堆疊 south → parent:7422。禁止 north 主動進 south、T1 進 ERP、bridge IP forwarding。 |
| (c) cloud ERP | cloud 的 Odoo、PG、node[root]、hub，依 P3 每客戶 account，LB 若有亦列管；站內仍有 bridge/leaf/cache、units，T1 ingress 選配，不能省成「只有螢幕 client」。 | 站內同 (b)；bridge → hub:443 WebSocket/TLS，或 bridge → IT 核准 proxy 埠 → hub:443；禁止 cloud NEW 進站。需明列 site credential、TLS 終結點及 inspection trust；不能要求客戶臨時開 7422 才叫支援 (c)。 |
| 共用輔助 | DNS resolver、有效 time source、必要 DHCP；CA 發行在 root，離線根與製造 provisioning 屬外部操作；可選 nginx/LB、Grafana/HMI UI 也是元件。 | 節點 → 指定 DNS TCP/UDP 53、time service UDP 123；DHCP 67/68 限本 VLAN。Grafana → history PG 唯讀私網路徑，ops → dashboard HTTPS。CA/監控不向 T1 開 admin port；mDNS 不跨 VLAN；同 VLAN lateral 要由交換器/AP 隔離，不能宣稱 inter-VLAN ACL 已辦到。 |

N-12 必須分開設定 parent endpoint、文件服務 endpoint、ERP RPC origin 與 live JSON origin。P3 已有獨立 hub 名稱，此點無須重做；待補的是其他 URL 的可達性與重定位，不能從 `web.base.url` 推導全部位址。

### 一片螢幕的實帳

| 部署角色 | 既有或增量 | 必須保留的狀態與隱藏成本 |
|---|---|---|
| Odoo、PostgreSQL | ERP 基礎兩角色 | 沒有 history store 不等於沒有 ERP database；保留業務 rows、內容與備份 |
| node[root]、hub/JetStream | north 增量兩角色 | issuer/callout/adapter；DESIRED/ACTUAL/SQ/CQ/REGISTRY/DOCS 與磁碟限額；CA 不必另開 daemon |
| node[unit]、display backend、Anthias | 螢幕三角色 | SQLite 非獨立 DB server；還有播放器、API/browser、已下載 assets，實際 process 數未查證 |
| nginx 或 LB | 使用才加；既有也須列入 | TLS 憑證、路由、port 衝突；不強制重複部署兩者 |
| DNS、NTP、OS supervisor、備份工具 | 可借既有健康服務 | 若站點沒有可靠服務就增加本地供給；不能把 NTP 回零列成可用依賴 |
| 不裝 | 最小部署 | history database/writer 排程、Grafana、Modbus、T1 ingress、獨立 MES 平台；JetStream 命令狀態不能因此刪除 |

## 4. Findings

### scenarios-01 | 重大 | DOCS 就緒不等於 desired 已到

情境：(a)(b)(c)，D-01。Apply V2 後 desired 先可讀、DOCS 尚未齊，斷點是 unit 取得指定版與切換本地播放清單。P3 §4.1、§6 沒有完整版本的就緒條件；N7 的 chunked storage 不替 F-56、F-60 提交資產集合。可修：manifest 綁 V 與資產清單，全部驗證後才切換並寫 actual，失敗保留 V1；約 1 人週，加暫存空間。這不是再提文件簽章問題。

### scenarios-02 | 重大 | live board 憑空多出站內 MES

情境：(b)(c)，D-01。螢幕已換頁，下一次 JSON poll 找不到來源：P3 §6 說站內 MES HTTP「與本提案無關」，但錨點沒有要求客戶另買 MES；ERP 在 cloud 的站點尤其不能靠這個假設。依據 D-01、F-63、C-24、N-12。可修：root 取業務 JSON，經 trunk 投影到受限站內端點，補 token、work centre、stale 與 polling 監測；約 1～2 人週、快取及一個 API 職責，不新增整套 MES。

### scenarios-03 | 重大 | 歷史補線沒有補回越線告警

情境：(a)(b)(c)，D-02。ERP 停機時 HCHO 越線又恢復，PG 稍後可補量測，ERP 卻無從重讀這次告警。P3 §6 只發 `fleet.<unit>.evt`；§4.1 列的 streams 沒有匹配它，D-05 的 EVT 也未承接它。依據 F-03、F-10、F-46、F-67。可修：共用 durable EVT，unit 留 event_id/結果至可重讀，root 去重交付業務事件；約 1 人週，多 event spool，非新引擎。

### scenarios-04 | 重大 | 換址或換表可能沿用錯誤歷史身分

情境：(a)(b)(c)，D-03。儀表更換或 DHCP 地址重用後，poller 再讀成功不表示仍是原儀表；P3 §6 只交代登記協定與位址，未交代重新確認代表的步驟。依據 F-19、F-22、F-32。可修：綁 assigned id 與 commissioned address/register-map revision，可讀 serial 時核對，否則換機人工確認；測 signed 壓差與 schema 更新不斷歷史。約 1 人週，加現場 commissioning，不要求 Modbus 天生有憑證。

### scenarios-05 | 重大 | 多條 strip 的 show 沒有整體結果

情境：(a)(b)(c)，D-04。show 含兩台 controller，其中一台離線，另一台回 actual；斷點是 ERP 要顯示整場完成、部分完成或等待。P3 §6 的本地 timeline 與 §4.1 的 per-device single-flight 沒有定義成員集合及聚合結果。依據 D-04、F-44、F-49。可修：固定 show_version 的成員，各自驗 capability、追 applied/rejected/unknown，ERP 聚合；約 1 人週。不得把修法變成網路同步起跑或預先建 Workflow。

### scenarios-06 | 重大 | reader 採用成功不代表管理設定已套用

情境：(b)(c)，D-05。Manage 後換 parent 或 enabled functions，REGISTRY 已更新，但 reader 是否接受新設定沒有回報版本。P3 §3.3、§6 只把「設定」指回身分流程；REGISTRY 的 status/path 不是 applied config。依據 F-19、F-20、F-38 及 T3 管理表。可修：獨立管理 config_rev/actual、重定位與拒絕結果；明列允許欄位，隔開門禁權限與鎖控制。約 1～2 人週，增加管理 schema，不重建控制 fabric。

### scenarios-07 | 重大 | 最近節點打時間仍可能打零時間

情境：(a)(b)(c)，D-02、D-03、D-05、D-06。依 N-14 已知 NTP 回零的站點冷開機，第一筆 sample、heartbeat 或刷卡事件即缺可信時間，歷史時間軸與分鐘級在線判斷無效。P3 §5 只定 stamp owner，未定 time-valid gate；NKey 能認證不解決 F-02、F-27。可修：部署有效時間源，非法時間隔離暫存並明示 quality，不拿 receive time 假裝量測時間；約 1 人週及時間服務維運。

### scenarios-08 | 次要 | 三服務不是一片螢幕的全機足跡

情境：(a)，D-01。採購按 P3 §3.1 的三服務配置與停機範圍時，漏掉 ERP PG、unit agent、backend、Anthias 及基礎服務，無法執行 N-07、N-13 驗收。上表至少七個部署角色，不是七個已測 OS processes；不重算 longevity 的種類帳。可修：輸出角色到 process/volume 的清單、量整機峰值及重啟；約 0.5 人週。不因缺 RAM 數字就判定放不下。

### scenarios-09 | 次要 | MQTT HMI 找不到已宣告的正常化入口

情境：(b)(c)，D-06，選 P3 §5 承諾的 MQTT HMI。client 接 leaf 時，§3.1 只列 4222；唯一 8883 屬 T1 ingress，不能拿來讀驗證後資料。這是 listener/部署契約缺項，不是重提 security-02 的 JS 權限。可修：選 NATS HMI，或明列 leaf 的 HMI MQTT listener，例如 8884，僅准 HMI 位址、拒 T1；約 0.5 人週與一條受控規則，不多引擎。原有 QoS 限制仍須客戶接受。

## 5. 待測建議與上線門檻

以下不是新增 findings，亦未執行。P3 §8 已認列不少 PoC；應補可判真假的出口，不以「待測」再加致命票。

| 要求 | 聚焦檢查 | 通過或退出條件 |
|---|---|---|
| (c) outbound、TLS inspection | 分測任意 outbound TCP、443-only、認證 CONNECT proxy、inspection 無 bypass；走 Apply、DOCS、CQ、MEAS 完整路徑；測 Upgrade 拒絕、idle 與重連 | 對支援 profile 有具體成功紀錄，site 無 inbound；接受 proxy CA 不等於可信 payload。失敗則客戶明確接受 bypass 或另驗 P3 已提的 HTTPS trunk 退路，不能自動降級或宣稱 HTTP 必通。 |
| N-07 | 冷啟動、crash、故意 stop 分開測；既有 Odoo 旁部署，檢查 port/磁碟限制、callout-ready、後端失敗 | crash 可恢復，故意 stop 不被拉起；readiness 反映實際可讀寫而非只開 socket；關閉 sensor 不拖垮 display。 |
| N-12 | ERP 公開名、內部 RPC、parent、文件 origin 各設不同名稱，改 parent 地址再 Apply/輪詢 JSON | 不靠 web.base.url、硬編 IP 或 IoT → ERP 臨時放行；DNS 故障呈 unknown，不能誤判撤銷。 |
| N-13 | 一屏實機整機 RSS/CPU、assets 大小、DOCS 更新暫存、磁碟峰值；再比較啟用 sensor 後的增量 | 依選定 CM4/host 預算判斷，數字未查證；[NATS N15](../../10-facts/nats.md#L35) 只有壓縮檔大小，不能代替 RSS。PG 留 ERP，history 與 Grafana 可不裝。 |
| N-14 | 注入零時間、向後跳時與時間源失聯，觀察 samples、心跳、事件 | quality 可見，錯誤時間不畫成新鮮資料；恢復後不能杜撰原始 sample 時間。 |
| D-06 HMI | owner 先定現場延遲上限，量聚合前到畫面 p95/p99；HMI 冷啟、WAN 斷、恢復重播 | 本地兩跳不等於低延遲已證明；若共用 ≤1 Hz MEAS 不合 SLA，新增僅站內的快通道，history 仍限速。MQTT/Sparkplug client 的 metadata 與 freshness 相容性另驗，不把 transport 相容當 UI 可用。 |
| N-18 | 每個承諾形狀重跑 §2 全流程，可用硬體 stub，但須經真實 ERP 安裝、adapter、資料庫與隔離規則 | 不只驗三個 NATS 容器互通；版本比對、六類結果、Grafana 查值、離線重讀及負向防火牆都有斷言，先通過才去站點。 |

## 6. 此點成立

1. P3 此點成立：outbound leaf 不需要 site inbound，N1 支持方向；不能從客戶 proxy 尚未測就反推 NATS 不可用。
2. P3 此點成立：本地 leaf 與獨立 domain 給 D-06 不經 WAN 的路徑，N6 支持持久資料局部讀取；效能仍待測。
3. P3 此點成立：ERP version 不等於 KV revision，unit 留 SQLite/CQ，完成不靠 transport ack；e15 的 owner/result 先例支持這個分工。本文要求補流程，不取消這些所得。

## 7. 作者最難回答的問題

客戶只有一片螢幕、沒有站內 MES、NTP 回零且只准經 TLS inspection proxy 出站時，從 Apply 到正確換頁並持續顯示新鮮 MES 資料，每一步由哪個 process、端點與耐久事實完成？