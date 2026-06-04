# Metadata
Domain: Async & Distributed Systems
Subdomain: Broadcasting & Real-Time
Knowledge Unit: Laravel Echo Client-Side Consumption
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Laravel Echo is the official JavaScript client library that subscribes to broadcast channels and listens for events in the browser. It provides a driver-agnostic API (`channel()`, `private()`, `join()`, `listen()`, `whisper()`) that works with Pusher, Reverb, or Ably. Echo handles connection management, reconnection, channel authentication, and event callback registration. It also provides presence channel features like `here()`, `joining()`, `leaving()` for tracking online users.

# Core Concepts
- **Echo instance**: Configured with broadcaster (pusher/reverb/ably), auth endpoint, and CSRF token. Singleton per page.
- **Channel subscription**: `Echo.channel('orders')` — returns a Channel instance to listen on.
- **Event listening**: `channel.listen('OrderShipped', (e) => { ... })` — callback fires when event is received.
- **Presence methods**: `join('chat')` — returning `PresenceChannel` with `here`, `joining`, `leaving` callbacks.
- **Whispering**: `channel.whisper('typing', { user: id })` — send ephemeral messages to other channel members without server-side event.

# Mental Models
- **Radio receiver**: Echo is the radio in your browser. You tune to a frequency (channel), and when a song plays (event is broadcast), the radio plays it (callback fires).
- **Event bus client-side**: Echo is a client-side event bus that receives server-side events. Server publishes, Echo delivers to registered callbacks.

# Internal Mechanics
- `new Echo({ broadcaster: 'reverb', ... })` creates the Echo instance with a connector to the WebSocket server.
- The connector (PusherConnector, ReverbConnector) wraps the driver's WebSocket client.
- `Echo.channel('orders')` sends a `subscribe` command to the WebSocket server.
- For private/presence channels, Echo first POSTs to `/broadcasting/auth`, gets an auth signature, then includes it in the subscribe command.
- On receiving a WebSocket message, Echo parses the event name and channel, then calls registered callbacks for that event.
- `Echo.leave('orders')` unsubscribes — sends an `unsubscribe` command.
- Reconnection: Echo automatically reconnects on connection loss, including re-subscribing to all previously subscribed channels.

# Patterns
## Reactive UI Updates
- **Purpose**: Update UI in real-time when events occur.
- **Benefit**: No polling; instant UI updates.
- **Tradeoff**: Coupling between backend events and frontend state.

## Presence-Based UI
- **Purpose**: Show online users, typing indicators.
- **Benefit**: Rich collaborative features.
- **Tradeoff**: High message volume for presence events.

## Whisper for Ephemeral Events
- **Purpose**: Send client-to-client messages without server broadcast.
- **Benefit**: Lower latency, no server processing.
- **Tradeoff**: Only works for clients on the same channel; not persisted.

# Architectural Decisions
- **Use Echo with Reverb for production**: Bundled with Laravel, compatible with Pusher protocol, self-hosted.
- **Use Echo with Pusher for simple setups**: Drop-in replacement, zero operations.
- **Use Echo with Ably for**: Advanced features (message history, guaranteed delivery, global presence).
- **Avoid Echo for non-browser clients (mobile, CLI)**: Echo is browser-focused. For native apps, use WebSocket clients directly.

# Tradeoffs
Echo + Reverb | First-party, no cost, full control | Self-hosted; operations overhead
Echo + Pusher | Zero ops, global edge, SLA | Per-connection cost; data goes through Pusher
Echo + Ably | Advanced features, global scale | Higher cost; driver maturity varies

# Performance Considerations
- Echo maintains one WebSocket connection per page. Multiple channel subscriptions use the same connection.
- Each `listen()` callback fires on the main thread. Heavy callbacks can block UI updates.
- Presence channel join/leave events generate messages for all clients on the channel — O(n) messages per join.
- Whisper messages are ephemeral (not stored) and go directly through the WebSocket — lower latency than broadcast events.

# Production Considerations
- Set `wsHost` and `wsPort` in Echo config for custom WebSocket endpoints.
- Secure Echo connections with `wss://` in production. Unencrypted `ws://` is blocked by browsers on secure pages.
- Echo auto-reconnects on connection drop — the retry delay is configurable via `reconnectionDelay`.
- Disable Echo logging in production: `echo.options.logToConsole = false`.
- For private/presence channels, the auth endpoint must match the current user's session.

# Common Mistakes
- **Not importing Echo correctly**: Echo is a browser-side module. Import via `npm install laravel-echo` and `import Echo from 'laravel-echo'`.
- **Forgetting to set CSRF token for auth**: Echo's auth endpoint needs the CSRF token. Configure `csrfToken` in Echo options.
- **Listening on wrong event name**: The `listen()` event name must match the broadcast event's `broadcastAs()` or class name.
- **Memory leaks from unsubscribed channels**: Not calling `Echo.leave()` on component unmount — callbacks accumulate, memory usage grows.
- **Using Echo in SSR (Server-Side Rendering) contexts**: Echo uses browser-specific APIs (WebSocket, window). Guard with `if (typeof window !== 'undefined')`.

# Failure Modes
- **WebSocket connection error**: No connectivity to Reverb/Pusher. Echo reconnects automatically, but events are missed during downtime.
- **Auth endpoint returns 403**: Channel subscription fails. User cannot subscribe to private/presence channels.
- **Echo version mismatch**: Echo version doesn't match Pusher/Reverb protocol version. Event delivery may fail.
- **Memory leak from unsubscribed channels**: While Echo manages subscriptions, framework-level bindings (Vue/Vuex) may not clean up properly, causing zombie callbacks.

# Ecosystem Usage
- **Laravel Framework**: Echo is listed in `laravel` npm organization. Bundled via `laravel/breeze` and `laravel/jetstream` with Inertia/Livewire stacks.
- **Laravel Reverb**: Echo's Reverb connector is built-in. Auto-detected from broadcasting config.
- **Spatie packages**: Some packages (like spatie/laravel-medialibrary) suggest Echo for real-time upload progress.

# Related Knowledge Units
- K030 Broadcasting System Overview | K032 Channel Types (auth flow) | K034 Reverb Production Deployment

## Research Notes
- Laravel Reverb (first-party WebSocket server) uses a custom protocol over PHP sockets, bypassing the need for Node.js or Pusher — it maintains persistent connections via the eact/promise async library.
- Reverb scales horizontally via a Redis pub/sub backend — each Reverb instance subscribes to all channels, and messages are broadcast across instances through Redis channels.
- Laravel Echo is the client-side JavaScript library that subscribes to channels and listens for events — v2 added native TypeScript support and a composable API for Vue/React integration.
- Channel types in Laravel Broadcasting (public, private, presence) each have distinct authorization approaches — private channels call an authorization callback, presence channels additionally broadcast a here and joining/leaving event.
- Reverb production deployment requires proper process management (Supervisor), SSL termination (Nginx/Caddy), and connection limits — each WebSocket connection consumes ~8KB of memory on the server.
- The broadcasting system overview from Laravel's perspective is a simple event-to-channel mapping — shouldBroadcast interface events are serialized and pushed to the configured broadcaster driver.
- Reverb's scaling characteristics depend on Redis throughput — a single Redis instance can support approximately 10,000 concurrent Reverb connections before saturation.
- Community benchmarks show Reverb outperforming Pusher for self-hosted deployments, with sub-50ms latency for message delivery across 2000+ concurrent connections on modest hardware.
