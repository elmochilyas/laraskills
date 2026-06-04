# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Engineering
- **Knowledge Unit:** K077 — Queue Priority via Multiple Queues
- **Knowledge ID:** K077
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Workers & Queue Priority

---

# Overview

Laravel implements queue priority through worker queue subscriptions, not through backend priority features. Workers specify `--queue=high,default,low` and process jobs from `high` first, then `default` when `high` is empty, then `low` when both are empty. This is polling-order priority — jobs in higher-priority queues are consumed before lower-priority ones, but a currently processing low-priority job is not preempted. For SQS, each priority level requires a separate SQS queue URL.

---

# Core Concepts

- **Worker priority ordering:** `--queue=critical,default,reports` — worker empties `critical` before looking at `default`, then `reports`.
- **Not preemptive:** If a `critical` job arrives while a `reports` job is processing, the current job finishes first. Priority only affects the next `pop()`.
- **SQS limitation:** SQS does not support multiple queues on one URL. Each priority level needs a separate URL and separate workers.
- **Horizon multi-queue:** Supervisors subscribe to multiple queues with priority ordering + auto-balancing.

---

# When To Use

- **2-3 priority tiers:** `critical` (<5s expected), `default` (<30s), `bulk` (<1h). Beyond 3, benefit diminishes.
- **Dedicated Horizon supervisor per tier:** Independent `minProcesses`/`maxProcesses` settings.
- **SQS:** Separate queue URLs per tier with separate worker processes.

---

# When NOT To Use

- SQS with comma-separated `--queue` — SQS queues are separate URLs; only the first is used.
- More than 3 priority tiers — operational complexity outweighs benefit.
- Sharing workers between CPU-intensive and latency-sensitive jobs — use separate supervisors.

---

# Best Practices

- **Define priority based on user-facing latency sensitivity.** `critical` = password resets, OTPs, payment callbacks. `bulk` = report generation, data export, cleanup. *Why: Priority should reflect how long users are willing to wait — a password reset that takes 2 minutes is a product failure; a nightly report that takes 2 hours is acceptable.*
- **Use separate Horizon supervisors per priority tier.** Each supervisor has independent `minProcesses`/`maxProcesses` and `balance` settings. *Why: Shared supervisors mean a single worker pool serves all queues — a flood of high-priority jobs starves low-priority ones; separate supervisors guarantee minimum throughput per tier.*
- **Monitor oldest-job-age per queue, not just per connection.** A growing `default` queue shouldn't trigger a critical alert if `critical` is processing normally. *Why: Aggregate queue depth hides per-queue starvation — a `bulk` queue could have 10K jobs while `critical` is empty, but total depth tells the wrong story.*

---

# Performance Considerations

- Polling overhead: each pop iteration checks all queues — empty high-priority queues add zero latency.
- `--sleep` adds delay between iterations — priority matters only when jobs exist.
- At high throughput, each priority tier needs enough workers to prevent backlog.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| SQS with `--queue=high,default` | Assuming SQS supports queue names | Only first queue processed | Separate SQS URLs + separate workers |
| Assuming preemptive priority | Not understanding polling-order | Low-pri job currently running blocks high-pri job | Accept non-preemptive — or use separate supervisors |
| Same workers for CPU-intensive + latency-sensitive | Shared pool | Heavy jobs block light ones | Separate supervisors per tier |

---

# Examples

```bash
# Worker with priority ordering
php artisan queue:work redis --queue=critical,default,bulk

# Horizon config for priority
'high' => [
    'connection' => 'redis',
    'queue' => ['critical', 'default'],
    'balance' => 'auto',
    'minProcesses' => 2,
    'maxProcesses' => 10,
],
```

---

# Related Topics

- **K001 Queue Connections vs. Queues (K001)** — Foundational topology
- **K002 Queue Driver Architecture (K002)** — SQS vs Redis priority handling
