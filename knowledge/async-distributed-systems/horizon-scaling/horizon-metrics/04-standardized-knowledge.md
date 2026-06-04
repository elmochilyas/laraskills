# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Horizon Scaling & Monitoring
- **Knowledge Unit:** K047 — Horizon Metrics (Throughput, Runtime, Wait Time)
- **Knowledge ID:** K047
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Horizon: Metrics
  - Laravel Source — `Laravel\Horizon\Snapshot`

---

# Overview

Horizon collects and displays three core metrics per queue: **throughput** (jobs processed per minute), **runtime** (average job execution time in milliseconds), and **wait time** (estimated seconds before a newly queued job will be processed). These metrics are stored in Redis as snapshots with configurable retention. They power the dashboard charts and inform the auto-balancing algorithm.

---

# Core Concepts

- **Throughput:** Number of jobs completed per minute for a given queue. Rolling window.
- **Runtime:** Average time from job start to completion (or failure). Includes middleware time.
- **Wait time:** Estimated time a new job will wait. Derived from queue depth × average runtime / worker count.
- **Metrics retention:** Configurable via `horizon.metrics` (trim, keep). Default: 1 hour.
- **Snapshot interval:** Metrics aggregated into snapshots at regular intervals.
- **Redis storage:** Metrics stored as Redis sorted sets keyed by `horizon:metrics:{type}:{queue}`.

---

# When To Use

- Reactive capacity scaling — wait time > N for > 5 minutes triggers auto-scaling
- Performance regression detection — runtime increase after deploy indicates issue
- Capacity planning — throughput growth trends inform infrastructure decisions
- Operational dashboards — real-time view of queue health

---

# When NOT To Use

- Real-time alerting — metrics are snapshot-based (10s granularity), not real-time
- SLA measurement — wait time is an estimate, not a guaranteed metric
- Long-term trend analysis — default 1-hour retention is too short; export externally
- Debugging individual job issues — averages hide outliers; use job-level logging

---

# Best Practices

- **Use wait time for reactive scaling, not precision SLAs.** Wait time is estimated from average runtime — variable-duration jobs make it inaccurate. *Why: Wait time formula `(depth × avg_runtime) / workers` is an estimate — it does not account for job execution order, priority, or runtime variance.*
- **Monitor runtime anomalies, not just average.** The arithmetic mean hides outliers. A single 10s job in a sea of 100ms jobs skews the average significantly. *Why: Average runtime masks p95/p99 issues — use Pulse or custom percentiles for performance-sensitive monitoring.*
- **Export metrics externally for long-term trends.** Default 1-hour Redis retention is insufficient for weekly/monthly analysis. *Why: Redis memory is limited — metrics are trimmed; external storage (Prometheus, DataDog) enables historical trend analysis.*
- **Account for metric reset after Horizon restart.** All metrics reset to zero — wait time shows 0 until runtime data accumulates (5-10 minutes). *Why: Runtime averages need sample data — immediately after restart, the balancer has insufficient data for accurate allocation.*

---

# Architecture Guidelines

- Monitoring snapshots are collected by the Horizon master process via `WorkloadSnapshot` and `ProcessSnapshot` classes.
- Throughput is computed from completed jobs in the snapshot interval.
- Runtime is the average of individual job runtimes recorded by workers.
- Wait time: `(queue_size × average_runtime) / active_workers`.
- Snapshots are stored in Redis sorted sets (time-series). Old snapshots are trimmed automatically.
- Dashboard queries read Redis sorted sets and render charts.

---

# Performance Considerations

- Metrics collection runs in Horizon master process — minimal overhead.
- Redis sorted set writes for metrics: ~1-10KB per snapshot per queue.
- Dashboard queries for last 60 minutes: fast (<100ms).
- Long retention increases Redis memory usage for metrics keys.
- High queue count (100+ supervisors) increases metrics key count proportionally.

---

# Security Considerations

- Metrics data is stored in Redis — anyone with Redis access can read queue throughput and wait times.
- Dashboard metrics reveal business activity patterns (peak processing times, volume) — protect dashboard access via `Horizon::auth()`.
- No sensitive data is stored in metrics — they are aggregate counts and timings.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Treating wait time as SLA | Assuming wait time is guaranteed | False confidence — wait time is an estimate | Use wait time for trend, not absolute SLA |
| Relying on runtime average | Using mean for performance decisions | Outliers hidden by average | Use p95/p99 for performance monitoring |
| Not extending metrics retention | Default 1 hour too short | No historical data for trend analysis | Export metrics externally |
| Assuming metrics are real-time | Expecting instant metric updates | 10-second lag between event and metric | Use event-based alerting for real-time needs |

---

# Anti-Patterns

- **Metric-driven auto-scaling based only on throughput:** Throughput can be high while wait time is also high (not enough workers). Use wait time for scaling decisions.
- **Ignoring metrics after Horizon restart:** All metrics reset — wait time shows 0, making the system look healthier than it is.
- **Using runtime average as the sole health indicator:** Averages mask p95 degradation. A gradual p95 increase is invisible in the average metric.

---

# Examples

```php
// config/horizon.php — metrics configuration
'metrics' => [
    'trim' => [
        'jobs' => 60,          // keep last 60 min of job metrics
        'queues' => 60,        // keep last 60 min of queue metrics
    ],
],
```

---

# Related Topics

- **K048 Horizon Notifications (K048)** — Metrics-based alerting
- **K071 Horizon Wait Time Monitoring (K071)** — Wait time deep dive
- **K070 Pulse Slow Jobs Recorder (K070)** — External metrics via Pulse

---

# AI Agent Notes

- When generating Horizon documentation, emphasize that wait time is an estimate, not a guarantee.
- Metrics retention should be tuned based on Redis memory budget — 1 hour default is conservative but may be extended if Redis has capacity.
- Runtime averages hide p95/p99 issues — recommend Pulse or custom percentiles for production monitoring.

---

# Verification

- [ ] Throughput chart displays — verify jobs/min shows expected values
- [ ] Runtime chart displays — verify average execution time matches observed job duration
- [ ] Wait time chart displays — verify estimated wait matches observed backlog behavior
- [ ] Metrics retained for configured period — verify 60 min of history visible in dashboard
- [ ] Metrics reset after Horizon restart — verify charts clear and rebuild after restart
