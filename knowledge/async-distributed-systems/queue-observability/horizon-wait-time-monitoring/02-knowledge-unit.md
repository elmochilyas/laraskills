# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Observability
Knowledge Unit: Horizon Wait Time Monitoring and Alerts
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Horizon wait time is the duration a job spends in the queue before a worker starts processing it. This metric — available through Horizon's metrics dashboard and its underlying Redis data — is the single most important indicator of queue health. Rising wait times signal that workers cannot keep pace with dispatch volume, that worker processes are saturated, or that worker recycling is causing processing gaps. Monitoring wait time and setting alerts on its deviation is more actionable than monitoring queue depth alone.

# Core Concepts
- **Wait time**: Wall-clock time between when a job is pushed to Redis and when it is popped by a worker for processing. This excludes job execution time.
- **Queue depth vs. wait time**: Depth counts queued items; wait time measures how long items actually wait. A shallow queue with slow workers can have high wait times. A deep queue with fast workers can have low wait times.
- **Horizon metrics**: Horizon collects and stores per-queue metrics in Redis using `HORIZON_METRICS_KEY` — a sorted set keyed by queue name with throughput and runtime data.
- **Metrics collection interval**: Horizon collects metrics on a configurable interval (default: 1 minute), computing average wait time, throughput, and runtime for each queue.
- **Wait time calculation**: Horizon estimates wait time by dividing queue depth by the moving average throughput — `wait_time = depth / (throughput_per_minute / 60)`.
- **Alerting trigger**: A significant increase in wait time deviation from baseline indicates a problem. Sudden spikes suggest worker failures; gradual increases suggest capacity issues.

# Mental Models
- **Emergency room triage**: Wait time is the time from patient arrival (job dispatch) to seeing a doctor (worker processing). Queue depth is the number of patients in the waiting room. A few critical patients (high-depth) are fine if there are enough doctors (workers). Wait time tells you the real patient experience.
- **Supermarket checkout**: Queue depth is the number of people in line. Wait time is how long you actually stand in line. If the cashier is slow, depth is low but wait time is high. If a new cashier opens, depth drops but wait time drops faster.
- **Traffic jam**: Queue depth is the number of cars waiting. Wait time is the delay from entering the jam to exiting it. More lanes (workers) reduce wait time; more cars (dispatch volume) increase it.

# Internal Mechanics
- Horizon's `MetricsRepository` periodically reads queue stats from Redis: `LLEN("queues:{queue}")` for depth and the `HORIZON_METRICS_KEY` sorted set for throughput history.
- Wait time is computed as `depth / throughput_rate` where `throughput_rate = total_processed_last_minute / 60`.
- Horizon stores metrics in Redis hash keys with a TTL (default: 24 hours). Each bucket contains count, min, max, and average values for runtime and wait time.
- The Horizon dashboard displays wait time in real-time per queue, with sparkline trends showing the last 15 minutes, 1 hour, and 8 hours.
- `horizon:snapshot` Artisan command generates metrics snapshots consumed by the dashboard. This command runs on a schedule defined in the Horizon config.
- For wait time alerts, Horizon itself does not have built-in alerting — you must use external tools (PagerDuty, Slack webhooks, Laravel Pulse) that poll Horizon's metrics data or Redis directly.

# Patterns
## Baseline Wait Time Monitoring
- **Purpose**: Establish normal wait time ranges per queue and alert on deviation.
- **Benefits**: Detects capacity issues before queue depth grows uncontrollably.
- **Tradeoffs**: Requires historical data to establish baseline. Seasonal patterns can trigger false positives.

## Worker Capacity Planning
- **Purpose**: Use wait time trends to determine when to add or remove worker processes.
- **Benefits**: Data-driven scaling decisions instead of guesswork.
- **Tradeoffs**: Wait time is lagging — by the time it increases, users are already experiencing delays.

## Connection-Level Wait Time Comparison
- **Purpose**: Compare wait times across different queue connections (Redis, SQS) for the same job types.
- **Benefits**: Identifies driver-specific bottlenecks or configuration issues.
- **Tradeoffs**: Requires multiple Horizon instances or custom metric collection.

# Architectural Decisions
- Monitor wait time per queue, not globally. Each queue has different throughput and acceptable latency characteristics.
- Set warning thresholds at 2x baseline and critical thresholds at 5x baseline for each queue.
- Use Redis's `MONITOR` command sparingly for wait time debugging — it impacts Redis performance. Use Horizon's metrics instead for production monitoring.
- For high-throughput queues, enable Horizon's auto-balancing mode which dynamically adjusts worker allocation to minimize wait time variance between queues.

# Tradeoffs
Wait time is a direct user-experience metric | Requires historical baseline for meaningful alerting
Horizon provides real-time dashboard visibility | No built-in alerting — requires external integration
Works across all queue backends supported by Horizon | Only available with Horizon (Redis driver)
Complements queue depth monitoring | Throughput-based estimation is an approximation, not exact

# Performance Considerations
- Horizon metrics collection runs in a separate process (`horizon:snapshot`) — minimal overhead on queue performance.
- Redis memory usage for metrics storage: each queue's metrics bucket uses a Redis hash. At default TTL of 24 hours and 1-minute intervals, each queue uses approximately 1KB per day of metrics storage.
- The `LLEN` command for depth check is O(1) and does not block Redis.
- Frequent alert polling from external systems that query Horizon's Redis directly can increase Redis load. Cache alert check results for 30-60 seconds.

# Production Considerations
- Run `horizon:snapshot` every minute via the scheduler for real-time wait time visibility.
- Archive Horizon metrics to a persistent store (PostgreSQL, InfluxDB) for long-term trend analysis and capacity planning.
- Set up external monitoring to query Horizon's Redis metrics and alert on wait time thresholds. Use Prometheus + Grafana or a similar stack for production-grade alerting.
- When wait time spikes, investigate in this order: 1) Are workers running? 2) Has dispatch volume increased? 3) Have workers been restarted recently? 4) Is Redis experiencing latency?

# Common Mistakes
- **Monitoring depth instead of wait time**: Depth is a lagging indicator and does not reflect actual processing delay. A queue with 10,000 jobs that processes 10,000 jobs/second has zero wait time.
- **Ignoring wait time variance**: Consistent wait time with high variance is worse than consistently high wait time — unpredictable delays are harder to manage.
- **Setting static thresholds**: Wait time baselines change with traffic patterns. Use dynamic baselines (e.g., rolling 7-day average) instead of fixed values.
- **Not distinguishing between queue types**: Critical queues (password resets, payments) need sub-second wait times. Batch processing queues can tolerate minutes of wait time.

# Failure Modes
- **Worker crash cascade**: One worker crashes, reducing capacity. Wait time rises. The remaining workers process jobs but also handle the crashed worker's queue, increasing memory pressure. More workers crash. Mitigation: auto-recovery via Supervisor and process health monitoring.
- **Redis latency spike**: Network or hardware issue causes Redis latency to increase. Queue operations slow down across all workers. Workers spend more time on Redis calls than on job processing. Mitigation: separate queue Redis from cache Redis, monitor Redis latency.
- **Algorithmic slow-down dip**: Wait time decreases because workers are processing jobs so fast that the throughput rate increases, but actual user experience may be worse if fast processing comes from skipping work or errors. Mitigation: correlate wait time with job success rate.

# Ecosystem Usage
- **Laravel Horizon**: Wait time monitoring is built into Horizon's metrics system. Data is accessible via API endpoints and the dashboard.
- **Laravel Pulse**: Pulse can be configured to capture custom metrics, including Horizon wait time, for a complementary view in the Pulse dashboard.
- **External monitoring**: Tools like Oh Dear, Laravel Cloud, and custom Prometheus exporters can consume Horizon Redis metrics for alerting.

# Related Knowledge Units
- K070 Pulse SlowJobs Recorder (job execution duration observability) | K072 Custom Pulse Recorders (extending Pulse for queue depth) | K047 Horizon Metrics (Horizon metrics architecture)

# Research Notes
Wait time is the single most actionable queue health metric because it directly measures the user-facing impact of queue performance. Horizon's wait time calculation (depth / throughput rate) is an approximation that works well for steady-state traffic but can be misleading during sudden traffic spikes — the instantaneous wait time may be higher than the calculated value. For burst-sensitive applications, supplement Horizon's calculation with direct Redis queue monitoring using `LLEN` and time-stamped job entries.

## Research Notes
- Laravel Pulse provides real-time monitoring of queue throughput, job duration, and failure rates via custom recorders — the Pulse::record() method stores metrics in an in-memory buffer flushed to the database every 10 seconds.
- Custom Pulse recorders for queue monitoring can capture per-queue depth, worker utilization, and processing latency — these metrics are visualized on a configurable Pulse dashboard.
- Horizon's wait time monitoring calculates the interval between job dispatch and processing start — this is the most important metric for identifying queue backlogs and worker under-provisioning.
- The queue:monitor Artisan command in Laravel 12 provides CLI-based queue health checks, reporting queue depth, oldest job age, and processing throughput.
- Grafana dashboards for Laravel queues typically combine Horizon metrics (via Redis), application logs (via Loki/Elasticsearch), and infrastructure metrics (CPU, memory) for comprehensive observability.
- Alerting on queue health should use multiple dimensions: queue depth growth rate (backlog), oldest job age (starvation), failure rate spike (processing errors), and worker count (under-provisioning).
- Distributed tracing (OpenTelemetry) can be applied to queued jobs by propagating trace context through job payloads — this enables end-to-end tracing from HTTP request through queued job execution.
- Community tooling around queue observability is evolving rapidly, with packages like spatie/ray and custom Pulse recorders providing debugging tools beyond built-in monitoring.
