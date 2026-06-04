# Rules: Saga Pattern Implementation with Kafka for Distributed Analytics Transactions

## Rule SPK-01: Design Compensation First
Every saga step MUST have a compensating transaction designed and implemented before the forward transaction.

## Rule SPK-02: Idempotent Steps Required
Every saga step MUST be idempotent. Idempotency keys must be stored and checked before execution.

## Rule SPK-03: Persist Saga State
Saga state MUST be persisted to a durable store (compacted Kafka topic or database). In-memory-only saga state is forbidden.

## Rule SPK-04: Use Compacted Topics for State
Kafka topics used for saga state MUST use `cleanup.policy=compact` to retain the latest state for each saga ID.

## Rule SPK-05: Monitor Saga Health
Saga metrics MUST be monitored: active count, completion rate, failure rate, compensation rate, and in-flight duration.

## Rule SPK-06: Alert on Stuck Sagas
Sagas that remain in a partial state for > 1 hour MUST trigger an alert requiring manual investigation.

## Rule SPK-07: Document Compensation Failure Procedure
Procedures for handling compensation failures MUST be documented. Manual intervention steps must be clearly defined.

## Rule SPK-08: Choose Choreography or Orchestration Deliberately
The saga coordination pattern (choreography vs orchestration) MUST be explicitly chosen and documented based on saga complexity.

## Rule SPK-09: Log All Saga Transitions
Every saga state transition MUST be logged. The audit trail must enable full saga replay and debugging.

## Rule SPK-10: Test Compensations End-to-End
Compensating transactions MUST be tested end-to-end, including failure recovery scenarios.
