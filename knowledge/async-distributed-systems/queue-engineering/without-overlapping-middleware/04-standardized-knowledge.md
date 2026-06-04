# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Middleware
- **Knowledge Unit:** K052 — `WithoutOverlapping` Middleware
- **Knowledge ID:** K052
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Job Middleware
  - Laravel Source — `Illuminate\Queue\Middleware\WithoutOverlapping`

---

# Overview

`WithoutOverlapping` prevents concurrent execution of the same job by using a cache-based lock. When a job acquires the lock, subsequent dispatches of the same job key release themselves back to the queue until the lock expires or the current execution finishes. This is essential for jobs that must not run simultaneously — billing operations, file processing, or any work on shared mutable state without idempotency guarantees.

---

# Core Concepts

- **Lock mechanism:** Atomic cache lock (Redis, Memcached, Database) with unique key based on job class + optional identifier.
- **Key scoping:** `WithoutOverlapping::byKey('process-orders')` scopes the lock. Jobs with the same key cannot overlap.
- **Release duration:** `releaseAfter($seconds)` controls how long a blocked job waits before retrying.
- **Lock expiry:** `expireAfter($seconds)` TTL. If job crashes, lock auto-releases. Defaults to job's `$timeout`.
- **Not re-entrant:** The same job instance cannot acquire the lock twice.

---

# When To Use

- Jobs that mutate shared state (billing reconciliation, file processing, data sync)
- Resource-limited operations (single-threaded external service, rate-limited file handle)
- When concurrent execution would corrupt data

---

# When NOT To Use

- Read-only jobs — overlapping reads are safe
- Jobs with idempotent side effects — idempotency handles duplicates more gracefully
- Jobs that dispatch other instances of themselves on the same key — will deadlock

---

# Best Practices

- **Always use key scoping.** `WithoutOverlapping` without `->byKey()` locks globally — one job instance blocks ALL instances of that class. *Why: The default lock key is just the job class name, making it a global singleton. Entity-level scoping (by order ID, user ID, file path) allows parallel processing of different entities.*
- **Set `releaseAfter` to a meaningful backoff (5-30 seconds).** Immediate release creates a tight retry loop — the job retries instantly, hits the lock, releases, retries again. *Why: Without `releaseAfter`, the default is 0 — the job is released immediately and immediately retried, burning CPU with no progress.*
- **Set `expireAfter` to 2x the job's p99 execution time.** This prevents lock expiration mid-execution while avoiding excessively long lock TTLs. *Why: If the lock expires while the job is still running, a second instance acquires the lock and overlaps. If the TTL is too long, a crashed job blocks processing for that duration.*
- **Only use with cache drivers supporting atomic locks (Redis, Memcached, Database).** `array` and `file` cache drivers do not correctly implement atomic locks. *Why: Non-atomic lock operations are racy — two workers can both acquire "the lock" and run concurrently.*

---

# Performance Considerations

- Lock acquisition: ~1-5ms per cache operation.
- Multiple overlapping attempts on the same key create lock contention at high concurrency.
- Lock entries persist in cache for `expireAfter` seconds — monitor memory usage from lock keys.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not setting `releaseAfter` | Default is 0 | Tight retry loop — infinite CPU burn | Set `releaseAfter(5)` or more |
| Not scoping with `byKey()` | Lock is global | All instances of the job class serialize | Use `byKey(fn($j) => $j->orderId)` |
| `expireAfter` shorter than job duration | Lock expires mid-execution | Second instance starts, overlaps with first | Set `expireAfter` to 2x p99 duration |
| Using with `array` cache driver | No atomic lock support | Overlapping occurs silently | Use Redis or Database cache |

---

# Examples

```php
class ProcessOrder implements ShouldQueue
{
    public function middleware(): array
    {
        return [(new WithoutOverlapping($this->order->id))
            ->releaseAfter(10)
            ->expireAfter(120)];
    }

    public function handle(): void
    {
        // Mutate order state — must not run concurrently
    }
}
```

---

# Related Topics

- **K055 ShouldBeUnique (K055)** — Prevents dispatch vs prevents execution
- **K076 RateLimiter Facade (K076)** — Related locking mechanism
