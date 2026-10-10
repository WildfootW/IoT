# 90-resume：接續用的 workflow 腳本

三支腳本都是 Claude Code `Workflow` 工具的腳本（純 JavaScript，`export const meta` 開頭，可用 `scriptPath` 直接執行）。都接受 `args.root`：`docs/architecture-review` 的**絕對路徑**；不給就用 `/home/user/IoT/docs/architecture-review`。

| 腳本 | 做什麼 | args | agent 數 |
|---|---|---|---|
| `wave-b-proposal.js` | 一個提案的剩餘 lens 批評 → 答辯 → 評分 | `{code, file, root, lenses?}`；`lenses` 預設 `["correctness","scenarios","ecosystem"]` | 5 |
| `ledger-review.js` | 獨立覆核 `40-mqtt-ledger/ledger.md` | `{root}` | 1 |
| `wave-c-synthesis.js` | 綜合 → 三位反駁者 → 完整性批評 → 修訂 | `{root}` | 6 |

執行順序：六個 `wave-b-proposal` 與一個 `ledger-review` 可同時啟動；全部完成並 commit 後再跑 `wave-c-synthesis`。

每個 workflow 同時 agent 數上限 = min(16, CPU 核心數 − 2)。四核心機器上是 2，所以要把六個提案拆成六個 workflow 同時啟動，而不是一個 workflow 跑六個。

沒有 `Workflow` 工具的環境：腳本裡每個 `agent(...)` 的第一個參數就是完整 prompt，用 `Agent` 工具依相同順序派出即可；`RESUME.md` 附錄有同一組 prompt 的 markdown 版。
