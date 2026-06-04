# Domain Events in Laravel

## Metadata
- **Domain:** Application Architecture Patterns
- **Subdomain:** Layered Architecture Patterns
- **Knowledge Unit:** LAP-08-domain-events
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary
Domain Events decouple domain logic from side effects by recording significant business occurrences as first-class objects. Instead of sending an email inside a domain method, the method dispatches an event — infrastructure listeners handle the email, audit log, search index update, and other side effects independently. In layered architecture, Domain Events occupy a critical boundary: defined in or near the Domain layer as pure business concepts, handled in Infrastructure as side effects.

---

## Core Concepts
- **Domain Event**: A record of a significant business occurrence, named in past tense (`InvoicePaid`), carrying only relevant immutable data — a fact that happened, not a command
- **Event Dispatch**: Publishing a Domain Event so listeners can react; dispatch occurs inside Aggregate methods before persistence
- **Listener**: Infrastructure code that handles a Domain Event — one listener per side effect (email, search index, audit log)
- **Event-Listener Mapping**: Registration connecting each Domain Event to its listeners via EventServiceProvider or Infrastructure Service Provider
- **Idempotency**: Property that processing the same event multiple times produces the same result — essential for reliable event-driven systems
- **Eventual Consistency**: After a Domain Event is dispatched, side effects may happen asynchronously — the system converges over time

---

## Mental Models
1. **Event as Fact, Not Command**: A Domain Event is always past tense — it describes something that already happened (`InvoicePaid`). If the class represents an intention (`PayInvoice`), it is a command, not an event. This distinction is fundamental for event sourcing, replayability, and listener contracts.
2. **Side Effect Decoupling**: The domain method that records the event should have no knowledge of what happens next. The listener is an infrastructure concern that can change without the domain knowing. This is the D in SOLID — Dependency Inversion applied to time and causality.

---

## Internal Mechanics
An Aggregate Root holds an internal array of recorded events. When a domain method like `markAsPaid()` is called, the method validates invariants, mutates state, and appends an `InvoicePaid` event to the event array. After the Repository persists the aggregate, `releaseEvents()` is called to collect all recorded events. Each event is then dispatched through the Laravel event bus. Listener classes receive the event and execute side effects. Queued listeners are dispatched after the database transaction commits via `dispatchAfterCommit`. The event class is a plain PHP object — no Laravel traits, no Eloquent references.

---

## Patterns
### Record-and-Dispatch Pattern
- **Purpose**: Collect events during Aggregate operations, dispatch after persistence
- **Mechanism**: Aggregate records events to internal array; Repository calls `releaseEvents()` after save; Application layer dispatches
- **Benefits**: Events are tied to the transaction that caused them; consistency between state and event recording
- **Tradeoffs**: Requires explicit infrastructure code to dispatch events after persistence

### Listener per Side Effect Pattern
- **Purpose**: Keep each side effect independently testable and configurable
- **Mechanism**: One listener class per side effect (SendInvoiceEmail, UpdateSearchIndex, LogAuditTrail)
- **Benefits**: Independent testing, independent queuing decisions, independent failure handling
- **Tradeoffs**: More listener classes to maintain

---

## Architectural Decisions
- **Choose Domain Events when**: Multiple side effects follow a single domain operation, cross-aggregate communication is needed, audit trails are required, or integration with external systems is needed
- **Choose direct method calls when**: Simple CRUD with no side effects beyond persistence, or side effects must happen atomically in the same transaction
- **Key decision**: Queue non-critical listeners — email, search indexing, and webhooks should be queued; only intra-transaction operations should be synchronous

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Business logic decoupled from side effects | Eventual consistency — side effects may be delayed | Acceptable for most non-transactional operations |
| One listener per side effect enables independent testing | More listener classes to maintain | Each is independently testable and configurable |
| Events can be replayed or used for event sourcing | Requires idempotent listeners | Essential for production reliability |
| Queued events offload processing from web requests | Commit timing matters — dispatchAfterCommit prevents stale data reads | Misordering causes jobs to see uncommitted data |

---

## Performance Considerations
Synchronous Domain Events add latency proportional to the sum of all listener execution times — profile and queue expensive listeners. Queued events offload processing to workers but introduce eventual consistency; the dispatch itself is fast (adding to queue). For high-throughput applications, batch event processing improves throughput by collecting events during a request and dispatching in a single batch. Domain Event serialization for queued dispatch adds negligible overhead.

---

## Production Considerations
Event classes should not contain Laravel-specific traits (`ShouldQueue`, `SerializesModels`) — they should be plain PHP classes. Listener classes belong in Infrastructure. The event-to-listener mapping is an Infrastructure concern. For cross-module or cross-microservice events, consider a separate message bus (RabbitMQ, SQS) rather than in-process events. Ensure listeners are idempotent — network failures, queue retries, and at-least-once delivery mean the same event may be processed multiple times. Never include sensitive data in event payloads.

---

## Common Mistakes
1. **Commands vs Events confusion**: Naming an event as a command (`PayInvoice`) or a command as an event (`InvoicePaymentRequested`). Events are facts; commands are intentions.
2. **Events carrying too much data**: Including full object serialization when listeners only need an ID — large payloads increase serialization cost and queue storage.
3. **Infrastructure leaks into event classes**: Events with `ShouldQueue` trait or Eloquent model references — events should be plain PHP classes.
4. **Listener ordering assumptions**: Listeners depending on other listeners executing first — event processing must be idempotent and independent of execution order.
5. **Forgetting `dispatchAfterCommit`**: Events dispatched inside database transactions may cause listeners to see uncommitted data.

---

## Failure Modes
- **Command-as-Event**: Naming intentions as events causes confusion about whether the event represents a request or a fact
- **Fat Event**: Including full Aggregate state causes serialization performance issues and coupling
- **Event Handler in Domain**: Implementing listener logic in the Domain layer couples domain to infrastructure
- **Event Spam**: Dispatching events for trivial property changes creates noise and performance issues
- **Non-idempotent listeners**: Duplicate event delivery causes incorrect side effects (double emails, duplicate charges)

---

## Ecosystem Usage
Laravel's event system is the primary dispatcher for Domain Events in the same process. Packages like `spatie/laravel-event-sourcing` extend this to event sourcing with projectors and reactors. For cross-service events, Laravel's broadcasting system or direct queue dispatching to SQS/RabbitMQ is used. The `laravel-common` package includes base event dispatching patterns for layered architecture projects.

---

## Related Knowledge Units
### Prerequisites
- LAP-06 Domain-Driven Design
- LAP-02 Clean Architecture
- LAP-04 Dependency Rule

### Related Topics
- CPC-03 Sync vs Queued Events
- CPC-04 Event Design
- CPC-10 Outbox Pattern

### Advanced Follow-up Topics
- CPC-08 CQRS Pattern
- CPC-09 Event Sourcing
- MMD-15 Event Sourcing/CQRS

---

## Research Notes
Generate Domain Events as plain PHP classes with immutable constructor parameters — no Laravel traits. Name events in past tense using Ubiquitous Language. Generate one listener per side effect; default to queued listeners for non-critical side effects. Always include `handle()` and `failed()` methods on listeners. Default to `dispatchAfterCommit` for queued events to avoid uncommitted data reads.
