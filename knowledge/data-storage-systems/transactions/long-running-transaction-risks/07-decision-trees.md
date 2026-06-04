# 9-19 Long Running Transaction Risks - Decision Trees

## Transaction Duration Monitoring and Response

---

## Decision Context

Choosing monitoring thresholds and response actions for long-running transactions.

---

## Decision Criteria

* performance: long transactions cause MVCC bloat, replication lag, lock escalation
* architectural: interactive transactions should be < 100ms; batch < 1s
* maintainability: logging and alerting are essential; kill thresholds prevent damage
* security: long transactions hold locks on sensitive data longer than necessary

---

## Decision Tree

Transaction duration exceeds acceptable threshold?

↓

Duration > 5 seconds (warning threshold)?

YES → Log warning and investigate

    ↓
    ```php
    $start = microtime(true);
    DB::transaction(function () use (&$result) {
        $result = /* ... */;
    });
    $duration = microtime(true) - $start;
    
    if ($duration > 5) {
        Log::warning("Transaction took {$duration}s", [
            'query_log' => DB::getQueryLog(),
        ]);
    }
    ```
    
    ↓
    Identify the cause:
    - External API call inside transaction?
    - Missing index causing full table lock?
    - Too many rows processed in one transaction?
    
    ↓
    Fix: move operations outside transaction
    Add indexes to narrow lock range
    Split into smaller batched transactions

Duration > 60 seconds (critical — must kill)?

    ↓
    YES → Kill the transaction
        
        ↓
        MySQL:
        ```sql
        SELECT trx_mysql_thread_id FROM information_schema.INNODB_TRX
        WHERE trx_time > NOW() - INTERVAL 60 SECOND;
        KILL <thread_id>;
        ```
        
        ↓
        PostgreSQL:
        ```sql
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE state = 'idle in transaction'
        AND query_start < NOW() - INTERVAL '60 seconds';
        ```
        
        ↓
        Implement application-level timeout:
        ```php
        DB::transaction(function () {
            // set statement timeout
            DB::statement('SET statement_timeout = 30000'); -- 30s
            // ...
        });
        ```

---

## Recommended Default

**Default:** Warn at 5s, alert at 30s, kill at 60s; implement application-level timeout
**Reason:** Transactions longer than 5s indicate a problem. Beyond 60s, they cause significant MVCC bloat and replication lag.

---

## Related Rules

* 9-19-1: Always Monitor Transaction Duration
* 9-19-2: Never Process More Than 1000 Rows in One Transaction

---

## Related Skills

* Avoid Long-Running Transaction Risks
* Keep Transactions Short
* Batch Process with Chunked Commits



## Batch Processing: One Transaction vs Chunked Commits

---

## Decision Context

Choosing between processing all rows in a single transaction and using smaller chunked transactions for batch operations.

---

## Decision Criteria

* performance: single transaction holds locks for entire batch; chunked releases locks between batches
* architectural: single transaction is atomic; chunked allows partial progress
* maintainability: chunked requires more code but avoids MVCC bloat
* security: large rollback of single transaction is slow, risks DoS

---

## Decision Tree

Batch processing 1000+ rows?

↓

Is each row independent (no cross-row constraints)?

YES → Use chunked commits

    ↓
    ```php
    foreach (array_chunk($records, 100) as $chunk) {
        try {
            DB::transaction(function () use ($chunk) {
                foreach ($chunk as $record) {
                    DB::table('orders')
                        ->where('id', $record['id'])
                        ->update($record);
                }
            });
        } catch (\Exception $e) {
            Log::error("Chunk failed: {$e->getMessage()}");
            // Previous chunks already committed
            // Decide: continue, retry, or abort
        }
    }
    ```
    
    ↓
    Each chunk: 100 rows, < 1s lock duration
    VACUUM can clean dead tuples between chunks
    No lock escalation risk (> 40% rows)
    Replication lag limited to chunk duration
    
    ↓
    Chunk size: 100-500 rows per transaction
    Adjust based on row size and query complexity

NO → Rows must be processed atomically?

    ↓
    YES → Single transaction (but mitigate risks)
        
        ↓
        ```php
        DB::transaction(function () use ($records) {
            foreach ($records as $record) {
                // process
            }
        });
        ```
        
        ↓
        WARNING:
        - MVCC bloat: dead tuples accumulate until COMMIT
        - Lock escalation: InnoDB may escalate to table lock
        - Replication lag: replicas can't advance until commit
        - Rollback risk: hours-long rollback if killed
        
        ↓
        Mitigations:
        - Keep total rows < 10000
        - Add WHERE index to limit lock range
        - Monitor duration and be ready to kill
        - Consider redesign to use chunked commits

---

## Recommended Default

**Default:** Use chunked commits (100-500 rows) for batch processing; reserve single transaction only for small atomic operations (< 1000 rows)
**Reason:** Chunked commits avoid MVCC bloat, lock escalation, and replication lag while maintaining reasonable performance.

---

## Related Rules

* 9-19-1: Always Monitor Transaction Duration
* 9-19-2: Never Process More Than 1000 Rows in One Transaction

---

## Related Skills

* Avoid Long-Running Transaction Risks
* Batch Process with Chunked Commits
* Monitor MVCC Bloat
