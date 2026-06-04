# Phase 5: Rules — API Monitoring and Alerting

## Rule 1: Monitor Using RED Method for Every Service
---
## Category
Reliability
---
## Rule
Always monitor every service using the RED method: Rate (requests/second), Errors (failed requests/second), Duration (latency percentiles — p50, p95, p99). Never monitor less than these three signals.
---
## Reason
Rate answers "how much traffic?", errors answer "is it failing?", duration answers "is it slow?" — together they provide a complete picture of service health.
---
## Bad Example
```php
// Monitoring only uptime — missed that API is responding in 5 seconds
Monitor::uptime('/health');
```
---
## Good Example
```php
public function recordMetrics(Request $request, Response $response, float $durationMs): void {
    Metrics::counter('api_requests_total', 1, ['method' => $request->method(), 'status' => $response->status()]);
    Metrics::histogram('api_request_duration_ms', $durationMs, ['p50', 'p95', 'p99']);
    if ($response->status() >= 500) {
        Metrics::counter('api_errors_total', 1, ['code' => $response->status()]);
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Degraded service goes undetected; slow responses unnoticed until consumers complain; no data for debugging.
---

## Rule 2: Alert on Error Budget Burn Rate, Not Raw Error Rate
---
## Category
Reliability
---
## Rule
Always alert on how fast the error budget is being consumed (burn rate), not on the raw error rate crossing a fixed threshold. Never alert on absolute error percentages alone.
---
## Reason
Raw error rate alerts trigger on brief spikes that don't meaningfully impact SLO. Burn rate alerts measure whether the budget will be exhausted before the window ends.
---
## Bad Example
```php
// Alerts on any 5-second spike to 5% errors — too sensitive
if ($errorRate > 0.05) { alert('Error rate high!'); }
```
---
## Good Example
```php
// Burn rate: alert if budget consumed at 2x or 10x expected rate over window
// 2x for 1 hour or 10x for 6 minutes triggers page
```
---
## Exceptions
APIs without defined SLOs may use simpler threshold-based alerting.
---
## Consequences Of Violation
Alert fatigue from short spikes; genuine SLO violations missed; on-call desensitized.
---

## Rule 3: Implement Health Checks with Dependency Verification
---
## Category
Reliability
---
## Rule
Always implement health checks that verify dependency connectivity (database, cache, queue, critical services) and respond within 100ms. Never return 200 OK without actually testing dependencies.
---
## Reason
A health check that returns 200 while the database is down gives a false sense of security. Downstream consumers and load balancers trust the health response.
---
## Bad Example
```php
// Returns 200 even when DB is disconnected
Route::get('/health', fn() => ['status' => 'ok']);
```
---
## Good Example
```php
Route::get('/health', function () {
    $checks = [
        'database' => Health::db(),
        'cache' => Health::cache(),
        'queue' => Health::queue(),
    ];
    $failed = collect($checks)->filter(fn($c) => !$c->passed);
    return response()->json([
        'status' => $failed->isEmpty() ? 'ok' : 'degraded',
        'checks' => $checks,
    ], $failed->isEmpty() ? 200 : 503);
});
```
---
## Exceptions
Simple static frontend or proxy layers may have lightweight health checks.
---
## Consequences Of Violation
Load balancer routes traffic to unhealthy instances; cascading failure; downstream consumers receive errors.
---

## Rule 4: Run Synthetic Monitoring from Multiple Regions
---
## Category
Reliability
---
## Rule
Always run synthetic monitoring transactions simulating real consumer behavior from multiple geographic regions. Never rely solely on real-user monitoring.
---
## Reason
Real-user monitoring only detects issues after consumers are affected. Synthetic monitoring proactively detects availability and correctness issues from different network paths.
---
## Bad Example
```php
// Only real-user monitoring — discovers issues when users complain
```
---
## Good Example
```php
// Synthetic checks from 3 regions every 60 seconds
// "POST /users -> verify user created" — from US, EU, APAC
```
---
## Exceptions
APIs with no external consumers (internal-only) may skip synthetic monitoring.
---
## Consequences Of Violation
Regional outages go undetected until consumers report them; latency differences invisible; availability blind spots.
---

## Rule 5: Write Runbooks for Every Alert
---
## Category
Reliability
---
## Rule
Always maintain a runbook for every alert that defines: what to check, how to diagnose, and how to remediate. Never send an alert without an associated runbook.
---
## Reason
Without runbooks, on-call engineers waste critical minutes figuring out what to do. Runbooks reduce mean time to resolution (MTTR).
---
## Bad Example
```php
// Alert fires: "High error rate"
// On-call: "What do I do?" — 30 minutes investigation
```
---
## Good Example
```php
// Runbook for HighErrorRate alert:
// 1. Check if recent deployment happened -> rollback if yes
// 2. Check database connectivity -> /health endpoint
// 3. Check upstream service status -> dependency dashboard
// 4. If no clear cause -> escalate to SRE team
```
---
## Exceptions
Self-healing alerts (auto-scaled, auto-restarted) may not need manual runbooks.
---
## Consequences Of Violation
Extended MTTR; panic during incidents; inconsistent response across shifts.
---

## Rule 6: Implement Multi-Window, Multi-Burst Alerting
---
## Category
Reliability
---
## Rule
Always configure alerts with multiple windows (e.g., 5 minutes and 30 minutes) to catch both sustained and burst issues. Never use a single time window for all alerts.
---
## Reason
Single-window alerting either misses short bursts (too long) or fires on transient noise (too short). Multiple windows provide both sensitivity and stability.
---
## Bad Example
```php
// Single 5-minute window — misses sustained 1-hour degradation
if ($errorRate5min > 0.05) { alert(); }
```
---
## Good Example
```php
// Multi-window: short burst (5 min at 5%) OR sustained (30 min at 2%)
// Multi-burst: 1 of 1 evaluation windows (sensitive) vs 3 of 5 (stable)
```
---
## Exceptions
Critical system alerts (production outage) may use single short window for immediate detection.
---
## Consequences Of Violation
Brief true issues missed by long windows; false positives from short windows cause alert fatigue.
---

## Rule 7: Monitor the Monitoring System
---
## Category
Reliability
---
## Rule
Always implement heartbeat monitoring for the monitoring infrastructure itself (Prometheus, Loki, Grafana, alert manager). Never let the monitoring system fail silently.
---
## Reason
If the monitoring system goes down, no one is aware. Incidents can occur and hours pass before anyone notices the lack of alerts.
---
## Bad Example
```php
// No monitoring of monitoring — Grafana down for 3 hours, nobody noticed
```
---
## Good Example
```php
// Dead man's switch: synthetic check that must fire every 60 seconds
// If check doesn't fire (monitoring down) -> separate alerting channel
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Silent monitoring outage leaves API unmonitored; incidents undetected for hours; post-mortem discovers monitoring gap.
