# Metadata
Domain: Real-Time Systems
Subdomain: Client-Side Subscriptions (Echo)
Knowledge Unit: Laravel Echo Core API
Difficulty Level: Foundation
Last Updated: 2026-06-02

## Executive Summary
Laravel Echo is the official JavaScript/TypeScript client library for subscribing to Laravel broadcast events. It provides a fluent API for connecting to broadcasting backends (Reverb, Pusher, Ably), managing channel subscriptions, and listening for events. Echo abstracts the underlying WebSocket protocol, exposing methods for public (`channel()`), private (`private()`), presence (`join()`), and encrypted private (`encryptedPrivate()`) channels. The library auto-integrates with HTTP clients (Axios, Vue Resource, jQuery) by injecting the `X-Socket-ID` header for sender exclusion (`broadcast()->toOthers()`). Echo v2.x (2025+) supports TypeScript natively and ships reconnection handling via the underlying connector. The npm package is `laravel-echo`, latest version 2.3.4 (April 2026).

## Core Concepts
Echo creates a connection to the configured broadcast backend when instantiated. Channel instances are returned by `channel()`, `private()`, and `join()`, each providing a `listen()` method for event subscription. Echo's `connector` property exposes the underlying connection (PusherConnector for Reverb/Pusher, SocketIoConnector for Socket.IO). The `socketId()` method returns the current connection's socket ID, which Laravel uses for `toOthers()` exclusion. The `leave()` and `leaveChannel()` methods clean up subscriptions. Echo supports namespace configuration for event names via the `namespace` option.

## Mental Models
Echo is the client-side counterpart to Laravel's broadcasting system. If broadcasting is the server saying something, Echo is the client that decides which topics (channels) to listen to and what to do when it hears something.

## Internal Mechanics
Echo's constructor receives configuration (broadcaster type, app key, host, port, auth endpoint). On instantiation, it calls `connect()`, which creates the appropriate connector (PusherConnector for Reverb/Pusher, Ably connector for Ably). The connector establishes a WebSocket connection to the configured server. When `channel('orders')` is called, Echo returns a Channel object. Calling `.listen('OrderShipped', callback)` registers the callback with the underlying connector for that channel and event. Echo handles socket ID generation for `toOthers()` exclusion: it registers interceptors with Axios/Vue/jQuery to add the `X-Socket-ID` header to HTTP requests. The `leave(channel)` method sends an unsubscribe message and removes the channel from the local channel registry.

## Patterns
- **Fluent channel API**: `channel()` → `listen()` → callback for subscription
- **Channel type methods**: `channel()`, `private()`, `join()`, `encryptedPrivate()` for access control levels
- **Auto-interceptor registration**: Automatically hooks into HTTP libraries for socket ID transmission
- **Connector abstraction**: Same API regardless of backend (Reverb, Pusher, Ably, Socket.IO)

## Architectural Decisions
- **Pusher protocol as the standard**: Echo uses pusher-js for Reverb and Pusher backends; Ably provides its own connector
- **Centralized caller pattern**: Echo itself is a singleton that manages all channel subscriptions globally
- **Interceptor-based socket ID propagation**: Rather than manual header management, Echo auto-instruments HTTP libraries
- **Implicit disconnect on page unload**: Browser lifecycle handles connection cleanup on navigation

## Tradeoffs
- **Singleton nature**: Global Echo instance means multiple components share the same connection; careful lifecycle management needed
- **No built-in component-level scoping**: Channels subscribed in one component persist unless explicitly left
- **Pusher-js dependency**: For Reverb and Pusher, pusher-js must be installed alongside Echo (~15KB gzipped)
- **Ably's custom connector**: Ably requires a separate connector setup, not the standard pusher-js approach

## Performance Considerations
- Single WebSocket connection shared across all subscriptions (efficient)
- Each `listen()` callback is registered in memory; thousands of listeners may impact performance
- Event payload parsing overhead is negligible for typical payload sizes
- Reconnection overhead depends on backoff strategy configured in the connector

## Production Considerations
- Configure `authEndpoint` to point at the Laravel application's `/broadcasting/auth` route
- Set `auth.headers` for authentication (Bearer token, CSRF token) for private/presence channel authorization
- Set `namespace` to empty string if using `broadcastAs()` with dot-notation event names (e.g., `order.shipped`)
- Configure `wsHost` and `wsPort` to match the Reverb/Pusher server address
- Use `forceTLS: true` in production for WSS connections
- Handle connection status with `useConnectionStatus()` (React/Vue/Svelte hooks) or custom `connector` event listeners

## Common Mistakes
- Not calling `leave()` or `leaveChannel()` on component unmount, causing memory leaks and stale callbacks
- Setting `namespace` incorrectly with dot-notated event names (should be empty string for `broadcastAs()` events)
- Forgetting to install `pusher-js` alongside Echo for Reverb backends
- Subscribing to private channels without configuring `authEndpoint` and `auth.headers`
- Not handling connection state changes, leading to silent failures when WebSocket disconnects

## Failure Modes
- **Auth endpoint failure**: Private channel subscription fails if `/broadcasting/auth` returns non-200
- **Connection dropped without reconnection**: Underlying connector reconnection fails; events stop arriving
- **Callback leak**: Component unmounts without `leaveChannel()`; callback continues executing after component destruction
- **Namespace mismatch**: Event name with incorrect namespace prefix never matches server-emitted events
- **CORS rejection**: Auth endpoint blocked by CORS; private channel subscription never completes

## Ecosystem Usage
- Required frontend companion for all Laravel real-time features
- Available as standalone npm package (`laravel-echo`) and framework-specific packages
- Installed automatically by `php artisan install:broadcasting` with Vite scaffolding
- Used in Laravel starter kits (Breeze, Jetstream) for real-time features
- Compatible with Vue 3, React, Svelte 5, and vanilla JavaScript

## Related Knowledge Units
- K10: Echo Framework Integrations (React/Vue/Svelte)
- K01: Laravel Broadcasting Architecture
- K11: Public/Private/Presence Channel Patterns
- K31: Client Events (Whisper, Typing Indicators)

## Research Notes
Echo v2.x (TypeScript rewrite) was released in early 2025. Version 2.3.4 is current as of April 2026. The `@laravel/echo-react`, `@laravel/echo-vue`, and `@laravel/echo-svelte` packages provide framework-specific hooks. The Echo monorepo is maintained at `github.com/laravel/echo`. The `connector` abstraction allows custom broadcasters beyond the built-in ones. Echo's source code shows the `registerInterceptors()` method handles Vue HTTP, Axios, jQuery, and Turbo interceptor registration.
