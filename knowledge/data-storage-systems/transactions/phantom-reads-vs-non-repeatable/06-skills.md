# Skill: Distinguish and Prevent Phantom Reads vs Non-Repeatable Reads

## Purpose

Understand the difference between non-repeatable reads (same row, different value) and phantom reads (same query, different row set), and choose the appropriate isolation level or locking to prevent them.

## When To Use

- Debugging concurrency anomalies in application
- Choosing isolation level for consistent reads within a transaction
- Preventing phantom rows from affecting business logic
- Ensuring consistent query results within a report or batch job

## When NOT To Use

- Single-statement queries (no transaction needed)
- READ COMMITTED is sufficient and anomalies are acceptable
- Application doesn't require repeatable query results

## Prerequisites

- Understanding of isolation levels (READ COMMITTED, REPEATABLE READ, SERIALIZABLE)
- Database platform (MySQL vs PostgreSQL)

## Inputs

- Query pattern (single row lookup vs range/aggregate query)
- Observed anomaly (re-read shows different value or different rows)
- Isolation level requirement

## Workflow (numbered steps)

1. Identify the anomaly type:
   - **Non-repeatable read**: Same row queried twice in same transaction gives different values
     - Cause: another transaction UPDATED the row between reads
     - Prevention: REPEATABLE READ (prevents via MVCC snapshot)
   - **Phantom read**: Same query executed twice returns different row set
     - Cause: another transaction INSERTED/DELETED rows between queries
     - Prevention: REPEATABLE READ (PostgreSQL via SI, MySQL via next-key locks on index)

2. Choose prevention strategy:
   - If both anomalies must be prevented:
     - PostgreSQL: use REPEATABLE READ (snapshot isolation prevents both)
     - MySQL: use REPEATABLE READ (prevents non-repeatable via MVCC, phantoms for locking reads via next-key locks)
   - If only non-repeatable reads must be prevented: REPEATABLE READ is sufficient
   - If full serializability is needed (prevent all anomalies including write skew): use SERIALIZABLE

3. Test with concurrent transactions:
   - Open two sessions
   - Session 1: BEGIN, SELECT
   - Session 2: UPDATE or INSERT same data, COMMIT
   - Session 1: SELECT again — observe whether value or row set changed

4. For MySQL, protect against phantoms with locking reads:
   ```sql
   SELECT * FROM orders WHERE status = 'pending' FOR UPDATE;
   -- Next-key locks prevent INSERT of new pending orders
   ```

## Validation Checklist

- [ ] Non-repeatable reads prevented at chosen isolation level
- [ ] Phantom reads prevented at chosen isolation level
- [ ] PostgreSQL REPEATABLE READ prevents both (snapshot isolation)
- [ ] MySQL REPEATABLE READ prevents both (next-key locks for locking reads)
- [ ] SELECT ... FOR UPDATE used where phantom prevention is critical
- [ ] Anomaly testing confirmed prevention works

## Common Failures

- Expecting REPEATABLE READ to prevent write skew (it doesn't — use SERIALIZABLE)
- MySQL: phantom prevention only works for locking reads (FOR UPDATE/SHARE), not plain SELECT
- PostgreSQL: REPEATABLE READ prevents both for plain SELECT and locking reads
- Confusing non-repeatable read (same row) with phantom read (different rows)
- Testing at READ COMMITTED and expecting phantoms to be prevented

## Decision Points

- REPEATABLE READ vs SERIALIZABLE: anomaly prevention vs concurrency
- PostgreSQL vs MySQL: REPEATABLE READ semantics differ
- Plain SELECT vs SELECT FOR UPDATE: locking for phantom prevention

## Performance Considerations

- REPEATABLE READ: snapshot overhead (MVCC), no additional locks for plain SELECT
- REPEATABLE READ with FOR UPDATE: next-key locks (MySQL) add contention
- SERIALIZABLE: highest overhead, avoids both anomalies but reduces concurrency
- PostgreSQL REPEATABLE READ: efficient snapshot isolation for both anomaly types

## Security Considerations

- Anomaly prevention doesn't affect access controls
- Snapshot isolation may expose old data (consistent read of stale snapshot)

## Related Rules

- 9-16-1: Always Choose Isolation Level Based on Anomaly Prevention Needs
- 9-16-2: Never Assume REPEATABLE READ Prevents Write Skew

## Related Skills

- Choose Isolation Level
- Implement Serializable Snapshot Isolation
- Prevent Write Skew

## Success Criteria

- Non-repeatable reads prevented at REPEATABLE READ or higher
- Phantom reads prevented at REPEATABLE READ or higher
- PostgreSQL REPEATABLE READ correctly prevents both
- MySQL REPEATABLE READ with FOR UPDATE prevents phantoms
- Write skew prevention requires SERIALIZABLE (understood and used when needed)
