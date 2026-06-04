# Decomposition: Private Channel Auth Jwt Sanctum

## Topic Overview
Private channel authorization in API-driven Laravel applications requires custom authentication guards beyond the default web session guard. Sanctum and Passport are the primary token-based auth systems used with broadcasting. The `Broadcast::channel()` method accepts a `guards` option array specifying which auth guards to attempt. For Sanctum, the `sanctum` guard resolves API token-authenticated users. For Passport, the `api` guard with Passport driver resolves OAuth-authenticated users. The...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
channel-types-authorization/K29-private-channel-auth-jwt-sanctum/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Private Channel Auth Jwt Sanctum
- **Purpose:** Private channel authorization in API-driven Laravel applications requires custom authentication guards beyond the default web session guard. Sanctum and Passport are the primary token-based auth systems used with broadcasting. The `Broadcast::channel()` method accepts a `guards` option array specifying which auth guards to attempt. For Sanctum, the `sanctum` guard resolves API token-authenticated users. For Passport, the `api` guard with Passport driver resolves OAuth-authenticated users. The...
- **Difficulty:** Intermediate
- **Dependencies:
  - K12: Channel Authorization (routes/channels.php)
  - K11: Public/Private/Presence Channel Patterns
  - K24: WebSocket Security (TLS, CORS, Auth, CSWSH)
  - K36: Auth Endpoint Optimization & Caching

## Dependency Graph
**Depends on:**
  - K12: Channel Authorization (routes/channels.php)
  - K11: Public/Private/Presence Channel Patterns
  - K24: WebSocket Security (TLS, CORS, Auth, CSWSH)
  - K36: Auth Endpoint Optimization & Caching

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Multi-guard channel auth**: `Broadcast::channel('orders.{id}', fn($user, $id) => ..., ['guards' => ['sanctum', 'web']])` for hybrid session+API apps**Token in Authorization header**: Echo's `auth.headers` configuration sends Bearer tokens**SPA-first approach**: Sanctum's SPA authentication (cookie-based for first-party, token-based for API clients)**Stateless broadcasting**: JWT-based auth enables fully stateless broadcasting for API-driven architectures**Guard resolution chain**: Allows different client types (web, API, mobile) to authenticate through the same channel auth endpoint**Token transmission via Echo headers**: Echo's `auth.headers` sends tokens that Laravel's guard layer processes**Separate auth from authorization**: The guard resolves who you are; the callback determines if you can access the channel**Token exposure in Echo config**: Bearer tokens in client-side JavaScript are accessible via XSS**Token expiration**: JWT/Personal Access Token expiration requires client-side refresh handling**Multi-guard complexity**: Multiple guard resolution adds marginal overhead per auth request**Stateless auth limitations**: Cannot use features like session-based broadcasting exclusivity (e.g., single-session enforcement)Token validation on every subscription (no built-in auth caching)Sanctum token lookup queries the `personal_access_tokens` database tablePassport token validation requires OAuth server round-trip or cached token scopesJWT validation is stateless (no database query) but requires cryptographic verificationAuth caching middleware can reduce repeated guard resolution for the same userSet `STATEFUL_DOMAINS` in Sanctum config for SPA cookie-based broadcasting authConfigure CORS properly—the auth endpoint must accept cross-origin requests if Echo runs on a different originUse short-lived tokens for Echo connections; implement token refresh mechanismsLog auth failures for security monitoring (invalid tokens, expired tokens, unauthorized channel access)Rate limit `/broadcasting/auth` to prevent brute-force token testingTest auth across all supported guard types before productionNot specifying guards option on `Broadcast::channel()`—defaults to `web` guard which fails for API requestsExposing Bearer tokens in client-side environment variables that get baked into JavaScript bundlesUsing `auth:api` middleware on the Broadcasting route instead of relying on guard resolutionNot including `Accept: application/json` header in Echo auth requests (Laravel returns JSON on auth failure)Configuring `auth.headers` with tokens that expire before the Echo session duration**Guard resolution failure**: Token is valid but no configured guard recognizes it; channel subscription returns 401**Token expiration mid-session**: Echo holds a valid WebSocket connection but token expires; reconnection auth fails**Guard configuration mismatch**: `Broadcast::routes()` middleware stack doesn't include the correct auth middleware**CORS preflight failure**: Sanctum SPA auth requires CORS headers that are not configured for the auth endpoint**CSRF token validation**: Sanctum's SPA authentication requires CSRF token for POST requests to auth endpointSanctum: default for new Laravel applications, SPA authentication, API token authenticationPassport: OAuth2-based applications, third-party API clientsJWT (tymon/jwt-auth): legacy JWT implementations, custom token formatsMulti-guard: applications serving both web sessions and API clients from the same backendK12: Channel Authorization (routes/channels.php)K11: Public/Private/Presence Channel PatternsK24: WebSocket Security (TLS, CORS, Auth, CSWSH)K36: Auth Endpoint Optimization & Caching

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