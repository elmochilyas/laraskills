# Metadata

Domain: Application Architecture Patterns
Subdomain: Communication Patterns and Contracts
Knowledge Unit: Domain events within and across contexts
Knowledge Unit ID: CPC-02
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Domain events capture something meaningful that happened in the domain. Immutable records of past facts. Within a context, events enable internal decoupling. Across contexts, events enable asynchronous integration. Named in past tense (`OrderPlaced`, `PaymentReceived`), contain relevant data, dispatched after change is committed.

---

# Core Concepts

- **Domain event**: "Something happened that matters to the business." Not technical — not "database row inserted."
- **Internal event**: Dispatched and handled within same context. For side effects within a bounded context.
- **Integration event**: Dispatched to other contexts. Must include enough data for consuming context. Self-contained document.

---

# When To Use

- Decoupling side effects from primary operation.
- Cross-context communication.
- Triggering follow-up processes.

---

# When NOT To Use

- Request-response flows (use contracts).
- Operations requiring immediate consistency (use sync contracts).

---

# Best Practices

- **Use past tense naming.** WHY: Events are records of what happened. `OrderShipped`, not `ShipOrder` (that's a command).
- **Dispatch after commit.** WHY: Use `dispatchAfterCommit` to dispatch events after the DB transaction commits. Prevents events for rolled-back changes.
- **Separate internal vs integration events.** WHY: Internal events can carry internal data. Integration events should carry only contract-specified data.
- **Include the aggregate ID in every event.** WHY: Consumers use this to correlate events to aggregates.

---

# Architecture Guidelines

- Domain events defined in the context where they originate.
- Integration events are the contract for cross-context async communication.
- Event class is immutable (readonly properties).
- Event name = past tense verb + noun: `OrderShipped`, `PaymentReceived`.

---

# Performance Considerations

- Sync event dispatching within a context: microseconds.
- Queued integration events: milliseconds to seconds latency.

---

# Security Considerations

- Integration events carry data across context boundaries. Ensure only necessary data is included.

---

# Common Mistakes

1. **Technical events instead of domain events:** Firing `ModelSaved` instead of `OrderShipped`. Cause: convenience. Consequence: consumers couple to technical details. Better: use domain language.

2. **Too many fields:** Including unnecessary data. Cause: over-provisioning. Consequence: consumers depend on these fields, harder to change. Better: minimal event payload.

3. **Dispatching before commit:** Events inside a transaction. Cause: not using `dispatchAfterCommit`. Consequence: rolled-back transactions send events anyway. Better: use `afterCommit`.

---

# Anti-Patterns

- **Event avalanche**: Single event triggers cascade overwhelming consumers.
- **Lost events**: Events dispatched outside a transaction lost on crash.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| DBC-01 Bounded context basics | CPC-03 Sync vs queued events | CPC-09 Event sourcing |
| DBC-12 Eventual consistency | CPC-04 Event design | CPC-10 Outbox pattern |

---

# AI Agent Notes

- Generate domain events in past tense.
- Use `dispatchAfterCommit` by default.
- Separate internal vs integration event classes.

---

# Verification

- [ ] Events named in past tense
- [ ] Events dispatched after DB commit (`dispatchAfterCommit`)
- [ ] Integration events are self-contained
- [ ] Internal and integration events are separate classes
- [ ] Event payloads are minimal (not entire models)
