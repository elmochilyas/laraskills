# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Event-Driven Architecture
**Knowledge Unit:** Choreography vs orchestration in event-driven systems
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Choreography vs orchestration for a workflow
* Decision 2: Stateful vs stateless orchestrator
* Decision 3: Saga compensation handling strategy
* Decision 4: Ordered vs unordered event delivery assumptions

---

# Architecture-Level Decision Trees

---

## Decision: Choreography vs Orchestration for a Workflow

---

## Decision Context

Choose the coordination pattern for a multi-step distributed business process.

---

## Decision Criteria

* performance considerations: choreography has lower latency (no coordinator hop); orchestration adds per-step coordination overhead
* architectural considerations: orchestration centralizes workflow logic for visibility; choreography distributes it for autonomy
* security considerations: orchestration centralizes auth decisions; choreography requires per-service auth
* maintainability considerations: orchestration is easier to debug and modify; choreography scales better with team autonomy

---

## Decision Tree

Does the workflow have more than 3 steps?
↓
YES → Does the workflow have branching logic (conditional paths, loops)?
    YES → Orchestration (central coordinator manages branching; choreography's event chains become unreadable)
    NO → Does the workflow require compensating transactions on failure?
        YES → Orchestration (coordinator issues compensations in reverse order reliably)
        NO → Is distributed tracing already implemented across all services?
            YES → Choreography possible with monitoring (tracing provides visibility)
            NO → Orchestration (without tracing, choreography is a black box)
NO → Does any step require compensating actions?
    YES → Does the compensation need to be coordinated across multiple services?
        YES → Orchestration (compensation orchestration prevents partial rollback)
        NO → Choreography with idempotent compensations per service
    NO → Are all steps linear and order-independent?
        YES → Choreography (simplest pattern for linear, non-compensating flows)
        NO → Choreography possible but add monitoring (simple branching manageable)
    ↓
    Are the teams autonomous and experienced with event-driven patterns?
    YES → Choreography (teams own their workflow pieces independently)
    NO → Orchestration (central coordination reduces cognitive load on teams)

---

## Rationale

Choreography scales well and gives teams autonomy but becomes hard to trace and debug as complexity grows. Orchestration centralizes coordination for visibility and reliability at the cost of a single coordination point. The threshold is typically 3+ steps with branching or compensation needs.

---

## Recommended Default

**Default:** Start with choreography for simple linear workflows; escalate to orchestration at the first sign of complexity (branching, compensation, or debug difficulty).

**Reason:** Choreography has lower initial complexity and fewer infrastructure requirements. Orchestration introduces a new service that must be built, deployed, and monitored.

---

## Risks Of Wrong Choice

Choreography for complex flows: hard-to-debug failures, lost saga state, incomplete compensations. Orchestration for simple flows: unnecessary coordinator service, added latency for straight-line processes.

---

## Related Rules

- Rule 1: Prefer choreography for simple workflows; switch to orchestration when complexity requires visibility
- Rule 3: Use orchestrators for sagas that require compensating transactions

---

## Related Skills

- Choose Between Choreography and Orchestration
- Implement Event Bus Patterns

---

## Decision: Stateful vs Stateless Orchestrator

---

## Decision Context

Decide whether the orchestrator should hold workflow state in-memory or in an external durable store.

---

## Decision Criteria

* performance considerations: in-memory state is faster; external store adds per-step latency for read/write
* architectural considerations: external store survives restarts; in-memory state is lost on crash
* security considerations: external store can encrypt state; in-memory state lives in process heap
* maintainability considerations: external store enables debugging via data inspection; in-memory state is opaque

---

## Decision Tree

Can the orchestrator safely restart from scratch on failure without data loss?
↓
YES → Is the workflow idempotent (re-running from start produces same result)?
    YES → Stateless orchestrator acceptable (crash → retry entire workflow)
    NO → Is the workflow short-lived (< 1 second) and reliably executed?
        YES → Stateless orchestrator acceptable (low chance of crash during execution)
        NO → Stateful orchestrator with external persistence (prevent partial execution)
NO → Stateful orchestrator required (survive restarts and crashes)
    ↓
    Is the state store a database that the orchestrator already uses?
    YES → Use existing database (SagaState table; low operational overhead)
    NO → Is workflow throughput high (> 1000 sagas/second)?
        YES → Consider dedicated state store (Redis, DynamoDB) for performance
        NO → Use existing database (simpler, no additional infrastructure)
    ↓
    Is the workflow long-running (hours/days)?
    YES → Stateful orchestrator with persistent saga log (survive deployments too)
    NO → Stateful orchestrator with process memory backed by DB snapshot

---

## Rationale

Stateless orchestrators are simpler but lose workflow state on restart. Even with retry logic, workflows with side effects (emails sent, payments captured) cannot be safely re-run from scratch. Stateful orchestrators that persist state to a database survive crashes and deployments.

---

## Recommended Default

**Default:** Stateful orchestrator with saga state in the application database.

**Reason:** The cost of a `saga_states` table is negligible. The risk of in-memory state loss causing stuck workflows or duplicate side effects is significant.

---

## Risks Of Wrong Choice

Stateless orchestrator: lost workflow state on crash, partial executions, manual recovery needed. Stateful orchestrator without cleanup: unbounded saga state table growth.

---

## Related Rules

- Rule 2: Orchestrators must be stateless event handlers, not stateful services
- Rule 3: Use orchestrators for sagas that require compensating transactions

---

## Related Skills

- Choose Between Choreography and Orchestration

---

## Decision: Saga Compensation Handling Strategy

---

## Decision Context

Choose how to implement compensating actions when a saga step fails.

---

## Decision Criteria

* performance considerations: compensating transactions add processing time proportional to steps rolled back
* architectural considerations: centralized compensation is reliable but creates coupling; distributed compensation is autonomous but hard to coordinate
* security considerations: compensations may need elevated permissions to reverse actions
* maintainability considerations: centralized compensation is easier to audit and test

---

## Decision Tree

Does the workflow have more than 2 steps with compensations?
↓
YES → Centralized compensation via orchestrator (coordinator issues compensations in reverse order)
    ↓
    Are compensations idempotent (running twice is safe)?
    YES → Simple reverse-order compensation (each step has a corresponding undo action)
    NO → Add idempotency to compensations (track compensation state per step)
NO → Are compensations independent per service (each service can undo its own action)?
    YES → Distributed compensation via choreography (services listen for failure events)
    ↓
    Can services detect out-of-order or missing compensations?
    YES → Distributed safe (each service handles its rollback independently)
    NO → Add compensation coordinator (lightweight: just tracks compensation completeness)
NO → Does the failure need to be escalated if compensations fail?
    YES → Add dead letter handling for failed compensations (alert, manual intervention)
    NO → Log and ignore (non-critical workflows where partial state is acceptable)
    ↓
    Is the workflow financial or compliance-relevant?
    YES → Centralized with audit trail (every compensation step logged and verifiable)
    NO → Centralized sufficient (log errors, alert on failure)

---

## Rationale

Centralized compensation via orchestrator is the most reliable pattern — the coordinator knows exactly which steps completed and issues compensations in reverse order. Distributed compensation via choreography works only when each service can independently detect and handle failures, which is harder to guarantee.

---

## Recommended Default

**Default:** Centralized compensation via orchestrator for any saga with compensating transactions.

**Reason:** Distributed compensations are harder to verify and debug. Centralizing compensation logic in the orchestrator makes the rollback path observable and testable.

---

## Risks Of Wrong Choice

No compensation: partial state, data inconsistency, manual reconciliation. Distributed compensation without coordination: out-of-order or incomplete rollbacks.

---

## Related Rules

- Rule 3: Use orchestrators for sagas that require compensating transactions

---

## Related Skills

- Choose Between Choreography and Orchestration
- Implement Dead Letter Handling

---

## Decision: Ordered vs Unordered Event Delivery Assumptions

---

## Decision Context

Decide whether to design event consumers assuming ordered delivery or to handle out-of-order events explicitly.

---

## Decision Criteria

* performance considerations: ordered delivery limits throughput (partition contention); unordered allows higher parallelism
* architectural considerations: ordered delivery simplifies consumer logic; unordered requires idempotent, state-based consumers
* security considerations: unordered delivery with state-based checks can prevent certain race conditions
* maintainability considerations: ordered delivery assumptions create hidden coupling to broker configuration

---

## Decision Tree

Is the message broker configured for ordered delivery (Kafka partition, RabbitMQ single consumer)?
↓
YES → Can you guarantee that the ordering configuration will not change?
    YES → Can events for the same entity always arrive on the same partition?
        YES → Ordered delivery assumption (simpler consumer logic)
        NO → Handle out-of-order events regardless (ordering not guaranteed per entity)
    NO → Handle out-of-order events (configuration changes or migration may break ordering)
NO → Handle out-of-order events (no ordering guarantee)
    ↓
    Are events within the same aggregate stream?
    YES → Is ordering critical for state consistency (e.g., OrderPlaced before OrderShipped)?
        YES → Add sequence number to events; consumer rejects or reorders out-of-sequence events
        NO → State-based consumers (check current state; ignore events that don't apply)
    NO → Cross-aggregate events: ordering never matters
    ↓
    Is idempotency already implemented (event ID deduplication)?
    YES → Out-of-order handling via state checks+idempotency (most robust approach)
    NO → Implement idempotency first; then add state-based out-of-order handling

---

## Rationale

Ordered delivery is a performance optimization, not a correctness guarantee. Consumers that assume ordered delivery break when broker topology changes, partitions rebalance, or events are retried. Designing for out-of-order delivery from the start produces more robust consumers.

---

## Recommended Default

**Default:** Design consumers for out-of-order events using idempotency keys and state-based logic. Treat ordered delivery as a performance optimization, not a correctness guarantee.

**Reason:** Out-of-order events happen in every distributed system — partition rebalances, retries, network delays. Consumers that assume ordering fail in ways that are hard to reproduce and debug.

---

## Risks Of Wrong Choice

Ordered delivery assumption: consumer breaks on partition rebalance or retry, data corruption. Out-of-order handling without idempotency: duplicate processing, but at least ordering-agnostic.

---

## Related Rules

- Rule 4: Choreography services must not assume order of event delivery
- Rule 5: Monitor choreographed workflows with end-to-end distributed tracing

---

## Related Skills

- Choose Between Choreography and Orchestration
- Implement Event Bus Patterns
