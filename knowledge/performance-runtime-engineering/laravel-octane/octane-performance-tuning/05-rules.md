## Follow the optimization sequence: bootstrap → providers → queries → caching → worker tuning — never skip steps
---
Category: Performance
---
Optimize in order: 1) Eliminate bootstrap via Octane, 2) Optimize service providers, 3) Optimize database queries, 4) Add caching, 5) Tune worker counts. Each step depends on the previous one being completed.
---
Reason: Octane eliminates bootstrap, exposing the next bottleneck (service providers). After providers are optimized, database queries become the dominant cost. After query optimization, caching is the next lever. Without following this sequence, effort is wasted optimizing components that are not on the critical path. A worker count tuned before query optimization will need retuning after queries are optimized.
---
Bad Example:
```php
// Tuning workers before optimizing queries — premature
// Worker count increased, but 50ms queries remain the bottleneck
```

Good Example:
```php
// Sequential optimization
// 1. Deploy Octane — bootstrap eliminated
// 2. Defer providers — 3ms saved per request
// 3. N+1 query eliminated — 40ms saved per request
// 4. Response cached — 30ms saved per request
// 5. Workers adjusted for new load profile
```
---
Exceptions: When monitoring clearly identifies the dominant bottleneck (e.g., database at 90% of request time), skip earlier steps and optimize the bottleneck directly.
---
Consequences Of Violation: Wasted optimization effort on non-bottleneck components, premature tuning that needs rework, suboptimal performance despite significant effort.

## Defer non-essential service providers and pre-resolve only essential ones
---
Category: Performance
---
Apply DeferrableProvider to any provider not needed on every request, and pre-resolve in config/octane.php only services used in >50% of requests — never add all custom services to the pre-resolved list.
---
Reason: Each non-deferred provider runs boot() on every worker start, adding 1-10ms to boot time and consuming memory for rarely-used services. Each custom pre-resolved service adds 1-5ms to worker boot time. For services used in <50% of requests, the pre-resolution cost (paid on every worker start) exceeds the benefit (saved on <50% of requests). The balance shifts the other way for services used on most requests.
---
Bad Example:
```php
// Pre-resolving all custom services — wastes boot time
'pre_resolved' => [
    ...defaults...,
    'App\Services\ReportService',  // Used in 2% of requests
    'App\Services\ExportService',  // Used in 5% of requests
]
```

Good Example:
```php
// Pre-resolve only essential services
'pre_resolved' => [
    ...defaults...,  // Covers 90% of need
    // Add only services used in >50% of requests
]
```
---
Exceptions: Services with very expensive resolution (>50ms) may justify pre-resolution even with moderate usage, but measure the tradeoff first.
---
Consequences Of Violation: Unnecessary worker boot time during rolling deployments, slower worker start, wasted memory on pre-resolved but rarely-used services.

## Use route caching, config caching, and event caching in every production Octane deployment
---
Category: Performance
---
Run php artisan route:cache, config:cache, and event:cache in the deployment pipeline — never run Octane in production with uncached routes, config, or events.
---
Reason: Uncached routes trigger route registration parsing on every worker start, adding 1-2ms per request. Uncached config merges environment files and config arrays on every worker start, adding 2-5ms. Uncached events scan directories for listeners, adding 0.5-1ms. These costs compound across the number of workers, adding seconds to deployment time per worker and milliseconds to every request.
---
Bad Example:
```bash
# Uncached deployment — slower boot and request times
# No route:cache, config:cache, or event:cache run
php artisan octane:start
```

Good Example:
```bash
# Cached deployment in pipeline
php artisan optimize
php artisan route:cache
php artisan config:cache
php artisan event:cache
php artisan octane:start
```
---
Exceptions: Development environments where frequent route/config changes occur should not use caching.
---
Consequences Of Violation: Slower worker boot during deployments, 2-8ms added to every request from uncached resolution, unnecessary CPU load.

## Profile database queries after Octane deployment — queries become the new bottleneck
---
Category: Performance
---
After deploying Octane, profile and optimize every database query because bootstrap elimination makes queries the dominant contributor to request time.
---
Reason: In PHP-FPM, a 40ms bootstrap + 10ms query = 50ms total, where bootstrap dominates. After Octane eliminates bootstrap, the 10ms query is now 100% of the remaining time. A query that was 20% of the cost becomes 100% — it is the bottleneck. Teams often optimize bootstrap-related code while ignoring queries that now determine the application's entire response time.
---
Bad Example:
```php
// Post-Octane: still focusing on middleware optimization
// While a N+1 query pattern adds 80ms per request — the real bottleneck
```

Good Example:
```php
// Post-Octane: profile queries first
// N+1 detected: 10 queries × 8ms each = 80ms added per request
// Eager loading added: 1 query × 15ms = 15ms — 81% reduction
```
---
Exceptions: Applications with CPU-bound processing (not I/O-bound) should profile computation instead of queries.
---
Consequences Of Violation: Disappointing post-migration performance, p99 latency still >100ms because query optimization was neglected after bootstrap elimination.

## Never set max_requests below 500 in production
---
Category: Configuration
---
Configure max_requests to a minimum of 500 in every Octane deployment, and only decrease below 1000 after observing a confirmed memory leak that requires more aggressive recycling.
---
Reason: Setting max_requests too low negates Octane's primary benefit — bootstrap elimination. At max_requests=100, each worker recycles every 100 requests, paying the bootstrap cost on 1% of requests. At max_requests=500, only 0.2% of requests pay bootstrap. The worker recycling cost (~100ms bootstrap + connection re-establishment) also creates latency spikes for the requests that trigger it. Fix memory leaks rather than using low max_requests as a band-aid.
---
Bad Example:
```bash
# max_requests too low — negates Octane's benefit
php artisan octane:start --max-requests=100  # 1% of requests pay bootstrap
```

Good Example:
```bash
# Conservative, appropriate max_requests
php artisan octane:start --max-requests=1000  # 0.1% of requests pay bootstrap
```
---
Exceptions: Applications with known, unfixable memory leaks in vendor packages may use lower max_requests as a temporary mitigation while planning a vendor replacement.
---
Consequences Of Violation: Frequent worker recycling adds bootstrap cost to 1%+ of requests, latency spikes from worker restart, reduced effective throughput.
