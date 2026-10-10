# P6 批評：安全 lens

批評者：波次 B，lens = 安全。日期 2026-10-10。目標：`20-proposals/P6-minimalism.md`（P6）。輸入：`00`～`03`、P6 全文、`10-facts/transport-through-networks.md`、`mqtt-brokers.md`、`mqtt-semantics.md`、`nats.md`、`precedents.md`。

引用慣例：需求以 ID 引用；第三方事實寫「（檔名 列號）」指 `10-facts/` 內該檔 `cat -n` 的列號，查證日期一律 2026-10-10；沒有來源的第三方主張標「未查證」。標「意見」者是我的判斷。

## 0. 結論先講

**致命 1 條、重大 9 條、次要 2 條。** 一句總評：P6 把 PKI 延後是可以辯護的，但它用來替代 PKI 的三樣東西（bearer token、SPKI pin、hub 純轉送）在 Stage 1 一起失效——**hub 既不能驗證子節點、agent 也沒有任何會過期的東西**，所以 Odoo 離線時 hub 收任何人的資料、hub 被攻破或被撤銷後子樹永遠聽它的；而 P6 §1 理由 3「應用層身分在 (c) 活下來」選了唯一會被 TLS 檢查 proxy 偷走的身分形式。Stage 0 本身大致成立（P6 自己也把風險寫清楚了），壞的是 P6 說「便宜」的那一步：hub 進場。

| 編號 | 嚴重度 | 一句話 | 可修 |
|---|---|---|---|
| security-01 | 致命 | hub 沒有驗證子節點的能力：Odoo 離線時收任何人的 report，(c) 的雲端 hub 先寫 history 再問 Odoo | 可修，但推翻「Odoo 是唯一發行者、hub 只轉送」 |
| security-02 | 重大 | agent 沒有任何會過期的東西：被撤銷或被攻破的 hub 是永久 rogue parent | 可修，要把 Stage 3 的端到端簽章提前 |
| security-03 | 重大 | 單一 SPKI pin、無備援 pin：伺服器金鑰洩漏或輪替會把離線裝置鎖死 | 可修，便宜 |
| security-04 | 重大 | `config.parent`、`credential` 住在業務 desired register 裡：會寫 playlist 的人就能收割全 fleet 的 token | 可修，便宜 |
| security-05 | 重大 | credential 走 desired register 與「Odoo 不存 token 明文」矛盾；N-04 反向破 | 可修，但 credential 不能是 register |
| security-06 | 重大 | §1 理由 3 不成立：bearer token + pin 在 TLS 檢查 proxy 下與 mTLS 同死；拿掉 pin 則 token 被 proxy 重放 | 可修，就是 P6 想延後的那件事 |
| security-07 | 重大 | (b) Stage 1b 圖把 T1 與 CM4 agent 畫在同一個 VLAN：F-18 不成立；CM4 上 Anthias 自帶 web UI | 可修，網路設定 |
| security-08 | 重大 | hub 把 relay + Modbus poller + PostgreSQL writer 合在一個有 south 腳的機器上 | 可修，多一個 process |
| security-09 | 重大 | defacement 路徑未封：pointer 來源未限制（B-10 R2）、Odoo 誰能 Apply 未定義 | 可修，便宜 |
| security-10 | 重大 | bootstrap / revoke / 輪替流程的洞：revoke 回應與「固定回應」矛盾、輪替舊 token 經 hub 重播變自我撤銷、複製 token 無偵測 | 可修 |
| security-11 | 次要 | Stage 2 Mosquitto：HMI 訂閱者站哪個 VLAN 沒答案；1883 明文帳密在共享 PSK 上可被解密 | 可修 |
| security-12 | 次要 | 供應鏈：Anthias 的瀏覽器引擎更新節奏未查證、pymodbus 解析 hostile bytes、nginx 版本線未查證 | 部分可修 |

## 1. Findings

### security-01（致命）hub 沒有驗證子節點的能力

**情境。** (c) 形狀 Stage 1a：雲端 hub（writer）在 internet 上收站點 agent 的 report。(b) 形狀 Stage 1b：站點 hub 的 south 介面 8443 在 IoT VLAN，VLAN 裡有租戶鄰居（C-25）。Odoo 或雲端不可達時 hub 緩衝 7 天 / 1 GB（P6 §4.3）。

**壞在哪一步。** P6 §3.3 說「沒有憑證、沒有 CA；全部是 Odoo 發的 token」，token 驗證靠 `sha256(secret || pepper)`，pepper 只在 Odoo 的 credential resolver（§3.3 第 5 點）。P6 §4 說「Stage 1 的 hub 只做轉送與緩衝，不持有命令真相」。兩句合起來：**hub 沒有 pepper，所以 hub 驗不了任何 device token**。於是：

1. Odoo 在線時，hub 是透明轉送，Odoo 驗 token——成立。但 P6 §5 的 writer 順序是「hub 寫進 `history` ... 然後把去掉 `measurements[]` 的 report 轉給 Odoo」：**先寫、後驗**。(c) 形狀下這是一個 internet 可達、先寫資料庫再問身分的端點。鄰居或任何拿到 `parent_url` 的人用假 device id 寫 series，三年歷史被污染（F-04「沒有資料就是沒有」、F-10 門檻告警變成 Odoo 業務事件）。
2. Odoo 不在線時（這正是緩衝存在的理由，N-11），hub 無法驗任何人，只能把收到的全部收進 7 天 / 1 GB 的 SQLite。IoT VLAN 的鄰居灌 1 GB 垃圾，「最舊的刪除」把合法 report 擠掉（F-46 的「不丟」在 hub 這一跳被鄰居決定）。緩衝裡的每一筆都帶 bearer token 明文落盤（N-03「secrets never in plain config files, URLs or logs, anywhere」）。
3. hub 的 `GET /history/...` 給 MES「site token 範圍內」（§5）——若字面意思是 MES 拿 site token，hub 的身分憑證離開 hub process，N-05 的可歸因性消失。

**依據。** P6 §3.3、§4、§4.3、§5；N-03、N-05、N-11、F-46、M-04（「firewall exposes only the surface we control」——hub 就是那個 surface，而它不會驗人）。

**可修。** hub 必須能驗 token：給 hub 一份站點範圍的驗證材料（例如 per-site pepper = KDF(pepper, site)，token 雜湊按站點算；hub 持有雜湊清單與 site pepper，能驗、不能從雜湊反推 secret）。代價：(1) hub 變成持有秘密的信任元件，N-03 的 credential resolver 要在站點也有一份；(2) revoke secret 若同樣由 pepper 衍生，hub 可在站內偽造 revoke——可接受，但要寫明；(3) 「Odoo 是唯一發行者」要改成「Odoo 發、hub 驗」，而這就是 P0 §4「bridge 0 執行發行」的半步。估 1～2 人週，不含 e2e。這條若不修，(b) 與 (c) 的 Stage 1 在錨點 2 下不成立，所以列致命。

### security-02（重大）agent 沒有任何會過期的東西：被撤銷的 hub 是永久 rogue parent

**情境。** (b) 或 (c) Stage 1b。站點 hub 被攻破（它面向 T1 VLAN，又跑 pymodbus 與 Mosquitto 訂閱端，見 security-08）。操作員發現後在 Odoo 撤銷 hub 的 site token。

**壞在哪一步。** 撤銷只切斷 hub → Odoo 這一跳。agent 信 hub 的依據是 `config.parent = {url, spki_pin}`（P6 §3.3 第 6 點），這份信任**沒有有效期**：token 不過期、pin 不過期、desired 不帶 Odoo 的簽章（P6 §4.4 F-48「沒有端到端簽章，若 hub 被攻破可偽造 desired（Stage 3 補）」）。被撤銷的 hub 對 agent 仍是可達的 parent，可以無限期回 200 與偽造的 desired；N-11 要 agent 在 parent 不可達時沿用最後一份，但這裡 parent 是可達的，agent 連「unknown」都不會進入。Odoo 要糾正只能寫新的 `config.parent`——**唯一的傳遞路徑就是那台 rogue hub**。P0 的短效憑證在心跳時續期（P0 §4）至少讓子樹在幾個週期後察覺上游斷了；P6 刪掉續期卻沒有補任何等價物。

**依據。** P6 §3.3、§4.4（F-48 列）；F-17、F-48（each hop verifies its parent）、N-11；對照 P0 §4。

**可修。** 兩條路：(a) Odoo 持有一把簽章金鑰，desired 的每個欄位版本附 Odoo 簽章與 `issued_at`，agent 驗簽並拒絕超過 N 天的 desired——這是 P0「T3 加端到端簽章」提前到全部 T2，4～6 人週裡的一部分提前付；(b) 更便宜的「freshness token」：Odoo 每天透過 hub 下發一個短效、HMAC(device revoke_secret) 的「root 還活著」憑據，agent 收不到就退回 `previous_parent` 或進入 unknown。(b) 不防 hub 偽造 desired，只防 hub 被撤銷後繼續當 parent。P6 想要的「Stage 3 才付本金」在這裡至少要付 (b)。

### security-03（重大）單一 SPKI pin、無備援：金鑰洩漏或輪替會鎖死離線裝置

**情境。** 全部形狀。Stage 0 的 pin 是 nginx 的伺服器金鑰指紋，nginx 與 Odoo 同主機（(a)(b)）；(c) 用公開 CA 憑證（P6 §3.3「誰終結 TLS」）。

**壞在哪一步。** (1) 金鑰洩漏：ERP 主機是全站最大的攻擊面（Odoo web stack，P6 §8.1 自認）。nginx 私鑰被拿走後，C-25 的無 client isolation Wi-Fi 讓 ARP/DNS 欺騙成為可能（`transport-through-networks.md` 列 86～87：T27 共享 PSK 可解密同 SSID 流量、T28 isolation 不跨 VLAN），攻擊者以真金鑰 MITM 全部螢幕，pin 通過，偽造 desired 與文件——公開螢幕 defacement（F-48）。要換 pin 只能透過已被 MITM 的通道，攻擊者可以選擇性丟掉 pin 更新。(2) 正常輪替：(c) 用公開 CA 憑證，若 pin 打在 leaf SPKI 上，ACME 類憑證預設每次更新換金鑰（未查證各 ACME client 預設）；更新前要先把新 pin 經 desired 推到每片螢幕，任何在窗口內離線的螢幕（N-11 說它會繼續運作）永久連不上，只能實體重燒。P6 §8.7 討論了 re-point 寫錯的回退，沒有討論 pin 本身的生命週期。

**依據。** P6 §3.3；F-48、N-11、N-01；`transport-through-networks.md` 列 86～87、列 98～100（T5：終結 TLS 的一方就是信任邊界）。

**可修。** 便宜：provisioning 與 desired 同時帶兩個 pin（current + backup），backup 金鑰離線保存；輪替 = 啟用 backup、推新 backup。(c) 形狀的公開憑證固定金鑰（ACME 多數 client 可設 reuse key，未查證）或改 pin 中繼 CA 的 SPKI。半人週。

### security-04（重大）會寫 playlist 的人就能重指向全 fleet

**情境。** 任何形狀，Stage 1 的 re-point。P6 §3.3 第 6 點：agent 從 Odoo 直連改成經 hub，靠 Odoo 在 desired register 寫 `config.parent = {url, spki_pin}`；§4.1 credential 輪替同樣走 desired 的 `credential` 欄位。

**壞在哪一步。** desired 是一個 Odoo model，欄位有 `playlist`、`config`、`thresholds`、`credential`，P6 §4.2 把寫入者分成「Odoo（Manage）」與「Odoo（業務 UI）」，但這是同一個 Odoo、同一份 register，分離的強度只等於模組的 record rule 與 field-level `groups=`——P6 沒有定義。一個 CMS 內容編輯（或被釣魚的內容編輯帳號）若能寫 `config.parent`，就能把全部螢幕指向他在 LAN 上用筆電開的 hub，pin 是他自己寫的；**agent 在 re-point 後會把 operational token 送給新 parent**（它要向 parent 認證），這不只是 defacement，是全 fleet token 收割。N-05 要求「management centre writes binding and config; the ERP writes desired business state」是兩個寫入者，P6 把兩者合進一個 register 後沒有補回邊界。

**依據。** P6 §3.3 第 6 點、§4.1、§4.2；N-05、F-48（it is defined who may command which node——P6 §4.4 回答「由 Odoo 的權限模型定」，但沒有定）。

**可修。** 便宜：`config`、`credential`、`pin` 拆到獨立 model（或至少 field-level groups 只給 Fleet 管理員），寫入產生業務事件（N-05 審計），re-point 要求二次確認。1～2 天。這條不難，但它說明「pin 由 Odoo 發」其實是「pin 由任何能寫這張表的人發」。

### security-05（重大）credential 走 desired register 與「不存明文」矛盾；N-04 反向破

**情境。** 全部形狀，Stage 0 起。

**壞在哪一步。** P6 §3.3 第 5 點：「Odoo 不存 token 明文，存 `sha256(secret || pepper)`」。P6 §4.1：「新 token 透過 desired register 的 `credential` 欄位下發，舊 token 在裝置確認後 24 小時失效」。desired 是 F-46 意義下的 owner：耐久、可重讀、「nothing exists only in flight」。agent 隔幾次輪詢才來拿，Odoo 必須把**明文** token 放在 `credential` 欄位直到裝置確認——至少 24 小時，而 P6 §4.3 又讓「desired 版本歷史（audit）」保留 90 天。結果是：要嘛 N-03 破（明文 secret 在 database rows 與審計歷史裡），要嘛 F-46 破（credential 是只能送一次的 in-flight 訊息，不是 register）。更嚴重的是 N-04：P6 §3.3 第 5 點引以為傲的「staging 從 prod 還原的 database 沒有 pepper，驗不了任何真實裝置」只擋了 **staging 冒充 Odoo**；若 desired 歷史裡有 90 天內輪替過的明文 token，還原到 staging 的那份 database 就能讓任何有 staging 存取權的人**冒充裝置對 prod** 說話（prod 用 pepper 驗的是雜湊，明文 token 一樣過）。

**依據。** P6 §3.3 第 5 點、§4.1、§4.3；N-03、N-04（an environment copy carries no valid trust toward real nodes）、F-46。

**可修。** credential 不能是 register：改成與 adoption 相同的一次性 pickup（`GET /iot/v1/credential` 回明文一次，Odoo 立刻只留雜湊），desired 裡只放 `credential_version` 當觸發。代價是 P6 §4「register 與 SQ/CQ 語意原封不動」多一個例外，而且 pickup 失敗的「unknown」要自己處理。半人週。

### security-06（重大）§1 理由 3 不成立：bearer token 是會被 proxy 偷走的那種「應用層身分」

**情境。** (c) 形狀，客戶有 TLS 檢查 proxy。

**壞在哪一步。** P6 §1 理由 3 的邏輯是：client cert 到不了我們的伺服器（`transport-through-networks.md` 列 17～18、34～36，T1～T3 皆為摘要），所以身分要上移到應用層，所以 token 是 (c) 的底線，所以全部形狀第一版用 token。但事實檔建議的應用層身分是「請求本體帶 site 私鑰簽章的 nonce / 時間戳；或短效 token 綁 site 公鑰」（列 99，研究員意見），重點是**proxy 看得到也偷不走**。P6 選的是 bearer token + SPKI pin：(1) 有檢查無 bypass 時，pin 失敗，裝置離線——與 mTLS 的結局一樣（P6 §8.5 自己承認），理由 3 聲稱的優勢為零；(2) 若有人為了讓它活下來把 pin 拿掉、讓裝置信客戶 CA，proxy 就是 MITM，看到每一個 bearer token 明文，任何能碰 proxy 的人（客戶 IT、攻破 proxy 的人）可以從任何地方重放全站 token。mTLS 在同一情境下 fail closed；bearer token fail open to impersonation。P6 得到了 token 的弱點，沒得到應用層身分的優點。

**依據。** P6 §1 理由 3、§8.5；N-02；`transport-through-networks.md` 列 17～18、34～36、38（T5）、39（T6：Tailscale 也只做偵測）、99、155（HTTPS long-poll 在有檢查 proxy 下「client cert 失效，身分需上移到應用層」）。

**可修。** 裝置在 bootstrap 時自產一把金鑰對（Ed25519），adopt 時把公鑰交給 Odoo，每個請求帶簽章（nonce + 時間戳 + body hash）；pin 保留為加強。不需要 CA、不需要憑證鏈，但這就是「PKI-lite」，是 P6 想延到 Stage 3 的東西的一半。2～3 人週。若不修，P6 要把 §1 理由 3 改寫成「(c) 與 P0 一樣需要 bypass，token 只是比較少 code」，那是誠實但弱很多的主張。

### security-07（重大）(b) Stage 1b：T1 與 CM4 agent 同一個 VLAN；CM4 上還有 Anthias

**情境。** (b) 形狀 Stage 1b。P6 §3.1 的圖把「CM4 agent ×N」與「T1 meter」畫在同一個 `IoT VLAN` 框裡，接著寫「T1 VLAN 預設 deny；T1 只被 hub 輪詢」。

**壞在哪一步。** 若 T1 VLAN 就是 IoT VLAN，hostile T1 與 T2 agent 同 broadcast domain：F-18 的「a child is exposed only to its parent」對 T2 不成立，T1 對 CM4 有 lateral reach；M-04 的「at least one south instance per device VLAN」被一台 hub 同時服務兩類裝置稀釋掉。P6 §3.2 引用的 `transport-through-networks.md` 八條規則第 5 條（列 110）說同 broadcast domain 的 T1 ↔ 其他裝置只能靠交換器 port isolation / private VLAN，P6 只以「採八條規則」帶過，圖與文字對不上。CM4 這端被打到的是什麼？agent 以外，CM4 跑 Anthias。Anthias 自帶管理 web UI 與 API（是否預設綁所有介面、是否預設無認證：**未查證**，P6 也未提）；若是，那就是 B-10（gateway 等「bind all interfaces with no auth」）在 Anthias 身上原樣重現，而且直接改螢幕內容——最短的 defacement 路徑，不經 Odoo、不經 token。Stage 0 的 (b) 圖同樣：租戶鄰居與 CM4 同 VLAN，P6 §3.2 只說「鄰居只碰得到 nginx 的 /iot/」——鄰居碰得到的還有每一台 CM4 上開著的任何 port。

**依據。** P6 §3.1 (b) 圖、§3.2、§8.4（Anthias 留著）；F-18、M-04、B-10、F-48、C-25；`transport-through-networks.md` 列 105～114。

**可修。** 網路層：T1 與 T2 分兩個 VLAN，hub 三張（虛擬）網卡；或至少 port isolation / Wi-Fi client isolation 並寫進 N-01 工件。裝置層：display backend 負責把 Anthias 的 UI/API 綁 localhost 或關閉（要查 Anthias 的設定能力，未查證），SSH 只接金鑰。無 code 成本，但要把「CM4 自身的 listening port 清單」當 N-01 工件的一部分列出來。

### security-08（重大）hub 的角色合併把資料庫憑證放在有 south 腳的機器上

**情境。** (b) Stage 1b：P6 §3.1 的 hub 是「relay + writer + poller」一台，north 腳在 ERP VLAN、south 腳在 IoT/T1 VLAN。

**壞在哪一步。** writer 角色需要 ERP 既有 PostgreSQL 叢集的連線憑證（`history` 是同叢集的獨立 database，P6 §2.2）。poller 角色用 pymodbus 解析 hostile T1 回來的 Modbus 封包；Stage 2 再加 Mosquitto 訂閱端解析 T1 payload。P6 §3.2「一直成立的」說 function backend 獨立 process、node 是唯一持 token 的 process，但 §2.2 把 Modbus 列為 function backend、§9.1 又把「Modbus poller」列在 hub 的工作裡，兩處不一致；若 poller 在 hub process 內，解析 hostile bytes 的 process 就是同時持有 site token、全部轉送中的 device token（security-01）與 PostgreSQL 憑證的 process。P0 的分工是 bridge 0 當 writer、面向 T1 的 bridge 另一台（P0 §2、§5）；P6 為了 R6 的服務數把三個角色合一，省的是一個 process，付的是 M-04「firewall exposes only the surface we control」裡那個 surface 現在直通 ERP 的資料庫叢集。

**依據。** P6 §2.2、§3.1、§3.2、§9.1；M-04、N-03（every service with state is authenticated——要寫明 `history` role 只能寫 history）、F-07。

**可修。** 同一份 code、兩個 process：relay+poller 在 south 側、writer 在 north 側。不多一「種」（M-02），多一個 process（R6）。pg_hba 與 role grant 寫進 N-01 工件。1 人週。

### security-09（重大）defacement 路徑未封：pointer 來源、Odoo 權限

**情境。** 全部形狀，D-01。

**壞在哪一步。** P6 已承認「無端到端簽章，hub 被攻破可偽造 desired」，這裡不重複。未處理的兩點：(1) desired 的 `playlist.pointer` 是什麼？若 agent 對 pointer 做的是「拿 token 去 GET 這個 URL」，B-10 R2「reconcile fetches any URL」原樣重現：能寫 desired 的人（security-04）或攻破 hub 的人可以把 pointer 指向任意 URL，螢幕拉任意文件。P6 §6 D-01 說「Stage 1 起文件經 hub 代拉並快取」，hub 快取 = 第二個可被灌毒的點。(2) F-48 要「it is defined who may command which node」，P6 §4.4 回答「由 Odoo 的權限模型定」——沒有定。哪個 Odoo group 可以 Apply、Publish to all screens、改 content 的 link？Odoo 預設內部使用者對自訂 model 的存取由模組 `ir.model.access` 決定，不寫就是沒有。公開螢幕的 defacement 在 P6 裡最短路徑是「一個有 CMS 權限的 Odoo 帳號」，而 CMS 權限的粒度不在文件裡。

**依據。** P6 §4.1、§4.4、§6 D-01；F-48、F-56、B-10、N-05。

**可修。** 便宜：pointer 只允許相對於 `parent_url` 的路徑；Odoo 側定義 `iot` 的 group 階層（viewer / editor / publisher / fleet admin）。1～2 天。

### security-10（重大）bootstrap / revoke / 輪替流程的洞

**情境。** 全部形狀。

**壞在哪一步。** 四個具體點：

1. **revoke 回應與「固定回應」矛盾。** P6 §3.2 說「未帶有效 token 的請求只會碰到一個固定回應」，§3.3 第 4 點說 revoke 後「下一次請求收到 401 加 body `{status: revoked, device, ts, mac: HMAC(revoke_secret, ...)}`」。Odoo 已經刪了 token，要產生這個 HMAC 得先從一個無效 token 認出裝置——所以 Odoo 必須保留 revoked token 的 tombstone，而且要分三類回：revoked（簽 HMAC）、rotated-old（不簽）、garbage（固定回應）。P6 沒寫，而第 2 點說明寫錯會怎樣。
2. **輪替舊 token 經 hub 重播變成自我撤銷。** 輪替後舊 token 24 小時失效（§4.1），hub 緩衝 7 天（§4.3）。Odoo 離線三天後恢復，hub 重播緩衝的 report，裡面是輪替前的舊 token；若 Odoo 把「已失效 token」一律回 401 + 簽過的 revoked，hub 原樣轉給 agent，agent 驗 HMAC 通過 → rejected → 丟掉手上**新的、合法的** token，螢幕顯示「未受管理」。這是 N-11 與 F-46 的重送設計跟 revoke 設計打架。
3. **複製 token 無偵測。** P6 §3.3 意見段承認「token 被複製走就是被複製走（撤銷可補救，但要先發現）」，但沒有說怎麼發現。T2 沒有 secure element，SD 卡複製就是兩台同 id 的裝置。Odoo 收到同一 device id 來自兩個來源、`actual` 版本倒退、report 序號回跳，目前沒有任何規則會變成事件。
4. **bootstrap token 無到期、無序號核對。** 操作員建檔時給序號，裝置 announce 時自報序號；兩者不符時 Odoo 怎麼辦沒寫。bootstrap token 寫在 QR 與 provisioning station 的檔案裡（§3.3 第 1 點、§7 F-36「只需要能寫檔」），庫存期可能數週，沒有到期；拿到 token 的人先 announce，操作員按 Manage，真裝置之後再來就被「bootstrap token 立即失效」擋掉。影響止於該裝置的身分（可寫它的量測、拉它的文件），但 Fleet 看到的那台不是貼標籤的那台。

**依據。** P6 §3.2、§3.3、§4.1、§4.3；T2 管理表（00 §4.2：revocation with immediate effect、bootstrap credential invalid after adoption）、F-19、N-05、N-11、F-46、B-11。

**可修。** (1)(2)：tombstone 分類，rotated-old 回 `{"status":"stale"}` 不簽 HMAC → agent 當 unknown 處理；hub 重播時先剝掉 Authorization（但這又回到 security-01：hub 要能自己驗）。(3)：Odoo 每裝置維護單調 report 序號與最後來源，倒退或雙來源 → 業務事件 + 自動暫停該裝置的下行。(4)：bootstrap token 帶 `exp`、announce 的序號必須等於建檔序號、Manage 畫面顯示首次 announce 的時間與來源。合計 1 人週。

### security-11（次要）Stage 2 Mosquitto：HMI 站在哪、1883 明文

**情境。** (b) Stage 2，D-06 現場 HMI。

**壞在哪一步。** P6 §3.2 說 Mosquitto「只聽 T1 VLAN 的介面」，§5 說現場 HMI「訂 Mosquitto 的本地 topic」`site/...`（retained）。兩句合起來，HMI 工作站要嘛進 T1 VLAN（與 hostile T1 同 broadcast domain，T28），要嘛 Mosquitto 聽兩個 VLAN，成為一支 C 程式橋接 hostile 區與 OT 區——它近兩年有兩個帶 Security 標題的版本（`mqtt-brokers.md` 列 31），dynsec ACL 是唯一擋 T1 publish 到 `site/#` 的東西（列 28）；NATS 2026 年多則「MQTT retained / ACL bypass」advisory（`nats.md` 列 37）說明這是 broker 的常見 bug 類別。另外 1883 明文：共享 PSK Wi-Fi 上任何知道 PSK 的鄰居可解密該 T1 的帳密（T27，列 86），之後以它的身分 publish——但只到該 T1 自己的 topic，P6 的圍堵在這點成立。`check_retain_source` 預設 true（`mqtt-semantics.md` 列 36）：hub 的 ACL 一改，retained 對新 HMI 消失，是可用性陷阱，要進 runbook。

**依據。** P6 §3.2、§5、§8.10；`mqtt-brokers.md` 列 28、31；`mqtt-semantics.md` 列 36；`nats.md` 列 37；`transport-through-networks.md` 列 86～87。

**可修。** 寫明 HMI 的 VLAN 與兩個 listener 的 per-listener ACL，HMI 側一律 8883；1883 只在有線、port-isolated 的網段。影響的是 N-01 工件，不是 code。

### security-12（次要）供應鏈與 CVE 面

**情境。** 全部形狀。

**壞在哪一步。** (1) CM4 上 Anthias 用瀏覽器引擎渲染 playlist 裡的「link」內容（D-01），公開螢幕播的是外部網頁，瀏覽器漏洞是裝置側最大的遠端面；P6 只查了 Anthias 的 release 節奏（§2.2），**沒查它的瀏覽器引擎版本與更新節奏**（未查證）。(2) hub 的 pymodbus 解析 hostile T1 的 bytes（security-08），pymodbus 的 CVE 歷史未查證。(3) nginx 版本線 P6 自標「未查證」，而它是 Stage 0 唯一擋在 Odoo 前面的東西。P6 的 M-06 時鐘表少的是「哪幾個元件直接面對 hostile 輸入」的標記。

**依據。** P6 §2.2、§8.1、§8.4、§8.10；M-06、N-10。

**可修。** 部分：補查並標記；link 內容型別加 domain allowlist。瀏覽器面本身不可修，只能縮。

## 2. 此點成立

1. **pepper + 雜湊讓 N-04 的 staging 中和變成內建**（P6 §3.3 第 5 點）。還原到 staging 的 database 驗不了真裝置、發不出真 revoke，這比 runbook 好，比 P0「每環境一張中繼 CA」更少工具。成立，但 security-05 的明文 credential 會從另一側打破它。
2. **revoke 的 rejected / unknown 二分與 HMAC 簽章**（§3.3 第 4 點）修 B-11，且 fail-safe 方向正確：驗不過就保留 last-known-good。T2 管理表要的「裝置分辨 accepted / rejected / unknown」有了。缺的是 security-10 的三類回應。
3. **backend 只綁 localhost、node 是唯一持 token 的 process**（§3.2）修掉 B-10 的 bind 部分，且 F-07 的 crash isolation 一起成立。Anthias 自身的 port 是漏網之魚（security-07）。
4. **agent 只用 stdlib**（§2.2）是正確的攻擊面決策；hub 用 aiohttp 也比 Flask/Waitress 的 現有 gateway 有更清楚的時鐘。
5. **T1 的訊息永遠不會變成命令**（§3.2 Stage 2），Mosquitto 不持有 site token，命令面只在 Odoo ↔ hub ↔ agent 的 route 上。這是對 `mqtt-semantics.md` 結論 5（Sparkplug NCMD QoS 0、Clean Session）的正確讀法。
6. **Stage 0 的弱點寫得誠實**（§1 弱點 1、§7 M-04/F-18 列、§8.1、§8.2）：Odoo web stack 在攻擊面上、C-24 刻意重現、到期日是第一個 T1。我沒有攻擊這些，因為 P6 沒有假裝它們不存在。
7. **SPKI pin 而不是信任系統 CA store**（§3.3）對 (a)(b) 是對的：不依賴 CM4 的 CA bundle 更新，伺服器身分驗證在 agent 手上。問題只在 pin 的生命週期（security-03）。
8. **在 D-05 之前不蓋 CA 的論證**（§6 D-05「在 D-05 之前蓋 CA 是為一個還沒有的產品付利息」）本身成立；02 §1 說「安全是自己的（最危險的一刀）」，少做就少錯。但本文件的 security-02、05、06 顯示：P6 拿掉 CA 之後沒有補任何「會過期」或「可簽章」的東西，所以省掉的不是 PKI 的風險，是 PKI 的功能。

## 3. 如果我是 P6 的作者，最怕評審問什麼

「hub 被撤銷、或 Odoo 離線三天的時候，誰能向一片螢幕證明『這份 desired 真的來自 Odoo』？——如果答案是『沒有人』，那 Stage 1 的樹只是一條沒有信任錨的 relay，而你把它叫作『便宜的加法』。」
