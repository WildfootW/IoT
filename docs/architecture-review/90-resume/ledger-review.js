export const meta = {
  name: 'arch-review-ledger-review',
  description: 'Independent review of the MQTT ledger that the main reviewer wrote when the planned ledger judge was blocked',
  phases: [{ title: 'Review', detail: 'one xhigh reviewer rules on every row of the ledger' }],
}

// args: { root: '/abs/path/to/docs/architecture-review' }
const ROOT = args.root || '/home/user/IoT/docs/architecture-review'

const SCHEMA = {
  type: 'object',
  properties: {
    file: { type: 'string' },
    agree_rows: { type: 'number' },
    disagree_rows: { type: 'number' },
    corrections: { type: 'array', items: { type: 'string' } },
    verdict: { type: 'string', description: '對「我們到底為此得到什麼」的覆核結論，5～10 行' },
  },
  required: ['file', 'agree_rows', 'disagree_rows', 'corrections', 'verdict'],
}

phase('Review')
const review = await agent(`你是這場 IoT 架構對抗式審查的一員，角色是 MQTT 帳本的獨立覆核者。
工作目錄：${ROOT}/
讀：03-brief.md 全文；00-requirements.md、01-proposal-pcie-tree.md、02-tradeoffs.md；10-facts/ 下的 mqtt-semantics.md、mqtt-brokers.md、transport-through-networks.md、precedents.md、nats.md 全文；40-mqtt-ledger/advocate.md、opponent.md、ledger.md 全文；20-proposals/ 六份提案中與 MQTT 有關的節；30-critiques/ 下所有已存在的批評中提到 MQTT、broker、Mosquitto、retained、Will 的段落。
背景：ledger.md 原定由一位獨立評審寫，但因用量上限改由主審代寫；主審同時也寫了 50-synthesis/interim.md。你的任務是覆核，不是重寫：對 ledger.md 的每一行（§1 的 21 行帳本、§2 的重算、§3 的 hop 裁決、§4 的 unit hop 分歧、§5 的提案評比）給出同意 / 不同意 / 修正，並附依據。特別檢查：(1) 主審是否因為自己寫了 P0 而偏袒「不用 MQTT」；(2) 「retained 是負資產」這個判決是否過重；(3) 「unit → bridge 第一版走 HTTPS」的裁決是否有事實支撐，還是只是保守；(4) 帳本有沒有漏掉任何一方提出的論點；(5) §6 缺的事實清單是否完整。
寫作規範同 03-brief.md §4：繁體中文、技術名詞英文、引用需求 ID、事實與意見分開、附來源否則標未查證、開頭「結論先講」。
寫到 ${ROOT}/40-mqtt-ledger/ledger-review.md，長度 2000～4000 字（表格不計）。你的最終文字回覆是依 schema 的結構化資料。`, {
  label: 'mqtt:ledger-review', phase: 'Review', effort: 'xhigh', schema: SCHEMA,
})
log(`帳本覆核完成：同意 ${review ? review.agree_rows : '?'} 行、不同意 ${review ? review.disagree_rows : '?'} 行`)
return review
