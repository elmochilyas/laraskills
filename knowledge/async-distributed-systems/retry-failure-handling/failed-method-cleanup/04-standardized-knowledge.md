# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Retry & Failure Handling
- **Knowledge Unit:** K021 — `failed()` Method on Jobs
- **Knowledge ID:** K021
- **Difficulty Level:** Foundation
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Failed Jobs
  - Laravel Source — `Illuminate\Queue\Worker::callJobFailedHandler()`

---

# Overview

The `failed(Throwable $e)` method is called when a job permanently fails. It receives the final exception and is the designated location for cleanup, compensation, and notification logic. Unlike batch `catch()` callbacks or middleware, `failed()` is part of the job class — it has access to constructor properties, making it natural for per-job failure handling. Exceptions thrown inside `failed()` are caught and logged but don't affect the failure state.

---

# Core Concepts

- **Trigger:** Called when `$tries` exhausted, `retryUntil()` passed, or `$this->fail()` called.
- **Idempotency:** May be called multiple times in edge cases — must be safe to run more than once.
- **Exception handling:** If `failed()` throws, the exception is caught and logged. Job remains in failed state.
- **Timing:** Runs after `failed_jobs` storage (or before in some versions — don't depend on order).

---

# When To Use

- Job-specific cleanup (file locks, temp files, API resource release)
- Notification with job-specific context
- Dispatching to a dead-letter queue

---

# When NOT To Use

- General failure logging or metrics — use `Queue::failing` event instead
- Complex logic that could itself fail — keep `failed()` lightweight

---

# Best Practices

- **Keep `failed()` lightweight.** If `failed()` throws, the failure is silently caught — your cleanup may not run. *Why: The framework catches exceptions from `failed()` and logs them, but doesn't retry. If `failed()` makes an API call that fails, the cleanup is lost without alerting.*
- **Make `failed()` idempotent.** It may be called multiple times (worker crash after storage, retry from `failed_jobs`). *Why: The framework does not guarantee single execution — a retried job that fails again calls `failed()` again. Double cleanup can cause new errors.*
- **Use `Queue::failing` for global concerns; use `failed()` for job-specific concerns.** The event is for infrastructure; `failed()` is for per-job compensation. *Why: `Queue::failing` fires for ALL job failures with no job-specific context. `failed()` has access to the job's constructor properties — natural for targeted cleanup.*

---

# Performance Considerations

- Called once per permanently failed job — negligible overhead.
- If `failed()` performs I/O, it adds latency to the worker's failure cycle.
- Throwing in `failed()` doesn't affect failure state but adds log noise.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not calling `parent::failed()` in subclasses | Inheritance overlooked | Parent cleanup never runs | Call `parent::failed($e)` |
| Assuming single execution | Not designing for idempotency | Double cleanup on retry | Make failed() idempotent |
| Complex logic in failed() | Over-engineering | Silent failure if failed() throws | Keep it simple (log + notify) |
| Using for global logging | Mixing concerns | Code duplication across all job classes | Use Queue::failing event |

---

# Examples

```php
class ProcessOrder implements ShouldQueue
{
    public function handle(): void { /* ... */ }

    public function failed(Throwable $e): void
    {
        Log::error('Order processing failed', [
            'order' => $this->orderId,
            'error' => $e->getMessage(),
        ]);
        // Release any held resource
    }
}
```

---

# Related Topics

- **K016 Failure Taxonomy (K016)** — Where failed() fits
- **K020 failed_jobs Storage (K020)** — Where the failure is logged
