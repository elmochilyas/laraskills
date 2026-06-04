# 9-10 Lock Wait Timeout - Decision Trees

## Interactive vs Batch Lock Wait Timeout

---

## Decision Context

Choosing appropriate lock wait timeout values for different workload types.

---

## Decision Criteria

* performance: lower timeout fails fast under contention; higher timeout reduces transient failures
* architectural: interactive queries need short timeouts; batch jobs need longer tolerance
* maintainability: per-connection vs global timeout settings
* security: timeout errors can cause partial operations if not wrapped in transactions

---

## Decision Tree

What type of workload is this?

↓

Interactive web request (user-facing)?

YES → Set low timeout (5-10s)

    ↓
    MySQL: SET SESSION innodb_lock_wait_timeout = 5;
    PostgreSQL: SET lock_timeout = '5s';
    
    ↓
    ```php
    // Per-transaction timeout in Laravel
    DB::statement('SET SESSION innodb_lock_wait_timeout = 5');
    DB::transaction(function () {
        // user-facing query
    });
    ```
    
    ↓
    User gets error in 5s instead of waiting default 50s
    Better UX: fail fast rather than hang
    Implement retry or show friendly error message

NO → Batch job (reporting, backfill, maintenance)?

    ↓
    YES → Set moderate-to-long timeout (30-60s)
        
        ↓
        MySQL: SET SESSION innodb_lock_wait_timeout = 60;
        PostgreSQL: SET lock_timeout = '60s';
        
        ↓
        ```php
        // Separate database connection for batch
        'mysql_batch' => [
            'driver' => 'mysql',
            // ... connection config
            'options' => [
                PDO::ATTR_TIMEOUT => 60,
            ],
        ],
        ```
        
        ↓
        Long-running operations need lock tolerance
        Consider using separate DB connection with higher timeout
        Monitor for lock contention, not just timeout errors

---

## Recommended Default

**Default:** 5s for interactive queries; 30-60s for batch jobs; never use default 50s in production
**Reason:** Default 50s is designed for legacy apps. Modern web apps must fail fast under contention.

---

## Related Rules

* 9-10-1: Set Low Timeout for Interactive Queries (5-10s)
* 9-10-2: Never Use Default 50s Timeout in Production

---

## Related Skills

* Configure Lock Wait Timeout
* Configure Transaction Isolation Levels
* Detect and Resolve Deadlocks



## MySQL innodb_lock_wait_timeout vs PostgreSQL lock_timeout

---

## Decision Context

Choosing and configuring the appropriate lock timeout mechanism based on database platform.

---

## Decision Criteria

* performance: MySQL timeout is per-second granularity; PostgreSQL is millisecond precision
* architectural: MySQL timeout is session/global setting; PostgreSQL is per-transaction via SET
* maintainability: MySQL timeout covers all lock waits; PostgreSQL has separate deadlock_timeout and lock_timeout
* security: timeout prevents indefinite blocking (DoS mitigation)

---

## Decision Tree

Using MySQL?

YES → Configure innodb_lock_wait_timeout

    ↓
    Default: 50 seconds (too long for production)
    
    ↓
    ```sql
    -- Global (all sessions)
    SET GLOBAL innodb_lock_wait_timeout = 10;
    
    -- Session (current connection only)
    SET SESSION innodb_lock_wait_timeout = 5;
    ```
    
    ↓
    Covers ALL lock waits: row locks, table locks, gap locks
    Applies to both InnoDB and NDB
    On timeout: MySQL rolls back the waiting transaction (not the holder)
    Error code: 1205 "Lock wait timeout exceeded"

NO → Using PostgreSQL?

    ↓
    Two separate settings:
    
    ↓
    lock_timeout (v9.6+):
    ```sql
    SET lock_timeout = '5s';  -- milliseconds precision
    ```
    - Applies to all lock acquisition waits
    - Error: LockNotAvailable after timeout
    - Default: 0 (no timeout) — dangerous for production
    
    ↓
    deadlock_timeout:
    ```sql
    SET deadlock_timeout = '1s';  -- default 1s
    ```
    - NOT a lock wait timeout
    - Time before PostgreSQL checks for deadlock
    - Lower = faster deadlock detection, more CPU
    - Rarely needs changing

---

## Recommended Default

**Default:** MySQL: innodb_lock_wait_timeout = 5-10; PostgreSQL: lock_timeout = '5s'
**Reason:** Prevents transactions from blocking indefinitely. Always set both — don't rely on defaults.

---

## Related Rules

* 9-10-1: Set Low Timeout for Interactive Queries (5-10s)
* 9-10-2: Never Use Default 50s Timeout in Production

---

## Related Skills

* Configure Lock Wait Timeout
* Configure Transaction Isolation Levels
* Use NOWAIT for Fail-Fast Locking
