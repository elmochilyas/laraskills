# Rule Card: K071 — Horizon Wait Time Monitoring

---

## Rule 1

**Rule Name:** monitor-wait-time-trends-not-spikes

**Category:** Always

**Rule:** Always monitor wait time trends, not individual spikes.

**Reason:** Wait time is estimated — brief spikes from normal variability cause false alarms.

**Bad Example:**
```php
// Alert on any wait time > 60 seconds
if ($waitTime > 60) { alert(); } // False alarm — transient spike
```

**Good Example:**
```php
// Alert on sustained wait time trend
if ($waitTime > 60 && $waitTime > $rollingAverage5min * 2) { alert(); }
```

**Exceptions:** SLA-backed queues where any breach must be escalated.

**Consequences Of ViolATION:** A burst of 50 webhooks arrives simultaneously — wait time spikes to 120 seconds for 10 seconds. The alert fires, the on-call team investigates, but by the time they look, wait time is back to 5 seconds. After 3 such false alarms, they start ignoring wait time alerts.

---

## Rule 2

**Rule Name:** understand-wait-time-limitations

**Category:** Always

**Rule:** Always understand that wait time is an estimate, not a guarantee.

**Reason:** Wait time formula `(depth × avg_runtime) / workers` uses average runtime — outliers skew it.

**Bad Example:**
```php
// Relying on wait time for SLA compliance reporting
$slaCompliant = $waitTime < 300; // False — wait time is estimated, not measured
```

**Good Example:**
```php
// Use actual job processing time for SLA compliance
$actualTime = $job->finished_at->diffInSeconds($job->queued_at);
$slaCompliant = $actualTime < 300; // Real measurement
```

**Exceptions:** None — wait time is always an estimate.

**Consequences Of ViolATION:** A single 60-second outlier job doubles the average runtime — wait time jumps from 100s to 200s, showing an SLA breach. But all other jobs processed within 10 seconds. The SLA report incorrectly flags the queue as non-compliant.

---

## Rule 3

**Rule Name:** use-wait-time-for-autoscaling

**Category:** Prefer

**Rule:** Prefer using wait time to trigger auto-scaling decisions.

**Reason:** Wait time directly measures user-facing delay — scaling based on it addresses actual bottlenecks.

**Bad Example:**
```php
// Scale based on queue depth — doesn't account for job duration
if ($depth > 1000) { scaleUp(); }
```

**Good Example:**
```php
// Scale based on wait time — accounts for both depth and duration
if ($waitTime > 300) { scaleUp(); } // Add workers when wait > 5 minutes
```

**Exceptions:** Queues with uniform job durations where depth alone is a reliable indicator.

**Consequences Of ViolATION:** Queue depth is 1000 (10ms jobs each, ~10 seconds to clear) — the depth-triggered scaler adds workers unnecessarily. Meanwhile, another queue has depth 100 (10s jobs each, ~1000 seconds to clear) — the depth-triggered scaler doesn't fire, and the queue starves.

---

## Rule 4

**Rule Name:** account-for-cold-start-after-restart

**Category:** Always

**Rule:** Always account for zero wait time after Horizon restarts.

**Reason:** All metrics reset — wait time shows 0 until runtime data accumulates.

**Bad Example:**
```php
// Auto-scaling after restart — wait time = 0 → scales down
// Jobs start accumulating immediately
```

**Good Example:**
```php
// Suppress auto-scaling for first 5 minutes after restart
if (now()->diffInMinutes($horizonStartedAt) < 5) {
    return; // Wait for metrics to stabilize
}
```

**Exceptions:** None — every restart wipes runtime averages.

**Consequences Of ViolATION:** After a deploy, Horizon restarts. Wait time is 0 for all queues — the auto-scaling system scales all workers to minProcesses. But 100,000 jobs are queued from the deploy downtime. Workers start processing at minimum capacity, building a backlog that takes 30 minutes to clear.
