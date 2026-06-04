# Memory Limit Sizing

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | Memory Limit Sizing |
| Difficulty | Intermediate |
| Last Updated | 2026-06-04 |

## Overview

Memory limit sizing determines the maximum memory a single PHP process can allocate via `memory_limit` in php.ini or `ini_set()`. Each PHP-FPM worker, Octane coroutine, or CLI process enforces this boundary independently. Setting it too low causes valid requests to fail with fatal errors; setting it too high allows runaway scripts to crowd out other workers and trigger OS-level OOM kills. The correct value balances peak per-request memory usage against total available RAM, worker count, and application throughput. Memory limit sizing is an architectural constraint that directly impacts capacity planning, not a development-time convenience knob.

## Core Concepts

- **memory_limit directive**: Maximum bytes a single PHP process may allocate. Set via `php.ini`, `php-fpm.conf`, `ini_set()`, or `-d` CLI flag. Default is 128M.
- **Per-process enforcement**: The limit applies per PHP process (FPM worker, CLI script, Octane coroutine). Exhausting it triggers a fatal error — the process does not exit gracefully.
- **Total RSS constraint**: `memory_limit × pm.max_children` must fit within available RAM plus OS overhead. A 256M limit × 32 workers = 8 GB minimum RAM.
- **Real memory usage vs allocation**: `memory_get_usage(true)` reports actual allocation from the Zend MM, which is always less than or equal to `memory_limit`. The difference is headroom for fragmentation and peak spikes.
- **Persistent runtime distinction**: In Octane, `memory_limit` applies per-coroutine but the shared heap means memory from previous requests accumulates. Recycling workers is essential.
- **Container boundaries**: In Docker/Kubernetes, PHP's `memory_limit` should be set lower than the container's cgroup memory limit. Container OOM kills the entire pod; PHP OOM kills only the request.

## When To Use

- Production capacity planning where total RSS must fit within server RAM.
- Shared hosting or multi-tenant environments where one tenant must not consume all resources.
- Containerized deployments where pod memory limits must be respected.
- Applications with known memory-heavy endpoints (exports, report generation, image processing).
- CI pipelines that enforce memory budgets per test or per build step.

## When NOT To Use

- Development environments where debugging tools need extra memory — raise or disable the limit locally.
- Short-running CLI scripts executed in isolation with no concurrency concerns.
- Applications that exclusively use queues for heavy work — queue workers can have higher limits.
- Systems with swap-based memory management where OOM behavior is acceptable.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Set limit to 2× profiled peak | Provides headroom for fragmentation and request variation without masking leaks. |
| Lower limit in web pools vs queue pools | Web workers must be responsive and numerous; queue workers can trade concurrency for single-job capacity. |
| Enforce memory budgets in CI | A CI check that fails when `memory_get_peak_usage(true)` exceeds a threshold prevents regression. |
| Monitor per-worker RSS not just memory_limit | The Zend MM may allocate less than the limit; RSS shows the true OS-level footprint. |
| Set `memory_limit < container memory limit` | Container OOM is disruptive (pod restart); PHP OOM is local (single request). Leave a safety margin. |
| Use `pm.max_requests` to recycle workers | Workers accumulate fragmentation over their lifetime. Recycling resets memory to baseline. |

## Architecture Guidelines

- **Formula**: `memory_limit = (available_RAM × target_utilization) / pm.max_children`. Target utilization is typically 70-80%, leaving headroom for OS, cache, and other processes.
- **Pool segregation**: Separate web pool (low limit, high concurrency) from queue pool (high limit, low concurrency) to avoid memory pressure on responsive endpoints.
- **Octane workers**: Set `memory_limit` higher per-coroutine but rely on `max_requests` recycling to prevent cumulative growth. Monitor per-worker RSS trend, not just single-request peak.
- **Container configuration**: Use Kubernetes `resources.limits.memory` as the hard ceiling. Set PHP `memory_limit` to 75-80% of that value.
- **Graceful degradation**: Applications should detect imminent OOM and redirect users to fallback flows (simplified responses, cached results) rather than crashing.
- **Monitoring threshold**: Alert when per-worker RSS exceeds 80% of `memory_limit` — this indicates fragmentation or a developing leak.

## Performance Considerations

- `memory_limit` check is O(1) per allocation — negligible overhead.
- Too-low limit causes repeated fatal errors on legitimate requests, wasting CPU on partial processing that never completes.
- Too-high limit in containers causes cascading OOM kills when total RSS across workers exceeds the cgroup limit.
- Each OOM kill in FPM tears down and restarts the worker process — ~50-200µs overhead per recycle.
- Workers near their limit degrade throughput due to swap thrashing (if swap is enabled) or increased GC pressure.

## Security Considerations

- A single compromised request can allocate up to `memory_limit` bytes. In FPM, the process is isolated; in Octane, excessive allocation degrades all subsequent requests in that worker until recycle.
- Denial of service via memory exhaustion: an attacker triggers endpoints that allocate near the limit, causing worker starvation. Rate limiting and queue offloading mitigate this.
- Container OOM kills may not log sufficient diagnostic data. Always pair `memory_limit` with structured logging of `memory_get_peak_usage(true)` on error.
- Shared hosting tenants can exhaust a pool's total memory if limits are not enforced per-pool via `pm.max_children`.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Setting `memory_limit` equal to container limit | PHP OOM and container OOM happen at the same threshold. | Assuming the two limits are independent. | Container OOM kills the entire pod, not just the request. | Set PHP limit 80% of cgroup limit. |
| Raising `memory_limit` instead of profiling | Masking a memory leak by increasing the ceiling. | Fastest way to stop OOM errors. | Production OOM escalates when traffic grows. | Profile peak usage first; fix the leak. |
| Uniform limit for web and queue workers | Queue workers that process 100MB files crash web workers that need only 32MB. | Single `php.ini` for all SAPI modes. | Unnecessary worker contention or wasted memory. | Use separate pools with distinct limits. |
| Ignoring total RSS in capacity planning | Setting 512M per worker × 32 workers when server has 8 GB RAM. | Focusing on per-request peak, not total footprint. | Swap thrashing or container OOM at high traffic. | Calculate total RSS = sum(workers × peak per worker). |

## Anti-Patterns

- **Limit inflation**: Raising the limit repeatedly without investigation. Each increase should be accompanied by a profiling report.
- **Cascading OOM**: Setting container and PHP limits at the same value. A single request hits both simultaneously, killing the pod.
- **Overly tight limits**: Setting `memory_limit = 32M` without profiling. Legitimate requests fail, triggering monitoring alerts and engineer toil.
- **Blind uniform limits**: Applying the same `memory_limit` to artisan CLI, queue workers, and web requests via a global `php.ini`. Each SAPI has different peak requirements.

## Examples

```
# php-fpm pool configuration
[www]
pm.max_children = 16
php_admin_value[memory_limit] = 128M
# Total RSS ceiling: 16 × 128M = 2GB
# Available RAM: 4GB → 50% utilization

[queue]
pm.max_children = 4
php_admin_value[memory_limit] = 512M
```

```php
<?php
// Profiling a request's memory peak
$peak = memory_get_peak_usage(true);
$limit = ini_get('memory_limit');
$threshold = 0.8 * convertToBytes($limit);

if ($peak > $threshold) {
    Log::warning('Memory usage approaching limit', [
        'peak' => $peak,
        'limit' => $limit,
        'url' => request()->url(),
    ]);
}
```

## Related Topics

- **Prerequisites**: PHP Memory Model, Zend Memory Manager
- **Closely Related**: PM Max Children Sizing, Worker RSS Capacity Ceiling
- **Advanced Follow-Up**: Memory Limit Exceeded Strategies, GC CPU Overhead
- **Cross-Domain Connections**: Container Resource Limits (Kubernetes), Capacity Planning (DevOps)

## AI Agent Notes

- The single most common production issue related to `memory_limit` is not an incorrectly sized limit — it's a memory leak being masked by repeatedly raising the limit.
- Always check `memory_get_peak_usage(true)` before "fixing" by raising the limit. Profiling reveals whether the baseline is healthy.
- In Octane, the memory_limit check per individual request is less important than the cumulative RSS trend across all requests in a worker. `max_requests` recycling is the primary control.
- When containers are the deployment target, the memory budget formula is: `PHP_limit = container_limit × 0.75`, and `pm.max_children = container_limit × 0.75 / PHP_peak_per_request`.
- Queue workers should always have higher limits than web workers — they process fewer requests concurrently and handle heavier payloads.
