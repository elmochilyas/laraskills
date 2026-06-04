# 9-16 Phantom Reads Vs Non Repeatable - Decision Trees

## Isolation Level Selection by Anomaly Prevention

---

## Decision Context

Choosing the appropriate isolation level based on which read anomalies must be prevented.

---

## Decision Criteria

* performance: READ COMMITTED lowest cost; REPEATABLE READ medium; SERIALIZABLE highest
* architectural: each level prevents different anomaly sets
* maintainability: higher isolation reduces application-level anomaly handling
* security: anomalies may expose stale or inconsistent data

---

## Decision Tree

What read anomalies must be prevented within a transaction?

↓

Must the same row return the same value on re-read?

YES → Need at least REPEATABLE READ

    ↓
    Must the same query return the same row set on re-execution?
    
    ↓
    YES → Need both non-repeatable read AND phantom read prevention
        
        ↓
        PostgreSQL: REPEATABLE READ prevents both (snapshot isolation)
        MySQL: REPEATABLE READ + FOR UPDATE prevents both (next-key locks)
        
        ↓
        ```php
        // PostgreSQL: Simple REPEATABLE READ is enough
        DB::statement('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        $count = Order::where('status', 'pending')->count();
        // Re-read: same count guaranteed
        
        // MySQL: Use FOR UPDATE for phantom prevention
        $orders = Order::where('status', 'pending')
            ->lockForUpdate()
            ->get();
        ```
        
        ↓
        PostgreSQL: snapshot isolation prevents both without locks
        MySQL: needs next-key locks (FOR UPDATE) for phantom prevention
    
    NO → Only need non-repeatable read prevention
        
        ↓
        REPEATABLE READ is sufficient
        Phantom reads are acceptable
        
        ↓
        ```php
        DB::statement('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        $balance = Account::find($id)->balance;
        // Re-read: same balance guaranteed
        // New accounts may appear in range queries
        ```

NO → READ COMMITTED is sufficient

    ↓
    ```php
    DB::statement('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    ```
    
    ↓
    Lowest cost, highest concurrency
    Accepts both non-repeatable reads and phantom reads
    Best for: reporting on immutable data, single-row lookups

---

## Recommended Default

**Default:** Use READ COMMITTED for most operations; use REPEATABLE READ when consistent reads are required within a transaction
**Reason:** READ COMMITTED offers the best performance. Only escalate when specific anomalies cause business logic bugs.

---

## Related Rules

* 9-16-1: Always Choose Isolation Level Based on Anomaly Prevention Needs
* 9-16-2: Never Assume REPEATABLE READ Prevents Write Skew

---

## Related Skills

* Distinguish and Prevent Phantom Reads vs Non-Repeatable Reads
* Choose Isolation Level
* Implement Serializable Snapshot Isolation



## PostgreSQL vs MySQL Anomaly Prevention at REPEATABLE READ

---

## Decision Context

Understanding the different behavior of REPEATABLE READ in PostgreSQL vs MySQL for phantom read prevention.

---

## Decision Criteria

* performance: PostgreSQL REPEATABLE READ has no lock overhead; MySQL requires FOR UPDATE for phantom prevention
* architectural: PostgreSQL snapshot isolation prevents both anomalies; MySQL only prevents non-repeatable reads for plain SELECT
* maintainability: PostgreSQL is simpler (one setting for both); MySQL requires explicit locking
* security: neither bypasses access controls

---

## Decision Tree

Using REPEATABLE READ isolation for consistent reads?

↓

Using PostgreSQL?

YES → REPEATABLE READ prevents both anomalies automatically

    ↓
    ```sql
    -- PostgreSQL: snapshot isolation
    BEGIN;
    SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
    SELECT count(*) FROM orders WHERE status = 'pending';
    -- INSERT from another transaction is NOT visible
    SELECT count(*) FROM orders WHERE status = 'pending';
    -- Same count guaranteed — snapshot is frozen at first query
    COMMIT;
    ```
    
    ↓
    No locks needed for phantom prevention
    Plain SELECT sees snapshot; FOR UPDATE sees latest
    Best overall REPEATABLE READ implementation

NO → Using MySQL?

    ↓
    REPEATABLE READ prevents non-repeatable reads but NOT phantoms for plain SELECT
    
    ↓
    ```sql
    -- MySQL: MVCC prevents non-repeatable reads
    -- But INSERT from another transaction IS visible on re-read!
    BEGIN;
    SELECT count(*) FROM orders WHERE status = 'pending';
    -- INSERT from another transaction appears!
    SELECT count(*) FROM orders WHERE status = 'pending';
    -- Different count possible!
    COMMIT;
    ```
    
    ↓
    To prevent phantoms in MySQL, use FOR UPDATE:
    ```sql
    SELECT count(*) FROM orders
    WHERE status = 'pending'
    FOR UPDATE;  -- next-key locks prevent INSERT of pending orders
    ```
    
    ↓
    FOR UPDATE with next-key locks prevents phantom inserts
    Higher overhead — locks gap between index entries
    Use only when phantom prevention is critical

---

## Recommended Default

**Default:** PostgreSQL: trust REPEATABLE READ for both anomalies. MySQL: use FOR UPDATE when phantoms must be prevented
**Reason:** PostgreSQL's snapshot isolation is more complete at REPEATABLE READ. MySQL requires explicit locking for phantom prevention.

---

## Related Rules

* 9-16-1: Always Choose Isolation Level Based on Anomaly Prevention Needs
* 9-16-2: Never Assume REPEATABLE READ Prevents Write Skew

---

## Related Skills

* Distinguish and Prevent Phantom Reads vs Non-Repeatable Reads
* Choose Isolation Level
* Use Row-Level Locks Strategically
