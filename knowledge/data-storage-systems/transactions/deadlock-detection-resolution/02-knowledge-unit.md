# Metadata

Domain: Data & Storage Systems
Subdomain: Transaction Management & Concurrency
Knowledge Unit: 9.8 Deadlock detection and resolution (innodb_deadlock_detect, wait-for graph)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Deadlock occurs when two transactions each hold a lock the other needs. MySQL InnoDB detects deadlocks via wait-for graph. InnoDB automatically rolls back the transaction that detected the deadlock (the one with the fewest locks). PostgreSQL detects deadlocks via timeout-based detection (deadlock_timeout).

---

# Core Concepts

- **InnoDB deadlock detection**: Runs when a transaction waits for a lock. Builds wait-for graph. If cycle detected, chooses victim transaction (rolls back, releases locks).
- **PostgreSQL deadlock timeout**: Doesn't actively detect. When a lock wait exceeds `deadlock_timeout` (default 1s), checks if waiting would cause a deadlock. If yes, aborts one transaction.
- **Deadlock error code**: MySQL: `1213 (40001)`, PostgreSQL: `40P01`. Both are serialization failures — retry the transaction.

---

# Patterns

**Deadlock prevention**: Access tables/rows in consistent order (e.g., always update user first, then order). Reduces cyclic lock wait.

**Retry on deadlock**: Laravel transaction helper does NOT automatically retry. Wrap in retry loop (3 attempts, exponential backoff).

---

# Common Mistakes

**No deadlock retry logic**: `DB::transaction()` fails on deadlock. Transaction is rolled back. Without retry, the operation fails silently.

---

# Related Knowledge Units

9.9 Deadlock prevention | 9.20 Transaction retry logic
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

