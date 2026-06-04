# Metadata
Domain: Async & Distributed Systems
Subdomain: Horizon Scaling & Monitoring
Knowledge Unit: Horizon Metrics (Throughput, Runtime, Wait Time)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Horizon collects and displays three core metrics per queue: **throughput** (jobs processed per minute), **runtime** (average job execution time in milliseconds), and **wait time** (estimated seconds before a newly queued job will be processed). These metrics are stored in Redis as snapshots with configurable retention. They power the dashboard charts and inform the auto-balancing algorithm. Understanding what each metric actually measures — and its limitations — is critical for using Horizon data for operational decisions.

# Core Concepts
- **Throughput**: Number of jobs completed per minute for a given queue. Rolling window.
- **Runtime**: Average time from job start to job completion (or failure). Includes middleware time.
- **Wait time**: Estimated time a new job will wait before processing. Derived from queue depth × average runtime / worker count.
- **Metrics retention**: Configurable via `horizon.metrics` (trim, keep). Default: keep snapshots for 1 hour.
- **Snapshot interval**: Metrics are aggregated into snapshots at a regular interval (configurable).
- **Redis storage**: Metrics stored as Redis sorted sets keyed by `horizon:metrics:{type}:{queue}`.

# Mental Models
- **Car dashboard**: Throughput = speedometer (how fast). Runtime = trip average (efficiency). Wait time = ETA (when you'll arrive).
- **Hospital metrics**: Throughput = patients discharged per hour. Runtime = average treatment duration. Wait time = ER wait time based on queue length and doctor availability.

# Internal Mechanics
- Monitoring snapshots are collected by the Horizon master process at regular intervals via `Snapshot` classes.
- `WorkloadSnapshot`: captures queue depth and wait time per supervisor.
- `ProcessSnapshot`: captures worker process state (busy, idle, total).
- Throughput is computed from the number of jobs completed in the snapshot interval.
- Runtime is computed from the average of individual job runtimes recorded by workers.
- Wait time is computed: `(queue_size * average_runtime) / active_workers`.
- Snapshots are stored in Redis as sorted sets (time-series). Old snapshots are trimmed via `horizon:snapshot` command or automatic trimming.
- Dashboard reads these sorted sets and renders charts via time-series queries.

# Patterns
## Throughput Trend Analysis
- **Purpose**: Identify whether throughput is increasing (scale needed) or decreasing (issue).
- **Benefit**: Proactive capacity planning.
- **Tradeoff**: Metrics retention is limited (1 hour default). Longer trends require external storage.

## Runtime Anomaly Detection
- **Purpose**: Detect when job execution time spikes unexpectedly.
- **Benefit**: Identify jobs that are slowing down due to external dependencies.
- **Tradeoff**: Averages mask individual slow jobs; need percentile-based metrics for precision.

## Wait Time-Based Scaling Decisions
- **Purpose**: Use wait time to decide when to add supervisors or workers.
- **Benefit**: Objective metric for capacity decisions.
- **Tradeoff**: Wait time is an estimate based on average runtime, which may not reflect reality for variable-duration jobs.

# Architectural Decisions
- **Use metrics for reactive scaling**: Wait time > N for > 5 minutes → auto-scaling group adds server.
- **Use runtime for performance regression detection**: Deploy new code → runtime increases 3x → rollback.
- **Use throughput for capacity planning**: Jobs per hour growing 10% month-over-month → plan infrastructure.
- **Don't use metrics for real-time alerting**: Metrics are snapshots, not real-time. Use event-based alerting for failure scenarios.

# Tradeoffs
Throughput metric | Objective, trend-able | Snapshot-based; 1-minute granularity
Runtime (average) | Easy to understand | Average hides outliers; median or p95 would be better
Wait time estimate | Useful for capacity planning | Based on average runtime; inaccurate for variable jobs

# Performance Considerations
- Metrics collection runs in Horizon master process, not in workers. Minimal overhead.
- Redis sorted set writes for metrics: ~1-10KB per snapshot per queue. Negligible.
- Dashboard queries: reading last 60 minutes of metrics from Redis sorted sets. Fast (<100ms).
- Long retention (hours) increases Redis memory usage for metrics keys.
- High queue count (100+ supervisors) increases the number of metrics keys proportionally.

# Production Considerations
- Horizon metrics are in-memory (Redis). They are lost if Redis is flushed or Horizon restarted (snapshots are not persisted).
- External metrics export: Horizon does NOT natively export metrics to Prometheus, DataDog, etc. Use Pulse or custom metric collection for long-term retention.
- Metrics may be misleading during Horizon restarts. Wait time shows 0 immediately after restart because there's no runtime data.
- The runtime metric is an arithmetic mean. A single outlier job (10s vs 100ms normal) skews the average significantly.
- Queue depth (from horizon dashboard) is distinct from wait time — depth is absolute count; wait time incorporates processing speed.

# Common Mistakes
- **Treating wait time as a precise SLA metric**: Wait time is an estimate, not a guarantee. It's based on average runtime, which may not hold for the specific jobs in the queue.
- **Relying on runtime average for performance decisions**: Averages hide outliers. Use p95 or p99 for performance-sensitive monitoring.
- **Not extending metrics retention for trend analysis**: Default 1 hour retention is too short for weekly/monthly trends. Export to external storage.
- **Assuming metrics are real-time**: Metrics are snapshots collected every ~10 seconds. There's a lag between an event and its metric appearance.

# Failure Modes
- **Metrics drift after horizon restart**: All metrics reset to zero. Wait time shows 0 until runtime data accumulates. Takes ~5-10 minutes to stabilize.
- **Stale metrics after supervisor crash**: A crashed supervisor stops reporting metrics. Its queues show 0 throughput until the supervisor restarts.
- **Runtime average hiding p95 issues**: 99% of jobs take 100ms, 1% take 10s. Average is ~200ms (looks fine). Reality: 1% of users wait 10s.
- **Metrics vs reality divergence**: If queue depth is 10K but all jobs are delayed (no workers for a specific queue), wait time calculation gives infinite/undefined. Display artifacts.

# Ecosystem Usage
- **Laravel Horizon**: Metrics are built into the dashboard. No external service required.
- **Laravel Pulse**: Provides complementary metrics with longer retention (database-backed). SlowJobs recorder and queue throughput.
- **Spatie packages**: Not directly related, but Spatie package users rely on Horizon metrics for operational monitoring.

# Related Knowledge Units
- K048 Horizon Notifications (metrics-based alerts) | K071 Horizon Wait Time Monitoring (wait time specifically)

## Research Notes
- Horizon's auto-balancing mode uses a scoring algorithm that reassigns worker processes between queues every few seconds — the scoring considers queue backlog depth and processing time to determine worker allocation.
- The alance:auto strategy in Horizon implements a "min/max" approach where each supervisor has a configured minProcesses and maxProcesses — the balancer adjusts within this range based on load.
- Horizon v5 (Laravel 11+) improved Redis cluster support by abstracting queue connections through a consistent hashing layer — jobs are distributed across cluster nodes based on job ID hash.
- The Horizon dashboard authorization gate can be customized via Horizon::auth() — exposing the dashboard without authentication in production is a common security gap.
- Horizon metrics (throughput, runtime, wait time) are stored in Redis with a retention period configured via 	rim — long retention can consume significant Redis memory in high-throughput environments.
- The horizon:snapshot command generates a work-in-progress report of all supervisors, processes, and queue metrics — useful for debugging queue backlogs during incidents.
- Silenced job tags in Horizon prevent specific job types from appearing in the "Completed Jobs" and "Failed Jobs" lists — this is a display-only filter that does not affect job processing or logging.
- Horizon's queue:monitor integration was added in Laravel 12 — it provides a Pulse integration for queue health dashboards beyond Horizon's own UI.
