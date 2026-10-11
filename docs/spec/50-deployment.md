# v1 實作規格 §5：部署

## 5.1 三種形狀的元件清單

| 元件 | (a) 同主機 | (b) 同站 VLAN | (c) 雲端 ERP |
|---|---|---|---|
| Odoo + PG + connector | root VM | 管理 VLAN 主機 | 我們的雲 |
| root node（node、registry、issuer、watch-api、connector-client） | root VM，與 Odoo 同 VM 不同 UID，或獨立 VM | 管理 VLAN 主機 | 我們的雲 |
| trust log | root VM 獨立檔案，獨立備份流 | 同 | 我們的雲（authority profile） |
| recorder + history PG | 第一個感測器出現時啟用，root VM 或獨立 VM | 管理 VLAN 主機 | 我們的雲或站點（依資料落地） |
| branch | 只在有 Type 1 時：獨立 VM/UID，掛專用 NIC 或 VLAN 介面 | IoT VLAN 一台盒子或 VM | 站點盒子（site branch），兼 doc cache |
| leaf（螢幕、感測盒） | 直連 root node:443，或經 branch | IoT VLAN，連 branch:443 | 連 site branch:443，或純屏直連雲端 root node:443 |
| Type 1 | 隔離 switch/AP，只到 branch | 自己的 VLAN，只到 branch | 自己的 VLAN，只到 site branch |
| Grafana | 可選，ops 用 | 可選 | 可選 |

純一屏最小部署 = Odoo + root node（兩個服務）+ 一片 CM4。沒有 branch、沒有 history、沒有 Grafana。

## 5.2 網路規則（default deny）

| 發起方向 | 允許 | 其他 |
|---|---|---|
| leaf → 自己的 parent | TCP 443 | 不直達 ERP、DB、其他 leaf |
| branch → root node | TCP 443，或 (c) 的核准 proxy 埠 | (c) 不開任何 WAN inbound |
| poller → Type 1 | TCP 502 白名單；RTU 本機 serial | 無其他 |
| Type 1 → 任何 | **無**（O02：關在自己 VLAN，只有 branch 能進去讀） | 日後 MQTT intake 才開 8883 到 intake |
| root node → ERP connector | HTTPS，同主機 loopback 或私網 | ERP 不向 root node 發起 |
| recorder、Grafana → history PG | root 側私有 5432 或 socket，各自 role | branch、leaf 無 DB 權 |
| 所有 node → DNS / NTP | 指定來源 53、123 | 不跨 VLAN 轉 mDNS |
| 備份、管理 | 管理網 22/HTTPS | 不新增站點 inbound |

(a) 形狀的 Type 1 隔離：hypervisor 加專用 NIC 或已驗 VLAN 介面給 branch VM；Type 1 接新的隔離 switch 或獨立 SSID；root VM 不掛 Type 1 介面；branch VM 只經受限 vNIC 向 root node:443。沒有搬線權限的站點不接 Type 1。

## 5.3 名稱與時間

| 項目 | 規定 |
|---|---|
| parent 的名稱 | voucher 的 `parents` 內寫 authority id；對應 FQDN 由站內 DNS 或 mDNS 提供；名稱只定位不授權 |
| 建議命名 | `root.<site>.<customer>.example`、`branch-<vlan>.<site>…`；雲端 root node 用我們的 FQDN |
| NTP | 站內核准 NTP；無則 parent_time；(c) 不加公網 NTP |
| 證書 | inspected profile：parent 的 server cert 可為公開 CA 或企業 CA；strict：環境中繼 CA |

## 5.4 W0 資源預算（PoC 通過線）

| 範圍 | 配置 | 上限 |
|---|---|---|
| CM4 全盒 | 2 GiB RAM、32 GiB、四核 | steady RSS ≤ 1536 MiB；node ≤ 128 MiB；idle CPU ≤ 20% 單核；播放平均 ≤ 200%；無 OOM、無 swap thrash |
| CM4 磁碟 | 32 GiB | OS 與 player ≤ 12 GiB；releases 兩版 ≤ 2 GiB；媒體 current、LKG、candidate ≤ 6 GiB；state 預留 1 GiB；log ≤ 256 MiB；可用 ≥ 8 GiB |
| 開機 | 斷電復電 | 解封到 LKG 畫面 ≤ 120 s |
| root 側 | 既有主機 4 vCPU / 8 GiB | 新增 root node、issuer、resolver、helper 合計 ≤ 512 MiB，更新尖峰 ≤ 1 GiB；既有 ERP p95 劣化 ≤ 10% |

不達標先改實作或換有明列成本的硬體；MUST NOT 以拿掉簽章、驗章、LKG 達標。

## 5.5 第一客戶 BOM（硬體）

| 項目 | 數量 | 備註 |
|---|---|---|
| CM4 加載板（現有 7A-BOX 或替代） | 每屏一片 | N-20 的 3.3 V 與 5.3 V 問題仍在，感測器掛載需確認 |
| 感測器（SFA40 類） | 依需求 | 掛在螢幕盒或獨立感測盒 |
| ERP 主機 | 既有 | (a)(b) 用客戶既有主機 |
| branch 盒與隔離 switch/AP | 有 Type 1 時 | O02 標準作業 |
| 救援 kit | 每站一套 | USB/SD 映像加離線 artifact |
