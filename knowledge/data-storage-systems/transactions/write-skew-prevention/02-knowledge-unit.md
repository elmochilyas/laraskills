# Metadata

Domain: Data & Storage Systems
Subdomain: Transaction Management & Concurrency
Knowledge Unit: 9.18 Write skew prevention (the anomaly that REPEATABLE READ misses)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Write skew: two transactions read the same overlapping data, both check a condition that is true individually, both write based on that condition. Individually consistent, collectively the invariant is violated. REPEATABLE READ does NOT prevent write skew. Only SERIALIZABLE or explicit locking prevents it.

---

# Core Concepts

- **Classic example**: Doctor on-call schedule. Two doctors check: "Is another doctor on call?" Both see none → both set themselves as on-call. Invariant: at least one doctor on call → violated.
- **Why REPEATABLE READ fails**: Each transaction reads a snapshot showing no conflicting data. Both writes succeed because they modify different rows. No lock conflict.
- **Prevention**: `SELECT ... FOR UPDATE` on related rows (pessimistic lock) or use SERIALIZABLE isolation level.

---

# Patterns

**Explicit range lock**: `$onCall = Doctor::where('on_call', true)->lockForUpdate()->get(); if ($onCall->count() < 1) { $doctor->update(['on_call' => true]); }`. FOR UPDATE locks the relevant rows.

**SERIALIZABLE isolation**: Simplest fix. Use SSI. Retry on serialization failure.

---

# Common Mistakes

**Assuming SELECT + application check + UPDATE is safe**: Concurrent reads see the same state. Both pass the check. Both write. Invariant violated.

---

# Related Knowledge Units

9.2 Isolation levels | 9.17 SSI
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

