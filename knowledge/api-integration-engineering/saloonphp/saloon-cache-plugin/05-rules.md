## Set TTL Per Endpoint, Not Per Connector
---
## Category
Architecture
---
## Rule
Configure cache TTL per endpoint (via request class or configuration), not a single TTL for the entire connector.
---
## Reason
Different endpoints have different freshness requirements — charges list may need seconds, metadata may need hours.
---
## Bad Example
```php
$this->withCache(new RedisStore($this->redis), ttl: 3600); // same TTL for ALL endpoints
```
---
## Good Example
```php
$this->withCache(new RedisStore($this->redis))
    ->defaultTtl(3600)
    ->requestTtl(GetChargeRequest::class, 60)     // volatile: 60s
    ->requestTtl(GetProductRequest::class, 86400); // static: 24h
```
---
## Exceptions
Connectors where all endpoints have identical freshness requirements.
---
## Consequences Of Violation
Stale data served for volatile endpoints or premature cache invalidation for static data.
## Exclude Non-GET and Auth Requests from Caching
---
## Category
Security
---
## Rule
Filter requests to cache only GET endpoints; explicitly exclude POST/PUT/DELETE and authentication requests.
---
## Reason
Caching non-idempotent requests produces incorrect application state on replay; caching auth responses causes stale token authorization.
---
## Bad Example
```php
$this->withCache(new RedisStore($this->redis)); // caches everything including POST and auth
```
---
## Good Example
```php
$this->withCache(new RedisStore($this->redis))
    ->cacheOnlyRequestsUsing(fn (Request $request): bool =>
        $request->getMethod() === Method::GET &&
        !$request instanceof AuthRequest
    );
```
---
## Exceptions
None — this is a hard safety requirement.
---
## Consequences Of Violation
Stale mutations replayed on retry, expired tokens authorizing revoked sessions.
## Enable Conditional Caching for ETag-Supporting APIs
---
## Category
Performance
---
## Rule
Enable conditional caching (ETag/Last-Modified) when the upstream API supports it.
---
## Reason
304 responses eliminate response body transfer, saving 90%+ bandwidth for unchanged data while still validating freshness.
---
## Bad Example
```php
$this->withCache(new RedisStore($this->redis)); // always fetches full response body
```
---
## Good Example
```php
$this->withCache(new RedisStore($this->redis), ttl: 3600)
    ->enableConditionalCaching(); // 304 responses skip body transfer
```
---
## Exceptions
APIs that don't support ETag or Last-Modified headers.
---
## Consequences Of Violation
Wasted bandwidth for unchanged responses, higher latency, increased upstream load.
## Implement Targeted Cache Invalidation via Webhooks
---
## Category
Architecture
---
## Rule
Invalidate specific cache entries when the source data changes via webhook events; never flush the entire cache.
---
## Reason
Full cache flush invalidates unrelated entries, causing a spike of cache misses and upstream load.
---
## Bad Example
```php
Event::listen(WebhookReceived::class, fn () => Cache::flush()); // flushes everything
```
---
## Good Example
```php
Event::listen(ChargeSucceeded::class, function () {
    Cache::tags(['stripe:charges'])->flush(); // targeted invalidation
});
```
---
## Exceptions
When tag-based invalidation is not supported by the cache driver.
---
## Consequences Of Violation
Cache miss storm after every data change, increased upstream load, degraded performance.
## Monitor Cache Hit Rate as a Key Metric
---
## Category
Observability
---
## Rule
Track cache hit rate per connector and alert on drops below the target threshold (>90%).
---
## Reason
Dropping hit rate indicates configuration drift, data pattern changes, or stale TTL settings that need adjustment.
---
## Bad Example
```php
// Cache deployed without any hit-rate monitoring — tuning blind
```
---
## Good Example
```php
$hitRate = $this->cacheStore->getHitRate();
if ($hitRate < 0.9) {
    Log::warning("Cache hit rate dropped to {$hitRate} for stripe connector");
}
```
---
## Exceptions
APIs with extremely volatile data where high hit rates are not expected.
---
## Consequences Of Violation
Degraded performance goes undetected, stale cache configuration wastes resources, increased API costs.
