# Metadata

Domain: Data & Storage Systems
Subdomain: Transaction Management & Concurrency
Knowledge Unit: 9.4 MySQL InnoDB isolation specifics (REPEATABLE READ, next-key locking, gap locks)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

MySQL InnoDB's default REPEATABLE READ uses next-key locks (record lock + gap lock) to prevent phantom reads. Gap locks lock ranges between index entries, preventing INSERT of new rows in that range. This causes more lock contention than PostgreSQL's MVCC REPEATABLE READ. InnoDB also has predicate locks for SERIALIZABLE.

---

# Core Concepts

- **Next-key lock**: Combination of row lock + gap lock on the gap before the row. `SELECT * FROM orders WHERE id > 100 FOR UPDATE` locks rows with id > 100 AND the gap after the last row (prevents INSERT id > max).
- **Gap lock**: Locks a range between index entries. Can cause deadlocks when transactions insert into overlapping ranges.
- **REPEATABLE READ implementation**: InnoDB uses consistent read (MVCC snapshot) for plain SELECT. `SELECT ... FOR UPDATE/LOCK IN SHARE MODE` uses next-key locks for the index scanned range.

---

# Patterns

**READ COMMITTED to avoid gap locks**: Change to READ COMMITTED if gap lock contention is high. Binlog must be MIXED or ROW (not STATEMENT) for READ COMMITTED.

**Indexed queries reduce lock range**: A query that uses an index locks only the index range scanned. Without index, it locks all rows examined (gap locks on entire table).

---

# Common Mistakes

**Gap lock deadlock via inserts**: Transaction A locks range (100-200). Transaction B tries to insert id=150. B waits for A's gap lock. If A also needs a resource B holds → deadlock.

---

# Related Knowledge Units

9.2 Isolation levels | 9.8 Deadlock detection
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

