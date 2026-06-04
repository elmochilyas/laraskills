## Choose Algorithm Based on Workload
---
## Category
Architecture
---
## Rule
Use token bucket for burst-tolerant workloads, sliding window for precise limits, and leaky bucket for consistent processing rates.
---
## Reason
Each algorithm has different burst tolerance, precision, and memory tradeoffs; choosing the wrong one causes either under- or over-limiting.
---
## Bad Example
```php
$limiter = new FixedWindowLimiter(100, 60); // boundary burst issue — allows 200 at window boundary
```
---
## Good Example
```php
$limiter = match ($workloadType) {
    'bursty' => new TokenBucketLimiter(100, 60),  // allows bursts up to bucket size
    'precise' => new SlidingWindowLimiter(100, 60), // exact per-window limit
    'smooth' => new LeakyBucketLimiter(100, 60),    // constant processing rate
};
```
---
## Exceptions
APIs with documented rate limit behavior that dictates algorithm choice.
---
## Consequences Of Violation
Boundary bursts cause 429 errors (fixed window), excessive smoothing underutilizes capacity (leaky bucket), or imprecise limits allow violations (token bucket).
## Use Redis for Distributed Rate Limiter State
---
## Category
Scalability
---
## Rule
Store rate limiter state in Redis for consistent enforcement across all application servers.
---
## Reason
In-memory limiters are per-process; N servers each allow their own limit, resulting in N×limit total throughput.
---
## Bad Example
```php
$limiter = new InMemoryTokenBucketLimiter(100, 60); // 100 per process = 500 for 5 servers
```
---
## Good Example
```php
$limiter = new RedisTokenBucketLimiter($redis, 'stripe:limiter', 100, 60); // 100 total across all servers
```
---
## Exceptions
Single-server deployments.
---
## Consequences Of Violation
Effective rate limit is N×configured limit, causing 429 errors from upstream.
## Always Respect Upstream Retry-After Headers
---
## Category
Reliability
---
## Rule
When a 429 is received, parse and respect the `Retry-After` header; back off for the specified duration.
---
## Reason
Ignoring Retry-After causes aggressive retries that worsen rate limit violations and may trigger upstream bans.
---
## Bad Example
```php
// Retries immediately after 429 — worsens the problem
```
---
## Good Example
```php
if ($response->status() === 429) {
    $retryAfter = $response->header('Retry-After');
    sleep((int) $retryAfter); // or queue job with delay
    return $this->retry();
}
```
---
## Exceptions
Upstreams that don't return Retry-After headers (use exponential backoff).
---
## Consequences Of Violation
Aggressive retry causes upstream ban, service degradation, or IP blacklisting.
## Implement Graceful Queue/Delay on Rate Limit Hit
---
## Category
Architecture
---
## Rule
Queue requests with delay when rate limited; never drop or silently fail rate-limited requests.
---
## Reason
Dropping rate-limited requests loses data; queueing with delay ensures eventual processing without overwhelming upstream.
---
## Bad Example
```php
if (!$limiter->allow()) { return; } // silently drops the request
```
---
## Good Example
```php
if (!$limiter->allow()) {
    ProcessOrder::dispatch($data)->delay(now()->addSeconds($limiter->getWaitTime()));
    return;
}
```
---
## Exceptions
Time-sensitive operations where delayed processing is worse than failure.
---
## Consequences Of Violation
Data loss on rate-limited requests, incomplete operations, user-facing errors.
## Persist Rate Limiter State Across Restarts
---
## Category
Reliability
---
## Rule
Use persistent storage (Redis) for rate limiter state; in-memory state resets on process restart.
---
## Reason
Memory-reset on restart loses accumulated rate data, potentially causing burst violations immediately after restart.
---
## Bad Example
```php
// In-memory — resets on every deploy/restart
private int $tokens = 100;
```
---
## Good Example
```php
// Redis-persisted — survives restarts
$tokens = $redis->get('stripe:tokens') ?? 100;
```
---
## Exceptions
Stateless limiters in auto-scaling groups where restart frequency is low.
---
## Consequences Of Violation
Burst of requests immediately after restart exhausts upstream limit, causing 429 errors.
