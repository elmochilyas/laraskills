# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | Sanctum SPA Cookie Auth vs Token Auth |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Laravel Sanctum provides two distinct authentication modes: **SPA cookie auth** (session-based, same-domain) and **API token auth** (Bearer token, cross-domain). SPA mode uses Laravel's session cookies with Sanctum's CSRF token endpoint (`/sanctum/csrf-cookie`). Token mode issues SHA-256 hashed personal access tokens (PATs) via the `Authorization: Bearer` header. The choice depends on the client type: browser-based SPAs on the same domain use cookie auth; mobile apps, third-party clients, and cross-domain SPAs use token auth.

---

## Core Concepts

- **SPA Cookie Auth**: User logs in → session cookie set → Sanctum CSRF cookie endpoint called → subsequent requests include session cookie + XSRF-TOKEN. No token needed.
- **Token Auth**: User logs in → server returns plaintext token → client stores and sends as `Authorization: Bearer <token>` on every request. Server stores SHA-256 hash.
- **CSRF Protection**: SPA mode relies on `same_site` cookies and CSRF token exchange. Token mode does not need CSRF (Bearer tokens are not subject to browser same-origin policies).
- **Same-Domain Requirement**: SPA mode works for first-party domains (`app.example.com` → `api.example.com` with CORS + `same_site=none` + `secure`). Cross-domain requires token mode.

---

## When To Use SPA Cookie Auth

- First-party SPA hosted on the same root domain as the Laravel backend
- Browser-based applications where CSRF protection and XSS mitigation are priorities
- Applications already using Laravel sessions

## When To Use Token Auth

- Mobile applications (iOS, Android)
- Third-party API consumers
- Cross-domain SPA applications (different domains)
- M2M service accounts
- Serverless/edge functions needing API access

---

## Best Practices

- **SPA for First-Party, Token for Everything Else**: Cookie auth provides better browser security (CSRF protection, token not accessible to JS). Reserve tokens for non-browser clients.
- **Use `/sanctum/csrf-cookie`**: SPA must call this endpoint before login to establish CSRF protection.
- **`same_site` Configuration**: SPA on subdomain: set SANCTUM_STATEFUL_DOMAINS + `same_site=none` + `secure=true`. Same domain: `same_site=lax` (safer default).
- **Token Hashing**: Sanctum hashes tokens with SHA-256 before storing. The plaintext token is shown once — save it client-side securely.
- **Token Expiry**: Implement token expiry for long-lived tokens. Prune expired tokens.

---

## Architecture Guidelines

- SPA mode: session driver (`config/session.php`) must use `database`, `redis`, or `memcached` (not `file` in production)
- Token mode: no session dependency — stateless API calls
- Stateful domains configured in `config/sanctum.php` → `stateful` array
- Both modes can coexist — same user can have both a session and tokens simultaneously
- Route middleware: `auth:sanctum` applies to both modes

---

## Performance Considerations

- SPA mode: session read/write on every request — use Redis for session storage in production
- Token mode: SHA-256 hash lookup on every request — index the `tokenable_id` and `token` columns
- Token mode is slightly faster (no session read) for API-heavy applications

---

## Security Considerations

- **XSS**: SPA mode is more resistant to XSS token theft (session cookie is `httpOnly` — not accessible to JS). Token mode sends Bearer token in Authorization header (accessible to JS if stored in localStorage).
- **CSRF**: SPA mode requires CSRF token. Token mode does not — Bearer tokens are not subject to CSRF.
- **Token Leakage**: Token mode tokens are in every request header — leak via logs, referer headers, or server logs.
- **Session Fixation**: SPA mode requires session regeneration after login — Sanctum handles this automatically.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using token auth for same-domain SPA | Misunderstanding modes | Token stored in localStorage — XSS vulnerable | Use SPA cookie auth (httpOnly cookie) |
| Not configuring stateful domains | Forgetting SANCTUM_STATEFUL_DOMAINS | SPA auth returns unauthenticated | Add SANCTUM_STATEFUL_DOMAINS in .env |
| Storing Bearer token in localStorage | Developer habit | Token accessible to any JS on the page | Use httpOnly cookies for browser; secure storage for native apps |
| Missing XSRF-TOKEN on SPA mutating requests | Skipping CSRF cookie call | POST/PUT/DELETE requests fail | Always call /sanctum/csrf-cookie before mutating requests |

---

## Anti-Patterns

- **Storing Sanctum Bearer tokens in localStorage for SPA**: Use cookie auth for browser apps
- **Using token auth for everything**: Cookie auth is more secure for browser-based SPAs
- **Sharing tokens across multiple users or services**: Each user needs their own token

---

## Examples

**SPA cookie auth setup:**
```php
// .env
SANCTUM_STATEFUL_DOMAINS=app.example.com
SESSION_DOMAIN=.example.com

// config/sanctum.php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
    '%s%s',
    'localhost,localhost:3000,localhost:8080,127.0.0.1,127.0.0.1:8080,::1',
    env('APP_URL') ? ',' . parse_url(env('APP_URL'), PHP_URL_HOST) : ''
))),
```

**SPA client (Axios):**
```javascript
// Before login
await axios.get('/sanctum/csrf-cookie');
// Login
await axios.post('/login', { email, password });
// Subsequent requests include session cookie + XSRF-TOKEN (Axios auto-sends)
```

**Token auth (mobile/third-party):**
```php
$token = $user->createToken('mobile-app', ['post:read'])->plainTextToken;
// Client stores this token and sends it as:
// Authorization: Bearer <token>
```

---

## Related Topics

- Sanctum ability-based token scoping
- Session configuration (secure, http_only, same_site)
- CORS configuration
- Authentication middleware

---

## AI Agent Notes

- The SPA vs Token decision is primarily about the client type, not security preference. Both are secure when used correctly.
- Common issue: SPA returns 401 unauthenticated — check SANCTUM_STATEFUL_DOMAINS and `same_site` cookie configuration.
- For production SPAs, prefer cookie auth over token auth stored in localStorage.

---

## Verification

- [ ] SPA mode: SANCTUM_STATEFUL_DOMAINS configured correctly
- [ ] SPA mode: session driver appropriate for production (not `file`)
- [ ] SPA mode: session configuration (secure, same_site) appropriate for domain setup
- [ ] Token mode: tokens stored securely (not plaintext in database — Sanctum hashes them)
- [ ] Token mode: expired tokens pruned regularly
- [ ] Both modes: CSRF protection appropriate for the mode
- [ ] Both modes: CORS configuration allows the required origins
- [ ] Both modes: XSS mitigation appropriate (httpOnly for cookies, secure token storage)
