# Octane Tick Hooks — Scheduled Callbacks Within Octane Workers

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | Laravel Octane Performance |
| Knowledge Unit | Octane Tick Hooks — Scheduled Callbacks Within Octane Workers |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Octane tick hooks allow registering callbacks that execute on a timer within each worker process. These are analogous to cron jobs but run inside the worker's event loop without requiring a separate scheduler process. Tick hooks are ideal for periodic tasks that are lightweight, worker-scoped, and benefit from running in the persistent application context — cache warming, connection health checks, metrics aggregation, and garbage collection.

## Core Concepts

- **`Octane::tick()`**: Registers a callback that runs every N seconds within each worker. Syntax: `Octane::tick('name', fn () => ..., seconds: 60)`.
- **Worker-scoped execution**: Each worker runs its own tick callbacks independently. A tick registered in `AppServiceProvider::boot()` runs in every worker.
- **Tick lifecycle**: Ticks start after the worker finishes its first request and continue until the worker is recycled or the server stops.
- **`Octane::stopTicks()`**: Stops all tick callbacks for the current worker. Useful during graceful shutdown to prevent ticks from firing during worker drain.
- **`$tick` parameter**: Callbacks receive a `$tick` object with `$tick->runtime()` to measure execution time and `$tick->name()` to identify the tick.
- **Tick vs cron**: Ticks are in-process, lightweight, and per-worker. Cron jobs are out-of-process, scheduled on the host, and run once regardless of worker count.

## When To Use

- You need periodic cache warming — hit cached endpoints every 30–60s to keep OpCache and application cache hot.
- You want per-worker health monitoring — log worker RSS, query counts, or GC status on a timer.
- You need database connection keepalive — send `SELECT 1` every 5 minutes to prevent connection drops by firewalls or proxies.
- You want periodic garbage collection in long-running workers — call `gc_collect_cycles()` every N requests rather than relying on automatic GC.
- You need to flush aggregated metrics in batches — accumulate metrics per-worker and flush every 60s.

## When NOT To Use

- The task is heavyweight (>1s to execute). Heavy ticks block the worker from handling requests during execution.
- The task should run once per server, not once per worker. Use cron or Laravel's scheduler for host-level tasks.
- The task requires precise timing across workers. Each worker's tick is independent — they may fire at different wall-clock times.
- The task modifies shared state that assumes single execution. Ticks run in every worker — a cache-clear tick would clear the cache N times.
- The task is better suited for a dedicated queue worker. Long-running or error-prone tasks should use jobs.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Keep tick callbacks under 100ms | Ticks run synchronously in the worker. A slow tick blocks request handling for all requests in that worker. |
| Use `seconds` for interval, not `at` | `Octane::tick()` accepts seconds. For cron-like scheduling (specific times), use Laravel's scheduler with a separate process. |
| Wrap tick logic in try/catch | An uncaught exception in a tick crashes the worker. Log exceptions and continue. |
| Use `$tick->runtime()` for monitoring | Track tick execution time to identify slow ticks before they impact request latency. |
| Guard idempotent ticks with a mutex | If a tick must not overlap with itself (e.g., a slow tick that runs longer than its interval), use `cache()->lock()` to prevent overlap. |
| Register ticks in a service provider's `boot()` method | Ticks must be registered before the worker enters the event loop. `boot()` runs once per worker in Octane. |
| Name ticks descriptively | Names appear in debugging and monitoring. Use `'metrics:flush'` not `'tick1'`. |

## Architecture Guidelines

- **Registration timing**: Ticks must be registered in service provider `boot()` methods. The `register()` method runs first and is not guaranteed to execute in the worker context.
- **Execution model**: After each request, the worker checks if any ticks are due. If a tick is due, the worker executes it before picking up the next request. Ticks do not interrupt request handling.
- **Non-overlapping**: A tick will not fire again while a previous execution of the same tick is still running. The execution time is subtracted from the next tick's interval.
- **Worker lifecycle**: Ticks are created when the worker boots and destroyed when the worker is recycled or the server stops. `Octane::stopTicks()` is called automatically during graceful shutdown.
- **Coordination across workers**: Ticks run independently in each worker. If you need a once-per-cluster operation, use `cache()->lock()` with a TTL to coordinate across workers, or use Laravel's scheduler.
- **Memory considerations**: Each tick callback captures its closure scope. Avoid capturing large variables in the closure to prevent memory leaks.

## Performance Considerations

- Tick overhead is proportional to execution frequency and duration. A 10ms tick every 60s adds ~0.01% CPU overhead per worker.
- Long ticks (>100ms) directly impact request latency — the worker cannot handle requests while executing a tick.
- Ticks do not run during request handling. They execute between requests. For a busy worker handling requests back-to-back, ticks may be delayed.
- Tick timers are approximate. Octane does not guarantee sub-second tick precision. The actual interval may vary by tens of milliseconds.
- PHP garbage collection should not be called on every tick. A tick that calls `gc_collect_cycles()` every 60s is sufficient for most applications.

## Security Considerations

- Ticks run in the worker process and have access to all application data. Ensure tick callbacks do not log or expose sensitive data.
- Tick callbacks that make HTTP requests should use internal URLs, not public URLs, to avoid exposing internal endpoints.
- Tick callbacks that access external services should have short timeouts to prevent worker blocking.
- Race conditions: If a tick and a request access the same data simultaneously, ensure proper locking or use atomic operations.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Registering ticks in `register()` method | Ticks registered before the container is fully booted. | Following standard Laravel service provider patterns. | Tick throws an error because services are not yet available. | Register ticks in `boot()` method only. |
| Using ticks for heavy computation | CPU-intensive ticks block request handling. | Assuming ticks run in the background. | Runtime increases, p99 latency spikes during tick execution. | Use queue workers for heavy work. Ticks are for lightweight periodic tasks only. |
| Not wrapping in try/catch | An exception in a tick crashes the entire worker. | Forgetting that ticks execute in the worker's process. | Worker dies, server health check fails, traffic drops. | Wrap tick logic in try/catch and log the error. |
| Registering the same tick in multiple providers | The same tick runs multiple times per interval. | Copy-pasting tick registration across providers. | Duplicate work, wasted CPU, potential cache stampedes. | Register each tick once. Use a single provider for all ticks. |
| Assuming ticks are synchronized across workers | Ticks run independently in each worker. | Analogy with cron scheduling. | Operations that should run once run N times (one per worker). | Use `cache()->lock()` for cluster-wide coordination. |

## Anti-Patterns

- **Tick-based job dispatching**: Dispatching queued jobs from a tick is an anti-pattern — use Laravel's scheduler instead. Ticks are for worker-scoped work.
- **Database-intensive ticks**: Ticks that run heavy queries block the worker and consume database connections. Keep database operations in ticks minimal.
- **Ticks that mutate shared global state**: A tick that clears a cache key invalidates the cache for all workers, potentially causing a stampede.
- **Ticks with side effects on every execution**: A tick that increments a counter or appends to a log file on every execution will cause unbounded growth. Use aggregation or rotation.

## Examples

```php
namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Octane\Facades\Octane;

class OctaneServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Cache warming — keep OpCache and application cache hot
        Octane::tick('cache:warm', fn () => cache()->get('metrics:summary'), seconds: 60);

        // GC collection — prevents cycle accumulation
        Octane::tick('gc:collect', function () {
            $status = gc_status();
            if ($status['roots'] > 5000) {
                gc_collect_cycles();
            }
        }, seconds: 300);

        // RSS monitoring — log worker memory for trend analysis
        Octane::tick('memory:log', function () {
            Log::info('Worker RSS', ['mb' => memory_get_usage(true) / 1024 / 1024]);
        }, seconds: 120);
    }
}
```

## Related Topics

- State Management and Leak Prevention
- Octane Metrics and Benchmarks
- Garbage Collection Threshold Tuning
- Service Provider Optimization for Persistence

## AI Agent Notes

- Ticks are often confused with Laravel's scheduler (`php artisan schedule:run`). Scheduler runs once per machine (cron). Ticks run in every Octane worker.
- A common use case: `gc_collect_cycles()` tick in Octane workers prevents gradual memory growth from circular references that accumulate between requests.
- Tick timing is best-effort. If a worker is continuously busy handling requests, ticks are delayed until the worker has a gap between requests.
- For monitoring, ticks are invaluable — they provide per-worker insight (RSS, request count, GC status) without external polling infrastructure.

## Verification

- [ ] Register a tick and verify it executes at the expected interval.
- [ ] Test tick exception handling: throw an exception in a tick and verify the worker does not crash.
- [ ] Verify tick does not block requests: measure request latency during tick execution.
- [ ] Test `Octane::stopTicks()`: verify ticks stop during graceful shutdown.
- [ ] Monitor tick execution time: use `$tick->runtime()` and verify ticks stay under 100ms.
- [ ] Verify tick isolation: confirm ticks in one worker do not affect other workers.
- [ ] Document all registered ticks with their purpose and interval.
