結論先講：**接受 39 條、部分接受 14 條、反駁 0 條，共 53 條。** 原始嚴重度為致命 1、重大 42、次要 10；接受修訂不等於風險已解除，P2 尚不能宣稱勝出。

修訂摘要：保留 ERP 的 desired/SQ 權威，補持久交接、逐 key 不確定狀態與批次對帳。
補全雙向簽章、授權與信任生命週期；移除內嵌 MQTT parser，納入必要的 fleet 更新元件。
撤回無條件穿網、兩服務總足跡及廉價買回生態的說法，重列元件、妥協與未通過的放行條件。

日期：2026-10-11。角色僅為 P2 rebuttal author，依 [Rebuttal 規則](../../90-resume/wave-b-proposal.js#L1) 與 [RESUME A.2](../../RESUME.md#L1)。請求 strongest/high；實際 inherited default，無模型選擇及 effort 控制，未宣稱強制生效。

已完整閱讀 [簡報](../../03-brief.md#L1)、[需求](../../00-requirements.md#L1)、[P0](../../01-proposal-pcie-tree.md#L1)、[取捨底稿](../../02-tradeoffs.md#L1)、[日誌](../../LOG.md#L1)、[中期綜合](../../50-synthesis/interim.md#L1)、[P2](../../20-proposals/P2-https-pull-defended.md#L1) 與五份批判，並查閱八份 facts 及 [獨立帳本覆核](../../40-mqtt-ledger/ledger-review.md#L1)。下列來源保留本地 2026-10-10 查核紀錄的原文、摘要、推論等級；本輪未上網，不把摘要升格為原文。成本及修訂都是設計判斷，未執行產品程式、PoC、硬體測試或安全驗證；文件稽核不能替代它們。

## 1. 逐條裁決

裁決對象是原 finding，不降低其嚴重度。部分接受列明成立部分及不採的推論；反駁數為零，不表示照收所有修法。種類增量以共用底座為準，獨立 process 另記；逐列工時是局部粗估，重疊工作不得相加，整體預算見 §3。生命週期欄的頻率是本案責任承諾，不是第三方支援承諾。

### 1.1 Security

| 原始 ID | 原始嚴重度 | 裁決 | 理由與依據 | 修法與代價：種類、人週、生命週期 |
|---|---|---|---|---|
| [security-01](security.md#L17) | 重大 | 接受 | (c) 握手失敗不能授權降級；[T5](../../10-facts/transport-through-networks.md#L38) 支持 TLS 終結的信任轉移，不支持簽章保密。原 §3.5 未滿足 N-02。 | 部署管理員核准固定 trust profile；敏感資料要求 bypass，攔截模式明示 proxy 可讀。種類 +0；1-2 人週；每種 proxy/profile 變更重驗。 |
| [security-02](security.md#L27) | 重大 | 接受 | 原 §2 把 hostile parser 與樹私鑰放同 process，F-18 不能靠 fuzz 代替權限邊界，尤其 (a) 共機。 | MQTT 觸發時用獨立 broker、低權限 validator，node 再驗 schema；各設 CPU/RAM/磁碟額度。+1 broker 種、+1 client library，另有 validator process；隔離部分 1-2 人週；每版回歸及漏洞追蹤。 |
| [security-03](security.md#L37) | 重大 | 接受 | (b)(c) bridge 可改寫 children actual/CQ，違 N-05；只有 bridge 信封不能證明 unit 的完成結果。 | unit 自產鑰並簽 report/complete；root 驗原始信封才持久接受，T1 標 bridge 代言。共用 crypto、種類 +0；1-2 人週；每次格式/金鑰輪替驗重放。 |
| [security-04](security.md#L47) | 重大 | 接受 | 原 §3.3 未限制新 unit 可接受哪個環境與租戶；發現名稱不是收養授權，N-04 缺口成立。 | 製造站簽綁 serial、公鑰、env/tenant 的 claim voucher；unit 驗允許的 parent 政策，root 驗持鑰證明並持久消耗 claim。種類 +0；1-2 人週；每批出廠及 RMA 稽核。 |
| [security-05](security.md#L57) | 重大 | 接受 | clone 映像不能包含私鑰；只讓 T3 bootstrap 失效不足以保障 T2。軟體鑰不可因此宣稱不可複製。 | unit 本機產鑰送 CSR；issuer 先持久標 adopted 再發營運 cert，全部 T2/T3 停用舊 bootstrap；reset 不自動重開 claim。種類 +0；0.5-1 人週；每批製造/退貨驗重複序號。 |
| [security-06](security.md#L67) | 重大 | 接受 | ERP 被攻下仍可要求合法簽章；F-48 的授權不能只相信 queue 的 user 欄位，二次經同 ERP 確認也不是帶外。 | ERP 實施 RBAC；bridge 0 依獨立核准的租戶/子樹/動作政策及累積額度簽發；大量 Publish/revoke 需獨立管理入口批准操作 digest。種類 +0、另拆 policy/issuer process；2-3 人週；每次政策與 ERP 升級回歸。 |
| [security-07](security.md#L77) | 重大 | 接受 | 已簽 pointer 不保證文件/資產內容，也未限制其他 child 讀取；D-01 的 F-48、F-59、B-10 缺口成立。 | CMS 提供版本化 manifest/資產 hash；unit 驗後啟用；bridge 按 child 引用授權，link 代理逐次檢查目的地。種類 +0；1-2 人週；每個內容型態驗越權、redirect、快取污染。 |
| [security-08](security.md#L87) | 重大 | 部分接受 | 斷線撤銷不立即成立；縮短 cert 不能達成瞬時撤銷，亦不能用不可信 source time 判斷緩衝必然在撤銷前產生。 | 根簽短效授權 lease，過期停止新命令/敏感文件，report 隔離；root 恢復後裁決資料可信度。種類 +0；1-2 人週；每季斷線撤銷演練，明列 §2.2 的窗口妥協。 |
| [security-09](security.md#L97) | 重大 | 接受 | 「不在 Postgres」不代表 N-03/N-04/N-09 成立，原 §3.3 沒有金鑰保管、災復及失陷輪替契約。 | issuer 專用 OS user；單一 resolver 解鎖加密私鑰，獨立 escrow；離線 recovery authority 核准失陷換鑰，不能僅由已失陷舊鑰授權。保管整合 +1 種；2-3 人週；年度災復及輪替複審。 |
| [security-10](security.md#L107) | 次要 | 接受 | N-14 已有零時間反例；即使 RTC 未查證，也足以否定所有安全判斷只靠牆上時鐘的假設。 | 隔離 recovery 入口以預置公鑰、nonce 取得可信時間；一般資料通道不接受過期 cert，不信匿名 parent 授時。種類 +0；1-2 人週；冷啟動、回撥及重放納每版測試。 |
| [security-11](security.md#L117) | 次要 | 部分接受 | port 不能代表來源認證成立；但經驗證的 server TLS 配獨立帳密不等於明文，client cert 也不保證量測真實。 | 分列 credential_kind、server_verified、source_auth_level；採購逐機驗憑證驗證能力，未知者降級標記。種類 +0；0.5-1 人週；每型號/韌體驗證，不只按 1883/8883 分類。 |
| [security-12](security.md#L127) | 次要 | 接受 | 原 §2 漏算 HTTP/TLS/crypto 時鐘，(c) pre-auth 資源風險並未因用 HTTPS 消失。 | 補 BOM、限制握手/大小/深度/連線；bounded 身分查表只作減載，不作授權。補列至少 3 個相依種類；1-2 人週；每季查支援、每版解析邊界回歸。 |
| [security-13](security.md#L137) | 次要 | 部分接受 | token/scope/revoke 與 MES 路由缺漏成立；但原案也可用 NDJSON，不能推成 token 必然入 URL，短效 URL token 仍違 N-03。 | 首版 fetch streaming 用 header 認證；issuer 核 scope/期限，bridge 驗 lease；MES 僅走核准 API/唯讀路由。種類 +0；1-2 人週；每 connector 驗撤銷、日誌及防火牆。 |

### 1.2 Longevity

| 原始 ID | 原始嚴重度 | 裁決 | 理由與依據 | 修法與代價：種類、人週、生命週期 |
|---|---|---|---|---|
| [longevity-01](longevity.md#L15) | 致命 | 接受 | 原 §1.1「OTA 不補」與 N-10 衝突；版本協商不能把修補送上 fleet。[D1](../../10-facts/buy-options.md#L56) 只證明候選授權等資料，不證明本案已可更新。 | 選 Mender OSS client + 自管 OSS server 的 F-34 整合，涵蓋 node/OS/runtime、回滾與舊版退出。至少 +2 元件種類，server 相依另盤；6-10 人週；每季更新及年度斷電回滾演練。致命尚未解除。 |
| [longevity-02](longevity.md#L23) | 重大 | 部分接受 | 漏項成立；15/18 等數值混合引擎、runtime、repo，不能當精確排名。原 §2 的 12/13 也撤回。 | 重列完整責任表、依賴 BOM 與分軸數量，同元件不重複總加。盤點不新增執行種類；0.5-1 人週；每次 release 核對 SBOM/授權/支援截止。 |
| [longevity-03](longevity.md#L31) | 重大 | 部分接受 | 24 h 過期後無恢復流程成立；「每年全 fleet 重 adopt」與 CM4 無 RTC 未獲查證，不作既成事故。 | cert 改 7 天、半期續期；過期 30 天內僅走受限恢復，由最新 registry 核准重發，binding 不刪。種類 +0；1-2 人週；長假復電與拒絕續期每版驗。 |
| [longevity-04](longevity.md#L38) | 重大 | 接受 | 原 §3.3/3.5 缺 trust anchor 與演算法生命週期；一次外審無法涵蓋後續格式變動。 | 信封含 alg/key_id/format，白名單驗證；離線 authority 簽版本化 anchor 清單，重疊換鑰、退役封鎖及 escrow 演練。共用保管種類、增量 +0；1-2 人週；年度複審，安全格式變更另審。 |
| [longevity-05](longevity.md#L45) | 重大 | 接受 | F-33 正向寫入順序不是還原規則；舊 SQLite 不能憑裝置出示 cert 復活已撤銷身分。 | ops 用一致性備份方法及 manifest，還原先停發命令，核對獨立安全日誌與 epoch；缺最新證據就隔離。backup API/候選工具適配未查證。種類 +0；2-3 人週；每季跨庫不同時間點恢復演練。 |
| [longevity-06](longevity.md#L52) | 重大 | 部分接受 | 缺寫入預算成立，實際媒體壽命未查證；不能把 NORMAL 加一句 fsync 當作已證成的斷電耐久性。 | 心跳留記憶體、變更才落盤；CQ/交接/撤銷先耐久提交再 ack，候選 WAL/FULL 設定需媒體斷電驗收。種類 +0；1-2 人週；每版量寫入量，媒體變更重驗。 |
| [longevity-07](longevity.md#L59) | 重大 | 部分接受 | 授權與遷移漏帳成立，年年必升十次不是已查證事實；把 single-flight 移到鏡像也非必要修法。 | 保留 ERP 交易式 outbox/SQ owner，bridge 0 只驗政策；交付前查所有授權並編模組遷移預算。種類 +0；首次 0.5-1 人週、後續估 2-4 人週/年；每次 ERP 升版驗 C-20。 |
| [longevity-08](longevity.md#L66) | 重大 | 接受 | history 與 ERP 共叢集不隔離備份負載，[PG 分析](../../10-facts/postgres-timeseries.md#L106) 支持此風險；門檻沒有 owner 不能執行。 | 有歷史即由我方 ops 管獨立 PG 實例、支援矩陣與遷移水位；不保證跨實例 SQL join。+0 引擎、+1 實例；1-2 人週；每季容量檢查及每次 PG 升版恢復驗收。 |
| [longevity-09](longevity.md#L73) | 重大 | 接受 | 原 §2 的過渡 player 沒有採用證據或退場期限，F-61 介面不等於更換已完成。 | 首客驗收前補 Anthias 授權/支援/BOM；不過即換經審查的 player，保留 reconcile。補列 +1 runtime 種；查核 0.5-1、替換另 2-4 人週；每季追支援，不能無限延期。 |
| [longevity-10](longevity.md#L80) | 次要 | 部分接受 | 候選適配疑慮成立；「終局只能自寫 parser」不成立，[broker 認證能力](../../10-facts/mqtt-brokers.md#L28) 提供另一條路。 | 刪除自寫子集 parser 退路，採獨立成熟 broker；仍驗實際 T1 profile。+1 broker、+1 client library，取代 ingress library；共用 MQTT 包 3-5 人週；每季追兩個時鐘。 |
| [longevity-11](longevity.md#L87) | 次要 | 部分接受 | 少 tag 不證明穩定；[八筆 commit](../../10-facts/mqtt-brokers.md#L23) 也不證明整個專案 bus factor 必為一。[設定退場](../../10-facts/mqtt-brokers.md#L29) 須付費處理。 | 撤回時鐘最慢排名；選定版本、dynsec、升級/退出政策。種類 +0；0.5-1 人週；每季複查維護，設定遷移納每版回歸。 |
| [longevity-12](longevity.md#L94) | 次要 | 部分接受 | 3-5 人週缺交付證據；但 transport.mode 是診斷欄位，不單憑它就證明核心語意被 HTTP 鎖死。 | 定義與 HTTP status 無關的 snapshot/revision/gap/backpressure，簽語意物件；另列雙棧退出。種類 +0；契約 1-2 人週，換 binding 暫估 5-8、雙棧 1-2 人週/年；須 fleet 清冊證明退場。 |
| [longevity-13](longevity.md#L101) | 次要 | 部分接受 | 多編碼要維護成立；三個編碼不必等於三個狀態機。原 §4.4 的瀏覽器收益尚未交付。 | 首版只用 NDJSON，串流/有限批次共享同一狀態機與認證；不加 SSE。種類 +0；0.5-1 人週；每版對兩種承載跑相同契約測試。 |

### 1.3 Correctness

| 原始 ID | 原始嚴重度 | 裁決 | 理由與依據 | 修法與代價：種類、人週、生命週期 |
|---|---|---|---|---|
| [correctness-01](correctness.md#L9) | 重大 | 接受 | 原 §8 交易外 enqueue 留下業務已提交但 SQ 不存在的空窗，F-46/C-20 未閉合。 | ERP 同交易寫業務與帶固定 key 的 outbox，交易外只搬運；離線 ERP 不宣稱受理。種類 +0；1-2 人週；每版驗提交/回滾/搬運崩潰點。 |
| [correctness-02](correctness.md#L15) | 重大 | 接受 | D-04 效果後、終態前可只留 accepted；CQ 耐久不等於物理效果與資料庫原子提交。 | unit 持久執行嘗試，backend 支援同 key 證據回讀才自動對帳；否則持久 unknown，人工處置不冒充 done。種類 +0；每 backend 2-4 人週；每版故障注入，能力未查證前不保證 exactly-once。 |
| [correctness-03](correctness.md#L21) | 重大 | 接受 | 500 筆/14 天可先因容量淘汰；結果與 dedupe 一起刪除會讓舊 SQ 重跑。 | pin 未交接結果；ERP 耐久封存、unit 驗根簽最終 receipt 後才可回收詳細 CQ，tombstone/epoch floor 另留，滿額背壓。種類 +0；1-2 人週；每次 retention/restore 政策變更重驗。 |
| [correctness-04](correctness.md#L27) | 重大 | 接受 | timeout 只描述觀察，不能取消 A 或釋放 B；F-51 還缺 edge 的開始前 expiry 與執行柵欄。 | ERP 交易維持 single-flight；unit 持久 epoch/seq/執行槽，開始前檢查 deadline，未開始且過期持久拒絕、時間未知則 defer；僅終態或可證明的停止/對帳授權釋放。種類 +0；1-2 人週；每版驗 A 晚到及 timeout 後禁止 B 越序。 |
| [correctness-05](correctness.md#L33) | 重大 | 接受 | 已收 desired V2 不等於已套用；只收新版會把取件失敗卡死，舊 reconcile 也可能蓋新畫面。 | unit 以 durable desired/actual 差異重試；function 單槽，舊 worker 不得提交新 actual；同內容不重啟 show，拒絕/延後按版本持久回報。種類 +0；1-2 人週；每版驗斷網與交錯完成。 |
| [correctness-06](correctness.md#L39) | 重大 | 接受 | GET 端點不是補齊動作，cloud 讀鏡像不代表已讀 unit；局部丟 complete 不一定重連。 | 各 hop 主動批次反熵、持久水位及缺項範圍；parent 落盤才回交接 receipt，unit 保留至 ERP 收據。種類 +0；2-3 人週；每版測只丟 complete、fetch 仍活，無逐 job poll loop。 |
| [correctness-07](correctness.md#L45) | 重大 | 接受 | list/watch 間與業務/cursor 提交間都有空窗；[e17](../../10-facts/precedents.md#L44) 只提供模式，不替 P2 證明原子性。 | snapshot 固定 revision R，watch 接其後；ERP 業務列/去重/水位同交易，CQ revision 單調合併；410 回到 owner 日誌/明示缺口。種類 +0；1-2 人週；每版 race/恢復測試。 |
| [correctness-08](correctness.md#L51) | 重大 | 接受 | 本地 schema 驗過不代表上游已持久接受；舊緩衝不能套新單位，capability 未知也不能放行 effect。 | root 核准 schema revision，各 hop 持久接收後回 receipt 才啟用；已核准待同步者有界隔離，未知 id 拒絕。種類 +0；1-2 人週；每版混版/單位更改及 F-06 fail-closed 測試。 |
| [correctness-09](correctness.md#L57) | 重大 | 接受 | 未來時間與晚到 link-down 會假在線或倒寫世代；[MQ21](../../10-facts/mqtt-semantics.md#L68) 是世代區別的參照，不是本案驗證。 | source time 保留，附 clock quality、boot/sample seq；parent 以 connection epoch 發 link 事件，時間無效標 unknown。種類 +0；1 人週；每版驗時鐘跳變與重連亂序。 |
| [correctness-10](correctness.md#L63) | 重大 | 接受 | 原 sample 三欄沒指定去重；已關 bucket 會漏遲到資料，F-09 不能只靠 upsert 字樣。 | writer 以來源/世代/seq/schema 定鍵，同交易去重、寫入、標 dirty bucket；PG commit 後交接，重算遲到 bucket。種類 +0；1-2 人週；每版驗 ack 遺失、補傳及跨 retention。 |

### 1.4 Scenarios

| 原始 ID | 原始嚴重度 | 裁決 | 理由與依據 | 修法與代價：種類、人週、生命週期 |
|---|---|---|---|---|
| [scenarios-01](scenarios.md#L67) | 重大 | 接受 | (a) 同 IP:443 可能已用；(b)(c) 遠端 parent 不由本地 mDNS 保證，N-12 缺實際配置。 | ops 固定 listener IP、node-visible parent URL、ERP internal/public URL、TLS name；不用 web.base.url 推導。種類 +0、可能新增 IP；0.5-1 人週；每站 occupied-port/DNS 改址驗收。 |
| [scenarios-02](scenarios.md#L75) | 重大 | 接受 | (c) explicit proxy 認證發生在 frame 之前；[T10](../../10-facts/transport-through-networks.md#L48) 不證明所選 HTTP client 支援客戶登入方式。 | profile 指定 proxy/CONNECT/FQDN、非互動 secret resolver 及診斷；不支援則列阻塞。種類 +0；1-2 人週；每種 proxy/認證變更驗冷啟動、Apply、回讀。 |
| [scenarios-03](scenarios.md#L83) | 重大 | 接受 | bridge 回源不能證明頁面仍 polling，快取收到 now 也不能滿足 F-63 的新鮮度。 | bridge 按 screen 記 last-poll，unit 回報 viewer 狀態；動態 JSON 與 immutable cache 分流、保留 source time/TTL。種類 +0；1-2 人週；每版驗停頁不停代理、WAN 中斷與免 Apply 更新。 |
| [scenarios-04](scenarios.md#L91) | 重大 | 接受 | warm-up/fault 的新時間戳零值仍可造成健康假象，旁送 status 未實施 F-04 gate。 | backend/node 在平均與告警前檢查 ready/quality/time，writer 重驗；無效量測不入正常 series，只記狀態與缺口。種類 +0；1 人週；每種感測 backend/韌體測 warm-up 與時鐘偏差。 |
| [scenarios-05](scenarios.md#L99) | 重大 | 接受 | 同 address 換表可以靜默併史，與 F-22/F-14 不同；各型號可讀 serial 未查證。 | bridge 比對已核准 identity；無 serial 時由操作員確認換表、持久新 unit/generation；改名不換 ID。種類 +0；0.5-1 人週；每次裝表/換表留稽核與同址替換測試。 |
| [scenarios-06](scenarios.md#L107) | 次要 | 部分接受 | T3 驗收標示缺口成立；原 §6 已明示預留，不能當成漏做本輪門鎖控制。 | 缺新鮮證據標 unsupported/unknown；D-05 交付前補 verifier、政策及 config actual，控制面仍排除。verifier 至少 +1 相依種類、硬體未查證；1-3 人週起；每次證據/韌體政策變更重驗。 |
| [scenarios-07](scenarios.md#L115) | 重大 | 接受 | D-06 採樣到畫面的延遲不是 LAN RTT；≤1 Hz 北向資料不能保證本地低延遲。 | partner 提供可驗來源，或另設本地高速唯讀 tap；北向仍降到 ≤1 Hz，owner 先定可接受年齡/延遲。沿用 backend 種類 +0；1-3 人週；每機型及來源改版實測，未通過即不交付 HMI。 |
| [scenarios-08](scenarios.md#L123) | 重大 | 接受 | node port 活不等於 backend 可用，N-07 的 deliberate stop 也沒有 owner。 | supervision 持久 stopped 狀態及 project 身分，分報 process/readiness/data-quality；限制單服務操作不波及 ERP。種類 +0；1 人週；每版 crash/stop/reboot/慢 DB/壞 DNS 回歸。 |

### 1.5 Ecosystem

| 原始 ID | 原始嚴重度 | 裁決 | 理由與依據 | 修法與代價：種類、人週、生命週期 |
|---|---|---|---|---|
| [ecosystem-01](ecosystem.md#L7) | 重大 | 接受 | 設 Primary Host 的 Edge 需先訂 STATE 才送 BIRTH（[MQ20](../../10-facts/mqtt-semantics.md#L67)）；全拒 SUBSCRIBE 不能泛稱 T1 MQTT 相容。 | 依實測型號/profile 允許必要 STATE 訂閱，由受限 host 服務產生真實狀態；其他訂閱/致動仍拒。共用 broker/client，種類增量 +0；1-2 人週；每韌體驗握手與重連。 |
| [ecosystem-02](ecosystem.md#L13) | 重大 | 接受 | 型別合法仍可倍率不同，原 §6 的重發未給第 N 個讀者同義資料，F-32 缺 mapping 契約。 | node 持久發布版本化 curated schema：永久 ID、單位、倍率、時間、quality；HTTP/MQTT 共用轉換 fixtures，raw 不給 HMI 旁路。種類 +0；1-2 人週；每 mapping/schema 版做跨讀者一致性測試。 |
| [ecosystem-03](ecosystem.md#L19) | 重大 | 接受 | 410 後最新快照不能恢復出勤事件；[獨立覆核](../../40-mqtt-ledger/ledger-review.md#L9) 也不接受加 token 即零成本。 | 交付 client 範例與事件回補/gap 契約；reader 自己持久 cursor，server 提供 owner archive 的授權批次入口。種類 +0、共用 node repo；首次 2-3、每 connector 0.5-2 人週；每 client/schema 版驗超窗。 |
| [ecosystem-04](ecosystem.md#L25) | 重大 | 接受 | 本地 endpoint 不等於斷 WAN 冷啟動可用；來源、頁面、認證與初始快照都屬 D-06 交付範圍。 | 預置 HMI 資產、有限離線讀授權、初始 snapshot；owner 定 p95/資料年齡，慢 reader 不拖 node。種類 +0；HMI 包 2-4 人週；每站驗 WAN 斷線冷啟及 stale。 |
| [ecosystem-05](ecosystem.md#L31) | 重大 | 接受 | [MQ19](../../10-facts/mqtt-semantics.md#L66) 與 [MQ21](../../10-facts/mqtt-semantics.md#L68) 不允許拿一般 retained 投影代替 Sparkplug 生命週期；全禁 NCMD 又會禁 Rebirth。 | 獨立 profile 實作 BIRTH/DEATH、seq/bdSeq、session、alias 重建；validator 只接受限速 Rebirth，其他控制拒絕。至少 +1 codec 相依，其他 library 待 BOM；4-8 人週；每 host/profile 版互通及 late-join 驗收。 |
| [ecosystem-06](ecosystem.md#L37) | 重大 | 接受 | partner 尚未提供 PLC 資料；[OPC UA 摘要](../../10-facts/zenoh.md#L82) 不是現場 endpoint 的證明。 | 先取得點表、profile、品質/時間/認證與樣本；決定唯讀 adapter，禁控制迴路。若採 OPC UA +1 library 種；1-3 人週起及 partner 工時；每機型維護 mapping/互通矩陣。 |
| [ecosystem-07](ecosystem.md#L43) | 次要 | 部分接受 | 不留 Orion 不代表資料模型無價值；但標案/NGSI reader 需求未查證，不能推成首版必建完整 NGSI。 | 契約觸發才做有限唯讀 export，區分 NGSIv2/LD；採資料模型另查 [F10](../../10-facts/buy-options.md#L84) 的授權。可先 +0 引擎；1-3 人週/要求；每客戶 schema/授權版驗收。 |
| [ecosystem-08](ecosystem.md#L49) | 重大 | 部分接受 | 客供 broker 驗收缺口成立；強制 raw/n 雙實例來自 interim，不是 P2 原案。缺 outbound bridge 也不阻止 publisher client（[broker 21/22](../../10-facts/mqtt-brokers.md#L57)）。 | 按 ACL、profile、隔離、支援責任驗客供 broker；只有不能隔離 raw 才增本地實例。+1 client library，可能 +0 本地 broker；0.5-1.5 人週/站；每客供升版重驗。 |
| [ecosystem-09](ecosystem.md#L55) | 重大 | 接受 | 不用 MQTT 沒有買到獨占的 F-46/F-47；[LEDGER-02](../../40-mqtt-ledger/ledger-review.md#L16) 承認 retained 的快取收益，[LEDGER-13](../../40-mqtt-ledger/ledger-review.md#L27) 撤回 HTTPS 必過。 | 分純螢幕/T1/D-06 同負載估首次、每站及年度成本；保留已有 broker/工具需求的重評觸發。種類 +0（比較工件）；1-2 人週；每個觸發重評，PoC 未做不得列淨省。 |

## 2. 修訂後的提案差異

### 2.1 原 §4.1-4.5、§8：持久責任與不確定性

P2 此點成立：業務 desired/SQ 留在 ERP，actual/CQ 的內容只能由執行節點產生；傳輸 ack 永不等於完成。撤回原 §4.5「九條全部成立」與 §8 的結構性消掉全部命令 bug。ERP 將業務變更、固定請求 key、outbox 同交易提交，單一寫入 gate 檢查連線封存及權限；搬運只能重用 key。未提交的操作明示未受理，已提交者不能因 ERP 停機消失。封存會停止未送出的命令，卻不宣稱取消已到 edge 的工作。

unit 比對 key 與 payload hash，拒絕同 key 不同內容，持久保存 adoption epoch、序號及 accepted；開始前檢查授權與 deadline，未開始且過期就持久記 refused(expired)，時間未知則 defer。通過後先持久記執行嘗試再呼叫 backend。執行嘗試存在而結果缺失時，先問 backend 的可歸因證據，不以整體 LED 畫面「看似相同」認定某 job 完成。backend 若沒有同 key 去重及結果回讀能力，保留 durable unknown，禁止自動補跑；能改為具穩定項目 ID 的 desired playlist 才改成 state。如此避免謊報，不宣稱同時解出不可判別的漏做與重做。

ERP 的 timeout 與 unit 的執行狀態分開保存。unknown 不釋放 single-flight；要繼續，須取得終態、可證明的取消完成，或操作員確認現場狀態並排除舊 executor 繼續動作，再由獨立授權開新 epoch。人工關閉流程只記錄決策、證據與責任人，不把未知歷史改成成功。遺失整個 CQ/媒體時，由 ERP 的在途清冊把相關 key 標 evidence_lost，隔離該 unit；換新 key、reset 或還原舊映像都不能洗掉未知動作。沒有外部證據者可以永久保持 unknown。

state reconcile 由持久 desired 與實際 backend 狀態差異驅動，並非只在收到新版 frame 時觸發。每 function 單槽，舊 worker 完成也不得倒寫新版本；同內容跨版本不重新啟動 show。unit 將 applied、refused、deferred、error 按版本保存並回報，重啟先核 backend 現況才宣告 actual。ERP 只有匹配目標、版本與有效來源的 actual 才顯示完成。

每 hop 以本地提交的 journal revision 建一致 snapshot R，再接 R 之後的增量。parent 落盤後回含來源世代、水位與摘要的 receipt；這只交接保管責任。每 120 秒及重連時，child 以批次清冊補 actual/CQ/event 缺項，parent 可在既有 fetch 回批次範圍請求，沒有逐命令計時輪詢。ERP 的業務列、去重及 cursor 同交易提交；根端確認 ERP 耐久接管後簽最終 receipt，綁 unit/epoch、key 及結果 hash，unit 驗簽與內容一致才准回收。較舊 accepted 不覆蓋較新終態。410 觸發 owner/封存回補，證據不存在就回具名 gap，不能用最新快照冒充歷史。

| 原 §4.3 項目 | 修訂後保留與交接 | 上限及失敗責任 |
|---|---|---|
| desired/actual | unit/ERP 各持己有事實，最新值及有效替代關係保留到退役 | 空間不足拒絕新版本；重啟 actual 必須重新核實 |
| unit CQ | 未終態、unknown、未取得 ERP 最終 receipt 者 pin；500 筆/14 天只管已交接的本地詳細快取 | unit 配額達 80% 告警、100% 拒新 job；不得淘汰未交接證據 |
| dedupe/tombstone | unit 保留已消耗序號水位、舊 epoch 拒絕線及例外 key；ERP 封存完整簽名結果 | 退役且所有可還原來源封存/銷毀後才回收；舊備份啟動必須先重授權 |
| bridge SQ/CQ 鏡像 | 上游/下游 receipt 驗證且持久後回收可重建鏡像，結果來源仍可追到 unit 或 ERP 封存 | 命令證據專用配額，不與量測共用丟最舊政策；無 owner 即具名 gap |
| 量測緩衝 | 各 node/bridge 暫存直到下一保管者耐久提交；writer 待 PG commit 才 ack | 48 h 或 256 MB 先到者，按來源/區間記 dropped、oldest age；不承諾無限離線 |
| D-05 event log | unit 持有 event_id/seq；ERP 業務持久接受或核准封存後才交接 | 每 unit 預算 256 MB、80% 告警；滿額不覆蓋已接受事件，記新事件缺口；D-05 上線前定實際容量 |
| consumer journal | 24 h 或 64 MB 作快速續接；reader 水位與業務提交綁定 | 超窗 410 後查 owner archive；無歷史者只保證狀態重建並明示 gap |
| ERP SQ/結果/inbound | 終態 30 天轉完整簽名結果封存；inbound 2 天僅清已完成業務交接者 | 未處理超齡告警/背壓，不能定時刪唯一證據；封存至少至設備退役及 restore 來源關閉 |
| 文件快取 | pin active、last-known-good、applying 所引用文件與資產，另留最近 3 版 | 滿額拒新下載/Apply，不刪正在播放版本；live JSON 另有 TTL |
| cert/授權 | cert 7 天、50% 續期；新命令及敏感文件授權 lease 最長 5 分鐘 | 過期進受限恢復或隔離；長 cert 不等於長授權 |
| replay | 網路請求用 nonce/連線序號；事實物件另用持久 epoch/revision | 不能因量測補傳久於 60 秒而改寫 source time；歷史驗簽不代表仍獲當前操作授權 |
| PG 歷史/roll-up | 3 年月分區；writer 原子寫樣本與 dirty-bucket，由排程重算受遲到影響的 bucket | 超出保留區間分類計數；重算失敗水位告警，不能靜默當已完成 |

### 2.2 原 §3.2-3.5：授權、真實性與機密性

下行由 bridge 0 的政策點批准，再由隔離 signer 簽語意物件；信封綁用途、env/tenant、unit/function、adoption epoch、版本或 job key、payload hash、schema、alg/key_id。上行由 unit 簽，bridge 只能代轉；T1 資料保留代言者、來源認證與品質限制。簽章不證明感測器誠實，也不能防合法 ERP 權限內的惡意內容。ERP user 欄位只供稽核；根端依獨立管理入口設定的服務身分 scope 與單次/累積限額授權。超過五屏的公開發佈及批次撤銷，確認必須綁精確操作摘要、短期限及一次性核准，不可拆小請求繞過。

unit 產鑰、製造站核序號與 CSR，claim voucher 限環境/租戶及 parent 政策；營運 issuer 唯一，factory identity 不給 dev/test 代理收養 prod 的權利。adopt 的防重記錄先提交，reset 不恢復舊 bootstrap。一般 key 輪替可重疊，失陷換鑰則由預置的離線 recovery authority 授權，不能只相信遭竊舊鑰。私鑰經 resolver 解鎖、與資料備份分流，生產 escrow 由兩位保管人授權恢復；staging 不取得它，也不取得可連真節點的啟動授權。

時間未知或 cert 過期時，只開隔離 recovery 入口：以預置 recovery 公鑰驗 nonce 綁定的時間與最新 registry 裁決，不先開放文件、命令或一般 report。一般 mTLS 不放寬驗證；候選 bootstrap transport 與 library 支援仍未查證，須外審及冷啟動實測。恢復續期不等於重 adopt。撤銷對已連線節點即通知，斷線則最多接受五分鐘既有操作 lease；過期只保留本地已套用行為，上行入隔離。新命令或敏感文件不再供應，也不以可偽造的時間戳替緩衝資料背書。

跨網路明分兩種經 IT 核准的 profile。bypass 模式驗原站 TLS 身分；inspection 模式僅在資料 owner 同意 proxy 可讀時採用，客戶 CA 只進該 profile，端到端應用簽章公鑰仍獨立 pin，site 請求用持鑰證明而非可重用 bearer secret。簽章提供真實性/完整性，不能提供對 proxy 的機密性。若客戶禁止 bypass 又要求 payload 對 proxy 保密，本版列部署阻塞，不能以未審查的加密格式補一句就宣告完成。mTLS 失敗不切 trust profile；串流切短請求只能改承載、不改授權。

### 2.3 原 §3.1、§3.4、§5、§6：部署與資料

三種形狀各有明確的 node-visible parent URL，不沿用 ERP public/internal 名稱。共機時給 node 獨立 listener IP；跨 VLAN 僅 bridge 向 parent:443；雲端僅站點 outbound，必要時經核准的 explicit proxy/CONNECT。DNS、有效時間服務、secret resolver、更新及備份路徑全部列進站點矩陣。T1 同 VLAN 的側向流量不能靠路由防火牆擋住，須客戶核准 AP/switch 隔離或獨立接線；辦不到就不接該 T1，不能把 C-25 當成已改善。

保留帶 jitter/backoff 的 NDJSON 串流及短 hold 退路；hold 是等待上限，有更新可以提前回覆，撤回串流才有 RTT 延遲的暗示。link keepalive 與業務 heartbeat 分開，後者維持 120 秒、offline 預設五分鐘，link-down 按 connection epoch 顯示；時間未知不假在線。supervisor 是 deliberate stop 的持久 owner，node、backend readiness 與資料品質各自回報，重啟不得拉起人工停止的服務，也不得操作同機 ERP 的 project。

schema 由管理權威核准版本、各 hop 持久接受後啟用；資料附不可變單位/倍率版本、來源世代與 sample seq，writer 唯一鍵去重並在提交後交接。ready/quality/time gate 在彙整前生效，暖機零值不能畫成正常線。換表建立新 identity/generation，改名仍沿用 series。history 由我方 ops 管獨立 PG，樣本及 dirty-bucket 同交易寫入；[F-12/F-13](../../10-facts/postgres-timeseries.md#L40) 支持分區與增量工作的選擇，不證明容量、延遲或還原時間已達標。

D-01 的 immutable manifest 包含資產 hash，unit 驗完整版本後啟用；bridge 僅按 child 的有效引用供件。外部 link 只能走 allowlist 代理，redirect 與 DNS 解析後的實際目的地都要重驗，拒絕內網管理/metadata 目的地。live JSON 不用文件三版本快取策略，預設十五秒 TTL 並保留業務資料時間；每屏 last-poll 與 viewer 存活分開回報，代理自己的回源不能替螢幕報活。失聯畫面可留，但必須顯示 stale。

### 2.4 原 §1.1、§4.4、§6：MQTT 與讀者契約

採納獨立覆核對 retained、成本及穿網的修正，但不照收 [HOP-05](../../40-mqtt-ledger/ledger-review.md#L69) 的無條件 publish-only：特定 Sparkplug profile 的 STATE 訂閱是資料啟動握手。需要 MQTT 才增加 broker 與 client library；只入口或只投影不強制兩實例，raw 與 curated 同時存在才隔離 process/權限/資源。客供 broker 依相同驗收規則評估，不因缺 outbound bridge 淘汰。raw payload 仍經低權限解析及 node 守門，schema 合法不代表來源真實。

普通 curated 最新值可以 retained，帶時間及 quality 並由 owner 回灌；這是 P2 該承認的生態收益。Sparkplug 另有完整 profile，不能套一般 retained：STATE、BIRTH/DEATH、seq/bdSeq、alias、Clean Session 及 Rebirth 各依 [MQ19-MQ21](../../10-facts/mqtt-semantics.md#L66) 的原查核契約處理。HMI 的 Rebirth 先進 validator，僅准特定布林請求、目標及頻率，再由專用發布身分轉送；ACL 不會自行檢查 payload，不准 HMI 直接向 T1 發任意 NCMD/DCMD。

第三方 reader 需要 snapshot、增量、事件 archive、gap 與 cursor 提交範例，不只是 token。D-06 先與 partner/owner 定取樣至畫面的延遲與資料年齡，再交付本地高速唯讀來源、預置頁面及離線冷啟動；北向仍不超過一赫茲。本地 HMI 可持最長八小時、限定非敏感 curated 資料的預授權，這是另列的離線撤銷窗口；沒有可信期限或已到期時拒讀，不假裝永久離線可用。D-05 無新鮮 attestation 就顯示 unknown，門鎖與憑證清單控制仍不在此通道。

### 2.5 原 §1.1、§2、§9：更新與災復

不再把 OTA 留到以後：選 Mender OSS client 與自管 OSS server 作更新零件，業務 desired/SQ 不搬過去。[D1](../../10-facts/buy-options.md#L56) 的 client/server 授權紀錄不涵蓋整個部署組合；[D2](../../10-facts/buy-options.md#L57) 的付費功能描述僅摘要。本案不依賴付費 delta/RBAC/multi-tenancy，改以每租戶隔離的部署及外部管理權限；實際 OSS BOM、可取得映像、CM4 bootloader/rootfs 支援與 footprint 都未查證，未過以前 longevity-01 保持致命。

release 管理員批准含硬體類型、hash、版本及相容範圍的簽名映像；server 持久保存 deployment/artifact。client 的必要服務與工件路徑經受控樹代理由內向外拉取，其相容性也列 gate，不能另開 unit 到 ERP/admin 的洞。unit 更新程序持久記 staged/booted/committed/rollback，健康確認後才提交並回報 actual；下載 ack 不表示升級成功。OS/runtime、node、backend、broker 與 client 相依都需有修補路徑，unit/bridge 的 A/B、斷電及回滾驗收不可由 server 安裝成功代替。

ops 為每個狀態庫保存一致性備份及版本 manifest；SQLite 備份方法、檔案系統和 flush 保證須依選定版本查核，禁止直接複製活動檔就稱耐久。還原先停發命令，核對 ERP outbox、unit 證據、安全日誌與獨立保管的授權世代，再逐項對帳。缺最新撤銷/世代證據時不能從舊 cert 重建信任，必須隔離並由管理員重新授權。軟體 T2 無法保證敵手任意回捲媒體仍被偵測；這項限制與完整媒體遺失都保留，不能假設備份會復活從未落盤的結果。

## 3. 原 §2 與 §9 的完整替代表

下表重列原元件全部去向並補漏項，不是已選定版本的完整 SBOM。種類、process、repo 分軸盤點，不再用 12/13 宣告最少；相同 broker 兩實例是一種元件、兩份配置，不是兩種引擎。未定套件與更新 server 內部相依不能算零，其 BOM 是放行阻塞；表中「未查證」不能支撐 M-05 已通過。

| 元件/依賴 | 自建或外部；位置/角色 | 授權、維護者與時鐘依據 | 相對原 §2 的去向與責任 |
|---|---|---|---|
| node | 自建；unit/bridge/bridge 0，同一 code | 自有；每版契約/混版/安全回歸 | 仍取代 gateway、south、IOTA、Orion、writer/roll-up 部分；移除內嵌 parser，增加持久交接；不取代 ERP 的 SQ owner |
| function backends | 自建；display、LED、sensor、Modbus、低權限 validator | 自有；每 backend 的恢復與 schema 版本各維護 | 獨立 OS user/process；socket peer 認證與權限，不只 localhost 位址；不持樹私鑰 |
| Odoo + iot 模組 | 外部 + 自建；北側 ERP/CMS/UI/outbox/SQ | 交付版本授權、支援期未查證；我方負責每版遷移 | 保留；不把排程權威交給 bridge 鏡像，移除舊 outbound 搬運路徑 |
| PostgreSQL | 外部；ERP DB，歷史另用我方管理實例 | PostgreSQL License 依 [原查核](../../10-facts/postgres-timeseries.md#L95)；版本支援 [F-11](../../10-facts/postgres-timeseries.md#L39) 含摘要，交付版須重核 | 同引擎、歷史 +1 實例；替代原歷史堆疊；ops 管備份/升版，writer 不與 ERP 逐樣本耦合 |
| SQLite | 外部 library；每 node 的本地事實與水位 | 交付版本、授權及耐久設定未查證；每季檢查 | 保留，關鍵提交須斷電驗證，heartbeat 不逐次寫入 |
| 原 MQTT ingress library | 取消內嵌及自寫替代路線 | 不把候選少 release 當必須自寫的理由 | 改用下列 broker/client/validator，原 library 不再進 node |
| Mosquitto 或核准客供 broker | 外部、條件啟用；raw/curated 依需要隔離 | Mosquitto 雙授權 [broker 1](../../10-facts/mqtt-brokers.md#L22)、活動 [broker 2](../../10-facts/mqtt-brokers.md#L23)、dynsec/退場 [broker 7/8](../../10-facts/mqtt-brokers.md#L28)；每季複核 | T1 MQTT 或本地工具觸發，不限 D-06；無樹憑證、無 WAN trunk；客供者另列支援 owner |
| MQTT client library | 外部、條件啟用；validator/publisher | 套件、授權、最低 runtime、維護狀態未查證；另有時鐘 | +1 library，不能藏在 broker；禁止自製 MQTT client 子集冒充省時鐘 |
| Grafana | 外部、可選；僅 ops，唯讀 history | 授權與交付版本支援未查證；每季檢查，不僅年度盲升 | 保留；dashboards 由部署 repo 管理，不覆蓋未受管修改而不告警 |
| Anthias/player | 外部；每片螢幕的播放 runtime | 授權、維護者、支援期未查證；首客驗收前決定可否保留 | 計入最小足跡；F-61 可換，但替換需獨立驗收，不承諾自寫瀏覽器 |
| HTTP/串流 framework | 外部；node client/server | 套件、版本、授權未查證；每季支援與漏洞檢查 | 補列 1 種；同一套件測 stream、batch、explicit proxy |
| TLS library | 外部；加密/驗證鏈 | 選定實作/版本/授權未查證；獨立安全時鐘 | 補列 1 種；不以 HTTP library 包含它為由漏列 |
| X.509/物件簽章 library | 外部；issuer/unit 驗簽 | 套件/版本/授權未查證；安全格式變更需複審 | 補列 1 種；不自製密碼原語 |
| PG driver、Modbus library | 外部；前者底座、後者 D-03 觸發 | 各套件/授權/支援未查證；各一時鐘 | 分別 +1 library 種，Modbus 不強加純螢幕；不是一個共享時鐘 |
| Python 與 OS | 外部；預算按 Python node，實際版本待定 | interpreter、OS 各自的支援/授權未查證 | 分開 runtime/OS 時鐘；不再由「語言一種」吞掉 OS 更新 |
| supervision、容器 runtime | 外部；主機及裝置部署 | 選定版本/BOM/授權未查證；每季更新責任在 ops | 各自盤點；保留 deliberate stop，不能把 compose 當零執行依賴 |
| policy/issuer、credential resolver | 自建隔離 process + 保管整合 | 自建部分自有；resolver/escrow 選型及相依授權未查證 | issuer 唯一；保管整合 +1 種，私鑰與 PG/SQLite 備份分流，部署與安全管理員共同負責 |
| Mender OSS client | 外部；所有受管 unit/bridge 更新程序 | Apache-2.0 原查核 [D1](../../10-facts/buy-options.md#L56)、[e13](../../10-facts/precedents.md#L40)；每季核支援 | 必要更新元件 +1；OS/node 及其相依同受更新政策，A/B/rollback 適配未查證 |
| Mender OSS server/artifact 儲存 | 外部組合；每租戶隔離、自管 | monorepo Apache-2.0 不等於全部映像可用；[D1/D2](../../10-facts/buy-options.md#L56) 有 Enterprise 界線 | 至少 +1 元件及額外服務；DB/儲存/runtime 子依賴數未查證，不能承諾只多一個 process |
| Sparkplug codec、OPC UA adapter | 條件啟用；只讀資料整合 | [MQ26/MQ28](../../10-facts/mqtt-semantics.md#L63) 仍有維護/適配未知；[OPC UA](../../10-facts/zenoh.md#L82) 僅摘要 | 至少各 +1 library，實際傳遞相依另計；不憑協定名稱宣稱即插即用 |
| 部署工件 repo | 自建；三形狀、firewall、更新/備份 manifest | 自有；每個 release 重驗支持形狀 | 保留且擴充，不能將產生模板算成 N-18 通過 |
| IoT_e2e repo | 自建；conformance、故障/混版測試 | 自有；每版回歸 | 保留；simulator 不能替硬體斷電、客戶 proxy 或 HMI 實測 |
| IoT_Parts repo | 自建；型號、韌體、mapping、製造/RMA | 自有；每批/型號變更維護 | 保留；T1 相容與 serial 能力均須逐型號留證據 |
| DNS、NTP、AP/switch、備份保管 | 借用或交付的站點依賴 | 實際產品、授權、支援未查證；需具名客戶/我方 owner | 不冒充新增自建服務，亦不能省略可達性、隔離及年度演練 |

| 盤點軸 | 修訂口徑 |
|---|---|
| 引擎 | 已知 PG、SQLite 兩種；OTA server 若需其他引擎另加，尚未查證 |
| 自有語言 | 預算基準 Python；SQL、部署 shell/既有前端語言分列技能責任，不混作 runtime；實際 BOM 待定 |
| 自有 repo | node、ERP 模組、部署、e2e、Parts 五份；本案契約/client 範例先放既有 repo，不另開 repo |
| MQTT 增量 | 通常 1 broker 種 +1 client library；raw/n 兩實例不加倍種類，Sparkplug 相依另加 |
| 最小服務 | 不再聲稱全站兩服務；北側 ERP/PG/node/issuer/OTA 組合，螢幕 agent/backend/player/updater 及狀態均在帳上；無 history/MQTT/Grafana |
| 待定總數 | 不將上述跨軸數字相加；HTTP/crypto/driver、保管與 OTA BOM 未定前，不提供虛假的完整種類總數或 RAM 數字 |

首客成本改以三至五屏、三至五感測器、含歷史及三形狀交付工件為範圍；下面替代原 §9 的 22-29 人週，不與它相加。共用修補包含表內重複 finding，條件式 HMI/標準整合另列。這是風險調整估算，不是報價或測得工時；需兩人能互相接手協定、PKI、更新與災復，否則 bus factor 仍未改善。

| 工作包 | 首次人週估計 | 持續責任 |
|---|---|---|
| node/ERP 契約、outbox、SQ/CQ、反熵/client 契約 | 12-17 | 每版 conformance、混版及 backend 恢復回歸 |
| 身分、政策、簽章、保管與信任恢復 | 7-10 | 年度複審、每次安全格式變更重審 |
| OTA client/server、OS 映像與依賴/BOM | 6-10 | 每季支援檢查、更新批次及失敗退出 |
| 歷史 writer、品質/schema、備份與對帳 | 5-8 | 每季容量/恢復演練 |
| display、live board、三形狀與 supervision | 5-7 | 每站入口/隔離驗收；客戶設備變更重驗 |
| 共用 e2e、斷電/亂序/超窗/回滾驗收 | 5-8 | 首客放行與每版回歸 |
| 基礎合計 | 40-60 | 維護初估另 6-10 人週/年，含 ERP 遷移；安全重大變更另估 |
| 外部安全審查與修補 | 日曆 3-5 週、修補另 2-4 人週 | 年度複審及信任模型變更重審，費用未查證 |
| 條件式 MQTT 入口/curated publisher | 3-5 | 每站 0.5-1.5、每年另 1-2 人週 |
| 條件式本地 HMI / Sparkplug | 2-4 / 4-8 | 每機台/host/Profile 的互通驗收，partner 工時另計 |
| 傳輸替換 / player 替換 | 5-8 / 2-4 | 前者另加雙棧 1-2 人週/年，退出須有 fleet 證據 |

## 4. 原 §7 的完整妥協清單

所有變更只定義本答辯中的修訂版本，沒有改寫原提案。F-41 保持 ERP 持 SQ，與 interim 考慮移轉排程不同；不能同時宣稱維持 owner 又讓 bridge 鏡像自行決定釋放順序。其餘妥協如下，不以「可修」掩蓋要求 owner 承擔的成本。

| 需求/原條目 | 修訂後妥協 | 換到什麼 | 代價與放行界線 |
|---|---|---|---|
| P0 §3 fetch/原 P2 串流 | NDJSON 串流 + 有限批次短 hold，共用契約，無 SSE 首版 | 保留單一生產協定與承載退路 | 兩承載仍要測；不保證 RTT 或任何 proxy 必通 |
| P0 §3 不用 MQTT | 實需時採獨立成熟 broker/client，不內嵌或自寫 parser | T1/工具互通及 retained 快取 | 增加 broker/client 時鐘、process/配置、profile/隔離工作 |
| N-02 | inspection 僅經明示核准，TLS 與端到端物件身分分開；敏感資料仍要求 bypass | 可在獲准的攔截網路驗真偽 | 不提供對 proxy 保密；無 bypass 又不能接受可讀即阻塞 |
| F-27/原 90 秒 offline | 回到 heartbeat 120 秒、offline 五分鐘，另報 link epoch 狀態 | 符合分鐘級業務存活，降低寫入/事件量 | link 快提示不是裝置健康或 F-27 的替代 |
| P0 全資料走樹 | D-06 快速唯讀 HMI 本地獨立來源，北向 ≤1 Hz | 免 WAN 往返，保留現場層 | 不保證 partner 已有介面；直寫 store 仍待原 PoC 條件，不偷開旁路 |
| P0 僅 T3 端到端簽章 | 全 T2 上下行物件簽章、文件/資產 hash、目的及世代綁定 | 中介不能改寫已歸因事實 | 增 crypto/版本/輪替責任；T1 不升格為可信量測 |
| ERP 當 root | ERP 業務 owner，bridge 0 持久 registry/policy，issuer 隔離 | 限制簽名機與 ERP 遷移的傷害 | 需跨庫恢復與獨立帶外核准；ERP 合法 scope 內的惡意內容仍有風險 |
| M-02 | 撤回 11 到 12、D-06 為 13 的完整總數與最少排名 | 讓依賴/時鐘/服務真實入帳 | 完整 BOM、技能與輪替人力必須先付；未知相依不是零 |
| F-41/F-69 | SQ/outbox/single-flight 仍由 ERP 交易持有；bridge 只鏡像與驗政策 | 維持單一業務寫入 gate，修提交空窗 | 不採 interim 的 bridge 排程權威；timeout 不釋放順序 |
| N-13/F-15 | 一屏免 history/MQTT/Grafana，但必需 issuer/更新/client/player 等依賴 | 首客已有可修補與復原的部署 | 原兩個中央應用角色不是全站服務數；最小 footprint 未量測，不能先宣布夠小 |
| M-05 | 不宣稱已過；只選可核對 OSS 組合，未知者列 gate | 不用未驗證授權前提換取低估成本 | Mender server 組合及既有 player/ERP/Grafana 等需重核；不自動改付費版 |
| F-46/F-47/F-51 | 有持久交接才接受；無法判別物理效果保留 unknown，禁止自動重跑 | 可追責的不確定性、避免假完成 | 不承諾無限離線或物理 exactly-once；未對帳可能長期阻塞新工作 |
| T2 即時撤銷/N-11 | 新命令/敏感文件 lease 最長五分鐘；本地行為繼續；非敏感 HMI 另核八小時讀租約 | 斷線可維持已套用行為及有限本地讀取 | 不是離線立即撤銷；期限不可信/過期即拒新存取，HMI 冷啟受限 |
| N-09/N-10 | 加入必要 OTA、各庫一致性備份、獨立 escrow/世代與還原隔離 | 有可驗收的修補及災復路徑 | 增服務、BOM、演練；媒體遺失及 root key 失陷不能靠舊備份自動解決 |
| F-39/標準整合 | 類型擴充維持 backend/模組邊界，但第三方 reader/profile 另付整合 | 不為未要求的標準先建平台 | NGSI/Sparkplug/OPC UA 按契約觸發，不宣稱零 connector 工時 |

## 5. 仍然承認的弱點與驗收

**longevity-01 仍是未解除的原始致命 finding。** 選了更新元件不是已能把修補送到現場；若 OSS 組合、受控出網或 CM4 回滾不可行，P2 的十年維護主張仍不成立。產品授權、player 支援、partner HMI 來源與最小 footprint 也尚無交付證據。這些不能靠把角色名字換成成熟產品就消失，更不能借中期綜合的偏好當作驗證。

P2 此點成立：一屏不必裝 broker，MQTT 不進 trunk/管理權威能減少部分生產配置。相對地，成熟連線處理、retained 與工具接口有真實收益；HTTP 自建串流、consumer、PKI、更新整合與退出都不是免費。相同安全配置、負載與交付範圍尚未比較，不能從接受/部分接受的票數推導架構勝負，也不能說其他提案必付同樣多的自建費用。

持久 unknown 是正確的失敗表示，不是 F-47 的完整成功保證。缺乏 backend 可歸因證據、unit 媒體遺失、敵手回捲 T2 軟體狀態時，部分物理結果永遠不能還原。root/ERP 合法權限失陷、共同 hypervisor 與 bridge 0 單點也仍在；process/配額隔離降低傷害，並不提供獨立硬體故障域。拒絕承諾不可能的保證，是本答辯的縮限，不是把剩餘風險判成解決。

| 必要 gate | 誰負責及可否定本案的檢查 | 本輪狀態 |
|---|---|---|
| 命令/交接 | 正確性 owner：ERP 提交前後、unit 效果前後、CQ/receipt 前後斷電；只丟 complete、超窗/舊備份、timeout 後 A/B 亂序；逐 key 無假 done、不自動重跑未知動作 | 未執行 |
| 安全/PKI | 安全 owner：跨 env/tenant/unit 重放、克隆 bootstrap、撤銷斷線、失陷換鑰、staging 還原、文件越權；inspection 分驗真實性與機密性 | 未執行；外審未完成 |
| OTA/恢復 | ops：固定 OSS BOM、每租戶配置、受控樹代理、CM4 A/B、OS/runtime 更新、斷電回滾、不同時點跨庫恢復；無最新安全證據須隔離 | 未執行；longevity-01 保留 |
| 三形狀/一屏 | 交付 owner：D-01 至 D-06 的在範圍內流程逐形狀驗收，含已占 443、認證 proxy、壞時間、T1 有線/無線側向拒絕、stop/reboot 及真實服務/RAM/磁碟清單 | 未執行；D-05 僅管理面且須 T3 資格 gate |
| 資料/HMI/讀者 | 資料與整合 owner：warm-up/時鐘偏差、換表、遲到去重/roll-up、停頁、WAN 斷線冷啟、reader 超窗回補、Sparkplug late join/受限 Rebirth、raw 耗盡不拖 curated | 未執行；SLO/partner 資料及相容型號待核准 |
| 成本/生態比較 | 產品 owner：純螢幕、MQTT T1、D-06/客供 broker 各用同負載及安全設定比較首次、每站與年度工時，含第二個 reader 和混版退出 | 未執行；不能宣稱淨省或 P2 勝出 |

上述 gate 的通過門檻需在實作前由責任人與 owner 核准，不能跑完再選有利數字。本輪只新增本答辯文件；沒有修改原提案、批判、事實、帳本、索引或日誌，也沒有替評審打分。後續文件結構稽核只能證明逐項覆蓋、計數及引用位置一致，不能解除任何尚未驗證的產品風險。