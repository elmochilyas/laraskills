# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Middleware
- **Knowledge Unit:** K051 — `ThrottlesExceptions` Middleware
- **Knowledge ID:** K051
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Job Middleware
  - Laravel Source — `Illuminate\Queue\Middleware\ThrottlesExceptions`

---

# Overview

`ThrottlesExceptions` releases the job back to the queue when the number of thrown exceptions exceeds a threshold within a time window. Unlike `RateLimited` (proactive — prevents execution based on attempt count), `ThrottlesExceptions` is reactive — it detects repeated failures and backs off. This is useful for jobs that fail intermittently due to downstream instability, where you want to slow retries after a burst of failures without hard-limiting execution.

---

# Core Concepts

- **Threshold and window:** Configured with `maxExceptions` per `decayMinutes`.
- **Exception counting:** Counts all uncaught exceptions from `handle()` within the time window.
- **Release behavior:** When threshold exceeded, job is released with delay (time until window reset).
- **Backoff callback:** Optional `backoff($exception)` to customize release delay per exception type.
- **Distinct from `$maxExceptions`:** `$maxExceptions` permanently fails the job. `ThrottlesExceptions` temporarily releases it.
- **Uses `RateLimiter` facade** under the hood for counter storage.

---

# When To Use

- Jobs making downstream API calls where failure indicates transient issues (500s, timeouts)
- When you want gradual backoff after failure bursts without permanent job failure
- Combined with `RateLimited` for both proactive and reactive protection

---

# When NOT To Use

- Jobs with deterministic failures (validation errors, logic errors) — fix the bug, don't throttle
- When you want permanent failure after N exceptions — use `$maxExceptions`
- Jobs that handle their own retry logic internally

---

# Best Practices

- **Set `decayMinutes` longer than the downstream service's typical recovery time.** If a service takes 5 minutes to recover, set the window to 5+ minutes. *Why: A too-short window releases the job while the service is still down — it immediately fails again, consuming retries.*
- **Use the `backoff` callback for exception-specific delays.** Rate limit errors (429) should back off differently than server errors (503). *Why: 429 means "try again at this specific time" — the callback can set the exact delay. 503 means "try again later" — an exponential backoff is more appropriate.*
- **Apply `RateLimited` before `ThrottlesExceptions` in the middleware stack.** Proactive check first, reactive backup second. *Why: `RateLimited` prevents execution entirely when the rate limit is hit — `ThrottlesExceptions` only reacts after a failure occurs.*
- **Success clears the counter.** `RateLimiter::clear()` is called on success — this means a single successful job resets the throttle state. Be aware that this can lead to alternating success-failure patterns. *Why: Without clearing, the counter accumulates failures over time, eventually throttling even healthy jobs.*

---

# Performance Considerations

- Exception counting via `RateLimiter::hit()` adds cache write per exception (~1-3ms).
- Job released via throttle doesn't consume a queue retry attempt — it's a release, not a fail.
- Minimal overhead on the happy path (no exception → just `clear()` the counter).

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Too-low threshold (e.g., 2 in 1 min) | Expecting zero failures | Job constantly backs off on flaky services | Set threshold based on observed failure rates |
| Not using `backoff` callback | All exceptions get same delay | 429 gets same backoff as 503 | Customize per exception type |
| Confusing with `$maxExceptions` | Both count exceptions | Throttling when you meant to fail permanently | Use `$maxExceptions` for permanent failure, `ThrottlesExceptions` for backoff |

---

# Examples

```php
class ApiJob implements ShouldQueue
{
    public function middleware(): array
    {
        return [(new ThrottlesExceptions(5, 10))->backoff(
            fn(Throwable $e) => $e instanceof RateLimitException ? 60 : 10
        )];
    }

    public function handle(): void
    {
        // API call that may throw HttpException, RateLimitException, etc.
    }
}
```

---

# Related Topics

- **K050 RateLimited Job Middleware (K050)** — Proactive counterpart
- **K076 RateLimiter Facade (K076)** — Underlying API
