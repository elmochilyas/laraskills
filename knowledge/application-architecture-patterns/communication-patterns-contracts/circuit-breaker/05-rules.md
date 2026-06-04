# Rules: Circuit breaker pattern

## Rule 1: Wrap all synchronous cross-context calls with a circuit breaker
---
## Category
Reliability | Scalability
---
## Always wrap synchronous calls to downstream bounded contexts in a circuit breaker. Never let a downstream failure cascade to upstream callers.
---
## Reason
Without a circuit breaker, if Context B is down, every request to Context A waits for the full timeout. Under load, connections pile up and Context A also becomes unavailable — cascading failure. The circuit breaker fails fast.
---
## Bad Example
```php
class OrderService
{
    public function __construct(
        private BillingService $billing, // Direct dependency — no circuit breaker
    ) {}

    public function placeOrder(array $data): Order
    {
        // If BillingService is down, this blocks until timeout
        $this->billing->charge($data['amount']);
        // ...
    }
}
```
---
## Good Example
```php
class OrderService
{
    public function __construct(
        private CircuitBreaker $billingBreaker,
        private BillingService $billing,
    ) {}

    public function placeOrder(array $data): Order
    {
        $result = $this->billingBreaker->call(
            fn: fn() => $this->billing->charge($data['amount']),
            fallback: fn() => $this->fallbackCharge($data),
        );
        // ...
    }
}
```
---
## Exceptions
Asynchronous message passing (queues) does not need circuit breakers — the queue itself provides resilience.
---
## Consequences Of Violation
Cascading failures across contexts; system-wide degradation when one service fails; all upstream contexts become unavailable.
---

## Rule 2: Implement all three circuit states
---
## Category
Reliability
---
## Always implement all three circuit breaker states: closed (normal), open (fail-fast), and half-open (recovery testing). Never skip the half-open state.
---
## Reason
Without half-open, a circuit that opens never recovers automatically. Manual intervention is required every time a downstream service goes down and comes back. Half-open allows automatic recovery by testing the downstream with limited requests.
---
## Bad Example
```php
class BasicBreaker
{
    private bool $open = false;

    public function call(callable $operation, callable $fallback): mixed
    {
        if ($this->open) {
            return $fallback(); // Never tests recovery!
        }

        try {
            return $operation();
        } catch (ConnectionException) {
            $this->open = true; // Opens but never closes again
            return $fallback();
        }
    }
}
```
---
## Good Example
```php
enum CircuitState: string
{
    case Closed = 'closed';
    case Open = 'open';
    case HalfOpen = 'half-open';
}

class CircuitBreaker
{
    private CircuitState $state = CircuitState::Closed;
    private int $failureCount = 0;
    private ?CarbonImmutable $openedAt = null;

    public function call(callable $operation, callable $fallback): mixed
    {
        if ($this->state === CircuitState::Open) {
            if ($this->shouldAttemptRecovery()) {
                $this->state = CircuitState::HalfOpen;
            } else {
                return $fallback();
            }
        }

        try {
            $result = $operation();
            if ($this->state === CircuitState::HalfOpen) {
                $this->state = CircuitState::Closed; // Recovery succeeded
            }
            $this->failureCount = 0;
            return $result;
        } catch (ConnectionException) {
            $this->failureCount++;
            if ($this->failureCount >= $this->threshold) {
                $this->state = CircuitState::Open;
                $this->openedAt = CarbonImmutable::now();
            }
            if ($this->state === CircuitState::HalfOpen) {
                $this->state = CircuitState::Open; // Recovery failed
            }
            return $fallback();
        }
    }

    private function shouldAttemptRecovery(): bool
    {
        return $this->openedAt !== null
            && $this->openedAt->addSeconds($this->timeout)->isPast();
    }
}
```
---
## Exceptions
If manual circuit recovery is an explicit operational requirement (e.g., requires human verification).
---
## Consequences Of Violation
Circuit opens and never recovers automatically; operations team must manually reset circuits; service remains degraded longer than necessary.
---

## Rule 3: Always provide fallback responses
---
## Category
Reliability | User Experience
---
## When the circuit is open, always return a fallback response (cached data, default value, degraded experience) instead of failing the request entirely.
---
## Reason
The user gets degraded but functional service rather than an error. A cached product listing, a default shipping estimate, or a "try again later" message is better than a 500 error.
---
## Bad Example
```php
class ProductController
{
    public function show(string $id): JsonResponse
    {
        $product = $this->breaker->call(
            fn: fn() => $this->inventory->getProduct($id),
            fallback: fn() => throw new ServiceUnavailableException(), // Still fails!
        );
        return response()->json($product);
    }
}
```
---
## Good Example
```php
class ProductController
{
    public function show(string $id): JsonResponse
    {
        $product = $this->breaker->call(
            fn: fn() => $this->inventory->getProduct($id),
            fallback: fn() => Cache::get("product:$id"), // Degraded but functional
        );

        if ($product === null) {
            return response()->json([
                'error' => 'Product info temporarily unavailable',
                'id' => $id,
            ], 503);
        }

        return response()->json($product);
    }
}
```
---
## Exceptions
Operations where no acceptable fallback exists (e.g., payment processing). In such cases, fail explicitly with clear messaging.
---
## Consequences Of Violation
Every circuit open results in a hard failure; user-facing errors; lost revenue during downstream outages.
---

## Rule 4: Monitor and alert on circuit state changes
---
## Category
Reliability | Maintainability
---
## Log every circuit state transition and expose circuit states via health checks. Alert operations when a circuit opens.
---
## Reason
The operations team needs to know when a circuit opens so they can investigate the downstream service. Without monitoring, circuits can remain open indefinitely without anyone noticing degraded behavior.
---
## Bad Example
```php
class CircuitBreaker
{
    public function call(callable $operation, callable $fallback): mixed
    {
        // State changes happen silently — no logging, no metrics
        if ($this->state === CircuitState::Open) {
            return $fallback();
        }
        // ...
    }
}
```
---
## Good Example
```php
class CircuitBreaker
{
    public function call(callable $operation, callable $fallback): mixed
    {
        if ($this->state === CircuitState::Open) {
            if ($this->shouldAttemptRecovery()) {
                Log::info('Circuit attempting recovery', [
                    'service' => $this->serviceName,
                    'state' => 'closed->half-open',
                ]);
                $this->state = CircuitState::HalfOpen;
            } else {
                Metrics::increment("circuit.rejected", ['service' => $this->serviceName]);
                return $fallback();
            }
        }
        // ...
    }

    public function getState(): array
    {
        return [
            'service' => $this->serviceName,
            'state' => $this->state->value,
            'failure_count' => $this->failureCount,
            'opened_at' => $this->openedAt,
        ];
    }
}

// Health check endpoint
Route::get('/health/circuit-breakers', function () {
    return response()->json([
        'billing' => app('circuit-breaker.billing')->getState(),
        'inventory' => app('circuit-breaker.inventory')->getState(),
    ]);
});
```
---
## Exceptions
None. Monitoring is mandatory for operational visibility.
---
## Consequences Of Violation
Degraded service goes unnoticed; circuits remain open for extended periods; downstream failures resolved but upstream still falling back; revenue loss undetected.
---

## Rule 5: Tune thresholds per service
---
## Category
Reliability | Maintainability
---
## Set failure thresholds and timeouts individually for each downstream service based on its failure characteristics. Never use a single global threshold.
---
## Reason
A transient spike in failures on one service trips the circuit if the threshold is too low. Conversely, a chronically flaky service with too high a threshold causes excessive user-facing failures. Each service needs tailored settings.
---
## Bad Example
```php
// Global settings applied to all services
'circuit_breaker' => [
    'threshold' => 5,   // Same for all services
    'timeout' => 30,    // Seconds — same for all
],
```
---
## Good Example
```php
// Per-service configuration
'circuit_breaker' => [
    'services' => [
        'billing' => [
            'threshold' => 3,      // Billing is critical — trip fast
            'timeout_seconds' => 60,
        ],
        'inventory' => [
            'threshold' => 10,     // Inventory has transient spikes
            'timeout_seconds' => 30,
        ],
        'shipping' => [
            'threshold' => 5,
            'timeout_seconds' => 120, // Shipping API is slow
        ],
    ],
],
```
---
## Exceptions
In early development stages, a single global threshold is acceptable but must be replaced with per-service tuning before production.
---
## Consequences Of Violation
Overly sensitive circuits cause unnecessary fallbacks; overly permissive circuits allow cascading failures; operational tuning is impossible without per-service granularity.
---
