# Skill: Choose and Configure Isolation Levels

## Purpose

Select the appropriate SQL isolation level for a workload, understanding the tradeoffs between consistency guarantees and concurrency performance.

## When To Use

- Designing transaction logic for concurrent access
- Debugging concurrency anomalies (dirty reads, non-repeatable reads, phantoms)
- Balancing consistency requirements with throughput
- Setting session or transaction isolation levels

## When NOT To Use

- Single-statement operations (no transaction needed)
- Read-only queries (snapshot isolation doesn't matter)
- Default isolation level is sufficient for the workload

## Prerequisites

- Understanding of isolation anomalies (dirty read, non-repeatable read, phantom)
- Database that supports changing isolation levels (MySQL, PostgreSQL)

## Inputs

- Business consistency requirements
- Concurrency level (expected concurrent transactions)
- Anomalies that must be prevented

## Workflow (numbered steps)

1. Understand the four isolation levels and what they prevent:
   | Level | Dirty Read | Non-Repeatable Read | Phantom | Write Skew |
   |---|---|---|---|---|
   | READ UNCOMMITTED | ❌ | ❌ | ❌ | ❌ |
   | READ COMMITTED | ✅ | ❌ | ❌ | ❌ |
   | REPEATABLE READ | ✅ | ✅ | ✅ (MySQL InnoDB) / ✅ (PG via SI) | ❌ |
   | SERIALIZABLE | ✅ | ✅ | ✅ | ✅ |

2. Choose the minimal level that prevents your acceptance anomalies:
   - **READ COMMITTED**: general purpose, prevents dirty reads, allows phantoms and write skew
   - **REPEATABLE READ**: consistent snapshot within transaction, prevents phantoms (MySQL via next-key locks, PostgreSQL via SI), allows write skew
   - **SERIALIZABLE**: prevents all anomalies, lowest throughput

3. Set isolation level at the session/transaction:
   ```sql
   -- MySQL
   SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
   -- PostgreSQL
   SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
   ```

4. In Laravel, set per-connection in `config/database.php`:
   ```php
   'mysql' => [
       'isolation_level' => 'READ COMMITTED',
   ],
   ```
   Or per transaction:
   ```php
   DB::statement('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
   DB::transaction(function () { ... });
   ```

5. Test with concurrent transactions to verify anomalies are prevented

## Validation Checklist

- [ ] Isolation level chosen prevents acceptance anomalies
- [ ] Level set correctly in database config
- [ ] Higher isolation not used unnecessarily (avoids throughput reduction)
- [ ] SERIALIZABLE used only when write skew or serialization anomalies must be prevented
- [ ] Application handles serialization failures with retry (SERIALIZABLE, SSI)

## Common Failures

- Using SERIALIZABLE for all transactions "for safety" — kills throughput
- READ UNCOMMITTED used in production — dirty reads cause data corruption
- Assuming MySQL REPEATABLE READ = PostgreSQL REPEATABLE READ (different implementations)
- Not handling serialization failures (40001) when using SSI
- Setting isolation at session level instead of transaction level (persistent connections)

## Decision Points

- READ COMMITTED vs REPEATABLE READ for most OLTP
- MySQL vs PostgreSQL: default levels differ
- Per-connection vs per-transaction isolation setting
- SERIALIZABLE: pessimistic locking (MySQL) vs SSI (PostgreSQL)

## Performance Considerations

- READ COMMITTED: row locks held only for duration of statement
- REPEATABLE READ: row locks held until transaction commit (MySQL)
- SERIALIZABLE: highest lock contention, lowest concurrency
- PostgreSQL SSI: optimistic, retry on conflict — no blocking

## Security Considerations

- Isolation level doesn't affect access control
- SERIALIZABLE may reveal timing information through retry patterns

## Related Rules

- 9-2-1: Keep Transactions Short
- 9-2-2: Always Use DB::transaction Closure

## Related Skills

- Apply ACID Properties
- Implement Serializable Snapshot Isolation
- Implement Transaction Retry Logic

## Success Criteria

- Isolation level prevents required anomalies
- Throughput meets performance requirements
- No unnecessary SERIALIZABLE usage
- Serialization failures handled with retry logic
