# Metadata

Domain: Data & Storage Systems
Subdomain: Transaction Management & Concurrency
Knowledge Unit: 9.19 Long-running transaction risks (bloat, replication lag, lock escalation)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Long-running transactions cause: MVCC bloat (accumulation of dead rows that VACUUM can't remove), replication lag (replicas can't apply WAL until transaction commits), lock escalation (some DBs escalate row locks to table locks), and connection pool exhaustion. Monitor transaction duration and alert on transactions exceeding thresholds.

---

# Core Concepts

- **MVCC bloat**: PostgreSQL keeps dead row versions visible to long-running transactions. VACUUM can't remove them. Table grows, index performance degrades.
- **Replication lag**: Long-running transaction holds back WAL清理 (PostgreSQL) or binlog position advance (MySQL). Replicas can't advance past this position.
- **Lock escalation**: InnoDB escalates row locks to table lock if > 40% of rows are locked. Long transactions accumulating row locks risk escalation.

---

# Patterns

**Transaction duration monitoring**: Log start and end times. Alert if duration > 5 seconds. Kill transactions > 60 seconds (application-level timeout).

**Batch commits**: For processing 10K rows, commit every 100 rows. Avoids one giant transaction.

---

# Common Mistakes

**One transaction for entire batch operation**: `BEGIN; UPDATE 1000000 rows; COMMIT` — MVCC bloat, lock duration, rollback risk. Batch into 1000-row chunks.

---

# Related Knowledge Units

9.13 Transaction length | 9.11 Transaction scoping
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

