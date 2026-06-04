# Anti-Patterns — Rate Limit Testing

## Anti-Pattern 1: Mixing Rate Limit Tests With Happy-Path Tests

**Category**: Test organization

**Description**: Writing rate limit exhaustion tests in the same test class as regular feature tests, causing interference from shared setup.

**Warning Signs**:
- The same test class contains both `it('lists posts')` and `it('rate limits after 60 requests')`
- The `setUp()` method uses `withoutMiddleware` or `RefreshDatabase` that interferes with rate limit state
- Rate limit tests fail intermittently depending on test execution order

**Why It's Harmful**: Happy-path tests often disable middleware or refresh the database — both of which break rate limit tests. `withoutMiddleware(ThrottleRequests::class)` in a separate test would bypass the throttle entirely. `RefreshDatabase` may reset the cache depending on the driver.

**Real-World Consequence**: A developer adds `$this->withoutMiddleware()` to the `setUp()` of `PostsTest` to speed up non-rate-limit tests. The rate limit test within the same class now passes because the throttle middleware is disabled. The rate limit is no longer tested.

**Preferred Alternative**: Isolate all rate limit tests in dedicated test classes with their own `setUp()` and cache flush.

**Refactoring Strategy**:
1. Move all rate-limit exhaustion tests to a new class: `PostsRateLimitTest`
2. Ensure the new class has `Cache::flush()` in `setUp()`
3. Keep the original class for non-rate-limit tests only

**Detection Checklist**:
- [ ] Rate limit tests are in dedicated test classes
- [ ] Happy-path tests don't interfere with rate-limit state
- [ ] Each rate-limit test class flushes cache in `setUp()`

**Related Rules**: Isolate Rate Limit Tests In Dedicated Classes
**Related Skills**: Test Rate Limits

---

## Anti-Pattern 2: Testing Production-Level Rate Limits

**Category**: Performance

**Description**: Sending 60, 100, or 1000+ requests in a single test to exhaust a production-level rate limit.

**Warning Signs**:
- Rate limit tests send 60+ requests per test
- Test suite takes minutes due to rate-limit tests
- Developers skip rate-limit tests to save CI time

**Why It's Harmful**: Testing a limit of 60 requests/minute requires 61 sequential requests per scenario. With 3 scenarios (global, auth, unauthenticated), that's 183 requests. This adds significant CI time and discourages thorough rate-limit coverage.

**Real-World Consequence**: A rate limit test for a 1000/min endpoint sends 1001 requests. The test takes 30 seconds. The developer adds only one scenario. The per-user rate limit (different limit) is never tested because it would require another 1001 requests.

**Preferred Alternative**: Configure a low test limit (e.g., `throttle:5,1`) in the test environment and test against that.

**Refactoring Strategy**:
1. Add a test-specific rate limit configuration (e.g., `config('testing.rate_limit', '5,1')`)
2. Update middleware or route config to use the test limit in the testing environment
3. Reduce all exhaustion tests to send only `5 + 1 = 6` requests

**Detection Checklist**:
- [ ] Rate limit tests use low limits (5-10 requests max)
- [ ] No test sends more than 11 requests for rate-limit exhaustion
- [ ] Production-level limits are verified by documentation, not by tests

**Related Rules**: Use Low Test Limits To Minimize Requests
**Related Skills**: Test Rate Limits
**Related Decision Trees**: Tree 1 — Rate Limit Exhaustion Test Approach

---

## Anti-Pattern 3: Using `array` Cache Driver for Rate Limit Tests

**Category**: Testing correctness

**Description**: Running rate limit tests with the `array` cache driver, which resets state between HTTP requests and makes exhaustion impossible.

**Warning Signs**:
- `CACHE_DRIVER=array` in `phpunit.xml` or `.env.testing`
- Rate limit tests always pass (never reach 429) even with many requests
- The exhaustion loop completes without ever being throttled

**Why It's Harmful**: The `array` cache driver resets its entire store between every HTTP request within the same test. The rate limit counter resets to zero on every call. The middleware never sees the accumulated count, so it never returns 429. The test passes but proves nothing.

**Real-World Consequence**: A team's CI has `CACHE_DRIVER=array`. All rate limit tests pass. A production deployment removes the throttle middleware from a critical endpoint. Rate limit tests still pass. The service is overwhelmed by a DoS attack two weeks later.

**Preferred Alternative**: Use `file` or `redis` cache driver for rate limit tests, configured in `phpunit.xml` specifically for the rate-limit test suite.

**Refactoring Strategy**:
1. Set `CACHE_DRIVER=file` in `phpunit.xml` or override cache config in rate-limit test `setUp()`
2. Add `Cache::flush()` in `setUp()` to ensure clean state
3. Remove `array` cache override if it was set globally (rate-limit tests need file/redis)

**Detection Checklist**:
- [ ] Rate limit tests use `file` or `redis` cache driver
- [ ] `array` cache driver is not used for rate limit tests
- [ ] `Cache::flush()` runs before each rate limit test

**Related Rules**: Use Persistent Cache Driver
**Related Skills**: Test Rate Limits
**Related Decision Trees**: Tree 2 — Cache Driver Selection for Rate Limit Tests

---

## Anti-Pattern 4: No Rate Limit Header Assertions

**Category**: Testing completeness

**Description**: Asserting only the 429 status code without verifying rate limit headers.

**Warning Signs**:
- Tests assert `assertStatus(429)` but never `assertHeader('X-RateLimit-Remaining', '0')`
- No test checks `Retry-After` header presence
- Rate limit contract documentation mentions headers but tests don't verify them

**Why It's Harmful**: The 429 status tells the client they're throttled, but the headers provide the actionable information: how many requests are allowed (`X-RateLimit-Limit`), how many remain (`X-RateLimit-Remaining`), and when to retry (`Retry-After`). Missing headers break client-side adaptive backoff.

**Real-World Consequence**: A misconfigured middleware returns 429 without `Retry-After`. The client doesn't know when to retry and keeps retrying immediately, creating a retry storm. Tests pass because they only check the status code.

**Preferred Alternative**: Assert `X-RateLimit-Limit`, `X-RateLimit-Remaining` (0 on exhaustion), and `Retry-After` on every 429 response.

**Refactoring Strategy**:
1. Add `$response->assertHeader('X-RateLimit-Limit', '5')` to exhaustion tests
2. Add `$response->assertHeader('X-RateLimit-Remaining', '0')` to exhaustion tests
3. Add `$response->assertHeader('Retry-After')` — verify presence and positive integer

**Detection Checklist**:
- [ ] `X-RateLimit-Limit` asserted on 429 responses
- [ ] `X-RateLimit-Remaining` asserted as `0` on exhaustion
- [ ] `Retry-After` header presence asserted on 429 responses

**Related Rules**: Assert Rate Limit Headers On Every Response
**Related Skills**: Test Rate Limits

---

## Anti-Pattern 5: Not Testing Authenticated and Unauthenticated Separately

**Category**: Testing completeness

**Description**: Testing only one type of rate limit (e.g., only per-IP unauthenticated) and assuming the other works identically.

**Warning Signs**:
- Rate limit tests are all unauthenticated (no `actingAs`)
- No test exhausts the per-user rate limit
- Different limits are configured for auth vs unauth but only one is tested

**Why It's Harmful**: Laravel's throttle middleware uses different cache keys for authenticated (user ID) vs unauthenticated (IP address) requests. An exhausted per-user limit does not affect the per-IP limit. Testing only one mode misses configuration bugs in the other.

**Real-World Consequence**: A route is configured with `throttle:5,1` for unauthenticated and `throttle:60,1` for authenticated. The unauth limit is tested. The auth limit is not. A bug changes the auth limit to `throttle:0,1` (unlimited in some versions). Authenticated users have no rate limit.

**Preferred Alternative**: Write separate exhaustion tests for authenticated and unauthenticated requests, each exercising the correct limit.

**Refactoring Strategy**:
1. Create a test with `$this->actingAs($user)->getJson(...)` for authenticated limits
2. Create a test without authentication for unauthenticated/ per-IP limits
3. Adjust the exhaustion count for each limit value

**Detection Checklist**:
- [ ] Unauthenticated rate limit is tested
- [ ] Authenticated rate limit is tested (if configured)
- [ ] Each test uses the correct limit value for its mode

**Related Rules**: Test Authenticated And Unauthenticated Limits Separately
**Related Skills**: Test Rate Limits
