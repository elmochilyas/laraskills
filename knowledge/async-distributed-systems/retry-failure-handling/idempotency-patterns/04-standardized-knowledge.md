# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Retry & Failure Handling
- **Knowledge Unit:** K075 — Idempotency Patterns for Job Processing
- **Knowledge ID:** K075
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Unique Jobs
  - Distributed Systems Theory — At-Least-Once Delivery

---

# Overview

Idempotency ensures a job produces the same side effects regardless of how many times it executes. At-least-once delivery guarantees mean jobs can be processed more than once — due to worker crashes after execution before ack, retry workflows, or network partitions. The core pattern uses a unique job identifier (UUID) tracked in a deduplication store — if the UUID was already processed, the job skips execution.

---

# Core Concepts

- **At-least-once delivery:** Laravel queues guarantee this — jobs may be processed more than once.
- **Idempotent operation:** Same result regardless of execution count (e.g., "set status to paid" yes; "add 10 cents" no).
- **Deduplication key:** Job UUID stored after successful processing. Checked before execution.
- **Idempotency store:** Cache/DB/Redis storing processed IDs with TTL.
- **Processing guard:** Check at start of `handle()` — "already processed?" → skip.

---

# When To Use

- **Always for:** Jobs with side effects — API calls, payment processing, email sending.
- **Not needed for:** Read-only jobs, naturally idempotent operations (setting status, updating cache).

---

# When NOT To Use

- Read-only jobs (no side effects to duplicate)
- Cache-based dedup with `array` driver — worker restart clears the store

---

# Best Practices

- **Prefer DB unique constraints over cache for financial operations.** DB constraints survive restarts and evictions — cache doesn't. *Why: A cache eviction removes the dedup key, allowing the same job to run again. For payment processing, this could cause double charges. DB constraints are durable.*
- **Set dedup TTL to exceed total retry window + 24 hours.** Jobs may be retried from `failed_jobs` days later. *Why: A retried job whose dedup key expired runs again as if it were new. The dedup TTL must cover the longest possible path from dispatch to final retry.*
- **Don't use `array` cache for dedup.** The entire dedup store resets on worker restart or deploy. *Why: `array` cache is per-process — each worker has its own store. A job processed by Worker A has its dedup key in Worker A's memory; Worker B knows nothing about it.*

---

# Performance Considerations

- Cache check: ~1ms (Redis GET). DB check: ~5-10ms (indexed).
- Dedup store grows with job volume — set appropriate TTL to bound growth.
- For sub-100ms jobs, dedup overhead is meaningful.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| No idempotency for side-effect jobs | "It only runs once in dev" | Duplicate processing in production — real-world impact | Always implement for side effects |
| `array` cache for dedup | Wrong cache driver | All dedup keys lost on worker restart | Use Redis or database |
| TTL too short (1 hour) | Not considering retry window | Job retried from DLQ after 2 hours bypasses dedup | Set TTL > total retry window + 24h |

---

# Examples

```php
class ProcessPayment implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $dedupKey = 'payment_'.$this->paymentId;
        if (Cache::has($dedupKey)) {
            return; // Already processed
        }

        // Process payment...

        Cache::put($dedupKey, true, 86400); // 24 hours
    }
}
```

---

# Related Topics

- **K016 Failure Taxonomy (K016)** — Why retries happen
- **K052 WithoutOverlapping (K052)** — Related concurrency guard
