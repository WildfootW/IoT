# P1（MQTT 原生）安全批評

> lens = 安全。波次 B 批評者。日期：2026-10-10。輸入：`03-brief.md`、`00-requirements.md`、`01-proposal-pcie-tree.md`（P0）、`02-tradeoffs.md`、`20-proposals/P1-mqtt-native.md`、`10-facts/{transport-through-networks,mqtt-brokers,mqtt-semantics,nats}.md`。事實引用寫「`檔名` 列號」；我自己對 Mosquitto 行為的推斷若沒有一手來源，標「未查證」。「意見」是我的判斷。

## 結論先講

致命 0 條、重大 8 條、次要 4 條。

一句總評：P1 把「下行要簽名、retained 只是快取、T1 的 `raw/#` 永不出 bridge」這三件事想對了，所以沒有一條批評能讓它在某個錨點情境下整個不成立；但它把身分與圍堵的實作細節交給 dynsec 產生器和一個沒寫完的簽名信封，而這兩樣東西正是 F-48（defacement）與 N-04（環境信任）的最後防線。八條重大裡有六條是「P1 沒寫、而寫錯就是洞」的規格缺口（信封綁定、bootstrap 信任錨、root 側 ACL、文件 hash、WSS 身分、金鑰存放），兩條是設計選擇本身的問題（30 天憑證對上即時撤銷、adopt 時 CSR 可替換）。全部可修，合計代價是一份更長的協定規格與一次更貴的外部審查，不是換架構。

## 0. 我攻擊的面

依 `03-brief.md` §8：hostile T1 圍堵、bootstrap / adopt / revoke / 輪替、誰終結 TLS 與唯一發行者、(c) 形狀身分、公開螢幕 defacement、N-02～N-04、B-10、retained 偽造、供應鏈。P1 §3.3、§3.4、§8 已自己承認的點（parser 與 bridge 憑證同 process 的 DoS、`check_retain_source` 陷阱、ACL 寫錯等於 C-09、鬼 topic、bus factor）只在「處理不夠」時重提。

## 1. Findings

| 編號 | 嚴重度 | 一句話 | 形狀 / D-xx | 可修 |
|---|---|---|---|---|
| security-01 | 重大 | 簽名信封沒綁收件者，合法簽名可跨 unit 重放 | (b)(c) / D-01、D-04 | 可修 |
| security-02 | 重大 | bootstrap 的信任錨是 TOFU，fresh unit 會被任何環境收養 | (b)(c) / D-01 安裝 | 可修 |
| security-03 | 重大 | bootstrap 憑證可複製，adopt 時 CSR 可被替換 | 全部 / 所有 T2 | 可修 |
| security-04 | 重大 | 「child 只看得到 parent」只寫在 child 自己的設定檔 | (b)(c) / F-18 | 可修 |
| security-05 | 重大 | intent 簽了、content 沒簽：bridge 主機被攻陷即 defacement | (b)(c) / D-01 | 可修 |
| security-06 | 重大 | (c) WSS trunk：node 得信任客戶 CA，上行身分是 proxy 可見的 bearer | (c) / F-41 | 可修 |
| security-07 | 重大 | revoke 只在 root↔bridge 連著時即時；離線 unit 讀不到正向撤銷 | (b)(c) / D-01、D-06 | 可修 |
| security-08 | 重大 | 中繼 CA 私鑰與 root 簽名鍵的存放與輪替沒有設計 | 全部 / N-03、N-04 | 可修 |
| security-09 | 次要 | T1 parser 與 bridge 憑證同 process：承認了，但修法不該可選 | (b) / D-02、D-06 | 可修 |
| security-10 | 次要 | Control-Semantic 從 Sparkplug 側門滲漏 | D-06 | 可修 |
| security-11 | 次要 | N-03 三個小洞：`remote_password`、token 進 retained、loopback 認證 | (a)(c) / D-01 | 可修 |
| security-12 | 次要 | 供應鏈：unit 側 client 兩年半無版，broker 側緩解與前提矛盾 | 全部 | 部分可修 |

### security-01 簽名信封沒綁收件者：合法簽名可跨 unit 重放

- 嚴重度：重大
- 情境：(b)(c)；D-01 公開螢幕、D-04 LED job。攻擊者是被攻陷的 bridge 主機（P1 §3.3 自認的攻擊面）或 (c) 形狀客戶的 TLS 檢查 proxy——它就是在線 MITM，P1 §3.4 已把「被攻陷的中間 broker」放進威脅模型。
- 壞在哪一步：§4.1 desired 信封 `{"v","issued","body","sig"}`、§4.2 sq 信封「帶 deadline 與簽名」，兩者都沒有 `env`、`path`、`function`、`serial`。中間人把 root 為螢幕 A 簽的 desired（playlist X，v=57）publish 到螢幕 B 的 `desired` topic；B 的 `applied_v` 若小於 57 就 apply（§4.1「較新才 apply」）。B 顯示 A 的內容，簽名驗證通過：F-48 的 defacement。sq 同理：為 unit A 簽的 job 重放到 B，B 的 SQLite 沒見過這個 `job_key`，照做。§3.4「被攻陷的中間 broker 可以丟訊息、不能偽造」只對一半：不能偽造，但能選擇、重放、改址。
- 依據：F-48；P1 §3.4、§4.1、§4.2；`mqtt-semantics.md` §3.1 推論（retained 可被任何有 publish 權限者覆寫）、§5 F-48 列（hop 間 parent 驗證要自己寫）；`transport-through-networks.md` T5。
- 可修：可修。信封加 topic 全名（含 `env/path/function`）與目標 serial，加 `issued` 新鮮度窗口；unit 驗簽後比對「我從哪個 topic 收到它」與信封內容一致、serial 與自己憑證 CN 一致。代價：幾十行與兩條 conformance test；re-plug 改 path 時 root 要重簽該 unit 全部 desired/sq（P1 §8 #7 本來就要清鬼 topic，順便做）。

### security-02 bootstrap 的信任錨是 TOFU：fresh unit 會被任何一個環境收養

- 嚴重度：重大
- 情境：(b)(c) 在 C-25 現場安裝新螢幕（D-01）；N-04。
- 壞在哪一步：§3.4 第 2 步，unit 以 mDNS/DNS 找 bridge、以 bootstrap 憑證連 8883。unit 用什麼驗 bridge 的 server cert？P1 沒寫，兩個分支都壞。(i) 若 env「中繼」CA 鏈到 factory root（「中繼」一詞與「所有環境的 broker 都信任 factory CA」暗示如此），unit 只能 pin factory root，於是 staging、另一個客戶的環境、任何拿到某 env 所簽 server cert 的人，都能在 C-25 的共享 Wi-Fi 上回應 mDNS、接受 announce、簽 adopt；第 3 步 unit「驗簽」用的 root 公鑰是「adopt 時拿到」的，由同一個對手給。螢幕被收進攻擊者的樹，之後顯示什麼由他決定。這正是 N-04「prod never trusts non-prod」禁止的事：fresh unit 對 staging 的信任與對 prod 一樣多。(ii) 若 env CA 是獨立根，unit 出廠時認不得未來客戶的 env CA，第 2 步連不上；除非不驗 server cert，那就是 T27/T28 的現場任何人都能當 bridge。
- 依據：N-04、F-23、F-35、F-36、C-25；P1 §3.4 步 1～3；`transport-through-networks.md` T27、T28、§3.2 第 5 條。
- 可修：可修，但要動 F-36 的流程：安裝時由操作員把「本環境的信任錨」注入 unit（掃 QR 取 env 公鑰、USB、或安裝 app），或 factory 對每台 unit 簽「env binding」；adopt 簽名改用安裝時注入的錨驗證，不用 adopt 自帶的公鑰。代價：F-36 多一個步驤。P0 §4 有同一個坑，但 P0 沒聲稱 N-04 已成立；P1 §3.4 聲稱了。

### security-03 bootstrap 憑證可複製，announce 以 serial 為鍵最後寫入者贏：adopt 時 CSR 替換

- 嚴重度：重大
- 情境：(a)(b)(c)；所有 T2。
- 壞在哪一步：T2 的 bootstrap 金鑰是 SD 卡上的軟體金鑰（§4.2 管理表 T2「per-unit software credential」），複製一片卡就有兩個 `boot:<serial>`。§3.4 第 2 步 announce 不是 retained、內含 CSR，root adapter「寫入 SQLite」；第 3 步 Manage 簽「該 serial 的 CSR」。攻擊者在操作員按 Manage 前，用複製的 bootstrap 憑證送一則帶自己 CSR 的 announce，最後寫入者贏；操作員在 Fleet 看到的仍是「present, unadopted，serial X」，按下去就把 `unit:<serial>` 的營運憑證簽給了攻擊者的金鑰，真機永遠 unadopted。另外 P1 沒說 bootstrap 憑證在 adopt 後失效或可撤銷，而它被所有環境、所有客戶的 bridge 信任；factory CA 離線（F-35）表示 CRL 分發也沒有路。
- 依據：F-35、F-36；§4.2 管理表 T3 列「bootstrap credential invalid after adoption」；P1 §3.4 步 2、3。
- 可修：可修。(1) root 對同一 serial 收到不同公鑰的 announce 時標紅、不自動覆寫；(2) F-36 的 QR 印公鑰指紋，Manage 畫面顯示待簽 CSR 的指紋供核對；(3) adopt 後 root 在該環境 dynsec 把 `boot:<serial>` 設 disabled。代價：操作員多核對一串字。跨環境的 bootstrap 失效仍做不到，這是 T2 軟體金鑰的天花板，應寫進 §8 而非略過。

### security-04 「child 只看得到 parent」只在 child 自己的設定檔裡成立

- 嚴重度：重大
- 情境：(b)(c)；多個 bridge 共一個 root（F-16 可堆疊）；F-18。
- 壞在哪一步：§3.1「每個 bridge broker 的 bridge 設定只轉送 `iot/<env>/<自己的 path>/#`」是 child 的 `mosquitto.conf`，由 child 執行。P1 §3.4 寫了 unit→bridge 的 mTLS 與 dynsec，沒寫 root broker 對「bridge client」的 ACL。被攻陷的 bridge（§3.3 的攻擊面就落在這台主機）持 bridge 憑證連 root，若 root dynsec 沒對它做 path 前綴限制，它可以 publish 兄弟 bridge 下任何 unit 的 `actual`（假 In sync，B-03 反向）、`m`（假量測進 PG 與 ERP 門檻事件）、`presence`、`announce`（製造假的 unadopted 候選餵 security-03）；也可以 subscribe `iot/<env>/#` 讀全站 desired。同一根因的第二個例子：§3.4 第 4 步「unit 在 `mgmt/csr` 送 CSR，root 回簽」。MQTT payload 不帶經驗證的發布者身分，root adapter 只能從 topic 推身分；若 root 照 CSR 內的 CN 簽，任何已 adopt 的 unit 都能替別的 serial 要憑證。P1 §7 承認 F-17「由 ACL 實現，不是結構」，但只寫了 bridge 側。
- 依據：F-17、F-18、N-05；P1 §3.1、§3.4 步 4、§7；`mqtt-brokers.md` 列 7（dynsec 預設 deny，但要有規則才有效）；`mqtt-semantics.md` §5 F-48 列。
- 可修：可修，代價小但必須明寫成規格：(1) root 與每個中間 bridge 的 dynsec 對每個下游 bridge client 只允許 publish/subscribe `iot/<env>/<該 bridge path>/#`；(2) root adapter「身分只從 topic path 查 SQLite，永不從 payload 取」進 conformance test，CSR 的 CN 由 root 覆寫；(3) N-17 加「越界 publish 被拒」測試。dynsec 對 bridge 連線是否套用 ACL：未查證，應進 PoC 第一週。

### security-05 intent 簽了、content 沒簽：bridge 主機被攻陷等於其下所有公開螢幕 defacement

- 嚴重度：重大
- 情境：(b)(c)；D-01。
- 壞在哪一步：§6 D-01，desired 只帶 `{"playlist_version","doc":{"url","token"}}`，文件與媒體由「bridge node 的 HTTPS 快取」供應。簽名保證 URL 與版本號是 root 寫的，不保證螢幕拉到的 bytes 是 ERP 的。bridge 主機同時跑面對 T1 的 Mosquitto（§3.3），P1 把這個攻擊面的後果只算成 DoS（「打掛」）。`mqtt-brokers.md` 列 10 的「已驗證 client 惡意 SUBSCRIBE 造成 leak」屬記憶體安全類；這一類的下一個若可利用，攻擊者在 bridge 主機上換掉快取檔，螢幕的 desired 簽名完全有效、`actual.v == desired.v`、ERP 顯示 In sync。P0 結構相同，但 P0 的 bridge 主機沒有 C 語言 parser 面對 T1。
- 依據：F-48、F-56、C-24；P1 §3.3、§6 D-01、§8 #2；`mqtt-brokers.md` 列 10。
- 可修：可修且便宜：desired 的 `doc` 加 manifest hash（文件 SHA-256，manifest 內含每個 asset 的 hash），display backend 驗 hash 才套用，bridge 快取降為不可信 CDN。代價：ERP 產生 manifest 時算 hash、reconcile 介面多一個驗證步驤。順帶讓 (c) 形狀客戶 proxy 的內容竄改也失效。

### security-06 (c) 形狀 WSS trunk：node 要信任客戶 CA，上行身分是 proxy 看得到的 bearer secret

- 嚴重度：重大
- 情境：(c)，客戶有 TLS 檢查 proxy；F-41、N-02。
- 壞在哪一步：§3.4「客戶有 TLS 檢查 proxy 時……改走 node 的 WSS trunk」。第一步就卡：TLS 檢查 proxy 用客戶企業 CA 重簽 server cert，node 不信任那張 CA 就連不上；P1 沒寫「把客戶 CA 裝進 node」這一步，而這一步讓「唯一發行者」在這條邊多出一個我們不控制的信任根（若裝進系統信任庫，文件拉取與一切 HTTPS 都受影響）。第二步：上行身分是「site username + root 輪替的 secret」，這是 bearer，proxy 解密後明文可見；輪替的新 secret 經簽名 `mgmt` 下發，也經過同一個 proxy。於是客戶的 proxy（或攻陷它的人）可以用站點身分對雲端 root 發 `actual/m/ev/presence/announce`，製造假事件、假量測、假的 unadopted 候選。下行有簽名擋偽造，但見 security-01 的重放。`transport-through-networks.md` §3.1 已建議「握手後第一則訊息帶 site 私鑰簽的 nonce」或「短效 token 綁 site 公鑰」；P1 §1 說自己面對「跟 P0 一模一樣的問題」，卻選了最弱的解。
- 依據：F-41、N-02、N-03；P1 §1 弱點 2、§3.4、§7 N-02 列；`transport-through-networks.md` T1～T3、T5、T14、§3.1、§5。
- 可修：可修。(1) WSS 連線後第一則訊息是 node 以 site 私鑰簽 root 給的 nonce，或直接讓所有上行 `ev/actual/announce` 帶 node 簽名、root adapter 驗章後才寫 PG/ERP；(2) 客戶 CA 只裝進 trunk 專用信任庫，runbook 明寫。代價：第二套簽名方向（M-02）、root adapter 驗章 CPU（本規模可忽略）。這條 P0 也要付；差別是 P1 已經在信封上簽了名，只差反方向。

### security-07 revoke 的「immediate effect」只在 root↔bridge 連著時成立；離線 unit 永遠讀不到正向撤銷

- 嚴重度：重大
- 情境：(b)(c)，root↔bridge 斷線（trunk 斷、雲端維護、客戶 proxy 改規則，P1 §8 #1 自己列的情境）；D-01、D-06。
- 壞在哪一步：§3.4 第 5 步，revoke = 簽名 revoke 到 `adopt/<serial>` + `mgmt/dynsec` 改 `disableClient`，兩者都是 root 發、經 trunk 下到 bridge、由 bridge node 套用。trunk 斷線期間（N-11 要 bridge 繼續運作）revoke 到不了：被撤銷的 unit 在 bridge broker 上憑證有效（30 天）、dynsec 未改，繼續寫 `m/actual`，D-06 的 HMI 直接訂閱 bridge broker（§5）照樣讀到它。§4.2 管理表要求 T2「individually revocable with immediate effect」；P0 §4 用短效憑證加心跳續期，拒絕續期本身就是撤銷，不需要任何訊息送達；P1 改成 30 天是倒退。第二個洞 P1 自己寫了：離線的 unit 回來「只會收到 CONNACK not authorized」，分類為 unknown，依 N-11 繼續顯示 last-known-good。對公開螢幕這代表：撤銷一片被偷或退租的螢幕，它會永遠顯示最後一份 playlist，而且永遠不會知道。
- 依據：§4.2 管理表 T2 Revocation；N-11；P1 §3.4 步 5、§8 #1；P0 §4。
- 可修：可修。(1) 憑證壽命縮到心跳量級（例 24 h）並在 `mgmt/csr` 續期；trunk 斷線超過壽命即自然失效，bridge 本來就不能簽，所以不用額外機制。(2) bridge node 持本地撤銷清單版本號，與 root 失聯超過 X 分鐘後對新連線保守。(3) 離線 revoke：允許 unit 在 not authorized 後以 bootstrap 憑證重連、只讀 `adopt/<serial>` 的簽名 revoke——代價是 bootstrap 憑證不能在 adopt 後失效，與 security-03 的修法 (3) 衝突，P1 必須寫下選哪一邊。

### security-08 中繼 CA 私鑰與 root 簽名金鑰住哪裡、怎麼輪替：P1 的 N-04 主張沒有支撐

- 嚴重度：重大
- 情境：(a)(b)(c)；N-03、N-04；staging 從 prod 還原（`00-requirements.md` §9「staging neutralisation」）。
- 壞在哪一步：§3.4「root node 持有本環境的中繼 CA 私鑰」「staging 從 prod 還原的資料庫沒有 prod 中繼 CA 的私鑰」。第二句只在私鑰不在 root node 的狀態庫與備份集內才成立，而 P1 §2 把 root node 寫成「內含 SQLite、CA 發行」，N-09 的備份是複製檔案（P0 §1 第 6 點，P1 沿用）。沒有一句話說金鑰在 TPM、在獨立 secret store、或排除於備份。還原到 staging 的那一刻，staging 持有 prod 中繼 CA 私鑰與 prod Ed25519 簽名私鑰，能簽出對真實節點完全有效的 desired/adopt/mgmt：N-04 的反例。第二個洞：root 公鑰「unit 在 adopt 時拿到」，P1 §4.4 F-48 列承認「金鑰輪替自己維護」但沒有設計：信封沒有 key id，unit 沒有驗新根鍵的路，簽名私鑰外洩等於整個 fleet 重新 adopt，而且 security-02 的 TOFU 再來一次。
- 依據：N-03、N-04、N-09；P1 §2、§3.4、§4.4；P0 §1 第 6 點。
- 可修：可修。(1) 兩把私鑰放 TPM/HSM 或至少獨立 secret 檔，備份腳本排除，還原腳本內建「換 env 前綴、作廢簽名鍵」；(2) 信封加 `kid`，root 持一把 factory 簽的簽名鍵憑證，輪替等於新鍵憑證以舊鍵簽一次下發；(3) key custody 寫進外部審查範圍（P1 §8 #12 只列 PKI）。代價：一次性設計；root 在 ERP 主機，TPM 或等價物可得。

### security-09 面對 T1 的 parser 與 bridge 憑證同 process：承認了，但修法不該是「可選」

- 嚴重度：次要（P1 已承認；此條只說處理不夠）
- 情境：(b) VLAN 內的 hostile T1（M-04、C-25）；D-02/D-06 的 T1 MQTT 設備。
- 壞在哪一步：§3.3「若 PoC 顯示這不可接受，升級版是第二個 Mosquitto 實例」。M-04 說 T1 不可信是設計前提，不是 PoC 結果。`mqtt-brokers.md` 列 10：2.0.19 bridge 惡意封包 crash、2.0.21 已驗證 client 惡意 SUBSCRIBE leak、2.0.23 損壞 persistence 檔 crash。最後一項在 P1 裡有新含意：persist-sqlite（§4.3）寫的是 T1 供應的 retained payload，一則讓持久化檔損壞的 payload 等於重啟即 crash 的 loop（N-07）。另一個 broker 的同期紀錄（`nats.md` N17：MQTT SUBSCRIBE 注入可經 leaf 轉發、無 workaround）說明「面對不可信 client 的 MQTT parser」是活躍的 CVE 類別，不是 Mosquitto 獨有。
- 依據：M-04、N-07、C-25；P1 §3.3、§4.3；`mqtt-brokers.md` 列 10；`nats.md` N17、§3.2。
- 可修：可修，代價一個 process：預設雙實例（T1 實例不持 bridge 憑證、不開 persistence、`max_packet_size` 極小、systemd `ProtectSystem`/`DynamicUser`/seccomp），node 在兩實例間守門。`nats.md` §3.2 對 NATS 給了同樣建議。

### security-10 Control-Semantic 從 Sparkplug 側門滲漏

- 嚴重度：次要
- 情境：D-06 接 Ignition 類 HMI、Sparkplug 可選模組開啟時。
- 壞在哪一步：§6 D-06 允許 edge backend「另外以 Sparkplug B 方言在同一 broker 上發 NBIRTH/NDATA 作為資料面副本」。Sparkplug 的 host 端天然會發 NCMD/DCMD（`mqtt-semantics.md` MQ19：QoS 0 寫 metric），Tahu 類 edge 實作預設處理它；一個拿到 HMI 角色的 client 若 ACL 沒有明示 deny `spBv1.0/+/NCMD/#`、`spBv1.0/+/DCMD/#`，就能對機台 edge 寫值，class rule「Control-Semantic 永不經 context channel 收下行」被繞過。MQ27：Sparkplug 安全章節非 normative，沒有命令授權模型。
- 依據：`00-requirements.md` §3 class rules；P1 §6 D-06；`mqtt-semantics.md` MQ19、MQ27。
- 可修：可修：dynsec 全域 deny 兩個 message_type 給所有非 root 角色；edge backend 建置時關掉 NCMD/DCMD 處理；寫進 N-17。代價零。

### security-11 N-03 的三個小洞：`remote_password` 明文、per-screen token 進 retained、loopback listener 的認證

- 嚴重度：次要
- 情境：(c) 預設 trunk；(a) 最小部署；D-01。
- 壞在哪一步：(1) §3.4 (c)「mTLS 加 `remote_username/remote_password`」：`mosquitto.conf` 沒有 secret resolver，密碼是明文設定檔，違反 N-03 第一句。(2) §6 D-01 desired 含 `doc.token`（F-59 per-screen token）：retained 訊息被路徑上每台 broker 持久化到 sqlite 檔（§4.3），(c) 形狀還被客戶 proxy 看到；螢幕本來就有 mTLS 身分，token 是舊設計的慣性。(3) (a) 形狀 root broker 的 1883 loopback listener 與 Odoo 同主機：dynsec 是全域的、`allow_anonymous` 必須為 false，否則任何本機 process（Odoo 模組的 RCE）都能以 root adapter 身分 publish desired；P1 沒寫。
- 依據：N-03、F-59；P1 §3.2 (a)、§3.4、§4.3、§6 D-01；`mqtt-brokers.md` 列 4、列 7。
- 可修：可修，皆小：(1) 不用 `remote_password`，mTLS 失效時本來就走 WSS trunk；或 conf 由 node 以 resolver 在啟動時產生到 tmpfs。(2) 文件拉取改以螢幕憑證向 bridge 快取做 mTLS，desired 不再帶 token。(3) 明寫 loopback listener 走 dynsec 帳密、root adapter 密碑經 N-03 resolver、簽名私鑰檔的 uid 與 Odoo 不同。

### security-12 供應鏈：每台 CM4 上的 MQTT client 兩年半沒出版，而「自己 patch broker」與買回二十年強化的前提矛盾

- 嚴重度：次要
- 情境：全部形狀；十年尺度。
- 壞在哪一步：P1 §2 自查 paho-mqtt 2.1.0 自 2024-04-29 無新版（29 個月，commit 活躍度未查證）。這是每台 unit 的 TLS/WebSocket client，在 (c) 形狀還是 WSS trunk 的實作；它的下一個 CVE 沒有人修。broker 側：2.1.3 的 ChangeLog 含「session-expiry=0 搭配 will-delay>0 時 Will 被錯誤延遲」修正，自 2026-02 未發布（`mqtt-semantics.md` §3.3；`mqtt-brokers.md` 列 2），而 P1 §4.5 的 presence 設計正好依賴 Will Delay 30 s；dynsec 的 `%u` 與 persist-sqlite 都是 2026-01 的新碼（列 7、列 9）。P1 §8 #9 的緩解「EDL 允許我們自己 patch 並建置」等於承認在壞的時刻我們要自己維護一支 C broker，那正是 P1 §1 說要靠 Mosquitto 避開的事。
- 依據：M-06、N-10；P1 §2、§4.5、§8 #9；`mqtt-brokers.md` 列 2、7、9；`mqtt-semantics.md` §3.3。
- 可修：部分可修：client 側選 rumqttc（P1 已列，有 websocket feature）並接受 Rust 的語言決策，或 vendoring paho 自己扛；broker 側訂「季度查 ChangeLog、90 天內無修補即升級或切換」的規則，並把 security-09 的雙實例當 CVE 緩衝。「單一 committer 的 C broker 當圍堵邊界」這件事本身修不掉，只能縮小它的爆炸半徑。

## 2. 此點成立

- **下行全部簽名**（§3.4）。在 `transport-through-networks.md` T1～T5 的事實下，這是唯一能活過 TLS 檢查 proxy 的 F-48 解，而且比 P0 只給 T3 更對。security-01 批評的是信封內容，不是這個決定。
- **retained 是快取不是 owner、`R_resync` 從 owner 回灌**（§4.1）。安全面的意義：broker 持久化檔被竄改或丟失都不會變成事實，攻擊 broker 的收益被封頂。
- **`raw/#` 只存在於 bridge 本地、永不 bridge 往上，T1 沒有 subscribe 權**（§3.3）。這是 MQTT 上能做到的最乾淨的 T1 圍堵，比 P0 的 HTTP body 多一層 broker 本身的 default deny（`mqtt-brokers.md` 列 7）。
- **revoke 的語意分類**（§3.4 第 5 步）：rejected 需正向簽名訊號，CONNACK 拒絕只是 unknown。對應 §4.2 管理表 T3 列，且與 F-46 一致；洞在送達（security-07），不在語意。
- **(c) 形狀一客戶一 root broker**（§3.2）。避開 F-40 的 tenant pinning，跨客戶的 blast radius 從設計上封住。
- **`check_retain_source` 陷阱、ACL 寫錯等於 C-09、鬼 topic**（§8 #2、#4、#7）。三個 MQTT 特有的真實陷阱都被自己找到，且各附了 runbook 或測試。
- **B-10 / B-11 / B-12 不重現的論證**（§8 #11）成立：backend 只綁 localhost、unit 必須分類 CONNACK、provisioning 不再用 admin port。
- **誠實標「未查證」dynsec 與 cert-username 的互動並排進 PoC 第一週**。這是 security-04 與整個 bootstrap 能否成立的前提，放對位置了。

## 3. 如果我是作者，最怕評審問什麼

「一片剛出廠的螢幕第一次連上 broker 時，用哪一把它早就擁有的金鑰去驗第一則 adopt 訊息的簽名？」——如果答案是「它連上的那台 broker 給它的」，那 N-04 與公開螢幕的 defacement 防線就只剩 factory root 底下任何一張中繼 CA。
