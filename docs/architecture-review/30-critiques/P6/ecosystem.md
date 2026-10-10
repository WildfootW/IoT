結論先講：**致命 0 條、重大 7 條、次要 2 條。** P6 的分期方向可採，但 Stage 2 目前是接線構想，不是可交付的互通承諾；應補齊真實 T1、HMI 與消費者契約，而非要求第一片螢幕預裝全部生態。本篇沒有證明必然無法成立的錨點，故不新增致命；既有安全致命問題不因此消失。

審查日期：2026-10-11。目標：[P6](../../20-proposals/P6-minimalism.md#L1)。需求 ID 依[需求底稿](../../00-requirements.md#L1)。第三方事實只引用事實檔的實際行號，沿用其 2026-10-10 查證紀錄與限制；本次沒有重新連網、執行產品或實測。以下評級、修法、人週皆為審查意見與粗估，不是廠商報價，各項共用工作不可直接相加。

[security.md](security.md) 的 token 驗證、HMI VLAN，以及 [longevity.md](longevity.md) 的版本矩陣、broker 重啟回灌不重複計數。[中期綜合](../../50-synthesis/interim.md#L1) 與 [MQTT 帳本](../../40-mqtt-ledger/ledger.md#L1) 均視為待裁決意見，不當產品證據。

## Findings

### ecosystem-01 | 重大 | 真實 T1 不能被要求配合自訂入口

**情境與失敗步驟。** (b)(c)、D-03 的 MQTT 儀表進 Stage 2。P6 §3.2 要每台帳密及 `t1/<client>/#`；若封閉韌體只能發固定 topic、固定 client ID，或不能設定帳密，會在 CONNECT 或 ACL 階段失敗，還到不了 schema 檢查。具體型號能力未查證，不能把「講 MQTT」等同可接入，也不能偷偷開匿名或全域 wildcard。

**依據。** M-04、F-22、F-26、F-31；[mqtt-brokers.md 第28行](../../10-facts/mqtt-brokers.md#L28) 證明 dynsec 有授權工具，沒有證明設備可改 topic。

**修法與代價（可修）。** 採購前列版本、TLS、帳密、topic、payload、QoS、時間戳的實機 profile；支援 vendor topic 到固定身分的對映，無法安全區分者隔離入口或拒收。先建框架約 1～2 人週，每型號另估設定與驗收；不是每台寫新 backend。

### ecosystem-02 | 重大 | 本地 broker 不會消除上游採樣延遲

**情境與失敗步驟。** (c)、D-06 的邊緣控制器經 agent 回報。P6 §5 讓 hub 收到量測後才 publish，§4.3 預設 report 每 120 秒、§5 寫 30 秒平均，§6 又討論 1 Hz。若沿用通用節奏，HMI 在本地收到的仍是延遲或聚合值；加 broker 沒有補出較早的樣本。這是欠明確例外，不是斷言 MQTT 本身慢。

**依據。** D-06、F-01、F-03、F-44；P6 §4.3、§5、§6。D-01 每五秒的 MES 看板不是低延遲 HMI 的替代。

**修法與代價（可修）。** 定義採樣到站點 hub 再到 HMI 的獨立更新節奏，雲端批次與背壓不得阻塞它；約定取得樣本到畫面的 p99、最大資料年齡，斷 WAN／ERP 仍須達標。約 1～2 人週與實機驗收；配方、溫控維持本地，不新增控制通道。

### ecosystem-03 | 重大 | hub 在線不代表每個量測仍新鮮

**情境與失敗步驟。** (a)(b)(c)、D-02／D-06。感測器或 PLC 停止更新，但 hub 的 MQTT 連線仍活著；P6 §6 所稱 retained + Will 留下最後正常值，不能自行告訴 HMI 哪個功能已失效。即使既有批評要求的重啟回灌完成，也可能回灌一筆過期的正常值。

**依據。** F-02、F-04、F-05、F-27；[mqtt-semantics.md 第35行](../../10-facts/mqtt-semantics.md#L35) 的連線偵測不能替代樣本品質，[第36行](../../10-facts/mqtt-semantics.md#L36) 的 retained 行為也不是量測有效性判定。

**修法與代價（可修）。** 投影包含來源時間、品質、序號與有效期限，HMI 本身計算 stale；功能失效與 hub 離線分開呈現，時間不可信顯示 unknown。約 0.5～1 人週，加各 HMI 的顯示映射。retained 對晚加入者仍有價值，不接受帳本把它一概判成負資產。

### ecosystem-04 | 重大 | 新增消費者需要獨立授權而非共用唯讀身分

**情境與失敗步驟。** (b)(c)、D-03／D-06，MES 只獲甲產線讀權。即使修好 security-01，若 P6 §5 的「同一條唯讀 role」落成共用登入憑證，就無法獨立撤銷 MES 而保留 Grafana；若各自登入，也仍須交代 SQL、HTTP、MQTT 三個出口如何一致限制產線與功能。唯讀只回答能否寫，沒有回答可讀哪些資料。

**依據。** N-03、F-40、F-63；P6 §5、§7。這不是重算 site token 外洩，而是修好驗證後仍缺少的消費者權限契約。

**修法與代價（可修）。** 每個 consumer 獨立身分、scope、到期與撤銷，禁止使用裝置或 hub 憑證；同份政策產生 SQL view／role、API scope 與 MQTT ACL，驗證跨範圍讀取遭拒。基礎約 1～2 人週，其後每個 consumer 仍有權限審核與聯測成本，不能宣稱只加一個 token。

### ecosystem-05 | 重大 | schema 宣告不等於對外資料契約

**情境與失敗步驟。** (a)(b)(c)、D-02／D-03，MES 與客戶程式加入。P6 已有 announce schema 與窄表，新增量測不用 ALTER；但量測改名、平均值改為即時值時，既有 SQL join 或 `site/<unit>/<function>/<measure>` 訂閱如何相容未定義。第三個消費者取得 list + cursor，也不知道快照水位、刪除與 cursor 過期的意義。

**依據。** F-11、F-14、F-20、F-32、F-39；P6 §5、§9.3。[precedents.md 第44行](../../10-facts/precedents.md#L44) 的 list/watch 先例有版本水位，不是只有兩個 API 名稱。

**修法與代價（可修）。** 首次對外供資料前固定穩定 ID、單位、型別、品質、聚合窗口及版本化 view／topic；定義 tombstone、重取與升版規則，附一個外部 reader 範例。約 1～2 人週；只做資料出口契約，不重建整套 agent conformance，也不要求 Stage 0 先做通用訂閱平台。

### ecosystem-06 | 重大 | retained 自訂 topic 不是 Sparkplug 相容性

**情境與失敗步驟。** (b)(c)、D-06 採 Sparkplug HMI。P6 §5 的 `site/...` 投影沒有 NBIRTH／DBIRTH 與 metric 定義，HMI 不能因 broker 可連就自動建點。若把「不走命令」解作禁止所有 NCMD，又沒有處理 Rebirth，晚啟動或缺序後的重新同步仍缺一段。

**依據。** [mqtt-semantics.md 第64行](../../10-facts/mqtt-semantics.md#L64)、[第65行](../../10-facts/mqtt-semantics.md#L65)、[第66行](../../10-facts/mqtt-semantics.md#L66)、[第67行](../../10-facts/mqtt-semantics.md#L67)、[第68行](../../10-facts/mqtt-semantics.md#L68)：topic、BIRTH、retain、session、序號均有約定；F-31 不由協定替我們強制。

**修法與代價（可修）。** 只在需要的站點建 Sparkplug 資料 adapter，處理 BIRTH、seq／bdSeq、STATE；僅允許影響發布的 Rebirth，拒絕設備控制。約 2～4 人週起，須測 HMI 晚加入、重連與缺序；Tahu 可作候選，但維護狀態與具名 HMI 相容性仍未查證，見[第63行](../../10-facts/mqtt-semantics.md#L63)、[第70行](../../10-facts/mqtt-semantics.md#L70)。

### ecosystem-07 | 次要 | OPC UA 與 NGSI 必須逐種聲明邊界

**情境與失敗步驟。** (b)(c)、D-06 機台要求 OPC UA，MES 要 NGSI。P6 沒承諾原生支援，延後合理；但報價若把 MQTT 入口當成這兩者的相容證據，會在解碼、點位映射或 API 查詢時失敗，而非換個 topic 就完成。

**依據。** [zenoh.md 第82行](../../10-facts/zenoh.md#L82) 僅據搜尋摘要記錄 OPC UA PubSub over MQTT 可用 UADP／JSON，不證明任意 OPC UA Client/Server 設備可接；[buy-options.md 第82行](../../10-facts/buy-options.md#L82) 也區分 NGSI-LD 與 NGSIv2 實作。具體 PLC／MES 相容性未查證。

**修法與代價（可修）。** 訂單逐項選定 UA 模式及 NGSI 版本，另估南向 connector、北向唯讀投影與 ID／型別／單位映射，保留 ERP desired owner（F-03、F-34、N-05）。每方言先留 1～3 人週探索額度，實機後重估；未成交前不新增 runtime。

### ecosystem-08 | 重大 | 客戶 IT 的准入條件不能等安裝時才談

**情境與失敗步驟。** (b) D-01 與 (c) D-06。P6 已承認 Stage 0 需 IoT 到 ERP 規則、pin 遇 TLS inspection 需 bypass；缺的是誰在報價前確認接受。IT 拒絕時，照 Stage 0 交付就卡在連線准入；標案要求具名 HMI 互通時，「支援 MQTT」勾選也不能替代驗收。

**依據。** M-03、M-05、M-06、N-01、N-18、C-24；P6 §7、§8.5。這是商務准入缺口，不重複 security-06 的技術成因；帳本「HTTPS 不需客戶讓步」不適用於本案。

**修法與代價（可修）。** 報價附階段選擇表、流向與埠、inspection 條件、broker 管理權、consumer scope、資料匯出、授權清單與支援責任。拒絕直連就評估已有的 Stage 1b，其他不通過項先停交付；約 0.5～1 人週準備，客戶協調時間另列且目前未知。

### ecosystem-09 | 次要 | 延後付款不是已知下一步的完整成本

**情境與失敗步驟。** (a) D-01 成交後轉入 (b)(c) D-06。P6 §9.1 已誠實排除 Stage 2／3，不應再指它隱瞞；但 §9.3「等有對象再做不會變得更貴」缺少證據。拿第一期人週承諾下一期交期時，設備 profile、HMI adapter、三出口授權與客戶 IT 聯測仍無預算 owner。

**依據。** M-01、M-02、R5、R8；P6 §9 與帳本 §5 的「只付一個 runtime」不足以計整合成本。買平台也不是免費退路：[buy-options.md 第25行](../../10-facts/buy-options.md#L25)、[第26行](../../10-facts/buy-options.md#L26) 記載 ThingsBoard BSL 及摘要中的使用限制，實際合約仍須另查。

**修法與代價（可修）。** 第一筆 D-06 訂單前拆列共用框架、每型號、每 consumer、每站聯測與持續支援；約半人週整理，實作取前述工作去重後估算。保留第一片螢幕省掉 broker、通用 consumer API 與平台部署的收益，不宣稱總生命週期更便宜。

## 此點成立

- **P6 此點成立：** (a)(c) D-01 的單螢幕不必先裝 MQTT 或歷史庫（F-15、N-13）；(b) 所需隔離工件必須在該站上線前完成，不能用分期取消錨點。
- **P6 此點成立：** desired／actual 與結果 owner 不依賴 MQTT。[precedents.md 第37行](../../10-facts/precedents.md#L37) 的 Balena 輪詢支持傳輸選擇有先例，但不是 HMI 延遲或本案安全性已通過的證據。
- **P6 此點成立：** 需要 MQTT 時選真實 broker 的方向有根據；[zenoh.md 第46行](../../10-facts/zenoh.md#L46)、[第47行](../../10-facts/zenoh.md#L47)、[第48行](../../10-facts/zenoh.md#L48) 的原碼推論顯示翻譯 plugin 有 QoS、topic 與授權限制，仍待 PoC，不能當等價替代。
- **P6 此點成立：** broker 留在站內資料面可取得扇出與晚加入者快取，而不把管理面搬過去；放棄的是現成工具入口，保住的是小部署與單一管理路徑，不是省掉 schema、授權和應用語意。

## 最難的問題

第一個 D-06 客戶要求斷 WAN 照常顯示、既有 HMI 不改且新增 MES 只讀指定產線時，你能交出哪份已驗證的互通契約與完整報價，證明 Stage 2 真的是加法？