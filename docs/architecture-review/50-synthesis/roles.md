# 五個角色現在長怎樣：管理中心、device、業務資料、全數據歷史、中間串接

> 2026-10-11，主審依 `final.md` §2、§3、§4、§5、§7、§8、§9 整理。每個角色寫四件事：它由什麼跑、它持有什麼事實、它和誰講話、相對今天改了什麼。

## 0. 一張圖

```
                 ┌──────────────── 管理中心 ───────────────────┐
                 │  Odoo UI（Fleet / Manage / CMS）＋ connector  │
                 │  root node：registry 投影、issuer、watch API  │
                 │  trust log（trust authority，獨立故障域工作站）│
                 └───────┬────────────────────────┬────────────┘
   業務資料               │ root node 讀 ERP queue、  │ watch API（list + watch）
   Odoo PG：desired、      │ 推業務 inbound            ▼
   job queue、CMS、        │               全數據歷史：獨立 PostgreSQL（recorder 寫）
   結果 archive            │                          ▲ 樣本（等 PG commit receipt）
          ───── 中間串接：child 發起的 HTTPS 串流 ─────
                          │
                 ┌────────┴────────┐
                 │ branch          │  poller（Modbus）/ intake（MQTT Type 1）/ validator
                 │                 │  Type 1 stand-in / 文件快取 / projection（給 HMI）
                 └────────┬────────┘
                          │ HTTPS（leaf 撥出）
                 ┌────────┴────────┐
                 │ leaf（unit）    │  node 的 leaf 角色 + 分 process 的 backend
                 │                 │  SQLite：actual、result log、inbox、UNKNOWN、dedupe、LKG
                 └─────────────────┘
   Type 1（封閉韌體）只到 branch 的 poller 或 intake，永不直達 root node、ERP、DB。
```

一屏的最小部署沒有 branch：leaf 直接以 root node 為 parent。第一個 Type 1 或本地 HMI 出現才加 branch。

**unit、branch、root node 是同一支 node release**，差別只在設定啟用哪些角色與子 process：leaf 啟用 backend，branch 啟用 poller、intake 訂閱、validator、stand-in，root node 啟用 issuer、recorder、watch API。同一支程式，但解析外部位元組的 process、發證的 process、寫 DB 的 process、更新 helper 各自獨立 UID，不合成一個特權 parser（`final.md` §2、§9、§12 Q19）。一台螢幕同時輪詢一個 Type 1 感測器時，它就是同時啟用 leaf 與 branch 角色的同一支 node（F-25）。

## 1. 管理中心

| 面向 | 現在的設計 |
|---|---|
| 由什麼跑 | 三件東西合起來：Odoo 的管理 UI（Fleet、Manage、CMS）；root node（node 的 root 角色，root 側）；trust log 工作站（獨立故障域，不在同一個 hypervisor 的另一個 VM） |
| 持有什麼 | Odoo：binding 的業務投影、Manage 的意圖。root node：registry 投影（binding、config、route、path、incarnation）、憑證發行的執行（營運 cert 7 天、半期續期）、watch API、recorder。trust log：每次 adopt、revoke、key、policy、binding、分類、封存世代的完整決策與 digest，是安全狀態的唯一權威 |
| 誰可以寫 | binding 與 config 只有 registry 寫；安全決策只進 trust log；ERP 不是第二個 binding writer |
| Manage 流程 | ERP 記 pending 意圖 → registry 把決策交接進trust log、拿到 checkpoint → ERP 才建 managed 投影。斷線時只能顯示「待完成撤權」，不能謊稱全域已交接 |
| 撤銷 | 目標 60 秒內阻止新工作；操作 lease 最長 300 秒；離線裝置最多吃完撤銷前已發的剩餘期限 |
| 相對今天 | 今天的 registry 是 Orion 加 IoT Agent 的 Mongo，管理 UI 在 Odoo，兩者之間靨提供 provisioning 腳本同步。最終版拿掉 Orion、IOTA、Mongo，registry 併進 root node，並新增一本不會被業務備份回捲的trust log。這是唯一真正新增的「東西」 |

## 2. Device

| 面向 | 現在的設計 |
|---|---|
| 由什麼跑 | 一支 node（agent 角色）加分 process 的 function backend：display（對 Anthias 的 reconcile）、LED、sensor、Modbus poller。各 backend 獨立 UID、只綰 localhost、有界 IPC。另有獨立的 update helper。node 是唯一持網路憑證的 process |
| 持有什麼 | SQLite 裡：actual（每個 function 的實況）、result log（job 結果，未獲 ERP receipt 前無 TTL，已交接後至少 90 天）、inbox / admission、UNKNOWN 與鎖、dedupe 高水位、LKG desired、本地 id map、文件與媒體快取（current / LKG / applying）、telemetry spool（48 小時或 1 GiB） |
| 身分 | 裝置自己產鑰；出廠預置 enrolment 根、recovery 根、環境 voucher；bootstrap 只能 announce；adopt 後拿 7 天營運 cert；過期 30 日內走 recovery route |
| 做什麼 | announce config space（serial、功能、class、schema、capability）→ 拉 desired 與 job queue → 每 function 一個 reconciler → 先寫 result log 再上報 → report actual、心跳、量測批次。一個 unit 可以同時是 endpoint 與 branch（F-25） |
| 離線 | parent 不可達時沿用 LKG desired 繼續播、繼續採樣進 spool；不開新命令；操作 lease 到期後不接受新設定與敏感文件 |
| 更新 | desired.software 是簽章 manifest；沿 parent 預取完整 bytes、驗 hash、進 staged、helper 原子切換 current / candidate 目錄、健康確認後回 committed。不是 rootfs A/B；改到共用依賴算 OS 更新，走維護窗加現場救援 kit |
| Type 1 怎麼算 | Type 1 自己不是 device 角色，它只到 branch 的 poller 或 intake；由 branch 建立 stand-in 代述，標低信任等級 |
| 相對今天 | 今天 gateway、LED 控制器、感測服務各自綰 0.0.0.0 無認證（B-10），provisioning 走 admin port，命令推到註冊時的 IP（C-12）。最終版全部改成 leaf 撥出、localhost backend、裝置產鑰、register 與 result log |

## 3. 業務資料

| 面向 | 現在的設計 |
|---|---|
| 住哪 | Odoo 的 PostgreSQL 加 CMS filestore |
| 持有什麼 | desired：playlist、profile、show、binding 意圖、門檻規則。job queue：job、flight、start deadline、single-flight、衝突資源集合。CMS 內容與版本。結果與業務事件 archive：完整簽章至少 3 年，未決與 UNKNOWN 無 TTL。F-67 的 inbound replay 2 天 |
| 收什麼 | 只收業務資訊：binding 狀態、online / offline、命令終態（成功、拒絕、延期、UNKNOWN、timeout）、門檻越線事件、applied version。每筆量測永不成為 ERP row（F-03、F-30） |
| 怎麼進出 | 出：root node 讀 ERP 的 queue（pull，統一方向）。入：root node 推業務 inbound 到 connector 的單一路由，先驗 service identity 與 scope 再寫，回真實狀態碼。ERP 受理的線性化點是業務與 job queue outbox 同一交易，交易外才搬運（C-20） |
| 完成判定 | 版本由 ERP 給；done 等於重讀到 actual.version == desired.version，或同 key 的 result log 終態。ERP 的結果、去重、cursor、receipt outbox 同交易提交後，root node 才簽最終收據 |
| 封存 | archive 是每次派送的 gate：每次 fetch、retry、鏡像補送都要換單用 attempt ticket；STOPPING → ARCHIVED，在途最多 32 秒 |
| 相對今天 | 今天的命令 attribute 讀回空字串、`_info` last-writer-wins、dispatch 任何例外標 error、7 天刪 row（B-01、C-06、C-07）。最終版把 desired、job queue、結果 archive 全部明確定為 ERP 持有且耐久，business ordering 回到 ERP |

## 4. 全數據歷史資料

| 面向 | 現在的設計 |
|---|---|
| 住哪 | 一屏無 history。第一個 history 承諾起，用我方 ops 管理的獨立 PostgreSQL 實例：與 ERP 同引擎，但分 WAL、資源、備份窗口，不放客戶管的 ERP 叢集 |
| 誰寫 | root 側 的 recorder process（root node 旁，獨立 UID，唯一持 history role）。branch parser 沒有 DB key |
| 怎麼寫 | 窄表按月分區；sample_id 綰 unit、incarnation、sequence、attribute，同 ID 異值隔離；型別、單位、schema revision 不可變；去重、樣本、dirty 標記同一交易，commit 後才向來源發 PG receipt，unit 收到 receipt 才釋放 spool |
| Roll-up | dirty-bucket 增量重算，保存 sum、count、min、max，不平均平均值；合法遲到樣本只要在 3 年 horizon 內就重算 |
| 保留 | raw 至少 3 個曆年；hourly 5 年；分區回收等 dirty 清完再 DROP PARTITION，記 rows 與 bytes |
| 時間 | 近源 sample_time 與 received_at 分列；帶 boot_id、sample_seq、clock_quality、不確定度；暖機、故障、無效時間排除於平均與告警 |
| 事件 | D-05 類事件型資料另有 source event journal：未交接的已接受事件無 TTL，初始 512 MiB |
| 誰讀 | Grafana 只給 ops（歷史、門檻線、系統健康）；MES、HMI、客戶系統各有獨立身分與 line / function / field scope 的 SQL view 或 role，不借 site credential |
| 告警 | 門檻規則由 ERP 寫成 desired，最近資料 owner 節點算遲滯並持久保存 transition，ERP 通知值班者。不在 Grafana 做業務規則 |
| 擴容 | 預估超 10 億樣本、儲存超可用六成、查詢 p95 超 2 秒或恢復超 8 小時，才啟動替代引擎評估（VictoriaMetrics 候選），不自動切 |
| 相對今天 | 今天是 QuantumLeap（已死）寫 CrateDB（線已結束），first type seen 永久、不能 DROP column（C-15、C-16）。最終版換成自己的 recorder 寫平白 Postgres，schema revision 進表，Timescale 的 TSL 功能一律不用 |

## 5. 中間串接

| 面向 | 現在的設計 |
|---|---|
| 樹 | leaf → branch → root node → ERP。每條管理 hop 都由 child 發起 HTTPS；root node 也主動讀 ERP queue。先驗兩層 intermediate branch |
| 傳輸 | NDJSON stream 加有限批次，同一個狀態機。心跳 20 秒、watchdog 70 秒、long-poll hold ≤ 20 秒、每 child ≤ 2 連線、批次 ≤ 256 筆或 256 KiB、jitter backoff 1 到 60 秒、遵守 Retry-After、ETag / 304 只省流量 |
| watch | consumer 先讀 scope 對應的 schema 與快照，再從固定水位 watch 增量；游標缺口回 410 加重新快照；每 120 秒批次清冊對帳補漏 |
| branch 的工作 | Modbus poller（白名單 502 或本機 serial）；每個 MQTT Type 1 來源一個隔離的 intake 實例（publish-only、不持久、資源上限）；validator 做來源歸屬、schema、單位、品質、速率、時間檢查；Type 1 stand-in 與 announce；文件快取與 LKG；本地 HMI 投影（HTTPS view 或 curated MQTT export，projection 實例）。HMI 永不讀 intake |
| 網路 | default deny。Type 2 只到自己的 parent:443；branch 到 root node:443 或核准 proxy；poller 到 Type 1 502 或 serial；MQTT Type 1 到 intake 8883；HMI 到 projection 443 或 8883；recorder 到 PG 走 root 側私有 5432。沒有 device 到 ERP 或 DB 的路徑 |
| (c) 形狀 | 站點只出 443，可經事前核准的 explicit proxy。Profile strict 用 mTLS 加雙向物件簽章；Profile inspected（owner 核准 inspection）企業 CA 只進 trunk trust store，只准非敏感資料。雲端永不向站點發起新連線 |
| 信任 | 每 hop 驗 parent 與 child；Type 2 的原始簽章保留到 root，中介不代簽 actual；每次網路 proof 帶雙方 nonce、method、path、body hash、sequence |
| 保留窗 | 每個 window 都明寫 owner、長度、容量、drop 計數：branch 的 result log receipt outbox 完成交接後再留 7 天；telemetry spool branch 4 GiB；watch log 7 天或 64 MiB；文件快取 pin current / LKG / applying |
| Odoo 側的 hub | 連線級的 IT cadence；domain module 只貢獻型別與結果屬性，不各自 cron（C-23 保留）；單一 inbound 路由、單一 queue |
| 直連 | 不是預設後門。只有 HMI 本地投影是明列例外；直寫 store 要先過 G-DIRECT：root node 轉送 CPU 超過 60% 一小時或 receipt p95 超過 2 秒才啟動 PoC |
| 相對今天 | 今天的串接是 Orion 同步 forward 5 秒、IOTA 推到註冊 IP、Odoo 直接被裝置拉內容（C-24）、gateway 單檔 Flask。最終版把這些全部收進同一支 node 的三種角色，方向統一為 child 撥出，Odoo 從裝置可達面消失 |

## 6. 哪些是第一個客戶就要有的

| 角色 | 一屏就要 | 有觸發才加 |
|---|---|---|
| 管理中心 | Odoo UI、root node、trust log、issuer | 多租戶雲端 root node、第三站以上的營運容量複審 |
| device | node agent、display backend、裝置產鑰、7 天 cert、LKG、register 式更新 | sensor / LED / Modbus backend、Type 3 硬體 key |
| 業務資料 | desired、job queue、CMS、結果 archive、archive gate | Workflow 模組（第二個 adapter 需要 saga 才評） |
| 全數據歷史 | 無 | 第一個 history 承諾：獨立 PostgreSQL 加 recorder；超門檻才評替代引擎 |
| 中間串接 | leaf 直連 root node 的 HTTPS 串流、watch API | branch（第一個 Type 1 或本地 HMI）、intake（第一個 MQTT Type 1）、curated export（第一個要 SCADA 的 D-06） |

## 7. 權威在哪：四本帳，不重疊

| 事實 | 唯一耐久 owner | 在交接前誰暫持 | 其他地方的副本是什麼 |
|---|---|---|---|
| 業務意圖：desired、job queue、flight、deadline、CMS 內容與版本、門檻規則 | Odoo PG（加 CMS filestore） | 無；ERP 受理的線性化點是業務與 outbox 同一交易 | branch 與 unit 的 desired 鏡像、LKG 只是快取，有版本可比對 |
| 裝置實況：actual、result log、UNKNOWN、鎖、dedupe 高水位、applied version | leaf 的 SQLite | 無；它就是來源 | ERP 的結果 archive 是收到 receipt 後的業務紀錄（簽章、≥ 3 年）；unit 自己再留 ≥ 90 天 |
| 身分與授權：binding、adopt、revoke、key、policy、分類、封存世代 | trust log（獨立故障域） | registry 本地 pending，只能拒絕或隔離，不能宣稱已交接 | root node 的 registry 是可重建投影；Odoo 的 Fleet 是業務投影，不能反推安全狀態 |
| 量測樣本與事件 | 獨立 history PostgreSQL，自 PG commit receipt 起 | receipt 前：leaf spool（48 小時或 1 GiB）、branch spool（4 GiB）、Type 1 origin journal；來源收到 receipt 才釋放 | roll-up 是衍生表，可由 raw 以 dirty-bucket 重算；Grafana、MES 只讀 |

三條規則讓四本帳不打架：ERP 永不持有樣本（F-03）；history PG 永不持有業務意圖；unit 的 actual 與 result log 不由任何中介代簽。門檻越線這類「從量測算出來的業務事件」在資料 owner 節點計算並持久保存 transition 與 event_id，再以業務事件進 ERP archive，所以它同時出現在兩本帳但 owner 只有一個（算出它的節點）。

還原的不對稱要知道：業務 PG 還原到舊備份會讓 ERP 忘記已受理的意圖，但不會復活已撤銷的裝置，因為撤銷住在trust log。history PG 還原到舊備份時，已發 receipt 的樣本來源可能已釋放 spool，那段就是真的丟了，必須顯示 gap 與 evidence_lost，不能冒稱完整；RPO 24 小時是 O05 待核的基線。
