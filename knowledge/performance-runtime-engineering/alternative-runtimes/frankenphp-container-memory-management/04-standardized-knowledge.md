# Standardized Knowledge: FrankenPHP Container Memory Management

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Alternative PHP Runtimes |
| Knowledge Unit | FrankenPHP Container Memory Management |
| Difficulty | Intermediate |
| Lifecycle | Implement, Operate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

FrankenPHP in containers requires understanding two memory systems: Go runtime memory (Caddy, TLS, goroutines) and PHP memory (threads, OpCache, per-request allocations). `GOMEMLIMIT` controls Go's memory limit (available since Go 1.19+). PHP thread memory is controlled by `num_threads/max_threads` and `memory_limit`. The CGO bridge adds memory pinning complexity — Go GC must not reclaim memory being used by PHP threads.

## Core Concepts

- **GOMEMLIMIT**: Go environment variable setting a soft memory limit. Set to 80% of container memory limit. Prevents Go runtime from OOM-killing the container. Example: `GOMEMLIMIT=800MiB`.
- **PHP Memory Per Thread**: Each thread's `memory_limit` applies independently. A thread hitting memory_limit crashes that thread only — the worker pool restarts it.
- **glibc vs musl**: glibc has better performance for PHP workloads (optimized memory allocator, faster string operations). musl (Alpine) uses less disk space but is 10-20% slower.
- **OOM Risk Calculation**: `max_threads × P95_thread_RSS + Go_heap_overhead = total_memory` must be ≤ container_memory_limit × 0.75 (leaving 25% for page cache and other processes).

## When To Use

- Deploying FrankenPHP in Docker or Kubernetes containers
- Setting container resource limits for FrankenPHP workloads
- Tuning GOMEMLIMIT to prevent OOM kills while maximizing performance
- Choosing between glibc and musl base images for FrankenPHP containers

## When NOT To Use

- Bare-metal FrankenPHP deployments without container boundaries
- Environments where Go runtime version is below 1.19 (GOMEMLIMIT not available)
- Multi-tenant containers sharing a single FrankenPHP instance
- Development environments where precise memory tuning is unnecessary

## Best Practices

- **Set GOMEMLIMIT to 80% of container limit**: This provides Go runtime headroom while leaving room for page cache and system processes. Example: `GOMEMLIMIT=800MiB` for a 1GB container.
- **Use debian-slim (glibc) for production**: The 10-20% performance penalty from musl's malloc and string operations directly reduces throughput. Alpine is acceptable for development only.
- **Calculate max_threads from OOM budget**: Use the formula `max_threads = (container_limit × 0.75 - Go_overhead) / P95_thread_RSS`. Document the calculation.
- **Set PHP memory_limit per thread**: Configure `memory_limit = 128M` (or appropriate value) in php.ini. This is separate from GOMEMLIMIT.
- **Monitor memory in layers**: Track Go heap, Go stack, PHP per-thread RSS, and OpCache memory separately. Drift in one layer indicates specific issues.

## Architecture Guidelines

- **Dual Memory Systems**: Go's garbage collector manages Caddy's allocations but not PHP's. PHP memory is managed by Zend MM with per-thread heaps and periodic OPcache recycling.
- **CGO Pinning**: `runtime.Pinner` prevents Go GC from moving memory that PHP has pointers to. This increases Go GC pressure slightly.
- **Container Resource Boundaries**: Docker CPU limits apply to the combined Go + PHP process. CPU throttling affects both runtimes — set CPU requests high enough for baseline load.
- **OOM Safety Margin**: Leave 25% of container memory unallocated for page cache, filesystem buffers, and temporary allocations. This prevents OOM kills during traffic spikes.

## Performance Considerations

- glibc vs musl: musl (Alpine) is 10-20% slower on PHP benchmarks due to less optimized malloc and string operations
- GOMEMLIMIT prevents OOM but soft limits can cause Go GC to run more frequently at high memory pressure
- PHP memory_limit per thread provides fault isolation — one leaky request doesn't crash all threads
- CGO pinning adds ~5% GC overhead for the Go runtime

## Security Considerations

- OOM kills in containerized FrankenPHP cause total service unavailability. Proper memory budgeting is a security availability concern.
- GOMEMLIMIT is a soft limit — the Go runtime can exceed it temporarily. Hard limits are enforced by the container runtime (cgroup).
- Thread memory limits per PHP memory_limit prevent single requests from exhausting shared resources.
- Container resource limits (Kubernetes requests/limits) must account for both Go and PHP memory. Undersizing leads to OOM; oversizing wastes cluster resources.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using Alpine (musl) for production FrankenPHP | Smaller image preference | 10-20% performance penalty from slower memory allocator | Use debian-slim (glibc) images for production |
| Missing GOMEMLIMIT in container | Not understanding Go memory management | OOM kills when Go heap grows unbounded | Set GOMEMLIMIT to 80% of container memory limit |
| Not isolating PHP and Go memory monitoring | Combined monitoring approach | Can't identify which runtime is leaking | Track Go heap, PHP RSS, and OpCache separately |
| Oversizing max_threads without memory calculation | Guessing without formula | OOM kills or wasted cluster resources | Calculate max_threads from OOM risk formula |

## Anti-Patterns

- **Setting GOMEMLIMIT equal to container limit**: No headroom for page cache causes OOM. Always set GOMEMLIMIT below container limit.
- **Disabling PHP memory_limit**: Without per-thread limits, one runaway request can crash the entire thread pool.
- **Ignoring Go GC pressure from CGO pinning**: High request rates with many CGO crossings increase Go GC overhead. Monitor Go GC metrics.
- **Using CPU limits lower than thread count**: FrankenPHP needs at least as many CPU shares as configured threads. Under-CPU causes thread contention.

## Examples

```dockerfile
# Dockerfile for production FrankenPHP
FROM dunglas/frankenphp:latest-debian

# GOMEMLIMIT = 80% of container memory limit
ENV GOMEMLIMIT=800MiB

# PHP memory per thread
RUN echo "memory_limit = 128M" > /usr/local/etc/php/conf.d/memory.ini

# Thread pool tuning (in Caddyfile)
COPY Caddyfile /app/public/
```

```yaml
# Kubernetes resource limits
resources:
  requests:
    memory: "768Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1"
```

## Related Topics

- FrankenPHP Worker Thread Management
- FrankenPHP Architecture
- Containerized Deployment Cache Strategies
- PHP-FPM Pool Sizing Formula

## AI Agent Notes

- GOMEMLIMIT is available since Go 1.19. Check the Go version embedded in the FrankenPHP binary before configuring.
- glibc vs musl performance difference (10-20%) is specific to PHP workloads. Other Go applications may not see this gap.
- The `runtime.Pinner` in Go 1.21+ prevents GC from moving pinned memory. This is invisible to operators but affects Go GC performance.
- Container memory limits should be set at the pod/container level, not just in FrankenPHP config. cgroup enforcement is the ultimate boundary.

## Verification

- [ ] GOMEMLIMIT set to 80% of container memory limit
- [ ] debian-slim (glibc) base image used for production
- [ ] PHP memory_limit configured per thread
- [ ] max_threads calculated from OOM risk formula
- [ ] Go runtime version 1.19+ (check FrankenPHP binary)
- [ ] Separate monitoring for Go heap and PHP thread memory
- [ ] Container resource limits documented and reviewed
- [ ] OOM safety margin (25%) maintained in calculations
