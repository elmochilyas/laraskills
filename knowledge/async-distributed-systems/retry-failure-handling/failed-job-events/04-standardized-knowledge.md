# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Retry & Failure Handling
- **Knowledge Unit:** K022 — Failed Job Events (`Queue::failing`)
- **Knowledge ID:** K022
- **Difficulty Level:** Foundation
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Source — `Illuminate\Queue\Events\JobFailed`

---

# Overview

`Queue::failing` fires whenever a job permanently fails. It's the primary hook for global failure monitoring, alerting, and logging across all job types. Unlike the job-level `failed()` method, `Queue::failing` receives the job object and exception without job-type-specific context — suited for cross-cutting concerns. Additional queue events (`Queue::looping`, `Queue::paused`, `Queue::resumed`, `Queue::workerStopping`) provide lifecycle hooks for worker monitoring.

---

# Core Concepts

- **`Queue::failing`:** Dispatched via `Worker::raiseFailedJobEvent()`. Receives job instance and exception.
- **Event payload:** `JobFailed` — contains `$connectionName`, `$job`, `$exception`.
- **Firing order:** `failed_jobs` storage → `Queue::failing` → `$job->failed()` (order varies by version).
- **Other events:** `Queue::looping` (before each worker loop), `Queue::paused`/`Queue::resumed`, `Queue::workerStopping`.

---

# When To Use

- Centralized failure logging to structured logging systems
- Slack/PagerDuty alerting on failure thresholds
- Failure rate metrics (Prometheus, StatsD)

---

# When NOT To Use

- Job-specific cleanup — use `$job->failed()` instead
- Logic that depends on `failed_jobs` being present — order varies by version

---

# Best Practices

- **Keep event listeners lightweight or dispatch them async.** Slow listeners (HTTP calls, Slack webhooks) block the worker from returning to processing. *Why: `Queue::failing` is synchronous — every listener blocks the worker. Under high failure rates, slow listeners compound the problem by delaying all job processing.*
- **Use for infrastructure-level monitoring — not job-specific cleanup.** Filter by exception type, connection, or queue name in the listener. *Why: `Queue::failing` has no job-type-specific context — it fires for ALL failures. Filtering allows targeted alerting (alert on validation errors, not on rate limit retries).*
- **Don't register listeners in service providers without cleanup.** Listeners accumulate over the worker's lifetime — memory leak risk. *Why: In a daemon worker, service providers boot once. If `Queue::failing` listeners are registered repeatedly (e.g., on each request), they accumulate, causing memory growth and duplicate event handling.*

---

# Performance Considerations

- Each failing event dispatch is synchronous — blocks worker until listeners complete.
- Slow event listeners delay the worker's return to processing.
- For high failure rates, dispatch event handling to the queue.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Heavy I/O in listener | Making API calls in listener | Worker blocked during failure handling | Dispatch notification to queue |
| Not filtering failure types | All failures trigger the same alert | Noise from transient errors | Filter by exception type |
| Confusing `Queue::failing` with `JobFailed` event | Two ways to register | Double handling | Use one consistent approach |

---

# Examples

```php
// In AppServiceProvider
Queue::failing(function (JobFailed $event) {
    Log::warning('Job failed', [
        'connection' => $event->connectionName,
        'job' => $event->job->resolveName(),
        'exception' => $event->exception->getMessage(),
    ]);
});
```

---

# Related Topics

- **K020 failed_jobs Storage (K020)** — Storage context
- **K021 failed() Method (K021)** — Job-level complement
