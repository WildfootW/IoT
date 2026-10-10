# 結論先講

**致命 0 條、重大 13 條、次要 0 條。** P6 可以分期部署，尚不能宣稱 command correctness 已成立；第一片螢幕也需要可重啟的 reconcile。缺口可在原架構內修補，故不列致命。

日期：2026-10-11。對象：[P6 §4.1](../../20-proposals/P6-minimalism.md#L166)。以下是文件反例與估工，不是實作測試。第三方僅轉引事實檔的實際行號，原查證日為 2026-10-10，本次未網路複驗；無來源者標「未查證」。既有安全及維運 findings 不重新計數。

## Findings

### correctness-01 | 重大 | fetch 回應遺失後沒有重交接規則

（c），D-04：ERP 在 `jobs/next` 標記 delivered 後，回應斷線或 relay crash，agent 尚未取得 key。若 next 排除 delivered，就再也取不到；§4.1 沒有重交接規則。

依據：P6 §4.1、F-46。可修：ERP commit 後才回「已受理」，同 key 保留供重取，agent 耐久收件另記；fetch 不證明送達。估 1 人週。

### correctness-02 | 重大 | CQ 落盤與結果確認的邊界未定

（b），D-04：若先 POST result、再寫 CQ，agent 在兩者間 crash，ERP 又未 commit，結果兩邊皆無。§4.1 的「並寫 CQ」未禁止此順序；只在重連重送也漏掉持續在線的失敗，以及 ERP 還原後已確認的 CQ。

依據：P6 §4.1、F-46、F-49。可修：先 commit CQ/outbox，ERP commit 才 ack；平時用 cursor 對帳，已 ack 結果仍可重讀，無 per-command poll。估 1 人週。

### correctness-03 | 重大 | 結果去重不能保證物理 exactly-once

（a），D-04：playlist add 已改 backend，agent 卻在 CQ commit 前斷電；重開查無 key，再加一次。先記 done 再執行則會漏做。單靠 CQ 無法區分「未做」與「做完未記錄」（推論）。

依據：P6 §4.1、F-47、F-51、B-08。可修契約：耐久 inbox，加 backend key 或實際狀態查詢；可查者 reconcile，不可查者 unknown 並人工核對，禁盲重跑。無條件物理 exactly-once 不可承諾；估每 backend 1～2 人週。

### correctness-04 | 重大 | timeout 釋放單飛，queued 卻不過期

（c），D-04：job-1 做超過十分鐘，被改 timeout 後不再占 delivered；job-2 先完成，job-1 後完成覆蓋它。離線一小時的 queued 又不在 cron 掃描範圍，仍可被取走執行。

依據：P6 §4.1、F-50、F-51、F-64、N-06。可修：原子 single-flight，queued 也檢 expiry；timeout 不等於取消，須終態或 backend 確認停止才放行。晚到結果仍按 key 保存，共用資源的 register/job 一起排序。估 1 人週。

### correctness-05 | 重大 | retention 數字沒有組成去重保證

（c），D-04：第 501 筆結果使舊 CQ 提早消失，ERP 尚保有該 job；舊請求重播時，CQ 缺席不能代表未執行。總 drop 數也無法指出哪件 job 已失去證據。

依據：[P6 §4.3](../../20-proposals/P6-minimalism.md#L185)、F-46、F-51。可修：明訂重播上限，dedupe tombstone 保存至窗口結束；滿載拒收新 job、告警，過窗標 result_expired，禁止當失敗重跑。估 1 人週。

### correctness-06 | 重大 | 版本相等沒有證明套用的是該文件

（c），D-01：agent 拿 v7 pointer，既有 route 卻回 v8，agent 仍報 applied v7，就會假同步。§6 以版本比對宣稱修 B-04，未規定 route 的取版或拒絕步驟；晚到 snapshot 也未禁止倒寫。

依據：[P6 §6](../../20-proposals/P6-minimalism.md#L224)、F-60、B-03、B-04。可修：核對請求版本、文件版本與內容 hash；report 綁 unit/function/epoch/version/seq，拒舊回報，還原換 epoch。估 0.5～1 人週。

### correctness-07 | 重大 | 同版本跳過會封死半成品與 defer

（a），D-01：v8 先存 desired，reconcile 半途 crash；重啟再見 v8，§4.4 的「比 version 不動作」讓半成品永久停住。refused/defer 後也不能只等新版本。

依據：P6 §4.1、§4.4、N-11、F-53、F-54。可修：分 seen/applied，啟動重讀實際狀態與持久 id map；資產備齊才切換，保留可回復的 last-known-good。背景 reconcile，完成才記 actual，error/refused 按版本回報 ERP。估 1～2 人週。

### correctness-08 | 重大 | 無效時間破壞 freshness 與保存期

（b），D-02/D-03：NTP 回零、回撥或跳到未來，device_time 會使新讀值像古資料，或延後 offline 判定。§4.2 只有裝置時間，沒有有效性規則，緩衝重送還可能倒寫 snapshot。

依據：P6 §4.2、F-02、F-04、F-27、N-14。可修：sample_time 加 time_quality/boot_id/seq；最近節點在取樣時蓋時，重送不改時。失準資料隔離且顯示 unknown，elapsed 用 monotonic，重啟重新校時。估 0.5～1 人週。

### correctness-09 | 重大 | announce 不等於宣告已耐久生效

（b），D-03：report 搶在 schema commit 前抵達，或改型後才收到七天前的批次；「檢查 schema」沒定用哪一版。D-04 的空 capability 亦不能解讀成無限制。

依據：[P6 §3.3](../../20-proposals/P6-minimalism.md#L147)、§5、F-31、F-32、F-06、B-09。可修：宣告 commit 才 ack；批次帶 schema_version，按版本驗型、單位，未知 id/key 拒絕並可補送，保留舊 schema；空 capability 禁止相關命令。估 1 人週。

### correctness-10 | 重大 | history 與 ERP 的交接不可共用模糊 ack

（c），D-02：hub 寫 history 後、回 ack 前 crash，agent 重送使資料重複；若先 ack 卻未耐久保留 ERP 回報，又會漏掉業務資訊。§5 的兩個目的地沒有各自完成水位。

依據：[P6 §5](../../20-proposals/P6-minimalism.md#L216)、F-11、F-46、F-67。可修：sample/event 穩定 ID、history 冪等鍵；hub 先 commit outbox 才接管，分追 history/ERP cursor，兩端完成才回收。估 1～2 人週。

### correctness-11 | 重大 | 小時已關閉不代表資料已到齊

（c），D-03：斷網兩天後補 raw；若排程水位已越過該小時，既有 roll-up 不再被重算，count/mean/max 永久錯。§5 的「已關閉 bucket 增量 UPSERT」沒有指定遲到修訂範圍。

依據：P6 §5、F-09、F-10。可修：raw 寫入同時標記 dirty bucket，重算涵蓋允許遲到窗口；區分 provisional/final，超窗明示 gap，刪 raw 前完成重算。估 1 人週。

### correctness-12 | 重大 | Stage 0 的 latest snapshot 會漏門檻事件

（a），D-02：ERP 停機期間讀值越線又恢復，重連只報最新正常值；本地 ring 無歷史上傳路徑，ERP 不可能重建越線。§5 卻宣稱 Stage 0 alert 成立。

依據：P6 §4.2、§5、F-03、F-10、F-46。可修：node 耐久保存帶 ID 的越線事件，ERP 冪等收件；或明列「離線告警不提供」並禁用該承諾。估 0.5～1 人週；不需要先蓋 history。

### correctness-13 | 重大 | broker 在線不等於量測新鮮

（b），D-06：sensor backend 停止，hub 與 broker 仍在線；舊 retained 值不變，Will 不觸發，HMI 若以連線判健康便顯示假新鮮。這不是既有 longevity 的 broker 重啟回灌問題。

依據：P6 §5、§6、F-04、F-05、F-27。可修：每個投影帶原 sample_time、quality、source epoch/seq；HMI 本地計時轉 stale/unknown，Will 只當 link 線索，不當每功能的存活證據。估 0.5～1 人週。

## 外部對照

以下只引用原檔標為直讀或原文的部分，不以產品先例代替 P6 的驗收。

| 來源與實際行號 | 可採的事實與邊界 |
|---|---|
| [precedents.md e15](../../10-facts/precedents.md#L42) | Apple MDM 保留最後命令至帶 UUID 的結果抵達，裝置可重送同一結果；支持 01/02，不證明物理 exactly-once。 |
| [mqtt-semantics.md MQ14](../../10-facts/mqtt-semantics.md#L53) | Azure twin 重連須取完整 desired、忽略舊版本通知；支持 06 的版本對帳，不是通知必達。 |
| [nats.md N8](../../10-facts/nats.md#L28) | JetStream 文件範例的 duplicate window 為兩分鐘；窗口與耐久儲存是不同條件，不能替 05 提供無限去重。 |
| [mqtt-semantics.md MQ18](../../10-facts/mqtt-semantics.md#L65) | Sparkplug 不強制 host 拒絕未宣告 metric；09 的強制檢查仍須由應用定義。 |
| [mqtt-semantics.md MQ21](../../10-facts/mqtt-semantics.md#L68) | Sparkplug 用 bdSeq 處理舊 NDEATH 晚於新 NBIRTH；13 不能把最後收到的連線事件當當前量測品質。 |

## F-46 至 F-54

| ID | 本輪裁決 |
|---|---|
| F-46 | owner 方向正確，交接與可重讀未封閉：correctness-01、correctness-02、correctness-05、correctness-10、correctness-12。 |
| F-47 | 二分成立，job 副作用與 actual 證據不足：correctness-03、correctness-06、correctness-07。 |
| F-48 | 沿用 [security.md](security.md) 的 security-02、security-04、security-09；不重複計數，也不認為已通過。 |
| F-49 | 有 result 欄位不是全程可觀察：correctness-02、correctness-07。 |
| F-50 | timeout 不是未執行，queued/late result 規則須補：correctness-04。 |
| F-51 | 去重、active owner、expiry 必須共同成立：correctness-03、correctness-04、correctness-05。 |
| F-52 | 背景執行方向成立；需驗長工作不阻塞 fetch/report，不能只靠 delivered/done 名稱：correctness-07。 |
| F-53 | 已明寫 error result；須驗 backend 失敗不被 state=done 或 HTTP 成功掩蓋：correctness-07。 |
| F-54 | 有拒絕權，但相同 desired 的恢復與 defer 後重試尚不足：correctness-07。 |

## 保存契約

原設定見 P6 §4.3；有限窗口須監控容量、最老 age、cursor lag、持久 drop 範圍及原因，不只總數。窗口外必須可見地降級，不能宣稱仍不丟。

| 項目 | P6 設定 | 還須補的契約 |
|---|---|---|
| agent CQ | 500 筆或 30 天先到 | 未確認結果及 tombstone 不得被一般淘汰悄悄抹去；correctness-05。 |
| queued 與重播 | 容量、重播終點未列 | admission/backpressure 與最長重播期；correctness-04、correctness-05。 |
| desired 快取 | 永留最後一份 | 最後收到不等於 last-known-good；correctness-07。 |
| agent ring | 7 天 | byte quota、時鐘失準、gap 序號；correctness-08、correctness-10。 |
| hub 緩衝 | 7 天或 1 GB | 先到者即上限，不保證七天；業務結果與量測分配額，滿載可見；correctness-05、correctness-10。 |
| ERP job | 30 天後歸檔，再 90 天刪 | active/unknown 不得僅依年齡清除，重讀涵蓋 archive；correctness-05。 |
| desired audit | 90 天 | audit 淘汰不可刪仍被引用的當前事實；correctness-06、correctness-07。 |
| ERP 業務事件 | 180 天 | event ID 去重期涵蓋重播，離線事件先有 owner；correctness-05、correctness-12。 |
| snapshot | 每裝置一列 | 明訂全量或 patch，缺欄不可沿用為新鮮，舊 report 不倒寫；correctness-06、correctness-08。 |
| raw / roll-up | 36 / 60 個月 | 遲到窗口、修訂水位與刪除順序；correctness-11。 |
| deadline | 10 分鐘，可依 class 改 | queued expiry 與執行中 timeout 分開；correctness-04。 |
| report / offline | 120 秒 / 5 分鐘 | 以有效取樣及回報時間判斷，不因補送復活；correctness-08、correctness-13。 |
| 文件資產、對帳 cursor | 未列 | pin 住 LKG；cursor 過期有完整重讀，不能當已同步；correctness-02、correctness-07。 |

## B-01 至 B-14

| ID | 是否消除及驗收點 |
|---|---|
| B-01 | 尚否：遺失回應、unknown、archive 關聯須補；correctness-01、correctness-02、correctness-04、correctness-05。 |
| B-02 | 尚否：error/refused/defer 必須結束或明示 applying；correctness-07。 |
| B-03 | 尚否：舊 snapshot、錯版文件不可令最新 desired 顯示同步；correctness-06。 |
| B-04 | 尚否：route 必須供指定版本或拒絕，不是只比 applied；correctness-06。 |
| B-05 | 統一 keyed result 可修；每種 LED job 都須通過收件與回讀測試，不能只測 ledConfig；correctness-02。 |
| B-06 | error result 方向對；仍須注入 backend 失敗驗 ERP 不顯示成功；correctness-07。 |
| B-07 | 背景 reconcile 方向對；需驗長工作期間 heartbeat/fetch 照常；correctness-07。 |
| B-08 | 尚否：CQ 前 crash 及淘汰後重播仍可重做；correctness-03、correctness-05。 |
| B-09 | 尚否：capability 宣告、採用與空值拒絕規則未閉合；correctness-09。 |
| B-10 | 不重評；[security.md](security.md) 的 security-07、security-08、security-09 已涵蓋。 |
| B-11 | rejected/unknown 方向對；保留 security-10 的回應分類缺口，不算本輪新 finding。 |
| B-12 | bootstrap 避開 admin port 方向對；live schema 更新仍須測，不能以 POST-only 新建代替；correctness-09。 |
| B-13 | P6 §8 已承認；每個首用工件須驗 deliberate stop 與 crash restart，非新 finding。 |
| B-14 | applied measure 必要但不足；CQ 重讀、文件比版及半途恢復仍缺；correctness-02、correctness-06、correctness-07。 |

## 此點成立

1. 此點成立：15 秒 polling 可以服務容許等待的 D-01；[precedents.md e10](../../10-facts/precedents.md#L37) 支持 Balena 的固定輪詢加 ETag，不證明 P6 的端到端最差延遲。120 秒 actual report 須另算。
2. 此點成立：ERP transaction 只寫 job、不做 remote call，避開 C-20 的同步競態；register/job 二分值得保留。
3. 此點成立：§4.3 已列 retention 並要求 drop 監控；本輪反對的是窗口不相容，不是指稱它完全沒寫。
4. 此點成立：history、hub、broker 可隨需求啟用；未提供的功能不用預建，已接受的命令不能延後補語意。

## 首客與分期

這不是要求第一天實作全部產品；下表是建議 gate。測試沿用 N-17/N-18 的 e2e，不另建 framework；估工有重疊，不應逐條相加。

| 交付範圍 | 使用前必備 | 可延後 |
|---|---|---|
| 首片 D-01，(a)/(c) | correctness-06、correctness-07、correctness-08；錯版文件、斷網沿用 LKG、半途 crash 復原、ERP 停機及恢復；實際部署形狀的 N-18。 | hub、broker、history；15 秒 polling 可接受，不能稱完成延遲上限。 |
| Stage 0 D-02 即時值或 alert | correctness-08、correctness-09；若宣稱越線事件則 correctness-12；拒絕、失準與過窗要可見。 | 明列 F-10 妥協後可暫不提供離線 alert，不能默默漏報。 |
| 首個 D-04 job | correctness-01 至 correctness-05、correctness-07、correctness-09；GET/POST 遺失、ERP/hub/agent crash、late result、CQ 淘汰及雙 fetch。 | 沒有 D-04 就禁用 job 入口，不必先付 backend 成本。 |
| Stage 1 writer / T1 | correctness-08 至 correctness-12；各目的地 commit 邊界、七天補送、schema 交錯與 roll-up 修訂。 | 未承諾歷史前不建 history；hub 加入後須重驗 CQ 端到端確認。 |
| Stage 2 D-06 HMI | correctness-13；backend 停止但 broker 在線、舊值與舊 Will 不能假新鮮。 | MQTT 不承擔命令，是否加 broker 不改變語意要求。 |
| D-05 及 actuating D-06 | 本輪僅管理面；D-05 事件將來須獨立耐久保存，不能借用 latest snapshot。 | 控制通道維持範圍外，絕不把物理 exactly-once 當日後換傳輸便可取得的能力。 |

## 最難的問題

當 ERP、hub、agent 各在交接邊界 crash 一次，你能逐 key/version 指出誰仍持有事實、何時只能報 unknown，並證明第一個客戶已接受的保證沒有被「以後再補」取代嗎？