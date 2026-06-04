# Memory Limit Configuration — memory_limit Directive, Per-Request vs Process Limits, pm.max_children Relationship

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | Memory Limit Configuration — memory_limit Directive, Per-Request vs Process Limits, pm.max_children Relationship |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

PHP's `memory_limit` directive controls the maximum memory a single PHP process can allocate before a fatal error is thrown. In PHP-FPM, this is a per-request limit that resets with each request. In Octane/Swoole/FrankenPHP, it's a per-worker limit that accumulates across requests. The limit interacts critically with `pm.max_children` (PHP-FPM) and `num_workers` (Octane) — the product of worker count and per-worker memory must fit within available system RAM. Configuring memory limits correctly prevents silent OOM kills, swap thrashing, and 502 errors.

## Core Concepts

- **memory_limit**: PHP configuration directive. Hard limit on per-process memory allocation (including the Zend MM heap, extension allocations, and PHP internals). When exceeded, PHP throws a fatal error.
- **Per-request (PHP-FPM)**: The limit applies to a single request. After the request, the heap is destroyed and memory is freed. A single request exceeding the limit throws Fatal Error.
- **Per-worker (Octane)**: The limit applies to the worker process over its lifetime. Memory accumulates across requests. A worker that grows to exceed the limit is terminated.
- **pm.max_children (PHP-FPM)**: Maximum number of PHP-FPM worker processes. Total memory = max_children × per-worker memory (P95 RSS). Must be sized to fit within available RAM.
- **Worker count (Octane)**: Number of persistent workers. Total memory = workers × per-worker memory. Also limited by available RAM.
- **Reserved memory**: System memory reserved for OS, database, Redis, Nginx, and other services. Not available for PHP workers.
- **Safety factor**: Typically 1.2–1.5× to account for RSS variance. Formula: `max_children = (total_RAM - reserved_RAM) / (P95_RSS × safety_factor)`.

## When To Use

- You are configuring a new PHP server (bare metal, VM, or container).
- You are sizing PHP-FPM pool settings for production.
- You are configuring Octane worker counts for production.
- You are debugging OOM crashes or swap-related performance degradation.
- You are setting `memory_limit` for individual request isolation.

## When NOT To Use

- You are running a simple script or development environment — default limits suffice.
- You are on shared hosting where you cannot configure `memory_limit`.
- Your application has no memory constraints (e.g., CLI tools with ample RAM).
- You are just starting a project — use defaults initially, tune when metrics indicate need.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Set `memory_limit` to 2× the expected per-request peak | Provides headroom for request spikes without wasting resources on excessive limits. In Octane, this is the per-worker lifetime limit. |
| Set `php_admin_value[memory_limit]` in FPM pool config, not global php.ini | Pool-specific limits allow different applications (or different pools) to have different limits. |
| Calculate `pm.max_children` using P95 RSS, not average | P95 RSS accounts for variance. Average-based sizing fails under peak load, causing OOM. |
| Always include a safety factor (1.2–1.5×) in calculations | RSS varies with request complexity, concurrency, and data size. The safety factor prevents edge-case OOM. |
| Monitor P95 worker RSS in production | Track RSS distribution across workers. If P95 approaches `memory_limit`, increase limits or reduce worker count. |
| Use reserved memory calculation for system services | OS, database, Redis, Nginx, monitoring agents all need memory. Deduct this from total RAM before calculating worker budgets. |
| Set `memory_limit` lower in dev to catch leaks early | A tight limit causes early failure, making memory issues visible before production. |

## Architecture Guidelines

- **Total memory budget**: Total RAM = OS + services + (workers × per-worker RSS × safety factor). If the equation doesn't balance, reduce worker count or increase RAM.
- **Worker RSS baseline**: PHP-FPM: ~30–50MB per worker (includes framework). Octane: ~50–80MB per worker (higher due to persistent bootstrap). Grow up to 2× baseline over worker lifetime.
- **Swap threshold**: When total memory exceeds physical RAM, swap is used. PHP performance degrades 10–100× on swap. Never allocate more than 80% of physical RAM to PHP workers.
- **Container limits**: In Docker/K8s, set container memory limit to the per-worker budget × max workers in the container. `memory_limit` should be ≤ container memory limit.
- **memory_limit vs PM limit**: `memory_limit` is a PHP internal limit. PM limits control process count. Both must be configured consistently — a worker within `pm.max_children` may still exceed `memory_limit` if limits are mismatched.

## Performance Considerations

- Workers consuming 80% of `memory_limit`: performance is normal but there's no headroom for spikes. Increase limit or reduce worker count.
- Workers at `memory_limit`: PHP throws Fatal Error. The worker dies and restarts. Request fails with 500 error.
- Swap usage: even 1% swap usage degrades PHP performance significantly. Zend MM performs poorly on swap.
- Worker restart on memory limit: each restart costs ~200ms spawn overhead + bootstrap time. Frequent restarts degrade throughput.
- P95 RSS measurement: collect RSS samples over 24 hours under peak load. The P95 value is the 95th percentile — 5% of workers will exceed this.

## Security Considerations

- Memory limit attacks: an attacker may craft requests that consume excessive memory, hitting `memory_limit` and causing denial of service. Protect with rate limiting and input validation.
- Pool isolation: in multi-tenant PHP-FPM, each pool should have its own `memory_limit` and `pm.max_children`. One tenant's memory leak should not affect others.
- Container security: set container memory limits that are slightly higher than PHP `memory_limit` to give PHP room for graceful error handling before OOM.
- Resource exhaustion: if a single request can allocate massive memory (e.g., large file upload, unvalidated array), limit the data size before PHP processes it.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Setting `memory_limit` to -1 (unlimited) | PHP can allocate all available RAM, causing system OOM. | Convenience in development that leaks to production. | Entire server goes OOM when PHP grows unbounded. | Set a finite limit based on available memory budget. |
| Calculating `max_children` from average RSS | Under peak load, workers exceed average and cause OOM. | Using simple averages instead of percentiles. | 502 errors under peak traffic when workers OOM. | Use P95 RSS with a safety factor of 1.2–1.5×. |
| Not reserving memory for system services | Allocating all RAM to PHP and starving OS and database. | Forgetting that other services share the same server. | Database OOM, Nginx crashes, monitoring agents killed. | Subtract non-PHP services from total RAM first. |
| Setting pool memory_limit same as PHP-FPM global | Overrides pool-specific tuning. | Copying config across environments without adjustment. | Per-pool tuning is lost. | Use `php_admin_value[memory_limit]` per pool. |
| Not monitoring RSS in Octane | Workers grow over time and hit memory_limit silently. | Assuming persistent workers have stable memory. | Workers crash mid-request when accumulated memory exceeds limit. | Set `max_requests` to recycle before memory_limit is reached. |

## Anti-Patterns

- **All-or-nothing memory config**: Setting `memory_limit` to -1 and hoping the OS handles it. The OS OOM killer is brutal — it kills processes without clean error handling.
- **Copy-paste FPM settings to Octane**: Octane workers have persistent memory — set higher limits but also configure `max_requests`. FPM limits can be lower because memory resets per request.
- **Ignoring RSS distribution**: If one worker grows faster than others, investigate that worker's request pattern. A specific endpoint may be the leak source.
- **Setting memory_limit too tight**: A limit that's too low causes frequent worker deaths. Use monitoring data to set a limit that accommodates 99th percentile usage.

## Examples

```
# php-fpm pool configuration
[myapp]
pm = dynamic
pm.max_children = 50     # (8GB - 2GB reserved) / (100MB P95 RSS × 1.2)
pm.start_servers = 10
pm.min_spare_servers = 5
pm.max_spare_servers = 15
php_admin_value[memory_limit] = 256M
```

```
# Octane calculation
# Server: 8GB RAM, 2GB reserved for OS + DB + Redis
# Available: 6GB for PHP workers
# Worker P95 RSS: 80MB
# With 1.3 safety factor: 80MB × 1.3 = 104MB per worker
# Max workers: 6GB / 104MB ≈ 57
# Set num_workers = 8 (CPU cores), max_workers = 57 (absolute cap)
```

```php
// Memory limit check in Octane worker
$usageMB = memory_get_usage(true) / 1024 / 1024;
$limitMB = ini_get('memory_limit');
if ($usageMB > 0.8 * $limitMB) {
    Log::warning("Worker memory at $usageMB / $limitMB MB");
}
```

## Related Topics

- PHP Memory Model — Zend Engine Memory Manager
- Memory Leak Detection
- Efficient Data Structures
- Octane Worker Configuration
- PHP-FPM Pool Sizing

## AI Agent Notes

- Memory limit configuration is the most common cause of production PHP outages. An incorrectly calculated `pm.max_children` is responsible for 502 errors under load.
- The key formula: `available_RAM / (P95_RSS × 1.2)` = max workers. This applies to both FPM and Octane.
- In Octane, each worker holds persistent connections to database and Redis. Memory_limit must account for these connection buffers too.
- For container environments, always set BOTH `memory_limit` (PHP) and container memory limits (Docker/K8s). The container limit should be ~10% higher than PHP's limit to allow for graceful error handling.

## Verification

- [ ] Verify `memory_limit` is set in php.ini and FPM pool config.
- [ ] Calculate `pm.max_children` using P95 RSS from production monitoring data.
- [ ] Verify P95 RSS does not exceed 80% of memory_limit under peak load.
- [ ] Monitor swap usage — should be 0 at all times.
- [ ] Verify memory budget: total RAM > OS + services + (workers × RSS × safety_factor).
- [ ] Test a request that approaches memory_limit and verify Fatal Error is thrown.
- [ ] Document the memory budget calculation and periodic review process.
