# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Observability
Knowledge Unit: Laravel Pulse SlowJobs Recorder
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
The Laravel Pulse `SlowJobs` recorder captures and surfaces jobs that exceed a configurable execution duration threshold. It monitors all dispatched jobs through Pulse's event-driven ingestion pipeline, recording job class, queue name, connection, duration, and execution time. This provides a continuous, real-time view of slow job execution that would otherwise only be visible through manual log inspection or ad-hoc monitoring queries.

# Core Concepts
- **Slow job threshold**: A configurable duration (default: 1000ms) in the Pulse configuration. Any job taking longer than this is recorded as slow.
- **Ingestion pipeline**: Pulse records data through an event-driven pipeline — `JobAttemptStarted` and `JobAttemptFinished` events are captured and aggregated.
- **Aggregation**: Slow job data is aggregated into time buckets (default: 1 hour) by job class. Pulse records the count, minimum, maximum, and average durations.
- **Dashboard card**: The Slow Jobs card in the Pulse dashboard displays a list of slowest job classes with recent occurrence counts and duration statistics.
- **Historical retention**: Pulse retains aggregated data based on its storage configuration. Raw slow job events are not stored — only aggregated statistics.
- **Global scope**: The recorder observes all jobs on all queues by default. Jobs can be excluded via `ignore_after` callbacks or configuration.

# Mental Models
- **Air traffic control radar**: Pulse is ATC radar, tracking every flight (job). SlowJobs is the system that highlights aircraft that are moving too slow — the ones that might cause a traffic jam.
- **Factory floor stopwatch**: A manager walks the factory floor with a stopwatch. Any worker (job) taking longer than the standard time gets flagged for review. Pulse SlowJobs is the automated stopwatch.
- **Health screening**: Pulse performs a quick health screen on every job. If a job's duration is in the 95th percentile, it gets flagged. SlowJobs surfaces these outliers for investigation.

# Internal Mechanics
- The `SlowJobs` recorder implements Pulse's `Recorder` interface and registers listeners for `JobAttemptStarted` and `JobAttemptFinished` events.
- When a job finishes, the recorder computes `microtime(true) - $startTime` from the event data.
- If the duration exceeds the configured threshold, the recorder calls `Pulse::record()` to write an entry to Pulse's storage.
- The entry includes: job class FQCN, queue name, connection name, duration in milliseconds, and a timestamp.
- Pulse's storage engine (database or Redis) aggregates these entries into time-bucketed statistics.
- The aggregation groups by job class within each time bucket, computing `count`, `min`, `max`, `avg`, and sampling the most recent occurrences.
- The Pulse dashboard card queries the aggregated data and renders a sorted table by count or max duration.
- `ignore_after` callback: a closure that receives the `$event` and returns true if the job should be excluded from slow job recording. Useful for filtering noisy jobs.

# Patterns
## Threshold-Based Alerting
- **Purpose**: Flag jobs exceeding a duration threshold for investigation.
- **Benefits**: Low signal-to-noise ratio — only actionable outliers are surfaced.
- **Tradeoffs**: Threshold is global across all job classes. A 5-second report generation job is not slow; a 500ms password reset job is.

## Per-Job-Class Thresholds
- **Purpose**: Different thresholds for different job classes.
- **Benefits**: Avoids false positives for naturally long-running jobs.
- **Tradeoffs**: Pulse does not natively support per-class thresholds — requires custom implementation or middleware.

## Slow Job Trend Analysis
- **Purpose**: Track slow job occurrences over time to identify degradation patterns.
- **Benefits**: Detect when a job starts slowing down progressively, indicating a performance regression.
- **Tradeoffs**: Pulse aggregates by hour — sub-hour trends are invisible.

# Architectural Decisions
- Set the slow job threshold based on the 95th percentile of all job durations in production. Use initial monitoring data to calibrate.
- Use `ignore_after` to exclude known long-running jobs (e.g., report generation, batch email sending) that are expected to exceed the threshold.
- Configure Pulse's storage retention to keep slow job data long enough to identify trends (minimum 7 days, recommended 30 days).
- Do not rely solely on Pulse for slow job monitoring in high-throughput systems. Pulse aggregates data — complement with raw job duration logging for drill-down analysis.

# Tradeoffs
Zero-configuration monitoring — works out of the box | Single global threshold — cannot tune per job class
Aggregated storage is efficient | No raw event storage — cannot drill into individual slow executions
Pulse dashboard is real-time | Data is sampled — not every slow job is guaranteed to be captured at high volume
Integrates with Pulse alerting | Requires Pulse infrastructure (database, queue for Pulse itself)

# Performance Considerations
- Pulse's event ingestion adds sub-millisecond overhead per job via the event listener.
- Aggregated writes are batched and throttled — Pulse writes to storage on a configurable interval (default: 1 second), not per-event.
- The SlowJobs recorder only writes data when a job exceeds the threshold. Low-threshold configurations (e.g., 100ms) will generate more writes.
- Database-backed Pulse storage: the `pulse_aggregations` table grows with the number of unique job classes per time bucket. Prune periodically.

# Production Considerations
- Monitor Pulse's own performance — if Pulse is recording too many slow jobs, its own ingestion can become a bottleneck.
- Use `ignore_after` aggressively for high-frequency, expected-slow jobs to reduce noise and storage.
- Combine Pulse SlowJobs with external monitoring (Datadog, New Relic) for cross-referencing. Pulse is a diagnostic tool, not a complete observability solution.
- Calibrate the threshold after deployment: start high (2-3 seconds), then lower as you tune.

# Common Mistakes
- **Setting threshold too low**: A 200ms threshold will flag every job with network latency. The dashboard becomes noise. Start high and tune down.
- **Not ignoring known slow jobs**: Report generation, file processing, and batch jobs will always exceed the threshold. Use `ignore_after` to exclude them.
- **Relying on Pulse for real-time alerting**: Pulse aggregates on a delay (1-60 seconds). For real-time alerting, use a dedicated monitoring solution.
- **Confusing slow jobs with failed jobs**: A slow job is not necessarily failing — it may be processing correctly but inefficiently. Slow and failed are separate dimensions.

# Failure Modes
- **Pulse storage saturation**: At very high throughput with a low threshold, Pulse's storage may fill with slow job entries faster than pruning can clean them. Mitigation: raise threshold or increase pruning frequency.
- **Missed slow jobs due to sampling**: At high throughput, Pulse may sample events and miss slow jobs. Mitigation: reduce sampling rate or use dedicated monitoring for critical jobs.
- **Noisy threshold hides real issues**: Too many false positives train the team to ignore the SlowJobs card. Mitigation: tune threshold aggressively and use `ignore_after`.

# Ecosystem Usage
- **Laravel Pulse**: The SlowJobs recorder is one of several built-in recorders. It integrates with Pulse's alerting system for threshold-based notifications.
- **Laravel Horizon**: While Horizon shows real-time job status, Pulse SlowJobs provides historical aggregation that Horizon lacks.

# Related Knowledge Units
- K071 Horizon Wait Time Monitoring (complementary observability dimension) | K072 Custom Pulse Recorders (extending Pulse for queue depth)

# Research Notes
The Pulse SlowJobs recorder fills a gap between Horizon (real-time per-job status) and external APM (full distributed tracing). It is intentionally simple — a single threshold, aggregated storage, a dashboard card. This simplicity makes it effective for identifying obvious performance problems but insufficient for deep diagnostics. Treat it as the first line of defense in queue observability, complemented by Horizon metrics and external monitoring for full coverage.

## Research Notes
- Laravel Pulse provides real-time monitoring of queue throughput, job duration, and failure rates via custom recorders — the Pulse::record() method stores metrics in an in-memory buffer flushed to the database every 10 seconds.
- Custom Pulse recorders for queue monitoring can capture per-queue depth, worker utilization, and processing latency — these metrics are visualized on a configurable Pulse dashboard.
- Horizon's wait time monitoring calculates the interval between job dispatch and processing start — this is the most important metric for identifying queue backlogs and worker under-provisioning.
- The queue:monitor Artisan command in Laravel 12 provides CLI-based queue health checks, reporting queue depth, oldest job age, and processing throughput.
- Grafana dashboards for Laravel queues typically combine Horizon metrics (via Redis), application logs (via Loki/Elasticsearch), and infrastructure metrics (CPU, memory) for comprehensive observability.
- Alerting on queue health should use multiple dimensions: queue depth growth rate (backlog), oldest job age (starvation), failure rate spike (processing errors), and worker count (under-provisioning).
- Distributed tracing (OpenTelemetry) can be applied to queued jobs by propagating trace context through job payloads — this enables end-to-end tracing from HTTP request through queued job execution.
- Community tooling around queue observability is evolving rapidly, with packages like spatie/ray and custom Pulse recorders providing debugging tools beyond built-in monitoring.
