結論先講：致命 0 條、重大 6 條、次要 2 條，共 8 條。P1 買到真實的 MQTT 接點與站內扇出，但「接上 broker」尚不等於 T1 可交付、HMI 可判讀、消費者可獨立接入；這些收益不足以替全樹 MQTT 管理面背書。

審查日：2026-10-11。對象：[P1-mqtt-native.md](../../20-proposals/P1-mqtt-native.md)。事實沿用 2026-10-10 紀錄，本次外部來源未查證；搜尋摘要、原始碼推論不升格為實測。以下反例是待驗收情境，工時是評論者估算，可重疊、不可直接加總，不含採購與客戶等待。

## Findings

### ecosystem-01 | 重大 | T1 能講 MQTT，不代表能進 raw

情境與失效：(b) D-06 的封閉 PLC gateway 若固定 vendor topic，CONNECT 成功後第一筆 PUBLISH 就被 `raw/<id>/#` ACL 拒絕；P1 §3.3 的 schema 守門員尚未收到資料。實際型號的 MQTT 版本、TLS、可改 broker/topic 與身分能力均未查證。

依據：F-22/F-26/F-31/F-32；[mqtt-brokers.md:28](../../10-facts/mqtt-brokers.md#L28) 記的是 broker ACL，沒有證明設備可配合。

可修：每型號建立 admission profile，以可信來源映射 topic、單位、時間與 quality，再建立 T1 代表；不能區分來源就拒收。沿用 security-09 的隔離實例修法，另列 C-25 的 AP/switch 隔離施工，不能只算開 port。估每型號 0.5～1 人週驗證，網路設備與施工另計。

### ecosystem-02 | 重大 | LAN 延遲不是 HMI 端到端延遲

情境與失效：(b)(c) D-06，HMI 訂閱 P1 §5 的同一份 `m`。若資料先經 §3.3 的限速或聚合，被省略的變化在顯示步驟已無法恢復；broker 再快也補不回。

依據：D-06、F-01/F-02、P1 §5/§6。需求沒有指定毫秒數，不能推定 1 Hz 必然不合，也不能以「LAN 等級」判已滿足。

可修：先約定採樣到顯示的 p95 與容許資料年齡；必要時在上送降頻前分出本地 feed，較高速資料不上 trunk/ERP。估 1 人週量測，驗收涵蓋 WAN 斷線與 T1 滿載；目前延遲未查證，不填虛構效能數字。

### ecosystem-03 | 重大 | Expiry 不等於既有畫面會變 stale

情境與失效：(b) D-06 HMI 已收到值，PLC 隨後停報，但 broker 與 HMI 仍連線。P1 §5 只驗「新訂閱者不收過期 retained」；既有畫面若一直保留最後值，F-04 仍失敗。

依據：[mqtt-semantics.md:36](../../10-facts/mqtt-semantics.md#L36) 僅記 broker 移除規則，未證明會通知既有 HMI 清除畫面。P1 已有 timestamp/status，但沒有 consumer 使用契約。

可修：要求依來源時間、TTL 與 quality 顯示 stale，不以接收時間續命；測既有訂閱、晚加入、斷流後重連。不支援者加 adapter 或不列相容。估 0.5～1 人週；[longevity.md](longevity.md) 的 longevity-06 把第三方過期值留給 best-effort，不足以滿足此情境。

### ecosystem-04 | 重大 | 第 N 個消費者仍需要身分與目錄

情境與失效：(a)(b)(c) D-06，MES 訂某機器的 path；unit re-plug 後 P1 §8 清掉舊 topic，MES 的 ACL/訂閱卻未跟 serial 移轉，於是斷流。改訂全站 `#` 則可能越過產線授權。

依據：F-19/F-40/N-03、P1 §5；[mqtt-brokers.md:28](../../10-facts/mqtt-brokers.md#L28) 提供 client/role 操作，不決定業務 scope。

可修：補 consumer 身分、唯讀 scope、輪替/撤銷與 serial→path 目錄，產生並驗證 ACL。相容的即時 reader 可不動裝置；不同 schema 仍需 decoder，Grafana 歷史仍走 P1 已有的 PG。估共用流程 1～2 人週，每 consumer 設定與驗收另計，不是零人週。

### ecosystem-05 | 次要 | 歷史接即時不是兩個入口就完成

情境與失效：(c) D-06，客戶 MES 若要求先讀 PG 歷史再訂 MQTT，查詢完成與 SUBSCRIBE 之間的新量測會漏；先訂閱也須處理重疊。P1 §5 已提供 PG，但未定義交界。

依據：F-08/F-12；[mqtt-semantics.md:43](../../10-facts/mqtt-semantics.md#L43) 的有限 session queue 不是歷史游標；[precedents.md:44](../../10-facts/precedents.md#L44) 的 list/watch 有明示版本契約。

可修：明列 live-only，或先緩衝 live、補歷史至 watermark、按 sample key 去重，並約定入庫延遲與保留窗；不把量測寫進 ERP。估 1～2 人週整合。回補需求未查證，不要求所有 HMI 都付此費，故列次要。

### ecosystem-06 | 重大 | Sparkplug 副本缺 BIRTH 恢復流程

情境與失效：(b)(c) D-06 開啟可選 Sparkplug，HMI 在 NBIRTH 後啟動，只收到含 alias 的 NDATA。P1 §6「另外發 NBIRTH/NDATA」未保證補回定義；唯讀角色也不能要求 Rebirth。

依據：[mqtt-semantics.md:65](../../10-facts/mqtt-semantics.md#L65)、[mqtt-semantics.md:66](../../10-facts/mqtt-semantics.md#L66)：BIRTH 定義 metric 且不 retain，Rebirth 借 NCMD；[mqtt-semantics.md:67](../../10-facts/mqtt-semantics.md#L67) 另有 STATE/session 流程。

可修：獨立資料面 client 管 BIRTH、alias、seq/bdSeq 與 host 角色；只接受守門員驗證的 Rebirth，拒絕機台寫入。[security.md](security.md) 的 security-10 若一概封 NCMD，反而阻斷恢復。估 2～3 人週並測晚加入、重啟、缺序。Ignition 模組、Tahu/plugin 的現況與授權適用性未查證（[mqtt-semantics.md:70](../../10-facts/mqtt-semantics.md#L70)），不承諾開箱即用。

### ecosystem-07 | 次要 | Wire 相容沒有補回 NGSI 或 OPC UA 語意

情境與失效：(b) D-06 若指定 NGSI consumer 或 OPC UA 系統，收到 P1 JSON 仍不等於讀得懂 entity/metric。P1 §2 替換 Orion、§6 加 Sparkplug，未交代另外兩者的接入契約。

依據：[buy-options.md:84](../../10-facts/buy-options.md#L84) 記有 Smart Data Models；[zenoh.md:82](../../10-facts/zenoh.md#L82) 記 OPC UA PubSub over MQTT 的 UADP/JSON 編碼，但只是搜尋摘要，現版相容性未查證。這也不等於 OPC UA Client/Server。

可修：確認標案 profile 後才映射 id、型別、單位、quality/時間及 schema 版本；既有管理平台依 F-34 做 connector。估每 profile 1～3 人週 PoC，不承諾全標準支援；客戶是否要求這些標準未查證，故列次要。

### ecosystem-08 | 重大 | MQTT 名稱不能代替客戶 IT 核准

情境與失效：(c) D-01/D-06 新站點只核准指定 HTTPS 流量，若不准 WSS Upgrade，P1 §7「不需 bypass 就能上線」在握手即失敗。這是待驗收反例，不是台灣客戶常態。

依據：M-03/F-41/N-18、P1 §3.4/§7；[ledger.md](../../40-mqtt-ledger/ledger.md) §6 仍列 proxy PoC 未決。允許 outbound 只是方向，不代表任意應用協定獲准。

可修：投標前確認 DNS、port、proxy 認證、WSS/idle policy、憑證與 consumer 權限；不通就明列例外核准或 HTTPS 退路的成本。估驗收包 0.5～1 人週，等待與改傳輸另估；客戶條款、產品認證、授權適用性均未查證，不能宣稱 MQTT 自帶合規。

## 成立之處

- P1 此點成立：HMI 就近訂閱，不繞 ERP/cloud，保留 F-03 的分工。
- P1 此點成立：retained 只當快取，owner 與版本仍由 node/ERP 持有。
- P1 此點成立：T1 raw→驗證→正式 topic 的方向合理，沒有把 wire 相容當 schema 驗證。

## 對帳與裁決

不同意 [ledger.md](../../40-mqtt-ledger/ledger.md) §0/§2 一概把 retained 判成負資產：[mqtt-semantics.md:14](../../10-facts/mqtt-semantics.md#L14) 支持 late-joiner 快取的用途，ecosystem-03 要的是使用條件，不是取消它。也反駁 [interim.md](../../50-synthesis/interim.md) §3.9「第三個消費者只加 token」：ecosystem-04/05 的契約成本不會因 HTTPS 消失；P1 §9「一條 ACL 回本」同樣沒有交付證據。

owner 真正買到的是通用接點、扇出與初始快照，不是 payload 理解、管理平台或回補保證。[zenoh.md:46](../../10-facts/zenoh.md#L46) 的原始碼推論也提醒「有 MQTT 入口」未必有 retain/Will，尚待實測，不能當等價替代。不用 MQTT 可以少 broker 耦合，卻仍須替 MQTT T1 與既有 HMI 付 adapter 成本；保留站內生態價值，不足以推出所有 unit、trunk 與管理面都應 MQTT 化。

## 作者最怕的問題

能否讓一台未改韌體的 T1 與一個晚加入的 HMI，在 WAN 中斷、資料停更及 unit 換 path 後仍正確運作，並逐項指出省下的工作為何需要全樹 MQTT，而非只有站內 broker？