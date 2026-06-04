# Metadata

Domain: Security & Identity Engineering
Subdomain: Security Hardening
Knowledge Unit: CORS configuration for cross-origin requests
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

CORS (Cross-Origin Resource Sharing) configuration in Laravel is managed via `config/cors.php` and the `HandleCors` middleware. It controls which origins, methods, and headers browsers permit for cross-origin requests. For Sanctum SPA authentication, `supports_credentials` must be `true` and `allowed_origins` must contain the exact SPA origin (not `*`). For public APIs, CORS can be permissive, but for cookie-based auth, CORS must be precisely configured — the most common cause of "phantom 401" errors in SPA setups.

---

# Core Concepts

- **Origin**: Scheme + host + port. `http://localhost:3000`, `https://app.example.com`. Two URLs with the same scheme, host, AND port are same-origin. Anything different is cross-origin.
- **Preflight Request**: Browser sends `OPTIONS` request with `Origin`, `Access-Control-Request-Method`, `Access-Control-Request-Headers` headers. Server responds with allowed origins/methods/headers. Browser proceeds with the actual request only if the preflight is accepted.
- **Access-Control-Allow-Origin**: Response header specifying which origin(s) can access the resource. `*` allows any origin but CANNOT be used with `supports_credentials`.
- **Access-Control-Allow-Credentials**: When `true`, browser includes cookies in cross-origin requests. Required for Sanctum SPA auth.
- **Access-Control-Expose-Headers**: Which response headers the browser exposes to JavaScript. Sanctum's SPA auth does not need special exposed headers.

---

# Mental Models

- **Bouncer at the Browser**: CORS is enforced by the browser, not the server. If a mobile app or curl bypasses CORS, the server still serves the response. CORS protects the USER from cross-origin data theft, not the SERVER from abuse.
- **Preflight Handshake**: Like asking permission at the door before entering. The browser says "I'm from origin X, can I send this request?" The server responds "Yes, but only with these methods and headers."

---

# Internal Mechanics

- Laravel's `HandleCors` middleware is registered in the global middleware stack (Kernel). It runs on every request.
- For preflight (`OPTIONS`) requests, the middleware sets CORS headers and returns 204 (No Content) — the route handler is never called.
- For actual requests, the middleware adds CORS headers to the response.
- Configuration: `paths` (which URLs get CORS headers), `allowed_origins` (specific origins or `*`), `allowed_methods`, `allowed_headers`, `exposed_headers`, `max_age` (cache preflight), `supports_credentials`.

---

# Patterns

## Sanctum SPA CORS Pattern
- **Purpose**: Enable cookie-based auth for first-party SPA.
- **Implementation**: `allowed_origins => [env('FRONTEND_URL')]`, `supports_credentials => true`, `allowed_headers => ['*']`, `allowed_methods => ['*']`. Pair with `SANCTUM_STATEFUL_DOMAINS` matching.
- **Benefits**: Secure cross-origin cookie authentication.
- **Tradeoffs**: `Access-Control-Allow-Origin` must be specific (no `*`).

## Public API CORS Pattern
- **Purpose**: Any client can call the API.
- **Implementation**: `allowed_origins => ['*']`, `supports_credentials => false`. Token-based auth only.
- **Benefits**: Maximum accessibility; simple configuration.
- **Tradeoffs**: No cookie auth; XSS risk on token storage.

## Subdomain CORS Pattern
- **Purpose**: SPA on `app.example.com`, API on `api.example.com`.
- **Implementation**: Both are different origins (different subdomains). CORS config: `allowed_origins => ['https://app.example.com']`. Cookie: `SESSION_DOMAIN => '.example.com'`.
- **Benefits**: Subdomain separation for frontend/backend.
- **Tradeoffs**: Must configure BOTH CORS and session domain.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| CORS `*` vs specific origins | Public token API vs credential-based API | `*` for public APIs; specific origins for cookie auth |
| CORS middleware vs Nginx/Apache CORS | App-level vs server-level configuration | Middleware for environment-consistent config; web server for static files |
| `max_age` value | Preflight performance | 1 hour (`3600`) for production. Testing: 0 or not set to see changes immediately |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Specific origins protect against unauthorized cross-origin access | Must update config when adding new client domains | Every new SPA frontend or staging environment requires config update |
| CORS `*` is simple and works everywhere | Cannot use credentials (cookies, auth headers) | Some authentication methods (Sanctum SPA) are incompatible with `*` |
| CORS protects browser requests only | Does not protect API from server-side or non-browser clients | API keys and rate limiting are needed for non-browser protection |

---

# Performance Considerations

- CORS preflight adds one extra OPTIONS request per "new" cross-origin request type. The preflight result is cached by the browser for `max_age` seconds.
- CORS headers add minimal response overhead (~200 bytes).
- Preflight requests do not hit route handlers — they are caught by the global middleware.

---

# Production Considerations

- **Credentials + Wildcard**: `Access-Control-Allow-Origin: *` AND `Access-Control-Allow-Credentials: true` — this combination is PROHIBITED by the CORS spec. The browser will reject the response.
- **Multiple Origins**: If you need multiple specific origins (production, staging, development), use Laravel's `allowed_origins` array or a custom resolver that validates against a list.
- **CORS for Local Development**: Include `localhost:3000` (Vite default) and `localhost:5173` (older Vite) in `allowed_origins` and `SANCTUM_STATEFUL_DOMAINS`.
- **Testing CORS**: Use `curl -H "Origin: https://attacker.com" -I https://your-api.com`. The response should NOT include `Access-Control-Allow-Origin: https://attacker.com`.

---

# Common Mistakes

- **Setting `allowed_origins` to `['*']` with `supports_credentials => true`**: Browser rejects the response because `*` and credentials cannot coexist per CORS spec.
- **Not including the port in allowed_origins**: `localhost:3000` and `localhost` are different origins. If your SPA runs on `localhost:3000`, the allowed origin must include the port.
- **Forgetting to set `allowed_headers` to include `X-XSRF-TOKEN`**: The SPA sends the CSRF token in this header. If not allowed, the preflight fails.
- **Assuming CORS protects the API from CSRF**: CORS does NOT prevent the browser from SENDING requests (preflight only prevents READING responses on the attacker's origin). CSRF tokens are still needed for cookie-based auth.
- **Configuring CORS only for web routes**: API routes also need CORS headers if accessed from browsers. Ensure CORS middleware applies to API paths.

---

# Failure Modes

- **Preflight Failure**: Browser sends OPTIONS, server returns 204 but no `Access-Control-Allow-Origin` header → browser blocks the actual request. Console error: "has been blocked by CORS policy."
- **Credentials + Wildcard Rejection**: `supports_credentials: true` with `allowed_origins: ['*']` → browser logs: "The value of the 'Access-Control-Allow-Origin' header must not be the wildcard '*' when credentials mode is 'include'."
- **Missing Path**: CORS configured for `/api/*` but Sanctum login is at `/login` (not in `api/`). The login request is not CORS-enabled. Solution: add `login`, `register`, `sanctum/csrf-cookie` to `paths`.
- **Multiple Origin Mismatch**: If the SPA sends `Origin: https://app.example.com` but `allowed_origins` has `https://app.example.com` (with trailing slash), they don't match. Use exact origins.

---

# Related Knowledge Units

- Prerequisites: HTTP headers basics, Sanctum SPA cookie auth
- Related: CSRF token exchange and validation (CSRF + CORS work together for SPA auth), Security headers (HSTS, CSP, XFO)
- Advanced Follow-up: CORS with multiple subdomains, Custom CORS origin resolver, CORS for WebSocket (WSS) connections

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
