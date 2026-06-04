# Rule Card: K002 — Queue Driver Architecture

---

## Rule 1

**Rule Name:** separate-queue-redis-from-cache

**Category:** Always

**Rule:** Always use a separate Redis instance for queues vs. cache.

**Reason:** Cache eviction policies can delete queue keys under memory pressure — causing silent job loss.

**Bad Example:**
```php
// Same Redis instance for cache and queues
'redis' => [
    'client' => env('REDIS_CLIENT', 'phpredis'),
    'default' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
    ],
],
```

**Good Example:**
```php
// Separate Redis connections
'redis' => [
    'client' => env('REDIS_CLIENT', 'phpredis'),
    'cache' => ['host' => env('REDIS_CACHE_HOST', '127.0.0.1')],
    'queue' => ['host' => env('REDIS_QUEUE_HOST', '127.0.0.1')],
],
```

**Exceptions:** Development environments and very low-volume applications (< 100 jobs/hour) can share a Redis instance.

**Consequences Of Violation:** Under memory pressure, `allkeys-lru` eviction deletes job payloads — jobs disappear with no alert, no failed entry, no trace.

---

## Rule 2

**Rule Name:** set-after-commit-per-connection

**Category:** Always

**Rule:** Always set `after_commit` to `true` at the connection level.

**Reason:** Prevents jobs dispatched inside database transactions from processing before the transaction commits — workers see committed data.

**Bad Example:**
```php
// config/queue.php
'redis' => [
    'driver' => 'redis',
    'after_commit' => false, // Default — jobs may process before transaction commits
],
```

**Good Example:**
```php
'redis' => [
    'driver' => 'redis',
    'after_commit' => true, // Jobs dispatch only after transaction commits
],
```

**Exceptions:** Jobs that must dispatch immediately regardless of transaction state (e.g., logging, analytics) should override per-dispatch with `afterCommit: false`.

**Consequences Of Violation:** Workers process jobs before the HTTP request's transaction commits — the worker may read stale or missing data, causing logic errors.

---

## Rule 3

**Rule Name:** retry-after-exceeds-longest-job

**Category:** Always

**Rule:** Always configure `retry_after` higher than the longest expected job runtime.

**Reason:** If `retry_after` is shorter than actual runtime, the queue backend releases the job to another worker while the first is still running.

**Bad Example:**
```php
'redis' => [
    'retry_after' => 60, // A job that takes 90s is double-processed
],
```

**Good Example:**
```php
'redis' => [
    'retry_after' => 120, // 2x the longest expected job
],
```

**Exceptions:** Jobs with highly variable runtime make this hard — set `retry_after` to the 99th percentile plus margin.

**Consequences Of Violation:** Double-processing — two workers run the same job simultaneously, causing duplicate charges, duplicate notifications, or data corruption.

---

## Rule 4

**Rule Name:** no-database-driver-for-production-volume

**Category:** Never

**Rule:** Never use the database driver for moderate-to-high volume queues in production.

**Reason:** The polling query becomes a contention point — at scale, `SELECT ... FOR UPDATE SKIP LOCKED` blocks other database operations.

**Bad Example:**
```php
'QUEUE_CONNECTION=database' // 10K jobs/hour — jobs table becomes bottleneck
```

**Good Example:**
```php
'QUEUE_CONNECTION=redis' // Redis handles queue operations without impacting application DB
```

**Exceptions:** Very low-volume applications (< 100 jobs/hour) where adding Redis is not justified.

**Consequences Of Violation:** Application database performance degrades under queue load — query response times increase, DB CPU spikes, and other queries contend with queue polling.

---

## Rule 5

**Rule Name:** index-jobs-table-for-database-driver

**Category:** Always

**Rule:** Always index the `jobs` table when using the database driver.

**Reason:** Without proper indexes, each poll iteration scans the entire `jobs` table — at scale, this is the primary bottleneck.

**Bad Example:**
```php
// No index on (queue, reserved_at) — full table scan on every poll
Schema::create('jobs', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->string('queue');
    $table->longText('payload');
    $table->unsignedTinyInteger('attempts');
    $table->unsignedInteger('reserved_at')->nullable();
    // No composite index
});
```

**Good Example:**
```php
Schema::create('jobs', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->string('queue');
    $table->longText('payload');
    $table->unsignedTinyInteger('attempts');
    $table->unsignedInteger('reserved_at')->nullable();
    $table->index(['queue', 'reserved_at']);
});
```

**Exceptions:** None — the index is negligible in cost and essential for performance.

**Consequences Of Violation:** Polling queries become progressively slower as the `jobs` table grows — workers spend more time querying than processing, reducing throughput.

---

## Rule 6

**Rule Name:** no-sync-driver-in-production

**Category:** Never

**Rule:** Never use the `sync` driver in production.

**Reason:** Jobs execute synchronously in the HTTP request — defeating the purpose of async processing and increasing response times.

**Bad Example:**
```php
QUEUE_CONNECTION=sync // Jobs run inline — every dispatch blocks the response
```

**Good Example:**
```php
QUEUE_CONNECTION=redis // Jobs run in worker — response returns immediately
```

**Exceptions:** None — the `sync` driver is for development and testing only.

**Consequences Of Violation:** Every job dispatch adds its full execution time to the HTTP response — a 2-second job turns a 200ms response into a 2.2s response.
