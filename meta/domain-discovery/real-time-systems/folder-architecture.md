# Folder Architecture: Real-Time Systems

```
real-time-systems/
│
├── domain-analysis.md                          # Full domain discovery document (this)
│
├── 01-broadcasting-architecture/
│   ├── overview.md                             # Laravel Broadcasting system overview
│   ├── should-broadcast-events.md              # Event creation, dispatch, serialization
│   ├── broadcast-drivers.md                    # Pusher, Reverb, Ably, Log, Null drivers
│   ├── queue-integration.md                    # Queue-backed broadcasting (sync vs async)
│   ├── broadcast-service-provider.md           # Registration, routing, bootstrapping
│   └── event-lifecycle-flow.md                 # Request → Event → Queue → Driver → WS → Client
│
├── 02-websocket-servers/
│   ├── laravel-reverb/
│   │   ├── installation.md                     # php artisan install:broadcasting, config
│   │   ├── configuration.md                    # .env vars, config/reverb.php, apps config
│   │   ├── starting-server.md                  # reverb:start, options, debugging
│   │   ├── pusher-protocol.md                  # Protocol compatibility, Echo integration
│   │   ├── reactphp-event-loop.md              # Underlying engine architecture
│   │   ├── frankenphp-engine.md                # FrankenPHP WebSocket support
│   │   ├── horizontal-scaling.md               # Redis pub/sub, REVERB_SCALING_ENABLED
│   │   ├── production-deployment.md            # Supervisor, Nginx, Docker, Forge
│   │   ├── laravel-cloud-managed.md            # Managed Reverb on Laravel Cloud
│   │   ├── cve-2026-23524.md                   # Insecure deserialization, fix, mitigations
│   │   ├── monitoring.md                       # Pulse, Prometheus, metrics, connections
│   │   └── best-practices.md                   # Tuning, allowed_origins, ping configuration
│   │
│   ├── pusher-channels/
│   │   ├── setup-integration.md                # Pusher PHP SDK, config/broadcasting.php
│   │   ├── pricing-scaling.md                  # Connection/message tiers, limits
│   │   ├── webhooks.md                         # Pusher webhooks (presence, events)
│   │   └── troubleshooting.md                  # Common issues, CORS, auth failures
│   │
│   ├── ably/
│   │   ├── setup-integration.md                # Ably SDK, Laravel broadcast driver
│   │   ├── enterprise-features.md              # Guaranteed delivery, global edge, history
│   │   ├── multi-protocol.md                   # WebSocket, SSE, MQTT, HTTP streaming
│   │   └── pricing-comparison.md               # Ably vs Pusher vs Reverb cost analysis
│   │
│   └── soketi/
│       ├── setup-configuration.md              # Docker/NPM install, Pusher protocol v7
│       ├── redis-nats-scaling.md               # Horizontal scaling adapters
│       ├── prometheus-monitoring.md             # Built-in Prometheus metrics
│       └── migration-from-echo-server.md        # From Laravel Echo Server to Soketi
│
├── 03-laravel-echo/
│   ├── overview.md                             # Echo architecture, monorepo structure
│   ├── core-api.md                             # channel(), private(), join(), listen()
│   ├── configuration.md                        # Connector setup, authEndpoint, headers
│   ├── connection-status.md                    # useConnectionStatus(), lifecycle events
│   ├── leave-disconnect.md                     # leaveChannel(), leave(), disconnect()
│   ├── framework-integrations/
│   │   ├── react.md                            # @laravel/echo-react hooks (useEcho, etc.)
│   │   ├── vue.md                              # @laravel/echo-vue composables
│   │   └── svelte.md                           # @laravel/echo-svelte runes
│   ├── reconnection-strategies.md              # Backoff, jitter, exponential retry
│   ├── error-handling.md                       # Connection failures, retry limits
│   └── testing.md                              # Mocking Echo in frontend tests
│
├── 04-channels/
│   ├── public-channels.md                      # Public subscription, no auth needed
│   ├── private-channels/
│   │   ├── overview.md                         # private- prefix, auth flow
│   │   ├── authorization.md                    # routes/channels.php callbacks
│   │   ├── auth-endpoint.md                    # /broadcasting/auth, Broadcast::routes()
│   │   ├── guards.md                           # Sanctum, Passport, JWT, custom guards
│   │   └── cors-middleware.md                  # CORS configuration for auth requests
│   │
│   └── presence-channels/
│       ├── overview.md                         # presence- prefix, user awareness
│       ├── authorization.md                    # Returning user data arrays
│       ├── here-joining-leaving.md             # Event callbacks for membership tracking
│       ├── ghost-members.md                    # Stale member cleanup, TTL configuration
│       ├── redis-membership.md                 # Redis-backed presence state store
│       └── scaling-considerations.md           # Cost of presence at scale
│
├── 05-security/
│   ├── tls-wss.md                              # SSL/TLS, Let's Encrypt, Nginx SSL termination
│   ├── channel-authorization.md                # Auth guards, policies, gates
│   ├── cors-origin-validation.md               # allowed_origins, CORS middleware
│   ├── cswsh-prevention.md                     # Cross-Site WebSocket Hijacking
│   ├── token-authentication.md                 # JWT, Bearer token, query param vs first-msg
│   ├── rate-limiting.md                        # Auth endpoint rate limiting
│   ├── message-validation.md                   # max_message_size, payload sanitization
│   ├── redis-security.md                       # Redis password, network isolation, ACLs
│   ├── cve-2026-23524.md                       # Details, impact, patching, workarounds
│   └── auditing-logging.md                     # Connection logs, auth attempts, anomalies
│
├── 06-sse-server-sent-events/
│   ├── overview.md                             # SSE concepts, text/event-stream protocol
│   ├── native-laravel-implementation.md        # response()->stream(), headers
│   ├── laravel-wave-package.md                 # qruto/laravel-wave: Echo-compatible SSE
│   ├── event-source-api.md                     # Client-side EventSource, auto-reconnect
│   ├── http2-multiplexing.md                   # Solving 6-connection limit with HTTP/2
│   ├── use-cases/
│   │   ├── ai-streaming.md                     # LLM token output streaming
│   │   ├── notification-feeds.md               # Live notification streams
│   │   └── dashboard-updates.md               # Live metric streaming
│   └── sse-vs-websocket-decision.md            # When SSE wins vs WebSocket
│
├── 07-transport-comparison/
│   ├── websocket-vs-sse.md                     # Full-duplex vs unidirectional analysis
│   ├── websocket-vs-long-polling.md            # Persistent connection vs HTTP simulation
│   ├── short-polling-vs-long-polling.md        # Fixed interval vs held connection
│   ├── decision-matrix.md                      # Latency, complexity, cost, browser support
│   ├── latency-benchmarks.md                   # Data from WebSocket.org, Timeplus studies
│   ├── bandwidth-comparison.md                 # Overhead per message, binary vs text
│   └── hybrid-approaches.md                   # Combining SSE + WebSocket per use case
│
├── 08-real-time-notifications/
│   ├── overview.md                             # Broadcast + database notification patterns
│   ├── broadcast-notifications.md              # ShouldBroadcast on Notification classes
│   ├── database-notifications.md               # Persistent notification storage
│   ├── notification-channels.md                # App.Models.User.{id} private channel
│   ├── mark-as-read.md                         # Read/unread state, real-time updates
│   ├── notification-bell-ui.md                 # Client-side badge count, toasts
│   └── queue-optimization.md                   # Dedicated queue for notifications
│
├── 09-real-time-dashboards/
│   ├── overview.md                             # Architecture for live updating dashboards
│   ├── laravel-pulse.md                        # Pulse integration, custom cards
│   ├── live-charts.md                          # Chart.js, ApexCharts with WebSocket data
│   ├── metric-streaming.md                     # CPU, memory, request rate real-time
│   ├── data-aggregation.md                     # Pre-aggregated metrics for real-time display
│   └── dashboard-scaling.md                    # Many viewers, efficient broadcast
│
├── 10-collaborative-editing/
│   ├── overview.md                             # Real-time collaboration requirements
│   ├── operational-transform/
│   │   ├── theory.md                           # OT principles, transformation functions
│   │   ├── google-docs-approach.md             # Centralized server-authoritative OT
│   │   └── implementation-patterns.md          # Server sequencing, TP1 property
│   │
│   └── crdt/
│       ├── theory.md                           # CRDT principles, state vs operation-based
│       ├── yjs-integration.md                  # Yjs docs, y-websocket, awareness
│       ├── automerge.md                        # Automerge 2.0, Rust core, JS bindings
│       ├── laravel-integration.md              # Laravel as persistence/API + Yjs sync
│       └── cursor-presence.md                  # Shared cursors, selections, awareness
│
├── 11-scaling-production/
│   ├── single-server-architecture.md           # One Reverb instance, sizing guidelines
│   ├── multi-server-horizontal-scaling.md      # Redis pub/sub, sticky LB, dedicated fleet
│   ├── load-balancer-configuration.md          # Nginx ip_hash, ALB sticky sessions
│   ├── dedicated-reverb-fleet.md               # Separate WS servers from app servers
│   ├── reconnection-storms.md                  # Jitter, backoff, rolling deploys
│   ├── redis-dependency.md                     # Pub/sub failure modes, HA Redis
│   ├── capacity-planning.md                    # Connections per server, memory per conn
│   ├── docker-kubernetes.md                    # Containerized Reverb, K8s patterns
│   ├── octane-interop.md                       # Running Reverb alongside Octane
│   └── performance-tuning.md                   # OS tuning, PHP config, connection limits
│
├── 12-deployment/
│   ├── supervisor-configuration.md             # reverb:start as daemon
│   ├── nginx-reverse-proxy.md                  # WebSocket upgrade, SSL termination
│   ├── laravel-forge.md                        # Forge deployment, Reverb recipe
│   ├── env-configuration.md                    # Environment-specific .env setup
│   ├── dns-subdomain-setup.md                  # ws.yourapp.com DNS, CNAME records
│   └── ci-cd-pipeline.md                       # Testing broadcast events in CI
│
├── 13-monitoring-observability/
│   ├── metrics-to-track.md                     # Active connections, msg/sec, auth latency
│   ├── laravel-pulse-reverb-card.md            # Custom Pulse card for Reverb stats
│   ├── prometheus-grafana.md                   # Prometheus metrics, Grafana dashboards
│   ├── health-check-endpoints.md               # Scheduled commands, WS ping monitoring
│   ├── alerting.md                             # Threshold-based alerts for connection drops
│   └── logging.md                              # Structured logs for broadcast activity
│
├── 14-testing/
│   ├── broadcasting-testing.md                 # Http/fake, Broadcast::fake()
│   ├── event-assertions.md                     # Assertion methods for broadcast events
│   ├── channel-auth-testing.md                 # Testing authorization callbacks
│   ├── echo-mocking.md                         # Mocking Laravel Echo in JS tests
│   └── load-testing.md                         # Artillery, k6 for WebSocket connections
│
├── 15-advanced-patterns/
│   ├── model-broadcasting.md                   # BroadcastsEvents trait, model events
│   ├── client-events-whisper.md                # Typing indicators, ephemeral events
│   ├── broadcasting-to-others.md              # broadcast()->toOthers(), sender exclusion
│   ├── event-name-customization.md             # broadcastAs() for client-friendly names
│   ├── multi-tenancy.md                        # Tenant-isolated channels, auth scoping
│   ├── cross-service-pub-sub.md                # Non-Laravel services broadcasting via HTTP
│   └── offline-support.md                      # Queueing missed events for offline clients
│
└── assets/
    ├── architecture-diagrams/
    │   ├── reverb-single-server-flow.png
    │   ├── reverb-horizontal-scaling.png
    │   ├── broadcasting-event-lifecycle.png
    │   ├── private-channel-auth-flow.png
    │   ├── presence-channel-membership.png
    │   └── websocket-vs-sse-vs-polling.png
    ├── decision-tables/
    │   ├── realtime-transport-selection.csv
    │   ├── websocket-server-comparison.csv
    │   └── channel-type-selection.csv
    └── templates/
        ├── reverb-config-template.php
        ├── echo-config-template.js
        ├── nginx-ws-proxy-template.conf
        └── supervisor-reverb-template.conf
```

### Key Files Summary

| Path | Purpose |
|------|---------|
| `02-websocket-servers/laravel-reverb/` | Core Reverb knowledge: install, config, scaling, production |
| `04-channels/private-channels/` | Private channel auth: routes, guards, endpoint, CORS |
| `05-security/` | Full security posture: TLS, auth, CORS, CSWSH, rate limiting |
| `06-sse-server-sent-events/` | SSE: implementation, packages, use cases, vs WebSocket |
| `07-transport-comparison/` | Decision framework: WS vs SSE vs polling benchmarks |
| `09-real-time-dashboards/` | Live dashboards: Pulse, charts, metric streaming |
| `10-collaborative-editing/` | OT and CRDT theory, Yjs/Automerge integration |
| `11-scaling-production/` | Production scaling: single to multi-server, reconnection storms |
| `15-advanced-patterns/` | Model broadcasting, whispers, multi-tenancy, offline support |

### File Naming Convention
- `kebab-case.md` for all documentation files
- `config-*.conf` for configuration templates
- `*.csv` for decision tables
- `*.png` for diagrams
- Section numbers (`01-`, `02-`, etc.) indicate logical dependency order, not strict reading order
