# Rule Card: K073 — Job Lifecycle State Machine

---

## Rule 1

**Rule Name:** always-delay-on-release

**Category:** Always

**Rule:** Always provide a delay when calling `$this->release()`.

**Reason:** Immediate re-release without delay re-queues the job instantly — the worker picks it up again immediately, creating a tight retry loop.

**Bad Example:**
```php
if (!$this->resourceReady()) {
    $this->release(); // Re-queued instantly — immediate retry loop
}
```

**Good Example:**
```php
if (!$this->resourceReady()) {
    $this->release(10); // Re-queued with 10-second delay
}
```

**Exceptions:** None — always use a delay with `release()`. Even 1 second prevents the tight loop.

**Consequences Of Violation:** CPU spikes to 100% as the worker continuously pops and re-releases the same job — no progress made, other jobs starve.

---

## Rule 2

**Rule Name:** never-call-delete-and-release

**Category:** Never

**Rule:** Never call both `delete()` and `release()` in the same error handler.

**Reason:** These methods set mutually exclusive states on the job — `delete()` wins and the job is removed, skipping the retry.

**Bad Example:**
```php
public function handle(): void
{
    try {
        // process
    } catch (\Exception $e) {
        $this->delete();
        $this->release(10); // delete() already removed job — release() has no effect
    }
}
```

**Good Example:**
```php
public function handle(): void
{
    try {
        // process
    } catch (\Exception $e) {
        if ($this->attempts() < 3) {
            $this->release(10); // Release for retry
        } else {
            $this->fail($e); // Fail explicitly
        }
    }
}
```

**Exceptions:** None — `delete()` and `release()` are mutually exclusive operations.

**Consequences Of Violation:** Retry logic silently fails — the job is deleted but the developer expects a retry, leading to missed processing.

---

## Rule 3

**Rule Name:** drain-queue-before-changing-tries

**Category:** Prefer

**Rule:** Prefer draining the queue before changing `$tries` configuration.

**Reason:** The `$tries` value is evaluated when the job is popped, not when dispatched — changing it mid-flight affects in-flight jobs unexpectedly.

**Bad Example:**
```php
// Changed $tries from 3 to 1 while 100 jobs are in the queue
// Those jobs now get 1 attempt instead of 3 — many fail unnecessarily
```

**Good Example:**
```php
// 1. Let existing queue drain naturally
// 2. Pause worker
// 3. Change $tries
// 4. Restart worker
```

**Exceptions:** Emergency rollbacks or critical fixes may require immediate config changes — accept the risk of in-flight job disruption.

**Consequences Of Violation:** Jobs dispatched under the old configuration get fewer or more retries than expected — "impossible" failures or excessive retry delays.

---

## Rule 4

**Rule Name:** failed-jobs-are-terminal

**Category:** Always

**Rule:** Always remember that failed jobs are terminal — they don't auto-retry.

**Reason:** Failed jobs are stored permanently in the `failed_jobs` table — they require `queue:retry` or Horizon's retry button to re-enter the state machine.

**Bad Example:**
```php
// Assuming a failed job will be retried automatically
// It won't — it sits in failed_jobs until manual intervention
```

**Good Example:**
```php
// Schedule automatic retry of failed jobs
$schedule->command('queue:retry all')->hourly();
```

**Exceptions:** When using Horizon, retry buttons are available in the dashboard, but still require manual or scheduled action.

**Consequences Of Violation:** Critical jobs fail silently and are never retried — users don't receive emails, exports aren't generated, and the error goes unnoticed until someone checks the failed jobs table.
