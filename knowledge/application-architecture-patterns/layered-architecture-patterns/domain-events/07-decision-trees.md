# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Layered Architecture Patterns
**Knowledge Unit:** Domain Events in Laravel
**Generated:** 2026-06-04

---

# Decision Inventory

* Domain Events vs Commands for business operations
* Synchronous vs Async event dispatch
* In-process bus vs Laravel Events vs Message Queue
* Stored Events vs in-memory dispatch for audit
* Event per side effect vs batched side effects

---

# Architecture-Level Decision Trees

---

## Domain Events vs Commands (CQRS)

---

## Decision Context

Both patterns pass messages between components, but with different semantics. Domain Events announce facts that have already happened. Commands express intentions for something to happen. Confusing them creates architectural problems.

---

## Decision Criteria

* performance considerations — no direct difference
* architectural considerations — events are for decoupling; commands are for CQRS
* security considerations — commands can be rejected; events are facts
* maintainability considerations — mixing them creates confusion

---

## Decision Tree

Does this message represent a fact that has already occurred?
↓
YES → Domain Event
    Past tense: InvoicePaid, OrderShipped
    Listeners react, do not reject
NO → Does the message represent an intention to perform an operation?
    YES → Command
        Imperative: PayInvoice, ShipOrder
        Handlers validate and execute; can be rejected
    NO → Neither — re-evaluate message design

---

## Rationale

Domain Events are records of past occurrences. They cannot be rejected. Commands are intentions that can be validated and rejected. If you need the message to be rejectable, it is a command. If it announces a completed operation, it is an event.

---

## Recommended Default

**Default:** Domain Event for announcing occurrences; Command for requesting operations.
**Reason:** Most Laravel applications need events for decoupling side effects. CQRS commands are only needed with command bus patterns.

---

## Risks Of Wrong Choice

Events used as commands: listeners try to validate and reject facts. Commands used as events: handlers treat intentions as immutable records.

---

## Related Rules

- Rule: Domain Events Are Past Tense Facts (LAP-08/05-rules.md)

---

## Related Skills

- Define and Dispatch Domain Events (LAP-08/06-skills.md)

---

## Synchronous vs Async Event Dispatch

---

## Decision Context

Domain Events can be dispatched synchronously (listeners execute in the same process, same request) or asynchronously (listeners execute in a queue worker).

---

## Decision Criteria

* performance considerations — sync adds latency; async offloads to worker
* architectural considerations — sync provides immediate consistency; async provides eventual consistency
* security considerations — no direct difference
* maintainability considerations — sync is simpler to debug; async requires monitoring

---

## Decision Tree

Does the listener need to update state within the same database transaction?
↓
YES → Synchronous dispatch
    Read model projection in same transaction
    Audit log in same transaction
NO → Is the listener critical for the response to be correct?
    YES → Synchronous dispatch
        Example: Update account balance after payment
    NO → Queue the listener
        Email, search indexing, webhooks, notifications

---

## Rationale

Synchronous dispatch is necessary for invariants that must be enforced within the same transaction. Everything else should be queued. The default should be async; only justify sync when transactionality demands it.

---

## Recommended Default

**Default:** Async (queued) dispatch for non-critical side effects.
**Reason:** Keeps response times fast; isolates failures; enables retries.

---

## Risks Of Wrong Choice

Sync for non-critical listeners: slow responses, cascading failures. Async for transaction-critical listeners: inconsistency windows, eventual consistency complexity.

---

## Related Rules

- Rule: Critical Listeners Use Queue (LAP-08/05-rules.md)

---

## Related Skills

- Define and Dispatch Domain Events (LAP-08/06-skills.md)

---

## Laravel Events vs Dedicated Message Queue

---

## Decision Context

Laravel's built-in event system handles in-process and queued events. For distributed systems or cross-service communication, a dedicated message queue (RabbitMQ, SQS, Kafka) may be needed.

---

## Decision Criteria

* performance considerations — Laravel events are fast; message queues add network latency
* architectural considerations — Laravel events are in-process; message queues enable distributed communication
* security considerations — message queues require authentication and encryption
* maintainability considerations — Laravel events are simpler; message queues require infrastructure

---

## Decision Tree

Do events need to cross service/module boundaries to reach listeners in other systems?
↓
YES → Dedicated message queue (RabbitMQ, SQS, Kafka)
    Cross-service communication requires durable, routable messages
NO → Are all listeners within the same Laravel application?
    YES → Laravel Events (EventServiceProvider)
    NO → Dedicated message queue

---

## Rationale

Laravel's event system is designed for in-application event handling. For cross-service or cross-microservice communication, a dedicated message queue provides durability, routing, and delivery guarantees that in-process events cannot offer.

---

## Recommended Default

**Default:** Laravel Events for intra-application events.
**Reason:** Simpler, no additional infrastructure, sufficient for most use cases.

---

## Risks Of Wrong Choice

Message queue for intra-application events: unnecessary infrastructure complexity. Laravel events for cross-service: no durability guarantees, events lost on crash.

---

## Related Skills

- Define and Dispatch Domain Events (LAP-08/06-skills.md)
- Design Event-Driven Integrations via Queue (CPC-03/06-skills.md)
