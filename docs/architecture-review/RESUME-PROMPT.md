# 可貼上的接續 prompt

把下面整段貼給接手的 Claude Code session（需要有 Workflow 或 Agent 工具、網路、以及這個 repo 的 push 權限）。

---

請接續這場 IoT 架構對抗式審查，把它跑完。所有脈絡都在 repo，不需要我再解釋。

Repo：https://github.com/WildfootW/IoT ，分支 `claude/awesome-bell-ea7zqp`。文件目錄 `docs/architecture-review/`。

先依序讀：`RESUME.md`（接續手冊，含步驟、驗收條件、模型配置、所有角色的 prompt）、`03-brief.md`（情境錨點、評分準則、寫作規範）、`LOG.md`、`50-synthesis/interim.md` 的 §5～§6。不要改 `00`～`03`，不要重寫任何已存在的檔案。

要做的事，照 `RESUME.md` §3 的順序：

1. 波次 B 剩餘：對 P1～P6 每個提案補 correctness / scenarios / ecosystem 三個 lens 的批評，然後答辯 `rebuttal.md`，然後評分 `score.md`。security 與 longevity 已經有了。腳本 `90-resume/wave-b-proposal.js`，args `{code, file, root}`，六個提案各開一個 workflow 同時跑。
2. MQTT 帳本獨立覆核：`90-resume/ledger-review.js` → `40-mqtt-ledger/ledger-review.md`。可與 1 同時。
3. 1 與 2 完成後 commit、push，`LOG.md` 加一行。
4. 波次 C：`90-resume/wave-c-synthesis.js` → `50-synthesis/draft.md`、三份 `refute-*.md`、`completeness.md`、`final.md`。
5. 更新 `README.md` 的狀態表與一段話版結論，`LOG.md` 加一行，commit、push。

執行注意：`args.root` 要給 `docs/architecture-review` 的絕對路徑。每個 workflow 同時 agent 數上限是 min(16, CPU−2)，核心少就靠多個 workflow 平行。agent 要查網路時先用 ToolSearch 載入 WebSearch / WebFetch。若 agent 寫了檔案但回傳失敗，檔案仍可用，用 `lenses` 參數只補缺的。模型配置照 `03-brief.md` §5：批評 / 答辯用最強模型 high，評審 / 反駁 / 覆核 xhigh，綜合 / 修訂 max，純機械用 Sonnet 級。寫作規範照 `03-brief.md` §4：繁體中文、技術名詞英文、引用需求 ID、事實與意見分開、第三方事實附來源與日期否則標未查證、每份文件開頭結論先講。

全部完成後回報我三樣東西：六份 `score.md` 的加權總分表（答辯前 / 後）、`final.md` 的「結論先講」全文、`final.md` §15 給我的決策清單。
