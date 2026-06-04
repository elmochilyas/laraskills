# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Middleware
- **Knowledge Unit:** K055 — `ShouldBeUnique` and Unique Job Locking
- **Knowledge ID:** K055
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Unique Jobs
  - Laravel Source — `Illuminate\Contracts\Queue\ShouldBeUnique`

---

# Overview

`ShouldBeUnique` prevents duplicate instances of the same job from being dispatched while another instance (with the same unique key) is still in the queue. Unlike `WithoutOverlapping` (prevents concurrent EXECUTION), `ShouldBeUnique` prevents concurrent DISPATCH — the second dispatch is silently dropped. It uses a cache-based lock with a configurable TTL (`uniqueFor`). The `uniqueVia()` method allows custom locking implementations.

---

# Core Concepts

- **`ShouldBeUnique`:** Marker interface. Implement on the job class. Prevents duplicate queued instances.
- **`uniqueId()`:** Returns the unique key. Default is the class name. Override for scoped uniqueness.
- **`uniqueFor()`:** Duration (seconds) the job is considered unique. Defaults to 0 (never auto-releases).
- **`uniqueVia()`:** Returns a `UniqueLock` instance for custom locking.
- **Dropped dispatch:** If the lock is held, `Bus::dispatchToQueue()` does NOT push the job. Returns `null`.
- **`ShouldBeUniqueUntilProcessing`:** Lock releases once the job STARTS processing, not after completion.

---

# When To Use

- Preventing duplicate webhook processing for the same event ID
- Throttling rapid dispatches of the same job (e.g., user triggered multiple profile save events)
- Ensuring only one instance of a recurring job exists at a time

---

# When NOT To Use

- Preventing concurrent execution — use `WithoutOverlapping` instead
- When you need the second dispatch to wait (not be dropped) — use `WithoutOverlapping` with release
- Jobs where duplicate execution is harmless (idempotent work)

---

# Best Practices

- **Always override `uniqueId()` to scope per entity.** The default is the job class name — ALL instances share the same lock, so only ONE instance can ever be queued. *Why: Without scoping, `ShouldBeUnique` becomes a singleton gate — a job for order 123 blocks a job for order 456.*
- **Always set `uniqueFor` to a reasonable TTL.** If a job crashes before completion, the lock persists indefinitely — no future instances can run. *Why: With `uniqueFor = 0` (default), the lock only releases on job completion. A crashed job leaves the lock forever.*
- **Match `uniqueFor` to max queue wait time + max execution time + buffer.** If the job spends 5 minutes in the queue and takes 2 minutes to run, set `uniqueFor` to at least 10 minutes. *Why: If `uniqueFor` expires while the first job is still queued (waiting or running), a second instance is dispatched — the lock was designed to prevent this.*
- **Combine with `WithoutOverlapping` for strict guarantees.** `ShouldBeUnique` prevents duplicate dispatch; `WithoutOverlapping` prevents concurrent execution even if timing windows overlap. *Why: `ShouldBeUnique` only prevents dispatch — two jobs dispatched before the second was suppressed can both be in the queue.*

---

# Performance Considerations

- Lock acquisition: cache operation (~1-5ms) per dispatch.
- Lock release: cache operation per job completion.
- Dropped dispatches save queue storage and worker time — the job is never created.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not overriding `uniqueId()` | Default is class name | Only ONE instance of the job can ever be queued | Override to scope per entity |
| Not setting `uniqueFor` | Default is 0 (no expiry) | Stale lock blocks ALL future dispatches after crash | Set `uniqueFor` to max TTL |
| Confusing with `WithoutOverlapping` | Both prevent overlap | Wrong behavior (drops vs releases) | Use `ShouldBeUnique` for dispatch, `WithoutOverlapping` for execution |

---

# Examples

```php
class ProcessWebhook implements ShouldQueue, ShouldBeUnique
{
    public function uniqueId(): string
    {
        return $this->eventId;
    }

    public function uniqueFor(): int
    {
        return 3600; // 1 hour
    }

    public function handle(): void
    {
        // Process webhook — must not have duplicate in queue
    }
}
```

---

# Related Topics

- **K052 WithoutOverlapping Middleware (K052)** — Contrast: dispatch vs execution prevention
- **K076 RateLimiter Facade (K076)** — Related locking mechanism
