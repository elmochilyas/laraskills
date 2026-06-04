# Metadata

Domain: Application Architecture Patterns
Subdomain: Communication Patterns and Contracts
Knowledge Unit: Distributed tracing across contexts
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Distributed tracing tracks a request as it crosses bounded contexts, services, and processes. Each request is assigned a correlation ID at entry. Every subsequent event, job, or HTTP call propagates this ID downstream. The aggregated trace provides an end-to-end view of the request's path, timing, and failures. In a modular monolith, tracing is simpler—contexts share a process and a request lifecycle—but still requires explicit ID propagation through events and queues.

---

# Core Concepts

**Trace:** The entire journey of a request from entry point to completion. A trace is composed of spans.

**Span:** A single unit of work within a trace. Each span has a start time, end time, and optional tags (service name, operation, status).

**Correlation ID:** A unique identifier assigned at the request's entry point. Propagated to all downstream operations. Used to correlate logs, events, and metrics for a single request.

---

# Internal Mechanics

```php
class TraceContext {
    public static string $correlationId = '';
    public static string $causationId = '';
}

class OrderController {
    public function place(PlaceOrderRequest $request): JsonResponse {
        // Assign correlation ID at entry
        TraceContext::$correlationId = (string) Str::uuid();

        $command = new PlaceOrder(
            $request->customerId,
            $request->items,
        );

        $this->commandBus->dispatch($command);

        return response()->json(['orderId' => $command->orderId]);
    }
}

class PlaceOrderHandler {
    public function handle(PlaceOrder $command): void {
        // Propagate correlation ID to event
        event(new OrderPlaced(
            orderId: $command->orderId,
            correlationId: TraceContext::$correlationId,
        ));
    }
}

// Queued handler receives correlation ID
class SendEmailHandler implements ShouldQueue {
    public function handle(OrderPlaced $event): void {
        Log::withContext([
            'correlation_id' => $event->correlationId,
        ]);
        // Send email...
    }
}
```

---

# Patterns

**Middleware-based trace initialization:** Apply middleware to assign the trace and span context at entry:
```php
class TraceMiddleware {
    public function handle($request, Closure $next): mixed {
        TraceContext::$correlationId = $request->header('X-Correlation-Id')
            ?? (string) Str::uuid();
        TraceContext::$causationId = (string) Str::uuid();
        return $next($request);
    }
}
```

**Structured logging with correlation ID:** Every log entry includes the correlation ID. Use Laravel's `Log::withContext()`:
```php
Log::withContext(['correlation_id' => TraceContext::$correlationId]);
Log::info('Order placed', ['order_id' => $order->id]);
```

**Automatic propagation:** Ensure every queued job and event handler propagates the correlation ID automatically. Use a job middleware or event subscriber.

---

# Architectural Decisions

**Correlation ID at entry:** Every external entry point (HTTP request, queue message, CLI command) gets a correlation ID. The trace starts here.

**Propagate on every boundary:** Every context boundary, message bus call, or queue push must propagate the correlation ID. Breaking the propagation chain loses the trace.

---

# Tradeoffs

| Benefit | Cost |
|---|---|
| End-to-end request visibility | Every event/job must propagate IDs |
| Faster debugging across contexts | Storage cost for trace data |
| Performance bottleneck detection | Trace tooling infrastructure |

---

# Common Mistakes

**No propagation:** Correlation ID is assigned at the HTTP boundary but not passed to queued events. The event handler logs are disconnected from the request.

**Manual propagation everywhere:** Developers must remember to pass the correlation ID in every event. Leads to gaps. Use automatic propagation (job middleware, event subscribers).

**No structured logging:** Correlation IDs are logged but not in a structured field. Filtering and searching become manual and error-prone.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| CPC-04 Event design (correlation/causation IDs) | CPC-05 Message bus | AEG-06 Observability |
| CPC-03 Sync vs queued events | DBC-07 Cross-context queries | AEG-08 Monitoring dashboards |

---

## Mental Models

**The "Contract as API" model:** A contract between contexts is like a public API. The contract defines what you can do and what you get back. The implementation behind the contract can change as long as it satisfies the contract.

**The "Message as Document" model:** In event-driven communication, each event/message is a self-contained document that carries all necessary data. The consumer should not need to query the producer for additional context.

**The "Versioned Handshake" model:** Consumer and producer agree on a contract version. When the contract changes, both sides upgrade independently, with backward compatibility maintained during the transition.

---

## Performance Considerations

Communication pattern choice has significant performance implications. Synchronous in-process method calls between modules add microseconds. Synchronous HTTP calls between services add milliseconds (2-50ms). Queued event communication adds latency (milliseconds to seconds) but improves request-time performance by offloading work. The outbox pattern adds a database write per event but prevents duplicate processing. Circuit breakers add negligible overhead when healthy but protect system stability during failures.

---

## Production Considerations

In production, communication contracts must be discovered, versioned, and monitored. Use API documentation (OpenAPI/Swagger) for HTTP contracts. For event contracts, maintain a schema registry. Monitor dead-letter queues for failed message delivery. Implement circuit breakers for cross-service calls. Use health checks to detect contract violations. Alert on unusual patterns (high retry counts, increased latency). Contract testing in CI prevents incompatible changes from reaching production.

---

## Failure Modes

**Silent contract violation:** Producer changes a contract (adds a required field) without versioning. Consumers break silently. Mitigation: contract testing in CI.

**Event avalanche:** A single event triggers a cascade of downstream processing that overwhelms consumers. Mitigation: circuit breakers, rate limiting, async processing with backpressure.

**Lost events:** Events dispatched outside a transaction that are lost on crash. Mitigation: transactional outbox pattern ensures at-least-once delivery.

---

## Ecosystem Usage

Laravel built-in event system provides synchronous event handling. Laravel Queues (Redis, SQS, Database) provide async event handling. spatie/laravel-event-sourcing provides event sourcing infrastructure. dnakitare/laravel-outbox implements the transactional outbox pattern. RabbitMQ and Kafka adapters are available for Laravel. The Ecotone framework provides a full messaging layer with CQRS, event sourcing, and distributed bus capabilities.

---

## Research Notes

Research in 2025-2026 highlights the outbox pattern as the most reliable approach for event-driven communication in Laravel. The community increasingly recognizes that distributed system complexity is often underestimated. The Saga pattern for distributed transactions is gaining attention as an alternative to two-phase commit. Contract testing (consumer-driven contracts) is becoming standard practice for teams with multiple bounded contexts.
