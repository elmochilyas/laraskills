# Metadata

Domain: Data & Storage Systems
Subdomain: Transaction Management & Concurrency
Knowledge Unit: 9.12 Nested transactions and savepoints (SAVEPOINT, ROLLBACK TO SAVEPOINT)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Laravel supports nested transactions via database savepoints. Inner `DB::transaction()` creates a savepoint (not a true nested transaction). On inner rollback, only the changes since the savepoint are undone. On inner commit, changes are still pending until the outer transaction commits. Supported by InnoDB and PostgreSQL.

---

# Core Concepts

- **Savepoint**: A marker within a transaction. `SAVEPOINT sp1`. `ROLLBACK TO SAVEPOINT sp1` — rolls back to the savepoint, keeping earlier transaction changes.
- **Laravel nesting**: `DB::transaction(fn() => DB::transaction(...))` — outer creates transaction, inner creates savepoint. Inner rollback doesn't abort outer.
- **Transaction count**: `DB::transactionLevel()` — 0 = no transaction, 1 = outer, 2 = inner (savepoint).

---

# Patterns

**Partial rollback within a batch**: Process 100 items in a transaction. If item 50 fails, rollback to savepoint (items 1-49 preserved), skip item 50, continue.

**Service-level transaction composition**: Service A calls `DB::transaction()`. Service B also calls `DB::transaction()`. When composed, B uses savepoint within A's transaction.

---

# Common Mistakes

**Assuming inner transaction is fully independent**: Inner "commit" doesn't persist data. Only the outer COMMIT persists everything. Understand savepoint semantics.

---

# Related Knowledge Units

9.11 Transaction scoping | 9.13 Transaction length
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

