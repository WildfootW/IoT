# 對抗式架構審查：任務簡報（所有審查者先讀這份）

日期：2026-10-10。發起人：owner。目的：對 `01-proposal-pcie-tree.md`（以下稱 P0）做一次大型對抗式思考，找出「P0 的好處」與「P0 犧牲掉的東西」之間最好的平衡，**特別是 MQTT**：放棄它我們到底得到什麼？值不值得？有沒有兩者兼得的做法？

## 0. 三份輸入

| 檔案 | 內容 | 怎麼用 |
|---|---|---|
| `00-requirements.md` | owner 的需求底稿（M/D/F/N/C/B 編號） | 引用時用 ID。**不是鐵律**，見 §2 |
| `01-proposal-pcie-tree.md` | P0：PCIe 樹 + HTTPS pull + 自建 node | 被告。攻擊它，也向它學 |
| `02-tradeoffs.md` | P0 的犧牲清單與「為什麼別人不這樣做」 | 這張帳單可能算錯、可能少付。查它 |

## 1. 情境錨點（不可偏離）

需求可以妥協，情境不行。任何提案都必須在下面的情境裡成立：

1. **產品是 Odoo ERP**，裝置是 ERP 的功能。ERP 持有業務上的 desired state（playlist、profile、show、綁定），ERP 只收業務資訊，不收每一筆量測（F-03 精神）。
2. **場域是台灣的工廠與辦公場所**。真實站點長這樣：共享 PSK 的 IoT Wi-Fi、沒有 client isolation、租戶裝置在同一個 VLAN、單一 hypervisor（C-25）。第三方硬體（T1）視為不可信（M-04 精神）。
3. **三種部署形狀都要成立**（M-03）：(a) south/north 同一台主機；(b) 同站不同 VLAN；(c) 客戶 ERP 在我們營運的雲端、站點只有 outbound（F-41）。
4. **規模**：幾個到幾百個感測器，≤ 1 Hz；幾十片螢幕；心跳以分鐘計；3 年歷史；單站。幾千台裝置、幾萬台不是目標。
5. **裝置是插電的 Linux 盒子**（CM4），不是電池 MCU。T1 是封閉韌體：Modbus RTU/TCP 為主，部分可能講 MQTT 或 HTTP。
6. **團隊很小**。自己寫 code 現在便宜（AI 輔助），貴的是：制度性知識、安全審查、外部元件的生命週期時鐘（M-06）、要維護的「種類」數（M-02）、綁住客戶的授權（M-05）。
7. **最小部署 = 一片螢幕**，要小。
8. **已知的下一步**：D-05 門禁（Control-Semantic，控制通道不在本次命令模型內，但身分/存活/設定在）、D-06 機台遙測（有一層低延遲現場 HMI）。
9. **已踩過的坑不能再踩**：C-01～C-25、B-01～B-14 是真實教訓。提案若重現其中任何一個，要明說。

## 2. 可以妥協的（例示，不限於此）

- 「資料一律走樹」可以改成部分直連。
- 「下行一律 pull」可以改成持久連線上的 push。
- 「不用 MQTT / 不用 broker」可以推翻。
- 「ERP 當 root」可以改成獨立管理服務或 ERP UI 疊在服務上。
- 「最小部署兩個服務」可以放寬到三個，如果換到的東西夠多。
- 「平白 Postgres」可以換，但 M-05 的授權問題要正面回答。
- 「NGSI 不留」可以推翻。
- 「每個節點都自建」可以換成現成元件，但要附維護者狀態與授權。

**每個妥協都要寫明：妥協了哪條（ID）、換到什麼、代價是什麼。**

## 3. 評分準則（評審用；滿分 100）

| 準則 | 權重 | 看什麼 |
|---|---|---|
| R1 情境擬合 | 20 | D-01～D-06 與三種部署形狀逐一走過，哪一步會壞 |
| R2 安全 | 15 | hostile T1 圍堵、PKI/身分/撤銷、cloud 形狀、defacement、N-02～N-04 |
| R3 正確性 | 15 | F-46/F-47 精神：不丟命令、不重複執行、結果可觀察、離線行為、retention window 明寫 |
| R4 十年維護 | 20 | 種類數（M-02）、每個外部元件的時鐘（M-06）、授權（M-05）、bus factor、升級路徑、備份 |
| R5 生態槓桿 | 15 | T1 MQTT 設備、D-06 HMI、第三方工具、標準、第 N 個消費者接入的成本 |
| R6 最小足跡與維運 | 5 | 一片螢幕的部署有幾個服務、多大、多難顧 |
| R7 可逆性 | 5 | 三年後想換掉其中一塊要付多少 |
| R8 到第一個客戶價值的成本 | 5 | 以人週粗估 |

## 4. 寫作規範（所有產出）

- 繁體中文，技術名詞保留英文。引用需求用 ID。
- **事實與意見分開。** 對第三方產品的任何事實主張（版本、日期、授權條款、維護者狀態、功能有無）必須附來源 URL 與查證日期，否則標「未查證」。不要憑記憶寫版本號。
- 批評要具體到「哪個情境、哪一步會壞」，不要「可能有風險」。
- 不討好任何提案，包括 P0。也不為了反對而反對：如果 P0 某一點是對的，寫「P0 此點成立」。
- 每份文件開頭一段「結論先講」。

## 5. 流程與模型配置（owner 要求：每個派出去的 agent 用剛剛好的模型）

| 波次 | 角色 | 數量 | 模型 | effort | 為什麼這樣配 |
|---|---|---|---|---|---|
| A | 事實查核（研究員） | 8 | Sonnet | high | 以網路查證為主、彙整為輔；要的是準確引用，不是深度推理 |
| A | 提案架構師 | 6 | Fable（預設） | high | 需要在整份需求上做長程推理與取捨 |
| B | 批評者（5 個 lens × 6 提案） | 30 | Fable（預設） | high | 要找出「哪一步會壞」，需要讀懂整份提案與需求 |
| B | 答辯者（每提案 1） | 6 | Fable（預設） | high | 要分辨批評哪些成立、哪些可修、哪些要反駁 |
| B | 評審（每提案 1） | 6 | Fable（預設） | xhigh | 綜合提案、批評、答辯打分，最需要判斷力 |
| B | MQTT 辯論：正方、反方 | 2 | Fable（預設） | high | 各自把最強論證寫到底 |
| B | MQTT 帳本評審 | 1 | Fable（預設） | xhigh | 逐條裁決、算出「我們到底得到什麼」 |
| C | 綜合者 | 1 | Fable（預設） | max | 讀完全部，寫出平衡方案 |
| C | 反駁者（攻擊綜合方案） | 3 | Fable（預設） | xhigh | 三個 lens 嘗試推翻綜合方案 |
| C | 完整性批評者 | 1 | Fable（預設） | high | 問「少了什麼」 |
| C | 修訂者 | 1 | Fable（預設） | max | 吸收反駁，產出最終版 |
| 各波 | 索引/目錄整理 | 1 | Haiku | low | 純機械 |

## 6. 目錄結構

```
docs/architecture-review/
  00-requirements.md          需求底稿
  01-proposal-pcie-tree.md    P0
  02-tradeoffs.md             P0 的帳單
  03-brief.md                 本文件
  LOG.md                      流程日誌（每一波做了什麼、何時）
  10-facts/                   波次 A：事實查核，一主題一檔
  20-proposals/               波次 A：P1～P6 提案
  30-critiques/P{n}/          波次 B：{lens}.md ×5、rebuttal.md、score.md
  40-mqtt-ledger/             波次 B：advocate.md、opponent.md、ledger.md
  50-synthesis/               波次 C：draft.md、refute-{lens}.md、completeness.md、final.md
  README.md                   索引
```

## 7. 提案立場（波次 A 的六位架構師各領一個）

| 代號 | 立場 | 一句話 |
|---|---|---|
| P1 | MQTT 原生 | broker 就是樹：每個 bridge 一個 broker，MQTT bridging 往上接，topic ACL 做圍堵，管理面也走 MQTT |
| P2 | HTTPS pull 樹（P0 的辯護與強化版） | 承認 02 的帳單，用最少的加法把最痛的幾項補回來（例如 bridge 內建 MQTT ingress adapter 收 T1） |
| P3 | NATS 葉節點 | NATS leaf node 就是樹、account 就是圍堵、JetStream KV 就是 register、stream 就是 SQ/CQ、內建 MQTT listener 收 T1 設備；自己只寫薄 agent |
| P4 | 買不要做 | 用現成平台（ThingsBoard CE、Eclipse Hono/Ditto、留下 FIWARE 並升版、雲端 IoT Hub 等）；誠實算授權與維護者時鐘 |
| P5 | 語意不變、傳輸可換 | register/queue 語意是契約，傳輸是可插拔的 link layer（預設 HTTPS、有 broker 的地方走 MQTT）；必須回答這層抽象值不值得它的 M-02 成本 |
| P6 | 最小主義 | 第一個客戶（幾片螢幕、幾個感測器）需要的最小東西是什麼，能不能長大；檢驗「樹」是不是過早設計 |

## 8. 批評 lens（波次 B）

| lens | 檔名 | 問什麼 |
|---|---|---|
| 安全 | security.md | hostile T1 怎麼被圍堵、PKI 與撤銷、cloud 形狀、defacement、N-02～N-04 |
| 十年維運 | longevity.md | 種類數、每個外部元件的時鐘與授權、bus factor、升級、備份、M-01/M-02/M-05/M-06 |
| 正確性 | correctness.md | F-46/F-47、丟命令、重複、順序、結果可觀察、離線、retention window、B-01～B-14 會不會重現 |
| 情境擬合 | scenarios.md | D-01～D-06 與三種部署形狀逐一走過，一片螢幕的最小部署長什麼樣 |
| 生態 | ecosystem.md | T1 MQTT 設備、D-06 HMI、第 N 個消費者、第三方工具、標準；失去與得到 |
