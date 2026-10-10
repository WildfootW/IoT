export const meta = {
  name: 'arch-review-wave-c',
  description: 'Wave C: one synthesizer writes the balanced architecture from all review output, three refuters attack it, a completeness critic asks what is missing, a reviser produces final.md',
  phases: [
    { title: 'Synthesis', detail: 'one max-effort synthesizer writes 50-synthesis/draft.md' },
    { title: 'Refute', detail: 'three xhigh refuters, distinct lenses' },
    { title: 'Completeness', detail: 'what is missing versus the requirements and the fatal findings' },
    { title: 'Revise', detail: 'one max-effort reviser writes 50-synthesis/final.md' },
  ],
}

// args: { root: '/abs/path/to/docs/architecture-review' }
const ROOT = args.root || '/home/user/IoT/docs/architecture-review'

const COMMON = `你是這場 IoT 架構對抗式審查的一員。
工作目錄：${ROOT}/
必讀：03-brief.md 全文；00-requirements.md、01-proposal-pcie-tree.md、02-tradeoffs.md；LOG.md；50-synthesis/interim.md（主審的中期綜合，可反駁）；10-facts/ 全部八份的「結論先講」節（需要時讀全文）；20-proposals/ 六份全文；30-critiques/P1～P6 下全部檔案（五個 lens、rebuttal.md、score.md）；40-mqtt-ledger/ 全部（advocate、opponent、ledger、ledger-review 若存在）。
寫作規範（03-brief.md §4）：繁體中文、技術名詞保留英文、引用需求用 ID、事實與意見分開、第三方事實附來源否則標「未查證」、每份文件開頭一段「結論先講」。
你的最終文字回覆不是給人看的訊息，而是依 schema 的結構化資料。文件本體用 Write 工具寫到指定的檔案路徑。`

const STRUCTURE = `文件結構（標題照抄，一節不可省）：
1. 結論先講：方案一句話；相對 P0 改了哪五件最重要的事；owner 的 MQTT 問題的最終答案（三行）。
2. 方案總覽：元件清單表（元件 / 自建或外部 / 授權 / 維護者與時鐘 / 取代掉什麼），用 longevity 批評的嚴格計法重算種類數；三種部署形狀各一張 ASCII 圖；最小部署的真實清單含隱藏依賴。
3. 契約與語意：register、SQ/CQ、announce/config space、owner 持有事實；F-46～F-54 逐條（成立 / 部分 / 不成立 + 怎麼成立）；版本協商與相容矩陣；conformance suite。
4. 身分與 PKI 生命週期：信任錨預置、裝置產鑰、bootstrap → adopt → 續期 → 撤銷、有效期與寬限、私鑰保管與備份分流、根與中繼輪替、environment id、下行與上行物件的端到端簽章（信封欄位）、(c) 形狀 mTLS 可選的退路規則。
5. 樹、trunk、傳輸：每一條 hop 用什麼；HTTPS 串流的參數；consumer API；retention window 全表（每個 window 的 owner、長度、drop 計數）。
6. MQTT 放法：採 ledger 的放法或修正它，寫明觸發、實例切分、node 守門員、unit hop 的決定與重新評估條件。
7. 回傳資料與 store：最小部署、第一個感測器之後、搬遷門檻、roll-up、Grafana。
8. 升級路徑：node 自更新（register 式）或 Mender，選一個並重算 M-02 與人週。
9. 邊緣 process 切分與 ERP 邊界：哪些 process、誰持憑證、Anthias 退場觸發；ERP 持有什麼、bridge 0 持有什麼、Odoo 權限與 defacement 的門、staging 自動失效。
10. D-01～D-06 逐一走過：從 ERP 按鈕到裝置、從感測器到圖，每個 5～10 行，含 D-05 管理面與 D-06 HMI 層。
11. 妥協清單：表格，需求 ID / 妥協內容 / 換到什麼 / 代價；逐條對照 03-brief.md §2。
12. §9 開放問題的最終答案：一題一行。
13. 第一天必做清單與觸發表：什麼事件讓我們付下一筆。
14. PoC 清單與人週：到第一個客戶價值的人週與假設；每個 PoC 要回答的問題與通過條件。
15. 仍未解決的事與給 owner 的決策清單：每一項寫出選項與你的建議。
長度 6000～12000 字（表格與圖不計）。`

const DRAFT_SCHEMA = {
  type: 'object',
  properties: {
    file: { type: 'string' },
    headline: { type: 'string' },
    kinds_count: { type: 'number' },
    compromises: { type: 'array', items: { type: 'string' } },
    decisions_for_owner: { type: 'array', items: { type: 'string' } },
  },
  required: ['file', 'headline', 'compromises', 'decisions_for_owner'],
}

const REFUTE_SCHEMA = {
  type: 'object',
  properties: {
    file: { type: 'string' },
    findings: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' }, severity: { type: 'string' }, breaks_at: { type: 'string' }, evidence: { type: 'string' }, fix: { type: 'string' },
    }, required: ['id', 'severity', 'breaks_at', 'evidence'] } },
    survives: { type: 'boolean', description: '方案在你的 lens 下整體是否成立' },
    verdict_line: { type: 'string' },
  },
  required: ['file', 'findings', 'survives', 'verdict_line'],
}

const GAPS_SCHEMA = {
  type: 'object',
  properties: {
    file: { type: 'string' },
    gaps: { type: 'array', items: { type: 'object', properties: { what: { type: 'string' }, why_it_matters: { type: 'string' }, source: { type: 'string' } }, required: ['what', 'why_it_matters'] } },
  },
  required: ['file', 'gaps'],
}

// ---- Synthesis ----
phase('Synthesis')
const draft = await agent(`${COMMON}

你是綜合者。讀完全部產出後，寫出平衡方案的草稿。原則：(1) 以評分最高、答辯後仍成立的提案為骨架，借走其他提案 score.md 標為 steal-worthy 的想法；(2) 每一條致命與重大 finding 都要在方案裡有對應的處置（解掉、接受並說明、或列為 PoC），不得靜默；(3) interim.md 的十條共識若你不同意，寫出理由；(4) 妥協要照 03-brief.md §2 的規則寫明換到什麼。
${STRUCTURE}
寫到 ${ROOT}/50-synthesis/draft.md。`, {
  label: 'synthesis:draft', phase: 'Synthesis', effort: 'max', schema: DRAFT_SCHEMA,
})
log(`草稿完成：${draft ? draft.headline : '（無）'}`)

// ---- Refute: barrier is deliberate, the reviser needs all three ----
phase('Refute')
const REFUTERS = [
  { key: 'security-correctness', name: '安全與正確性', ask: '把 30-critiques 裡所有致命與重大的 security / correctness finding 逐條拿來對草稿檢查：草稿的處置是真的解掉、還是只是重述？PKI 生命週期每一步有沒有洞？端到端簽章的信封欄位夠不夠？F-46～F-54 在草稿的傳輸上是否結構成立？retention window 表有沒有漏？' },
  { key: 'longevity-scenarios', name: '十年維運與情境擬合', ask: '重算草稿的種類數與外部時鐘；OTA 的選擇是否可信；備份還原每個狀態庫是否都有；然後把 D-01～D-06 與三種部署形狀逐步走過，找出草稿沒走通的那一步；一片螢幕的最小部署的真實清單是否誠實。' },
  { key: 'ecosystem-cost-erp', name: '生態、成本與 ERP 邊界', ask: 'MQTT 放法是否真的拿回失去 A（第三方工具接入）與 B（hostile T1 入口）；D-06 SCADA 與 D-05 事件型資料的答案是否成立；人週估計是否可信；ERP 邊界（誰持有 desired、排程、binding）是否與 C-20、F-41、F-67～F-72 相容；Odoo 年度大版的遷移成本是否入帳；客戶 IT 與標案觀感。' },
]
const refutations = await parallel(REFUTERS.map(r => () =>
  agent(`${COMMON}

你是反駁者，lens = ${r.name}。第一步讀 ${ROOT}/50-synthesis/draft.md 全文。你的任務是推翻它：預設它是錯的，找出「哪個情境、哪一步會壞」。${r.ask}
每一條 finding：編號（${r.key}-01 起）、嚴重度（致命 / 重大 / 次要）、壞在哪一步、依據（需求 ID、批評檔名與 finding 編號、10-facts 列號）、修法與代價。也列草稿說對的 3 件事。最後回答：在你的 lens 下草稿整體成立嗎？
寫到 ${ROOT}/50-synthesis/refute-${r.key}.md，長度 2000～4500 字（表格不計）。`, {
    label: `refute:${r.key}`, phase: 'Refute', effort: 'xhigh', schema: REFUTE_SCHEMA,
  })))
const refOk = refutations.filter(Boolean)
log(`反駁完成：${refOk.length}/3，成立 ${refOk.filter(r => r.survives).length}/3`)

// ---- Completeness ----
phase('Completeness')
const gaps = await agent(`${COMMON}

你是完整性批評者。讀 ${ROOT}/50-synthesis/draft.md 與三份 refute-*.md。然後問「少了什麼」：
(1) 00-requirements.md 的每一條 M / F / N 需求，草稿是否都有處置（滿足、妥協並說明、或明寫不做）？列出沒有被提到的 ID。
(2) 00 §9 的每一個開放問題是否都有最終答案？
(3) 30-critiques 裡每一條致命 finding 是否都在草稿或反駁裡被處理？列出漏掉的編號。
(4) 03-brief.md §1 的九個錨點是否都被遵守？
(5) 有沒有任何一個「未查證」的事實被草稿當成事實使用？
(6) 有沒有任何一個 PoC 沒有通過條件？
寫到 ${ROOT}/50-synthesis/completeness.md，長度 1500～3500 字。`, {
  label: 'completeness', phase: 'Completeness', effort: 'high', schema: GAPS_SCHEMA,
})
log(`完整性批評完成：${gaps ? gaps.gaps.length : '?'} 個缺口`)

// ---- Revise ----
phase('Revise')
const final = await agent(`${COMMON}

你是修訂者。讀 ${ROOT}/50-synthesis/draft.md、三份 refute-*.md、completeness.md。吸收所有成立的反駁與缺口，寫出最終版。規則：(1) 每一條反駁 finding 在最終版裡要有去向（採納並改、或在 §15 說明為何不採）；(2) 完整性批評列出的每個缺口都要補；(3) 結構與草稿相同（15 節）；(4) §15 的 owner 決策清單要是最終版，每項有選項、建議、理由、不決定的後果；(5) 文末附「相對草稿的變更摘要」。
${STRUCTURE}
寫到 ${ROOT}/50-synthesis/final.md。`, {
  label: 'synthesis:final', phase: 'Revise', effort: 'max', schema: DRAFT_SCHEMA,
})
log(`最終版完成：${final ? final.headline : '（無）'}`)

return { draft, refutations: refOk, gaps, final }
