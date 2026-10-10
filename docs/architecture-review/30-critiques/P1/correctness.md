結論先講：致命 0 條、重大 10 條、次要 0 條。P1 可以承載正確的命令模型，但「owner 有資料」尚未接成可恢復的完整流程；實體動作與結果落盤之間，更不能只靠 key 宣稱 exactly-once。問題可修，不足以否定 MQTT，卻足以否定目前 F-46 等項的「成立」判定。

# P1 正確性評論

日期：2026-10-11。僅執行 correctness 角色，獨立判斷 P1，不以 interim 的取捨作結論。以下失敗序列是設計推論，未執行 PoC；第三方事實僅引用既有 facts 的 2026-10-10 查核紀錄，本輪未做網路查證。原文未確認的部分仍標「未查證」，尤其 [MQTT 規格限制](../../10-facts/mqtt-semantics.md#L116)。

形狀：(a) 同主機；(b) 同站不同 VLAN；(c) 雲端 ERP、站點 outbound-only。需求基準見 [命令契約](../../00-requirements.md#L132)。修法與代價均為評論者建議，不是既有實作。

## Findings

### correctness-01 | 重大 | key 去重不能封住實體動作的 crash window

情境：(a)(b)(c)，D-04。依 [P1 §4.2](../../20-proposals/P1-mqtt-native.md#L145)，unit worker 執行後才寫 CQ。LED playlist add 已生效、CQ 尚未 commit 時斷電：重啟若重跑，會重複；若先記「已見 key」便永久跳過，則動作前斷電會漏做。兩種落盤次序都不能證明實體 exactly-once，F-47/F-51、B-08 未解。

可修：持久化 accepted/running/result，backend 接受同一 key 並可查結果，或把可改寫者改為冪等狀態設定。無法查證實體結果時回 unknown，禁止自動重跑；timeout 也不是「未執行」。代價是 backend 契約與逐步斷電測試；不支援的動作必須明示限制。

### correctness-02 | 重大 | CQ 在磁碟上不等於 ERP 能重讀

情境：(b)(c)，D-04。unit 已存 CQ，bridge 接收後、上行前 crash，或 ERP 在寫結果交易前 crash；[P1 重連流程](../../20-proposals/P1-mqtt-native.md#L141)只列 actual/birth 重發，root resync 只列 desired/SQ/dynsec。即使七天內恢復，重送 SQ 遇到去重也未規定重送既有 CQ；[宣稱 SQLite 可重讀](../../20-proposals/P1-mqtt-native.md#L166)卻未定義出口。

可修：每次重連及週期性批次同步 CQ，以 cursor/確認水位續接；重複 key 回既有結果。ERP 結果 commit 後才產生耐久確認，再刪 SQ；刪除失敗可重試。PUBACK、adapter 收件或 ERP HTTP 回覆均不得代替結果入庫。代價是雙向同步日誌；[Apple MDM 的結果重送先例](../../10-facts/precedents.md#L42)支持此方向，不證明 P1 已完成。

### correctness-03 | 重大 | timeout 沒有解除舊 worker 的執行權

情境：(c)，D-04。job A 已 accepted 後 WAN 斷線，ERP 判 timeout 並發 B；A 尚在跑，B 恢復連線後亦開始。若 ERP 不釋放 single-flight，則無結果的 A 永久擋住 B。[P1 §4.2](../../20-proposals/P1-mqtt-native.md#L145)未選擇這兩者的處置；多 strip show 發給 bridge，另一路 strip job 更可繞過 per-device 排程。

可修：ERP 定義序號、衝突資源及恢復裁決；edge 開始前查絕對 deadline，unknown 不自動放行相衝突工作。取消要有確認或 fencing，不能把 Message Expiry 當取消。重發不可延長原 deadline。代價是 issuer/worker 狀態機；[MQ4](../../10-facts/mqtt-semantics.md#L31)的單 topic 說明也不能替跨 job 排序，MQTT 5 normative 範圍仍未查證。

### correctness-04 | 重大 | actual 的版本可能只是「看過」，不是「套用」

情境：(a)，D-01；(b)，D-04。版本 42 被拒絕，若依 [refusal 設計](../../20-proposals/P1-mqtt-native.md#L174)回 actual.v=42，便撞上 [done 僅比版本](../../20-proposals/P1-mqtt-native.md#L139)而誤報完成；若保留 applied_v=41，延期的 42 又需有耐久待辦，不能只等下一則通知。相同版本在 worker 完成前再到，亦可能啟動第二次 reconcile。

可修：分開 observed_v、applied_v 與 status/refusal，只有 backend 成功才推進 applied_v；每 function 一個 durable reconciler，延期重試原 desired。backend error 原樣形成結果，不能用 transport success 包掉。代價是狀態欄位、拒絕與並行測試，修 F-49/F-53/F-54、B-02/B-06。

### correctness-05 | 重大 | 文件版本與 last-known-good 尚未形成提交邊界

情境：(b)(c)，D-01。[P1 文件快取](../../20-proposals/P1-mqtt-native.md#L198)未要求按指定版本取回或拒絕；螢幕要求 V 時 ERP 已編輯成 V+1，快取若以 URL 命中最新內容，unit 可套錯 bytes 卻回 V，B-04 仍使 B-03 成立。下載一半斷網時，若先刪舊資產，bridge 有快取也救不了目前畫面。

可修：版本化 immutable manifest，驗版本後才套用；資產齊備前保留 unit 的 last-known-good，成功切換後才報 applied。代價是雙份資產空間與中斷恢復測試。這是 F-60/N-11 的非惡意失敗，不另計 [security-05 的竄改問題](security.md#L64)。

### correctness-06 | 重大 | schema 拒收有了，宣告生效屏障沒有

情境：(b)(c)，D-03、D-06，亦影響 D-04 capability。[P1](../../20-proposals/P1-mqtt-native.md#L128)只在 bootstrap announce 放 schema；已 adopt 裝置如何更新未定義。新增 signed differentialPressure 的資料先抵 root、宣告後抵，writer 按 [拒收規則](../../20-proposals/P1-mqtt-native.md#L184)丟棄，正是 F-32 禁止的 live schema 資料損失。

可修：schema revision 綁穩定 unit/function，管理端持久接受後才啟用；資料帶 revision，未知 id/attribute 不自動建表，合法遷移未確認前由來源緩衝。capability 缺失不能解讀成全部支援。代價是版本握手、舊資料解碼與 B-09 回歸測試；topic ACL 不會替 payload 做這些事。

### correctness-07 | 重大 | 上游中斷時本地 PUBACK 仍可能被當作交接完成

情境：(b)(c)，D-02、D-03、D-06，兼及 P1 自提的 D-05 出勤事件，並非門鎖控制。WAN 斷而本地 broker 活著：來源得到 PUBACK，但 [R_buf](../../20-proposals/P1-mqtt-native.md#L157)只說 parent 不可達時緩衝。broker 上游 queue 溢出後，retained 最多補最後量測，不能補歷史；[ev/access](../../20-proposals/P1-mqtt-native.md#L206)甚至只在抵 root 後才持久化。其間 crash 就無 owner 可重讀。

可修：量測與業務事件在來源先存 outbox，分別等 history writer/ERP 耐久收據才推進水位；用 sample/event id 去重，回補也不得污染最新值。代價是磁碟、批次回補與累積值去重。[MQ11 的 queue 上限](../../10-facts/mqtt-semantics.md#L43)已有證據，drop 計數只是告警，不是交接保證。

### correctness-08 | 重大 | 七天 CQ 與永久 key 關聯不能互相替代

情境：(c)，D-04。ERP 停八天，CQ 依 [七天規則](../../20-proposals/P1-mqtt-native.md#L156)清除，再遇 broker cache 遺失便無結果可找；ERP 永久保留 key 並不能恢復結果。若 dedupe 與 CQ 一起清掉，舊 SQ 還可能再執行。F-67 的 inbound 兩天只管已接收資料，不能把未到達的損失歸責 ERP。

可修：公告端到端離線承諾，確認前 CQ 不回收或在容量上限前背壓；結果、dedupe tombstone、SQ、備份可回放範圍要協調。逾窗回 result_expired/unknown 並計數，不憑空宣稱成功或未跑。代價是容量預算、監控與補償流程。即使換 [NATS N8](../../10-facts/nats.md#L28)的去重窗口也不會消除這項契約責任。

### correctness-09 | 重大 | 標出時間來源仍不能把舊資料當新資料

情境：(b)(c)，D-02、D-06。T1 沒 timestamp，先在來源排隊再送，bridge 依 [P1 規則](../../20-proposals/P1-mqtt-native.md#L117)蓋接收時間，仍違反 F-02；ts_source 只揭露限制，沒有補回量測時間。NTP 為零或跳時亦使 heartbeat/期限判斷失真。HMI 已收到值後來源沉默，P1 的 [Expiry 保證](../../20-proposals/P1-mqtt-native.md#L155)只談新訂閱者，未規定既有畫面老化。

可修：Modbus 在最近輪詢者蓋量測時間；不可知的 T1 時間標 unknown，不冒充 fresh。附 clock_quality、sample sequence、max_age，心跳與 HMI 主動顯示 stale；時鐘未可信前不執行有期限的 job。代價是時間健康檢查與消費者契約；這比 [longevity-06](longevity.md#L95)的換 broker TTL 問題更早發生。

### correctness-10 | 重大 | 還原 owner 會破壞版本及去重的單調性

情境：(a)(b)(c)，D-01、D-04。ERP 從 v=40 備份還原，unit 已 applied_v=42；root [全量重發](../../20-proposals/P1-mqtt-native.md#L141)會被拒，直到新編號追上；追到 42 時甚至可能內容不同卻被判 In sync。反過來，unit 從舊 SQLite 還原會忘記已執行 key，ERP 未結 SQ 因此重跑。

可修：以不可倒退的 authority/incarnation epoch 配 version/key；還原啟動先停發，與存活 owner 對帳，未知實體結果人工裁決，不能「清空重試」。代價是還原閘門、tombstone 保存及雙向演練。此處不重算 [longevity-07](longevity.md#L105)的 dynsec 撤銷復活，但其「清空 broker」修法本身也不能恢復遺失的 owner 事實。

## Retention 核對

P1 已列數值，這項工作有價值；但「有欄位」不等於「有端到端窗口與監控」。下表核對 [P1 §4.3](../../20-proposals/P1-mqtt-native.md#L147)，缺項屬 correctness-02、07、08、09，不另計 finding。

| 狀態 / window | P1 明寫值 | 尚需明寫或監控 |
|---|---|---|
| broker persistence | plugin；內建替代方案 60 s | plugin crash 未查證；恢復完整度、最後成功同步時間 |
| broker queue | 1000；T1 100 | 已有 drop 計數；另要逐來源缺口與未交接量 |
| session | persistent_client_expiration 7d | v5 bridge session 另列；[MQ16](../../10-facts/mqtt-semantics.md#L45)記錄預設 0，不能混稱七天 |
| SQ | deadline + 1h | absolute expiry、重發剩餘 TTL、過期/卡住數 |
| CQ | 7d | 未確認結果水位、最老未確認年齡、回收告警 |
| dedupe / key / tombstone | key 永久關聯；其他未列 | 與最大 replay/restore 範圍相容，不跟 CQ 一起盲刪 |
| 量測 outbox | 24h 或 50 MB | 已有丟最舊計數；容量/年齡告警、先到哪個上限 |
| 業務事件 outbox | 未列 | owner、event retention、丟失與重播水位 |
| retained 量測 | 3 個週期；D-02 90 s | live 消費者 max_age，不能只測新訂閱 |
| R_resync | 1h 或 broker 重啟 | 漏同步告警、CQ/announce 恢復與 last_success |
| presence | Will/keepalive 30 s；R_grace 例 2min | grace 正式設定、clock_quality；heartbeat 120 s/offline 5min |
| ERP inbound | 2d | 已收事件 replay 期限，與永久命令關聯分開 |
| 文件 / history | 快取未列；需求歷史 3 年 | last-known-good pin/回收、partition/roll-up 窗口與刪除計數 |

## F-46 至 F-54 逐條判定

| ID | 獨立判定 |
|---|---|
| F-46 | 不足；correctness-02、07、08、10 的耐久交接與重讀缺口仍在 |
| F-47 | intent/job 分類成立；correctness-01、04、05 的完成證據不足 |
| F-48 | 有下行簽章方向；仍受 [security-01](security.md#L32)、[security-05](security.md#L64)、[security-07](security.md#L80) 條件限制，不新增安全 finding |
| F-49 | 訂閱 CQ/actual 不等於 ERP 可恢復結果；correctness-02、04 |
| F-50 | unknown/timeout 詞彙成立；timeout 不撤回已開始動作，見 correctness-03 |
| F-51 | owner 已具名，但去重、衝突順序與 expiry 仍缺 correctness-01、03、08 |
| F-52 | worker 與 callback 分離，此點成立；耐久 admission 仍須 correctness-01、02 |
| F-53 | error 詞彙不證明 backend 失敗被讀取；correctness-01、04 |
| F-54 | 裝置裁量方向成立；拒絕、延期與 identical desired 競態見 correctness-04 |

## B-01 至 B-14 回歸核對

對照 [既有 bug 清單](../../00-requirements.md#L256)；「方向成立」不是已跑回歸測試。

| ID | 是否重現 / 所需處置 |
|---|---|
| B-01 | 可重現為結果失聯或 timeout 誤釋放；correctness-02、03、08 |
| B-02 | 可停在 applying；correctness-04、05 要有拒絕/錯誤/延期狀態 |
| B-03 | 正常版本比對改善；錯文件、拒絕與 restore 仍誤同步，correctness-04、05、10 |
| B-04 | 未解；指定版本服務或拒絕，correctness-05 |
| B-05 | cq/+ 已涵蓋 job 類別；漏訊息恢復仍欠 correctness-02 |
| B-06 | 詞彙改善；backend 不可將 error 包為 done，correctness-01、04 |
| B-07 | worker 隔離方向成立；仍須慢 backend 不阻塞 callback 的測試 |
| B-08 | key 已有；實體 crash、回收與 restore 仍可重跑，correctness-01、08、10 |
| B-09 | announce 有 capability；live 更新與缺值拒絕仍欠 correctness-06 |
| B-10 | localhost/認證改善；文件信任另見 [security.md](security.md#L64)，不宣稱全面修復 |
| B-11 | CONNACK/revoke 分類改善；未收到正向撤銷仍 unknown，見 [security.md](security.md#L80) |
| B-12 | 不再靠 admin POST；live schema/update 流程仍欠 correctness-06 |
| B-13 | 架構不會自動修 compose stop；需 deploy 驗收，本輪未執行 |
| B-14 | applied measure 已補；ERP 停機結果恢復仍欠 correctness-02、08 |

## 此點成立

- 此點成立：retained 定位為快取、ERP 與 unit 分持 owner，是正確方向；[P1](../../20-proposals/P1-mqtt-native.md#L141)不需因本評論改成 HTTPS。
- 此點成立：per-key SQ/CQ 與獨立 worker 避開單槽結果覆蓋、同步長工作；[P1](../../20-proposals/P1-mqtt-native.md#L145)已比僅靠 PUBACK 完整。
- 此點成立：Will 只標可疑、offline 看裝置 heartbeat，且只將狀態轉移寫 ERP；[P1](../../20-proposals/P1-mqtt-native.md#L180)保住 F-27/F-30 的分工。

## 最難的問題

一個 D-04 job 已改變實體、unit 卻在 CQ commit 前斷電，再碰上 ERP 還原與 broker cache 清空時，你能指出哪份仍可信的事實，讓系統既不重做、不假報成功，又能在 ERP 明確顯示「結果不明」並決定是否放行下一筆嗎？