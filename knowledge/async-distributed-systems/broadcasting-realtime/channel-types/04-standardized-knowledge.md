# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Broadcasting & Real-Time
- **Knowledge Unit:** K032 — Channel Types: Public, Private, Presence
- **Knowledge ID:** K032
- **Difficulty Level:** Foundation
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Broadcasting: Defining Channels
  - Laravel Source — `Illuminate\Broadcasting\BroadcastManager`
  - Laravel Echo documentation

---

# Overview

Laravel broadcasting defines three channel types with ascending access control: **public** (no authentication — anyone can listen), **private** (authenticated — user must be authorized to subscribe), and **presence** (authenticated + user state tracked — who's online). The channel type is determined by the naming convention in the event's `broadcastOn()`: `orders` (public), `private-orders.{orderId}` (private), `presence-orders.{orderId}` (presence). Channel authorization is handled by routes defined in `routes/channels.php`, which returns boolean for private and user data for presence.

---

# Core Concepts

- **Public channels:** No auth. Any client with the channel name can subscribe. Named without prefix (e.g., `orders`).
- **Private channels:** User must be authenticated and authorized via a callback in `routes/channels.php`. Name prefixed with `private-`.
- **Presence channels:** Private channel with user state. Tracks who is subscribed. Name prefixed with `presence-`. Auth callback returns user data array.
- **Channel naming convention:** `private-{name}` or `presence-{name}` signals the driver to apply auth middleware for subscription.
- **Authorization callback:** Defined in `routes/channels.php` — `Broadcast::channel('orders.{id}', fn ($user, $id) => $user->id === (int) $id)`.
- **Wildcard patterns:** Channel patterns use route-like parameter binding (`{id}`), not glob-style (`*`).

---

# When To Use

- **Public channels:** Non-sensitive data — stock tickers, weather updates, public announcements
- **Private channels:** User-specific data — notifications, private messages, user-specific dashboards
- **Presence channels:** Collaborative features — shared documents, chat rooms, live auctions, online user lists

---

# When NOT To Use

- Avoid presence channels for simple subscriptions that don't need online state — private channels have less overhead
- Avoid public channels for any data that a malicious listener should not see — no access control exists
- Avoid wildcard patterns like `Broadcast::channel('*', ...)` — this matches ALL channels and is almost always unintended

---

# Best Practices

- **Return user data from presence auth callbacks, not just `true`.** Presence channels require an array with `id`, `name`, and optional custom fields. *Why: Returning `true` from a presence callback causes an authorization error — the driver expects user data to share with other channel subscribers.*
- **Keep auth callbacks fast and cache-heavy.** Auth callbacks are called on every subscription attempt — slow callbacks delay subscription and degrade user experience. *Why: Each private/presence subscription requires a synchronous HTTP request that fires the auth callback.*
- **Use exact channel patterns over wildcards.** Wildcard patterns (`orders.*`) are evaluated for every subscription — exact patterns are more efficient. *Why: The broadcasting driver evaluates pattern matching on each subscription — more specific patterns reduce evaluation overhead.*
- **Register channels in `routes/channels.php`, not `web.php` or `api.php`.** Channels registered in the wrong file are not loaded by the broadcasting system. *Why: The broadcasting system specifically loads `routes/channels.php` for channel authorization.*

---

# Architecture Guidelines

- Channel type is determined by the name prefix (`private-`, `presence-`) in `broadcastOn()`. The event class does not need to explicitly declare the channel type.
- Auth callbacks receive the authenticated user (via `auth` guard) and the wildcard parameters from the channel name.
- For presence channels, the auth callback fires on every connection and reconnection. Join/leave events fire for each state change.
- `Broadcast::channel` registers a callback for pattern matching. Multiple patterns can match different channel segments.
- Channel authorization is not cached by default — each subscription request runs the callback.

---

# Performance Considerations

- Auth callback is a synchronous HTTP request per subscription (POST to `/broadcasting/auth`).
- Presence channel join/leave events fire for each connection change — high churn generates many messages.
- Channel auth callbacks that query the database add latency to subscription.
- Wildcard channel patterns are less efficient than exact patterns — pattern matching scales with pattern count.
- Presence channel join events on page load + leave events on page close create burst message traffic.

---

# Security Considerations

- Public channels provide no access control — any client with the channel name can subscribe and receive all events.
- Private channel callbacks must validate the user's relationship to the channel resource. A user should only access channels for resources they own or are authorized to view.
- Presence channel callbacks return user data that is broadcast to all subscribers — only include data that should be public to other channel members.
- Never include authentication tokens, hashes, or internal identifiers in presence channel user data.
- Channel name patterns should be specific enough to prevent unauthorized access via ID enumeration.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Public channels for user data | Using public channels for notifications | Any listener with channel name intercepts user data | Always use private channels for user-specific data |
| Not using wildcard params in callbacks | `Broadcast::channel('orders.{id}', fn () => true)` | All users authorized for all order channels | Include authorization check: `fn ($user, $id) => $user->id === (int) $id` |
| Returning `true` from presence auth | Treating presence like private channel auth | Auth error — presence expects user data array | Return `['id' => $user->id, 'name' => $user->name]` |
| Registering channels in wrong file | Putting auth in `web.php` | Callbacks never fire — 403 on subscription | Always use `routes/channels.php` |
| Overly broad wildcard patterns | Using `Broadcast::channel('*', ...)` | Matches ALL channels including private/presence | Use specific patterns per channel |

---

# Anti-Patterns

- **Hardcoded "yes" for all channel auth:** `Broadcast::channel('*', fn () => true)` — disables all channel security. Any authenticated user can subscribe to any channel.
- **Presence for every channel:** Using presence channels when only private subscriptions are needed. Adds join/leave overhead and user data broadcasting without benefit.
- **Model-fetching in auth callbacks without caching:** Querying the database for every subscription request. Under load, this can overwhelm the database.
- **Channel name collisions:** Two features using the same channel name pattern — events leak across features.

---

# Examples

```php
// routes/channels.php

// Public channel — no auth needed
Broadcast::channel('announcements', function () {
    return true; // anyone can listen
});

// Private channel — user must own the order
Broadcast::channel('orders.{orderId}', function ($user, $orderId) {
    return $user->id === (int) Order::findOrFail($orderId)->user_id;
});

// Presence channel — returns user data
Broadcast::channel('chat.{roomId}', function ($user, $roomId) {
    return $user->can('view', ChatRoom::findOrFail($roomId))
        ? ['id' => $user->id, 'name' => $user->name, 'avatar' => $user->avatar_url]
        : false;
});

// Listening on channels via Echo
Echo.channel('announcements')
    .listen('NewAnnouncement', (e) => { /* ... */ });

Echo.private('orders.' + orderId)
    .listen('OrderShipped', (e) => { /* ... */ });

Echo.join('chat.' + roomId)
    .here((users) => { /* online users */ })
    .joining((user) => { /* user joined */ })
    .leaving((user) => { /* user left */ })
    .listen('MessageSent', (e) => { /* ... */ });
```

---

# Related Topics

- **K030 Broadcasting System Overview (K030)** — Broadcasting architecture and drivers
- **K033 Laravel Echo Client (K033)** — Client-side channel consumption patterns
- **K031 Laravel Reverb (K031)** — WebSocket server implementation

---

# AI Agent Notes

- When generating channel auth callbacks, always include the authorization check — never generate `fn () => true` for private channels.
- Presence channel callbacks must return an array with user data, not a boolean. Generate `return ['id' => ..., 'name' => ...]`.
- Channel naming follows convention: no prefix = public, `private-` prefix = private, `presence-` prefix = presence. Generate the appropriate prefix based on the channel type.
- Wildcard parameters in channel patterns use route-like syntax (`{id}`), not glob syntax (`*`).

---

# Verification

- [ ] Public channels allow subscription without auth — confirm any client can subscribe
- [ ] Private channels require auth — verify 403 without valid auth callback response
- [ ] Presence channel returns user data — confirm `here()`, `joining()`, `leaving()` callbacks receive user data
- [ ] Auth callbacks in `routes/channels.php` — verify file is loaded and patterns match correctly
- [ ] Channel name prefixes correct — verify `private-` and `presence-` prefixes produce expected auth flow
- [ ] No sensitive data in presence user data — audit callback return values
- [ ] Wildcard patterns match expected channel names — test pattern with multiple channel IDs
