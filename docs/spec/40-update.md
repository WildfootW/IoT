# v1 實作規格 §4：更新路徑

## 4.1 app 更新：register 式

| 項目 | 規定 |
|---|---|
| desired | `cfg/software`，由 release key 簽的 manifest：`{version, artifacts[{name, doc_id, version, sha256, size}], requires: {hw[], os[], min_node_version, min_sec_rev}, rollout: {canary[], batch_size, abort_on_fail}}` |
| 取得 | leaf 以 doc grant 沿 parent 取 artifact（branch 快取）；MUST 驗 sha256 後才寫入 staged |
| 目錄 | `/opt/node/releases/<version>/`；`current`、`candidate`、`previous` 為 symlink；bundle 內含 node、backends、隨 app 走的 Python package；interpreter、TLS、系統 library 不在 bundle 內 |
| 切換 | `helper`（獨立 UID、不依賴 app 目錄）停新 admission、等進行中 job 到安全點、原子切換 `current` → 重啟 node → 健康檢查（readiness、能簽 actual、能連 parent）→ 寫 `committed`；失敗則切回 `previous` |
| 回報 | `actual/software`：`{version_current, version_previous, state ∈ {staged, switching, committed, rolled_back, failed}, reason}` |
| rollout | registry 依 manifest 的 rollout 先 canary 再小批再全站；任一 `failed` 停止；離線的 leaf 顯示 pending |
| 不回退的 | 更新與回滾 MUST NOT 回退 result log、UNKNOWN、floor、deliberate-stop marker、security 高水位 |
| 共用依賴 | 任何需要改 interpreter、TLS、kernel、renderer 的變更 = OS 更新（§4.2），不得以 minor 名義走 app 路徑 |

## 4.2 OS 更新

| 項目 | 規定 |
|---|---|
| v1 預設 | 維護窗內以核准套件或完整映像更新；更新前 app 進 stopped 狀態、LKG 繼續播 |
| tryboot（G-U 第一項） | Raspberry Pi 韌體的 A/B 開機機制：兩個 rootfs 分割區，`tryboot` 開新分割區一次，健康則固定，否則自動回舊。PoC 通過即升級為 rootfs A/B，OS 更新可遠端回滾 |
| 救援 kit（永遠存在） | 可開機救援映像（USB 或 SD）、離線完整 artifact、解封材料、連接器與工具；內含「保留 J、重灌 OS、回灌 D」的腳本 |
| 保底 | 救援 kit 是所有 OS 失敗的最後出口；v1 不承諾無人值守 OS 更新 |

## 4.3 不可回退的 J 與可重建的 D

| 類別 | 內容 | 更新與還原時 |
|---|---|---|
| J（journal，不可回退） | identity、floor、jobs（含 UNKNOWN）、inbox、deliberate-stop marker、trust log（root node） | 任何重灌、回滾、重建 MUST 保留 |
| D（derived，可重建） | slots 鏡像、actual 投影、docs cache、id map、索引 | 可由 parent 重取或由 J 推回 |

壞 migration 的處理：候選已寫錯 D 時，freeze 新工作、保全 J 與故障 D、從簽章 schema 與 J 向前重建 D'，核對後再開；不重播 effect。

## 4.4 版本相容

| 項目 | 規定 |
|---|---|
| 在線版本 | parent 支援當前與前一 major；fleet 遷移目標 12 個月 |
| 混版 | 新 parent 舊 leaf 與反向 MUST 都在 conformance 矩陣 |
| 退版 | 安全撤版可提前；低於 `min_sec_rev` 的 leaf 只准 forensic read，不開操作權 |
