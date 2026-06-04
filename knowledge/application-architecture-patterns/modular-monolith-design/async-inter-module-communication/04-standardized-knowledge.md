# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Inter-module asynchronous communication via events
Knowledge Unit ID: MMD-07
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

Asynchronous inter-module communication uses domain events to notify other modules about state changes without requiring an immediate response. Module A dispatches an event (OrderCreated, PaymentReceived). Module B listens and reacts independently. This decouples modules completely — Module A doesn't know Module B exists. Events are the recommended default for most cross-module communication in a modular monolith.

---

# Core Concepts

- **Domain Event**: Record of something significant happening in the domain. Named in past tense. Contains relevant data.
- **Publisher**: Module that dispatches the event. Owns the event class.
- **Subscriber/Listener**: Module that reacts to the event. Receives event data and performs business logic.
- **No direct coupling**: Publisher imports nothing from subscriber — only imports the event class (which it owns).

---

# When To Use

- Module A needs to notify Module B but doesn't need an immediate response
- Default choice for inter-module communication in a modular monolith
- Cross-module communication generally (use sync methods within a module)

---

# When NOT To Use

- Module A needs an immediate response from Module B (e.g., validate payment before completing order — use sync contracts)
- Within a single module (use direct method calls)
- Event count per request exceeds 10 (flow becomes opaque)

---

# Best Practices

- **Queue cross-module events by default.** WHY: Slow listeners (email, reports) block the response if dispatched synchronously. Queuing adds ~1-5ms dispatch time but keeps response fast.
- **Use past tense naming for events.** WHY: Events are records of what happened. `OrderCreated`, not `CreateOrder` (that's a command).
- **Keep event payloads minimal — IDs and changed values only.** WHY: Passing entire Eloquent models creates coupling and serialization issues. Consumers can query for additional data.
- **Document events per module.** WHY: Each module's event list is its async API contract. Other teams need to know what events to subscribe to.
- **Make listeners idempotent.** WHY: Events may be dispatched twice (retries, logic errors). Check if the action was already performed.

---

# Architecture Guidelines

- Publisher defines and dispatches events. Subscriber registers listeners in its service provider.
- Events are the strongest form of module decoupling: no import dependency, no time dependency.
- Sync dispatching runs listeners in the same request; queue dispatching runs in queue worker.
- Use events for cross-module, direct calls for within-module — this is the default guideline.

---

# Performance Considerations

- Sync event handling adds request-time latency. Queue slow listeners.
- Queued dispatch is ~1-5ms overhead (writing to queue). Listener runs async.

---

# Security Considerations

- Events are dispatched within the application security context — no additional security isolation.

---

# Common Mistakes

1. **Events within a single module:** Dispatched and listened to within same module. Cause: over-engineering. Consequence: adds indirection without decoupling benefit. Better: direct method calls.

2. **Too much data in events:** Passing entire Eloquent models. Cause: convenience. Consequence: coupling and serialization issues. Better: IDs and changed values only.

3. **Sync events for slow operations:** Dispatching email-sending events synchronously. Cause: forgetting to use ShouldQueue. Consequence: blocks response until email is sent. Better: queue listeners for slow operations.

---

# Anti-Patterns

- **Event-driven request-response**: Using events to simulate a synchronous RPC call. Use contracts instead.
- **Event explosion**: 10+ events per request makes flow impossible to trace.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| MMD-06 Sync inter-module comm | CPC-02 Domain events | CPC-10 Outbox pattern |
| CPC-03 Sync vs queued events | CPC-04 Event design | CPC-11 Distributed tracing |

---

# AI Agent Notes

- Default to queued events for cross-module communication.
- Keep event payloads minimal — IDs and DTOs, never Eloquent models.
- Generate idempotent listeners with idempotency checks.

---

# Verification

- [ ] Cross-module events are queued by default
- [ ] Event payloads contain IDs and values, not Eloquent models
- [ ] Listeners are idempotent
- [ ] Module events are documented
- [ ] No events used for within-module communication
