# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Broadcasting & Real-Time
- **Knowledge Unit:** K030 — Broadcasting System Overview
- **Knowledge ID:** K030
- **Difficulty Level:** Foundation
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Broadcasting
  - Laravel Source — `Illuminate\Broadcasting\BroadcastManager`
  - Laravel Echo documentation

---

# Overview

Laravel's broadcasting system provides a pub/sub mechanism for pushing real-time events from the server to connected clients over WebSockets. The system is abstracted into three layers: the broadcasting driver (Pusher, Reverb, Ably), the event→channel mapping (via `ShouldBroadcast`), and the client-side consumption (Laravel Echo). Events are broadcast on named channels with optional authentication (private, presence). The broadcast event flow is: PHP event dispatch → job queue (for async) → broadcasting driver → WebSocket → Echo client callback.

---

# Core Concepts

- **Drivers:** Pusher (SaaS WebSocket), Reverb (self-hosted, Laravel-native), Ably (SaaS real-time), `log` (debug), `null` (disable).
- **ShouldBroadcast:** Interface marking an event for broadcasting. The event's `broadcastOn()` returns the channels.
- **Channels:** `public` (anyone can listen), `private` (auth required), `presence` (auth + user state tracking).
- **Echo:** JavaScript library that subscribes to channels and listens for events. Abstracts driver differences.
- **install:broadcasting:** Artisan command that scaffolds broadcasting configuration, Reverb installation, and Echo setup.
- **ShouldBroadcastNow:** Interface for bypassing the queue and broadcasting immediately in the current process.

---

# When To Use

- Real-time UI updates — new orders, notifications, chat messages, live feeds
- Collaborative features — shared document editing, live cursors, typing indicators
- Dashboards and monitoring — live metrics, server status, deployment progress
- Any feature where polling would be wasteful and sub-second delivery matters

---

# When NOT To Use

- Non-real-time features that can tolerate seconds of delay — use standard queue jobs instead
- Server-to-server communication — use queues or message distribution systems
- Features that need guaranteed delivery with persistence — broadcasting loses messages on disconnect
- Mobile or CLI clients — Echo is browser-focused; use native WebSocket clients instead

---

# Best Practices

- **Keep broadcast event payloads minimal.** Fast serialization, small WebSocket message size. Clients should fetch additional data from the API if needed. *Why: Large payloads increase serialization time, WebSocket message size, and client-side processing overhead.*
- **Use `ShouldBroadcastNow` selectively.** Only for truly time-sensitive events (chat, cursor positions). Most events tolerate a 1-2 second queue delay. *Why: Every broadcast creates a queue job — high volume + queued delivery = queue backlog.*
- **Never broadcast sensitive data on public channels.** All public channel subscribers receive the data. *Why: Public channels have no authentication — any listener with the channel name can subscribe.*
- **Monitor broadcast queue backlog.** High broadcast volume without enough workers delays event delivery. *Why: Broadcast events are queued by default — worker saturation directly impacts real-time freshness.*

---

# Architecture Guidelines

- The broadcast flow is: `event()` → `ShouldBroadcast` detection → `CallQueuedBroadcast` job → queue worker → broadcasting driver → WebSocket → Echo.
- Broadcast events implement `ShouldQueue` implicitly through `ShouldBroadcast`. Every broadcast event is a queue job.
- The broadcasting manager uses the configured driver to send event payloads to channels. Each driver has its own transport mechanism.
- For Reverb, the self-hosted WebSocket server stores channel state in memory and scales via multiple processes sharing Redis.
- The `log` driver is ideal for development — it writes broadcast events to the log file without WebSocket infrastructure.
- Broadcasting is for server-to-client push only. Client-to-server communication uses standard HTTP requests.

---

# Performance Considerations

- Broadcast events are queued by default — WebSocket push is async to the request.
- For real-time needs, use `ShouldBroadcastNow` to bypass the queue and push immediately.
- Each broadcast event creates a queue job — high volume without enough workers = backlog.
- WebSocket connection count is limited by server resources (file descriptors, memory).
- Reverb uses FrankenPHP persistent processes — no bootstrapping overhead per message.
- Pusher plan connection limits cause rejection on exceeded connections.

---

# Security Considerations

- Private channel authorization requires a valid authenticated session and a registered auth callback.
- Presence channel auth callbacks must return only serializable user data — never expose tokens, hashes, or internal IDs.
- Channel auth endpoint (`/broadcasting/auth`) must be protected against CSRF — Echo includes the CSRF token in auth requests.
- Public channels provide no access control — any client with the channel name can subscribe and receive events.
- Broadcast payloads should never include sensitive personally identifiable information (PII).

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Broadcasting all events | Using `ShouldBroadcast` for every event | Unnecessary queue load and WebSocket traffic | Only implement `ShouldBroadcast` for user-facing real-time features |
| Not using `ShouldBroadcastNow` for time-sensitive events | Chat or cursor events queued | 5-10 second delivery delay | Use `ShouldBroadcastNow` for sub-second delivery needs |
| Public channels for user data | Broadcasting user notifications on public channels | Any listener can intercept user-specific data | Always use private channels for user-specific data |
| No CORS config for Reverb | Browser WebSocket connections from different origins | Connection blocked by browser | Configure `Access-Control-Allow-Origin` headers |

---

# Anti-Patterns

- **Broadcasting as primary data transport:** Using WebSockets for data that should be fetched via API. Broadcasting is push-only — clients should not depend on it as the sole data source.
- **Giant broadcast payloads:** Including full model serializations (entire user objects, complete order data) in broadcast events. Use IDs and let clients fetch details.
- **No fallback for disconnected clients:** Assuming all clients are always connected. Design the UI to fetch initial state on load and use broadcasts for subsequent updates.
- **Over-relying on broadcasting for server-to-server communication:** Broadcasting is designed for server-to-client push. Use queues or message brokers for server-to-server patterns.

---

# Examples

```php
// Broadcast event with minimal payload
class OrderShipped implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $orderId,
        public string $status,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('orders.'.$this->orderId)];
    }

    public function broadcastAs(): string
    {
        return 'order.shipped';
    }
}

// Immediate broadcast for time-sensitive events
class ChatMessageSent implements ShouldBroadcastNow
{
    public function broadcastOn(): array
    {
        return [new PresenceChannel('chat.'.$this->roomId)];
    }
}
```

---

# Related Topics

- **K031 Laravel Reverb (K031)** — WebSocket server deep dive
- **K032 Channel Types (K032)** — Auth mechanics for private/presence channels
- **K033 Laravel Echo Client (K033)** — Client-side consumption patterns
- **K034 Reverb Production Deployment (K034)** — SSL, Nginx, production configuration
- **K035 Reverb Scaling (K035)** — Multi-process scaling with Redis

---

# AI Agent Notes

- When generating broadcast-related code, determine the driver (Pusher/Reverb/Ably) from the project config. Reverb requires additional process management guidance.
- `ShouldBroadcast` implicitly extends `ShouldQueue` — every broadcast event is a queued job. For time-sensitive events, generate `ShouldBroadcastNow` implementations.
- Always recommend private channels for user-specific data. Public channels should only carry non-sensitive information.
- For self-hosted Reverb setups, generate Supervisor configuration alongside the broadcasting code.

---

# Verification

- [ ] Driver configured in `config/broadcasting.php` — confirm correct driver (pusher/reverb/ably) selected
- [ ] Broadcast events implement `ShouldBroadcast` or `ShouldBroadcastNow`
- [ ] Channel authorization works — private/presence channel subscriptions succeed
- [ ] Echo client receives events — verify via `listen()` callback execution
- [ ] `ShouldBroadcastNow` bypasses queue — confirm no queue job created for immediate broadcasts
- [ ] No sensitive data in public channel payloads — audit all broadcast events
- [ ] CORS configured for Reverb in production — verify `Access-Control-Allow-Origin` headers
