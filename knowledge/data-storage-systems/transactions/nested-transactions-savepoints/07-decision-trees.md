# 9-12 Nested Transactions Savepoints - Decision Trees

## Nested Transaction vs Sequential Transactions

---

## Decision Context

Choosing between nesting DB::transaction calls (savepoints) and executing separate sequential transactions for composed services.

---

## Decision Criteria

* performance: savepoints have minimal overhead; sequential transactions release locks between each
* architectural: nested = all-or-nothing rollback of entire composition; sequential = partial success possible
* maintainability: nesting allows service composition without coupling transaction logic
* security: nesting doesn't affect access controls

---

## Decision Tree

Multiple service methods each requiring transactional safety?

↓

Should all services succeed or fail together (atomic composition)?

YES → Use nested transactions (savepoints)

    ↓
    ```php
    // Service A
    function createOrder($data) {
        return DB::transaction(fn() => Order::create($data));
    }
    
    // Service B (uses savepoint inside A's transaction)
    function processPayment($orderId, $amount) {
        return DB::transaction(fn() => Payment::create([...]));
    }
    
    // Composition: atomic
    DB::transaction(function () {
        $order = createOrder($data);
        processPayment($order->id, $data['total']);
        // Both succeed or both roll back
    });
    ```
    
    ↓
    Inner "commit" just releases savepoint
    Only outer COMMIT persists
    Inner failure rolls back to savepoint only

NO → Can services independently succeed or fail?

    ↓
    YES → Use sequential (separate) transactions
        
        ↓
        ```php
        $order = DB::transaction(fn() => Order::create($data));
        // order is persisted even if payment fails
        
        try {
            $payment = DB::transaction(fn() => Payment::create([...]));
        } catch (\Exception $e) {
            // payment failed, but order is saved
            Log::error("Payment failed for order {$order->id}");
        }
        ```
        
        ↓
    Better isolation between operations
    No lock escalation from long-running outer transaction
    Handle partial failures explicitly

---

## Recommended Default

**Default:** Use nested transactions for atomic composition of related services; use sequential transactions when services can independently succeed
**Reason:** Nested = atomic rollback (all or nothing). Sequential = independent outcomes. Choose based on business requirements.

---

## Related Rules

* 9-12-1: Never Assume Inner Transactions Are Independent
* 9-12-2: Always Use DB::transaction Closure (Even for Nested)

---

## Related Skills

* Use Nested Transactions and Savepoints
* Scope Transactions in Laravel
* Process Batch Items with Savepoints



## Partial Rollback in Batch Processing

---

## Decision Context

Choosing whether to use savepoints for per-item partial rollback or use a transaction per item when processing batches.

---

## Decision Criteria

* performance: single outer transaction with savepoints has less overhead than N individual transactions
* architectural: savepoints preserve prior items on failure; per-item transactions fully isolate each item
* maintainability: savepoint-based batch is one transaction; per-item is many small transactions
* security: partial rollback may leave intermediate state visible to other transactions

---

## Decision Tree

Processing a batch of items where some may fail?

↓

Should a failed item roll back only itself, preserving other items?

YES → Use savepoints for per-item rollback

    ↓
    ```php
    DB::transaction(function () use ($items) {
        foreach ($items as $item) {
            try {
                DB::transaction(function () use ($item) {
                    $item->process();
                }); // rollback to savepoint on failure
            } catch (\Exception $e) {
                Log::error("Item {$item->id} failed: {$e->getMessage()}");
                // continue processing remaining items
            }
        }
    });
    ```
    
    ↓
    Failed item rolls back to savepoint
    Previous items remain committed in outer transaction
    Outer transaction commits all successful items
    Best for: batch imports, ETL, data migration

NO → Should a failed item not affect others, and each be independently committed?

    ↓
    YES → Use separate transaction per item
        
        ↓
        ```php
        foreach ($items as $item) {
            try {
                DB::transaction(function () use ($item) {
                    $item->process();
                });
            } catch (\Exception $e) {
                Log::error("Item {$item->id} failed: {$e->getMessage()}");
                // item is not persisted; previously committed items are safe
            }
        }
        ```
        
        ↓
    Each item committed independently
    No single lock held across all items
    Better for long-running batches (no MVCC bloat from one big transaction)
    But: higher overhead (N transactions instead of 1)

---

## Recommended Default

**Default:** Use savepoints when batch must be atomic but tolerant of per-item failures; use per-item transactions when batch processing is long and MVCC bloat is a concern
**Reason:** Savepoints give atomicity with partial failure tolerance. Per-item transactions avoid long lock durations.

---

## Related Rules

* 9-12-1: Never Assume Inner Transactions Are Independent
* 9-12-2: Always Use DB::transaction Closure (Even for Nested)

---

## Related Skills

* Use Nested Transactions and Savepoints
* Process Batch Items with Savepoints
* Keep Transactions Short
