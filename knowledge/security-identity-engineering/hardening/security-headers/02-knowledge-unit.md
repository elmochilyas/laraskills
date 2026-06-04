# Metadata

Domain: Security & Identity Engineering
Subdomain: Security Hardening
Knowledge Unit: Security headers (HSTS, CSP, XFO, etc.)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Security headers are HTTP response headers that instruct browsers to enforce security policies: HSTS enforces HTTPS, CSP controls which resources can load, X-Frame-Options prevents clickjacking, X-Content-Type-Options prevents MIME sniffing, Referrer-Policy controls referrer information, and Permissions-Policy restricts browser API access. In Laravel, these are typically implemented as global middleware added via `bootstrap/app.php` or a dedicated middleware class. The recommended approach is to ship security headers as a global middleware on day one, starting CSP in Report-Only mode and graduating to enforced mode.

---

# Core Concepts

- **HSTS (Strict-Transport-Security)**: Tells browsers to only connect via HTTPS for a specified duration. `max-age=31536000; includeSubDomains`. Prevents SSL-stripping attacks.
- **CSP (Content-Security-Policy)**: Controls which origins resources can be loaded from (scripts, styles, images, fonts, etc.). `default-src 'self'; script-src 'self'`. Enables reporting via `report-uri` or `report-to`.
- **X-Frame-Options (XFO)**: Prevents clickjacking by controlling if the page can be loaded in an iframe. `DENY` (never) or `SAMEORIGIN` (same origin only).
- **X-Content-Type-Options**: Prevents MIME type sniffing. `nosniff` — browser must use declared Content-Type.
- **Referrer-Policy**: Controls what referrer information is sent with requests. `strict-origin-when-cross-origin` (recommended).
- **Permissions-Policy**: Restricts browser API access (geolocation, camera, microphone, etc.). Replaces the deprecated Feature-Policy.
- **Report-Only Mode**: CSP and Permissions-Policy can be deployed in report-only mode — headers are honored but violations are only reported, not blocked. Essential for safe rollout.

---

# Mental Models

- **Browser Instructions, Not Application Logic**: Security headers are instructions to the browser. They do not change how your app works — they change how the browser enforces policies on your app's content.
- **Defense Layer**: Security headers are a secondary defense. The primary defense is correct application logic (escaping, CSRF, validation). Headers catch what application code misses.
- **CSP Report-Only → Enforced**: Always deploy CSP in report-only mode first. Monitor violations for weeks. Fix legitimate violations. Then switch to enforced mode.

---

# Patterns

## Global Middleware Pattern
- **Purpose**: Apply security headers to all responses.
- **Implementation**: Middleware class in `app/Http/Middleware/SecurityHeaders.php` that adds headers via `$response->headers->set()`.
- **Benefits**: Single place to manage all security headers; easy to audit.

## CSP Report-Only to Enforced Pattern
- **Purpose**: Safe CSP rollout.
- **Implementation**: Start with `Content-Security-Policy-Report-Only` header, configure `report-uri` or `report-to` endpoint. Monitor reports. After 2-4 weeks, switch to `Content-Security-Policy`.
- **Benefits**: No risk of breaking functionality during CSP setup.
- **Tradeoffs**: Security gap during report-only period (XSS is not blocked).

## Permissions-Policy Gradual Restriction
- **Purpose**: Limit browser API access based on feature requirements.
- **Implementation**: `permissions-policy: camera=(), microphone=(), geolocation=(self "https://maps.example.com")`.
- **Benefits**: Reduces attack surface from browser API abuse (sensor data exfiltration).

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Middleware vs web server config | App-level control vs infrastructure control | Middleware for consistent headers across environments; web server config only for headers the app cannot control |
| CSP strict-dynamic vs whitelist | CSP v3 modern vs CSP v2 compatibility | strict-dynamic for new apps (simpler, more secure); whitelist for apps loading scripts from multiple CDNs |
| Report-Only vs Enforced | Initial rollout vs steady state | Report-Only for first 2-4 weeks; Enforced after violation review |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| CSP blocks majority of XSS vectors | CSP configuration is complex and breaks functionality if misconfigured | A missing `script-src` value blocks all inline scripts — site UI breaks entirely |
| HSTS forces HTTPS and prevents downgrade attacks | Once HSTS is active, cannot serve HTTP for the `max-age` period | If HTTPS configuration breaks during the HSTS period, the site becomes inaccessible |
| Permissions-Policy reduces browser API attack surface | Overly restrictive policy breaks legitimate features | Geolocation on a delivery tracking page stops working if the policy blocks geolocation API |

---

# Performance Considerations

- Security headers add 0.5-2KB to each response (header size). Negligible for most applications.
- CSP report-uri/report-to adds POST requests to the reporting endpoint for each violation — can be significant traffic volume if CSP is too restrictive.
- No server-side processing overhead beyond adding headers to the response object.

---

# Production Considerations

- **CSP Nonce Implementation**: For dynamic inline scripts, generate a random nonce per request, add `'nonce-{value}'` to `script-src`, and set the nonce attribute on `<script>` tags. Laravel provides `CspNonce` middleware or custom implementation.
- **CSP Reporting**: Set `report-uri` or `report-to` to a dedicated endpoint. Use a CSP reporting service (report-uri.com, Sentry) or implement your own endpoint.
- **HSTS Preload**: Submit your domain to the HSTS preload list for enforcement in all major browsers. Requires `max-age >= 31536000` and `includeSubDomains`.
- **Header Not Set by Default**: Laravel does NOT set security headers automatically. They must be explicitly added via middleware.

---

# Common Mistakes

- **Setting CSP without report-uri**: CSP violations happen silently. Without a reporting endpoint, you never know if legitimate functionality is being blocked.
- **Too-permissive CSP**: `default-src *` or `script-src unsafe-inline` defeats the purpose of CSP.
- **HSTS max-age too short**: `max-age=300` (5 minutes) does not provide meaningful protection. Minimum recommended: 1 year (`31536000`).
- **Not including the API in CSP**: API responses should also have security headers. Mobile apps ignore them, but browsers loading content from the API still enforce them.
- **CSP blocking WebSocket connections**: If your app uses WebSockets (Reverb, Pusher), add `connect-src wss://*.pusher.com` or the Reverb host to CSP.

---

# Failure Modes

- **CSP Blocks Application Functionality**: Scripts loaded from a CDN that is not in `script-src`. Entire JS-driven UI breaks silently. Fix: add the CDN origin to CSP. Prevent: report-only mode deployment.
- **HSTS Prevents Subdomain Migration**: If the blog is moved to `blog.example.com` (new server without HTTPS), HSTS with `includeSubDomains` blocks it. Browsers refuse to load it over HTTP.
- **Permissions-Policy Breaking Embed**: YouTube or Vimeo embeds break if `frame-src` or Permissions-Policy blocks the embed origin.
- **CSP Report Flood**: If CSP is too restrictive, every user request generates a violation report. The reporting endpoint gets slammed with POST requests. Rate-limit the reporting endpoint.

---

# Related Knowledge Units

- Prerequisites: Middleware pipeline, Blade auto-escaping and XSS prevention
- Related: CSP nonce/script-src/style-src configuration, CORS configuration for cross-origin requests
- Advanced Follow-up: CSP Level 3 strict-dynamic, HSTS preload submission process, Security headers audit with Mozilla Observatory

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
