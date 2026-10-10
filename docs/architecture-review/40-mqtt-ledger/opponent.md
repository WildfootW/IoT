# MQTT 反方：不把 MQTT 放進架構，我們到底得到什麼

> 波次 B，MQTT 辯論反方。日期：2026-10-10。輸入：`03-brief.md`、`00-requirements.md`、`01-proposal-pcie-tree.md`（P0）、`02-tradeoffs.md`、`10-facts/`（mqtt-semantics、mqtt-brokers、transport-through-networks、precedents、nats）、`20-proposals/P1～P6`。事實引用寫成「`檔名` 列號」，`10-facts/` 內所有列的查證日期皆為 2026-10-10；標「意見」者是我的判斷。本文的任務是把「不用 MQTT」的最強論證寫到底，所以它刻意單邊；誠實的讓步集中在 §4，不散在各處淡化。

## 0. 結論先講

owner 的問題是「MQTT 那邊的失去感覺差很多，我們到底為此得到什麼」。反方的回答：**得到的不是抽象的「少一種東西」，而是六樣可以點名、可以量化的東西**；失去的五樣裡三樣在事實面前縮水、一樣是負資產、只有一樣（第三方工具「訂了就能看」的接入體驗）真的補不回來。

1. **跨客戶網路那一跳的存活。** 在 (c) 形狀（M-03、F-41）只有 HTTPS 上的應用層協定不需客戶讓步就能活；MQTT/TLS 8883 在「只放 443」的網路直接死，搬到 WSS 443 後面對的是同一組 proxy 問題再加 Upgrade 與長連線（`transport-through-networks.md` §5 表、T15）。連 P1 自己都承認 Mosquitto 沒有 bridge-over-WebSocket，(c) 形狀要靴帶出第二條 trunk 程式路徑（P1 §1 弱點 2、§8 第 1 點）。
2. **語意層一行都不會少寫，所以 MQTT 買不到正確性。** F-46/F-47 要的版本、CAS、job key、去重、結果槽、deadline、簽章在 AWS/Azure 都是服務端自己做的，MQTT 只是搬運（`mqtt-semantics.md` §1 第 1 點、§5 表；MQ14、MQ15、MQ23）。這是 P1 自己列的第一弱點（P1 §1）。
3. **種類數 +2～+4、外部時鐘 +2、設定方言 +2、最小部署 2 → 3 個服務**（P1 §2、§7；P5 §2 表；P3 §7）。
4. **安全審查面少一倍。** 單一 binding = 一份審查；MQTT binding 多出 broker 的 C 解析器、dynsec 產生器、`check_retain_source` 的撤銷副作用、WSS trunk 的身分流程（P5 §1 弱點 1、P1 §3.3、§8 第 2 與第 4 點；`mqtt-semantics.md` MQ9）。
5. **e2e 矩陣減半**：N-18 的三種形狀 × 一種傳輸 = 3，而不是 × 2 = 6（P5 §7），P1 在 (c) 形狀還要多測一條 trunk。
6. **人週：第一次交付少付 3～4 人週**：P1 自己估 MQTT 省掉 2～3 人週的 long-poll、多付 3～4 人週的 broker 包裝與 WSS 備援，「大致持平或略高」（P1 §9）；P1 說回收在第二個消費者，但 P2 的 consumer API 是 1～2 人週的自己的 code，不是永久的 runtime。

對 02-tradeoffs §1 那段的裁決：**02 算的是單邊帳**。它列了 MQTT 的五樣好處，沒有列 MQTT 自帶的五樣成本（外部時鐘、靜默丟棄的 queue、retained 的六個陷阱、第二條 trunk、ACL 寫錯即 C-09 重現）。P2 §1.1 的裁決大體正確，我在 retained 一項推翻 P2（從「部分」改判「負資產」），在 D-06 與生態兩項補強。

最後一節給出「若 owner 堅持要 MQTT」的最不傷放法：Mosquitto 只當**站內的投影與入口**，永不上 trunk、永不承載管理面、永不持有樹的憑證、不進最小部署、unit 自己那一跳也不走它。

## 1. 正面回答：不用 MQTT 具體得到的每一樣東西

每一項先給事實，再給量化，再標它屬於哪個評分準則（03-brief §3）。

### 1.1 (c) 形狀的存活率（R1、R2）

**事實。** `transport-through-networks.md` §5 的存活表（研究員標為推論，來源中沒有任何量化存活率）：在「只放 443、無 TLS 檢查」「只放 443、有 TLS 檢查 proxy」「放行任意 outbound TCP」三種客戶網路下，HTTPS long-poll 的評等是高／中高／高；MQTT/TLS 8883 是低／低／高；MQTT over WSS 是中高／中／高。Azure 文件原話「many corporate and educational firewalls block the MQTT port (TCP port 8883)」（T15，摘要）。idle timeout 主流預設 60 秒（T7 原文、T8 摘要），持久連線要自己送 keepalive 且 ≤ 30 秒才穩（T16 推論）；mosquitto 的舊 libwebsockets listener 只提供縮減的 TLS 選項，不含 `require_certificate`（T14 原文）。

**P1 自己的承認。** Mosquitto 的 WebSocket 只有 listener 端，bridge 的 `address` 只接受 MQTT 連線，沒有 bridge-over-WebSocket（P1 §1 弱點 2，P1 自行直讀 man page 與 ChangeLog）。所以 P1 在 (c) 形狀設計了**兩條 trunk**：預設 Mosquitto bridge 走 8883，客戶有 TLS 檢查 proxy 時切到 node 自寫的 WSS trunk（P1 §3.2 (c)、§3.4）。P1 §8 第 1 點：「兩條路徑的 topic 方向與 QoS 行為若有一處不同，就是 e2e 才會抓到的 bug」。

**量化。** 三種客戶網路裡 MQTT/TLS 有兩種是「低」，HTTPS 零種。不用 MQTT 得到的是：(c) 形狀只有一條 trunk 程式路徑，不需要為「客戶 IT 某天啟用 TLS 檢查」準備切換邏輯。

**誠實註記。** 這個優勢來自「跑在 HTTPS 上」，不是 long-poll 特有（`transport-through-networks.md` §5 結論 1）；客戶正向 proxy 的緩衝行為沒有文件（同檔 §4 第 5 點），P2 的串流與 P1 的 WSS trunk 在此是同一條船。

### 1.2 語意層不會少寫，所以 MQTT 買的只是傳輸（R3）

**事實。** `mqtt-semantics.md` §5 逐條對照 F-46～F-54：MQTT 原生給的是 retained 槽、persistent session queue、Will、Response Topic / Correlation Data、Message Expiry、扇出；它不給版本、CAS、idempotency key、結果的耐久儲存、端到端 ack、dedupe、deadline、簽章。Azure device twin 的 `$version` 與 ETag、AWS Shadow 的 version 與 delta、AWS Jobs 的狀態機全在服務端（MQ14、MQ15、MQ23）；Sparkplug 的 NCMD 是 QoS 0、無 command id、強制 Clean Session（MQ19、MQ20）。P1 §1 弱點 1 原文：「評審若以 R3 給分，P1 與 P0 的差距接近零，P1 還多了 broker 持久化設定這一組新的 retention window」。

**量化。** 在 R3 這 15 分上 MQTT 的淨貢獻是零或負。P1 §4.3 列了 10 個 retention window，其中 6 個由 broker 持有（persistence autosave、`max_queued_messages`、`persistent_client_expiration`、sq 的 Message Expiry、m 的 Message Expiry、Will Delay / keepalive）；P2 §4.3 列 9 個，全部由我們的 code 持有。不用 MQTT 得到的是：**少 6 個由別人的預設值決定、超限時對發布端靜默（MQ11）、過期時懶惰清除（MQ9）的 window**。

### 1.3 種類數、外部時鐘、設定方言、最小部署（R4、R6）

| 計量 | 不用 MQTT（P0 / P2 / P5 標準 / P6） | 用 MQTT | 來源 |
|---|---|---|---|
| 種類數（P5 的計法） | P0 = 11；P2 標準 12 | P1 = 14～15；P3 = 14；P5 MQTT 站點 = 13；P2 D-06 站點 = 13 | P5 §2 表；P1 §2（P1 自己的計法是 13 → 15，淨增 +2） |
| 新增外部時鐘 | 0 | Mosquitto（2.1.2 = 2026-02-09，之後約 8 個月無 tag；master commit 幾乎全為一人）、MQTT client library（paho-mqtt 2.1.0 = 2024-04-29，之後約 29 個月無新版；rumqttc 仍 0.x） | `mqtt-brokers.md` 列 2；P1 §2、P5 §2（PyPI / crates.io，2026-10-10） |
| 新增設定方言 | 0 | `mosquitto.conf`、dynsec JSON | P1 §2、P5 §2 |
| 將被移除的選項 | — | `acl_file`、`password_file`、`per_listener_settings` 在 2.1 列為 deprecated，預計 3.0 移除 | `mqtt-brokers.md` 列 8 |
| 最小部署服務數 | 2（Odoo + node） | P1 = 3、P3 = 3 | P1 §7、P3 §7、P0 §5 |
| CM4 agent 的傳輸 client 數 | 1（HTTPS） | 2（MQTT + HTTPS；媒體與文件不走 MQTT） | P1 §6 D-01、§7 F-56 列 |

最後一列值得單獨講。P1 承認螢幕文件與媒體不走 MQTT（`max_packet_size` 預設 2 MB），unit node 必須同時是 MQTT client 與 HTTPS client，「這是 P1 必須承認的第二種傳輸」（P1 §6 D-01）。**MQTT 沒有取代 HTTPS，它是加在 HTTPS 上面的。** 不用 MQTT 得到的是 CM4 上只有一套傳輸 stack、一套重連邏輯、一套 keepalive。

**M-06 的時鐘要怎麼讀（意見）。** Mosquitto 是候選 broker 裡時鐘最慢、授權最乾淨的（`mqtt-brokers.md` §3.1；P2 §1 第 3 點同）。但「時鐘慢」不是「沒有時鐘」：一個 8 個月沒有新 tag、commit 集中一人的 C 程式站在 hostile T1 正面（P1 §3.3、P6 §8 第 10 點），下一個 CVE 若要等三個月，fleet 就暴露三個月（P1 §8 第 9 點）。P1 的緩解「EDL 允許我們自己 patch」等於把它變成自己要維護的 C code。

### 1.4 安全審查面（R2）

**事實。** P5 §1 弱點 1：「兩個 binding 就是兩套圍堵實作、兩套 e2e 矩陣……安全審查（02 §3 第 5 項）要付兩份」。P1 §3.3 誠實處：「圍堵邊界是 Mosquitto 這支 C 程式的封包解析與 dynsec 的正確性，而且同一支程式同時持有往上游的 bridge 憑證」；2.0.19 修過 bridge 收惡意封包 crash、2.0.21 修過已驗證 client 的惡意 SUBSCRIBE 造成 leak（`mqtt-brokers.md` 列 10）。`check_retain_source` 預設 true：發布者憑證輪替或 ACL 被撤後，既有 retained desired 對新訂閱者消失（MQ9；P1 §8 第 4 點把它列為 runbook 項目）。P1 §7 F-17 列：「ACL 寫錯 = C-09 重現」。NATS 路線更明顯：2026 年兩批 advisory 多則直接落在 MQTT listener、leafnode 轉發、subscribe deny filter（`nats.md` N17），P3 §1 弱點 1 承認圍堵邊界「從 process 退回 server 內的 permission」。

**量化。** 不用 MQTT 時要審的安全程式碼：node 的 HTTP 解析器、PKI 與 bootstrap/adopt/revoke、應用層簽章、consumer token。用 MQTT 時另加四項：broker 封包解析器（別人的，但站在我們的邊界上）、dynsec / ACL 產生器（我們的）、retained 與撤銷的交互（runbook）、第二條 trunk 的身分流程（P1 §3.4 的 site secret 輪替）。**審查面 +4 項、審查預算 ×2。**

### 1.5 e2e 矩陣（R3 的 N-17、N-18）

N-18 要求每種部署形狀上線前都 e2e 過。不用 MQTT：3 形狀 × 1 傳輸 = **3** 條 trunk 配置。P5：3 × 2 binding = **6**（P5 §7「e2e 矩陣 × 2」）。P1：(c) 形狀兩條 trunk，至少 **4**，另加 P1 §9 PoC 表列的「bridge QoS/retained 跨兩層」「persist-sqlite crash」「dynsec + cert-username 互動」三項 Mosquitto 專屬驗證，其中最後一項 man page 沒寫，P1 標未查證（P1 §3.4）。**不用 MQTT 得到的是矩陣減半，以及少三個要先 PoC 才知道能不能用的未知。**

### 1.6 人週（R8）

| 來源 | 估計 | 讀法 |
|---|---|---|
| P1 §9 | 合計約 18 人週；「省掉自製 long-poll 與 reconnect 約 2～3 人週，多出 Mosquitto 包裝、dynsec 產生器與 WSS trunk 備援約 3～4 人週，第一次交付大致持平或略高」 | MQTT 在第一次交付是淨 +0.5～+1.5 人週，再加 1.5 人週 PoC |
| P5 §9 | MQTT binding 3～4 人週，等觸發再付 | 不用 MQTT 省 3～4 人週 |
| P2 §9 | MQTT ingress 1.5～2 人週 + D-06 Mosquitto 消費者 1～2 人週，等觸發再付 | 同上，且拆成兩筆可各自不付 |
| P6 §9 | Stage 2 才裝 Mosquitto，第一個客戶不付 | 同上 |

P1 說回收在第二個消費者出現時「P0 要寫 consumer 概念，P1 寫一條 ACL」（P1 §9）。對照：P2 把 consumer API 當第一天就有的東西，與 child 的 watch 同一段 code（P2 §4.4；P5 §5 第 2 點同），P6 估第三個消費者出現時 2 人週（P6 §7）。**2 人週的自己的 code，對上一個永久的外部 runtime 加兩個時鐘**；意見：這筆回收算不過來。

### 1.7 一條不在清單上但真實的得：單一程式路徑持憑證（R2、M-04）

P0 §4：node 是唯一持有網路憑證的 process。P1 把 bridge 的上游憑證放進 Mosquitto（`bridge_certfile`，`mqtt-brokers.md` 列 4），T1 連進同一支程式。P1 §3.3 的「第二個 Mosquitto 實例」與 P3 §3.2 的「獨立 ingress nats-server」都是在補這一刀，各多一個 process。不用 MQTT 時，這一刀不存在。

## 2. 逐一拆解 02-tradeoffs §1 的「失去」

02 §1 MQTT 那段列的失去：pub/sub 扇出、retained、last-will、T1 講 MQTT、D-06 HMI 沒有答案，加上「IIoT 通用語」的生態主張。P2 §1.1 已裁決過一次；下表是我的裁決，與 P2 不同處標明。

| 02 §1 的項目 | P2 §1.1 裁決 | 反方裁決 | 一句理由 |
|---|---|---|---|
| 扇出：第 N 個消費者不用動裝置 | 成立 | **成立，但金額算錯** | 失去的是「免費」，不是「能力」；替代是 1～2 人週的 consumer API，且 02 沒記 ACL 維護這筆對應成本 |
| retained | 部分 | **推翻：是負資產，不是失去** | 六個陷阱（§2.2），兩大雲端都不這樣做 |
| last-will：秒級 vs 五分鐘 | 部分 | **同意 P2，補強** | P1 自己把 Will 降為「可疑」提示（P1 §4.5） |
| 幾乎所有 PLC 閘道與感測器廠商講 MQTT | 未查證 | **同意，補強** | 錨點 5 與 D-03 的優先清單全是 Modbus；ingress ≠ broker |
| D-06 HMI 在 P0 沒有答案 | 成立 | **成立缺口，推翻「MQTT 是答案」** | 三條答案中 MQTT 排第三，且是消費者側、不在信任鏈 |
| IIoT 通用語、生態 | （P2 未單列） | **部分推翻** | 傳輸的生態不是語意的生態；M-05 + M-06 下可用的 broker 實質上只有一個 |

### 2.1 扇出

**02 說的是對的**：MQTT 的扇出是原生的（`mqtt-semantics.md` §5 F-49 列），第 N 個消費者在對應層級的 broker 訂閱即可，不動裝置。

**算錯的地方。** 第一，它把「免費」當成「失去」。替代是 bridge 0 與每個 bridge 的 consumer API：list + watch with cursor（k8s 與 Tailscale 的做法，`precedents.md` e17、e18），與 child 的 watch 同一段 code（P2 §4.4、P5 §5），1～2 人週（P6 §7）；cursor 過期是明確的 410，不是 Orion `maxFailsLimit` 的靜默停用（C-05）。第二，02 沒記扇出的對應成本：MQTT 的「只知道 parent」（F-17）由 ACL 實現而非結構，P1 §7 自己承認「ACL 寫錯 = C-09 重現」，每個消費者是一條 dynsec 規則，每次 adopt 要自動跑拒絕測試（P1 §8 第 2 點）。第三，02 §1 末段的「bridge 0 必須長出 consumer 概念」是 02 自己在 §3 第 2 項列為第一天要做的事，不是 MQTT 獨有的優勢。

**真的失去的部分**：見 §4 第 1 點。

### 2.2 retained：推翻 P2 的「部分」，改判負資產

P2 說 retained 是「無版本、無 CAS、單槽、依賴 persistence 設定的快取」，bridge SQLite 裡的 desired 鏡像就是「有版本的 retained」（P2 §1.1）。我同意，並且要再往前一步：**retained 不只是比較差的快取，它在我們的情境裡會主動製造工作。** 六個陷阱，每個都有來源：

1. **預設不落盤。** Mosquitto `persistence` 預設 false，重啟即失；`autosave_interval` 預設 1800 秒；2.1.0 才有 `persist-sqlite` plugin，crash 行為未查證（MQ10；`mqtt-brokers.md` 列 9；P1 §8 第 5 點）。
2. **撤銷的副作用。** `check_retain_source` 預設 true：發布者 ACL 被撤或憑證輪替後，它過去發布的所有 retained 對新訂閱者消失（MQ9）。P1 §8 第 4 點：root adapter 憑證輪替後「第一台重連的 unit 收不到 desired，直到 `R_resync` 全量重發」，要寫進 runbook。P5 §8 第 2 點同。
3. **懶惰過期。** 過了 Message Expiry 的 retained 預設只在下次被存取時才移除，要主動掃描須設 `retain_expiry_interval`（MQ9）；P1 §5 把 F-04「沒有資料看起來就是沒有」的成立條件綁在這個行為上，要 e2e 驗證。
4. **last-writer-wins 單槽 = C-07。** P1 §8 第 3 點原文：「retained 是 last-writer-wins 的單槽，與 C-07 是同一種東西」，靠「只有 root adapter 有 desired/sq 寫入權」這條 ACL 規則守住。
5. **鬼 topic = C-08。** unit re-plug 到另一個 bridge 後舊 path 下的 retained 還在，「像 C-08 佇列中的命令在裝置刪除後仍存在」，root adapter 改 path 時必須對舊 path 發空 retained 清除，「忘了就會有鬼」（P1 §8 第 7 點）。
6. **F-46 的窗口。** P1 §7 承認 retained 快取在 broker 重啟到 owner 重發之間是「事實暫時只在 owner、快取尚未恢復」的窗口，幾秒到 1 小時。

旁證：Azure IoT Hub 不持久化 retain（MQ13），AWS Shadow 是服務端版本化文件而非 retained（MQ15）。**結論**：P0/P2 的 SQLite desired 鏡像有版本、有 owner、不會因為憑證輪替消失、不會留鬼；retained 的「late-joiner 拿到最新值」在 P2 是 watch 的第一個 frame 是完整快照（P2 §3.4 (1)）。這一項 02 記成「失去」是記錯方向。

### 2.3 last-will

**P2 的「部分」成立，我補三點。** 第一，Will 的觸發是 keep alive × 1.5（MQ8），是設定不是能力；P0 的 5 分鐘（F-27、N-15）也是設定。第二，Will 是 broker 端對連線的判斷，F-27 要求以裝置自己的報告時間判斷，兩者不等價（`mqtt-semantics.md` §3.3）；Sparkplug 自己要用 `bdSeq` 處理 Will 晚於下一個 NBIRTH 的競態（MQ21）。第三，**P1 自己把 Will 降級了**：P1 §4.5 的設計是「presence 只會把 Fleet 的狀態標成『可疑』，online/offline 的判定仍是 unit 每 120 s 的裝置時間，5 分鐘沒有新的裝置時間才 offline」。也就是 P1 的離線判定與 P0 一樣是五分鐘，Will 只是加一個「可疑」提示。

**替代做法。** P2 §3.4 (2) 的兩級 link 偵測：parent 看到串流關閉或連續兩次心跳 frame 沒到就標 `link-down`（秒到一分鐘），語意等同 Will；`offline` 以裝置報告時間判定，預設縮到 90 秒。+0 種類。02 寫的「五分鐘 vs 秒級」在 P2 消失。

**代價**：keepalive、watchdog、jitter backoff 是自己寫的（P2 §3.4 (3)(4)）；Mosquitto 的 bridge 這些都是現成的（`mqtt-brokers.md` 列 4）。這筆記在 §4 第 2 點。

### 2.4 T1 講 MQTT

**P2 的「未查證」成立。** 事實面：T1 設備的 MQTT 版本分布沒有任何事實（`nats.md` §3.5 亦標未查證）；錨點 5 的原文是「Modbus RTU/TCP 為主，部分可能講 MQTT 或 HTTP」；D-03 的優先清單（電力、差壓、門磁、壓縮空氣）全是 Modbus；D-06 的 edge controller 是否講 MQTT「blocked on partner's PLC data」（00 §3）。02 寫「幾乎所有 PLC 閘道和感測器廠商都講它」，在這份需求裡沒有一個已知的 T1 講它。

**02 還算錯的地方。** 「T1 若講 MQTT，bridge 要多一個 MQTT adapter」被記成失去，但 adapter 與 broker 是兩件事：adapter 只收四種封包（P2 §8 第 3 點），1.5～2 人週，等第一個講 MQTT 的 T1 出現再付（P2 §9）。而即使在 P1 的全 MQTT 架構裡，T1 進來的也是 `raw/<id>/#`，bridge node 仍要做 schema、限速、時間戳檢查後重發，P1 §3.3 原文：「這與 P0 §1 第 5 點是同一段程式，只是輸入從 HTTP body 換成 MQTT payload」。**兩案要寫的守門員程式相同，差別只在收封包的是我們的 adapter 還是 Mosquitto。**

**真的失去的部分**：若 T1 需要 broker 語意（它要訂閱、要 QoS 1 的下行、要 retained），library 式 adapter 不夠（`mqtt-brokers.md` §3.2 意見：「不應承擔安全邊界」；三個候選 library 的 bus factor 都差，列 30、32、33）。記在 §4 第 4 點。

### 2.5 D-06 的現場低延遲 HMI

**缺口成立**（02 原文、P2 同意）。**「MQTT 是答案」不成立。** P2 §6 D-06 列了三條：(i) HMI 直接訂閱 edge controller——它本來就是機台自己的 HMI/SCADA 來源，我們只旁路觀測（N-21），這也是 D-06 原文「recipes, temperature control stay local on the edge controller」的形狀；(ii) bridge 開一個本地 SSE/NDJSON consumer endpoint 給 web HMI，LAN 毫秒級，+0 種類；(iii) 客戶要 MQTT/Sparkplug 風格的 SCADA 時，在 bridge 旁放一個 Mosquitto，bridge 以 client 身分把已通過 schema 的遙測發到本地 retained topic，「Mosquitto 在 HMI 的 VLAN，不在 T1 VLAN，不持有樹的憑證，只是一個 consumer」。P4 的答案是 Edge 本地儀表板與 WebSocket，不是 MQTT（P4 §5）。

**量化**。MQTT 只在 (iii) 出現，是消費者側、不在信任鏈、刪掉它 < 1 人週（P2 §9）。D-06 目前 blocked；為它把 broker 放進每個 bridge 的信任鏈（P1）或每個 leaf（P3），是 M-01 說的為原因還沒出現的元件先付維護費。

### 2.6 生態：「IIoT 通用語」

**事實面的生態比口號薄。** `mqtt-brokers.md` §1：對 M-05 + M-06，EMQX 出局（BSL 1.1，且排除嵌入第三方產品，列 18）；FlashMQ 要法務（OSL-3.0，列 27）；HiveMQ CE 沒有 bridge（列 22）；Aedes 沒有 outbound bridge、2026 年四則 advisory（列 36、37）；mochi 閒置 19 個月（列 34）；rumqttd 曾 21 個月無版本（列 30）；amqtt 只有 3.1.1、個人帳號（列 33）；paho-mqtt 29 個月無新版（P1 §2）。NATS 內建 MQTT 只到 3.1.1，維護者明確不收 MQTT 5 PR（`nats.md` N11）。**實質可選的 per-bridge broker 是一個：Mosquitto**，而它的近況是 8 個月無 tag、commit 一人（列 2）。這是「通用語」的供給側。

**更根本的錯：傳輸的生態不是語意的生態。** 02 §1 說 NGSI 走了之後「沒有任何第三方工具天生懂我們的協定」；用了 MQTT 這句話一樣成立。第三方工具懂的是 CONNECT/SUBSCRIBE，不懂 `iot/<env>/<path>/sq/<job_key>` 的 JSON 信封與版本號。P1 §9 自己承認「可逆性最差的一塊是 topic 契約本身」，02 §1「協定是自己的」那一刀在 P1 一樣成立；P5 §1 弱點 2 說它的 MQTT binding 對第三方「看起來像一個保守的、每個 topic 都帶版本號的 MQTT」。Grafana 的 MQTT datasource 只做即時不存歷史（P1 §2）；Home Assistant 不支援 ActiveMQ、RabbitMQ 的 MQTT plugin（`precedents.md` e24），broker 相容性本身是要維護的知識。

**真的失去的部分**：見 §4 第 1 點。

### 2.7 02 的帳算錯在哪：單邊記帳

02 §1 MQTT 那段只有「失去」欄，沒有「MQTT 自帶的成本」欄。這份對帳把它補上：

| 02 記的失去 | 02 漏記的對應成本 | 來源 |
|---|---|---|
| 扇出 | ACL 寫錯 = C-09 重現；每個消費者一條 dynsec 規則要測 | P1 §7、§8 第 2 點 |
| retained | §2.2 的六個陷阱 | MQ9、MQ10；P1 §8 第 3、4、5、7 點 |
| last-will | 假 offline（NAT 半開、Wi-Fi 漫遊、broker 重啟），需 Will Delay、`conn` 序號、去抖、hysteresis | P1 §8 第 8 點；MQ3、MQ21 |
| T1 講 MQTT | 守門員程式一樣要寫；broker 站在 T1 正面 | P1 §3.3；`mqtt-brokers.md` 列 10 |
| D-06 HMI | +1 runtime 在該站點 | P2 §6 |
| 生態 | +2 時鐘、+2 方言、3.0 要移除三個選項 | 列 2、8；P1 §2 |
| （未列） | (c) 形狀兩條 trunk；最小部署 3 服務；queue 超限靜默丟棄 | P1 §1 弱點 2、§7；MQ11 |

另一筆要修正的是 02 §2 的理由：「IoT 業界走 broker 優先，是因為裝置是電池供電、8-bit MCU、不能掛連線」。`precedents.md` §1 第 2 點：AWS/Azure 官方文字給的理由是 server push 與離線期間的訊息，不是電池（e03、e08）；電池說法未被證實。這對反方不利，所以要說清楚：**P0 「插電 Linux 所以不需要 MQTT」只對一半**，正確的反方理由不是「我們不是電池裝置」，而是「server push 由 HTTPS 串流提供（P2 §3.4、e17、e18），離線訊息由 owner 的 SQLite 與重讀提供（F-46），broker 的這兩項賣點我們都有自己的、而且是 F-46 本來就要求的東西」。P0 §3 寫的「不用 MQTT（理由：多一種要維護的東西）」是最弱的理由，P2 §1.2 已這麼判，我同意。

## 3. 把六份提案放在同一張尺上

| 提案 | MQTT 在哪 | 最小部署服務數 | 種類數 | 上 trunk 嗎 | 承載管理面嗎 | broker 持樹憑證嗎 |
|---|---|---|---|---|---|---|
| P0 | 無 | 2 | 11 | — | — | — |
| P2 | 可選 ingress library；D-06 站點可選 Mosquitto 當消費者 | 2 | 12 / 13 | 否 | 否 | 否 |
| P6 | Stage 2 才裝 Mosquitto，hub 旁，T1 面前 | 1～2 | — | 否 | 否 | 否（hub 持 site token） |
| P5 | 站內 hop 的第二個 binding，含 unit 自己那一跳 | 2 | 11 / 13 | 否 | 否（刻意不綁） | 否（node 是邊界） |
| P1 | broker 就是樹，管理面也走 MQTT | 3 | 14～15 | 是（8883 + WSS 兩條） | 是 | 是 |
| P3 | NATS 內建 MQTT 3.1.1 listener | 3 | 14 | NATS leaf | 是 | 是（P3 自提獨立 ingress 補救） |
| P4 | IoT Gateway → Edge 用 MQTT；HMI 用儀表板 | 3（含 JVM） | 16～17 | gRPC | ThingsBoard | — |

意見：MQTT 的傷害不是「有沒有」，而是「放在哪」。放在 trunk 與管理面（P1、P3）時，§1 的六樣得到全部失去；放在站內投影（P2、P6）時只失去「該站點 +1 runtime」。這是 §5 的依據。

## 4. 誠實：不用 MQTT 真的失去、替代不了的東西

反方不假裝下面這些不存在。

1. **第三方工具「訂了就能看」的接入體驗。** 我們的 consumer API 是我們的；沒有任何 HMI、Node-RED、Ignition、Grafana datasource 天生會講它。要讓它們接上，要嘛寫 adapter、要嘛放 Mosquitto。這是 R5 上真實且無法用自己的 code 補回的分數，是 §5 存在的理由。
2. **二十年的連線處理。** 02 §1 說的 reconnect storm、half-open、retry 放大，Mosquitto 的 bridge 已有 jitter backoff、`cleansession false`、`try_private`（`mqtt-brokers.md` 列 4、5）；P2 的持久串流與退路是設計不是實測，客戶正向 proxy 的緩衝行為沒有文件（`transport-through-networks.md` §4 第 5 點）。對**站內** hop，MQTT over TCP 比我們的串流更經過考驗；我們選擇重新發現其中幾個問題，這筆 02 算對了。
3. **成百條持久連線的 fan-in。** bridge 要在 CM4 級硬體上維持幾十到幾百條掛著的串流，這是 broker 的本職，而我們的 node 沒有實測；P2 §8 第 5 點承認 bridge 0 多了「所有 children 的連線同時斷」的重啟形態。
4. **需要 broker 語意的 T1。** 若 T1 要訂閱、要 QoS 1 的下行、要 retained，library 式 adapter 不夠（`mqtt-brokers.md` §3.2）；那時要放真 broker。P5 §1.1 的 T-a 觸發描述得對。
5. **D-06 若是 Sparkplug / Ignition 類 SCADA。** `mqtt-semantics.md` §3.5 判定 Sparkplug 的資料面適合這層；沒有 broker 就接不上。P2 的第三選項與 P5 的 T-b 都承認。
6. **事件型資料。** D-05 的刷卡、出勤天生是訊息不是 register（02 §1、P3 §6 D-05）。P2 用 SQLite event log + cursor、P5 用「每個事件一個唯一 key 的 slot」模擬，P5 §8 第 6 點自認是「契約最弱的用法」。訊息系統在這裡比較自然，這是真的。
7. **詞彙。** 「我們用 MQTT」是客戶 IT、PLC 廠商、新進工程師都認得的一句話；「我們有自己的 HTTPS 串流協定」不是。對 D-05 的「平台有什麼認證」（02 §1）兩案都只能回答「外部審查報告」，Mosquitto 不替我們的 PKI 背書；但在招聘與對外說明上，這是反方付的隱性成本。
8. **Mosquitto 的時鐘比 §1.3 講的更溫和。** 授權乾淨（列 1）、Eclipse 治理、二十年攻擊面歷史。反方的 M-06 論證對 NATS（5～7 個月一 minor、無 LTS、advisory 密集，`nats.md` N17、N20、N21）與 EMQX（改授權）很強，對 Mosquitto 只是中等。
9. **P0 寫的理由是錯的。** 「多一種要維護的東西」不是不用 MQTT 的理由，§1.1 與 §1.2 才是。若 owner 的「失去感」來自 P0 給了一個弱理由，那個感覺是對的。

## 5. 如果 owner 堅持要 MQTT：最不傷的放法

目標：保住 §1 的六樣得到裡的五樣，只付「有觸發的站點 +1 runtime」。規則由嚴到寬排列，前七條是硬規則，違反任何一條就會失去 §1 的某一樣。

1. **永不上 trunk。** bridge → bridge 0、站點 → 雲端一律 HTTPS 串流（P5 §1.1 與 §3.2 「bridge → parent 永遠 HTTPS」）。理由：§1.1，`transport-through-networks.md` §5 表；避開 P1 的兩條 trunk（P1 §8 第 1 點）。
2. **永不承載管理面。** announce、adopt、revoke、憑證續期、dynsec 期望文件不走 MQTT（P5 §1.1「不綁」）。理由：§1.4，PKI 流程只審一次；避開 `check_retain_source` 對 adopt/revoke retained 的副作用（MQ9）。
3. **broker 永不持有樹的憑證。** Mosquitto 是 bridge node 旁的一個 process，不是 bridge 對上游的身分；它只綁 IoT VLAN 介面與 HMI 介面（P2 §6 D-06 第三選項：「不持有樹的憑證，只是一個 consumer」）。理由：§1.7；P1 §3.3 自己描述的那一刀不出現。
4. **unit 自己那一跳不走 MQTT。** 這是與 P5 不同的地方：P5 讓 unit 的 hop 在 MQTT 站點走 broker（P5 §3.2），代價是兩套圍堵、兩份審查、e2e × 2（P5 §1 弱點 1）。反方：unit → bridge 永遠 HTTPS，CM4 上只有一套傳輸 client（§1.3 最後一列）；HMI 看到的是 bridge node 重發到 broker 的資料，LAN 內多一跳是毫秒級（意見，未實測）。失去的只是 P5 T-b 說的「不需要 node 再 publish 一份」，幾十行 code 換 e2e 不加倍。
5. **只在有觸發的站點裝，不進最小部署。** 觸發沿用 P5 §1.1 的 T-a（T1 需要 broker 語意）、T-b（D-06 HMI 要 MQTT/Sparkplug）、T-c（客戶自帶 broker）與 P6 的 Stage 2。沒有觸發的站點，Mosquitto 是純成本（P5 原話）。
6. **只用 Mosquitto。** 理由：`mqtt-brokers.md` §3.1 的排序；EMQX 出局（M-05）、NATS 的 MQTT 只到 3.1.1 且 advisory 落在 MQTT 面（`nats.md` N11、N17）、HiveMQ CE 與 VerneMQ 帶 JVM / Erlang runtime（列 21、24）。
7. **T1 走 `raw/` 命名空間，node 是守門員，broker 是縱深。** T1 的 dynsec client 只有一條 publish 規則 `raw/<id>/#`、沒有 subscribe；`raw/#` 永不轉送、永不被 HMI 訂閱；bridge node 訂閱 raw 做 F-31/F-32/F-01/F-02 檢查後，以**自己的身分**經 HTTPS 往上 `put`（P1 §3.3 第 2、3 層；P5 §3.5 第 2、3 點）。若 PoC 顯示 hostile T1 能打掛 broker 連帶影響 HMI 投影，T1 listener 改成第二個 Mosquitto 實例（P1 §3.3 升級版），多一個 process、不多一種東西。

以下是軟規則，決定「不傷」的程度：

8. **設定由 node 生成、人不手改；只用 dynsec plugin，不碰 `acl_file` / `password_file` / `per_listener_settings`**（3.0 將移除，列 8）；`allow_anonymous false` 明設；`persistence` 或 `persist-sqlite` 明設；`max_queued_messages`、`message_size_limit`、`max_packet_size` 對 T1 listener 設小；node 訂閱 `$SYS/broker/publish/messages/dropped` 把靜默丟棄變成可見計數（P1 §3.3 第 4 層、§4.3；MQ11）。conformance / e2e 必含兩條硬測試：匿名連線被拒、跨 `raw/<id>` 寫入被拒（P5 §8 第 1 點）。
9. **broker 上的 retained 只是投影。** owner 永遠是 unit / bridge 的 SQLite；bridge node 啟動與憑證輪替後回灌 retained（P5 §8 第 2 點）；HMI 要看 payload 內的裝置時間而非 retained 的存在（F-27、F-04；P3 §5 的同一條規則）。
10. **Will 不進業務判定。** HMI 若要「裝置斷線」提示，看 bridge node 從 HTTPS 串流得到的 link-down 再投影到 `presence` topic；不讓 broker 的 keepalive 判斷進 Fleet（§2.3）。
11. **Sparkplug B 只當 D-06 資料面的可選方言，由 bridge 的 function backend 另外編碼 NBIRTH/NDATA；命令面不用**（MQ19、MQ20；P1 §6 D-06、P2 §6）。Tahu 與 Mosquitto sparkplug-aware plugin 的維護狀態未查證（MQ26、MQ28），預設關。
12. **每季複查 Mosquitto 的活躍度**（列 2），並把「EDL 允許自己 patch」當最後手段而不是計畫。

**這個放法付的是什麼。** 有觸發的站點 +1 runtime、+1 方言（dynsec JSON）、Mosquitto 一個時鐘；沒有 client library 的時鐘，因為 bridge node 對本地 broker 只需四種封包，可用最小 client 或自寫（P2 §8 第 3 點、P5 §8 第 5 點）。e2e 是 3 條 trunk 配置加「有 Mosquitto 的 bridge」一個維度，不是 × 2。安全審查一份，dynsec 產生器以 conformance 的兩條硬測試代替第二份審查（意見：這是省預算，不是等價物）。

**這個放法失去的是什麼。** §4 的第 2、3 點（站內 hop 仍是我們的串流）、第 6 點（事件型資料仍是 slot 模擬），以及 P5 用同一個 broker 服務 unit hop、T1 ingress、HMI 三件事的簡潔。得到的是 §1 六樣裡的五樣：trunk 單一路徑、語意不變、種類數只在觸發站點 +1、審查一份、e2e 不加倍、第一個客戶一人週都不付。

排序（由最不傷到最傷，意見）：(A) 本節的放法——Mosquitto 當站內只讀投影，T1 raw 入口在獨立 listener 或實例；(B) P5——unit hop 也走它，付兩套圍堵與兩倍 e2e；(C) P1——broker 就是樹，付兩條 trunk、管理面上 broker、最小部署三服務；(D) P3——NATS 內建 MQTT，付 3.1.1 天花板、advisory 時鐘、JetStream 語意。owner 若堅持，請停在 (A)；(B) 是可以辯論的；(C)(D) 是把 §1 的六樣全部交出去。
