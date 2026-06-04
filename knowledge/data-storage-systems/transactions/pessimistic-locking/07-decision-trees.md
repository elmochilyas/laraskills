# 9-15 Pessimistic Locking - Decision Trees

## sharedLock vs lockForUpdate

---

## Decision Context

Choosing between shared locks (FOR SHARE) and exclusive locks (FOR UPDATE) for pessimistic locking.

---

## Decision Criteria

* performance: sharedLock allows concurrent reads; lockForUpdate serializes access
* architectural: sharedLock prevents writes but allows reads; lockForUpdate prevents both
* maintainability: sharedLock is safer for read-heavy workloads; lockForUpdate is simpler to reason about
* security: neither bypasses access controls

---

## Decision Tree

Need to pessimistically lock rows?

↓

Is the transaction only reading data (no writes planned)?

YES → Use sharedLock (FOR SHARE)

    ↓
    ```php
    DB::transaction(function () use ($reportId) {
        // Prevent others from modifying, but allow reads
        $report = Report::where('id', $reportId)->sharedLock()->first();
        // Generate report from locked data
    });
    ```
    
    ↓
    Other sessions can still read (plain SELECT)
    Other sessions cannot UPDATE, DELETE, or SELECT FOR UPDATE
    Other sessions CAN also acquire sharedLock
    Best for: report generation, data export, consistent reads

NO → Will the transaction update/delete the locked rows?

    ↓
    YES → Use lockForUpdate (FOR UPDATE)
        
        ↓
        ```php
        DB::transaction(function () use ($accountId, $amount) {
            $account = Account::where('id', $accountId)
                ->lockForUpdate()
                ->first();
            if ($account->balance >= $amount) {
                $account->balance -= $amount;
                $account->save();
            }
        });
        ```
        
        ↓
        Exclusive lock: others cannot read (FOR UPDATE), update, or delete
        Others can plain SELECT (reads old MVCC snapshot)
        Prevents race conditions in read-then-write
        Locks held until COMMIT

---

## Recommended Default

**Default:** Use lockForUpdate for read-then-write operations; use sharedLock only for read-only transactions that must see a consistent snapshot
**Reason:** lockForUpdate is the standard for protecting writes. sharedLock is specialized for read-only consistency requirements.

---

## Related Rules

* 9-15-1: Always Use lockForUpdate Inside Transaction
* 9-15-2: Never Use lockForUpdate for Read-Only Queries

---

## Related Skills

* Implement Pessimistic Locking with lockForUpdate
* Use Row-Level Locks
* Use SKIP LOCKED for Job Queues



## Pessimistic Locking for Queue Jobs vs Entity Updates

---

## Decision Context

Choosing how to apply pessimistic locking for different use cases: queue job processing vs protecting entity updates.

---

## Decision Criteria

* performance: queue jobs benefit from SKIP LOCKED; entity updates benefit from lockForUpdate
* architectural: queue jobs should never block; entity updates must wait for consistency
* maintainability: queue pattern is fire-and-forget; entity update pattern requires retry logic
* security: neither bypasses authorization

---

## Decision Tree

What is the use case for pessimistic locking?

↓

Queue/job processing (multiple workers consuming jobs)?

→ Use lockForUpdate with SKIP LOCKED

    ↓
    ```php
    $job = Job::where('status', 'pending')
        ->orderBy('priority')
        ->lockForUpdate()
        ->skipLocked()  // skip rows locked by other workers
        ->first();
    
    if ($job) {
        $job->update(['status' => 'processing']);
        // process...
        $job->update(['status' => 'done']);
    }
    ```
    
    ↓
    Never blocks — picks the next available (unlocked) job
    Multiple workers process in parallel without coordination
    Best for: Laravel queue, background job processing

↓

Entity update (protecting read-then-write on a specific record)?

→ Use lockForUpdate inside DB::transaction

    ↓
    ```php
    DB::transaction(function () use ($productId, $quantity) {
        $product = Product::where('id', $productId)
            ->lockForUpdate()
            ->first();
        if ($product->stock >= $quantity) {
            $product->decrement('stock', $quantity);
        }
    });
    ```
    
    ↓
    Blocks other transactions from reading/writing the same row
    Ensures atomic read-decrement
    Must be short (< 100ms) to avoid lock contention
    Best for: inventory, balances, critical resource allocation

---

## Recommended Default

**Default:** Use lockForUpdate + SKIP LOCKED for queue jobs; use lockForUpdate inside short transactions for entity updates
**Reason:** Queue jobs must never block. Entity updates must wait for consistency. Different patterns for different needs.

---

## Related Rules

* 9-15-1: Always Use lockForUpdate Inside Transaction
* 9-15-2: Never Use lockForUpdate for Read-Only Queries

---

## Related Skills

* Implement Pessimistic Locking with lockForUpdate
* Use SKIP LOCKED for Job Queues
* Use Row-Level Locks
