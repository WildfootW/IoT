結論先講：P6 值得保留的是按實際產品分期，不是延後身分、命令證據與更新責任；答辯把不可省的成本搬回首日，架構評分由 34.00 升至 56.00，但尚未覆蓋全部錨點，不能據此批准生產交付。

日期：2026-10-11。僅獨立評 P6，未參照他案分數；指定底稿、LOG/interim、原案、五份批評、完整答辯及八份事實檔均已讀。依 [Score](../../90-resume/wave-b-proposal.js#L1)、[A.3](../../RESUME.md#L1) 與[簡報](../../03-brief.md#L1)評分。要求 strongest/xhigh，實際沿用 host，無模型選擇或 effort 控制，未委派。

下文「原」指[原案](../../20-proposals/P6-minimalism.md#L1)，「答」指[答辯](rebuttal.md#L1)；finding ID 分屬[安全](security.md#L1)、[維護](longevity.md#L1)、[正確性](correctness.md#L1)、[情境](scenarios.md#L1)、[生態](ecosystem.md#L1)。評級與估工是評審意見；第三方引文沿用事實檔 2026-10-10 查核及原文/摘要限制，本次未連網複驗。

## 評分

| 準則 | 權重 | 答辯前 | 答辯後 | 前加權 | 後加權 | 理由 |
|---|---|---|---|---|---|---|
| R1 | 20 | 3 | 5 | 6.00 | 10.00 | scenarios-02、scenarios-03、scenarios-08、scenarios-09：答 §2.1 補端點、雙 hub 與本地 HMI；§2.2 仍拒絕無 bypass 的 (c)，D-05 管理契約仍待補，依規則封頂 5。 |
| R2 | 15 | 2 | 6 | 3.00 | 9.00 | security-01、security-02、security-05、security-06：答 §2.2 已定義離線驗權、收件前驗簽與分權，不只是安排測試；二十四小時撤銷窗口及信任復原限制仍在。 |
| R3 | 15 | 3 | 7 | 4.50 | 10.50 | correctness-01、correctness-03、correctness-05、correctness-07：答 §2.3 補 inbox/CQ commit、保鎖與重讀，修半成品收斂；不可查外部副作用只能 unknown，並非物理 exactly-once。 |
| R4 | 20 | 3 | 5 | 6.00 | 10.00 | longevity-01、longevity-03、longevity-05、longevity-07、longevity-08：答 §2.4/§3 補更新、復原與時鐘責任；獨立重算首屏至少 24 種，授權、映像支援及 bus factor 仍未閉合。 |
| R5 | 15 | 4 | 6 | 6.00 | 9.00 | ecosystem-01、ecosystem-02、ecosystem-04、ecosystem-06：答 §2.5 保留真 broker 的站內收益，補 scope/品質/快路徑；具名 T1、HMI 與 Sparkplug 互通仍無證據。 |
| R6 | 5 | 7 | 5 | 3.50 | 2.50 | scenarios-10、longevity-07：原 §2/答 §3 的完整首屏至少六至七個執行角色；免 history/broker 成立，H0、金鑰與救援維運不能算零。 |
| R7 | 5 | 4 | 6 | 2.00 | 3.00 | longevity-04、longevity-06、longevity-09：答 §2.4/§2.5 的更新回退、版本契約及單入口改善替換；player 候選未定、dynsec 遷移與資料搬移並非只換設定。 |
| R8 | 5 | 6 | 4 | 3.00 | 2.00 | ecosystem-09；原 §9.1 較快產生窄範圍價值，但九人週低估可售要求；答 §5 的 15～23 仍低估未定 OS 救援及三形狀驗收，獨立估 19～29。 |

加權總分（答辯前）：34.00/100
加權總分（答辯後）：56.00/100

## 情境與語意

此點成立：首片 D-01 可不裝歷史庫與 broker，重用 CMS、版本文件與 display 介面有真價值；但 F-15 不能豁免已承諾三年歷史的 D-02/D-03。修訂路徑已能描述 Apply 經 H0 到畫面、actual 回 ERP，以及感測資料經 writer 到圖表；D-03 另付 RTU 接線與儀表映射，D-04 補逐目標結果及模式交接，不能算螢幕功能自然附送。

在 (a) 同主機與 (b) 跨區，H0 固定入口、T1 隔離與北側 writer 比原案具體；(c) 首個 T1 所需 H0/Hs 兩級亦不再誤稱日後擴展。不過沒有 bypass 的 inspection 站點仍無首版路徑，拒售是安全決策，不是滿足錨點；D-05 的硬體證明到 adopt、設定與 attestation 仍是待補契約清單，排除鎖控制不等於可以排除管理面。因此 R1 上限與測試尚未執行是兩個不同理由。

security-01 原因是 hub 沒有驗權材料卻先寫資料；答 §2.2 改為 H0 簽發公鑰綁定授權，hub 驗 scope、期限、原始簽章後才耐久接管，結構缺陷已有解法。雙向簽章、獨立 recovery anchor、管理與 CMS 分權也不是口頭承諾。惟離線撤銷最多二十四小時、T2 私鑰可複製，須明列接受者；簽章不能令 proxy 看不到內容。[T5](../../10-facts/transport-through-networks.md#L38)只支持 TLS 終結後的信任轉移，不替 bypass 或保密退路背書。

R3 的加分落在交接順序：SQ 不因 fetch 消失，inbox 先於 backend，CQ 先於結果上送，ERP commit 才確認；已確認結果仍可對帳。timeout 不釋放資源鎖、未解副作用不被第 501 筆淘汰，終態證據至少一百二十日，遙測另配額。LED 已變更而 CQ 未落盤時，只能保留 unknown；無持久 key、狀態查詢或 fencing 的類別禁用，誠實但仍縮減 D-04。LKG、schema 版本及遲到 bucket 修訂值得加分，整卡毀損的證據損失則未消失。

## 獨立盤點

依原 §2 與答 §3 逐項計數，不採用其總數：兩引擎 PG/SQLite、一主要語言 Python、四執行家族 Odoo/node/nginx/Anthias、五 repo（node、ERP 模組、部署、e2e、Parts）。另有十二個未重複時鐘：Python、OS、CM4 韌體、OpenSSL、crypto 庫、aiohttp、browser、Docker、Compose、systemd、DNS、時間服務。首屏合計至少 24；原 Stage 0 沒有新增 crypto 庫及 aiohttp，同口徑至少 22，絕非十種。Python 語言與發行時鐘分列，不把 OS 支援視為同一承諾。

歷史、Modbus 與 Grafana 齊用再加 SQL、DB driver、pymodbus、Grafana，至少 28；MQTT 加 broker/client 至少 30；Sparkplug 再加一、T3 至少再加 CA 工具與硬體 SDK 兩項。SQL 是要維護的查詢/排程語言，不因既有 PG 而免計。未定套件是占位，完整映像相依仍可能增加；同 node 的多 process、兩個 broker 實例不重複算種類，但各自隔離、配額、備份照算。

首屏外部產品時鐘至少十七個：上述十二個，加兩引擎與 Odoo/nginx/Anthias 三家族；自有 node 另負責簽章契約、更新器與復原知識。移出 Odoo 公開入口減少耦合，並未消除業務 adapter 的升版與小團隊接班成本。季度盤點、支援到期前六個月遷移可採，但沒有固定版本證據不能稱已排妥十年。

授權僅能採 [Mosquitto 原文紀錄](../../10-facts/mqtt-brokers.md#L22)及 [PG 紀錄](../../10-facts/postgres-timeseries.md#L99)支持的選擇；不從寬鬆授權推導交付映像零義務。Odoo、Anthias/browser、Grafana、crypto 與其餘固定 BOM 的實際散布條件、支援期仍未查證。Mosquitto [版本紀錄](../../10-facts/mqtt-brokers.md#L23)有活動亦有作者集中，不能把未出 tag 當死亡，也不能省季檢。

## 生態與成本

MQTT 買到多讀者扇出、晚加入者快取與現成工具入口；[MQ9](../../10-facts/mqtt-semantics.md#L36)與 [dynsec](../../10-facts/mqtt-brokers.md#L28)給出具體零件，不替我們做品質、授權範圍或命令完成。答 §2.5 的本地 Hs 快路徑、raw/n 分隔及來源 stale 契約有價值；一秒 p99、三秒 age 是待簽認且未測的 gate。vendor topic/profile、每個 consumer 權限、Sparkplug BIRTH/重同步都另有成本，不能把 retained topic 稱為相容認證。

首屏原有主機三角色與裝置三角色，修訂增加 H0 共至少七個，另有基礎服務；H0 可同機，不強制新增硬體，RAM 與啟動時間未測。D-06 若三十屬性一 Hz，三年約 28.38 億筆，依自訂門檻首裝即獨立 PG，不能只加 broker；[W2](../../10-facts/postgres-timeseries.md#L90)是估算，不是容量測試。

獨立估工：H0/安全 4～6、顯示搬遷 4～6、OTA/復原 5～8、工件/相容驗收 4～6、審查整改配合 2～3，首屏 19～29 人週。比答 §5 提高的是尚未定案的 OS 救援及跨形狀演練，沒有逐條相加重複 finding。加 D-02 與歷史約再 4～7，T1 再 3～5；jobs、HMI、T3 分開報價。外審費、硬體與 IT 等待另計，人週不是日曆交期，也不能和原九人週的缺口版本直接宣稱省錢。

可逆性有條件改善：同 PG 搬實例估 2～4 人週，含回填、核對與切換；換 broker 估 2～4 加型號聯測，不能以 acl_file 相容證明 dynsec 可攜。player 先留 3～4 人週探索，未選候選就無可靠交付上限；移除 Odoo 業務 owner 仍按原 §9.2 的八人週以上看待，非已有驗證的報價。

## 必修三項

1. 閉合信任與部署：固定驗簽/nonce/撤銷復原契約，證明離線假 report 零持久寫入、越域拒絕、staging 無生產信任；補無 bypass 路徑，或由 owner 明確變更錨點，不能用拒售冒充滿足（security-01、security-06）。
2. 閉合必備功能：D-04 每種 job 提供可重建效果或安全隔離的證據，測交接 crash、保鎖與保存窗；D-05 完成硬體管理契約，D-06 完成斷 WAN 的具名 HMI/profile 驗收（correctness-03、scenarios-08、ecosystem-02）。
3. 閉合可維護交付：固定映像與授權 BOM，跑 updater 自更新、OS 回退、舊備份還原及每個首用形狀，指定支援與接班責任，再確認工時（longevity-03、longevity-05、scenarios-10）。

## 可借三項

1. 把能力觸發與首用 gate 綁在一起：不用歷史、broker 或第二傳輸就不部署，但安全與可恢復性不分期（答 §2.1、§4）。
2. 保留 proven CMS 與 display 介面，刪掉裝置直達 ERP 的第二入口；用薄 H0 承接信任與協定，不先建任意深樹（答 §2.1、§2.2）。
3. 將未知副作用永久列為可追蹤事實；保存證據、保留鎖、滿載拒新工作，不用 timeout 或 CQ 缺席推論沒做過（答 §2.3）。

## 阻擋與裁決

原致命 security-01：設計成因已處置，生產關閉證據仍欠缺。無 bypass 的 (c) 仍是架構阻擋，D-05 管理契約仍未完成。安全外審、三形狀 e2e、斷電/CQ/滿載、時鐘/補傳、OTA/還原、T1/HMI 互通與足跡 gate 全部未執行；法律及供應鏈缺證仍未查證。這些不得用本文的分數或文件格式驗證替代。

一句話裁決：可借 P6 的分期與修訂語意繼續設計，但在必備路徑與交付證據補齊前，不採為完整最終方案，也不批准上線。