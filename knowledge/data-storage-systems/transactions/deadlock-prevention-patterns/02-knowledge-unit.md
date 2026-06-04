# Metadata

Domain: Data & Storage Systems
Subdomain: Transaction Management & Concurrency
Knowledge Unit: 9.9 Deadlock prevention patterns (consistent lock ordering, index-based locking, shorter transactions)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Deadlock prevention strategies: consistent lock ordering (always lock table A before B), use indexes to narrow lock ranges (without index, entire table may be locked), keep transactions short, and avoid user interaction within transactions. Prevention is better than detection — retries add latency and complexity.

---

# Core Concepts

- **Consistent ordering**: If Transaction 1 locks user then order, Transaction 2 must also lock user then order. Prevents cyclic lock waits.
- **Index-based locking**: `UPDATE orders SET status = ? WHERE user_id = ? AND created_at < ?` with index on `(user_id, created_at)` locks specific rows. Without index, locks all examined rows (gap locks).
- **Short transactions**: Minimize time between first lock and COMMIT. Do all computation before starting the transaction.

---

# Patterns

**Ordered lock access**: Always acquire locks in the same application-defined order. Enforce via a LockManager service.

**Batch processing with SKIP LOCKED**: `SELECT ... FOR UPDATE SKIP LOCKED` — process unlocked rows. Never blocks waiting for locked rows.

---

# Common Mistakes

**User interaction within transaction**: "Press OK to confirm purchase" while transaction holds locks. User walks away for 5 minutes. Locks held. Deadlock/FK conflict for other transactions.

---

# Related Knowledge Units

9.5 Row-level locks | 9.8 Deadlock detection
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

