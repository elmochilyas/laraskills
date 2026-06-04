# Metadata

Domain: Data & Storage Systems
Subdomain: Transaction Management & Concurrency
Knowledge Unit: 9.6 Table-level locks (LOCK TABLES, implications in production)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Table-level locks (`LOCK TABLES orders WRITE`, `LOCK TABLES orders READ`) block all other sessions from accessing the table. WRITE lock: exclusive — no other session can read or write. READ lock: shared — others can read but not write. Serious concurrency impact. Rarely needed in InnoDB (row-level locks suffice). Used in MyISAM or specific DDL operations.

---

# Core Concepts

- **LOCK TABLES ... WRITE**: Only the locking session can read/write. All other sessions wait. Blocks all queries against the table.
- **LOCK TABLES ... READ**: Locking session and others can read. No writes allowed.
- **DDL implication**: `ALTER TABLE`, `DROP TABLE` take an exclusive metadata lock. Does not require explicit `LOCK TABLES`. The lock is implicit.

---

# Patterns

**Avoid LOCK TABLES in InnoDB**: Row-level locking provides better concurrency. Use `SELECT ... FOR UPDATE` for write locks on specific rows.

**LOCK TABLES for bulk operations**: When you must ensure zero concurrent access during a multi-step operation. Rare use case.

---

# Common Mistakes

**Using LOCK TABLES in InnoDB**: MySQL documentation advises against it. InnoDB auto-deadlocks on LOCK TABLES + row locks. Use transactions + FOR UPDATE.

---

# Related Knowledge Units

9.5 Row-level locks | 9.11 Transaction scoping
## Ecosystem Usage

Laravel's DB::transaction wraps operations atomically. MySQL InnoDB uses MVCC with REPEATABLE READ default. PostgreSQL uses MVCC with READ COMMITTED default.

## Failure Modes

Deadlocks from two transactions holding locks the other needs. Phantom reads at READ COMMITTED. Write skew at non-SERIALIZABLE levels. Long transactions cause MVCC bloat.

## Performance Considerations

Transaction length affects lock contention and MVCC cleanup. PostgreSQL autovacuum must clean dead tuples. Transaction pooling breaks multi-statement transactions.

## Production Considerations

Keep transactions short. Set lock_timeout to prevent unbounded waits. Use SKIP LOCKED for queue-style processing. Monitor deadlock frequency.

## Research Notes

PostgreSQL SERIALIZABLE uses SSI detecting serialization anomalies via read-write conflicts. MySQL REPEATABLE READ is snapshot isolation with gap locks.

## Internal Mechanics

MVCC maintains multiple row versions. Each transaction sees a snapshot of committed data. InnoDB stores rollback segments. PostgreSQL stores dead tuples for autovacuum.

## Architectural Decisions

READ COMMITTED: No phantom protection, possible write skew, lowest cost. REPEATABLE READ: Phantom protection in MySQL, possible write skew, medium cost. SERIALIZABLE: Full protection, highest cost.

## Tradeoffs

ACID compliance reduces concurrency. MVCC non-blocking reads require cleanup overhead. Row-level locking has lock escalation risk.

## Mental Models

Transactions are atomic units: all or nothing. READ COMMITTED = current committed data. REPEATABLE READ = frozen view. SERIALIZABLE = one-at-a-time.

