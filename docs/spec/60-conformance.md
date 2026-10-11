# v1 實作規格 §6：conformance、e2e、PoC、CI

每個 correctness milestone MUST 綰至少一個 case ID；沒有 case 不算 done（N-17）。conformance suite 跑在 in-memory binding 與 HTTPS binding 上，結果 MUST 相同。

## 6.1 conformance case（CF-）

| ID | 驗什麼 | 通過條件 |
|---|---|---|
| CF-01 信封 | 錯 alg、重複 key、aud 不符、env 不符、nonce 重用、seq 倒退、時間超區間 | 全部 `rejected`，零執行 |
| CF-02 announce | unadopted 只得 parent_time 與 cursor；voucher 錯 tenant 被拒；契約無交集回 incompatible | 狀態與回應欄位精確 |
| CF-03 adopt | Manage 前 trust log 無 entry 則 ERP 無 managed 投影；claim code 錯誤被拒；採納後 voucher 不可重用 | F-33 順序成立 |
| CF-04 desired/actual | 同 version 重送無副作用；舊 version 不覆寫新 version；refused 與 deferred 帶 version | 收斂且無多餘 effect |
| CF-05 job | 同 key 重送回既有 result；executing 中斷電重啟 → `unknown` 持久、不重跑；keyed backend 的 query 能解 unknown | 零盲重做、零靜默消失 |
| CF-06 result log | result 先 fsync 再 complete；ERP receipt 前無 TTL；receipt 後 90 天 | 斷電點 1000 cycles 無遺失 |
| CF-07 watch/cursor | 第一 frame 為 snapshot；cursor 過期回 410 加 gap；8 天 cursor 加新 job 仍收斂；每 120 s 清冊對帳補漏 | 無遺漏 slot |
| CF-08 receipt/spool | 來源只在收到 receipt 後釋放 spool；receipt 丟失時重送同 seq 範圍不重複入庫 | PG 無重複 sample |
| CF-09 revoke | 線上 60 s 內拒新工作；離線 leaf 以剩餘期限為界；簽章撤銷證明 → rejected，無簽章失敗 → unknown | 裝置狀態正確分類 |
| CF-10 rollback 見證 | root node 從舊 trust log 還原、sec_rev 倒退 → fleet 回 `rollback_detected` 並拒 grant；重播到最新後恢復 | 零被復活的撤銷裝置 |
| CF-11 archive gate | 入列、預取後 archive：STOPPING 後零新起跑；在途 ticket ≤ 30 s；ARCHIVED 後 result 仍可回流 | 32 s 界成立 |
| CF-12 update | staged → 切換 → 健康 → committed；健康失敗自動回 previous；J 不回退 | 版本與 J 檢查通過 |
| CF-13 混版 | 新 parent 舊 leaf、舊 parent 新 leaf、前一 major；未知 required feature 明確拒絕 | 矩陣全通 |
| CF-14 branch 類型無知 | 從未見過的 function class 經 branch 原樣轉送，只被 root node 政策拒 | branch 零改動、零拒絕 |
| CF-15 時間 | 回撥、無 RTC 開機、uncertainty > 2 s → 不授權、LKG 續播、q=invalid_time | 零 fresh 標記 |
| CF-16 stand-in | Type 1 代述帶 trust=stand-in；未宣告 attr 拒收計數；Type 1 永無 grant、永無下行 | 零越權 |
| CF-17 window | 每個 window 輸出 owner、年齡、容量、未確認、drop；滿額行為照 §1.12 | 零靜默丟棄 |
| CF-18 線上零秘密 | 抓包所有 hop，比對禁止清單（bearer、密碼、私鑰、解封材料） | 零命中 |
| CF-19 staging | prod DB 還原到 staging：第一封包前 connector 比對 env 不符即 archive | 零 prod 連線 |
| CF-20 doc | pointer 帶 sha256；hash 不符拒用；非當前版本拒（F-60）；LKG 續播 | 零未驗內容套用 |

## 6.2 e2e 情境（E-）

| ID | 形狀 | 流程 |
|---|---|---|
| E-01 | (a) | 一屏：出廠 → 撥入 root node → Manage（claim）→ Apply playlist → 螢幕換頁 → applied version 回 ERP → 斷網 LKG 續播 → 復網收斂 |
| E-02 | (b) | 螢幕加感測盒經 branch；Modbus Type 1 經 poller；量測進 history PG；門檻事件進 ERP；Type 1 VLAN 負向驗收（碰不到 root、碰不到 leaf、碰不到另一台 Type 1） |
| E-03 | (c) | 站點 site branch 經客戶 proxy（含 TLS 檢查）到雲端 root node；純屏直連；WAN 斷 8 小時再恢復 |
| E-04 | 任一 | revoke 一台螢幕 → 60 s 內停；從舊備份還原 root node → rollback_detected → 重播恢復 |
| E-05 | 任一 | app 更新 canary → 小批 → 全站；一台健康失敗回滾；OS 更新走 tryboot（若 G-U 通過）或維護窗 |
| E-06 | 任一 | archive 連線 → STOPPING → ARCHIVED；re-enable 新 generation；原 key 與 UNKNOWN 不變 |
| E-07 | 任一 | 72 小時 soak：playlist 重套、reconnect、receipt loss、遲到資料、renderer 記憶體無持續增長 > 128 MiB |

## 6.3 PoC（P-）與通過條件

| ID | 問題 | 固定輸入 | 通過條件 |
|---|---|---|---|
| P-01 G-LANG | Python 或 Rust 寫 node | 同一 CM4；mTLS、SQLite、HTTPS 串流、branch 角色撐 300 children；同一份 conformance 子集；七個日曆日 | 兩者 RSS、產物大小、CI 時間、診斷工時表；Rust 可選的前提是 clean CI ≤ 15 min 且兩名維護者能重建與診斷；Python 須過 node ≤ 128 MiB |
| P-02 tryboot | CM4 rootfs A/B 可行否 | 現有載板；故意弄壞候選 rootfs | 自動回舊 rootfs；J 保留；三次循環穩定 |
| P-03 串流穿 proxy 與 fan-in | 客戶 forward proxy 是否緩衝串流；CM4 branch 撐幾條持久連線 | Squid、nginx、一款商用 proxy 各一；300 children | 緩衝行為有文件；退路自動切換；fan-in 上限數字 |
| P-04 PKI 演練 | bootstrap → adopt → revoke → 舊備份還原 | 10 台虛擬 leaf | CF-03、CF-09、CF-10 全過；還原後零復活 |
| P-05 W0 預算 | 一屏全機資源 | §5.4 配置 | 全部上限達標；不達標列出改法 |
| P-06 history 容量 | 1 Hz × 300 series 三年（W3） | 8 vCPU / 16 GiB 測試主機 | 磁碟、WAL、查詢 p95、還原時間數字；只在 D-06 進來前做 |
| P-07 Mosquitto intake | arm64 足跡、hostile Type 1 資源耗盡 | 第一個 MQTT Type 1 出現才做 | RSS 數字；retained flood 不影響 node |

## 6.4 CI 形狀

| 項目 | 規定 |
|---|---|
| 多 repo | ERP module、node、backends、deploy、Parts 各以 GitLab ref 解析成 SHA 與 artifact digest；可逐元件 override |
| 隔離 | netns 建 (a)(b)(c) 拓樸；fake DNS、time、proxy、PLC、Anthias；secret 來自 fixture；prod 網段與真硬體不可達 |
| 組合 | 預設組合加單一舊版 override 各跑；每 milestone 綰 case ID |
| race | 每個交易與交接 fault point 1000 cycles，固定 seed，0 到 2000 ms jitter，保存最小失敗 trace |
| soak | nightly 24 h；release 72 h |
| 實機 | RTC、斷電、客戶 proxy、W0 預算必在 CM4 實機；不以模擬代證 |
| 證據包 | commit SHA、artifact digest、拓樸、硬體、seed、cycles、預期與實際、去 secret 的 trace、日期與執行者 |
