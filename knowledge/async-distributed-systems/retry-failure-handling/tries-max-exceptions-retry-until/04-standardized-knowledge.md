# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Retry & Failure Handling
- **Knowledge Unit:** K017 — `$tries`, `$maxExceptions`, `retryUntil()`
- **Knowledge ID:** K017
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Max Attempts
  - Laravel Source — `Illuminate\Queue\Worker::markJobAsFailedIfAlreadyExceedsMaxAttempts()`

---

# Overview

Three properties control when a job stops retrying: `$tries` (max attempts), `$maxExceptions` (max exceptions before failing), and `retryUntil()` (time-based cutoff). A job fails when it exceeds `$tries` attempts, OR when it exceeds `$maxExceptions` exceptions, OR when `retryUntil()` returns a past timestamp. `retryUntil()` overrides `$tries`, and `$maxExceptions` provides a per-attempt cap within the `$tries` limit.

---

# Core Concepts

- **`$tries`:** Max `handle()` attempts. Default `null` (unlimited). Worker-level `--tries` is fallback.
- **`$maxExceptions`:** Max unhandled exceptions allowed before failing. Default `null` (unlimited).
- **`retryUntil()`:** Returns `Carbon`/timestamp. Job retries until this time, regardless of `$tries`.
- **Interaction:** First-to-expire wins. `$maxExceptions` is checked independently — if exceeded, the job fails even if `$tries` and `retryUntil()` are not exhausted.

---

# When To Use

- **`$tries` explicitly on every job.** Default `null` means infinite retries — dangerous.
- **`retryUntil()` for time-sensitive jobs:** Password resets, payment processing — must complete within a deadline.
- **`$maxExceptions` for unreliable downstream services:** Transient errors expected; sustained errors should abort.

---

# When NOT To Use

- `$maxExceptions > $tries` — has no effect; the job exhausts `$tries` first.
- `$tries = 0` or `null` — retries indefinitely without `retryUntil()`.

---

# Best Practices

- **Set `$tries` explicitly on every job class.** Default `null` means infinite retries — one overlooked bug causes indefinite worker consumption. *Why: Without explicit `$tries`, a job that always throws an exception retries forever, consuming worker time and queue capacity until manually killed.*
- **Use `retryUntil()` over `$tries` for external API calls.** Retry for N minutes (not N times) — a slow API may need fewer/more attempts depending on response time. *Why: `retryUntil()` adapts to variable execution times — a 10-minute retry window with fast responses might get 100 attempts, while slow responses get 10. `$tries` is fixed regardless.*
- **Keep `$maxExceptions` ≤ `$tries`.** If `$maxExceptions` > `$tries`, the job exhausts `$tries` before reaching `$maxExceptions`. *Why: `$maxExceptions` is only useful when it's the lower bound — it causes the job to fail earlier than `$tries` would, based on exception count rather than total attempts.*

---

# Performance Considerations

- Each retry costs full job execution + backoff delay.
- Jobs with high `$tries` (10+) that consistently fail on early attempts waste significant capacity.
- `retryUntil()` and `$maxExceptions` checks are O(1) — no additional cost.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| `$tries` not set (null) | Default behavior | Infinite retries — job runs forever | Always set explicit `$tries` |
| `$maxExceptions > $tries` | Misunderstanding | `$maxExceptions` never triggers | Keep `$maxExceptions ≤ $tries` |
| `retryUntil()` returns null/void | Method not implemented properly | Unlimited retries | Always return a Carbon instance |

---

# Related Topics

- **K016 Failure Taxonomy (K016)** — Context
- **K018 Backoff Strategies (K018)** — Delay between retries
