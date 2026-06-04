# Rule Card: K075 — Idempotency Patterns for Job Processing

---

## Rule 1

**Rule Name:** prefer-db-constraints-for-financial

**Category:** Prefer

**Rule:** Prefer database unique constraints over cache for financial operations.

**Reason:** Cache evictions remove dedup keys, allowing duplicate processing — DB constraints are durable.

**Bad Example:**
```php
if (Cache::has('payment_'.$this->paymentId)) { return; }
Cache::put('payment_'.$this->paymentId, true, 3600);
// Cache eviction allows duplicate payment
```

**Good Example:**
```php
try {
    DB::table('processed_payments')->insert(['payment_id' => $this->paymentId]);
} catch (QueryException $e) {
    if ($e->isUniqueConstraintViolation()) { return; } // Already processed
    throw;
}
```

**Exceptions:** Non-financial operations (cache warming, log cleanup) are well-served by cache-based dedup.

**Consequences Of Violation:** A cache eviction removes the dedup key — the same payment job runs again, processing a second charge with no protection.

---

## Rule 2

**Rule Name:** dedup-ttl-exceeds-retry-window

**Category:** Always

**Rule:** Always set dedup TTL to exceed total retry window + 24 hours.

**Reason:** Jobs may be retried from `failed_jobs` days later — a short TTL allows the job to run again as if it were new.

**Bad Example:**
```php
Cache::put($dedupKey, true, 3600); // 1 hour — not enough for retry window
```

**Good Example:**
```php
Cache::put($dedupKey, true, 86400 * 7); // 7 days — covers retry window + buffer
```

**Exceptions:** Jobs with `retryUntil()` enforcing a short deadline may use a smaller TTL.

**Consequences Of Violation:** A job fails after 3 retries over 2 hours, lands in `failed_jobs`. An operator retries it 3 hours later — the dedup key expired at 1 hour, so the job processes again, creating a duplicate.

---

## Rule 3

**Rule Name:** no-array-cache-for-dedup

**Category:** Never

**Rule:** Never use `array` cache driver for dedup keys.

**Reason:** `array` cache is per-process — each worker has its own store. A job processed by Worker A has its dedup key in Worker A's memory only.

**Bad Example:**
```php
CACHE_DRIVER=array // Each worker has independent dedup store
```

**Good Example:**
```php
CACHE_DRIVER=redis // Single shared dedup store across all workers
```

**Exceptions:** Single-worker development environments may use array cache for convenience.

**Consequences Of Violation:** Worker A processes a job and stores its dedup key. Worker B receives the same job — its `array` cache has no record of it. The job runs twice on two workers with no cross-worker dedup.

---

## Rule 4

**Rule Name:** always-implement-idempotency-for-side-effects

**Category:** Always

**Rule:** Always implement idempotency for jobs with side effects.

**Reason:** Laravel queues guarantee at-least-once delivery — jobs may be processed more than once.

**Bad Example:**
```php
class SendEmail implements ShouldQueue
{
    public function handle(): void
    {
        Mail::send($this->email); // No dedup — duplicate on retry
    }
}
```

**Good Example:**
```php
class SendEmail implements ShouldQueue
{
    public function handle(): void
    {
        $dedupKey = 'email_'.$this->emailId;
        if (Cache::has($dedupKey)) { return; }
        Mail::send($this->email);
        Cache::put($dedupKey, true, 86400);
    }
}
```

**Exceptions:** Read-only jobs and naturally idempotent operations (setting a status flag) don't need dedup.

**Consequences Of Violation:** A worker crash after processing but before acknowledging the job — the job runs again. Without idempotency, this means double emails, double API calls, or double charges.
