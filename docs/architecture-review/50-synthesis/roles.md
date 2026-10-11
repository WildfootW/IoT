# 五個角色現在長怎樣：管理中心、device、業務資料、全數據歷史、中間串接

> 2026-10-11，主審依 `final.md` §2、§3、§4、§5、§7、§8、§9 整理。每個角色寫四件事：它由什麼跑、它持有什麼事實、它和誰講話、相對今天改了什麼。

## 0. 一張圖

```
                 ┌──────────────── 管理中心 ────────────────┐
                 │  Odoo UI（Fleet / Manage / CMS）          │
                 │  bridge 0：registry 投影、issuer、consumer API │
                 │  安全 journal（獨立故障域工作站）           │
                 └───────┬──────────────────────┬────────────┘
   業務資料               │ B0 讀 ERP queue /      │ consumer API（list + watch）
   Odoo PG：desired、SQ、  │ 推業務 inbound          │
   CMS、結果 archive       │                        ▼
                          │               全數據歷史：獨立 PostgreSQL（north writer）
                          │                        ▲ 樣本（等 PG commit receipt）
          ───── 中間串接：child 發起的 HTTPS 串流 ─────
                          │
                 ┌────────┴────────┐
                 │ south bridge    │  poller（Modbus）/ raw feed（MQTT T1）/ validator
                 │                 │  T1 representative / 文件快取 / 本地 HMI 投影
                 └────────┬────────┘
                          │ HTTPS（unit 撥出）
                 ┌────────┴────────┐
                 │ device（unit）  │  node agent + 分 process 的 backend
                 │                 │  SQLite：actual、CQ、inbox、UNKNOWN、dedupe、LKG
                 └─────────────────┘
   T1（封閉韌體）只到 south 的 poller 或 raw feed，永不直達 B0、ERP、DB。
```

一屏的最小部署沒有 south bridge：unit 直接以 bridge 0 為 parent。第一個 T1 或本地 HMI 出現才加 south。

## 1. 管理中心

| 面向 | 現在的設計 |
|---|---|
| 由什麼跑 | 三件東西合起來：Odoo 的管理 UI（Fleet、Manage、CMS）；bridge 0（node 的 root 角色，north 側）；安全 journal 工作站（獨立故障域，不在同一個 hypervisor 的另一個 VM） |
| 持有什麼 | Odoo：binding 的業務投影、Manage 的意圖。bridge 0：registry 投影（binding、config、route、path、incarnation）、憑證發行的執行（營運 cert 7 天、半期續期）、consumer API、history writer。安全 journal：每次 adopt、revoke、key、policy、binding、分類、封存世代的完整決策與 digest，是安全狀態的唯一權威 |
| 誰可以寫 | binding 與 config 只有 registry 寫；安全決策只進 journal；ERP 不是第二個 binding writer |
| Manage 流程 | ERP 記 pending 意圖 → registry 把決策交接進安全 journal、拿到 checkpoint → ERP 才建 managed 投影。斷線時只能顯示「待完成撤權」，不能謊稱全域已交接 |
| 撤銷 | 目標 60 秒內阻止新工作；操作 lease 最長 300 秒；離線裝置最多吃完撤銷前已發的剩餘期限 |
| 相對今天 | 今天的 registry 是 Orion 加 IoT Agent 的 Mongo，管理 UI 在 Odoo，兩者之間靨提供 provisioning 腳本同步。最終版拿掉 Orion、IOTA、Mongo，registry 併進 bridge 0，並新增一本不會被業務備份回捲的安全 journal。這是唯一真正新增的「東西」 |

## 2. Device

| 面向 | 現在的設計 |
|---|---|
| 由什麼跑 | 一支 node（agent 角色）加分 process 的 function backend：display（對 Anthias 的 reconcile）、LED、sensor、Modbus poller。各 backend 獨立 UID、只綰 localhost、有界 IPC。另有獨立的 update helper。node 是唯一持網路憑證的 process |
| 持有什麼 | SQLite 裡：actual（每個 function 的實況）、CQ（job 結果，未獲 ERP receipt 前無 TTL，已交接後至少 90 天）、inbox / admission、UNKNOWN 與鎖、dedupe 高水位、LKG desired、本地 id map、文件與媒體快取（current / LKG / applying）、telemetry spool（48 小時或 1 GiB） |
| 身分 | 裝置自己產鑰；出廠預置 enrolment 根、recovery 根、環境 voucher；bootstrap 只能 announce；adopt 後拿 7 天營運 cert；過期 30 日內走 recovery route |
| 做什麼 | announce config space（serial、功能、class、schema、capability）→ 拉 desired 與 SQ → 每 function 一個 reconciler → 先寫 CQ 再上報 → report actual、心跳、量測批次。一個 unit 可以同時是 endpoint 與 bridge（F-25） |
| 離線 | parent 不可達時沿用 LKG desired 繼續播、繼續採樣進 spool；不開新命令；操作 lease 到期後不接受新設定與敏感文件 |
| 更新 | desired.software 是簽章 manifest；沿 parent 預取完整 bytes、驗 hash、進 staged、helper 原子切換 current / candidate 目錄、健康確認後回 committed。不是 rootfs A/B；改到共用依賴算 OS 更新，走維護窗加現場救援 kit |
| T1 怎麼算 | T1 自己不是 device 角色，它只到 south 的 poller 或 raw feed；由 south 建立 representative 代述，標低信任等級 |
| 相對今天 | 今天 gateway、LED 控制器、感測服務各自綰 0.0.0.0 無認證（B-10），provisioning 走 admin port，命令推到註冊時的 IP（C-12）。最終版全部改成 unit 撥出、localhost backend、裝置產鑰、register 與 CQ |

## 3. 業務資料

| 面向 | 現在的設計 |
|---|---|
| 住哪 | Odoo 的 PostgreSQL 加 CMS filestore |
| 持有什麼 | desired：playlist、profile、show、binding 意圖、門檻規則。SQ：job、flight、start deadline、single-flight、衝突資源集合。CMS 內容與版本。結果與業務事件 archive：完整簽章至少 3 年，未決與 UNKNOWN 無 TTL。F-67 的 inbound replay 2 天 |
| 收什麼 | 只收業務資訊：binding 狀態、online / offline、命令終態（成功、拒絕、延期、UNKNOWN、timeout）、門檻越線事件、applied version。每筆量測永不成為 ERP row（F-03、F-30） |
| 怎麼進出 | 出：bridge 0 讀 ERP 的 queue（pull，統一方向）。入：bridge 0 推業務 inbound 到 hub 的單一路由，先驗 service identity 與 scope 再寫，回真實狀態碼。ERP 受理的線性化點是業務與 SQ outbox 同一交易，交易外才搬運（C-20） |
| 完成判定 | 版本由 ERP 給；done 等於重讀到 actual.version == desired.version，或同 key 的 CQ 終態。ERP 的結果、去重、cursor、receipt outbox 同交易提交後，bridge 0 才簽最終收據 |
| 封存 | archive 是每次派送的 gate：每次 fetch、retry、鏡像補送都要換單用 attempt ticket；STOPPING → ARCHIVED，在途最多 32 秒 |
| 相對今天 | 今天的命令 attribute 讀回空字串、`_info` last-writer-wins、dispatch 任何例外標 error、7 天刪 row（B-01、C-06、C-07）。最終版把 desired、SQ、結果 archive 全部明確定為 ERP 持有且耐久，business ordering 回到 ERP |

## 4. 全數據歷史資料

| 面向 | 現在的設計 |
|---|---|
| 住哪 | 一屏無 history。第一個 history 承諾起，用我方 ops 管理的獨立 PostgreSQL 實例：與 ERP 同引擎，但分 WAL、資源、備份窗口，不放客戶管的 ERP 叢集 |
| 誰寫 | north 的 writer process（bridge 0 旁，獨立 UID，唯一持 history role）。south parser 沒有 DB key |
| 怎麼寫 | 窄表按月分區；sample_id 綰 unit、incarnation、sequence、attribute，同 ID 異值隔離；型別、單位、schema revision 不可變；去重、樣本、dirty 標記同一交易，commit 後才向來源發 PG receipt，unit 收到 receipt 才釋放 spool |
| Roll-up | dirty-bucket 增量重算，保存 sum、count、min、max，不平均平均值；合法遲到樣本只要在 3 年 horizon 內就重算 |
| 保留 | raw 至少 3 個曆年；hourly 5 年；分區回收等 dirty 清完再 DROP PARTITION，記 rows 與 bytes |
| 時間 | 近源 sample_time 與 received_at 分列；帶 boot_id、sample_seq、clock_quality、不確定度；暖機、故障、無效時間排除於平均與告警 |
| 事件 | D-05 類事件型資料另有 source event journal：未交接的已接受事件無 TTL，初始 512 MiB |
| 誰讀 | Grafana 只給 ops（歷史、門檻線、系統健康）；MES、HMI、客戶系統各有獨立身分與 line / function / field scope 的 SQL view 或 role，不借 site credential |
| 告警 | 門檻規則由 ERP 寫成 desired，最近資料 owner 節點算遲滯並持久保存 transition，ERP 通知值班者。不在 Grafana 做業務規則 |
| 擴容 | 預估超 10 億樣本、儲存超可用六成、查詢 p95 超 2 秒或恢復超 8 小時，才啟動替代引擎評估（VictoriaMetrics 候選），不自動切 |
| 相對今天 | 今天是 QuantumLeap（已死）寫 CrateDB（線已結束），first type seen 永久、不能 DROP column（C-15、C-16）。最終版換成自己的 writer 寫平白 Postgres，schema revision 進表，Timescale 的 TSL 功能一律不用 |

## 5. 中間串接

| 面向 | 現在的設計 |
|---|---|
| 樹 | unit → south bridge → bridge 0 → ERP。每條管理 hop 都由 child 發起 HTTPS；bridge 0 也主動讀 ERP queue。先驗兩層 intermediate bridge |
| 傳輸 | NDJSON stream 加有限批次，同一個狀態機。心跳 20 秒、watchdog 70 秒、long-poll hold ≤ 20 秒、每 child ≤ 2 連線、批次 ≤ 256 筆或 256 KiB、jitter backoff 1 到 60 秒、遵守 Retry-After、ETag / 304 只省流量 |
| watch | consumer 先讀 scope 對應的 schema 與快照，再從固定水位 watch 增量；游標缺口回 410 加重新快照；每 120 秒批次清冊對帳補漏 |
| south bridge 的工作 | Modbus poller（白名單 502 或本機 serial）；每個 MQTT T1 來源一個隔離的 raw feed 實例（publish-only、不持久、資源上限）；validator 做來源歸屬、schema、單位、品質、速率、時間檢查；T1 representative 與 announce；文件快取與 LKG；本地 HMI 投影（HTTPS view 或 curated MQTT export，n 實例）。HMI 永不讀 raw |
| 網路 | default deny。T2 只到自己的 parent:443；south 到 bridge 0:443 或核准 proxy；poller 到 T1 502 或 serial；MQTT T1 到 raw feed 8883；HMI 到 local view 443 或 8883；writer 到 PG 走 north 私有 5432。沒有 device 到 ERP 或 DB 的路徑 |
| (c) 形狀 | 站點只出 443，可經事前核准的 explicit proxy。Profile M 用 mTLS 加雙向物件簽章；Profile I（owner 核准 inspection）企業 CA 只進 trunk trust store，只准非敏感資料。雲端永不向站點發起新連線 |
| 信任 | 每 hop 驗 parent 與 child；T2 的原始簽章保留到 root，中介不代簽 actual；每次網路 proof 帶雙方 nonce、method、path、body hash、sequence |
| 保留窗 | 每個 window 都明寫 owner、長度、容量、drop 計數：bridge 的 CQ receipt outbox 完成交接後再留 7 天；telemetry spool bridge 4 GiB；watch log 7 天或 64 MiB；文件快取 pin current / LKG / applying |
| Odoo 側的 hub | 連線級的 IT cadence；domain module 只貢獻型別與結果屬性，不各自 cron（C-23 保留）；單一 inbound 路由、單一 queue |
| 直連 | 不是預設後門。只有 HMI 本地投影是明列例外；直寫 store 要先過 G-DIRECT：bridge 0 轉送 CPU 超過 60% 一小時或 receipt p95 超過 2 秒才啟動 PoC |
| 相對今天 | 今天的串接是 Orion 同步 forward 5 秒、IOTA 推到註冊 IP、Odoo 直接被裝置拉內容（C-24）、gateway 單檔 Flask。最終版把這些全部收進同一支 node 的三種角色，方向統一為 child 撥出，Odoo 從裝置可達面消失 |

## 6. 哪些是第一個客戶就要有的

| 角色 | 一屏就要 | 有觸發才加 |
|---|---|---|
| 管理中心 | Odoo UI、bridge 0、安全 journal、issuer | 多租戶雲端 hub、第三站以上的營運容量複審 |
| device | node agent、display backend、裝置產鑰、7 天 cert、LKG、register 式更新 | sensor / LED / Modbus backend、T3 硬體 key |
| 業務資料 | desired、SQ、CMS、結果 archive、archive gate | Workflow 模組（第二個 adapter 需要 saga 才評） |
| 全數據歷史 | 無 | 第一個 history 承諾：獨立 PostgreSQL 加 writer；超門檻才評替代引擎 |
| 中間串接 | unit 直連 bridge 0 的 HTTPS 串流、consumer API | south bridge（第一個 T1 或本地 HMI）、raw feed（第一個 MQTT T1）、curated export（第一個要 SCADA 的 D-06） |
