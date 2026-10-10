結論先講：**致命 0 條、重大 7 條、次要 1 條。** P4 買得到 connector 與服務端能力，尚未買到可直接交付的資料與授權契約；不能據此斷言「平台一概不能買」，也不能把現案當成已可交付。既有安全與十年維運 finding 不撤銷。

# P4 生態批評

日期：2026-10-11。證據沿用本地 2026-10-10 紀錄，非本輪網路查證；搜尋摘要不升格為實測。以下判斷與修法屬審查意見，工時是新增工作的粗估，不是報價。

## Findings

### ecosystem-01 | 重大 | MQTT 接通不是完成 onboarding

情境／斷點：(a)(b)(c)，D-02/D-03；F-22/F-26/F-31/F-32。P4 §3.2 已加 broker/converter，但固定 topic 的封閉 T1 不能被要求改成 `raw/<id>/#`；CONNECT 成功與 key 白名單也不保證型別、單位及 tenant 身分正確。

證據：[mqtt-brokers.md L28](../../10-facts/mqtt-brokers.md#L28) 證實 ACL 能力，不是 schema onboarding；實際 T1 型號相容性未查證。

可修／成本：按型號驗版本、TLS、topic/payload。可配置成平台格式者仍須驗 schema 與 tenant；其餘由 south 登錄一次、以可信來源映射代表並同步 Fleet，不能採信 payload 自報身分。每型號估 0.5～1 人週，加入異型資料拒絕測試。

### ecosystem-02 | 重大 | 本地 HMI 缺點位新鮮度與離線驗收

情境／斷點：(b)(c)，D-06；F-01/F-04/N-11/N-21。WAN 斷後 HMI 重登，PLC 停送但 Gateway 仍在線：P4 §5 已承認 widget 要設定，僅靠 `active` 仍可能把舊點位顯成正常。「LAN 延遲」也未量到採樣至畫面的整段路徑。

證據：[P4-buy.md L188](../../20-proposals/P4-buy.md#L188)；離線登入、WebSocket 重連與資料品質傳遞均未查證。

可修／成本：測斷雲重啟 HMI、點位停更及補送；每點保留量測時間、quality、age，先定延遲驗收值。上送 1 Hz 不應限制現場採樣；配方與控制留原 HMI。估 0.5～1 人週，不能以畫得出 dashboard 代替驗收。

### ecosystem-03 | 重大 | 第 N 個消費者仍需授權與 export 配置

情境／斷點：(a)(b)(c)，D-01/D-03/D-06；F-40/N-03。MES 取得 tenant JWT，或 Grafana 取得整張 `ts_kv` 的 SELECT 後讀另一條線：唯讀只禁止寫入，不代表資料範圍正確。P4 §5 的 MQTT export 還要改 Edge rule chain，與「不動 Edge」矛盾。

證據：[P4-buy.md L180](../../20-proposals/P4-buy.md#L180)；[buy-options.md L28](../../10-facts/buy-options.md#L28) 的功能合併只有摘要，所選授權下的細粒度 RBAC 未查證。

可修／成本：REST/WebSocket、SQL views、MQTT export 共用 site/function/field 清單，分發可撤銷的 consumer 身分，測跨租戶拒絕與撤銷後重連。估 1～2 人週；不改裝置成立，零配置不成立。

### ecosystem-04 | 重大 | 加 broker 不等於 Sparkplug B 互通

情境／斷點：(b)(c)，D-06；F-32/F-44/N-21。新 HMI 訂閱時，Edge 若只 publish 一般 JSON，沒有 BIRTH 點表與 alias 狀態；重連後也不能由 broker 猜出正確生命週期。

證據：[mqtt-semantics.md L65](../../10-facts/mqtt-semantics.md#L65) 的 BIRTH、[L68](../../10-facts/mqtt-semantics.md#L68) 的 seq/bdSeq；P4 所選版本是否原生提供所需 Sparkplug 發布端未查證，不能判成一定沒有。

可修／成本：先驗原生角色或選維護狀態已確認的 endpoint/library，測 late join、斷線、重生與 schema 更新；僅放行指定 Rebirth，封鎖製程 NCMD/DCMD。估 1～2 人週及相容性測試；Tahu/plugin 現況仍須查，見 [L70](../../10-facts/mqtt-semantics.md#L70)。

### ecosystem-05 | 重大 | OPC UA connector 未定義介面方向

情境／斷點：(b)(c)，D-06；F-34/N-21。合作夥伴交付 PLC 點表後，若要求 OPC UA 資訊模型或 PubSub，P4 §6 的 connector 名稱不能證明能輸出 UA server、保留 quality，或訂閱指定 PubSub 編碼。

證據：[zenoh.md L82](../../10-facts/zenoh.md#L82) 區分 Part 14、MQTT 與 UADP/JSON，但僅搜尋摘要；P4 實際 connector 模式、版本與安全 profile 未查證。

可修／成本：先確認 Client/Server 或 PubSub、方向、編碼、憑證信任與 timestamp/quality 對映；沿用既有機台 HMI，我方只旁路讀取，不開製程寫入。每 profile 估 0.5～1 人週，不為清單上的協定全部建 adapter。

### ecosystem-06 | 次要 | NGSI 的資料契約價值不能被命令缺陷抹掉

情境／斷點：(a)(b)，D-03/D-06；F-34/F-39。若新增既有 NGSI consumer，平台 attributes 不會自動維持它的 entity、型別與 subscription 契約。P4 §4.5 說 FIWARE 只剩「今天在跑」的價值，忽略資料互通；目前尚無具名需求，故列次要。

證據：[buy-options.md L79](../../10-facts/buy-options.md#L79) 的 NGSIv2 與 [L82](../../10-facts/buy-options.md#L82) 的 Orion-LD 必須分開評估；P4 原生 NGSI 支援未查證。

可修／成本：有實際需求才選定 v2 或 LD，做唯讀資料 facade 與型別、身分對映，命令不回流 FIWARE。估 1～2 人週與一套契約測試，不因保留標準就恢復整套舊平台。

### ecosystem-07 | 重大 | 自訂 glue 仍在新功能的關鍵路徑

情境／斷點：(a)(b)(c)，D-01/D-04；F-39/F-46/F-47。新 LED 功能增加結果欄位，connector 送出後，filter 或 `iot_tb` 輪詢欄位未同步，ERP 仍看不到結果。P4 已承認去重自建，卻未交代如何只加 backend 與管理模組便完成擴充。

證據：[P4-buy.md L127](../../20-proposals/P4-buy.md#L127) 與末句「不是安全邊界與狀態機」不相容；[buy-options.md L92](../../10-facts/buy-options.md#L92) 只是未查到官方 Odoo connector，不是證明不存在。

可修／成本：一份版本化功能契約生成 filter/對映，明列廠商負責 transport/server state，我方負責 tenant/schema、端點去重、結果對帳及升版測試。估 1～2 人週整理契約；不能把這些工作列成買掉的成本。

### ecosystem-08 | 重大 | 廠牌與 source-available 不是驗收資格

情境／斷點：(a)(b)(c)，D-05/D-06；M-05/N-18。簽客戶 IT 問卷與第二站報價時，P4 §6 用公司名稱回答認證、用 repo 內有功能推定可交付，都缺範圍證據。

證據：[buy-options.md L26](../../10-facts/buy-options.md#L26) 是免費用量及 branding 義務摘要，[L28](../../10-facts/buy-options.md#L28) 的 integrations 權利亦待核；具名認證、台灣客戶接受度、代持授權權利均未查證，不能寫成不存在或已通過。

可修／成本：取得指定版本、功能、站點數、licensee、下游義務及支援期限的書面條款，另列認證適用範圍與客戶網路驗收。估 0.5 人週整理；法務、費用及日曆時間未知。商業付費本身不等於違反 M-05。

## 此點成立

1. 此點成立：依 P4 既有查證的 [RPC 狀態列舉](https://raw.githubusercontent.com/thingsboard/thingsboard/master/common/data/src/main/java/org/thingsboard/server/common/data/rpc/RpcStatus.java)（2026-10-10），送達與完成有不同狀態；買服務端能力不等於只買 MQTT，亦不等於端點結果已耐久。
2. 此點成立：P4 引錄的 [Gateway 清單](https://raw.githubusercontent.com/thingsboard/thingsboard-gateway/master/README.md)（既有查證 2026-10-10）提供 Modbus/OPC UA 等 connector，可減少協定實作；點表、schema 與隔離仍須我方完成。
3. 此點成立：D-06 把本地 HMI、ERP 業務與分析分流是正確方向，不必為了採 MQTT 強迫客戶換 HMI；驗收缺口不等於這個形狀沒有價值。

## 對中期結論的修正

[interim.md L27](../../50-synthesis/interim.md#L27) 應限縮為「尚未證明三形狀可交付且不綁客戶」，不是「不能買平台」；代持商業授權能否滿足 M-05 仍待條款，不替既有致命 finding 解套。

[../../40-mqtt-ledger/ledger.md](../../40-mqtt-ledger/ledger.md) 的「MQTT 不給語意」不能推成服務端能力也買不到；[mqtt-semantics.md L53](../../10-facts/mqtt-semantics.md#L53) 的 Azure twin 是反例。retained 一概算負資產亦過重，[precedents.md L51](../../10-facts/precedents.md#L51) 有 retained discovery/Birth 用法；可信資料投影可取其 late-joiner 收益，但不是 owner 或新鮮度證據。P4 採 MQTT 得到既有 client/connector，放棄通用 broker 扇出則改付平台 API 與 export 的成本，兩筆不能混算。

## 作者最怕被問的一句話

斷雲後重啟 HMI，再加入第二廠牌 T1 與受限 MES consumer，能否逐項證明哪些只需配置、哪些仍要自訂 glue，並出示不把資料權限與授權義務交給客戶承擔的驗收證據？