# 接續手冊：把對抗式審查跑完

> 給在另一個環境接手的人或 agent。2026-10-10 原 session 因帳號每週用量上限中斷；已完成的部分全在這個目錄，缺的部分與做法全在本文。可貼上的 prompt 在 `RESUME-PROMPT.md`。

## 1. 現況

| 波次 | 已完成 | 缺 |
|---|---|---|
| 底稿 | `00`～`03`、`LOG.md` | — |
| A | `10-facts/` 8 份、`20-proposals/` P1～P6 | — |
| B | `30-critiques/P*/security.md`、`longevity.md`（12 份）；`40-mqtt-ledger/advocate.md`、`opponent.md`；`ledger.md`（主審代寫） | 每提案 `correctness.md`、`scenarios.md`、`ecosystem.md`、`rebuttal.md`、`score.md`（30 份）；`ledger-review.md`（1 份） |
| C | `50-synthesis/interim.md`（主審的中期綜合，非結論） | `draft.md`、`refute-security-correctness.md`、`refute-longevity-scenarios.md`、`refute-ecosystem-cost-erp.md`、`completeness.md`、`final.md` |

規則：**不要重寫已存在的檔案，不要改 `00`～`03`。** `interim.md` 與 `ledger.md` 可以被反駁，但不要刪。

## 2. 前置

```
git clone https://github.com/WildfootW/IoT   # 或在既有 clone 內 git fetch origin
git checkout claude/awesome-bell-ea7zqp
ROOT=$(pwd)/docs/architecture-review          # 下面所有 args.root 都用這個絕對路徑
```

先讀：`03-brief.md`（全文，特別是 §1 錨點、§3 評分準則、§4 寫作規範、§5 模型配置）、`LOG.md`、`50-synthesis/interim.md` §5～§6。

## 3. 步驟

### 步驟 1：波次 B 剩餘（可與步驟 2 同時）

六個提案各啟動一個 workflow，同時跑：

```
Workflow({ scriptPath: "<repo>/docs/architecture-review/90-resume/wave-b-proposal.js",
           args: { code: "P1", file: "P1-mqtt-native.md",          root: "<ROOT>" } })
Workflow({ scriptPath: ..., args: { code: "P2", file: "P2-https-pull-defended.md", root: "<ROOT>" } })
Workflow({ scriptPath: ..., args: { code: "P3", file: "P3-nats-leaf.md",           root: "<ROOT>" } })
Workflow({ scriptPath: ..., args: { code: "P4", file: "P4-buy.md",                 root: "<ROOT>" } })
Workflow({ scriptPath: ..., args: { code: "P5", file: "P5-pluggable-transport.md", root: "<ROOT>" } })
Workflow({ scriptPath: ..., args: { code: "P6", file: "P6-minimalism.md",          root: "<ROOT>" } })
```

每個 workflow：3 位批評者（correctness、scenarios、ecosystem；effort high）平行 → 1 位答辯者（讀全部五份批評；high）→ 1 位評審（xhigh）。產出到 `30-critiques/P{n}/`。

若某個 lens 的檔案已存在（例如前一次跑到一半），用 `lenses` 參數只補缺的，例如 `lenses: ["ecosystem"]`。

### 步驟 2：MQTT 帳本獨立覆核

```
Workflow({ scriptPath: "<repo>/docs/architecture-review/90-resume/ledger-review.js", args: { root: "<ROOT>" } })
```

產出 `40-mqtt-ledger/ledger-review.md`。

### 步驟 3：commit 波次 B

```
git add docs/architecture-review && git commit -m "docs: wave B complete (remaining critiques, rebuttals, scores, ledger review)" && git push origin claude/awesome-bell-ea7zqp
```

並在 `LOG.md` 追加一行：時間、agent 數、耗時、有無失敗。

### 步驟 4：波次 C

```
Workflow({ scriptPath: "<repo>/docs/architecture-review/90-resume/wave-c-synthesis.js", args: { root: "<ROOT>" } })
```

綜合者（max）→ 三位反駁者（xhigh，平行）→ 完整性批評者（high）→ 修訂者（max）。產出到 `50-synthesis/`。

### 步驤 5：收尾

1. 更新 `README.md` 的狀態表與「一段話版結論」（改成 `final.md` 的結論先講）。
2. `LOG.md` 追加波次 C 的一行。
3. commit、push。
4. 回報 owner：六份 `score.md` 的加權總分表（答辯前 / 後）、`final.md` 的「結論先講」全文、`final.md` §15 的 owner 決策清單。

## 4. 驗收條件

- 每個 `30-critiques/P{n}/` 有七個檔案；每份批評開頭有「結論先講」且列出致命 / 重大數；`score.md` 有 R1～R8 兩欄分數與加權總分。
- `ledger-review.md` 對 `ledger.md` 的每一節都有同意 / 不同意 / 修正。
- `final.md` 有 15 節；每一條反駁 finding 在 `final.md` 有去向；`completeness.md` 的每個缺口都被補；§15 的決策清單每項有選項、建議、理由、不決定的後果。
- 所有第三方事實附來源與日期，否則標「未查證」。

## 5. 模型配置（03-brief.md §5；沒有同名模型時取同級）

| 角色 | 模型 | effort |
|---|---|---|
| 批評者、答辯者、綜合草稿前的研究 | 最強可用模型 | high |
| 評審、反駁者、帳本覆核 | 最強可用模型 | xhigh |
| 綜合者、修訂者 | 最強可用模型 | max |
| 完整性批評者 | 最強可用模型 | high |
| 純機械（索引、格式） | Sonnet 級 | low |

## 6. 執行環境注意

- `Workflow` 每個 workflow 同時 agent 數 = min(16, CPU − 2)；核心少就拆多個 workflow 平行。
- agent 需要網路查證時，先用 `ToolSearch` 載入 `WebSearch`、`WebFetch`。
- agent 用 `Write` 工具寫檔；最終回覆是 schema 結構化資料，不是給人看的訊息（腳本已這樣寫）。
- 若 agent 寫完檔案但在回傳結構化結果時失敗，檔案仍可用；重跑前先看目錄，用 `lenses` 參數補缺。
- 用量上限：原 session 是在波次 B 跑到 8/45 時被擋；一次全開 7 個 workflow 約 45 個 agent、估 25～30M subagent tokens。若擔心再撞上限，先跑 P2 與 P5（最接近基底）與 ledger-review，再跑其餘。

## 附錄 A：角色 prompt（給沒有 `Workflow` 工具的環境；與腳本內字串同義）

所有 prompt 的開頭都是這段共用前言（把 `<ROOT>` 換成絕對路徑）：

> 你是這場 IoT 架構對抗式審查的一員。工作目錄：`<ROOT>/`。第一步：讀 `03-brief.md` 全文。第二步：讀 `00-requirements.md`、`01-proposal-pcie-tree.md`、`02-tradeoffs.md`。第三步：讀 `LOG.md` 與 `50-synthesis/interim.md`（主審的中期綜合，不是結論，可反駁）。寫作規範：繁體中文、技術名詞保留英文、引用需求用 ID、事實與意見分開、第三方事實附來源（10-facts 的檔名與列號，或 URL 與查證日期）否則標「未查證」、每份文件開頭一段「結論先講」。不討好任何提案，也不為反對而反對：提案說對的地方要寫「此點成立」。批評要具體到「哪個部署形狀、哪個 D-xx、哪一步會壞」。文件本體用 Write 工具寫到指定路徑。

### A.1 批評者（每提案 × 每缺的 lens）

> 你是批評者，lens = `<lens 名>`。目標提案：`<ROOT>/20-proposals/<file>`（代號 `<code>`）。讀目標提案全文；讀 `10-facts/` 中與你的 lens 相關的檔案（下表）；讀 `30-critiques/<code>/` 已存在的 security.md、longevity.md，避免重複它們的 finding。
> 你要問的問題：（下表「問什麼」欄）。
> 任務：找出這份提案在你的 lens 上哪個情境、哪一步會壞。每一條 finding：編號（`<lens>-01` 起）、嚴重度（致命 / 重大 / 次要；致命 = 在某個錨點情境下方案不成立）、情境（部署形狀 (a)(b)(c) 與 D-xx）、壞在哪一步、依據、可不可以修（修法與代價）。6～15 條，寧精勿多。另列「此點成立」至少 3 條。最後一節：如果你是作者，最怕評審問什麼？
> 寫到 `<ROOT>/30-critiques/<code>/<lens>.md`，1500～4000 字，開頭「結論先講」寫致命幾條、重大幾條、一句總評。

| lens | 相關事實檔 | 問什麼 |
|---|---|---|
| correctness | mqtt-semantics、precedents、nats | F-46～F-54 逐條驗：命令會不會丟（ERP 掛、bridge 掛、unit 掛、網路斷各一次）；會不會重複執行；順序；結果可觀察（F-49）；離線行為（N-11）；每個 retention window 是否明寫且有監控；時間戳（F-02、N-14）；B-01～B-14 哪些會重現；「送達被當完成」有沒有在任何一跳偷偷發生；schema 先宣告（F-31、F-32）怎麼強制 |
| scenarios | transport-through-networks、precedents、buy-options | D-01～D-06 逐一走完整流程；三種部署形狀各自的實際元件清單與防火牆規則；一片螢幕的最小部署的隱藏依賴（DNS、NTP、CA、反向代理、資料庫、Anthias、nginx）；N-07、N-12、N-13、N-14、N-18 |
| ecosystem | mqtt-brokers、mqtt-semantics、buy-options、zenoh、precedents | 講 MQTT 的 T1 怎麼接、代價；D-06 HMI 低延遲層；第 N 個消費者要動什麼；第三方工具與標準（Sparkplug B、NGSI、OPC UA）；owner 的 MQTT 疑問在這份提案裡是否有事實支撐（對照 `40-mqtt-ledger/ledger.md`，可反駁）；客戶 IT 與標案觀感 |

### A.2 答辯者（每提案一位，批評齊五份後）

> 你是提案 `<code>` 的答辯者（辯護律師兼修補者）。讀提案全文與 `30-critiques/<code>/` 下五份批評。對每一條 finding 裁決：接受（寫出修法與代價）/ 部分接受 / 反駁（給依據）。致命級一條都不得迴避；批評成立就承認。
> 產出 `rebuttal.md`：1) 結論先講：接受 / 部分 / 反駁各幾條，提案改了什麼（三行）；2) 逐條裁決表；3) 修訂後的提案差異（引用原節號；若動到 §2 元件清單或 §7 妥協清單就重列）；4) 仍然承認的弱點。2500～6000 字。

### A.3 評審（每提案一位，答辯後）

> 你是評審。讀提案、五份批評、rebuttal.md。依 03-brief.md §3 的 R1～R8 每項 0～10 分並寫理由（引用 finding 編號或提案節號），分「答辯前」「答辯後」兩欄，乘權重（R1 20、R2 15、R3 15、R4 20、R5 15、R6 5、R7 5、R8 5）得加權總分。原則：R1 有一步走不通就不高於 5；R2 看致命安全 finding 是否解掉；R3 看 F-46/F-47 是否結構成立；R4 自己重算種類數與時鐘；R5 看 MQTT 疑問是否被事實回答。另答：must fix 三件、steal-worthy 三個想法、一句話裁決。寫到 `score.md`，1500～3500 字。

### A.4 帳本覆核者

> 你是 MQTT 帳本的獨立覆核者。讀 `40-mqtt-ledger/` 三份、相關 10-facts 五份、六份提案中與 MQTT 有關的節、所有已存在批評中提到 MQTT / broker / Mosquitto / retained / Will 的段落。ledger.md 由主審代寫（主審也寫了 P0 與 interim.md）。對 ledger.md 每一節（§1 的 21 行、§2 重算、§3 hop 裁決、§4 unit hop 分歧、§5 提案評比）給同意 / 不同意 / 修正並附依據。特別檢查：主審是否偏袒「不用 MQTT」；「retained 是負資產」是否過重；「unit → bridge 第一版走 HTTPS」是否有事實支撐；有無漏掉任一方論點；§6 缺的事實是否完整。寫到 `40-mqtt-ledger/ledger-review.md`，2000～4000 字。

### A.5 綜合者（波次 C 第一位）

> 你是綜合者。必讀：`00`～`03`、`LOG.md`、`interim.md`、`10-facts/` 八份的結論先講、`20-proposals/` 六份全文、`30-critiques/P1～P6` 全部、`40-mqtt-ledger/` 全部。原則：以評分最高且答辯後仍成立的提案為骨架，借走各 score.md 的 steal-worthy；每一條致命與重大 finding 都要有處置；不同意 interim.md 的共識就寫理由；妥協照 03-brief §2 寫明換到什麼。15 節結構見 `90-resume/wave-c-synthesis.js` 的 `STRUCTURE`（結論先講 / 方案總覽 / 契約與語意 / 身分與 PKI 生命週期 / 樹、trunk、傳輸 / MQTT 放法 / 回傳資料與 store / 升級路徑 / 邊緣 process 與 ERP 邊界 / D-01～D-06 / 妥協清單 / §9 最終答案 / 第一天必做與觸發表 / PoC 與人週 / 未解決與 owner 決策清單）。寫到 `50-synthesis/draft.md`，6000～12000 字。

### A.6 三位反駁者（平行）

> 你是反駁者，lens = `<安全與正確性 | 十年維運與情境擬合 | 生態、成本與 ERP 邊界>`。讀 draft.md 全文，預設它是錯的，找出哪個情境、哪一步會壞。（各 lens 的問題見腳本 `REFUTERS` 陣列。）每條 finding：編號、嚴重度、壞在哪一步、依據、修法與代價；另列草稿說對的 3 件事；最後回答在你的 lens 下草稿整體是否成立。寫到 `50-synthesis/refute-<lens-key>.md`，2000～4500 字。

### A.7 完整性批評者

> 讀 draft.md 與三份 refute。問少了什麼：00 的每條 M / F / N 是否有處置、§9 每題是否有答案、30-critiques 每條致命 finding 是否被處理、03-brief §1 九個錨點是否被遵守、有無「未查證」被當事實、有無 PoC 沒有通過條件。寫到 `50-synthesis/completeness.md`。

### A.8 修訂者

> 讀 draft、三份 refute、completeness。每條反駁 finding 在最終版要有去向；每個缺口要補；15 節結構不變；§15 的 owner 決策清單每項有選項、建議、理由、不決定的後果；文末附相對草稿的變更摘要。寫到 `50-synthesis/final.md`。
