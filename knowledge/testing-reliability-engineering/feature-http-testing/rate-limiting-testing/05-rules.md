# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Feature & HTTP Testing
## Knowledge Unit: Rate Limiting Testing

---

### Rule 1: Use the three-phase pattern: within limit → exceed limit → after decay

| Field | Value |
|-------|-------|
| **Name** | Three-phase rate limit testing |
| **Category** | Rate Limit Verification |
| **Rule** | Test rate limits in three phases: requests within the limit succeed (200), requests exceeding the limit return 429, and requests after the decay window succeed again. |
| **Reason** | Each phase tests an independent behavior: limit enforcement, rejection when exceeded, and reset after decay. Missing the decay reset test means you cannot verify that blocked users ever recover. |
| **Bad Example** | Testing only that exceeding the limit returns 429 — never verifying limits reset. |
| **Good Example** | Within limit → 200. Exceed limit → 429 with Retry-After header. After `travel(decay+1)->seconds()` → 200 again. |
| **Exceptions** | Endpoints with permanent rate limits (e.g., account lockout after N failed logins). |
| **Consequences Of Violation** | Rate limits work for burst control but never reset. Legitimate users are permanently blocked. |

---

### Rule 2: Use time manipulation, never `sleep()` or real waits

| Field | Value |
|-------|-------|
| **Name** | Use `travel()` instead of `sleep()` |
| **Category** | Time Manipulation |
| **Rule** | Use `travel($seconds)->seconds()` or `Carbon::setTestNow()` to advance time in rate limit tests. Never use `sleep()`. |
| **Reason** | Real `sleep()` makes tests slow (a 60-second decay window requires a 60-second wait). Time manipulation is instant and deterministic. |
| **Bad Example** | `sleep(61)` to wait for rate limit decay — test takes 61 seconds. |
| **Good Example** | `travel(61)->seconds()` — time advanced instantly, test completes in milliseconds. |
| **Exceptions** | Tests that verify actual wall-clock timeout behavior. |
| **Consequences Of Violation** | Rate limit tests are slow and unreliable. Developers skip running them. |

---

### Rule 3: Test key isolation — different users must have independent rate limit counters

| Field | Value |
|-------|-------|
| **Name** | Verify rate limit key isolation |
| **Category** | Key Isolation |
| **Rule** | Test that User A exhausting their rate limit does not affect User B's requests. |
| **Reason** | Rate limit keys must be unique per user (or per IP). A bug in key generation creates shared rate limit buckets, where one user's excessive requests block all other users. |
| **Bad Example** | Testing rate limit for only one user — key collision with other users goes undetected. |
| **Good Example** | User A exceeds limit (gets 429). User B (same endpoint) still succeeds (200). |
| **Exceptions** | Endpoints with global rate limits (e.g., registration — limit per IP for first N registrations). |
| **Consequences Of Violation** | One user's excessive requests block all other users. Denial of service for legitimate users. |

---

### Rule 4: Use `array` cache driver for rate limit tests

| Field | Value |
|-------|-------|
| **Name** | Use array cache for rate limit testing |
| **Category** | Cache Configuration |
| **Rule** | Configure `CACHE_STORE=array` in the testing environment for rate limit tests. |
| **Reason** | The `file` cache driver persists across test processes and may cause rate limit state contamination in parallel execution. The `array` driver is isolated per-request, fast, and ensures clean state between tests. |
| **Bad Example** | Using `file` cache driver — rate limit state leaks between tests, causing random failures. |
| **Good Example** | `CACHE_STORE=array` in `phpunit.xml` — isolated, fast, deterministic. |
| **Exceptions** | Tests that specifically verify rate limit behavior with Redis/memcached (integration tests). |
| **Consequences Of Violation** | Rate limit tests fail intermittently. Parallel execution causes cross-test contamination. |

---

### Rule 5: Always reset test time in teardown

| Field | Value |
|-------|-------|
| **Name** | Reset time after time-manipulated tests |
| **Category** | Time Manipulation |
| **Rule** | Always call `travelBack()` or `Carbon::setTestNow(null)` in the test teardown or `afterEach()` block after using time manipulation. |
| **Reason** | Time manipulation persists across tests if not reset. A test that advances time by 60 seconds affects the next test's timestamps, query results, and rate limit states. |
| **Bad Example** | `travel(61)->seconds()` at the end of a test — next test starts 61 seconds in the future. |
| **Good Example** | `afterEach(fn () => travelBack())` in `pest.php` or `tearDown(): void { Carbon::setTestNow(null); }` in PHPUnit. |
| **Exceptions** | When time manipulation is explicitly intended to persist (e.g., across a test suite). Rare. |
| **Consequences Of Violation** | Subsequent tests receive wrong timestamps. Date-based logic fails. Rate limit tests bleed into each other. |

---

### Rule 6: Use named rate limiters (not inline limits) for testability

| Field | Value |
|-------|-------|
| **Name** | Define named limiters for testability |
| **Category** | Rate Limiter Design |
| **Rule** | Define all rate limiters via `RateLimiter::for('api', fn () => Limit::perMinute(60))` in service providers. Do not use inline `throttle:60,1` in route definitions. |
| **Reason** | Named limiters can be referenced by name in tests and can be inspected, mocked, or reconfigured. Inline limits are embedded in route configuration and are harder to verify. |
| **Bad Example** | `Route::middleware('throttle:60,1')->group(...)` — limiter unnamed, cannot be tested by name. |
| **Good Example** | `RateLimiter::for('api', fn () => Limit::perMinute(60)); Route::middleware('throttle:api')` — named, testable. |
| **Exceptions** | Trivial rate limits that match the default configuration. |
| **Consequences Of Violation** | Cannot test rate limits by name. Configuration is duplicated across route files. |
