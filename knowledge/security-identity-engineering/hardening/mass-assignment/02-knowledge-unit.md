# Metadata

Domain: Security & Identity Engineering
Subdomain: Security Hardening
Knowledge Unit: Mass assignment $fillable/$guarded
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Mass assignment protection in Laravel prevents attackers from setting unintended model attributes by defining a whitelist (`$fillable`) or blacklist (`$guarded`) of attributes that can be set via `create()` or `update()`. The `$fillable` whitelist approach is the recommended pattern — only listed attributes can be mass-assigned. The `$guarded` blacklist is less secure (new columns are automatically assignable until explicitly guarded). Using `$request->validated()` (from Form Request validation) over `$request->all()` is the companion practice — it ensures only validated, expected fields reach the model.

---

# Core Concepts

- **$fillable**: Array of attribute names that CAN be mass-assigned. The security model: default-deny, explicitly allow. `protected $fillable = ['name', 'email']`.
- **$guarded**: Array of attribute names that CANNOT be mass-assigned. The security model: default-allow, explicitly deny. `protected $guarded = ['is_admin']`. `$guarded = ['*']` blocks ALL mass assignment.
- **Mass Assignment Methods**: `Model::create()`, `Model::update()`, `Model::forceCreate()`, `$model->forceFill()`, `$model->fill()`.
- **unguard() / reguard()**: Globally disable/re-enable mass assignment protection. Should NEVER be used in production code. Only acceptable in seeders or tests with explicit justification.
- **$request->validated()**: Returns only the data that passed Form Request validation rules — inherently safer than `$request->all()`.

---

# Mental Models

- **Whitelist vs Blacklist**: `$fillable` is a whitelist — only attributes listed can be set. `$guarded` is a blacklist — anything NOT listed can be set. Whitelists are inherently more secure because new attributes are denied by default.
- **Security Boundary**: Mass assignment protection is the last defense against "adding a field to the form that wasn't expected." The first defense is `$request->validated()`.

---

# Internal Mechanics

- `Model::fill($attributes)` checks each attribute key against `$fillable` or `$guarded` via `isFillable()`.
- `isFillable($key)`: if `$fillable` is non-empty, checks `in_array($key, $fillable)`. If empty, checks `!in_array($key, $guarded)`.
- `totallyGuarded()`: returns true if `$guarded = ['*']`.
- `forceFill()` and `forceCreate()` bypass all mass assignment checks.
- `unguard()` sets a static `$unguarded` flag to true on the Model class — affects ALL models, not just one.

---

# Patterns

## $fillable with validated() Pattern (Recommended)
- **Purpose**: Defense in depth — validate at the Form Request, restrict at the model.
- **Implementation**: `User::create($request->validated())` with `$fillable = ['name', 'email']`.
- **Benefits**: Even if validation rules are missing a field, `$fillable` blocks it. Even if `$fillable` has too many fields, `validated()` restricts to expected ones.

## guarded = ['*'] Pattern
- **Purpose**: Block all mass assignment by default. Use individual `$model->fill()` calls.
- **Implementation**: `protected $guarded = ['*']` on base model. Add attributes via explicit assignment: `$model->name = $request->name`.
- **Benefits**: Maximum security — no mass assignment regardless of request data.
- **Tradeoffs**: Boilerplate — must set every attribute explicitly.

## forceFill() for Internal Use Only
- **Purpose**: Set attributes on a model from trusted internal code (not user input).
- **Implementation**: `$user->forceFill(['stripe_id' => $stripeId])->save()`. Only call with data YOUR code generated.
- **Benefits**: Bypasses mass assignment protection intentionally for system-generated data.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| $fillable vs $guarded | Security posture | $fillable whitelist is always preferred |
| $guarded = ['*'] + explicit assignment vs $fillable | Ultra-sensitive models (User, roles) | $guarded = ['*'] for User and similar security-critical models |
| forceFill() vs direct property assignment | Trusted internal data | forceFill() is acceptable for system-generated data; direct assignment for single attributes |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| $fillable prevents unintended attribute setting | Must remember to add new attributes to $fillable | Forgot to add a new column to $fillable → create/update silently fails to set the attribute (not an error — the attribute is just missing) |
| $request->validated() restricts to validated fields | Must maintain Form Request rule sets per action | Different actions on the same model may need different validation rules |
| $guarded = ['*'] is most secure | Cannot use create() or fill() at all | Every attribute assignment is explicit — verbose but safe |

---

# Performance Considerations

- Mass assignment checks are simple array operations — negligible overhead.
- No database impact. Protection occurs at the PHP level before any database operation.

---

# Production Considerations

- **Never use unguard() in production**: It disables mass assignment protection globally. Acceptable only in seeders or test setup.
- **Add fillable for new columns**: When adding a new column via migration, immediately add it to `$fillable`. Create a code review checklist item for this.
- **API inputs**: Always use Form Request `validated()` for API controllers. `$request->all()` should never reach `Model::create()`.
- **Nested relationships**: Mass assignment protection does NOT apply to `create()` on relationships by default. `$user->posts()->create($request->all())` — the Post's `$fillable` still applies.

---

# Common Mistakes

- **Using $guarded instead of $fillable**: `$guarded = ['is_admin']` — any new column on the user table becomes mass-assignable by default. An attacker adds `is_premium = true` to their registration request.
- **Passing $request->all() to create()**: `User::create($request->all())` — even with `$fillable`, if you forgot to guard `is_admin` on the fillable list, it can be set. Always use `$request->validated()`.
- **Using unguard() without re-guard()**: `Model::unguard(); User::create(...);` — forget `Model::reguard()`, protection is off for the rest of the request, affecting ALL models.
- **Assuming API resources are safe**: API routes use the same models. `POST /api/users` with `is_admin: true` — if `is_admin` is not in `$fillable`, it's ignored. But if it IS (by mistake), attacker becomes admin.

---

# Failure Modes

- **Attribute Silently Not Set**: If a field is not in `$fillable`, `create()` or `update()` simply ignores it — no error, no warning. The model is created without the attribute. This causes subtle bugs ("user registered but email is null").
- **Unguard Leak**: `Model::unguard()` called in a service provider or middleware — ALL mass assignment is unprotected globally. A routine `User::create($request->all())` in any controller can set any column.
- **Fillable Too Permissive**: `$fillable = ['*']` — equivalent to no protection. Every attribute is mass-assignable.

---

# Related Knowledge Units

- Prerequisites: Eloquent ORM basics, HTTP request lifecycle
- Related: Form Request validation rules, SQL injection prevention (parameterized bindings)
- Advanced Follow-up: Mass assignment with nested relationships, forceFill patterns for internal APIs, Security audit of mass assignment on all models

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
