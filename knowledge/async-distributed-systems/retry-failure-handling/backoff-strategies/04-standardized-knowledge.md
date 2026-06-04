# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Retry & Failure Handling
- **Knowledge Unit:** K018 — Backoff Strategies
- **Knowledge ID:** K018
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Backoff
  - Laravel Source — `Illuminate\Queue\Worker::getBackoff()`

---

# Overview

Backoff strategies determine how long a worker waits before retrying a failed job. Laravel supports **fixed** (constant delay), **exponential** (delay doubles each attempt via array), and **exponential with jitter** (exponential plus random variance). The choice directly impacts downstream service load, thundering herd prevention, and time-to-completion for transient failures. Fixed backoff is simple but ineffective under load. Exponential with jitter is the production standard.

---

# Core Concepts

- **Fixed backoff:** Single integer `$backoff = 30`. Every retry waits 30 seconds.
- **Exponential array:** `$backoff = [10, 30, 120]`. Each element = delay for attempt 2, 3, 4.
- **Jitter:** Random variance added to each delay. Not automatic — must implement via custom backoff or middleware.
- **Default:** No backoff set = `release(0)` — immediate re-queue, tight retry loop.

---

# When To Use

- **Exponential + jitter for API calls:** Industry standard. Prevents thundering herd.
- **Fixed for internal infrastructure:** DB failovers, cache warmups — predictable timing matters more.
- **Zero backoff:** Only for testing — causes CPU spikes in production.

---

# When NOT To Use

- No backoff at all — immediate retry loop burns CPU with no recovery window.
- Fixed backoff for external APIs — considered aggressive, may trigger abuse protections.

---

# Best Practices

- **Match array length to `$tries - 1`.** Backoff array should have one element per retry. Extra elements are ignored; missing elements use last value. *Why: Each array element corresponds to one retry attempt. If `$tries = 5`, you have 4 retries — the array should have 4 elements. Missing elements silently reuse the last value, which may be too short or too long.*
- **Use exponential + jitter for all external API calls.** Without jitter, all workers retry at the same time, creating synchronized load spikes. *Why: When a downstream service recovers, all waiting jobs retry simultaneously — jitter spreads retries across the recovery window, preventing a thundering herd that could overwhelm the just-recovered service.*
- **Log the backoff value on each retry.** Essential for debugging retry timing issues. *Why: Without logging, you can't tell if backoff is working as intended — a misconfigured backoff array silently produces unexpected delays.*

---

# Performance Considerations

- Backoff delay = job occupies queue storage during wait.
- Zero backoff: a failing job can consume 10K retries/minute, saturating workers.
- Jitter randomness adds no significant CPU overhead.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| No backoff set | Default is 0 | Immediate retry loop — CPU waste | Always set explicit backoff |
| Single integer for all retries | `$backoff = 30` | Late retries wait same as early | Use exponential array |
| Array longer than `$tries - 1` | Mismatch | Extra elements never used | Match array to retry count |
| Assuming jitter is automatic | Not documented | All workers retry simultaneously — thundering herd | Implement jitter explicitly |

---

# Examples

```php
class ApiJob implements ShouldQueue
{
    public $tries = 5;
    public $backoff = [10, 20, 40, 80]; // 4 retries matching $tries=5

    public function handle(): void
    {
        // API call
    }
}
```

---

# Related Topics

- **K017 $tries / $maxExceptions / retryUntil (K017)** — Retry policy
- **K019 Backoff Array (K019)** — Progressive delays in detail
