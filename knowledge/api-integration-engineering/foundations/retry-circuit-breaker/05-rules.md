## Stop Retry When Circuit Breaker Is Open
---
## Category
Reliability
---
## Rule
Never retry a request when the circuit breaker is in the Open state; fail fast or use fallback.
---
## Reason
Retrying during Open state wastes resources on guaranteed failures, amplifying load on the failing service.
---
## Bad Example
```php
// Retry middleware retries even when circuit is open
$response = Http::retry(3, 1000)->get('/endpoint');
```
---
## Good Example
```php
if ($circuitBreaker->isAvailable()) {
    $response = Http::retry(3, 1000)->get('/endpoint');
} else {
    return $this->fallback();
}
```
---
## Exceptions
When the circuit breaker is configured to allow limited retries for half-open probing.
---
## Consequences Of Violation
Retry storms on already-degraded services, wasted resources, cascading failures.
## Classify Failures: 5xx Trips Breaker, 4xx Does Not
---
## Category
Reliability
---
## Rule
Configure circuit breakers to count 5xx and network errors as failures; exclude 4xx (except 429) from failure counting.
---
## Reason
4xx errors (400, 401, 403, 404) indicate client-side issues that won't be resolved by stopping requests to the server.
---
## Bad Example
```php
$breaker->recordFailure($response->status()); // counts 401 and 404 as failures
```
---
## Good Example
```php
if ($response->serverError() || $response->failed() && !$response->clientError()) {
    $breaker->recordFailure();
}
```
---
## Exceptions
429 (rate limit) should be handled by rate limiter, not circuit breaker.
---
## Consequences Of Violation
False circuit trips on client errors, blocking valid requests unnecessarily.
## Set Minimum Requests Before Evaluating Failure Rate
---
## Category
Reliability
---
## Rule
Configure a minimum request count (5-10) before the circuit breaker evaluates failure rate.
---
## Reason
On low request volume, a single failure represents 100% rate, causing false circuit trips.
---
## Bad Example
```php
$breaker = new CircuitBreaker(threshold: 50); // first failure at 1 request = 100% = trips
```
---
## Good Example
```php
$breaker = new CircuitBreaker(minRequests: 10, threshold: 50); // needs 10+ requests before evaluating
```
---
## Exceptions
Very low-traffic integrations where false trips are acceptable.
---
## Consequences Of Violation
Circuit opens on every first failure, negating the benefit of the breaker and causing unnecessary failovers.
## Use Redis for Distributed Circuit State
---
## Category
Scalability
---
## Rule
Store circuit breaker state in Redis for multi-worker deployments; never use file or in-memory cache.
---
## Reason
In-memory state is per-process; one worker may open the circuit while another continues hammering the failing service.
---
## Bad Example
```php
$breaker = new InMemoryCircuitBreaker(); // not shared across workers
```
---
## Good Example
```php
$breaker = new RedisCircuitBreaker($redis, 'stripe'); // distributed across workers
```
---
## Exceptions
Single-worker deployments.
---
## Consequences Of Violation
Each worker independently detects and acts on failures, negating circuit breaker's protection.
## Implement Half-Open Probes for Automatic Recovery
---
## Category
Reliability
---
## Rule
Always implement automatic half-open probing after the reset timeout to detect service recovery.
---
## Reason
Without half-open probes, a circuit stays open forever, requiring manual intervention to restore service.
---
## Bad Example
```php
// Circuit opens; no automatic recovery — operator must manually reset
```
---
## Good Example
```php
// Configured half-open: after 30s cooldown, sends one probe request
// If probe succeeds, circuit closes; if fails, returns to open
$breaker = new CircuitBreaker(resetTimeout: 30, halfOpenProbes: 1);
```
---
## Exceptions
When manual recovery is explicitly required for safety reasons.
---
## Consequences Of Violation
Service remains degraded long after upstream recovers, unnecessary manual intervention, extended downtime.
