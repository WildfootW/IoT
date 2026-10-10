# 提案 P0：PCIe 樹 + pull（2026-10-10 第一版，審查的攻擊目標）

> 這是 owner 與 Claude 在 2026-10-10 討論出的第一版重構方向。它是這次對抗式審查的「現任者」。審查者應把它當成被告，不是結論。

## 1. 核心主張

PCIe 把三件事綁在一條線上：實體接線、位址路由、信任邊界。網路把這三件事拆開了。所以：**保留 PCIe 的管理模型，丟掉 PCIe 的傳輸模型**。

保留的部分：

| PCIe | 我們 | 對應需求 |
|---|---|---|
| Root complex → switch → endpoint 的樹 | ERP → bridge（south）→ unit | F-16, F-17 |
| Bus:Device.Function | 路徑 : 單元 : 功能 | F-20, F-25 |
| BDF 是枚舉時指派的，DSN capability 才是永久序號 | 路徑 id 在 adopt 時指派、re-plug 會變；序號與憑證才是身分 | F-19, F-14 |
| Config space 先讀完才有資料流：class code、vendor/device id、capability list | 功能類別 → 綁管理模組；backend 實作 → 可換；device 回報 capability | F-06, F-26, F-31, F-32, F-39, F-61 |
| Switch 的 upstream port 自己也有 Type 1 config space | bridge 對上是 endpoint，有自己的身分與憑證 | F-24 |
| PCIe-to-PCI bridge 幫 legacy 裝置翻譯 | bridge 替 T1 裝置建立代表、講 Modbus | F-22 |
| ACS / IOMMU 圍堵 DMA | bridge 圍堵 hostile child：只到 parent、schema 檢查、限速 | F-18, M-04, F-01 |
| MSI：裝置主動往上送的中斷 | 業務事件：門檻越線、job 完成、狀態改變。ERP 只收中斷 | F-03, F-30 |
| DMA 到 host memory | 量測資料走到 data store，不經 ERP rows | F-03, F-08 |
| Completion status：SC / UR / CA / CRS / timeout | 成功 / 裝置拒絕 / 錯誤 / 還沒好請再來 / unknown→timeout | F-50, F-53, F-54 |
| FLR per function | 每個功能可單獨 reset、unbind | 管理表 |

被網路打破、換掉的部分：

1. **Root 主動枚舉** → child 撥出連線就是 link training，連上之後權威方向仍朝下。撥號方向和命令方向是兩回事。
2. **Posted write** → register（desired/actual，done = actual.version == desired.version）與 NVMe 式 SQ/CQ（job 依 key 執行一次、結果寫進裝置自己的耐久 CQ 再往上推，漏掉就重讀 CQ）。消掉 B-01、B-03、B-05、B-06、B-07、B-08、B-14。
3. **單一位址空間** → 所有下行只走 child 自己開出來的連線（long-poll 或 server-sent event 是實作細節）。F-21、F-41、C-12 結構上成立。
4. **時序** → 命令不帶時序（F-44）。
5. **信任來源** → 每一跳 mTLS、bridge 終結 TLS 再以自己身分重新發起、每個 VLAN 一個 bridge。T3 加端到端簽章。
6. **沒有持久性** → 每個節點有自己的小狀態庫（SQLite），備份 = 複製檔案（N-09）。

**哪些 channel 走樹、哪些直連**：預設全部走樹，直連只當日後最佳化（需先 PoC，見 02）。理由：M-04 圍堵、M-02 單一程式路徑、N-11 在 bridge 快取文件、規模很小。消掉 C-24。

## 2. 元件（要維護的「種類」）

| 東西 | 角色 | 取代掉 |
|---|---|---|
| `node`，一支自己的程式，同一份 code 三種角色：unit 上的 agent、每個 VLAN 或站點的 bridge、ERP 旁邊的 bridge 0 | 樹的每一個節點；本地 SQLite 持有自己的事實 | 現有 gateway、compose 套件的 south、IOTA、Orion |
| function backend，獨立 process，只綁 localhost，透過本地協定接到同機的 node | 顯示、LED、感測、Modbus 輪詢 | 感測服務、LED 控制器 保留但不再暴露網路 |
| ERP + 模組 | root complex 兼 OS：bus driver 的 UI、每個功能類別的 class driver、業務 app、CMS | 不變 |
| PostgreSQL（ERP 已有的叢集） | 歷史資料用 partitioned table，可選 | CrateDB、QuantumLeap、Mongo ×2 |
| Grafana（可選，只給 ops） | 畫線 | 不變 |

## 3. 節點協定：四個動詞，每一跳都一樣（含 bridge 0 ↔ ERP）

- **announce**：連上後送出 config space：單元序號、功能清單、每個功能的 class、schema、capability。bridge 送的是自己加上整個子樹的合成 config space，所以 root 看到 bridge 下面新增一個 T1 代表，跟看到一個 T2 自己 hot-plug 進來是同一個事件。
- **report**：actual registers、批次量測、心跳，同一個信封。bridge 把子樹 presence 彙總成一筆往上送。
- **fetch**：long-poll 拉 desired registers 和 SQ entries。parent 掛了就繼續用手上最後一份。
- **complete**：寫 CQ entry 往上推。

傳輸：child 撥出的 HTTPS mTLS，每一跳終結 TLS。不用 MQTT（理由：多一種要維護的東西）。

## 4. 身分與圍堵

出廠燒 bootstrap 憑證（factory CA 簽）。unit 連上 parent 後是「present, unadopted」，Fleet 看得到但不綁。管理中心按 Manage → 營運憑證沿樹發下去，短效且在心跳時續期。revoke = 拒絕續期 + 一則簽過名的 revoke 訊息，讓裝置分辨 rejected 與 unknown。每個環境一張中繼 CA（N-04）。

邊緣：node 是唯一持有網路憑證的 process，backend 全在 localhost（修 B-10），感測器崩潰只死一個 backend（F-07）。

## 5. §9 的回答（第一版）

| 問題 | 答案 |
|---|---|
| NGSI 留不留 | 不留。FIWARE 替我們做的三件事（通用 entity model、裝置 ingress + provisioning API、通知扇出）在 node 裡各是幾百行；C-01～C-15 一起消失 |
| 註冊與憑證發行者 | 一個：bridge 0 執行發行，ERP 是按鈕，factory CA 是根 |
| 裝置 channel | child 撥出的 HTTPS mTLS，每一跳終結 TLS |
| 命令狀態住哪 | desired 與 SQ 在 ERP，沿樹鏡像；actual 與 CQ 在裝置，沿樹往上複製。dedupe 在裝置，single-flight 與 deadline 在 ERP |
| 時序資料庫 | 同一個 Postgres 叢集的獨立 database，bridge 0 當 writer，roll-up 用 node 的排程跑純 SQL，retention = drop partition |
| 告警 | 門檻規則當 register 推下去，在持有資料的節點計算，以事件往上送 ERP。Grafana 只畫線 |
| 最小部署 | Odoo + bridge 0 + 一片螢幕。兩個服務 |
| Anthias 走了之後 | reconcile 留在 unit 的 display backend，文件沿樹拉；backend 可換，class 不變 |
| Cloud ERP | bridge 0 在站點，向雲端 ERP 撥出 |
| T1 代表誰建 | 操作員在 bridge 宣告協定與位址，bridge 建立並 announce |
| Control-Semantic | 樹只做管理面（身分、存活、設定）；控制通道是另一個 fabric，先不建 |
| 無人閉環 | 保留為規則：中斷永不自動寫 register；Workflow 模組只能提案 |

## 6. 第二輪已拍板的事（2026-10-10）

1. **ERP ↔ bridge 0 也統一成 pull-down / push-up。** integration hub 的 outbound transport 退場，換成「bridge 0 來讀 queue」的路由；F-69 的 single write gate 變成 single queue。
2. **node 的語言：Python 或 Rust，先 PoC 再決定。** 交叉編譯的 node 骨架跑在 CM4 上做 mTLS、SQLite、long-poll，量 binary 大小、RAM、CI 時間；toolchain 一週內不能變無聊就用 Python。協定規格與 conformance test 語言中立。
3. **直寫 store 的後門：可接受，但先 PoC。** PoC 要證明：token 由樹核發且有 scope；沿樹 revoke 時 token 失效；store 有認證；樹斷線時 bridge 緩衝；兩條路徑寫出的 rows 逐筆相同。
4. **Grafana 留著但只給 ops，年度升版。**
