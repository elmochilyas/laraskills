# Octane Configuration and Workers

## Metadata
- **ID:** ku-06-roadrunner-worker-pool
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Last Updated:** 2026-06-02

## Overview
Octane's behavior is governed by `config/octane.php`, which controls worker count, max requests, runtime selection, and per-runtime options. Worker management is the operational backbone of Octane — incorrect configuration leads to wasted resources, request timeouts, or cascading failures. This KU covers every configuration option, the rationale behind defaults, and how worker count interacts with the underlying runtime's concurrency model (processes vs coroutines).

## Core Concepts
- **`server`**: Runtime adapter: `swoole`, `roadrunner`, or `frankenphp`. Determines which worker lifecycle implementation Octane uses.
- **`max_requests`**: Number of requests a worker processes before graceful recycle. Default: 500. Lower values increase safety (less leak accumulation) but reduce cache warmth.
- **`worker_count`**: Number of worker processes. Default: `auto` (CPU core count). RoadRunner uses OS threads (goroutines) multiplexed across workers. Swoole uses one process per worker.
- **`max_execution_time`** (Swoole): Max seconds before Swoole terminates a request. Default: 30.
- **`request_timeout`** (RoadRunner): Max duration for a request before RoadRunner kills the PHP process.
- **Concurrency Models**: Swoole supports coroutines (many requests in one worker simultaneously). RoadRunner uses process-per-core. FrankenPHP uses Caddy's event loop.

## When To Use
- **Production Octane deployment**: Required configuration for any Octane application.
- **Performance tuning**: Adjusting worker count and max_requests for specific workload profiles.
- **Capacity planning**: Determining memory and CPU requirements based on worker configuration.
- **Graceful deployment**: Tuning for zero-downtime deployment strategies.

## When NOT To Use
- **Local development**: Defaults are sufficient for development environments.
- **PHP-FPM**: Octane configuration has no effect in traditional FPM mode.
- **Serverless (Vapor)**: Vapor manages worker lifecycle via Lambda scaling, not `octane.php`.

## Best Practices (WHY)
- **Set `worker_count` based on workload**: CPU-bound: `worker_count = CPU cores`. I/O-bound with Swoole: rely on coroutines, keep worker_count at CPU cores. *Why: Over-subscription causes context-switch thrashing; under-subscription wastes capacity.*
- **Profile memory growth to set `max_requests`**: Calculate: `(memory_limit - baseline_memory) / per_request_growth`. If worker grows 1MB/request and limit is 128MB, set `max_requests = 100`. *Why: max_requests balanced too high causes OOM; too low wastes throughput on worker churn.*
- **Never disable `max_requests`**: Setting to 0 or null removes the safety valve against memory leaks. *Why: No application has perfect memory hygiene — max_requests is the last line of defense.*
- **Use staged rollout for config changes**: Lower `max_requests` during deployment to cycle workers quickly to new code, then restore normal value. *Why: Gradual worker rotation provides zero-downtime deployment without sudden capacity loss.*

## Architecture Guidelines
- **`auto` worker count defaults to CPU cores**: Safe default preventing oversubscription on any hardware.
- **`max_requests` default 500**: Balances leak safety with throughput.
- **Swoole `max_execution_time` defaults to 30**: Backward compatibility with PHP-FPM expectations.
- **RoadRunner uses separate PHP processes**: Process isolation guarantees no shared memory corruption.
- **Worker spawning**: Each runtime spawns workers differently — Swoole uses `Process\Pool`, RoadRunner uses Go-side pools, FrankenPHP uses Caddy subprocesses.

## Performance
- **Worker count × max_requests**: Total request capacity before full rotation. 8 workers × 500 = 4,000 requests before full rotation.
- **Swoole coroutines**: Hooked I/O functions yield to scheduler; non-hooked blocking calls block entire worker.
- **RoadRunner Go-side goroutines**: Sub-millisecond request routing overhead. PHP process itself is single-threaded.
- **FrankenPHP Caddy integration**: Static files served by Caddy directly, reducing worker load.
- **Memory per worker**: ~30-50MB baseline. Total budget must account for `worker_count × per-worker RSS`.

## Security
- **Oversubscription meltdown**: `worker_count=100` on a 4-core machine. CPU split across 100 processes. Each request takes 10x longer. Request queue backs up. System collapses.
- **Stuck worker cascade**: One worker hits infinite loop. Other workers pick up slack, become overloaded. Response times spike. Health checks fail.
- **Worker starvation (RoadRunner)**: `http.pool.max_jobs` too low. Workers recycle too quickly. Never warm caches. Each request suffers cold-start overhead.
- **Memory limit cross-talk (Swoole)**: `memory_limit` applies per-worker. Swoole shared memory tables grow independently.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Setting worker_count = expected concurrent users | Not understanding coroutine model | Waste of memory with Swoole | Use CPU core count + coroutines for concurrency |
| Thinking max_requests is global | Assuming max_requests is total across all workers | 8 workers × 500 = 4000 total requests before rotation | It's per-worker, not global |
| Disabling max_requests entirely | Setting to 0 or null | No safety valve; workers grow until OOM | Always set max_requests based on leak profile |
| Using $_ENV values assuming per-request reset | max_execution_time is per-worker in Swoole | Stuck requests block entire worker | Use Swoole's max_execution_time |

## Anti-Patterns
- **Over-provisioning workers**: Setting worker_count higher than CPU cores for CPU-bound apps. Causes context-switching overhead that reduces throughput.
- **Single max_requests for all routes**: Some routes are memory-intensive (reports, exports). Consider separate Octane instances with different max_requests.
- **Ignoring RoadRunner `.rr.yaml`**: RoadRunner has separate config in `.rr.yaml` that overrides or supplements `octane.php`.
- **No graceful shutdown timeout**: Setting `max_wait_time` too short — workers killed mid-request, losing that work.

## Examples

```php
// config/octane.php
return [
    'server' => env('OCTANE_SERVER', 'swoole'),
    
    'max_requests' => env('OCTANE_MAX_REQUESTS', 500),
    
    'worker_count' => env('OCTANE_WORKER_COUNT', 'auto'),
    
    'swoole' => [
        'options' => [
            'max_execution_time' => 30,
            'max_wait_time' => 60,
            'package_max_length' => 10 * 1024 * 1024, // 10MB
        ],
    ],
    
    'roadrunner' => [
        'options' => [
            'request_timeout' => 30,
        ],
    ],
];

// Memory-profile-based max_requests calculation
$baselineMemory = 40 * 1024 * 1024; // 40MB
$memoryLimit = 128 * 1024 * 1024;    // 128MB
$growthPerRequest = 0.5 * 1024 * 1024; // 0.5MB
$safeMaxRequests = ($memoryLimit - $baselineMemory) / $growthPerRequest;
// Returns ~176 — round down to 150 for safety margin
```

## Related Topics
- **Octane Architecture Overview**: Worker lifecycle context.
- **Octane Lifecycle Hooks**: Worker lifecycle events.
- **Static Property Accumulation**: Why max_requests is necessary.
- **Memory Profiling and Observability**: Profiling to set max_requests.
- **Queue Worker Lifecycle**: Parallel configuration patterns.

## AI Agent Notes
- Swoole v5.x changed default `reactor_count` from CPU count to 1. Octane handles reactor config internally.
- RoadRunner v3.x moved from YAML to `.rr.yaml` with dynamic configuration reload via `rr reset`.
- FrankenPHP's `num_threads` in `frankenphp.yml` controls PHP process count. Default is `0` (auto = CPU count).
- Swoole's `task_worker_count` is separate from `worker_count` and not used by Octane.
- Research question: Could Octane dynamically adjust `worker_count` based on request queue depth? Some frameworks implement auto-scaling worker pools.

## Verification
- [ ] Understand each `config/octane.php` option and its effect
- [ ] Calculate optimal `max_requests` based on memory profiling
- [ ] Set `worker_count` based on workload type (CPU-bound vs I/O-bound)
- [ ] Test with over-provisioned worker_count — observe context switching overhead
- [ ] Configure graceful shutdown with appropriate timeouts
- [ ] Test staged rollout: lower max_requests during deployment, restore after
