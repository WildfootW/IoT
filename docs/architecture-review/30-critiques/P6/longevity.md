# P6 批評：十年維運（longevity）

批評者 lens：十年維運。目標：`20-proposals/P6-minimalism.md`（P6）。日期 2026-10-10。輸入：`00-requirements.md`、`01-proposal-pcie-tree.md`（P0）、`02-tradeoffs.md`、`03-brief.md`、P6 全文、`10-facts/` 的 mqtt-brokers、nats、buy-options、zenoh、postgres-timeseries、transport-through-networks、mqtt-semantics。

引用慣例：第三方事實寫「（檔名 列號）」指 `10-facts/` 事實表的列號，查證日期皆 2026-10-10；P6 自己附來源的事實標「P6 §x 引」；我憑訓練知識補充、本次沒有查證的，標「未查證」。標「意見」的是我的判斷。

## 0. 結論先講

**致命 0 條，重大 7 條，次要 4 條。**

一句總評：P6 的語意層與分期方向是對的，但它把「十年」的帳算成了「第一個客戶」的帳：省下的每一期（PKI、hub、conformance suite）只有業務事件觸發、沒有日曆到期；而它沒省也沒寫的幾件事（裝置端升級通道、Odoo 大版遷移、備份還原、Stage 0 路徑的永久維護）才是十年內一定會到的帳單，其中兩張（Debian 12 LTS 2028-06、Odoo 19 2028-09）在第一個客戶裝機後不到兩年就到。

致命一欄為空是誠實的結果：十年維運面向上我找不到讓 P6 在某個錨點情境「不成立」的點；P6 的失敗模式不是壞掉，而是分期付款的利息沒寫進帳單。

## 1. M-02 誠實重算

P6 §2.2 用 P2 計法得到 Stage 0 / 1 / 2 = 10 / 11 / 12，另附嚴格計法 11 / 14 / 15。任務單要求「引擎、語言、runtime、repo、要追的外部時鐘各算一種」。P6 漏了三樣，而且都在它最在意的「一片螢幕」裡：

| 類別 | P6 自算（Stage 0 / 1 / 2） | 重算（Stage 0 / 1 / 2 / 3） | 差在哪 |
|---|---|---|---|
| 引擎 | PostgreSQL、SQLite = 2 / 2 / 2 | 2 / 2 / 2 / 2 | 一致 |
| 語言 | Python = 1 | 1 / 1 / 1 / 1 | 一致（Odoo 模組的 XML/JS 各提案皆有，不另計） |
| runtime | Odoo、node = 2 / 3（+Grafana）/ 4（+Mosquitto） | **4** / 5 / 6 / 6 | 漏 **Anthias**（裝置上獨立運行的 player，P6 §2.2 自列為外部元件）與 **nginx**（Stage 0 唯一的網路邊界，allow/deny 與 `limit_req` 是我們的設定，不能以「Odoo 本來就有」不算） |
| repo | 5 | 5 / 5 / 5 / 5 | 一致 |
| 外部時鐘（不與 runtime 重複） | 0 / 0 / 0 | **2** / 4 / 4 / 5 | Stage 0：**Debian 12 + Python 3.11**（P6 §2.2 引，算一組）、**CM4 / Raspberry Pi OS 韌體線**（未查證，但它是螢幕上活最久的東西）；Stage 1 起 +aiohttp、+pymodbus（P6 嚴格計法已認）；Stage 3 +CA 工具鏈（P6 寫「P0 §4 原案」，P0 未點名任何 CA 軟體，是一個還沒有名字的時鐘） |
| **合計** | **10 / 11 / 12** | **14 / 17 / 18 / 19** | — |

意見：重算不推翻 P6 自己說的「不比 P0 少多少」，但改變兩件事。第一，「一片螢幕 = 1 個服務」數的是我們新寫的服務，裝置側其實是 agent + display backend + Anthias，主機側是 nginx + Odoo + PostgreSQL。第二，漏算的三樣（Anthias、OS/Python、nginx）正好是 §3 三條重大 finding 的主角：漏算不是算術錯，是這三個時鐘在 P6 的維運模型裡沒有人看。

## 2. 每個外部元件的時鐘、LTS、授權（M-05、M-06）

| 元件 | 階段 | 授權 | release 節奏 | LTS / 支援線 | bus factor 與治理 | 來源 |
|---|---|---|---|---|---|---|
| Odoo 19 Community | 0 | LGPL-3.0 | 每年一大版 | 支援最近 3 大版；19.0 到 2028-09（planned） | Odoo S.A.；對外 API 會跨版移除（JSON-RPC 舊端點預定 Odoo 22 移除，搜尋摘要） | P6 §2.2 引；buy-options.md G1 |
| PostgreSQL 18 | 0 / 1a | PostgreSQL License | 每年一大版 | 18 到 2030-11-14 | 社群 | postgres-timeseries.md F-11 |
| nginx | 0 | BSD-2-Clause | **未查證** | **未查證** | F5；P6 自標未查證 | P6 §2.2 |
| Python 3.11 / Debian 12 | 0 | PSF / DFSG | — | 3.11 到 2027-10；Debian 12 LTS 到 2028-06-30（搜尋摘要） | Debian LTS 團隊；RPi 核心與韌體是否在 LTS 範圍：**未查證** | P6 §2.2 引 |
| Anthias | 0 | GPLv2 與 Commercial 雙授權 | 月更（2026-07～09 四版） | **無支援線文件**；README 未提 CM4 | Screenly 單一公司；00 §7 寫 maintainer「not recorded」 | P6 §2.2 引；00 §7 |
| SQLite 3.55 | 0 | Public Domain | 頻繁 | 事實上永久向後相容（意見） | 小團隊、三十年紀錄 | P6 §2.2 引 |
| aiohttp 3.14.x | 1 | Apache-2.0 AND MIT | 頻繁（發布日 P6 未讀到） | 無 LTS | 社群；在 (b) 形狀它是 hub south 介面面對租戶鄰居的那層 | P6 §2.2 引 |
| pymodbus 3.15 | 1b | BSD-3-Clause | 2026 年四版 | 無 LTS | 社群 | P6 §2.2 引 |
| Grafana 12.x | 1a | **P6 標未查證**；依訓練知識自 8.0 起 AGPL-3.0，本次未查證 | minor 支援 9 個月、major 末 minor 15 個月 | 12.4.x 到 2027-05-24 | Grafana Labs | 02 §4；P6 §2.2 |
| Mosquitto 2.1.2 | 2 | EPL-2.0 OR EDL-1.0 | 2.1.2 = 2026-02-09，之後 8 個月無新 tag，master 仍有 commit | Eclipse 專案，無明文 LTS | master 前 8 筆 commit 同一作者 `ralight`；領導人與贊助方未查證 | mqtt-brokers.md 列 1、2、3 |
| CA 工具鏈 | 3 | 未定 | 未定 | 未定 | 未定 | P6 §2.1「P0 §4 原案」 |

意見：重點不是哪個元件有問題，而是**到期順序**：Python 3.11（2027-10）→ Debian 12 LTS（2028-06）→ Odoo 19（2028-09），全部在第一個客戶裝機後 12～24 個月內。P6 §2.1 的七個觸發事件全由業務事件觸發，沒有一個看日曆。

## 3. Findings

### longevity-01（重大）Stage 0 直連路徑在原因消失後仍須永久維護，違反 M-01

**情境。** 客戶 A 是 (a) 形狀小辦公室，三片螢幕，永遠不會有歷史或 T1；客戶 B 已進 Stage 1b。兩者並存是 P6 的設計目標。

**壞在哪一步。** P6 §1 說「每一步是加法，不是重寫」；加法的另一面是沒有減法。Stage 0 直連路徑（agent → nginx `/iot/` → Odoo device route；15 秒 ETag 輪詢；nginx allow/deny；(a)(b) 自簽金鑰由 Odoo 發 pin、(c) 公開 CA）在 hub 進場後，其理由「還沒有 hub」對客戶 B 消失了，但只要客戶 A 還在 Stage 0 它就得活著。於是 agent 永久帶兩套下行行為（§4.1「依回應標頭自動切換」）、兩種 TLS 終結者、兩個 pin 來源；部署工件是 {Stage 0, Stage 1} × {(a)(b)(c)} 的矩陣（P6 §8.8 自己叫「乘法」，解法「每階段只出該階段的工件」只解決不預寫，不解決兩套都要維護到最後一個客戶離開）；N-18 讓它成為永久的 e2e 矩陣。壞的時刻：第一次 Odoo 大版遷移要同時驗兩條路徑；或 bug 只在 hub 路徑修了，Stage 0 客戶走的是另一條。

**依據。** M-01；N-18；P6 §4.1、§8.8；02 §1「fleet 升級很慢」。

**可不可以修。** 可修，代價是 P6 的標題。做法一：(a)(b) 形狀第一天就裝 hub（同主機、同一份 code，+1 服務，03-brief §2 允許三個），直連只留給 (c) 的 Stage 0，agent 只剩一種 parent 行為。做法二：給 Stage 0 一個日曆到期日（例如 2028-06 前全部進 Stage 1，與 Debian 12 LTS 同步），到期砍掉直連。第一個客戶多付約 1～2 人週，十年少維護一整列矩陣。

### longevity-02（重大）device route、token 發行、pepper、`iot.job` 全住在 Odoo 模組裡，與年度大版綁死，而「移出 Odoo」沒有觸發事件

**情境。** 所有形狀與階段：P6 §3.3 說 Odoo 是唯一發行者直到 Stage 3，之後 Odoo 仍是 root。2026 年裝的 D-01 螢幕講 v1，Odoo 在 2028-09 前必須升到 20 以上。

**壞在哪一步。** 十年至少三次 Odoo 大版遷移。每次，device route 的 controller、C-20 的 SERIALIZABLE 怪癖、token hash 與 pepper 的 credential resolver、`iot.job` 的 cron、snapshot 模型都要跟 ORM 與 web 層遷移，而遷移發生在 registry 真相所在的 database 上——P6 §7 F-35 列自己承認「一次 Odoo 遷移 bug 可以撤掉整個 fleet」。P6 §8.1 承認「P0 把它移出 Odoo 是對的方向，P6 只是說等 hub 進場再移」，§9.2 也估了「移出 Odoo 2～3 人週」，但 §2.1 的觸發表沒有這一項：hub 的觸發是歷史或 T1，不是 Odoo 升版。第一次大版遷移到來時 route 很可能還在 Odoo 裡，而 Stage 0 客戶根本沒有 hub 可移（見 01）。Odoo 跨版移除對外介面有紀錄（JSON-RPC 舊端點預定 Odoo 22 移除，buy-options.md G1，搜尋摘要）；device route 是我們自己的 controller，不直接受此影響，但這說明 Odoo 的 web 層不是當十年協定端點的地方。

**依據。** M-06；N-10；C-20；02 §1「ERP 當 root complex」；P6 §2.2、§7、§8.1、§9.2；buy-options.md G1。

**可不可以修。** 可修。加一個日曆觸發：「第一次 Odoo 大版升版前，route 的協定端、token 發行與 pepper 移到 hub，Odoo 只以 ORM / JSON-RPC 讀寫 `iot.*` 模型」（§9.2 那一列，2～3 人週），讓 Odoo 遷移 bug 的爆炸半徑縮到業務模型。代價：Stage 0 從此也有 hub——與 01 的修法是同一個決定。若不移，次佳是把 route 做成版本凍結的薄 controller，每個 Odoo 大版跑一組純 HTTP conformance（每次 1～2 人週），但那只是讓利息可見，本金還在。

### longevity-03（重大）裝置端沒有任何升級通道，而 P6 自己引的兩個時鐘在 2027-10 與 2028-06 到期

**情境。** 形狀 (b) 工廠，Stage 0 或 1：幾十片 CM4 在共享 PSK 的 IoT Wi-Fi、租戶同 VLAN（C-25）。時間：2028-07-01，Debian 12 LTS 結束次日。

**壞在哪一步。** P6 §9.3 寫「Python 3.11 到 2027-10；到時至少要換 Python 版本」，§7 把兩個時鐘「排進 M-06」，但全文沒有一句說明**一片鎖在天花板上的螢幕怎麼換 Python**。§4.1 的 job 種類沒有「更新 agent」；desired 沒有 `agent_version`；沒有簽章更新包、A/B 分割或回滾；02 §1 把 OTA 列為「以後，也許永遠不會」，P6 照收。三件事疊起來：(1) agent 的裝機版本就是它十年的版本，除非有人帶 SD 卡到場；(2) 2028-07 起 OS 無安全修補，而盒子坐在 M-04 定義為不可信的網段旁（agent 只撥出、backend 只綁 localhost 縮小了攻擊面，這點 P6 做對了，但 kernel、OpenSSL、Chromium 的 CVE 不走我們的 port）；(3) 06 的「Odoo 永遠講 v1」正是因為沒人能把 2026 年的 agent 升到 v2。P0、P2 同樣沒寫，但 P6 是唯一明確選「系統 Python、不做 Rust PoC」的提案，把 agent 的 runtime 綁在 OS 時鐘上，欠的答案最多。

**依據。** N-10；M-06；C-25；P6 §2.2（兩個時鐘皆 P6 引）、§7、§9.3；02 §1。

**可不可以修。** 可修，但必須在 Stage 0 做，因為事後補更新器需要先有更新器。最小：agent 多一種 job（`update_agent`：下載簽章 artifact、驗簽、原子換檔、健檢失敗回滾），1～2 人週，不加種類；OS 在 LTS 內用 unattended-upgrades，2028-06 前全 fleet 換 Debian 13（人力，不是程式）。十年不帶 SD 卡到場就得接受 A/B 系統更新（例如 Mender client，Apache-2.0，buy-options.md D1；+1 runtime、+1 時鐘）。P6 §9.1 的 15 人週要加 2～3，且不能分期。

### longevity-04（重大）Anthias 是 Stage 0 全部價值所在，卻沒有觸發事件、沒有繼任者、沒有版本釘選政策

**情境。** 形狀 (a)(c)，Stage 0，D-01。第一個客戶買的是螢幕；畫圖的是 Anthias，不是我們。

**壞在哪一步。** P6 §2.2 標 Anthias「過渡期 player」「由 reconcile 介面換掉」，§9.2 估「換 player 2 人週」。三個洞：(1) **沒有候選**。2 人週是寫一個 reconcile 實作的價錢，前提是存在另一個能在 CM4 跑、有本地 API、能排程的 player；P6 沒點名，00 §9 也列為開放問題。沒有候選的可逆性不是估算。(2) **沒有觸發**。§2.1 七個觸發無一關於 Anthias；Screenly 是商業公司，00 §7 寫 maintainer「not recorded」，P6 自查 README 不提 CM4。十年內 Screenly 停掉 Anthias、跟著 Pi OS 換底、或雙授權的 Commercial 端收緊都是正常事件。(3) **沒有釘選政策**。Anthias 月更（P6 引）。配合 03，裝置上的 Anthias 要嘛凍在裝機版（吃不到修補）、要嘛跟月更（C-18 那類行為可能每月變，reconcile 要跟著追）。P6 兩邊都沒選。

**依據。** F-61；C-18、C-19；00 §7、§9；P6 §2.2、§8.4、§9.2。

**可不可以修。** 可修。最低限度：Anthias 版本釘進映像、§2.1 加觸發（例如連續 6 個月無 release，或不再支援我們的 OS 線）、第一個客戶前做一次繼任者 PoC（最可能是 Chromium kiosk + display backend 自己排程，其實就是重寫 Anthias 的播放核心，估 3～4 人週而非 2）。15 人週變 18～19；Anthias 從外部變自建，runtime 少一、自有 code 多一塊。

### longevity-05（重大）N-09 備份與還原整份沒有章節：`history` 不在 Odoo 的備份裡、pepper 在 database 外、沒有還原演練

**情境。** 形狀 (a)，Stage 1a，客戶 IT 自管主機。硬碟壞了，IT 用 Odoo database manager 的備份（或 `pg_dump odoo`）在新主機還原。

**壞在哪一步。** 三處同時壞。(1) `history` 是同叢集的獨立 database（P6 §2.2、§5）；Odoo 自帶備份與多數客戶的 `pg_dump` 只備 Odoo 那個 database，三年資料與 roll-up 不在裡面；postgres-timeseries.md 第 111 列直接寫「獨立 database 只隔離 schema，不隔離 WAL 與備份」，第 99 列寫備份「與 ERP 同一套；歷史變大會拖慢 base backup 與還原」。P6 引了這份檔的 §3.4 門檻，沒引關於備份的這兩句。(2) pepper 依設計不在 database（§3.3 第 5 點，N-04 的正確做法），還原後 pepper 不在；所有 token hash 驗不過、revoke 的 HMAC 發不出，agent 判 `unknown` 繼續播最後一份（N-11，P6 做對了），但 fleet 從此不可管理。§8.6 承認「pepper 遺失 = 全 fleet 重新 adopt」，但沒寫重新 adopt 的動作：bootstrap token 在 adopt 時已失效（§3.3 第 3 點），新 bootstrap token 要由 provisioning station「寫進裝置」（第 1 點），即每片螢幕一次現場作業。(3) 沒有還原演練：§9.1 的 e2e 是 re-point、revoke、離線重送，沒有「從備份還原後 fleet 仍可管理」。agent SQLite 與 hub 上行緩衝也無備份陳述；前者丟了可接受，後者丟的是 7 天量測，P6 該明寫接受或要備。

**依據。** N-09（open）；N-04；N-18；postgres-timeseries.md 第 99、111 列；P6 §3.3、§5、§8.6、§9.1。

**可不可以修。** 可修，約 1～1.5 人週，應放在 Stage 0 工件：叢集層級備份（`pg_basebackup` 或 `pg_dumpall`）；pepper 分開、加密、版本化託管，token hash 帶 `pepper_id`、允許兩個 pepper 並存（輪替與還原才可操作）；一條不重刷的遠端重新 adopt 路徑（連續 N 天 `unknown` 後螢幕角落顯示序號與 nonce，操作員在 Fleet 以一次性碼核准），把 pepper 遺失從「每片一次現場」降為「每片一次按鈕」；N-18 加「還原後可管理」情境。

### longevity-06（重大）協定規格只存在於 code 與 e2e；砍 conformance suite 時也沒留相容性矩陣，而 fleet 又不能升級

**情境。** 2029 年：寫 agent 的工程師離職，Odoo 剛做完第一次大版遷移，fleet 同時有 2026 年的 v1 agent 與 2028 年的 v2 agent。

**壞在哪一步。** 02 §3 第 1 項要求「版本協商加相容性矩陣」第一天就做；P6 §9.3 只接前半，§7 把語言中立的 suite 換成「以 e2e 取代」。e2e 測的是「這版 agent 對這版 Odoo」，不是「v1 wire format 是什麼、哪些欄位哪版加的、Odoo 必須接受哪些舊行為」。配合 03（agent 不能升級）與 02 §1「2029 年還在講 v1」，Odoo route 必須永遠同時講 v1…vN，而沒有任何文件說 v1 是什麼，只有一支已改到 vN 的 code 與只測 vN 的 e2e。bus factor 1～2（錨點 6）。這是 02 §1「制度性知識」那一刀在 P6 的形狀；P6 砍 suite 時把唯一便宜的止血（一份有版本的規格與矩陣）也一起砍了。

**依據。** 02 §1、§3 第 1、6 項；N-17；P6 §7、§8.9、§9.3。

**可不可以修。** 可修且便宜：node repo 放一份有版本的 wire 規格（四個動詞的 schema、每欄位引入版本、Odoo 端對舊版的接受規則）與一張矩陣，約 1 人週；改協定先改文件。suite 可等第二個實作者，規格不能等。

### longevity-07（次要）M-02 少算了 Anthias、nginx 與 OS/Python；一片螢幕的真實數字是 14 不是 10

見 §1。P6 已誠實寫「不比 P0 少多少」，所以不改排名，只改自我描述：「1 個服務」是新寫的服務數，不是要維護的種類數；nginx 在 Stage 0 承擔 §3.2 三件圍堵中的兩件，EOL 卻「未查證」。可修：改表即可，不花人週。

### longevity-08（次要）§7「M-05 沒有妥協」與 §2.2 Grafana「授權未查證」矛盾

03-brief §2 要求 M-05 要正面回答。依訓練知識 Grafana 自 8.0 起 AGPL-3.0（本次未查證）；若屬實，對「不修改、獨立服務」的用法義務很輕，但要寫出來，不能「未查證」與「全部不綁客戶」並存。可修：查證並寫 AGPL 立場，或改用 Odoo graph view 給 ops（少一個 runtime 與時鐘，失去告警與 provisioning）。不花人週。

### longevity-09（次要）Stage 2 Mosquitto 的可逆性說法與自己的設計矛盾；bus factor 與重啟行為沒寫

P6 §9.2 說「換 broker 1～2 人週（`acl_file` 格式 FlashMQ 也認）」，但 §3.2 用的是 dynsec（mqtt-brokers.md 列 7），不是 `acl_file`；`acl_file` 自 2.1.0 deprecated、預計 3.0 移除（列 8）。要嘛用 dynsec 而 FlashMQ 相容無用，要嘛用將被移除的 `acl_file` 換可攜性，不能兩者都主張。FlashMQ 是 OSL-3.0（列 27），該檔 §1 說要法務看過，當退路要先回答 M-05。另兩件 §8.10 沒寫：Mosquitto 近期 commit 幾乎全出自一人（列 2），對面對 hostile T1 的 C 程式，這比「8 個月無 tag」更該排進季檢；`persistence` 預設 false、`autosave_interval` 1800 秒（列 9；mqtt-semantics.md MQ10），P6 §5 讓 HMI 依賴 retained 給 late joiner，就得明寫「broker 重啟後 hub 以 owner 身分回灌 retained」（mqtt-semantics.md F-46 列的建議）。可修：hub 的 ACL 產生器做 adapter（dynsec 與 acl_file 兩種輸出）、重連時回灌 retained；0.5 人週。選 Mosquitto 本身是對的（§4）。

### longevity-10（重大）伺服器金鑰與 SPKI pin 沒有輪替流程；十年內一定要輪替，(c) 用公開 CA 時可能第一次續期就壞

**情境。** (c) Stage 0：agent 直撥我們雲端的 nginx，P6 §3.3 說 (c)「用公開 CA 憑證」，同時第 1 點說 provisioning 寫入「parent 的 SPKI pin（nginx 或 hub 的伺服器公鑰指紋）」。(a)(b) Stage 1 起：hub 自簽金鑰、pin 由 Odoo 發。

**壞在哪一步。** (c)：公開 CA 憑證以 90 天自動續期是主流，常見 ACME client 預設每次續期換新金鑰（依訓練知識 certbot 需 `--reuse-key` 才保留；未查證）；若 agent 真的 pin SPKI，第一次續期就全 fleet 驗證失敗、判 `unknown`、不可管理；若 (c) 其實不 pin，P6 就該寫明 (c) 只靠公開 CA，與 (a)(b) 是兩套模型（又一列 01 的矩陣）。(a)(b)：自簽金鑰十年內必換（洩漏、演算法退役、搬主機）；pin 的更新通道是 desired 的 `config.parent.spki_pin`，但它要靠舊 pin 驗過的連線送達，必須有「同時接受兩個 pin、先發 next 再換金鑰」的 rollover。§3.3 對 token 寫了輪替（新 token 下發、舊的 24 小時後失效），對 pin 沒寫；§8.7 只處理第一次 re-point。

**依據。** N-02、N-04；P6 §3.3 第 1、3、6 點、§8.7；transport-through-networks.md T6（P6 §8.5 引）。

**可不可以修。** 可修，0.5～1 人週：pin 改成集合（current + next），任一命中即接受；程序「發 next → 全 fleet report 確認收到 → 換金鑰 → next 升 current」；(c) 用 ACME 則固定 `--reuse-key` 寫進 N-01 工件，或 (c) 不 pin 並寫明理由。

### longevity-11（次要）`history` 與 Odoo 共叢集的 PG 大版升級；D-06 第一台機器就觸發「獨立實例」

PG 18 最後發行 2030-11-14（postgres-timeseries.md F-11），十年內至少一次大版升級，時間由 Odoo 支援矩陣決定；`history` 同叢集，`pg_upgrade` 的時間與風險被它拖著走，(a)(b) 客戶 IT 升版時未必知道還有一個 database。P6 §2.1 的「> 2 倍或 > 10 億 → 獨立實例」門檻正確（該檔 §3.4 第 121 列），但 P6 §6 自算 D-06 一台 1 Hz 三年 28 億筆（W2，第 90 列），第一台 D-06 就越線；D-06 站點的最小是 Odoo + hub + 獨立 PG + Mosquitto 四個服務，§2.1 應在 D-06 那行明寫。可修：補一行、升版責任寫進 N-01；不花人週。

## 4. 此點成立

1. **語意層第一天到位、結構層等有對象。** P6 §9.3 的分界在十年維運上是對的；§4.3 把每個 retention window 寫成設定並計 drop，完整回應 02 §3 第 3 項。
2. **歷史放 Odoo 叢集內獨立 database、窄表、月分區、drop partition、增量 roll-up。** 與 postgres-timeseries.md F-12、F-13、§3.4 一致；「> 10 億或 > 2 倍 → 獨立實例，再不夠才 TSDB」是該檔第 130～131 列建議的形狀，且避開 `pg_partman` / `pg_cron` 的 `shared_preload_libraries`（F-14、F-15），對 (a)(b) 客戶自管 Postgres 很重要。
3. **pepper 不在 database 裡，staging 中和成為內建。** 一個設計同時解 N-04 與 00 §9 的開放問題；§8.6 誠實承認單點（05 只是補它沒寫的後半）。
4. **Mosquitto 是對的 broker，位置也對。** 只聽 T1 VLAN、dynsec、不持 site token、不走命令，與 mqtt-brokers.md §3.1 第 1 名一致；zenoh.md 第 109 列說它的時鐘是候選中「最慢、最無聊」的，M-06 要的正是這個。
5. **agent 只用 stdlib。** 把最難更新的元件（天花板上的 CM4）的外部 library 時鐘降到零，是 P6 在十年維運上最實在的決定。
6. **M-02 的自我評價誠實。** P6 自己寫「不比 P0 少多少，省下的是第一個客戶前要寫完、審完的數量」，並列出 Python 與 Debian 兩個時鐘；§1 的重算抬高了數字，沒有推翻這句。
7. **不做 Rust PoC 在 M-02 上成立。** 感測服務、LED 控制器、現有 gateway 都是 Python；03 批評的是「系統 Python 沒有升級路徑」，不是「選 Python」。

## 5. 如果我是作者，最怕評審問什麼

「Debian 12 LTS 在 2028-06 結束、Odoo 19 在 2028-09 結束，你的七個觸發事件沒有一個看日曆——第一個客戶裝機後兩年內，你要用什麼方法碰到那片已經鎖在天花板上的螢幕？」
