# Metadata
Domain: Real-Time Systems
Subdomain: WebSocket Servers
Knowledge Unit: Ably Integration & Enterprise Features
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Ably is an enterprise-grade managed real-time platform that integrates with Laravel broadcasting as a first-party driver. Installation via `php artisan install:broadcasting --ably` scaffolds the Ably PHP SDK configuration. Ably differentiates from Pusher and Reverb through guaranteed message delivery (at-least-once exactly-once), a global edge network across 205+ PoPs, multi-protocol support (WebSocket, SSE, MQTT, HTTP streaming), and built-in features like message history, presence, and space (multi-user cursor/selection sync). The free tier provides 6M messages/month and 200 concurrent connections. Laravel's Ably driver uses the `Ably\Laravel\Broadcaster` class, which wraps Ably's PHP SDK.

## Core Concepts
Ably's architecture is channel-based, similar to Pusher, but with fundamentally different delivery guarantees. Where Pusher and Reverb use fire-and-forget delivery, Ably uses a global distributed queue system with acknowledged delivery. Ably channels support message history (configurable retention), presence (user state), and occupancy (connection counts). The platform provides token-based authentication via Ably tokens or JWT. For enterprise use cases, Ably offers guaranteed ordering, exactly-once delivery, and compliance certifications (SOC 2, HIPAA, GDPR).

## Mental Models
Ably is a "real-time message broker as a service." Unlike Reverb (your own server) or Pusher (WebSocket hosting), Ably acts as a distributed, redundant message backbone with guaranteed delivery, message replay, and multi-region failover built in.

## Internal Mechanics
The Laravel Ably driver creates an Ably REST client that communicates with Ably's HTTP API. When broadcasting, the driver publishes messages to specified Ably channels. Ably's edge network receives the message and fans it out to all subscribed clients in the appropriate region. Client-side Echo connects to Ably via the Pusher protocol (Ably also supports direct Ably protocol with its own SDK). The `AblyKey` is used for server-side publishing; client connections use token authentication (generated server-side or via Ably's Token API). Ably's distributed architecture means messages are persisted across multiple data centers before acknowledgment.

## Patterns
- **Guaranteed delivery**: Messages are persisted in Ably's queue system before acknowledgment; at-least-once delivery is default
- **Token-based authentication**: Server generates ephemeral tokens for client connections, avoiding key exposure
- **Multi-protocol gateway**: Ably translates between WebSocket, SSE, MQTT, and HTTP streaming transparently
- **Global edge distribution**: Messages are published to the nearest edge node and replicated globally

## Architectural Decisions
- **Persistent message queue under WebSocket**: Unlike Pusher/Reverb's fire-and-forget, Ably enqueues messages for guaranteed delivery
- **Edge network as differentiator**: 205+ PoPs reduce latency for global user bases
- **Multi-protocol abstraction**: Single API publishes to all protocol endpoints; client chooses the protocol
- **Token auth as default**: Encourages secure client connections over static API keys

## Tradeoffs
- **Higher complexity than Pusher**: More features mean more configuration surface area
- **Cost at extreme scale**: The free tier is generous (6M messages/month), but enterprise pricing is premium
- **Protocol abstraction leaks**: Some Ably features (history, space, exactly-once) are not exposed through Laravel's generic broadcasting interface
- **No full self-hosting option**: Unlike Reverb or Soketi, Ably is exclusively managed—you cannot self-host
- **Overkill for simple use cases**: Teams needing only basic channel broadcasting benefit more from Reverb's simplicity

## Performance Considerations
- Global edge network reduces latency for geographically distributed users (vs single-region Reverb)
- Guaranteed delivery adds acknowledgment overhead vs fire-and-forget
- Ably claims <20ms global publish latency from any edge location
- Message history and persistence consume storage; retention policy controls costs
- Channel occupancy tracking adds minimal overhead but enables capacity planning

## Production Considerations
- Configure token authentication for client connections (never expose `ABLY_KEY` in client code)
- Set `ABLY_LOG_LEVEL=error` in production (debug logging is verbose)
- Implement Ably webhooks for presence events, channel lifecycle, and error monitoring
- Configure message retention based on compliance and replay requirements
- Monitor Ably dashboard for connection count, message throughput, and error rates
- Use Ably's channel rules for encrypting messages at rest and in transit
- Set `max_message_size` per channel to prevent oversized payload issues

## Common Mistakes
- Exposing the Ably API key in client-side code (use token authentication)
- Not configuring message retention limits, causing unbounded storage growth
- Using Ably for simple server-to-client broadcasting when Reverb would suffice
- Not handling Ably rate limits gracefully (HTTP 429 responses)
- Assuming Laravel's broadcast interface exposes Ably's enterprise features (history, space, etc.)

## Failure Modes
- **Token expiry**: Client tokens expire without renewal, dropping authenticated connections
- **Rate limit exceeded**: Ably enforces per-app message rate limits; bursts trigger throttling
- **Connection quota hit**: Concurrent connection cap prevents new connections
- **Region failover**: Ably routes around failed regions transparently, but failover may cause brief interruption
- **SDK incompatibility**: Version mismatch between Ably PHP SDK and Laravel Ably driver causes broadcast failures

## Ecosystem Usage
- Enterprise applications requiring guaranteed message delivery and compliance certifications
- Multi-region applications needing global WebSocket edge distribution
- IoT applications using MQTT protocol alongside WebSocket broadcasting
- Applications needing exactly-once delivery semantics for financial or audit data
- Real-time collaboration features requiring Ably Spaces (shared cursors, selections)

## Related Knowledge Units
- K03: Reverb Installation & Configuration
- K06: Pusher Channels Integration
- K18: WebSocket vs SSE vs Polling Decision Framework
- K38: Serverless WebSocket Limitations

## Research Notes
Ably's Laravel integration uses a custom broadcast driver (`Ably\Laravel\Broadcaster`) rather than a generic Pusher-compatible one. The `ably` option in `install:broadcasting` was added in Laravel 11. Ably's Spaces feature (multi-user cursor synchronization) is a unique differentiator for collaborative applications. The 6M messages/month free tier is significantly more generous than Pusher's 200K/day. As of 2026, Ably has 205+ edge PoPs globally and supports multi-protocol connections including MQTT for IoT use cases extending beyond traditional WebSocket broadcasting.
