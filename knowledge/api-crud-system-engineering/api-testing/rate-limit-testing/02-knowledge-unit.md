# Rate Limit Testing

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Testing
- **Knowledge Unit:** Rate Limit Testing
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary
Rate limit tests verify that API endpoints correctly enforce throttle limits — returning 429 Too Many Requests after exceeding the allowed number of requests within a time window. Tests cover global rate limits, per-endpoint limits, per-user limits, and authenticated vs unauthenticated limits. Laravel's `throttle` middleware (`Illuminate\Routing\Middleware\ThrottleRequests`) is the enforcement mechanism. Tests assert `assertStatus(429)`, `assertHeader('X-RateLimit-Remaining', 0)`, `assertHeader('X-RateLimit-Limit')`, and `assertHeader('Retry-After')`. Rate limit testing ensures the API's availability guarantees are maintained.

---

## Core Concepts
Laravel's `throttle:60,1` middleware allows 60 requests per minute. The `ThrottleRequests` middleware uses the cache (default `file` or `redis`) to track request counts per key (typically user ID or IP). After the limit is exceeded, a 429 response is returned with `Retry-After` (seconds until reset) and `X-RateLimit-*` headers. Named rate limiters defined in `App\Http\Kernel` or `App\Providers\RouteServiceProvider` can be applied to route groups. Tests must exhaust the rate limit by sending N+1 requests and asserting the last gets 429. The cache driver must persist between requests in the same test — `array` cache driver does not persist across requests, so tests should use `file` or `redis` cache (or `Cache::shouldReceive` to bypass).

---

## Mental Models
Rate limit testing is **testing the bouncer's patience** — the bouncer allows exactly N people into the club per hour. You send N guests (requests), the first N-1 enter (2xx), the Nth enters (2xx or 4xx depending on inclusive limit), and the N+1th is turned away with "come back later" (429). The bouncer also stamps each accepted guest (rate limit headers).

---

## Internal Mechanics
`ThrottleRequests::handle()` calls `$this->limiter->hit($key, $decaySeconds)`, which increments a cache counter. If the counter exceeds `$maxAttempts`, `ThrottleRequestsException` is thrown, converted to a 429 response. The cache stores a `{key}:timer` entry for TTL and a `{key}` entry for attempt count. `X-RateLimit-Limit` = max attempts, `X-RateLimit-Remaining` = max - current, `Retry-After` = seconds until expiry. In tests, cache isolation is the main challenge: the `array` driver resets on each request (since each request creates a new Laravel instance in `$this->get()`), so `file` or `redis` cache must be configured for testing.

---

## Patterns
- **Use `$this->withoutMiddleware(ThrottleRequests::class)` for non-rate-limit tests** to avoid accidental 429s.
- **Explicit rate limit exhaustion test**: Send `limit + 1` requests in a loop, assert last returns 429.
- **Assert rate limit headers on successful requests**: `$response->assertHeader('X-RateLimit-Remaining', '59')`.
- **Assert Retry-After header on 429**: `$response->assertHeader('Retry-After')` and verify it's a positive integer.
- **Test authenticated vs unauthenticated limits separately**: Different limit configurations apply to different user states.
- **Use `Cache::driver('file')->flush()` in `setUp()`** to reset rate limit state between tests.

---

## Architectural Decisions
Rate limit testing is inherently stateful — the test must exhaust a limit, and the cache must persist across test requests. This makes rate limit tests more complex than standard feature tests. The architectural decision is to isolate rate limit tests into a dedicated test class (not mixed with happy-path tests) and to use a dedicated cache driver for rate limiting that can be flushed between test classes.

---

## Tradeoffs
| Tradeoff | File Cache for Tests | Redis Cache for Tests |
|---|---|---|
| Setup complexity | Low (no external service) | Higher (Redis must be running) |
| Test speed | Moderate (file I/O) | Fast (in-memory) |
| Isolation | Manual flush needed | Manual flush needed |
| Production fidelity | Low (file != Redis) | High (same driver as production) |

---

## Performance Considerations
Rate limit tests are slow by nature — they must send multiple sequential requests (limit + 1) to exhaust the throttle. For a limit of 60/minute, a single test sends 61 requests. Mitigate by testing with a low limit configuration (`throttle:5,1`). Use `Cache::flush()` between tests to avoid spillover. Dedicate a separate test class for rate limits so they don't slow down the main test suite.

---

## Production Considerations
Rate limit configuration must be consistent with API documentation — documented limits and actual limits must match. Test that limit exceeded error responses don't expose internal details (cache keys, user IPs). Monitor 429 rates in production — high rates indicate abusive clients or misconfigured limits. The `Retry-After` header enables clients to implement exponential backoff — verify it's present and accurate.

---

## Common Mistakes
- Using `array` cache driver — rate limit state resets between test requests, making exhaustion impossible.
- Not flushing cache between tests — rate limit state from one test bleeds into the next, causing unpredictable failures.
- Testing rate limits in the same class as happy-path tests — `setUp()` may apply `withoutMiddleware` and accidentally skip rate limit middleware.
- Setting `throttle:0,1` (zero limit) — middleware treats 0 as unlimited in some Laravel versions.

---

## Failure Modes
- **Cache driver isolation failure**: Rate limit state persists across tests, causing false 429s.
- **Wrong limit key**: Authed and unauthed requests hit different keys — test exhausts for one user but the endpoint checks another.
- **Distributed cache inconsistency**: In multi-server deployments, the cache may not be shared — rate limit may not apply globally.
- **Throttle middleware bypass**: A middleware ordering issue causes throttle to run after the controller, not before — requests are never limited.

---

## Ecosystem Usage
Laravel Forge and Vapor use rate limiting for API gateway protection. Spatie's `laravel-rate-limited-middleware` provides named rate limiters. Laravel's `throttle` middleware is the standard for first-party apps. API gateway services (Kong, AWS API Gateway) provide external rate limiting that can complement Laravel's internal limits.

---

## Related Knowledge Units
### Prerequisites
- Laravel Throttle Middleware (configuration, named limiters)
- Cache Drivers (file, redis, array)

### Related Topics
- response-header-testing (X-RateLimit, Retry-After headers)
- response-status-code-testing (429 status code)
- error-response-shape-testing (429 error shape)

### Advanced Follow-up Topics
- Distributed rate limiting (Redis + Lua scripting)
- Dynamic rate limits (per-user tiers)
- Rate limit header standardization (IETF draft)

---

## Research Notes
### Source Analysis
`Illuminate\Routing\Middleware\ThrottleRequests` extends `Illuminate\Cache\RateLimiter`. The `ThrottleRequestsException` is at `Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException`.
### Key Insight
Rate limit testing is the only test type that requires explicit state accumulation across requests within a single test — it tests the cache layer as much as the middleware.
### Version-Specific Notes
Laravel 11 uses `RateLimiter` facade for named rate limiters defined in `App\Providers\RouteServiceProvider`. The `throttle` middleware API key parameter (`throttle:api`) was simplified in Laravel 11. The `X-RateLimit-*` header format has remained stable since Laravel 5.5.
