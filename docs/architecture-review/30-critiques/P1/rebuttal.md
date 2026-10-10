結論先講：接受 39 條、部分接受 11 條、反駁 0 條，共 50 條；來源嚴重度為致命 0、重大 40、次要 10。P1 的站內 MQTT 有價值，但原文多項「成立」超過了設計證據，不能據此交付。
修訂一：保留必備的站內 broker 與 MQTT 管理物件，雲端 trunk 統一為普通 HTTPS 批次同步，撤回全樹都是 broker bridge 的主張。
修訂二：補齊簽章身分、隔離、耐久交接與還原閘門；實體結果不明就回 unknown，不保證通用 exactly-once。
修訂三：重算元件、工時、消費者與維運成本；所有 PoC、實機與外部審查仍未完成。

# P1 獨立答辯與 P1-R 修訂

## 1. 範圍與證據

日期：2026-10-11。僅任 P1 defender，不評分、不替其他提案定案。已全文閱讀指定底稿、進度、目標提案與五份批評，並讀相關 MQTT、網路 facts 及帳本覆核。模型沿用 host inherited default；沒有可配置的 high effort，未驗證底層型號，也未派遣其他 agent。

本文的「修訂」是本檔明定的 P1-R 架構契約，不表示原提案、程式或部署工件已修改。本輪沒有執行專案程式、服務、PoC 或產品測試。產品證據沿用 2026-10-10 的本地查核，非本日網路重查；搜尋摘要與推論維持原等級，未指定版本的套件與現場能力均為未查證。

P1 此點成立：retained 作可重建的晚加入者快取，與 ERP/unit 持有事實並不衝突；依據見 [mqtt-semantics.md](../../10-facts/mqtt-semantics.md#L76)。[帳本覆核](../../40-mqtt-ledger/ledger-review.md#L5)對「負資產」的修正成立，但也不支持一條 ACL 就能交付任何消費者。下表接受的是失敗反例，不是批評者附帶的每個推論或指定修法。

## 2. 逐條裁決

成本代碼是共用工作包，不是每列重收一次。種類增量相對原案已承認的依賴；「補列」表示原來漏算，不能當零成本。表內人週包含設計、實作及待執行驗收，並非本輪已投入工時。

| 工作包 | 重估人週 | 範圍及持續成本 |
|---|---|---|
| A | 5–7 | PKI、授權、T1 隔離；每季輪替/撤銷演練、每次權限變更的拒絕測試 |
| B | 7–10 | SQ/CQ、outbox、收據、容量與復原狀態機；每版 crash/replay 測試與日常積壓監控 |
| C | 5–7 | 雲端 HTTPS 同步、文件與 live proxy；每站網路驗收、每次 HTTP stack 升版回歸 |
| D | 4–6 | schema、時間/quality、目錄與一般 HMI；每次 schema/consumer 改動驗收 |
| E | 4–6 | 打包、升級、備份還原、SBOM、混版矩陣；每季復原演練與版本盤點 |
| F | 3–4 | ERP write gate、backend reconcile、逐功能結果；每次 ERP/backend 升版回歸 |

### 安全

來源：[security.md](security.md)。

| Finding ID | 嚴重度 | 裁決 | 理由與依據 | 可執行修法 | 種類、人週、生命週期成本 |
|---|---|---|---|---|---|
| security-01 | 重大 | 接受 | 原 §4.1 的簽名未綁收件者；F-48 的跨屏重放反例成立。 | 依 §3.2 綁 env、serial、function、路由 epoch、topic、版本/期限及內容 digest；驗章後逐欄比對。 | +0 外部種類；A 5–7 人週共用；每版跨單元/跨環境重放測試。 |
| security-02 | 重大 | 接受 | adopt 才取得驗簽公鑰有循環信任；F-35/N-04 不能靠 mDNS 保證。 | 出廠預置離線根；安裝前取得根簽的 serial→env binding 與環境授權鏈，不接受 TOFU。 | +1 佈署信任工件，非新服務；A 5–7 人週共用；製造、RMA、換環境均須稽核。 |
| security-03 | 重大 | 部分接受 | CSR 覆寫與 bootstrap 再用成立；但 QR 指紋不能區分持有相同軟體私鑰的複本，不能宣稱修成 T3。 | 固定 serial/出廠公鑰映射，CSR proof-of-possession、Manage 鎖定指紋；衝突隔離，adopt 後停用 bootstrap。 | +0 外部種類；A 5–7 人週共用；每台製造核對與複製/RMA 人工處置。 |
| security-04 | 重大 | 接受 | child 的 conf 不能約束已失陷 child；F-18/N-05 要由 parent 執法。[ACL 能力](../../10-facts/mqtt-brokers.md#L28)不等於配置已正確。 | 每層 parent 同時限制來源、子樹及 topic 方向；CSR 以已驗證身分查 registry，CN 不採信 payload。 | +0 外部種類；A 5–7 人週共用；每次 adopt/re-plug 拒絕測試，dynsec/cert 組合待驗。 |
| security-05 | 重大 | 接受 | URL 被簽不等於 bytes 被簽；F-48/F-56 的快取竄改反例成立。 | 簽名 pointer 綁 immutable manifest hash、版本與逐 asset hash；unit 驗證後才切換。 | +0 外部種類；C 5–7 人週共用；保留雙份資產空間，每版測壞檔/中斷。 |
| security-06 | 重大 | 接受 | bearer 會被 TLS 終結者讀到；[T5](../../10-facts/transport-through-networks.md#L38)支持信任轉移，廠商攔截細節仍是摘要。 | 撤掉 WSS bearer trunk；用 §3.1 的簽名請求/回應與 nonce，企業 CA 僅限 trunk 信任庫；機密內容無 bypass 即阻塞。 | +1 自有同步 binding，補列 HTTP/crypto 時鐘；C 5–7 人週共用；每站 IT/保密審查。 |
| security-07 | 重大 | 部分接受 | 離線撤銷缺口成立；24h 憑證仍不是即時撤銷，P0 也不能令分區另一端立即得知事實。 | 授權 lease 最長 5min，過期停新授權並標 stale；獨立只讀簽名狀態查詢，不恢復 bootstrap，不以拒絕觸發擦除。 | +0 外部種類；A 5–7 人週共用；失聯可用性讓步、每季離線撤銷演練。 |
| security-08 | 重大 | 接受 | 私鑰與狀態備份未分流，N-04/N-09 的相容性未建立。 | 線上簽名鍵/CA 鍵分用途、獨立保管，離線根授權輪替，信封帶 kid；還原預設不具 prod 信任。 | 補列 crypto/金鑰保管工件；A 5–7 人週共用；獨立 escrow、輪替及外部審查費。 |
| security-09 | 次要 | 部分接受 | T1 隔離必須預設；但 [損壞 persistence 檔 crash 紀錄](../../10-facts/mqtt-brokers.md#L31)不證明合法 retained payload 能製造該檔案損壞或 RCE。 | T1 raw broker 與解析 worker 分 UID/資源配額，不持樹私鑰；raw 不持久化、不轉送，限制連線、topic 與流量。 | 有 T1 MQTT 時 +2 process、+0 broker 種類；A 5–7 人週共用；每版耗盡/隔離測試。 |
| security-10 | 次要 | 部分接受 | 致動側門必封，但全面禁 NCMD 會封住 [Rebirth](../../10-facts/mqtt-semantics.md#L66)，不能照抄修法。 | Sparkplug sidecar 只處理授權、限速且 payload 嚴格為 Rebirth 的診斷；所有 DCMD/機台寫值拒絕，無 PLC 控制連接。 | 選配 +1 codec/方言；另 2–3 人週；每版測 BIRTH 恢復及致動拒絕。 |
| security-11 | 次要 | 接受 | 原 §6 token 進 retained、明文 conf 與本機匿名通道均違反 N-03。 | 移除 doc.token/remote_password；cache 以逐屏身分授權，本機 broker 也認證；單一 secret resolver，私鑰不進 URL/log/一般備份。 | +0 外部種類；A 5–7 人週共用；每版 secret 掃描與本機越權測試。 |
| security-12 | 次要 | 部分接受 | client/供應鏈風險成立；「無新版所以無人修 CVE」未查證，且 [SECURITY.md 有流程](../../10-facts/mqtt-brokers.md#L24)。 | 鎖 BOM、薄 client 介面與相容測試；查核 release/修補通道，無可接受修補時隔離或暫停出貨，不承諾自己養 broker fork。 | 補列 client 等外部時鐘；E 4–6 人週共用；每季盤點、重大漏洞即時評估。 |

### 十年維運

來源：[longevity.md](longevity.md)。

| Finding ID | 嚴重度 | 裁決 | 理由與依據 | 可執行修法 | 種類、人週、生命週期成本 |
|---|---|---|---|---|---|
| longevity-01 | 重大 | 接受 | 原 §2/§7 的 +2 漏了 client/SQLite 等，也把不同維度混加。 | 用 §4 的完整清單與分維度計數，process、外部時鐘、格式分帳；最小部署仍有 broker。 | 補列 13 個必要外部時鐘口徑；E 4–6 人週共用；每版 SBOM/部署清單更新。 |
| longevity-02 | 重大 | 部分接受 | 集中維護與新功能風險成立；無 tag 不證死亡，advisories 空也不等於無流程，見 [紀錄](../../10-facts/mqtt-brokers.md#L23)、[流程](../../10-facts/mqtt-brokers.md#L24)。 | 不依賴 persist-sqlite 與 ACL placeholder 作正確性前提；使用明列 ACL、可重建快取、固定建置及 raw 隔離。 | +0 broker 種類；E 4–6 人週共用；每季查核，套件/arm64 來源未查證仍是出貨 gate。 |
| longevity-03 | 重大 | 部分接受 | client 是 fleet 時鐘，此點成立；release 間隔不證無人維護，自製 MQTT client 也不是合理免時鐘方案。 | Python profile 封裝候選 paho，採用前驗版本與安全狀態；保留替換介面，不自製 parser。 | 補列 +1 client 時鐘；E 4–6 人週共用；將來換 client 另估 1–2 人週及 fleet rollout。 |
| longevity-04 | 重大 | 接受 | 原 §3.4/§8 的冷備援有腐爛路徑。 | 所有 (c) 一律普通 HTTPS 同步，移除兩個雲端 MQTT/WSS profile；(a)(b) MQTT bridge 常態測試。 | +1 自有 binding，移除 WSS 專屬配置；C 5–7 人週共用；每版兩類鏈路矩陣。 |
| longevity-05 | 重大 | 部分接受 | 純螢幕仍付 broker 成本，M-01 的質疑接受；已有媒體 GET 不表示已有訂閱、扇出與連線恢復。 | 保留 broker 為 P1-R 固定選擇，撤回小站點必然回本；列入 owner 取捨，不偷改成按需 broker。 | 不減種類；最小中央應用仍 3 個；E 4–6 人週含包裝，每站持續 broker 維運。 |
| longevity-06 | 次要 | 接受 | 原 §9 的換 broker 估算忽略語意/現場遷移；[MQ9](../../10-facts/mqtt-semantics.md#L36)只是快取行為。 | payload 帶來源時間/期限，所有 reader 自行判 stale；更換 broker 要重驗 ACL、session、混版並逐站 rollout。 | +0 外部種類；D 4–6 人週共用；換 broker 另估 5–8 人週及每站驗收，不是完成日保證。 |
| longevity-07 | 重大 | 接受 | 舊 dynsec 會恢復撤銷前權限，清 cache 亦不能代替 owner 復原。 | 還原 broker 從空快取起，先取得最新授權/epoch 才開 listener；每個 bridge 重連即觸發對帳。 | +0 外部種類；E 4–6 人週共用；每季舊備份/撤銷演練，離線還原保持封閉。 |
| longevity-08 | 重大 | 接受 | 線上鍵失陷不能靠它自己簽新鍵解決；原 §3.4 pin 的生命週期不完整。 | 出廠 pin 離線根，線上鍵有 env/purpose/kid/有效期；正常輪替與失陷撤銷分流程，根失陷另走實體復原。 | +0 外部種類；A 5–7 人週共用；出貨前定鏈，持續付 escrow、輪替及慢 fleet 成本。 |
| longevity-09 | 次要 | 接受 | [MQ16](../../10-facts/mqtt-semantics.md#L45)區分 v5 session expiry；原配置不能以 cleansession 推導。 | v5 expiry 明設 7d、重連總是重訂閱/對帳；raw/n 分實例，不依靠即將退場的 per_listener_settings。 | +0 broker 種類；E 4–6 人週共用；每個 knob 留版本理由，升版驗證預設差異。 |
| longevity-10 | 次要 | 接受 | 買傳輸沒有買走制度性知識，原 §1 的「風險整段消失」撤回。 | 建立 broker 行為假設、故障處置與 conformance 清單，交接須能解釋 cache/owner/receipt。 | +0 外部種類、+1 測試維護面；E 4–6 人週共用；每次 broker/client bump 重跑並留證據。 |

### 正確性

來源：[correctness.md](correctness.md)。

| Finding ID | 嚴重度 | 裁決 | 理由與依據 | 可執行修法 | 種類、人週、生命週期成本 |
|---|---|---|---|---|---|
| correctness-01 | 重大 | 接受 | 原 §4.2 的 key 不能原子提交外部動作與 CQ；F-47/F-51、B-08 反例成立。 | 先耐久 admission；backend 接 key 並查結果，或改冪等狀態；crash ambiguity 回 unknown，禁止自動重跑。 | +0 引擎，+backend 契約；B 7–10 人週共用；每種動作斷點測試及人工 reconciliation。 |
| correctness-02 | 重大 | 接受 | 原 §4.1 沒有完整 CQ 出口，磁碟存在不等於可重讀。 | 每次重連/週期同步批次 CQ、cursor 與水位；同 key 回既有結果；ERP 結果 commit 才產生耐久收據。 | +0 引擎、+同步日誌；B 7–10 人週共用；持續監控最老未確認結果與回補。 |
| correctness-03 | 重大 | 接受 | deadline 不能取消已 running 的 A，單裝置排程也未涵蓋 show 共用資源。 | ERP 指定 resource set/序號，edge 入場查原 deadline；unknown 阻擋衝突工作，確認停止或有效 fencing 後才釋放。 | +0 外部種類；B 7–10 人週共用；每版測 timeout/取消競態，人工解鎖成本不為零。 |
| correctness-04 | 重大 | 接受 | actual.v 混用 observed/applied 會把 refusal 算完成；B-02/B-06 仍可能發生。 | 分 observed_v/applied_v/status/refusal，每 function 一個耐久 reconciler；只有 backend 成功與 digest 相符才完成。 | +0 外部種類；F 3–4 人週共用；每個 backend/ERP 升版驗拒絕、延期與併行。 |
| correctness-05 | 重大 | 接受 | 原 §6 未定指定版本服務及資產提交點，F-60/N-11 尚未閉合。 | immutable manifest，缺指定版本即拒絕；unit 保留舊資產、驗齊新檔後切換，失敗不推進 applied。 | +0 外部種類；C 5–7 人週共用；雙份磁碟與下載/切換中斷驗收。 |
| correctness-06 | 重大 | 接受 | ACL 不提供 schema 生效屏障，F-31/F-32 與 capability live 更新不足。 | stable unit/function 綁 schema revision；root 耐久核准後來源才啟用，過渡值留 outbox，未知 capability 拒絕執行。 | +0 引擎、+版本契約；D 4–6 人週共用；每次 schema 變更保留解碼器及混版測試。 |
| correctness-07 | 重大 | 接受 | 本地 PUBACK 不代表最終交接；[MQ11](../../10-facts/mqtt-semantics.md#L43)支持 queue 不能保底。 | 來源先寫 sample/event outbox；量測等 PG commit 收據，業務事件等 ERP commit 收據才回收，按 id 去重。 | +0 引擎、+磁碟配額；B 7–10 人週共用；積壓/缺口/回補監控。 |
| correctness-08 | 重大 | 接受 | F-67 的兩日 inbound 不負責尚未收到的 CQ；永久 key 也造不回結果。 | 依 §3.3 的確認/回收/重播窗口，未確認 CQ 不因七日到期而刪；容量逼近先停 job admission。 | +0 引擎；B 7–10 人週共用；容量成本、逾窗 unknown 與人工補償。 |
| correctness-09 | 重大 | 接受 | ts_source 不能創造量測時間；既有 HMI 也不能等 Expiry 幫它清畫面。 | 近源 timestamp、sequence、clock_quality/max_age；未知時間不作 fresh，期限 job 暫停，reader 自行老化。 | +0 外部種類，補列時間服務依賴；D 4–6 人週共用；每站校時及跳時/沉默測試。 |
| correctness-10 | 重大 | 接受 | owner 回復舊版會倒退版本及去重；清空 broker 無法修正這件事。 | 離線復原登錄核發新 authority epoch，unit restore 進隔離；先對帳 surviving owner 與外部結果，不自動重跑未知動作。 | +1 復原工件、+0 引擎；E 4–6 人週共用；雙向 restore 演練與人工裁決。 |

### 情境擬合

來源：[scenarios.md](scenarios.md)。

| Finding ID | 嚴重度 | 裁決 | 理由與依據 | 可執行修法 | 種類、人週、生命週期成本 |
|---|---|---|---|---|---|
| scenarios-01 | 重大 | 接受 | 原 §3.2 只有 MQTT port，D-01 下一步內容 fetch 會被 deny。 | 加 unit→parent cache、bridge→parent cache 的 8443；cloud 出站 443，T1 仍不可直達 ERP。 | +0 外部種類；C 5–7 人週共用；每站 allow/deny 與內容流程驗收。 |
| scenarios-02 | 重大 | 接受 | [T7](../../10-facts/transport-through-networks.md#L45)的 nginx 設定不證客戶允許 Upgrade。 | (c) 不再依賴 WSS，統一短 HTTPS sync；仍驗 explicit proxy 認證、FQDN、idle 與保密政策。 | +1 自有 binding；C 5–7 人週共用；每站約 0.5–1 人週驗收另計，IT 等待不計工程。 |
| scenarios-03 | 重大 | 接受 | HTML 快取不會代理後續 JSON 請求，F-63/C-24 反例成立。 | parent 同源 live proxy，保留來源時間/quality，逐屏認證與 polling 紀錄；不把 bridge fetch 當螢幕刷新。 | +0 外部種類；C 5–7 人週共用；每個 live-board profile 的斷線/授權回歸。 |
| scenarios-04 | 重大 | 接受 | PG 停機時 subscriber 還活著，原 R_buf 觸發條件不足。 | sample outbox 等 writer 的 PG transaction 收據；history/去重/roll-up 同步更新水位，停 PG 不清來源資料。 | +0 引擎、+磁碟預算；B 7–10 人週共用；PG 故障與重播測試。 |
| scenarios-05 | 重大 | 接受 | 白名單 IP 是可達範圍，不是 F-22 的 stable identity。 | south 登記 stable id、bus/address、serial 能力、register map；換機人工確認，history series 不按 IP 續接。 | +0 引擎；D 4–6 人週共用；每型號另 0.5–1 人週，現場/RMA 記錄持續維護。 |
| scenarios-06 | 重大 | 接受 | 原 §6 bridge timeline 若逐拍送到遠端 strip，F-44 仍被網路 timing 破壞。 | 同步 show 限同機多通道；跨盒預載完整 timeline，各自執行且不保證同步，按 strip 回收結果。 | +0 引擎；F 3–4 人週共用；逐 backend 驗收，配線/控制器費未查證另計。 |
| scenarios-07 | 重大 | 接受 | ev/access 與 threshold 原先在 root 前無明定 owner，F-46 不成立。 | 來源耐久 event journal、event id/sequence 與 ERP 收據；T1 無日誌能力者不可宣稱斷電不丟事件。 | +0 引擎、+來源儲存；B 7–10 人週共用；事件容量/缺口監控，D-05 實機另案。 |
| scenarios-08 | 重大 | 接受 | LAN 傳送與既有畫面有效性是兩件事；F-04/05 與 D-06 要完整終態。 | 契約指定資料年齡、品質與 p95 目標；必要時在降頻前分本地 feed，北向 ≤1 Hz，畫面自行 stale。 | +0 外部種類；D 4–6 人週共用；每個 HMI profile 量測/適配，不宣稱已有延遲數據。 |
| scenarios-09 | 重大 | 接受 | N-14 的零時間會同時破壞歷史、Fleet 與期限。 | 有效時間源與 boot sanity gate；time_unknown 保留原始資料、不偽裝 fresh；超時計數用 monotonic，不能略過憑證驗證。 | +0 自建種類、+現場依賴；D 4–6 人週共用；每站時間健康監控及校時。 |
| scenarios-10 | 次要 | 接受 | 三個中央應用 process 不是完整 N-07/N-13 驗收。 | readiness 覆蓋 PG、同步、cache、backend/player；固定 compose project，區分 crash restart 與 deliberate stop。 | +0 外部種類；E 4–6 人週共用；每版測 reboot/stop，量 RSS/磁碟/開機時間。 |

### 生態

來源：[ecosystem.md](ecosystem.md)。

| Finding ID | 嚴重度 | 裁決 | 理由與依據 | 可執行修法 | 種類、人週、生命週期成本 |
|---|---|---|---|---|---|
| ecosystem-01 | 重大 | 接受 | broker ACL 文件沒有證明封閉 T1 可改 topic；固定 vendor topic 可能在守門前被拒。 | admission profile 定義可信來源與固定 topic 映射；撞名而無法識別來源就拒收或用專屬隔離入口。 | +每型號 profile；另 0.5–1 人週/型號，A/D 共用底座；AP/switch 施工與韌體變更重驗。 |
| ecosystem-02 | 重大 | 部分接受 | 要量完整採樣到顯示，此點成立；D-06 未定毫秒數，不能直接判 1 Hz 不合。 | 與使用者約定 p95/最大年齡，測滿載及 WAN 斷線；不達才加本地高速 feed，不上 trunk。 | +0 外部種類；D 4–6 人週共用，現場量測另約 1 人週；需求變更重訂 SLO。 |
| ecosystem-03 | 重大 | 接受 | [MQ9](../../10-facts/mqtt-semantics.md#L36)不承諾既有 HMI 清除畫面；best-effort 不是 F-04 的交付。 | reader 按原始時間/TTL/quality 失效，重播不續命；不支援者接受控 adapter 或不列相容。 | +可能的 consumer adapter；D 4–6 人週共用；每個 HMI 另 0.5–1 人週及版本回歸。 |
| ecosystem-04 | 重大 | 接受 | 原 §5 的 path ACL 在 re-plug 後會斷流，放大全站 scope 不可接受。 | root 提供 serial/function→path 版本目錄、consumer lifecycle；更新 ACL 與訂閱後退場舊路由。 | +1 自有目錄/consumer 契約，非新服務；D 4–6 人週共用；每 consumer 授權、輪替、撤銷驗收。 |
| ecosystem-05 | 次要 | 部分接受 | history/live 接縫確有競態；但連續回補不是所有 HMI 的既定需求。 | 基本 profile 明列 live-only；需要連續資料者先緩衝 live，取 PG watermark 快照後按 sample id 去重。 | 選配 +1 consumer 整合；另 1–2 人週；維護 cursor 保留窗與慢 consumer 告警。 |
| ecosystem-06 | 重大 | 接受 | [BIRTH/alias](../../10-facts/mqtt-semantics.md#L65)、[STATE/session](../../10-facts/mqtt-semantics.md#L67)證明 NBIRTH/NDATA 副本不足。 | 獨立 sidecar 處理 BIRTH、seq/bdSeq、host STATE 與受限 Rebirth；不得走致動通道。 | 選配 +1 codec/方言；與 security-10 同一筆 2–3 人週；每版晚加入、重啟、缺序驗收。 |
| ecosystem-07 | 次要 | 部分接受 | wire 相容不等於 NGSI/OPC UA 語意；但指定此 profile 的客戶需求及現版產品相容性未查證。 | 不宣稱通用相容；標案確定後依 F-34 另做 id/type/unit/quality 映射與版本化 connector。 | 每 profile +1 adapter；另 1–3 人週 PoC，不是完整認證費；標準/供應商升版重驗。 |
| ecosystem-08 | 重大 | 接受 | F-41 只規定方向，不能推出 WSS 或 MQTT 自動獲 IT 核准。 | 撤回原 §7 不需 bypass 即可上線；採 §3.1 雲端 profile，事前核准網路與保密條件，不通即標部署阻塞。 | +0 外部種類；C 5–7 人週共用；與 scenarios-02 共用每站 0.5–1 人週，認證/等待另計。 |

## 3. 修訂後的提案差異

本節引用[原提案](../../20-proposals/P1-mqtt-native.md#L1)節號，只定義改變之處；下文「必須」均為實作與交付的規範，不是測試通過宣告。

### 3.1 原 §1、§3.1–3.3：拓樸與網路邊界

P1-R 仍讓所有 T2 使用站內 MQTT，管理物件也仍由 MQTT 搬運；broker 不因站點暫無 HMI 而消失。原「broker 就是樹」改成「broker 承載站內樹，node 維持端到端權威」。所有雲端站點都用同一個 HTTPS sync profile，不保留隱藏 WSS 備援或 raw MQTT/TLS 443 profile。這是正式縮小 P1 主張，不假稱 MQTT 已解決受限網路。

site node 主動向指定 root 的 `/sync` 發有限大小 POST，帶 outbox 批次、已收 cursor 與新 nonce；root 回簽確認水位、desired/SQ/管理差異及 nonce。閒置最多等待 20 秒，受管狀態每 120 秒至少對帳一次；cursor 失效要取帶水位的全量快照，再續增量，不可清空本地事實。資料與命令共用信封/去重程式，沒有每命令輪詢器。proxy 所需認證由單一 resolver 提供，機器身分另靠私鑰 proof 與逐訊息簽章，不能把可見的 proxy 密碼當 root 授權。

簽章只保真偽，不保密。預設要求端到端 mTLS 的核准 bypass；只有明確核准可被企業 proxy 閱讀的資料才可採專用企業 CA 加雙向應用簽章。私密文件、出勤資料或憑證材料遇上必須攔截且不許 bypass 的政策，本修訂仍阻塞；沒有已完成的端到端加密方案可冒充退路。HTTPS 本身也不保證通過任意客戶網路，見 [網路證據限制](../../10-facts/transport-through-networks.md#L51)。

| 形狀 | 完整路徑及放行設計 | 額外條件 |
|---|---|---|
| (a) 同機 | Odoo/ERP PG、root node/SQLite、root broker；CM4 的 agent/SQLite、display backend/player。CM4→root 8883 mTLS、8443 cache；root→ERP API/PG 僅本機授權；broker 本機也用認證，不開匿名 1883。 | history/Grafana 關閉仍可 Apply；ERP UI 443 只給使用者網段。 |
| (b) 跨 VLAN | 每 VLAN 的 bridge node/broker；T2→parent 8883/8443，bridge→parent 8883/8443；MQTT T1→隔離 raw 8884，Modbus poller→白名單 502，RTU 本機 serial；HMI→正式資料 broker。 | 所有其他連線 deny；T1 與租戶須有線/無線 L2 隔離，bridge 不轉 IP/mDNS。 |
| (c) 雲端 | 站內同 (b)；site→核准雲端 FQDN 443 的 sync/內容 HTTPS，或指定 explicit proxy；每客戶獨立 root node/broker/Odoo/PG。 | 無站點 inbound；無 Upgrade 需求；資料保密與 proxy 驗收未通過不得上線。 |
| 共通 | DNS TCP/UDP 53、有效 NTP UDP 123 只到核准來源；DHCP 視部署限定；mDNS 只同 link。 | MQTT parent、content parent、cloud sync、ERP public/internal URL 分別配置，不能由 web.base.url 推導。 |

raw broker 與 payload parser 都不得持有樹私鑰；用獨立 UID、掛載與 CPU/RAM/磁碟配額隔離，不能只分 process。parent 的 ACL 按上行/下行類別分權，子樹前綴本身不足以防 child 偽造 desired。C-25 的同 VLAN 橫向流量不會經過 bridge 防火牆，依 [隔離建議](../../10-facts/transport-through-networks.md#L110)必須施工；未能隔離即不能把 hostile T1 接入此部署。

### 3.2 原 §3.4：身分、簽章與撤銷

唯一營運憑證發行者仍是 root node；離線 factory/environment 根只授權其用途。unit 預置離線根及根簽的環境綁定，DNS 只供發現。採用前鎖定 serial、出廠公鑰、CSR 指紋與 proof；一個 serial 出現衝突候選便隔離，不能最後寫入者贏。營運後 bootstrap 永久停用，RMA 必須經管理流程重新授權；T2 軟體金鑰可複製的上限不因此消失。

信封固定編碼並帶 env、stable serial/function、route epoch、完整 topic/動作、schema revision、authority epoch、version/job key、期限、body digest、kid。接收方驗授權鏈、用途、簽章、新鮮度與本機身分；重送同一 key 不創造新期限。所有 T2 actual/CQ/announce 也以來源鍵簽章，中繼保留原簽章；T1 只能由 bridge 代述並標來源品質，型別正確不代表量測真實。

營運憑證設計有效期七日、半期續期；即時執法靠 root 的撤銷狀態及最長五分鐘授權 lease，不靠憑證過期冒充即時。失聯 lease 到期停新工作與新授權，已知好畫面可繼續，HMI 資料失去授權新鮮度要標 stale。撤銷後以既有 unit key 證明身分，只能經 parent 查詢該 serial 的簽名狀態與 nonce，不能取得命令或重開 bootstrap。到不了 root 就是 unknown，不能遠端擦除離線或已被複製的裝置。

線上 CA、業務簽章鍵分用途與 OS 權限，金鑰不進一般狀態備份；獨立加密 escrow 與離線根授權復原。正常輪替帶重疊窗口，失陷則由離線根撤舊鍵，不能由失陷鍵自行背書。staging 啟動沒有 production 金鑰/環境綁定，連線預設 archive；管理物件必須帶環境欄，topic 前綴不再單獨當 N-04 防線。

### 3.3 原 §4.1–4.4：耐久完成與恢復

ERP 在自己的交易內持久化 desired/SQ 與 outbound journal；root adapter 只在交易外讀取。root 對 binding/config 先 commit 才讓 ERP 建管理紀錄；archive connection 同時停止新授權與新 SQ，未配置連線必回可操作錯誤。unit 每 function 只有一個耐久 reconciler，分 observed_v、applied_v、status/refusal；done 必須是同 epoch/version、同 manifest digest 且 backend 成功，不因看過版本或收到 PUBACK 成立。

job 先耐久 accepted，再由 worker 記 running 並呼叫 backend；能改成冪等狀態的 LED config/effect 優先改為 intent。剩餘一次性動作要讓 backend 按 key 冪等並可查結果，或在 crash 後做外部 reconciliation。若實體已改變但 CQ 未 commit，系統無法由兩個本地落盤次序推知真相；回 unknown、停止自動重試，也不能宣稱未執行。重新執行需操作員確認風險並產生新的業務決策，而非換 key 偷偷再送。

ERP 為衝突 resource set 排序，edge 入場驗序號及原始絕對 deadline。timeout 只改可觀察狀態，不釋放仍可能 running 的資源；須取得停止證據、backend 可執行的 fencing，或人工隔離確認。跨盒 show 先預載完整 timeline，不逐拍送指令；要求同步的 show 限同機多通道，跨盒不保證同步，ERP 顯示逐 strip 結果，bridge 排程結束不等於所有 strip 成功。

每次重連、bridge 恢復及每 120 秒，雙向批次同步 CQ/actual/管理狀態。重複 SQ 必回既有狀態，ERP 結果與 receipt outbox 同一交易 commit 後才回確認水位；lost receipt 可重送。空 retained SQ 只是快取清理，不授權刪 CQ。量測與業務事件同樣先寫來源 outbox，分別等 PG 與 ERP 的耐久收據；傳輸 ack、root 收件與 HTTP 200 都不能代替該交易證據。

| 狀態/窗口 | P1-R 明定值與 owner | 回收、失效與監控 |
|---|---|---|
| desired/actual、schema/binding | 各自 owner 保留現行版本；root/edge 每 120s 對帳及重連即同步 | 版本/hash/epoch 衝突隔離，監控最後成功同步與未確認變更。 |
| broker cache | raw/n/root 預設不持久化，retained 只在記憶體加速 | 重啟從 owner 重建；不可開啟「cache 已恢復所以權威有效」捷徑。 |
| broker queue/session | queue 每 client 上限 1000，raw 100；另設實例 byte/連線/topic 配額；v5 session 7d | 容量與 drop 可見；session 丟失不影響 owner，重連重訂閱。設定組合待固定版本驗證。 |
| SQ | 原始入場 deadline 最長 7d；ERP 未結 metadata 留到裁決 | 重送只用剩餘 TTL，broker expiry 不取消 running；監控逾時及衝突資源。 |
| CQ | unit 未確認結果不按年齡刪；收到 ERP commit 收據後再保留 7d | 配額按至少 7d 峰值配置，80% 告警、90% 停新 job，保留結果/控制訊息容量。 |
| dedupe tombstone | 至少 90d；已開始 key 與結果分開保存 | 配合最多 30d 可還原備份及 7d admission 期限；更舊 replay/restore 強制人工復原，不自動重跑。 |
| sample outbox | 每來源目標 24h，至少 50MiB，但必依峰值放大才可承諾 24h | 年齡/容量先達者生效；不足時丟最舊並保留缺口計數，不以 PUBACK 回收。 |
| event outbox | 按 30d 峰值配盤，最低 256MiB；收 ERP receipt 後保留 2d | 80% 告警、90% 背壓；不可背壓來源明示 loss 區間，不能承諾無限離線或斷電不丟。 |
| sync cursor | root 差異日誌 7d，owner 最新事實不隨 cursor 回收 | 逾窗取帶水位快照；未結 CQ/事件另按其 owner 窗口處理。 |
| measurement freshness | max_age 預設 3 個採樣週期，D-02 為 90s | reader 主動計時；重播不覆蓋較新 sequence，回補不把舊時間變 fresh。 |
| presence | heartbeat 120s、offline 5min；Will/keepalive 30s、grace 2min 僅提示設定 | conn/incarnation 去抖，時間未知另標；不把每則 heartbeat 寫 ERP。 |
| authority/授權 | lease 5min；每次 reboot/restore 先驗新鮮 epoch/授權 | 過期 fail-closed；顯示 stale/unknown，不假稱遠端立即擦除。 |
| 文件/history | unit pin 現行與上一個成功版本；額外 cache LRU 配額；history 3 年 | 空間不足拒絕更新；roll-up/partition 刪除有游標與計數，容量未驗不承諾足跡。 |
| ERP inbound | 2d replay；命令 key/業務結果另行長期保留 | 不把 inbound 清理當作 CQ owner 已交接的證明。 |

### 3.4 原 §5–§6：資料、內容與消費者

來源先宣告 stable unit/function 的 typed schema revision，root 耐久核准後才切換；過渡資料留在 outbox，不能未知屬性自動建表或靜默丟掉合法遷移。capability 空值不等於全部支援。D-03 在 south 登記穩定代表及 register map，位址只是 locator；無 serial 可讀的儀表換機由人工確認，不把新儀表續寫成舊機歷史。封閉 MQTT 設備須逐型號確認可改 topic、認證、時間與 quality，不可由協定名稱推導相容。

F-02 的時間由最近的可靠採樣者給出；無來源時間的排隊 T1 訊息標 time_unknown，另留 received_at，不偽稱新量測。開機時間未可信時保留資料、暫停期限 job，顯示 last-known-good；校時要經受控安裝或預置錨驗證的時間證據，不跳過 TLS 驗證。歷史以 sample id 去重，PG commit 水位才交接，roll-up 對回補可重算；ERP 只收業務資訊，不收逐筆量測。

D-01 的 manifest 是不可變版本，route 必須提供所求版本或拒絕，包含每個媒體 hash；unit 驗齊且 backend reconcile 成功才更新 applied。切換失敗保留舊版，backend 若不能原子切換就維持 applying/error 並復原，不假裝已完成。live board 向 parent 的同源路徑取 JSON，每片螢幕分別授權/監控，離線與資料年齡可見；pointer 不再攜帶可被 retained 擴散的 token。

一般 HMI 必須依來源時間、quality、授權有效性及 max_age 老化，不支援者不列相容或用同機受控 adapter；不能僅把驗過的值送回不可信遠端 broker 便宣稱畫面不可偽造。先約定採樣到顯示的 p95，再決定是否分出不上 trunk 的本地高速 feed。root 的 consumer 目錄將 serial/function 映到路由與 scope，換 path 時協調 ACL/訂閱並退役舊路由；live-only 與 history/live 連續回補是不同 profile，不把後者免費塞給所有消費者。

Sparkplug 預設關閉，啟用才付 codec/sidecar 成本。其 sidecar 處理 BIRTH、alias、seq/bdSeq 與 host STATE，只容許已授權、限速的 Rebirth 診斷，對其他 NCMD metrics 與 DCMD 一律拒絕，也不連機台寫入端。這同時處理安全與晚加入恢復，不承諾 [未查證的 Tahu/plugin/商用模組](../../10-facts/mqtt-semantics.md#L70)已能開箱交付。D-05 僅交付本案的身分、非控制設定、存活與事件契約；卡表、開鎖、排程及安全控制不在本案。

### 3.5 原 §8–§9：還原、升級與成本

broker/dynsec 是衍生物，不從舊備份恢復為授權權威。node/ERP/PG 採各自一致性備份，私鑰另存；啟動順序先確認環境、最新授權與 epoch，後開 operational listener。root 的 authority epoch 由不隨業務備份倒退的離線復原登錄核發；登錄也遺失就人工復原，不能從舊資料加一猜測。unit 還原後先隔離並與仍存活 owner/外部 backend 對帳；未知實體結果不因新 epoch 而變成未執行。

版本政策是目前及前一個協定 major 混版，parent 先升、unit 分批 canary；簽名 artifact/digest、安裝前 snapshot 與 rollback 進 deploy 契約。node、broker/client、OS/Python/player 分別排程，root key 不藉一般升級偷換；必須驗中途斷電及資料向後相容，無法回滾的 migration 先阻止 rollout。readiness 要測到 cache/backend/player，restart policy 不能把刻意停止變成自動復活，並用固定 project 名避免 B-13。

原十八人週估算撤回，以前表去重後的六包重估二十八至四十人週，涵蓋三形狀基礎流程、一般 HMI 與命令恢復。這不是原十八再加一次。每站驗收、每型號 profile、Sparkplug/標準 connector、硬體施工、D-05 實機安全產品及外部審查費另計。每季預留二至四人日盤點/復原，重大升版另估一至三人週；這是小團隊容量預算，不是供應商 SLA 或實測報價。

## 4. 原 §2 元件清單完整替代表

| 元件/維護面 | 自建或外部、角色 | 授權/版本/時鐘證據 | 部署及相對原案變化 |
|---|---|---|---|
| Mosquitto 與 dynsec | 外部；root/各 bridge 的站內 MQTT | [授權](../../10-facts/mqtt-brokers.md#L22)、[版本紀錄](../../10-facts/mqtt-brokers.md#L23)、[設定退場](../../10-facts/mqtt-brokers.md#L29)，均為 2026-10-10 查核；實際鎖版/支援未查證 | 始終必備；raw 另實例；不用 persist-sqlite 作前提，不含雲端 WSS listener。EDL 解讀見 [原研究](../../10-facts/mqtt-brokers.md#L106)，保留聲明等義務須核對，撤回「零義務」。 |
| node | 自建 Python profile；unit/bridge/root，同一 repo | 自有協定/版本時鐘；HTTP/MQTT/crypto 不假裝消失 | root 持 CA/業務簽章、registry、ERP adapter、writer；各 node 持 owner state、sync、cache、reconciler。 |
| MQTT client | 外部，候選 paho-mqtt，薄介面包裝 | 沿用原 §2 候選；採用版本、目前維護、授權適用性未查證 | 每 node 必備，+1 明列時鐘；不新增自製 MQTT parser。 |
| HTTP library | 外部，候選 aiohttp | 版本、授權、維護狀態未查證 | 文件 client/server 及 cloud sync 共用；補列 +1 時鐘，不是 HTTPS 已有所以免費。 |
| 簽章 library | 外部，候選 cryptography | 版本、授權、維護狀態未查證 | 不自製 crypto；補列 +1 時鐘，金鑰保管/escrow 為獨立工件。 |
| SQLite | 外部；node 事實/outbox/CQ | 版本、授權、支援期限本輪未查證 | 必備引擎/時鐘；明定耐久交易與一致性備份驗收，不複製運行中的活檔冒充完成。 |
| function backends/低權限 parser | 自建，display/LED/sensor/Modbus 與 raw decoder | 自有版本時鐘；第三方 driver 的授權/狀態未查證 | 獨立 process、只綁本機，sensor crash 不傷命令；parser 不持樹私鑰。 |
| Odoo + iot_* + integration hub | 外部 Odoo 加自建模組 | 沿用 ERP，實際版本/授權/支援狀態本輪未查證 | 仍是 CMS/desired/SQ 業務 owner；adapter 拉取，不在交易內發遠端指令。 |
| PostgreSQL | 外部，ERP 必需；history 是可選獨立 database | 實際版本/授權/支援期限本輪未查證，不重述原案未核版本日期 | 同引擎不重算種類；history/writer/roll-up 關閉不影響單螢幕，DB 認證與備份各自列帳。 |
| Grafana | 外部，選配 ops dashboard | 版本/授權/支援與 plugin 現況未查證 | +1 選配時鐘；歷史走 PG，未驗 MQTT plugin 不列為依賴。 |
| Python、OpenSSL、Linux/OS | 三個外部基礎時鐘 | 精確版本、授權清單與支援期限未查證 | 從第一台 unit 即存在；不能以 broker 被買回來而省去更新責任。 |
| container engine、Compose | 兩個外部部署時鐘 | 精確版本、授權/支援未查證 | 固定部署 profile；既有 ERP 與 IoT 的 project/資源隔離要驗。 |
| Anthias/player | 外部，D-01 必備 | 原案承認 C-18/C-19；目前版本/授權/維護者未查證 | 仍需 readiness、回滾與替換 reconcile backend，不藏在「一片螢幕」裡。 |
| deploy repo | 自建；配置、PKI 安裝、升級/復原工件 | 自有生命週期 | 三形狀、L2/防火牆及設定方言均列帳。 |
| e2e repo | 自建；stub、conformance、混版/故障驗收 | 自有生命週期 | 沿用既有測試家族；本文沒有新增或執行測試程式。 |
| Parts repo/型號 profile | 自建；vendor 檔、SHA256、介面/換機說明 | 自有維護面；vendor 資料依型號核對 | F-36/N-22 與 T1 admission 的交付成本，不能排除於種類帳。 |
| DNS/NTP、AP/switch、防火牆 | 現場必需依賴，可重用已驗服務 | 型號、授權與能力未查證 | 不強迫新增 daemon；沒有效時間/L2 隔離仍是部署阻塞。 |
| nginx/Modbus library/Sparkplug codec | 按實際 ingress、D-03、特定 HMI 選配 | nginx 行為僅據 [T7](../../10-facts/transport-through-networks.md#L45)；其餘鎖版、授權與維護未查證 | 各加實際時鐘及測試面；沒有 WSS 不代表部署完全沒有 reverse proxy。 |

計數分開看：引擎三種（Mosquitto、SQLite、PG），自有程式語言三種（Python、SQL、shell），語言 runtime 一種（Python），自有 repo 五種（node、ERP、deploy、e2e、Parts）。必要外部時鐘十三類按表列產品計，選配另加，傳遞依賴仍須 SBOM 核對；這些維度不相加成比較分數。原三個中央應用服務仍是 Odoo、node、broker，但含 ERP PG 至少四個服務，另有 CM4 agent/backend/player；raw 隔離增加實例而非 broker 種類。最小足跡必須量，不能以這張表代替 RAM 數據。

## 5. 原 §7 妥協清單完整替代表

| 需求 ID/原約束 | P1-R 的取捨 | 換到什麼 | 誠實代價與界線 |
|---|---|---|---|
| N-13、錨點 7 | 最小中央應用仍三個，broker 不可選 | 站內 MQTT 訂閱、晚加入快取與扇出 | PG/player 等不在三個之內；足跡未查證，純螢幕未證回本。 |
| M-02 | 不再使用 13→15 的混合總數 | 可比較的引擎/語言/repo/時鐘清單 | 補列 HTTP/client/crypto/OS 等；雙實例及 sync 都有維護面。 |
| M-06 | 接受 broker/client 的外部更新責任 | 現成傳輸零件 | 季度盤點、固定版本回歸，無修補時可阻塞出貨，不承諾接手 C broker。 |
| N-02 | 預設 mTLS bypass；核准可被 proxy 閱讀的資料才用分段 TLS 加雙向應用身分 | 可不依賴 Upgrade 的雲端 profile | 簽章不保密；敏感資料無 bypass 而無已驗加密方案時阻塞，非已解決。 |
| F-17/F-18 | 路由樹加 parent 端方向 ACL、consumer scope | 有限制的多消費者接入 | 不宣稱物理上只看得到 parent；L2 隔離、路由 epoch 與拒絕測試必需。 |
| F-46 | retained 仍只是 cache；owner 完整時快取空窗不是放棄 owner 原則 | broker 可從空重建 | 必須顯示 pending/unknown；CQ/事件交接與窗口依 §3.3，不能只信 queue。 |
| P0 §6.1、F-41/F-68/F-69 | ERP↔root adapter 保留拉 queue、推業務 inbound | 業務交易無遠端呼叫，single write gate 明確 | root adapter 持續維護；F-70 archive/無連線錯誤要實測。 |
| F-56/C-24 | 文件/live JSON 走 parent HTTPS，不經 MQTT | 大檔 cache、斷線沿用、同源 live board | 兩種傳輸仍共存，新增放行與逐屏授權、雙份資產空間。 |
| P0「下行一律 pull」 | 站內持久連線訂閱；雲端 site 主動 sync | 站內即時通知與受限網路單一路徑 | 不能承諾同步時間，重連/背壓仍要測。 |
| P1「broker 就是整棵樹」 | 收縮為站內 MQTT，(c) 由 node 搬同一契約 | 移除冷 WSS 備援與 Upgrade 依賴 | +1 自有同步 binding；承認不是原版全樹 MQTT。 |
| F-47/F-50/F-51 | job 結果不明時允許 unknown 並阻塞衝突工作 | 不重做、不假報成功的誠實終態 | 通用實體 exactly-once 不成立；需外部冪等、對帳或人工判斷。 |
| N-11、管理表即時撤銷 | 舊畫面可繼續；新授權最多容忍五分鐘離線 lease | 有界授權陳舊性 | 犧牲長離線的新功能/HMI 新鮮授權；不保證遠端停止被偷螢幕。 |
| F-59/F-72 | 保留逐屏授權，改用裝置身分，不在 pointer 放 bearer token | 秘密不進 broker cache/一般備份 | 是對原 token 機制的明示調整，仍須逐屏撤銷與權限檢查。 |
| F-08/F-67、N-09 | 有限離線窗口、容量背壓與受控 restore | 可核對的交接與可見 loss | 任意長分區/整碟損毀仍可丟資料；不能把兩日 inbound 算成端到端保證。 |
| D-05、class rules | 只處理管理及事件；Sparkplug 只允診斷 Rebirth | 不把資料通道變成未審查控制通道 | 安全門禁、卡表/開門排程、實體控制仍另案，不以 stub 宣稱交付。 |

## 6. 尚待驗收與仍承認的弱點

下一步驗收不是再問「能否 CONNECT」，而是三形狀各走完 Apply 到換頁、採樣到 PG/畫線、job 到 ERP 結果。故障注入須包括 backend 動作前後/CQ commit 前後斷電、ERP/PG 停機、lost receipt、舊備份、schema 競態、零時間及 deliberate stop；通過條件是保留 owner、結果 unknown 可見、不自動重做、拒絕/錯誤不假報完成。以上全為尚未執行的 gate，不能用本文件的 ID/連結檢查替代 N-17/N-18。

安全驗收另測首次 adopt 的預置信任、CSR 替換、跨環境/跨單元重放、撤銷 lease 過期、raw 資源耗盡及還原後舊權限。客戶 proxy 要測實際 policy 與內容保密，商用 HMI 要測既有畫面變 stale、晚加入及換 path；供應鏈要先確認固定版本、授權義務、arm64 artifact 與可用修補路徑。這些未知不是一句「排入 PoC」就已被消除。

來源沒有致命 finding，因此沒有被跳過的致命列；這不等於修訂已可上線。無法解掉的界線仍有：實體結果不可觀察時的 unknown、分區中的即時撤銷不可能、軟體金鑰可複製、單一 hypervisor 的共同故障，以及有限磁碟對無限離線的限制。無 L2 隔離、敏感資料必須經攔截但無可接受保密方案、或所選版本沒有可驗證安全路徑時，都仍是該部署的阻塞，不得以來源致命數為零隱藏。

最後，MQTT 的實益不必靠貶低 HTTPS 來成立：本案留下通用接點、站內扇出和 retained 快取，也留下 broker、client、配置方言及慢 fleet 的帳單。只有單螢幕的客戶未必值得付這筆；P1-R 沒有修掉這個產品取捨，評審應以實際需求和同口徑成本決定，而不是把接受批評的數量當勝負。