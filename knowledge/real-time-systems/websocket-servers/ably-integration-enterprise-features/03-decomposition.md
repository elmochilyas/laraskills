# Decomposition: Ably Integration Enterprise Features

## Topic Overview
Ably is an enterprise-grade managed real-time platform that integrates with Laravel broadcasting as a first-party driver. Installation via `php artisan install:broadcasting --ably` scaffolds the Ably PHP SDK configuration. Ably differentiates from Pusher and Reverb through guaranteed message delivery (at-least-once exactly-once), a global edge network across 205+ PoPs, multi-protocol support (WebSocket, SSE, MQTT, HTTP streaming), and built-in features like message history, presence, and spac...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
websocket-servers/K07-ably-integration-enterprise-features/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Ably Integration Enterprise Features
- **Purpose:** Ably is an enterprise-grade managed real-time platform that integrates with Laravel broadcasting as a first-party driver. Installation via `php artisan install:broadcasting --ably` scaffolds the Ably PHP SDK configuration. Ably differentiates from Pusher and Reverb through guaranteed message delivery (at-least-once exactly-once), a global edge network across 205+ PoPs, multi-protocol support (WebSocket, SSE, MQTT, HTTP streaming), and built-in features like message history, presence, and spac...
- **Difficulty:** Intermediate
- **Dependencies:
  - K03: Reverb Installation & Configuration
  - K06: Pusher Channels Integration
  - K18: WebSocket vs SSE vs Polling Decision Framework
  - K38: Serverless WebSocket Limitations

## Dependency Graph
**Depends on:**
  - K03: Reverb Installation & Configuration
  - K06: Pusher Channels Integration
  - K18: WebSocket vs SSE vs Polling Decision Framework
  - K38: Serverless WebSocket Limitations

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Guaranteed delivery**: Messages are persisted in Ably's queue system before acknowledgment; at-least-once delivery is default**Token-based authentication**: Server generates ephemeral tokens for client connections, avoiding key exposure**Multi-protocol gateway**: Ably translates between WebSocket, SSE, MQTT, and HTTP streaming transparently**Global edge distribution**: Messages are published to the nearest edge node and replicated globally**Persistent message queue under WebSocket**: Unlike Pusher/Reverb's fire-and-forget, Ably enqueues messages for guaranteed delivery**Edge network as differentiator**: 205+ PoPs reduce latency for global user bases**Multi-protocol abstraction**: Single API publishes to all protocol endpoints; client chooses the protocol**Token auth as default**: Encourages secure client connections over static API keys**Higher complexity than Pusher**: More features mean more configuration surface area**Cost at extreme scale**: The free tier is generous (6M messages/month), but enterprise pricing is premium**Protocol abstraction leaks**: Some Ably features (history, space, exactly-once) are not exposed through Laravel's generic broadcasting interface**No full self-hosting option**: Unlike Reverb or Soketi, Ably is exclusively managed—you cannot self-host**Overkill for simple use cases**: Teams needing only basic channel broadcasting benefit more from Reverb's simplicityGlobal edge network reduces latency for geographically distributed users (vs single-region Reverb)Guaranteed delivery adds acknowledgment overhead vs fire-and-forgetAbly claims <20ms global publish latency from any edge locationMessage history and persistence consume storage; retention policy controls costsChannel occupancy tracking adds minimal overhead but enables capacity planningConfigure token authentication for client connections (never expose `ABLY_KEY` in client code)Set `ABLY_LOG_LEVEL=error` in production (debug logging is verbose)Implement Ably webhooks for presence events, channel lifecycle, and error monitoringConfigure message retention based on compliance and replay requirementsMonitor Ably dashboard for connection count, message throughput, and error ratesUse Ably's channel rules for encrypting messages at rest and in transitSet `max_message_size` per channel to prevent oversized payload issuesExposing the Ably API key in client-side code (use token authentication)Not configuring message retention limits, causing unbounded storage growthUsing Ably for simple server-to-client broadcasting when Reverb would sufficeNot handling Ably rate limits gracefully (HTTP 429 responses)Assuming Laravel's broadcast interface exposes Ably's enterprise features (history, space, etc.)**Token expiry**: Client tokens expire without renewal, dropping authenticated connections**Rate limit exceeded**: Ably enforces per-app message rate limits; bursts trigger throttling**Connection quota hit**: Concurrent connection cap prevents new connections**Region failover**: Ably routes around failed regions transparently, but failover may cause brief interruption**SDK incompatibility**: Version mismatch between Ably PHP SDK and Laravel Ably driver causes broadcast failuresEnterprise applications requiring guaranteed message delivery and compliance certificationsMulti-region applications needing global WebSocket edge distributionIoT applications using MQTT protocol alongside WebSocket broadcastingApplications needing exactly-once delivery semantics for financial or audit dataReal-time collaboration features requiring Ably Spaces (shared cursors, selections)K03: Reverb Installation & ConfigurationK06: Pusher Channels IntegrationK18: WebSocket vs SSE vs Polling Decision FrameworkK38: Serverless WebSocket Limitations

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization