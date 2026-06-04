# 9-9 Deadlock Prevention Patterns - Decision Trees

## Consistent Lock Ordering vs Index-Based Lock Narrowing

---

## Decision Context

Choosing between enforcing consistent lock ordering across all transactions and using indexes to narrow lock ranges for deadlock prevention.

---

## Decision Criteria

* performance: consistent ordering adds no overhead; indexes reduce lock range and contention
* architectural: ordering requires application-wide convention; indexes require DDL changes
* maintainability: ordering enforced via code review or LockManager service; indexes are declarative
* security: neither prevents legitimate access

---

## Decision Tree

Deadlock-prone application with multiple concurrent transactions?

↓

Do transactions lock multiple tables/rows in different orders?

YES → Enforce consistent lock ordering

    ↓
    Define a global lock order for all tables:
    e.g., user → order → payment → inventory
    
    ↓
    ```php
    // ✅ All transactions lock in same order
    DB::transaction(function () {
        $user = User::lockForUpdate()->find($userId);
        $order = Order::lockForUpdate()->find($orderId);
    });
    
    // ❌ Never reverse the order
    // $order then $user → deadlock risk
    ```
    
    ↓
    Use a LockManager service to centralize ordering
    Enforce via code review and static analysis

NO → Do UPDATE/DELETE queries scan more rows than needed?

    YES → Add indexes to narrow lock ranges
        
        ↓
        Without index: full table scan → all rows locked
        With index: only matching rows locked
        
        ↓
        ```sql
        -- Without index on (user_id, status): locks ALL examined rows
        -- With composite index: locks only matching rows
        CREATE INDEX idx_orders_user_status ON orders(user_id, status);
        
        UPDATE orders SET status = 'processed'
        WHERE user_id = 123 AND status = 'pending';
        ```
        
        ↓
        Analyze slow query log for missing indexes
        Use EXPLAIN to verify index usage on UPDATE/DELETE/FOR UPDATE

---

## Recommended Default

**Default:** Enforce consistent lock ordering AND index WHERE clauses used in UPDATE/DELETE/FOR UPDATE
**Reason:** These are complementary — ordering prevents circular deadlocks, indexes prevent unnecessary lock range escalation.

---

## Related Rules

* 9-9-1: Always Lock Tables in Consistent Order
* 9-9-2: Never Include User Interaction in Transactions

---

## Related Skills

* Prevent Deadlocks with Consistent Ordering
* Use Row-Level Locks Strategically
* Create Indexes for Lock Narrowing



## Blocking Lock vs SKIP LOCKED vs NOWAIT

---

## Decision Context

Choosing how to handle lock contention: wait for lock (default), skip locked rows, or fail immediately.

---

## Decision Criteria

* performance: blocking wait increases latency under contention; SKIP LOCKED maximizes throughput; NOWAIT fails fast
* architectural: SKIP LOCKED skips rows; NOWAIT throws error; blocking wait eventually acquires lock
* maintainability: SKIP LOCKED may starve some rows; NOWAIT requires retry logic; blocking is simplest
* security: none differentiate on access control

---

## Decision Tree

Need to acquire a lock on a row but it may be held by another transaction?

↓

Is this a queue/job processing scenario where throughput matters?

YES → Use SKIP LOCKED

    ↓
    ```php
    $job = Job::where('status', 'pending')
        ->lockForUpdate()
        ->skipLocked()  // skip rows locked by other workers
        ->first();
    ```
    
    ↓
    Never blocks waiting for locked rows
    Processes available rows immediately
    Highest throughput for concurrent workers
    
    ↓
    Risk: some rows may be skipped repeatedly under heavy load
    OK for job queues where all rows eventually get processed

NO → Is immediate failure preferred over waiting?

    YES → Use NOWAIT
        
        ↓
        ```php
        $account = Account::where('id', $id)
            ->lockForUpdate()
            ->nowait()  // fail immediately if locked
            ->first();
        ```
        
        ↓
        Throws error if row is locked
        Fail fast — useful for user-facing operations
        Implement retry with backoff
        
    NO → Use blocking lock (default FOR UPDATE)
        
        ↓
        Waits until lock is released or lock_timeout expires
        Simplest approach for low-contention scenarios
        Set appropriate lock_wait_timeout (5-10s for web)

---

## Recommended Default

**Default:** Use blocking FOR UPDATE for most operations; use SKIP LOCKED for job queues; use NOWAIT for user-facing fail-fast scenarios
**Reason:** Blocking is simplest for low contention. SKIP LOCKED and NOWAIT are targeted optimizations for specific patterns.

---

## Related Rules

* 9-9-1: Always Lock Tables in Consistent Order
* 9-9-2: Never Include User Interaction in Transactions

---

## Related Skills

* Prevent Deadlocks with Consistent Ordering
* Use Row-Level Locks Strategically
* Implement Job Queue with SKIP LOCKED
