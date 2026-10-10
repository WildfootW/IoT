結論先講：**致命 0 條、重大 6 條、次要 2 條。** P5(A) 的契約與測試分層值得保留；P5(B) 的第二個生產 binding 尚未證明淨生態收益。「站點需要 broker」不等於「unit 必須換傳輸」，更不等於第三方已能理解資料。缺口可補，不能把轉譯、投影與客戶接入算成免費。

審查日期：2026-10-11。第三方資料沿用事實檔的 2026-10-10 查證記錄；搜尋摘要不升格為原文，未知仍標「未查證」。本輪只有文件比對，沒有網查、實機或 PoC。以下判定與工時皆為審查意見；估計互有重疊，不可直接相加。既有 [security.md](security.md#L11) 與 [longevity.md](longevity.md#L15) 的問題不重複計數。

## Findings

### ecosystem-01 | 重大 | T1 接入缺少可交付的轉譯契約

情境：(b)/(c)，D-06，假設封閉 controller 講 MQTT。壞點：T1 發布成功後，bridge 訂閱者的 queue 若溢出，資料尚未進 SQLite 就消失；P5 的 unit 重送規則救不了不懂 `put/version` 的 T1。即使沒有遺失，vendor topic、單位、原始時間與裝置 id 也不會自動成為已宣告的 function schema。bridge 代言只能證明轉述來源，不能把不可信讀值變成可信事實。

依據：[P5 §3.2](../../20-proposals/P5-pluggable-transport.md#L109) 只指定 raw 驗證後 put；[mqtt-semantics.md MQ11](../../10-facts/mqtt-semantics.md#L43) 記錄 queue 超限靜默丟棄。F-22、F-31、F-32、F-02 仍需 adapter。可修：每款設備交付身分/topic/schema 對照、重送能力與缺資料策略，來源無時間則明列 bridge 觀測時間的限制；首款估 1~2 人週，之後按廠牌差異計，不能藏進通用 binding。

### ecosystem-02 | 重大 | 本地 HMI 的正式投影沒有完整路徑

情境：(b)/(c)，D-06，雲端不可達而現場繼續工作。壞點：[P5 §6](../../20-proposals/P5-pluggable-transport.md#L263) 的路徑是 raw、驗證、向上 put；沒有指定誰把已驗證資料寫回本站正式 topic。HMI 訂 `n/` 不會因此收到 T1 的最新值。即使補了重發，[逐批 meas slot](../../20-proposals/P5-pluggable-transport.md#L239) 也不是每個 metric 一個 last-value；HMI 重連不能只以最後抵達的舊批次當最新值。

依據：D-06、F-04、N-11；[P5 T-b](../../20-proposals/P5-pluggable-transport.md#L35) 卻把省掉重發列為收益。本項假定 [security-07](security.md#L76) 已修，並非再次批評 raw 直讀。可修：本站持有逐 metric 的時間、quality、schema version 與過期狀態，先本地投影再獨立上送；驗收斷雲、遲到批次、來源停送與 HMI 重連。估 1~2 人週；LAN 延遲尚未量測，不能由協定名稱保證。

### ecosystem-03 | 重大 | 第 N 個消費者仍缺讀取與授權契約

情境：(a)/(b)/(c)，D-01 live board、D-06 MES/Grafana。壞點：新 MES 拿到 token 後要先取得 schema 與一致快照；[MQTT 角色](../../20-proposals/P5-pluggable-transport.md#L126) 只准 actual/meas，未提供 cfg 讀取；[consumer watch](../../20-proposals/P5-pluggable-transport.md#L246) 又只稱共用程式碼，[過期退路](../../20-proposals/P5-pluggable-transport.md#L106) 寫的是 desired 全量，沒有消費者資料快照。第一筆資料如何正確解碼與續接仍需客製。

依據：F-32、F-39、F-63、N-03；[precedents.md e17](../../10-facts/precedents.md#L44) 的 list 加 resourceVersion 再 watch 才是完整參照。可修：唯讀 schema/snapshot/cursor、產線 scope 與即時撤銷、慢消費者配額及 lag/drop；Grafana 直讀 PG 另需 role/view，不能沿用 MQTT ACL。首份消費者契約估 1~2 人週，每種新 payload 另驗，不是每個 consumer 零成本；interim 的「只加 token」無法據此成立。

### ecosystem-04 | 重大 | Sparkplug B 不是 raw 與 retained 的別名

情境：(b)/(c)，D-06，來源與 HMI 都要求 Sparkplug。壞點：標準 `spBv1.0/...` 沒有到 `raw/<id>/...` 的映射就進不了白名單；即使改名送入，晚啟動的 host 只見 DATA alias、缺 BIRTH 就不能解碼。訂 P5 正式 topic 也不等於 Sparkplug host；全面唯讀又未安排 Rebirth。

依據：[mqtt-semantics.md MQ17](../../10-facts/mqtt-semantics.md#L64)、[MQ18](../../10-facts/mqtt-semantics.md#L65)、[MQ19](../../10-facts/mqtt-semantics.md#L66)、[MQ20](../../10-facts/mqtt-semantics.md#L67)：topic、BIRTH 型別、非 retained 資料、Clean Session 都有額外規則。可修：資料 adapter 分清 ingress host 與 egress Edge Node，維護 alias、seq/bdSeq、BIRTH/DEATH；僅允許隔離的 Rebirth 管理請求，不開致動通道（F-31/F-32、N-21）。估 2~4 人週與角色互通驗收；[MQ28](../../10-facts/mqtt-semantics.md#L70) 的 plugin 細節未查證，不能當現成免工零件。

### ecosystem-05 | 重大 | 客戶既有 broker 不等於我們可控制的 Mosquitto

情境：(b)/(c)，D-01/D-06，T-c 客戶只核發 client 憑證、不給 broker 管理權。壞點：[P5 T-c](../../20-proposals/P5-pluggable-transport.md#L36) 說 node 當 client 即可，但 adopt 時需要新增權限、輪替時需要更新 ACL；我們無法自行執行其 dynsec 生成流程。應用層 hello 不能授予 broker 的 subscribe 權限。

依據：[mqtt-brokers.md 第 7 列](../../10-facts/mqtt-brokers.md#L28) 的 dynsec 是特定管理介面，不是 MQTT client 的通用能力；M-03、F-33、F-40。可修：與 IT 定義 namespace、cert 對應、retained/session/quota 能力及開通撤銷責任；能力不足時只做核准的資料 export，unit 留 HTTPS。每客戶估 0.5~1 人週協作，特殊 broker 另估。反過來，[ledger 第 11 項](../../40-mqtt-ledger/ledger.md#L65) 以缺 outbound bridge 縮小候選也不適用：[P5 本就不用它](../../20-proposals/P5-pluggable-transport.md#L110)。

### ecosystem-06 | 次要 | NGSI 退出後仍有資料模型接軌成本

情境：(a)/(b)/(c)，D-06，假設客戶 MES 已吃 NGSI。壞點：把 entity 資料改成 [P5 五元組](../../20-proposals/P5-pluggable-transport.md#L85) 後，原查詢與 subscription 沒有承接介面；切到 MQTT 仍要重寫消費者。F-39 的可擴充性不是消費者理解 slot 的證據。

依據：[buy-options.md F10](../../10-facts/buy-options.md#L84) 顯示 Smart Data Models 可獨立評估，不必與整個 FIWARE 平台綁售。可修：明列 NGSIv2/NGSI-LD 不相容範圍，遇具名需求才建單向 mapping，保留穩定 id、型別、單位與 schema 演進；首個模型估 1~2 人週並確認授權義務。台灣標案是否硬性要求 NGSI 未查證，所以不是致命；「不用就無損」同樣未被證明。

### ecosystem-07 | 次要 | OPC UA 的入口尚未被 binding 回答

情境：(b)/(c)，D-06，PLC 介面尚待夥伴提供。壞點：若交的是 OPC UA Client/Server endpoint，MQTT binding 沒有相應 backend；若交的是 PubSub over MQTT，也沒有 UADP/JSON 到 function schema 的對照，首次匯入點位仍無契約可依。

依據：[zenoh.md §3](../../10-facts/zenoh.md#L82) 只以搜尋摘要記錄 OPC UA PubSub 的 broker 傳輸與編碼，不證明目標 PLC、HMI 或 P5 可互通，這些均未查證。可修：先取得 endpoint 類型與 payload 範例，再選唯讀 backend 或資料 adapter，保存型別、來源時間與品質資訊（F-02、F-32、N-21）；估 1 人週界定與驗收設計，實作待資料到齊另估，不要求新增第三個 node binding。

### ecosystem-08 | 重大 | 三個觸發證明需要 broker，沒有證明需要 B

情境：(a)/(b)/(c)，D-01 加上 D-06 或 MQTT T1。壞點：[T-a/T-b/T-c](../../20-proposals/P5-pluggable-transport.md#L34) 任一出現就判 B 值得付錢，但 ingress、HMI 投影或客戶 export 可以保留 unit 的 HTTPS；同一批生態需求沒有迫使 unit 改 `dial/put/watch`。因此 [3~4 人週 binding](../../20-proposals/P5-pluggable-transport.md#L310) 的收益把資料 adapter 的收益一起算進去了。

依據：M-01、M-02；[precedents.md §3.3](../../10-facts/precedents.md#L102) 明言沒有雙 binding 成本先例。可修：保留 A 的獨立價值；B 必須對照「相同 broker、schema、安全與 HMI，unit 仍 HTTPS」的基線，列出真正少掉的整合工作與新成本。估 0.5~1 人週設計增量驗收，尚未執行。也不接受 [ledger §4](../../40-mqtt-ledger/ledger.md#L156) 只准 fan-in 觸發：能避免具名客戶端改造亦可算收益，但要拿交付證據，不是推測。

## 此點成立與帳本裁決

1. 此點成立：A 與 B 分帳正確；不應因 B 未回本而否定契約、conformance 與 memory binding。反之，[interim 的 A 全採](../../50-synthesis/interim.md#L21) 不能把對外 schema 與消費者契約也算免費。
2. 此點成立：retained 當快取、owner 留在 SQLite 是合理選擇。反對 [ledger 第 2 項](../../40-mqtt-ledger/ledger.md#L56) 一概判負資產：對已懂該 payload 的晚到 HMI 有價值，條件是新鮮度與重建完整，不是把它冒充耐久真相。
3. 此點成立：最小螢幕部署不帶 broker、不預建第三個 binding，符合 N-13/M-01；[zenoh.md Z10](../../10-facts/zenoh.md#L46) 的原始碼推論亦提醒「可翻 MQTT」不等於保有完整語意，且仍待 PoC。
4. 此點成立：MQTT 扇出確能讓新增訂閱者不改裝置；但 [ledger 第 1 項](../../40-mqtt-ledger/ledger.md#L55) 與 [interim 的 token 承諾](../../50-synthesis/interim.md#L105) 都漏算資料語意、授權與慢消費者治理，不能用共識代替驗收。

## 作者最怕的一問

在同樣已有 broker、已驗證資料投影與可用 HMI 的 D-06 站點，請指出改用 P5(B) 後客戶到底少寫哪個 adapter、少申請哪項 IT 權限，以及哪份證據足以支付新增的 binding 成本？