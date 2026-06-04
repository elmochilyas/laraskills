# Metadata

Domain: Data & Storage Systems
Subdomain: Transaction Management & Concurrency
Knowledge Unit: 9.7 Advisory locks (application-level coordination via PostgreSQL pg_advisory_lock)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

PostgreSQL advisory locks are application-level locks managed by the database but not tied to any table row. `pg_advisory_lock(key)` — exclusive. `pg_advisory_lock_shared(key)` — shared. Released at transaction end or explicitly via `pg_advisory_unlock`. Used for coordinating operations across processes/workers.

---

# Core Concepts

- **Session-level lock**: `pg_advisory_lock(key)` — held until session ends or explicitly unlocked. Must explicitly unlock.
- **Transaction-level lock**: `pg_advisory_xact_lock(key)` — held until transaction ends. Automatically released on COMMIT/ROLLBACK.
- **Use cases**: Prevent concurrent job processing, coordinate backup operations, enforce sequential processing of specific resources.

---

# Patterns

**Queue worker coordination**: `pg_advisory_lock(job_id)` — only one worker processes a job. Other workers skip or wait. Better than `GET_LOCK()` in MySQL.

**Rate-limited external API calls**: Advisory lock by API resource ID. Only one worker calls the API for that resource at a time.

---

# Common Mistakes

**Not unlocking session-level locks**: Session holds the lock until disconnect. If the script dies, lock remains. Prefer transaction-level locks.

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

