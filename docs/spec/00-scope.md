# v1 實作規格 §0：範圍與姿態

> 2026-10-11。這份規格是 `docs/architecture-review/50-synthesis/final.md` 經 owner 十項裁決與 `v1-posture.md`「剛剛好」姿態過濾後的可實作版本。詞彙依 `03-brief.md` §9：root node / branch / leaf / function；Type 1 / 2 / 3；intake / projection；trust log；recorder；watch API；connector；job queue / result log。規格內以 **MUST / SHOULD / MAY** 標示強制程度。

## 0.1 第一個客戶長什麼樣

| 項目 | v1 範圍 |
|---|---|
| 功能 | D-01 螢幕（CM4 加 display backend）；D-02 環境感測（掛在螢幕盒或獨立感測盒）；D-03 Modbus 儀表為可選，出現時啟用 branch 的 poller |
| 數量 | 幾片到幾十片螢幕；幾個到幾十個感測器；單站 |
| 部署形狀 | (a) 同主機、(b) 同站 VLAN、(c) 雲端 ERP 加站點 outbound，三種都 MUST 能跑 |
| ERP | Odoo 加 connector 模組；ERP 持 desired、job queue、CMS、結果 archive |
| 歷史 | 一屏無 history；第一個感測器出現時啟用獨立 PostgreSQL 與 recorder |
| MQTT | 不在 v1。第一個需要 broker 語意的 Type 1 或 SCADA 需求出現時依 `final.md` §6 加 intake |
| HMI projection | 不在 v1 |
| D-04 LED | backend 介面與 job 語意在 v1 契約內；LED 控制器重寫為 keyed backend 後接入 |
| D-05、D-06 | 不在 v1 |

## 0.2 姿態（來自 owner 裁決）

1. 機制全做：簽章、trust log 分離、UNKNOWN 不重跑、archive gate、retention window、救援映像、Type 1 隔離。
2. 承諾做小：無 SLA、無值班、單一保管人加密封備用材料、上線前演練一次。
3. 硬體不加：每屏一片 CM4；trust log 在 root node 主機；branch 與隔離 switch 只在有 Type 1 時出現。
4. 純本地 MUST 成立：(a)(b) 可完全不連外。
5. 預設按 inspected 設計：trunk 當成會被看光的線，**線上零可重用秘密**；mTLS 為 strict profile 的可選加固。

## 0.3 不在 v1 的，但契約為它們留位置

| 日後項目 | 契約預留 |
|---|---|
| MQTT intake 與 projection | branch 的 validator 介面與 stand-in 已定義；intake 只是另一個來源 |
| D-05 事件型 append | slot class `event/` 保留但 v1 不啟用；啟用時 wire minor 升版 |
| D-06 HMI projection | watch API 的唯讀 scope 已定義 |
| MCU constrained leaf | 批次模式、宣告式 window、parent 授時已在契約 |
| 多人解封 | trust log 解封材料為 k-of-n，v1 設 1-of-2 |
| 雲端 trust authority | trust log 位置是 profile |
| 第二個生產 binding | 契約與 binding 分層；v1 只有 HTTPS |

## 0.4 檔案

| 檔 | 內容 |
|---|---|
| `10-contract.md` | 傳輸、四個動詞、信封、事實鍵、slot、版本協商、錯誤詞彙、retention 預設 |
| `20-identity.md` | 金鑰、voucher、bootstrap、adopt、續期、撤銷、trust log schema、fleet 見證、profile |
| `30-roles.md` | leaf / branch / root node 的 process 切分、backend IPC、SQLite 與 PG schema、connector 路由 |
| `40-update.md` | register 式更新、A/B 目錄、helper、tryboot、救援 kit |
| `50-deployment.md` | 三種形狀的元件清單、網路規則、DNS 與 NTP、W0 預算、第一客戶 BOM |
| `60-conformance.md` | conformance case 清單、e2e 情境、PoC 與通過條件、CI 形狀 |
