# Metadata

Domain: Application Architecture Patterns
Subdomain: Domain Boundaries and Bounded Contexts
Knowledge Unit: Multi-context transactions and saga patterns
Knowledge Unit ID: DBC-11
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Overview

Multi-context transactions cannot use ACID transactions because each context owns its data independently. Solution: Saga pattern — a sequence of local transactions where each step publishes an event triggering the next step. If a step fails, compensating transactions undo previous steps. Sagas implement eventual consistency across contexts. Two types: choreographed (events trigger steps) and orchestrated (coordinator manages steps).

---

# Core Concepts

- **Saga**: Sequence of local transactions. Each step commits independently. Failed steps trigger compensating transactions.
- **Choreographed Saga**: Each step publishes event → next step triggered. No central coordinator. Decentralized, flow harder to trace.
- **Orchestrated Saga**: Central coordinator (saga manager) tells each step what to do and handles rollbacks. Better visibility.
- **Compensating transaction**: Undoes a previous step's effect (cancel invoice, refund payment).

---

# When To Use

- Operation spans multiple bounded contexts and must be "eventually consistent."

---

# When NOT To Use

- Single-context operations (use ACID within a context).
- Using ACID across contexts (expensive, fragile, often impossible).

---

# Best Practices

- **Use Sagas for cross-context, ACID for within-context.** WHY: Within a single context, ACID transactions are fine. Sagas are for cross-context operations only. Don't over-engineer.
- **Always include compensating transactions.** WHY: If a step fails, you need to undo previous steps. A saga without compensation leaves the system in an inconsistent state.
- **Choose choreographed for simple workflows.** WHY: Decentralized, good for independent teams. Flow changes are rare.
- **Choose orchestrated for complex workflows.** WHY: Central visibility, explicit error handling, better for workflows with many failure paths.
- **Track saga state in a saga_states table.** WHY: Enables recovery if the saga manager crashes. Store saga type, status, and serialized state.

---

# Architecture Guidelines

- Choreographed: events trigger next step. Event listeners chain the workflow.
- Orchestrated: Saga manager sends commands and handles failures. More code but better observability.
- Within-context operations use standard Laravel `DB::transaction()`.

---

# Performance Considerations

- Sagas are eventually consistent — they don't hold locks across contexts.
- Compensating transactions add latency on failure paths but don't affect success path performance.

---

# Security Considerations

- Compensating transactions must be authorized appropriately. A saga might attempt to refund a payment — ensure it has the right credentials.

---

# Common Mistakes

1. **Using ACID across contexts:** Attempting distributed transaction across context databases. Cause: familiar pattern. Consequence: expensive, fragile. Better: Sagas.

2. **No compensating transactions:** Saga without compensation. Cause: oversight. Consequence: inconsistent state on failure. Better: always include compensation.

3. **Sagas for single-context operations:** Using saga pattern where ACID suffices. Cause: over-engineering. Consequence: unnecessary complexity. Better: ACID within context.

---

# Anti-Patterns

- **Distributed transaction across contexts**: XA transactions or two-phase commit. Fragile and expensive.
- **Saga without state persistence**: Saga state lost on crash — can't recover.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| DBC-07 Cross-context queries | DBC-12 Eventual consistency | CPC-10 Outbox pattern |
| CPC-02 Domain events | MMD-15 Event sourcing CQRS | CPC-09 Event sourcing |

---

# AI Agent Notes

- Default to choreographed Sagas for simple cross-context operations.
- Default to orchestrated Sagas for complex workflows.
- Always generate compensating transactions.
- Persist saga state for recovery.

---

# Verification

- [ ] ACID used within context, Sagas across contexts
- [ ] Compensating transactions exist for each step
- [ ] Saga state is persisted for recovery
- [ ] Choreographed/orchestrated choice is documented
- [ ] No distributed ACID transactions across contexts
