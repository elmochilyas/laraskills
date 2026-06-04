## Classify Failures Correctly (5xx Trips, 4xx Does Not)
---
## Category
Reliability
---
## Rule
Configure circuit breakers to count 5xx and network errors as failures; exclude 4xx (except 429) from failure counting.
---
## Reason
4xx errors indicate client-side issues (bad request, unauthorized) that won't be resolved by stopping requests to the server.
---
## Bad Example
```php
$breaker->recordFailure($response->status()); // counts 401, 403, 404 as failures
```
---
## Good Example
```php
if ($response->serverError() || $response->status() === 429) {
    $breaker->recordFailure();
}
```
---
## Exceptions
None — failure classification is critical for correct circuit behavior.
---
## Consequences Of Violation
False circuit trips on client errors, blocking valid requests unnecessarily, degrading availability.
## Set Minimum Requests Before Evaluating Rate
---
## Category
Reliability
---
## Rule
Configure a minimum request count (5-10) before the circuit breaker evaluates failure rate.
---
## Reason
On low volume, a single failure equals 100% — causing false circuit trips on the first error.
---
## Bad Example
```php
$breaker = new CircuitBreaker(failureThreshold: 50); // first failure at 1 request = 100% = trip
```
---
## Good Example
```php
$breaker = new CircuitBreaker(minRequests: 10, failureThreshold: 50); // needs 10+ requests
```
---
## Exceptions
Very low-traffic integrations where false trips are acceptable.
---
## Consequences Of Violation
Circuit opens on every first failure, negating circuit breaker benefit, causing unnecessary failovers.
## Implement Half-Open for Automatic Recovery
---
## Category
Reliability
---
## Rule
Always configure half-open probing to automatically test and recover from circuit open state.
---
## Reason
Without half-open, a circuit stays open forever, requiring manual operator intervention to restore service.
---
## Bad Example
```php
// Circuit opens — stays open permanently — manual reset required
```
---
## Good Example
```php
$breaker = new CircuitBreaker(
    minRequests: 10,
    failureThreshold: 50,
    resetTimeout: 30, // 30 seconds before half-open
    halfOpenProbes: 1
);
```
---
## Exceptions
When manual recovery is explicitly required for security or compliance.
---
## Consequences Of Violation
Extended downtime after upstream recovers, unnecessary manual intervention, operator fatigue.
## Use Redis for Distributed State
---
## Category
Scalability
---
## Rule
Store circuit breaker state in Redis for multi-worker deployments; never use in-memory or file cache.
---
## Reason
In-memory state is per-process; one worker opens the circuit while another continues hammering the failing service.
---
## Bad Example
```php
private string $state = 'closed'; // per-process — not shared
```
---
## Good Example
```php
public function isAvailable(): bool {
    return Cache::store('redis')->get('circuit:stripe', 'closed') !== 'open';
}
```
---
## Exceptions
Single-worker deployments.
---
## Consequences Of Violation
Each worker independently detects failure, sending requests to a downed service despite other workers having tripped.
## Register Event Listeners on State Transitions
---
## Category
Observability
---
## Rule
Fire events on all circuit state transitions and register listeners for alerting and dashboards.
---
## Reason
State transitions are critical signals requiring immediate awareness; without events, degradation goes undetected.
---
## Bad Example
```php
// State changed silently — no alerting, no logging
```
---
## Good Example
```php
Event::listen(CircuitStateChanged::class, function ($event) {
    Log::channel('circuit')->warning('Circuit state changed', [
        'service' => $event->service,
        'from' => $event->previousState,
        'to' => $event->newState,
    ]);
    if ($event->newState === 'open') {
        Alert::critical("Circuit opened for {$event->service}");
    }
});
```
---
## Exceptions
None — state transitions must always be observable.
---
## Consequences Of Violation
Undetected upstream degradation, delayed incident response, no forensic data for post-mortem analysis.
