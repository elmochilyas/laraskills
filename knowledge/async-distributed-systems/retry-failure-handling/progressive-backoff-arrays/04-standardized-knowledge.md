# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Retry & Failure Handling
- **Knowledge Unit:** K019 — `$backoff` Array for Progressive Delays
- **Knowledge ID:** K019
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Backoff
  - Laravel Source — `Illuminate\Queue\Worker::getBackoff()`

---

# Overview

Laravel's `$backoff` property accepts an array of integers for per-attempt delay progression: `$backoff = [10, 30, 60, 120, 300]`. Array index 0 = delay before first retry, index 1 = delay before second retry, etc. If `$tries` exceeds array length, the last value repeats. This enables fine-grained control — fast initial retries for transient blips, progressively slower retries for persistent failures.

---

# Core Concepts

- **Array indexing:** `$backoff[0]` = delay before attempt 2 (first retry). `$backoff[n]` = delay before attempt `n+2`.
- **Last-value reuse:** If `$tries > count($backoff) + 1`, the last element repeats for all remaining retries.
- **First attempt timing:** First attempt is immediate — delays only apply to retries.
- **Override precedence:** Job-level `$backoff` < Horizon supervisor `backoff` override.

---

# When To Use

- Fine-grained control over retry timing needed
- Critical production paths with varying recovery profiles per attempt
- When the total retry window must fit within a specific SLA

---

# When NOT To Use

- Simple uniform backoff is sufficient — use a single integer instead
- `$tries` is not matched to array length — leads to confusion

---

# Best Practices

- **Array length should match `$tries - 1`.** One element per retry attempt. *Why: Extra elements are never used and mislead; missing elements reuse the last value silently, which may be inappropriate for later retries.*
- **First element should be > 0.** Even transient errors need a moment to resolve. *Why: A 0-second first retry means no recovery window — the same transient error (network glitch, deadlock) is likely still present, causing immediate re-failure.*
- **Use gradual doubling, not steep jumps.** `[10, 20, 40, 80]` is better than `[10, 60, 600, 3600]`. *Why: Steep jumps either waste time on early retries (too short) or cause excessively long waits on later retries (too long). Gradual doubling provides smooth progression.*
- **Calculate total retry window.** Sum of array values + total execution time = maximum time before permanent failure. Ensure this fits within SLA. *Why: If `$backoff = [300, 600, 1800, 3600]`, total queued wait time is 6300 seconds (1.75 hours) — critical jobs may need to fail faster.*

---

# Performance Considerations

- Array stored in job payload — larger arrays add negligible overhead.
- Delay calculation is O(1) — direct index lookup.
- Cumulative delay (sum of array) determines max queue time before failure.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Array longer than `$tries - 1` | Mismatched config | Extra elements never used | Match array to retry count |
| First element is 0 | "Retry quickly" thinking | No recovery window — immediate re-failure | Start at 5-10 seconds |
| Exponential growth too steep | Not considering cumulative delay | Total retry window exceeds SLA | Keep doubling gradual |
| $tries increased but array not updated | Configuration drift | Last value repeats for new retries | Always update both together |

---

# Examples

```php
class ProcessPayment implements ShouldQueue
{
    public $tries = 5;
    public $backoff = [5, 15, 30, 60]; // 4 retries, escalating delays
    // Total wait time before failure if all retries used: 5+15+30+60 = 110 seconds
}
```

---

# Related Topics

- **K016 Failure Taxonomy (K016)** — Context
- **K018 Backoff Strategies (K018)** — Foundational patterns
