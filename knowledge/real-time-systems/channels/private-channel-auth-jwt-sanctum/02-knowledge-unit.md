# Metadata
Domain: Real-Time Systems
Subdomain: Channel Types & Authorization
Knowledge Unit: Private Channel Auth with JWT/Sanctum
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Private channel authorization in API-driven Laravel applications requires custom authentication guards beyond the default web session guard. Sanctum and Passport are the primary token-based auth systems used with broadcasting. The `Broadcast::channel()` method accepts a `guards` option array specifying which auth guards to attempt. For Sanctum, the `sanctum` guard resolves API token-authenticated users. For Passport, the `api` guard with Passport driver resolves OAuth-authenticated users. The Echo configuration must include the appropriate `authEndpoint` and `auth.headers` for token transmission. JWT authentication (via `tymon/jwt-auth` or Sanctum's JWT-like tokens) follows the same pattern—the guard resolves the user from the token, and channel authorization proceeds with the resolved user.

## Core Concepts
The auth guard determines how Laravel resolves the authenticated user for channel authorization callbacks. The default `web` guard uses session cookies. For APIs (SPAs, mobile apps), session auth is unavailable, so token-based guards (`sanctum`, `passport`, custom) must be used. The `Broadcast::channel()` guards option creates a multi-guard resolution chain: Laravel attempts each guard in order until one successfully resolves a user. The resolved user is then passed to the authorization callback.

## Mental Models
Auth guards are user-resolvers. Channel authorization doesn't care how the user was authenticated—it only needs a resolved user object to pass to the authorization callback. Switching from web to sanctum auth means the user is identified by an API token instead of a session cookie, but the authorization logic is identical.

## Internal Mechanics
Echo sends an AJAX POST to `/broadcasting/auth` with the channel name. For Sanctum, the request includes the `Authorization: Bearer {token}` header (configured in Echo's `auth.headers`). The `BroadcastController::authenticate()` method attempts to resolve the user using configured guards. With `'guards' => ['sanctum']`, the Sanctum guard authenticates the user from the Bearer token. The resolved user is then passed to the channel authorization callback. If no guard resolves a user, the request returns 401.

## Patterns
- **Multi-guard channel auth**: `Broadcast::channel('orders.{id}', fn($user, $id) => ..., ['guards' => ['sanctum', 'web']])` for hybrid session+API apps
- **Token in Authorization header**: Echo's `auth.headers` configuration sends Bearer tokens
- **SPA-first approach**: Sanctum's SPA authentication (cookie-based for first-party, token-based for API clients)
- **Stateless broadcasting**: JWT-based auth enables fully stateless broadcasting for API-driven architectures

## Architectural Decisions
- **Guard resolution chain**: Allows different client types (web, API, mobile) to authenticate through the same channel auth endpoint
- **Token transmission via Echo headers**: Echo's `auth.headers` sends tokens that Laravel's guard layer processes
- **Separate auth from authorization**: The guard resolves who you are; the callback determines if you can access the channel

## Tradeoffs
- **Token exposure in Echo config**: Bearer tokens in client-side JavaScript are accessible via XSS
- **Token expiration**: JWT/Personal Access Token expiration requires client-side refresh handling
- **Multi-guard complexity**: Multiple guard resolution adds marginal overhead per auth request
- **Stateless auth limitations**: Cannot use features like session-based broadcasting exclusivity (e.g., single-session enforcement)

## Performance Considerations
- Token validation on every subscription (no built-in auth caching)
- Sanctum token lookup queries the `personal_access_tokens` database table
- Passport token validation requires OAuth server round-trip or cached token scopes
- JWT validation is stateless (no database query) but requires cryptographic verification
- Auth caching middleware can reduce repeated guard resolution for the same user

## Production Considerations
- Set `STATEFUL_DOMAINS` in Sanctum config for SPA cookie-based broadcasting auth
- Configure CORS properly—the auth endpoint must accept cross-origin requests if Echo runs on a different origin
- Use short-lived tokens for Echo connections; implement token refresh mechanisms
- Log auth failures for security monitoring (invalid tokens, expired tokens, unauthorized channel access)
- Rate limit `/broadcasting/auth` to prevent brute-force token testing
- Test auth across all supported guard types before production

## Common Mistakes
- Not specifying guards option on `Broadcast::channel()`—defaults to `web` guard which fails for API requests
- Exposing Bearer tokens in client-side environment variables that get baked into JavaScript bundles
- Using `auth:api` middleware on the Broadcasting route instead of relying on guard resolution
- Not including `Accept: application/json` header in Echo auth requests (Laravel returns JSON on auth failure)
- Configuring `auth.headers` with tokens that expire before the Echo session duration

## Failure Modes
- **Guard resolution failure**: Token is valid but no configured guard recognizes it; channel subscription returns 401
- **Token expiration mid-session**: Echo holds a valid WebSocket connection but token expires; reconnection auth fails
- **Guard configuration mismatch**: `Broadcast::routes()` middleware stack doesn't include the correct auth middleware
- **CORS preflight failure**: Sanctum SPA auth requires CORS headers that are not configured for the auth endpoint
- **CSRF token validation**: Sanctum's SPA authentication requires CSRF token for POST requests to auth endpoint

## Ecosystem Usage
- Sanctum: default for new Laravel applications, SPA authentication, API token authentication
- Passport: OAuth2-based applications, third-party API clients
- JWT (tymon/jwt-auth): legacy JWT implementations, custom token formats
- Multi-guard: applications serving both web sessions and API clients from the same backend

## Related Knowledge Units
- K12: Channel Authorization (routes/channels.php)
- K11: Public/Private/Presence Channel Patterns
- K24: WebSocket Security (TLS, CORS, Auth, CSWSH)
- K36: Auth Endpoint Optimization & Caching

## Research Notes
Sanctum is the recommended auth guard for most Laravel applications. The multi-guard support (`'guards' => ['sanctum', 'web']`) allows the same channel to serve both session-based browser users and token-based API users. Laravel 11+ streamlined Sanctum configuration with `php artisan install:api`. For SPA broadcasting auth, Sanctum's cookie-based session authentication requires the request to originate from a configured `STATE_DOMAIN`. Passport's token-based auth requires the `api` guard with Passport driver configured.
