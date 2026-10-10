# 事實查核：不帶 Timescale License 的時序資料儲存選項

查證日期：2026-10-10（下表「查證日期」欄皆同日）。撰寫：波次 A 事實研究員（Sonnet）。對應：F-08、F-09、F-14、F-15、M-02、M-05、M-06、N-09、N-13、N-15。

## 1. 結論先講

1. **事實（可驗證）**：TimescaleDB 的 Apache-2 edition 只剩 hypertable 分塊、`drop_chunks`、`time_bucket` 這類基本件；compression（Hypercore/columnstore）、continuous aggregates、retention policy、jobs 全部在 TSL（Community）edition。多節點（distributed hypertables）已在 2.14.x 對所有 edition 移除。所以「避開 TSL」等於「放棄 Timescale 的四個招牌功能」，剩下的 Apache-2 部分與原生 declarative partitioning 加 `pg_partman` 相比，增益很小（這句是意見，依據見事實 F-3、F-12）。
2. **事實**：TSL §2.1(b) 的確有 M-05 所說的「通知客戶 + 客戶不得做 DDL」兩條；§2.2 禁止 DBaaS；§1.2 與 §7.2 讓條款可隨新版發行而改。M-05 對 TSL 的描述屬實。
3. **事實**：原生 PostgreSQL 做法的零件都在且授權乾淨：partition drop 官方文件明寫比 bulk DELETE 快且免 VACUUM；`pg_partman`（PostgreSQL License，v5.5.0，2026-07-22）、`pg_cron`（v1.6.8，2026-09-08）都在更新，但兩者都要 `shared_preload_libraries`（改 ERP 的 Postgres 設定並重啟）。P0 選「node 自己排程跑純 SQL」可以完全不碰這兩個。
4. **事實**：`pg_timeseries`（Tembo）v0.2.1（2026-06-15）還在，但是薄封裝、無 continuous aggregate、壓縮依賴 Citus columnar（AGPL-3.0）；Hydra columnar 最後 commit 2025-02-10，視為不維護。
5. **事實**：VictoriaMetrics 單機版 Apache-2.0、單一小型 binary、有 arm64 build 指令；但 **downsampling、multiple retentions、mTLS、LTS、backup 自動化都是 Enterprise 專屬**。OSS 沒有 LTS，修補只進最新版（M-06 時鐘）。
6. **估算（非查證事實，假設見 §3.1）**：N-15 高端（約 28 億筆樣本/3 年）在「窄表、無壓縮的平白 Postgres」約 150 GB heap + 約 90 GB btree；VictoriaMetrics 以 1～2 B/sample 估約 3～6 GB。N-15 低端（約 9,500 萬筆）兩者都不痛。**差距集中在高端**。
7. **N-15 的範圍有疑義**：「幾百個感測器、≤ 1 Hz、3 年」若指 300 條 series 全部 1 Hz，樣本數是 284 億，超出 N-15 寫的 2～90 GB 一個數量級（見 §4）。結論必須隨此澄清而變。
8. **回答結尾問題（摘要）**：樣本數 ≲ 10 億/站時，「ERP 的 Postgres 叢集內一個 database」在 M-02 與 M-05 都較划算；樣本數 ≳ 10～30 億/站、或 ERP 備份/還原不能被歷史拖大時，單檔 TSDB 較划算，代價是 +1 種引擎、+1 種查詢語言、Enterprise 閘門與無 LTS。完整條件見 §3.4。

## 2. 事實表

編號供後文引用。「來源」欄若為 GitHub，括號內註明取得方式（raw 檔、`git ls-remote`、shallow clone）。docs 站（postgresql.org、docs.victoriametrics.com、clickhouse.com、influxdata.com、tigerdata.com）在本環境無法直連，這些項目的 URL 是 WebSearch 回傳的官方頁面，內容為搜尋摘要，已在「備註」標明。

### 2.1 TimescaleDB 與 TSL

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| F-1 | 專案內授權切分：`tsl` 目錄之外為 Apache-2.0，`tsl` 目錄之內為 Timescale License；build 出的 `-tsl` 共享庫屬 TSL。另有 `APACHE_ONLY` CMake 選項（"only compile apache code"）。 | https://github.com/timescale/timescaledb/blob/main/LICENSE 、https://github.com/timescale/timescaledb/blob/main/CMakeLists.txt （raw 檔） | 2026-10-10 |
| F-2 | 目前版本 2.30.2（2026-09-29）；2.29.0 起移除 PG 15 支援，支援 PG 16/17/18。GitHub README 與連結已改稱 Tiger Data / Tiger Cloud。 | https://github.com/timescale/timescaledb/blob/main/CHANGELOG.md （raw 檔）、https://github.com/timescale/timescaledb | 2026-10-10 |
| F-3 | 官方 editions 比較表：Apache 2 edition 有 `create_hypertable`、`show_chunks`、`drop_chunks`、`set_chunk_time_interval`、`add_dimension`、`time_bucket`、`first`/`last`、`histogram`。**只有 Community（TSL）edition 有**：Hypercore/columnstore（含 `add_columnstore_policy`、`convert_to_columnstore`，舊 compression 已被取代）、全部 continuous aggregate 指令與 policy、`add_retention_policy`/`remove_retention_policy`、`add_job`/`alter_job`/`run_job`、`time_bucket_gapfill`/`locf`/`interpolate`、SkipScan、`reorder_chunk`/`move_chunk`/`split_chunk`。 | https://github.com/timescale/docs/blob/latest/about/timescaledb-editions.md （docs 原始檔 raw） | 2026-10-10 |
| F-4 | 多節點：editions 表註記 "Distributed hypertables: sunsetted in TimescaleDB v2.14.x"，兩個 edition 皆 ❌；CHANGELOG 寫明 2.13 是最後含 multi-node 的版本。 | https://github.com/timescale/docs/blob/latest/about/timescaledb-editions.md 、https://github.com/timescale/timescaledb/blob/main/CHANGELOG.md | 2026-10-10 |
| F-5 | editions 文件的白話版：Community 版可在自己的 on-prem 或雲端免費安裝，但 "You cannot sell TimescaleDB Community Edition as a service"；Apache 2 edition 可作為 service 販售。 | https://github.com/timescale/docs/blob/latest/about/timescaledb-editions.md | 2026-10-10 |
| F-6 | TSL §2.1(b) Value Added Products：散佈 binary 給客戶的前提是 "(1) You notify Your customers that use of such Timescale Software or Derivative Works is subject to this TSL Agreement and You provide to each such customer a copy of the most current version of this TSL Agreement or a URL ..., and (2) the customer is prohibited, either contractually or technically, from defining, redefining, or modifying the database schema or other structural aspects of database objects, such as through use of the Timescale Data Definition Interfaces, in a Timescale Database utilized by such Value Added Products or Services." §3.5 把 DDL 定義為 CREATE、DROP、ALTER、TRUNCATE、COMMENT、RENAME。 | https://github.com/timescale/timescaledb/blob/main/tsl/LICENSE-TIMESCALE （raw 檔，全文已讀） | 2026-10-10 |
| F-7 | TSL §2.1(a) Internal Use：僅限 "Your own internal business purposes in a manner that does not expose or give access to, directly or indirectly (e.g., via a wrapper), the Timescale Data Definition Interfaces or the Timescale Data Manipulation Interfaces to any person or entity other than You or Your employees and Contractors"。§3.6 把 DML 定義為 SELECT/INSERT/UPDATE/DELETE，也含 GRANT/REVOKE。 | 同上 | 2026-10-10 |
| F-8 | TSL §2.2：禁止 "time-sharing services or database-as-a-service services, or ... any form of software-as-a-service or service offering in which the TSL Licensed Software is offered or made available to third parties to provide time-series database functions or operations, other than as part of Your Value Added Products or Services"。§3.10 的 Value Added Products 須 "not primarily database storage or operations products",且 (iii) 使用者被合約或技術禁止做 DDL。§4：違反任一條款即自動終止授權。 | 同上 | 2026-10-10 |
| F-9 | TSL 條款可變：§1.2 客戶使用受 "the most current version of this TSL Agreement" 約束；§7.2 修改於 Posted Date 生效，適用於該日期之後正式發行的版本。現行文本 Posted Date 為 2020-09-24。 | 同上 | 2026-10-10 |
| F-10 | 廠商宣稱：Hypercore 壓縮「通常減少 90～98% 儲存」。這是廠商文件的行銷數字，非獨立測量；且文件註明 chunk 資料量不足以形成夠大的 batch 時壓縮率會下降。 | https://www.tigerdata.com/docs/build/how-to/basic-compression （WebSearch 摘要，未直接開頁） | 2026-10-10 |

### 2.2 PostgreSQL 原生與周邊擴充

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| F-11 | PostgreSQL 18 目前最新 minor 為 18.6（git tag `REL_18_6`，commit 日期 2026-08-11）；PG 19 只有 beta tag（`REL_19_BETA4`）。官方版本政策：PG 18 最後一次發行 2030-11-14。 | https://github.com/postgres/postgres （`git ls-remote --tags`）、https://www.postgresql.org/support/versioning/ （WebSearch 摘要）、https://endoflife.date/postgresql （摘要） | 2026-10-10 |
| F-12 | 官方文件：「刪除 partition（`DROP TABLE` 或 `ALTER TABLE DETACH PARTITION`）遠比 bulk operation 快，並完全避開 bulk `DELETE` 造成的 `VACUUM` 負擔」；另有 `DETACH PARTITION CONCURRENTLY`。 | https://github.com/postgres/postgres/blob/master/doc/src/sgml/ddl.sgml （raw 檔，約 4325 與 4665 行） | 2026-10-10 |
| F-13 | `REFRESH MATERIALIZED VIEW` "completely replaces the contents of a materialized view"，不是增量；有 `CONCURRENTLY` 選項。BRIN 以 block range 存摘要，適合物理順序與值相關（如依時間追加）的欄位。 | https://github.com/postgres/postgres/blob/master/doc/src/sgml/ref/refresh_materialized_view.sgml 、https://github.com/postgres/postgres/blob/master/doc/src/sgml/brin.sgml （raw 檔） | 2026-10-10 |
| F-14 | `pg_partman`：PostgreSQL License；v5.5.0（tag commit 2026-07-22），repo 最後 commit 2026-08-21；自 5.0.1 只支援 declarative partitioning；版權列為 Snowflake, Inc. 2025-2026（先前為 Crunchy Data）；內含 background worker，須在 `shared_preload_libraries` 加入 `pg_partman_bgw`（改後要重啟），也可編譯成純 PL/pgSQL（`NO_BGW=1`）搭外部排程。 | https://github.com/pgpartman/pg_partman （shallow clone：LICENSE、README、`git ls-remote --tags`） | 2026-10-10 |
| F-15 | `pg_cron`：Citus Data 版權的寬鬆授權（BSD/PostgreSQL 式文字）；v1.6.8（tag commit 2026-09-08）；PG 10+；須在 `shared_preload_libraries` 加入 `pg_cron`；"may only be installed to one database in a cluster"，其他 database 用 `cron.schedule_in_database()`。 | https://github.com/citusdata/pg_cron （shallow clone） | 2026-10-10 |
| F-16 | `pg_timeseries`（Tembo）：PostgreSQL License（Copyright 2024 Tembo）；v0.2.1（tag commit 2026-06-15），repo 最後 commit 同日；README 標 PG 16/17/18；`CREATE EXTENSION timeseries CASCADE` 會拉入 `pg_cron` 與 `pg_partman`；功能為 partition 建立/retention（每小時 drop 過期 partition）/compression policy；壓縮依賴 `citus` 與 `citus_columnar`；文件中沒有 continuous aggregate 或 roll-up 功能；最近 30 個 commit 中 14 個出自同一作者；預建 Docker 映像在個人命名空間 `ghcr.io/chuckhend/pg18-timeseries`。 | https://github.com/tembo-io/pg_timeseries （shallow clone：LICENSE、`doc/timeseries.md`、`git log`） | 2026-10-10 |
| F-17 | Citus columnar：Citus repo 根目錄 LICENSE 為 AGPL-3.0，columnar 子目錄無獨立授權檔；v14.2.0（tag commit 2026-08-06），repo 最後 commit 2026-10-08，NOTICE 為 Microsoft 格式；columnar 為 append-only（"no UPDATE/DELETE"），預設壓縮 zstd。 | https://github.com/citusdata/citus （sparse clone：LICENSE、NOTICE、`src/backend/columnar/README.md`） | 2026-10-10 |
| F-18 | Hydra columnar：repo 根目錄 LICENSE 為 Apache-2.0，但 `columnar/LICENSE` 為 AGPL-3.0；repo 最後 commit 2025-02-10（距今約 20 個月）；README 的 status 清單停在 "1.0 Release"，無維護宣告。第三方（Pigsty）將其標為 obsolete、與 citus columnar 衝突，屬二手資訊。 | https://github.com/hydradatabase/hydra （shallow clone）；二手：https://pigsty.io/ext/olap/columnar | 2026-10-10 |

### 2.3 獨立 TSDB

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| F-19 | VictoriaMetrics 單機版與 cluster 版：Apache-2.0。最新 tag v1.153.0（commit 2026-09-25），repo 最後 commit 2026-10-09。README 描述 "No dependencies, single small binary"，用命令列 flag 設定。ARM build：`make victoria-metrics-linux-arm64(-prod)`，文件稱可跑在 Raspberry Pi。**未查到預編 arm64 binary 的大小與實測 RAM。** | https://github.com/VictoriaMetrics/VictoriaMetrics （README、`docs/victoriametrics/README.md`、`git ls-remote --tags`） | 2026-10-10 |
| F-20 | VM retention：`-retentionPeriod`（單位 h/d/w/M/y），預設 1 個月，最小 24h，可設 `100y` 但不支援無限；資料依月份分區，過期分區在新月第一天刪除，最大磁碟用量為 (retention + 1) 個月。 | https://github.com/VictoriaMetrics/VictoriaMetrics/blob/master/docs/victoriametrics/README.md （clone 檔，"Retention" 節） | 2026-10-10 |
| F-21 | VM 的 Enterprise 專屬功能（文件與 flag 說明明寫）：downsampling（`-downsampling.period`）、multiple retentions、backup 自動化（vmbackupmanager）、mTLS（`-mtls`）、自動簽發 TLS 憑證、LTS release。OSS 有：`-tls`/`-tlsCertFile`/`-tlsKeyFile`、`-httpAuth.username/password`、vmbackup、vmalert、deduplication、stream aggregation（聚合狀態在記憶體，重啟即失，文件列為 limitation）。LTS 只對 Enterprise 發布，其 bugfix 同時進「latest release」。 | https://github.com/VictoriaMetrics/VictoriaMetrics/blob/master/docs/victoriametrics/enterprise.md 、`.../README.md`（Downsampling、mTLS protection、Security 節）、`.../LTS-releases.md`、`.../stream-aggregation/README.md` | 2026-10-10 |
| F-22 | VM 寫入與查詢：單機 `:8428` 直接收 Influx line protocol（`/influx/write`、`/api/v2/write`）與 Prometheus remote write（`/api/v1/write`）；Influx 的 `measurement,tag field=v` 變成 metric 名 `measurement_field`；值一律 float64、label 值為字串、schemaless；Grafana 可用 Prometheus datasource 或 VictoriaMetrics datasource plugin；查詢語言 PromQL/MetricsQL，無 SQL。 | https://github.com/VictoriaMetrics/VictoriaMetrics/blob/master/docs/victoriametrics/integrations/influxdb.md 、`.../integrations/prometheus.md`、`.../integrations/grafana/_index.md`、`.../keyConcepts/keyConcepts.md` | 2026-10-10 |
| F-23 | QuestDB：Apache-2.0；最新 tag 10.0.1（commit 2026-08-24），repo 最後 commit 2026-10-10；引擎為 zero-GC Java 加 C++/Rust；PG wire 在 `:8812`（README 說寫入走 PG wire 比 QWP 慢）、ILP 與 QWP 在 `:9000`；README 將 TLS、RBAC、SSO、HA、replication 列為 **Enterprise 才有**；README 未寫公司名。官方 capacity planning 建議基本負載至少 8 GB RAM（WebSearch 摘要）；TTL 以整個 partition 為單位刪除（摘要）。 | https://github.com/questdb/questdb （README、LICENSE.txt、`git ls-remote`）；摘要：https://questdb.com/docs/deployment/capacity-planning/ 、https://questdb.com/docs/concepts/ttl | 2026-10-10 |
| F-24 | InfluxDB 3 Core：授權 MIT OR Apache-2.0；Rust + Arrow/DataFusion/Parquet；README 稱 2025-04 GA；`v3.12.0` tag 存在（日期未取得）。官方 databases 文件（摘要）：Core 最多 5 個 database、全部 database 合計 2000 張 table、每表 500 欄。Enterprise 為商業授權（試用、居家非商用免費版限 2 核）。Core 曾有的「72 小時查詢範圍限制」現況**未查證**（只看到一篇部落格標題提及 "update on InfluxDB 3 Core's 72-hour limitation"）。 | https://github.com/influxdata/influxdb （README、LICENSE-MIT、`git ls-remote`）；摘要：https://docs.influxdata.com/influxdb3/core/admin/databases/ 、https://www.influxdata.com/blog/influxdb3-open-source-public-alpha-jan-27/ | 2026-10-10 |
| F-25 | ClickHouse：Apache-2.0（Copyright 2016-2026 ClickHouse, Inc.）；v26.9（2026-09-21）、v26.8 LTS（2026-08-27）、v26.3 LTS（2026-03-26）；官方文件（摘要）稱可在低至 2 GB RAM 運行，但需額外調校且只適合低寫入量，RAM 小於 16 GB 時預設設定可能出現記憶體例外。**arm64 官方 binary 與小機器實測 idle RSS 未查證。** | https://github.com/ClickHouse/ClickHouse （LICENSE、CHANGELOG.md raw 檔）；摘要：https://clickhouse.com/docs/fr/guides/oss/best-practices/tips.md | 2026-10-10 |

## 3. 與我們情境的關係

### 3.0 對照 03-brief.md §1 的錨點

- **錨點 3（三種部署形狀）與 M-05**：形狀 (a)(b) 是把軟體交給客戶站點跑，直接落在 TSL §2.1(b)：要通知客戶並提供 TSL 全文或 URL（F-6），且客戶必須被合約或技術禁止對該 Timescale database 做 DDL。我們的 Grafana 或 ops 人員若對客戶開放 SELECT，則 §2.1(a) 的 Internal Use 不適用（F-7），只能走 Value Added 路徑。形狀 (c) 是我們營運雲端給客戶用，§2.2 的 DBaaS 禁令（F-8）需要「我們賣的是 ERP、不是時序資料庫」的論證，ERP 通常符合 §3.10(i)(ii) 的精神，但**是否符合要由律師判讀，這裡不下結論**。F-8 的 §4 也說明違反即自動終止，風險不對稱。
- **M-05 的文字屬實**：需求寫「§2.1(b): notice plus a DDL lockout when shipped on-prem; §2.2 no DBaaS」，與條文一致（F-6、F-8）。需求沒寫到的一條：§1.2 與 §7.2 讓條款可隨新版變動（F-9），這是 M-06 精神上的授權時鐘。
- **避開 TSL 的代價（對 02-tradeoffs §1「資料層」）**：02 說平白 Postgres 失去「壓縮、continuous aggregates、內建 retention」。事實面成立：這三項在 Apache-2 edition 都沒有（F-3）。但 02 沒提到：Apache-2 edition 的 TimescaleDB 本身就不比「declarative partitioning + 排程」多多少（F-3 對照 F-12、F-14），所以**「用 Apache-2 edition 的 Timescale」不是中間選項**，要嘛接受 TSL、要嘛走原生。
- **錨點 4（規模）與 F-15、N-13**：最小部署不需要 history store（F-15），任何選項都只是「可選」。所以選擇影響的是有感測器的站點，不是一片螢幕的最小部署。
- **錨點 6（種類數 M-02、時鐘 M-06）**：
  - 原生 PG 路線：新增 0 種引擎、0 種查詢語言；外部時鐘只有 PostgreSQL 本身（F-11，PG 18 到 2030-11-14）與 ERP 本來就有的 Odoo。`pg_partman`（F-14）與 `pg_cron`（F-15）若採用則各增加一個時鐘與一個 `shared_preload_libraries` 改動；P0 的「node 排程跑純 SQL」可避開。
  - `pg_timeseries`（F-16）：薄封裝，又把 `pg_cron`、`pg_partman`、`citus_columnar`（AGPL，F-17）一起拉進來，時鐘數最多，維護者貢獻集中，**不建議作為 M-06 下的基礎**（意見）。
  - VictoriaMetrics（F-19、F-21）：+1 種引擎（Go 單檔）、+1 種查詢語言；OSS 沒有 LTS，修補只進最新版，等於承諾定期升版；Enterprise 專屬的 mTLS 直接影響 N-02（T2 以上每跳 mTLS）：OSS 只能 TLS + basic auth，或在前面放自己的 TLS 終結（P0 的 bridge 本來就終結 TLS，所以影響有限）。
  - QuestDB / InfluxDB 3 / ClickHouse：各 +1 引擎；QuestDB 的 TLS 在 Enterprise（F-23），InfluxDB 3 Core 有庫表數上限且 Enterprise 為商業授權（F-24，與 M-05 精神衝突），ClickHouse 小機器足跡需調校（F-25）。三者在「幾百感測器、≤ 1 Hz」這個量上都是殺雞用牛刀，**不建議**（意見）。
- **F-09 roll-up**：事實是 materialized view 每次全量重算（F-13），3 年原始表上不可行；原生路線的 roll-up 實務是「對已關閉的時間 bucket 增量 `INSERT ... SELECT ... ON CONFLICT`」，由 node 排程呼叫。VM 這邊 downsampling 是 Enterprise（F-21），但見 §3.1：在這個量上原始資料 3 年保留本身就小，不一定需要。
- **F-11、F-14、F-32（欄位型別變更、改名不斷史）**：PG 若採「窄表」（`series_id, ts, value` + 另一張 series 維度表）就不會因新增屬性而 ALTER，series 改名只是改維度表，F-14 成立；VM 是 schemaless（F-22）天然滿足 F-11，但值只有 float64、無字串。F-31（未宣告屬性要拒絕）兩邊都得由 writer 負責。
- **N-03、N-09**：兩邊都能做到「有認證」（PG 原生 role/TLS/client cert；VM 用 `-httpAuth.*` 與 `-tls`，F-21）。備份上，同一叢集內的 database 與 ERP 同走一套 base backup/WAL，是優點也是風險（見 §3.4）；VM 用 vmbackup（OSS，F-21）是另一套流程。

### 3.1 N-15 的量：磁碟估算（**估算，不是查證事實**）

假設與公式：
- 3 年 = 94,608,000 秒。樣本數 = series 數 × 94.6M ÷ 取樣週期（秒）。
- PG 窄表：heap tuple header 23 bytes 補到 24（官方 storage 文件：header "occupying 23 bytes on most machines"），加 `timestamptz 8 + int4 4 + float8 8` 含對齊約 48 B，加 line pointer 4 B，約 **52 B/樣本**（heap）。btree 主鍵 `(series_id, ts)` 估約 **31 B/樣本**（含 fillfactor 90%）。BRIN 的大小可忽略。這些位元組數是我依結構推算，未實測。
- PG 寬表（一列一個 device 加時間戳、30 個 float8 欄）：24 + 8 + 30×8 + 4 ≈ 276 B/列，約 **9.2 B/樣本**，只適用「同一台機器的 30 個屬性同時間戳」的情境（D-06）。
- VM：用 Prometheus 官方「平均 1～2 bytes per sample」（https://github.com/prometheus/prometheus/blob/main/docs/storage.md ，raw 檔）當區間；VM README 稱比 Prometheus 再省最多 7 倍（廠商宣稱）。感測器雜訊浮點數壓縮率可能比典型 metrics 差，**需 PoC 實測**。
- TSL 壓縮：套用廠商 90～98%（F-10）到窄表 heap。
- Citus columnar（zstd 預設，F-17）：**壓縮率未查到，不估**。

| 情境 | 樣本數（3 年） | PG 窄表 heap（BRIN） | PG 窄表 heap + btree | PG 寬表 | VM（1～2 B） | TimescaleDB TSL 壓縮（廠商宣稱） |
|---|---|---|---|---|---|---|
| W1：30 屬性 × 1 台 @30 s（N-15 低端） | 9,460 萬 | 約 4.9 GB | 約 7.9 GB | 約 0.9 GB | 約 0.1～0.2 GB | 約 0.1～0.5 GB |
| W2：30 屬性 × 1 台 @1 s（N-15 高端），或 300 感測器 × 3 量測 @30 s（D-02 規模） | 28.4 億 | 約 148 GB | 約 236 GB | 約 26 GB（僅 30 屬性同戳情境） | 約 2.8～5.7 GB | 約 3～15 GB |
| W3：300 條 series 全部 @1 Hz | 284 億 | 約 1.5 TB | 約 2.4 TB | 不適用 | 約 28～57 GB | 約 30～150 GB |

與 N-15 對照：N-15 寫「30 屬性約 2～3 GB（30 s）或 50～90 GB（1 s）」，介於我的寬表與窄表估算之間（W1 約 0.9～7.9 GB、W2 約 26～236 GB），數量級一致。**差別在於 N-15 是以「一台機器 30 屬性」為單位**。

### 3.2 維運成本比較（意見，依據為上列事實）

| 選項 | 新增「種類」(M-02) | 授權義務 (M-05) | 外部時鐘 (M-06) | 備份 (N-09) | 我們要寫的 code |
|---|---|---|---|---|---|
| A. ERP 叢集內獨立 database，窄表 + declarative partition，node 排程跑純 SQL | 0 | 無（PostgreSQL License） | PostgreSQL（到 2030-11-14，F-11） | 與 ERP 同一套；歷史變大會拖慢 base backup 與還原 | writer、partition 建立/drop、roll-up SQL；全是 SQL |
| A'. 同上，加 `pg_partman` + `pg_cron` | 0 引擎、+2 擴充 | 無 | +2 個（F-14、F-15），且需改 `shared_preload_libraries` 並重啟 ERP 的 Postgres | 同上 | 較少 |
| B. 同上，加 Citus columnar 壓縮（可經 `pg_timeseries`） | +1～2 擴充 | AGPL-3.0（F-17），**對客戶義務的影響未做法律判讀** | +Citus、+pg_timeseries（F-16） | 同上 | 少，但依賴薄維護者 |
| C. TimescaleDB Community（TSL） | +1 擴充 | M-05 所指的全部條款（F-6～F-9） | +Timescale | 同上，壓縮後小很多 | 最少 |
| D. VictoriaMetrics 單檔 | +1 引擎、+1 查詢語言 | 無（Apache-2.0）；用到 Enterprise 功能則有商業合約 | VM 本身，OSS 無 LTS（F-21） | 另一套（vmbackup） | writer（HTTP POST line protocol）、告警規則改寫為 vmalert 或留在 node |
| E. QuestDB / InfluxDB 3 Core / ClickHouse | 各 +1 引擎 | Apache/MIT；InfluxDB Enterprise、QuestDB Enterprise 為商業 | 各自一個 | 各自一套 | 同 D |

### 3.3 對 P0 的直接含義（有利、不利各列）

- **P0 此點成立**：「時序資料庫 = 同一個 Postgres 叢集的獨立 database、retention = drop partition」在授權（F-12、F-14 授權寬鬆）與 M-02 上是最乾淨的選項。
- **P0 此點成立**：「roll-up 用 node 的排程跑純 SQL」避開了 `pg_cron`/`pg_partman` 的 `shared_preload_libraries` 改動（F-14、F-15），這在形狀 (a)(b) 客戶自管 Postgres 時很重要。
- **P0 此點有缺口**：P0 §5 寫「roll-up 用 node 排程跑純 SQL」,沒寫「增量」；若實作成 materialized view 會全量重算（F-13）。需明寫成增量 bucket 寫入。
- **P0 沒答的問題**：歷史資料與 ERP 共叢集時，WAL、autovacuum、base backup 大小、還原時間都被歷史拖著走（W2 的 148 GB 窄表即是 Odoo 資料庫的數倍，Odoo 資料庫實際大小因站而異，未查證）。「獨立 database」只隔離 schema，不隔離 WAL 與備份。
- **02 的帳單算漏一項**:02 的「失去壓縮」只講 Timescale，沒提到可選的 Citus columnar（AGPL，append-only，F-17），也沒提到 TSDB 路線（F-19）在這個量上可把磁碟壓小一到兩個數量級（§3.1，估算）。

### 3.4 結尾問題：M-02 與 M-05 下，「ERP 叢集內一個 database」與「單檔 TSDB（如 VictoriaMetrics）」哪個更划算

**答：沒有永遠較划算的一邊，取決於每站樣本數與 ERP 備份的容忍度。下面的門檻是意見，數字來自 §3.1 的估算。**

| 條件 | 較划算 | 理由 |
|---|---|---|
| 每站 3 年樣本數 ≲ 10 億（例：W1，或 100 條 series @30 s），且 ERP 叢集可由我們控制 | **Postgres 內一個 database** | M-02 新增 0 種；M-05 零義務；F-11 時鐘單一；窄表加月分區加 drop partition 就夠；窄表加 btree 約 80 GB 以下，量級可由 ERP 備份流程吸收 |
| 每站樣本數 ≳ 10～30 億（例：W2，300 感測器 × 3 量測 @30 s） | **單檔 TSDB**，或把歷史放「另一個 Postgres 實例」 | 窄表 148～236 GB 會讓 ERP 的備份/還原/WAL 被歷史主導；VM 估約 3～6 GB（需 PoC 驗證）。折衷：同為 Postgres 引擎但獨立實例，M-02 以「種類」計仍是 0，成本是多一個要顧的服務（錨點 7） |
| 形狀 (c)（客戶 ERP 在我們的雲） | 兩者皆可；Postgres 路線更簡單 | 我們控制叢集，不需 `shared_preload_libraries` 協調；VM 則多一個要暴露的 HTTPS 入口（F-21 只有 TLS + basic auth，無 mTLS） |
| 形狀 (a)(b)（客戶或站點管理員管 Postgres） | 純 SQL 的原生路線 | 不要求客戶改 Postgres 設定（避開 F-14、F-15 的 preload） |
| N-02 要求歷史儲存這跳也 mTLS | Postgres（client cert 為原生功能，見 PostgreSQL 文件 client-auth `cert` 方法） | VM 的 mTLS 是 Enterprise（F-21）；OSS 需在前面加 TLS 終結 |
| 需要在 ERP 或 Grafana 內做跨表 SQL（例如把感測器歷史與 Odoo 工單 join） | Postgres | VM 無 SQL（F-22）；Grafana 內建 PostgreSQL datasource 有官方文件 |
| 告警/降採樣要在儲存層做 | 兩者皆需自己做 | Timescale 的 policy 在 TSL（F-3）；VM 的 downsampling 在 Enterprise（F-21）；P0 把告警放在持有資料的 node（§5）剛好不依賴儲存層 |
| M-06 小團隊接受「定期升版」且不買 Enterprise | 可行但是新的時鐘 | VM 無 LTS（F-21），須追最新版 |

**意見層建議（供後續綜合者參考，不是定案）**：
1. 預設用「ERP 叢集內獨立 database，窄表 + 月分區 + node 排程」，並把 writer 做成「寫入介面」，使換成 VM 只動 bridge 0 的一個 adapter（R7 可逆性）。
2. 把「換 TSDB 或獨立實例」的觸發條件寫成可量測的數字：單站 `pg_total_relation_size` 超過 ERP 資料庫大小的某個倍數（建議由 owner 定，例如 2 倍），或樣本數超過約 10 億。
3. 在決定前跑一次 VM PoC，量實際 bytes/sample（感測器雜訊）、arm64 binary 大小與 idle RAM（F-19 未查到）、以及 Influx line protocol 欄位命名對 F-14（改名不斷史）的影響。

## 4. 未查證或有疑慮之處

1. **工具限制**：本環境 `WebFetch`/`curl` 只能連到 GitHub（raw、git）；postgresql.org、docs.victoriametrics.com、clickhouse.com、docs.influxdata.com、tigerdata.com、endoflife.date 皆 DNS 或 proxy 拒絕。凡標「WebSearch 摘要」者（F-10、F-11 的版本政策、F-23 的 capacity planning 與 TTL、F-24 的庫表上限、F-25 的足跡），內容來自搜尋引擎回傳的官方頁面摘要，我沒有直接開頁讀全文；引用前請人工開 URL 核對。
2. **N-15 的範圍**：「幾百個感測器、≤ 1 Hz、3 年、2～90 GB」中，2～90 GB 對應「約一台機器的 30 個屬性」，不是「幾百個感測器各 1 Hz」。若真的是 300 條 series 全部 1 Hz（W3，284 億筆），原生窄表約 1.5 TB，連 VM 也要約 30～60 GB。請 owner 澄清是哪一種；本文件的結論在 W1、W2 成立，在 W3 下「平白 Postgres」不成立。
3. **VM 足跡**：預編 arm64 binary 大小、single-node 在 CM4/小 VM 的實測 RAM 未查到（F-19）。ClickHouse、QuestDB 同樣沒有 arm64 實測。
4. **壓縮率**：TSL 的 90～98% 是廠商宣稱（F-10）；VM 的 1～2 B/sample 是借用 Prometheus 官方平均值加 VM 廠商宣稱；Citus columnar 壓縮率未查。感測器浮點雜訊資料可能都比這些數字差，需 PoC。
5. **窄表位元組數**（52 B heap、31 B btree、276 B/列）是依 PostgreSQL 儲存結構的推算，未在 PG 18 實測。
6. **授權法律判讀**：TSL 對形狀 (c) 是否構成 DBaaS、對 Grafana 唯讀存取是否破壞 Internal Use，AGPL（Citus columnar）對我們交付客戶的義務，皆未做法律判讀，只引了條文。
7. **InfluxDB 3 Core 72 小時限制**現況未查證；Core 的庫表上限來自摘要。`v3.12.0` 的發行日期未取得。
8. **pg_timeseries 背後公司狀態**：repo 仍在 `tembo-io` 組織且 2026-06 有 commit，但 Tembo 公司本身 2026 年的狀態我沒有查（不屬本主題範圍，也無來源），M-06 評估時應另查。
9. **PostgreSQL 19** 目前只看到 beta tag，是否已 GA 未查證，不影響結論。
10. **pg_cron 授權名稱**：LICENSE 檔文字為 BSD/PostgreSQL 式寬鬆授權但檔頭未寫 SPDX 名稱，我以文字內容判斷；請以 SPDX 或 repo 的宣稱為準再確認。
11. **Odoo 資料庫實際大小**、ERP 叢集是否允許裝擴充、客戶端 PG 版本分布，均未查證，影響 §3.4 的門檻。
