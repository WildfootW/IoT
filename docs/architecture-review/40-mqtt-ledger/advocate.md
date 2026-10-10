# MQTT 正方：把 MQTT 放進架構，我們到底得到什麼

> 波次 B，MQTT 辯論正方。日期 2026-10-10。輸入：`03-brief.md`、`00-requirements.md`、`01-proposal-pcie-tree.md`（P0）、`02-tradeoffs.md`、`10-facts/`（mqtt-semantics、mqtt-brokers、transport-through-networks、precedents、nats）、`20-proposals/` P1～P6。引用慣例：`檔名` 條目編號（L 行號），`10-facts/` 所有條目的查證日期皆為 2026-10-10；提案引用寫「P1 §3.3」；沒有來源的主張標「意見」或「未查證」。

## 0. 結論先講

owner 的問題是「MQTT 那邊的失去感覺差很多，我們到底為此得到什麼」。正方的回答：**得到的是七件可以指到事實的東西，全部在站內的 hop；失去的（F-46/F-47 的語意）本來就不是 MQTT 的範圍，六份提案沒有一份能少寫**（`mqtt-semantics.md` 結論 1（L13）、§5 一句話（L142））。

1. **第 N 個消費者 = 一條 ACL。** 不動裝置、不要 bridge 0 長出 consumer 概念（02 §1 末段自認的具體損失；`mqtt-semantics.md` §5 F-49 列（L135）：扇出是原生）。P6 把 consumer API 估為 2 人週並延後到第三個消費者（P6 §7）；有 broker 時這筆是零。
2. **D-06 現場 HMI 有現成答案。** 訂站點 broker 的 retained last value，LAN 延遲，不經樹上游。P1、P3、P5、P6 四份提案給的是同一個答案（P1 §5、P3 §6、P5 §6、P6 §6），P2 把它列為第三選項、P4 要另加 broker（P4 §6）。P0 在 02 §1 自認「沒有答案」。
3. **T1 講 MQTT 時不必自寫面對 hostile T1 的解析器。** 替代方案是三個 bus factor 都差的 library（`mqtt-brokers.md` 列 30、32、33）或自寫並自己 fuzz（P2 §8 第 3 點）；P4 也承認 T1 MQTT「必須先到一個真正的 broker」（P4 §3）。
4. **離線偵測從 5 分鐘縮到約 45～75 秒，零行 code。** keepalive × 1.5 觸發 Will（`mqtt-semantics.md` MQ8（L35））、Will Delay 吸收抖動（MQ3（L30））；P1 §4.5 的設定。
5. **late-joiner 不用寫。** retained 讓重連的 unit 立刻拿到最新 desired，天然 level-triggered，貼近 F-46（`mqtt-semantics.md` 結論 2（L14）、§3.1（L80））。
6. **02 §1「自製傳輸的風險」整段消失。** reconnect storm、half-open、thundering herd、retry 放大：Mosquitto client 與 bridge 已有 jitter backoff（base 5 s、cap 30 s）、`cleansession false`、`try_private`（`mqtt-brokers.md` 列 4、5（L25-26））。
7. **授權乾淨、維護者可查、協定是標準。** 11 個被查的 broker 有 9 個對 M-05 零義務（`mqtt-brokers.md` 結論 1（L7））；Mosquitto 是 Eclipse 專案，master 到 2026-10-04 仍有 commit（列 2（L23））；MQTT 是 OASIS 標準（`precedents.md` e09（L31））。

代價一句話：有 broker 的站點 +2 種類（Mosquitto runtime、client library 時鐘），其他站點 +0，最小部署仍是兩個服務（P5 §2、§7）。§7 列出 MQTT 做不到的事，不留給反方；§8 回答「只能用在一個 hop 要用在哪」。

## 1. 先把問題拆對：四條 hop，不是一個開關

三種部署形狀（錨點 3）都由同樣四條 hop 組成：T1 → bridge、T2 unit → bridge、bridge → bridge 0、bridge 0 → ERP。`transport-through-networks.md` §3.4（L122-125）把事實說清楚：穿越客戶 proxy 的問題只作用在 bridge → bridge 0 這一條，且只在形狀 (c)；站內 hop 不受影響。02 §1 列的五項失去（扇出、retained、last-will、T1 講 MQTT、生態）全部發生在站內 hop（P5 §1 理由 2）。所以「用不用 MQTT」是錯的問題，對的問題是「哪幾條 hop 用」。正方主張：站內兩條用 MQTT，跨網路那條用 HTTPS，ERP 那條維持 queue 路由。這是把 M-03「拓樸是部署選擇」延伸到傳輸，不是折衷。

## 2. D-01～D-06：MQTT 在每一格給了什麼

| 功能 | MQTT 給了什麼 | 證據 | 不給什麼（自己寫） |
|---|---|---|---|
| D-01 螢幕 | desired = retained `{v, pointer, sig}`；重連即拿最新版；done = `actual.v == desired.v`；下行延遲從 poll 週期變連線 RTT | P1 §4.1；`mqtt-semantics.md` MQ9（L36） | 版本號放 payload；文件與媒體不走 MQTT（`max_packet_size` 預設 2 MB，P1 §6） |
| D-02 環境感測 | `m/env` retained + Message Expiry 90 s：過期即對新訂閱者消失 = F-04；越線以 `ev/threshold` QoS 1 上報，F-10 alert 免費 | P1 §5、§6；MQ1（L28） | Expiry 清除預設 lazy，要開 `retain_expiry_interval`（MQ9） |
| D-03 Modbus | 無。bridge 輪詢 T1，T1 不碰 broker | P1 §6、P5 §6 | — |
| D-04 LED | job = `sq/<key>` + `cq/<key>` 各一個 retained slot；重連拿到所有未結 job，不是 queue；capability 在 announce | P1 §4.2 | key 去重、single-flight、deadline（MQ23（L55）：AWS 也在服務端做） |
| D-05 門禁（管理面） | 刷卡、出勤是事件不是 register：`ev/access` QoS 1 天然合適；02 §1 自認「非狀態事件不適合 register」 | P1 §6；P3 §6 | 控制通道不走 broker；attestation 不是 Will |
| D-06 機台遙測 | HMI 訂站點 broker retained；edge controller 以原生 MQTT 或 Sparkplug B 資料面接進 `raw/`；分析層走 PG | P1 §6；P5 §6；`mqtt-semantics.md` §3.5（L124） | Sparkplug 不當命令面：NCMD QoS 0、強制 Clean Session（MQ19、MQ20（L66-67）） |

六格裡 MQTT 給最多的是 D-05 與 D-06，正好是 03-brief §1 第 8 點「已知的下一步」。P0 對 D-06 現場層沒有答案，對 D-05 的事件型資料承認是真實限制（02 §1）；兩個下一步都指向同一個東西。D-01～D-04 拿到的是傳輸層的改善（RTT 級下行、late-joiner、F-04 免費），不是語意；正方不誇大。

## 3. 三種部署形狀

| 形狀 | MQTT 放哪 | 得到 | 代價 | 證據 |
|---|---|---|---|---|
| (a) 同主機、最小部署 | 預設不放；只在 T-a/T-b/T-c 觸發時在 ERP 主機放一個 Mosquitto | 一片螢幕仍兩個服務（N-13） | 觸發後 +2 種類 | P5 §3.4 (a)；P6 Stage 0 / Stage 2 |
| (b) 同站不同 VLAN | bridge 主機一個 Mosquitto：T1 listener、T2 listener（mTLS）、HMI 唯讀角色；bridge → bridge 0 仍 HTTPS | 一個 broker 同時解 T1 ingress、unit hop、HMI 扇出三件事 | 防火牆多放 T1 VLAN → bridge:8883/8884 | P1 §3.2 (b)；P5 §3.4 (b) |
| (c) 雲端 ERP、站點 outbound-only | 站內同 (b)；site → cloud 一律 HTTPS 串流，不用 Mosquitto bridge | 不受 8883 被擋影響；不需第二條 WSS trunk | 雲端消費者走 bridge 0 的 consumer API，不是 MQTT | `transport-through-networks.md` §5（L155-159）；P5 §1.1 |

P1 把 MQTT 推到 (c) 的 trunk，自己承認 Mosquitto 沒有 bridge-over-WebSocket，結果是兩條 trunk 程式路徑（P1 §1 弱點 2、§8 第 1 點）。正方不替這一點辯護；(c) 形狀的正確做法是 P5 的：站內用、跨網路不用。

## 4. 八個專題

### 4.1 T1 MQTT 設備

T1 的 MQTT 版本分布未查證（P2 §1.1；`nats.md` §3.5），正方不拿「幾乎所有廠商都講」當理由。理由是結構的：T1 是封閉韌體（錨點 5），永遠不會講我們的協定，所以接點只有兩種：一個 broker，或一個我們自寫的 server-side 解析器。P2 選後者，候選是 amqtt（個人帳號、曾 11 個月空窗、只到 3.1.1）、rumqttd（曾 21 個月無版本、TLS 無 client-auth 鍵）、rmqtt（近期單一作者）（`mqtt-brokers.md` 列 33、30、31、32），研究員判定它們「只適合當 ingress adapter，不適合當安全邊界」（§3.2（L133-136））；P2 的退路是自寫並自己 fuzz（P2 §8 第 3 點）。Mosquitto 有 fuzzer 建置（列 2）、近兩年 Security 修正公開在 ChangeLog（列 10（L31））。意見：面對 hostile T1，一支有二十年攻擊面歷史的 C 程式比我們第一年的解析器可信（P1 §3.3 同一判斷）。圍堵邊界不變：T1 只能寫 `raw/<id>/#`、沒有 subscribe、`raw/` 永不轉送往上，bridge node 仍做 schema、限速、時間戳（P1 §3.3 四層；P5 §3.5）。

### 4.2 D-06 現場 HMI

三層介面（D-06 原文）中，現場 HMI 要低延遲、不經雲端、客戶的 SCADA 或 Ignition 類工具要能接。沒有一份提案能不用 broker 解這題，差別只在 broker 是誰的、何時裝（P1 §5、P2 §6 第三選項、P3 §6、P4 §6、P5 §6、P6 §6）。Sparkplug B 在這層是強項：RBE、BIRTH 給 HMI 點位清單、alias 省頻寬（`mqtt-semantics.md` §3.5（L124））；HiveMQ 有 Sparkplug Aware extension、Mosquitto 2.1.0 ChangeLog 列 sparkplug-aware plugin（MQ28（L70），功能細節未查證）。延遲是本機 broker 兩跳（意見，未實測）。

### 4.3 第 N 個消費者

02 §1 末段承認：第三個消費者出現時 bridge 0 必須長出 consumer 概念，否則重新發明一個較差的 Orion subscription。P2 把 consumer API 列為第一天必做、P6 估 2 人週並延後、P5 把它做成 `watch` 的唯讀版。MQTT 下是一個 client 加一條 dynsec ACL，`%c`/`%u` 樣板（`mqtt-brokers.md` 列 7（L28）；P1 §5）。差別不只人週，是「誰能接」：Grafana MQTT datasource（P1 §2，活躍度未查證）、Home Assistant 以 MQTT 當整合層（`precedents.md` e24（L51））、任何 SCADA，都不需要讀我們的 consumer API 文件。

### 4.4 離線偵測

P2 §1.1 判「部分」：Will 觸發是 keepalive × 1.5，是設定不是能力。正方接受，但補一句：P0/P2 要達到秒級，得自己寫 link 偵測、心跳 frame、watchdog（P2 §3.4 (2)）；MQTT 下 keepalive 30 s + Will Delay 30 s 得到 45～75 s（P1 §4.5），零行 code。F-27 不被破壞：Will 只把 Fleet 標成「可疑」，online/offline 仍看 heartbeat 的裝置時間（`mqtt-semantics.md` §3.3（L92））；birth 與 Will 帶 `conn` 序號，晚到的 Will 直接丟（Sparkplug bdSeq 的做法，MQ21（L68））；presence 翻轉只進 root adapter 的 SQLite，F-30 不重現。

### 4.5 離線 queue 與 late-joiner

兩件事要分開。(i) register 用 retained 不用 queue：重連只拿最新值，中間版本不重要，queue 上限無關（`mqtt-semantics.md` §3.4（L98））。這是 F-46 level-triggered 的現成實作，與 k8s「fetch current state then subscribe」同構（`precedents.md` e17（L44））。(ii) job 用 per-key retained slot，也不是 queue（P1 §4.2）。真正走 queue 的只有 `m`、`ev`、`cq` 的 QoS 1 補送，而 owner 在 unit 的 SQLite，queue 只是加速（P1 §8 第 6 點）。所以「1000 則靜默丟棄」（MQ11（L43））打不到命令面，只打到量測補送，而量測有 unit 的緩衝。

### 4.6 生態與人才

事實：MQTT 是 OASIS 標準（e09）；AWS IoT Core、Azure IoT Hub 的裝置面以 MQTT 為主、Azure 的 twin 與 direct method 不支援 HTTPS（`precedents.md` e03（L25）、e07（L29）、e08（L30））；Sparkplug 3.0 以 ISO/IEC 20237 出版（`mqtt-semantics.md` MQ25（L62），搜尋摘要）。可量化的：M-05 乾淨的 broker 有 9 個可選（列 7）。意見（未查證）：台灣自動化整合商與 PLC 閘道廠對 MQTT 的熟悉度遠高於任何自製 HTTPS 協定。02 §1「協定是自己的」那一刀在站內 hop 被削薄：topic 與 JSON 信封仍是我們的，但連線、ACL、除錯工具（`mosquitto_sub`、`$SYS` 計數）是現成的。

### 4.7 對客戶 IT 的觀感

形狀 (b) 的防火牆：T1 VLAN → bridge:8883/8884 單向、bridge → root 單向出站（P1 §3.2）。IT 看到的是「一個 Eclipse Mosquitto、兩個 port、per-client ACL」，有公開文件可查；對照 P0 是「一個自製服務、一個自製協定」。D-05 的客戶會問「平台有什麼認證」（02 §1）：MQTT 本身不是認證，但「Mosquitto + mTLS + 最小 ACL」比「我們自己寫的」容易過安全問卷（意見）。反面要先講：8883 被企業防火牆擋是 Azure 原話（`transport-through-networks.md` T15（L58）），所以跨網路不要用 MQTT，否則觀感反轉成「要客戶開 8883」。

### 4.8 P0 帳單裡算錯的一條

02 §2 說 IoT 走 broker 是因為「電池、8-bit MCU、不能掛連線」，所以插電 Linux 盒子不需要。`precedents.md` 結論 2（L8）：官方文字找不到這個理由；AWS/Azure 寫的理由是 server push 與離線期間的訊息（e03、e08）。這代表「插電所以不需要 MQTT」只對一半：不需要為省電選它，但 server push 得在 HTTP 上自己做（P2 的串流、P0 的 long-poll）。MQTT 給的正是這一塊。

## 5. 量化總表

| 項目 | 不用 MQTT（P0 / P2 / P6） | 站內 hop 用 MQTT | 來源 |
|---|---|---|---|
| 第 N 個消費者接入 | consumer API：P6 估 2 人週並延後；P2 第一天做 | 1 條 ACL，0 人週 | P6 §7；P1 §5 |
| D-06 HMI | P0 無；P2 自寫 SSE endpoint 或可選 Mosquitto | broker 訂閱，現成 | 02 §1；P2 §6 |
| 離線偵測 | 5 min（N-15）；P2 自寫 link 偵測到秒級 | 45～75 s，0 行 code | MQ8；P1 §4.5 |
| 下行延遲 | long-poll hold ≤ 30 s（P0）／15 s 輪詢（P6 Stage 0）／串流 RTT（P2 自寫） | 連線 RTT | T7～T9（L45-47）；P6 §7 |
| T1 MQTT ingress | 自寫解析器 + fuzz，或 bus factor 差的 library | Mosquitto listener + dynsec ACL | 列 30/32/33；P2 §8 |
| 自製傳輸 code | long-poll 伺服端與客戶端、重連、離線快取：約 2～3 人週 | 省掉；換成 Mosquitto 包裝 + dynsec 產生器約 3～4 人週 | P1 §9（意見） |
| 第二個 binding（P5） | — | 3～4 人週，只在第一個觸發站點付 | P5 §9 |
| 種類數（M-02） | P0 11 | P5：有 broker 站點 13、其他 11；P1 全站 14～15 | P5 §2；P1 §2 |
| 最小部署服務數 | 2 | P5 / P6：2；P1：3 | P5 §7；P1 §7 |
| 連線數與 keepalive | 每 child 一條 long-poll 或串流 | 每 unit 一條 TCP；keepalive 30 s、50 台 ≈ 1.7 PINGREQ/s | T16（L59）；P1 §8 第 8 點 |
| 外部時鐘 | 0 | Mosquitto 2.1.2 = 2026-02-09、commit 至 2026-10-04；paho-mqtt 2.1.0 = 2024-04-29 | 列 2；P1 §2 |
| broker 授權 | — | EPL-2.0 OR EDL-1.0 | 列 1（L22） |
| 三年後換掉 | — | 換 broker 3～5 人週（P1）／1～2（P5）；某站點 binding HTTPS↔MQTT < 1 人週（P5） | P1 §9；P5 §9 |

## 6. 三種用法，哪一種把論點兌現得最好

| 用法 | MQTT 放在哪些 hop | 兌現了什麼 | 沒兌現或反而失分 |
|---|---|---|---|
| P1 MQTT 原生 | 全部四條 hop（ERP 經 root adapter）；管理面也走 topic | 站內細節最完整：retained desired 帶版本、per-key sq/cq、presence 帶 `conn`、dynsec 四層圍堵、`R_resync` 回灌 | (c) 形狀兩條 trunk（無 bridge-over-WS）；最小部署 3 服務；管理面綁 broker；全站 +2 種類 |
| P3 NATS 內建 MQTT | T1 → 獨立 ingress 實例 | T1 ingress 不多一種 broker | 只到 3.1.1 且維護者拒收 MQTT 5（`nats.md` N11（L31））；給 MQTT 訂閱者一律 QoS 0（N10（L30））；MQTT 與 leaf 相關 advisory 密集（N17（L37））；每個開 MQTT 的 bridge 要 JetStream 與磁碟 |
| P5 可插拔 | 站內 hop（unit → bridge、T1 → bridge、HMI 訂閱），只在 T-a/T-b/T-c 觸發的站點；跨網路一律 HTTPS | 五項失去在需要的站點全拿回，其他站點 +0；最小部署 2 服務；管理面與 binding 無關；換 binding < 1 人週 | 刻意不用 Mosquitto bridge、QoS 2、Response Topic、Message Expiry（P5 §3.3）；兩套圍堵、兩份審查；延遲下限由 HTTPS 退路決定 |

正方的裁決：**P5 的位置，P1 的站內做法。** P5 把縫切在事實顯示傳輸真的不同的地方（站內與跨網路），這是本文 §1 的論證；但 P5 §3.3 為了契約最小公分母，連 Message Expiry 與 `retain_expiry_interval` 都不用，等於放棄 D-02 的 F-04 免費實作。P1 §4.1～§4.5 在站內 hop 上的具體設定（desired 帶 `v`、sq/cq per-key、presence `conn`、Will Delay 30 s、`R_resync`、`$SYS` drop 計數）全部可以原封搬進 P5 的 MQTT binding，不違反契約的「不保證」清單。P3 的 MQTT 是天花板最低的用法：它兌現「T1 3.1.1 ingress」一格，HMI 要 QoS 1 時不成立，MQTT 5-only 的 T1 出現時又得加 Mosquitto（P3 §7），等於回到 P5。P6 的 Stage 2（第一個 MQTT T1 或 D-06 HMI 才裝 Mosquitto，不走命令；P6 §2、§3）與 P5 的觸發規則一致，是同一個答案的分期版。

## 7. 誠實：MQTT 做不到或做不好的

1. **F-46/F-47 語意一行不省。** 版本、CAS、job key、去重、結果槽、deadline、簽章、retention 監控全部自己寫；AWS Shadow/Jobs 與 Azure twin 都是服務端在 MQTT 之上做的（`mqtt-semantics.md` 結論 1（L13）；MQ14、MQ15、MQ23（L53-55））。R3 給分 P1 與 P0 差距接近零（P1 §1 弱點 1）。
2. **retained 不是 owner。** 無版本、last-writer-wins（C-07 的影子）、`persistence` 預設 false 重啟即失（MQ10（L42））、`check_retain_source` 預設 true 讓發布者憑證輪替後 retained 對新訂閱者消失（MQ9（L36））。owner 必須在 SQLite，broker 重啟後要回灌。
3. **離線 queue 有上限且靜默丟。** Mosquitto 每 client 1000 則、超過 silently dropped、預設不落盤（MQ11、MQ10）。retention window 沒有消失，只是換成 broker 設定；必須明設並以 `$SYS` 計數監控（細節未查證）。
4. **Will 不等於 F-27。** 它是接收端事件、偵測窗是 keepalive × 1.5、NAT 半開要等這個窗（MQ8；§3.3）。它只能是提示。
5. **穿 TLS 檢查 proxy：MQTT 不因為是 MQTT 更耐活。** 8883 在只放 443 的網路會死（T15）；搬到 WSS 443 後面對的 proxy 問題與 HTTPS 相同，還多了 Upgrade 與長連線（`transport-through-networks.md` 結論 2（L164）、§5 表）；Mosquitto 舊 WS listener 無 `require_certificate`（T14（L57））；Mosquitto 無 bridge-over-WebSocket（P1 §1 弱點 2）。這就是為什麼跨網路 hop 不用它。
6. **MQTT 5 支援度參差。** Mosquitto bridge 預設 3.1.1，要 v5 須明設（MQ16（L45））；VerneMQ bridge 以 3.1.1 轉發、丟 v5 屬性（`mqtt-brokers.md` 列 25（L66））；NATS 只到 3.1.1 且不收 MQTT 5（N11）；amqtt 只 3.1.1、Aedes 無 v5（列 33、36）；NanoMQ 不支援 v5 Auth（列 12）；Azure IoT Hub 只 3.1.1 且不存 retain（MQ13（L52））。QoS 2 兩大雲端都不支援（MQ12、MQ13、MQ24）。MQTT 5 規格 normative 條文研究員未直讀（`mqtt-semantics.md` §4 第 1 項（L134））。
7. **Sparkplug B 不適合管理面與命令面。** NCMD QoS 0、強制 Clean Session、三層 topic 放不下可堆疊 bridge、沒有 job、host 不被要求拒絕未宣告 metric（MQ17～MQ20（L64-67））；Tahu 的 Java 依賴停在 2022 年前後、活躍度未查證（MQ26（L63））。
8. **Mosquitto 的 bus factor。** 近期 commit 幾乎全由一人、2026-02-09 後約 8 個月無新 tag（列 2）；3.0 將移除 `acl_file`、`password_file`、`per_listener_settings`（列 8（L29））；arm64 足跡未查證（列 11（L32））。緩解只有 EDL 允許自己 patch 與建置。
9. **圍堵邊界變成 C 程式的解析器加 dynsec 的正確性，且同一 process 持有往上的憑證**（P1 §3.3 誠實段）。dynsec 產生器寫錯一條 ACL 就是 C-09 重現；T1 把 broker 打掛就是整個 VLAN 的 T2 進 N-11 模式。升級版是 T1 listener 用第二個 Mosquitto 實例（P1 §3.3 末段）。
10. **T1 MQTT 版本分布未查證**；「幾乎所有 PLC 閘道都講 MQTT」（02 §1）是意見。
11. **鬼 topic。** re-plug 後舊 path 的 retained 還在（C-08 影子），root adapter 要發空 retained 清除（P1 §8 第 7 點）。
12. **若在 root 放 broker，最小部署 +1 服務**（P1 §7）。正方因此不主張 root broker。

## 8. 如果只能在一個 hop 用 MQTT，應該是哪一個

**答案：bridge 主機上那個 broker 的南向 hop——T1 設備與 D-06 edge controller 連進 bridge 的那一跳，HMI 以唯讀角色在同一個 broker 訂閱。**（P5 §3.2 的 T1 ingress 列、P1 §3.3、P6 Stage 2 描述的是同一條 hop。）

為什麼是這一條：

1. **五項失去全部住在這裡。** 扇出與 retained 給 HMI、Will 給 T1 的存活提示、T1 講 MQTT 的接點、生態（Sparkplug、SCADA）都是這一跳的事（P5 §1 理由 2；`transport-through-networks.md` §3.4）。
2. **對端是封閉韌體，沒有第二選項。** T2 可以裝我們的 agent 講任何協定，T1 不能。只在一條 hop 用時，要用在「不用就得自寫解析器」的那條，而不是用在「本來就能講我們協定」的 T2 hop。
3. **MQTT 的所有弱點在這裡都不致命。** 這一跳沒有命令面：T1 不經 MQTT 收命令（P6 §3「T1 的訊息永遠不會變成命令」；P3 §3 第 3 層），所以 F-46/F-47 的缺口、retained 非 owner、queue 靜默丟、Sparkplug NCMD 的問題全部不在路徑上。沒有客戶 proxy：§7 第 5 點整條不適用。
4. **圍堵不退步。** bridge node 仍是守門員，T1 只能寫 `raw/<id>/#`、`raw/` 不出 broker；多出來的攻擊面只有「T1 能直接打 Mosquitto」，對策是 broker 只綁 T1 VLAN 介面、不持任何往上憑證（P6 §8 第 10 點：hub 才是上行身分持有者）。
5. **P0 自認沒有答案的兩題在同一條 hop 上一次解掉**（02 §1：T1 MQTT adapter、D-06 HMI），而且四份提案的答案一致（§4.2）。

為什麼不是其他三條：bridge → bridge 0 在形狀 (c) 會撞 8883 與 TLS 檢查 proxy，MQTT 在那裡沒有優勢只有兩條 trunk 的成本（§3、§7 第 5 點）；bridge 0 → ERP 的對端是 Odoo，C-20 禁止交易內遠端呼叫、F-68/F-69 要單一路由與單一 queue，MQTT client 進 Odoo process 沒有任何提案主張；T2 unit → bridge 用 MQTT 的收益（RTT 下行、late-joiner、presence）是真的，但 P2 §3.4 證明它們能在 HTTPS 串流上以 1～2 人週自寫補回，而 T1 hop 的收益不能。

一句總結：如果 broker 只能出現一次，讓它出現在 bridge 的南邊、面向我們不能改的東西、不碰命令面、不跨客戶網路。這一條 hop 拿回 02 §1 說的全部五項，付的是 +2 種類，而且只在有 T1 MQTT 或 D-06 的站點付。這就是「我們到底為此得到什麼」的正方答案。
