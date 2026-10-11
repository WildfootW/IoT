# v1 實作規格 §3：角色、process、資料模型

## 3.1 一支 release，三種角色

| 角色 | 啟用的 process | 持有 |
|---|---|---|
| leaf | `node`（client 到 parent；server 給 backend）、`backend-display`、`backend-sensor`、`backend-led`（各自 UID）、`helper`（更新） | SQLite：slots、inbox、result log、spool、cursor、floor、LKG、docs |
| branch | leaf 的全部 + `node` 的 server 面（給 children）、`poller-modbus`、`validator`、`stand-in` 管理、receipt outbox、doc cache | 同上加子樹鏡像、Type 1 origin log |
| root node | `node` server 面、`registry`、`issuer`（獨立 UID，持 authority key）、`recorder`（獨立 UID，持 history role）、`watch-api`、`connector-client`（到 Odoo） | registry（SQLite 或 PG database）、trust log（獨立 SQLite）、doc cache |

規則：解析外部位元組的 process（poller、validator、backend）MUST NOT 與持網路金鑰的 `node` 同 UID；`issuer` 與 `recorder` 各自獨立 UID；`helper` 不依賴 app 目錄內的任何檔案。同一支程式以 `--role` 啟用；角色組合 `leaf+branch`（螢幕兼輪詢 Type 1）合法。

## 3.2 backend 介面（node ↔ backend，localhost UNIX socket，JSON lines）

| 方法 | 方向 | 內容 |
|---|---|---|
| `describe()` | node → backend | 回 function class、schema_rev、capabilities、支援的方法（含是否支援 `query`） |
| `reconcile(desired)` | node → backend | 給一份 desired（含 version）；backend 回 actual `{version_applied, state, detail}`；MUST 冪等 |
| `run(job)` | node → backend | `{key, payload}`；backend 回 `{state, detail, evidence}`；MUST 在開始前以 key 查自己的本地記錄，重複 key 回既有結果 |
| `query(key)` | node → backend | 可選（O03 的 A）；回該 key 的結果或 null |
| `samples()` | backend → node | 推量測批次，含近源時間、seq、quality |
| `health()` | node → backend | readiness、最近錯誤、資源 |

backend 不得開網路 port；不得讀 node 的金鑰；崩潰只影響自己的 function（F-07）。

display backend v1 = Anthias reconcile adapter：以 F-61 的 list / create / update / delete / order 把 playlist desired 收斂到 Anthias API；版本與 id map 由 backend 持有；文件經 node 以 doc grant 取回並驗 hash 後交給 backend；只有 API 回覆時只能回 `backend_confirmed`。

## 3.3 leaf 的 SQLite

```sql
identity(unit_id, inc, pubkey, privkey_ref, env, tenant, voucher, grant, grant_exp, floor_sec_rev, epoch)
slots(slot PRIMARY KEY, revision, version, schema_rev, digest, issued_at, body, source, received_at)       -- desired/cfg/doc 的鏡像
actual(slot PRIMARY KEY, revision, version_applied, state, detail, updated_at)
inbox(id, slot, revision, digest, admitted_at, state)                                                       -- 已受理待執行
jobs(key PRIMARY KEY, payload_digest, state, started_at, finished_at, stage, result_body, evidence, receipt_id)  -- result log 含 UNKNOWN
spool(id, function_id, attr, t, seq, v, q, unc_s, receipt_id)
cursor(parent, cursor, snapshot_rev, updated_at)
docs(doc_id, version, sha256, size, path, pinned_as)   -- current | lkg | applying | cache
windows(name, owner, capacity, used, oldest_age_s, unconfirmed, dropped_total, generation)
```

寫入規則：WAL；`jobs`、`identity.floor_sec_rev`、adopt/revoke 相關 MUST fsync；心跳與 presence 只在記憶體；actual 只在值變時寫。

## 3.4 branch

| 功能 | 規定 |
|---|---|
| server 面 | 對 children 提供 §1 的四個端點與 doc；終結 children 的 TLS；轉送 children 的簽章信封到 parent，不代簽 |
| 子樹 announce | 合成 config space：自己的 functions 加 `children[]` 摘要；child 上下線以 announce 增量更新 |
| receipt outbox | child 的 report/complete 先寫本地 outbox 再回「保管收據」；向 parent 取得最終 receipt 後標記，7 天後 GC |
| doc cache | 依 doc_id@version 快取已驗 hash 的文件；children 以自己的 grant 向 branch 取 |
| poller-modbus | 設定來自 `cfg/poller`：`{unit_id(stand-in), protocol: modbus-tcp|modbus-rtu, address, registers[{attr, fc, addr, type, scale, unit}], period_s}`；輸出走 `samples()` 同一介面 |
| stand-in | 操作員在 root node UI 登記 protocol、位址、VLAN → registry 建 stand-in unit（`trust: stand-in`）→ branch 以自己的簽章代述其 announce 與 meas；MUST 標低信任等級；Type 1 永不獲 grant、永不收下行 |
| validator | 依 schema activation 檢查型別、單位、範圍、速率（F-01）、時間品質；未宣告 attr 拒收並計數；通過才進 spool |
| 類型無知 | branch MUST 原樣轉送未知 slot class；只做 schema 與配額檢查，不做業務邏輯（F-39 守門測試） |

## 3.5 root node

| 元件 | 規定 |
|---|---|
| registry | 投影表：units（unit_id、inc、state、path、parent、functions、classification、grant_exp）、bindings、cfg；可由 trust log 完整重建 |
| issuer | 獨立 process；對 registry 的請求做政策檢查（epoch、floor、分類、claim）後簽：grant、cfg、revoke、schema activation、desired/job 鏡像 frame；每次簽章附 `sec_rev` |
| trust log | §2.8；本地 profile 時與 registry 同主機不同檔案與不同備份流 |
| watch API | 唯讀 consumer：`GET /v1/consumers/{id}/snapshot`、`/watch?cursor`；consumer 有自己的身分與 scope（function、field、line）；v1 的 consumer 只有 ERP connector 與 recorder |
| recorder | 訂閱 meas 與 actual；寫 history PG；commit 後回 receipt 給 root node 轉下去 |
| connector-client | 長輪詢 ERP `/iot/v1/queue`，把 desired 與 job 經 issuer 重簽成 frame；把業務事件、終態、binding 投影 POST 到 `/iot/v1/inbound`；每次派送向 ERP 換 attempt ticket（§3.6 archive gate） |

## 3.6 Odoo connector 模組

| 路由 | 方法 | 內容 |
|---|---|---|
| `/iot/v1/hello` | GET | nonce |
| `/iot/v1/queue` | GET，long-poll ≤ 20 s | 回 desired、job、doc pointer 的增量；每筆由 connection key 簽；帶 `connection_generation` |
| `/iot/v1/ticket` | POST | root node 為一次派送換單用 attempt ticket；connection 為 STOPPING/ARCHIVED 時回 `blocked_archived` |
| `/iot/v1/inbound` | POST | 業務事件、命令終態（含 unknown）、binding 投影、applied version；先驗 root node 身分與 scope 再寫；回真實狀態碼 |
| `/iot/v1/doc/{id}/{version}` | GET | CMS 文件；per-record 短效 grant 驗證；拒非當前版本（F-60） |

資料表：`iot.connection`（state ∈ active/STOPPING/ARCHIVED、generation、root node 身分、env 標籤）、`iot.desired`（function、name、version、body、issued_at）、`iot.job`（key、payload、start_before、conflict_set、state）、`iot.result`（key、state、detail、receipt）、`iot.event`（threshold transition、offline、binding 變更）、`iot.binding`（投影）。

C-20 規則：使用者交易內只寫 outbox 行，MUST NOT 遠端呼叫；dispatcher 在交易外搬運；MUST NOT `cr.rollback()`；`type='json'` 路由 MUST 回真實 HTTP 狀態碼。

archive gate：archive 在本地交易改 `STOPPING`、`generation+1`、停發 ticket；root node 的每次派送（含 retry、鏡像補送）MUST 先換 ticket；在途 ticket 最長 30 s；STOPPING 後全部在途到期加 2 s，才顯示 `ARCHIVED`。

ERP 收什麼、不收什麼：收 binding 狀態、online/offline、命令終態、threshold 事件、applied version；MUST NOT 收每筆量測（F-03、F-30）。

## 3.7 recorder 與 history PG

```sql
CREATE TABLE samples (
  unit_id text, function_id text, attr text, inc int, seq bigint,
  t timestamptz NOT NULL, received_at timestamptz NOT NULL,
  v double precision, vtext text, q smallint, unc_ms int, schema_rev int,
  PRIMARY KEY (unit_id, function_id, attr, inc, seq)
) PARTITION BY RANGE (t);                                  -- 月分區，由 recorder 排程建立與 DROP
CREATE INDEX ON samples USING brin (t);
CREATE TABLE rollup_hourly (unit_id, function_id, attr, bucket timestamptz, n int, sum double precision, min double precision, max double precision, schema_rev int, PRIMARY KEY (...));
CREATE TABLE dirty_buckets (unit_id, function_id, attr, bucket timestamptz, PRIMARY KEY (...));
CREATE TABLE receipts (receipt_id text PRIMARY KEY, unit_id text, function_id text, attr text, seq_from bigint, seq_to bigint, committed_at timestamptz);
```

| 規則 | 內容 |
|---|---|
| 提交 | 樣本、去重、dirty 標記、receipt 同一交易；commit 後才回 receipt |
| roll-up | 排程只重算 dirty bucket；存 n、sum、min、max |
| 保留 | raw ≥ 3 曆年；hourly 5 年；DROP PARTITION 前等 dirty 清完 |
| 角色 | 只有 recorder 持寫入 role；Grafana、MES 各自唯讀 role 與 scope 的 view |
| 門檻事件 | 由資料 owner 節點依 `cfg/thresholds` 計算遲滯與 transition，持久保存 event_id 後以 report 上送；ERP 只收 transition |
| 啟用 | 一屏無 history：recorder 與 PG 在第一個感測器出現時啟用，與 ERP 同引擎、獨立實例 |
