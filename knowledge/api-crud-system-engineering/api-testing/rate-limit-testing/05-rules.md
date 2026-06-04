# Rate Limit Testing — Rules

## Isolate Rate Limit Tests In Dedicated Classes
---
## Category
Code Organization
---
## Rule
Never mix rate-limit exhaustion tests with happy-path tests — use a dedicated test class.
---
## Reason
Rate limit tests require sequential requests that exhaust a throttle limit. Happy-path tests often use `withoutMiddleware` or `RefreshDatabase` setup that interferes with rate-limit state. Isolation prevents accidental `withoutMiddleware` from bypassing throttle in exhaustion tests.
---
## Bad Example
```php
class PostsTest extends TestCase
{
    use RefreshDatabase;

    it('lists posts', fn () => $this->getJson('/api/posts')->assertOk());
    it('rate limits after 60 requests', fn () => /* ... */); // Mixed — RefreshDatabase may reset cache
}
```
---
## Good Example
```php
class PostsRateLimitTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush(); // Clean rate-limit state
    }

    it('returns 429 after exceeding limit', fn () => /* ... */);
}
```
---
## Exceptions
When the entire test suite uses a persistent cache driver and no `withoutMiddleware`, rate-limit tests may coexist.
---
## Consequences Of Violation
Rate-limit tests fail intermittently due to cache state interference; accidental `withoutMiddleware` bypasses throttle; flaky CI.
---

## Use Low Test Limits To Minimize Requests
---
## Category
Performance
---
## Rule
Configure a low test limit (e.g., `throttle:5,1`) for rate-limit tests to reduce request count.
---
## Reason
Testing a limit of 60 requests/minute requires 61 sequential requests per test. With 3 rate-limit scenarios, that's 183 requests. A low limit (5,1) reduces this to 6 requests per test — a 91% reduction — while still proving the throttle mechanism works.
---
## Bad Example
```php
// Uses production-level limit — 61 requests for one test
it('rate limits after 60 requests', function () {
    for ($i = 0; $i < 60; $i++) {
        $this->getJson('/api/posts')->assertOk();
    }
    $this->getJson('/api/posts')->assertStatus(429);
});
```
---
## Good Example
```php
// Configured with throttle:5,1 in test environment — 6 requests
it('rate limits after 5 requests', function () {
    for ($i = 0; $i < 5; $i++) {
        $this->getJson('/api/rate-limited')->assertOk();
    }

    $this->getJson('/api/rate-limited')->assertStatus(429);
});
```
---
## Exceptions
When the rate-limit configuration cannot be overridden per environment, test at the configured production limit.
---
## Consequences Of Violation
Slow test suite; 60+ requests per test; developers skip rate-limit tests to save CI time.
---

## Assert Rate Limit Headers On Every Response
---
## Category
Testing
---
## Rule
Assert `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` headers on rate-limited responses.
---
## Reason
The status code 429 indicates throttling, but the headers provide the actionable information: how many requests are allowed, how many remain, and when to retry. Clients depend on these headers for adaptive backoff. A missing header is a failed contract even with a correct status.
---
## Bad Example
```php
it('rate limits', function () {
    // ... exhaust limit
    $this->getJson('/api/posts')->assertStatus(429);
    // No header assertions
});
```
---
## Good Example
```php
it('returns rate limit headers on 429', function () {
    // ... exhaust limit
    $response = $this->getJson('/api/posts');

    $response->assertStatus(429);
    $response->assertHeader('X-RateLimit-Limit', '60');
    $response->assertHeader('X-RateLimit-Remaining', '0');
    $response->assertHeader('Retry-After');
});
```
---
## Exceptions
When the application deliberately omits rate-limit headers for security reasons (rare), document and test the absence.
---
## Consequences Of Violation
Clients cannot implement adaptive backoff; retry storms overwhelm the server; missing header violates API contract.
---

## Use Persistent Cache Driver
---
## Category
Testing
---
## Rule
Never use the `array` cache driver for rate-limit tests — use `file` or `redis` cache driver that persists across requests.
---
## Reason
The `array` cache driver resets its store between every HTTP request within the same test, making rate-limit exhaustion impossible. The throttled request will never actually be throttled because the counter resets to zero on every call.
---
## Bad Example
```php
// .env.testing uses CACHE_DRIVER=array
it('rate limits', function () {
    for ($i = 0; $i < 60; $i++) {
        $this->getJson('/api/posts')->assertOk();
    }
    $this->getJson('/api/posts')->assertStatus(429); // Fails — array cache resets between requests
});
```
---
## Good Example
```php
// .env.testing uses CACHE_DRIVER=file
// Or in setUp:
protected function setUp(): void
{
    parent::setUp();
    Config::set('cache.default', 'file');
    Cache::flush();
}

it('rate limits', function () {
    for ($i = 0; $i < 60; $i++) {
        $this->getJson('/api/posts')->assertOk();
    }

    $this->getJson('/api/posts')->assertStatus(429);
});
```
---
## Exceptions
When using PestPHP with PHPUnit's `@runInSeparateProcess`, `file` cache may not persist either — use `redis` in a test container.
---
## Consequences Of Violation
Rate-limit tests always pass (never exhausted) or always fail (cannot exhaust); no meaningful rate-limit coverage.
---

## Test Authenticated And Unauthenticated Limits Separately
---
## Category
Testing
---
## Rule
Write separate tests for per-user rate limits (authenticated) and per-IP rate limits (unauthenticated).
---
## Reason
Laravel's `throttle` middleware can be configured per user ID when authenticated and per IP when not. These are different cache keys — an exhausted per-user limit does not affect the per-IP limit. Testing one mode without the other misses half the configuration.
---
## Bad Example
```php
it('rate limits unauthenticated requests', function () {
    for ($i = 0; $i < 5; $i++) {
        $this->getJson('/api/posts')->assertOk();
    }
    $this->getJson('/api/posts')->assertStatus(429);
    // Does not test authenticated user limits
});
```
---
## Good Example
```php
it('rate limits unauthenticated requests per IP', function () {
    for ($i = 0; $i < 5; $i++) {
        $this->getJson('/api/posts')->assertOk();
    }
    $this->getJson('/api/posts')->assertStatus(429);
});

it('rate limits authenticated requests per user', function () {
    $user = User::factory()->create();
    for ($i = 0; $i < 10; $i++) {
        $this->actingAs($user)->getJson('/api/posts')->assertOk();
    }
    $this->actingAs($user)->getJson('/api/posts')->assertStatus(429);
});
```
---
## Exceptions
When only one type of rate limit is configured (e.g., only per-IP), test only the configured type.
---
## Consequences Of Violation
Authenticated users bypass rate limits (or vice versa); brute-force attacks through untested auth path; server overload.
---

## Flush Cache Between Test Classes
---
## Category
Testing
---
## Rule
Call `Cache::flush()` in `setUp()` or `beforeEach()` of rate-limit test classes to prevent state bleed.
---
## Reason
Rate-limit state persists in the cache across test methods. A test that exhausts a limit leaves the counter consumed for the next test, causing a false-positive 429. Flushing the cache between classes ensures each test starts with a clean rate-limit state.
---
## Bad Example
```php
// No cache flush — rate-limit state from one test bleeds into next
it('allows first request', fn () => $this->getJson('/api/posts')->assertOk());
it('rate limits', function () {
    // May fail because first test consumed one counter slot
});
```
---
## Good Example
```php
beforeEach(function () {
    Cache::flush();
});

it('allows first request', fn () => $this->getJson('/api/posts')->assertOk());
it('rate limits after 5 requests', function () {
    for ($i = 0; $i < 5; $i++) {
        $this->getJson('/api/posts')->assertOk();
    }
    $this->getJson('/api/posts')->assertStatus(429);
});
```
---
## Exceptions
When using a dedicated test cache namespace or `RefreshDatabase` that also resets the cache, explicit flush may be unnecessary.
---
## Consequences Of Violation
Flaky rate-limit tests; false-positive 429 from previous test state; random CI failures that cannot be reproduced locally.
---
