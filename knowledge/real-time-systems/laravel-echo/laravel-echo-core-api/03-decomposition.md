# Decomposition: Laravel Echo Core Api

## Topic Overview
Laravel Echo is the official JavaScript/TypeScript client library for subscribing to Laravel broadcast events. It provides a fluent API for connecting to broadcasting backends (Reverb, Pusher, Ably), managing channel subscriptions, and listening for events. Echo abstracts the underlying WebSocket protocol, exposing methods for public (`channel()`), private (`private()`), presence (`join()`), and encrypted private (`encryptedPrivate()`) channels. The library auto-integrates with HTTP clients (...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
client-side-subscriptions-echo/K09-laravel-echo-core-api/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Laravel Echo Core Api
- **Purpose:** Laravel Echo is the official JavaScript/TypeScript client library for subscribing to Laravel broadcast events. It provides a fluent API for connecting to broadcasting backends (Reverb, Pusher, Ably), managing channel subscriptions, and listening for events. Echo abstracts the underlying WebSocket protocol, exposing methods for public (`channel()`), private (`private()`), presence (`join()`), and encrypted private (`encryptedPrivate()`) channels. The library auto-integrates with HTTP clients (...
- **Difficulty:** Foundation
- **Dependencies:
  - K10: Echo Framework Integrations (React/Vue/Svelte)
  - K01: Laravel Broadcasting Architecture
  - K11: Public/Private/Presence Channel Patterns
  - K31: Client Events (Whisper, Typing Indicators)

## Dependency Graph
**Depends on:**
  - K10: Echo Framework Integrations (React/Vue/Svelte)
  - K01: Laravel Broadcasting Architecture
  - K11: Public/Private/Presence Channel Patterns
  - K31: Client Events (Whisper, Typing Indicators)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Fluent channel API**: `channel()` → `listen()` → callback for subscription**Channel type methods**: `channel()`, `private()`, `join()`, `encryptedPrivate()` for access control levels**Auto-interceptor registration**: Automatically hooks into HTTP libraries for socket ID transmission**Connector abstraction**: Same API regardless of backend (Reverb, Pusher, Ably, Socket.IO)**Pusher protocol as the standard**: Echo uses pusher-js for Reverb and Pusher backends; Ably provides its own connector**Centralized caller pattern**: Echo itself is a singleton that manages all channel subscriptions globally**Interceptor-based socket ID propagation**: Rather than manual header management, Echo auto-instruments HTTP libraries**Implicit disconnect on page unload**: Browser lifecycle handles connection cleanup on navigation**Singleton nature**: Global Echo instance means multiple components share the same connection; careful lifecycle management needed**No built-in component-level scoping**: Channels subscribed in one component persist unless explicitly left**Pusher-js dependency**: For Reverb and Pusher, pusher-js must be installed alongside Echo (~15KB gzipped)**Ably's custom connector**: Ably requires a separate connector setup, not the standard pusher-js approachSingle WebSocket connection shared across all subscriptions (efficient)Each `listen()` callback is registered in memory; thousands of listeners may impact performanceEvent payload parsing overhead is negligible for typical payload sizesReconnection overhead depends on backoff strategy configured in the connectorConfigure `authEndpoint` to point at the Laravel application's `/broadcasting/auth` routeSet `auth.headers` for authentication (Bearer token, CSRF token) for private/presence channel authorizationSet `namespace` to empty string if using `broadcastAs()` with dot-notation event names (e.g., `order.shipped`)Configure `wsHost` and `wsPort` to match the Reverb/Pusher server addressUse `forceTLS: true` in production for WSS connectionsHandle connection status with `useConnectionStatus()` (React/Vue/Svelte hooks) or custom `connector` event listenersNot calling `leave()` or `leaveChannel()` on component unmount, causing memory leaks and stale callbacksSetting `namespace` incorrectly with dot-notated event names (should be empty string for `broadcastAs()` events)Forgetting to install `pusher-js` alongside Echo for Reverb backendsSubscribing to private channels without configuring `authEndpoint` and `auth.headers`Not handling connection state changes, leading to silent failures when WebSocket disconnects**Auth endpoint failure**: Private channel subscription fails if `/broadcasting/auth` returns non-200**Connection dropped without reconnection**: Underlying connector reconnection fails; events stop arriving**Callback leak**: Component unmounts without `leaveChannel()`; callback continues executing after component destruction**Namespace mismatch**: Event name with incorrect namespace prefix never matches server-emitted events**CORS rejection**: Auth endpoint blocked by CORS; private channel subscription never completesRequired frontend companion for all Laravel real-time featuresAvailable as standalone npm package (`laravel-echo`) and framework-specific packagesInstalled automatically by `php artisan install:broadcasting` with Vite scaffoldingUsed in Laravel starter kits (Breeze, Jetstream) for real-time featuresCompatible with Vue 3, React, Svelte 5, and vanilla JavaScriptK10: Echo Framework Integrations (React/Vue/Svelte)K01: Laravel Broadcasting ArchitectureK11: Public/Private/Presence Channel PatternsK31: Client Events (Whisper, Typing Indicators)

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization