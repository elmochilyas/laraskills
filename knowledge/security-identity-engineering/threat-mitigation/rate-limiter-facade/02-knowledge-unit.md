# Metadata

Domain: Security & Identity Engineering
Subdomain: Threat Mitigation
Knowledge Unit: Rate limiter facade and throttle middleware
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Laravel's `RateLimiter` facade and `throttle` middleware provide application-level rate limiting using a configurable cache backend. Named limiters are defined via `RateLimiter::for()` in `AppServiceProvider`, referencing cache stores and configuring max attempts and decay intervals. The `throttle` middleware attaches named limiters to routes or groups. The underlying cache store (Redis recommended) tracks attempt counts using atomic increments. Rate limiting is the primary defense against brute-force attacks on login, registration, and API endpoints.

---

# Core Concepts

- **RateLimiter::for($name, $callback)**: Defines a named limiter. The callback receives the incoming `Illuminate\Http\Request` and returns a `Limit` instance with `->by($key)`, `->maxAttempts($n)`, `->decayMinutes($m)`, `->response($callback)`.
- **throttle Middleware**: `->middleware('throttle:api')` on routes. References a named limiter. Also supports `throttle:5,1` inline (5 attempts per minute) without a named limiter.
- **Limit::by()**: The rate limit key — typically `$request->ip()`, `$request->user()?->id`, or a composite `$request->ip().'|'.optional($request->user())->id`.
- **Limit::response()**: Custom callback for rate-limited responses. Default: `429 Too Many Requests`.
- **Cache Store**: Rate limits are stored in the default cache driver. For distributed rate limiting, use Redis/Memcached (not file).
- **Atomic Operations**: The `RateLimiter` uses `Cache::add()` for initial count, `Cache::increment()` for subsequent attempts — atomic even with concurrent requests.

---

# Mental Models

- **Token Bucket as Mental Model**: Each rate limit bucket (key) has a maximum capacity (max attempts) and refills at a rate (decay). But Laravel's implementation is fixed-window, not token bucket.
- **Defense Layer**: Rate limiting is the bouncer at the door. It does not authenticate or authorize — it simply slows down attackers by rejecting excessive requests.

---

# Internal Mechanics

- `Illuminate\Cache\RateLimiter` uses the cache facade's `add()` to atomically set the initial counter with the decay window TTL.
- `hit()` increments the counter via `increment()` and returns the attempt count.
- `tooManyAttempts()` checks if `attempts > maxAttempts`.
- `availableIn()` returns seconds until reset.
- The cache keys are: `{$key}:timer` (expiry timestamp) and `{$key}` (attempt count).
- `clear()` removes the key entirely, resetting the limiter.

---

# Patterns

## Login Rate Limiting Pattern
- **Purpose**: Prevent brute-force password guessing.
- **Implementation**: Named limiter `login` in `AppServiceProvider`: `Limit::perMinute(5)->by($request->input('email').'|'.$request->ip())`. Apply to login route via `throttle:login`.
- **Benefits**: Locks by email+IP, preventing wide-scale attacks.

## User-Based API Rate Limiting Pattern
- **Purpose**: Limit API usage per authenticated user.
- **Implementation**: `Limit::perMinute(60)->by($request->user()?->id ?? $request->ip())`.
- **Benefits**: Authenticated users get higher limits; unauthenticated get lower limits by IP.

## Segmented Rate Limiting Pattern
- **Purpose**: Different limits for different API tiers.
- **Implementation**: `$request->user()?->plan === 'premium' ? Limit::perMinute(1000) : Limit::perMinute(100)`.
- **Benefits**: Plan-aware throttling without additional packages.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Named limiter vs inline throttle | Reusable vs one-off | Named limiter for all rate limits — testable, configurable, reusable |
| `$request->ip()` vs `$request->user()->id` as key | Unauthenticated vs authenticated | Composite key `user_id|ip` — balances user-based limits with IP-based overflow protection |
| Cache driver selection | Rate limit consistency | Redis for production (atomic operations, persistence); file cache is acceptable for single-server dev |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Built-in, no extra packages | Fixed-window algorithm only (not sliding window) | Burst traffic at window boundary can exceed limits |
| Cache-agnostic (file, Redis, database) | File cache is single-server only | Redis required for multi-server rate limiting consistency |
| Named limiters are testable | Misconfigured limiters silently fail | If cache driver is down, rate limiting fails open — all requests pass through (no limit) |

---

# Performance Considerations

- Rate limiter adds ~1ms per check with Redis cache. File cache adds ~5ms per check due to file I/O.
- The cache key includes the request `ip` or `user_id`. High-traffic endpoints with unique IPs create many cache keys — Redis handles millions of keys; file cache does not.
- `clear()` operations on login success prevent stale limit accumulation.

---

# Production Considerations

- **Cache Driver Availability**: If Redis goes down, rate limiting stops working. Requests pass through unthrottled. Use Redis Sentinel/Cluster for HA. Implement circuit breaker if the cache is down.
- **Rate Limit Headers**: Laravel's `throttle` middleware adds `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers. Consume these in client-side retry logic.
- **429 Response Customization**: `Limit::response(fn() => response()->json(['message' => 'Too many attempts'], 429))`.
- **Logging Rate Limit Hits**: Log when rate limits are exceeded (IP, user, endpoint, attempt count) for security monitoring.
- **Clearing Limits on Success**: For login limits, call `RateLimiter::clear($key)` on successful login so genuine users are not locked out after one mistake.

---

# Common Mistakes

- **Using IP-only keys**: Office with NAT — all users share one IP. One user hitting the limit blocks everyone. Include a user identifier in the key.
- **Not clearing rate limits on success**: Login fails twice, succeeds on third. Rate limit counter is still 3/5. Next day, three failed attempts hit the counter from yesterday — user gets locked out unfairly.
- **File cache for rate limiting**: File cache is not atomic across concurrent requests. Two simultaneous requests can both read 4/5 and both succeed, allowing 6/5 attempts. Use Redis.
- **Applying throttle to all routes equally**: Public routes should have stricter limits than authenticated routes. Segment by authentication status.
- **Not customizing 429 response**: Default 429 is a blank page. Customize to return JSON for APIs or a styled page for web routes.

---

# Failure Modes

- **Cache Driver Down**: `Cache::add()` fails, but the RateLimiter does not throw an exception — it returns false (key already exists). `tooManyAttempts()` may return incorrect results. Requests may pass through unthrottled.
- **Clock Drift**: Rate limit decay uses server time. If the server clock jumps backward, cache keys have artificially long TTLs, locking users out until the keys expire.
- **IP Spoofing (X-Forwarded-For)**: If using `$request->ip()` and the load balancer does not strip `X-Forwarded-For`, an attacker can spoof their IP and bypass per-IP rate limits. Trust trusted proxies only.
- **Key Collision**: Two different route groups using the same limiter name share the same counter. One route's traffic exhausts the other's allowance. Use distinct limiter names.

---

# Related Knowledge Units

- Prerequisites: Cache configuration (driver selection), Middleware pipeline
- Related: Advanced rate limiting (sliding window, token bucket), Plan-aware throttling for SaaS APIs
- Advanced Follow-up: Custom rate limiter implementations, Rate limiting with Redis Sorted Sets (sliding window), Distributed rate limiting with Redis Cluster

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
