# Rule Card: K070 — Pulse Slow Job Recorder

---

## Rule 1

**Rule Name:** set-appropriate-slow-job-threshold

**Category:** Always

**Rule:** Always set the slow job threshold based on job type expectations, not global defaults.

**Reason:** A 10-second email send is normal — a 10-second cache warm is pathological.

**Bad Example:**
```php
// config/pulse.php — single threshold for all queues
'slow_threshold_ms' => 5000, // 5 seconds — too tight for emails, too loose for cache
```

**Good Example:**
```php
// Individual thresholds per recorder
'recorders' => [
    DefaultSlowJobRecorder::class => [
        'threshold_ms' => 5000, // 5s for default queue
    ],
    EmailSlowJobRecorder::class => [
        'threshold_ms' => 30000, // 30s for email — SMTP is slow
    ],
],
```

**Exceptions:** Homogeneous workloads where one threshold covers all job types.

**Consequences Of ViolATION:** The email queue shows 80% of jobs as "slow" — the threshold is 5s but SMTP delivery takes 10-15s. The Pulse dashboard is filled with false positives, and actual slow jobs in the webhook queue (normally 100ms, now taking 2s) are invisible.

---

## Rule 2

**Rule Name:** correlate-slow-jobs-with-resources

**Category:** Always

**Rule:** Always correlate slow job detection with resource monitoring.

**Reason:** A slow job is a symptom — the cause may be CPU starvation, memory pressure, or database contention.

**Bad Example:**
```php
// Monitoring slow jobs in isolation — no resource context
$pulse = new Pulse()
    ->record('slow_jobs', 1); // Knows what, not why
```

**Good Example:**
```php
// Combine with resource metrics:
// Pulse shows: slow_jobs = 5, server_cpu = 95%, db_query_time = 2s
// Correlation suggests: DB contention → high CPU → slow jobs
```

**Exceptions:** None — slow jobs without resource context are half the picture.

**Consequences Of ViolATION:** Pulse shows 50 slow jobs in the last hour — the team adds more queue workers (the intuitive fix). But the actual cause is a MySQL deadlock issue — more workers create more concurrent queries, making the deadlock worse. Worker count increases from 10 to 20, and slow jobs increase to 100.

---

## Rule 3

**Rule Name:** distinguish-between-consistent-and-sporadic

**Category:** Prefer

**Rule:** Prefer distinguishing between consistently slow jobs and sporadic outliers.

**Reason:** Consistently slow jobs need refactoring — sporadic slow jobs may indicate resource contention.

**Bad Example:**
```php
// All slow jobs treated the same — no triage
```

**Good Example:**
```php
// Consistent: a job always takes 5s — needs refactoring
// Sporadic: a job takes 100ms normally, 30s occasionally — resource contention
```

**Exceptions:** None — the triage strategy differs fundamentally.

**Consequences Of ViolATION:** A developer optimizes the `ProcessReport` job (always slow at 60s) — they speed it up to 30s. Meanwhile, the sporadic 30-second spikes in the `SendNotification` job (normally 100ms) remain uninvestigated, hiding a memory leak in the notification service.

---

## Rule 4

**Rule Name:** alert-on-slow-job-percentile-not-count

**Category:** Prefer

**Rule:** Prefer alerting on slow job percentile rather than raw count.

**Reason:** Raw count increases with traffic — percentile normalizes for volume.

**Bad Example:**
```php
// Alert on raw count
if ($slowJobCount > 50) { alert(); } // False alarm during peak traffic
```

**Good Example:**
```php
// Alert on percentile
if ($p95Runtime > 5000) { alert(); } // p95 of all jobs exceeds 5 seconds
```

**Exceptions:** Low-volume queues where percentiles aren't statistically significant.

**Consequences Of ViolATION:** During Black Friday, traffic is 10× normal — slow job count hits 100 (normally 10). The alert fires. But p95 runtime is 1s (normal). The system is healthy — raw count was a misleading metric.
