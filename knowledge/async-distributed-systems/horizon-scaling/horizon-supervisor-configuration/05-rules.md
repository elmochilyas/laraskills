# Rule Card: K041 — Horizon Supervisor Configuration

---

## Rule 1

**Rule Name:** set-max-jobs-and-max-time

**Category:** Always

**Rule:** Always set `maxJobs` and `maxTime` on all supervisors.

**Reason:** PHP processes accumulate memory over time — recycling workers prevents OOM crashes.

**Bad Example:**
```php
'supervisor-default' => [
    // No maxJobs or maxTime — worker lives forever, memory grows unbounded
],
```

**Good Example:**
```php
'supervisor-default' => [
    'maxJobs' => 500,  // Restart after 500 jobs
    'maxTime' => 3600, // Restart after 1 hour
],
```

**Exceptions:** Stateless jobs with no memory accumulation (rare in practice).

**Consequences Of ViolATION:** A worker processes 5000 jobs over 8 hours — PHP's memory grows from 20MB to 200MB. Eventually, the process hits the `memory_limit` and is killed mid-job.

---

## Rule 2

**Rule Name:** isolate-queue-types-in-supervisors

**Category:** Always

**Rule:** Always use one supervisor per queue type.

**Reason:** Different job types have different resource requirements — isolation prevents one workload from starving another.

**Bad Example:**
```php
'supervisor-default' => [
    'queue' => ['webhooks', 'emails', 'reports'], // Mixed — one config for all types
],
```

**Good Example:**
```php
'supervisor-webhooks' => ['queue' => ['webhooks'], 'timeout' => 60, 'tries' => 3],
'supervisor-emails'   => ['queue' => ['emails'],   'timeout' => 120, 'tries' => 1],
'supervisor-reports'  => ['queue' => ['reports'],  'timeout' => 600, 'tries' => 1],
```

**Exceptions:** Small applications with one or two queue types can share a supervisor.

**Consequences Of Violation:** A report generation job (timeout 600s) and a webhook job (timeout 60s) share the same supervisor. A report job takes 300s — it blocks a worker, reducing capacity for webhooks. The shared timeout setting causes premature termination of report jobs.

---

## Rule 3

**Rule Name:** add-horizon-terminate-to-deploy

**Category:** Always

**Rule:** Always run `horizon:terminate` in deployment scripts.

**Reason:** Without graceful termination, workers continue running old code until manually restarted.

**Bad Example:**
```bash
# Deploy script — no horizon restart
git pull
composer install
```

**Good Example:**
```bash
php artisan horizon:termininate  # Graceful — workers finish current job, then restart
```

**Exceptions:** None — every deploy should terminate Horizon.

**Consequences Of Violation:** New queue job logic is deployed — but workers continue running the old version's code for hours. Users report features not working as expected, but code inspection shows the new logic is correct.

---

## Rule 4

**Rule Name:** use-nice-for-cpu-priority

**Category:** Prefer

**Rule:** Prefer setting `nice` for CPU priority isolation.

**Reason:** `nice` influences OS process scheduling — give interactive jobs higher priority than batch.

**Bad Example:**
```php
'supervisor-webhooks' => ['nice' => 0], // Same priority as everything
```

**Good Example:**
```php
'supervisor-webhooks' => ['nice' => 0],   // Highest priority — user-facing
'supervisor-reports'  => ['nice' => 19],  // Lowest priority — batch
```

**Exceptions:** Single-type workloads where all jobs have equal priority.

**Consequences Of ViolATION:** Report generation (CPU-intensive) and webhook processing (latency-sensitive) run at equal priority — during report generation, webhook response times degrade, causing user-facing delays.
