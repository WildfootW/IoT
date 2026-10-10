結論先講：致命 0 條、重大 12 條、次要 0 條。P5 分離語意與傳輸的方向成立，但「有 owner、version、CQ」尚未封閉崩潰、重同步與回放的窗口，不能接受其正確性全數成立的判定；問題可修，不足以否定整個方案。

# P5 正確性批評

日期：2026-10-11。需求以 [../../00-requirements.md](../../00-requirements.md) 的 ID 為準。本文是規格反例與修補建議，不是程式缺陷的實測報告。所引事實檔原查證日均為 2026-10-10，本次未重新網路查證；實作、硬體與故障注入結果均未查證。

(A) 指契約、語意核心及 conformance；(B) 指第二個生產 MQTT binding。停做 (B) 不能修掉 (A) 的缺口。以下不重列既有安全評論的簽章、撤銷問題，或維運評論的備份工具、OTA 問題。

## Findings

### correctness-01 | 重大 | ERP 接受與結果入帳沒有耐久交易邊界

情境：(c)、D-04，ERP 在業務提交後、SQ 建立前崩潰。斷點：[P5 §4.1](../../20-proposals/P5-pluggable-transport.md#L196) 指定 owner，卻未定義何時可向操作者聲稱「已受理」；分開提交便會留下成功畫面而無待辦。反向若先推進 CQ 讀取游標再提交結果，ERP 重啟也可能漏帳。ERP 完全停機時不能虛稱受理。

依據：F-46、F-49、F-67、C-20。可修：(A) 業務變更與 durable SQ/outbox 同筆本地交易，網路在交易外；結果入帳、命令關聯及游標同筆提交，重讀可冪等重放。代價：兩端交易設計與提交前後斷電驗收，不增引擎。

### correctness-02 | 重大 | CQ 去重跨不過實際動作與落盤之間

情境：(a)、D-04，LED playlist add 已改動 backend，unit 在寫 CQ 前斷電。斷點：[P5 §4.1](../../20-proposals/P5-pluggable-transport.md#L196) 重啟只查 CQ，查無即重做；即使先落 running，重啟也不能由此知道動作是否已做。並行重送還可能同時查無 CQ。

依據：F-47、F-51、B-08；[precedents.md:42](../../10-facts/precedents.md#L42) 只支持結果快取與 UUID 關聯，不證明實體動作原子性。可修：(A) 原子 claim，加 backend 接受相同 key 並可查結果；可宣告者改為冪等狀態收斂，不能查證的動作保留 unknown、禁止自動重做。代價：backend 協定與人工處置流程；SQLite 本身不是 exactly-once 證明。

### correctness-03 | 重大 | MQTT put 缺少 parent 耐久確認

情境：(b)、D-04，broker 活著而 bridge node 崩潰，unit 發 CQ。斷點：[P5 §3.2](../../20-proposals/P5-pluggable-transport.md#L105) 只有 PUBLISH 與訂閱落盤，沒有把 parent 已存 version 回給 child 的路徑。把 PUBACK 當確認就誤認副本已耐久；不這樣做又無法依契約停止重送。

依據：F-46；[mqtt-semantics.md:87](../../10-facts/mqtt-semantics.md#L87)、[mqtt-semantics.md:53](../../10-facts/mqtt-semantics.md#L53) 區分 broker ACK 與應用層回應。可修：(A) 定義可重讀的 durable receipt，綁 owner、slot、version、payload digest；(B) 補回應或批次對帳，同版異值不得回成功。代價：控制流及 fsync 故障驗收。

[P5 的 NATS 映射](../../20-proposals/P5-pluggable-transport.md#L112) 也不能把耐久性全歸「不保證」：[nats.md:27](../../10-facts/nats.md#L27) 的無 read-your-writes 可由重讀容忍，但 [nats.md:28](../../10-facts/nats.md#L28) 的 fsync、去重窗口不能取代 owner 耐久與 job 去重。只撤回「已確認映射」，不要求第三個 binding。

### correctness-04 | 重大 | 全量重同步只取 desired 仍會漏 SQ

情境：(c)、D-04，網路斷八天，第八天 ERP 新建尚在預設 24 h deadline 內的 job，unit 隨即重連。斷點：[P5 §3.2](../../20-proposals/P5-pluggable-transport.md#L106) 的舊 cursor 得到 410，卻只 GET desired；SQ 存在 owner 仍沒被取回，不能把這條路稱為全量。

依據：F-46、F-51；[precedents.md:44](../../10-facts/precedents.md#L44) 的 list/watch 帶共同 resourceVersion。可修：(A) 快照涵蓋所有授權 slot、刪除標記及續接 watermark；ERP 的 CQ 重讀同樣要完整。(B) 部分 retained 缺漏也要對帳，不能只靠 [P5 §8.2](../../20-proposals/P5-pluggable-transport.md#L283) 的空集合退路。代價：快照協定與競態測試，不加逐命令輪詢。

### correctness-05 | 重大 | timeout 不是停止執行的證據

情境：(c)、D-04，第一個 job 執行中斷網，ERP 到期標 timeout 後放行第二個。斷點：[P5 §4.1](../../20-proposals/P5-pluggable-transport.md#L196) 的 issuer single-flight 只管帳面；舊工作稍後完成，仍可覆蓋第二個工作的效果，跨 slot 無序更不能補救。

依據：F-50、F-51、F-52、F-64。可修：(A) 分離觀察逾時與執行終態；unit 耐久排序、序號 fencing，backend 確認舊工作結束才放行相依工作；過期且未開始者拒絕，晚到 CQ 留存真實結果。代價：不確定時犧牲可用性；fencing 也不能撤銷已發生的動作。

### correctness-06 | 重大 | retention 沒有定義刪除與防重放協議

情境：(b)、D-04，把可設定 deadline 調為 60 天，已完成 job 的 unit CQ 滿 30 天且已有超過 200 筆更新結果；舊 SQ 快取仍在。斷點：[P5 §4.2](../../20-proposals/P5-pluggable-transport.md#L213) 沒有 SQ 鏡像清除或 tombstone 規則，本地 CQ 消失後再見有效期內的舊 key，依 §4.1 會重做；bridge 的 90 天 CQ 並未接入此判斷。

依據：F-46、F-49、F-51。可修：(A) 結果內容與去重證據分開保留，tombstone 覆蓋允許的回放及還原期限，未知舊 key 不執行；(B) 同步清除 retained SQ。代價：小型耐久索引、GC 對帳及容量告警。承認窗口外丟結果是誠實，但不能讓既有 timeout 倒退 unknown，更不能默默恢復執行資格。

### correctness-07 | 重大 | 還原使 owner 版本落後甚至同版異值

情境：(a)、D-01，ERP 還原至 desired v40，unit 與 bridge 留著 v43。斷點：[P5 §3.1](../../20-proposals/P5-pluggable-transport.md#L85) 的單調比較會擋住新寫 v41；再用到 v43 時若內容不同，舊 actual 又可被誤認同步。這不是備份能否讀取，而是恢復後真相衝突。

依據：N-05、N-09、F-19、F-47、B-03。可修：(A) 以穩定 unit/function 身分、owner epoch 與 digest 辨識事實；還原後先隔離寫入並對帳，未決 job 不自動重放，不能盲採鏡像最大 version。代價：恢復狀態機、停寫窗口及新舊資料對照；path 改變不是新工作身分。

### correctness-08 | 重大 | 同版 no-op 與 applied 的條件不完整

情境：(a)、D-01，v12 已接收但下載失敗而 deferred；網路恢復後再收到 v12。斷點：[P5 §4.1](../../20-proposals/P5-pluggable-transport.md#L194) 無條件同版不做事，會永遠停在舊畫面。另一條非惡意反例：[P5 §6](../../20-proposals/P5-pluggable-transport.md#L253) 的 pointer 若回目前 v13 文件而非所求 v12，回報 applied v12 就是假同步。

依據：F-38、F-47、F-54、F-60、N-11、B-04。可修：(A) 分清 received、pending、applied；只對已驗證套用版本 no-op，deferred 可重試，refused 帶原因；文件版本固定或拒絕，驗 digest，保留 last-known-good 至新版本完整可用，重啟後讀回 backend 狀態。代價：文件快取與 reconcile 契約；不重列安全評論的內容偽造議題。

### correctness-09 | 重大 | 來源時間正確不等於時鐘有效

情境：(c)、D-02，站點 NTP 回零或跳到未來，WAN 恢復後送出累積心跳與量測。斷點：[P5 §5](../../20-proposals/P5-pluggable-transport.md#L239) 在取樣端蓋章仍會產生錯誤時間；未來心跳可使 Fleet 長期顯示在線，積壓資料也不能改蓋接收時間充新資料。

依據：F-02、F-04、F-27、N-14。可修：(A) 分列 observed_at、received_at、time_quality、boot_id 與本機單調時間；驗證時鐘來源與偏差，無效時間不作新鮮度或 deadline 依據。T1 沒有可信採樣時間時只能標未知，不能冒充收樣即採樣。代價：資料欄位、時間告警與離線顯示規則，不宣稱推得原本不存在的時間。

### correctness-10 | 重大 | cfg 與量測無序時 schema 先宣告失效

情境：(b)、D-03，schema 更新後的 meas 比 cfg 先到 bridge；或舊批次在型別改變後補送。斷點：[P5 §3.5](../../20-proposals/P5-pluggable-transport.md#L175) 說會驗 schema，卻未定義跨 slot 的宣告屏障；直接拒絕並丟棄會失資料，直接接受又違反 F-31。獨立 sensor_status 也不能判斷歷史批次當時是否 warm-up。

依據：F-11、F-31、F-32；[mqtt-semantics.md:65](../../10-facts/mqtt-semantics.md#L65) 的 Sparkplug BIRTH 不強制 host 拒絕未宣告值。可修：(A) 每批綁 schema_rev 與採樣品質，先確認宣告耐久；未就緒明確拒收但 sender 保留，舊 schema 留至積壓排空；capability 也帶版本供 ERP 驗證。代價：版本登錄、緩衝上限與混版測試。

### correctness-11 | 重大 | batch 去重與晚到彙總尚無提交規則

情境：(c)、D-06，WAN 斷 48 h 後補送量測，bridge 0 在記下 batch_id 後、寫 PG 前崩潰。斷點：[P5 §5](../../20-proposals/P5-pluggable-transport.md#L239) 若去重紀錄先提交，重送會被略過；反向分開提交則有重複窗口。[既有增量 roll-up](../../20-proposals/P5-pluggable-transport.md#L241) 也未說明晚到資料如何補入已處理 bucket。

依據：F-08、F-09、F-11、F-46。可修：(A) PG 內將去重鍵與 rows 原子提交，bridge 保留至 store receipt；以穩定來源加 batch_id 去重，標記晚到 bucket 並冪等重算。代價：writer 交易、重算水位與磁碟背壓；72 h 的 unit 緩衝不是最終儲存保證。

### correctness-12 | 重大 | 自發事件必被已發命令白名單擋住

情境：(c)、D-02 門檻事件，或 D-05 出勤事件在斷線後補送。斷點：[P5 §3.5](../../20-proposals/P5-pluggable-transport.md#L177) 規定 ERP 只收自己發過 key 的 CQ，但 [P5 §6](../../20-proposals/P5-pluggable-transport.md#L261) 的 event_id 根本沒有 SQ；照規則便丟事件，放寬全部 CQ 又破壞命令關聯。

依據：F-03、F-46、F-49、F-67。可修：(A) 宣告獨立事件類別、來源授權、耐久 event_id 與消費確認，命令 CQ 仍須配對 SQ；可以沿用 put，不必立即增第四 primitive。(B) retained=false 仍須有 owner 重讀路徑。代價：事件索引、批次恢復與去重規則；不擴張至門鎖控制。

## F-46 至 F-54 分項裁決

| ID | 裁決 | 尚未封閉的條件 |
|---|---|---|
| F-46 | 部分成立 | owner 分工合理；correctness-01、correctness-03、correctness-04、correctness-06 未封閉交易、receipt、重讀與 GC。at-least-once 只能是重試策略，不能成為唯一真相。 |
| F-47 | 部分成立 | 分類成立；correctness-02 的動作窗口及 correctness-08 的 applied 判準未閉合。 |
| F-48 | 未完整成立 | 沿用既有 security-01、security-03、security-06 的授權與簽章缺口，不另計 finding；即使修正，correctness-07 的合法舊資料恢復仍須處理。 |
| F-49 | 部分成立 | 所有 job 類型須有可查終態與版本關聯；correctness-01、correctness-06、correctness-12 不能只靠 CQ 名稱保證。 |
| F-50 | 未完整成立 | correctness-05、correctness-06：timeout 不等於 not-run，也不應因結果 GC 倒退；晚到結果與逾時紀錄須共存。 |
| F-51 | 未完整成立 | correctness-02、correctness-05、correctness-06、correctness-07：需執行 claim、單飛終止條件、去重生命週期與恢復規則。 |
| F-52 | 原理成立、實作未查證 | watch/complete 分離不等於 worker 不阻塞 watch；驗收需讓長工作卡住時 delivery、heartbeat、其他 function 仍可進行，見 correctness-02、correctness-05。 |
| F-53 | 原理成立、實作未查證 | error/refused 詞彙有了；每個 backend 的失敗、部分成功、不可判定須對應結果，不能把 HTTP 200 當動作成功，見 correctness-02、correctness-08。 |
| F-54 | 部分成立 | refusal 裁量成立；correctness-08 要區分同版已套用與同版待重試，避免 deferred 永久卡住。 |

## Retention 逐窗核對

| 物件 / owner | P5 已列 | 仍需明寫的邊界與監控 |
|---|---|---|
| desired / ERP | 最新永久 | 舊版文件與實際播放版本的引用關係；鏡像落後年齡、digest 衝突。 |
| SQ / ERP | 終態或 deadline，預設 24 h | 終態審計列保留期、鏡像刪除期限、最老未決工作；到期不是執行取消。 |
| CQ / unit | max(200 筆, 30 天) | 明定至少保留最近 200 筆及未滿 30 天者；另訂 dedupe tombstone、未被消費即 GC 計數。 |
| CQ / bridge | 90 天 | 未抵達 bridge 的結果沒有這份保險；對帳游標、缺口範圍、失聯告警。 |
| meas / unit | 72 h × 取樣率 | byte 上限、drop 範圍；每跳 bridge、writer 到 PG 的保留期與 durable receipt；晚到 bucket 重算期限。 |
| watch / parent | 7 天 | watermark 到期後完整 list 的保留及續接邊界；gap、410、重同步失敗計數。 |
| MQTT queue / broker | 5000、session 7d、persist-sqlite | queue 與 retained、tombstone 是不同窗口；應用層缺口要可見，不能把尚未查證的 $SYS 細節當驗收。 |
| 心跳 / node | 120 s、offline 5 min | 時間品質與 future skew 告警；link advisory 不冒充 online。 |
| 文件、schema、事件、rev | 未完整定義 | 文件 last-known-good pin、schema 積壓期、事件保存與消費水位；rev 新鮮度沿用 security-04；分別設 age/drop/容量告警。 |

## B-01 至 B-14 回歸核對

| ID | 判定與去向 |
|---|---|
| B-01 | 仍須修 ERP 狀態機及結果關聯；correctness-01、correctness-05、correctness-06。 |
| B-02 | P5 §8 已承認，不另計；unknown/timeout/refused 必須解除無限 applying，見 correctness-05、correctness-08。 |
| B-03 | P5 §8 已承認需核版本；同版異值及恢復還會重現，見 correctness-07、correctness-08。 |
| B-04 | 經樹拉文件不會自動修「忽略 requested version」；correctness-08。 |
| B-05 | per-key CQ 方向成立；須逐一驗證所有 LED job 的 ERP 結果路由，不只 ledConfig，見 correctness-01、F-49。 |
| B-06 | CQ 列舉不等於 backend 正確映射；仍須失敗注入，見 F-53、correctness-02。 |
| B-07 | 非同步方向成立；長工作不能占住 watch/交付處理，見 F-52、correctness-05。 |
| B-08 | 仍有動作窗口、GC 與恢復重放；correctness-02、correctness-06、correctness-07。 |
| B-09 | cfg/capability 有路徑，空值不得代表接受一切；版本未同步須拒絕或延後，correctness-10。 |
| B-10 | localhost 只處理暴露面；任意 URL 的問題沿用 security-06，不重列。 |
| B-11 | rev 有詞彙不等於裝置會收到；沿用 security-04，correctness-04 要將 rev 納入重同步。 |
| B-12 | bootstrap 不等於 live schema 更新協議；correctness-10，管理入口隔離沿用 security 評論。 |
| B-13 | 部署工件重寫不是驗證；仍須 deliberate stop/reboot/health 的 N-07 測試，未查證，不另加架構 finding。 |
| B-14 | applied 與 CQ owner 方向成立；ERP 重啟、鏡像重讀及 GC 仍須 correctness-01、correctness-04、correctness-06、correctness-08。 |

## 驗收邊界

最便宜的判別先是：八天舊 cursor 加一筆新 SQ，410 後快照是否仍看得到它；以及 backend 已動作、CQ 未提交的重啟是否再動一次。兩者都是待執行案例。

(A) 應把穩定身分、同版同值、先耐久後確認、動作不由 ACK 推定、完整重讀及有界刪除寫成 oracle；memory 也須能丟包、重排、斷電及還原。(B) 才增加 broker 存活而 node 死亡、部分 retained 缺漏與混合 hop 的同一組 trace。N-17/N-18 要驗的是這些不變量，不是三個 binding 各自回成功；本次只做文件檢查，不執行上述測試。

## 此點成立

- 此點成立：retained 只作快取、Will 只作 advisory，沒有把傳輸成功直接叫完成。
- 此點成立：desired/actual 與 per-key SQ/CQ 能避開單槽結果覆寫；保留這個模型再補交易規則。
- 此點成立：(A) 值得保留，(B) 可等觸發；先修契約不代表必須現在出貨 MQTT。
- 此點成立：P5 明列窗口並承認結果會過期，也承認 ERP 的 B-02/B-03 要修改；本評論反對的是補救已足夠的推論。

## 最難問題

同一個 LED job 在動作後、CQ 落盤前斷電，再經 ERP 還原與 binding 切換，你能指出哪份可重讀證據同時阻止重做、保留 unknown，並讓 ERP 最終如實結案嗎？