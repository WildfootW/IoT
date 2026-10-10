結論先講：**致命 0 條、重大 3 條、次要 1 條。** 現稿在本 lens 下整體尚不成立，並非 HTTPS/MQTT 選錯，而是原始來源、離線讀者與停送命令的授權交接仍未閉合。P2 骨架可以保留；不以未執行 PoC 本身判錯，也不要求它支援已明確排除的強制 inspection 保密組合或門鎖控制。

# 生態、成本與 ERP 邊界獨立反駁

審查日：2026-10-11。已完整閱讀 COMMON 的 66 份材料及草稿，共 67 份，八份 facts 亦讀全文；另讀角色腳本與 A.6，未讀其他 refuter。host inherited default，未指定 effort，不宣稱 strongest/xhigh。以下反例與工時是審查推論，不是實測；第三方資訊只引用既有 2026-10-10 facts，摘要及未查證不升格，本輪無網查。

## Findings

### ecosystem-cost-erp-01 | 重大 | raw 的來源身分沒有交到 validator

情境：(b)(c)，D-03/D-06；M-04、F-18、F-22、F-31、N-05。假設兩台封閉 T1 各有獨立 credential、已完成網路隔離，但都只能發同一 vendor topic。這不是共用密碼或匿名裝置反例。斷點在共享 raw broker 對 validator 交付資料時：[草稿 §6](draft.md#L353)要求「以可信 credential/隔離埠映射」，卻沒有定義 broker 已驗證的來源如何隨這筆資料交接。

只以 topic 查表，兩個來源便無法區分；採信 payload 自報 id，又失去歸屬保證。草稿已有逐埠隔離或拒收的退路，但須把隔離入口綁到應用可驗的來源，不能把 L2 隔離當作已完成訊息映射。[P5/security-01](../30-critiques/P5/security.md#L11)已問過同一邊界；其中 PUBLISH 欄位的規格斷言仍屬未查證，本項不將它升格。可引用的 [broker 第 7 項](../10-facts/mqtt-brokers.md#L28)證明的是 ACL 工具，不是已存在的來源封裝接口。[G-M](draft.md#L745)的「來源不可冒名」是驗收目標，不是傳遞來源身分的方法；若定稿已選擇可信入口封裝，這條反例即應撤回。

修法：選定能保留可信入口的隔離 feed，或由受控 broker adapter 按認證身分重寫至不可冒名的 namespace，再交 bounded IPC；不得要求 T1 簽自家信封。若首版只支援唯一 topic，明列限制並拒絕碰撞，不能泛稱已解 fixed-topic 接入。判別案例是兩個來源同 topic、同 payload，仍可正確歸屬，且一方不能指定另一方。估共用接口 1～2 人週；每型號、額外 broker 實例及 plugin 授權/修補另算，與 G-M 去重計帳。

### ecosystem-cost-erp-02 | 重大 | 八小時讀 lease 尚未形成離線登入契約

情境：(b)(c)，D-06；N-03、N-09、N-11、F-04。先讓 bridge 與 PLC 正常運作，WAN 斷一小時後開全新 browser，沒有既有 session。斷點不是取樣或載頁：[草稿 §10.6](draft.md#L518)已預置頁面並承諾登入不靠 WAN；但誰驗證這名讀者、從哪份本地資料取得 line/function/field 權限，尚無 owner。八小時 TTL 只規定多久，沒有提供登入材料。

[保留表](draft.md#L330)有 HMI 讀 lease，[狀態/備份表](draft.md#L386)卻未指定 consumer directory、離線核准快照及本地 session 發行權；不能拿 unit/site 憑證替讀者登入。若每次新登入都從 now 重發八小時，離線撤銷窗口可被無限延長；若只允許既有 browser lease，則冷 browser 無法使用。這不是要求永久離線，[P2 答辯](../30-critiques/P2/rebuttal.md#L148)本就限定「預授權」，[P2/ecosystem-04](../30-critiques/P2/ecosystem.md#L25)要求的也是完整離線登入。

修法：bridge 持有管理端簽署、固定絕對 not_after 的讀者授權快照與本地驗證材料，限定資料 scope；新 session 不得越過該截止時間，重登入/重啟不得續命。把同步、撤銷、secret 保管及 restore 納入 owner 表；未預授權讀者拒絕，UI 明示限制。以新 browser、越線讀取與反覆登入越過截止時間判別。估 1～2 人週，核對是否已含 G-H 的 3～5；仍需每 consumer 聯測，不新增通用 IAM 平台。

### ecosystem-cost-erp-03 | 重大 | archive 停住新增工作，未封住既有 outbox

情境：(a)(b)(c)，D-01/D-04，亦含 D-05 的 Manage；F-41、F-46、F-69～F-71、C-20。先提交 Apply/SQ 或 pending Manage，B0 尚未取件；接著 archive connection；最後 B0 重連取件。斷點在 archive 後的取件：依 [草稿 §9](draft.md#L443)的「同交易 queue write gate；archive 阻新 command/Manage」，新增會被擋，既有已提交項卻沒有明定停止送出的檢查點。queue 本來就要跨停機保存，不能推論關掉 admission 就會取消搬運。

這是 F-70 的「no command or Manage goes out」，不是要求取消已開始的 worker。[P2 答辯](../30-critiques/P2/rebuttal.md#L97)明寫封存停止未送出命令，草稿縮寫丟了這條區別；[需求原文](../00-requirements.md#L166)也沒有把 kill switch 限於新增。staging 無金鑰與封 egress 成立，但不能替正常 production archive 背書。

修法：定義 archive 與送出的線性化點；ERP 取件/重試都檢查當前 connection generation，禁止舊批次取得新的送出資格。若 B0 已持有未送出的批次，須明訂 stopping 到 archived 的確認流程，未確認不可顯示停送完成；使用者交易只寫本地意圖，確認在交易外搬運，不能恢復遠端交易。保留原 key、CQ 回傳與結果重讀，不以 archive 刪證據或取消 running。用上述未取件序列及預取批次競態判別。估 1～2 人週 ERP/B0 共用修補，納 G-C/G-D。

### ecosystem-cost-erp-04 | 次要 | 已有預算，但還不是全角色的交付成本

情境：(a) 首屏續到 (b)(c) D-03/D-06；M-02、M-05、M-06、N-18、C-20。斷點在核准 O-09 人力後安排首站驗收：[草稿成本表](draft.md#L762)的 27～41 人週及每站 0.5～1.5，沒有把 owner IT、partner、採購與客戶驗收的投入分別列清。IT 等待已明確排除，不能指控暗藏等待；但等待日曆與準備點表、資安問卷、變更申請、聯測的人週不是同一件事。

年度 6～10 已含 ERP 遷移 2～4，這點成立，不應重加。要補的是範圍：CMS/ORM、outbox/inbox、真實 route 的 403/409/503、安裝與模組發現、權限/翻譯、staging/restore 都要由 ERP owner 驗收；wire/registry 移出 Odoo 沒讓這些消失。[P2/longevity-07](../30-critiques/P2/longevity.md#L59)是成本依據，「Odoo 每年必須升大版」仍未查證，不據此硬算十次遷移。

修法：保留開發估額，另列全角色工時與不可控等待；缺資料先標未估，不編假總額。增列估工工作本身 0.5 人週；IT/partner 工時須各自確認，不能憑空設上限。G-L 已要求逐 artifact 授權與修補來源，並非漏掉法律 gate；採購人仍需取得映像、codec/HMI 使用權、下游義務、年度維護費與客戶 acceptance 文件。[MQ26](../10-facts/mqtt-semantics.md#L63)、[MQ28](../10-facts/mqtt-semantics.md#L70)仍有工具維護缺口，[T3](../10-facts/buy-options.md#L26)、[T6](../10-facts/buy-options.md#L29)也不支持「付費即違 M-05」。本項不據未量工時推翻設計。

## MQTT 的實得與界線

A 是第三方工具接入，B 是 hostile T1 成熟入口。草稿買回的是條件式接點，不是所有設備/SCADA 的即插即用；沒有宣稱測過這些 profile，應維持此措辭。以下把尚需定稿的配置與已成立的選擇分開，未另加 finding。

| Profile | 實得、delivery owner 與支援邊界 |
|---|---|
| 普通 T1 ingress | raw 與 n 並存才雙實例，parser 不持樹/ERP 鍵；B 的方向成立。每型號要定 QoS、session、來源映射，不能由 8883 推認證品質；來源歸屬仍受 -01 阻擋。broker ACK 不代替 validator journal commit；交接前 loss 已明示，不重報成 F-46 違反。[草稿](draft.md#L351)、[MQ10](../10-facts/mqtt-semantics.md#L42)、[MQ11](../10-facts/mqtt-semantics.md#L43)。 |
| 普通 curated export | node 擁有逐 metric view；retained 可重建且有晚加入價值，既有 HMI 自算 age/quality。A 的通用 MQTT 搬運成立，schema/倍率/單位仍需 adapter；歷史走 PG/授權 API，不把 live-only 冒充 replay。QoS/斷線補齊須逐 consumer 定稿，本地登入受 -02 限制。[草稿](draft.md#L355)、[MQ9](../10-facts/mqtt-semantics.md#L36)。 |
| Sparkplug ingress/egress | 已分 Host/Edge Node，STATE、完整 BIRTH、alias、seq/bdSeq、DEATH 及受限 Rebirth，方向成立。應落成明確配置：BIRTH/NDATA/NCMD QoS 0、不 retain；NDEATH Will QoS 1、不 retain；Host STATE QoS 1、retain；Clean Session，或 Clean Start + Expiry 0。唯讀是禁止製程寫值，不應封死授權 Host 的 STATE/診斷路徑；草稿已給例外，不指控它全面禁 NCMD。[草稿](draft.md#L361)、[MQ19](../10-facts/mqtt-semantics.md#L66)、[MQ20](../10-facts/mqtt-semantics.md#L67)、[MQ21](../10-facts/mqtt-semantics.md#L68)。具名 HMI/plugin 互通未查證。 |
| 客供 broker / unit hop | 缺 dynsec 或 outbound bridge 不妨礙核准 export；它不能因此取得 adopt 權。unit 留 HTTPS，第二 binding 必與相同 broker/schema/隔離/HMI 基線比較；工具整合工時可觸發重評，不只 fan-in。此點成立。[草稿](draft.md#L364)、[LEDGER-11](../40-mqtt-ledger/ledger-review.md#L25)。 |

## 草稿此點成立

1. **草稿此點成立：ERP 交易與 owner 正確。** [§3.1](draft.md#L165)把業務及 outbox/SQ 同一個本地 transaction 提交，交易外才遠呼，不違 C-20；不能拿底稿「交易外 enqueue」的字面要求反過來製造雙寫空窗。ERP 保留 desired、SQ、scheduler；B0 持 registry/binding，先 commit 才建 managed projection，pending 意圖不是第二個 binding writer，符合 F-33/F-41/N-05。

2. **草稿此點成立：D-05 事件不是控制面。** [§10.5](draft.md#L505)排除卡權、開門排程、門狀態、lock/wipe，非控制 config 有 actual；事件另有來源 log、id/seq 與 ERP receipt。不能因沒有鎖控制判失敗。F-67 inbound 兩日只清已交接資料，[三年結果/事件 archive](draft.md#L319)與未確認無 TTL 分開，410 還有 owner archive 回補，沒有重犯只剩 latest 的錯誤。

3. **草稿此點成立：文件 route 仍逐 record 授權。** [§9](draft.md#L446)的 CMS token 留在 B0 到 origin，unit 用 grant/proof，綁 record/version/hash/引用；不借 hub token，也不把 token 放 desired。F-59/F-72 機制變更已明示；allowlist、DNS/redirect 重驗與敏感文件 lease 保留了保護，不要求回到 C-24 的 device 直連 ERP。

4. **草稿此點成立：D-06 終於有本地來源及 SLO。** [§10.6](draft.md#L516)明選授權點表或指定 UA Client/Server，上傳前分流，連全 T2 也有本地 producer；250ms snapshot、刺激至畫面 p95/p99 與三秒 stale 是可否定的設計值，不是 LAN RTT 宣傳。PLC 資料未取得已列阻塞，並未假設機台自帶 HMI；-02 針對授權交接，不否定其採樣或介面方向。

## 同分與借用

[P2](../30-critiques/P2/score.md#L1)、[P6](../30-critiques/P6/score.md#L1)答辯後同為 56；[草稿](draft.md#L3)以完整樹、各層 consumer 與 registry 為選 P2 的理由，且保留 P6 首用 gate，不是虛構排名。P6 仍有較深 relay 限制，這個 tie-break 可辯護；27～41 不能與原九人週或含感測歷史的 P2 40～60 直接相減。六案共 18 個 steal-worthy 的實質核對如下。

| 來源 | 想法 | 草稿落點與本 lens 裁決 |
|---|---|---|
| [P1 score](../30-critiques/P1/score.md#L1) | owner/cache 分離 | §3.1/§5.2 以 ERP/PG commit receipt 接管、未確認 pin，非靠 retained；已採。 |
| P1 | 分層存活/新鮮度 | §5.2 的 conn epoch、來源時間、quality 與逐點 age；不把 Will 當量測健康；已採。 |
| P1 | 隔離後生態入口 | §6 raw/n 配額及 Rebirth 範圍已採，來源交接仍欠 -01，不能以雙 process 自證完整。 |
| [P2 score](../30-critiques/P2/score.md#L1) | 耐久交接 | §3.1/§5.2 的固定 key、反熵、最終 receipt、dedupe floor；已採，archive 不得刪掉它們。 |
| P2 | 身分/操作授權分開 | §4 的 cert 與五分鐘 lease、獨立 policy；已採，HMI 的額外讀權仍須 -02。 |
| P2 | MQTT 實需觸發 | §6/§13 的 T-a/T-b/T-c、curated 契約與固定 profile gate；已採，沒有自製 parser 退路。 |
| [P3 score](../30-critiques/P3/score.md#L1) | 本地資料島 | §10.6 在 north 前分流，WAN 不在 HMI 資料路徑；已借用功能，不必連 JetStream 一起買。 |
| P3 | 業務版本不借 transport revision | §3.1 由 ERP 持業務 revision，epoch/digest 對帳；已採，沒有用 cursor 當業務版本。 |
| P3 | 受限可替換入口 | §6 保留 vendor mapping 與公開投影、不曝 JS API；已採方向，-01 是落地所欠接口。 |
| [P4 score](../30-critiques/P4/score.md#L1) | HMI/業務/分析分流 | §7/§10.6 本地畫面、ERP 事件、PG/Grafana 各有職責；已採，不把低延遲與三年查詢混作一條路。 |
| P4 | decoder 重用而不交權 | §9/§10.3 成熟 decoder 在低權限 process，writer 留 north；已採，授權與維護仍走 G-L。 |
| P4 | 平台是鏡像/副本 | 本稿不選 TB；§3/§7.2 的 owner/鏡像及 §15 O-08 的商約重評保留此原則，非把平台可買的服務端能力說成不存在。 |
| [P5 score](../30-critiques/P5/score.md#L1) | A/B 分帳及共用 oracle | §3.3 memory/HTTPS 共用契約，§14 G-X 才啟第二 binding；已採，A 有工時而非免費。 |
| P5 | HTTPS 管理獨立 | §5/§6 broker 不載管理權威且可停止 raw；已採，不能藉資料 export 擴大成控制通道。 |
| P5 | fleet 證據退出 | §13 全 fleet 已遷移、失聯已處置、90 日零依賴後才刪；已採，沒有兩個 release 即刪的捷徑。 |
| [P6 score](../30-critiques/P6/score.md#L1) | 能力觸發與首用 gate | §13 把 history、jobs、HMI 分期，安全/恢復先付；已採，不用拒絕驗收偷降首屏成本。 |
| P6 | 薄 H0 保留 CMS/display | §2/§9 保留 Odoo 業務與 reconcile，device 不直達 ERP；較深樹先驗不先部署，保留其減少首期部署的價值。 |
| P6 | 未知副作用不可淘汰 | §3.2/§5.2 UNKNOWN 保鎖、不能換 key 重跑、滿額停新工作；已採，物理 exactly-once 不虛報。 |

## 整體裁決

**survives = false，限於現稿的完整交付契約；不是淘汰 P2 骨架。** 三條重大都指出具體資訊或授權跨邊界時少掉的規則，可局部修復；其餘 MQTT 配置、客戶接口、授權與工時仍維持條件式承諾。修訂應先閉合這三處，再按既定 gates 驗收，不能只在處置表把「設計修補」改成「已解」。本輪只驗本文件的 ID、數量、連結、行錨、篇幅及編輯器 diagnostics，不將文件檢查稱作產品或網路驗證。