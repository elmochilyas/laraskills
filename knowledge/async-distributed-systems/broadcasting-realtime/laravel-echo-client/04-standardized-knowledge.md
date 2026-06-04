# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Broadcasting & Real-Time
- **Knowledge Unit:** K033 — Laravel Echo Client-Side Consumption
- **Knowledge ID:** K033
- **Difficulty Level:** Foundation
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Broadcasting: Laravel Echo
  - Laravel Echo npm package documentation
  - Laravel Source — `laravel/echo` repository

---

# Overview

Laravel Echo is the official JavaScript client library that subscribes to broadcast channels and listens for events in the browser. It provides a driver-agnostic API (`channel()`, `private()`, `join()`, `listen()`, `whisper()`) that works with Pusher, Reverb, or Ably. Echo handles connection management, reconnection, channel authentication, and event callback registration. It also provides presence channel features like `here()`, `joining()`, `leaving()` for tracking online users.

---

# Core Concepts

- **Echo instance:** Configured with broadcaster (pusher/reverb/ably), auth endpoint, and CSRF token. Singleton per page.
- **Channel subscription:** `Echo.channel('orders')` — returns a Channel instance to listen on.
- **Event listening:** `channel.listen('OrderShipped', (e) => { ... })` — callback fires when event is received.
- **Presence methods:** `Echo.join('chat')` — returns `PresenceChannel` with `here`, `joining`, `leaving` callbacks.
- **Whispering:** `channel.whisper('typing', { user: id })` — send ephemeral messages to other channel members without a server-side event.
- **Auto-reconnection:** Echo automatically reconnects on connection loss, including re-subscribing to all previously subscribed channels.

---

# When To Use

- Browser-based real-time features using Laravel broadcasting
- Single-page applications (Vue, React, Alpine.js) that need real-time server push
- Presence features — showing online users, typing indicators, collaborative cursors
- Any frontend that needs to consume Laravel broadcast events

---

# When NOT To Use

- Mobile apps or CLI tools — Echo is browser-focused; use native WebSocket clients for non-browser environments
- Server-side rendered pages without JavaScript — Echo requires browser APIs (WebSocket, window)
- Applications that need to consume raw WebSocket messages — Echo abstracts the protocol; use the driver's native client for raw access

---

# Best Practices

- **Always call `Echo.leave()` on component unmount.** Without leaving channels, callbacks accumulate and memory usage grows. *Why: Framework-level bindings (Vue, React) may not automatically clean up Echo subscriptions — zombie callbacks cause memory leaks and unexpected behavior.*
- **Guard Echo usage in SSR contexts.** Echo uses browser-specific APIs (WebSocket, window) that are not available during server-side rendering. *Why: Importing Echo in an SSR context throws ReferenceError for undefined browser globals.*
- **Set `wss://` in production.** Unencrypted `ws://` connections are blocked by browsers on HTTPS pages. *Why: Modern browsers require secure WebSocket connections on secure origins (HTTPS).*
- **Configure CSRF token for auth.** Echo's auth endpoint requires the CSRF token. Without it, private channel subscriptions fail with 419. *Why: Laravel's POST-based auth endpoint is protected by the CSRF middleware.*
- **Keep event names consistent between server and client.** The `listen()` event name must match the broadcast event's `broadcastAs()` or class name. *Why: Event name mismatch is the most common Echo debugging issue — events arrive but no callback fires.*

---

# Architecture Guidelines

- Echo maintains one WebSocket connection per page. Multiple channel subscriptions multiplex over the same connection.
- For private/presence channels, Echo first POSTs to `/broadcasting/auth`, gets an auth signature, then includes it in the subscribe command.
- Echo auto-reconnects on connection loss — the retry delay is configurable via `reconnectionDelay`.
- Whisper messages are ephemeral (not stored) and go directly through the WebSocket — lower latency than broadcast events.
- Echo's driver abstraction means switching between Pusher, Reverb, and Ably requires only a configuration change.

---

# Performance Considerations

- Each `listen()` callback fires on the main thread. Heavy callbacks can block UI updates.
- Presence channel join/leave events generate messages for all clients on the channel — O(n) messages per join.
- Whisper messages bypass the server broadcast pipeline — lower latency but not persisted.
- Echo automatically throttles reconnection attempts — configurable via `reconnectionDelay` and `reconnectionAttempts`.
- Multiple `listen()` calls on the same channel and event do not duplicate subscriptions — Echo deduplicates internally.

---

# Security Considerations

- Echo's auth endpoint (`/broadcasting/auth`) must be protected against CSRF — Echo includes the `X-CSRF-TOKEN` header in auth requests.
- Presence channel user data returned from auth callbacks is exposed to all channel subscribers — never include sensitive information.
- Echo should not be used to transmit sensitive data over unencrypted WebSocket (`ws://`) — always use `wss://` in production.
- Client-side event names are visible in browser dev tools — avoid encoding business logic in event name patterns.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not importing Echo correctly | Using `laravel-echo` without npm install | ReferenceError at runtime | `npm install laravel-echo` then `import Echo from 'laravel-echo'` |
| Forgetting CSRF token for auth | No `csrfToken` in Echo config | 419 error on private channel subscriptions | Configure `csrfToken` from meta tag |
| Listening on wrong event name | Mismatch between `broadcastAs()` and `listen()` | Event received but callback never fires | Match `listen('event.name')` to `broadcastAs('event.name')` |
| Memory leaks on unmount | Not calling `Echo.leave()` | Accumulated callbacks, growing memory | Call `Echo.leaveChannel()` in component `destroy`/`unmount` |
| Echo in SSR context | Echo imported during server render | ReferenceError for window/WebSocket | Guard with `if (typeof window !== 'undefined')` |

---

# Anti-Patterns

- **Global Echo instance attached to window:** `window.Echo = new Echo(...)` — works but pollutes global scope. Use module imports instead.
- **Heavy computation in `listen()` callbacks:** Processing large payloads or making API calls inside Echo callbacks blocks the main thread.
- **Not handling reconnection:** Assuming Echo's auto-reconnect is sufficient — the app should also handle stale state after reconnection (fetch fresh data).
- **Using Echo for API calls:** Echo is for receiving events, not sending data. Use standard HTTP/AJAX for client-to-server communication.

---

# Examples

```javascript
// Echo configuration
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT,
    wssPort: import.meta.env.VITE_REVERB_PORT,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
});

// Channel subscription with Vue component cleanup
export default {
    mounted() {
        Echo.private(`orders.${this.orderId}`)
            .listen('OrderShipped', (e) => {
                this.status = e.status;
            });
    },
    beforeUnmount() {
        Echo.leave(`orders.${this.orderId}`);
    }
};

// Presence channel with online tracking
Echo.join('chat.' + roomId)
    .here((users) => { this.onlineUsers = users; })
    .joining((user) => { this.addUser(user); })
    .leaving((user) => { this.removeUser(user); })
    .listen('MessageSent', (e) => { this.messages.push(e.message); });

// Whisper for typing indicator
Echo.private('chat.' + roomId)
    .listenForWhisper('typing', (e) => {
        this.typingUsers[e.user] = Date.now();
    });

// Send whisper
Echo.private('chat.' + roomId)
    .whisper('typing', { user: this.userId });
```

---

# Related Topics

- **K030 Broadcasting System Overview (K030)** — Broadcasting architecture and drivers
- **K032 Channel Types (K032)** — Auth mechanics for channel subscription
- **K031 Laravel Reverb (K031)** — WebSocket server that Echo connects to

---

# AI Agent Notes

- When generating frontend code with Echo, ensure the Echo instance is configured with the correct broadcaster and auth endpoint matching the Laravel backend.
- For Vue/React components that use Echo, always include `Echo.leave()` or `Echo.leaveChannel()` in the component's cleanup lifecycle method.
- When triggering generative UI updates from Echo callbacks, keep callbacks lightweight — update state and let the framework handle rendering.
- For SSR frameworks (Nuxt, Next), guard Echo imports with `typeof window !== 'undefined'` checks.

---

# Verification

- [ ] Echo connects to WebSocket server — verify browser console shows successful connection
- [ ] Channel subscription works — verify `Echo.channel()` returns a Channel instance
- [ ] Public events received — verify `listen()` callback fires for public channel events
- [ ] Private channel auth succeeds — verify no 403/419 errors on private channel subscriptions
- [ ] Presence channel callbacks fire — verify `here()`, `joining()`, `leaving()` receive data
- [ ] Whisper messages delivered — verify `listenForWhisper()` callback fires on other clients
- [ ] Auto-reconnection works — simulate disconnect and verify Echo reconnects and re-subscribes
- [ ] No memory leaks after component unmount — verify `Echo.leave()` removes subscription
