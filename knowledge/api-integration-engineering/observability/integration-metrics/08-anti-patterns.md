# Anti-Patterns: Integration Metrics

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | observability-monitoring |
| Knowledge Unit | Integration Metrics |
| Difficulty | Intermediate |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Tracking Only Error Rates, Not Leading Indicators | Observability | High |
| 2 | No Baseline Period Before Setting Alert Thresholds | Operations | High |
| 3 | Storing All Raw Metrics Indefinitely | Performance | Medium |
| 4 | Not Correlating Metrics Across Layers | Observability | Medium |
| 5 | Blocking Metric Collection on the Critical Path | Performance | High |

---

## Anti-Pattern 1: Tracking Only Error Rates, Not Leading Indicators

### Category
Observability

### Description
Monitoring only lagging indicators (error rate, failure count) for API integrations while ignoring leading indicators (rate limit headroom, retry rate, queue wait time) that provide early warning of degradation.

### Why It Happens
Error rates are the most visible metric: they directly show failures. Developers set up monitoring for what is obviously broken (4xx, 5xx) without considering what starts breaking before the failure.

### Warning Signs
- Dashboards show only "requests failed" and "error rate" per integration
- No metrics for rate limit headroom (remaining requests in current window)
- No retry rate tracking (percentage of requests requiring retry)
- Queue wait times are not monitored for integration queues
- The first sign of trouble is always a full failure (error rate spike), never a gradual degradation

### Why Harmful
By the time error rates spike, the integration is already failing. Leading indicators (rate limit headroom dropping, retry rate increasing, queue wait time growing) signal degradation before failures occur. Without them, operators react to failures instead of preventing them.

### Real-World Consequences
- Rate limit headroom drops gradually over a week (90% → 20%)
- No metric tracks headroom; no one notices
- Application hits the rate limit; all payment processing stops
- Error rate spikes; operations team alerted
- Incident duration: 45 minutes (time to identify, investigate, and raise limits)
- If headroom was monitored: alert would have fired 4 days ago at 30%, giving time to request limit increase

### Preferred Alternative
Track both leading and lagging indicators. Rate limit headroom, retry rate, circuit breaker state, and queue wait times provide early warning.

```php
class IntegrationMetricsCollector {
    public function recordSuccess(string $service, float $duration, array $rateLimitHeaders): void {
        Monitor::increment("integration.{$service}.success");
        Monitor::timing("integration.{$service}.latency", $duration);
        
        // Leading indicators
        if ($remaining = $rateLimitHeaders['X-RateLimit-Remaining'] ?? null) {
            Monitor::gauge("integration.{$service}.rate_limit_remaining", $remaining);
        }
        
        if ($this->wasRetry($duration)) {
            Monitor::increment("integration.{$service}.retry_count");
        }
    }
    
    public function recordCircuitBreakerState(string $service, string $state): void {
        Monitor::gauge("integration.{$service}.circuit_breaker", $state);
    }
}
```

### Refactoring Strategy
1. Identify leading indicators per integration (rate limit headers, retry counts, circuit breaker state)
2. Add metrics collection for each leading indicator
3. Create dashboard panels for leading indicators alongside error rates
4. Set alert thresholds on leading indicators (headroom < 20%, retry rate > 10%)
5. Correlate leading indicator trends with incident timeline

### Detection Checklist
- [ ] Rate limit headroom is tracked per integration
- [ ] Retry rate (percentage of requests retried) is measured
- [ ] Circuit breaker state transitions are recorded
- [ ] Queue wait times are monitored for integration queues
- [ ] Leading indicator alerts are configured separately from error rate alerts
- [ ] Leading indicators show degradation before error rates spike

### Related Rules/Skills/Trees
- Rule: Track both client-side and server-side metrics
- Rule: Monitor leading indicators (rate limit headroom, retry rate) not just lagging
- Related KU: Circuit breaker state monitoring

---

## Anti-Pattern 2: No Baseline Period Before Setting Alert Thresholds

### Category
Operations

### Description
Setting integration metric alert thresholds without first establishing a baseline of normal operating behavior, resulting in thresholds that are either too strict (constant false alarms) or too loose (never alert).

### Why Happens
Alert thresholds must be configured before or during deployment. Teams estimate thresholds based on assumptions rather than data, and skip the baseline collection phase.

### Warning Signs
- Alert thresholds are configured on day 1 of deployment
- Threshold values are round numbers (5%, 100ms, 10 requests) with no data basis
- Alerts fire constantly in the first week (thresholds too strict for actual patterns)
- Or: no alerts ever fire (thresholds too loose for actual error levels)
- Baseline metrics were never collected before alert configuration
- Threshold adjustments are reactive (only changed after an alert storm)

### Why Harmful
Without baseline data, thresholds are arbitrary. Too-strict thresholds cause alert fatigue and wasted investigation time. Too-loose thresholds miss real issues. Both erode trust in monitoring.

### Real-World Consequences
- Latency threshold set to 500ms based on assumption; p50 latency is 800ms normally
- Alert fires every 2 minutes; operations team disables the alert after 3 days
- Real latency spike to 5 seconds goes undetected because the alert was disabled
- Error rate threshold set to 0.1%; actual normal error rate varies between 0.5-1.5%
- Alert never fires for genuine errors because the threshold is below normal baseline

### Preferred Alternative
Collect baseline metrics for at least 2 weeks before setting alert thresholds. Use statistical methods (percentiles, rolling windows) to set thresholds based on actual data.

```php
class BaselineThresholdCalculator {
    public function calculateThreshold(string $service, string $metric): float {
        $baseline = collect(/* last 2 weeks of metrics */);
        
        $p50 = $baseline->median();
        $p95 = $baseline->percentile(95);
        $stddev = $baseline->stdDev();
        
        return match ($metric) {
            'latency' => $p95 + ($stddev * 2), // Alert at 2 stddev above p95
            'error_rate' => $p50 + ($stddev * 3),
            'rate_limit_headroom' => $p50 - ($stddev * 2), // Alert when headroom drops
            default => $p95,
        };
    }
}
```

### Refactoring Strategy
1. Begin collecting all integration metrics immediately (even without threshold configuration)
2. After 2 weeks, analyze metric distributions (p50, p95, p99, stddev)
3. Set initial thresholds at p95 + 2x stddev for latency, similar for other metrics
4. Review alert frequency weekly for the first month; adjust thresholds
5. Document threshold values and the baseline data they were derived from

### Detection Checklist
- [ ] Baseline metrics were collected for at least 2 weeks before threshold configuration
- [ ] Threshold values are based on statistical analysis of baseline data
- [ ] Alert frequency is reviewed weekly after initial deployment
- [ ] Thresholds are documented with baseline reference
- [ ] Seasonal patterns (peak hours, weekends) are considered in baseline

### Related Rules/Skills/Trees
- Rule: Set alert thresholds based on baseline data (first 2 weeks of operation)
- Rule: No baseline period before setting alert thresholds
- Related KU: Site reliability engineering (SLO/SLI establishment)

---

## Anti-Pattern 3: Storing All Raw Metrics Indefinitely

### Category
Performance

### Description
Keeping every raw integration metric data point forever without any retention policy, aggregation, or downsampling, causing unbounded storage growth.

### Why Happens
Metrics systems (Pulse, Prometheus, custom database) store everything by default. Storage is cheap — until it isn't. Developers don't plan for data retention until storage runs out.

### Warning Signs
- Metrics database grows every month with no retention limit
- Pulse snapshots from 6 months ago are still in Redis
- Dashboard queries over "all time" take progressively longer
- Storage costs for metrics data increase monthly
- No archive/aggregation/downsample pipeline exists
- Data retention policy is "keep everything"

### Why Harmful
Raw metrics at full resolution (per-request) are only valuable for recent debugging. Metrics from 6 months ago at per-request granularity are never queried but consume storage and slow down queries. Unbounded storage costs money, uses memory/disk, and degrades query performance.

### Real-World Consequences
- Integration metrics stored at per-request granularity for 18 months
- Database size: 500GB for metrics alone
- Backup takes 4 hours; restore would take 8+ hours
- Monthly storage cost: $500
- Dashboard queries on historical data time out
- Solution: delete all data older than 30 days, losing valuable trend data

### Preferred Alternative
Implement a tiered retention policy: full granularity for recent data (7-30 days), aggregated hourly/daily for medium-term (90 days), and monthly rollups for long-term (1+ years).

```php
class MetricsRetentionPolicy {
    public function prune(): void {
        // Delete raw per-request metrics older than 30 days
        RawMetric::where('created_at', '<', now()->subDays(30))->delete();
        
        // Compute hourly aggregates before deletion
        HourlyAggregate::updateOrCreate(
            ['service' => $service, 'hour' => $hour],
            ['p50_latency' => $p50, 'p95_latency' => $p95, 'total_requests' => $count]
        );
        
        // Delete hourly aggregates older than 90 days
        HourlyAggregate::where('hour', '<', now()->subDays(90))->delete();
        
        // Monthly rollups are kept for 2 years
        MonthlyRollup::updateOrCreate(
            ['service' => $service, 'month' => $month],
            ['p95_latency' => $monthlyP95, 'total_errors' => $monthlyErrors]
        );
    }
}
```

### Refactoring Strategy
1. Define retention tiers: raw (7-30d), hourly (90d), daily (1y), monthly (2y+)
2. Implement downsampling aggregation pipeline (hourly/daily/monthly rollups)
3. Add scheduled pruning job that deletes raw data beyond retention
4. Verify query performance on aggregated data meets dashboard needs
5. Archive monthly rollups to cold storage for compliance if needed

### Detection Checklist
- [ ] Raw metrics retention period is defined (not indefinite)
- [ ] Aggregation pipeline produces hourly/daily/monthly summaries
- [ ] Scheduled pruning job runs and deletes expired raw data
- [ ] Dashboard queries use aggregated data for historical views
- [ ] Storage growth is linear with retention window, not cumulative

### Related Rules/Skills/Trees
- Rule: Storing all raw metrics indefinitely (unbounded storage growth)
- Rule: Pulse snapshot storage: ~100 bytes per snapshot per queue
- Related KU: Metrics storage and retention best practices

---

## Anti-Pattern 4: Not Correlating Metrics Across Layers

### Category
Observability

### Description
Monitoring integration metrics in isolation (HTTP error rate, queue throughput, webhook delivery success) without correlating them across layers to understand the full impact chain.

### Why Happens
Each metric is collected by a different system component (HTTP client watcher, queue monitor, webhook tracker). These are viewed separately in different dashboards without cross-referencing.

### Warning Signs
- HTTP error rate dashboard is separate from queue wait time dashboard
- Webhook delivery success rate is monitored by a different team than API integration metrics
- No single dashboard shows the full "integration health" picture
- Incident investigations require switching between 3+ dashboards
- Causal relationships between layer metrics are unknown (does HTTP latency → queue wait time?)

### Why Harmful
Integration failures cascade across layers: an upstream API slowdown causes HTTP latency, which causes queue job wait times to increase, which causes webhook delivery delays. Without cross-layer correlation, operators see the symptoms separately but cannot connect them to the root cause.

### Real-World Consequences
- Stripe API latency increases from 200ms to 2s (p95)
- HTTP error rate stays normal (requests still succeed, just slower)
- Queue wait time for webhook jobs increases: jobs take 2s longer → processing 5,000 webhooks delays by 3 hours
- Webhook delivery SLO breached: "delivered within 5 minutes" now takes 3+ hours
- Three different teams investigate: HTTP team sees no errors, queue team sees high wait time but no root cause, webhook team sees delayed delivery
- Root cause (Stripe latency) takes 4 hours to identify across teams
- If correlated: one dashboard shows Stripe latency → queue wait time → delivery delay → solve in 30 minutes

### Preferred Alternative
Build a cross-layer integration health dashboard that correlates metrics from HTTP client, queue, and webhook layers.

```php
class CrossLayerCorrelation {
    public function correlate(): array {
        return [
            'upstream' => [
                'stripe_latency_p95' => $this->httpMetrics->latencyP95('stripe'),
                'stripe_error_rate' => $this->httpMetrics->errorRate('stripe'),
            ],
            'queue' => [
                'webhook_queue_wait_time' => $this->queueMetrics->avgWaitTime('webhooks'),
                'webhook_queue_depth' => $this->queueMetrics->depth('webhooks'),
            ],
            'delivery' => [
                'webhook_delivery_success' => $this->webhookMetrics->deliverySuccessRate(),
                'webhook_retry_rate' => $this->webhookMetrics->retryRate(),
            ],
            'correlation' => [
                'upstream_latency_impact' => $this->calculateLatencyImpact(),
                'queue_backpressure_alert' => $this->detectBackpressure(),
            ],
        ];
    }
}
```

### Refactoring Strategy
1. Identify all available metrics layers (HTTP, queue, webhook, circuit breaker)
2. Create a single "Integration Health" dashboard with panels from all layers
3. Add correlation markers: when HTTP latency spikes, highlight queue and delivery panels
4. Train operators to read cross-layer patterns (latency → wait time → delivery delay)
5. Automate correlation: when multiple layer metrics deviate simultaneously, fire a consolidated alert

### Detection Checklist
- [ ] Integration health dashboard shows metrics from all layers
- [ ] Cross-layer correlation is visible within a single view
- [ ] Operators can trace from symptom (delivery delay) to root cause (upstream latency)
- [ ] Consolidated alerts consider multiple layer deviations
- [ ] Correlation analysis is used in post-incident reviews

### Related Rules/Skills/Trees
- Rule: Correlate integration metrics with business metrics
- Rule: Tracking only error rates, not leading indicators
- Related KU: Observability and monitoring (multi-layer tracing)

---

## Anti-Pattern 5: Blocking Metric Collection on the Critical Path

### Category
Performance

### Description
Collecting integration metrics synchronously within the HTTP request path, adding latency and failure risk to the critical integration code path.

### Why Happens
Metrics instrumentation is added inline with the integration code. Developers call monitoring functions directly in the service class, treating them as fast and reliable.

### Warning Signs
- Metrics recording functions are called inline with API response handling
- Metrics storage failure (Redis down, database slow) causes integration code to also fail
- Integration latency includes metrics collection time
- Memory profile shows metrics-related objects persisting during API calls
- Metrics are collected synchronously even for high-throughput endpoints

### Why Harmful
If metrics collection blocks the request path, any metrics infrastructure issue cascades into integration failures. A slow Redis instance makes API calls slow. A full metrics database causes integration errors. The observability system becomes a failure vector.

### Real-World Consequences
- Redis instance used for metrics collection experiences a latency spike
- Each metric recording takes 500ms instead of 1ms
- Integration endpoint that makes 3 API calls records 6 metrics, adding 3 seconds of latency
- Application performance degrades; operators investigate everything except metrics
- Root cause: metrics collection on the critical path turns a monitoring tool into a performance killer

### Preferred Alternative
Use async metric collection: queue metric recording or use in-memory aggregation with periodic flush.

```php
// Wrong: Synchronous metric recording on critical path
class PaymentService {
    public function process(array $data): void {
        $start = microtime(true);
        $response = $this->stripe->charge($data);
        
        // This blocks the response!
        Monitor::timing('stripe.charge', (microtime(true) - $start) * 1000);
        Monitor::increment('stripe.charge.count');
        
        return $response;
    }
}

// Correct: Async metric recording
class PaymentService {
    public function process(array $data): void {
        $response = $this->stripe->charge($data);
        
        // Dispatch metric recording to queue — returns immediately
        RecordMetrics::dispatch('stripe.charge', [
            'duration' => $response->duration,
            'status' => $response->status,
        ])->onQueue('metrics');
        
        return $response;
    }
}
```

### Refactoring Strategy
1. Audit all inline metric collection on integration critical paths
2. Move metric recording to queue jobs or async event listeners
3. Use in-memory counters (atomic increments) where queue overhead is too high
4. Implement batch metric flush (collect N events or every T seconds)
5. Add circuit breaker for metrics collection: if metrics system is slow, skip collection

### Detection Checklist
- [ ] Metric recording does not block the integration request path
- [ ] Metrics system failure does not cause integration failures
- [ ] High-throughput integrations use async or batched metric recording
- [ ] Metrics collection overhead does not appear in integration latency measurements
- [ ] Circuit breaker prevents metrics system issues from affecting integrations

### Related Rules/Skills/Trees
- Rule: Avoid blocking metric collection on critical path; use async recording
- Rule: Metric collection adds <1ms overhead per request (if async)
- Related KU: Observability tooling performance
