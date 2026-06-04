# 9-5 Row Level Locks - Decision Trees

## FOR UPDATE vs FOR SHARE vs SKIP LOCKED vs NOWAIT

---

## Decision Context

Choosing the right row-level lock type for exclusive writes, shared reads, job queues, or fail-fast locking in concurrent transactions.

---

## Decision Criteria

* performance: exclusive locks block other writers; shared locks allow concurrent reads
* architectural: SKIP LOCKED for job queues; NOWAIT for fail-fast
* maintainability: SKIP LOCKED simplifies job queue implementation
* security: prevents race conditions in read-then-write sequences

---

## Decision Tree

Which row lock type to use?

↓

Is it a read-then-write sequence (critical section)?

YES → Is waiting acceptable?

    YES → Can other transactions read the row while you hold the lock?
    
        NO → `SELECT ... FOR UPDATE` (exclusive lock)
            
            ↓
            ```php
            DB::transaction(function () use ($id) {
                $account = Account::where('id', $id)->lockForUpdate()->first();
                $account->balance += 10;
                $account->save();
            });
            ```
            
            ↓
            Blocks other FOR UPDATE, UPDATE, DELETE
            Plain SELECT still reads (MVCC)
    
        YES → `SELECT ... FOR SHARE` (shared lock)
            
            ↓
            ```php
            $account = Account::where('id', $id)->sharedLock()->first();
            ```
            
            ↓
            Allows other shared reads
            Blocks FOR UPDATE, UPDATE, DELETE

NO → Need non-blocking behavior?

    YES → Is this a job queue/distributed worker pattern?
    
        YES → `SELECT ... FOR UPDATE SKIP LOCKED`
            
            ↓
            ```php
            $job = DB::table('jobs')
                ->where('status', 'pending')
                ->orderBy('priority')
                ->lockForUpdate()
                ->skipLocked()
                ->first();
            ```
            
            ↓
            Skips locked rows, returns only unlocked ones
            No waiting, workers grab next available job
    
        NO → Fail fast if row is locked?
        
            YES → `SELECT ... FOR UPDATE NOWAIT`
                
                ↓
                ```php
                try {
                    $account = Account::where('id', $id)->lockForUpdate()->nowait()->first();
                } catch (QueryException $e) {
                    // Row locked, handle (queue, retry, or reject)
                }
                ```
                
                ↓
                Immediate error if locked
                No waiting

NO → Read-only query?

    → No lock needed (plain SELECT)

---

## Recommended Default

**Default:** `FOR UPDATE` for critical sections; `SKIP LOCKED` for queues
**Reason:** These are the two most common patterns. `FOR SHARE` and `NOWAIT` are niche tools for specific scenarios.

---

## Related Rules

* 9-5-1: Always Use FOR UPDATE for Read-Update Sequences
* 9-5-2: Never Hold FOR UPDATE Locks Across External Calls

---

## Related Skills

* Use Row-Level Locks (FOR UPDATE, FOR SHARE, SKIP LOCKED, NOWAIT)
* Implement Job Queues with SKIP LOCKED
