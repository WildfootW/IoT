# 1. 結論先講

結論先講：以 **P2 修訂後的 owner／HTTPS 樹為骨架，採 P6 的功能分期、P5(A) 的契約與共用 oracle；MQTT 按站內資料需求加入，不成為管理權威**。P2 與 P6 同為 56 分，選 P2 是因為完整樹、各層 consumer 與獨立 registry 已是其設計中心；P6 修訂後也要 H0，卻仍限制較深 relay，並留下 T3 管理契約。這是剩餘工作與一致性的取捨，不是分數勝負。六案目前均未獲部署批准，本稿也不是批准。

相對 P0 的五項改動：全 T2 雙向簽章及內容驗證；原子 outbox、耐久 CQ／收據／UNKNOWN 對帳；C-25 實體隔離改造；首日選定應用更新與 OS／boot 維護人，不假設 A/B；完整計入 MQTT、HMI、備份、libraries 與 PKI 成本。保留分期，不延期安全。

owner 的 MQTT 問題，三行回答：  
不用它作 unit/trunk，買到較少的生產配置及維護範圍，不是獨占的正確性或必然穿網。  
保留站內 broker，買回成熟接點、扇出、retained 晚加入快取；schema、品質、授權與恢復仍須整合。  
第一版 unit 用 HTTPS 是偏好；已有工具需求或同負載收益足夠時可重評，不必等 HTTPS 壞掉。

第三方資訊全部繼承 **2026-10-10 研究**，原有摘要、原碼推論與未查證不升格；本輪沒有產品測試、PoC 或網路重查。

| 證據與執行紀錄 | 範圍 |
|---|---|
| 日期／基線 | 2026-10-11；Wave B commit `bba799baaa2fd466ae71ff07791bf60ec24abbf2` |
| 完整閱讀 | brief、00/01/02、LOG、interim、八份 facts、六份提案、42 份 critique/rebuttal/score、四份 MQTT 帳本 |
| 本輪檢查 | 僅文件機械驗證；單一 synthesizer，沒有第二角色預審 |
| 模型限制 | inherited default，無 effort 控制，不宣稱 strongest/max 已套用 |

| 既有評分，不新增評分 | 答辯前 | 答辯後 | 取捨 |
|---|---:|---:|---|
| [P1](../30-critiques/P1/score.md) | 38 | 52.5 | 保留站內生態，不採固定全站 broker |
| [P2](../30-critiques/P2/score.md) | 41.5 | 56 | 選骨架；替換其尚未閉合的 OTA 選型 |
| [P3](../30-critiques/P3/score.md) | 37.5 | 54.5 | 借本地資料島，不預付 JetStream／callout |
| [P4](../30-critiques/P4/score.md) | 41 | 52.5 | 採購仍是條件選項，未取得合規商約 |
| [P5](../30-critiques/P5/score.md) | 36.5 | 52.25 | 採 A；B 須另證增量收益 |
| [P6](../30-critiques/P6/score.md) | 34 | 56 | 借分期；不再保留直達 ERP 的裝置入口 |

## 1.1 借用來源

| score 的三項 steal-worthy | 本稿落點 |
|---|---|
| [P1](../30-critiques/P1/score.md)：owner/cache 分離、分層存活、隔離後的生態入口 | §3 收據；§5 時間／link；§6 raw/n |
| [P2](../30-critiques/P2/score.md)：耐久交接、身分與操作授權分離、MQTT 觸發 | §3、§4、§13 |
| [P3](../30-critiques/P3/score.md)：本地資料島、業務版本不借 transport revision、受限可替換入口 | §3.1、§6、§10.6 |
| [P4](../30-critiques/P4/score.md)：HMI／業務／分析分流、decoder 重用但不交權、平台是副本 | §7、§9、§10.3 |
| [P5](../30-critiques/P5/score.md)：A/B 分帳、HTTPS 管理獨立、fleet 證據退出 | §3.3、§6、§13 |
| [P6](../30-critiques/P6/score.md)：首用 gate、薄 H0 保留 CMS、未知副作用不淘汰 | §9、§13、§3.2 |

## 1.2 對 interim 十條共識的裁定

| [interim](interim.md) §1 原主張 | 證據修正後的裁定 |
|---|---|
| 1 語意是契約，A 近乎免費 | 採分層；撤回免費。A 要有 schema、receipt、GC、oracle 與版本維護，列 §14 預算。 |
| 2 trunk 只能 HTTPS、簽章退路即可 | 不同意必要性與必通。§4.3 分真偽／保密；§5.1 實測 proxy 認證與短請求。 |
| 3 全下行簽章 | 採用並對稱擴及上行、資產 hash、收件者及世代；§4.1。 |
| 4 PKI 生命週期必補 | 採用；不接受匿名 parent 授時或靠失陷舊鍵單簽新根；§4.2。 |
| 5 OTA 必進表 | 採用；選應用 register 更新，OS major/boot 先採具名現場恢復，不假設雙槽；§8。 |
| 6 少算種類，差距不重要 | 採對稱計帳；差距是否重要需同配置成本，不能先裁掉 M-02；§2。 |
| 7 買平台不成立、只買零件 | 不同意全面結論。商約權利、支援及 integration 尚未證明，不是所有付費都違 M-05；§15 O-08。 |
| 8 NATS 不建議作基底 | 本稿仍不選，但理由是固定負擔與未閉合 callout／混版；advisory 不等於現版未修漏洞數。 |
| 9 MQTT 只放南邊 | 採首版位置，修正為 broker + client + 隔離成本；STATE/Rebirth 有限例外，retained 有正價值；§6。 |
| 10 P6 分期但安全不分期 | 採用；H0、外審、恢復、更新先付，jobs／history／標準 adapter 才可首用前付。 |

# 2. 方案總覽

管理中心是 Odoo UI 加 bridge 0 registry；ERP 仍持業務 desired、SQ 及 scheduler。node 同一 release family 執行 unit、bridge、bridge 0，但 parser、issuer、writer、更新 helper 分權執行，不能因同 repo 就合成一個持鑰 process。第一屏可以直連 bridge 0，不必先買站點主機；首個 T1 或本地 HMI 才增站點 bridge。協定先驗 `b0 → b1 → b2 → unit`，不先把每站部署成多層；超過已驗深度需再過 N-18，不承諾無限樹。

一個可獨立升級、審查或交付的外部家族算一個 K；library 不藏進 runtime，多實例另計服務與人力。**直接責任下限為 28 + U**，U 是未展開的傳遞套件及現場產品線，G-L 未凍結完整 SBOM 前不得稱絕對總數已知。

| 非外部 K 的維護軸 | 首屏盤點 |
|---|---|
| 自有程式家族 | node、ERP 模組、display backend，共三個；新增功能 backend 另列 |
| repo 家族 | node、ERP、deploy、e2e、Parts，共五個 |
| 維護語言 | Python、SQL、shell、JavaScript，共四種；不與 K 相加冒充產品數 |

表中「未查證」同時指指定交付版本、授權適用、維護者與支援截止尚未核定；責任人必在 G-L 補齊，不由本稿猜 live 版本。所有元件皆有季度生命週期檢查、每月弱點分流、release 前支援檢查，並在已核 EOL 前六個月提出遷移。

| ID／元件 | 自建或外部／角色 | 授權、維護者與時鐘 | 取代或保留 |
|---|---|---|---|
| K01 Odoo | 外部，業務平台 | 未查證，ERP owner 查 edition／模組／支援 | 保留 CMS 與 hub 業務能力 |
| K02 PostgreSQL | 外部，ERP DB；history 可增實例 | [PostgreSQL License 紀錄](../10-facts/postgres-timeseries.md#L99)，2026-10-10；交付版支援未查證 | 保留 ERP 引擎、替代歷史引擎 |
| K03 SQLite | 外部，node 狀態 | 未查證，ops 核 durability／備份 API | 替代節點 Mongo 類狀態 |
| K04 Python | 外部 runtime | 未查證，release owner | 單一 node 語言基線 |
| K05 Debian userland／套件工具 | 外部 OS 發行 | 未查證，ops | 不自建 OS |
| K06 Linux kernel | 外部，獨立安全時鐘 | 未查證，ops | 不併入 Python 時計 |
| K07 systemd／credential 工具 | 外部 supervision／secret 裝載候選 | 未查證，G-U/G-PKI 驗實際介面 | 單一啟停責任 |
| K08 nginx | 外部，ERP ingress／node TCP 轉送 | [T7](../10-facts/transport-through-networks.md#L45) 僅行為紀錄；授權／模組版未查證 | 保留 proxy，不假定串流必通 |
| K09 OpenSSL | 外部 TLS provider | 未查證，安全 owner | 不自製 TLS |
| K10 cryptography | 外部 X.509／簽章候選 | 未查證，G-PKI | 不自製密碼原語 |
| K11 PyJWT | 外部 JWS 候選 | 未查證，G-PKI 驗 EdDSA／格式 | 不手寫簽章封裝 |
| K12 aiohttp | 外部 HTTP client/server 候選 | 未查證，G-NET | 合併傳輸實作 |
| K13 psycopg2 | 外部 PG driver 候選 | 未查證；ERP/node 若需不同 driver 各加 K | DB 連線不免費 |
| K14 Anthias | 外部暫用 player | 授權／CM4 支援／映像內容未查證，G-L | 先保留 reconcile 介面 |
| K15 Chromium／實際 renderer | 外部 browser 候選槽位 | 實際 player renderer 未查證，不能算 Anthias 免更新 | 不自建 browser |
| K16 Docker Engine | 外部部署 runtime | 未查證，ops | 每個隔離實例列資源 |
| K17 Docker Compose | 外部編排工具 | 未查證，ops | 與 Engine 分別追蹤 |
| K18 nftables | 外部 host firewall | 未查證，G-NET 驗規則與持久化 | 取代口頭隔離 |
| K19 chrony | 外部時間服務候選 | 未查證，G-T 驗實際上游與冷啟 | NTP 不視為免費可用 |
| K20 dnsmasq | 外部站點 DNS／按需 DHCP 候選 | 未查證；借客戶 DNS 仍列其實作責任 | 穩定 parent 名稱 |
| K21 restic | 外部加密備份候選 | 授權／backend／restore 行為未查證，G-R/G-L | 不自建備份引擎 |
| K22 OpenSSH | 外部管理／站內 backup transport 候選 | 未查證；不准一般 device SSH | 受控維修與異機備份 |
| K23 ca-certificates | 外部信任套件 | 未查證；node 用獨立受限 trust store | 不以系統全部 CA 授 IoT 權 |
| K24 CM4 bootloader／EEPROM 工具 | 外部板端更新家族 | 硬體版／授權／恢復方法未查證，G-U | 不自建 bootloader |
| K25 CM4 board/GPU firmware | 外部韌體家族 | 與 bootloader 分列，未查證 | 納入簽署映像 manifest |
| K26 現有 hypervisor | 外部現場平台 | 型號／支援／備份責任未查證 | 共故障域不隱藏 |
| K27 現場 AP | 外部硬體／韌體家族 | 型號／功能未查證；C-25 已知無 isolation | 不假稱改設定就能隔離 |
| K28 現場 switch | 外部硬體／韌體家族 | 型號／port isolation 未查證 | retrofit 新產品線另加 K |
| 自有 node | unit/bridge/B0、policy、issuer、writer、helper | 同 release family，分 UID/process；兩人接手 | gateway、south、IOTA/Orion 相關職責 |
| 自有 ERP 模組 | UI/CMS/outbox/inbox/scheduler | 每次 Odoo 升版驗真實 route／安裝 | 保留業務，換裝置入口 |
| 自有 function backends | 首屏 display；其餘首用加入 | 每 backend keyed-result／reconcile fixture | 保留可換播放器與 sensor 隔離 |

| 條件增量 | 新 K／實例／工件 |
|---|---|
| history | 同 K02 新 PG 實例，writer 新 process；Grafana +1 K；無 history 不啟用 |
| D-02／D-03 | vendor sensor driver +1 K、pymodbus +1 K，各自核授權；RS485 料件另列 |
| MQTT | Mosquitto +1 K、Paho client +1 K；raw/n 都需要才兩實例，dynsec 跟 broker release 但配置另維護 |
| Sparkplug | protobuf runtime +1 K、Tahu/替代 codec +1 K；指定 HMI 產品另 +1 K，未選定不免費 |
| D-05 | 硬體 SDK、key provider、attestation/secure-boot 工具至少三個待選 K；firmware 新線另加，G-A 全盤 |
| C-25 retrofit | 新 AP/switch 不同產品線暫各 +1 K；Linux south 沿用 OS family，多一台硬體故障域 |
| 工件 | 契約/schema/oracle、PKI/escrow、部署/restore、版本/退出四組；不是四個新服務 |

三圖箭頭表示新連線發起方向，下行沿該連線回傳；G-U 量完整足跡，角色數不等於程序數或 RAM。

| 最小執行範圍 | 實帳 |
|---|---|
| 中央 | ERP、PG、nginx、B0、隔離 issuer，至少五個應用角色 |
| 屏端 | node、display backend、player、更新 helper，至少四個角色；renderer若另process再列 |
| 其他依賴 | DNS、NTP、backup、OS基礎daemon仍在K表，不包含於九角色內，不因最小部署消失 |

```text
(a) same host, separate users/networks
[unit: node + SQLite + display + player + helper]
             --443--> [B0 node] --private HTTPS--> [Odoo] --> [ERP PG]
                         |--local IPC--> [issuer/policy]
                         +--optional writer--> [history PG]
   [nginx] [DNS] [time] [backup target off-host] remain dependencies
```

```text
(b) same site, different VLANs
[T2 unit] --443--> [south bridge] --443--> [B0] --> [ERP/PG]
[T1 private ports] <--502 polling-- [isolated poller] --> [validator]
[T1 Wi-Fi island] --1883/8883--> [raw] --> [validator] --> [node]
[trusted HMI] --443/8883--> [local view / n projection]
   No L2 bridge, no IP forwarding, no T1-to-ERP path
```

```text
(c) outbound-only site
[unit] --443--> [site bridge/cache] --443 via approved proxy--> [cloud B0]
[PLC] --> [local poller/view] <--443-- [local HMI]                  |
                                                               v
                                                           [Odoo/PG]
   No inbound site port; HMI and last-known-good stay local
```

# 3. 契約與語意

## 3.1 事實與提交

業務版本由 ERP 擁有，不借傳輸序號或接收時間；path 不是身分。事實的共同欄位與持久化條件如下。

| 契約項目 | 必備規則 |
|---|---|
| 事實鍵 | `env/tenant/unit/function`；owner、authority_epoch、incarnation、revision、schema_rev、digest；同版異值隔離、舊版不覆蓋新值 |
| announce/config space | serial、class、schema、capabilities 由 child 報告；management config 另有管理 writer，不互相覆寫 |
| 關鍵 SQLite 交易 | inbox/CQ/adopt/revoke/receipt 使用 WAL、synchronous=FULL 候選設定，commit 後才回收據；實際版本、媒體 flush 與斷電保證由 G-C/G-U 驗證 |

受理與交接以本地提交為界；ERP 停機或未提交不得稱已受理。保管收據只證明保存副本，不證明物理完成。

| 提交邊界 | 必須先完成的事實 |
|---|---|
| ERP受理 | 業務變更與durable outbox/SQ同交易，交易外才搬運 |
| Manage | registry先提交binding並供其他讀者重讀，ERP才建managed projection |
| unit收件 | inbox/desired/job admission先commit，才回保管收據 |
| 最終結果 | unit產CQ；ERP結果/去重/cursor/receipt outbox同交易commit後，B0才簽最終receipt |
| 樣本 | 另等PG commit，不與ERP水位混用 |

最新快照不能替代歷史。重同步與定期對帳使用同一套規則，局部丟失結果不必等整條連線斷開才修復。

| 重讀步驟 | 規則 |
|---|---|
| snapshot/watch | snapshot 固定 revision R；watch 接其後差異；含授權 desired、SQ、actual、CQ、schema、management、revocation、events、tombstone |
| cursor 過期 | 回 gap 範圍及 reset_required；重取快照後仍從 event/CQ owner archive 補歷史 |
| 反熵 | 每 hop 重連及每 120 秒比較清冊；complete 遺失而 fetch 仍在線也會補齊，無 per-command poll loop |

## 3.2 執行與 UNKNOWN

state intent 由 durable desired 與 backend 實況的差異驅動；每 function 一個 reconciler。observed、pending、applied 分列，只有 backend 成功讀回同 version/digest 才完成；拒絕、延期、錯誤與 superseded 都按版本保存。相同已套用內容不重啟 show，但相同未套用版本須可繼續，慢舊 worker 不能覆蓋新 actual。播放器 API 確認只標 backend_confirmed，沒有影像回授就不宣稱每個像素已顯示。

job 以不可重用 key 加 payload hash 原子 claim，先記 executing 再呼叫 backend，先落 CQ 再上送。LED add/remove 優先改成穩定 item ID 的 desired collection；resume 等一次性動作必須有同 key 的耐久結果查詢或可證明的停止程序。動作已發生、CQ 未提交時，SQLite 再多一次 fsync 也不能推出結果。恢復為 **durable UNKNOWN**，記 key、階段、資源及證據，禁止盲重跑、換 key 規避或假報未執行。

ERP 持有每個衝突資源集合的 single-flight、sequence、start deadline；unit 起跑前再驗授權、序號、profile version 與期限。timeout 只表示等待逾期，不取消 running，也不釋放衝突槽。須有終態、backend 停止證據或現場隔離與人工對帳才放行；fencing 只能阻止尚未開始的舊 executor，不能撤銷已發生的效果。無法核實者可永久 UNKNOWN，該 job 類別不開售，不承諾一般非冪等物理 exactly-once。

| 故障 | 已受理後的結果與恢復 |
|---|---|
| ERP crash | outbox/SQ 仍在 PG；unit 保留未獲最終收據 CQ。重啟按 key 重讀，禁止另造 job。 |
| bridge crash | receipt 前由來源重送，receipt 後從 journal 恢復；B0 鏡像不替 unit 決定成功。 |
| unit／backend crash | inbox 前可重取；executing 無結果走 keyed query 或 UNKNOWN；actual 啟動後重讀 backend。 |
| 網路／回覆遺失 | 同 key 重送、同 digest 收據重送；start deadline 不延長，late result 追加、不抹 timeout。 |
| 媒體全毀／舊備份 | §7.2 的 RPO 與 recovery epoch；失去證據具名 evidence_lost，不等同沒做過。 |

| ID | 判定 | 精確契約及限制 |
|---|---|---|
| F-46 | 部分 | owner 耐久、批次重讀、不依賴 at-least-once 才正確；§5 窗口及 §7 媒體 RPO 是明示界線，G-C/G-R。 |
| F-47 | 部分 | intent 完成比 actual；job 完成看同 key 結果。通用物理 exactly-once 不成立，§3.2 不可核實類別禁用。 |
| F-48 | 部分 | §4 的 parent、來源、授權及內容驗證；inspection 不提供對 proxy 保密，限明示 profile，G-PKI/G-NET。 |
| F-49 | 成立（設計） | 每個 job 及 intent 版本都有 ERP 可讀終態／UNKNOWN／refusal；全部類別共用結果路徑，G-D。 |
| F-50 | 成立（設計） | 投遞失敗是 unknown，deadline 後另記 timeout；late result 可補，永不推論 not-run，G-C。 |
| F-51 | 成立（設計） | unit keyed claim/dedupe；ERP single-flight/deadline；未知效果不解鎖，恢復不回退水位，G-C/G-R。 |
| F-52 | 成立（設計） | delivery receipt 與完成 CQ 分離；worker 不占傳輸 handler，G-C 慢 backend 驗收。 |
| F-53 | 成立（設計） | backend error／partial／refused 原樣成 outcome，不用 HTTP 200 包成 success，G-D。 |
| F-54 | 成立（設計） | 裝置可 refuse/defer；相同 desired 不累積效果，pending 同版可重試，G-C。 |

## 3.3 相容與 conformance

先固定契約與相容政策，不能用「parent 先升」代替證據。G-C 同時觀察 owner 與實際效果，不只檢查 HTTP 成功；先例只供參考，不移植其產品保證。

| 相容／conformance 項目 | 必備契約 |
|---|---|
| 生產範圍 | 首版只有 HTTPS；memory 作故障 oracle，不預付第二 binding |
| 協商 | wire major/minor、required_features、schema revision、錯誤詞彙；未知必要功能明確拒絕 |
| 支援與退出 | 當前及前一已驗 major，預設12個月遷移；安全撤版可縮短，但失聯fleet須有處置 |
| 混版矩陣 | 新parent/舊unit、反向、兩層bridge、restore；預設parent先升 |
| 核心反例 | 八天舊cursor＋新SQ、effect後CQ前斷電、同key異值、schema亂序、timeout舊worker、滿額、舊備份 |
| 先例與未知邊界 | [list/watch](../10-facts/precedents.md#L44)、[twin重同步](../10-facts/mqtt-semantics.md#L53)；[NATS KV/fsync](../10-facts/nats.md#L27)、[Zenoh plugin推論](../10-facts/zenoh.md#L46)不證明未測binding已成立 |

# 4. 身分與 PKI 生命週期

## 4.1 簽章與授權

採 JWS 封裝原始 payload bytes，候選 library／EdDSA 組合未查證。G-PKI 驗黃金向量、重複 JSON key 拒絕、大小上限與演算法白名單；不按來訊選弱演算法。

| 簽章範圍 | 必備欄位 |
|---|---|
| protected header | format、typ、alg、kid |
| 事實 payload | env_id、tenant_id、issuer、audience(unit/function)、purpose、authority_epoch、incarnation、binding_rev、schema_rev、version/job_key、payload digest、issued_at、start_before/有效期限、grant_id |
| 每次網路 proof | 雙方 nonce、method、path、body hash、session sequence；一次 hello 不能授永久通行 |

簽章證明來源，不證明感測器誠實。歷史證據與新命令授權分開，舊 CQ 不因證書到期而消失；沒有可驗證證據仍保持 UNKNOWN。

| 來源／歷史驗收 | 規則 |
|---|---|
| T2／T1 | T2 report/complete/announce保留原簽章，parent驗子樹、root再驗；T1只由登記bridge代述並帶source_auth_level |
| 遲到結果 | 以當前受限session補送，核原job/admission/key history/已存receipt；證書到期不是刪CQ或推論not-run的理由 |
| 已撤銷鍵／無可信時間 | 舊證據先隔離；不能只憑自報「撤銷前」時間標success，也不能自動重做 |

## 4.2 製造、輪替與復原

製造不能 clone 私鑰，網路 discovery 不能授予信任。以下流程從第一批裝置開始，不等 T3 才補。

| 製造／adopt 階段 | 耐久規則 |
|---|---|
| 裝置產鑰 | unit本機產鑰；factory核serial、CSR proof、QR公鑰指紋 |
| 預置與指派 | 離線enrolment根＋獨立recovery根；根簽voucher綁serial/public-key/env/tenant/允許parent，不接受網路自給新根 |
| bootstrap | 只准announce/讀採納結果；同serial異鍵隔離 |
| adopt | 先持久消耗claim/寫binding，再發operational cert；丟回應可憑原鍵重讀；全部T2/T3停用舊bootstrap，reset不重開權 |

續期不等於重新 adopt，recovery route 也不是降低一般通道驗證。G-T 納長假冷啟與無 RTC 維修成本，不承諾全 fleet 自動復活。

| cert／時間恢復 | 權限界線 |
|---|---|
| 正常續期 | cert七天，半期起jitter續期；bridge同規則，不持中繼CA |
| 過期30日內 | 獨立recovery route驗nonce持鑰proof，由最新registry決定；只回public cert/恢復結果，無文件/命令/一般report權 |
| 一般mTLS／壞時間 | 不接受過期cert；缺有效時間只播LKG，先用已驗RTC/受控現場校時恢復TLS，不以匿名parent授時自證可信 |

cert、操作授權與撤銷不是同一個期限。root 每 120 秒供新鮮撤銷清單；操作 lease 最長五分鐘，線上撤銷目標六十秒內阻止新工作，離線最多接受既有五分鐘。逾期停止新命令、設定與敏感文件；既有畫面與本地控制不擦除，上行留來源／隔離區。唯讀狀態 endpoint 可讓被撤銷 unit 查自己的簽章裁決，不恢復 bootstrap。T2 軟體鍵可被 root 權限複製；偵測重複 incarnation 不等於硬體不可複製。

金鑰輪替不能依賴已失陷的舊鍵自我授權。週期是外審前的設計值，不是第三方支援承諾；沒有硬體保護也不能宣稱抗整機複製。

| 金鑰生命週期 | 政策 |
|---|---|
| 效期與過渡 | 離線根15年、中繼2年、線上用途鍵90天；根/中繼提前90天規劃，演算法與週期經外審核准 |
| 正常／失陷輪替 | 未失陷上級簽新 trust set，確認 fleet 收到再退舊；失陷由預置 recovery 根核准，不由舊鍵獨簽 |
| 根／escrow 遺失 | 隔離並現場重建信任，不能網路下載一把新根自救 |
| 私鑰保管 | 獨立 encrypted secret volume；resolver 解封至專用 UID 記憶體/tmpfs；不進 DB/cache/URL/log；G-PKI 驗冷啟解封 |

## 4.3 Trust profiles

| 模式 | 真偽／保密／實際支援邊界 |
|---|---|
| M：無 inspection 或核准 no-decrypt | node 驗 parent server cert，parent 驗 unit/site client cert，另驗雙向物件；node 可直接終結 TLS 或 nginx 做受控 TCP passthrough。ERP 內部 TLS 終結者另列信任責任。 |
| I：明確核准 inspection | 企業 CA 只裝 trunk 專用 trust store；雙向簽章及 nonce proof 保身分，proxy 可讀所有明文 payload。只准 owner 核准的非敏感資料，不傳 bearer secret、私鑰或出勤／私密內容。不是自動 fallback。 |
| 不支援組合 | 要對 proxy 保密、又禁止 bypass：本版阻塞。可另審 JWE/既有端到端加密 profile，至少新增 library、鍵分發及 4～8 人週探索；未納本版、不宣稱已解。 |

這個界線接受 [TLS 終結原文證據](../10-facts/transport-through-networks.md#L38)，不把 [廠商摘要](../10-facts/transport-through-networks.md#L34) 當所有版本的結論。支援 (c) 是提供可驗的 outbound profiles，不是宣稱任何客戶 proxy 都可服務；受阻組合仍是 O-01 的未決責任。

# 5. 樹、trunk、傳輸

## 5.1 Hop 與網路 retrofit

每 hop 都由 child 主動 HTTPS；B0 主動讀 ERP queue、推業務 inbound。NDJSON 的 stream／有限批次共用狀態機，不另做 SSE；參數是 G-NET 可否定的設計值。

| HTTP 參數 | 基線 |
|---|---|
| stream／long-poll | 心跳20秒、watchdog70秒；hold最多20秒，有更新即回 |
| timeout | client30秒、受控proxy idle至少90秒、一般上送10秒；backend工作不受delivery timeout綁住 |
| 重連／配額 | jitter backoff 1～60秒、遵守Retry-After；每child最多兩連線，單批256筆/256KiB |

explicit proxy 必列 host、port、CONNECT、非互動認證及 root FQDN 放行。stream 被緩衝時可改短請求，不能改 trust mode；連普通 HTTPS 都被封就報部署阻塞。只測 nginx 不代表客戶產品通過，WSS 也不是協定上被排除。[T13 的正向 buffering 缺口](../10-facts/transport-through-networks.md#L51) 仍未查證。

**C-25 的原 shared-PSK、無 isolation、租戶 VLAN 及單 hypervisor 保持視為 hostile**。預設 retrofit 是新增四網口 Linux south/firewall 盒、可驗 port isolation 的 managed switch、需要無線才加新 AP；舊交換器只作 north uplink，不承擔新隔離。T1 實體移接新專用 access ports／SSID，T2/HMI/管理分網，south 不橋接 L2、不開 IP forwarding。AP 需驗同 AP、跨 AP 與有線旁路都不能互達；若無法驗證每 client 隔離，就用每 T1 獨立 VLAN/實體埠，少量設備可一個 dedicated AP 對一條隔離埠。沒有搬線／換 SSID 權限就無法圍住留在舊 VLAN 的 T1，必須列阻塞而非聲稱已滿足錨點。

| 發起方向 | 明確允許；其他 default deny |
|---|---|
| T2→自己的 parent | TCP 443，管理／文件／結果同 scope；T2 不能直達 ERP、DB、其他 unit |
| south→north/root | TCP 443 或指定 proxy port；(c) 不新增 inbound，不另要求 WAN 22/8883 |
| poller→T1 | 只白名單 TCP 502；RTU 是 local serial、baud/parity/bus id、VM passthrough 與唯一 reader |
| MQTT T1→raw | 只型號 profile 的 8883；1883 僅獨立有線／逐設備隔離鏈路、明列低信任 |
| HMI→local view/n | 443／8883，唯讀 scope；不可讀 raw 或 PLC 寫入端 |
| node→DNS/time | 53 TCP/UDP、123 UDP 僅指定站內服務；DHCP 67/68 按需；不轉 mDNS/SSDP |
| writer/Grafana→PG | north 私有 5432／socket、獨立最小權限；不從 T1 區持 DB credential |
| backup/admin | 站內備份主機的受限 22 或既有 HTTPS relay，維修僅管理網；不得因此開 WAN inbound |

retrofit 預算先留 NT$20,000～50,000／站、施工及負向驗收 3～5 人日，另加 ports/AP/RS485、布線及停機；這是**未查證的預算額，不是市場報價**。少量逐埠方案較貴但不依賴舊 switch 功能。O-02 要核准料件、動線與費用；G-NET 以租戶筆電、T1、T2、HMI 四方實測拒絕矩陣。

## 5.2 Retention、時間與保證

每個窗口輸出 owner、oldest age、bytes、未確認數、cursor lag、durable gap/drop 範圍；沒有 sequence 的 T1 只能記「未知數量缺口」，不能捏造精確丟失筆數。計數器在狀態庫與監控匯出端保存，restore 不把舊數值當零。job admission 必先保留 bounded CQ 所需空間，結果 body 上限 64 KiB；更大輸出須事前預留 artifact 空間，否則開始前拒絕。容量八成告警、九成停止新 job，保留控制與結果餘裕。

| 事實／owner | 窗口與容量基線 | drop／overflow／交接 |
|---|---|---|
| ERP desired／registry config | 當前版本直到有效替代或退役；審計 180 天，仍被引用版本 pin | 不丟當前事實；拒收新變更並告警 |
| ERP SQ／flight | 未解決無 TTL；start deadline 預設 10 分鐘、上限 7 天 | 過期未開始者記 refused(expired)；UNKNOWN 保鎖，不依 TTL 刪工作 |
| unit CQ／intent outcome | 未獲 ERP 最終 receipt 無 TTL；已交接詳細結果至少 90 天 | 專用至少 256 MiB，先停新工作，不淘汰未確認 CQ |
| bridge CQ／收據 outbox | 到最終 receipt 前 pin；雙方確認後另留 7 天 | 不把 hop ack 當終點；重啟重送原收據 |
| ERP 結果 archive／最終 receipt | 完整簽章結果 3 年；未知及未決無 TTL | 清理不得刪 active key；晚到結果追加且保留 timeout 軌跡 |
| ERP 業務事件 archive | ERP owner 保留已交接事件 3 年；D-05 法定/隱私期間由 O-07 首用前核定 | 超期 GC 有區間/筆數稽核；未交接事件不由此期限回收 |
| dedupe floor／key history／revocation | unit 與安全 registry 保存至退役，例外 key 到核實結案 | 所有舊 epoch 永久拒起跑；退役後須關閉 replay、銷毀可執行備份再核准 GC |
| source event journal | 未確認已接受事件無 TTL；按至少 7 日峰值配置，初始 512 MiB；ERP receipt 後 30 日 | 能背壓則拒新事件；不能背壓來源告能力降級/缺口，不覆蓋已接受事件；D-05 必另核法定期間 |
| source/bridge telemetry spool | 48 h 或 unit 1 GiB、bridge 4 GiB 先到；正常等 PG receipt 回收 | 明示有損：丟最舊量測並記序號範圍，不能擠 CQ；保證時長依實測速率配盤 |
| 待 schema／無效資料隔離區 | 24 h／64 MiB，每來源額度；合法未啟用 schema 的資料仍由來源持有 | 無效資料拒收並計原因；不得用此 TTL 刪合法未交接事件 |
| watch change log／snapshot | 7 日或 64 MiB；snapshot lease 30 分鐘；reader buffer 16 MiB | 410/重新快照＋歷史回補；只斷慢 reader，不刪 owner 事實 |
| ERP inbound F-67 | 2 日 replay，僅已完成業務交接者清理 | 未處理超齡告警／背壓，不能靜默刪唯一收件 |
| 文件／媒體 cache | unit pin current、LKG、applying；無引用 cache 最多 3 版／30 日且受磁碟 quota | 空間不足拒 Apply，不刪唯一可播版本；record token 不進 manifest |
| live JSON／HMI projection | MES TTL 15 秒；D-06 依 §10.6 的 3 秒 baseline | 不以重播／接收時間續命，既有畫面自行 stale；retained 不是健康證明 |
| heartbeat／link | 120 秒 heartbeat、5 分鐘 offline；conn epoch 配對 link 提示 | 不逐心跳建 ERP rows；舊 link-down 不覆蓋新 birth |
| cert／操作 lease／HMI 讀 lease | 7 日／5 分鐘／非敏感本地讀最多 8 小時 | 過期停新授權；HMI 續讀是 O-10 的額外撤銷窗口，不含命令 |
| challenge／nonce | parent challenge 60 秒、單用；已用 nonce cache 10 分鐘，綁 boot/session；持久 sequence floor 另長存 | 重啟換新 session nonce；過期/重播只拒握手，不刪業務事實 |
| broker raw/n | cache 不持久；每 client 100 則/1 MiB、實例 16 MiB queue、256 MiB RAM/0.5 CPU 起始上限 | 固定版須驗可執行限額；drop 指標及來源缺口並報，不能只信 $SYS 總數 |
| history raw／hourly roll-up | raw 至少 3 個曆年，整月回收可多留一月；hourly 5 年 | 資料 owner ops 執行分區回收並計 rows/bytes；dirty bucket 清完才刪 raw |
| 一致性 backup | 日備份 30 日、月備份 12 個月；只准 30 日內副本進 operational restore | 更舊只可離線查閱；任何 restore 仍要新 epoch 與對帳，不能直接上線 |

F-02 的時間來自實際採樣者，不用 north 收件時間替代。暖機、故障與失準先擋於平均和告警前；NTP 可達不等於可信，G-T 驗本站上游、RTC 與漂移。合法遲到樣本可補歷史，不更新即時值或 Fleet 存活。

| 時間品質欄位 | 判準 |
|---|---|
| sample_time、received_at、boot_id、sample_seq、clock_quality、uncertainty、採樣期品質 | 新鮮度基線要求 uncertainty ≤2秒，未來偏移 >2秒隔離；不達標顯 unknown，不杜撰採樣時間；HMI 另驗端到端 age |

# 6. MQTT 放法

採 [ledger-review 增量帳](../40-mqtt-ledger/ledger-review.md#L62)。Mosquitto 不是唯一合法 broker；[雙授權](../10-facts/mqtt-brokers.md#L22)、[dynsec](../10-facts/mqtt-brokers.md#L28) 均為繼承研究，指定版仍須 G-L。client library 獨立計鐘，不自寫子集省帳。

MQTT 入口與投影按實需部署，驗證後的本地資料不必等雲端。封閉設備不懂我們的重送契約，來源限制必須明示。

| 入口／投影契約 | 規則 |
|---|---|
| 觸發 | T-a 實機 MQTT、T-b 指定 MQTT/Sparkplug HMI、T-c 客供 broker/export，先 G-M |
| 實例隔離 | 只有 ingress 或 projection 各一實例；兩面並存則 raw/n 分 UID、netns、RAM/CPU/disk quota |
| 憑證 | broker 可持本地 TLS/ACL credential，但與 parser 都不持樹、ERP、CA 私鑰 |
| 正規化 | validator 以可信 credential/隔離埠映射 vendor topic→已登記 id；node 驗 schema/倍率/單位/quality，先更新逐 metric view 再上傳，HMI 不讀 raw |

普通 curated 值可 retained，owner 是 node，重建與換權限後回灌仍有效值，失效者明示 stale。MQ9 的 [retain-source 檢查](../10-facts/mqtt-semantics.md#L36) 不等於每次同身分換 cert 都清空；同身分換證、換身分、ACL revoke 分測。Will 只提示連線，不能判樣本健康。T1 進 validator durable journal 之前的遺失不屬本系統已接受事件保證；沒有來源序號就不承諾可重建。

publish-only 只適用普通 raw，不能阻斷必要的資料握手。Sparkplug 的 [BIRTH/retain/Rebirth](../10-facts/mqtt-semantics.md#L66) 與 [session](../10-facts/mqtt-semantics.md#L67) 另有規則；[工具適配](../10-facts/mqtt-semantics.md#L70) 仍待 G-H。

| Sparkplug profile | 契約 |
|---|---|
| ingress Host／egress Edge Node | 分別管理 STATE、完整 BIRTH、alias、seq/bdSeq、DEATH、重連；不用一般 retained 代替 |
| 唯一診斷回程 | validator 驗授權/目標/限速才轉 Rebirth；其他 NCMD metrics/DCMD 不接 PLC 寫入端 |

unit 首版保持 HTTPS。客供 broker 不需替我們提供 dynsec 或 outbound bridge；若只有發布權就只做資料 export，不能自行 adopt unit。第二個 unit binding 的 G-X 比較必須保留相同 broker、schema、隔離、HMI、文件路徑，量少掉的 adapter／IT 工作和新增維護，而不把全部 MQTT 收益歸它；有淨收益才另開，管理仍 HTTPS。

# 7. 回傳資料與 store

## 7.1 歷史與告警

最小屏不建 history DB，但 ERP PG 仍必需。第一個承諾歷史的 sensor 起，用我方 ops 管理的獨立 PostgreSQL 實例，與 ERP 同引擎但不同 WAL／備份窗口；多一個實例的代價比在資料很大後才搬可控。writer 在 north，stable series id 不因 type 名稱或 path 改變。sample_id 由來源 unit/incarnation/sequence/attribute 組成，不以 timestamp 去重；同 id 異值隔離，sample、去重及 dirty bucket 同 PG transaction，commit 後才發 store receipt。

窄表按月分區，schema revision 保存不可變型別與單位；晚到資料只要仍在三年 raw horizon 就標 dirty 並冪等重算，不因七日 spool 已過就忽略合法回補。roll-up 存 sum/count/min/max，禁止平均值再平均；以 revision/watermark 觀察修訂。這採 [partition 原文](../10-facts/postgres-timeseries.md#L40) 與 [MV 非增量警告](../10-facts/postgres-timeseries.md#L41)，不宣稱已有吞吐數據。三十屬性一 Hz 三年約 28.38 億 samples 是估算，不能把 N-15 單機容量當全站上限。

容量觸發是評估，不是自動換 VictoriaMetrics；其 [Enterprise 界線](../10-facts/postgres-timeseries.md#L54)、型別與查詢差異要重驗，不能把遷移稱為一條 SQL。

| G-S 觸發／責任 | 代價與驗收 |
|---|---|
| 資料 owner：預估逾十億 samples、history占可用儲存>60%、查詢p95>2秒或restore>8小時 | 評估容量/替代引擎；回填、逐id校對、watermark切換/回退估3～6人週 |

告警規則由 ERP 寫 desired，最近資料 owner 計算遲滯與持久 transition/event_id，ERP 收業務事件交站點值班者；Grafana 僅 ops 歷史、門檻線與系統健康，避免同一門檻兩套業務真相。客戶 read scope 以穩定 unit/function/field 綁定，SQL view／role 與 API 由同核准清單審核，不借 site 憑證。dashboard-as-code 匯入先檢查未受管差異，不默默覆蓋手改。

## 7.2 State、backup、key escrow 與不回退水位

durable 的承諾涵蓋已測的 process/OS crash 與斷電後有效媒體，不包含整個故障域所有副本同毀。中央 RPO 24 小時、RTO 8 小時是待 O-05 核准的基線，單 edge 整卡損毀的 RPO 是最後異機 receipt，可能更差。必須顯示 evidence_lost／gap，不把備份存在說成零資料損失。接受 job 前的空間預留與未確認結果 pin 仍不受 RPO／TTL 清理政策取消。

| 狀態／唯一 owner | 備份與 restore 規則 |
|---|---|
| ERP PG＋CMS filestore | ERP ops 同一 backup manifest；desired/outbox/SQ/flight/inbox/result/cursor 一起還原，先封 command write gate |
| B0 registry／安全日誌 | 安全 ops 用 SQLite 一致性 backup；綁定、adopt、revoke、授權水位不從 Fleet display 反推 |
| unit SQLite／本地媒體 | node ops 備份 inbox、CQ、dedupe、id map、applied、schema、LKG；WAL/backup API 固定版本驗，不複製活檔 |
| bridge origin journals | T1 事件／尚未交接資料必備，不可全部稱 cache 清空；純鏡像可從 owner 重建 |
| history PG／SQL／Grafana | 資料 ops 備完整 DB、roles、schema、dirty 水位；儀表板 repo 與 service credential 分流 |
| broker cache／dynsec | retained 不恢復成權威；空啟動，從核准政策生成 ACL、完成授權同步後開 listener |
| OS/app/boot／stop marker | release manifest、相容版與 stopped 狀態入備份；不能回滾應用時回滾 CQ/信任水位 |
| CA／簽署／部署解封鍵 | 加密獨立 escrow；一人持媒體、一人持解封材料，雙人程序而非聲稱硬體 threshold；staging 永不取得 |
| authority_epoch 登錄 | 安全 owner 在獨立管理／復原工作站保存追加登錄及異機副本，不與業務 VM snapshot 一起回捲；無新鮮登錄則不發 operational grant |

任何 owner restore 都先隔離，取得 recovery authority 核准的**新且不回退的 epoch**，不是從舊 DB 最大值加一猜測。unit 每次冷啟取得 nonce 綁定的 boot grant 才接受新工作，離線只能續播 LKG；防重 floor 與未解副作用不能因新 epoch 清掉。ERP、B0、unit 三方以原 key/digest 對帳，舊 ERP 不以鏡像較大版本自動覆蓋業務意圖。獨立登錄也遺失或被回捲時，全站停新授權、重新建立信任並逐件核實，不能宣稱抵抗所有 T2 敵意媒體回捲。

# 8. 升級路徑

**選 node register 式自更新，不在本版裝 Mender。** `desired.software` 是版本化、具硬體/OS 相容範圍及最低安全版本的簽章 artifact manifest；unit 沿 parent HTTPS 預取完整 artifact，驗 digest/signature，進 staged，交獨立 recovery helper 切換，健康確認後才回 actual committed。下載／安裝回覆不是升級完成。發布鍵與業務鍵分權，CMS 不可下 arbitrary shell；發佈先 canary、一小批、全站，離線機的 pending/failed/rollback 在 ERP 可見。

應用只假設能在已驗檔案系統保留 current/candidate 兩個完整目錄，啟動指標原子切換能力仍由 G-U 驗證；這**不是 rootfs A/B**。CQ、registry、secret、epoch 與 stop marker 放獨立狀態位置，不隨應用回退；schema migration 先前後相容，不能寫入新資料後拿舊 snapshot 當 rollback。helper 跟 node 同 release family 但可獨立啟動；helper 自更新亦須前任恢復路徑，不能要求故障 node 自救。

OS major 與板端更新**首版選現場維修**，不假設雙根分割。重灌前一致備份、還原後走 §7.2，舊去重資料不能直接恢復執行資格。

| 更新範圍／owner | 路徑與通過條件 |
|---|---|
| OS minor/security／release owner | 核准套件/映像先 canary，再由受限 helper 在維護窗執行明列動作；kernel、Python、TLS、renderer 都進 manifest |
| OS major、CM4 EEPROM/boot、board firmware／硬體 owner | 實際 carrier/eMMC/SD 上驗 USB boot/燒錄/救援 kit；方法均未查證，G-U 未通不出貨 |

owner 不接受現場窗口才重選全套 OTA，不能把 [Mender 根 repo 授權](../10-facts/buy-options.md#L56) 當完整部署 BOM。更新失敗停止 rollout，不以無限期手動 SSH 維護兜底。

| 更新成本／fallback | 明列代價 |
|---|---|
| 本版 | node/helper 6～9人週＋OS/boot恢復2～4；每盒現場major維護0.5～1人日，交通/停機另計，非報價 |
| 重選 Mender 或已驗 OS A/B | 至少+2外部家族，server DB/artifact store/runtime/付費功能及未定相依另盤；6～10人週探索後重算，不與本版雙養 |

# 9. 邊緣 process 切分與 ERP 邊界

同一程式家族不代表同一權限。IPC 驗 peer、訊息長度與授權，localhost 不是唯一保護；driver crash 不占命令 loop。

| process／權限 | 邊界 |
|---|---|
| raw broker、vendor decoder、Modbus/sensor、display/LED | 各自 UID/process；parser 只交 bounded IPC，無樹/CA/DB key |
| node／writer | node 再驗 schema/額度；writer 只在 north 持 history credential |
| issuer/policy／signer | 私鑰不供一般 parser 讀取；只簽用途及政策通過的 digest，不提供任意 bytes 簽名服務 |

不採 interim 的排程移交：鏡像不能自行排下一個工作或因 timeout 釋槽。F-41 的業務 queue/scheduler 始終由 ERP 擁有。

| 唯一 owner | 持有事實／排程責任 |
|---|---|
| Odoo | F-55 CMS、desired、SQ、deadline、single-flight、show參與者、binding操作意圖 |
| B0 registry | 已採納 binding/config、公鑰、撤銷、route；snapshot/writer只做同步與ETL |
| integration hub | C-23 連線級 IT cadence；domain module只貢獻型別/outcome，不各自建cron |

F-67～F-72 的新介面必須重驗，不能借 proven 名稱免測。C-20 的交易限制保留；驗收要經真正 Odoo 路由與模組安裝。

| ERP gate | G-D 驗收內容 |
|---|---|
| inbound | B0僅送management/business；單路由驗service identity/scope後寫inbox；真403/409/503，measurements不進ORM |
| outbound | 同交易queue write gate；archive阻新command/Manage、不宣稱取消running；fresh DB無連線回可操作錯誤 |
| C-20 | user transaction不遠呼；binding用pending意圖/receipt完成，不在handler任意rollback；測unauthenticated403與模組安裝 |

文件是 CMS 的逐 record 授權，不借 integration-hub 憑證。以下明示 F-59/F-72 的機制妥協，不聲稱裝置仍直連 ERP；任意外站也不保證離線可播。

| 文件通道 | 授權與內容檢查 |
|---|---|
| B0→ERP | rotatable per-record token、constant-time檢查；resolver供秘密，不進desired |
| unit→parent | signed document grant＋unit proof，核record/version/hash及child引用；inspection也不轉bearer token |
| 外部link | allowlist proxy逐次驗DNS解析、redirect、實際目的地，拒本機管理/metadata地址 |

簽署者不是 ERP 的任意簽名機。政策與環境啟動條件獨立核准，合法 publisher 範圍內的惡意內容仍是殘餘風險。

| 安全政策 | 執行規則 |
|---|---|
| ERP/B0權限 | viewer/editor/publisher/fleet admin分權；B0站點/動作scope與五分鐘累積額度由獨立管理入口核准，不信payload自稱user |
| 大範圍公開發佈/revoke | 超過五屏或批次revoke，帶外雙人核精確digest；一次性、五分鐘到期；拆小請求仍算累積額度 |
| staging restore | 無prod secrets/boot grant、connection archived、prod egress封鎖；環境標籤取host，不取複製DB |

Anthias 留在可換 reconcile 後，首客前 G-L 核完整映像、renderer、授權及可用修補線。支援線不合、重大可利用缺陷無處置或六個月無可信維護證據就停止新售並開替換 PoC；候選為既有 browser kiosk 加受限 display scheduler，不先自造 browser，也不保證兩週可換完。C-18 的 URI/id/order 與 C-19 的 repaint/navigation 行為均以播放器 fixture 驗；replacement 初留 3～4 人週探索、交付另估。

# 10. D-01～D-06 逐一走過

## 10.1 D-01 螢幕

- ERP 編輯、預覽、發布 manifest，含穩定項目 id、順序、時間窗及資產 hash；Apply 同交易寫 outbox。
- (a) 拉 B0；(b) 經 VLAN bridge；(c) 經站點快取與核准出口，不直達 ERP admin。
- 所求版本或拒絕；全媒體驗齊才 reconcile，先留 LKG/id map，再清 ghost assets。
- backend 增刪排序並讀回後提交 applied/hash；拒絕、延期、錯誤回 ERP，200 非畫面證據。
- 內容修改更新全部引用螢幕；同值不重置播放，舊 worker 不倒寫新版。
- ERP 工單交易產 MES 投影，頁面每五秒讀 parent JSON；idle、來源年齡、十五秒 stale、逐屏輪詢可見。
- 斷 WAN 續播 LKG；停頁不停代理不能報活。G-D 驗冷啟與實際換頁。

## 10.2 D-02 環境感測

- sensor 獨立程序，啟用才載 driver；故障不拖同機 display。
- ready 才一 Hz 採樣、三十秒平均；暖機、故障、無效時間先排除，不補零。
- 批次帶來源時間、schema、quality、sum/count、seq；先落 spool，再直 B0 或經 bridge。
- writer 去重、PG commit 才收據；Grafana 用 scoped view，ERP 不建逐樣本 rows。
- 八十 ppb 是 owner 的 HCHO 需求值，法規未查證；來源保存越線/恢復事件，停 ERP 可補告警。
- Fleet 顯示功能/品質/存活、不提供 Manage；承諾三年歷史前先過 G-S。

## 10.3 D-03 Modbus 旁路

- 操作員在 south 登記一次型號/穩定 id/map/serial/bus/address、通訊參數、符號/倍率/單位/採樣期。
- schema 核准並沿途接受才啟用；核 serial，無 serial 的換表人工建立新 generation，不按 IP 併史。
- RTU 明列隔離 RS485、穩定路徑及 VM passthrough；TCP 僅 poller→白名單502，無 WAN Modbus。
- 成熟 decoder 置低權限程序；近源蓋時、min/mean/max，有號 differentialPressure 驗正負 fixture。
- journal→B0→PG→Grafana；補傳不刷新 live，故障呈缺口；先做電力、差壓、門磁、壓縮空氣。
- N-20 供電、N-21 校準/4-20 mA/健康假值失效先驗；容器法規未查證，消防及職安氣體用途排除。

## 10.4 D-04 LED

- ERP 驗未過期 capability；空 supported_effects 拒絕。設定、效果、集合化 playlist 優先 intent。
- add/remove 用穩定 item id；resume 等 keyed job 須 API/UI/agent 都通過 G-C 能力 gate。
- controller 持本地 standalone/mode；模式轉換可拒絕/延期，失去 parent 不清空。
- 同機 timeline 本地執行；跨盒預載、非原子且不保證同步，不透過網路逐拍發指令。
- show 固定成員/能力快照；ERP 逐 strip 聚合 applied/refused/unknown/partial，不以單一回應算全場。
- 三形狀均走 §3；效果後斷電保留 UNKNOWN/鎖，無停止證據不重演。

## 10.5 D-05 門禁／出勤管理

- 指定 reader-management backend，只用供應商身分/健康/設定/事件 SDK；已有管理平台則依 F-34 做 ERP connector。
- reader id 綁硬體鍵/韌體政策；adopt 驗 nonce proof、環境/租戶及製造記錄，非只驗軟體 announce。
- 管理僅 site/parent/hostname、診斷/遙測啟用、回報週期；卡權限、開門排程、門狀態、lock/wipe 全排除。
- registry 寫 config_rev，reader 回 applied/refused/deferred；新 parent 試接/對帳成功才提交，失敗留有效舊設定。
- 120秒硬體簽心跳；boot及每十分鐘新 nonce attestation，比核准 boot/firmware；十五分鐘失鮮變 unknown，online≠verified。
- SAM/SE 不自動證明 measured boot；DESFire/OSDP/secure boot/簽署韌體能力、SDK與授權均未查證，具名硬體過 G-A。
- 出勤事件獨立耐久 log，帶 id/seq/時間品質、ERP receipt及隱私scope；法定保存先核，inspection I不傳。
- 三形狀只驗管理/事件；門鎖與本地控制迴路另案，stub不證安全門禁合格。

## 10.6 D-06 現場 HMI

- 來源是 partner 授權的唯讀 Modbus TCP 點表或指定 OPC UA Client/Server；PLC資料未取得，不假設已有 HMI/MQTT。
- poller→validator→逐 metric view 在上傳前分流；全 T2/cloud ERP 也必有本地 bridge/producer。
- reference HMI 為預置 HTML/JavaScript，由 bridge HTTPS供頁；每250ms讀 scoped snapshot，載頁/登入/即時值都不靠WAN。
- 一Hz來源暫定刺激/採樣至畫面 p95≤1.5秒、p99≤2秒，age>3秒 stale；更快須本地tap，north仍≤1Hz。
- 非敏感本地讀lease最多八小時，期限不可信/過期拒讀；PLC停而broker活也逐點stale。
- 指定 MQTT/Sparkplug HMI 才套 §6；驗晚加入、BIRTH、seq/bdSeq、STATE與受限Rebirth，JSON不冒稱標準。
- G-H 測斷WAN冷啟、停PLC、舊批次、慢reader、raw滿載及映射；未達事前SLO就改來源/profile，不稱通過。
- recipes、溫控、致動留本地；ERP/MES收事件，PG/Grafana做分析，三層分工。

# 11. 妥協清單

所有「滿足」均指設計處置，非已通過驗收。與 [brief §2](../03-brief.md#L25) 的可妥協項逐條列出代價；情境錨點不能用妥協取消，未閉合者仍在 §15。

| 需求／brief 選項 | 妥協 | 換到什麼 | 代價 |
|---|---|---|---|
| F-16/F-17，全走樹 | 管理及長期資料預設樹，HMI 本地直讀 projection | 本地低延遲、不依賴 WAN | 已驗深度外另 gate；不預建無限樹 |
| P0 pull-only | child 建連上的 stream 回傳，有限請求退路 | 同語意降低通知延遲 | 兩種 HTTP 承載仍須驗 proxy |
| 不用 MQTT/broker | 有實際設備／工具需求才加 | 生態接點、快取、扇出 | broker/client、隔離與適配成本 |
| ERP 當 root | ERP UI＋獨立 B0 registry，scheduler 仍 ERP | 限制 ERP 遷移對身分影響 | 兩個 owner 必須對帳，不是雙 writer |
| 最小兩服務 | 九個應用角色下限及完整基礎依賴 | 可維護、可恢復首屏 | 真實資源待量，不宣稱兩個 process |
| 平白 PG | history 第一筆即獨立實例 | ERP 備份／WAL 不被拖累 | 多一實例，不提供跨 DB 任意 join |
| NGSI 不留 | 不留作內部命令契約；具名需求才唯讀 facade | 降舊命令鏈負擔 | v2/LD、資料模型授權／mapping 另付 |
| 每節點自建 | 借成熟 libraries、broker、DB、OS/browser | 不造基礎引擎 | 自有的是語意／政策，第三方時鐘仍全部算 |
| F-46/F-47 | 有限媒體 RPO、物理未知保持 UNKNOWN | 不偽稱成功或安全重做 | 某些 job 禁用／人工對帳 |
| T2 立即撤銷、N-11 | 操作 lease 5 分鐘；HMI 讀 8 小時 | 有界離線運作 | 非全域即時；O-10 明確接受 |
| N-02 | inspection I 僅核准可讀資料 | 有條件 outbound 存活 | 對 proxy 不保密，敏感資料無 bypass 仍阻塞 |
| F-59/F-72 | unit 用 record grant/proof，ERP 端保留 record token | 秘密不穿 broker／inspection | 改原裝置直拉 token 機制，逐 record 驗權重測 |
| N-10 | app 遠端更新、OS major/boot 首版現場維修 | 不依賴未知 A/B 硬體 | 每盒人日、停機與交通費 |
| F-28 | 即刻讀 owner snapshot；新現場 report 走批次 refresh 請求 | 不建 per-command poll | 列新鮮度與等待，不保證瞬時到達 |

## 11.1 九個情境錨點

| 錨點 | 明確處理 |
|---|---|
| 1 Odoo 是產品、業務 desired | §9 保留 ERP queue/CMS/scheduler，不入逐樣本 rows |
| 2 台灣工廠、C-25 hostile T1 | §5.1 新隔離島與逐埠 fallback、施工費；G-NET，非假設既有隔離 |
| 3 三部署形狀 | §2 三圖、§5 conduits、G-NET；inspection 保密阻塞保留 O-01 |
| 4 單站數百 sensor／數十屏／三年 | §5 配額及 §7 估量／容量 gate，不假設只有一台機器樣本數 |
| 5 插電 CM4、封閉 T1 | §8 boot/OS ownership；§10.3 型號 profile，不要求改 T1 韌體 |
| 6 小團隊、種類／授權／制度成本 | §2 28+U、§14 首次/每站/年度分帳、O-09 雙人接手 |
| 7 最小一屏 | 無 history/MQTT/Grafana，但 DB/DNS/NTP/proxy/player 不省略 |
| 8 D-05/D-06 下一步 | §10.5 管理驗證、§10.6 本地 HMI，G-A/G-H 非預留欄位而已 |
| 9 已踩過的坑 | §11.3 C/B 回歸，換產品不當自動修復 |

## 11.2 M／F／N 逐需求矩陣

| ID | 處置／具體位置 |
|---|---|
| M-01 | §13 首用與退出 gate；無 fleet 證據不刪 binding |
| M-02 | §2 外部 K、process、repo、語言分帳，未知 U 阻 G-L |
| M-03 | §2/§5 三形狀，各自 N-18；不依共享主機假設 |
| M-04 | §5.1 T1 隔離島、south 只向 north、逐 VLAN bridge |
| M-05 | G-L/O-08 逐發行物法律適用；無 blanket 零義務 |
| M-06 | §2/§13 月度安全、季度支援與 EOL 遷移 |
| F-01 | §5.2/§10 本地聚合，north 每 measure ≤1 Hz |
| F-02 | §5.2 近源 sample_time，未知時間不冒充新鮮 |
| F-03 | §9 ERP 只收 business/management |
| F-04 | §5.2 ready/quality gate、HMI 自行 stale |
| F-05 | §10.2 warm-up/fault 與缺值可見 |
| F-06 | §3.3/§10.4 capability 版本，缺失拒新 effect |
| F-07 | §9 sensor/driver 獨立 UID/process |
| F-08 | §7 三年 raw，history 功能首用前 G-S |
| F-09 | §7 dirty bucket、roll-up、分區 GC |
| F-10 | §7 node 業務門檻＋ERP 值班通知；Grafana 畫線 |
| F-11 | §7 immutable typed series revision、混版資料不 ALTER 大表 |
| F-12 | §7 measures 與 CQ/event store 分開 |
| F-13 | §7 dashboards-as-code、重佈署 drift 檢查 |
| F-14 | §7 stable series id，改名不斷史；換表新 generation |
| F-15 | §2 最小屏不開 history |
| F-16 | §2 stackable 同協定，先驗兩 intermediate bridge |
| F-17 | §5 child 撥 parent；祖先 routing metadata 非任意 peer 權限 |
| F-18 | §5.1 L2 retrofit＋§9 parser 隔離，不靠 ACL 單層 |
| F-19 | §3 穩定 unit 與可變 path，§4 credential rotation |
| F-20 | §3 unit/function 階層、§10 多功能與逐目標結果 |
| F-21 | §5 outbound，IP 不是 identity |
| F-22 | §10.3 map/serial/bus、換址與換表人工核實 |
| F-23 | §5 DNS/discovery 只定位，信任由 voucher 驗證 |
| F-24 | §4 bridge 也是 T2、同續期撤銷規則 |
| F-25 | §2 node 可同時 unit/bridge，權限按 function 分 |
| F-26 | §3 announce/南側一次登記，自動 Fleet projection |
| F-27 | §5.2 有效裝置時間＋monotonic elapsed，5 分鐘 offline |
| F-28 | §11 批次 refresh，等待可見、不假稱即時到達 |
| F-29 | §3 啟動及週期 snapshot/反熵自癒 |
| F-30 | §5/§9 心跳記最新 snapshot，僅狀態轉移入 ERP |
| F-31 | §3 schema grant、未知 id/key 拒收 |
| F-32 | §3.1/§7 schema-before-data 屏障、舊版保留至排空 |
| F-33 | §9 registry commit 可讀後才建 ERP managed projection |
| F-34 | §10.5 vendor 平台做 connector，不重寫控制管理 |
| F-35 | §4 預置 factory/recovery 根，高於單站 |
| F-36 | §4 裝置產鑰、QR fingerprint、station、RMA |
| F-37 | §4/§5 provisioning 在管理區，不開 device→admin |
| F-38 | §3 actual/applied 是可快照讀的版本事實 |
| F-39 | §3/§9 function manifest 驅動 schema/outcome；新 backend＋ERP 模組，標準 adapter 另計 |
| F-40 | §4/§9 tenant pinning，初期每站 root；多租戶共享另 gate |
| F-41 | §9 ERP owns SQ/scheduler，site scoped proof、無 inbound |
| F-42 | §13 不可信網路／managed hardware 首售先安全 gate；N=3 管理容量複審 |
| F-43 | §9 ERP write gate 建業務 intent/job |
| F-44 | §10.4 timeline 本地，無網路同步起跑承諾 |
| F-45 | §10.4 standalone/mode owner 保留 |
| F-46 | §3.1/§5.2 owner、收據、重讀、有限媒體 RPO |
| F-47 | §3.2 intent/job 二分，非冪等物理保證縮限 |
| F-48 | §4 簽章與用途/收件者/政策、§9 defacement 門 |
| F-49 | §3.2 所有 key/version outcome 進 ERP |
| F-50 | §3.2 unknown/timeout/late result 分列 |
| F-51 | §3.2 unit dedupe，ERP sequence/single-flight/deadline |
| F-52 | §3.1 receipt 與 worker 結果分離 |
| F-53 | §3.2 backend failure 不包 success |
| F-54 | §3.2 refuse/defer、同值無副作用、同版 pending 可恢復 |
| F-55 | §10.1 ERP CMS、穩定 item id、device id map |
| F-56 | §10.1 versioned manifest pointer，不塞 flat attribute |
| F-57 | §10.1 idempotent reconcile、完整候選才移除 ghost |
| F-58 | §10.1 content 變更重新發布所有引用 screens |
| F-59 | §9 per-record token 保留於 CMS origin，unit 改 grant/proof 的明示妥協 |
| F-60 | §10.1 所求版本或拒絕、hash 比對 |
| F-61 | §9 display reconcile 可換，player 退場 gate |
| F-62 | §13 輕量 CMS 不裝 website builder，重內容模組按需 |
| F-63 | §9/§10.1 ERP projection、逐屏 polling、idle/freshness、line scope |
| F-64 | §9 ERP 排序；第二 adapter saga 才評 Workflow |
| F-65 | §13 command correctness 前不做 Workflow |
| F-66 | §3 無依賴 delivery 的 edge job engine |
| F-67 | §5.2/§9 inbound durable replay 2 日、volume class |
| F-68 | §9 單 inbound、auth-before-write、真實 status |
| F-69 | §9 單 queue write gate，無平行 outbound transport |
| F-70 | §9 archive 阻 command/Manage；不假取消已開始者 |
| F-71 | §9 fresh DB 無連線明確錯誤 |
| F-72 | §9 CMS per-record route 不借 hub token；裝置改 parent grant 的明示妥協 |
| N-01 | §5.1 三形狀具體 conduit、G-NET 先測再售 |
| N-02 | §4.3 M/I 明示 trust／保密限制，T1 實體圍堵 |
| N-03 | §4.2 resolver、secret 分流、DB/HMI 認證 |
| N-04 | §7.2/§9 staging 無 prod grant/key/egress |
| N-05 | §3 owner 單寫、attribution、§9 無敏感 body/header call log |
| N-06 | §5.1 hold/client/proxy 對齊，worker 不綁 delivery deadline |
| N-07 | §9 supervisor stopped marker、真實 readiness、G-U |
| N-08 | §13 預設 INFO、log rotation/配額、禁現場 DEBUG |
| N-09 | §7.2 每個 state owner/backup/escrow/restore |
| N-10 | §8 app/OS/boot 全有更新 owner、版本支持 gate |
| N-11 | §5.2 LKG pin，離線新授權有界、實際機台控制留本地 |
| N-12 | §5/§9 parent、ERP public/internal、content origins 分設 |
| N-13 | §2 真實一屏依賴與 G-U 足跡，不裝可選 history |
| N-14 | §4.2/§5.2 G-T 有效時間、RTC/受控校時 |
| N-15 | §5 配額/心跳，§7 samples 估算，§10 MES/HMI 分開 |
| N-16 | §3.3 memory、fake sensor/PLC/LED、reader stub |
| N-17 | §14 real ERP install/inbound/e2e、soak/race，產品 PoC 均未跑 |
| N-18 | §14 每個可售 shape/profile 首用前全程驗收 |
| N-19 | G-D 真實 inbound 403 與模組安裝，綠 bundle 不代證 |
| N-20 | §10.3 7A-BOX 供電/介面量測或更換 carrier，G-T/G-U |
| N-21 | §10.3 旁路、品質失效、校準及排除安全用途；法律未查證 |
| N-22 | §13 Parts 中文筆記、vendor files/hash、package registry |
| N-23 | §13 ERP zh_TW 分模組 export/merge，不覆蓋既有翻譯 |

## 11.3 C／B 回歸責任

| 已知教訓 | 不得重現的處置 |
|---|---|
| C-01、C-21、C-22 | 新 envelope 不繼承 forbidden-char 編碼；collection 用 manifest、stable item id/local map，G-D |
| C-02、C-03、C-04、C-05、C-06、C-07、C-08 | 原子 outbox、receipt≠完成、每 key CQ、完整 snapshot/tombstone、UNKNOWN，G-C |
| C-09、C-10、B-10、B-11、B-12 | auth-before-write、tenant pin、bootstrap 停用、signed revoke、無任意 URL／admin provisioning，G-PKI |
| C-11、C-15、B-09 | schema revision/activation gate、unknown capability 拒絕，G-S/G-D |
| C-12 | outbound parent discovery＋穩定身分，改址測試 G-NET |
| C-13、B-14 | 首次/重啟 snapshot、actual measure、CQ 批次補讀，G-C/G-D |
| C-14、B-13 | 固定 compose project/stop marker，crash 可重啟、deliberate stop 不復活，G-U |
| C-16、C-17 | 可觀測 partition GC、dashboard drift 檢查，G-S |
| C-18、C-19 | player URI/id/order、禁止自導航與長期 repaint soak，G-D |
| C-20、C-23 | ERP 本地交易、薄 adapter、連線級 cadence、真 403，G-D |
| C-24、C-25 | record-scoped parent cache、C25 新隔離島，G-NET |
| B-01、B-02、B-03、B-04 | UNKNOWN 不當 error/not-run，版本 outcome、所求文件或拒絕，G-C/G-D |
| B-05、B-06、B-07、B-08 | 所有 LED 結果、backend 真錯誤、非同步 worker、keyed recovery，G-C |

# 12. §9 開放問題的最終答案

以下依 [00 §9](../00-requirements.md#L271) 的實際十九題順序逐題作答；原文是 bullets，此處編號為核對用，不沿用 P0/interim 的縮短清單。

| 題號／原題來源 | 本稿答案 |
|---|---|
| [1 NGSI 留否](../00-requirements.md#L273) | 不作內部契約；它的資料模型/互通有價值，具名 reader 才做有限唯讀 v2/LD export，無證據有不可自建的本案必需功能。 |
| [2 registry／issuer](../00-requirements.md#L274) | B0 registry、隔離單一 operational issuer；factory/recovery 根只授權用途，不另發平行營運身分。 |
| [3 channel／TLS](../00-requirements.md#L275) | node HTTPS stream/有限批次，TLS 由明列 parent endpoint 終結，雙向物件身分獨立；MQTT 僅條件資料面。 |
| [4 命令狀態 owner](../00-requirements.md#L276) | ERP desired/SQ/single-flight/deadline；unit actual/CQ/dedupe；UNKNOWN 保鎖，parent 僅鏡像。 |
| [5 時序庫](../00-requirements.md#L277) | 首歷史即獨立 PG 實例，north writer，純 SQL dirty-bucket roll-up，不用 TSL policy。 |
| [6 告警與接收者](../00-requirements.md#L278) | node 算業務門檻事件，ERP 交站點值班者；Grafana 給 ops 健康／畫線，不做第二業務規則源。 |
| [7 最小低於兩服務](../00-requirements.md#L279) | 不承諾；中央五角色、屏端四角色加基礎 daemon，無 history/broker，實際 footprint G-U。 |
| [8 player／reconcile](../00-requirements.md#L280) | 先釘 Anthias；不過支援 gate 則 kiosk candidate PoC，reconcile/id map 留 unit，中央只管理 manifest。 |
| [9 cloud site agent](../00-requirements.md#L281) | site bridge 用自己的 T2/site scoped key 主動 443，無 inbound；無 site需求的一屏可直連 B0。 |
| [10 信任根／discovery／N](../00-requirements.md#L282) | 預置 factory/recovery 根＋env voucher，DNS 只定位；不可信網路/managed sale 立即 gate，建議 N=3 作營運容量複審。 |
| [11 Control-Semantic](../00-requirements.md#L283) | 身分/存活/非控制設定及事件在本案；door/recipes/致動 fabric 不存在也不在本案，不繞道 generic job。 |
| [12 backup／staging](../00-requirements.md#L284) | §7.2 每 state owner 一致 backup、獨立 escrow/epoch、restore 隔離；staging 無有效 grant/key/egress。 |
| [13 哪些 process 分開](../00-requirements.md#L285) | 同 node release 合程式不合權限；sensor/poller/raw decoder/display/LED、writer、issuer、helper 分 UID/process。 |
| [14 自建界線](../00-requirements.md#L286) | 只建業務契約、政策、adapter/ETL、協調；不建 DB/browser/OS/bootloader/broker/crypto/備份引擎。 |
| [15 管理中心在哪](../00-requirements.md#L287) | ERP UI over B0 registry；業務仍 Odoo，不預建另一套通用管理 UI。 |
| [16 T1 代表誰建](../00-requirements.md#L288) | 操作員在 south 登記 profile 一次，south 建 representative 並 announce；未知來訊不自動建 id。 |
| [17 直連與樹](../00-requirements.md#L289) | 管理/文件/長期資料走樹，HMI 本地 projection 例外；直寫 store 先驗 scoped token、撤銷、buffer、逐 id 等價及 firewall。 |
| [18 無人閉環](../00-requirements.md#L290) | 保留：inbound 不自動寫下行。第二 adapter saga 才評 Workflow，預設只能提案，致動另案審查。 |
| [19 south/gateway 合併](../00-requirements.md#L291) | 合為同一 stackable node release family，保留角色隔離與 backend processes，不合成一個特權 parser。 |

# 13. 第一天必做清單與觸發表

第一天是開始建置與驗證的範圍，不是一天工期。先凍結 wire/owner/UNKNOWN/restore 政策、首屏 BOM、部署 profiles、維護人與驗收門檻；首屏禁用未驗 job 類別，輕量 CMS 不裝 website builder。INFO、log rotation/配額、單 outbound call 無 headers/body 的稽核格式、Parts 中文筆記與 vendor SHA256、各 Odoo 模組 zh_TW export/merge 一起交付，不留成售後工作。

| 觸發 | 付下一筆／退出條件 |
|---|---|
| 首屏／不可信網路／managed hardware 首售 | G-L/G-PKI/G-NET/G-T/G-U/G-R/G-D；安全與恢復不分期 |
| 第一個 job | G-C 加該 backend 效果恢復證據；無法觀察或隔離者禁用 |
| 第一個 sensor 歷史／告警 | G-S＋近源 event journal；不以 snapshot 冒充離線告警 |
| 第一個 T1 | C25 retrofit、profile、RS485/map、G-M 或 Modbus 驗收；原網路不能隔離就停止施工放行 |
| 第一個 D-06 | 本地 producer/view/HMI，G-H；高樣本量同時跑 G-S |
| 第一個 MQTT／客供 broker | G-M，按需 ingress/export；不自動啟 unit binding |
| 確認第二 unit binding 淨收益 | G-X、G-C 同 oracle、額外 library/混版成本再核 |
| 第一個 D-05 | G-A＋事件隱私/保存政策；硬體 attestation 不是 UI 預留欄位 |
| 第二 adapter 需要 saga | G-C 全通後才提 Workflow；無人致動仍禁 |
| 第三站／跨環境營運 | N=3 容量、provisioning、tenant/restore 與接班複審，不當安全延期門檻 |
| EOL 前六個月／重大可利用弱點 | release owner 開遷移；24h 分級/縮暴露，7 日修補或繼續隔離，不是供應商 SLA |
| 刪除 binding／元件 | 全 fleet 已遷移、失聯者有退役處置、90 日零依賴，資料/keys 可恢復後才刪；年度 M-01 檢查 |

# 14. PoC 清單與人週

## 14.1 具名 gates

全部 gate **未執行／未通過**；「設計修補」不表示解除致命或批准部署。先定輸入、門檻與 owner，失敗不得排除錨點。外審須針對本設計，不借品牌或上游稽核當產品認證。

| Gate／owner | 要回答的問題與通過條件 |
|---|---|
| G-C 契約／正確性 lead | ERP commit、fetch、unit effect/CQ、receipt 各斷一次；八天 cursor 加新 SQ、GC/舊 key/同版異值。已受理不靜默消失，不明動作不重做/解鎖，所有 key/版本可觀察。 |
| G-PKI 安全 lead＋外審 | voucher/CSR、假 parent、跨 env/unit 重放、過期續期、revoke/clone、失陷鍵輪替、resolver 冷啟。驗權前零持久業務寫入，無 secret 入 DB/URL/log，舊鍵不復活。 |
| G-NET 交付＋客戶 IT | 三形狀完整 flow、occupied 443、認證 CONNECT、stream/batch、inspection M/I。真實 policy 下完成或明示不支援；C25 同 AP/跨 AP/有線/lateral 全拒，無 site inbound。 |
| G-T 硬體＋ops | 零時間、未來/回撥、7 日斷電、RTC 故障、NTP 失聯及 carrier 電壓。無效資料不 fresh，無效時基不開新授權；可信恢復不放寬一般 TLS。 |
| G-U release＋硬體 | app/helper 更新、斷電、資產不足、錯硬體、schema 回退、OS major/boot 現場救援、deliberate stop。state/floor 不回退，canary 可恢復，完整足跡落已核硬體預算。 |
| G-R ops＋安全 | ERP/B0/unit 不同時間點備份、整卡損毀、escrow 恢復、counter 登錄遺失與 staging。先隔離再對帳；無新鮮 epoch 不開權，RPO/gap 可見，8h RTO 目標待 owner 核。 |
| G-D ERP/display lead | 真實 Odoo 模組安裝、403、archive/no connection、所有 outcome、manifest/錯版/SSRF、實際換頁/長期 repaint、停頁不停代理。版本與錯誤不假完成，zh_TW/stop 行為正確。 |
| G-S 資料 lead | schema 先後、warm-up、負差壓、換表、PG commit/ack、遲到三年內重算、partition/restore；逐 sample id/roll-up 與來源一致，量 bytes/sample、WAL、RTO。 |
| G-M 整合＋安全 | 具名 T1/韌體/client/broker、fixed topic、cert 驗證、client-id、retained、dynsec、slow reader/churn。來源不可冒名，raw 故障不耗 node/n 保留資源；交接前 loss 如實標示。 |
| G-H HMI＋partner | 取得真 PLC 點表/模式/認證、local producer、斷 WAN 新 browser 冷啟、stale/alias/STATE/Rebirth。測刺激至畫面達 §10.6 或 O-06 的事前 SLO；不開製程寫入。 |
| G-A reader＋安全 | 具名硬體 SDK，nonce attestation/boot policy、adopt/config actual/liveness/revoke/事件；缺證據不得 verified，控制 loop 不入 queue，法定保存/隱私先核。 |
| G-L release＋法律 owner | 完整 SBOM 展開 U、每 library/runtime/OS/backup/cert/硬體線的 LICENSE/支援/負責人；取得 artifact/修補來源，無未查證權利支撐出貨。 |
| G-X 架構＋整合 | 同硬體/負載/簽章/隔離/投影比較 unit HTTPS 與 MQTT、第二 reader 工時、fan-in/恢復/遷移；有具名收益才啟 B，未建候選不宣稱跑過。 |

## 14.2 不重複成本

估工假設兩名可接班工程師、沿用 CMS/display，先做單站一屏，不含控制產品。共用工作只計一次；P2/P6 範圍不同不能直接相減，人週不是交期，PoC 也可能失敗。

| 工作包 | 首屏人週／後續增量 | 內容／責任 |
|---|---|---|
| H0/node/ERP 基礎契約 | 5～7 | G-C 的通用 oracle、snapshot、binding、outbox；未啟 jobs 的 backend 工作另計 |
| PKI/policy/製造/escrow | 6～9 | G-PKI 與 G-R 安全部分，含外審整改配合、不含外部費用 |
| display/CMS/文件/live JSON | 4～6 | G-D 與 record grant 機制變更 |
| app/helper 更新＋OS/boot 恢復 | 8～13 | §8 的 6～9 加 2～4，不重加其他表工時 |
| 部署/時間/整合驗收 | 4～6 | G-NET/G-T/G-U/G-R 共用環境與首站測試 |
| 首屏合計 | 27～41 | 外審排程、法律、硬體、交通、IT 等待另計；不是 P6 的九人週 |
| 首個 D-02＋history | +4～7 | sensor driver/事件、G-S、Grafana；無歷史的即時功能可先裁小 |
| 首個 T1/第二 bridge | +3～5 | 隔離施工工件、profile、雙 hop、RTU；料件/施工人日不重算開發 |
| 首個 D-04 | +4～7 | keyed backend/UNKNOWN/模式/show 全程，不只 transport |
| 普通 MQTT／reference HMI | +3～5／+3～5 | G-M 與 G-H，各首個共用框架；重疊投影去重估算 |
| Sparkplug／D-05 管理 | +4～8／+6～10 | codec/互通；硬體 verifier/SDK/設定，非門鎖控制產品 |
| 每型號／consumer／站點 | 0.5～1／0.5～1／0.5～1.5 | 設定/聯測；不重收一次性 binding 開發費 |
| 年度共同維護 | 6～10 | 含 ERP 遷移預留 2～4、輪替/restore、OS/支援與接班；現場 major 維修另計 |
| 第二 binding／平台退出 | 6～9／12～24 | 新 binding 外審與 fleet 過渡另計；退出含資料/權限/consumer，不叫一條 SQL |

## 14.3 P1 逐 finding 處置（40 條）

由原始標題正規化得 305 條：6 致命、245 重大、54 次要。以下逐列收錄全部 **251 條致命／重大**，每列一個 canonical ID 與來源；所有 gate 仍未通過。

| 原始 finding／來源 | 嚴重度 | 具體 disposition、章節與 gate |
|---|---|---|
| [P1/security-01](../30-critiques/P1/security.md#L32) | 重大 | 設計修補：§4.1 簽 audience/env/function/epoch，接收者逐欄驗；G-PKI。 |
| [P1/security-02](../30-critiques/P1/security.md#L40) | 重大 | 設計修補：§4.2 預置根及 env voucher，不用 adopt 回傳公鑰作 TOFU；G-PKI。 |
| [P1/security-03](../30-critiques/P1/security.md#L48) | 重大 | 設計修補：§4.2 CSR proof/QR fingerprint、異鍵衝突隔離、adopt 停 bootstrap；T2 clone 成本接受，G-PKI。 |
| [P1/security-04](../30-critiques/P1/security.md#L56) | 重大 | 設計修補：§4.1 parent 驗子樹與來源，不採 child 自報 ACL/CN；G-PKI。 |
| [P1/security-05](../30-critiques/P1/security.md#L64) | 重大 | 設計修補：§10.1 manifest/逐資產 hash，cache 不可信，驗齊才切；G-D。 |
| [P1/security-06](../30-critiques/P1/security.md#L72) | 重大 | gated PoC：§4.3 I 僅核准非敏感資料＋雙向 proof，秘密不以 bearer 穿 proxy；G-NET，保密無解仍阻塞。 |
| [P1/security-07](../30-critiques/P1/security.md#L80) | 重大 | 接受代價：§4.2 五分鐘操作 lease、只讀撤銷查詢，離線不瞬間撤銷且不擦 LKG；O-10/G-PKI。 |
| [P1/security-08](../30-critiques/P1/security.md#L88) | 重大 | 設計修補：§4.2/§7.2 私鑰分流 escrow、kid、獨立 recovery 根；G-PKI/G-R。 |
| [P1/longevity-01](../30-critiques/P1/longevity.md#L31) | 重大 | 接受代價：§2 K/實例/庫分帳，broker 不進首屏；完整 U 由 G-L 補，不能拿 14/15 比排名。 |
| [P1/longevity-02](../30-critiques/P1/longevity.md#L53) | 重大 | gated PoC：§6 不依賴 persist-sqlite，raw 隔離；§13 修補時限，G-M/G-L 核固定版與來源。 |
| [P1/longevity-03](../30-critiques/P1/longevity.md#L65) | 重大 | 接受代價：§6 Paho 只在需要處安裝、成熟庫不自寫；G-L 核支援，替換需 G-X。 |
| [P1/longevity-04](../30-critiques/P1/longevity.md#L75) | 重大 | 設計修補：§5.1 單 HTTPS trunk，stream/batch 常態同 oracle，不留冷 WSS 備援；G-NET。 |
| [P1/longevity-05](../30-critiques/P1/longevity.md#L85) | 重大 | 接受代價：§13 無 MQTT 需求不裝 broker；犧牲 unit 原生 MQTT 換較小首屏配置，G-X 可重評。 |
| [P1/longevity-07](../30-critiques/P1/longevity.md#L105) | 重大 | 設計修補：§7.2 broker 空 cache、最新授權/ACL 同步後開 listener，不恢復舊 dynsec；G-R。 |
| [P1/longevity-08](../30-critiques/P1/longevity.md#L115) | 重大 | 設計修補：§4.2 離線根授權線上用途鍵與獨立失陷恢復，不 pin 死線上鍵；G-PKI。 |
| [P1/correctness-01](../30-critiques/P1/correctness.md#L11) | 重大 | 接受代價：§3.2 effect/CQ 間未知保鎖，backend keyed query 或改 intent，否則禁 job；G-C。 |
| [P1/correctness-02](../30-critiques/P1/correctness.md#L17) | 重大 | 設計修補：§3.1 每120秒/重連批次 CQ，ERP commit 才最終 receipt；G-C。 |
| [P1/correctness-03](../30-critiques/P1/correctness.md#L23) | 重大 | 設計修補：§3.2 timeout 不釋衝突資源，停止證據才解；deadline 不延命；G-C。 |
| [P1/correctness-04](../30-critiques/P1/correctness.md#L29) | 重大 | 設計修補：§3.2 observed/pending/applied 與 refusal 分開，單 function reconciler；G-D。 |
| [P1/correctness-05](../30-critiques/P1/correctness.md#L35) | 重大 | 設計修補：§10.1 所求 immutable 版本/全資產就緒，先 pin LKG 再切換；G-D。 |
| [P1/correctness-06](../30-critiques/P1/correctness.md#L41) | 重大 | 設計修補：§3.1 schema grant 先耐久啟用，資料帶 revision、缺 capability 拒絕；G-S。 |
| [P1/correctness-07](../30-critiques/P1/correctness.md#L47) | 重大 | 設計修補：§5.2 sample/event 來源 journal，分等 PG/ERP receipt；PUBACK 不交接；G-C/G-S。 |
| [P1/correctness-08](../30-critiques/P1/correctness.md#L53) | 重大 | 設計修補：§5.2 未確認 CQ 無 TTL、已確認90日、防重 floor 長存，滿額停受理；G-C。 |
| [P1/correctness-09](../30-critiques/P1/correctness.md#L59) | 重大 | 設計修補：§5.2 sample_time/quality、未知不 fresh，既有 HMI 自計 stale；G-T/G-H。 |
| [P1/correctness-10](../30-critiques/P1/correctness.md#L65) | 重大 | 設計修補：§7.2 獨立 epoch 登錄、restore 停寫對帳，舊 key 不重跑；G-R。 |
| [P1/scenarios-01](../30-critiques/P1/scenarios.md#L55) | 重大 | 設計修補：§5.1 逐 hop 443 明含 record-scoped 內容，無 unit→ERP 洞；G-NET/G-D。 |
| [P1/scenarios-02](../30-critiques/P1/scenarios.md#L61) | 重大 | gated PoC：§5.1 不依賴 Upgrade，驗普通 HTTPS/認證 proxy；不通仍阻塞，G-NET。 |
| [P1/scenarios-03](../30-critiques/P1/scenarios.md#L67) | 重大 | 設計修補：§9/§10.1 ERP business projection→parent 同源 JSON、逐屏 last-poll；G-D。 |
| [P1/scenarios-04](../30-critiques/P1/scenarios.md#L73) | 重大 | 設計修補：§7.1 PG transaction 收據前不回收來源 spool，PG 停機不假成功；G-S。 |
| [P1/scenarios-05](../30-critiques/P1/scenarios.md#L79) | 重大 | 設計修補：§10.3 commissioned id/serial/map，無 serial 換表人工確認新 generation；G-S。 |
| [P1/scenarios-06](../30-critiques/P1/scenarios.md#L85) | 重大 | 接受代價：§10.4 同機 timeline、跨盒非原子與逐 strip partial，不用網路同步；G-C/G-D。 |
| [P1/scenarios-07](../30-critiques/P1/scenarios.md#L91) | 重大 | 設計修補：§5.2/§10.5 來源 event journal＋ERP receipt，無來源重讀能力明列前置 loss；G-A。 |
| [P1/scenarios-08](../30-critiques/P1/scenarios.md#L97) | 重大 | gated PoC：§10.6 真來源、採樣至畫面 SLO、3秒 stale、本地冷啟；G-H。 |
| [P1/scenarios-09](../30-critiques/P1/scenarios.md#L103) | 重大 | gated PoC：§4.2/§5.2 有效 RTC/time gate，零時間只 LKG、不略過 TLS；G-T。 |
| [P1/ecosystem-01](../30-critiques/P1/ecosystem.md#L7) | 重大 | 設計修補：§6 固定 vendor topic 對可信 credential/隔離埠 profile，不逼韌體改名；G-M。 |
| [P1/ecosystem-02](../30-critiques/P1/ecosystem.md#L15) | 重大 | gated PoC：§10.6 上傳前分本地 feed，量刺激至畫面而非 RTT；G-H。 |
| [P1/ecosystem-03](../30-critiques/P1/ecosystem.md#L23) | 重大 | 設計修補：§5.2/§6 HMI 自計 max_age/quality，不等 retained 刪除通知；G-H。 |
| [P1/ecosystem-04](../30-critiques/P1/ecosystem.md#L31) | 重大 | 設計修補：§7/§9 consumer 綁 stable id/scope，path 變更重建訂閱及 ACL；G-M/G-D。 |
| [P1/ecosystem-06](../30-critiques/P1/ecosystem.md#L47) | 重大 | gated PoC：§6 完整 BIRTH/alias/STATE/seq 與有限 Rebirth，非全面禁 NCMD；G-H。 |
| [P1/ecosystem-08](../30-critiques/P1/ecosystem.md#L63) | 重大 | 接受代價：§13 報價前 IT/profile 核准，MQTT 名稱不當合規；§4.3 不支援組合保留，G-NET。 |

## 14.4 P2 逐 finding 處置（43 條）

| 原始 finding／來源 | 嚴重度 | 具體 disposition、章節與 gate |
|---|---|---|
| [P2/security-01](../30-critiques/P2/security.md#L17) | 重大 | gated PoC：§4.3 trust profile 固定、不因握手失敗降級；I 不保密、敏感無 bypass 阻塞，G-NET。 |
| [P2/security-02](../30-critiques/P2/security.md#L27) | 重大 | 設計修補：§6/§9 移除內嵌 MQTT parser，raw/validator 分 UID且無樹鍵；G-M。 |
| [P2/security-03](../30-critiques/P2/security.md#L37) | 重大 | 設計修補：§4.1 unit report/CQ 原簽章保留到 root，裝置產鑰只送 CSR；G-PKI。 |
| [P2/security-04](../30-critiques/P2/security.md#L47) | 重大 | 設計修補：§4.2 serial/key/env/tenant voucher 限制收養，mDNS 不授信；G-PKI。 |
| [P2/security-05](../30-critiques/P2/security.md#L57) | 重大 | 設計修補：§4.2 image 無私鑰、所有 T2 adopt 後停 bootstrap；T2 clone 保留限制；G-PKI。 |
| [P2/security-06](../30-critiques/P2/security.md#L67) | 重大 | 設計修補：§9 獨立政策 scope/累積額度、帶外批准 digest，非 ERP 任意簽名機；G-D/G-PKI。 |
| [P2/security-07](../30-critiques/P2/security.md#L77) | 重大 | 設計修補：§9 record grant、manifest/asset hash、redirect/DNS目的地重驗，G-D。 |
| [P2/security-08](../30-critiques/P2/security.md#L87) | 重大 | 接受代價：§4.2 五分鐘授權 lease、過期停敏感文件/新工作，舊資料隔離不靠自報時間；O-10/G-PKI。 |
| [P2/security-09](../30-critiques/P2/security.md#L97) | 重大 | 設計修補：§4.2/§7.2 encrypted secret、獨立 issuer UID、escrow/recovery 根，G-PKI/G-R。 |
| [P2/longevity-01](../30-critiques/P2/longevity.md#L15) | 致命 | gated PoC：§8 明選 register app/helper 更新＋具名 OS/boot 現場恢復，驗自更新/斷電/回退，G-U；未通不出貨。 |
| [P2/longevity-02](../30-critiques/P2/longevity.md#L23) | 重大 | 接受代價：§2 28+U 下限含 HTTP/crypto/driver/OS/client，G-L 完整 BOM，不用舊12/13總數。 |
| [P2/longevity-03](../30-critiques/P2/longevity.md#L31) | 重大 | 設計修補：§4.2 七日 cert/三十日受限續期、G-T 長假/RTC；不讓過期證進一般通道。 |
| [P2/longevity-04](../30-critiques/P2/longevity.md#L38) | 重大 | 設計修補：§4.2 alg/kid/trust set、離線失陷恢復與獨立 escrow；年度/變更複審 G-PKI。 |
| [P2/longevity-05](../30-critiques/P2/longevity.md#L45) | 重大 | 設計修補：§7.2 跨 owner backup manifest、新 epoch＋對帳，不複製活SQLite或從cert恢復撤銷權；G-R。 |
| [P2/longevity-06](../30-critiques/P2/longevity.md#L52) | 重大 | gated PoC：§5 心跳留最新狀態、關鍵交易 WAL/FULL 候選，G-U/G-S 驗 bytes/day、媒體flush，不宣稱 NORMAL 保斷電。 |
| [P2/longevity-07](../30-critiques/P2/longevity.md#L59) | 重大 | 接受代價：§9 scheduler 保留 ERP，§14 每年ERP遷移2～4人週；G-L 核既有授權，不為少工移交權威。 |
| [P2/longevity-08](../30-critiques/P2/longevity.md#L66) | 重大 | 設計修補：§7 第一歷史即我方獨立PG、具名ops與watermark遷移/RTO；G-S。 |
| [P2/longevity-09](../30-critiques/P2/longevity.md#L73) | 重大 | gated PoC：§9 首客前核 Anthias/renderer 支援與license，觸發替換有候選探索及預算；G-L/G-D。 |
| [P2/correctness-01](../30-critiques/P2/correctness.md#L9) | 重大 | 設計修補：§3.1 ERP 業務/outbox同交易、交易外只搬運；未提交不稱受理，G-C。 |
| [P2/correctness-02](../30-critiques/P2/correctness.md#L15) | 重大 | 接受代價：§3.2 backend keyed 證據或 intent；效果後無CQ保持UNKNOWN，禁盲補跑；G-C。 |
| [P2/correctness-03](../30-critiques/P2/correctness.md#L21) | 重大 | 設計修補：§5.2 未交接結果pin，tombstone/floor與詳細CQ分離，容量先停受理；G-C。 |
| [P2/correctness-04](../30-critiques/P2/correctness.md#L27) | 重大 | 設計修補：§3.2 timeout不取消、不放single-flight，edge起跑驗序號/原期限；G-C。 |
| [P2/correctness-05](../30-critiques/P2/correctness.md#L33) | 重大 | 設計修補：§3.2 同版pending可恢復、observed/applied分開，舊worker不得倒寫；G-D。 |
| [P2/correctness-06](../30-critiques/P2/correctness.md#L39) | 重大 | 設計修補：§3.1 主動批次inventory/缺項對帳，單向complete遺失亦恢復；G-C。 |
| [P2/correctness-07](../30-critiques/P2/correctness.md#L45) | 重大 | 設計修補：§3.1 snapshot R＋其後watch，ERP業務/cursor同交易，410查owner archive；G-C。 |
| [P2/correctness-08](../30-critiques/P2/correctness.md#L51) | 重大 | 設計修補：§3.1 schema核准並沿途耐久接受才啟用，批次帶舊版單位/quality；G-S。 |
| [P2/correctness-09](../30-critiques/P2/correctness.md#L57) | 重大 | 設計修補：§5.2 clock_quality/boot/seq、conn epoch，未来時間不延長online；G-T。 |
| [P2/correctness-10](../30-critiques/P2/correctness.md#L63) | 重大 | 設計修補：§7.1 stable sample鍵、去重/rows/dirty同交易，三年內晚到重算；G-S。 |
| [P2/scenarios-01](../30-critiques/P2/scenarios.md#L67) | 重大 | 設計修補：§5.1 parent listener/IP 與 ERP public/internal/content 分設，occupied443驗收；G-NET。 |
| [P2/scenarios-02](../30-critiques/P2/scenarios.md#L75) | 重大 | gated PoC：§5.1 explicit proxy/CONNECT/非互動resolver/407診斷，不用簽章代登入；G-NET。 |
| [P2/scenarios-03](../30-critiques/P2/scenarios.md#L83) | 重大 | 設計修補：§10.1 每屏last-poll與viewer狀態、JSON來源時間/15秒TTL，停頁不停代理測；G-D。 |
| [P2/scenarios-04](../30-critiques/P2/scenarios.md#L91) | 重大 | 設計修補：§5.2/§10.2 warm-up/fault/time在聚合及告警前gate，正常history不寫假零；G-S/G-T。 |
| [P2/scenarios-05](../30-critiques/P2/scenarios.md#L99) | 重大 | 設計修補：§10.3 同址換表重新commission、新generation；改名仍原series；G-S。 |
| [P2/scenarios-07](../30-critiques/P2/scenarios.md#L115) | 重大 | gated PoC：§10.6 partner點表＋本地tap、刺激至畫面SLO，非LAN毫秒推論；G-H。 |
| [P2/scenarios-08](../30-critiques/P2/scenarios.md#L123) | 重大 | 設計修補：§8/§9 supervisor持久stop、node/backend/data分健康，固定project不傷ERP；G-U。 |
| [P2/ecosystem-01](../30-critiques/P2/ecosystem.md#L7) | 重大 | 設計修補：§6 Sparkplug profile可訂必要STATE，普通raw維持publish-only，禁止致動；G-M/G-H。 |
| [P2/ecosystem-02](../30-critiques/P2/ecosystem.md#L13) | 重大 | 設計修補：§6 curated固定ID/倍率/單位/time/quality/schema，HTTP/MQTT同fixtures；G-M。 |
| [P2/ecosystem-03](../30-critiques/P2/ecosystem.md#L19) | 重大 | 設計修補：§3.1 reader快照/cursor/gap/archive契約，首次connector另付，不稱只加token；G-D/G-H。 |
| [P2/ecosystem-04](../30-critiques/P2/ecosystem.md#L25) | 重大 | gated PoC：§10.6 本地頁面/登入/快照與八小時讀lease，WAN斷冷啟及慢reader隔離；G-H。 |
| [P2/ecosystem-05](../30-critiques/P2/ecosystem.md#L31) | 重大 | gated PoC：§6 BIRTH/DATA retain=false、角色/alias/seq/有限Rebirth完整profile；G-H。 |
| [P2/ecosystem-06](../30-critiques/P2/ecosystem.md#L37) | 重大 | gated PoC：§10.6 先取得PLC接口/點表/quality/認證，分UA Client/Server與PubSub；未取得不交付G-H。 |
| [P2/ecosystem-08](../30-critiques/P2/ecosystem.md#L49) | 重大 | 設計修補：§6 按客供broker角色/ACL/配額驗，不因缺outbound bridge排除；僅export不強迫換unit；G-M。 |
| [P2/ecosystem-09](../30-critiques/P2/ecosystem.md#L55) | 重大 | 接受代價：§1/§6 retained正價值、同安全配置比較，G-X未做不宣稱淨省或必要HTTPS。 |

## 14.5 P3 逐 finding 處置（39 條）

| 原始 finding／來源 | 嚴重度 | 具體 disposition、章節與 gate |
|---|---|---|
| [P3/security-01](../30-critiques/P3/security.md#L11) | 致命 | 設計修補：§4.2 出廠根/env voucher，首次parent與root簽章都可驗，不TOFU；G-PKI未通不解除。 |
| [P3/security-02](../30-critiques/P3/security.md#L19) | 重大 | 接受代價：§3 不向unit曝JS API/inbox wildcard，HTTPS資源授權由parent實施；放棄直接JS client收益，G-PKI。 |
| [P3/security-03](../30-critiques/P3/security.md#L26) | 重大 | gated PoC：§4.3 雙向物件真偽＋§10.1資產hash，inspection機密性另判不冒充已解；G-NET。 |
| [P3/security-04](../30-critiques/P3/security.md#L33) | 重大 | 設計修補：§4.2 bridge同T2續期/revoke，§9 staging無prod key/grant/egress；G-PKI/G-R。 |
| [P3/security-05](../30-critiques/P3/security.md#L40) | 重大 | 設計修補：§9 validator與issuer/policy分UID、受限IPC，parser無授權簽署鍵；G-PKI/G-M。 |
| [P3/security-06](../30-critiques/P3/security.md#L47) | 重大 | 設計修補：§5.2/§6 raw獨立queue/RAM/CPU與無persistentcache，不能擠CQ配額；G-M。 |
| [P3/security-07](../30-critiques/P3/security.md#L54) | 重大 | 接受代價：§11.2 F-40初期每站root、不採共用NATS account當跨客戶故障域；多租戶另G-PKI。 |
| [P3/security-08](../30-critiques/P3/security.md#L61) | 重大 | 設計修補：§8 簽完整release manifest、helper獨立恢復、§13弱點時限；broker/client亦納版，G-U/G-L。 |
| [P3/longevity-01](../30-critiques/P3/longevity.md#L24) | 致命 | gated PoC：§8所有部署artifact有owner/更新/回退，未選NATS不負其fleet；若重選需同G-U而非一句N天runbook。 |
| [P3/longevity-02](../30-critiques/P3/longevity.md#L31) | 重大 | 接受代價：§2 備份工具/runtime/雲實例分帳，外部28+U，不把hub數目重算成新引擎；G-L。 |
| [P3/longevity-03](../30-critiques/P3/longevity.md#L38) | 重大 | 接受代價：§8選單一OS Python、§10.1 parentHTTPS文件，不依賴未查後繼Object Store API；G-L/G-U。 |
| [P3/longevity-04](../30-critiques/P3/longevity.md#L45) | 重大 | 設計修補：§3.3精確混版/required_features矩陣，不開JS wildcard解卡；任何新binding另G-X/G-C。 |
| [P3/longevity-05](../30-critiques/P3/longevity.md#L52) | 重大 | 設計修補：§7.2 T1 originjournal不可清空，restore新generation按業務ID補送；G-R。 |
| [P3/longevity-06](../30-critiques/P3/longevity.md#L59) | 重大 | gated PoC：§8/§14 G-U/G-S量bytes/day/fsync與耐寫，超標換儲存料件，不降CQ耐久設定。 |
| [P3/longevity-07](../30-critiques/P3/longevity.md#L66) | 重大 | 接受代價：§2/§13首屏無NATS/broker，承認放棄耐久投影零件但保較小必選組；非宣稱NATS無價值。 |
| [P3/longevity-08](../30-critiques/P3/longevity.md#L73) | 重大 | 接受代價：§3/§7公開版本契約不曝JS，§14退出含身分、consumer、fleet 12～24人週，G-X。 |
| [P3/correctness-01](../30-critiques/P3/correctness.md#L24) | 重大 | 設計修補：§3.1 ERP原子outbox、projection交易外、啟動批次對帳；CAS不跨業務交易，G-C。 |
| [P3/correctness-02](../30-critiques/P3/correctness.md#L28) | 重大 | 接受代價：§3.2耐久claim＋backend原key結果，不可知效果UNKNOWN禁盲重跑；G-C。 |
| [P3/correctness-03](../30-critiques/P3/correctness.md#L32) | 重大 | 設計修補：§3.1來源CQ outbox/清冊，ERP commit後receipt、平時也補讀；G-C。 |
| [P3/correctness-04](../30-critiques/P3/correctness.md#L36) | 重大 | 設計修補：§3.2 ERP flight持久、edge起跑期限/fence，timeout不放衝突工作；G-C。 |
| [P3/correctness-05](../30-critiques/P3/correctness.md#L40) | 重大 | 設計修補：§3.2按requested version保refused/deferred/superseded，不只latest applied；G-D。 |
| [P3/correctness-06](../30-critiques/P3/correctness.md#L44) | 重大 | 設計修補：§3.1 schema耐久activation receipt、producer等待，writer/node雙驗；G-S。 |
| [P3/correctness-07](../30-critiques/P3/correctness.md#L48) | 重大 | 設計修補：§10.1完整manifest/資產與候選就緒後才切版，指定版缺件拒絕；G-D。 |
| [P3/correctness-08](../30-critiques/P3/correctness.md#L52) | 重大 | 設計修補：§5.2獨立防重floor、未確認CQ不GC，§7.2限制restore horizon；G-C/G-R。 |
| [P3/correctness-09](../30-critiques/P3/correctness.md#L56) | 重大 | 設計修補：§5.2時間品質/boot/seq/monotonic freshness，無效不冒充現在；G-T。 |
| [P3/correctness-10](../30-critiques/P3/correctness.md#L60) | 重大 | 設計修補：§7.1 sample去重/rows/dirty同PG交易、commit後ack，G-S。 |
| [P3/scenarios-01](../30-critiques/P3/scenarios.md#L61) | 重大 | 設計修補：§10.1 desired可見不等DOCS完整，unit候選全部驗齊才applied；G-D。 |
| [P3/scenarios-02](../30-critiques/P3/scenarios.md#L65) | 重大 | 設計修補：§9/§10.1 ERP自己產work-centre JSON、parent供應，不假設站內另有MES；G-D。 |
| [P3/scenarios-03](../30-critiques/P3/scenarios.md#L69) | 重大 | 設計修補：§7/§10.2越線/恢復在來源durable EVT，不由PG補線猜告警；G-S。 |
| [P3/scenarios-04](../30-critiques/P3/scenarios.md#L73) | 重大 | 設計修補：§10.3 commissioned identity/map、換址與換表分開核實，G-S。 |
| [P3/scenarios-05](../30-critiques/P3/scenarios.md#L77) | 重大 | 設計修補：§10.4固定show成員、逐strip結果/partial，不早建Workflow；G-D。 |
| [P3/scenarios-06](../30-critiques/P3/scenarios.md#L81) | 重大 | 設計修補：§10.5管理config_rev/applied_rev、允許欄位及重定位流程，registry status非applied；G-A。 |
| [P3/scenarios-07](../30-critiques/P3/scenarios.md#L85) | 重大 | gated PoC：§5.2時間gate＋§4.2冷啟恢復，不因NKey/簽章可驗就把零時樣本入史；G-T。 |
| [P3/ecosystem-01](../30-critiques/P3/ecosystem.md#L7) | 重大 | 設計修補：§6逐型號固定topic/role/TLS/profile，NATS不適配時選實際可用broker；G-M。 |
| [P3/ecosystem-02](../30-critiques/P3/ecosystem.md#L13) | 重大 | 設計修補：§6 client型T1連raw broker，validator訂broker非訂T1；metadata/expiry明映，G-M。 |
| [P3/ecosystem-03](../30-critiques/P3/ecosystem.md#L19) | 重大 | 設計修補：§6 ingress Host 明許STATE/指定Rebirth，固定身分映射及schema先行；G-H。 |
| [P3/ecosystem-04](../30-critiques/P3/ecosystem.md#L25) | 重大 | gated PoC：§6 egress Edge Node完整BIRTH/alias/seq/DEATH，不將meas JSON稱Sparkplug；G-H。 |
| [P3/ecosystem-05](../30-critiques/P3/ecosystem.md#L31) | 重大 | 設計修補：§5.1/§6可信側n:8883或localview:443，不拿raw入口給HMI；G-NET/G-H。 |
| [P3/ecosystem-06](../30-critiques/P3/ecosystem.md#L37) | 重大 | 設計修補：§3.1/§7公開schema/snapshot/replay/live/quality契約，consumer不直讀JS；G-H。 |

## 14.6 P4 逐 finding 處置（42 條）

| 原始 finding／來源 | 嚴重度 | 具體 disposition、章節與 gate |
|---|---|---|
| [P4/security-01](../30-critiques/P4/security.md#L13) | 重大 | 設計修補：§4/§9 unit/function來源簽章與parent scope，無tenant-wide Gateway credential；重用decoder不交權，G-PKI。 |
| [P4/security-02](../30-critiques/P4/security.md#L20) | 重大 | 設計修補：§8/§9禁remote shell/任意host重指向，缺secret拒啟，CMS不簽更新；G-PKI/G-U。 |
| [P4/security-03](../30-critiques/P4/security.md#L27) | 致命 | gated PoC：§4.3不用routing bearer，M/I明示真偽/保密；敏感無bypass仍阻塞O-01/G-NET，不以不採TB假稱普遍解決。 |
| [P4/security-04](../30-critiques/P4/security.md#L34) | 重大 | 設計修補：§4.2獨立factory/operational身分、adopt停bootstrap，禁止chain自動重綁；G-PKI。 |
| [P4/security-05](../30-critiques/P4/security.md#L41) | 重大 | 設計修補：§9唯一業務writegate及獨立scope policy，UI/rule寫副本不授權裝置；G-D。 |
| [P4/security-06](../30-critiques/P4/security.md#L48) | 重大 | 設計修補：§9staging無prod key/grant/egress且archive，不能先拿複製token問prod再中和；G-R。 |
| [P4/security-07](../30-critiques/P4/security.md#L55) | 重大 | 設計修補：§6可信來源映射非payload deviceName，未知不建id；revoke/retained/舊時間分處理；G-M。 |
| [P4/security-08](../30-critiques/P4/security.md#L62) | 重大 | 接受代價：§9/§15不凍結無支援舊線作escape，不推論查無advisory=無流程；G-L核固定BOM/修補路徑。 |
| [P4/longevity-01](../30-critiques/P4/longevity.md#L24) | 致命 | 接受代價／gated PoC：本版不採TB；§15 O-08/G-L若重開buy須三形狀OEM/downstream/支援書面權利，付費不自動違M-05也不自動合規。 |
| [P4/longevity-02](../30-critiques/P4/longevity.md#L39) | 重大 | 接受代價：§2獨立列產品/library/方言、未知U保留；若採Gateway/Edge各另K，不沿16種混算，G-L。 |
| [P4/longevity-03](../30-critiques/P4/longevity.md#L57) | 重大 | 設計修補：§3.3/§8固定產品client/server/OS矩陣及canary，不依同廠商自動相容；G-U。 |
| [P4/longevity-04](../30-critiques/P4/longevity.md#L67) | 重大 | 設計修補：§7.2每state庫及origin備份，還原先對帳不當revoke、Edge資料不全丟cache；G-R。 |
| [P4/longevity-05](../30-critiques/P4/longevity.md#L77) | 重大 | 接受代價：§14退出含fleet、雙軌只讀、身份及consumer/dashboards，12～24人週預留，不是一條SQL。 |
| [P4/longevity-06](../30-critiques/P4/longevity.md#L87) | 重大 | 接受代價：§15 O-08書面支援/退出權、季度查核，單供應商風險不能消；不把Change Date當維護承諾，G-L。 |
| [P4/longevity-07](../30-critiques/P4/longevity.md#L97) | 重大 | 接受代價：§2/§5每VLAN south必列實例、磁碟/備份/升版；不採每VLAN JVM+PG，若buy重開照乘數估，G-L。 |
| [P4/correctness-01](../30-critiques/P4/correctness.md#L7) | 重大 | 設計修補：§3.1 stable業務key同交易outbox，平台delivery id只映射，不隨重試換key；G-C。 |
| [P4/correctness-02](../30-critiques/P4/correctness.md#L13) | 重大 | gated PoC：§3.1/§14按選定實際durability配置殺server/bridge，receipt後可重掃；不靠enum/in-memory通知，G-C。 |
| [P4/correctness-03](../30-critiques/P4/correctness.md#L19) | 重大 | 接受代價：§3.2 physical effect/CQ gap保存UNKNOWN，keyed backend或intent，否則禁job；G-C。 |
| [P4/correctness-04](../30-critiques/P4/correctness.md#L25) | 重大 | 設計修補：§3.2 delivery/平台status/真backend outcome分開，error/refuse/defer不映成成功；G-D。 |
| [P4/correctness-05](../30-critiques/P4/correctness.md#L31) | 重大 | 設計修補：§3.2 durable resource flight、seq/profile前提，timeout不解鎖，register/job共用資源；G-C。 |
| [P4/correctness-06](../30-critiques/P4/correctness.md#L37) | 重大 | 設計修補：§10.1 Apply只有intent，manifest版/hash一致，snapshot不倒退；G-D。 |
| [P4/correctness-07](../30-critiques/P4/correctness.md#L43) | 重大 | 設計修補：§3.1 CQ批次重讀、ERP cursor/result同交易、結果保留與delivery期限分離；G-C。 |
| [P4/correctness-08](../30-critiques/P4/correctness.md#L49) | 重大 | 設計修補：§5.2/§10.1 unit pin文件/assets/idmap/LKG，冷啟缺新版不清畫面；G-D/G-R。 |
| [P4/correctness-09](../30-critiques/P4/correctness.md#L55) | 重大 | 設計修補：§5.2只合格新heartbeat更新presence，source/ingest/time_quality分列，G-T。 |
| [P4/correctness-10](../30-critiques/P4/correctness.md#L61) | 重大 | 設計修補：§3.1 schema核准/耐久屏障、舊schema留積壓、空capability拒絕，G-S/G-D。 |
| [P4/scenarios-01](../30-critiques/P4/scenarios.md#L71) | 重大 | 設計修補：§3 stable unit/function與scope，§10同機display/sensor逐結果驗，不混gateway entity；G-D。 |
| [P4/scenarios-02](../30-critiques/P4/scenarios.md#L77) | 重大 | 設計修補：§9 parent內容relay與獨立content/root/ERP名稱，player無一般出口；G-NET/G-D。 |
| [P4/scenarios-03](../30-critiques/P4/scenarios.md#L83) | 重大 | gated PoC：§5.2/§10.2有效時基/暖機gate，零時樣本不以收件時間補新；G-T。 |
| [P4/scenarios-04](../30-critiques/P4/scenarios.md#L89) | 重大 | 設計修補：§5.1/§10.3 south→502、RTU權限/唯一reader、signed壓差全程fixture；G-S。 |
| [P4/scenarios-05](../30-critiques/P4/scenarios.md#L95) | 重大 | 設計修補：§7 north scoped SQL view/role、dashboard-as-code，整數/浮點/負值對原樣本；G-S。 |
| [P4/scenarios-06](../30-critiques/P4/scenarios.md#L101) | 重大 | 設計修補：§10.4 ERP show成員manifest、逐strip版本/result聚合partial；G-D。 |
| [P4/scenarios-07](../30-critiques/P4/scenarios.md#L107) | 重大 | gated PoC：§10.5具名reader-management backend、白名單config/actual/liveness，API未取得不放行G-A。 |
| [P4/scenarios-08](../30-critiques/P4/scenarios.md#L113) | 重大 | gated PoC：§10.6 HMI頁面/登入/授權本地預置，斷WAN新browser冷啟與point stale；G-H。 |
| [P4/scenarios-09](../30-critiques/P4/scenarios.md#L119) | 重大 | 設計修補：§2真實最小帳、§8/§9單stop owner/readiness/PG遲到不誤健康，G-U。 |
| [P4/scenarios-10](../30-critiques/P4/scenarios.md#L125) | 重大 | gated PoC：§14 G-NET/G-D/G-H三形狀六類範圍內流程，不用gRPC ping或品牌fallback代證。 |
| [P4/ecosystem-01](../30-critiques/P4/ecosystem.md#L9) | 重大 | 設計修補：§6每型號vendor topic/identity/schema/tenant admission，不以CONNECT作onboarding；G-M。 |
| [P4/ecosystem-02](../30-critiques/P4/ecosystem.md#L17) | 重大 | gated PoC：§10.6 point age/quality、停PLC且gateway活、新登入與刺激至畫面；G-H。 |
| [P4/ecosystem-03](../30-critiques/P4/ecosystem.md#L25) | 重大 | 設計修補：§7/§9每consumer獨立scope/role/views/export，唯讀不等跨線可讀；G-D。 |
| [P4/ecosystem-04](../30-critiques/P4/ecosystem.md#L33) | 重大 | gated PoC：§6完整Sparkplug角色、BIRTH/seq/有限Rebirth，codec/版本另K；G-H。 |
| [P4/ecosystem-05](../30-critiques/P4/ecosystem.md#L41) | 重大 | gated PoC：§10.6 UA模式/方向/編碼/quality先取證，不把connector名字當server能力；G-H。 |
| [P4/ecosystem-07](../30-critiques/P4/ecosystem.md#L57) | 重大 | 設計修補：§3/§9功能manifest生成schema/outcome映射，新增功能走共同結果路徑；G-D。 |
| [P4/ecosystem-08](../30-critiques/P4/ecosystem.md#L65) | 重大 | 接受代價：§15 O-08/G-L明列版/功能/下游義務/支援，認證範圍與IT驗收另付，不以公司名答認證。 |

## 14.7 P5 逐 finding 處置（40 條）

| 原始 finding／來源 | 嚴重度 | 具體 disposition、章節與 gate |
|---|---|---|
| [P5/security-01](../30-critiques/P5/security.md#L11) | 重大 | 設計修補：§4.1所有binding均須來源簽章/穩定serial，node不以topic存在當發布權；G-PKI。 |
| [P5/security-02](../30-critiques/P5/security.md#L23) | 重大 | 設計修補：§6 raw/n分資源/UID，管理credential/revoke保持HTTPS，不共特權parser；G-M。 |
| [P5/security-03](../30-critiques/P5/security.md#L34) | 重大 | 設計修補：§4.1逐物件雙向簽章強制，hello只證session；§4.3保密另gate，G-PKI/G-NET。 |
| [P5/security-04](../30-critiques/P5/security.md#L46) | 重大 | 設計修補：§4.2以serial/keyepoch撤銷全bridge，不以path撤銷；單parent仲裁與5分鐘lease，G-PKI。 |
| [P5/security-05](../30-critiques/P5/security.md#L58) | 重大 | 設計修補：§4.2env/tenant voucher與預置根，§7.2私鑰獨立escrow，staging無prod信任；G-R。 |
| [P5/security-06](../30-critiques/P5/security.md#L67) | 重大 | 設計修補：§9 manifest/asset hash、parent-relative record、backend不任意fetch URL；G-D。 |
| [P5/security-07](../30-critiques/P5/security.md#L76) | 重大 | 設計修補：§6可信username/client-id/profile或逐埠隔離，禁止HMI raw旁路；G-M。 |
| [P5/longevity-01](../30-critiques/P5/longevity.md#L15) | 重大 | 接受代價：§2完整庫/契約時計，§6 unit未啟B不打包MQTT，啟用後記fleet矩陣；G-L/G-X。 |
| [P5/longevity-02](../30-critiques/P5/longevity.md#L26) | 重大 | 設計修補：§13全fleet完成切換/失聯處置/90日零依賴才刪，§8更新先到位；G-X。 |
| [P5/longevity-03](../30-critiques/P5/longevity.md#L34) | 重大 | 設計修補：§3.3版本/required slot class協商、角色/混版矩陣；無receipt為unknown，不靜默成功；G-C。 |
| [P5/longevity-04](../30-critiques/P5/longevity.md#L42) | 重大 | 設計修補：§7.2registry單owner、一致backup/escrow/新epoch對帳，F33先commit後ERP projection；G-R。 |
| [P5/longevity-05](../30-critiques/P5/longevity.md#L52) | 重大 | 設計修補：§6管理HTTPS常駐，brokercache不持久；換cert/身分/ACL分測、不依賴plugin；G-M。 |
| [P5/longevity-10](../30-critiques/P5/longevity.md#L89) | 重大 | gated PoC：§8 register式app/helper＋OS/boot現場恢復有預算與owner，無G-U證據不承諾fleet可逆。 |
| [P5/correctness-01](../30-critiques/P5/correctness.md#L11) | 重大 | 設計修補：§3.1業務/SQ同交易，结果/關聯/cursor同交易，全部遠呼在外；G-C。 |
| [P5/correctness-02](../30-critiques/P5/correctness.md#L17) | 重大 | 接受代價：§3.2原子claim只防並行，backend效果不可知留UNKNOWN不重做；G-C。 |
| [P5/correctness-03](../30-critiques/P5/correctness.md#L23) | 重大 | 設計修補：§3.1 signed durable receipt綁key/version/digest，PUBACK不清outbox；B若啟用同oracle G-X。 |
| [P5/correctness-04](../30-critiques/P5/correctness.md#L31) | 重大 | 設計修補：§3.1 snapshot含SQ/CQ/events/schema/revoke/tombstone，不只desired；G-C測八天cursor。 |
| [P5/correctness-05](../30-critiques/P5/correctness.md#L37) | 重大 | 設計修補：§3.2timeout非停止證據、late CQ追加、舊executor停止才釋槽；G-C。 |
| [P5/correctness-06](../30-critiques/P5/correctness.md#L43) | 重大 | 設計修補：§5.2結果內容與防重floor分離，已確認CQ90日、未確認pin，舊epoch永不重起；G-C/G-R。 |
| [P5/correctness-07](../30-critiques/P5/correctness.md#L49) | 重大 | 設計修補：§7.2restore先停寫/權威登錄新epoch/三方對帳，不能盲採mirror最大version；G-R。 |
| [P5/correctness-08](../30-critiques/P5/correctness.md#L55) | 重大 | 設計修補：§3.2received/pending/applied分開、同版defer可試；§10.1固定文件hash/LKG；G-D。 |
| [P5/correctness-09](../30-critiques/P5/correctness.md#L61) | 重大 | 設計修補：§5.2source/received/time_quality/boot/seq，T1無採樣時刻明標unknown；G-T。 |
| [P5/correctness-10](../30-critiques/P5/correctness.md#L67) | 重大 | 設計修補：§3.1schema activation屏障、batch帶當時quality，舊schema跟未交接資料pin；G-S。 |
| [P5/correctness-11](../30-critiques/P5/correctness.md#L73) | 重大 | 設計修補：§7.1PG內去重/rows/dirty同交易，source不先按SQLite批次標已入庫；G-S。 |
| [P5/correctness-12](../30-critiques/P5/correctness.md#L79) | 重大 | 設計修補：§3.1/§5.2獨立evt/event_id來源授權及receipt，CQ仍須匹配SQ；G-C/G-A。 |
| [P5/scenarios-01](../30-critiques/P5/scenarios.md#L42) | 重大 | gated PoC：§5.1 proxy位址/認證/CA/FQDN/CONNECT與短請求診斷，簽章不代入網；G-NET。 |
| [P5/scenarios-02](../30-critiques/P5/scenarios.md#L46) | 重大 | 設計修補：§10.1全媒體manifest/逐hop預取，完整前保舊版，player不直達ERP；G-D。 |
| [P5/scenarios-03](../30-critiques/P5/scenarios.md#L50) | 重大 | 設計修補：§9/§10.1 ERP工單交易產projection/outbox，parent供JSON/idle/sourceage；G-D。 |
| [P5/scenarios-04](../30-critiques/P5/scenarios.md#L54) | 重大 | 接受代價：§5.2壞時間區間不算有效歷史、校時開新interval，不杜撰原採樣時刻；G-T。 |
| [P5/scenarios-05](../30-critiques/P5/scenarios.md#L58) | 重大 | 設計修補：§10.3register/signedness/scale/serial/profile版本與RTU程序、負壓fixture；G-S。 |
| [P5/scenarios-06](../30-critiques/P5/scenarios.md#L62) | 重大 | 接受代價：§10.4單controller timeline、跨U非原子/partial，無網路同步SLA；G-D。 |
| [P5/scenarios-07](../30-critiques/P5/scenarios.md#L66) | 重大 | 設計修補：§10.5registry-owned config與reader actual revision，白名單排除卡權/門鎖；G-A。 |
| [P5/scenarios-08](../30-critiques/P5/scenarios.md#L70) | 重大 | gated PoC：§10.6本地HMI資產/登入/producer/quality，WAN冷啟與實際PLC來源；G-H。 |
| [P5/scenarios-09](../30-critiques/P5/scenarios.md#L74) | 重大 | 設計修補：§2/§5獨立綁址，§8/§9stop marker/完整player readiness，不把兩服務當全機；G-U。 |
| [P5/ecosystem-01](../30-critiques/P5/ecosystem.md#L7) | 重大 | 接受代價：§6逐型號mapping/replay，T1進durable前可能loss明列，無seq不虛報筆數；G-M。 |
| [P5/ecosystem-02](../30-critiques/P5/ecosystem.md#L13) | 重大 | 設計修補：§6先本地逐metric投影再獨立上送，late batch只補史不倒退畫面；G-H。 |
| [P5/ecosystem-03](../30-critiques/P5/ecosystem.md#L19) | 重大 | 設計修補：§3.1/§7唯讀schema/snapshot/cursor、產線scope與PG view獨立授權；G-H/G-D。 |
| [P5/ecosystem-04](../30-critiques/P5/ecosystem.md#L25) | 重大 | gated PoC：§6分ingress Host/egress Edge Node，BIRTH/DEATH/alias/seq/STATE/有限Rebirth；G-H。 |
| [P5/ecosystem-05](../30-critiques/P5/ecosystem.md#L31) | 重大 | 接受代價：§6客供broker無admin權只作核准export，unit仍HTTPS，IT開通/撤銷另費；G-M。 |
| [P5/ecosystem-08](../30-critiques/P5/ecosystem.md#L49) | 重大 | gated PoC：§6/§14 G-X與相同broker/投影/HMI基線比較，T-a/b/c不自動證明unit B值得。 |

## 14.8 P6 逐 finding 處置（47 條）

| 原始 finding／來源 | 嚴重度 | 具體 disposition、章節與 gate |
|---|---|---|
| [P6/security-01](../30-critiques/P6/security.md#L28) | 致命 | 設計修補：§4.1/§9 B0/bridge離線驗公鑰grant、scope/簽章後才耐久接管，未知零寫入；G-PKI未通不解除。 |
| [P6/security-02](../30-critiques/P6/security.md#L42) | 重大 | 設計修補：§4全T2端到端desired驗章＋五分鐘新授權lease，rogue parent不能永久發新指令；G-PKI。 |
| [P6/security-03](../30-critiques/P6/security.md#L52) | 重大 | 設計修補：§4.2預置根/trust-set輪替與獨立recovery，不靠單一SPKI或失陷舊鍵；G-PKI。 |
| [P6/security-04](../30-critiques/P6/security.md#L62) | 重大 | 設計修補：§9 CMS與Fleet管理分權、parent/config獨立政策/雙人digest批准；G-D/G-PKI。 |
| [P6/security-05](../30-critiques/P6/security.md#L72) | 重大 | 設計修補：§4.2 unit自產鑰、管理只持可重讀public cert，不把credential secret放desired或一次性丟失pickup；G-PKI。 |
| [P6/security-06](../30-critiques/P6/security.md#L82) | 重大 | gated PoC：§4.3不用bearer越inspection，I限定可讀資料；私密無bypass未支援，O-01/G-NET。 |
| [P6/security-07](../30-critiques/P6/security.md#L92) | 重大 | 設計修補：§5.1新隔離島/逐port fallback，T1/T2/HMI分區，CM4 deny inbound/player本機；G-NET。 |
| [P6/security-08](../30-critiques/P6/security.md#L102) | 重大 | 設計修補：§9 south parser/validator與north writer分UID，只有writer持history role；G-PKI/G-S。 |
| [P6/security-09](../30-critiques/P6/security.md#L112) | 重大 | 設計修補：§9 record grant/allowlist/manifest hash，publisher scope及批量帶外批准；G-D。 |
| [P6/security-10](../30-critiques/P6/security.md#L122) | 重大 | 設計修補：§4.2 claim綁序號/key、revoke綁credential epoch、rotated-old只stale、衝突隔離；G-PKI。 |
| [P6/longevity-01](../30-critiques/P6/longevity.md#L50) | 重大 | 設計修補：§2/§9首日B0入口，不留device直達Odoo第二路徑；stream/batch同狀態機，G-NET。 |
| [P6/longevity-02](../30-critiques/P6/longevity.md#L60) | 重大 | 接受代價：§9B0持wire/registry，ERP留業務SQ/scheduler；§14ERP升版2～4人週，不以搬queue省帳。 |
| [P6/longevity-03](../30-critiques/P6/longevity.md#L70) | 重大 | gated PoC：§8首裝helper/app更新、OS/boot現場救援及EOL前遷移，不等第二客戶才補；G-U。 |
| [P6/longevity-04](../30-critiques/P6/longevity.md#L80) | 重大 | 設計修補：§9player固定映像/BOM/觸發，kiosk候選先PoC、撤回兩週替換保證；G-L/G-D。 |
| [P6/longevity-05](../30-critiques/P6/longevity.md#L90) | 重大 | 設計修補：§7.2 ERP DB/filestore/history/所有node狀態及獨立key escrow，restore先封新下行；G-R。 |
| [P6/longevity-06](../30-critiques/P6/longevity.md#L100) | 重大 | 設計修補：§3.3首日wire/錯誤詞彙/黃金向量/混版矩陣，第二binding可等、規格不能等；G-C。 |
| [P6/longevity-10](../30-critiques/P6/longevity.md#L122) | 重大 | 設計修補：§4.2上級授權新trust set、fleet確認再退舊、獨立失陷恢復，不猜ACME預設；G-PKI。 |
| [P6/correctness-01](../30-critiques/P6/correctness.md#L9) | 重大 | 設計修補：§3.1 fetch不標完成交接，同key可重取、unit inbox commit才receipt；G-C。 |
| [P6/correctness-02](../30-critiques/P6/correctness.md#L15) | 重大 | 設計修補：§3.1先CQ/outbox再POST，ERP提交才簽receipt，持續批次補讀含已ack結果；G-C。 |
| [P6/correctness-03](../30-critiques/P6/correctness.md#L21) | 重大 | 接受代價：§3.2executing無結果轉UNKNOWN，keyed query或人工隔離，禁物理exactly-once概括；G-C。 |
| [P6/correctness-04](../30-critiques/P6/correctness.md#L27) | 重大 | 設計修補：§3.2 queued/start均驗deadline，timeout保衝突鎖，register/job共資源順序；G-C。 |
| [P6/correctness-05](../30-critiques/P6/correctness.md#L33) | 重大 | 設計修補：§5.2不按501筆刪證據，未確認無TTL、floor終身、滿額拒新job，G-C。 |
| [P6/correctness-06](../30-critiques/P6/correctness.md#L39) | 重大 | 設計修補：§10.1requested版/manifest/hash一致、actual綁epoch/seq，錯版refuse；G-D。 |
| [P6/correctness-07](../30-critiques/P6/correctness.md#L45) | 重大 | 設計修補：§3.2同版pending/defer可恢復，啟動讀backend/idmap，LKG到完整切換才退；G-D。 |
| [P6/correctness-08](../30-critiques/P6/correctness.md#L51) | 重大 | 設計修補：§5.2time_quality/boot/seq、monotonic elapsed、補傳不刷新online；G-T。 |
| [P6/correctness-09](../30-critiques/P6/correctness.md#L57) | 重大 | 設計修補：§3.1 schema commit/activation receipt，批次攜版/品質、空capability拒命令；G-S。 |
| [P6/correctness-10](../30-critiques/P6/correctness.md#L63) | 重大 | 設計修補：§3.1/§7.1 history與ERP分receipt/水位，stable sample/event id、兩目的地不混ack；G-S。 |
| [P6/correctness-11](../30-critiques/P6/correctness.md#L69) | 重大 | 設計修補：§7.1raw同交易標dirty、三年內合法晚到可重算，GC等修訂完成；G-S。 |
| [P6/correctness-12](../30-critiques/P6/correctness.md#L75) | 重大 | 設計修補：§7/§10.2來源durable越線/恢復evt，不以最新snapshot稱離線alert；G-S。 |
| [P6/correctness-13](../30-critiques/P6/correctness.md#L81) | 重大 | 設計修補：§10.6 HMI每metric自計age/quality/seq，Will/broker活不代表來源fresh；G-H。 |
| [P6/scenarios-01](../30-critiques/P6/scenarios.md#L81) | 重大 | 設計修補：§13 shape/profile首用gate，C25/managed sale不等站點數，未過禁安裝；G-NET。 |
| [P6/scenarios-02](../30-critiques/P6/scenarios.md#L85) | 重大 | 設計修補：§5deviceFQDN:443到B0、ERP內部/DBconduit分列，不叫client改出網8443；G-NET。 |
| [P6/scenarios-03](../30-critiques/P6/scenarios.md#L89) | 重大 | 設計修補：§2/§3先驗B0/B1/B2/unit同契約，cloud首T1/HMI即有sitebridge，未完key換parent對帳；G-C/G-NET。 |
| [P6/scenarios-04](../30-critiques/P6/scenarios.md#L93) | 重大 | 設計修補：§9/§10.1文件/全媒體/JSON各自grant與cache，player無nodekey/一般ERP出口；G-D。 |
| [P6/scenarios-05](../30-critiques/P6/scenarios.md#L97) | 重大 | gated PoC：§4.2/§5.2本站時間/RTC/受控校時，443-only不偷開公網NTP，失準停新權；G-T。 |
| [P6/scenarios-06](../30-critiques/P6/scenarios.md#L101) | 重大 | 設計修補：§10.3RS485實體料件/baud/parity/VM passthrough/穩定map，負壓與失聯驗到底；G-S。 |
| [P6/scenarios-07](../30-critiques/P6/scenarios.md#L105) | 重大 | 設計修補：§10.4mode owner/成員manifest、逐function結果與partial，standalone不被斷線清除；G-D。 |
| [P6/scenarios-08](../30-critiques/P6/scenarios.md#L109) | 重大 | gated PoC：§10.5硬體proof/verifier、config/applied、attestation freshness與事件，CA不是全管理面；G-A。 |
| [P6/scenarios-09](../30-critiques/P6/scenarios.md#L113) | 重大 | 設計修補：§10.6全T2亦有localproducer/HMI，更新不等120秒report或30秒平均；G-H。 |
| [P6/scenarios-10](../30-critiques/P6/scenarios.md#L117) | 重大 | 設計修補：§8/§9project/port/volume/stopmarker與真正readiness，cold/crash/stop/restore不傷ERP；G-U。 |
| [P6/ecosystem-01](../30-critiques/P6/ecosystem.md#L9) | 重大 | 設計修補：§6採購前型號TLS/topic/clientid/payload/replay profile，無法辨識則逐埠隔離或拒收；G-M。 |
| [P6/ecosystem-02](../30-critiques/P6/ecosystem.md#L17) | 重大 | gated PoC：§10.6本地feed與north批次分排程/配額，量刺激至畫面和age，WAN背壓不拖HMI；G-H。 |
| [P6/ecosystem-03](../30-critiques/P6/ecosystem.md#L25) | 重大 | 設計修補：§6僅回灌有效projection，HMI自行stale/unknown，retained保有晚加入價值；G-H。 |
| [P6/ecosystem-04](../30-critiques/P6/ecosystem.md#L33) | 重大 | 設計修補：§7/§9每consumer獨立身分及line/function scope，SQL/API/MQTT同核准清單，不借sitecredential；G-D。 |
| [P6/ecosystem-05](../30-critiques/P6/ecosystem.md#L41) | 重大 | 設計修補：§3/§7stable schema/聚合窗口/versionedview、snapshot/tombstone/replay規格及reader fixture；G-H。 |
| [P6/ecosystem-06](../30-critiques/P6/ecosystem.md#L49) | 重大 | gated PoC：§6獨立Sparkplug adapter、BIRTH/STATE/seq/bdSeq/有限Rebirth，禁止actuator；G-H。 |
| [P6/ecosystem-08](../30-critiques/P6/ecosystem.md#L65) | 重大 | 接受代價：§13報價前IT流向/inspection/broker權限/授權清單核准，等待另計，不用拒售假裝滿足錨點；G-NET/G-L。 |

# 15. 仍未解決的事與給 owner 的決策清單

表內 owner 仍須指定人名。先核首屏與必要 gate 預算，不等於批准部署；固定 BOM、現場施工、PLC/reader 資料、外審及產品實測仍欠證據。強制 inspection 保密、原 VLAN 無法移機、不可查的物理效果或 boot 救援失敗都可阻交付；追溯完整不代表風險已解除。

| 決策／owner | 選項 | 建議 | 理由 | 不決定的後果 |
|---|---|---|---|---|
| O-01 資料 owner＋IT：inspection | M/no-decrypt；I僅可讀非敏感；另審端到端加密profile | 敏感一律M；I逐資料類核准，第三案另4～8人週探索 | 簽章不能保密，也不保證proxy可達 | 私密內容/出勤的(c)不能出貨，不能勾選已支援 |
| O-02 客戶IT＋交付：C25 retrofit | 新隔離島；逐T1實體埠/AP；原網不動 | 批准新south/switch/AP、NT$20,000～50,000預算及3～5人日施工驗收 | 舊非隔離VLAN的lateral流量不經bridge firewall | 留原VLAN的T1不能安全接入；需重訂施工與交期 |
| O-03 產品＋正確性lead：job承諾 | keyed backend；改intent；UNKNOWN人工；不用該job | 優先集合化intent，不能查/停者禁用 | effect/CQ無通用原子提交，timeout不代表沒做 | D-04未驗類別不開售，未知資源保持鎖定 |
| O-04 release＋硬體：OTA/OS | register app＋現場OS/boot；改全套Mender/已驗A/B | 採本稿前者，批准維修kit與每盒0.5～1人日major維護額度 | 不假設既有CM4 rootfs/boot能A/B | G-U未通不能無人值守交付；拒現場則需新BOM/預算 |
| O-05 資料＋ops：保存/災復 | 本稿三年raw、90日已ack CQ、30日restore、24h RPO/8h RTO；更強異機副本 | 批准基線並按峰值配盤；關鍵事件再談更強副本 | 未ack結果不可TTL刪，磁碟/異機與SLO都有成本 | 不能承諾離線時長與災復，history/job admission仍受限 |
| O-06 HMI owner＋partner：來源/SLO | 本地reference HMI；具名既有HMI/Sparkplug；更快tap | 先交PLC點表，核一Hz baseline p95≤1.5s/p99≤2s、age3s；更快另驗 | 採樣延遲不能由broker消除，標準也需角色互通 | D-06只能PoC，不能作已交付低延遲HMI報價 |
| O-07 reader產品＋安全：D-05 | 具名硬體管理SDK；既有門禁平台connector；延期 | 先定硬體proof/boot policy、管理白名單、事件隱私/法定保存 | CA/SE簽章不是完整attestation，物理loop仍另案 | G-A無法驗收，不標T3 verified、不承諾安全門禁 |
| O-08 法律＋release：BOM/buy/player | 本稿零件BOM；取得OEM合約後重開buy；不合格player替換 | 先G-L展開28+U及Anthias；buy只按三形狀書面權利重評 | 付費不必然違M-05，未知條款也不等合規 | 未查證發行物不得採用；player/商約可阻首客 |
| O-09 owner：人力/交期/接班 | 首屏27～41人週＋年度6～10；縮產品；增加維護人 | 至少兩名具名可接班者，先做首屏，後續按觸發 | 對稱成本包含恢復與外部時鐘，不只是碼量 | 無法承諾維護/外審/首站時程；不以AI速度填缺口 |
| O-10 安全＋業務：離線授權 | 操作5分鐘、HMI非敏感讀8小時；更短；更長另審 | 接受本稿上限，T3敏感資料不套HMI豁免 | N-11與分區即時撤銷衝突，需明定可用性代價 | 離線新命令/讀取不放行，不能以7日cert代授權 |

共同故障域、T2 鍵複製、T1 假資料、有限儲存與永久 UNKNOWN 仍在；協定與測試也可能一起漏錯。本輪只提交 draft，不新增評分；由下一輪獨立 refuters 檢驗，不預設本稿勝出。