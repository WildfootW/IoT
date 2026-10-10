## 結論先講

**致命 0 條、重大 7 條、次要 1 條。** P2 的樹與命令模型可保留，但部署入口、資料有效性與 HMI 來源尚不足以交付驗收；不是換成 broker 就能補齊。以下是附反證條件的設計缺口，不是已實測的事故。

範圍為 [../../20-proposals/P2-https-pull-defended.md](../../20-proposals/P2-https-pull-defended.md)。已讀指定底稿、進度、全文及既有批評；interim 的修補不算 P2 現有能力。第三方引用已核對本地實際行號，保留來源記載的 2026-10-10 與證據等級，未作本輪網路重查。人週均為粗估，非量測。模型要求 strongest/high；host 僅提供 inherited，無 effort 控制，未宣稱 runtime enforcement。

## 三種形狀與防火牆

下表是交付所需清單，不宣稱工件已存在。所有放行均限來源、目的與指定服務，允許 established 回程，其餘 default deny；不把同一 hypervisor 誤當同一信任區。

| 形狀 | 必要元件與位置 | 必要連線及禁止項目 |
|---|---|---|
| (a) 同主機 | 北側 Odoo、ERP PostgreSQL、bridge 0/node、其 SQLite 與 issuer；螢幕上 unit agent、SQLite、display backend、Anthias。資料型情境另啟 writer、history、Grafana；單一 device VLAN 可由 bridge 0 兼 south，多 VLAN 仍需各自 south 邊界 | unit → bridge 0 TCP 443；bridge 0 → Odoo 本機 socket/loopback；writer → PG 本機 socket 或受限 5432；ops → ERP/Grafana 的核准 UI 入口。ERP ingress 已用同 IP:443 時須另配 node IP/入口，不開 device → ERP/DB/admin |
| (b) 同站跨 VLAN | ERP VLAN 放 Odoo、PG、bridge 0/issuer；每 device VLAN 放 bridge/node、SQLite、文件快取及需要的 backend；unit 留裝置區；T1 有獨立網路隔離 | unit → 本地 bridge:443；僅 bridge → bridge 0:443 穿 ERP VLAN；bridge 0 → ERP/PG 走北側受限路徑。禁止 unit/T1 直連 ERP、PG、admin；Grafana 以唯讀 role 連 PG，ops UI 另列來源 |
| (c) 雲端 ERP | 雲端每租戶 Odoo、PG、bridge 0/issuer、writer，bridge 0 直接終結 TLS 或前置 TCP passthrough；站內每 device VLAN 的 bridge、快取與 units；客戶 forward proxy 視現場需要 | unit → 本地 bridge:443；bridge → cloud FQDN:443，或 → 明列的 proxy 埠再 CONNECT 該 FQDN:443；無 WAN → site inbound。ERP/PG 留雲端受限網路；現場 HMI 不跨 WAN，不能為它開 inbound |

| 共用依賴 | 部署與防火牆要求 |
|---|---|
| DNS、DHCP、NTP | 各節點 → 指定 resolver UDP/TCP 53、有效 time source UDP 123；使用 DHCP 才開本地 67/68；mDNS 5353 僅本鏈路，不轉送跨 VLAN。T2/bridge 也要規則，不能只列 T1。埠為本審查建議契約，客戶實際配置待驗 |
| T1 / Modbus | TCP 型僅 bridge → 白名單儀表:502；RTU 是本機 serial 裝置權限，不開 IP 埠。MQTT T1 才開 T1 → ingress:8883；1883 只按 P2 的逐台 plaintext 例外核准 |
| L2 邊界 | 必須證明 T1 ↔ T1、T1 ↔ 租戶的有線與無線隔離，bridge 不做 IP forwarding。既有 C-25 無 isolation，需客戶核准 AP/switch 變更或交付專用隔離網路；無法隔離就不得接入 T1，不得只套 inter-VLAN ACL 宣稱成功 |
| 本地 HMI | 直連 edge controller 的唯讀介面埠須由機台方提供，現況未查證；第二路 HMI → bridge consumer:443；第三路 bridge publisher 與 HMI → HMI VLAN 的 Mosquitto:8883，topic 權限分離，無 T1 直入、無控制命令 |

## 一片螢幕的帳單

N-13 要小且免 history，不曾規定「最多兩服務」。P2 的兩個邏輯角色不等於全站 process/container 數；下列是執行與營運依賴，不重算 longevity 的時鐘 finding。

| 依賴 | 一屏部署是否能省 | 隱藏的交付工作 |
|---|---|---|
| Odoo、ERP DB | 不能省；既有 PG 可共用；可省 history、writer、Grafana | 連線、認證、啟動順序；無 history 不等於無 DB |
| bridge 0、unit node、各自 SQLite | 都要；同份程式不代表同個實例 | 狀態目錄、身分、parent 位址、重啟與停止契約 |
| display backend、Anthias | 前者獨立 process；後者是 P2 的 player 選擇 | 必須列實際 image/服務及健康探測；Anthias 內部 container 數、RAM、nginx 依賴未查證，不虛報總服務數 |
| DNS、NTP | 可借客戶服務，不可省可達且有效的服務 | 誰提供、冷開機次序、失效診斷；不能假定現場 NTP 正常 |
| CA、credential resolver | issuer 可內嵌 bridge 0，不強迫另裝線上 CA server | factory provisioning、信任錨、取鑰與續期仍需交付；不重開 security 的 PKI finding |
| reverse proxy、nginx | node 直接終結 TLS 時未必新增；ERP 若既有則要計入 | 固定 IP/port、TLS 終結位置、串流設定；客戶 forward proxy 另算，不混為一種角色 |
| OS、supervision | 主機與 CM4 都要 | compose/systemd 的權責、restart/stop、資源上限及共機不衝突；未有實測 footprint |

nginx 的 timeout 依據是 [T7 原文紀錄](../../10-facts/transport-through-networks.md#L45)；buffering 只有 [T13 二手紀錄](../../10-facts/transport-through-networks.md#L51)，不能據此保證每家 forward proxy 都通。買現成管理平台也不能假定已有 Odoo connector：[G2](../../10-facts/buy-options.md#L92) 明標未查證。

## D-01 至 D-06 全程矩陣

每格繼承上方同形狀的精確入口；資料上行與命令回程均沿 child 已發起的連線。箭頭表示邏輯流向，不是允許 north 主動連 south。以下為設計 walkthrough，尚非 N-18 實測通過。

| D-ID | 形狀 | 元件、起點至可觀察終點 | 專用通道及判定 |
|---|---|---|---|
| D-01 | (a) | ERP Apply 寫 desired → bridge 0 鏡像 → unit 拉版本文件 → display reconcile → Anthias 換頁 → actual.applied_playlist_version 經 bridge 0 回 ERP 比版 | unit 僅連 bridge 0:443；靜態流程成立；入口見 01、live board 見 03 |
| D-01 | (b) | ERP Apply → bridge 0 → VLAN bridge 快取 → unit/display/Anthias → actual 經 bridge、bridge 0 回 ERP；不把送達當換頁 | 兩段 443；文件與 MES JSON 不直連 ERP；03 檢查快取及頁面存活 |
| D-01 | (c) | 雲端 ERP Apply → cloud bridge 0 → 站點 bridge → unit 拉文件並換頁 → actual 沿 outbound 通道回雲端 ERP；斷網留已套用內容 | 無站點 inbound；02 檢查 proxy 前置條件，03 檢查 live JSON 失聯 |
| D-02 | (a) | 感測 backend 1 Hz → unit 30 s mean/來源時間/status → bridge 0 writer → history → Grafana 唯讀畫線；門檻事件另進 ERP | localhost backend、unit:443、writer/reader 的 PG role；04 檢查有效資料 gate |
| D-02 | (b) | backend → unit 批次 → VLAN bridge 緩衝 → bridge 0 writer → PG → Grafana；門檻在資料節點計算 → ERP 業務事件 | 僅 bridge 穿 VLAN:443，PG 不向 unit 開；04、08 |
| D-02 | (c) | backend → unit → 站點 bridge 緩衝 → cloud bridge 0 → history/Grafana；斷線資料保留來源時間再補傳，ERP 不收逐樣本 rows | outbound:443；接受 48 h/256 MB 溢出計數的明示取捨，不承諾無限離線；04 |
| D-03 | (a) | 操作員在 bridge 0 登錄代表/map → Modbus backend 輪詢 → 有符號差壓及區間 min/mean/max → writer/history → Grafana | 僅 bridge 0 → 儀表:502，或本機 RTU；換表辨識見 05 |
| D-03 | (b) | 在 device bridge 登錄 T1 → backend 輪詢、彙整與時間戳 → bridge 0 writer → history/Grafana；代表 announce → Fleet | 502 留南側，443 向北；不進 PLC 控制迴路；05 |
| D-03 | (c) | 站內登錄、輪詢與彙整 → bridge 緩衝 → cloud bridge 0/history → Grafana；更換儀表須先處理代表身分 | 不開 Modbus 穿 WAN；RTU 無網路規則；05 |
| D-04 | (a) | capability announce → ERP 驗 effect → show/config desired 或 effect/playlist SQ → bridge 0 → unit/LED 本地執行 → actual 比版或對 key 的 CQ 回 ERP | unit:443、LED backend localhost；show 是 register，不能等不存在的 job CQ |
| D-04 | (b) | ERP 驗能力、入 desired/SQ → bridge 0 → VLAN bridge → unit/LED → actual/CQ 經原路回 ERP；斷親維持 standalone | 兩段 443；接受 F-44 無跨燈條同步時序保證，08 驗停止/重啟 |
| D-04 | (c) | 雲端 ERP → cloud bridge 0 → 站內 bridge → LED 本地 timeline → actual/CQ 回雲端；ERP 未收終態時不把 ack 當完成 | 無 inbound；proxy 退路不提供 RTT 保證，02；控制時序不搬雲端 |
| D-05 | (a) | reader 硬體身分 announce → bridge 0 → Fleet/Manage → issuer 下發 cert/簽名 config → reader 套用回 actual；心跳與 attestation；event log/cursor → ERP 出勤 | reader 僅連 parent:443，不碰 admin；06；門鎖、憑證清單、排程不進此通道 |
| D-05 | (b) | reader → VLAN bridge → bridge 0/Fleet；Manage、cert/config 沿樹下行；actual/存活、event log 逐層上送業務端 | 兩段 443；attestation 不能以中間 bridge 的在線狀態代替；06 |
| D-05 | (c) | 站點 reader/bridge outbound → cloud bridge 0/Fleet → Manage/config 回既有連線 → reader 回報；事件由本地 log 供續接 | 無遠端開門入口；控制面另建是合法範圍界線；06，不重複既有撤銷窗口批評 |
| D-06 | (a) | PLC → edge controller → ≤1 Hz 遙測 → bridge 0 writer/history/Grafana；門檻/狀態 → ERP/MES；HMI 由 edge 本地供資料 | 機台核准唯讀埠或本地 consumer:443/獨立 broker:8883；07 檢查採樣到畫面 |
| D-06 | (b) | PLC/edge → device bridge → bridge 0 → history/Grafana、ERP/MES；HMI 在南側直讀 edge，或讀 bridge SSE/其 MQTT 投影 | 低延遲路不跨 ERP VLAN；MQTT broker 在 HMI 區，不在 T1 區；07 |
| D-06 | (c) | PLC/edge → 站點 bridge → cloud writer/history/Grafana 與 ERP/MES；WAN 斷時本地 HMI 仍由本地來源更新 | 僅遙測上雲:443；HMI 不靠 cloud consumer，也不為瀏覽器開 WAN inbound；07 |

## Findings

### scenarios-01 | 重大 | parent 位址未與 ERP 入口分離

**情境與斷點：** (a)(b)(c)、D-01。既有 ERP ingress 已占同 IP:443 時，照圖再綁 node:443 會衝突；跨 VLAN/cloud 也不能靠本地 mDNS 得到遠端 parent。第一個 announce 尚未發出就停住。

**依據：** P2 §3.1、[開機步驟](../../20-proposals/P2-https-pull-defended.md#L176) 只給 DNS/mDNS 與 443；未定可部署的獨立 parent URL，N-12、N-07、F-23 仍缺契約。

**可修性與成本：** 可修，明列 listener、node-visible parent URL、ERP internal/public URL 與 CA name；選專用 IP 或受控 TCP 路由，約 0.5 至 1 人週。**反證檢查：** ERP 已占入口且三種名稱不同時仍可 adopt/Apply。

### scenarios-02 | 重大 | 簽章退路之前還有 proxy 登入

**情境與斷點：** (c)、D-01/D-04。設定只允許站點經需認證的 explicit proxy 出網：直撥 cloud:443 先被 firewall 擋，改普通 TLS 也不會完成 proxy 認證，還未進到 frame 驗簽。

**依據：** P2 §3.5 處理 TLS 失敗，未交代 proxy 位址、CONNECT、非互動憑證與路由例外；[T10](../../10-facts/transport-through-networks.md#L48) 確有 CONNECT 通道，客戶產品支援矩陣未查證。這不是重複 security-01 的降級攻擊。

**可修性與成本：** 可修，部署 profile 加 proxy/secret resolver 與連線診斷，約 1 至 2 人週及 IT 核准。**反證檢查：** 禁直連的測試 proxy 下完成冷啟動、Apply、結果回讀。

### scenarios-03 | 重大 | live board 不能只監控快取代理

**情境與斷點：** (b)(c)、D-01。bridge 代抓固定 JSON 時，螢幕已停止 polling 而 bridge 仍回源，ERP 看到的是代理存活；WAN 斷而快取仍回成功時，頁面也不能把取回時間當資料新鮮度。

**依據：** [P2 D-01](../../20-proposals/P2-https-pull-defended.md#L284) 只有「文件快取代理」，未定每屏 last-poll 回報及 live JSON TTL；F-63、F-04、N-11。不是 security-07 的內容簽章問題。

**可修性與成本：** 可修，分開 immutable 文件與動態 JSON，傳來源時間、每屏 polling 狀態及 stale，約 1 人週。**反證檢查：** 不 Apply 仍更新；停頁但不停 bridge、斷 WAN 兩案均正確顯示失聯。

### scenarios-04 | 重大 | status 不是量測有效性的 gate

**情境與斷點：** (a)(b)(c)、D-02。測試 backend 送新時間戳、數值零及 warm-up/fault；若照數值路徑平均、寫 PG、畫線，另送 status 仍會留下健康外觀。快一天的時鐘也不會被「過舊」判斷擋住。

**依據：** [P2 D-02](../../20-proposals/P2-https-pull-defended.md#L286)、§5 未定品質與時間 gate；F-04、F-02、N-14。既有 security-10/longevity-03 談開機驗證，這裡談連線後的錯誤資料。

**可修性與成本：** 可修，ready/quality、有效時基及未來偏差門檻在彙整前判斷；不可把補傳時間改成 now，約 1 人週。**反證檢查：** 注入 warm-up、零時間、時鐘跳進/跳退，PG 不出假新值，Grafana 有缺口，ERP 無假門檻事件。

### scenarios-05 | 重大 | 換表後保留位址不等於保留身分

**情境與斷點：** (a)(b)(c)、D-03。換入另一台儀表但沿用 TCP reservation 或 RTU address，poll 仍成功；若 representative 不變，新表資料便續寫舊表的三年 series。

**依據：** [P2 D-03](../../20-proposals/P2-https-pull-defended.md#L288) 指定 address/map/type，未定換表辨識與歷史歸屬；F-22 禁止僅以 IP 辨識，F-19、F-14 要穩定身分。各儀表可讀 serial 能力未查證。

**可修性與成本：** 可修，有可讀 identity 就比對；無則要求標籤與人工換表確認、建立新 unit/generation，約 0.5 至 1 人週加現場程序。**反證檢查：** 同位址換表不得靜默併史；單純改名不得斷史。

### scenarios-06 | 次要 | T3 管理面仍欠驗收界線

**情境與斷點：** (a)(b)(c)、D-05。reader 能簽 announce 且心跳正常，但未提供可驗的新鮮 attestation；一鍵 Manage 不應因此呈現為 T3 已驗證。

**依據：** [P2 D-05](../../20-proposals/P2-https-pull-defended.md#L292) 明說欄位預留，卻又說無須新管理面；需求 T3 管理表把 attestation 放在存活內。延期是明示取捨，缺的是上線資格界線，不是要求本輪造門鎖控制。

**可修性與成本：** 可修，標 unsupported/unknown，D-05 上線前補 verifier、失效政策與 config 套用回報，軟體估 1 至 3 人週，硬體整合未查證。**反證檢查：** 心跳成功但證據缺失/過期時不得報 verified。

### scenarios-07 | 重大 | LAN 毫秒傳輸救不了一秒採樣

**情境與斷點：** (a)(b)(c)、D-06。若機台未提供獨立快速 HMI 來源，第二/三選項只轉發 ≤1 Hz 遙測；剛錯過採樣的變化仍等近一秒，SSE 或 MQTT 加速不了已經漏過的採樣。

**依據：** [P2 HMI 三選項](../../20-proposals/P2-https-pull-defended.md#L298) 把 LAN 毫秒級延遲當答案，未定來源頻率與採樣到畫面的預算；D-06、F-01、N-21。機台方介面可用性未查證；不反對 HMI 留本地的明示取捨。

**可修性與成本：** 可修，先驗機台來源；否則提供獨立本地高速 tap，只有北向降到 ≤1 Hz，估 1 至 3 人週加 partner 配合。**反證檢查：** WAN 斷線下量來源到畫面延遲；門檻由使用者先定，不自行發明 andon SLA。

### scenarios-08 | 重大 | 合併程式沒有定義停止與健康

**情境與斷點：** (a)(b)(c)、D-01/D-02/D-04。backend 死而 node 心跳活，port health 仍綠；若監督者只憑未執行就拉起服務，操作員 deliberate stop 又會被撤回。

**依據：** P2 §2 保留獨立 backend，[§9](../../20-proposals/P2-https-pull-defended.md#L361) 已編 N-07 預算但未定 supervision、停止狀態 owner 與 readiness；C-14/B-13 不會因替換元件自動消失。不聲稱新 compose 已重現舊 bug。

**可修性與成本：** 可修，明訂每服務 restart/stop、project 身分與健康層級；node 活、backend 可用、資料有效分開，約 1 人週納入既有部署預算。**反證檢查：** crash 復原、人工 stop 後 reboot 仍停、慢 DB/失效 DNS 可診斷，且不停止同機 ERP。

## 驗收與不重複計數

| 必查需求 | N-18 放行條件，均尚未實測 |
|---|---|
| N-07 | 08 的 crash、stop、reboot、backend 故障、共機 ERP 不受影響；明列所有實例，不以 port 開啟當全功能健康 |
| N-12 | 01 的三個不同名稱、occupied 443、DNS 改址；(b) 不轉送 mDNS，(c) 不加 inbound |
| N-13 | 一屏 profile 不建 history/Grafana/MQTT；列實例、borrowed 服務與 CM4/北側 RAM、disk 實測值；不虛報「兩服務」全站 footprint |
| N-14 | 開機校時與既有 PKI finding 合驗；04 額外檢查量測時基跳變、補傳及可見缺口，不靠「裝好 NTP」四字放行 |
| N-18 | 三形狀各跑上述六條端到端流程；C-25 另做 T1 正向到 bridge、負向到同 VLAN peers/ERP 的測試；02 的認證 proxy、03 的頁面失聯、07 的 WAN 斷線都要留下結果 |

N-18 是 P2 已編列但尚未通過的 gate，本審查不把「仍在提案階段」另算 finding。L2 改造是 §3.2 已選的前提，需核准與成本，不宣判「P2 沒設計隔離」；[T28](../../10-facts/transport-through-networks.md#L87) 只是摘要，不能證明現場 AP 能用。24 h 憑證、文件授權、OTA、備份與歷史搬遷沿用既有批評，均不重複加總。

## 此點成立

- 此點成立：child 主動連 parent，靜態文件沿樹拉，可消掉 C-12 與 C-24 的必要直連，不需要站點 inbound。
- 此點成立：register 比版、job 對 key 回 CQ；D-04 不需傳輸承諾跨裝置同步，D-05 的鎖控制另建並非缺陷。
- 此點成立：串流有退路、cursor 有 window，不以超窗後可見丟棄冒充無限保證；[e17](../../10-facts/precedents.md#L44) 支持 list/watch 模式，不是 P2 實測證明。
- 此點成立：一屏省 history 與 broker，感測才加 store；HMI 留本地值得保留，07 要補的是資料來源而非改回雲端。

## 作者最難回答的問題

在既有 ERP 已占入口、現場 NTP 無效且只准認證 proxy 出網的站點，你能否拿出不直連 ERP 的一屏交付清單，並證明停頁、重啟與斷網時 Fleet、畫面和資料新鮮度各自如實呈現？