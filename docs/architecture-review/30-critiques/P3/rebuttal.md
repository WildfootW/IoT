結論先講：**接受 43 條、部分接受 6 條、反駁 0 條**。五份來源共 49 條，原嚴重度為致命 2、重大 37、次要 10。P3 可以保留為有條件候選，不能以 NATS 品牌、耐久訊息或尚未執行的 PoC 宣稱可交付；兩條原始致命項仍待驗收解除。

修訂一：unit 改用受限的 core NATS 語意端點，補信任錨、雙向簽章、撤銷窗口與隔離。
修訂二：補 outbox、backend 執行證據、批次重讀、防重與還原界線，撤回任意實體 exactly-once。
修訂三：納入 bridge server OTA、混版契約、文件與 HMI 路徑，完整重列元件、妥協及成本。

日期：2026-10-11。角色：P3 Rebuttal，依 [Rebuttal 規範](../../90-resume/wave-b-proposal.js#L1)及 [RESUME A.2](../../RESUME.md#L1)。執行沿用 inherited default，無 effort 控制，不宣稱 strongest/high 已套用；未啟動巢狀 agent。本文只修訂設計，不覆寫原提案，不代表實作或驗收完成。

## 1. 證據與裁決口徑

已按指定順序全文讀取 brief、00/01/02、LOG/interim、P3、五份批判，再讀八份 facts 與 ledger-review；另讀兩份答辯規範，共 23 份文件。第三方事實只沿用 facts 的 **2026-10-10 快照**，本日未上網重查。摘要仍是摘要，未查證不等於不存在；下面的數值、流程、成本與退出條件是本次設計決定或估算，不是第三方保證。

[帳本覆核](../../40-mqtt-ledger/ledger-review.md#L5)指出的對稱原則成立：現成扇出、retained 與耐久零件有工程價值，不能因為仍要寫 reconciler 就歸零；反過來，也不能把零件算成已完成的產品。本文不繼承 interim 的淘汰結論。部分接受表示缺口成立但推論或修法需限縮，並非把成本打折；沒有足夠依據整條否定的 finding，故反駁為零。

| 來源 | findings | 接受 | 部分接受 | 反駁 | 致命 | 重大 | 次要 |
|---|---|---|---|---|---|---|---|---|
| security | 11 | 11 | 0 | 0 | 1 | 7 | 3 |
| longevity | 11 | 6 | 5 | 0 | 1 | 7 | 3 |
| correctness | 10 | 10 | 0 | 0 | 0 | 10 | 0 |
| scenarios | 9 | 8 | 1 | 0 | 0 | 7 | 2 |
| ecosystem | 8 | 8 | 0 | 0 | 0 | 6 | 2 |

## 2. 逐條裁決

每列保留原 ID 與原嚴重度，不合併跨 lens 的重疊項。W1～W5 是 §7 的共用成本包；列內工時是該包內的工作量估計，**不可逐列相加**。種類欄區分外部元件與同一 node 的新增職責；完整分類帳見 §6。條件式功能另列增量。

### 安全

來源：[security.md](security.md)。

| 原 ID | 原嚴重度 | 裁決 | 證據與理由 | 精確修法 | 種類增量 | 人週 | 時鐘成本 |
|---|---|---|---|---|---|---|---|
| security-01 | 致命 | 接受 | 原 §3.3 未交代驗 parent/root 的根；F-35、F-48、N-04，自己的 NKey 不回答這件事。 | §3 製造時寫入根與環境指派，先驗 server 名稱及 root 簽章再收 desired；假 parent、錯環境與首次開機列硬門檻。 | 製造信任工件 +1；不增 server | W1 1-2 人週 | 每批製造及每次根輪替驗收 |
| security-02 | 重大 | 接受 | 原 §3.3 的 fleet 權限與 §4.1 操作不符；[N6](../../10-facts/nats.md#L26)、[N9](../../10-facts/nats.md#L29)不能證明完整 ACL。 | unit 禁用 JS API；固定私有 up/down subject，由 bridge 驗簽後代讀寫，管理 client 只管本站 streams；禁止共用 inbox wildcard。 | 外部 +0；語意代理職責 +1 | W1/W2 1-2 人週 | 每版 ACL 正負向回歸 |
| security-03 | 重大 | 接受 | [N14](../../10-facts/nats.md#L34)的 nonce 認證不證明 hub 真實性；[T5](../../10-facts/transport-through-networks.md#L38)支持 TLS 終結的信任轉移。 | §3 所有雙向信封驗簽；manifest 簽資產 hash。inspection 僅允許核准 profile；需對 proxy 保密而無 bypass 就阻塞，不用簽章冒充加密。 | 外部 +0；簽章契約擴充 | W1/W4 1-2 人週 | 每個 proxy profile 及金鑰輪替 |
| security-04 | 重大 | 接受 | F-24、N-04；REGISTRY 簽章不能令複製的 prod leaf key 失效。 | bridge 納入同一 bootstrap/renew/revoke；部署身分與 seed 排除備份；還原預設禁止 prod egress，須重新核准環境。 | 外部 +0；部署 grant 工件 +1 | W1 1-2 人週 | 7 日憑證、5 分鐘授權租約；每次還原 |
| security-05 | 重大 | 接受 | 原 §2 把 T1 parser 與 callout 放同 process；F-07、M-04；[N17](../../10-facts/nats.md#L37)不是充分隔離證明。 | validator、issuer/callout、updater 分 OS user；parser 無簽發鍵及樹憑證，只經限長 IPC 交正式資料給 node。 | 同 repo 新增隔離 process；外部 +0 | W1 1-2 人週 | parser/codec 每版審查及資源回歸 |
| security-06 | 重大 | 接受 | [N10](../../10-facts/nats.md#L30)有 session/retained 持久化；[N8](../../10-facts/nats.md#L28)限額不能取代主機隔離。 | ingress 起始預算為獨立 512 MiB quota volume、128 MiB RAM、0.25 CPU 與全域 64 連線，經硬體驗收調整；raw 滿額不侵占 CQ 保留區；session/topic churn 達限拒收並計數。 | 外部 +0；配額與監控工件 | W1/W5 0.5-1 人週 | 每種硬體容量驗收；持續告警 |
| security-07 | 重大 | 接受 | F-40；[N5](../../10-facts/nats.md#L25)是 namespace，[N17](../../10-facts/nats.md#L37)不容推成跨客戶故障隔離。 | (c) 每客戶 hub/issuer 獨立 VM 與資料卷、憑證及配額；不共用 account-only 安全邊界。 | 同種類、每客戶新增實例 | (c) 增量內 1-2 人週 | 每客戶分批升級；共享 hypervisor 仍是故障域 |
| security-08 | 重大 | 接受 | 原 §8 沒有 binary 更新流程；[N15](../../10-facts/nats.md#L35)只證明 SBOM，不等於簽章。 | §7 簽署整套 release manifest、outbound 預取、停寫切換、健康門與本地回滾；server/client/config 同一批核准。 | 同 node 的 updater process +1/主機 | W3 2-3 人週 | 每版 rollout；High 事件另有處置時限 |
| security-09 | 次要 | 接受 | F-47、N-09；[MQ14](../../10-facts/mqtt-semantics.md#L53)支持版本抑制，原案未明定。 | 持久化最高 epoch/version；同版同 hash 只對帳，舊版或同版異 hash 拒絕；還原先隔離，過期新命令不得起跑。 | 外部 +0 | W2 0.5-1 人週 | 每次還原與反重放回歸 |
| security-10 | 次要 | 接受 | N-03、B-10；[N17](../../10-facts/nats.md#L37)有 monitoring/argv 洩漏紀錄。 | 監控僅 loopback；resolver 只在受限記憶體交付秘密，不採明文 conf 退路；Odoo service identity 限定 routes。server 接入方式未查證，未通過即不交付。 | resolver 職責 +1；不新增獨立產品 | W1/W5 0.5-1 人週 | 每版配置、日誌與憑證輪替檢查 |
| security-11 | 次要 | 接受 | D-05、T3 管理表、N-05；announce 簽章不能證明後續 EVT。 | T3 每筆事件與 heartbeat/attestation 由硬體 key 簽，帶 boot/seq；root 也驗原簽章，bridge 不可代簽成 T3。 | D-05 硬體 key adapter +1 | D-05 增量內 1-2 人週 | 每代硬體/韌體及 attestation 政策 |

### 十年維運

來源：[longevity.md](longevity.md)。

| 原 ID | 原嚴重度 | 裁決 | 證據與理由 | 精確修法 | 種類增量 | 人週 | 時鐘成本 |
|---|---|---|---|---|---|---|---|
| longevity-01 | 致命 | 接受 | [N20](../../10-facts/nats.md#L40)、[N21](../../10-facts/nats.md#L41)有外部支援時鐘；原 §9 未付 OTA。 | §7 指定 release owner 與獨立 updater，預取完整 bundle，驗 engine/client/ACL 混版；斷電可回復才准入首站。 | 同 repo updater；不引入第二 OTA 平台 | W3 2-3 人週 | 半年窗口及緊急修補；逐站 applied 證據 |
| longevity-02 | 重大 | 部分接受 | 漏項成立；但 [N22](../../10-facts/nats.md#L42)未證實必須雙 Python，hub 是實例責任，不能任意加成一種。 | §6 重列各分類與共同依賴；不用 natscli，備份採停寫一致性映像；單一 OS Python，不藏第二 runtime。 | 依完整 BOM 計；撤回 14 的充分性 | W5 0.5-1 人週 | 每版 BOM、每客戶實例清冊更新 |
| longevity-03 | 重大 | 部分接受 | client 演進風險成立；「未來修補只進拆包」超出 [N22](../../10-facts/nats.md#L42)，其明標取代關係未查證。 | 首版選單一系統 Python + pin 的 nats-py 候選；DOCS 改 parent HTTPS。若支援組合失效，整機映像升級或退出，不長期凍結無修補線。 | HTTP library 補列；不加第二 Python | W3/W4 1-2 人週 | client/OS 每版相容性；舊線期限未查證 |
| longevity-04 | 重大 | 接受 | [N9](../../10-facts/nats.md#L29)只是 ack 格式變更預告，但足以否定永遠相容的假設。 | §7 固定 hub/leaf/client/config 矩陣；unit 不碰 JS；管理 ACL 逐版產生，不用放寬 $JS wildcard 解卡。 | 外部 +0；矩陣工件 +1 | W3 1-2 人週 | 每個 server/client 升版重新驗收 |
| longevity-05 | 重大 | 部分接受 | 還原缺口成立；清空 bridge 接受未上送資料丟失不能直接通過 F-46，T1 的 owner 就在 bridge。 | §4 分鏡像與 origin，保留 T1 journal；source 新 generation 後依業務 ID 對帳，未可重建資料記 gap；不信還原後 stream sequence。 | 外部 +0；備份/還原工件擴充 | W2 1-2 人週 | 每季演練；每次 schema/store 變更 |
| longevity-06 | 重大 | 接受 | [N8](../../10-facts/nats.md#L28)的吞吐不是壽命測試；[N10](../../10-facts/nats.md#L30)增加持久寫入面。 | bridge 資料卷採可更換 SSD；PoC 量實際 bytes/day、fsync 尾延遲及廠商耐寫規格，超預算換規格，不降低 CQ 耐久性。 | 硬體料件 +1；軟體外部 +0 | W5 0.5-1 人週 | 年度耐寫餘量檢查；硬體換代重測 |
| longevity-07 | 重大 | 部分接受 | 一屏負擔成立；「原因不存在」過強，[N6](../../10-facts/nats.md#L26)仍提供耐久投影。沒有證據說這些收益值回成本。 | 不新增無 NATS 模式偷換提案；一屏仍付完整基底。有 MQTT 5 需求時替換 ingress，不在前面再疊舊入口。 | 最小部署不減 NATS；替換不並存 | W5 0.5 人週比較驗收 | 無需求仍須追 server 時鐘，不能省 |
| longevity-08 | 重大 | 部分接受 | 遷移範圍低估成立；12-18 人週也是估算，不是實證下限。 | 身分以公鑰/環境契約定義，callout 只轉接；外部 consumer 不直讀 JS，官方接口為版本化投影/PG/MQTT。 | 外部 +0；消費契約工件 +1 | 退出預留 12-18 人週，另客戶協調 | 每年演練匯出、重建與 consumer 遷移 |
| longevity-09 | 次要 | 接受 | M-06；[N19](../../10-facts/nats.md#L39)治理事件僅二手，不足判現任組織分布。 | 每季查原始 release/security/license/maintainer；支援斷線、無法修補或維護責任不明即凍結新售並啟動退出評估。 | 外部 +0 | W5 0.5 人週 | 每季 0.1 人週查核，包含於維運包 |
| longevity-10 | 次要 | 接受 | [N24](../../10-facts/nats.md#L44)未證明 callout 適用 leaf、expiry 斷線或 kick API。 | §3 將 client/leaf callout、到期斷線、在線撤銷列聯合門檻；任一不成立，不退到寬鬆 verify_and_map 或永久 seed 放行。 | 外部 +0 | W1/W5 0.5-1 人週 | 每個支援 server 版本重測 |
| longevity-11 | 次要 | 接受 | (c) 是新增營運責任；原 §9 沒估停機、監控與租戶管理。 | 每客戶單 hub VM，公告維護窗口、leaf 播舊狀態；第一版不承諾 HA。要求 HA 時另估 quorum/故障域，不用增加第二客戶當假證明。 | 相同種類、VM/備份實例增加 | (c) 增量內 1-2 人週 | 每客戶 0.5-1 人週/年維運預留 |

### 正確性

來源：[correctness.md](correctness.md)。

| 原 ID | 原嚴重度 | 裁決 | 證據與理由 | 精確修法 | 種類增量 | 人週 | 時鐘成本 |
|---|---|---|---|---|---|---|---|
| correctness-01 | 重大 | 接受 | F-46、C-20；[N7](../../10-facts/nats.md#L27)的 CAS 不涵蓋 ERP commit。 | ERP 業務交易同寫 outbox；root 在交易外投影，保存版本及 hash，啟動與週期批次對帳，禁止 publish 先於業務提交。 | 外部 +0；outbox 表 | W2 1-2 人週 | ERP 每版、提交前後 crash 回歸 |
| correctness-02 | 重大 | 接受 | F-47/F-51；[N8](../../10-facts/nats.md#L28)去重窗不是物理 effect/CQ 交易。 | §4 inbox 先耐久；backend 須同 key 重讀可驗證結果。無此能力改 intent，不能改者恢復為 unknown、禁止盲重試。 | 外部 +0；backend 契約擴充 | W2 1-3 人週/首批 backend | 每個 backend/韌體版本的 effect 故障點 |
| correctness-03 | 重大 | 接受 | F-46/F-49；[e15](../../10-facts/precedents.md#L42)、[e17](../../10-facts/precedents.md#L44)支持結果關聯及重讀，不證明 P3 已做。 | CQ/EVT/intent 終態本地 outbox，以 owner_generation/cursor 分頁；缺口重列；ERP 冪等提交後回業務收據，非 JS ack。 | 外部 +0；批次同步職責 | W2 1-2 人週 | 每版 cursor、ERP commit/ack 中斷測試 |
| correctness-04 | 重大 | 接受 | F-50/F-51/F-64；timeout 不取消已執行工作。 | flight 持久；edge 起跑驗 deadline/epoch/fence；unknown 或 timeout 不釋放衝突 slot，僅終態或已驗證停止解除；遲到 CQ 追加事實。 | 外部 +0 | W2 1-2 人週 | 每版中斷、延遲 CQ 與重啟回歸 |
| correctness-05 | 重大 | 接受 | F-49/F-53/F-54；history 1 的 applied_version 不保存 v2 的拒絕。 | actual 加 observed_version、applied_version、status/reason/hash；終態進耐久 log；未起跑舊 intent 明記 superseded。 | 外部 +0；終態 schema | W2/W4 1 人週 | schema 每版；ERP 停機後回補測試 |
| correctness-06 | 重大 | 接受 | F-31/F-32；[MQ18](../../10-facts/mqtt-semantics.md#L65)不強制 host 拒絕未知 metric。 | schema_rev 經 root 接受、鏡像到 bridge 後回 signed grant；producer 才送新版本，未准資料暫存；bridge/writer 雙重驗證。 | 外部 +0 | W2/W4 1-2 人週 | 每個設備型別及 schema 變更 |
| correctness-07 | 重大 | 接受 | F-56/F-60、N-11；[N7](../../10-facts/nats.md#L27)沒有跨文件提交。 | §5 改 immutable manifest + HTTPS hash objects，整版就緒才啟用；舊 assets pin 到新 actual 確認；指定版缺件拒絕。 | HTTP library 補列；雙份快取 | W4 1-2 人週 | 每個 player 版本、斷檔/斷網回歸 |
| correctness-08 | 重大 | 接受 | 原 §4.1 的 1000 筆可先於 90 日淘汰；F-51，[N8](../../10-facts/nats.md#L28)。 | §4 撤掉筆數先到先刪；獨立 tombstone 至少 16 日，未定案不 GC；job key 不重用，過 deadline 不得重簽成新工作。 | 外部 +0；防重表與容量指標 | W2 1 人週 | 每次 retention/容量設定變更 |
| correctness-09 | 重大 | 接受 | F-02/F-27/N-14；時間存在不代表有效。 | 有效時間源與偏差 gate；保留 raw device_ts、clock_quality、boot/seq；錯時隔離，存活另受單調 elapsed 上限約束。 | 使用既有時間服務，缺時新增一項 | W2/W5 0.5-1 人週 | 冷開機、校時跳變與時間源故障 |
| correctness-10 | 重大 | 接受 | F-08/F-11/N-05；PG commit 與 ack 並非同一交易。 | sample_id 在來源生成；PG 唯一鍵去重，僅新插入資料推進 roll-up 水位且同交易提交，再確認；同 ID 異內容隔離。 | 外部 +0；索引與水位表 | W2/W4 1 人週 | writer/SQL 每版及重播回歸 |

### 情境擬合

來源：[scenarios.md](scenarios.md)。

| 原 ID | 原嚴重度 | 裁決 | 證據與理由 | 精確修法 | 種類增量 | 人週 | 時鐘成本 |
|---|---|---|---|---|---|---|---|
| scenarios-01 | 重大 | 接受 | D-01、F-60；desired 可見不等於文件完整。 | §5 以 manifest 逐件驗證、先暫存再 reconcile；完成回報綁文件版本與 hash，缺件保留 V1。 | 外部 +0；快取空間 | W4 1 人週，與 correctness-07 共用 | 每次文件契約/player 升版 |
| scenarios-02 | 重大 | 接受 | D-01/F-63/C-24；原 §6 憑空假設站內 MES。 | root 從 ERP 業務 JSON 取得版本化 snapshot，沿 trunk 投影；bridge 限定 work centre 與 per-screen 授權，供本地輪詢及 freshness。 | 同 HTTP service 新 API 職責 | W4 1-2 人週 | ERP JSON schema/授權每版 |
| scenarios-03 | 重大 | 接受 | D-02/F-46/F-67；歷史不會自動重建越線事件。 | 門檻狀態變化與 event_id 同寫 unit EVT journal；共用 §4 同步與 ERP receipt，復線不只補 PG。 | 外部 +0；EVT spool | W2/W4 1 人週 | 門檻版本、離線越線及恢復回歸 |
| scenarios-04 | 重大 | 接受 | F-19/F-22/F-32；地址可被換機重用。 | commissioned id 綁 serial 或人工確認、address/register-map revision；無 serial 者換址暫停歸檔待確認；signed 壓差測正負值。 | Modbus library 補列 | W4 1 人週 | 每型號/換表 commissioning |
| scenarios-05 | 重大 | 接受 | D-04/F-44/F-49；單台 actual 不等於整場 show 完成。 | 固定 show_version 成員，逐台記 applied/rejected/unknown，ERP 聚合 partial；timeline 本地，不承諾同步起跑、不先建 Workflow。 | 外部 +0；ERP 聚合模型 | W4 1 人週 | 每次 show/capability schema 升版 |
| scenarios-06 | 重大 | 接受 | D-05、F-38；REGISTRY status/path 不是 applied config。 | 獨立 config_rev/actual 管 site、parent、enabled functions；重定位須雙端核准新 path_epoch；拒絕保留舊配置。禁止門禁權限/鎖狀態混入。 | 外部 +0；管理 schema | D-05 增量內 1-2 人週 | reader/管理 schema 每版 |
| scenarios-07 | 重大 | 接受 | N-14 是既有現場教訓；NKey 認證不解決時間品質。 | 零時間不入有效歷史與 presence；D-05 事件保留序號及 unknown time，恢復只附校時資訊，不杜撰原始時間。 | 同 correctness-09 時間依賴 | W2/W5 1 人週，共用 | 每種冷開機/時間失效情境 |
| scenarios-08 | 次要 | 部分接受 | 足跡需補全；原三服務是中央應用口徑，不是聲稱全站只有三個 process；[覆核](../../40-mqtt-ledger/ledger-review.md#L5)亦要求分開口徑。 | §6 列 north、unit、updater、PG/player 與基礎設施，量整機資源；不拿部署角色數冒充實測 process 數。 | 原漏列依賴全部入帳 | W5 0.5 人週 | 每種硬體及 bundle 版本 |
| scenarios-09 | 次要 | 接受 | 原 §3.1 只有 raw 8883，§5 卻承諾 leaf MQTT HMI。 | §3/§5 明列可信側 8884 與 MQTT 投影 publisher；HMI 不訂 raw。標準 Sparkplug profile 則換獨立出口，不混用埠。 | 同引擎新 listener；MQTT client +1 | D-06 增量內 0.5-1 人週 | listener/ACL 與 WAN 斷線回歸 |

### 生態

來源：[ecosystem.md](ecosystem.md)。

| 原 ID | 原嚴重度 | 裁決 | 證據與理由 | 精確修法 | 種類增量 | 人週 | 時鐘成本 |
|---|---|---|---|---|---|---|---|
| ecosystem-01 | 重大 | 接受 | [N10](../../10-facts/nats.md#L30)、[N12](../../10-facts/nats.md#L32)有 topic 轉換/認證限制；3.1.1 標籤不足。 | 每型號固定 firmware、client/broker 角色、TLS、topic、QoS/session 矩陣；ACL 依轉換後 subject；不相容即替換 ingress，不要求 T1 改碼。 | 需要時 Mosquitto +1，取代舊入口 | 0.5-1 人週/型號 | 每次 firmware/topic 能力變更 |
| ecosystem-02 | 重大 | 接受 | [MQ1](../../10-facts/mqtt-semantics.md#L28)有 metadata；outbound client 不是可被訂閱的 broker。 | MQTT 5 profile 選獨立 Mosquitto + validator client，映射 expiry/properties 到內部信封；不可保留的必要能力直接拒絕該型號。 | broker/client 各 +1；不保留 NATS raw | 1-2 人週首個 profile，另型號驗收 | broker/client 與 metadata 每版 |
| ecosystem-03 | 重大 | 接受 | [MQ17](../../10-facts/mqtt-semantics.md#L64)、[MQ20](../../10-facts/mqtt-semantics.md#L67)、[MQ21](../../10-facts/mqtt-semantics.md#L68)要求 STATE/BIRTH/Rebirth。 | §5 標準 profile 由 validator 當受限 Host，放行已綁定 STATE、僅 Node Control/Rebirth；型別先驗，不開一般致動 NCMD。 | Sparkplug codec +1；隔離 process | Sparkplug 增量內 2-3 人週 | spec/codec 每版、重連及缺號回歸 |
| ecosystem-04 | 重大 | 接受 | [MQ19](../../10-facts/mqtt-semantics.md#L66)不只 NDATA；[N10](../../10-facts/nats.md#L30)的 QoS 0 限制只對 NATS→MQTT。 | 基線只承諾 JSON HMI；Sparkplug profile 明定出口 Edge Node 的 birth/alias/seq/bdSeq/Will，採 MQTT publisher，不把 meas subject 冒稱標準輸出。 | 標準出口與 codec；與前列共用 | Sparkplug 增量內 2-3 人週 | 具名 HMI 冷啟/晚到 NDEATH 回歸 |
| ecosystem-05 | 重大 | 接受 | N-01/N-18；raw 入口不能充當正常化出口。 | 可信側 8884、HMI 個別只讀身分、白名單 topic，raw 無路由可直達；斷 WAN 測本地完整路徑及 stale。 | 與 scenarios-09 共用 | D-06 增量內 0.5-1 人週 | 每種網段與 listener 配置 |
| ecosystem-06 | 重大 | 接受 | F-32/F-39；[e17](../../10-facts/precedents.md#L44)只是快照/增量先例，不是 P3 的公開契約。 | 公開 stable id、schema_rev、unit/quality/time、replay/live 與 cursor 重建；MES 用版本化 API 或 PG views，Grafana 留 PG，不開原始 JS。 | 外部 +0；消費契約 +1 | 1-2 人週首個 connector；其後 0.5-1 人週/個 | consumer/schema 每版相容測試 |
| ecosystem-07 | 次要 | 接受 | [F5](../../10-facts/buy-options.md#L79)、[F8](../../10-facts/buy-options.md#L82)區分 NGSI；[OPC UA](../../10-facts/zenoh.md#L82)只有摘要。 | NGSIv2、NGSI-LD、OPC UA 分開列「未支援」，只有具體合約觸發 connector 與型別映射；保留 vendor 管理面 F-34。 | 每項標準另 +1 connector/相依待查 | 2-4 人週/標準初估 | 每項規格、授權與 SI 版本 |
| ecosystem-08 | 次要 | 接受 | N-18；[N17](../../10-facts/nats.md#L37)稽核不涵蓋我們產品，不能當採購認證。 | 交付版本/功能矩陣、端口與信任圖、責任 owner、驗收記錄；無實測的格子標未查證，IT 不接受就不部署該 profile。 | 外部 +0；證據包工件 | W5 0.5-1 人週；每站另 0.5-1 人週 | 每版與每站 IT/SI 簽認 |

## 3. 修訂原 §3：身分、信任與部署

取代[原拓樸與身分設計](../../20-proposals/P3-nats-leaf.md#L58)。leaf outbound 此點成立；account 不是整個安全邊界。unit 只發布自己的固定 up subject、訂閱自己的 down subject，request id 在信封內，不讓裝置建立 consumer、讀 bucket 或自由指定 reply subject。bridge 的特權 client 代理持久操作，對 T2/T3 上行保留原簽章，root 再驗；T1 則明標 bridge 代表與低信任來源，不把 schema 合格解讀成量測真實。

製造站將離線 factory root 公鑰與簽過的 environment/site 指派寫入裝置，並 pin 該環境的 CA、應用簽章鍵及允許的 parent。裝置自行生成 bootstrap key；adopt 時再生成不同的 operational key，以公鑰證明持有，root 為唯一發行者。bootstrap 只准 announce，不收業務下行；REGISTRY 權威移至 root SQLite，先耐久寫 binding 與投影 outbox，ERP 收到該 revision 的收據才建立管理紀錄。adopt 提交即停用原 bootstrap；RMA 不複製 seed，不以 IP 或 path 代替 serial。

信封簽署原始 payload bytes，拒絕重複 JSON key；內容綁 purpose、env、site、serial、function、path_epoch、版本、hash、有效期及授權範圍。上下行、config、revoke、manifest 都同樣驗證。7 日營運憑證於半期續期，授權另以 root 簽署的 5 分鐘租約限制；bridge 不得用陳舊 REGISTRY 自行延長。在線撤銷目標 60 秒內停接並斷 session；斷鏈最長 5 分鐘後不准新 job/config，既有畫面及本地模式可繼續，這不是離線立即撤銷。rejected 與 unknown 分開，單純斷線或拒絕都不得觸發 wipe。

callout 是否覆蓋 client/leaf、expiry 斷線與 kick API 仍未查證，不能用這份規格宣稱功能存在。它們是同一個採用門檻，失敗就停止採 P3，不退回寬鬆 DN mapping。issuer、parser、updater 隔離；憑證秘密只由 resolver 在受限記憶體交付，若原版 server 無法滿足 N-03 就阻塞。私鑰與部署身分不進狀態備份，staging 預設無 prod egress、無可用 grant；只有資料庫內的 environment 標籤不足以解除隔離。

| 形狀 | 修訂後連線與元件責任 | 拒絕條件 |
|---|---|---|
| (a) 同主機 | north 有 Odoo/PG、root node、獨立 issuer/callout、hub、updater；unit → IoT 腳 4222，文件 → 同一 parent 8443。root → ERP 內部限定 routes。 | 管理介面不向 T1 開放；同 hypervisor 仍執行介面/volume/資源隔離。 |
| (b) 分 VLAN | 每個 device VLAN 的 bridge 有 leaf/node/callout/updater；T1 MQTT → raw 8883，poller → 白名單 502，RTU 本機；unit → 4222/8443；leaf → parent 7422，文件 → parent 8443。HMI → 可信側 8884。 | default-deny、禁止 IP forwarding；同 VLAN lateral 需 AP/交換器隔離，缺此工件不宣稱 F-18 成立。 |
| (c) outbound | 每客戶獨立 hub VM；site → cloud 443 的 leaf WebSocket 與 /objects；本地路徑同 (b)。parent endpoint、ERP origin、文件 origin、live JSON origin 分開配置。 | 無 inbound；Upgrade/認證 CONNECT/inspection 分 profile 驗收。只改 scheme 不算 TLS 設定，[N4](../../10-facts/nats.md#L24)。 |
| 共用 | DNS/NTP 僅指向指定服務；monitoring loopback；keepalive 設計 25 秒並低於路徑實測 idle；重連有 jitter/backoff。 | 不從 [T7](../../10-facts/transport-through-networks.md#L45)、[T16](../../10-facts/transport-through-networks.md#L59)推成所有 proxy 必通；不自動降級驗證。 |

inspection profile 必須經 IT 核准企業 CA 與資料可見範圍；應用簽章仍驗原 root，proxy 不可冒發命令。若文件、事件或秘密必須對 proxy 保密，只接受 bypass，否則本版不支援該部署；不把未設計的端到端加密列成已存在退路。根與中繼輪替採新舊簽章鍵重疊及獨立核准，遺失根或環境指派需重新 enrol，不從不可信網路補一把「新根」。

## 4. 修訂原 §4、§5、§9：完成、重讀與還原

撤回[原語意判定](../../20-proposals/P3-nats-leaf.md#L168)中「結構上消失」的措辭。ERP 的業務 row 與 outbox 同交易提交，root 在交易外投影 KV/SQ；JetStream publish ack 只代表傳輸層收件。unit 先把 inbox、body hash 與 received 狀態耐久化才確認收件，再記 executing 後呼叫 backend。完成必須由實際讀回的 backend 結果形成 CQ，CQ 與本地結果 outbox 同交易；任何一個傳輸 ack 都不能代替它。

SQL 交易不能包住燈光、畫面或其他物理副作用。effect 已發生而 CQ 未落盤時，只有 backend 能按相同 key 重讀結果、或可驗證的狀態收斂，才能自動恢復。LED config/playlist 集合改為 intent；resume 等一次性工作沒有上述能力就保留 unknown，禁止盲重試。即使播放器 API 接受設定，也不能叫作「螢幕已呈現」；只能回 backend_confirmed，除非另有畫面/裝置回讀證據。P3 不交付任意致動 exactly-once，D-05 的鎖控制不進這個通道。

flight 由 ERP/root 持久管理；起跑須驗合法時間、deadline、epoch 與 fence。timeout 是等待逾期，不是取消，不釋放衝突工作；後到 CQ 追加 late_result，不抹去原 timeout。沒有證據證明前項終止時，人工核准也不能憑空產生停止證據，必須先查驗或隔離 backend。intent 的 actual 同時記 observed_version、applied_version、status/reason 與 manifest hash；被新版合併而未執行者明記 superseded，拒絕亦留歷史。

同步以 owner_generation、cursor、page_limit、high_watermark 為契約，每頁最多 256 筆。重連與每 120 秒批次對帳，先抓完整快照水位再續變更；cursor 不在保留範圍回 reset_required 與可用範圍，不假裝空集合。unit 重送尚未取得 ERP 業務收據的 CQ/EVT；root 只有在 ERP 冪等提交後才回收據。MEAS 則以 PG commit 收據為準，穩定 sample_id 去重與 roll-up 水位同交易更新；所有原始量測都不進 ERP rows。

| 事實/owner | 保留、重送與容量契約（設計值） | GC、故障與觀測 |
|---|---|---|
| ERP desired/SQ/outbox | 業務版本與 job key 永不重用；job deadline 最長 7 日，SQ 快取 8 日，publish dedupe 10 分鐘僅作最佳化。 | outbox 提交後可重列；過 deadline 禁止自動重發為可執行工作，不能靠重新簽名延命。 |
| unit inbox/tombstone | 合法重送 7 日 + 可接受備份回退 7 日 + 2 日裕量 = 至少 16 日；從最後可能起跑時間計。未定案 flight 不 GC。 | 結果與防重分開；即使 CQ 已移交，仍拒絕舊 key/body hash。超 7 日備份不直接恢復執行資格。 |
| CQ、intent 終態、EVT | unit/T1 bridge SQLite 為 owner，至少 90 日；移除「1000 筆或 90 日」的先到淘汰；ERP 業務收據鍵也保留至少 90 日。 | 容量按峰值率 × 保留期 × 實測 bytes × 2 配置；命令/result 滿額先拒新工作，不默刪未確認結果。期限外返回 result_expired/缺口，不宣稱未執行。 |
| MEAS | T2 unit 或 T1 bridge 的已驗證 journal 保留 7 日；bridge/root streams 是投影；PG 歷史 3 年。 | 80% 配額告警，滿額或超期可淘汰量測但耐久記錄 gap 範圍/計數；不挪用命令保留區。 |
| raw MQTT | ingress 不是產品耐久收據；T1 無重讀能力時，validator 收錄前的樣本不能保證保存。 | 清楚區分 broker 收件與產品接收；無 seq 的來源只能標區間缺資料，不能虛造精確丟棄數。 |
| REGISTRY/config | root SQLite 為權威；鏡像不授予新權利；5 分鐘租約到期停止新下行。 | revocation age、lease age、鏡像 lag 可見；bootstrap/續期不能靠過期快取自簽。 |
| schema/presence | schema_rev 有 signed accepted grant 才放新資料；heartbeat 120 秒、離線 5 分鐘；時鐘偏差上限設 120 秒。 | 無效 device_ts 保留原值與 quality，不以 receive time 替代；重播不刷新在線，單調 elapsed 限制未來時間。 |
| DOCS/watch | pin 目前與候選整版 assets；cursor log 90 日，逾期重列 owner 快照。 | 僅在新 actual 確認且無引用時回收舊內容；缺 hash object 不改目前畫面。 |

還原不依賴 JetStream sequence 延續。先封閉新工作、取得不隨資料備份回滾的部署 grant，輪替 recovery epoch，對照 ERP flight、unit CQ 與 T1 journal，再建新 generation 的 mirrors/sources，以業務 ID 補送。每次 unit 冷啟也需新 boot grant 才能起跑 job，舊 SQLite 不可離線自行恢復執行。雙方執行證據都遺失時只能 unknown，不能用空 dedupe 表證明沒做過。

備份選停寫並乾淨停止後的一致性映像，含所有 origin journals、SQLite 與其必要狀態，不複製活檔；私鑰分流。每日一份、可執行還原最老 7 日，超出者重新 enrol 並人工對帳。單媒體毀損的 RPO 是最後異機確認點，不是 fsync；離線時仍可能失去整段未外送資料，須輸出可見 gap。不能採「清空 bridge 就恢復」掩蓋 T1 事件或量測的遺失。

## 5. 修訂原 §5、§6：文件與產品流程

取代[原 D-01～D-06 承諾](../../20-proposals/P3-nats-leaf.md#L196)。文件不再依賴 Object Store 的 API 後繼：ERP 產不可變 manifest，root 以既有 ERP 權限取內容，bridge 經 parent HTTPS 快取 hash objects。unit 只能取綁給自己的版本，授權在 header，不在 URL；manifest 齊備且驗 hash 才切換。live board 也不假設站內有 MES，由 root 投影 ERP 的 work-centre snapshot，bridge 提供受限 JSON，約五秒輪詢、超過十五秒標 stale 並保留 origin timestamp，polling 狀態回到業務監控。

| 功能 | 修訂後的可觀察出口 |
|---|---|
| D-01 | Preview/Publish/Apply 保留；逐版 reconcile 與移除 ghost assets；ERP 顯示 applied、rejected、waiting_content 或 unknown，不把舊版 OK 套給新版。 |
| D-02 | sensor process 隔離、暖機/故障 no data；30 秒聚合與時間品質入 PG，Grafana 畫線；越線與恢復寫 EVT，不由原始量測偷偷觸發下行。 |
| D-03 | 代表 id 與 commissioning 綁定，register map 有 revision；換址/換表需身份確認，比例/單位/正負值測試先於歷史接續。 |
| D-04 | show_version 固定成員與 capability snapshot；逐台結果再聚合 partial，standalone 保持，timeline 本地，不保證跨 controller 同步。 |
| D-05 | config_rev 管 site/parent/functions 與 applied/rejected；事件及存活由硬體 key 簽。credential lists、門禁 schedules、door state 屬控制面，本版不交付。 |
| D-06 | 基線是正常化 JSON HMI，使用可信側 MQTT 8884 與 retained 投影；HMI 顯示品質、時間及 replay 標記。若上行聚合不合現場延遲，另開僅站內快通道，歷史仍 ≤1 Hz。 |

原「補回一半以上」無量化依據，撤回；[N11](../../10-facts/nats.md#L31)也只能稱維護者當時的傾向。NATS listener 能否接某設備須以型號矩陣判斷，不能只問 MQTT 版本。NATS→MQTT 的 QoS 限制亦不得套到所有方向。JSON 投影用 MQTT publisher 明確設定 retain，不假設 core publish 自帶同樣旗標；每個外部消費者仍付型別、權限與 freshness 整合成本。

若合約指定完整 Sparkplug，選獨立 Mosquitto raw/n 取代 NATS MQTT 入口及出口，leaf trunk 保留；不在舊 ingress 前再堆 broker。raw validator 是限定 Host，STATE online 與 BIRTH gate、未知 alias 拒收、缺號後限速 Rebirth 都有 owner。n 投影器另當 Edge Node，使用自己的 seq/bdSeq、完整 BIRTH 型別表、DATA 增量、NDEATH Will，並處理 HMI STATE 與限定 Rebirth；絕不直通一般致動 NCMD。這是另收費的支援 profile，具名 client/HMI 尚未驗收，不能列為本版已支援。

## 6. 完整重列原 §2 與 §7

以下取代原元件清單，非只列新增部分；原有的 backend、ERP、PG、Grafana、部署、e2e 與 Parts 全保留列管。種類、process 與實例分開：一份 node code 不表示所有角色可以共用權限，外部 binary 未修改也不免除維護時鐘。

| 元件/職責 | 自建或外部、部署與取代範圍 | 授權/版本證據及維護責任 |
|---|---|---|
| nats-server/JetStream/leaf | 外部 binary；每 hub/bridge 一個；T1 需要時另有 raw。保留傳輸、扇出與可重建投影，不持業務真相；store_dir 為持久絕對路徑，資源限額明設，單副本 sync_interval=always。 | Apache-2.0：[N18](../../10-facts/nats.md#L38)；支援政策 [N21](../../10-facts/nats.md#L41)，設定依據 [N8](../../10-facts/nats.md#L28)。公司 release owner 管 pin/修補/回滾。 |
| node unit/bridge/root | 自建同 repo，Python；語意代理、同步、ERP adapter、writer、HTTP 快取/consumer 職責；取代 gateway/south/IOTA/Orion 的相應路徑。 | 自有；協定、schema、錯誤詞彙與 conformance 是自有時鐘，不再稱薄 agent。 |
| issuer/callout/resolver | 同 repo 獨立 OS user/process；root 唯一權威，bridge 只依租約授權；製造 station 與離線根另列操作。 | 自有流程；crypto 庫不自製。callout、記憶體秘密交付 API 未查證，是採用 gate。 |
| updater/release 工件 | 同 repo 獨立受限權限 worker，每主機一個；涵蓋 node、nats-server、設定、client 與整機映像。 | 自有；不採 Mender、不加第二 OTA server；工時與供應鏈審查不可省。 |
| nats-py | 外部 library；首版候選 pin 2.16.0，實際 OS/API 相容未查證，不聲稱已選定可交付 binary。 | Apache-2.0 與版本快照：[N18](../../10-facts/nats.md#L38)、[N22](../../10-facts/nats.md#L42)；拆包取代關係仍未查證。 |
| HTTP/crypto libraries | 候選 aiohttp、cryptography；由同一系統 Python 執行，不引入另一語言。 | 授權、支援版與平台封裝未查證；分列兩個外部時鐘，發布前核查，不自刻 crypto。 |
| function backends | display、LED、sensor、Modbus；各獨立 process、本機 IPC/loopback；parser 不持樹鑰匙。Modbus 庫候選 pymodbus。 | 自有 backend；pymodbus 授權/版本未查證，啟用才加 library 時鐘。 |
| SQLite | unit facts、root registry、T1 bridge origin journal；無獨立 DB daemon。命令、結果與身分交易要求 WAL、synchronous=FULL；heartbeat 不逐筆落盤，硬體 flush 效果須斷電驗收。 | 實際版本及授權本次未查證；每版 bundle 列 pin、一致性備份與還原驗收。 |
| Odoo + iot 模組 + ERP PG | ERP 保留業務 owner、UI/CMS、outbox/flight；root 只用限定介面，不重寫 vendor 管理面。 | Odoo 部署授權/API 版本未查證；[G1](../../10-facts/buy-options.md#L91)僅二手，不能當遷移已完成。 |
| history PostgreSQL | 有感測器才啟用；若我們管理叢集且備份預算允許可同叢集獨立 DB，否則獨立 PG 實例；不加 TSDB 引擎。 | [F-11](../../10-facts/postgres-timeseries.md#L39)版本政策含摘要；[F-12](../../10-facts/postgres-timeseries.md#L40)分區、[F-13](../../10-facts/postgres-timeseries.md#L41)非增量 MV，支持自有增量 SQL；實際交付授權另核。 |
| Anthias/player | D-01 保留且藏在 reconcile backend 後，不把其 API 接受等同物理顯示。 | 實際版本、授權與支援期限未查證；每次更換 player 做完整換頁/回讀驗收。 |
| Grafana | 可選 ops 畫線，PG 只讀，不把 MQTT 當其歷史來源。 | 部署版授權/支援需重查；[既有支援帳](../../02-tradeoffs.md#L1)不是本日驗證。 |
| OS/基礎設施 | Linux/systemd、單一 Python、TLS provider、boot chain、DNS、有效 NTP；反向代理/LB 使用才加，bridge 資料使用可更換 SSD。 | 各實際版本/授權/硬體耐寫未查證；同映像 pin 並分別追安全時鐘，借 IT 服務仍要有 owner。 |
| 部署/IoT_e2e/IoT_Parts | 自建既有 repo 類別；三形狀配置、ACL、quota、角色/volume 清冊、中文零件筆記與 stub/e2e。 | 我們維護；不以三個 NATS 容器互通代替 ERP 到 backend 的端到端證據。 |
| 條件式 MQTT/Sparkplug | JSON HMI 加 Paho client；MQTT 5/Sparkplug profile 加 Mosquitto，替換 raw；標準出口再加 protobuf codec。 | Mosquitto 授權快照：[broker 1](../../10-facts/mqtt-brokers.md#L22)，不代表零義務；Paho/codec 授權與維護現況未查證。[MQ26](../../10-facts/mqtt-semantics.md#L63)只是參考實作線索。 |
| 明確不採用 | nsc/operator JWT 工具鏈、Go 嵌入、natscli、第二 Python runtime、預先建 Workflow、第二生產 trunk binding。 | 需要任何一項時重算並另審；不把未做的 HTTPS fallback 算成本版能力。 |

| 計數口徑 | 一屏基線 | 有 Modbus/Grafana 的標準部署 |
|---|---|---|
| 引擎 | PG、SQLite、NATS = 3 | 3 |
| 自有語言 | Python、SQL = 2 | 2 |
| 應用 runtime 家族 | Odoo、node、nats-server、player = 4 | 加 Grafana = 5 |
| 自有 repo 類別 | node、ERP 模組、部署、e2e、Parts = 5 | 5 |
| 外部時鐘 | server、client、SQLite、PG、Odoo、Python、Linux/systemd、TLS provider、crypto 庫、HTTP 庫、player、boot chain、DNS、NTP = 14 | 加 Modbus 庫、Grafana = 16 |
| 舊式跨分類加總 | 28 | 31 |
| 條件增量 | nginx/LB 家族再加 runtime 與時鐘；JSON MQTT HMI client +1 時鐘 | Mosquitto 加引擎/runtime/時鐘各一；codec +1 時鐘；實例數另記 |

此加總刻意遵循原案跨分類計分，會重複計同一元件，不是 28 個產品；不能拿它與其他方案漏項的十一或十四直接排名。最小一屏至少十個部署角色：north 的 Odoo、PG、root node、issuer/callout、hub、updater，加螢幕的 unit、display backend、player、updater；實際 OS process/RSS 尚未量。沒有歷史需求就不啟用 history、Grafana、poller、raw，但上述更新、安全與命令狀態不刪。

| 原 §7 項目/需求 | 修訂後妥協 | 換到什麼 | 真實代價/未解除條件 |
|---|---|---|---|
| M-02 | 接受完整 BOM，不再用 11→14 的差額宣稱精確成本。 | leaf、扇出、耐久投影零件。 | 種類及 process 均增加；HTTP/crypto/OS 不是零。 |
| M-06 | 公司 release 包承接 server/client 外部時鐘。 | 有公開修補來源可追。[N17](../../10-facts/nats.md#L37)不等於現有漏洞全未修。 | W3 及年度維運；離線站點修補速度有界。 |
| N-13/一屏 | 保留 NATS，不新增無 NATS 模式。 | 所有站點一致的生產 binding。 | 至少十角色而非全站三 process；一屏成本可能不值得。 |
| N-02 | 站內 mTLS；(c) inspection profile 可 TLS + 應用雙向身分，僅經明確核准。 | 有條件支援 outbound proxy。 | 對 proxy 的機密性未提供；需保密而無 bypass 即阻塞。 |
| M-04/F-18 | raw、parser、issuer、資料卷分離，VLAN 工件不可省。 | 重用 MQTT parser，同時限制破壞範圍。 | 不能保證抵抗 host/kernel compromise；沒有網路隔離即不交付。 |
| 下行 pull 偏好 | unit/leaf 用長連線提示，owner 批次重讀；ERP 不在交易內遠呼。 | 低延遲提示及扇出。 | 仍有重連風暴、keepalive 與代理成本，沒有「自然消失」。 |
| 每個節點自建 | bridge 傳輸/投影採外部 server，語意與授權由 node 控制。 | 不自製 broker。 | 不再承諾薄 agent 或免費安全。 |
| R5/T1 MQTT 5 | 以能力矩陣觸發替換 ingress，不以版號為唯一門檻。 | 原廠 topic/metadata 可有明確接法。 | Mosquitto/client 增量、每型號驗收。 |
| R5/HMI QoS | JSON HMI 與完整 Sparkplug 分 profile。 | 正常化本地資料，不繞 WAN。 | generic MQTT 不等於現成 Sparkplug HMI；未驗 profile 不售。 |
| F-46/F-47/F-51 | 有界重讀與防重；缺執行證據保留 unknown。 | 不把傳輸成功冒稱物理完成。 | 媒體毀損、期限外結果可失；任意實體 exactly-once 不承諾。 |
| N-09/N-04 | 還原需 fresh grant、epoch 與對帳，不是複製目錄即上線。 | 擋舊命令與 prod staging 複本。 | 停機、人工介入、獨立秘密保管及 gap 記錄。 |
| N-11 與立即撤銷 | 斷鏈保留既有行為，5 分鐘後停止新授權工作。 | 不無限信任陳舊鏡像。 | 離線新命令可用性讓位安全；原「立即」改為在線/離線兩個有界契約。 |
| 原「無妥協」列 | F-21/F-41 保留 outbound/ERP queue owner；F-33/N-05 補交易與單一權威。 | 身分不綁地址，業務控制仍屬 ERP。 | N-04、N-11 不再列無條件成立；(c) 仍須網路 profile 實測。 |

## 7. 修訂原 §8、§9：OTA、相容性與成本

release owner 在隔離建置流程封存來源、BOM、hash 與支援矩陣，由獨立發布鍵簽 manifest；SBOM 或 checksum 不能證明來源真實，upstream release signature 有無仍未查證。bridge updater 先經 outbound 文件路徑下載完整候選，驗環境、硬體、hash、版本及最低安全版本，再停收新工作、保存一致狀態、切換。worker 不依賴正在升級的 leaf 存活，已快取的回復包與健康判定必須可本地執行。

採 A/B bundle 與整機映像策略，不在現場臨時安裝第二 Python。健康門含本地授權拒絕、CQ 持久讀寫、重啟與對帳，不只是 socket 開了；先單一 canary，再小批再全站，actual 回報每件版本。重新開放寫入後不得倒回舊 store snapshot；只能使用相容資料回滾 binary，或走 §4 的還原隔離。若舊版低於安全底線，保持隔離而不回滾到已禁用版。OS/bootloader 更新亦要斷電恢復證據，不能只驗 nats-server。

應用協定帶 major/minor、required_features、schema_rev；僅支援當前與前一個已驗 major，過渡窗口定 12 個月，安全修補可提前縮短。未知必要功能拒絕，不忽略；移除舊版前盤點每台 applied 與失聯處置。server/client 相容性只認精確測過的矩陣，包含 hub 新/leaf 舊及反向、混版 ACK/ACL、三層 leaf、restore。父先升是預設順序，不是相容證明；[N21](../../10-facts/nats.md#L41)的 normally two series 不是十二個月契約。

| 共用成本包 | 首客 (b)：三屏、五感測器的完整重估 | 責任與時鐘 |
|---|---|---|
| W1 信任/registry/隔離 | 6-8 人週 | 安全 owner；製造、輪替、撤銷與秘密路徑 |
| W2 語意/同步/還原 | 7-10 人週 | 正確性 owner；backend 故障點與 owner 對帳 |
| W3 OTA/相容性 | 5-7 人週 | release owner；半年升級窗口及 High 處置 |
| W4 ERP/文件/Modbus/writer | 5-7 人週 | 產品 owner；版本、schema 與六類結果入口 |
| W5 部署/PoC/e2e/資源 | 4-6 人週 | 維運 owner；三形狀工件與首站驗收 |
| 合計 | 27-38 人週，取代原 19，不再加上逐 finding 的重疊估工 | 外部安全審查另 2-3 人週；其排程約 2-4 日曆週，未承包 |
| 條件增量 | (c) 3-5；D-05 管理/硬體事件 3-5；JSON HMI 首次 2-3；完整 Sparkplug 首次 6-10 人週 | 每 T1 型號、consumer、IT 驗收另依 §2；不含控制 fabric、HA 或認證費 |
| 常態維運 | 2-4 人週/年共用 release/演練，另每雲端客戶 0.5-1 人週/年 | High：24 小時分級、72 小時限制暴露入口、7 日內核准修補或繼續隔離；屬待承諾 SLA，非既有成果 |

## 8. 仍承認的弱點與阻塞

兩條原致命項 security-01、longevity-01 都已有具體設計修訂，**但尚未解除上線阻塞**：製造信任、假 parent/錯環境拒絕、離線站點更新及斷電回滾都沒有實測證據。callout、秘密交付、混版 ACL 與 proxy profile 的關鍵能力仍未查證；任一門檻失敗都不能靠改寫文件標為完成。PoC、安裝、服務啟動及硬體測試本次均未執行。

P3 此點成立：outbound leaf、獨立 domain 與 KV/stream 可減少傳輸工程；version 放 payload、unit 保留 owner 與完成不靠 ack 也都應保留。仍修不掉的是外部時鐘、一屏固定負擔、共有主機的故障域、離線撤銷延遲與任意物理 effect 的不確定性。SSD 也不是備份，長期離線加媒體毀損仍有資料缺口。

下一個採用決定只能根據上述聯合門檻、同負載資源結果及具名 T1/HMI 互通紀錄；沒有結果時，評審只能給修訂後的設計分，不能給交付分。若團隊無法承擔 27-38 人週與持續維運，或客戶要求本版無法滿足的保密、HA、標準接口或物理保證，就不採 P3；不以品牌或未做的 fallback 維持承諾。