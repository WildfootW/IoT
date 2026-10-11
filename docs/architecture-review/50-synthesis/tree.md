# 樹狀架構圖

> 2026-10-11，主審依 `final.md` §2、§3、§4、§5、§6、§9 畫。箭頭 `-->` 是新連線的發起方向，永遠由 child 撥向 parent；下行內容走 child 已開的連線回來。PCIe 對照只是幫助理解，不是實作要求。

## 1. 邏輯樹（與 PCIe 對照）

```
 PCIe 類比               我們的樹                                           持有什麼
 ──────────              ────────────────────────────────────────────────    ─────────────────────────
 OS + 應用               ┌──────────────────────────────────────────────┐
                         │ Odoo ERP                                      │  desired、SQ、CMS、結果 archive
                         │   Fleet / Manage / CMS UI                     │  （業務真相）
                         └───────────────┬───────────────────────────────┘
                                         │ B0 讀 queue、推 inbound（HTTPS，同主機或私網）
 Root complex            ┌───────────────┴───────────────────────────────┐    ┌──────────────────────┐
 + bus driver            │ bridge 0（node，root 角色）                    │◄──►│ 安全 journal          │
                         │   registry 投影、issuer、consumer API、writer │    │ 獨立故障域工作站      │
                         └───────┬───────────────────────────┬───────────┘    │ adopt/revoke/key/     │
                                 ▲ 443                       ▲ 443             │ policy/binding 決策   │
 Switch                  ┌───────┴────────┐          ┌───────┴────────┐        └──────────────────────┘
 （每個 VLAN 一個，       │ south bridge A │          │ south bridge B │
  可堆疊）               │ node，bridge 角色│          │（第二層 bridge  │
                         │ poller/raw/     │          │  也是同一支 node）│
                         │ validator/快取  │          └───────┬────────┘
                         └──┬─────┬─────┬──┘                  ▲ 443
                            ▲     ▲     ▲                      │
                          443   443   502/serial       ┌───────┴────────┐
 Endpoint             ┌─────┴─┐ ┌─┴─────┐  ┌──┴──────┐  │ unit（螢幕）    │
 （T2 unit）          │ unit  │ │ unit  │  │ T1 meter│  │ 同時啟用 south  │
                      │ 螢幕  │ │ 感測盒│  │ Modbus  │  │ 角色，輪詢 T1   │
                      └──┬────┘ └──┬────┘  └─────────┘  └───┬───────┬────┘
 Function             ┌──┴──┐    ┌─┴──┐                    ┌─┴──┐  ┌─┴────┐
 （Bus:Dev.Function） │disp.0│    │env.0│                   │disp.0│  │T1 rep│
                      └─────┘    └────┘                     └────┘  └──────┘
 PCIe-to-PCI bridge   T1 沒有 agent，由 south 建 representative 代述，標低信任。

 Config space  = announce（serial、功能、class、schema、capability）
 DSN（永久）    = unit 的 serial 與裝置自產的 key
 BDF（可變）    = adopt 時指派的 path，re-plug 會變；事實鍵用 unit/function，path 只是路由
 ACS / IOMMU   = south 圍堵：T1 只到 poller 或 raw feed，永不直達 B0、ERP、DB
 Hot-plug      = unit 以 bootstrap cert 撥入 → present, unadopted → Manage → 7 天營運 cert
```

## 2. 四個 plane 在樹上怎麼走

```
                     ERP            bridge 0          south           unit           backend
 管理 / 身分   adopt 意圖 ─▶ journal 交接 ─▶ 投影 ──────▶ cert、cfg ────▶ （無）
 （issuer 簽）                 revoke 60s ◀──────────────── 鏡像撤銷清單 ─────▶ 停新命令

 命令          desired/SQ ─▶ 鏡像 ────────▶ 鏡像 ────────▶ inbox 落盤 ───▶ reconciler
 （ERP 版本、   （簽章綰 unit/function/epoch/期限）                        先寫 CQ 再上報
  unit 持 CQ）  結果 archive ◀─ receipt ◀────── receipt ◀─── CQ、actual ◀── backend 結果

 文件          CMS 版本 ─▶ pointer+hash ─▶ 快取 ─────────▶ 快取 ─────────▶ 驗 hash 後套用
 （pull）       （unit 憑 parent grant 拉，不直連 ERP）                      LKG 可續播

 回傳資料      業務事件 ◀── writer 寫 history PG ◀── spool ◀──── spool ◀──── 量測、狀態
 （ERP 只收     （門檻事件在資料 owner 節點算，                 receipt 後才釋放 spool
  事件）         ERP 只收 transition）

 連線方向：每一條 hop 都是右邊撥向左邊（child → parent，443）。下行內容走已開的連線。
 每一跳驗 parent 與 child；unit 的原始簽章保留到 root，中介不代簽 actual。
```

## 3. 三種部署形狀

```
 (a) 同一台主機                         (b) 同站不同 VLAN                     (c) 站點只出 443
 ┌─ hypervisor ──────────────────┐     ┌─ 管理 VLAN ───────────────┐          我們的雲
 │ north VM                      │     │ Odoo + PG + bridge 0      │          ┌──────────────────┐
 │  Odoo + PG + bridge 0 + issuer│     └─────────▲─────────────────┘          │ Odoo + PG + B0   │
 │                               │               │ 443                         │ （多客戶各一組）  │
 │ south VM / UID                │     ┌─ IoT VLAN ─┴──────────────┐          └────────▲─────────┘
 │  poller + raw_i + validator   │     │ south bridge（node）       │                   │ 443，可經核准 proxy
 │  只掛專用 NIC                 │     │  ▲ 443      ▲ 8883   ▲ 502│                   │ Profile M：mTLS
 └──▲────────────▲──────────────┘     │ unit        MQTT T1   T1   │                   │ Profile I：owner 核准
    │ 443        │ 專用 NIC/VLAN      └────────────────────────────┘          ┌────────┴─────────┐
 ┌──┴───┐   ┌────┴─────┐              ┌─ HMI VLAN ────────────────┐          │ site bridge（node）│
 │ unit │   │ T1 隔離   │              │ HMI ─▶ south 的 local view │          │ 只讀離線政策、快取 │
 │ 螢幕 │   │ switch/AP │              │ 或 n 實例（443 / 8883）     │          └──▲──────▲────────┘
 └──────┘   └──────────┘              └───────────────────────────┘             │ 443   │ 502 / 8883
                                                                              unit    T1 / PLC / HMI
 純一屏：unit 直連 B0，            無 device 到 ERP / DB 的路徑；             雲端永不向站點發起新連線；
 不需 south 盒。                   default deny。                              純屏 profile 可直連雲端 B0。
 T1 在原網不能搬線就是不支援。                                                敏感資料 + 強制 inspection = 不支援。
```

## 4. MQTT 在樹的哪裡

```
                      south bridge（有觸發的站點才有這一塊）
                      ┌──────────────────────────────────────────────┐
 MQTT T1 ──8883──▶    │ raw_1 實例 ─▶ subscriber ─▶ validator ─┐    │
 D-06 edge ctrl ─▶    │ raw_2 實例 ─▶ subscriber ─▶（來源綰 UID）│    │     HTTPS
 （每來源一個隔離      │    publish-only、不持久、資源上限           ├─▶ node ──443──▶ bridge 0
  的 raw feed）        │                                             │    │
                      │ 已驗證的 actual / meas ─▶ n 實例（curated   │    │
 HMI / SCADA ◀─8883── │   export，retained、QoS1）或 HTTPS local view│    │
                      └──────────────────────────────────────────────┘
 不在這裡的：unit → bridge（第一版 HTTPS）、bridge → B0、B0 → ERP、管理面、憑證。
 Sparkplug 只當 D-06 資料面方言：ingress 是 Host、egress 是 Edge Node；命令面不走它。
```

## 5. 每一層斷線時留什麼

```
 ERP 掛        bridge 0 鏡像照常服務 fetch；新 Manage 與新命令停；結果在 unit CQ 等 receipt
 bridge 0 掛   south 用最後一份鏡像；撤銷無法更新，離線最多吃完剩餘期限（cert 7 天、lease 300 秒）
 south 掛      unit 用 LKG 續播、採樣進 spool（48 小時 / 1 GiB）；HMI 投影停，畫面顯 stale
 unit 掛       backend 不自己上網；重啟後重讀 inbox 與 CQ，UNKNOWN 保鎖不重跑
 WAN 斷（c）   site bridge 只讀離線政策；HMI 預授權 reader 最多 8 小時；新命令等 WAN
```
