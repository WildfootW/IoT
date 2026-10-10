結論先講：**致命 0 條、重大 6 條、次要 1 條；本 lens 判定草稿整體尚不成立，骨架可以保留。** 問題不是沒有實作，而是照目前規則操作，仍會在更新、還原、離線冷啟及同機隔離遇到未定義或互斥的步驟。十五節與 251 條重大／致命路由只能證明可追溯，不能證明修法奏效。

# Wave C：十年維運與情境擬合

日期：2026-10-11；角色為指定 REFUTERS longevity-scenarios/A.6。strongest/xhigh 僅為請求；host inherited，無法控制或驗證。未讀其他 refuters，未委派、網查或執行產品／PoC。

COMMON 已讀：brief、00/01/02、LOG/interim、六案、42 份批評／答辯／評分、四份帳本與草稿全文；八份 facts 結論及相關六份全文。第三方資訊沿用 2026-10-10 紀錄；摘要不升格，未定版本、CM4 能力及價格均未查證。反例、修法與估工屬獨立判斷；工時可能已含草稿預算，須去重。

## 種類與部署

按「獨立外部家族」重算，有 28 個具名槽位，非 28 個新服務。保留未知 U，不因 SBOM 尚未凍結判錯；同一 PG/broker 的多實例不灌成新引擎，相同 Python 的多個交付映像仍須分列版本矩陣。

| 分組 | 草稿 K 清單重算 | 數量／責任時鐘 |
|---|---|---|
| 業務、資料、語言 | K01 Odoo、K02 PG、K03 SQLite、K04 Python | 4；ERP、DB、runtime 各自支援線 |
| 網路與安全 libraries | K08 nginx、K09 OpenSSL、K10 cryptography、K11 PyJWT、K12 aiohttp、K13 psycopg2 | 6；固定版、授權、API／安全修補 |
| 播放 | K14 Anthias、K15 renderer | 2；不能只追 wrapper 而漏 browser |
| OS／部署 | K05 Debian、K06 kernel、K07 systemd、K16 Engine、K17 Compose | 5；應用回退不會回退這些依賴 |
| 網路、時間、備份 | K18 nftables、K19 chrony、K20 dnsmasq、K21 restic、K22 OpenSSH、K23 CA bundle | 6；政策、授時、恢復與秘密生命週期 |
| 板端與現場 | K24 boot/EEPROM、K25 board/GPU firmware、K26 hypervisor、K27 AP、K28 switch | 5；硬體適配、韌體與共故障域 |
| 合計與其他軸 | 4+6+2+5+6+5=28；自有 node/ERP/display 三家族；node/ERP/deploy/e2e/Parts 五 repo 家族 | 外部 28+U；Python/SQL/shell/JavaScript 四種維護語言；Python、shell、browser JS 至少三類語言執行環境，SQL 引擎另計，不跨軸總加 |
| 本表來源 | [draft.md](draft.md#L60)、[ledger-review.md](../40-mqtt-ledger/ledger-review.md#L62) | 前者為待驗設計，後者為計帳意見；並非交付 BOM |

以下以一片 D-01、草稿中央五角色及屏端四角色為共同基線。V 是額外 bridge 數，每個至少有 node/helper 兩角色；實際 worker、resolver、renderer 另列。雲端搬遷不減少全系統種類，借用 IT 服務也不消除依賴。

| 形狀 | 位置、發起方向、應用角色下限 | 實體／隱藏依賴與種類 |
|---|---|---|
| (a) 同機 | north/south 同主機：ERP、PG、nginx、B0、issuer；CM4：node/display/player/helper，共 9。unit→B0:443；B0→ERP 私有 HTTPS | 現場至少 ERP 主機與 CM4；異機備份及獨立復原工作站不可隨同一 hypervisor snapshot 回捲。28+U 是含既有現場設備的責任帳，非 CM4 安裝清單；T1 retrofit 的同機變體見 06 |
| (b) 跨 VLAN | north 五角色；屏端四角色；V=1 時加 bridge node/helper，至少 11。unit→south→B0 均 443；writer/PG 留 north | 同軟體家族可維持 28+U，但多主機、狀態卷及更新單位；新 switch/AP 不同產品線各 +1，若取代退役舊設備則不雙算 |
| (c) 雲端 ERP | 雲端五、站內屏端四，直接 B0 的純屏至少 9；T1/HMI 要 site bridge，至少 11。site→核准 proxy／cloud B0→ERP，沒有 cloud→site 新連線 | B0/issuer 在雲端，不是 P0 的站內 B0；root FQDN 與 ERP public/internal 分設。28+U 外另盤客戶 proxy、雲平台/LB、備份目的地；可重用家族不強加 K，另用產品則增加 |
| 基礎依賴 | DNS/time/backup/admin 不在上述 9/11 內；DNS 53、時間 123 只到指定服務，backup/admin 用受限 22 或 HTTPS | resolver 解封來源、備份端、復原工作站、release artifact 保管、CI runner/package registry、監控匯出均須指定實作與 owner；未選者留 U，不能算零 RAM／零人力 |
| 來源 | [draft.md](draft.md#L114)、[draft.md](draft.md#L294)、[draft.md](draft.md#L396)、[draft.md](draft.md#L698) | 圖是連線發起方向，不是命令 authority 方向；B0 的更新／備份程序亦須入實例清單 |

| 在一屏基線上增加功能 | 已具名 K 增量與重算 | 不隨種類數消失的執行責任 |
|---|---|---|
| D-02＋歷史/Grafana | sensor driver +1、Grafana +1，30+U | sensor process、writer、第二 PG 實例、Grafana；不新增 DB 引擎 |
| D-03＋歷史/Grafana | pymodbus +1、Grafana +1，30+U | poller、RS485/serial、代表與校準資料、writer/PG；TCP 502 只南向輪詢 |
| D-04 | 未指定新增外部庫，仍為 28+U 下限 | LED backend 為額外自有家族；GPIO/控制器韌體相依未查證，不能保證零增量 |
| D-05 管理/事件 | SDK、key provider、attestation/boot 工具至少 +3，31+U | reader backend/verifier、事件 journal、製造與硬體政策；事件進 ERP，不強加量測 history，也不包含門鎖控制 |
| D-06 Modbus/reference HMI＋PG/Grafana | pymodbus、Grafana +2，30+U | 本地 poller/view、HMI browser 實例；HTML/JS 是自有交付物。改 OPC UA 需另盤選定 library |
| 上列 D-06 再選 MQTT/Sparkplug | broker/client +2、protobuf/codec +2，34+U；另選第三方 HMI 再 +1，35+U | raw/n 需要時兩實例，一 broker 家族；新 AP/switch 仍另計，未納數字。不能把此收益自動歸給第二 unit binding |
| 來源 | [draft.md](draft.md#L104)、[draft.md](draft.md#L357)、[mqtt-semantics.md](../10-facts/mqtt-semantics.md#L63) | codec 的版本／維護未查證；不是要求首屏安裝全部選配 |

## 狀態與恢復盤點

十二個月備份仍可包含三年 raw；不要求永久保存所有備份。下表核對恢復後的 authority、內容可讀性與收據，不宣稱工具已驗成功。

| 狀態域 | 必須一起恢復或明確重建的內容 | 草稿處置與剩餘責任 |
|---|---|---|
| ERP PG＋CMS filestore | desired/outbox/SQ/flight、inbox/cursor/receipts、結果與事件 archive、使用者/權限、內容版本與 hash | 同 manifest、先封 command write gate 成立；staging archive connection 且無 prod secrets/egress。驗兩種 restore，不把資料副本當授權 |
| B0 SQLite／安全日誌 | binding/adopt/claim/revoke、schema、公鑰歷史、政策、授權水位、quota/drop counters | 一致備份有 owner；但獨立 epoch 登錄不等於最新撤銷及政策日誌，見 03/04 |
| unit SQLite／媒體 | inbox/CQ、UNKNOWN/locks、dedupe floor、sample/event seq、spool、schema、applied/id map、current/LKG | 不複製活檔、不回捲 floor 成立；錯 schema 的向前修復與 player 本機狀態的重建邊界見 02 |
| bridge origin journals | T1 representative/map/generation、未交接 events/telemetry、收據 outbox、schema、來源與 drop 範圍 | origin 不可當 cache；鏡像可重取。移機須保留來源 ID，不能新造序號讓回補併錯歷史 |
| history PG／SQL | samples、roles、typed schema、去重鍵、dirty buckets、roll-up/retention 水位 | 完整 DB 與還原 owner 已有；量 bytes/sample、WAL、RTO 是 G-S 未來 gate，不另判 finding |
| Grafana | dashboards、datasource/roles、實際 DB 中無法從 repo 重建的設定 | 草稿只概括 DB/repo/credential 分流；profile 須指出實際 DB 或全部可重建範圍，不假定 dashboard JSON 等於所有狀態 |
| raw/n broker | session/retained 是 cache；dynsec ACL 是核准政策的投影，本地 TLS/admin credential 另保管 | 空啟動後同步授權才開 listener；WAN 斷時如何使用仍有效的 HMI 讀權需分支，見 05 |
| app/helper/OS/boot | 完整可用 artifact、相容 runtime/工具、切換階段、stop marker、救援 kit | 只有 manifest 不足以重灌；要指明 artifact bytes 的保管者、保留與解封依賴。OS minor 與 schema 失敗見 01/02 |
| PKI／secret escrow | factory/recovery 根、intermediate、線上用途鍵、解封材料；舊證據的公鑰/鏈另存 | 雙人私鑰 escrow 與 staging 排除成立；正常冷啟解封不能循環依賴尚未恢復的連線，見 05/07 |
| 獨立復原工作站／匯出端 | epoch 追加登錄及異機副本、操作 grant、counter/gap 的世代與來源 | 不能只取舊 DB 最大值加一；工作站也要更新、備份、授權和可達性，見 03/07 |
| AP/switch/DNS/time 設定 | 隔離矩陣、介面/SSID、DHCP reservation、DNS 名稱、時間來源與校時狀態 | 與部署 manifest 綁版本；設備 reset/替換先封 T1 再復原政策，不能借未查證預設值保證隔離 |
| 來源 | [draft.md](draft.md#L311)、[draft.md](draft.md#L334)、[draft.md](draft.md#L382)、[draft.md](draft.md#L460) | 類別覆蓋不代表恢復成功；03/04/05 是相互依賴的設計缺口，其餘多為已具方向的 gate |

## 十八組流程

下表是設計走查，不是通過紀錄；01～07 為後文 finding 短碼。共同驗收須保留原 key/version、真實錯誤與可見 gap，不能只測連通。D-05 只走管理及事件，D-06 不進製程控制。

| D-ID | 形狀 | 起點至可觀察終點 | 確切失敗分支／待驗範圍 |
|---|---|---|---|
| D-01 | (a) | ERP Apply/outbox→B0→unit 取完整 manifest/assets→reconcile→actual/hash→ERP | 正常路徑成立；OS minor 斷電及壞狀態更新見 01/02；不把 API 200 當畫面 |
| D-01 | (b) | ERP→B0→VLAN bridge cache→unit/player→CQ/actual→ERP；MES JSON 約五秒輪詢 | 已有逐屏 polling/stale；cold restart、錯 schema 與 restore 見 02/03 |
| D-01 | (c) | cloud ERP→B0→site bridge 或直連 unit→完整內容→actual 沿 outbound 回雲 | B0 在雲端；無 site bridge 的屏端仍需本機 LKG。I profile 的私密內容阻塞已承認，不另重票 |
| D-02 | (a) | sensor process ready→1 Hz 採樣／30 秒平均→spool→B0 writer→PG/Grafana；越線另進 ERP | 暖機/錯時不寫正常值成立；重啟時 source_time 與解封來源合驗 05 |
| D-02 | (b) | sensor→unit→south journal→B0/PG→圖；來源事件→ERP receipt | schema/quality 屏障已有；PG commit 回覆遺失、不同時間點 restore 仍須測 |
| D-02 | (c) | 站內採樣/journal→核准出口→cloud writer/PG→Grafana；ERP 僅業務事件 | 48h 或容量先到的有損遙測已明示；不得把三年 horizon 說成零 RPO |
| D-03 | (a) | south 登記 id/map→同機 poller→T1 RTU/TCP→schema/統計→writer/PG→圖 | 預設新增 south 盒已改變同機位置，見 06；不能只驗改造後的 (b) |
| D-03 | (b) | VLAN poller→白名單 502 或獨占 serial→validator/journal→B0→PG/Grafana | 換表新 generation、signed 壓差已有；實際 RS485/VM passthrough 與 N-20 供電是未來硬體 gate |
| D-03 | (c) | site poller 近源蓋時→origin journal→cloud B0/PG→圖 | 不需 WAN Modbus；origin、schema、counter 恢復需 02/03，非清空 cache |
| D-04 | (a) | ERP capability/資源槽→intent 或 SQ→unit/backend→CQ→ERP receipt | 無 keyed query 的已開始工作保留 UNKNOWN 成立；壞 migration 不得抹 locks，見 02 |
| D-04 | (b) | ERP show 成員/能力快照→B0/bridge→各 strip 本地 timeline→逐目標 outcome→ERP partial | 跨盒非原子是明示取捨；timeout 不解鎖成立；restore 新 epoch 仍需舊 evidence，見 03/04 |
| D-04 | (c) | cloud SQ→site outbound→LED 本地執行／standalone→耐久 CQ→復線 ERP | WAN 斷不重演效果成立；退休後歷史證據不能跟可執行信任一起 GC，見 04 |
| D-05 | (a) | reader 硬體 proof→Manage/registry→非控制 config_rev→reader actual/heartbeat/attestation→ERP | 缺證據不得 verified 已有；SDK/SE/boot 能力未查證，G-A 合理，不要求現在完成控制產品 |
| D-05 | (b) | reader→south→B0；設定試接新 parent、成功才提交→actual；event journal→ERP | parent 切換與舊設定保留已有；復原不可讓已撤銷身分取得新 grant，見 03 |
| D-05 | (c) | reader/site 主動出站→cloud registry/ERP；硬體事件經 journal/receipt 入出勤 | I profile 不送私密出勤是已承認阻塞；保存期限由 O-07 核定，證據 GC 見 04 |
| D-06 | (a) | PLC 唯讀 poller→本地 metric view→HTML HMI；另→writer/PG、ERP 事件 | 需提供保留同機 south 的 C-25 變體，見 06；SLO 不是 broker 名稱保證 |
| D-06 | (b) | PLC→south view/n→本地 HMI；north 僅 ≤1 Hz 分析及業務資訊 | p95 1.5s/p99 2s、age 3s 是待驗 gate；有效讀 lease 下整島重啟見 05 |
| D-06 | (c) | PLC→site producer/view→本地新 browser；site 另向 cloud writer/ERP 補送 | G-H 不可只測 bridge 保持運作時的新 browser；site 斷電且 WAN 仍斷的恢復見 05 |
| 流程來源 | (a)(b)(c) | [draft.md](draft.md#L466)、[draft.md](draft.md#L478)、[draft.md](draft.md#L487)、[draft.md](draft.md#L496)、[draft.md](draft.md#L505)、[draft.md](draft.md#L514) | C-25 原始錨點見 [03-brief.md](../03-brief.md#L13)；N-07/N-14/N-18 見 [00-requirements.md](../00-requirements.md#L180) |

## Findings

### longevity-scenarios-01 | 重大 | OS minor 更新沒有獨立於失敗環境的復原路徑

| 情境／需求 | 證據 |
|---|---|
| (a)(b)(c)，D-01/D-02/D-04；N-07/N-10、M-06 | [draft.md](draft.md#L404)、[draft.md](draft.md#L410)、[draft.md](draft.md#L741)；原 [P2/longevity-01](../30-critiques/P2/longevity.md#L15) |

失敗步驟：helper 遠端更新 kernel、Python 或 TLS 套件，中途斷電，系統或 helper 的共用 runtime 無法啟動。兩個 app 目錄與另一個 UID 都不能復原這層；canary 只減少同時受害數。草稿只把 major/boot 指定現場救援，minor/security 分支沒有相同的失敗出口。不是主張必須採 Mender，也不是宣稱 CM4 已有或沒有 A/B。

修法：首版可明定所有改共享 OS/runtime 的更新均具現場救援保底，或選能獨立啟動的已驗 recovery image；app bundle 明列哪些依賴隨槽切換。以實際 carrier、eMMC/SD、救援連接器及停機窗口定型，補 minor 斷電測試。種類可 +0，另有救援 artifact／硬體料件；預留 2～4 人週，每映像重驗，現場每盒人日另付。缺量測可等 G-U，缺這個分支不能等事故再選。

### longevity-scenarios-02 | 重大 | 相容 schema 不等於錯誤狀態可以回退

| 情境／需求 | 證據 |
|---|---|
| (a)(b)(c)，D-01/D-03/D-04；F-11/F-32/F-46/F-51、N-09/N-10 | [draft.md](draft.md#L390)、[draft.md](draft.md#L404)；原 [P5/correctness-07](../30-critiques/P5/correctness.md#L49) |

失敗步驟：候選版本已寫入錯誤 id map、applied 或 schema 映射，健康檢查失敗後只切回舊 binary。格式向後相容也可能保存錯誤意義；舊程式會重讀同一壞狀態。直接還原舊 DB 又被「floor/CQ 不回退」禁止，且會刪掉更新期間已接受的結果。草稿正確拒絕盲回捲，卻未指定剩下哪條路能救回狀態。

修法：分開不可回退的 admission/CQ/安全 journal 與可重建的衍生狀態；migration 記錄版本、輸入範圍及提交階段，指定向前修復／重建程序。不能重建的變更先停收並做可對帳的維修，不承諾自動 rollback。種類 +0，沿用 SQLite/node；預留 2～3 人週，每次 migration 都驗「已寫新資料後出錯」，成本不是只測換檔與啟動。

### longevity-scenarios-03 | 重大 | 新 epoch 不能補回遺失的撤銷決策

| 情境／需求 | 證據 |
|---|---|
| (a)(b)(c)，D-01/D-04/D-05；F-19/F-33、N-04/N-05/N-09 | [draft.md](draft.md#L389)、[draft.md](draft.md#L396)、[draft.md](draft.md#L398)；原 [P2/longevity-05](../30-critiques/P2/longevity.md#L45) |

失敗步驟：B0 備份後撤銷一台裝置，再還原舊 B0；獨立工作站給了較大的 epoch，卻只保證世代未倒退。舊 registry 仍認那把公鑰有效，可能為它簽出全新的 grant；拒絕舊 epoch 不能拒絕這個新授權。三方按 job key 對帳也找不回只在遺失安全日誌中的撤銷。這不是要求業務資料零 RPO，而是不能讓安全決策靠舊業務備份復活。

修法：指定異故障域的撤銷／採納／政策決策日誌及不可回退 checkpoint，ack 決策前完成必要交接；復原先重播到可信水位才發 grant。日誌缺段就隔離受影響身分，不能僅取新 epoch 放行。沿用既有 PG/SQLite 可 +0 K，但增加同步／保管角色；預留 2～4 人週，季度測撤銷後還原及登錄遺失，並將 counter 的世代/缺口一起對帳。

### longevity-scenarios-04 | 重大 | 退休時的證據 GC 早於 archive 的到期

| 情境／需求 | 證據 |
|---|---|
| (a)(b)(c)，D-02/D-04/D-05；F-08/F-14/F-46/F-49、N-09/N-10 | [draft.md](draft.md#L215)、[draft.md](draft.md#L234)、[draft.md](draft.md#L319)、[draft.md](draft.md#L321)；原 [P5/longevity-03](../30-critiques/P5/longevity.md#L34) |

失敗步驟：裝置退休、關閉 replay 並銷毀可執行備份後，按表允許 GC key history；兩年後讀三年 archive 的簽章結果，kid 所需公鑰鏈或授權歷史卻已不存在。原始 bytes 還在，不等於可核驗。線上只支援目前／前一 major 也沒有說明舊 archive 的 decoder 如何保留，不能用十二個月 fleet 遷移替代三年讀取責任。

修法：把「禁止再次執行」與「仍能驗讀證據」分成兩種 GC；公鑰鏈、schema、單位、必要驗證政策與 read-only decoder 按最後引用的 archive／未決工作保存。私鑰不因此延長有效期，staging 也不因此得到操作權。種類 +0；預留 1～2 人週，每次退休及 major 升級跑舊證據 fixture，每年另留半至一人週盤點；未決 UNKNOWN 可令證據期更長。

### longevity-scenarios-05 | 重大 | 離線 HMI 讀權與整島冷啟規則尚未接合

| 情境／需求 | 證據 |
|---|---|
| (b)(c)，D-06，兼及 D-01/D-02；N-07/N-11/N-14/N-18 | [draft.md](draft.md#L257)、[draft.md](draft.md#L268)、[draft.md](draft.md#L393)、[draft.md](draft.md#L398)、[draft.md](draft.md#L520)、[draft.md](draft.md#L746)；原 [P2/ecosystem-04](../30-critiques/P2/ecosystem.md#L25) |

失敗步驟：WAN 已斷、八小時讀 lease 尚有效，site bridge 再斷電重開。按「冷啟須新 boot grant、離線只能 LKG」的字面規則，沒有分支讓本地 producer、登入與 broker ACL 重建恢復服務；G-H 只明列新 browser，不能覆蓋整島重啟。若本意只限制新命令，就應明訂被動採樣／讀取例外，不能由實作者猜。八小時到期拒讀是已接受的取捨，不另計缺陷。

修法：畫出時間→解封→本地政策→poller/view→browser 的無循環啟動順序；指定預授權讀權的本地保存、驗證者與過期行為，禁止藉此發新操作權。(a)(b) 明定核准時間源；(c) 在只准外出 443 下選已驗 RTC/站內來源或具名現場校時，不能暗借公網 NTP。既有服務可 +0 K；缺 RTC 的新料件另計，能力未查證。預留 2～3 人週，每映像測斷 WAN 整島冷啟與時鐘失效；人工恢復納入人力帳。

### longevity-scenarios-06 | 重大 | C-25 預設改造把同機情境變成跨機情境

| 情境／需求 | 證據 |
|---|---|
| (a)，D-03/D-06；M-03/M-04、F-18、N-01/N-18、C-25 | [draft.md](draft.md#L123)、[draft.md](draft.md#L294)、[draft.md](draft.md#L551)；原 [P6/security-07](../30-critiques/P6/security.md#L92) 及 [P3/score.md](../30-critiques/P3/score.md#L27)；[transport-through-networks.md](../10-facts/transport-through-networks.md#L87) 的摘要及 [L110](../10-facts/transport-through-networks.md#L110) 的設計建議 |

失敗步驟：在要求 south/north 同主機的客戶，依預設把 T1 搬到新四網口 south 盒；隔離可能成功，實際卻已部署成另一種形狀。草稿確實提出新 switch/AP、逐設備埠及施工費，不能再批評它只喊 VLAN；缺的是同機版本的接線與權限路徑，不是缺隔離意識。單 hypervisor 本身不是可任意拆掉的前提。

修法：另列同機 south 的專用 NIC/VLAN 介面、隔離 switch/AP、VM/UID 邊界及到北側的唯一通道，保持兩角色在同一主機，禁止 T1 使用舊 SSID／旁路；維修 reset 先隔離接入再恢復政策。若硬體做不到，先請 owner 改 M-03，不把 (b) 測試算成 (a)。種類通常新增 switch/AP 各一產品線，NIC/firmware 另核；預留 1～2 人週模板，沿用每站 3～5 人日施工估額，重接線與韌體更換都要再驗。

### longevity-scenarios-07 | 次要 | 下限帳尚未轉成兩人團隊的服務範圍

| 情境／需求 | 證據 |
|---|---|
| (a)(b)(c)，D-01～D-06；M-02/M-06、N-07/N-09/N-13 | [draft.md](draft.md#L395)、[draft.md](draft.md#L417)、[draft.md](draft.md#L762)、[draft.md](draft.md#L769)、[draft.md](draft.md#L742)；原 [P6/longevity-03](../30-critiques/P6/longevity.md#L70) |

失敗步驟：兩人中的一人無法到場，另一人持有備份卻不能完成雙人解封，待核准的八小時 RTO 就不能照一般 restore 計時。這不證明兩人一定不夠，也不把未獲承諾的 RTO 當已違約；缺的是服務時段、替補保管人與現場回應責任。新增工作站、授時及救援 kit 不一定增 K，仍會增值班與維修工作。

按草稿單價，三十盒加一台同規格 bridge 的一次 major 維護為 15.5～31 人日，即 3.1～6.2 人週；加年度共用 6～10，發生該維護的年度為 9.1～16.2，交通停機另計，沒有重算已含的 ERP 2～4。首屏 27～41 也是人週，不是兩人的交期。修法：以 O-05/O-09 核服務窗口、替補 escrow 與客戶維修人；種類 +0，半至一人週整理和演練，年度按站點／盒數而非固定總額續估。

## 草稿此點成立

1. **草稿此點成立：應用更新與 OS/boot 維修可以分開選。** 不假設 rootfs A/B，也不從 Mender 根 repo 的授權推出全套可用；[D1](../10-facts/buy-options.md#L56) 的 2026-10-10 證據只到該範圍。01/02 要的是可恢復的失敗分支，不是指定購買更新平台。
2. **草稿此點成立：資料與副作用有不同保證。** 未確認 CQ pin、UNKNOWN 保鎖、明示媒體毀損 RPO，已比延長 TTL 完整；[draft.md](draft.md#L183) 沒把 ack 當完成。本輪不要求無限磁碟、零資料損失或通用物理 exactly-once，也不要求現在寫好所有測試。
3. **草稿此點成立：首屏可不帶 MQTT/history/Grafana。** HMI 在本地分流、特定工具才加 broker/codec、雙實例不雙算家族，符合小規模與可分期目標；[draft.md](draft.md#L344) 沒再把 retained 當負資產。沒有實測 RSS 只是 G-U 待驗，不足單獨判 footprint 不合格。
4. **草稿此點成立：D-05 已有管理與證據門檻。** 硬體證明、設定 actual、事件保存與控制白名單已有落點；[draft.md](draft.md#L505) 明說缺 attestation 不能 verified。PLC 點表、reader SDK、特定 AP 能力與 CM4 供電未查證，應在首用驗收，不應憑空填成不支援或強迫本輪實作控制通道。

## 最終整體評估

**survives=false，限於目前完整維運承諾，不是淘汰 P2 或改投 MQTT。** 最難的是保留安全水位的壞狀態修復、最新撤銷證據的災復、有效讀權下的整島冷啟，以及保留同機形狀的 C-25 改造。先補責任與復原決策，再做 G-U/G-R/G-T/G-H/G-NET。能指出每一步可用的 artifact、信任材料、owner 與操作人，才可推翻反例；再次連到 gate 名稱不算解決。