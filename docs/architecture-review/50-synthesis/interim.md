# 中期綜合：波次 B 中斷時的狀態與暫定平衡方案

> 日期 2026-10-10。撰寫者：主審（Claude 主 agent）。這**不是**波次 C 的最終綜合。帳號每週用量上限在波次 B 進行到約三分之一時到達（重置 2026-10-13 21:00 UTC），所以本文依「已完成的證據」寫出目前最合理的平衡方案，並明列未完成的部分與接續計畫（§6）。待波次 B 補完、波次 C 跑完，本文由 `final.md` 取代。

## 0. 證據基礎（已完成的）

| 類別 | 數量 | 位置 |
|---|---|---|
| 事實查核 | 8 份，皆附來源與查證日期 | `10-facts/` |
| 提案 | 6 份（P1 MQTT 原生、P2 HTTPS pull 強化、P3 NATS、P4 買、P5 可插拔傳輸、P6 最小主義） | `20-proposals/` |
| 批評 | 12 份：每份提案的 security 與 longevity；**correctness、scenarios、ecosystem 三個 lens 未跑** | `30-critiques/P*/` |
| 答辯與評分 | **0 份** | — |
| MQTT 辯論 | 正方、反方各 1 份；帳本由主審代寫 | `40-mqtt-ledger/` |

因此本文對「正確性」（F-46～F-54 的逐條驗證）、「情境擬合」（D-01～D-06 逐步走過）與「生態」三個面向的判斷，依賴提案自述與 security / longevity 批評的旁證，可信度低於其他面向。§6 列為第一批要補的。

## 1. 跨提案一致浮現的結論

下列每一條在至少三份獨立產出（不同提案、不同批評者、不同 lens）中出現。它們不依賴最後選哪個方案。

1. **語意層是契約，傳輸是可換的。** register（desired / actual）、SQ / CQ、announce / config space、owner 持有事實：六份提案沒有一份能少寫一行（`mqtt-semantics.md` §5；P1 §1 弱點 1；P5 §1）。P5 把它拆成 (A) 契約 + conformance suite + in-memory binding（邊際成本接近零，因為 N-16 / N-17 本來就逼 node 把 HTTP code 與語意分開）與 (B) 第二個生產 binding（真正的 M-02 帳）。**(A) 所有方案都該採；(B) 等觸發。**
2. **跨客戶網路的 trunk 只能是跑在 HTTPS 上的應用層協定，而且 mTLS 在 TLS 檢查 proxy 下會死。** 三家主流 proxy 廠商的文件一致（`transport-through-networks.md` T1～T5）。所有提案的 security 批評都指出同一件事：(c) 形狀的身分必須有應用層簽章退路，否則要麼斷、要麼把信任交給 proxy（P2-security-01、P3-security-03、P4-security-03、P6-security-06）。**這改寫 N-02：每跳 TLS 加應用層身分與簽章是底線；mTLS 是站內預設、跨網路可選。**
3. **所有下行物件要端到端簽章，而且簽章要綁收件者與新鮮度。** 中間的 bridge、broker、proxy 一律視為不可信傳輸。目前每份提案都在這裡有洞：簽名信封沒綁 env / path / serial 可跨 unit 重放（P1-security-01）；intent 簽了、content（playlist 文件）沒簽或沒雜湊（P1-security-05、P2-security-07、P3-security-03、P5-security-06）；舊的合法 desired 可重放（P3-security-09）。P0 原本只給 T3 的端到端簽章，**要提前到全部 T2，第一天就做**。
4. **信任錨與 PKI 生命週期是共同的空白。** 具體包括：bootstrap 信任錨不能是 TOFU，unit 出廠要預置環境 CA 公鑰與 environment id（P1-security-02、P2-security-04、P3-security-01）；bootstrap 金鑰要在裝置上產生、CSR 綁 serial、adopt 後 bootstrap 憑證對所有 T2 失效（P2-security-05、P1-security-03）；中繼 CA 私鑰的保管要與狀態備份分流，否則 N-04 或 N-09 必破一個（P2-security-09、P2-longevity-04、P5-security-05）；根與中繼的輪替、演算法欄位（P2-longevity-04、P6-longevity-10）；bridge 自己的憑證生命週期（P3-security-04）；revoke 對離線 unit 的傳遞與接受窗口（P1-security-07、P2-security-08、P5-security-04）；24 小時憑證遇上無 RTC 的 CM4 與農曆年斷電（P2-longevity-03）。**最終方案要有一章完整的 PKI 生命週期，並且外部審查。**
5. **沒有 fleet 升級路徑，所有「可逆性」與「時鐘自控」都不成立。** 這在 P2、P3、P5、P6 都被判致命或重大（P2-longevity-01、P3-longevity-01、P5-longevity-10、P6-longevity-03）。**OTA 必須進元件表：把 node 版本當 register（desired 帶簽章 artifact、A/B、actual 回報版本）或採 Mender client；二選一。**
6. **M-02 的種類數大家都少算 3～5 種**：HTTP stack、crypto library、Modbus library、Python 與 OS 的時鐘、Anthias、nginx、Docker（P2-longevity-02、P5-longevity-01、P6-longevity-07、P1-longevity-01、P3-longevity-02、P4-longevity-02）。重算後 P0 / P2 約 14～15、P5 約 13～15、P1 約 15～17、P3 約 15～16、P4 約 19～20。**結論：種類數不再是區分方案的主軸，安全邊界與 trunk 存活才是。**
7. **「買平台」的路線不成立，「買零件」成立。** ThingsBoard 4.4 起 BSL 1.1 的 100 devices 與一台 server 在 (a)(b) 第二個站點就撞（P4-longevity-01）；gateway 憑證是 tenant 範圍能力，一片 CM4 可替整站任何裝置說話（P4-security-01）；(c) 形狀仍要我們自己的簽章層（P4-security-03）。Hono / Ditto 貢獻者集中、無站點閘道概念；Kura / Kapua 帶 Java runtime；OpenRemote AGPL（`buy-options.md`）。可買的零件：Mosquitto、PostgreSQL、Grafana、Mender client、pymodbus 類 library。
8. **NATS 形狀同構但不建議當基底。** 內建 MQTT 只到 3.1.1 且維護者拒收 MQTT 5；2026 年 advisory 密集落在 MQTT / leafnode / subscribe deny filter；JetStream 語意要自己吃透；unit 仍要 SQLite；bridge 上的 nats-server 沒有升級通道（`nats.md`；P3-security-01、-02、-07；P3-longevity-01、-04）。
9. **MQTT 進來，但只進 bridge 的南邊。** 見 `40-mqtt-ledger/ledger.md`：不上 trunk、不載管理面、不持樹的憑證、不進最小部署；有觸發（T1 講 MQTT、D-06 要 SCADA、客戶自帶 broker）的站點在 bridge 旁放 Mosquitto，raw 與 n 兩個實例，node 是守門員；unit → bridge 第一版走 HTTPS。
10. **P6 的分期思路對，但分期不能分到安全上。** 第一個客戶不付 bridge、CA 工具鏈、broker 的本金是合理的；但 P6 自己的 Stage 0 / 1 在「hub 不能驗 token」「agent 沒有會過期的信任」「credential 走業務 register」上被判致命或重大（P6-security-01、-02、-04、-05）。**應用層簽章、可撤銷且會過期的身分、文件雜湊，從第一天就在；可以晚付的是 bridge、CA 工具鏈、broker、獨立 TSDB。**

## 2. 各提案的中期判定

| 提案 | 致命 finding（已完成的兩個 lens） | 它說對的事 | 中期判定 |
|---|---|---|---|
| P1 MQTT 原生 | 無致命；security 8 重大、longevity 7 重大 | 站內 MQTT 的具體做法（desired 帶 `v`、per-key sq/cq、presence `conn`、`R_resync`、`$SYS` drop 計數）；dynsec 四層圍堵 | **不採為基底**：(c) 兩條 trunk、broker 持樹憑證、最小部署 3 服務、管理面綁 topic。站內做法借走 |
| P2 HTTPS pull 強化 | longevity-01（無 OTA） | 02 帳單逐條裁決；持久串流取代 long-poll；link-down 事件；consumer API；MQTT ingress 可選 | **最接近基底**，但必須補：OTA、PKI 生命週期、簽章綁收件者、文件雜湊、備份對帳、憑證寬限期；ingress 改成獨立 process 或獨立 Mosquitto raw 實例（P2-security-02） |
| P3 NATS 葉節點 | security-01（unit 無信任錨）、longevity-01（bridge 上無 nats-server 升級路徑） | 形狀同構的論證；T1 ingress 用獨立實例的做法 | **不採為基底**；KV / stream 的語意對映可作日後 trunk binding 的參考 |
| P4 買（ThingsBoard） | security-03（(c) 形狀）、longevity-01（(a)(b) 授權） | F-46/F-47 的「服務端狀態機」確實是買得到的東西；Modbus connector 設定檔是 D-03 的參考範本 | **不採**；零件層借 Mender 與現成 connector 的設計 |
| P5 語意不變、傳輸可換 | 無致命；security 7 重大、longevity 6 重大 | (A) 契約 + conformance + memory binding；「縫切在站內與跨網路之間」；T-a / T-b / T-c 觸發；M-01 的刪除規則 | **(A) 全採；(B) 的 MQTT binding 延後**，且若採則 `sig` 在所有 binding 必填、管理面 slot 仍走 HTTPS（P5-security-01、-02） |
| P6 最小主義 | security-01（hub 不能驗 token） | 分期與觸發表；第一個客戶的真實需求；Odoo 已 proven 的部分不要重寫 | **分期思路採，Stage 0 / 1 的安全設計不採**（見 §1 第 10 點） |

## 3. 暫定的平衡方案

以下是依目前證據最合理的輪廓。每一條都標註它來自哪裡；標「待波次 C」者表示尚未經過反駁與完整性批評。

### 3.1 契約
- P0 的語意層原封保留：register（desired / actual，done = actual.version == desired.version）、SQ / CQ（job 依 key 執行一次、結果耐久於裝置 SQLite）、announce / config space（功能 class、schema、capability 先宣告才有資料）、owner 持有事實。
- 採 P5 (A)：一份語言中立、傳輸中立的規格，加 conformance suite，加 in-memory binding 當 N-16 / N-17 的 fake transport。契約規格列為獨立工件，有變更流程與版本政策（P5-longevity-01）。
- 第一版只有一個生產 binding：HTTPS 串流（child 撥出；watch with cursor；keepalive 25 s；jitter backoff；`Retry-After`；ETag / 304；cursor 過期 410）。
- announce 帶版本協商；相容性矩陣寫明「哪個 node 版本能和哪個 bridge 版本講話」；升級順序 parent 先。

### 3.2 身分與 PKI（整章待外部審查）
- 工廠預置：環境 CA 公鑰、root 簽章公鑰、environment id；unit 在裝置上產鑰、CSR 綁 serial；bootstrap 憑證只能 announce，不能拿 desired。
- adopt 後營運憑證有效期 7～30 天、50% 時續期、過期 N 天內且不在撤銷清單者可寬限續期（只開放 report 與續期）；announce 回應帶 parent 時間供無 RTC 裝置在 NTP 前鬆弛驗證。
- 撤銷：簽章的 revoke 訊息 + 撤銷清單沿樹鏡像、帶新鮮度；離線 bridge 的接受窗口寫成數字；bridge 自己的憑證同樣短效可撤銷。
- 中繼 CA 私鑰與 root 簽章鍵：獨立 OS user、加密保管、與狀態備份分流、escrow；憑證鏈與簽章內容帶 environment id，staging 還原天然失效（N-04）。根 ≥ 15 年、中繼 2～3 年含重疊期；信封帶 `alg` 與版本欄；`trust_anchors` 是一個 register，由現任金鑰簽新 anchor。
- 所有下行物件（desired、SQ entry、文件 pointer 內含內容雜湊、config、credential）端到端簽章，信封含 env / path / function / serial / issued_at；unit 拒絕非遞增 version 與超出新鮮度窗口的物件。上行 report / complete 同樣簽章，讓中間 bridge 不能偽造 children 的 actual（P2-security-03）。
- (c) 形狀：mTLS 可選（有 TLS 檢查 proxy 時由部署設定關閉並 pin 我們的 root），應用層簽章必備；退路不可被誘發降級（P2-security-01）。

### 3.3 樹與 trunk
- bridge 每個 device VLAN 一個；bridge 0 在 ERP 旁；一片螢幕的最小部署 = Odoo + bridge 0（node）兩個服務；螢幕直接以 bridge 0 為 parent。
- bridge → bridge 0 與站點 → 雲端一律 HTTPS 串流；bridge 0 ↔ ERP 統一為 pull-down / push-up（owner 第二輪已拍板）。
- bridge 0 第一天就有 consumer API（list + watch with cursor，與 child 的 watch 同一段 code），服務 ERP 與 history writer；token 不進 URL、可撤銷（P2-security-13）。
- 每個 retention window 明寫並有 drop 計數：CQ 保留、量測緩衝、watch cursor、文件快取、撤銷清單新鮮度。
- SQLite：WAL、`synchronous=NORMAL`、presence 與心跳只進記憶體、狀態變化才落盤、CQ 與 adopt / revoke fsync；備份用 online backup API 或 `VACUUM INTO`，不複製活檔（P2-longevity-05、-06）。

### 3.4 MQTT（放法 A，見 ledger）
- 預設不裝。觸發：T-a 某站點有需要 broker 語意的 T1 MQTT 設備；T-b D-06 站點要 MQTT / Sparkplug 類 SCADA；T-c 客戶自帶 broker。
- 觸發後在該 bridge 旁放 Mosquitto（唯一通過 M-05 + M-06 的 broker；dynsec plugin，不用 `acl_file` / `password_file`）：raw 實例只給 T1、publish-only `raw/<id>/#`、不持久化、資源上限收緊、只綁 T1 VLAN 介面；n 實例給 HMI 唯讀訂閱 bridge node 已驚證並重發的 retained last value；兩個實例都不持有樹的憑證、不載管理面、不上 trunk。
- node 訂 raw、做 F-31 / F-32 / F-01 / F-02 檢查後以自己身分經 HTTPS 往上 put；`$SYS` drop 計數進監控。
- unit → bridge 第一版 HTTPS；PoC 量到 fan-in 或 keepalive 成本顯著時再評估 P5 (B)。
- Sparkplug B 只當 D-06 資料面的可選方言，命令面絕不走它。

### 3.5 資料
- 最小部署不碰歷史（F-15）。
- 第一個要留歷史的感測器出現時：由我們管的獨立 PostgreSQL 實例（同引擎，M-02 種類不變，+1 要顧的服務），不放客戶管的 ERP 叢集（P2-longevity-08；`postgres-timeseries.md` §3.4）。窄表、月分區、DROP PARTITION、增量 roll-up SQL 由 node 排程。
- 量化搬遷門檻：單站樣本 ≳ 10～30 億筆，或 ERP 備份 / 還原被歷史拖大時，換 VictoriaMetrics 單機版（Apache-2.0；注意 downsampling 與 mTLS 在 Enterprise）。
- Grafana 留 ops，年度升版落在每個 major 最後一個 minor（`02-tradeoffs.md` §4）。

### 3.6 升級路徑（新增元件）
- node 自更新：node 版本是一個 register，desired 帶簽章 artifact pointer（內含雜湊），artifact 沿樹拉並在 bridge 快取，裝置 A/B 切換、失敗回滾、actual 回報 applied version。OS / Python 的升級另算，CM4 映像策略要寫進部署工件。
- 備案：Mender client（Apache-2.0）當 F-34 連接器，代價 +1 runtime、+1 server、+1 時鐘。
- 待波次 C 決定二選一；兩者都要重算 M-02 與人週。

### 3.7 邊緣 process 切分
- node 是唯一持有網路憑證的 process。
- function backend 各自獨立 process、只綁 localhost：display、LED、sensor、Modbus poller。解析外部位元組的 process（Modbus、MQTT raw 訂閱者）不得與持憑證的 node 同 process（P2-security-02、P3-security-05、P6-security-08）。
- Anthias：補 M-06 檢查（授權、最近 release、維護者），定退場觸發；F-61 的 reconcile 介面本來就是為換掉它設計的（P2-longevity-09、P6-longevity-04）。

### 3.8 ERP 邊界
- ERP 持有 desired 與 SQ，是 CMS 與管理 UI；bridge 0 執行憑證發行與 binding 寫入；N-05 的 writer 分工不變。
- 把 class driver 驗證、SQ 的 single-flight 與 deadline 考慮放進 bridge 0（它已持有 SQ 鏡像），讓 Odoo 年度大版遷移只剩 UI 與業務表（P2-longevity-07）。這是 03-brief §2 允許的妥協：F-41「queue owned by the ERP」改述為「ERP 持有 desired，bridge 0 持有排程」。待波次 C。
- 誰能按 Apply、誰能寫 ERP queue 就是 defacement 的真正門（P2-security-06、P6-security-09）：Odoo 權限模型與大範圖 publish 的帶外確認要進規格。
- staging 還原自動失效：Odoo 啟動時比對環境標籤，不符即 archive 連線（F-70）。

### 3.9 觸發表（什麼事件讓我們付下一筆）

| 事件 | 加什麼 | 來源 |
|---|---|---|
| 第一個客戶（幾片螢幕） | Odoo + bridge 0 + unit agent；契約 (A)；PKI 第一版；OTA | 本文 §3.1～3.6 |
| 第一個 T1 或 (b) 形狀有租戶鄰居 | 站點 bridge + VLAN 工件（N-01） | P6 §2.1 |
| 第一個要留歷史的感測器 | 獨立 PostgreSQL 實例 + writer + roll-up | §3.5 |
| 第一個講 MQTT 且需要 broker 語意的 T1，或 D-06 要 SCADA，或客戶自帶 broker | 該 bridge 旁 Mosquitto raw / n 兩實例 | ledger §3 |
| 第三個消費者 | consumer API 已在；只加一個 token 與授權範圍 | §3.3 |
| 單站樣本 ≳ 10～30 億 | VictoriaMetrics | §3.5 |
| bridge 0 ingest 持續超過門檻，或單站 1 Hz 機台數 > N | 直寫 store 後門（先 PoC；owner 第二輪已拍板） | `01-proposal-pcie-tree.md` §6 |
| T3 / D-05 動工 | 硬體金鑰簽 announce 與事件、attestation、lock / wipe | 管理表 T3 列 |
| 第二個 adapter 需要 saga | Workflow 模組（F-64、F-65） | 00 §4.3 |

## 4. 對 §9 開放問題的中期答案（相對 P0 的變化）

| 問題 | P0 的答案 | 中期修正 |
|---|---|---|
| NGSI 留不留 | 不留 | 不變；`buy-options.md` §3.3 確認 FIWARE 升版也解不掉 C-02～C-10 的命令語意缺口，且 Orion / IoTA 為 AGPL-3.0 |
| 註冊與憑證發行者 | bridge 0 執行，ERP 是按鈕，factory CA 是根 | 不變，但加：私鑰保管與備份分流、escrow、輪替、environment id 進鏈 |
| 裝置 channel | HTTPS mTLS long-poll | **HTTPS 串流 + 應用層簽章**；mTLS 站內預設、跨網路可選；Mosquitto 只在 bridge 南邊有觸發的站點 |
| 命令狀態住哪 | desired / SQ 在 ERP，actual / CQ 在裝置 | 不變；考慮把 single-flight 與 deadline 的執行放到 bridge 0 |
| 時序資料庫 | ERP 叢集內獨立 database | **我們管的獨立 PostgreSQL 實例**；最小部署不碰；VictoriaMetrics 為高端備案 |
| 告警 | 規則當 register 推下去、節點計算、事件上送 | 不變 |
| 最小部署 | Odoo + bridge 0 + 螢幕 | 不變（兩個服務），但誠實列出隱藏依賴：nginx、DNS、NTP、Anthias、OS / Python |
| Anthias 之後 | reconcile 留在 display backend | 不變，加 M-06 檢查與退場觸發 |
| Cloud ERP | bridge 0 在站點向雲端撥出 | 不變，加：mTLS 可選、簽章必備、keepalive ≤ 25～30 s |
| 信任根 | factory CA | **出廠預置環境 CA 公鑰 + root 簽章公鑰 + environment id**；裝置產鑰 |
| Control-Semantic | 樹只做管理面 | 不變；Sparkplug NCMD 側門要封（P1-security-10） |
| 備份與還原 | 每節點 SQLite 複製檔案 | **每個狀態庫各自的備份方式、還原後的對帳規則（bridge 0 為憑證與 binding 權威、ERP 為 desired 權威）、私鑰與狀態分流、還原演練進 N-17** |
| 邊緣 process | node + backends | 不變，加：解析外部位元組的 process 不與持憑證的 node 同 process |
| 自建邊界 | 不建 DB、瀏覧器、OS | 加：**不建 broker、不建 crypto、不建 TSDB 引擎**；可建的是協定、守門員、writer、roll-up、OTA 流程 |
| 管理中心 | ERP UI，bridge 0 執行 | 不變 |
| T1 代表誰建 | 操作員在 bridge 宣告，bridge 建立並 announce | 不變 |
| 直連 vs 走樹 | 全走樹，後門 PoC | 不變；D-06 HMI 例外：站內 broker 投影，不經樹上游 |
| 無人閉環 | 保留 | 不變 |
| south + gateway 合併 | 是 | 是，且 unit agent 也是同一支 node |

## 5. 本文的可信度邊界

- 沒有任何提案經過答辯：上面引用的 finding 可能有被答辯推翻的；但 §1 的十條都有三份以上獨立來源，風險低。
- correctness lens 未跑：F-46～F-54 在 HTTPS 串流 + 簽章 + SQLite 上的逐條驗證，目前只有提案自述（P2 §4）。
- scenarios lens 未跑：D-01～D-06 從 ERP 按鈕到裝置的完整流程沒有人逐步走過；一片螢幕的隱藏依賴只在 longevity 批評裡順帶出現。
- ecosystem lens 未跑：ledger 裡「第三方工具接入體驗」的價值評估是主審意見。
- 人週估計全部來自提案自述，未經評審。

## 6. 未完成與接續計畫

**未完成：**
1. 波次 B：P1～P6 的 correctness / scenarios / ecosystem 批評（18 份）、rebuttal（6 份）、score（6 份）。
2. MQTT ledger 的獨立覆核（本文與 `ledger.md` 皆為主審代寫）。
3. 波次 C：綜合 → 三位反駁者 → 完整性批評 → 修訂 → `final.md`。

**接續方式：** 本 session 已排一則自我提醒於 2026-10-13 21:20 UTC（上限重置後 20 分鐘）自動接續；trigger id 見 `LOG.md`。若 owner 想改時間或取消，可在 Routines 列表操作。波次 B 的 workflow 腳本已存於 session 的 `workflows/scripts/arch-review-wave-b-proposal-*.js`，以 `args {code, file}` 重跑；每個 workflow 同時只能跑 2 個 agent，要拆成多個 workflow 平行。

**在等待期間 owner 可以先決定的事：**
- OTA 二選一（自建 register 式 vs Mender client）。
- 是否接受「bridge 0 持有排程」的妥協（§3.8）。
- 獨立 PostgreSQL 實例是否可接受為「有感測器的站點 +1 服務」。
- PoC 清單的優先順序：CM4 上 node 的 fan-in；Mosquitto arm64 足跡與 hostile T1 的資源耗盡；客戶 proxy 對串流回應的緩衝；Rust vs Python 的 node 骨架；直寫 store 後門。
