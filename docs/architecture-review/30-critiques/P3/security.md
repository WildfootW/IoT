# P3（NATS 葉節點）安全面批評

> 波次 B 批評者，lens = 安全。目標：`20-proposals/P3-nats-leaf.md`。日期 2026-10-10。事實引用 `10-facts/` 的檔名與列號；凡本文自行提出而 10-facts 沒有的第三方事實主張，一律標「未查證」。需求用 ID。

## 0. 結論先講

**致命 1 條、重大 7 條、次要 3 條。** 一句總評：P3 把「樹、方向、持久化、扇出」交給 nats-server 的推理成立，簽章放 payload、ingress 另起 process、NKey 在 (c) 形狀存活的三個判斷也對；但它把 P0 §4 的「出廠 bootstrap 憑證」換成「seed 在裝置上產生、公鑰印 QR」之後，**從頭到尾沒有說 unit 用什麼認出真的 bridge 與真的 root**。在 C-25 的共享 PSK Wi-Fi 上這是 D-01 公開螢幕的 defacement 入口（security-01）。七條重大問題有共同形狀：§3.3 的身分流程只寫了 unit 這一層；bridge 的憑證生命週期、unit 在 JetStream 上真正需要的權限集、ingress 的磁碟、多租戶 hub 的爆炸半徑、升級通道，都還沒設計。全部可修，但修完之後「薄 agent」會變厚，「不多一種東西」會變成「多很多個 process 與 ACL 規則要對」。

## 1. 批評清單

### security-01（致命）unit 沒有信任錨：fake parent 在共享 PSK Wi-Fi 上直接拿走螢幕

- **情境**：形狀 (a)、(b)，D-01 公開螢幕；C-25 現場（共享 PSK、無 client isolation、T1 與租戶裝置同 VLAN）。
- **壞在哪一步**：P3 §3.3「身分載體」只說 unit 持有自己的 NKey、公鑰印成 QR（L140）；第 1 步 unit「以 NKey 連上 bridge 的 4222」。全文沒有一句話說 unit **用什麼驗 bridge 的 server cert**、**用什麼驗 desired 上的 root 簽章**（§4.1 說 unit 驗簽，L176，但沒說 root 公鑰從哪來）。F-23 要求裝置「by name or discovery」找 south。在 C-25 的 Wi-Fi 上，知道 PSK 的任何一台裝置（含 hostile T1）可以解其他 client 的流量（transport-through-networks.md T27，L86）、回應 mDNS/DNS、搶 ARP。unit 若沒有預置的 CA 或 root 公鑰，第一次開機與每次重連都只能 TOFU；TOFU 到假 bridge 之後，它給什麼 desired 螢幕就顯示什麼。F-48 原文：「forged intents are a defacement risk once screens are public」。
- **為什麼致命**：P0 §4 有 factory CA 簽的 bootstrap 憑證加每環境中繼 CA，unit 至少知道「誰是我的根」；P3 §1 說管理模型「全部保留」，卻換掉這一塊而沒有補上對應物。沒有信任錨，§3.2 的四層圍堵、§3.3 的三步流程、§4.1 的簽章全建在空中。
- **依據**：00 F-23、F-35（「An enrolment root of trust above any single customer site」，狀態 open，P3 沒有回答）、F-48、N-02、N-04；T27、T28（client isolation 不擋跨 VLAN，且 per-BSS）；P0 §4。
- **可修**：在 F-36 的 provisioning station 把「本環境 CA 公鑰 + root 簽章公鑰」寫進 unit，或設一個 我們自己的全域根（F-35）簽每環境的 CA 與 root key、unit 只信全域根加 environment id。代價：(1) 把 P3 丟掉的 factory root of trust 請回來，製造多一步；(2) N-04 要處理：全域根下的 staging 中繼對 prod unit 必須不可信，environment id 要進簽章內容；(3) (c) 形狀多客戶時，unit 出廠要知道屬於哪個環境，或 adopt 時有一條 QR 驗過的帶外通道來 pin。這些是 P0 本來就要做的，P3 沒有省掉。

### security-02（重大）寫出來的 permission 跑不動 JetStream；「child 只看得到 parent」沒有被證明

- **情境**：三種形狀都中，影響 F-18（no lateral reach）、F-59（per-screen token）；最痛在 (b) 同一個 FLEET account 下幾十片螢幕。
- **壞在哪一步**：P3 §3.3 第 2 步給 unit 的權限是 publish `fleet.<pubkey>.>`、subscribe `fleet.<pubkey>.desired.>` 與 `sq.<pubkey>.>`（L145）。但 §4.1 要 unit 做的事是 KV watch `DESIRED_*`、對 `SQ_*` 建 pull consumer、JetStream publish 到 `cq.<unit>.<fn>.<key>` 並等 ack、寫 `meas.<unit>.<fn>`、從 Object Store `DOCS` 取文件（L157–L164）。三個問題：(1) `cq.` 與 `meas.` 不在 `fleet.<pubkey>.>` 底下，照字面 unit 不能 publish 結果與量測，這張權限表是草稿；(2) JetStream client 要透過內部 API subject 工作（nats.md 自己引了兩個例子：N10「MQTT 使用者需有 `$MQTT.sub.>` 的 subscribe 權限才能建 QoS1 訂閱」L30；N9「ack subject 預設變更會打到自訂 ACL」L29），也要收 request/reply 的 inbox。JS API subject 的完整清單與能否按 stream 細切，10-facts 未列，**本文未查證**，P3 也沒列，而這正是 F-18 成不成立的地方；(3) 若為了「跑得動」給 `$JS.API.>` 與共用 inbox prefix，同 account 的任何一片螢幕可以對 `CQ_<bridge>`、`MEAS_<bridge>`、`DOCS` 建 consumer，讀其他螢幕的 job 結果、所有量測，以及 playlist 裡的 MES live board token URL（F-63、F-59）。bridge 層同理：N3 說 leaf 使用者可 publish 的 subject 會 export 到 hub（L23）；hub 端每台 bridge 的使用者權限 P3 沒寫，同一客戶 account 內兩台 bridge 能不能互寫、能不能 mirror 對方的 `SQ_*`，不知道。
- **依據**：F-18、F-59、F-63、N-05；nats.md N3、N6、N9、N10。
- **可修**：(a) unit 不碰 JetStream API，所有 KV/stream 操作由 `node[bridge]` 代理，unit 只在 `fleet.<pubkey>.>` 下用 core NATS request/reply；代價是 bridge agent 變厚、「薄 agent、零件現成」打折。(b) 按 subject 細切 JS API 權限並給每個使用者獨立 inbox prefix；代價是一套沒人替我們審過的 ACL 產生器，nats-server 每改一次內部 subject（N9 就是一次）都要回歸。這該是 PoC 第一週的事，P3 §9 的 PoC 清單裡沒有它。

### security-03（重大）(c) 形狀：為了穿過 TLS 檢查 proxy，bridge 必須信客戶的 CA；hub 的真實性從此由 proxy 決定，而 DOCS 沒有簽章

- **情境**：形狀 (c)，D-01；客戶有 TLS 檢查 proxy 且不做 bypass。
- **壞在哪一步**：P3 §3.1(c) 第 3 點正確地說身分不能只靠 client cert，由 NKey 的 nonce 簽章補上（L119）。但 NKey 是 client 向 server 證明身分，**不是 server 向 client**。要讓 leaf 的 `wss://` 穿過攔截 proxy，bridge 的 TLS 驗證必須接受 proxy 的 CA（T1～T3 皆為摘要；T5 原文說明信任轉移到 proxy），P3 沒寫這一步，但它是必然的。接受之後，持有該 CA 的任何一方（客戶 IT、或打下 proxy 的人）可以對 bridge 扮演 hub。P3 的防線是 desired 與 SQ 有 root 簽章（§4.1）。這條防線有一個洞：`DOCS` Object Store（playlist、assets）**沒有簽章、沒有 hash**（L164），desired 只帶 `playlist_doc_ref`（L198）。假 hub 不必偽造 desired，只要給一份不同內容的 DOCS 物件，螢幕就顯示它。§7 N-02 列只承認「hop 機密性讓給 proxy」，沒有承認 hub 真實性也讓出去了。
- **依據**：F-48、F-56、N-02；transport-through-networks.md T1～T3（L34–L36）、T5（L38）、T6（L39）、§3.1（L98–L100）。
- **可修**：`playlist_doc_ref` 內含內容 hash，unit 取回後驗；所有下行物件（DOCS、`lobby.*.adopted`、會影響裝置行為的 TOPOLOGY 部分）統一走簽章信封；把 hub 當不可信傳輸設計。代價小，但要進協定規格，而且「NATS 給安全邊界」的敘事要改成「NATS 只給管線，邊界全在我們的簽章」。

### security-04（重大）bridge 的憑證沒有生命週期：不輪替、不撤銷、staging 複製品可以連上 prod hub

- **情境**：形狀 (b)、(c)；N-04 的「staging restored from prod」；M-04 的 bridge 是最靠近 hostile T1 的那台主機，也是最該能撤銷的。
- **壞在哪一步**：P3 §3.3 的 bootstrap / adopt / revoke 三步全部只對 unit（NKey + callout）。bridge 對上的身分是「每環境一張 CA 簽的 mTLS cert」（L138）或 NKey（§3.1(c)）。對這張憑證：沒有 expiry、沒有續期、沒有撤銷動作。nats-server 是否支援 CRL/OCSP，10-facts 未列，**本文未查證**；N13 只說 `verify_and_map` 取第一個找到的使用者、不能限制（nats.md L33），N17 列過 mTLS DN 對應繞過（L37）。P3 §8 第 6 點承認「若 callout 不適用 leaf 連線，bridge 間改用 `verify_and_map`」，卻沒說那樣怎麼撤銷。N-04 段落（L149）只處理 REGISTRY 鏡像的簽章方向：prod 的 REGISTRY 在 staging 無效，staging bridge 不會放行 prod unit。反方向沒處理：從 prod 複製出來的 staging bridge 仍持有 prod 的 leaf cert/NKey 與 `remotes` URL，開機就連上 prod hub 成為合法 bridge，可以把假的 ACTUAL/CQ/MEAS 寫進 prod、拉 prod 的 SQ/DESIRED 鏡像。N-04 原文：「an environment copy carries no valid trust toward real nodes」。
- **依據**：N-04、M-04、F-24 與 tier 表 T2 列（「individually revocable with immediate effect, rotatable」）、00 §9「staging neutralisation as a built-in」；nats.md N13、N17、N24。
- **可修**：bridge 憑證也短效並在 hub 端用同一套 callout 核發（前提是 callout 適用 leafnode 連線，P3 自己標未查證）；hub 端每台 bridge 一個獨立使用者，撤銷 = reload + 踢連線（API 同樣未查證）；account 名稱或 leaf URL 帶 environment id，staging 的 remotes 永遠指不到 prod。代價：把 P0 §4 那段為 bridge 再寫一次，而且兩個關鍵能力都壓在 P3 承認未查證的功能上。

### security-05（重大）解析 hostile 位元組的 process 同時是全站的授權發行者

- **情境**：形狀 (b)、(c) 有 T1 MQTT 或 D-06 Sparkplug 的站點。
- **壞在哪一步**：P3 §2 把 `node[bridge]` 定義為「auth callout 處理器、T1 驗證器、registry 鏡像套用、文件快取」同一個 process（L29）。§3.2 第 4 層說驗證器對每筆 T1 訊息做 schema 檢查後以 bridge 身分重發（L130）；§6 D-06 說驗證器要「理解 Sparkplug 的 BIRTH/DATA/Rebirth 語意」（L208），也就是解 protobuf。callout 的回應必須由一把 server 信任的 key 簽（細節 P3 標未查證，但「server 信任某個 key 簽的授權」是 callout 存在的前提）。所以這個 process 同時持有：callout 簽章 key、代所有 T1 的 `fleet.<bridge>.fn.>` publish 權、REGISTRY 鏡像的套用權。一個 payload parser 的 bug（我們自己寫的、對著 hostile T1 的輸入）就把站內所有 unit 的授權發行權交出去。P0 的 node 也解 Modbus，但 P0 的憑證發行在 bridge 0，不在這台。這是 F-07 的安全版：解外部輸入的程式不應該是授權的 oracle。
- **依據**：F-07、F-18、M-04、N-05；nats.md §3.2 意見（L62）只要求「驗證程式把通過 schema 的資料轉到上行 account」，沒要求它兼任 callout。
- **可修**：拆兩個 process、兩個 OS user：validator 只持 `T1IN` 的 subscribe 與 `fleet.<bridge>.fn.>` 的 publish；callout handler 另持簽章 key。代價：bridge 上多一個 process，B-13 類的 systemd 順序問題（P3 §8 第 10 點）再多一個；不多一種東西，多一個要顧的東西。

### security-06（重大）ingress 隔離只隔了 subject，沒有隔磁碟：hostile T1 可以把 bridge 的 store_dir 填滿

- **情境**：形狀 (b)、(c)，有 T1 MQTT；bridge 跑在 CM4 類 eMMC 主機。
- **壞在哪一步**：N10：MQTT session「一律持久化（即使 clean session）」，retained 落在 JetStream（nats.md L30）。P3 §3.2 給 T1 的限制是 publish-only、`max_payload` 64 KB、`allowed_connection_types: MQTT`（L129）。沒有限制的：同一組 T1 帳密可以用不同 client id 反覆 CONNECT，每個都是一個持久 session；可以對 `t1.<id>.` 底下無限多個 topic 各放一則 retained。兩者都寫進 ingress 的 `store_dir`，而 §3.2 第 2 層只說「兩個 nats-server process、兩個 `store_dir`」（L128），沒說分檔案系統。磁碟滿時，leaf 的 `SQ_*` 鏡像、`MEAS_*` 7 天緩衝（N-11 的依靠）、`CQ_*` 一起停；N9 說 v2.14 起 filestore I/O error 會凍結 stream（L29）。這是 hostile T1 用合法協定對整個 bridge 的 DoS。N17 的 MQTT partial CONNECT 耗盡 pre-auth 記憶體（High，已修）說明這個 listener 面對惡意 client 的歷史。
- **依據**：M-04、F-18、N-11、N-07；nats.md N8（account 層可設 `max_mem`/`max_file`/`max_streams`，L28）、N9、N10、N17。
- **可修**：`T1IN` account 設 `max_file`、`max_connections`，ingress `store_dir` 放獨立分割區或 quota，監控磁碟。代價小，但 P3 §8 第 2 點的「三個要明寫的預設值」會變成七、八個，而 account 層連線數上限的細節 nats.md 自己說「未逐項核對」（L107）。

### security-07（重大）(c) 形狀的 hub 是多客戶共用的一個 process，而每個客戶的 bridge 都活在 hostile 旁邊

- **情境**：形狀 (c)，兩個以上客戶；F-40。
- **壞在哪一步**：P3 §3.1(c)「每客戶一個 account」（L107、L121），account 的隔離是 nats-server 內部的 namespace（N5）。每台連進來的 leaf 是一台在客戶站點、與 hostile T1 共享主機的 bridge（security-04、05、06 的那台）。N17 列的 leafnode 面 advisory：pre-auth leafnode panic（High）、leafnode double INFO pre-auth crash（High）、MQTT SUBSCRIBE 注入「經 leaf/route 轉發、可能跨 account」（High、無 workaround）。P3 §3.2 的 ingress 隔離解的是**站內** MQTT→leaf 那條路；hub 上的 leaf listener 面對的是 N 個客戶的 N 台 bridge，一台被打下就是對所有客戶的 DoS，碰到跨 account 類漏洞就是跨客戶讀寫。F-40：「a shared root requires per-caller tenant pinning, authentication, and no subscription read by non-admins」，P3 用 account 回答了前兩項，爆炸半徑沒有回答。
- **依據**：F-40、F-41、M-04；nats.md N5、N17、N24（v2.15.0 修了 cluster 節點間的 leafnode isolation，L44）。
- **可修**：每客戶一個 hub process（或容器/VM），L4 LB 以 SNI 或 port 分流。代價：hub 端從一個 nats-server 變 N 個，升級、備份、監控乘 N；「不多一種東西」仍成立，但 §9 的 (c) 形狀 2～3 人週估得太少。

### security-08（重大）「advisory 發布後 N 天內升級」沒有通道：fleet 裡每台 bridge 都是 server，卻沒有人說 binary 怎麼到站、誰驗簽

- **情境**：三種形狀；最嚴重在 (c)（站點只有 outbound，我們進不去）與 (b)（bridge 在客戶 OT 網段）。
- **壞在哪一步**：P3 §7 M-06 列與 §8 第 1 點承認升級被動且必須快，並承認 CVE-2026-58213 類「無 workaround」項目讓 fleet 在那 N 天內暴露（L217、L230）。但全文沒有：nats-server binary 的分發路徑、release 簽章或 checksum 的驗證（N15 說 release 附 SBOM，L35；是否附簽章，**未查證**）、版本 pin 與 fleet 內版本偏差、只支援最近兩條 series（N21）下落後站點的處置。N24 給了一個具體信號：**v2.15.1（2026-10-09，提案前一天）修了 auth callout 的 `auth_users` bypass**（L44）；P3 選的身分閘門正是 callout。沒有通道的 N 天不是 N 天，是「下次有人到站」。client library 同理：nats-py 正拆包、新套件要 Python 3.13+（N22），CM4 的 Python 若卡住就卡在舊線。
- **依據**：N-10、M-06、N-01；nats.md N15、N17、N20、N21、N22、N24。
- **可修**：把 nats-server 當成 node release bundle 的一部分，用樹本身（簽章過的 Object Store）分發、bridge agent 驗簽後替換重啟；版本 pin 進 nats.conf 產生器並由 e2e 斷言。代價：一條用自己的傳輸升級自己傳輸的路徑，要處理「升級到一半 leaf 斷了怎麼回滾」；P0 也要做，但 P0 升的是自己的 code，P3 多了一個不由我們排程的外部時鐘（N20）。

### security-09（次要）簽章擋得住偽造，擋不住重放：舊的合法 desired 可以回來

- **情境**：形狀 (a)、(b)，D-01；store_dir 從舊備份還原、或有人能寫 bridge 的 `store_dir`。
- **壞在哪一步**：§4.1 desired 值為 `{version, payload, issued_at, issuer, sig}`，done 的定義是 `version_applied == version`（L166–L168）。沒有寫 unit 必須**拒絕 version 小於已套用值**的 desired，也沒有寫 `issued_at` 的新鮮度視窗。KV `DESIRED_*` 是 history 1 的鏡像，備份還原（P3 §9 說 `store_dir` 用 stream backup/restore 或直接複製目錄，L271）就是把一批簽章仍有效的舊 desired 推回去；F-54 又要求 unit 對重複 desired 冪等套用。結果是全站螢幕退回舊 playlist（例如已下架的促銷），所有簽章都驗得過。SQ 有 deadline 所以 job 不受影響；MQTT retained 舊值那一面 P3 §5 已提到要看 `device_ts`（L194），這裡是 desired 那一面沒有對應規則。Azure twin 的做法是裝置忽略 `$version` 小於等於已知版本的通知（mqtt-semantics.md MQ14，L53）。
- **依據**：F-47、F-48、F-54、N-09；MQ14。
- **可修**：unit 在 SQLite 記 `version_applied`，拒絕非遞增 desired；`issued_at` 超過設計視窗的 desired 標 stale 不套用並回報。代價幾乎為零，但要寫進協定規格與 e2e。

### security-10（次要）B-10 與 N-03 的局部重現：monitoring port、設定檔裡的秘密、Odoo 憑證

- **情境**：形狀 (b) 的 bridge 主機（雙腳，一腳在 T1 VLAN）；形狀 (a) 的單一主機。
- **壞在哪一步**：(1) N-07 要求 health check 真的能用，nats-server 的 health check 在 HTTP monitoring port 上，而 N17 有一則 High 是「credentials 經 argv 暴露於 monitoring」（nats.md L37）。P3 的 compose/firewall 工件（§2 L36）沒有說 monitoring port 綁哪個介面；綁到 0.0.0.0 就是 B-10 的「bind all interfaces with no auth」在新位置重現，hostile T1 在 VLAN 30 可以讀 connz/subsz 看到整站拓樸。(2) N-03「Secrets never in plain config files」：leaf remote 的 NKey seed 或 creds 檔、callout 簽章 key、T1 的 MQTT 帳密都要進 nats.conf 或它指向的檔案；P3 沒有提 credential resolver，也沒有說 T1 密碼以 bcrypt 存。(3) `node[root]` 以 JSON-RPC 連 Odoo（L66）需要一個 Odoo 使用者的 API key，它的權限範圍與存放處沒有寫；它是「能寫 ERP 業務 desired」的鑰匙。
- **依據**：B-10、N-03、N-07、N-01；nats.md N17。
- **可修**：monitoring 只綁 127.0.0.1 或 unix socket；nats.conf 由產生器從 resolver 取值寫入受限權限檔，密碼用 bcrypt；Odoo API key 專用、最小權限、可輪替。代價小，但都要寫進 N-01 的部署工件並由 e2e 斷言，P3 §8 第 2 點的斷言清單要加長。

### security-11（次要）D-05 的 T3 只有 announce 被硬體 key 簽，門禁事件本身還是軟體 NKey 在扛

- **情境**：形狀 (b)、(c)，D-05 門禁（錨點 8 的已知下一步）。
- **壞在哪一步**：P3 §6 D-05：「硬體 key 簽 announce；NKey 只是連線身分」、刷卡/考勤事件放 `EVT_<bridge>`（L206）。tier 表對 T3 的 liveness 要求是「heartbeat, plus attestation」，Identity 是「hardware-bound non-clonable key」。P3 的 EVT 事件只靠 NKey session 歸因，NKey seed 在 eMMC 上是可複製的軟體憑證（P3 對 T2 也承認是軟體 key）。把 CM4 的 seed 複製出去就能偽造考勤記錄，硬體 key 只在 announce 用過一次。D-05 的賣點是「security spec」，客戶 IT 會問的正是這條。
- **依據**：D-05、tier 表 T3 列、N-05（每筆寫入可歸因到身分）。
- **可修**：EVT payload 與 T3 心跳由硬體 key 簽章，`node[bridge]` 驗後才轉發；代價是 agent 多一條簽章路徑與 bridge 多一個驗證器，D-05 動工時才需要付。

## 2. 此點成立

1. **ingress 另起 process、無 leaf、無 route**（§3.2 第 2 層）：對 CVE-2026-58213「經 leaf/route 轉發」的路徑，拿掉轉發就拿掉那條路。security-05、06 是說它隔得不夠多，不是隔錯。
2. **NKey 的 nonce 簽章讓身分在 (c) 形狀活下來**（§3.1(c) 第 3 點）：T1～T3 說 TLS 檢查 proxy 與 client cert 互斥，應用層身分是唯一退路。security-03 補的是它只顧了一個方向。
3. **desired 與 job 由 root 簽章、unit 驗簽，defacement 防線不依賴 NATS**（§4.1）：放對地方。security-01、03、09 是在這條防線上找漏縫，不是否定它。
4. **拒絕 operator/JWT 模式**（§3.3）：N14 的 bearer JWT 可重放、撤銷要推 account JWT 到每台 server，理由站得住。
5. **`store_dir`/`sync_interval`/`max_file_store` 不留預設並由 e2e 斷言**（§8 第 2 點）：對 N8 與 C-14 的正確反應。
6. **version 放 payload、不是 KV revision**（§4.1）：N-05 與 MQ14/MQ15 都支持。
7. **把未查證的東西標出來**：誠實且全列入 PoC。但這些未查證項不是邊角，security-02、04 的可修性整個壓在它們上面。

## 3. 如果我是作者，最怕評審問的一句話

「一片新螢幕第一次開機、連上 C-25 那個共享 PSK 的 Wi-Fi，它用什麼分辨真的 bridge 和同一個 Wi-Fi 上任何一台自稱 bridge 的東西？」
