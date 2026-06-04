## Set memory_limit based on profiled peak usage
---
Category: Performance
---
Use `memory_get_peak_usage(true)` to measure the actual peak across varied requests, then set `memory_limit` to 2× that value.
---
Reason: A 2× safety margin accommodates fragmentation, request variation, and allocation spikes without masking genuine leaks.
---
Bad Example:
```php
// Setting without profiling
ini_set('memory_limit', '256M'); // Arbitrary
```

Good Example:
```php
// Set after profiling: peak was 48MB
ini_set('memory_limit', '128M'); // 2× safety margin
```
---
Exceptions: Memory-constrained containers may require a tighter margin (1.5×) with active monitoring.
---
Consequences Of Violation: Too low causes fatal errors; too high masks leaks and wastes capacity.

## Keep PHP memory_limit below container cgroup limit
---
Category: Operations
---
In containerized deployments, set `memory_limit` to no more than 75-80% of the container's `resources.limits.memory`.
---
Reason: Container OOM kills (SIGKILL) terminate the entire pod without cleanup. PHP OOM terminates only the request with a logged error.
---
Bad Example:
```php
// Container limit: 256MB, PHP limit: 256MB
// One request hitting the limit OOMs the pod
```

Good Example:
```php
// Container limit: 256MB, PHP limit: 192MB
// PHP OOM kills the request; container reserves 64MB safety margin
```
---
Exceptions: Single-process containers (CLI scripts) can set equal limits since there is no concurrency.
---
Consequences Of Violation: Cascading container OOM kills, pod restarts, 503 errors under memory pressure.

## Segregate memory_limit by SAPI and workload
---
Category: Architecture
---
Assign distinct `memory_limit` values per pool (web, queue, CLI) rather than relying on a single global php.ini setting.
---
Reason: Web workers need low limits for high concurrency; queue workers need high limits for heavy payloads. A single limit penalizes one or the other.
---
Bad Example:
```php
// Single php.ini: memory_limit = 128M
// Queue worker processing 200MB file fails
```

Good Example:
```php
// www pool: php_admin_value[memory_limit] = 128M
// queue pool: php_admin_value[memory_limit] = 512M
```
---
Exceptions: Applications with no queue processing can use a single limit.
---
Consequences Of Violation: Queue jobs fail unnecessarily, or web workers waste RAM on over-provisioned limits.

## Monitor per-worker RSS trend, not just per-request peak
---
Category: Operations
---
Track worker RSS (resident set size) over time, especially in persistent runtimes like Octane. Alert when RSS exceeds 80% of memory_limit for more than 15 minutes.
---
Reason: Per-request peak is a snapshot. RSS trend reveals cumulative fragmentation, leaks, and whether recycling is keeping pace.
---
Bad Example:
```php
// Only checking memory_get_peak_usage during request
$peak = memory_get_peak_usage(true); // Looks fine per request
// But worker RSS grows 10% per 1000 requests
```

Good Example:
```php
// Monitor worker RSS from FPM status page or Octane metrics
// Alert: worker_rss / memory_limit > 0.8
// Action: reduce max_requests or cap memory growth
```
---
Exceptions: PHP-FPM workers are recycled per request; RSS trend matters only for long-lived workers.
---
Consequences Of Violation: Silent memory growth until worker OOM or swap thrashing degrades all workers on the host.

## Apply memory budget formula in capacity planning
---
Category: Architecture
---
Use the formula `pm.max_children = (available_RAM × target_utilization) / memory_limit` to derive worker count from memory budget.
---
Reason: Total RSS across all workers must fit within available RAM plus headroom for OS, cache, and other processes.
---
Bad Example:
```php
// pm.max_children = 50 on 4GB server with 256M limit
// 50 × 256M = 12.8GB — impossible, triggers swap
```

Good Example:
```php
// 4GB RAM × 0.7 utilization = 2.8GB
// 2.8GB / 128M limit = 22 children max
// pm.max_children = 22
```
---
Exceptions: IO-bound applications may be constrained by CPU or connections before memory.
---
Consequences Of Violation: Swap thrashing, OOM kills, or under-utilized hardware.
