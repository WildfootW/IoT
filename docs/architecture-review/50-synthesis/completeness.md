結論先講：**現稿尚未達可定稿的實質完整性，骨架可保留。** 101 個需求 ID 均有文字落點，但 F-36、N-13、N-17、N-20、N-21 有未處置的子條款或驗收空白；19 題沒有整題失蹤，不等於答案全部閉合。六條原始致命沒有漏路由，更新仍部分未解，敏感 inspection 分支仍需客戶決策。以下七項缺口補文件，不要求本輪實作產品或跑完 PoC。

# Wave C 獨立完整性審查

日期：2026-10-11。依 [Completeness](../90-resume/wave-c-synthesis.js#L103) 與 [A.7](../RESUME.md#L142)。COMMON 的 66 份材料全部全文讀取：03、00/01/02、LOG/interim、八份 facts、六提案、42 份 B 批評/答辯/評分及四份 MQTT 帳本；另讀草稿與三份完整反駁。host inherited default，無 high 控制或模型核驗；無委派、網查、產品執行。第三方資料只繼承 2026-10-10 紀錄的原證據等級。

## 缺口

### GAP-01 | 重大 | RMA 沒有身分與資料交接程序

**缺什麼：** 產鑰、QR、claim 消耗已有設計，但 station/RMA 只在需求矩陣列名。沒有換板、失鑰、退回再售時的 serial、公鑰、環境歸屬及舊機撤權裁決。

**為何重要：** 停用 bootstrap 之後，維修不能靠重開舊 claim 恢復；換一把鍵亦不能把未決 job 或歷史偷偷接給另一個客戶。

**來源：** [F-36](../00-requirements.md#L117)、[製造流程](draft.md#L244)、[F-36 索引](draft.md#L605)。

**補救／驗收：** 製造 owner 與 Fleet admin 在定稿補 RMA 狀態表、重新指派 voucher、舊鍵撤權與履歷映射；列換板、同序號雙鍵、跨客戶重售三個案例。通過須舊機取得新授權為零、未決 key 不重跑、歷史不串戶；無法復原者具名隔離。這是新增需求缺口，不是重報撤銷備份反例。

### GAP-02 | 重大 | 通用功能分類漏了能力變更規則

**缺什麼：** 排除門鎖、製程寫入及非 Rebirth 命令成立；但未落實「不明即 Control-Semantic」及「任何 capability 變更重新分類」。

**為何重要：** 原本允許的 LED/function 增加 IO 後，舊分類、已排 SQ 或快取 grant 不能自動沿用；型別宣告與空 capability 拒絕不足以作此裁決。

**來源：** [原始 class rules](../00-requirements.md#L32)、[announce](draft.md#L158)、[LED 驗證](draft.md#L496)、[管理白名單](draft.md#L507)。

**補救／驗收：** 產品／安全 owner 保存分類與 capability revision，變更先暫停相關業務下行、重判並重新核准，issuer 與 unit 同驗。unknown class、增加 IO、重放舊分類各測一次，未核准的新執行均為零；仍容許已核准的非控制管理。這比 refuters 的「封住致動側門」多了分類生命週期要求。

### GAP-03 | 重大 | CI 規格被縮成測試名稱

**缺什麼：** memory、真實 ERP route、安裝及 soak/race 都有方向，卻沒有 GitLab refs、逐元件 overrides、隔離網路與可重現的 cycles/duration/jitter 契約。

**為何重要：** 只測預設組合不能重現混版或定位哪次依賴更新破壞 correctness；「長期 repaint」沒有時數亦無法驗收。

**來源：** [N-17](../00-requirements.md#L190)、[相容矩陣](draft.md#L211)、[N-17 索引](draft.md#L658)、[G-D](draft.md#L743)。

**補救／驗收：** e2e owner 定義來源 ref/digest manifest、override 介面、隔離拓撲、固定 seed 與三個負載參數；每個 correctness milestone 對應 e2e case。至少列預設組合及單元件舊版 override 的成功／預期拒絕案例；外部 prod 路由不可達。定稿須填參數及輸出工件，不必現在建立 pipeline。

### GAP-04 | 重大 | 原定 PoC 的決策去向不全

**缺什麼：** 草稿直接選 Python，未處置「Python/Rust 先 PoC」的既有決定；直寫 store 留在問答，沒有獨立 owner、啟動條件及驗收路由。

**為何重要：** G-X 比的是第二 unit binding，不能冒充語言或直寫比較；未做與正式取消必須分開，否則既有決策會在綜合中消失。

**來源：** [原定語言與直寫 PoC](../01-proposal-pcie-tree.md#L81)、[Python 基線](draft.md#L75)、[直寫回答](draft.md#L706)、[G-X](draft.md#L749)。

**補救／驗收：** 架構 owner 保留七日語言比較及 RAM/產物/CI 指標，或在決策表明寫不做的理由與 owner 核准要求；資料／安全 owner 為直寫補 gate，驗 scope、撤銷、斷樹緩衝、store 認證及逐 sample_id 零差異，未通保持全樹。兩者皆不得用未執行結果替選型背書。

### GAP-05 | 重大 | PoC 的判定與證據包未完整定義

**缺什麼：** 十三個 gate 都有角色，但若干通過條件仍是「已核硬體預算」「具名收益」；G-NET 更把「完成或明示不支援」並列。沒有逐 gate 的固定輸入與交付證據清冊。

**為何重要：** 測得數字而無事前門檻不能裁決；拒絕部署是正確失敗處置，卻不是三形狀驗收通過。這是架構規劃缺漏，不是缺產品測試結果。

**來源：** [完整 gates](draft.md#L737)、[容量觸發](draft.md#L378)、[O-04](draft.md#L1064)、[O-05](draft.md#L1065)、[O-06](draft.md#L1066)、[O-09](draft.md#L1069)。

**補救／驗收：** 依後表逐 gate 寫明版本／拓撲／負載、數值或可判真的不變量、工件與責任角色；未定數字須綁具體 owner 決策欄及期限，不能填「合理」。文件放行須零空白判準、零無主工件；PoC 結果分通過、失敗、不支援、未執行，後三者不得算通過。

### GAP-06 | 重大 | 硬體與壓力量測只留下部分約束

**缺什麼：** N-20 只有「量測或更換」，沒有把無 3.3 V、5.3 V 非穩壓列為選料拒絕條件；N-21 漏了 reference 零漂、門狀態主導室壓、三種壓力分產品及氣壓零件不可代用。

**為何重要：** 負差壓 fixture 通過不等於感測選型正確；禁安全用途也不能防止選到健康假值或錯誤壓種。原規格的硬體教訓不能只靠 ID 繼承。

**來源：** [N-20](../00-requirements.md#L193)、[N-21](../00-requirements.md#L194)、[D-03](draft.md#L492)、[矩陣](draft.md#L661)。

**補救／驗收：** 硬體／產品 owner 補 carrier-pin/電壓容差與壓力用途矩陣；不容忍該供電即改 carrier/電源方案。每型號附資料表、校準與失效 fixture；零漂/精度填事前產品數值，QA 路徑需可校準 4-20 mA，拒絕健康假值與跨壓種替代。壓力容器法規仍未查證，不得以此聲稱合規。

### GAP-07 | 重大 | 修訂缺少跨 gate 的生命週期合驗

**缺什麼：** 三位 refuters 已指出局部失敗；尚缺一份規定它們一起修好後仍須成立的 trace 清冊，尤其時間回撥、archive/re-enable、staging 與離線解封。

**為何重要：** 較大 epoch 不等於最新權限，八小時 lease 不等於可重新登入，app rollback 不等於狀態修復；局部補救可能互相破壞。此項不再計原反例一票，只增加跨表 acceptance。

**來源：** [授權窗口](draft.md#L259)、[保留表](draft.md#L319)、[restore](draft.md#L398)、[ERP gate](draft.md#L443)、[staging](draft.md#L460)，及後列全部 refuter ID。

**補救／驗收：** 正確性／安全／ops owner 共用同一 release 與故障時序，採下方合驗表；每次修訂保留原 key、權限 checkpoint、絕對截止與證據鏈。定稿必須指明預期狀態、可用信任材料、執行者及工件；不是要求先跑 PoC 才能完成審查。

## M/F/N 語意覆蓋

「設」為有具體設計；「妥」為明示取捨／條件，尚待核准；「缺」為子條款語意或驗收缺漏；「修」為處置存在但有 refuter 反例。均非產品通過。逐 ID 而非用整段區間代替核對；缺項為 F-36、N-13、N-17、N-20、N-21，另有表內明列的未閉合處置。

| 需求 ID | 判定 | 實質處置／仍缺內容與草稿位置 |
|---|---|---|
| M-01 | 設 | [首用及退出](draft.md#L714)：fleet 遷移、失聯處置、90 日零依賴。 |
| M-02 | 設 | [分軸清單](draft.md#L60)：28+U 是下限，非完整產品數；角色成本見計帳表。 |
| M-03 | 修 | [三圖](draft.md#L123)有路徑，(a) 加 T1 的同機方案仍受 longevity-scenarios-06 限制。 |
| M-04 | 妥 | [C-25 retrofit](draft.md#L294)需客戶施工權；原 VLAN 不動不宣稱圍堵。 |
| M-05 | 妥 | [G-L](draft.md#L748)逐發行物／下游權利，未查證不得出貨；非零義務承諾。 |
| M-06 | 設 | [月度／季度查核](draft.md#L68)、EOL 前六個月開遷移；更新缺陷另列 N-10。 |
| F-01 | 設 | [本地採樣／聚合](draft.md#L479)、north 每 measure 最多 1 Hz。 |
| F-02 | 設 | [近源 sample_time](draft.md#L336)，received_at 分開，錯時不補成現在。 |
| F-03 | 設 | [ERP inbound](draft.md#L442)只收管理／業務，量測進 PG。 |
| F-04 | 設 | [品質 gate](draft.md#L336)、逐點 age；缺值不補零、舊值不續命。 |
| F-05 | 設 | [D-02](draft.md#L479)暖機／fault 與 Fleet 品質可見。 |
| F-06 | 設 | [capability 驗證](draft.md#L496)，空或過期拒 effect；額外 class 規則見 GAP-02。 |
| F-07 | 設 | [獨立 UID/process](draft.md#L426)，driver 故障不佔命令 loop。 |
| F-08 | 設 | [三年 raw](draft.md#L333)，第一筆歷史即獨立 PG；容量 acceptance 見 GAP-05。 |
| F-09 | 設 | [dirty bucket](draft.md#L372)，遲到重算，清 raw 前完成修訂。 |
| F-10 | 設 | [node 門檻／ERP 值班者](draft.md#L380)，Grafana 畫線；80 ppb 法規未查證。 |
| F-11 | 設 | [不可變型別／單位版本](draft.md#L372)，不靠改大表接新資料。 |
| F-12 | 設 | [PG samples](draft.md#L370)與 ERP CQ/event archive 分流。 |
| F-13 | 設 | [dashboard-as-code](draft.md#L380)，重佈署先檢查未受管差異。 |
| F-14 | 設 | [stable series id](draft.md#L370)，改 type/path 不斷史，換表另 generation。 |
| F-15 | 設 | [最小屏](draft.md#L370)不建 history，但 ERP PG 仍在。 |
| F-16 | 妥 | [stackable node](draft.md#L58)，先驗兩層 intermediate；更深另驗，不預建無限樹。 |
| F-17 | 妥 | [逐 hop outbound](draft.md#L284)，HMI 本地 projection 是明列例外。 |
| F-18 | 修 | [隔離島](draft.md#L294)與 parser 分權具體；同機 T1 變體待補，不把 ACL 當 L2。 |
| F-19 | 設 | [穩定 unit／epoch](draft.md#L157)、path 可變；RMA 缺漏另見 GAP-01。 |
| F-20 | 設 | [unit/function 事實鍵](draft.md#L157)，show 逐 function 結果，不混成一台裝置狀態。 |
| F-21 | 設 | [child 主動 HTTPS](draft.md#L284)，IP 不作 identity。 |
| F-22 | 修 | [Modbus serial/bus/map](draft.md#L487)與換表流程成立；MQTT fixed-topic 歸屬仍欠 ecosystem-cost-erp-01。 |
| F-23 | 設 | [DNS 僅定位](draft.md#L247)，voucher 驗允許 parent，不靠硬編 IP。 |
| F-24 | 設 | [bridge 同 T2](draft.md#L255)，同續期／撤銷規則，不持中繼 CA。 |
| F-25 | 設 | [同 node 三角色](draft.md#L58)，可同時 endpoint/bridge，backend 分權。 |
| F-26 | 設 | [announce／一次南側登記](draft.md#L595)自動投影 Fleet，僅可管理類別有 Manage。 |
| F-27 | 設 | [120 秒／五分鐘](draft.md#L329)，有效來源時間與 monotonic elapsed，不由補傳刷新。 |
| F-28 | 妥 | [立即讀 snapshot](draft.md#L544)，新現場 report 批次要求，等待與新鮮度可見。 |
| F-29 | 設 | [啟動／120 秒反熵](draft.md#L177)，ERP 停機後自行恢復。 |
| F-30 | 設 | [心跳 snapshot](draft.md#L599)，只有狀態轉移入 ERP rows。 |
| F-31 | 設 | [unknown id/key 拒收](draft.md#L600)，schema admission 非自動建型別。 |
| F-32 | 設 | [schema 耐久接受才啟用](draft.md#L488)，舊版保留至積壓排空。 |
| F-33 | 設 | [registry commit 先於 ERP projection](draft.md#L166)，pending 意圖不是第二 binding writer。 |
| F-34 | 設 | [既有管理平台作 connector](draft.md#L505)，不重造 vendor 管理。 |
| F-35 | 設 | [離線 enrolment/recovery 根](draft.md#L247)，高於單站且限制 env/tenant。 |
| F-36 | 缺 | [產鑰／QR 已有](draft.md#L246)；RMA/station 的例外流程僅索引列名，GAP-01。 |
| F-37 | 設 | [受控製造／bootstrap](draft.md#L246)，device 區不需到 admin。 |
| F-38 | 設 | [actual/applied](draft.md#L181)是 owner 可快照重讀的版本事實。 |
| F-39 | 設 | [function manifest](draft.md#L608)驅動 schema/outcome；新 backend＋ERP 模組，標準 adapter 另計。 |
| F-40 | 妥 | [首版每站 root](draft.md#L609)；共享多租戶明列另 gate，不宣稱已支援。 |
| F-41 | 設 | [ERP SQ/scheduler](draft.md#L430)，site-scoped proof、outbound-only。 |
| F-42 | 設 | [首售安全 gate／第三站複審](draft.md#L716)，N=3 不用來延期不可信網路保護。 |
| F-43 | 設 | [ERP 交易 outbox](draft.md#L165)受理 intent/job。 |
| F-44 | 設 | [timeline 本地](draft.md#L499)，不承諾跨盒同步起跑。 |
| F-45 | 設 | [standalone/mode](draft.md#L498)由 controller 持有，斷 parent 不清空。 |
| F-46 | 妥 | [owner／批次重讀](draft.md#L165)成立，有限媒體 RPO、UNKNOWN 明列；安全 restore 仍須修。 |
| F-47 | 妥 | [intent/job 二分](draft.md#L181)，不可核實物理效果的 job 禁用，不保任意 exactly-once。 |
| F-48 | 修 | [雙向信封／政策](draft.md#L229)具體；分類生命週期與 archive 派送授權仍待修。 |
| F-49 | 設 | [逐 key/version outcome](draft.md#L199)，包含 refusal/UNKNOWN；archive 驗讀另受 N-09 缺口影響。 |
| F-50 | 設 | [unknown、timeout、late result](draft.md#L185)分列，逾時不推論沒做。 |
| F-51 | 設 | [unit dedupe／ERP flight](draft.md#L185)，不明效果不解鎖，結果與 floor 分開 GC。 |
| F-52 | 設 | [inbox commit／CQ 分離](draft.md#L167)，長 worker 不阻塞 delivery。 |
| F-53 | 設 | [backend error/partial/refused](draft.md#L204)成 outcome，不包成 success。 |
| F-54 | 設 | [可 refuse/defer](draft.md#L181)，同版 pending 可續做，同值不累積副作用。 |
| F-55 | 設 | [ERP CMS manifest](draft.md#L468)、穩定 item id 與 unit 本地 id map，保留既有 CMS。 |
| F-56 | 設 | [versioned manifest pointer](draft.md#L468)，不把 collection 塞 flat attribute。 |
| F-57 | 設 | [整版就緒再 reconcile](draft.md#L470)，保 LKG 後清 ghost assets。 |
| F-58 | 設 | [content 修改重發引用螢幕](draft.md#L472)，不重啟同值播放。 |
| F-59 | 妥 | [origin per-record token](draft.md#L450)可輪替／constant-time；unit 改 grant/proof，非原逐屏 token 機制。 |
| F-60 | 設 | [所求版本或拒絕](draft.md#L470)，hash 一致才套用。 |
| F-61 | 設 | [可換 reconcile backend](draft.md#L462)，替代 player 的 gate 門檻見 GAP-05。 |
| F-62 | 設 | [輕量 CMS 不裝 website builder](draft.md#L712)，重內容模組按需。 |
| F-63 | 設 | [ERP projection／逐屏 polling](draft.md#L473)，五秒 JSON、idle/freshness、line scope。 |
| F-64 | 設 | [ERP 排程](draft.md#L434)，第二 adapter saga 才評 Workflow。 |
| F-65 | 設 | [G-C 全通後才提 Workflow](draft.md#L724)，不搶在命令正確性之前。 |
| F-66 | 設 | [worker 依耐久事實](draft.md#L183)，無信任 delivery 的 edge job engine。 |
| F-67 | 設 | [inbound 兩日 replay](draft.md#L326)，只清已交接業務資料；事件 archive／未確認 journal 分開。 |
| F-68 | 設 | [單 inbound／auth-before-write](draft.md#L442)，真 403/409/503。 |
| F-69 | 妥 | [single queue write gate](draft.md#L443)取代 outbound transport；每次派送 gate 仍須隨 F-70 補。 |
| F-70 | 修 | [只寫 archive 阻新工作](draft.md#L443)不足；既存 outbox/預取 Manage 受兩份反駁，GAP-07 加復原／重啟合驗。 |
| F-71 | 設 | [fresh DB 無 connection 報可操作錯誤](draft.md#L443)，不靜默丟。 |
| F-72 | 妥 | [CMS origin 不借 hub token](draft.md#L446)，unit 經 parent grant，明列機制改變。 |
| N-01 | 修 | [conduit／default deny](draft.md#L296)已有設計；(a) hostile T1 工件仍欠，不要求本輪建立 compose。 |
| N-02 | 妥 | [M/I profiles](draft.md#L274)明分身分與保密；敏感無 bypass 綁 O-01。 |
| N-03 | 修 | [resolver／分權](draft.md#L268)及認證已有；正常冷啟解封依賴、本地 reader 材料未接合。 |
| N-04 | 設 | [host 環境、無 prod secret/grant/egress](draft.md#L460)，內建中和方向成立；GAP-07 要求首封包前合驗。 |
| N-05 | 設 | [owner 表](draft.md#L434)、簽章歸因、[單 outbound call 稽核](draft.md#L712)，不含敏感 body/header。 |
| N-06 | 設 | [hold 20s/client 30s/proxy 90s](draft.md#L286)，worker 與 delivery timeout 分離。 |
| N-07 | 設 | [stop marker／完整狀態](draft.md#L394)、真 readiness；更新失敗出口另受 N-10 限制。 |
| N-08 | 設 | [INFO／rotation／配額](draft.md#L712)，不把 DEBUG 作現場預設。 |
| N-09 | 修 | [逐 owner 備份表](draft.md#L386)存在；最新安全 checkpoint、archive 驗讀與 artifact 保管仍須補。 |
| N-10 | 修 | [app/helper 與 OS/boot](draft.md#L402)有選擇；OS minor 失效及壞 migration 復原仍未閉合。 |
| N-11 | 修 | [LKG／授權縮限](draft.md#L259)明列；有效讀 lease 下的整島冷啟仍缺規則。 |
| N-12 | 設 | [parent/public/internal/content 分設](draft.md#L653)，不借 web.base.url；入口衝突列 G-NET。 |
| N-13 | 缺 | [九角色下限](draft.md#L114)及無 history 成立；「小」未綁硬體數值預算，屬 GAP-05 驗收缺口，非需求未提。 |
| N-14 | 修 | [uncertainty/skew](draft.md#L340)有數值；授權回撥／冷啟解封合驗見 GAP-07。 |
| N-15 | 設 | [120 秒／五分鐘](draft.md#L329)、MES 五秒、北向一 Hz；容量不以單機 30 attrs 當全站，GAP-05。 |
| N-16 | 設 | [memory/fake sensor/PLC/LED/reader](draft.md#L657)覆蓋無硬體路徑，不冒充硬體驗收。 |
| N-17 | 缺 | [soak/race 索引](draft.md#L658)未承接 refs、overrides、隔離及參數，GAP-03。 |
| N-18 | 修 | [逐可售 shape/profile gate](draft.md#L659)方向成立；不支援不得算 G-NET 通過，GAP-05。 |
| N-19 | 設 | [真實 route 403／模組安裝](draft.md#L444)，不是綠 bundle pipeline；測試產物見 GAP-03/05。 |
| N-20 | 缺 | [量電壓或換 carrier](draft.md#L661)欠明確選料拒絕條件，GAP-06。 |
| N-21 | 缺 | [旁路／QA／排除安全用途](draft.md#L492)僅部分；壓種、門狀態與 reference 零漂漏項，GAP-06。 |
| N-22 | 設 | [Parts 中文 notes／vendor hashes／registry](draft.md#L663)有交付方向；G-L 工件須按原規格列 interfaces/address/burning/pitfalls。 |
| N-23 | 設 | [各模組 zh_TW export/merge](draft.md#L712)，不覆寫既有翻譯。 |

## 六項原始致命

「設計處置足」不表示交付 gate 已通過；「本版不採」是明示範圍處置，不是宣稱第三方產品不可能可用。

| 原始 fatal ID／來源 | 草稿與反駁的實質狀態 | 定稿仍須保留的結論 |
|---|---|---|
| [P2/longevity-01](../30-critiques/P2/longevity.md#L15) | [app/OS 路徑](draft.md#L402)已選；[longevity-scenarios-01](refute-longevity-scenarios.md#L91)、[-02](refute-longevity-scenarios.md#L101)仍指出 minor/壞狀態復原缺分支。 | 部分處理，不只一句 G-U；補恢復 artifact、分支與 GAP-07 合驗。 |
| [P3/security-01](../30-critiques/P3/security.md#L11) | [出廠根、voucher、公鑰指紋](draft.md#L246)可先驗第一個 parent；[安全反駁](refute-security-correctness.md#L116)確認成因已修。 | 設計處置足；假 parent/錯 env 是將來 G-PKI 的零接受測試。 |
| [P3/longevity-01](../30-critiques/P3/longevity.md#L24) | [canonical 處置](draft.md#L879)明寫不採 NATS，不留下無更新路徑的 NATS fleet。 | 該產品依賴在本版移除；選用零件的更新責任仍由 §8/G-U 承擔，重選 NATS 要重開 gate。 |
| [P4/security-03](../30-critiques/P4/security.md#L27) | [雙向簽章＋M/I](draft.md#L274)修真偽與 bearer 問題；[反駁裁定](refute-security-correctness.md#L141)仍保留敏感無 bypass 阻塞。 | 條件性未閉合；O-01 必選 no-decrypt、非敏感 I、或另審加密；未決不得勾全支援。 |
| [P4/longevity-01](../30-critiques/P4/longevity.md#L24) | [本版不採 TB](draft.md#L923)，[O-08](draft.md#L1068)重開需書面三形狀權利。 | 明示範圍處置足；不沿用「付費必違 M-05」推論，未取得合約仍未查證。 |
| [P6/security-01](../30-critiques/P6/security.md#L28) | [來源 proof／parent 驗權](draft.md#L236)、[零未授權持久業務寫入](draft.md#L738)，不需把驗 token 秘密交給 relay；[反駁](refute-security-correctness.md#L186)確認成因已修。 | 設計處置足；正常離線 reader 授權另有缺口，不與原先盲收 report 混為一項。 |

## 十九題逐題核對

題號只用於本次審查，依原 §9 的實際順序；條件答必保留選項及不決定的後果，不能把待執行 PoC 說成結果。

| 題號／原題 | 草稿的實際答案與完整性 |
|---|---|
| Q01 [NGSI 是否保留／FIWARE 必需能力](../00-requirements.md#L273) | [已答](draft.md#L690)：不作內部命令契約，模型／互通價值保留，具名需求才唯讀 facade；無不可替代能力的證據。 |
| Q02 [registry／唯一 issuer](../00-requirements.md#L274) | [已答](draft.md#L691)：B0 registry、隔離 operational issuer；factory/recovery 不是平行營運 issuer。 |
| Q03 [channel／TLS 與身分終結](../00-requirements.md#L275) | [條件答](draft.md#L692)：HTTPS stream/batch、parent 終結、原始物件驗證，MQTT 限資料面；M/I 取捨綁 O-01。 |
| Q04 [端到端命令／dedupe／flight／期限](../00-requirements.md#L276) | [已答](draft.md#L693)：ERP desired/SQ/scheduler，unit actual/CQ/dedupe；archive 派送缺口依反駁修訂。 |
| Q05 [PG 同叢集或獨立／writer／roll-up](../00-requirements.md#L277) | [已答](draft.md#L694)：首歷史即獨立 PG、north writer、SQL dirty-bucket，不用 TSL；G-S 仍須 GAP-05。 |
| Q06 [告警在哪／誰接](../00-requirements.md#L278) | [已答](draft.md#L695)：node 算業務門檻，ERP 交站點值班者，Grafana 僅 ops 健康與畫線。 |
| Q07 [一屏是否低於兩服務](../00-requirements.md#L279) | [已答否](draft.md#L696)：九角色下限加 daemon，不偷省 ERP PG；footprint 預算尚欠 GAP-05。 |
| Q08 [Anthias 後繼／reconcile 是否集中](../00-requirements.md#L280) | [條件答](draft.md#L697)：先保留 Anthias，失格轉 browser kiosk＋受限 scheduler 候選，reconcile/id map 留 unit；替代比較門檻見 GAP-05。 |
| Q09 [cloud site agent／credential](../00-requirements.md#L281) | [已答](draft.md#L698)：site bridge 自有 T2/site key、outbound 443；純一屏可直 B0，D-06 必有本地 producer。 |
| Q10 [信任根／discovery／IoT2 的 N](../00-requirements.md#L282) | [已答](draft.md#L699)：預置根與 env voucher，DNS 只定位；N=3 營運複審，首售安全不等 N。 |
| Q11 [Control-Semantic 用哪個平面／是否在內](../00-requirements.md#L283) | [已答](draft.md#L700)：管理／事件在內，門鎖與製程控制另案；其他 function 的動態分類仍欠 GAP-02。 |
| Q12 [所有 state 備份／內建 staging 中和](../00-requirements.md#L284) | [部分](draft.md#L701)：state 表與中和規則已給；最新安全內容、讀者材料、artifact/舊證據保管仍依反駁與 GAP-07 補。 |
| Q13 [edge 哪些合併／哪些分 process](../00-requirements.md#L285) | [已答](draft.md#L702)：同 release，不同 UID/process；sensor/parser、writer、issuer、helper 分權。 |
| Q14 [不自建的邊界](../00-requirements.md#L286) | [已答](draft.md#L703)：不建 DB/browser/OS/bootloader/broker/crypto/backup engine；自有協調不是免責。 |
| Q15 [管理中心在哪](../00-requirements.md#L287) | [已答](draft.md#L704)：ERP UI over B0 registry，業務 owner 留 Odoo。 |
| Q16 [T1 representative 誰建](../00-requirements.md#L288) | [已答](draft.md#L705)：操作員在 south 登記一次，south 建立並 announce，未知來訊不自建。 |
| Q17 [直連與樹／文件現有案例](../00-requirements.md#L289) | [路徑已答、gate 不完整](draft.md#L706)：管理／文件／長期資料走樹，HMI 例外；直寫條件保留但缺 owner/觸發，GAP-04。 |
| Q18 [Workflow 之後是否仍無人閉環](../00-requirements.md#L290) | [已答](draft.md#L707)：保留 inbound 不自動寫下行；第二 adapter saga 才評，Workflow 預設只能提案。 |
| Q19 [south 與 gateway 是否合併](../00-requirements.md#L291) | [已答](draft.md#L708)：同 stackable node release，backend／權限不合成特權 parser。 |

## 九錨點逐項核對

| 錨點／原文 | 實質判定／客戶或 owner 決策 |
|---|---|
| A01 [Odoo 是產品](../03-brief.md#L17) | [遵守](draft.md#L434)：ERP 持 CMS/desired/SQ 及業務 binding 意圖，B0 持營運 binding；ERP 不收逐樣本。 |
| A02 [台灣 C-25 與 hostile T1](../03-brief.md#L18) | [條件式](draft.md#L294)：確有隔離島與逐埠 fallback；O-02 需客戶核施工權、料件、停機、費用。原網不動不是已滿足。 |
| A03 [三種部署形狀](../03-brief.md#L19) | [仍須修](draft.md#L123)：longevity-scenarios-06 要保留同機 south；(c) 敏感資料依 O-01 決 no-decrypt／另審加密，不得把不支援算 G-NET 通過。 |
| A04 [單站規模／三年歷史](../03-brief.md#L20) | [設計遵守](draft.md#L370)，但 G-S 必凍結 sensors/attrs/rate/screens/consumers 負載與 O-05 容量，GAP-05；不降成只有一台機器。 |
| A05 [CM4／封閉韌體 T1](../03-brief.md#L21) | [方向遵守](draft.md#L487)：Modbus 及成熟 decoder，不要求 T1 改韌體；RMA、供電／選料和 MQTT 可信映射仍須補。 |
| A06 [小團隊／種類／授權／制度成本](../03-brief.md#L22) | [明列成本](draft.md#L753)：O-09 選首屏範圍／增人，O-05 決 escrow 替補與 RTO 時段；IT/partner/法務工時不得當零。 |
| A07 [最小一屏要小](../03-brief.md#L23) | [免可選服務成立](draft.md#L114)；O-04/O-09 仍須填實機 RAM/CPU/disk/boot 預算才能判「小」，GAP-05。 |
| A08 [D-05 管理／D-06 HMI](../03-brief.md#L24) | [有具體設計](draft.md#L505)：reader config/attestation/事件與本地 HMI/SLO；不要求建控制產品。O-07 硬體、O-06 點表/SLO、O-10 離線讀權仍待決；登入／冷啟依反駁修。 |
| A09 [C-01..25／B-01..14](../03-brief.md#L25) | [回歸責任表](draft.md#L666)非測試結果；GAP-02 分類規則、GAP-03 CI、GAP-07 restore/archive/stop 合驗不可省。 |

## PoC 與工件

下表是定稿應明定的驗收計畫，不是假造已存在的測試產物。每份將來的證據包都應有 immutable source/BOM/profile、參數、預期與實際結果、原始 trace、日期、執行者及核准角色；實際產品結果現在全部未執行。角色可一人兼任，兼任及可用時段需入帳。

| Gate／原定 owner | 已有判準與必要補足 | 必列交付工件 |
|---|---|---|
| G-C [正確性 lead](draft.md#L737) | 已受理工作零靜默消失、unknown 零盲重跑／解鎖；補固定 fault-point/case 清單與持續時間，含八天 cursor＋新 SQ。 | 契約/oracle、故障 trace、每 key/版本 owner 對帳及效果證據表。 |
| G-PKI [安全 lead＋外審](draft.md#L738) | 已有驗權前零業務寫入／零 secret 洩漏；引用線上撤銷 60s、離線新操作最長 300s，補 grant/checkpoint/時間回撥例外。 | 信任與 key-custody 圖、簽章黃金／拒絕向量、外審發現處置與復原裁決。 |
| G-NET [交付＋客戶 IT](draft.md#L739) | 三形狀支持矩陣內的必要 flow 都完成、禁止路徑全拒、WAN inbound 為零；不支援另記決策，不能是 PASS。 | 三形狀接線／介面／firewall 模板規格、18 格流程預期、實際 policy/拒絕矩陣與客戶決策。 |
| G-T [硬體＋ops](draft.md#L740) | 已有錯時零 fresh／零新授權；補 uncertainty ≤2s、未來偏移 >2s 隔離，回撥不得延長既有 lease；供電依 GAP-06 選料矩陣。 | 時間源與解封啟動依賴、clock fault trace、carrier pin/電壓範圍與量測報告格式。 |
| G-U [release＋硬體](draft.md#L741) | floor/證據不得回退；補 OS minor 與壞 migration 分支。足跡須 ≤O-04/O-09 事前填入的 MiB/GiB/CPU%/秒門檻，空白即不得通過。 | 完整 app/helper/OS/boot artifact 保管清冊、救援 kit、每階段復原矩陣、足跡／耐寫與 canary 報告。 |
| G-R [ops＋安全](draft.md#L742) | 中央 RPO≤24h、RTO≤8h 只是 O-05 待核基線；補計時起點、服務時段、escrow 替補、最新安全內容證據與 edge RPO。 | 每 state 的 backup/restore/重建 manifest，含 Grafana 非 repo 狀態、reader 授權、artifact bytes、公鑰歷史與恢復工作站。 |
| G-D [ERP/display lead](draft.md#L743) | 真 403、零錯版／假完成、所有 outcomes、archive 零新 command/Manage；補 N-17 的 soak 時數/循環/jitter 與實際換頁判定。 | 真 route/模組安裝/zh_TW/e2e 報告、畫面或 backend-confirmed 證據邊界、C/B regression 對照。 |
| G-S [資料 lead](draft.md#L744) | 每 sample_id/roll-up 零錯配；不能只「量 bytes/WAL」。以 W2/W3 或核准全站負載，將查詢 p95 2s、restore 8h、storage 60% 觸發連到 O-05 的擴容／改型決策。 | sensors×attrs×rate 三年估算，含 index/WAL/備份/spool；資料核對、遲到與 retention 邊界、容量／遷移回退證據。 |
| G-M [整合＋安全](draft.md#L745) | 零跨來源歸屬；兩個 T1 同 topic 同 payload 仍可區分或明拒。固定 client/topic/churn/時長，驗 raw 配額及 node/n 保留資源，不只寫「不耗盡」。 | 型號/韌體矩陣、可信入口 feed/namespace/IPC 契約、實例配置、來源映射及資源壓力證據。 |
| G-H [HMI＋partner](draft.md#L746) | 已有刺激至畫面 p95≤1.5s、p99≤2s、age>3s stale；固定樣本數／負載，離線新 browser 與整島冷啟均驗，session 不延長絕對八小時上限。 | 真 PLC 點表/角色/認證、預置頁面、reader 授權快照與 session 契約、延遲分布／stale／Sparkplug 互通報告。 |
| G-A [reader＋安全](draft.md#L747) | 十分鐘 nonce attestation、十五分鐘失鮮 unknown；缺證據零 verified、控制命令零通過。O-07 先填硬體政策、事件隱私與保存期間，法律仍待查。 | 硬體/SDK 能力證據、管理白名單/actual 狀態表、nonce/boot-policy fixtures、事件交接及隱私裁決。 |
| G-L [release＋法律 owner](draft.md#L748) | 已有逐發行物零未知使用權支撐出貨的二元判準；補每件維護 owner、修補來源、支援/退出處置及下游義務，不能用 repo 根 LICENSE 包辦映像。 | 完整 SBOM/NOTICE/權利表、供應鏈 artifact 來源、Parts 每料中文介面/地址/燒錄/陷阱/SHA256 表與 registry 索引。 |
| G-X [架構＋整合](draft.md#L749) | 「具名收益」不足；O-09 須先定比較期間與量化採用線，例如三年含維護淨工時減少且同 SLO，或核准的成本換 SLO 門檻；不得事後挑數字。 | 同硬體/隔離/投影基線的 A/B 負載結果、adapter/IT/維護增量與 fleet 遷移清冊；未建 B 不宣稱測過。 |

| 表外 PoC／來源 | 定稿需補的 owner、判定及工件 |
|---|---|
| [Python/Rust](../01-proposal-pcie-tree.md#L81) | 架構/release owner；保留七日 timebox、同 mTLS/SQLite/連線負載的 RAM/產物/CI 比較及選型紀錄，或明示取消之決策與理由。GAP-04。 |
| [直寫 store](draft.md#L706) | 資料＋安全 owner；先定何個 G-S 容量／延遲結果觸發；相同來源逐 id 零差異、撤銷後零未授權寫入、斷樹緩衝與恢復可對帳，附 scope/flow/結果矩陣。 |
| [Anthias 替代](draft.md#L462) | display/release owner；沿 F-55..63 的同一 fixture 驗 list/create/update/delete/order、ghost、日期/順序、LKG/live freshness，並套 O-04 資源預算；3～4 人週探索不是通過線。 |
| [Mender/OS A/B](draft.md#L419)、[端到端加密](draft.md#L276) | 本版明示不採，不要求現在執行。O-04/O-01 若重開，必先列新 BOM、信任/更新路徑、G-U 或 G-PKI/G-NET 的可判驗收與 owner，再估工，不以探索人週保證可用。 |

## 修訂合驗清冊

以下均是 GAP-07 新增的 acceptance 組合；原反例仍用原 refuter ID，不另改嚴重度或算新致命。

| 合驗情境 | 必須明寫的結果／證據／owner |
|---|---|
| 已完成 revoke/adopt/policy 後還原 ERP/B0 | 安全 owner 從異故障域 journal/checkpoint 重建至指定 security revision/digest，未齊零新 grant。分別構造「有 revoke／無 revoke、epoch 相同」兩個歷史，裁決須不同，不能只比較 epoch。 |
| WAN 斷＋新 browser＋整島重啟＋時鐘回撥 | ops/HMI/安全定時間→解封→授權快照→被動 producer/view 的無循環順序；固定 not_after，不因登入/重開/回撥續八小時，五分鐘新操作權亦不復活。無可信期限拒新讀／操作，既有 LKG 規則獨立。 |
| production backup 還原 staging | 交付／安全 owner 在第一封包與 dispatcher 前即排除 prod secret/boot grant、封 prod egress、archive connection；故意保留 DB 中 prod 標籤與待辦仍零 prod 連線／寫入。這是驗現有 N-04 設計，不新判它全缺。 |
| 入列／預取後 archive，再重啟與 re-enable | ERP/正確性 owner 定 archive 線性化點及在途 grant 最長窗口；pending Manage/command 零新增派送。保留結果回流／重讀，重啟不放行舊批次；re-enable 不換 key、不延 deadline、不清 UNKNOWN。 |
| OS minor 斷電＋migration 已寫新資料＋rollback | release/ops owner 保留不可回退 journal/floor/stop marker，衍生壞狀態走向前修復；救援 artifact 與解封材料不依賴已損 OS/網路。每個更新範圍都須有可用失敗出口。 |
| unit 退役＋major 解碼器退出＋archive 再讀 | 資料／安全 owner 保存最後引用所需的公鑰鏈、schema/單位、驗證政策及唯讀 decoder；已退役私鑰不恢復操作權。到最後 archive/未決工作截止前，所有 fixture 均可驗讀。 |
| C-25 (a) 同機＋T1 改造／AP reset | 交付/IT 保留 south 與 north 同主機的專用 NIC/VM/VLAN 路徑；負向同 AP/跨 AP/有線/租戶矩陣全拒，設備 reset 先隔離再載政策。新增 south 主機的 (b) 成功不得充當 (a) 成功。 |
| raw 相同 topic＋新增受限 reader＋撤銷 | 整合/安全 owner 用可信 feed 歸屬，而非 payload id；sample_id/source 不混。HTTP/SQL/MQTT 的相同 line/function/field scope 越權全拒，重新登入/還原不恢復撤銷權。 |

## 十三項反駁去向

全部 13 ID 保留，來源共 11 重大、2 次要。此表不新增同一反例；「新增」只指本報告追加的驗收或需求。修訂者須採納具體規則，或在決策清單具體說明不採理由，不可只保留連結。

| Refuter ID／原嚴重度 | 必須保留的修訂；本報告增量 |
|---|---|
| [security-correctness-01](refute-security-correctness.md#L23)／重大 | 最新安全內容 checkpoint，不只新 epoch；與 longevity-scenarios-03 同一修補包。新增 GAP-07 有／無 revoke 雙歷史裁決。 |
| [security-correctness-02](refute-security-correctness.md#L37)／重大 | archive 封既有派送／預取 grant；與 ecosystem-cost-erp-03 同包。新增 re-enable/restore 不延 deadline 且結果仍可回流。 |
| [longevity-scenarios-01](refute-longevity-scenarios.md#L91)／重大 | OS minor/runtime 也需獨立救援出口；新增 GAP-05 artifact bytes 保管與 GAP-07 組合故障。 |
| [longevity-scenarios-02](refute-longevity-scenarios.md#L101)／重大 | 壞 migration 的向前修復，不拿相容 schema 代替；新增與更新中已接收 CQ/stop marker 同驗。 |
| [longevity-scenarios-03](refute-longevity-scenarios.md#L111)／重大 | 安全 journal 交接、checkpoint 與對帳；合併 security-correctness-01，不重計工時，新增同上。 |
| [longevity-scenarios-04](refute-longevity-scenarios.md#L121)／重大 | archive 所需驗證材料／decoder 不隨退役刪；新增退役、major 退出與三年 archive 的同一 fixture。 |
| [longevity-scenarios-05](refute-longevity-scenarios.md#L131)／重大 | 整島冷啟的授時、解封與本地服務順序；新增回撥／固定截止驗收，不擴成永久離線。 |
| [longevity-scenarios-06](refute-longevity-scenarios.md#L141)／重大 | C-25 (a) 同機 south 變體；新增 AP/reset 後先隔離與獨立 PASS 格，非再要一套 (b)。 |
| [longevity-scenarios-07](refute-longevity-scenarios.md#L151)／次要 | O-05/O-09 的值班、替補 escrow、現場維修與年度乘數；無新增需求，僅要求不要丟掉這項決策。 |
| [ecosystem-cost-erp-01](refute-ecosystem-cost-erp.md#L9)／重大 | 選定 raw 可信來源 feed/namespace，不把 L2 port 當已交給訂閱者的身分；新增與換代表、scope 撤銷合驗。 |
| [ecosystem-cost-erp-02](refute-ecosystem-cost-erp.md#L17)／重大 | 本地 reader directory/驗證材料與絕對 not_after；新增整島冷啟/回撥/restore 合驗，與 longevity-scenarios-05 分別保留。 |
| [ecosystem-cost-erp-03](refute-ecosystem-cost-erp.md#L25)／重大 | archive 線性化與預取停止確認；合併 security-correctness-02，新增同上。 |
| [ecosystem-cost-erp-04](refute-ecosystem-cost-erp.md#L33)／次要 | 工程、IT、partner、採購／法務及客戶驗收分帳；無新增 requirement，保留未估欄，不編虛假總額。 |

## 表文與計帳

| 核對項 | 結果／必要處置 |
|---|---|
| [外部種類與自有軸](draft.md#L60) | K01..K28 恰 28；外部下限 28+U，三自有程式家族、五 repo、四語言不再相加冒充產品。U 待展開是已揭露的交付 gate，不單獨判缺陷。 |
| [部署角色](draft.md#L114) | 中央五＋屏端四＝九個已列角色，不是九個 process；每額外 bridge 至少另有 node/helper 及狀態。B0 helper、renderer、resolver、復原工作站與共用基礎服務須在 G-U/G-R 實例清冊定位，不從下限推全帳已完。 |
| [cloud 圖](draft.md#L140)與[Q09](draft.md#L698) | 前者畫有 site bridge，後者允純屏直 B0；可作兩個明列 profile，並非互斥。D-06 的 local producer 不得隨純屏簡化消失。 |
| [首屏人週](draft.md#L755) | 5～7＋6～9＋4～6＋8～13＋4～6＝27～41；更新 6～9＋OS/boot 2～4＝8～13。算術成立，外審費／等待與新增整改需去重，不把 refuter 估工逐項硬加。 |
| [年度成本](draft.md#L769) | 6～10 已含 ERP 2～4，不再重加。30 盒＋同維修規格的一個 bridge，一次 major 為 15.5～31 人日；以每週五日換算 3.1～6.2 人週，交通停機另計，屬假設算式非報價。 |
| [雙人 escrow](draft.md#L395)及[O-09](draft.md#L1069) | 兩人可接班不等於一人缺席仍能雙人解封；依兩項次要反駁補保管替補、服務窗口、IT/partner 主動工時與等待。角色尚未指派是決策欄，不捏造實際人名。 |
| [保留表](draft.md#L319)與[復原正文](draft.md#L398) | 明示 3 年 archive、退役可 GC、當前/前一 major 三者未接合；五分鐘操作、八小時讀權、冷啟只 LKG 亦須分支。依原反駁＋GAP-07 修，不誤說所有 TTL 互相矛盾。 |

## 事實與法規

本輪沒有發現草稿把繼承的未查證產品事實升格為已驗證結論；這不代表所有 upstream 研究都正確。草稿的採用版本仍須 G-L，不能以本審查代替查證。法規亦只核對聲明邊界，沒有新增法律判斷。

| 類別 | 確切來源與裁決 |
|---|---|
| 授權與維護 | [草稿 K 表](draft.md#L74)保留未知；[O-08](draft.md#L1068)不以付費判違規。繼承 [broker 授權](../10-facts/mqtt-brokers.md#L22)、[TB 摘要／Edge 未知](../10-facts/buy-options.md#L26)、[Mender 根 repo 限制](../10-facts/buy-options.md#L56)，均非本輪重查或全映像授權。 |
| 安全與網路 | [M/I](draft.md#L274)不把簽章說成保密；[T1 廠商摘要](../10-facts/transport-through-networks.md#L34)與 [T5 原文](../10-facts/transport-through-networks.md#L38)分級；[正向 buffering](draft.md#L292)仍未查證。未見把 advisory 數量當現版漏洞數。 |
| 時間與產品能力 | [cert/lease/root 效期](draft.md#L255)為本案設計值，不是產品支援期；[硬體/SDK](draft.md#L510)與 [player](draft.md#L462)保留未查證。不能拿 source release 日期或 CM4 泛稱證明實機 boot/RTC。 |
| 規模與價格 | [30 attrs 一 Hz 三年](draft.md#L372)約 28.38 億是算式，非測得容量；[NT$ retrofit](draft.md#L307)明標未查證預算；[PG W2/W3](../10-facts/postgres-timeseries.md#L90)亦為假設估算。 |
| 法規／認證 | [HCHO 80 ppb](draft.md#L483)、[壓力容器](draft.md#L492)、[D-05 法定保存](draft.md#L511)都未獲法規證據；未見新增無據 NIST/IEC 或產品認證合格聲明。保留消防／職安用途排除，但不能用排除抹掉 GAP-06 的一般產品約束。 |

定稿的完成條件是七項 GAP 有明確處置、十三項反駁都有採納或具體不採理由，且以上需求、問題、錨點及 gates 的交叉引用一致；不是宣稱 PoC 已通過。產品／客戶決策仍按各 owner 放行，不由本報告代簽。