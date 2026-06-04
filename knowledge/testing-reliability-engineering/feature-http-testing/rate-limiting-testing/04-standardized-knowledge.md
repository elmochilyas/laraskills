# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Feature & HTTP Testing |
| Knowledge Unit | Rate Limiting Testing |
| Difficulty | Intermediate |
| Maturity | Stable |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | HTTP test helpers, Time manipulation, Laravel cache system |
| Related KUs | Authentication testing, Security testing, Middleware testing |
| Source | domain-analysis.md K025 |

# Overview

Rate limiting testing verifies that API endpoints and web routes correctly enforce rate limits — rejecting excess requests and allowing resets. Laravel's `RateLimiter` facade and middleware-based rate limiting require testing for correctness, configuration, and edge cases (burst handling, decay timing, multi-tenant isolation). Rate limiting is a critical security and reliability boundary; untested rate limits can lead to abuse, DoS vulnerability, or legitimate user blocking.

# Core Concepts

- **`RateLimiter::for()`**: Defines named rate limiters in service providers.
- **`ThrottleRequests` middleware**: Applied to routes or groups. Uses `RateLimiter` behind the scenes.
- **`limiter` name**: `Route::middleware('throttle:api')` references a named limiter.
- **Attempt counting**: `RateLimiter::hit('key')` increments attempts. `RateLimiter::attempts('key')` reads count.
- **Decay time**: The window within which attempts are counted. Test that limits reset after the decay window.
- **`X-RateLimit-*` headers**: Responses include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After`.
- **`tooManyAttempts()`**: `RateLimiter::tooManyAttempts('key')` returns true when limit exceeded.

# When To Use

- For every rate-limited endpoint (login, register, API routes)
- When rate limits vary by user plan or tenant
- For testing that rate limits reset correctly after their window
- For testing key isolation (different users/IPs don't share limits)
- For testing `X-RateLimit-*` response headers

# When NOT To Use

- For endpoints without rate limiting (no `throttle` middleware)
- When the rate limiter configuration is trivial (global defaults only)
- For testing the cache driver behind the rate limiter (test separately)
- For testing rate limit key collision unless explicitly designed

# Best Practices (WHY)

- **Always use `array` cache driver for rate limit tests**: `file` cache may persist across test processes in parallel mode. `array` is fast and isolated. Test with production cache driver in CI separately.
- **Use time manipulation, never `sleep()`**: Real waiting makes tests slow and unreliable. `Carbon::setTestNow()` or `travel()->seconds()` advances time instantly.
- **Test three phases**: Within limit → succeed. Exceed limit → 429. After decay → succeed again. Missing the decay reset test means you don't verify limits recover.
- **Test key isolation**: Different users should have independent rate limit counters. User A exhausting their limit should not affect User B.
- **Use named limiters, not inline limits**: `RateLimiter::for('api', ...)` is testable by name. Inline limits like `throttle:60,1` in route definitions are harder to verify.

# Architecture Guidelines

- **Cache driver**: Use `array` in testing for speed and isolation. Redis/memcached in production.
- **Time manipulation**: `travel($decaySeconds + 1)->seconds()` after exceeding the limit. Always reset time in `afterEach()` or `tearDown()`.
- **Named limiters**: Define in `App\Providers\AppServiceProvider` or `RouteServiceProvider`. Reference by name in middleware and tests.
- **Global vs endpoint-specific limits**: Test separately. They have different keys and limits.

# Performance Considerations

- Rate limiter cache check: <1ms per request with `array` driver.
- Sequential request testing: 60 requests at ~30ms each = ~1.8s for burst test.
- Time manipulation: No performance cost. Pure PHP time mocking.
- Always use `array` cache driver; `file` is 2-3x slower.

# Security Considerations

- Rate limiting is a critical DoS protection boundary. Untested rate limits mean abuse vulnerability.
- Login rate limiting: Block after N failed attempts. Test lockout and reset after lockout period.
- Test that error responses don't reveal rate limit thresholds (use consistent 429 messages).
- Multi-tenant rate limits: Test that Tenant A cannot exhaust Tenant B's limit.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Testing without time reset | `Carbon::setTestNow()` persists across tests | Rate limit decay tests pass or fail inconsistently | Reset test time in `afterEach()` or `tearDown()` |
| Inline rate limiter definitions (not named) | `Route::middleware('throttle:60,1')` in route file | Cannot reference limiter in tests; config duplicated | Define named limiters in `RateLimiter::for()` |
| Not testing with different keys | Only testing rate limiting for a single user | Different users may share a rate limit bucket | Test key isolation with different user/IP scenarios |
| Using real time waits | `sleep($decaySeconds)` in tests | Tests take seconds to minutes | Use `Carbon::setTestNow()` or `travel()` |

# Anti-Patterns

- **Real time waits**: Using `sleep()` instead of time manipulation. Tests become slow and flaky.
- **No decay reset test**: Only testing burst and exceed, not verifying limits reset. Limits that never reset can permanently block users.
- **Single-key testing**: Only testing with one key (user/IP). Key collision bugs are missed.
- **Using `file` cache driver**: File cache persists across test processes, causing rate limit state contamination in parallel testing.

# Examples

```php
// Burst limit testing
public function test_burst_requests_within_limit_succeed()
{
    $user = User::factory()->create();

    for ($i = 0; $i < 60; $i++) {
        $this->actingAs($user)
            ->getJson('/api/users')
            ->assertOk();
    }
}

// Exceeding limit returns 429
public function test_exceeding_rate_limit_returns_429()
{
    $user = User::factory()->create();

    for ($i = 0; $i < 60; $i++) {
        $this->actingAs($user)->getJson('/api/users');
    }

    $this->actingAs($user)
        ->getJson('/api/users')
        ->assertStatus(429)
        ->assertHeader('Retry-After');
}

// Limit reset after decay
public function test_rate_limit_resets_after_decay()
{
    $user = User::factory()->create();

    for ($i = 0; $i < 61; $i++) {
        $this->actingAs($user)->getJson('/api/users');
    }

    $this->actingAs($user)
        ->getJson('/api/users')
        ->assertStatus(429);

    travel(61)->seconds();

    $this->actingAs($user)
        ->getJson('/api/users')
        ->assertOk();
}

// Key isolation
public function test_different_users_have_independent_limits()
{
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    for ($i = 0; $i < 61; $i++) {
        $this->actingAs($userA)->getJson('/api/users');
    }

    $this->actingAs($userA)
        ->getJson('/api/users')
        ->assertStatus(429);

    $this->actingAs($userB)
        ->getJson('/api/users')
        ->assertOk();
}
```

# Related Topics

- **Prerequisites**: HTTP test helpers, Time manipulation, Laravel cache system
- **Related**: Authentication testing, Security testing, Middleware testing
- **Advanced**: Plan-aware throttling, Distributed rate limiting, Custom rate limiter development

# AI Agent Notes

- Always use `array` cache driver for rate limit tests. Set it in `phpunit.xml` or `config/cache.php` for the `testing` environment.
- The three-phase pattern (within limit → exceed → reset) is the gold standard for rate limit testing. Don't skip the reset phase.
- For time manipulation, use `travel()->seconds()` and always call `travelBack()` in teardown to prevent time bleeding across tests.
- Named limiters are essential for testability. Always define `RateLimiter::for()` entries instead of inline limits.

# Verification

- [ ] `array` cache driver is used in testing environment
- [ ] Three-phase rate limit testing: within limit, exceed, reset
- [ ] Key isolation is tested (different users/IPs have independent limits)
- [ ] `X-RateLimit-*` headers are verified (Limit, Remaining, Retry-After)
- [ ] Named limiters are used (not inline limits)
- [ ] Time manipulation is used instead of real waits
- [ ] Time is properly reset in teardown
- [ ] Rate limit configuration is tested for all rate-limited endpoints
