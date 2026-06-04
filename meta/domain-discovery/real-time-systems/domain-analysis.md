# Domain Analysis: Real-Time Systems (Laravel Ecosystem)

## Domain Overview

Real-time systems in the Laravel ecosystem enable instantaneous bidirectional or unidirectional data flow between server and client without page refreshes. The domain encompasses WebSocket servers, broadcasting architectures, client-side subscription libraries, channel authorization, scaling strategies, and alternative transport mechanisms (SSE, polling). The first-party Laravel Reverb server (built on ReactPHP/FrankenPHP, released 2024) has become the default choice, replacing third-party dependencies like Pusher for most use cases. The ecosystem now supports managed (Pusher, Ably), self-hosted open-source (Soketi), and first-party (Reverb) WebSocket solutions, plus SSE via packages like Laravel Wave. Broadcasting is deeply integrated into Laravel core via `ShouldBroadcast` events, queue workers, channel authorization, and the Echo JavaScript client.

## Domain Scope

**In Scope:**
- Laravel Broadcasting system (events, channels, drivers)
- WebSocket protocols and transport (WSS, WS)
- Laravel Reverb architecture, configuration, deployment
- Pusher, Ably, Soketi integration patterns
- Laravel Echo (JS/TS client) — all framework integrations (React, Vue, Svelte)
- Channel types: public, private, presence
- Channel authorization and authentication flows
- Horizontal scaling (Redis pub/sub, sticky sessions, load balancing)
- Server-Sent Events (SSE) — native Laravel streaming responses and packages
- Polling strategies (short polling, long polling)
- WebSocket vs SSE vs Polling trade-off analysis
- Real-time notifications (database + broadcast)
- Real-time dashboards and live charts
- Collaborative editing primitives (OT, CRDT, Yjs, Automerge)
- Security: CORS, origin validation, WSS/TLS, authentication tokens, CVE awareness
- Production deployment (Supervisor, Nginx, Docker, Forge, Cloud)
- Monitoring and observability (Pulse, Prometheus, metrics)
- Laravel Octane interop with Reverb
- Reconnection strategies and connection lifecycle management

**Out of Scope:**
- Low-level TCP/UDP socket programming outside WebSocket protocol
- Peer-to-peer WebRTC (though complementary)
- MQTT/IoT protocols (unless via Ably bridge)
- Third-party chat SDKs that abstract WebSocket entirely
- Non-Laravel WebSocket server implementations (Node.js, Go, etc.)
- Real-time video/audio streaming infrastructure

## Major Subdomains

### 1. Event Broadcasting Architecture
Core Laravel system: `ShouldBroadcast` interface, `Dispatchable`, event serialization, queue integration, broadcast drivers (Pusher, Reverb, Ably, Log, Null). Event dispatch lifecycle: HTTP request → event fired → queued → broadcast driver → WebSocket server → connected clients. Config in `config/broadcasting.php`.

### 2. WebSocket Servers
Four primary options:
- **Laravel Reverb** (first-party): ReactPHP event-loop, Pusher protocol, native Echo support, horizontal scaling via Redis, v1.7.0+ (CVE-2026-23524 fixed)
- **Pusher Channels** (managed): Hosted WebSockets, generous free tier (200 connections), usage-based pricing
- **Ably** (managed): Enterprise-grade, global edge network, guaranteed delivery, MQTT/SSE/WebSocket multi-protocol, 6M msg/month free
- **Soketi** (self-hosted OSS): Pusher protocol v7 compatible, Redis/NATS adapter, Prometheus monitoring, spiritual successor to Laravel Echo Server

### 3. Client-Side Subscriptions (Laravel Echo)
JavaScript/TypeScript library connecting to broadcasting backends. Supports public (`channel()`), private (`private()`), and presence (`join()`) channels. Framework-specific packages: `laravel-echo` (core), `@laravel/echo-react` (hooks: `useEcho`, `useEchoModel`), `@laravel/echo-vue` (composables), `@laravel/echo-svelte` (runes). Connection status reactive hook: `useConnectionStatus()` → connected, connecting, reconnecting, disconnected, failed.

### 4. Channel Types & Authorization
- **Public channels**: No auth required, any client can subscribe
- **Private channels**: Prefix `private-`, auth via `/broadcasting/auth` endpoint, callbacks in `routes/channels.php`, supports custom guards (Sanctum, Passport, JWT)
- **Presence channels**: Prefix `presence-`, extends private with user awareness, `here()`, `joining()`, `leaving()` callbacks, membership stored in Redis, supports ghost member cleanup

### 5. Scaling & Production Architecture
- Single-server Reverb (event-loop, handles 10k+ connections on 4-core/8GB)
- Horizontal scaling via Redis pub/sub (`REVERB_SCALING_ENABLED=true`)
- Load balancer patterns: sticky sessions (IP hash, cookie), dedicated Reverb fleet, single instance
- Reconnection storms: client-side jitter, exponential backoff, rolling deploys
- Infrastructure: Nginx reverse proxy with WebSocket upgrade headers, Supervisor daemon, Docker/K8s, Laravel Forge, Laravel Cloud (managed Reverb)

### 6. SSE (Server-Sent Events)
Unidirectional HTTP streaming: `text/event-stream` content type, `EventSource` browser API, auto-reconnect with `last-event-id`. Native Laravel via `response()->stream()`. Packages: `qruto/laravel-wave`, `nerdofcode/laravel-sse`. Ideal for AI streaming, notifications, live feeds. Not suitable for bidirectional communication. HTTP/2 multiplexing solves the 6-connection-per-domain limit. Works through proxies/CDNs easily.

### 7. Transport Comparison (WebSocket vs SSE vs Polling)
- **WebSocket**: Full-duplex, <50ms latency, stateful, complex scaling, 99%+ browser support
- **SSE**: Unidirectional, <100ms latency, stateless HTTP, auto-reconnect built-in, 96% browser support
- **Long polling**: Simulated real-time, 1-30s latency, works everywhere, high overhead
- **Short polling**: Simplest, latency = interval, wasteful at scale

### 8. Real-Time Notifications
Laravel notification system with `ShouldBroadcast` on notification classes. Broadcast to `App.Models.User.{id}` private channel. Combines database storage (for history) with broadcast (for instant delivery). Queue-backed for reliability.

### 9. Collaborative Editing
Requires conflict resolution beyond transport: Operational Transform (OT) and CRDTs. OT: Google Docs approach, server-authoritative, position transformation. CRDTs: Yjs (JS, 26K-156K ops/sec), Automerge (Rust, 600ms for 260K keystrokes). Yjs + y-websocket relay for real-time sync. Presence awareness via cursors, selections. Requires dedicated sync server, not standard Laravel broadcasting.

### 10. Security
- WSS/TLS mandatory in production
- Channel authorization via Laravel auth guards
- CORS and `allowed_origins` configuration
- CSWSH (Cross-Site WebSocket Hijacking) prevention
- Token authentication via query param, first-message, or subprotocol
- JWT validation for API-driven apps
- CVE-2026-23524: Reverb Redis insecure deserialization (RCE, CVSS 9.8, fixed in v1.7.0)
- Rate limiting for `/broadcasting/auth` endpoint
- `max_message_size` limits payload abuse

## Complete Knowledge Inventory

| ID | Knowledge Item | Type | Maturity | Confidence |
|----|---------------|------|----------|------------|
| K01 | Laravel Broadcasting architecture | Conceptual | Stable | High |
| K02 | ShouldBroadcast interface & event lifecycle | Procedural | Stable | High |
| K03 | Reverb installation & configuration | Procedural | Stable | High |
| K04 | Reverb horizontal scaling via Redis | Architectural | Stable | High |
| K05 | Reverb connection lifecycle & state management | Conceptual | Stable | High |
| K06 | Pusher Channels integration | Procedural | Stable | High |
| K07 | Ably integration & enterprise features | Procedural | Mature | High |
| K08 | Soketi self-hosted setup | Procedural | Stable | High |
| K09 | Laravel Echo core API | Procedural | Stable | High |
| K10 | Echo framework integrations (React/Vue/Svelte) | Procedural | Stable | High |
| K11 | Public/Private/Presence channel patterns | Conceptual | Stable | High |
| K12 | Channel authorization (routes/channels.php) | Procedural | Stable | High |
| K13 | Presence channel & online user tracking | Procedural | Stable | High |
| K14 | Sticky sessions & load balancing for WS | Architectural | Stable | High |
| K15 | Reconnection strategies & storm mitigation | Architectural | Stable | High |
| K16 | SSE implementation in Laravel | Procedural | Mature | High |
| K17 | Laravel Wave SSE package | Procedural | Mature | Medium |
| K18 | WebSocket vs SSE vs Polling decision framework | Conceptual | Stable | High |
| K19 | Real-time notifications (broadcast + database) | Procedural | Stable | High |
| K20 | Real-time dashboard architecture | Architectural | Stable | High |
| K21 | Laravel Pulse monitoring | Procedural | Stable | High |
| K22 | Collaborative editing with Yjs/CRDT | Conceptual | Emerging | Medium |
| K23 | Operational Transform theory | Conceptual | Mature | High |
| K24 | WebSocket security (TLS, CORS, auth, CSWSH) | Procedural | Stable | High |
| K25 | CVE-2026-23524 (Reverb Redis deserialization) | Factual | Stable | High |
| K26 | Octane interop with Reverb | Architectural | Stable | Medium |
| K27 | Supervisor & production process management | Procedural | Stable | High |
| K28 | Laravel Cloud managed WebSockets | Procedural | Emerging | Medium |
| K29 | Private channel auth with JWT/Sanctum | Procedural | Stable | High |
| K30 | Model broadcasting (BroadcastsEvents trait) | Procedural | Stable | High |
| K31 | Client events (whisper, typing indicators) | Procedural | Stable | High |
| K32 | Nginx WebSocket proxy configuration | Procedural | Stable | High |
| K33 | Dedicated Reverb fleet architecture | Architectural | Stable | High |
| K34 | Redis dependency & failure modes | Architectural | Stable | High |
| K35 | Ghost member cleanup in presence channels | Procedural | Stable | Medium |
| K36 | Auth endpoint optimization & caching | Procedural | Stable | High |
| K37 | Reverb monitoring metrics | Procedural | Stable | Medium |
| K38 | Serverless WebSocket limitations | Conceptual | Stable | High |
| K39 | Cross-language pub/sub gaps | Architectural | Stable | High |
| K40 | Message persistence & guaranteed delivery constraints | Conceptual | Stable | High |

## Knowledge Classification

### By Maturity
- **Stable (30 items)**: Core broadcasting, Reverb, Echo, channels, security, deployment. These are well-documented, production-proven patterns.
- **Mature (5 items)**: Ably enterprise features, SSE implementation, OT theory, Pusher alternatives. Well-understood but narrower adoption.
- **Emerging (2 items)**: CRDT/Yjs in Laravel context, Laravel Cloud managed WebSockets. Rapidly evolving, best practices still forming.

### By Type
- **Conceptual (8)**: Broadcasting architecture, state management, channel patterns, decision frameworks, serverless limitations, cross-language gaps
- **Procedural (21)**: Installation steps, configuration, API usage, deployment commands, security hardening
- **Architectural (7)**: Scaling strategies, load balancing, fleet design, monitoring, Octane interop
- **Factual (1)**: CVE-2026-23524 specifics

### By Criticality
- **Critical (12)**: Broadcasting auth, Reverb production config, WSS/TLS, CORS, origin validation, Redis security, scaling architecture, load balancing, reconnection handling, Echo connection status, CVE patching, auth endpoint perf
- **Important (15)**: Channel types, event lifecycle, Echo framework integrations, SSE, notifications, monitoring, Supervisor
- **Nice-to-Have (8)**: OT/CRDT theory, Laravel Cloud, model broadcasting, whisper events, ghost member cleanup

## Dependency Map

```
Laravel Application
├── config/broadcasting.php (broadcast driver selection)
├── config/queue.php (queue connection for broadcast dispatch)
├── config/reverb.php (if using Reverb)
│   └── scaling.driver → Redis connection
├── config/app.php (BroadcastServiceProvider registration)
├── routes/channels.php (auth callbacks per channel)
│
├── App\Events\* (ShouldBroadcast events)
│   └── broadcastOn() → Channel/PrivateChannel/PresenceChannel
│   └── broadcastWith() → custom payload
│   └── broadcastAs() → custom event name
│
├── App\Models\* (BroadcastsEvents trait support)
│
├── Server Infrastructure
│   ├── WebSocket Server (Reverb / Pusher / Ably / Soketi)
│   │   ├── Reverb → uses ReactPHP / FrankenPHP event loop
│   │   ├── Reverb → Redis pub/sub for horizontal scaling
│   │   └── Reverb → Pusher protocol compatibility
│   ├── Redis
│   │   ├── Pub/Sub (scaling, events)
│   │   ├── Presence channel membership
│   │   └── Optional: caching, queues, sessions
│   ├── Nginx / Load Balancer
│   │   ├── WebSocket upgrade headers (Upgrade, Connection)
│   │   ├── Sticky sessions (ip_hash)
│   │   └── WSS termination (TLS)
│   └── Process Manager (Supervisor)
│
├── Client
│   ├── Laravel Echo
│   │   ├── laravel-echo (core)
│   │   ├── @laravel/echo-react
│   │   ├── @laravel/echo-vue
│   │   └── @laravel/echo-svelte
│   └── EventSource (for SSE)
│
├── Octane (optional)
│   └── FrankenPHP/Swoole/RoadRunner app server
│
└── Monitoring
    ├── Laravel Pulse
    ├── Prometheus / Datadog / CloudWatch
    └── Reverb /apps/{appId}/connections endpoint
```

### Critical Dependency Chains
1. **Event Delivery**: App → Queue → Broadcast Driver → WebSocket Server → Echo → UI
2. **Channel Auth**: Echo.subscribe → HTTP /broadcasting/auth → Laravel Auth → Gate/Policy → Response
3. **Horizontal Scaling**: App publishes → Redis pub/sub → all Reverb instances → locally connected clients
4. **Presence State**: Client joins → Reverb writes to Redis → all Reverb instances read → membership broadcast

### Single Points of Failure
- **Redis**: Scaling, presence, and queue dependency. If Redis goes down, broadcasting stops.
- **Reverb single instance**: All connections lost on restart; reconnection storm risk.
- **Auth endpoint**: Slow auth cascades into DB/queue overload during reconnection waves.

## Missing Knowledge Risk Analysis

| Missing Knowledge | Risk Level | Impact | Mitigation |
|------------------|------------|--------|------------|
| Deep Octane + Reverb interop details | Medium | Suboptimal perf tuning | Test both modes in staging |
| Community package compatibility with Reverb | Medium | Broken third-party broadcasters | Test package before adopting |
| Laravel Cloud WebSocket pricing/capacity | Medium | Cost overruns | Monitor usage, benchmark |
| Full Yjs/CRDT integration patterns for Laravel | Medium | Suboptimal collab features | Reference non-Laravel Yjs docs |
| Reverb memory/perf profiling at extreme scale | Low | Unexpected OOM | Load test with expected concurrency |
| Soketi production benchmarks vs Reverb | Low | Wrong self-hosted choice | Run comparative benchmark |
| Mobile network WS behavior (intermittent drops) | Medium | Poor mobile UX | Implement aggressive reconnect with backoff |
| Enterprise SSO integration for WS auth | Medium | Auth failures | Test with enterprise IdP |

## Research Findings

### Key Finding 1: Reverb Has Become the Default (2026)
Laravel Reverb has displaced both Pusher (for self-hosted) and the community `laravel-websockets` package. With 5.3M+ Composer downloads and v1.7.0+ fixing the critical CVE-2026-23524, it is production-ready for most use cases. The `php artisan install:broadcasting` command scaffolds everything including Echo. Managed Reverb on Laravel Cloud eliminates operational overhead.

### Key Finding 2: Horizontal Scaling Remains Non-Trivial
The bubble.ro deep-dive (2026-05-31) revealed that "first-party does not mean zero operational complexity." Scaling Reverb requires Redis pub/sub, sticky load balancers, careful reconnection handling, and separate monitoring. The common recommendation: start with a single Reverb instance (handles 10k+ connections easily) and only scale horizontally when needed.

### Key Finding 3: SSE Is Making a Comeback
Driven by AI streaming (LLM token output) and HTTP/2 enabling multiplexed SSE connections, SSE is increasingly viable for unidirectional use cases. Packages like `qruto/laravel-wave` bridge SSE with Laravel Echo's API. SSE is simpler, works through standard HTTP infrastructure, and auto-reconnects natively. Best for notifications, dashboards, feeds.

### Key Finding 4: Security at Scale Has Sharp Edges
CVE-2026-23524 (CVSS 9.8) demonstrated the risks of Redis deserialization in Reverb scaling mode. Private channel auth with JWT/Sanctum requires careful middleware configuration. Auth endpoints must be optimized to prevent cascading failures during reconnection storms. Origin validation and `allowed_origins` must be locked in production.

### Key Finding 5: Framework-Specific Echo Integrations Matured
Laravel Echo now ships first-party packages for React (`@laravel/echo-react` with hooks), Vue 3 (`@laravel/echo-vue` with composables), and Svelte 5 (`@laravel/echo-svelte` with runes). The `useConnectionStatus()` hook provides reactive connection state monitoring.

### Key Finding 6: Transport Choice Depends on Directionality
The 2026 consensus decision matrix:
- **Bidirectional needed** (chat, gaming, collaborative editing) → WebSocket
- **Server→Client only** (notifications, dashboards, AI streaming) → SSE
- **Legacy/simple needs** → Long polling
- **No real-time need, periodic updates okay** → Short polling

### Key Finding 7: Collaborative Editing Requires Specialized Infrastructure
Standard Laravel broadcasting handles transport only. For collaborative editing, CRDT libraries (Yjs, Automerge) or OT algorithms are required on top. These need their own sync servers (y-websocket relay). Laravel can serve as the persistence/API layer, but the real-time sync is handled outside the broadcasting system.

### Key Finding 8: Managed vs Self-Hosted Is a DevOps Decision
- **Self-hosted (Reverb/Soketi)**: Full data control, no per-msg costs, requires operational expertise
- **Managed (Pusher/Ably)**: Zero ops, usage-based pricing, global edge network, multi-protocol
- **Hybrid (Laravel Cloud)**: Managed Reverb, integrates with Forge deployment, no infrastructure management

## Future Expansion Opportunities

1. **Laravel Cloud WebSocket skill**: Managed Reverb is new; patterns for deployment, scaling, and cost management will be valuable.
2. **CRDT/Yjs integration module**: Building a Laravel-native bridge for Yjs document synchronization with Reverb transport.
3. **SSE-first real-time architecture**: Leveraging SSE for most use cases with fallback patterns, reducing WebSocket complexity.
4. **Realtime testing framework**: Tools for testing broadcast events, channel auth, and reconnection behavior in CI/CD.
5. **Multi-tenant Reverb isolation**: Patterns for running multiple apps/tenants on a single Reverb infrastructure.
6. **Real-time data synchronization patterns**: Beyond events, syncing Eloquent model state changes to clients using model broadcasting + presence awareness.
7. **Edge WebSocket deployment**: Using Reverb with regional Redis replication for global low-latency real-time features.
8. **Octane + Reverb deep integration guide**: Best practices for running both in the same Swoole/RoadRunner/FrankenPHP process.

## Sources Consulted

1. Laravel Reverb Official Site & Docs — https://reverb.laravel.com & https://laravel.com/docs/reverb
2. Laravel Broadcasting Docs — https://laravel.com/docs/12.x/broadcasting
3. Laravel Echo DeepWiki — https://deepwiki.com/laravel/echo/2.3.2-private-channels (2026-04-15)
4. "Laravel Reverb: First-Party WebSockets, and the Scaling Reality" — Bubble.ro (2026-05-31)
5. "Building Real-Time Applications with Laravel Reverb in 2026" — TechBullion (2026-05-05)
6. "Laravel Reverb + Deploynix: Real-Time WebSockets in Production" — Deploynix (2026-04-08)
7. "Real-Time APIs: WebSockets vs SSE vs Long Polling 2026" — APIScout (2026-03-08)
8. "Best Realtime 2026: Socket.io vs Ably vs Pusher" — PkgPulse (2026-03-08)
9. "WebSocket vs SSE vs Long Polling: Choosing Real-time in 2025" — Potapov.me (2025-12-20)
10. "WebSocket vs Polling vs SSE — Choosing the Right Real-Time Strategy" — Codelit.io (2026-03-23)
11. "WebSockets vs Server-Sent Events: Key differences" — Ably Blog (2026-05-27)
12. "SSE's Glorious Comeback: Why 2025 is the Year of Server-Sent Events" — PortalZINE (2025-08-31)
13. "WebSocket vs SSE: Which One Should You Use?" — WebSocket.org (2026-03-10)
14. "Building Real-Time Applications with Laravel Reverb: From Live Chat to Collaborative Dashboards" — TechBullion (2026-05-05)
15. "Laravel Reverb vs Pusher vs Ably: Which Realtime Solution Is Worth It?" — Medium/AngsCode (2026-01-01)
16. Pusher Laravel Integration — https://pusher.com/laravel
17. "Pusher alternatives for local development with Laravel Broadcasting" — madewithlove.com (2025-02-18)
18. CVE-2026-23524 — GitHub Advisory GHSA-m27r-m6rx-mhm4 (2026-01-21)
19. "CVE-2026-23524: Laravel Reverb RCE via Insecure Deserialization" — StackShield (2026-05-19)
20. "Laravel Octane with FrankenPHP: 10x Application Performance" — Dev Blog (2026-05-01)
21. "Laravel Octane: Achieving Sub-50ms Response Times" — Richard Joseph Porter (2026-01-25)
22. "Implementing Server-Sent Events (SSE) in Laravel" — Medium/Ahmed Ebead (2024-04-24)
23. "Sending Server Sent Events (SSE) with Laravel" — Server Side Up (2025-12-09)
24. "How to Build Real-Time Notifications with Laravel Broadcasting and Pusher" — BuanaCoding (2026-05-02)
25. "Redis Pub/Sub vs Laravel Reverb: Real-Time Laravel at Its Best" — Dev.to (2025-08-01)
26. "CRDTs and Real-Time Collaboration: Building Conflict-Free Distributed Systems" — Zylos Research (2026-01-29)
27. "Building a Real-Time Collaboration Engine: CRDTs, OT, and Conflict Resolution" — Let's Build Solutions (2026-03-12)
28. "How to Implement Operational Transformation" — OneUptime (2026-01-30)
29. "Operational Transform vs CRDTs" — System Design Sandbox
30. "WebSocket Authentication: Best Practices for Secure Connections" — CodezUp (2025-03-19)
31. "How to Handle WebSocket Authentication" — OneUptime (2026-01-24)
32. "WebSocket Authentication: Tokens, Renewal & Security" — WebSocket.org (2026-03-13)
33. "Laravel Real-Time in 2026: Reverb, Echo, and the WebSocket Stack No One Talks About" — ApnaHive
34. "Real-Time Laravel: A Complete & Practical Guide to WebSockets with Reverb" — MasteryOfLaravel (2025-12-17)
35. "Best Alternatives To Laravel Reverb" — PieHost
