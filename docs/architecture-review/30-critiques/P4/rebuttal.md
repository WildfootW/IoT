結論先講：接受 40 條、部分接受 9 條、反駁 0 條，共 49 條。P4 保留為有條件採購候選，不是三形狀已可交付的基底；原有兩項致命 finding 均未解除。

1. 保留平台的 registry、attributes、persistent RPC 與現場資料服務，另列自有安全、業務提交及結果對帳責任。
2. CM4 移除 tenant-wide gateway 權限；加入端到端簽章、單一 operational issuer、隔離 collector 與耐久 uncertainty。
3. 刪除「凍結舊版／FIWARE 升版即可兜底」與「B-ID 結構上消失」承諾，重算元件、妥協、工時及交付 gate。

# P4 獨立答辯

日期：2026-10-11。依 A.2；host inherited default，effort unavailable，未設定或驗證，未委派 agent。本文僅文件審查，未做 web research、產品 PoC 或部署測試。第三方證據沿用 2026-10-10 紀錄；master、搜尋摘要、當日 release 及法律推論不升格為交付版本或目前維護狀態的證明。

## 1. 答辯立場與證據

P4 此點成立：可購買的是有狀態的服務，不只是 MQTT transport。E-R 的 RPC 欄位與 E-Q 的 twin 是具體線索；但 enum 不能證明耐久交接，更不能證明 LED 已動作。保留平台的儲存、投遞排程、登錄鏡像、告警評估與本地儀表板，仍有工程收益；授權、隔離及所選配置須逐項驗證。撤回原提案「寫的不是安全邊界與狀態機」：我們仍負責授權、提交窗口、端點效果與恢復協定，這些 glue 本身就是重要狀態機。

對 interim 的修正不是替 P4 解套。M-05 禁止把義務綁給客戶，不是禁止付費。E-L 的免費額度與 branding 是有日期的證據，不能推出所有商約必然違規，也不能把「我們代持」當既有合法例外。真正可能修復的條件是書面 OEM／代管權利涵蓋三形狀、全部產品、實體與邏輯來源、站點及 server 數；客戶無須另簽廠商合約、註冊、維護授權金鑰或承擔資料庫操作禁令。我方負責費用及散布義務，並取得更新、終止後使用及資料退出條款。這些權利目前全部未查證，pending licensing 是 unresolved gate，並無已證實符合 M-05 的 P4 採購組合。

舊 Apache 線不能只因有 patch 紀錄就當十年方案，也不能因支援期限未知就稱為死線；須有可持續修補與相容承諾才重開評估。付商約而仍要求客戶承擔原限制，同樣不合格。Hono/Ditto、Kura/Kapua、OpenRemote、Magistrala 與雲端平台僅列 E-A 的候選線索；舊維護摘要不證明它們今日死亡或無法整合，改選任何一組都須重做同等驗收，不能用換名字關閉致命項。

| 證據鍵 | 實際來源與日期 | 採信邊界 |
|---|---|---|
| E-L | [T1](../../10-facts/buy-options.md#L24)、[T2](../../10-facts/buy-options.md#L25)、[T3](../../10-facts/buy-options.md#L26)、[T4](../../10-facts/buy-options.md#L27)、[T5](../../10-facts/buy-options.md#L28)、[T6](../../10-facts/buy-options.md#L29)，2026-10-10 | BSL、100 devices／1 server、舊 Apache 與 patch 的歷史紀錄；T3 為摘要，T5 含二手資料。Device 定義在 facts 仍未查證，原提案另讀 LICENSE 的主張未經本輪複核；Edge 新版授權、商約權利與支援期限未查證。 |
| E-R | [RpcStatus.java](https://raw.githubusercontent.com/thingsboard/thingsboard/master/common/data/src/main/java/org/thingsboard/server/common/data/rpc/RpcStatus.java)、[Rpc.java](https://raw.githubusercontent.com/thingsboard/thingsboard/master/common/data/src/main/java/org/thingsboard/server/common/data/rpc/Rpc.java)，原提案查證 2026-10-10 | 有服務端狀態／結果欄位的紀錄，不等於所選 release 的 commit、重掃或物理完成保證。 |
| E-C | [Gateway README](https://raw.githubusercontent.com/thingsboard/thingsboard-gateway/master/README.md)、[Gateway LICENSE](https://raw.githubusercontent.com/thingsboard/thingsboard-gateway/master/LICENSE)，原提案查證 2026-10-10 | connector 清單與 Apache 紀錄可作選型起點；隔離 runner、各協定角色及交付版行為未查證。 |
| E-N | [T7](../../10-facts/buy-options.md#L30)、[TLS T1](../../10-facts/transport-through-networks.md#L34)、[TLS T5](../../10-facts/transport-through-networks.md#L38)、[idle T7](../../10-facts/transport-through-networks.md#L45)、[T12](../../10-facts/transport-through-networks.md#L50)，2026-10-10 | gRPC 與廠商 interception 多為摘要；終結 TLS 的信任轉移有原文。keepalive 不是整條路徑的存活證據。 |
| E-Q | [MQ14](../../10-facts/mqtt-semantics.md#L53)、[e15](../../10-facts/precedents.md#L42)、[e17](../../10-facts/precedents.md#L44)，2026-10-10 | twin、UUID 結果快取、快照恢復的先例，不把別家保證移植到 ThingsBoard。 |
| E-M | [授權](../../10-facts/mqtt-brokers.md#L22)、[時鐘](../../10-facts/mqtt-brokers.md#L23)、[ACL](../../10-facts/mqtt-brokers.md#L28)、[MQ9](../../10-facts/mqtt-semantics.md#L36)，2026-10-10 | Mosquitto 候選及 retained 權限重檢；換 cert 不必然換身分，disable、ACL、清理與已顯示舊值分測。 |
| E-S | [BIRTH](../../10-facts/mqtt-semantics.md#L65)、[Rebirth](../../10-facts/mqtt-semantics.md#L66)、[seq](../../10-facts/mqtt-semantics.md#L68)、[工具缺口](../../10-facts/mqtt-semantics.md#L70)、[OPC UA](../../10-facts/zenoh.md#L82)，2026-10-10 | Sparkplug 有狀態契約；UA 段只有摘要。原生支援角色、Tahu/plugin 維護現況及互通性未查證。 |
| E-P | [TSL](../../10-facts/postgres-timeseries.md#L29)、[PG 政策](../../10-facts/postgres-timeseries.md#L39)、[partition](../../10-facts/postgres-timeseries.md#L40)、[roll-up](../../10-facts/postgres-timeseries.md#L41)、[共叢集分析](../../10-facts/postgres-timeseries.md#L111)，2026-10-10 | 避免 TSL；分 DB 不等於隔離 WAL／備份。TB 支援的 PG 版本、TTL 實作及容量仍未查證。 |
| E-A | [E1](../../10-facts/buy-options.md#L36)、[E6](../../10-facts/buy-options.md#L41)、[E9](../../10-facts/buy-options.md#L44)、[O2](../../10-facts/buy-options.md#L51)、[M1](../../10-facts/buy-options.md#L53)、[D1](../../10-facts/buy-options.md#L56)、[C6](../../10-facts/buy-options.md#L68)，2026-10-10 | 替代品不是已合規備案；2024 committer 摘要不是 2026 人力證明，商業支援／功能權利不能由 repo 授權推得。 |
| E-F | [NGSIv2](../../10-facts/buy-options.md#L79)、[命令模式](../../10-facts/buy-options.md#L81)、[Orion-LD](../../10-facts/buy-options.md#L82)，2026-10-10 | FIWARE 仍有資料互通價值；release notes 不足以證明 C-02～C-10 全消失或全不變。 |
| E-X | [ledger-review §3](../../40-mqtt-ledger/ledger-review.md#L88)、[P4 覆核](../../40-mqtt-ledger/ledger-review.md#L111)，2026-10-11；[../../50-synthesis/interim.md](../../50-synthesis/interim.md) | 獨立裁決與中期意見，不是新增第三方查證。保留 retained 收益，分開記錄連通、真偽與機密性。 |

## 2. 逐條裁決

嚴重度照錄來源，不因有修法而降級。「接受」表示缺口成立，不表示已修完；「部分接受」在該列指明保留與否定的部分。種類增量相對原 P4；「共用」表示同一 agent／契約只計一次。人週是設計估計，跨列工作重疊，總預算另列，不把四十九筆相加。

### 安全

來源：[security.md](security.md)。原批評的 raw 行為紀錄未釘交付 release，以下涉及該版本行為者均未查證；採用負向測試關閉缺口，不假定新版已修。

| Finding ID | 原嚴重度 | 裁決 | 理由與證據 | 修法與驗收 | 種類／人週／生命週期 |
|---|---|---|---|---|---|
| security-01 | 重大 | 接受 | (b)(c) A 冒充 B 的風險否定原 §3.2 的權限推論；F-18、N-05，gateway 路由行為未查證。 | CM4 改普通 device API；unit/function 各自憑證，south collector 也不得持 tenant-wide gateway token。驗 A 無法寫 B 或接走其 RPC。 | +1 自有 safety-agent，共用；2～3 人週；MQTT SDK 與隔離回歸逐版維護。 |
| security-02 | 重大 | 接受 | D-01 的遠端設定及預設 secret 缺乏 fail-closed 契約；N-03，不靠 remoteShell 預設值。 | 禁 remote configuration/shell；缺 secret 或範例值拒啟，阻止遠端改目的 host，測嘗試開 shell 被拒。 | +0 種，deploy 工件；0.5 人週；每映像重驗設定漂移。 |
| security-03 | 致命 | 接受 | (c) inspection 下 routing secret 與 payload 可被讀；簽章只補真偽，E-N、E-X、N-02。 | TLS 必開且不得自動降級；雙向簽章；無 bypass 時須經審查的端到端機密通道及相容實測。未有可用退路，仍是 unresolved gate。 | +1 簽章契約，共用；2～3 人週；若另建加密 HTTPS relay 再 +1 協定／4～8 人週，未授權採用；持續 crypto 審查。 |
| security-04 | 重大 | 接受 | 原 §3.3 混淆 bootstrap 與 operational issuer；F-19/F-35，chain 覆寫行為及 Edge 支援未查證。 | 不依賴 chain 自動綁定；QR/CSR 綁 factory 身分，營運 profile 禁 provisioning，單一 CA 簽短效 cert；撤銷及輪替後舊 cert 必須拒絕。 | +1 issuer worker，共用；1～2 人週；CA 輪替、RMA、撤銷 ledger 與金鑰託管。 |
| security-05 | 重大 | 接受 | 平台可寫 attributes 不等於 ERP 是唯一命令 writer；F-48/N-05，細粒度 RBAC 未查證。 | agent 僅接受 ERP 授權簽章；service user 固定 tenant，禁 impersonation；HMI 僅讀。測 UI/rule chain 寫入不能致動。 | +0 種，共用簽章；0.5～1 人週；雙套權限及 audit 回歸。 |
| security-06 | 重大 | 接受 | staging 複製 ERP 連線就可能操作 prod；N-04/F-70，runbook 不足。 | host 環境與 resolver 不在備份內；未確認環境前停 dispatcher、無 prod egress，連線自動 archive；測還原後零 prod 寫入。 | +0 種，resolver/啟動 gate；0.5～1 人週；每次還原演練。 |
| security-07 | 重大 | 部分接受 | 接受 payload 名稱、建裝置及幽靈值問題；不接受 client filter／事後 rule chain 足以封住路由。E-M、F-31。 | 可信帳號／隔離埠映射固定代表；取消 gateway 權限。revoke 同步 ACL、session、retained 清理；無來源時間則標未知，不能蓋新鮮時間。 | +0 種，共用 collector；1～2 人週；每型號 converter、撤銷與 retained 回歸。 |
| security-08 | 重大 | 部分接受 | 接受凍結無支援與相依供應鏈風險；查不到 advisory 不證明沒有流程，付費也未必解 M-05。E-L。 | 移除凍結兜底；取得支援／揭露條款與交付 SBOM，最小化 CM4 相依。無證據不稱由廠商承擔安全審查。 | +0 種，SBOM/支援 gate；1～2 人週；季查及逐版授權、漏洞追蹤。 |
| security-09 | 次要 | 接受 | 原 §3.1 的 8883 圖不等於部署硬化；N-01/B-10，具體預設仍未查證。 | 固定版分清明文與 TLS listener 設定，不盲用總開關；關匿名、非必要 transport，HTTP 僅管理介面；三形狀掃描驗收。 | +0 種；0.5 人週；設定鍵及映像升版回歸。 |
| security-10 | 次要 | 接受 | D-01 public URL 不等於 F-59/F-72 的讀取 scope；不能開整個 Edge HTTP 給 device VLAN。 | CMS/live JSON 維持 per-record 授權，經限定 content relay；D-06 另用唯讀 auth proxy。驗其他 entity/API 不可讀。 | +1 content relay 模組，共用 agent；0.5～1 人週；token 輪替及 route allowlist。 |
| security-11 | 次要 | 接受 | 原 §4.1 未處理任意 URL fetch；B-10/F-56，即使來源合法也需內容綁定。 | signed manifest 綁 hash/version；base 由部署固定，拒外站、任意 redirect／本機管理位址；驗版本錯置及 SSRF。 | +0 種，共用 relay；0.5 人週；下載 client 與內容格式回歸。 |

### 十年維運

來源：[longevity.md](longevity.md)。保留其時間軸警告，不把未來授權、死亡或強制升版推論當事實。

| Finding ID | 原嚴重度 | 裁決 | 理由與證據 | 修法與驗收 | 種類／人週／生命週期 |
|---|---|---|---|---|---|
| longevity-01 | 致命 | 部分接受 | 接受 (a)(b) 現無合規且有支援的採購路徑；不同意「任何商約都違反 M-05」。第二站限制只按 E-L 舊摘要待核。 | 書面 OEM/代管授權須滿足 §1 全部條件；免費 grant、縮成 (c)、凍結均不算修復。pending licensing 仍是 unresolved gate。 | +0 runtime、+1 合約種類；0.5～1 人週內部工作；費用／日曆未知，續約與新版逐次重審。 |
| longevity-02 | 重大 | 部分接受 | 接受漏 Gateway、方言與時鐘；原批評標題 19～20、內文 18 的口徑不同，不能照抄單一總數。M-02、E-X。 | §3.5 按維度列 BOM 下限，process 與種類分開；固定配置後重數 SDK、OS、browser。 | +0 種，盤點；0.5 人週；每次依賴變更維護 BOM。 |
| longevity-03 | 重大 | 部分接受 | 接受三線相容未知；不同意必須全客戶同日升版或被迫只用一台 server。E-L 是 dated grant，非所有商約。 | 釘 server/Edge/SDK/DB 矩陣；canary、滾動站點維護窗、混版及 rollback gate，無相容證據就不升。 | +0 種，測試矩陣；1～2 人週；每 release 及每站維護窗。 |
| longevity-04 | 重大 | 部分接受 | 接受 N-09 空白；拒絕把 Edge 全當 cache、RPC 遺失直接 timeout 後不再對帳。F-46/E-Q。 | registry 鏡像可重建，未上傳事件及 unit CQ 不可丟；五類 state 加密鑰分流備份，還原先對帳再開命令。 | +0 引擎、+1 恢復契約；2～3 人週；半年還原及 RPO/RTO 演練。 |
| longevity-05 | 重大 | 接受 | 原 §9 只算 north code，漏 fleet、雙軌及消費者遷移；SQL 可搬不代表控制面可替換。M-01。 | 穩定 identity/schema/export；一年一次抽樣退出，遷移先影子讀、不可雙 writer 發命令；逐站驗資料及離線 unit。 | +0 必選引擎；退出估 16～24 人週另加站點工；每年 1～2 人週抽驗，共用 ops 預算。 |
| longevity-06 | 重大 | 部分接受 | 接受單一供應商集中風險；不能由一次授權紀錄推定未來必變，Change Date 也不是維護承諾。E-L/E-A。 | 合約約束可交付版本及退出權；要求 patch/披露 SLA，保留替代路徑。不得把 master 的 Java 需求說成所有 release 每年強制升級。 | +0 種；0.5～1 人週採購評估；每季供應商審視，殘餘風險不可消除。 |
| longevity-07 | 重大 | 接受 | (b)(c) 每 VLAN 的 Edge+PG 乘數真實存在於原 §3.2 設計；不因同一引擎就免維運。 | 不撤掉 M-04；各 VLAN 限額、備份及 patch 窗口，無上游副本資料保留；量冷啟與斷 WAN 成本。 | +0 種但每 VLAN +Edge/PG/relay 實例；0.5～1 人週模板；另每 VLAN 每年 0.1～0.3 人週。 |
| longevity-08 | 次要 | 部分接受 | 接受 M-01 年度價值盤點；不接受必然只剩 queue。D-02 告警評估、D-06 本地 HMI 不因 ERP 是 UI 就失去價值。 | 限定平台用途，保留有用 alarm/dashboard；新增 domain 規則先核退出成本，不把樣本移到 ERP。 | +0 種；0.25～0.5 人週；每年一次功能使用及退出成本檢查。 |
| longevity-09 | 次要 | 接受 | 共 DB 引擎不隔離資源；TB 的 TTL／相容性未查證，E-P。 | TB 用獨立 PG 實例，無 ERP DDL 權限；驗 TTL、遲到資料、WAL 及還原時間，不直接修改未知內部 schema。 | +0 引擎、+1 PG 實例；0.5～1 人週；PG major 與 TB 升級矩陣。 |
| longevity-10 | 次要 | 部分接受 | 接受 FIWARE 不是三形狀合格備案；不同意其資料面只剩現狀價值或所有 C-ID 必然原封不動，E-F。 | 撤掉自動 fallback；必要時保留限定資料 facade。替換平台另立採購與語意 gate，不偷偷接受重現的命令缺陷。 | +0 必選種類；0.25 人週修訂，facade 另估；既有 FIWARE 的法律／支援義務仍待核。 |

### 正確性

來源：[correctness.md](correctness.md)。各列修法共同構成 §3.2／§3.3 的端到端契約，不能只挑容易的欄位。

| Finding ID | 原嚴重度 | 裁決 | 理由與證據 | 修法與驗收 | 種類／人週／生命週期 |
|---|---|---|---|---|---|
| correctness-01 | 重大 | 接受 | 三形狀 D-04 的 RPC id 在回覆遺失窗口不穩定；F-41/F-46/C-20。 | ERP 同交易 outbox 先存 job_key，commit 後提交；RPC id 僅映射。驗已收件未記 id 時重試不重做。 | +0 引擎、+1 提交契約；1～2 人週；ERP 升版及重試窗口回歸。 |
| correctness-02 | 重大 | 接受 | 原 in-memory 配置未證明耐久交接，不等於已證實所有 RPC 必丟；E-R/F-46。 | 以原配置殺 server/Edge，查 commit、重掃；ERP outbox 保留到 owner 結果。若缺 durable rescan，補適配或判配置不合格，不偷換 queue 後稱已過。 | +0 預設引擎；1～2 人週；每固定版本 crash suite，替代 queue 另算種類。 |
| correctness-03 | 重大 | 接受 | SQLite 與 LED 物理效果不能原子 commit；F-47/B-08。 | backend 接 key／穩定項目 id；不可冪等的 running 復原為 durable unknown，禁止自動重跑；人員核實後才解隔離。 | +0 種，共用 worker 契約；1～2 人週；每 backend 保留 crash-gap 測試及人工處置成本。 |
| correctness-04 | 重大 | 接受 | 收件、平台終態、物理完成三者不同；F-50/F-52/F-53，FAILED 映射未查證。 | 耐久入列後即返回 delivery；worker 另跑，完成需 key/version/backend outcome，拒絕與 defer 分列，晚到結果可對帳。 | +0 種；1～2 人週；全部 LED 結果及長工作回歸。 |
| correctness-05 | 重大 | 接受 | timeout 不證明 A 停止，重啟發 B 與 profile 更新仍可亂序；F-51/F-64。 | ERP 耐久 unit 執行槽與 seq；job 綁 profile_version，agent fencing；unknown 不釋槽，核實靜止後才允許下一筆。 | +0 種；1 人週；manual reconciliation 與序號遷移維護。 |
| correctness-06 | 重大 | 接受 | D-01 actual=desired 仍可能比錯文件；F-60/B-03/B-04/E-Q。 | Apply 僅 state intent；manifest 原子綁 version/hash，拒絕倒退與錯版，成功回報實際套用 hash。 | +0 種，共用 manifest；1 人週；快照／通知競態與 CMS route 回歸。 |
| correctness-07 | 重大 | 接受 | 七日 SQLite 沒有讀回協定，cursor 先存仍會漏；F-46/F-49/F-67/E-Q。 | unit 持 CQ page，ERP inbox/cursor 同交易並回簽確認；批次重讀、不設 per-command poll，超窗保留缺口紀錄。 | +1 CQ 契約，共用 agent；1～2 人週；backlog、缺頁及 ACK 恢復監控。 |
| correctness-08 | 重大 | 接受 | (b)(c) 冷開只有版本無文件不能維持顯示；N-11。 | 耐久保存最後可用 manifest/assets/id map/actual；新文件缺件 defer，snapshot/cursor gap 重讀，不清空舊畫面。 | +0 引擎、+1 快取格式；1～2 人週；配額、格式遷移與離線冷開測試。 |
| correctness-09 | 重大 | 接受 | 補傳不能把死掉的 sensor 顯成 active；F-02/F-04/F-27/N-14。 | 分 source_time、ingest_time、clock quality；新 heartbeat 才更新 presence，boot/seq 防舊值，錯時與 warm-up 可見。 | +0 種；0.5～1 人週；時間源故障與補傳回歸。 |
| correctness-10 | 重大 | 接受 | schemaless 不等於型別正確或無損演進，capability 空值不能放行；F-06/F-31/F-32/B-09。 | schema_version 先核准並確認到各層才放資料；過渡雙版、有界重送；未知鍵拒絕計數，過期 capability 拒新命令。 | +1 功能契約，共用；1～2 人週；產生器、相容矩陣及負向 fixtures。 |

### 情境擬合

來源：[scenarios.md](scenarios.md)。其十八列走查保留為交付驗收清單，不視為本輪已執行。

| Finding ID | 原嚴重度 | 裁決 | 理由與證據 | 修法與驗收 | 種類／人週／生命週期 |
|---|---|---|---|---|---|
| scenarios-01 | 重大 | 接受 | 同 CM4 的 gateway/function API 對映未閉合；F-20/F-39。 | stable unit id + function id 映成各 TB entity；路徑只作可變 metadata；雙功能收發及移站不混結果。 | +0 種，共用 agent/manifest；1 人週；entity 映射與 SDK 升版回歸。 |
| scenarios-02 | 重大 | 接受 | (b)(c) Edge 出網不替 player 下載；N-12/F-56/F-63/C-24。 | root/API/content base 分開；south 代理指定版本文件、assets 與 token JSON，列每個 client 的 DNS/proxy 路徑。 | +0 種，共用 relay；1～2 人週；token、快取容量及 client 升級。 |
| scenarios-03 | 重大 | 接受 | 正常冷開也會遇 NTP 回零，不只 retained 攻擊；F-02/N-14。 | 指定核准時間源；不可信時間資料隔離、不用 receive time 冒充；恢復後保留缺值與原始時間。 | +0 種；0.5～1 人週；各站時間源健康檢查。 |
| scenarios-04 | 重大 | 接受 | (b) 缺 south 主動 502 白名單與 RTU owner；D-03/F-22。 | 具名 poller、serial 穩定裝置路徑與權限，單一讀者；fixture 驗 signed 壓差、尺度與統計到歷史。 | +0 種，隔離 collector 共用；1 人週／首 profile；Modbus library、儀表映射維護。 |
| scenarios-05 | 重大 | 接受 | 選用 Grafana 時 SELECT 不會自動完成曲線與型別對映；F-10/F-13/F-14/E-P。 | north scoped SQL view、dashboard-as-code；同筆原始／浮點／負值及缺值核對，不公開 PG 給現場。 | 條件 +1 Grafana 引擎／時鐘；1～2 人週；view 隨 TB schema 回歸，非基本部署。 |
| scenarios-06 | 重大 | 接受 | 多 strip show 不能由單一 RPC 宣稱全成功；D-04/F-44/F-49。 | ERP 保存參與者 manifest，逐 strip capability/version/result；缺席顯部分完成，本地 timeline 不保證跨網同步。 | +0 種；1～2 人週；show 聚合與缺席測試。 |
| scenarios-07 | 重大 | 接受 | D-05 有憑證不等於已有 reader adapter；F-26/F-27/F-34。 | 定 reader 管理 adapter；只身分、存活、非控制設定，actual 回報 reader 本身。既有門禁平台只做 ERP connector。 | +1 reader backend 契約；1～2 人週探索；vendor API 未查證，硬體安全及控制面另案。 |
| scenarios-08 | 重大 | 接受 | D-06 開著的頁面存活不證明離線新登入／reload；N-11/N-15。 | 預佈建 local auth/dashboard/assets；新 browser 斷 WAN 測試，逐點 stale，事前約定端到端延遲門檻。 | +0 種，HMI 配置；1 人週；browser、登入與 WSS 相容測試。 |
| scenarios-09 | 重大 | 接受 | 一片螢幕的 ready/stop owner 未定，重換平台不自修 B-13；N-07/N-13。 | §3.5 完整服務清單；單一 service manager，PG 遲到可重試、刻意 stop 不復活；player readiness 獨立測。 | +0 種，deploy 共用；0.5～1 人週；OS、container 及開停機回歸。 |
| scenarios-10 | 重大 | 接受 | 只測 gRPC 不能交付 (c) 全六類流程；E-N/N-18。 | 十八組逐項驗 direct/proxy/inspection、文件、斷線冷開；無合法已驗退路的網路列阻塞，不以 keepalive 代替。 | +0 種，環境矩陣；2～3 人週；每支援形狀升版 gate，客戶 proxy 資源待提供。 |

### 生態

來源：[ecosystem.md](ecosystem.md)。接受的是具體整合缺口，不是推論所有列名產品都沒有能力。

| Finding ID | 原嚴重度 | 裁決 | 理由與證據 | 修法與驗收 | 種類／人週／生命週期 |
|---|---|---|---|---|---|
| ecosystem-01 | 重大 | 接受 | 封閉 T1 不必能改 topic，能 CONNECT 不等於 schema/tenant 正確；E-M/F-22/F-31。 | 按型號驗協定與 payload；保留 vendor topic，以可信帳號／隔離 listener 對映，再產生 normalized 代表；south 登錄一次。 | +0 種，條件 broker；每型號 0.5～1 人週；parser fixtures、韌體與 ACL 維護。 |
| ecosystem-02 | 重大 | 接受 | D-06 的 gateway online 不能代表 PLC 每點 fresh；F-04/N-21。 | 點位 time/quality/age，停更、補傳與斷雲重登測試；現場採樣可較快，上行才限 1 Hz，控制留 local。 | +0 種，共用 HMI；0.5～1 人週；每點品質與延遲回歸。 |
| ecosystem-03 | 重大 | 接受 | 「不改裝置」可成立，「不改 Edge／零配置」不成立；唯讀也可越 tenant；F-40/N-03。 | consumer 的 site/function/field allowlist 共用於 API/views/export，獨立可撤銷身分，測跨域讀取與重連。 | +1 export 契約，共用；1～2 人週；每 consumer 配置及撤銷維護。 |
| ecosystem-04 | 重大 | 接受 | 一般 JSON 加 broker 不是 Sparkplug B；E-S，原生 endpoint 支援未查證。 | 需求觸發才選經查證 endpoint/library；驗 BIRTH/alias/seq/late join/Rebirth；僅診斷 Rebirth 白名單，不開製程 NCMD/DCMD。 | 條件 +1 library／方言／時鐘；1～2 人週；相容與依賴維護，費用未知。 |
| ecosystem-05 | 重大 | 接受 | OPC UA 名稱不決定 client/server、PubSub 方向、編碼與 quality；E-S/F-34。 | 先取 PLC 接口契約與憑證要求，只旁路讀；fixture 驗 timestamp/quality，不建立未被需要的 UA server。 | +0 必選種類；每 profile 0.5～1 人週；vendor API 及協定相容回歸。 |
| ecosystem-06 | 次要 | 接受 | FIWARE 命令缺陷不抹掉 NGSI 資料契約價值；E-F/F-39，目前無具名需求。 | 真有 consumer 才定 v2 或 LD 唯讀 facade；entity/type 對映與 subscription 測試，命令不回流。 | 條件 +1 facade 契約；1～2 人週；標準版本及 consumer 回歸。 |
| ecosystem-07 | 重大 | 接受 | 新功能仍跨 connector/filter/ERP；原 §9 低估 glue，F-39/F-46。 | 單一版本化功能 manifest 生成對映與 filter；新增 backend+管理模組後跑能力／結果 conformance，不手改多處清單。 | +0 種，共用功能契約；1～2 人週；generator、平台 API 與相容矩陣。 |
| ecosystem-08 | 重大 | 接受 | 廠牌、repo 可讀與認證適用性不同；E-L/M-05/N-18。 | 交付 BOM、授權與支援書面證據；認證列範圍／日期／版本，未取得標未查證，客戶 IT acceptance 獨立驗。 | +0 runtime、共用合約；0.5～1 人週；法務、認證費及日曆未知，逐客戶重核。 |

## 3. 相對原提案的修訂

### 3.1 原 §3：權限與部署邊界

相對 [原 §3.2](../../20-proposals/P4-buy.md#L90)，採同一份 safety-agent 在 unit 做驗章、CQ 與 worker，在 south 做受限 relay；function backend 仍分 process。T1 collector 不拿平台管理憑證，既有 connector 必須放低權限 runner，經有界 IPC 交給 per-function device client；這個適配尚未實作，不能宣稱原 Gateway 開一個設定就能達成。買到的 decoder 仍可省工，但隔離 harness 與映射由我們維護。

相對 [原 §3.3／§3.4](../../20-proposals/P4-buy.md#L102)，factory 身分只准 bootstrap announce，不能拿 desired。issuer 位於管理側，驗 CSR、序號及採納授權後簽 operational cert；平台只存對應關係。營運 profile 禁自動重綁，七日 cert 半期續期；撤銷 ledger 帶 generation，連線中止與拒收都須測。離線撤銷無法即時到達，三十分鐘授權 lease 失鮮後停止接受新變更，已驗證的顯示繼續；拒絕、registry 遺失與未知分列，絕不觸發 lock/wipe。

上下行 envelope 綁 env、site、unit、function、generation、seq、hash 與有效期，由具名 owner 簽章。私鑰走 resolver，與業務備份分離；環境標籤取自 host，不能信任還原 DB 自報 prod。外部審查仍由我方安排。依 E-X，(c) 無 bypass 的機密性與 gRPC 可達性仍未解；不把應用簽章公鑰 pinning 混稱 TLS pinning，也不提出未經驗證的自動 fallback。

### 3.2 原 §4：擁有者與物理結果

相對 [原 §4.1／§4.2](../../20-proposals/P4-buy.md#L123)，ERP 同交易保存業務意圖、outbox、stable job_key、參數 hash 與 unit 執行槽，commit 後才提交平台；平台 id 是可多對一的 delivery attempt。重試沿用同 key，同 key 異參數拒絕。Manage 先記 pending 意圖，平台鏡像確認後才公開 bound 紀錄；恢復由 ERP binding 與 issuer ledger 對帳，不能靠刪除裝置「清乾淨」。F-70 archive 關閉每次提交與重試的 write gate。

unit 先 fsync accepted/running，再呼叫 backend；有 idempotency 的 backend 接相同 key，沒有者不得假裝 exactly-once。物理效果之後、結果落盤之前斷電，重開必須保留 durable unknown；查 backend 的 keyed result 或人工核實，不能自動再執行。timeout 是時限判定，不是未做；generation fencing 只能阻止舊工作開始，不能停止已開始的動作，須確認靜止才解除 single-flight。人工結案保留證據與操作者，不冒充裝置成功回報。

Apply 僅使用版本化 state intent，不再同時發 RPC。unit 保存真正套用的 manifest/hash/id map，ERP 比對自己的最新 desired；show 另按參與 strip 聚合，保留部分完成。CQ 由 unit 持有，依序發布有界、簽章的 client-attribute page；ERP 共用 Fleet 輪詢，inbox 與 cursor 同交易後回簽確認，unit 才推進下一頁。平台 RPC response 是有用副本，不是唯一 owner；CQ 不進 telemetry 表，亦不為每命令新增 poll loop。實際頁面大小及 Edge 同步行為仍須驗證。

### 3.3 原 §4.3／§5：保存與恢復

相對 [原 retention 表](../../20-proposals/P4-buy.md#L143)，以下為待驗設計值，不是產品預設保證。服務範圍先訂 ERP／站點失聯七日、補傳對帳二日、舊備份回溯七日；超窗不保證歷史完整，但缺口必須可見，不將缺結果變成成功或安全重跑。來源副本未確認前仍保留，容量不足先拒收新 job；量測允許有界丟棄時，記範圍、原因及計數，不造新鮮值。

| 事實／窗口 | 耐久 owner 與 proposed retention | 恢復與滿額處理 |
|---|---|---|
| desired、binding、schema | ERP/issuer；當前版與撤銷 generation 無 TTL；unit 最後可用文件到替代版完整套用 | 不因 event TTL 清掉；備份回溯後先對 generation，舊 intent 不可重演。 |
| ERP outbox／業務結果 | 未結案無 TTL；結案後至少 90 日，F-67 的兩日 inbound 不取代此帳本 | unknown 保留並阻擋相依命令；缺映射重建，不產生新業務 key。 |
| RPC delivery | LED effect 初始期限 10 分鐘；Apply 已改 state intent | 平台 expiration 只停止投遞資格；清理不刪 unit CQ／ERP 記錄。 |
| unit CQ | 至少 30 日且 ERP 耐久確認後才可清理；未確認不按日齡刪除 | 32 MiB 初始配額，80% 告警、滿額拒新 job；結果頁可反覆重讀。 |
| dedupe／tombstone | 至少 90 日且超過全部 retry／restore 窗口；最高 generation/seq 終身保存 | 舊備份恢復先隔離；結果過窗仍拒絕把舊 seq 當新工作。 |
| Edge 雙向事件、collector 緩衝 | 已接收且未有上游副本的事件至少支援七日；job 結果沿用 CQ 的不丟策略 | 容量按峰值持久化 bytes/s × 604800 × 1.3 配置，尚未量測；監控 oldest age、bytes、drop、replay lag。 |
| CQ／snapshot cursor | ERP cursor 耐久；頁重讀至少 30 日，缺頁回完整索引 | 不靠 WebSocket queue 完整性；TB API/同步能力不符即 gate 失敗。 |
| telemetry／roll-up | north store 三年，source time 截止；遲到資料與統計 bucket 分開處理 | 逐筆來源鍵去重，量測與 command blob 分表；TTL 實作及高端容量待驗。 |
| presence／時間 | heartbeat 120 秒、判離線 300 秒；不是 retention | 分 source/ingest time、boot/seq、clock quality；warm-up/fault/錯時不能呈正常。 |
| WebSocket／HMI | 僅通知與畫面快取，非 owner；逐點 freshness 門檻由點表決定 | 重連取快照；斷雲新登入、reload 與點位停更必測。 |

恢復涵蓋 Odoo PG、TB PG、Edge PG、collector SQLite、unit CQ/媒體及獨立 issuer ledger。SQLite 用一致性備份，不複製活躍檔；私鑰另外託管。只有已具上游副本的鏡像可重建，Edge 離線事件不可一律清空。命令恢復前比對 owner、cursor、generation 與 pending key；資料已不可恢復時留下 durable uncertainty 與缺口報告。schema 先核准再放資料，過渡期兩版並存；空或過期 capabilities 一律拒新命令，不能沿用 B-09 的放行方式。

### 3.4 原 §5／§6：情境與生態

相對 [原 §6](../../20-proposals/P4-buy.md#L195)，D-01 文件、assets 與 MES token JSON 經受限 relay；D-02 保留 sensor process 的聚合與 warm-up；D-03 明訂唯一 poller、signed 壓差與 serial 權限；D-04 保存逐 strip 結果。D-05 adapter 只管理身分、存活與非控制設定，卡權限、排程與門鎖控制另平面；D-06 只旁路遙測，現場 HMI 不受上傳頻率限制。讀頭 API 尚未取得，不能把初步估工說成完成整合。

第 N 個 consumer 不必修改裝置，此點成立；它仍需資料 scope、撤銷與 export 配置。依 E-X，retained 最新值是收益，不充當 owner 也有價值。固定 topic 的 T1 保留原協定，由可信來源映射，不要求韌體配合改名；broker raw 與 HMI normalized 投影隔離並限資源。Sparkplug／OPC UA／NGSI 只依真實接口觸發，不把 broker、connector 名稱或廠牌當互通及認證證明。

| 形狀 | 修訂後路徑與驗收邊界 |
|---|---|
| (a) | unit→server 8883；內容→本機受限 HTTPS 443；ERP/issuer→TB 私有 API，PG 5432 只私網。不放 Edge；D-06 用站內 server HMI，非雲服務。 |
| (b) | 每 device VLAN 的 agent/collector→Edge 8883；Edge→north gRPC/TLS 7070；south→白名單儀表 502，RTU 只 serial；unit→relay 443，relay→CMS 443；HMI→獨立唯讀 HTTPS/WSS 介面。 |
| (c) | Edge 經核准 proxy→cloud FQDN:443；content relay 有獨立受控出口，雲端不開站點 inbound。inspection gate 未解時整體不能交付；不能只測 Edge 能連就放行。 |
| 共通 | DNS TCP/UDP 53、NTP UDP 123 僅核准服務；T1 無一般 Internet/admin 路徑，bridge 不轉送 IP。同 VLAN lateral traffic 必須靠可驗證的 port/client isolation 或重分網段，沒有設備能力就阻塞交付。 |

### 3.5 重列原 §2 元件表

相對 [原元件表](../../20-proposals/P4-buy.md#L24)，下表是修訂設計，不是安裝完成清單。平台版本須先釘定；不得用 master 的 JDK 需求或舊 release 表推定當前支援。種類按維度計算，不把同一 JVM 的多個實例隱藏，也不把跨欄重複算成不同產品。

| 元件 | 角色／變更 | 授權與時鐘證據／責任 |
|---|---|---|
| ThingsBoard server | 保留 north registry 鏡像、attributes、persistent RPC、alarm、dashboard；in-memory queue 先按原配置驗收 | E-L/E-R；指定交付版本、功能權利、支援與耐久行為均待 gate。 |
| ThingsBoard Edge + 本地 PG | (b)(c) 每 VLAN；本地 HMI、事件與量測持久化，不全當 cache | E-L/E-N；獨立版本線、DB 維護及容量乘數。 |
| IoT Gateway connector runner | 僅需要的 south collector；隔離程序、無 tenant-wide gateway 權限；CM4 不再跑整包 Gateway | E-C；IPC/export 適配自建且未驗證，SDK／fork client／各 connector 相依分列時鐘。 |
| safety-agent + function backends | Python；per-function device clients、簽章、manifest、worker、CQ、content relay；display/LED/sensor 分 process，reader adapter 待作 | 自有契約與程式；MQTT、HTTP、crypto、SQLite、Modbus 相依逐版追蹤，不自製 parser/crypto。 |
| issuer worker | 管理側唯一 operational CA／簽章職責，factory 只 bootstrap；密鑰與 DB 備份分流 | 自有流程；選定 crypto 套件、根輪替、託管及外部審查由我方負責，尚未選定者未查證。 |
| Odoo + iot_tb + hub | desired、pending binding、outbox、single-flight、inbox/cursor 與業務 UI；不收每樣本 ERP rows | 延續業務底座；Odoo API 相容及權限是自有 glue 責任，官方 connector 現況未查證。 |
| PostgreSQL + SQLite | TB 與 ERP 分實例；Edge 自有 PG；unit CQ 用 WAL 與 FULL durability，另持媒體 | E-P；同引擎不重算種類，備份與資源逐實例計；交付版相容／斷電 durability 待驗。 |
| Anthias、browser、nginx、OS/container、DNS/NTP | player/reconcile 保留，受限 HTTP 路由與時間源不可省略 | 原 §2 漏項；player 支援期限、套件 BOM 及所選版本授權未查證，不能稱沒有外部時鐘。 |
| tb-config、deploy、e2e 工件 | manifest 生成 profile/filter 對映；dashboard-as-code；三形狀硬化、恢復及混版測試 | 自有五 repo 編排沿用：ERP、edge、tb-config、deploy、e2e；issuer/契約併 edge 工件，不另起服務平台。 |
| Mosquitto raw／normalized | 條件加入：T1 MQTT 或具名 HMI 需求；兩實例仍一種 broker，權限及資源分離 | E-M；+1 引擎、+1 broker 時鐘，client 若可共用不重計；實際 library 以 BOM 為準。 |
| Grafana／Sparkplug／NGSI facade | 按 consumer 需求加入，不進最小部署；PG view、標準 endpoint 各驗收 | E-S/E-F；各自種類、套件授權與維護時鐘另列，未選定不冒稱成本為零。 |

| M-02 盤點維度 | (b)(c) 含 T1 collector、不含選用 export 的下限 |
|---|---|
| 外部引擎／程式族：9 | TB server、Edge、Gateway、PG、SQLite、Odoo、nginx、Anthias、browser。自有服務另列工件與 process，不藏進外部引擎。 |
| 語言／方言：6 | Python、Java（除錯）、TBEL、SQL、JavaScript、平台 JSON 設定方言。 |
| runtime：4 | Python、JVM、browser JS、PG 執行環境；不宣稱此欄與引擎互斥。 |
| 自有 repo：5 | ERP、edge、tb-config、deploy、e2e；契約及 issuer 不新增 repo。 |
| 外部時鐘：至少 18 | 上述九個程式族，加 OS、JDK、Python、container、MQTT SDK、底層 MQTT client、HTTP stack、crypto、Modbus library；其他 driver 由 SBOM 補列。 |
| 合計口徑 | 按五維各計為至少 42 個盤點欄項，不是 42 個互異產品，亦不可與 P0 原 13 直接排名。(a) 無 Edge／collector 時須扣除未部署項；服務實例另計。 |

一片螢幕的中央側改為 Odoo、TB server、兩個 PG、nginx、issuer worker 至少六個服務單元；另有 CM4 agent、backend、player 與現有 DNS/NTP。隔離 PG 與 issuer 是本次新增成本，不再重複原「三個服務」說法。TB 狀態庫不可省，但可不寫歷史量測；F-15 字面仍是妥協，足跡與正常停止行為未量測。

### 3.6 重列原 §7 妥協表

相對 [原妥協表](../../20-proposals/P4-buy.md#L209)，可接受的代價與尚未獲准的 gate 分開；不能用「需求可妥協」改掉三種部署錨點。

| 需求 ID | 修訂後妥協／gate | 換到什麼 | 代價與界線 |
|---|---|---|---|
| M-05 | 不預先放寬；商約 pending licensing | 可能取得完整平台權利 | 無書面 downstream 條款即不採，費用未知；凍結不作兜底。 |
| M-02/M-06 | 接受更多引擎、方言、時鐘 | 現成 server/Edge 功能 | 五維 BOM、供應商及相依維護，不以同廠商等同單一時鐘。 |
| F-16/F-17/F-20 | 管理樹在 ERP；平台 entity/Edge 指派作投影，堆疊 relay 不假定 Edge 原生可套娃 | 可用平台平面 registry | 路徑變更映射及堆疊管理 conformance 自建，未驗不能聲稱完整樹。 |
| F-33/F-41/N-05 | pending 意圖先耐久，平台確認後才公開 bound；ERP 保留命令 owner，平台負責 delivery | 單一業務權威與買來的 delivery state | 補償／reconcile 而非跨系統原子交易，平台不是任意第二 writer。 |
| N-13/F-15 | 承認常駐 TB 狀態庫與六個中央單元，最小部署不寫歷史樣本 | 一片螢幕亦能用平台狀態服務 | 記憶體、磁碟與維運 gate；未量測前不宣稱「小」。 |
| N-02/F-48 | 站內雙向認證加 owner 簽章；(c) inspection 尚未解除 | 安全的已核准路徑 | 不用 bearer 穿越換保密；無合法加密退路則不交付該錨點。 |
| F-19/F-35/N-04 | 撤回長效 bootstrap 當營運身分及手動 staging 中和 | 唯一 issuer、環境分離 | 自有 PKI、撤銷 lease、還原 gate；離線即時撤銷不可保證。 |
| F-07/F-31/F-32 | 不接受 privileged connector thread 當隔離；先宣告再放行 | 重用 connector decoder | runner/IPC、schema 對映、限額與兩版過渡皆自建。 |
| F-27/N-14 | 不以平台 active 當業務 presence | 可用平台連線觀測作輔助 | source time/quality 另判，錯時顯未知，不能造 freshness。 |
| F-46/F-47/F-50/F-51 | 七日離線範圍及 durable unknown 明示；不承諾任意物理 exactly-once | 平台排程加可重讀 owner | 不可冪等效果可能停在人工對帳，timeout 不授權重做。 |
| F-59/F-72/C-24 | 文件走限定 relay，而非公開 dashboard／一般 ERP 路由 | outbound-only 可控文件出口 | per-record token、hash、快取與 live JSON 路徑維護。 |
| F-34/D-05/D-06 | 控制通道仍不建；有第三方管理面只接 connector | 保持 ERP 業務整合與既有 HMI | reader API、非控制欄位與標準 export 需另外驗收。 |

### 3.7 原 §9：成本與 lifecycle

相對 [原成本估計](../../20-proposals/P4-buy.md#L244)，以下取代原 14.5 人週，不再加上逐 finding 工時。平台能力節省的是其內部實作，不是我方安全審查與制度性知識；不得拿未經同範圍驗收的 P0 估工宣稱省一半。授權談判、客戶網路等待與控制產品開發均不在交付承諾內。

| 工作包 | 首次人週估計 | 包含／排除 |
|---|---|---|
| 採購證據與 BOM | 1～2 | 授權／維護查核、書面 gate；不含外部費用及等待。 |
| 安全 agent、issuer、隔離及硬化 | 6～9 | unit/function 身分、簽章、撤銷、staging；含一般文件安全，不含 inspection 專用加密通道。 |
| 提交、worker、CQ 與 schema 契約 | 6～9 | stable key、durable uncertainty、批次 replay、ERP 對帳與功能生成。 |
| D-01～D-06 管理／資料整合 | 4～7 | 第一批已取得接口的 connector、relay、show、本地 HMI；reader 僅探索及 stub，不含控制／硬體安全完成。 |
| 部署、還原及混版驗收 | 4～6 | 三形狀與失效矩陣的建立及測試工，不能保證測完一定通過。 |
| 合計 | 21～33 | 共用工作只計一次；未知 vendor API、硬體與 proxy 問題可能增加。 |
| 條件成本 | 另計 | inspection relay 4～8；各新 T1 profile 0.5～1；Grafana/Sparkplug/NGSI 各 1～2；每項新增依賴重新過 M-05/M-06。 |
| 經常成本 | 每年 4～7，另每 VLAN 0.1～0.3 | release/SBOM/授權 2～4，還原／輪替／抽樣退出 2～3；不含事故、設備更換與商業費。 |
| 全面退出 | 16～24，另逐站 rollout | 匯出核對、權限／消費者遷移、fleet、雙軌只讀與維護窗；不是「一條 SQL」。 |

更新通道必須覆蓋 agent、collector、OS 與 player，而非只升 north。初期少量盒子可用受控人工換映像、簽章校驗、canary 與回滾；量產前須有排程、離線追蹤及恢復測試。Mender 是 E-A 的 OTA 候選，不能把 client 的舊授權紀錄推成整套 Enterprise 免費；另選 OTA 元件須重列種類與費用，不默默塞進目前預算。

## 4. 仍然承認的弱點

security-03 仍致命：在不給 bypass 的 (c) 網路，原生 gRPC 可達性、routing secret 機密性及替代通道都未驗證。簽章設計不能解除保密或服務不可達。longevity-01 仍致命：M-05 的 commercial/OEM 權利待書面核定，沒有任何 license-blocked 選項已真正修復；「理論可談」與「現在可交付」必須分開。

平台的維護與相容主導權仍在供應商，元件與年度工時沒有因我方程式較薄而消失。agent/issuer/CQ 也提高自身 bus factor；知識、值班、restore 與外部審查仍須有人承擔。若最後只用少量 attributes 而未使用 Edge/HMI/告警，年度盤點可能判定平台不值得保留，這是退出條件，不是預先否定所有購買路線。

不可冪等動作的 crash gap、永久毀損及超窗結果沒有通用自動解；必須以可見 unknown、停止重跑及人工證據處理。一片螢幕的足跡、PLC 點表、reader 管理接口、customer read-only scope、Edge 離線登入與 CQ page 同步都尚未查證。三形狀十八列及所有負向測試未執行，任何「有修法」均不得在評分時當已通過 PoC。