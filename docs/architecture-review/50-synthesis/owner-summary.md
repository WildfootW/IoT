# Owner 版摘要：現在的模型長怎樣、關鍵決策為什麼

> 2026-10-11，主審依 `final.md`（15 節）、六份 `score.md`、`ledger-review.md`、三份 refute 與 `completeness.md` 濃縮。這份只回答兩件事：架構現在是什麼形狀、每個關鍵決策的理由與證據在哪。細節與驗收條件以 `final.md` 為準。

## 1. 現在的模型

**角色與樹**

| 角色 | 持有什麼 | 備註 |
|---|---|---|
| Odoo ERP | 業務真相：desired、SQ、deadline、single-flight、CMS、排序；管理 UI | 不交出 CMS 與業務排序 |
| bridge 0（B0，north） | registry 投影、憑證發行的執行者、consumer API、history writer | registry 只是安全 journal 的投影 |
| 安全 journal（新增） | 每次 adopt / revoke / key / policy / binding / 分類 / 封存世代的決策 | 住在獨立故障域的工作站，不隨業務備份回捲 |
| south bridge | poller、raw feed、validator、本地 HMI 投影 | 每個 device VLAN 或站點一個；第一個 T1 或本地 HMI 出現才加 |
| unit | node agent + 分 process 的 backend（display、LED、sensor、Modbus） | 一屏最小部署直連 B0，不需 south 盒 |

同一支 node release 扮 unit、south、B0 三種角色，但 parser、issuer、writer、update helper 分 UID、分 process。先驗兩層 intermediate bridge，更深要另過驗收。

**傳輸**：每條管理 hop 都是 child 發起的 HTTPS（NDJSON stream 加有限批次），B0 也主動讀 ERP queue。心跳 20 秒、watchdog 70 秒、long-poll hold ≤ 20 秒、jitter backoff 1 到 60 秒。MQTT 不在 unit 與 trunk。MQTT 只在站內南邊的資料面：T1 MQTT 設備 → 每來源一個隔離的 raw feed → validator → node；另有 curated export 與 Sparkplug profile 給 HMI / SCADA。

**三種形狀**：(a) 同主機用 VM、UID、專用 NIC 隔離，不靠新增 south 盒；(b) VLAN 分網、default deny、無 device 到 ERP / DB 路徑；(c) 站點只出 443，可經核准的 proxy，雲端永不向站點發起新連線。

**契約與語意**：owner 持有事實，完成 = 重讀 owner。register（desired / actual）與 job（key + CQ）。事實鍵為 env / tenant / unit / function、authority_epoch、incarnation、revision、schema_rev、digest，path 只是路由。UNKNOWN 永久保留、保鎖、不自動重跑；timeout 不釋放衝突槽。功能分類隨能力變更重判，不明即 Control-Semantic。第一版只有 HTTPS binding，in-memory binding 是測試 oracle。wire major / minor 協商，支援當前與前一 major，12 個月遷移目標。

**身分與 PKI**：裝置產鑰；出廠預置 enrolment 根、recovery 根、env / tenant voucher；bootstrap 只能 announce。營運 cert 7 天、半期續期；過期 30 日內走 recovery route。root 15 年、中繼 2 年、線上用途鍵 90 天。所有下行與上行物件用成熟 JWS library 簽章，信封綁 env、tenant、audience、purpose、epoch、digest、期限。撤銷目標 60 秒內阻止新工作，操作 lease ≤ 300 秒。兩種網路 profile：M（無 inspection 或 no-decrypt）、I（資料 owner 核准 inspection，只准非敏感資料）。敏感資料加強制 inspection 加禁止 bypass 為不支援。時間不可信就不授權；首版明選「有人協助冷啟」。

**資料**：一屏無 history。第一個 history 承諾起用我方管理的獨立 PostgreSQL（同引擎、分 WAL 與備份），north writer，窄表月分區，dirty-bucket roll-up 保存 sum / count / min / max。門檻告警由資料 owner 節點計算，ERP 通知值班者；Grafana 只給 ops。超過 10 億樣本、儲存超 60%、查詢 p95 超 2 秒或恢復超 8 小時才評估替代引擎，不自動切 VictoriaMetrics。

**更新**：node register 式 app 更新（簽章 manifest、沿樹預取、staged、獨立 helper 切換、canary → 小批 → 全站），不裝 Mender。不假裝 rootfs A/B：改到共用依賴就是 OS 更新，走維護窗加現場救援 kit 保底。不可回退的 J（admission、CQ、UNKNOWN、鎖、安全水位）與可重建的 D（投影、id map、快取）分離。

**備份與恢復**：每個 state owner 各自備份；受控 restore 要 nonce 綁最新 checkpoint、重播安全 journal、發新 epoch；雙人復原加第三替補。業務 RPO ≤ 24 小時、RTO ≤ 8 小時待核。

**ERP 邊界**：archive 是派送 gate，每次派送換單用 attempt ticket，STOPPING → ARCHIVED，在途最多 32 秒。超過 5 屏 publish 或批次 revoke 要帶外雙人核。staging 第一封包前自動中和。離線 HMI 登入用預授權 reader directory，快照絕對截止 8 小時、session 15 分鐘。

**相對你最初 PCIe 直覺，保留與丟掉的**：保留了樹、config space（announce）、BDF 對序號的分離（path 只是路由、unit identity 穩定）、function 分類、bridge 圍堵。丟掉的是 posted write（換成 register 與 CQ）、root 主動枚舉（child 撥出）、以及「同一程式等於零維運」。

## 2. 關鍵決策與為什麼

| # | 決策 | 為什麼 | 證據 |
|---|---|---|---|
| 1 | HTTPS 是所有管理 hop 的唯一第一版傳輸；MQTT 只在站內南邊資料面 | (c) 形狀只有跑在 443 上的應用層協定不需客戶讓步；TLS 檢查 proxy 與 mTLS 互斥。MQTT 不給 F-46 / F-47 任何語意，AWS / Azure 都在服務端做。放進 trunk 或管理面會帶來兩條 trunk、broker 持樹憑證、最小部署 3 服務。覆核修正：這是合理的產品選擇，不是已證明的協定優劣；HTTPS 也不保證穿過所有 proxy | `transport-through-networks.md` T1～T5、T15；`mqtt-semantics.md` §5；`ledger.md`；`ledger-review.md` |
| 2 | P2 當骨架，P6 同分卻不選 | 兩案答辯後同為 56。P2 的完整樹、各層 consumer、registry 已是中心；P6 的分期採，但 Stage 0 / 1 把安全延後（hub 不能驗 token、agent 沒有會過期的信任）被判致命 | P2 / P6 `score.md`；P6-security-01、-02 |
| 3 | 端到端簽章提前到全部 T2，信封綁收件者與新鮮度，文件帶雜湊 | 中間節點（bridge、broker、proxy）在 (c) 下不可信。批評找到：簽名信封沒綁收件者可跨 unit 重放；intent 簽了 content 沒簽等於 defacement | P1-security-01、-05；P2-security-03、-07；P3-security-03 |
| 4 | 獨立安全 journal 與受控 restore，新 epoch 不夠 | 舊備份還原會靜默復活已撤銷的裝置；epoch 只防版本倒退，找不回被抹掉的撤銷。有撤銷與無撤銷的兩個世界必須有不同的 state digest | refute-security-correctness-01；P2-longevity-05；P5-security-05 |
| 5 | 不買平台，買零件 | ThingsBoard 4.4 起 BSL：100 devices 加一台 server 在 (a)(b) 第二個站點就撞；gateway 憑證是 tenant 範圍能力，一片 CM4 可替整站說話。NATS 內建 MQTT 只到 3.1.1、advisory 落在要依賴的功能、bridge 上無升級路徑。FIWARE 升版解不掉 C-02～C-10 | P4-longevity-01、P4-security-01、-03；`nats.md` N11、N17；`buy-options.md` §3.3 |
| 6 | 歷史放我方管理的獨立 PostgreSQL，不放客戶叢集、不用 TSL、不自動切 TSDB | 放客戶叢集則大版升級與搬遷沒有 owner；Timescale 的壓縮、continuous aggregate、retention 全在 TSL，撞 M-05；VictoriaMetrics 的 downsampling 與 mTLS 在 Enterprise。用量化門檻取代直覺 | P2-longevity-08；`postgres-timeseries.md` F-3、§3.4 |
| 7 | OTA 用 register 式 app 更新加現場救援保底，不裝 Mender | 沒有 fleet 升級路徑，所有「可逆性」與「時鐘自控」都不成立，被四份批評判致命或重大。Mender 多一個 runtime、server 與時鐘。但不假裝 rootfs A/B，共用依賴變更走 OS 維護窗 | P2-longevity-01；P5-longevity-10；refute-longevity-scenarios-01、-02 |
| 8 | UNKNOWN 永久保留、不自動重跑、timeout 不釋放鎖 | 物理效果與 CQ 提交之間沒有通用原子性（LED 已動但 CQ 未 commit）。B-01 / B-03 / B-08 的根因就是把送達當完成。不可核實的 job 類別不開售 | `final.md` §3.2；所有六份 correctness 批評 |
| 9 | 分類可重判，不明即 Control-Semantic；門鎖與製程控制不入樹 | 任何 IO、韌體、能力變更都可能把 Intent-Only 變成有危險副作用；舊分類授權不能沿用 | completeness GAP-02；D-05 / D-06 原始分類規則 |
| 10 | cert 7 天加 30 日 recovery route，不是 P2 原案的 24 小時 | 農曆年全廠斷電超過 24 小時加無 RTC 的 CM4，會讓全 fleet 每年重新 adopt 一次 | P2-longevity-03；N-14 |
| 11 | archive 是每次派送的 gate，不只是 queue 的 write gate | F-70 的 kill switch 原本只擋寫入；預取與鏡像可以自行派送已簽的內容。在途最多 32 秒是明示妥協 | refute-security-correctness-02；refute-ecosystem-cost-erp-03 |
| 12 | 同主機 C-25 改造（專用 NIC、VM、隔離 switch / AP），不宣布 (a) 已滿足 M-04 | lateral 流量不經 bridge firewall；不能拿新增 south 盒的 (b) 結果冒充同機成功；不准改造的原網仍是不支援 | refute-longevity-scenarios-06；C-25 |
| 13 | Python 對 Rust 未決，7 日比較 PoC 後凍結 | 沒跑過的比較不能宣稱勝負；種類數重算後語言不是區分主軸 | O04；completeness GAP-04 |
| 14 | 不再承諾「一屏兩個服務」，改列中央六角色、屏端四角色加基礎服務，並給 W0 資源門檻 | 所有 longevity 批評都挖出隱藏依賴：Anthias、nginx、OS / Python、DNS / NTP、Docker；種類數從 11 重算到 28+U | P2 / P5 / P6 longevity-01、-02；`final.md` §2.2 |

## 3. 明示不支援與待你拍板

**不支援的部署組合**：敏感資料被強制 TLS inspection 且客戶不准 bypass；不准改造的 C-25 網路。最終版拒絕把這兩種算進「三形狀全過」。

**十項決策 O01～O10**（`final.md` §15.1），最重的五項：O01 inspection 與保密 profile；O02 同主機改造預算與責任；O04 更新路徑與語言；O09 全角色預算（工程 38～56 人週）與至少兩名可接班工程師；O10 離線與封存窗口（操作 300 秒、HMI 預授權 8 小時、archive 在途 32 秒）。

這是完成對抗式審查的設計建議，不是生產批准。PoC、外部審查、BOM 與授權查核、現場驗收都還沒執行。
