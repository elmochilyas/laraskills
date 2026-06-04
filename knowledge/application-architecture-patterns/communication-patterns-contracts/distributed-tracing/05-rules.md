# Rules: Distributed tracing across contexts

## Rule 1: Assign a correlation ID at every entry point
---
## Category
Maintainability | Reliability
---
## Generate and assign a correlation ID at every external entry point: HTTP requests, queue jobs, scheduled commands, and CLI commands. Never leave any entry point without correlation ID generation.
---
## Reason
The trace starts at the entry point. Without a correlation ID at every entry, some operations create orphan traces that cannot be linked to the original request. Debugging becomes impossible for those flows.
---
## Bad Example
```php
// Correlation ID on HTTP but NOT on queue jobs
class OrderController
{
    public function placeOrder(Request $request): JsonResponse
    {
        $correlationId = Str::uuid()->toString();
        Log::withContext(['correlation_id' => $correlationId]);

        OrderPlaced::dispatchAfterCommit($order);
        // Event handler loses the correlation ID — no propagation
    }
}

class SendOrderEmail implements ShouldQueue
{
    public function handle(OrderPlaced $event): void
    {
        // No correlation ID set — this flow is untraceable
        Log::info('Sending order email');
    }
}
```
---
## Good Example
```php
// HTTP middleware
class CorrelationIdMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $correlationId = $request->header('X-Correlation-ID')
            ?? Str::uuid()->toString();

        Log::withContext(['correlation_id' => $correlationId]);
        $request->merge(['correlation_id' => $correlationId]);

        return $next($request);
    }
}

// Queue job middleware
class CorrelationIdJobMiddleware
{
    public function handle(Closure $next, object $job): void
    {
        $correlationId = $job->correlationId ?? Str::uuid()->toString();
        Log::withContext(['correlation_id' => $correlationId]);

        $next($job);
    }
}
```
---
## Exceptions
None. Every entry point must have a correlation ID.
---
## Consequences Of Violation
Orphan traces; inability to debug issues in queued flows; operations team cannot trace request paths; incident response time increases.
---

## Rule 2: Propagate correlation ID on every boundary crossing
---
## Category
Architecture
---
## Propagate the correlation ID across every context boundary: events, queue jobs, HTTP calls to other services, and message bus publications. Never break the propagation chain.
---
## Reason
A broken chain loses the trace. Downstream operations cannot be linked to the original request. The trace becomes a collection of disconnected fragments.
---
## Bad Example
```php
class SendEmailHandler implements ShouldQueue
{
    public function handle(OrderPlaced $event): void
    {
        // Correlation ID NOT passed to HTTP call to downstream service
        Http::post('https://email-service/send', [
            'to' => $event->email,
            'template' => 'order-confirmation',
            // Missing: 'X-Correlation-ID' header
        ]);
    }
}
```
---
## Good Example
```php
class SendEmailHandler implements ShouldQueue
{
    public $correlationId;

    public function handle(OrderPlaced $event): void
    {
        Http::withHeaders([
            'X-Correlation-ID' => $this->correlationId, // Propagated
        ])->post('https://email-service/send', [
            'to' => $event->email,
            'template' => 'order-confirmation',
        ]);
    }
}
```
---
## Exceptions
External third-party services that cannot accept custom headers. Log the correlation ID in the outgoing request context for manual correlation.
---
## Consequences Of Violation
Disconnected traces; downstream services cannot be linked to upstream causes; debugging cross-context issues requires manual correlation across multiple log sources.
---

## Rule 3: Automate propagation — never rely on manual passing
---
## Category
Maintainability | Reliability
---
## Use automatic propagation mechanisms (job middleware, event subscribers, HTTP middleware, bus middleware) to pass correlation IDs. Never require developers to manually pass correlation IDs in every event or job.
---
## Reason
Manual propagation depends on developer discipline. In a large codebase, gaps are inevitable — someone will forget. Automated middleware guarantees propagation without developer intervention.
---
## Bad Example
```php
// Manual propagation — every handler must remember to pass it
class OrderPlacedHandler implements ShouldQueue
{
    public function handle(OrderPlaced $event): void
    {
        // Developer must remember to set correlation ID manually
        Log::withContext(['correlation_id' => $event->correlationId]);
        // If forgotten, this handler's logs lack correlation
    }
}
```
---
## Good Example
```php
// Automatic propagation via job middleware
class TraceJobMiddleware
{
    public function handle(Closure $next, object $job): void
    {
        $correlationId = $job->correlationId
            ?? Log::sharedContext()['correlation_id']
            ?? Str::uuid()->toString();

        Log::withContext(['correlation_id' => $correlationId]);

        $next($job);
    }
}

// Registered globally — every job gets automatic propagation
// config/queue.php
'default' => 'redis',
'connections' => [
    'redis' => [
        'driver' => 'redis',
        'queue' => 'default',
        'middleware' => [
            TraceJobMiddleware::class,
        ],
    ],
],
```
---
## Exceptions
None. Always automate propagation.
---
## Consequences Of Violation
Gaps in tracing when developers forget to pass IDs; inconsistent tracing coverage; growing tech debt as manual propagation is never retrofitted.
---

## Rule 4: Use structured logging with correlation ID
---
## Category
Maintainability
---
## Include the correlation ID in every log entry via `Log::withContext()`. Never include the correlation ID via string interpolation in log messages.
---
## Reason
String interpolation buries the correlation ID in the message text, making it impossible to filter, search, or aggregate by ID. Structured logging (`Log::withContext()`) adds the ID as a separate field in structured logs, enabling log aggregation tools to index and filter on it.
---
## Bad Example
```php
// String interpolation — ID buried in message text
Log::info("Order placed with correlation ID: {$correlationId}");
// Cannot filter by correlation ID in log aggregation tools
// Must grep the full message text
```
---
## Good Example
```php
// Structured context — ID as a separate field
Log::withContext(['correlation_id' => $correlationId]);

Log::info('Order placed');
// In log aggregation: filter by correlation_id = "abc-123"
// Find all log entries across all services for this trace
```
---
## Exceptions
CLI commands or scripts where logs are read in raw terminal output and structured logging is not available.
---
## Consequences Of Violation
Cannot efficiently search across logs; manual grepping across services and files; incident response time is significantly longer.
---

## Rule 5: Include causation ID for building causal chains
---
## Category
Maintainability
---
## Include both the correlation ID (tracing the original operation) and the causation ID (identifying the immediate parent event) in every event envelope. Never propagate only the correlation ID without the causation ID.
---
## Reason
The correlation ID links all operations together. The causation ID builds the causal chain — showing which event triggered which downstream event. Without causation IDs, you know events are related but not in what order or hierarchy.
---
## Bad Example
```php
// Only correlation ID — flat trace, no causal hierarchy
readonly class EventEnvelope
{
    public function __construct(
        public string $eventId,
        public string $eventType,
        public string $correlationId,
        // No causationId — cannot build causal tree
        public array $payload,
    ) {}
}
```
---
## Good Example
```php
readonly class EventEnvelope
{
    public function __construct(
        public string $eventId,
        public string $eventType,
        public string $correlationId,
        public ?string $causationId, // Immediate parent event ID
        public array $payload,
    ) {}
}

// When handling an event and publishing a new one:
$newEvent = new EventEnvelope(
    eventId: Str::uuid()->toString(),
    eventType: 'inventory.deducted',
    correlationId: $incoming->correlationId, // Propagate original trace
    causationId: $incoming->eventId,          // Link to immediate parent
    payload: ['productId' => 'ABC', 'qty' => 1],
);

// Resulting causal chain:
// OrderPlaced (correlationId: abc, causationId: null)
//   -> InventoryDeducted (correlationId: abc, causationId: evt_1)
//     -> StockAlertSent (correlationId: abc, causationId: evt_2)
```
---
## Exceptions
At the initial entry point (HTTP request, CLI command), there is no parent — causation ID is null.
---
## Consequences Of Violation
Flat traces without hierarchy; cannot determine which event triggered which; debugging complex cascading workflows requires guesswork.
---

## Rule 6: Apply sampling strategies for high-traffic systems
---
## Category
Performance | Scalability
---
## Use trace sampling in production for high-traffic systems (e.g., trace 1 in 100 requests). Never store traces for every request in high-throughput applications without cost control.
---
## Reason
Trace storage grows proportionally with request volume. For high-traffic systems (10,000+ requests/second), storing every trace is prohibitively expensive. Sampling preserves trace utility while controlling costs.
---
## Bad Example
```php
// Tracing every request in a high-traffic system
class CorrelationIdMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $correlationId = Str::uuid()->toString();
        Log::withContext(['correlation_id' => $correlationId]);

        Trace::start($correlationId); // Traces 100% of requests

        return $next($request);
    }
}
// 10M requests/day * 50 spans/request = 500M spans stored daily
```
---
## Good Example
```php
class CorrelationIdMiddleware
{
    private int $sampleRate; // 1 in N requests sampled

    public function __construct()
    {
        $this->sampleRate = config('tracing.sample_rate', 100);
    }

    public function handle(Request $request, Closure $next): Response
    {
        $correlationId = Str::uuid()->toString();
        Log::withContext(['correlation_id' => $correlationId]);

        if (random_int(1, $this->sampleRate) === 1) {
            Trace::start($correlationId); // Only 1% of requests traced
        }

        return $next($request);
    }
}
```
---
## Exceptions
Low-traffic systems (< 100 requests/second) can trace everything. Always-trace critical paths (payment flows, authentication failures) irrespective of sampling rate.
---
## Consequences Of Violation
Exponential storage cost growth; trace storage budget exceeded; system performance impact from excessive tracing overhead.
---
