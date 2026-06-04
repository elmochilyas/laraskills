# Metadata

Domain: Security & Identity Engineering
Subdomain: Security Hardening
Knowledge Unit: Session configuration (secure, http_only, same_site)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Session configuration in `config/session.php` directly impacts application security: `secure` enforces HTTPS-only cookies, `http_only` prevents JavaScript access, `same_site` controls cross-origin cookie sending, and `encrypt` protects session data at rest. Misconfiguration leads to session hijacking (missing `secure`), XSS-based session theft (missing `http_only`), or CSRF bypass (missing `same_site`). The production defaults: `driver=database` or `redis`, `secure=true`, `http_only=true`, `same_site=lax`, `encrypt=false`.

---

# Core Concepts

- **secure (`SESSION_SECURE_COOKIE`)**: If true, the session cookie is only sent over HTTPS. Must be `true` in production. Prevents session cookie theft over unencrypted HTTP.
- **http_only (`SESSION_HTTP_ONLY`)**: If true, JavaScript cannot access the session cookie via `document.cookie`. Must be `true` for all production apps. Prevents XSS-based session theft.
- **same_site (`SESSION_SAME_SITE`)**: Controls when the browser sends the session cookie on cross-origin requests. `Lax` (default): sent for top-level navigations (GET only). `Strict`: never sent cross-origin. `None`: always sent (requires `secure=true`).
- **encrypt**: Encrypts session data using Laravel's encryption. Adds overhead but protects session content from server-side exposure.
- **driver**: Storage backend. `file` (default, single-server), `database` (shared across servers), `redis` (fastest for multi-server), `cookie` (store session in encrypted cookie — limited to 4KB), `dynamodb` (AWS).

---

# Mental Models

- **Cookie Attributes as Guardrails**: Each attribute is a fence that blocks a specific attack. `secure` blocks network-level theft. `http_only` blocks XSS theft. `same_site` blocks CSRF-driven theft.
- **Server Storage vs Client Storage**: Session data lives on the server (file, database, Redis). The cookie is just a session ID key. Encrypting the session protects the server-stored data, not the cookie.

---

# Internal Mechanics

- `Illuminate\Session\Middleware\StartSession` reads the session cookie from the request, resolves the session driver, loads session data.
- Session cookie attributes are set via `CookieJar` in the middleware's `addCookieToResponse()` method.
- `same_site` can be set to `null` in config to omit the attribute entirely (older browsers). `'lax'` is the Laravel default and modern browser default.
- `encrypt` config triggers `Illuminate\Session\EncryptedStore` wrapper around the regular store. Data is encrypted on write, decrypted on read.

---

# Patterns

## Production Session Config Pattern
- **Implementation**: `SESSION_DRIVER=redis`, `SESSION_SECURE_COOKIE=true`, `SESSION_HTTP_ONLY=true`, `SESSION_SAME_SITE=lax`.
- **Benefits**: Standard production-hardened session security.
- **Tradeoffs**: Redis session driver requires Redis server and connection configuration.

## Same-Site=None for Cross-Domain SPAs
- **Purpose**: Session cookies sent cross-origin for SPA auth.
- **Implementation**: `SESSION_SAME_SITE=none`, `SESSION_SECURE_COOKIE=true`. `none` requires `secure=true`.
- **Benefits**: Cross-domain session authentication for SPAs.
- **Tradeoffs**: More permissive CSRF protection — relies entirely on CSRF token validation.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| `same_site=lax` vs `same_site=strict` | Standard web app vs high-security admin panel | `lax` for user-facing apps (allows safe GET navigation); `strict` for admin panels (prevents any cross-origin session use) |
| `driver=database` vs `driver=redis` | Scalability vs simplicity | `redis` for multi-server deployments; `database` for small multi-server; `file` for single-server dev only |
| `encrypt=true` vs `encrypt=false` | Sensitive session data vs performance | `true` if session stores PII or credentials; `false` for performance if session only stores user ID and last activity |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| `secure=true` prevents session hijacking over HTTP | Site is inaccessible over HTTP (redirect to HTTPS required) | Dev environment without HTTPS needs `SESSION_SECURE_COOKIE=false` |
| `http_only=true` prevents XSS session theft | Cannot access session from legitimate JavaScript (alpine.js, Livewire do not need session cookie access) | No practical downside for most apps |
| `same_site=lax` balances security and usability | Top-level POST from external origin does not send the cookie | Payment redirects from external gateways may not include the cookie — use `same_site` exception patterns |
| `encrypt=true` protects session data | Adds encryption/decryption overhead per request (~0.5-2ms) | Rarely worth the performance cost unless session stores sensitive data |

---

# Performance Considerations

- Session driver choice significantly impacts performance: Redis <1ms, Database ~5-20ms, File ~2-10ms (single server), Cookie (4KB limit, no server storage).
- `encrypt=true` adds serialization overhead. For Redis sessions, the encryption overhead is ~0.5ms per request.
- Large session data (>100KB) slows down every request serialization/deserialization. Store only minimal data in session.

---

# Production Considerations

- **Session Hijacking**: `secure` + `http_only` + HTTPS + session ID regeneration on login provide strong protection. Also implement session ID rotation periodically.
- **Session Expiry**: `lifetime` in minutes. Lower lifetime increases security (shorter theft window) but degrades UX (more frequent logins).
- **Session Fixation**: Laravel's `SessionGuard` regenerates session ID on authentication via `regenerate()` — this prevents session fixation attacks.
- **Load Balancers**: With multiple servers, use `database` or `redis` session driver so all servers can read the same session data.
- **Same-Site Browser Compatibility**: `same_site=none` requires `secure=true`. Older browsers (Safari on iOS 12) ignore `none` and treat as `strict` — test with your user base.

---

# Common Mistakes

- **`secure=false` in production**: Cookies sent over HTTP — any network sniffer can steal the session ID.
- **`http_only=false`**: XSS vulnerability allows `document.cookie` access — attacker steals the session cookie.
- **`same_site=none` without `secure`**: Browsers reject `none` cookies over HTTP. Cookie is not set at all — session does not persist.
- **File session on multi-server**: Each server writes session files to its local filesystem. Server B cannot read sessions created by Server A → users get logged out on every other request.
- **Storing sensitive data in session without encrypting**: Session files in `storage/framework/sessions/` are plain text. If an attacker gains file access, they read all session data.

---

# Failure Modes

- **Session Cookie Not Set (Same-Site=None + HTTP)**: `same_site=none` without HTTPS — browser rejects the cookie. Session never starts. Every request creates a new session → CSRF tokens never match → 419 errors.
- **Session Data Corruption**: If `encrypt=true` and `APP_KEY` changes between requests, stored session data cannot be decrypted. Session is lost — user logs out.
- **Session File Buildup**: File session driver never cleans old files without `php artisan session:gc` or a scheduled task. Hundreds of thousands of stale session files slow down random reads. Use Redis or schedule `session:gc`.
- **Load Balancer Session Stickiness Lost**: If `sticky sessions` are configured on the load balancer but a server goes down, the user's session is lost unless using shared session driver (Redis/database).

---

# Related Knowledge Units

- Prerequisites: Auth guards/providers architecture (SessionGuard), Middleware pipeline (StartSession)
- Related: CSRF token exchange and validation (session-based), Sanctum SPA cookie auth (session for SPA), CORS configuration (same_site interplay)
- Advanced Follow-up: Session driver deep-dive (Redis sentinel, DynamoDB), Custom session handler implementation, Session security audit checklist

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
