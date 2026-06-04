# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** Swoole io_uring Integration — Async I/O with Linux Kernel Interface (Swoole 6.2+)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Verify kernel version in deployment**: Run `uname -r` during deployment to confirm io_uring availability. Log the result for monitoring.
- [ ] **Benchmark filesystem-heavy operations**: Compare throughput with and without io_uring for your specific file workloads.
- [ ] **Monitor SQ/CQ pressure**: High submission queue pressure indicates the application is saturating io_uring's capacity. Consider increasing ring sizes via `IORING_SETUP_SQPOLL`.
- [ ] **Combine with coroutine hooks**: Ensure SWOOLE_HOOK_ALL is enabled to maximize io_uring coverage across all I/O operations.
- [ ] Kernel version 5.19+ confirmed (`uname -r`)
- [ ] Swoole 6.2+ installed (`php -r 'echo swoole_version();'`)
- [ ] SWOOLE_HOOK_ALL enabled
- [ ] io_uring backend confirmed active in production
- [ ] Filesystem-heavy operations benchmarked with/without io_uring
- [ ] io_uring support verified for kernel and Swoole
- [ ] io_uring enabled and configured
- [ ] Filesystem I/O benchmark shows measurable improvement
- [ ] io_uring statistics monitored for saturation
- [ ] Configuration documented
- [ ] Kernel version >= 5.1 confirmed
- [ ] Swoole compiled with io_uring support
- [ ] swoole.use_io_uring=On configured
- [ ] io_uring_entries set appropriately
- [ ] Filesystem I/O benchmark completed
- [ ] Throughput improvement measured

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Process vs Thread vs Coroutine**: PHP-FPM uses processes (max isolation, highest memory). FrankenPHP uses threads (shared memory, lower isolation). Swoole uses coroutines (shared memory + cooperative multitasking, lowest memory per request). The choice depends on isolation requirements and acceptable complexity.
- [ ] **Embedded SAPI vs sidecar process**: FrankenPHP embeds PHP directly into Caddy (single binary deployment). RoadRunner runs PHP as a sidecar process (separate lifecycle management). Swoole runs PHP as a C-extension within the SAPI. Each model affects deployment, monitoring, and debugging workflows.
- [ ] **Automatic Fallback**: Swoole falls back to epoll/aio if io_uring is unavailable. No code changes needed â€” but verify which backend is active in production.
- [ ] **Kernel Compatibility**: io_uring support has improved across kernel versions. Linux 6.x provides significant performance and stability improvements over 5.19.
- [ ] **ARM64 Considerations**: io_uring on ARM64 has limited support in older kernels. Verify with Swoole compatibility matrix for your specific ARM64 kernel version.
- [ ] **Container Environments**: io_uring requires kernel support even in containers. Some container runtimes may restrict io_uring syscalls via seccomp profiles.
- [ ] Document and follow through on architectural decision: Enabling io_uring for I/O operations
- [ ] Ensure architecture aligns with core concept: **io_uring Mechanism**: Kernel maintains two ring buffers in shared memory - Submission Queue (applications queue I/O requests) and Completion Queue (kernel posts results). No syscall per I/O â€” just memory writes to shared ring buffers.
- [ ] Ensure architecture aligns with core concept: **Swoole Integration**: Automatically enabled on Linux 5.19+ kernels. Uses `SWOOLE_IOURING` flag internally. Falls back to epoll/aio if unavailable â€” no configuration needed.
- [ ] Ensure architecture aligns with core concept: **Filesystem Benefits**: File reads, writes, opens, stats become truly async. With epoll, filesystem operations had to be dispatched to thread pools, adding latency and resource contention.
- [ ] Ensure architecture aligns with core concept: **Network Benefits**: Accept, connect, sendfile operations benefit from io_uring's reduced syscall overhead.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Verify kernel version in deployment**: Run `uname -r` during deployment to confirm io_uring availability. Log the result for monitoring.
- [ ] **Benchmark filesystem-heavy operations**: Compare throughput with and without io_uring for your specific file workloads.
- [ ] **Monitor SQ/CQ pressure**: High submission queue pressure indicates the application is saturating io_uring's capacity. Consider increasing ring sizes via `IORING_SETUP_SQPOLL`.
- [ ] **Combine with coroutine hooks**: Ensure SWOOLE_HOOK_ALL is enabled to maximize io_uring coverage across all I/O operations.
- [ ] Verify kernel version: `uname -r` must be >= 5.1
- [ ] Verify Swoole build includes io_uring: `php -i | grep "io_uring"` should show "io_uring support => enabled"
- [ ] If not enabled, recompile Swoole with `--enable-swoole-io_uring` flag
- [ ] Enable io_uring in Swoole configuration: `swoole.use_io_uring=On` in php.ini
- [ ] Configure io_uring queue depth: `swoole.io_uring_entries=1024` (or higher for heavy I/O)
- [ ] io_uring auto-hooks filesystem operations: `file_get_contents()`, `fread()`, `fwrite()`, `file_put_contents()`
- [ ] Verify: benchmark filesystem I/O with and without io_uring â€” measure throughput improvement
- [ ] Monitor io_uring statistics via `swoole_io_uring_status()` for queue depth and completion rates
- [ ] If io_uring submission queue fills up, increase `io_uring_entries`
- [ ] Document the io_uring configuration and expected improvement

# Performance Checklist (from 04/06)
- [ ] io_uring provides 2-5x improvement for filesystem-heavy workloads (file uploads, log streaming, image processing)
- [ ] For pure network I/O (database queries, HTTP requests), improvement is 5-15% over epoll
- [ ] Requires Linux 5.19+ â€” not available on older kernels; ARM64 support is limited
- [ ] io_uring reduces syscall overhead from ~1Î¼s per epoll event to ~100ns per submission queue entry
- [ ] FrankenPHP
- [ ] RoadRunner
- [ ] Swoole
- [ ] PHP-FPM

# Security Checklist (from 04/06 - only if relevant)
- [ ] io_uring bypasses certain security mechanisms that operate at the syscall layer. Some security tools may not monitor io_uring operations.
- [ ] Container runtimes with strict seccomp profiles may block io_uring syscalls. Verify in staging before production deployment.
- [ ] Swoole's io_uring integration should be monitored for CVE announcements as the feature matures.

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
- [ ] Kernel version 5.19+ confirmed (`uname -r`)
- [ ] Swoole 6.2+ installed (`php -r 'echo swoole_version();'`)
- [ ] SWOOLE_HOOK_ALL enabled
- [ ] io_uring backend confirmed active in production
- [ ] Filesystem-heavy operations benchmarked with/without io_uring
- [ ] Container seccomp profiles allow io_uring syscalls
- [ ] Staging kernel matches production kernel version
- [ ] io_uring support verified for kernel and Swoole
- [ ] io_uring enabled and configured
- [ ] Filesystem I/O benchmark shows measurable improvement
- [ ] io_uring statistics monitored for saturation
- [ ] Configuration documented
- [ ] Kernel version >= 5.1 confirmed
- [ ] Swoole compiled with io_uring support
- [ ] swoole.use_io_uring=On configured
- [ ] io_uring_entries set appropriately
- [ ] Filesystem I/O benchmark completed
- [ ] Throughput improvement measured
- [ ] io_uring statistics monitored

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Verify kernel version in deployment**: Run `uname -r` during deployment to confirm io_uring availability. Log the result for monitoring.
- [ ] **Benchmark filesystem-heavy operations**: Compare throughput with and without io_uring for your specific file workloads.
- [ ] **Monitor SQ/CQ pressure**: High submission queue pressure indicates the application is saturating io_uring's capacity. Consider increasing ring sizes via `IORING_SETUP_SQPOLL`.
- [ ] **Combine with coroutine hooks**: Ensure SWOOLE_HOOK_ALL is enabled to maximize io_uring coverage across all I/O operations.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Deploying Swoole 6.2+ on kernels without io_uring
- [ ] Avoid: Expecting io_uring to improve network I/O
- [ ] Avoid: Not testing in staging with same kernel
- [ ] Avoid anti-pattern: **Patching Swoole to force io_uring on unsupported kernels**: Can cause segfaults and undefined behavior. Always let Swoole handle fallback.
- [ ] Avoid anti-pattern: **Disabling epoll fallback**: Removing the fallback mechanism causes Swoole to crash on kernels without io_uring. Never disable fallback.
- [ ] Avoid anti-pattern: **Assuming io_uring eliminates all I/O bottlenecks**: io_uring helps with syscall overhead but doesn't fix slow storage hardware or network latency.
- [ ] Guard against anti-pattern: Porting PHP-FPM Code Without Adapting to Persistent Runtime
- [ ] Guard against anti-pattern: Choosing Runtime Without Workload Analysis
- [ ] Guard against anti-pattern: Not Configuring Worker Count to CPU Topology
- [ ] Guard against anti-pattern: Ignoring Goridge Serialization Overhead (RoadRunner)
- [ ] Guard against anti-pattern: FrankenPHP Thread Safety Violations
- [ ] Static state audited and reset
- [ ] Memory stable over 10k requests

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
**Core Concepts:** **io_uring Mechanism**: Kernel maintains two ring buffers in shared memory - Submission Queue (applications queue I/O requests) and Completion Queue (kernel posts results). No syscall per I/O â€” just memory writes to shared ring buffers., **Swoole Integration**: Automatically enabled on Linux 5.19+ kernels. Uses `SWOOLE_IOURING` flag internally. Falls back to epoll/aio if unavailable â€” no configuration needed., **Filesystem Benefits**: File reads, writes, opens, stats become truly async. With epoll, filesystem operations had to be dispatched to thread pools, adding latency and resource contention., **Network Benefits**: Accept, connect, sendfile operations benefit from io_uring's reduced syscall overhead.
**Skills:** Swoole Architecture and Coroutine Model, Swoole Installation and Configuration, Sync vs Async I/O Assessment
**Decision Trees:** Enabling io_uring for I/O operations
**Anti-Patterns:** Porting PHP-FPM Code Without Adapting to Persistent Runtime, Choosing Runtime Without Workload Analysis, Not Configuring Worker Count to CPU Topology, Ignoring Goridge Serialization Overhead (RoadRunner), FrankenPHP Thread Safety Violations
**Related Topics:** Swoole Architecture and Coroutine Model, Swoole Installation and Configuration, Runtime Comparison Overview, JIT Compilation for I/O Workloads

