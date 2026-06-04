# Metadata

Domain: Data & Storage Systems
Subdomain: Transaction Management & Concurrency
Knowledge Unit: 9.16 Phantom reads vs. non-repeatable reads
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Non-repeatable read: same row, different value on re-read (another transaction updated it). Phantom read: same query, different set of rows on re-read (another transaction inserted/deleted rows). REPEATABLE READ prevents non-repeatable reads but may allow phantoms (depends on implementation). SERIALIZABLE prevents both.

---

# Core Concepts

- **Non-repeatable read**: T1 reads balance = 100. T2 updates balance to 200, commits. T1 reads balance again → 200. Same row, different value.
- **Phantom read**: T1: `SELECT COUNT(*) FROM orders WHERE status = 'pending'` → 5. T2 inserts a pending order, commits. T1 re-executes → 6. Different row count.
- **Prevention per DB**: PostgreSQL REPEATABLE READ prevents both via snapshot isolation. MySQL REPEATABLE READ prevents non-repeatable via MVCC, prevents phantoms in SELECT ... FOR UPDATE via next-key locks.

---

# Patterns

**Phantom prevention with range locks**: `SELECT ... WHERE status = 'pending' FOR UPDATE` — InnoDB locks the gap, preventing INSERT of new pending orders.

**Snapshot for consistent read (PostgreSQL)**: REPEATABLE READ guarantees consistent view of all data. No phantoms, no non-repeatable reads.

---

# Common Mistakes

**Assuming REPEATABLE READ prevents all anomalies**: REPEATABLE READ does not prevent serialization anomalies (write skew). Only SERIALIZABLE prevents all.

---

# Related Knowledge Units

9.2 Isolation levels | 9.17 SSI | 9.18 Write skew
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

