# 9-3 PostgreSQL Isolation Specifics - Decision Trees

## SSI (SERIALIZABLE) vs Snapshot Isolation (REPEATABLE READ)

---

## Decision Context

Choosing between PostgreSQL's SSI (full serialization with predicate locks) and snapshot isolation (consistent read snapshot, write-write conflict detection) for transaction isolation.

---

## Decision Criteria

* performance: SSI uses SIREAD locks; higher conflict rate with longer transactions
* architectural: SSI prevents write skew; REPEATABLE READ does not
* maintainability: SSI requires retry logic for serialization failures
* security: prevents serialization anomalies

---

## Decision Tree

Which PostgreSQL isolation level?

↓

Need to prevent write skew (e.g., overlapping shifts, concurrent invariants)?

YES → Use SERIALIZABLE (SSI)

    ↓
    ```php
    DB::transaction(function () {
        DB::statement('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
        // operations that must be conflict-serializable
    });
    ```
    
    ↓
    Must implement retry for serialization failure (40001)
    ```
    for ($i = 0; $i < 3; $i++) {
        try { DB::transaction(...); break; }
        catch (QueryException $e) {
            if ($e->getCode() !== '40001') throw;
        }
    }
    ```
    
    ↓
    Monitor serialization_failure rate
    Keep transactions SHORT — longer transactions = more conflicts

NO → Consistent read snapshot needed for reporting?

    YES → Use REPEATABLE READ
        
        ↓
        Transaction sees data as of start time
        Write-write conflicts detected on first write
        Still allows write skew
        
        ↓
        ```php
        DB::transaction(function () {
            DB::statement('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
            // multiple SELECT queries see consistent data
        });
        ```

NO → Use READ COMMITTED (default, best performance)

---

## Recommended Default

**Default:** READ COMMITTED for most workloads
**Reason:** PostgreSQL's READ COMMITTED has no phantom reads (unlike MySQL). REPEATABLE READ and SERIALIZABLE only when specific anomalies must be prevented.

---

## Related Rules

* 9-3-1: Always Implement Retry for SERIALIZABLE Transactions
* 9-3-2: Never Use SERIALIZABLE Without Monitoring Conflict Rate

---

## Related Skills

* Use PostgreSQL Isolation Features (SSI and Snapshot Isolation)
* Prevent Write Skew
