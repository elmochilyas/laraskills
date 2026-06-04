# Metadata

Domain: Data & Storage Systems
Subdomain: Transaction Management & Concurrency
Knowledge Unit: 9.3 PostgreSQL isolation specifics (SSI, SERIALIZABLE snapshot isolation, REPEATABLE READ snapshot)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

PostgreSQL implements SERIALIZABLE via Serializable Snapshot Isolation (SSI) — optimistic, detects conflicts via predicate locking. REPEATABLE READ uses snapshot isolation (SI) — read-only, no locks, detects conflicts on first write. READ COMMITTED also uses snapshots per statement. PostgreSQL's MVCC never blocks reads.

---

# Core Concepts

- **SSI (SERIALIZABLE)**: PostgreSQL v9.1+. Uses SIREAD locks (predicate-based) to detect serialization anomalies. Retry on serialization failure: `40001`.
- **Snapshot isolation (REPEATABLE READ)**: Transaction sees a snapshot of data at start. Modifications from other transactions are invisible. Write-write conflicts cause abort on first write.
- **No phantom reads in REPEATABLE READ**: PostgreSQL's snapshot isolation prevents phantoms (unlike MySQL, which prevents phantoms only in InnoDB REPEATABLE READ via next-key locks).

---

# Patterns

**SSI for financial transactions**: Use SERIALIZABLE when concurrent invariants must be guaranteed (e.g., total must equal sum). Handle serialization failures with retry logic.

**REPEATABLE READ for reporting snapshot**: Run reports in REPEATABLE READ — consistent view of data at a point in time.

---

# Common Mistakes

**SSI without retry**: SSI aborts one transaction on conflict. Application must retry. Not handling serialization_failure (40001) causes data loss.

---

# Related Knowledge Units

9.2 Isolation levels | 9.17 Serializable snapshot isolation
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

