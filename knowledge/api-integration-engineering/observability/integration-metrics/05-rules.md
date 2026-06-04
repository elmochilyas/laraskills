## Track Request Volume, Latency, and Error Rate Per Service
---
## Category
Observability
---
## Rule
Collect and monitor request count, P50/P95/P99 latency, and error rate (4xx, 5xx) per external service.
---
## Reason
These three base metrics reveal integration health at a glance: volume shows usage trends, latency shows performance, error rate shows reliability.
---
## Bad Example
```php
// No metrics — integration health is guesswork
```
---
## Good Example
```php
Metrics::increment("request.volume.stripe");
Metrics::timing("request.latency.stripe", $elapsed);
if ($response->failed()) {
    Metrics::increment("request.errors.stripe." . $response->status());
}
```
---
## Exceptions
Non-critical integrations where monitoring overhead isn't justified.
---
## Consequences Of Violation
Integration degradation undetected until user impact, no data for capacity planning, reactive incident response.
## Monitor Leading Indicators, Not Just Lagging
---
## Category
Observability
---
## Rule
Track leading indicators (rate limit headroom, retry rate, queue wait time) alongside lagging indicators (error rate).
---
## Reason
Error rate is a lagging indicator — by the time errors spike, the problem is already causing impact. Leading indicators predict impending issues.
---
## Bad Example
```php
// Only error rates — no warning before rate limit exhaustion
```
---
## Good Example
```php
$headroom = $limiter->remaining() / $limiter->limit();
Metrics::gauge("rate_limit.headroom.stripe", $headroom);
if ($headroom < 0.2) {
    Alert::warning("Stripe rate limit headroom below 20%");
}
```
---
## Exceptions
None — always monitor leading indicators.
---
## Consequences Of Violation
Rate limit exhaustion surprises, retry storms undetected, queuing backpressure invisible until errors spike.
## Set Alert Thresholds Based on Baseline Data
---
## Category
Observability
---
## Rule
Collect baseline metrics for the first 2 weeks of operation before setting alert thresholds; use statistical methods (percentiles, standard deviation).
---
## Reason
Without baseline data, thresholds are arbitrary — too tight causes false alarms, too loose misses real issues.
---
## Bad Example
```php
// Arbitrary thresholds — 100ms latency alert: too tight for some APIs
Alert::ifLatencyAbove('stripe', 100);
```
---
## Good Example
```php
// Baseline: P99 latency is 1500ms during first 2 weeks
// Set alert at 2x baseline: 3000ms
Alert::ifLatencyAbove('stripe', 3000); // based on baseline data
```
---
## Exceptions
APIs with documented latency SLAs that define appropriate thresholds.
---
## Consequences Of Violation
Alert fatigue from false positives (threshold too tight) or missed incidents (threshold too loose).
## Track Webhook Delivery Success Rate
---
## Category
Observability
---
## Rule
Monitor the percentage of webhook deliveries that succeed vs fail per provider.
---
## Reason
Webhook delivery failures indicate subscriber issues, provider problems, or processing bugs; declining success rate requires investigation.
---
## Bad Example
```php
// No webhook delivery metrics — failures invisible
```
---
## Good Example
```php
$result ? Metrics::increment("webhook.success.stripe") : Metrics::increment("webhook.failure.stripe");
$rate = Metrics::rate("webhook.success.stripe", 15, 'minute');
if ($rate < 0.95) {
    Alert::warning("Stripe webhook delivery success rate below 95%");
}
```
---
## Exceptions
None — always monitor webhook delivery success rate.
---
## Consequences Of Violation
Undetected delivery failures, subscriber dissatisfaction, missed critical event processing.
## Correlate Integration Metrics with Business Metrics
---
## Category
Observability
---
## Rule
Link integration metrics to business KPIs (e.g., Stripe latency → order completion rate) to quantify business impact.
---
## Reason
Technical metrics alone don't communicate business priority; correlating them helps justify investment in integration reliability.
---
## Bad Example
```php
// Technical metrics isolated — business impact invisible
```
---
## Good Example
```php
// Dashboard showing: "When Stripe latency exceeds 2s, order completion drops 15%"
$impact = BusinessMetric::orderCompletionRate();
$latency = Metrics::p99('request.latency.stripe');
if ($latency > 2000 && $impact < 0.85) {
    Alert::critical("High Stripe latency ({$latency}ms) correlated with {$impact}% order rate");
}
```
---
## Exceptions
Simple integrations with no direct business metric correlation.
---
## Consequences Of Violation
Integration issues perceived as low priority, underinvestment in reliability, preventable business impact.
## Use Pulse Cards for Real-Time Metrics Dashboard
---
## Category
Observability
---
## Rule
Create Pulse dashboard cards displaying real-time integration metrics per service.
---
## Reason
Pulse provides an at-a-glance view of integration health without requiring log access or external monitoring tools.
---
## Bad Example
```php
// Metrics collected but not visible — no easy access for operators
```
---
## Good Example
```php
// resources/js/components/pulse/integration-metrics.vue
// Pulse card showing: latency, error rate, rate limit headroom per service
// Register in service provider
```
---
## Exceptions
Organizations using external monitoring tools (Datadog, Grafana) as primary dashboards.
---
## Consequences Of Violation
Metrics invisible to operators, no at-a-glance health status, reliance on alert-driven awareness only.
