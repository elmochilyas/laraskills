# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Observability
- **Knowledge Unit:** K070 — Laravel Pulse SlowJobs Recorder
- **Knowledge ID:** K070
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Pulse: Slow Jobs
  - Laravel Source — `Laravel\Pulse\Recorders\SlowJobs`

---

# Overview

Laravel Pulse's `SlowJobs` recorder captures jobs exceeding a configurable duration threshold. It monitors all dispatched jobs through Pulse's event-driven ingestion pipeline, recording job class, queue, connection, and duration. This provides continuous real-time visibility into slow job execution that would otherwise require manual log inspection. Pulse aggregates data into time buckets rather than storing raw events.

---

# Core Concepts

- **Slow job threshold:** Configurable duration (default: 1000ms). Any job exceeding this is recorded.
- **Ingestion pipeline:** `JobAttemptStarted` and `JobAttemptFinished` events are captured and aggregated.
- **Aggregation:** Data bucketed by time (default: 1 hour) and job class — count, min, max, avg duration.
- **Dashboard card:** Displays slowest job classes with occurrence counts and duration statistics.
- **`ignore_after` callback:** Closure to exclude specific jobs from recording.

---

# When To Use

- Continuous queue performance monitoring
- Identifying performance regressions in job execution
- First line of defense in queue observability

---

# When NOT To Use

- Real-time alerting — Pulse aggregates on a delay (1-60 seconds)
- Per-job-class thresholds — Pulse only supports a single global threshold
- Drill-down into individual slow executions — Pulse stores only aggregated data

---

# Best Practices

- **Start with a high threshold (2-3 seconds) and tune downward.** A 200ms threshold flags every job with network latency — noise drowns out signal. *Why: Network calls, DB queries, and cache operations all add baseline latency. Set the threshold high enough that only genuinely slow outliers are flagged, then lower it as you tune.*
- **Use `ignore_after` aggressively for known slow jobs.** Report generation, batch file processing, and data exports will always exceed the threshold. *Why: Without filtering, expected-slow jobs generate constant noise in the dashboard — the team learns to ignore it, defeating the purpose.*
- **Treat SlowJobs as a diagnostic, not a complete observability solution.** Combine with Horizon metrics and external APM for full coverage. *Why: Pulse only shows aggregated data with a single threshold — it lacks distributed tracing, per-job-class configuration, and raw event storage needed for deep debugging.*

---

# Performance Considerations

- Event ingestion adds sub-millisecond overhead per job.
- Aggregated writes are batched — Pulse writes on configurable interval (default: 1 second), not per-event.
- Only writes when threshold is exceeded — low threshold generates more storage writes.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Threshold too low (200ms) | No calibration | Every job flagged — dashboard becomes noise | Start high, tune down |
| Not ignoring known slow jobs | Default includes all | Expected-slow jobs hide real outliers | Use `ignore_after` callback |
| Confusing slow with failed | Only checking duration | Slow job may be processing correctly | Use separate failed job monitoring |

---

# Related Topics

- **K071 Horizon Wait Time Monitoring (K071)** — Complementary metric
- **K072 Custom Pulse Recorders (K072)** — Extending Pulse
