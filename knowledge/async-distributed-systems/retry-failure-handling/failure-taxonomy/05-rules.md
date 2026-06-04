# Rule Card: K016 — Failure Taxonomy: Release / Exception / Fail

---

## Rule 1

**Rule Name:** map-exceptions-to-retry-behavior

**Category:** Always

**Rule:** Always map exception types to their appropriate retry behavior.

**Reason:** Different errors have different recovery profiles — treating all errors the same wastes retries on permanent failures and retries too aggressively on rate limits.

**Bad Example:**
```php
public function handle(): void
{
    try {
        $this->apiCall();
    } catch (Throwable $e) {
        throw $e; // Same behavior for 400, 429, 500
    }
}
```

**Good Example:**
```php
public function handle(): void
{
    try {
        $this->apiCall();
    } catch (ClientException $e) {
        $this->fail($e); // Permanent — don't retry
    } catch (RateLimitException $e) {
        $this->release($e->retryAfter); // Controlled delay
    } catch (ServerException $e) {
        throw $e; // Transient — let retry mechanism handle
    }
}
```

**Exceptions:** Jobs with uniform failure characteristics (all internal, all the same type) may use a single path.

**Consequences Of Violation:** A permanent 400 error retries 3 times before failing — each attempt wastes worker time and logs noise. A 429 rate limit retries with default backoff instead of respecting `Retry-After`.

---

## Rule 2

**Rule Name:** prefer-fail-for-unrecoverable

**Category:** Prefer

**Rule:** Prefer `$this->fail()` for known unrecoverable conditions.

**Reason:** An exception signals "might be transient" — the worker retries. `fail()` explicitly says "this will never succeed."

**Bad Example:**
```php
if (! $this->isValid()) {
    throw new ValidationException(); // Waste 3 retries on invalid input
}
```

**Good Example:**
```php
if (! $this->isValid()) {
    $this->fail('Invalid input'); // Fail immediately — no retries wasted
}
```

**Exceptions:** When you want retries as a safety net for race conditions (valid at dispatch, invalid at processing), let exception retry.

**Consequences Of Violation:** A job with invalid input retries 3-10 times before failing — each attempt wastes worker time, and the error appears as "transient" in monitoring.

---

## Rule 3

**Rule Name:** no-exception-when-release-appropriate

**Category:** Never

**Rule:** Never throw an exception when `release()` is the appropriate response.

**Reason:** Throwing consumes a retry attempt. `release()` re-queues without decrementing the retry budget — it uses backoff delay instead.

**Bad Example:**
```php
if ($this->rateLimited()) {
    throw new RateLimitException(); // Consumes a retry attempt
}
```

**Good Example:**
```php
if ($this->rateLimited()) {
    $this->release(60); // Returns to queue without consuming retry
}
```

**Exceptions:** When the job doesn't have enough context to determine if the condition is transient, let the retry mechanism decide.

**Consequences Of Violation:** Each rate-limit release counts as a failed attempt — the job exhausts `$tries` and permanently fails even though the condition was temporary.

---

## Rule 4

**Rule Name:** monitor-release-ratio

**Category:** Always

**Rule:** Always monitor the release ratio vs success rate.

**Reason:** Releases are invisible in standard failure monitoring — they don't appear in `failed_jobs` or failure alerts.

**Bad Example:**
```php
// No release monitoring — high release rate goes undetected
```

**Good Example:**
```php
public function handle(): void
{
    $start = microtime(true);
    // ... processing ...
    if ($this->attempts() > 1) {
        Log::warning('Job required retries', [
            'job' => static::class,
            'attempts' => $this->attempts(),
        ]);
    }
}
```

**Exceptions:** None — release monitoring is a blind spot in standard queue observability.

**Consequences Of Violation:** A job that releases 10 times before succeeding looks "successful" — but it consumed 10x the expected resources and indicates a systemic reliability issue.
