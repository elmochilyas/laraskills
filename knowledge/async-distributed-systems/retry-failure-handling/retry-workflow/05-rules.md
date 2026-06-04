# Rule Card: K024 — Retry Workflow (`queue:retry`, Horizon Retry)

---

## Rule 1

**Rule Name:** investigate-before-retrying

**Category:** Always

**Rule:** Always investigate the root cause before retrying failed jobs.

**Reason:** If the underlying cause isn't fixed, the job fails again immediately — wasting worker time.

**Bad Example:**
```bash
queue:retry all # Retries without investigation — same failure repeats
```

**Good Example:**
```bash
# 1. Check failed_jobs for the exception message
# 2. Fix the underlying issue
# 3. Then retry specific IDs
queue:retry 550e8400-e29b-41d4-a716-446655440000
```

**Exceptions:** Automated retry pipelines for known transient failures (documented intermittent conditions).

**Consequences Of Violation:** A flood of immediately-failing jobs saturates workers — the queue backlogs, legitimate jobs are delayed, and the failure rate spikes.

---

## Rule 2

**Rule Name:** retry-does-not-reset-attempts

**Category:** Always

**Rule:** Always be aware that retry does NOT reset the attempt counter.

**Reason:** The attempt counter is stored in the payload — when re-dispatched, the payload still shows previous attempts. A job with `$tries=3` that failed after 3 attempts gets only 1 more on retry.

**Bad Example:**
```php
// $tries=3, job failed after 3 attempts
// queue:retry dispatches it — attempt counter is still 3
// handle() runs one more time (attempt 4) — exceeds $tries and fails immediately
```

**Good Example:**
```php
// Increase $tries before retrying if needed, or use retryUntil()
```

**Exceptions:** Jobs using `retryUntil()` are not affected by attempt counter.

**Consequences Of Violation:** The retried job fails on its first execution because it exceeds `$tries` — the operator thinks the retry "didn't work" and the job appears to fail without any meaningful processing.

---

## Rule 3

**Rule Name:** test-single-retry-before-all

**Category:** Prefer

**Rule:** Prefer testing a single retry before retrying all failed jobs.

**Reason:** A single retry reveals whether the underlying issue is resolved — retrying all blindly can flood the queue with immediately-failing jobs.

**Bad Example:**
```bash
queue:retry all # 500 failed jobs — all re-dispatched, all fail again
```

**Good Example:**
```bash
queue:retry 550e8400-e29b-41d4-a716-446655440000 # Test one
# If it succeeds:
queue:retry all # Safe to retry the rest
```

**Exceptions:** When the root cause is clearly resolved and verified independently, retrying all may be safe.

**Consequences Of Violation:** 500 jobs flood the queue, all fail again immediately — workers are saturated with failing jobs, legitimate new jobs are delayed, and the `failed_jobs` table grows by 500 more entries.

---

## Rule 4

**Rule Name:** consider-payload-age-before-retry

**Category:** Always

**Rule:** Always consider payload age before retrying old failed jobs.

**Reason:** A job that failed 30 days ago may reference data that no longer exists — the payload stores model IDs at dispatch time.

**Bad Example:**
```bash
queue:retry all # Retries jobs from 3 months ago — models were deleted
```

**Good Example:**
```bash
# Skip very old failures
DB::table('failed_jobs')->where('failed_at', '<', now()->subDays(7))->delete();
queue:retry all # Only recent failures
```

**Exceptions:** Jobs that process immutable data or archive records may be safely retried at any age.

**Consequences Of Violation:** Old job retries fail with "model not found" or similar errors — they immediately re-enter `failed_jobs`, and workers wasted time processing a job that could never succeed.
