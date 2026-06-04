# Metadata

Domain: Security & Identity Engineering
Subdomain: Security Hardening
Knowledge Unit: Blade auto-escaping and XSS prevention
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Blade's `{{ $var }}` syntax automatically escapes output using PHP's `htmlspecialchars()` with the `ENT_QUOTES | ENT_SUBSTITUTE` flags, preventing XSS (Cross-Site Scripting) by converting HTML special characters to their entity equivalents. The raw output syntax `{!! $var !!}` should be used ONLY for trusted, pre-sanitized content. Blade auto-escaping is the PRIMARY XSS defense; CSP headers are the secondary fallback. The combination of proper escaping + CSP provides defense in depth against XSS.

---

# Core Concepts

- **Auto-Escaping via `{{ }}`**: Converts `<`, `>`, `&`, `"`, `'` to HTML entities. Safe for all user-generated content. This is the default and should be used for all dynamic output.
- **Raw Output via `{!! !!}`**: Bypasses escaping entirely. Use ONLY for content you explicitly trust (e.g., HTML from your own application, not user-generated).
- **Context Matters**: `{{ }}` escapes for HTML body context. For attributes, inline JavaScript, or CSS contexts, additional escaping may be needed.
- **CSP as Fallback**: Content-Security-Policy headers provide a secondary defense layer that mitigates XSS even if unescaped output slips through.

---

# Mental Models

- **Double Curly Brace = Safe**: `{{ $post->title }}` is always safe for any user input. It's the default for a reason.
- **Double Exclamation = Danger**: `{!! $post->body !!}` is ALWAYS a potential XSS vector unless the content was sanitized server-side before storage.
- **One Core Defense, One Fallback**: Auto-escaping is the wall that stops 99% of XSS. CSP is the fire extinguisher for when the wall fails.

---

# Internal Mechanics

- `{{ $var }}` compiles in Blade compiler to `<?php echo e($var); ?>` where `e()` is the `Illuminate\Support\Str::html()` helper that calls `htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8', false)`.
- `{!! $var !!}` compiles to `<?php echo $var; ?>` — no escaping at all.
- The `e()` helper does NOT escape for JavaScript or URL contexts. Using `{{ $var }}` inside an `<script>` tag or an `onclick` attribute is still dangerous — additional escaping (JSON encoding) is required.
- Laravel 13's `@js` directive handles JavaScript context: `@js($data)` → `JSON.parse(...)`.

---

# Patterns

## Trusted HTML via HTML Purifier
- **Purpose**: Allow rich text (WYSIWYG editor) while preventing XSS.
- **Implementation**: Store raw HTML from editor. Before output, sanitize with `e($purified)` or a dedicated sanitizer (HTML Purifier). NEVER use `{!! $userContent !!}` without sanitization.
- **Benefits**: Users can format content safely.
- **Tradeoffs**: Performance cost of sanitization; some WYSIWYG features may be stripped.

## Attribute Context Escaping
- **Purpose**: Safe output in HTML attributes.
- **Implementation**: `{{ }}` for HTML body, but for attributes, use `{{ $var }}` is safe for standard attribute values. For URL attributes (`href`, `src`), validate the URL protocol specifically.
- **Benefits**: Full coverage across HTML contexts.
- **Tradeoffs**: Need to remember context-specific rules for `javascript:` URLs in `href`.

## JSON Embedding with @js
- **Purpose**: Pass PHP data to JavaScript without XSS.
- **Implementation**: `@js($data)` or `@json($data)`.
- **Benefits**: Proper JSON encoding, not vulnerable to XSS through string injection.
- **Tradeoffs**: Large data blobs bloat the HTML.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| `{{ }}` vs `{!! !!}` | ALL user content vs explicitly trusted content | Default to `{{ }}`. Only use `{!! !!}` for HTML you control |
| Server-side sanitization vs client-side rendering | Storage format vs display format | Sanitize on storage (write) not on display (read) — ensures safety in all output contexts |
| CSP nonce vs auto-escaping | Defense in depth layers | Use both. Auto-escaping is primary; CSP nonce for inline scripts is secondary |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| `{{ }}` is safe for all user content | Cannot render rich text without `{!! !!}` or sanitizer | Rich text features require additional tooling (Trix, TinyMCE + HTML Purifier) |
| CSP nonce blocks inline scripts even if escaping fails | CSP configuration is complex and mistakes break site functionality | CSP in report-only mode necessary during rollout |

---

# Production Considerations

- **CSP Nonce**: Pair `{{ }}` escaping with CSP nonce or hash-based CSP to block inline scripts even if unescaped content appears.
- **@js vs @json**: `@js` automatically passes data to JavaScript safely. `@json` returns JSON string that must be handled carefully.
- **Context-Specific Escaping**: `{{ $url }}` inside an `href` attribute is NOT safe if `$url` starts with `javascript:`. Validate URL schemes.

---

# Common Mistakes

- **Using `{!! !!}` without sanitization**: Any user-submitted content output with `{!! !!}` is an XSS vulnerability. An attacker can inject `<script>` tags.
- **Assuming `{{ }}` is safe in all contexts**: `{{ }}` in `<script>` tags or event handler attributes (`onclick`, `onmouseover`) is NOT safe. The escaped HTML entities can still be decoded by the JavaScript context. Use `@js` for JavaScript contexts.
- **Outputting JSON directly into `<script>` tags**: `var user = {!! json_encode($user) !!};` — unescaped JSON in a script tag is XSS-prone. Use `@js($user)` instead.
- **Double-escaping content**: Using `{{ $content }}` where `$content` was already escaped on storage. The content displays as HTML entities (literal `&lt;`). Use `{!! $content !!}` only if you unconditionally trust the content source.

---

# Failure Modes

- **Stored XSS via Rich Text**: User submits malicious HTML through a WYSIWYG editor. If stored raw and output with `{!! !!}`, the XSS fires. Mitigation: sanitize on input with HTML Purifier.
- **Reflected XSS via URL Parameters**: `{{ request()->input('search') }}` — if the search term is output without validation, reflected XSS via crafted URL. Mitigation: always escape `{{ }}`.
- **DOM-based XSS via Inner HTML**: JavaScript reads from DOM (via an unescaped server-side output) and injects into innerHTML. Mitigation: use textContent not innerHTML client-side.

---

# Related Knowledge Units

- Prerequisites: CSRF token exchange and validation, CSP nonce/script-src/style-src configuration
- Related: Security headers (CSP as fallback), Output escaping (Threat Mitigation context)
- Advanced Follow-up: HTML Purifier integration for rich text, Context-aware escaping strategies, JavaScript escaping with @js directive

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

## Performance Considerations

- **Authentication overhead**: Each authentication request adds 5-50ms for credential verification, session creation, and token generation. Cache session data in Redis to reduce database load.
- **Authorization check cost**: Policy and gate checks execute on every request. Policy auto-discovery adds negligible overhead (cached after first resolution). For high-throughput endpoints, cache permission results with user-based cache keys.
- **Encryption performance**: Encryption/decryption operations add 0.1-2ms per field. For high-throughput APIs, encrypt only sensitive fields rather than entire payloads.
- **Rate limiting overhead**: In-memory rate limiting (Cache::driver('array')) is faster than Redis-backed limiting. Use Redis-based limiting for distributed deployments; array-based for single-server setups.
- **Session storage**: File-based sessions degrade under high concurrency. Use Redis or database sessions for production deployments with multiple web servers.
- **Header processing**: Security headers (CSP, HSTS, etc.) are set once per response and add negligible overhead. However, CSP policy size affects browser parsing time. Keep CSP directives focused on actual requirements.
