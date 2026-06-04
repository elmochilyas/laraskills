# 9-7 Advisory Locks - Decision Trees

## Session-Level vs Transaction-Level Advisory Lock

---

## Decision Context

Choosing between `pg_advisory_lock` (session-level) and `pg_advisory_xact_lock` (transaction-level) for application coordination.

---

## Decision Criteria

* performance: session-level locks persist beyond transaction; auto-cleanup only on disconnect
* architectural: transaction-level locks auto-release on COMMIT/ROLLBACK
* maintainability: session-level requires explicit unlock in finally block
* security: leaked session-level locks block all other sessions indefinitely

---

## Decision Tree

Need to coordinate across processes with advisory locks?

↓

Can the critical section be enclosed in a single transaction?

YES → Use transaction-level lock (`pg_advisory_xact_lock`)

    ↓
    ```php
    DB::transaction(function () {
        DB::statement('SELECT pg_advisory_xact_lock(12345)');
        // critical section
    }); // lock auto-released on COMMIT
    ```
    
    ↓
    Safer: no risk of leaked locks
    Preferred for >90% of use cases

NO → Must hold lock across multiple transactions or outside any transaction?

    YES → Use session-level lock (`pg_advisory_lock`)
        
        ↓
        ```php
        try {
            DB::statement('SELECT pg_advisory_lock(12345)');
            // work across multiple transactions
        } finally {
            DB::statement('SELECT pg_advisory_unlock(12345)');
        }
        ```
        
        ↓
        WARNING: Always release in finally block
        If script crashes, lock persists until session ends

---

## Recommended Default

**Default:** Use transaction-level `pg_advisory_xact_lock`
**Reason:** Auto-release on commit eliminates lock leak risk. Session-level only when lock must span multiple transactions.

---

## Related Rules

* 9-7-1: Prefer Transaction-Level Advisory Locks
* 9-7-2: Always Release Advisory Locks in finally Block

---

## Related Skills

* Use Advisory Locks for Application Coordination
* Prevent Concurrent Job Processing
* Use Row-Level Locks



## Advisory Lock vs Row-Level Lock (FOR UPDATE)

---

## Decision Context

Choosing between advisory locks (application-defined keys) and row-level locks (FOR UPDATE on specific rows) for concurrency control.

---

## Decision Criteria

* performance: advisory locks are lightweight (shared memory); row locks involve index traversal
* architectural: advisory locks are not tied to any table row; row locks protect specific rows
* maintainability: advisory locks use arbitrary integer keys; row locks are explicit in queries
* security: advisory locks can block unrelated operations if keys collide

---

## Decision Tree

Need to prevent concurrent operations?

↓

Does the protection map to specific database rows?

YES → Use row-level locking (FOR UPDATE)

    ↓
    ```php
    DB::transaction(function () use ($orderId) {
        $order = Order::where('id', $orderId)->lockForUpdate()->first();
        $order->update(['status' => 'processing']);
    });
    ```
    
    ↓
    Row-locks integrate with transactions naturally
    No risk of key collision

NO → Is the coordination across processes/workers independent of rows?

    YES → Use advisory locks
        
        ↓
        ```php
        // Prevent duplicate job processing
        if (DB::select("SELECT pg_try_advisory_lock(?)", [$jobId])[0]->pg_try_advisory_lock) {
            try {
                // process job
            } finally {
                DB::statement("SELECT pg_advisory_unlock(?)", [$jobId]);
            }
        }
        ```
        
        ↓
        Best for: queue worker coordination
        Rate-limited API calls
        Multi-row/multi-table operations

---

## Recommended Default

**Default:** Use row-level locking when protection maps to specific rows; use advisory locks for cross-process coordination not tied to rows
**Reason:** Row locks are explicit, transparent, and transaction-integrated. Advisory locks are for application-level coordination where no single row represents the resource.

---

## Related Rules

* 9-7-1: Prefer Transaction-Level Advisory Locks
* 9-7-2: Always Release Advisory Locks in finally Block

---

## Related Skills

* Use Advisory Locks for Application Coordination
* Use Row-Level Locks
* Prevent Concurrent Job Processing
