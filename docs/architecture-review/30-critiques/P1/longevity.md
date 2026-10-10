# P1 批評：十年維運（longevity）

> 波次 B 批評者，lens = 十年維運。日期：2026-10-10。目標：`20-proposals/P1-mqtt-native.md`。輸入：00～03、P1 全文、`10-facts/` 全部八檔，以及 P2/P5 的 §2（只借其 M-02 計法當對照基準）。事實引用寫「`檔名` 列號」或「P1 §x」；沒查證的標「未查證」。事實與意見分開。

## 結論先講

**致命 0 條、重大 7 條、次要 3 條。** 沒有一條在三種部署形狀或 D-01～D-06 的任何錨點裡讓 P1「不成立」；十年維運的問題全部是**成本與腐爛**，不是不可能。一句總評：P1 把傳輸層買得很乾淨，但買進來的不是無聊的元件，而是一條 2026 年 1 月才出現、八個月沒 release、看得見的 committer 只有一位的版本線（Mosquitto 2.1.x），加一個 29 個月沒出新版的 client library（paho-mqtt），而這兩樣在 P1 裡**每個站點、包含一片螢幕的最小部署，都不可選**。P1 的 M-02 帳比 P2/P5 寬鬆且前後不一致；可逆性表低估了換 broker 的代價，因為 F-04 的過期語意與 ACL 都綁在 Mosquitto 專有功能上；還原（N-09）與簽章金鑰輪替這兩件十年內必然發生的事，P1 沒有設計。

## 1. 外部元件的時鐘、LTS、授權（M-05、M-06、N-10）

這張表只列 P1 §2 元件清單裡的外部元件，加上 P1 文中用到但清單沒列的傳遞相依。「事實」欄的每一格都有來源；查不到的標未查證。

| 元件 | P1 裡可選嗎 | 最新版與日期 | release 節奏 | LTS / 支援政策 | 授權 | 維護者 / bus factor | 來源 |
|---|---|---|---|---|---|---|---|
| Eclipse Mosquitto 2.1.x（含 dynsec、persist-sqlite plugin） | **不可選**（每個 bridge 與 root 都要） | 2.1.2 = 2026-02-09；ChangeLog 頂端 2.1.3 寫「2026-02-xx」未發布 | 2.0.19→2.0.23 約每 3～6 個月；2.1.0/2.1.1/2.1.2 在 11 天內連發，之後 8 個月無 tag | **未查證**（10-facts 未記載任何 LTS 或支援期政策；Eclipse 專案頁無法連線） | EPL-2.0 OR EDL-1.0 | master 前 8 筆 commit 全為 `ralight`；領導人、贊助方未查證；GitHub advisories 頁為空（安全修正只在 ChangeLog） | `mqtt-brokers.md` 列 1、2、3、9、10 |
| paho-mqtt（node 用 Python 時） | 不可選（node 的傳輸） | 2.1.0 = 2024-04-29 | 之後約 29 個月無新版 | 無 | EPL-2.0 OR BSD-3-Clause | commit 活躍度未查證 | P1 §2 列 28 |
| rumqttc（node 用 Rust 時） | 同上 | 0.25.1（仍 0.x） | — | 無 | Apache-2.0 | bytebeamio；repo 近期 commit 多在 rumqttc | P1 §2；`mqtt-brokers.md` 列 30 |
| libwebsockets（Mosquitto WSS listener 的傳遞相依） | (c) 形狀 WSS trunk 時不可選 | 未查證 | 未查證 | 未查證 | 未查證 | man page 稱其為「legacy」路徑，TLS 選項縮減 | `transport-through-networks.md` T14 |
| Ed25519 簽章函式庫（P1 §3.4 所有下行皆簽） | 不可選 | P1 未指定；未查證 | — | — | — | — | P1 §3.4 |
| PostgreSQL 18 | 可選（history） | 18.6 = 2026-08-11 | 年度 major、季度 minor | PG 18 到 2030-11-14 | PostgreSQL License | 社群，多組織 | `postgres-timeseries.md` F-11 |
| SQLite（node 內嵌；P1 §2 未列為元件） | 不可選 | P2 §2 引 3.55.0 | — | 作者承諾長期支援（未查證） | Public Domain | — | P2 §2 列 75 |
| Odoo 19 | 不可選 | — | 每年一個 major | 未查證 | LGPL-3（P1 自標未查證） | Odoo SA | `02-tradeoffs.md` §1 |
| Grafana | 可選 | 12.4.x 支援到 2027-05-24 | minor 9 個月、major 末 minor 15 個月 | 有，短 | AGPL-3（未查證） | Grafana Labs | `02-tradeoffs.md` §4 |
| Grafana MQTT datasource | 可選 | v1.3.9 | 未查證 | 無 | Apache-2.0 | 未查證 | P1 §2 列 32 |
| Sparkplug B / Tahu（D-06 可選副本） | 可選、預設關 | Tahu 1.0.7；依賴停在 2022 年前後 | 未查證 | — | EPL-2.0 / Apache-2.0 | 未查證 | `mqtt-semantics.md` MQ25、MQ26 |

意見：M-05 這一欄 P1 全部過關，**此點成立**（見 §4）。問題集中在「不可選」那一欄：P1 相對 P0 新增的外部時鐘裡，兩個最弱的（Mosquitto 2.1 線、paho-mqtt）剛好是不能關掉的。

## 2. Findings

### longevity-01（重大）M-02 的帳前後不一致、計法比同儕寬鬆，而且 Mosquitto 在每個形狀都不可選

**情境。** 三種形狀皆然，最痛在 (a) 一片螢幕與「螢幕 + Modbus 感測」的典型站點（錨點 5：T1 以 Modbus 為主）。

**壞在哪一步。** P1 §2 算出「合計 15，相對 P0 的 13 淨增 +2：Mosquitto 作為引擎與 runtime」。但 §7 的 M-02 列寫「+1 引擎、+1 runtime、**+1 client 函式庫**、兩個設定方言」，合計卻仍是 13→15：client library 被承認是新增卻沒算進總數。P1 又把 Odoo 同時算引擎與 runtime（重複），Grafana 算引擎不算 runtime，漏掉 SQLite（每個 node 都用，broker 的 persist-sqlite 也用），排除 IoT_Parts；P2、P3、P5、P6 用同一套計法（引擎、語言、runtime、repo 各一，外部 library 以時鐘計一）算出 P0 = 11，P1 自己算 P0 = 13，基準不同。用 P2 的計法重算 P1 標準部署：

| 類別 | P1 自算（§2） | 用 P2 計法重算 P1 | 用 P2 計法算 P0 |
|---|---|---|---|
| 引擎 | Mosquitto、PG、Odoo、Grafana = 4 | PG、SQLite = 2 | 2 |
| 語言 | Python、node 語言、SQL = 3（Python 時 2） | Python = 1（Rust +1） | 1 |
| runtime | Mosquitto、Odoo、node、PG = 4 | Odoo、node、Grafana、Mosquitto = 4 | 3 |
| repo | node、ERP、deploy、e2e = 4 | 加 Parts = 5 | 5 |
| 外部 library 時鐘 | 未計 | MQTT client lib、Ed25519 lib = 2 | 0 |
| **合計** | **15（14）** | **14（Rust 15）** | **11** |
| 最小部署（一片螢幕） | 未另算 | 12（Grafana、history 關掉，Mosquitto 關不掉） | 10 |

淨增是 **+3**，不是 +2；更要緊的是**最小部署 +2**，而 P2/P5 在最小部署時 Mosquitto 根本不存在。P1 §2 說 `mosquitto.conf` 與 dynsec JSON 是「不算種類但要維護的方言」；P1 §9 自己卻寫換 broker 時「重寫 conf 產生器與 ACL 機制（dynsec 是 Mosquitto 專有）」、`mqtt-brokers.md` 列 8 顯示 conf 方言在 2.1→3.0 之間會刪選項。會被版本演進刪東西的，就是有自己時鐘的東西，應該計入。

**依據。** P1 §2 列 36、§7 列 215、§9 列 261；P2 §2 列 83～94；P5 §2 列 68～79；`mqtt-brokers.md` 列 8。

**可不可以修。** 數字可修：改用共同計法重寫 §2，把 client library、Ed25519 library、兩個方言列進去。「不可選」不可修——「broker 就是樹」是 P1 的立場，一旦讓 broker 在沒有 T1 MQTT、沒有 HMI 的站點關掉，P1 就變成 P5。

### longevity-02（重大）P1 的設計押在 Mosquitto 2.1 線的新功能上，而這條線八個月無 tag、看得見的 committer 一位、無 LTS 政策、無 advisory 流程

**情境。** (b) 同站不同 VLAN：bridge 主機的 Mosquitto 同時面對 C-25 的 hostile T1 VLAN（8884 listener）與持有往 root 的 bridge 憑證。(c) 形狀的 root broker 在我們雲端，數量 = 客戶數。

**壞在哪一步。** P1 依賴的功能全部是 2.1.0（2026-01-29）才出現的：persist-sqlite plugin（P1 §4.3 第一列）、dynsec 的 `%c`/`%u` 替換（P1 §3.3 第 2 層的 per-client ACL）、v5 bridge 的 `bridge_session_expiry_interval` 與 `bridge_receive_maximum`（P1 §3.1 明設 `bridge_protocol_version mqttv50`）。這條線在 11 天內連發三版後，ChangeLog 頂端的 2.1.3 寫「2026-02-xx」掛了八個月沒發布；2.1.1 把 2.1.0 剛加的 receive-maximum 強制改回「只 log」（`mqtt-semantics.md` MQ6），顯示 2.1 線的行為在 patch 版之間還在翻。近兩年有 Security 標題的修正是 2.0.19（bridge 收惡意封包 crash）與 2.0.21（已驗證 client 的惡意 SUBSCRIBE leak），GitHub advisories 頁為空——意思是 M-06 要求的「定期檢查」只能靠人去 diff ChangeLog，沒有訂閱得到的通道。P1 §8 第 9 點承認 bus factor 低，給的緩解是「EDL 允許我們自己 patch 並建置」。對錨點 6 的小團隊，這等於「必要時接手維護一支面對 hostile 輸入的 C 語言網路解析器」，正是 M-06 說貴的那種制度性知識。P1 也沒說 Mosquitto 從哪裡來：Docker 映像的 arm64 tag、Debian 套件版本都未查證（`buy-options.md` F3 的 Orion 在 Docker Hub 缺 tag 是前例）。

具體會壞的一步（意見）：2027 年某台 T1 送出命中未修 bug 的畸形封包，bridge broker 停，該 VLAN 的 T2 進 N-11 模式、trunk 斷（P1 §8 第 2 點已認）。差別在修補等多久：P0 的解析器我們修；P1 的要等一位 committer，或自己 fork。

**依據。** `mqtt-brokers.md` 列 2、3、6、7、9、10、11；`mqtt-semantics.md` MQ6；P1 §3.1、§3.3、§4.3、§8 第 9～10 點；`buy-options.md` F3。

**可不可以修。** 部分可修。(1) P1 §3.3 末段的「T1 listener 改第二個 Mosquitto 實例、不持 bridge 憑證」應從「若 PoC 不可接受的升級版」改成**預設**，讓解析器 crash 不連帶 trunk；多一個 process、不多一種東西，代價約 0.5 人週 compose 與測試。(2) 把「自己 patch」做成真的：deploy repo 從 pinned commit 建 Mosquitto 映像（含 arm64）、每季 diff ChangeLog 列入 runbook；約 1 人週建置，之後每季半天。(3) 不可修的部分：2.1 專有功能（persist-sqlite、`%c`/`%u`）是 P1 圍堵與持久化的基礎，退回 2.0.x 等於放棄 P1 §3.3 的 per-client ACL 寫法。

### longevity-03（重大）十年要跟著每台 unit 走的是 MQTT client library，而它的時鐘是全案最差

**情境。** 全部形狀；每一台 CM4 unit。`02-tradeoffs.md` §1：2026 年裝的螢幕到 2029 年可能還在講 v1，fleet 升級很慢。

**壞在哪一步。** P1 §2 自己列出：node 用 Python 時 client 是 paho-mqtt 2.1.0，2024-04-29 發布，之後約 29 個月沒有新版，commit 活躍度未查證；用 Rust 則是 rumqttc 0.25.1，仍是 0.x。P1 把這條列成事實，但 §8 的 12 條已知弱點裡沒有它。對照 P0：node 的 HTTP client 是標準庫或最主流套件，不會「29 個月沒人動」。paho 承擔的不只站內連線，還有 (c) 形狀的 WSS trunk（P1 §3.4 末段），即雲端客戶的唯一上行。會壞的一步（意見）：2029 年 CM4 的 OS 升到下一個 Debian、Python 的 `ssl` 或 asyncio 行為變了，paho 若仍無新版，選項是把 fleet 鎖在舊 OS（安全債）或自己維護 fork。

**依據。** P1 §2 列 28；`mqtt-brokers.md` 列 30；`02-tradeoffs.md` §1「協定是自己的」段。

**可不可以修。** 可修，代價中等。(1) node 內把 MQTT client 包在一層薄介面後面，conformance suite（P1 §9 已有）對介面而非對 paho 測，換 library 時只動一層；約 1 人週。(2) PoC 第一週把「library 近 12 個月的 commit 數」列為語言選擇的硬條件之一。(3) 最徹底的修法是自己寫一個最小 MQTT 5 client（連線、subscribe、publish、retain、expiry、WSS，幾千行以內）——但這會削弱 P1「傳輸買回來」的論點，等於承認 unit 側的傳輸還是自己的。

### longevity-04（重大）(c) 形狀的兩條 trunk 裡，備援那條會爛掉

**情境。** (c) 雲端 ERP、站點 outbound-only、客戶 IT 某天啟用 TLS 檢查 proxy（`transport-through-networks.md` T1～T3）。

**壞在哪一步。** P1 §1 第二個最弱點與 §8 第 1 點都承認有兩條 trunk（Mosquitto bridge 走 8883，備援是 node 的 WSS trunk 走 443），處理是「預設 bridge、備援 WSS，e2e 兩條」。十年維運的問題在「備援」這個詞：只有遇到 TLS 檢查的客戶才走 WSS trunk，它在多數站點永遠不跑。兩條路徑的 topic 方向、QoS、retained 轉送、session 行為分別寫在 `mosquitto.conf` 與 node 程式（paho/rumqttc）裡；身分也是兩套（mTLS + `remote_username` 對上 site username + 輪替 secret），撤銷因此也是兩條路。再加 T14：雲端 WSS listener 若走 libwebsockets 路徑，TLS 選項縮減，是一個隨 Mosquitto 建置方式變動的傳遞時鐘。具體會壞的一步（意見）：2028 年客戶切 TLS 檢查，站點切到 2026 年 e2e 過一次、之後沒跑過的 WSS trunk；那時雲端 root 已是更新版，v5 bridge 與 WSS client 對 session expiry 的行為若有一處不同，desired 的空窗會無聲出現，直到 `R_resync` 一小時後才補。

**依據。** P1 §1 列 20、§3.2 (c) 圖、§3.4 末段、§8 第 1 點；`transport-through-networks.md` T14、T15、T16、§5 表。

**可不可以修。** 可修，但要放棄一半論點。選一條：site→cloud 一律走 node 的 WSS trunk（所有 (c) 站點天天跑，沒有備援路徑），Mosquitto 的 bridge 功能只留給 (b) 形狀站內 bridge→root。這樣每個形狀各一條路、兩條都在生產環境常態運作，不會有「沒跑過的那條」。代價：(c) 形狀失去 Mosquitto bridge 的 `try_private` retained 傳播，node 要自己做 retained 轉送（本來 WSS trunk 就得做），約 1～2 人週；而且「broker 就是樹」在 (c) 形狀不再成立，樹回到 node 裡。

### longevity-05（重大）M-01：在典型站點，broker 的原因消失了，但它拿不掉

**情境。** (a) 與 (b) 形狀裡「幾片 D-01 螢幕 + 幾個 D-02/D-03 感測器」的站點——P1 §9 自己定義的第一個客戶，也是錨點 5 說的典型：T1 以 Modbus 為主。

**壞在哪一步。** P1 §1 給 Mosquitto 四個理由：取代自製 long-poll、T1 MQTT ingress、D-06 HMI、第 N 個消費者。在上述站點，後三個都不存在：D-03 的 T1 完全不碰 broker（P1 §6 D-03 自己說「這一類 T1 完全不碰 broker」）、沒有 HMI、消費者只有 ERP 與 store。剩下的理由是「不想自己寫連線保持與重連」。但 P1 §6 D-01 與 §7 F-56 列承認：文件與媒體不走 MQTT，螢幕以 token 向 **bridge node 的 HTTPS 快取**拉，bridge node 代為向 ERP 取並本地快取以滿足 N-11。也就是每台 unit 本來就有 HTTPS client，每個 bridge node 本來就有 HTTPS server、快取與斷線重載邏輯——P1 要省的那類程式碼，為了文件路徑還是得寫一份。M-01 問「原因消失後還值得維護嗎」：在這種站點，Mosquitto 每天做的事是替幾 KB 的 JSON register 保持一條連線，旁邊就有一條為同一批裝置維護的 HTTPS 路徑。P1 §7 列 221 有寫「兩種傳輸在邊緣並存」，但沒把它算成 M-01 的代價。

**依據。** P1 §1 列 13～14、§6 D-01、D-03、§7 列 214、221、§9 列 241；`00-requirements.md` M-01；`03-brief.md` 錨點 5、7。

**可不可以修。** 在 P1 的立場內不可修：讓 broker 在這類站點可選，就是 P5；把文件塞進 MQTT（`max_packet_size` 預設 2 MB，媒體不合適，P1 §6 已正確排除）會製造更糟的東西。評審應把這條當 P1 與 P5 的分水嶺來看。

### longevity-06（次要）可逆性表低估：F-04 與 sq 的過期建在 MQTT 5 Message Expiry 上，10-facts 裡只有 Mosquitto 的 bridge 傳得過它

**情境。** P1 §9「Mosquitto → NanoMQ / VerneMQ 3～5 人週」那一列；三年後想換 broker。

**壞在哪一步。** P1 §4.3 把 `m/<function>` 的 Message Expiry（3 × 量測週期）當 F-04「沒有資料看起來就是沒有」的機制，把 `sq/<key>` 的 Expiry 當 deadline 的清除機制，§5 承認要 e2e 驗「過期的 retained 不送給新訂閱者」，且依賴 Mosquitto 專有的 `retain_expiry_interval`（MQ9：預設 lazy 清除）。`mqtt-brokers.md` 列 25：VerneMQ 的 bridge 以 3.1.1 轉發、v5 屬性會丟；列 15：NanoMQ bridge 的 retain/QoS 保留行為未查證；`nats.md` N10：NATS 的 MQTT 只到 3.1.1。所以「換 broker」不是換 conf 產生器，是**重設計 F-04 的機制**，加上 dynsec 專有 ACL 全部重寫，再加上到每個客戶 bridge 主機換 broker 的現場作業——3～5 人週只算了辦公室裡的時間。P1 在 VerneMQ 那格寫了「要退回 3.1.1 的設計」，算部分承認；列次要是因為修法便宜。

**依據。** P1 §4.3、§5 末段、§9 列 261；`mqtt-semantics.md` MQ9、MQ16；`mqtt-brokers.md` 列 15、25；`nats.md` N10。

**可不可以修。** 可修，約 0.5 人週：payload 已帶 `ts`（P1 §5），再帶 `ttl`，由 node 與 root adapter 在讀取時判定過期並丟棄，Message Expiry 降為最佳化而非正確性依賴；第三方 HMI 消費者看到的過期值則接受 broker 端 best-effort。這樣 F-04 不再綁 Mosquitto，§9 那格的數字才站得住。

### longevity-07（重大）備份還原（N-09）：bridge 主機從舊備份還原後，dynsec 與 retained 是過期的「權威副本」，被撤銷的 unit 會被重新放進來

**情境。** (b) 形狀：bridge 主機硬碟壞掉，從一週前的備份還原；還原前這一週內 root 曾 revoke 一台 T2（P1 §3.4 步驟 5：改 dynsec 文件為 `disableClient`、不再續期）。

**壞在哪一步。** bridge 主機上有三份狀態：Mosquitto 的 dynsec plugin 自己持久化的 client/role 檔、broker 的 retained 持久化（persist-sqlite，裡面有 `adopt/<serial>`、`mgmt/dynsec`、`desired`）、bridge node 的 SQLite。還原後三份都是一週前的：dynsec 裡那台 T2 是 enabled，retained 的 `adopt/<serial>` 是 revoke 之前的 adopt 訊息。那台 T2 的 30 天營運憑證還沒過期，連上來被舊 dynsec 放行，訂閱後拿到的是舊 adopt 而非 revoke。P1 §4.1 的 `R_resync` 觸發條件是「root broker 重啟」與「每小時」；bridge 自己重啟不算，所以空窗最長一小時。這是 C-10「不能推撤銷」以還原的形式回來。P1 §4.3 把 broker 持久化列為「N-09 備份項」又說「丟失只影響快取」，方向相反：是快取就不該備份，還原時應該是空的。小點：P0 的「備份 = 複製檔案」對 broker 正在寫的 SQLite 不成立，要用 backup API 或停機。

**依據。** P1 §3.4 步驟 5、§4.1、§4.3 第一列、§8 第 5 點、§9 列 252；`00-requirements.md` N-09、C-10、N-04；`mqtt-brokers.md` 列 7、9。

**可不可以修。** 可修，代價小。(1) runbook 與 compose 一致化：broker 的 persistence 與 dynsec 檔**不備份**，還原 = 空；bridge node 啟動時先向 root 要 `mgmt/dynsec` 全量文件、套用成功後才開 T2/T1 listener（fail-closed）。(2) root adapter 把「某個 bridge 的 `$SYS/broker/connection/<id>/state` 從 0 變 1」當成該子樹的 resync 觸發，而不只是 root broker 重啟。兩項合計約 0.5～1 人週，且要進 N-17 的 e2e（「還原後撤銷仍有效」是一個場景）。

### longevity-08（重大）root 簽章金鑰的輪替沒有設計，而 unit 在 adopt 時把它 pin 死

**情境。** 全部形狀；時間尺度十年。`02-tradeoffs.md` §1：fleet 升級慢，2026 年的 unit 在 2029 年還在講 v1。

**壞在哪一步。** P1 §3.4 把 P0 只給 T3 的端到端簽章提前到所有下行（`desired`、`sq`、`adopt`、`mgmt`），unit「在 adopt 時拿到 root 公鑰」。§8 第 4 點處理了 TLS 憑證輪替對 `check_retain_source` 的影響，但那是 TLS cert，不是簽章金鑰。十年內必然發生：金鑰疑似外洩，或演算法政策要換。輪替訊息必須用舊金鑰簽才會被 unit 接受；若舊金鑰正是外洩的那把，攻擊者也能簽一則輪替。P1 §9 列 265 寫「自製簽名格式 → COSE 2 人週，只在 root adapter 與 unit 的驗簽模組」——驗簽模組在 unit 上，而 unit 升得最慢。這在 P0 只影響 T3（D-05 還沒做），在 P1 從第一台螢幕出貨就生效，是 day-one 設計債。

**依據。** P1 §3.4 第四個 bullet、§8 第 4 點、§9 列 265；`02-tradeoffs.md` §1「協定是自己的」、§3 第 5 項；`00-requirements.md` F-48、N-04。

**可不可以修。** 可修，但**只能在第一批 unit 出貨前修**：unit pin 的應是離線保存的根公鑰（可與 factory CA 同層級），線上簽章金鑰由它簽發並帶有效期，輪替 = 根簽一把新的線上金鑰，unit 驗鏈而非驗單一公鑰；外洩線上金鑰不需要動 unit。約 1 人週設計加 conformance 測試，必須放進 02 §3 第 5 項那次外部審查的範圍。出貨後再補，就得靠舊金鑰還沒外洩的那段時間推一次全 fleet 升級。

### longevity-09（次要）bridge v5 模式與雙 listener 帶進來的設定方言，P1 只列了用到的那幾個 knob

**情境。** (b)、(c) 形狀；三年後有人把 Mosquitto 從 2.1 升到下一個 minor 或 3.0。

**壞在哪一步。** 兩件未查證但會在升版時咬人的事。(1) P1 §3.1 為了 Message Expiry 明設 `bridge_protocol_version mqttv50`，卻沒提 2.1.0 隨之引入的 `bridge_session_expiry_interval`（預設 0，MQ16）。v5 模式下 `cleansession false` 與 session expiry 0 的交互——斷線後 root 端的 bridge session 是否立刻消失、重連後會不會重新 subscribe 拿到 retained——man page 沒寫清楚，P1 也沒列入 PoC。(2) P1 §3.2 (b) 的 bridge 主機兩個 listener：8883 走 cert-username、8884 走密碼或 vendor cert。「同一個 dynsec 能否強制 8883 只收 cert、8884 只收密碼」P1 自標未查證（§3.4）；若要靠 `per_listener_settings`，那是 `mqtt-brokers.md` 列 8 說 3.0 要移除的選項，P1 §7「不用 3.0 要移除的三個選項」就不成立。P1 §3.3 末段的第二個實例可同時避開兩者，又一個「升級版應是預設」的理由。

**依據。** P1 §3.1、§3.2、§3.4、§7 M-06 列；`mqtt-semantics.md` MQ16；`mqtt-brokers.md` 列 4、6、8。

**可不可以修。** 可修：PoC 第一週把這兩項列進去，deploy repo 的 conf 產生器對每個 knob 寫明「為何設、預設值是什麼、哪一版引入」，升版時 diff 這份清單。代價半人週。

### longevity-10（次要）「無聊」說的是 release 節奏，不是知識面；MQTT 5 加 Mosquitto 的坑是一整塊新的制度性知識，而語意層一行沒省

**情境。** 錨點 6：貴的是制度性知識。三年後接手的人。

**壞在哪一步。** P1 §1 承認語意層一行沒省（版本、key、去重、結果槽、deadline、簽章全在 node）。在那之上還要懂：retained 的 lazy expiry 與 `check_retain_source`（MQ9）、`max_queued_messages` 靜默丟棄（MQ11）、receive-maximum 在 2.1.0→2.1.1 的翻轉（MQ6）、2.1.3 ChangeLog 裡 will-delay 與 session-expiry 交互的 bug（`mqtt-semantics.md` §3.3）、`try_private` 這個非標準 hack（列 5）、dynsec JSON 與 `$CONTROL` API、conf 方言。沒有一項是 MQTT 規格層的知識，全是「Mosquitto 這支程式怎麼做」。P1 §8 列了幾項，說明作者懂；三年後的人要重新學，而 P0 的對應知識可以讀自己的 code。

**依據。** P1 §1 列 19、§8 第 3～8 點；`mqtt-semantics.md` MQ6、MQ9、MQ11、§3.3；`mqtt-brokers.md` 列 5、7。

**可不可以修。** 部分可修：P1 的 conf/dynsec 由 node 生成加 conformance suite 是對的方向；再加一組「Mosquitto 行為假設」測試（expiry 清除、retain source、queue 溢出計數、session 保留），每次 bump broker 就跑。約 1 人週。知識面本身不會變小。

## 3. 三年後換掉一塊的代價（對 P1 §9 表的修正，意見）

| 換掉 | P1 估 | 我的修正 | 差在哪 |
|---|---|---|---|
| Mosquitto → 另一個 broker | 3～5 人週 | 5～8 人週 + 每個客戶站點一次現場或遠端換機 | longevity-06：F-04 機制與 dynsec 重設計；bridge 主機在客戶場域 |
| MQTT → HTTPS（回 P0） | 5～8 人週 | 工程 5～8 人週成立，但 fleet 完成要以年計 | unit 的 node 全部要升版，fleet 升級慢（02 §1）；P1 §9 末段已承認 topic 契約最不可逆，此點成立 |
| paho → 別的 client | 未列 | 有薄介面 1～2 人週；沒有則散在 node 各處 | longevity-03 |
| root 簽章金鑰 | 未列 | 出貨前設計好則近零；出貨後靠舊金鑰推全 fleet 升級 | longevity-08 |
| Postgres → VictoriaMetrics | 1～2 人週 | 同意 | writer 介面；P1 此點成立 |
| Odoo → 另一個 ERP | 3～4 人週 | 同意 | root adapter 是邊界 |

## 4. 此點成立

1. **「MQTT 給的是傳輸零件，不是 F-46/F-47 的語意；P1 一行語意都沒省」**（P1 §1 第一個最弱點）。與 `mqtt-semantics.md` §5 的對照表一致，而且 P1 把它放在結論裡而非藏起來。這是整份提案最誠實的一段。
2. **M-05 的分析正確且完整。** Mosquitto EPL-2.0 OR EDL-1.0（列 1）、paho EPL/BSD、rumqttc Apache-2.0、PG、Grafana 只給 ops；EMQX 與 ThingsBoard 4.4 的 BSL 被正確排除（`mqtt-brokers.md` 列 18、`buy-options.md` T2）。沒有一項綁住客戶。
3. **正確讀到 `acl_file`/`password_file` 在 3.0 要移除**（列 8），以只用 dynsec plugin 避開，並在 §7 M-06 列寫成設計約束。longevity-09 只指出第三個選項 `per_listener_settings` 還沒確認。
4. **retention window 明寫**（§4.3）：每個 window 有預設值、持有者、超出時的行為與監控方式，直接回答了 `02-tradeoffs.md` §3 第 3 項。P0 自己在 §1 沒有這張表。
5. **「retained 是快取，不是 owner」的 F-46 推理正確**（§4.1）：owner 是 ERP 的 Postgres 與 unit 的 SQLite，broker 掉了靠 `R_resync` 回灌。這讓 longevity-07 的問題是「空窗多長」而不是「事實丟了」。
6. **對 Mosquitto bus factor 與八個月無 tag 的誠實記錄**（§2、§8 第 9 點），以及對 (c) 形狀兩條 trunk 的誠實記錄（§1、§8 第 1 點）。我的 longevity-02 與 -04 不是「P1 沒看到」，而是「P1 的處理不夠」。
7. **時序儲存的選擇與增量 roll-up**（§5）：ERP 叢集內獨立 database、窄表、月分區、drop partition、增量 bucket 而非 materialized view，與 `postgres-timeseries.md` F-12、F-13、§3.4 一致；writer 做成介面讓換 TSDB 只動一個 adapter。
8. **把 topic 契約列為最不可逆的一塊**（§9 末段）並要求 day-one 的版本協商與相容矩陣。這是對的，而且是 P1 相對許多 MQTT 提案少見的自知。

## 5. 如果我是作者，最怕評審問什麼

「Mosquitto 在你的設計裡每個站點都關不掉，而它所有你用到的功能加起來，只有一位看得見的 committer 和一條八個月沒 release 的版本線——2028 年那個人離開的時候，你 fleet 裡每一台 bridge 的 CVE 是誰修？還是你準備從那天起維護一支 C 語言的 MQTT broker？」
