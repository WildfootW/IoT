# P2 批評：安全（security lens）

批評者：波次 B，lens = 安全。日期 2026-10-10。目標：`20-proposals/P2-https-pull-defended.md`（P2）。輸入：`00-requirements.md`、`01-proposal-pcie-tree.md`、`02-tradeoffs.md`、`03-brief.md`、`10-facts/transport-through-networks.md`、`mqtt-brokers.md`、`mqtt-semantics.md`、`nats.md`、`precedents.md`。

引用慣例：第三方事實寫「（檔名 列號）」，`10-facts/` 全部列的查證日期為 2026-10-10；沒有來源的事實標「未查證」；標「意見」的是判斷。需求以 ID 引用。

## 0. 結論先講

**致命 0 條、重大 9 條、次要 4 條。** 一句總評：P2 正確地把信任從 TLS 層搬到應用層簽章，但只搬了**下行**的一半——上行事實沒有簽、bootstrap 的信任錨沒有綁環境與租戶、hostile T1 的 MQTT 解析器放進了唯一持有樹憑證的 process，而「偽造意圖需要 bridge 0 私鑰」對真正的攻擊面（能寫 ERP queue 的任何人）不成立。每一條都可修，多數修法就是把 P2 已為 site→cloud 那一跳設計的簽章對稱地用到別處；代價是幾人週與更長的外部審查清單，不是換方案。沒有一條讓方案在某個錨點情境下不成立，所以沒有致命。

## 1. 攻擊路線

把 P2 §3、§4 當成一張信任圖，每條邊問三件事：誰驗證、金鑰從哪來、信任錨壞掉時壞到哪。findings 依邊排序：site→cloud（01）、T1→bridge（02）、unit→bridge 上行（03）、bootstrap（04、05）、ERP→bridge 0 這條 P2 沒畫的邊（06、07）、撤銷與金鑰保管（08、09）、四條次要（10～13）。

## 2. Findings

### security-01（重大）(c) 的 mTLS 退路是可誘發的降級，且退路下 bridge 信任哪張 CA 沒有寫

**情境。** 形狀 (c)、D-01，客戶 proxy 做 TLS 檢查。

**壞在哪一步。** P2 §3.5：「mTLS 仍預設開啟；握手被 proxy 打斷時，bridge 以純 TLS 連上並只靠簽章」。第一，退路由 client 依「握手失敗」自動觸發，是教科書式 downgrade：任何在 bridge 與 internet 之間能 RST 或竄改 ClientHello 的人都能讓 bridge 永遠停在退路；P2 只把 `transport.mtls=false` 寫進 actual register，沒有任何一方因此拒絕連線。第二，退路的「純 TLS」要通過 TLS 檢查 proxy，bridge 就必須信任**客戶 proxy 的 CA**（否則連線根本建不起來，§1 第 1 點「唯一不需要客戶讓步」直接不成立）；一旦信任客戶 CA，整條串流對客戶 IT 是明文：desired、SQ、文件、撤銷清單、以及步驟 4 沿同一條連線下發的新憑證。簽章保護完整性，不保護機密性；N-02 在這一跳變成「對客戶 IT 加密」，而客戶 IT 是 D-05 的對手之一。P2 同段末尾已寫「要求客戶 IT 設 bypass」，等於承認退路不是終態，卻仍把「不需要客戶讓步」當第一理由。

**依據。** N-02、F-41；`transport-through-networks.md` T1～T3（摘要）、T5（原文）、T6（原文：Tailscale 遇 TLS 攔截只告警，不自動降級）。

**可修。** 退路改為**部署設定**而非自動偵測，退路下仍 pin 我們的 root（有檢查且無 bypass 的客戶會誠實地連不上，而不是靜默降級）；「客戶 IT 對我們的 FQDN 設 bypass」從建議升為 N-01 硬前提，並改寫 §1 第 1 點。若堅持在客戶 CA 下工作，frame payload 要另做應用層加密，那是第二份自己的密碼學格式。

### security-02（重大）MQTT ingress 解析器在唯一持有樹憑證的 node process 裡，T1→bridge 這條邊沒有 process 層圍堵

**情境。** 任一形狀，D-02/D-03 有講 MQTT 的 T1；C-25 的 T1 VLAN。

**壞在哪一步。** P2 §2：node「內含 MQTT ingress adapter」；§3.2 第 2 層：「node 是唯一持有網路憑證的 process」。合起來：hostile T1 的封包第一個碰到的 parser，就在持有營運私鑰、SQLite 鏡像（含文件快取）與上行串流的那個 process 裡。一個 pre-auth 的 CONNECT/PUBLISH 解析漏洞等於 bridge 私鑰外洩加整個子樹的 desired 與文件。P2 §8 第 3 點承認「必須 fuzz」，但 fuzz 降機率，不是 F-18 要求的結構邊界；P2 對 感測服務、LED 控制器 做到了 localhost 獨立 process，唯獨對最 hostile 的輸入沒做。形狀 (a) 更糟：bridge 0 與 Odoo 同主機，T1 VLAN 流量直接打進 ERP 主機上的特權 process。B-10 的形狀換一個 port 重現。

**依據。** F-18、M-04、F-07、B-10；MQTT listener 的 pre-auth 面 2026 年真實出事：`nats.md` N17（CVE-2026-58210 partial CONNECT 耗盡記憶體、CVE-2026-58213 SUBSCRIBE 注入可跨 account，皆 High，後者官方稱升級外無 workaround）；`mqtt-brokers.md` 列 37（Aedes 2026 年 3 則 High，含未驗證 CONNECT 使 broker crash）、列 14（NanoMQ 多次 memory safety 修正）。

**可修，便宜。** ingress 做成**第四種 function backend**：獨立 process 與 OS user、只綁 T1 VLAN 介面、不持有樹憑證、通過 schema 的資料走 localhost 交給 node（與 感測服務 同模式，+0 種類）。代價：多一個 process（N-07）、localhost 協定多一種 message。意見：性價比最高的一條。

### security-03（重大）上行沒有端到端簽章：每個中間 bridge 是全部 children 的 actual、CQ、量測與事件的可信 MITM

**情境。** 形狀 (b)(c)；D-05 出勤事件、D-01 `applied_playlist_version`、D-03 電表。

**壞在哪一步。** §3.5 只簽兩件事：bridge→bridge 0 的身分信封，與 bridge 0→節點的下行 frame。unit→bridge 的 `report`/`complete` 沒有簽；§3.1 共同規則「每個節點終結 children 的 TLS 再以自己身分重新發起」代表 bridge 看到並重新封裝全部上行。被攻下的 bridge（或 security-02 的後果）可以：把 D-05 出勤事件偽造成 ERP 業務列（F-03 說那是合法列）；把螢幕的 `applied_playlist_version` 回報成等於 desired，ERP 顯示 In sync 而螢幕在放別的（B-03 換位置重現）；把電表讀值寫進三年歷史。N-05「every write is attributable (identity)」只對 bridge 成立。§6 D-05 說 T3 以硬體金鑰簽 announce，事件卻只「走 report 帶 cursor」。另外步驟 4 續期「bridge 轉發 bridge 0 的簽發結果」沒寫 CSR：若私鑰由 bridge 0 產生，它會經過每一個終結 TLS 的中間 bridge。

**依據。** N-05、F-48（「each hop verifies its parent」只覆蓋下行）、F-03、B-03；對照 `precedents.md` e14（原文：Apple MDM 裝置以身分憑證直連 server，不經中介終結）。

**可修。** 信封對稱化：unit 以營運金鑰簽 report/complete 的 body hash 與單調計數；bridge 只轉發不改寫；bridge 0 驗簽後事件才成業務列。寫明 unit 產鑰、送 CSR、只有公鑰離開裝置。代價：bridge 0 每筆上行一次驗簽（錨點 4 規模可忽略，意見）；bridge 彙總 presence 時只能彙總自己擁有的事實。

### security-04（重大）bootstrap 階段任何 factory CA 之下的中繼都能收養新 unit：N-04「prod 永不信任非 prod」在步驟 2 不成立

**情境。** 形狀 (a)(b)，C-25 共享 PSK Wi-Fi，D-01 新螢幕開箱。

**壞在哪一步。** §3.3：factory CA 是根，每環境一張中繼由它簽。步驟 2：unit 用 mDNS/DNS 找 parent、「parent 驗 factory CA」——沒寫 unit 用什麼驗 parent。出廠 unit 唯一的信任錨是 factory root，所以 dev、test、staging、另一個客戶 prod 的中繼簽出的 bridge cert，對新 unit 都是合法 parent。mDNS 無認證（F-23），C-25 的 Wi-Fi 上誰都能回應；一台帶 dev 憑證的筆電就能讓新螢幕進它的 Fleet 並 Manage。N-04 的兩句話，P2 只用「中繼私鑰不在 Postgres」回答了第二句，第一句在 bootstrap 沒有機制。跨租戶同理：(c) 下我們營運多個客戶的 bridge 0，客戶 A 的新 unit 接到客戶 B 的 VLAN 就會出現在 B 的 Fleet；QR 只有序號，沒有「屬於誰」。

**依據。** N-04、F-35（root of trust「above any single customer site」被實作成所有環境共用的一棵樹，卻無分支約束）、F-23、C-25；`transport-through-networks.md` T27、T28（摘要）。

**可修。** 擇一或疊加：製造站把序號預綁環境與租戶（bridge 0 只收養清單內序號）；adopt 需輸入 QR 上的 claim code（秘密，非序號），unit 當 proof-of-possession 放進 announce；unit 的信任錨加上「允許的中繼政策」（name constraint 排除 dev/test）。代價：F-36 多一步、Manage 多一欄。意見：claim code 最便宜且同時解跨租戶。

### security-05（重大）T2 bootstrap 金鑰無硬體保護、F-36 的製造步驟叫「clone」、adopt 後 bootstrap cert 只對 T3 失效

**情境。** 全部形狀，D-01/D-02/D-04 皆為 T2（CM4）。

**壞在哪一步。** 管理表 T2 列只有「software credential」，T3 才有「non-clonable key」；§3.3 步驟 1「燒 bootstrap cert」、步驟 7「bootstrap cert 在 adopt 後對 T3 失效」。疊起來：(a) T2 的 bootstrap 私鑰是 eMMC/SD 上的檔（CM4 無 secure element，**未查證**，P2 亦未主張有）；(b) F-36 第一步是 clone/configure，若 image 含金鑰，同批 unit 共用一把，P2 沒寫「金鑰在首次開機於裝置產生」；(c) 即使每台一把，adopt 後 T2 的 bootstrap cert 仍長效有效。後果：一片 adopted 螢幕的 SD 卡被 dd 後，複製品可用同序號在任何 bridge 以「present, unadopted」出現，誘導操作員重新 Manage 或至少打破 F-19 的 stable identity；配合 security-04，可被另一環境收養。對公開螢幕，複製 SD 卡是最便宜的攻擊。

**依據。** F-19、F-36、管理表 T2/T3 列、N-03（對 bootstrap 私鑰檔同樣適用）。

**可修。** 金鑰於裝置首次開機產生、CSR 回製造站簽（image 不含私鑰）；bridge 0 維護已 adopt 序號清單，對其 bootstrap announce 一律拒絕並告警（把 T3 列推廣到 T2），release/factory reset 由平台動作明確移出清單——步驟 7「回到步驟 2」與「bootstrap 失效」的張力在此解；長期加 TPM/SE（N-20 carrier 限制下是否可行，**未查證**）。

### security-06（重大）「偽造意圖需要 bridge 0 私鑰」只對中間 bridge 成立；真正的 defacement 門是能寫 ERP queue 的任何東西

**情境。** 形狀 (c)，Odoo 對 internet 開放；D-01 公開螢幕。

**壞在哪一步。** §3.5、§7：「中間 bridge 被攻下不足以 deface」。但 §4.1：bridge 0 讀 ERP queue 後簽名推下——bridge 0 是一台**簽名機**。F-48 要求「defined who may command which node」；P2 只定義「ERP 是唯一寫入者」，沒有誰在 ERP 裡、對哪個子樹、什麼權限。Odoo 年度大版、模組生態龐大、(c) 直面 internet；一個帳號被釣、一個模組 SQL 注入、一個 `type='json'` 回 200 的 Forbidden（C-20）都能寫 queue。P2 對「ERP 遷移 bug 掃掉 fleet」做了批次 revoke 二次確認（步驟 6），對「一次 publish 到全部公開螢幕」（F-58 是現有功能）沒有等價的門；且步驟 6 的確認碼若也經 ERP 送到 bridge 0，對 ERP 被攻下是同一通道兩次請求，不是第二因素。

**依據。** F-48、F-58、C-20、02 §1「ERP 當 root」；03-brief §2 允許拆獨立管理服務，P2 §8 第 7 點選擇不拆，代價是自選的。

**可修（部分）。** bridge 0 從簽名機變**政策點**：queue 項帶 ERP 使用者身分，bridge 0 驗「此使用者可對此子樹寫此類 register」；影響 N 片公開螢幕以上的 desired 變更要帶外確認（確認碼不經 ERP，例如 bridge 0 本機 CLI 或 TOTP）；文件只接受 ERP CMS 產生的雜湊（見 security-07）。意見：只能部分修，因為「ERP 是 CMS」就是信任 ERP 內容；能修的是把爆炸半徑從 fleet 縮到一個子樹或一次確認。

### security-07（重大）文件無雜湊綁定、快取無 per-child 授權、「link」內容出口未定：三條繞過已簽 frame 的 defacement 與外洩路徑

**情境。** 全部形狀，D-01 螢幕與 MES live board。

**壞在哪一步。** §4.1 value 是 `{version, doc_pointer}`，§6 D-01「文件沿樹從 bridge 快取拉」。(i) pointer 無內容雜湊：frame 簽指標不簽內容，能寫 bridge 文件快取的人（bridge 被攻下、SQLite 被改、備份還原錯檔）就能讓全部螢幕放任意內容，而簽章完整無缺——§3.5 說它「解 F-48」，在 F-48 唯一點名的 defacement 情境解了一半。(ii) P2 沒寫 bridge 檢查「這個 child 的 desired 有沒有引用這個 pointer」；一片被攻下的螢幕、security-05 的複製品、或任何持 bootstrap cert 的裝置（「權限只有 announce 與 heartbeat」是否在文件端點強制，未寫）可以枚舉其他螢幕的文件，live board JSON 是生產資料。(iii) D-01 內容型態含「link」；§3.2 只寫 T1 VLAN default deny，device VLAN 往 internet 沒寫。開放則 defacement 變成「攻下那個外站」且 C-24 以「直連 internet」重現；關閉則 link 型內容壞掉，P2 只寫 live board JSON 由 bridge 代理。

**依據。** F-48、F-56、F-59/F-72（per-record token 的精神就是 per-child 授權）、C-24、B-10 R2。

**可修。** `doc_pointer = {id, version, sha256}`，unit 驗雜湊再套用；bridge 文件端點只給該 child 當前 desired 引用的文件；link 內容一律經 bridge 代理並 allowlist，螢幕 default deny 出站。代價：pointer 多 32 bytes、bridge 多一個 fetch-proxy（+0 種類）。

### security-08（重大）bridge 與 bridge 0 斷線時撤銷不立即：24 h cert、48 h 緩衝、文件快取都繼續服務被撤銷的 unit

**情境。** 形狀 (b)(c)，bridge↔bridge 0 斷線（§3.4、N-11 當常態）；D-01 被偷的螢幕、D-05 被拔的讀卡機。

**壞在哪一步。** 步驟 5：撤銷 = 拒絕續期 + 簽名 revoke 下發 + 清單鏡像到各 bridge；步驟 4：cert 24 h，剩餘 <50% 續期。bridge 連不上 bridge 0 時，revoke 與清單都到不了，unit 手上 cert 典型剩 12～24 h；bridge 依共同規則只驗 cert 鏈，於是繼續收它的 report 進 48 h 緩衝（恢復後進三年歷史）、繼續給它文件（配合 security-07 (ii) 是全部文件）、繼續推 desired。管理表 T2 要求「revocable with immediate effect」，P2 的 immediate 只在連線正常時成立。§4.3 把「cert 24 h」列為 window 是誠實的，但沒把它與撤銷延遲連起來。

**依據。** 管理表 T2「Revocation」列、N-11、P2 §4.3；對照 `nats.md` N14（NATS 撤銷同樣要 push 到每台 server）。

**可修。** cert 縮到 1～2 h（規模下流量可忽略，意見）；bridge 對撤銷清單設新鮮度門：超過 X 分鐘未更新即降級——report 進隔離緩衝、不給文件、不推新 desired，恢復後先對帳；bridge 0 以撤銷時間戳切除該 unit 的緩衝資料。N-11 與「撤銷立即」本質衝突，這是把衝突寫成設定值。

### security-09（重大）中繼 CA 與 bridge 0 簽章金鑰是一個 plain 金鑰檔：N-03、備份、形狀 (a) 同主機、無輪替設計

**情境。** 形狀 (a)（bridge 0 與 Odoo 同 hypervisor）、形狀 (c)（我們雲端每租戶一把）。

**壞在哪一步。** §3.3「私鑰只存在 bridge 0 的金鑰檔，不在 Postgres，所以 staging 還原帶不走發行能力（N-04 內建）」。(i) N-03 禁止 plain file，P2 沒說加密、passphrase 來自哪個 resolver、或 TPM/KMS。(ii) N-09 要備每個節點的狀態，P0 §1 說備份 = 複製檔案；ops 複製 bridge 0 目錄就帶走金鑰，N-04「內建」又變回 runbook。(iii) (a) 下 Odoo 的攻擊面（security-06）離那個檔只差一層 OS 權限，P2 沒寫獨立 OS user 或容器。(iv) 所有節點 pin bridge 0 公鑰驗簽（§3.5）；§7 只在代價欄寫「金鑰輪替流程」四字：靠舊鑰簽輪替訊息則舊鑰外洩後攻擊者也能輪替，靠 factory root 則 root 得上線。無輪替設計的簽章金鑰等於永久金鑰。

**依據。** N-03、N-04、N-09、02 §1「安全是自己的：錯誤無聲，一次就是整個 fleet」。

**可修。** 金鑰以 resolver passphrase 加密或進 TPM/雲端 KMS（(c) 用 KMS 幾乎免費，意見）；issuer 拆成 bridge 0 旁的獨立 OS user/process（+0 種類）；備份工件排除金鑰、還原時強制重產中繼 CA（這正是 N-04 要的 staging 中和）；節點信任「factory root 簽的 bridge 0 金鑰清單」而非單一公鑰，輪替 = 加一把、過渡、減一把。PKI 人週 4～5 加 1～2。

### security-10（次要）簽章與憑證全靠牆上時鐘，T2 的可信時間源沒寫；N-14 變安全問題

**情境。** 形狀 (a)(b)，像試點站點這類的站點（N-14 NTP 回零）；CM4 無 RTC（**未查證**）。

**壞在哪一步。** §3.5 重放窗口 60 s 依時間戳；cert 24 h 依有效期；§3.2 只為 T1 寫「NTP 只指向 bridge」。開機時鐘歸零的 unit：cert「尚未生效」導致 mTLS 失敗，連不上 parent 就拿不到時間，死鎖；或連上了但信封時間戳落在窗口外，report 全拒。反向：C-25 上知道 PSK 的人可回應無認證 NTP，把 unit 時鐘推到任意點——讓過期 cert 復活（搭 security-08）、讓重放窗口移到錄下的舊 frame。

**依據。** N-14、F-27、F-02；`nats.md` §4 第 11 點（同類疑慮）。

**可修。** 重放保護改 parent nonce challenge 或每連線單調計數；unit 以 parent 的簽名 time frame 校時後再驗有效期；T2 的 NTP 只指向 bridge 寫進 §3.2。代價：多一個 frame 型別。

### security-11（次要）「8883 = 來源可信」不成立：帳密認證的 T1 若不驗 server cert，在 C-25 下與 1883 等價

**情境。** 形狀 (a)(b)，D-02/D-03 的 MQTT T1 在共享 PSK Wi-Fi。

**壞在哪一步。** §3.2 第 3 層：「client cert 或帳密」；只有 1883 標 `source_authenticated=false`。封閉韌體 T1 多半只能設帳密且無法載自訂 CA（**未查證**，常識層級），連 8883 時不驗 bridge cert。知道 PSK 的人可冒充 bridge 的 IP 收下帳密，再向真 bridge 發布偽造讀值——P2 會標它 `source_authenticated=true`。P2 承認了 1883，但把邊界畫在 port，不是認證方式。

**依據。** F-18、F-31、T27、T28；`mqtt-brokers.md` 列 7（Mosquitto 的身分綁在 client cert CN，不綁 port）。

**可修，便宜。** 旗標三值 `cert`／`password`／`none`，只有 `cert` 算來源可信；帳密 T1 也逐台核准並在 Fleet 可見。

### security-12（次要）供應鏈時鐘算少了：HTTP server、TLS、X.509、SQLite 都是外部 library，而 bridge 0 在 (c) 直面 internet

**情境。** 形狀 (c)，bridge 0 經 TCP passthrough 直接暴露 :443。

**壞在哪一步。** §2 種類表把外部 library 時鐘算成 1（只有 MQTT ingress）。但 node 要做 HTTPS 串流、mTLS、X.509 簽發、應用層簽章、SQLite：Python 路線至少一個 HTTP server library、OpenSSL、一個 X.509/簽章 library；Rust 同理。每一個都是 M-06 的時鐘，而且是**安全**時鐘，CA 與驗簽跑在它們上面。(c) 下 bridge 0 的 pre-auth 面是 TLS 握手（退路下不要求 client cert）＋ JSON 信封解析＋序號查表，全在驗簽之前，這是自己的 parser 第一次直面 internet。P2 §8 第 1 點承認沒有免費對抗審查，但沒算進時鐘表與 N-10。

**依據。** M-06、N-10、P2 §2；對照 `mqtt-brokers.md` 列 2（P2 拿 Mosquitto 時鐘當理由，卻沒給自己的 TLS/X.509 library 同樣檢查）。

**可修。** 種類表單列安全 library 附維護者狀態（照 P2 對 MQTT library 的做法）；(c) 的 bridge 0 前放自營 TCP passthrough 與連線層限速；pre-auth 最小化（先查序號在冊再解析 body）。

### security-13（次要）consumer token 進 URL、consumer 撤銷未設計、MES 直連 PG 在形狀 (b) 是新防火牆規則

**情境。** D-06 web HMI（§6 第二選項「本地 SSE endpoint（token 保護）」）、§5 MES consumer 與 PG 唯讀 role。

**壞在哪一步。** 瀏覽器 `EventSource` 不能帶自訂 header，token 只能放 URL，N-03 明文禁止。§4.4 consumer「可沿樹 revoke」但 token 格式、有效期、scope 綁定、撤銷怎麼傳到每個 bridge（與 security-08 同一傳播問題）都沒寫。MES 以 PG role 連歷史庫：(b) 下是 MES VLAN → ERP VLAN 的新規則，正是 C-24 形狀；P2 對直寫後門寫了這點，對 MES 讀取沒寫。

**依據。** N-03、N-01、C-24。

**可修。** 短效單次 URL token（先以 header 換 ≤60 s token）或改 fetch streaming 帶 header；consumer token 併入 PKI 審查；MES 的 PG 存取寫進部署工件並列 N-18 測試。

## 3. 此點成立：P2 說對了什麼

1. **(c) 形狀把身分從 TLS 層上移到應用層簽章，正確且必要。** T1～T3、T5 確實推出 client cert 到不了 origin，P0「每一跳 mTLS」在這一跳不成立；`nats.md` §5 也判 JWT 簽章在應用層對 (c) 是優勢。security-01 批評的是退路觸發與機密性，不是方向。
2. **所有下行 frame 由 bridge 0 簽、T2 也驗，比 P0 嚴格且理由對。** 中間 bridge 被攻下不足以偽造 desired/SQ/revoke，在 security-03、06、07 的限定下仍成立。
3. **單一發行者在 bridge 0、ERP 是按鈕、中繼私鑰不進 Postgres、批次 revoke 二次確認**，正面回答 00 §9 與 02 §1；security-06、09 要求做完，不是推翻。
4. **MQTT ingress 的資料層規則是對 hostile T1 正確的最小集**：只收四種封包、拒 SUBSCRIBE、忽略 retained、未宣告 topic 拒收並計數、per-client 限速，直接堵住 `nats.md` N17 與 `mqtt-semantics.md` MQ9 那類 retained/subscribe 漏洞類別。security-02 批評的是放在哪個 process。
5. **Wi-Fi 加密視為零、N-02 完全靠 TLS（T27）；isolation 是 per-BSS（T28）**，是對 C-25 的正確結論，P0 沒寫。
6. **plaintext 1883 的誠實說明與逐台旗標**是對的做法，security-11 只要求延伸到帳密。
7. **B-11 的修法成立**：續期與 revoke 都在 report 回應裡，不解析就拿不到新 cert。

## 4. 如果我是作者，最怕評審問什麼

「你說偽造意圖需要 bridge 0 的私鑰——可是 bridge 0 會替 ERP queue 裡的任何一行簽名，而 Odoo 在 (c) 形狀對 internet 開放；那這個簽章到底防了誰，F-48『誰可以命令哪個節點』寫在你設計的哪一行？」

## 附：finding 總表

| 編號 | 嚴重度 | 一句話 | 形狀 / D-xx | 可修 |
|---|---|---|---|---|
| security-01 | 重大 | (c) 的 mTLS 退路是可誘發的降級，退路下信任哪張 CA 未寫 | (c) / D-01 | 可修：退路改部署設定並 pin 我們的 root；bypass 升為硬前提 |
| security-02 | 重大 | MQTT ingress 解析器在持有樹憑證的 node process 裡 | 全部 / D-02、D-03 | 可修：第四種 localhost backend process |
| security-03 | 重大 | 上行 report/complete 無端到端簽章，bridge 是可信 MITM | (b)(c) / D-05、D-01、D-03 | 可修：信封對稱化；寫明 CSR |
| security-04 | 重大 | 任何 factory 之下的中繼都能收養新 unit；mDNS 無認證 | (a)(b) / D-01 | 可修：claim code 或序號預綁租戶／環境 |
| security-05 | 重大 | T2 bootstrap 金鑰可複製、image 可 clone、adopt 後仍有效 | 全部 / D-01、D-02、D-04 | 可修：裝置產鑰 + CSR；已 adopt 序號拒收 bootstrap |
| security-06 | 重大 | bridge 0 是簽名機；能寫 ERP queue 就能 deface 全部螢幕 | (c) / D-01 | 部分可修：bridge 0 變政策點；大範圍 publish 帶外確認 |
| security-07 | 重大 | doc_pointer 無雜湊、快取無 per-child 授權、link 出口未定 | 全部 / D-01 | 可修：pointer 帶 sha256；per-child 授權；link 經代理 allowlist |
| security-08 | 重大 | 斷線時撤銷不立即：24 h cert、48 h 緩衝 | (b)(c) / D-01、D-05 | 可修：短 cert + 清單新鮮度門 + 降級模式 |
| security-09 | 重大 | 中繼 CA 與簽章金鑰是 plain 檔；備份帶走；無輪替 | (a)(c) | 可修：加密/KMS/TPM；issuer 獨立 user；金鑰清單式輪替 |
| security-10 | 次要 | 重放窗口與 cert 有效期無可信時間源 | (a)(b) / D-01 | 可修：nonce 取代時間戳；parent 校時 |
| security-11 | 次要 | 8883+帳密在 C-25 下與 1883 等價，旗標語意錯 | (a)(b) / D-02、D-03 | 可修：旗標三值 |
| security-12 | 次要 | HTTP/TLS/X.509 外部時鐘沒算；bridge 0 在 (c) 直面 internet | (c) | 可修：補時鐘表；pre-auth 最小化 |
| security-13 | 次要 | SSE token 進 URL 違 N-03；consumer 撤銷未設計；MES 直連 PG | (b) / D-06 | 可修：短效 token 或 header 串流；寫進部署工件 |
