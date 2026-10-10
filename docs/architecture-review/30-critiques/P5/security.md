# P5 批評：安全（security lens）

批評者：波次 B，lens = 安全。日期 2026-10-10。目標：`20-proposals/P5-pluggable-transport.md`（P5）。引用慣例：`10-facts/` 的事實寫成「`檔名` 列號」（T-、MQ-、N- 編號或表格列號，查證日期皆 2026-10-10）；需求用 ID；查不到的標「未查證」；「意見」另標。

## 0. 結論先講

致命 0 條、重大 7 條、次要 3 條。一句總評：P5 把身分放在應用層、把 T1 關進 `raw/`、不讓 broker 跨網路，這三個方向都對；但它的安全論證在兩處自我矛盾——「node 是唯一邊界」在 MQTT binding 下其實是 dynsec ACL 在當邊界；「管理面不綁任何 binding」卻把 adopt/revoke 實作在與 hostile T1 共用的 broker 的 retained topic 上——而且整份契約把事實鍵在 `path`、把端到端簽章留成「可選」，使 revoke 可被 re-plug 繞過、(c) 形狀的客戶 proxy 可偽造上行事實。十條全部可修，但修完之後 P5 的 MQTT binding 不再是「同一個 broker 一次做三件事」，§1.1 的 +2 種類帳要重算。

## 1. Findings

### security-01（重大）MQTT binding 的 `put` 歸屬由 broker ACL 決定，不是 node

P5 §3.1 說 session 範圍「由 parent 的 node 強制，與 binding 無關」，§3.2 說「契約規定 node 是邊界、broker 是縱深」。在 HTTPS binding 這成立：node 終結 TLS，知道哪張憑證在說話。在 MQTT binding 不成立：bridge node 只是 broker 的一個訂閱者，收到的 PUBLISH 只有 topic 與 payload，沒有發布者身分（MQTT 3.1.1/5 的 PUBLISH 封包沒有這個欄位；屬一般協定知識，規格原文研究員未直讀，見 `mqtt-semantics.md` §4 第 1 項，故標未查證）。node 能做的「path 範圍檢查」只是「topic 裡的 path 是否存在」，不是「這個 client 是否有權寫這個 path」。後者只有 dynsec 知道。

| 項目 | 內容 |
|---|---|
| 情境 | (b) VLAN-IoT-1、bridge A 有 Mosquitto（T-a）；D-01 螢幕走 HTTPS、D-02 感測盒走 MQTT binding，兩者都在 `n/` 命名空間 |
| 壞在哪一步 | 感測盒 unit 被攻陷（或 dynsec 生成器漏一條規則）後 PUBLISH 到 `n/<螢幕 path>/actual/playlist`，payload 帶 `applied_version = 最新`。bridge node 套「單調不倒退」寫 SQLite、往上 put。ERP reconciler 看到 actual == desired → In sync，螢幕其實沒變（B-03 換了個形狀重現）。同手法可偽造 `meas/*`、`actual/heartbeat`（讓下線裝置顯示在線） |
| 依據 | P5 §3.1「由 parent 的 node 強制」、§3.2 圍堵列「兩層」；`mqtt-brokers.md` 列 7（dynsec `%c`/`%u`）；F-18、N-05（每個寫入可歸屬） |
| 加重因素 | dynsec 的 `%u` 是 CN（序號，穩定身分），topic 用的卻是 `path`（adopt 指派、re-plug 會變，F-19）。ACL 因此不能用模式寫，node 必須在每次 adopt/re-plug 重寫該 client 的明確 ACL；dynsec 狀態與 registry 的同步成了安全關鍵狀態，P5 沒寫它失步時的行為 |
| 可修 | 可修。(1) MQTT binding 的每個 `put` payload 強制帶 unit 私鑰簽章（`sig` 從「預留」變「必填」），node 用 registry 內公鑰驗；(2) topic 改 `n/<serial>/…`、path 放 payload，讓 `%u` 模式 ACL 成立。代價：CM4 上 Ed25519 簽章可忽略；契約要改成「sig 在所有 binding 必填」，否則兩個 binding 的安全保證不等價，違反 P5「語意不寫在 binding 裡」的原則 |

### security-02（重大）一個 Mosquitto 同時是 T1 入口、T2 管理面、HMI 扇出；在 (a) 它還跟 issuer 同主機

P5 把「unit hop、T1 ingress、HMI 共用一個 broker」當成比 P2 省的地方（§1 理由 2、§1.1 T-a）。從安全看，這是把三個信任等級塞進同一個第三方 C process，而這個 process 面向 C-25 那種同 VLAN 的 hostile T1。P5 §3.5 第 4 點自己承認「已驗證的 T1 仍可能打 broker」，對策是綁介面、dynsec、升版排程——三者都不能阻止一個已驗證的 T1 耗盡 broker 資源或觸發記憶體錯誤。

| 項目 | 內容 |
|---|---|
| 情境 A | (b) bridge A（T-a）。hostile T1 以合法 raw 帳號連入，對 `raw/<id>/a/b/c…` 發布不重複 topic 的 retained 訊息（每 topic 一個 retained 槽，在記憶體，`mqtt-semantics.md` MQ9、MQ10）。Mosquitto 有無每 client 的 retained 數量上限：未查證。broker OOM → 同一 broker 上所有 MQTT binding 的 unit 收不到 `desired`、`rev`、`desired/credential`。unit 依 N-11 用 last-known-good，但**撤銷與續期停擺**直到 broker 回來；重啟後 retained 全失，要靠 node 回灌（P5 §8 第 2 點） |
| 情境 B | (a) 同主機 + T-a。bridge 0（issuer 模組、registry、環境中繼 CA 私鑰）、Odoo、Mosquitto 同一台，Mosquitto 的 T1 listener 綁 IoT VLAN 介面。一個記憶體錯誤（`mqtt-brokers.md` 列 10：2024-10 bridge 惡意封包 crash、2025-03 已驗證 client 惡意 SUBSCRIBE leak）被用成 RCE → issuer 私鑰外流 → 整個環境的 fleet 可被簽發與撤銷。02 §1「一次就是整個 fleet」在這裡不是比喻 |
| 依據 | P5 §3.4 (a) 圖、§3.5 第 4 點、§1.1 T-a；`mqtt-brokers.md` 列 2（commit 幾乎單一作者、8 個月無 tag）、列 10；M-04「防火牆只暴露我們控制的表面」——Mosquitto 不是我們控制的表面；`nats.md` §3.2 對同類問題的建議（T1 ingress 獨立實例） |
| 可修 | 可修。(1) 兩個 Mosquitto 實例：`raw` 實例只給 T1、沒有 `n/` 命名空間、不持久化、資源上限收緊；`n` 實例只給 unit 與 HMI；bridge node 訂 raw 實例、驗證後寫 n 實例。多一個 process，不多一種東西。(2) 管理面 slot（`cfg`、`desired/credential`、`rev`）在 MQTT 站點仍走 HTTPS binding，MQTT 只載 `actual/meas/desired(業務)`——這才讓 §1.1「管理面不綁 binding」成真，也給 security-10 的升版退路。(3) 形狀 (a) 禁用 T-a，或 Mosquitto 跑在讀不到 issuer 金鑰的容器/使用者下。代價約 1 人週 + 部署工件；「一個 broker 做三件事」的賣點變成兩個 broker |

### security-03（重大）端到端簽章是「可選」，但有兩個情境它是唯一防線

契約預留 `sig`，只對「T3、D-05、defacement 敏感的 desired」要求（§3.1 末段）；§4.3 F-48 列寫「desired **可**帶簽章」、(c) 形狀「簽章為必要」。兩個問題：只簽 desired、不簽 `sq/*`、文件、上行；而且 P5 低估了 (c) 的 TLS 檢查 proxy 拿走的東西——不只 client cert。

| 項目 | 內容 |
|---|---|
| 情境 A：(c) 有 TLS 檢查 proxy | 站點 bridge 要穿過檢查 proxy，就必須信任客戶的 proxy CA（否則握手失敗，`transport-through-networks.md` T1～T3）。於是 site bridge 對 bridge 0 的 **server 身分**也只剩應用層 hello 的回簽；之後串流上每個 frame，proxy 都能讀、改、重放（T6 Tailscale 原話「all bets are off」）。hello 簽章只保護握手，之後的 session 如何綑綁到那次握手（每訊息簽？session token？）§3.2 沒寫。未簽的東西：下行 `sq/<job_key>`（D-04 LED job、D-01 playlist job）、文件本體、上行 `actual/*`、`cq/*`、`meas/*`、D-05 的出勤事件 `cq/<event_id>` |
| 壞在哪一步 | 被攻陷的客戶 egress proxy（企業 proxy 是常見橫向目標；意見）對站點注入 `sq` → LED/螢幕被操作；改寫上行 `cq/<job_key>` 為 success → ERP 標終態（F-49 失真）；偽造 D-05 出勤事件——這是薪資資料 |
| 情境 B：(a)/(b) T-a 站點的 bridge 主機 | bridge 是子樹所有 unit 的 TLS 終結點，也是 security-02 所述最暴露的主機。bridge 被攻陷後對子樹每片螢幕改寫 `desired/playlist`，同時偽造 `actual` → 公開螢幕被 deface、ERP 顯示 In sync。F-48「forged intents are a defacement risk once screens are public」正是這一步 |
| 依據 | `transport-through-networks.md` T1～T6、§3.1 第 2～3 點；P5 §3.1 末段（可選）、§4.3 F-48 列；F-48、N-02、N-05 |
| 可修 | 可修。(1) site↔cloud 邊：每訊息雙向簽章（site bridge 金鑰 / bridge 0 金鑰），bridge 0 的簽章公鑰在站點 enrol 時 pin 住、不靠 TLS；hello 含 tenant id。(2) `desired/*` 與 `sq/*` 由 bridge 0（讀 ERP queue 的那個）簽，unit 在 adopt 時 pin 簽章公鑰，不信任中間 bridge 的改寫。代價：簽章格式已在 P5 外部審查範圍（§7 N-02 列），CPU 可忽略；真正的代價是「hop-by-hop 信任」要改寫成「hop-by-hop 傳輸、端到端授權」 |

### security-04（重大）revoke 鍵在 `path`，re-plug 就繞過；離線 bridge 的接受窗口沒有數字

slot 模型的五元組以 `path` 為鍵，`rev`「沿樹」放在被撤銷 unit 的 path 底下，`watch` 也只看自己 path 下的 `rev`（§3.1）。F-19 說 path 在 re-plug 時會變。

| 項目 | 內容 |
|---|---|
| 情境 | (b)。VLAN-IoT-1 下一片螢幕被偷或判定攻陷，ERP 按 revoke：issuer 在 `n/<舊 path>/rev` 放簽過名的撤銷、拒絕續期。攻擊者把螢幕插到 VLAN-IoT-2（bridge B，HTTPS binding）或任何同環境站點 |
| 壞在哪一步 | 螢幕用仍在效期內的營運憑證向 bridge B `dial`。bridge B 查什麼？P5 只寫 HTTPS binding「之後 hello 回 403」，沒寫 403 的依據。若 bridge B 看的是自己 SQLite 的 registry 鏡像，而它此刻與 bridge 0 斷線（N-11 要它繼續工作；(c) 形狀常態斷線），它會接受並指派新 path。新 path 底下沒有 `rev`。裝置拿不到 rejected 訊號，繼續 watch、繼續 put——直到憑證過期。**憑證效期多長，P5 全文沒有數字**；「短效、心跳續期」沒有數字就不是安全屬性 |
| 同根因 | (1) bootstrap 憑證在 adopt 後是否失效，P5 只在 MQTT binding 寫「停用 boot client」，HTTPS binding 沒寫；T2 憑證可從 eMMC 複製，複製品可在任何站點以「present, unadopted」出現，等一次誤按 Manage。(2) 同一憑證兩個併發 session（複製品）沒有偵測。(3) bridge 的「合成 config space」宣告子樹，上游信任 bridge 的宣告；bridge A 宣告一個其實在 bridge B 下的序號，registry 一序號兩 path，ERP 的 desired 寫去哪一個？P5 沒寫 |
| 依據 | P5 §3.1 slot 模型、§3.6 revoke 列；F-17、F-19、N-11；需求 §4.2 管理表 T2 列「revoke 立即生效、裝置能分辨 rejected / unknown」 |
| 可修 | 可修。(1) `rev` 鍵改為 serial，issuer 扇出到**所有** bridge（bridge 層級 slot `rev/<serial>`），bridge 在 dial 時以 serial 查拒絕名單。(2) 明寫：憑證效期 ≤ N 小時；bridge 的 registry 鏡像年齡 > N 時拒絕所有新 dial（fail closed）。(3) issuer 維護 adopted-serial 名單，bootstrap dial 命中即拒絕並告警；同 serial 併發 session 告警。(4) 一序號一 path 由 issuer 仲裁。代價小，但「path 是鍵」要改成「serial 是鍵、path 是屬性」，動到契約核心 |

### security-05（重大）N-04 的中繼 CA 寫了，但 issuer 私鑰住哪、備份帶不帶它、unit 錨在哪，都沒寫

| 項目 | 內容 |
|---|---|
| 情境 | 任何形狀。P5 §2 把 bridge 0 的狀態放 SQLite，N-09「備份 = 複製檔案」沿用 P0。staging 從 prod 備份還原（N-04 明文情境） |
| 壞在哪一步 | 若 issuer 私鑰在 bridge 0 的狀態目錄裡（P5 沒說不在），還原後的 staging 持有 prod 中繼 CA 私鑰，能簽出 prod unit 接受的憑證與 `rev`。N-04「environment copy carries no valid trust toward real nodes」被備份流程本身違反。再往前一步：**bootstrap 時 unit 錨在 factory root**（§3.6 第一列），任何環境、任何客戶、任何能拿到 factory 鏈下憑證的 bridge 都能讓一片新螢幕進入「present, unadopted」並 adopt 它；P5 沒寫 unit 何時、如何 pin 到自己環境的中繼 CA，也沒寫 hello 的「parent 回簽」用哪把鍵、驗到哪個錨。(c) 形狀寫「bridge 0 (per tenant)」又寫「每個環境一張中繼 CA」——若每環境一張，tenant A 的 unit 憑證在 tenant B 的 bridge 0 通過憑證層驗證，只剩 registry 查無此序號這一道（F-40 要求 tenant pinning 是結構性的） |
| 依據 | P5 §2 node 列、§3.6、§3.4 (c)；N-04、N-09、F-35、F-36、F-40 |
| 可修 | 可修。issuer 私鑰放 TPM/HSM 或獨立金鑰檔並明確排除在 N-09 備份集外，staging 還原流程第一步產生新中繼 CA；unit 在 adopt 時 pin 環境（與 tenant）中繼 CA 公鑰；bootstrap 需要帶 tenant+環境的 provisioning token（F-36 的 QR 就是放它的地方）；每 tenant 一張中繼 CA 掛在環境 CA 下。代價 1～2 人週 + 一條 runbook，但要寫進契約，不然每個部署自己猜 |

### security-06（重大）文件沿樹拉，但沒有雜湊；B-10 的 R2 沒有被 localhost 綁定修掉

| 項目 | 內容 |
|---|---|
| 情境 | D-01。`desired/playlist = {version, pointer}`（§6 D-01），unit 經樹向 bridge 拉文件；文件在每個 bridge 快取（N-11） |
| 壞在哪一步 | 就算 security-03 修了、desired 有簽章，pointer 指向的**文件本體**沒有簽章或雜湊。(c) 有檢查 proxy：proxy 換掉文件內容（圖、文字、URL），desired 的 version 不變、簽章驗過，螢幕顯示攻擊者的內容。(b) bridge 快取被改同理。另外 P5 §8 末段稱 B-10 由「localhost 綁定」處理——那只修 R1（綁所有介面）。R2「reconcile fetches any URL」是 display backend 照文件裡的 URL 去抓任何東西（SSRF 與內容注入）；MES live board 的「穩定 URL」正是文件裡的一個 URL，viewer 會渲染它 |
| 依據 | P5 §6 D-01、§8 末段；B-10（SM §1.3 R1/R2）；F-56、F-48、C-19 |
| 可修 | 可修，代價最小的一條。pointer = `(version, sha256)`，unit 校驗後才交給 display backend；文件只能由 node 經樹取得，backend 不得自行抓 URL；live board 類內容的 URL 限制在 node 維護的 allow-list（bridge consumer API 或 ERP 指定 host） |

### security-07（重大）T1 的 MQTT 身分：client id 可被頂替、同廠共用帳密、而且 P5 允許 HMI 直接訂 `raw/`

| 項目 | 內容 |
|---|---|
| 情境 | (b) bridge A，D-06 或 D-03 現場有多台同廠牌 T1 講 MQTT，C-25 同 VLAN |
| 壞在哪一步 | (1) MQTT 以 client id 區分 session；同 id 連入會頂掉既有連線（一般協定知識，規格文字未查證）。hostile T1 用自己的帳密 + 受害 T1 的 client id 連入 → 受害 T1 斷線（D-03 資料中斷）；若 dynsec 的 ACL 有任何一條用 `%c`（P5 §3.2 寫 `%c`/`%u`）而 dynsec 沒把 clientid 綑綁到該帳號（**dynsec 是否強制綑綁：未查證**），hostile T1 直接取得受害者的 `raw/<id>/#` 寫入權。(2) 封閉韌體的 T1 常只能設一組帳密、同廠多台共用（意見），此時 `raw/<id>` 的 id 無法與憑證對應，F-22「不以 IP 單獨辨識」在 MQTT 這邊變成「不以任何東西辨識」。(3) §6 D-06 寫「HMI……或直接訂 raw，若現場接受未驗證資料」——這是把 hostile T1 的輸出直接接到現場操作畫面，T1 → HMI 的橫向通道，F-18「a child is exposed only to its parent」被提案自己打開 |
| 依據 | `mqtt-brokers.md` 列 7；P5 §3.2 圍堵列、§6 D-06；F-18、F-22、M-04 |
| 可修 | 可修。契約明寫：ACL 只用 `%u`，dynsec client 必須 pin clientid；一 T1 一帳號，做不到的 T1 走獨立 listener/port（併入 security-02 的 raw 實例）；刪掉「HMI 直訂 raw」選項，HMI 只能訂 node 驗證後的正式 topic |

### security-08（次要）N-03 要求的「一個 credential resolver」在 P5 裡不存在

P5 沒有一處提到 secrets 怎麼存、怎麼取。要存的有：node 對 Mosquitto 的 dynsec admin 憑證（node 要用它改 ACL）；T1 的帳密（dynsec JSON 內的雜湊，格式與強度未查證；node 要能重新生成 dynsec，就得持有原始帳密或雜湊）；consumer API 的 scoped token（live board 頁面每 5 s 帶 token 拉 JSON——token 在 URL 還是 header？N-03 禁 URL）；(c) 我們 LB 轉述的 cert header 只能信 LB 來源（T5）。HMI 的 read-only 角色用 `n/<site>/+/actual/#`，單層 `+` 假設樹是平的，F-16 的可堆疊 bridge 讓它要麼漏、要麼改 `#` 而多看。可修：指定 resolver（環境變數 / 檔案 / TPM 三選一，缺鍵 fail closed）、token 走 header、每 work centre 一個可撤銷 token（F-63 的 per-line auth）。代價小，但要寫出來才會進審查。

### security-09（次要）PKI 的四個操作細節空白：效期、私鑰在哪生成、hello 順序、時間

(1) 效期沒有數字（見 security-04）。(2) adopt 列寫「issuer 簽營運憑證 → 以 `desired/credential` slot 沿樹下發」；若私鑰由 issuer 生成並隨 payload 下發，它會躺在每一跳 bridge 的 SQLite 鏡像與 MQTT 站點的 retained 快取（`persist-sqlite` 落盤）裡——N-03 全面違反。P5 沒寫是 CSR 模式。(3) §3.2 的 `POST /v1/hello {nonce_resp, versions}` 在 parent 給 nonce 之前就送出 nonce 回應，順序寫反或少一回合；若改成 child 自選時間戳，就有 replay 窗口要定義。(4) 短效憑證與簽章都依賴時間，CM4 無 RTC、N-14 記錄過 NTP 回傳零時間；共享 PSK LAN 上 NTP 可被偽造（一般知識，未查證）。bridge 驗 unit 憑證用的是 bridge 的時鐘，所以 unit 時鐘被改不會延長它的存取；但 bridge 自己的時鐘若被同 VLAN 的 NTP 偽造推前，所有 unit 瞬間過期 → 續期風暴；推後則已過期憑證復活。可修：CSR 模式（金鑰不離開 unit）；hello 由 parent 先給 nonce 與簽過名的時間；bridge 的時間只從 north 取（`transport-through-networks.md` §3.2 第 4 條）；時鐘未同步時 fail closed。代價小。

### security-10（次要）供應鏈：Mosquitto 的修補只在 ChangeLog、沒有 advisory 餵送；季檢不是修補 SLA

`mqtt-brokers.md` 列 10：GitHub security advisories 頁為空，近兩年安全修正只能從 ChangeLog 的 Security 標題辨識；列 2：commit 幾乎單一作者、2.1.3 標「2026-02-xx」未發布。P5 §8 第 9 點把它當 M-06「每季複查」訊號——季檢是生命週期監控，不是 CVE 回應；P5 沒有「advisory 出現後 N 天內全 fleet bridge 升版」的承諾，也沒有升版失敗的退路（例如暫時關掉 T1 listener、unit 退回 HTTPS binding——後者只在 security-02 的「管理面走 HTTPS」修法下才存在）。P5 §4.2 依賴的 `persist-sqlite` 是 2.1.0（2026-01）才加的 plugin（列 9），2.0.23 修過「惡意或損壞的 persistence 檔導致 crash」（列 10）；hostile T1 的 retained payload 會落進這個檔、重啟時被解析 → 若有解析缺陷，就是跨重啟的 crash loop（**persist-sqlite 是否有同類問題：未查證**）。conformance suite 測得出 ACL，測不出記憶體錯誤；P5 §8 第 1 點的兩條硬測試應加第三條：非 admin 角色對 `$CONTROL/#` 的 publish/subscribe 必須被拒（dynsec 的控制面就在這個 topic，列 7）。可修：訂 SLA、訂退路、加測試、raw 實例不持久化。

## 2. 此點成立

1. **身分放應用層、mTLS 當縱深（§3.1、§3.4 (c)）。** `transport-through-networks.md` T1～T5 全部支持「TLS 檢查 proxy 與 client cert 互斥」，P5 把它寫進契約而非某個 binding，是正確位置。security-03 批評的是簽章範圍不夠，不是方向。
2. **不用 Mosquitto bridge 跨網路、bridge node 自己當上游 client（§3.3）。** 圍堵與撤銷邏輯留在自己的 code、最小部署不帶 broker、跨網路 hop 不受 `bridge_protocol_version` 預設 3.1.1 / QoS 0（`mqtt-semantics.md` MQ16）牽制。
3. **T1 關在 `raw/`、以 bridge 身分重新 put、上游永不見 T1 憑證（§3.5 第 2～3 點）。** 這是 F-18 在 MQTT 上唯一正確的實作形狀。
4. **retained 只當快取、owner 在 SQLite（§3.3）**，並誠實列出 `persistence` 預設 false、`max_queued_messages` 靜默丟、`check_retain_source` 的輪替陷阱（MQ9～MQ11）。多數 MQTT 提案會把這三條當成不存在。
5. **`mosquitto.conf` 與 dynsec 由 node 生成、conformance suite 驗生成結果（§2 末段、§8 第 1 點）**，並預見 `acl_file` 在 3.0 移除會讓 C-09 重現（`mqtt-brokers.md` 列 8）。把設定當 code 審是對的。
6. **Sparkplug 只當資料面、D-05 控制通道不進任何 binding（§6 D-05、D-06）。** MQ19、MQ20 支持這個切法。
7. **§3.5 第 4 點承認「已驗證的 T1 仍可能打 broker」且「不能只靠 ACL」。** 問題是承認之後給的對策不夠（security-02），不是沒看見。

## 3. 作者最怕被問的一句話

「在 T-a 站點，一個 unit 的 `put` 是由哪個 process 證明『這真的是那個 unit 發的』——node，還是 Mosquitto 的 ACL？如果是 ACL，『node 是唯一邊界』這句話在 MQTT binding 下還成立嗎？」
