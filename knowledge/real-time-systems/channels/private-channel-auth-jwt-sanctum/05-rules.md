## Always Specify the `guards` Option for Non-Session Auth
---
## Framework Usage
---
Always set the `guards` option on `Broadcast::channel()` when using token-based authentication (Sanctum, Passport).
---
The default `web` guard resolves users from session cookies, which is unavailable in API-driven applications. Without specifying guards, all private channel auth requests return 401.
---
```php
Broadcast::channel('orders.{id}', fn($user, $id) => $user->id === (int)$id); // Only web guard
```
---
```php
Broadcast::channel('orders.{id}', fn($user, $id) => $user->id === (int)$id, [
    'guards' => ['sanctum', 'web']  // Hybrid API + session support
]);
```
---
Session-only web applications where no API clients need broadcasting. No common exceptions for API apps.
---
All private channel subscription failures for API clients.

## Never Expose Bearer Tokens in Client-Side Build Artifacts
---
## Security
---
Never hardcode Bearer tokens in Echo configuration that gets bundled into client-side JavaScript.
---
Tokens baked into JavaScript bundles are exposed in source maps, browser dev tools, and build artifact storage. Any XSS vulnerability can exfiltrate them.
---
```javascript
// Token hardcoded in source — exposed in bundle
auth: { headers: { Authorization: 'Bearer 1|abc123...' } }
```
---
```javascript
// Token from runtime storage
auth: { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }
```
---
Server-side rendered applications where tokens are injected per-request. No common exceptions for SPA/PWA.
---
Token theft via XSS; persistent credential exposure.

## Always Include `Accept: application/json` in Auth Headers
---
## Framework Usage
---
Always set `Accept: application/json` in Echo's auth headers for proper JSON error responses.
---
Without the `Accept: application/json` header, Laravel may return HTML error pages on auth failure instead of JSON, causing Echo to fail parsing the response.
---
```javascript
auth: { headers: { Authorization: 'Bearer ' + token } } // Missing Accept header
```
---
```javascript
auth: {
    headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/json',
    },
}
```
---
No common exceptions; the Accept header is always needed for API-driven broadcast auth.
---
Parse errors on auth failure; silent subscription failures.

## Always Implement Token Refresh for Long-Lived Echo Connections
---
## Reliability
---
Always implement a token refresh mechanism for Echo connections that outlast the token's TTL.
---
Short-lived tokens expire while Echo maintains the WebSocket connection. When the connection drops and reconnects, the expired token causes auth failures, preventing reconnection.
---
```javascript
// Static token — expires and breaks reconnection
auth: { headers: { Authorization: 'Bearer ' + token } }
```
---
```javascript
// Dynamic token with refresh
auth: {
    headers: {
        Authorization: 'Bearer ' + (async () => await refreshToken())(),
    },
}
```
---
Connections using long-lived tokens (days/weeks). No common exceptions for short-lived tokens.
---
Silent disconnections; failed reconnections after token expiry.

## Always Use Multi-Guard Channels for Hybrid Session + API Applications
---
## Architecture
---
Always specify both session and token guards in channel definitions when the application serves both web and API clients.
---
Without multi-guard configuration, one client type will always fail authorization. Separate channel definitions per guard type duplicate code and increase maintenance burden.
---
```php
// Separate channels per client type — duplicated
Broadcast::channel('orders.{id}', fn($u, $id) => ..., ['guards' => ['web']]);
Broadcast::channel('orders.{id}', fn($u, $id) => ..., ['guards' => ['sanctum']]); // Overlapping
```
---
```php
// Single multi-guard channel
Broadcast::channel('orders.{id}', fn($user, $id) => ..., ['guards' => ['sanctum', 'web']]);
```
---
Applications serving only one client type. No common exceptions for hybrid apps.
---
Duplicate channel definitions; maintenance overhead.

## Never Use `auth:api` Middleware on Broadcast Routes
---
## Framework Usage
---
Never apply `auth:api` middleware to broadcast routes; let guard resolution in `Broadcast::channel()` handle authentication.
---
Applying middleware before the broadcast controller blocks requests before the multi-guard resolution logic can attempt alternative guards. This prevents hybrid auth from working.
---
```php
Broadcast::routes(['middleware' => ['auth:api']]); // Blocks sanctum/web guards
```
---
```php
Broadcast::routes(['middleware' => ['auth:sanctum']]); // Matches guard in channel definition
```
---
Single-guard applications. No common exceptions for multi-guard setups.
---
Guard resolution conflicts; failed auth for valid client types.
