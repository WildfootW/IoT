# v1 實作規格 §1：契約

契約是語言中立、傳輸中立的語意層。v1 唯一的生產 binding 是 HTTPS；in-memory binding 是測試 oracle。每個 node 角色都同時是 server（對 children）與 client（對 parent）。

## 1.1 傳輸（HTTPS binding）

| 項目 | 規定 |
|---|---|
| 方向 | 連線 MUST 由 child 發起；parent MUST NOT 向 child 發起任何連線 |
| 協定 | HTTPS over TLS 1.3（MAY 接受 1.2）；HTTP/1.1；port 443 預設；(c) 形狀 MAY 經核准的 explicit proxy（CONNECT） |
| 下行 | 走 child 已開的 `watch` 串流或 `fetch` long-poll |
| 串流 | `GET /v1/watch`，回應為 NDJSON；server 每 20 s 送 heartbeat frame；client watchdog 70 s 無 frame 即重連 |
| long-poll | `GET /v1/fetch?hold=20`，hold MUST ≤ 20 s，有新 frame 即回 |
| 退路 | 偵測到 proxy 緩衝整個回應（70 s 無 heartbeat 但連線存活）時 client MUST 改用 fetch |
| timeout | client 請求 30 s；一般上送 10 s；server 對 idle 連線 ≥ 90 s |
| 配額 | 每 child ≤ 2 條同時連線；批次 ≤ 256 items 或 256 KiB；單一 result body ≤ 64 KiB |
| 重連 | 指數退避加 jitter，1 s 到 60 s；MUST 遵守 `Retry-After`；parent 限制新連線率 |
| 快取 | 快照回應帶 `ETag`；client 帶 `If-None-Match` 省流量；304 不取代權威 |
| 媒體與大檔 | `GET /v1/doc/{doc_id}/{version}`，支援 `Range`；MUST 驗 hash 後才可用 |

## 1.2 四個動詞

| 動詞 | 方法 | 誰 → 誰 | 做什麼 |
|---|---|---|---|
| announce | `POST /v1/announce` | child → parent | 連線後第一件事：送 config space（身分、契約版本、功能、schema、capability、宣告的 window）；取回採納狀態、cfg 快照、parent 時間 |
| report | `POST /v1/report` | child → parent | actual slot、量測批次、心跳；取回 receipt |
| fetch / watch | `GET /v1/fetch`、`GET /v1/watch` | child 拉 | desired、job、cfg、撤銷清單、schema activation、tombstone 的快照與增量 frame |
| complete | `POST /v1/complete` | child → parent | job 的結果（result log）與 actual 變更；取回 receipt |

branch 對 children 是 server，對 root node 是 client，MUST 原樣轉送 child 的簽章信封，不得代簽。branch 自己的 announce 包含整個子樹的合成 config space。

root node 對 ERP：root node 是 connector 的 client。`GET /iot/v1/queue?cursor=&hold=20` 讀 ERP 的 desired 與 job queue；`POST /iot/v1/inbound` 推業務事件、命令終態、binding 投影；`GET /iot/v1/doc/{id}/{version}` 拉 CMS 文件。方向與樹內一致。

## 1.3 信封

每個請求 body 與每個下行 frame MUST 是一個 JWS。

| 項目 | 規定 |
|---|---|
| 序列化 | JWS JSON serialization；payload 為 JCS（RFC 8785）正規化後的 JSON |
| 演算法 | `EdDSA`（Ed25519）。白名單只有它；收到其他 `alg` MUST 拒絕 |
| protected header | `alg`、`kid`、`typ: "iot-env+json"`、`fmt: 1` |
| 重複 key | payload 含重複 JSON key MUST 拒絕 |
| 大小 | 單一信封 ≤ 256 KiB；超過者走 doc |

payload 欄位：

| 欄位 | 型別 | 必填 | 意義 |
|---|---|---|---|
| `env` | string | MUST | 環境 id（prod、staging 各一） |
| `tenant` | string | MUST | 租戶 id |
| `iss` | string | MUST | 簽章者：`unit:<unit_id>` 或 `authority:<authority_id>` 或 `erp:<connection_id>` |
| `aud` | string | MUST | 收件者：`unit:<unit_id>`、`unit:<unit_id>/fn:<function_id>`、`authority:<id>`、`parent` |
| `purpose` | enum | MUST | `announce` `report` `complete` `desired` `job` `cfg` `revoke` `schema` `doc-grant` `receipt` `hello` |
| `epoch` | int | MUST | authority_epoch；收件者 MUST 拒絕低於其已知 epoch 者 |
| `inc` | int | MUST（unit 簽） | unit 的 incarnation（金鑰或重置世代） |
| `sec_rev` | int | MUST（authority 簽） | 簽發時 trust log 的 security_revision；收件者更新 floor |
| `nonce` | string | MUST | 由對方 `hello` 取得的 60 s 單用 nonce |
| `seq` | int | MUST | 本 session 內單調遞增 |
| `iat` | int | MUST | 簽發時間（unix 秒） |
| `nbf` / `exp` | int | SHOULD | 有效區間；desired 與 job MUST 有 `exp`（start_before） |
| `body_digest` | string | MUST | `sha256:` 加 body 的 digest |
| `body` | object | MUST | 動詞專屬內容 |

收件者 MUST 檢查：簽章、`env`、`tenant`、`aud` 是自己、`epoch` 不倒退、`sec_rev` 不低於 floor、`nonce` 未用過且在 60 s 內、`seq` 遞增、時間在可信區間（見 §2.6）。任何一項失敗回 `rejected`，不執行。

## 1.4 事實鍵與 slot

事實鍵：`(env, tenant, unit_id, function_id, slot)`。`path`（樹上的位置）MUST NOT 進事實鍵，只用於路由。

| slot class | 寫入者 | 讀取者 | 語意 |
|---|---|---|---|
| `desired/<name>` | ERP（經 root node 鏡像） | leaf | 期望狀態。`version` 由 ERP 給，單調遞增；done = `actual/<name>.version == desired/<name>.version` |
| `actual/<name>` | leaf | 全部上游 | 實況。含 `version_applied`、`state ∈ {observed, pending, applied, refused, deferred, error}` |
| `job/<key>` | ERP | leaf | 一次性工作。`key` 不可重用；含 `payload_digest`、`start_before`、`conflict_set` |
| `result/<key>` | leaf | 全部上游 | job 結果。`state ∈ {ok, refused, error, unknown, timeout}`；MUST 先落盤再上報 |
| `meas/<attr>` | leaf 或 branch 的 stand-in | recorder、root node | 量測批次 |
| `cfg/<name>` | registry（root node） | leaf、branch | 管理設定：`parent`、`functions`、`software`、`windows`、`time` |
| `revoke` | authority | 全部 | 撤銷清單鏡像，含 `sec_rev` |
| `schema/<function_class>@<rev>` | authority | 全部 | schema activation receipt |
| `doc/<id>@<ver>` | ERP（經 root node） | leaf | 文件 pointer：`url`、`sha256`、`size`、`grant` |
| `event/<id>` | 保留 | 保留 | v1 不啟用 |

每個 slot item：

```json
{ "slot": "desired/playlist", "revision": 1842, "version": 57,
  "schema_rev": 3, "digest": "sha256:…", "issued_at": 1760140000,
  "body": { … } }
```

`revision` 是 owner 端的單調序號；`version` 是業務版本（只有 desired 與 actual 有）。同 version 異 digest MUST 隔離並回 `conflict`。

## 1.5 announce 的 body

```json
{ "unit_id": "U-7F3A…", "inc": 4, "node_version": "1.3.0",
  "hw": {"model": "cm4-7a-box", "ram_mib": 2048, "storage_gib": 32},
  "os": {"id": "debian", "version": "12"},
  "contract": {"major": 1, "minor": 0, "features": ["stream", "batch", "doc-range"]},
  "roles": ["leaf"],
  "functions": [
    { "function_id": "display.0", "class": "display", "schema_rev": 3,
      "capabilities": {"backend": "anthias", "max_assets": 200},
      "classification_hint": "intent-only",
      "windows": {"result_log_days": 90, "spool_hours": 48, "spool_mib": 1024} }
  ],
  "children": [ ] }
```

`children` 只有 branch 角色填：子樹的 announce 摘要（unit_id、function 清單、認證等級）。Type 1 的 stand-in 以 `"trust": "stand-in"` 標示。

回應 body：`state ∈ {unadopted, adopted, revoked}`、`path`、`contract`（parent 選定的 major.minor 與 features 交集）、`parent_time`（含 uncertainty）、`cfg` 快照、`schema` activation 清單、`cursor`。`unadopted` 時只給 `parent_time` 與 `cursor`，其餘 MUST 省略。

## 1.6 report 的 body

```json
{ "heartbeat": {"uptime_s": 86400, "link": "ok"},
  "actual": [ {slot item}, … ],
  "meas": [ { "function_id": "env.0", "attr": "hcho_ppb", "schema_rev": 2,
              "samples": [ {"t": 1760140000, "seq": 9912, "v": 41.2, "q": "ok", "unc_s": 0.4} ] } ] }
```

`t` 是近源採樣時間（unix 秒，MAY 帶小數）；`seq` 是來源序號；`q ∈ {ok, warmup, fault, invalid_time, stale}`；`unc_s` 是時間不確定度。received_at 由收件者填，不由來源填。

回應：`receipts[]`，每筆 `{slot|meas, revision|seq_range, digest, receipt_id, epoch}`。來源收到 receipt 才可釋放該範圍的 spool。

## 1.7 fetch 與 watch 的 frame

```json
{"type": "snapshot", "cursor": "R-1842", "items": [ … ]}
{"type": "item", "cursor": "R-1843", "item": {slot item, 由 authority 或 ERP 簽的信封}}
{"type": "tombstone", "cursor": "R-1844", "slot": "job/…"}
{"type": "heartbeat", "cursor": "R-1844", "parent_time": {...}}
{"type": "gap"}   // cursor 過期：client MUST 重取 snapshot
```

第一個 frame MUST 是完整 snapshot（固定水位 R）；之後為增量。cursor 過期回 410 加 `gap`。client MUST 每 120 s 做一次批次清冊對帳（送出自己持有的 slot revision 清單，parent 回差異）。

## 1.8 complete 的 body

```json
{ "results": [ { "slot": "result/j-01HX…", "state": "ok", "revision": 77,
                 "started_at": 1760140001, "finished_at": 1760140004,
                 "detail": {...}, "evidence": {...} } ],
  "actual": [ … ] }
```

規則：leaf MUST 先把 result 寫入本地 result log 並 fsync，再呼叫 complete。`unknown` 是合法終態，MUST 攜帶 `stage`（executing、effect_maybe_applied）與可用證據。parent 回 receipt；ERP 的最終 receipt 由 root node 在 ERP commit 後簽回。

## 1.9 命令語意

| 規則 | 內容 |
|---|---|
| intent | 每 function 一個 reconciler；由 desired 與 backend 實況差異驅動；同 version 已套用則無動作；舊 version 不覆寫新 version |
| job claim | leaf 以 `key` 與 `payload_digest` 原子 claim；先寫 `executing` 再叫 backend；先寫 result 再 complete |
| 去重 | 同 `key` 再來 MUST 回既有 result，不重跑 |
| UNKNOWN | 效果可能已發生而 result 未提交：持久保存 `unknown`、原 key、stage、資源、證據。MUST NOT 自動重跑、換 key、改成未執行、因新 epoch 清鎖 |
| keyed backend | backend 介面 MAY 提供 `query(key)`；有則 leaf 用它把 unknown 解成終態（O03 選項 A） |
| 衝突集合 | ERP 持 `conflict_set`、single-flight、`start_before`；timeout 只記逾期，不釋放衝突槽 |
| 拒絕 | 裝置可 `refused` 或 `deferred`，帶理由與 version |
| 分類 | function class 的分類由 authority 記在 trust log；capability_digest 變更時 MUST 停該 function 新下行直到重判 |

## 1.10 版本協商

| 項目 | 規定 |
|---|---|
| wire | `major.minor`；major 不相容；minor 向後相容 |
| 協商 | announce 帶 child 支援的 `major.minor` 與 features；parent 回交集；無交集回 `incompatible` 並列出需要的 features |
| 在線版本 | parent MUST 支援當前與前一個 major |
| 未知 slot class | branch MUST 原樣轉送；只有 root node 的政策可以拒絕（F-39 的守門測試） |
| 升級順序 | 預設 parent 先升；混版矩陣見 §6 |

## 1.11 錯誤詞彙

| 碼 | 意義 |
|---|---|
| `rejected` | 信封驗證失敗（簽章、aud、epoch、nonce、時間） |
| `unadopted` | 身分合法但未採納；只能 announce |
| `revoked` | 已撤銷；回應附簽章的撤銷證明 |
| `incompatible` | 契約版本無交集 |
| `conflict` | 同 version 異 digest，或 job key 重用異 payload |
| `gap` | cursor 過期 |
| `blocked_archived` | 連線已封存，不發新 ticket |
| `quota` | 超過配額或 window |
| `unknown_schema` | schema_rev 未 activation |
| HTTP | 200 / 202 / 304 / 400 / 401 / 403 / 409 / 410 / 413 / 429 / 503；`type='json'` 的 Odoo 端 MUST 回真實狀態碼，不回 200 包錯誤 |

## 1.12 retention window 預設值（全部是設定，可改）

| 事實 / owner | 預設 | 滿額行為 |
|---|---|---|
| ERP desired、registry cfg | 當前至被取代；audit 180 天 | 拒新變更，不刪當前 |
| ERP job queue | 未決無 TTL；`start_before` 預設 10 min、上限 7 天 | 未開始過期記 refused；unknown 不解鎖 |
| leaf result log | 未獲 ERP receipt 無 TTL；已交接 ≥ 90 天；預留 256 MiB | 滿額停新工作 |
| branch receipt outbox | 最終 receipt 前 pin；交接後 7 天 | hop ack 不清唯一結果 |
| ERP 結果與事件 archive | ≥ 3 年 | GC 留範圍與筆數 |
| telemetry spool | leaf 48 h 或 1 GiB；branch 4 GiB | 等 PG receipt；超限丟最舊量測並記缺口，不擠 result log |
| watch log / snapshot | 7 天或 64 MiB / 30 min | 410 加快照 |
| 文件與媒體快取 | pin current、LKG、applying；未引用最多 3 版或 30 天 | 不足拒 Apply，不刪唯一可播版本 |
| heartbeat / offline | 120 s / 5 min | 不逐心跳入 ERP |
| 操作 lease / 派送 ticket | 300 s / 30 s | 期限分別驗 |
| nonce | 60 s 單用；已用 cache 10 min | 重啟新 nonce |
| ERP inbound replay | 2 天 | 只清已交接 |

每個 window MUST 輸出：owner、最老年齡、容量、未確認數、drop 計數（含世代，還原不歸零）。
