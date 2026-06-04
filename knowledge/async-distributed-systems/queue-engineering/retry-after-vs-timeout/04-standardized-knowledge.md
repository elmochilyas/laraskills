# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Worker Management
- **Knowledge Unit:** K079 — `retry_after` vs `--timeout` Semantics
- **Knowledge ID:** K079
- **Difficulty Level:** Expert
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Configuration
  - Laravel Source — `Illuminate\Queue\Worker`, `Illuminate\Queue\RedisQueue`

---

# Overview

`retry_after` and `--timeout` serve different purposes but their misconfiguration is the most common cause of double-processing. **`retry_after`** (connection config) is the backend's reservation timeout — how long before a reserved job becomes available to another worker. **`--timeout`** (worker flag) is the maximum execution time per job — after this, the worker process is killed. The critical rule: `--timeout` must be LESS than `retry_after`. If `--timeout` exceeds `retry_after`, a job running longer than `retry_after` is re-processed by another worker while the original still runs — guaranteed double processing.

---

# Core Concepts

- **`retry_after`:** Per-connection config. Reservation timeout. Default 90s.
- **`--timeout`:** Worker CLI flag. Max job execution time. Default 60s.
- **Safe:** `--timeout` < `retry_after` — worker killed before reservation expires. Job released for retry.
- **Danger:** `--timeout` > `retry_after` — reservation expires while worker processes. Second worker grabs it. Both process.
- **`--timeout` = `retry_after`:** Race condition — timing may cause reservation expiry just before worker kill.

---

# When To Use

- **Safe configuration:** `--timeout` = max expected job runtime + 30% buffer.
- **`retry_after` = `--timeout` + 10 seconds.** Always larger.

---

# When NOT To Use

- `--timeout` equal to or greater than `retry_after` — guaranteed or probable double processing.
- Ignoring job's `$timeout` property — it overrides the worker's `--timeout`.

---

# Best Practices

- **Always set `--timeout` at least 10 seconds less than `retry_after`.** This buffer accounts for clock skew and timing edge cases. *Why: If `--timeout` equals `retry_after`, a 1-second clock skew between the worker and queue backend can cause the reservation to expire before the worker is killed — double processing.*
- **Remember that job `$timeout` property overrides `--timeout`.** A job with `public $timeout = 600` runs up to 600 seconds even if the worker `--timeout` is 60. *Why: The job's `$timeout` property is checked first — the worker's `--timeout` only applies to jobs without their own `$timeout`. This can silently bypass the safety buffer.*
- **`retry_after` is per-connection, not per-queue.** All queues on the same connection share the same `retry_after`. *Why: If one queue processes 10-second jobs and another processes 120-second jobs, they share the same `retry_after` — the 10-second queue has an unnecessarily long reservation, delaying failure recovery.*

---

# Performance Considerations

- `retry_after` has no CPU impact — it's a backend timer.
- `--timeout` uses signals or process monitoring — minimal CPU.
- Double processing from misconfiguration: two workers consume resources for the same job.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| `--timeout` > `retry_after` | Not understanding the relationship | Reservation expires before worker kill — double processing | Keep `--timeout` < `retry_after` |
| `--timeout` = `retry_after` | Assuming equality is safe | Clock skew causes race condition — intermittent double processing | Add 10+ second buffer |
| Not accounting for job `$timeout` | Job property overrides worker flag | Job silently runs longer than `retry_after` | Check both values |

---

# Examples

```php
// config/queue.php
'redis' => [
    'driver' => 'redis',
    'retry_after' => 70, // Must be > worker --timeout
],

// Supervisor command
// --timeout=60 ensures worker dies before retry_after=70 expires
command: php artisan queue:work redis --timeout=60 --tries=3
```

---

# Related Topics

- **K056 Worker Daemon Architecture (K056)** — Timeout in daemon loop
- **K057 Process Signals (K057)** — SIGALRM relationship
