結論先講：P1 原案 **38.00/100**，P1-R 修訂設計 **52.50/100**。答辯提出了具體的耐久交接與信任綁定，值得加分；卻沒有交付證據，也仍不能服務「敏感資料必須經 TLS 攔截且不准 bypass」的 cloud 站點。另有未完成 L2 隔離的 hostile T1 部署阻塞，故 R1 不超過 5。保留為有條件候選，不判定可上線。

# P1 獨立評審

日期：2026-10-11。依 Score 角色與 RESUME A.3，完整讀取指定底稿、進度、原案、五份批判及完成的答辯；未讀其他新評分、不沿用 interim 排序。要求 strongest xhigh；實際沿用 host inherited default，無 effort 控制，未強制或驗證型號。

本文「答辯後」只評 P1-R amended DESIGN；既有 D-01 展示經驗不能移轉為新設計的 proven implementation。產品資料沿用 2026-10-10 facts，保留原文、摘要與推論之別；本輪未做 web 查證、runtime 測試或 PoC。未查證不視為通過，預定測試也不折算成成果。

| 引用代稱 | 本次裁決來源 |
|---|---|
| 規則／需求 | [03-brief.md](../../03-brief.md#L1) §1、§3；[00-requirements.md](../../00-requirements.md#L1) |
| 原案／答辯 | [P1-mqtt-native.md](../../20-proposals/P1-mqtt-native.md#L1)；[rebuttal.md](rebuttal.md#L1) |
| security／longevity | [security.md](security.md#L1)；[longevity.md](longevity.md#L1) |
| correctness／scenarios／ecosystem | [correctness.md](correctness.md#L1)；[scenarios.md](scenarios.md#L1)；[ecosystem.md](ecosystem.md#L1) |

## 主評分表

| 準則 | 權重 | 答辯前 | 答辯後 | 前加權 | 後加權 | 理由 |
|---|---|---|---|---|---|---|
| R1 情境擬合 | 20 | 4 | 5 | 8.00 | 10.00 | 原案 §3.2、§6 的內容防火牆與 live JSON 路徑斷裂，見 scenarios-01、scenarios-03；答辯 §3.1、§3.4 補 parent cache/live proxy 並移除 Upgrade 依賴，處理 scenarios-02，但敏感 cloud 無 bypass 仍不能完成，適用 5 分上限。 |
| R2 安全 | 15 | 3 | 6 | 4.50 | 9.00 | security-01、security-02、security-05、security-06 的收件者、初始信任、內容 hash、上行身分缺口有答辯 §3.2 的結構性修法；security-07 改為有界 lease 而非即時撤銷。L2、dynsec/cert、還原及外部審查未通過，不宣告致命安全風險已清零。 |
| R3 正確性 | 15 | 3 | 6 | 4.50 | 9.00 | correctness-01、correctness-02、correctness-07、correctness-08、correctness-10 在答辯 §3.3 有 admission、commit receipt、CQ 補讀、背壓及 epoch；但實體副作用仍可能 unknown，不能把停重試算 exactly-once，也沒有 backend crash/restore 證據。 |
| R4 十年維護 | 20 | 3 | 4 | 6.00 | 8.00 | longevity-01、longevity-02、longevity-03、longevity-07、longevity-08；下表獨立重算。答辯 §3.5、§4 去掉 WSS 冷備援及持久 cache 依賴，補復原與混版政策；固定 BOM、支援終點、授權與替補維護者仍缺，列清單不等於降低成本。 |
| R5 生態槓桿 | 15 | 6 | 7 | 9.00 | 10.50 | 原案 §5 的站內扇出與 late-joiner 有實益；答辯 §3.4 對 ecosystem-01、ecosystem-03、ecosystem-04、ecosystem-06 補 admission、stale、目錄及 Rebirth。未驗型號或 HMI，不認列 ecosystem-07 的通用 NGSI/OPC UA 相容，也不給 MQTT 管理面額外紅利。 |
| R6 最小足跡與維運 | 5 | 4 | 4 | 2.00 | 2.00 | 原案 §3.2(a)、§7 與 scenarios-10：中央三個 application 加必需 ERP PG 至少四個服務，CM4 agent/backend/player 另計。答辯 §4 沒讓 broker 可關；history 可省，但 RAM、資產空間、啟停仍未量測，誠實列帳不加分。 |
| R7 可逆性 | 5 | 4 | 5 | 2.00 | 2.50 | longevity-06、longevity-08 與答辯 §3.4、§3.5：payload freshness、薄 client 介面及離線根減少替換耦合；topic、dynsec 和慢 fleet 仍需遷移。換 broker 的 5-8 人週只作工程估計，未含逐站完成時間，不算已驗 rollback。 |
| R8 首次客戶價值成本 | 5 | 4 | 3 | 2.00 | 1.50 | 原案 §9 的 18 人週漏估恢復、安全與 consumer 工作；答辯 §2、§3.5 六包去重後 28-40 人週才較可信，仍另收型號、每站、硬體及外審成本。工時誠實但不更便宜，不因接受 50 條 finding 而加分。 |

加權總分（答辯前）：38.00/100
加權總分（答辯後）：52.50/100

各列加權為原分乘權重再除十。兩欄都是設計分，不是實作通過率；改善只歸給已寫明的 owner、交易邊界、拒絕路徑與成本，不歸給「稍後測試」四字。

## 錨點與致命狀態

原案在 (b) D-01 收到 desired 後，內容 fetch 被自身防火牆擋住；在 (c) 拒絕 Upgrade 的站點，WSS 尚未進入驗簽即失敗。答辯指定內容埠、同源 live proxy 與普通 HTTPS sync，確實改變了路徑，不是換名詞。下表是修訂後的設計走查，所有 gate 均未通過；(a) unit 直連 root，(b) 經站內 bridge，(c) 另經 site 主動 HTTPS sync。

| 錨點 | 修訂後端到端路徑 | 剩餘 gate |
|---|---|---|
| D-01 | ERP durable desired → parent cache 的指定 manifest/assets → unit 驗證/reconcile → applied version/digest → ERP | 三形狀實際換頁、斷下載保留舊畫面、逐屏 live JSON；私密內容的 cloud 保密阻塞仍在。 |
| D-02 | 獨立 sensor backend → 近源時間/quality → sample outbox → PG commit receipt → Grafana；越線另到 ERP | warm-up、PG 停機、回補去重、時間為零及容量，correctness-07、correctness-09。 |
| D-03 | south 登記 stable id/register map → schema 核准 → Modbus 輪詢/聚合 → outbox → history | 實際 register map、換機識別與 live schema；scenarios-05、correctness-06，不按 IP 延續身分。 |
| D-04 | ERP resource set/SQ → durable admission → backend → CQ → ERP commit/receipt | 動作前後 crash、逐 strip 結果；同步 show 限同機，跨盒不保證同步，scenarios-06。 |
| D-05 | 信任鏈/Manage → 非控制設定與 applied → 存活/attestation → event journal → ERP | T3 verifier、實機與不可背壓事件損失；控制、卡表及開鎖另案，不以它們未建判本案致命。 |
| D-06 | PLC/raw admission → 站內 feed/HMI → 北向 ≤1 Hz/PG；業務事件進 ERP | 約定並量測採樣到顯示 p95、既有畫面 stale、晚加入與換 path；ecosystem-02、ecosystem-03、ecosystem-04、ecosystem-06。 |

來源批判的致命數為零，不約束本席裁決。**仍有兩類條件性致命部署阻塞**：強制攔截、禁止 bypass 又須保密的 (c) D-01 私密文件／D-05 出勤；以及不能完成 L2 隔離的 C-25 hostile T1 站點。答辯 §3.1、§5 自己承認拒絕上線，這是正確 fail-closed，卻不是錨點已被支援。不能一面維持保密與隔離要求，一面把限制當測試後自然消失；也不能推稱所有 (c) 都必然失敗。

R2 的加分來自固定收件者、epoch/hash、來源反向簽章、預置離線根與 raw 低權限隔離。它們能在契約層排除原來的重放、假內容及 bearer 偽冒反例；固定版本是否真的按此執法仍未驗。五分鐘 lease 是對 N-11 的可用性妥協，並非分區中即時撤銷，更不會讓被偷螢幕遠端停止顯示。保密阻塞不能靠「雙向簽名」消除，外部審查也不能代替缺少的機密通道設計。

R3 此點成立：來源 outbox 保留到真正 PG／ERP commit、receipt 可重送、CQ 不隨七天盲刪，已補上「磁碟有結果但沒有補讀出口」的結構缺口。仍須區分耐久 admission 與實體完成；LED 已動作但 CQ 未 commit 時，unknown 加衝突資源封鎖是誠實處置，不是 exactly-once。接受有限磁碟與離線窗口，不代表容許靜默 loss；背壓、缺口計數、人工裁決都必須能在 ERP 看見。

## 獨立維護帳

不用原案 14/15 或答辯單一總數直接打分。比較採 Python、容器部署及 D-01 player 的同口徑設計底帳，不宣稱盤點了已部署軟體；Rust 分支不算成已選依賴。引擎、語言、runtime、repo、產品時鐘各計維護單位，跨維度可以重複，不能把總和叫作服務數。

| 維度 | 答辯前重算 | 答辯後重算與範圍 |
|---|---|---|
| 引擎 | 3：Mosquitto、SQLite、PostgreSQL | 3；history database 與 raw broker 增實例，不增引擎種類。 |
| 自有源碼語言 | 至少 3：Python、SQL、shell | 至少 3；若自寫 live-board JavaScript 再 +1。外部 C 程式不冒充本隊自有語言。 |
| runtime | 至少 3：Python、shell、player/browser | 至少 3；browser 實作未查證。同一 node 的三種角色不算三個 runtime。 |
| 自有 repo 家族 | 5：node、ERP modules、deploy、e2e、Parts | 5；實際拆 repo 數未查證，Parts/profile 不免費排除。 |
| 外部產品時鐘 | 至少 11：Mosquitto、MQTT client、SQLite、Odoo、PG、Python、OpenSSL、Linux、container engine、Compose、Anthias；HTTP/crypto/WSS 選型另加 | 至少 13：前述 11 加已選候選 aiohttp、cryptography；不是已鎖版。原 WSS 專屬依賴退出，dynsec 跟 broker 時計，不另虛增。 |
| 可加總下限 | 25 維護單位，尚有未拆依賴 | 27 維護單位，尚有未拆依賴；這不是 27 個獨立 binary。 |
| 條件與未拆時鐘 | 不把未查證當零 | D-03 Modbus library +1、Grafana +1；nginx、Sparkplug codec、外部 HMI 按採用各加。DNS/NTP 實作、browser、hypervisor、AP/switch 韌體與傳遞依賴仍須逐項盤點。 |

十三個具名產品只是下限，沒有證明十年能維護。原案未選 HTTP/crypto 實作，不能假裝精確總數已知；答辯刪 WSS 也沒有刪掉 HTTPS cache。broker 在純螢幕仍不可關，是 M-01 的真成本，而非計數技巧能抹平。

| 生命週期／授權對象 | 已有證據與不得越界的判斷 |
|---|---|
| Mosquitto | [mqtt-brokers.md L22](../../10-facts/mqtt-brokers.md#L22) 記雙授權；[L23](../../10-facts/mqtt-brokers.md#L23) 的八筆 commit 集中一人只支持低 bus factor 警訊，不證明全部維護者只有一人或專案死亡。[L24](../../10-facts/mqtt-brokers.md#L24) 有安全通報流程，[L29](../../10-facts/mqtt-brokers.md#L29) 有設定退場時鐘。LTS、實際鎖版與安全 artifact 未查證；EDL 義務解讀見 [L106](../../10-facts/mqtt-brokers.md#L106)，不能聲稱零義務。 |
| PostgreSQL | [postgres-timeseries.md L39](../../10-facts/postgres-timeseries.md#L39) 的支援終點來自官方頁摘要，不是本輪重查；部署版本與授權適用核對仍未查證。共叢集 history 不隔離 ERP 的容量、WAL 與還原成本。 |
| 其餘 11 個必要產品 | MQTT client、HTTP/crypto、SQLite、Odoo、Python/OpenSSL/Linux、container/Compose、Anthias：實際版本、授權、支援終點及維護者替補未查證。不能用舊 paho release 日期判死，也不能因現況未知就視為無時鐘。 |
| 選配及自有維護面 | Grafana/Modbus/HMI/codec 等各自鎖版與授權仍未查證；CA escrow、復原 epoch 登錄、協定/consumer 目錄、設定產生器也有本隊 bus factor。canary、前後 major、簽名升級與 rollback 是設計政策，沒有混版/斷電/還原通過證據。 |

R4 因此只小幅提升：空 cache 重建與 restore fail-closed 比還原舊 dynsec 可靠，但離線復原登錄、私鑰保管及多份 owner 對帳需要人持續維持。應按每個元件列到期日、修補來源與替補負責人，不用「每季檢查」取代未知的支援期限；未核對完整散布 BOM 前，M-05 不能整案判通過。

## MQTT 價值與代價

此點成立：站內訂閱扇出及 retained 初始快照讓相容的下一個 reader 不必改裝置，HMI 不繞 cloud。這不等於它讀得懂 payload、會自行 stale、能撤銷或能接續 history。MQTT 省的是接點與搬運，不是 F-46/F-47；Modbus 為主、只有一片螢幕時，收益尤其有限。消費者目錄與型號 admission 值得補，但不可把新建這些工作倒算成 MQTT 本來就免費提供。

| 使用到的第三方事實 | 精確本地來源與界線 |
|---|---|
| retained、有限 queue、ACL | [mqtt-semantics.md L76](../../10-facts/mqtt-semantics.md#L76)、[L43](../../10-facts/mqtt-semantics.md#L43)；[mqtt-brokers.md L28](../../10-facts/mqtt-brokers.md#L28)。是快取及授權零件，不證應用完成或任一封閉 T1 相容。 |
| Sparkplug Rebirth | [mqtt-semantics.md L66](../../10-facts/mqtt-semantics.md#L66)。允許受限診斷而拒絕致動是合理設計；商用 HMI、codec 版本與相容性仍未查證，不獎勵未交付的標準支援。 |
| proxy 與 L2 | [transport-through-networks.md L38](../../10-facts/transport-through-networks.md#L38) 是 TLS 終結後身分轉述證據；[L110](../../10-facts/transport-through-networks.md#L110) 是隔離建議，不是本站施工紀錄或合規證書。廠商攔截細節仍為摘要，實際政策未查證。 |

成本按答辯六包獨立相加為 28-40 人週，不能把每列共用工作再加一次，也不能把它稱作單螢幕最小交付的實測報價。相較原案 18 人週，已知工作更多；拆出第一個客戶仍必須包含安全、正確性與部署 gate。可逆性估計也只涵蓋工程，不涵蓋客戶排程、fleet 更新完成或受損金鑰後的現場復原。

## MUST FIX（恰好三件）

1. **閉合受限站點與安全部署。** 補足敏感 cloud 保密方案或取得明確例外核准，並交付 C-25 有線／無線隔離工件；以真實 policy 測 Apply、身分與內容，驗 CSR、跨環境重放、lease 和舊授權還原。無解就維持致命阻塞，不能改口算支援。
2. **證明 owner 到實體結果的恢復邊界。** 逐 backend 在動作與 CQ commit 前後中斷，連同 ERP/PG 停機、lost receipt、舊備份與容量耗盡驗收；通過條件是可重讀、無靜默 loss、無自動重做、unknown 可裁決且不誤放衝突工作，不能只看 transport ack。
3. **交付可維護的固定 profile。** 補齊 BOM、授權與支援期限，實作並驗證升級/rollback/復原；選定 T1/HMI 測時間、schema、stale 與換 path，量單螢幕足跡並拆出首客工期。這些條件測試能驗證修法，但目前全部仍是未通過的 gate。

## Steal-Worthy（恰好三件）

1. **owner 與快取徹底分離。** retained 提供初始快照，真正交接由 PG/ERP commit receipt 決定；重連與週期批次補讀可重建 cache，保留 CQ 與 dedupe 的不同回收責任。這個想法不綁 MQTT。
2. **分層判定存活與新鮮度。** conn/incarnation 配對的 Will 只提示可疑，裝置時間、quality、max_age 與授權 lease 決定資料是否可用；ERP 只收狀態轉移，避免心跳灌成業務 rows。
3. **隔離後才提供站內生態接點。** raw broker/parser 不持樹私鑰，驗證後供唯讀 HMI/consumer；穩定身分目錄處理換 path，Sparkplug 僅開受限 Rebirth，不讓資料整合偷渡成控制通道。

一句話裁決：P1-R 的站內 MQTT 與耐久契約值得保留，但兩類條件性致命部署阻塞和未驗證的安全／恢復 gates 尚在，不能採為已可交付的最終方案。