# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Observability
Knowledge Unit: Custom Pulse Recorders for Queue Depth
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Custom Pulse recorders extend Laravel Pulse's monitoring capabilities beyond its built-in recorders by capturing application-specific metrics and feeding them into Pulse's aggregation and dashboard pipeline. For queue observability, custom recorders can monitor queue depth, worker saturation, Redis memory usage, job deserialization failures, and other queue-specific indicators that Pulse's built-in SlowJobs recorder does not cover. The recorder pattern involves implementing Pulse's `Recorder` interface, defining ingestion logic, and creating a dashboard component.

# Core Concepts
- **Recorder interface**: A Pulse recorder implements `Laravel\Pulse\Recorders\Concerns\Recorder` (or the `Recorder` contract) which defines `register()`, `record()`, and `get()` methods.
- **register()**: Binds event listeners. For queue depth monitoring, this would listen to a scheduler event or a custom interval trigger.
- **record()**: The ingestion method that samples the metric and writes it to Pulse storage via `Pulse::record()`.
- **get()**: Queries aggregated Pulse data for the dashboard. Receives a `$bucket` parameter for time-windowed queries.
- **Pulse::record()**: The core ingestion method — takes a `$type`, `$key`, `$value`, and optional `$timestamp`. Pulse aggregates values with the same `$type` and `$key` within each time bucket.
- **Dashboard component**: A Livewire component that displays the recorder's data on the Pulse dashboard. Must be registered in `config/pulse.php` and deployed as a Blade view.
- **Sampling vs. streaming**: Recorders can sample metrics on a schedule (e.g., read queue depth every 30 seconds) or stream them from events (e.g., record on every job dispatch). Scheduled sampling is preferred for queue depth to avoid per-event overhead.

# Mental Models
- **Custom dashboard instrument**: The built-in Pulse recorders are like the standard gauges on a car's dashboard. Custom recorders let you add aftermarket gauges — oil pressure, turbo boost, air-fuel ratio — specific to your engine's (application's) needs.
- **Bespoke health monitor**: Like a hospital adding custom vital-sign monitors for specific conditions (e.g., a cardiac monitor in the ICU), custom Pulse recorders let you monitor the metrics that matter to your specific application's health.
- **Factory floor sensor**: You install a sensor (recorder) on a specific machine (queue backend) that reports a specific reading (queue depth) at regular intervals. The data feeds into the central monitoring board (Pulse dashboard).

# Internal Mechanics
- A custom recorder class is registered in `config/pulse.php` under `recorders`. Pulse instantiates recorders and calls `register()` during boot.
- For queue depth monitoring, `register()` typically binds a listener to `ScheduledTaskFinished` or uses `Pulse::heartbeat()` with a custom interval callback.
- Inside the `record()` method, the recorder calls `Redis::llen("queues:{$queueName}")` for each monitored queue and passes the result to `Pulse::record('queue_depth', $queueName, $depth)`.
- Pulse aggregates calls to `Pulse::record()` by `$type` and `$key` within each time bucket (default: 1 hour). For each bucket, Pulse stores `count`, `min`, `max`, `avg`, and a sample of raw values.
- The `get()` method on the recorder queries Pulse's aggregation store: `Pulse::aggregate('queue_depth', ['max', 'avg'], $bucket)` — returning the maximum and average depth per queue for the given time window.
- The dashboard Livewire component calls `$this->record->get($this->bucket)` and passes the result to a Blade view for rendering.
- Custom dashboard cards must be registered in `config/pulse.php` under `dashboard.cards` and published to `resources/views/vendor/pulse/dashboard.blade.php`.

# Patterns
## Queue Depth Recorder
- **Purpose**: Monitor the depth of each named queue over time.
- **Benefits**: Identify growing backlogs before they impact users. Correlate depth with dispatch volume and worker capacity.
- **Tradeoffs**: Depth is a snapshot — between sampling intervals, depth may spike and recover unobserved.

## Failed Jobs Recorder (Beyond Horizon)
- **Purpose**: Track failed job counts per job class per time bucket.
- **Benefits**: Complements Horizon's real-time failed job list with historical aggregation and trend analysis.
- **Tradeoffs**: Pulse aggregates by class, not by individual failure — cannot dive into specific failure details from Pulse alone.

## Worker Saturation Recorder
- **Purpose**: Monitor the ratio of busy workers to total workers per queue.
- **Benefits**: Detect when worker processes are fully saturated, indicating the need to scale out workers.
- **Tradeoffs**: Requires access to Supervisor or Horizon process status — more complex to implement than queue depth.

# Architectural Decisions
- Use scheduled sampling (e.g., every 30 seconds via Laravel's scheduler) for queue depth monitoring rather than event-driven recording. Event-driven recording for queue depth would fire on every job dispatch/release, generating excessive Pulse writes.
- Store queue depth as a `gauge` type metric — Pulse supports `count`, `avg`, `min`, `max` aggregations. Depth is naturally a gauge; record the instantaneous value at each sample.
- Name the recorder type with a unique prefix to avoid collisions with built-in Pulse recorders (e.g., `custom_queue_depth` instead of `queue_depth`).
- Register the custom dashboard card in a separate service provider that conditionally loads in environments where Pulse is enabled.

# Tradeoffs
Captures metrics specific to your application | Requires custom code — not maintained by the Pulse team
Full control over sampling frequency and aggregation | Dashboard UI is custom — must design your own card
Integrates with Pulse's existing alerting and storage | Pulse's aggregation model (time-bucketed) may not suit all metrics
No dependency on external monitoring services | Still requires Pulse infrastructure (database, Scheduler)

# Performance Considerations
- Scheduled samples reduce Pulse write pressure compared to event-driven recording. At 30-second intervals and 10 queues, that is 20 writes per minute to Pulse storage.
- Redis `LLEN` is O(1) and does not block or impact Redis performance.
- The Livewire dashboard components hydrate on every Pulse dashboard page load. Keep queries efficient — retrieve only the last 1-2 hours of aggregated data for display.
- If monitoring many queues, batch the `Pulse::record()` calls into a single `Pulse::record()` call per type by passing an array of keys and values.

# Production Considerations
- Register custom recorders only in environments where Pulse is installed and configured. Use environment checks or conditional service providers.
- Test the recorder's `record()` method independently of the Pulse dashboard — verify that data flows into Pulse storage correctly before building the dashboard card.
- Set appropriate TTL for custom metric types. Pulse's default TTL applies to all types; custom types may need different retention.
- Cache the dashboard component's data for 10-30 seconds to reduce load on Pulse storage for frequently accessed dashboard pages.

# Common Mistakes
- **Recording too frequently**: Pulse is not designed for sub-second recording granularity. Use 15-60 second intervals for queue depth.
- **Not handling Redis connection failures**: The recorder should gracefully handle Redis being unavailable — queue depth is not critical enough to crash Pulse.
- **Forgetting to register the dashboard card**: The recorder collects data fine, but without the dashboard card, the data is invisible to operators.
- **Using recorder for individual job-level events**: Recorders are for aggregated, time-bucketed data. For per-job monitoring, use events and listeners instead.
- **Hardcoding queue names**: Read queue names from config or Horizon configuration. Hardcoding creates maintenance burden when queue topology changes.

# Failure Modes
- **Recorder crashes Pulse**: An unhandled exception in a custom recorder can crash Pulse's recording pipeline. Wrap recorder logic in try-catch and log errors without rethrowing.
- **Misleading depth data**: Sampling every 60 seconds can miss short-lived depth spikes. A job dispatch burst that resolves in 10 seconds is invisible. Mitigation: complement with Horizon's real-time metrics.
- **Dashboard card rendering issues**: A malformed Blade view or missing Livewire component registration causes the Pulse dashboard to fail silently or render a blank card. Test the card independently.

# Ecosystem Usage
- **Laravel Pulse**: The custom recorder extends Pulse's architecture. Recorders are first-class citizens — Pulse is designed to be extensible via this interface.
- **Livewire**: Pulse dashboard cards are Livewire components. Custom cards require familiarity with Livewire and Alpine.js for interactive elements.

# Related Knowledge Units
- K070 Pulse SlowJobs Recorder (built-in recorder pattern) | K071 Horizon Wait Time Monitoring (complementary metrics source) | K047 Horizon Metrics (Horizon's built-in metrics vs custom Pulse recorders)

# Research Notes
Custom Pulse recorders are underutilized in the Laravel ecosystem. The built-in SlowJobs recorder covers only one dimension of queue observability. Queue depth, worker saturation, job deserialization errors, Redis memory usage, and per-queue throughput are equally important and straightforward to implement as custom recorders. The key design decision is sampling frequency — too frequent and Pulse storage fills; too infrequent and spikes are missed. A 15-30 second interval with 10-queue monitoring provides a good balance. The aggregation model (time-bucketed min/max/avg) is well-suited for capacity planning and trend analysis but less useful for real-time debugging.

## Research Notes
- Laravel Pulse provides real-time monitoring of queue throughput, job duration, and failure rates via custom recorders — the Pulse::record() method stores metrics in an in-memory buffer flushed to the database every 10 seconds.
- Custom Pulse recorders for queue monitoring can capture per-queue depth, worker utilization, and processing latency — these metrics are visualized on a configurable Pulse dashboard.
- Horizon's wait time monitoring calculates the interval between job dispatch and processing start — this is the most important metric for identifying queue backlogs and worker under-provisioning.
- The queue:monitor Artisan command in Laravel 12 provides CLI-based queue health checks, reporting queue depth, oldest job age, and processing throughput.
- Grafana dashboards for Laravel queues typically combine Horizon metrics (via Redis), application logs (via Loki/Elasticsearch), and infrastructure metrics (CPU, memory) for comprehensive observability.
- Alerting on queue health should use multiple dimensions: queue depth growth rate (backlog), oldest job age (starvation), failure rate spike (processing errors), and worker count (under-provisioning).
- Distributed tracing (OpenTelemetry) can be applied to queued jobs by propagating trace context through job payloads — this enables end-to-end tracing from HTTP request through queued job execution.
- Community tooling around queue observability is evolving rapidly, with packages like spatie/ray and custom Pulse recorders providing debugging tools beyond built-in monitoring.
