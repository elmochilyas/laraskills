# Skill: Test Rate Limiting with Three-Phase Pattern

## Purpose
Write rate limit tests covering the three-phase pattern (within limit → exceed → after decay), key isolation, and named limiter configuration using time manipulation.

## When To Use
- Every rate-limited endpoint (login, register, API routes)
- When rate limits vary by user plan or tenant
- Testing that rate limits reset correctly after their window
- Testing key isolation (different users don't share limits)

## When NOT To Use
- Endpoints without rate limiting
- Testing the cache driver behind the rate limiter (test separately)
- Testing rate limit key collision unless explicitly designed

## Prerequisites
- Named rate limiters defined via `RateLimiter::for()` in service providers
- `ThrottleRequests` middleware applied to routes
- `CACHE_STORE=array` in testing environment

## Inputs
- Named limiter configuration (limit per minute, decay time)
- Rate-limited routes
- User factories for key isolation tests

## Workflow
1. Verify `CACHE_STORE=array` is configured in the testing environment — prevents rate limit state contamination
2. Ensure limiters are defined as named limiters via `RateLimiter::for('api', fn () => Limit::perMinute(60))` — not inline `throttle:60,1`
3. Write three-phase tests: within limit succeeds (200), exceed limit returns 429 with `Retry-After` header, after `travel(decay + 1)->seconds()` succeeds again (200)
4. Test key isolation: User A exhausts their limit (gets 429); User B on same endpoint still succeeds (200)
5. Use `travel()->seconds()` for time advancement — never `sleep()` or real waits
6. Reset time in teardown with `afterEach(fn () => travelBack())` or `Carbon::setTestNow(null)`
7. Verify `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` response headers

## Validation Checklist
- [ ] `array` cache driver used in testing environment
- [ ] Three-phase pattern: within limit, exceed, after decay
- [ ] Key isolation tested (different users have independent limits)
- [ ] `X-RateLimit-*` headers verified
- [ ] Named limiters used (not inline limits)
- [ ] `travel()` used for time manipulation (no `sleep()`)
- [ ] Time reset in teardown (`travelBack()`)

## Common Failures
- Using real time waits (`sleep()`) — tests take seconds to minutes
- Not resetting test time — time bleeds into subsequent tests
- No decay reset test — limits never reset, users permanently blocked
- Single-key testing only — key collision bugs between users go undetected
- Using `file` cache — rate limit state leaks across parallel test processes

## Decision Points
- Named limiters (`RateLimiter::for()`) for testability vs inline limits (`throttle:60,1`) — always use named
- `travel()` for time advancement vs `Carbon::setTestNow()` — `travel()` is more readable
- Global rate limits (one key for all) vs per-user rate limits (keyed by user ID)

## Performance Considerations
- Rate limiter cache check with `array` driver: <1ms per request
- Sequential burst testing: 60 requests at ~30ms each = ~1.8s
- Time manipulation has zero performance cost
- `file` cache is 2-3x slower than `array`; avoid in testing

## Security Considerations
- Rate limiting is critical DoS protection — untested limits mean abuse vulnerability
- Login rate limiting: test lockout after N failed attempts and reset after lockout period
- Test that 429 responses don't reveal rate limit thresholds
- Multi-tenant rate limits: test Tenant A cannot exhaust Tenant B's limit

## Related Rules (from 05-rules.md)
- Rule 1: Use three-phase pattern: within limit → exceed limit → after decay
- Rule 2: Use time manipulation, never `sleep()` or real waits
- Rule 3: Test key isolation — different users must have independent counters
- Rule 4: Use `array` cache driver for rate limit tests
- Rule 5: Always reset test time in teardown
- Rule 6: Use named rate limiters (not inline limits) for testability

## Success Criteria
- All three phases tested: within limit succeeds, exceed returns 429, after decay succeeds
- Key isolation verified: one user's exhaustion doesn't block others
- `X-RateLimit-*` headers present and correct
- Tests complete in milliseconds (no real waits)
