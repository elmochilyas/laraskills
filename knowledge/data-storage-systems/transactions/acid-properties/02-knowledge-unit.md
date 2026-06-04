# Metadata

Domain: Data & Storage Systems
Subdomain: Transaction Management & Concurrency
Knowledge Unit: 9.1 ACID properties (Atomicity, Consistency, Isolation, Durability)
Difficulty Level: Foundational
Last Updated: 2026-06-02

---

# Executive Summary

ACID guarantees define transaction reliability. Atomicity: all or nothing. Consistency: data remains valid. Isolation: concurrent transactions don't interfere. Durability: committed data survives failures. InnoDB (MySQL) and PostgreSQL implement ACID with varying tradeoffs between isolation strength and performance.

---

# Core Concepts

- **Atomicity**: Transaction commits or rolls back fully. `BEGIN` + `COMMIT` or `ROLLBACK`. Partial failure → rollback entire transaction.
- **Consistency**: Constraints, cascades, triggers maintain data invariants. Application-level consistency (business logic) + database-level (FK, CHECK, UNIQUE).
- **Isolation**: Levels control visibility of uncommitted changes: READ UNCOMMITTED → SERIALIZABLE. Higher isolation = fewer anomalies, lower concurrency.
- **Durability**: `COMMIT` ensures data is written to persistent storage (redo log, WAL). fsync guarantees.

---

# Patterns

**Short transactions for high concurrency**: Minimize lock holding time. Do reads, compute, write inside the transaction. Minimize duration.

**Consistency via database constraints**: Use FK, CHECK, UNIQUE to enforce data invariants at database level, not just application.

---

# Common Mistakes

**Confusing ACID consistency with application consistency**: ACID consistency only checks constraints. Business invariants (e.g., "balance must not go negative") require CHECK or application logic.

---

# Related Knowledge Units

9.2 Isolation levels | 9.11 Transaction scoping in Laravel
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

