# Sanctum SPA Cookie Auth

## Metadata (Domain: API & CRUD System Engineering, Subdomain: API Authentication & Authorization, Last Updated: 2026-06-02)

## Executive Summary
Sanctum's SPA cookie authentication enables API authentication for single-page applications using Laravel's session cookies and CSRF protection instead of tokens. The SPA communicates with the Laravel backend on the same or subdomain, avoids token storage in browser-accessible locations, and relies on HTTP-only session cookies for authentication. This approach is simpler and more secure than token-based auth for first-party SPAs because cookies are automatically sent with requests and protected against XSS by the HTTP-only flag.

## Core Concepts
- **Same-domain constraint**: Sanctum SPA auth only works when the SPA and the Laravel backend share the same top-level domain (e.g., `app.example.com` SPA, `api.example.com` backend) because cookies are not sent cross-domain.
- **Stateful guard**: Sanctum provides a `auth:sanctum` guard that, in SPA mode, checks the session cookie rather than an API token. It behaves like the `web` guard but is applied to API routes.
- **CSRF protection**: The SPA must first fetch `/sanctum/csrf-cookie` to obtain a CSRF token (set as an `XSRF-TOKEN` cookie), then include that token in subsequent POST/PUT/DELETE requests via the `X-XSRF-TOKEN` header.
- **Session driver**: The session driver must be `cookie` (not `file`, `database`, or `redis`) because the SPA does not send a session cookie identifier — instead, Sanctum reads the session data directly from the encrypted cookie.

## Mental Models
- **Cookie as credential**: Think of the session cookie like a hotel keycard. Once you check in (login), you carry the keycard everywhere. You don't need to show ID again until checkout (logout).
- **CSRF as double-check**: The CSRF token is like a signature on each request proving the request came from your JavaScript, not an external site tricking the browser.
- **Same-origin glass wall**: The SPA and API must live on the same origin or nearby subdomains. This is the glass wall of cookie-based auth — it works perfectly within the wall, not at all outside it.

## Internal Mechanics
1. The SPA sends `GET /sanctum/csrf-cookie`. Laravel sets two cookies: `XSRF-TOKEN` (readable by JavaScript, contains the encrypted CSRF token) and `laravel_session` (HTTP-only, readable only by the server).
2. The SPA extracts the CSRF token from the `XSRF-TOKEN` cookie (Angular convention — Laravel follows this) and sends it as the `X-XSRF-TOKEN` header with the login POST request.
3. Laravel validates the CSRF token, authenticates the user, and sets `Set-Cookie` headers establishing the authenticated session.
4. Subsequent API requests automatically include the session cookie. Sanctum's `EnsureFrontendRequestsAreStateful` middleware checks `SANCTUM_STATEFUL_DOMAINS` to decide whether to use cookie/session auth or token auth.
5. On logout, the session is invalidated server-side and the cookies are cleared.

## Patterns
- **SPA login flow**: `GET /sanctum/csrf-cookie` → `POST /login` (with email + password + CSRF header) → handle response → redirect SPA to dashboard.
- **Protected API routes**: Wrap routes in `auth:sanctum` middleware. Sanctum automatically detects if the request is from a stateful (cookie) or stateless (token) client.
- **Logout**: `POST /logout` to invalidate the session. Clear any client-side stored CSRF token.
- **Axios/Next.js setup**: Configure `withCredentials: true` and `xsrfCookieName: 'XSRF-TOKEN'`, `xsrfHeaderName: 'X-XSRF-TOKEN'` in Axios (default behavior works).
- **Custom SPA domain**: Set `SANCTUM_STATEFUL_DOMAINS` in `config/sanctum.php` to the SPA's domain, e.g., `'app.example.com'` or `'localhost:3000'` for development.

## Architectural Decisions
1. **Session driver must be cookie**: Sanctum's SPA mode relies on reading session data from the encrypted cookie. If the session driver is `redis` or `database`, SPA auth will not work because the request does not carry a session ID cookie.
2. **CORS must allow credentials**: `Access-Control-Allow-Credentials: true` must be set. The frontend must use `credentials: 'include'` (fetch) or `withCredentials: true` (Axios).
3. **Use a separate auth route prefix**: Keep Sanctum's CSRF cookie route outside any authenticated middleware groups. Typically served at the root level.

## Tradeoffs (table)
| Aspect | SPA Cookie Auth | Token Auth |
|--------|---------------|------------|
| XSS vulnerability | Low (HTTP-only cookie) | High (token in localStorage) |
| CSRF needed | Yes | No (tokens are not browser-managed) |
| Cross-domain | No | Yes |
| Mobile app support | No | Yes |
| Server-side state | Yes (session) | No (stateless) |
| Logout control | Immediate (session delete) | Delayed (token expiry/revocation) |
| Concurrent sessions | Limited by session config | Unlimited (per token) |

## Performance Considerations
- Session cookie size grows with session data. Keep minimal data in the session to avoid oversized cookies (headers rejected by some proxies at >8KB).
- Every request decrypts the session cookie. Use a fast encryption method (AES-256-GCM is default and fast).
- CSRF token regeneration on every request (default) adds a slight overhead. Can be configured to regenerate less frequently for high-traffic SPAs.

## Production Considerations
- **HTTPS is mandatory**: Set `SESSION_SECURE_COOKIE=true` and `SANCTUM_STATEFUL_DOMAINS` to your production domains. Cookies without `Secure` flag in production are rejected by browsers.
- **SameSite cookie attribute**: Set `SESSION_SAMESITE_COOKIE=none` when the SPA and API are on different subdomains but same top-level domain. Use `lax` when they share the exact same origin.
- **CSRF cookie expiration**: Default is 2 hours. For long-lived SPA sessions, increase `csrf_expiration` in `config/sanctum.php` to match session lifetime.
- **Load balancers and proxy trust**: Ensure Laravel trusts the proxy headers so it generates correct URLs in CSRF cookies. Configure `TrustProxies` middleware.
- **Separate subdomain setup**: When SPA is on `app.example.com` and API on `api.example.com`, both share the `example.com` domain for cookies. Set `SESSION_DOMAIN=.example.com`.

## Common Mistakes
- Using `file` or `database` session driver with Sanctum SPA mode (cookies won't carry session data).
- Forgetting to set `withCredentials: true` in the frontend HTTP client — cookies are not sent.
- Missing `SANCTUM_STATEFUL_DOMAINS` configuration — Sanctum falls back to token auth and returns 401.
- Sending CSRF token as `X-CSRF-TOKEN` instead of `X-XSRF-TOKEN` (Laravel uses the Angular-style header name).
- Not serving the CSRF cookie route (`/sanctum/csrf-cookie`) over HTTPS in development (local dev with `http://localhost` is fine; `http://192.168.x.x` is not).
- Assuming SPA cookie auth works with token-based testing — tests must use `actingAs` with the `web` guard or explicitly set session state.

## Failure Modes
1. **419 Page Expired**: CSRF token mismatch. The `XSRF-TOKEN` cookie was not refreshed or the request exceeded the CSRF expiration time. Solution: Re-fetch `/sanctum/csrf-cookie` before the sensitive request.
2. **Cross-origin cookie blocked**: Browser blocks third-party cookies. SPA and API on different domains. Solution: Move to same top-level domain with subdomain separation, or switch to token-based auth.
3. **401 Unauthenticated (cookie present but invalid)**: Session expired or session was manually invalidated. Solution: The SPA should catch 401 responses and redirect to the login page to re-authenticate.
4. **Cookie size exceeds header limit**: Session stores too much data. Solution: Move session data to server-side store (Redis) and only store the session ID in the cookie — but this requires changing the session driver (and thus switching from SPA cookie mode).

## Ecosystem Usage
- **Inertia.js SPA**: The default authentication setup in Laravel Breeze with Inertia uses Sanctum SPA cookie auth. The CSRF cookie fetch is handled automatically by the Inertia adapter.
- **Next.js + Laravel**: Common architecture where Next.js (on `next.example.com`) fetches from `api.example.com`. Requires `SESSION_DOMAIN=.example.com` and SameSite=None.
- **Vue SPA (standalone)**: Axios interceptors handle CSRF token refresh on 419 responses.

## Related Knowledge Units
### Prerequisites
- CSRF protection in Laravel
- HTTP cookies and SameSite attribute
- CORS configuration

### Related Topics
- [sanctum-vs-passport-decision](./phase-2/01-sanctum-vs-passport-decision.md)
- [sanctum-token-auth](./phase-2/03-sanctum-token-auth.md)
- [cors-configuration](./phase-2/12-cors-configuration.md)

### Advanced Follow-up Topics
- Session fixation attacks and mitigation
- Cookie prefixing for subdomain isolation
- Token-based fallback when SPA cookie auth is not possible

## Research Notes
### Source Analysis
Laravel Sanctum documentation covers SPA authentication in detail. The `EnsureFrontendRequestsAreStateful` middleware source code reveals the exact logic for distinguishing stateful vs stateless requests.

### Key Insight
Sanctum SPA cookie auth eliminates the token storage dilemma for SPAs (localStorage vs cookies). Because the cookie is HTTP-only, it is immune to XSS-based token theft. The trade-off is the same-origin constraint — acceptable for most first-party applications but limiting for third-party integrations.

### Version-Specific Notes
- **Sanctum 3.x (Laravel 10+)**: No changes to the core SPA flow. Main improvements are in token management.
- **Browser third-party cookie deprecation**: Chrome's phased rollout of third-party cookie blocking makes cross-domain SPA cookie auth increasingly fragile. Plan for token-based auth if your SPA must live on a completely different origin.

## Tradeoffs

**Benefit:** Centralized, consistent pattern. **Cost:** Additional abstraction layer, indirection. **Consequence:** Cleaner controllers but requires team discipline to maintain separation.