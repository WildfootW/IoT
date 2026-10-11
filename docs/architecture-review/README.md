# 架構對抗式審查（2026-10）

owner 在 2026-10-10 提出「從 0 重新思考架構：腦中是 PCIe，但下面是網路」。這個目錄記錄整個對抗式審查的過程與產出。閱讀順序建議由上而下。

## 狀態（2026-10-11）

| 波次 | 內容 | 狀態 |
|---|---|---|
| 底稿 | 需求、P0 提案、P0 的帳單、審查簡報 | 完成 |
| A | 8 份事實查核、6 份提案 | 完成 |
| B | 每提案 5 個 lens 的批評、答辯、評分；MQTT 辯論與帳本 | **完成**：30 份批評、6 份答辯、6 份評分；正反方、帳本與獨立覆核齊備。305 條 finding 逐條答辯，六份加權算術已核對 |
| C | 綜合、反駁、完整性批評、最終版 | **完成文件審查**：[最終版](50-synthesis/final.md) 共 15 節，251 條原始致命／重大、13 條反駁與 7 個完整性缺口均有去向；產品 PoC、外審與現場驗收尚未執行，不是生產批准 |

## 檔案

| 檔案 | 內容 |
|---|---|
| `00-requirements.md` | owner 的需求底稿（M / D / F / N / C / B 編號），審查的輸入 |
| `01-proposal-pcie-tree.md` | P0：PCIe 樹 + HTTPS pull + 自建 node；被告 |
| `02-tradeoffs.md` | P0 的犧牲清單與「為什麼別人不這樣做」；這張帳單是審查的檢查對象 |
| `03-brief.md` | 審查簡報：情境錨點、可妥協項、評分準則 R1～R8、寫作規範、模型配置、目錄結構；**§9 詞彙表**（root node / branch / leaf、intake / projection、trust log、Type 1～3 等新名與舊稿對照） |
| `LOG.md` | 流程日誌 |
| `RESUME.md` | **接續手冊**：現況、步驟、驗收條件、模型配置、所有角色的 prompt |
| `RESUME-PROMPT.md`、`RESUME-PROMPT.txt` | **可貼上的接續 prompt**，給接手的 session；`.txt` 是不含 markdown 標記的純文字版 |
| `90-resume/` | 三支可直接執行的 Workflow 腳本：`wave-b-proposal.js`、`ledger-review.js`、`wave-c-synthesis.js` |
| `10-facts/` | 事實查核：`mqtt-brokers`、`nats`、`mqtt-semantics`（含 Sparkplug B）、`buy-options`（含 FIWARE 現況）、`precedents`、`zenoh`、`transport-through-networks`、`postgres-timeseries` |
| `20-proposals/` | P1 MQTT 原生、P2 HTTPS pull 強化、P3 NATS 葉節點、P4 買（ThingsBoard）、P5 語意不變傳輸可換、P6 最小主義 |
| [30-critiques/](30-critiques/) | P1～P6 各七份文件齊備：五個 lens、答辯與評分；原 security／longevity 未改寫 |
| [40-mqtt-ledger/](40-mqtt-ledger/) | 正方、反方、原帳本均保留；[獨立覆核](40-mqtt-ledger/ledger-review.md) 逐行裁決，修正 retained 與 HTTPS 的過度概括 |
| [50-synthesis/interim.md](50-synthesis/interim.md) | 保留主審的中期綜合與接續脈絡，不再作為最終結論 |
| [50-synthesis/draft.md](50-synthesis/draft.md) | 綜合草稿，保留供反駁及最終修訂對照 |
| [安全與正確性反駁](50-synthesis/refute-security-correctness.md)、[維運與情境反駁](50-synthesis/refute-longevity-scenarios.md)、[生態成本與 ERP 反駁](50-synthesis/refute-ecosystem-cost-erp.md) | 三位獨立反駁者，共 13 條 finding |
| [50-synthesis/completeness.md](50-synthesis/completeness.md) | 完整性批評，7 個缺口；核對 101 條 M／F／N、19 個開放問題與九個情境錨點 |
| [50-synthesis/final.md](50-synthesis/final.md) | 最終 15 節設計建議；§15 為十項 owner 決策、反駁與缺口裁決、相對草稿的變更摘要 |
| [50-synthesis/owner-summary.md](50-synthesis/owner-summary.md) | owner 版摘要：模型現在的形狀、14 個關鍵決策的理由與證據、不支援組合與待拍板事項 |
| [50-synthesis/comparison.md](50-synthesis/comparison.md) | 我們的架構對照十種常見架構：八個軸的優劣、總表、哪些情境該改選別人 |
| [50-synthesis/decisions.md](50-synthesis/decisions.md) | Owner 決策單白話版：O01～O10 各在決什麼、選項、建議、不決定的後果、拍板順序 |
| [50-synthesis/tree.md](50-synthesis/tree.md) | 樹狀架構圖：邏輯樹與 PCIe 對照、四個 plane、三種形狀、MQTT 位置、每層斷線行為 |
| [50-synthesis/roles.md](50-synthesis/roles.md) | 五個角色視圖：管理中心、device、業務資料、全數據歷史、中間串接各由什麼跑、持有什麼、和誰講話、相對今天改了什麼 |

## 一段話版結論（最終）

結論先講：採 P2 修訂後的 HTTPS 管理樹，以 ERP 持有業務 desired / job queue、裝置持有 actual/result log、獨立 registry 管身分，結合 P6 功能分期與 P5(A) 契約測試；MQTT 按站內設備與 HMI 需求加入，不成為管理權威。相對 P0 改五件事：一、所有 Type 2 雙向簽章、文件雜湊及用途授權從首日到位；二、原子受理、耐久收據與批次對帳，未知物理結果保鎖、不重跑；三、安全決策另存不可隨業務備份回捲的日誌，封存於每次派送重新檢查；四、提供保留同主機形狀的 C-25 隔離改造，以及有期限、可離線冷啟的現場讀取；五、把更新失敗救援、壞狀態修復、歷史證據與所有角色成本算進交付，不把同份程式當成零維運。MQTT 最終答案：不用它作首版 leaf/trunk，換到較少的生產配置與維護範圍，不是獨占正確性或必然穿網；保留站內 broker，買回成熟入口、扇出與 retained 晚加入快取，來源、品質、授權及恢復仍需整合；已有工具需求或同負載收益時可重評 leaf binding，不必等 HTTPS 撐不住，也不必先替每片螢幕安裝 broker。這是完成對抗審查的設計建議，不是生產批准。敏感資料被強制 TLS inspection 且不准 bypass、以及不准改造的 C-25 網路，仍是不支援的部署組合；owner 必須決定條件、責任人與驗收預算，不能以文件完整冒充所有現場均已解決。

P2／P6 答辯後同為 56.00，取 P2 作骨架不是分數勝出，取捨見最終版 §2。第三方資料沿用原查核，未重新網查；本環境使用附錄 A 的代理調度與繼承模型，無法核驗指定模型或 high/xhigh/max，詳見 [LOG.md](LOG.md)。
