# Rule Card: K018 — Backoff Strategies

---

## Rule 1

**Rule Name:** always-set-explicit-backoff

**Category:** Always

**Rule:** Always set an explicit `$backoff` value on every job class.

**Reason:** Default backoff is 0 — immediate re-queue creates a tight retry loop burning CPU.

**Bad Example:**
```php
class ProcessOrder implements ShouldQueue
{
    public $tries = 3;
    // No $backoff — immediate retry loop on failure
}
```

**Good Example:**
```php
class ProcessOrder implements ShouldQueue
{
    public $tries = 3;
    public $backoff = 30; // 30-second delay between retries
}
```

**Exceptions:** Jobs with custom middleware that handles release delay may not need `$backoff`.

**Consequences Of Violation:** A transient failure triggers immediate re-queue — the same error likely persists (network glitch, deadlock), causing immediate re-failure and burning all retries in milliseconds.

---

## Rule 2

**Rule Name:** prefer-exponential-jitter-for-apis

**Category:** Prefer

**Rule:** Prefer exponential backoff with jitter for all external API calls.

**Reason:** Without jitter, all workers retry at the same time — creating synchronized load spikes that can overwhelm the just-recovered service.

**Bad Example:**
```php
public $backoff = 30; // Fixed — all workers retry simultaneously
```

**Good Example:**
```php
public $backoff = [10, 20, 40, 80]; // Exponential progression

// Implement jitter via custom middleware or release logic
```

**Exceptions:** Internal infrastructure calls (DB failover, cache warmup) benefit from predictable fixed timing.

**Consequences Of Violation:** A downstream API recovers — 50 workers all retry simultaneously, creating a thundering herd that overwhelms the API and forces it back into degraded mode.

---

## Rule 3

**Rule Name:** match-backoff-array-to-tries

**Category:** Always

**Rule:** Always match `$backoff` array length to `$tries - 1`.

**Reason:** Each array element corresponds to one retry attempt — missing elements silently reuse the last value, which may be inappropriate.

**Bad Example:**
```php
public $tries = 5;
public $backoff = [10, 20]; // Only 2 elements for 4 retries — last 2 use last value (20)
```

**Good Example:**
```php
public $tries = 5;
public $backoff = [10, 20, 40, 80]; // 4 elements for 4 retries
```

**Exceptions:** When the last value is intentionally the maximum backoff and repeating it is desired, a shorter array is acceptable.

**Consequences Of Violation:** Retries 3 and 4 silently use the same delay as retry 2 — the progressive backoff design is broken without any warning.

---

## Rule 4

**Rule Name:** log-backoff-value-on-retry

**Category:** Always

**Rule:** Always log the backoff value on each job retry.

**Reason:** Without logging, you can't tell if backoff is working as intended — misconfigured arrays silently produce unexpected delays.

**Bad Example:**
```php
// No retry logging — backoff behavior invisible
```

**Good Example:**
```php
public function handle(): void
{
    Log::debug('Processing job', [
        'attempt' => $this->attempts(),
        'backoff' => $this->backoff[$this->attempts() - 1] ?? end($this->backoff),
    ]);
}
```

**Exceptions:** None — logging is cheap and critical for debugging retry timing.

**Consequences Of Violation:** A `$backoff` of `[0, 0, 0, 0]` goes undetected — the job burns through all retries instantly and fails, but the root cause (zero backoff) is invisible in logs.
