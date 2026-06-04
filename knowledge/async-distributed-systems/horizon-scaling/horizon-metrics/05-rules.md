# Rule Card: K047 — Horizon Metrics (Throughput, Runtime, Wait Time)

---

## Rule 1

**Rule Name:** use-wait-time-for-trends-not-slas

**Category:** Always

**Rule:** Always treat wait time as a trend indicator, not an SLA metric.

**Reason:** Wait time is estimated from average runtime — variable-duration jobs make it inaccurate.

**Bad Example:**
```php
// Treating wait time as absolute SLA
if ($waitTime > 60) { pageOnCall(); } // False alarm — wait time is an estimate
```

**Good Example:**
```php
// Trend-based alerting
if ($waitTime > 300 && $waitTime > $rollingAverage * 2) { alert(); }
```

**Exceptions:** Queues with uniform job durations where wait time closely matches reality.

**Consequences Of Violation:** A single 10-second outlier job raises the average runtime, doubling wait time for the entire queue — the alert fires even though no user-facing delay exists, causing unnecessary escalation.

---

## Rule 2

**Rule Name:** monitor-percentile-not-average

**Category:** Prefer

**Rule:** Prefer monitoring p95/p99 runtime over average runtime.

**Reason:** Averages hide outliers — a single 10s job in a sea of 100ms jobs skews the average.

**Bad Example:**
```php
// Monitoring average runtime
$avgRuntime = $metrics['runtime']; // 200ms — looks healthy
// Real p99: 5 seconds
```

**Good Example:**
```php
// Use Pulse or custom percentile monitoring
// Pulse automatically records p95, p99 runtime
```

**Exceptions:** Homogeneous workloads where all jobs have similar duration.

**Consequences Of Violation:** Average runtime stays at 200ms while p99 climbs to 5 seconds — the dashboard looks healthy, but users experience repeated 5-second delays before any alert fires.

---

## Rule 3

**Rule Name:** export-metrics-externally

**Category:** Prefer

**Rule:** Prefer exporting Horizon metrics to external storage for long-term trends.

**Reason:** Default 1-hour Redis retention is insufficient for weekly/monthly trend analysis.

**Bad Example:**
```php
'metrics' => ['trim' => ['jobs' => 60, 'queues' => 60]], // Only 1 hour of history
```

**Good Example:**
```php
// Export via Pulse, Prometheus, DataDog, etc.
// Use horizon:snapshot artisan command for programmatic export
```

**Exceptions:** Teams that only need real-time monitoring with no historical analysis.

**Consequences Of Violation:** A gradual throughput decline over 3 days goes unnoticed — hourly metrics are trimmed after 60 minutes, leaving no data to compare current performance against last week's baseline.

---

## Rule 4

**Rule Name:** account-for-metrics-reset

**Category:** Always

**Rule:** Always account for metrics reset after Horizon restart.

**Reason:** All metrics reset to zero — wait time shows 0 until runtime data accumulates (5-10 minutes).

**Bad Example:**
```php
// Auto-scaling triggers immediately after restart
// Wait time = 0 → balancer scales down → queue explodes
```

**Good Example:**
```php
// Implement a warmup period
// No scaling decisions for first 5 minutes after restart
```

**Exceptions:** None — every Horizon restart wipes in-memory runtime averages.

**Consequences Of ViolATION:** After a deploy, Horizon restarts with zero metrics. Wait time shows 0, the auto-balancer scales workers to minimum. Jobs accumulate for 5 minutes until runtime averages stabilize, causing a spike of late processing.
