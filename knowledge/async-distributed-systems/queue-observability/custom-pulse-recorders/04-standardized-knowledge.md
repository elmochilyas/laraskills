# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Observability
- **Knowledge Unit:** K072 — Custom Pulse Recorders for Queue Depth
- **Knowledge ID:** K072
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Pulse: Custom Recorders
  - Laravel Source — `Laravel\Pulse\Recorders\Concerns\Recorder`

---

# Overview

Custom Pulse recorders extend monitoring beyond built-in recorders by capturing application-specific metrics into Pulse's aggregation pipeline. For queue observability, custom recorders can monitor queue depth, worker saturation, Redis memory, job deserialization failures, and other indicators Pulse's built-in SlowJobs recorder doesn't cover. The pattern involves implementing the `Recorder` interface (`register()`, `record()`, `get()`) and creating a Livewire dashboard component.

---

# Core Concepts

- **`register()`:** Binds event listeners. For queue depth: listen to `ScheduledTaskFinished` or use a custom interval.
- **`record()`:** Samples the metric, calls `Pulse::record($type, $key, $value)`.
- **`get()`:** Queries aggregated data: `Pulse::aggregate($type, ['max', 'avg'], $bucket)`.
- **`Pulse::record()`:** Core ingestion — Pulse aggregates same-type/same-key values within time buckets.
- **Dashboard component:** Livewire component registered in `config/pulse.php`, deployed as Blade view.
- **Sampling vs streaming:** Scheduled sampling (every 30s) for queue depth is preferred over per-event recording.

---

# When To Use

- Queue depth monitoring (not covered by built-in recorders)
- Worker saturation ratio monitoring
- Per-job-class failure rate trends
- Redis memory usage for queue data

---

# When NOT To Use

- Per-job event monitoring — use dedicated events and listeners
- Real-time debugging — Pulse's aggregation model is for trends, not live debugging
- Metrics already covered by built-in recorders (slow jobs, throughput)

---

# Best Practices

- **Use scheduled sampling (15-60 seconds) for queue depth.** Event-driven recording fires on every dispatch — too many Pulse writes. *Why: Queue depth is a gauge — reading it every 30 seconds via the scheduler provides sufficient granularity without generating thousands of writes per minute.*
- **Wrap recorder logic in try-catch.** An unhandled exception in a custom recorder can crash Pulse's entire recording pipeline. *Why: Pulse runs recorders in sequence — a crash in one recorder prevents subsequent recorders from running.*
- **Register dashboard cards in a conditional service provider.** Only load when Pulse is installed. *Why: Custom dashboard cards depend on Livewire and Pulse packages — loading them unconditionally causes errors in environments without Pulse.*
- **Read queue names from config, don't hardcode.** Queue topology changes over time — hardcoded names require code changes to update. *Why: A configuration-driven approach allows ops teams to add/remove monitored queues without deploying code.*

---

# Performance Considerations

- Scheduled sampling (30s interval, 10 queues) = 20 writes/minute to Pulse storage.
- `LLEN` is O(1) — doesn't impact Redis.
- Dashboard Livewire queries should retrieve only last 1-2 hours of data.
- Batch multiple `Pulse::record()` calls into one when recording many keys.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Recording too frequently (sub-second) | Pulse not designed for this | Storage fills rapidly | Use 15-60s intervals |
| Not handling Redis failures | Recorder assumes Redis always up | Recorder crash takes down Pulse | Wrap in try-catch |
| Hardcoding queue names | Copy-paste config | Maintenance burden on topology change | Read from config |
| No dashboard card registered | Forgetting registration | Data collected but invisible | Register in config/pulse.php |

---

# Examples

```php
class QueueDepthRecorder
{
    public function register(): void
    {
        Schedule::everyThirtySeconds()->call(fn () => $this->record());
    }

    public function record(): void
    {
        foreach (config('queue.queues') as $queue) {
            $depth = Redis::llen("queues:{$queue}");
            Pulse::record('queue_depth', $queue, $depth);
        }
    }

    public function get(string $bucket): array
    {
        return Pulse::aggregate('queue_depth', ['max', 'avg'], $bucket);
    }
}
```

---

# Related Topics

- **K070 Pulse SlowJobs Recorder (K070)** — Built-in recorder pattern
- **K071 Horizon Wait Time (K071)** — Complementary metrics
