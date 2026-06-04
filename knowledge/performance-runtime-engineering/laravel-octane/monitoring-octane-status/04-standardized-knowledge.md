# Monitoring Octane Status — php artisan octane:status, octane:profile-memory

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | Laravel Octane Performance |
| Knowledge Unit | Monitoring Octane Status — php artisan octane:status, octane:profile-memory |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Octane provides built-in monitoring commands. `php artisan octane:status` shows worker state (alive, dead, working), request count, and uptime. `php artisan octane:profile-memory` (Swoole) profiles per-worker memory usage. For production, integrate Octane metrics with APM/observability — monitor worker RSS growth, request count per worker, and recycling frequency to detect memory leaks.

## Core Concepts

- **octane:status**: Lists all workers with PID, status (busy/idle), request count, and uptime. Dead workers indicate crashes — investigate error logs.
- **octane:profile-memory (Swoole)**: Shows per-worker memory breakdown. Detect workers with RSS significantly above the average — a leak indicator.
- **Log monitoring**: Octane logs worker events (start, stop, crash) to Laravel's log. Monitor for `Worker stopped` with non-zero exit codes.
- **APM integration**: Octane works with Tideways, Blackfire, and New Relic. Ensure distributed tracing works across Octane workers to identify slow endpoints.

## When To Use

- You have deployed Octane to production and need to verify worker health continuously.
- You are investigating a suspected memory leak in a long-running Octane worker.
- You need to integrate Octane metrics into your existing monitoring/alerting infrastructure.
- You want to detect and alert on worker crashes that silently reduce capacity.

## When NOT To Use

- You are running PHP-FPM — Octane-specific monitoring commands do not apply.
- You need detailed application-level profiling (use APM tools like Blackfire or Tideways instead).
- You are debugging coroutine-level issues in Swoole — `octane:profile-memory` only shows process-level memory.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Configure the health check endpoint `/octane/health` in load balancer health checks | Worker crashes are detected when health check fails. Without this, a crashed worker silently reduces capacity. |
| Monitor worker RSS growth and alert on >10% increase per hour | Memory leaks in long-running workers grow gradually. Early detection prevents OOM crashes. |
| Check `octane:status` after every deploy | Verifies all workers started correctly and are accepting requests. |
| Review worker recycling frequency | Workers recycled too often (low `max_requests`) lose Octane's performance advantage. Workers recycled too rarely may accumulate leaks. |
| Integrate with APM for distributed tracing | Octane's persistent workers make it harder to correlate requests with system metrics — APM bridges this gap. |

## Architecture Guidelines

- **Health check endpoint**: Configure `/octane/health` returning `{ "status": "ok", "workers": 4, "active_requests": 2, "uptime_seconds": 3600 }`. Use in load balancer health checks. Worker crashes are detected when health check fails.
- **Metrics collection strategy**: Collect at three levels: 1) Application metrics (OctaneStatus facade in code), 2) System metrics (RSS per PID via Prometheus node exporter), 3) APM traces (request duration, database query time).
- **Alerting thresholds**: Worker count drops below expected → critical alert. Any worker RSS >150% of average → warning. Any worker with >10k requests without recycling → warning.
- **Log aggregation**: Forward Laravel logs with Octane worker context (PID, request ID) to a centralized logging system (ELK, Datadog, Grafana Loki).

## Performance Considerations

- `octane:status` is a near-zero-cost command — safe to run frequently.
- `octane:profile-memory` has moderate overhead on Swoole — avoid running more than once per minute.
- Health check endpoint should be lightweight — avoid database queries or expensive operations in the health check handler.
- Logging from Octane workers is asynchronous (queued) — high-volume logging can fill the queue. Be selective about log levels in production.
- Each worker uses 30–80MB RSS; monitoring should aggregate metrics across all workers for total memory usage.

## Security Considerations

- Health check endpoints should not expose sensitive application data. Return only server status, not user data or configuration.
- `octane:status` output includes PIDs — restrict access to this command in production (admin-only).
- APM tools capture request payloads — ensure sensitive data (passwords, tokens, PII) is excluded from APM traces.
- Log aggregation systems must be secured — Octane worker logs may contain request details.
- Do not expose the Octane health endpoint publicly — restrict to internal network or VPN.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Not monitoring Octane workers in production | A crashed worker silently reduces capacity. With 4 workers, one crash = 25% capacity loss. | Assuming Octane auto-recovers without monitoring. | Capacity degradation goes undetected until users report errors or slow responses. | Always monitor worker count and alert on worker death. Use health check endpoint with load balancer. |
| Ignoring `octane:profile-memory` until OOM | Memory leaks grow gradually but are only noticed when a worker crashes. | Memory monitoring is not set up from day one. | OOM kills during peak traffic cause cascading failures. | Profile worker memory weekly or set up automated RSS monitoring. |
| Heavy health check endpoint | Including database queries or expensive operations in the health check handler. | Treating health check as a full application smoke test. | Health check itself causes performance degradation or cascading failures when dependencies are slow. | Health check should verify the worker is alive, not verify every dependency. |
| Not correlating logs with worker PIDs | Logs without worker context make it impossible to identify which worker is leaking. | Default Laravel logging does not include worker PID. | When a leak is detected, cannot identify the failing worker to inspect it. | Add PID and request ID to all log entries using a custom log formatter. |

## Anti-Patterns

- **Monitoring only at the process level**: System-level monitoring (CPU, memory) is necessary but insufficient. You need application-level metrics (request count per worker, recycling frequency) to detect leaks before they cause system issues.
- **Setting `max_requests` too low to avoid leaks**: If you set `max_requests` to a very low value (e.g., 100), you lose most of Octane's performance advantage. Fix the root cause instead.
- **Relying only on `octane:status`**: `octane:status` shows worker state at a point in time but does not detect data integrity issues (state leaks). You need explicit data-integrity tests.
- **Running `octane:profile-memory` in production on a schedule**: On Swoole, this command has overhead. Run it on-demand when investigating suspected leaks, not as a continuous monitor.

## Examples

```
// Health check response example
// GET /octane/health
// Response:
{
    "status": "ok",
    "workers": 4,
    "active_requests": 2,
    "uptime_seconds": 3600,
    "timestamp": "2026-06-02T12:00:00Z"
}

// Register health check route
// routes/web.php or routes/api.php
Route::get('/octane/health', function () {
    return response()->json([
        'status' => 'ok',
        'workers' => Octane::workerCount(),
        'active_requests' => Octane::activeRequests(),
        'uptime_seconds' => Octane::uptime(),
        'timestamp' => now()->toIso8601String(),
    ]);
});
```

```
// Adding worker PID to log context
// AppServiceProvider::boot() or a dedicated service provider
use Illuminate\Support\Facades\Log;

public function boot(): void
{
    Log::shareContext([
        'worker_pid' => getmypid(),
    ]);
}
```

```
// Monitoring script (pseudo-code)
// Check if any worker has >10k requests without recycling
$status = json_decode(shell_exec('php artisan octane:status --json'));
foreach ($status->workers as $worker) {
    if ($worker->requests > 10000 && $worker->status === 'alive') {
        alert("Worker {$worker->pid} has handled {$worker->requests} requests without recycling");
    }
    if ($worker->rss_mb > 120) {  // 150% of expected 80MB
        alert("Worker {$worker->pid} RSS is {$worker->rss_mb}MB — possible memory leak");
    }
}
```

## Related Topics

- Worker Configuration by Driver
- State Management and Leak Prevention
- FPM Status Page vs Octane Status
- Profiling and Observability
- Performance Gain Estimation

## AI Agent Notes

- When a user reports Octane workers crashing, the first step is to check `octane:status` and review recent logs for crash patterns.
- RSS growth >10% per hour is the key indicator of a memory leak. Recommend setting up automated RSS monitoring.
- For users new to Octane, emphasize that `octane:status` is a worker health check, not a leak detector. They need separate data-integrity tests.
- Health check endpoints should be as lightweight as possible — return status with no database queries.
- Suggest adding worker PID to log context as a standard practice — it is essential for correlating logs with worker behavior.

## Verification

- [ ] Run `php artisan octane:status` and verify all workers show expected count and status.
- [ ] Configure health check endpoint (`/octane/health`) and verify it returns correct worker state.
- [ ] Add health check to load balancer configuration.
- [ ] Set up monitoring alerts for: worker count drops, RSS >150% of expected, worker crash events in logs.
- [ ] Add worker PID to log context for all log channels.
- [ ] Integrate Octane metrics with APM tool (Tideways, Blackfire, or New Relic).
- [ ] Run `octane:profile-memory` (Swoole) to verify even memory distribution across workers.
- [ ] Test that `octane:reload` works and does not drop in-flight requests.
- [ ] Verify log aggregation system receives and indexes Octane worker logs.
- [ ] Review worker recycling frequency and adjust `max_requests` if needed.
