# 9-8 Deadlock Detection Resolution - Decision Trees

## Deadlock Response: Retry vs Prevent

---

## Decision Context

Choosing between retrying deadlocked transactions and preventing deadlocks through design changes.

---

## Decision Criteria

* performance: retries add latency (100-700ms); prevention eliminates retry cost
* architectural: prevention requires consistent lock ordering; retry requires idempotent transactions
* maintainability: retry is a generic wrapper; prevention requires code review across all transactions
* security: neither approach affects access controls

---

## Decision Tree

Deadlock occurred in production?

↓

Is this a one-time occurrence or recurring pattern?

ONE-TIME → Implement retry logic

    ↓
    ```php
    DB::transaction(function () use ($orderId, $amount) {
        $account = Account::lockForUpdate()->find($orderId);
        $account->balance += $amount;
        $account->save();
    }, 3); // Laravel retries up to 3 times
    ```
    
    ↓
    Catch MySQL 1213 / PostgreSQL 40P01
    Retry with exponential backoff (100ms, 200ms, 400ms)
    Sufficient for rare deadlocks (< 0.1% of transactions)

RECURRING → Implement deadlock prevention

    ↓
    Analyze locks using SHOW ENGINE INNODB STATUS (MySQL)
    or pg_locks (PostgreSQL)
    
    ↓
    Enforce consistent lock ordering:
    ```php
    // Always lock user → order → payment
    $user = User::lockForUpdate()->find($userId);
    $order = Order::lockForUpdate()->find($orderId);
    $payment = Payment::lockForUpdate()->find($paymentId);
    ```
    
    ↓
    Keep transactions short (< 100ms)
    Add indexes to narrow lock ranges

---

## Recommended Default

**Default:** Implement retry logic for all transactions; add prevention measures when deadlock rate exceeds 0.1%
**Reason:** Retry is a safety net. Prevention reduces retry frequency. Both together provide comprehensive deadlock handling.

---

## Related Rules

* 9-8-1: Always Retry on Deadlock
* 9-8-2: Always Analyze Deadlocks in SHOW ENGINE INNODB STATUS

---

## Related Skills

* Detect and Resolve Deadlocks
* Implement Transaction Retry Logic
* Prevent Deadlocks with Consistent Ordering



## MySQL InnoDB vs PostgreSQL Deadlock Handling

---

## Decision Context

Choosing the appropriate deadlock detection strategy based on database platform.

---

## Decision Criteria

* performance: InnoDB detects deadlocks instantly (wait-for graph); PostgreSQL uses timeout-based detection (deadlock_timeout default 1s)
* architectural: InnoDB auto-chooses victim; PostgreSQL requires careful deadlock_timeout tuning
* maintainability: InnoDB exposes deadlock info via SHOW ENGINE INNODB STATUS; PostgreSQL via logs
* security: deadlock detection doesn't affect access control

---

## Decision Tree

Using MySQL InnoDB?

YES → InnoDB uses wait-for graph detection

    ↓
    Detection is instant (runs on each lock wait)
    Automatically rolls back the transaction with fewest locks
    
    ↓
    ```sql
    SHOW ENGINE INNODB STATUS;
    -- Look for "LATEST DETECTED DEADLOCK" section
    ```
    
    ↓
    Error code: 1213 (40001)
    Application must retry the victim transaction
    Do NOT disable: innodb_deadlock_detect = OFF (causes lock wait timeout instead)

NO → Using PostgreSQL?

    ↓
    PostgreSQL uses timeout-based detection
    
    ↓
    Waits deadlock_timeout (default 1s) before checking
    Lower timeout = faster detection, more CPU overhead
    
    ↓
    ```sql
    SET deadlock_timeout = '500ms'; -- faster detection
    ```
    
    ↓
    Error code: 40P01
    Check pg_locks and PostgreSQL logs for analysis
    
    ↓
    Also set lock_timeout to prevent indefinite waits:
    ```sql
    SET lock_timeout = '5s';
    ```

---

## Recommended Default

**Default:** Use database defaults for deadlock detection; always implement retry logic
**Reason:** Both databases handle deadlocks automatically. Retry logic is the only missing piece in most applications.

---

## Related Rules

* 9-8-1: Always Retry on Deadlock
* 9-8-2: Always Analyze Deadlocks in SHOW ENGINE INNODB STATUS

---

## Related Skills

* Detect and Resolve Deadlocks
* Configure Lock Wait Timeout
* Implement Transaction Retry Logic
