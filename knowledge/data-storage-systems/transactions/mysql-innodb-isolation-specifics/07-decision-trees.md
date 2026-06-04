# 9-4 MySQL InnoDB Isolation Specifics - Decision Trees

## REPEATABLE READ (Default) vs READ COMMITTED for Gap Lock Contention

---

## Decision Context

Choosing between MySQL's default REPEATABLE READ (with gap locks/next-key locks) and READ COMMITTED (no gap locks) when lock contention causes deadlocks or performance issues.

---

## Decision Criteria

* performance: gap locks cause lock contention, especially on range queries
* architectural: REPEATABLE READ prevents phantoms; READ COMMITTED allows them
* maintainability: READ COMMITTED requires binlog_format = ROW or MIXED
* security: gap locks can cause denial of service via blocking

---

## Decision Tree

Experiencing deadlocks or lock contention in MySQL InnoDB?

↓

Are the deadlocks caused by gap locks (e.g., concurrent INSERTs into overlapping ranges)?

YES → Consider switching to READ COMMITTED

    ↓
    Check binlog format (must be ROW or MIXED, not STATEMENT):
    ```ini
    transaction-isolation = READ-COMMITTED
    binlog_format = ROW
    ```
    
    ↓
    Trade-off: loses phantom read prevention
    But: eliminates gap lock contention, improves concurrency
    
    ↓
    For reporting consistency without gap locks:
    Use REPEATABLE READ for specific read-only transactions
    ```php
    DB::statement('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    ```

NO → Queries missing indexes causing excessive lock range?

    YES → Add indexes
        
        ↓
        `SELECT * FROM orders WHERE status = 'pending' FOR UPDATE`
        Without index on `status`: locks ALL rows examined (gap locks on entire table)
        With index: locks only matching rows
        
        ↓
        An indexed query at REPEATABLE READ narrows the lock range significantly

NO → Plain SELECTs don't use next-key locks (MVCC snapshot)

    → Verify `SELECT ... FOR UPDATE` and `FOR SHARE` queries only
    → Plain SELECTs are lock-free in InnoDB

---

## Recommended Default

**Default:** Keep REPEATABLE READ unless gap lock contention is confirmed
**Reason:** Gap locks are the price for phantom-read prevention. Measure contention before switching. READ COMMITTED is the standard fix for "too many deadlocks" in InnoDB.

---

## Related Rules

* 9-4-1: Always Use READ COMMITTED If Gap Locks Cause Issues
* 9-4-2: Never Use STATEMENT-Based Binlog With READ COMMITTED

---

## Related Skills

* Manage MySQL InnoDB Isolation and Locking
* Detect and Resolve Deadlocks
