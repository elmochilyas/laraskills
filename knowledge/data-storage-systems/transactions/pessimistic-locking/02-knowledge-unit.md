# Metadata

Domain: Data & Storage Systems
Subdomain: Transaction Management & Concurrency
Knowledge Unit: 9.15 Pessimistic locking (sharedLock, lockForUpdate in Eloquent)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Pessimistic locking explicitly acquires locks on rows before modifying them. Eloquent methods: `sharedLock()` (shared lock — SELECT ... FOR SHARE), `lockForUpdate()` (exclusive lock — SELECT ... FOR UPDATE). Prevents other transactions from modifying the locked rows. Use when conflicts are expected and retry is expensive.

---

# Core Concepts

- **sharedLock()**: `Model::where(...)->sharedLock()->get()` — adds `LOCK IN SHARE MODE` (MySQL) or `FOR SHARE` (PostgreSQL). Shared lock: others can read but not update/delete.
- **lockForUpdate()**: `Model::where(...)->lockForUpdate()->get()` — adds `FOR UPDATE`. Exclusive lock: others cannot update, delete, or SELECT FOR UPDATE on locked rows.
- **Lock release**: All locks released on COMMIT or ROLLBACK. Holding locks for minimum duration is critical.

---

# Patterns

**Read-update cycle with lockForUpdate**: `DB::transaction(fn() => [$order = Order::lockForUpdate()->find($id), $order->update(...)])` — prevents concurrent modification.

**Queue job with lockForUpdate**: Worker locks job row before processing. Prevents duplicate processing.

---

# Common Mistakes

**Pessimistic locking for read-only operations**: Plain SELECT doesn't need locks. Locks block other transactions unnecessarily.

---

# Related Knowledge Units

9.5 Row-level locks | 9.14 Optimistic locking
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

