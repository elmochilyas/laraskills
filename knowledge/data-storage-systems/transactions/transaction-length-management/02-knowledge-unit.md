# Metadata

Domain: Data & Storage Systems
Subdomain: Transaction Management & Concurrency
Knowledge Unit: 9.13 Transaction length management (keeping transactions short)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Long transactions hold locks for extended duration, increasing deadlock probability and reducing concurrency. Rule: keep transactions as short as possible — acquire locks, do the minimal work, commit. Move pre-computation before BEGIN and post-processing after COMMIT.

---

# Core Concepts

- **Lock duration**: Locks acquired at row-level lock statement (SELECT FOR UPDATE) or row modification (UPDATE/DELETE). Released at COMMIT/ROLLBACK.
- **Transaction length = lock holding time**: Longer transaction = more contention. One slow operation in a transaction blocks others.
- **Non-database operations in transaction**: HTTP calls, file I/O, external API calls inside a transaction — lock held during network latency.

---

# Patterns

**Outside → transaction → outside**: Compute required data, start transaction, execute minimal SQL, commit, do post-processing.

**Read outside, write inside**: Read current state before transaction (no lock). Check conditions. Inside transaction: re-read with FOR UPDATE, verify, update.

---

# Common Mistakes

**External API call inside transaction**: Lock held for 500ms API call. Other transactions wait. API timeout → lock held for 30s.

---

# Related Knowledge Units

9.11 Transaction scoping | 9.19 Long-running transaction risks
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

