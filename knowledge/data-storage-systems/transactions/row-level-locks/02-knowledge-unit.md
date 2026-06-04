# Metadata

Domain: Data & Storage Systems
Subdomain: Transaction Management & Concurrency
Knowledge Unit: 9.5 Row-level locks (SELECT ... FOR UPDATE, SKIP LOCKED, NOWAIT)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Row-level locks explicitly lock selected rows for update or share. `SELECT ... FOR UPDATE` (exclusive lock — other transactions can't read/write locked rows). `SELECT ... FOR SHARE` (shared lock — others can read but not write). `SKIP LOCKED` skips locked rows (return only unlocked rows). `NOWAIT` fails immediately if row is locked (no waiting).

---

# Core Concepts

- **FOR UPDATE**: Exclusive row lock. No other transaction can SELECT FOR UPDATE, UPDATE, or DELETE the row. Plain SELECT still reads (MVCC).
- **FOR SHARE** (MySQL 8.0+: `FOR SHARE`, previously `LOCK IN SHARE MODE`): Shared lock. Other transactions can read but not update/delete. Blocks FOR UPDATE.
- **SKIP LOCKED** (MySQL 8.0+, PostgreSQL 9.5+): Skip any rows that are locked. Returns only unlocked rows. No waiting.
- **NOWAIT**: Return error immediately if any selected row is locked. No waiting.

---

# Patterns

**Job queue with SKIP LOCKED**: `SELECT * FROM jobs ORDER BY priority LIMIT 10 FOR UPDATE SKIP LOCKED` — workers grab next available jobs without contention.

**Atomic counter with FOR UPDATE**: Lock the row, read current value, increment, UPDATE, COMMIT. Prevents race conditions.

---

# Common Mistakes

**Missing FOR UPDATE in critical read-update sequences**: Two concurrent requests read the same balance, both add $10, both save. Balance increases by $10 only once. Always lock.

---

# Related Knowledge Units

9.1 ACID | 9.15 Pessimistic locking
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

