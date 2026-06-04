# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** Swoole Architecture and Coroutine Model â€” Event-Driven, One-Click Coroutineization
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Always benchmark with production traffic**: Swoole's performance varies dramatically by I/O profile. Run 24-hour soak tests to detect memory leaks in long-running workers.
- [ ] **Set SWOOLE_HOOK_ALL**: Enable all coroutine hooks to maximize non-blocking coverage. Verify library compatibility in staging.
- [ ] **Match worker_num to CPU cores**: Set `worker_num = swoole_cpu_num()` for CPU-bound workloads. Increase 1.5-2x for I/O-bound workloads.
- [ ] **Configure max_request for recycling**: Set 1000-5000 to prevent memory drift without excessive process spawn overhead.
- [ ] **Use task_worker_num for blocking operations**: Isolate database writes, file operations, and external API calls to task workers to avoid blocking the coroutine event loop.
- [ ] Swoole extension installed and loaded (`php -m | grep swoole`)
- [ ] coroutine hooks configured with SWOOLE_HOOK_ALL
- [ ] worker_num set to appropriate value based on CPU cores
- [ ] max_request configured (1000-5000)
- [ ] 24-hour soak test completed without memory growth
- [ ] Swoole's coroutine architecture understood
- [ ] Auto-hooking mechanism understood
- [ ] Coroutine-safe coding practices identified
- [ ] Performance implications documented
- [ ] Architecture documented for team reference
- [ ] Event loop / coroutine architecture understood
- [ ] Auto-hooking for PDO, MySQLi, Redis, cURL understood
- [ ] Coroutine yield/resume mechanism understood
- [ ] Coroutine overhead quantified (~1Âµs per yield)
- [ ] Debugging tools (Co::stats, swoole_async) known

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Process vs Thread vs Coroutine**: PHP-FPM uses processes (max isolation, highest memory). FrankenPHP uses threads (shared memory, lower isolation). Swoole uses coroutines (shared memory + cooperative multitasking, lowest memory per request). The choice depends on isolation requirements and acceptable complexity.
- [ ] **Embedded SAPI vs sidecar process**: FrankenPHP embeds PHP directly into Caddy (single binary deployment). RoadRunner runs PHP as a sidecar process (separate lifecycle management). Swoole runs PHP as a C-extension within the SAPI. Each model affects deployment, monitoring, and debugging workflows.
- [ ] **Coroutine Safety**: All I/O must use coroutine-aware libraries. Blocking I/O in a coroutine blocks ALL coroutines on that thread.
- [ ] **Worker Process Model**: Each worker runs an independent event loop with thousands of coroutines. worker_num determines CPU scaling; `swoole_cpu_num()` returns the optimal value.
- [ ] **Task Worker Isolation**: Use a separate task worker pool for synchronous operations. Task workers are not coroutine-aware and operate in blocking mode.
- [ ] **OpenSwoole Considerations**: The community fork offers ~16% performance edge over original Swoole in some benchmarks. Evaluate both for your workload.
- [ ] Document and follow through on architectural decision: Swoole adoption for coroutine support
- [ ] Ensure architecture aligns with core concept: **Event Loop**: epoll (Linux) / kqueue (macOS) / iocp (Windows) based. Monitors all file descriptors. When data is ready, the corresponding coroutine is resumed.
- [ ] Ensure architecture aligns with core concept: **Coroutine**: Lightweight execution context (~2KB stack). Created per request. Yields on I/O (auto-hooked). Resumes when I/O completes. No OS thread involvement.
- [ ] Ensure architecture aligns with core concept: **One-Click Coroutineization**: `Co\run()` or `swoole_async_set(['hook_flags' => SWOOLE_HOOK_ALL])` enables transparent hooking of PHP's synchronous functions.
- [ ] Ensure architecture aligns with core concept: **Coroutine Scheduling Overhead**: ~1Âµs per yield/resume cycle. Under zero-I/O conditions, this overhead makes Swoole ~10% slower than FPM.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Always benchmark with production traffic**: Swoole's performance varies dramatically by I/O profile. Run 24-hour soak tests to detect memory leaks in long-running workers.
- [ ] **Set SWOOLE_HOOK_ALL**: Enable all coroutine hooks to maximize non-blocking coverage. Verify library compatibility in staging.
- [ ] **Match worker_num to CPU cores**: Set `worker_num = swoole_cpu_num()` for CPU-bound workloads. Increase 1.5-2x for I/O-bound workloads.
- [ ] **Configure max_request for recycling**: Set 1000-5000 to prevent memory drift without excessive process spawn overhead.
- [ ] **Use task_worker_num for blocking operations**: Isolate database writes, file operations, and external API calls to task workers to avoid blocking the coroutine event loop.
- [ ] Understand Swoole's architecture: event loop (Reactor) -> worker processes -> coroutine containers
- [ ] Coroutines are user-space, cooperative multitasking â€” they yield at I/O operations, not at arbitrary points
- [ ] Swoole auto-hooks PHP functions: `PDO->query()`, `MySQLi->query()`, `Redis->get()`, `curl_exec()` â€” these become non-blocking automatically
- [ ] When a coroutine calls a hooked function, it yields (suspends) and other coroutines in the same worker run
- [ ] When the I/O completes, the coroutine is resumed â€” this happens transparently
- [ ] Coroutine overhead: ~1Âµs per yield point â€” negligible compared to I/O wait time (1-100ms)
- [ ] For coroutine-unsafe code (global state, static variables): each coroutine within the same worker shares memory â€” must be re-entrant
- [ ] For debugging: check `Co::stats()` for coroutine counts and `swoole_async::` for I/O operation tracing
- [ ] Document the coroutine model and its implications for the application code

# Performance Checklist (from 04/06)
- [ ] 1M+ coroutines on 1GB RAM (vs ~10,000 PHP-FPM workers on same hardware)
- [ ] Context switch: ~0.5Âµs coroutine vs ~5Âµs thread vs ~50Âµs process
- [ ] io_uring (Swoole 6.2+): Reduces syscall overhead for async I/O via submission/completion queue pairs. 2-5x improvement for filesystem-heavy workloads.
- [ ] Coroutine overhead is ~1Âµs per yield point â€” negligible for high-latency I/O but significant for sub-ms operations.
- [ ] FrankenPHP
- [ ] RoadRunner
- [ ] Swoole
- [ ] PHP-FPM

# Security Checklist (from 04/06 - only if relevant)
- [ ] Swoole runs as a PHP extension with direct memory access. Ensure extension is compiled from trusted sources.
- [ ] Coroutine context isolation prevents request data leakage between coroutines within the same worker.
- [ ] task_worker operations inherit the worker process security context â€” sanitize all task inputs.
- [ ] WebSocket connections persist beyond request lifecycle â€” implement proper authentication and rate limiting.

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
- [ ] Swoole extension installed and loaded (`php -m | grep swoole`)
- [ ] coroutine hooks configured with SWOOLE_HOOK_ALL
- [ ] worker_num set to appropriate value based on CPU cores
- [ ] max_request configured (1000-5000)
- [ ] 24-hour soak test completed without memory growth
- [ ] All blocking I/O libraries verified for coroutine compatibility
- [ ] Rollback plan documented with FPM alternative path
- [ ] Swoole's coroutine architecture understood
- [ ] Auto-hooking mechanism understood
- [ ] Coroutine-safe coding practices identified
- [ ] Performance implications documented
- [ ] Architecture documented for team reference
- [ ] Event loop / coroutine architecture understood
- [ ] Auto-hooking for PDO, MySQLi, Redis, cURL understood
- [ ] Coroutine yield/resume mechanism understood
- [ ] Coroutine overhead quantified (~1Âµs per yield)
- [ ] Debugging tools (Co::stats, swoole_async) known
- [ ] Architecture documented for team

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Always benchmark with production traffic**: Swoole's performance varies dramatically by I/O profile. Run 24-hour soak tests to detect memory leaks in long-running workers.
- [ ] **Set SWOOLE_HOOK_ALL**: Enable all coroutine hooks to maximize non-blocking coverage. Verify library compatibility in staging.
- [ ] **Match worker_num to CPU cores**: Set `worker_num = swoole_cpu_num()` for CPU-bound workloads. Increase 1.5-2x for I/O-bound workloads.
- [ ] **Configure max_request for recycling**: Set 1000-5000 to prevent memory drift without excessive process spawn overhead.
- [ ] **Use task_worker_num for blocking operations**: Isolate database writes, file operations, and external API calls to task workers to avoid blocking the coroutine event loop.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Choosing Swoole for low-I/O workloads
- [ ] Avoid: Blocking I/O in coroutines
- [ ] Avoid: Skipping 24-hour soak tests
- [ ] Avoid: Over-provisioning workers
- [ ] Avoid anti-pattern: **Treating Swoole as a drop-in FPM replacement**: Requires architectural changes, library auditing, and deployment process modifications.
- [ ] Avoid anti-pattern: **Using Swoole with pure PHP event loops**: Mixing Swoole's coroutine system with ReactPHP/AMPHP event loops creates scheduling conflicts and undefined behavior.
- [ ] Avoid anti-pattern: **Ignoring deployment complexity**: Swoole's PHP extension requirement complicates container builds, CI/CD pipelines, and rollback procedures.
- [ ] Avoid anti-pattern: **Skipping rollback planning**: Swoole applications cannot be reverted to FPM without code changes. Always maintain a parallel FPM deployment path.
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
**Core Concepts:** **Event Loop**: epoll (Linux) / kqueue (macOS) / iocp (Windows) based. Monitors all file descriptors. When data is ready, the corresponding coroutine is resumed., **Coroutine**: Lightweight execution context (~2KB stack). Created per request. Yields on I/O (auto-hooked). Resumes when I/O completes. No OS thread involvement., **One-Click Coroutineization**: `Co\run()` or `swoole_async_set(['hook_flags' => SWOOLE_HOOK_ALL])` enables transparent hooking of PHP's synchronous functions., **Coroutine Scheduling Overhead**: ~1Âµs per yield/resume cycle. Under zero-I/O conditions, this overhead makes Swoole ~10% slower than FPM.
**Skills:** Swoole Installation and Configuration, Swoole io_uring Integration, Architecture Model Differences, Concurrency Model Selection
**Decision Trees:** Swoole adoption for coroutine support
**Anti-Patterns:** Porting PHP-FPM Code Without Adapting to Persistent Runtime, Choosing Runtime Without Workload Analysis, Not Configuring Worker Count to CPU Topology, Ignoring Goridge Serialization Overhead (RoadRunner), FrankenPHP Thread Safety Violations
**Related Topics:** Runtime Comparison Overview, Swoole Installation and Configuration, Swoole io_uring Integration, Laravel Octane Driver Selection

