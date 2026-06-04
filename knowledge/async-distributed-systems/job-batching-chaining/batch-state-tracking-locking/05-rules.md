# Rule Card: K009 — Batch State Tracking with Row-Level Locking

---

## Rule 1

**Rule Name:** keep-batch-sizes-under-1k

**Category:** Prefer

**Rule:** Prefer keeping batch sizes under 1,000 jobs for low lock contention.

**Reason:** Lock acquisition is serial — 10K jobs = 10K sequential lock operations regardless of worker count.

**Bad Example:**
```php
Bus::batch($tenThousandJobs)->dispatch();
// 10K sequential lock operations — dominant factor in completion time
```

**Good Example:**
```php
foreach ($tenThousandJobs->chunk(1000) as $chunk) {
    Bus::batch($chunk)->dispatch();
}
// Each batch = 1K lock operations — acceptable
```

**Exceptions:** When job execution time is long (> 10s per job), lock contention is negligible even with larger batches.

**Consequences Of Violation:** Workers spend more time waiting for the batch row lock than actually processing jobs — throughput drops sharply under high concurrency.

---

## Rule 2

**Rule Name:** use-innodb-or-postgresql

**Category:** Always

**Rule:** Always use InnoDB (MySQL) or PostgreSQL for batch operations.

**Reason:** SQLite uses table-level locking — every batch update locks the entire `job_batches` table.

**Bad Example:**
```php
// SQLite — table-level lock blocks ALL batch operations
// Every batch update serializes on the entire table
```

**Good Example:**
```php
// MySQL with InnoDB — row-level lock blocks only the specific batch
```

**Exceptions:** Development environments using SQLite for convenience are acceptable for testing.

**Consequences Of Violation:** Table-level locking means batch A and batch B cannot update simultaneously — even completely independent batches serialize on the table lock.

---

## Rule 3

**Rule Name:** monitor-lock-waits-during-batches

**Category:** Always

**Rule:** Always monitor `Innodb_row_lock_current_waits` during batch-heavy operations.

**Reason:** The batch lock bottleneck is invisible in job logs — DB metrics reveal the true serialization point.

**Bad Example:**
```php
// No monitoring — lock contention hidden behind "slow" batch completion
```

**Good Example:**
```php
// Monitor in production
$lockWaits = DB::select("SHOW STATUS LIKE 'Innodb_row_lock_current_waits'");
if ($lockWaits[0]->Value > 10) {
    Log::warning('Batch lock contention detected');
}
```

**Exceptions:** Small batches (< 100 jobs) rarely cause measurable lock contention.

**Consequences Of Violation:** Batch completion slows down gradually as concurrency increases — the root cause (row lock contention) is invisible without DB-level monitoring.
