結論先講：接受 44 條、部分接受 5 條、反駁 0 條；49 條逐條裁決，來源嚴重度為致命 0、重大 40、次要 9。
修訂一：保留 P5(A)，立即補齊耐久交易、實體效果 unknown、完整重讀與還原契約，撤回正確性全數成立的宣稱。
修訂二：雙向事實必須簽章，管理面固定 HTTPS；金鑰、proxy 保密與隔離都有出貨閘門。
修訂三：P5(B) 須證明相對同等資料投影基線的增量收益；重列元件與妥協，不再宣稱一個 broker 免費買回全部生態。

# P5 答辯

日期：2026-10-11。本附件修訂 [../../20-proposals/P5-pluggable-transport.md](../../20-proposals/P5-pluggable-transport.md)，不改原提案。A 是契約、語意核心、conformance 與 memory binding；B 是第二個生產 MQTT binding，不等於南向 MQTT adapter。裁決與工時都是審查意見，不是實作完成證明。第三方資料僅沿用 2026-10-10 的本地 facts，保留原文、摘要及未查證等級；本次沒有網查、PoC、硬體或 repository 程式執行。採 host inherited default，沒有可控制的 high effort，沒有 nested agents。

## 1. 逐條裁決

每列種類增量指新增外部元件，對照本附件共同底座；自有契約、更新流程及配置工件另列於 §5，不能當免費。跨 lens 的工時共享，不可把 49 列相加；時鐘包含持續回歸與維運頻率，不是只有首次開發。未驗證的利用鏈不當成既成事故，但不因此略過隔離修補。

### 安全

| finding ID | 嚴重度 | 裁決 | 理由與來源 | 具體修法 | 種類、人週、時鐘 |
|---|---|---|---|---|---|
| [security-01](security.md#L11) | 重大 | 接受 | 原 §3.1 的 topic/path 檢查不足以證明發布歸屬，違 N-05；PUBLISH 欄位的 normative 說法仍未查證，不作必要前提。 | A 所有物件驗來源簽章與授權；B topic 用穩定 serial，path 只是路由屬性；同版異值拒絕。 | +0 種，使用共同 crypto；1-2 人週；每版跨身分回歸。 |
| [security-02](security.md#L23) | 重大 | 部分接受 | 共用 process 的耗盡與持鑰面成立；[broker 修補紀錄](../../10-facts/mqtt-brokers.md#L31) 不證明所述 RCE 或必然讀到 issuer 私鑰。 | raw/n 分 process、UID、資源與網路權限；解析器不持上游鍵；cfg、credential、rev 固定 HTTPS。 | +0 外部種、按需 +2 broker process；1-2 人週；每版隔離驗收。 |
| [security-03](security.md#L34) | 重大 | 接受 | hello 不能授權後續任意內容；[TLS 終結轉述](../../10-facts/transport-through-networks.md#L38) 與 F-48/N-05 支持逐物件驗證。 | desired/SQ 由受限業務簽署者簽，actual/CQ/meas/evt 由來源簽；pin 應用公鑰；本版 inspection 無保密退路時阻擋部署。 | +0 種；1-2 人週，納入 PKI 包；外審日曆 3-5 週。 |
| [security-04](security.md#L46) | 重大 | 接受 | 原 §3.6 沒定跨 parent 撤銷、效期及重複身分仲裁；F-19 的 re-plug 不可重生權限。 | issuer 以 env/tenant/serial/key_id 撤銷並扇出所有 bridge；7 天 cert、15 分鐘管理 lease；adopted serial 永久禁 bootstrap，重複 session 隔離。 | +0 種；1-2 人週；每版 re-plug，120 秒更新撤銷。 |
| [security-05](security.md#L58) | 重大 | 接受 | 環境 CA 名稱不等於 N-04；原 §2/§3.6 缺 trust pin、私鑰保管及 staging 防線。 | 離線簽署 provisioning manifest 綁 tenant/env/serial；tenant 中繼、獨立 issuer UID、加密私鑰 escrow；staging 不掛載 prod secrets 且封 prod egress。 | +0 外部種、+1 金鑰保管工件；1-2 人週；季度還原演練。 |
| [security-06](security.md#L67) | 重大 | 接受 | localhost 只修 B-10 的暴露面；原 §6 的 pointer 仍可指向不同內容，違 F-48/F-60。 | 簽章 manifest 綁文件與每個媒體 digest；node 取 parent-relative resource，backend 禁任意 URL；live board 僅同源核准資源。 | +0 種；1-2 人週，與 D-01 共用；每版換檔/redirect 測試。 |
| [security-07](security.md#L76) | 重大 | 部分接受 | HMI 讀 raw 與身分映射缺口成立；共用帳密普及程度、client-id 頂替及 dynsec 綁定細節未查證。獨立 port 本身也不證明來源。 | 一設備一帳號，明確 username/client-id/topic 對照；不能獨立認證者須實體或 L2 隔離並標低信任；HMI 只讀 node 投影。 | 共用 MQTT +2 種，不能另重算；首款 1-2 人週；每款及 broker 升版重驗。 |
| [security-08](security.md#L85) | 次要 | 接受 | N-03 resolver、token 位置、巢狀樹 consumer scope 未定。 | 單一 resolver 從服務專用 tmpfs 取解封 secrets，缺鍵拒啟；token 僅 header；按 registry 的穩定資源集合授權，不靠一層 wildcard。 | +0 種；0.5-1 人週；每版無鍵/跨產線測試。 |
| [security-09](security.md#L89) | 次要 | 接受 | 原 §3.2/§3.6 未封閉 CSR、nonce 次序與 N-14；私鑰不得經任何 slot。 | unit 本地產 operational key；parent 先送有簽章的 nonce，雙方簽完整 transcript；時間無效不開正式 session，保留 last-known-good。 | +0 種；1 人週，與 PKI 共用；每版重放/壞時間測試。 |
| [security-10](security.md#L93) | 次要 | 部分接受 | 缺修補 SLA 成立；「無 advisory 餵送」不能推出沒有流程，[SECURITY.md 紀錄](../../10-facts/mqtt-brokers.md#L24) 指向 Eclipse。persist-sqlite crash 利用未查證。 | 不載 persistence plugin；監看官方流程及 ChangeLog；非 admin 禁 $CONTROL；重大可利用缺陷 24 小時隔離、7 天修補或停服務。 | +0 種；0.5-1 人週；每週安全追蹤、每季生命週期查核。 |

### 十年維運

| finding ID | 嚴重度 | 裁決 | 理由與來源 | 具體修法 | 種類、人週、時鐘 |
|---|---|---|---|---|---|
| [longevity-01](longevity.md#L15) | 重大 | 部分接受 | 漏 HTTP/crypto、契約治理成立；但不必預裝 MQTT 於全 fleet。原 §9「node 不改」才造成這個假前提。 | A 不打包 MQTT；B 以同版簽章加值套件安裝，納入版本矩陣；產品團隊仍負 client 的全域時鐘，§5 重算完整底座。 | HTTP/crypto/TLS 三個庫時鐘入帳；1 人週；每次 BOM/發行檢查。 |
| [longevity-02](longevity.md#L26) | 重大 | 部分接受 | 兩個發行週期就刪不成立；但有可靠 OTA 與遷移證據時不必等硬體壽命結束。 | 由 issuer-owned desired/transport 指定切換，保留 HTTPS 管理；單一 active generation、先對帳再切換；全 fleet 零依賴連續 90 天才刪。 | +0 種、+1 遷移工件；2-3 人週；每季 release 及 90 天退出觀察。 |
| [longevity-03](longevity.md#L34) | 重大 | 接受 | slot/ACL/角色混版確為額外軸；原 §3.1 的抽象不能令 binding 差異消失。 | parent 先升；hello 協商 schema/slot class；未知類別回應用拒收，無 receipt 為 unknown；B ACL 保留在用舊版聯集。 | +0 種；1-2 人週；每版跑角色、schema、binding 矩陣。 |
| [longevity-04](longevity.md#L42) | 重大 | 接受 | N-09 與 F-33 的 owner 仲裁不足，不能由 ERP 顯示鏡像恢復 issuer 權威。 | 明定 registry 是管理中心的 durable owner；SQLite 一致備份、金鑰另 escrow；restore 隔離對帳、簽新 epoch 後才解凍。 | +0 種、+1 還原工件；2 人週；每日備份、季度演練。 |
| [longevity-05](longevity.md#L52) | 重大 | 接受 | 管理 hop 依賴 broker 的風險成立；[MQ9](../../10-facts/mqtt-semantics.md#L36) 只證明權限撤回會影響 retained，並非每次換 cert 都消失。 | HTTPS 管理常駐；broker 無耐久資料依賴，不用 persist-sqlite；同身分換 cert、換身分及 ACL 撤銷分測。 | MQTT +2 種由觸發站點共付；1-2 人週；每版/每次輪替回歸，LTS 未查證。 |
| [longevity-06](longevity.md#L61) | 次要 | 接受 | 原 §9 的替換估算漏 ACL 審查與 fleet 雙運行。 | broker 設定 adapter 與固定 conformance 介面；替換估 3-5 人週另加審查；HTTPS 換線保留舊版至遷移完成。 | 替換產品重核種類/BOM，不預稱 +0 種；3-5 人週；外審 3-5 日曆週、遷移窗口另計。 |
| [longevity-07](longevity.md#L68) | 次要 | 接受 | 四種封包不等於可維護 client；原 §8.5/§9 的自製退路低估狀態機與安全成本。 | 刪除自寫 MQTT parser 退路；依固定版本相容測試換成熟 client，或停 B 回 HTTPS；不把 amqtt 當未驗即用的替代。 | 替換同類庫不淨增種；2-4 人週估算；每版互通、安全審查另計。 |
| [longevity-08](longevity.md#L75) | 次要 | 接受 | Odoo/Grafana/Anthias 授權及支援線空白不能宣稱 M-05 已過；原 §2 的未查證仍保留。 | 發行 BOM 逐項附 LICENSE/支援截止日；缺證據阻擋新增交付；Grafana 在已核支援截止前升版，不用年度口號代替。 | +0 種；初核 0.5-1 人週、Odoo 大版 2-4 人週；每月支援窗口檢查。 |
| [longevity-09](longevity.md#L82) | 次要 | 接受 | root/intermediate 的生命周期不能靠短效 leaf cert 代替。 | 設計值：root 15 年、中繼 2 年、提前 90 天輪替；新舊 anchor 雙簽交接，保存 key_id 與撤銷歷史，離線過窗裝置走現場恢復。 | +0 種；1 人週；年度信任輪替演練。 |
| [longevity-10](longevity.md#L89) | 重大 | 接受 | 沒有更新通道，原 §9 的可逆性不成立；[Mender client](../../10-facts/precedents.md#L40) 的存在不證明本案已整合。 | 選自有簽章 release 協調器與獨立 recovery helper；inactive slot、健康確認、A/B rollback，狀態分區不回滾；OS/player 一併列映像責任。 | +0 外部種、+1 自有更新工件/helper；3-5 人週；每版 canary、季度斷電回滾。 |

### 正確性

| finding ID | 嚴重度 | 裁決 | 理由與來源 | 具體修法 | 種類、人週、時鐘 |
|---|---|---|---|---|---|
| [correctness-01](correctness.md#L11) | 重大 | 接受 | owner 名稱沒有定提交點，F-46/F-67/C-20 的兩端崩潰反例成立。 | 業務變更與 SQ/outbox 同 ERP 交易；inbox、CQ 關聯與 cursor 同交易；全部網路在交易外，ERP 停機不聲稱受理。 | +0 種；1-2 人週；每版提交前後故障驗收。 |
| [correctness-02](correctness.md#L17) | 重大 | 接受 | CQ 查無不能推出實體效果未發生；[結果快取先例](../../10-facts/precedents.md#L42) 不是原子動作證明。 | A 必做原子 claim；backend 接受原 key 且耐久查結果，否則改 state intent；不可查的已開始工作保持 unknown，禁止自動重做或換 key 規避。 | +0 種；2-3 人週及每 backend 對接；每版 effect/CQ 斷電測試。 |
| [correctness-03](correctness.md#L23) | 重大 | 接受 | [MQ14](../../10-facts/mqtt-semantics.md#L53) 區分應用回應；原 B 沒有 parent 耐久 receipt。NATS [N8](../../10-facts/nats.md#L28) 不能免除 fsync。 | A 定可重讀 receipt 綁事實與 store generation；B 專用 signed receipt topic，PUBACK 不清 outbox；撤回 NATS 映射已確認。 | +0 種；1-2 人週；每版 broker 活/node 死及斷電回歸。 |
| [correctness-04](correctness.md#L31) | 重大 | 接受 | 410 後只取 desired 會漏仍有效 SQ；[list/watch 先例](../../10-facts/precedents.md#L44) 不能代證本案完整。 | 快照含授權 desired/SQ/CQ/schema/rev/evt、tombstone 與 watermark；B 以 inventory 對帳部分缺漏，不靠空集合觸發。 | +0 種；1-2 人週；每版八天 cursor 加新 SQ 測試。 |
| [correctness-05](correctness.md#L37) | 重大 | 接受 | F-50 的 timeout 只是觀察狀態；不能取消舊工作或放行衝突工作。 | ERP 單飛搭 unit 耐久執行序號；相依工作須前項 backend 終止證據；過期未開始才拒絕，晚到 CQ 與 timeout 記錄並存。 | +0 種；1-2 人週；每版晚到/並發回歸。 |
| [correctness-06](correctness.md#L43) | 重大 | 接受 | CQ body 的 retention 不等於永久去重；原 §4.2 缺刪除傳播。 | 結果 body 與生命週期 dedupe floor/例外索引分離；SQ tombstone 確認後清快取；未知舊 key 拒絕執行；配額滿停受理。 | +0 種；1-2 人週；每版 GC/舊 SQ 回放、每日容量告警。 |
| [correctness-07](correctness.md#L49) | 重大 | 接受 | 還原後盲採最大 version 或重用舊號均可重現 B-03。 | 事實含 owner_epoch/version/digest；restore 先停寫、核對權威日誌與實體結果，再簽 recovery epoch；鏡像不自行取得 owner 權。 | +0 種；1-2 人週，與 N-09 共用；季度跨 owner 還原。 |
| [correctness-08](correctness.md#L55) | 重大 | 接受 | received 不等於 applied；同版 deferred 不再重試會違 F-54，取錯版本違 F-60。 | received/pending/applied 分開；已驗且讀回 applied 才 no-op；暫時失敗重試同版，拒絕附原因；全媒體就緒才切版。 | +0 種；1-2 人週；每版斷網、錯版本、重啟讀回。 |
| [correctness-09](correctness.md#L61) | 重大 | 接受 | F-02 的來源時間也可能無效；未來 heartbeat 不能保持假在線。 | observed_at/received_at/time_quality/boot_id/monotonic 分列；偏差超界隔離，校時跨區間不混算；T1 無採樣時間明標未知。 | +0 種；0.5-1 人週；每版零時間/跳時，持續 skew 告警。 |
| [correctness-10](correctness.md#L67) | 重大 | 接受 | 跨 slot 無序與獨立 status 無法保證 F-31/F-32；[MQ18](../../10-facts/mqtt-semantics.md#L65) 也不替 host 拒收。 | 批次含 schema_rev/quality；schema 耐久確認後才送；未就緒拒收但 sender 保留；舊 schema 跟積壓 pin，未知 capability 不放行。 | +0 種；1-2 人週；每版混版/先資料後宣告。 |
| [correctness-11](correctness.md#L73) | 重大 | 接受 | 跨 SQLite/PG 先記去重會丟資料；[F-13](../../10-facts/postgres-timeseries.md#L41) 只說明全量 refresh，未解晚到。 | PG 同交易寫 source/batch_id 去重鍵與 rows；拿 store receipt 前保留 spool；晚到 bucket 標 dirty 並冪等重算。 | +0 種；1-2 人週，含於 writer 包；每版提交故障、每日 roll-up 水位。 |
| [correctness-12](correctness.md#L79) | 重大 | 接受 | 自發事件沒有 ERP SQ，原 CQ 白名單必擋；F-03/F-67 不容直接放寬全部 CQ。 | 獨立 evt/source/event_id 類別、來源 schema 與消費 receipt；CQ 仍須匹配 SQ；沿用 put/list，不加控制通道。 | +0 種、+1 schema 工件；1-2 人週；每版離線批次/重複事件。 |

### 情境擬合

| finding ID | 嚴重度 | 裁決 | 理由與來源 | 具體修法 | 種類、人週、時鐘 |
|---|---|---|---|---|---|
| [scenarios-01](scenarios.md#L42) | 重大 | 接受 | F-41 只有 outbound 方向，不提供 proxy 帳號或 CONNECT；[T13](../../10-facts/transport-through-networks.md#L51) 的正向緩衝未查證。 | profile 明列 proxy 地址、認證 resolver、CA、root FQDN 與 no-decrypt 規則；診斷 407/TLS/timeout，能強制短請求退路。 | +0 種；0.4-0.8 人週/profile；客戶 IT 等待另計，出貨逐站驗收。 |
| [scenarios-02](scenarios.md#L46) | 重大 | 接受 | D-01 文件驗 hash 不表示媒體已存在；F-55/F-57/N-11 仍缺就緒屏障。 | manifest 列全 asset、大小及 hash；逐跳預取、原版 pin、新版缺件回報 pending；後端完成換頁才回 actual。 | +0 種；1-2 人週，與 security-06 共用；每版斷線播放。 |
| [scenarios-03](scenarios.md#L50) | 重大 | 接受 | watch 不是工單 producer；F-63 需要 ERP 業務投影，不假設已有 [Odoo connector](../../10-facts/buy-options.md#L92)。 | ERP 在工單提交時更新 work-centre projection/outbox；站點 B 拉下資料與本地頁面，5 秒 JSON 讀取含 idle/freshness。 | +0 種；1-2 人週；每次 Odoo 移植及無 Apply 更新測試。 |
| [scenarios-04](scenarios.md#L54) | 重大 | 接受 | 校時不能重建不存在的採樣時間，F-02/N-14 缺口成立。 | 壞時間區間不入有效歷史或標隔離品質；校時後開新 interval，Grafana 顯示缺口而非收到時刻補值。 | +0 種；0.4-0.8 人週，與時間包共用；每版重開機/跳時。 |
| [scenarios-05](scenarios.md#L58) | 重大 | 接受 | D-03 地址不是 instrument profile；F-22/F-32 要求穩定識別與先宣告。 | profile 定 register、signedness、scale、單位、serial、RTU bus/address；換表核對後啟 writer，以負差壓及 timeout 驗收。 | Modbus 庫 +1 種；流程 1 人週、首 profile 0.4-0.6；每款/每次 firmware 變更核對。 |
| [scenarios-06](scenarios.md#L62) | 重大 | 接受 | 單裝置 CQ 不證明多 U 原子 show，F-44 不准偷加網路時限。 | 單 controller 擁有本地 timeline；多 U 明定非原子，ERP 逐成員列 applied/refused/unknown 並顯示部分套用，不能報整體成功。 | +0 種；0.4-0.8 人週；每版部分離線測試。 |
| [scenarios-07](scenarios.md#L66) | 重大 | 接受 | child-owned cfg 不可被管理者覆寫；原 §6 的簽章未解 F-33 的設定 owner。 | issuer/registry 寫 desired/mgmt，unit 寫 actual/mgmt；僅 site/parent/enabled_functions 等白名單，UI 顯 applied_revision；卡權與門鎖排除。 | +0 種；1 人週；每版管理設定/越權測試。 |
| [scenarios-08](scenarios.md#L70) | 重大 | 接受 | broker 與 topic 不是可離線開機的 HMI；D-06 要本地畫面、認證與品質。 | 交付本地 HTML/JS HMI 包，由 B 供頁及 scoped session；離線唯讀授權最長 7 天，過期鎖讀；metric 投影與更新 SLO 見 §4。 | 重用既有 browser，+0 種 runtime；1-2 人週；逐 PLC/HMI profile 斷 WAN 冷啟動。 |
| [scenarios-09](scenarios.md#L74) | 重大 | 接受 | N-07/N-13 必須有 port/stop/readiness 責任；B-13 不因改 packaging 消失。 | root 與 ERP 綁不同地址；單一 supervisor 管 stop marker，reboot 尊重停機；分報 node、player、同步健康。 | 共用部署底座，+0 種；0.6-1 人週；每版 crash/reboot/deliberate stop。 |

### 生態

| finding ID | 嚴重度 | 裁決 | 理由與來源 | 具體修法 | 種類、人週、時鐘 |
|---|---|---|---|---|---|
| [ecosystem-01](ecosystem.md#L7) | 重大 | 接受 | T1 不懂 A 的重送；[MQ11](../../10-facts/mqtt-semantics.md#L43) 的 queue 丟棄不能由 unit outbox 補回。 | 每款提供 identity/topic/schema/time/replay 對照；在 ingress 耐久前明列可能遺失，無 sequence 只能顯缺資料，不能虛算丟失筆數。 | 南向 MQTT 共 +2 種；首款 1-2 人週；逐廠牌版本驗收。 |
| [ecosystem-02](ecosystem.md#L13) | 重大 | 接受 | 向上 put 不會自動變成本站正式 last-value；F-04/N-11 要獨立本地投影。 | B 的 projection worker 先驗簽/schema，再以每 metric 的 observed time/seq 更新本地值及 n/view；遲到批次只補史不倒退畫面。 | +0 種；1-2 人週，與 HMI 共用；每版斷雲/來源停送。 |
| [ecosystem-03](ecosystem.md#L19) | 重大 | 接受 | token 不等於完整讀取契約；[e17](../../10-facts/precedents.md#L44) 包含快照與續接。 | read-only schema/snapshot/watch；產線 scope、撤銷、配額、lag/gap；PG 用獨立 role/view，MQTT ACL 不授予 DB 權。 | +0 種；1-2 人週；每版新 consumer、慢讀者/越權測試。 |
| [ecosystem-04](ecosystem.md#L25) | 重大 | 接受 | [MQ17](../../10-facts/mqtt-semantics.md#L64)、[MQ19](../../10-facts/mqtt-semantics.md#L66)、[MQ20](../../10-facts/mqtt-semantics.md#L67) 定了獨立 topic/BIRTH/session 規則。 | 有需求才交 ingress Host 與 egress Edge Node adapter；alias/seq/bdSeq/BIRTH/DEATH 狀態分開；隔離允許 Rebirth，禁止致動 NCMD/DCMD。 | 編解碼庫至少 +1 種，依 BOM；2-4 人週；逐角色互通及升版測試。 |
| [ecosystem-05](ecosystem.md#L31) | 重大 | 接受 | [dynsec](../../10-facts/mqtt-brokers.md#L28) 不是普通 client 可要求的權利；T-c 不保證管理權。 | IT 簽 namespace、認證、quota、開通/撤銷責任表；無管理權只作獲准資料 export，unit 留 HTTPS；不要求客戶 broker 有 outbound bridge。 | +0 自管 broker 種，client 仍 +1；0.5-1 人週/客戶；IT 排程及每次 ACL 變更。 |
| [ecosystem-06](ecosystem.md#L37) | 次要 | 接受 | 換傳輸不保留 NGSI 查詢語意；[Smart Data Models](../../10-facts/buy-options.md#L84) 可另評，但不是即插即用。 | 列 NGSIv2/LD 不相容清單；具名需求才做單向 model mapping，保留 id/型別/單位與演進；核對 CC-BY 實際義務。 | +1 自有模型工件、無必增引擎；1-2 人週/首模型；每次 schema/授權變更。 |
| [ecosystem-07](ecosystem.md#L43) | 次要 | 接受 | [OPC UA 記錄](../../10-facts/zenoh.md#L82) 只有摘要，不能證明目標 PLC 或 HMI 接得上。 | 先收 endpoint/payload/register map；Client/Server 用唯讀 backend，PubSub 用 adapter；保存來源時間、型別及 quality，不加第三 binding。 | 選定 library 才加至少 +1 種；界定 1 人週，實作另估；資料未交則該 profile 阻塞。 |
| [ecosystem-08](ecosystem.md#L49) | 重大 | 接受 | T-a/b/c 只證明資料整合需求；[先例成本缺口](../../10-facts/precedents.md#L102) 不支持 B 已回本。 | 與相同 broker、schema、隔離、HMI 而 unit 仍 HTTPS 的基線比較；以具名少寫的 adapter/IT 工作或 SLO 改善決定 B，不限 fan-in。 | +0 種；0.5-1 人週設計比較，B 開發另列；每次啟用/季度續留審查。 |

## 2. 修訂契約 A

本節取代原 §3.1、§4.1-§4.3 的充分性宣稱。管理中心是 ERP UI 加 bridge 0 registry：binding 由 registry 耐久持有，ERP 先取得該筆提交證據才建立顯示紀錄；重送 Manage 使用同一 request key。業務 desired、SQ 與單飛排程仍由 ERP 擁有，不採 interim 將排程移給鏡像的建議。unit 擁有自己的 actual、CQ、量測與事件，bridge 只能代言已登錄 T1；cfg 保持裝置報告，管理設定另用 desired/mgmt，避免兩個 writer 搶同一事實。

命令受理是本地交易，不是網路回應。ERP 業務與 outbox 同時提交才顯示已受理；結果、命令關聯、消費水位也一起提交，漏回覆便重讀。裝置先以唯一鍵原子 claim，再交給獨立 worker，長工作不能阻塞 watch、心跳或其他 function。claim 只防同時啟動，不證明實體動作成功。backend 必須持有同 key 的執行紀錄，並在效果與紀錄間提供可恢復、可查詢的保證；可宣告的操作優先改為冪等收斂。

若動作已開始、CQ 尚未落盤便斷電，running 不代表未執行。重開機只可查 backend 證據；沒有證據就持續 unknown，禁止自動重做、禁止改發新 key 規避，也不能以 deadline 解除相依工作的單飛。操作者須核對實際狀態或確認工作已停止，留下處置依據才准後續衝突工作；無法核對則保持阻塞。timeout 是 ERP 的觀察逾時，晚到結果可補終態但保留逾時軌跡。這是 A 的必要代價，即使永遠不出貨 B 也要付；不宣稱任意實體效果 exactly-once。

每份事實以穩定身分、owner epoch、version 與 digest 辨識，path 改變不改身分。同版異值是衝突，不回成功；只看到較大 version 不能證明某個 CQ 或批次已存。owner 先耐久、parent 落盤後才簽 receipt；receipt 只證明保管責任，不證明工作完成。owner 按清單重送及對帳，不設逐命令 poll loop；恢復舊庫會改 store generation，使舊 receipt 不能掩蓋新缺口。ERP 對 CQ 的消費確認與 history store 的 receipt 才能解除對應資料的保留責任。

watch 的全量必須真是全量：在同一 snapshot watermark 下列出所有授權類別及 tombstone，再接其後增量；快照過期重新開始，不能把看不見當刪除。schema 與 capability 有版本屏障，sender 得到耐久宣告確認才送資料；晚到批次攜當時的品質與 schema，舊定義保留至積壓排空。received/pending/applied 分開；同版只有已驗證套用才 no-op，deferred 可以退避重試。所有 LED job 都走同一結果關聯，不只 ledConfig，空 capability 不等於接受一切。

### 耐久與保留設定

下表是 A 的設計預設，不是已跑通的設定。容量先到亦不得靜默丟業務結果；每窗都有 oldest-age、容量、gap/drop 範圍及無法重讀的告警。簽章有效的舊資料也須通過 epoch、授權及去重檢查。

| 物件與 owner | 提交、保留及刪除規則 | 故障行為 |
|---|---|---|
| desired/SQ：ERP | durable SQ/outbox 與業務同交易；deadline 預設 24 h、上限 30 天；最新 desired 永久；SQ 未決不 GC，終態審計至少 90 天。 | 過期未開始才可拒絕；timeout 不取消實體工作，未決索引不因 UI 審計過期消失。 |
| claim/CQ：unit | state SQLite 要求 WAL、synchronous=FULL；commit 後才 receipt。CQ 至少保留最近 200 筆的集合與未滿 30 天的集合；未獲 ERP 消費確認者另 pin。具體 SQLite/儲存裝置保證未查證，須斷電驗收。 | 每 unit 業務狀態預算 256 MiB，80% 告警、滿額拒收新 job；不得以清除未知結果換空間。 |
| dedupe/撤銷 tombstone | 每執行域保存單調序號 floor 與未決例外，持有至 unit 退役；SQ 清除通知由鏡像確認，B 同步刪 retained SQ。 | 只准當前 epoch 授權的新序號；未知舊 key 拒做；還原不能回退 floor。 |
| CQ 鏡像：各 parent | 結果保留 90 天，未被最終消費者確認者 pin；receipt 綁完整事實鍵、digest、parent 身分、store generation。 | PUBACK/HTTP 傳輸成功不清結果；鏡像不足不能虛稱 unit 原結果已保存。 |
| meas：unit、每跳 B、writer | 每跳 72 h，unit 1 GiB、B/writer 各 4 GiB 上限；最終 PG 以 source_id/batch_id 去重，鍵與 rows 同交易。 | 時間或 bytes 先到可丟最舊量測但記 gap；晚到 bucket 90 天內自動重算，更晚隔離待人工重算，不忽略已接受資料。 |
| evt：來源與 ERP inbox | 獨立 event_id，不冒充 CQ；來源 30 天/256 MiB、bridge 90 天/1 GiB，ERP inbox 業務重播 2 天，業務事件表至少 90 天，消費確認才解除來源 pin。 | 高水位背壓；封閉 T1 無重播能力則明列遺失風險；D-05 法定保存要求未查證，未核不得交付出勤承諾。 |
| snapshot/watch：parent | 變更紀錄 7 天；快照 lease 30 分鐘；涵蓋 desired、SQ、CQ、cfg/schema、mgmt、rev、evt 與刪除標記。 | 410 重取快照；慢 consumer 每個 stream 緩衝上限 16 MiB，滿額回 gap/resync，不拖垮來源。 |
| 文件與 schema | manifest/全媒體驗 digest 後切版；目前與 last-known-good 永久 pin；未引用舊資源 30 天後可 GC；schema 跟引用批次保留。 | 磁碟不足拒絕新 Apply，不能清掉唯一可播版本；同版 deferred 仍可重試。 |
| 心跳與授權 | 心跳 120 秒、offline 5 分鐘；可信時間偏差預算 60 秒；每物件驗 revoked/lease，lease 最長 15 分鐘。 | 未來/無效時間不延長在線；授權過窗停新命令與管理，但裝置既有安全行為繼續。 |

## 3. 身分與還原

本節取代原 §3.5-§3.6。簽章強制涵蓋雙向物件，不只 hello；信封綁 env、tenant、serial、function、owner、epoch、slot、version、digest、issued_at、expiry、schema_rev 與 key_id。驗證者從已 pin 的信任鏈及 registry 判權，不能由 topic 名稱或 payload 自稱 owner 得到權限。中間 bridge 保留 T2/T3 原簽章，不重簽成自己的讀值；T1 則明標橋接觀測與來源品質。合法裝置仍能對自己的讀值說謊，簽章證明來源，不證明物理真實。

握手先由 child 請求 challenge，parent 回簽一次性 nonce 與雙方身分，再由 child 簽相同 transcript；nonce 使用後失效，未完成 challenge 60 秒失效。正式 session 之外的資料仍逐物件驗證，不能拿簽過一次的 hello 當永久通行證。時間無效時只准受限診斷及現場安全校時，不跳過 TLS 驗證換取連線。無可信時間源的安裝不通過 N-14；既有播放可繼續，但不承認新鮮量測或接受新命令。

| 鍵或狀態 | 產生、保管與 pin | 輪替、撤銷與恢復責任 |
|---|---|---|
| factory root / provisioning | factory 離線私鑰；裝置預置公鑰。簽署 manifest 綁 env/tenant/serial、許可 parent 與應用 anchor；factory 身分本身不授予任意 tenant adopt。 | 製造責任人核對 QR/序號；每次重新歸屬需新的簽署授權，不是 TOFU。 |
| operational unit/bridge keys | 本機生成私鑰、送 CSR；issuer 只回 cert。T2 私鑰以裝置專用加密 secret 檔保管，解封至 UID 專用 tmpfs；T3 綁硬體鍵的實作未查證。 | cert 7 天、第三天開始帶 jitter 續期；key 不進 SQLite、retained、URL、log。T2 可被 root 複製是殘餘風險。 |
| issuer / 業務簽署鍵 | 唯一 issuer 在 B0，tenant 中繼受 env 限制；獨立 UID/受限 IPC。業務簽署鍵與 CA 分離，只簽 ERP 已提交且通過 Apply/Publish 權限的物件。 | root 15 年、中繼 2 年，提前 90 天雙 anchor 過渡；輪替包須現任與新鍵共同確認，不接受任意 alg 降級。 |
| resolver / escrow | 一個 resolver 解封加密 secret 檔，缺鍵 fail closed；解封材料由 ops 安裝，不含於應用備份。CA 與必要恢復鍵另加密離線 escrow，雙人解封。 | operator 不從 staging 匯入 prod secrets；備份只含公鑰、key_id、信任及狀態引用；失去 escrow 只能重新佈建，不假裝可自動恢復。 |
| adoption / revoke / lease | registry 保存 adopted serial、單一 parent 授權及永久撤銷紀錄；bootstrap 在所有 binding 一致禁用。簽章撤銷表每 120 秒更新，管理 lease 最長 15 分鐘。 | 收到 revoke 立即拒收並斷管理 session；無新鮮 lease 停新 dial/命令，恢復時先對帳。離線不保證即時收到撤銷，更不因 rejection 自動 wipe。 |
| consumer / HMI / proxy secrets | 產線 scope token 僅放 header，不寫 URL；瀏覽器以本地 session 取資料，不內嵌長效 bearer。proxy 帳號僅對 IT 指定 proxy 使用，非 IoT 身分。 | consumer 撤銷在服務端及快取 lease 檢查；離線 HMI 唯讀 lease 上限 7 天，過期鎖讀；MQTT admin 與一般訂閱角色分離。 |

還原不是把檔案放回去就啟動。每個 node 以一致備份介面保存 SQLite，ERP/history 以一致資料庫備份保存；工具與磁碟 flush 的實際行為尚須驗證。每日加密備份、狀態變更另留簽章稽核 checkpoint，保留 30 個日備份與 12 個月備份；prod 只准從 90 天內備份進入恢復程序，較舊者只供離線查閱。registry、ERP、unit 的恢復都先停寫，不由鏡像最大 version 奪權。

恢復人員核對 registry 的發證/撤銷日誌、ERP 已提交工作、unit 去重索引及 backend 可查結果。缺任何關鍵證據便保留 unknown 或隔離整個身分，不能重放舊 SQ。雙人核准 recovery epoch 後先更新橋接授權，再解凍已對帳的裝置；離線裝置回來也要走同一程序。舊備份若缺最新撤銷 checkpoint，禁止簽發與續期，直至查清或重新佈建。staging 預設無 secrets、連線 archived、prod egress 封鎖；只改 environment 字串不足以消除帶入的 prod 私鑰。

## 4. 部署與產品流程

本節修訂原 §3.4、§5-§6。採納 [../../40-mqtt-ledger/ledger-review.md](../../40-mqtt-ledger/ledger-review.md) 對保密與生態帳的修正。HTTPS 是首版預設，不是任意網路必通的事實。TLS inspection 下的簽章只保真偽，proxy 仍可看內容及 bearer；pin 應用公鑰不會讓 TLS 變成端到端保密。本版要求 no-decrypt/bypass 或無 inspection 的路徑；客戶拒絕且要求對 proxy 保密時，該 profile 阻塞，不以未完成的自製加密協定充當承諾。

在 C-25 的同 L2 環境，host firewall 看不到 peer 間封包。安裝員必須交付 AP/交換器隔離證據，不能用「每 VLAN 一個 bridge」代替。raw/n 與解析器即使分 process，仍要分配 CPU、RAM、磁碟並限制 UID、mount、網路能力；同 hypervisor 的核心失陷仍是共同風險。MQTT broker 不持上游樹私鑰，管理流量一直走 HTTPS，停 raw 不能阻止 revoke 或更新。

| 形狀 | 位置與必要網路規則 | 出貨閘門 |
|---|---|---|
| (a) 同主機 | ERP/PG/proxy/B0 同主機但分 UID/綁址；U -> B0 私有 root TCP 443；B0 -> ERP 私有 queue endpoint；U 不達 ERP/PG。 | 不占既有 ERP 的全部 443；root、ERP internal、ERP public 三個名稱獨立配置，不由 web.base.url 推導。 |
| (b) 分 VLAN | ERP VLAN 放 B0；各 device VLAN 有 B；U -> 自己 B:443，B -> parent:443；按需 U -> n:8883、T1 -> raw 指定 listener、poller -> 白名單 TCP 502。 | VLAN 互拒、bridge 禁 IP forwarding；T1/租戶同 L2 另隔離；D-03 負值 profile 驗收通過。 |
| (c) 雲端 outbound | 每 tenant B0 在雲端；site B 主動連指定 root:443，或經 IT 指定認證 proxy 的 CONNECT；WAN 不新增 site 入站，HMI/page/認證留站內。 | proxy 地址/port/帳號/CA/FQDN/no-decrypt 全列入交付；實測串流與短請求；拒 bypass 的保密 profile 不支援。 |
| 共用服務 | 指定 DNS TCP/UDP 53、有效 NTP UDP 123、按需 DHCP UDP 67/68；backends 僅 localhost/Unix socket；history writer/Grafana 只到私有 PG。 | default deny；client/server timeout 對齊；keepalive 25 秒、hold 上限 30 秒只是起始設計值，短請求可強制使用，有更新不必等滿 hold。 |
| MQTT 觸發站點 | raw/n 分 UID/netns，均關 persistence/plugin；raw topic 用 profile 明列白名單。每實例先配 256 MiB RAM、0.5 CPU、queue 5000/16 MiB，總 host 預留另驗。 | 無匿名、跨 serial、跨產線、非 admin $CONTROL；retained topic 數與回灌受配額限制，配額能力未查證前禁交付該配置。 |

| 功能 | 修訂後可操作流程與結果 |
|---|---|
| D-01 | Apply 交易 -> desired manifest -> B/U 全媒體預取驗證 -> display reconcile/實際讀回 -> actual -> ERP。MES projection 在工單交易更新，不需 Apply；本地頁面每 5 秒取 JSON，顯示 idle/資料年齡，server 記 polling freshness。 |
| D-02 | sensor 獨立 process -> 取樣時間/品質 -> 30 秒平均及持久 spool -> writer/PG -> Grafana；warm-up/壞時間不冒充值；門檻改走 evt，ERP 不收每筆。 |
| D-03 | 操作員選 instrument profile、核 serial/位址 -> schema 確認 -> 通用 Modbus poller -> 有號值/min/mean/max -> history；換表要重新核對而非以 IP 繼承身分。 |
| D-04 | ERP 驗 capability -> SQ/desired -> 本地執行 -> CQ/actual；單 controller 管 timeline，多 U 只承諾逐成員結果及部分套用，parent 失聯保持 standalone。 |
| D-05 | Manage -> registry 提交 -> CSR/cert -> desired/mgmt -> actual revision；身分、存活、有限設定在範圍，卡片權限、開鎖與 wipe 控制不在；evt 另有持久來源與消費確認。 |
| D-06 | PLC/edge -> raw adapter 或受管來源 -> B 的逐 metric 投影 -> 本地 HMI；另一路 <=1 Hz 上行到 PG/MES。PLC 停送要 stale，WAN 斷不凍住本地畫面。 |

消費者先取唯讀 schema 與一致快照再 watch；不用自動建立未知型別，改名也不改 series 身分。本站投影按採樣序與品質選最新值，不以最後到達的舊批次倒退畫面；HMI 只看驗證後投影，不看 raw，也不直接看未驗證 unit publication。T1 沒有原始時間時只標 bridge 觀測時間，無序號或重播能力時只能承認缺資料，不能回填成新鮮讀值。

D-06 第一份 HMI profile 要先與客戶約定來源週期；本地暫定驗收目標是收到可用樣本至畫面更新 p95 小於 1 秒，超過兩個來源週期即 stale，尚未量測。這不是跨網路命令時限。Sparkplug 接入還有 BIRTH、alias、Rebirth 等角色工作；OPC UA 需先拿到 PLC 介面。這些都不由 B 自動提供。已有 broker 可以是採 B 的理由，但比較必須保留相同隔離、schema、投影及 HMI，才算得出真正省下什麼。

## 5. 完整元件與妥協

以下重列原 §2 元件表，保留所有原列並展開隱藏依賴。A 發行只含 HTTPS/memory；B 套件不是預裝免費物件。採 Python 作本次估算基線，不宣稱原語言 PoC 已完成；若改 Rust 必須重算 runtime、庫與交叉建置。表內政策是本案責任，不冒充廠商 LTS。所有未查證授權或支援資訊都列採用閘門，不寫成 M-05 無條件通過。

| 元件 | 自建/外部、角色與取代對象 | 授權與證據 | 種類及維護時鐘/責任 |
|---|---|---|---|
| 契約規格 + conformance + memory | 自有治理工件，放既有 e2e repo；取代 NGSI 作內部契約的角色。 | 自有；不聲稱對外 NGSI 相容。 | 1 獨立工件；兩名審閱者，季度 release，安全例外隨時修。 |
| node：U/B/B0 | 自有同套 code；語意、registry、issuer 受限模組、writer；取代 gateway/south/IOTA/Orion/QuantumLeap/outbound。 | 自有；不能自建 crypto/DB/broker。 | 1 程式種類、多實例；每版契約與 N-17 回歸。 |
| function backends / parser | 自有 display、LED、sensor、Modbus runner 與隔離 parser；保留 F-07，取代未授權網路暴露。 | 自有；外部 sensor/Modbus driver 授權、固定版本未查證。 | backend runner 入帳；Modbus/各 vendor driver 每庫另 +1 時鐘，逐 profile 驗收。 |
| Odoo + iot_* | 外部 ERP 加自有模組，持 desired/SQ、UI、CMS/業務 projection；不替換。 | 現有 edition/模組授權與支援截止未查證。 | ERP runtime、Python/SQL/JS 維護；大版移植 2-4 人週估算，逐 release 核支援。 |
| PostgreSQL | 外部引擎；ERP 已需，history 可選；取代 CrateDB/Mongo 歷史與舊 writer 鏈。 | 本地 [授權彙整](../../10-facts/postgres-timeseries.md#L99)；版本政策 [F-11](../../10-facts/postgres-timeseries.md#L39) 含摘要，非本日查證。 | 1 引擎；history 受控小站可共叢集，估樣本 >10 億或 history >ERP 2 倍須重驗容量/還原，必要時獨立 PG 實例。 |
| SQLite | 外部嵌入引擎；每 node 的 owner/鏡像/索引。 | 固定版本授權及 backup/fsync 行為未查證，不沿用「複製活檔即可」。 | 1 引擎；每日一致備份、季度斷電及 restore。 |
| Mosquitto raw/n | 條件式外部 broker；只有入口或投影可各用一實例，兩者同場須隔離；不持樹憑證。 | [授權紀錄](../../10-facts/mqtt-brokers.md#L22)、[維護紀錄](../../10-facts/mqtt-brokers.md#L23)；實際散布義務、支援線待核。 | +1 種/+1 產品時鐘；1-2 process；每週 security/ChangeLog，季度生命週期。 |
| MQTT client library | 條件式成熟外部庫，先用於 bridge adapter；B 才部署到 unit，不自寫 parser。 | paho/rumqttc 的固定版授權、維護與平台相容未查證，本輪不重引原提案 registry 網查。 | +1 庫時鐘；同一庫不按 unit 數重算，fleet/B 套件矩陣另計。 |
| Grafana | 可選外部 ops dashboard，dashboard-as-code；最小螢幕不裝。 | edition、LICENSE 與實際支援截止未查證。 | +1 runtime/時鐘；每月檢查，在已核截止日前升版；PG 唯讀 role。 |
| Anthias / browser | 過渡外部 player 與 browser，reconcile 留 unit，媒體快取與舊版本 pin。 | LICENSE、維護者與映像內 process 清單未查證。 | 分列 2 種，不藏於「一片螢幕」；每版換頁、記憶體、重啟驗收，C-18/C-19 不假稱消失。 |
| 部署工件 repo | 自有 compose、firewall、proxy、時間、stop/readiness、secret 裝載與 restore profiles。 | 自有；3 形狀及條件配置一併管理。 | 1 repo；逐站 N-18，季度演練；不新增第二套人手設定。 |
| IoT_e2e / IoT_Parts | 自有測試與零件文件/檔案校驗；保留。 | 自有；vendor 檔案授權逐項核。 | 2 repo；每版引用 pin，每款 profile 變更核對。 |
| HTTP / crypto / TLS libraries | 外部串流 stack、X.509/簽章庫、TLS backend，不能把 A 的時鐘填 0。 | 套件/版本/授權與支援政策未查證，BOM 凍結前阻擋交付。 | 至少 3 庫時鐘；使用成熟實作，每週安全追蹤、每版互通。 |
| Python / Linux / supervisor / proxy / container tooling | 外部 Python runtime、Linux、systemd、nginx、Docker、Compose 為估算基線，非已選定可出貨映像。 | 各固定發行物授權與支援未查證；不把既有部署等同仍受支援。 | 6 獨立時鐘；OS/player 與 node 一起排維護窗口，stop 只有一個 owner。 |
| DNS / NTP / DHCP | 站點基礎服務；指定提供者，DHCP 按需，不必自架常駐 CA。 | 實際產品及支援未查證。 | DNS/NTP 2 個服務責任；DHCP 若自管另 +1；安裝員與 IT 共同驗收。 |
| release/recovery helper | 自有更新協調器，獨立於被更新 node；使用交付映像既有開機/切槽工具，不自建 bootloader。 | 既有工具的 A/B/rollback 能力未查證，未通過禁止遠端 rollout；不引入 Mender server。 | +1 自有更新工件/helper；每版簽章、canary、rollback，state partition 不回滾。 |

種類計法修正為顯式下限，不沿用原 10/11/13 排名：引擎 2、維護語言 3、應用種類 5（ERP/node/backend/player/browser）、repo 5、基座時鐘 8（上一表六項加 DNS/NTP）、庫時鐘至少 3、契約與更新工件 2，合計至少 28。這沿用需求「語言、runtime、repo 各入帳」的口徑，不等於 28 個常駐服務；傳遞依賴與 vendor driver 尚會增加。Grafana +1、Modbus 庫至少 +1，MQTT 共 +2；同庫升到全 fleet 增加維運面而不重算種類。與他案比較必須先用相同口徑重算，不能拿此數直接比原稿。

最小螢幕的「兩服務」只保留為中央應用群說法：Odoo 與 B0，仍依賴 ERP PG/proxy；CM4 還有 agent、backend、player/browser、SQLite 與媒體磁碟。沒有 history database、Grafana 或 broker。新增 B 並不省掉 HTTPS listener，raw/n 隔離後也不省投影，因此「全部五項原樣拿回」撤回；retained 與 Will 的工程收益保留，但必須支付 freshness、重建、授權及消費者整合。

### 重列原 §7 妥協清單

| 需求/原主張 | 修訂後妥協 | 換到什麼 | 代價與邊界 |
|---|---|---|---|
| M-02 | A 的庫、規格、更新、隱藏基座全部入帳；MQTT 觸發不是免費 +2 就結束。 | 成本可稽核、產品配置可分期。 | 至少 28 的同口徑底座；條件元件與安全/e2e 矩陣另計。 |
| M-01 | 不再兩 release 無人用就刪；全 fleet 完成遷移且零依賴 90 天才移除。 | 避免離線舊 unit 被遺棄。 | 過渡雙 listener/版本，可能維護多年；未回報裝置須有現場或退役處置。 |
| N-02 / proxy | 撤回 mTLS best-effort 可無條件出貨；本版保密依賴 no-decrypt/bypass。 | 不把 authenticity 冒充 confidentiality。 | 拒 bypass 的 inspection profile 阻塞；不靜默降級，新的加密方案另需審查。 |
| P0 下行一律 pull | child 撥出的串流可 push，保留短請求。 | 較快通知但不承諾 timing。 | 重連/jitter/watchdog/proxy 配置與實測；hold 不是固定延遲。 |
| F-17 | B 的實體對端可以是 broker，邏輯 parent 與授權仍由 node 證明。 | 可利用現有 MQTT 接入工具。 | 所有物件來源簽章、receipt；管理面仍 HTTPS，不能省 listener。 |
| P0 每節點自建 | broker/crypto/DB/browser/bootloader 不自建；自有的是協調與語意。 | 使用成熟零件。 | BOM、授權及維護者時鐘；不採自製 MQTT parser。 |
| F-69 / F-41 | 單 write gate 改 ERP durable queue；single-flight 不移給 bridge。 | outbound-only、業務受理可追溯。 | 交易 outbox/inbox 與結果水位，C-20 回歸必做。 |
| F-27 | 分鐘級 online/offline 不妥協，原「秒級需求」誤標撤回。 | Will/link 只做早期提示。 | 有效來源時間、quality、晚到隔離；提示不得覆蓋 Fleet 判定。 |
| N-13 / F-15 | 不增 history/broker 於最小螢幕，但不再稱完整系統只有兩 process。 | 首客免付可選資料層。 | 真實依賴、磁碟與 readiness 全驗。 |
| M-05 | 不宣稱已無妥協；未核授權不得採用/新增交付。 | 避免把未查證寫成授權通過。 | 按實際版本/edition/散布型態核對；法務/供應商等待另計。 |
| F-46/F-47/F-51 | 不能觀測的已開始動作保留 unknown，停相依工作，沒有無條件 exactly-once。 | 不把重做風險藏成成功。 | 可用性與人工處置成本；永久去重證據及結果窗口。 |
| F-33 / N-05 | ERP UI + B0 registry 為管理中心，registry 是 binding owner；ERP 是業務 owner。 | 一事實一 writer、還原有仲裁依據。 | Manage 先提交 registry 再建 ERP 鏡像；停機不偽稱完成。 |
| T2 即時撤銷 / N-11 | 收到即生效；網路隔離下最多 15 分鐘 lease，不承諾瞬間通知。 | 可量測的暴露上限與安全 last-known-good。 | 過窗停止新命令；此 availability/security 取捨須 owner 核准。 |
| D-04/F-44、D-05、D-06 | 多 U show 非原子；門鎖/卡權/機台致動不走 context。 | 保持本地時序與明確控制邊界。 | 部分套用 UI；控制 fabric 另案，T3/PLC 硬體驗收不能由 stub 代證。 |

## 6. 成本與出貨判別

本節取代原 §9 的樂觀估算。A 的價值不是免費抽象，而是把不可省的正確性與安全驗收集中；B 可延後，資料 adapter 不能被算成 B 獨享收益。下表為不重複相加的工作包預算，沒有歷史專案成本可證實。部署工時另受客戶 IT、設備資料與外部審查等待影響，人週不能直接當日曆週。

| 工作包 | 人週估計 | 種類/時鐘與範圍 |
|---|---|---|
| 原首客 A 基線：3-5 屏與環境 sensor，無 B/歷史 | 25-31 | 沿用原估計，不代表已完成語言 PoC。 |
| 新增 A 交易、unknown、receipt、GC/恢復 oracle | +4-6 | 共用既有 DB/庫；包含重疊 correctness 修法。 |
| 新增 PKI、密鑰分流、隔離與 owner restore | +4-6 | 共用 crypto/部署底座；不含新端到端加密協定。 |
| 新增 OTA/recovery 與 fleet 遷移基礎 | +3-5 | +1 自有更新工件/helper；需獨立於 node 的救援通道。 |
| 新增媒體/時間/三形狀驗收缺項 | +3-4 | 與前列共用，不再累加各 lens 同題。 |
| A 修訂小計 / 外審 | 39-52；另修補 1-3 | 外審日曆 3-5 週；合計工程 40-55 人週估算。 |
| history writer/roll-up/Grafana | 2-4 | 首個需歷史站點；PG 交易與晚到重算含於此包。 |
| 南向 MQTT ingress + 正式投影 | 2-4，首個 vendor profile 另 1-2 | +2 外部種；不是 B；每站配置驗收另估。 |
| B 第二個生產 binding | 6-9，外審增補另估 | receipt、簽章、切換、混版矩陣均含；不再估 3-4 即足。 |
| D-06 HMI / Sparkplug / OPC UA | HMI 1-2、Sparkplug 2-4；OPC UA 界定 1，實作待資料 | 不把未知接口藏成零；對應庫/方言各入 BOM。 |
| 持續維運 | 每季 A 1-2，B 另 0.5-1；Odoo 大版 2-4 | 人週粗估；緊急安全修補與客戶現場作業另計。 |

最便宜的契約判別仍是兩條故障 trace：八天舊 cursor 遇上新 SQ，完整快照必須看到它；backend 已動作但 CQ 未提交，重開機不得第二次動作，必須取得原結果或留下 unknown。它們能否定「A 已完整」的假設，卻不能由本次文件檢查宣稱通過。N-17 的 oracle 要觀察 owner 與實體結果，不是測試只看到 API 成功。

| gate | 必須提供的證據 | 失敗處置 |
|---|---|---|
| G-A 契約 | ERP 提交前後、claim/effect/CQ、timeout/晚到、GC/舊 SQ、同版異值、完整快照、schema 無序、PG 提交與晚到重算；先 memory，再 HTTPS 故障注入。 | 任何已受理工作靜默消失、錯誤完成或不明動作被重做，停止出貨。 |
| G-S 安全/還原 | 跨 serial/tenant 重放、re-plug、lease 過期、假時間、金鑰輪替、三 owner 舊備份、staging prod 斷信任；外部審閱契約與 PKI。 | 未閉合重大風險不以「以後補」豁免；缺 escrow/checkpoint 則隔離或重新佈建。 |
| G-D 部署 | (a)(b)(c) 各以同工件跑六 D-ID 的範圍內 stub 流程；D-01 真換頁、完整媒體、stop/reboot、N-14、proxy/短請求；D-06 斷 WAN 冷啟動與 freshness。 | N-16 stub 不取代 N-18 客戶 profile 與硬體驗收；不通的 profile 不支援。 |
| G-U 更新 | 簽章 artifact、inactive slot、canary、斷電、健康失敗 rollback；保存去重/信任狀態，舊 node 恢復後不得重跑未決動作。 | boot adapter 未證實可恢復就不遠端 rollout；不能靠需升級的 node 自救。 |
| G-B 啟用 | 相同安全與 HMI 基線的增量工時/SLO 證據；broker alive/node dead、部分 retained 缺失、跨代切換、雙 dial 單 active；B0/parent 先升。 | 無淨收益不啟 B；未知結果先對帳，退回 HTTPS 不重做業務命令。 |

切換時 HTTPS 管理下發 desired/transport，unit 回報 prepared；新 link 完成身分、schema、inventory 對帳後才提交 active generation。舊 link 可排空同一鍵的 receipt，但不得再啟工作；失敗回報原 generation，不改 job key。季度發行保留仍在 fleet 使用的能力，雙 reviewer 可拒絕破壞性變更。刪除 binding 的依據是裝置回報、離線裝置處置與 90 天觀察，不是 repo 目錄看起來沒人改。

## 7. 仍然承認的弱點

此點成立：P5 把 owner 與 transport 分開、retained 當快取、Will 當提示、最小螢幕不帶 broker，值得保留。但規格與 suite 同屬一個團隊，可能一起漏掉反例；不能由 49 列都有文字便宣布風險已消失。原 F-46-F-54 只可改判「設計補足，實作未查證」，不進行評分。

不可查的實體動作仍可能永久 unknown；單 hypervisor、T2 可複製私鑰、封閉 T1 的失真與 ingress 前遺失都未消失。inspection 拒 bypass、無有效時間源或 L2 隔離的站點仍阻塞。PLC/register map、T3 硬體、出勤保存規則、player 與其他元件授權/支援、A/B boot 能力尚未查證；未知者不得用未來承諾換成當前支援。

A 與 B 的工時、資源足跡及維運負擔也都尚未量測。完成此附件只補齊裁決與設計責任；下一階段必須有人承擔外審、映像與現場驗收，才能決定是否出貨。這不否定 MQTT 的生態價值，也不把 HTTPS 當免付帳的替代品。