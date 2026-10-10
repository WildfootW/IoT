# 結論先講

**P1 情境擬合：致命 0 條、重大 9 條、次要 1 條。** MQTT 樹有可行骨架，但目前不能依提案清單完成全部情境驗收；主要缺口是內容路徑、資料落盤與現場終態。D-05 實體安全控制尚不存在且不屬本次範圍，不據此判致命。

審閱日期：2026-10-11。以 [P1 全文](../../20-proposals/P1-mqtt-native.md#L1) 為準，已讀 [security.md](security.md#L1) 與 [longevity.md](longevity.md#L1)，不重列其簽章、撤銷與維護時鐘問題。下文是設計反例；修法、人週均為建議／估計，可能共用工作，不能直接相加。未做產品實測或新增網路查證。

## 證據邊界

來源沿用 2026-10-10 事實檔的查證日期與證據等級；摘要、二手與建議不升格為原文或實測。

| 代碼 | 來源與實際行號 | 本文使用邊界 |
|---|---|---|
| T7 | [transport-through-networks.md L45](../../10-facts/transport-through-networks.md#L45) | 原文記載 nginx 的 Upgrade header 與 idle timeout；不是客戶 proxy 的通過證明 |
| NET | [transport-through-networks.md L108](../../10-facts/transport-through-networks.md#L108)、[L109](../../10-facts/transport-through-networks.md#L109)、[L110](../../10-facts/transport-through-networks.md#L110)、[L112](../../10-facts/transport-through-networks.md#L112) | 輪詢、基礎服務、L2 隔離與不轉送 mDNS 的建議規則，不是符合標準的證書 |
| ACK | [precedents.md L42](../../10-facts/precedents.md#L42) | Apple MDM 留存結果、以 UUID 關聯並重試的原文先例；僅支持修法方向，不證明 P1 已實作 |
| BUY | [buy-options.md L92](../../10-facts/buy-options.md#L92) | 各平台 Odoo connector 未查證；「未查到」不代表不存在，也不能當成即買即用的修法 |

## 三種部署清單

以下為補齊 P1 所需的建議部署，不是已有 compose 或封包實測。8443 是本文建議的內容快取埠，非 P1 既定值；所有新連線預設 deny，僅允許列出的來源與目的地及其回應。

| 形狀 | 實際元件與放置 | 防火牆與端點清單 |
|---|---|---|
| (a) south/north 同主機 | ERP 主機：Odoo、ERP PostgreSQL、root node（SQLite、CA issuer、HTTPS cache）、root Mosquitto。CM4：unit node、SQLite、display backend、Anthias。單螢幕不開 history writer、history database、Grafana | CM4 → root：TCP 8883 mTLS、8443 HTTPS。root node → broker 1883 僅 loopback 且認證；root node → Odoo 內部 API、PG socket 僅本機。ERP UI 443 僅授權使用者網段；裝置不可因此取得 ERP/admin 存取權 |
| (b) 同站不同 VLAN | ERP VLAN 同 (a) 伺服端；每個 device VLAN 增 bridge Mosquitto、bridge node（SQLite、HTTPS cache、dynsec applier），有 Modbus 才開獨立 poller。各 T2 跑 agent/backend；T1 沿用韌體；HMI 在站內。有歷史才開 root writer、獨立 history database、Grafana | T2 → bridge：8883、8443；MQTT T1 → bridge：8884，僅 raw publish。bridge → root：8883 與 8443，不能只有 MQTT。poller → 白名單儀表 TCP 502；RTU 走本地 serial，無 TCP 埠。HMI → bridge 8883 唯讀。root writer/Grafana → history PG 僅本機或私網認證連線，禁止 device VLAN 直達。T1 與租戶的同 VLAN 橫向流量需 L2 isolation，bridge 不做 IP forwarding |
| (c) 雲端 ERP、站點 outbound-only | 每客戶獨立雲端 Odoo、ERP PG、root node、root broker；WSS/內容 HTTPS ingress 可用既有 reverse proxy。站點 bridge 與 units 同 (b)，node 啟用 WSS trunk；HMI 留站內；history/Grafana 可選且留雲端 | 站內規則同 (b)。bridge → 指定雲端 FQDN TCP 443：WSS 路徑及 HTTPS 內容路徑；若強制 explicit proxy，只准 bridge → 指定 proxy 埠，由 proxy 放行目的 FQDN/Upgrade。無攔截且獲准時可另選 MQTT/TLS 8883 profile；raw MQTT/TLS 443 必須有獨立 listener/IP 規劃，不能與 ERP HTTPS 搶 socket。站點不開 inbound，不做 port forwarding；雲端後端埠不公開 |
| 共通基礎服務 | 重用已驗證的 DNS、時間服務；CA 信任材料隨部署配置，不把它們默認成免費存在 | TCP/UDP 53 → 指定 DNS；UDP 123 → 有效 NTP；使用 DHCP 時只放指定伺服器的 UDP 67/68；mDNS UDP 5353 僅同 link，不跨 VLAN。分別設定 MQTT parent、WSS URL、內容 parent URL、ERP 內部 URL與 ERP 公開 URL（N-12），不得從 `web.base.url` 推導全部端點 |

### 一片螢幕的隱藏依賴

| 項目 | 必需／可選與計數口徑 | 開機時真正要驗的事 |
|---|---|---|
| 資料庫 | ERP PG 必需；root/unit SQLite、broker persistence 也有狀態。無 history database 不等於無資料庫 | 掛載、可寫、ERP 可服務；不是只看三個 application process 存活 |
| DNS、NTP | 必需依賴，可用既有服務，不必各新增 daemon | parent 可解析且 node 時間有效；mDNS 不能替跨 VLAN DNS |
| CA | factory CA 可離線；線上 issuer 已內嵌 root node，信任材料仍需供應 | 首次連線、adopt、重啟後能恢復受驗證連線，不需要額外常駐 CA 平台 |
| reverse proxy／nginx | 非每站必須新增；若沿用 ERP nginx 或雲端 ingress，必須納入路由與埠清單 | cache 可達、WSS Upgrade 正確；不能把既有 nginx 再算成必需第二個 proxy |
| 螢幕端 | unit node、display backend、Anthias/player、OS 啟動管理仍存在；Anthias 映像內部服務數與 RAM 未查證 | reconcile 完成後確實換頁；viewer 重啟可重載，不能拿 MQTT CONNECT 當播放器健康 |
| 可關閉項 | history writer、history database、Grafana、sensor/Modbus backend | 純 D-01 安裝不因可選服務缺席而失敗；實際 RSS、磁碟與啟動時間未查證 |

## 六條端到端走查

表中是應走完的業務流程與驗收終點，不是通過紀錄。共通傳輸：(a) unit → root；(b) unit → bridge → root；(c) 站內同 (b)，trunk 換為核准的雲端連線。

| 情境 | 完整流程 | 形狀差異與未閉合處 |
|---|---|---|
| D-01 | ERP Apply 持久化版本 V → root adapter 鏡像 → desired 經 broker 下達 → unit 驗證版本 → 向 parent cache 拉指定版本 manifest/媒體（再沿 parent 取 ERP 內容）→ display reconcile 本地 id/order/ghost assets → Anthias 換頁 → actual V 耐久回報 → ERP 比對 desired/actual 才顯示同步 | (a) cache 即 root；(b)(c) cache 在站點，斷 trunk 沿用舊內容。MES live board 還需 HTML → 每約 5 秒 JSON → freshness/idle 畫面與逐屏輪詢監控。見 scenarios-01、03、09、10 |
| D-02 | SFA40 → 獨立 sensor backend 1 Hz 採樣、warm-up/fault gating → 30 秒平均與來源時間 → node `m/env` → broker 路徑 → root schema 檢查／writer → PG history → Grafana 曲線／門檻線；越線另走 `ev/threshold` → ERP 業務事件，不建立逐筆 ERP rows | (a) 可與螢幕共 unit；(b)(c) 經 bridge。(c) WAN 緩衝不代表 PG commit；見 scenarios-04、07、09 |
| D-03 | 操作員在 south 登記儀表與 register map → 建立代表／announce typed schema → Fleet 出現 → poller 讀 RTU/TCP → 依型別解碼 signed differentialPressure 等數值、取 min/mean/max、近源時間 → node → broker → root writer → 穩定 series_id 歷史表 → Grafana | (a) poller 可在同機 south；(b)(c) 在 device VLAN bridge，無需 T1 主動連 broker。未知 register map/比例/byte order 必須先驗，不能猜；見 scenarios-04、05、09 |
| D-04 | ERP 依 announce capability 驗 effect/show → durable SQ key、single-flight → root/broker → 執行 node SQLite 去重 → worker 跑本地 timeline/backend → SQLite CQ → retained CQ 回 root → ERP 關聯同 key 的結果 → 清 SQ；standalone playlist 不依賴 ERP 在線 | (a) 同樣不能把兩個遠端 controller 當本地 I/O；(b)(c) show 下達至 bridge 後，各 strip 的執行與合併結果仍待定，見 scenarios-06 |
| D-05 | 管理驗收：硬體身分 announce → Fleet → ERP Manage → root 簽 adopt／bridge 套 dynsec → reader 換身分 → 心跳與 attestation 回報；一般非控制配置應確認 reader 的 applied 狀態，不能以 dynsec 成功代替。revoke 依 P1 區分正向拒絕與 unknown。事件：reader → `ev/access` → root 持久化 → ERP 出勤／稽核查詢 | 三形狀均只驗管理與事件；T3 實機、attestation verifier、配置結果仍待驗。鎖、OSDP、卡表與開門排程屬另案控制面，不能宣稱已交付安全門禁。事件斷點見 scenarios-07 |
| D-06 | PLC → edge controller/T1 MQTT → raw 守門／schema → 站內正規化資料 → broker → HMI；另一路 ≤1 Hz 上行 → root writer → PG/Grafana，業務變化 → ERP/MES。HMI 不寫 recipes/溫控，不經本通道控制機台 | (a) HMI 訂站內 root；(b)(c) 訂 local bridge，斷 WAN 不應中止現場顯示。Sparkplug 副本仍可選，不能假設它已補 freshness；見 scenarios-08、09 |

## Findings

### scenarios-01 | 重大 | 防火牆放了 intent 卻擋住內容

(b) D-01 按 Apply 後 desired 可到，下一步 HTTPS fetch 卻被「其餘 deny」擋下。[P1 防火牆清單](../../20-proposals/P1-mqtt-native.md#L91) 只有 8883/8884；§6 已設計 cache，但未把 unit → cache、bridge → 上游 cache 列入。依據：F-56、N-01、NET。

可修：補具體來源、內容 listener 與逐跳路由，維持 T1 不可直達 ERP；代價約 0.5 人週模板與拒絕／允許測試，不是取消隔離。

### scenarios-02 | 重大 | WSS 備援仍有未驗收的網路前提

(c) D-01/D-02，若客戶只允許普通 HTTPS 且拒絕 Upgrade，WSS 在握手就停，尚未進到 payload 簽章。P1 已提供 WSS，不是沒有退路；但 [§9 的 nginx 60 秒 idle PoC](../../20-proposals/P1-mqtt-native.md#L245) 不能驗證這項前提。依據：T7、F-41、N-18；實際客戶 proxy 行為未查證。

可修：把 Upgrade、proxy 認證與閒置後重連列為上線 gate；若不允許要求 IT 放行，須加普通 HTTPS 同語意退路。代價：驗收約 0.5 人週，新增 binding 另估 2～3 人週。不是宣稱所有 (c) 都失敗。

### scenarios-03 | 重大 | MES live board 缺少站點資料路徑

(b)(c) D-01，HTML 播出後開始輪詢，[P1 §5](../../20-proposals/P1-mqtt-native.md#L190) 卻把 JSON 放在 root node；§6 的媒體快取未定義 live JSON 轉送。螢幕依隔離規則不能直達 root，快取 HTML 也不會自行代理後續請求。依據：F-63、C-24、N-12。

可修：parent 提供同源 live proxy，分開配置 ERP/root/parent 端點；保留原始資料時間、離線標示與逐屏 polling 監控，不能把 bridge 抓取算成每片屏幕已刷新。代價約 1～2 人週與斷線測試。

### scenarios-04 | 重大 | broker 可達不代表歷史已落盤

(a)(b)(c) D-02/D-03，PG 暫停而 broker/subscriber 仍在線，斷在 writer commit。[R_buf](../../20-proposals/P1-mqtt-native.md#L157) 只規定 parent 不可達時緩衝；§5 未定義收到 MQTT 後、PG commit 前的耐久持有者與重播 cursor。重訂閱最後值不能重建期間所有樣本。依據：F-08、F-09、F-46。

可修：writer 先落耐久 journal，再以 PG commit cursor 回收，或保留近源批次至 commit 確認；重播須去重且更新 roll-up。代價約 1～2 人週與磁碟預算。ACK 是應用確認的參考，不是要求改用 Apple 協定。

### scenarios-05 | 重大 | Modbus 白名單不是儀表身分

(b)(c) D-03，儀表換 IP 或同 IP 換機後，[P1 §6](../../20-proposals/P1-mqtt-native.md#L202) 的 TCP 白名單只能限制可達性，未規定 reservation/DNS 與代表 id 的對照、換機確認；輪詢會斷，或新儀表資料續進舊 series。依據：F-22、F-14；NET 的 502 放行不是身分證明。

可修：登記 stable id、位址與可取得的 serial；無 serial 的 RTU 以 bus/address 加人工換機確認，避免把地址當永久身分。代價約 0.5～1 人週與現場登記程序；vendor 是否能讀 serial 未查證。

### scenarios-06 | 重大 | bridge 的本地 timeline 不等於各 strip 本地

(b)(c) D-04，兩條 strip 分接兩台 CM4。[P1 §6](../../20-proposals/P1-mqtt-native.md#L204) 只把 show 當 bridge job；若 bridge 逐時刻送 child 指令，網路抖動重新成為 timing 條件；若只回 bridge 排程結束，也未證明每條 strip 完成。依據：F-44、F-49、F-52。

可修：明定同一 show 由同機多通道 backend 執行，或各 unit 先取得完整 timeline、明示不保證跨盒同步並合併逐 strip 結果。代價約 1～2 人週，可能另有控制器／配線成本，金額未查證。

### scenarios-07 | 重大 | 刷卡與越線事件沒有近源耐久窗口

(c) D-05，站點 broker 收到刷卡後斷電，root 尚未持久化；[P1 §6](../../20-proposals/P1-mqtt-native.md#L206) 只指定 QoS 1 與 root 落盤。§4.3 的 CQ 是 job 結果、R_buf 是量測，沒有 `ev/access` 的 event owner／重播窗口。D-02 的 `ev/threshold` 同樣未閉合。依據：F-46、F-67、ACK。

可修：reader/edge 發送前寫 event journal，帶 event id、sequence、來源時間；root durable receipt 後才回收，ERP 去重並監控 retention/drop。代價約 1～2 人週與磁碟；這只補事件可靠性，不提供開鎖安全保證。

### scenarios-08 | 重大 | HMI 仍缺新鮮度與更新率契約

(b)(c) D-06，PLC poller 停而 node/broker 仍活著，既有 HMI 畫面何時失效？[P1 §5](../../20-proposals/P1-mqtt-native.md#L194) 只要求過期 retained 不送給新訂閱者，未定既有畫面的 stale 計時；LAN 延遲也不等於 ≤1 Hz 資料滿足 HMI 更新需求。依據：F-04、F-05、F-01、D-06。

可修：HMI 依來源時間/status 自行失效；先定延遲目標，必要時另開不往上 bridge 的本地較高速資料，北向仍 ≤1 Hz。代價約 0.5～1 人週加 HMI 適配；延遲與 vendor 行為未查證。

### scenarios-09 | 重大 | 零時間會同時破壞資料與 Fleet

(a)(b)(c) D-01 開機、D-02 畫線與 D-05 事件，現場 NTP 回零時，[P1 §5](../../20-proposals/P1-mqtt-native.md#L184) 的 device_time 沒有有效來源，近源量測時間與五分鐘 offline 判斷都失真；加 `ts_source` 不會修好時鐘。依據：N-14、F-02、F-27、NET。

可修：部署指定有效時間源與開機 sanity gate；未同步標 time_unknown，保留原始資料但不冒充新鮮量測，逾時計算用 monotonic clock。提供受控校時，不能略過憑證驗證；last-known-good 顯示仍可繼續。代價約 0.5～1 人週，另需站點時間服務。

### scenarios-10 | 次要 | 三個服務的存活不足以驗收單螢幕

(a) D-01，三個 application process 啟動後，若 PG 未就緒或 viewer 被刻意停止，Apply 到換頁仍不成立。[P1 §8](../../20-proposals/P1-mqtt-native.md#L236) 只把 B-13 留給 deploy 重寫，未定 readiness、project 名稱與刻意停止後的重啟政策。依據：N-07、N-13；不是重算 longevity 的種類帳。

可修：用上方依賴表定啟動／停止契約，probe 訂閱、cache 與 viewer readiness；演練 crash/reboot、刻意 stop 且不傷旁邊 ERP，再量足跡。代價約 0.5～1 人週；不因沒有 history store 就略過必需依賴。

## 驗收與肯定

N-18：P1 §9 已排三形狀 e2e，缺的是可觀察的通過條件。建議每種形狀跑上表六流程，保存 ERP 終態、PG 樣本及畫面證據；注入拒絕 Upgrade、PG 停機、時間回零、backend crash、主機 reboot 與刻意 stop。可用 fake PLC/T3 管理 stub，但不能因此宣稱實體安全產品已驗證。

- 此點成立：retained 只是快取，desired/actual 與 per-key CQ 有 owner；本批評不把 PUBACK 誤當 P1 的完成定義。
- 此點成立：D-01 已選 HTTPS parent cache；scenarios-01 要補路由，不是再發明快取。
- 此點成立：D-06 站內 broker 讓 HMI 不依賴雲端往返；仍需 scenarios-08 的資料有效性判斷。
- 此點成立：純螢幕不需 history store；D-05 控制面另案的邊界也正確，不能以未建安全控制判本案致命。

## 作者最難回答的一問

在 (c) 站點只允許普通 HTTPS、時間未同步且 PG 剛恢復時，一次 Apply 與一筆刷卡分別由誰耐久持有、走哪些已放行端點，憑什麼證據判定螢幕已換頁且 ERP 沒少一筆事件？