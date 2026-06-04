# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** Swoole Installation and Configuration — ext-swoole, worker_num, max_request, task_worker_num
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Install from PECL or official source**: Avoid distribution packages that may lag behind critical bug fixes and performance improvements.
- [ ] **Set worker_num based on workload**: `worker_num = swoole_cpu_num()` for CPU-bound workloads; 1.5-2x for I/O-bound. Avoid exceeding CPU cores Ã— 2.
- [ ] **Configure max_request = 1000-5000**: Lower values (1000) for memory-intensive applications; higher (5000) for stable, lightweight applications.
- [ ] **Use task_worker_num = 2-4 for blocking operations**: Isolate database writes and external API calls to prevent coroutine event loop blocking.
- [ ] **Enable SWOOLE_HOOK_ALL**: Maximize non-blocking coverage. Test all third-party libraries for compatibility.
- [ ] Swoole extension loaded (`php -m | grep swoole`)
- [ ] worker_num matches CPU-bound or I/O-bound workload profile
- [ ] max_request configured (1000-5000)
- [ ] task_worker_num configured if using blocking operations
- [ ] SWOOLE_HOOK_ALL enabled
- [ ] Swoole extension installed and configured
- [ ] Coroutine hooks enabled
- [ ] Server starts and serves requests
- [ ] Octane: running with --server=swoole
- [ ] Configuration documented for team
- [ ] Swoole extension installed and enabled
- [ ] php -m shows swoole module loaded
- [ ] Swoole configuration applied (workers, max_requests)
- [ ] Coroutine hooks configured
- [ ] Octane: configured with --server=swoole

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Process vs Thread vs Coroutine**: PHP-FPM uses processes (max isolation, highest memory). FrankenPHP uses threads (shared memory, lower isolation). Swoole uses coroutines (shared memory + cooperative multitasking, lowest memory per request). The choice depends on isolation requirements and acceptable complexity.
- [ ] **Embedded SAPI vs sidecar process**: FrankenPHP embeds PHP directly into Caddy (single binary deployment). RoadRunner runs PHP as a sidecar process (separate lifecycle management). Swoole runs PHP as a C-extension within the SAPI. Each model affects deployment, monitoring, and debugging workflows.
- [ ] **Configuration via Code**: Swoole is configured in the PHP server script, not php.ini. Settings like `worker_num`, `max_request`, and `hook_flags` are passed to `$server->set()`.
- [ ] **OpenSwoole Differences**: The community fork uses different class namespaces (`OpenSwoole\Http\Server` instead of `Swoole\Http\Server`). API compatibility is not guaranteed.
- [ ] **io_uring Enablement**: Swoole 6.2+ auto-detects io_uring support on Linux 5.19+. No manual configuration needed, but verify kernel version in deployment scripts.
- [ ] **PHP Version Compatibility**: Check Swoole release notes for PHP version support. Swoole 6.x supports PHP 8.1-8.4.
- [ ] Document and follow through on architectural decision: Swoole installation approach
- [ ] Ensure architecture aligns with core concept: **Installation**: `pecl install swoole` or compile from source with `--enable-swoole`. OpenSwoole is a community fork maintained separately with different version numbering.
- [ ] Ensure architecture aligns with core concept: **worker_num**: Number of worker processes. Set to CPU cores for most workloads. `swoole_cpu_num()` returns the optimal value.
- [ ] Ensure architecture aligns with core concept: **max_request**: Workers recycled after handling this many requests. Prevents memory drift. Set 1000-5000 depending on application memory behavior.
- [ ] Ensure architecture aligns with core concept: **task_worker_num**: Separate worker pool for synchronous tasks (database writes, file operations). Isolates blocking I/O from coroutine event loop.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Install from PECL or official source**: Avoid distribution packages that may lag behind critical bug fixes and performance improvements.
- [ ] **Set worker_num based on workload**: `worker_num = swoole_cpu_num()` for CPU-bound workloads; 1.5-2x for I/O-bound. Avoid exceeding CPU cores Ã— 2.
- [ ] **Configure max_request = 1000-5000**: Lower values (1000) for memory-intensive applications; higher (5000) for stable, lightweight applications.
- [ ] **Use task_worker_num = 2-4 for blocking operations**: Isolate database writes and external API calls to prevent coroutine event loop blocking.
- [ ] **Enable SWOOLE_HOOK_ALL**: Maximize non-blocking coverage. Test all third-party libraries for compatibility.
- [ ] Install Swoole extension: `pecl install swoole` or compile from source
- [ ] Enable the extension: `extension=swoole` in php.ini
- [ ] Verify installation: `php -m | grep swoole` and `php -i | grep "swoole"`
- [ ] Configure `server.php` or Swoole-specific settings (max_workers, reactor_num, worker_num, max_request)
- [ ] For Laravel Octane: `php artisan octane:install --server=swoole`
- [ ] Configure `config/octane.php` with Swoole-specific settings: `server` => `swoole`, `workers`, `max_requests`
- [ ] Set Swoole-specific php.ini directives: `swoole.use_shortname=Off` (recommended for framework compatibility)
- [ ] Enable coroutine hooks: `swoole.enable_coroutine=On`, `swoole.enable_preemptive_scheduler=On`
- [ ] Start the server: `php artisan octane:start --server=swoole` or run the Swoole HTTP server script
- [ ] Verify: access the application and check Swoole status

# Performance Checklist (from 04/06)
- [ ] Each worker process runs an independent event loop with thousands of coroutines.
- [ ] `worker_num` = CPU cores is optimal for CPU-bound; more for I/O-bound scenarios.
- [ ] Swoole 6.2 io_uring support provides 2-5x improvement for file-heavy operations.
- [ ] `max_request` recycling trades ~100ms spawn cost per worker cycle against memory leak prevention.
- [ ] FrankenPHP
- [ ] RoadRunner
- [ ] Swoole
- [ ] PHP-FPM

# Security Checklist (from 04/06 - only if relevant)
- [ ] Compile Swoole from trusted sources to avoid extension-level backdoors.
- [ ] OpenSwoole fork has separate security advisory channels â€” monitor both projects for CVE announcements.
- [ ] Task workers should not share database credentials with coroutine workers without proper isolation.
- [ ] Swoole's `$server->stats()` endpoint should be restricted to internal networks in production.

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
- [ ] Swoole extension loaded (`php -m | grep swoole`)
- [ ] worker_num matches CPU-bound or I/O-bound workload profile
- [ ] max_request configured (1000-5000)
- [ ] task_worker_num configured if using blocking operations
- [ ] SWOOLE_HOOK_ALL enabled
- [ ] 24-hour soak test completed without memory growth
- [ ] Deployment script includes kernel version check for io_uring support
- [ ] Swoole extension installed and configured
- [ ] Coroutine hooks enabled
- [ ] Server starts and serves requests
- [ ] Octane: running with --server=swoole
- [ ] Configuration documented for team
- [ ] Swoole extension installed and enabled
- [ ] php -m shows swoole module loaded
- [ ] Swoole configuration applied (workers, max_requests)
- [ ] Coroutine hooks configured
- [ ] Octane: configured with --server=swoole
- [ ] Server starts without errors
- [ ] Application accessible via Swoole
- [ ] Configuration documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Install from PECL or official source**: Avoid distribution packages that may lag behind critical bug fixes and performance improvements.
- [ ] **Set worker_num based on workload**: `worker_num = swoole_cpu_num()` for CPU-bound workloads; 1.5-2x for I/O-bound. Avoid exceeding CPU cores Ã— 2.
- [ ] **Configure max_request = 1000-5000**: Lower values (1000) for memory-intensive applications; higher (5000) for stable, lightweight applications.
- [ ] **Use task_worker_num = 2-4 for blocking operations**: Isolate database writes and external API calls to prevent coroutine event loop blocking.
- [ ] **Enable SWOOLE_HOOK_ALL**: Maximize non-blocking coverage. Test all third-party libraries for compatibility.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: worker_num too high (> CPU cores Ã— 2)
- [ ] Avoid: Omitting max_request
- [ ] Avoid: Installing via OS package manager
- [ ] Avoid: Mixed Swoole/OpenSwoole in same deployment
- [ ] Avoid anti-pattern: **Installing Swoole on PHP-FPM servers**: Swoole replaces FPM's process model, not supplements it. Use Swoole workers instead of FPM.
- [ ] Avoid anti-pattern: **Using Swoole without OpCache**: Even with persistent workers, OpCache reduces per-request compilation overhead.
- [ ] Avoid anti-pattern: **Configuring via php.ini directives**: Swoole server settings are set via PHP code. php.ini only affects Swoole extension loading (`extension=swoole`).
- [ ] Avoid anti-pattern: **Running Swoole in development without hot-reload**: Use Swoole's `--watch` or Laravel Octane watcher to avoid restarting the server for every code change.
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
**Core Concepts:** **Installation**: `pecl install swoole` or compile from source with `--enable-swoole`. OpenSwoole is a community fork maintained separately with different version numbering., **worker_num**: Number of worker processes. Set to CPU cores for most workloads. `swoole_cpu_num()` returns the optimal value., **max_request**: Workers recycled after handling this many requests. Prevents memory drift. Set 1000-5000 depending on application memory behavior., **task_worker_num**: Separate worker pool for synchronous tasks (database writes, file operations). Isolates blocking I/O from coroutine event loop.
**Skills:** Swoole Architecture and Coroutine Model, Swoole io_uring Integration, Octane Installation and Configuration, Worker Configuration by Driver
**Decision Trees:** Swoole installation approach
**Anti-Patterns:** Porting PHP-FPM Code Without Adapting to Persistent Runtime, Choosing Runtime Without Workload Analysis, Not Configuring Worker Count to CPU Topology, Ignoring Goridge Serialization Overhead (RoadRunner), FrankenPHP Thread Safety Violations
**Related Topics:** Swoole Architecture and Coroutine Model, Swoole io_uring Integration, Laravel Octane Driver Selection, PHP-FPM Worker Management

