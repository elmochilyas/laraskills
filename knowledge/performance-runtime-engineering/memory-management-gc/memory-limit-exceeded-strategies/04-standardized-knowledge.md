# Memory Limit Exceeded Strategies

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | Memory Limit Exceeded Strategies |
| Difficulty | Intermediate |
| Last Updated | 2026-06-04 |

## Overview

When PHP's memory allocation exceeds `memory_limit`, the engine throws a fatal error — the request terminates immediately with no graceful shutdown. Memory limit exceeded (MLE) events are not just configuration problems; they are signals of deeper issues: memory leaks, unoptimized data handling, runaway queues, or container misconfiguration. Effective MLE strategies encompass preventive measures (profiling, chunking, queue offloading), reactive measures (monitoring, alerting, graceful degradation), and diagnostic workflows (heap dump analysis, leak detection, peak profiling). The goal is not to eliminate MLE events entirely — legitimate data-heavy operations may exceed limits — but to ensure they are predictable, monitored, and handled without service disruption.

## Core Concepts

- **Fatal error on exhaustion**: `PHP Fatal error: Allowed memory size of X bytes exhausted` — no exception catchable. `register_shutdown_function()` runs but cannot allocate memory.
- **Container OOM vs PHP OOM**: Container OOM (cgroup memory limit exceeded) kills the entire pod with SIGKILL. PHP OOM kills only the request, leaving the worker process intact.
- **memory_get_peak_usage(true)**: Reports the highest real memory allocation from the Zend MM during the request. Compare against `memory_limit` to measure headroom.
- **Graceful degradation**: Applications should detect approaching memory limits and serve simplified responses (cached, partial, or degraded) rather than crashing.
- **Queue offloading**: Operations approaching memory limits (report generation, bulk exports, image processing) should execute in queue workers with higher limits, not web workers.
- **Chunking and streaming**: Processing data in smaller chunks or streaming output reduces peak memory below the limit.

## When To Use

- Responding to MLE errors in production for the first time.
- Designing new endpoints that handle large datasets (exports, reports, batch processing).
- Configuring container resource limits and PHP memory_limit alignment.
- Building monitoring and alerting for near-OOM conditions.
- Capacity planning for memory-intensive queue jobs.

## When NOT To Use

- Raising memory_limit without investigation — this masks the underlying issue.
- Applying complex streaming patterns to endpoints handling < 1MB of data.
- Premature optimization of endpoints with no observed MLE issues.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Defer heavy operations to queues | Queue workers can have higher limits and run asynchronously. Web workers stay responsive. |
| Set memory_limit below container limit | Container OOM kills the pod; PHP OOM kills only the request. The 20% buffer prevents cascading. |
| Implement pre-request memory budget check | If `memory_get_usage(true)` exceeds 80% of limit after request start, switch to degraded mode immediately. |
| Chunk database queries | Loading 100k records via `Model::all()` OOMs. `chunk(1000)` keeps memory constant. |
| Stream large responses | `response()->stream()` or `fwrite()` avoids building the full response in memory. |
| Monitor peak memory per endpoint | Track `memory_get_peak_usage(true)` per URL. Endpoints exceeding 80% of limit need investigation. |

## Architecture Guidelines

- **Web vs queue separation**: Web pool memory_limit = 128-256M. Queue pool memory_limit = 512M-1G. Never share the same pool.
- **Container memory alignment**: `PHP memory_limit = container_limit × 0.75`. The remaining 25% covers OS, PHP-FPM master process, and shared libraries.
- **Auto-scaling based on memory**: In Kubernetes, configure HPA based on worker memory utilization, not just CPU. Memory exhaustion triggers scaling before OOM.
- **Degraded response strategy**: When memory is near limit, return cached responses, simplify query logic, or reject expensive requests with a 503 Retry-After header.
- **Octane specific**: Lower per-coroutine memory_limit in Octane. A single memory-exhausted coroutine can block the entire worker. Recycle workers aggressively via max_requests.

## Performance Considerations

- Near-limit allocation degrades performance: Zend MM fragmentation increases, GC pressure grows, swap thrashing may occur.
- An MLE mid-response wastes all CPU already spent on the partial response. Early detection (via memory budget check) saves resources.
- Queue offloading trades latency for memory: a 10-second export moves from web request (fast, memory-heavy) to queue (slow, memory-safe).
- Streaming CSV output: memory = constant ~1MB regardless of dataset size. Building CSV string: memory = dataset size × 2 (string + data).

## Security Considerations

- An MLE may skip security middleware (auth, validation, rate limiting) that normally runs early. Design graceful degradation to still enforce security checks.
- Container OOM kills do not trigger PHP shutdown functions. Monitor OOM events at the infrastructure level for reliable detection.
- An attacker can trigger MLE by sending requests that force large memory allocations (wide JSON payloads, deep nesting, many file uploads). Apply input size limits at the HTTP boundary.
- MLE errors may leak partial output (headers sent, body partial). Ensure idempotency for endpoints that may partially execute before OOM.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Blindly raising memory_limit | Increasing limit by 50% after each OOM without investigating. | Fastest path to stop alerts. | Masks leak; production OOM escalates with traffic growth. | Profile peak usage first, fix the leak or defer to queue. |
| Setting memory_limit = container limit | PHP and container OOM at the same threshold. | Assuming they are independent. | Pod OOM kills all workers, not just the request. | Set PHP limit 75-80% of container limit. |
| Not chunking database queries | `Model::all()` for 100k records. | Habit from small datasets. | Immediate OOM on large datasets. | Use `chunk()`, `cursor()`, or `lazy()` collections. |
| Ignoring queue worker memory | Queue workers with default 128M limit processing 500MB files. | Forgetting that queue workers need higher limits. | Queue job fails, retries, fails again — wasted resources. | Profile queue jobs separately, set appropriate limits. |

## Anti-Patterns

- **Limit bump spiral**: Each OOM results in a 50% limit increase. After 3 bumps, the limit is 3.375× the original — and no one knows why memory grows.
- **Same limit everywhere**: Using `php.ini` global `memory_limit` for artisan, queue, and web. Each has different profiles. Segregate by SAPI.
- **Ignoring Octane memory growth**: `memory_limit` in Octane per coroutine is checked, but cumulative RSS grows. Relying solely on limit enforcement without `max_requests` recycling.
- **No graceful degradation**: Applications that crash completely instead of serving cached or simplified responses on near-OOM.

## Examples

```php
<?php
// Pre-request memory budget check
register_shutdown_function(function () {
    $peak = memory_get_peak_usage(true);
    $limit = ini_get('memory_limit');
    $ratio = $peak / convertToBytes($limit);

    if ($ratio > 0.9) {
        Log::warning('Near memory limit', [
            'peak' => $peak,
            'limit' => $limit,
            'url' => request()->url(),
            'ratio' => $ratio,
        ]);
    }
});
```

```php
<?php
// Queue offloading — heavy operation to queue
class ExportJob implements ShouldQueue {
    public function handle(): void {
        ini_set('memory_limit', '1G'); // Higher limit for queue
        $exporter = new ReportExporter();
        $exporter->generateLargeReport();
    }
}
```

## Related Topics

- **Prerequisites**: PHP Memory Model, Memory Limit Sizing, PM Max Children
- **Closely Related**: Memory Leak Detection, Chunking and Lazy Collections, Queue Architecture
- **Advanced Follow-Up**: Container OOM Handling, Capacity Planning
- **Cross-Domain Connections**: Kubernetes Resource Limits, Queue Worker Configuration

## AI Agent Notes

- The most common cause of MLE in Laravel apps is not a memory leak but a single unoptimized query loading too much data. Always check for `Model::all()` or `get()` without chunking first.
- The second most common cause is a queue job processing a larger payload than anticipated. Set queue worker limits separately from web limits.
- Container OOM is harder to debug than PHP OOM because no PHP error is logged. Always set PHP `memory_limit` below the container limit to catch issues in PHP logs.
- When profiling MLE events, distinguish between request-scoped peak (single request too large) and cumulative growth (leak in persistent runtime). The fix is different for each.
- Graceful degradation is rarely implemented but invaluable in constrained environments: a cached 503 with Retry-After is better than a crash with no response.
