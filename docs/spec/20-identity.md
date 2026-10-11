# v1 實作規格 §2：身分、PKI 生命週期、trust log

## 2.1 金鑰與身分

| 項目 | 規定 |
|---|---|
| 金鑰 | 每個 unit 一把 Ed25519 私鑰，MUST 在裝置上產生（首次開機或 provisioning station），MUST NOT 離開裝置。映像不含私鑰 |
| unit_id | `U-` 加序號；序號印成 QR 貼在機身；公鑰指紋（sha256 前 16 byte）一併印 |
| incarnation | 整數，金鑰重生、factory reset、換板時遞增；進每個信封 |
| root node、branch 的身分 | 同樣是 unit（F-24）；branch 自己也有 unit_id 與金鑰 |
| authority | 每個環境一把 authority 簽章金鑰（Ed25519），持有者是 root node 的 issuer process；它簽 adopt grant、cfg、revoke、schema activation、desired 與 job 的鏡像 frame |
| ERP connection | ERP 側 connector 有一把 connection 金鑰，簽它送進 queue 的 desired 與 job；root node 驗後以 authority 身分重簽成下行 frame，原 ERP 簽章保留在 body 內供稽核 |

## 2.2 信任錨（出廠預置）

| 預置物 | 誰簽 | 用途 |
|---|---|---|
| enrolment root 公鑰 | 我們（離線保管） | 驗 voucher |
| recovery root 公鑰 | 我們（離線保管，與 enrolment 分開） | 驗 recovery voucher；失陷時重建信任 |
| env id、tenant id | 寫在 voucher 內 | 防跨環境、跨租戶被採納 |
| voucher | enrolment root | 見 2.3 |
| 站內 CA 公鑰（strict profile 才需要） | 環境中繼 CA | 驗 parent 的 TLS server cert；inspected profile 用公開 CA 或企業 CA 皆可 |

DNS 與 mDNS MUST 只用於定位 parent，MUST NOT 作為信任依據。

## 2.3 voucher

JWS，由 enrolment root 簽：

```json
{ "unit_id": "U-7F3A…", "pub": "ed25519:…", "env": "prod", "tenant": "t-acme",
  "parents": ["authority:a-acme-site1"], "iat": 1760000000, "exp": 1917000000,
  "claim": "sha256:<一次性 claim code 的雜湊>" }
```

- `parents` 限制哪個 authority 可以採納它；一屏直連 root node 時這裡就是該 root node 的 authority id。
- `claim` 對應一張印在出貨單或 QR 上的一次性 claim code；操作員在 Manage 時輸入，防止同 VLAN 的鄰居搶先採納。
- voucher 只在 `unadopted` 狀態下隨 announce 送出；採納後 MUST NOT 再接受同 voucher 的重新採納（除非 incarnation 遞增且走 recovery）。

## 2.4 bootstrap → adopt

```
leaf                         branch / root node                  issuer + trust log            ERP
 │ hello → nonce              │                                   │                             │
 │ announce(voucher, 簽章) ──▶│ 驗 voucher、env、tenant、parents │                             │
 │ ◀ state=unadopted, parent_time, cursor                        │                             │
 │                            │── present(unit) ────────────────▶│ registry: present/unadopted │
 │                            │                                   │────── Fleet 投影 ──────────▶│ 顯示「待採納」
 │                            │                                   │◀───── Manage(unit, claim) ──│ 操作員輸入 claim code
 │                            │                                   │ 驗 claim；寫 trust log(adopt) │
 │                            │                                   │ 取 checkpoint；發 grant     │
 │                            │◀─ cfg: parent, path, grant ──────│ registry 投影更新            │
 │ ◀ watch frame: cfg/grant   │                                   │────── managed 投影 ────────▶│ 顯示「已採納」
 │ 之後的 report/complete 帶 grant 的 kid                         │                             │
```

規則：
- ERP 的 Manage 只是意圖；MUST 在 trust log 寫入並取得 checkpoint 後，ERP 才建 managed 投影（F-33）。
- grant 是 authority 簽的 JWS：`{unit_id, inc, path, functions, exp: iat+7d, sec_rev}`。它不是秘密，是公開可驗的授權；洩漏無害。
- 採納後 voucher 的 claim 失效；bootstrap 狀態下 MUST 只能 announce。

## 2.5 續期、過期、恢復

| 情況 | 規定 |
|---|---|
| 正常續期 | grant 有效 7 天；leaf 在剩餘 50% 加 jitter 時於 report 回應中取得新 grant；不需操作員 |
| 斷電超過 7 天（農曆年） | 過期 ≤ 30 天：leaf 走 `POST /v1/recover`，以 nonce 持鑰證明加最新已知 `sec_rev` 換新 grant；server 檢查未撤銷、floor 一致。recover 只開放續期，不開放 report、doc、job |
| 過期 > 30 天 | 回到 unadopted；需操作員重新 Manage（可重發 claim code，不需重燒 voucher） |
| 無 RTC | 開機時以 announce 回應的 `parent_time` 加 uncertainty 鬆弛驗證；見 2.6 |
| branch 自己 | 同 leaf 規則，無中繼 CA |
| authority 金鑰輪替 | 新 key 由舊 key 簽 trust set，fleet 確認收到後退舊；grant 重簽 |
| authority 失陷或 trust log 全失 | 以 recovery root 簽的 recovery voucher 建新 authority 與新 epoch；全 fleet 重新 adopt（幾十片螢幕是幾十分鐘） |

## 2.6 時間

| 規則 | 內容 |
|---|---|
| 可信時間區間 | 每個 node 維護 `[t_low, t_high]`；來源：RTC（若有）、站內 NTP、parent_time；三者不一致取不確定度 |
| 高水位 | 持久保存「最近一次核准時間」；重啟後時間不得低於它 |
| 單一 boot 內 | 用 monotonic clock 推進，不信牆鐘回撥 |
| 不確定度 > 2 s 或回撥 | 停止新授權、停止新讀；保留 LKG 播放；q 標 `invalid_time` |
| 期限判定 | 一律用區間上界判斷到期 |
| 公網 NTP | (c) 形狀 MUST NOT 偷加；時間來源只有核准的站內源或 parent_time |

## 2.7 撤銷

| 項目 | 規定 |
|---|---|
| 來源 | 只有 authority 能撤銷；寫 trust log（action=revoke）取 checkpoint 後，`revoke` slot 的 `sec_rev` 遞增並沿樹鏡像 |
| 線上目標 | 60 s 內 parent 拒絕被撤銷 unit 的新工作與新 grant |
| 離線 | 被撤銷的 leaf 若斷線，最多再用完手上 grant 的剩餘期限；操作 lease 300 s 到期後不接受新命令 |
| 裝置的判讀 | 收到 authority 簽的撤銷證明 → `rejected`，停止一切上傳、保留 LKG、顯示「已撤銷」；只是連不上或 401 無簽章 → `unknown`，照 N-11 繼續 |
| 不做 | 一般拒絕或網路失聯 MUST NOT 觸發 wipe；v1 無遠端 wipe |

## 2.8 trust log

**定義。** 只追加的安全決策紀錄，是身分與授權事實的唯一 owner。root node 的 registry 是它的投影，可從它重建。

**schema（SQLite，獨立檔案，不在 ERP 的 PG 備份集內）**

```sql
CREATE TABLE trust_log (
  seq         INTEGER PRIMARY KEY,          -- 單調遞增 = security_revision
  prev_digest TEXT NOT NULL,                -- 前一筆的 digest
  digest      TEXT NOT NULL UNIQUE,         -- sha256(JCS(entry without digest/sig))
  ts          INTEGER NOT NULL,             -- unix 秒
  actor       TEXT NOT NULL,                -- 'erp:<conn>' | 'operator:<id>' | 'authority:<id>'
  action      TEXT NOT NULL,                -- adopt|revoke|key_rotate|policy|binding|classification|schema_activation|epoch|archive_generation|parent_change
  subject     TEXT NOT NULL,                -- 'unit:<id>' | 'fn:<class>' | 'connection:<id>' | 'authority:<id>'
  payload     TEXT NOT NULL,                -- JSON，完整決策內容（不是摘要）
  evidence    TEXT,                         -- JSON，來源證據（claim code 雜湊、操作員、ERP 請求 digest）
  sig         TEXT NOT NULL                 -- authority 對 digest 的 Ed25519 簽章
);
CREATE TABLE checkpoint (
  seq INTEGER PRIMARY KEY REFERENCES trust_log(seq),
  state_digest TEXT NOT NULL,               -- 重播到此 seq 的完整安全狀態 digest
  ts INTEGER NOT NULL, sig TEXT NOT NULL
);
```

**規則。**
- 每筆寫入前以預期 `seq` 做 CAS；寫入、fsync、簽章後才算完成。
- 每筆都是完整決策內容；digest 不能當重建資料。
- 匯出格式 NDJSON，append-only，增量備份只送新 seq。
- `security_revision` = 最新 seq。每個下行 frame 帶簽發當下的 `sec_rev`。
- **fleet 見證**：每個 leaf 與 branch 持久保存見過的最高 `sec_rev` 作 floor。收到 `sec_rev` 低於 floor 的 authority 簽章 MUST 拒絕並回 `rollback_detected`。這讓 root node 從舊備份還原的事件被偵測。
- **還原程序**：封操作入口 → 從最新可用副本重播 trust log → 核對最新 checkpoint 的 `state_digest` → 若 fleet 回報的 floor 高於本地 seq，表示有遺失：不得補權，進 2.5 的「全失」路徑 → 否則發新 epoch，重簽 grant。
- **解封**：trust log 檔案與 authority 私鑰以 k-of-n 解封材料加密；v1 設 1-of-2（保管人一份、密封備用一份）；可配置。

**位置 profile。**

| profile | 預設於 | 備份 |
|---|---|---|
| 本地 | (a)(b) | 每日加密匯出到客戶指定位置（NAS、USB、客戶備份系統），與業務備份不同排程 |
| 本地加雲端見證 | 客戶同意時 | 每個 checkpoint 的 `state_digest` 送我們雲端存證；不送內容 |
| 雲端 authority | (c)，或客戶要求代管 | 我們的備份；站點斷 WAN 時不能 adopt 與新撤銷，既有 lease 照舊到期 |

## 2.9 網路 profile

| profile | TLS | 身分 | 何時 |
|---|---|---|---|
| inspected（**預設**） | child 驗 parent 的 server cert（公開 CA 或企業 CA 皆可）；允許客戶 TLS 檢查 proxy | 完全靠 JWS 信封與 nonce；線上零可重用秘密 | 所有形狀的預設 |
| strict | 加 mTLS：leaf 以同一把 Ed25519 key 產 CSR，環境中繼 CA 簽 X.509 client cert；parent pin 我們的 CA | JWS 信封照常 | 客戶要求不被檢查，或日後敏感資料 |

**線上禁止出現的東西（任何 profile）**：bearer token、密碼或 verifier、私鑰、解封材料、可重放的 session cookie。文件存取用簽章且綰 unit 與 doc 的短效 grant（`doc-grant` purpose，5 分鐘），不是 token。

## 2.10 靜態秘密

| 項目 | 規定 |
|---|---|
| 私鑰 | 專用 UID 可讀的檔案，0600；node process 以該 UID 跑；backend 不可讀 |
| authority 私鑰 | issuer process 專用 UID，與 registry、recorder、ERP 不同 UID；只簽核准用途的 digest，不提供任意 bytes 簽名 |
| 設定與 log | MUST NOT 含秘密；一個 resolver 解封到 tmpfs；缺 key fail closed |
| staging | 每個信封帶 `env`；staging 的 authority 與 connection key 不同；從 prod 還原的 DB 在 staging 啟動時 connector MUST 比對 env 標籤，不符即 archive 連線並拒發任何 frame |
