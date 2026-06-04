# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Observability
- **Knowledge Unit:** K071 — Horizon Wait Time Monitoring and Alerts
- **Knowledge ID:** K071
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Horizon Docs — Metrics
  - Laravel Source — `Laravel\Horizon\Contracts\MetricsRepository`

---

# Overview

Horizon wait time is the duration a job spends in the queue before processing starts — the single most important queue health indicator. Rising wait times signal that workers can't keep pace with dispatch volume. Horizon calculates wait time as `depth / throughput_rate` and displays it per-queue with sparkline trends. Unlike queue depth, wait time directly measures user-facing latency.

---

# Core Concepts

- **Wait time:** Wall-clock time between dispatch and processing start. Excludes execution time.
- **Queue depth vs wait time:** Depth counts items; wait time measures actual delay. A shallow queue with slow workers = high wait time. A deep queue with fast workers = low wait time.
- **Wait time calculation:** `depth / (throughput_per_minute / 60)` — an approximation, not exact.
- **Horizon metrics:** Collected in Redis every minute via `horizon:snapshot`. Stored in sorted sets with TTL (default 24h).
- **No built-in alerting:** Horizon has no alerting — use external tools (PagerDuty, Slack, Pulse) polling Horizon's Redis data.

---

# When To Use

- Capacity planning — wait time trends determine when to add/remove workers
- Anomaly detection — spikes indicate worker failures or dispatch surges
- Baseline establishment — know normal ranges per queue

---

# When NOT To Use

- Non-Horizon queues (SQS, database) — wait time metrics are Horizon-only
- Burst-sensitive applications — wait time calculation is an approximation that can be misleading during sudden traffic spikes
- When exact wait time per individual job is needed — Horizon's calculation is queue-level averaged

---

# Best Practices

- **Monitor wait time per queue, not globally.** Each queue has different throughput and acceptable latency. *Why: A critical queue (password resets) needs sub-second wait times; a batch processing queue can tolerate minutes. Aggregating them hides both problems.*
- **Set warning at 2x baseline, critical at 5x baseline.** Use dynamic baselines (rolling 7-day average), not static thresholds. *Why: Traffic patterns change seasonally — a static threshold will either trigger false positives during peak hours or miss issues during off-peak hours.*
- **Use Horizon auto-balancing to minimize wait time variance.** Auto-balancing shifts workers between queues based on demand. *Why: Without auto-balancing, one busy queue can have high wait time while another queue's workers are idle — auto-balancing redistributes workers dynamically.*
- **Investigate spikes in order:** 1) Are workers running? 2) Has dispatch volume increased? 3) Were workers restarted recently? 4) Is Redis experiencing latency? *Why: These four causes cover 90%+ of wait time anomalies. Following this order avoids false trails.*

---

# Performance Considerations

- `horizon:snapshot` runs in a separate process — minimal overhead.
- Each queue's metrics ~1KB/day in Redis at default settings.
- `LLEN` (depth check) is O(1) — doesn't block Redis.
- External alert polling should be cached 30-60 seconds to avoid Redis load.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Monitoring depth instead of wait time | Depth is easier to measure | Shallow queue with slow workers looks healthy | Monitor both depth AND wait time |
| Static threshold for all queues | Same value everywhere | False positives or missed issues | Per-queue dynamic baselines |
| No external alerting configured | Horizon lacks built-in alerts | Wait time spikes go undetected | Set up Slack/PagerDuty integration |

---

# Related Topics

- **K070 Pulse SlowJobs Recorder (K070)** — Execution duration observability
- **K047 Horizon Metrics (K047)** — Metrics architecture
