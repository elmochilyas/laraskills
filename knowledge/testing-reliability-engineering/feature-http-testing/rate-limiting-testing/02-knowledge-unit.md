# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Feature & HTTP Testing
Knowledge Unit: Rate Limiting Testing
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Rate limiting testing verifies that API endpoints and web routes correctly enforce rate limits—rejecting excess requests and allowing resets. Laravel's `RateLimiter` facade and middleware-based rate limiting require testing for correctness, configuration, and edge cases (burst handling, decay timing, multi-tenant isolation). Rate limiting is a critical security and reliability boundary; untested rate limits can lead to abuse, DoS vulnerability, or legitimate user blocking.

# Core Concepts
- **`RateLimiter::for()`**: Defines named rate limiters in `App\Providers\AppServiceProvider` or route service provider.
- **`ThrottleRequests` middleware**: Applied to routes or groups. Uses `RateLimiter` behind the scenes.
- **`limiter` name**: `Route::middleware('throttle:api')` references a named limiter. Test that the correct limiter is applied.
- **Attempt counting**: `RateLimiter::hit('key')` increments attempts. `RateLimiter::attempts('key')` reads count.
- **Decay time**: The window within which attempts are counted. Test that limits reset after the decay window.
- **`X-RateLimit-*` headers**: Responses from rate-limited endpoints include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` headers.
- **`tooManyAttempts()`**: `RateLimiter::tooManyAttempts('key')` returns true when limit exceeded. Test the threshold.

# Mental Models
- **Rate limiter as sliding window counter**: Tracks attempts per key per window. When limit exceeded, subsequent requests are rejected with 429.
- **Key as rate limit identity**: The key identifies who/what is being rate limited (user ID, IP, API key). Key collision = shared limit.
- **Two-phase test**: First phase: requests within limit succeed. Second phase: requests beyond limit are rejected. Third phase (optional): after decay, requests succeed again.
- **Testing time sensitivity**: Rate limiting is time-dependent. Use time manipulation (`Carbon::setTestNow`, `travel`) to control the decay window in tests.

# Internal Mechanics
- **`ThrottleRequests` middleware**: Checks `RateLimiter::tooManyAttempts($key, $maxAttempts)`. If true, returns `429 Too Many Requests` response with `Retry-After` header.
- **`RateLimiter::hit($key, $decaySeconds)`**: Increments cache counter with TTL of decay seconds. Cache store must support TTL (array driver works).
- **Cache store**: Rate limiter uses the default cache store. For testing, use `array` cache driver (fast, no persistence). Test that limit resets after TTL.
- **`X-RateLimit-Remaining` calculation**: `maxAttempts - currentAttempts`. Header is set by `ThrottleRequests` middleware.
- **Named limiters**: `RateLimiter::for('api', fn ($job) => Limit::perMinute(60))`. The `throttle:api` middleware resolves the named limiter.
- **`Limit` class**: Supports `perMinute()`, `perSecond()`, `perHour()`, `perDay()`, and dynamic limits with `by()` for key customization.

# Patterns
- **Pattern: Burst limit testing**
  - Purpose: Test that burst of requests within limit succeed
  - Benefits: Verifies normal operation throughput
  - Tradeoffs: Many sequential requests = slower test
  - Implementation: Send `maxAttempts` requests in sequence; all should succeed with `200`

- **Pattern: Exceeding limit testing**
  - Purpose: Test that exceeding limit returns 429
  - Benefits: Verifies rate limit enforcement
  - Tradeoffs: Must send exactly `maxAttempts + 1` requests
  - Implementation: Send `maxAttempts + 1` requests; last returns `assertStatus(429)` with `Retry-After` header

- **Pattern: Limit reset after decay**
  - Purpose: Test that rate limit resets after the decay window
  - Benefits: Verifies legitimate users can retry after wait
  - Tradeoffs: Requires time manipulation to avoid real waiting
  - Implementation: Exceed limit ? `travel($decaySeconds + 1)->seconds()` ? next request succeeds

- **Pattern: Key-based isolation testing**
  - Purpose: Test that different rate limit keys (different users/IPs) have independent counters
  - Benefits: Verifies multi-tenant isolation
  - Tradeoffs: Need distinct key scenarios
  - Implementation: User A hits limit ? User B requests should succeed (different key)

# Architectural Decisions
- **Cache driver for rate limiting tests**: Always use `array` or `database` cache in testing. `file` cache may persist across test processes in parallel mode.
- **Time manipulation for decay testing**: Use `Carbon::setTestNow()` or `travel()->seconds()` to control time. Real waiting is never acceptable in tests.
- **Named limiters vs inline limits**: Prefer named limiters for testability (can reference by name in tests). Inline limits in route definitions are harder to test.
- **Global vs endpoint-specific limits**: Test global limits (login, register) and endpoint-specific limits separately. They have different keys and limits.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Time manipulation makes decay testing fast | Must ensure time is reset after test | `travelBack()` or `Carbon::setTestNow(null)` in teardown |
| Named limiters are testable by name | More boilerplate to define limiters | Worth it for explicit test references |
| Burst testing is deterministic | Sends N requests per test | N is usually small (60-100); acceptable |
| Key isolation tests catch multi-tenant bugs | Need clear key strategy | Document key composition in test comments |

# Performance Considerations
- Rate limiter cache check: <1ms per request when using `array` cache driver.
- Sequential request testing: 60 requests at ~30ms each = ~1.8 seconds for burst test. Acceptable.
- Time manipulation: No performance cost. Pure PHP time mocking.
- Cache driver impact: Using `file` cache is 2-3x slower than `array`. Use `array` in testing.

# Production Considerations
- **Login rate limiting**: Block after N failed attempts. Test account lockout and reset after lockout period.
- **API key rate limiting**: Test that each API key has its own limit. Test that exceeded keys get 429 with clear error.
- **Multi-tenant rate limits**: Different tenants have different limits. Test tenant-specific limiter keys.
- **Graceful degradation**: When rate limited, response should be informative: retry-after, limit info, and user-friendly message.
- **Rate limiting headers**: Verify `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` headers are present and accurate.

# Common Mistakes
- **Mistake: Testing without time reset**
  - Why: `Carbon::setTestNow()` persists across tests
  - Why harmful: Rate limit decay is based on frozen time; tests pass or fail inconsistently
  - Better: Reset test time in `afterEach()` or `tearDown()`

- **Mistake: Inline rate limiter definitions (not named)**
  - Why: `Route::middleware('throttle:60,1')` in route file
  - Why harmful: Cannot reference the limiter in tests; config is duplicated
  - Better: Define named limiters in `RateLimiter::for()` and reference by name

- **Mistake: Not testing with different keys**
  - Why: Only testing rate limiting for a single user
  - Why harmful: Different users may share a rate limit bucket (key collision)
  - Better: Test key isolation with different user/IP scenarios

- **Mistake: Using real time waits**
  - Why: `sleep($decaySeconds)` in tests
  - Why harmful: Test takes seconds to minutes; CI pipelines slow down
  - Better: Use `Carbon::setTestNow()` or `travel()` to advance time instantly

# Failure Modes
- **Cache driver inconsistencies**: `array` driver in testing, `redis` in production. Redis may have eviction policies that affect rate limit keys. Test with production cache driver in CI.
- **Rate limit key collision**: Two different rate limiters using the same key. Requests to one affect the other. Use unique key prefixes per limiter.
- **Clock drift on cache TTL**: Cache TTL starts when `hit()` is called, not on first `attempt()`. First request within a decaying window may succeed even if previous window is still active.
- **Distributed rate limiting**: Multiple web servers with file cache don't share rate limit state. Use Redis/memcached for distributed rate limiting. Test with shared cache.

# Ecosystem Usage
- **Laravel core**: `RateLimiter` facade is tested with `array` cache driver and time manipulation.
- **Laravel Fortify**: Login rate limiting (5 attempts per minute) is tested via burst + exceed pattern.
- **Laravel Spark**: Subscription-based rate limits (higher limits for paid plans) use named limiters with plan-aware keys.
- **Laravel API packages**: API rate limiting middleware tested with `ThrottleRequests` and custom limit definitions.

# Related Knowledge Units
- **Prerequisites**: HTTP test helpers, Time manipulation, Laravel cache system
- **Related Topics**: Authentication testing, Security testing, Middleware testing
- **Advanced Follow-up**: Plan-aware throttling, Distributed rate limiting, Custom rate limiter development

# Research Notes
- Laravel's HTTP test helpers (get(), post(), put(), delete()) provide a full-stack testing experience without starting a web server — requests flow through the kernel internally
- Response assertions (ssertStatus(), ssertJson(), ssertSee()) are chainable and provide clear failure messages for debugging test failures
- Pest's higher-order expectations (expect()->toBeOk()) provide a more expressive syntax than PHPUnit's $response->assertOk()
- Test datasets (#[DataProvider]) reduce boilerplate when testing multiple input variations for validation and API endpoint testing
- Exception handling testing requires intercepting Laravel's exception handler to assert specific exceptions are thrown with expected messages
