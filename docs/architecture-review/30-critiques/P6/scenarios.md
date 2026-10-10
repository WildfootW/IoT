結論先講：**致命 0 條、重大 10 條。** P6 的分期可採，但尚未交代所有錨點的交付路徑；「只改 parent」不能替代端點、現場接線與復原驗收。以下計新增情境缺口，不重算既有安全致命項，也不要求建造 D-05 控制迴路。

# P6 情境擬合評論

日期：2026-10-11。角色：P6 / scenarios。依接續腳本與 A.1 僅補此篇，不答辯、不評分。模型要求為 strongest / high；實際沿用 inherited default，介面未提供模型或 effort 設定，未宣稱驗證執行設定。

已依序讀完簡報、需求與 P0/取捨、LOG/interim、P6、[security.md](security.md)、[longevity.md](longevity.md)及指定三份事實檔。本文是文件推演，不是當前部署測試；產品引文沿用 2026-10-10 查核日期，保留原文/摘要等級，缺證據標「未查證」。修法與成本均為評論者估算，可重疊，不宜直接相加。

## 部署與足跡

1a 與 1b 是可組合能力，不保證依序出現；首單已有觸發條件就必須先補該階段。下表是可交付配置的核對表，標「待補」者不是 P6 已有成果。依據：[P6 §2](../../20-proposals/P6-minimalism.md#L33)、[§3](../../20-proposals/P6-minimalism.md#L82)、[§7](../../20-proposals/P6-minimalism.md#L238)。

| 符號 | 完整角色與狀態依賴 |
|---|---|
| N：north 基座 | Odoo 與 Fleet/CMS/device routes/job queue 模組、nginx、PostgreSQL 的 Odoo database、CMS 檔案儲存；credential resolver、pepper、TLS 私鑰/pin、備份與 provisioning 工具 |
| E：單片螢幕 | CM4 的 agent、SQLite（desired/CQ/ring）、獨立 display backend、Anthias/player 與瀏覽器；OS、Python、TLS library、服務管理與本地內容快取；sensor/LED backend 僅啟用時增加 |
| H：hub | 同一份 node 的 relay/writer 角色、HTTP server/client、TLS 與 site 身分、SQLite 緩衝、文件快取；Modbus poller 為隔離 process，RTU 另需 RS485 介面 |
| W：歷史能力 | writer、history database、series schema、分區/roll-up/retention 排程及備份；Grafana 與唯讀帳號為圖表需求選配，ERP 僅收業務事件 |
| B：本地 HMI 能力 | 站點 H 的即時資料投影、Mosquitto、T1 ingress 與可信 HMI 讀取入口、ACL/帳號、HMI client；listener 與更新節奏待補 |
| I：Stage 3 身分能力 | issuer、環境 CA/信任根、簽章與續期/撤銷流程、provisioning、金鑰保管；T3 硬體金鑰、attestation 與 signed config 整合待補 |
| 所有配置共有 | DNS 名稱/解析器、DHCP 或固定網路設定、有效時間源、host firewall、啟停/health check、日誌與容量限制、還原工件；單一 hypervisor 上需列介面、port、volume 與資源預算 |

| 形狀 | Stage 0 | Stage 1a | Stage 1b | Stage 2 | Stage 3 |
|---|---|---|---|---|---|
| (a) 同主機 south/north | 主機 N；CM4 E | N + H(writer) + W；E 改接 H | 同主機 H 增 relay，獨立 poller 接 T1；需歷史則含 W | 加 B；HMI 留站內 | 加 I，既有 E/H 也須能遷移信任 |
| (b) 同站跨 VLAN | 有示意圖、無交付工件；C-25 條件下先進 1b | N 在 north；H(relay/writer) 跨受控介面，W 在 north；不可略過 1b | E、T1、north 分區；每 device VLAN 有 H；可合併 writer，但須明列 DB conduit | B 的 T1 與 HMI 入口分區，H 投影本地資料 | I 的管理入口在 north，H 對上發起；T3 在受控區 |
| (c) 雲端 ERP、站點 outbound | 雲 N；站點 E 直連 443 | 雲 N + Hc(writer) + W；公開 443 至 Hc 的路由待補 | 站點 Hs + poller；Hs 向 Hc/ERP 撥出，雙 hub 路徑待補 | 站點 Hs + B + HMI；即使只有 T2 PLC controller，也要有本地 Hs | 雲 I；Hs/T3 outbound 取得管理物件，無 inbound 站點埠 |

一片螢幕在 (a)/(c) Stage 0 是主機三個執行角色加裝置三個角色，至少六個，非一個完整服務；SQLite 是內嵌依賴，不能再算 daemon。N-13 省掉的是 history、broker、獨立 PKI 服務，不是既有資料庫與 TLS 信任。Anthias 內部相依、實際 listening ports、CM4 RAM/磁碟與冷啟時間均未查證，須以交付映像清單補足；這不同於只重算 M-02 種類數。

以 D-06 的 30 屬性、1 Hz、1095 日計，是 2,838,240,000 筆；依 P6 自訂門檻，該配置第一天就需獨立 history PostgreSQL，不能只把服務數加一個 broker。低頻配置另算，不把此估算冒充效能實測。

## 防火牆清單

以下為建議的完整 conduit 清單，非已套用設定。8069/5432/3000 是建議工件定值，非宣稱產品預設。所有回程僅准 established；其餘預設 deny，H 不作 IP forwarding。名稱、介面與目的帳號都須落成工件。

| 形狀/階段 | 發起者 -> 目的地 | 協定/port、範圍與拒絕條件 |
|---|---|---|
| (a)/(c) Stage 0 | E -> N 的 device FQDN | HTTPS/TCP 443；只開 device routes 與核准文件/資產；TLS pin + device token；IoT 來源不得進 ERP admin/UI |
| (a)/(b) Stage 1+；(c) 有 Hs | E -> H south FQDN | HTTPS/TCP 8443；announce/adopt/report/desired/jobs/result/文件；T1 與租戶來源不得到此入口 |
| (c) Stage 1a | E -> cloud device FQDN -> Hc | 外部 HTTPS/443，nginx 到私有 Hc:8443；不可要求站點另開 outbound 8443；路由與驗證責任待補 |
| (b)/(c) Stage 1b+ | H north -> N 或 Hc FQDN | HTTPS/443、site-scoped 身分；(c) 需 cloud nginx -> Hc:8443；Hs/Hc 到 ERP 也只走批准 device routes；WAN 無反向新連線 |
| 所有含 N/H 的配置 | nginx -> Odoo；writer -> history；Odoo -> 自己的 DB | 私有 TCP 8069；DB 用 Unix socket 或私有 TCP 5432；writer 僅 history 權限。禁止 E/T1/公網直達 DB；(b) 的 443-only 規則不足以涵蓋遠端 writer |
| 有圖表/業務 UI | ops/admin browser -> nginx -> Grafana/Odoo；Grafana -> history | 外部 HTTPS/443、已驗證管理來源；內部 Grafana:3000 或 Odoo:8069；DB:5432 唯讀。MES 另發 consumer 帳號，不借 hub 的 site token |
| Stage 1b，所有形狀 | poller -> 白名單 T1 | Modbus TCP/502；T1 不得發起到 H、ERP、internet。RTU 無 IP port，列 RS485 device、權限、VM passthrough 與 bus 位址 |
| Stage 2，所有形狀 | MQTT T1 -> B 的 T1 listener；H -> B 的本地 listener | TCP 8883；無 TLS 的 T1 才用隔離網段 1883。T1 僅 publish 自己的 raw topic，H 才能讀 raw 並 publish 驗證後 site topic；不得承載命令 |
| Stage 2，所有形狀 | 可信 HMI -> B 的可信 listener | TCP 8883；唯讀 site topic；禁止 HMI 進 T1 VLAN 或取得 raw/管理權。P6「只聽 T1 介面」尚未提供此入口 |
| 所有形狀/階段 | E/H/主機 -> 指定 DNS、時間源；需要時 T1 -> 本地服務 | DNS UDP/TCP 53、NTP UDP 123；DHCP client/server UDP 68/67 僅本區。無 mDNS 跨 VLAN；(c) 外部僅 443 時，須供應站內有效時間源，不能偷偷另開公網 NTP |
| 所有形狀/階段 | provisioning/維修端 -> 受控管理入口 | ERP/issuer HTTPS/443；選用 SSH/TCP 22 僅管理網段。裝置區不能到 admin plane；更新/映像下載僅核准 HTTPS 目的地，不因此假定已有 OTA |
| D-01 與 Stage 3 | player -> 本地內容代理；node -> parent 文件/管理路由 | player 不持 node token；外部媒體與 JSON 必須有明列代理或核准出口。I 可共用 H 路由，不對 T1 新開 CA/admin port；backend/player 管理埠只限 localhost，實際埠待盤點 |

同 VLAN 的流量不能只靠 inter-VLAN 規則處理；需交換器/AP isolation 或重分區。這是部署建議；[transport-through-networks.md:87，T28](../../10-facts/transport-through-networks.md#L87)僅為廠商摘要，不是現場隔離已成立的證明。

## 情境矩陣

每格均含業務起點、裝置動作與可觀察終點。後續 Stage 2/3 不取消 D-01～D-04 的既有流程，換身分或插入 relay 後同樣重驗；未服務的步驟由 finding 指出。

| D-ID | 形狀 | 階段與完整流程 | 未服務步驟 |
|---|---|---|---|
| D-01 | (a) | 0：ERP Apply V -> E pull desired/版本文件/資產 -> display reconcile -> 畫面換頁 -> actual V -> ERP 比對；1a/1b 插 H 快取；2/3 保留此流程 | 內容子資源、冷啟；scenarios-04、10 |
| D-01 | (b) | 先 1b：Apply V -> E 從 H 拉取，H 向 north 拉文件 -> E 播放 -> actual 經 H 回 ERP；只准 H 跨區，不准 player 偷直連 ERP | 交付 gate、名稱/資產；scenarios-01、02、04 |
| D-01 | (c) | 0：E outbound 443 取得 V 並回報；1a 改 Hc；1b 經 Hs/Hc 取文件及回報；WAN 斷後播已完整快取版本，live board 顯示 stale | 公開端點、雙 hub、JSON；scenarios-02、03、04 |
| D-02 | (a) | 0：啟用同 CM4 的 sensor function -> 暖機 gate -> 30 s 平均/quality/時間 -> ring 與 ERP 最新 snapshot/門檻事件；1a：批次 -> H -> history -> Grafana 畫線 | 有效時間；要求三年歷史就不能停 0；scenarios-05、10 |
| D-02 | (b) | 1b+1a：sensor 獨立 process -> E 按 function 回報 -> H 剝除批次寫 history -> Grafana；ERP 只收 Fleet/業務資訊，sensor 停止不令 display 停止 | function 新鮮度與隔離復原；scenarios-05、10 |
| D-02 | (c) | 1a：E 蓋時、ring 緩衝 -> 443 Hc -> history -> 圖表；1b 後再經 Hs；斷 WAN 復線補舊資料但不得冒充新讀值 | 出口、補傳時間判定；scenarios-02、03、05 |
| D-03 | (a) | 1b+1a：操作員在 H 註冊 T1 一次 -> announce 代表至 Fleet -> RTU/TCP 讀表 -> signed pressure、min/mean/max -> history -> 圖表與 ERP 事件 | RS485 實體接入與 map 驗收；scenarios-06 |
| D-03 | (b) | 1b+1a：device VLAN 的 H/poller 取 T1 -> 驗 schema/蓋時 -> north history -> 圖表；T1 改 DHCP 位址仍對應同代表 | serial/位址與 DB conduit；scenarios-02、05、06 |
| D-03 | (c) | 1b+1a：Hs 本地輪詢/蓋時/緩衝 -> 443 Hc writer -> history -> ERP 業務事件與分析；若換 MQTT T1，2 才加 B，不能略過 H 檢查 | 雙 hub 與 RTU 接線；scenarios-03、05、06 |
| D-04 | (a) | 0 可加 LED backend：ERP 驗 capability、編 show/job key -> E 取件 -> backend 執行本地 timeline -> CQ -> ERP 結果；standalone playlist 另有本地 owner | 多帶目標、模式切換與部分失敗；scenarios-07 |
| D-04 | (b) | 1b：ERP jobs -> E 經 H 取得 -> 各 LED function 執行 -> 按 key 回 CQ/結果 -> ERP；H/ERP 離線仍維持已接受本地模式 | 結果粒度、重啟；scenarios-07、10 |
| D-04 | (c) | 0 或 1b：各 E/Hs outbound 取 show -> 本地運行 -> 復線重送 CQ -> ERP 對 key；不把跨盒網路同步當保證，2 不改走 MQTT 命令 | relay 切換中的工作與模式；scenarios-03、07 |
| D-05 | (a) | 3：T3 硬體身分 announce -> adopt -> signed site/parent/function config -> applied config、liveness/attestation -> Fleet -> revoke；不測開門控制 | CA 之外的管理整合；scenarios-08 |
| D-05 | (b) | 3+1b：T3 經 H 對 north 身分管理 -> 驗設定 -> 回 applied/liveness -> ERP；T1 不得接觸管理路由；撤銷須可辨 rejected/unknown | 硬體證明與既有 token 遷移；scenarios-08 |
| D-05 | (c) | 3+所需 Hs/Hc：outbound bootstrap/續期 -> 驗 signed config -> Fleet 回報；WAN 失聯顯示管理狀態 unknown，不因拒絕回應破壞裝置 | 首次入網及離線信任；scenarios-02、03、08；控制迴路排除 |
| D-06 | (a) | 1a+2，Modbus 時加 1b：PLC/controller -> 本地 H 檢查 -> B 投影 -> 低延遲 HMI；同源資料 -> history/分析；只有業務事件進 ERP | 快路徑/獨立 store 的首裝成本；scenarios-09、10 |
| D-06 | (b) | 1b+1a+2：PLC -> device 區 H -> 可信 HMI listener；H -> north history -> analytics/ERP；配方、溫控仍留 controller，不經此通道 | listener 與取樣節奏；scenarios-09 |
| D-06 | (c) | 1a+2 且必有 Hs，Modbus 再加 poller：PLC -> Hs/B -> HMI 不經 WAN；Hs 緩衝 -> Hc/history -> analytics；ERP 僅收事件 | 純 T2 場景也需要本地 hub；scenarios-03、09、10 |

## Findings

### scenarios-01 | 重大 | 分期表未形成首站交付門檻

**情境**：(b)，D-01/D-02/D-04，Stage 0 首裝。**斷點**：現場已有租戶鄰居，卻拿只有示意圖的 Stage 0 申請開通；應先交付 1b。**依據**：[P6 §2.2](../../20-proposals/P6-minimalism.md#L63)與 §3.1、§7；M-03、C-25、N-01/N-18。承認「以後補」尚未定義安裝阻擋條件。**修法/成本**：可修，列可售 shape/stage 矩陣與未通過即禁裝的 gate；也補 F-42「離開 trusted LAN」觸發，不只數站點。約 0.5 人週及客戶 IT 協調。

### scenarios-02 | 重大 | parent 設定尚未落成可達端點

**情境**：(a)(b)(c)，D-01/D-02，Stage 0 -> 1a。**斷點**：改指 H 後，雲端 443 圖仍指 Odoo；直接指 8443 又超出站點 egress。**依據**：[P6 §3.1](../../20-proposals/P6-minimalism.md#L84)、N-12/F-23/F-41；(b) writer 的 DB 連線亦不在「只放 443」內。**修法/成本**：可修，分別列 device-facing/public/internal 名稱及反代/DB conduit，驗 DNS 換址不改身分。代理檢查另須入網 gate：T1 的 pin 限制是[既有摘要](../../10-facts/transport-through-networks.md#L34)，20 s hold 低於[nginx 60 s 預設原文](../../10-facts/transport-through-networks.md#L45)也不證明客戶網路能通。約 1 人週；無 bypass 場景仍未服務，不能關驗證求通。

### scenarios-03 | 重大 | 雲端第一個 T1 已需要雙 hub

**情境**：(c)，D-01/D-03，Stage 1a -> 1b。**斷點**：Odoo -> Hc -> Hs -> E 已超出「Odoo -> hub -> unit」深度，Hs 上傳代表與取回文件所需 relay-of-relay 被延到多廠區。**依據**：[P6 §7 深度限制](../../20-proposals/P6-minimalism.md#L242)、§3.1/§8.7；F-19/F-20/N-18。previous_parent 回退不是這段 relay。**修法/成本**：可修，現在實作兩級轉送，或把 Hc 明定為旁路 writer；測同一 unit/function 與未完成 job 換 parent 後仍可對帳。約 2 人週；hub 驗人另依 security-01，不重算。

### scenarios-04 | 重大 | 快取 playlist 不等於完整畫面可用

**情境**：(b)(c)，D-01，Stage 1b。**斷點**：文件已到 E，但 player 載入媒體或 MES JSON 時仍指 ERP/外站；封直連後空白，放行則 C-24 未消失。**依據**：[P6 §6 D-01](../../20-proposals/P6-minimalism.md#L224)、F-55/F-59/F-63/F-72、N-11；只說 H 代拉文件未交代子資源與 per-record token。**修法/成本**：可修，明列文件/媒體/JSON 各自 owner、代理與授權，靜態版本完整才切換；live board 失聯顯示 stale，不假裝可離線更新。約 1～2 人週及快取容量。

### scenarios-05 | 重大 | 回報裝置時間之前沒有可用時間源

**情境**：(a)(b)(c)，D-02/D-03/D-06，Stage 0/1a/1b 冷啟。**斷點**：試點 NTP 回零時，agent/hub 仍拿 device_time 寫 history、判 Fleet 離線，補傳也無法區分舊資料。**依據**：[P6 §4.2](../../20-proposals/P6-minimalism.md#L172)、§5；N-14/F-02/F-27。**修法/成本**：可修，列每個蓋時節點的時間源、quality gate、失效告警及校時前緩衝政策；不改用接收時間。含 (c) 僅外放 443 的本地時間方案與單功能 stale 驗收，約 1 人週。

### scenarios-06 | 重大 | Modbus 接入缺少 RTU 現場步驟

**情境**：(a)(b)(c)，D-03，Stage 1b。**斷點**：開 TCP 502 無法讓 RTU 儀表進入 VM 裡的 poller；換轉接器或表位址後也可能接錯 series。**依據**：[P6 §6 D-03](../../20-proposals/P6-minimalism.md#L224)、D-03/F-22/F-32；map 的型別欄不等於已驗 signed differentialPressure 與 min/mean/max。**修法/成本**：可修，交付 RS485/VM passthrough、baud/parity/位址與代表映射表，用負壓及失聯 fixture 驗 schema、聚合與缺值；若儀表無序號，改址須人工核對。約 1～2 人週及現場接線成本。

### scenarios-07 | 重大 | LED show 缺多目標與模式交接

**情境**：(a)(b)(c)，D-04，Stage 0/1b。**斷點**：ERP 下 show 到多條 strip，其中一條拒絕或仍在 standalone；單一 job 結果不能表達各目標是否切換，add/remove/resume 也未逐項對應。**依據**：[P6 §6 D-04](../../20-proposals/P6-minimalism.md#L224)、F-20/F-44/F-45/F-49、B-05。**修法/成本**：可修，定 show 對 unit/function 的編譯、模式 owner 與逐目標結果，測 capability 不符及斷 ERP 後續播；不新增跨盒同步時序保證。約 1～2 人週。

### scenarios-08 | 重大 | Stage 3 的 CA 不是完整 T3 管理面

**情境**：(a)(b)(c)，D-05，Stage 3 首台 reader。**斷點**：加 issuer/續期後，仍沒有從硬體證明到 adopt、驗 signed config、回 reported config/attestation 的契約。**依據**：[P6 §6 D-05](../../20-proposals/P6-minimalism.md#L224)、§9.2、T3 管理表/N-18；引用 P0 §4 並未提供這段整合。**修法/成本**：可修，補上述管理狀態機、舊 token 遷移與離線/revoke fixture。硬體介面未查證，先估 2～4 人週整合，另計 P6 原列 PKI/外部審查；不要求刷卡決策或鎖控制。

### scenarios-09 | 重大 | HMI 不能等待上行 report 節奏

**情境**：(a)(b)(c)，D-06，Stage 2，尤以 (c) 純 T2 controller。**斷點**：1a 只有雲端 writer、2 只加 broker；沒有本地投影者，或投影等 120 s report/30 s 平均，HMI 無法取得現場更新。**依據**：[P6 §5](../../20-proposals/P6-minimalism.md#L216)、[§4.3](../../20-proposals/P6-minimalism.md#L200)、D-06/N-15；承接 security-11 的 listener 缺口，不重算 ACL。**修法/成本**：可修，HMI 觸發必含 Hs，本地取樣/投影與上傳聚合分開，帶 sample age；驗斷 WAN 仍更新、停 PLC 明確 stale。延遲門檻由現場定，未量測；約 1～2 人週及本地服務。

### scenarios-10 | 重大 | 單一 hypervisor 的啟停尚無驗收定義

**情境**：(a)(b)(c)，D-01/D-02/D-04/D-06，Stage 0 至 3。**斷點**：主機重啟或刻意 stop 後，重啟策略、port/volume 衝突、worker/DB 就緒次序未定；HTTP 健康不代表 player 換頁或 writer 可寫。**依據**：[P6 §8.8](../../20-proposals/P6-minimalism.md#L260)、§9.1；N-07/N-13/N-18、B-13、C-25。**修法/成本**：可修，給每角色啟停 owner 與資源上限；逐格跑冷啟、crash、刻意 stop、ERP/WAN 離線及還原，驗正確 project 停止、backend 故障隔離、畫面/圖表/結果恢復。新增約 1～2 人週，不以現有綠燈代替部署驗收。

## 此點成立

1. 此點成立：只播螢幕時不部署 history/broker，符合 F-15/N-13；不能拿這條豁免需要三年資料的 D-02/D-03。
2. 此點成立：parent_url 與穩定身分分開，符合 N-12/F-19 的方向；固定輪詢有 [Balena 原文先例 e10](../../10-facts/precedents.md#L37)，但不證明 P6 的代理相容性或效能。
3. 此點成立：ERP 持 desired、裝置持 actual/CQ 的方向正確；[Apple MDM 原文 e15](../../10-facts/precedents.md#L42)支持結果快取重送，不替 P6 的切換流程背書。
4. 此點成立：D-05 控制迴路排除、D-06 控制留本地，邊界應保留。不能把買 OTA 當作補齊管理/HMI；[buy-options.md:57，D2](../../10-facts/buy-options.md#L57)僅有 Mender 定位的摘要，整合成本未查證。

## 作者最難回答的問題

第一個客戶就在 (c)，同時要一片 live board、RTU 壓差歷史與離線仍更新的 HMI，而外部只准 443，你能否逐跳列出誰驗身分、誰供時間、誰供每個內容資源，並在重啟後證明它們工作，而不是回答「下一階段再補」？