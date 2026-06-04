# Skill: Manage MySQL InnoDB Isolation and Locking

## Purpose

Understand MySQL InnoDB's REPEATABLE READ implementation with next-key locks (record + gap locks) and know when to reduce isolation to READ COMMITTED to avoid gap lock contention.

## When To Use

- MySQL InnoDB with default REPEATABLE READ
- Troubleshooting deadlocks from gap locks
- High contention on range-based queries
- Changing isolation level to reduce lock overhead

## When NOT To Use

- PostgreSQL (different MVCC implementation, no gap locks)
- READ COMMITTED is sufficient and already configured
- Low contention workload where gap locks aren't causing issues

## Prerequisites

- MySQL InnoDB table
- Understanding of REPEATABLE READ and READ COMMITTED
- Binlog format knowledge (ROW or MIXED for READ COMMITTED)

## Inputs

- Current isolation level
- Deadlock or lock contention incidents
- Query patterns (range scans, inserts in ranges)

## Workflow (numbered steps)

1. Understand InnoDB's REPEATABLE READ locking:
   - Plain `SELECT`: uses MVCC snapshot — no locks (consistent read)
   - `SELECT ... FOR UPDATE`: acquires next-key locks (row lock + gap lock before it)
   - Gap locks: prevent INSERTs into the range, prevent phantom reads
   - Next-key locks apply to the index scanned range

2. If gap lock contention is causing deadlocks or reduced concurrency:
   - Change isolation to READ COMMITTED:
     ```sql
     SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
     ```
   - In MySQL config:
     ```ini
     transaction-isolation = READ-COMMITTED
     binlog_format = ROW
     ```
   - READ COMMITTED disables gap locks for locking reads and FOR UPDATE/SHARE

3. For `SELECT ... FOR UPDATE` at READ COMMITTED:
   - Only matching rows are locked (no gap before/after)
   - Other transactions can INSERT rows in the previously locked range
   - Allows phantoms but reduces lock contention

4. Ensure queries use indexes:
   - Without index, InnoDB locks all rows it examines (gap locks on entire table)
   - With proper index, locks only the index range scanned

5. Monitor lock contention:
   ```sql
   SHOW ENGINE INNODB STATUS;
   -- Look for "LATEST DETECTED DEADLOCK" and "TRANSACTIONS" section
   ```

## Validation Checklist

- [ ] Isolation level set to READ COMMITTED if gap lock contention is high
- [ ] binlog_format = ROW or MIXED (not STATEMENT) for READ COMMITTED
- [ ] Queries use indexes to minimize lock range
- [ ] `SHOW ENGINE INNODB STATUS` shows minimal lock contention
- [ ] No deadlocks caused by gap lock conflicts
- [ ] Application accepts possible phantom reads (READ COMMITTED)

## Common Failures

- binlog_format=STATEMENT with READ COMMITTED — MySQL prevents this (replication unsafe)
- No index on WHERE clause — InnoDB locks all examined rows (table-level effect)
- Mixing READ COMMITTED and REPEATABLE READ in same connection
- Gap locks in REPEATABLE READ causing otherwise avoidable deadlocks
- Assuming plain SELECT uses next-key locks (only FOR UPDATE/SHARE uses them)

## Decision Points

- READ COMMITTED vs REPEATABLE READ: concurrency vs consistency
- Index creation to narrow lock range (critical for both levels)
- Application tolerance for phantom reads (READ COMMITTED allows them)
- binlog_format: ROW vs MIXED (ROW is safer for replication)

## Performance Considerations

- READ COMMITTED: no gap locks, lower lock contention, higher concurrency
- REPEATABLE READ: gap locks prevent phantoms, higher contention
- Indexed queries: lock fewer rows even at REPEATABLE READ
- Large gap lock ranges: block many INSERTs, cause deadlocks

## Security Considerations

- Isolation level doesn't affect access control
- Gap locks can be used as a side channel (range existence inference)

## Related Rules

- 9-4-1: Always Use READ COMMITTED If Gap Locks Cause Issues
- 9-4-2: Never Use STATEMENT-Based Binlog With READ COMMITTED

## Related Skills

- Choose Isolation Level
- Implement Row-Level Locks
- Detect and Resolve Deadlocks

## Success Criteria

- Lock contention reduced to acceptable levels
- Deadlocks from gap locks eliminated
- Application tolerates READ COMMITTED semantics (phantoms)
- Queries use indexes to minimize lock range
