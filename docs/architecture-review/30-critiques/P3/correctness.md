結論先講：致命 0 條、重大 10 條、次要 0 條。P3 選對耐久零件，也沒有把 publish ack 當完成；不足的是 owner 之間的提交、重讀與淘汰契約，因此「B 類問題結構上消失」尚不成立。這些是可補的應用層缺口，不是 NATS 必然不能用。

本篇為 2026-10-11 獨立 correctness 審查。節號指 [P3](../../20-proposals/P3-nats-leaf.md#L168)；需求以 [../../00-requirements.md](../../00-requirements.md) 為準。已讀 [security.md](security.md)、[longevity.md](longevity.md)，不重列其 ACL、PKI、升級與 source 還原問題。D-05 不審鎖的控制通道。反例皆為設計推演，非已執行測試；成本為估算、不可直接相加。要求 strongest/high，但 host 為 inherited default、無 effort 控制，無法證實套用。

裁決採保守門檻：只有在部署錨點無法成立時才列致命；本篇重大項目指明目前文字尚不能保證的行為，不能當成已發生的產品事故。下列反例的解除條件，是補出同一組中斷前後可重讀的狀態與恢復規則，而不是單靠延長保留期或增加重送次數。

## 證據邊界

下表均沿用事實檔 2026-10-10 的查證，未另查網頁。JetStream exactly-once 的完整 API 條件未查證；即使訊息去重成立，也不能推出實體副作用與 CQ 原子提交。

| 證據 | 實際位置 | 可支持的範圍 |
|---|---|---|
| S1 | [nats.md](../../10-facts/nats.md#L26)，第 26 列 N6 | domain 隔離；mirror/source 複製持久資料；已複製資料可離線讀。不是跨應用交易。 |
| S2 | [nats.md](../../10-facts/nats.md#L27)，第 27 列 N7 | KV 的 CAS、watch、history；不保證 read-your-writes；Object Store 採 chunk。 |
| S3 | [nats.md](../../10-facts/nats.md#L28)，第 28 列 N8 | fsync、資源限額及有限 duplicate window；不是裝置執行紀錄。 |
| S4 | [nats.md](../../10-facts/nats.md#L30)，第 30 列 N10 | MQTT retained/session 持久化；不能據此把重送值當新量測。 |
| S5 | [mqtt-semantics.md](../../10-facts/mqtt-semantics.md#L53)，第 53 列 MQ14 | Azure twin 的版本、完整重取與通知競態處理，原文來源。 |
| S6 | [mqtt-semantics.md](../../10-facts/mqtt-semantics.md#L65)，第 65 列 MQ18 | Sparkplug BIRTH 宣告型別；拒絕未知 metric 仍須 host 自定，原文來源。 |
| S7 | [precedents.md](../../10-facts/precedents.md#L42)，第 42 列 e15 | Apple MDM 快取結果、按 UUID 關聯；其 Acknowledged 是應用結果，非 transport ack。 |
| S8 | [precedents.md](../../10-facts/precedents.md#L44)，第 44 列 e17 | list/watch、斷線續接或重新 list 的明確恢復契約，原文來源。 |

## Findings

### correctness-01 | 重大 | ERP 提交到 SQ/KV 缺恢復界線

情境：(a)(b)(c)，D-01、D-04。失敗步驟：ERP 已提交 Apply，adapter 在 publish 前 crash；§4.1 雖保留 Odoo row，卻未定重啟如何找出未投影項目。CAS 只保護 KV 更新，不連帶提交 ERP；反向先 publish 又可能留下回滾後的命令。依據：F-46、N-05、C-20、S2。可修：業務交易內寫 outbox，交易外投影；保存版本及待送狀態，重啟批次對帳，不在使用者交易內呼叫遠端。代價：1 至 2 人週。

### correctness-02 | 重大 | job key 未封住副作用與 CQ 的 crash 空窗

情境：(a)(b)(c)，D-04。失敗步驟：backend 已執行 job，unit 在 CQ 落盤前斷電；重啟只見 key 無終態。先標已做可能漏做，事後標記可能重做；§4.1 的「同時留 SQLite」未定此界線。依據：F-47、F-51、S3、S7。可修：耐久 inbox、執行狀態及 CQ outbox，backend 接受同一 key 並可重讀結果；否則改為可收斂 intent，或明報 unknown 並禁止盲重試，不能承諾任意實體 exactly-once。代價：每 backend 1 至 3 人週。

### correctness-03 | 重大 | 結果存在 SQLite 不等於 ERP 能補讀

情境：(b)(c)，D-01、D-04。失敗步驟：bridge 中斷時 unit 寫好 CQ，重連後沒有指定誰掃描 SQLite 重發；§4.2 的 subject 名稱不是批次重讀 API。另一空窗是 root 消費 CQ 後、ERP 提交前 crash。依據：F-46、F-49、S1、S7、S8。可修：本地結果先耐久提交，批次同步 cursor、缺口重掃；ERP 以 key 冪等提交後才確認消費，啟動時重建 actual/presence 快照。代價：1 至 2 人週。

### correctness-04 | 重大 | timeout 不是取消，single-flight 缺解除條件

情境：(b)(c)，D-04。失敗步驟：A 已開始但結果斷線，root 到 deadline 標 timeout；若釋放 slot 發 B，A 仍可在 B 後完成。SQ 保留 8 天也不等於每個 job 到 deadline 即不可起跑。§4.1 已指定 owner，欠的是執行規則。依據：F-50、F-51、F-64。可修：耐久 flight 紀錄、裝置序號/fence、起跑前驗 deadline；unknown 未解除前阻擋相衝突工作，遲到 CQ 補記事實。代價：1 至 2 人週及明確的可用性取捨。

### correctness-05 | 重大 | intent 的拒絕與覆寫無法完整關聯

情境：(a)(c)，D-01。失敗步驟：已套用 v1，拒絕 v2，後來套用 v3；ERP 此間停機。§4.1 actual 只留最新，且只有 version_applied，不能表示拒絕的是哪個 requested version。版本相等修了 B-03，卻不能替 B-02 清掉 applying 或還原 v2 結果。依據：F-49、F-53、F-54、S2、S5。可修：加入 observed_version、status/reason，耐久保存終態轉變；被合併的 intent 明列 superseded，不偽稱成功。代價：約 1 人週。

### correctness-06 | 重大 | schema 宣告沒有資料放行屏障

情境：(b)(c)，D-02、D-03、D-06。失敗步驟：announce 更新尚未提交或同步，首筆新型別量測已進 MEAS；T2 直寫 stream，T1 雖有驗證器，亦未定 producer 何時可送新 schema。§3.2 與 §4.1 沒有把 TOPOLOGY 接受與資料放行連起來。依據：F-11、F-31、F-32、S1、S6。可修：schema_version、接受回覆、producer 等待與耐久暫存；bridge/writer 都驗 id 與版本，拒絕未知屬性，不自動建型別。代價：1 至 2 人週。

### correctness-07 | 重大 | 文件尚未就緒就看見新 desired

情境：(b)(c)，D-01。失敗步驟：DESIRED 已到，DOCS 尚未完整同步即斷 trunk；即使補 security-03 的 hash，也只能拒絕壞文件，不能保證新舊畫面切換。§4.1 未定 requested version 的服務規則與舊 assets 的保留條件。依據：F-56、F-60、N-11、S1、S2。可修：版本固定的 manifest、完整就緒後才啟用；unit pin 最後可用文件與 assets，失敗保持原畫面，指定版本取不到就拒絕。代價：1 至 2 人週及雙份快取空間。

### correctness-08 | 重大 | 保留數字未形成安全淘汰契約

情境：(b)(c)，D-04。失敗步驟：SQ 尚在 8 天內，unit 已完成逾 1000 筆；若 dedupe 隨 CQ 淘汰，adapter 過 10 分鐘再送舊 key 就可能重做。P3 未定獨立 tombstone 期限；不是「10 分鐘到必重做」。依據：§4.1、F-46、F-51、S3。可修：按所有合法重送/還原路徑定 dedupe horizon，禁止過期重試；結果可淘汰但不得抹除防重證據。以每 owner 的最舊未確認年齡、容量與缺口計數監控，不能只看 first_seq。代價：約 1 人週。

### correctness-09 | 重大 | 有 device_ts 但沒有有效時間的判準

情境：(b)(c)，D-02、D-03、D-06。失敗步驟：N-14 已知的零時間或校時跳變進入量測與 presence；未來時間可讓失聯裝置久不變 offline。§5 已拒絕把 retained 當新值，但那不等於時鐘可信。依據：F-02、F-27、N-14、S4。可修：明定時間源、clock_quality、boot/seq 與偏差上限；無效時間標 unknown，保留原始 sample time，接收時間另欄，不冒充量測時間；存活另以有效現場回報及單調經過時間約束。代價：0.5 至 1 人週。

### correctness-10 | 重大 | PG 提交後 ack 前重放可重複計量

情境：(b)(c)，D-02、D-03、D-06。失敗步驟：§5 writer 已 commit PG，ack 前 root crash；恢復若重放，窄表與增量 roll-up 未指定冪等鍵，可能重複插入、重複累加。這是跨儲存提交推論，不宣稱某版 NATS 必然如此重投。依據：F-08、F-11、N-05、S1。可修：在來源建立穩定 sample_id，插入去重與 roll-up 水位同交易；提交後 ack，錯誤隔離可重試，不把接收時間當 key。代價：約 1 人週。

## F-46 至 F-54 逐條

| ID | 裁決 | 仍需證明的步驟 |
|---|---|---|
| F-46 | 部分成立 | owner 已列；ERP commit 後、unit CQ 本地完成後的恢復缺口見 correctness-01、correctness-03、correctness-08。 |
| F-47 | 分類成立、執行證據不足 | state intent/job 分開；effect/CQ 邊界見 correctness-02，intent 終態見 correctness-05。 |
| F-48 | 部分成立 | root 簽章方向正確；沿用 security-01、security-02、security-03、security-09，未新增同類 finding。 |
| F-49 | 部分成立 | CQ_ALL 提供通用入口，不能替代 ERP commit 或已被覆寫的 intent 結果；correctness-03、correctness-05。 |
| F-50 | 詞彙成立、恢復未閉合 | ack 非完成已說對；root 停機跨 deadline 要補跑判定，timeout 不是未執行，見 correctness-04。 |
| F-51 | owner 成立、協定不足 | SQLite dedupe、root single-flight 已有；crash、timeout 與 GC 後仍須 correctness-02、correctness-04、correctness-08。 |
| F-52 | 此點成立 | publish ack 與 CQ 分開，長 reconcile 不阻塞投遞；SQ 消費確認仍須先耐久收件，見 correctness-02。 |
| F-53 | 此點成立 | §4.2 明定讀 backend 回值、回 error/rejected；crash 後無回值應是 unknown，不能捏造成功。 |
| F-54 | 原則成立、觀察不足 | 已保留拒絕與 last-known-good；拒絕版本及內容啟用仍須 correctness-05、correctness-07。 |

## 中斷與窗口

| 中斷點 | 尚在保留期內的判定與恢復要求 |
|---|---|
| ERP crash | 已提交命令不可只等下一次 UI 操作才 publish；結果寫 ERP 失敗不可先確認，見 correctness-01、correctness-03。未提交的操作須回報未接受。 |
| bridge crash | 已複製的 SQ/DOCS 與 unit last-known-good 是有用基礎；unit 本地 CQ 必須能重送，不能把 leaf 重連當補讀完成，見 correctness-03。 |
| unit crash | backend effect 前後各有空窗；恢復依耐久 key/執行證據，不依 publish ack，見 correctness-02。 |
| 網路 disconnect | 區分 unit 到 bridge 與 bridge 到 root；後者的 7 天緩衝不能保證前者。離線保持舊行為成立；未上傳 CQ、資料與文件就緒分別見 correctness-03、correctness-07、correctness-08。 |
| N-09 備份還原 | 沿用 longevity-05 的 source 序號問題，產品行為仍未查證。不接受「清空 bridge 就算恢復」直接通過 F-46：MEAS/EVT 尚無完整 unit owner 保證。另須驗舊 SQLite 不因遺失已執行 key 而重跑 job；見 correctness-02、correctness-08，非重列 source 問題。 |

| owner/窗口 | P3 已寫 | 正確性缺口與可觀測條件 |
|---|---|---|
| ERP desired/SQ | row 永久；KV history 1、max_bytes 要明設 | 待投影版本、outbox 年齡；correctness-01。 |
| SQ / publish dedupe | 最長 deadline + 1 天，設計 8 天；10 分鐘去重窗 | 單筆 deadline 在 edge 起跑前判定；10 分鐘外靠裝置紀錄；correctness-04、correctness-08。 |
| CQ / unit dedupe | stream 90 天、每 subject 1 筆；SQLite 1000 筆或 90 天 | 容量可先耗盡；未確認結果、獨立 tombstone、drop 範圍與 ERP 缺口；correctness-03、correctness-08。 |
| ACTUAL / desired 快取 | history 1；SQLite 永久留最後 actual 與 last-known-good | 終態轉變的保留及 superseded 語意；correctness-05。 |
| MEAS | bridge 7 天；PG 3 年 | unit 斷 bridge 的緩衝、root MEAS_ALL 上限未定；容量上限與最舊未入庫時間須監控；correctness-08、correctness-10。 |
| 業務 EVT | D-05 有 durable EVT stream；D-02 門檻事件只列 subject | D-05 事件的保留/確認期未定；D-02 未指定 durable owner，不可用通知取代耐久事實。須納入 correctness-03 的同步契約。 |
| PRESENCE / TOPOLOGY | 心跳 120 秒、history 1；F-27 離線門檻可設 5 分鐘 | 啟動完整快照、schema 版本屏障、時間品質；correctness-03、correctness-06、correctness-09。 |
| DOCS / watch | ERP 版本決定快取；max_bytes 明設；revision 水位 | last-known-good pin、cursor 失效後完整重讀規則未定；correctness-03、correctness-07。 |
| REGISTRY | 最後鏡像離線放行；授權 expiry 設計 1 小時 | 鏡像最大陳舊期及撤銷期限沿用 security-04；不宣稱連線斷開能力已驗證。 |

## B-01 至 B-14 逐條

| ID | 裁決與去向 |
|---|---|
| B-01 | unknown/error 分離、ERP row 永久已修原分類；結果關聯與遲到 CQ 仍須 correctness-03、correctness-04。 |
| B-02 | 版本不等只代表未同步，未必能清 applying；拒絕終態見 correctness-05。 |
| B-03 | version_applied 比較修原本 stale OK；不重提原 bug，其他 intent 結果問題見 correctness-05。 |
| B-04 | 指定文件版本或拒絕未寫成服務契約；correctness-07。 |
| B-05 | 通用 CQ_ALL 修只訂部分命令的設計；斷線補讀不能省，correctness-03。 |
| B-06 | §4.2 明讀 backend 回值並報 error，原 bug 已處理；不是 correctness-02 的 crash 問題。 |
| B-07 | 非同步 reconcile 與 CQ 分離，原同步 timeout 問題已處理。 |
| B-08 | job_key 必填已補；副作用空窗與 GC 後防重仍見 correctness-02、correctness-08。 |
| B-09 | capability 隨 announce 的路徑已補；即時 schema/capability 接受屏障見 correctness-06，缺值不得視為全部允許。 |
| B-10 | backend localhost 已補；monitoring、文件驗證等沿用 security-03、security-10。 |
| B-11 | 改成連線授權錯誤可見，不等於已驗 agent 分類與在線撤銷；沿用 security-04，API 行為未查證。 |
| B-12 | 不再靠舊 admin POST-only；schema live update 仍須 correctness-06，權限面沿用 security-02。 |
| B-13 | §8.10 已承認新 process 啟停順序面積並列 e2e；未執行，不重列 finding。 |
| B-14 | applied-version 與 CQ 耐久槽已補；ERP/bridge 停機後恢復仍須 correctness-03、correctness-05。 |

## 此點成立

- 此點成立：ERP version 放 payload，KV revision 只作 CAS/水位；已承認無 read-your-writes，不再拿它當新發現（S2、S5）。
- 此點成立：unit 保有 SQLite；leaf domain 及 mirror/source 提供離線零件，不要求 broker 保證實體 exactly-once（S1）。
- 此點成立：10 分鐘 dedupe、8 天 SQ、90 天 CQ 已明寫；單副本 leaf 採 sync_interval=always，不再批評它仍用預設值（S3）。
- 此點成立：傳輸確認、工作完成與 backend error 已分開；F-52/F-53 的方向應保留。

## 最難的問題

當 D-04 的副作用已發生而 CQ 尚未落盤，重啟或還原後，你用哪個可重讀證據決定不重做，又如何在 ERP 誠實區分完成、未執行與 unknown？