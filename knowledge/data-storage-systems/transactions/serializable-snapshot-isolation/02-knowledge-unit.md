# Metadata

Domain: Data & Storage Systems
Subdomain: Transaction Management & Concurrency
Knowledge Unit: 9.17 Serializable Snapshot Isolation (PostgreSQL SSI, conflict detection)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

SSI (PostgreSQL SERIALIZABLE) detects serialization anomalies via predicate locking and conflict tracking. Unlike pessimistic SERIALIZABLE (which uses table/index locks), SSI is optimistic — it allows concurrent operations and aborts one transaction if a serialization conflict is detected. SSI provides true serializability with better concurrency than lock-based approaches.

---

# Core Concepts

- **SIREAD locks**: Lightweight predicate locks. Track which data a transaction read (via index keys and page-level tracking). Monitoring for rw-conflicts.
- **Conflict detection**: If transaction T1 reads data that T2 later writes, and T1's read predicate overlaps T2's write, SSI detects a rw-dependency. If this creates a cycle in the dependency graph, one transaction is aborted.
- **Serialization failure (40001)**: Returned when SSI detects a conflict. Application must retry the entire transaction.

---

# Patterns

**SSI for inventory management**: Prevent overselling. Two concurrent transactions reading same count and decrementing. SSI catches the conflict.

**SSI with retry wrapper**: `for ($attempts = 0; $attempts < 3; $attempts++) { try { DB::transaction(fn() => ..., 5) } catch (QueryException $e) { if ($e->getCode() != 40001) throw; usleep(100_000); } }`.

---

# Common Mistakes

**SSI without understanding conflict rate**: SSI overhead increases with conflict rate. Monitor `serialization_failures` in pg_stat_database. High rate → reduce SSI scope.

---

# Related Knowledge Units

9.3 PostgreSQL isolation specifics | 9.18 Write skew prevention
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

