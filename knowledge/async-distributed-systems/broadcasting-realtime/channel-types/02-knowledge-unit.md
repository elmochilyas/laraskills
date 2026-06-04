# Metadata
Domain: Async & Distributed Systems
Subdomain: Broadcasting & Real-Time
Knowledge Unit: Channel Types: Public, Private, Presence
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Laravel broadcasting defines three channel types with ascending access control: **public** (no authentication — anyone can listen), **private** (authenticated — user must be authorized to subscribe), and **presence** (authenticated + user state tracked — who's online). The channel type is determined by the naming convention in the event's `broadcastOn()`: `orders` (public), `private-orders.{orderId}` (private), `presence-orders.{orderId}` (presence). Channel authorization is handled by routes defined in `routes/channels.php`, which returns boolean for private and user data for presence.

# Core Concepts
- **Public channels**: No auth. Any client with the channel name can subscribe. Named without prefix (e.g., `orders`).
- **Private channels**: User must be authenticated and authorized via a callback in `routes/channels.php`. Name prefixed with `private-`.
- **Presence channels**: Private channel with user state. Tracks who is subscribed. Name prefixed with `presence-`. Auth callback returns user data.
- **Channel naming convention**: `private-{name}` or `presence-{name}` signals the driver to apply auth middleware for subscription.
- **Authorization callback**: `// routes/channels.php` — `Broadcast::channel('orders.{id}', fn ($user, $id) => $user->id === $id)`.

# Mental Models
- **Room access levels**: Public channel = open plaza (anyone enters). Private channel = members-only lounge (show ID at door). Presence channel = members-only lounge with name tag (everyone sees who's here).
- **Radio frequencies**: Public = unencrypted FM. Private = encrypted satellite (need the key). Presence = encrypted satellite with caller ID display.

# Internal Mechanics
- `Broadcast::channel('orders.{id}', ...)` registers an authorization callback.
- When Echo tries to subscribe to `private-orders.5`, it sends an HTTP POST to `/broadcasting/auth` with the channel name.
- The auth endpoint fires the registered callback for the matching channel pattern.
- If callback returns `true` (or array for presence), the server returns an auth signature.
- Echo uses this signature to authenticate the WebSocket subscription request.
- For presence channels, the auth callback returns an array of user data: `['id' => $user->id, 'name' => $user->name]`.
- The channel name prefix (`private-`, `presence-`) determines the auth flow applied by the broadcasting driver.

# Patterns
## Model-Bound Private Channels
- **Purpose**: Authorize access to channels based on model ownership.
- **Benefit**: Users only receive events for resources they own.
- **Tradeoff**: Auth callback fires per subscription request.

## Presence Channel Online Users
- **Purpose**: Show active users to all channel members.
- **Benefit**: Real-time "who's viewing" lists.
- **Tradeoff**: State management; join/leave events generate messages.

## Channel Scoping via Route Model Binding
- **Purpose**: Use route-like parameter binding in channel auth.
- **Benefit**: Clean channel naming; automatic parameter resolution.
- **Tradeoff**: Model-fetching adds latency to subscription.

# Architectural Decisions
- **Use public channels for**: Non-sensitive data (stock tickers, weather updates, public announcements).
- **Use private channels for**: User-specific data (notifications, private messages, user-specific updates).
- **Use presence channels for**: Collaborative features (shared documents, chat rooms, live auctions).
- **Avoid presence channels for**: Simple subscriptions that don't need online state — private channels have less overhead.

# Tradeoffs
Public channel | No auth overhead, simple | Anyone can listen; data must be public-safe
Private channel | Access control, user-specific | Auth callback overhead; requires authenticated routes
Presence channel | Online state tracking, rich features | Auth callback + state tracking overhead; more messages

# Performance Considerations
- Auth callback is a synchronous HTTP request per subscription (POST to `/broadcasting/auth`).
- Presence channel join/leave events fire for each connection change — high churn = more messages.
- Channel auth callbacks that query the database add latency to subscription.
- Wildcard channel patterns (`orders.*`) are evaluated for every subscription — wildcards are less efficient than exact patterns.

# Production Considerations
- Auth callbacks should be fast and cache-heavy. Slow callbacks delay subscription.
- Presence channel join events on page load + leave events on page close create a burst of messages during traffic spikes.
- Channel authorization is not cached by default — each subscription request runs the callback.
- For high-churn applications (chat rooms), presence channels generate significant message volume from join/leave events.
- Test auth callback performance under load — it's in the critical path of WebSocket subscription.

# Common Mistakes
- **Using public channels for user data**: Anyone with the channel name can subscribe. Never broadcast user-specific data on a public channel.
- **Not using wildcards in channel auth**: `Broadcast::channel('orders.{id}', ...)` matches `private-orders.5` and `presence-orders.5`. Wildcard pattern is `{id}`, not `*`.
- **Returning `true` from presence auth**: Presence auth must return an array of user data. Returning `true` causes an error.
- **Registering channel auth in wrong file**: Channel auth goes in `routes/channels.php`, not `routes/web.php` or `routes/api.php`.

# Failure Modes
- **Auth callback returns `false` unexpectedly**: User cannot subscribe. Common causes: unauthenticated user, incorrect channel ID, expired session.
- **Presence channel user data can't be serialized**: The data returned by auth callback must be JSON-serializable. Non-serializable types (binary, resource) break presence state.
- **Channel name collision**: Two different features using the same channel name (e.g., both `chat.1` and `order.1`). Events leak across features.
- **Wildcard matching too broad**: `Broadcast::channel('*', ...)` matches ALL channels. Usually unintended; creates security hole for private channels.

# Ecosystem Usage
- **Laravel framework**: `BroadcastManager` handles channel type detection based on name prefix. `routes/channels.php` is auto-loaded.
- **Laravel Echo**: Echo methods `channel()` (public), `private()` (private), `join()` (presence) map to channel types.
- **Spatie packages**: Some packages (e.g., spatie/laravel-permission) integrate with broadcast channel auth for role-based access.

# Related Knowledge Units
- K030 Broadcasting System Overview | K033 Laravel Echo Client (how channels are consumed)

## Research Notes
- Laravel Reverb (first-party WebSocket server) uses a custom protocol over PHP sockets, bypassing the need for Node.js or Pusher — it maintains persistent connections via the eact/promise async library.
- Reverb scales horizontally via a Redis pub/sub backend — each Reverb instance subscribes to all channels, and messages are broadcast across instances through Redis channels.
- Laravel Echo is the client-side JavaScript library that subscribes to channels and listens for events — v2 added native TypeScript support and a composable API for Vue/React integration.
- Channel types in Laravel Broadcasting (public, private, presence) each have distinct authorization approaches — private channels call an authorization callback, presence channels additionally broadcast a here and joining/leaving event.
- Reverb production deployment requires proper process management (Supervisor), SSL termination (Nginx/Caddy), and connection limits — each WebSocket connection consumes ~8KB of memory on the server.
- The broadcasting system overview from Laravel's perspective is a simple event-to-channel mapping — shouldBroadcast interface events are serialized and pushed to the configured broadcaster driver.
- Reverb's scaling characteristics depend on Redis throughput — a single Redis instance can support approximately 10,000 concurrent Reverb connections before saturation.
- Community benchmarks show Reverb outperforming Pusher for self-hosted deployments, with sub-50ms latency for message delivery across 2000+ concurrent connections on modest hardware.
