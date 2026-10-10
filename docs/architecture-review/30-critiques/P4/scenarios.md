結論先講：致命 0 條、重大 10 條、次要 0 條。P4 買到平台零件，尚未證明買到完整情境；主要缺口在 function 路由、文件出口、現場資料與管理介面。不能由產品清單推得三種形狀均可交付，也不能把未查證當成產品必然不支援。

## 範圍與證據

| 項目 | 紀錄 |
|---|---|
| 執行 | 2026-10-11；僅 P4 scenarios critic；依指定順序讀完 brief、00/01/02、LOG/interim、P4、既有兩份批評、三份事實檔 |
| 模型 | 要求 strongest / high；host 無法核驗或設定。實際為 inherited default，未設定 effort；未委派代理 |
| 查證邊界 | 本輪僅本機文件審查；host 未提供 ToolSearch，未做 web research、產品實測或 repo code 執行。以下第三方證據沿用事實檔的 2026-10-10 日期及證據等級，不聲稱重新查證 |
| 去重 | [security.md](security.md)、[longevity.md](longevity.md) 的授權、TLS 信任、gateway 越權、撤銷、public dashboard 暴露面、備份與版本時鐘不重算；本文檢查採納既有妥協後仍缺的操作流程 |
| 判定與成本 | 全部為可修的設計／驗收缺口；人週是評論者粗估，未報價，修補可能共用工作，不宜直接相加 |

| 證據鍵 | 本機來源與查證日 | 能支持什麼，不能支持什麼 |
|---|---|---|
| 買T7 | [buy-options.md](../../10-facts/buy-options.md#L30)，2026-10-10，搜尋摘要 | Edge 發起 gRPC stream；不是所有 client 均能穿越 proxy 的證明 |
| 買G2 | [buy-options.md](../../10-facts/buy-options.md#L92)，2026-10-10 | 官方 Odoo 整合介面未查證；不能推論已有完整 iot_tb，也不能推論官方 connector 不存在 |
| 買判斷 | [buy-options.md](../../10-facts/buy-options.md#L146)，2026-10-10，作者意見 | 「MQTT 原生可直接吃 T1」不是協定相容性證據；P4 §3.2 自己仍安排 broker、converter |
| 網T7 | [transport-through-networks.md](../../10-facts/transport-through-networks.md#L45)，2026-10-10，原文轉錄 | nginx HTTP proxy 的 read timeout 與 WebSocket 轉送條件，不是 Edge gRPC 存活測試 |
| 網T12 | [transport-through-networks.md](../../10-facts/transport-through-networks.md#L50)，2026-10-10，摘要 | HTTP/2 PING 與 idle timer 有條件限制；事實檔明說不能據此斷言進行中的 stream 必被切斷 |
| 網規則 | [transport-through-networks.md](../../10-facts/transport-through-networks.md#L108)、[transport-through-networks.md](../../10-facts/transport-through-networks.md#L109)，2026-10-10，設計意見 | south 主動輪詢與 DNS/NTP 需要另外放行；不是標準符合性認證 |
| 先e15 | [precedents.md](../../10-facts/precedents.md#L42)，2026-10-10，原文轉錄 | Apple MDM 將結果綁 CommandUUID；只作結果識別先例，不證明 ThingsBoard 已實作我們的 show 聚合 |
| 先e17 | [precedents.md](../../10-facts/precedents.md#L44)，2026-10-10，原文轉錄 | Kubernetes 的 list/watch 可從完整狀態恢復；不是 ThingsBoard Edge 的離線登入或重新載入保證 |

## 元件與網路

下表是依提案重建的必要路徑及待補設計，不是已部署清單。埠號不是產品預設保證；現有 DNS、NTP、CA 與 proxy 可以共用，但不能從依賴表消失。

| 符號 | 邊界 |
|---|---|
| O | Odoo + iot_tb + integration hub polling；Odoo PG 持有業務 desired、binding |
| S / P | ThingsBoard server、rule chains、registry、attributes、RPC；P 為其 PG（含 ts_kv），與 Odoo 分 DB |
| E / PE | ThingsBoard Edge、本地 rules/UI、事件緩衝；PE 為 Edge 自己的 PG |
| G | IoT Gateway、custom connector/converter、本地 SQLite 緩衝與結果；connector 不另算獨立 process |
| B / A | 獨立 function backend（display reconcile、sensor、LED 或選定的 Modbus poller）；A 為 Anthias/player 與本地媒體 |
| H / V | 現場 HMI 瀏覽器；V 為選用的 Grafana（本次特別走查），不是把移除 Grafana 本身列為缺陷 |

| 形狀 | 實際元件與放置 | 必要連線／防火牆設計 |
|---|---|---|
| (a) 同主機 | north/south 共用站點主機：O、S、PG；不放 E。CM4：G、SQLite、B、A。D-02 加 sensor process；D-03 選定一個 poller；D-06 的 H 讀本機 S；有歷史需求才啟用歷史工作與 V | CM4→S TCP 8883；文件 client/player→O content TCP 443；O→S 私有 REST；O/S→各自 PG 5432 僅私網。H→S HTTPS/WSS 443；V→P 5432 僅 ops。nginx 若共用 443，須分清 O content 與 S API 的 hostname/route，不能假定同機即同 URL |
| (b) 同站跨 VLAN | ERP VLAN：O、S、P、可選 V。south 管理介面：每 device VLAN 一個 E+PE；需要時加 gateway/poller 與 Mosquitto。device VLAN：CM4 的 G/B/A、T1；H 放指定操作員網段 | G→E 8883；E→S gRPC/TLS 7070；O→S 私有 REST。另需 poller→白名單儀表 TCP 502，RTU 則為本地 serial，不是開網路埠。CM4→O content 443；H→E HTTPS/WSS 443。T1 MQTT→Mosquitto 1883 僅隔離網段，G 訂閱後 converter→E；不把 1883 開到 ERP |
| (c) 站點 outbound | 雲端：O、S、P、NLB、可選 V。站點：E+PE、G/B/A、T1、H、選用 broker/poller、客戶 egress proxy | E→指定 proxy 的政策埠，再 CONNECT 到 cloud Edge FQDN:443→NLB TCP passthrough→S TLS。CM4 文件 client/player 另需到 content FQDN:443 的合法出口，不能沿用 E 的設定而視為完成。站內 G→E 8883、H→E 443、poller→T1 502。雲端 O→S REST、V→P 私網 5432；不得為 V 公開 DB 或開站點 inbound |
| 共通依賴 | OS、JVM/Python、compose/service 管理、DB/SQLite/media volumes；DNS、有效 NTP、預置 CA 信任／憑證部署；反向代理 nginx（若採用）；D-05 reader adapter 尚待定 | DNS TCP/UDP 53、NTP UDP 123 只到核准服務；需要 DHCP 才放行對應本地服務。CA 信任先佈建，不讓 device zone 進 admin plane。return traffic 僅既有 session；其餘 deny。T1 同 VLAN lateral isolation、bridge 不轉送 IP 沿用既有安全要求；資料庫不對裝置開放 |

## 十八組完整走查

箭頭代表必要整合，不代表產品原生代辦。每列均含回程；文件、HMI 與 Grafana 不是 gRPC 自動涵蓋的通道。

| 情境 | 從輸入到實際輸出及回程 | 最小反證／關聯 finding |
|---|---|---|
| D-01 (a) | O Apply→S shared attributes→G display connector→B reconcile→A 換頁；CM4 另向 O 取指定 V 文件及 assets；B applied V→G→S client attributes→O 比對。MES 頁另讀 O 的 token JSON | 同 CM4 加 sensor function，確認改的是 display；換 content hostname 後仍取到指定 V。01、02 |
| D-01 (b) | O Apply→S→E→G→B→A；CM4→O 文件／assets；applied V→G→E→S→O。MES live board 仍需 work centre、idle、freshness 與約 5 s 資料更新 | 套用 deny 規則後實際換頁；不能只看 MQTT 已連線。02 |
| D-01 (c) | O Apply→S→NLB／proxy 上 E 已開 stream→E→G→B→A；CM4 經自己的出口取 O 文件；applied V 經 E→proxy→S→O | 只允許 E 出網時換全新素材；用實際文件 client/player，而非在 Edge 主機測 curl。02、10 |
| D-02 (a) | SFA40→sensor process（warm-up gate、30 s mean、source ts）→G→S filter/alarm/Save Timeseries→P→V SQL 畫 HCHO 線；alarm/health→O polling，不建每樣本 ERP row | NTP 回零、整數與浮點各一筆，核對曲線／80 ppb 門檻。03、05 |
| D-02 (b) | sensor process→G→E rules/PE→gRPC→S rules/P→V；alarm/health→O，warm-up 與 stale 隨資料一起保留 | WAN 以外先斷 E→S，再補傳；不能把到達時間當量測新鮮度。03、05 |
| D-02 (c) | sensor process→G→E/PE→proxy→S/P→雲端 V；O 只輪詢業務告警與 presence；斷雲時 E 緩衝 | 冷開機無時間、恢復時間再補傳；雲端圖保留缺值區間。03、10 |
| D-03 (a) | 儀表 RTU serial 或 TCP→具名 poller→register 解碼／signed differentialPressure／區間統計／ts→G→S→P 歷史→V；O 只收業務事件 | 實際 serial 權限、TCP 502、負壓數值與原始時間。04、05 |
| D-03 (b) | device VLAN 儀表→由 south poller 主動讀取→converter→G→E/PE→S/P→V；設備代表對到穩定序號／地址映射 | 禁止所有未列連線後仍讀得到儀表；反向 502 不可漏。04 |
| D-03 (c) | 站內儀表→poller→G→E/PE→proxy→S/P 三年歷史→V；站內採樣不依賴雲端在線 | 分開驗收採樣、緩衝、補傳與歷史查詢；不以 Edge active 取代儀表狀態。04、05 |
| D-04 (a) | B capabilities→G→S→O 驗證；O show/profile→S attributes、effect job→S RPC→G→B 本地播放；各 strip 結果→SQLite/G→S→O | 移除一條 strip，整個 show 不得報完成；standalone playlist 仍可用。06 |
| D-04 (b) | capabilities→G→E→S→O；O show/job→S→E→G→B；結果按 strip/function→G→E→S→O | 同 CM4 多 function 與多 CM4 的結果不得混合。01、06 |
| D-04 (c) | O show/job→S→proxy stream→E→G→B 本地 timeline；strip 結果→G→E/PE→S→O；不靠網路提供 show 時序 | 雲斷後本地行為不變，恢復後 ERP 可辨部分完成。06、10 |
| D-05 (a) | O Manage→S device/binding/config→待定 reader adapter→reader；reader 身分、存活、管理設定 actual→adapter→S→O Fleet；門鎖控制另平面 | 不新增門鎖控制；證明呈現的是 reader，不是 G 的 online。07 |
| D-05 (b) | O Manage→S Edge 指派→E→reader adapter→reader；reader 管理狀態→E→S→O；既有門禁平台若存在則由 O connector 接它 | 換 south 路徑仍為同一 reader；不再手建第二份 Fleet。07 |
| D-05 (c) | O Manage/config→S→站點 E 已開 stream→adapter→reader；reader presence/applied config→E→S→O；事件進指定事件庫再成 ERP 業務資訊 | 站點斷線時 Manage 顯示待套用；不得把 binding 寫入當 reader 設定完成。07、10 |
| D-06 (a) | PLC→邊緣控制器唯讀介面→G connector→S；H 以站內 HTTPS/WSS 看 S，S→P→V 分析，O polling 接業務資訊 | (a) 沒有 E，必須明選本機 S 的 HMI 路徑；recipes/control 不經此鏈。08 |
| D-06 (b) | PLC→controller→G→E/PE→H 本地畫面；E→S/P→V；O polling 接機台業務資訊；控制留 local | H 所在 VLAN 可載頁、登入與訂閱；PLC 更新率到 UI 延遲分開量。08 |
| D-06 (c) | PLC→controller→G→E/PE→H；E 緩衝後經 proxy→S/P→V，O polling 接業務；WAN 不在 H 的資料路徑 | 斷 WAN 後新瀏覽器登入／reload 仍見當前資料，非僅原有頁面存活。08、10 |

## Findings

### scenarios-01 | 重大 | Gateway 與 function 的 API 邊界未閉合

**(a)(b)(c)，D-01、D-02、D-04。** 壞在同一 CM4 同時有 display、sensor、LED：§3.2 分出 gateway/device API，§4.1 卻用 `v1/devices/me/*` 描述 function 的讀寫。尚未決定 attributes/RPC 屬於 gateway 還是 child；連線成功仍不能保證 display 收到自己的版本，這不是既有越權 finding。

依據：[P4 §4.1](../../20-proposals/P4-buy.md#L123)、F-20、F-39、買G2。可修：固定 unit/function 到 TB entity、connector 與結果欄位的映射，以同機雙功能反證；代價約 1 人週，實際 child API 串接未查證。

### scenarios-02 | 重大 | Edge 出口不涵蓋文件與 player

**(b)(c)，D-01；(a) 亦受 N-12 約束。** 壞在收到 desired 後下載新素材：P4 已承認 C-24，卻沒有指定文件 client、player 的 proxy、DNS 與 content base。Edge 可出網，不代表 CM4 可向 ERP 內部名稱取文件；gRPC 緩衝也不等於 assets 快取。合法 URL 一樣可能不可達，與 security-11 的 URL 真偽不同。

依據：[P4 §6](../../20-proposals/P4-buy.md#L197)、F-56、F-60、F-63、N-12、買T7。可修：獨立設定 root/API/content 名稱，列出各 client 出口或增設版本化內容 relay/cache，補 MES token JSON；代價 1～2 人週及快取容量。

### scenarios-03 | 重大 | 接受 ts 不代表現場有有效時間

**(a)(b)(c)，D-02、D-03。** 壞在冷開機後產生第一筆量測：站點 NTP 回零時，帶 `ts` 不能證明量測時間正確；補傳時若改蓋接收時間，Grafana 與告警又會把舊值看成新值。這是正常採樣的時鐘故障，不是 retained 攻擊；P4 的 `active` 二次判斷仍需可信時間。

依據：[P4 §5](../../20-proposals/P4-buy.md#L174)、F-02、F-04、N-14、網規則。可修：明列核准時間源、同步品質與無效時間隔離，保留原始時間及缺值；代價 0.5～1 人週與無 NTP 冷啟動測試，TB 實際 ts 行為未查證。

### scenarios-04 | 重大 | Modbus 設定檔沒有決定輪詢程序的位置

**(b)，D-03；(a)(c) 同需指定 poller。** 壞在第一個 read：圖把 TCP 儀表畫成被 south 輪詢，但白名單只有 8883/1883 與 north 7070，缺 south→儀表 502。改獨立 backend 只處理隔離，沒有交代 RTU 的 serial 掛載、權限及唯一讀取者。即使 connector 支援協定，現場 register、signed 值與統計仍須驗收。

依據：[P4 §3.1](../../20-proposals/P4-buy.md#L70)、F-01、F-22、D-03、網規則。可修：固定 poller 主機、serial identity、地址表與 decoder fixture，驗證負壓到歷史表；代價約 1 人週及儀表文件，RTU 整合未查證。

### scenarios-05 | 重大 | 唯讀資料庫帳號還不是 Grafana 整合

**(a)(b)(c)，D-02、D-03、D-06，選用 Grafana。** 壞在入庫後畫線：P4 的窄表還需 entity/key 到機台／量測的映射、數值欄選擇、時間轉換與缺值規則。只授予唯讀角色，不能驗收 HCHO 門檻或 signed 壓差；(c) 現場 Grafana 若直接連雲端 PG，又多了未列的出口。

依據：[P4 §5](../../20-proposals/P4-buy.md#L174)、F-10、F-13、F-14、N-12。可修：V 放 north，交付唯讀 view、dashboard-as-code 與同筆資料核對；現場必要時另設受控查詢 API；代價 1～2 人週，SQL/schema 實測未查證。

### scenarios-06 | 重大 | 單一 RPC 結果無法代表多條 LED show

**(a)(b)(c)，D-04。** 壞在 Odoo 判斷 show 完成：提案把 show 當 shared attributes、effect 當 RPC，卻未定義參與 strip、各自 capability/version 與整體結果的對應。一條 strip 回覆不能代表其餘都載入；平台有狀態欄位，不等於有 show 的業務聚合。

依據：[P4 §6](../../20-proposals/P4-buy.md#L203)、F-06、F-44、F-49、先e15（僅先例）。可修：O 持參與者 manifest，B 執行本地 timeline，回報逐 strip 版本／結果並顯示部分完成；不要求網路同步起跑。代價 1～2 人週及缺席 strip 測試。

### scenarios-07 | 重大 | Reader 管理面仍缺具名 adapter

**(a)(b)(c)，D-05。** 壞在 Manage 寫完 registry 之後：§2 只列 display、LED 等 connector，沒有 reader 如何接收管理設定、回報實際設定與自身存活的契約。憑證型別與廠商名稱不是終端整合證據；只看 gateway active 會把斷線讀頭顯示在線。不重論既有 attestation／撤銷缺口。

依據：[P4 §6](../../20-proposals/P4-buy.md#L205)、F-26、F-27、F-34、F-39。可修：指定 reader adapter 與管理欄位白名單；已有門禁平台則只做 ERP connector。卡權限、排程、門鎖動作不得混進本通道。代價初步 1～2 人週，vendor API 未查證，控制面不在估價內。

### scenarios-08 | 重大 | 本地儀表板須能在斷雲後重新開啟

**(b)(c)，D-06；(a) 改走 S。** 壞在 WAN 中斷後 HMI 首次登入或 reload：已有 WebSocket 頁面還活著，不能證明帳號、dashboard、entity 指派與靜態資產都在 E。P4 未列 H 的 HTTP/WSS 路由，也未將 PLC 採樣週期與 UI 更新延遲分開；「LAN 等級」不能當驗收值。

依據：[P4 §6](../../20-proposals/P4-buy.md#L207)、N-11、N-15、先e17（僅恢復先例）。可修：預佈建本地資料與登入，斷 WAN 後用新瀏覽器測；約定低延遲預算，控制仍留 PLC。代價約 1 人週，Edge 離線登入及實際 HMI 整合未查證。

### scenarios-09 | 重大 | 一片螢幕缺少開停機依賴契約

**(a)，D-01；(b)(c) 再加 E/PE。** 壞在既有 ERP 主機重啟或操作員刻意 stop：三服務數沒有描述 DNS/NTP/CA、nginx、CM4 SQLite、B、Anthias 與媒體的 ready 順序、重試及唯一服務管理者。API port 可連不等於 player 已能換頁；不能由容器啟動數推得 N-07 通過。

依據：[P4 §3.1](../../20-proposals/P4-buy.md#L57)、N-07、N-13、B-13。可修：依上表交付同一套 start/stop owner、獨立健康檢查與重啟策略，測 PG 遲到、全機重開及 deliberate stop 保持停止；代價 0.5～1 人週。不重算 JVM／授權種類，足跡仍須量測。

### scenarios-10 | 重大 | gRPC PoC 不能代替部署形狀驗收

**(c)，D-01 至 D-06；(a)(b) 同須逐列驗收。** 壞在交付 gate：§9 只估 (a)(b) e2e，另給 (c) gRPC PoC。即使 TLS 信任已修好，10 s keepalive 也不能證明 CONNECT、HTTP/2、stream、文件及 HMI 同時可用；網T12 只是摘要，不能拿來宣稱必過或必斷。

依據：[P4 §9](../../20-proposals/P4-buy.md#L244)、N-18、買T7、網T7、網T12。可修：以上 18 列各具通過條件，覆蓋 direct、proxy、TLS inspection、重連與冷啟動；拒絕的網路形狀須先有已驗證替代，不能以 FIWARE 名稱兜底。代價 2～3 人週及實際 proxy 環境；本輪未執行。

## 此點成立

- 此點成立：Odoo 保留 playlist/profile/show 的業務權威、樣本不進 ERP rows，符合 F-03；問題在 adapter 是否把這個分工落實。
- 此點成立：以輪詢取業務結果避免另開 webhook 是合理選擇；仍須把 function 結果對回 ERP，而非把輪詢成功當執行成功。
- 此點成立：P4 已承認 Modbus 需二選一、Edge gRPC 未查證，且 (a) 主動省掉 Edge。這些是可測的整合起點，不是必須推倒重建的理由。

## 作者最難回答的問題

請在同一片 CM4 同掛螢幕與感測、站點只准核准 proxy 出口且沒有有效 NTP 時，指出哪個已交付的 adapter、文件通道與健康檢查，能讓 Apply 真正換頁、曲線不造假、HMI 斷雲重開仍可用，而不靠臨時放寬防火牆？