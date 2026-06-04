# Skill: Use Private Channel Auth with JWT/Sanctum

## Purpose
Configure token-based authentication (Sanctum, Passport, JWT) for private and presence channel authorization in API-driven Laravel applications.

## When To Use
- API-driven Laravel applications using Sanctum (SPAs or token-based)
- OAuth2-authenticated applications using Passport
- Applications serving both web sessions and API clients from the same backend
- Mobile applications needing token-based WebSocket authentication

## When NOT To Use
- Session-only web applications (default `web` guard suffices)
- Public-channel-only broadcasting

## Prerequisites
- Sanctum, Passport, or JWT authentication configured in the Laravel app
- Echo configured on the frontend with auth headers
- Private or presence channels defined in events

## Inputs
- Echo configuration with `auth.headers` containing Authorization header
- Channel definitions with `guards` option in `routes/channels.php`
- Token storage and refresh mechanism on the client

## Workflow
1. Add `['guards' => ['sanctum', 'web']]` to `Broadcast::channel()` definitions for multi-guard support
2. Configure Echo with `authEndpoint` and `auth: { headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' } }`
3. Store tokens in runtime storage (not hardcoded in source)—read from `localStorage` or secure storage
4. Implement token refresh mechanism for long-lived Echo connections
5. Include `Accept: application/json` header for proper JSON error responses
6. For Sanctum SPA auth: ensure CSRF token is included and `STATE_DOMAIN` is configured
7. Use multi-guard channels for hybrid applications serving both web and API clients
8. Avoid `auth:api` middleware on `Broadcast::routes()`—let guard resolution handle authentication
9. Test auth with all supported guard types before production deployment
10. Monitor auth failures per guard type

## Validation Checklist
- [ ] Sanctum/Passport guard resolves users correctly in auth callback
- [ ] Echo `auth.headers` sends proper Authorization header
- [ ] Multi-guard channels work for both session and token users
- [ ] Token expiry handled gracefully (refresh or re-auth)
- [ ] CORS configured for auth endpoint if cross-origin
- [ ] No tokens exposed in client-side build artifacts
- [ ] `Accept: application/json` header included

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| API clients get 401 on auth endpoint | `guards` option not specified, defaults to `web` | Add `['guards' => ['sanctum']]` to channel |
| Auth returns HTML instead of JSON | Missing `Accept: application/json` header | Add header to Echo auth config |
| Reconnection fails after token expiry | No token refresh mechanism | Implement token refresh before expiry |
| Token visible in source maps | Hardcoded in source code | Read from `localStorage.getItem('token')` at runtime |
| Sanctum SPA auth fails | CSRF token not sent with POST | Include `X-XSRF-TOKEN` header |

## Decision Points
- **Multi-guard vs single guard**: Use `['sanctum', 'web']` for hybrid apps; single guard for homogeneous clients
- **Token lifetime**: Short-lived tokens (15min) with refresh vs longer-lived (24h)—balance security against reconnection reliability

## Performance/Security Considerations
- Bearer tokens in client-side JS are accessible via XSS—use short-lived tokens
- Token validation executes on every subscription—no built-in auth caching
- Sanctum token lookup queries `personal_access_tokens` table
- Never hardcode tokens in source code or environment variables baked into JS bundles

## Related Rules (from 05-rules.md)
- Always Specify the `guards` Option for Non-Session Auth
- Never Expose Bearer Tokens in Client-Side Build Artifacts
- Always Include `Accept: application/json` in Auth Headers
- Always Implement Token Refresh for Long-Lived Echo Connections
- Always Use Multi-Guard Channels for Hybrid Session + API Applications
- Never Use `auth:api` Middleware on Broadcast Routes

## Related Skills
- Authorize Private and Presence Channels in routes/channels.php
- Optimize and Cache Auth Endpoint Decisions

## Success Criteria
- API clients (mobile, SPA) authenticate successfully via token-based guards
- Session-based web clients continue to work on same channels
- Token refresh keeps connections alive without interruption
- No tokens leaked in client-side build artifacts
