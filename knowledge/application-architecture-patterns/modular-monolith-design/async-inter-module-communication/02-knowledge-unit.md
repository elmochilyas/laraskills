# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Inter-module asynchronous communication via events
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Asynchronous inter-module communication uses domain events to notify other modules about state changes without requiring an immediate response. Module A dispatches an event when something significant happens (OrderCreated, PaymentReceived, InvoicePaid). Module B listens for that event and reacts independently. This pattern decouples modules completely—Module A doesn't know Module B exists. Events are the recommended default for most cross-module communication in a modular monolith because they maximize module independence.

---

# Core Concepts

**Domain Event:** A record of something significant that happened in the domain. Named in past tense: `OrderCreated`, `PaymentFailed`, `UserRegistered`. Contains the data relevant to the event.

**Publisher:** The module that dispatches the event. Defines the event class and decides when to dispatch.

**Subscriber (Listener):** The module that reacts to the event. Receives the event data and performs its own business logic.

**No direct coupling:** The publisher does not import anything from the subscriber. It only imports the event class (which it owns) and dispatches it.

---

# Mental Models

**The "Shout Into the Void" model:** Module A broadcasts an event without knowing or caring who receives it. Module B picks it up if interested. Module A and Module B are completely independent.

**The "Fire and Forget" model:** The event dispatch is a side effect. The main operation doesn't wait for listeners to process the event. The user gets a response; listeners process in the background.

**The "Decoupling Layer" model:** Events decouple modules in time (asynchronous) and space (no import dependency). This is the strongest form of module independence.

---

# Internal Mechanics

```php
// Billing module dispatches event
class InvoicePaid {
    public function __construct(
        public readonly string $invoiceId,
        public readonly string $orderId,
        public readonly Money $amount,
    ) {}
}

// In Billing service
event(new InvoicePaid($invoice->id(), $orderId, $invoice->amount()));

// Catalog module listens (in its service provider)
class CatalogServiceProvider extends ServiceProvider {
    public function boot(): void {
        Event::listen(
            \Modules\Billing\Events\InvoicePaid::class,
            \Modules\Catalog\Listeners\UpdateInventory::class,
        );
    }
}
```

---

# Patterns

**Sync vs. queue dispatching:** Events can be dispatched synchronously (listeners run immediately in the same request) or queued (listeners run asynchronously in a queue worker). Queue dispatching should be the default for cross-module events.

**Module-owned events:** Each event class is defined in the event source module. The event class is the contract—its properties form the public API.

**Event documentation:** Each module publishes a list of events it dispatches and their payloads. This is the module's event-driven API contract.

---

# Architectural Decisions

**Use events when:** Module A needs to notify Module B but doesn't need an immediate response. The default choice for inter-module communication in a modular monolith.

**Use synchronous contracts when:** Module A needs an immediate response from Module B (e.g., validate a payment before completing an order).

**Use events for cross-module, sync for within-module:** Within a module, use direct method calls. Across modules, use events. This is the default guideline.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Complete module decoupling | No immediate response | Module A never knows if Module B succeeded |
| Independent module evolution | Event schema management | Changing event payload is a breaking change |
| Async processing possible | Debugging complexity | Tracing across events requires tools (see CPC-11) |
| Easy to add new listeners | Over-use makes flow opaque | 10 events per request = 10 hidden code paths |

---

# Performance Considerations

Synchronous event handling adds request-time latency. For slow listeners (email sending, report generation), use queued events. Queuing adds ~1-5ms to dispatch (writing to queue), but listener runs asynchronously.

---

# Production Considerations

Monitor event processing (numbers, failures, latency). Laravel Horizon provides queue monitoring. For event-level tracing, use distributed tracing (CPC-11).

---

# Common Mistakes

**Events within a single module:** Dispatched and listened to within the same module. Use direct method calls instead—events add indirection without decoupling benefit.

**Too much data in events:** Passing entire Eloquent models as event data. Events should be minimal: IDs and changed values. Consumers can query for additional data if needed.

**Synchronous events for slow operations:** Dispatching email-sending events synchronously. Blocks the response until email is sent. Use queued listeners.

---

# Failure Modes

**Event listener failure:** A listener throws an exception, which propagates to the publisher if synchronous. Use queued listeners with `$tries` and `$backoff` for resilience.

**Duplicate events:** The same event is dispatched twice due to a retry or logic error. Idempotent listeners (checking if the action was already performed) prevent this.

**Missing events:** An event is not dispatched for a state change. Other modules don't react. This causes data inconsistency across modules.

---

# Ecosystem Usage

Laravel's built-in event system (`Event::dispatch`, `event()`) handles both sync and async. Spatie's `laravel-event-sourcing` adds persistence and projection. The `Modulate` package enforces event-only cross-module communication.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| MMD-06 Sync inter-module comm | CPC-02 Domain events | CPC-10 Outbox pattern |
| CPC-03 Sync vs queued events | CPC-04 Event design | CPC-11 Distributed tracing |

---

## Research Notes

The modular monolith pattern has gained significant traction in the Laravel community as a pragmatic alternative to microservices. Shazeed Ul Karim's 2026 guide on modular monoliths with Clean Architecture provides a concrete implementation blueprint using Domain, Application, Infrastructure, and Presentation layers per module. The approach emphasizes keeping business logic away from Laravel framework details, modules communicating through contracts, and dependency direction pointing inward. The 
widart/laravel-modules package remains the most popular module scaffolding tool, while modulate adds enforcement capabilities. Community research consistently shows that 40%+ of microservice implementations would have been better served by a modular monolith, making this pattern the recommended starting architecture for most Laravel teams.
