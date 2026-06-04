## Trigger Degraded Mode on Circuit Breaker Open, Not Single Failures
---
## Category
Reliability
---
## Rule
Enter degraded mode only when the circuit breaker transitions to Open state, not on individual request failures or timeouts.
---
## Reason
Single failures are normal transient events; entering degraded mode on every failure causes unnecessary feature degradation and instability.
---
## Bad Example
```php
try { Http::get('/stripe/balance'); }
catch (Exception $e) { $this->enterDegradedMode('stripe'); } // enters on every failure
```
---
## Good Example
```php
Event::listen(CircuitOpened::class, function ($event) {
    $this->enterDegradedMode($event->service);
});
Event::listen(CircuitClosed::class, function ($event) {
    $this->exitDegradedMode($event->service);
});
```
---
## Exceptions
Rate limit headroom exhaustion requires immediate degraded mode entry.
---
## Consequences Of Violation
Thrashing between normal and degraded modes on transient failures, unnecessary feature degradation, user confusion.
## Store Degraded Mode State in Redis
---
## Category
Scalability
---
## Rule
Store degraded mode flags in Redis (shared cache) for consistent state across all application servers.
---
## Reason
In-memory flags are per-server; one server may be in degraded mode while another continues sending requests to a failing upstream.
---
## Bad Example
```php
private bool $degraded = false; // per-server — inconsistent
```
---
## Good Example
```php
public function isDegraded(string $service): bool {
    return Cache::store('redis')->get("degraded:{$service}", false);
}
public function enterDegradedMode(string $service): void {
    Cache::store('redis')->set("degraded:{$service}", true, 600); // 10 min auto-recovery
}
```
---
## Exceptions
Single-server deployments.
---
## Consequences Of Violation
Some servers serve degraded responses while others continue calling a failing upstream, inconsistent user experience.
## Define Clear Degradation Criteria Per Service
---
## Category
Architecture
---
## Rule
Document which features degrade and which remain critical per service when degraded mode is active.
---
## Reason
Without clear criteria, developers guess what to disable, leading to either over-degradation (disabling payment processing) or under-degradation (showing broken components).
---
## Bad Example
```php
// No degradation criteria — unclear what to disable
```
---
## Good Example
```php
public function getAvailableFeatures(string $service): array {
    if ($this->isDegraded($service)) {
        return [
            'payment.create' => true,   // critical — stays on
            'payment.history' => true,  // critical — stays on
            'exchange_rates' => false,  // non-critical — disabled
            'analytics' => false,       // non-critical — disabled
        ];
    }
    return ['all' => true];
}
```
---
## Exceptions
None — always define degradation criteria.
---
## Consequences Of Violation
Critical features disabled unnecessarily, or non-critical features left on and broken, both causing poor user experience.
## Require Consecutive Successes Before Exiting Degraded Mode
---
## Category
Reliability
---
## Rule
Exit degraded mode only after N consecutive successful health checks; never exit on a single success.
---
## Reason
A single success may be a fluke (temporary recovery, lucky routing); exiting degraded mode prematurely re-exposes the system to the failing service.
---
## Bad Example
```php
public function healthCheck(): void {
    if (Http::get('/health')->successful()) {
        $this->exitDegradedMode('stripe'); // single success — premature
    }
}
```
---
## Good Example
```php
public function healthCheck(): void {
    if (Http::get('/health')->successful()) {
        $count = Cache::increment("degraded:recovery:stripe");
        if ($count >= 5) {
            $this->exitDegradedMode('stripe');
            Cache::forget("degraded:recovery:stripe");
        }
    } else {
        Cache::forget("degraded:recovery:stripe"); // reset on failure
    }
}
```
---
## Exceptions
None — always require consecutive successes.
---
## Consequences Of Violation
Mode thrashing on flaky services, repeated degraded mode entry/exit loops, user experience oscillation.
## Track and Alert on Time in Degraded Mode
---
## Category
Observability
---
## Rule
Monitor how long each service spends in degraded mode and alert if exceeded (e.g., >30 minutes).
---
## Reason
Extended degraded mode indicates a persistent upstream problem requiring escalation; without monitoring, degraded mode becomes permanent unnoticed.
---
## Bad Example
```php
// No monitoring — degraded mode may be permanent
```
---
## Good Example
```php
$start = Cache::get("degraded:started:stripe");
if ($start && $start->diffInMinutes(now()) > 30) {
    Alert::critical("Stripe degraded for >30 minutes — escalate");
}
```
---
## Exceptions
None — always monitor degraded mode duration.
---
## Consequences Of Violation
Permanent degraded mode undetected, users receive degraded experience indefinitely, no escalation.
## Communicate Degraded State to Users
---
## Category
Architecture
---
## Rule
Display a visible banner or indicator to users when the application is operating in degraded mode.
---
## Reason
Users need to understand why features are unavailable or data appears stale; without communication, they perceive bugs rather than expected degraded behavior.
---
## Bad Example
```php
// No user-facing indicator — users see missing features as bugs
```
---
## Good Example
```php
@if (resolve(IntegrationHealthService::class)->isDegraded('stripe'))
    <div class="alert alert-warning">
        Currency exchange rates temporarily unavailable.
        Last updated: {{ $lastUpdated }}
    </div>
@endif
```
---
## Exceptions
Internal-facing applications where user communication is unnecessary.
---
## Consequences Of Violation
Users file bug reports for expected degraded behavior, lost trust in application reliability, support team overwhelmed.
## Test Degraded Mode in Staging with Simulated Failures
---
## Category
Testing
---
## Rule
Write integration tests that simulate upstream failures and verify degraded mode entry, behavior, and recovery.
---
## Reason
Untested degraded mode paths fail under real outages; testing ensures fallbacks work correctly and recovery restores full functionality.
---
## Bad Example
```php
// No degraded mode tests — behavior unknown during outages
```
---
## Good Example
```php
public function test_degraded_mode_serves_stale_cache()
{
    Http::fake(['stripe/*' => Http::response(null, 500)]);
    $response = $this->get('/rates');
    $response->assertHeader('X-Degraded-Mode', 'true');
    $response->assertSee('using cached data');
}
```
---
## Exceptions
None — always test degraded mode.
---
## Consequences Of Violation
Fallback paths fail under real pressure, system crashes rather than degrades gracefully, outages are more severe.
