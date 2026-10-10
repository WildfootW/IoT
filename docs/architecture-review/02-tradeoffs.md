# P0 的代價：我們犧牲了什麼，為什麼別人不這樣做（2026-10-10）

> 這份是 owner 問「犧牲了什麼、為什麼別人不這樣做」時的回答。它列出 P0 的帳單；這次對抗式審查的任務就是檢查這張帳單有沒有算錯、能不能少付。

## 1. 犧牲清單

**標準與生態。** NGSI 是 ETSI 標準，歐盟公部門標案會寫 FIWARE-ready。放掉之後沒有任何第三方工具天生懂我們的協定。我們是這個協定唯一的實作者。對台灣工廠客戶大概是低價值的犧牲，但它是真的。

**MQTT（owner 認為「失去感覺差很多」的那條）。** 它是 IIoT 的通用語。不用它失去：pub/sub 扇出讓第 N 個消費者接上來不用動裝置；retained message；last-will 讓離線偵測是秒級而不是五分鐘；幾乎所有 PLC 閘道和感測器廠商都講它。後果：T1 若講 MQTT，bridge 要多一個 MQTT adapter；D-06 的現場低延遲 HMI 層在 P0 裡沒有答案。

**協定是自己的（最深的一刀）。** 協定設計的難處在第五版不在第一版：fleet 升級很慢，2026 年裝的螢幕可能到 2029 年還在講 v1。版本協商、schema 演進、錯誤詞彙、相容性矩陣全部自己扛。reconnect storm、half-open connection、long-poll 被客戶 proxy 的 idle timeout 砍掉、retry 放大：broker 二十年前解掉的問題，我們會重新發現其中幾個。

**Pull-only 的代價。** 每個 child 一條掛著的連線；bridge 重啟後 thundering herd；命令延遲受 poll 週期限制；穿過客戶 proxy 的 long-poll 不一定活得過一分鐘。

**樹狀資料路徑。** 每一跳多一層緩衝、順序、背壓；bridge 0 是單點。別人把資料面做扁平、管理面才做樹，就是為了避開這個。

**收斂模型。** 放掉「送出去就知道到了」的心智模型；每個消費者都得寫成 reconciler。誠實的點：「node 保留最近的 job result by key」裡的「最近」就是 retention window，window 之外結果就是丟了。送達假設沒有消失，只是改寫成 retention 長度。非狀態事件（刷卡、按鈕）天生不適合 register，對 D-05 是真實限制。

**安全是自己的（最危險的一刀）。** 自己跑 CA、短效憑證、bootstrap、撤銷。錯誤是無聲的，一次就是整個 fleet。只有一個實作者的協定不會有對抗式審查，除非付錢。D-05 是安全產品，客戶 IT 會問「你們的平台有什麼認證」。

**資料層。** 平白 Postgres 取代 TSDB：失去壓縮（TSDB 常見九成以上）、continuous aggregates、內建 retention。Roll-up 等於自己養一個小 ETL。幾百個感測器沒問題，一萬個會痛。

**組織（最大的一刀）。** registry、憑證發行、協定、writer、排程、CA 工具全是自己的。沒有社群、沒有廠商補 CVE。M-06 說寫 code 便宜了；沒變便宜的是制度性知識。這張帳單三年後才來收。

**ERP 當 root complex。** Odoo 每年一個大版；C-20 的怪癖會滲進裝置管理邏輯；registry 真相住在 Odoo 的 Postgres，一次 ERP 遷移的 bug 可以 revoke 整個 fleet。沒有 Odoo 的站點就沒有裝置管理（對我們是故意的）。

**功能廣度與鎖定。** OTA 框架、staged rollout、device shadow 的 delta 語意、rules engine、fleet index、異常偵測：每一項都是「以後，也許永遠不會」。避開廠商鎖定，換來自我鎖定。

**一個具體的技術損失。** Orion 的 subscription 是通用扇出。P0 的扇出發生在 bridge 0；第三個消費者（MES、現場 HMI）出現時 bridge 0 必須長出 consumer 概念，否則會重新發明一個比較差的 Orion subscription。

## 2. 為什麼別人不這樣做

- 其實有人這樣做，而且是最大的那些：Tesla、Bosch、Apple、Nest、Sonos、每一家車廠都是自己的裝置協定、自己的 PKI、pull 式管理。成立的是「中型團隊不這樣做」，因為歷史上寫不起。M-06 的賭注是 AI 把「寫」的成本壓下來；這個賭注還沒被證明。
- 我們的模式在別的領域是主流：Apple MDM（APNs 只當 doorbell、裝置自己 pull）、Kubernetes（kubelet pull spec、回報 status、controller reconcile；spec/status = desired/actual、controller = class driver、level-triggered = F-46）、Puppet/Chef/Tailscale 控制面。IoT 業界走 broker 優先，是因為它的裝置是電池供電、8-bit MCU、不能掛連線；我們的裝置是插電的 Linux 盒子。
- 「hostile child 在 bridge 後面」的假設在雲端優先的 IoT 裡沒有。C-25 的現場是雲端 IoT 從沒面對過的環境。
- 別人也在最佳化別的東西：招聘、標案合規、demo 速度、投資人故事。
- 最根本：別人的中心是 IoT 平台、裝置是客戶；我們的中心是 ERP、裝置是 ERP 的功能。

## 3. 為了付這些代價，第一天就要放進去的東西

1. announce 裡的版本協商，加相容性矩陣。
2. bridge 0 的 consumer 概念（即使只有 ERP 和 store 兩個）。
3. 每個 retention window 都是明寫的設定且有監控：超過就是可見的 drop 計數。
4. 帶 jitter 的重連與 backoff。
5. PKI 與 bootstrap/adopt/revoke 流程上線前付錢做一次外部對抗審查。
6. 語言中立的協定 conformance test suite。

## 4. 「過了安全支援」的定義（Grafana 例）

軟體不會停止運作，停止的是廠商替那條版本線出修補。Grafana 規則：每個 minor 從發布起支援 9 個月，每個 major 的最後一個 minor 延長到 15 個月（來源：https://grafana.com/docs/grafana/latest/upgrade-guide/when-to-upgrade/ ）。

| 項目 | 日期 |
|---|---|
| 11.4 發布 | 2024-12-05 |
| 11.4 最後一個 patch，11.4.8 | 2025-08-12 |
| 11.4 安全支援結束 | 2025-09-05 |
| 12.4.x 支援到 | 2027-05-24 |
| 13.0.x 支援到 | 2027-01-09 |

來源：https://endoflife.date/grafana 、https://endoflife.ai/grafana/11.4 。

庫存表裡四種不同狀態：Mongo 6.0 是 EOL（廠商對整個 major 不再做任何事）；CrateDB 5.8 是 line ended（廠商活著但那條線沒有了）；Grafana 11.4 是 out of security support（廠商活著、產品活著、這條 minor 沒有修補）；QuantumLeap 是 dead（沒有人）。每個外部元件都帶進來一個你不控制的時鐘。
