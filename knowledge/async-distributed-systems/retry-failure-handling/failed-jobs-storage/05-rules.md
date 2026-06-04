# Rule Card: K020 — `failed_jobs` Table and DynamoDB Storage

---

## Rule 1

**Rule Name:** prune-failed-jobs-regularly

**Category:** Always

**Rule:** Always prune failed jobs regularly via the scheduler.

**Reason:** The `failed_jobs` table grows forever — every failure adds kilobytes of payload + stack trace.

**Bad Example:**
```php
// No scheduled cleanup — table grows unbounded
```

**Good Example:**
```php
// Schedule daily pruning (keep 7 days)
$schedule->command('queue:prune-failed --hours=168')->daily();
```

**Exceptions:** Regulated industries requiring long audit trails may need custom archival, not simple pruning.

**Consequences Of Violation:** An unpruned table with 100K+ rows makes `queue:retry` and `queue:retry-batch` operations slow — full table scans degrade worker performance.

---

## Rule 2

**Rule Name:** dedicated-connection-for-high-volume-failures

**Category:** Prefer

**Rule:** Prefer a dedicated database connection for failed jobs in high-volume systems.

**Reason:** `INSERT INTO failed_jobs` on every failure competes with regular application queries.

**Bad Example:**
```php
// Failed jobs and application queries share the same connection
// High failure rate degrades application DB performance
```

**Good Example:**
```php
// config/queue.php — dedicated connection for failed jobs
'failed' => [
    'driver' => env('FAILED_QUEUE_DRIVER', 'database-connection'),
    'database' => 'mysql_failed',
    'table' => 'failed_jobs',
],
```

**Exceptions:** Low-volume systems (< 100 failures/day) don't need a dedicated connection.

**Consequences Of Violation:** Under high failure rates, `INSERT` contention on the `failed_jobs` table slows down application queries — a cascading performance degradation from errors.

---

## Rule 3

**Rule Name:** be-aware-of-sensitive-payload-data

**Category:** Always

**Rule:** Always be aware that the `failed_jobs` payload may contain sensitive data.

**Reason:** The `payload` column contains the full serialized job object, including constructor arguments — PII, API keys, or internal IDs may be stored permanently.

**Bad Example:**
```php
class ProcessOrder implements ShouldQueue
{
    public function __construct(
        public Order $order, // Customer PII serialized into payload
    ) {}
}
```

**Good Example:**
```php
class ProcessOrder implements ShouldQueue
{
    public function __construct(
        public int $orderId, // Only the ID — re-fetch in handle()
    ) {}
    // Failed jobs store only the order ID, not full customer data
}
```

**Exceptions:** Jobs without sensitive data in their constructor properties are not affected.

**Consequences Of Violation:** Customer PII, API keys, or internal tokens are stored indefinitely in `failed_jobs` — a data breach would expose this serialized data without additional encryption.
