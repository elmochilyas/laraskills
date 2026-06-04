# ECC Anti-Patterns — Domain Events in Laravel

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | Layered Architecture Patterns |
| **Knowledge Unit** | Domain Events in Laravel |
| **Generated** | 2026-06-04 |

---

## Anti-Pattern Inventory

1. Command-as-Event
2. Fat Event (Full Aggregate Serialization)
3. Infrastructure Leak in Event Classes
4. Event Handler in Domain Layer
5. Event Spam
6. Synchronous-All Events
7. Missing Idempotency

---

## Repository-Wide Anti-Patterns

- Commands/events confusion
- Fat event payloads
- Non-idempotent event handlers
- Framework traits in domain events
- Listener ordering assumptions

---

## Anti-Pattern 1: Command-as-Event

### Category
Architecture | Event Design

### Description
Naming a Command (intention) as a Domain Event, or using Laravel events to implement command processing. `PayInvoice` is registered as an event, with a listener that actually pays the invoice.

### Why It Happens
Laravel's event system is convenient for dispatching and handling. Developers use it for everything without distinguishing between events (facts) and commands (intentions).

### Warning Signs
- Event names in imperative tense (`PayInvoice`, `SendEmail`)
- Listeners that validate and may reject the event
- Business logic executed in the listener, not in the dispatching code
- Events that can fail and need compensation

### Preferred Alternative
Use past tense for Domain Events (`InvoicePaid`). For commands, use a command bus pattern or explicit method calls. If using events for CQRS, create a separate command bus infrastructure.

### Refactoring Strategy
1. Rename event classes to past tense
2. Move business validation from listeners to domain methods
3. Restructure: the domain method executes the operation and then dispatches the event as a fact

### Related Rules
- Rule: Domain Events Are Past Tense Facts (LAP-08/05-rules.md)

---

## Anti-Pattern 2: Fat Event

### Category
Architecture | Event Design

### Description
Including the full Aggregate object (or complete serialization) in the event payload instead of just identifiers. `InvoicePaid` carries `$invoice` instead of `$invoiceId`.

### Why It Happens
Convenience — the Aggregate is available at the dispatch point, so passing the whole object is easier than extracting fields. Developers worry that listeners will need data not included in identifiers.

### Warning Signs
- Event constructor accepts Entity/Aggregate objects
- Event payload includes nested objects with relationships
- Serialization produces large JSON payloads (>10KB per event)
- Event schema changes when the Aggregate structure changes

### Preferred Alternative
Include only identifiers and a minimal set of essential fields. Listeners that need more data should fetch it through their own infrastructure (Repository calls, query services).

### Refactoring Strategy
1. Replace Aggregate properties with identifiers
2. Add only specific fields that all listeners will need
3. Update listeners to fetch additional data through infrastructure

### Related Rules
- Rule: Events Carry Minimal Required Data (LAP-08/05-rules.md)

---

## Anti-Pattern 3: Infrastructure Leak in Event Classes

### Category
Architecture | Event Design

### Description
Domain Event classes that use Laravel traits (`Dispatchable`, `InteractsWithSockets`, `SerializesModels`) or import framework classes. The events are coupled to Laravel infrastructure.

### Why It Happens
Laravel's documentation and examples use these traits. Developers follow convention without considering architectural implications.

### Warning Signs
- `use Dispatchable;` trait on event classes
- `use SerializesModels;` trait on event classes
- `implements ShouldBroadcast` on domain event classes
- Event classes that use Eloquent model references

### Preferred Alternative
Domain Events should be plain PHP classes with typed constructor parameters. Use a dedicated dispatcher interface in the application layer to dispatch these events without framework coupling.

### Refactoring Strategy
1. Remove all Laravel traits from event classes
2. Create plain constructor parameters using primitives and Value Objects only
3. Update dispatching code to use an application-layer dispatcher or manual Event::dispatch

### Related Rules
- Rule: Events at Domain Boundary (LAP-08/05-rules.md)

---

## Anti-Pattern 4: Event Handler in Domain Layer

### Category
Architecture | Layer Violation

### Description
Implementing event listener/handler logic in the Domain layer. The Domain class handles side effects (email sending, search indexing, notifications) directly.

### Why It Happens
Convenience — the handler is close to the event. Developer is unfamiliar with hexagonal architecture principles.

### Warning Signs
- Listener classes in `Domain/` directory
- Domain classes that `implements ShouldQueue`
- Domain classes using `Mail`, `Queue`, `Notification` facades
- Domain tests that require database or mail fakes

### Preferred Alternative
Listeners belong in the Infrastructure layer. The Domain layer defines the event; Infrastructure implements the response.

### Refactoring Strategy
1. Move listener classes to Infrastructure directory
2. Replace Domain-layer dependencies with infrastructure implementations
3. Register event-listener mapping in infrastructure service provider

### Related Rules
- Rule: Listener in Infrastructure Layer (LAP-08/05-rules.md)

---

## Anti-Pattern 5: Event Spam

### Category
Architecture | Event Design

### Description
Dispatching Domain Events for every minor property change, including internal technical changes that have no business significance.

### Why It Happens
Over-engineering — every state change gets an event. Developer believes more events = better decoupling, without considering maintenance cost.

### Warning Signs
- Hundreds of distinct Domain Event classes
- Events for every property setter
- Listeners that do nothing (no subscribers)
- Event volume exceeds meaningful business occurrences by 10x

### Preferred Alternative
Only dispatch Domain Events for significant business occurrences that multiple listeners care about. Internal state changes with no cross-cutting concerns should not generate events.

### Refactoring Strategy
1. Review all Domain Events with stakeholders
2. Remove events that have no listeners or no business significance
3. Consolidate related events

### Related Rules
- Rule: Domain Events Are Past Tense Facts (LAP-08/05-rules.md)

---

## Anti-Pattern 6: Synchronous-All Events

### Category
Architecture | Performance

### Description
Dispatching all Domain Events synchronously, including non-critical side effects like email sending, search indexing, and webhook delivery.

### Why It Happens
Simpler to implement — no queue infrastructure, no serialization concerns, no eventual consistency complexity. Developer may not be aware of queued dispatch.

### Warning Signs
- No listener implements `ShouldQueue`
- HTTP response times degrade when external services (email, search) are slow
- Front-end requests take 5+ seconds due to synchronous side effects
- External service failures cause HTTP 5xx for the user

### Preferred Alternative
Queue non-critical listeners. Only synchronous listeners that must execute within the same transaction for data consistency.

### Refactoring Strategy
1. Identify listeners that can be async (email, search, webhooks, notifications)
2. Add `implements ShouldQueue` to those listeners
3. Configure queue connection
4. Add monitoring for queue health

### Related Rules
- Rule: Critical Listeners Use Queue (LAP-08/05-rules.md)
