結論先講：致命 0 條、重大 10 條、次要 0 條。P4 值得保留為採購候選，但平台 status 不等於端到端 job 正確性；目前不能接受「多項 B-ID 結構上消失」。以下是可修的契約與證據缺口，不以購買平台本身判退場。

日期：2026-10-11。角色：P4 correctness，依 A.1。模型請求 strongest/high；實際可見為 default，effort 不可見，未宣稱已套用。本文未執行產品或網路查證；本地事實紀錄日期為 2026-10-10，保留其搜尋摘要等限制。P4 的配置是審查對象，不是產品驗證；無事實來源支持的行為均為未查證。D-05 僅管理面，D-06 不下發控制。

## Findings

### correctness-01 | 重大 | ERP 提交窗口沒有穩定業務 key

情境與壞步：(a)(b)(c)，D-04。平台已建 RPC，ERP 未記回 id 就 crash；重試若取得新 id，unit 的 RPC-id 去重便失效。反之平台尚未收件、ERP 又未保存提交紀錄，工作沒有 owner。

依據：[P4 §4.1](../../20-proposals/P4-buy.md#L123)、F-41、F-46、F-47、C-20。可修：業務提交同交易記 outbox，commit 後才呼叫平台；固定 job_key 隨 params 到 unit，平台 id 只作映射，恢復後先對帳。代價是提交紀錄與重試狀態機，不能只有 REST wrapper。

### correctness-02 | 重大 | 選定部署尚未證明耐久交接

情境與壞步：(a)(b)(c)，D-04。在收件回覆與 RPC 落盤之間殺 server，或 Edge 收件後尚未耐久保存就重啟；哪個 owner 能重建待辦未交代。已存 RPC 也須證明遺失排程通知後會重掃。

依據：[P4 §2](../../20-proposals/P4-buy.md#L28)指定 `TB_QUEUE_TYPE=in-memory`；[T7](../../10-facts/buy-options.md#L30)只有連線摘要，未證明交接。[N8](../../10-facts/nats.md#L28)提醒持久化取決於配置，不可把其他產品的保證移植過來。實際窗口未查證。可修：釘版本查寫入與回覆次序，驗證重啟重掃；不足才補持久排程。代價是同配置的 crash 測試，不能偷換 queue backend。

### correctness-03 | 重大 | SQLite 與物理效果之間仍有 crash gap

情境與壞步：(a)(b)(c)，D-04。LED 已播放或 playlist 已加入項目，結果尚未 commit 就斷電；重送會重做，預先記 completed 則可能根本未做。

依據：[P4 §4.1](../../20-proposals/P4-buy.md#L123)、F-47、F-51、B-08；七日結果槽只補「結果已存」那側。可修：key 傳到可冪等的 backend，或改成有穩定項目 id 的 state intent；不可冪等者將 running 復原成 unknown，禁止自動重跑，人工核對。代價是 backend 改造或犧牲自動恢復，不能承諾通用 exactly-once。

### correctness-04 | 重大 | 平台終態不等於業務終態

情境與壞步：(a)(b)(c)，D-01、D-04。connector 先回收件成功，backend 後來報錯；或投遞逾時後仍完成。直接把 status 映成業務成功或未執行，會重現 B-01、B-02、B-06。

依據：[P4 §4.4](../../20-proposals/P4-buy.md#L156)、F-50、F-52、F-53、F-54；error response 是否使平台標 FAILED 未查證。可修：耐久入列即完成 delivery，worker 另跑；completion 必須含 key、版本與 backend outcome；拒絕與延後分列，失聯為 unknown，deadline 後 timeout 仍非「未執行」。代價是錯誤映射與非同步測試；兩個 status 欄位本身不會修 B-07。

### correctness-05 | 重大 | single-flight 未涵蓋重啟與兩條命令路徑

情境與壞步：(b)(c)，D-04。job A timeout 但仍執行，ERP 重啟後發 B；shared profile 又由另一條路先到，A 在新 profile 上執行。只限制「未終結 RPC」不足。

依據：[P4 §4.1](../../20-proposals/P4-buy.md#L123)、F-51、F-64。可修：ERP 耐久保存 per-unit 執行槽與 seq，unit 拒絕舊 generation；相關 RPC 帶 profile_version 前置條件，timeout 不自動解除 unknown 的執行隔離；無順序要求的 state 可合併。代價是阻塞時的核對與解除流程，排序不交給 broker。

### correctness-06 | 重大 | 版本比對尚未保證內容與快照一致

情境與壞步：(a)(b)(c)，D-01。舊快照晚於新通知到達而倒退；要求 V1 的 route 卻回 V2 文件，connector 仍報 applied V1；Apply 若同時驅動 attributes 與 RPC，也可能重複 reconcile。

依據：[P4 §6](../../20-proposals/P4-buy.md#L197)、F-47、F-54、F-60、B-03、B-04；[MQ14](../../10-facts/mqtt-semantics.md#L53)記載 Azure 的訂閱後取完整版本程序，不是 TB 保證。可修：版本與文件 hash 成一個一致物件；unit 拒絕倒退，文件版本不符即拒絕；ERP 比對自身 desired，Apply 只走一條 reconcile。代價是版本化文件與重連競態測試。

### correctness-07 | 重大 | 結果保存與輪詢沒有接成恢復協定

情境與壞步：(c)，D-04。ERP 停機超過 RPC 的保留窗口；或先存 cursor、尚未存結果就 crash。恢復只見缺項，unit 七日 SQLite 雖有結果卻未定義如何按 key 重讀回來。

依據：[P4 §4.3](../../20-proposals/P4-buy.md#L143)、F-46、F-49、F-67；[e15](../../10-facts/precedents.md#L42)的結果快取與重送才是完整類比。[longevity-04](longevity.md#L67)建議丟掉 in-flight 後標 unknown，仍不能免除可重讀責任。可修：批次重讀 owner，key 去重，cursor 與入庫同交易；投遞期限與結果保留分開，超窗留下缺口與計數。代價是 replay 路徑，不另設 per-command poll loop。

### correctness-08 | 重大 | 離線冷開與同步缺口尚未封閉

情境與壞步：(b)(c)，D-01、D-06。WAN 斷線時 Edge 與 CM4 冷開，只留版本卻無本地文件或 id map，畫面無法恢復；重連補舊事件還可能蓋掉較新的 actual。

依據：[P4 §4.3](../../20-proposals/P4-buy.md#L143)、N-11；超過一月後 shared attributes 全量同步，提案已標未查證。可修：unit 耐久保存最後可用文件、id map 與 actual；新文件取不到則 defer，不清空舊畫面；快照版本與 cursor 偵測缺口。Edge 未上傳資料不能當可丟 cache。代價是空間配額與斷網冷開測試，下表窗口必須共同驗收。

### correctness-09 | 重大 | 收到緩衝資料不代表裝置現在活著

情境與壞步：(b)(c)，D-02、D-03、D-06。補傳昨日量測觸發 active，但感測器已死；NTP 回零或時鐘跳向未來，舊值仍顯示新鮮。

依據：[P4 §4.2](../../20-proposals/P4-buy.md#L131)、[P4 §5](../../20-proposals/P4-buy.md#L174)、F-02、F-04、F-27、N-14；支援 payload ts 在提案仍未查證，僅有欄位也不夠。可修：保留最近感測端的 source_time、ingest_time 與 clock quality，錯時不得用接收時間補成新量測；心跳另帶 boot id、seq，僅合格新心跳更新存活，warm-up/fault 要可見。代價是時鐘門檻與補傳測試。

### correctness-10 | 重大 | schema 與 capability 仍可能先後顛倒

情境與壞步：(a)(b)(c)，D-02、D-03、D-04。ERP 已更新 schema，Edge 還用舊 filter，unit 先送新 key 被丟；錯型別即使成功 insert，量測意義仍錯。空的 supported_effects 仍可能讓 ERP 接受所有 effect。

依據：[P4 §5](../../20-proposals/P4-buy.md#L174)、[P4 D-04](../../20-proposals/P4-buy.md#L203)、F-06、F-11、F-31、F-32、B-09。可修：先耐久宣告與核准 schema_version、型別、單位，才放行資料；未知 id/key 拒絕且計數，過渡期兼容舊版，來源有界緩衝待重送；capability 缺失或過期即拒絕新命令。代價是分階段更新與負向測試，不能用 schemaless 等同無損演進。

## Retention 驗收

以下數值只是 [P4 §4.3](../../20-proposals/P4-buy.md#L143)的配置主張，非本次產品實測；修正規則為本審查建議。結果保留須涵蓋允許的 ERP/站點離線、補傳及對帳時間；dedupe/tombstone 須涵蓋全部重送與還原窗口，否則停止自動重跑並明示 unknown。

| window | P4 已寫 | 尚缺規則與可觀察性 |
|---|---|---|
| ERP 提交與 RPC 映射 | 未寫；F-67 inbound 原有 2 天 | 不可在結果對帳前刪除；submission age、未映射數、cursor lag |
| RPC | LED 10 min、Apply 24 h；清理每 2 h | execution deadline 不等於 result TTL；終態清除行為未查證，需超期、缺結果計數 |
| server → Edge | 2,628,000 s | 全量同步未查證；cursor 缺口必須可見，重讀目前 desired 而非重演全部過期 job |
| Edge → server | cloud_events TTL 未查證 | 明訂時間、bytes、滿額策略；oldest age、drop、replay lag；不能丟尚無上游副本的事件 |
| Gateway 緩衝 | 改 sqlite、7 天 | 100,000 是提案所引 memory 配置，不能當 sqlite 容量保證；按實際批次/bytes 驗收，監控滿額與丟棄 |
| unit 結果與 dedupe | SQLite 7 天 | 明訂起算點、durable commit、重送上限、結果與 tombstone 清理條件；過窗不得當新 job |
| desired、actual、文件 | 未寫本地保留規則 | 最後可用版本不得因通知 TTL 清掉；文件容量、hash、缺件、過期 token 都須可見 |
| telemetry | 1095 天 | 明訂 source time 截止、遲到資料與清理邊界；drop 計數，命令 blob 不進量測表（F-12） |
| WebSocket | 每 session 1,000 則 | 不是耐久 owner；滿額或重連應重取快照，HMI 顯示 stale，不能宣稱完整事件史 |
| inactivity | 300 s | 這是判活窗口非保存期；補傳不可刷新，錯時與未知狀態另列（correctness-09） |

## F-46 至 F-54 裁決

依 [需求命令契約](../../00-requirements.md)逐條；「部分」表示設計方向可用，不表示產品已通過驗收。

| ID | 判定 | 對應與必要條件 |
|---|---|---|
| F-46 | 未證成立 | correctness-01、02、07、08；ERP/server/bridge/unit 與網路各斷一次仍有 owner 可重讀 |
| F-47 | 部分 | correctness-01、03、06；每命令只有一種模型，穩定 key 或版本化 intent |
| F-48 | 部分 | 沿用 [security.md](security.md) 的 security-01、03、05；每跳 parent 驗證、收件者授權與結果歸屬不能由 status 推得，D-05 管理設定亦同 |
| F-49 | 未證成立 | correctness-04、07；每種 LED 命令的成功、失敗、拒絕、延後、晚到結果皆需關聯原命令 |
| F-50 | 未證成立 | correctness-04、05；投遞未知與執行失敗分開，deadline 不證明未執行 |
| F-51 | 部分 | correctness-01、03、05、07；key、durable single-flight、過期與 dedupe 各有 owner |
| F-52 | 部分 | correctness-04；callback 不等待 reconcile，入列與完成各有耐久紀錄 |
| F-53 | 部分 | correctness-04；backend error 是業務 outcome，不靠 HTTP/MQTT 或 RPC status 猜測 |
| F-54 | 部分 | correctness-03、04、06、08；裝置可拒絕或延後，重複 intent 不累積副作用 |

## B-01 至 B-14 對照

依 [既有 bug 清單](../../00-requirements.md)，不把未驗證項目當作消失。

| ID | P4 尚需的處置 |
|---|---|
| B-01 | 仍可重現：例外不得直接判 error；命令與結果需耐久關聯及保留（correctness-01、04、07） |
| B-02 | 仍可重現：dispatch 失敗或 defer 要能退出 applying，並呈現 unknown/拒絕/失敗（correctness-04） |
| B-03 | 部分改善：applied version 比對正確，但仍須一致快照與內容版本，不收舊 OK（correctness-06） |
| B-04 | 未處理：既有文件 route 必須回指定版本或拒絕，不可只信 URL/token（correctness-06） |
| B-05 | 不能只數 RPC rows：四種 LED 命令都須驗證 response、錯誤與 ERP 關聯（correctness-04、07） |
| B-06 | 仍可重現：custom connector 必須讀 backend 結果並保存 error（correctness-04） |
| B-07 | 未證消失：長 reconcile 必須移出 delivery callback，壓測時心跳仍可處理（correctness-04） |
| B-08 | 未消失：RPC id 非業務 key，且物理效果與結果落盤仍有窗口（correctness-01、03） |
| B-09 | 未證消失：capability 空、舊、缺失時須拒絕，而非允許全部（correctness-10） |
| B-10 | 沿用 [security.md](security.md) 的 security-02、09、11；localhost 規劃不替代網路面與文件來源驗證 |
| B-11 | 仍未查證：CONNACK 拒絕須呈現 rejected，失聯呈現 unknown；皆不得作破壞性操作的授權 |
| B-12 | 待驗收：預建與更新由管理側做，裝置不可接 admin plane；live schema 更新見 correctness-10，provisioning 邊界見 security-04 |
| B-13 | 未證消失：新 deploy 的 stop/ExecStop、crash restart 與停止後無下行，仍需 N-07、N-18 驗收；更換平台不會自修 packaging |
| B-14 | 僅補欄位：applied 的耐久回報、版本檢查、ERP 停機後重讀都須成立（correctness-06、07、08） |

## 此點成立

1. 此點成立：業務 desired 留在 Odoo，平台可作鏡像；多一份副本本身不違反 N-05，writer 與重建規則才決定是否雙真相。
2. 此點成立：以輪詢重讀取代只靠 webhook，是 F-46 的正確方向；補齊 cursor 與保留協定後，無須要求每次通知送達。
3. 此點成立：P4 明說 connector 要做去重與結果保存，且提出 applied version；批評針對尚缺的跨層契約，不否定平台零件或要求重造 broker。

## 作者最怕的問題

請用選定版本與 in-memory 配置示範：同一 LED job 在 ERP 回覆遺失、server/Edge 重啟、backend 已動作但 SQLite 未記結果，以及離線超過 retention 後，哪個 owner 還能按同一 key 說明狀態，且不重複效果、不把 unknown 當未執行？