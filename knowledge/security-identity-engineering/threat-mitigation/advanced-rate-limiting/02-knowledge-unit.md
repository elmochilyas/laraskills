# Metadata

Domain: Security & Identity Engineering
Subdomain: Threat Mitigation
Knowledge Unit: Advanced rate limiting (sliding window, token bucket)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Advanced rate limiting algorithms — sliding window log, sliding window counter, and token bucket — provide more precise traffic shaping than Laravel's built-in fixed-window algorithm. The fixed window (default) allows burst traffic at window boundaries: 100 requests at 11:59:59 and 100 more at 12:00:00 pass through before the window resets. Sliding window algorithms smooth this by tracking requests continuously (window log) or interpolating between windows (sliding counter). Token bucket allows short bursts while enforcing a sustained rate. These algorithms require custom implementation in Laravel (using Redis) or third-party packages.

---

# Core Concepts

- **Fixed Window**: Tracks requests in a fixed time bucket (e.g., per-minute). Simple but allows double-burst at boundaries.
- **Sliding Window Log**: Stores timestamps of each request in a sorted set. Counts requests within the rolling window. Precise but memory-intensive for high-traffic endpoints.
- **Sliding Window Counter (Hybrid)**: Combines fixed window buckets with overlap interpolation. Redis-backed. Most common production algorithm. Approximates sliding window with bounded memory.
- **Token Bucket**: Maintains a token count. Each request consumes a token. Tokens refill at a fixed rate (e.g., 10 tokens/second). Allows bursts up to bucket capacity. Used for API rate limiting by AWS, Stripe, GitHub.

---

# Mental Models

- **Fixed Window = Hourly Reset**: Like a parking garage that resets at midnight. You can park 100 cars from 11:30 to 11:59 and 100 more from 12:00 to 12:01.
- **Token Bucket = Water Faucet**: The bucket holds N tokens. Water (tokens) fills at a constant rate. You can use the whole bucket at once (burst) but then must wait for refill. The sustained rate is the fill rate × N.
- **Sliding Window = Moving Average**: Like a one-minute window that slides forward continuously, not jumping at each minute boundary. Prevents the "reset at midnight" problem.

---

# Patterns

## Redis Sorted Set Sliding Window
- **Implementation**: `ZADD rate_limit:{key} {timestamp} {request_id}`, `ZREMRANGEBYSCORE rate_limit:{key} 0 {timestamp - window}`, `ZCARD rate_limit:{key}`. Each request adds its timestamp. Count = cardinality within window.
- **Benefits**: Precise sliding window, no boundary burst.
- **Tradeoffs**: Memory grows with request rate. Need to trim old entries. Not atomic without Lua scripting.

## Redis Sorted Set + Lua Atomicity
- **Implementation**: Lua script: `local now = redis.call('TIME')[1]; redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, now - ARGV[1]); local count = redis.call('ZCARD', KEYS[1]); if count < tonumber(ARGV[2]) then redis.call('ZADD', KEYS[1], now, now); redis.call('EXPIRE', KEYS[1], ARGV[1]); return 1 else return 0 end`.
- **Benefits**: Atomic operation — no race conditions. Single round trip to Redis.
- **Tradeoffs**: Requires Lua scripting support (Redis built-in). Script must be registered or sent each time.

## Token Bucket via Redis
- **Implementation**: Store `last_refill_time` and `tokens` as a Redis hash. `local elapsed = now - last_refill_time; local tokens = min(capacity, tokens + elapsed * fill_rate); if tokens >= 1 then tokens = tokens - 1; ... return 1 else return 0 end`.
- **Benefits**: Burst allowance + sustained rate control.
- **Tradeoffs**: More complex Lua script. Clock-dependent (token refill uses server time).

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Sliding window vs token bucket | Smooth traffic vs burst-tolerant traffic | Sliding window for login/registration; token bucket for API endpoints with bursty legitimate usage |
| Lua scripting vs Redis transactions | Atomicity vs complexity | Lua scripting for atomic operations; Redis MULTI/EXEC for non-critical rate limits |
| Custom implementation vs package (grazulex/laravel-api-throttle-smart) | In-house control vs quick setup | Custom for full control; package for rapid adoption |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Sliding window eliminates boundary burst | Higher memory usage per request (sorted set entries) | At 1000 req/s, a 1-minute window stores 60,000 entries in Redis |
| Token bucket allows legitimate bursts | Implementation is more complex | Refill rate calculation depends on system clock accuracy |
| Precise algorithms improve UX | CPU overhead per request (Lua script eval) | Redis Lua eval adds ~0.1ms per check — negligible |

---

# Performance Considerations

- Redis sorted set with Lua: ~0.5-1ms per check. Memory: ~50 bytes per entry (timestamp + request ID).
- Token bucket: ~0.3-0.8ms per check (fewer Redis commands than sorted set).
- Batch Lua script registration via `SCRIPT LOAD` to avoid sending script text each request.
- For high-traffic endpoints (>10k req/s), pre-compute rate limit states at sub-second intervals rather than on every request.

---

# Production Considerations

- **Clock Synchronization**: Token bucket refill and sliding window boundaries depend on server time. NTP sync required. 1-second drift is acceptable; 10-second drift causes visible inaccuracies.
- **Memory Limits**: Redis `maxmemory-policy` should be `noeviction` or `allkeys-lru`. Rate limit sorted sets should have TTL to auto-expire stale keys.
- **Graceful Degradation**: If Redis is unavailable, advanced rate limiting fails. Implement a fallback to fixed-window or allow-all. Log the failure.
- **Rate Limit Response**: Return `Retry-After` header with the exact timestamp when the client can retry (Unix timestamp). More precise than "try again in 60 seconds."

---

# Common Mistakes

- **Using sorted set without trimming**: Old entries accumulate. Redis memory grows unbounded. Always remove entries outside the window on every check.
- **Not using Lua for atomicity**: Separate `ZADD` and `ZCARD` calls have a race condition — two concurrent requests both add and count, potentially allowing more than the limit.
- **Token bucket without bound check**: Tokens can overflow the bucket (`tokens > capacity`) if refill math is incorrect. Always cap at `min(capacity, tokens + refill)`.
- **Forgetting TTL on rate limit keys**: Without TTL, a key from a one-time burst (e.g., a bot attack that stopped) persists in Redis forever.

---

# Failure Modes

- **Redis Memory Exhaustion**: If sorted set entries are not trimmed AND no TTL is set, the Redis instance fills with stale rate limit data. New entries fail (`OOM error`), and rate limiting stops working.
- **Clock Jump**: If the server clock jumps forward by 60 seconds, all rate limit windows advance. Users appear to have hit their limit. Requests are rejected until real time catches up.
- **Lua Script Execution Error**: If the Lua script has a syntax error, every rate limit check fails. The script should be tested before deployment.

---

# Related Knowledge Units

- Prerequisites: Rate limiter facade and throttle middleware, Redis cache configuration
- Related: Plan-aware throttling for SaaS APIs, Custom rate limiter implementations
- Advanced Follow-up: Distributed token bucket with Redis Cluster, Lua scripting patterns for rate limiting, gRPC-level rate limiting for microservices

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
