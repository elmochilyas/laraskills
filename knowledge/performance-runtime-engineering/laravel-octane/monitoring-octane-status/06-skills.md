# Skill: Monitor and Debug Octane Workers Using Built-in Commands and Observability

## Purpose
Set up continuous monitoring for Laravel Octane workers using `octane:status`, `octane:profile-memory`, health check endpoints, and log correlation — detecting worker crashes, memory leaks, and recycling anomalies before they cause production incidents.

## When To Use
- Setting up production monitoring for a newly deployed Octane application
- Investigating suspected memory leaks or worker crashes
- Auditing worker health after configuration changes or code deployments
- Integrating Octane metrics into existing observability infrastructure (APM, log aggregation)
- Capacity planning — tracking worker count, RSS trends, and recycling frequency over time

## When NOT To Use
- For applications still running PHP-FPM (Octane-specific commands don't apply)
- For detailed application-level profiling (use APM tools like Blackfire or Tideways instead)
- For debugging coroutine-level issues in Swoole (use Swoole-specific debugging tools instead)

## Prerequisites
- Laravel application deployed under Octane in production
- Access to run `php artisan octane:status` and `php artisan octane:profile-memory`
- Health check endpoint configured in routes (for load balancer integration)
- Log aggregation system (ELK, Datadog, Grafana Loki) configured
- Monitoring/alerting infrastructure (Prometheus + Grafana, Datadog, or similar)
- Understanding of expected worker RSS baseline and recycling frequency

## Inputs
- Current `php artisan octane:status` output (worker count, status, request counts)
- Worker RSS baseline (expected per-worker memory usage)
- Current `config/octane.php` settings (max_requests, worker count)
- Load balancer health check configuration
- Log aggregation system configuration
- APM tool integration details

## Workflow

### 1. Configure the /octane/health Endpoint
- Register a health check route in routes file:
```php
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
- Ensure the endpoint is lightweight — no database queries, API calls, or filesystem operations
- Configure load balancer health checks to use this endpoint
- Do not expose the endpoint to the public internet

### 2. Add Worker PID to Log Context
- In a service provider's boot() method, add:
```php
use Illuminate\Support\Facades\Log;

public function boot(): void
{
    Log::shareContext(['worker_pid' => getmypid()]);
}
```
- This ensures every log entry includes the worker PID for correlation
- In log aggregation system: create filters and dashboards grouped by worker_pid
- When investigating: filter logs by PID to see a single worker's lifecycle

### 3. Run and Interpret octane:status
- Run `php artisan octane:status` regularly (every minute via cron)
- Expected output: all workers in "ready" or "working" state
- Interpret results:
  - Workers in "busy" state: currently handling a request (normal)
  - Workers missing or in "dead" state: worker crash — investigate logs
  - Workers with request count >> max_requests: workers not recycling (configuration issue)
  - Workers with request count << max_requests × 0.5: too-frequent recycling
- Automate: parse the output and alert on anomalies

### 4. Monitor Worker RSS Growth
- Determine expected RSS baseline: measure after warm-up (100 requests)
- Set alert threshold: any worker RSS >150% of baseline — warning
- Set critical threshold: any worker RSS >200% of baseline — critical (imminent OOM)
- Monitor over time: plot RSS vs request count for each worker
- Identify leaks: worker RSS grows >10% per 1000 requests consistently
- Use `octane:profile-memory` (Swoole) to identify which services consume the most memory

### 5. Monitor Worker Recycling Frequency
- Track average requests per worker before recycling
- Alert if average requests > max_requests × 1.5 (workers not recycling)
- Alert if average requests < max_requests × 0.5 (too-frequent recycling)
- Not recycling means max_requests may be too high or configuration is broken
- Too-frequent recycling means max_requests is too low — waste of bootstrap savings
- Adjust max_requests based on observed recycling data and RSS growth

### 6. Configure Worker Crash Alerting
- Monitor `php artisan octane:status` for worker count drops
- Monitor Laravel log for "Worker stopped" entries with non-zero exit codes
- Monitor health check endpoint for non-200 responses
- Alert on:
  - Worker count below expected (any drop = partial capacity loss)
  - Consecutive health check failures (>2 failures = worker pool issue)
  - Worker crash events (exit code != 0)
- Respond: check logs for crash reason, verify supervisor auto-restart, investigate root cause

### 7. Set Up Octane Metrics in APM Tool
- Integrate Octane with APM tool (Tideways, Blackfire, New Relic, Datadog)
- Ensure distributed tracing tracks requests across Octane workers
- Configure custom metrics for Octane-specific signals:
  - Worker request count (per-PID)
  - Worker RSS (per-PID)
  - GC roots and collection count
  - Connection pool utilization
- Create APM dashboard for Octane-specific view

### 8. Create Log Aggregation Dashboards
- Set up dashboards in log aggregation system:
  - Worker lifecycle events: start, stop, crash (per PID, per server)
  - Worker request count over time (per PID)
  - Error rate by worker PID (identify a single leaking worker)
  - Slow request logs correlated with worker PID
- Create filters: `worker_pid=*` to isolate a specific worker's logs
- Set up alert rules: crash events per hour > threshold

### 9. Run Scheduled octane:status Checks
- Configure a cron job to run `php artisan octane:status --json` every minute
- Parse the JSON output into monitoring metrics
- Send metrics to monitoring system (Prometheus, Datadog, etc.)
- Metrics to collect:
  - `octane_worker_count` (total workers)
  - `octane_active_requests` (current in-flight requests)
  - `octane_uptime_seconds`
  - `octane_requests_per_worker` (distribution)
  - `octane_worker_status` (ready, busy, dead)

### 10. Review and Tune Monitoring
- Review monitoring data weekly for the first month after deployment
- Adjust alert thresholds based on observed patterns (some normal variance is expected)
- Verify that alerts fire correctly and are actionable
- Tune max_requests based on observed recycling data
- Document monitoring configuration for operations team

## Validation Checklist
- [ ] /octane/health endpoint registered and returning correct worker state
- [ ] Health check endpoint is lightweight (no database queries)
- [ ] Worker PID added to all log entries via Log::shareContext()
- [ ] octane:status runs on schedule (every minute) with metrics collected
- [ ] RSS baseline established and alert thresholds configured (150%, 200%)
- [ ] Worker recycling frequency monitored with alerts for anomalies
- [ ] Worker crash alerts configured (count drop, health check failures, exit codes)
- [ ] APM tool integrated with Octane distributed tracing
- [ ] Log aggregation dashboards created with worker PID filters
- [ ] Alert thresholds reviewed and tuned based on observed patterns
- [ ] Monitoring configuration documented for operations team

## Common Failures

| Failure | Symptom | Root Cause | Mitigation |
|---------|---------|------------|------------|
| Worker crash not detected | Capacity degrades silently | No health check or worker count monitoring | Configure /octane/health and octane:status monitoring |
| Memory leak goes unnoticed | OOM after 12-24 hours | No RSS trending or alerting | Set up per-worker RSS monitoring with 150% threshold |
| Cannot correlate logs with workers | Logs show errors but unclear which worker | Worker PID not included in logs | Add Log::shareContext(['worker_pid' => getmypid()]) |
| Health check fails during normal operation | Load balancer removes workers | Health check has database dependency | Make health check lightweight (no dependencies) |
| False positives from recycling alerts | Average requests below max_requests × 0.5 | Workers recycling from crashes, not max_requests | Check crash logs before adjusting max_requests |

## Decision Points

| Decision | How To Decide |
|----------|---------------|
| Health check frequency | Load balancer: every 5-10s. Monitoring: every 30-60s. Never more frequent than every 5s |
| RSS threshold | 150% of baseline as warning. 200% of baseline as critical. Adjust based on observed worker variance |
| octane:status check interval | Every 60s for production monitoring. Every 10s during incident investigation |
| Per-worker vs aggregate monitoring | Start with aggregate for dashboards. Add per-worker when troubleshooting individual worker issues |
| Log retention for worker logs | 30 days minimum for trend analysis. 90 days for compliance/capacity planning |

## Performance Considerations
- `octane:status` is near-zero-cost — safe to run every 10-60 seconds
- `octane:profile-memory` has moderate overhead (Swoole) — run on-demand only, not continuously
- Health check endpoint should be lightweight — memory-only operations, no I/O
- Log worker_pid context adds negligible overhead to log writes
- Metrics collection (Prometheus pushgateway or similar) adds <1% CPU per worker

## Security Considerations
- Health check endpoint should not expose sensitive data — return worker count and status only
- `octane:status` output includes PIDs — restrict command access to admin users
- Health check endpoint should not be exposed to the public internet — internal network only
- Log entries may contain request data — ensure log aggregation system is secured
- APM traces may capture request payloads — configure data scrubbing for sensitive fields

## Related Rules

| Rule | File | Application |
|------|------|-------------|
| Configure /octane/health endpoint in every production deployment | `05-rules.md:1` | Step 1: health check configuration |
| Add worker PID to all log entries | `05-rules.md:31` | Step 2: log correlation |
| Alert on any worker RSS exceeding 150% of baseline | `05-rules.md:56` | Step 4: RSS monitoring |
| Monitor worker recycling frequency | `05-rules.md:82` | Step 5: recycling monitoring |
| Keep health check endpoint lightweight | `05-rules.md:109` | Step 1.4: no dependencies in health check |

## Related Skills

| Skill | Relation |
|-------|----------|
| Benchmark and Monitor Octane Performance | This skill focuses on worker-level monitoring; benchmarking skill covers application-level metrics |
| Manage and Prevent Octane State Leaks | RSS monitoring from this skill feeds into leak detection |
| Configure Octane Workers by Driver | Worker configuration settings are validated by monitoring |
| Perform FPM-to-Octane Migration | Monitoring is the final step of migration validation |
| Tune Octane for Sub-50ms Response | Monitoring detects regressions after tuning changes |

## Success Criteria
- Health check endpoint operational and integrated with load balancer
- Worker PID included in all log entries for correlation
- `octane:status` collected every 60s with metrics in monitoring system
- RSS baseline established and alerting on anomalies (>150% threshold)
- Worker recycling frequency monitored and within expected range
- Worker crashes detected within 60 seconds and alerted
- APM tool showing Octane-specific metrics and distributed traces
- Log aggregation dashboards enable per-worker debugging
- Alert thresholds tuned and actionable
- Operations team trained on Octane monitoring runbook
