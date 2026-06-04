## Track Cache Hit Ratio Per Endpoint
---
## Category
Observability
---
## Rule
Monitor cache hit ratio per endpoint and alert on significant drops.
---
## Reason
Drastic hit ratio drops indicate cache misconfiguration, stampede, or upstream data pattern changes requiring investigation.
---
## Bad Example
```php
// No monitoring — cache issues invisible
```
---
## Good Example
```php
$hits = Cache::increment("cache:hits:stripe:prices");
$misses = Cache::increment("cache:misses:stripe:prices");
$ratio = $hits / max(1, $hits + $misses);
Metrics::gauge('cache.hit_ratio.stripe.prices', $ratio);
```
---
## Exceptions
None — always monitor hit ratio.
---
## Consequences Of Violation
Undetected cache degradation, increased upstream load, slower responses, higher costs.
## Set TTLs per Data Type
---
## Category
Architecture
---
## Rule
Configure TTL per endpoint based on data change frequency and freshness requirements.
---
## Reason
Uniform TTL across all endpoints serves stale reference data or expires volatile data too slowly.
---
## Bad Example
```php
Cache::remember('stripe:balance', 300, ...); // 5 min for rarely-changing reference data
Cache::remember('stripe:product_prices', 300, ...); // same TTL for frequently changing prices
```
---
## Good Example
```php
Cache::remember('stripe:product_types', 86400, ...); // reference — 24h
Cache::remember('stripe:balance', 300, ...); // semi-volatile — 5 min
Cache::remember('stripe:live_prices', 60, ...); // volatile — 1 min
```
---
## Exceptions
None — always tune TTL per data type.
---
## Consequences Of Violation
Stale data for frequently changing endpoints; wasted cache for rarely-changing endpoints.
## Cache at Service Layer, Not Controller
---
## Category
Code Organization
---
## Rule
Implement caching in the service class or repository, not in controllers.
---
## Reason
Controllers should handle HTTP concerns; caching logic in controllers cannot be reused by queue jobs, commands, or other consumers of the same service.
---
## Bad Example
```php
class ChargeController {
    public function index() {
        return Cache::remember('charges', 3600, fn () => $this->chargeService->all());
    }
}
```
---
## Good Example
```php
class StripeChargeService {
    public function all() {
        return Cache::remember('stripe:charges', 3600, fn () => $this->connector->get('/charges'));
    }
}
// Controller calls service — caching is transparent
```
---
## Exceptions
Simple pass-through controllers with no service layer.
---
## Consequences Of Violation
Cache logic duplicated in controllers and queue jobs; inconsistency in TTLs; harder to test cache behavior.
## Configure Separate Cache Pools per Service
---
## Category
Scalability
---
## Rule
Use separate cache stores or key prefixes per upstream service to isolate cache namespaces.
---
## Reason
Shared cache pool can cause key collisions and makes per-service cache sizing impossible.
---
## Bad Example
```php
// All services share same pool — key collision risk
Cache::remember('charges', 3600, ...); // which service's charges?
```
---
## Good Example
```php
Cache::store('stripe_cache')->remember('stripe:charges', 3600, ...);
Cache::store('mailgun_cache')->remember('mailgun:messages', 3600, ...);
```
---
## Exceptions
Low-volume setups where key collision is unlikely.
---
## Consequences Of Violation
Cache key collisions between services, impossible to size or tune per-service cache independently.
## Always Include Key Namespace in Cache Key
---
## Category
Code Organization
---
## Rule
Prefix all cache keys with service name and resource type (e.g., `stripe:charges:list`).
---
## Reason
Namespaced keys prevent collisions, are easier to debug and invalidate, and enable group flush by prefix.
---
## Bad Example
```php
Cache::remember('charges', 3600, ...); // no namespace — collision risk
```
---
## Good Example
```php
Cache::remember('stripe:charges:list', 3600, ...); // namespaced
Cache::remember('mailgun:messages:sent', 3600, ...); // namespaced
```
---
## Exceptions
Single-service applications.
---
## Consequences Of Violation
Cache key collision between different services or resources, debugging difficulty, accidental cache corruption.
