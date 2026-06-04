# Saga Pattern with Kafka

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 06-real-time-analytics
- **Knowledge Unit:** saga-pattern-kafka
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

The Saga pattern manages distributed transactions across multiple services or databases without two-phase commit — in analytics contexts, a saga coordinates local transactions across OLTP (PostgreSQL), streaming (Kafka), and OLAP (ClickHouse), ensuring that either all steps complete or compensating transactions undo partial work. Kafka serves as both the communication backbone for saga events and the durable log for saga state.

---

## Core Concepts

- **Saga:** Sequence of local transactions where each has a compensating transaction to undo its effects — alternative to distributed ACID transactions (2PC) suitable for long-running, cross-system workflows
- **Choreography vs Orchestration:** Choreography (each service produces and consumes events independently, no central coordinator, simpler for 2-3 services) vs Orchestration (central saga orchestrator manages workflow, better for 4+ steps)
- **Compensating Transaction:** Reverse operation that undoes the effects of a completed local transaction — example: if ClickHouse aggregation succeeds but WebSocket notification fails, the compensating transaction removes the ClickHouse aggregate
- **Kafka Topic as Saga Log:** Each saga instance emits events to dedicated Kafka topic (or partition by saga ID) — topic serves as durable, replayable saga log — on recovery, saga consumer replays log to determine current state
- **Idempotency Key:** Unique identifier for each saga step — ensures retries don't cause duplicate side effects — each saga step checks the idempotency key before executing

---

## Mental Models

- **Saga as Dance Routine:** A distributed transaction is like a synchronized dance routine — all dancers must complete their moves or the routine fails. 2PC is a strict choreographer who makes everyone wait until all are ready. Saga is a sequence where each dancer completes their move and the next dancer starts. If someone stumbles, the previous dancers perform their "undo" move.
- **Compensation as CTRL+Z:** Each step in a saga has a CTRL+Z (undo). If step 3 fails, you press CTRL+Z for step 2 and then step 1. The CTRL+Z doesn't always perfectly restore the original state — it's a best-effort reversal that leaves the system in a consistent, if not identical, state.

---

## Internal Mechanics

In orchestrated saga, a central state machine tracks each saga instance. When a request starts a saga, the orchestrator emits a STARTED event to Kafka. A step handler consumes the event, performs its local transaction, emits STEP_COMPLETED or STEP_FAILED. The orchestrator consumes the result and either emits the next step or begins compensating transactions. The saga state is persisted to a compacted Kafka topic — on restart, the orchestrator replays the topic to rebuild in-flight saga states. Idempotency keys stored in Redis or a database prevent duplicate execution.

---

## Patterns

- **Design Compensating Transactions First:** Before implementing saga steps, design the compensating transactions — if a step cannot be compensated (e.g., email sent), it should be the last step
- **Use Compacted Kafka Topics for Saga State:** Configure saga state topic with `cleanup.policy=compact` — retains latest state for each saga ID, enabling fast recovery without full log replay
- **Implement Idempotency at Each Step:** Every saga step must be idempotent — executing it twice produces the same result — use idempotency keys stored in Kafka or a database

---

## Architectural Decisions

Use saga pattern for cross-system workflows: OLTP → Stream → OLAP → Notification. Use choreography for simple 2-3 step sagas, orchestration for complex sagas with 4+ steps. Persist saga state to compacted Kafka topics — in-memory state is a single point of failure. Design compensation failure procedures — some compensations may also fail, requiring manual intervention.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| No 2PC overhead (long-running transactions) | Saga overhead: 10-50ms per step | Each Kafka produce/consume cycle adds latency |
| Compensating transactions handle failures | Compensations are expensive | Design to minimize compensation frequency |
| Kafka provides durable saga log | Idempotency key management | Key lookups add 1-5ms per step |
| Works across heterogeneous systems | Compensation failures require manual procedures | Monitor compensation failure rate |

---

## Performance Considerations

Saga overhead adds 10-50ms per step (Kafka produce/consume cycle). Compensating transactions are expensive — design to minimize their frequency. Kafka compaction for saga state adds minimal overhead for < 100K active sagas. Idempotency key lookups add 1-5ms per step (Redis or database read).

---

## Production Considerations

Track saga metrics: active sagas, completed sagas, failed sagas, compensation rate, step duration. Alert on sagas stuck in partial state for > 1 hour. Compensation failures require manual intervention procedures — monitor compensation failure rate, alert on any failure. Document the saga flow including all steps and compensations.

---

## Common Mistakes

- **No Compensating Transaction:** Saga step creates a ClickHouse aggregate entry — next step fails — ClickHouse entry never removed — dashboard shows incorrect data. Better: every saga step must have a compensating transaction, design before implementing forward step.
- **Non-Idempotent Steps:** ClickHouse update step inserts a row — on Kafka rebalance, consumer reprocesses message — duplicate row inserted — saga can't detect duplicate. Better: each step checks idempotency key, use UPSERT semantics.
- **Orchestrator as Single Point of Failure:** Single orchestrator manages all sagas — crashes, all in-flight sagas lost — state was in-memory. Better: persist saga state to compacted Kafka topic, replay on restart.

---

## Failure Modes

- **Compensating Transaction Failure:** Saga fails at step 3, compensation for step 2 also fails — system has partial state with no way to undo. Mitigation: compensation failures require manual intervention, alert on any compensation failure.
- **Step Timeout:** Saga step takes too long — saga considered failed, compensating transactions triggered for previous steps — step eventually succeeds, creating partial state. Mitigation: design timeouts carefully, ensure steps handle late execution gracefully.
- **Kafka Topic Corruption:** Saga state topic compacted incorrectly or corrupted — in-flight saga state lost. Mitigation: backup compacted topics, design for manual saga recovery procedures.

---

## Ecosystem Usage

The saga pattern with Kafka is used in Laravel analytics pipelines that span multiple systems. The `mateusjunges/laravel-kafka` package provides Kafka producer and consumer support. Saga orchestration state machines can be implemented using Laravel's queue system with state tracking in the database or Redis. Compensating transactions are implemented as queue jobs that perform reverse operations.

---

## Related Knowledge Units

### Prerequisites
- Kafka CDC with Debezium — Kafka fundamentals for saga implementation
- Queue Dispatching — Queue-based step execution

### Related Topics
- Circuit Breaker — Circuit breakers in distributed transaction coordination
- Read Models — Saga updates read model state across systems

### Advanced Follow-up Topics
- CQRS — Command/Query responsibility segregation combined with saga patterns
- Data Vault 2.0 — Audit trail requirements for saga compensation tracking

---

## Research Notes

The saga pattern originated from the distributed systems community as an alternative to distributed transactions (2PC). It is particularly relevant for analytics pipelines that span OLTP, streaming, and OLAP systems — environments where 2PC is impractical. The key insight is designing compensating transactions before forward steps and making every step idempotent. Kafka's durable log makes it an ideal backbone for saga state management.
