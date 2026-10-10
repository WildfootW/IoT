# 架構對抗式審查（2026-10）

owner 在 2026-10-10 提出「從 0 重新思考架構：腦中是 PCIe，但下面是網路」。這個目錄記錄整個對抗式審查的過程與產出。閱讀順序建議由上而下。

## 狀態（2026-10-10）

| 波次 | 內容 | 狀態 |
|---|---|---|
| 底稿 | 需求、P0 提案、P0 的帳單、審查簡報 | 完成 |
| A | 8 份事實查核、6 份提案 | 完成 |
| B | 每提案 5 個 lens 的批評、答辯、評分；MQTT 辯論與帳本 | **部分**：security 與 longevity 批評 12 份、辯論正反方 2 份；帳本由主審代寫。其餘被帳號每週用量上限擋住；owner 決定在其他環境接續，見 `RESUME.md` 與 `RESUME-PROMPT.md` |
| C | 綜合、反駁、完整性批評、最終版 | 未開始；`50-synthesis/interim.md` 是主審的中期綜合 |

## 檔案

| 檔案 | 內容 |
|---|---|
| `00-requirements.md` | owner 的需求底稿（M / D / F / N / C / B 編號），審查的輸入 |
| `01-proposal-pcie-tree.md` | P0：PCIe 樹 + HTTPS pull + 自建 node；被告 |
| `02-tradeoffs.md` | P0 的犧牲清單與「為什麼別人不這樣做」；這張帳單是審查的檢查對象 |
| `03-brief.md` | 審查簡報：情境錨點、可妥協項、評分準則 R1～R8、寫作規範、模型配置、目錄結構 |
| `LOG.md` | 流程日誌 |
| `RESUME.md` | **接續手冊**：現況、步驟、驗收條件、模型配置、所有角色的 prompt |
| `RESUME-PROMPT.md`、`RESUME-PROMPT.txt` | **可貼上的接續 prompt**，給接手的 session；`.txt` 是不含 markdown 標記的純文字版 |
| `90-resume/` | 三支可直接執行的 Workflow 腳本：`wave-b-proposal.js`、`ledger-review.js`、`wave-c-synthesis.js` |
| `10-facts/` | 事實查核：`mqtt-brokers`、`nats`、`mqtt-semantics`（含 Sparkplug B）、`buy-options`（含 FIWARE 現況）、`precedents`、`zenoh`、`transport-through-networks`、`postgres-timeseries` |
| `20-proposals/` | P1 MQTT 原生、P2 HTTPS pull 強化、P3 NATS 葉節點、P4 買（ThingsBoard）、P5 語意不變傳輸可換、P6 最小主義 |
| `30-critiques/P*/` | 每個提案的 `security.md`、`longevity.md`（已完成）；`correctness.md`、`scenarios.md`、`ecosystem.md`、`rebuttal.md`、`score.md`（待補） |
| `40-mqtt-ledger/` | `advocate.md`（正方）、`opponent.md`（反方）、`ledger.md`（帳本：我們到底為此得到什麼） |
| `50-synthesis/interim.md` | 主審的中期綜合：跨提案共識、各提案判定、暫定平衡方案、§9 的中期答案、未完成與接續計畫 |

## 一段話版結論（中期）

語意層（register、SQ/CQ、announce、owner 持有事實）是契約，所有方案都要自己寫；傳輸是可換的，第一版只有 HTTPS 串流。跨客戶網路的 trunk 只能跑在 HTTPS 上，而且 mTLS 在 TLS 檢查 proxy 下會死，所以所有下行物件都要端到端簽章並綰收件者。MQTT 進來，但只進 bridge 的南邊：面向 T1 MQTT 設備與 D-06 HMI / SCADA 的那一跳，有觸發的站點才裝，不上 trunk、不載管理面、不持樹的憑證。「買平台」不成立，「買零件」成立。所有提案共同的空白是 PKI 生命週期與 fleet 升級路徑，這兩樣要寫進最終方案並外部審查。
