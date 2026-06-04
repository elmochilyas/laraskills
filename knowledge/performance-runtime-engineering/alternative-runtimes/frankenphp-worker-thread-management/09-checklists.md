# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** FrankenPHP Worker and Thread Management — num_threads, max_threads, Auto-Scaling
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Calculate max_threads from memory budget**: Use `max_threads = (available_RAM - system_reserve - Go_overhead) / avg_thread_RSS`. Apply 1.2x safety factor.
- [ ] **Set num_threads for baseline traffic**: num_threads should handle average load. Auto-scaling handles traffic spikes above the baseline.
- [ ] **Configure max_wait_time realistically**: 100-500ms for latency-sensitive APIs, longer for background processing. Shorter wait times trigger more aggressive scaling.
- [ ] **Set max_requests for thread recycling**: 1000-5000 to prevent memory drift. This is FrankenPHP's equivalent of FPM's pm.max_requests.
- [ ] **Monitor thread transitions**: Use FrankenPHP metrics to track thread state transitions. Excessive booting/done cycles indicate pool misconfiguration.
- [ ] num_threads configured for baseline traffic
- [ ] max_threads calculated from memory budget with 1.2x safety factor
- [ ] max_requests configured (1000-5000)
- [ ] max_wait_time and max_idle_time configured
- [ ] Thread pool utilization monitoring in place
- [ ] thread count matched to workload and core count
- [ ] Per-thread memory_limit configured
- [ ] CPU utilization <80% at peak
- [ ] No 504 errors from thread exhaustion
- [ ] Configuration documented with rationale
- [ ] Workload classified (CPU vs I/O bound)
- [ ] num_threads set based on workload and core count
- [ ] max_execution_time configured
- [ ] Octane FrankenPHP workers configured
- [ ] Configuration documented

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Process vs Thread vs Coroutine**: PHP-FPM uses processes (max isolation, highest memory). FrankenPHP uses threads (shared memory, lower isolation). Swoole uses coroutines (shared memory + cooperative multitasking, lowest memory per request). The choice depends on isolation requirements and acceptable complexity.
- [ ] **Embedded SAPI vs sidecar process**: FrankenPHP embeds PHP directly into Caddy (single binary deployment). RoadRunner runs PHP as a sidecar process (separate lifecycle management). Swoole runs PHP as a C-extension within the SAPI. Each model affects deployment, monitoring, and debugging workflows.
- [ ] **Thread Spawn Time**: ~30-100ms per thread (PHP bootstrap with preloading). Auto-scaling spawns slower than FPM but the cost is amortized across many requests.
- [ ] **Thread vs Process Recycling**: Thread recycling via max_requests is less costly than process recycling in FPM because threads share OpCache memory.
- [ ] **Shared OpCache Benefit**: Threads within the same process share OpCache memory. This reduces total RAM compared to FPM where each process has its own OpCache.
- [ ] **Memory Isolation Limitations**: Threads share the same address space. A memory corruption in one thread can potentially crash the entire process.
- [ ] Document and follow through on architectural decision: Worker count for FrankenPHP
- [ ] Ensure architecture aligns with core concept: **num_threads**: Minimum number of PHP threads always available. Set to number of CPU cores for compute-bound, 2-4x cores for I/O-bound workloads.
- [ ] Ensure architecture aligns with core concept: **max_threads**: Maximum threads the pool can grow to. Bound by available memory. Each thread consumes ~30-80MB (similar to FPM worker RSS).
- [ ] Ensure architecture aligns with core concept: **Auto-Scaling**: Thread count increases when `max_wait_time` is exceeded (requests waiting for an available thread). Decreases when threads are idle for `max_idle_time`.
- [ ] Ensure architecture aligns with core concept: **Thread State Machine**: Reserved (slot allocated) â†’ Booting (PHP initializing) â†’ Inactive (waiting for request) â†’ TransitionRequested (being reassigned) â†’ Ready (handling request) â†’ Done (request complete).

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Calculate max_threads from memory budget**: Use `max_threads = (available_RAM - system_reserve - Go_overhead) / avg_thread_RSS`. Apply 1.2x safety factor.
- [ ] **Set num_threads for baseline traffic**: num_threads should handle average load. Auto-scaling handles traffic spikes above the baseline.
- [ ] **Configure max_wait_time realistically**: 100-500ms for latency-sensitive APIs, longer for background processing. Shorter wait times trigger more aggressive scaling.
- [ ] **Set max_requests for thread recycling**: 1000-5000 to prevent memory drift. This is FrankenPHP's equivalent of FPM's pm.max_requests.
- [ ] **Monitor thread transitions**: Use FrankenPHP metrics to track thread state transitions. Excessive booting/done cycles indicate pool misconfiguration.
- [ ] Determine workload type: I/O-bound (threads > cores) vs CPU-bound (threads <= cores)
- [ ] For I/O-bound: set `frankenphp.num_threads = CPU_cores Ã— 2-4` (threads wait for I/O)
- [ ] For CPU-bound: set `frankenphp.num_threads = CPU_cores` (threads compete for CPU)
- [ ] For mixed: start with `CPU_cores Ã— 2` and adjust based on CPU utilization
- [ ] Set per-thread memory limit: `php.memory_limit = total_memory / num_threads Ã— 0.8`
- [ ] Configure max_execution_time for threads via `php.max_execution_time = 30` (or appropriate value)
- [ ] For Laravel Octane with FrankenPHP: use `php artisan octane:start --server=frankenphp --workers=num_threads`
- [ ] Monitor CPU utilization: if >80%, reduce thread count
- [ ] Monitor 504 errors: if increasing, threads may be overloaded â€” increase count
- [ ] Document the thread configuration and rationale

# Performance Checklist (from 04/06)
- [ ] Thread spawn time: ~30-100ms (PHP bootstrap with preloading). Auto-scaling spawns slower than FPM but the cost is amortized across many requests.
- [ ] Max threads: Calculate as `(available_RAM - system_reserve) / avg_thread_RSS`. Apply same safety factor as FPM max_children.
- [ ] Thread recycling via `max_requests` (per thread) â€” same principle as pm.max_requests to prevent memory drift.
- [ ] Auto-scaling reduces waste during low traffic while maintaining responsiveness during spikes.
- [ ] FrankenPHP
- [ ] RoadRunner
- [ ] Swoole
- [ ] PHP-FPM

# Security Checklist (from 04/06 - only if relevant)
- [ ] Thread safety is critical in multithreaded PHP. ZTS-incompatible extensions can cause segfaults that crash all threads.
- [ ] Memory limits are per-thread. One thread hitting memory_limit crashes that thread only â€” the pool restarts it.
- [ ] Shared OpCache means all threads can see all cached files. No cache-based information isolation between threads.
- [ ] Thread pool exhaustion (all threads busy) causes connection queuing. Configure proper timeouts to prevent resource exhaustion.

# Reliability Checklist (from 04/05/06)
- [ ] **Thread safety violation** (FrankenPHP): Extension not ZTS-compatible crashes worker. Symptom: Segfault in thread context. Mitigation: Test all extensions with ZTS, disable incompatible ones.
- [ ] **Coroutine deadlock** (Swoole): Blocking I/O in coroutine blocks all coroutines on that thread. Symptom: Partial site unresponsive. Mitigation: Ensure all I/O uses coroutine-aware libraries, set swoole hook flags.
- [ ] **Process leak** (RoadRunner): PHP worker processes accumulate over time. Symptom: Zombie PHP processes, memory growth. Mitigation: Monitor worker lifecycle, configure max_worker lifetime.
- [ ] **CGO memory leak** (FrankenPHP): Go GC doesn't collect PHP memory. Symptom: RSS grows over time. Mitigation: Set pm.max_requests to recycle threads, monitor RSS trends.
- [ ] **Monitoring**: All alternative runtimes require custom monitoring. Use the SAPI-specific status endpoints (FrankenPHP: Caddy metrics, RoadRunner: /health?plugin=http, Swoole: $server->stats()).
- [ ] **Logging**: FrankenPHP logs via Caddy's structured logging. RoadRunner writes to stdout/stderr. Swoole has built-in logger. Centralize logs via syslog or filebeat.
- [ ] **Graceful shutdown**: All three support SIGTERM for graceful shutdown â€” workers finish current requests before exiting. Test shutdown behavior under load.
- [ ] **Update procedure**: Runtime updates require testing worker compatibility. Always deploy to a subset first.

# Testing Checklist (from 04/06)
- [ ] num_threads configured for baseline traffic
- [ ] max_threads calculated from memory budget with 1.2x safety factor
- [ ] max_requests configured (1000-5000)
- [ ] max_wait_time and max_idle_time configured
- [ ] Thread pool utilization monitoring in place
- [ ] All extensions verified ZTS-compatible
- [ ] Memory budget documented and reviewed
- [ ] Auto-scaling behavior validated in staging
- [ ] thread count matched to workload and core count
- [ ] Per-thread memory_limit configured
- [ ] CPU utilization <80% at peak
- [ ] No 504 errors from thread exhaustion
- [ ] Configuration documented with rationale
- [ ] Workload classified (CPU vs I/O bound)
- [ ] num_threads set based on workload and core count
- [ ] max_execution_time configured
- [ ] Octane FrankenPHP workers configured
- [ ] Configuration documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Calculate max_threads from memory budget**: Use `max_threads = (available_RAM - system_reserve - Go_overhead) / avg_thread_RSS`. Apply 1.2x safety factor.
- [ ] **Set num_threads for baseline traffic**: num_threads should handle average load. Auto-scaling handles traffic spikes above the baseline.
- [ ] **Configure max_wait_time realistically**: 100-500ms for latency-sensitive APIs, longer for background processing. Shorter wait times trigger more aggressive scaling.
- [ ] **Set max_requests for thread recycling**: 1000-5000 to prevent memory drift. This is FrankenPHP's equivalent of FPM's pm.max_requests.
- [ ] **Monitor thread transitions**: Use FrankenPHP metrics to track thread state transitions. Excessive booting/done cycles indicate pool misconfiguration.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Setting max_threads too high
- [ ] Avoid: Not setting max_requests
- [ ] Avoid: num_threads equal to max_threads
- [ ] Avoid: Thread pool exhaustion without monitoring
- [ ] Avoid anti-pattern: **Setting num_threads too high**: Keeps idle threads consuming memory. Set num_threads to handle baseline traffic only.
- [ ] Avoid anti-pattern: **Ignoring thread spawn latency**: Auto-scaling takes 30-100ms per thread. If traffic spikes are faster than the spawn rate, configure higher num_threads for headroom.
- [ ] Avoid anti-pattern: **Using thread count for throughput scaling**: Adding threads increases concurrency but each thread adds RSS. Memory budget, not throughput desire, should bound max_threads.
- [ ] Avoid anti-pattern: **Assuming thread recycling eliminates all state issues**: Static properties and singletons can still leak across requests. Apply Octane-style state management in FrankenPHP.
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
- [ ] **Graceful shutdown**: All three support SIGTERM for graceful shutdown â€” workers finish current requests before exiting. Test shutdown behavior under load.
- [ ] **Update procedure**: Runtime updates require testing worker compatibility. Always deploy to a subset first.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **num_threads**: Minimum number of PHP threads always available. Set to number of CPU cores for compute-bound, 2-4x cores for I/O-bound workloads., **max_threads**: Maximum threads the pool can grow to. Bound by available memory. Each thread consumes ~30-80MB (similar to FPM worker RSS)., **Auto-Scaling**: Thread count increases when `max_wait_time` is exceeded (requests waiting for an available thread). Decreases when threads are idle for `max_idle_time`., **Thread State Machine**: Reserved (slot allocated) â†’ Booting (PHP initializing) â†’ Inactive (waiting for request) â†’ TransitionRequested (being reassigned) â†’ Ready (handling request) â†’ Done (request complete).
**Skills:** FrankenPHP Architecture Caddy/CGO/SAPI, FrankenPHP Container Memory Management, Octane Worker Configuration by Driver
**Decision Trees:** Worker count for FrankenPHP
**Anti-Patterns:** Porting PHP-FPM Code Without Adapting to Persistent Runtime, Choosing Runtime Without Workload Analysis, Not Configuring Worker Count to CPU Topology, Ignoring Goridge Serialization Overhead (RoadRunner), FrankenPHP Thread Safety Violations
**Related Topics:** FrankenPHP Architecture, FrankenPHP Installation and Caddyfile, FrankenPHP Container Memory Management, PHP-FPM Worker Management

