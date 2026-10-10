export const meta = {
  name: 'arch-review-wave-b-proposal',
  description: 'Wave B for one proposal: the missing lens critics attack it, its defender answers every finding (new and existing), a judge scores R1-R8 before and after the rebuttal',
  phases: [
    { title: 'Critique', detail: 'one critic per missing lens (default: correctness, scenarios, ecosystem)' },
    { title: 'Rebuttal', detail: 'the defender rules on every finding of all five lenses and amends the proposal' },
    { title: 'Score', detail: 'the judge scores R1-R8 with justification' },
  ],
}

// args: { code: 'P2', file: 'P2-https-pull-defended.md', root: '/abs/path/to/docs/architecture-review', lenses?: ['correctness','scenarios','ecosystem'] }
const ROOT = args.root || '/home/user/IoT/docs/architecture-review'
const code = args.code
const file = args.file
const WANTED = args.lenses || ['correctness', 'scenarios', 'ecosystem']

const COMMON = `你是這場 IoT 架構對抗式審查的一員。
工作目錄：${ROOT}/
第一步：讀 ${ROOT}/03-brief.md 全文（特別是 §1 情境錨點、§2 可妥協項、§3 評分準則、§4 寫作規範、§8 批評 lens）。第二步：讀 00-requirements.md、01-proposal-pcie-tree.md、02-tradeoffs.md。第三步：讀 LOG.md 與 50-synthesis/interim.md 以了解審查進度（interim.md 是主審的中期綜合，不是結論；你可以反駁它）。
寫作規範：繁體中文、技術名詞保留英文、引用需求用 ID、事實與意見分開、第三方事實附來源（10-facts 的檔名與列號，或 URL 與查證日期）否則標「未查證」、每份文件開頭一段「結論先講」。
不討好任何提案，也不為反對而反對：提案說對的地方要寫「此點成立」。批評要具體到「哪個部署形狀、哪個 D-xx、哪一步會壞」。
你的最終文字回覆不是給人看的訊息，而是依 schema 的結構化資料。文件本體用 Write 工具寫到指定的檔案路徑（目錄不存在就先建）。`

const ALL_LENSES = [
  { key: 'security', name: '安全', facts: 'transport-through-networks.md、mqtt-brokers.md、nats.md、mqtt-semantics.md', ask: 'hostile T1 怎麼被圍堵、是否真的「child 只看得到 parent」；bootstrap / adopt / revoke / 輪替每一步有沒有洞；誰終結 TLS、唯一憑證發行者是否真的唯一；第 (c) 種 cloud 形狀（站點只有 outbound、客戶可能有 TLS 檢查 proxy）身分怎麼活下來；公開螢幕的 defacement 路徑；N-02～N-04；B-10 會不會重現；retained/快取被偽造的路徑；供應鏈與 CVE 面。' },
  { key: 'longevity', name: '十年維運', facts: 'mqtt-brokers.md、nats.md、buy-options.md、zenoh.md、postgres-timeseries.md', ask: '誠實重算 M-02 的種類數（引擎、語言、runtime、repo、要追的外部時鐘各算一種）；每個外部元件的 release 節奏、LTS 有無、授權（M-05）；bus factor；升級路徑與跨版本相容；備份與還原（N-09）；M-01；三年後要換掉其中一塊的代價。' },
  { key: 'correctness', name: '正確性', facts: 'mqtt-semantics.md、precedents.md、nats.md', ask: 'F-46～F-54 逐條驗：命令會不會丟（ERP 掛、bridge 掛、unit 掛、網路斷各一次）；會不會重複執行；順序；結果可觀察（F-49）；離線行為（N-11）；每個 retention window 是否明寫且有監控；時間戳（F-02、N-14）；B-01～B-14 哪些會重現；「送達被當完成」有沒有在任何一跳偷偷發生；schema 先宣告（F-31、F-32）在這個傳輸上怎麼強制。' },
  { key: 'scenarios', name: '情境擬合', facts: 'transport-through-networks.md、precedents.md、buy-options.md', ask: 'D-01～D-06 逐一走完整流程（從 ERP 按下 Apply 到螢幕換頁、從感測器讀值到 Grafana 畫線、從 Modbus 儀表到歷史表、從 LED show 下達到結果回來、D-05 的管理面、D-06 的 HMI 層）；三種部署形狀各自的實際元件清單與防火牆規則；一片螢幕的最小部署真的只有它說的那幾個服務嗎（把隱藏的依賴挖出來：DNS、NTP、CA、反向代理、資料庫、Anthias、nginx）；N-07、N-12、N-13、N-14、N-18。' },
  { key: 'ecosystem', name: '生態', facts: 'mqtt-brokers.md、mqtt-semantics.md、buy-options.md、zenoh.md、precedents.md', ask: '講 MQTT 的 T1 設備怎麼接、代價；D-06 現場 HMI 的低延遲層；第 N 個消費者（MES、Grafana、客戶自己的系統）接上來要動什麼；第三方工具與標準（Sparkplug B、NGSI、OPC UA）能不能用；owner 的核心疑問「放棄或採用 MQTT 我們到底得到什麼」在這份提案裡的答案是否有事實支撐（對照 40-mqtt-ledger/ledger.md，可以反駁它）；對客戶 IT 與標案的觀感。' },
]
const LENSES = ALL_LENSES.filter(l => WANTED.includes(l.key))

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    file: { type: 'string' },
    findings: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' }, severity: { type: 'string', description: '致命 | 重大 | 次要' },
      scenario: { type: 'string' }, breaks_at: { type: 'string' }, evidence: { type: 'string' },
      fixable: { type: 'string', description: '可修 | 不可修 | 不確定' }, fix: { type: 'string' },
    }, required: ['id', 'severity', 'scenario', 'breaks_at', 'evidence', 'fixable'] } },
    concedes: { type: 'array', items: { type: 'string' }, description: '提案說對了什麼' },
    hardest_question: { type: 'string' },
  },
  required: ['file', 'findings', 'concedes', 'hardest_question'],
}

const REBUTTAL_SCHEMA = {
  type: 'object',
  properties: {
    file: { type: 'string' },
    accepted: { type: 'number' }, partially: { type: 'number' }, refuted: { type: 'number' },
    changes: { type: 'array', items: { type: 'string' }, description: '提案修訂了什麼' },
    remaining_weaknesses: { type: 'array', items: { type: 'string' } },
  },
  required: ['file', 'accepted', 'partially', 'refuted', 'changes', 'remaining_weaknesses'],
}

const SCORE_SCHEMA = {
  type: 'object',
  properties: {
    file: { type: 'string' },
    scores_after: { type: 'object', properties: { R1: { type: 'number' }, R2: { type: 'number' }, R3: { type: 'number' }, R4: { type: 'number' }, R5: { type: 'number' }, R6: { type: 'number' }, R7: { type: 'number' }, R8: { type: 'number' } }, required: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8'] },
    weighted_total_before: { type: 'number' },
    weighted_total_after: { type: 'number' },
    must_fix: { type: 'array', items: { type: 'string' } },
    steal_worthy: { type: 'array', items: { type: 'string' } },
    verdict_line: { type: 'string' },
  },
  required: ['file', 'scores_after', 'weighted_total_before', 'weighted_total_after', 'must_fix', 'steal_worthy', 'verdict_line'],
}

// ---- Critique: barrier is deliberate, the defender needs all critiques ----
phase('Critique')
const critiques = await parallel(LENSES.map(l => () =>
  agent(`${COMMON}

你是批評者，lens = ${l.name}（${l.key}）。目標提案：${ROOT}/20-proposals/${file}（代號 ${code}）。
第四步：讀目標提案全文。第五步：讀 ${ROOT}/10-facts/ 中與你的 lens 相關的檔案，至少：${l.facts}。第六步：讀 ${ROOT}/30-critiques/${code}/ 下已存在的批評（security.md、longevity.md），避免重複它們已經寫過的 finding；你的 lens 不同，但若它們漏了致命問題你可以補。可以瀏覽 ${ROOT}/20-proposals/ 的其他提案做對照，但你的任務是攻擊 ${code} 這一份。

你要問的問題：${l.ask}

任務：找出這份提案在「${l.name}」面向上哪個情境、哪一步會壞。每一條 finding 要有：編號（${l.key}-01 起）、嚴重度（致命 / 重大 / 次要；致命 = 在某個錨點情境下方案不成立）、情境（具體到部署形狀 (a)(b)(c) 與 D-xx）、壞在哪一步、依據（需求 ID、10-facts 檔名與列號、或 URL）、可不可以修（可修：怎麼修、代價；不可修：為什麼）。
目標 6～15 條，寧精勿多；每一條都要是讀完整份提案後仍然成立的，不要攻擊提案已經自己承認並處理的點（除非它的處理不夠）。
也要列「此點成立」清單：提案說對了什麼，至少 3 條。
最後一節：如果你是這份提案的作者，你最怕評審問什麼？一句話。

寫到 ${ROOT}/30-critiques/${code}/${l.key}.md。長度 1500～4000 字（表格不計）。開頭「結論先講」要寫：致命幾條、重大幾條、一句總評。`, {
    label: `${code}:critic:${l.key}`, phase: 'Critique', effort: 'high', schema: FINDINGS_SCHEMA,
  })))
const critiquesOk = critiques.filter(Boolean)
const nFatal = critiquesOk.flatMap(c => c.findings).filter(f => f.severity.includes('致命')).length
const nMajor = critiquesOk.flatMap(c => c.findings).filter(f => f.severity.includes('重大')).length
log(`${code}：${critiquesOk.length}/${LENSES.length} 份新批評完成，致命 ${nFatal}、重大 ${nMajor}`)

// ---- Rebuttal ----
phase('Rebuttal')
const rebuttal = await agent(`${COMMON}

你是提案 ${code} 的答辯者（辯護律師兼修補者）。第四步：讀 ${ROOT}/20-proposals/${file} 全文。第五步：讀 ${ROOT}/30-critiques/${code}/ 下全部五份批評：security.md、longevity.md、correctness.md、scenarios.md、ecosystem.md。需要查事實時讀 ${ROOT}/10-facts/。

本輪新批評的摘要（供對照，以檔案為準）：
${JSON.stringify(critiquesOk.map(c => ({ file: c.file, findings: c.findings.map(f => ({ id: f.id, severity: f.severity, breaks_at: f.breaks_at })) })), null, 0)}

任務：對五份批評的每一條 finding 裁決：接受（並修改提案：寫出修法與代價）/ 部分接受（哪部分成立、哪部分不）/ 反駁（給依據：需求 ID、事實檔案列號、或邏輯）。致命級 finding 一條都不得迴避。不要為了辯護而辯護：批評成立就承認，承認比硬拗更能得分。
產出 rebuttal.md，含：
1. 結論先講：接受幾條、部分幾條、反駁幾條；提案因此改了什麼（三行內）。
2. 逐條裁決表：finding 編號 / 嚴重度 / 裁決 / 理由（含依據）/ 若接受：修法與代價（種類數、人週、時鐘）。
3. 修訂後的提案差異：只寫改變的部分，引用原提案節號；若修訂改變了 §2 元件清單或 §7 妥協清單，重列那兩張表。
4. 仍然承認的弱點：修不掉的，誠實列出。
寫到 ${ROOT}/30-critiques/${code}/rebuttal.md。長度 2500～6000 字（表格不計）。`, {
  label: `${code}:rebuttal`, phase: 'Rebuttal', effort: 'high', schema: REBUTTAL_SCHEMA,
})
log(`${code}：答辯完成，接受 ${rebuttal ? rebuttal.accepted : '?'}、部分 ${rebuttal ? rebuttal.partially : '?'}、反駁 ${rebuttal ? rebuttal.refuted : '?'}`)

// ---- Score ----
phase('Score')
const score = await agent(`${COMMON}

你是評審。第四步：讀 ${ROOT}/20-proposals/${file} 全文。第五步：讀 ${ROOT}/30-critiques/${code}/ 下五份批評與 rebuttal.md。需要查事實時讀 ${ROOT}/10-facts/。

評分：依 03-brief.md §3 的 R1～R8，每項 0～10 分，寫出理由並引用具體 finding 編號或提案節號；分「答辯前」與「答辯後（採納 rebuttal 的修訂）」兩欄；再乘權重（R1 20、R2 15、R3 15、R4 20、R5 15、R6 5、R7 5、R8 5）得加權總分（滿分 100）。
評分原則：R1 看錨點情境有沒有哪一步走不通，走不通一處就不該高於 5；R2 看致命級安全 finding 是否被解掉；R3 看 F-46/F-47 是否結構上成立而不是靠承諾；R4 誠實重算種類數與時鐘，不要接受提案自己的算法；R5 看 owner 的 MQTT 疑問在這裡有沒有被事實回答；R6～R8 看人週與可逆性的估計是否可信。
另外回答：
- 這份提案若要成為最終方案，必須先解掉的三件事（must fix）。
- 它最值得被其他提案借走的三個想法（steal-worthy）。
- 一句話裁決。
寫到 ${ROOT}/30-critiques/${code}/score.md。長度 1500～3500 字（表格不計）。`, {
  label: `${code}:judge`, phase: 'Score', effort: 'xhigh', schema: SCORE_SCHEMA,
})
log(`${code}：評分完成，答辯前 ${score ? score.weighted_total_before : '?'} → 答辯後 ${score ? score.weighted_total_after : '?'}`)

return { code, critiques: critiquesOk, rebuttal, score }
