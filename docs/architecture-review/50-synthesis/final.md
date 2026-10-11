# 1. 結論先講

結論先講：採 P2 修訂後的 HTTPS 管理樹，以 ERP 持有業務 desired / job queue、裝置持有 actual/result log、獨立 registry 管身分，結合 P6 功能分期與 P5(A) 契約測試；MQTT 按站內設備與 HMI 需求加入，不成為管理權威。

相對 P0 改五件事：一、所有 Type 2 雙向簽章、文件雜湊及用途授權從首日到位；二、原子受理、耐久收據與批次對帳，未知物理結果保鎖、不重跑；三、安全決策另存不可隨業務備份回捲的日誌，封存於每次派送重新檢查；四、提供保留同主機形狀的 C-25 隔離改造，以及有期限、可離線冷啟的現場讀取；五、把更新失敗救援、壞狀態修復、歷史證據與所有角色成本算進交付，不把同份程式當成零維運。

MQTT 最終答案，三行：  
不用它作首版 leaf/trunk，換到較少的生產配置與維護範圍，不是獨占正確性或必然穿網。  
保留站內 broker，買回成熟入口、扇出與 retained 晚加入快取；來源、品質、授權及恢復仍需整合。  
已有工具需求或同負載收益時可重評 leaf binding，不必等 HTTPS 撐不住，也不必先替每片螢幕安裝 broker。

這是完成對抗審查的設計建議，不是生產批准。敏感資料被強制 TLS inspection 且不准 bypass、以及不准改造的 C-25 網路，仍是不支援的部署組合；owner 必須決定條件、責任人與驗收預算，不能以文件完整冒充所有現場均已解決。

# 2. 方案總覽

管理中心是 Odoo UI 加 root node 的 registry；ERP 不交出 CMS、業務排序或 job queue。相同 node release 可扮 unit、branch、root node，但解析器、發證者、recorder 與更新 helper 分權執行。純一屏可直連 root node；第一個 Type 1 或本地 HMI 才增加 branch 實例，未必增加主機。先驗兩層 intermediate branch，不預建無限深度部署；更深須另過相同驗收，不能把拓樸可描述當作已支援。

P2 與 P6 同分，沒有分數上的勝者。選 P2 作文件骨架，是因為完整樹、各層 consumer 與 registry 已是其中心；P6 答辯也加入 H0，卻仍限制較深 relay、留下 Type 3 管理契約。保留 P6 的首用 gate 比重保留其早期安全延期更重要。此選擇是剩餘工作與一致性的判斷，不替六案重評；P2 答辯採 Mender 的選擇則由本版 §8 明示替換。

## 2.1 證據、分數與借用

| 項目 | 紀錄與邊界 |
|---|---|
| 本版 | 2026-10-11，final reviser ONLY；依 [RESUME A.8](../RESUME.md#L146) 與 [Revise/STRUCTURE](../90-resume/wave-c-synthesis.js#L125) |
| 必讀 | 03、00/01/02、LOG/interim；八份 facts 結論；六提案全文；42 份原批評/答辯/評分；四份 MQTT 帳本；完整 draft、三 refute、completeness |
| 證據層級 | 第三方事實沿用 2026-10-10 研究；摘要、推論與未查證不升格。本輪無網查、產品執行、測試或 PoC |
| 執行限制 | inherited/default model；requested max 無法強制或核驗。不委派、不安裝、不啟服務、不提交；只建立本檔 |
| 原件 | [draft.md](draft.md)、[interim.md](interim.md) 與所有原始評議保留；文件驗證只證明覆蓋及一致性 |

| 既有評分來源 | 答辯前 | 答辯後 | 本版取捨 |
|---|---:|---:|---|
| [P1](../30-critiques/P1/score.md#L13) | 38 | 52.5 | 借站內生態，不固定全樹 broker |
| [P2](../30-critiques/P2/score.md#L11) | 41.5 | 56 | 採骨架，不預支其未驗更新組合 |
| [P3](../30-critiques/P3/score.md#L11) | 37.5 | 54.5 | 借本地資料島，不預付 JetStream/callout |
| [P4](../30-critiques/P4/score.md#L13) | 41 | 52.5 | 書面 OEM 權利齊備才重開採購 |
| [P5](../30-critiques/P5/score.md#L13) | 36.5 | 52.25 | 採 A，第二 binding 另證淨收益 |
| [P6](../30-critiques/P6/score.md#L9) | 34 | 56 | 採分期，首日安全/恢復不延後 |

R1～R8 權重固定為 20、15、15、20、15、5、5、5；每項原分乘權重除十再相加。以上是凍結的來源分數，不是本版通過率。

| 三項 steal-worthy／來源 | 最終落點 |
|---|---|
| [P1](../30-critiques/P1/score.md#L96)：owner/cache、分層存活、隔離後生態入口 | §3 收據；§5 時間/連線分判；§6 raw 與投影 |
| [P2](../30-critiques/P2/score.md#L85)：耐久交接、身分/操作權分離、需求觸發 MQTT | §3；§4；§13 |
| [P3](../30-critiques/P3/score.md#L112)：本地資料島、業務版本不借 revision、受限可替換入口 | §10.6；§3.1；§6 |
| [P4](../30-critiques/P4/score.md#L106)：HMI/業務/分析分流、重用 decoder 不交權、平台為副本 | §7/§10；§9；§7.2 |
| [P5](../30-critiques/P5/score.md#L76)：A/B 分帳、HTTPS 管理獨立、fleet 證據退出 | §3.3/§14；§6；§13 |
| [P6](../30-critiques/P6/score.md#L59)：能力首用 gate、薄 H0 留 CMS、未知副作用不淘汰 | §13；§9；§3.2 |

| [interim](interim.md#L19) 十條共識 | 最終裁定 |
|---|---|
| 1 契約與傳輸分層 | 採；A 的 schema/oracle/版本治理不免費 |
| 2 trunk 只能 HTTPS | 不採必然性；HTTPS 是預設，strict/inspected profiles 與實際 proxy 分驗 |
| 3 下行端到端簽章 | 採且擴至全部 Type 2 上行、資產、用途與授權世代 |
| 4 PKI 生命週期 | 採；不信匿名 parent 授時，增加安全內容 checkpoint |
| 5 OTA 必列 | 採；選 app register 更新及全部 OS 變更的現場救援保底 |
| 6 種類少算、差距不重要 | 採對稱盤點；不預先取消 M-02 的比較價值 |
| 7 買平台不成立 | 部分；現有商約未證成，不推出所有付費都違 M-05 |
| 8 不採 NATS 基底 | 本版同選擇；理由是固定負擔與整合責任，不以 advisory 數當未修漏洞數 |
| 9 MQTT 在南邊 | 採位置；補可信 feed、client、讀者授權、STATE/Rebirth 與實例成本 |
| 10 分期不分安全 | 採；更新、恢復、最小 footprint 與外審也屬首客本金 |

## 2.2 種類與足跡

外部家族與執行實例分帳，不用不同計數軸相加排名。

| 盤點軸 | 口徑 |
|---|---|
| 外部家族 | 每個可獨立更新/審查/交付者算一個 K，直接責任下限 **28+U** |
| 未展開 U | 傳遞套件、解封硬體、CI/registry、雲平台及實際網路產品線；不是完整總數已知 |
| 多實例 | 相同引擎不重算 K，RAM/備份/人力仍逐實例計 |
| 自有家族 | node/ERP/display 三程式、node/ERP/deploy/e2e/Parts 五 repo、Python/SQL/shell/JavaScript 四維護語言，各軸另列 |

下表沒有標來源的產品授權、維護者與交付版本支援均為未查證。列出的負責角色是本案責任分工，不是廠商承諾。每月弱點分流、每季生命週期複查、發行前核支援，已核 EOL 前六個月提出遷移；自有程式也要有替補人員、相容矩陣與退出工件。

| K／元件 | 自建或外部／授權 | 維護者與時鐘責任 | 取代掉什麼 |
|---|---|---|---|
| K01 Odoo | 外部；edition/授權未查證 | ERP owner；支援線未查證，每次大版驗 C-20 | 保留 CMS/hub 業務 |
| K02 PostgreSQL | 外部；[License 紀錄](../10-facts/postgres-timeseries.md#L99)，2026-10-10 | DB owner；交付版/支援截止未查證 | ERP 保留，替代歷史引擎 |
| K03 SQLite | 外部；未查證 | release/ops；耐久/備份介面隨版驗 | node 狀態庫 |
| K04 Python | 外部候選；未查證 | release；G-LANG 後凍結，支援截止待核 | node 單語言基線 |
| K05 Debian userland/套件工具 | 外部候選；未查證 | ops；安全與 minor/major 路徑 | 不自建 OS |
| K06 Linux kernel | 外部；未查證 | 硬體/release；獨立修補線 | 不藏於 runtime |
| K07 systemd/credential 工具 | 外部候選；未查證 | ops；啟停與解封介面驗收 | 單一 supervision |
| K08 nginx | 外部；授權未查證；[行為紀錄](../10-facts/transport-through-networks.md#L45)，2026-10-10 | 網路 owner；TLS 終結/路由隨版驗 | 既有 ERP ingress |
| K09 OpenSSL | 外部候選；未查證 | 安全/release；TLS 修補 | 不自製 TLS |
| K10 cryptography | 外部候選；未查證 | 安全；X.509/JWS 所需原語及 scrypt 組合待驗 | 不自製密碼原語 |
| K11 PyJWT | 外部 JWS 候選；未查證 | 安全；演算法/格式黃金向量 | 不手寫簽章封裝 |
| K12 aiohttp | 外部候選；未查證 | 網路/release；stream/batch/proxy | 共用 HTTP stack |
| K13 psycopg2 | 外部候選；未查證 | DB/release；不同 driver 另加 K | PG 連線 |
| K14 Anthias | 外部過渡 player；未查證 | display；整個映像與 CM4 支援待核 | 保留既有播放器 |
| K15 Chromium/實際 renderer | 外部候選槽位；未查證 | display/release；不由 wrapper 代管時鐘 | 不自建 browser |
| K16 Docker Engine | 外部候選；未查證 | ops；隔離/資源限制待驗 | 部署 runtime |
| K17 Docker Compose | 外部候選；未查證 | ops；固定 project/版本 | 部署編排 |
| K18 nftables | 外部候選；未查證 | 網路 owner；規則及 reset 驗收 | 口頭隔離退場 |
| K19 chrony | 外部候選；未查證 | ops；只用核准且有效的時間源 | 授時依賴 |
| K20 dnsmasq | 外部 DNS/DHCP 候選；未查證 | IT/ops；借客戶服務也要列實作 | 穩定名稱 |
| K21 restic | 外部備份候選；未查證 | ops；加密/目的端/restore 待驗 | 不自建備份引擎 |
| K22 OpenSSH | 外部候選；未查證 | ops；僅管理網維修/備份 | 非一般裝置入口 |
| K23 ca-certificates | 外部；未查證 | 安全；IoT 專用信任庫 | 不把系統全部 CA 當授權根 |
| K24 CM4 bootloader/EEPROM 工具 | 外部；未查證 | 硬體；每板/媒體救援驗收 | 不自建 bootloader |
| K25 CM4 board/GPU firmware | 外部；未查證 | 硬體；獨立於 boot 的版本線 | 完整映像責任 |
| K26 現有 hypervisor | 外部；型號/合約未查證 | IT；共故障域、NIC 隔離待驗 | 保留同主機形狀 |
| K27 現場 AP | 外部；型號/支援未查證 | IT；C-25 原設備不假定可隔離 | retrofit 視能力替換 |
| K28 現場 switch | 外部；型號/支援未查證 | IT；port/VLAN/reset 待驗 | retrofit 視能力替換 |
| node/ERP/backends | 自建三家族，更多 backend 首用另列 | 每家族兩名可接手者；契約、政策、更新共同版本 | gateway/branch/IOTA/Orion 相應職責 |

| 條件增量 | 種類與實例實帳 |
|---|---|
| history/Grafana | K02 多一實例及 recorder process；Grafana +1 K |
| D-02/D-03 | sensor driver +1 K、pymodbus +1 K，啟用才計；RS485 料件另列 |
| MQTT | Mosquitto +1 K、Paho +1 K；§6 首版每來源 intake 一實例，需要投影再加 n |
| Sparkplug/HMI | protobuf +1 K、Tahu/替代 codec +1 K；第三方 HMI 另 +1 K；UA library 若選另計 |
| D-05/無人解封 | SDK/key provider/attestation 工具至少 +3 K；TPM/SE/provider 依實際新增，不假定 CM4 已有 |
| retrofit/雲端 | 不同 AP/switch/NIC/firmware、proxy/LB/雲服務/備份端各展開 U；退役舊家族不雙算 |

以下是 G-U 的**事前設計預算，不是實測能力或市場報價**。W0 為一屏 1080p、媒體總量 2 GiB、五名 ERP 測試使用者每人每十秒一次業務操作、無 history/broker。若不達標，先調整實作或選有明列成本的新硬體，不能移除trust log、驗章或 LKG 來達標；O04/O09 在 PoC 開始前確認這組預算。

| 最小 W0 範圍 | 硬體配置假設 | 必須量到的上限/下限 |
|---|---|---|
| CM4 全盒 | 2 GiB RAM、32 GiB 儲存、四核心 | 全機 steady RSS 合計 ≤1536 MiB；node ≤128 MiB；idle CPU ≤20% 單核心、播放平均 ≤200%；無 OOM/swap thrash |
| CM4 磁碟/啟動 | OS/player ≤12 GiB、兩 app 目錄合計 ≤2 GiB、current/LKG/candidate 媒體合計 ≤6 GiB、關鍵 state 預留 1 GiB | 日誌 ≤256 MiB、可用空間 ≥8 GiB；解封完成至 LKG ≤120s；同內容反覆 Apply 不增加資產 |
| root 側全系統 | 既有主機配置 4 vCPU/8 GiB，無 history 的可用資料盤 64 GiB | W0 全機 steady RSS ≤6 GiB；新增 root node/issuer/resolver/helper 合計 ≤512 MiB，更新 peak ≤1 GiB；既有 ERP p95 劣化 ≤10% |
| root 側/edge 實例 | 中央至少 ERP/PG/nginx/root node/issuer/helper 六角色；屏端 node/display/player/helper 四角色 | 十角色是下限，renderer、resolver、DNS/time、backup、trust log 工作站另外列 process/RSS，不稱兩服務全帳 |
| 本地 HMI branch | 4 core/4 GiB、64 GiB SSD 起始 profile | node/view/登入常駐合計 ≤512 MiB；每 intake broker+subscriber 配額 128 MiB/0.25 CPU，n 256 MiB/0.5 CPU；只啟用預算能容納的來源數 |

## 2.3 三種形狀

圖中箭頭只表示新連線發起方向。下行使用 child 已開連線，trust log 的管理通道不向 Type 1 開放；(a) 不靠新增 branch 主機才成立。備份及恢復工作站必在獨立故障域，同一 hypervisor 的另一個 VM 不算異機副本。

```text
(a) one physical host, isolated VMs/UIDs and dedicated NICs
[Type 1 isolated ports/AP] <--vendor reads-- [branch VM: poller/intake_i/validator]
[leaf (Type 2 unit) + display + player] --443--> [branch node] --443--> [root VM: root node]
                                                        --private HTTPS--> [ERP/PG]
[same host: root and branch roles, no L2/IP forwarding, issuer in its own UID]
[root node] --management only--> [independent trust log / recovery station]
Pure screen: leaf --443--> root node; branch role co-located, no extra site box.
```

```text
(b) same site, different VLANs
[Type 1 private ports] <--502/serial-- [branch poller] --> [validator/node]
[MQTT Type 1] --local TLS--> [intake_i] --> [feed_i] --> [validator/node]
[leaf (Type 2)] --443--> [branch node] --443--> [root node] --private HTTPS--> [ERP/PG]
[HMI] --443/8883--> [projection]       [recorder] --> [history PG]
No device-to-ERP/DB route; default deny; off-host backup/journal.
```

```text
(c) outbound-only site
[PLC] --> [local poller/projection] <--443-- [local HMI]
[leaf] --443--> [site branch/cache] --approved proxy:443--> [cloud root node]
                                                            --> [ERP/PG]
[site branch] has read-only offline policy; no cloud-to-site NEW connection.
Pure-screen profile may connect directly to cloud root node; HMI never loses its local producer.
```

# 3. 契約與語意

## 3.1 事實、受理與交接

P0 此點成立：每個事實有唯一耐久 owner，完成必須重讀 owner 的結果，不從送出、HTTP 200 或 broker ACK 推導。業務版本由 ERP 給，不借游標或接收時間；穩定單元身分與可變樹路徑分離。同版異值隔離，重送同版同雜湊只補副本。每一批新資料須先通過來源、授權及 schema 驗證；驗證前不寫業務庫，只容許受限、去識別的拒絕計數。

| 交接/同步步驟 | 必須成立的提交與重讀規則 |
|---|---|
| ERP 受理 | 線性化點為業務與 job queue/outbox 同一交易，交易外才搬運；停機/未提交不得稱已受理 |
| Manage | pending 只是意圖；registry 完成trust log 交接並可重讀後，ERP 才建 managed projection，不是第二 binding writer |
| 裝置收件/結果 | inbox/desired 提交才回保管收據；result log 先落盤再上送；ERP 結果/去重/cursor/receipt outbox 同交易提交，root node 才簽最終收據 |
| 快照/watch | 固定水位 R 後接增量，涵蓋授權 desired / job queue/actual/result log/schema/管理/撤銷/events/tombstone；過期回 gap/重新快照，歷史從 owner archive 補 |
| 反熵 | 重連及每120s批次清冊對帳，complete 丟失而 fetch 仍活也補齊，無逐命令輪詢 |
| 樣本 | 另等 PG commit receipt，不借 ERP 水位回收 |

| 契約欄位/儲存 | 規則 |
|---|---|
| 事實鍵 | env/tenant/unit/function、owner、authority_epoch、incarnation、revision、schema_rev、digest；path 只是路由 |
| announce/config space | serial、class、功能、schema、capability；管理 desired/config 與裝置 reported config 分 writer |
| 關鍵 journal | inbox/admission/executing/result log/UNKNOWN/receipt/security 全部 durable commit 後才確認；SQLite WAL/FULL 為待 G-C/G-U 驗的配置，不聲稱媒體 flush 已證明 |
| 保管收據 | 綁來源世代、key/revision、digest、接管者及 store generation；不等於物理完成 |

## 3.2 執行與 UNKNOWN

state intent 由已保存 desired 與 backend 實況的差異驅動，每 function 一個 reconciler。observed、pending、applied 分開；同版尚未套用可以繼續，已套用的同內容不得重啟 show。慢舊 worker 不能倒寫新版，refused、deferred、error、superseded 按版本留存。播放器只有 API 回覆時只能稱 backend_confirmed，沒有畫面回授就不聲稱每個像素均已呈現。

job 以不可重用 key 與 payload hash 原子 claim，先記 executing 再呼叫 backend，先寫 result log 才回報。集合增刪優先改穩定 item ID 的 desired collection；一次性動作須有相同 key 的耐久結果查詢或可核實的隔離/停止程序。實體效果已發生、result log 未提交時，多一次 fsync 仍無法消除歧義，必須持久保存 UNKNOWN、原 key、階段、資源與證據。禁止自動重跑、換 key 繞過、把未知改成未執行，或因新 epoch 清除鎖。

ERP 持有跨 register/job 的衝突資源集合、single-flight、序號及開始期限；unit 起跑再驗授權、分類、能力版本與期限。timeout 只記等待逾期，不取消 running、不釋放衝突槽；終態、可歸因的停止證據或現場隔離與人工核對後才可放行。fencing 不能撤銷已發生效果。不可核實的 job 類別不開售，UNKNOWN 可以永久存在；本案不承諾通用物理 exactly-once。

| 故障 | 可重讀的事實與恢復 |
|---|---|
| ERP crash | 已提交 outbox/job queue 在 PG；unit pin 未獲最終 receipt 的 result log；重啟不另造 key |
| branch crash | 收據前來源保留，收據後 trust log 恢復；鏡像不能決定 unit 成功 |
| unit/backend crash | 未 admission 可重取；executing 無結果先 keyed query，否則 UNKNOWN；actual 重讀 backend |
| 網路/回覆丟失 | 同 key/digest 重送；原 start deadline 不延長；late result 追加但保留 timeout |
| 舊備份/媒體全毀 | §7.2 隔離對帳；失去證據標 evidence_lost，不推論沒做過 |

| ID | 判定 | 成立方式或明示縮限 |
|---|---|---|
| F-46 | 部分 | owner、耐久交接、批次重讀；§5 保留窗及 §7 媒體 RPO 不等於無限保存 |
| F-47 | 部分 | intent 比真正 actual；job 比同 key 結果；不可核實物理效果禁用/UNKNOWN |
| F-48 | 部分 | §4 來源/用途/收件者驗證，§9 每次派送驗權；inspection 保密仍有不支援 profile |
| F-49 | 成立（設計） | 每 key/版本終態、拒絕、延期、UNKNOWN 全部走 ERP 共用結果路徑 |
| F-50 | 成立（設計） | 失聯 unknown，逾期另記 timeout，late result 可補，永非 not-run 推論 |
| F-51 | 成立（設計） | unit claim/dedupe，ERP flight/deadline；未知保鎖，安全與防重水位不回退 |
| F-52 | 成立（設計） | receipt 與 result log 分離，worker 不佔 delivery handler |
| F-53 | 成立（設計） | backend error/partial/refused 原樣成 outcome，不包成成功 |
| F-54 | 成立（設計） | 裝置可拒絕/延期；相同已套用狀態無額外效果，pending 同版可恢復 |

## 3.3 分類、schema 與相容

功能分類不是首次登錄後永久有效。產品與安全 owner 保存分類裁決及 capability revision；不明一律視為 Control-Semantic。任何 IO、韌體、能力清單或用途變更，先暫停該功能新的業務下行，作廢其舊分類授權，重判後才以新 revision 核准。ERP issuer 與 unit 同驗分類和能力雜湊，排隊 job queue、預取 grant 不能沿用舊判定；已開始效果保持原 UNKNOWN/flight 對帳，不以重分類自動取消。經白名單確認不影響控制的身分、存活、診斷管理可以繼續。

schema 先由管理權威核准、沿途持久接受並回 activation receipt，來源才啟用資料。每批攜當時的型別、單位版本及品質；舊 schema 與積壓共同 pin。未知 ID/attribute 拒收，已核准但尚未同步者由來源保存重送，不用隔離區 TTL 刪合法事件。新增類型以一份功能 manifest 連接 backend 與 ERP module，生成對映而非多 repo 手改欄位清單。

| 相容項目 | 必備契約 |
|---|---|
| 生產 binding | 首版 HTTPS；memory 是故障 oracle，非第二生產 transport |
| 協商 | wire major/minor、required_features、slot/class/schema、錯誤詞彙；未知必要能力明確拒絕 |
| 在線版本 | 當前及前一已驗 major；遷移目標 12 個月，安全撤版可提前，失聯 fleet 需處置 |
| 混版 | 新 parent/舊 unit、反向、root node/branch/sub-branch/leaf、restore；parent 先升只是預設順序 |
| 核心反例 | 八天 cursor 加新 job queue、同 key 異值、效果後 result log 前斷電、schema 亂序、分類變更、滿額/舊備份 |
| 先例邊界 | [list/watch](../10-facts/precedents.md#L44)、[twin 重同步](../10-facts/mqtt-semantics.md#L53)，2026-10-10；只借模式，不借產品保證 |

# 4. 身分與 PKI 生命週期

## 4.1 信封與用途授權

| 範圍 | 必簽與必驗 |
|---|---|
| 信任原則 | 身分、當前操作權、歷史證據分開。每 hop 驗 parent/child；Type 2 原始簽章保留至 root，中介不代簽 actual。Type 1 只由登記 branch 代述並標認證等級，不證明量測誠實 |
| 實作 | 成熟 JWS/library 簽原始 payload bytes、演算法白名單、拒重複 JSON key；候選組合未查證，不自製密碼格式 |
| protected header | format、typ、alg、kid；拒絕不認得或降級演算法 |
| 事實/命令/文件 | env_id、tenant_id、issuer、audience(unit/function)、purpose、authority_epoch、incarnation、binding_rev、schema_rev、classification_rev、capability_digest、version/job_key、payload_digest、issued_at、start_before/not_after、grant_id |
| 派送資格 | connection_id/generation、security_revision/state_digest、target、operation、原 key/digest、單用 attempt_id；§9.1 每次核准，不讓鏡像自行延長 |
| 每次網路 proof | 雙方 nonce、method/path/body hash、session sequence；hello 不授永久通行，challenge 60s 單用 |
| 上行驗證 | parent 驗來源在核准子樹，root 再驗原簽章及 scope；不信自報 CN/tenant/path 作授權 |

## 4.2 製造、RMA 與輪替

| 階段 | 身分與生命週期規則 |
|---|---|
| 製造 | image 無私鑰，裝置產鑰；station 核 serial/CSR proof/QR 公鑰指紋，預置 enrolment 根、獨立 recovery 根及 env/tenant/parent 限制 voucher；DNS/mDNS 只定位 |
| bootstrap/adopt | 只准 announce/讀採納結果；同 serial 異鍵隔離。claim/binding/授權先交接 §7.2 trust log 才發 cert；失回應可憑原鍵重讀，全部 Type 2/Type 3 舊 bootstrap 永久停用，reset 不重開 |
| 正常續期 | cert 七日、半期 jitter 續期；branch 同規則且無中繼 CA |
| 過期恢復 | 三十日內獨立 recovery route，nonce 持鑰證明＋最新安全內容才換 public cert；無一般 report/文件/命令，一般 mTLS 不放寬日期 |
| 根/用途鍵 | 設計值 root十五年/中繼兩年/線上用途鍵九十天，非廠商支援期；未失陷上級簽 trust set、確認 fleet 收到才退舊 |
| 失陷/全失 | 預置 recovery 根授權，不由失陷鍵自簽新根；根與 escrow 全失就現場重建信任 |

RMA 不等於重開 bootstrap。維修站先建立 custody case，凍結受影響身分，核定舊鍵撤銷已寫入獨立 trust log；換板產生新的 physical unit ID/key，原 chassis/資產關係只以有生效時間的履歷連結。業務綁定須重新核准，歷史保持原來源、租戶與 schema，未決工作留在舊 key，不交給新硬體續跑。新機上報只開新 incarnation，不能讓地址、serial 標籤或人工改名偷渡權限。

| RMA 狀態/責任 | 操作與可驗結果 |
|---|---|
| returned/quarantined；製造＋Fleet admin | 掃 QR/指紋、核環境、封新下行；可驗證結果只補證據，不重演工作 |
| repaired same board | 原鍵無疑慮才保留 unit ID；有遺失/複製疑慮先撤舊鍵，再核新鍵與 incarnation，不取消舊 UNKNOWN |
| replaced board/lost key | 新 unit ID/CSR/voucher，舊鍵永久撤權；舊→新資產履歷由雙角色核准，不移轉 job key |
| same serial/two keys | 禁自動覆寫，兩候選隔離並人工核 custody；舊鍵不能取得新 grant |
| resale/new tenant | 清除原租戶媒體/秘密並留擦除證據，新 unit/env 指派與一次性 claim；舊歷史僅原租戶可讀 |
| retired | 關閉操作權與可執行備份；§7.3 公鑰/解碼證據仍保留，不能隨私鑰銷毀一起 GC |

線上撤銷目標六十秒阻止新工作，操作 lease 最長三百秒，離線最多接受撤銷前已發的剩餘期限。lease 到期不供新命令、設定或敏感文件，LKG 可續播，本地既有控制不擦除。撤銷的正向簽章可經只讀狀態入口查詢，不恢復 bootstrap；一般拒絕或網路失聯不觸發 wipe。Type 2 軟體鍵可被 host root 複製，本版不假裝具硬體不可複製性或抵抗任意敵意全碟回捲。

## 4.3 時間、秘密與網路 profiles

期限必須依可信時間區間的上界判斷，不能因重開機或牆鐘回撥續命。同一 boot 以 monotonic elapsed 及最近核准時間約束，重啟須驗 RTC/受控站內時間，與持久時間高水位比對；不確定度超過兩秒、回撥或重置，停新授權與讀取，保留可播 LKG。恢復校時用受控現場程序，不先略過 TLS 再拿同一路徑時間自證。只允外出 443 的站點仍需已驗 RTC、核准站內時間源或具名現場校時，不偷加公網 NTP。

私鑰、proxy secret 與離線登入 verifier 分用途加密保存，單一 resolver 解封至專用 UID 的記憶體/tmpfs，不入 DB、URL、manifest 或 log。沒有硬體保護的首版明選「有人協助冷啟」：已授權現場保管人以獨立解封媒體/本機 console 開啟本地讀取專用卷，無須 WAN；營運發證/恢復鍵另受雙人控制。這不是無人復電承諾。要求無人冷啟時，須另核 TPM/SE 與 boot-policy provider，加入 BOM 並過同一冷啟 gate，不能把解封材料塞回系統備份。

| Profile | 身分/保密/支援邊界 |
|---|---|
| strict：無 inspection 或核准 no-decrypt | parent server cert＋child client cert，另驗雙向物件；node 終結 TLS 或受控 TCP passthrough；ERP 內部終結者另列責任 |
| inspected：資料 owner 明確核准 inspection | 企業 CA 僅 trunk trust store；雙向 proof/簽章保真偽，proxy 能讀 payload。只准非敏感資料，無 bearer、密碼 verifier、私鑰、私密內容或出勤 |
| 不支援 | 敏感資料強制 inspection、又禁止 bypass；本版未提供端到端機密 profile。另審加密須 O01、新 BOM 與 G-PKI/G-NET，不稱已解 |

以上依 [TLS 終結證據](../10-facts/transport-through-networks.md#L38)，2026-10-10；[各廠商限制](../10-facts/transport-through-networks.md#L34)仍為摘要。能採固定 profile 不等於任意客戶 proxy 必通。

# 5. 樹、trunk、傳輸

每條管理 hop 都由 child 發起 HTTPS；root node 也主動讀 ERP queue、推業務 inbound。只實作 NDJSON stream 與有限批次，共用同一狀態機，不再加 SSE 方言。consumer 先讀 scope 對應 schema/快照再 watch，游標缺口回 owner archive；慢讀者獨立配額，不拖住來源。直寫 store 不是默認後門，須 §14 G-DIRECT；HMI 本地 projection 是已明列例外。

| 參數 | 設計基線 |
|---|---|
| 保活/退路 | stream 心跳 20s、watchdog 70s；long-poll hold ≤20s，有更新即回；buffering 時改短請求但不改信任模式 |
| timeout/配額 | client 30s、受控 proxy idle ≥90s、一般上送 10s；每 child ≤2 連線，批次 ≤256 筆/256 KiB |
| 重連 | jitter backoff 1～60s、遵守 Retry-After；parent 限新連線率，ETag/304 只省流量不取代權威 |
| explicit proxy | 事前核 host/port、CONNECT、非互動認證、FQDN、企業 CA profile；407/TLS/timeout 分診斷 |

不能由 nginx 測試推論所有 forward proxy 通過；[T13](../10-facts/transport-through-networks.md#L51) 的緩衝缺口在 2026-10-10 仍未查證。普通 HTTPS 也被封時，結果是不支援/待 IT 決策，不算 G-NET PASS。

## 5.1 C-25 與 conduit

C-25 保持 hostile 前提。保留 (a) 的改造方式是在原 hypervisor 增專用 NIC 或經驗證的 VLAN 介面，把 branch VM/UID 接到新隔離 switch/AP；root VM/issuer 不掛 Type 1 介面，branch 只經受限 vNIC 向 root node:443。Type 1 必須搬到新 access port/SSID，舊 tenant VLAN 不保留第二條線路。若 NIC passthrough、switch isolation 或 host 資源不夠，就停止該 (a) profile，請 owner 核准硬體改造或明確改部署形狀，不能拿新 branch 盒的 (b) 結果冒充同機成功。

(b)(c) 可用另台 branch/firewall 盒；共同要求是不橋接 L2、不開 IP forwarding，Type 1、Type 2、HMI、管理分網。同 AP、跨 AP、有線旁路及租戶側都驗拒絕；無可靠 client isolation 時，每 Type 1 獨立 VLAN/實體埠，少量可專用 AP。設備 reset 或替换時先關接入埠，恢復並驗政策後才接回。没有搬線/改 SSID 權限的原 C-25 網路仍不支援，不能由客戶口頭接受風險就改列滿足 M-04。

| 發起方向 | 唯一允許範圍，其他 default deny |
|---|---|
| Type 2→自己的 parent | TCP 443，管理/文件/结果同 scope；不直達 ERP/DB/其他 unit |
| branch→root node | TCP 443 或指定 proxy 埠；(c) 不開 WAN inbound/22/8883 |
| poller→Type 1 | 白名單 TCP 502；RTU 本機 serial、baud/parity、穩定路徑與唯一 reader/VM passthrough |
| MQTT Type 1→intake_i | profile 指定 8883；1883 只准逐設備有線隔離鏈路並標低信任 |
| HMI→projection | 443/8883，讀者 scope；不讀 intake、不接 PLC 寫入端 |
| 節點→DNS/time | 指定來源 TCP/UDP 53、UDP 123，DHCP 67/68 按需；不跨 VLAN 轉 mDNS/SSDP |
| recorder/Grafana→PG | root 側私有 5432/socket、各自最小權限；branch parser 無 DB key |
| 備份/管理/journal | 管理網受限 22/HTTPS；獨立 trust log 僅驗證過的管理身分，不新增站點 inbound |

O02 的改造規劃占位為 NT$20,000～50,000/站、施工與負向驗收 3～5 人日；NIC/AP/埠數、配線、交通及停機另計。金額是未查證的預算意見，不是真實報價。

## 5.2 保留窗與時間品質

每窗都輸出 owner、最老年齡、容量、未確認數、水位落後及持久 gap/drop 範圍。八成告警、九成停止新 job，起跑前預留最大結果所需空間；結果 body 上限 64 KiB，大輸出需事前預留 artifact。Type 1 無來源序號時只能報未知數量缺口，不捏造精確筆數。計數器含世代，還原不得重置為零。保留長度是可見保證界線，不是資料只靠正在傳送的封包存在。

| 事實/owner | 長度與容量基線 | drop/GC/交接 |
|---|---|---|
| ERP desired/registry config | 當前至有效取代/退役；audit 180 日，引用版 pin | 滿額拒新變更，不刪當前事實 |
| ERP job queue/flight | 未決無 TTL；start deadline 預設 10min、上限 7 日 | 未開始過期記 refused；UNKNOWN 不解鎖 |
| unit result log/intent outcome | 未獲 ERP receipt 無 TTL；已交接詳細結果 ≥90 日；專用 ≥256 MiB | 滿額停新工作，不淘汰未確認結果 |
| branch result log/receipt outbox | 最終 receipt 前 pin，完成交接後另留 7 日 | hop ack 不能清掉唯一結果 |
| ERP 結果/業務事件 archive | 完整簽章至少 3 年；未決/UNKNOWN 無 TTL | D-05 法定/隱私期間 O07 首用前核；GC 留範圍/筆數 |
| dedupe/安全高水位 | 執行域至退役；未決 key 至核實結案；trust log 不隨 DB 備份回捲 | 舊 epoch 不起跑，退役不刪 §7.3 驗讀材料 |
| source event journal | 未交接已接受事件無 TTL；至少按 7 日峰值配盤，初始 512 MiB；receipt 後 30 日 | 可背壓則拒新；不可背壓記能力降級/缺口，不覆蓋已接受事件 |
| telemetry spool | 48h 或 leaf 1 GiB/branch 4 GiB 先到 | 等 PG receipt；超限丟最舊量測、記來源序號範圍，不擠 result log |
| schema/無效隔離區 | 24h/64 MiB，每來源配額 | 無效拒收計因；合法未啟用資料仍由來源持有 |
| watch/snapshot/reader | log 7 日或64 MiB；snapshot 30min；reader buffer 16 MiB | 410＋快照＋歷史回補；只中止慢 reader |
| ERP inbound F-67 | replay 2 日 | 只清已交接列，未處理超齡告警/背壓 |
| 文件/媒體 cache | pin current/LKG/applying；未引用最多3版/30日，受磁碟額度 | 不足拒 Apply，不刪唯一可播版本 |
| MES/HMI live | MES 15s、D-06 age 3s | 舊批次/接收時間不續命，畫面自行 stale |
| heartbeat/link | 120s/5min offline，conn epoch 配對 | 不逐心跳入 ERP，舊 link-down 不蓋新 birth |
| cert/操作/派送 grant | 7 日/300s/30s | 期限分別驗，派送另受 connection generation；§9.1 有界 race |
| HMI 讀快照/session | 絕對 not_after ≤簽發時間+8h；session ≤15min 且不越快照期限 | 登入/重啟不續期；收到撤銷立即停讀，離線最壞剩餘8h |
| nonce/session | challenge 60s 單用、已用 cache 10min；持久 sequence floor 長存 | 重啟新 nonce；舊 session 不能取得操作權 |
| intake_i/projection broker | 不持久 cache；每 client queue ≤100則/1MiB，實例 queue ≤16MiB | 配額能力須按固定版驗；$SYS 加來源缺口，不只總 drop |
| history raw/hourly | raw ≥3曆年，月回收可多留一月；hourly 5年 | dirty 清完再刪 raw，記 rows/bytes |
| backup/artifacts | 日備30日、月備12月；operational restore 只准30日內；release bytes 至 fleet退出後至少24月 | 更舊只離線查閱；安全與證據材料按最後引用另延長 |

近源 sample_time 與 received_at 分列，保留 boot_id、sample_seq、clock_quality、不確定度和採樣期品質。暖機、故障、無效時間先排除於平均及告警之外；不確定度超過兩秒或未來偏移超過兩秒不顯 fresh。合法遲到樣本可補歷史，不刷新即時值或 Fleet 存活。沒有可靠採樣時間的 Type 1 只報觀測時間與限制，不冒稱取得原本不存在的時間。

# 6. MQTT 放法

採 [ledger-review](../40-mqtt-ledger/ledger-review.md#L62) 的增量計帳，修正其普通 intake 的 publish-only 規則為「依實際 profile」，保留 Sparkplug 必要握手。Mosquitto 是首選候選，不是唯一合法 broker；其 [雙授權](../10-facts/mqtt-brokers.md#L22) 與 [dynsec](../10-facts/mqtt-brokers.md#L28) 是 2026-10-10 研究，固定交付版仍需 G-L。成熟 parser/client 均列成本，不自寫子集來消去時鐘。broker 可以持本地 TLS/ACL 憑證，但不得持樹、ERP、CA 私鑰。

## 6.1 可信來源 feed

| 邊界 | 首版明選的可驗方法 |
|---|---|
| publisher→intake_i | 一個核准 principal 對一個隔離 feed，獨立 UID/netns/listener，只允該 principal 發 vendor 白名單 topic；受控 subscriber 只有讀權，其他 Type 1 不可進 |
| 固定 topic | 設備不用改碼；兩台同 topic/同 payload 進不同 feed。不能獨立認證者綁已 commissioned 的逐設備實體埠/VLAN並標低信任；不能辨識/改接線即拒收，不開共享匿名入口 |
| intake_i→subscriber | 固定 broker 身分及本地配置識別 feed；不信 payload id、client ID、User Property 作來源證據 |
| subscriber→validator | 原始 bytes/接收序號送 bounded IPC；validator 依 OS peer UID/socket 映射 feed，忽略訊息自報 feed_id，再驗管理端簽署 feed→principal→stand-in/incarnation 對映，只有它可產生來源鍵 |
| 失陷邊界 | intake_i 最多污染自身低信任來源，改 topic 不可冒充其他 feed；G-M 驗 UID/mount/socket/資源隔離，不宣稱防 host root |
| 實例成本 | N來源=N intake＋N subscriber，需要投影再+n；同家族不重算 K，配置/資源/憑證/更新乘數計帳，不依賴未定 rewrite plugin |
| 共享 broker 後續 | 須先有可核驗認證身分封裝接口及同等隔離證據，不以 topic 查表替代；本版不假設訂閱介面會帶 publisher metadata |

node 在 validator 後再驗已宣告 schema、單位/倍率、品質及速率，先更新逐 metric view，再獨立上傳。資料到 durable journal 之前的丟失不屬已接受事件保證；來源無序號/重送能力時，不聲稱可重建或辨識所有重複物理事件。HMI 永不讀 intake。

| 使用 profile | 明確配置與支援界線 |
|---|---|
| T-a 普通 MQTT Type 1 | 固定型號/韌體/TLS驗證/credential/topic/QoS/session/時間/replay profile；QoS0/1依設備，普通 raw 無 subscribe |
| 普通 curated export | node 持有逐點值，QoS1/retain=true；讀者 clean session/expiry=0，重連重取快照；只保 live，不當歷史 queue |
| T-b Sparkplug | ingress 是 Host，egress 是 Edge Node；完整 BIRTH/alias/seq/bdSeq/DEATH/STATE，各自狀態與身分 |
| Sparkplug 旗標 | NBIRTH/DBIRTH/NDATA/NCMD QoS0、retain=false；NDEATH Will QoS1、retain=false；Host STATE QoS1、retain=true；Clean Session，或 Clean Start+Expiry0 |
| 必要回程 | Primary Host 的 STATE 與限定 Rebirth；validator 驗目標/布林 payload/授權/限速後轉送，其餘 NCMD metrics/DCMD 不接製程寫入 |
| T-c 客供 broker | 依可用 ACL/namespace/配額/維護責任驗收；只給 publish 權就只 export，不要求 dynsec/bridging，也不授 adopt 權 |

Sparkplug 旗標與生命週期只引用 [MQ19](../10-facts/mqtt-semantics.md#L66)、[MQ20](../10-facts/mqtt-semantics.md#L67)、[MQ21](../10-facts/mqtt-semantics.md#L68)，2026-10-10；[具名工具/codec 相容](../10-facts/mqtt-semantics.md#L70)仍未查證。未知 alias 拒收並要求有限 Rebirth，不把編出 protobuf 當完整標準支援。

retained 對晚加入者有用；重啟從 owner 回灌仍有效值，無效者顯 stale。依 [MQ9](../10-facts/mqtt-semantics.md#L36)，2026-10-10，權限撤回會影響重送，不推出同身分每次換 cert 都要清空。Will 只提示連線，畫面依來源時間老化。leaf 第一版仍 HTTPS；G-X 用相同 broker、schema、隔離、HMI、文件路徑比較真正少掉的 adapter/IT 工時，不把全部 MQTT 收益歸第二 binding。

# 7. 回傳資料與 store

## 7.1 歷史、告警與消費者

| 儲存責任 | 規則 |
|---|---|
| 首屏/首歷史 | 一屏無 history、ERP PG 仍在；首個歷史承諾起用我方 ops 管的獨立 PostgreSQL，與 ERP 同引擎但分 WAL/資源/備份窗口，recorder 留 root 側 |
| 來源/提交 | stable series 不因 type/path 改名；sample_id 綁 unit/incarnation/sequence/attribute，同 ID 異值隔離；去重/樣本/dirty 同交易，commit 後才 receipt；量測、job blob、出勤事件分表 |

窄表按月分區，型別/單位/schema revision 不可變；合法遲到只要仍在三年 raw horizon 就標 dirty 冪等重算，不因七日 spool 或十二個月協定過渡已過而忽略。roll-up 保存 sum/count/min/max，不平均平均值。分區回收等 dirty 清完，記修訂水位與刪除範圍。[partition](../10-facts/postgres-timeseries.md#L40) 及 [MV 全量替換](../10-facts/postgres-timeseries.md#L41) 為 2026-10-10 原文研究，不是本案吞吐證據。

容量依全站 series×rate×期間計，不把 N-15 的單機三十屬性當全站上限。G-S 量 index、WAL、spool、備份及查詢；預估超十億樣本、儲存超可用六成、查詢 p95 超兩秒或恢復超八小時就啟擴容/替代引擎評估，不自動切 VictoriaMetrics。其 [Enterprise 界線](../10-facts/postgres-timeseries.md#L54) 為 2026-10-10 證據；型別、查詢及退出仍需驗，遷移不叫一條 SQL。

業務門檻規則由 ERP 寫 desired，最近資料 owner 計算遲滯並持久保存 transition/event_id，再由 ERP 通知站點值班者。Grafana 僅 ops 歷史、門檻線與系統健康，避免兩份業務規則源。consumer 各有獨立身分與 line/function/field scope，SQL view/role、HTTP、MQTT 依同一核准清單審核，不借 site credential。dashboard-as-code 重佈署前檢查未受管差異，不覆蓋而不告警。

## 7.2 trust log 與受控 restore

新 epoch 只能防版本倒退，不能找回被舊備份抹掉的撤銷。本版把每次 adopt、revoke、key/policy、binding、分類、安全底線、讀者權限及 connection 封存世代變更，寫入獨立管理故障域的trust log。其 owner 是trust authority，root node registry 是可重建的安全內容投影，不以 ERP Fleet 畫面反推。trust log 使用既有 PG/SQLite 家族，不新增引擎，但增加獨立工作站、異機副本與同步保管責任。

安全操作先在本地記 pending，再以預期 revision 的 CAS 追加完整決策、前一 digest、結果 state digest 與來源證據；trust log 及異機耐久副本完成後回簽 checkpoint，root node 套用核驗後才向操作員確認完成。斷線時本地可以先拒絕/隔離，但只能顯示待完成撤權，不能謊稱全域已交接；新增權限與發證則停止。完成撤銷的保證不沿用一般業務二十四小時 RPO。

恢復前先封操作入口，向未回捲的 trust authority 取得 nonce 綁定最新 checkpoint，重播trust log 至其 revision，核對整個安全狀態 digest 一致，才核發新 trust epoch。只取更大 epoch、新 nonce 或仍能證明持有舊私鑰都不夠。發新 grant/續期時，在 trust authority 的當前安全狀態上作原子檢查，舊 revision 的簽署請求重判；此前已合法發出的 grant 只保留原有界期限。trust log 缺段、兩副本衝突或無最新證據時，受影響身分零新授權，隔離重建，不拿舊名冊補權。

有撤銷與無撤銷的兩個世界即使 epoch 相同，也會有不同 security_revision/state_digest 與完整可恢復決策；因此復原後裁決必須不同。安全內容不是只有摘要：若 bytes 已丟，digest 不能當重建資料。這套規則涵蓋受控 restore，不宣稱單一 Type 2 軟體能察覺任意敵意全碟回捲。一般重開與受控還原不同，後者必須走新 checkpoint，不可借離線讀權跳過。

| state owner | backup/restore/重建責任 |
|---|---|
| ERP ops | PG＋CMS filestore 同 manifest；desired / job queue/flight/inbox/cursor/results/connection state 一起還原，先封 dispatcher |
| trust authority | trust log/checkpoint 完整 bytes、發證與撤銷、分類/權限/最低安全版本；獨立故障域與異機副本，不隨 VM snapshot 回捲 |
| root node/node ops | registry 投影由 trust log 重建；unit admission/result log/UNKNOWN/dedupe、schema、id map、LKG 與媒體一致備份 |
| branch ops | Type 1 origin journal、stand-in/map/incarnation、未交接事件、配額/缺口必備；純鏡像才可清空 |
| DB/dashboard ops | history PG/roles/schema/dirty/roll-up；Grafana 實際 DB、users/datasource/plugin 設定或可重建證據，不只 JSON |
| HMI 管理 | consumer directory、簽署離線讀權、verifier、撤銷高水位與本地 TLS/session 鍵分流；§9.2 控制還原失效 |
| release owner | 完整 app/helper/OS/boot/recovery bytes、BOM、簽署 manifest、migration journal、stop marker；兩個異機存放者 |
| 網路/IT | AP/switch/NIC、DNS/DHCP/time 的版本化設定；reset 先封埠，重建政策後才接回 |
| broker owner | cache 空啟動，依核准政策重建 ACL；一般還原先同步最新安全內容，普通離線重開只准 §9.2 固定期限讀取 |
| key custodians | CA/發布/部署解封材料加密獨立 escrow，與狀態/公鑰證據分流；staging 永不取得 |

durable 涵蓋已驗 process/OS crash、斷電後有效媒體，不涵蓋同故障域所有副本同毀。中央業務 RPO≤24h、RTO≤8h 是 O05 待核基線；edge 整卡損毀 RPO 是最後異機收據，可能更差，必須顯示 evidence_lost/gap。雙人復原由主保管人與另一位核准保管人執行，另預先指定第三名替補或簽約受託人；一人缺席可用另兩名，不降為單人解封。無兩名可用則保持隔離，不能承諾八小時；服務窗口與計時起點列 §15。

## 7.3 歷史證據不是可執行信任

退休、撤銷或關閉在線舊 major，只禁止新的操作，不能提前刪三年 archive 的驗讀材料。資料 owner 按「最後引用」保存原 bytes、kid 公鑰鏈、當時安全 checkpoint/授權、schema/單位、簽章格式、唯讀 decoder 與可重現 fixture，至少至最後 archive/roll-up/法定保存到期；未決 UNKNOWN 可延長無限。私鑰不因此延長效期，staging 有公鑰也沒有操作權。

| 歷史驗讀 | 規則 |
|---|---|
| 遲到/到期 | 舊證書到期不刪 result log；用已存在可信 admission/receipt、當時鍵政策與來源證據驗讀 |
| 撤銷/缺證據 | 已撤銷鍵補送、無可信時間或缺收據者隔離，不信自報「撤銷前」時間就標成功 |
| 解碼/演算法退役 | 舊 decoder 在無網路/無 production secrets 的只讀環境執行；退役前保存核准的新證據封存收據，不重新簽成命令；無法驗讀標 evidence_unverifiable，不重做效果 |

# 8. 升級路徑

選 node register 式應用更新，本版不裝 Mender。desired.software 是發布鍵簽署的硬體/OS/依賴/最低安全版本 manifest；沿 parent 預取完整 bytes、驗 hash，進 staged，由獨立 helper 切換，健康確認後才回 committed actual。下載成功不是升級完成，CMS 不可下任意 shell。先一台 canary、再小批、再全站，失敗停止 rollout；離線盒子的 pending/failed/rollback 必須可見。

應用只假設已驗檔案系統可保留 current/candidate 兩個完整目錄與原子切換指標，這不是 rootfs A/B。bundle 明列隨目錄切換的 Python package/程式與仍共用的 interpreter/TLS/native libraries；改到任何共用依賴就屬 OS 更新，不以 minor 名稱降低風險。helper 必須可獨立啟動且有前任恢復路徑；若它與壞掉的 OS/runtime 同時不能啟動，就由現場 recovery image/燒錄 kit 接手，不要求故障 node 自救。

| 更新類別/owner | 正常路徑 | 失敗出口 |
|---|---|---|
| 共用救援基線；硬體/ops | kit含已驗carrier/eMMC/SD映像、連接器、離線完整artifact、工具及獨立解封材料；實際支援未查證，G-U逐板驗 | 所有minor/security/kernel/Python/TLS/renderer/major/EEPROM/board firmware都有現場保底；改共享OS只准有維修窗且救援可用，canary不能代替恢復；低於安全底線只准forensic read，不開operational權 |
| app/backend/helper；release | 完整預取、驗簽、停新 admission、candidate 切換、核狀態與 readiness | 未寫不相容狀態可回安全舊 binary；helper 失效用獨立 kit |
| OS minor/kernel/library；ops＋硬體 | 核准套件/完整映像 canary，維護窗執行受限動作 | 斷電/不能 boot 亦現場重灌安全映像，再走 §7.2，不以 apt rollback 猜原狀 |
| OS major/boot/firmware；硬體 | 首版現場維修，備份/封權後變更 | 實際救援程序不通則不售該硬體 profile，不假設既有 A/B |
| root node/journal 工作站；安全＋release | 獨立副本已核 checkpoint 後分別維修，簽發先停 | 不同時回復兩份舊副本；無最新安全內容保持停權 |

壞 schema 不一定是格式不相容，也可能是語意寫錯。本版分開不可回退 J 與衍生 D：J 保存 admission、執行嘗試、result log、UNKNOWN/locks、去重及安全水位；D 才是可重建 id map、applied 投影、latest、索引與展示快取。migration 記輸入 revision 範圍/digest、轉換版本及每階段提交，先建 D'、核對再切指標，不能覆寫 J 或用新程式猜測效果已成功。

候選已寫錯 D 且又接受新 result log 時，freeze 新工作、保全 J 與故障 D，從簽署 schema/manifest、舊映射證據、J 及 backend 唯讀查詢向前修復 D'；新舊資料都對帳後再開。不能重建的映射保持 unknown，以具名維修處理，不靠重播 effect 修好畫面。不可逆 migration 必先停收並保存可對帳輸入，直到有向前修復方案才部署。回滾程式、更新 OS 或重灌均不回退 security highwaters、connection generation、result log、未決鎖及 deliberate stop。

# 9. 邊緣 process 切分與 ERP 邊界

| 角色/責任 | 權限與執法 |
|---|---|
| parser/sensor/Modbus/display/LED | 各 UID/process、有界驗 peer IPC；localhost非唯一防線，hostile decoder不可讀CA/ERP/private volume |
| writer/issuer | 只有 recorder 持 history role；issuer/policy只簽核准用途/digest，不提供任意bytes簽名服務 |
| supervisor | readiness分process/backend/品質/授權；唯一owner持久保存stopped marker，重啟不拉起刻意停止者 |
| ERP/root node | ERP持desired / job queue/deadline/single-flight/show/CMS；root node持binding/config/route與安全投影，不搶業務writer |
| connector | 連線級IT cadence，domain module只貢獻型別/結果，不各自cron |
| C-20/F-68 | 使用者交易不遠呼、不任意rollback；inbound先驗service identity/scope再寫管理/業務inbox，真403/409/503；模組實際安裝/route測試，不借bundle綠燈 |

## 9.1 Archive 是派送 gate

單一 queue write gate 還不夠。每次 queue fetch、retry、watch 補送、鏡像重建後 delivery，以及 command/Manage/新文件派送 grant 的簽發，都要在 ERP 當前 connection 狀態與 generation 上重新驗權；歷史查詢與 result log 回流不受停送影響。root node/branch 預取內容可以是不可執行資料，但不得用鏡像自行產生新的派送資格，原簽章也不代表永久授權。

archive 本地交易改 STOPPING、遞增 generation、停發 ticket，並記trust log 待交接。每次新派送嘗試，包括 retry/fetch/mirror delivery，須向 ERP 換單用 attempt ticket；與 archive 的列鎖/CAS 序列化，其後只回 blocked_archived。root node 送出前驗票，轉送同一在途票亦驗世代/剩餘期限，不重發延命。重新啟用先取最新 checkpoint、三方對帳及新 generation；原 key/開始期限不改，UNKNOWN 不解鎖。

archive 前已核發且在途的 ticket 最長三十秒，不超過操作 lease 或原 deadline；unit 在 durable admission 與起跑前各驗一次，無可信時間便不開始。UI 先顯示 STOPPING 與最晚新起跑時間；必須trust log 已確認，且停送收據齊全或全部在途票的最壞期限加兩秒界限耗盡，才顯示 ARCHIVED。斷線者沒回覆就等期限。真正已開始的 worker 不取消，result log 可回流。這是 F-70 最多三十二秒的在途妥協，不把預取/入列叫 running。

| ERP/文件/政策 | 執法規則 |
|---|---|
| fresh DB | 無 connection 即 actionable error，不靜默丟掉命令 |
| CMS origin | root node→ERP 用 rotatable per-record token、constant-time 檢查；resolver 供 secret，不進 desired |
| unit→parent 文件 | record/version/hash/child 引用 grant＋unit proof；新配送同受 archive gate，LKG 本地續播另定 |
| 外部 link | allowlist proxy 逐次驗 DNS、redirect、實際目的地，拒管理/metadata 地址，backend 不任意 fetch |
| defacement 門 | viewer/editor/publisher/fleet admin 分權；root node 獨立設定站點/動作 scope、五分鐘累積額度，不信 payload 自報 user |
| 大範圍動作 | >5 屏 publish 或批次 revoke，帶外雙人核精確 digest、單用且5min到期；拆小請求仍累計 |
| staging | host 環境來自備份外；第一封包/dispatcher/resolver 前封 prod egress、排除 prod secrets/grant、archive connection；不先連 prod 問環境 |

F-59/F-72 保留 origin 逐 record token，unit 改 parent grant/proof，是明示機制妥協，不是假稱仍直拉 ERP。合法 publisher 在 scope 內的惡意內容仍有殘餘風險。Anthias 首客前核整個映像、renderer、授權及修補來源；支援線不合、重大可利用缺陷無處置或六個月無可信維護證據就停止新售、啟 G-PLAYER。替代候選是既有 browser kiosk 加受限 scheduler，reconcile/id map 留 unit，不造 browser，不保證兩週換完。

## 9.2 離線登入與整島冷啟

| 離線登入材料/owner | 規則 |
|---|---|
| 管理端 directory | 預授權 reader ID/line/function/field scope，簽固定絕對截止快照，權限變更寫trust log；不借unit/site憑證 |
| branch verifier | 本地讀者獨立密碼verifier與快照digest一同保管，成熟scrypt、無可登入明文；固定庫/參數未查證，G-L/G-H驗收 |
| 佈建/拒絕 | 材料只經M或受控本機，I不搬運；未預授權的新browser/讀者拒絕，不回退匿名/共用站點帳號 |

WAN 斷後，全新無 session 的 browser 可向仍有效的本地 directory 登入；成功只發十五分鐘本地讀 session，截止不得超出快照絕對 not_after。反覆登入、branch 重啟、密碼修改或快照從舊備份還原都不能延八小時。每次讀取都核 scope、快照截止及本地最高撤銷 revision；收到撤銷立即停讀。WAN 中未能收到撤銷的代價是剩餘八小時上限，不是 cert 七天。一般受控 restore 不准離線重啟權限，須最新 trust log 重建後重授；普通斷電重開才可沿用原期限。

整島順序明定為：先保持 production 操作 gate 關閉，載入備份外環境與 stopped 狀態，驗本地 RTC/時間高水位；現場保管人解封「僅讀」卷，再驗已預置簽章根、讀者/採樣 policy 的 digest/revision/絕對期限；啟動既有唯讀 poller、intake、validator/view，依本地核准快照重建讀取 ACL，最後供 HTTPS 頁面與登入。此順序不依賴 WAN、ERP、尚未取得的 operational boot grant 或雲端 secret service，因此沒有循環。要新命令、重新採納、改設定、加入新來源或重新授權，仍須線上最新安全內容及新 boot grant。

時間失效、卷不能解封、policy 過期/回退、來源不在名冊時，拒絕新讀與該採樣投影，畫面明示 unavailable/stale；已下載完整 LKG 可依其獨立規則顯示，不能偽裝 HMI 仍在更新。這包含「WAN 已斷、branch/PLC/HMI 全部斷電後再開」而非只開新分頁。要求無人現場解封或超過八小時的離線新讀，屬 O10 的另案 profile，不默認可用。

# 10. D-01～D-06 逐一走過

下列都是設計走查。各流程在 (a) 直接或同機 branch、(b) VLAN branch、(c) outbound site branch 上各驗一次；不把控制產品驗收混進管理面，也不拿 stub 代替實際硬體能力。

## 10.1 D-01 螢幕

| 步驟 | 操作與可觀察結果 |
|---|---|
| 1 | ERP編輯/Preview/Publish manifest，stable item ID/順序/duration/日期/asset hash；Apply同交易outbox |
| 2 | 每次派送經§9.1，沿已開HTTPS到leaf；(c)私密內容不走I，無核准出口阻塞 |
| 3 | 只供所求版本或拒絕，全媒體驗齊、保LKG/id map才單槽reconcile |
| 4 | backend增刪排序並讀回版本/hash才applied；error/refused/deferred逐版回ERP，delivery非換頁 |
| 5 | 編輯重發所有引用screen；同值不重啟，舊worker不倒寫，ghost只於成功切換後回收 |
| 6 | MES工單交易產投影，頁面約5s讀parent JSON、idle/age/15s stale/逐屏last-poll；WAN斷續播完整LKG |

## 10.2 D-02 環境感測

| 步驟 | 操作與可觀察結果 |
|---|---|
| 1 | 啟用才載獨立driver process，crash不拖同盒display/command handler |
| 2 | ready才1Hz採樣/30s平均；warm-up/fault/無效時間於聚合告警前排除，不補健康零值 |
| 3 | 批次帶來源時間/quality/sum/count/schema/sequence，先spool再直root node或經branch |
| 4 | writer去重、PG commit才receipt，Grafana限域view，ERP不建每sample row |
| 5 | HCHO 80ppb是owner需求、法規未查證；來源durable越線/恢復事件，ERP停機可補告警 |
| 6 | Fleet自動列功能/品質/存活但無Manage；三年歷史/圖表先G-S，無history首屏不附承諾 |

## 10.3 D-03 Modbus 與硬體限制

| 步驟 | 操作與可觀察結果 |
|---|---|
| 1 | branch一次登記profile/stable ID/serial/bus/address/點表/signedness/倍率/單位/週期 |
| 2 | 沿途schema耐久核准才啟用；同址換表新unit/incarnation，無serial人工確認，改名不斷史 |
| 3 | RTU隔離RS485/baud/parity/唯一reader/VM passthrough；TCP只poller→白名單502，無WAN Modbus |
| 4 | 低權限decoder近源蓋時、min/mean/max/有號differentialPressure，journal→PG/Grafana，補傳不刷新live |
| 5 | 優先電力/差壓/門磁/壓縮空氣，振動延期；全部旁路，不進PLC控制/安全聯鎖 |
| 6 | 選料過下表，硬體教訓繼承 [N-20](../00-requirements.md#L193)/[N-21](../00-requirements.md#L194)，非本輪量測/法規查證 |

| 約束/產品 profile | 明確拒絕與驗收規則 |
|---|---|
| 7A-BOX 供電 | 原需求記錄隔離I2C header沒有3.3V，「5V」為5.3V非穩壓；不容忍者禁止直接。選合規穩壓/隔離/電平轉換或換carrier，依datasheet全負載/瞬態/溫度容差量測 |
| 3.3V 候選設計 | 起始目標3.3V±5%，仍不得超出實際part更嚴格限制；pinout、地參考、隔離屏障、上拉電壓均列Parts，不由標籤猜可接 |
| 室間差壓 | 本版獨立profile建議±50Pa、誤差≤1Pa；reference零漂≤0.5Pa/24h、23±2°C測。門狀態同步保存，開門區間不與關門基線混判 |
| 濾材/設備差壓 | 獨立profile建議±2.5kPa、誤差≤1%FS；取壓位置、正負方向及堵塞失效fixture獨立，不套室壓標準 |
| 壓縮空氣管線壓力 | 獨立profile建議0～1MPa、誤差≤1%FS；介質/耐壓/接頭另核，不用低壓差感測器代替 |
| QA/reference | QA必有可校準4-20mA路徑與校準證據，初始誤差目標≤0.5%FS；reference優先零漂，不只解析度；以上數字是O06待核產品意見，非型號能力 |
| 健康假值 | 拒用失效時自動歸零成健康外觀的部件，包含需求指出的LWLP5000；斷線/堵孔/超範圍必fault或缺值，不能補正常值 |
| 壓種/用途 | 三profile獨立SKU、點表/單位/校準，barometric零件不替代室間或製程差壓；不得跨壓種套用 |
| 法律/安全 | 壓力容器僅既有ports的法規說法未查證，未經硬體/法律核准不施工；消防加壓與職安綁定氣體偵測排除，CO2等非安全旁路仍逐用途核定 |

## 10.4 D-04 LED

| 步驟 | 操作與可觀察結果 |
|---|---|
| 1 | ERP驗capability/分類，空supported_effects拒絕；新增IO先重分類，舊排隊工作不自動取得新能力 |
| 2 | config/effect/playlist集合優先intent，add/remove用stable item ID；resume等job須keyed結果/停止能力gate |
| 3 | controller持standalone/mode，切換可refuse/defer；parent失聯不清本地playlist |
| 4 | 同機timeline本地跑；跨盒預載但非原子/不保同步，網路不逐拍致動 |
| 5 | show固定成員/能力快照，ERP按strip/function彙整applied/refused/unknown/partial，不以一回覆算全場 |
| 6 | effect後result log前斷電保UNKNOWN/鎖；archive不刪result log，新key/reboot/rollback不准偷重演 |

## 10.5 D-05 門禁/出勤管理

| 步驟 | 操作與可觀察結果 |
|---|---|
| 1 | 具名reader-management backend，已有平台依F-34做ERP connector，不重建控制面 |
| 2 | reader ID綁硬體proof/製造記錄，adopt驗nonce/env/tenant/boot policy；SAM/SE簽名非自動attestation |
| 3 | 管理只site/parent/hostname、診斷/遙測啟用/回報週期；卡權/開門排程/門狀態/lock/wipe/控制loop排除 |
| 4 | registry config_rev→reader applied/refused/deferred；新parent試接/驗權/對帳後提交，失敗留有效舊設定 |
| 5 | 120s硬體簽心跳，boot及每10min新nonce attestation，15min失鮮unknown；online≠verified |
| 6 | 出勤獨立durable log/id/seq/quality，ERP receipt交接；DESFire/OSDP/TLS/secure boot/簽署韌體/SDK及法定保存未查證，G-A/O07首用核，I不傳敏感事件 |

## 10.6 D-06 現場 HMI

| 步驟 | 操作與可觀察結果 |
|---|---|
| 1 | partner提供授權唯讀Modbus點表或明確UA Client/Server，PubSub另核編碼；不假定PLC已有MQTT/HMI |
| 2 | poller→validator→逐metric view先本地分流，全Type 2/cloud亦有producer，不等120s心跳/30s平均 |
| 3 | branch預置HTML/JavaScript HMI、250ms限域snapshot；頁面/登入/資料/解封依§9.2本地鏈 |
| 4 | 1Hz刺激/採樣至畫面p95≤1.5s/p99≤2s、age>3s stale；更快另tap，root 側≤1Hz |
| 5 | 普通重開限原絕對8h讀期限，新browser亦預授權；壞時間/restore/到期拒讀，登入/reset不續命 |
| 6 | 指定MQTT/Sparkplug才§6，驗late join/BIRTH/alias/seq/bdSeq/STATE/有限Rebirth/停PLC；recipes/溫控/致動留local，ERP業務、PG/Grafana分析 |

# 11. 妥協清單

「設計滿足」不等於產品已通過。需求可取捨，情境錨點不能用文字取消；下表將取得的收益與代價分開，未核准的部署限制仍留 owner 選項。對同一故障的多個來源 finding 可以共用修補，但 §14 每個原始 ID 保留獨立去向。

| 需求/brief §2 選項 | 妥協內容 | 換到什麼 | 代價 |
|---|---|---|---|
| F-16/F-17 全走樹 | 管理/文件/長期資料預設樹，HMI本地projection | 現場不依WAN | 已驗深度外另N-18；直寫先G-DIRECT |
| P0 下行pull | child建連上的stream，短請求退路 | 低延遲提示 | 兩種HTTP承載同測，不保證必通 |
| 不用MQTT | 有Type 1/工具需求才加 | 成熟入口/扇出/retained | client、每來源feed、隔離與互通成本 |
| ERP當root | ERP UI＋root node registry；scheduler仍ERP | 身分與ERP遷移分離 | 兩owner對帳，不是雙writer |
| 最小兩服務 | 十應用角色下限及全部基礎依賴 | 可恢復/可維護首屏 | §2數值預算與實測，不能口號省略 |
| 平白PG | 第一個history即獨立PG實例 | ERP資源/備份隔離 | 多一實例，無任意跨DB join |
| NGSI不留 | 不作內部命令契約；需求觸發唯讀v2/LD facade | 少舊命令鏈 | 標準mapping/資料模型授權另核 |
| 每節點自建 | 借DB/browser/OS/broker/crypto/backup library | 不造基礎引擎 | 自有契約/政策仍需外審及接班 |
| F-46/F-47 | 有限媒體RPO、不可核實物理效果UNKNOWN | 不假成功、不盲重跑 | 某些job禁用/人工核對 |
| F-70 | STOPPING期間既發ticket最多32s起跑窗口 | 有界競態而非假即時 | 每retry/fetch/mirror重驗，已running不取消 |
| Type 2撤銷/N-11 | 操作300s、非敏感HMI讀最多8h | 有界離線運作 | 非全域即時；冷啟解封/時間失效拒權 |
| N-02 | I只准資料owner核准的非敏感內容 | 有條件outbound | 對proxy不保密，敏感無bypass不支援 |
| F-59/F-72 | origin保留per-record token，unit用grant/proof | secret不穿中介 | 原直拉機制變更，逐record驗權重測 |
| N-10/N-07 | app遠端更新；所有共享OS變更具現場救援 | 不假定rootfs A/B | 每盒工時/停機，無人解封另profile |
| F-28 | 即讀owner snapshot，新report批次refresh | 無逐命令poll | UI顯示等待與資料年齡 |

## 11.1 九個錨點

| 錨點/來源 | 處置 |
|---|---|
| A01 [Odoo是產品](../03-brief.md#L17) | §9留ERP CMS/desired / job queue/業務綁定意圖，量測不進ORM |
| A02 [台灣/C-25](../03-brief.md#L18) | §5.1同機改造/逐埠fallback、施工費與負向驗收；不改原網仍不支援 |
| A03 [三形狀](../03-brief.md#L19) | §2三圖＋§5 conduit；各自PASS，不以(b)代(a)，敏感inspection阻塞保留 |
| A04 [單站規模](../03-brief.md#L20) | §7/§14全站W1/W2/W3負載與三年horizon，不拿單機量當全站 |
| A05 [CM4/Type 1](../03-brief.md#L21) | §8所有OS/boot救援；§6固定topic不改韌體；§10.3硬體拒絕條件 |
| A06 [小團隊](../03-brief.md#L22) | §2 28+U分軸；§14全角色工時，§15雙人/替補/窗口 |
| A07 [最小一屏](../03-brief.md#L23) | 無history/MQTT/Grafana；§2整機MiB/GiB/CPU/啟動預算 |
| A08 [D-05/D-06](../03-brief.md#L24) | §10.5管理/事件在、控制不在；§9.2/§10.6整島離線HMI |
| A09 [已知教訓](../03-brief.md#L25) | §11.3 C/B回歸，§14同一release合驗，不宣稱換平台自動修bug |

## 11.2 101 條 M/F/N 處置

| ID | 處置與具體落點 |
|---|---|
| M-01 | 設計滿足：§13首用/退出，fleet零依賴90日且失聯已處置才刪 |
| M-02 | 設計滿足：§2 K/實例/repo/語言分帳，U由G-L展開 |
| M-03 | 條件滿足：§2/§5各形狀，包括同機Type 1改造；不支援profile明示 |
| M-04 | 條件滿足：§5逐VLAN/逐埠隔離，branch 只向 root node，原網不改禁接 |
| M-05 | 條件滿足：G-L/O08逐發行物與downstream權利，非零義務 |
| M-06 | 設計滿足：§2/§13月弱點、季支援、EOL前遷移與接班 |
| F-01 | 設計滿足：§5/§10本地聚合，root 側每measure≤1Hz |
| F-02 | 設計滿足：§5.2近源時間，未知不冒充接收時刻 |
| F-03 | 設計滿足：§9單inbound僅管理/業務，量測到PG |
| F-04 | 設計滿足：§5.2品質gate、§10.6畫面自計stale，不補零 |
| F-05 | 設計滿足：§10.2 warm-up/fault/缺值可見 |
| F-06 | 設計滿足：§3.3/§10.4 capability版本、缺失拒絕、變更重分類 |
| F-07 | 設計滿足：§9 sensor/driver分UID/process |
| F-08 | 條件滿足：§7三年raw，第一歷史首用前G-S |
| F-09 | 設計滿足：§7 dirty bucket冪等重算與分區GC |
| F-10 | 條件滿足：§7 node門檻/ERP值班，Grafana畫線；法規未查證 |
| F-11 | 設計滿足：§3.3/§7型別單位不可變revision，壞migration依§8向前修 |
| F-12 | 設計滿足：§7量測與result log/event分流 |
| F-13 | 設計滿足：§7 dashboard-as-code，drift先檢查 |
| F-14 | 設計滿足：§7 stable series，§4.2 RMA履歷不混原始資料 |
| F-15 | 設計滿足：§2純屏無history，ERP DB仍必需 |
| F-16 | 明示縮限：§2先驗root node/branch/sub-branch/leaf，更深另N-18 |
| F-17 | 設計滿足：§5只撥parent，HMI直讀是明示資料例外 |
| F-18 | 條件滿足：§5.1 L2改造＋§6來源feed＋§9分權，非單層ACL |
| F-19 | 設計滿足：§3穩定unit與可變path，§4.2換鍵/RMA不重生舊權 |
| F-20 | 設計滿足：§3 unit/function分型，§10多功能逐結果 |
| F-21 | 設計滿足：§5 outbound，IP不是身分 |
| F-22 | 設計滿足：§10.3 serial/bus/profile，§6 feed可信映射；不可區分者拒收 |
| F-23 | 設計滿足：§4 discovery只定位，voucher驗parent |
| F-24 | 設計滿足：§4 branch同Type 2續期/撤銷，無中繼CA |
| F-25 | 設計滿足：§2同node可unit兼branch，權限按function分 |
| F-26 | 設計滿足：§3 announce/南側一次登記自動Fleet，僅管理類有Manage |
| F-27 | 設計滿足：§5.2有效來源時間＋monotonic，5min offline |
| F-28 | 明示妥協：§11立即讀snapshot，新現場report待批次refresh |
| F-29 | 設計滿足：§3重連及120s反熵自癒 |
| F-30 | 設計滿足：§5心跳最新snapshot，只有轉態入ERP |
| F-31 | 設計滿足：§3.3未知id/key拒收，驗權先於持久業務寫入 |
| F-32 | 設計滿足：§3.3沿途schema activation屏障，舊版隨積壓pin |
| F-33 | 設計滿足：§3/§9 registry commit可重讀後才建ERP managed projection |
| F-34 | 設計滿足：§10.5既有管理平台用connector，不重造 |
| F-35 | 設計滿足：§4預置factory/recovery根，高於單站 |
| F-36 | 設計滿足：§4.2 station/QR/CSR/RMA狀態表、跨租戶重售與舊鍵撤權 |
| F-37 | 設計滿足：§4/§5製造與採納不開device→admin |
| F-38 | 設計滿足：§3 actual/applied為owner可重讀版本事實 |
| F-39 | 設計滿足：§3.3 manifest生成schema/outcome，新backend＋ERP module |
| F-40 | 明示縮限：§4 env/tenant pinning，首版每站root；共享多租戶另gate |
| F-41 | 設計滿足：§9 ERP owns job queue/scheduler，site scoped proof，無站點inbound |
| F-42 | 設計滿足：§13不可信網路/managed sale首用gate，N=3營運容量複審 |
| F-43 | 設計滿足：§3/§9 ERP業務write gate受理intent/job |
| F-44 | 設計滿足：§10.4 timeline本地，無網路同步時序承諾 |
| F-45 | 設計滿足：§10.4 controller持standalone/mode |
| F-46 | 明示部分：§3 owner/收據/重讀，§5窗口與§7媒體RPO |
| F-47 | 明示部分：§3.2二分，通用物理exactly-once不成立 |
| F-48 | 明示部分：§4用途/收件者，§9每次派送；I不提供敏感保密 |
| F-49 | 設計滿足：§3.2所有key/version outcome進ERP，§7.3長期驗讀 |
| F-50 | 設計滿足：§3.2 unknown/timeout/late result並存 |
| F-51 | 設計滿足：§3.2去重/flight/deadline與不回退水位 |
| F-52 | 設計滿足：§3.1 receipt與worker終態分離 |
| F-53 | 設計滿足：§3.2 backend真錯誤不假success |
| F-54 | 設計滿足：§3.2可拒絕/延期，同版pending可恢復，同值無額外效果 |
| F-55 | 設計滿足：§10.1 ERP CMS穩定item ID，unit持本地map |
| F-56 | 設計滿足：§10.1 versioned manifest pointer含hash |
| F-57 | 設計滿足：§10.1整版就緒切換後清ghost |
| F-58 | 設計滿足：§10.1編輯後重發所有引用screen，逐次驗權 |
| F-59 | 明示妥協：§9 origin逐record token/constant-time，unit改grant/proof |
| F-60 | 設計滿足：§10.1只供所求版本或拒絕，hash一致 |
| F-61 | 設計滿足：§9可換reconcile，G-PLAYER同fixture驗候選 |
| F-62 | 設計滿足：§13輕量CMS不裝website builder |
| F-63 | 設計滿足：§9/§10.1 business projection、5s JSON、15s stale/逐屏polling |
| F-64 | 設計滿足：§9 ERP排序，第二adapter saga才評Workflow |
| F-65 | 明示不做：command correctness通過前不建Workflow |
| F-66 | 設計滿足：§3無信任delivery的edge job engine |
| F-67 | 設計滿足：§5.2 inbound durable replay兩日，未處理不盲GC |
| F-68 | 設計滿足：§9單inbound auth-before-write，真status |
| F-69 | 明示妥協：§9 single queue write gate取代outbound transport，派送再驗權 |
| F-70 | 明示妥協：§9.1每retry/fetch/mirror gate，STOPPING最壞32s在途，ARCHIVED零新起跑 |
| F-71 | 設計滿足：§9 fresh DB無connection有可操作錯誤 |
| F-72 | 明示妥協：§9 origin per-record route不借 connector token，unit經parent grant |
| N-01 | 條件滿足：§5三形狀conduit與同機改造模板，首用N-18 |
| N-02 | 明示妥協：§4.3 strict/inspected 身分與保密分驗，Type 1實體圍堵 |
| N-03 | 設計滿足：§4/§9.2 resolver、加密分流、本地reader驗證，缺鍵停權 |
| N-04 | 設計滿足：§9 staging第一封包前無prod secret/grant/egress |
| N-05 | 設計滿足：§3一owner、§4原始簽章、§9無secret call audit |
| N-06 | 設計滿足：§5 hold/client/proxy對齊，worker不綁delivery timeout |
| N-07 | 明示條件：§9 stopped/readiness，§4有人解封冷啟；無人復電另profile |
| N-08 | 設計滿足：§13 INFO/rotation/額度，不以DEBUG當site預設 |
| N-09 | 設計滿足：§7逐state備份、最新 trust log/證據驗讀、雙人替補 |
| N-10 | 設計滿足：§8 app/OS minor/kernel/library/major/boot全有失敗出口 |
| N-11 | 明示妥協：§5 LKG pin；§9.2原期限內離線全島讀取，新操作需boot grant |
| N-12 | 設計滿足：§5 parent/ERP public/internal/content分設，不借web.base.url |
| N-13 | 條件滿足：§2 W0整機數值預算，無選配庫/broker，不以角色數代footprint |
| N-14 | 設計滿足：§4.3時鐘上界/回撥拒權，§5.2錯時不fresh |
| N-15 | 條件滿足：§5分鐘心跳/≤1Hz，§7全站容量，§10區分MES/HMI |
| N-16 | 設計滿足：§14 memory、fake sensor/PLC/LED/reader無硬體路徑 |
| N-17 | 設計滿足：§14 GitLab refs/digests、逐元件override、隔離CI、cycles/duration/jitter與工件 |
| N-18 | 條件滿足：§14每個可售shape/profile獨立PASS，不支援/未跑非通過 |
| N-19 | 設計滿足：G-D真Odoo inbound 403與模組安裝，不借bundle綠燈 |
| N-20 | 設計滿足：§10.3無3.3V/5.3V非穩壓拒接條件，carrier/電源方案重驗 |
| N-21 | 明示範圍：§10.3三壓種/零漂/門狀態/4-20mA/健康假值，安全用途排除，法律未查證 |
| N-22 | 設計滿足：§13每part中文介面/地址/燒錄/陷阱/SHA256、vendor package registry |
| N-23 | 設計滿足：§13每module zh_TW export/merge不覆寫 |

## 11.3 C/B 回歸

| 教訓 | 防止重現的規則/驗收 |
|---|---|
| C-01/C-21/C-22 | envelope不繼承禁字元編碼，collection manifest＋stable item/local map；G-D |
| C-02/C-03/C-04/C-05/C-06/C-07/C-08 | 原子outbox、receipt≠完成、per-key result log、完整快照/tombstone/UNKNOWN；G-C |
| C-09/C-10/B-10/B-11/B-12 | auth-before-write、tenant pin、bootstrap停用、signed revoke、無任意URL/admin provisioning；G-PKI |
| C-11/C-15/B-09 | schema activation、缺capability拒絕與變更重分類；G-S/G-D |
| C-12/C-13/B-14 | outbound改址、首次/重啟snapshot、actual/result log批次補讀；G-NET/G-C |
| C-14/B-13 | 固定project/stop marker、真正readiness，不傷同機ERP；G-U |
| C-16/C-17 | 分區GC計數、dashboard drift、非repo狀態備份；G-S/G-R |
| C-18/C-19 | player URI/id/order/日期、禁止自導航、72h repaint soak；G-D |
| C-20/C-23 | ERP本地交易、單cadence、真403、模組安裝；G-D |
| C-24/C-25 | parent record-scoped內容，保留(a)的改造與reset拒絕矩陣；G-NET |
| B-01/B-02/B-03/B-04 | unknown非not-run、逐版本outcome、錯版文件拒絕；G-C/G-D |
| B-05/B-06/B-07/B-08 | 全LED結果、真backend error、非同步worker、keyed recovery；G-C |

# 12. §9 開放問題的最終答案

依需求原文十九題順序，Q 編號僅作追蹤，不沿用 P0 的縮短清單。條件答案仍指出決策與驗收，不把「未跑」當成未設計，也不把未取得的部署條件說成已存在。

| 題號/原題來源 | 最終答案 |
|---|---|
| Q01 [NGSI/FIWARE必需能力](../00-requirements.md#L273) | 不作內部命令契約；模型與互通有價值，具名reader才唯讀v2/LD facade；無證據有不可替代的本案必需功能 |
| Q02 [registry/issuer](../00-requirements.md#L274) | root node registry投影，獨立trust log為最新決策根；隔離單一operational issuer，factory/recovery不平行發營運權 |
| Q03 [channel/TLS](../00-requirements.md#L275) | HTTPS stream/batch、明列parent終結TLS、雙向物件身分；MQTT僅條件資料面，strict/inspected/O01 |
| Q04 [命令owner](../00-requirements.md#L276) | ERP desired / job queue/flight/deadline，unit actual/result log/dedupe；§9逐次派送gate，UNKNOWN保鎖 |
| Q05 [時序庫](../00-requirements.md#L277) | 第一history即我方獨立PG，recorder、純SQL dirty-bucket，不用TSL policy |
| Q06 [告警/接收者](../00-requirements.md#L278) | node算業務門檻事件、ERP交站點值班者，Grafana只ops健康/畫線 |
| Q07 [低於兩服務](../00-requirements.md#L279) | 不承諾；中央六/屏端四角色下限，加基礎服務，W0有整機資源門檻 |
| Q08 [Anthias/中央reconcile](../00-requirements.md#L280) | 先核可保留映像，不合格走G-PLAYER；reconcile/id map留unit，中央管manifest |
| Q09 [cloud agent](../00-requirements.md#L281) | site branch自有Type 2/site scoped proof outbound443；純屏可直root node，HMI必有localproducer |
| Q10 [根/discovery/N](../00-requirements.md#L282) | 預置factory/recovery根與env voucher，DNS只定位；安全首售gate，N=3營運容量複審 |
| Q11 [Control-Semantic](../00-requirements.md#L283) | 身分/存活/非控制設定/事件在內；門鎖/製程控制另案，不明即控制類、能力變更重判 |
| Q12 [backup/staging](../00-requirements.md#L284) | §7每state一致備份、獨立 trust log/escrow/證據材料；staging首封包前中和，非runbook善意 |
| Q13 [process切分](../00-requirements.md#L285) | 同release不等同權限；parser/sensor/display/LED、recorder、issuer、helper分UID/process |
| Q14 [自建界線](../00-requirements.md#L286) | 只建契約/政策/adapter/ETL/協調；不造DB/browser/OS/bootloader/broker/crypto/backup引擎 |
| Q15 [管理中心](../00-requirements.md#L287) | ERP UI over root node registry，業務owner仍Odoo，不另建通用管理平台 |
| Q16 [Type 1代表](../00-requirements.md#L288) | 操作員在branch一次登記，branch建stand-in/announce；未知來訊不自動建ID |
| Q17 [直連/樹](../00-requirements.md#L289) | 管理/文件/長期資料走樹，HMI本地例外；G-DIRECT有觸發/owner/逐ID等價與撤銷，未通不開 |
| Q18 [無人閉環](../00-requirements.md#L290) | 保留inbound不自動下行；第二adapter saga才評Workflow，預設只提案，致動另審 |
| Q19 [branch/gateway合併](../00-requirements.md#L291) | 同stackable node release family，保留角色與backend權限隔離，不合成特權parser |

# 13. 第一天必做清單與觸發表

第一天指建置範圍，不是一天工期；主責與替補先確認，未驗功能不隨首屏默認開啟。

| 首日交付 | 規則 |
|---|---|
| 政策 | owner/分類/UNKNOWN/checkpoint/archive/冷啟/復原先凍結；首屏禁未驗job，輕量CMS不裝website builder |
| 日誌/稽核 | INFO、rotation/額度；每outbound call一行且無headers/body |
| Parts | 每料中文介面/地址/燒錄/陷阱/檔案SHA256，vendor檔放package registry |
| 翻譯 | 每ERP module的zh_TW分別export/merge，不覆寫既有翻譯 |

| 觸發 | 下一筆與放行/退出條件 |
|---|---|
| 首屏/不可信網路/managed hardware首售 | G-LANG/G-L/G-PKI/G-NET/G-T/G-U/G-R/G-D/G-LIFE，安全/恢復/語言決策不跳過 |
| 首個job | G-C加該backend效果恢復證據；不可查/不可隔離類別禁用 |
| 首個history/告警 | G-S與近源event journal，不能以snapshot替告警史 |
| 首個Type 1 | (a)同機或(b)(c)改造、profile與G-M/Modbus驗收，無施工權不放行 |
| 首個D-06 | 本地producer/view/reader directory，G-H與容量G-S |
| 首個MQTT/客供broker | G-M；intake_i或export按需，非自動啟第二leaf binding |
| 第二binding候選 | G-X三年淨工時減少且同安全/SLO，才付B本金 |
| 首個D-05 | G-A/O07具名硬體/管理白名單/事件隱私保存，非控制產品認證 |
| 第二adapter需要saga | G-C先通過才評Workflow，無人致動仍禁 |
| 第三站/跨環境營運 | provisioning、trust log/escrow 替補與營運容量複審，不當安全延期門檻 |
| G-S容量/延遲超門檻 | 先擴容/調整配置；root node轉送CPU>60%一小時或receipt p95>2s才啟G-DIRECT，非逕開DB後門 |
| EOL前六個月/重大可利用弱點 | release owner 24h分級/縮暴露、7日修補或繼續隔離；是我方目標非廠商SLA |
| 刪binding/元件/在線舊版 | 全fleet遷移、失聯已退役處置、90日零依賴；§7.3唯讀歷史decoder另留 |

# 14. PoC 清單與人週

## 14.1 可判定的驗收

所有產品 gate 目前都是**未執行**，沒有生產批准。結果只能是 PASS、FAIL、UNSUPPORTED、NOT_RUN；後三種不得計通過。已有明確規則與未跑驗收是兩個層次，不能把每個 NOT_RUN 都叫未解設計。每次 PoC 前由 O01～O10 相關責任人凍結 profile 與門檻，測完不得挑有利數字；改範圍須留新決策，不能刪既定錨點來換 PASS。

所有 gate 共用證據包：GitLab repo/ref解析後的commit SHA、artifact digest/SBOM、topology/profile、硬體/firmware、seed、cycles/duration/jitter、預期與實際結果、去secret原始trace、owner水位/效果證據、日期與執行/核准角色。工件由既有 e2e/package registry 保存，不能把本文的文件驗證當產品證據。

| 負載 | 固定輸入與容量判準 |
|---|---|
| W0 | §2一屏/2GiB媒體/五ERP使用者，完整RAM/CPU/disk/boot上限照表 |
| W1 | 30 attrs/30s，1095日為94,608,000 samples；另30屏、5讀者 |
| W2 | 300 sensors×3 attrs/30s，或1機×30 attrs/1s，1095日均2,838,240,000 samples |
| W3 | 300 series/1s，1095日28,382,400,000 samples；不得縮成單機W2 |
| history預算 | 起始W2 1TiB、W3 8TiB資料盤，8vCPU/16GiB測試host；資料+索引+工作WAL≤60%，另獨立備份空間≥1.3倍實測全備大小；否則配置FAIL並擴容/改型 |
| 常態/壓力 | 300來源、30屏、5讀者、1Hz上限；連線全斷重連100輪、0～60s固定seed jitter；intake 每來源10倍核准率壓力30min |

| N-17 CI 契約 | 固定輸入與判定 |
|---|---|
| 多repo manifest | ERP/node/backends/deploy/Parts-profile各GitLab ref解析成SHA與artifact digest，逐元件override；branch名本身非重現證據 |
| 隔離 | network/netns建(a)(b)(c)，fake DNS/time/proxy/PLC/reader；secret來自測試fixture，production網段/FQDN/真硬體不可達 |
| 組合 | 預設組合＋單一舊node override各跑；支援版成功、未知required feature明確拒絕；每correctness milestone綁case ID，無case不done |
| race | 每交易/交接fault point 1000 cycles，固定seed/0～2000ms jitter，保存最小失敗trace |
| soak | nightly 24h、release 72h；playlist重套/reconnect/receipt loss/遲到資料/renderer記憶體 |
| 長期/實機 | 七/八日與三年可用可重現虛擬時鐘驗語意；RTC/斷電/客戶proxy/SLO必實機，不以模擬代證 |

| Gate/責任 | 問題、固定輸入與通過條件 | 專屬工件 |
|---|---|---|
| G-C 正確性lead | W0/W2＋1000-cycle各fault；ERP commit、fetch、effect/result log、receipt、8日cursor新job queue、滿額、同key異值。零已受理靜默消失、零盲重做/解鎖、全部key/version可查 | oracle、fault-point清單、逐key owner/效果對帳 |
| G-PKI 安全lead＋外審 | voucher/CSR/跨env-unit重放、撤銷後restore雙歷史、過期續期、失陷輪替、回撥；零未授權業務寫入/secret洩漏，線上≤60s、離線操作≤300s | key-custody圖、簽章拒絕向量、checkpoint裁決、外審處置 |
| G-NET 交付＋IT | 三形狀各六流程；occupied443、不同FQDN、認證CONNECT、stream/batch及 strict/inspected。核准profile必要flow全完成、禁止矩陣全拒、WAN inbound=0；unsupported非PASS | 接線/NIC/VM/firewall工件、18格結果、AP/reset/有線/跨AP拒絕證據 |
| G-T 硬體＋ops | 零/未來/回撥、7日斷電、RTC失效/NTP失聯及§10.3電源profile；錯時零fresh/零新權、回撥不延lease，uncertainty≤2s才授權 | 時間/解封依賴、clocktrace、pin/電壓/容差量測 |
| G-U release＋硬體 | W0；app/helper與所有共享OS更新逐階段斷電、錯硬體、磁碟不足、已寫壞migration；J/floor/stop不回退，安全映像能救援且足跡符合§2 | artifact bytes清冊/雙存放者、kit、階段恢復矩陣、RSS/CPU/bytes-day/boot報告 |
| G-R ops＋安全 | ERP/root node/unit不同時點副本、整卡毀損、最新 trust log缺段、缺一保管人、staging；無最新安全內容零grant，業務RPO≤24h/RTO≤8h依O05時段，edge gap明示 | 全state manifest、checkpoint重建、替補雙人演練、RPO/RTO時間線 |
| G-D ERP/display | 真Odoo install/inbound 403/409/503、全outcome、archive/no-connection、錯版/SSRF、72h畫面/repaint/停頁；零假完成，ARCHIVED後零新起跑，zh_TW不覆寫 | route/install/e2e、backend-confirmed或畫面證據、C/B regression |
| G-S 資料lead | W1/W2/W3及舊schema/負壓/PG ack丟失、三年邊界、同址換表；sample_id/roll-up零錯配，5讀者查詢p95≤2s、restore≤8h、容量≤60% | samples/index/WAL/backup量測、dirty/retention水位、遷移回退核對 |
| G-M 整合＋安全 | 2個認證Type 1同topic同payload、vendor固定ID、1～32feeds與5讀者、30min壓力；零跨來源歸屬/越權，intake 在§2額度內、node/n無OOM且HMI仍達SLO | 型號/韌體矩陣、feed-UID映射、IPC/config、churn/資源/缺口報告 |
| G-H HMI＋partner | 具名PLC/點表，W2本地1Hz至少10,000刺激樣本；p95≤1.5s/p99≤2s、age>3s stale；WAN斷新browser與全島coldstart，8h截止前後/重登入/回撥均驗 | 點表/角色/認證、directory/快照/session契約、延遲分布、Sparkplug互通 |
| G-A reader＋安全 | 具名SDK/boot policy/管理白名單、10min nonce/15min失鮮；缺證據零verified、控制命令零通過；O07保存/隱私先核 | 硬體能力來源、config/actual表、attestation fixture、event交接 |
| G-L release＋法律/採購 | 展開28+U，逐artifact版本/授權/維護owner/支援截止/修補來源/下游義務零空白；未知權利不得支撐出貨 | SBOM/NOTICE/權利表、Parts中文文件/地址/燒錄/陷阱/SHA256、registry索引 |
| G-X 架構＋整合 | 同W2硬體/簽章/隔離/broker/投影/HMI比較HTTPS與候選MQTT；所有安全/SLO不退步，三年開發+IT+維護淨人週減少>0才採B，否則不採 | 同負載結果、三年增量成本/假設、fleet遷移清冊 |
| G-LANG 架構＋release | 保留P0七個日曆日timebox，同CM4 mTLS/SQLite/stream、300children；兩候選同oracle及W0預算，Rust clean CI≤15min且兩維護者能重建/診斷才可選；未達則Python仍須過硬門檻 | Python/Rust RAM/產物/CI/診斷工時表與簽核；未跑不稱Python已證勝 |
| G-DIRECT 資料＋安全 | §13觸發後，W2至少10^6同源samples走樹/直寫逐ID零差異；store認證、scope/撤銷、斷樹48h/滿額與receipt/rollback核對；現在線撤銷≤60s、既授權≤300s，不許裸PG權限 | token/proof與網路流向、兩路row核對、撤銷/背壓/回退trace |
| G-PLAYER display＋release | §9退場觸發；同W0/F-55～63 fixture驗list/create/update/delete/order/日期/ghost/LKG/live，72h無持續記憶體增長>128MiB且§2預算內 | 候選BOM、逐fixture功能/畫面/資源結果，不以探索人週當通過線 |
| G-LIFE 正確性＋安全＋ops | 下表八條同一release合驗，保原key/checkpoint/絕對期限；所有預期不變量成立，零相互矛盾 | 聯合timeline、可用信任材料、操作者、故障前後state digest/證據包 |

| 合驗trace | 預期狀態、信任材料與執行者 |
|---|---|
| L01 revoke/adopt/policy後restore | trust authority持異機完整 trust log/checkpoint；相同epoch下有/無revoke裁決不同，未達revision/digest零新grant |
| L02 WAN斷＋冷browser＋全島重啟＋回撥 | ops現場解封、HMI驗本地簽署快照/時間高水位，恢復既有被動來源/讀取而無操作權；8h/300s原期限不續命 |
| L03 prod備份還原staging | 交付/安全驗備份外環境，第一封包前無prod secret/grant/egress；保留DB中的prod標籤與待辦仍零prod連線/寫入 |
| L04 入列/預取後archive、重啟/re-enable | ERP記STOPPING新generation、dispatcher每retry/fetch/mirror拒新ticket；最壞32s後ARCHIVED零新起跑，原key/deadline/UNKNOWN不變，result log能回流 |
| L05 OS minor斷電＋壞migration＋rollback | release用離線kit安全映像，保J/floor/stop，D向前重建；更新期間新result log不丟、不重播effect、低於安全底線不開權 |
| L06 退役＋major decoder退出＋archive讀回 | 資料/安全持最後引用的公鑰鏈/schema/政策/只讀decoder，所有舊fixture可驗讀，已退役鍵零操作權 |
| L07 C-25(a)同機＋AP/switch reset | IT保branch/root 同host、專用NIC/VM；reset先封埠，同AP/跨AP/有線/tenant全拒；不拿(b)代PASS |
| L08 raw同topic＋RMA/新reader/撤銷/能力改變 | 整合/安全以feed peer UID歸屬，新RMA歷史不串戶、舊機零新權；HTTP/SQL/MQTT限域，舊分類/讀快照不因restore復活 |

## 14.2 不重複的人週

以下均為規劃意見，不是實際報價、量測工時或交期承諾。假設沿用 CMS/display、兩名可互相接班工程師、一站一屏、W0 與三形狀模板，不含門鎖控制。六個共用工程包已包含重疊反駁修補，不把每條估工相加；相對草稿增加的是最新安全內容、archive、壞狀態修復、RMA/分類及可重現驗收，不是再付一次全部原工程。

| 共用工程包 | 修訂後首屏人週 | 責任與已含範圍 |
|---|---:|---|
| 契約/ERP outbox/反熵/archive/分類 | 7～10 | 正確性/ERP，含共用oracle與派送race，不重收兩份archive finding |
| PKI/policy/trust log/製造RMA/escrow | 8～12 | 安全/ops，含雙人替補與checkpoint，兩份restore finding同包 |
| display/CMS/文件/MES投影 | 4～6 | ERP/display，含逐record授權、版本與LKG |
| app/helper/OS/boot/壞migration救援 | 10～15 | release/硬體，包含minor/kernel/library失敗出口及向前修復 |
| 部署/時間/同機隔離模板/基礎冷啟 | 5～7 | 交付/ops，現場有人解封基線，實機計時/footprint |
| 多repo隔離CI/soak/證據包/語言比較 | 4～6 | e2e/release，含7日G-LANG timebox，非額外產品執行成果 |
| 工程小計 | 38～56 | 取代草稿27～41；不是直接拿不同範圍P2/P6原估相減 |

| 工程以外角色 | 首屏主動投入規劃人週 | 範圍/不可控等待 |
|---|---:|---|
| owner/產品 | 0.5～1 | 十項決策、產品界線/acceptance；核准日期待本人 |
| 客戶IT | 1～2 | 一站兩次網路變更、問卷/設定/負向聯測；變更委員會等待另計，非工時上限保證 |
| 採購/供應商窗口 | 0.5～1 | 取得映像、料件、SDK/codec使用權、支援與退出文件；供貨/談判等待未知 |
| 法律/隱私 | 0.5～1 | 首屏BOM/downstream義務；D-05法定保存另估，並非已有律師意見 |
| 外部安全審查者 | 2～4 | 設計/實作審查與複驗的預算占位，需實際委託；費用/排期未知 |
| 客戶驗收/現場操作員 | 1～2 | 兩次驗收、冷啟/解封訓練、故障回報；不是只算IT等待 |
| 現場施工/維修 | 0.6～1 | 3～5人日，採C-25改造時；交通、布線、停機另計，無Type 1純屏可不發生 |
| PLC partner/reader vendor/SI | 首屏0；首個D-06 1～3、D-05 1～3 | 各自點表/介面/SDK與聯測主動工；第三方HMI SI另0.5～1，皆待該角色確認 |

首屏含全部上述改造與外部角色的規劃合計為44.1～68人週；這是按假設相加的占位，不是已封頂總價。若角色未確認容量，就保持未排期，不能由工程師工時替他們承諾。雙人也不能直接把人週除二當交期，外審、IT、採購及現場時段可能在關鍵路徑。

| 後續增量/維護 | 人週/人日意見 | 去重與責任 |
|---|---|---|
| 首D-02＋history | +4～7人週 | sensor/event、G-S/Grafana；即時無history可裁範圍但明示 |
| 首Type 1/額外branch | +3～5 | profile/RTU/雙hop，施工人日不重算開發 |
| 首D-04 | +4～7 | keyed backend、mode/show/UNKNOWN，不只transport |
| MQTT可信feed框架 | +4～6 | broker/client/IPC/配額/G-M含來源修補；每型號另0.5～1 |
| 本地reference HMI | +5～8 | directory/verifier/固定期限、整島coldstart/G-H；與基礎解封去重 |
| Sparkplug/D-05管理 | +4～8 / +6～10 | 角色互通/codec；硬體verifier/SDK/設定，不含控制產品 |
| 每consumer/每站 | 0.5～1 / 0.5～1.5 | 設定與聯測，不再收共用binding本金；IT/partner表另列 |
| 年度共用維護 | 8～12 | 含ERP遷移預留2～4、trust log/keys/舊decoder、季度restore與接班；非保證每年必升Odoo大版 |
| 全角色年度追加 | IT/驗收各0.5～1、採購/法律合0.5～1、外審0.5～1 | 依實際變更再核，不隱藏在等待；partner無新型號時0，變更按訂單 |
| 一次major現場維護 | 每盒0.5～1人日 | 30盒＋同規格branch=15.5～31人日=3.1～6.2人週；加年度工程為11.1～18.2，交通停機另計 |
| 第二binding/整平台退出 | 6～9 / 12～24 | 外審/逐站過渡另計；新舊雙軌只讀，不能雙writer發命令 |

## 14.3 P1 原始 finding 個別去向（40）

來源共305條：6致命、245重大、54次要。下列251條逐一保留canonical ID、原嚴重度與真實正文修法；「設計修補」不等於測試通過。次要原項不冒充遺失的重大，保留於各原批評/答辯。共享修法只去重工時，不合併ID。

| 原始來源 | 原嚴重度 | 最終處置/正文/驗收 |
|---|---|---|
| [P1/security-01](../30-critiques/P1/security.md#L32) | 重大 | 設計修補：§4.1綁audience/env/function/epoch/digest逐欄驗；G-PKI |
| [P1/security-02](../30-critiques/P1/security.md#L40) | 重大 | 設計修補：§4.2預置根/env voucher，adopt不提供自己的信任錨；G-PKI |
| [P1/security-03](../30-critiques/P1/security.md#L48) | 重大 | 設計修補：§4.2 CSR/QR、異鍵隔離、停bootstrap及RMA；Type 2 clone限制保留 |
| [P1/security-04](../30-critiques/P1/security.md#L56) | 重大 | 設計修補：§4.1 parent/root驗子樹與來源，不信自報CN/ACL；G-PKI |
| [P1/security-05](../30-critiques/P1/security.md#L64) | 重大 | 設計修補：§10.1 manifest/逐asset hash，驗齊才切；G-D |
| [P1/security-06](../30-critiques/P1/security.md#L72) | 重大 | 縮限：§4.3 I只非敏感、無bearer；敏感無bypass不支援，O01/G-NET |
| [P1/security-07](../30-critiques/P1/security.md#L80) | 重大 | 接受代價：§4.2操作300s/只讀撤銷查詢，不假離線瞬時撤銷；O10 |
| [P1/security-08](../30-critiques/P1/security.md#L88) | 重大 | 設計修補：§4.2/§7.2獨立escrow/recovery根與完整trust log；G-R |
| [P1/longevity-01](../30-critiques/P1/longevity.md#L31) | 重大 | 接受代價：§2分K/實例/library、首屏無broker；28+U不當精確總BOM |
| [P1/longevity-02](../30-critiques/P1/longevity.md#L53) | 重大 | 設計修補：§6不依persist-sqlite，§13限時處置/固定版；G-M/G-L |
| [P1/longevity-03](../30-critiques/P1/longevity.md#L65) | 重大 | 接受代價：§6成熟client首用才裝，不自寫子集；G-L支援/替換 |
| [P1/longevity-04](../30-critiques/P1/longevity.md#L75) | 重大 | 設計修補：§5單HTTPS trunk、stream/batch同oracle，不留冷WSS備援 |
| [P1/longevity-05](../30-critiques/P1/longevity.md#L85) | 重大 | 明示選擇：§6/§13無需求不裝broker，unit生態收益以G-X重評 |
| [P1/longevity-07](../30-critiques/P1/longevity.md#L105) | 重大 | 設計修補：§7.2 broker空cache/新政策後開權；離線普通重開限§9.2原期限 |
| [P1/longevity-08](../30-critiques/P1/longevity.md#L115) | 重大 | 設計修補：§4.2離線上級/獨立recovery，不pin死線上鍵；G-PKI |
| [P1/correctness-01](../30-critiques/P1/correctness.md#L11) | 重大 | 縮限：§3.2 effect/result log歧義保UNKNOWN/鎖，keyed query或intent，否則禁用 |
| [P1/correctness-02](../30-critiques/P1/correctness.md#L17) | 重大 | 設計修補：§3.1每120s/重連result log對帳，ERP commit才最終receipt |
| [P1/correctness-03](../30-critiques/P1/correctness.md#L23) | 重大 | 設計修補：§3.2 timeout不釋衝突槽，原deadline不延命；G-C |
| [P1/correctness-04](../30-critiques/P1/correctness.md#L29) | 重大 | 設計修補：§3.2 observed/pending/applied/refusal分列，單槽reconcile |
| [P1/correctness-05](../30-critiques/P1/correctness.md#L35) | 重大 | 設計修補：§10.1所求版本/全媒體就緒、LKG先pin；G-D |
| [P1/correctness-06](../30-critiques/P1/correctness.md#L41) | 重大 | 設計修補：§3.3 schema activation耐久屏障、缺capability拒絕；G-S |
| [P1/correctness-07](../30-critiques/P1/correctness.md#L47) | 重大 | 設計修補：§3.1/§5.2來源journal分等PG/ERP receipt，PUBACK不交接 |
| [P1/correctness-08](../30-critiques/P1/correctness.md#L53) | 重大 | 設計修補：§5.2未確認result log無TTL、已確認90日、floor長存，滿額停收 |
| [P1/correctness-09](../30-critiques/P1/correctness.md#L59) | 重大 | 設計修補：§5.2時間/quality，§10.6逐點stale，不以重播續命 |
| [P1/correctness-10](../30-critiques/P1/correctness.md#L65) | 重大 | 設計修補：§7.2 trust log revision/digest＋新epoch，§8不回退J；G-LIFE |
| [P1/scenarios-01](../30-critiques/P1/scenarios.md#L55) | 重大 | 設計修補：§5逐hop443含record內容，不開unit→ERP旁路；G-NET |
| [P1/scenarios-02](../30-critiques/P1/scenarios.md#L61) | 重大 | 條件驗收：§5普通HTTPS/認證proxy，不依Upgrade；不通非PASS |
| [P1/scenarios-03](../30-critiques/P1/scenarios.md#L67) | 重大 | 設計修補：§10.1 ERP business projection→parent JSON、逐屏last-poll |
| [P1/scenarios-04](../30-critiques/P1/scenarios.md#L73) | 重大 | 設計修補：§7.1 PG commit前來源spool不回收，PG停機不假成功 |
| [P1/scenarios-05](../30-critiques/P1/scenarios.md#L79) | 重大 | 設計修補：§10.3 commission/serial/map，同址換表新incarnation |
| [P1/scenarios-06](../30-critiques/P1/scenarios.md#L85) | 重大 | 接受代價：§10.4同機timeline、跨盒非原子/逐strip partial |
| [P1/scenarios-07](../30-critiques/P1/scenarios.md#L91) | 重大 | 設計修補：§5.2/§10.5來源事件journal＋ERP receipt，前置Type 1 loss明示 |
| [P1/scenarios-08](../30-critiques/P1/scenarios.md#L97) | 重大 | 條件驗收：§10.6真來源/SLO/3s stale，§9.2整島coldstart；G-H |
| [P1/scenarios-09](../30-critiques/P1/scenarios.md#L103) | 重大 | 設計修補：§4.3 RTC/time gate，零時間只LKG、不略過TLS |
| [P1/ecosystem-01](../30-critiques/P1/ecosystem.md#L7) | 重大 | 設計修補：§6一principal一feed，固定vendor topic與可信IPC歸屬 |
| [P1/ecosystem-02](../30-critiques/P1/ecosystem.md#L15) | 重大 | 條件驗收：§10.6先本地分流，量刺激至畫面而非RTT；G-H |
| [P1/ecosystem-03](../30-critiques/P1/ecosystem.md#L23) | 重大 | 設計修補：§5.2/§6 HMI自計age/quality，無刪除通知也stale |
| [P1/ecosystem-04](../30-critiques/P1/ecosystem.md#L31) | 重大 | 設計修補：§7.1 stable unit/function scope，path變更重建ACL/訂閱 |
| [P1/ecosystem-06](../30-critiques/P1/ecosystem.md#L47) | 重大 | 設計修補：§6完整BIRTH/alias/STATE/seq與有限Rebirth；G-H |
| [P1/ecosystem-08](../30-critiques/P1/ecosystem.md#L63) | 重大 | 接受代價：§13/O01報價前IT/profile簽認，MQTT不等於認證 |

## 14.4 P2 原始 finding 個別去向（43）

| 原始來源 | 原嚴重度 | 最終處置/正文/驗收 |
|---|---|---|
| [P2/security-01](../30-critiques/P2/security.md#L17) | 重大 | 設計修補/縮限：§4.3 固定 strict/inspected不誘發降級，敏感無bypass不支援 |
| [P2/security-02](../30-critiques/P2/security.md#L27) | 重大 | 設計修補：§6/§9無內嵌持鑰MQTT parser，intake/validator 分UID |
| [P2/security-03](../30-critiques/P2/security.md#L37) | 重大 | 設計修補：§4.1 unit report/result log原簽章至root，私鑰不離裝置 |
| [P2/security-04](../30-critiques/P2/security.md#L47) | 重大 | 設計修補：§4.2 serial/key/env/tenant voucher，discovery不授信 |
| [P2/security-05](../30-critiques/P2/security.md#L57) | 重大 | 設計修補：§4.2 image無私鑰，全部Type 2停bootstrap，RMA重新指派 |
| [P2/security-06](../30-critiques/P2/security.md#L67) | 重大 | 設計修補：§9獨立scope/累積額度/雙人digest，每次派送查connection |
| [P2/security-07](../30-critiques/P2/security.md#L77) | 重大 | 設計修補：§9逐record grant、manifest/asset hash、DNS/redirect目的地重驗 |
| [P2/security-08](../30-critiques/P2/security.md#L87) | 重大 | 接受代價：§4.2五分鐘操作權，§7.3舊證據隔離，不信自報時間 |
| [P2/security-09](../30-critiques/P2/security.md#L97) | 重大 | 設計修補：§4.3加密secret、獨立UID/escrow，§7.2替補雙人恢復 |
| [P2/longevity-01](../30-critiques/P2/longevity.md#L15) | 致命 | 設計修補：§8 register app/helper＋全部OS/kernel/library現場救援，壞state向前修；G-U未通不出貨 |
| [P2/longevity-02](../30-critiques/P2/longevity.md#L23) | 重大 | 接受代價：§2 28+U含HTTP/crypto/driver/OS/client，G-L凍結BOM |
| [P2/longevity-03](../30-critiques/P2/longevity.md#L31) | 重大 | 設計修補：§4.2七日cert/30日受限recovery；壞時間不入普通TLS |
| [P2/longevity-04](../30-critiques/P2/longevity.md#L38) | 重大 | 設計修補：§4 alg/kid/trust-set/失陷根恢復，§7.3舊鏈長存 |
| [P2/longevity-05](../30-critiques/P2/longevity.md#L45) | 重大 | 設計修補：§7.2trust log最新revision/digest重建，不從cert復活權利 |
| [P2/longevity-06](../30-critiques/P2/longevity.md#L52) | 重大 | 條件驗收：§5 heartbeat不逐筆落盤、關鍵WAL/FULL，G-U量耐寫/flush |
| [P2/longevity-07](../30-critiques/P2/longevity.md#L59) | 重大 | 接受代價：§9 ERP留scheduler，§14年度內含ERP2～4人週及全route/安裝回歸 |
| [P2/longevity-08](../30-critiques/P2/longevity.md#L66) | 重大 | 設計修補：§7首history即我方獨立PG，容量/遷移/restore有owner |
| [P2/longevity-09](../30-critiques/P2/longevity.md#L73) | 重大 | 條件驗收：§9/G-L首客核player映像/修補，G-PLAYER同fixture退場 |
| [P2/correctness-01](../30-critiques/P2/correctness.md#L9) | 重大 | 設計修補：§3.1業務/outbox同交易，交易外搬運；§9.1重試再驗權 |
| [P2/correctness-02](../30-critiques/P2/correctness.md#L15) | 重大 | 縮限：§3.2 keyed證據或intent；effect後無result log持UNKNOWN，不盲補跑 |
| [P2/correctness-03](../30-critiques/P2/correctness.md#L21) | 重大 | 設計修補：§5.2 pin結果，floor獨立，容量先停受理 |
| [P2/correctness-04](../30-critiques/P2/correctness.md#L27) | 重大 | 設計修補：§3.2 timeout不取消/解鎖，起跑驗原期限/seq |
| [P2/correctness-05](../30-critiques/P2/correctness.md#L33) | 重大 | 設計修補：§3.2同版pending可繼續，observed/applied分開，舊worker不倒寫 |
| [P2/correctness-06](../30-critiques/P2/correctness.md#L39) | 重大 | 設計修補：§3.1平時批次inventory補缺，complete單向遺失仍恢復 |
| [P2/correctness-07](../30-critiques/P2/correctness.md#L45) | 重大 | 設計修補：§3.1 snapshot R/watch銜接、ERP結果/cursor同交易、archive回補 |
| [P2/correctness-08](../30-critiques/P2/correctness.md#L51) | 重大 | 設計修補：§3.3沿途schema耐久activation、每批當時quality/單位 |
| [P2/correctness-09](../30-critiques/P2/correctness.md#L57) | 重大 | 設計修補：§5.2 clock/boot/seq/conn epoch，未來不續online |
| [P2/correctness-10](../30-critiques/P2/correctness.md#L63) | 重大 | 設計修補：§7.1 sample/去重/dirty同PG交易，三年內晚到重算 |
| [P2/scenarios-01](../30-critiques/P2/scenarios.md#L67) | 重大 | 設計修補：§5 listener/parent/ERP/content分設，G-NET occupied443 |
| [P2/scenarios-02](../30-critiques/P2/scenarios.md#L75) | 重大 | 條件驗收：§5 explicit proxy/CONNECT/resolver/407，簽章不代登入 |
| [P2/scenarios-03](../30-critiques/P2/scenarios.md#L83) | 重大 | 設計修補：§10.1逐屏last-poll/viewer/15s TTL，停頁不停代理測 |
| [P2/scenarios-04](../30-critiques/P2/scenarios.md#L91) | 重大 | 設計修補：§5.2/§10.2 quality/time在聚合告警前gate，不寫假零 |
| [P2/scenarios-05](../30-critiques/P2/scenarios.md#L99) | 重大 | 設計修補：§10.3同址換表commission/new incarnation，改名不換series |
| [P2/scenarios-07](../30-critiques/P2/scenarios.md#L115) | 重大 | 條件驗收：§10.6 partner點表/本地tap，刺激至畫面SLO非LAN推論 |
| [P2/scenarios-08](../30-critiques/P2/scenarios.md#L123) | 重大 | 設計修補：§8/§9 stopped/readiness/project固定，G-U不傷ERP |
| [P2/ecosystem-01](../30-critiques/P2/ecosystem.md#L7) | 重大 | 設計修補：§6 Sparkplug必要STATE/有限Rebirth，普通raw仍publish-only |
| [P2/ecosystem-02](../30-critiques/P2/ecosystem.md#L13) | 重大 | 設計修補：§6 curated ID/倍率/單位/time/quality/schema，跨出口同fixture |
| [P2/ecosystem-03](../30-critiques/P2/ecosystem.md#L19) | 重大 | 設計修補：§3.1 schema/snapshot/cursor/gap/archive讀者契約，§14聯測另費 |
| [P2/ecosystem-04](../30-critiques/P2/ecosystem.md#L25) | 重大 | 設計修補：§9.2 directory/verifier/絕對期限/無循環解封，G-H全島冷啟 |
| [P2/ecosystem-05](../30-critiques/P2/ecosystem.md#L31) | 重大 | 設計修補：§6 BIRTH/DATA非retained、完整角色/alias/seq，G-H |
| [P2/ecosystem-06](../30-critiques/P2/ecosystem.md#L37) | 重大 | 條件驗收：§10.6明確PLC模式/方向/點表/認證，未取得不交付 |
| [P2/ecosystem-08](../30-critiques/P2/ecosystem.md#L49) | 重大 | 設計修補：§6客供broker按ACL/配額/profile，無bridging亦可export |
| [P2/ecosystem-09](../30-critiques/P2/ecosystem.md#L55) | 重大 | 接受代價：§2/§6 retained正價值，G-X同配置比較不預宣淨省 |

## 14.5 P3 原始 finding 個別去向（39）

| 原始來源 | 原嚴重度 | 最終處置/正文/驗收 |
|---|---|---|
| [P3/security-01](../30-critiques/P3/security.md#L11) | 致命 | 設計修補：§4.2首連前預置根/env voucher，非TOFU；G-PKI驗假parent |
| [P3/security-02](../30-critiques/P3/security.md#L19) | 重大 | 替代處置：§3/§4 HTTPS資源授權，不向unit曝JS API/inbox wildcard |
| [P3/security-03](../30-critiques/P3/security.md#L26) | 重大 | 修補/縮限：§4雙向物件、§10.1資產hash；敏感inspection仍不支援 |
| [P3/security-04](../30-critiques/P3/security.md#L33) | 重大 | 設計修補：§4 branch同續期/撤銷；§9 staging首封包前中和 |
| [P3/security-05](../30-critiques/P3/security.md#L40) | 重大 | 設計修補：§9 parser/issuer分UID，§6有界驗peer IPC |
| [P3/security-06](../30-critiques/P3/security.md#L47) | 重大 | 設計修補：§2/§5.2 intake 獨立RAM/CPU/queue，不能擠result log配額 |
| [P3/security-07](../30-critiques/P3/security.md#L54) | 重大 | 明示縮限：§11.2首版每站root，無共用NATS account跨客戶故障域 |
| [P3/security-08](../30-critiques/P3/security.md#L61) | 重大 | 設計修補：§8全release manifest/helper救援，§13弱點時限 |
| [P3/longevity-01](../30-critiques/P3/longevity.md#L24) | 致命 | 範圍移除：§2不採NATS fleet；選用元件仍全部受§8/G-U，重選要重開更新gate |
| [P3/longevity-02](../30-critiques/P3/longevity.md#L31) | 重大 | 接受代價：§2備份/runtime/雲實例分帳，28+U非漏項總數 |
| [P3/longevity-03](../30-critiques/P3/longevity.md#L38) | 重大 | 替代處置：§8單OS runtime、§10.1 parent HTTPS文件，不依未知Object Store後繼 |
| [P3/longevity-04](../30-critiques/P3/longevity.md#L45) | 重大 | 設計修補：§3.3精確混版/required_features，不放寬wildcard救相容 |
| [P3/longevity-05](../30-critiques/P3/longevity.md#L52) | 重大 | 設計修補：§7.2 Type 1 origin不可當cache，按原業務ID/新store generation對帳 |
| [P3/longevity-06](../30-critiques/P3/longevity.md#L59) | 重大 | 條件驗收：§14 G-U/G-S量bytes/day與耐寫，超標換料不降result log耐久 |
| [P3/longevity-07](../30-critiques/P3/longevity.md#L66) | 重大 | 明示選擇：§2/§13首屏無NATS，放棄固定耐久投影零件換配置較小 |
| [P3/longevity-08](../30-critiques/P3/longevity.md#L73) | 重大 | 接受代價：§7公開consumer契約，§14退出含身分/fleet/讀者12～24人週 |
| [P3/correctness-01](../30-critiques/P3/correctness.md#L24) | 重大 | 設計修補：§3.1 ERP outbox同交易，CAS不冒充跨庫提交 |
| [P3/correctness-02](../30-critiques/P3/correctness.md#L28) | 重大 | 縮限：§3.2原子claim/原key結果，效果不可知UNKNOWN禁重跑 |
| [P3/correctness-03](../30-critiques/P3/correctness.md#L32) | 重大 | 設計修補：§3.1 result log清冊/receipt outbox/定期反熵，ERP commit才確認 |
| [P3/correctness-04](../30-critiques/P3/correctness.md#L36) | 重大 | 設計修補：§3.2 durable flight/起跑期限，timeout不放衝突工作 |
| [P3/correctness-05](../30-critiques/P3/correctness.md#L40) | 重大 | 設計修補：§3.2每requested version留拒絕/延期/superseded |
| [P3/correctness-06](../30-critiques/P3/correctness.md#L44) | 重大 | 設計修補：§3.3 activation receipt後producer放資料，node/writer雙驗 |
| [P3/correctness-07](../30-critiques/P3/correctness.md#L48) | 重大 | 設計修補：§10.1完整manifest/asset驗齊才切，缺版保LKG |
| [P3/correctness-08](../30-critiques/P3/correctness.md#L52) | 重大 | 設計修補：§5.2 floor獨立長存、未確認result log pin、30日restore門 |
| [P3/correctness-09](../30-critiques/P3/correctness.md#L56) | 重大 | 設計修補：§4.3/§5.2時間品質/boot/seq，錯時不fresh或新授權 |
| [P3/correctness-10](../30-critiques/P3/correctness.md#L60) | 重大 | 設計修補：§7.1 sample去重/rows/dirty同PG交易，commit後receipt |
| [P3/scenarios-01](../30-critiques/P3/scenarios.md#L61) | 重大 | 設計修補：§10.1 desired可見≠媒體完整，candidate驗齊才applied |
| [P3/scenarios-02](../30-critiques/P3/scenarios.md#L65) | 重大 | 設計修補：§10.1 ERP產work-centre JSON，不假設另有站內MES |
| [P3/scenarios-03](../30-critiques/P3/scenarios.md#L69) | 重大 | 設計修補：§7/§10.2越線/恢復durable event，不由補線猜告警 |
| [P3/scenarios-04](../30-critiques/P3/scenarios.md#L73) | 重大 | 設計修補：§10.3 commission/map/serial，換址與換表分判 |
| [P3/scenarios-05](../30-critiques/P3/scenarios.md#L77) | 重大 | 設計修補：§10.4固定show成員/逐strip partial，不早建Workflow |
| [P3/scenarios-06](../30-critiques/P3/scenarios.md#L81) | 重大 | 設計修補：§10.5管理config_rev/applied與重定位白名單，不只registry status |
| [P3/scenarios-07](../30-critiques/P3/scenarios.md#L85) | 重大 | 設計修補：§4.3時間/冷啟gate，簽章可驗不代表零時樣本有效 |
| [P3/ecosystem-01](../30-critiques/P3/ecosystem.md#L7) | 重大 | 設計修補：§6逐型號topic/role/TLS，選可用broker不強迫韌體 |
| [P3/ecosystem-02](../30-critiques/P3/ecosystem.md#L13) | 重大 | 設計修補：§6 Type 1 client連broker、subscriber訂feed，metadata/expiry明映 |
| [P3/ecosystem-03](../30-critiques/P3/ecosystem.md#L19) | 重大 | 設計修補：§6 ingress Host允STATE/有限Rebirth，來源/schema先行 |
| [P3/ecosystem-04](../30-critiques/P3/ecosystem.md#L25) | 重大 | 設計修補：§6 egress Edge Node完整BIRTH/alias/seq/DEATH，不把JSON稱標準 |
| [P3/ecosystem-05](../30-critiques/P3/ecosystem.md#L31) | 重大 | 設計修補：§5/§6可信n:8883/localview:443，HMI不讀raw |
| [P3/ecosystem-06](../30-critiques/P3/ecosystem.md#L37) | 重大 | 設計修補：§3.1/§7 schema/snapshot/replay/live/quality，consumer不直讀JS |

## 14.6 P4 原始 finding 個別去向（42）

| 原始來源 | 原嚴重度 | 最終處置/正文/驗收 |
|---|---|---|
| [P4/security-01](../30-critiques/P4/security.md#L13) | 重大 | 替代處置：§4/§9 unit/function原簽章，無tenant-wide Gateway key |
| [P4/security-02](../30-critiques/P4/security.md#L20) | 重大 | 設計修補：§8/§9禁remote shell/任意host重指，缺secret停權，CMS不簽更新 |
| [P4/security-03](../30-critiques/P4/security.md#L27) | 致命 | 條件未支援：§4.3真偽已設計修補，敏感無bypass仍阻塞O01，不假全面解除 |
| [P4/security-04](../30-critiques/P4/security.md#L34) | 重大 | 設計修補：§4.2 factory/operational分離、停bootstrap，trust log/RMA 禁舊claim重綁 |
| [P4/security-05](../30-critiques/P4/security.md#L41) | 重大 | 設計修補：§9獨立policy與每次派送gate，UI/rule改副本不取得操作權 |
| [P4/security-06](../30-critiques/P4/security.md#L48) | 重大 | 設計修補：§9 staging第一封包前無prod key/grant/egress，不能先問prod |
| [P4/security-07](../30-critiques/P4/security.md#L55) | 重大 | 設計修補：§6可信feed非payload deviceName，未知不建ID，quality不續命 |
| [P4/security-08](../30-critiques/P4/security.md#L62) | 重大 | 接受代價：§2/§13不凍未知無修補舊線，G-L核完整映像/支援，不把查無advisory當沒流程 |
| [P4/longevity-01](../30-critiques/P4/longevity.md#L24) | 致命 | 範圍移除/條件重開：§2本版不採TB，O08須三形狀OEM/downstream/支援書面權利；付費不自動違M-05 |
| [P4/longevity-02](../30-critiques/P4/longevity.md#L39) | 重大 | 接受代價：§2產品/library/方言/實例分帳，未知U不作零 |
| [P4/longevity-03](../30-critiques/P4/longevity.md#L57) | 重大 | 設計修補：§3.3/§8固定client/server/OS矩陣及canary，同廠不自動相容 |
| [P4/longevity-04](../30-critiques/P4/longevity.md#L67) | 重大 | 設計修補：§7.2每state/origin備份，新 trust log再對帳，registry遺失不當revoke |
| [P4/longevity-05](../30-critiques/P4/longevity.md#L77) | 重大 | 接受代價：§14退出含fleet/讀者/身分/影子讀12～24人週，不是一條SQL |
| [P4/longevity-06](../30-critiques/P4/longevity.md#L87) | 重大 | 接受代價：O08書面支援/退出，§13季查；Change Date非修補承諾 |
| [P4/longevity-07](../30-critiques/P4/longevity.md#L97) | 重大 | 接受代價：§2/§5逐VLAN branch乘數，若重開buy逐實例算磁碟/備份/升版 |
| [P4/correctness-01](../30-critiques/P4/correctness.md#L7) | 重大 | 設計修補：§3.1 stable job_key同交易outbox，delivery ID不能換業務key |
| [P4/correctness-02](../30-critiques/P4/correctness.md#L13) | 重大 | 條件驗收：§3.1耐久提交後receipt，G-C殺owner/branch重掃，不借產品enum |
| [P4/correctness-03](../30-critiques/P4/correctness.md#L19) | 重大 | 縮限：§3.2 effect/result log gap UNKNOWN，keyed backend或intent，否則禁job |
| [P4/correctness-04](../30-critiques/P4/correctness.md#L25) | 重大 | 設計修補：§3.2 receipt/平台status/真正backend outcome分列，不假success |
| [P4/correctness-05](../30-critiques/P4/correctness.md#L31) | 重大 | 設計修補：§3.2持久resource flight/seq/profile前提，register/job共排序 |
| [P4/correctness-06](../30-critiques/P4/correctness.md#L37) | 重大 | 設計修補：§10.1 Apply單一路徑，version/hash一致、舊快照不倒退 |
| [P4/correctness-07](../30-critiques/P4/correctness.md#L43) | 重大 | 設計修補：§3.1 result log批次重讀/cursor原子commit，結果保留與delivery期限分開 |
| [P4/correctness-08](../30-critiques/P4/correctness.md#L49) | 重大 | 設計修補：§5.2 LKG/assets/id map pin，§9.2完整離線冷啟，不清舊畫面 |
| [P4/correctness-09](../30-critiques/P4/correctness.md#L55) | 重大 | 設計修補：§5.2只合格新heartbeat刷新presence，補傳不冒充現在 |
| [P4/correctness-10](../30-critiques/P4/correctness.md#L61) | 重大 | 設計修補：§3.3 schema屏障/舊版積壓，空capability拒絕并重分類 |
| [P4/scenarios-01](../30-critiques/P4/scenarios.md#L71) | 重大 | 設計修補：§3 stable unit/function，§10同機多功能逐结果不混entity |
| [P4/scenarios-02](../30-critiques/P4/scenarios.md#L77) | 重大 | 設計修補：§9 parent content relay/分設名稱，player無一般ERP出口 |
| [P4/scenarios-03](../30-critiques/P4/scenarios.md#L83) | 重大 | 設計修補：§4.3/§10.2有效時間/暖機gate，零時不以收件時補 |
| [P4/scenarios-04](../30-critiques/P4/scenarios.md#L89) | 重大 | 設計修補：§5/§10.3南向502/RTU唯一reader，負壓/比例/統計fixture |
| [P4/scenarios-05](../30-critiques/P4/scenarios.md#L95) | 重大 | 設計修補：§7 root 側 scoped view/role/dashboard-as-code，逐sample核對 |
| [P4/scenarios-06](../30-critiques/P4/scenarios.md#L101) | 重大 | 設計修補：§10.4 ERP成員manifest/逐strip version/result，缺席partial |
| [P4/scenarios-07](../30-critiques/P4/scenarios.md#L107) | 重大 | 設計修補/驗收：§10.5具名reader-management/config actual，SDK未得不放G-A |
| [P4/scenarios-08](../30-critiques/P4/scenarios.md#L113) | 重大 | 設計修補：§9.2本地directory/verifier/絕對期限，G-H新browser/整島 |
| [P4/scenarios-09](../30-critiques/P4/scenarios.md#L119) | 重大 | 設計修補：§2完整最小帳/footprint，§8/§9單stop owner與真readiness |
| [P4/scenarios-10](../30-critiques/P4/scenarios.md#L125) | 重大 | 條件驗收：§14三形狀18格完整流程，非gRPC ping/品牌fallback |
| [P4/ecosystem-01](../30-critiques/P4/ecosystem.md#L9) | 重大 | 設計修補：§6型號/vendor topic/可信feed/schema，不以CONNECT當onboarding |
| [P4/ecosystem-02](../30-critiques/P4/ecosystem.md#L17) | 重大 | 設計修補/驗收：§10.6 point age/quality/SLO，停PLC但gateway活仍stale |
| [P4/ecosystem-03](../30-critiques/P4/ecosystem.md#L25) | 重大 | 設計修補：§7/§9每consumer獨立scope，唯讀不等於跨線可讀 |
| [P4/ecosystem-04](../30-critiques/P4/ecosystem.md#L33) | 重大 | 設計修補：§6完整Sparkplug角色/flags/有限Rebirth，codec另K/G-H |
| [P4/ecosystem-05](../30-critiques/P4/ecosystem.md#L41) | 重大 | 條件驗收：§10.6先定UA模式/方向/編碼/認證/quality，不借connector名稱 |
| [P4/ecosystem-07](../30-critiques/P4/ecosystem.md#L57) | 重大 | 設計修補：§3.3功能manifest生成mapping/outcome，共同結果路徑 |
| [P4/ecosystem-08](../30-critiques/P4/ecosystem.md#L65) | 重大 | 接受代價：§15 O08/G-L核版/功能/downstream/支援與認證範圍，IT另驗 |

## 14.7 P5 原始 finding 個別去向（40）

| 原始來源 | 原嚴重度 | 最終處置/正文/驗收 |
|---|---|---|
| [P5/security-01](../30-critiques/P5/security.md#L11) | 重大 | 設計修補：§4來源簽章，§6 intake 可信 feed/peer UID，不以topic存在證發布權 |
| [P5/security-02](../30-critiques/P5/security.md#L23) | 重大 | 設計修補：§6 intake_i/projection 分資源/UID、§9管理保持HTTPS無特權parser |
| [P5/security-03](../30-critiques/P5/security.md#L34) | 重大 | 設計修補/縮限：§4逐物件雙向簽章，hello只證session，保密另 strict/inspected |
| [P5/security-04](../30-critiques/P5/security.md#L46) | 重大 | 設計修補：§4 stable ID/key撤銷全branch，§7.2最新 trust log禁止新epoch復活舊權 |
| [P5/security-05](../30-critiques/P5/security.md#L58) | 重大 | 設計修補：§4 voucher/獨立escrow，§9 staging無prod權，非只換env字串 |
| [P5/security-06](../30-critiques/P5/security.md#L67) | 重大 | 設計修補：§9 manifest/asset hash、parent-relative record，不任意URL |
| [P5/security-07](../30-critiques/P5/security.md#L76) | 重大 | 設計修補：§6每principal隔離feed，client-id不授權，HMI禁raw |
| [P5/longevity-01](../30-critiques/P5/longevity.md#L15) | 重大 | 接受代價：§2/§6不預裝unit MQTT，B啟用列fleet矩陣/庫時鐘 |
| [P5/longevity-02](../30-critiques/P5/longevity.md#L26) | 重大 | 設計修補：§13全fleet遷移/失聯處置/90日零依賴才刪，更新先到位 |
| [P5/longevity-03](../30-critiques/P5/longevity.md#L34) | 重大 | 設計修補：§3.3 feature/slot/class混版，§7.3歷史decoder不跟在線版退場 |
| [P5/longevity-04](../30-critiques/P5/longevity.md#L42) | 重大 | 設計修補：§7.2 registry/trust log 唯一權威、新checkpoint再對帳；F33順序不替restore |
| [P5/longevity-05](../30-critiques/P5/longevity.md#L52) | 重大 | 設計修補：§6 HTTPS管理常駐、cache無persistence，換cert/身分/ACL分測 |
| [P5/longevity-10](../30-critiques/P5/longevity.md#L89) | 重大 | 設計修補：§8 app/helper及共享OS/boot全救援、壞state向前修，G-U |
| [P5/correctness-01](../30-critiques/P5/correctness.md#L11) | 重大 | 設計修補：§3.1業務/job queue同交易、結果/cursor同交易，遠呼在外 |
| [P5/correctness-02](../30-critiques/P5/correctness.md#L17) | 重大 | 縮限：§3.2 claim只防並行，效果未知保UNKNOWN/鎖不重做 |
| [P5/correctness-03](../30-critiques/P5/correctness.md#L23) | 重大 | 設計修補：§3.1 durable receipt綁key/version/digest，PUBACK不清outbox |
| [P5/correctness-04](../30-critiques/P5/correctness.md#L31) | 重大 | 設計修補：§3.1全快照含job queue / result log/events/schema/revoke/tombstone；G-C八日cursor |
| [P5/correctness-05](../30-critiques/P5/correctness.md#L37) | 重大 | 設計修補：§3.2 timeout非停止證據，late result追加、不釋衝突槽 |
| [P5/correctness-06](../30-critiques/P5/correctness.md#L43) | 重大 | 設計修補：§5.2 result log/floor分離、未確認pin、舊epoch不得起跑 |
| [P5/correctness-07](../30-critiques/P5/correctness.md#L49) | 重大 | 設計修補：§7.2 latest trust log/digest＋新epoch，§8不盲用舊DB/鏡像最大值 |
| [P5/correctness-08](../30-critiques/P5/correctness.md#L55) | 重大 | 設計修補：§3.2 received/pending/applied、§10.1指定文件/hash/LKG |
| [P5/correctness-09](../30-critiques/P5/correctness.md#L61) | 重大 | 設計修補：§5.2來源/接收/time_quality/boot/seq分列，無時間標未知 |
| [P5/correctness-10](../30-critiques/P5/correctness.md#L67) | 重大 | 設計修補：§3.3 schema activation、batch quality、舊schema隨積壓pin |
| [P5/correctness-11](../30-critiques/P5/correctness.md#L73) | 重大 | 設計修補：§7.1 PG內去重/rows/dirty同交易，receipt前保來源 |
| [P5/correctness-12](../30-critiques/P5/correctness.md#L79) | 重大 | 設計修補：§3/§5.2獨立evt/event_id/授權/receipt，result log仍配job queue |
| [P5/scenarios-01](../30-critiques/P5/scenarios.md#L42) | 重大 | 條件驗收：§5 proxy/CONNECT/FQDN/認證/短請求診斷，不以簽章代入網 |
| [P5/scenarios-02](../30-critiques/P5/scenarios.md#L46) | 重大 | 設計修補：§10.1全媒體manifest/預取驗齊，player不直達ERP |
| [P5/scenarios-03](../30-critiques/P5/scenarios.md#L50) | 重大 | 設計修補：§10.1 ERP工單交易產projection/outbox，parent供JSON/idle/age |
| [P5/scenarios-04](../30-critiques/P5/scenarios.md#L54) | 重大 | 接受代價：§4.3/§5.2壞時間不有效歷史，校時開新區間不杜撰原時間 |
| [P5/scenarios-05](../30-critiques/P5/scenarios.md#L58) | 重大 | 設計修補：§10.3 register/signedness/scale/serial/RTU/負差壓完整profile |
| [P5/scenarios-06](../30-critiques/P5/scenarios.md#L62) | 重大 | 接受代價：§10.4單controller timeline，跨unit非原子/partial |
| [P5/scenarios-07](../30-critiques/P5/scenarios.md#L66) | 重大 | 設計修補：§10.5管理config與actual分writer、白名單排除控制 |
| [P5/scenarios-08](../30-critiques/P5/scenarios.md#L70) | 重大 | 設計修補：§9.2 localdirectory/解封/原期限，§10.6 producer/頁面/SLO |
| [P5/scenarios-09](../30-critiques/P5/scenarios.md#L74) | 重大 | 設計修補：§2/§5分綁址，§8/§9 stop/readiness及整機footprint |
| [P5/ecosystem-01](../30-critiques/P5/ecosystem.md#L7) | 重大 | 接受代價/修補：§6逐型號feed/replay，durable前loss與無seq限制明示 |
| [P5/ecosystem-02](../30-critiques/P5/ecosystem.md#L13) | 重大 | 設計修補：§6先逐metric本地投影再上傳，late batch只補歷史 |
| [P5/ecosystem-03](../30-critiques/P5/ecosystem.md#L19) | 重大 | 設計修補：§3.1/§7讀者schema/snapshot/cursor、PG/API/MQTT各自scope |
| [P5/ecosystem-04](../30-critiques/P5/ecosystem.md#L25) | 重大 | 設計修補：§6分Host/Edge Node生命週期、STATE/有限Rebirth，G-H |
| [P5/ecosystem-05](../30-critiques/P5/ecosystem.md#L31) | 重大 | 縮限：§6客供無admin只export，unit仍HTTPS，IT開通撤銷另費 |
| [P5/ecosystem-08](../30-critiques/P5/ecosystem.md#L49) | 重大 | 條件重評：§14 G-X同broker/HMI基線與三年淨工時，T-a/b/c非B自動通過 |

## 14.8 P6 原始 finding 個別去向（47）

| 原始來源 | 原嚴重度 | 最終處置/正文/驗收 |
|---|---|---|
| [P6/security-01](../30-critiques/P6/security.md#L28) | 致命 | 設計修補：§4公鑰proof/scope與§9.2受限離線讀權，驗權前零業務寫入；G-PKI |
| [P6/security-02](../30-critiques/P6/security.md#L42) | 重大 | 設計修補：§4全Type 2來源驗章/操作300s，rogue parent不能永久發新權 |
| [P6/security-03](../30-critiques/P6/security.md#L52) | 重大 | 設計修補：§4預置根/trust-set/獨立recovery，不靠單SPKI或失陷舊鍵 |
| [P6/security-04](../30-critiques/P6/security.md#L62) | 重大 | 設計修補：§9 CMS/Fleet分權，parent/config獨立政策與digest批准 |
| [P6/security-05](../30-critiques/P6/security.md#L72) | 重大 | 設計修補：§4裝置產私鑰、public cert可重讀，不把secret放desired/一次性pickup |
| [P6/security-06](../30-critiques/P6/security.md#L82) | 重大 | 縮限：§4.3 I不用bearer/敏感資料，敏感無bypass不支援O01 |
| [P6/security-07](../30-critiques/P6/security.md#L92) | 重大 | 設計修補：§5.1保留(a)專用NIC/VM隔離島，Type 1/Type 2/HMI分區；G-NET |
| [P6/security-08](../30-critiques/P6/security.md#L102) | 重大 | 設計修補：§9 poller/parser/validator/recorder分權，只有root 側持DB key |
| [P6/security-09](../30-critiques/P6/security.md#L112) | 重大 | 設計修補：§9 record grant/allowlist/hash、publisher scope/批量帶外確認 |
| [P6/security-10](../30-critiques/P6/security.md#L122) | 重大 | 設計修補：§4.2 claim綁serial/key、revoke/key epoch與RMA，舊輪替不自撤新權 |
| [P6/longevity-01](../30-critiques/P6/longevity.md#L50) | 重大 | 設計修補：§2/§9首日root node入口，不保留device直達Odoo第二路徑 |
| [P6/longevity-02](../30-critiques/P6/longevity.md#L60) | 重大 | 接受代價：§9 root node管wire/registry，ERP留job queue/scheduler；§14 ERP年度工 |
| [P6/longevity-03](../30-critiques/P6/longevity.md#L70) | 重大 | 設計修補：§8首裝helper/全部OS救援、EOL前遷移，非第二客戶再補 |
| [P6/longevity-04](../30-critiques/P6/longevity.md#L80) | 重大 | 設計修補：§9固定player映像/退出觸發，G-PLAYER同fixture，不保證兩週替換 |
| [P6/longevity-05](../30-critiques/P6/longevity.md#L90) | 重大 | 設計修補：§7.2 DB/filestore/history/node/escrow/trust log 全列，restore封權 |
| [P6/longevity-06](../30-critiques/P6/longevity.md#L100) | 重大 | 設計修補：§3.3首日wire/錯誤/黃金向量/混版，§14多repo CI |
| [P6/longevity-10](../30-critiques/P6/longevity.md#L122) | 重大 | 設計修補：§4上級授權新trust-set、fleet確認與失陷recovery，不猜ACME預設 |
| [P6/correctness-01](../30-critiques/P6/correctness.md#L9) | 重大 | 設計修補：§3.1 fetch不消job queue、unit inbox commit才receipt；§9每次fetch驗權 |
| [P6/correctness-02](../30-critiques/P6/correctness.md#L15) | 重大 | 設計修補：§3.1先result log/outbox後上送、ERP commit後receipt，持續批次回讀 |
| [P6/correctness-03](../30-critiques/P6/correctness.md#L21) | 重大 | 縮限：§3.2 executing無結果UNKNOWN，query/人工隔離，非物理exactly-once |
| [P6/correctness-04](../30-critiques/P6/correctness.md#L27) | 重大 | 設計修補：§3.2 queued/start均驗期限、timeout保鎖，register/job共資源 |
| [P6/correctness-05](../30-critiques/P6/correctness.md#L33) | 重大 | 設計修補：§5.2不按501筆刪證據，未確認pin/floor長存/先拒新job |
| [P6/correctness-06](../30-critiques/P6/correctness.md#L39) | 重大 | 設計修補：§10.1 requested/manifest/hash一致，actual綁epoch/seq |
| [P6/correctness-07](../30-critiques/P6/correctness.md#L45) | 重大 | 設計修補：§3.2 seen/applied分開、同版pending恢復，§8壞map不重演 |
| [P6/correctness-08](../30-critiques/P6/correctness.md#L51) | 重大 | 設計修補：§5.2 time_quality/boot/seq/monotonic，補傳不刷新online |
| [P6/correctness-09](../30-critiques/P6/correctness.md#L57) | 重大 | 設計修補：§3.3 schema activation、batch攜版/quality，空capability拒命令 |
| [P6/correctness-10](../30-critiques/P6/correctness.md#L63) | 重大 | 設計修補：§3.1/§7 history與ERP分receipt/水位，穩定sample/event ID |
| [P6/correctness-11](../30-critiques/P6/correctness.md#L69) | 重大 | 設計修補：§7 raw同交易dirty，三年內合法回補重算，GC等修訂 |
| [P6/correctness-12](../30-critiques/P6/correctness.md#L75) | 重大 | 設計修補：§7/§10.2來源durable transition event，不以latest冒充離線告警 |
| [P6/correctness-13](../30-critiques/P6/correctness.md#L81) | 重大 | 設計修補：§10.6每metric自行age/quality，broker活不等來源fresh |
| [P6/scenarios-01](../30-critiques/P6/scenarios.md#L81) | 重大 | 設計修補：§13首用shape/profile gate，C-25/managed sale不等站數 |
| [P6/scenarios-02](../30-critiques/P6/scenarios.md#L85) | 重大 | 設計修補：§5 device FQDN443到root node，內部ERP/DB分列，不改WAN8443 |
| [P6/scenarios-03](../30-critiques/P6/scenarios.md#L89) | 重大 | 設計修補：§2/§3先驗root node/branch/sub-branch/leaf，首Type 1/HMI有site branch，換parent原key對帳 |
| [P6/scenarios-04](../30-critiques/P6/scenarios.md#L93) | 重大 | 設計修補：§9/§10.1文件/全媒體/JSON各scope，player無node key |
| [P6/scenarios-05](../30-critiques/P6/scenarios.md#L97) | 重大 | 設計修補：§4.3本地RTC/受控校時，443-only不偷公網NTP |
| [P6/scenarios-06](../30-critiques/P6/scenarios.md#L101) | 重大 | 設計修補：§10.3 RS485/baud/parity/VM passthrough/map，負壓與失聯驗到底 |
| [P6/scenarios-07](../30-critiques/P6/scenarios.md#L105) | 重大 | 設計修補：§10.4 mode owner/成員manifest/逐function partial，斷線不清standalone |
| [P6/scenarios-08](../30-critiques/P6/scenarios.md#L109) | 重大 | 設計修補：§10.5硬體proof/config actual/attestation freshness/event，G-A非只CA |
| [P6/scenarios-09](../30-critiques/P6/scenarios.md#L113) | 重大 | 設計修補：§10.6全Type 2亦有localproducer，不等慢上傳；§9.2離線讀權 |
| [P6/scenarios-10](../30-critiques/P6/scenarios.md#L117) | 重大 | 設計修補：§8/§9 project/port/volume/stop/readiness，cold/crash/restore不傷ERP |
| [P6/ecosystem-01](../30-critiques/P6/ecosystem.md#L9) | 重大 | 設計修補：§6採購前型號/TLS/topic/feed profile，無法辨識拒收 |
| [P6/ecosystem-02](../30-critiques/P6/ecosystem.md#L17) | 重大 | 設計修補/驗收：§10.6本地feed與 root 側分排程/配額，G-H刺激至畫面 |
| [P6/ecosystem-03](../30-critiques/P6/ecosystem.md#L25) | 重大 | 設計修補：§6只回灌有效projection，HMI自行stale/unknown，保留retained價值 |
| [P6/ecosystem-04](../30-critiques/P6/ecosystem.md#L33) | 重大 | 設計修補：§7/§9每reader獨立scope/權利，SQL/API/MQTT同清單不借site key |
| [P6/ecosystem-05](../30-critiques/P6/ecosystem.md#L41) | 重大 | 設計修補：§3/§7 schema/聚合窗口/versioned view/snapshot/tombstone/replay |
| [P6/ecosystem-06](../30-critiques/P6/ecosystem.md#L49) | 重大 | 設計修補：§6獨立Sparkplug角色/flags/BIRTH/STATE/有限Rebirth，禁actuator |
| [P6/ecosystem-08](../30-critiques/P6/ecosystem.md#L65) | 重大 | 接受代價：§13/O01/O02/O08報價前核IT流向/inspection/權限/授權，不以拒售冒稱滿足 |

# 15. 仍未解決的事與給 owner 的決策清單

設計反例已有下表的具體處置；仍未決的是責任人、產品取捨、商約/現場條件與生產證據，不是「所有未跑測試都代表設計不存在」。trust log 缺最新內容、無兩名核准保管人、無有效時間/解封、未知物理效果、無法恢復的硬體，均有明確停權/隔離出口。共同 hypervisor 故障域、Type 2 複製、Type 1 假資料與有限媒體仍是殘餘風險。敏感強制 inspection 無 bypass，以及不允 retrofit 的 C-25，維持明示不支援。

## 15.1 最終 Owner 決策

每列選項、建議、理由、後果與責任角色均須在第一個相關 PoC 的 profile 凍結前指派人名並簽核。批准研究預算不等於批准生產；預算都是意見而非真實報價。

| ID/決策 | 選項 | 建議 | 理由 | 不決定的後果 | 責任角色 |
|---|---|---|---|---|---|
| O01 inspection/保密 | strict/no-decrypt；inspected 僅核准非敏感；另審端到端機密profile | 敏感一律 strict，inspected 逐資料類批准；新加密另4～8人週探索 | 簽章不保密，HTTPS不保證proxy可達 | 敏感(c)不出貨，UNSUPPORTED不能算三形狀全PASS | 資料owner＋客戶IT＋安全lead |
| O02 C-25/同機改造 | 同host專用NIC/VM＋隔離switch/AP；另branch盒改為(b)；原網不動 | 優先保留(a)改造，核NT$20,000～50,000占位與3～5人日，逐站取報價 | lateral流量不經branch firewall，新增盒不能冒充same-host | 原網Type 1不接入；硬體做不到須明改形狀/交期，不默認錨點已滿足 | 客戶IT＋交付＋硬體owner |
| O03 job/分類承諾 | keyed backend；改intent；UNKNOWN人工；不用該類別 | 優先集合化intent，不可查/不可隔離禁用；能力變更重判 | effect/result log無通用原子提交，timeout與新epoch不能洗掉未知 | D-04未驗類別禁售，衝突資源鎖保留，控制命令不入樹 | 產品＋正確性lead＋安全 |
| O04 更新/硬體/足跡 | 本版app register＋全部OS現場救援；改Mender/已驗rootfs A/B；升硬體 | 採本版，核§2 W0預算與每盒0.5～1人日維修；保留G-LANG七日比較後再凍Python/Rust | 兩app目錄救不了壞kernel/shared runtime；不能以未跑比較證明語言勝負 | G-U/G-LANG未決不承諾無人值守；拒現場須新BOM/工期，不雙養兩套OTA | release＋硬體＋架構owner |
| O05 保存/災復/trust log | 基線24h業務RPO/8h RTO；更強副本/延長服務；不承諾SLA | 核§5/§7保存；完成安全操作必異故障域交接。RTO自服務窗內確認事故起算，平日09:00～18:00；窗外另簽值班 | 業務RPO不准默默復活撤銷；安全內容與artifact都要可取回 | 未核無災復交期承諾；缺最新 trust log或兩名保管人保持停權並記超時 | ops＋trust authority＋資料owner |
| O06 PLC/HMI/量測profile | reference HMI；具名MQTT/Sparkplug；更快tap/不同壓力range | 先交點表，核1Hz p95≤1.5s/p99≤2s/age3s與§10.3三壓種/零漂數值；更快另驗 | 採樣延遲不由broker消除，壓種/門狀態/供電不能靠schema補救 | D-06及未核儀表只可研究，不作已交付SLO或QA報價 | HMI產品＋PLC partner＋硬體/校準owner |
| O07 D-05管理/事件 | 具名硬體SDK；既有管理平台connector；延期 | 定硬體proof/boot policy、非控制白名單、事件隱私/法定保存及刪除責任 | SE簽章不等於完整attestation；控制loop另案，法律仍未查證 | G-A不能PASS，不標Type 3 verified、不承諾安全門禁產品 | reader產品＋安全＋法律/隱私 |
| O08 BOM/buy/player | 本版零件；書面OEM後重開buy；不合格player替換 | G-L展開28+U及全映像權利/修補；buy核三形狀downstream/退出，player走G-PLAYER | 付費不必然違M-05，root LICENSE也不代表整個映像合規 | 未知使用權/支援發行物不出貨；不能靠凍無支援舊線兜底 | 法律＋採購＋release＋display |
| O09 全角色預算/接班 | 工程38～56人週＋§14其他角色；縮產品；增人/委託 | 先首屏；至少兩名可接班工程師，另預核第三保管人或受託替補，保持兩人共同恢復；全角色逐一確認容量 | 一人缺席不能靠單人解封滿足RTO；IT/partner/驗收是主動工而非只有等待 | 無完整人力簽認不承諾交期/值班；替補未授權時維持停權，不臨時降安全門檻 | owner＋工程lead＋客戶IT＋受託保管人 |
| O10 離線/封存窗口 | 操作≤300s、HMI非敏感預授權≤8h、archive在途≤32s；更短；更長/無人解封另審 | 核基線及有人冷啟，session/重啟不延絕對期限；STOPPING完成才顯ARCHIVED | N-11與分區即時撤銷衝突；讀權不是營運boot grant，預取不是running | 未核離線新讀/操作不放行；不能以七日cert或新epoch代替授權，也不假即時kill switch | 安全＋業務＋現場ops＋ERP owner |

## 15.2 十三項 Refuter 個別裁決

重疊反例共用修補包但各有一列。全採納失敗反例與其需補的責任，不表示照收每個估工，也不宣稱產品已驗。11 重大、2 次要均保留原等級。

| Refuter ID/來源 | 原嚴重度 | 裁決 | 具體改動/最終節 | 理由/剩餘界線 |
|---|---|---|---|---|
| [security-correctness-01](refute-security-correctness.md#L23) | 重大 | 採納 | §7.2獨立完整trust log、revision/state_digest、完成前異機交接；restore重建到最新再發新epoch | 只有epoch不足；G-LIFE L01以有/無revoke同epoch區分 |
| [security-correctness-02](refute-security-correctness.md#L37) | 重大 | 採納 | §9.1所有fetch/retry/mirror/派送ticket重驗，STOPPING→ARCHIVED，32s有界race | 不取消running；O10明示F-70窗口，L04驗re-enable不改key/期限 |
| [longevity-scenarios-01](refute-longevity-scenarios.md#L91) | 重大 | 採納 | §8所有minor/kernel/library也有獨立kit/安全映像出口，artifact bytes雙存放 | canary不等於恢復；G-U/L05驗壞OS仍能救 |
| [longevity-scenarios-02](refute-longevity-scenarios.md#L101) | 重大 | 採納 | §8不可回退J與可重建D分離，migration輸入/階段記錄、D'向前修復 | 不回捲result log/floor/locks、不重演effect；無法重建停收維修 |
| [longevity-scenarios-03](refute-longevity-scenarios.md#L111) | 重大 | 採納 | §7.2與安全01同包，完整 trust log/checkpoint/缺段停權及counter世代對帳 | 不重複計人週，新epoch不補遺失撤銷內容 |
| [longevity-scenarios-04](refute-longevity-scenarios.md#L121) | 重大 | 採納 | §7.3公鑰鏈/schema/單位/政策/只讀decoder依最後archive/未決引用保存 | 退役銷私鑰與證據GC分開；L06跨major驗讀 |
| [longevity-scenarios-05](refute-longevity-scenarios.md#L131) | 重大 | 採納 | §9.2時間→本地解封→簽署policy→被動producer/view→登入，普通重開不需操作boot grant | 不擴永久離線，回撥/restore拒權；L02全島斷電而非只新browser |
| [longevity-scenarios-06](refute-longevity-scenarios.md#L141) | 重大 | 採納 | §2圖(a)/§5.1同host專用NIC/VM/VLAN改造，reset先封埠 | 硬體不容則O02明改形狀，不拿(b)代(a)；L07 |
| [longevity-scenarios-07](refute-longevity-scenarios.md#L151) | 次要 | 採納 | §7.2/O05/O09預核第三保管人/受託替補、兩人共同恢復、服務窗與年度盒數乘數 | 無兩人不降級；8h非未授權單人服務承諾 |
| [ecosystem-cost-erp-01](refute-ecosystem-cost-erp.md#L9) | 重大 | 採納 | §6.1一principal一intake_i feed、subscriber固定來源、IPC peer UID映射 | 不借不存在的publisher欄位/未定plugin；同topic/payload仍分源，實例成本入帳 |
| [ecosystem-cost-erp-02](refute-ecosystem-cost-erp.md#L17) | 重大 | 採納 | §9.2本地directory/verifier、簽署scope/絕對not_after，session受其截短 | 新browser限預授權；登入/重啟不續8h，restore先新 trust log |
| [ecosystem-cost-erp-03](refute-ecosystem-cost-erp.md#L25) | 重大 | 採納 | §9.1與安全02同包，封存/派送線性化、預取批次停送確認、結果仍回流 | 不重複計工時，32s例外由O10核，不把預取當running |
| [ecosystem-cost-erp-04](refute-ecosystem-cost-erp.md#L33) | 次要 | 採納 | §14.2工程/IT/partner/採購/法律/外審/現場/驗收分帳，年度ERP已含不重加 | 角色占位須本人確認，主動工時與不可控等待分開，非真實報價 |

## 15.3 七項 GAP 個別裁決

此處 GAP-01～07 僅指 [completeness.md](completeness.md)，不混用較早 MQTT 帳本同名 gap。全部補設計與 acceptance；不是要求本輪先實作產品才能完成修訂。

| GAP ID/來源 | 裁決 | 具體改動/最終節 | 判別與仍需決策 |
|---|---|---|---|
| [GAP-01](completeness.md#L9) | 採納 | §4.2 RMA返修/換板/失鑰/同序號雙鍵/跨租戶重售，舊鍵 trust log 撤權、新voucher與履歷 | G-PKI/L08舊機零新權、原key不重跑、歷史不串戶 |
| [GAP-02](completeness.md#L19) | 採納 | §3.3未知即Control-Semantic，capability每變先停相關下行、重分類/核准，issuer/unit同驗 | unknown class/新增IO/舊分類重播零新執行，管理白名單仍可用 |
| [GAP-03](completeness.md#L29) | 採納 | §14.1多GitLab repo SHA/digest與override、隔離CI、seed/1000cycles/24h-72h/0～2000ms jitter | 預設/單舊版override成功或預期拒絕，prod不可達，每milestone有case |
| [GAP-04](completeness.md#L39) | 採納 | §14 G-LANG保留7日Python/Rust比較；G-DIRECT有觸發/資料安全owner/對等與撤銷 | O04先核語言門檻，未跑不稱勝；直寫未PASS維持全樹 |
| [GAP-05](completeness.md#L49) | 採納 | §2數值footprint、§14逐gate固定輸入/不變量/數字/工件/owner，四種結果分開 | 文件零空白判準；O01～10須測前核准，UNSUPPORTED不計PASS |
| [GAP-06](completeness.md#L59) | 採納 | §10.3無3.3V/5.3V非穩壓拒接、三壓種/門狀態/reference零漂/QA4-20mA/健康假值 | G-T/G-S實際datasheet/失效/校準fixture，O06核產品數值，法律未查證 |
| [GAP-07](completeness.md#L69) | 採納 | §14 G-LIFE L01～08把rollback/offline/staging/archive/recovery/退役/同機/intake/RMA合驗 | 同release/原key/checkpoint/絕對截止、可用信任材料與操作者均入trace |

## 相對草稿的變更摘要

§1 改為可獨立引用的結論、五項改動與三行 MQTT 答案，分數、來源與借用表移至 §2。六案分數凍結，P2/P6 同分的取捨不虛構勝者。13 項反駁與 7 項 GAP 全部個別採納；原251條致命/重大、101條需求、19題及9錨點逐條保留。

實質增加安全內容 trust log/checkpoint、每次派送 archive gate與有界在途、可信原始來源 feed、離線讀者登入及整島解封順序；所有 OS 更新與壞 migration 具有不回退安全水位/不重演效果的恢復出口。補長期驗讀材料、RMA/能力重分類、同機 C-25 變體、N-20/N-21、數值足跡、多repo隔離CI、語言/直寫原PoC與八條生命週期合驗。首屏與年度成本改為全角色分帳，雙人恢復有預授權缺席替補。

未新增產品測試、網路查核或生產批准；原文件不變，README、LOG、commit/push 留主審處理。所有交付 gate 與 owner 簽核仍待後續執行，明示不支援的現場組合也沒有被改名消除。