# Skill: Design for Cross-Shard Transaction Impossibility

## Purpose

Design data models and application logic to avoid cross-shard transactions by keeping transactionally-related data on the same shard.

## When To Use

- Sharded database architecture
- Application requires transactional guarantees
- Data model design phase

## When NOT To Use

- Non-sharded database (normal transactions work)
- Application can tolerate eventual consistency across shards
- XA-compliant distributed transactions are acceptable (rare)

## Prerequisites

- Understanding of shard key and data relationships
- Knowledge of transactional requirements

## Inputs

- Data model with transactional requirements
- Shard key assignment per entity
- Consistency requirements (ACID vs eventual)

## Workflow (numbered steps)

1. Identify all transactional boundaries: operations that must be atomic
2. For each boundary, ensure all data lives on the same shard:
   - Same shard key for all entities in the transaction
   - If not possible, redesign data model or accept eventual consistency
3. For cross-shard atomic operations:
   - Use Saga pattern: execute local transactions per shard, compensating actions on failure
   - Or use two-phase commit (2PC) with XA (higher complexity, lower performance)
4. For eventually consistent operations:
   - Use queue jobs to process each shard's operation
   - Implement compensating transactions for rollback
5. Document all non-ACID operations and their consistency guarantees

## Validation Checklist

- [ ] All ACID transactions live within a single shard
- [ ] Cross-shard operations use Saga or eventual consistency
- [ ] Compensating transactions implemented for Saga rollback
- [ ] Documentation of consistency guarantees per operation

## Common Failures

- Assuming 2PC solves all cross-shard transaction problems (coordinator failure, lock holding)
- Saga compensating transaction not implemented — data inconsistency
- Eventual consistency window too long — business impact

## Decision Points

- Single-shard ACID vs multi-shard Saga vs 2PC
- Acceptable eventual consistency window

## Performance Considerations

- Single-shard transaction: same performance as non-sharded
- Saga: higher latency (coordinated steps), no locking across shards
- 2PC: high latency, locks held during prepare phase

## Security Considerations

- Compensating transactions may expose data during rollback
- Saga orchestration must be secure (commands, events)

## Related Rules

- 6-9-1: Always Keep Transactional Data On Same Shard
- 6-9-2: Never Use 2PC Without Understanding Coordinator Failure Modes

## Related Skills

- Implement Saga Pattern for Distributed Transactions
- Implement Compensating Transactions
- Implement Fan-Out Queries

## Success Criteria

- All ACID operations completed within a single shard
- Cross-shard operations are eventually consistent with compensating rollback
- Zero distributed transaction failures in production

---

# Skill: Implement Saga Pattern for Cross-Shard Operations

## Purpose

Coordinate multi-shard operations using the Saga pattern: execute local transactions per shard and run compensating actions on failure to maintain eventual consistency.

## When To Use

- Cross-shard operations that need consistency guarantees
- ACID transactions across shards are impossible
- Compensating rollback is acceptable (not a hard rollback)

## When NOT To Use

- Operation fits within a single shard (use normal ACID transaction)
- 2PC required for immediate atomicity (rare)
- Compensating action cannot be implemented (use 2PC)

## Prerequisites

- Understanding of Saga pattern (choreography vs orchestration)
- Compensating transaction implementation for each step
- Message/event infrastructure for Saga coordination

## Inputs

- Saga workflow definition (steps and compensations)
- Shard mapping for each step
- Failure handling strategy

## Workflow (numbered steps)

1. Design Saga workflow:
   - List steps as local transactions on specific shards
   - For each step, define a compensating transaction
2. Implement orchestration (recommended for complex Sagas):
   - Saga orchestrator class with step execution and compensation logic
   - Executes steps in order, tracks completion state
   - On failure, executes compensating transactions in reverse order
3. For each step: execute local transaction on its shard
4. On step failure: run compensations for all completed steps
5. Log Saga state for debugging and recovery
6. Implement Saga recovery (retry failed Saga, handle incomplete Saga)

## Validation Checklist

- [ ] Saga steps execute in correct order
- [ ] Compensating transactions rollback correctly
- [ ] Saga state persisted for recovery
- [ ] Partial Saga failure leaves system in consistent state

## Common Failures

- Compensating transaction fails — system in inconsistent state
- Saga orchestrator is single point of failure (persist state)
- Compensation not truly idempotent — double-compensation causes issues

## Decision Points

- Orchestration (central coordinator) vs Choreography (event-driven)
- Saga state store: database vs Redis vs queue

## Performance Considerations

- Saga latency = sum(step latencies) + message overhead
- Compensation latency = sum(compensation step latencies)
- Persisting Saga state adds I/O per step

## Security Considerations

- Saga state may contain sensitive data — encrypt at rest
- Compensating transactions must maintain access controls

## Related Rules

- 6-9-1: Always Keep Transactional Data On Same Shard

## Related Skills

- Design for Cross-Shard Transaction Impossibility
- Implement Distributed Transactions
- Implement Compensating Transactions

## Success Criteria

- Saga completes successfully for normal path
- Compensating transactions rollback correctly on failure
- System remains in consistent state after partial Saga failure
