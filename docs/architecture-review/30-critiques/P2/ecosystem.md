## 結論先講

**致命 0 條、重大 8 條、次要 1 條。** P2 可作基底，但入口與扇出不等於設備、HMI、MES 即插即用；「四筆小支出買回生態」未獲驗證。收益來自 MQTT 不進 trunk、管理面及最小部署，不是全面拒絕。缺口可補，未證明錨點無解，故無致命。

日期：2026-10-11。評價、修法、成本為意見；第三方引文沿用 fact 檔 2026-10-10 的查證層級，本輪未上網。不重列已讀的 security/longevity 批評。

### ecosystem-01 | 重大 | PUBLISH-only 不是完整的 T1 接入承諾

情境：(b)(c)、D-06。[P2 §3.2](../../20-proposals/P2-https-pull-defended.md#L159) 拒絕全部 SUBSCRIBE；若封閉 T1 是啟用 Primary Host 的 Sparkplug Edge，須先訂 STATE、等 host online 才送 NBIRTH，第一個訂閱就被拒（[MQ20](../../10-facts/mqtt-semantics.md#L67)）。目標機型未查證；這是遙測握手，非致動。

可修：依 F-22、F-31 列已測機型/韌體/profile；raw broker 僅允許必要訂閱，不開致動，interim 的 publish-only 也須調整。成本為 ACL、fixture、重連驗收，不能泛稱 MQTT 相容；已承認的 MQTT 5 缺口不重算。

### ecosystem-02 | 重大 | raw 通過 schema 不等於 curated 契約

情境：(a)(b)、D-02/D-06。P2 §3.2 有 topic/schema 檢查，[§6](../../20-proposals/P2-https-pull-defended.md#L298) 只重發已驗證資料；缺的是 consumer 共用語意。首次解碼 raw=250，倍率未入契約，HMI 讀 25.0、MES 讀 250，型別合法卻值不同。F-02、F-04、F-14、F-32 要求的時間、stale 與身分不能各猜。

可修：raw 只供受控診斷，curated 固定永久 ID、單位、倍率、來源時間、quality、schema 版本；HTTP/MQTT 共用轉換及 fixtures。成本是設備 mapping、跨版本測試，不是多發 JSON；不得開 raw 旁路。

### ecosystem-03 | 重大 | 第 N 個讀者仍要實作恢復流程

情境：(b)(c)、D-05/D-06。[interim 觸發表](../../50-synthesis/interim.md#L105) 稱第三個 consumer 只加 token/scope，漏算 client。[P2 §4.3](../../20-proposals/P2-https-pull-defended.md#L225) 已明寫 cursor 過期 410，但 MES 超過 window 後重新 list，只取得當前狀態，不能重建出勤事件或機台轉態。F-46、F-67 的來源可重讀，不代表讀者知道去哪裡補。

可修：提供 client、schema 及快照/即時/回補/缺口契約，區分最新值與事件回補，用獨立 MES、HMI 驗收。成本含 connector 與相容測試。Kubernetes list/watch 只證明模式可行，不提供 P2 client（[e17](../../10-facts/precedents.md#L44)）。

### ecosystem-04 | 重大 | 本地 endpoint 尚未交付低延遲與斷網 HMI

情境：(b)(c)、D-06。[P2 HMI 表](../../20-proposals/P2-https-pull-defended.md#L298) 的 LAN「毫秒級」未量測，非取樣至顯示保證：若沿用 1 Hz 取樣，等下筆可近一秒；F-01 限上行，不禁止本地另設取樣。斷 WAN 後重開 HMI，頁面來源、離線身分與初始快照未定，不能只憑本地 SSE 宣告 N-11 成立。

可修：owner 定資料年齡、顯示 p95、stale 期限；量取樣到繪圖各段，驗斷 WAN 冷啟動及慢讀者隔離。預置頁面、有期限的授權，缺新資料必顯 stale（F-04）。成本為站內交付包與實測，不能拿 D-01 的約 5 秒看板替代。

### ecosystem-05 | 重大 | Sparkplug 不是 NBIRTH 編碼加 retained

情境：(b)(c)、D-06。[P2 §6](../../20-proposals/P2-https-pull-defended.md#L302) 只列 NBIRTH/NDATA 編碼；若套用同表通用 retained 規則，便違反 BIRTH/DATA 的 retain=false（[MQ19](../../10-facts/mqtt-semantics.md#L66)）。即使修正旗標，晚加入或漏 BIRTH 的 host 仍要重建 metric/alias；interim 的 HMI 唯讀角色若連 Rebirth 都禁，恢復路徑仍斷（[MQ18](../../10-facts/mqtt-semantics.md#L65)、[MQ21](../../10-facts/mqtt-semantics.md#L68)）。

可修：獨立 Sparkplug profile，處理 BIRTH/DEATH、seq/bdSeq、Clean Session 與限權 Rebirth；其餘 NCMD/DCMD 仍禁。成本是狀態機與 host 互通測試，不只 protobuf；P2 的 1-2 人週未驗證。plugin、Ignition 適配仍有未查證項（[MQ28](../../10-facts/mqtt-semantics.md#L70)）。

### ecosystem-06 | 重大 | OPC UA 與機台自帶 HMI 不能當既得條件

情境：(b)(c)、D-06。需求仍卡在伙伴 PLC 資料；P2 預設「機台方提供 Modbus/OPC UA」沒有交付證據。壞在選 HMI 輸入的第一步：究竟有 Client/Server endpoint、PubSub 還是只有 register map，尚未查證。不能以協定名抵掉整合工作，也不能跟 ledger 一樣概括「SCADA 非 broker 不可」。

依據：[OPC UA 摘要](../../10-facts/zenoh.md#L82) 列 Part 14 的 MQTT、UADP/JSON 選項，僅搜尋摘要，非現場證明。可修：伙伴提供 endpoint/profile、點表、品質、時間、認證及樣本；PubSub 另列 codec/metadata mapping，裸 payload 不等於點位。成本為唯讀 adapter、library 審查與現場驗收；N-21 的控制迴路不碰。

### ecosystem-07 | 次要 | 不留 Orion 不必連資料標準一起丟

情境：(a)(b)、D-02/D-06，客戶要求既有 NGSI reader 接入時。P2 §1.1 以命令缺口及「台灣低價值」決定不補，但第一個 entity 查詢就不會是自訂 consumer 的 list；F-39 的新設備擴充也沒有替讀者完成欄位對映。這是條件式機會成本，標案需求未查證，故非重大。

可修：先確認 NGSIv2 或 NGSI-LD，僅在契約要求時做有明示範圍的唯讀 export，不能宣稱完整相容；或只借用資料模型。依據：[F8](../../10-facts/buy-options.md#L82) 區分兩種介面，[F10](../../10-facts/buy-options.md#L84) 另列 Smart Data Models 與 CC-BY 4.0。成本是 mapping、相容驗收及授權審閱，不必恢復 Orion 命令鏈。

### ecosystem-08 | 重大 | 客戶自帶 broker 的驗收條件缺席

情境：(b)(c)、D-06，interim 的 T-c 觸發。客戶已提供 broker，交付時卻只得到加裝 Mosquitto raw/n 的方案，無法判定是否必須多養兩個實例。[ledger 第 11 項](../../40-mqtt-ledger/ledger.md#L65) 用「無 outbound bridge」縮小候選，但 P2 投影是 node 作 client 發布，根本不需要 broker bridging；HiveMQ CE 的 MQTT 能力與 bridge 限制是不同事（[broker 21](../../10-facts/mqtt-brokers.md#L57)、[broker 22](../../10-facts/mqtt-brokers.md#L58)，後者含搜尋摘要）。

可修：按 profile、ACL、資源隔離驗收客供 broker；不能隔離 T1 才另設 raw 邊界。向 IT 交付連線矩陣、憑證、升版責任與斷線演練，MQTT 名稱或外審報告不等於採購合格。成本為每站驗收，不要求 (c) 開 WAN 8883（M-03、M-04、N-01）。

### ecosystem-09 | 重大 | 拒絕 MQTT 的淨收益用了不對等比較

情境：(a)(b)(c)、D-01/D-06。選型時計帳失真：P2 已選擇 MQTT ingress、curated publisher 與 consumer，不能再把免 broker、免其審查的收益全數入帳；相同的 HTTPS trunk 與 owner 語意也能保留在站內 broker 方案。F-46/F-47 不是拒絕 MQTT 才換來的。

[ledger 第 2 項](../../40-mqtt-ledger/ledger.md#L56) 把 retained 判成負資產，也混淆 owner 與快取；晚加入 HMI 的 last value 有用，只需帶來源時間、quality，重啟後由 owner 回灌，輪替時驗證存取規則（[MQ9](../../10-facts/mqtt-semantics.md#L36)、[MQ10](../../10-facts/mqtt-semantics.md#L42)）。可修：分純螢幕、T1、D-06/客供 broker 三組，同負載比較服務數、第二個 reader 工時及恢復行為。成本是一輪 PoC；CM4 足跡仍未查證（[broker 11](../../10-facts/mqtt-brokers.md#L32)），不能先宣告淨省。

## 此點成立

1. P2 此點成立：本地 HMI 有直連、SSE、MQTT 三條路，不必經雲端；不能再批評「沒有 HMI 答案」。
2. P2 此點成立：每個 bridge 已有 consumer，新增讀者不用改裝置；window 與 410 讓遺失可診斷，欠 client 契約與驗收。
3. P2 此點成立：register/SQ/CQ 不能由 MQTT ack 代替；Azure twin 仍有版本及重同步（[MQ14](../../10-facts/mqtt-semantics.md#L53)）。
4. P2 此點成立：純螢幕不需 broker，有需求才加站內投影，保留 ERP 邊界與 N-13。

## 作者最怕的問題

斷 WAN 並重開 HMI，T1、晚加入 HMI 與第二套 MES 能否自行重建同義、不冒充新鮮的資料；相較同樣 HTTPS trunk 的站內 broker 方案，到底省了哪份工作？