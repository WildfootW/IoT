結論先講：P3 答辯前 37.50、答辯後 54.50 分。修訂已把「薄 agent」改成有 owner、恢復契約及更新責任的完整設計，值得保留為候選；但不能把拒絕不合格站點算成服務了全部錨點，也不能把驗收門檻算成驗收成果。兩項原致命 finding 都有設計處置，尚無一項取得解除上線阻塞的證據。

日期：2026-10-11。角色：獨立 P3 Score judge。strongest/xhigh 是請求；只知 host default，effort 無可見性，不宣稱已套用。依 [../../03-brief.md](../../03-brief.md) §3、[../../RESUME.md](../../RESUME.md) A.3 及 [../../90-resume/wave-b-proposal.js](../../90-resume/wave-b-proposal.js) Score 裁決；已完整讀指定底稿、LOG/interim、P3、五份批評及 [rebuttal.md](rebuttal.md)，未讀其他提案評分。

第三方事實僅引用 2026-10-10 本地 facts 快照的實際列號，未重新上網。摘要、推定年份與未查證項不升格為一手證據。下列分數、計數口徑與人週是評審判斷；所有故障注入、互通與部署驗收均未執行。

## 1. 前後評分

答辯前評 [原案](../../20-proposals/P3-nats-leaf.md#L1)，答辯後採納答辯 §3 至 §7 的全部修訂，不加入想像中成功的 PoC。各加權值為分數乘權重再除以 10。

| 準則 | 權重 | 答辯前 | 答辯後 | 前加權 | 後加權 | 理由 |
|---|---|---|---|---|---|---|
| R1 | 20 | 4 | 5 | 8.00 | 10.00 | 原案 §3.1、§6；scenarios-02、scenarios-06、scenarios-07。答辯 §3、§5 補 live board、reader config、時間品質；C-25 隔離改造仍無具體交付路徑，限制為 5。 |
| R2 | 15 | 3 | 6 | 4.50 | 9.00 | security-01、security-02、security-04、security-05、security-06、security-10；答辯 §3 的信任錨、語意代理、租約、秘密分流及隔離有實質修補，callout/撤銷/resolver 門檻仍未驗證。 |
| R3 | 15 | 4 | 7 | 6.00 | 10.50 | correctness-01、correctness-02、correctness-03、correctness-04、correctness-08、correctness-10；答辯 §4 補 ERP outbox、backend 證據、業務收據、防重及還原 fencing，非 JetStream ack 保證完成。 |
| R4 | 20 | 3 | 5 | 6.00 | 10.00 | longevity-01、longevity-02、longevity-03、longevity-04、longevity-05、longevity-09；原案 §2、§9 少算，答辯 §6、§7 補 OTA/BOM/混版，但完整時鐘、授權及接班成本仍須下列重算。 |
| R5 | 15 | 5 | 6 | 7.50 | 9.00 | ecosystem-01、ecosystem-02、ecosystem-03、ecosystem-04、ecosystem-06；原案 §5、§6 的現成 HMI 承諾過廣，答辯 §5 的正常化投影、能力矩陣及替換入口可用，標準 profile 不預支互通分。 |
| R6 | 5 | 4 | 3 | 2.00 | 1.50 | scenarios-08、longevity-07；答辯 §3、§6 新增 issuer/updater 隔離與 HTTPS 職責，一屏仍付 NATS 固定成本，無歷史庫不等於無 PG、player 或狀態備份。 |
| R7 | 5 | 4 | 6 | 2.00 | 3.00 | longevity-08；原案 §9 的薄 API 包裝不足，答辯 §4、§5、§6 改用業務 ID、owner journal 及公開 consumer 契約；12 至 18 人週退出預留仍需身分與客戶遷移演練。 |
| R8 | 5 | 3 | 3 | 1.50 | 1.50 | 原案 §9 與答辯 §7；19 人週不含可靠升級與恢復，27 至 38 人週較可信但非快速首客；一屏估工另列，不因誠實補帳扣分，也不因估價較完整加速度分。 |

加權總分（答辯前）：37.50/100
加權總分（答辯後）：54.50/100

## 2. 錨點與致命狀態

R1 封頂不是「沒有 PoC 所以任何設計都只能五分」。真正未服務的是 C-25 已知的無 client isolation 現場：答辯 §3 要求 AP/交換器隔離，否則不交付，卻未定義現場不能啟用隔離時由誰提供哪些改造、停機與費用。准入限制能避免不安全上線，不能替代錨點的交付方案。

| 情境 | 答辯後設計判定 | 殘餘邊界 |
|---|---|---|
| D-01 | 指定版 manifest、assets 就緒、actual 與 ERP live JSON 投影均有路徑 | backend_confirmed 不是已觀測實際畫面；scenarios-01、scenarios-02 |
| D-02 | 獨立 sensor、no data、PG 歷史及耐久越線 EVT | 有效時間與容量尚待驗收；scenarios-03、scenarios-07 |
| D-03 | commissioning 身分、register-map revision、signed 壓差 | 換表人工確認及現場接線仍有成本；scenarios-04 |
| D-04 | intent、按 key 的 job、show 成員聚合、standalone | 無 backend 執行證據的工作只能 unknown；correctness-02、scenarios-05 |
| D-05 | config_rev、身分、存活與硬體簽事件在範圍內 | 不要求本次交付鎖控制；管理/硬體 adapter 尚未實作；scenarios-06、security-11 |
| D-06 | 本地 JSON HMI、業務與分析分流，不繞 WAN | 現場延遲上限與具名 HMI 未定；完整 Sparkplug 另付成本；ecosystem-04、ecosystem-05 |
| (a)/(b) | 同機及跨 VLAN 皆有角色、埠與 outbound 路徑 | 同 VLAN lateral 圍堵不能只靠 bridge；答辯 §3 |
| (c) | leaf WSS 與文件 HTTPS 同為 site outbound | CONNECT/inspection profile、443 路由工件未驗；不計未建的第二 trunk binding；答辯 §3、§6 |
| 規模/一屏/小團隊 | 歷史可選、引擎重用、控制不進遙測通道 | 三年歷史容量及整機資源須按樣本率驗收，不能用下載檔大小推 RAM |

不把「所有 proxy 都必須放行」另加成錨點，也不因 CONNECT 尚未查證就判 WSS 必敗。[N4](../../10-facts/nats.md#L24)只支持候選連線方式；[T7](../../10-facts/transport-through-networks.md#L45)說明 Upgrade/idle 的要求。若已承諾客戶的 profile 拒絕 Upgrade，現修訂沒有受理路徑，須改設計或取得明確範圍決定。

R2 加分限於答辯明文禁止帶洞上線的設計：製造預置根、上下行綁身分簽章、T1 parser 不持樹鑰匙、raw 配額、每客戶 hub 隔離，以及 staging 無有效部署 grant，均直接回應原 finding。在線 60 秒、離線 5 分鐘是設計目標，不是立即撤銷的證明；允許 inspection 也沒有提供對 proxy 的機密性。

致命狀態：security-01 與 longevity-01，設計處置 2 項、驗收解除 0 項；在准入約束內未保留可無條件放行的致命分支，但原上線阻塞仍在。callout/expiry/kick、N-03 記憶體秘密交付任一不可行，就停止採用，不可用永久憑證或寬鬆 mapping 偷渡。這個停止條件限制 R2 風險，卻不解除 R1 的情境缺口。

## 3. 正確性裁決

P0 此點成立：業務 owner 與 transport ack 必須分開。P3 此點也成立：[N6](../../10-facts/nats.md#L26)的獨立 domain 與持久複製、[N7](../../10-facts/nats.md#L27)的 KV/CAS 是有用零件；但其一致性範圍及 [N8](../../10-facts/nats.md#L28)的有限去重窗口不能提交 ERP 與實體副作用。

答辯後真正值得加分的是四個提交邊界：ERP 先同交易留 outbox；unit 先耐久收件；backend 結果形成 CQ/outbox；ERP/PG 提交後才發業務收據。timeout 不釋放衝突 flight，遲到結果追加，unknown 不冒稱未執行。這符合 F-46/F-47 的精神，不要求不存在的任意物理 exactly-once。

7 日 job、8 日 SQ、至少 16 日 tombstone、90 日結果與 cursor、7 日量測緩衝已有設計數字；滿額拒新工作與可見 gap 比靜默淘汰強。仍須以實際 deadline、備份年齡、boot grant 及時鐘偏差驗證防重界線。fresh epoch 不能復活遺失的執行證據，SSD 不能消除離線單媒體毀損；schema grant、sample_id/roll-up 同交易、舊文件 pin 亦未有測試結果。因此給七分設計分，不是宣告 B 類問題已在產品消失。

## 4. 獨立種類與時鐘帳

下表是我依原案 §2、答辯 §6 重列的生命週期責任下限，不採其 28/31 跨分類總和。借用 IT 服務仍有相容與支援責任；分 OS user 不自動增加 repo；同引擎多實例不增加種類，但增加升級與備份工作。未知依賴保留槽位，不假裝已有完整交付 SBOM。

| 計數軸 | 一屏基線 | 標準站：Modbus、sensor、Grafana | 獨立列管口徑 |
|---|---|---|---|
| 儲存/訊息引擎 | 3 | 3 | PostgreSQL、SQLite、NATS；多個 raw/leaf 或 history DB 不重算引擎 |
| 自維語言下限 | 2 | 2 | Python、SQL；自寫 live board/HMI JavaScript 時另加 1，是否需要未查證；不把預建 server 的 Go 算自維語言 |
| 常駐應用家族下限 | 6 | 7 | Odoo、PG、node、NATS、player、browser；標準站加 Grafana；不是 OS process 實測數 |
| 自有 repo 類別下限 | 5 | 5 | node、ERP 模組、部署、e2e、Parts；既有 backend 若未整併要另加，不視為已完成合併 |
| 外部時鐘責任下限 | 21 | 24 | C01 至 C21；標準站另加 C22 至 C24，含建置/既有基礎設施，不是 21 個新產品 |
| 最小部署角色 | 至少 10 | 依 VLAN/功能增加 | north 六角色加螢幕四角色，沿用答辯明列範圍；browser/基礎設施內部 process 另核 |

| 時鐘 ID／外部項目 | 基線計數 | 標準增量 | 授權、支援與實際更新責任 |
|---|---|---|---|
| C01 nats-server | 1 | 0 | Apache-2.0：[N18](../../10-facts/nats.md#L38)；約 5 至 7 月 minor 是快照推估 [N20](../../10-facts/nats.md#L40)，normally two series 並保留僅修最新權利 [N21](../../10-facts/nats.md#L41)；不是固定十二月保固，開源 LTS 未查到。 |
| C02 nats-py | 1 | 0 | Apache-2.0：[N18](../../10-facts/nats.md#L38)；候選線與拆包並存 [N22](../../10-facts/nats.md#L42)，未證實必須雙 Python 或舊線已停修；每版 client/server/API 組合另驗。 |
| C03 PostgreSQL | 1 | 0 | 交付版授權原檔未查證；PG18 至 2030-11-14 是 [F-11 摘要](../../10-facts/postgres-timeseries.md#L39)；須核主版遷移、SQL 與 ERP 相容，不外推十年免升級。 |
| C04 SQLite | 1 | 0 | 交付版授權/版本未查證；writer、WAL、備份及磁碟 flush 由 release owner 驗收。 |
| C05 Odoo | 1 | 0 | edition、模組授權及支援期限未查證；每版重新驗 outbox、權限、模組安裝與 restore。 |
| C06 Python | 1 | 0 | 實際系統版、授權、EOL 未查證；只計一條部署 runtime，失配則整機升級或退出。 |
| C07 Linux distro/kernel；C08 systemd；C09 TLS provider | 3 | 0 | 三項各有時鐘，授權/交付版/支援期均未查證；同映像不能省去 kernel、服務啟停與 TLS 相容驗收。 |
| C10 cryptography；C11 aiohttp；C12 SQL driver | 3 | 0 | 各一 library 時鐘；前二為答辯候選，PG driver 尚未選定；全部授權/支援未查證，不以 ERP 已有 driver 免除 node writer 的依賴盤點。 |
| C13 Anthias；C14 browser/renderer | 2 | 0 | 兩者不能合成一個永不升級的 player；具體封裝、授權、支援期限未查證；驗指定版本換頁與資源限制。 |
| C15 bootloader；C16 板端 firmware | 2 | 0 | 分開列更新/斷電恢復責任；版本、授權與支援期限未查證。 |
| C17 DNS；C18 NTP | 2 | 0 | 借 IT 或自供都要具名 owner；實作、授權/合約及支援期限未查證；零時間不算可用時間服務。 |
| C19 container tooling；C20 CI runner；C21 hypervisor | 3 | 0 | Compose/e2e 與 C-25 的既有宿主納入維護面；不強制多裝 production daemon。產品、授權/合約與支援未查證；主機共同故障域仍在。 |
| C22 pymodbus；C23 sensor/I2C driver；C24 Grafana | 0 | 3 | 啟用功能才列增量；自有 backend 不等於零外部 driver。授權、固定版本與支援均未查證，Grafana 含 plugins 另核；不能套 NATS 授權替整組背書。 |
| 合計 | 21 | 3 | 標準站 24；runtime 家族與引擎欄不再相加成產品數。 |

| 條件式增量／排除 | 時鐘與授權處置 | 維護成本如何計 |
|---|---|---|
| (c) 反向代理/LB、雲端營運 | 每採一個家族 +1；授權/合約/期限未查證 | 同一 443 上的 WSS 與 /objects 須有路由工件；若分 endpoint/IP 則寫明，不默認已有免費反代；每客戶 VM 不增加軟體種類。 |
| JSON HMI 的 Paho、外部 HMI | Paho +1；若採第三方 HMI 再 +1；授權/支援未查證 | 另有 capability/firmware/client 驗收；若自寫 HMI，計自有 UI/語言責任。 |
| MQTT 5/完整 Sparkplug | Mosquitto +1、protobuf runtime +1、另用 codec/reference library 再 +1 | 替換 NATS raw/n，不疊入口；leaf 仍在，故 NATS 時鐘不能刪。Mosquitto 雙授權見 [broker 1](../../10-facts/mqtt-brokers.md#L22)，tag/commit 快照見 [broker 2](../../10-facts/mqtt-brokers.md#L23)，不等於 LTS；codec/runtime 授權/支援未查證。 |
| D-05 硬體 key/SAM/SE 介面 | 硬體 firmware/SDK 各按實際 BOM 另加，授權與支援未查證 | attestation、boot 與 provisioning 不靠 NKey 名稱免除驗收；不計本次未建控制 fabric。 |
| 自有制度與供應鏈 | registry/PKI、租約、語意同步、OTA、ACL、schema、consumer、SQL、部署/測試各有 owner | 每版固定來源與 BOM/NOTICE，備份涵蓋 ERP/PG、root registry、unit/T1 journals、文件與投影；秘密獨立。壓縮/crypto 等傳遞依賴須在 SBOM 展開，未查證部分不能宣告 M-05 通過。 |
| 明確不採 | nsc、natscli、第二 Python、Mender、第二生產 trunk binding、預先建立的 Workflow | 不強加這些時鐘；若為滿足門檻而引入，重新計價與審查。 |

R4 的改善來自可執行方向明確的簽署 bundle、獨立 updater、混版矩陣、停寫備份及 recovery epoch，而非清單變長。每台失聯 bridge 的版本盤點、安全底線、回滾後不覆寫新資料，仍需兩名能互相接班的負責人。維護者組織分布在 [N19](../../10-facts/nats.md#L39) 未查清，治理爭議是二手資料，不能直接判上游失去 bus factor。

## 5. 生態、成本與偏見覆核

我不採 [../../50-synthesis/interim.md](../../50-synthesis/interim.md) §1 第 8 點的品牌式淘汰。它把沒有升級通道的舊設計當基底，現已有 OTA 修訂；[N17](../../10-facts/nats.md#L37) 同時記載漏洞與修補，不能把 advisory 數量當現版未修漏洞數。[N11](../../10-facts/nats.md#L31) 是當時維護者傾向，不能擴成永久政策；但目前不能預支 MQTT 5 支援。

真正所得是本地扇出、late joiner 投影與可重用耐久零件，不是「第 N 個消費者只加 ACL」。[N10](../../10-facts/nats.md#L30) 的 QoS 0 限制只針對 NATS 發布至 MQTT 訂閱者；[MQ19](../../10-facts/mqtt-semantics.md#L66)、[MQ20](../../10-facts/mqtt-semantics.md#L67) 顯示 Sparkplug 還有 STATE/Will 與生命週期。答辯將 JSON HMI、MQTT 5、完整 Sparkplug 分開並允許替換入口，較誠實也較可用；純 Modbus 與一屏站仍享不到大半生態收益。

成本採同範圍比較：三屏五感測器的 (b) 首客，答辯 27 至 38 加外審 2 至 3，共 29 至 41 人週，是可信的初始預留而非報價；(c) 另 3 至 5、D-05 管理另 3 至 5、JSON HMI 另 2 至 3、完整 Sparkplug 另 6 至 10，重疊工作不可機械相加。一屏裁切產品工作後，我估 18 至 26 人週、外審另計，不能省信任與更新本金；一至兩人並不代表相同日曆週數。

共同維運先預留每年 6 至 10 人週：兩次混版升級 2 至 3、季度還原/輪替 1 至 2、安全與 OS 修補 2 至 3、交接及授權盤點 1 至 2；每雲端客戶另 0.5 至 1，事故另計。這是我的容量預算，答辯的共同 2 至 4 尚不足以覆蓋全部責任，且 7 日修補目標不能靠一句 SLA 實現。退出 12 至 18 人週亦另含客戶協調，不把 Apache-2.0 當零遷移成本。

## 6. 必修三項

1. **MF1 情境與信任聯合准入**：關閉 C-25 隔離改造缺口，交付三形狀部署/443 路由及成本；以具名版本驗假 parent、錯環境、橫向拒絕、callout/expiry/kick、60 秒/5 分鐘撤銷與秘密不落 conf/log。依 security-01、security-02、security-04、security-10、答辯 §3；失敗不得弱化安全或偷偷排除既定站點。
2. **MF2 端到端恢復證據**：逐一驗 ERP commit、unit effect/CQ、PG commit/ack、離線及舊備份中斷；斷言同 key 不盲重做、unknown 不解鎖、版本結果可補讀、16/90 日邊界與量測 gap 可見。依 correctness-01、correctness-02、correctness-03、correctness-04、correctness-08、correctness-10；測量文件/HMI 的實際出口，不以容器互通代替。
3. **MF3 可維護的首站版本**：定稿完整授權/支援 BOM、單一 OS/client 組合與雙人交接，完成 outbound OTA、混版 ACL、斷電回滾、隔離還原及 SSD/整機資源驗收；按具名 T1/HMI 完成能力矩陣並核定首客/年度人週。依 longevity-01、longevity-03、longevity-04、longevity-05、longevity-06、ecosystem-01、ecosystem-04；任一關鍵依賴無可修補線即停止新售。

## 7. 值得借走三項

1. **S1 本地資料島**：保留 outbound leaf、站內扇出與持久投影，把 WAN 故障留在資料同步邊界；原案 §3.1、§5、[N6](../../10-facts/nats.md#L26)。
2. **S2 owner 與傳輸分離**：業務版本不借 KV revision，unit/T1 journal 留結果，業務收據與 recovery epoch 完成對帳；原案 §4.1、答辯 §4。
3. **S3 可替換的受限入口**：raw/parser/issuer 分權，按設備能力換 MQTT 入口，公開正常化投影，不讓 consumer 綁死 JS API；答辯 §3、§5、§6。

一句話裁決：P3 值得保留為有條件候選，但在既定情境、聯合身分門檻與首站恢復證據閉合前，不採為可交付基底。