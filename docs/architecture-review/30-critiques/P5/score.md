結論先講：P5 答辯前 36.50、答辯後 52.25 分。契約 A 值得保留，但不是免費資產；第二個生產 MQTT binding B 尚未證明淨收益。答辯確實修訂交易、來源授權、重讀與還原結構，不能一概當成空泛承諾；然而拒絕 bypass 的保密型 cloud profile 仍不支援，現場隔離及實體動作恢復尚無交付證據，不能成為無條件最終方案。

# P5 獨立評分

日期：2026-10-11。依 [../../03-brief.md](../../03-brief.md) §3、[../../RESUME.md](../../RESUME.md) A.3 及 [../../90-resume/wave-b-proposal.js](../../90-resume/wave-b-proposal.js) Score。已讀指定底稿、P5 全文、五份批評與答辯；不讀其他新評分，不採 interim 偏好。請求 strongest/xhigh，實際沿用 host inherited default，無 effort knob，不能驗證具體模型或推理強度。

## 評分口徑

「前」評原提案，不替它補答案；「後」評採納 [rebuttal.md](rebuttal.md) 的修訂設計，不是已上線系統。A 包含契約、語意核心、conformance 與 memory；B 是 unit 的第二個生產 binding，不等於南向 MQTT ingress。49 項都有答辯只證明覆蓋，不代表49項已解決。以下是評審意見，第三方事實另附本地實際列號；原查證日為 2026-10-10，本輪沒有網查或實作驗證。

| 準則 | 權重 | 答辯前 | 答辯後 | 前加權 | 後加權 | 理由 |
|---|---|---|---|---|---|---|
| R1 | 20 | 4 | 5 | 8.00 | 10.00 | [scenarios-01](scenarios.md#L42)、[scenarios-08](scenarios.md#L70)：原 cloud 入網與 HMI 冷啟動流程不足；答辯 §4 補六類流程，但拒 bypass 的保密 profile 仍阻塞，R1 <= 5。 |
| R2 | 15 | 3 | 6 | 4.50 | 9.00 | [security-01](security.md#L11)、[security-03](security.md#L34)、[security-05](security.md#L58)：逐物件簽章、穩定身分、私鑰分流及 HTTPS 管理是實質修法；答辯 §3/§4 的 lease、隔離與金鑰恢復未經外審或實測。 |
| R3 | 15 | 3 | 6.5 | 4.50 | 9.75 | [correctness-01](correctness.md#L11)、[correctness-02](correctness.md#L17)、[correctness-04](correctness.md#L31)、[correctness-06](correctness.md#L43)、[correctness-07](correctness.md#L49)：答辯 §2 補交易、receipt、完整 snapshot、去重與 recovery epoch；效果不可查仍須 unknown，不給 exactly-once 滿分。 |
| R4 | 20 | 3 | 4 | 6.00 | 8.00 | [longevity-01](longevity.md#L15)、[longevity-04](longevity.md#L42)、[longevity-08](longevity.md#L75)、[longevity-10](longevity.md#L89)：重算見下；答辯 §5/§6 增加更新與還原責任，但 BOM、支援線、boot 能力及替補維運者未落實。 |
| R5 | 15 | 5 | 6 | 7.50 | 9.00 | [ecosystem-02](ecosystem.md#L13)、[ecosystem-04](ecosystem.md#L25)、[ecosystem-05](ecosystem.md#L31)、[ecosystem-08](ecosystem.md#L49)：本地正式投影與 consumer 契約補強生態價值；不能把相同 broker 基線已有的收益再記給 B。 |
| R6 | 5 | 5 | 5 | 2.50 | 2.50 | [scenarios-09](scenarios.md#L74)、原提案 §2、答辯 §5：單屏免 history/broker 成立；ERP PG、proxy、CM4 player/browser、恢復工具不能藏進「兩服務」，尚無足跡量測。 |
| R7 | 5 | 4 | 6 | 2.00 | 3.00 | [longevity-02](longevity.md#L26)、[longevity-06](longevity.md#L61)、[longevity-10](longevity.md#L89)：答辯 §6 的 prepared/active generation、HTTPS 管理與零依賴 90 天比直接刪 binding 可靠；未驗 OTA、離線舊 fleet 與 ACL 遷移仍昂貴。 |
| R8 | 5 | 3 | 2 | 1.50 | 1.00 | 原提案 §9、答辯 §6、[ecosystem-08](ecosystem.md#L49)：首客 A 工程由原估 25-31 人週擴至含外審修補 40-55；誠實增加預算不等於更快產生價值，B 的 6-9 人週另計。 |

加權總分（答辯前）：36.50/100
加權總分（答辯後）：52.25/100

## 錨點與安全

三形狀的決定點不是協定名稱：(a) 須在既有 ERP 主機完成獨立綁址與啟停；(b) 須讓 T1 無法直達同 L2 鄰居；(c) 須由站點 outbound 完成受驗證的入網。答辯要求 AP/交換器隔離是必要修法，但既有 C-25 不能被默認已改造。它明示不支援的 inspection profile 則是支援範圍缺口，不是多跑一次測試便會消失，因此後評 R1 仍封頂 5。

| 功能 | 修訂後流程的獨立判斷 | 尚缺證據 |
|---|---|---|
| D-01 | Apply 交易、全媒體 manifest、換頁讀回、actual 及 ERP 同版對帳；MES 有獨立業務 projection。 | scenarios-02、scenarios-03、correctness-08；斷網保持舊版與無 Apply 更新未驗。 |
| D-02 | 品質/來源時間、30 秒平均、spool、PG、Grafana；evt 只送業務事件。 | scenarios-04、correctness-09、correctness-12；壞時間與 ERP 停機補報未驗。 |
| D-03 | instrument profile 先宣告，再輪詢、換算與入史。 | scenarios-05、correctness-10、correctness-11；負差壓、換表與晚到資料未驗。 |
| D-04 | 單 controller 管 timeline；跨 unit 非原子且逐成員回結果。 | scenarios-06、correctness-02、correctness-05；每種 job 的效果恢復能力尚未對接。 |
| D-05 | desired/mgmt 與 actual revision 分離；身分、存活、設定在內，鎖控制不在。 | scenarios-07、correctness-12；T3 硬體、出勤保存規則未查證，不因未建控制 fabric 扣分。 |
| D-06 | 本地逐 metric 投影與 HMI，獨立北向資料鏈；WAN 斷不應停本地更新。 | scenarios-08、ecosystem-01、ecosystem-04、ecosystem-07；PLC 介面、品質映射與斷 WAN 冷啟動未驗。 |

R2 加分來自新增的驗證者與拒絕條件：簽章綁 tenant/serial/epoch/digest，管理面脫離 broker，issuer 與業務鍵分離，媒體驗 hash，staging 不載 prod secrets。這比「日後安全測試」具體。可是七天憑證與十五分鐘 lease 不是離線即時撤銷；解封材料的冷啟動、同主機隔離及 N-03 仍需驗收。簽章不提供保密，bypass 要由客戶同意，不能默認。廠商 inspection 限制僅有[本地摘要](../../10-facts/transport-through-networks.md#L34)，[TLS 終結轉述](../../10-facts/transport-through-networks.md#L38)有原文紀錄，兩者證據等級不同。

## 端到端正確性

R3 此點成立：ERP 受理與 SQ/outbox 同交易，unit claim 後交獨立 worker，parent 落盤才 receipt，ERP 結果及 cursor 同交易；缺資料可以完整 snapshot 重讀。CQ 消費確認、永久 dedupe floor、還原隔離與新 epoch，分別處理保管責任、重放資格及版本倒退。[correctness-03](correctness.md#L23) 的 PUBACK 缺口因此得到設計修法；[本地應用回應先例](../../10-facts/mqtt-semantics.md#L53)不證明本案已耐久。

最大保留是「動作已發生、CQ 未提交」。答辯正確地禁止重做與換 key，timeout 不放行相依工作；這可以保安全，卻可能永久阻塞。必須逐個 LED/backend 指出能查原結果、改為 state intent，或走人工核對的哪一條，不能只列 running。另須釐清答辯 §2 的歷史 CQ/量測 pin 與 §3 每物件 expiry/lease 的判斷時點：舊 SQ 不准再執行，不表示晚到的真實結果也可拒收。這是 [correctness-06](correctness.md#L43)、[correctness-07](correctness.md#L49) 的殘餘規格問題，不是已確認的實作 bug。

## 獨立維護盤點

以修訂後 Python 單屏為基線，逐項盤點，不採作者原 10/11/13 或答辯的 28。下列是不同維度，不相加冒充常駐服務；同程式多角色不重算，同 repo 裡不同責任不因此免費。

| 維度 | 獨立列出的種類 | 計數 |
|---|---|---|
| 引擎 | PostgreSQL、SQLite；history 復用 PG 不加引擎種類。 | 2 |
| 維護語言 | Python、SQL、JavaScript；Shell 若用於交付腳本另計，尚未凍結。 | 3，條件 +1 |
| 程式、runtime 與維運工具 | Odoo、node、display backend、Anthias、browser、recovery helper、Python runtime、Linux、systemd、nginx、Docker、Compose。 | 12；不是 12 個常駐 process |
| 直接外部庫 | HTTP stack、X.509/簽章 crypto、TLS backend；實際選型未凍結。 | 至少 3；首客 sensor driver、Modbus 庫各另計 |
| 自有 repo | node、ERP 模組、部署、IoT_e2e、IoT_Parts。 | 5 |
| 非服務治理工件 | 契約/schema/oracle、PKI/escrow、跨 owner restore、fleet 相容與退出政策。 | 4 組責任，不另假設新 repo |
| 條件增量 | Grafana；Mosquitto 與 MQTT client；Sparkplug codec；OPC UA 庫；新增 sensor/LED/Modbus backend 與 profiles。 | Grafana +1；MQTT +2；codec/OPC UA 各至少 +1；各 backend 類別另計 |

外部軟體時鐘下限為 14 個追蹤項：兩引擎、Odoo/player/browser 三項、Python/Linux/systemd/nginx/Docker/Compose 六項、HTTP/crypto/TLS 三項。另有 DNS、NTP、hypervisor、CM4 boot/firmware 四組尚未凍結的供應責任；不能宣稱已知其獨立 release 數。自管 DHCP 再加責任；同一 MQTT 庫不按裝置數重算，但 B 新增 fleet 套件與混版矩陣。

授權與時鐘分開核：PG 有[本地 PostgreSQL License 彙整](../../10-facts/postgres-timeseries.md#L99)，支援截止的[版本資料](../../10-facts/postgres-timeseries.md#L39)含摘要；Mosquitto 的[授權紀錄](../../10-facts/mqtt-brokers.md#L22)須核實發行物中 EDL 與 SPDX 表述，不能概括成「無義務」。其[維護紀錄](../../10-facts/mqtt-brokers.md#L23)顯示近期提交集中，不等於停維護。其餘選定版本的授權、LTS、維護者及平台相容均未查證。季度雙 reviewer、每日備份、recovery helper 是自有承諾；沒有替補人員與還原證據，bus factor 不會因文件而下降。P0 此點成立：復用 PG 可少一種引擎，但不能免容量與還原成本。

## 生態與首客成本

MQTT 的扇出、retained 快取與接入工具有價值，不應因不用作 owner 就判負資產；[queue 上限](../../10-facts/mqtt-semantics.md#L43)也說明 T1 在進入耐久 ingress 前仍會掉資料。答辯新增 schema/snapshot、逐 metric 投影、產線授權及客戶 broker 責任表，R5 因此加分。但 [Sparkplug BIRTH](../../10-facts/mqtt-semantics.md#L65)不是 P5 slot 的別名；NGSI/OPC UA mapping 與 HMI 仍須交付，B 不能領這些工作的全部功勞。

R6 不因重新列帳而再扣同一份既有依賴，但「兩服務」不含完整單屏系統；RAM、磁碟與冷啟動仍未量測。R7 的結構性改善可條件加分，換 broker 的 3-5 人週仍不含外審及 fleet 等待。R8 以三至五屏加環境感測、無 B/歷史為首客：40-55 人週可當風險預算，不能當已驗工期；無有效時間或 bypass 的現場甚至無法按此範圍交付。單屏裁剪版尚無獨立估價；需歷史另加 2-4，人週與外審三至五日曆週不能混加。雙 binding 的[成本先例仍缺](../../10-facts/precedents.md#L102)。

## Must Fix

1. 補齊錨點交付：對 C-25 提供可部署的 L2 隔離、三形狀綁址/proxy/時間工件；明確處理拒 bypass 的保密 profile，不能以排除客戶冒充通過。完成 N-18 與 PKI 外審，核准十五分鐘撤銷取捨。對應 security-03、security-04、security-05、scenarios-01、scenarios-09；答辯 G-S/G-D。
2. 封閉效果與重播：逐 backend 列效果恢復表，定清晚到 CQ 的授權/expiry；用「八天 cursor 加新 SQ」與「效果已發生但 CQ 未提交」反例驗證，連同 ERP 重啟、GC、舊庫還原及 evt 入帳，不能靜默漏帳或重做。對應 correctness-01、correctness-02、correctness-04、correctness-06、correctness-07、correctness-12；G-A。
3. 交付可維護的首客基線：凍結含授權/支援線的 BOM、責任人、可恢復映像與還原流程，實測單屏足跡與 D-06 profile；B 只在等同 broker/投影/HMI 基線下證明淨收益後啟用。對應 longevity-01、longevity-08、longevity-10、scenarios-08、ecosystem-08；G-U/G-B。

## Steal-Worthy

1. 借走 A/B 分帳與共用 oracle：先定 owner、receipt、完整重讀與 unknown，memory 可注入反例，不預付第二生產 binding。來源：原提案 §1.1、答辯 §2。
2. 借走管理與資料面的分離：HTTPS 管理持續可用，broker 不持樹私鑰；T1 經驗證與品質投影才給 HMI。來源：security-02、ecosystem-02、答辯 §3/§4。
3. 借走以 fleet 證據退出：prepared/active generation、同 key 對帳、零依賴九十天才刪 binding；不能以 repo 活躍度代替裝置狀態。來源：longevity-02、答辯 §6。

## 殘餘閘門與裁決

五份批評原標致命 0；獨立出貨判定仍有 profile 級致命阻塞：拒 bypass 的保密 cloud profile 明確不支援，無隔離的 C-25 不能安全接入。這不等於 A 在所有場景不可修，也不授權改掉錨點。G-A/G-S/G-D/G-U 均未執行，G-B 僅啟 B 時適用；PLC/T3/授權/boot 能力的未查證仍保留。本輪僅驗證評分文件的算術、格式、引用與長度，不能宣稱通過架構測試。

一句話裁決：採 A 作待驗契約，B 待淨收益證據；錨點、效果恢復與可維護交付未閉合前，不准整案出貨。