# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** FrankenPHP Container Memory Management â€” GOMEMLIMIT, glibc vs musl, OOM Risk
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Set GOMEMLIMIT to 80% of container limit**: This provides Go runtime headroom while leaving room for page cache and system processes. Example: `GOMEMLIMIT=800MiB` for a 1GB container.
- [ ] **Use debian-slim (glibc) for production**: The 10-20% performance penalty from musl's malloc and string operations directly reduces throughput. Alpine is acceptable for development only.
- [ ] **Calculate max_threads from OOM budget**: Use the formula `max_threads = (container_limit Ã— 0.75 - Go_overhead) / P95_thread_RSS`. Document the calculation.
- [ ] **Set PHP memory_limit per thread**: Configure `memory_limit = 128M` (or appropriate value) in php.ini. This is separate from GOMEMLIMIT.
- [ ] **Monitor memory in layers**: Track Go heap, Go stack, PHP per-thread RSS, and OpCache memory separately. Drift in one layer indicates specific issues.
- [ ] GOMEMLIMIT set to 80% of container memory limit
- [ ] debian-slim (glibc) base image used for production
- [ ] PHP memory_limit configured per thread
- [ ] max_threads calculated from OOM risk formula
- [ ] Go runtime version 1.19+ (check FrankenPHP binary)
- [ ] Container memory configuration calculated and applied
- [ ] No OOMKill under peak load
- [ ] num_threads matched to workload (CPU vs I/O bound)
- [ ] RSS stays below 80% of container limit
- [ ] Liveness probe configured
- [ ] Configuration documented
- [ ] Per-thread memory usage profiled
- [ ] Container memory request calculated
- [ ] Container memory limit set with burst allowance
- [ ] frankenphp.num_threads configured

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Process vs Thread vs Coroutine**: PHP-FPM uses processes (max isolation, highest memory). FrankenPHP uses threads (shared memory, lower isolation). Swoole uses coroutines (shared memory + cooperative multitasking, lowest memory per request). The choice depends on isolation requirements and acceptable complexity.
- [ ] **Embedded SAPI vs sidecar process**: FrankenPHP embeds PHP directly into Caddy (single binary deployment). RoadRunner runs PHP as a sidecar process (separate lifecycle management). Swoole runs PHP as a C-extension within the SAPI. Each model affects deployment, monitoring, and debugging workflows.
- [ ] **Dual Memory Systems**: Go's garbage collector manages Caddy's allocations but not PHP's. PHP memory is managed by Zend MM with per-thread heaps and periodic OPcache recycling.
- [ ] **CGO Pinning**: `runtime.Pinner` prevents Go GC from moving memory that PHP has pointers to. This increases Go GC pressure slightly.
- [ ] **Container Resource Boundaries**: Docker CPU limits apply to the combined Go + PHP process. CPU throttling affects both runtimes â€” set CPU requests high enough for baseline load.
- [ ] **OOM Safety Margin**: Leave 25% of container memory unallocated for page cache, filesystem buffers, and temporary allocations. This prevents OOM kills during traffic spikes.
- [ ] Document and follow through on architectural decision: Container memory limits for FrankenPHP
- [ ] Ensure architecture aligns with core concept: **GOMEMLIMIT**: Go environment variable setting a soft memory limit. Set to 80% of container memory limit. Prevents Go runtime from OOM-killing the container. Example: `GOMEMLIMIT=800MiB`.
- [ ] Ensure architecture aligns with core concept: **PHP Memory Per Thread**: Each thread's `memory_limit` applies independently. A thread hitting memory_limit crashes that thread only â€” the worker pool restarts it.
- [ ] Ensure architecture aligns with core concept: **glibc vs musl**: glibc has better performance for PHP workloads (optimized memory allocator, faster string operations). musl (Alpine) uses less disk space but is 10-20% slower.
- [ ] Ensure architecture aligns with core concept: **OOM Risk Calculation**: `max_threads Ã— P95_thread_RSS + Go_heap_overhead = total_memory` must be â‰¤ container_memory_limit Ã— 0.75 (leaving 25% for page cache and other processes).

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Set GOMEMLIMIT to 80% of container limit**: This provides Go runtime headroom while leaving room for page cache and system processes. Example: `GOMEMLIMIT=800MiB` for a 1GB container.
- [ ] **Use debian-slim (glibc) for production**: The 10-20% performance penalty from musl's malloc and string operations directly reduces throughput. Alpine is acceptable for development only.
- [ ] **Calculate max_threads from OOM budget**: Use the formula `max_threads = (container_limit Ã— 0.75 - Go_overhead) / P95_thread_RSS`. Document the calculation.
- [ ] **Set PHP memory_limit per thread**: Configure `memory_limit = 128M` (or appropriate value) in php.ini. This is separate from GOMEMLIMIT.
- [ ] **Monitor memory in layers**: Track Go heap, Go stack, PHP per-thread RSS, and OpCache memory separately. Drift in one layer indicates specific issues.
- [ ] Set container memory request = memory_limit_per_thread Ã— num_threads Ã— 1.2 (20% overhead for shared structures)
- [ ] Set container memory limit = memory request Ã— 1.25-1.5 (burst allowance)
- [ ] Configure `php.memory_limit` in the Caddyfile to the per-thread limit
- [ ] Configure `frankenphp.num_threads` based on CPU cores Ã— 2-4 (I/O-bound) or cores (CPU-bound)
- [ ] Monitor container RSS: if it approaches the limit, reduce num_threads or increase the limit
- [ ] Enable Liveness probe: hit a health endpoint to detect OOM-killed containers
- [ ] For Kubernetes: set resource.requests.memory = calculated value, resource.limits.memory = 1.5x
- [ ] Test under expected peak load â€” container should stay below 80% of the memory limit
- [ ] If OOMKilled occurs, increase limit or reduce threads
- [ ] Document the container resource configuration

# Performance Checklist (from 04/06)
- [ ] glibc vs musl: musl (Alpine) is 10-20% slower on PHP benchmarks due to less optimized malloc and string operations
- [ ] GOMEMLIMIT prevents OOM but soft limits can cause Go GC to run more frequently at high memory pressure
- [ ] PHP memory_limit per thread provides fault isolation â€” one leaky request doesn't crash all threads
- [ ] CGO pinning adds ~5% GC overhead for the Go runtime
- [ ] FrankenPHP
- [ ] RoadRunner
- [ ] Swoole
- [ ] PHP-FPM

# Security Checklist (from 04/06 - only if relevant)
- [ ] OOM kills in containerized FrankenPHP cause total service unavailability. Proper memory budgeting is a security availability concern.
- [ ] GOMEMLIMIT is a soft limit â€” the Go runtime can exceed it temporarily. Hard limits are enforced by the container runtime (cgroup).
- [ ] Thread memory limits per PHP memory_limit prevent single requests from exhausting shared resources.
- [ ] Container resource limits (Kubernetes requests/limits) must account for both Go and PHP memory. Undersizing leads to OOM; oversizing wastes cluster resources.

# Reliability Checklist (from 04/05/06)
- [ ] **Thread safety violation** (FrankenPHP): Extension not ZTS-compatible crashes worker. Symptom: Segfault in thread context. Mitigation: Test all extensions with ZTS, disable incompatible ones.
- [ ] **Coroutine deadlock** (Swoole): Blocking I/O in coroutine blocks all coroutines on that thread. Symptom: Partial site unresponsive. Mitigation: Ensure all I/O uses coroutine-aware libraries, set swoole hook flags.
- [ ] **Process leak** (RoadRunner): PHP worker processes accumulate over time. Symptom: Zombie PHP processes, memory growth. Mitigation: Monitor worker lifecycle, configure max_worker lifetime.
- [ ] **CGO memory leak** (FrankenPHP): Go GC doesn't collect PHP memory. Symptom: RSS grows over time. Mitigation: Set pm.max_requests to recycle threads, monitor RSS trends.
- [ ] **Monitoring**: All alternative runtimes require custom monitoring. Use the SAPI-specific status endpoints (FrankenPHP: Caddy metrics, RoadRunner: /health?plugin=http, Swoole: $server->stats()).
- [ ] **Logging**: FrankenPHP logs via Caddy's structured logging. RoadRunner writes to stdout/stderr. Swoole has built-in logger. Centralize logs via syslog or filebeat.
- [ ] **Graceful shutdown**: All three support SIGTERM for graceful shutdown Ã¢â‚¬â€ workers finish current requests before exiting. Test shutdown behavior under load.
- [ ] **Update procedure**: Runtime updates require testing worker compatibility. Always deploy to a subset first.

# Testing Checklist (from 04/06)
- [ ] GOMEMLIMIT set to 80% of container memory limit
- [ ] debian-slim (glibc) base image used for production
- [ ] PHP memory_limit configured per thread
- [ ] max_threads calculated from OOM risk formula
- [ ] Go runtime version 1.19+ (check FrankenPHP binary)
- [ ] Separate monitoring for Go heap and PHP thread memory
- [ ] Container resource limits documented and reviewed
- [ ] OOM safety margin (25%) maintained in calculations
- [ ] Container memory configuration calculated and applied
- [ ] No OOMKill under peak load
- [ ] num_threads matched to workload (CPU vs I/O bound)
- [ ] RSS stays below 80% of container limit
- [ ] Liveness probe configured
- [ ] Configuration documented
- [ ] Per-thread memory usage profiled
- [ ] Container memory request calculated
- [ ] Container memory limit set with burst allowance
- [ ] frankenphp.num_threads configured
- [ ] Liveness probe configured for OOM detection
- [ ] RSS stays below 80% of limit

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Set GOMEMLIMIT to 80% of container limit**: This provides Go runtime headroom while leaving room for page cache and system processes. Example: `GOMEMLIMIT=800MiB` for a 1GB container.
- [ ] **Use debian-slim (glibc) for production**: The 10-20% performance penalty from musl's malloc and string operations directly reduces throughput. Alpine is acceptable for development only.
- [ ] **Calculate max_threads from OOM budget**: Use the formula `max_threads = (container_limit Ã— 0.75 - Go_overhead) / P95_thread_RSS`. Document the calculation.
- [ ] **Set PHP memory_limit per thread**: Configure `memory_limit = 128M` (or appropriate value) in php.ini. This is separate from GOMEMLIMIT.
- [ ] **Monitor memory in layers**: Track Go heap, Go stack, PHP per-thread RSS, and OpCache memory separately. Drift in one layer indicates specific issues.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using Alpine (musl) for production FrankenPHP
- [ ] Avoid: Missing GOMEMLIMIT in container
- [ ] Avoid: Not isolating PHP and Go memory monitoring
- [ ] Avoid: Oversizing max_threads without memory calculation
- [ ] Avoid anti-pattern: **Setting GOMEMLIMIT equal to container limit**: No headroom for page cache causes OOM. Always set GOMEMLIMIT below container limit.
- [ ] Avoid anti-pattern: **Disabling PHP memory_limit**: Without per-thread limits, one runaway request can crash the entire thread pool.
- [ ] Avoid anti-pattern: **Ignoring Go GC pressure from CGO pinning**: High request rates with many CGO crossings increase Go GC overhead. Monitor Go GC metrics.
- [ ] Avoid anti-pattern: **Using CPU limits lower than thread count**: FrankenPHP needs at least as many CPU shares as configured threads. Under-CPU causes thread contention.
- [ ] Guard against anti-pattern: Porting PHP-FPM Code Without Adapting to Persistent Runtime
- [ ] Guard against anti-pattern: Choosing Runtime Without Workload Analysis
- [ ] Guard against anti-pattern: Not Configuring Worker Count to CPU Topology
- [ ] Guard against anti-pattern: Ignoring Goridge Serialization Overhead (RoadRunner)
- [ ] Guard against anti-pattern: FrankenPHP Thread Safety Violations
- [ ] Static state audited and reset

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Monitoring**: All alternative runtimes require custom monitoring. Use the SAPI-specific status endpoints (FrankenPHP: Caddy metrics, RoadRunner: /health?plugin=http, Swoole: $server->stats()).
- [ ] **Logging**: FrankenPHP logs via Caddy's structured logging. RoadRunner writes to stdout/stderr. Swoole has built-in logger. Centralize logs via syslog or filebeat.
- [ ] **Graceful shutdown**: All three support SIGTERM for graceful shutdown Ã¢â‚¬â€ workers finish current requests before exiting. Test shutdown behavior under load.
- [ ] **Update procedure**: Runtime updates require testing worker compatibility. Always deploy to a subset first.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **GOMEMLIMIT**: Go environment variable setting a soft memory limit. Set to 80% of container memory limit. Prevents Go runtime from OOM-killing the container. Example: `GOMEMLIMIT=800MiB`., **PHP Memory Per Thread**: Each thread's `memory_limit` applies independently. A thread hitting memory_limit crashes that thread only â€” the worker pool restarts it., **glibc vs musl**: glibc has better performance for PHP workloads (optimized memory allocator, faster string operations). musl (Alpine) uses less disk space but is 10-20% slower., **OOM Risk Calculation**: `max_threads Ã— P95_thread_RSS + Go_heap_overhead = total_memory` must be â‰¤ container_memory_limit Ã— 0.75 (leaving 25% for page cache and other processes).
**Skills:** FrankenPHP Architecture Caddy/CGO/SAPI, FrankenPHP Worker Thread Management, Containerized Deployment Cache Strategies, Octane Memory Management
**Decision Trees:** Container memory limits for FrankenPHP
**Anti-Patterns:** Porting PHP-FPM Code Without Adapting to Persistent Runtime, Choosing Runtime Without Workload Analysis, Not Configuring Worker Count to CPU Topology, Ignoring Goridge Serialization Overhead (RoadRunner), FrankenPHP Thread Safety Violations
**Related Topics:** FrankenPHP Worker Thread Management, FrankenPHP Architecture, Containerized Deployment Cache Strategies, PHP-FPM Pool Sizing Formula

