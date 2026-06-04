## Use Sliding Window Failure Counting
---
## Category
Reliability
---
## Rule
Count failures within a sliding time window, not lifetime absolute count.
---
## Reason
Lifetime count accumulates over time, causing the circuit to trip on historical failures unrelated to current health.
---
## Bad Example
```php
private int $failureCount = 0; // accumulates forever — will eventually trip
```
---
## Good Example
```php
// Sliding window: count failures in the last 60 seconds
$recentFailures = Cache::get('circuit:stripe:failures', []);
$recentFailures = array_filter($recentFailures, fn ($t) => $t > now()->subSeconds(60)->timestamp);
if (count($recentFailures) >= 5) { /* open circuit */ }
```
---
## Exceptions
None — always use time-windowed counting.
---
## Consequences Of Violation
Circuit eventually trips on accumulated age, causing unnecessary failover for an otherwise healthy service.
## Log Every State Transition
---
## Category
Observability
---
## Rule
Log all circuit breaker state transitions (Closed→Open, Open→Half-Open, Half-Open→Closed) with context.
---
## Reason
State transitions are critical signals of upstream health; without logging, degradation goes undetected.
---
## Bad Example
```php
// Circuit transitions silently — no trace of degradation
```
---
## Good Example
```php
Event::listen(CircuitOpened::class, function ($event) {
    Log::warning('Circuit opened for stripe', [
        'failure_rate' => $event->failureRate,
        'window' => $event->window
    ]);
});
```
---
## Exceptions
None — always log transitions for observability.
---
## Consequences Of Violation
Degradation undetected until users report issues, delayed incident response, no forensic data for post-mortem.
## Implement Half-Open with Probe Requests
---
## Category
Reliability
---
## Rule
After the cooldown period, send a single probe request to test recovery before closing the circuit.
---
## Reason
Without half-open probing, a permanently closed circuit doesn't test if the service has recovered; a permanently open circuit never recovers.
---
## Bad Example
```php
// Circuit opens — no probe — stays open until manual reset
```
---
## Good Example
```php
// After 30s cooldown, transition to half-open
// Send one probe request
$probe = Http::get('/health');
if ($probe->successful()) {
    $this->close(); // service recovered
} else {
    $this->open(); // still down — extend cooldown
}
```
---
## Exceptions
When manual recovery confirmation is explicitly required.
---
## Consequences Of Violation
Service remains inaccessible long after it recovers, extended downtime, unnecessary manual intervention.
## Store State in Shared Cache for Multi-Server
---
## Category
Scalability
---
## Rule
Store circuit breaker state in Redis (shared cache) for multi-server deployments; never use in-memory state.
---
## Reason
In-memory state is per-process; one server may have the circuit open while another continues sending requests to a failing service.
---
## Bad Example
```php
private string $state = 'closed'; // in-memory — not shared
```
---
## Good Example
```php
public function isAvailable(): bool {
    return Cache::get('circuit:stripe:state', 'closed') !== 'open';
}
```
---
## Exceptions
Single-server deployments.
---
## Consequences Of Violation
Some servers continue hitting a failing service, defeating circuit breaker's purpose and increasing load on the degraded upstream.
## Set Conservative Thresholds Initially
---
## Category
Architecture
---
## Rule
Start with conservative thresholds (5 consecutive failures, 30s cooldown) and tune based on observed metrics.
---
## Reason
Aggressive thresholds cause false trips on normal variability; conservative thresholds let you tune down based on data.
---
## Bad Example
```php
$breaker = new CircuitBreaker(threshold: 2, cooldown: 5); // too sensitive — trips on normal blips
```
---
## Good Example
```php
$breaker = new CircuitBreaker(threshold: 5, cooldown: 30); // conservative — tune later
// Monitor: if too many false trips, increase threshold; if too slow, decrease cooldown
```
---
## Exceptions
Known-unreliable services where aggressive thresholds are needed to protect resources.
---
## Consequences Of Violation
False circuit trips degrade availability unnecessarily, or overly lenient thresholds don't protect during actual outages.
