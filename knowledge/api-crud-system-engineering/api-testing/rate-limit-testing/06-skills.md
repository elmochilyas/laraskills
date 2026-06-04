# Skill: Test Rate Limits

## Purpose
Write feature tests verifying API rate limiting — exhausting throttle limits, asserting 429 with Retry-After and X-RateLimit-* headers, isolating tests in dedicated classes, using low test limits, persistent cache drivers, and testing authenticated vs unauthenticated limits separately.

## When To Use
- Every endpoint with rate limiting configured
- Endpoints with per-user or per-IP throttle limits
- API documentation claiming specific rate limits

## When NOT To Use
- Performance/stress testing (dedicated load testing tools)
- Endpoints without rate limiting
- General response header testing

## Prerequisites
- Laravel Throttle Middleware
- Cache Drivers (file, redis, array)
- Understanding of rate limit configuration

## Inputs
- Rate limit configuration (global, per-endpoint, per-user)
- Cache driver configuration for test environment
- Test endpoints with throttle middleware

## Workflow
1. Isolate rate limit tests in a dedicated test class — never mix with happy-path tests
2. Configure low test limits (`throttle:5,1`) to minimize request count — test a limit of 5, not 60
3. Use persistent cache driver (`file` or `redis`) — `array` driver resets between requests making exhaustion impossible
4. Call `Cache::flush()` in `setUp()` or `beforeEach()` to prevent state bleed between tests
5. Exhaust limit: send `limit + 1` requests in a loop, assert last returns 429
6. Assert rate limit headers on 429: `X-RateLimit-Limit`, `X-RateLimit-Remaining: 0`, `Retry-After`
7. Test authenticated (per-user) and unauthenticated (per-IP) limits separately

## Validation Checklist
- [ ] Rate limit tests isolated in dedicated test class
- [ ] Low test limits used to minimize request count
- [ ] Persistent cache driver configured (`file` or `redis`)
- [ ] `Cache::flush()` in `setUp()` or `beforeEach()`
- [ ] Exhaustion test: `limit + 1` requests, last returns 429
- [ ] Rate limit headers asserted on 429
- [ ] Authenticated and unauthenticated limits tested separately
- [ ] `withoutMiddleware(ThrottleRequests::class)` used for non-rate-limit tests

## Common Failures
- Using `array` cache driver — rate limit state resets between requests, making exhaustion impossible
- Not flushing cache between tests — rate limit state bleeds, causing unpredictable failures
- Testing rate limits in same class as happy-path tests — `setUp()` may apply `withoutMiddleware`
- Testing production-level limits (60+ requests per test) instead of low test limits
- Setting `throttle:0,1` — middleware treats 0 as unlimited in some Laravel versions

## Decision Points
- Test limit value: low enough to minimize requests, high enough to verify mechanism works (5-10 is typical)
- Cache driver: `file` for simplicity, `redis` for CI consistency
- Header assertion scope: all headers vs subset (always assert Retry-After and X-RateLimit-Remaining)

## Performance Considerations
- Rate limit tests are slow — they send `limit + 1` sequential requests
- Use low limits (`throttle:5,1`) to reduce requests per test
- Isolate in dedicated class so they don't slow main suite

## Security Considerations
- 429 error responses must not expose internal details (cache keys, user IPs)
- Ensure rate limits apply to unauthenticated endpoints to prevent IP-based DoS attacks
- `Retry-After` header enables client-side exponential backoff — verify it's present and accurate

## Related Rules
- Isolate Rate Limit Tests In Dedicated Classes
- Use Low Test Limits To Minimize Requests
- Assert Rate Limit Headers On Every Response
- Use Persistent Cache Driver
- Test Authenticated And Unauthenticated Limits Separately
- Flush Cache Between Test Classes

## Related Skills
- Test Response Headers
- Test Response Status Codes
- Test Error Response Shape

## Success Criteria
- Every rate-limited endpoint has exhaustion test
- 429 returned with correct headers after limit exceeded
- Authenticated and unauthenticated limits tested independently
- Tests use low limits and persistent cache
- No state bleed between tests (cache flushed)
- Non-rate-limit tests use `withoutMiddleware` to avoid false 429s
