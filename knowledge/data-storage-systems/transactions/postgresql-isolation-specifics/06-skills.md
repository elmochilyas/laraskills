# Skill: Use PostgreSQL Isolation Features (SSI and Snapshot Isolation)

## Purpose

Leverage PostgreSQL's Serializable Snapshot Isolation (SSI) for conflict detection without blocking reads, and snapshot isolation for consistent reporting snapshots.

## When To Use

- PostgreSQL database (SSI available since v9.1)
- Need true SERIALIZABLE isolation (prevent write skew) without blocking reads
- Need consistent snapshot for reporting (REPEATABLE READ)
- Financial transactions where concurrent invariants must be guaranteed

## When NOT To Use

- MySQL (uses pessimistic locking for SERIALIZABLE, not SSI)
- Low contention workloads where READ COMMITTED is sufficient
- No requirement for SERIALIZABLE isolation
- Application cannot handle serialization failures (40001)

## Prerequisites

- PostgreSQL 9.1+ (SSI), 9.4+ (better SSI performance)
- Understanding of snapshot isolation and serialization anomalies
- Retry logic for serialization failures

## Inputs

- Transaction SQL
- Isolation level requirement (REPEATABLE READ or SERIALIZABLE)

## Workflow (numbered steps)

1. Choose the isolation level based on needs:
   - **REPEATABLE READ**: snapshot isolation, consistent read view, write-write conflicts detected on first write
   - **SERIALIZABLE (SSI)**: full isolation, detects read-write conflicts via predicate locking, prevents write skew

2. Set isolation level and run transaction:
   ```sql
   BEGIN;
   SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
   -- operations
   COMMIT;  -- may fail with 40001 if conflict detected
   ```

3. Handle serialization failure (40001):
   ```php
   $maxRetries = 3;
   for ($i = 0; $i < $maxRetries; $i++) {
       try {
           DB::transaction(function () {
               DB::statement('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
               // business logic
           });
           break;
       } catch (\Illuminate\Database\QueryException $e) {
           if ($e->getCode() !== '40001') throw;
           // retry
       }
   }
   ```

4. For consistent reporting snapshots:
   ```sql
   BEGIN;
   SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
   -- multiple SELECT queries see consistent data
   COMMIT;
   ```

5. Monitor `serialization_failure` in PostgreSQL logs

## Validation Checklist

- [ ] SERIALIZABLE used with SSI (PostgreSQL), not pessimistic locking
- [ ] Retry logic implemented for serialization_failure (40001)
- [ ] REPEATABLE READ provides consistent snapshot for reporting
- [ ] No blocking on reads (PostgreSQL MVCC never blocks reads)
- [ ] Serialization failures monitored and within acceptable rate

## Common Failures

- SSI without retry — transaction aborts silently, data not persisted
- Assuming SSI prevents all anomalies at READ COMMITTED (only SERIALIZABLE level)
- Setting SERIALIZABLE globally — all transactions get max isolation
- Snapshot isolation at REPEATABLE READ still allows write skew
- Long-running SSI transactions increase conflict probability

## Decision Points

- REPEATABLE READ vs SERIALIZABLE: consistency vs retry overhead
- Global default vs per-transaction isolation level
- SSI retry count: 3-5 retries with exponential backoff

## Performance Considerations

- SSI: optimistic, no blocking, but retries on conflict
- SSI overhead: SIREAD locks for predicate tracking (memory overhead)
- REPEATABLE READ: snapshot isolation, write-write conflict detection only
- Autovacuum must keep up — long transactions prevent dead tuple cleanup
- SERIALIZABLE increases serialization failure rate with longer transactions

## Security Considerations

- SSI doesn't bypass access controls
- Serialization failures may reveal concurrency patterns (timing side channel)

## Related Rules

- 9-3-1: Always Implement Retry for SERIALIZABLE Transactions
- 9-3-2: Never Use SERIALIZABLE Without Monitoring Conflict Rate

## Related Skills

- Choose Isolation Level
- Implement Serializable Snapshot Isolation
- Implement Transaction Retry Logic
- Prevent Write Skew

## Success Criteria

- SSI prevents serialization anomalies without blocking reads
- Retry logic handles serialization failures gracefully
- REPEATABLE READ snapshots provide consistent reporting views
- Conflict rate monitored and within acceptable range (< 5%)
