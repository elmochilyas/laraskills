# Metadata

Domain: Security & Identity Engineering
Subdomain: Security Hardening
Knowledge Unit: CSP nonce/script-src/style-src configuration
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

CSP (Content-Security-Policy) nonce configuration enables secure inline script and style execution by associating each request with a cryptographically random nonce value included in both the CSP header and the HTML attribute. `script-src 'nonce-{value}'` and `style-src 'nonce-{value}'` allow only inline scripts/styles that match the nonce, blocking injection-based XSS even if escaping fails. In Laravel, nonces are typically generated per-request and passed to Blade views via `CspNonce` middleware or helper functions. The `strict-dynamic` CSP v3 keyword simplifies nonce-based CSP for modern applications by automatically trusting scripts loaded by nonced scripts.

---

# Core Concepts

- **Nonce**: A cryptographically random, single-use string generated per request. Included in the CSP header as `'nonce-{base64-value}'` and as the `nonce` attribute on `<script>` and `<style>` tags.
- **script-src**: CSP directive controlling which scripts can execute. `'self'` allows same-origin scripts. `'unsafe-inline'` allows ALL inline scripts (defeats CSP). `'nonce-...'` allows only inline scripts with matching nonce.
- **style-src**: Same as `script-src` but for stylesheets. Controls `<style>` tags and inline `style` attributes.
- **strict-dynamic**: CSP Level 3 keyword (use with `script-src`). When present, the browser trusts any script dynamically loaded by a nonced script — eliminates the need to whitelist CDN URLs for lazy-loaded scripts.
- **Hash-based CSP**: Alternative to nonce. Hashes of known-good script contents are listed in the CSP header (`'sha256-...'`). Useful for static inline scripts that do not change per request.

---

# Mental Models

- **One-Time Password for Scripts**: The nonce is a one-time password for inline scripts. The server generates it, includes it in the CSP header AND the HTML script tag. If an XSS injects a `<script>` tag, they cannot guess the nonce — the script is blocked.
- **Nonce vs Hash**: Nonce is "I trust this script because I generated its tag." Hash is "I trust this script because I recognize its contents." Nonce is more flexible (content can change). Hash is more secure (cannot be bypassed even if nonce leaks).

---

# Internal Mechanics

- **Per-request nonce generation**: Typically in middleware or a service provider. `$nonce = base64_encode(random_bytes(16))`. Stored in request attributes or a view composer.
- **CSP header**: `Content-Security-Policy: script-src 'nonce-abc123'`. The `'nonce-...'` keyword tells the browser to check script tags for `nonce="abc123"`.
- **Blade integration**: `<script nonce="{{ $cspNonce }}">...` — the nonce attribute matches the header.
- **Livewire/Alpine.js**: Livewire 3 automatically includes a nonce in inline scripts if you configure `csp_nonce` in the config or pass it via `->withCspNonce()`. Alpine.js reads the `alpine:init` event and can be configured to use nonces.

---

# Patterns

## Nonce Middleware Pattern
- **Purpose**: Generate and propagate nonce on every request.
- **Implementation**: Middleware that generates nonce, stores in `$request->attributes->set('csp_nonce', $nonce)`, appends CSP header. Blade views access via `request()->attributes->get('csp_nonce')`.
- **Benefits**: Single source of truth for nonce generation.

## strict-dynamic for Modern Apps
- **Purpose**: Simplify CSP for apps using dynamic script loading (SPA bundlers, import maps).
- **Implementation**: `script-src 'nonce-{value}' 'strict-dynamic'`. This replaces `'self'` and all CDN whitelists.
- **Benefits**: One CSP directive covers all first-party and loaded scripts. No need to list CDN origins.
- **Tradeoffs**: `strict-dynamic` is CSP Level 3 — older browsers ignore it. Provide fallback directives: `script-src 'nonce-{value}' 'strict-dynamic' 'unsafe-inline' https: http:`. The fallback allows HTTPS origins in older browsers but `strict-dynamic` takes precedence in modern ones.

## Hash-Based for Static Inline Scripts
- **Purpose**: Inline scripts that are always identical (analytics snippets).
- **Implementation**: Compute `sha256({script content})`, add to `script-src`: `script-src 'sha256-abc...'`.
- **Benefits**: No nonce needed for known scripts. Script can be cached across requests.
- **Tradeoffs**: If script content changes even slightly, hash must be recomputed.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Nonce vs Hash vs Unsafe-Inline | Modern app vs legacy compatibility | Nonce for dynamic inline scripts; Hash for static scripts; NEVER `unsafe-inline` |
| strict-dynamic vs traditional whitelist | CSP v3 compatible app vs broad browser support | strict-dynamic for modern apps; whitelist only if supporting IE11 |
| Nonce per request vs per session | Security vs performance | Per-request nonce is standard. Per-session nonce (reuse same nonce within session) is less secure but acceptable for low-risk apps |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Nonces block injection-based XSS even if escaping fails | Every inline script/style must have nonce attribute | Forgetting nonce on a `<script>` tag blocks it from executing — debugging can be confusing |
| strict-dynamic drastically simplifies CSP | Not supported in older browsers (Safari <15.4, Firefox <119) | Users on old browsers get blocked scripts unless fallback directives are provided |
| Nonce-based CSP pairs naturally with JS frameworks | Nonce generation and propagation adds code complexity | Must ensure nonce is accessible in all view rendering contexts (Blade, Livewire, Inertia) |

---

# Performance Considerations

- Nonce generation: `random_bytes(16)` is fast (<0.01ms). Negligible overhead.
- Nonce must be unique per request — caching responses with nonces is not possible. This breaks full-page caching for pages with nonced scripts.
- CSP header size grows with each directive and whitelisted origin. Keep `script-src` concise. `strict-dynamic` helps keep the header small.

---

# Production Considerations

- **Livewire CSP**: Livewire 3 requires CSP nonce for its inline scripts. Configure `csp_nonce` in `config/livewire.php` or pass via `->withCspNonce()`. Livewire will automatically add nonce attributes to its generated `<script>` tags.
- **Vite/Inertia CSP**: Vite-generated scripts are typically loaded via `<script type="module" src="...">` — they are external scripts and do NOT need nonces. However, Inertia renders `<script>` tags for page component data — these need nonces.
- **Report-Only for CSP**: Deploy CSP in `Content-Security-Policy-Report-Only` mode first. Monitor for inline scripts missing nonces before switching to enforced mode.
- **Sentry/Raygun CSP**: Error reporting scripts (Sentry, Bugsnag) need nonce in their `<script>` tags. Configuring the nonce in these SDKs typically involves passing it as a configuration option.

---

# Common Mistakes

- **Using `unsafe-inline` with nonce**: `script-src 'nonce-abc123' 'unsafe-inline'` — `unsafe-inline` overrides the nonce, allowing ALL inline scripts. The nonce provides no protection. Never use both.
- **Setting nonce on external scripts**: `<script src="https://cdn.example.com/app.js" nonce="abc">` — external scripts do not need nonces. Nonce only affects inline scripts.
- **Not setting nonce on all inline scripts**: Even one `<script>` without a nonce will be blocked (or execute if `unsafe-inline` falls back). Use CSP report-only to catch all missing nonces.
- **Using same nonce for multiple requests**: Nonce must be unique per request. Reusing nonces across requests reduces security (attacker can guess the pattern).

---

# Failure Modes

- **Script Blocked by CSP**: All inline scripts without nonces are silently blocked. The page renders without JavaScript — UI is broken but no error popup. Console error: "Refused to execute inline script because it violates the following Content Security Policy directive."
- **Nonce in Header But Not in Tag**: The CSP header includes `'nonce-abc123'` but the `<script>` tag has `nonce="xyz789"` (different nonce). Script is blocked. Fix: ensure middleware sends the same nonce to header and view.
- **Nonce Leakage via Error Pages**: If an error page renders output from a malicious user (reflected XSS on 404 page), the nonce is in the CSP header. The attacker cannot know the nonce to inject it — but if the nonce is predictable or reused, they can bypass. Always use random nonces.
- **Full-Page Cache + Nonce Incompatibility**: Varnish/Nginx caching pages with nonces cannot cache them because the nonce changes per request. Cache the HTML template but exclude the nonce attribute using Edge Side Includes (ESI) or similar.

---

# Related Knowledge Units

- Prerequisites: Security headers (HSTS, CSP, XFO, etc.), Blade auto-escaping (CSP as secondary defense)
- Related: Livewire CSP configuration, Inertia CSP configuration
- Advanced Follow-up: strict-dynamic deep dive, Nonce-based hash fallback for CSP Level 2 browsers, Automated CSP violation monitoring and alerting

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
