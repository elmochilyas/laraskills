# Rule Card: K077 — Queue Priority via Multiple Queues

---

## Rule 1

**Rule Name:** prioritize-by-latency-sensitivity

**Category:** Prefer

**Rule:** Prefer defining priority based on user-facing latency sensitivity.

**Reason:** Priority should reflect how long users are willing to wait for different job types.

**Bad Example:**
```bash
# All jobs on the same queue — no differentiation
php artisan queue:work redis --queue=default
```

**Good Example:**
```bash
# Three priority tiers based on user impact
php artisan queue:work redis --queue=critical,default,bulk
```

**Exceptions:** Very simple applications with uniformly fast jobs may not need multi-queue priority.

**Consequences Of Violation:** A flood of report-generation jobs delays password reset emails — users experience inconsistent response times.

---

## Rule 2

**Rule Name:** no-comma-queue-for-sqs

**Category:** Never

**Rule:** Never use comma-separated `--queue` for SQS.

**Reason:** SQS queues are separate URLs — only the first URL in the comma-separated list is used.

**Bad Example:**
```bash
php artisan queue:work sqs --queue=critical,default,bulk
# Only "critical" is used — "default" and "bulk" ignored
```

**Good Example:**
```bash
# Separate worker processes per SQS queue URL
php artisan queue:work sqs --queue=https://sqs.us-east-1.amazonaws.com/.../critical
```

**Exceptions:** None — SQS does not support multiple queues per worker via comma-separated names.

**Consequences Of Violation:** Lower-priority queues never get processed — jobs in "default" and "bulk" accumulate indefinitely.

---

## Rule 3

**Rule Name:** separate-supervisors-per-tier

**Category:** Always

**Rule:** Always use separate Horizon supervisors per priority tier.

**Reason:** Shared supervisors mean a single worker pool serves all queues — a flood of high-priority jobs starves low-priority ones.

**Bad Example:**
```php
// config/horizon.php — single supervisor for all queues
'default' => [
    'connection' => 'redis',
    'queue' => ['critical', 'default', 'bulk'],
    'minProcesses' => 2,
    'maxProcesses' => 10,
],
```

**Good Example:**
```php
'high' => [
    'connection' => 'redis',
    'queue' => ['critical', 'default'],
    'balance' => 'auto',
    'minProcesses' => 2,
    'maxProcesses' => 10,
],
'low' => [
    'connection' => 'redis',
    'queue' => ['bulk'],
    'balance' => 'auto',
    'minProcesses' => 1,
    'maxProcesses' => 3,
],
```

**Exceptions:** Single-tier applications with uniform job priorities don't need multiple supervisors.

**Consequences Of Violation:** A surge of critical jobs can consume all workers — bulk jobs (report generation, data cleanup) never make progress.

---

## Rule 4

**Rule Name:** monitor-oldest-job-per-queue

**Category:** Prefer

**Rule:** Prefer monitoring oldest-job-age per queue, not just aggregate per connection.

**Reason:** Aggregate queue depth hides per-queue starvation — a bulk queue could have 10K jobs while critical is empty.

**Bad Example:**
```php
// Alerting on total queue depth — hides per-queue starvation
if ($totalJobs > 1000) { alert('Queue backlog'); }
```

**Good Example:**
```php
// Alerting per priority tier
foreach (['critical', 'default', 'bulk'] as $queue) {
    $oldest = getOldestJobAge($queue);
    if ($oldest > $thresholds[$queue]) { alert("$queue stalled"); }
}
```

**Exceptions:** Applications with only one queue don't need per-queue monitoring.

**Consequences Of Violation:** Bulk jobs may be starving for hours while aggregate depth looks healthy — data exports, reports, and cleanup jobs never complete.

---

## Rule 5

**Rule Name:** limit-priority-tiers

**Category:** Avoid

**Rule:** Avoid more than 3 priority tiers.

**Reason:** Each tier adds worker configuration, monitoring, and operational overhead with diminishing latency returns.

**Bad Example:**
```bash
# 6 priority tiers — excessive operational complexity
php artisan queue:work redis --queue=critical,high,medium,default,low,bulk
```

**Good Example:**
```bash
# 3 tiers — sufficient for most applications
php artisan queue:work redis --queue=critical,default,bulk
```

**Exceptions:** Large enterprise applications with strict SLA tiers may justify up to 5 tiers.

**Consequences Of Violation:** Configuration complexity increases, monitoring dashboards become noisy, and the marginal latency benefit per additional tier approaches zero.
