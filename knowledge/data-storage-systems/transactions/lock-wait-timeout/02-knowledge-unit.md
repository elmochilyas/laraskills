# Metadata

Domain: Data & Storage Systems
Subdomain: Transaction Management & Concurrency
Knowledge Unit: 9.10 Lock wait timeout (innodb_lock_wait_timeout, deadlock_timeout, lock_timeout)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Lock wait timeout controls how long a transaction waits for a lock before giving up. MySQL: `innodb_lock_wait_timeout` (default 50s). PostgreSQL: `deadlock_timeout` (default 1s) and `lock_timeout` (default 0 = no timeout). Timeouts prevent transactions from waiting indefinitely for blocked locks.

---

# Core Concepts

- **innodb_lock_wait_timeout**: MySQL. Time (seconds) a transaction waits for a row/table lock. After timeout, MySQL rolls back the waiting transaction (not the lock holder).
- **deadlock_timeout**: PostgreSQL. Time to wait before checking for deadlock. Not a lock wait timeout per se — checks for deadlock after this duration.
- **lock_timeout**: PostgreSQL (v9.6+). `SET lock_timeout = '5s'` — transaction fails if a lock is not acquired within this time.

---

# Patterns

**Lower timeout for interactive queries**: `innodb_lock_wait_timeout = 5` for user-facing queries. User gets error quickly instead of waiting 50s.

**Higher timeout for batch jobs**: Batch processing (reporting, backfill) may need longer lock wait times.

---

# Common Mistakes

**Default 50s timeout for web requests**: If a lock is held, the web request waits 50s before failing. User sees a 50s timeout. Lower to 5-10s.

---

# Related Knowledge Units

9.8 Deadlock detection | 9.5 Row-level locks
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

