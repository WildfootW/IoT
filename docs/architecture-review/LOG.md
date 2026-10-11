# 流程日誌

| 時間（UTC） | 事件 |
|---|---|
| 2026-10-10 | owner 提出「從 0 重新思考架構，腦中是 PCIe，但下面是網路」。Claude 回以 P0（`01-proposal-pcie-tree.md`） |
| 2026-10-10 | owner 問「犧牲了什麼、為什麼別人不這樣做」。Claude 回以 `02-tradeoffs.md`；owner 拍板：pull 統一、Rust 列入 PoC、直寫後門先 PoC、Grafana 留 ops |
| 2026-10-10 | owner 要求大型對抗式思考，重點 MQTT，允許妥協需求但不偏離情境，一邊做一邊寫文件。寫出 `03-brief.md`，開始波次 A |
| 2026-10-10 | 波次 A 啟動（workflow wf_627edeeb-9f6）：8 位 Sonnet 研究員查證事實 → 6 位架構師各寫一個提案 P1～P6 |
| 2026-10-10 | 波次 A 完成（14 agents、約 87 分鐘、約 3.2M subagent tokens）：10-facts/ 8 份、20-proposals/ 6 份。commit 後啟動波次 B |
| 2026-10-10 | 波次 B 啟動：7 個平行 workflow。P1～P6 各一條「5 位批評者 → 答辯者 → 評審」；另一條 MQTT 辯論「正方 ∥ 反方 → 帳本評審」 |
| 2026-10-10 | 波次 B 中斷：帳號每週用量上限（重置 2026-10-13 21:00 UTC）。45 個 agent 中完成 14 份文件：每個提案的 security.md 與 longevity.md（12 份）、MQTT 辯論的 advocate.md 與 opponent.md。未完成：correctness / scenarios / ecosystem 三個 lens ×6、六份 rebuttal、六份 score、MQTT ledger、波次 C。部分檔案是 agent 寫完檔案後才在回傳結構化結果時被擋，內容完整但未經 workflow 確認 |
| 2026-10-10 | 主審代寫 `40-mqtt-ledger/ledger.md`（原定 xhigh 評審被上限擋住）；commit、push |
| 2026-10-10 | 主審寫 `50-synthesis/interim.md`（中期綜合）與 `README.md`；commit、push |
| 2026-10-10 | 排定自我提醒 trigger `trig_01K4xuvzPp6pSMCrhNbZVX34`，2026-10-13 21:20 UTC 自動接續波次 B 剩餘部分與波次 C。owner 可在 Routines 列表改時間或取消 |
| 2026-10-10 | owner 決定在其他環境接續：取消自我提醒 trigger `trig_01K4xuvzPp6pSMCrhNbZVX34`；寫出 `RESUME.md`（接續手冊）、`RESUME-PROMPT.md`（可貼上的 prompt）、`90-resume/` 三支可執行的 Workflow 腳本（`wave-b-proposal.js`、`ledger-review.js`、`wave-c-synthesis.js`，皆接受 `args.root`）。接手者從 `RESUME.md` §3 開始 |
| 2026-10-10 | 依 owner 要求，將公司名稱、客戶站點名稱與內部專案代號全部改為中性名稱（gateway、LED 控制器、感測服務、compose 套件、integration hub、試點站點），含需求底稿、提案、批評、腳本與接續 prompt |
| 2026-10-10 | 分支歷史 squash 成單一 commit 並 force-push，讓舊名稱不留在 git 歷史裡；加入純文字版接續 prompt `RESUME-PROMPT.txt` |
| 2026-10-10 16:49:11～18:02:41 | 波次 B 接續完成（UTC，73 分 30 秒）：新增 18 份 lens 批評、6 份答辯、6 份評分及 1 份 MQTT 帳本獨立覆核，共 31 位獨立角色、33 次 agent 呼叫；P5 答辯請求失敗及 P2 評分連線逾時各一次，確認未產生檔案後僅重試缺項，皆已恢復。此環境無原生 Workflow，依 RESUME 附錄 A 由主代理維持六條提案流程及獨立覆核；18 位批評者與覆核平行，各提案至多 3 位同時工作，五份批評齊備才答辯、答辯後才評分（16 CPU，每流程上限 14）。ROOT 為 `/home/andrewshen/cyber/iot/docs/architecture-review`。模型採環境繼承預設，未提供可列舉模型或 effort 控制，不能核驗最強模型、high/xhigh/max；機械檢查由主代理執行 Node，未宣稱套用 Sonnet。owner 無法即時回覆時要求自主處理，故採手冊備援流程並保留此限制。驗收：每提案 7 檔、305 條 finding 逐條答辯、六份 R1～R8 加權算術、帳本 21 行及 1,150 個本地引用通過；00～03 與其他既有證據未改寫。P2、P6 答辯後同為 56.00，所有方案仍有設計或上線 gate。未執行產品 PoC、未重新網查；產品事實沿用既有查核及來源，未確認事項標未查證。 |
| 2026-10-10 20:50:05 | 波次 C 文件與主代理驗收完成；以波次 B 提交後 18:05:12 UTC 至此估計約 165 分鐘，含調度、閱讀、生成及驗證。6 位獨立角色、7 次 agent 呼叫：綜合者 → 三位平行反駁者 → 完整性批評者 → 修訂者；第一次修訂無回覆且未留下檔案，僅重試修訂成功。新增 draft、三份 refute、completeness、final 共 6 檔；原草稿及所有既有證據保留。最終版 15 節、251 條原始致命／重大（6／245）、13 條反駁（11 重大／2 次要）、7 個完整性缺口、101 條 M／F／N、19 個開放問題、九個錨點與十項 owner 決策皆有處置；最終版 337 個本地引用及分數、來源行號驗證通過，六份 C 文件無 editor diagnostics。主代理曾以錯誤標題層級檢查草稿，修正檢查器後重驗通過，未為此改寫草稿。更新 README 狀態、索引與最終結論；LOG 僅追加。全程共 37 位角色、40 次呼叫，模型／effort 限制同上一列，不宣稱原生 Workflow 或最強模型設定已執行。波次 B 已推送 `bba799b`；本機無 Git 作者設定，首次 commit 被拒後，以命令局部的 `IoT Review Automation <iot-review@localhost>` 提交，未改全域身分。兩波提交使用此明示自動化身分與既有 deploy key。安全 journal、逐次 archive gate、離線 HMI 冷啟、更新／state 復原、同機 C-25、RMA／能力分類及跨 gate 驗收已補設計；PoC、外審、BOM／授權與現場驗收均未執行，最終版不是生產批准，也未宣稱無條件滿足不支援的部署組合。 |
| 2026-10-11 | 主審同步另一環境完成的波次 B 與 C（`bba799b`、`4dbf182`），寫 `50-synthesis/owner-summary.md` |
| 2026-10-11 | 主審寫 `50-synthesis/comparison.md`：最終方案對照十種常見架構 |
| 2026-10-11 | 主審寫 `50-synthesis/roles.md`：五個角色視圖 |
| 2026-10-11 | 主審寫 `50-synthesis/tree.md`：樹狀架構圖 |
| 2026-10-11 | owner 決定重新命名：root node / branch / leaf、Type 1～3、intake / projection、trust log / trust authority、recorder、watch API、connector、stand-in、job queue / result log、strict / inspected。活文件（final、owner-summary、comparison、roles、tree、README）改用新名；歷史文件保留舊稿寫法；詞彙表在 `03-brief.md` §9 |
| 2026-10-11 | 主審寫 `50-synthesis/decisions.md`：O01～O10 白話版決策單 |
| 2026-10-11 | 主審寫 `50-synthesis/faq.md`：架構問答（含 MCU 當 unit、新增裝置要動哪幾層） |
| 2026-10-11 | owner 裁決 O01（預設 inspected、線上零秘密）與 O02（Type 1 一律隔離 VLAN、只讓 branch 對外）；主審補 faq Q6（多 branch 同區網）、Q7（攝影機的 media plane） |
| 2026-10-11 | owner 裁決 O03：B 優先、能 A 則 A、C 當底、不預期 D；既有 backend 重寫 |
