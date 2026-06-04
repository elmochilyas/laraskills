## Configure the /octane/health endpoint in every production Octane deployment
---
Category: Monitoring
---
Register a dedicated `/octane/health` route that returns worker count, active requests, and uptime, and configure load balancer health checks against it.
---
Reason: Without a health check endpoint, crashed workers silently reduce pool capacity. A 4-worker deployment with one crashed worker operates at 75% capacity without alerting. The health check endpoint provides the load balancer with real-time worker availability data, enabling automatic worker replacement and alerting when workers fail.
---
Bad Example:
```php
// No health check — crashed workers go undetected
// Routes defined for application only
```

Good Example:
```php
Route::get('/octane/health', function () {
    return response()->json([
        'status' => 'ok',
        'workers' => Octane::workerCount(),
        'active_requests' => Octane::activeRequests(),
        'uptime_seconds' => Octane::uptime(),
    ]);
});
```
---
Exceptions: When the load balancer uses a different health check mechanism (TCP port check), the health endpoint is still valuable for monitoring dashboards.
---
Consequences Of Violation: Silent capacity degradation from crashed workers, undetected until user-facing errors occur, delayed incident response.

## Add worker PID to all log entries for correlation during debugging
---
Category: Maintainability
---
Include getmypid() in the log context for every Octane worker so that logs can be correlated with specific worker instances during debugging.
---
Reason: When investigating a memory leak or crash, logs must be traceable to a specific worker instance. Without the PID, logs from different workers interleave indistinguishably, making it impossible to tell if the leak is in one specific worker or all workers. The PID enables filtering logs by worker, revealing patterns like "Worker PID 1234 crashed at 10000 requests" that point to max_requests or drift issues.
---
Bad Example:
```php
// No PID in logs — cannot correlate with worker instances
// Log: "User updated" — which worker? PID unknown
```

Good Example:
```php
// PID included in all log entries
Log::shareContext(['worker_pid' => getmypid()]);
// Log: "User updated" — PID 1234, can correlate with worker metrics
```
---
Exceptions: Distributed log aggregation systems that automatically inject host/process IDs may not need explicit PID injection.
---
Consequences Of Violation: Logs unrelatable to specific workers, inability to identify which worker is leaking, delayed root cause analysis.

## Alert on any worker RSS exceeding 150% of the expected baseline
---
Category: Monitoring
---
Set a monitoring alert that triggers when any Octane worker's RSS exceeds 150% of the average worker RSS, indicating a potential memory leak in that specific worker.
---
Reason: Normal Octane worker RSS varies by 5-10% between workers due to request mix differences. A worker exceeding 150% of the average is almost certainly leaking memory — it has accumulated data that other workers have not. This early detection (hours before OOM) allows investigation and intervention before the worker crashes and affects throughput.
---
Bad Example:
```bash
# No per-worker RSS monitoring — leak detected only at OOM
# Worker crashes at 200MB (300% of baseline 65MB)
```

Good Example:
```bash
# Per-worker RSS alerting
# Average worker RSS: 65MB
# Worker PID 1234 RSS: 105MB (162% of baseline) — ALERT
# Investigate: is this a request-level leak in that worker?
```
---
Exceptions: Workers that serve different request mixes (some endpoints allocate more memory) should be grouped by endpoint type for baseline calculation.
---
Consequences Of Violation: Memory leaks detected only at OOM crash, worker already lost before investigation begins, capacity degradation during root cause analysis.

## Monitor Octane worker recycling frequency and alert on excessive or insufficient recycling
---
Category: Monitoring
---
Track the average number of requests per worker before recycling and alert if the average exceeds max_requests × 1.5 (workers not recycling) or falls below max_requests × 0.5 (too-frequent recycling).
---
Reason: Workers not recycling means max_requests may be too high or the recycling mechanism is failing — memory drift is unchecked. Workers recycling too frequently means max_requests is too low — Octane's bootstrap-elimination benefit is lost on a large percentage of requests. Both extremes are signs of misconfiguration that silently degrade performance.
---
Bad Example:
```bash
# Recycling frequency not monitored
# max_requests=1000, but average worker handles 8000 requests — no recycling happening
# Memory drift accumulating silently
```

Good Example:
```bash
# Recycling frequency tracked
# max_requests=1000, average worker handles 950 requests — within expected range
# If average exceeds 1500: alert — workers may not be recycling
# If average is 300: alert — max_requests too low, wasting bootstrap savings
```
---
Exceptions: Applications with max_requests intentionally set based on measured memory growth may have different expected average ranges.
---
Consequences Of Violation: Unnoticed recycling failure causes unbounded memory drift (too few cycles) or wasted Octane performance from constant worker restarts (too many cycles).

## Keep the Octane health endpoint lightweight — no database queries or expensive operations
---
Category: Monitoring
---
Ensure the /octane/health endpoint returns only worker status information (not application health) and avoids any database queries, API calls, or filesystem operations.
---
Reason: A health check that queries the database creates a dependency on the database for worker health detection. If the database is slow or down, the health check endpoint fails too, causing the load balancer to mark healthy workers as unhealthy and take them out of rotation. This doubles the impact of a database issue — the application is already degraded, and now the load balancer removes workers too.
---
Bad Example:
```php
// Health check with database dependency — dangerous
Route::get('/octane/health', function () {
    DB::select('SELECT 1');  // Database dependency in health check
});
```

Good Example:
```php
// Lightweight health check — no external dependencies
Route::get('/octane/health', function () {
    return response()->json(['status' => 'ok']);
});
```
---
Exceptions: Dedicated deep-health-check endpoints (separate from the load balancer health check) may test dependencies for monitoring purposes.
---
Consequences Of Violation: Database outage causes load balancer to drain all workers, complete service unavailability from cascading health check failure.
