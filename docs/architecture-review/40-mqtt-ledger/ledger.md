# MQTT 帳本：我們到底為此得到什麼

> 波次 B，MQTT 帳本。日期 2026-10-10。撰寫者：主審（Claude 主 agent）。原定由一位 xhigh 的帳本評審撰寫，但帳號每週用量上限在它啟動前到達；本文由主審依 `advocate.md`、`opponent.md`、`10-facts/`（mqtt-semantics、mqtt-brokers、transport-through-networks、precedents、nats）、六份提案與已完成的 12 份批評（每份提案的 security 與 longevity）寫成。待上限重置後，可再派一位獨立評審覆核本文（見 `LOG.md`）。
>
> 引用慣例：`檔名` 條目或節號；提案寫 P1 §3.3；批評寫 P3-security-01。標「意見」者是主審的判斷。

## 0. 結論先講：直接回答 owner 的問題

owner 問：「MQTT 那邊的失去感覺差很多，我們到底為此得到什麼？」

**答：不用 MQTT 得到的是六樣可以點名的東西，但真正值錢的只有兩樣。失去的五樣裡，真正補不回來的也只有兩樣。而且雙方在「MQTT 該放哪」上幾乎一致，分歧只剩一條 hop。**

得到的六樣（`opponent.md` §1），依價值排序：

1. **跨客戶網路那一跳的存活，以及只有一條 trunk 程式路徑。** 在 (c) 形狀（站點只有 outbound、客戶可能有 TLS 檢查 proxy、只放 443），只有跑在 HTTPS 上的應用層協定不需客戶讓步就能活；MQTT 8883 會死，MQTT over WSS 443 面對同一組 proxy 問題再加 Upgrade 與長連線，而 Mosquitto 沒有 bridge-over-WebSocket，所以 P1 在 (c) 要維護兩條 trunk（`transport-through-networks.md` §5、T14、T15；P1 §1 弱點 2）。**這一樣是高價值，而且是結構性的。**
2. **安全邊界與審查面只有一份。** MQTT 放進信任鏈時，多出 broker 的 C 解析器站在 hostile T1 正面、dynsec 產生器（寫錯一條 = C-09 重現）、`check_retain_source` 的撤銷副作用、第二條 trunk 的身分流程（P1 §3.3、§7；`mqtt-semantics.md` MQ9；P5-security-02）。**高價值。**
3. e2e 矩陣不加倍（3 而不是 6；N-18）。中價值。
4. 種類數與外部時鐘：+0 對上 +2～+4；Mosquitto 2.1.2 之後約 8 個月無新 tag、近期 commit 單一作者；paho-mqtt 約 29 個月無新版（`mqtt-brokers.md` 列 2；P1 §2）。中價值，但注意 longevity 批評一致指出所有提案的種類數都少算了 3～5 種（HTTP stack、crypto、Modbus、Python/OS、Anthias、nginx），重算後各案差距縮小。
5. 最小部署維持 2 個服務而不是 3（P1 §7、P3 §7）。低中價值，只在 broker 放在 root 時成立。
6. retention window 全部由自己的 code 持有，而不是多 6 個由 broker 預設值決定、超限靜默丟棄（MQ11）、過期懶惰清除（MQ9）的 window。中價值。

失去的五樣（02 §1），裁決：

| 02 §1 列的失去 | 裁決 | 一句理由 |
|---|---|---|
| 第 N 個消費者的扇出 | **部分成立** | 失去的是「免費」不是「能力」：consumer API（list + watch with cursor）1～2 人週可補；但第三方工具「訂了就能看」的體驗補不回來（見失去 A） |
| retained | **不成立，反而是負資產** | 無版本、last-writer-wins（C-07）、預設不落盤、憑證輪替後對新訂閱者消失、鬼 topic（C-08）、懶惰過期；AWS/Azure 都不這樣做（MQ9、MQ10、MQ13、MQ15；P1 §8） |
| last-will 秒級離線偵測 | **部分成立** | Will = keepalive × 1.5，是設定不是能力；P1 自己把它降為「可疑」提示，正式 offline 仍看裝置時間（P1 §4.5）；HTTPS 串流的 link-down 事件可做到同級（P2 §3.4） |
| T1 講 MQTT | **成立但前提未查證** | 目前需求裡沒有任何已知 T1 講 MQTT（D-03 全是 Modbus）；但一旦出現，面對 hostile T1 寧用 Mosquitto 也不要自寫解析器或 bus factor 差的 library（`mqtt-brokers.md` §3.2）（見失去 B） |
| D-06 現場 HMI 沒有答案 | **缺口成立，但 MQTT 只是三條答案之一** | web HMI 可用 bridge 的 SSE endpoint；SCADA / Ignition / Sparkplug 類則非 broker 不可（`mqtt-semantics.md` §3.5；P2 §6） |

真正補不回來的兩樣：

- **A. 第三方工具的接入體驗。** HMI、SCADA、Node-RED、Grafana MQTT datasource 天生會講 MQTT，不會講我們的 consumer API。這是 R5 上真實的分數。
- **B. 面對 hostile T1 的成熟解析器。** 若 T1 需要 broker 語意（訂閱、QoS 1、retained），library 式 ingress 不夠，自寫解析器的 fuzz 與 CVE 面是我們的。

**所以正確的問題不是「用不用」，而是「放在哪一跳」。** 正反雙方對四條 hop 的裁決：

| hop | 正方（`advocate.md` §8） | 反方（`opponent.md` §5） | 主審裁決 |
|---|---|---|---|
| bridge → bridge 0（trunk，跨客戶網路） | 不用 | 不用 | **不用。一律 HTTPS 串流** |
| bridge 0 → ERP | 不用 | 不用 | **不用。維持 queue 路由** |
| 管理面（announce / adopt / revoke / 憑證） | 不綁 | 不綁 | **不綁任何 binding** |
| T1 設備與 D-06 edge controller → bridge；HMI 訂閱 | 用（首選） | 可用（有觸發時） | **用，有觸發時；Mosquitto 當 bridge 南邊的投影與入口** |
| T2 unit → bridge | 次選（P5 做法） | 不用 | **第一版不用；PoC 後可重新評估**（理由見 §4） |

一句話：**MQTT 的傷害不在「有沒有」，在「放在哪」。放在 trunk 與管理面（P1、P3）時，上面六樣得到全部失去；放在 bridge 南邊當投影與入口（P2 第三選項、P6 Stage 2、反方放法 A）時，只付「該站點 +1 runtime」，而拿回失去的 A 與 B。**

## 1. 帳本

欄位：項目 / 對我們情境的價值 / 不用 MQTT 的替代做法與代價 / 用 MQTT 的代價 / 裁決 / 依據。價值以 03-brief §1 的錨點衡量：單站、幾百個感測器、幾十片螢幕、插電 Linux 盒子、D-05 與 D-06 是下一步。

| # | 項目 | 價值 | 不用 MQTT：替代與代價 | 用 MQTT：代價 | 裁決 | 依據 |
|---|---|---|---|---|---|---|
| 1 | 第 N 個消費者扇出（MES、Grafana、HMI） | 中：第三個消費者尚未出現，D-06 HMI 是第一個真實案例 | consumer API：list + watch with cursor，與 child 的 watch 同一段 code，1～2 人週；cursor 過期是明確 410 | 每個消費者一條 dynsec ACL；ACL 寫錯 = C-09 重現；每次 adopt 要跑拒絕測試 | 看 hop：站內 HMI 類消費者 MQTT 勝；跨網路消費者 API 勝 | `mqtt-semantics.md` §5 F-49；`precedents.md` e17、e18；P1 §7、§8；P6 §7 |
| 2 | retained 的 late-joiner 語意 | 低：SQLite 的 desired 鏡像有版本有 owner；watch 第一個 frame 是全量快照，等價 | 無額外成本（watch 首 frame） | 六個陷阱：預設不落盤、`check_retain_source` 撤銷副作用、懶惰過期、last-writer-wins（C-07）、鬼 topic（C-08）、broker 重啟到回灌之間的窗口 | 不用勝 | MQ9、MQ10、MQ13、MQ15；P1 §8 第 3、4、5、7 點；P2 §3.4 |
| 3 | last-will 離線偵測 | 低中：F-27 要求以裝置報告時間判定，Will 是接收端事件 | parent 看串流關閉或連續兩個心跳 frame 未到 → link-down（秒到一分鐘），約 0.5 人週 | Will 觸發 = keepalive × 1.5；NAT 半開、Wi-Fi 漫遊、broker 重啟都會假 offline；要 Will Delay、`conn` 序號、去抖 | 平手，略偏不用 | MQ8、MQ3、MQ21；P1 §4.5；P2 §3.4 |
| 4 | T1 講 MQTT 的入口 | 中：目前需求裡沒有已知 T1 講 MQTT；錨點 5 說「部分可能」 | (a) library ingress：amqtt 只 3.1.1、rumqttd 無 client-auth、rmqtt 單一作者；(b) 自寫 4 種封包解析器 + fuzz，1.5～2 人週，CVE 面是我們的 | Mosquitto 獨立 raw 實例、只綁 T1 VLAN、publish-only `raw/<id>/#`、不持任何憑證；該站點 +1 runtime | MQTT 勝，**當觸發出現時** | `mqtt-brokers.md` 列 2、10、30、32、33、§3.2；P1 §3.3；P2 §8 第 3 點 |
| 5 | D-06 現場 HMI / SCADA（Sparkplug 資料面） | 高：錨點 8 已知下一步；三層介面中的現場層 | web HMI：bridge 的 SSE/NDJSON endpoint，LAN 毫秒級，+0 種類；SCADA / Ignition：無替代 | 該站點 +1 runtime；Sparkplug 只做資料面，命令面絕不走它（NCMD QoS 0、強制 Clean Session） | MQTT 勝，當客戶要 SCADA 類工具時；web HMI 平手 | `mqtt-semantics.md` §3.5、MQ17～MQ20；P2 §6；P5 §1.1 T-b |
| 6 | 事件型資料（D-05 刷卡、出勤） | 中：D-05 是下一步，且是安全產品 | 裝置 durable event log + cursor 的 report；是模擬不是原生 | QoS 1 自然；但 queue 每 client 1000 則超限靜默丟、預設不落盤；owner 仍要在 SQLite | 平手：兩案 owner 都在裝置的 SQLite，MQTT 只是加速 | MQ10、MQ11；P2 §6 D-05；P5 §8 第 6 點；`precedents.md` e15（Apple MDM 的 CommandUUID 語意） |
| 7 | 連線處理成熟度（reconnect jitter、half-open、cleansession、try_private） | 中（站內）；不適用 trunk | 自寫 keepalive 25 s、watchdog、jitter backoff、`Retry-After`；客戶正向 proxy 的緩衝行為無文件，要 PoC | Mosquitto bridge 現成；但 Mosquitto bridge 不上我們的 trunk，所以此優勢只在站內 | 站內 MQTT 略勝；trunk 不適用 | `mqtt-brokers.md` 列 4、5；`transport-through-networks.md` §4 第 5 點、T7～T9；P2 §3.4 |
| 8 | fan-in：bridge 在 CM4 級硬體維持幾十到幾百條持久連線 | 中 | node 自己撐；未實測，是 PoC 項目 | broker 本職 | 平手，待 PoC | P2 §8 第 5 點；`opponent.md` §4 第 3 點 |
| 9 | 下行延遲 | 低：N-15 說「幾秒內收斂是期望不是保證」 | HTTPS 串流 = 連線 RTT；long-poll hold ≤ 30 s | 連線 RTT | 平手 | T7～T9；P2 §3.4；P6 §7 |
| 10 | 詞彙、招聘、客戶 IT 觀感 | 中 | 「我們有自己的 HTTPS 串流協定」要解釋 | 「要客戶開 8883」的反觀感；Azure 原話：許多企業防火牆擋 8883 | 平手：站內用 MQTT 可拿到觀感而不付 trunk 代價 | T15；`advocate.md` §4.7；`opponent.md` §4 第 7 點 |
| 11 | 標準與生態（OASIS、broker 可選性） | 低中：M-05 + M-06 篩完實質只剩 Mosquitto，次選 NanoMQ | — | EMQX BSL 出局、FlashMQ 要法務、HiveMQ CE 無 bridge、NATS 只到 3.1.1 且拒收 MQTT 5 | 縮水：傳輸的生態不是語意的生態，topic 與 JSON 信封仍是我們的 | `mqtt-brokers.md` §1；`nats.md` N11；P1 §9；P5 §1 弱點 2 |
| 12 | F-46 / F-47 的語意（版本、CAS、job key、去重、結果槽、deadline、簽章） | 高，但 MQTT 不給 | 自己寫 | 自己寫（AWS Shadow / Jobs、Azure twin 都是服務端在 MQTT 之上做的） | 平手（零）：換 broker 不少寫一行 | `mqtt-semantics.md` §1 第 1 點、§5、MQ14、MQ15、MQ23；P1 §1 弱點 1 |
| 13 | (c) 形狀的 trunk 存活 | 高 | HTTPS 串流：三種客戶網路皆過；mTLS 在 TLS 檢查 proxy 下要換成應用層身分 | MQTT 8883 在只放 443 的網路死；WSS 443 同一組 proxy 問題 + Upgrade；無 bridge-over-WebSocket | 不用勝 | `transport-through-networks.md` §5、T1～T5、T14、T15；P1 §1 弱點 2 |
| 14 | 單一 trunk 程式路徑、e2e 矩陣 | 中 | 3 形狀 × 1 傳輸 = 3 | P5：× 2 = 6；P1：(c) 兩條 trunk ≥ 4，另加三項 Mosquitto 專屬 PoC | 不用勝 | N-18；P5 §7；P1 §9 |
| 15 | 種類數與外部時鐘 | 中（重算後差距縮小） | +0 | +2～+4 種類、+2 時鐘、+2 設定方言；3.0 將移除 `acl_file` / `password_file` / `per_listener_settings` | 不用勝；但只在觸發站點付時降為「該站點 +1」 | `mqtt-brokers.md` 列 2、8；P1 §2；P5 §2；P2-longevity-02、P5-longevity-01 |
| 16 | 安全審查面 | 高 | 一份：node 的 HTTP 解析、PKI、簽章、consumer token | +4 項：broker 解析器、dynsec 產生器、retained 與撤銷交互、第二條 trunk 身分 | 不用勝；放法 A 可把它壓回「+ dynsec 產生器一項」 | P5 §1 弱點 1；P1 §3.3；P5-security-01、-02 |
| 17 | 最小部署服務數 | 低中 | 2 | 3（broker 在 root）；放法 A 仍是 2 | 不用勝，放法 A 平手 | P1 §7；P3 §7；N-13 |
| 18 | 單一 process 持有樹的憑證（M-04） | 高 | node 是唯一持憑證的 process | P1 把 bridge 上游憑證放進 Mosquitto（`bridge_certfile`），T1 連進同一支程式 | 不用勝；放法 A（broker 不持樹憑證）平手 | `mqtt-brokers.md` 列 4；P1 §3.3；P5-security-02 |
| 19 | retention window 的持有者 | 中 | 9 個，全由我們的 code 持有、明寫、有 drop 計數 | 另加 6 個由 broker 預設值決定，超限靜默丟、過期懶惰清除 | 不用勝 | P1 §4.3；P2 §4.3；MQ9、MQ11 |
| 20 | 離線 queue | 低：register 用 retained 不用 queue；真正走 queue 的只有量測與 cq 補送 | owner 在 SQLite，重讀 | owner 仍在 SQLite，queue 只是加速；1000 則上限打到量測補送 | 平手，略偏不用 | `mqtt-semantics.md` §3.4；P1 §4.2、§8 第 6 點 |
| 21 | 人週 | 中 | 第一次交付：省 3～4 人週（P5 的 MQTT binding）或 2.5～4（P2 的 ingress + 消費者 Mosquitto），皆可等觸發再付 | P1 自估第一次交付「大致持平或略高」，另加 1.5 人週 PoC | 不用勝（第一次交付）；之後每個觸發站點付 1.5～4 人週 | P1 §9；P2 §9；P5 §9；P6 §9 |

計分（意見）：不用勝 9、MQTT 勝 2（皆為「有觸發時」）、平手或看 hop 10。**但「MQTT 勝」的那兩項正好是 owner 已知的下一步（D-06 SCADA、T1 入口），而「不用勝」的九項裡有七項在放法 A 下降為平手或「該站點 +1」。** 這就是為什麼答案是「放在哪」而不是「用不用」。

## 2. 02-tradeoffs.md 的 MQTT 帳單重算

02 §1 是單邊帳：列了五樣失去，沒有列 MQTT 自帶的成本（`opponent.md` §2.7）。重算：

| 02 的項目 | 02 的金額 | 重算 | 修正理由 |
|---|---|---|---|
| 扇出 | 失去 | 失去「免費」；能力以 1～2 人週補回；第三方工具接入體驗是真失去 | 帳本 #1 |
| retained | 失去 | **負資產** | 帳本 #2 |
| last-will | 失去（秒級 vs 五分鐘） | 兩者都是設定；HTTPS 串流可做到同級；Will 另有假 offline 成本 | 帳本 #3 |
| T1 講 MQTT | 失去（幾乎所有廠商都講） | 前提未查證、需求裡無已知案例；觸發出現時 MQTT 勝 | 帳本 #4 |
| D-06 HMI | 沒有答案 | 缺口成立；MQTT 是三條答案之一，SCADA 類必要 | 帳本 #5 |
| 生態 / 通用語 | （隱含） | 供給側只剩 Mosquitto；傳輸生態 ≠ 語意生態 | 帳本 #11 |
| （02 未列）(c) 形狀存活、審查面、e2e 矯陣、時鐘、retention 持有者 | — | 不用 MQTT 的六樣得到，02 一樣沒記 | 帳本 #13～#19 |
| 02 §2 的理由「IoT 走 broker 是因為電池 / MCU」 | — | **未被證實**：AWS / Azure 官方理由是 server push 與離線訊息，不是電池 | `precedents.md` 結論 2、e03、e08 |
| P0 §3 的理由「多一種要維護的東西」 | — | 最弱的理由；正確理由是 (c) 存活與語意不省 | P2 §1.2；`opponent.md` §4 第 9 點 |

## 3. MQTT 應該出現在哪些 hop

圖例：`====` HTTPS 串流（child 撥出、每跳 TLS、應用層簽章）；`----` MQTT（只在站內、只在觸發站點）；`....` vendor 協定（Modbus 等）。

**(a) 同主機、最小部署**

```
  [Odoo]==queue==[bridge 0 / node]
                        ||
                 ======================  (unit 撥出)
                 ||                 ||
             [screen A]         [screen B]
             node + display     node + display

  沒有 MQTT。一片螢幕 = Odoo + node 兩個服務。
  若此站點日後有 T-a / T-b 觸發：在 ERP 主機加一個 Mosquitto，僅綁 IoT VLAN 介面。
```

**(b) 同站不同 VLAN，且有 T1 MQTT 設備與 D-06 HMI**

```
  管理 VLAN                 IoT VLAN                                   HMI / 現場 VLAN
  [Odoo]==[bridge 0]====[bridge / node]                                 [HMI / SCADA]
                           ||   |  \....Modbus....[T1 meter]                   |
                           ||   |                                              | subscribe
                           ||   |-- 訂 raw/ --> [Mosquitto raw 實例]            | (唯讀角色)
                           ||   |               ^ publish-only raw/<id>/#       |
                           ||   |               |                               |
                           ||   |            [T1 MQTT sensor] [D-06 edge ctrl]  |
                           ||   |                                               |
                           ||   |-- 重發已驗證 actual / meas --> [Mosquitto n 實例] --+
                           ||
                   ================ (unit 撥出)
                   ||            ||
               [screen]       [LED]

  規則：bridge → bridge 0 一律 HTTPS。unit → bridge 第一版 HTTPS。
  Mosquitto 不持樹的憑證、不載管理面、不出現在 trunk。
  raw 實例與 n 實例分開（P5-security-02、P1 §3.3 升級版）：hostile T1 打掛 raw 實例，HMI 投影與 unit 不受影響。
```

**(c) 雲端 ERP、站點只有 outbound**

```
  我們的雲                                  客戶站點（只放 443，可能有 TLS 檢查 proxy）
  [Odoo]==queue==[bridge 0]  <==HTTPS 443==  [bridge / node] ---- 站內同 (b) ----
                                 (TLS 檢查 proxy 下 mTLS 失效：身分靠應用層簽章；
                                  keepalive ≤ 25～30 s；jitter backoff；Retry-After)

  MQTT 永不出現在 site → cloud 這一跳。雲端的消費者走 bridge 0 的 consumer API。
```

## 4. 唯一的分歧：T2 unit → bridge 要不要走 MQTT

P5 的 T-a 論證：既然 broker 已經在了，unit hop 共用可省掉第二個 listener 與「node 再 publish 一份」的複製路徑。反方：unit hop 走 MQTT 的代價是兩套圍堵實作、兩份安全審查、e2e × 2、CM4 上兩套傳輸 client（P1 自己承認媒體與文件不走 MQTT，`max_packet_size` 預設 2 MB；P1 §6 D-01）。

已完成的批評補了兩個事實：

- P5-security-01：MQTT binding 的 `put` 歸屬由 broker ACL 決定，不由 node；PUBLISH 封包沒有發布者身分，node 只能檢查「topic 裡的 path 存在」，不能檢查「這個 client 有權寫這個 path」。要補救得讓每個 payload 帶 unit 簽章，等於契約裡 `sig` 從預留變必填。
- P5-longevity-02：一個 binding 一旦上過生產，最短壽命 = 該站點裝置的壽命；「不用就刪」在 fleet 上執行不了。

主審裁決：**第一版 unit hop 走 HTTPS。** 收益（RTT 下行、late-joiner、presence）P2 §3.4 證明能以 1～2 人週在 HTTPS 串流上補回；代價（兩套圍堵、審查 × 2、e2e × 2、binding 終身制）不可逆。等 PoC 量到 CM4 bridge 的 fan-in 撐不住，或某站點 unit 數量讓 HTTPS 串流的 keepalive 成本變得顯著，再開這條 hop。開的時候 P1 §4 的站內做法（desired 帶 `v`、per-key sq/cq、presence `conn`、`R_resync`、`$SYS` drop 計數）可以原封搬進 binding。

## 5. 六份提案的 MQTT 用法評比

| 提案 | MQTT 在哪 | 最划算 / 最危險 | 理由 |
|---|---|---|---|
| P2 第三選項、P6 Stage 2、反方放法 A | bridge 南邊的投影與入口；有觸發才裝 | **最划算** | 拿回失去 A、B，只付該站點 +1 runtime；trunk、管理面、憑證、最小部署全不碰 |
| P5 | 站內 hop 的第二個 binding，含 unit hop | 可辯論 | 契約 + conformance + memory binding 那一半（P5 稱 (A)）邊際成本接近零，所有提案都該採；第二個生產 binding 那一半（(B)）付兩套圍堵與 e2e × 2，且 P5-security-01 顯示安全保證在兩個 binding 不等價 |
| P1 | 全部 hop，管理面也走 topic | **最危險** | (c) 兩條 trunk；最小部署 3 服務；broker 持樹憑證且站在 T1 正面；P1-security-01（簽名信封沒綁收件者，可跨 unit 重放）、-02（TOFU 信任錨）、-05（content 沒簽）在 MQTT 放大但不是 MQTT 獨有 |
| P3 | NATS 內建 MQTT 3.1.1 listener | 天花板最低 | 維護者拒收 MQTT 5；給 MQTT 訂閱者一律 QoS 0；MQTT / leafnode 相關 advisory 密集；P3-security-01（unit 無信任錨）、-02（permission 跑不動 JetStream）顯示 NATS 的「現成零件」要自己吃透 |
| P4 | ThingsBoard IoT Gateway → Edge 的 MQTT | 不是 MQTT 的問題，是平台的問題 | P4-security-01：gateway 憑證是 tenant 範圖能力，一片 CM4 可替整站任何裝置說話；P4-longevity-01：BSL 1.1 的 100 devices 與一台 server 在 (a)(b) 第二個站點就撞 |

## 6. 裁決時缺的事實（需要 PoC 或再查證）

1. Mosquitto 在 arm64 / CM4 上的 RSS 與二進位大小（`mqtt-brokers.md` 結論 6 明說查不到可信數字）。
2. hostile T1 能否用合法協定（不重複 topic 的 retained、重複 CONNECT 建 session）耗盡 Mosquitto 記憶體或磁碟；Mosquitto 有無 per-client retained 數量上限（P5-security-02 情境 A）。
3. 客戶正向 proxy 對串流回應的緩衝行為（`transport-through-networks.md` §4 第 5 點：無文件）。這同時影響 HTTPS 串流與 WSS。
4. node 在 CM4 級 bridge 上的 fan-in 上限（帳本 #8）。
5. dynsec 與 `use_identity_as_username` 的互動（P1 §3.4 標未查證）。
6. 目標客戶的 T1 設備與 D-06 edge controller 實際講的 MQTT 版本分布（所有文件皆標未查證）。
7. Mosquitto sparkplug-aware plugin 與 Eclipse Tahu 的維護狀態（MQ26、MQ28）。
8. Mosquitto 2.1 線的 LTS / 支援期政策（P1-longevity 表：未查證）。

## 7. 一段話給 owner

你的「失去感」有一半是對的、一半是 P0 給了一個弱理由造成的。對的那一半：D-06 的 SCADA 層與 T1 MQTT 入口，不用 broker 就沒有好答案，而這兩個正好是你已知的下一步。錯的那一半：retained、last-will、扇出這三樣，在事實面前要麼縮水、要麼可以用一兩人週補回、要麼根本是負資產；而 P0 說「不用 MQTT 是因為多一種要維護的東西」，這不是真正的理由。真正的理由是：跨客戶網路那一跳只有 HTTPS 活得下來，而 MQTT 買不到 F-46/F-47 的任何一行語意。

所以結論是：**MQTT 進來，但只進 bridge 的南邊；它是投影與入口，不是樹。** 第一個客戶一人週都不付；第一個講 MQTT 的 T1 或第一個要 SCADA 的 D-06 站點出現時，在那個 bridge 旁放一個 Mosquitto，raw 與 n 兩個實例，node 仍是守門員。這樣你拿回真正失去的兩樣，而不交出得到的六樣裡任何一樣。
