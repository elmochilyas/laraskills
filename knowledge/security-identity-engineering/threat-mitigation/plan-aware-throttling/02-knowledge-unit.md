# Metadata

Domain: Security & Identity Engineering
Subdomain: Threat Mitigation
Knowledge Unit: Plan-aware throttling for SaaS APIs
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Plan-aware throttling assigns different rate limits per subscription tier — free users get 100 req/hour, pro users get 1000 req/hour, enterprise users get 10000 req/hour. This is implemented via Laravel's `RateLimiter::for()` with conditional `Limit` objects based on the authenticated user's plan. Third-party packages like `grazulex/laravel-api-throttle-smart` extend this with plan-specific quotas, burst allowances, and overage handling. Plan-aware throttling serves dual purposes: it protects infrastructure (preventing free-tier abuse) and monetizes API access (upgrade to unlock higher limits).

---

# Core Concepts

- **Tiered Limits**: Different max attempts per plan. Free, Pro, Enterprise. Plan resolved from user model or billing provider (Stripe, Paddle).
- **Rate Limit Key + Plan**: The key includes both user ID and plan: `$plan.'|'.$userId`. The plan changes the limit, not the key — cache stores track usage per user, not per plan.
- **Burst vs Sustained**: Free tier: 10 req/min burst, 100 req/hour sustained. Pro: 100 req/min, 1000 req/hour. Requires multi-window rate limiting (both per-minute and per-hour).
- **Overage Handling**: What happens when a user exceeds their plan limit. Options: reject (429), queue (process when limit resets), downgrade response (return cached data), or charge overage.

---

# Patterns

## Conditional Limit Object Pattern
- **Implementation**: In `RateLimiter::for('api')`, read `$request->user()?->plan()` and return `Limit::perMinute()` or `Limit::perHour()` based on the plan. Use null-safe operator for unauthenticated requests.
- **Benefits**: Single limiter dynamically handles all tiers.
- **Tradeoffs**: Plan lookup adds a DB query or relies on cached plan info on the User model.

## Multi-Window Rate Limiting Pattern
- **Implementation**: Two named limiters: `api-minutely` and `api-hourly`. Both checked on every request. The more restrictive applies.
- **Benefits**: Combined per-minute and per-hour limits handle both short bursts and sustained usage.
- **Tradeoffs**: Two cache lookups per request. Two keys to track per user.

## Plan + IP Composite for Unauthenticated
- **Implementation**: Unauthenticated requests get IP-based limits. Authenticated requests get plan-based limits. Composite key: `auth_flag.'|'.$plan.'|'.$userId.'|'.$ip` with different returns based on authentication.
- **Benefits**: Rate limits for all request types, authenticated and not.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Plan limits in app vs plan limits at gateway | In-app control vs API gateway (Kong, AWS API Gateway) | In-app for flexibility; gateway for heavy traffic volumes |
| Hard limit vs soft limit + overage | Strict enforcement vs monetization | Soft limit with warning headers + overage charge for enterprise; hard 429 for free/pro |
| Limit reset: rolling window vs calendar reset | Fairness vs predictability | Rolling (24h from first request) for pro; calendar (midnight UTC) for enterprise |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Monetization lever — upgrade unlocks higher limits | Plan resolution adds latency and complexity | Rate limit configuration is now coupled to billing system |
| Protects shared infrastructure from free-tier abuse | Free users may churn if limits are too restrictive | Finding the right limit per tier requires data analysis and iteration |
| Multi-window limits provide fine-grained control | Two cache lookups per request vs one | At 100M requests/day, this is 200M Redis calls — not negligible |

---

# Performance Considerations

- Plan resolution from User model: eager-load plan/role on auth or cache plan info in session/token.
- Multi-window rate limiting doubles Redis operations. If both windows are hit, the second window merely confirms the 429 — but the check still runs.
- Cache TTL for plan-related keys: user's plan changes infrequently. Cache for 1 hour with invalidation on subscription change.

---

# Production Considerations

- **Stale Plan Cache**: If a user upgrades from Free to Pro, their rate limit cache (with old tier) persists until TTL. They must wait or you must explicitly clear the rate limit cache on plan change.
- **Rate Limit Headers**: Include `X-RateLimit-Limit` (plan limit), `X-RateLimit-Remaining` (remaining), `X-RateLimit-Tier` (current plan name).
- **Admin Override**: Enterprise users should have an override to temporarily lift limits for migrations, testing, or support. `$adminOverride = $request->header('X-Admin-Override') === config('services.admin_override_token')`.
- **Grace Period**: When a user downgrades from Pro to Free, allow a grace period (e.g., until next billing period) at Pro limits before enforcing Free limits.

---

# Common Mistakes

- **Hardcoding plan limits**: Plan limits change as pricing evolves. Store limit config in a database or config file, not in `RateLimiter::for()` callbacks.
- **Not limiting unauthenticated access**: Attackers create free accounts to get plan-level limits. Also apply IP-based limits to unauthenticated and free-tier users.
- **Assuming plan is immutable per request**: Plan can change mid-request (webhook from Stripe). For a single request, use the plan at request start. For subsequent requests, re-evaluate.
- **Single-window limit for all plans**: Free tier needs different window logic than Pro. Free: 10 req/min. Pro: 100 req/min AND 1000 req/hour. Pro users hitting the minutely limit but not hourly should still be blocked.

---

# Failure Modes

- **Billing System Unavailable**: If Stripe is down and plan information cannot be resolved, the rate limiter has no plan data. Default: assign the lowest tier (Free). Or fail-open with no limit (dangerous). Plan accordingly.
- **Plan Upgrade Not Reflected Immediately**: User upgrades to Pro but rate limiter still sees Free plan. Old keys with Free limit persist in cache. User gets 429 errors. Clear rate limit cache on subscription update events.
- **Enterprise Limit Too High**: If `Limit::none()` or absurdly high limit is set for enterprise, and there's a bug causing all users to match the enterprise condition, no rate limiting applies to any user.

---

# Related Knowledge Units

- Prerequisites: Rate limiter facade and throttle middleware, Advanced rate limiting algorithms
- Related: SaaS billing integration (Stripe, Paddle), Plan cache invalidation patterns
- Advanced Follow-up: Overage billing for API usage, Webhook-driven rate limit updates, API monetization strategies

## Ecosystem Usage
- **Laravel RateLimiter**: Illuminate\Cache\RateLimiter facade provides named rate limit definitions; the 	hrottle middleware applies limits to routes. Named limits support per-user, per-IP, and custom segmenters.
- **Laravel Form Request Validation**: Illuminate\Foundation\Http\FormRequest base class provides uthorize() and ules() methods; integrates with the Validator facade for automatic input validation on controller methods.
- **Laravel Crypt/Mcrypt**: Crypt::encryptString() and Crypt::decryptString() use AES-256-CBC or AES-256-GCM encryption with the application key. The Crypt facade wraps the framework's encrypter singleton.
- **Laravel Signed URLs**: URL::signedRoute() generates HMAC-signed URLs with optional expiration timestamps; the ValidateSignature middleware verifies signatures on incoming requests.
- **File upload security**: Illuminate\Http\UploadedFile provides getClientOriginalExtension(), getMimeType(), store(), storeAs() methods; validation rules (mimes:csv,txt, max:10240) enforce upload restrictions.
- **Spatie Rate Limited Job Middleware**: Community package providing rate-limited job execution middleware; uses Laravel's RateLimiter facade for distributed rate limiting across multiple workers.
- **Advanced rate limiting patterns**: Plan-aware throttling adjusts rate limits based on user subscription tier; uses RateLimiter::for() with per-tier limit definitions and 	hrottle middleware with dynamic limit resolution.
- **Dependency auditing**: composer audit and community packages like enlightn/enlightn scan dependencies for known vulnerabilities; oave/security-advisories blocks known-vulnerable packages from installation.

## Research Notes
- Laravel rate limiting was significantly enhanced in Laravel 12 with the introduction of named rate limiters that can reference other limiters for inheritance — RateLimiter::for('api', fn() => RateLimiter::for('global')->by('ip')).
- The 	hrottle middleware uses dynamic rate limit resolution when a Closure is passed — the limit is re-evaluated on every request, allowing per-user rate limit overrides based on subscription tier or trust level.
- Signed URLs in Laravel use HMAC-SHA256 with the application key — the signature includes all query parameters and the expires timestamp, providing tamper-proof URL validation without server-side state.
- File upload validation in Laravel 12+ includes built-in SVG upload protection (svg validation rule) that checks for embedded scripts and event handlers in SVG files.
- The Crypt facade uses serialization for encrypting objects and arrays — this introduces a potential unserialization vulnerability if an attacker can control the encrypted data; use Crypt::encryptString() for simple values.
- Form Request validation executes in the middleware pipeline before the controller — the prepareForValidation() hook allows preprocessing input before validation, useful for normalizing data format.
- Plan-aware throttling patterns use RateLimiter::for() with dynamic limit resolution based on the authenticated user's plan — the 	hrottle middleware accepts a RateLimiter::limiter() callback for complex limit definitions.
- Community rate limiting packages (spatie/laravel-rate-limited-job-middleware) extend rate limiting to queued jobs, not just HTTP requests — this prevents downstream API rate limit violations during batch job processing.

## Internal Mechanics
- **RateLimiter Resolution**: RateLimiter::for('login', fn(, ) => Limit::perMinute(5)) registers a named limiter. The 	hrottle middleware resolves the limiter by name at runtime, applies the limit, and returns a 429 Too Many Requests response with Retry-After header when exceeded.
- **Signed URL Generation**: URL::signedRoute('verify', ['id' => ->id], expires: 3600) → collects route name, parameters, and expiration → builds URL → computes HMAC-SHA256 signature over the URL string using APP_KEY → appends ?signature=<hash> to the URL. The ValidateSignature middleware re-computes the hash and compares using hash_equals().
- **Crypt Facade Encryption Flow**: Crypt::encrypt('value') → generates random IV (16 bytes for AES-256-CBC) → serializes the value → encrypts with AES-256-CBC using APP_KEY as encryption key → computes HMAC-SHA256 for integrity → JSON-encodes the payload ({iv, value, mac, tag}). Decryption reverses the process and verifies the MAC.
- **Form Request Validation Flow**: Custom form request class extends Illuminate\Foundation\Http\FormRequest → middleware pipeline calls FormRequest->authorize() → if false, returns 403 Forbidden → if true, calls FormRequest->rules() → FormRequest->validator() validates the request data against rules → if validation fails, throws ValidationException with error bag → if passes, the validated data is available via $request->validated().
- **File Upload Processing**: Uploaded file arrives as Symfony\Component\HttpFoundation\File\UploadedFile → $request->file('document') returns UploadedFile instance → $file->store('uploads') moves file to configured filesystem disk → MIME type is detected by Symfony's MimeTypeGuesser (not by client-provided content-type).
- **Dependency Audit Flow**: composer audit reads composer.lock → matches each package/version against the Security Advisories Database → returns list of known vulnerabilities with CVE IDs, severity, and advisory URLs. The command fails with exit code 1 when vulnerabilities match.

## Mental Models

- **Authentication as identity verification**: Authentication answers "who are you?" — it's the process of verifying credentials (password, token, biometric) against a trusted store. The result is an authenticated session or token that represents the user's identity.
- **Authorization as permission checking**: Authorization answers "what can you do?" — it checks whether the authenticated identity has permission to perform a specific action on a specific resource. This is orthogonal to authentication: a user can be authenticated but not authorized.
- **Throttling as traffic management**: Rate limiting is analogous to a bouncer at a venue — it allows legitimate traffic through at a controlled rate while preventing crowd surges (brute force attacks, DoS attempts). The bouncer doesn't stop all people, just those exceeding the reasonable flow rate.
- **Security as layered defense**: Multiple security mechanisms work together like castle defenses — the moat (authentication), the walls (authorization), the guards (rate limiting), and the inner chambers (encryption). No single defense is impenetrable; the layering provides resilience.
- **Secrets as keys to the kingdom**: API keys, tokens, and credentials are the digital equivalent of physical keys. They should be stored securely (vault), distributed carefully (just-in-time access), rotated regularly, and revoked immediately when compromised.
