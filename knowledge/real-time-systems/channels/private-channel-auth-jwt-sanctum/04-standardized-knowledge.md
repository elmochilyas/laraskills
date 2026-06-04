# Standardized Knowledge: Private Channel Auth with JWT/Sanctum

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Real-Time Systems |
| Subdomain | Channel Types & Authorization |
| Knowledge Unit ID | K29 |
| Knowledge Unit | Private Channel Auth with JWT/Sanctum |
| Difficulty | Intermediate |
| Maturity | Stable |
| Confidence | High |
| Last Updated | 2026-06-02 |

## Overview

Private channel authorization in API-driven Laravel applications requires custom authentication guards beyond the default web session guard. Sanctum and Passport are the primary token-based auth systems used with broadcasting. The `Broadcast::channel()` method accepts a `guards` option array specifying which auth guards to attempt. For Sanctum, the `sanctum` guard resolves API token-authenticated users. For Passport, the `api` guard with Passport driver resolves OAuth-authenticated users. The Echo configuration must include the appropriate `authEndpoint` and `auth.headers` for token transmission.

## Core Concepts

The auth guard determines how Laravel resolves the authenticated user for channel authorization callbacks. The default `web` guard uses session cookies. For APIs (SPAs, mobile apps), session auth is unavailable, so token-based guards must be used. The `Broadcast::channel()` guards option creates a multi-guard resolution chain: Laravel attempts each guard in order until one successfully resolves a user. The resolved user is then passed to the authorization callback.

Echo sends an AJAX POST to `/broadcasting/auth` with the channel name. For Sanctum, the request includes the `Authorization: Bearer {token}` header configured in Echo's `auth.headers`. The `BroadcastController::authenticate()` method resolves the user using configured guards.

## When To Use

- API-driven Laravel applications using Sanctum (SPAs or token-based)
- OAuth2-authenticated applications using Passport
- Applications serving both web sessions and API clients from the same backend
- Mobile applications needing token-based WebSocket authentication

## When NOT To Use

- Session-only web applications (default `web` guard suffices)
- Public-channel-only broadcasting (no private channels needed)
- Applications without token-based authentication infrastructure

## Best Practices (WHY)

- **Multi-guard channel auth**: `['guards' => ['sanctum', 'web']]` enables hybrid session+API support from a single auth endpoint
- **Token in Authorization header**: Echo's `auth.headers` configuration sends Bearer tokens, keeping auth out of URL query strings
- **SPA-first approach**: Sanctum's cookie-based session for first-party UI, token-based for API clients
- **Stateless broadcasting**: JWT-based auth enables fully stateless broadcasting for API-driven architectures

## Architecture Guidelines

- Guard resolution chain allows different client types to authenticate through the same channel auth endpoint
- Separate auth (who you are, resolved by guard) from authorization (what you can access, determined by callback)
- Token transmission via Echo headers keeps auth out of URLs and server logs
- Short-lived tokens for Echo connections with token refresh mechanisms prevent mid-session expiry

## Performance Considerations

- Token validation executes on every subscription (no built-in auth caching)
- Sanctum token lookup queries the `personal_access_tokens` database table
- Passport token validation requires OAuth server round-trip or cached token scopes
- JWT validation is stateless (no database query) but requires cryptographic verification
- Auth caching middleware can reduce repeated guard resolution for the same user

## Security Considerations

- Bearer tokens in client-side JavaScript are accessible via XSS—use short-lived tokens
- Token expiration requires client-side refresh handling to maintain WebSocket authentication
- Exposing tokens in environment variables baked into JS bundles is a common leak vector
- The auth endpoint must accept `Accept: application/json` header for proper error responses
- CSRF token validation required for Sanctum SPA authentication POST requests

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not specifying guards option | Defaults to `web` guard | All API auth requests return 401 | Add `['guards' => ['sanctum']]` to channel |
| Exposing Bearer tokens in client JS | Tokens in env vars baked into bundles | Token theft via XSS | Use short-lived tokens, refresh mechanism |
| Not including `Accept: application/json` | Missing header in Echo config | HTML error pages instead of JSON on auth failure | Configure `auth.headers` with Accept |
| Tokens expiring before session duration | Short token TTL without refresh | Reconnection fails after token expiry | Implement token refresh or use longer TTL |
| Using `auth:api` middleware on broadcast route | Misunderstanding guard resolution | Middleware blocks requests before guard can resolve | Let guard resolution handle auth |

## Anti-Patterns

- **Single guard for all contexts**: Using `web` guard exclusively forces API clients to use session cookies
- **Hardcoded tokens in Echo config**: Tokens in JavaScript source code are leaked on build artifact exposure
- **Ignoring CORS for auth endpoint**: Sanctum SPA auth requires proper CORS configuration for the auth endpoint

## Examples

```php
// Multi-guard channel auth
Broadcast::channel('orders.{id}', function ($user, $id) {
    return $user->id === (int) $id;
}, ['guards' => ['sanctum', 'web']]);

// Sanctum-only for API
Broadcast::channel('admin.alerts', function ($user) {
    return $user->hasRole('admin');
}, ['guards' => ['sanctum']]);
```

```javascript
// Echo configuration with token auth
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    authEndpoint: '/broadcasting/auth',
    auth: {
        headers: {
            Authorization: 'Bearer ' + localStorage.getItem('token'),
            Accept: 'application/json',
        },
    },
});
```

## Related Topics

- K12: Channel Authorization (routes/channels.php)
- K11: Public/Private/Presence Channel Patterns
- K24: WebSocket Security (TLS, CORS, Auth, CSWSH)
- K36: Auth Endpoint Optimization & Caching

## AI Agent Notes

- Sanctum is the recommended auth guard for most new Laravel applications
- Multi-guard support allows same channel to serve both session and token users
- Sanctum's SPA auth requires `STATE_DOMAIN` configuration for cookie-based auth
- Always test auth across all supported guard types before production deployment

## Verification

- [ ] Sanctum/Passport guard resolves users correctly in auth callback
- [ ] Echo `auth.headers` sends proper Authorization header
- [ ] Multi-guard channels work for both session and token users
- [ ] Token expiry is handled gracefully (refresh or re-auth)
- [ ] CORS is configured for the auth endpoint if cross-origin
- [ ] CSRF token is included for Sanctum SPA auth requests
- [ ] No tokens exposed in client-side build artifacts
