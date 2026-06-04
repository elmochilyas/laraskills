## Always Wrap lockForUpdate in a Transaction
---
## Category
Reliability
---
## Rule
Call `lockForUpdate()` only inside a `DB::transaction()` closure.
---
## Reason
`lockForUpdate()` acquires a row-level lock that is held only for the duration of the current transaction. Outside a transaction, the lock is released immediately after the query executes, providing zero protection against concurrent writes.
---
## Bad Example
```php
$product = Product::lockForUpdate()->find($id);
$product->decrement('stock', $quantity);
// Lock released after the SELECT — concurrent writes still race
```
---
## Good Example
```php
DB::transaction(function () use ($id, $quantity) {
    $product = Product::lockForUpdate()->find($id);
    $product->decrement('stock', $quantity);
});
```
Lock is held until the transaction commits, preventing concurrent modifications.
---
## Exceptions
No common exceptions. If you are not using a transaction, `lockForUpdate()` is a bug.
---
## Consequences Of Violation
Lost updates — two concurrent requests both read the same value, modify it, and the second write silently overwrites the first. Data integrity is lost.
---
## Keep Locked Transactions Short
---
## Category
Performance
---
## Rule
Keep the scope of locked transactions minimal — only the read-modify-write sequence. Move I/O operations (HTTP calls, file writes, email sending) outside the transaction.
---
## Reason
Database locks are held until the transaction commits or rolls back. Including slow I/O inside the locked section blocks all other writers to the locked rows, destroying application concurrency.
---
## Bad Example
```php
DB::transaction(function () use ($product, $user) {
    $inventory = Product::lockForUpdate()->find($product->id);
    $inventory->decrement('stock', 1);
    Mail::to($user)->send(new OrderConfirmation()); // 500ms I/O — lock held
});
```
---
## Good Example
```php
DB::transaction(function () use ($product) {
    $inventory = Product::lockForUpdate()->find($product->id);
    $inventory->decrement('stock', 1);
});
Mail::to($user)->send(new OrderConfirmation()); // I/O after lock released
```
---
## Exceptions
Operations that require atomicity of the write and the side effect (rare). Use compensating actions or queue-based patterns instead.
---
## Consequences Of Violation
Severe application slowdown under concurrency. A single slow endpoint holds locks for seconds, cascading to all other endpoints that touch the same rows.
---
## Lock Tables in Consistent Global Order
---
## Category
Maintainability
---
## Rule
Establish and enforce a project-wide ordering convention for locking multiple tables (e.g., alphabetically by table name).
---
## Reason
When transaction A locks Table1 then Table2, and transaction B locks Table2 then Table1, a circular wait condition guarantees deadlock under concurrent access. Consistent lock order eliminates this class of deadlock entirely.
---
## Bad Example
```php
// Transaction A
DB::transaction(function () {
    $order = Order::lockForUpdate()->find(1);
    $user = User::lockForUpdate()->find(1); // Different order than B
});

// Transaction B (concurrent)
DB::transaction(function () {
    $user = User::lockForUpdate()->find(1);
    $order = Order::lockForUpdate()->find(1); // Different order than A
    // Deadlock guaranteed
});
```
---
## Good Example
```php
// Both transactions lock in the same order
// Convention: alphabetical (Order before User)
DB::transaction(function () {
    $order = Order::lockForUpdate()->find(1);
    $user = User::lockForUpdate()->find(1);
});

DB::transaction(function () {
    $order = Order::lockForUpdate()->find(1);
    $user = User::lockForUpdate()->find(1);
    // No deadlock — same lock order
});
```
---
## Exceptions
Single-table transactions — no ordering needed. Third-party packages may not follow your convention; isolate them in separate transactions.
---
## Consequences Of Violation
Deadlocks under concurrent load causing transaction rollbacks, user-facing errors, and application instability. Debugging deadlocks is time-consuming and requires analyzing concurrent execution paths.
---
## Implement Deadlock Retry
---
## Category
Reliability
---
## Rule
Use `DB::transaction($callback, $attempts)` with at least 3 retry attempts for all code paths that acquire locks.
---
## Reason
Deadlocks are a fact of life in concurrent systems even with correct lock ordering. Without retry logic, a deadlock victim receives a `DeadlockException` that propagates as a 500 error to the user. Laravel's built-in retry mechanism re-runs the transaction closure transparently.
---
## Bad Example
```php
DB::transaction(function () {
    $product = Product::lockForUpdate()->find(1);
    $product->decrement('stock', 1);
});
// Default 1 attempt — deadlock kills the request
```
---
## Good Example
```php
DB::transaction(function () {
    $product = Product::lockForUpdate()->find(1);
    $product->decrement('stock', 1);
}, 3);
// Up to 3 attempts — transient deadlocks are retried transparently
```
---
## Exceptions
Non-idempotent closures (side effects before the retry point may execute twice). Ensure all side effects happen after the database write, or use idempotent operations.
---
## Consequences Of Violation
Unhandled deadlock exceptions produce 500 errors for users. Under moderate concurrency, the error rate becomes noticeable and erodes user trust.
---
## Lock Only on Indexed Columns
---
## Category
Performance
---
## Rule
Ensure the column used in the `WHERE` clause before `lockForUpdate()` is indexed.
---
## Reason
In MySQL InnoDB, locking scan on an unindexed column causes the database to lock every row it examines during the table scan, escalating to a table-level lock. This blocks all writes to the table, not just the intended rows.
---
## Bad Example
```php
DB::transaction(function () {
    $product = Product::lockForUpdate()->where('sku', 'ABC-123')->first();
    // 'sku' is not indexed — table-level lock on Product
});
```
---
## Good Example
```php
// Migration: $table->string('sku')->unique();
DB::transaction(function () {
    $product = Product::lockForUpdate()->where('sku', 'ABC-123')->first();
    // Indexed — only the matching row is locked
});
```
---
## Exceptions
Tables known to have fewer than 100 rows where a table-level scan is cheaper than index maintenance.
---
## Consequences Of Violation
Severe write throughput degradation. All concurrent writes to the table are serialized, turning a row-level locking issue into a table-level bottleneck.
---
## Use skipLocked for Queue Workers
---
## Category
Performance
---
## Rule
Use `skipLocked()` when claiming queue jobs or assigning work items to prevent worker contention.
---
## Reason
Without `skipLocked()`, multiple workers running the same job-picking query all see the same pending item. Each worker locks it, but only one can process it — the others either deadlock or waste time locking already-claimed jobs. `skipLocked()` skips rows locked by other transactions.
---
## Bad Example
```php
DB::transaction(function () {
    $job = Job::where('status', 'pending')
        ->lockForUpdate()
        ->first(); // All workers compete for the same row
});
```
---
## Good Example
```php
DB::transaction(function () {
    $job = Job::where('status', 'pending')
        ->lockForUpdate()
        ->skipLocked() // Skip rows already locked by other workers
        ->first();
});
```
---
## Exceptions
Single-worker queue configurations where contention is impossible.
---
## Consequences Of Violation
Worker contention, increased deadlock rates, wasted database connections, and reduced job throughput. Under heavy load, workers spend more time contending than processing.
---
## Never Use Pessimistic Locking for Read-Only Operations
---
## Category
Performance
---
## Rule
Do not apply `lockForUpdate()` or `sharedLock()` to read-only queries.
---
## Reason
Locking acquires database resources and blocks concurrent writers. For read-only operations, locking adds overhead with zero benefit — there is no write to protect. This degrades performance for every concurrent transaction touching the locked rows.
---
## Bad Example
```php
$product = Product::lockForUpdate()->find($id);
// Read-only — we only display the product
return view('products.show', compact('product'));
```
---
## Good Example
```php
$product = Product::find($id);
// No lock needed — read-only display
return view('products.show', compact('product'));
```
---
## Exceptions
Read operations that must see a consistent snapshot across multiple tables (use `sharedLock()` or `SERIALIZABLE` isolation level).
---
## Consequences Of Violation
Unnecessary lock contention reducing application throughput. Other transactions that need to write to the locked rows are blocked by a read operation that had no write intent.
---
## Use Optimistic Locking for Long-Running Operations
---
## Category
Design
---
## Rule
Use optimistic locking (version column) for operations where the time between read and write spans seconds or longer, such as form edits or document editing.
---
## Reason
Pessimistic locking holds database locks for the entire operation duration. For long-running operations, this blocks all other writers. Optimistic locking detects conflicts at write time, allowing concurrent reads and only failing at the update point.
---
## Bad Example
```php
// Form edit — user may spend 5 minutes editing
DB::transaction(function () use ($id) {
    $product = Product::lockForUpdate()->find($id);
    // Lock held for the entire request + user thinking time
    // Never do this — blocks all other writes for minutes
});
```
---
## Good Example
```php
$product = Product::find($id);
// User edits the form for 5 minutes
// On submit:
$affected = Product::where('id', $product->id)
    ->where('lock_version', $product->lock_version)
    ->update(['name' => $newName, 'lock_version' => $product->lock_version + 1]);
if ($affected === 0) {
    throw new OptimisticLockException('Product was modified by another user');
}
```
---
## Exceptions
Operations where conflicts are unacceptable and must be prevented, not detected (inventory deductions, balance transfers).
---
## Consequences Of Violation
For pessimistic: long-held locks cause application-wide blocking. For optimistic (without retry): users see conflict errors without guidance. Choose the right strategy for the contention profile.
