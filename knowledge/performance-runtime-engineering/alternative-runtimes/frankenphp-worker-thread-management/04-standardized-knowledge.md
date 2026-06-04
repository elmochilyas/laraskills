# Standardized Knowledge: FrankenPHP Worker and Thread Management

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Alternative PHP Runtimes |
| Knowledge Unit | FrankenPHP Worker and Thread Management |
| Difficulty | Intermediate |
| Lifecycle | Implement, Operate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

FrankenPHP's thread pool automatically scales between `num_threads` (minimum) and `max_threads` (maximum) based on concurrent request demand. Each thread transitions through a state machine: Reserved → Booting → Inactive → Ready → Done. Auto-scaling dynamically adjusts thread count to match traffic while maintaining configurable wait time limits.

## Core Concepts

- **num_threads**: Minimum number of PHP threads always available. Set to number of CPU cores for compute-bound, 2-4x cores for I/O-bound workloads.
- **max_threads**: Maximum threads the pool can grow to. Bound by available memory. Each thread consumes ~30-80MB (similar to FPM worker RSS).
- **Auto-Scaling**: Thread count increases when `max_wait_time` is exceeded (requests waiting for an available thread). Decreases when threads are idle for `max_idle_time`.
- **Thread State Machine**: Reserved (slot allocated) → Booting (PHP initializing) → Inactive (waiting for request) → TransitionRequested (being reassigned) → Ready (handling request) → Done (request complete).

## When To Use

- Tuning FrankenPHP thread pool for production traffic patterns
- Calculating thread pool size based on memory budget and workload profile
- Understanding auto-scaling behavior for capacity planning
- Configuring max_requests for thread recycling and memory leak prevention

## When NOT To Use

- FrankenPHP in standard mode (no thread pool — process per request)
- Environments where thread count is managed by container orchestration (Kubernetes HPA)
- Applications with extremely predictable traffic where static thread count suffices
- Development environments where auto-scaling complexity is unnecessary

## Best Practices

- **Calculate max_threads from memory budget**: Use `max_threads = (available_RAM - system_reserve - Go_overhead) / avg_thread_RSS`. Apply 1.2x safety factor.
- **Set num_threads for baseline traffic**: num_threads should handle average load. Auto-scaling handles traffic spikes above the baseline.
- **Configure max_wait_time realistically**: 100-500ms for latency-sensitive APIs, longer for background processing. Shorter wait times trigger more aggressive scaling.
- **Set max_requests for thread recycling**: 1000-5000 to prevent memory drift. This is FrankenPHP's equivalent of FPM's pm.max_requests.
- **Monitor thread transitions**: Use FrankenPHP metrics to track thread state transitions. Excessive booting/done cycles indicate pool misconfiguration.

## Architecture Guidelines

- **Thread Spawn Time**: ~30-100ms per thread (PHP bootstrap with preloading). Auto-scaling spawns slower than FPM but the cost is amortized across many requests.
- **Thread vs Process Recycling**: Thread recycling via max_requests is less costly than process recycling in FPM because threads share OpCache memory.
- **Shared OpCache Benefit**: Threads within the same process share OpCache memory. This reduces total RAM compared to FPM where each process has its own OpCache.
- **Memory Isolation Limitations**: Threads share the same address space. A memory corruption in one thread can potentially crash the entire process.

## Performance Considerations

- Thread spawn time: ~30-100ms (PHP bootstrap with preloading). Auto-scaling spawns slower than FPM but the cost is amortized across many requests.
- Max threads: Calculate as `(available_RAM - system_reserve) / avg_thread_RSS`. Apply same safety factor as FPM max_children.
- Thread recycling via `max_requests` (per thread) — same principle as pm.max_requests to prevent memory drift.
- Auto-scaling reduces waste during low traffic while maintaining responsiveness during spikes.

## Security Considerations

- Thread safety is critical in multithreaded PHP. ZTS-incompatible extensions can cause segfaults that crash all threads.
- Memory limits are per-thread. One thread hitting memory_limit crashes that thread only — the pool restarts it.
- Shared OpCache means all threads can see all cached files. No cache-based information isolation between threads.
- Thread pool exhaustion (all threads busy) causes connection queuing. Configure proper timeouts to prevent resource exhaustion.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Setting max_threads too high | Over-provisioning without memory calculation | OOM kills from excessive thread RSS | Calculate from available RAM with safety factor |
| Not setting max_requests | Assuming threads don't leak memory | Memory drift degrades performance over time | Set max_requests 1000-5000 per thread |
| num_threads equal to max_threads | Disabling auto-scaling unnecessarily | No adaptation to traffic changes, wasted resources during low traffic | Allow auto-scaling range between num and max threads |
| Thread pool exhaustion without monitoring | Not tracking busy thread count | Requests queue up and eventually timeout | Monitor thread pool utilization and set alerts at 80% |

## Anti-Patterns

- **Setting num_threads too high**: Keeps idle threads consuming memory. Set num_threads to handle baseline traffic only.
- **Ignoring thread spawn latency**: Auto-scaling takes 30-100ms per thread. If traffic spikes are faster than the spawn rate, configure higher num_threads for headroom.
- **Using thread count for throughput scaling**: Adding threads increases concurrency but each thread adds RSS. Memory budget, not throughput desire, should bound max_threads.
- **Assuming thread recycling eliminates all state issues**: Static properties and singletons can still leak across requests. Apply Octane-style state management in FrankenPHP.

## Examples

```caddy
# Caddyfile — Thread pool configuration
php_server {
    worker {
        num_threads 4           # Minimum threads (baseline traffic)
        max_threads 12          # Maximum threads (peak traffic)
        max_requests 2000       # Recycle per-thread
        max_wait_time 500ms     # Wait before spawning new thread
        max_idle_time 30s       # Idle before removing thread
    }
}
```

## Related Topics

- FrankenPHP Architecture
- FrankenPHP Installation and Caddyfile
- FrankenPHP Container Memory Management
- PHP-FPM Worker Management

## AI Agent Notes

- FrankenPHP's thread state machine has five states: Reserved, Booting, Inactive, TransitionRequested, Ready, Done. Understanding these states helps diagnose pool behavior.
- Thread recycling via max_requests is FrankenPHP's answer to pm.max_requests. The concept is the same — prevent memory drift through periodic recycling.
- Auto-scaling in FrankenPHP is based on max_wait_time (how long a request waits for a thread). This is different from CPU-based or request-based scaling in other systems.
- Thread spawn time (30-100ms) is critical for capacity planning during traffic spikes. The pool cannot grow faster than this rate.

## Verification

- [ ] num_threads configured for baseline traffic
- [ ] max_threads calculated from memory budget with 1.2x safety factor
- [ ] max_requests configured (1000-5000)
- [ ] max_wait_time and max_idle_time configured
- [ ] Thread pool utilization monitoring in place
- [ ] All extensions verified ZTS-compatible
- [ ] Memory budget documented and reviewed
- [ ] Auto-scaling behavior validated in staging
