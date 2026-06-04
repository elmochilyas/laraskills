# Decision Trees — Rate Limiting Testing

## Decision Tree 1: Three-Phase Rate Limit Testing

```
What phase of rate limiting should be tested?
│
├── Phase 1: Requests within the limit
│   └── Test: all requests return 200
│       Create user, send N requests (where N < limit)
│       Each request: `$this->actingAs($user)->getJson('/api/users')->assertOk()`
│
├── Phase 2: Requests exceeding the limit
│   └── Test: next request returns 429 with Retry-After header
│       Continue sending requests past the limit
│       First request past limit: `->assertStatus(429)->assertHeader('Retry-After')`
│
└── Phase 3: Requests after decay window
    └── Test: requests succeed again after decay
        `travel($decaySeconds + 1)->seconds()`
        `$this->actingAs($user)->getJson('/api/users')->assertOk()`
        Always reset time in teardown: `afterEach(fn() => travelBack())`
```

## Decision Tree 2: Cache Driver Selection for Rate Limit Tests

```
Which cache driver should be used for rate limit testing?
│
├── Regular unit/feature tests
│   └── Use `array` driver (CACHE_STORE=array in phpunit.xml)
│       Isolated per-request — no cross-test contamination
│       Fastest option — <1ms per cache check
│       Required for parallel test execution
│
├── Integration tests verifying production-like behavior
│   └── Use the production cache driver (Redis, memcached)
│       Run in a separate integration test suite
│       Verify rate limit behavior with real cache semantics
│
└── NEVER use `file` driver
    File cache persists across test processes
    Causes rate limit state contamination in parallel mode
    Random test failures that are hard to debug
```

## Decision Tree 3: Named Limiter vs Inline Limit

```
How is the rate limiter defined?
│
├── Named limiter: `RateLimiter::for('api', fn() => Limit::perMinute(60))`
│   └── Testable by name:
│       Route: `Route::middleware('throttle:api')`
│       Test: Send 61 requests, verify 429 on the 61st
│       Benefit: can be inspected, mocked, referenced
│
└── Inline limit: `Route::middleware('throttle:60,1')`
    └── Harder to test:
        Configuration embedded in route file
        Cannot reference by name in tests
        Prefer REFACTORING to named limiter for testability
```

## Decision Tree 4: Key Isolation Testing

```
How should rate limit key isolation be tested?
│
├── Per-user rate limit (most common)
│   └── Test: User A exhausts limit → User B still succeeds
│       Create userA and userB
│       userA sends 61 requests → gets 429
│       userB sends 1 request → gets 200
│
├── Per-IP rate limit
│   └── Test: Different IPs have independent limits
│       Use `$this->withHeader('X-Forwarded-For', $ip)` for IP spoofing
│
└── Global rate limit (rare)
    └── Test: All users share the same limit
        User A exhausts limit → User B also gets 429
        Document this design choice explicitly
```
