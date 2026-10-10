# P6 答辯：縮小交付面，不縮小責任

結論先講：**接受 47 條、部分接受 8 條、反駁 0 條，共 55 條；原始嚴重度為致命 1、重大 46、次要 8。** 原案不能以「之後加 hub」宣稱身分與 correctness 已成立；security-01 在實作驗收以前仍是致命阻擋。

修訂一：Stage 0 增加薄 north 入口 H0，提前建立可撤銷身分、雙向簽章、內容驗證及隔離；不再維護裝置直達 Odoo 的第二套入口。
修訂二：先交付可恢復的 desired/actual；job 啟用前完成耐久收件、結果對帳與外部副作用的 unknown 契約。
修訂三：歷史、T1、HMI、T3 各有首用 gate 與預算；保留不預建 broker、通用樹、第二傳輸及播放器替代品的立場。

日期：2026-10-11。依 [Rebuttal 指令](../../90-resume/wave-b-proposal.js#L96) 與 [A.2](../../RESUME.md#L121) 撰寫。實際僅 host inherited model，無 effort 控制，未聲稱 strongest/high 已套用。本次只有文件推演，沒有產品實測或完成任何 PoC。第三方證據沿用事實檔的 2026-10-10 查核紀錄，保留原文、摘要與未查證等級；LOG/interim 與帳本覆核是審查意見，不是產品證據。

## 1. 逐條裁決

下表的 P6 節號均指[原提案](../../20-proposals/P6-minimalism.md#L1)；「原評」連到各 finding 的原始標題。接受表示反例成立並採修訂，不表示修法已測通。部分接受逐列指出保留與拒絕部分；沒有為湊反駁數而否認真缺口。每列工時是該切面的粗估，共用工作重疊，不能相加；去重後交付預算見 §5。「時鐘」包含修補、輪替、相容與演練責任，零新增種類不等於零維護。

| lens | 總數 | 致命 | 重大 | 次要 | 接受 | 部分接受 | 反駁 |
|---|---:|---:|---:|---:|---:|---:|---:|
| security | 12 | 1 | 9 | 2 | 11 | 1 | 0 |
| longevity | 11 | 0 | 7 | 4 | 7 | 4 | 0 |
| correctness | 13 | 0 | 13 | 0 | 13 | 0 | 0 |
| scenarios | 10 | 0 | 10 | 0 | 10 | 0 | 0 |
| ecosystem | 9 | 0 | 7 | 2 | 6 | 3 | 0 |
| 合計 | 55 | 1 | 46 | 8 | 47 | 8 | 0 |

### 1.1 安全

| 原 ID | 原嚴重度 | 裁決 | 理由與引用 | 具體修法 | 種類、人週、時鐘 |
|---|---|---|---|---|---|
| security-01 | 致命 | 接受 | [原評](security.md#L28)：P6 §3.3/§5 先寫 history、後由 Odoo 驗人，離線亦無授權材料，違 F-68/N-05。 | H0 發公鑰綁定授權；Hs 離線驗簽、scope、撤銷水位及期限，任何持久接管前驗完；MES 不借 site 身分，見 §2.2。 | H0 +1 process、同 node 種；crypto +1 library，2～3 人週；每日續權、季審。 |
| security-02 | 重大 | 接受 | [原評](security.md#L42)：P6 §4.4 的 parent pin 不能限制 rogue hub 偽造命令，F-48 不成立。 | 全部 T2 驗端到端 desired/config/結果簽章；root 授權最長 24 小時，過窗停止新變更而續播 LKG。 | +0 種，共用 crypto，1～2 人週；每日 freshness、撤銷演練。 |
| security-03 | 重大 | 接受 | [原評](security.md#L52)：P6 §3.3 無 pin rollover；所舉 ACME 預設仍未查證。 | current/next pin 與獨立 recovery anchor 預置；換鑰先確認收到，失聯者走受控復原，不信被盜舊鑰自授權。 | +0 種，0.5～1 人週；每次換鑰與季演練。 |
| security-04 | 重大 | 接受 | [原評](security.md#L62)：P6 §4.1/§4.2 沒有落實 N-05 的寫入權分離。 | CMS editor、publisher、Fleet admin 分權；parent/信任錨在管理物件，改 parent 雙人核准及審計。 | +0 種，0.5 人週；每版 ACL 回歸。 |
| security-05 | 重大 | 部分接受 | [原評](security.md#L72)：明文 credential 耐久於 desired 確實破 N-03/N-04；但只取一次的修法又依賴送達，拒絕此解法（F-46）。 | 裝置自產私鑰；管理面只保存可重讀的公鑰授權與輪替狀態，私鑰不經 desired、備份或日誌流轉。 | +0 種，共用 crypto，1 人週；每次輪替測丟回應及 staging。 |
| security-06 | 重大 | 接受 | [原評](security.md#L82)：P6 §1 理由 3 的 bearer 優勢不存在；[T5 原文](../../10-facts/transport-through-networks.md#L38)只支持信任轉移。 | 採簽章而非 bearer；首版要求 TLS inspection bypass；無 bypass 且須對 proxy 保密即拒交付，不自動關 pin。 | +0 種，0.5～1 人週入網驗收；每站協調日曆未定。 |
| security-07 | 重大 | 接受 | [原評](security.md#L92)：P6 §3.1 圖的同 VLAN lateral reach 未被 inter-VLAN 規則解掉（C-25/F-18）。 | T1、T2、HMI 分區，T1 port isolation；CM4 deny inbound、player/backend 管理埠只本機，實際埠盤點。 | +0 軟體種，可能增 AP/交換器，1～2 人週；每站及映像更新重驗。 |
| security-08 | 重大 | 接受 | [原評](security.md#L102)：P6 §2.2/§9.1 角色歧義可讓 hostile parser 取得 DB 權限（M-04）。 | poller/parser、Hs validator、north writer 分 process/user/配額；只有 writer 持 history 專用 DB 權限。 | +0 runtime 種、至少 +2 隔離 process，1～2 人週；每版權限測試。 |
| security-09 | 重大 | 接受 | [原評](security.md#L112)：P6 §6 的 pointer 及 Apply 授權不足，B-10/F-48 仍在。 | 相對內容路徑、禁止跨 origin redirect、簽名 manifest/hash；publisher 限站點，跨站 Publish 加核准。 | +0 種，1 人週；每版 SSRF/defacement 回歸。 |
| security-10 | 重大 | 接受 | [原評](security.md#L122)：P6 §3.3/§4.3 混淆 revoked 與 rotated-old，補送會自撤銷。 | 一次性短效配對綁序號/公鑰；revoke 綁 credential epoch，保留 tombstone；舊 epoch 回 stale，clone 序號衝突告警停新下行。 | +0 種，1～2 人週；每次輪替及重播測試。 |
| security-11 | 次要 | 接受 | [原評](security.md#L137)：P6 §3.2/§5 沒有可信 HMI 入口；不能把共享 PSK 當保密。 | 需要兩面時 raw/n 兩實例；HMI 僅可信區 TLS 唯讀 n；1883 僅核准有線隔離 T1，否則拒收。 | 同 broker 種、+1 process，0.5～1 人週；每站 ACL/重啟驗收。 |
| security-12 | 次要 | 接受 | [原評](security.md#L147)：P6 §2.2 的 browser、nginx、解析器修補線未查證。 | 交付 BOM 標 hostile 面、版本與支援證據；外部 link allowlist；未知支援線不得簽安全驗收。 | +0 種，0.5～1 人週；每月弱點分流、每季複查。 |

### 1.2 十年維運

| 原 ID | 原嚴重度 | 裁決 | 理由與引用 | 具體修法 | 種類、人週、時鐘 |
|---|---|---|---|---|---|
| longevity-01 | 重大 | 接受 | [原評](longevity.md#L50)：P6 §4.1/§8.8 留兩種 parent 行為而無退場日，M-01 的帳未結。 | 首版皆經 H0，共用固定 polling 語意；刪除提案中的裝置直達 Odoo 配置，不保留隱藏 fallback。 | 同 node 種、+1 north process，1～2 人週；每版只驗一套 wire。 |
| longevity-02 | 重大 | 部分接受 | [原評](longevity.md#L60)：P6 §8.1 的協定/身分耦合成立；但 F-41/N-05 不要求把業務 job owner 一起搬走。 | H0 掌協定、registry/信任；Odoo 留 desired/SQ 與薄內部 adapter，每次 Odoo 大版前驗契約與還原。 | +0 種，2～3 人週；每次 Odoo 大版另 1～2 人週。 |
| longevity-03 | 重大 | 接受 | [原評](longevity.md#L70)：P6 §9.3 只有 runtime 到期日期，沒有碰到已裝機裝置的方法（N-10）。 | 首裝加入簽章更新、應用槽回退及 OS 雙槽/救援流程，驗 updater 自身更新；未通過不得懸掛交付。 | 同 node 種，3～5 人週；季 rollout、支援終止前六個月遷移。 |
| longevity-04 | 重大 | 部分接受 | [原評](longevity.md#L80)：接受 P6 §2.2/§9.2 缺釘版、退場觸發；拒絕首片螢幕必須先另造 player，F-61 不要求兩個成品。 | 釘完整播放映像並做 reconcile 契約 fixture；支援線不合或六個月無可信維護證據即重選；撤回無候選仍保證兩週替換。 | +0 種，0.5～1 人週；季查；觸發後 3～4 人週探索、交付重估。 |
| longevity-05 | 重大 | 接受 | [原評](longevity.md#L90)：P6 §8.6 沒有 N-09 閉環；[PG §3.3](../../10-facts/postgres-timeseries.md#L111)指出共叢集仍共用備份風險。 | §2.4 分列 DB/filestore、node 狀態、secret escrow，還原先封下行，逐 owner 對帳；不靠重開 bootstrap。 | +0 種，1～2 人週；每日備份、季度及升版前復原演練。 |
| longevity-06 | 重大 | 接受 | [原評](longevity.md#L100)：P6 §7 把 suite 延後，連 v1 契約也無保存（02 §3）。 | 首日 wire schema、錯誤詞彙、舊新版矩陣、黃金向量進既有 e2e；第二生產 binding 仍延後。 | +0 repo 種，1～2 人週；每次 wire 變更。 |
| longevity-07 | 次要 | 部分接受 | [原評](longevity.md#L110)：接受原案 10 種漏算；14 也非完整 BOM，HTTP/crypto/容器等仍須列，不能作精確排名。 | §3 重算分類與外部時鐘，分清 runtime 種、process 數與基礎設施。 | +0 實作種，0.25～0.5 人週盤點；每次 BOM 變更。 |
| longevity-08 | 次要 | 接受 | [原評](longevity.md#L114)：P6 §7「M-05 無妥協」不能與 Grafana 授權未查證並存。 | 撤回零義務結論；Grafana 與交付映像先核授權、修改/散布模式，未過則不提供該圖表配置。 | +0 種，0.5 人週文件，法務另計；每版/合約核查。 |
| longevity-09 | 次要 | 接受 | [原評](longevity.md#L118)：P6 §9.2 用 acl_file 證明 dynsec 可攜性不成立；[broker 第8列](../../10-facts/mqtt-brokers.md#L29)已載退場。 | 留版本化抽象權限清單、只產當前 dynsec；換 broker 另驗，重啟由 owner 回灌有效投影，不複製過期值。 | +0 種，0.5～1 人週；季查維護者、每次換版重驗。 |
| longevity-10 | 重大 | 接受 | [原評](longevity.md#L122)：P6 §3.3 只有 token 輪替，沒有長期 pin/anchor rollover；ACME 預設未查證不作依據。 | 預發 next、確認持久收到才切換；緊急洩漏走獨立 recovery anchor，離線裝置不能無限延長舊信任。 | +0 種，0.5～1 人週，共用安全修法；每次換鑰演練。 |
| longevity-11 | 次要 | 部分接受 | [原評](longevity.md#L132)：P6 §6 的 30 屬性/1 Hz 確實越門檻；不推成任何低頻 D-06 都必須獨立庫。 | 高頻首台即獨立 PG；低量共叢集須備份/SLO owner 同意、低於門檻；PG 大版與 ERP 相容分驗。 | +0 引擎種、條件 +1 DB process，0.5～1 人週；每次 PG 大版。 |

### 1.3 正確性

| 原 ID | 原嚴重度 | 裁決 | 理由與引用 | 具體修法 | 種類、人週、時鐘 |
|---|---|---|---|---|---|
| correctness-01 | 重大 | 接受 | [原評](correctness.md#L9)：P6 §4.1 fetch 丟回應後 delivered 會卡死，F-46 未成立。 | ERP commit SQ 才回受理；取件不證送達，同 key 可重取，裝置 inbox commit 才記收件。 | +0 種，1 人週；每版斷點回歸。 |
| correctness-02 | 重大 | 接受 | [原評](correctness.md#L15)：P6 §4.1 沒有禁止先 POST 後落 CQ，也漏 ERP 還原。 | CQ/outbox 先耐久，ERP commit 才 ack；持續 cursor 對帳，已 ack 仍可重讀，不作每命令 poll。 | +0 種，1 人週；每版 crash/restore fixture。 |
| correctness-03 | 重大 | 接受 | [原評](correctness.md#L21)：backend 改變與 CQ commit 不同交易，key 並非物理 exactly-once（F-47/B-08）。 | §2.3 耐久 executing/unknown 與不可 GC 的副作用紀錄；backend key/查詢可重建者 reconcile，否則禁盲重跑。 | +0 種，每 backend 1～2 人週；每次 backend 變更再驗。 |
| correctness-04 | 重大 | 接受 | [原評](correctness.md#L27)：P6 §4.1 timeout 既未取消執行又釋單飛，queued 亦無 expiry。 | ERP 原子保有 per-device active key；queued/開始前查期限，timeout 不釋鎖；register/job 共用資源次序。 | +0 種，1 人週；每版併發/late-result 測試。 |
| correctness-05 | 重大 | 接受 | [原評](correctness.md#L33)：P6 §4.3 的第 501 筆可刪掉去重證據，drop 總數不足（F-46/F-51）。 | §2.3 限重播窗口、固定 admission；未解 unknown 永留，終態過窗留可見 result_expired，不把缺 CQ 視為未做。 | +0 種，1 人週；持續 oldest-age/capacity 告警。 |
| correctness-06 | 重大 | 接受 | [原評](correctness.md#L39)：P6 §6 只比 applied 不能修錯版 route（B-03/B-04）。 | 文件請求版/manifest/hash 全相符；actual 綁 unit/function/epoch/version/seq，拒舊 snapshot，還原先封寫。 | +0 種，0.5～1 人週；每版錯版/重放測試。 |
| correctness-07 | 重大 | 接受 | [原評](correctness.md#L45)：P6 §4.4 同版跳過會留下 crash 半成品及永久 defer（F-54）。 | 分 seen/applied；重啟查 backend 與 id map，完整資產備齊才切換；error/refused/defer 按版可讀，背景工作不阻塞心跳。 | +0 種，1～2 人週；每版斷電/reconcile 測試。 |
| correctness-08 | 重大 | 接受 | [原評](correctness.md#L51)：P6 §4.2 信任零時間/未來時間會假新鮮（N-14）。 | sample_time/time_quality/boot_id/seq；最近節點蓋時，失準資料隔離，elapsed 用 monotonic，補傳不刷新 liveness。 | +0 種，0.5～1 人週；每映像冷啟及時鐘異常測試。 |
| correctness-09 | 重大 | 接受 | [原評](correctness.md#L57)：P6 §3.3/§5 未規定 schema commit 與舊批次驗證版本（F-31/F-32）。 | schema 耐久採納才 ack；批次帶版本，保留舊 schema，未知 ID/key 拒收；空 capability 禁相關命令。 | +0 種，1 人週；每次型別/單位變更。 |
| correctness-10 | 重大 | 接受 | [原評](correctness.md#L63)：P6 §5 history 與 ERP 無獨立交接水位。 | sample/event 穩定 ID；驗人後 outbox commit 才接管，history/ERP 各自冪等與 cursor，兩端完成才回收。 | +0 種，1～2 人週；每版雙目的地 crash 測試。 |
| correctness-11 | 重大 | 接受 | [原評](correctness.md#L69)：P6 §5 closed bucket 並非已齊資料（F-09）。 | raw commit 同時標 dirty bucket；七日內遲到重算，provisional/final 分開，過窗 gap；完成修訂才刪 raw。 | +0 種，1 人週；每次排程變更及月分區演練。 |
| correctness-12 | 重大 | 接受 | [原評](correctness.md#L75)：P6 §5 latest-only 無法恢復 ERP 離線期間越線事件。 | D-02 宣稱 alert 前，node 依規則版本耐久記 transition/event ID，ERP 冪等接收；不需先建 history。 | +0 種，0.5～1 人週；每版斷 ERP/磁碟滿測試。 |
| correctness-13 | 重大 | 接受 | [原評](correctness.md#L81)：P6 §6 的 broker 存活不等於來源正常；[MQ8](../../10-facts/mqtt-semantics.md#L35)描述連線而非樣本。 | 投影含原時間/quality/epoch/seq；HMI 本地逾時轉 stale/unknown，Will 不覆蓋功能品質。 | +0 種，0.5～1 人週；每種 HMI 停來源測試。 |

### 1.4 情境

| 原 ID | 原嚴重度 | 裁決 | 理由與引用 | 具體修法 | 種類、人週、時鐘 |
|---|---|---|---|---|---|
| scenarios-01 | 重大 | 接受 | [原評](scenarios.md#L81)：P6 §2/§7 的分期不是可售矩陣，C-25 不能等 T1 訂單才處理。 | §2.1 每站核 shape、隔離與觸發，未通 N-01/N-18 禁裝；F-42 的不可信網路前提第一天處理。 | +0 種，0.5 人週；每站簽核，IT 等待另計。 |
| scenarios-02 | 重大 | 接受 | [原評](scenarios.md#L85)：P6 §3.1 的 cloud 443 仍指 Odoo，re-point 至 8443 不符 F-41。 | device FQDN:443 固定反代 H0，內部 H0:8443；Hs 只向 443，writer 私有 DB conduit 另列，DNS 與業務網址分開。 | +0 種，1 人週；每站 DNS/proxy/換址驗收。 |
| scenarios-03 | 重大 | 接受 | [原評](scenarios.md#L89)：P6 §7 延後 relay-of-relay 卻在 (c) 首個 T1 已用 Hc/Hs。 | 明定 Odoo→H0→Hs→unit 兩 hub 上限；1b 首用即測雙 hop、換 parent 與未完 job 對帳，非任意遞迴樹。 | +0 種、+1 Hs process，2 人週；每版雙 hop/遷移矩陣。 |
| scenarios-04 | 重大 | 接受 | [原評](scenarios.md#L93)：P6 §6 文件快取未覆蓋媒體/JSON（F-55/F-63）。 | manifest 列齊資產與 hash、按 child/function 發內容權；本地代理供 player，JSON 不持 node key，WAN 斷顯 stale。 | +0 種，1～2 人週；每種內容/快取滿額測試。 |
| scenarios-05 | 重大 | 接受 | [原評](scenarios.md#L97)：P6 §4.2 冷啟無有效時間源，F-27/N-14 無法驗。 | 每個蓋時節點列指定時間源；443-only 站提供本地校時，無有效時間就隔離資料/停新變更，非改用收件時間。 | +0 種，共用時間底座，1 人週；每站冷啟/零時源演練。 |
| scenarios-06 | 重大 | 接受 | [原評](scenarios.md#L101)：P6 §6 的 map 無法解 RTU passthrough 或無序號改址（F-22）。 | 登記 RS485 實體埠/VM passthrough、baud/parity/address；以負壓、斷線、min/mean/max fixture 驗儀表 profile。 | +0 軟體種、RS485 硬體另列，1～2 人週；每型號/換接線驗收。 |
| scenarios-07 | 重大 | 接受 | [原評](scenarios.md#L105)：P6 §6 的單一 show result 未表達多 function 與 standalone 交接（F-45/F-49）。 | show 編譯成每目標 intent/key；mode owner 明列、每目標結果聚合 partial，不承諾跨盒同步時序。 | +0 種，1～2 人週；每種 LED 能力/模式測試。 |
| scenarios-08 | 重大 | 接受 | [原評](scenarios.md#L109)：P6 §6/§9.2 引 CA 不能替代 T3 管理面。 | D-05 啟用前補硬體證明/adopt/config/attestation/revoke 契約及遷移；事件另有 durable log；鎖控制仍禁用。 | CA/硬體 SDK 至少 +2 時鐘，2～4 人週整合，另 4～6 PKI；每硬體版與外審。 |
| scenarios-09 | 重大 | 接受 | [原評](scenarios.md#L113)：P6 §5 的 120 秒 report 不可作 D-06 本地 HMI 快路徑。 | Stage 2 必有 Hs 投影，即使來源全 T2；本地取樣即送、雲端獨立批次，斷 WAN 不阻本地，按 §2.5 gate。 | +0 node 種、可能 +1 Hs，1～2 人週；每 HMI/站點延遲驗收。 |
| scenarios-10 | 重大 | 接受 | [原評](scenarios.md#L117)：P6 §8.8/§9.1 缺單 hypervisor 啟停與真實健康證據（B-13）。 | 工件固定 project/port/volume/user/配額；驗冷啟、crash、deliberate stop、畫面換頁、writer commit 與離線還原。 | +0 種，1～2 人週；每映像及部署形狀。 |

### 1.5 生態

| 原 ID | 原嚴重度 | 裁決 | 理由與引用 | 具體修法 | 種類、人週、時鐘 |
|---|---|---|---|---|---|
| ecosystem-01 | 重大 | 接受 | [原評](ecosystem.md#L9)：P6 §3.2 的可改 topic/client ID 是未證實前提，dynsec 不改設備能力。 | 採購前實機 profile，vendor topic 綁固定身分；不能安全區分者隔離入口或拒收，禁止匿名 wildcard 補洞。 | 共用 MQTT library 種，1～2 人週框架、每型號 0.5～1；每韌體版。 |
| ecosystem-02 | 重大 | 接受 | [原評](ecosystem.md#L17)：P6 §4.3/§5 聚合延遲在 broker 前發生（D-06）。 | 本地取樣到畫面另訂 p99/age；上傳背壓隔離，ERP/WAN 斷仍達標，不用五秒 MES 看板替代。 | +0 種，1～2 人週，共用 HMI 工作；每站負載驗收。 |
| ecosystem-03 | 重大 | 接受 | [原評](ecosystem.md#L25)：P6 §6 缺功能 stale；[MQ9](../../10-facts/mqtt-semantics.md#L36)並非來源新鮮度協定。 | 每功能有效期與品質投影、HMI 自計時；重啟只回灌仍有效資料，其餘明示 unknown。 | +0 種，0.5～1 人週；每 HMI 映射及重連測試。 |
| ecosystem-04 | 重大 | 部分接受 | [原評](ecosystem.md#L33)：接受 P6 §5 的共用唯讀身分無法限域；拒絕因此首日建齊 SQL/HTTP/MQTT 通用政策平台，當時無此出口。 | 首日定 consumer ID/scope/撤銷契約；每開一出口由同一權限清單落授權並驗跨線拒讀，不共用憑證。 | +0 種，1～2 人週基礎、每 consumer 0.25～0.5；每次 scope 變更。 |
| ecosystem-05 | 重大 | 部分接受 | [原評](ecosystem.md#L41)：接受 P6 §5 的型別宣告不等於外部契約；不需為此預建完整 pub/sub，F-39 不要求通用平台。 | 首個出口前固定 stable ID、單位、聚合窗口與版本 view/topic；snapshot/cursor/410 重取與 tombstone 有規格及 reader fixture。 | +0 種，1～2 人週；每次對外 schema 變更。 |
| ecosystem-06 | 重大 | 接受 | [原評](ecosystem.md#L49)：P6 §6 retained 投影不是 Sparkplug；[MQ19](../../10-facts/mqtt-semantics.md#L66)另定 Rebirth。 | 具名 HMI 要求才加資料 adapter，實作 BIRTH/seq/bdSeq/STATE，只准限速 Rebirth、拒 actuator CMD。 | 至少 +1 codec 時鐘，2～4 人週起；每方言/HMI 版本，Tahu 相容性未查證。 |
| ecosystem-07 | 次要 | 部分接受 | [原評](ecosystem.md#L57)：接受報價逐方言聲明；P6 原未承諾 OPC UA/NGSI，缺原生支援不能推導必須先建（F-34）。 | 報價明列不支援，成交指定模式/版本後另建 connector/唯讀投影；MQTT 不是互通證書。 | 未成交 +0 種；每方言 1～3 人週探索，SDK 時鐘待選，交付重估。 |
| ecosystem-08 | 重大 | 接受 | [原評](ecosystem.md#L65)：P6 §7/§8.5 承認風險但未設報價 gate；[帳本覆核 §3](../../40-mqtt-ledger/ledger-review.md#L69)也不保證 HTTPS 必通。 | 報價附流向、inspection、broker 管理權、授權及資料匯出清單；IT 拒絕必要條件就停，不開不安全替代入口。 | +0 種，0.5～1 人週；客戶協調日曆未知，每站重驗。 |
| ecosystem-09 | 次要 | 接受 | [原評](ecosystem.md#L73)：P6 §9 的排除已明說，但「晚做不更貴」無證據。 | 撤回生命週期較便宜結論；§5 分首次、每型號、每 consumer、每站及持續支援，不重收同一共用開發費。 | +0 種，0.5 人週估算；每張新增功能訂單複核。 |

## 2. 修訂設計差異

### 2.1 原 §1、§2.1、§3.1：最小形狀與分期

P6 此點成立：螢幕沒有歷史需求就不裝 history，沒有 MQTT 設備或既定 HMI 接口就不裝 broker；F-15/N-13 允許如此。撤回的是原 §1「只補 applied/key 就消掉 bugs」及「每步只是改 parent」。H0 是同一 node 的薄驗證入口，不是先蓋任意深度的管理樹；提前它是縮小 Odoo 暴露面與消除雙入口維護的選擇，不是宣稱所有最小系統必須多一台主機。原 §3.3 的公開金鑰管理現在確實是一套小型信任基礎，不再把它叫作沒有 PKI。

| 階段/首用 gate | (a) 同主機 | (b) 跨 VLAN | (c) 雲端、只 outbound | 新增與禁止事項 |
|---|---|---|---|---|
| 0：純 T2 螢幕，含首日安全/復原 | Odoo/PG/nginx/H0；CM4 agent/display/player | 同一 north 基座，T2 僅達 device 入口；host deny 與分區驗收 | 雲端基座；CM4 向 device FQDN:443 | 無 history/broker；job 入口預設禁用，僅驗過的 intent 可用 |
| 1a：首次承諾歷史/圖表 | north writer、history database | writer 留 north，不把 DB 權限放 device 區 | 雲 writer 在 H0 後，公開入口仍 443 | 首筆前 schema/補送/備份完成；Grafana 授權未過不交付圖表 |
| 1b：首個 T1 或 IT 要求站點中介 | 同主機隔離 Hs/poller 與 north writer | 每個 T1 VLAN 的 Hs/poller；T1/T2/管理分區 | Hs 向 H0:443；H0 不是另一份命令 owner | 兩 hub 串接此時即測；更深 relay 拒售，另案估工 |
| 2：MQTT T1 或具名本地 HMI | 按需 raw/n 與本地 Hs | HMI 在可信區讀 n，不進 T1 區 | 即使全 T2 也必有 Hs，HMI 不經 WAN | 僅入口或僅投影一實例；兩面都要才兩實例；Sparkplug 另 gate |
| 3：D-05/T3 首用 | 加 T3 管理整合 | 同左，admin 不向 device 區開放 | outbound 硬體證明與管理物件 | CA 工具、attestation、簽章映像及事件 log；不提供鎖控制 |

三形狀的工件在相應配置可售前必須通過 N-18，不能以第一站未用作豁免。`device_fqdn` 與 ERP public/internal 名稱分離；nginx 的 device listener 只轉 H0:8443，不轉 Odoo UI。H0 以受限內部 HTTPS 路由拉 Odoo queue、推業務結果；Hs 只向 H0 的 443 發起。writer 到 history 的私有 5432、ops 到管理 443、HMI 到 n 的 8883 分開授權；T1 只准被 poller 輪詢 502 或向 raw 發送，RTU 另列實體埠。DNS/時間源僅用核准本地服務，無 IP forwarding。這些是待實作的 conduit，不是現場已隔離的證據。

### 2.2 原 §3.2、§3.3、§4.2：身分與安全

H0 是唯一 registry 與營運公鑰授權發行者，Odoo 是管理 UI，不持發行私鑰；Manage 先由 H0 耐久寫 binding，再投影 ERP，失敗可追蹤重試（F-33）。provisioning 在受控區核序號與裝置自產公鑰，預置 environment ID、管理簽章及獨立 recovery 公鑰；配對碼十五分鐘有效且只用一次。adopt 回覆遺失可憑原私鑰重讀已核准授權，不重新啟用 bootstrap。T2 私鑰仍可被複製，不能冒充 T3 的不可複製身分。

上行簽章綁 env/site/unit/function、credential epoch、boot/seq、body hash；請求另綁方法、路徑、收件者與一次 nonce。hub 能驗公開授權與簽章，不取得 child 私鑰；驗證、scope/schema/配額通過後才寫 inbox/history 或接管 outbox，未知 ID 不自建。relay 保留原始簽章，外層只證明由誰搬運；T1 只由其 Hs 代表，不宣稱簽章能證明儀表讀值真實。過期授權下的資料只留在來源待重驗，不先塞入正式歷史。

每日取得的 root 授權最長二十四小時，續期須查當前撤銷狀態；連線驗證端即時拒絕已知撤銷，離線驗證者最多尚接受二十四小時，這是明列的 N-02/T2 撤銷妥協，不叫全域立即生效。撤銷物件綁特定 epoch，舊輪替身分只回 stale，不能撤掉新身分。裝置在有效時間未知或授權過窗時停止新 config/job/內容切換，仍播已驗證 LKG。重啟不得重置授權倒數；冷啟沒有可驗證的本地時間源就只離線播放，由受控維修校時，不能先略過憑證日期，再拿同一通道的時間自證可信。

下行綁收件 unit/function、env、管理 epoch、版本、期限與內容 hash，parent/config、業務 desired、更新權限分開。私鑰經 OS credential resolver 提供，資料庫、URL、審計不保存可登入明文。staging 缺 prod 私鑰且環境標籤不符即封出站與下行，不能只靠 pepper 推論中和。pin 的 current/next 與 recovery 路徑均須可驗，遭盜主鑰不能單獨核准新根。換 parent 先耐久保存試接與前任設定，新 parent 驗權、對帳完成才 commit；失敗只可回退到仍有有效授權的前任，不可永久信任 rogue parent。首版要求 inspection bypass；簽章不對 proxy 保密，無 bypass 的端到端加密尚未交付，不可沿用 interim 的「簽章即可退路」說法。

### 2.3 原 §4.1～§4.4、§5、§6：命令、證據與保存

P0 此點成立：ERP 持 desired/SQ、裝置持 actual/CQ，完成不從 transport ack 推導。首片 D-01 的 seen 與 applied 分開，文件必須供指定版本或拒絕，manifest 覆蓋媒體與子資源；背景 reconcile 重啟後重讀 backend 與持久 id map，整組可用才切換，LKG 不因新下載失敗被刪。相同 desired 在未 applied、defer 或 crash 後仍須繼續收斂，並回報 error/refused/defer 的版本與理由。live board 的 JSON 另有受限本地代理，失聯顯 stale，不讓 player 取得 node 私鑰或任意取 URL。

所有 job 在 API、UI 與 agent 端同時設 capability gate。啟用前，ERP 原子建立 SQ/active key，fetch 不移除它；agent 先 commit inbox/executing 再呼叫 backend，先 commit CQ/outbox 再送結果，ERP commit 才 ack。平時與重連都以 cursor 對帳，cursor 過期改完整重讀，已 ack 結果不能因 ERP 舊備份而無法查。預設十分鐘 deadline 包含 queued，開始前再次判斷；執行中的 timeout 僅表示觀察超時，不是取消，不能放行同資源的下一個 register/job。

外部副作用與本地交易不能被合併假裝原子。若斷電發生在 LED add 已生效但 CQ 未寫之間，重啟將耐久 executing 轉為 `unknown`，保留 key、payload hash、目標資源、操作階段及最後證據。backend 有持久 key 或可查實際狀態才 reconcile；無此能力時不自動再呼叫。人工可以註記「證據不足」，不能把它改成「未執行」；要解鎖必須取得停止/隔離舊執行者或實際狀態的證據，再由 ERP 記錄處置。無法 fencing 的不可逆 backend 不開該 job 類別，這是功能限制而非換傳輸可修。

| 事實/窗口（取代原 §4.3） | owner、期限、滿載或復原行為 |
|---|---|
| SQ、收件、CQ | ERP/agent 各自耐久；SQ 同 key 可於建立後三十日內重取，但新開始執行不得越過 start deadline；過窗禁止重跑，CQ 查詢依下列保存期，不隨 deadline 消失 |
| 未解副作用 | unknown/executing、資源鎖及 key tombstone 不按年齡或 500 筆淘汰；人工處置仍保留未知性及證據鏈 |
| 終態 CQ/去重 | 自完成及最後合法重播起至少一百二十日；每裝置最多 500 個未回收工作，滿則拒新 job，不刪證據；舊 key 由 epoch/期限拒絕 |
| ERP 工作紀錄 | 三十日移 archive，至少一百二十日可查；active/unknown 永不按此期限清除；過窗以 key/範圍標記證據已過期 |
| agent ring/hub telemetry spool | 七日或各 1 GB，先到即上限；80% 告警，滿載只按已聲明遙測政策淘汰，耐久記 gap 起迄序號/原因 |
| CQ/業務事件配額 | 與 telemetry 分開，至少預留 64 MB；滿載拒工作、告警，不能被 raw 流量擠掉；事件確認前不回收，過負荷的告警能力降級可見 |
| history/ERP 交接 | 驗人後 outbox commit 才接管，sample/event ID 去重，兩目的地各有水位；刪除須兩端完成，不共用模糊 ack |
| actual/心跳 | 120 秒 heartbeat、五分鐘判 offline；變更後立即排 report；全量 snapshot 帶 boot/seq/有效時間，缺值清為 absent，舊批次不刷新存活 |
| schema/series | 宣告 commit 才 ack；穩定 ID 與 schema_version 隨批次，舊版至少覆蓋所有未處理批次；不因改名斷史 |
| raw/roll-up | 36/60 個月；dirty bucket 隨遲到 raw 同交易記錄，允許七日修訂；過窗標 gap，重算完成才 drop raw |
| 文件/稽核 | LKG manifest、資產與 id map 持續 pin；desired audit 九十日不刪當前引用；ERP 業務事件一百八十日 |

D-02 的 alert 在來源依規則版本保存帶 ID 的越線及恢復事件，才能跨 ERP 停機重讀；latest snapshot 只供 Fleet，不把每筆量測寫入 Odoo。sample_time 必在取樣附近蓋，時間失準顯 unknown 並隔離，補送不換收件時間。上述窗口與 byte quota 必須依站點流量做容量驗收；七天是上限設定，不是 1 GB 必然撐七天的承諾。滿載時允許有明示遙測損失，不允許以缺少 CQ 證明副作用未發生。

### 2.4 原 §8.6、§9.1：離線還原與更新

備份不是複製活躍資料檔。工件必須定義一致性 DB/filestore 備份、SQLite 一致快照、已驗 manifest/資產、id map、inbox/CQ、schema、outbox/cursor 與配額紀錄；採用哪個備份 API 尚待固定版本驗證。金鑰 escrow 加密、版本化、與資料備份分開授權。建議 RPO 為中央二十四小時、RTO 八小時，這是待客戶核准的目標；未上傳的 edge 資料只有當地耐久副本，整卡毀損可能超出中央 RPO，不能宣稱零遺失。

還原先封新下行，核對環境、金鑰、撤銷版本與 owner 水位；舊 ERP 的 ack 由 agent CQ 回補，舊 hub 只作鏡像重建。中央 epoch 只有 recovery 權限可提升，先收齊 active/unknown 再放行，不因新 epoch 清掉舊副作用鎖。edge 狀態整份遺失時，中央上次收件到故障間的操作列 unknown，隔離 backend 核實；沒有 registry、撤銷或根金鑰證據就不自動 re-adopt。離線 CM4 可冷啟續播完整 LKG，缺媒體明示降級；重新可達後先校時、驗授權、對帳，再接受新內容。

首裝映像包含簽章 artifact、應用槽切換、健康確認/回退及 OS 雙槽或受控救援路徑，更新器不得只會更換 Python 檔案。更新由管理權授權，不能當 CMS 任意 shell job；升級前保留 schema 相容的回退快照，失敗禁止來回重試副作用。是否能在選定 CM4 映像實現尚未查證，未通過就阻擋無人值守交付。先不引入獨立 OTA server，但也不把這筆工作算成零種類就免費。

### 2.5 原 §5、§6、§9.3：consumer 與 HMI

接受[帳本覆核 §1](../../40-mqtt-ledger/ledger-review.md#L9)、[§3](../../40-mqtt-ledger/ledger-review.md#L69)與[§6](../../40-mqtt-ledger/ledger-review.md#L117)的限制：retained 對晚加入者有收益，成熟 broker 可以省站內連線與扇出工作；不採 MQTT 只減少首期生產配置，並不自動改善正確性或穿網。反過來，也沒有證據要求第一片螢幕先裝 MQTT、Sparkplug 或完整 consumer 平台。首日應固定身分、scope、資料詞彙與內部對帳契約；第一個外部 reader 前才交付其 view/API/topic、cursor 過期重取及撤銷測試。

每個 consumer 有獨立身分、site/line/function/measure scope、有效期與撤銷；SQL role/view、HTTP scope、MQTT ACL 必須由同一核准清單審核，但不要求先建自動產生所有出口的引擎。已有 broker 或具名工具需求也可觸發 unit binding 重評，不能只等 HTTPS 效能壞掉；第二生產 binding 仍須另列遷移矩陣與估工。

D-06 本地取樣、投影與雲端聚合分開排程、配額與背壓。預設提出 sample 到畫面 p99 不超過一秒、來源一 Hz 時 age 超過三秒顯 stale；這是待現場簽認的 gate，不是已量到的能力，不足則調整本地路徑或拒售該 HMI。測試包含斷 WAN/ERP、停止 PLC、晚加入及 broker 重啟。Sparkplug 需要獨立 adapter 與具名 HMI 聯測，只准限速 Rebirth 影響發布，不准致動；其 BIRTH、retain、session 與序號並非自訂 topic 的別名，證據見 [MQ18](../../10-facts/mqtt-semantics.md#L65)、[MQ20](../../10-facts/mqtt-semantics.md#L67)、[MQ21](../../10-facts/mqtt-semantics.md#L68)。

## 3. 原 §2.2 元件表完整重列

下表取代原表，不以「同 code」隱藏 process、金鑰或時鐘。未取得固定交付版本的授權/支援證據者維持未查證；這會阻擋該配置的交付，不以表格當採用批准。主要種類口徑沿原案，SQL/XML 等配置不另算語言；所有階段都維持五個 repo（node、ERP 模組、部署工件、e2e、Parts），新角色不新開 repo。

| 元件 | 自建/外部與角色 | 授權、維護者與時鐘證據 | 取代/保留 | 首用階段 |
|---|---|---|---|---|
| Odoo Community + iot 模組 | 外部+自建；CMS、desired/SQ、Fleet UI、業務事件，無裝置公開入口 | 固定交付版授權/支援期未查證；我們負責每次大版 adapter 回歸 | 留 proven 業務，不留 FIWARE outbound；registry 移 H0 | 0 |
| nginx | 外部；device/admin 分 listener，TLS/pin 與限量反代 | 原案授權、所選版支援線本次未查證；季度核查；T7 的 timeout 原文在[第45行](../../10-facts/transport-through-networks.md#L45)，非穿網保證 | 保留反代，device 只到 H0 | 0 |
| node：agent/H0/Hs/writer | 自建 Python；單 package，不同 user/process；H0 registry/驗證，Hs relay，writer 北向入庫 | 自有；協定、recovery、更新流程由團隊維護，季演練 | 取代 gateway/south/registry/writer；不造通用平台 | 0/1a/1b |
| function backend | 自建；display/sensor/LED/Modbus，各自低權限，沒有 node key 或 DB key | 自有；pymodbus 的固定版授權/維護線未查證，每版 parser/profile 回歸 | 保留可換 reconcile，F-07 隔離 | 0 display；其他首用 |
| SQLite | 外部內嵌；inbox/CQ/LKG/outbox/registry 鏡像 | 所選版授權、耐久與備份 API 未查證；發行/斷電測試列 gate | 取代 edge Mongo 類狀態，不算 daemon | 0 |
| aiohttp | 外部；H0/Hs 的 HTTP，agent HTTPS 路徑共用 wire | 原案版本/授權本次未查證；首日因 H0 提前，不再說零 library 時鐘 | 取代 gateway web stack | 0 |
| PostgreSQL、history SQL、driver | 外部+自建；Odoo DB；writer 另 role，history 可同叢集或獨立 | [PG F-11](../../10-facts/postgres-timeseries.md#L39)的支援日期是摘要；[F-12](../../10-facts/postgres-timeseries.md#L40)/[F-13](../../10-facts/postgres-timeseries.md#L41)為原文。PostgreSQL License 見[§3.2](../../10-facts/postgres-timeseries.md#L99)；新增 DB driver 待選/未查證 | 取代 CrateDB/QuantumLeap；不增第二引擎種類，但可多實例 | 0；history 1a |
| Anthias/player 與 browser | 外部；釘整份播放映像，display wrapper 隔離其 API | 交付映像授權、CM4 支援、browser 修補線未查證；不聲稱不改碼就免散布義務 | 既有播放器保留，替代候選未定 | 0 |
| Grafana | 外部、選配 ops 圖表；獨立 consumer、唯讀限域 | 所選版授權/支援未查證，未過法律/修補 gate 不裝；每季而非只年度檢視 | 保留圖表需求，不混 ERP 每筆量測 | 1a 選配 |
| Mosquitto + MQTT client library | 外部；raw/n 按需一或兩實例，不持樹權限；client 在隔離 adapter | [授權第1列](../../10-facts/mqtt-brokers.md#L22)、[維護第2列](../../10-facts/mqtt-brokers.md#L23)、[dynsec 第7列](../../10-facts/mqtt-brokers.md#L28)；非唯一合格 broker。client 待選、授權/時鐘未查證 | 新增站內入口/投影，不上 trunk；保留聲明義務 | 2 |
| 簽章/credential resolver | 自建流程，採 cryptography/OpenSSL 等既有庫，不自製密碼演算法 | 固定版本、授權、演算法組合未查證；兩個獨立外部時鐘，外部審查必須先做 | 取代 bearer+pepper；不是延至 T3 的安全工作 | 0 |
| OS/Python/CM4 韌體/服務管理 | 外部；boot、TLS、程序隔離及更新救援 | 所選映像各支援線未查證；Python、OS、韌體、systemd 分列，支援終止前六個月遷移 | 不造 OS、browser 或資料庫引擎 | 0 |
| Docker/Compose、DNS/時間服務 | 外部；包裝與現場解析/校時，明列 service owner | 四個待固定版本的外部時鐘；套件授權與支援未查證，客戶既有亦須列 BOM | 同 hypervisor 不等於免維護 | 0 |
| 部署工件 | 自建；三形狀/階段的 firewall、project/volume/啟停/備份與 escrow 流程 | 自有；我們負責每版與每站 N-01/N-18 | 取代舊 compose 套件；不執行本次任何服務變更 | 0 |
| IoT_e2e、IoT_Parts | 自建；wire 向量、混版、復原、硬體 profile 及 provenance | 自有；每次協定/硬體變更，不新增測試 framework | 原有兩 repo 保留 | 0 |
| Sparkplug codec、T3 CA/硬體 SDK | 條件外部+自建 adapter，元件尚未選定 | 至少分別 +1、+2 時鐘；維護/授權未查證；[Tahu MQ26](../../10-facts/mqtt-semantics.md#L63)不是具名 HMI 相容證據 | 無觸發不裝；Mender 也非免費全包退路，[D1](../../10-facts/buy-options.md#L56)、[D2 摘要](../../10-facts/buy-options.md#L57)有限制 | 2 選配/3 |

| 種類口徑 | Stage 0 | 1a+1b 且選 Grafana | 2 再加 MQTT |
|---|---:|---:|---:|
| 引擎：PG/SQLite | 2 | 2 | 2 |
| 主要語言：Python | 1 | 1 | 1 |
| runtime：Odoo/node/nginx/Anthias，後加 Grafana/Mosquitto | 4 | 5 | 6 |
| repo | 5 | 5 | 5 |
| 未重複外部時鐘：Python、OS、韌體、OpenSSL、crypto 庫、aiohttp、browser、Docker、Compose、systemd、DNS、時間服務；後加 DB driver/pymodbus/MQTT client | 12 | 14 | 15 |
| 暫算種類（非 daemon 數） | 24 | 27 | 29 |

首片螢幕的主機側至少 Odoo、H0、nginx、PG 四個執行角色，裝置側 agent、display、player 三個，另有 OS 基礎服務；不能再稱完整部署只有一服務。種類暫算含未選套件占位，不能當實測或跨案排名。Sparkplug/T3 若啟用再加其相依；同種兩 broker 不重算種類，但兩組配額、ACL 與復原工作照算。第一個 D-06 若為三十屬性一 Hz，三年約二十八點四億筆，依[PG §3.1 的估算](../../10-facts/postgres-timeseries.md#L90)立即獨立庫；不是量測到的容量。

## 4. 原 §7 妥協表完整重列

| 需求/原項 | 修訂後妥協或承諾 | 換到什麼 | 代價與觸發 |
|---|---|---|---|
| F-16/F-17 | 支援 Odoo→H0→Hs→unit，任意更深樹未提供 | 不預建合成全子樹/遞迴治理 | 兩 hub 在 1b 首用即付 2 人週；更深需求另估，未驗拒售 |
| M-04/F-18 | 撤回無 T1 即可忽略鄰居；純 T2 可直連 H0，T1 必 Hs+分區 | 不強制純螢幕另買站點主機 | host firewall 與 T1 lateral isolation 首用 gate；隔離做不到即阻擋 |
| C-24 | 不再開 device→Odoo；僅 device→H0 的固定 443 | Odoo 業務路由退離裝置攻擊面 | H0 首日 +1 process；媒體/JSON 代理仍要付費 |
| N-02、T2 撤銷 | TLS+公鑰請求/物件簽章；首版 bypass；離線授權最長 24 小時 | 無需首日部署 X.509 CA 自動化 | 不達全域即時撤銷；超窗停止新變更；不接受此窗口則不能交付該站 |
| F-35 | H0 registry+獨立環境/recovery 信任錨，取代 DB+pepper | 身分不隨 Odoo 遷移重發 | 金鑰 escrow/輪替/外審前付；根遺失仍可能現場復原 |
| F-36 | 配對碼綁序號與裝置自產公鑰，硬體不可複製性留 T3 | 不先做 SAM/SE 製造線 | T2 clone 可疑只能偵測/隔離，RMA 必受控重新配對 |
| F-08/F-09/F-10 line/F-13/F-14 | Stage 0 不供歷史圖表；有承諾即 1a | 保留無 store 最小安裝 | D-02 alert 仍需來源 durable event；資料出口/備份不是日後補 |
| N-15 收斂 | 單一 15 秒 polling+jitter，完成後立即排 report | 無串流/short-poll 兩套生產路徑 | 不保證十五秒完成；下載、reconcile、網路時間另算 |
| F-28 | 可立即重讀 owner snapshot；要求新 device report 仍等下次 poll | 不加 doorbell | UI 顯示時間與等待，不叫裝置已即時刷新；若必要另列功能成本 |
| N-01/N-18 | 撤回 (b) 工件可售後補；每個首用 shape/stage 必先驗 | 分期只限制可售範圍 | 三形狀基礎模板首期投入，T1/HMI 變體啟用前再驗 |
| F-42 的 N | 身分與不可信網路保護不等 N；T3 能力才等產品觸發 | 不以站點數推延安全 | 第三站或首次跨環境營運先重審 provisioning/復原容量；非安全豁免 |
| 02 §3 第2項 consumer | 首日固定授權/資料契約；通用外部 API 不預建 | 少未被使用的出口 | 首個 reader 前完成自己的出口，不再等「第三個」才管 scope |
| 02 §3 第5項外審 | 提前至首個公開/不可信網路交付前 | 不讓 token 缺口帶到客戶 | 1～2 人週內部整改+外審費/排程；變更信任模型再審 |
| 02 §3 第6項 conformance | 首日 wire schema/矩陣/向量進既有測試 | 不另造大型測試平台 | 1～2 人週不能省；第二 binding 仍另 gate |
| P0 §6 Rust PoC | 不做；保留 Python，但要量 CM4 與升級回退 | 不增加第二語言/工具鏈 | 不達足跡或啟動 SLO 才重評，沒有「Python 天生夠用」承諾 |
| M-05/M-06（原稱無妥協） | 撤回所有授權無義務與自有 code 無時鐘說法 | 把查核與維護責任列在交付物上 | 未查證者不能簽採用；2027-01-11 首次季檢，此後每季，EOL 前六個月遷移 |
| F-46/F-47/F-50/F-51 | 不降成靠送達；拒絕無條件物理 exactly-once | 真正能重讀，不能確定就耐久 unknown | 不可查/不可 fencing 的 job 禁用；滿載拒新工作，不抹去副作用證據 |
| F-67～F-72/N-04/N-09 | 保留單一受理/kill switch/真實錯碼；新內部路由須重驗，不以 proven 免測 | Odoo 業務與資料面分離 | archive connection 阻新命令/Manage；staging、備份與環境副本每版驗收 |

## 5. 原 §9.1～§9.3：第一個價值與驗收預算

下面是去重後的粗估，不是已投入工時；範圍為新螢幕路徑、既有功能搬遷與驗收，沒有宣稱重做全 ERP。首片價值必須包括斷電可恢復、可換鑰與可更新，不只成功換一張圖。原九人週及相對 P0 省六至十人週的差額撤回：安全/復原本金前移後，無同範圍測量不能比較。延後部分省的是當期工作與生產配置，不是已知十年總成本。

| 不重複工作包 | 首片 D-01 人週 | 範圍與驗收 |
|---|---:|---|
| H0/agent 信任、簽章、registry、分權與入網 | 4～6 | 未授權零持久寫入、撤銷/輪替/重放、三形狀 device 入口 |
| CMS/desired/display 及 proven 路徑搬遷 | 4～6 | 錯版拒絕、完整資產、LKG、backend crash、applied 可恢復 |
| 更新/備份/還原/救援 | 3～5 | updater 自更新、OS 回退、舊 DB 與 edge 遺失不盲重跑 |
| 工件、wire 相容、e2e/soak/現場驗收 | 3～4 | 停止保持停止、冷啟、proxy、零時源、混版、N-18 |
| 安全/授權審查及整改配合 | 1～2 | 外審費與法務費另計；漏洞修復超額要重估 |
| 首片可售合計 | 15～23 | 不含下列未啟用產品；不是 PoC 完成聲明 |
| D-02 首次即時/alert | +1～2 | schema/quality、來源事件 log、ERP 停機越線 |
| 1a 首次 history | +3～5 | writer/driver、兩 cursor、dirty bucket、圖表/備份 |
| 1b 首次 T1/雙 hub | +3～5 | Hs、parser 隔離、兩 hop、RTU 接線/負壓 fixture |
| D-04 首次 jobs/show | +4～7 | 共用 SQ/CQ/unknown、每目標/模式、逐 backend crash；更多 backend 每種另 1～2 |
| 2 首次普通 MQTT/HMI | +3～5 | client、raw/n、授權/品質/快路徑；Sparkplug 再 +2～4 起 |
| 3 首次 T3 管理面 | +6～10 | PKI 工具+硬體整合，外審/硬體另計；不含控制通道 |

首客若是螢幕、D-02、歷史而無 T1，合計十九至三十人週；有 T1 再三至五。以一至二位工程師計，人週不可直接除以人數當交期；兩人首片初估十二至十八週，安全外審、客戶 IT 與硬體待料尚無排期，不能保證上限。每新型號 profile 約半至一人週、每 consumer 四分之一至半、每站半至一另加 IT 等待。每季至少半至一人週盤點/復原、重大版本每次一至二人週相容驗收，另預留弱點修補，不以「AI 寫 code 便宜」取消維運 owner。

| 首用禁止放行的反例測試 | 成功條件（尚未執行） |
|---|---|
| H0/ERP 離線，偽造 child report、過期授權、越域 consumer | 不寫 history、不擠合法 spool、不洩露資料；合法但過窗來源本地保留並顯示阻擋 |
| fetch/結果回應遺失、雙 fetch、SQ/CQ 各邊界 crash、501 筆滿額 | 逐 key 有 owner 或明示拒絕；unknown 不失鎖、不抹證據、不盲重做 |
| v7 要求回 v8、半途 reconcile、ERP 舊備份、CM4 整卡遺失 | 不假同步；可續播或明示降級；有疑慮的副作用仍耐久 unknown |
| 零/回撥時源、七日補傳、schema 交錯、dirty bucket | 不把補傳當新鮮、不錯型寫入；roll-up 修訂或明示 gap |
| WAN/ERP 斷、PLC 停止、broker 重啟/晚加入、T1 資源耗盡 | 本地 HMI 達已簽門檻且 stale 正確；raw 不耗盡 node/n 配額 |
| 三形狀冷啟、刻意 stop、映像換版、pin/根輪替、staging 還原 | 正確角色啟停、能回退；staging 無真實裝置信任或出站，舊信任不復活 |

## 6. 仍承認的弱點與阻擋

**原始致命項 security-01 尚未關閉。** 本文補出可反駁的設計：拿不到合法、在窗口內且有 scope 的授權，就不能讓 hub 接管資料。要關閉必須跑上表離線驗證與零未授權持久寫入的測試；增加文件、搬 owner 或接受 finding 本身都不是證明。其餘四十六項重大也只有修訂與 gate，沒有可借用的綠燈。

仍修不掉的是單一 hypervisor 的故障域、T2 可複製私鑰、離線撤銷的二十四小時窗口、未知外部副作用及 edge 實體毀損的證據損失。若客戶要求即時全球撤銷或任何 backend 都物理恰執行一次，這版不成立。若禁止 bypass 又要求 proxy 看不到資料，首版 cloud 配置阻擋；簽章不是加密替代。播放器修補線、crypto/BOM 授權、CM4 更新復原、具名 PLC/HMI 互通與外審未查證，均在對應交付前阻擋，不能把「選配」寫成「免驗」。

P6 可保留的主張只剩可辯護的部分：先做實際承諾的產品，未知方言、通用多層樹與第二傳輸有需求再投資；先付不可逆的身分、保存與復原責任。這不再保證最便宜，卻讓下一位維護者知道哪筆事實可重讀、哪個外部效果永遠不能從 timeout 推成沒發生，以及哪個新訂單尚不能接。