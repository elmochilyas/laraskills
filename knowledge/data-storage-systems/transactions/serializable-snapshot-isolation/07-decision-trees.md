# 9-17 Serializable Snapshot Isolation - Decision Trees

## SSI vs Explicit Locking for Serializability

---

## Decision Context

Choosing between PostgreSQL SSI (SERIALIZABLE, optimistic) and explicit FOR UPDATE locks for achieving serializable behavior.

---

## Decision Criteria

* performance: SSI is optimistic with retry on conflict; FOR UPDATE blocks concurrently
* architectural: SSI automatically detects serialization conflicts; FOR UPDATE requires manual lock management
* maintainability: SSI is simpler (set isolation level, add retry); FOR UPDATE needs careful lock ordering
* security: neither bypasses access controls

---

## Decision Tree

Need true serializability (prevent all anomalies including write skew)?

↓

Using PostgreSQL?

YES → Consider SSI (SERIALIZABLE)

    ↓
    Is the conflict rate expected to be low (< 5% aborts)?
    
    ↓
    YES → Use SSI
        
        ↓
        ```php
        function serializableTransaction(callable $callback, int $maxRetries = 5): mixed
        {
            for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
                try {
                    return DB::transaction(function () use ($callback) {
                        DB::statement('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
                        return $callback();
                    });
                } catch (QueryException $e) {
                    if ($e->getCode() !== '40001') throw;
                    if ($attempt === $maxRetries - 1) throw;
                    usleep(50_000 * pow(2, $attempt));
                }
            }
        }
        ```
        
        ↓
        No blocking — concurrent operations proceed
        SSI detects conflicts via predicate locking
        Retries handle aborted transactions
        Best for: read-heavy, low-conflict workloads
    
    NO → High conflict rate → Use explicit FOR UPDATE
        
        ↓
        ```php
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
        Blocks conflicting transactions proactively
        No retry needed (lock wait serializes)
        Must know which rows to lock
        Best for: high-contention resources

NO → Using MySQL?

    ↓
    MySQL SERIALIZABLE uses pessimistic locking (not SSI)
    Equivalent to REPEATABLE READ + implicit FOR UPDATE
    
    ↓
    Use explicit FOR UPDATE for MySQL serializability:
    ```php
    DB::transaction(function () {
        $inventory = Product::lockForUpdate()->find($productId);
        // ...
    });
    ```

---

## Recommended Default

**Default:** Use SSI for PostgreSQL when true serializability is needed and conflict rate is low; use FOR UPDATE for high contention or MySQL
**Reason:** SSI scales better for read-heavy workloads. FOR UPDATE is more predictable under high write contention.

---

## Related Rules

* 9-17-1: Always Retry on SSI Serialization Failure (40001)
* 9-17-2: Never Use SSI Without Monitoring Conflict Rate

---

## Related Skills

* Implement Serializable Snapshot Isolation (SSI)
* Prevent Write Skew
* Implement Transaction Retry Logic



## SSI Scope: Global vs Per-Transaction

---

## Decision Context

Choosing between setting SERIALIZABLE for all transactions or selectively for specific operations.

---

## Decision Criteria

* performance: SSI adds 5-15% overhead compared to READ COMMITTED; global SSI affects all queries
* architectural: per-transaction SSI targets specific operations; global SSI protects everywhere
* maintainability: per-transaction is more code but better performance; global is simpler setup
* security: SSI doesn't affect access controls

---

## Decision Tree

Should all transactions be serializable?

NO → Set SSI per-transaction (recommended)

    ↓
    ```php
    // Only use SSI where serializability is needed
    DB::transaction(function () {
        DB::statement('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
        // inventory management, financial operations
    }, 5);
    
    // Most transactions stay at READ COMMITTED
    DB::transaction(function () {
        // regular operations — no SSI overhead
    });
    ```
    
    ↓
    SSI overhead only for transactions that need it
    Most transactions stay at READ COMMITTED (faster)
    Monitor serialization_failures on specific transactions
    Best approach for most applications

YES → Set SSI globally for all connections

    ↓
    ```sql
    -- PostgreSQL config
    ALTER DATABASE mydb SET default_transaction_isolation = 'serializable';
    ```
    
    ↓
    All transactions run at SERIALIZABLE
    Simplest setup — no per-transaction configuration
    
    ↓
    WARNING: High abort rate if many concurrent writes
    Every transaction pays SSI overhead (5-15%)
    Reporting/read-only transactions also affected
    Requires robust retry logic everywhere
    
    ↓
    Only recommended for small apps or when nearly all transactions need serializability

---

## Recommended Default

**Default:** Use per-transaction SSI; avoid global SSI
**Reason:** SSI overhead is unnecessary for most transactions. Target SSI only where serializability is required.

---

## Related Rules

* 9-17-1: Always Retry on SSI Serialization Failure (40001)
* 9-17-2: Never Use SSI Without Monitoring Conflict Rate

---

## Related Skills

* Implement Serializable Snapshot Isolation (SSI)
* Choose Isolation Level
* Use PostgreSQL Isolation Features
