## Match runtime selection to workload I/O profile, not just published benchmarks
---
Category: Design
---
Select Swoole for high-latency I/O workloads (>50ms database queries), RoadRunner or FrankenPHP for mixed or low-latency I/O, and treat published benchmark comparisons as directional only.
---
Reason: Each runtime has a specific I/O sweet spot. Swoole's coroutine model excels when queries take 50ms+ — coroutines yield during I/O wait, freeing the thread for other work. For sub-1ms queries, coroutine overhead (~1µs per yield) makes Swoole slower than alternatives. RoadRunner's goroutine scheduler handles all I/O profiles efficiently. FrankenPHP's thread model is best for simplicity-focused deployments. Published benchmarks use different hardware, frameworks, and methodologies that may not reflect your workload.
---
Bad Example:
```php
// Using Swoole for sub-1ms Redis lookups — coroutine overhead dominates
// Net performance regression vs FPM
```

Good Example:
```php
// Using RoadRunner for mixed low-latency API
// Goroutine scheduler handles all I/O efficiently
```
---
Exceptions: When operational simplicity (not throughput) is the primary decision driver, FrankenPHP should be chosen regardless of I/O profile.
---
Consequences Of Violation: Performance regression instead of improvement, wasted migration effort, team loses confidence in alternative runtimes.

## Run 24-hour soak tests before committing any alternative runtime to production
---
Category: Testing
---
Subject any alternative runtime to a minimum 24-hour soak test with production-representative traffic before approving it for production use.
---
Reason: Memory-resident runtimes can exhibit memory leaks, thread-safety bugs, and gradual performance degradation that only surface after hours of continuous operation. Short benchmarks (30 minutes) miss these failure modes entirely. A 24-hour soak reveals RSS growth trends, worker crash patterns, and OpCache behavior that determine whether a runtime can survive in production.
---
Bad Example:
```bash
# 30-minute benchmark — misses memory leaks
# Runtime approved, deployed to production, OOM after 8 hours
```

Good Example:
```bash
# 24-hour soak test
# Hour 1-6: stable RSS at 80MB/worker
# Hour 7-12: RSS growing 2MB/hour — memory leak detected
# Runtime rejected for this workload
```
---
Exceptions: A runtime already proven in production for other applications in the same organization may use a reduced soak duration (4-8 hours).
---
Consequences Of Violation: Undetected memory leaks cause production OOM incidents, emergency rollback to FPM, extended downtime during recovery.

## Start with RoadRunner for Laravel Octane unless specific requirements dictate otherwise
---
Category: Framework Usage
---
Choose RoadRunner as the default alternative runtime for Laravel Octane deployments due to its stability, documentation quality, and zero PHP extension requirement.
---
Reason: RoadRunner has the strongest Laravel integration, most extensive documentation for Octane, and requires no PHP extension compilation (unlike Swoole). It avoids the ZTS compatibility issues that affect FrankenPHP and the extension-dependency complexity of Swoole. For teams new to alternative runtimes, RoadRunner offers the lowest-risk path to 41-111% throughput improvement.
---
Bad Example:
```bash
# Starting with Swoole for Octane without evaluating RoadRunner first
# Extension compilation issues, CI/CD pipeline complexity underestimated
```

Good Example:
```bash
# Default to RoadRunner for Octane
composer require spiral/roadrunner:^2024
php artisan octane:start --server=roadrunner
```
---
Exceptions: If the application requires HTTP/3, automatic HTTPS, or minimal deployment complexity, FrankenPHP may be preferred. If the workload involves high-latency I/O (>50ms queries), Swoole may provide better gains.
---
Consequences Of Violation: Unnecessary complexity in first runtime adoption, extension-related issues delaying the migration, team frustration with setup difficulties.

## Never migrate an application to an alternative runtime without a documented rollback plan
---
Category: Reliability
---
Maintain a fully functional PHP-FPM deployment as a rollback target for at least two weeks after migrating to any alternative runtime.
---
Reason: Runtime migrations can fail from issues that only surface under production load — memory leaks, extension incompatibilities, performance regressions on specific traffic patterns. Without a rollback plan, a failed migration becomes a critical incident. A parallel FPM deployment with shared state enables instant rollback, allowing root cause analysis without production pressure.
---
Bad Example:
```bash
# FPM decommissioned immediately after migration
# Runtime OOM at hour 6 — no rollback possible
# Emergency re-deployment of FPM takes 4+ hours
```

Good Example:
```bash
# Parallel FPM deployment maintained for 2 weeks
# Runtime issue at hour 6 — traffic switched to FPM in minutes
# Root cause identified and fixed without extended outage
```
---
Exceptions: Greenfield applications with no existing FPM deployment do not need a rollback plan involving FPM.
---
Consequences Of Violation: Extended production outages during runtime issues, emergency infrastructure rebuild under crisis conditions, potential data loss or extended downtime.
