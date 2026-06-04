## Set Local Safety Margin at 80% of Upstream Limit
---
## Category
Reliability
---
## Rule
Configure local rate limiters at 80% of the documented upstream limit to provide headroom for traffic peaks.
---
## Reason
Running at 100% of upstream limit causes 429 responses during traffic spikes; 80% headroom absorbs variability without hitting limits.
---
## Bad Example
```php
$limiter->setLimit(100); // same as upstream max — no headroom
```
---
## Good Example
```php
$limiter->setLimit((int)(100 * 0.8)); // 80% of upstream limit — headroom preserved
```
---
## Exceptions
When upstream explicitly allows bursting beyond the documented limit.
---
## Consequences Of Violation
Frequent 429 errors during traffic spikes, retries amplify load on already-stressed upstream.
## Use Per-Service Rate Limiters, Not Global
---
## Category
Architecture
---
## Rule
Create separate rate limiter instances per upstream service; never use a single limiter for all services.
---
## Reason
Different APIs have different limits and consumption patterns; a global limiter either starves fast APIs or allows slow ones to hit limits.
---
## Bad Example
```php
$globalLimiter = new TokenBucketLimiter(100, 60); // applied to all services
```
---
## Good Example
```php
$stripeLimiter = new TokenBucketLimiter(80, 60);  // per Stripe
$githubLimiter = new TokenBucketLimiter(60, 60);  // per GitHub
```
---
## Exceptions
APIs behind the same rate limit (e.g., same provider with aggregate limit).
---
## Consequences Of Violation
One service's rate limit impacts unrelated services, inefficient utilization of available capacity.
## Combine Proactive Limiting with Reactive 429 Handling
---
## Category
Reliability
---
## Rule
Implement both proactive (pre-request token check) and reactive (post-429 Retry-After parsing) rate limiting.
---
## Reason
Proactive limiting prevents most 429s; reactive handling catches cases where upstream limits change or local counters drift.
---
## Bad Example
```php
// Only proactive — misses upstream limit changes
if (!$limiter->allow()) { throw new RateLimitExceededException(); }
```
---
## Good Example
```php
// Proactive
if (!$limiter->allow()) { $this->backoff(); }
// Reactive
$response = Http::get('/endpoint');
if ($response->status() === 429) {
    $retryAfter = $response->header('Retry-After');
    $limiter->sync($retryAfter);
    $this->backoff($retryAfter);
}
```
---
## Exceptions
APIs that don't return Retry-After headers (rely solely on proactive limiting).
---
## Consequences Of Violation
Silent drift between local counters and upstream limits, eventual 429 errors and service degradation.
## Use Redis for Distributed Rate Limit State
---
## Category
Scalability
---
## Rule
Store rate limiter state in Redis (or another distributed cache), not in-memory or file cache.
---
## Reason
In-memory limiters are not shared across workers, causing each worker to independently exceed upstream limits.
---
## Bad Example
```php
$limiter = new TokenBucketLimiter(100, 60); // in-memory — not shared across workers
```
---
## Good Example
```php
$limiter = new RedisTokenBucketLimiter($redis, 'stripe', 100, 60); // distributed
```
---
## Exceptions
Single-worker deployments with no horizontal scaling.
---
## Consequences Of Violation
N workers each send 100 requests/minute, hitting the upstream with Nx100 requests and triggering 429s.
## Monitor Rate Limit Headroom
---
## Category
Observability
---
## Rule
Track and alert on remaining rate limit capacity (`X-RateLimit-Remaining`), not just when limit is exhausted.
---
## Reason
Alerting only at exhaustion is too late; tracking headroom provides early warning of approaching limits.
---
## Bad Example
```php
// Only alerted when 429 is received — no proactive warning
```
---
## Good Example
```php
$remaining = $response->header('X-RateLimit-Remaining');
if ($remaining < 10) {
    Alert::warning("Stripe rate limit headroom low: {$remaining} remaining");
}
```
---
## Exceptions
APIs that don't provide rate limit headers.
---
## Consequences Of Violation
Unexpected rate limit hits during traffic spikes, no time to request limit increases or implement optimizations.
