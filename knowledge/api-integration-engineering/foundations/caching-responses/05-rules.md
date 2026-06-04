## Always Set TTL Based on Data Freshness Requirements
---
## Category
Architecture
---
## Rule
Configure cache TTL per endpoint based on data volatility, not a uniform value for all endpoints.
---
## Reason
Uniform TTL either serves stale data for fast-changing endpoints or underutilizes cache for static data.
---
## Bad Example
```php
Cache::remember('users', 3600, fn () => $this->fetchUsers()); // same TTL for all
```
---
## Good Example
```php
Cache::remember('users:active', 60, fn () => $this->fetchActiveUsers());  // volatile: 60s
Cache::remember('countries', 86400, fn () => $this->fetchCountries());     // static: 24h
```
---
## Exceptions
When all cached data has the same freshness SLA.
---
## Consequences Of Violation
Stale data served to users or excessive API calls for rarely-changing data.
## Implement Stampede Protection with Cache::lock()
---
## Category
Performance
---
## Rule
Use `Cache::lock()` to protect cache misses from stampede when multiple concurrent requests all miss the cache.
---
## Reason
Without protection, N concurrent cache misses cause N simultaneous upstream API calls, defeating caching's purpose.
---
## Bad Example
```php
$data = Cache::remember('key', 60, fn () => expensiveApiCall());
// 10 concurrent requests all fetch from API simultaneously
```
---
## Good Example
```php
$data = Cache::get('key');
if (!$data) {
    $lock = Cache::lock('key:lock', 10);
    if ($lock->get()) {
        $data = expensiveApiCall();
        Cache::put('key', $data, 60);
        $lock->release();
    } else {
        $data = Cache::get('key'); // wait and retry
    }
}
```
---
## Exceptions
Very low-traffic endpoints where concurrent misses are virtually impossible.
---
## Consequences Of Violation
Upstream API overwhelmed by concurrent requests on cache expiry, timeout errors, service degradation.
## Design Cache Keys with Service Namespace
---
## Category
Code Organization
---
## Rule
Use a structured cache key format with service prefix: `api:{service}:{resource}:{params_hash}`.
---
## Reason
Namespaced keys prevent collisions between different services, provide discoverability, and enable targeted invalidation.
---
## Bad Example
```php
Cache::remember('charges', 3600, fn () => ...); // ambiguous — which service?
```
---
## Good Example
```php
Cache::remember('api:stripe:charges:list:' . md5($query), 3600, fn () => ...);
```
---
## Exceptions
Single-service applications where namespace collision is not a concern.
---
## Consequences Of Violation
Cache key collisions between services, hard to debug cache behavior, impossible to invalidate by service.
## Don't Cache POST Responses Without Idempotency
---
## Category
Security
---
## Rule
Never cache POST/PUT/DELETE responses unless the request carries an idempotency key.
---
## Reason
Caching non-idempotent responses can cause duplicate side effects on cache replay without proper deduplication.
---
## Bad Example
```php
Cache::remember('payment:' . $data['id'], 3600, fn () => Http::post('/charges', $data));
```
---
## Good Example
```php
// Only cache with idempotency key
if ($idempotencyKey) {
    Cache::remember("idempotency:{$idempotencyKey}", 86400, fn () => Http::post('/charges', $data));
}
```
---
## Exceptions
GET requests which are inherently idempotent.
---
## Consequences Of Violation
Duplicate charges, double order processing, data corruption from replayed writes.
## Use Cache Invalidation via Webhook Events
---
## Category
Architecture
---
## Rule
Invalidate cache entries when the source data changes by listening to webhook events or webhook notifications.
---
## Reason
TTL-based expiration is passive; active invalidation on change ensures data freshness without waiting for TTL expiry.
---
## Bad Example
```php
// Only invalidates on TTL expiry — stale data served for up to TTL duration
```
---
## Good Example
```php
Event::listen(ChargeSucceeded::class, function () {
    Cache::tags(['stripe:charges'])->flush(); // immediate invalidation
});
```
---
## Exceptions
Data where staleness up to TTL is acceptable.
---
## Consequences Of Violation
Users see stale data for the full TTL period after the source data changes.
