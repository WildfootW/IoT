# 需求底稿（原文，2026-10-10 由 owner 提供）

> 這份是審查的輸入，不是結論。§2–§9 原文照錄，供所有審查者引用需求 ID（M-xx, D-xx, F-xx, N-xx, C-xx, B-xx）。

## 2. Meta-requirements (maintenance philosophy)

| ID | Requirement | Status | Src |
|---|---|---|---|
| M-01 | Leave no baggage for future selves: every component kept must still be worth maintaining when its original reason is gone | stated | OWN |
| M-02 | Minimise the number of distinct kinds of things to maintain (種類越少越好): fewer engines, languages, runtimes, repos | stated | OWN |
| M-03 | Fit several deployment shapes: the device-facing side (south) and the ERP-facing side (north) may share a host, sit on different VLANs of one site, or be separated by the internet (customer ERP in a cloud we operate). Topology is a deployment choice, never an architectural assumption | stated | OWN |
| M-04 | Third-party hardware is untrusted (may be insecure or malicious): at least one south instance per device VLAN, so the firewall exposes only the surface we control; the south connects to the north, never the reverse. Replaces the "trusted LAN" assumption of the security model | stated | OWN |
| M-05 | Avoid licence obligations that bind customers (e.g. Timescale License §2.1(b): notice plus a DDL lockout when shipped on-prem; §2.2 no DBaaS) | stated | OWN, TS |
| M-06 | Own code is now cheap to maintain; the expensive thing is depending on components with unclear delivery semantics or dead maintainers (QuantumLeap dead 2024-10, Cygnus archived 2026-02, Kafnus too heavy and AGPL, Wilma/Keyrock dormant, Mongo 6.0 EOL). Corollary: vendor activity (commits, releases, forks, lifecycle pages) is checked before adoption and on a schedule | stated | OWN, SC §5, TS |

## 3. Offering: device classes are functions

Hardware is hardware; a class here is a **function**. One hardware unit may carry several functions, and
software must show that they belong to one physical unit while typing and managing each separately, as PCIe
does with Bus:Device.Function. This is already achievable today: one gateway per host, N backends, entity id =
host suffix + function letter. Hardware is named only as "today".

| ID | Function (status) | Uplink | Downlink | Source of truth | ERP must show / do | Src |
|---|---|---|---|---|---|---|
| D-01 | Screen display (proven, first customer use; hardware today: CM4 + Anthias) | liveness; applied playlist version (wanted, not built) | one state intent: "show playlist version V" | ERP (content, playlist, order, dates) | CMS: content (link, text, optional visual), playlists, Apply, sync state, Preview, Publish to screens. Content type "MES live board" (backlog): a stable URL whose page polls token-protected JSON every ~5 s; bound to a work centre; idle state; freshness indicator; not andon-grade | SG, RB, HW, MES |
| D-02 | Environmental sensing (proven in lab; hardware today: SFA40 via our sensor service): temperature, humidity, HCHO ppb. A signage unit may carry it too, enabled only when needed | readings every 30 s (30 s mean of 1 Hz), liveness | none | the device | appears in Fleet, not manageable; wish: HCHO field/view and threshold alerts in ERP | CA, TS, HW |
| D-03 | Factory bypass sensing over Modbus, priority order: power (CT/3-phase meter), differential pressure, door contact, plant compressed air (Modbus RTU), vibration deferred, gas detection only if not safety-bound (CO2 fine) (wish) | min/mean/max per interval; signed `differentialPressure` | none | the device | history, dashboards; the investment is a generic Modbus (RTU/TCP) backend for the instrument class, not per-sensor variants | HW, PR |
| D-04 | LED strips (proven; lab/demo; hardware today: our LED controller) | liveness, supported effects | jobs: config, effect, playlist add/remove/resume; shows (several strips) | ERP for profiles/shows; device for standalone playlist | profiles, shows, effect validation against device capability | LS, PL, RP LED |
| D-05 | Access-control / time-clock reader (planned product; not a backend yet). Security spec: DESFire mutual auth, OSDP secure channel, TLS, secure boot, signed firmware, SAM/SE | access events, attendance | credential lists, schedules, door state (control-semantic: locks) | ERP/platform | issue cards, manage permissions, query logs, multi-site deployment ease ("software experience is the main selling point") | AC |
| D-06 | Production-equipment retrofit, first case lipstick filler (blocked on partner's PLC data) | machine telemetry up to 1 Hz from PLC via an edge controller | none through this channel (recipes, temperature control stay local on the edge controller) | the machine / PLC | link machine data to ERP/MES; three interface layers: shop-floor HMI (low latency), business (ERP/MES), analytics (dashboards) | LF, HW |

Class rules: every function is either Intent-Only (no hazardous actuation; downlink safely ignorable; no
ordering/expiry/exactly-once needed; modelable as desired state; device may refuse) or Control-Semantic, which
must never receive downlink through the context channel; unclear means Control-Semantic; reclassify on any
capability change (IO, *stated, intrinsic*). D-05 and any actuating D-06 are Control-Semantic: they need a
control plane that does not exist yet.

## 4. Functional requirements

Three planes: return data (device → data store), management (enumeration, binding, configuration,
revocation) and commands (business intent → device). §4.4 lists what the ERP needs as one consumer of them.

### 4.1 Return data

The ERP is a plug-in that exists to receive **business** information; per-sample data goes to a data store.

| ID | Requirement | Status | Scope | Src |
|---|---|---|---|---|
| F-01 | At most 1 Hz per measure goes upstream; anything faster is processed locally (e.g. min/mean/max per interval) and never uploaded | stated | intrinsic | OWN, TS §5, PR §2 |
| F-02 | Measurement time is stamped by the node nearest the sensor, never by the receive time | stated | intrinsic | OWN, TS §5 |
| F-03 | The ERP consumes only business information (binding state, online/offline, command outcomes, threshold events); per-sample data goes to a data store and never becomes ERP rows (the ERP keeps no history today) | proven | intrinsic | OWN, SC §3(b), TS §1 |
| F-04 | Absence of data looks like absence: no placeholder or partial readings stamped as fresh ("no data" rather than partial; warm-up gated by the sensor's own status); stale values age visibly | lesson | intrinsic | CA |
| F-05 | Sensor status (warm-up, fault) visible upstream | wish | intrinsic | CA |
| F-06 | Device-reported capabilities (e.g. supported effects) reach the ERP and drive validation | stated (broken, B-09) | intrinsic | CP §4, FA §7.4 |
| F-07 | Sensor drivers run in their own process; a sensor crash never takes down command-serving functions | lesson | intrinsic | CA |
| F-08 | Store history: a few to a few hundred sensors at ≤ 1 Hz, 3-year horizon; storing a lot of data is expected; the north hosts or attaches the history store | stated | intrinsic | OWN, TS §4 |
| F-09 | Retention and roll-ups | stated | intrinsic | OWN, TS §3 |
| F-10 | Dashboards with threshold lines and alerts (e.g. HCHO 80 ppb legal limit) | proven (line) / wish (alert) | intrinsic | TS §1, OWN |
| F-11 | A column or type change never breaks inserts or loses data | lesson | intrinsic | LL, OWN |
| F-12 | Store measures only, not command blobs | lesson | intrinsic | LL |
| F-13 | Dashboards are code and survive re-provisioning | lesson | intrinsic | LL |
| F-14 | History survives a device-type rename | stated | intrinsic | TS §5 |
| F-15 | The minimum deployment needs no history store | stated | intrinsic | OWN, HS §2 |

### 4.2 Management

History: Orion behaved differently from what was expected in several ways, and there was no capacity to
maintain a separate management platform, so Odoo became the management UI and platform. The rows below are
therefore written against a **virtual management centre**; whether it is the ERP (at least the UI may be)
is open (§9).

| ID | Requirement (topology and identity) | Status | Scope | Src |
|---|---|---|---|---|
| F-16 | Nodes form a tree: root = management side (north); bridges = south instances (one per device VLAN or site, stackable: a south under a south); endpoints = T2/T3 units; functions = the T1 devices a node polls plus a unit's own capabilities. Deploying at any level = adding a node under a parent | stated | intrinsic | OWN |
| F-17 | Each node knows only its parent and its children and connects upstream (outbound); enumeration, binding, configuration and revocation flow along the tree | stated | intrinsic | OWN |
| F-18 | Unlike PCIe, children may be hostile (T1): a bridge contains its children (no lateral reach; a child is exposed only to its parent) | stated | intrinsic | OWN |
| F-19 | Two identities per unit: a stable per-unit identity (credential, serial) and its current path in the tree (changes on re-plug) | stated | intrinsic | OWN |
| F-20 | One unit, several functions: software shows that functions belong to one physical unit, while each function is typed and managed separately | proven (host suffix + letter) | intrinsic | OWN, PL |
| F-21 | Identity is never an address: T2/T3 connect outbound to their parent, so IP, subnet or NAT changes do not matter | stated | intrinsic | OWN |
| F-22 | T1 addressing is stable (DHCP reservation, DNS) or re-discoverable by serial/MAC where the protocol allows; the south never identifies a T1 unit by IP alone (Modbus RTU has an RS485 address, no IP) | stated | intrinsic | OWN |
| F-23 | South and north have stable names (DNS, mDNS); devices find the south, and the south finds the north, by name or discovery, never by a hard-coded IP | stated | intrinsic | OWN |
| F-24 | A south instance is itself a T2 unit with its own identity and credential; it connects to the north (M-04) | stated | intrinsic | OWN |
| F-25 | A node may be an endpoint and a bridge at once (e.g. a signage unit that also polls a T1 sensor) | stated | intrinsic | OWN |

Device tiers, by how much we can change (OWN, *stated*):

| Tier | Definition | Today's examples |
|---|---|---|
| T1 | Closed firmware we cannot change; connects to the south side as it is; we choose protocol and VLAN and assign the id | third-party sensors, Modbus instruments, meters, off-the-shelf IP gear |
| T2 | Our own hardware + software integration, all software ours: we can install an agent, keys and config | CM4 signage, the sensor service, the LED controller, a future Modbus gateway, the south instance |
| T3 | Our own advanced integration with security features on the device: hardware root of trust, non-clonable key, secure boot, signed firmware, remote lock/wipe, attestation | access-control reader class |

Management by tier (OWN, SM §2-§6, SC §2.2; T1 and T2 *stated*, credentials not built; T3 *wish*):

| Concern | T1 | T2 | T3 |
|---|---|---|---|
| Discovery | the operator registers protocol + address + VLAN at the south; the south creates its representative (who creates it: §9) | self-announces with a limited bootstrap credential; finds its south by name or discovery | as T2, announcement signed by the hardware key |
| Liveness | polled by its south | heartbeat to its parent | heartbeat, plus attestation |
| Identity | an id we assign; no credential beyond what the vendor offers | per-unit software credential from manufacture, individually revocable with immediate effect, rotatable without deleting the device | hardware-bound non-clonable key that never leaves the unit; attestation |
| Binding and adoption | registered / removed, not adopted | adopt = bootstrap credential upgraded to operational; release only by platform action or factory reset | as T2; lock and wipe; destructive actions need a positive signed signal, never a bare rejection (a rejection is ambiguous: revoked, registry lost, proxy 404) |
| Configuration | only at the south (vendor protocol) | config push (site, parent, enabled functions) | signed config and signed firmware; config encrypted at rest |
| Revocation | remove at the south + firewall rule | revoke the credential with immediate effect; the device classifies its uplink answer (accepted / rejected / unknown) and notices rejection | revoke + remote lock/wipe; bootstrap credential invalid after adoption; tamper/removal detection |
| Multi-function | each device is one or more functions under its south | one unit exposes several functions (F-20) | as T2 |

| ID | Requirement (all tiers, multi-site) | Status | Scope | Src |
|---|---|---|---|---|
| F-26 | Fleet lists every device, manageable or not, without manual entry in the management centre (a T1 unit is registered once, at its south); only some function classes are manageable, each with its own management module | proven | intrinsic | PL §5.2-5.3, IL |
| F-27 | Online/offline known within minutes (seen within one ~2 min cycle; offline after a configurable 5 min), judged from the device's own report time, never the receive time | proven | intrinsic | IL, PL |
| F-28 | Operator can force an immediate fleet refresh | proven | intrinsic | IL |
| F-29 | Liveness and discovery self-heal after ERP downtime | proven | intrinsic | IL |
| F-30 | Liveness and telemetry never become per-message ERP rows (heartbeats as events were 14k rows/day at 20 devices) | lesson | intrinsic | IL Amd 6, SC §3(b) |
| F-31 | Unknown device ids and undeclared attributes are rejected, not auto-created or mistyped | lesson | intrinsic | SM R7, LL |
| F-32 | A function's attribute schema is declared and typed before its first datum, and can be changed on a live device without data loss or delete/recreate | lesson | intrinsic | LL, TS §5 |
| F-33 | The management centre is the binding authority (Manage / Remove from Management): it writes the binding where other readers see it *before* creating its own record; failure is an actionable error | proven | intrinsic | SM §2.3, FA |
| F-34 | Third-party gear with its own management plane is one more ERP connector, never re-implemented device management | stated | intrinsic | SC §1 |
| F-35 | An enrolment root of trust above any single customer site (factory identity, our own CA or registry) | open | intrinsic | SM §6 |
| F-36 | Manufacturing steps: clone/configure, label/QR with device id, provisioning station, RMA | stated / wish | intrinsic | SM §2.1, SC §6 |
| F-37 | Provisioning must not require the device zone to reach an admin plane | stated (cond. 1) | intrinsic | SC §5.1, IO §8 |
| F-38 | A device reports its applied/actual state (e.g. applied playlist version) as an ordinary measure a periodic snapshot can read | stated, not built | intrinsic | IO, CP §5 |
| F-39 | Adding a device type = one node backend + one management module; nothing else in the chain changes. Today a command-set change spans three steps in several repos (edge branch, reprovision on the registry, ERP subscription spec) | stated / lesson | intrinsic | HW, SC §6 |
| F-40 | One root per site today; a shared root requires per-caller tenant pinning, authentication, and no subscription read by non-admins | stated | intrinsic | SC §5.1 |
| F-41 | Cloud ERP with an on-prem site: no inbound port at the site; outbound-only with a site-scoped credential; the command queue is owned by the ERP | stated | intrinsic | SM §2.4, IL |
| F-42 | IoT2 triggers: first deployment off a trusted LAN; managed hardware sold; more than N sites (N unset) | stated | intrinsic | SC §5.1 |

### 4.3 Commands

| ID | Requirement | Status | Scope | Src |
|---|---|---|---|---|
| F-43 | Business-logic commands (e.g. change the screen) can be issued from the ERP | proven | intrinsic | OWN |
| F-44 | A network cannot guarantee timing, so commands carry no timing requirements; timing-critical behaviour is local to the node (an LED show timeline is one intent) | stated | intrinsic | OWN, LS |
| F-45 | A node can run standalone (LED controller playlist mode) when not driven by the ERP | proven | intrinsic | LS |
| F-46 | Every fact has an owner that holds it durably and can be re-read; nothing exists only in flight; correctness is convergence to the owners' facts, never dependence on a message being delivered. Hence: completion is never inferred from an ack or from having sent; nothing relies on at-least-once delivery; a command issued while the ERP or the node is down is not silently lost; a missed result is recovered by re-reading its owner (e.g. a node keeps recent job results by key), with no per-command poll loop | stated | intrinsic | OWN, IO, SC §5, RU |
| F-47 | Every command is exactly one of: **state intent** (idempotent desired state; done = reported actual == desired) or **job** (one-shot; idempotency key; done = the result echoed for that key) | stated | intrinsic | IO, OWN |
| F-48 | Downlink authenticity and authorisation: it is defined who may command which node; each hop verifies its parent; forged intents are a defacement risk once screens are public | stated | intrinsic | OWN, SM §1.3, §6 |
| F-49 | Every command's result is observable in the ERP (today only 2 of 6 are) | lesson | intrinsic | CP §4 |
| F-50 | A failed or timed-out delivery is `unknown`, never "not run"; past a deadline it becomes `timeout` | stated | intrinsic | CP §5 |
| F-51 | Duplicates, ordering and expiry have a named owner: the edge dedupes by key; ordering is single-flight per device at the issuer; today nobody does | stated / OWN | intrinsic | CP §5, OWN |
| F-52 | Delivery and completion are two events: long device work (e.g. playlist reconcile) never blocks the delivery hop | stated | intrinsic | CP §5, OWN |
| F-53 | A failed backend call is reported as an error outcome, never success with the error hidden | lesson | intrinsic | CP §4 |
| F-54 | The device keeps final discretion (may refuse, defer); repeated identical desired state accumulates no side effects | stated | intrinsic | IO P5, §6 |

Commands that reference a document (screen content today; the delivery path is a §9 question):

| ID | Requirement | Status | Scope | Src |
|---|---|---|---|---|
| F-55 | The ERP is the CMS: ordered assets with duration, date window, enabled; stable keys from the ERP; the device owns its local id map | proven | intrinsic | SG §3 |
| F-56 | A collection travels as a versioned document; the downlink carries only a pointer to it | proven | intrinsic | SG §2 |
| F-57 | Re-apply is idempotent and removes ghost assets | proven | intrinsic | SG |
| F-58 | Editing content makes screens reload it; "publish to all screens using this content" | proven | intrinsic | SG, CS |
| F-59 | Per-screen pull token, rotatable, constant-time check | proven | intrinsic | IL §8.2 |
| F-60 | The playlist route serves the requested version or refuses a non-current one | stated (bug B-04) | intrinsic | CP §5 |
| F-61 | The display backend is swappable behind a reconcile interface (list, create, update, delete, order) | stated | intrinsic | SG §5 |
| F-62 | The light install needs no website builder; heavy content types are optional modules | proven | intrinsic | SG §4, CS |
| F-63 | Live-data pages refresh data without Apply; show freshness; server-side monitoring that boards are polling; per-line auth may be needed | wish | intrinsic | MES |
| F-64 | Ordering belongs to the business owner (the ERP), never the transport; a future Workflow module (explicit state machine, idempotent steps, compensation) is triggered by the second adapter needing a saga | stated | intrinsic | SC §3-4, OWN |
| F-65 | No Workflow module before command correctness (condition 2) | stated | intrinsic | SC §5.1 |
| F-66 | The edge never needs a job engine that trusts delivery | stated | intrinsic | OWN, SC §5 |

### 4.4 The ERP as a consumer

| ID | Requirement | Status | Scope | Src |
|---|---|---|---|---|
| F-67 | Every inbound message is persisted and replayable; a failed delivery is recorded (IoT retention 2 days); each connector states its volume class, so only management and business events go inbound | proven | intrinsic | IL, RU 4 |
| F-68 | One inbound route; authenticate before any write; real status codes | proven | intrinsic | RU 4 |
| F-69 | One outbound transport with a single write gate | proven | intrinsic | RU 5 |
| F-70 | Archiving the connection is a kill switch: no command or Manage goes out | proven | intrinsic | IL |
| F-71 | A fresh database with no connection gives an actionable error, never a silent drop | proven | intrinsic | IL |
| F-72 | A device pulling its own document uses a per-record token outside the hub | proven | intrinsic | RU |

## 5. Non-functional requirements

| ID | Area | Requirement | Status | Scope | Src |
|---|---|---|---|---|---|
| N-01 | Security | Every deployment shape (M-03) has deployment artifacts (compose, firewall templates) that implement its isolation; isolation is never assumed verbally | stated, open | intrinsic | SM R5, OWN |
| N-02 | Security | T2 and up: every hop encrypted and mutually authenticated. T1 is contained by network isolation (required); for T2/T3 VLAN isolation is a deployment option | stated, open | intrinsic | OWN, SM R6 |
| N-03 | Security | Secrets never in plain config files, URLs or logs, anywhere; one credential resolver; an absent key fails closed; every service with state (history store, dashboards) is authenticated | stated (ERP side proven) | intrinsic | SM R9, IL §8.2, RU 3 |
| N-04 | Security | Trust is per environment (CA and credentials per dev/test/prod; prod never trusts non-prod); an environment copy (staging restored from prod) carries no valid trust toward real nodes | stated | intrinsic | IO §7, OWN, HS §5 |
| N-05 | Correctness | One writer per fact: the management centre writes binding and config; the ERP writes desired business state; a node writes only its own actual state and measures under its own identity (a bridge on behalf of its T1 functions); every write is attributable (identity, time, value). Observability: a recent command trail; audit of each push (to whom, which version, when); one log line per outbound call without headers or body | proven (split) / stated (attribution) | intrinsic | SC §3(a), IO P3/P6, IL §8, IO §9 |
| N-06 | Correctness | Timeouts aligned along the chain (a 10 s client in front of a 5 s forward made every slow device an error) | lesson | intrinsic | CP §3 |
| N-07 | Ops | Every service restarts cleanly after crash or reboot; a deliberate stop stays stopped; health checks actually work; runs on the site's existing hosts next to the ERP without clashing with it | lesson | intrinsic | LL, HS §5 |
| N-08 | Ops | Sane log levels by default; debug flags are lab settings, not site defaults (DEBUG competes with the ERP for disk) | lesson | intrinsic | LL, HS |
| N-09 | Ops | Backup and restore for every state store, including every node's own state (today only the broker's Mongo; registry rebuilt by reprovisioning; history store unspecified) | open | intrinsic | HS, RP packaging |
| N-10 | Ops | A tracked upgrade path per component (several are past EOL or security support) | stated | intrinsic | SC §5 |
| N-11 | Availability | Every node keeps its current behaviour when its parent is unreachable (last-known-good desired state; standalone mode) | stated | intrinsic | MES §6, IO §5, LS |
| N-12 | Topology | The root's address as nodes see it is a deployment setting, distinct from the ERP's public and internal names; nothing assumes `web.base.url` or a published port | lesson | intrinsic | OWN, HS §1, §4 |
| N-13 | Topology | Minimum deployment = one screen; small; no history store required | stated | intrinsic | OWN, HS §2 |
| N-14 | Topology | A valid time source wherever a node stamps time (the pilot site's NTP returns zero time) | lesson | intrinsic | HS §1 |
| N-15 | Scale | Upstream ≤ 1 Hz per measure (sensors 30 s today); heartbeat 120 s; fleet pull 2 min; offline 5 min; up to a few hundred sensors; 30 numeric attrs per machine ≈ 2-3 GB (30 s) or 50-90 GB (1 s) per 3 years; screen typically converges within seconds (an expectation, not a guarantee); MES poll ~5 s | stated | intrinsic | OWN, PL, TS §4, MES |
| N-16 | Testability | Everything runs without hardware (stubs, LED simulator, fake sensor) | proven | intrinsic | PL §8, RP |
| N-17 | Testability | End-to-end from ERP to device in CI, from GitLab refs in an isolated network, with per-component overrides; soak and race tests (cycles, duration, jitter); each correctness milestone is "done" only when covered by an e2e scenario | proven | intrinsic | RP e2e, CP §5 |
| N-18 | Testability | Every supported deployment shape is exercised end-to-end before a site uses it (split placement never yet run) | stated | intrinsic | HS §5, OWN |
| N-19 | Testability | ERP-side unit tests hit the real inbound route and assert 403 unauthenticated. Gaps today: the gateway has no unit tests; green bundle pipelines do not prove modules install | proven / gap | intrinsic | RU, workspace CLAUDE.md |
| N-20 | Hardware | Carrier/sensor choices must tolerate the Waveshare CM4 7A-BOX: no 3.3 V on its isolated I2C header, its "5 V" is 5.3 V unregulated; or the carrier changes | lesson | stack:Waveshare 7A-BOX | OWN, RP Parts |
| N-21 | Hardware | Sensor rules: bypass observation only (never in the PLC control loop); no part whose failure mode is a healthy-looking value (LWLP5000 self-zero); zero drift matters most at reference tier; QA-grade needs calibratable 4-20 mA; room pressure is dominated by door state, the three kinds of "pressure" are three product categories, barometric parts fit neither need; Taiwan regulation: pressure vessels only through existing ports (unverified), fire-safety pressurisation, gas detection tied to occupational safety is out | stated | intrinsic | PR, HW |
| N-22 | Parts | One note per third-party part (interfaces, addresses, burning, pitfalls, file table with SHA256), Chinese; vendor files in a package registry | proven | intrinsic | OWN, RP Parts |
| N-23 | Product | The ERP side is usable in Traditional Chinese: every module ships `zh_TW` translations, exported per module and merged, never overwritten | proven | intrinsic | workspace CLAUDE.md, RP |

## 6. Constraints and lessons any design must respect

Rows tagged `stack:<X>` vanish when X goes; `intrinsic` rows do not.

| ID | Constraint | Status | Scope | Src |
|---|---|---|---|---|
| C-01 | Values and identifiers may not contain `< > " ' = ; ( )` → `b64:` result encoding, path-form URLs | lesson | stack:Orion | CP, RP gateway |
| C-02 | Commands are forwarded synchronously via a registration with a 5 s timeout | proven | stack:Orion | CP §3 r11 |
| C-03 | A failed or slow push writes nothing, no retry; the PATCH answers 404 | lesson | stack:IOTA | CP §3 r3 |
| C-04 | `PENDING` is written after the device answered and races with `OK`; `OK` = "edge answered 200" | lesson | stack:IOTA | CP §3 |
| C-05 | No notification redelivery; `maxFailsLimit` only deactivates | lesson | stack:Orion | CP §3 r4, LL |
| C-06 | The command attribute reads back `""`: the ERP must store desired state | proven | stack:Orion | CP §3 r6 |
| C-07 | `<cmd>_info` is last-writer-wins with no history; concurrent jobs finish out of order | lesson | stack:Orion/IOTA | CP §3 r5 |
| C-08 | Polling mode = one slot per device and command; a queued command survives device deletion | proven | stack:IOTA | CP §3 r9 |
| C-09 | No authentication; the tenant is a client-settable header, so admin and registry planes must be unreachable from the device zone; subscriptions return their headers (hook token readable in clear) | lesson | stack:Orion/IOTA | CP §3 r1, SM R3/R4, SC §5.1, LL |
| C-10 | Per-device key needs one service group per key; `autoprovision` defaults true; `IOTA_DEFAULT_KEY` bypasses device keys; no client-cert TLS; no "disabled" state; cannot push a revocation | proven | stack:IOTA | SM §2.1, §6 |
| C-11 | Device attribute set fixed at provisioning; re-POST is 409; fix by PUT of the full list; service group before devices; undeclared keys arrive as Text | lesson | stack:IOTA | LL, CA |
| C-12 | Commands are pushed to the IP:port registered at provisioning: an IP change breaks the downlink while the heartbeat continues (why the pilot site needs a DHCP reservation for the CM4) | lesson | stack:IOTA | OWN |
| C-13 | `entityCreate` never fires for a heartbeat-born entity; no initial notification on activation | proven | stack:Orion | IL |
| C-14 | A stale PID file blocks restart; debug log and `-noCache` defaults | lesson | stack:Orion (our compose) | LL |
| C-15 | First type seen is permanent; type map in a metadata table; never DROP a column; unpartitioned tables; ~100 notify req/s per instance; stores every attribute unless scoped | lesson | stack:QuantumLeap | LL, TS |
| C-16 | No TTL (retention = scheduled DELETE); 512 MB heap; shard guidance 5-50 GB; PG-wire but not Postgres | proven | stack:CrateDB | TS |
| C-17 | Re-provisioning overwrites hand-made dashboards | lesson | stack:Grafana (+ our script) | LL |
| C-18 | Reloads only on URI change (`NOREFRESH`); PATCH ignores URI (delete + recreate); assigns asset ids itself; requires both dates; order is a comma-joined id list | lesson | stack:Anthias | SG, RB |
| C-19 | A page must not animate or repaint continuously (viewer debug log exhausts memory; even quiet pages leak slowly); a page must never navigate itself | lesson | stack:Anthias | RB §6 |
| C-20 | SERIALIZABLE transactions: no remote call in the user transaction, so commands are enqueued outside it (no races with inbound results); never `cr.rollback()` in a handler; `_inherits` methods are not inherited; `type='json'` answers 200 on Forbidden; `addons_path` does not discover submodules | lesson | stack:Odoo | IL, RU, CP §1-2, FA §4-5 |
| C-21 | A collection does not fit a flat attribute (blob, or entity per item with no counterpart) | proven | stack:NGSI attribute model | SG §1 |
| C-22 | The display backend owns item identity, so the ERP cannot name an item before it exists | proven | stack:any id-assigning backend (Anthias today) | SG §1 M1 |
| C-23 | Polling cadence is IT configuration on the connection, with no consumer-owned polling cron; the hub knows remotes, never domains, and domain modules contribute types and result attributes | proven | stack:integration-hub | RU 2, RU 6 |
| C-24 | Content and playlists pulled by the device directly from the ERP forced the site's IoT → ERP firewall rule; the ready-made case for the §9 "which channels go direct" question | lesson | stack:current-signage-design | HS §3, SG |
| C-25 | A real site looks like this: shared-PSK IoT Wi-Fi without client isolation; a tenant's devices on the same VLAN; a single hypervisor (evidence for M-04) | proven | intrinsic (pilot site) | HS §1, §6 |

## 7. Inventory of what runs today

| Component | Role | Own / external | Maintainer status | Known pain | Replacement if dropped |
|---|---|---|---|---|---|
| Orion 4.1.0 | context broker, command forwarder | external (FIWARE) | active (4.7.0 out) | C-01, C-02, C-05..C-07, C-09, C-13, C-14 | open |
| IoT Agent JSON 3.7.0 / node-lib 4.7.0 | device ingress, command push | external (FIWARE) | active (3.14.0 out) | C-03, C-04, C-08, C-10..C-12 | open |
| MongoDB 6.0 (×2) | Orion and IOTA stores | external | EOL 2025-07-31 | backup covers Orion only | open |
| QuantumLeap 1.0.0 | Orion → history writer | external | dead (last commit 2024-10-18) | C-15 | own Orion-subscription → TSDB writer (TS, !242) |
| CrateDB 5.8.3 | history store | external | line ended 5.8.7 (2025-02); small vendor | C-16, R9 | plain PostgreSQL 18 table, partitioned (TS, !242, recommendation) |
| Grafana 11.4.0 | dashboards | external | out of security support 2025-09-05 | R9, C-17 | open (routine bump stated) |
| Anthias (viewer `a3036a5-pi4-64`) | screen player on the CM4 | external, not forked | not recorded | C-18, C-19 | reconcile-backend interface keeps it swappable (SG §5); successor open |
| Odoo 19 + integration hub | ERP, integration hub | own (hub) on external Odoo | active | C-20, C-23 | n/a |
| `iot_*` (4 modules) | Fleet, Manage, command queue, LED and signage management | own | active | B-01..B-09 | n/a |
| Gateway (today) | edge gateway (one file, Flask/Waitress) | own | active | R1, R2, no unit tests | n/a; candidate: one stackable node implementation (south + gateway merged), §9 |
| LED controller (today) | LED controller | own | active | R1 | n/a |
| Sensor service (today) (+ vendored DFRobot MIT driver) | sensor service | own | active | R1 (binds 0.0.0.0) | n/a |
| Compose packaging (compose + scripts) | packaging of the FIWARE stack | own | active; split mode untested; packaging MR !17/!18 open | R3, C-14 | n/a; candidate: one stackable node implementation (south + gateway merged), §9 |
| IoT_e2e | cross-repo tests | own | active | default refs need current pins | n/a |
| IoT_Parts | parts notes + registry | own | active | — | n/a |
| CM4 + Waveshare 7A-BOX | signage hardware | external hardware | — | N-20 | open |
| Not used, judged: Cygnus (archived 2026-02-03), Kafnus (Kafka + Connect, AGPL), Wilma/Keyrock (dormant since 2023), Draco (dormant 2022), Mintaka (archived 2026-05, NGSI-LD), STH-Comet (no release since 2023-11) | — | external | dead or unfit | — | — |

## 8. Known bugs in our own code (a redesign may fix them for free)

| ID | Bug | Src |
|---|---|---|
| B-01 | Dispatch marks a command `error` on any exception, including a 404 for a device still running it; rows are never linked to results and are deleted after 7 days | CP §4 |
| B-02 | A failed signage dispatch leaves the screen `applying` | CP §4 |
| B-03 | Apply result is accepted without a version check; a stale `OK` marks the newest playlist "In sync" | CP §4, SG §6 |
| B-04 | The playlist route ignores the requested version | CP §4, SG §6 |
| B-05 | Only `ledConfig` results are subscribed; four LED commands are unobserved | CP §4 |
| B-06 | The gateway answers 200 when the backend failed; the LED handler writes `OK` without reading the result | CP §4 |
| B-07 | The playlist reconcile runs synchronously inside the delivery request (15 s fetch + 10 s calls vs a 5 s forward) | CP §4 |
| B-08 | No idempotency key on any job; duplicates re-run | CP §4 |
| B-09 | `supported_effects` stays empty on a managed strip, so effect validation accepts everything (code read only) | CP §4, FA §7.4 |
| B-10 | Gateway, LED controller and sensor service bind all interfaces with no auth (R1); reconcile fetches any URL (R2) | SM §1.3 |
| B-11 | The gateway ignores its heartbeat response, so it cannot notice rejection | SM §6 |
| B-12 | Edge provisioning uses the admin port and is POST-only (no update path) | SM R3, LL |
| B-13 | the packaging's stop and systemd `ExecStop` address the wrong compose project (fix in packaging MR !17, open) | HS §5 |
| B-14 | No applied-version measure; results lost while the ERP is down are never recovered | SG §6 |

## 9. Open questions the review must answer

- Does NGSI stay the contract? The 2026-10-03 decision "FIWARE stays" (SC §5) predates the owner's framing here; which needs in §4 does FIWARE serve that own code could not?
- Which component is the device registry and credential issuer (one issuer only, SC §2.2)?
- What is the device channel: HTTP push, HTTP pull, MQTT; who terminates TLS and client identity?
- Where does command state live end to end, and which side owns dedupe, single-flight and deadlines?
- Time-series store: plain PostgreSQL in the ERP's cluster or a separate instance; who writes it; how roll-ups are built without TSL features?
- Alerts: in the dashboard tool, the ERP, or both? Who receives them?
- Does the minimum site footprint (one screen) shrink below two services, e.g. by bundling broker, registry and writer into one own service?
- Where does the screen player come from if Anthias goes, and does the reconcile move to a central service (SG §7, B+C hybrid)?
- Cloud ERP: site agent shape and credential (SM §2.4).
- Enrolment root of trust and bootstrap discovery (SM §3, §6); N for the IoT2 site trigger.
- Control-Semantic devices (access reader, actuating retrofits): which control plane, and is it in scope at all?
- Backup and restore of every state store, and staging neutralisation as a built-in rather than a runbook step.
- Which edge pieces stay separate processes (sensor isolation, F-07) and which merge into one agent (M-02)?
- Where is the self-build boundary: what do we still never build (database engine, browser, OS, ...)?
- Is the management centre (§4.2) the ERP, a separate service, or ERP UI over a separate service?
- Who creates a T1 device's representative: the operator at the south, or the south automatically?
- Which channels go direct and which go along the tree? The substrate is a network, so data may go direct wherever reachable, with trust for the channel established through the management plane (design note, not a requirement); the device-to-ERP content pull (C-24) is the existing case. The document pull (devices → ERP, SG §7) is the existing case.
- Does "no unattended closed loop" (an inbound notification never writes a downlink automatically; IO P7) survive once a Workflow module automates reactions?
- Should the south and today's gateway merge into one stackable node implementation (§7)?
