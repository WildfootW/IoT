# P5 批評：十年維運（longevity）

批評者 lens：十年維運。目標：`20-proposals/P5-pluggable-transport.md`（P5）。日期：2026-10-10。輸入：`00-requirements.md`、`01-proposal-pcie-tree.md`、`02-tradeoffs.md`、`03-brief.md`、P5 全文、`10-facts/` 的 `mqtt-brokers.md`、`nats.md`、`buy-options.md`、`zenoh.md`、`postgres-timeseries.md`、`mqtt-semantics.md`、`transport-through-networks.md`、`precedents.md`；對照 P2 §2 的種類計法。

引用慣例：`10-facts/` 的事實寫「`檔名` 列號」，查證日期皆為 2026-10-10；本文另查或無法查的標「未查證」。事實與意見分開標示。

## 0. 結論先講

**致命 0 條、重大 6 條、次要 4 條。**

一句總評：P5 在「語意與傳輸分層」上的推理是六份提案裡最誠實的，M-06 的時鐘表也填得最完整；但它把「十年」想成「兩份 binding 並存、隨時可刪一份」的靜態圖，漏掉了 fleet 版本偏移這個時間軸。把「2026 年出廠的 unit 到 2029 年還在講 v1」（P5 自己引的 02 §1）當真，P5 的三個核心主張——「其他站點 +0」、「不用就刪 binding」、「三年後換 hop 只動 binding」——各要再加一個被低估的項目：unit 上多出的 library 時鐘、刪不掉的 binding、沒有 OTA 就縮不回去的相容矩陣。另外，P5 把 bridge 0 的 SQLite 定為 registry 與憑證的真相所在，卻一字未提 N-09。這些都可修，但修完後 P5 與 P2 的差距會比 P5 自估的小。

## 1. Findings

### longevity-01（重大）M-02 的種類數在 P5 自己的計法下少算了

- **情境**：所有形狀；特別是標準部署（HTTPS binding only，P5 §2 的第一欄）。
- **壞在哪一步**：P5 §2 的計法沿用 P2：「外部 library 以時鐘計一種」。然後標準部署的「外部 library 時鐘」填 0，MQTT 站點填 1（MQTT client library）。這在三個地方不一致：
  1. **paho / rumqttc 的時鐘是 fleet-wide 的，不是站點的。** P5 §1.1 的 M-01 規則要求 MQTT binding「每次 CI 都跑 conformance suite」才能留在 repo；§9 的可逆性表又說換 binding「node 不改、< 1 人週」，前提是 unit 上已經帶著兩個 binding。這兩條合起來的意思是：只要 MQTT binding 存在，每一台 CM4（含 HTTPS-only 站點）的 node 都要安裝並相容 MQTT client library，否則「不改 node 就切 binding」不成立。所以「其他站點 +0」只在 runtime 一欄成立，在 library 時鐘一欄是 +1，標準部署應為 12。要不然就是維護兩種 build variant（有 / 無 MQTT），那是另一條矩陣軸。
  2. **HTTPS binding 的 HTTP 串流 stack 與 issuer 的 X.509 library 沒被算。** node 是 Python 時，chunked streaming server/client 與簽發憑證的 crypto library 都是外部 library，各有 release 節奏與 CVE。paho 算時鐘、這兩個不算，是雙重標準。P2 同樣漏算，但 P5 把「+2 vs +0」當頭條論證，數字的誠實度對它更重要。
  3. **契約規格本身是要維護十年的「種類」。** 一份有版本協商、相容矩陣、錯誤詞彙的規格，需要變更流程、版本政策、deprecation window，只是沒有 repo。P5 把它放進 IoT_e2e「不增 repo」，表上就是 0。這是把最貴的東西算成免費。
- **誠實重算（意見）**：標準部署 11 → 13（+ MQTT client 時鐘 fleet-wide、+ HTTP/crypto library 時鐘；契約另列為「不計入種類但需變更流程的工件」）；MQTT 站點 13 → 14～15；另加 P5 已承認的兩個方言（`mosquitto.conf`、dynsec JSON）。重算後 P5 標準部署不再「與 P0 相同」，而是 P0 +2。
- **依據**：P5 §1.1、§2 種類表、§9 可逆性表第一列；P2 §2「計法」段（同一計法）；M-02。
- **可不可以修**：可修，而且修法是誠實而不是改設計：(a) 計法改成「外部 library 一律計時鐘，或一律不計」擇一並對所有提案重算；(b) 把契約規格列為獨立工件，寫明變更流程與誰擁有它。代價是 R4 的分數會與 P2 拉平，這本來就該如此。

### longevity-02（重大）M-01 的「不用就刪」規則在 fleet 上執行不了

- **情境**：形狀 (b) 或 (c)，一個因 T-a（T1 講 MQTT）啟用了 MQTT binding 的站點；三年後 T1 設備退役或換成 Modbus，該站點 40 台 CM4 unit 仍以 MQTT binding 連 bridge。
- **壞在哪一步**：P5 §1.1 的規則：「至少一個站點在生產使用」失守超過兩個發行週期就刪 binding 目錄。問題是「站點在生產使用」的主體不是站點，是 unit。要停用 MQTT binding，要先把每一台 unit 切回 HTTPS：切換指令必須經由 **舊的 MQTT binding** 以 `cfg`/`desired` 下發，bridge 在過渡期必須同時跑兩個 listener，而且 unit 收到切換指令後要能重新 `dial`——這整套 unit 側的 transport 切換流程 P5 沒有寫進契約（§3.1 的 `dial(parent, identity, versions)` 沒有 transport 參數）。更根本的是：只要 fleet 裡還有任何一台 node 版本含 MQTT binding 的 unit，upgraded bridge 刪掉 binding 就等於拒絕它連線。02 §1 說 2026 年裝的螢幕 2029 年還在講 v1；P5 自己引了這句。所以刪除的最早時點不是「兩個發行週期」，而是「該站點最後一台舊 node 下線」，實務上等於 fleet 壽命。binding 於是變成 M-01 要防的那種包袱：原因（T1 MQTT 設備）消失了，code 還得維護。
- 附帶：P5 沒有定義 node 的 release 節奏，「兩個發行週期」沒有長度。
- **依據**：P5 §1.1 防止變包袱的規則、§3.1 primitive 表、§9 可逆性表第一列；02 §1「協定是自己的」段；M-01、M-03。
- **可不可以修**：可修。(a) 把刪除條件改成以 fleet 事實為準：所有 unit 的 `cfg` 回報 `transport != mqtt` 滿 N 個月才刪，N 由該站點最舊 node 版本決定；(b) 在契約裡定義 transport 切換：`cfg.transport` 為 parent 可寫的 slot、unit 支援 dual-dial 過渡、bridge 過渡期雙 listener，並列為 conformance 必測；(c) 誠實寫明「一個 binding 一旦上過生產，最短壽命 = 該站點的裝置壽命」。代價：契約與 e2e 各加 1～2 人週，以及接受 M-01 在這裡只能限制增長、不能保證刪除。

### longevity-03（重大）「版本協商在契約層、與 binding 無關」在 MQTT binding 不成立

- **情境**：形狀 (b)，D-05 門禁站點（anchor 8 的已知下一步）啟用 MQTT binding；契約從 v1 升到 v2 以加入事件型 `append`（P5 §8.6 自己說 v1 刻意沒定死）。
- **壞在哪一步**：HTTPS binding 的路徑 `PUT /v1/slots/<path>/<slot>` 對 slot 名稱是透明的，新 slot class 不需要改 binding。MQTT binding 不是：slot 命名空間直接編進 topic（`n/<path>/<slot>`），而 dynsec ACL 是 node 依 topic 結構生成的（P5 §3.2 圍堵列）。新增一個 slot class（例如 `evt/<event_id>`、或 P5 §8.6 承認的「retained=false 變體」）就要：改 topic 映射、改 ACL 生成器、對每個 MQTT 站點重新推 dynsec、再做一次 P5 §8.1 說的安全審查（因為生成器是安全程式碼）。所以相容矩陣不是「契約版本」一軸，而是「契約版本 × binding × 角色（unit / bridge / bridge 0）」。
- 混版的失效模式在兩個 binding 還不一樣：bridge 舊、unit 新（升級順序一旦顛倒就會發生），unit `put` 一個 v2 slot：HTTPS binding 回 4xx，可見；MQTT binding 被 dynsec 預設 deny（`mqtt-brokers.md` 列 7），MQTT 3.1.1 對被拒的 PUBLISH 沒有回報機制，MQTT 5 是否回 reason code 取決於 broker 設定（未查證）——一個可見一個靜默。契約若沒規定「未知 slot class」的行為，conformance suite 測不出這條差異。
- **依據**：P5 §1 最強理由 3、§3.2 binding 表、§8.6；`mqtt-brokers.md` 列 7；N-18（每種形狀都要 e2e）；F-39。
- **可不可以修**：可修。(a) 契約規定升級順序（parent 先於 child），並讓 `dial` 的 versions 協商到 slot class 層級；(b) ACL 生成器輸出「含舊版 slot 的聯集」，按 fleet 中最舊版本保留；(c) conformance 加「未知 slot class 必須可見地拒絕」。代價：1～2 人週一次性，但矩陣是永久成本——P5 把「e2e 矩陣 ×2」寫成弱點 1 是對的，只是乘數還要再乘上版本數。

### longevity-04（重大）N-09 完全沒寫，而 bridge 0 的 SQLite 被 P5 定為真相所在

- **情境**：形狀 (a) 或 (b)，bridge 0 在客戶站點的主機上；主機硬碟損毀或誤刪 compose volume。
- **壞在哪一步**：P5 §4.1 的 owner 表：「憑證、binding、path id：owner = bridge 0 issuer / registry；ERP 只是顯示用鏡像」；§9 可逆性表：「真相在 bridge 0 的 SQLite/registry，不在 Odoo」。這表示 bridge 0 的 SQLite 裡有：每環境的中繼 CA 私鑰（§3.6）、已簽發憑證清單與撤銷狀態、path id 指派、desired 鏡像、CQ 鏡像（90 天，§4.2）、watch cursor 變更紀錄（7 天）。P5 全文沒有「N-09」、「備份」、「還原」三個詞。P0 §1 第 6 點至少寫了「備份 = 複製檔案」；P5 連這句都沒繼承。
- 丟掉這個檔案的後果：issuer 不再有 CA 私鑰 → 無法續期 → 所有 unit 的短效憑證到期後全部變 `unknown`（不是 `rejected`，因為沒有人簽 `rev`）→ unit 依 N-11 用 last-known-good 繼續跑，但永遠接不回樹 → 要重新 adopt，而 T2 的 bootstrap 憑證在 adopt 後是否仍可用由平台決定、T3 明寫「bootstrap credential invalid after adoption」（00 §4.2 管理表）→ 整站手動重新佈建。
- 同源的兩個洞：(i) 對正在寫入的 SQLite「複製檔案」不保證一致，要用 online backup API 或 WAL checkpoint；(ii) N-04 要求 staging 還原自 prod 不得帶有效信任——含 CA 私鑰的 bridge 0 備份還原到 staging，staging 就能對真實 unit 簽憑證，§9 的「staging neutralisation as a built-in」P5 沒答。
- 順帶：P5 §4.1 說 binding 的 owner 是 bridge 0，F-33 說管理中心（ERP）是 binding authority。誰是 durable owner 沒有調和，而這決定還原時以哪邊為準對帳。
- **依據**：P5 §3.6、§4.1 owner 表、§4.2、§9；00 §4.2 管理表（T2/T3 bootstrap 與 adopt 列）；N-03、N-04、N-09、N-11、F-33；P0 §1 第 6 點。
- **可不可以修**：可修。(a) bridge 0 的 SQLite 用 online backup API 定時備份、加密、異地（形狀 (c) 由我們的雲端做，形狀 (a)(b) 寫進 N-01 的部署工件並要求客戶提供目的地）；(b) 中繼 CA 私鑰另行 escrow（離線或 HSM），不只存在 SQLite；(c) 憑證鏈帶環境 id，unit 只接受自己環境的鏈，讓 prod 備份還原到 staging 天然失效；(d) 還原演練列入 N-17 的 e2e；(e) 寫明 binding 的 durable owner 是 ERP 還是 bridge 0。代價 1～2 人週加 runbook。不修的話這是形狀 (a)(b) 最大的單點。

### longevity-05（重大）MQTT binding 綁在單一維護者專案的最新 minor 線上，而且把 unit 的管理 hop 也放上去

- **情境**：形狀 (b)，T-a 或 T-b 站點；時間軸 2027～2029。
- **壞在哪一步**：P5 依賴的 Mosquitto 功能全部是 2.1 線才有的：dynsec `%c`/`%u`（2.1.0，`mqtt-brokers.md` 列 7）、`persist-sqlite` plugin（2.1.0，列 9）、「內建 persistence 與 plugin 不可同開」（2.1.2，列 9）。2.1 線的時間軸是：2.1.0 = 2026-01-29、2.1.2 = 2026-02-09，之後約 8 個月沒有新 tag，master 前 8 筆 commit 全是同一位作者（列 2）。Eclipse Mosquitto 的 LTS 或版本支援政策：未查證（`mqtt-brokers.md` 沒有這一列，官方站台無法連線）。Debian / Raspberry Pi OS 是否已封裝 2.1：未查證；若沒有，bridge 上的 Mosquitto 只能用上游 Docker image 或自行編譯 arm64，前者是又一個時鐘（image 的 base OS），後者是又一個 build 工件。
- 比 P2 多出的風險是結構性的：P2 的 Mosquitto 只是 consumer，不在憑證路徑上；P5 讓 unit 的 `cfg`/`desired/credential`/`rev` 全走 broker（§3.6）。所以 Mosquitto 的一個 CVE（列 10）、一次 dormancy、或 3.0 的破壞性變更，直接打到那些 unit 的續期與撤銷，不只打到 T1 ingress。`persist-sqlite` 更只有 8 個月歷史，而 2.0.23 才修過「損壞的 persistence 檔導致 crash」（列 10）。
- P5 的解套已寫在 §8.2：unit 在 `watch` 收到空集合時以 HTTPS 退路全量拉。但這代表 MQTT 站點的 bridge 要同時開 443 與 8883（P5 的 (b) 圖也畫了），unit 要同時能走兩個 binding。這是正確的十年對沖，但它推翻 §1.1 T-a 的「省掉第二個 listener」——listener 一個都沒省，省掉的只是 P2 的 ingress library。
- **依據**：`mqtt-brokers.md` 列 2、7、8、9、10；P5 §1.1 T-a、§3.6、§4.2 broker queue 列、§8.2、§8.9；P2 §6 D-06 列（Mosquitto 不持有樹的憑證）；M-06。
- **可不可以修**：部分可修。(a) 把 HTTPS 退路從 §8.2 的「對策」升格為 MQTT 站點的硬性要求，並改寫 T-a 的收益說明；(b) 不開 `persist-sqlite`：P5 的模型本來就說 retained 只是快取、owner 在 SQLite，那就讓 broker 徹底無狀態，少一塊年輕程式碼；(c) 以 SBOM 固定 Mosquitto 版本，M-06 季檢加「2.1 線是否仍收 patch」。bus factor 本身不可修，只能靠 (a) 對沖。

### longevity-06（次要）三年後的替換成本表低估了 broker 與串流兩列

- **情境**：形狀 (b)，2029 年 Mosquitto 線停止維護，要換 NanoMQ 或 VerneMQ。
- **壞在哪一步**：P5 §9 估「dynsec/ACL 生成器、部署工件，1～2 人週」。漏掉：(i) dynsec 是 Mosquitto 專屬 plugin（`$CONTROL` JSON 指令、`%c`/`%u`，列 7），NanoMQ 的 per-client ACL、動態 ACL、cert → identity 對應全部未查證（列 16），VerneMQ 帶進 Erlang VM，M-02 +1 runtime（列 24、26）；(ii) `check_retain_source` 與 retained 回灌語意是 Mosquitto 的（`mqtt-semantics.md` MQ9、MQ10），§8.2 的回灌邏輯要重驗；(iii) 新 ACL 生成器是安全程式碼，依 P5 §8.1 自己的標準要再審；(iv) 每個 MQTT 站點要滾動替換 broker，期間 unit 不能斷管理 hop（見 longevity-05）。「HTTPS 串流換成 WebSocket / HTTP/2 push，2～3 人週」同樣漏了 fleet 雙運行期：舊 unit 講舊串流到下線為止。
- **依據**：P5 §9 可逆性表；`mqtt-brokers.md` 列 7、16、24、26；`mqtt-semantics.md` MQ9、MQ10；R7。
- **可不可以修**：可修：把 ACL 生成器放在一個 broker-adapter 介面後面、估計改為 3～5 人週加審查、串流替換加上「雙版本並存至 fleet 汰換完成」一列。這是估算修正，不是設計缺陷。

### longevity-07（次要）client library 的退路「自寫四種封包，1～2 人週」把外部時鐘換成自己的安全程式碼

- **情境**：任何 MQTT 站點；paho-mqtt 停更超過 P5 設定的容忍期。
- **壞在哪一步**：P5 §8.5 的事實是對的：paho-mqtt 2.1.0 之後約 29 個月無新版、rumqttc 仍 0.x。退路估計卻太輕：能撐生產的 MQTT client 不只「四種封包」，還有 CONNACK、PUBACK、SUBACK、PINGREQ/PINGRESP、DISCONNECT、session 狀態機、keepalive、TLS client cert 綁定、帶 jitter 的重連；而 MQTT 5 的 normative 條文連研究員都沒直讀到（`mqtt-semantics.md` §0）。自寫之後它是 node 內的安全程式碼，依 02 §3 第 5 項要進外部審查；conformance suite 從此只對「我們的 client + Mosquitto」跑，失去第二個獨立實作者。另一個未提的時鐘：paho 29 個月不動，與 Python 3.14+ 的相容性未查證；rumqttc 0.x 每個 minor 都可能破壞 API。
- **依據**：P5 §8.5、§9 第五列；`mqtt-semantics.md` §0、MQ1、MQ8；02 §3 第 5 項。
- **可不可以修**：可修：退路明寫為「MQTT 3.1.1 子集的自製 client，3～4 人週加審查」，或改用 `mqtt-brokers.md` 列 33 的 amqtt 類作為第二選項並記錄其 bus factor。代價是誠實的數字。

### longevity-08（次要）元件表在最大的那個外部時鐘上留白

- **情境**：所有形狀，十年尺度。
- **壞在哪一步**：P5 §2 元件表：Odoo「授權：未查證」「每年一大版（未另查證）」；Grafana「授權：未查證」；Anthias「未查證」。Odoo 是 desired/sq 的 owner（§4.1），`iot_*` 模組是契約的 ERP 端 reconciler，每個 Odoo 大版都要移植一次——這是系統裡節奏最快、面積最大的外部時鐘，P5 寫成兩個「未查證」。Grafana 方面，P5 沿用 P0 §6 第 4 點「年度升版」，但 02 §4 寫明每個 minor 只支援 9 個月、major 的最後一個 minor 延到 15 個月；年度升版若不精準落在每個 major 的最後一個 minor，每年約 3 個月無安全修補。這兩點所有提案共有；列為次要，是因為 P5 的「契約才是資產」讓 ERP 端 reconciler 成為契約的第一個消費者，它的移植成本應出現在 §9 的表裡。
- **依據**：P5 §2、§4.1、§9；02 §1「ERP 當 root complex」、§4；00 §7 Grafana 列；M-05、M-06、N-10。
- **可不可以修**：可修：補查 Odoo Community 授權與版本支援期（未查證）、Grafana 授權（未查證）；Grafana 升版政策改為「只落在每個 major 的最後一個 minor」；§9 加「Odoo 大版移植」一列並估人週。

### longevity-09（次要）PKI 的十年時鐘沒有寫

- **情境**：所有形狀；2030 年之後。
- **壞在哪一步**：P5 §3.6 寫了 bootstrap → adopt → 續期 → revoke，但沒有寫：factory CA 根憑證有效期要大於裝置壽命；每環境中繼 CA 的輪替週期與重疊期（N-04）；根輪替時新信任鏈如何送到已出廠的 unit（可用 `desired/credential` 帶鏈，但要進契約與 e2e）；MQTT binding 以 CN 當 username（`mqtt-brokers.md` 列 7），CN 格式若變，dynsec client 紀錄要重生成。P5 §8.2 已承認 `check_retain_source` 在憑證輪替後會讓 retained 消失（MQ9），說明輪替是會發生的事，卻沒有輪替的時程設計。P0 §4 同樣沒寫，P5 繼承了空白。
- **依據**：P5 §3.6、§8.2；`mqtt-brokers.md` 列 7；`mqtt-semantics.md` MQ9；N-04、F-35。
- **可不可以修**：可修：根憑證有效期 ≥ 15 年、中繼 CA 2～3 年含重疊期、輪替演練進 N-17；約 1 人週設計加測試。

### longevity-10（重大）沒有 node 的 OTA 路徑，P5 的每一條可逆性承諾都站在它上面

- **情境**：形狀 (c)，2029 年；站點 30 片 2026 年出廠的螢幕跑 node v1 + HTTPS binding v1；bridge 0 在我們雲端已升到契約 v2。
- **壞在哪一步**：P5 §9「三年後想換掉其中一塊」的每一列——換 binding、換串流做法、換 broker、換 client library——都假設 unit 上的 node 能收到新 code。P5 沒有寫 node 怎麼升級：沒有 OTA 機制、沒有 A/B、沒有簽章工件、沒有 staged rollout。02 §1 把 OTA 列為「以後，也許永遠不會」，P5 原樣繼承而沒有標示這是它可逆性主張的前提。沒有 OTA，longevity-02 的 binding 刪不掉、longevity-03 的相容矩陣永遠縮不回來、longevity-05 的 Mosquitto 退場要人到現場。`precedents.md` e13 查到 Mender client 是 Apache-2.0 且有 `Retry-After` 處理、server 的 Enterprise 組合要授權（`buy-options.md` D1、D2）；P5 讀過這份事實檔卻沒有在元件表或 §9 做選擇。
- P0、P2 同樣沒答，但對 P5 傷最重：P5 的賣點是可逆性（R7），而可逆性的物理載體是 unit 的升級通道。
- **依據**：P5 §9；02 §1「功能廣度與鎖定」段；`precedents.md` e13；`buy-options.md` D1、D2；N-10、R7。
- **可不可以修**：可修，兩條路：(a) 以契約自己的 job 語意做 node 自更新（`sq/<job_key>` 類型 `update`、簽章工件沿樹拉、A/B 根檔案系統、`actual/node_version` 回報），3～5 人週加外部審查，不加種類；(b) 採 Mender client（+1 runtime、+1 時鐘，server 自架 open-source 版或接受 Enterprise 閘門，未查證自架 server 的完整度）。不選其中一條，§9 的表就該在每一列加註「需人到站點」。

## 2. 此點成立

1. **(A)/(B) 的成本拆分成立。** 介面本身邊際成本接近零，因為 N-16 與 N-17 本來就逼著 node 把 HTTP code 與 register/SQ/CQ 分開，fake transport 就是 `memory` binding。P0 §6 第 2 點的「語言中立規格與 conformance test」如果當真，P5 的 (A) 就是免費的。
2. **三個「不做」全部成立。** 不寫 NATS binding（`nats.md` N20、N21：約 5～7 個月一個 minor、無開源 LTS；N17：2026 年 advisory 密集；N11：MQTT 5 被拒）；不把 MQTT 放到跨客戶網路的 hop（`transport-through-networks.md` T15）；不把管理面綁在任何 binding 上。這是 M-01 與 M-06 的正確運用，也是 P5 相對 P1、P3 真正的優勢。
3. **選 Mosquitto，而且選 dynsec 而不是 `acl_file`。** `mqtt-brokers.md` §3.1 把 Mosquitto 排第一（EPL/EDL 雙授權、bridge/retained/mTLS/dynsec 都有文件、安全修正有紀錄）；列 8 說 `acl_file`/`password_file` 2.1 起 deprecated、3.0 移除，P5 直接用 dynsec，3.0 升版時不會踩這條。P5 §8.1 還預先寫了 C-09 在哪一步會重現。
4. **資料層成立。** 同叢集獨立 database、窄表、月分區、`DROP PARTITION`（`postgres-timeseries.md` F-12）、roll-up 以增量 `INSERT ... SELECT` 而非 materialized view（F-13）、寫明搬到獨立實例的量化門檻（§3.4）。P5 比 P0 多補了「增量」這個字，正是研究員指出 P0 的缺口。
5. **retention 全部明寫、全部有 drop 計數，且承認 cq 視窗之外結果就是丟了。** P5 §4.2 沒有假裝 02 §1 的「送達假設改寫成 retention 長度」消失。這是 F-46 要的誠實。
6. **對外部時鐘的誠實。** §8.5 直說 client library 的時鐘比 broker 差、§8.9 說 Mosquitto 單一作者是每季要複查的訊號、§8.7 說只有一個實作者的契約沒有對抗式審查。這些弱點 P5 都自己先講了。
7. **§8.2 的 HTTPS 退路是正確的十年對沖**，雖然它推翻了 T-a 的「省一個 listener」（見 longevity-05）。有退路比省 listener 重要。

## 3. 最怕評審問什麼

如果我是 P5 的作者，最怕被問：「`precedents.md` §3.3 第 8 點說查不到任何先例為了傳輸可插拔而自己維護兩套生產 binding 的成本資料——那請你說明，2029 年第一個 MQTT 站點的 T1 退役、D-06 沒來、Mosquitto 兩年沒出 tag 時，那 40 台還在講 MQTT binding 的 unit 怎麼搬回 HTTPS，而搬完之前你的 M-01 刪除規則算不算已經失守？」
