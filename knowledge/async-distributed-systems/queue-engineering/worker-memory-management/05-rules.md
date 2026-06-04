## Rule 1: Always Set --memory Limit on Workers
---
## Category
Reliability | Performance
---
## Rule
Always set `--memory` on every queue worker command to prevent unbounded memory growth from crashing the process.
---
## Reason
The `--memory` limit is checked after each job — a worker that exceeds the threshold exits cleanly. Without it, RSS grows until OOM, killing the worker and potentially corrupting current job state.
---
## Bad Example
```bash
php artisan queue:work redis --sleep=3 --tries=3
; no --memory limit — RSS grows until OOM
```
---
## Good Example
```bash
php artisan queue:work redis --sleep=3 --tries=3 --memory=256
; exits if RSS exceeds 256MB
```
---
## Exceptions
Local development with trivial jobs; short-lived workers in CI pipelines.
---
## Consequences Of Violation
OOM kills; process supervisor restart loops; potential data corruption from force-killed jobs.

## Rule 2: Rely on Worker Recycling (--max-jobs/--max-time), Not GC
---
## Category
Performance | Reliability
---
## Rule
Always set `--max-jobs` and `--max-time` on workers; do not rely on PHP garbage collection to manage memory.
---
## Reason
PHP's zend_mm does not return freed memory chunks to the OS — RSS stays high even after garbage collection. Only a process restart resets RSS to baseline.
---
## Bad Example
```bash
php artisan queue:work redis
; no --max-jobs or --max-time — relies on GC
```
---
## Good Example
```bash
php artisan queue:work redis --max-jobs=500 --max-time=3600
; worker restarts before memory becomes problematic
```
---
## Exceptions
Workers processing fewer than 50 jobs total (e.g., dev environments).
---
## Consequences Of Violation
Ever-growing worker RSS; eventual OOM; premature worker recycling required to recover memory.

## Rule 3: Use memory_get_usage(true) When Monitoring Manually
---
## Category
Performance | Maintainability
---
## Rule
Always pass `true` to `memory_get_usage()` when checking worker memory — use the real memory usage, not the internal allocator's.
---
## Reason
`memory_get_usage(false)` reports memory allocated by zend_mm internally, not RSS. `memory_get_usage(true)` reports actual physical memory used — the same measure the `--memory` limit uses.
---
## Bad Example
```php
$used = memory_get_usage(false); // reports lower than actual RSS
```
---
## Good Example
```php
$used = memory_get_usage(true); // matches what --memory checks
```
---
## Exceptions
No common exceptions. Always use the `true` parameter.
---
## Consequences Of Violation
Underestimating actual memory usage; false sense of safety when monitoring worker health.

## Rule 4: Dedicate Separate Supervisors for Memory-Intensive Jobs
---
## Category
Scalability | Reliability
---
## Rule
Run memory-intensive jobs (reports, media processing, data export) on dedicated supervisor groups with higher `--memory` limits than standard workers.
---
## Reason
A job requiring 256MB for data processing will crash a 128MB-limited worker shared with lightweight jobs. Separate supervisors allow independent tuning per workload type.
---
## Bad Example
```bash
# One supervisor for all jobs — memory-intensive and lightweight mixed
command=php artisan queue:work redis --memory=128
```
---
## Good Example
```bash
# Lightweight jobs supervisor
command=php artisan queue:work redis --queue=default --memory=128
# Memory-intensive jobs supervisor
command=php artisan queue:work redis --queue=reports --memory=512
```
---
## Exceptions
When all jobs have homogeneous memory profiles.
---
## Consequences Of Violation
Memory-intensive jobs crash shared workers; otherwise-healthy lightweight jobs evicted by OOM due to co-located heavy jobs.
