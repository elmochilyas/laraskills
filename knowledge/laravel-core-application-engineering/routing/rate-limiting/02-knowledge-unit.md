# Rate Limiting

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Routing System
- **Knowledge Unit:** Rate Limiting
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-01

---

## Executive Summary

Rate limiting controls the number of requests a client can make to a route within a specified time window. Laravel provides two mechanisms: inline configuration via the `throttle` middleware parameter (`throttle:60,1`) and named limiters via `RateLimiter::for()` that provide plan-aware, key-customizable, and composable rate limits.

The critical engineering dimension of rate limiting is its dependency on the cache driver. In single-server deployments with a file cache driver, each request to a rate-limited endpoint reads and writes the cache file. In multi-server deployments behind a load balancer, the file cache driver creates independent counters per server — effectively multiplying the rate limit by the number of servers. This makes Redis or another shared cache driver a production requirement for rate limiting.

The second architectural concern is the choice of limiting key: authenticated-by-user-ID vs unauthenticated-by-IP. Authenticated endpoints should key on the user identifier to prevent one user's actions from affecting others on the same IP (NAT, VPN, corporate networks). Unauthenticated endpoints have no alternative to IP-based keys but must accept the imprecision of shared IPs.

---

## Core Concepts

### RateLimiter::for() — Named Limiters
Named limiters are registered in a service provider's `boot()` method, typically `AppServiceProvider::configureRateLimiting()`:

```php
RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
});
```

The callback receives the current request and returns one or more `Limit` objects, `Unlimited`, or a `Response` (to block access entirely without incrementing the counter).

### Limit Objects
`Illuminate\Cache\RateLimiting\Limit` defines:
- `perSecond($maxAttempts)` — Per-second window
- `perMinute($maxAttempts)` — Per-minute window (most common)
- `perHour($maxAttempts)` — Per-hour window
- `perDay($maxAttempts)` — Per-day window
- `perMinutes($decayMinutes, $maxAttempts)` — Custom window
- `by($key)` — Custom cache key prefix (differentiates counters)
- `response($callback)` — Custom 429 response

### Stacked Limits
Multiple `Limit` objects can be returned for cascading enforcement:
```php
RateLimiter::for('login', function (Request $request) {
    return [
        Limit::perMinute(5)->by($request->input('email')),
        Limit::perMinute(10)->by($request->ip()),
    ];
});
```
Both limits are enforced independently. The request is blocked if EITHER limit is exceeded.

### Unlimited
Returning `Unlimited::from()` disables rate limiting for this route. Used for conditional rate limiting based on request attributes (e.g., premium users have no limit).

### Inline throttle Middleware
The string-based `throttle:60,1` syntax specifies `max_attempts, decay_minutes` as middleware parameters:
```php
Route::get('/users', [UserController::class, 'index'])
    ->middleware('throttle:60,1');
```

The `guest|authenticated` syntax differentiates limits by auth state:
```php
Route::middleware('throttle:30|60,1')...
// 30 per minute for guests, 60 per minute for authenticated
```

---

## Mental Models

### Rate Limiting as Circuit Breaker
Rate limiting is not just for abuse prevention — it is a circuit breaker for backend services. Without rate limiting, a single misbehaving client (bug in their polling loop, accidental infinite loop in their code) can saturate your application server, database connection pool, or API dependency budget. Rate limiting bounds the damage from any single client.

### Counter as Shared Resource
The rate limit counter is a shared resource that must be consistent across all application servers. File cache counters are per-server — each server has its own independent count, making the effective limit `max_attempts × server_count`. This inconsistency is invisible during development (single server) and catastrophic in production (multiple servers).

### Key as Scope
The `by()` method defines the scope of the rate limit. A limit keyed by `$request->ip()` applies per-IP. Keyed by `$request->user()->id` applies per-user. Keyed by `tenant_{$tenant->id}` applies per-tenant. The key defines who/what shares the counter.

---

## Internal Mechanics

### ThrottleRequests Middleware

```
ThrottleRequests::handle($request, $next, $maxAttempts, $decayMinutes, $prefix)
  ├── Parse middleware parameters:
  │     ├── If $maxAttempts is a string (named limiter):
  │     │     └── $limiter = $this->limiter->limiter($name)
  │     │     └── $limits = $limiter($request)  // Returns Limit[] or Unlimited
  │     ├── If pipe-delimited: splitted by '|' for guest|authenticated
  │     └── If numeric: inline configuration
  │
  ├── For each limit:
  │     ├── $key = $limit->key  // from ->by() or auto-generated
  │     ├── $maxAttempts = $limit->maxAttempts
  │     ├── $decaySeconds = $limit->decaySeconds
  │     ├── Check cache for current count
  │     ├── If count >= $maxAttempts:
  │     │     └── Return 429 response with Retry-After header
  │     └── Increment counter in cache
  │
  └── Return $next($request)
```

### Cache Key Generation
- Named limiters: `md5($limiterName . $limit->key)` when `shouldHashKeys` is true (default)
- Inline limiters: `sha1($route->getDomain() . '|' . $request->ip())` for guests, `sha1($user->getAuthIdentifier())` for authenticated

### Redis vs File Cache Behavior
The `ThrottleRequestsWithRedis` middleware provides an optimized Redis implementation that uses atomic `INCR` and `EXPIRE` operations. The standard `ThrottleRequests` middleware uses the cache repository's `add()` / `increment()` / `decrement()` methods, which work with any cache driver but are not atomic for file or database caches.

### Response Headers
The middleware adds standard rate limit headers to the response:
- `X-RateLimit-Limit` — Maximum allowed requests
- `X-RateLimit-Remaining` — Remaining requests in current window
- `Retry-After` — Seconds until the rate limit resets (429 responses only)
- `X-RateLimit-Reset` — Unix timestamp of rate limit reset

---

## Patterns

### Per-User Named Limiter
```php
RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
});
```
Keys on user ID for authenticated requests, IP for unauthenticated. Prevents shared IP issues.

### Plan-Based Limiter
```php
RateLimiter::for('api', function (Request $request) {
    $user = $request->user();
    $plan = $user?->plan ?? 'free';
    
    return match($plan) {
        'enterprise' => Limit::perMinute(10000),
        'pro' => Limit::perMinute(1000),
        default => Limit::perMinute(60),
    };
});
```

### Per-Endpoint Stacked Limiters
```php
RateLimiter::for('auth-strict', function (Request $request) {
    return [
        Limit::perMinute(5)->by('ip:' . $request->ip()),
        Limit::perMinute(3)->by('email:' . $request->input('email')),
    ];
});
```

### Per-Tenant Rate Limiting
```php
RateLimiter::for('api', function (Request $request) {
    $tenant = app('currentTenant');
    return Limit::perMinute($tenant->api_rate_limit)
        ->by('tenant_' . $tenant->id);
});
```

### Custom 429 Response
```php
RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(60)->by($request->user()?->id)->response(function () {
        return response()->json([
            'error' => 'Too many requests',
            'retry_after' => 60,
        ], 429);
    });
});
```

---

## Architectural Decisions

### Why Rate Limiting Depends on Cache
Rate limiting uses the cache system rather than a dedicated rate limiter service because PHP applications lack shared in-memory state. The cache is the closest available shared counter store. Redis provides the atomic operations needed for accurate counting. File and database caches provide best-effort counting but are not atomic.

### Why Key Hashing Is Default
Rate limit keys are hashed by default (`md5` for named limiters) to prevent:
- Cache key length issues (IP + domain + limiter name can be long)
- Information leakage (raw user IDs or IPs in cache keys)
- Cache key collisions with other application cache entries

### Why Limits Are Cache-Based, Not Session-Based
Session-based limiting would tie counters to browser sessions — a user could reset their limit by clearing cookies. Cache-based limiting persists independently of session state.

---

## Tradeoffs

### Named Limiters vs Inline throttle

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Named: Semantic names, plan-aware, per-user keys, stacked limits | More code, must register in service provider | More flexible but requires more setup |
| Inline: Simple, no registration needed | No differentiation per user/plan, per-route only | Single limit for all requests to a route |

### Per-User vs Per-IP Keying

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Per-user: Fair, unaffected by shared IPs (NAT, VPN) | Requires authenticated user | Unauthenticated endpoints cannot use per-user |
| Per-IP: Works for all requests | Inaccurate for shared IPs (office, school, cafe) | One user's heavy usage blocks all users on that IP |

### Redis vs File Cache

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Redis: Atomic counters, multi-server consistent | Additional infrastructure (Redis server) | Required for any load-balanced production deployment |
| File: No additional infrastructure | Non-atomic, per-server counters | Effective limit = max_attempts × server count |

---

## Performance Considerations

### Cache Read/Write per Request
Each rate-limited request performs one cache read (check count) and one cache write (increment count). For Redis, this is ~1-2ms per request. For file cache, this is ~5-10ms plus filesystem I/O.

### Multiple Limits per Request
Stacked limits multiply the cache operations. Two limits = 2 reads + 2 writes per request. For routes with 3+ stacked limits, the cache overhead becomes significant.

### Redis Optimization
`ThrottleRequestsWithRedis` uses a Lua script for atomic check-and-increment, reducing round trips. The standard `ThrottleRequests` middleware performs separate read, check, and write operations.

### Cache Expiry Overhead
The rate limit counter is stored in the cache with a TTL matching the decay window. Expired counters are automatically evicted by the cache system.

---

## Production Considerations

### Shared Cache Requirement
Rate limiting behind a load balancer REQUIRES a shared cache (Redis, Memcached, or database). File cache on each server creates independent counters. Verify cache driver is shared in production:
```bash
# Check cache config
php artisan tinker
> config('cache.default')
```

### Monitoring Rate Limit Violations
Log 429 responses and track them separately from 4xx errors. A sudden spike in 429s may indicate:
- A bug in a client's polling logic
- An attack on your API
- A legitimate user hitting limits (may need plan upgrade)
- Misconfigured rate limits

### Graceful Degradation
If the cache (Redis) is down, rate limiting fails. The default behavior depends on the driver:
- Redis: connection exception may be caught or propagated
- File: no degradation (file cache is local)
- Database: slower but functional

### Rate Limit Header Standardization
Ensure `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` headers are properly formatted. API clients depend on these for programmatic throttling.

---

## Common Mistakes

### File Cache Rate Limiting in Production
Why it happens: Default cache driver is `file`. Why it's harmful: Each server maintains its own counter. With 3 servers and `throttle:60,1`, the effective limit is 180 requests per minute. Better approach: Use Redis cache driver for rate limiting in production.

### IP-Based Limiting for Authenticated Users
Why it happens: Simplest key — `$request->ip()`. Why it's harmful: Users in an office share one IP. If one user downloads a large report, all users in the office hit the rate limit. Better approach: Key on `$request->user()?->id` for authenticated endpoints.

### Not Separating Read and Write Limits
Why it happens: A single `throttle:60,1` for all routes. Why it's harmful: A read-heavy endpoint and a write-heavy endpoint share the same counter. A burst of reads blocks writes. Better approach: Define separate named limiters for read vs write operations.

### Using Rates That Are Too High or Too Low
Why it happens: Choosing limits without data. Why it's harmful: Too high — no protection against abuse. Too low — blocking legitimate users. Better approach: Analyze production traffic to determine P99 request frequency per user, then set limits at 2-3x that value.

### Not Limiting Expensive Endpoints
Why it happens: Only limiting login/auth endpoints. Why it's harmful: Expensive endpoints (reports, exports, AI generation) cost real money per request. An unbounded expensive endpoint can bankrupt your infrastructure budget. Better approach: Apply tighter limits to expensive endpoints regardless of auth type.

---

## Failure Modes

### Redis Connection Failure
If the Redis server is unavailable, rate limiting fails. With `ThrottleRequests`, the cache methods throw exceptions. The application may return 500 errors on rate-limited routes. Mitigation: Configure Redis with timeout and retry settings. Consider a fallback cache driver.

### Cache Key Collision
Two `Limit` objects with the same key share a counter unintentionally. Example: two different named limiters both using `by($request->ip())` without prefixing the key differently. The counters collide and one limiter's usage affects the other.

### Clock Drift
If the application server and cache server have different system clocks, TTL calculations for rate limit windows become inaccurate. The limit may reset too early (allow more requests than intended) or too late (block fewer requests than capacity). Mitigation: NTP synchronization on all servers.

### Counter Overflow
The rate limit counter is a signed integer. In theory, counter overflow is possible under very high request volume. In practice, the TTL on the cache entry limits the maximum counter value to `max_attempts`, preventing overflow.

---

## Ecosystem Usage

### Laravel Framework
Laravel applies default rate limiting to the `api` middleware stack. The default limit is 60 requests per minute per authenticated user or unauthenticated IP.

### Horizon
Horizon uses rate limiting internally for job dispatching. The rate limiter prevents too many jobs from being dispatched to a single queue worker.

### Cashier
Cashier applies rate limiting to webhook endpoints and Stripe API calls to stay within Stripe's API rate limits.

### Community Packages
API packages (Laravel API tools, RESTful API packages) use named rate limiters for endpoint categorization and plan-based rate limiting.

---

## Related Knowledge Units

### Prerequisites
- Service Container Basics — RateLimiter facade registration
- Configuration Management — Cache driver selection for rate limiting

### Related Topics
- Route Groups — Applying throttle middleware to route groups
- Middleware System — Custom middleware for rate limit headers

### Advanced Follow-up Topics
- Cache Systems — Redis atomic operations for rate limiting
- API Versioning — Plan-based rate limiting across API versions

---

## Research Notes

### Source Analysis
- `Illuminate\Routing\Middleware\ThrottleRequests.php` — Inline and named limiter support
- `Illuminate\Routing\Middleware\ThrottleRequestsWithRedis.php` — Redis-optimized variant
- `Illuminate\Cache\RateLimiter.php` — Core counter management
- `Illuminate\Cache\RateLimiting\Limit.php` — Limit configuration
- `Illuminate\Cache\RateLimiting\Unlimited.php` — Unlimited sentinel
- `Illuminate\Cache\RateLimiting\GlobalLimit.php` — Global (non-keyed) limit

### Key Insight
The cache driver requirement is the most important production consideration for rate limiting. File cache is the default Laravel cache driver, and it silently creates per-server counters in multi-server deployments. This is a common production incident: developers test rate limiting locally (single server, works fine), deploy to a load-balanced environment (3+ servers, limit effectively tripled), and discover the issue only when traffic exceeds expected levels.

### Version-Specific Notes
- Named rate limiters are stable across Laravel 8-13
- `ThrottleRequestsWithRedis` is available in all versions but only used when `CACHE_STORE=redis`
- `Limit::perSecond()` added in Laravel 10
- Stacked limits are stable across all versions
