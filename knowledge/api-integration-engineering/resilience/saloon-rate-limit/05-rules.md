## Use Saloon's Built-in Rate Limiter Plugin on Every Connector
---
## Category
Framework Usage
---
## Rule
Always attach the Saloon rate limiter plugin (`\Saloon\RateLimitPlugin\Limiters\TokenBucketLimiter`) to connectors that call rate-limited upstreams.
---
## Reason
Saloon's plugin provides plug-and-play rate limiting with configurable algorithms, cache-backed state, and auto-delay — eliminating the need for manual rate limit logic.
---
## Bad Example
```php
class StripeConnector extends Connector {
    // No rate limiter — manual rate limiting required
}
```
---
## Good Example
```php
class StripeConnector extends Connector {
    protected function defaultLimiter(): Limiter
    {
        return new TokenBucketLimiter(
            new CacheStore(cache()->driver('redis')),
            limit: 100,     // tokens
            period: 60,     // seconds
            burst: 20       // burst capacity
        );
    }
}
```
---
## Exceptions
Connectors with no rate limits (internal services).
---
## Consequences Of Violation
Manual rate limit management, inconsistent enforcement, missed rate limits causing 429 errors.
## Use Redis Cache for Distributed Rate Limit State
---
## Category
Scalability
---
## Rule
Use Redis as the cache store for Saloon's rate limiter plugin; never use file or database cache.
---
## Reason
File and database cache are per-server; multi-server deployments would have independent rate limit counters, allowing N×limit throughput before hitting upstream limits.
---
## Bad Example
```php
new CacheStore(cache()->driver('file')); // per-server — inconsistent
```
---
## Good Example
```php
new CacheStore(cache()->driver('redis')); // shared — consistent across servers
```
---
## Exceptions
Single-server deployments.
---
## Consequences Of Violation
Each server allows its own rate limit; total throughput exceeds upstream limits, causing 429 errors.
## Configure Per-Connector Rate Limiters
---
## Category
Architecture
---
## Rule
Create a separate rate limiter instance for each connector; never share one rate limiter across multiple connectors.
---
## Reason
Different upstreams have different rate limits; sharing a single limiter means one connector exhausts another's limit.
---
## Bad Example
```php
// One limiter shared by Stripe and Mailgun connectors
```
---
## Good Example
```php
class StripeConnector extends Connector {
    protected function defaultLimiter(): Limiter {
        return new TokenBucketLimiter(...); // Stripe-specific limit
    }
}
class MailgunConnector extends Connector {
    protected function defaultLimiter(): Limiter {
        return new TokenBucketLimiter(...); // Mailgun-specific limit
    }
}
```
---
## Exceptions
Connectors pointing to the same upstream service.
---
## Consequences Of Violation
One connector consumes another's rate limit budget, causing false rate limiting for unrelated services.
## Enable Auto-Delay for Non-Time-Sensitive Operations
---
## Category
Reliability
---
## Rule
Enable `autoDelay` on the rate limiter for background queue jobs; disable it for user-facing real-time requests.
---
## Reason
Auto-delay pauses the current request until the rate limit budget refills. For user-facing requests, this causes visible latency. For background jobs, it prevents 429 responses.
---
## Bad Example
```php
// Auto-delay enabled for user-facing request — user sees visible delay
```
---
## Good Example
```php
// Queue job rate limiter with auto-delay
new TokenBucketLimiter(..., autoDelay: true);
// User-facing rate limiter without auto-delay
new TokenBucketLimiter(..., autoDelay: false);
// Handle 429 with fallback in user-facing code
```
---
## Exceptions
User-facing requests where rate limit is rarely hit.
---
## Consequences Of Violation
Background jobs get 429 errors without delay (need manual retry); user-facing requests experience visible latency from auto-delay.
## Monitor Rate Limit Hit Rate for Tuning
---
## Category
Observability
---
## Rule
Track and alert on rate limit hit rate per connector to detect changes in upstream limit or request patterns.
---
## Reason
Rate limit hits indicate approaching upstream limits; early detection prevents service degradation.
---
## Bad Example
```php
// No monitoring — rate limit exhaustion surprises in production
```
---
## Good Example
```php
// In connector's boot method or middleware
$this->onRateLimitHit(fn () => {
    Metrics::increment('rate_limit.hit.stripe');
    if (Metrics::rate('rate_limit.hit.stripe', 5, 'minute') > 10) {
        Alert::warning('Approaching Stripe rate limit');
    }
});
```
---
## Exceptions
None — always monitor rate limit hits.
---
## Consequences Of Violation
Unexpected 429 errors, degraded service, no data for capacity planning or tuning.
## Test Rate Limiter Behavior Under Expected Load
---
## Category
Testing
---
## Rule
Write integration tests that verify rate limiter correctly throttles requests under load and auto-delay works as expected.
---
## Reason
Misconfigured rate limiters (wrong tokens_per_second, wrong cache driver, broken auto-delay) only manifest under load; untested limiters fail in production.
---
## Bad Example
```php
// No rate limit tests — behavior unknown under load
```
---
## Good Example
```php
public function test_rate_limiter_throttles_requests()
{
    Cache::shouldReceive('driver')
        ->andReturn(Mockery::mock(RedisStore::class));
    $connector = new StripeConnector();
    for ($i = 0; $i < 100; $i++) {
        $response = $connector->send(new GetChargesRequest());
        if ($i > 50) {
            // Assert requests are delayed
        }
    }
}
```
---
## Exceptions
None — always test rate limiter behavior.
---
## Consequences Of Violation
Undetected misconfiguration in rate limiter, 429 errors in production, or rate limiter never actually limiting.
