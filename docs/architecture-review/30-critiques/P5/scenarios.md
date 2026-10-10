結論先講：致命 0 條、重大 9 條、次要 0 條。P5 的傳輸分層可保留，但九處操作流程仍不能由契約測試代證；補完既有安全與維運修法，也尚不足以交付三種部署。

## 審查邊界

日期：2026-10-11；僅 P5 scenarios。以下是文件反例推演，不是執行結果；修補成本是審查者估計。產品證據沿用事實檔的 2026-10-10 查證，保留原文、摘要與未查證的區別。

以 [security.md](security.md) 的簽章、raw/n 分離、禁止 HMI 直讀 raw，以及 [longevity.md](longevity.md) 的備份、OTA、版本修法為前提，不重複計票。P5 已寫 hello、回灌、retention、ERP version 修補；本文不說它們不存在。[interim.md](../../50-synthesis/interim.md) 不是已採納的答辯。

## 部署實體

依 [P5 §2](../../20-proposals/P5-pluggable-transport.md#L49) 與 [§3.4](../../20-proposals/P5-pluggable-transport.md#L128) 展開。下表是待交付的具體配置基線，不是假稱已有 compose；18443、3128 是配置例，非產品預設。B0 = bridge 0，B = 站點 bridge，U = unit。

| 形狀 | 元件與位置 | 必須落成的 firewall 規則 |
|---|---|---|
| (a) south/north 同主機 | 中心：Odoo、ERP PostgreSQL、反向代理、B0=B（issuer、SQLite）；CM4：U、SQLite、各 function backend。D-02/03/06 加 writer、history database、Grafana；觸發 T-a/b/c 才加 broker | U -> B 私有 IP TCP 443；管理端 -> ERP 管理 IP TCP 443；B0 -> ERP 私有 queue endpoint TCP 18443；writer/Grafana -> PG 私有端點 TCP 5432。兩個 443 必須綁不同介面或由明確路由的反向代理分流；禁止 U 直達 ERP/PG |
| (b) 同站不同 VLAN | ERP VLAN 放 Odoo、PG、反向代理、B0；每個 device VLAN 放 B、SQLite、Modbus backend；U 與其他 backend 在設備。需要 MQTT 時放 raw/n broker，HMI 在現場 | U -> 自己 B TCP 443，MQTT unit -> n TCP 8883 且保留 HTTPS 退路；B -> B0 TCP 443。不同 device VLAN 互拒；ERP 不主動連設備；其餘依共用規則 |
| (c) 雲端 ERP、outbound-only | 雲端：Odoo、PG、per-tenant B0、LB；站點：每 VLAN 的 B、SQLite、U/backends，按需 raw/n broker 與本地 HMI runtime | explicit proxy 範例：B -> 指定 proxy TCP 3128，proxy 僅准 CONNECT 到 tenant root FQDN:443；透明 TLS inspection 則 B -> 該 FQDN TCP 443。WAN -> site 無新增入站；不放行跨網路 MQTT；HMI 不依賴雲端回連 |
| 三形狀共用 | T1、基礎網路服務、HMI 與分析消費者 | default deny，允許 established 回程；T1 MQTT -> raw 的指定 listener TCP 1883 或 8883（依實機能力），poller -> 白名單儀表 TCP 502，RTU 無 IP port；HMI -> 本地頁面 TCP 443、n TCP 8883 或 B 的唯讀 API TCP 443；DNS 只到指定本地 resolver TCP/UDP 53、NTP 只到有效本地來源 UDP 123、需要 DHCP 才開 UDP 67/68。bridge 不做 IP forwarding；同 L2 的 T1/租戶隔離須由 AP/交換器落實，不能靠跨 VLAN ACL |

| 一片螢幕的帳 | 真實依賴及是否新增 |
|---|---|
| 中心服務群 | 既有 Odoo 仍依賴 ERP PostgreSQL；新增 B0 process 與 SQLite。反向代理可重用既有 nginx，但須有獨立 root 路由與設定；無 history database、Grafana、Mosquitto |
| CM4 | U + SQLite、display backend、Anthias/player 與瀏覽器、完整媒體快取；Anthias 映像內是否另含 nginx、實際 process 數未查證，不虛報精確總數 |
| 基礎設施 | DNS、NTP、按需 DHCP 必須指明提供者；CA trust 與金鑰佈建不可省，issuer 已在 B0，不另捏造常駐 CA 服務；OS/service supervisor 與 credential resolver 仍有責任人 |
| 名稱 | root endpoint、ERP internal endpoint、ERP public origin 分開配置；不得由 web.base.url 或 host published port 推導前兩者（N-12） |

## 六類端到端

此表是 [P5 §6](../../20-proposals/P5-pluggable-transport.md#L251) 的走查，不是六項已通過測試。共同上行：(a) U -> B0；(b)(c) U -> B -> B0；命令沿各 child 已建立的連線反向返回。

| D-ID | 從起點到使用者可見結果 | (a)/(b)/(c) 與斷線落點 |
|---|---|---|
| D-01 | ERP Apply/Publish -> desired version -> parent 鏡像/watch -> 文件及媒體 -> display reconcile -> 實際換頁 -> actual.applied_version -> ERP sync；MES 頁另讀即時 JSON | (a) B0 供文件，(b) B 快取，(c) B 拉雲端再供 U；離線只播已完整快取版本，新版未齊不能算完成。媒體與 MES 缺口見 02/03 |
| D-02 | SFA40/backend 取樣與 status -> U 做 30 s mean、meas 緩衝 -> B0 writer -> PG -> Grafana 畫線；Fleet 收存活，門檻越線只送業務事件到 ERP | (a) 直寫 north，(b) B 轉送，(c) 斷 WAN 按既有 72 h 緩衝及 drop 規則，恢復後按原取樣時間補寫；不能讓 ERP 收每筆量測。壞時間見 04 |
| D-03 | 操作員在 B 登錄 -> 建 T1 代表、先宣告 schema -> RTU/TCP 輪詢 -> 有號差壓與 min/mean/max -> meas -> B0 writer -> 歷史表/Grafana | (a) poller 在 B0，(b)(c) 在儀表所屬 B；斷線仍本地取樣，復線沿共同上行補寫。地址不等於 instrument profile，見 05 |
| D-04 | ERP 讀 capability、驗證 effect -> config/playlist job 入 SQ 或 show desired -> U 本地執行 -> CQ by key/actual -> ERP 呈現結果 | (a) 直達 U，(b) 經 B，(c) 經雲端 trunk；parent 斷線維持 standalone，結果留 CQ 待補送。多 unit show 的整體狀態見 06 |
| D-05 | T3 hardware hello -> Fleet present -> Manage -> issuer/binding -> 營運身分 -> 管理設定 -> applied/heartbeat -> ERP；revoke 正向簽訊號，未收到仍是 unknown | (a) issuer 同站，(b) 設定經 B，(c) WAN 斷時新 Manage/設定待辦，既有本地行為不因雲端消失而改鎖。出勤 event_id 沿 CQ-like 路徑上傳；P5 §8.6 已承認事件變體缺口，不另計。管理設定見 07，控制 fabric 不在本次範圍 |
| D-06 | PLC -> edge -> raw -> B 驗證/正式資料投影 -> 本地 HMI；另以 <=1 Hz 上行 -> B0 writer -> PG/Grafana，業務事件 -> ERP/MES | (a) broker/HMI 在現場，(b) 在機台 VLAN 附近，(c) 必須留在站內；WAN 斷仍更新 HMI，PG 暫停後補寫；recipes/控制留 edge。正式資料到可用畫面的缺口見 08 |

## Findings

### scenarios-01 | 重大 | 簽章不會完成客戶 proxy 入網

情境：(c)，D-01/D-02。斷點：若僅允許認證式 explicit proxy，安裝員只填 parent URL 與憑證，首次 dial 前便無法 CONNECT；簽章與 30 s 退路不提供入網設定。依據：P5 §3.4/§8.4、F-41/N-12；[transport-through-networks.md T13](../../10-facts/transport-through-networks.md#L51) 仍將正向 proxy 行為列未查證。可修：交付 proxy 位址、trust、服務帳號取得及 FQDN 放行流程，能指定短輪詢並診斷失敗；估 2～4 人日/profile，IT 等待另計。不是重報 mTLS 缺陷。

### scenarios-02 | 重大 | 文件到站不代表螢幕能離線換頁

情境：(a)(b)(c)，D-01。斷點：Apply 的文件已經過雜湊驗證，但圖片/影片尚未快取便斷線；player 解參照媒體 URL 時無位元組可播，若回 ERP 抓取又重現 C-24。依據：[P5 D-01](../../20-proposals/P5-pluggable-transport.md#L253)、F-55～F-61、N-11/N-12，未定完整 asset 集的快取就緒條件。可修：parent-relative resource id、媒體 manifest、逐跳預取、完整就緒才切版；失敗保留舊版並回報缺件。估 1～2 人週；這是可達性與播放條件，不重複 security-06 的簽章/SSRF。

### scenarios-03 | 重大 | MES 的 consumer API 沒有業務資料生產者

情境：(b)(c)，D-01。斷點：工單改變而沒有 Apply，board 每 5 s 問 B；watch 只能讀已存在的 slot，誰把 ERP 工單、work centre、idle 狀態變成該 JSON 並未定義。依據：[P5 §5](../../20-proposals/P5-pluggable-transport.md#L243)、F-63，僅列 consumer 與代理。可修：明定 ERP business projection、沿樹同步與本地頁面、資料年齡/離線顯示，不能靠 B 反向探 ERP；估 1～2 人週。現成平台的 Odoo 整合仍屬未查證（[buy-options.md G2](../../10-facts/buy-options.md#L92)），不能假設買來便補齊。

### scenarios-04 | 重大 | 時間恢復後無法挽救先前的錯誤取樣時間

情境：(a)(b)(c)，D-02，亦及 D-03/D-06。斷點：重開機時 NTP 回零，sensor 正常，meas 在校時前已蓋錯時間；即使後來憑證驗證恢復，PG/Grafana 的時間軸也無法還原真實讀值時刻。依據：[P5 §5](../../20-proposals/P5-pluggable-transport.md#L239)、F-02/F-04、N-14，只排除 warm-up。可修：取樣鏈攜 time-quality，未同步資料隔離/標缺口，不改用到站時間冒充；校時跳變後重新開取樣區間。估 2～4 人日，代價是無可信時間區間不可當有效歷史；有別於 security-09 的 PKI 時鐘。

### scenarios-05 | 重大 | 登錄 Modbus 位址還不能產生正確歷史列

情境：(a)(b)(c)，D-03。斷點：操作員只填協定、位址、VLAN，下一步 poller 仍不知道 register、signedness、scale、單位與 serial 對應，無法先宣告 schema 再寫 signed differentialPressure。依據：[P5 D-03](../../20-proposals/P5-pluggable-transport.md#L257)、F-22/F-31/F-32，通用 backend 名稱不是佈建流程。可修：可版本化 instrument profile，含 RTU bus/address、TCP 重定位與換表核對；以負差壓範例驗映射再啟用 writer。估通用流程 1 人週、首個 profile 2～3 人日；需廠商 register map，不能以每感測器 fork 代替。

### scenarios-06 | 重大 | 多條 LED show 缺少執行域與整體結果

情境：(b)(c)，D-04，兩個 U 各接一條 strip。斷點：Publish 後 U-A 套 v2、離線 U-B 留 v1；各自 single-flight/CQ 正確，ERP 卻沒有定義整場 show 是部分套用、拒絕還是完成。依據：[P5 D-04](../../20-proposals/P5-pluggable-transport.md#L259)、F-44/F-45/F-49。可修：首版限定一個本地 controller 擁有整場 timeline，或明示多 U 非原子並彙總各 actual；不偷加網路同步時限。估 2～4 人日；跨 U 原子 show 是另案，不用傳輸抽象掩蓋。

### scenarios-07 | 重大 | T3 管理設定缺少可操作的套用流程

情境：(a)(b)(c)，D-05。斷點：Manage 完成後操作員改 site/啟用功能，§3.1 的 cfg 是 child-owned，§6 只說 config 有簽章，未指定管理者寫哪個設定物件及如何看到 applied revision；簽章正確仍不知設定有否生效。依據：[P5 §3.1](../../20-proposals/P5-pluggable-transport.md#L83)、F-26/F-33/F-39。可修：獨立管理設定 schema/owner、UI 寫入與裝置回報流程，明列允許欄位並排除卡片權限、門鎖等控制設定；估 1 人週。不要求此案新建鎖控制面，也不重報事件 append。

### scenarios-08 | 重大 | 正式 topic 不等於可離線開機的 HMI

情境：(a)(b)(c)，D-06；先假定 raw/n 已分離且資料會重發。斷點：斷 north/WAN 後重啟 HMI，沒有指定本地 runtime、頁面/認證依賴及 latest-value/quality 映射；meas 批次與 link advisory 本身不會畫出有 freshness 的機台畫面，broker 活著也不代表 PLC 正在更新。依據：[P5 D-06](../../20-proposals/P5-pluggable-transport.md#L263)、F-04、N-11。可修：本地 HMI adapter/部署包、過期顯示及離線認證政策；區分 HMI 更新率與 <=1 Hz 北向限額，議定並量測端到畫面延遲。估 1～2 人週，PLC mapping 未取得前不能驗收。

### scenarios-09 | 重大 | 兩服務口號沒有啟停與健康責任

情境：(a)，D-01 最小部署；(c) 的站點端同樣要冷啟動。斷點：既有 ERP proxy 若占所有介面的 443，B0 再綁 443 就啟動失敗；只重寫 packaging 也未指定誰保證 deliberate stop 經重開機仍保持停止、player 壞掉不報健康。依據：P5 §3.4/§8/§9、N-07/N-13、B-13。可修：按上表列服務依賴與位址，單一 stop owner、重開機政策、涵蓋播放器的 readiness；估 3～5 人日並量 RAM/磁碟。不重算 longevity-01 的種類時鐘，而是要求真的能安裝、停機及復原。

## 驗收差異

N-18 要的是三形狀實際部署鏈，memory binding 的 conformance 只能驗抽象契約。[precedents.md e17](../../10-facts/precedents.md#L44) 的 list/watch 先例支持狀態同步，不能代證本案的播放器、proxy 或 HMI。以下都是待執行驗收，不是本次檢查結果。

| 層次 | 必須留下的證據 |
|---|---|
| 契約 | 兩種 production binding 與 memory 的 slot/version、重讀、錯誤詞彙結果；不能用綠燈抵銷下列缺項 |
| (a) N-07/N-13 | 在已有 ERP 的主機配置安裝最小組合；完整 Apply 至換頁/actual；無 history/broker 仍可運作；crash、reboot、deliberate stop、播放器故障各自的結果 |
| (b) N-12/N-18 | 套真 VLAN/ACL 工件，以 N-16 backend stub 走六個 D-ID；DNS/位址變更、Modbus 負值、LED 部分離線、HMI 冷啟動；檢查沒有設備直達 ERP |
| (c) N-14/N-18 | TLS-inspected/認證 proxy 配置下重走六個 D-ID，驗短輪詢退路與 root 名稱獨立；切 WAN、壞時間、復線補報，HMI 留在現場。每種支援形狀及有觸發的 MQTT 組合須於出貨前完成，不能只數 binding 測試 |

## 此點成立

- P5 此點成立：把契約與第二個 production binding 分帳，broker 等 T-a/b/c 觸發；一片螢幕不必先裝 MQTT 或歷史庫。
- P5 此點成立：owner 留存事實、完成看 actual/CQ 而非 ack；[precedents.md e15](../../10-facts/precedents.md#L42) 的 Apple MDM 結果快取提供相近先例，不代證本案實作。
- P5 此點成立：站內 HMI 與跨網路 trunk 分開，控制留本地；需要補的是可運作的本地資料/畫面流程，不是把所有 hop 換成 MQTT。

## 作者最怕的問題

即使既有修法全收，你能否用同一套交付工件，讓無 history 的一片螢幕在既有 ERP 主機開機換頁，並讓 TLS-inspected 雲端站點斷 WAN 後的 HMI 冷啟動仍顯示可信新值，指出每一步的 process、位址、時間來源與驗收證據？