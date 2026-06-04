# Metadata
Domain: Real-Time Systems
Subdomain: Transport Comparison
Knowledge Unit: WebSocket vs SSE vs Polling Decision Framework
Difficulty Level: Foundation
Last Updated: 2026-06-02

## Executive Summary
Choosing the correct real-time transport depends on directionality, latency requirements, infrastructure constraints, and browser support. The four primary options are WebSocket (full-duplex, ~20ms latency, 98%+ browser support), SSE (unidirectional server-to-client, ~50ms latency, 96% support, auto-reconnect), Long Polling (simulated real-time, ~100-200ms latency, universal support), and Short Polling (fixed-interval, latency = interval, simplest implementation). The 2026 consensus decision: use SSE for server-to-client only scenarios (notifications, dashboards, AI streaming), WebSocket for bidirectional needs (chat, gaming, collaborative editing), Long Polling as HTTP-only fallback, and Short Polling only for low-frequency updates (>30s intervals).

## Core Concepts
Transport selection is driven by: (1) directionality—does the client need to push real-time data to the server? (2) latency requirements—how fast must events reach clients? (3) infrastructure—does the environment support persistent connections and WebSocket upgrades? (4) scale—how many concurrent connections and what message throughput? WebSocket provides persistent bidirectional TCP connections after an HTTP upgrade. SSE provides persistent unidirectional HTTP streaming. Long polling maintains the illusion of real-time by holding HTTP requests open. Short polling makes periodic HTTP requests at fixed intervals.

## Mental Models
- **WebSocket**: Telephone call—both parties can speak at any time, persistent connection
- **SSE**: Radio broadcast—one-way transmission, listener tunes in
- **Long Polling**: Walkie-talkie—press to talk, release to listen, simulated two-way
- **Short Polling**: Checking the mail every N minutes

## Internal Mechanics
**WebSocket** (RFC 6455): HTTP upgrade request with `Upgrade: websocket` and `Connection: Upgrade` headers. Server responds with 101 Switching Protocols. Connection transitions to binary framing protocol. Frames have 2-10 byte overhead. Ping/pong for keepalive. **SSE** (HTML5): Server sets `Content-Type: text/event-stream`. Data sent as `data: ...\n\n` text format. `EventSource` API parses the stream. Auto-reconnect with `Last-Event-ID`. **Long Polling**: Client sends HTTP request. Server holds connection until data available or timeout. Server responds with data. Client immediately re-requests. **Short Polling**: Client sends HTTP request at fixed interval. Server responds immediately (empty or with data). No held connections.

## Patterns
- **Directionality-first decision**: Is bidirectional needed? If no, SSE is almost always the correct default
- **SSE + HTTP POST for bidirectional-like**: SSE for server push, regular POST for client actions—avoids WebSocket complexity
- **Long polling as fallback**: Use when WebSocket/SSE are blocked by corporate proxies or legacy infrastructure
- **Progressive enhancement**: Start with WebSocket, fall back to SSE, then long polling based on browser capabilities

## Architectural Decisions
- **WebSocket for bidirectional**: Chat, gaming, collaborative editing, financial tickers require full-duplex
- **SSE for server-to-client**: Notifications, dashboards, AI streaming, live logs—80% of real-time use cases
- **Long polling for compatibility**: Enterprise environments, IE11 support, restrictive firewalls
- **Short polling for simplicity**: Low-frequency updates on simple infrastructure, admin panels with relaxed freshness

## Tradeoffs
- **WebSocket infrastructure cost**: Sticky sessions, custom heartbeat, proxy configuration, auth complexity
- **SSE connection limits**: 6 per domain on HTTP/1.1 (removed by HTTP/2); unidirectional limitation
- **Long polling overhead**: Full HTTP headers per event (~800 bytes), held connections consume server resources
- **Short polling waste**: Bandwidth and CPU consumed proportionally to polling frequency regardless of data availability
- **SSE auto-reconnect advantage**: Built-in Last-Event-ID replay vs. custom implementation for WebSocket/long polling

## Performance Benchmarks (10k concurrent connections, per BirJob 2026)
| Metric | Long Polling | SSE | WebSocket |
|---|---|---|---|
| Memory (10k conn) | 1.8 GB | 0.6 GB | 0.4 GB |
| CPU (idle) | 45% | 8% | 5% |
| Latency p50 | 15,000ms | 12ms | 8ms |
| Latency p99 | 30,000ms | 45ms | 22ms |
| Bandwidth (idle) | ~2KB/request | ~0.1KB/heartbeat | ~0.06KB/ping |

## Production Considerations
- Default to SSE for new projects unless bidirectional is required (the 80% rule)
- Use HTTP/2 to eliminate SSE's 6-connection limit
- Implement WebSocket only when latency must be <50ms AND bidirectional
- Long polling should be the fallback, not the primary choice
- Short polling is appropriate for intervals >30s on small user bases
- Test transport choice with realistic network conditions (mobile, corporate proxy, high latency)
- Consider hybrid approaches: WebSocket for active components, SSE for passive updates

## Common Mistakes
- Defaulting to WebSocket for all real-time features when SSE would suffice (unnecessary complexity and cost)
- Not considering SSE for bidirectional workloads that can be split into SSE + POST pattern
- Using long polling when SSE is supported (more CPU/memory/bandwidth than needed)
- Ignoring HTTP/2 adoption when choosing SSE (the 6-connection limit is becoming irrelevant)
- Choosing WebSocket for infrastructure that cannot support sticky sessions or WebSocket upgrades

## Failure Modes
- **WebSocket behind restrictive proxy**: Corporate firewall blocks upgrade request; connection fails silently
- **SSE connection queue**: HTTP/1.1 6-connection limit hit; new EventSource requests queue indefinitely
- **Long polling server exhaustion**: Held connections consume all server threads; application becomes unresponsive
- **Short polling interval mismatch**: Interval too short = high overhead; interval too long = stale data
- **Mobile network drop**: Persistent connections (WebSocket/SSE) drop frequently; reconnection strategy critical

## Ecosystem Usage
- WebSocket: Laravel Reverb, Pusher, Ably, Soketi for chat, collaboration, gaming
- SSE: AI streaming (Claude, ChatGPT), Laravel Wave, live dashboards, notification feeds
- Long polling: Legacy Laravel apps without broadcasting, enterprise environments
- Short polling: Admin dashboards, status pages, non-critical updates

## Related Knowledge Units
- K16: SSE Implementation in Laravel
- K03: Reverb Installation & Configuration
- K17: Laravel Wave SSE Package
- K19: Real-Time Notifications (Broadcast + Database)

## Research Notes
The WebSocket vs SSE decision has shifted in 2025-2026. Industry analysis (Ably Blog, WebSocket.org, Potapov.me) consistently recommends SSE as the default for server-to-client use cases. HTTP/2 adoption (70%+ as of 2026) removes SSE's main limitation. The "SSE + POST" pattern is increasingly common for bidirectional-adjacent use cases. The 2026 decision matrix from multiple sources converges on: bidirectional → WebSocket, server-to-client → SSE, legacy compatibility → long polling, low frequency → short polling. WebSocket memory advantage over SSE (0.4 GB vs 0.6 GB for 10k connections) is negligible for most deployments.

## Performance Considerations

- **WebSocket connection overhead**: Each open WebSocket connection consumes memory on the server (~50-100KB per connection idle). For 10,000 concurrent connections, expect 500MB-1GB of memory usage.
- **Message throughput**: Reverb processes 10,000-50,000 messages per second on a single node depending on message size and Redis performance. Horizontal scaling with Redis pub/sub increases throughput linearly.
- **Latency profile**: End-to-end latency from event dispatch to client receipt ranges from 5-50ms for Reverb (local Redis) to 50-200ms for Pusher/Ably (network transit).
- **Redis bottleneck**: In scaled Reverb deployments, Redis pub/sub throughput is the limiting factor. Monitor Redis CPU and memory. Use Redis Cluster for high-throughput scenarios.
- **Connection storms**: When many clients reconnect simultaneously (e.g., after a server restart), the Redis pub/sub channels and WebSocket handshake endpoints can be overwhelmed. Implement exponential backoff with jitter on the client side.
- **Memory per channel**: Presence channels maintain member state in Redis. Each member stores user ID and metadata. For channels with 10,000+ members, estimate 2-5MB per channel in Redis.
