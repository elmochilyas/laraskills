## Never Fallback Silently — Always Log
---
## Category
Observability
---
## Rule
Log every fallback invocation with service name, reason (circuit open, timeout, rate limit), and fallback type (stale cache, alternative provider, default response).
---
## Reason
Without logging, operators cannot distinguish degraded-mode responses from normal ones, delaying incident detection and root cause analysis.
---
## Bad Example
```php
try {
    return $this->primaryProvider->getRate();
} catch (Exception $e) {
    return $this->staleCache; // silent fallback — no trace
}
```
---
## Good Example
```php
try {
    return $this->primaryProvider->getRate();
} catch (Exception $e) {
    Log::warning('Fallback to stale cache for currency rates', [
        'service' => 'stripe',
        'reason' => get_class($e),
        'cache_age' => $this->cacheAge,
    ]);
    return $this->staleCache;
}
```
---
## Exceptions
Extremely high-frequency fallbacks where logging overhead is prohibitive.
---
## Consequences Of Violation
Degraded mode undetected, users see stale data without operator awareness, delayed incident response.
## Use Stale Cache as Primary Fallback for Reads
---
## Category
Reliability
---
## Rule
When fresh data is unavailable, serve expired cached data as the first fallback option for read endpoints.
---
## Reason
Stale data is better than no data; cached data is available instantly without additional network calls, maintaining availability during upstream outages.
---
## Bad Example
```php
try {
    $data = Http::get('/rates');
    Cache::put('rates', $data, 300);
} catch (Exception $e) {
    throw $e; // fails — no fallback
}
```
---
## Good Example
```php
$data = Cache::remember('rates', 300, fn () => Http::get('/rates'));
// On failure, Cache::remember returns fresh data or null
if (!$data) {
    $data = Cache::get('rates'); // stale cache fallback
}
```
---
## Exceptions
Data so time-sensitive that stale values cause harm (stock trades, real-time pricing).
---
## Consequences Of Violation
Complete failure during upstream outage even when usable cached data exists, reduced availability.
## Implement Provider Failover for Critical Integrations
---
## Category
Reliability
---
## Rule
For critical integrations, configure a backup provider and failover when primary circuit is open.
---
## Reason
A single provider represents a single point of failure; a backup provider ensures continuity during primary provider outages.
---
## Bad Example
```php
class PaymentService {
    public function charge($data) {
        return Http::stripe()->post('/charges', $data); // no failover
    }
}
```
---
## Good Example
```php
class PaymentService {
    public function charge($data) {
        if ($this->circuitBreaker->isOpen('stripe')) {
            Log::info('Failover to backup payment provider');
            return $this->backupProvider->charge($data);
        }
        return $this->primaryProvider->charge($data);
    }
}
```
---
## Exceptions
Integrations where no alternative provider exists.
---
## Consequences Of Violation
Payment processing stops completely during primary provider outage, revenue impact.
## Design Fallbacks for Reads, Not Writes
---
## Category
Architecture
---
## Rule
Implement fallbacks for read operations; never silently fallback on write operations (create, update, delete).
---
## Reason
Falling back on writes can create data inconsistency (partial writes, duplicate records in backup system); writes should either succeed completely or fail clearly.
---
## Bad Example
```php
try {
    $order = $this->primaryProvider->createOrder($data);
} catch (Exception $e) {
    $order = $this->backupProvider->createOrder($data); // inconsistent state
}
```
---
## Good Example
```php
try {
    $order = $this->primaryProvider->createOrder($data);
} catch (Exception $e) {
    // Queue for retry, don't silently switch providers
    CreateOrder::dispatch($data)->delay(now()->addMinutes(5));
    throw $e; // propagate to caller
}
```
---
## Exceptions
Write operations with idempotency keys and transactional guarantees.
---
## Consequences Of Violation
Data inconsistency, duplicate records, out-of-sync state between systems.
## Fallback Based on Circuit Breaker State, Not Single Failures
---
## Category
Reliability
---
## Rule
Trigger fallback when the circuit breaker is open (indicating systemic failure), not on a single request failure.
---
## Reason
Single failures are normal; falling back on every failure bypasses useful retry logic and may cause expensive provider switching on transient blips.
---
## Bad Example
```php
try { return Http::get('/rates'); }
catch (Exception $e) { return $this->fallback(); } // fallback on single failure
```
---
## Good Example
```php
if ($this->circuitBreaker->isOpen('stripe')) {
    return $this->fallback(); // systemic failure — fallback
}
try { return Http::get('/rates'); }
catch (Exception $e) { throw $e; } // single failure — retry normally
```
---
## Exceptions
Read operations where fast fallback is preferred over retry latency.
---
## Consequences Of Violation
Expensive provider failover on transient failures, unnecessary fallback costs, reduced system stability.
## Indicate Degraded Mode in Response Headers
---
## Category
Observability
---
## Rule
Add response headers (e.g., `X-Degraded-Mode: true`, `X-Fallback: stale-cache`) when serving fallback responses.
---
## Reason
Consumers of the API need to know the response quality; headers enable monitoring, dashboards, and consumer-side decisions.
---
## Bad Example
```php
return response($staleData); // no indication of degraded mode
```
---
## Good Example
```php
return response($staleData)
    ->header('X-Degraded-Mode', 'true')
    ->header('X-Fallback', 'stale-cache');
```
---
## Exceptions
None — always indicate fallback in response headers.
---
## Consequences Of Violation
Consumers unaware of degraded mode, incorrect data usage, no visibility into fallback frequency.
