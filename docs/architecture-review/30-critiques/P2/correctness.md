結論先講：**致命 0 條、重大 10 條、次要 0 條。** P2 的 owner 分工可以保留，但「有版本、有 CQ」還不是可恢復的命令契約；尤其實體副作用與 CQ 終態之間，仍沒有可判別的崩潰恢復規則。因此不接受 P2 §4.5 九條全部成立，也不接受 interim 把語意層原封保留。以下缺口可補契約或明列保證縮限，尚不足以判定 HTTPS 樹在錨點情境必須淘汰。

日期：2026-10-11。角色：P2 correctness critic。模型要求 strongest/high；實際使用 inherited default，沒有 effort 控制，未驗證執行期型號。

依完整 [P2](../../20-proposals/P2-https-pull-defended.md#L1) 推演；第三方資料只轉引本地事實檔的 2026-10-10 查證紀錄，未另作網路複核。反例、修法與成本皆為審查判斷，**未執行實作、PoC 或故障注入**。既有 [安全批評](security.md#L1) 的簽章、授權與撤銷，以及 [維運批評](longevity.md#L1) 的 OTA、備份工具與媒體壽命，不重列為新 finding。

## Findings

### correctness-01 | 重大 | 業務提交與 SQ 入列之間仍有空窗

情境：(a) 同機，D-04。照 [P2 §8](../../20-proposals/P2-https-pull-defended.md#L342)「交易外 enqueue」的字面流程，業務提交成功，ERP 卻在 SQ 寫入前崩潰；bridge 沒有可重讀的 job，owner 表不能補回從未持久化的意圖。反向先入列再提交，則可能執行已回滾的業務操作。F-46、C-20 要求的是跨此空窗的規則，不只是禁止交易內遠端呼叫。

可修：同一 ERP 交易持久化業務變更與 outbox 意圖、固定請求 key；交易外只做搬運，重試沿用 key。ERP 已停機時不能宣稱接受新操作，須明示未受理。代價是一份 outbox 狀態及提交前後的崩潰測試，不增加服務。

### correctness-02 | 重大 | CQ 去重無法判別實體副作用是否發生

情境：(a) 同機，D-04 unit。崩潰點一在 backend 呼叫前，二在 LED playlist add 已生效、CQ 終態未落盤後；兩者都可能只留下 `accepted`。[P2 §4.1](../../20-proposals/P2-https-pull-defended.md#L209) 遇同 key 不重跑，令前者永遠漏做；掃描所有 accepted 補跑，又令後者重複。即使 CQ 完全抗斷電，兩份紀錄仍不可區分，F-46/F-47/F-51 並未成立。

可修但有限：backend 必須持久化同 key 的執行身分並提供可歸因的結果回讀，或將操作改為可收斂 state；不具此能力時保留 `unknown`、人工裁決，明列 F-47 保證縮限。backend 是否具備此能力為未查證。代價是逐 backend 的恢復契約；不能用一次 fsync 宣稱把實體效果納入資料庫交易。

### correctness-03 | 重大 | 結果淘汰同時抹掉去重證據

情境：(c) 雲端 ERP，D-04。ERP 中斷超過結果保留期，unit 已完成工作；[P2 §4.3](../../20-proposals/P2-https-pull-defended.md#L231) 淘汰 CQ 後，舊 SQ 從鏡像重現，同 key 被當成新工作。即使另補過期拒絕，原結果仍不能恢復。500 筆不是保證保留 14 天；未終態是否可淘汰也未定義。這比提案已承認「舊結果不可讀」多了一個重複副作用問題。

可修：pin 未終態與尚未完成交接的結果；去重 tombstone 與結果分開保留，其期限覆蓋全部重播來源，含舊鏡像與還原。超限須具名記錄失去哪些 key 的證據並背壓，不能只累加 `cq.evicted`。代價是額外索引、容量預算及明確的離線保證上限。

### correctness-04 | 重大 | timeout 不是取消，也不是順序釋放

情境：(b) 分 VLAN 或 (c)，D-04。job A 已 accepted、backend 尚未結束，ERP deadline 到期；若 single-flight 此時釋放，B 可以先完成，A 隨後改掉 B 的結果。若不釋放，P2 又沒有解除不確定工作的規則。[SQ 信封](../../20-proposals/P2-https-pull-defended.md#L209) 有 deadline，卻沒有執行序號與 edge 開始前的 expiry 規則。F-50 的 timeout 只是觀察事實，不證明未執行。

可修：ERP 以交易維持 per-device 排程，unit 以持久化 epoch/sequence 與單一執行槽拒絕舊工作；收到 accepted 不釋放順序，timeout 後先對帳或取得取消完成證據。已開始的效果不能靠過期回收。代價是兩端狀態機；未解除時接受阻塞，而非偷偷犧牲 F-51。

### correctness-05 | 重大 | 接收版本門檻不等於可重試的 reconcile

情境：(c)，D-01。unit 收到 V2 並保存 desired，取文件時斷網，actual 仍是 V1；若「手上版本」指已接收版本，[P2 §4.1](../../20-proposals/P2-https-pull-defended.md#L207) 的只處理新版會拒絕重送 V2。另若 V1 的慢 reconcile 晚於 V2 完成，畫面可倒退。§6 說有 applied version，沒有定義上述恢復與提交規則。

可修：持久化 desired 後，由 actual 差異持續驅動 reconcile，非由收到 frame 驅動；每 function 單一工作槽，舊工作不得覆蓋新版本。只有 backend 確認套用才更新 actual，拒絕、延後、錯誤與被取代都按版本回報。相同內容的新版本也不得重啟 show。代價是可恢復的 reconcile 狀態與 ERP 顯示規則，補 F-49/F-53/F-54，避免永久 `applying`。

### correctness-06 | 重大 | 可讀 CQ 端點缺少跨樹補齊動作

情境：(c)，D-04。unit 寫 done 後，`complete` 遇網路失敗；fetch 與 ERP consumer 仍活著，bridge 0 只有 accepted。[P2 §4.1](../../20-proposals/P2-https-pull-defended.md#L209) 只說 ERP 重啟或續接時重讀，不能保證這種局部缺項被發現。雲端的 GET 讀到鏡像，不等於已讀 unit owner；站點沒有 inbound，也未定義沿既有 fetch 發起 owner 回讀的流程。

可修：每 hop 維護耐久同步水位，重連及背景批次對帳 actual/CQ 清單；接手責任必須在鏡像提交後，不能在收到 HTTP 時。以 unit 主動補報或 fetch 攜帶批次重同步要求完成 F-46，不增加 per-command poll loop。代價是反熵流程及缺項監控。[Apple MDM e15](../../10-facts/precedents.md#L42) 的按 UUID 保留結果可參考，但不能替此多 hop 流程作保。

### correctness-07 | 重大 | cursor 未定義一致快照與提交邊界

情境：(b)，D-05 出勤事件，不涉及門鎖控制。list 讀完後、watch 建立前新增事件；若 cursor 取建立 watch 時的最新值，事件落在兩者之間而永久漏掉。ERP 若先存 cursor 再存業務列，崩潰也會跳過事件。[P2 §3.4](../../20-proposals/P2-https-pull-defended.md#L189)、[§4.4](../../20-proposals/P2-https-pull-defended.md#L241) 的「快照帶 cursor」未規定這兩個原子邊界。

可修：快照固定於 revision R，後續只接 R 之後的變更；業務列與消費水位同交易提交，以事件 key 去重。CQ 合併另需單調狀態版本，舊 accepted 不可覆蓋 done；410 必須重建至 owner 水位，不是清空游標就算完成。代價是快照契約與交易測試。[Kubernetes e17](../../10-facts/precedents.md#L44) 和 [Azure MQ14](../../10-facts/mqtt-semantics.md#L53) 都明列版本銜接，不能只借 list/watch 名稱。

### correctness-08 | 重大 | schema 先宣告缺少跨 hop 生效屏障

情境：(b)，D-03 新增差壓屬性，兼有 D-04。bridge 已登記新版 schema，但 report 先於 announce 抵達上游，上游依法拒絕新欄位，資料仍丟失。type 或單位更改後，舊緩衝又可能被新維度解讀。[P2 §3.2](../../20-proposals/P2-https-pull-defended.md#L165) 的本地拒絕與 [§5](../../20-proposals/P2-https-pull-defended.md#L265) 的新增 series 並未定義 schema revision 的交接；304 也只證明直接 parent 有快取。

可修：report 帶 schema revision，宣告耐久接受後才啟用；已核准但尚未同步的資料有界隔離，真正未知 id 仍拒絕。型別／單位變更使用不可變版本映射，舊歷史不重解讀；capability 未知或過期時不可接受所有 effect。代價是 schema 握手、版本索引與緩衝，才能同時滿足 F-06/F-11/F-31/F-32。

### correctness-09 | 重大 | 報告時間與連線世代不足以判定新鮮度

情境：(b)(c)，D-02/D-06。N-14 已記錄 NTP 回零；另一個故障是時鐘跳到未來，unit 隨後停機，[P2 的 90 秒判定](../../20-proposals/P2-https-pull-defended.md#L191) 若直接扣 device time，會長期顯示在線。重連後舊 link-down 晚到，也可能蓋掉新 link-up。這裡批評資料品質與排序，不重報 security-10 的憑證校時問題。

可修：保留最靠近感測器的 source timestamp，另附 clock quality、boot id、sample sequence；無可信時間時標 unknown/stale，不能換成接收時間冒充新鮮。link 事件附 connection epoch，只更新同世代。代價是信封欄位與新鮮度狀態；F-02/F-04/F-27 才能並存。[MQ21](../../10-facts/mqtt-semantics.md#L68) 記錄晚到死亡事件以 bdSeq 對應新連線，是有來源的對照。

### correctness-10 | 重大 | 重送與遲到資料尚無歷史正確性規則

情境：(c)，D-03/D-06。writer 已提交量測，回覆卻丟失，重送同批可能重複入庫；斷網後送回前一天樣本，已關閉 bucket 的增量 roll-up 又可能漏算。[P2 §5](../../20-proposals/P2-https-pull-defended.md#L265) 列出 sample 三欄及 bucket upsert，未指定樣本唯一鍵或遲到重開規則，不能據此宣稱 F-01～F-15 全成立。

可修：以來源身分、boot/sequence 與 schema revision 定義穩定樣本鍵，提交與去重同交易，耐久接手後才能刪緩衝；以明定 lateness 水位或 dirty-bucket 重算處理遲到。超出歷史窗口需分類計數。代價是唯一索引與有限重算排程，不需新資料庫引擎。

## F-46～F-54 逐條裁決

「方向成立」只指文字契約，並非測試通過。

| ID | 裁決 | 依據與必要修正 |
|---|---|---|
| F-46 | 未證成 | correctness-01、02、03、06、07：owner 表不等於提交、恢復與重讀協定。 |
| F-47 | 分類成立，完成保證不足 | correctness-02、05：job 的 key 不解實體效果歧義；state 必須依真實 actual 收斂。 |
| F-48 | 簽章方向成立，授權未完整 | 既有 security-03、06、07 已列上行、ERP 授權與文件缺口，不新增重複 finding；正確來源的完成證據仍是 F-49 前提。 |
| F-49 | 不完整 | correctness-05、06、07：每 key 或版本要有可持久關聯的結果，register 的拒絕不能只等 CQ。 |
| F-50 | 用詞方向成立 | unknown、timeout、late result 分開正確；correctness-04 要禁止把 timeout 解讀成取消或未執行。 |
| F-51 | 只命名 owner，尚無完整規則 | correctness-02、03、04：去重期限、順序釋放、edge expiry 與不確定工作的處置缺漏。 |
| F-52 | 分層方向成立 | accepted 是送達，不是完成；correctness-02、07 要防 accepted 卡死或倒寫終態。非同步 handler 仍待驗收。 |
| F-53 | job 錯誤詞彙成立 | correctness-05、07：state reconcile 也須按版本報錯；HTTP 200、接收成功、CQ 寫入成功均不是 backend 成功。 |
| F-54 | 裁量方向成立 | correctness-05：需可重試的 defer/refuse、同值跨版本無副作用、舊 reconcile 不覆蓋新 actual。 |

## 故障與保留界線

下表是最小故障注入驗收點，**不是已執行結果**；不得以 process restart 通過替代 power-loss 保證。

| 故障／形狀／情境 | 切點與應觀察的不變量 |
|---|---|
| ERP crash；(a)，D-04 | 提交前後、outbox 搬運前後各中斷：未受理須明示，已受理 key 不消失且不另造 key。correctness-01。 |
| bridge crash；(b)，D-04 | 接收 CQ 後、鏡像提交前中斷：unit 仍持 owner 結果，重啟自動補齊；不能靠 ERP 重啟才恢復。correctness-06、07。 |
| unit crash；(a)，D-04 | accepted 前後、backend 效果前後、終態提交前後中斷：不可將兩種 accepted 殘局均當成功或均重跑。correctness-02。 |
| 網路故障；(c)，D-01/D-04 | 丟失 complete 或其回覆而 fetch 仍活：命令結果仍能批次回讀；切 long-poll 不改語意。correctness-05、06。 |
| 全站斷電；(a)，D-01/D-04 | ERP、bridge、unit 各自承諾的 durable commit 必須包含斷電邊界；重啟從 backend 實況重建 actual，不能把舊 SQLite 值當現況。實際設定與媒體保證未查證。即使耐久性補齊，correctness-02 仍存在。 |

[NATS N8](../../10-facts/nats.md#L28) 分列 fsync 與去重窗口，說明它們不是同一件事；這不是 SQLite 的證據。沿用 longevity-06 的修補建議也不能免除上述斷電驗收。

| P2 §4.3 項目 | 已列窗口 | 尚缺的保證／監控 |
|---|---|---|
| unit CQ | 500 筆或 14 天 | 「或」的淘汰順序、未終態 pin、去重墓碑及每 key 缺證據狀態；只有 cq.evicted 不足。 |
| bridge 上傳緩衝 | 48 h 或 256 MB | 容量可能先耗盡；須有 oldest age、剩餘容量、按資料類別的 drop，不能用量測淘汰政策處理唯一命令結果。 |
| consumer change-log | 24 h 或 64 MB | 410 不會復活已刪的事件或 CQ；須 owner 水位與 resync 完成指標。 |
| ERP SQ 終態 | 30 天後留摘要 | 摘要至少保留 key、目標、payload hash、終態與結果關聯；明列 late result 超窗處置。 |
| ERP inbound | 2 天 | 先完成業務持久化與水位提交再清理；未處理列超齡須告警。 |
| 文件快取 | 最近 3 版 | 未列 active／last-known-good／applying 引用是否 pin，以及空間耗盡處置。不能以版本數保證 N-11。 |
| 營運憑證 | 24 h | 恢復能力沿用既有 security-08、longevity-03 的缺口；拒收原因必須可觀察。 |
| 簽章重放 | 60 s | 需區分重送信封時間與原始量測時間；時計無效須可見，不能改寫 F-02。 |
| 歷史 | 3 年、月分區 | 遲到跨分區與已淘汰範圍的處理、drop 分類與 roll-up 修正水位。 |
| 表內未列 | D-05 event log、bridge SQ/CQ 鏡像、dedupe tombstone | 要列期限／容量或「交接完成前不刪」，以及接近上限與永久缺口監控；最新 desired/actual 則須明定保留至有效取代。 |

## B-01～B-14 對帳

| ID | 是否結構性消除 |
|---|---|
| B-01 | 尚否；unknown/timeout 用詞改善，但入列空窗、失聯與結果淘汰仍在 correctness-01、03、04、06。 |
| B-02 | 尚否；register 失敗或 defer 缺版本化狀態，仍可永久 applying，見 correctness-05。 |
| B-03 | 版本比對方向正確；舊 reconcile 或舊 accepted 覆蓋新狀態仍須 correctness-05、07。 |
| B-04 | §6 已要求指定版本或拒絕；未發現新的版本路由反例，實作仍須錯版本拒絕測試。文件完整性另見 security-07。 |
| B-05 | job 全量 CQ 有改善；§6 又把 config/show 分為 register，不能聲稱它們全靠 CQ 可觀察，見 correctness-05、06。 |
| B-06 | 契約已禁止假成功；尚未測 backend 失敗是否得到 error、且無 done／applied version 前進，見 F-53。 |
| B-07 | accepted 加非同步方向成立；handler 不阻塞與 crash 後續作仍待驗收，見 correctness-02。 |
| B-08 | 尚否；實體效果窗口與 CQ 淘汰後重播仍會重複，見 correctness-02、03。 |
| B-09 | capability 有傳輸位置，不等於版本有效與 fail-closed 驗證，見 correctness-08。 |
| B-10 | localhost 與驗簽有改善；parser 隔離、任意文件 URL 等沿用 security-02、07，不重列。 |
| B-11 | report 回應必解析，方向成立；拒絕、未知與續期須區別，不能把暫時網路失敗當 factory reset。 |
| B-12 | announce 不再要求原 admin POST 路徑；live schema 更新的接受順序仍缺，見 correctness-08。 |
| B-13 | P2 只有 N-07 與部署工件預算，無可核對的 stop 工件；未查證，不能宣稱重構自然修好。 |
| B-14 | 有 applied version 與 CQ owner，但中間鏡像缺項、過期與 ERP cursor 恢復未完整，見 correctness-03、05、06、07。 |

## 此點成立

1. 此點成立：ERP 持有 desired/SQ、unit 持有 actual/CQ，讓恢復有權威方向；換 MQTT 不能代替這個分工。
2. 此點成立：accepted 與終態分開，unknown、timeout 與 late result 並列，確實避免把單純送達當完成的原始錯誤。
3. 此點成立：明列 retention 數值、drop 與 410，比靜默丟失好；批評的是交接與淘汰後果，不是要求無限儲存。
4. 此點成立：D-05 控制通道留在範圍外，D-06 現場 HMI 不依賴雲端往返；本文不拿缺少門鎖控制當反例。

## 最怕的問題

當同一筆 accepted 既可能表示尚未動作，也可能表示實體效果已發生，而結果與去重 key 還會淘汰時，你憑哪份可重讀且可歸因的證據，同時承諾不漏做、不重做與 ERP 不顯示假完成？