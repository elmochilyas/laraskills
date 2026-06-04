# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 06-real-time-analytics
**Knowledge Unit:** saga-pattern-kafka
**Difficulty:** Intermediate
**Category:** Distributed Systems
**Last Updated:** 2026-06-03

---

# Overview

The Saga pattern manages distributed transactions across multiple services or databases without two-phase commit (2PC). In the analytics context, a saga coordinates a series of local transactions across OLTP (PostgreSQL), streaming (Kafka), and OLAP (ClickHouse) — ensuring that either all steps complete or compensating transactions undo partial work. Kafka serves as both the communication backbone (saga events) and the durable log (saga state).

Engineers must care because Laravel analytics pipelines often span multiple systems: an order creates a transaction in PostgreSQL, triggers a Kafka event for real-time processing, updates a ClickHouse aggregate table, and sends a WebSocket notification. If any step fails, the system must compensate for partial work without two-phase commit overhead.

---

# Core Concepts

## Saga

A sequence of local transactions where each transaction has a compensating transaction to undo its effects. Sagas are an alternative to distributed ACID transactions (2PC) and are suitable for long-running, cross-system workflows.

## Choreography vs Orchestration

**Choreography:** Each service involved in the saga produces and consumes events independently. No central coordinator. Simpler for 2-3 services, but saga flow is harder to trace.

**Orchestration:** A central saga orchestrator (state machine) manages the workflow. Each step emits events that the orchestrator processes to determine the next action. Better for complex sagas with 4+ steps.

## Compensating Transaction

A reverse operation that undoes the effects of a completed local transaction. Example: if ClickHouse aggregation succeeds but WebSocket notification fails, the compensating transaction removes the ClickHouse aggregate (or marks it as inconsistent).

## Kafka Topic as Saga Log

Each saga instance emits events to a dedicated Kafka topic (or partition by saga ID). The topic serves as the durable, replayable saga log. On recovery, the saga consumer replays the log to determine current state.

## Idempotency Key

A unique identifier for each saga step. Idempotent processing ensures that retries (due to Kafka rebalancing or consumer failures) do not cause duplicate side effects. Each saga step checks the idempotency key before executing.

## Saga State Machine

A finite state machine that tracks each saga instance through its lifecycle: STARTED → STEP_1_COMPLETED → ... → COMPLETED or FAILED → COMPENSATING → COMPENSATED. The state is persisted to Kafka (via compacted topic) or a database table.

---

# When To Use

- Cross-system workflows: OLTP → Stream → OLAP → Notification
- Long-running transactions that cannot hold database locks
- Multi-step data ingestion with consistency requirements
- Financial workflows requiring audit trail of all partial states
- Systems where 2PC is impractical (microservices, different database types)

---

# When NOT To Use

- Single-system transactions (use ACID transactions)
- Read-only workflows (no compensation needed)
- Systems where eventual consistency is acceptable without explicit compensation
- High-throughput, simple operations where failure probability is very low

---

# Best Practices

## Design Compensating Transactions First

Before implementing saga steps, design the compensating transactions. If a step cannot be compensated (e.g., email sent), it should be the last step in the saga.

## Use Compacted Kafka Topics for Saga State

Configure the saga state topic with `cleanup.policy=compact`. This retains the latest state for each saga ID, enabling fast recovery without full log replay.

## Implement Idempotency at Each Step

Every saga step must be idempotent: executing it twice produces the same result as executing it once. Use idempotency keys stored in Kafka or a database.

## Monitor Saga Health

Track saga metrics: active sagas, completed sagas, failed sagas, compensation rate, and step duration. Alert on sagas stuck in a partial state for > 1 hour.

---

# Performance Considerations

- Saga overhead adds 10-50ms per step (Kafka produce/consume cycle).
- Compensating transactions are expensive — design to minimize their frequency.
- Kafka compaction for saga state adds minimal overhead for < 100K active sagas.
- Idempotency key lookups add 1-5ms per step (Redis or database read).

---

# Common Mistakes

## Mistake: No Compensating Transaction

A saga step creates a ClickHouse aggregate table entry. The next step fails. The ClickHouse entry is never removed. The dashboard shows incorrect aggregated data.

**Better approach:** Every saga step must have a compensating transaction. Design compensation before implementing the forward step.

## Mistake: Non-Idempotent Steps

The ClickHouse update step inserts a row. On Kafka rebalance, the consumer reprocesses the message. A duplicate row is inserted. The saga cannot detect the duplicate.

**Better approach:** Each step checks an idempotency key before executing. Use UPSERT semantics (ReplacingMergeTree) where possible.

## Mistake: Orchestrator as Single Point of Failure

A single orchestrator service manages all sagas. The orchestrator crashes. All in-flight sagas are lost. Sagas cannot be recovered because state was in-memory.

**Better approach:** Persist saga state to a compacted Kafka topic. On orchestrator restart, replay the state topic to rebuild in-flight saga state.

## Mistake: Compensating Transaction Failure

A saga fails at step 3. The compensation for step 2 also fails. The system has partial state from step 2 with no way to undo it.

**Better approach:** Compensation failures require manual intervention procedures. Monitor compensation failure rate. Alert on any compensation failure.
