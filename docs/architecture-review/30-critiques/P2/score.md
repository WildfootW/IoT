結論先講：P2 答辯前 **41.50/100**、答辯後 **56.00/100**。答辯以真實的設計修訂換回安全與正確性分數，卻增加必要更新服務及維護責任；D-05 的驗證與 D-06 的來源契約仍未閉合，R1 上限維持五分。可保留為候選，不能宣布勝出或准予交付。

日期：2026-10-11。角色：Score。請求 strongest/xhigh；實際 inherited default，無 effort 控制，未宣稱配置生效。依指定順序完整讀取底稿、進度、[原案](../../20-proposals/P2-https-pull-defended.md#L1)、五份批評、[答辯](rebuttal.md#L1)及八份 facts；未讀其他提案評分，不採 interim 的排名。以下為設計判斷；第三方資料僅轉引本地 2026-10-10 紀錄，保留原文／摘要層級，沒有新網路查證或 PoC。

## 1. 評分

依[準則](../../03-brief.md#L42)，前欄評原案，後欄評採納答辯的設計，不評程式完成率。加權值為原分乘權重再除以十；誠實承認缺口不自動加分，寫清楚責任、狀態轉移與失敗處置才加分。

| 準則 | 權重 | 答辯前 | 答辯後 | 前加權 | 後加權 | 理由 |
|---|---|---|---|---|---|---|
| R1 | 20 | 4 | 5 | 8.00 | 10.00 | [scenarios-01](scenarios.md#L67)、[scenarios-02](scenarios.md#L75)由答辯 §2.3 補入口與 proxy profile；但 [scenarios-06](scenarios.md#L107)、[scenarios-07](scenarios.md#L115)的 verifier、快速來源與界線仍待定，不能越過五分。 |
| R2 | 15 | 4 | 7 | 6.00 | 10.50 | [security-02](security.md#L27)、[security-03](security.md#L37)、[security-06](security.md#L67)、[security-07](security.md#L77)有隔離、雙向簽章、獨立政策及資產 hash 修法；答辯 §2.2 的機密性與撤銷縮限仍需接受。 |
| R3 | 15 | 4 | 6 | 6.00 | 9.00 | [correctness-01](correctness.md#L9)、[correctness-03](correctness.md#L21)、[correctness-06](correctness.md#L39)、[correctness-07](correctness.md#L45)由答辯 §2.1 補提交及交接；[correctness-02](correctness.md#L15)仍只有條件式恢復，不能保證物理 exactly-once。 |
| R4 | 20 | 3 | 5 | 6.00 | 10.00 | [longevity-01](longevity.md#L15)已有必要 OTA 路徑，§2.5 補失敗回滾及恢復隔離；[longevity-02](longevity.md#L23)、[longevity-07](longevity.md#L59)、[longevity-09](longevity.md#L73)的完整 BOM、授權、接手能力尚未成立，見下方獨立盤點。 |
| R5 | 15 | 5 | 7 | 7.50 | 10.50 | [ecosystem-01](ecosystem.md#L7)、[ecosystem-02](ecosystem.md#L13)、[ecosystem-05](ecosystem.md#L31)、[ecosystem-08](ecosystem.md#L49)由答辯 §2.4 補 profile、curated 語意及客供 broker 接口；未把互通工作當免費。 |
| R6 | 5 | 6 | 3 | 3.00 | 1.50 | 原 §6 一屏可省 history/broker，但不是全站兩服務；答辯 §3 強制納入 issuer 隔離與 OTA 組合，實際部署責任增加，未量測的 RAM 不當作零。 |
| R7 | 5 | 5 | 6 | 2.50 | 3.00 | [longevity-12](longevity.md#L94)經答辯 §1.2 補傳輸中立契約與雙棧退出成本，§2.5 有更新出口；但樹、PKI、consumer 與既有 fleet 的替換仍有沉沒成本。 |
| R8 | 5 | 5 | 3 | 2.50 | 1.50 | 原 §9 的 22-29 人週漏必要更新、歷史後列；答辯 §3 的 40-60 更可信卻更昂貴，外審修補與 partner 配合仍另計，非首客的低成本方案。 |

加權總分（答辯前）：41.50/100
加權總分（答辯後）：56.00/100

## 2. 錨點與安全

三種形狀的方向成立：(a) 同機以獨立 listener、OS user 與受限本機通道分界；(b) 每 VLAN 的 bridge 向北連；(c) 站點經核准 profile 向雲端連，不新增 inbound。C-25 的現場不能假設已隔離；答辯要求 AP/switch 改造或獨立接線是具體處置，施工核准與負向測試是交付 gate，不另外捏造「沒有隔離設計」。

| 錨點 | 原案斷點 | 修訂設計及剩餘界線 |
|---|---|---|
| D-01 | Apply 版本與文件有了，但資產真偽、慢 reconcile、代理假報活未閉合 | manifest/hash、單槽 reconcile、版本化 actual、每屏 last-poll 與十五秒 live JSON TTL；三形狀皆可描述到畫面及 ERP 結果。 |
| D-02 | warm-up 零值與未來時間仍可能進平均、告警及正常歷史 | 彙整前 quality/time gate，writer 重驗；感測至 Grafana 的來源時間不被接收時間取代。 |
| D-03 | 同位址換表會併入舊歷史 | identity/generation 與人工換表程序；唯讀 Modbus 彙整到獨立 PG，不進控制迴路。 |
| D-04 | accepted 不能分辨效果前後崩潰，timeout 可破壞順序 | durable unknown、epoch/seq、單一執行槽；缺 backend 證據時不能完成或自動重跑。 |
| D-05 | 硬體簽 announce 不等於 attestation 已驗證 | 設定與存活仍在範圍；僅標 unknown 不能替代 verifier、證據新鮮度及拒絕政策，這是待補設計。鎖控制排除不扣分。 |
| D-06 | 本地 SSE/MQTT 不能補回已被一赫茲採樣漏掉的時間 | 已要求高速唯讀 tap、北向降採樣及離線頁面；partner 點表、實際來源與資料年齡界線未定，仍不能宣稱 HMI 錨點已成立。 |

R1 封頂不是因為文件尚無程式，而是最後兩項仍把必要決定留給將來。對 R2，原安全批評列的是零致命、九重大、四次要；不虛構「已消除致命安全項」。答辯的獨立政策點、claim 消耗、目的與世代綁定、失陷 recovery authority，確實處理 security-04、security-05、security-09 的結構缺口，此點成立。

[T5 原文紀錄](../../10-facts/transport-through-networks.md#L38)支持 TLS 終結會轉移身分信任，不支持簽章保密。答辯固定 trust profile，禁止握手失敗自動降級；但禁止 bypass 又要求對 proxy 保密的站點，仍是明列阻塞。七天 cert 不等於七天操作權，五分鐘命令／敏感文件 lease 與八小時非敏感 HMI 讀租約須分開驗收。合法 ERP scope 內的惡意內容、共用 hypervisor 故障域與 T2 媒體回捲限制仍在，七分不是安全認證。

## 3. 命令證據

[答辯 §2.1](rebuttal.md#L95)不再只畫 owner 表：業務及 outbox 同交易、固定 key、parent 耐久提交才回 receipt，每一百二十秒及重連批次反熵，補上局部 complete 遺失而 fetch 仍活的反例。snapshot revision 與 ERP 業務／cursor 原子提交，也正面修 correctness-07；這些是可實作的結構，不能因測試未跑而全數不給分。

CQ 未終態、unknown、未取得 ERP 最終 receipt 者被 pin；五百筆／十四天只約束已交接快取，tombstone 與 epoch floor 不跟結果一起刪。容量滿時背壓，完整媒體遺失時標 evidence_lost，已比只記淘汰計數強。schema 生效屏障、唯一樣本鍵與 dirty-bucket 又處理 correctness-08、correctness-10；但備份時點不同及實際耐久設定仍需驗收。

不能因此給 F-46/F-47 滿分。LED 副作用已發生而 CQ 終態尚未提交，與尚未動作可有相同紀錄；多一次 fsync 無法區分。答辯選持久 unknown、禁止補跑且不釋放 single-flight，是誠實且必要的縮限，不是「不漏做且不重做」已成立。只有逐 backend 選定同 key 可歸因回讀，或把操作改成穩定項目 ID 的可收斂 state，才有更強保證；人工開新 epoch 必須先排除舊 executor。R3 六分承認交接修復，也保留實體效果的不確定性。

## 4. 獨立盤點

以下按 Python、容器部署及沿用 player 的設計口徑，數必要維護槽位，不冒充已選完套件的 SBOM。同庫的兩個實例不算兩種引擎；OS、interpreter、TLS 等外部時鐘不能藏進「一支 node」。前後使用相同口徑，原案未列明的必要相依也補列。

| 軸／範圍 | 答辯前 | 答辯後 | 可重算清單與邊界 |
|---|---|---|---|
| 資料引擎 | 2 | 至少 2 | PG、SQLite；OTA server 內部引擎未查證，不假設沿用 PG。 |
| 自有技能槽位 | 4 | 4 | Python、SQL、shell、web JavaScript；不是四個 server runtime，Rust 未選不灌入。 |
| 自有 repo | 5 | 5 | node、ERP 模組、部署、e2e、Parts；contract/client 放既有 repo，後端邏輯仍各有接手責任。 |
| 共用外部軟體槽位 | 8 | 8 | Odoo、PG、SQLite、player、HTTP framework、TLS、X.509/簽章、PG driver。 |
| 平台／保管槽位 | 5 | 5 | Python interpreter、OS、supervision、容器 runtime、credential resolver/保管整合；末項選型未查證。 |
| 必要 OTA | 0 | 2 + U | Mender client、server/artifact 組合；U 為組合中尚未盤出的獨立相依，不代表零。 |
| 一屏外部槽位下界 | 13 | 15 + U | 上述 8 + 5，再加更新；不含 history、Grafana、MQTT。 |
| D-02/D-03 含 ops 增量 | 2 | 2 | Grafana、Modbus library；僅 D-02 可減 Modbus，無儀表板可減 Grafana。歷史另加 PG 實例、不加引擎。 |
| MQTT/Sparkplug 增量 | 4 | 3 | 前：ingress library、broker、client library、codec；後取消內嵌 ingress。raw/curated 雙實例不把 broker 時鐘加倍。 |
| 上列全選外部槽位下界 | 19 | 20 + U | 13 + 2 + 4，及 15 + 2 + 3；不與引擎、技能、repo 再總加。 |
| D-05／OPC UA | verifier 缺位；adapter 條件式 | verifier 至少 +1；OPC UA 若選另 +1 | 不以預留欄位算 verifier 已存在；全錨點修訂至少 21 + U，選 OPC UA 則至少 22 + U。 |
| 上列 19／20 槽位的授權證據 | 3 有本地佐證、16 待核 | 4 有本地佐證、16 + U 待核 | 前為 PG、amqtt、Mosquitto；後為 PG、Mosquitto、Mender client/server 根 repo。這不是客戶交付授權通過數。 |

授權佐證限於[PG 表 A](../../10-facts/postgres-timeseries.md#L99)、[amqtt 第 33 項](../../10-facts/mqtt-brokers.md#L84)、[Mosquitto 第 1 項](../../10-facts/mqtt-brokers.md#L22)與[Mender D1](../../10-facts/buy-options.md#L56)。最後一項僅記錄兩個根 repo 的 Apache-2.0，不能覆蓋 server 全部映像；[D2](../../10-facts/buy-options.md#L57)的付費功能界線只是摘要。既有 Odoo、player、Grafana 及其他未選套件仍是未查證，不能排除在 M-05 外。

每一外部槽位都要有支援、授權及更新責任清單；未定的時鐘不是自控。[PG F-11](../../10-facts/postgres-timeseries.md#L39)的支援終點含摘要，[Mosquitto 第 2 項](../../10-facts/mqtt-brokers.md#L23)的少數近期 commit 不能推出穩定或完整 bus factor，[第 8 項](../../10-facts/mqtt-brokers.md#L29)還有設定退場。答辯每季核查、兩人交接與年度恢復是合理制度設計，但尚無人力承諾可當既成能力。

## 5. 生態與成本

P2 此點成立：一屏免 broker，MQTT 可以只留站內入口與讀者投影，不持管理權威；這不是全面不用 MQTT 的收益。[MQ14](../../10-facts/mqtt-semantics.md#L53)直讀記錄的 twin 版本與重同步支持「應用仍需狀態契約」，不支持「broker 無價值」。retained 的晚加入快取成立，但需 owner 回灌、來源時間及品質；[MQ9](../../10-facts/mqtt-semantics.md#L36)、[MQ10](../../10-facts/mqtt-semantics.md#L42)另有權限及持久化條件。

答辯撤掉全拒訂閱，為特定 profile 保留 STATE 與受限 Rebirth，符合[MQ19](../../10-facts/mqtt-semantics.md#L66)、[MQ20](../../10-facts/mqtt-semantics.md#L67)、[MQ21](../../10-facts/mqtt-semantics.md#L68)的直讀紀錄。curated 共用單位、倍率及版本，客供 broker 按所需接口驗收，是實際生態修法；仍須付 client、profile 與第二個 reader 的恢復整合成本，NGSI／OPC UA 不冒充免費相容。

R6 下降來自新增必要部署，不是懲罰誠實。北側要有 ERP、PG、node、隔離政策／issuer 與 OTA 組合；屏端有 agent、display backend、player、updater，還有 DNS、可信時間及保管責任。原兩個中央應用角色從來不是全站 process 數；完整 container 數與 RAM 未查證。

成本以[答辯 §3](rebuttal.md#L158)重估：基礎四十至六十人週，加外審修補二至四，合四十二至六十四；外審三至五週是日曆時間，不再當人週加總。原案把首客感測歷史後列，兩份估算範圍不相同，不能直接稱效率退步。年度六至十已含 ERP 遷移，MQTT、HMI、Sparkplug 及 partner 工時另算。傳輸替換五至八及雙棧每年一至二人週，雖比原估可信，仍不能把整樹與 PKI 換掉的沉沒成本省略。

## 6. 三件 Must Fix

1. **閉合強保證與錨點設計。** 正確性／整合 owner 逐一決定 D-04 backend 的可歸因證據或 state 改寫，讓 owner 明確接受無法恢復的 unknown；同時定出 D-05 verifier 政策與 D-06 來源、資料年齡及離線界線。對應 correctness-02、scenarios-06、scenarios-07，不能只寫待 PoC。
2. **完成可交付更新與維護帳。** ops 固定 OSS BOM、授權、CM4 映像及受控更新路徑，給所有時鐘接手人與預算。依 longevity-01、longevity-05、longevity-09 驗 A/B、斷電回滾、跨庫恢復及 player 支援，失敗須重新選型，不能借根 repo 授權放行全部套件。
3. **封住部署安全及恢復 gate。** 安全／交付 owner 先核准 lease、proxy 機密性與 C-25 隔離取捨，再外審並測跨租戶重放、文件越權、失陷換鑰、停頁、超窗及三形狀冷啟動。對應 security-01、security-07、security-08 與 scenarios-02；不得以單次連通取代完整驗收。

## 7. 三個 Steal-Worthy

1. **耐久責任交接。** 同交易 outbox、批次反熵、結果 hash 綁定最終 receipt、未交接證據 pin 與獨立 tombstone，借走的是可追溯的保管規則，不是某種傳輸 ack。
2. **身分與操作授權分開。** 雙向目的／世代簽章、固定 trust profile、短 lease 與獨立政策點，能限制中介及 ERP 的傷害範圍，並明說簽章不等於保密。
3. **有觸發才引入 MQTT。** raw 隔離、curated 共用語意與受限標準 profile，讓本地讀者利用 retained／工具生態，同時保留 ERP owner 與 HTTPS trunk 的獨立性。

## 8. 裁決與狀態

一句話裁決：保留 P2 的修訂語意與站內生態邊界，但錨點、更新組合及安全放行未閉合前，不定案、不交付。

原始致命項只有 longevity-01。以設計評分看，[§2.5](rebuttal.md#L150)已選必要更新零件、持久更新階段、回滾與責任人，故「完全沒有升級路徑」已獲結構修補，R4 可以上升；以交付看，OSS 組合、樹代理及 CM4 適配仍未查證，依[答辯 §5](rebuttal.md#L236)保留致命 gate 未解除。安全致命零項不等於安全驗收已過。所有實作、外審及 PoC gates 均未執行；本檔的數字、引用與格式檢查不能解除它們。