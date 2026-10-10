# MQTT 帳本獨立覆核

## 0. 結論先講：直接回答 owner 的問題

**結論先講：修正。** 第一版採 HTTPS、在需求出現時加南向 MQTT，是合理的產品選擇，不是已證明的協定優劣。帳本有反 MQTT 的論證傾斜：把 P1 全樹部署的成本算到所有用法，卻把自建串流當成已交付、把南向投影的成本縮成一個 runtime。不能據此推斷主審動機。retained 的 last-value 與晚加入者快取是真收益；不用 MQTT 主要買到較少的生產配置，而非免費的正確性或必然穿網能力。P0 的 owner 與完成判定，此點成立；不由傳輸 ack 推論完成，適用兩案。

覆核日期：2026-10-11。依 [../90-resume/ledger-review.js](../90-resume/ledger-review.js) 與 [../RESUME.md](../RESUME.md) A.4；指定底稿、五份 facts、三份辯論稿、六案及十二份 baseline security/longevity 均已讀，未使用並行新稿。[主審代寫紀錄](../LOG.md#L12)與 [interim 自述](../50-synthesis/interim.md#L3)只作背景，不構成獨立佐證。以下裁決是意見；來源沿用 **2026-10-10 的本地查核紀錄**，不是本日網路重查。原標摘要、推論、未查證者不升格為已確認事實。請求為 strongest/xhigh；實際僅 host inherited default，無 effort 控制，未宣稱執行期強制。

## 1. 帳本

「同意」保留主要判斷；「修正」保留方向但改依據、範圍或成本；「不同意」撤回核心判決。只計以下二十一列：**同意 3、不同意 4、修正 14**，不是方案勝負票數。原表把穿網、雙路徑、審查與維運分列，彼此相關；不能將列數代替 R1～R8 權重，也不能拿沒有第三方消費者的最小螢幕部署，消去 D-06 的既知需求。

| ID | 原列／項目 | 裁決 | 覆核理由與依據 |
|---|---|---|---|
| LEDGER-01 | 1. 第 N 個消費者扇出 | 修正 | 站內 MQTT 有接入優勢，但不是每個消費者只加 ACL 就零工時；仍有 schema、授權與新鮮度整合。自建 list/watch 也不是免費。跨網路 API 必勝未證實；[F-49 對照](../10-facts/mqtt-semantics.md#L135)、[e17](../10-facts/precedents.md#L44)。 |
| LEDGER-02 | 2. retained 的 late-joiner 語意 | 不同意 | 撤回「不用勝／負資產」。單一 writer、版本化 payload、可重建快取可服務 D-01、D-06，不須充當 owner 才有用；[retained 分析](../10-facts/mqtt-semantics.md#L76)、[P1 register](../20-proposals/P1-mqtt-native.md#L135)。 |
| LEDGER-03 | 3. last-will 離線偵測 | 修正 | F-27 不能以 Will 取代裝置時間，但標準化斷線提示仍省工程。1.5 倍是 keepalive 逾時窗口，不是所有 Will 的固定延遲；還有 Session/Will Delay 交互。HTTPS 等效是設計，非實測；[MQ8](../10-facts/mqtt-semantics.md#L35)、[MQ3，摘要](../10-facts/mqtt-semantics.md#L30)、[MQ21](../10-facts/mqtt-semantics.md#L68)。 |
| LEDGER-04 | 4. T1 講 MQTT 的入口 | 同意 | 有實際 MQTT T1 時優先評估獨立成熟 broker，避免為封閉韌體自製子集 parser；不能把「部分可能」寫成現有大量需求。M-04 仍須隔離與守門；[候選界線](../10-facts/mqtt-brokers.md#L117)、[P2-security-02](../30-critiques/P2/security.md#L27)。 |
| LEDGER-05 | 5. D-06 現場 HMI／SCADA | 修正 | MQTT/Sparkplug 接口被客戶指定時有實益；「所有 SCADA／Ignition 都非 broker 不可」未查證。web HMI 與機台原生接口是不同交付範圍，不能直接替代既定接口；[P2 三選項](../20-proposals/P2-https-pull-defended.md#L298)、[MQ28 的未查證界線](../10-facts/mqtt-semantics.md#L70)。 |
| LEDGER-06 | 6. 事件型資料 | 修正 | D-05 的 durable event log、event_id、重讀仍必要；這不抹掉訊息投遞的自然契合。HTTPS 的 append log 也不是被迫用 register 模擬。不能用 QoS 1 宣稱不丟事件；[MQ11](../10-facts/mqtt-semantics.md#L43)、[P5 事件缺口](../20-proposals/P5-pluggable-transport.md#L280)。 |
| LEDGER-07 | 7. 連線處理成熟度 | 修正 | 站內成熟連線處理是真收益；Mosquitto bridge 的 backoff 不等於所有 unit client 都具相同行為，也不會令 HTTPS 文件及 trunk 風險整段消失；[bridge 設定](../10-facts/mqtt-brokers.md#L25)、[P1 雙傳輸](../20-proposals/P1-mqtt-native.md#L210)。 |
| LEDGER-08 | 8. CM4 fan-in | 同意 | 沒有相同硬體、負載與安全配置的量測，不能裁性能勝負。「broker 本職」不是 benchmark；[足跡缺口](../10-facts/mqtt-brokers.md#L32)、[P2 弱點](../20-proposals/P2-https-pull-defended.md#L322)。 |
| LEDGER-09 | 9. 下行延遲 | 修正 | N-15 不保證時限。long-poll 可設計成有更新立即回覆，hold 是等待上限，不必等滿才送；三者皆須量測重連、排程及 proxy 緩衝，不能只比 RTT；[P2 設計](../20-proposals/P2-https-pull-defended.md#L185)、[T13](../10-facts/transport-through-networks.md#L51)。 |
| LEDGER-10 | 10. 詞彙、招聘、IT 觀感 | 修正 | 可列 R5 定性收益，但熟悉度及問卷通過率未查證；8883 的 egress 限制不能拿來抵銷站內可讀文件與工具的價值；[T15，摘要](../10-facts/transport-through-networks.md#L58)。 |
| LEDGER-11 | 11. 標準與生態 | 不同意 | 「篩完只剩 Mosquitto」超出證據；原研究還列條件候選，且放法 A 不需 outbound bridge，不能因此排除缺 bridge 的產品。標準傳輸不等於標準 payload，但收益不歸零；[候選排序](../10-facts/mqtt-brokers.md#L117)、[HiveMQ CE 限制的證據等級](../10-facts/mqtt-brokers.md#L58)。 |
| LEDGER-12 | 12. F-46／F-47 語意 | 修正 | 核心版本、去重、結果 owner 與完成判定仍自己負責，此點成立；「不省一行／R3 零貢獻」過度。原表明列半原生快取及 F-49、F-52 契合；不能將非完整方案判成沒有工程收益；[逐條對照](../10-facts/mqtt-semantics.md#L126)。 |
| LEDGER-13 | 13. (c) trunk 存活 | 不同意 | 撤回「HTTPS 三種網路皆過」。原研究明稱評等是推論，且 WSS 也有 443 路徑。HTTPS 可作低摩擦預設，不是無條件保證；身分與保密另裁；[存活表](../10-facts/transport-through-networks.md#L149)、[T13](../10-facts/transport-through-networks.md#L51)。 |
| LEDGER-14 | 14. 單一 trunk／e2e 矩陣 | 修正 | P5 trunk 本來只有 HTTPS；三形狀各支援兩種 unit binding 才有六組配置，不等於兩條 trunk。P2 串流／long-poll 退路、放法 A 的 broker 有無也要測；[P5 binding 表](../20-proposals/P5-pluggable-transport.md#L100)、[P2 退路](../20-proposals/P2-https-pull-defended.md#L185)。 |
| LEDGER-15 | 15. 種類數與外部時鐘 | 修正 | HTTP、crypto、OS 等共同依賴不能當零；放法 A 仍需 broker 與 client library 的生命週期，雙實例不等於一個服務。舊查核不是目前支援承諾；[P2-longevity-02](../30-critiques/P2/longevity.md#L23)、[查核限制](../10-facts/mqtt-brokers.md#L138)。 |
| LEDGER-16 | 16. 安全審查面 | 不同意 | 放法 A 絕非只剩 dynsec：parser、訂閱端 payload、資源耗盡、HMI 授權與重建都在。兩條拒絕測試不能代替審查；P2 內嵌 ingress 同樣持鑰，不能免扣；[P5-security-02](../30-critiques/P5/security.md#L23)、[P2-security-02](../30-critiques/P2/security.md#L27)。 |
| LEDGER-17 | 17. 最小部署服務數 | 同意 | 以原案的中央應用服務口徑，P0/P2 兩個、P1 三個；條件式南向 MQTT 不必進最小部署。這不是包含 PG、nginx、player 的完整服務總數；[P1 配置](../20-proposals/P1-mqtt-native.md#L58)、[P6-longevity 計數](../30-critiques/P6/longevity.md#L15)。 |
| LEDGER-18 | 18. 單一 process 持樹憑證 | 修正 | 放法 A 不給 broker 上游樹權限成立；本地 TLS／ACL 管理憑證仍存在。安全取決於解析器與權限隔離，非 process 數目口號；P2 也有同類缺口；[P2-security-02](../30-critiques/P2/security.md#L27)、[P3-security-05](../30-critiques/P3/security.md#L40)。 |
| LEDGER-19 | 19. retention window 持有者 | 修正 | P1 表十項含六項 broker 參數，P2 九項範圍不同，不能相加成「九再加六」；Will 是偵測時間，queue 上限是容量。應逐事實列 owner、快取、保留與可見丟棄；[P1 原表](../20-proposals/P1-mqtt-native.md#L147)、[P2 原表](../20-proposals/P2-https-pull-defended.md#L225)。 |
| LEDGER-20 | 20. 離線 queue | 修正 | owner 保底成立，但原列漏了 ev 業務事件；retained register／per-key SQ 與 session queue 分開記帳。queue 可加速恢復，不保證執行一次，也不是一律低價值；[P1 弱點第六項](../20-proposals/P1-mqtt-native.md#L224)、[MQ11](../10-facts/mqtt-semantics.md#L43)。 |
| LEDGER-21 | 21. 人週 | 修正 | 不啟用第二 binding 可延後首筆開發；不可把首次 3～4 人週當每站重付，也不可將 P1/P2 不同交付範圍直接相減。部署、審查、維運另列；[P5 工時](../20-proposals/P5-pluggable-transport.md#L310)、[P1 工時](../20-proposals/P1-mqtt-native.md#L239)。 |

retained 的問題是如何使用，不是 last-value 本身有惡意或無用。把多個 job 結果塞同槽才會重現 C-07；單一 writer、版本與 per-key 結果可避免這種混淆。schema validation 仍由守門員負責，通過型別不代表量測真實，卻足以讓有品質標記的最新值成為有用投影。owner 留在 SQLite，也不取消快取的價值。

[MQ9](../10-facts/mqtt-semantics.md#L36)只支持「發布者現有權限被撤後不再轉送」，不支持每次憑證輪替必使 retained 消失；身分對映不變與換身分必須分測。lazy expiry 是回收時機，不是已證實會向新訂閱者送過期值；已連線 HMI 的舊畫面更不能等待刪除通知，須自行依時間與品質判 stale。[MQ12](../10-facts/mqtt-semantics.md#L44)還列 AWS retained，僅搜尋摘要、未核原文；Shadow 不以 retained 當權威，不能反證 retained 快取無益。

## 2. [02-tradeoffs.md](../02-tradeoffs.md#L5) 的 MQTT 帳單重算

**修正。** 原帳單少列成本，帳本又把部分收益歸零。以下保留九個原分項，不把不同形狀的增量混算。M-02 是正式需求，「多一種東西」不是錯誤理由；問題在有沒有對稱比較維護與生態收益，而不是替這個理由貼上最弱的標籤。

| 分項 | 裁決 | 重算與依據 |
|---|---|---|
| COST-01 扇出 | 修正 | 能力可自建，工具整合成本仍在；1～2 人週只是作者估計。[P2 consumer](../20-proposals/P2-https-pull-defended.md#L241)。 |
| COST-02 retained | 不同意 | 改為「有治理成本的快取收益」，非負資產；[retained 分析](../10-facts/mqtt-semantics.md#L76)。 |
| COST-03 last-will | 修正 | 秒級取決設定與失效路徑；現成提示有價值，兩案都要去抖及 F-27 判定；[MQ8](../10-facts/mqtt-semantics.md#L35)。 |
| COST-04 T1 普及度 | 同意 | 原來「幾乎所有廠商」未查證，須實際採購清單；[簡報錨點](../03-brief.md#L13)。 |
| COST-05 D-06 HMI | 修正 | 缺口成立；客戶接口決定 SSE、原生機台接口或 MQTT，不是先判第三選項較差；[P2 選項](../20-proposals/P2-https-pull-defended.md#L298)。 |
| COST-06 生態／通用語 | 不同意 | 不接受「供給側只剩 Mosquitto」；不需 bridging 的投影應重篩候選；[broker 候選](../10-facts/mqtt-brokers.md#L117)。 |
| COST-07 新列六項成本 | 修正 | trunk、審查、矩陣、時鐘、服務、retention 都保留，但按實際配置收費；[P5 配置](../20-proposals/P5-pluggable-transport.md#L100)、[P2 漏項](../30-critiques/P2/longevity.md#L23)。 |
| COST-08 電池／MCU 理由 | 同意 | 未被證實，不作排除 MQTT 的理由；AWS/Azure 摘要談推送與離線訊息，不能反推所有業者動機；[e03](../10-facts/precedents.md#L25)、[e08](../10-facts/precedents.md#L30)。 |
| COST-09 P0 多一種的理由 | 修正 | 是 M-02／R4 的有效成本項，但不足單獨定案；[評分準則](../03-brief.md#L40)。 |

元件與時鐘重算採增量口徑：同一 broker 的引擎與 runtime 不重複相加；process 數另記。共同底座包括 node、HTTP、crypto、SQLite、ERP/PG、OS 與部署工具；是否啟用歷史、Modbus、player 要在兩案一致。未選定完整 BOM 前，不能沿用各作者的十一到二十種總數作精確排名。以下是建議配置的計數，不是量到的足跡。

| 配置 | 裁決 | 相對無 MQTT 底座的增量 | 依據 |
|---|---|---|---|
| P2 內嵌 ingress | 修正 | 1 個 library／時鐘；原本 0 個獨立 process，修成隔離 parser 後加 1 process，非加一種語言 | [P2-security-02](../30-critiques/P2/security.md#L27) |
| 放法 A：只有入口或只有投影 | 修正 | 1 broker 種、1 process、1 client library；2 個外部元件時鐘，不是只有 broker | [P2 MQTT 消費者](../20-proposals/P2-https-pull-defended.md#L298)、[client 退路批評](../30-critiques/P5/longevity.md#L68) |
| 放法 A：raw 與 n 都需要 | 修正 | 1 broker 種、2 process、1 client library；仍是 2 個主要外部時鐘，兩組配置及資源限制 | [P5-security-02](../30-critiques/P5/security.md#L23) |
| P5 unit binding | 修正 | 上述隔離配置另將 client 部署到 unit；同一 library 不重複算種類，但 fleet 升級與混版矩陣增加 | [P5-longevity-01](../30-critiques/P5/longevity.md#L15) |
| Sparkplug 加值 | 修正 | 編解碼相依、方言測試另加；實際套件、版本與時鐘數未查證，不把它藏進「+1 runtime」 | [P2-longevity-02](../30-critiques/P2/longevity.md#L23)、[MQ28](../10-facts/mqtt-semantics.md#L70) |

工時亦須修正：[P1](../20-proposals/P1-mqtt-native.md#L239) 的十八人週已含一點五人週 PoC；其新增三到四、節省二到三，相減只能得到零到二人週估計。[P2](../20-proposals/P2-https-pull-defended.md#L365) 入口加投影是二點五到四；[P5](../20-proposals/P5-pluggable-transport.md#L310) binding 是首次三到四，審查增補另計。這些均非實測，後續每站付設定及驗收，不能重收一次性開發費；自建串流的維護、升級、外部審查也不能漏列。

## 3. MQTT 應該出現在哪些 hop

**修正。** 接受以管理樹維持權威、按站點需求部署 MQTT；不接受所有箭頭都是已驗證可行的暗示。三種形狀的每條資料路徑及旁路分裁如下。

| ID／hop／形狀 | 裁決 | 條件與依據 |
|---|---|---|
| HOP-01 bridge 0 與 ERP queue，(a)(b)(c) | 同意 | 保持 pull-down／push-up 與單一寫入入口，不需 broker；F-41、F-69、C-20，[P0 決定](../01-proposal-pcie-tree.md#L78)。 |
| HOP-02 T2 unit → bridge／bridge 0，(a)(b)(c) | 修正 | 首版 HTTPS 是保守預設，非 LAN 上 MQTT 不成立；F-21、N-13，[P5 unit 選項](../20-proposals/P5-pluggable-transport.md#L100)。 |
| HOP-03 bridge → parent／bridge 0，(b) 與堆疊 | 修正 | 可用單一 HTTPS 實作減配置；不能借 (c) proxy 證據宣稱受控 VLAN 的 MQTT 不可行；[Mosquitto bridge](../10-facts/mqtt-brokers.md#L25)。 |
| HOP-04 site bridge → cloud bridge 0，(c) | 修正 | 預設 HTTPS，測串流及短請求退路；WSS 不是協定上被排除。無 bypass 時的保密要求另見下文；[T13](../10-facts/transport-through-networks.md#L51)、[存活表](../10-facts/transport-through-networks.md#L149)。 |
| HOP-05 T1 MQTT → raw，觸發站點 | 同意 | 限定來源與 topic、publish-only；不持上游樹憑證仍成立，不能省略本地認證；[P1 隔離設計](../20-proposals/P1-mqtt-native.md#L109)。 |
| HOP-06 raw → validator → node | 修正 | payload 解析器也要低權限、限量；schema 檢查後重發不等於證明 T1 說真話，須保留來源品質；[P3-security-05](../30-critiques/P3/security.md#L40)、[P2 ingress](../20-proposals/P2-https-pull-defended.md#L159)。 |
| HOP-07 node → n 投影 → HMI 訂閱 | 修正 | retained 最新值有用；HMI 只讀正式資料、顯示 stale。raw/n 分 process 不隔共同 RAM、磁碟與 CPU，須資源隔離才可稱互不拖垮；[P5-security-02](../30-critiques/P5/security.md#L23)、[P3-security-06](../30-critiques/P3/security.md#L47)。 |
| HOP-08 D-06 edge controller → bridge | 修正 | T1 走 raw 守門，受管 T2 走其身分通道；不可把來源未分類的 controller 直接當可信資料，亦不得直訂 raw 給 HMI；[P5-security-07](../30-critiques/P5/security.md#L76)。 |
| HOP-09 bridge ↔ Modbus T1 | 同意 | vendor 協定仍由 bridge 輪詢，MQTT 不替代 D-03 backend；[P2 D-03](../20-proposals/P2-https-pull-defended.md#L288)。 |
| HOP-10 cloud consumer → consumer API | 同意 | 現行預設合理，F-03、F-30 保持 ERP 只收業務資訊；消費者授權與撤銷必測，非任意外部工具自然相容；[P2 consumer](../20-proposals/P2-https-pull-defended.md#L241)。 |
| HOP-11 announce／adopt／renew／revoke | 修正 | 權威不可交給 broker；「不綁語意」不等於「不經 MQTT」。P5 實際透過 retained 搬管理物件，需明確另選 HTTPS 或補等效保護；[P5 流程](../20-proposals/P5-pluggable-transport.md#L179)。 |
| HOP-12 unit → bridge 文件快取 → ERP | 同意 | 保留 HTTPS 文件路徑、簽名 pointer 綁內容 hash、逐 child 授權；MQTT 不會把這一條消掉；[P1 文件代價](../20-proposals/P1-mqtt-native.md#L210)、[P2-security-07](../30-critiques/P2/security.md#L77)。 |

企業 TLS interception 必須拆成連通性、雙向身分、完整性與機密性。[T1](../10-facts/transport-through-networks.md#L34) 是摘要，[T5](../10-facts/transport-through-networks.md#L38) 說明終結 TLS 的信任轉移；不能借它們宣布任何 HTTPS 自動達標。接受企業 CA 後，簽章可防偽造但 proxy 仍能讀 payload 與 bearer secret。pin 原站 TLS 金鑰會阻止攔截握手；pin 應用層簽章公鑰只解真偽，不解保密。

因此建議優先要求受控 bypass。若 N-02 要求資料亦對 proxy 保密，無 bypass 時須另有經審查的端到端加密及身分協定，否則列部署阻塞；不得以握手失敗自動放寬信任，或只換短效 token 就宣稱安全退路完成。[P2-security-01](../30-critiques/P2/security.md#L17) 已指出此缺口，interim 未解答它。

## 4. 唯一的分歧：T2 unit → bridge 要不要走 MQTT

**修正。** 這是主要部署分歧，卻不是唯一分歧，成本與 retained 評價也不同。第一版 HTTPS 可基於 N-13 與 M-02 保守選擇：文件路徑已需 HTTPS，沒有 MQTT 客戶需求時不多出一個生產 binding。P0 此點成立。但能下載文件不代表已做好串流、續接與風暴控制；站內也沒有 (c) 的 proxy 前提，所以不能寫成客觀必選。

正方最強的反例是已有 broker 的站點：共用 unit hop 可少一次投影與整合，無須先證明 HTTPS 撐不住才有資格採用。反方指出仍需文件、管理與 fallback 的 HTTP listener，也成立。尤其 raw/n 隔離後，「一個 broker 做三件事」已改變；應比較實際少掉的工作，不數抽象接口。依據是 [P5 binding](../20-proposals/P5-pluggable-transport.md#L100) 與 [longevity-05](../30-critiques/P5/longevity.md#L52)，不是偏好哪個作者。

帳本稱一兩人週「證明能補回」須撤回：提案只有估工，沒有交付或測試。[P5-security-01](../30-critiques/P5/security.md#L11) 對 PUBLISH 發布者欄位還明標未查證；可採其安全問題，不可升格其規格查核程度。若把 broker 視為不可信，node 必須驗可歸因的訊息，綁定環境、單元、資源、版本與授權；這也是多跳 HTTPS 面對不可信 bridge 的成本，不能全算 MQTT 的增量。

重開 unit binding 的觸發應含真實工具需求、整合工時與可維運性，不只 fan-in。建議同一 CM4、相同負載與安全設定比較兩案的延遲、重連恢復、資源與部署工時，再定產品門檻。綁定一生也非不可逆定律：沒有升級與遷移計畫才近似如此；HTTPS 舊版同樣會留下。可退場的證據是全 fleet 完成切換、離線裝置已有處置，不是刪除目錄。

## 5. 六份提案的 MQTT 用法評比

**修正。** 分開判 P1～P6，不把 P2/P6 合併當成已修好的放法 A。以下只裁 MQTT 用法，不冒充完整提案評分；既有批評是待核論點，不是裁決本身。

| 提案 | 裁決 | 覆核判斷與依據 |
|---|---|---|
| P1 | 修正 | 不作首版基底可辯護；「最危險」缺共同威脅尺度。全樹 broker、雙 trunk 與持鑰面須付費，但版本化 retained、per-key SQ/CQ、回灌及 presence 序號值得保留；簽章與文件缺口亦非 MQTT 獨有。[P1 語意](../20-proposals/P1-mqtt-native.md#L135)、[P1-security-01](../30-critiques/P1/security.md#L32)、[P2-security-07](../30-critiques/P2/security.md#L77)。 |
| P2 | 修正 | 南向投影位置合理，不能把內嵌 ingress 當安全完成品；還須 parser 隔離、HMI 品質標記、client library 及 proxy 實測。不是「最划算」三字即可免成本；[P2-security-02](../30-critiques/P2/security.md#L27)、[P2-longevity-02](../30-critiques/P2/longevity.md#L23)。 |
| P3 | 修正 | MQTT 3.1.1-only 與路線聲明僅依舊查核，[N11](../10-facts/nats.md#L31)。[N10](../10-facts/nats.md#L30) 的 QoS 0 限制是 NATS 發布給 MQTT 訂閱者，不能寫成所有 MQTT 投遞皆 QoS 0。已有 NATS 且需求吻合時入口仍有價值；[N7](../10-facts/nats.md#L27) 的 CAS 零件不等於裸 MQTT，advisory 多亦非未修漏洞數；[N17](../10-facts/nats.md#L37)。 |
| P4 | 修正 | gateway 的 tenant 範圍風險不是 MQTT 固有缺陷；需以實際版本驗隔離。[P4-security-01](../30-critiques/P4/security.md#L13) 有原碼來源。BSL、100 devices／1 server 只沿用 [longevity-01 的主張](../30-critiques/P4/longevity.md#L24)，本次原 LICENSE 與客戶散布適用性未查證；不可推成所有「買平台」都不可行，也不能捏造合法例外。 |
| P5 | 修正 | 接受契約與 transport 分離，(A) 仍有 [兩人週規格及測試估計](../20-proposals/P5-pluggable-transport.md#L300)，不是總成本零；(B) 須補發布歸因、管理物件隔離及遷移。只讀 HMI 不得越過 raw 守門員；[P5-security-02](../30-critiques/P5/security.md#L23)、[security-07](../30-critiques/P5/security.md#L76)。 |
| P6 | 修正 | Stage 2 按需求付費成立，但 broker 只聽 T1 介面與 HMI 所在 VLAN 尚未閉合，回灌及退出亦欠設計；不能把它直接當完善 A。[P6-security-11](../30-critiques/P6/security.md#L137)、[longevity-09](../30-critiques/P6/longevity.md#L118)。早期 token 的安全欠帳不能靠 MQTT 裁決替它免除。 |

雙方漏算都要補：正方的零行程式、零人週、免費告警及 F-04 不成立為成本證明；反方也不能用自寫最小 client 消去外部時鐘，卻不列 parser、測試與維護。站內連線成熟度、D-05 事件投遞及已有工具的整合價值，不能只以核心語意仍自建而歸零。相關依據是 [正方全文](advocate.md)、[反方全文](opponent.md) 與 [client 子集批評](../30-critiques/P5/longevity.md#L68)。

## 6. 裁決時缺的事實（需要 PoC 或再查證）

**修正：清單不完整。** 八項都保留，但補足可否定方案的條件；以下是建議驗收，不是本次已跑的 PoC。

| 原項／ID | 裁決 | 必須補的證據與判別方式 |
|---|---|---|
| GAP-01 Mosquitto arm64 足跡 | 同意 | 同一映像與負載量單／雙實例 RSS、CPU、磁碟及啟動；不得拿壓縮檔當 RSS；[足跡未查證](../10-facts/mqtt-brokers.md#L32)。 |
| GAP-02 hostile T1 資源耗盡 | 修正 | 分測未驗證 CONNECT、已驗證 session/topic 數量、慢訂閱者與回灌；不持久化仍可耗 RAM。通過條件包括 raw 故障不耗盡 node/n 的配額；[P5-security-02](../30-critiques/P5/security.md#L23)、[MQ9](../10-facts/mqtt-semantics.md#L36)。 |
| GAP-03 proxy 緩衝 | 修正 | 同測串流、短 long-poll、WSS 的 Upgrade、認證、idle、信任與保密；不能只有 nginx 模擬就稱客戶網路皆通；[T13](../10-facts/transport-through-networks.md#L51)、[T14](../10-facts/transport-through-networks.md#L57)。 |
| GAP-04 node CM4 fan-in | 同意 | 相同簽章、資料大小、客戶數、重連風暴，比 HTTPS 與 MQTT；量到不達約定 SLO 才否定配置；[P2 缺口](../20-proposals/P2-https-pull-defended.md#L322)。 |
| GAP-05 dynsec／cert username | 修正 | 除登入互動，測同身分換 cert、換身分、ACL revoke、client-id 綁定及舊 retained 回灌，分清認證與授權；[認證紀錄](../10-facts/mqtt-brokers.md#L28)、[MQ9](../10-facts/mqtt-semantics.md#L36)。 |
| GAP-06 T1／D-06 實際版本 | 修正 | 補實機清單、誰是 broker/client、QoS、retain、TLS server 驗證及 HMI 插件接口；不得用業界印象替代；[P5-security-07](../30-critiques/P5/security.md#L76)。 |
| GAP-07 Sparkplug／Tahu／plugin | 修正 | 維護與授權之外，驗 late join、BIRTH、Rebirth、斷線品質及 schema 拒收。NBIRTH/NDATA 非 retained，不能直接套普通 last-value 模型；若全禁 NCMD 會連 Rebirth 一起禁，應隔離允許的診斷請求與致動。[MQ19](../10-facts/mqtt-semantics.md#L66)、[MQ20](../10-facts/mqtt-semantics.md#L67)、[MQ28](../10-facts/mqtt-semantics.md#L70)。 |
| GAP-08 Mosquitto 支援政策 | 修正 | 補固定版本的支援、套件來源與修補通道；少 tag 不能證明死亡，advisories 頁空白不能證明無流程。授權義務亦按交付物核對，非「零義務」；[授權紀錄](../10-facts/mqtt-brokers.md#L22)、[查核限制](../10-facts/mqtt-brokers.md#L138)。 |

還缺三組共同驗收：正確性 owner 負責斷電、重送、重建、CQ 保留與已執行未落結果的 unknown，驗 F-46～F-54，不把 PUBACK 當完成；安全 owner 負責跨單元重放、re-plug、撤銷清單過期、金鑰輪替及攔截後保密；維運 owner 負責混版升級、回滾、舊備份與舊 topic 清除，再量首次和每站成本。這些不是只有 MQTT 要付，HTTPS 的 cursor 快照與增量接縫也要同測。

最後須補 MQTT normative 條文與固定版本實作的一致性，來源已明列 [未直讀項](../10-facts/mqtt-semantics.md#L114)；授權及維護者新狀態留待原文查核。每項須先約定可接受的恢復窗口、丟棄可見性及失敗處置，不能跑完才選有利門檻。未完成前，本文不宣稱任何候選已滿足全部部署錨點。

## 7. 一段話給 owner

**修正。** 不把你的失去感判成一半錯；原帳本確實低估成熟傳輸與工具整合的價值。
不用 MQTT 換到較少的生產配置與維護範圍，不是免費或更完整的命令語意。
retained 是有治理成本的 last-value 快取，不能一概判負資產。
跨客戶網路優先 HTTPS，但連通、身分與保密必須分別驗收。
第一版 unit hop 用 HTTPS 是保守選擇，已有 broker 或真實整合需求可提前重評。
南向入口與投影可按觸發加入，須實付 client、隔離、審查及維運，不是只加一個 runtime。
F-46/F-47 的 owner、去重及結果重讀，以及 N-02 的保密責任，兩案都不能省。
先保留契約與退出能力，再以同負載 PoC 和客戶接口決定值得在哪一跳付錢。