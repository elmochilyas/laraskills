# 9-20 Transaction Retry Logic - Decision Trees

## Retryable vs Non-Retryable Errors

---

## Decision Context

Determining which database errors should trigger a transaction retry and which should propagate immediately.

---

## Decision Criteria

* performance: retrying non-retryable errors wastes time; not retrying retryable errors causes failures
* architectural: retryable errors are transient (timing); non-retryable are permanent (logic)
* maintainability: retry wrapper must distinguish error codes correctly
* security: retry does not bypass access controls

---

## Decision Tree

Database error occurred during a transaction?

↓

Is the error code in the retryable list?

- MySQL: 1213 (deadlock), 1205 (lock wait timeout)
- PostgreSQL: 40001 (serialization failure), 40P01 (deadlock detected)

YES → Retryable (transient) error

    ↓
    ```php
    class TransactionHelper
    {
        public static function retry(callable $callback, int $max = 3): mixed
        {
            for ($attempt = 0; $attempt < $max; $attempt++) {
                try {
                    return DB::transaction($callback);
                } catch (QueryException $e) {
                    if (!self::isRetryable($e)) throw $e;
                    if ($attempt === $max - 1) throw $e;
                    $delay = 100 * pow(2, $attempt); // ms
                    $jitter = random_int(0, (int)($delay * 0.2));
                    usleep(($delay + $jitter) * 1000);
                }
            }
        }
        
        private static function isRetryable(QueryException $e): bool
        {
            return in_array($e->getCode(), ['1213', '1205', '40001', '40P01']);
        }
    }
    ```
    
    ↓
    Exponential backoff: 100ms → 200ms → 400ms
    Add jitter (±20%) to prevent thundering herd
    Max 3-5 attempts, then fail and alert

NO → Non-retryable (permanent) error

    ↓
    ```php
    // Examples:
    // - Syntax error (1064)
    // - Constraint violation (23000)
    // - Foreign key violation (1451)
    // - Column not found (1054)
    
    // These errors will ALWAYS fail on retry
    // Throw immediately — do not retry
    ```
    
    ↓
    These indicate bugs or data integrity issues
    Retrying would waste resources and time
    Analyze root cause instead

---

## Recommended Default

**Default:** Retry only on error codes 1213, 1205, 40001, 40P01; propagate all other errors immediately
**Reason:** Only transient timing errors are retryable. All other errors indicate bugs that retrying won't fix.

---

## Related Rules

* 9-20-1: Always Retry on Serialization Failures
* 9-20-2: Never Retry Non-Retryable Errors

---

## Related Skills

* Implement Transaction Retry Logic
* Detect and Resolve Deadlocks
* Implement Serializable Snapshot Isolation



## Retry Strategy: Exponential Backoff vs Fixed Delay vs Immediate

---

## Decision Context

Choosing the retry delay strategy for transaction retry logic.

---

## Decision Criteria

* performance: exponential backoff gives fastest recovery; fixed delay is simple but may be too slow or too fast
* architectural: backoff reduces load on DB; immediate retry likely fails again
* maintainability: exponential backoff with jitter is standard; fixed delay is simpler to implement
* security: retry strategy doesn't affect access controls

---

## Decision Tree

Implementing retry logic for transient database errors?

↓

How many concurrent clients may be retrying simultaneously?

MANY (10+) → Use exponential backoff with jitter

    ↓
    ```php
    for ($attempt = 0; $attempt < 3; $attempt++) {
        try {
            return DB::transaction($callback);
        } catch (QueryException $e) {
            if (!isRetryable($e)) throw $e;
            if ($attempt === 2) throw $e;
            
            $baseDelay = 100 * pow(2, $attempt); // 100, 200, 400
            $jitter = random_int(0, (int)($baseDelay * 0.2));
            usleep(($baseDelay + $jitter) * 1000);
        }
    }
    ```
    
    ↓
    First retry: 100ms ±20ms
    Second retry: 200ms ±40ms
    Third retry: 400ms ±80ms
    Total worst case: ~720ms + transaction time
    
    ↓
    Jitter spreads retries across clients
    Prevents thundering herd (all retry at same time)
    Best for production with many concurrent users

FEW (1-5) → Fixed delay may suffice

    ↓
    ```php
    for ($attempt = 0; $attempt < 3; $attempt++) {
        try {
            return DB::transaction($callback);
        } catch (QueryException $e) {
            if (!isRetryable($e)) throw $e;
            if ($attempt === 2) throw $e;
            usleep(100_000); // fixed 100ms
        }
    }
    ```
    
    ↓
    Simple and predictable
    No randomization needed for few clients
    Risk: if all clients retry at same interval, collisions persist

---

## Recommended Default

**Default:** Use exponential backoff with jitter (100ms base, 3 attempts, ±20% jitter)
**Reason:** Backoff reduces DB load; jitter prevents thundering herd. Fixed delay is acceptable only for low-concurrency scenarios.

---

## Related Rules

* 9-20-1: Always Retry on Serialization Failures
* 9-20-2: Never Retry Non-Retryable Errors

---

## Related Skills

* Implement Transaction Retry Logic
* Detect and Resolve Deadlocks
* Implement Serializable Snapshot Isolation
