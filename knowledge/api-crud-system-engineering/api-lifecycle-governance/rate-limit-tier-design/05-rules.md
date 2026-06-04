# Phase 5: Rules — Rate Limit Tier Design

## Rule 1: Define Minimum Three Consumer Tiers
---
## Category
Architecture
---
## Rule
Always define at least three consumer tiers (Free, Pro, Enterprise) with documented per-tier rate limits. Never expose a single-tier API with uniform limits for all consumers.
---
## Reason
Tier differentiation enables fair resource allocation, supports monetization, and accommodates consumers of different scales.
---
## Bad Example
```php
// Single tier — same 100 req/s for everyone
// Limits hobby project and blocks enterprise use case
```
---
## Good Example
```php
const TIERS = [
    'free' => ['rate' => 10, 'burst' => 20, 'monthly_quota' => 10_000],
    'pro' => ['rate' => 100, 'burst' => 200, 'monthly_quota' => 1_000_000],
    'enterprise' => ['rate' => 1000, 'burst' => 2000, 'monthly_quota' => 10_000_000],
];
```
---
## Exceptions
Internal-only APIs with a single trusted consumer may use a single tier.
---
## Consequences Of Violation
Free consumers abuse resources meant for paying customers; enterprise customers outgrow the API; revenue opportunity lost.
---

## Rule 2: Use Hybrid Sliding Window + Token Bucket
---
## Category
Reliability
---
## Rule
Always implement rate limiting with a hybrid approach: sliding window for sustained rate accuracy and token bucket for burst handling. Never use a fixed-window counter alone.
---
## Reason
Fixed-window counters allow 2x traffic at window boundaries (double-spike). Sliding window smooths this. Token bucket allows short bursts without exceeding sustained limits.
---
## Bad Example
```php
// Fixed window — 2x spike at window boundaries
$count = Redis::incr("ratelimit:{$key}:".now()->format('Y-m-d-H-i'));
```
---
## Good Example
```php
// Sliding window (Redis sorted set) + token bucket (Lua script)
$allowed = RateLimiter::attempt(
    $key, $tier['rate'], $tier['burst'], $decaySeconds = 1
);
```
---
## Exceptions
Very high-throughput internal APIs may use simpler fixed-window with jitter.
---
## Consequences Of Violation
Consumers get 2x rate at window boundaries; burst traffic rejected; inconsistent rate enforcement.
---

## Rule 3: Include Rate Limit Headers on All Responses
---
## Category
Design
---
## Rule
Always include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers on every API response, not just when throttled. Never omit headers on successful responses.
---
## Reason
Consumers need to know their remaining capacity before making the next request. Headers on success responses enable proactive throttling.
---
## Bad Example
```php
// Headers only on 429 responses
return response()->json([...], 429)->header('Retry-After', 30);
```
---
## Good Example
```php
public function handle(Request $request, Closure $next) {
    $response = $next($request);
    return $response->withHeaders([
        'X-RateLimit-Limit' => $tier['rate'],
        'X-RateLimit-Remaining' => $this->getRemaining($key),
        'X-RateLimit-Reset' => $this->getResetTime($key),
    ]);
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumers cannot track remaining capacity; unexpected 429 responses; poor consumer experience.
---

## Rule 4: Return Retry-After on Every 429 Response
---
## Category
Reliability
---
## Rule
Always include a `Retry-After` header (in seconds) on every 429 Too Many Requests response. Never return 429 without a retry interval.
---
## Reason
Without `Retry-After`, consumers must guess when to retry — leading to immediate retry storms (retry loop same second) or excessively long waits.
---
## Bad Example
```php
return response()->json([...], 429); // No Retry-After — consumer retries immediately
```
---
## Good Example
```php
return response()->json([
    'error' => [
        'code' => 'RATE_LIMIT_EXCEEDED',
        'message' => "Rate limit exceeded. {$tier['rate']} requests per second allowed.",
        'retry_after_seconds' => $retryAfter,
    ]
], 429)->header('Retry-After', (string) $retryAfter);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumer retry storm exacerbates rate limiting; API receives abusive retry traffic; incident escalations.
---

## Rule 5: Implement Per-Endpoint Sub-Limits
---
## Category
Architecture
---
## Rule
Always configure per-endpoint sub-limits within tier caps for expensive operations (exports, search, batch). Never let expensive endpoints consume the entire tier rate limit.
---
## Reason
Expensive endpoints (complex queries, large data exports) need lower limits than lightweight endpoints. Without sub-limits, a single expensive operation can block all other API usage.
---
## Bad Example
```php
// Same rate limit for GET /users and POST /export — export blocks everything
```
---
## Good Example
```php
const ENDPOINT_SUB_LIMITS = [
    'default' => ['rate' => 1.0], // 100% of tier rate
    'POST /export' => ['rate' => 0.1], // 10% of tier rate
    'POST /bulk' => ['rate' => 0.2], // 20% of tier rate
];
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Expensive operation consumes entire rate budget; other operations blocked; degraded DX.
---

## Rule 6: Stagger Quota Resets by Consumer Hash
---
## Category
Scalability
---
## Rule
Always stagger monthly quota resets by distributing reset times based on consumer ID hash. Never reset all consumer quotas at the same moment (e.g., midnight on the 1st).
---
## Reason
Simultaneous resets create a thundering herd effect — all consumers who hit their quota resume at once, causing a traffic spike that may overwhelm the system.
---
## Bad Example
```php
// All consumers reset at midnight on the 1st
// 10,000 consumers resume simultaneously
```
---
## Good Example
```php
// Stagger reset across 24 hours
$hour = crc32($consumerId) % 24;
$resetAt = now()->startOfMonth()->addHours($hour);
```
---
## Exceptions
Billing-synchronized resets may use a single window with pre-warming (gradually allow traffic before reset).
---
## Consequences Of Violation
Post-reset traffic spike overwhelms database and cache; degraded performance for all consumers.
---

## Rule 7: Implement Redis Circuit Breaker with Local Fallback
---
## Category
Reliability
---
## Rule
Always implement a circuit breaker for the rate limit store (Redis) that falls back to local in-memory limiting when Redis is unavailable. Never fail API requests because the rate limit store is down.
---
## Reason
Rate limiting is a protective mechanism, not a critical dependency. If the store is unavailable, serve traffic with degraded (local) limiting rather than denying all requests.
---
## Bad Example
```php
// Redis down → rate limit check throws → all requests fail
$allowed = Redis::throttle($key)->allow(100);
```
---
## Good Example
```php
if (! Cache::getStore() instanceof RedisStore) {
    // Fall back to in-memory rate limiter (less accurate but available)
    return $this->localRateLimiter->attempt($key, $rate);
}
return Redis::throttle($key)->allow($rate);
```
---
## Exceptions
APIs with hard rate limit SLAs (e.g., guaranteed per-second limits) may fail-closed instead.
---
## Consequences Of Violation
Complete API outage during Redis incident; cascading failure across all services depending on rate limit check.
