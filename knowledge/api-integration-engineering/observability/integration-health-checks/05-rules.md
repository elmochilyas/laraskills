## Implement Per-Integration Health Check Endpoints
---
## Category
Observability
---
## Rule
Create dedicated health check endpoints per integration (`/health/stripe`, `/health/mailgun`) that test connectivity, auth, and response time.
---
## Reason
Dedicated per-integration endpoints enable targeted monitoring and alerting; an aggregate `/health` endpoint returns a summary.
---
## Bad Example
```php
// Single /health endpoint — can't distinguish which integration failed
```
---
## Good Example
```php
Route::get('/health/stripe', [IntegrationHealthController::class, 'stripe']);
Route::get('/health/mailgun', [IntegrationHealthController::class, 'mailgun']);
Route::get('/health', [IntegrationHealthController::class, 'all']); // aggregate
```
---
## Exceptions
Non-critical integrations where individual health monitoring isn't warranted.
---
## Consequences Of Violation
Cannot identify which integration is failing from aggregate health check, slower incident diagnosis.
## Use Lightweight Ping, Not Full Business Calls
---
## Category
Performance
---
## Rule
Call lightweight upstream endpoints (e.g., `GET /v1/charges?limit=1`) for health checks; never use mutation endpoints or full business requests.
---
## Reason
Full business calls are slow, may create resources, and increase costs; lightweight pings provide sufficient health signal.
---
## Bad Example
```php
Http::post('/charges', ['amount' => 100]); // mutation — creates charges on each health check
```
---
## Good Example
```php
Http::get('/v1/balance'); // lightweight read — no side effects
```
---
## Exceptions
Upstreams with no lightweight ping endpoints.
---
## Consequences Of Violation
Unnecessary cost from mutation calls, risk of creating test resources, slow health check responses.
## Cache Health Check Results (30-60s TTL)
---
## Category
Performance
---
## Rule
Cache health check results for 30-60 seconds to avoid hammering upstream APIs on dashboard page loads.
---
## Reason
Without caching, every dashboard refresh triggers new upstream calls, potentially causing rate limit issues or excessive load.
---
## Bad Example
```php
public function stripe(): array {
    return $this->checkStripe(); // called on every request — no caching
}
```
---
## Good Example
```php
public function stripe(): array {
    return Cache::remember('health:stripe', 30, fn () => $this->checkStripe());
}
```
---
## Exceptions
Real-time health monitoring where 30-second latency is unacceptable.
---
## Consequences Of Violation
Rate limit exhaustion from frequent health checks, excessive upstream load, slow dashboard page loads.
## Alert on Consecutive Failures, Not Single Failures
---
## Category
Reliability
---
## Rule
Trigger alerts only after N consecutive health check failures (3-5 typical); never alert on a single failure.
---
## Reason
Transient network blips cause occasional failures; alerting on every failure causes alert fatigue and noise.
---
## Bad Example
```php
// Alert on every failure — alert fatigue for transient issues
```
---
## Good Example
```php
$failures = Cache::increment("health:failures:stripe");
Cache::put("health:failures:stripe", $failures, 300); // 5 min TTL
if ($failures >= 5) {
    Alert::critical("Stripe health check failed 5 consecutive times");
    Cache::forget("health:failures:stripe"); // reset after alert
}
```
---
## Exceptions
Zero-tolerance integrations where every failure requires investigation.
---
## Consequences Of Violation
Alert fatigue, desensitized operators, real incidents buried in alert noise.
## Implement Interface for Pluggable Health Checks
---
## Category
Maintainability
---
## Rule
Define a `HealthCheckInterface` and implement a separate check class per integration.
---
## Reason
Pluggable checks ensure consistent implementation and make it easy to add health checks for new integrations.
---
## Bad Example
```php
// Ad-hoc health check in controller — not reusable
```
---
## Good Example
```php
interface HealthCheckInterface {
    public function check(): HealthCheckResult;
}
class StripeHealthCheck implements HealthCheckInterface {
    public function check(): HealthCheckResult { /* ... */ }
}
class MailgunHealthCheck implements HealthCheckInterface {
    public function check(): HealthCheckResult { /* ... */ }
}
```
---
## Exceptions
Single-integration applications where interface overhead isn't justified.
---
## Consequences Of Violation
Inconsistent health check implementations, duplicate code across integrations, harder to add health checks for new integrations.
## Create Pulse Card for Integration Health Dashboard
---
## Category
Observability
---
## Rule
Build a Laravel Pulse card displaying real-time integration health status at a glance.
---
## Reason
Operators need an at-a-glance view of all integration health; Pulse cards provide this without requiring external tools.
---
## Bad Example
```php
// Health data collected but no dashboard — must run curl to check
```
---
## Good Example
```php
// Pulse card showing: green/yellow/red per integration with latency
// Register in PulseServiceProvider
```
---
## Exceptions
Organizations using external monitoring dashboards (Grafana, Datadog).
---
## Consequences Of Violation
Health data invisible to operators, no easy status check, reliance on alert-driven awareness only.
