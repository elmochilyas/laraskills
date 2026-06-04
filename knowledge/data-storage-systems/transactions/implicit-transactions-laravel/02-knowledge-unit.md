# Metadata

Domain: Data & Storage Systems
Subdomain: Transaction Management & Concurrency
Knowledge Unit: 9.21 Implicit transactions in Laravel (automatic wrapping in some operations)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Some Laravel operations implicitly start transactions: model events dispatchers (saved, created, updated), the `DB::listen` query logger, and some package operations (Laravel Horizon, Telescope writes). Understanding implicit transactions prevents unexpected lock holding and transaction nesting.

---

# Core Concepts

- **Model events inside transaction**: `Model::saved` event fires inside the same transaction as the save. If the event listener throws, the entire save rolls back.
- **DB::listen**: The query logger does not start a transaction. It just logs queries.
- **Package writes**: Horizon (monitoring data) and Telescope (incoming request dumps) write to their own tables. These may or may not be transactional depending on configuration.

---

# Patterns

**Queue jobs after model save**: If a model save triggers a queue job dispatch inside its `saved` event, the job is not dispatched until the transaction commits. `AfterCommit` job: `dispatch()->afterCommit()`.

**Event listener in transaction**: Keep event listeners fast. If they might throw (API call failure), the entire model transaction rolls back.

---

# Common Mistakes

**Long-running event listener in saved event**: `User::saved` fires an email send. Email takes 5 seconds. User save transaction holds locks for 5 seconds. Use queued listeners.

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

