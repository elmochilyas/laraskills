# Metadata

Domain: Data & Storage Systems
Subdomain: Transaction Management & Concurrency
Knowledge Unit: 9.14 Optimistic locking (version column, updated_at check)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Optimistic locking assumes conflicts are rare. Each row has a version column (integer or timestamp). On update: `UPDATE ... SET version = version + 1 WHERE version = ?`. If version doesn't match, update affects 0 rows — conflict detected. Application retries by re-reading current state and re-applying changes.

---

# Core Concepts

- **Version column**: Integer column `version` default 0. Incremented on each update.
- **Compare-and-swap UPDATE**: `UPDATE orders SET status = 'shipped', version = version + 1 WHERE id = ? AND version = 2`. If another transaction updated the row, version is 3, update affects 0 rows.
- **Laravel support**: No built-in optimistic locking. Implement manually via query builder or model hooks.

---

# Patterns

**Optimistic lock in web forms**: Load row with version in hidden field. On submit, compare version. If mismatch, show "data was modified by another user".

**Retry on conflict**: Re-read the row, re-apply user changes, try update again. Limit retries to 3.

---

# Common Mistakes

**Optimistic locking without retry**: Version mismatch causes update to fail silently. The user's changes are lost but no error is shown. Always detect affected rows and alert.

---

# Related Knowledge Units

9.15 Pessimistic locking | 9.20 Transaction retry logic
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

