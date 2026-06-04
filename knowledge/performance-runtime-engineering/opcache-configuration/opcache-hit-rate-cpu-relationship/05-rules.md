## Check OpCache hit rate first during any CPU investigation
---
Category: Maintainability
---
When investigating CPU spikes, always check OpCache hit rate before profiling application code.
---
Reason: An under-provisioned OpCache mimics a CPU-bound bottleneck. Lower hit rates directly increase CPU as the Zend Engine recompiles uncached files. Checking hit rate first prevents wasted investigation hours on application code.
---
Bad Example:
```php
// 10 hours profiling application code
// Actual cause: OpCache hit rate at 80% from undersized cache
```

Good Example:
```php
$status = opcache_get_status(false);
$hitRate = $status['opcache_statistics']['hit_rate'];
if ($hitRate < 99) {
    // Fix OpCache sizing before profiling application
}
```
---
Exceptions: Confirmed database or application-level CPU bottlenecks.
---
Consequences Of Violation: Wasted investigation hours on application code when OpCache is the root cause.

## Never throw more hardware at OpCache-induced CPU issues
---
Category: Scalability
---
Scale OpCache configuration (memory, max files) before adding servers. OpCache-induced CPU issues cannot be fixed by horizontal scaling.
---
Reason: An under-provisioned OpCache creates a compounding effect: higher traffic → more evictions → lower hit rate → higher CPU → slower requests → more concurrent requests → more evictions. Adding servers doesn't fix the root cause and multiplies infrastructure cost.
---
Bad Example:
```bash
# Doubling server count instead of fixing OpCache
# 10 servers all thrashing at 80% CPU from recompilation
```

Good Example:
```bash
# Fix OpCache sizing first
# One properly configured server handles the load
opcache.memory_consumption=512
opcache.max_accelerated_files=100000
```
---
Exceptions: Traffic growth beyond single-server capacity where scaling is genuinely needed after OpCache optimization.
---
Consequences Of Violation: Unnecessary infrastructure cost, continued CPU waste on all servers.
