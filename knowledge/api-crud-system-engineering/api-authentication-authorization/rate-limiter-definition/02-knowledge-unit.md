# Rate Limiter Definition

## Metadata (Domain: API & CRUD System Engineering, Subdomain: API Authentication & Authorization, Last Updated: 2026-06-02)

## Executive Summary
Laravel's `RateLimiter` facade provides a fluent API for defining and enforcing rate limits using the cache backend (Redis, Memcached, or database). Rate limiter definitions are registered in `App\Providers\AppServiceProvider::boot()` via `RateLimiter::for()`. Each definition specifies the maximum number of attempts, the time window, and the consumer identifier key. These named limiters are then applied to routes or route groups via the `throttle` middleware. Proper rate limiter definition is the foundation of API protection, ensuring fair usage and preventing abuse.

## Core Concepts
- **Named limiter**: A rate limiter identified by a string name (e.g., `'api'`, `'login'`, `'exports'`). Defined once, used across multiple routes.
- **Limit instance**: Returned by the limiter closure. Defines `maxAttempts`, `decaySeconds` (window), and `key` (consumer identifier).
- **Consumer key**: The string used to identify the consumer for rate limit tracking (IP, user ID, API key, or composite).
- **Decay window**: The time period in seconds after which the attempt counter resets (typically 60, 3600, or 86400).
- **Multiple buckets**: An array of `Limit` instances allowing multiple windows (e.g., per-minute AND per-hour).
- **Atomic operations**: Laravel uses atomic cache operations (INCR with TTL) to prevent race conditions in concurrent requests.

## Mental Models
- **Rate limiter as turnstile**: Each named limiter is a turnstile at a different entrance. The entrance name tells you which turnstile you're passing through.
- **Limit as bucket**: The bucket holds tokens. Each request takes a token. The bucket refills at a fixed rate (decay window).
- **Consumer key as ID card**: The key identifies who you are for counting purposes. If you change your ID card, you get a fresh set of requests.

## Internal Mechanics
1. `RateLimiter::for('name', closure)` registers the limiter during service provider boot.
2. When the `throttle:name` middleware runs, it calls `RateLimiter::attempts('name')` which invokes the closure with the request object.
3. The closure returns one or more `Limit` instances. Each `Limit` is converted to a cache key: `framework/rate-limiter/{name}+{key}`.
4. For each `Limit`, the middleware checks: `Cache::get($cacheKey)` < `$limit->maxAttempts`.
5. If under the limit, the cache counter is incremented via `Cache::add($cacheKey, 0, $limit->decaySeconds)` followed by `Cache::increment($cacheKey)`.
6. If over the limit, a `429 Too Many Requests` response is returned with the `Retry-After` header.
7. For multiple `Limit` instances, the middleware checks all buckets. If any bucket is exceeded, the request is rejected.
8. The `Retry-After` value is calculated from the bucket with the longest remaining wait time.

## Patterns
- **Per-IP limiter for guest endpoints**:
  ```php
  RateLimiter::for('guest', fn ($request) =>
      Limit::perMinute(30)->by($request->ip())
  );
  ```
- **Per-user limiter for authenticated endpoints**:
  ```php
  RateLimiter::for('auth', fn ($request) =>
      Limit::perMinute(300)->by($request->user()?->id ?: $request->ip())
  );
  ```
- **Multi-bucket (burst + sustained)**:
  ```php
  RateLimiter::for('api', fn ($request) => [
      Limit::perMinute(60),
      Limit::perHour(1000),
  ]);
  ```
- **Tiered limiter via dynamic limit**:
  ```php
  RateLimiter::for('tiered', fn ($request) => [
      Limit::perMinute(guestLimit($request))->by('guest:'.$request->ip()),
      Limit::perMinute(userLimit($request))->by('user:'.$request->user()->id),
  ]);
  ```
- **Login rate limiter with IP + email**:
  ```php
  RateLimiter::for('login', fn ($request) =>
      Limit::perMinute(5)->by($request->ip().'|'.$request->input('email'))
  );
  ```
- **Global rate limiter for all routes**:
  ```php
  RateLimiter::for('global', fn ($request) =>
      Limit::perSecond(1000)->by('global')
  );
  ```

## Architectural Decisions
1. **Named limiter vs inline throttle**: Named limiters are reusable, testable, and maintainable. Inline `throttle:60,1` on routes is convenient but leads to inconsistency as the application grows.
2. **Cache backend**: Redis is strongly recommended for rate limiting. It is fast, supports atomic operations, and handles high throughput. File-based caching is unreliable for rate limiting (concurrent request issues).
3. **Limit method**: `perMinute()`, `perHour()`, `perDay()`, and `perSecond()` are convenience methods over `->maxAttempts($n)->decayMinutes($m)`. Use the convenience methods for readability.
4. **Key composition**: Include both the consumer identifier AND the limiter context in the key to avoid collision: `login:'.$request->ip()` vs `api:'.$request->ip()`.

## Tradeoffs (table)
| Aspect | Redis-backed | File-backed | Database-backed |
|--------|-------------|-------------|-----------------|
| Speed | Sub-millisecond | Milliseconds | 10-50ms |
| Atomic operations | Yes (INCR) | No (file locking) | Partial (transactions) |
| Distributed support | Yes (Redis Cluster) | No (single server) | Yes |
| TTL management | Native (EXPIRE) | Manual cleanup | Manual cleanup |
| Data persistence | Configurable | Persistent | Persistent |
| Cost | Additional infrastructure | Free | Free (uses existing DB) |

## Performance Considerations
- Redis INCR + EXPIRE is O(1) and handles 100K+ ops/second on modest hardware.
- For multi-bucket limits, the middleware makes N cache calls (N buckets). Use Redis pipeline to batch them.
- Rate limit keys should have TTLs to prevent Redis memory exhaustion. Default TTL = decay window + max(decay window * 0.1, 60) seconds.
- For fixed-window counters, many clients hitting the reset boundary simultaneously can overload the backend. Use sliding window (Redis sorted sets) for smoother distribution.
- The rate limiter is checked early in the middleware stack — before controllers, before DB queries for authorization. Failed limits return 429 without processing the request.

## Production Considerations
- **Rate limiter monitoring**: Track `RateLimiter::availableIn()` calls in logs. Set up alerts when rate limits are consistently maxed out (indicates either attack or insufficient limit).
- **Rate limiter eviction**: Redis memory can fill with rate limit keys. Configure `maxmemory-policy allkeys-lru` or set conservative TTLs.
- **Limiter testing**: Use `RateLimiter::clear('limiter-name')` in tests to reset rate limits between test cases. Use `RateLimiter::attempts('limiter-name')` to assert expected counts.
- **Limiter warm-up**: For known high-traffic events (e.g., product launch), pre-warm rate limits or temporarily increase limits.
- **Fallback on cache failure**: If Redis is down, rate limiting fails open (all requests pass). Implement a circuit breaker pattern with a secondary cache layer or a fail-closed approach.

## Common Mistakes
- Using `perMinute(0)` — disables all requests. Use `perMinute(PHP_INT_MAX)` for effectively unlimited (or `maxAttempts(0)` to block).
- Forgetting to include the key when returning a `Limit` — defaults to the endpoint URL, incorrectly grouping all consumers.
- Return the same `Limit` instance from multiple named limiters (mutability issues). Create a new instance each time.
- Setting `decaySeconds` too low (e.g., 1 second) — clients may get rate-limited due to clock skew.
- Not testing rate limiters in integration tests (rate limit state persists between tests).
- Defining limiters in service provider but not registering the middleware alias (`throttle`).
- Using `RateLimiter::for()` inside a route closure instead of a service provider (every request re-registers).

## Failure Modes
1. **Cache stampede on window reset**: All clients hit the limit boundary simultaneously and flood the backend. Solution: Use sliding window algorithm or stagger TTLs with jitter.
2. **Rate limiter key collisions**: Two different endpoints use the same key pattern, and hitting one affects the other. Solution: Include the endpoint name or prefix in the key.
3. **Race condition in `hit()`**: Two concurrent requests both check and are under the limit, but both increment past the limit. The cache INCR is atomic but the check-then-increment is not fully transactional. Laravel mitigates this by using `Cache::add()` to atomically set the initial counter. For strict limits, use a Lua script.
4. **Memory exhaustion from key explosion**: Each unique IP creates a new cache key. With millions of IPs, Redis memory grows unbounded. Solution: Set short TTLs and use maxmemory-policy.
5. **Clock skew across servers**: If two web servers have different clock times, the rate limit window may be misaligned. Solution: NTP sync and use cache-based TTLs (not local time).

## Ecosystem Usage
- **Laravel Forge**: Uses rate limiting on deployment endpoints. Each server has per-minute limits on deployment triggers.
- **Laravel Vapor**: Serverless environment where rate limiting is handled at the API Gateway level, not the application level. Laravel's rate limiters still apply within Vapor.
- **Laravel Octane**: Rate limiting works with Octane if using Redis cache driver (not file/database). The rate limiter is reset between requests via the Octane request lifecycle.

## Related Knowledge Units
### Prerequisites
- Laravel Cache system
- Redis fundamentals

### Related Topics
- [rate-limiting-by-auth-tier](./phase-2/09-rate-limiting-by-auth-tier.md)
- [rate-limit-headers](./phase-2/11-rate-limit-headers.md)
- [ip-based-rate-limiting](./phase-2/14-ip-based-rate-limiting.md)

### Advanced Follow-up Topics
- Sliding window rate limiting with Lua scripts
- Token bucket algorithm implementation
- Consistent hashing for distributed rate limiting

## Research Notes
### Source Analysis
`Illuminate\Cache\RateLimiter` is the facade implementation. `Illuminate\Routing\Middleware\ThrottleRequests` is the middleware that enforces limits. The `Limit` class is in `Illuminate\Cache\RateLimiting\Limit`.

### Key Insight
Laravel's rate limiter uses a fixed window algorithm (counters reset at fixed intervals). This is simpler than sliding window but can allow 2X traffic at the window boundary. For most APIs, fixed window is acceptable; for critical endpoints, implement a sliding window using Redis sorted sets or Lua scripts.

### Version-Specific Notes
- **Laravel 8+**: `RateLimiter::for()` syntax. Return `Limit` instances.
- **Laravel 9+**: Support for returning multiple `Limit` instances (array) from a single `for()` definition.
- **Laravel 10+**: No breaking changes to the rate limiter API.
- **Laravel 11**: `RateLimiter` facade continues to work. Cache backends may have performance improvements.

## Tradeoffs

**Benefit:** Centralized, consistent pattern. **Cost:** Additional abstraction layer, indirection. **Consequence:** Cleaner controllers but requires team discipline to maintain separation.