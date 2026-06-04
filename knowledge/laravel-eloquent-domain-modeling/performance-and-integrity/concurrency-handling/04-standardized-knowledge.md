# Concurrency Handling

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Concurrency Handling |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Concurrency handling addresses multiple requests or processes reading and writing the same data simultaneously. Without protection, concurrent operations cause lost updates, phantom reads, and data corruption. Eloquent provides pessimistic locking (`lockForUpdate()`, `sharedLock()`), transaction isolation control, and application-level optimistic locking to prevent these issues. The choice of strategy depends on contention level, cost of conflicts, and acceptable throughput.

## Core Concepts

- **Pessimistic locking**: `lockForUpdate()` acquires an exclusive row-level lock preventing other transactions from reading (with `FOR UPDATE`) or writing locked rows until the transaction commits.
- **Shared lock**: `sharedLock()` acquires a lock (`LOCK IN SHARE MODE` / `FOR SHARE`) preventing writes but allowing reads.
- **Transaction isolation levels**: `READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ` (MySQL default), `SERIALIZABLE` — each trades consistency for concurrency.
- **Optimistic locking**: A `lock_version` column incremented on each update. Before updating, verify the version matches the original read; abort or retry on mismatch.
- **Lost update problem**: Two transactions read the same row, both modify it, the second write overwrites the first.
- **Deadlock**: Each transaction holds a lock the other needs. The database kills one transaction, which must be retried.

## When To Use

- Inventory deduction, balance transfers, or any read-then-write sequence on shared data
- Queue workers claiming jobs atomically
- Long-running form edits where data staleness is unacceptable
- Any operation where two concurrent requests must not produce incorrect final state

## When NOT To Use

- Read-only operations — locking adds overhead with zero benefit
- Single-request writes with no concurrent access (trivial CRUD)
- Operations where eventual consistency is acceptable
- Hot rows under extreme contention — pessimistic locking kills throughput; consider queue-based serialization instead

## Best Practices

- **Always use a transaction with `lockForUpdate()`**: `lockForUpdate()` outside `DB::transaction()` releases the lock immediately after the query executes, providing zero protection. The lock only persists for the transaction duration. Always wrap the lock-then-write sequence in a single transaction closure.
- **Keep transactions short**: Locks are held until commit/rollback. Slow operations (HTTP calls, file I/O) inside a locked transaction block all other writers. Move slow I/O outside the transaction; only the read-modify-write sequence should be inside.
- **Lock in a consistent global order**: Transaction A locks Table1 then Table2. Transaction B locks Table2 then Table1. This guarantees deadlock under concurrency. Establish a project-wide locking order convention (e.g., alphabetically by table name) and enforce it in code review.
- **Implement deadlock retry**: `DB::transaction($callback, 3)` retries the closure on deadlock. Ensure the closure is idempotent — no side effects (emails, API calls) before the retry point, or they may execute twice.
- **Lock on indexed columns**: `lockForUpdate()` on an unindexed column escalates to a table-level lock in MySQL InnoDB, blocking all writes to the table.

## Architecture Guidelines

- Pessimistic locking for short, high-contention operations (inventory, balances)
- Optimistic locking for long-running operations (form edits, document editing)
- Use `skipLocked()` for queue workers to grab available jobs without contention
- Set `innodb_lock_wait_timeout = 5` (MySQL) or `lock_timeout = '5s'` (PostgreSQL) to prevent indefinite blocking
- Log and monitor lock wait times to identify contention hotspots

## Performance Considerations

- Row-level lock overhead is proportional to locked rows. Locking 100 rows is fine; 10,000 causes significant contention.
- Deadlock detection has CPU cost. Frequent deadlocks indicate a design problem (wrong locking order, too many locks per transaction).
- `lockForUpdate()` on unindexed columns escalates to table-level locks in MySQL InnoDB.
- Long transactions with locks cause replication lag in MySQL — the binlog is flushed only on transaction commit.

## Security Considerations

- No direct security implications — locking is a consistency mechanism
- Ensure deadlock retry logic does not introduce infinite loops that could be exploited as denial-of-service vectors

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Locking without a transaction | copy-paste without understanding | Lock released immediately — zero protection | Always wrap in `DB::transaction()` |
| Holding locks during I/O | Putting all logic inside transaction | Other requests blocked during slow I/O | Only lock the read-modify-write sequence |
| Inconsistent lock order | Different developers writing different paths | Guaranteed deadlock under concurrency | Establish and enforce global lock order |
| No deadlock retry | Assuming deadlocks won't happen | Transaction fails, user sees error | Use `DB::transaction($callback, 3)` |
| `lockForUpdate()` on unindexed column | Assuming any column works | Table-level lock escalation | Ensure locked column is indexed |

## Anti-Patterns

- **Shotgun transactions**: Wrapping huge blobs of code (including HTTP calls, file processing) in a single transaction. Keeps locks held for seconds, destroying concurrency.
- **Optimistic locking without retry**: Detecting conflicts but not handling them. Users see "conflict" errors without retry guidance.
- **Row-level lock on hot row**: A single row (e.g., "total users count") locked by every write. Consider atomic counters or queue-based serialization.

## Examples

```php
// Pessimistic locking for inventory deduction
DB::transaction(function () use ($productId, $quantity) {
    $product = Product::lockForUpdate()->find($productId);
    if ($product->stock < $quantity) {
        throw new InsufficientStockException();
    }
    $product->decrement('stock', $quantity);
});

// Skip locked for queue workers
$job = Job::where('status', 'pending')
    ->lockForUpdate()
    ->skipLocked()
    ->first();

// Optimistic locking pattern (application-level)
$product = Product::find($productId);
$affected = Product::where('id', $productId)
    ->where('lock_version', $product->lock_version)
    ->update(['stock' => $product->stock - $quantity, 'lock_version' => $product->lock_version + 1]);
if ($affected === 0) {
    throw new OptimisticLockException();
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Database transactions fundamentals |
| Prerequisite | Query builder basics |
| Closely Related | unique-enforcement |
| Closely Related | upsert-patterns |
| Closely Related | database-constraints |

## AI Agent Notes

- Default to pessimistic locking for code generation in high-contention domains
- Always wrap `lockForUpdate()` in `DB::transaction()` — verify transaction scope
- Generate idempotent closures for `DB::transaction($callback, $attempts)` — side effects before retry point execute multiple times
- Use `skipLocked()` for queue job claiming patterns

## Verification

- [ ] `lockForUpdate()` is called inside a `DB::transaction()` closure
- [ ] Transaction is short — no I/O operations inside the lock scope
- [ ] Deadlock retry is configured with `DB::transaction($callback, $attempts)` where `$attempts >= 3`
- [ ] Locked columns are indexed
- [ ] All code paths lock tables in the same global order
