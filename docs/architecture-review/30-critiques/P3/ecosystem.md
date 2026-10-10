結論先講：**致命 0 條、重大 6 條、次要 2 條。** P3 確實買到 MQTT 入口與本地扇出，但把「可連線」算成「現成 HMI 可用」；Sparkplug 生命週期與消費者契約尚未閉合，不能據此認列「補回一半以上」的生態收益。

審查：2026-10-11，僅 ecosystem。第三方事實沿用 2026-10-10 本地快照，未重新上網或實測；指定 binary、T1 韌體、HMI/plugin 的互通均未查證。N11 是一位維護者當時的傾向，不是永久拒收政策。下列壞點與修法是推論，引用定位見同號證據列；不重報既有 PKI、升級、備份 findings。執行沿用預設模型，strongest/high 無法由宿主驗證，無 effort 設定選項。

## Findings

### ecosystem-01 | 重大 | MQTT 版號不是 T1 接入資格

情境：形狀 (a)/(b)，D-03、D-06 選到固定 topic 的 MQTT T1。壞點：若韌體只能發含空白的 topic，依 N10 會在 listener 被拒，尚未到 validator；即使可連，原廠 topic 也未必符合 P3 的 `t1.<id>.>`。N10 還記錄自 v2.10.0 起的點號轉換，ACL 必須按轉換後 subject 判斷。依據：P3 §3.2、N10/N12；F-22、F-31。這是條件案例，不宣稱已有此型號。

可修：依型號、韌體、client/broker 角色、TLS、認證、原始 topic、QoS 與 session 建能力矩陣；不能重設 topic 者改用相容入口再正規化，不能要求封閉韌體改協定。代價：每型號互通與拒絕測試，必要時加 broker；不能只等 MQTT 5-only 才觸發。

### ecosystem-02 | 重大 | MQTT 5 備案缺少角色與轉換邊界

情境：形狀 (b)/(c)，D-06 的 MQTT 5-only T1 只會 outbound publish。壞點：P3 §7 的「validator 當 client 去訂它」只有對方提供 broker 才成立；另一條「前置 Mosquitto」也未定義如何保住設備必需的 User Properties 或 Expiry。依據：MQ1、N10 與 broker 第 4 列；F-01、F-32。P3 §9 已提出改訂 Mosquitto，故問題是兩節未收斂，不是沒有備案。

可修：選定由 validator 訂獨立 MQTT 5 broker、取代 ingress 的路徑；必要 metadata 明確映射進內部信封，逾期規則另有 owner，拒絕不能保留的能力。代價：client、欄位對映、ACL 與跨版本回歸；不能把協定降版算成透明轉送。

### ecosystem-03 | 重大 | Sparkplug 開機與 Rebirth 被封死

情境：形狀 (b)/(c)，D-06 使用設定了 Primary Host 的 Sparkplug T1。壞點：固定 `spBv1.0` topic 不符合 P3 的 publish prefix；即使修正 prefix，禁止 subscribe 仍令 T1 等不到 STATE，不能發 NBIRTH。晚加入或缺號時，Rebirth 也沒有回程。依據：P3 §3.2/§6、MQ17/MQ20/MQ21；F-31、F-32、N-11。

可修：綁定原廠 group/node/device 與代表身分，按轉換後 subject 授權；只准必要 STATE 與經驗證的 Rebirth，並由 validator 強制先宣告 schema。Rebirth 是恢復資料的協定操作，不可與機台致動命令一概封鎖或一概放行。代價：雙向狀態機及重連測試；D-05 門鎖與 D-06 製程控制仍在範圍外。

### ecosystem-04 | 重大 | NDATA 能過不代表 Sparkplug HMI 能過

情境：形狀 (b)/(c)，D-06 的既有 Sparkplug HMI 重啟後重新訂閱。壞點：P3 讓 validator 理解 BIRTH，卻只描述重發 `meas.>`；沒有輸出標準 topic、型別/alias、seq/bdSeq 與生命週期的責任。依據：P3 §5/§6、MQ18/MQ19/MQ21。NDATA 的 QoS 0 不足以證明整體相容，NDEATH 與 STATE 還有 QoS 1，STATE 要 retained。

可修：明示只支援自訂 JSON HMI，或補完整 Sparkplug 出口及限定 Rebirth；驗證冷啟動、斷線與晚到死亡訊息。代價：codec、狀態與相容性測試。N10 的 QoS 0 限制只指 **NATS 發布到 MQTT 訂閱者**，不能外推到 MQTT-to-MQTT；專用 MQTT publisher 是候選修法，不是已驗證解答。

### ecosystem-05 | 重大 | 宣稱的 MQTT HMI 沒有部署端點

情境：形狀 (b)，D-06 選 MQTT HMI；形狀 (c) 要在 WAN 斷線時照常看站內資料。壞點：P3 §5 指向 leaf，但 §3.1 的 leaf 是 4222，8883 只給 T1 ingress，沒有交代 leaf 的 MQTT listener 與 HMI 通路。不能把 NATS 埠當 MQTT，也不能讓 HMI 改訂未驗證的入口資料。依據：P3 §3.1/§5、N10；M-03、N-01、N-18。

可修：在可信側明列 listener、介面、憑證、唯讀角色與 topic 對映，或另設出口；保留本地訂閱，不繞雲端。代價：設定產生器、防火牆及額外狀態面的驗收；PoC 量採樣至畫面的延遲與 WAN 斷線行為，「本機兩跳」不能代替低延遲指標。

### ecosystem-06 | 重大 | 第 N 個消費者仍缺公開資料契約

情境：形狀 (a)/(b)/(c)，D-03、D-06 新增客戶 MES。壞點：P3 已有 durable consumer 與 PG 選項，但 MES 第一次讀 `MEAS_ALL`，無法僅靠訂閱知道資料對應哪版型別、單位與功能清單；`TOPOLOGY` 存在，卻沒有與樣本及 schema 變更的公開銜接規則。依據：P3 §4.1/§5、e17；F-02、F-03、F-32、F-39。

可修：定義版本化目錄、穩定 id、品質/時間欄位、快照接增量與 replay/live 區別，附唯讀授權範本及首個外部 connector。代價：契約與整合測試，每個消費者仍要欄位對映；不動設備成立，不等於只加 ACL。Grafana 的歷史查詢留在 PG，不應挪成 MQTT datasource 的功勞。

### ecosystem-07 | 次要 | NGSI 與 OPC UA 要各自記帳

情境：形狀 (b)/(c)，D-06 的 SI 要求 NGSI 查詢或 OPC UA HMI，實際需求未查證。壞點：把 Orion 換成 subject 不能保留 entity/query 契約；NGSIv2 與 NGSI-LD 要分別承諾。OPC UA Part 14 的 MQTT payload 也不等於 OPC UA client/server 接口。依據：P3 的消費者清單、buy-options F5/F8、Zenoh 的 OPC UA 段；後者只有搜尋摘要，產品互通未查證。

可修：列標準為條件式 connector，另定 entity、型別與 payload 對映；保留 vendor 管理面（F-34），不恢復整套平台。代價：每個標準各有版本、授權查核及驗收工時。這不是所有客戶的必要條件，故不判致命。

### ecosystem-08 | 次要 | IT 接受度沒有可交付的證據包

情境：形狀 (c)，D-05 管理面與 D-06 HMI 進客戶採購審查。壞點：P3 已說上游稽核不含 agent，也已排 proxy PoC；但 IT 要核准實際端口、身分方式及 SI 指定版本時，仍沒有產品能力清單、驗收紀錄與責任分工可交付。依據：P3 §3.1/§6、N17；N-01、N-18。稽核不是產品認證，MQTT 名稱也不是採購通行證；具體標案與客戶接受度未查證。

可修：沿用既排 PoC，補 broker/client/HMI 版本、支援與不支援項、proxy 放行條件、問題歸屬及客戶簽認。代價：IT/SI 協調與每版證據更新；不能反向假設台灣客戶必拒 NATS 或必愛 MQTT。

## 證據定位

所有連結指向本地檔案的實際列號；事實表自記查證日為 2026-10-10，不代表本次重查。共同來源也支撐後面的讓步與帳本修正。

| Finding | 提案定位 | 事實定位 |
|---|---|---|
| ecosystem-01 | [P3 §3.2](../../20-proposals/P3-nats-leaf.md#L129) | [N10](../../10-facts/nats.md#L30)、[N12](../../10-facts/nats.md#L32) |
| ecosystem-02 | [P3 §7](../../20-proposals/P3-nats-leaf.md#L223)、[P3 §9](../../20-proposals/P3-nats-leaf.md#L267) | [MQ1](../../10-facts/mqtt-semantics.md#L28)、[N10](../../10-facts/nats.md#L30)、[broker 第 4 列](../../10-facts/mqtt-brokers.md#L25) |
| ecosystem-03 | [P3 §3.2](../../20-proposals/P3-nats-leaf.md#L129)、[P3 §6](../../20-proposals/P3-nats-leaf.md#L208) | [MQ17](../../10-facts/mqtt-semantics.md#L64)、[MQ20](../../10-facts/mqtt-semantics.md#L67)、[MQ21](../../10-facts/mqtt-semantics.md#L68) |
| ecosystem-04 | [P3 §5](../../20-proposals/P3-nats-leaf.md#L192)、[P3 §6](../../20-proposals/P3-nats-leaf.md#L208)、[P3 §7](../../20-proposals/P3-nats-leaf.md#L224) | [MQ18](../../10-facts/mqtt-semantics.md#L65)、[MQ19](../../10-facts/mqtt-semantics.md#L66)、[MQ21](../../10-facts/mqtt-semantics.md#L68)、[N10](../../10-facts/nats.md#L30) |
| ecosystem-05 | [P3 §3.1](../../20-proposals/P3-nats-leaf.md#L98)、[P3 §5](../../20-proposals/P3-nats-leaf.md#L192) | [N10](../../10-facts/nats.md#L30) |
| ecosystem-06 | [P3 §4.1](../../20-proposals/P3-nats-leaf.md#L163)、[P3 §5](../../20-proposals/P3-nats-leaf.md#L192) | [e17](../../10-facts/precedents.md#L44)、[N6](../../10-facts/nats.md#L26) |
| ecosystem-07 | [P3 §5](../../20-proposals/P3-nats-leaf.md#L192) | [buy-options F5](../../10-facts/buy-options.md#L79)、[buy-options F8](../../10-facts/buy-options.md#L82)、[OPC UA 摘要](../../10-facts/zenoh.md#L82) |
| ecosystem-08 | [P3 §3.1](../../20-proposals/P3-nats-leaf.md#L120)、[P3 §6](../../20-proposals/P3-nats-leaf.md#L206) | [N17](../../10-facts/nats.md#L37) |
| 共同 | [P3 生態主張](../../20-proposals/P3-nats-leaf.md#L14)、[P3 新鮮度規則](../../20-proposals/P3-nats-leaf.md#L194)、[P3 reconciler](../../20-proposals/P3-nats-leaf.md#L168) | [N11 答覆](../../10-facts/nats.md#L31)、[Z10 原始碼推論](../../10-facts/zenoh.md#L46)、[帳本 retained 裁決](../../40-mqtt-ledger/ledger.md#L27)、[帳本 P3 裁決](../../40-mqtt-ledger/ledger.md#L165)、[帳本 trunk 歸類](../../40-mqtt-ledger/ledger.md#L47) |

## 此點成立與帳本修正

1. 此點成立：符合能力矩陣的 MQTT 3.1.1 T1 可以重用 listener，省掉封包解析；版本不是零生態價值的證據。Z10 對 Zenoh plugin 的限制只是該實作的原始碼推論，也不能移植成 NATS 的限制。
2. 此點成立：本地扇出不必繞雲端，MES 的 durable pull 與 Grafana 的 PG 接法有明確落點；MQTT 工具能檢視可讀的 topic，但理解 KV、SQ/CQ 仍需自己的契約。特定工具/plugin 的支援版本未查證。
3. 此點成立：retained 對晚加入工具仍是有用投影，Will 是連線提示；反對帳本把 retained 概判負資產。它們不代替 owner、裝置時間與結果判定，P3 已保留這些責任。
4. 此點成立：P3 trunk 是 NATS leaf，不是 MQTT bridge；不能把 Mosquitto 的 bridge 限制直接灌給 P3。它既排的 WebSocket/proxy PoC 仍必要，也不能由 HTTPS 或 NATS 名稱保證 IT 放行。

## 作者最怕的問題

哪一組具名 T1 韌體、broker/client 與 HMI 版本，能不改設備程式完成 STATE、BIRTH、Rebirth、斷線恢復及第 N 個消費者接入，而所有新增 adapter、權限與驗收工時都已算進 P3 的「薄 agent」？