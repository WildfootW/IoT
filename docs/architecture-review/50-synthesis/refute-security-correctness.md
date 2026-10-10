結論先講：**致命 0 條、重大 2 條。整體有條件存活，現稿尚不能判為安全與正確性契約完整成立。** 草稿已實質修好大部分原始反例；剩下的是安全狀態復原缺少可驗的新鮮度錨，以及封存後既有待送工作的撤權邊界。兩者可在原架構內修補，不需要換 transport。C-25 無法改線隔離、敏感資料強制 inspection 且禁止 bypass，則仍是明示不支援的部署，不能勾選全部錨點已滿足。

# Wave C 安全與正確性反駁

日期：2026-10-11。依 [REFUTERS security-correctness](../90-resume/wave-c-synthesis.js#L87) 與 [RESUME A.6](../RESUME.md#L138)。要求 strongest/xhigh；實際 inherited default，無模型選擇與 effort 控制，不宣稱已套用。沒有使用其他 refuter 文件、巢狀代理、網路查證或產品 PoC。

## 審查方式

先完整讀草稿，包括十五個以 `# 1.` 起算的章節、需求矩陣及全部 canonical routing rows，再檢查來源的原始反例是否仍能穿過補救。第三方資料只繼承 2026-10-10 研究，原文、摘要、推論與未查證的等級不升格。本輪新增的是文件推演及機械對帳，不是故障注入結果。下列工時亦為修補預算估計，未查證，不能當報價。

| 必讀範圍 | 完成範圍 |
|---|---|
| COMMON | 03-brief 全文、00/01/02 全文、LOG/interim 全文 |
| facts | 八份結論；mqtt-semantics、mqtt-brokers、transport-through-networks、precedents、nats、postgres-timeseries 六份全文 |
| proposals / critiques | 六份提案全文；六案各五個 lens、rebuttal、score，共 42 份全文 |
| MQTT / draft | 四份帳本全文；draft 全文 1071 行 |
| 本 lens 原始 finding | P1 18、P2 19、P3 18、P4 18、P5 19、P6 23，共 115；3 致命、112 重大 |

逐條表的「成立」只表示原失敗序列已有足以排除它的設計規則；不是產品測試通過。「縮限」表示需求被明示削弱或該 profile 不支援，不能改寫成滿足。來源標題與草稿 routing 的 ID、嚴重度、行號已逐一機械比對；下表另外給出本輪的語意裁決，避免把有連結當成有解法。

## 剩餘反例

### security-correctness-01 | 重大 | 新 epoch 沒有錨定最新撤銷內容

**情境與需求。** (a) C-25 共用 hypervisor，亦及 (b)(c) 的中央災復；D-01 被撤銷螢幕、D-05 reader 管理面。涉及 F-19、F-48、N-05、N-09 與 T2 個別撤銷要求。這不是要求 T2 抵抗任何敵意整機回捲，而是正常受控 restore 也需要的授權判準。

**失敗序列。** ERP/B0 在備份後撤銷 unit，撤銷尚未送到離線站點；兩者稍後從撤銷前、仍在三十日內的備份復原。管理復原工作站沒有回捲，仍可核發比舊值大的 epoch。照草稿先隔離、取新 epoch、按原 key/digest 對帳，都沒有提供那筆已遺失 revoke 的內容。遭撤銷者持有原合法私鑰，足以回答新 nonce；舊 registry 仍列它為 adopted。若據此發新 boot/operational grant，它取得的是新 epoch、新 lease，永久拒絕舊 epoch 並不能擋住。

**依據與裁決。** [安全狀態與 epoch 的儲存分工](draft.md#L389)、[獨立追加登錄](draft.md#L396)及[復原程序](draft.md#L398)已讀；問題不是完全沒有反回退，而是唯一明列不隨快照回捲的登錄只保證 epoch，未要求它錨定每次 revoke/adopt/權限修改的 security revision 與 digest，也未規定安全操作何時才算完成。[續期須依最新 registry](draft.md#L256)是正確目標，卻沒有讓還原者判別「這份內容確實最新」的證據。

對照 [P5/security-04](../30-critiques/P5/security.md#L46) 的跨 parent 撤銷與 [P1/correctness-10](../30-critiques/P1/correctness.md#L65) 的 owner 回退，草稿 [965](draft.md#L965)、[802](draft.md#L802) 的處置只能部分成立；[P5 答辯](../30-critiques/P5/rebuttal.md#L133)還明訂缺最新撤銷 checkpoint 禁止簽發、續期。兩個世界「備份後沒有撤銷」與「有撤銷但紀錄已失去」，在現有獨立 epoch 登錄前可呈現相同證據。失敗點在最後重新開權，不在最初隔離。

**修法與代價。** 將安全 revision、狀態 digest 及可恢復的安全 journal 錨定於既有獨立管理故障域；撤銷宣告完成前必須完成此交接。restore 必須重建至該錨，證據不足就隔離受影響身分並重新建立信任，不能依舊名冊補發新權。一般業務 RPO 可接受遺失，不可默默讓已完成撤權復活。估 1-2 人週，增加安全操作的耐久往返、斷線時管理可用性代價及恢復程序，不必增加資料庫引擎。

**可否定本 finding 的檢查。** 在相同 epoch 下，分別執行有／無 revoke 的合法歷史，再只還原 ERP/B0；修訂規格必須指出哪份未回捲的內容使兩者產生不同授權裁決。若只有取更大 epoch 或新 nonce，反例仍在；此檢查尚未執行。

### security-correctness-02 | 重大 | 封存入列入口沒有封住既有工作的再投遞

**情境與需求。** (c) WAN 中斷後恢復，D-01 已排 Apply、D-04 已受理 job，亦含待送 Manage；(a)(b) 的搬運暫停同樣成立。涉及 F-41、F-48、F-64、F-69、F-70、C-20。不是要求取消 running 的物理效果，而是禁止已封存連線送出尚未授予裝置的新工作。

**失敗序列。** 連線啟用時，ERP 合法提交 desired/SQ/outbox；B0 尚未搬運，操作員先 archive。重新連通後，[B0 主動讀 queue](draft.md#L284)及[週期反熵](draft.md#L177)仍有完整 owner 事實可搬，job 也還在原 start deadline 內。草稿唯一具名的 outbound gate 是[同交易 queue write gate](draft.md#L443)；這次沒有新入列交易，所以該 gate 不會再次執行。B0 的[獨立 scope／累積額度](draft.md#L458)仍准許此目標，而簽章信封沒有連線啟用世代。unit 的 key、sequence、lease、期限檢查全部可以通過，封存便只阻止新增 row，沒阻止新投遞。

**依據與裁決。** [F-70 routing](draft.md#L639)確實寫了 archive 阻 command/Manage，不能說它被完全漏掉；缺的是從這個要求到搬運、重試、簽新 grant 的執法邊界。[P2/correctness-01](../30-critiques/P2/correctness.md#L9)的原子受理已被 [841](draft.md#L841)修好，但耐久待辦現在會跨越撤權時點；[P4/security-05](../30-critiques/P4/security.md#L41)的授權問題也不能只靠原始 producer 身分處理。更具體的既有答案是 [P2 答辯](../30-critiques/P2/rebuttal.md#L97)「封存停止未送出命令」，及 [P4 答辯](../30-critiques/P4/rebuttal.md#L133)「每次提交與重試」都關 gate。現稿將 F-70 標滿足，卻沒有把這個差異列為妥協。

**修法與代價。** ERP 在 queue fetch／每次派送授權時，以當前 connection 狀態作交易式 gate；archive 使既有待送項保持可讀但不可派送。B0 不能用鏡像自行補發派送資格；已預取但未發送的項目須重新驗權，可用 connection epoch 綁定短效派送 grant。重新啟用不得延長原 deadline 或重造 job key。若已在途的 grant 仍容許最長五分鐘起跑，須另明列 F-70 的有界妥協，不能只寫「不取消 running」。估 1-2 人週，共用既有 queue/policy，代價是派送授權對 ERP 可達性的依賴。

**可否定本 finding 的檢查。** 在入列後、第一次 fetch 前 archive，再恢復搬運；要求零新 command/Manage 派送，且保留待辦與可觀察原因。另測預取後 archive，不得把尚未執行者一律叫 running。這是對 gate 位置的檢查，不是要求 architecture spec 已附產品 PoC。

## 草稿此點成立

1. **草稿此點成立：耐久交接及 UNKNOWN。** [ERP/outbox 與 unit inbox 的提交](draft.md#L165)、[結果與 cursor 同交易](draft.md#L168)，加上[效果不明不重跑、不換 key、不釋衝突槽](draft.md#L183)，已排除原案常見反例。F-47 沒要求 transport 提供物理 exactly-once；草稿把不可查／不可停的 job 類別禁售，是明示產品縮限，不是虛假保證。只有 backend 接受設定時也只稱 backend_confirmed，不冒稱每個像素已顯示。

2. **草稿此點成立：保留窗口彼此有實際關係。** [未確認 CQ 無 TTL、已確認至少九十日、floor 至退役](draft.md#L317)，配合[三十日 operational restore 上限](draft.md#L334)，修好原來五百筆或七天刪證據的錯誤。舊 cursor 要重取含 SQ 的快照並補 owner archive，不拿 latest 代事件史；current/LKG/applying 的媒體也有 pin。有限 telemetry spool 與整媒體 RPO 是已揭露的 F-46 縮限，不重報為偷偷丟命令。

3. **草稿此點成立：身分不再借路徑或 broker。** [簽章範圍](draft.md#L229)綁 env/tenant、unit/function、purpose、世代與 digest；session proof 不是一次 hello 永久通行。[voucher、CSR proof 及停用 bootstrap](draft.md#L246)排除初始 TOFU；過期續期只走受限 recovery，壞時間只播 LKG、受控校時，不信匿名 parent。根失陷由獨立 recovery root 處理，秘密與一般備份分流。歷史 CQ 與新命令授權亦已分開；撤銷鍵的舊證據隔離，不憑自報時間判成功。

4. **草稿此點成立：隔離與 inspection 沒有以文字消失。** [C-25 retrofit](draft.md#L294)要求實體搬接、逐埠及跨 AP／有線負向驗收，無施工權就阻塞；原 VLAN 不算已安全。[M/I profiles](draft.md#L274)明說 proxy 可讀 payload，敏感出勤與私密內容無 bypass 不支援；與 [T5](../10-facts/transport-through-networks.md#L38)的繼承研究一致。這是合法的失敗處置，不是所有客戶皆可服務。parser、issuer、writer 分 UID，staging 另有無 prod secret／grant／egress 三道限制，不單靠 archive 保護環境副本。

5. **草稿此點成立：schema 先於 datum 是屏障，不只是名稱。** 雖然 §3.1 本文較短，[D-03 啟用條件](draft.md#L488)、[F-32 矩陣](draft.md#L601)及 [P5/correctness-10 處置](draft.md#L984)合起來要求沿途耐久接受、批次攜版與品質、舊 schema 隨積壓 pin。[隔離區 TTL](draft.md#L324)亦不能刪合法未交接事件。不能因規則分散在表中便指控缺屏障。獨立事件 journal、PG 去重／dirty bucket 同交易、HMI 自行 stale，同樣已有具體規則。

## 115 條逐項核對

「routing」連至草稿的單一 canonical row；每列另指到決定行為的正文或表格。下列 01、02 指本文件新 finding，不改原始嚴重度。原安全致命三項中，P3/security-01 與 P6/security-01 的成因有設計補救；P4/security-03 的敏感 inspection 分支仍不支援。沒有把來源致命數改報成本輪新增致命數。

### P1

| canonical 來源 | 原嚴重度 | routing | 本輪裁決與具體規則 |
|---|---|---|---|
| [P1/security-01](../30-critiques/P1/security.md#L32) | 重大 | [778](draft.md#L778) | 成立：[收件者／用途／epoch](draft.md#L229)驗證。 |
| [P1/security-02](../30-critiques/P1/security.md#L40) | 重大 | [779](draft.md#L779) | 成立：[預置信任與 voucher](draft.md#L247)，不是 TOFU。 |
| [P1/security-03](../30-critiques/P1/security.md#L48) | 重大 | [780](draft.md#L780) | 成立：[CSR proof、異鍵隔離、停 bootstrap](draft.md#L246)；T2 複製風險明示。 |
| [P1/security-04](../30-critiques/P1/security.md#L56) | 重大 | [781](draft.md#L781) | 成立：[parent/root 驗來源子樹](draft.md#L236)，不信 child 自報 ACL。 |
| [P1/security-05](../30-critiques/P1/security.md#L64) | 重大 | [782](draft.md#L782) | 成立：[manifest 資產 hash](draft.md#L468)、[全媒體驗齊](draft.md#L470)才套用。 |
| [P1/security-06](../30-critiques/P1/security.md#L72) | 重大 | [783](draft.md#L783) | 縮限：[I 可見資料／敏感無 bypass 不支援](draft.md#L275)。 |
| [P1/security-07](../30-critiques/P1/security.md#L80) | 重大 | [784](draft.md#L784) | 縮限：[五分鐘 lease、正向撤銷查詢](draft.md#L259)；非離線立即撤銷。 |
| [P1/security-08](../30-critiques/P1/security.md#L88) | 重大 | [785](draft.md#L785) | 成立：[獨立 recovery 根](draft.md#L266)、[加密 secret](draft.md#L268)；安全內容 restore 另見 01。 |
| [P1/correctness-01](../30-critiques/P1/correctness.md#L11) | 重大 | [793](draft.md#L793) | 縮限：[UNKNOWN／backend keyed query](draft.md#L183)，不保物理 exactly-once。 |
| [P1/correctness-02](../30-critiques/P1/correctness.md#L17) | 重大 | [794](draft.md#L794) | 成立：[ERP commit 後 receipt](draft.md#L168)、[週期反熵](draft.md#L177)。 |
| [P1/correctness-03](../30-critiques/P1/correctness.md#L23) | 重大 | [795](draft.md#L795) | 成立：[timeout 不釋衝突槽](draft.md#L185)。 |
| [P1/correctness-04](../30-critiques/P1/correctness.md#L29) | 重大 | [796](draft.md#L796) | 成立：[observed/pending/applied 分列](draft.md#L181)。 |
| [P1/correctness-05](../30-critiques/P1/correctness.md#L35) | 重大 | [797](draft.md#L797) | 成立：[所求版本或拒絕、LKG](draft.md#L470)。 |
| [P1/correctness-06](../30-critiques/P1/correctness.md#L41) | 重大 | [798](draft.md#L798) | 成立：[schema 沿途接受才啟用](draft.md#L488)。 |
| [P1/correctness-07](../30-critiques/P1/correctness.md#L47) | 重大 | [799](draft.md#L799) | 成立：[來源 journal 與分開的 ERP/PG 交接](draft.md#L322)；MQTT ingress 前 loss 明示。 |
| [P1/correctness-08](../30-critiques/P1/correctness.md#L53) | 重大 | [800](draft.md#L800) | 成立：[未確認 pin、floor 長存](draft.md#L317)。 |
| [P1/correctness-09](../30-critiques/P1/correctness.md#L59) | 重大 | [801](draft.md#L801) | 成立：[時間品質／偏差 gate](draft.md#L340)，不把接收時間當採樣時間。 |
| [P1/correctness-10](../30-critiques/P1/correctness.md#L65) | 重大 | [802](draft.md#L802) | 部分：[新 epoch／對帳](draft.md#L398)保版本方向；撤銷內容缺錨，見 01。 |

### P2

| canonical 來源 | 原嚴重度 | routing | 本輪裁決與具體規則 |
|---|---|---|---|
| [P2/security-01](../30-critiques/P2/security.md#L17) | 重大 | [823](draft.md#L823) | 縮限：[固定 M/I，不自動降級](draft.md#L274)；保密受阻不支援。 |
| [P2/security-02](../30-critiques/P2/security.md#L27) | 重大 | [824](draft.md#L824) | 成立：[parser 分 UID/process、無樹鍵](draft.md#L426)。 |
| [P2/security-03](../30-critiques/P2/security.md#L37) | 重大 | [825](draft.md#L825) | 成立：[T2 原簽章至 root](draft.md#L236)、[unit 產鑰](draft.md#L246)。 |
| [P2/security-04](../30-critiques/P2/security.md#L47) | 重大 | [826](draft.md#L826) | 成立：[voucher 綁 serial/key/env/tenant/parent](draft.md#L247)。 |
| [P2/security-05](../30-critiques/P2/security.md#L57) | 重大 | [827](draft.md#L827) | 成立：[所有 T2/T3 停用 bootstrap](draft.md#L249)；clone 上限明示。 |
| [P2/security-06](../30-critiques/P2/security.md#L67) | 重大 | [828](draft.md#L828) | 部分：[獨立 scope／雙人 digest](draft.md#L458)封簽名機；動態 archive 見 02。 |
| [P2/security-07](../30-critiques/P2/security.md#L77) | 重大 | [829](draft.md#L829) | 成立：[record grant、目的地重驗](draft.md#L451)、[資產 hash](draft.md#L468)。 |
| [P2/security-08](../30-critiques/P2/security.md#L87) | 重大 | [830](draft.md#L830) | 縮限：[lease 與證書分離](draft.md#L259)，遲到撤銷證據不自判成功。 |
| [P2/security-09](../30-critiques/P2/security.md#L97) | 重大 | [831](draft.md#L831) | 成立：[私鑰保管](draft.md#L268)、[失陷換根](draft.md#L266)；restore 安全內容見 01。 |
| [P2/correctness-01](../30-critiques/P2/correctness.md#L9) | 重大 | [841](draft.md#L841) | 成立：[業務與 outbox 同交易](draft.md#L165)；受理後撤權另見 02。 |
| [P2/correctness-02](../30-critiques/P2/correctness.md#L15) | 重大 | [842](draft.md#L842) | 縮限：[實體歧義留 UNKNOWN](draft.md#L183)，不可核實類別禁用。 |
| [P2/correctness-03](../30-critiques/P2/correctness.md#L21) | 重大 | [843](draft.md#L843) | 成立：[CQ／floor 分離](draft.md#L317)、[admission 預留空間](draft.md#L311)。 |
| [P2/correctness-04](../30-critiques/P2/correctness.md#L27) | 重大 | [844](draft.md#L844) | 成立：[起跑驗序號／期限，timeout 保鎖](draft.md#L185)。 |
| [P2/correctness-05](../30-critiques/P2/correctness.md#L33) | 重大 | [845](draft.md#L845) | 成立：[同版 pending 可繼續、舊 worker 不倒寫](draft.md#L181)。 |
| [P2/correctness-06](../30-critiques/P2/correctness.md#L39) | 重大 | [846](draft.md#L846) | 成立：[complete 單向遺失亦週期補齊](draft.md#L177)。 |
| [P2/correctness-07](../30-critiques/P2/correctness.md#L45) | 重大 | [847](draft.md#L847) | 成立：[snapshot R／歷史回補](draft.md#L175)、[cursor 同交易](draft.md#L168)。 |
| [P2/correctness-08](../30-critiques/P2/correctness.md#L51) | 重大 | [848](draft.md#L848) | 成立：[沿途 schema 屏障](draft.md#L488)、[不可變單位／型別](draft.md#L372)。 |
| [P2/correctness-09](../30-critiques/P2/correctness.md#L57) | 重大 | [849](draft.md#L849) | 成立：[conn epoch](draft.md#L329)、[有效時間 gate](draft.md#L340)。 |
| [P2/correctness-10](../30-critiques/P2/correctness.md#L63) | 重大 | [850](draft.md#L850) | 成立：[sample 去重／dirty 同 PG 交易](draft.md#L370)。 |

### P3

| canonical 來源 | 原嚴重度 | routing | 本輪裁決與具體規則 |
|---|---|---|---|
| [P3/security-01](../30-critiques/P3/security.md#L11) | 致命 | [871](draft.md#L871) | 成因已修：[預置根／env voucher](draft.md#L247)，不是待採納時才取信任錨。 |
| [P3/security-02](../30-critiques/P3/security.md#L19) | 重大 | [872](draft.md#L872) | 替代成立：[parent 授權資源](draft.md#L175)、[unit proof](draft.md#L451)，不曝 JS API。 |
| [P3/security-03](../30-critiques/P3/security.md#L26) | 重大 | [873](draft.md#L873) | 真偽已修：[雙向簽章](draft.md#L229)；[I 機密性不提供](draft.md#L275)。 |
| [P3/security-04](../30-critiques/P3/security.md#L33) | 重大 | [874](draft.md#L874) | 成立：[bridge 同續期規則](draft.md#L255)、[staging 三道限制](draft.md#L460)。 |
| [P3/security-05](../30-critiques/P3/security.md#L40) | 重大 | [875](draft.md#L875) | 成立：[parser／issuer 分權及受限 IPC](draft.md#L422)。 |
| [P3/security-06](../30-critiques/P3/security.md#L47) | 重大 | [876](draft.md#L876) | 成立：[raw/n 配額](draft.md#L351)、[CQ 空間預留](draft.md#L311)。 |
| [P3/security-07](../30-critiques/P3/security.md#L54) | 重大 | [877](draft.md#L877) | 範圍限制：[初期每站 root，多租戶另 gate](draft.md#L609)，不靠 account 保跨客戶故障域。 |
| [P3/security-08](../30-critiques/P3/security.md#L61) | 重大 | [878](draft.md#L878) | 成立：[發布鍵／helper／簽署 bundle](draft.md#L402)；OS major/boot 現場路徑明示。 |
| [P3/correctness-01](../30-critiques/P3/correctness.md#L24) | 重大 | [887](draft.md#L887) | 成立：[ERP 原子 outbox](draft.md#L165)，CAS 不代跨庫提交。 |
| [P3/correctness-02](../30-critiques/P3/correctness.md#L28) | 重大 | [888](draft.md#L888) | 縮限：[UNKNOWN／原 key 證據](draft.md#L183)。 |
| [P3/correctness-03](../30-critiques/P3/correctness.md#L32) | 重大 | [889](draft.md#L889) | 成立：[最終 receipt](draft.md#L168)、[週期清冊對帳](draft.md#L177)。 |
| [P3/correctness-04](../30-critiques/P3/correctness.md#L36) | 重大 | [890](draft.md#L890) | 成立：[flight 持久／起跑期限／停止證據](draft.md#L185)。 |
| [P3/correctness-05](../30-critiques/P3/correctness.md#L40) | 重大 | [891](draft.md#L891) | 成立：[每版 refusal/defer/superseded](draft.md#L181)。 |
| [P3/correctness-06](../30-critiques/P3/correctness.md#L44) | 重大 | [892](draft.md#L892) | 成立：[schema 沿途接受才啟用](draft.md#L488)，不是只存 TOPOLOGY。 |
| [P3/correctness-07](../30-critiques/P3/correctness.md#L48) | 重大 | [893](draft.md#L893) | 成立：[文件完整前保留 LKG](draft.md#L470)。 |
| [P3/correctness-08](../30-critiques/P3/correctness.md#L52) | 重大 | [894](draft.md#L894) | 成立：[floor 至退役](draft.md#L321)、[restore 限窗](draft.md#L334)；不借 transport dedupe。 |
| [P3/correctness-09](../30-critiques/P3/correctness.md#L56) | 重大 | [895](draft.md#L895) | 成立：[時間品質與 uncertainty](draft.md#L340)，未來值不續命。 |
| [P3/correctness-10](../30-critiques/P3/correctness.md#L60) | 重大 | [896](draft.md#L896) | 成立：[sample/去重/dirty 原子提交](draft.md#L370)。 |

### P4

| canonical 來源 | 原嚴重度 | routing | 本輪裁決與具體規則 |
|---|---|---|---|
| [P4/security-01](../30-critiques/P4/security.md#L13) | 重大 | [915](draft.md#L915) | 替代成立：[unit/function 來源驗簽](draft.md#L236)，不是 tenant-wide gateway credential。 |
| [P4/security-02](../30-critiques/P4/security.md#L20) | 重大 | [916](draft.md#L916) | 替代成立：[更新發布鍵與 CMS 分權](draft.md#L402)、[secret resolver](draft.md#L268)。 |
| [P4/security-03](../30-critiques/P4/security.md#L27) | 致命 | [917](draft.md#L917) | 條件阻塞仍在：[敏感且禁止 bypass 不支援](draft.md#L276)，不是已全面解除。 |
| [P4/security-04](../30-critiques/P4/security.md#L34) | 重大 | [918](draft.md#L918) | 成立：[adopt 消耗 claim／停 bootstrap](draft.md#L249)；安全狀態 restore 另見 01。 |
| [P4/security-05](../30-critiques/P4/security.md#L41) | 重大 | [919](draft.md#L919) | 部分：[獨立 policy](draft.md#L458)限制多 writer；archive 派送授權見 02。 |
| [P4/security-06](../30-critiques/P4/security.md#L48) | 重大 | [920](draft.md#L920) | 成立：[staging 無 prod secrets/grant/egress](draft.md#L460)，不是先連 prod 再中和。 |
| [P4/security-07](../30-critiques/P4/security.md#L55) | 重大 | [921](draft.md#L921) | 成立：[可信 credential／隔離埠映射](draft.md#L353)、[品質不以重播續命](draft.md#L328)。 |
| [P4/security-08](../30-critiques/P4/security.md#L62) | 重大 | [922](draft.md#L922) | 範圍替代：[固定 BOM／支援 gate](draft.md#L748)，不以凍結未知舊線作安全退路。 |
| [P4/correctness-01](../30-critiques/P4/correctness.md#L7) | 重大 | [930](draft.md#L930) | 成立：[ERP 原子受理](draft.md#L165)、[同 key/digest 重送](draft.md#L192)。 |
| [P4/correctness-02](../30-critiques/P4/correctness.md#L13) | 重大 | [931](draft.md#L931) | 替代成立：[關鍵 commit 後才 receipt](draft.md#L159)；不借未採 TB 的耐久保證。 |
| [P4/correctness-03](../30-critiques/P4/correctness.md#L19) | 重大 | [932](draft.md#L932) | 縮限：[effect/CQ gap 保 UNKNOWN](draft.md#L183)。 |
| [P4/correctness-04](../30-critiques/P4/correctness.md#L25) | 重大 | [933](draft.md#L933) | 成立：[delivery 與 outcome 分離](draft.md#L203)、[backend 錯誤不假成功](draft.md#L204)。 |
| [P4/correctness-05](../30-critiques/P4/correctness.md#L31) | 重大 | [934](draft.md#L934) | 成立：[resource flight、profile version、deadline](draft.md#L185)。 |
| [P4/correctness-06](../30-critiques/P4/correctness.md#L37) | 重大 | [935](draft.md#L935) | 成立：[單一 reconcile 與同版 digest](draft.md#L181)、[所求文件版](draft.md#L470)。 |
| [P4/correctness-07](../30-critiques/P4/correctness.md#L43) | 重大 | [936](draft.md#L936) | 成立：[cursor/result 同交易](draft.md#L168)、[archive 回補](draft.md#L176)。 |
| [P4/correctness-08](../30-critiques/P4/correctness.md#L49) | 重大 | [937](draft.md#L937) | 成立：[LKG/assets pin](draft.md#L327)、[unit 狀態備份](draft.md#L390)。 |
| [P4/correctness-09](../30-critiques/P4/correctness.md#L55) | 重大 | [938](draft.md#L938) | 成立：[合法遲到只補史，不刷新 Fleet](draft.md#L336)。 |
| [P4/correctness-10](../30-critiques/P4/correctness.md#L61) | 重大 | [939](draft.md#L939) | 成立：[schema 屏障](draft.md#L488)、[空 capability 拒 effect](draft.md#L496)。 |

### P5

| canonical 來源 | 原嚴重度 | routing | 本輪裁決與具體規則 |
|---|---|---|---|
| [P5/security-01](../30-critiques/P5/security.md#L11) | 重大 | [962](draft.md#L962) | 成立：[原始來源簽章](draft.md#L236)，不以 topic 存在證明發布權。 |
| [P5/security-02](../30-critiques/P5/security.md#L23) | 重大 | [963](draft.md#L963) | 成立：[raw/n 分權／配額](draft.md#L351)，管理仍 HTTPS。 |
| [P5/security-03](../30-critiques/P5/security.md#L34) | 重大 | [964](draft.md#L964) | 成立：[逐物件及 session proof](draft.md#L229)；機密性仍依 M/I 限制。 |
| [P5/security-04](../30-critiques/P5/security.md#L46) | 重大 | [965](draft.md#L965) | 部分：[身分非 path、五分鐘 lease](draft.md#L259)已修；restore 撤銷內容見 01。 |
| [P5/security-05](../30-critiques/P5/security.md#L58) | 重大 | [966](draft.md#L966) | 成立：[voucher](draft.md#L247)、[獨立 escrow](draft.md#L395)、[staging](draft.md#L460)。 |
| [P5/security-06](../30-critiques/P5/security.md#L67) | 重大 | [967](draft.md#L967) | 成立：[record/version/hash grant 與目的地驗證](draft.md#L451)。 |
| [P5/security-07](../30-critiques/P5/security.md#L76) | 重大 | [968](draft.md#L968) | 成立：[固定可信來源映射、HMI 禁 raw](draft.md#L353)，[G-M client-id 驗收](draft.md#L745)。 |
| [P5/correctness-01](../30-critiques/P5/correctness.md#L11) | 重大 | [975](draft.md#L975) | 成立：[業務/outbox 及結果/cursor 交易](draft.md#L165)。 |
| [P5/correctness-02](../30-critiques/P5/correctness.md#L17) | 重大 | [976](draft.md#L976) | 縮限：[原子 claim 不等於物理完成](draft.md#L183)。 |
| [P5/correctness-03](../30-critiques/P5/correctness.md#L23) | 重大 | [977](draft.md#L977) | 成立：[parent commit／ERP 最終 receipt](draft.md#L167)，不依 PUBACK。 |
| [P5/correctness-04](../30-critiques/P5/correctness.md#L31) | 重大 | [978](draft.md#L978) | 成立：[snapshot 含 SQ/CQ/events/revocation](draft.md#L175)，八天 cursor 不只取 desired。 |
| [P5/correctness-05](../30-critiques/P5/correctness.md#L37) | 重大 | [979](draft.md#L979) | 成立：[timeout 保鎖／late result 追加](draft.md#L185)。 |
| [P5/correctness-06](../30-critiques/P5/correctness.md#L43) | 重大 | [980](draft.md#L980) | 成立：[未確認 CQ pin／floor 長存](draft.md#L317)，[最長 start deadline](draft.md#L316)。 |
| [P5/correctness-07](../30-critiques/P5/correctness.md#L49) | 重大 | [981](draft.md#L981) | 部分：[epoch/digest/對帳](draft.md#L398)處理同版異值；授權內容反回退見 01。 |
| [P5/correctness-08](../30-critiques/P5/correctness.md#L55) | 重大 | [982](draft.md#L982) | 成立：[pending 同版可恢復](draft.md#L181)、[完整文件才切](draft.md#L470)。 |
| [P5/correctness-09](../30-critiques/P5/correctness.md#L61) | 重大 | [983](draft.md#L983) | 成立：[時間品質／boot／sample_seq](draft.md#L340)。 |
| [P5/correctness-10](../30-critiques/P5/correctness.md#L67) | 重大 | [984](draft.md#L984) | 成立：[schema 屏障及舊版排空](draft.md#L601)、[合法資料不能按隔離 TTL 刪](draft.md#L324)。 |
| [P5/correctness-11](../30-critiques/P5/correctness.md#L73) | 重大 | [985](draft.md#L985) | 成立：[PG 去重/rows/dirty 同交易](draft.md#L370)。 |
| [P5/correctness-12](../30-critiques/P5/correctness.md#L79) | 重大 | [986](draft.md#L986) | 成立：[獨立事件 owner/journal](draft.md#L320)，CQ 配 SQ 不阻自發事件。 |

### P6

| canonical 來源 | 原嚴重度 | routing | 本輪裁決與具體規則 |
|---|---|---|---|
| [P6/security-01](../30-critiques/P6/security.md#L28) | 致命 | [1007](draft.md#L1007) | 成因已修：[公鑰與原始來源 proof](draft.md#L236)、[驗權前零業務寫入](draft.md#L738)，不是離線盲收。 |
| [P6/security-02](../30-critiques/P6/security.md#L42) | 重大 | [1008](draft.md#L1008) | 成立：[端到端物件與五分鐘新授權](draft.md#L259)，rogue parent 不能永久發命令。 |
| [P6/security-03](../30-critiques/P6/security.md#L52) | 重大 | [1009](draft.md#L1009) | 成立：[上級簽 trust set／獨立 recovery 根](draft.md#L266)。 |
| [P6/security-04](../30-critiques/P6/security.md#L62) | 重大 | [1010](draft.md#L1010) | 成立：[管理與業務 writer 分開](draft.md#L158)、[獨立權限核准](draft.md#L458)。 |
| [P6/security-05](../30-critiques/P6/security.md#L72) | 重大 | [1011](draft.md#L1011) | 成立：[只交 CSR/public cert、丟回應可重讀](draft.md#L246)，非一次性 secret pickup。 |
| [P6/security-06](../30-critiques/P6/security.md#L82) | 重大 | [1012](draft.md#L1012) | 縮限：[I 不傳 bearer/私密資料](draft.md#L275)，不以簽章冒稱保密。 |
| [P6/security-07](../30-critiques/P6/security.md#L92) | 重大 | [1013](draft.md#L1013) | 條件成立：[C-25 實體隔離島](draft.md#L294)；原 VLAN 不動則明示阻塞。 |
| [P6/security-08](../30-critiques/P6/security.md#L102) | 重大 | [1014](draft.md#L1014) | 成立：[只有 north writer 持 history credential](draft.md#L427)。 |
| [P6/security-09](../30-critiques/P6/security.md#L112) | 重大 | [1015](draft.md#L1015) | 成立：[文件目的地／逐 record 授權](draft.md#L451)、[publisher scope](draft.md#L458)。 |
| [P6/security-10](../30-critiques/P6/security.md#L122) | 重大 | [1016](draft.md#L1016) | 成立：[claim/key 綁定](draft.md#L249)、[歷史／已撤鍵分判](draft.md#L237)；restore 仍見 01。 |
| [P6/correctness-01](../30-critiques/P6/correctness.md#L9) | 重大 | [1024](draft.md#L1024) | 成立：[unit inbox commit 才交接](draft.md#L167)，fetch 不刪 SQ。 |
| [P6/correctness-02](../30-critiques/P6/correctness.md#L15) | 重大 | [1025](draft.md#L1025) | 成立：[先 CQ，再 ERP 交易 receipt](draft.md#L168)、[週期補讀](draft.md#L177)。 |
| [P6/correctness-03](../30-critiques/P6/correctness.md#L21) | 重大 | [1026](draft.md#L1026) | 縮限：[executing 無結果為 UNKNOWN](draft.md#L183)，無法核實不售該 job。 |
| [P6/correctness-04](../30-critiques/P6/correctness.md#L27) | 重大 | [1027](draft.md#L1027) | 成立：[起跑期限與 unknown 保鎖](draft.md#L185)、[expired 尚未開始才拒絕](draft.md#L316)。 |
| [P6/correctness-05](../30-critiques/P6/correctness.md#L33) | 重大 | [1028](draft.md#L1028) | 成立：[容量先停 admission](draft.md#L311)、[floor 不隨詳細結果刪](draft.md#L321)。 |
| [P6/correctness-06](../30-critiques/P6/correctness.md#L39) | 重大 | [1029](draft.md#L1029) | 成立：[指定版本或拒絕、hash 比對](draft.md#L470)。 |
| [P6/correctness-07](../30-critiques/P6/correctness.md#L45) | 重大 | [1030](draft.md#L1030) | 成立：[seen/applied 分開、啟動重讀 backend](draft.md#L181)。 |
| [P6/correctness-08](../30-critiques/P6/correctness.md#L51) | 重大 | [1031](draft.md#L1031) | 成立：[失準不 fresh、補傳不刷新存活](draft.md#L336)。 |
| [P6/correctness-09](../30-critiques/P6/correctness.md#L57) | 重大 | [1032](draft.md#L1032) | 成立：[schema activation／舊版排空](draft.md#L601)、[空能力拒絕](draft.md#L496)。 |
| [P6/correctness-10](../30-critiques/P6/correctness.md#L63) | 重大 | [1033](draft.md#L1033) | 成立：[樣本等 PG commit，不借 ERP 水位](draft.md#L169)。 |
| [P6/correctness-11](../30-critiques/P6/correctness.md#L69) | 重大 | [1034](draft.md#L1034) | 成立：[三年內合法遲到重算](draft.md#L372)、[dirty 清完才刪 raw](draft.md#L333)。 |
| [P6/correctness-12](../30-critiques/P6/correctness.md#L75) | 重大 | [1035](draft.md#L1035) | 成立：[來源持久 transition/event_id](draft.md#L380)，不是 latest 推論離線越線。 |
| [P6/correctness-13](../30-critiques/P6/correctness.md#L81) | 重大 | [1036](draft.md#L1036) | 成立：[逐 metric age/stale](draft.md#L519)，PLC 停而 broker 活仍失鮮。 |

## 最終裁決

**有條件存活；現稿的完整成立判定為否。** 修訂者應先補安全 checkpoint 的提交／復原判準與每次派送的 archive gate，再保留既有 owner、UNKNOWN、schema 與隔離設計。不能為求可用而把失去的撤銷紀錄當「沒有撤銷」，也不能把耐久待辦當永久授權。

O-01/O-02/O-03/O-05/O-10 的取捨必須由 owner 實際核准，尤其 C-25 施工及 inspection 不支援組合；批准測試預算不等於改掉情境錨點。產品測試與外審仍待執行，但不是本文件兩條 finding 的成立理由。若修訂後能以具體規則排除上述兩個失敗序列，沒有理由僅因採自有 HTTPS 契約就全面推翻骨架。