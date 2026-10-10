# 事實查核：連線要穿過什麼樣的網路，哪些傳輸活得下來

查證日期：2026-10-10（事實表「查證日期」欄一律為此日）。查證者：波次 A 研究員（Sonnet）。

## 0. 證據等級與查證環境（先看這段）

本次環境只能直接抓到 GitHub raw 與 pkg.go.dev；docs.aws.amazon.com、nginx.org、developers.cloudflare.com、tailscale.com、各防火牆廠商站台、RFC 站台、endoflife.date 皆 DNS 解析失敗，無法直接讀原文。因此每條事實標一個等級：

- **[原文]**：我在本次直接讀到的原始檔（多為廠商公開在 GitHub 的文件原始碼或程式碼）。
- **[摘要]**：只有 WebSearch 回傳的摘要，官方頁面本身沒能打開。URL 是搜尋結果所列的官方位置，內容未經我逐字核對。
- **[二手]**：論壇、部落格、廠商行銷文、mailing list 引述。只能當線索。

「廠商 TLS 攔截產品如何處理 client cert」這一塊全部是 [摘要]，沒有一條是 [原文]，這是本文件最大的證據缺口（見 §4）。

## 1. 結論先講

1. **TLS 檢查 / 終結 proxy 與 client cert 互斥。** 三家主流廠商（Palo Alto、Zscaler、Fortinet）的文件摘要都指出：做 TLS 攔截的 proxy 無法替 client 完成 mutual TLS，要不就整條 bypass 不檢查（cert 保留、但 proxy 看不到內容），要不就攔截（client cert 不會被轉給 origin，握手失敗）（T1～T3，均為 [摘要]）。原理清楚：proxy 沒有 client 的私鑰，只能用自己的身分重新發起 TLS；origin 最多從 header 得知「proxy 看到過這張 cert」，信任已轉移給 proxy（T5，[原文]）。
2. 所以在第 (c) 種形狀（M-03、F-41：站點只有 outbound）裡，**「每一跳 mTLS」（N-02）在客戶有 TLS 檢查 proxy 時只有兩個結局：被客戶 IT 加 bypass 規則，或失敗。** 這不是我們能靠協定設計繞過的；能做的是設計一條「mTLS 失敗時仍安全」的退路（應用層簽章 / token 綁身分），這是意見，不是事實。
3. **Idle timeout 的主流預設落在 60 秒附近**：nginx proxy_read_timeout 60s（T7，[原文]）、AWS ALB 60s（T8，[摘要]）、Cloudflare Proxy Read 125s / Idle 900s（T9，[原文]）、防火牆 session 預設約 3600s（T11，[摘要]/[二手]）。**掛起時間 < 55 秒的 long-poll 在所有這些預設下都過得去；持久連線（WebSocket / MQTT / NATS）必須自己送應用層 keepalive，且間隔要小於路徑上最小的 idle timeout。** NATS server 預設 ping_interval 是 2 分鐘（T16，[原文]），比 60 秒預設還長，直接用預設穿過 60s 的 LB 會被切（推論，非實測）。
4. **MQTT 8883 被擋時，MQTT over WSS 443 是業界做法**：Azure IoT Hub 文件明講（T15，[摘要]）、AWS IoT Core 同時提供 WSS 與 ALPN 兩條 443 路徑（T15，[摘要]）。但它是 HTTP Upgrade，**仍然要通過客戶 proxy 的檢查與 idle timeout，而且 mosquitto 的舊 libwebsockets WS listener 只提供縮減的 TLS 選項，不含 require_certificate（T14，[原文]）。**「MQTT 在 443 上可行」成立，「MQTT 在 443 上做 mTLS 身分」不是免費的。
5. **NAT mapping 時間差很大**：RFC 4787 要求 UDP ≥ 2 分鐘、建議 5 分鐘（T17，[摘要]）；Linux conntrack 預設 UDP 30 秒、UDP stream 120 秒、TCP established 5 天（T18，[原文]）；Azure NAT Gateway UDP 固定 4 分鐘（T19，[摘要]）。WireGuard 預設不送 keepalive，文件示例是 25 秒（T20，[原文]）。**UDP 型傳輸（WireGuard、Nebula、ZeroTier）要自己負擔 keepalive，TCP 型傳輸在 NAT 這一關通常更寬容。**
6. **Overlay 當「樹」的替代**：WireGuard 本身沒有「樹」概念，但 peer 清單 + AllowedIPs 天然就是「child 只認得 parent」（T20，[原文]）；它**只有 UDP，沒有 TCP / 443 模式**（T21，[二手]），在只放 443 的網路裡它不能單獨存活。Tailscale 的解法是 DERP-over-HTTPS（T22，[原文]），但 control plane 是 SaaS，自架要用 Headscale（BSD-3，單一 tailnet，pre-1.0，T23，[原文]）。Nebula 是 MIT（T25，[原文]），純 UDP，relay 在範例設定裡標 EXPERIMENTAL。ZeroTier 的 controller 在 source-available 授權下，**任何 for-profit 的商用都要付費授權**（T26，[原文]），與 M-05 直接衝突。
7. **共享 PSK 的風險是真的，且比「沒有 isolation」更糟**：WPA2-PSK 下，知道 PSK 的人只要抓到某 client 的 4-way handshake 就能解密該 client 的流量（T27，[摘要]）。所以在 C-25 的現場，Wi-Fi 層不提供任何對 insider 的保密，**N-02 的 hop-by-hop 加密必須完全靠 TLS 層，不能指望 Wi-Fi**。Client isolation 只擋同 SSID/同 broadcast domain 的 peer，不擋跨 VLAN 或有線（T28，[摘要]），要靠 VLAN + inter-VLAN 防火牆補。
8. **對「哪個傳輸活得下來」的最短答案**（詳見 §5）：HTTPS long-poll 最耐活（連 TLS 攔截 proxy 都過，但 mTLS 會被迫換成應用層身分）；MQTT over WSS 443 次之（要過 Upgrade 與 idle timeout）；MQTT/TLS 8883 在「只放 443」的客戶端會直接死；NATS leaf 在 7422 同樣會死，改走 WebSocket 443 才有機會，但 HTTP proxy CONNECT 與 TLS 攔截下的行為我們沒查到；WireGuard 單獨用在這個形狀最不可靠。**沒有任何一個來源提供「存活率」的量化數字；§5 的高 / 中 / 低是我依上述事實做的推論（意見）。**

## 2. 事實表

等級標記見 §0。「相關需求」欄不放進表以保持三欄，對照見 §3。

### 2.1 TLS 檢查與 client cert

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| T1 | [摘要] Palo Alto Networks：SSL Forward Proxy 解密無法處理部分 session，例如使用 client authentication 或 certificate pinning 的連線，原因是「firewall is a proxy device」。其 KB 文章指出 forward proxy decryption 不支援 mutual authentication，因為 server 要求 client 在握手中出示 cert，而防火牆沒有 client 的私鑰與憑證。實務上 mTLS 流量需列入 no-decrypt 規則。本環境無法開啟原文。 | https://live.paloaltonetworks.com/t5/Learning-Articles/Limitations-and-Recommendations-While-Implementing-SSL/ta-p/60036 ；https://docs.paloaltonetworks.com/pan-os/9-1/pan-os-admin/decryption/decryption-concepts/ssl-forward-proxy.html | 2026-10-10 |
| T2 | [摘要] Zscaler：SSL inspection 概述頁表示不處理需要 mutual TLS 的網站；部署指南建議把使用 client cert 驗證的 session 加入 SSL inspection 的 bypass 清單，因為 Zscaler 無法解密 mutually authenticated TLS。另有 Twingate、Revvity 的第三方說明同樣以 bypass 處理。 | https://help.zscaler.com/zia/about-ssl-inspection ；https://help.zscaler.com/zia/deploying-ssl-inspection | 2026-10-10 |
| T3 | [摘要] Fortinet：FortiGate 的 SSL/SSH profile 對「server 要求 client cert」有三種處理：bypass（該 session 免 deep inspection，client cert 原樣傳給 server）、inspect（做 deep inspection，但**不把 client cert 送給 server**，可能導致 SSL/TLS 協商問題與連線中斷）、block（出示 client cert 就丟棄）。同一文章表示 FortiOS 不支援在 deep inspection 設定下重簽 client cert。文章為 Fortinet Community 技術小技巧，日期約 2022-11（摘要所述，未核對原頁）。 | https://community.fortinet.com/fortigate-3/technical-tip-how-fortigate-performs-deep-inspection-of-the-ssl-tls-communication-between-a-client-and-server-when-client-certificate-authentication-is-required-by-the-server-118148 | 2026-10-10 |
| T4 | [二手] Squid SslBump：2015 年 squid-users 串中，開發者回覆當時的 SslBump 不支援 client cert 檢查，原因是 client cert 在握手較後段、server cert 之後才送出；2022 年另一串指出 bump 需要有一個 TLS server 可接解密後的流量。資料老（2015、2022），不代表現行版本。 | https://ml-archives.squid-cache.org/squid-users/2015-October/006156.html ；https://ml-archives.squid-cache.org//squid-users/2022-November/025375.html | 2026-10-10 |
| T5 | [原文] 終結 TLS 的 proxy 要把 client cert 資訊交給後端，只能以 header 形式：Envoy 文件的 `x-forwarded-client-cert`（XFCC）「indicates certificate information of part or all of the clients or proxies that a request has flowed through」，可含 Hash、Cert、Chain、Subject、URI、DNS、Issuer；「A proxy may choose to sanitize/append/forward the XFCC header」。含意：後端看到的是 proxy 的轉述而不是 TLS 層的驗證，信任邊界移到 proxy。AWS ALB 的 mTLS passthrough 模式同理，以 `X-Amzn-Mtls-Clientcert` header 傳整條憑證鏈（URL-encoded PEM），verify 模式則傳拆開的欄位 header，且兩種模式都不支援 session resumption（後者 [摘要]）。 | https://raw.githubusercontent.com/envoyproxy/envoy/main/docs/root/configuration/http/http_conn_man/headers.rst ；https://aws.amazon.com/blogs/networking-and-content-delivery/introducing-mtls-for-application-load-balancer/ | 2026-10-10 |
| T6 | [原文] Tailscale 客戶端程式碼承認並偵測企業 TLS 攔截：`tlsdial.go` 在驗證失敗時，若憑證長得像「a well-known network appliance manufacturer」的 MITM 憑證，會設定健康警告 `blockblame-mitm-detected`，log 寫「could be blocking Tailscale」；自簽發行者則報「likely intercepted connection」。`derphttp_client.go` 的註解寫：「If a corporate proxy is MITM'ing TLS 1.3 connections with corp-mandated TLS root certs than all bets are off anyway.」意義：一個專門穿越任意網路的產品也把 TLS 攔截視為無法完全解的問題，只做偵測與告警。 | https://raw.githubusercontent.com/tailscale/tailscale/main/net/tlsdial/tlsdial.go ；https://raw.githubusercontent.com/tailscale/tailscale/main/derp/derphttp/derphttp_client.go | 2026-10-10 |

### 2.2 Idle timeout 與長連線穿越

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| T7 | [原文] nginx：`proxy_read_timeout` 預設 60s；「The timeout is set only between two successive read operations, not for the transmission of the whole response. If the proxied server does not transmit anything within this time, the connection is closed.」原始碼 `ngx_http_proxy_module.c` 中 connect / send / read timeout 的預設皆 60000 ms。nginx 的 WebSocket 文件：「By default, the connection will be closed if the proxied server does not transmit any data within 60 seconds」，可調 proxy_read_timeout，或讓後端定期送 WebSocket ping frame；另指出 `Upgrade` / `Connection` 是 hop-by-hop header，必須明確設定才會傳給後端。 | https://raw.githubusercontent.com/nginx/nginx.org/master/xml/en/docs/http/ngx_http_proxy_module.xml ；https://raw.githubusercontent.com/nginx/nginx.org/master/xml/en/docs/http/websocket.xml ；https://raw.githubusercontent.com/nginx/nginx/master/src/http/modules/ngx_http_proxy_module.c | 2026-10-10 |
| T8 | [摘要] AWS：ALB 的 idle timeout 預設 60 秒，可設 1～4000 秒（屬性 `idle_timeout.timeout_seconds`）；AWS 建議應用層 idle timeout 大於 LB 的，否則 LB 可能回 502。NLB 的 TCP idle timeout 預設 350 秒，可設 60～6000 秒；摘要同時提到 TLS listener 的 350 秒不可改，兩處說法不一致，待核對。NLB 可用 TCP keepalive 重置計時，但承載 TLS 的 keepalive 封包不可帶資料。 | https://docs.aws.amazon.com/elasticloadbalancing/latest/application/edit-load-balancer-attributes.html ；https://docs.aws.amazon.com/elasticloadbalancing/latest/network/network-load-balancers.html | 2026-10-10 |
| T9 | [原文] Cloudflare（文件原始碼，production 分支）：client 到 Cloudflare 之間 HTTP/1.1 keep-alive 與 HTTP/2 idle 皆 400 秒、不可設；Cloudflare 到 origin 之間 Proxy Idle Timeout 900 秒、**Proxy Read Timeout 125 秒**（Enterprise zone 可調，最高 6000 秒）、Proxy Write Timeout 30 秒、TCP keep-alive interval 30 秒；超過 read timeout 回 524。WebSocket 文件：「Cloudflare will close a WebSocket connection when no data is transmitted in either direction for a period of time」，數值未寫，Enterprise 可請 account team 設定，建議 client 端 heartbeat。注意：搜尋摘要與多篇部落格寫的是「100 秒」，與現行文件原始碼的 125 秒不一致，**此值會變，不要寫死**。 | https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/fundamentals/reference/connection-limits.mdx ；https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/error-524.mdx ；https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/network/websockets.mdx | 2026-10-10 |
| T10 | [原文] HAProxy：`timeout tunnel` 是「maximum inactivity time on the client and server side for tunnels」；HTTP 連線被 upgrade（例如 WebSocket）或轉發 CONNECT 時，該 timeout 取代 client 與 server timeout；文件建議同時設 `timeout client-fin`，因為「a client suddenly disappears from the net」在「lossy networks where firewalls are present」會留下大量 FIN_WAIT session。含意：同一個 proxy 對一般 HTTP 與對已升級的 WebSocket 用不同計時器，預設值未在此段給出。 | https://raw.githubusercontent.com/haproxy/haproxy/master/doc/configuration.txt （章節 `timeout tunnel`） | 2026-10-10 |
| T11 | [摘要]/[二手] 防火牆 session 預設：Fortinet 技術文章稱 FortiGate `session-ttl` 預設 3600 秒（範圍的說法在不同文章不一致：300–604800 與 300–2764800），可依 service / policy / 全域覆寫；TCP half-close 計時預設 120 秒（可能因版本而異）。Palo Alto 的 TCP session 預設 3600 秒只有社群論壇貼出的 `show session info` 輸出，**沒有找到官方文件**，列為弱證據。含意：防火牆的 idle 預設比 LB 與 proxy 長得多，真正卡住長連線的通常是路徑上最短的那個 proxy 或 LB，不是防火牆。 | https://community.fortinet.com/fortigate-3/technical-tip-default-session-timeout-value-session-ttl-96414 ；https://live.paloaltonetworks.com/t5/Featured-Articles/Tips-amp-Tricks-Session-Timeouts/ta-p/68464 | 2026-10-10 |
| T12 | [摘要] nginx HTTP/2：變更紀錄顯示 `http2_idle_timeout` 與 `http2_max_requests` 被移除，改用 `keepalive_timeout` 與 `keepalive_requests`，HTTP/2 預設 keepalive 由 300 秒改為 75 秒；後續變更使 PING 等 frame 不再延長 keepalive 時間。gRPC 文件：client keepalive 預設關閉，server 預設 2 小時，ping-ack timeout 20 秒，server 預設拒絕間隔小於 5 分鐘的無資料 ping。注意 keepalive_timeout 是「請求之間的閒置」，是否會切斷進行中的長 stream 是摘要作者的推論，不是來源所述。 | https://freenginx.org/hg/nginx/rev/b64f553b1291 ；https://grpc.io/docs/guides/keepalive/ | 2026-10-10 |
| T13 | [二手] SSE 穿越 proxy：多篇部落格與 Kong 文件指出，nginx 預設 buffering 會讓 SSE 事件被攢在 buffer 裡（需 `proxy_buffering off` 或回應 header `X-Accel-Buffering: no`）、舊版 nginx 以 HTTP/1.0 對上游（需 `proxy_http_version 1.1`）、60 秒讀取 timeout 會砍掉沒有事件的串流（需心跳註解行）、壓縮中介層可能吞掉 frame。這些是 nginx 側的行為；**客戶端的正向 proxy（含防毒 / ICAP 型）是否緩衝整個回應，沒有查到任何文件**。Zscaler 的行銷文章稱 ZIA 可即時檢查並解密 WebSocket 流量（廠商宣稱，無設定細節）。 | https://developer.konghq.com/support/how-can-i-use-kong-to-allow-sse-server-sent-events/ ；https://www.zscaler.com/blogs/product-insights/securing-ai-communication-protocols-websocket-zia | 2026-10-10 |

### 2.3 MQTT 在 443 與長連線 keepalive

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| T14 | [原文]+[摘要] Mosquitto 的 listener 可設 `protocol websockets`（「MQTT tunnelled over WebSockets」）；**使用舊的 libwebsockets 支援時，「only a reduced TLS feature set is available, namely cafile, certfile, keyfile, ciphers, and ciphers_tls1.3」**，清單中沒有 require_certificate 等 client cert 驗證選項（man page 另在別處為一般 listener 說明 require_certificate）。man page 用「legacy」一詞，暗示有非 libwebsockets 的實作，其 TLS 選項是否完整**未查證**。另：websockets listener 的 `listener` 位址參數只接受 IP；也可搭配 `enable_proxy_protocol`（PROXY v1/v2）放在 HAProxy 後面，此時 listener 不可自己設 TLS，且 `use_subject_as_username` 不能用。MQTT 規格（OASIS 3.1.1 §6）：client MUST 在 WebSocket subprotocol 清單帶 `mqtt`，control packet 用 binary frame（轉述自 Solace 的規格副本，非 OASIS 原頁）。 | https://raw.githubusercontent.com/eclipse-mosquitto/mosquitto/master/man/mosquitto.conf.5.xml ；https://docs.solace.com/API/MQTT-311-Prtl-Conformance-Spec/Using-WebSocket-as-a-network.htm | 2026-10-10 |
| T15 | [摘要] 雲端 IoT 的做法：Azure IoT Hub 文件列 MQTT 8883、MQTT over WebSockets 443，並寫「many corporate and educational firewalls block the MQTT port (TCP port 8883)」、「port 443 is almost always open」，建議擋 8883 時改用 MQTT over WebSockets。AWS IoT Core 的 port 443 同時有「MQTT over WebSocket」（SigV4 或 custom authentication）與「MQTT + X.509 client cert」（需 client 在 ClientHello 送 ALPN `x-amzn-mqtt-ca`）；8883 仍為標準 MQTT over TLS。含意：業界解法就是「把 MQTT 搬到 443」，而且 X.509 版本需要 client 能控制 ALPN，這在 TLS 攔截 proxy 後是否成立未查證。 | https://learn.microsoft.com/azure/iot-hub/iot-hub-devguide-protocols ；https://docs.aws.amazon.com/iot/latest/developerguide/protocols.html | 2026-10-10 |
| T16 | [原文] 預設 keepalive：mosquitto 客戶端工具 `-k` 預設 60 秒（「Defaults to 60 seconds」）。NATS server 設定 `ping_interval` 預設 `2m`，`ping_max` 預設 2；文件說明「In the presence of client traffic ... the server will not send pings」，建議此值大於 client 自己用的 ping 間隔。NATS leaf 連線可用 `ws://` 出站（自 2.2.0），是否為 TLS 由設定區塊有無 tls 決定而非 URL scheme。推論（非實測）：以預設值穿過 60 秒 idle 的 nginx / ALB，NATS 的 2 分鐘 ping 太慢；MQTT 的 60 秒 keepalive 恰在邊緣（第 61 秒才送），實務上要把 keepalive 設到 ≤ 30 秒。 | https://raw.githubusercontent.com/eclipse-mosquitto/mosquitto/master/man/common/option-keepalive.xml ；https://raw.githubusercontent.com/nats-io/nats.docs/master/running-a-nats-service/configuration/README.md ；https://raw.githubusercontent.com/nats-io/nats.docs/master/running-a-nats-service/configuration/leafnodes/leafnode_conf.md | 2026-10-10 |

### 2.4 NAT mapping

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| T17 | [摘要] RFC 4787（UDP NAT）REQ-5：UDP mapping timer 不得少於 2 分鐘（僅限 well-known port 且嚴格 request/response 的協定如 DNS 可更短），預設建議 5 分鐘，可設定。RFC 5382（TCP NAT）REQ-5：NAT 若無法判斷端點是否仍存活而放棄閒置連線，established 連線 idle timeout 不得少於 2 小時 4 分鐘（引述自 IETF 郵件列表，另有 NAT 廠商文件以 7440 秒為預設）。RFC 7857 更新兩者的部分要求。這是「規格要求」，不代表現場設備遵守；本環境無法開啟 RFC 原文。 | https://datatracker.ietf.org/doc/html/rfc4787 ；https://www.mhonarc.org/archive/html/ietf/2010-01/msg00205.html ；https://rfc-archive.org/getrfc?rfc=7857 | 2026-10-10 |
| T18 | [原文] Linux kernel conntrack 預設（常見的軟體 NAT / 路由器基礎）：`nf_conntrack_udp_timeout` 30 秒、`nf_conntrack_udp_timeout_stream` 120 秒（偵測到 UDP stream 時採用）、`nf_conntrack_tcp_timeout_established` 432000 秒（5 天）。含意：同一台 Linux NAT 上，雙向 UDP 流量 120 秒無封包就掉 mapping，TCP 則可放 5 天，兩者差兩個數量級。 | https://raw.githubusercontent.com/torvalds/linux/master/Documentation/networking/nf_conntrack-sysctl.rst | 2026-10-10 |
| T19 | [摘要] Azure NAT Gateway：TCP idle timeout 可設 4～120 分鐘，UDP idle timeout 固定 4 分鐘不可改；Microsoft 建議不要把 TCP timeout 調得比預設長，以免 SNAT port 耗盡。AWS NAT Gateway 的 350 秒僅見於一則 GitHub issue，列為弱證據，未納入判斷。 | https://docs.azure.cn/en-us/nat-gateway/nat-gateway-resource | 2026-10-10 |

### 2.5 Overlay 網路

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| T20 | [原文] WireGuard 授權與 keepalive：wireguard-tools 的 `COPYING` 是 GNU GPL v2；wireguard-go 的 `LICENSE` 是 MIT（kernel module 授權未直接查證）。`wg(8)`：`PersistentKeepalive` 是「how often to send an authenticated empty packet to the peer for the purpose of keeping a stateful firewall or NAT mapping valid」，範圍 1～65535 秒，示例 25 秒，「By default ... this option is off」。`AllowedIPs` 是「from which incoming traffic for this peer is allowed and to which outgoing traffic for this peer is directed」，也就是每個 peer 只收發自己清單內的位址（cryptokey routing）；一個節點的設定檔只列 parent 為唯一 peer，就等於「只看得到 parent」。 | https://raw.githubusercontent.com/WireGuard/wireguard-tools/master/src/man/wg.8 ；https://raw.githubusercontent.com/WireGuard/wireguard-tools/master/COPYING ；https://raw.githubusercontent.com/WireGuard/wireguard-go/master/LICENSE | 2026-10-10 |
| T21 | [二手] WireGuard 只走 UDP：官方 known-limitations 頁的內容被引述為「explicitly does not support tunneling over TCP」（原頁無法開啟）；作者在郵件列表說明它是 layer 3 隧道，「Yes it uses UDP and no it won't use TCP」，但隧道內的應用仍可用 TCP。eduVPN 部落格稱某些網路只放行 TCP 因此封鎖 WireGuard，並介紹其 ProxyGuard（把 WireGuard 包進 HTTP(S)）。含意：純 WireGuard 在「只放 443/TCP」的網路裡不能用；包 TCP 的外掛不屬 WireGuard 本身。 | https://lists.zx2c4.com/pipermail/wireguard/2017-January/000942.html ；https://www.eduvpn.org/?p=1424 | 2026-10-10 |
| T22 | [原文]+[摘要] Tailscale 的 DERP：`derper` README 說 DERP 是低頻寬的 NAT traversal 輔助通道與 relay，防火牆要放 TCP 443 與 80、UDP 3478（STUN）；**DERP 是「HTTP inside TLS，然後切換成自訂二進位協定」，與許多 HTTP proxy 不相容，不要把 derper 放在 proxy 後面**；沒有 plaintext 模式。客戶端 `derphttp_client.go` 有以 HTTP CONNECT 走環境變數指定的 proxy 的程式碼（`dialNodeUsingProxy`）。官方文件摘要：直連 UDP 被擋時退回 DERP（HTTPS 443），建議放行 outbound *:443，並盡量放行 UDP 41641 以得到直連。授權：tailscale 倉庫（含 tailscaled 與 DERP 實作）為 BSD-3-Clause；倉庫 README 說明此倉庫是「majority of Tailscale's open source code」，GUI 與 control plane 不在其中。 | https://raw.githubusercontent.com/tailscale/tailscale/main/cmd/derper/README.md ；https://raw.githubusercontent.com/tailscale/tailscale/main/derp/derphttp/derphttp_client.go ；https://raw.githubusercontent.com/tailscale/tailscale/main/LICENSE ；https://tailscale.com/docs/reference/connection-types | 2026-10-10 |
| T23 | [原文] Headscale：授權 BSD-3-Clause（Copyright 2020 Juan Font）。README 自述為「open source, self-hosted implementation of the Tailscale control server」，範圍「a _single_ Tailscale network (tailnet), suitable for a personal use, or a small open-source organisation」；與 Tailscale Inc. 無關，但一位活躍 maintainer 受雇於 Tailscale 並被允許在工時貢獻。README：「we do not support nor encourage the use of reverse proxies and container to run Headscale」。CHANGELOG 頂部：0.30.0 與 0.29.5 日期為占位（`202x-xx-xx`），最新有日期的是 **0.29.4（2026-09-23）**，其前為 0.29.3（2026-07-29）、0.29.2（2026-07-01）、0.29.1（2026-06-18）；版本仍是 0.x。 | https://raw.githubusercontent.com/juanfont/headscale/main/LICENSE ；https://raw.githubusercontent.com/juanfont/headscale/main/README.md ；https://raw.githubusercontent.com/juanfont/headscale/main/CHANGELOG.md | 2026-10-10 |
| T24 | [原文] Headscale 的存取控制：沿用 Tailscale 的 huJSON policy 檔，支援 ACL 與 Grants（推薦 Grants，ACL 被稱為 legacy）；**沒有載入 policy 時預設 allow all**，要 deny all 需明確寫空的 `grants: []`；範例中以 `src` / `dst` / `ip`（埠）表達規則，支援 tag 與 autogroup；不支援 device posture 與 IP sets，autogroup 只有子集。內建 embedded DERP，並用 STUN（udp/3478）。含意：「child 只能連 parent:port」可用 tag + grant 表達，但**預設是全通，必須把 policy 當成必要設定**。 | https://raw.githubusercontent.com/juanfont/headscale/main/docs/ref/policy.md ；https://raw.githubusercontent.com/juanfont/headscale/main/docs/ref/derp.md | 2026-10-10 |
| T25 | [原文] Nebula：授權 MIT（Copyright 2018-2019 Slack Technologies）；pkg.go.dev 顯示模組 v1.11.2，發布於 2026-09-21（該頁註明 v1.11.2 並非該模組最新版，故 v1.11.2 之後仍有更新）；CHANGELOG 頂部已發布版為 1.11.1（2026-08-21）、1.11.0（2026-07-23）。README：身分由憑證斷言（IP、name、group 成員），「user-defined groups allow for provider agnostic traffic filtering between nodes」，防火牆規則可依 group / host / cidr / ca 比對；預設通訊埠 udp/4242，節點需能到達 lighthouse；peer 以 UDP hole punching 建連。範例設定：`relay` 區塊標註「EXPERIMENTAL: relay support for networks that can't establish direct connections」；`pki.blocklist` 是憑證指紋清單（撤銷機制為手動維護設定）；防火牆不符規則時預設動作 `drop`。官方文件與 README 中**沒有看到 TCP / 443 fallback**（未查證是否存在於他處）。 | https://raw.githubusercontent.com/slackhq/nebula/master/README.md ；https://raw.githubusercontent.com/slackhq/nebula/master/LICENSE ；https://raw.githubusercontent.com/slackhq/nebula/master/CHANGELOG.md ；https://raw.githubusercontent.com/slackhq/nebula/master/examples/config.yml ；https://pkg.go.dev/github.com/slackhq/nebula | 2026-10-10 |
| T26 | [原文] ZeroTier：倉庫 README 的授權段：`node/`、`osdep/`、`service/` 與其他（`ext/` 與 `nonfree/` 除外）在 LICENSE-MPL.txt（MPL）下；`nonfree/` 為 source-available。`nonfree/LICENSE.md`（Copyright 2025 ZeroTier, Inc.）：「ZeroTier SOURCE-AVAILABLE LICENSE」，**network controller 位在 `nonfree/`**（controller README 稱它「almost the same as the one we use to power our own hosted services」），「Use of any of these components for Commercial Use requires a separate commercial license agreement」。其「Commercial Use」定義含：for-profit 公司的任何使用、政府或非營利組織的使用、「Use in a production, staging, or development environment for business purposes」、「Offering paid or unpaid services powered by the Software」、整合進任何付費或免費的產品 / 平台 / 服務。非商用僅限個人、學生研究、不超過 30 天的評估。含意：我們若自架 controller 服務客戶站點，落在 M-05 要避免的範疇。本機未查證 ZeroTier 是否有 TCP fallback。 | https://raw.githubusercontent.com/zerotier/ZeroTierOne/dev/LICENSE.txt ；https://raw.githubusercontent.com/zerotier/ZeroTierOne/dev/nonfree/LICENSE.md ；https://raw.githubusercontent.com/zerotier/ZeroTierOne/dev/nonfree/controller/README.md | 2026-10-10 |
| T26b | [原文] 順帶一條（你沒點名但同類）：NetBird 倉庫以 BSD-3-Clause 為主（Copyright NetBird GmbH & AUTHORS 2022），但 `management/`、`signal/`、`relay/`、`combined/` 目錄為 AGPLv3。自架 control plane 的部分正好落在 AGPL。 | https://raw.githubusercontent.com/netbirdio/netbird/main/LICENSE | 2026-10-10 |

### 2.6 Wi-Fi 與 VLAN 圍堵

| # | 事實 | 來源 URL | 查證日期 |
|---|---|---|---|
| T27 | [摘要] WPA2-PSK 共享金鑰的風險：4-way handshake 的金鑰直接由 PSK（經 PMK）導出，被動抓到 handshake 加上密碼即可離線猜密碼，或事後解密該次 session 的流量；WPA3-SAE 被描述為抗離線字典攻擊並具 forward secrecy。Wireshark 官方文件（802.11 解密金鑰）說明：解密需要抓到完整 4-way EAPOL handshake，且要強迫目標機器重新加入網路；PMK 方式「only work for packets between that client and access point」（該句出現在 WPA3 段）。**沒有任何一個來源逐字寫出「同一 PSK 的任一使用者可解密其他人的流量」，這是由金鑰導出方式推得的結論**。 | https://www.wireshark.org/docs/wsug_html_chunked/Ch80211Keys.html ；https://securew2.com/blog/wpa3-the-ultimate-guide | 2026-10-10 |
| T28 | [摘要] Client isolation 的範圍：Meraki 文件摘要：isolation 後 client 只能與 default gateway 通訊、不能與同 VLAN（broadcast domain）的其他裝置通訊，但「Traffic bound for other VLANs will be forwarded and routed normally」，要擋需上游 ACL 或 inter-VLAN 防火牆。Cisco 9800 FlexConnect local switching 下 P2P blocking 只作用於同一 AP 下的 client，不跨 AP。 | https://documentation.meraki.com/MR/Operate_and_Maintain/How_Tos/Firewall_and_Traffic_Shaping/Wireless_Client_Isolation ；https://community.cisco.com/t5/wireless/flexconnect-local-switching-peer-to-peer-isolation/m-p/5233275/highlight/true | 2026-10-10 |
| T29 | [二手] 每裝置 PSK：廠商名稱不同（Meraki / Cisco 的 iPSK 搭 RADIUS、Aruba 的 MPSK、Ruckus 的 DPSK），AP 把 client MAC 與 PSK hint 送給 RADIUS，由 RADIUS 回傳該裝置的 key，之後才做 4-way handshake；Aruba 可用 ClearPass 做動態 VLAN 與角色。以上來自第三方整理頁（purple.ai），非各廠商文件。hostapd 的「每個 passphrase 對應一個 VLAN」（`wpa_psk_file` 的 `vlanid=`）在搜尋結果中來自 patch 系列與 OpenWrt 論壇，**未確認已進入上游 hostapd 發行版**；同一討論指出 client isolation 是 per-BSS 設定，同 SSID 無法部分 VLAN 隔離、部分不隔離。 | https://www.purple.ai/en-us/guides/per-device-psk-by-vendor-wpa3-support ；https://forum.openwrt.org/t/individual-per-passphrase-per-mac-wifi-vlans-using-wpa-psk-file-no-radius-required/161696?page=3 | 2026-10-10 |
| T30 | [二手] 分段原則：EPA 水務業自評清單要求 OT 與 IT 網路之間預設拒絕、只明確放行指定 IP 與 port，並經由有紀錄的中介（防火牆、堡壘機、DMZ），並指向 NIST SP 800-82 Rev.3 的第 5、6 節與附錄 E；IEC 62443 的 zone / conduit 概念（資產群組與其間的邏輯通道）。**NIST 原文與 IEC 62443 原文本次都沒讀到**，這條只能當方向，不能當「標準規定」。 | https://www.epa.gov/system/files/documents/2024-07/segment-ot-and-it.pdf ；https://csrc.nist.gov/pubs/sp/800/82/r3/final | 2026-10-10 |

## 3. 與我們情境的關係

對照 03-brief.md §1 的錨點。以下「推論 / 意見」不是事實，是用上面的事實推出來的。

### 3.1 錨點 3（第 (c) 種形狀）與 F-41、F-21、C-12

- F-41（站點無 inbound、outbound-only、site-scoped credential）是對的方向，且被事實支持：所有可行傳輸都是 outbound 發起的 TCP 或 UDP，沒有一個需要打洞進站點。F-21 / C-12 的「identity is never an address」同理成立。P0 在這一點成立。
- 但「outbound-only」不等於「穿得過去」。客戶若有 TLS 檢查 proxy，結論是 T1～T3：**每一跳 mTLS（N-02）在這條邊上不成立**，除非客戶 IT 對我們的 FQDN 設 bypass。這跟 P0 §4「bridge 終結 TLS 再以自己身分重新發起」是兩回事：P0 的終結發生在我們自己的 bridge，client cert 仍然有意義；客戶 proxy 的終結發生在我們不控制的地方，client cert 對 cloud 端 bridge 0 根本到不了（T5）。
- 意見：cloud 形狀的 site→cloud 邊要把「身分」從 TLS 層上移一層（例如：請求本體或 WebSocket 握手後第一個訊息帶有 site 私鑰簽章的 nonce / 時間戳；或短效 token 綁 site 公鑰），mTLS 作為「有 bypass 時的加強」而不是唯一防線。這個設計與 P0 第 5 點「T3 加端到端簽章」同方向，但要提前到 site↔cloud 邊，而不只是 T3。成本是一份自己維護的簽章格式（M-02），要由 PKI 審查（P0 §3 第 5 項）一併涵蓋。
- 意見：LB 在我們自己營運的 cloud 端，也同樣終結 TLS（T5：ALB mTLS 以 header 轉述 cert）。所以即使客戶端沒有 proxy，**cloud 端用 ALB 這類元件時也要決定誰驗證 client cert**。若 bridge 0 想驗 cert，就要用 TCP 層（NLB）而不是 HTTP 層 LB，或接受 header 轉述並鎖定 LB 為唯一可信來源。

### 3.2 錨點 2（C-25：共享 PSK、無 client isolation、同 VLAN）與 M-04、N-02

- T27 + T28：同一 SSID、同一 PSK、同一 VLAN 的環境，裝置之間沒有保密也沒有隔離；T1 可以看到（也能解密）同 SSID 其他 client 的流量。所以 **N-02 的「every hop encrypted and mutually authenticated」要實作在 TLS 層，Wi-Fi 加密在威脅模型裡視為零**。M-04 的「每個 device VLAN 至少一個 south」同時是必要的：它是唯一能讓 T1 的流量不與租戶裝置同 broadcast domain 的辦法。
- 意見（VLAN + 防火牆圍堵 T1 的最小規則集，推導自 T28、T30 的 default-deny 原則，非標準條文）：
  1. T1 VLAN 在所有方向預設 deny 並記錄。
  2. T1 → south bridge：僅放行 bridge 對 T1 開放的那幾個 TCP port（例如若收 T1 的 MQTT，才開 1883/8883，否則不開），由 T1 發起、狀態追蹤。
  3. south bridge → T1：僅放行 bridge 主動輪詢的協定與位址（例如 Modbus TCP 502 → 白名單 IP），由 bridge 發起。
  4. DHCP / NTP / DNS：只指向 bridge 或 VLAN 內的本地服務，且只在 T1 需要時開（N-14 要有可信時間源）。
  5. T1 ↔ T1 與 T1 ↔ 租戶裝置：防火牆看不到同 broadcast domain 內的流量，必須靠交換器的 port isolation / private VLAN 或 Wi-Fi client isolation；有線與無線兩邊都要做，且 T28 指出 isolation 是 per-BSS，不能與其他 VLAN 混在同一 SSID 上做選擇性隔離。
  6. T1 → 網際網路、ERP、管理網段、其他 VLAN：一律拒絕。
  7. bridge 的 north 介面在另一個 VLAN（或另一張網卡），bridge 不做 IP forwarding；mDNS / SSDP / broadcast 不跨 VLAN 轉發。
  8. 無線：優先給 T1 獨立 SSID 或每裝置 PSK 並綁 VLAN（T29：vendor 名稱各異，且需要 RADIUS 或支援的 AP；hostapd 的 per-PSK VLAN 是否上游未查證）；MAC 位址不當身分。
  這 8 條是我認為「最小」的集合；沒有任何來源說「這就是最小」，請當成待審查的設計。

### 3.3 錨點 4、5（規模、插電 Linux 盒子）與 idle timeout

- 規模與裝置形態讓「每台裝置一條長連線」可行（CM4 盒子、幾十到幾百台）。長連線的真正風險不是數量，是路徑上最短的 idle timer（T7～T12）加上 keepalive 沒設好。
- 對 P0 §2 提到的「long-poll 被客戶 proxy 的 idle timeout 砍掉」（02-tradeoffs §1）：事實支持其擔憂，但程度取決於 hold 時間。典型 LB / proxy 預設 60s（T7、T8），Cloudflare 125s（T9）。意見：long-poll hold 設 25～30 秒並回空回應，在表列所有預設下都不會被切，代價是每個 child 每 30 秒一次往返（以 N-15 的 heartbeat 120 秒、數十台螢幕計，量級可忽略）。這不是「穿過客戶 proxy 的 long-poll 不一定活得過一分鐘」的反證，而是說「活不過一分鐘」可以靠縮短 hold 時間避開；但客戶 proxy 若對 response 緩衝（T13 最後一句，無文件）則 long-poll 與 SSE 會有不同結果，**這點未查證，應列入 PoC**。
- N-06（timeout 沿鏈對齊）在此有具體內容：bridge 的 long-poll hold 必須小於路徑上最小的 idle / read timeout，且 ERP / Odoo 前面的反向代理（多半是 nginx，T7 預設 60s）要明確設 proxy_read_timeout。

### 3.4 MQTT 在這張表上的位置（對 owner 最在意的那題）

- 事實面：MQTT 8883 在企業 egress 常被擋（T15，Azure 文件原話），業界的解法是 MQTT over WSS 443；WSS 仍要過 HTTP Upgrade、proxy 的 idle timeout 與 TLS 檢查（T7、T10、T13）。所以「用 MQTT」不會讓 (c) 形狀的穿越變容易，反而多出 broker 對 WS 的 TLS 能力（T14）與 keepalive（T16）要確認的項目。這是 P0「不用 MQTT」在傳輸層面成立的一點。
- 但 (c) 形狀的 MQTT 只需要出現在「站點內部」：T1 設備 → south bridge 的內部 MQTT（1883/8883 在站點 VLAN 內，不跨客戶 proxy）。那一段不受本文件的穿越問題影響。穿越問題只作用在 site→cloud 這一條邊，不論裡面裝的是 HTTPS 還是 MQTT。這代表「是否用 MQTT」的決定應拆成兩個問題：站點內（T1 ingress、D-06 HMI）要不要 MQTT；site→cloud 邊要用什麼承載。本文件只對後者提供事實。

### 3.5 錨點 6、M-05、M-06 與 overlay

- 授權與維護者面（T20～T26b）：WireGuard（GPLv2 工具 / MIT 的 Go 版）與 Nebula（MIT）、Headscale（BSD-3）、Tailscale 客戶端（BSD-3）對 M-05 都沒有「綁客戶」的義務；ZeroTier controller 有（T26）；NetBird 的 control plane 是 AGPL（T26b）。M-06 時鐘：Headscale 仍為 0.x 且 README 自述範圍是單一 tailnet、非多租戶（T23）；Nebula 近三個月有三個發布（T25）；Tailscale 的 control plane 是廠商 SaaS，不在本次可查的開源範圍（T22）。
- 「樹」的表達力：WireGuard 以 peer 清單天然表達「child 只認得 parent」（T20）；Nebula 以憑證 group + 防火牆規則表達（T25）；Headscale / Tailscale 以 tag + grant 表達，且預設 allow all（T24）。**但 overlay 解的是「網路可達與加密」，不解 register / SQ / CQ 的語意**（P0 的核心），也不解 adopt / revoke 的業務流程：Nebula 的撤銷是 blocklist 指紋清單（T25），WireGuard 的撤銷是從 peer 清單移除。這些都要在 overlay 之上再做一層。
- 關鍵限制：WireGuard、Nebula、ZeroTier 都是 UDP 為主（T21、T25、T26）。在「只放 443/TCP 且有 TLS 檢查 proxy」的客戶端，它們單獨使用都不成立；Tailscale 靠 DERP-over-HTTPS 補（T22），但 DERP 與許多 HTTP proxy 不相容（T22 原話），遇到 TLS 攔截只做告警（T6）。所以 overlay 不能當 (c) 形狀 site→cloud 的唯一承載；它比較像 (b) 形狀（同站不同 VLAN）或客戶允許 UDP 時的選項。

## 4. 未查證或有疑慮之處

1. **廠商 TLS 攔截文件全是 [摘要]**（T1～T3）：Palo Alto、Zscaler、Fortinet 的官方頁面本環境打不開，內容來自搜尋摘要。三家說法方向一致，但版本差異（例如是否有新版支援 client cert 的 proxy 端憑證注入）沒查。**建議在波次 B 前由能上網的人核對這三條原文。**
2. 「client cert 在 TLS-terminating proxy 後會失效」的原理（T5 的 Envoy 文件 + T1 的「沒有私鑰」）是我綜合出來的；沒有任何一份文件把整條推理寫在一起。有些企業 proxy 允許把使用者 cert 裝在 proxy 上由 proxy 代簽（mTLS re-origination），但那等於 proxy 擁有身分，對我們的 T1 / site 憑證模型沒有意義。這屬意見。
3. Cloudflare idle 數值多處不一致（搜尋摘要 100 秒 vs 文件原始碼 125 秒，T9）；AWS NLB 的 TLS listener 350 秒是否可改（T8）摘要自相矛盾。時間數值請視為「查證當日的樣子」。
4. Palo Alto 的 TCP session 預設 3600 秒（T11）只有論壇輸出；Fortinet 的範圍說法在不同文章不一致。
5. **客戶端正向 proxy 對 long-poll / SSE 回應是否緩衝**：沒有任何文件；只有 nginx 反向代理側的行為（T13）。這是 HTTPS long-poll 方案的最大實測缺口。
6. **NATS leaf 經 HTTP CONNECT proxy 與 TLS 攔截**：只查到 `ws://` 出站與 release notes 一句「Remote proxies gained TLS support for https:// URLs」（來自同目錄 nats.md，非我獨立查證）；行為未查證。
7. Mosquitto 非 libwebsockets 的原生 WebSocket 實作之 TLS 選項（是否支援 client cert）未查證（T14）；EMQX、HiveMQ、NanoMQ 等其他 broker 的 WS + mTLS 能力本文件沒有涵蓋（見 mqtt-brokers.md）。
8. AWS IoT Core 的 ALPN `x-amzn-mqtt-ca` 在 TLS 攔截 proxy 後能否保留 ALPN 未查證（T15）；AWS 文件中 keep-alive 的範圍（30～1200 秒的說法）本次沒找到證據，未納入。
9. WireGuard 的 kernel module 授權（GPLv2）未直接讀到 LICENSE；Tailscale 免費方案與 control plane 條款未查（tailscale.com 打不開）；ZeroTier 與 Nebula 是否存在 TCP fallback 未查。
10. NetBird、Netmaker、Firezone 等其他 overlay 未系統性查證（只順帶看了 NetBird 的 LICENSE）。
11. 沒有找到任何公開的「各傳輸方式在企業網路的實測存活率」。§5 的評等完全是推論。
12. 時間：T25 顯示 Nebula pkg.go.dev 的 v1.11.2 並非最新，未查最新版號。
13. T30 的 NIST SP 800-82r3 與 IEC 62443 只有二手引用；§3.2 的 8 條規則不應被當成標準符合性的證明。

## 5. 結尾：第 (c) 種部署形狀下，五種傳輸的存活條件

情境：站點只有 outbound（F-41）、客戶可能有 TLS 檢查 proxy、可能只放行 443。下表的「評等」是依上述事實做的**推論（意見）**；來源裡沒有任何量化存活率，故不給百分比。

| 傳輸 | 只放 443、無 TLS 檢查 | 只放 443、有 TLS 檢查 proxy（無 bypass） | 放行任意 outbound TCP，無檢查 | 需要的條件與已知風險 |
|---|---|---|---|---|
| **HTTPS long-poll** | 高 | 中高：流量通；**client cert 失效**，身分需上移到應用層（§3.1）；proxy 若緩衝回應則 long-poll 可能延遲，未查證 | 高 | hold 時間須小於路徑最小 idle（25～30 秒最穩，T7～T9）；本來就是 HTTP，不需 Upgrade；需處理 proxy 認證（若客戶 proxy 要帳密則更麻煩，未查）；cloud 端 LB 若終結 TLS，mTLS 也要重想（T5） |
| **MQTT/TLS（8883）** | 低（連不出去，T15） | 低（同左，且若走 443 的 ALPN 型態，需 client 控制 ALPN，T15 未查證其在攔截下的行為） | 高 | 需客戶開 8883；mTLS 在有檢查的路徑上失效（T1～T3）；keepalive 需 ≤ 30 秒才穩（T16）。僅適合站點內部（T1 ingress）不適合跨客戶 proxy |
| **MQTT over WSS（443）** | 中高 | 中：Upgrade 多半能過（T13 的 Zscaler 稱可檢查 WebSocket），但 client cert 失效；broker 側 WS 的 mTLS 能力需確認（T14）；idle 與 keepalive 需調（T7、T10、T16） | 高 | HTTP Upgrade 需經 proxy 與 LB 明確放行（T7）；每條連線是長連線，proxy 的 idle 預設 60 秒（T7）；cloud 端 LB 需設 WebSocket 與較長 idle |
| **NATS leaf** | 7422 直連：低；改走 `ws://`443：中 | 低到中：只有 WebSocket 路徑有機會；CONNECT proxy 與 TLS 攔截下的行為未查證（§4 第 6 點）；NATS 以 mTLS 或 NKey/JWT 認證（nats.md），JWT/NKey 簽章在應用層，天然不依賴 TLS client cert，這一點對 (c) 形狀是優勢（推論） | 7422 直連：高 | 預設 ping_interval 2 分鐘需調小（T16）；2026 年 MQTT/leafnode 相關 advisory 較多（nats.md N17）；需要自架 hub 並開放 7422 或 WS 443 給站點 |
| **WireGuard（純）** | 低到中：UDP 443 有時可通，但「只放 TCP 443」的網路無法（T21） | 低：UDP 不經 HTTP proxy；不受 TLS 攔截影響但根本到不了 | 中：UDP 常被預設擋或 NAT mapping 短（T17～T19），需 PersistentKeepalive（T20） | 只有 UDP（T21）；客戶防火牆是否放 UDP 是最大變數；Tailscale 型方案靠 DERP 補，但 DERP 與 HTTP proxy 不相容（T22）；Nebula / ZeroTier 同為 UDP（T25、T26） |

三點歸納（皆為意見）：

1. 在這個形狀下，**唯一不依賴客戶網路做任何讓步就能工作的，只有「HTTPS 上的應用層協定」**（long-poll 或 WebSocket 皆可），且身分驗證不可只依賴 TLS client cert。這是 P0 選 HTTPS 的合理性所在；P0 此點成立。但這個優勢是「跑在 HTTPS 上」帶來的，不是「long-poll」特有的：WebSocket 上的 MQTT 或 NATS 也共享它，代價是各自要確認的 keepalive 與 broker 側 WS/mTLS 能力（T14、T16）。
2. **MQTT 並不因為是 MQTT 而更耐穿越**：8883 是它最容易死的地方，要活就得搬到 WSS 443，而搬過去之後它與 HTTPS long-poll 面對的是同一組 proxy 問題，只多了「Upgrade 與長連線」的額外風險。MQTT 的價值在站點內的生態槓桿（T1 設備、D-06 HMI），不在跨客戶網路的存活。
3. **Overlay（WireGuard 系）適合當 (b) 形狀或客戶放行 UDP 時的加分選項，不適合當 (c) 形狀的唯一承載。** 把它當「樹」的替代時，要自己補 register / SQ / CQ 與 adopt / revoke（T25 的撤銷是手動 blocklist，T20 是移除 peer），所以它換掉的是傳輸與加密，不是 P0 的語意層。

*本文件不下「用或不用」的結論；那是提案與評審的事。*
