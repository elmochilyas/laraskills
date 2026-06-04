# Rule Card: K023 — Dead-Letter Queue Pattern and Poison Messages

---

## Rule 1

**Rule Name:** implement-poison-message-detection

**Category:** Always

**Rule:** Always implement poison message detection for jobs that fail on early retries.

**Reason:** A poison message burns 3-10 retry attempts before failing permanently — each attempt wastes worker time, queue capacity, and log space.

**Bad Example:**
```php
// No detection — job burns all 5 retries on a permanent error
```

**Good Example:**
```php
public function handle(): void
{
    if ($this->attempts() === 1) {
        $start = microtime(true);
    }
    // If job fails in <100ms on first retry, it's likely a poison message
    if ($this->attempts() > 1 && microtime(true) - $start < 0.1) {
        $this->fail('Poison message detected — immediate failure');
        return;
    }
}
```

**Exceptions:** Jobs with inherently fast but legitimate retries (cache warm, simple checks) should set appropriate thresholds.

**Consequences Of Violation:** A poison message with `$tries=10` burns 9 retries — each retry costs worker time, backoff delay, and queue storage. At scale, multiple poison messages can consume significant capacity.

---

## Rule 2

**Rule Name:** monitor-dlq-depth-and-age

**Category:** Always

**Rule:** Always monitor dead-letter queue depth and oldest message age.

**Reason:** A growing DLQ indicates systemic failure; a flat DLQ may mean routing is broken.

**Bad Example:**
```php
// No monitoring — DLQ issues invisible
```

**Good Example:**
```php
$schedule->call(function () {
    $dlqSize = Queue::size('dead-letter');
    if ($dlqSize > 100) {
        Log::warning("DLQ has $dlqSize items — investigate");
    }
})->everyFiveMinutes();
```

**Exceptions:** Low-volume systems with manual failure review may not need automated DLQ monitoring.

**Consequences Of Violation:** The DLQ accumulates jobs silently — days later, operators discover thousands of unprocessed failures with no alert.

---

## Rule 3

**Rule Name:** dlq-reprocessing-with-cool-off

**Category:** Prefer

**Rule:** Prefer implementing DLQ reprocessing with a cool-off period.

**Reason:** Immediate reprocessing creates a tight DLQ→reprocess→fail→DLQ loop — a cool-off period allows the underlying issue to resolve.

**Bad Example:**
```php
// No cool-off — immediate reprocessing creates failure loop
```

**Good Example:**
```php
// Scheduled reprocessing with 1-hour cool-off
$schedule->call(function () {
    $failedJobs = DB::table('failed_jobs')
        ->where('failed_at', '<', now()->subHour())
        ->get();
    foreach ($failedJobs as $failed) {
        Artisan::call('queue:retry', ['id' => $failed->uuid]);
    }
})->hourly();
```

**Exceptions:** When the underlying issue is verified resolved, immediate reprocessing is fine.

**Consequences Of Violation:** A DLQ→reprocess→fail→DLQ cycle completes in seconds — workers spin in an infinite loop of failing and reprocessing the same jobs with no recovery window.

---

## Rule 4

**Rule Name:** no-failed-jobs-as-dlq

**Category:** Never

**Rule:** Never use the `failed_jobs` table as a dead-letter queue.

**Reason:** `failed_jobs` is passive storage — it can't route, prioritize, or backpressure like a queue.

**Bad Example:**
```php
// Using failed_jobs as the only failure mechanism — no DLQ
```

**Good Example:**
```php
public function failed(Throwable $e): void
{
    // Dispatch to dedicated dead-letter queue for triage
    DeadLetterJob::dispatch($this->payload)->onQueue('dead-letter');
}
```

**Exceptions:** Low-volume systems where all failures are manually reviewed may not need a formal DLQ.

**Consequences Of Violation:** Failed jobs sit in a flat table — no way to prioritize critical failures, apply backpressure, or route to different processing pipelines.
