# Metric Cost Optimization — Rules

## R1: Limit Custom Metrics to 50 Per Service

**Category**: Metric Governance

**Rule**: ALWAYS limit the number of custom metrics to 50 per service. NEVER create custom metrics without a documented use case (dashboard or alert that uses them).

**Reason**: Each custom metric costs $0.30/metric/month (CloudWatch) or $0.05/metric/month (Datadog beyond allocation). 500 metrics costs $150-250/month. 50 metrics costs $15-25/month. The observability value curve is logarithmic — the first 20 metrics (CPU, memory, request rate, error rate, latency p50/p95/p99, queue depth, etc.) provide 90% of signal. Metrics 51-500 provide the remaining 10%. Unused metrics (defined but never viewed or alerted on) provide 0% value at 100% cost.

**Bad Example**: A Laravel team creates custom metrics for every database query type (SELECT, INSERT, UPDATE, DELETE) per table (50 tables = 200 metrics), every cache operation (10 metrics), every queue job type (20 metrics), and every external API call (30 metrics). Total: 260 custom metrics at $0.30 = $78/month. Most are never viewed after creation.

**Good Example**: The team limits custom metrics to 40: 5 business metrics (orders, revenue, registrations, churn, ARPU), 15 technical metrics (CPU, memory, request rate, error rate, p50/p95/p99 latency, queue depth, cache hit ratio, DB connection count), 20 additional per the service's specific needs. Monthly cost: $12/month.

**Exceptions**: Business-critical metrics (compliance monitoring, revenue tracking) may exceed 50 per service with documented justification. Review and prune quarterly.

**Consequences Of Violation**: Metric costs scale with the number of metrics added, not with the value they provide. Teams eventually have $200-500/month in metric costs, with 80% of metrics never used.

---

## R2: Use Scout APM for Laravel-Specific Metrics — Not Custom CloudWatch Metrics

**Category**: Tool Selection

**Rule**: ALWAYS use Scout APM for Laravel-specific instrumentation (query performance, N+1 detection, cache hit rates, Octane worker metrics). NEVER recreate Laravel-specific metrics as CloudWatch custom metrics.

**Reason**: Scout APM provides 30+ Laravel-optimized metrics (N+1 query count, query time breakdown, cache performance, queue throughput, Octane worker stats) for a single flat price ($39-299/month). Recreating the same observability in CloudWatch custom metrics would require 30+ metrics x 5 dimensions = 150+ custom metrics at $45/month, plus significant engineering time to instrument. Scout's per-host pricing makes it dramatically cheaper for Laravel observability.

**Bad Example**: A team instruments Laravel query performance manually: custom CloudWatch metrics for `laravel.query.count`, `laravel.query.time`, `laravel.query.n_plus_one_count`, `laravel.cache.hit_ratio`, `laravel.queue.duration` = 5 metrics x 20 endpoint groups = 100 custom metrics at $30/month. Plus engineering time to write and maintain instrumentation code: 2 weeks.

**Good Example**: The team installs Scout APM ($99/month for mid-scale). Scout auto-instruments all query metrics, N+1 detection, cache performance, and queue monitoring. Zero engineering time for instrumentation. Same visibility, lower cost.

**Exceptions**: For business-specific metrics (revenue, orders, user registrations) that Scout does not track, use CloudWatch custom metrics. Scout covers technical performance; custom metrics cover business observability.

**Consequences Of Violation**: Significant engineering time spent recreating instrumentation that Scout provides out of the box. Higher per-metric costs for Laravel-specific visibility.

---

## R3: Aggregate High-Cardinality Data Before Emitting Metrics

**Category**: Cardinality Control

**Rule**: ALWAYS aggregate high-cardinality data (per-endpoint, per-user, per-request) into percentile metrics in application code before emitting. NEVER emit individual data points with high-cardinality dimensions.

**Reason**: Emitting each request's latency as a separate data point creates a new metric time series per unique dimension combination. If you emit `request.latency` with dimension `endpoint`, and you have 200 endpoints, that's 200 metrics instead of 1. Using a dimension like `user_id` would create metric count = number of users — instantly thousands. Aggregating to p50/p95/p99 in application code produces 3 metrics regardless of endpoint count.

**Bad Example**: A team emits `api.response_time` with dimensions `endpoint` and `status_code`. With 100 endpoints and 5 status codes each = 500 metric combinations. Monthly cost: 500 x $0.30 = $150/month.

**Good Example**: The team computes percentiles in the application: every 60 seconds, calculate p50, p95, p99 response time across all requests for each endpoint group (e.g., "checkout" group, "product" group, "user" group = 10 groups). Emit 30 metrics (10 groups x 3 percentiles). Monthly cost: $9/month. Same signal, 94% cost reduction.

**Exceptions**: For real-time alerting on specific endpoints, track a limited set of critical endpoints (top 5 by traffic) individually. Aggregate the remaining 95%.

**Consequences Of Violation**: Metric cost explosion from high cardinality. A $10/month metric bill becomes $500+/month as endpoints multiply, with no increase in actionable signal.

---

## R4: Set Metric Resolution to Standard (1-Minute) Unless Justified

**Category**: Resolution Management

**Rule**: ALWAYS use standard (1-minute) metric resolution for the majority of metrics. ONLY use high-resolution (1-second) for latency-sensitive alerting on a small subset.

**Reason**: High-resolution metrics (1-second) cost approximately 2x more than standard resolution (1-minute) in CloudWatch. Business metrics (revenue, user registrations), capacity metrics (CPU, memory utilization), and error rates do not change meaningfully within a 1-second window. 1-minute resolution captures the trend, triggers alerts when thresholds are breached, and costs half as much.

**Bad Example**: A team enables high-resolution (1-second) for all 200 custom metrics, thinking "more data is better." Monthly metric cost: $120 (2x $60 standard). They use 1-second data for trend graphs where 1-minute would show the same line. Zero benefit from the additional resolution.

**Good Example**: 190 of 200 metrics use standard resolution (1-minute). 10 critical metrics (p99 latency, error rate, payment success rate) use high-resolution (1-second) for fast alerting. Monthly metric cost: $63. Alert response time for critical metrics: same as with all-high-resolution.

**Exceptions**: Metrics used for real-time Auto Scaling decisions (scale-out within 30 seconds of traffic spike) may need high-resolution. Most auto scaling uses 1-minute metrics with 3 evaluation periods — high-resolution adds no benefit.

**Consequences Of Violation**: Paying 2x for metric resolution that provides zero additional value. For 200 metrics, the unnecessary premium is $60/month ($720/year).

---

## R5: Conduct Quarterly Metric Audit — Remove Unused Metrics

**Category**: Metric Lifecycle

**Rule**: ALWAYS audit custom metrics quarterly. Remove any metric that has not been viewed on a dashboard or triggered an alert in the past 90 days.

**Reason**: Custom metrics accumulate over time as developers add instrumentation for temporary debugging, feature launches, or experiments. These "zombie metrics" continue costing $0.30/month each forever without providing value. After 2 years, a typical org has 30-50% unused metrics. A quarterly audit identifies and removes them, keeping the metric bill proportional to actual observability value.

**Bad Example**: A team has 400 custom metrics. Quarterly review of dashboards and alarms reveals that 180 metrics (45%) are not used in any dashboard or any alarm. These were added during a 3-month feature development sprint 18 months ago and never removed. Current monthly waste: 180 x $0.30 = $54/month ($648/year). The team just realized they've been paying for nothing for 18 months.

**Good Example**: The team reviews custom metrics every quarter. They remove 45 unused metrics this quarter (saving $13.50/month), 30 next quarter ($9/month), and maintain a steady-state of 50-60 active metrics. Monthly cost: $15-18/month. Metric cost is proportional to value.

**Exceptions**: Metrics used for seasonal analysis (reviewed annually) or compliance-mandated metrics should not be removed. Document and exempt them from the audit.

**Consequences Of Violation**: Metric bill grows 20-30% year-over-year from zombie metrics. After 3 years, a team is paying $200-500/month for metrics that nobody uses.
