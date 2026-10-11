# v1 實作規格

第一個客戶版的實作規格，依 `../architecture-review/50-synthesis/final.md`、owner 的十項裁決與 `v1-posture.md`「剛剛好」姿態寫成。詞彙依 `../architecture-review/03-brief.md` §9。

| 檔 | 內容 |
|---|---|
| `00-scope.md` | 範圍、姿態、v1 不做但預留的事 |
| `10-contract.md` | 傳輸、四個動詞、信封、事實鍵與 slot、命令語意、版本協商、錯誤詞彙、retention 預設 |
| `20-identity.md` | 金鑰、voucher、bootstrap → adopt、續期與恢復、時間、撤銷、trust log schema 與 fleet 見證、網路 profile、靜態秘密 |
| `30-roles.md` | 三種角色的 process 與 UID、backend 介面、leaf SQLite、branch、root node、Odoo connector 路由與 archive gate、recorder 與 history PG |
| `40-update.md` | register 式 app 更新、OS 更新與 tryboot、J 與 D、版本相容 |
| `50-deployment.md` | 三種形狀的元件清單、網路規則、名稱與時間、W0 預算、第一客戶 BOM |
| `60-conformance.md` | conformance case CF-01～20、e2e E-01～07、PoC P-01～07、CI 形狀 |

狀態：草稿 v0.1，2026-10-11。尚未經任何 PoC 驗證；數字為設計預算。
