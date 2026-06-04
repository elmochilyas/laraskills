# Metadata

Domain: Data & Storage Systems
Subdomain: Transaction Management & Concurrency
Knowledge Unit: 9.2 Isolation levels (READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Four SQL standard isolation levels control what concurrent transactions can see. READ UNCOMMITTED (dirty reads). READ COMMITTED (no dirty reads — PostgreSQL default). REPEATABLE READ (no non-repeatable reads — MySQL InnoDB default). SERIALIZABLE (no anomalies — may use SSI or pessimistic locking). Higher isolation = fewer anomalies, more blocking/locks.

---

# Core Concepts

- **Dirty read**: Read uncommitted data from another transaction. Only READ UNCOMMITTED allows this.
- **Non-repeatable read**: Read the same row twice in a transaction; another transaction modified it between reads. READ COMMITTED allows this.
- **Phantom read**: A query returns different rows on re-execution (new rows inserted by another transaction). REPEATABLE READ in PostgreSQL prevents this via snapshot isolation.
- **Serialization anomaly**: Two concurrent transactions produce results that couldn't happen in any serial order. Only SERIALIZABLE prevents this.

---

# Patterns

**READ COMMITTED for most production workloads**: Good balance of consistency and concurrency. PostgreSQL default. MySQL default is REPEATABLE READ.

**REPEATABLE READ for strict consistency**: When you must have consistent reads within a transaction. MySQL default.

---

# Common Mistakes

**Using SERIALIZABLE "for safety"**: SERIALIZABLE significantly reduces throughput (more conflicts, retries). Use only when anomalies at REPEATABLE READ-level are unacceptable.

---

# Related Knowledge Units

9.3 PostgreSQL isolation specifics | 9.4 MySQL InnoDB specifics
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

