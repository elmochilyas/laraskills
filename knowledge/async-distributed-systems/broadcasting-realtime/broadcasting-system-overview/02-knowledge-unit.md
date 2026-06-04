# Metadata
Domain: Async & Distributed Systems
Subdomain: Broadcasting & Real-Time
Knowledge Unit: Broadcasting System Overview (Pusher, Reverb, Ably)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Laravel's broadcasting system provides a pub/sub mechanism for pushing real-time events from the server to connected clients over WebSockets. The system is abstracted into three layers: the broadcasting driver (Pusher, Reverb, Ably), the event→channel mapping (via `ShouldBroadcast`), and the client-side consumption (Laravel Echo). Events are broadcast on named channels with optional authentication (private, presence). The architecture supports multiple drivers behind a consistent server-side API, with the broadcast event flow being: PHP event dispatch → job queue (for async) → broadcasting driver → WebSocket → Echo client callback.

# Core Concepts
- **Drivers**: Pusher (SaaS WebSocket), Reverb (self-hosted, Laravel-native), Ably (SaaS real-time), `log` (debug), `null` (disable).
- **`ShouldBroadcast`**: Interface marking an event for broadcasting. The event's `broadcastOn()` returns the channels.
- **Channels**: `public` (anyone can listen), `private` (auth required), `presence` (auth + user state tracking).
- **Echo**: JavaScript library that subscribes to channels and listens for events. Abstracts driver differences.
- **`install:broadcasting`**: Artisan command that scaffolds broadcasting configuration, Reverb installation, and Echo setup.

# Mental Models
- **Radio station**: The Laravel app is the radio station. Broadcasting events = airing shows. Echo = the radio receiver in users' browsers. Channels = radio frequencies. Private channels = encrypted frequencies.
- **Pub/sub**: The server publishes events to channels. Clients subscribe to channels. The broadcaster delivers the message to all subscribers.

# Internal Mechanics
- A broadcast event implements `ShouldBroadcast`, which itself implements `ShouldQueue`.
- On `event(new OrderShipped)`, the event is dispatched.
- The dispatcher detects `ShouldBroadcast`, creates a `CallQueuedBroadcast` job.
- The job calls `$this->broadcastManager->dispatch($this->event)`.
- The broadcasting manager uses the configured driver (`pusher`, `reverb`, `ably`) to send the event payload to the channel.
- The driver sends the event data over WebSocket (or HTTP polling fallback for Pusher).
- Clients connected to the WebSocket server receive the event, match it to subscribed channels, and trigger Echo callbacks.
- For Reverb: the self-hosted WebSocket server (FrankenPHP) stores channel state in memory, scales via multiple processes sharing Redis.

# Patterns
## Thin Broadcast Events
- **Purpose**: Keep broadcast event payloads minimal.
- **Benefit**: Faster serialization, lower WebSocket message size.
- **Tradeoff**: Clients may need to fetch additional data from API.

## Private Channel Authentication
- **Purpose**: Restrict channel access to authorized users.
- **Benefit**: Sensitive data (user-specific notifications) is protected.
- **Tradeoff**: Auth callback is called per subscription; latency overhead.

## Presence Channel State
- **Purpose**: Track connected users on a channel (who's online).
- **Benefit**: "User is typing" indicators, online user lists.
- **Tradeoff**: State management complexity; channel join/leave events.

# Architectural Decisions
- **Use Reverb for self-hosted**: Full control, no per-connection cost, Laravel-native. Best for high-volume or sensitive-data apps.
- **Use Pusher for SaaS simplicity**: Zero server management, 99.9% uptime SLA, global edge network. Best for small-mid apps.
- **Use Ably for**: Global scale with presence, history, and guaranteed delivery. More features than Pusher.
- **Use `log` driver for development: Debug broadcast events without WebSocket infrastructure.

# Tradeoffs
Reverb (self-hosted) | No per-connection fees, full control, FrakenPHP performance | Operational overhead; scaling requires multiple processes
Pusher (SaaS) | Zero management, global edge, SLA | Per-connection cost; data egress limits
Ably (SaaS) | Advanced features (history, presence, guaranteed delivery) | Higher cost; more complex setup

# Performance Considerations
- Broadcast events are queued by default (`ShouldBroadcast` extends `ShouldQueue`). The actual WebSocket push is async.
- For real-time needs, use `ShouldBroadcastNow` — this bypasses the queue and pushes immediately in the current process.
- Reverb uses FrankenPHP, which maintains persistent PHP processes. No bootstrapping overhead per request.
- Each broadcast event creates a queue job. High broadcast volume + queued delivery = queue backlog.
- WebSocket connection count is limited by server resources (file descriptors, memory). Plan for concurrent connections.

# Production Considerations
- Use `ShouldBroadcastNow` only for truly time-sensitive events (chat messages, cursor positions). Most events can tolerate a 1-2 second queue delay.
- Monitor Reverb server resources (open files, memory, active connections). Scale vertically or via multiple processes.
- For Reverb behind Nginx, configure proper WebSocket proxy (`Upgrade` headers, proxy_read_timeout).
- For Pusher, monitor channel connection limits per plan. Exceeding limits results in connection rejection.
- Broadcast event payloads are serialized and pushed over WebSocket. Keep payloads small (<10KB).

# Common Mistakes
- **Using `ShouldBroadcast` for everything**: Not all events need real-time delivery. Use `ShouldBroadcast` selectively for user-facing features.
- **Not using `ShouldBroadcastNow` for time-sensitive events**: Chat messages queued with `ShouldBroadcast` may arrive 5-10 seconds late. Use `ShouldBroadcastNow`.
- **Broadcasting sensitive data on public channels**: User emails, personal data on public channels is accessible to anyone listening.
- **Not configuring CORS for Reverb**: Browser WebSocket connections from different origins require `Access-Control-Allow-Origin` headers.

# Failure Modes
- **WebSocket server down**: Clients fall back to HTTP long-polling (Pusher) or disconnect (Reverb). No real-time delivery until server recovers.
- **Connection limits exceeded**: Pusher plan limits max connections. Exceeding causes new connections to be rejected.
- **Broadcast queue backlog**: High broadcast volume without enough workers — events delivered minutes late.
- **SSL certificate issues for WSS**: Browsers reject WebSocket connections without valid SSL. Ensure WSS endpoint is properly configured.

# Ecosystem Usage
- **Laravel framework**: Broadcasting managed via `BroadcastManager`. Reverb bundled as first-party WebSocket server.
- **Laravel Echo**: Official JavaScript client for broadcasting. Integrates with Vue, React, and Alpine.js.
- **Spatie packages**: Some packages emit broadcast events for real-time UI updates (e.g., spatie/laravel-model-status).

# Related Knowledge Units
- K031 Laravel Reverb — WebSocket Server (deep dive) | K032 Channel Types (auth mechanics) | K033 Laravel Echo Client (client-side)

## Research Notes
- Laravel Reverb (first-party WebSocket server) uses a custom protocol over PHP sockets, bypassing the need for Node.js or Pusher — it maintains persistent connections via the eact/promise async library.
- Reverb scales horizontally via a Redis pub/sub backend — each Reverb instance subscribes to all channels, and messages are broadcast across instances through Redis channels.
- Laravel Echo is the client-side JavaScript library that subscribes to channels and listens for events — v2 added native TypeScript support and a composable API for Vue/React integration.
- Channel types in Laravel Broadcasting (public, private, presence) each have distinct authorization approaches — private channels call an authorization callback, presence channels additionally broadcast a here and joining/leaving event.
- Reverb production deployment requires proper process management (Supervisor), SSL termination (Nginx/Caddy), and connection limits — each WebSocket connection consumes ~8KB of memory on the server.
- The broadcasting system overview from Laravel's perspective is a simple event-to-channel mapping — shouldBroadcast interface events are serialized and pushed to the configured broadcaster driver.
- Reverb's scaling characteristics depend on Redis throughput — a single Redis instance can support approximately 10,000 concurrent Reverb connections before saturation.
- Community benchmarks show Reverb outperforming Pusher for self-hosted deployments, with sub-50ms latency for message delivery across 2000+ concurrent connections on modest hardware.
