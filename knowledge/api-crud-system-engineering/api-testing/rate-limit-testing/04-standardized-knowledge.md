# ECC Standardized Knowledge — Rate Limit Testing

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | Rate Limit Testing |
| Difficulty | Advanced |
| Category | Testing |
| Last Updated | 2026-06-02 |

## Overview

Rate limit tests verify that API endpoints correctly enforce throttle limits — returning 429 Too Many Requests after exceeding the allowed number of requests within a time window. Tests cover global rate limits, per-endpoint limits, per-user limits, and authenticated vs unauthenticated limits. Laravel's `throttle` middleware (`Illuminate\Routing\Middleware\ThrottleRequests`) is the enforcement mechanism. Tests assert `assertStatus(429)`, `assertHeader('X-RateLimit-Remaining', 0)`, `assertHeader('X-RateLimit-Limit')`, and `assertHeader('Retry-After')`. Rate limit testing ensures the API's availability guarantees are maintained.

## Core Concepts

- **`throttle:60,1` middleware**: 60 requests per minute
- **Exhaustion test**: Send N+1 requests, assert last returns 429
- **Rate limit headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`
- **Cache driver requirement**: Rate limit state must persist across test requests — `array` driver does NOT work
- **Named rate limiters**: Defined in `App\Http\Kernel` or `App\Providers\RouteServiceProvider`
- **`withoutMiddleware`**: Bypass throttle for non-rate-limit tests

## When To Use

- Every endpoint with rate limiting configured
- Endpoints with per-user or per-IP throttle limits
- API documentation claiming specific rate limits
- Post-deployment verification of rate limit configuration

## When NOT To Use

- Performance/stress testing (dedicated load testing tools)
- Endpoints without rate limiting
- General response header testing (covered by response-header-testing)

## Best Practices

- **Use `$this->withoutMiddleware(ThrottleRequests::class)` for non-rate-limit tests** to avoid accidental 429s.
- **Explicit exhaustion test**: Send `limit + 1` requests in a loop, assert last returns 429.
- **Assert rate limit headers on successful requests**: `$response->assertHeader('X-RateLimit-Remaining', '59')`.
- **Assert Retry-After header on 429**: `$response->assertHeader('Retry-After')` — verify positive integer.
- **Test authenticated vs unauthenticated limits separately**: Different limits per user state.
- **Use `Cache::driver('file')->flush()` in `setUp()`** to reset rate limit state between tests.

## Architecture Guidelines

- Rate limit testing is inherently stateful — the test must exhaust a limit, and the cache must persist.
- Isolate rate limit tests into dedicated test classes (not mixed with happy-path tests).
- Use a dedicated cache driver for rate limiting that can be flushed between test classes.
- Test with a low limit configuration (`throttle:5,1`) to minimize requests per test.

## Performance Considerations

- Rate limit tests are slow — they send `limit + 1` sequential requests.
- For a limit of 60/minute, a single test sends 61 requests.
- Mitigate by testing with a low limit configuration (`throttle:5,1`).
- Use `Cache::flush()` between tests to avoid spillover.
- Dedicate a separate test class for rate limits so they don't slow down the main suite.

## Security Considerations

- Test that 429 error responses don't expose internal details (cache keys, user IPs).
- Monitor 429 rates in production — high rates indicate abusive clients or misconfigured limits.
- Ensure rate limits apply to unauthenticated endpoints to prevent IP-based DoS attacks.
- `Retry-After` header enables client-side exponential backoff — verify it's present and accurate.

## Common Mistakes

- Using `array` cache driver — rate limit state resets between test requests, making exhaustion impossible.
- Not flushing cache between tests — rate limit state from one test bleeds into the next, causing unpredictable failures.
- Testing rate limits in the same class as happy-path tests — `setUp()` may apply `withoutMiddleware`.
- Setting `throttle:0,1` (zero limit) — middleware treats 0 as unlimited in some Laravel versions.

## Anti-Patterns

- **Testing production-level limits**: Sending 1000+ requests in a test to verify a 1000/min limit — use lower test limits.
- **No dedicated rate limit test class**: Mixing exhaustion tests with happy-path tests — accidental `withoutMiddleware` breakage.
- **Ignoring cache driver differences**: Tests pass with `file` cache but fail with `redis` in CI.

## Examples

```php
it('returns 429 after exceeding rate limit', function () {
    $limit = 5;
    for ($i = 0; $i < $limit; $i++) {
        $response = $this->getJson('/api/posts');
        $response->assertStatus(200);
    }

    // The limit+1 request should be throttled
    $response = $this->getJson('/api/posts');
    $response->assertStatus(429);
    $response->assertHeader('Retry-After');
    $response->assertHeader('X-RateLimit-Remaining', '0');
});
```

## Related Topics

- **Prerequisites**: Laravel Throttle Middleware, Cache Drivers (file, redis, array)
- **Siblings**: response-header-testing, response-status-code-testing, error-response-shape-testing
- **Advanced**: Distributed rate limiting, Dynamic per-user rate limits, Rate limit header standardization (IETF draft)

## AI Agent Notes

- Rate limit testing is the only test type that requires explicit state accumulation across requests within a single test — it tests the cache layer as much as the middleware.
- Laravel 11 uses `RateLimiter` facade for named rate limiters defined in `App\Providers\RouteServiceProvider`.
- The `X-RateLimit-*` header format has remained stable since Laravel 5.5.

## Verification

- [ ] Each rate-limited endpoint has an exhaustion test
- [ ] Rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`) are verified
- [ ] Authenticated and unauthenticated limits are tested separately
- [ ] Cache driver is properly configured for test persistence
- [ ] Rate limit tests are isolated in a dedicated test class
- [ ] Low test limits are used to minimize request count
