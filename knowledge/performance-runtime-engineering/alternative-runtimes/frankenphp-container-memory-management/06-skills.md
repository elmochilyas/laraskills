# Skill: Manage FrankenPHP Memory in Container Environments

## Purpose

Configure PHP memory limits, thread counts, and container resource requests for FrankenPHP in containerized deployments (Docker, Kubernetes).

## When To Use

- Deploying FrankenPHP in containers
- Configuring container resource limits for FrankenPHP
- Tuning worker thread count vs memory
- Debugging OOMKill in containerized FrankenPHP

## When NOT To Use

- For non-containerized FrankenPHP deployments
- When using PHP-FPM (different memory model)
- Without understanding FrankenPHP's thread-based memory sharing

## Prerequisites

- FrankenPHP deployed in containers
- Understanding of Kubernetes/Docker resource limits
- Profiling data showing per-request and per-thread memory

## Inputs

- Container memory limit (Kubernetes resource.requests.memory)
- Number of FrankenPHP worker threads
- Per-request peak memory usage
- Application memory growth over time

## Workflow (numbered steps)

1. Set container memory request = memory_limit_per_thread × num_threads × 1.2 (20% overhead for shared structures)
2. Set container memory limit = memory request × 1.25-1.5 (burst allowance)
3. Configure `php.memory_limit` in the Caddyfile to the per-thread limit
4. Configure `frankenphp.num_threads` based on CPU cores × 2-4 (I/O-bound) or cores (CPU-bound)
5. Monitor container RSS: if it approaches the limit, reduce num_threads or increase the limit
6. Enable Liveness probe: hit a health endpoint to detect OOM-killed containers
7. For Kubernetes: set resource.requests.memory = calculated value, resource.limits.memory = 1.5x
8. Test under expected peak load — container should stay below 80% of the memory limit
9. If OOMKilled occurs, increase limit or reduce threads
10. Document the container resource configuration

## Validation Checklist

- [ ] Per-thread memory usage profiled
- [ ] Container memory request calculated
- [ ] Container memory limit set with burst allowance
- [ ] frankenphp.num_threads configured
- [ ] Liveness probe configured for OOM detection
- [ ] No OOMKill under peak load
- [ ] RSS stays below 80% of limit
- [ ] Configuration documented

## Common Failures

- **Setting container limit too close to request**: No room for memory spikes — causes OOMKill
- **Not setting PHP memory_limit per thread**: A single request can consume all container memory
- **Too many threads for memory**: num_threads × per_thread_memory may exceed container limit
- **Assuming threads share all memory equally**: Each thread has its own PHP heap — shared only for OpCache and globals

## Decision Points

- I/O-bound workload: num_threads = CPU_cores × 2-4 (threads spend most time waiting)
- CPU-bound workload: num_threads = CPU_cores (threads compete for CPU)
- Memory-constrained: reduce num_threads and increase per-thread memory_limit
- Memory-abundant: increase num_threads for higher concurrency
- OOMKilled: reduce num_threads or increase container memory limit

## Performance Considerations

- FrankenPHP threads share OpCache memory (unlike FPM processes) — saves 128-512MB
- Each thread's PHP heap: 50-200MB depending on request complexity
- Thread stack: ~2-8MB per thread (default PHP stack)
- CGO overhead: adds ~5-10% to memory per thread
- Container memory limit hard cap: exceeding it causes OOMKill — no swap

## Security Considerations

- Container memory limits prevent runaway FrankenPHP from affecting other containers
- OOMKilled containers restart — ensure graceful shutdown handling
- Resource quotas in multi-tenant clusters must account for FrankenPHP's thread-based memory
- Health checks (liveness probe) detect OOM situations quickly

## Related Rules (from 05-rules.md)

- Set Container Memory Request = Threads × Per-Thread Memory
- Add 50% Burst Allowance on Container Memory Limit
- Never Omit Liveness Probe for FrankenPHP

## Related Skills

- FrankenPHP Architecture Caddy/CGO/SAPI
- FrankenPHP Worker Thread Management
- Containerized Deployment Cache Strategies
- Octane Memory Management

## Success Criteria

- Container memory configuration calculated and applied
- No OOMKill under peak load
- num_threads matched to workload (CPU vs I/O bound)
- RSS stays below 80% of container limit
- Liveness probe configured
- Configuration documented
