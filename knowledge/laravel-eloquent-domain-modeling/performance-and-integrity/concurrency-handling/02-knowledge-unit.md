# Concurrency Handling — Locking & Transaction Isolation

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Performance & Data Integrity
- **Knowledge Unit:** Concurrency Handling
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Concurrency handling in Eloquent addresses the challenge of multiple requests or processes reading and writing the same data simultaneously. Without protection, concurrent operations cause lost updates, phantom reads, and data corruption. Eloquent provides pessimistic locking (`lockForUpdate()`, `sharedLock()`), transaction isolation control, and model-level optimistic locking (via a dedicated `lock_version` column) to prevent these issues. The choice of strategy depends on the contention level, the cost of conflicts, and the acceptable throughput.

---

## Core Concepts

- **Pessimistic locking:** `lockForUpdate()` acquires an exclusive row-level lock that prevents other transactions from reading (with `FOR UPDATE`) or writing the locked rows until the transaction commits or rolls back.
- **Shared lock:** `sharedLock()` acquires a shared lock (`LOCK IN SHARE MODE` / `FOR SHARE`) that prevents other transactions from modifying the row but allows reads.
- **Transaction isolation levels:** `READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ` (MySQL default), `SERIALIZABLE`. Each level trades consistency for concurrency.
- **Optimistic locking (application-level):** Add a `lock_version` integer column incremented on each update. Before updating, check that the version matches the original read; if not, abort or retry. Not built into Eloquent core but implementable via traits.
- **Lost update problem:** Two concurrent transactions read the same row, both modify it, and the second write overwrites the first (the first update is "lost").
- **Deadlock:** Two transactions each hold a lock the other needs. MySQL/PostgreSQL detects deadlocks and kills one transaction, which must be retried.

---

## Mental Models

### The Conference Room Metaphor
Imagine a conference room with a whiteboard containing critical data. `lockForUpdate()` is like locking the door and taking the only marker — no one else can read or write until you're done. `sharedLock()` is like allowing people to look through the window (read) but not enter or change the board. Optimistic locking is like writing "Revision 5" on the board — if you come back and it says "Revision 6", someone else changed it, and you must redo your work.

### The Git Merge Analogy
Pessimistic locking is like having a file checked out exclusively in TFVC — no one else can edit it. Optimistic locking is like Git — everyone can edit their local copy, but merging detects conflicts. The choice mirrors VCS architecture: pessimistic avoids conflicts by preventing them; optimistic allows conflicts but resolves them.

---

## Internal Mechanics

- `lockForUpdate()` and `sharedLock()` call `Query\Builder::lock()` with the appropriate lock value. The grammar generates `FOR UPDATE` or `LOCK IN SHARE MODE` / `FOR SHARE` depending on the database.
- These only work inside a transaction (`DB::beginTransaction()` or `transaction()` closure). Without a transaction, the lock is released immediately after the query executes.
- MySQL InnoDB uses next-key locking for `FOR UPDATE` — it locks the rows matched and the gap before/after them to prevent phantom inserts. This can cause lock escalation on range queries.
- PostgreSQL uses row-level locking for `FOR UPDATE` and does not lock gaps by default unless `FOR UPDATE` is used with `NOWAIT` or `SKIP LOCKED`.
- Deadlocks are detected by the database engine (InnoDB: `SHOW ENGINE INNODB STATUS`). The transaction with the least work done is typically chosen as the victim.

---

## Patterns

- **Deducting inventory:**
```php
DB::transaction(function () use ($productId, $quantity) {
    $product = Product::lockForUpdate()->find($productId);
    if ($product->stock < $quantity) {
        throw new InsufficientStockException();
    }
    $product->decrement('stock', $quantity);
});
```
- **Reading for update, then updating:** Always lock the row before reading the value you'll update. Without the lock, another transaction changes the value between your read and write.
- **Skip locked for queue workers:** `Job::where('status', 'pending')->lockForUpdate()->skipLocked()->first()` — each worker grabs the next available job without contending.
- **Optimistic locking for long-running forms:** Store `lock_version` as a hidden field. On submission, verify version hasn't changed before saving. Retry or notify user of conflict.
- **Snapshot isolation:** Use `SERIALIZABLE` isolation for operations that must see a consistent snapshot of multiple tables.

---

## Architectural Decisions

- **Pessimistic vs. optimistic locking:** Pessimistic is simpler to implement but reduces concurrency. Optimistic scales better but requires retry logic. Default to pessimistic for short, high-contention operations (inventory, balances). Default to optimistic for long-running operations (form edits, document editing).
- **Transaction length:** Keep transactions as short as possible. Long transactions hold locks longer, increasing contention and deadlock probability. Move slow operations (HTTP calls, file I/O) outside the transaction.
- **Deadlock retry strategy:** Always implement retry logic with exponential backoff for deadlock victims. Laravel provides `DB::transaction($callback, $attempts)` — default 1 attempt; set to 3–5 for critical paths.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Pessimistic locking prevents lost updates | Reduces concurrent throughput | Acceptable for low-contention; avoid for hot rows |
| `sharedLock()` allows concurrent reads | Prevents writes, may cause writer starvation | Use for read-then-write sequences |
| Optimistic locking scales well | Requires retry logic on conflict | More complex; conflicts increase with contention |
| Transaction isolation levels for fine-grained control | `SERIALIZABLE` kills throughput | Use `REPEATABLE READ` or `READ COMMITTED` by default |
| `skipLocked()` for queue workers | Skips locked rows silently | May skip valid rows that are temporarily locked |

---

## Performance Considerations

- Row-level locks add overhead proportional to the number of locked rows. Locking 100 rows in a single query is fine; locking 10,000 rows can cause significant contention.
- Deadlock detection has a CPU cost. Frequent deadlocks indicate a design problem (wrong locking order, too many locks per transaction).
- `lockForUpdate()` on unindexed columns escalates to table-level locks in MySQL InnoDB — every access to the table waits. Always lock on indexed columns.
- Long transactions with locks cause replication lag in MySQL because the binlog is flushed only on transaction commit.

---

## Production Considerations

- **Implement deadlock retry:** `DB::transaction(function() { ... }, 3)` — Laravel retries the entire closure on deadlock. Ensure the closure is idempotent (no side effects before the retry).
- **Monitor lock wait timeouts:** `SHOW GLOBAL STATUS LIKE 'Innodb_row_lock_current_waits'` in MySQL. Rising lock waits indicate contention issues.
- **Set `lock_timeout` or `statement_timeout`:** Prevent a slow transaction from holding locks indefinitely. MySQL: `innodb_lock_wait_timeout = 5` (seconds). PostgreSQL: `lock_timeout = '5s'`.
- **Use `NOWAIT` or `SKIP LOCKED`:** Prevent waiting on locks. `lockForUpdate()->nowait()` throws immediately if the row is locked. `lockForUpdate()->skipLocked()` skips locked rows entirely.
- **Test concurrency under load:** Use k6, Locust, or a simple parallel HTTP pool to validate locking behavior under realistic concurrency levels.

---

## Common Mistakes

- **Locking without a transaction:** `lockForUpdate()` outside `DB::transaction()` — the lock is released immediately after the query runs, providing zero protection.
- **Holding locks during slow operations:** Making HTTP API calls or file system operations inside a locked transaction. Locks are held for the entire duration, blocking all other requests.
- **Different lock order in different code paths:** Transaction A locks Table1 then Table2; Transaction B locks Table2 then Table1. This guarantees deadlock under concurrency — always lock in the same global order.
- **Assuming `lockForUpdate()` prevents inserts for non-existent rows:** MySQL's gap locking prevents phantom inserts; PostgreSQL does not. Test your locking strategy on the target database.
- **Not handling `DeadlockException`:** Laravel's `DB::transaction()` with `$attempts > 1` handles it, but only if the closure is a clean transaction without side effects. Side effects (events, external API calls) may execute twice on retry.

---

## Failure Modes

- **Deadlock chain reaction:** A single slow transaction holding locks causes cascading lock waits, eventually timing out and rolling back multiple transactions. Mitigate with timeouts and short transactions.
- **Escalation to table lock:** `lockForUpdate()` on an unindexed column causes InnoDB to escalate to table-level lock. All writes to the table are blocked until the transaction completes.
- **Phantom read under REPEATABLE READ:** MySQL prevents phantoms with gap locks; PostgreSQL does not by default. If your application depends on "no new matching rows appearing during a transaction," use `SERIALIZABLE` on PostgreSQL.
- **Optimistic locking conflict storm:** Under high contention, optimistic locking users all fail simultaneously and retry at the same time, compounding the load. Add jitter to retry timing.

---

## Ecosystem Usage

- **Laravel Cashier:** Subscription updates use pessimistic locking inside transactions to prevent double-charging.
- **Laravel Horizon:** Queue worker job reservation uses `lockForUpdate()->skipLocked()` to atomically claim jobs without contention.
- **Laravel Spark:** Team member management uses transactions with locking for role assignment consistency.
- **Laravel Nova:** Action processing uses `lockForUpdate()` for idempotent execution of destructive actions.

---

## Related Knowledge Units

### Prerequisites
- Database transactions fundamentals
- Eloquent query builder basics

### Related Topics
- `unique-enforcement` (find-or-create race conditions)
- `upsert-patterns` (bulk atomic operations)
- `database-constraints` (locking interaction with constraints)

### Advanced Follow-up Topics
- Distributed locking with Redis (Redlock, Laravel Cache locks)
- Saga pattern for distributed transactions
- Event sourcing as an alternative to locking

---

## Research Notes

### Source Analysis
`Illuminate\Database\Query\Builder::lockForUpdate()` and `sharedLock()` at `src/Illuminate/Database/Query/Builder.php`. Grammar implementations in `MySqlGrammar.php`, `PostgresGrammar.php`, `SQLiteGrammar.php`, `SqlServerGrammar.php`.

### Key Insight
The most common concurrency mistake in Eloquent is using `lockForUpdate()` without a transaction. The second most common is holding locks during I/O operations. The solution is always the same: keep transactions short, lock only what you need, and always lock in the same order.

### Version-Specific Notes
- Laravel 7+: `lockForUpdate()` and `sharedLock()` on Eloquent builder.
- Laravel 8: `skipLocked()` and `nowait()` added for MySQL 8+ and PostgreSQL.
- Laravel 9: Improved deadlock retry in `DB::transaction()`.
- Laravel 10+: `lockForUpdate()` now works with union queries.
- Laravel 11: `SKIP LOCKED` support for SQLite.
