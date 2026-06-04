# 9-18 Write Skew Prevention - Decision Trees

## FOR UPDATE vs SERIALIZABLE for Write Skew Prevention

---

## Decision Context

Choosing between explicit FOR UPDATE locks and SERIALIZABLE isolation to prevent write skew anomalies.

---

## Decision Criteria

* performance: FOR UPDATE blocks concurrent transactions; SERIALIZABLE aborts on conflict (retry cost)
* architectural: FOR UPDATE requires knowing which rows to lock; SERIALIZABLE detects conflicts automatically
* maintainability: FOR UPDATE is explicit but needs lock analysis; SERIALIZABLE simpler but needs retry
* security: neither bypasses access controls

---

## Decision Tree

Invariant depends on a condition across multiple rows?

↓

Do you know exactly which rows determine the invariant?

YES → Use explicit FOR UPDATE

    ↓
    ```php
    // Doctor on-call: lock ALL rows with on_call = true
    DB::transaction(function () use ($doctorId) {
        $onCall = Doctor::where('on_call', true)
            ->lockForUpdate()
            ->count();
        if ($onCall < 1) {
            Doctor::find($doctorId)->update(['on_call' => true]);
        }
    });
    ```
    
    ↓
    Lock the rows that determine the invariant
    Second transaction waits until first commits
    After commit, second re-reads and sees updated state
    No retry needed — blocking serializes access
    
    ↓
    Best for: known lock scope, predictable contention

NO → Invariant depends on complex predicates or many tables?

    ↓
    Use SERIALIZABLE isolation (SSI in PostgreSQL)
        
        ↓
        ```php
        DB::transaction(function () use ($doctorId) {
            DB::statement('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
            $onCall = Doctor::where('on_call', true)->count();
            if ($onCall < 1) {
                Doctor::find($doctorId)->update(['on_call' => true]);
            }
        }, 5); // retry 5 times on serialization failure
        ```
        
        ↓
        SSI detects conflicts via predicate locking
        One transaction aborted (serialization_failure 40001)
        Application retries automatically
        
        ↓
        No manual lock analysis needed
        Higher overhead — entire transaction tracked
        Must implement retry with exponential backoff

---

## Recommended Default

**Default:** Prefer FOR UPDATE when lock scope is clear and simple; prefer SERIALIZABLE when invariants span complex predicates
**Reason:** FOR UPDATE is more predictable (blocking, no retries). SERIALIZABLE is easier to implement but requires retry handling.

---

## Related Rules

* 9-18-1: Always Use FOR UPDATE or SERIALIZABLE for Write Skew Prevention
* 9-18-2: Never Rely on REPEATABLE READ to Prevent Write Skew

---

## Related Skills

* Prevent Write Skew
* Implement Serializable Snapshot Isolation (SSI)
* Use Row-Level Locks



## REPEATABLE READ vs Higher Isolation for Write Skew

---

## Decision Context

Understanding why REPEATABLE READ does NOT prevent write skew and when to escalate to SERIALIZABLE.

---

## Decision Criteria

* performance: REPEATABLE READ has lower overhead than SERIALIZABLE
* architectural: REPEATABLE READ prevents non-repeatable reads and phantoms but NOT write skew
* maintainability: REPEATABLE READ is simpler but gives false sense of safety for invariants
* security: write skew can violate business invariants (overselling, double-booking)

---

## Decision Tree

Application has an invariant like "at least one doctor on call" or "total ≤ capacity"?

↓

Is the invariant enforced by a database constraint (CHECK, UNIQUE, FK)?

YES → Database constraint is sufficient

    ↓
    ```sql
    ALTER TABLE schedules ADD CONSTRAINT ... CHECK (...);
    ```
    
    ↓
    No write skew risk — database rejects violating updates
    No application-level locking needed

NO → Is the invariant checked via SELECT then UPDATE based on result?

    ↓
    YES → You are at risk of write skew
        
        ↓
        ```php
        // ❌ VULNERABLE: REPEATABLE READ does NOT prevent this
        $count = Doctor::where('on_call', true)->count();
        if ($count < 1) {
            Doctor::find($id)->update(['on_call' => true]);
        }
        // Both transactions pass the check at REPEATABLE READ!
        ```
        
        ↓
        REPEATABLE READ: each transaction reads its own snapshot
        Both see on_call count = 0
        Both set themselves on call → invariant violated
        
        ↓
        Fix: escalate to SERIALIZABLE or add FOR UPDATE
            
            ↓
            Use SERIALIZABLE:
            ```php
            DB::statement('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
            ```
            
            ↓
            Use FOR UPDATE:
            ```php
            $count = Doctor::where('on_call', true)
                ->lockForUpdate()
                ->count();
            ```

---

## Recommended Default

**Default:** Never rely on REPEATABLE READ to prevent write skew. Always use FOR UPDATE or SERIALIZABLE for multi-row invariants.
**Reason:** Write skew is the most subtle serialization anomaly. REPEATABLE READ appears safe but allows it. Only FOR UPDATE or SERIALIZABLE provide protection.

---

## Related Rules

* 9-18-1: Always Use FOR UPDATE or SERIALIZABLE for Write Skew Prevention
* 9-18-2: Never Rely on REPEATABLE READ to Prevent Write Skew

---

## Related Skills

* Prevent Write Skew
* Choose Isolation Level
* Implement Serializable Snapshot Isolation (SSI)
