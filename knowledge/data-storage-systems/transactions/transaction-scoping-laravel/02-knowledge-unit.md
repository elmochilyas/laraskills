# Metadata

Domain: Data & Storage Systems
Subdomain: Transaction Management & Concurrency
Knowledge Unit: 9.11 Transaction scoping in Laravel (DB::transaction, automatic rollback on exception)
Difficulty Level: Foundational
Last Updated: 2026-06-02

---

# Executive Summary

`DB::transaction(Closure $callback)` wraps operations in a single database transaction. If the closure throws any exception, the transaction is automatically rolled back. If it succeeds, it's committed. Laravel's transaction helper handles the BEGIN, COMMIT, and ROLLBACK logic, including nested transactions via savepoints.

---

# Core Concepts

- **DB::transaction**: `DB::transaction(fn() => [DB::insert(...), DB::update(...)])` — atomic block. Exception rollback. Catch exceptions for error handling.
- **Manual transaction control**: `DB::beginTransaction()`, `DB::commit()`, `DB::rollBack()` — for custom transaction flow (loop with conditional commit).
- **Transaction count**: Laravel tracks transaction depth. `DB::transactionLevel()` returns current nesting level.

---

# Patterns

**Transaction for atomic business operations**: Create order + decrement inventory + charge payment in single transaction. If any fails, all roll back.

**Transaction middleware**: `\Illuminate\Session\Middleware\StartSession` starts a DB transaction. Used by some Laravel packages for atomic session updates.

---

# Common Mistakes

**Not catching transaction exceptions**: `DB::transaction()` re-throws exceptions. Without try/catch, the error propagates to the framework's exception handler.

---

# Related Knowledge Units

9.12 Nested transactions | 9.13 Transaction length management
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

