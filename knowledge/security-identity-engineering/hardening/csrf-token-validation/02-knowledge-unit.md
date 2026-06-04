# Metadata

Domain: Security & Identity Engineering
Subdomain: Security Hardening
Knowledge Unit: CSRF token exchange and validation
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Laravel's CSRF protection is implemented via the `VerifyCsrfToken` middleware, which validates a token stored in the session against a token submitted in the request. For server-rendered apps, the `@csrf` Blade directive inserts a hidden input with the token. For SPAs using Sanctum, a dedicated `/sanctum/csrf-cookie` endpoint sets an `XSRF-TOKEN` cookie that the SPA sends back as the `X-XSRF-TOKEN` header. CSRF protects against cross-site request forgery by ensuring state-changing requests (POST, PUT, PATCH, DELETE) originate from the same origin. APIs using Bearer tokens (no cookies) do not need CSRF protection.

---

# Core Concepts

- **CSRF Token**: Random string stored in the server session. Must match the token sent with the request. Regenerated on session start and authentication state change (login/logout).
- **@csrf Directive**: `<input type="hidden" name="_token" value="...">` — for Blade forms.
- **XSRF-TOKEN Cookie**: Encrypted cookie set by Sanctum's CSRF endpoint. The JavaScript frontend reads it and sends it back as `X-XSRF-TOKEN` header.
- **VerifyCsrfToken Middleware**: Included in the `web` middleware group. Checks all state-changing requests except those in the `$except` array.
- **Token Regeneration**: CSRF token regenerates on every session regeneration (login, logout). Old tokens are invalidated.

---

# Mental Models

- **Double-Submit Cookie Pattern**: Sanctum uses this — the same token is set as a cookie AND sent as a header. The server verifies they match. If an attacker makes a cross-origin request, they cannot read the cookie (same-origin policy) and therefore cannot set the matching header.
- **Session-Bound Token**: The CSRF token is tied to the user's session. Two users cannot share tokens. A stolen CSRF token is useless without the session cookie.

---

# Internal Mechanics

- `VerifyCsrfToken@handle()` calls `tokensMatch($request)`: compares `$request->input('_token')` or `$request->header('X-CSRF-TOKEN')` or `$request->header('X-XSRF-TOKEN')` against `$request->session()->token()`.
- The `X-XSRF-TOKEN` header value is decrypted (it comes from the encrypted `XSRF-TOKEN` cookie).
- Token is NOT regenerated between same-session requests — only on login/logout/session regeneration.
- Sanctum's CSRF endpoint: `GET /sanctum/csrf-cookie` sets the encrypted `XSRF-TOKEN` cookie via `Cookie::queue()`.
- API routes excluded: The `api` middleware group does NOT include `VerifyCsrfToken`. Token-based auth is inherently CSRF-safe.

---

# Patterns

## SPA CSRF Initialization Pattern
- **Purpose**: Bootstrap CSRF protection for SPA requests.
- **Implementation**: `GET /sanctum/csrf-cookie` → the frontend sets `withCredentials: true` → subsequent requests automatically include the `X-XSRF-TOKEN` header.
- **Benefits**: Automatic CSRF for first-party SPA requests.
- **Tradeoffs**: Requires CORS credentials configuration and stateful domain setup.

## CSRF Exemption for Webhooks
- **Purpose**: External webhooks hitting your app cannot include CSRF tokens.
- **Implementation**: Add webhook routes to `VerifyCsrfToken::$except` array.
- **Benefits**: External services can POST to your webhook endpoints.
- **Tradeoffs**: The routes are unprotected from CSRF — use signature verification (webhook secret) instead.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| CSRF via `@csrf` vs Sanctum cookie | Server-rendered app vs SPA | `@csrf` for Blade, Sanctum CSRF cookie for SPA |
| CSRF exempt for API | Token-based auth routes | Yes — API routes (api middleware group) are CSRF-safe by default |
| CSRF except array for webhooks | External POST callbacks | Use `$except` array but pair with webhook signature verification |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Prevents CSRF attacks on session-based auth | Adds hidden input to every form | Forgetting `@csrf` causes 419 (Page Expired) errors |
| Sanctum's cookie-based CSRF is transparent | Requires CORS + stateful domain config | Misconfiguration causes phantom 419 errors on SPA requests |
| Token regeneration on login/logout invalidates old tokens | Users with multiple tabs experience CSRF errors on stale tabs | When user logs out in one tab, the other tab's forms have invalid tokens |

---

# Performance Considerations

- CSRF token matching is a string comparison — negligible overhead.
- The session read/write for token storage is the only cost. Using file session is fine; database/Redis sessions add serialization overhead.
- Sanctum's CSRF cookie endpoint is a no-op (just sets cookie). It should not be rate-limited separately from login.

---

# Production Considerations

- **CSRF Token Expiry**: Bound to session lifetime. When session expires, the CSRF token is invalid (419 error). Users must refresh the page.
- **419 Error Handling**: Laravel converts `TokenMismatchException` to a 419 status page. Customize the error page or return JSON for API routes.
- **Exempting Routes**: Webhook routes in `$except` should also validate the webhook signature to compensate for missing CSRF.
- **Testing CSRF**: Use `$this->withoutMiddleware(VerifyCsrfToken::class)` or `$response = $this->post('/route', ['_token' => csrf_token()])`.

---

# Common Mistakes

- **Forgetting `@csrf` in forms**: Every POST/PUT/DELETE form needs `@csrf`. Stale documentation copies omit it, causing 419 errors.
- **Not sending `X-XSRF-TOKEN` header in SPAs**: Sanctum sets the cookie, but the HTTP client must read it and send the header. Axios does this automatically, but fetch does not — you must configure `credentials: 'include'` and set the header manually.
- **Adding webhook routes to `$except` without signature verification**: CSRF exemption without verifying webhook authenticity is a security hole.
- **Using Bearer token auth without exempting CSRF**: If an API route is in the `web` middleware group with `auth:sanctum`, CSRF validation still runs. But Bearer token requests don't have a CSRF token, causing 419 errors.

---

# Failure Modes

- **Token Mismatch After Session Regeneration**: If session regenerates (login/logout) on a page with an open form, submitting the form uses the old token. Solution: refresh page after login/logout.
- **Encrypted Cookie Decryption Failure**: If `APP_KEY` changes, the encrypted `XSRF-TOKEN` cookie cannot be decrypted. CSRF check fails with a decryption error.
- **Missing Session for CSRF Token**: If the route does not run `StartSession` middleware but includes `VerifyCsrfToken` (misconfiguration), the session has no token → `tokensMatch()` fails.

---

# Related Knowledge Units

- Prerequisites: Session configuration (secure, http_only, same_site), Middleware pipeline
- Related: Sanctum SPA cookie auth (CSRF in SPA context), CORS configuration (credentials for CSRF)
- Advanced Follow-up: CSRF token double-submit cookie pattern deep dive, Custom CSRF token storage, SameSite cookie CSRF mitigation

## Ecosystem Usage
- **Laravel Framework**: Provides default security middleware (EncryptCookies, AddQueuedCookiesToResponse, StartSession, ShareErrorsFromSession, VerifyCsrfToken). Blade's {{ }} syntax auto-escapes HTML output, preventing XSS.
- **Laravel CSP Nonce**: Illuminate\Http\Middleware\SetCacheHeaders and community packages like spatie/laravel-csp provide Content-Security-Policy header management with nonce-based inline script/style allowlisting.
- **CORS configuration**: Laravel's config/cors.php manages cross-origin requests via ruitcake/laravel-cors; configuration includes allowed origins, methods, headers, and preflight response caching.
- **CSRF protection**: Laravel's VerifyCsrfToken middleware excludes specified routes via $except array; the csrf_token() helper and @csrf Blade directive generate the token for forms and AJAX requests.
- **Session configuration**: Laravel's session drivers (file, cookie, database, Redis, Memcached, DynamoDB) are configured in config/session.php; HttpOnly, Secure, SameSite attributes configured at the session driver level.
- **SQL injection prevention**: Eloquent ORM uses parameterized queries (PDO prepared statements) by default, preventing SQL injection. Raw queries via DB::select() should always use parameter binding.
- **Blade XSS prevention**: Blade's {{ }} uses htmlspecialchars() with ENT_QUOTES | ENT_SUBSTITUTE encoding. Raw output via {!! !!} should be used only with trusted content.
- **Security headers middleware**: Community packages like spatie/laravel-http-headers or custom middleware set HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy headers.

## Research Notes
- Content-Security-Policy nonce generation changed in Laravel 11 — the nonce is now generated per-request using a cryptographically secure random generator, ensuring uniqueness per page load.
- CSRF token rotation frequency increased with Laravel 12 — tokens are rotated on every session re-authentication (login/register), reducing the window for CSRF token theft exploitation.
- Session configuration hardening (HttpOnly, Secure, SameSite) is applied at the cookie middleware level, not at the individual controller/middleware level — misconfiguration is common when custom session drivers override default cookie settings.
- Laravel's SQL injection prevention via Eloquent is robust, but raw DB::select('SELECT * FROM users WHERE id = ?', []) requires manual parameter binding — the ? placeholder binding is positional, not named.
- Blade XSS prevention via {{ }} escapes five HTML special characters: &, <, >, ", ' — this covers the OWASP XSS Prevention Cheat Sheet Rule #1 for HTML entity encoding.
- HSTS header configuration via middleware must use includeSubDomains and preload directives carefully — preload submits the domain to browser preload lists, and once set, HTTPS enforcement is permanent for the specified max-age period.
- The Origin header verification in CSRF protection (VerifyCsrfToken middleware) checks against the APP_URL configuration — this is bypassable if APP_URL is incorrectly configured or misaligned with the actual application domain.
- Package-based security hardening (spatie/laravel-csp, spatie/laravel-http-headers) must be configured before deployment to production — default configurations may not meet specific security requirements.

## Internal Mechanics
- **CSRF Token Verification Flow**: VerifyCsrfToken middleware (in web middleware group) reads the token from _token POST parameter or X-CSRF-TOKEN header → decodes via Encrypter → compares against session token using hash_equals() to prevent timing attacks. Token mismatch results in TokenMismatchException → HTTP 419 error.
- **Blade Escaping Flow**: {{  }} compiles to <?php echo e(); ?> where e() is htmlspecialchars(, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'). {!!  !!} compiles to <?php echo ; ?> with zero escaping.
- **Eloquent SQL Injection Prevention**: Eloquent's where('column', ) uses PDO prepared statements — the column name is concatenated into SQL (and must be safe), while the value is parameterized via ? binding. Raw whereRaw() and DB::select() with manual ? parameterization shift responsibility to the developer.
- **Session Security Configuration Flow**: config/session.php settings are read by StartSession middleware → session cookie attributes (HttpOnly, Secure, SameSite) are applied in CookieSessionHandler → cookie is added to response via AddQueuedCookiesToResponse middleware.
- **Security Headers Middleware Flow**: Custom middleware or community packages modify the response's $response->headers->set() or $response->headers->add() in the middleware's handle() method → response is sent to client with modified headers. The middleware must run after content generation but before response delivery.
- **HSTS and CSP Implementation**: HSTS (Strict-Transport-Security) is set as a response header via middleware — the browser enforces HTTPS on subsequent requests. CSP (Content-Security-Policy) defines allowed content sources and is enforced by the browser, blocking unauthorized script/style execution.
