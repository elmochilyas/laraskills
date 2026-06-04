# 9-21 Implicit Transactions Laravel - Decision Trees

## Synchronous Event Listener vs Queued Listener

---

## Decision Context

Choosing between processing model event listeners synchronously (inside the transaction) or dispatching to the queue.

---

## Decision Criteria

* performance: synchronous listeners extend transaction lock duration; queued listeners are fire-and-forget
* architectural: synchronous listener failure rolls back the entire transaction; queued failures are isolated
* maintainability: queued listeners require queue worker; synchronous is simpler
* security: synchronous listeners roll back on exception — can cause unintended data loss

---

## Decision Tree

Model event listener (saved, created, updated) needs to perform work?

↓

Does the listener make external calls (API, email, file I/O) or take > 100ms?

YES → Queue the listener

    ↓
    ```php
    // ❌ BAD: synchronous email in transaction
    User::saved(function ($user) {
        Mail::send($user->email, 'Welcome'); // 2s in transaction!
    });
    
    // ✅ GOOD: queued listener
    User::saved(function ($user) {
        dispatch(new SendWelcomeEmail($user)); // instant
    });
    ```
    
    ↓
    Move slow external operations to queue
    Transaction duration stays < 100ms
    Listener failure doesn't roll back the model save
    
    ↓
    Use afterCommit() to defer dispatch:
    ```php
    dispatch(new ProcessOrder($order))->afterCommit();
    ```
    Job only dispatched after transaction commits
    Prevents job running with uncommitted data

NO → Listener is fast (DB-only, < 100ms)

    ↓
    Keep synchronous (default)
        
        ↓
        ```php
        User::saved(function ($user) {
            // Fast DB operations only
            Log::channel('database')->info('User created', ['id' => $user->id]);
        });
        ```
        
        ↓
    No queue overhead needed
    Listener executes in same transaction
    If listener throws, entire save rolls back — design accordingly

---

## Recommended Default

**Default:** Queue any event listener that makes external calls or takes > 100ms; keep DB-only fast listeners synchronous
**Reason:** Synchronous slow listeners extend transaction lock duration and risk rolling back the entire operation on failure.

---

## Related Rules

* 9-21-1: Always Use afterCommit for Jobs Dispatched in Events
* 9-21-2: Never Make External API Calls in Synchronous Event Listeners

---

## Related Skills

* Manage Implicit Transactions in Laravel
* Scope Transactions in Laravel
* Queue Event Listeners



## Immediate Job Dispatch vs afterCommit

---

## Decision Context

Choosing between dispatching a job immediately (in transaction) and deferring dispatch until after the transaction commits.

---

## Decision Criteria

* performance: afterCommit adds no delay (fire just after commit); immediate may dispatch before data is visible
* architectural: afterCommit ensures job sees committed data; immediate may read stale or rolled-back data
* maintainability: afterCommit is explicit about commit dependency; immediate is simpler
* security: job dispatched before commit could act on data that never persisted

---

## Decision Tree

Dispatching a queue job inside a model event or transaction?

↓

Does the job need to read the data that was just written?

YES → Use afterCommit

    ↓
    ```php
    // ✅ Job dispatched only after outer transaction commits
    dispatch(new ProcessOrder($order))->afterCommit();
    
    // Or globally in config:
    // 'queue' => ['after_commit' => true]
    ```
    
    ↓
    Job runs after data is persisted and visible
    If transaction rolls back, job is never dispatched
    Prevents "phantom job" — job runs but data doesn't exist
    
    ↓
    Best for: processing order after creation
    Sending confirmation after payment
    Any job that reads the committed data

NO → Job doesn't read the written data (e.g., notification only)

    ↓
    Immediate dispatch is safe
        
        ↓
        ```php
        // Job dispatched immediately (even if transaction rolls back)
        dispatch(new NotifyAdmin($order->id));
        ```
        
        ↓
    Job dispatched even if transaction later rolls back
    May send notification for data that doesn't exist
    Acceptable for non-critical notifications
    
    ↓
    Consider still using afterCommit for consistency:
    ```php
    dispatch(new NotifyAdmin($order->id))->afterCommit();
    ```
    Slightly delayed but consistent
    No "phantom" notifications

---

## Recommended Default

**Default:** Always use afterCommit for jobs dispatched inside events or transactions
**Reason:** Ensures job consistency — no phantom jobs, job sees committed data. The tiny delay is worth the correctness guarantee.

---

## Related Rules

* 9-21-1: Always Use afterCommit for Jobs Dispatched in Events
* 9-21-2: Never Make External API Calls in Synchronous Event Listeners

---

## Related Skills

* Manage Implicit Transactions in Laravel
* Scope Transactions in Laravel
* Queue Event Listeners
