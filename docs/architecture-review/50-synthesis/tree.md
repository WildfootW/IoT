# 樹狀架構圖

> 2026-10-11，主審依 `final.md` §2、§3、§4、§5、§6、§9 畫；詞彙依 `03-brief.md` §9 的詞彙表（root node / branch / leaf / function；intake / projection；trust log；Type 1 / 2 / 3）。箭頭 `-->` 是新連線的發起方向，永遠由 child 撥向 parent；下行內容走 child 已開的連線回來。PCIe 對照只是幫助理解，不是實作要求。

## 1. 邏輯樹（與 PCIe 對照）

```
 PCIe 類比               我們的樹                                            持有什麼
 ──────────              ─────────────────────────────────────────────────    ─────────────────────────
 OS + 應用               ┌───────────────────────────────────────────────┐
                         │ Odoo ERP                                       │  desired、job queue、CMS、
                         │   Fleet / Manage / CMS UI；connector            │  結果 archive（業務真相）
                         └───────────────┬────────────────────────────────┘
                                         │ root node 讀 ERP queue、推 inbound（HTTPS）
 Root complex            ┌───────────────┴────────────────────────────────┐    ┌──────────────────────┐
 + bus driver            │ root node（node 的 root 角色）                   │◄──►│ trust log            │
                         │   registry 投影、issuer、watch API、recorder    │    │ trust authority 持有  │
                         └───────┬────────────────────────────┬───────────┘    │ 獨立故障域工作站      │
                                 ▲ 443                        ▲ 443             │ adopt/revoke/key/     │
 Switch                  ┌───────┴────────┐           ┌───────┴────────┐        │ policy/binding 決策   │
 （每個 VLAN 一個，       │ branch A       │           │ branch B       │        └──────────────────────┘
  可堆疊）               │ node，branch 角色│           │（第二層 branch  │
                         │ poller/intake/  │           │  也是同一支 node）│
                         │ validator/快取  │           └───────┬────────┘
                         └──┬─────┬─────┬──┘                   ▲ 443
                            ▲     ▲     ▲                       │
                          443   443   502/serial        ┌───────┴────────┐
 Endpoint             ┌─────┴─┐ ┌─┴─────┐  ┌──┴───────┐  │ leaf（螢幕）    │
 （Type 2 unit）      │ leaf  │ │ leaf  │  │ Type 1   │  │ 同時啟用 branch │
                      │ 螢幕  │ │ 感測盒│  │ meter    │  │ 角色，輪詢 Type 1│
                      └──┬────┘ └──┬────┘  └──────────┘  └───┬───────┬────┘
 Function             ┌──┴──┐    ┌─┴──┐                     ┌─┴──┐  ┌─┴──────┐
 （Bus:Dev.Function） │disp.0│    │env.0│                    │disp.0│  │stand-in│
                      └─────┘    └────┘                      └────┘  └────────┘
 PCIe-to-PCI bridge   Type 1 沒有 agent，由 branch 建 stand-in 代述，標低信任。

 Config space  = announce（serial、功能、class、schema、capability）
 DSN（永久）    = unit 的 serial 與裝置自產的 key（unit 是硬體身分，leaf 是它在樹上的角色）
 BDF（可變）    = adopt 時指派的 path，re-plug 會變；事實鍵用 unit/function，path 只是路由
 ACS / IOMMU   = branch 圍堵：Type 1 只到 poller 或 intake，永不直達 root node、ERP、DB
 Hot-plug      = leaf 以 bootstrap cert 撥入 → present, unadopted → Manage → 7 天營運 cert
```

## 2. 四個 plane 在樹上怎麼走

```
                     ERP            root node         branch          leaf           backend
 管理 / 身分   adopt 意圖 ─▶ trust log 交接 ─▶ 投影 ─────▶ cert、cfg ────▶ （無）
 （issuer 簽）                 revoke 60s ◀──────────────── 鏡像撤銷清單 ─────▶ 停新命令

 命令          desired/      ─▶ 鏡像 ─────────▶ 鏡像 ────────▶ inbox 落盤 ───▶ reconciler
 （ERP 版本、   job queue（簽章綰 unit/function/epoch/期限）                    先寫 result log 再上報
  leaf 持       結果 archive ◀─ receipt ◀────── receipt ◀─── result log、actual ◀── backend 結果
  result log）

 文件          CMS 版本 ─▶ pointer+hash ─▶ 快取 ─────────▶ 快取 ─────────▶ 驗 hash 後套用
 （pull）       （leaf 憑 parent grant 拉，不直連 ERP）                      LKG 可續播

 回傳資料      業務事件 ◀── recorder 寫 history PG ◀── spool ◀──── spool ◀──── 量測、狀態
 （ERP 只收     （門檻事件在資料 owner 節點算，                 receipt 後才釋放 spool
  事件）         ERP 只收 transition）

 連線方向：每一條 hop 都是右邊撥向左邊（child → parent，443）。下行內容走已開的連線。
 每一跳驗 parent 與 child；leaf 的原始簽章保留到 root node，中介不代簽 actual。
```

## 3. 三種部署形狀

```
 (a) 同一台主機                          (b) 同站不同 VLAN                      (c) 站點只出 443
 ┌─ hypervisor ───────────────────┐     ┌─ 管理 VLAN ────────────────┐          我們的雲
 │ root VM                        │     │ Odoo + PG + root node      │          ┌───────────────────┐
 │  Odoo + PG + root node + issuer│     └─────────▲──────────────────┘          │ Odoo + PG + root  │
 │                                │               │ 443                          │ node（多客戶各一組）│
 │ branch VM / UID                │     ┌─ IoT VLAN ─┴───────────────┐          └────────▲──────────┘
 │  poller + intake_i + validator │     │ branch（node）              │                   │ 443，可經核准 proxy
 │  只掛專用 NIC                  │     │  ▲ 443      ▲ 8883    ▲ 502│                   │ strict：mTLS
 └──▲────────────▲───────────────┘     │ leaf        MQTT Type 1 Type 1│                 │ inspected：owner 核准
    │ 443        │ 專用 NIC/VLAN       └─────────────────────────────┘          ┌────────┴──────────┐
 ┌──┴───┐   ┌────┴─────┐               ┌─ HMI VLAN ─────────────────┐          │ site branch（node） │
 │ leaf │   │ Type 1   │               │ HMI ─▶ branch 的 projection │          │ 只讀離線政策、快取  │
 │ 螢幕 │   │ 隔離     │               │ （443 或 8883）             │          └──▲──────▲─────────┘
 └──────┘   │ switch/AP│               └────────────────────────────┘             │ 443   │ 502 / 8883
            └──────────┘                                                         leaf    Type 1 / PLC / HMI
 純一屏：leaf 直連 root node，         無 device 到 ERP / DB 的路徑；             雲端永不向站點發起新連線；
 不需 branch 盒。                      default deny。                              純屏 profile 可直連雲端 root node。
 Type 1 在原網不能搬線就是不支援。                                                敏感資料 + 強制 inspection = 不支援。
```

## 4. MQTT 在樹的哪裡

```
                      branch（有觸發的站點才有這一塊）
                      ┌──────────────────────────────────────────────────┐
 MQTT Type 1 ─8883─▶  │ intake_1 ─▶ subscriber ─▶ validator ─┐          │
 D-06 edge ctrl ───▶  │ intake_2 ─▶ subscriber ─▶（來源綰 UID）│          │     HTTPS
 （每來源一個隔離      │    publish-only、不持久、資源上限       ├─▶ node ──443──▶ root node
  的 intake 實例）     │                                        │          │
                      │ 已驚證的 actual / meas ─▶ projection    │          │
 HMI / SCADA ◀─8883── │   （curated MQTT export，retained、QoS1，│          │
            或 443    │    或 HTTPS projection）                 │          │
                      └──────────────────────────────────────────────────┘
 不在這裡的：leaf → branch（第一版 HTTPS）、branch → root node、root node → ERP、管理面、憑證。
 Sparkplug 只當 D-06 資料面方言：intake 側是 Host、projection 側是 Edge Node；命令面不走它。
```

## 5. 每一層斷線時留什麼

```
 ERP 掛          root node 鏡像照常服務 fetch；新 Manage 與新命令停；結果在 leaf 的 result log 等 receipt
 root node 掛    branch 用最後一份鏡像；撤銷無法更新，離線最多吃完剩餘期限（cert 7 天、lease 300 秒）
 branch 掛       leaf 用 LKG 續播、採樣進 spool（48 小時 / 1 GiB）；projection 停，畫面顯 stale
 leaf 掛         backend 不自己上網；重啟後重讀 inbox 與 result log，UNKNOWN 保鎖不重跑
 WAN 斷（c）     site branch 只讀離線政策；HMI 預授權 reader 最多 8 小時；新命令等 WAN
```
