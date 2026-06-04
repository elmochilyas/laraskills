# Standardized Knowledge: Laravel Echo Core API

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Real-Time Systems |
| Subdomain | Client-Side Subscriptions (Echo) |
| Knowledge Unit ID | K09 |
| Knowledge Unit | Laravel Echo Core API |
| Difficulty | Foundation |
| Maturity | Stable |
| Confidence | High |
| Last Updated | 2026-06-02 |

## Overview

Laravel Echo is the official JavaScript/TypeScript client library for subscribing to Laravel broadcast events. It provides a fluent API for connecting to broadcasting backends (Reverb, Pusher, Ably), managing channel subscriptions, and listening for events. Echo abstracts the underlying WebSocket protocol, exposing methods for public (`channel()`), private (`private()`), presence (`join()`), and encrypted private (`encryptedPrivate()`) channels. The library auto-integrates with HTTP clients by injecting the `X-Socket-ID` header for sender exclusion (`broadcast()->toOthers()`). Echo v2.x (2025+) supports TypeScript natively.

## Core Concepts

Echo creates a connection to the configured broadcast backend when instantiated. Channel instances are returned by `channel()`, `private()`, and `join()`, each providing a `listen()` method for event subscription. Echo's `connector` property exposes the underlying connection. The `socketId()` method returns the current connection's socket ID for `toOthers()` exclusion. The `leave()` and `leaveChannel()` methods clean up subscriptions.

## When To Use

- All Laravel applications with real-time features
- Frontend JavaScript/TypeScript projects using Laravel backend
- React, Vue, Svelte, or vanilla JS projects

## When NOT To Use

- Non-Laravel backends (not compatible with Echo's protocol expectations)
- SSE-only applications using `EventSource` API directly
- Server-side event processing (use Laravel's event system directly)

## Best Practices (WHY)

- **Configure auth properly**: Set `authEndpoint` and `auth.headers` for private/presence channel support
- **Namespace for event names**: Set `namespace` to empty string when using `broadcastAs()` with dot-notation events
- **Force TLS in production**: Always set `forceTLS: true` for WSS connections
- **Handle connection state**: Use `useConnectionStatus()` (React/Vue/Svelte) or custom `connector` event listeners
- **Clean up on unmount**: Call `leave()` or `leaveChannel()` on component destruction to prevent memory leaks

## Architecture Guidelines

- Echo is a singleton managing all channel subscriptions globally
- Uses Pusher protocol as the standard (pusher-js for Reverb and Pusher; custom connector for Ably)
- Interceptor-based socket ID propagation auto-instruments HTTP libraries (Axios, Vue Resource, jQuery)
- Browser lifecycle handles connection cleanup on page navigation (implicit disconnect)

## Performance Considerations

- Single WebSocket connection shared across all subscriptions (efficient)
- Each `listen()` callback is registered in memory; thousands of listeners may impact performance
- Reconnection overhead depends on backoff strategy configured in the connector
- Event payload parsing overhead is negligible for typical payload sizes

## Security Considerations

- Auth endpoint URL is configured client-side; ensure it points to correct, TLS-protected endpoint
- Bearer tokens in `auth.headers` are accessible in client-side code
- Socket ID is exposed to the server via `X-Socket-ID` header for `toOthers()` exclusion
- CORS configuration must allow the Echo origin to access the auth endpoint

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not calling `leave()` on unmount | Forgetting lifecycle cleanup | Memory leaks, stale callbacks | Use framework hooks for auto-cleanup |
| Namespace misconfigured with dot-notation events | Setting namespace incorrectly | Events never match server-emitted names | Set namespace to empty string with `broadcastAs()` |
| Forgetting `pusher-js` dependency | Assuming Echo includes it | Reverb/Pusher connections fail | Always install `pusher-js` alongside Echo |
| No auth configuration for private channels | Using private() without auth setup | Silent subscription failures | Configure authEndpoint + auth.headers |
| Ignoring connection state changes | No status monitoring | Silent failures when WebSocket disconnects | Use `useConnectionStatus()` or connector events |

## Anti-Patterns

- **Multiple Echo instances**: Creating new Echo instances per component instead of using the globally configured singleton
- **Manual socket ID management**: Manually setting X-Socket-ID headers instead of relying on Echo's interceptor
- **No leave on unmount**: Subscribing in components without unsubscribing, causing callback accumulation

## Examples

```javascript
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT,
    forceTLS: true,
    authEndpoint: '/broadcasting/auth',
});

// Subscribe to channels
Echo.channel('orders')
    .listen('OrderShipped', (e) => { /* ... */ });

Echo.private('orders.' + orderId)
    .listen('OrderUpdated', (e) => { /* ... */ });

// Leave channel
Echo.leave('orders.' + orderId);
```

## Related Topics

- K10: Echo Framework Integrations (React/Vue/Svelte)
- K01: Laravel Broadcasting Architecture
- K11: Public/Private/Presence Channel Patterns
- K31: Client Events (Whisper, Typing Indicators)

## AI Agent Notes

- Echo v2.x (TypeScript) is current; use v2.3.4+ (April 2026)
- The `connector` abstraction allows custom broadcasters beyond built-in ones
- Echo auto-registers interceptors for Axios, Vue HTTP, jQuery, and Turbo
- Socket ID is used for `toOthers()` exclusion via `X-Socket-ID` header

## Verification

- [ ] Echo is configured with correct broadcaster, host, and port
- [ ] `authEndpoint` and `auth.headers` are configured for private channels
- [ ] `pusher-js` is installed when using Reverb or Pusher backends
- [ ] Channel cleanup (`leave()`) is called on component unmount
- [ ] `forceTLS: true` in production
- [ ] Namespace is correctly configured for event naming convention
- [ ] Connection status is monitored and handled in UI
