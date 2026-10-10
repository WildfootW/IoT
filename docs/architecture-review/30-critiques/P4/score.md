結論先講：P4 答辯前 41.00、答辯後 52.50 分。它從過度承諾的平台替代案，改成較可信的「平台加自有安全與恢復契約」；正確性設計確有改善，三形狀的交付資格仍不成立。security-03 與 longevity-01 保留致命，R1 答辯後僅 5 分。這不是「不能買平台」的裁決，也不是採納修訂便等於部署成功。

# P4 獨立評分

日期：2026-10-11。已讀完整 brief、00/01/02、LOG/interim、P4、五份批評與答辯；未讀其他評分。依 Score 與 A.3 評審，runtime inherited default；strongest/xhigh 無法強制或核驗。本文只有文件判斷，沒有 web research、產品測試或部署驗收。第三方紀錄沿用 2026-10-10 查證日；master、搜尋摘要及功能清單均不升格為交付版本保證，未取得的商約、版本相容與功能權利一律未查證。

## 1. 評分

依 [brief §3](../../03-brief.md#L40) 原權重。前欄評原案，後欄採納答辯的架構差異；改善分給具名 owner 與恢復規則，不給尚未取得的商業權利或 PoC 成果。

| 準則 | 權重 | 答辯前 | 答辯後 | 前加權 | 後加權 | 理由 |
|---|---|---|---|---|---|---|
| R1 | 20 | 4 | 5 | 8.00 | 10.00 | 情境擬合：[scenarios-02](scenarios.md#L77)、[scenarios-07](scenarios.md#L107)、[scenarios-08](scenarios.md#L113) 經答辯補文件、reader 管理與 HMI 路徑；但 [security-03](security.md#L27)、[longevity-01](longevity.md#L24) 仍阻塞必要形狀，不能超過 5。 |
| R2 | 15 | 3 | 5 | 4.50 | 7.50 | 安全：[security-01](security.md#L13)、[security-04](security.md#L34)、[security-06](security.md#L48) 對應 [答辯 §3.1](rebuttal.md#L123) 的 per-function 身分、issuer、環境隔離；簽章有結構收益，inspection 機密性與同 VLAN 實體隔離仍不是已解安全。 |
| R3 | 15 | 4 | 7 | 6.00 | 10.50 | 正確性：[correctness-01](correctness.md#L7)、[correctness-03](correctness.md#L19)、[correctness-07](correctness.md#L43) 經 [答辯 §3.2](rebuttal.md#L131) 補 stable key、unknown 隔離與 CQ 重讀；[correctness-02](correctness.md#L13) 的重掃、CQ page 同步與真實 backend 冪等性仍待證。 |
| R4 | 20 | 3 | 4 | 6.00 | 8.00 | 十年維護：[longevity-02](longevity.md#L39)、[longevity-03](longevity.md#L57)、[longevity-04](longevity.md#L67)、[longevity-06](longevity.md#L87)；本文獨立重算五維欄項 43 → 44～45。備份、混版、退出有設計，M-05 與支援期限未解，安全知識轉回自有 agent/issuer。 |
| R5 | 15 | 6 | 7 | 9.00 | 10.50 | 生態槓桿：[原案 §5](../../20-proposals/P4-buy.md#L174) 的 connector、alarm、本地 HMI 可重用；[ecosystem-01](ecosystem.md#L9)、[ecosystem-03](ecosystem.md#L25)、[ecosystem-04](ecosystem.md#L33)、[ecosystem-07](ecosystem.md#L57) 經答辯補可信映射與 consumer 契約，不把 integration 當買到的能力。 |
| R6 | 5 | 4 | 3 | 2.00 | 1.50 | 最小足跡與維運：[scenarios-09](scenarios.md#L119)、[答辯 §3.5](rebuttal.md#L171)；中央由原案明列三單元增加為六單元，relay 獨立執行另加一；分 PG、issuer 改善隔離卻增加維運，RSS 尚未量測。 |
| R7 | 5 | 4 | 5 | 2.00 | 2.50 | 可逆性：[longevity-05](longevity.md#L77)、[答辯 §3.7](rebuttal.md#L219)；穩定識別、owner 與 export 契約改善退出，Edge/server、權限、dashboard 與 fleet 仍須一起遷移，不能算成一條 SQL。 |
| R8 | 5 | 7 | 4 | 3.50 | 2.00 | 首次客戶價值：[原案 §9](../../20-proposals/P4-buy.md#L244) 的 14.5 人週有沿用 Odoo/Python 的基礎，卻漏安全與恢復；[答辯 §3.7](rebuttal.md#L219) 改估 21～33，人力與等待增加，尚未證明相對自建節省一半。 |

加權總分（答辯前）：41.00/100

加權總分（答辯後）：52.50/100

## 2. 錨點與證據裁決

M-05 禁止綁住客戶，不是禁止付費。免費 grant 的舊摘要不能推出所有 OEM 商約都不合格；反過來，「我們代持」也沒有自動取得跨站點、更新與下游使用權。故不照抄 interim 的反買結論，但也不因答辯願意談合約而解除致命。舊線有 patch 不等於十年支援，期限未知亦不等於已死亡。

Odoo 保有業務 desired、樣本不進 ERP rows，此點成立；登錄鏡像有明確重建方向，就不必然是第二權威。P0 的 owner 分工此點成立，並不排除購買可重讀的服務端狀態。MQTT 的 client、扇出及 late-joiner 價值也成立；P4 的 device API 不能因此被當成任意 topic 的 broker，更不能把 retained 當完整結果帳本。

| 外部證據 | 日期與可採信範圍 | 本評審的限制 |
|---|---|---|
| [buy-options T2](../../10-facts/buy-options.md#L25)、[T3](../../10-facts/buy-options.md#L26)、[T6](../../10-facts/buy-options.md#L29) | 2026-10-10 的 BSL、免費 100 devices／1 server 摘要，以及 Edge 舊 Apache 紀錄 | Device 計數、交付版 Edge 授權、OEM 權利及支援期限未查證；不假設邏輯 function 能免費合併計數。 |
| [原案 RPC 證據](../../20-proposals/P4-buy.md#L13)、[Gateway 證據](../../20-proposals/P4-buy.md#L30) | 2026-10-10 引讀的狀態欄位、SDK／release 紀錄；connector 清單見原案 §1 | 可購買零件的線索，不證明耐久 commit、端點副作用或隔離 runner；指定 release 行為未查證。 |
| [transport T5](../../10-facts/transport-through-networks.md#L38)、[T12](../../10-facts/transport-through-networks.md#L50) | 2026-10-10，TLS 終結的信任轉移有原文；gRPC keepalive 限制只有摘要 | 不由 10 秒心跳推定穿越成功；簽章不加密 routing secret，也不恢復被封鎖的 stream。 |
| [MQ9](../../10-facts/mqtt-semantics.md#L36)、[MQ14](../../10-facts/mqtt-semantics.md#L53)、[MQ18](../../10-facts/mqtt-semantics.md#L65) | 2026-10-10，retained 權限重檢、twin 的服務端版本與 Sparkplug BIRTH 的既有紀錄 | 標準／其他產品只能說明能力邊界；不是 TB 已有 schema、Sparkplug endpoint 或端到端正確性的證據。 |

以下依答辯逐一走查，箭頭是待實作契約，不是通過紀錄。三形狀共用上行結果歸屬與下行授權；(c) 的阻塞不因其他兩形狀可畫出路徑而被平均掉。

| 情境 | (a) 同主機 | (b) 同站跨 VLAN | (c) 雲端、僅 outbound | 尚存 gate／依據 |
|---|---|---|---|---|
| D-01 | Odoo Apply → server desired → agent → display backend/Anthias；applied hash 回 ERP | desired 經 Edge；unit 向受限 relay 拉指定版本文件及 assets；結果經 Edge 回 ERP | Edge 與 content relay 各有核准出口；斷雲保留最後完整內容；新 Apply 受 inspection 阻塞 | 文件版本、MES token JSON、實際換頁；[scenarios-02](scenarios.md#L77)、[correctness-06](correctness.md#L37)。 |
| D-02 | sensor process 聚合、warm-up/time quality → per-function client → server store；業務 alarm 回 ERP | 同一路徑加 Edge 本地持久化，補傳保持 source time | 站內採樣 → Edge 緩衝 → cloud store；不由補傳更新 presence | clock quality、HCHO 門檻與缺值；[correctness-09](correctness.md#L55)、[scenarios-03](scenarios.md#L83)。 |
| D-03 | 唯一 RTU/TCP poller → signed 壓差／區間統計 → store → 歷史查詢 | south 主動 502 白名單或本機 serial → 隔離 collector → Edge → north | 本地持續讀取，受控出口補傳三年資料；無資料時顯缺值 | register/serial 身分、型別與容量；[scenarios-04](scenarios.md#L89)、[correctness-10](correctness.md#L61)。 |
| D-04 | ERP capability 驗證 → profile/show intent 或 keyed job → worker；逐 strip 結果回 ERP | 經 Edge 轉送；single-flight 與 backend key 不移交給 transport | WAN 斷仍維持本地 timeline/standalone；CQ 待重讀 | 部分完成、物理 crash gap、unknown 不解槽；[scenarios-06](scenarios.md#L101)、[correctness-05](correctness.md#L31)。 |
| D-05 | ERP pending Manage → registry 鏡像 → reader adapter；reader presence/config actual 回 ERP | 同流程經 Edge，換路徑仍是同一 reader | 管理設定及回報走 outbound，斷線顯待套用 | reader API 未取得；只身分、存活與非控制設定，卡權限／排程／門鎖不走此通道；[scenarios-07](scenarios.md#L107)。 |
| D-06 | PLC → edge controller/collector → 站內 server HMI；業務到 ERP、分析到 store | HMI 讀本地 Edge；PLC 控制與 recipes 留現場 | WAN 不在現場顯示路徑；Edge 另補傳 cloud，HMI 必須可斷雲重新登入 | 逐點 quality/freshness、採樣至畫面延遲及新 browser reload；[scenarios-08](scenarios.md#L113)、[ecosystem-02](ecosystem.md#L17)。 |

移除 tenant-wide gateway、把 parser 與持鑰 agent 分 process，確實縮小越權路徑；簽章綁收件者與 generation、staging 先禁寫，也比口頭限制強。然而同 VLAN 的 lateral traffic 不會因多一個 Edge 自動消失。換設備或重分網段必須列為交付成本，不能假設客戶已具備；三十分鐘 lease 也只是限制離線接受新命令的窗口，並非即時撤銷。

## 3. 正確性改善的邊界

stable job_key 在 ERP 交易內先落 outbox，平台 id 僅記 delivery attempt，修掉回覆遺失後換 key 的漏洞；Apply 只走一條版本化 intent，結果由實際套用 hash 決定。物理效果與 SQLite 不能原子提交，答辯讓 running 復原為 unknown、不自動重做並保留執行隔離，這是可接受的安全取捨，不是假裝完成通用 exactly-once。

仍需證明原 in-memory 配置可從 owner 重建待辦，以及 signed CQ page 能跨 Edge 同步、按 key 重讀。頁面大小、超窗索引與 cursor 交易不可只寫「稍後測試」。以下窗口在設計上較完整，卻都是待驗設定；容量滿時拒新 job、量測丟棄留下缺口，才沒有把有限資源偽裝成無限保證。

| 事實 | 答辯後 owner／窗口 | 獨立判定 |
|---|---|---|
| outbox／業務結果 | ERP；未結案無 TTL，結案至少 90 日 | 平台 RPC expiration 與 F-67 的兩日 inbound 均不得提早刪除此帳。 |
| CQ | unit；至少 30 日且 ERP 耐久確認後才清；32 MiB 初始配額 | 80% 告警、滿額拒新 job；簽章 page/ACK/cursor 必須有重送恢復與缺頁觀測。 |
| dedupe | 至少 90 日；最高 generation/seq 長存 | 七日失聯 + 二日補傳 + 七日備份回溯 = 16 日，低於 30／90 日；仍需拒絕更舊備份啟動下行。 |
| Edge／collector | 至少支援七日未上傳事件；按峰值 bytes/s 配置 | 未確認事件不是可丟 cache；峰值、餘裕、drop/oldest-age 尚未量測。 |
| desired／文件／telemetry | 最後可用文件直到替代版完整；量測三年 | 文件與來源時間不可被接收時間或通知 TTL 改寫；roll-up/retention 邊界待驗。 |
| 來源 | [答辯 §3.3](rebuttal.md#L139)、[correctness-07](correctness.md#L43)、[correctness-08](correctness.md#L49) | 這是架構採納分，不是 N-17/N-18 驗收章。 |

## 4. 獨立種類與 lifecycle 帳

以完整 (b)(c) 含一種 T1 collector、保留 player、不含可選 broker/export 為同口徑。引擎按程式族計，runtime 不再把 PG 引擎重算成語言 runtime；方言按獨立 schema 家族計。這些是待釘 BOM 的下限，不照抄原案 16 或答辯 42，也不拿總數跨提案排名。

| 維度 | 答辯前 | 答辯後 | 逐項 inventory |
|---|---|---|---|
| 外部程式／引擎 | 9 | 9 | TB server、Edge、Gateway、PG、SQLite、Odoo、nginx、Anthias、browser；Gateway 後移到 collector，不因離開 CM4 就消失。 |
| 語言／設定方言 | 7 | 8 | Python、Java（讀）、TBEL、SQL、JavaScript；TB profile/rule/dashboard 一族、Gateway converter 一族；後增自有 manifest/envelope/CQ 契約族。 |
| runtime | 3 | 3 | Python、JVM、browser JS；不另列 PG runtime。 |
| 自有 repo | 5 | 5 | ERP、edge、tb-config、deploy、e2e；issuer、agent、產生器併 repo 不等於沒有維護工作。 |
| 外部時鐘責任 | 19 | 19～20 | 下表逐項；新 unit MQTT SDK 若不能共用既有 library 再加一，尚未選定。 |
| 五維欄項合計 | 43 | 44～45 | 9+7+3+5+19；9+8+3+5+(19～20)。跨維度有重疊，不是互異產品數。 |

| 時鐘組／個數 | 授權與維護證據 | 需要持續做的事 |
|---|---|---|
| TB server、Edge、Gateway：3 | [T1](../../10-facts/buy-options.md#L24)、[T6](../../10-facts/buy-options.md#L29)、[原案 Gateway](../../20-proposals/P4-buy.md#L30)，2026-10-10 的三條 release 線；現行支援期限未查證 | 固定三線相容矩陣、canary/rollback；每版及續約重核使用權，不把同廠商算一鐘。 |
| PG、SQLite、Odoo：3 | [PG F-11](../../10-facts/postgres-timeseries.md#L39)，2026-10-10 含政策摘要；其餘交付版 BOM／支援未查證 | DB 遷移、driver/API 相容、WAL 與還原；PG 政策不證明 TB 支援同版。 |
| nginx、Anthias、browser：3 | [原案 §6](../../20-proposals/P4-buy.md#L195)、[答辯 §3.5](rebuttal.md#L171) 的執行依賴；指定版授權／支援未查證 | HTTPS 路由、player API、頁面與 browser 更新，保留替換 reconcile 介面。 |
| OS/kernel 映像、container/Compose、JDK、Python：4 | 平台與映像依賴；交付發行版／LTS 未查證 | 釘映像、SBOM、簽章換版及 rollback；不能由 master 的 Java 要求推定每年強制升大版。 |
| tb-mqtt-client、tb-paho-mqtt-client：2 | [原案 §2](../../20-proposals/P4-buy.md#L30)，2026-10-10 的相依紀錄；交付版及 fork 支援未查證 | 分別追 fork 與 SDK patch，驗 reconnect、scope 及重送行為。 |
| HTTP stack、crypto、Modbus library、sensor driver：4 | 類別由 [原案 §2](../../20-proposals/P4-buy.md#L24) 與 [答辯 §3.5](rebuttal.md#L171) 推得；精確套件、授權、維護狀態未查證 | 每一具體 library 都須填責任人及 patch 期限；不把 decoder、TLS 與簽章審查算成平台已包辦。 |
| 條件性，不入上述 19 | Mosquitto：[授權](../../10-facts/mqtt-brokers.md#L22)、[時鐘](../../10-facts/mqtt-brokers.md#L23)，2026-10-10；Grafana、Sparkplug endpoint、NGSI facade、OTA 選型未查證 | raw/normalized 兩 broker 實例仍一引擎／一時鐘；各 consumer、標準套件與 OTA 另加 BOM、契約和升級工，非免費附送。 |

原案中央明列 Odoo、TB、共享 PG 三單元；同時計入 HTTPS 入口為四，factory provisioning 工具另列。答辯改兩個 PG、issuer、nginx，中央至少六；content relay 若獨立常駐為七，CM4 的 agent、backend、player 與 DNS/NTP 不在此數內。每 VLAN 還增加 Edge、PG、relay/collector 的實例工。服務數不是 RSS，最小一片螢幕是否夠小仍未量測。

N-09 不能只備份 north：ERP、TB、Edge、collector SQLite、unit CQ/媒體與 issuer ledger 都有恢復責任，私鑰分流託管。混版、半年還原、年度退出抽驗是有用的制度設計；尚無執行紀錄。供應商掌握 release 與授權，我方另掌握安全契約，兩種 bus factor 疊加，不能互相抵銷。

## 5. 成本與剩餘阻塞

R8 評的是同範圍第一次客戶價值，不獎勵少列工作。21～33 人週取代原估，不再加總逐 finding 的重疊工時；inspection 通道另估 4～8、人機接口等待與費用未知。退出 16～24 人週仍另有逐站 rollout，不能因 history 可轉表就提高成低成本可逆。這些是粗估，不是報價或排程承諾。

致命仍為 security-03 的無 bypass cloud 路徑與 longevity-01 的 M-05 採購資格。其餘 gate 包括 C-25 隔離工件、reader 管理 API、離線 HMI、新鮮度、CQ 同步、備份恢復及足跡；有清單不等於有解。原 FIWARE 備案未展示同範圍修復，不能替它們兜底。

## 6. Must Fix（三件）

1. **MF1：取得可交付商約。** 指定版本、功能、全部站點與來源計數，證明客戶無需另簽、註冊、維持 vendor key 或承擔操作禁令；同時取得修補、終止後使用及資料退出權。未完成就維持 M-05 致命，不以縮成 cloud-only 取代三形狀。
2. **MF2：封閉兩端安全與網路路徑。** 無 bypass 時提出經客戶核准、可達且保密的具體通道；連同簽章、issuer 輪替撤銷、環境還原、同 VLAN 圍堵及文件出口一起驗收。不能用簽章代替加密，也不能靠放寬防火牆讓 PoC 過關。
3. **MF3：證明 owner 契約跨產品成立。** 釘完整 BOM，在原 queue 配置驗提交回覆遺失、各層 crash、效果後斷電、超窗及舊備份；完成十八組流程、CQ 重讀、reader 非控制管理與斷雲 HMI。unknown 必可追查且不重跑，量測／容量與升級恢復均須有結果。

## 7. Steal-Worthy（三件）

1. **SW1：現場 HMI、業務與分析分流。** 讓 PLC 資料留站內供 HMI，ERP 只收業務事實；MQTT export 按實際 consumer 觸發，避免把 WAN 或 ERP polling 放進低延遲路徑。
2. **SW2：重用 decoder，不交出權限。** 現成 connector 可省協定實作，但置於低權限 collector，可信來源映射與版本化功能契約仍由我方掌握；明確保留買與整合的邊界。
3. **SW3：平台當可重建鏡像與有用副本。** ERP outbox、unit CQ 分別持有事實，平台負責可替換的服務端工作；同時規劃恢復與退出，既不重造所有平台功能，也不把正確性押在一次通知上。

一句話裁決：保留 P4 為有條件採購候選；兩項致命 gate 未關閉前，不採為三形狀共同基底。