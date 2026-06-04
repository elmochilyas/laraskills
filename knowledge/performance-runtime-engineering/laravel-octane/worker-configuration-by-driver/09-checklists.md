# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Worker Configuration by Driver â€” worker_num, max_request, task_worker_num
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Worker count formula**: Start at `number_of_CPU_cores`. For I/O-bound workloads (high DB time), increase by 50-100%. For CPU-bound workloads (computation), stay at core count. Monitor listen queue and RSS to validate.
- [ ] **Set max_requests**: 1000-5000 for stable apps. Lower to 300-500 if memory drift is observed. Monitor worker RSS over time to calibrate.
- [ ] **Monitor listen queue**: If requests are queuing, increase worker count. If RSS is too high, decrease worker count.
- [ ] **Account for connection pool limits**: Each worker maintains persistent DB/Redis connections. N workers Ã— M connections â‰¤ database max_connections.
- [ ] Worker count configured based on CPU cores and workload profile
- [ ] max_requests set to appropriate value (1000-5000 default)
- [ ] Monitor listen queue and RSS to validate worker count
- [ ] Connection pool limits calculated (N workers Ã— connections)
- [ ] FrankenPHP thread configuration understood (not directly = workers)
- [ ] Worker count correctly calculated based on workload profile, memory budget, and connection limits
- [ ] max_requests calibrated based on observed RSS growth with data-driven rationale
- [ ] Driver-specific settings (task workers, supervisor, threads) correctly configured
- [ ] Listen queue consistently 0 under peak expected traffic
- [ ] Database connections within 80% of max_connections
- [ ] Total worker RSS within 70% of server RAM
- [ ] Graceful reload works correctly with expected worker count
- [ ] Configuration documented in runbook with tuning rationale
- [ ] Workload profile classified as CPU-bound or I/O-bound
- [ ] Worker count calculated based on CPU cores, workload factor, memory, and connections
- [ ] Worker count conservative starting value set (4 or calculated, whichever is lower)

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **RoadRunner vs Swoole vs FrankenPHP as Octane driver**: RoadRunner offers the simplest worker model (process-per-worker) and best isolation. Swoole provides coroutine-based concurrency for I/O-bound workloads. FrankenPHP is easiest to deploy (single binary). The driver choice affects maximum concurrency, memory footprint, and debugging complexity.
- [ ] **Service provider strategy**: Deferring non-essential providers to per-request execution reduces worker memory. Boot essential providers once, defer expensive ones. Audit all providers for request-scoped singletons.
- [ ] **RoadRunner workers**: Process-per-worker model. Each worker is a separate PHP process. Best isolation but higher per-worker memory (~50-80MB RSS). num_workers should not exceed available RAM / per-worker RSS.
- [ ] **Swoole workers**: In-process worker model. Lower memory per worker. Supports task workers for background processing. worker_num typically = CPU cores.
- [ ] **FrankenPHP threads**: Thread-based model (requires ZTS). Threads share memory within a process. num_threads controls concurrent request handling. max_threads sets upper bound for auto-scaling.
- [ ] **max_request across drivers**: Prevents memory drift by recycling workers after N requests. Essential for all drivers.
- [ ] Document and follow through on architectural decision: Worker count by driver
- [ ] Ensure architecture aligns with core concept: **RoadRunner config** (.rr.yaml): `rpc: { listen: tcp://127.0.0.1:6001 }`, `server: { command: "php artisan octane:start --server=roadrunner" }`, `http: { address: "0.0.0.0:8080", pool: { num_workers: 4, max_jobs: 1000, supervisor: { max_workers: 8 } } }`.
- [ ] Ensure architecture aligns with core concept: **Swoole config** (via PHP): `$server->set(['worker_num' => swoole_cpu_num(), 'max_request' => 1000, 'task_worker_num' => swoole_cpu_num() / 2])`. Octane abstracts this via `config/octane.php`.
- [ ] Ensure architecture aligns with core concept: **FrankenPHP config** (Caddyfile): `php_server { worker { num_threads 4 max_threads 8 } }`. Threads are not directly analogous to workers.
- [ ] Ensure architecture aligns with core concept: **max_request across drivers**: 1000-5000 for stable apps, 300-500 for apps with known leak patterns. Monitor worker RSS to calibrate.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Worker count formula**: Start at `number_of_CPU_cores`. For I/O-bound workloads (high DB time), increase by 50-100%. For CPU-bound workloads (computation), stay at core count. Monitor listen queue and RSS to validate.
- [ ] **Set max_requests**: 1000-5000 for stable apps. Lower to 300-500 if memory drift is observed. Monitor worker RSS over time to calibrate.
- [ ] **Monitor listen queue**: If requests are queuing, increase worker count. If RSS is too high, decrease worker count.
- [ ] **Account for connection pool limits**: Each worker maintains persistent DB/Redis connections. N workers Ã— M connections â‰¤ database max_connections.

# Performance Checklist (from 04/06)
- [ ] Octane delivers 2.5-20x throughput over PHP-FPM; API endpoints with <50ms response see biggest gains
- [ ] Each worker uses 30-80MB RSS; total memory = workers Ã— per-worker memory
- [ ] Each worker maintains persistent DB/Redis connections; total = workers Ã— connections-per-worker
- [ ] Under Octane, database queries become primary bottleneck (bootstrap is eliminated)
- [ ] OpCache preloading further reduces cold-start latency by 2-5ms per worker
- [ ] Octane vs FPM
- [ ] RoadRunner driver
- [ ] Swoole driver
- [ ] FrankenPHP driver

# Security Checklist (from 04/06 - only if relevant)
- [ ] More workers = more concurrent database connections. Plan for connection pool exhaustion.
- [ ] FrankenPHP threads share memory â€” a memory leak in one thread affects all threads in the process.

# Reliability Checklist (from 04/05/06)
- [ ] **Memory leak in long-running worker**: Service provider registers listeners on each request without cleanup. Symptom: Worker RSS grows by 1-5MB per request until OOM. Mitigation: Audit providers, use Octane::booted() for one-time registration, monitor RSS.
- [ ] **Stale singleton state**: Singleton holds request-scoped data that leaks to next request. Symptom: User A sees User B's data. Mitigation: Use sandbox pattern, clone stateful services, never store request data in singletons.
- [ ] **Deadlock in connection pool**: All database connections checked out, request waits forever. Symptom: Workers stuck, no requests complete. Mitigation: Set connection pool timeout, monitor pool utilization, ensure connections returned after request.
- [ ] **Health checks**: Configure Octane health endpoint (/octane/health). Monitor via load balancer. Alert if health check fails on any worker.
- [ ] **Graceful reload**: php artisan octane:reload Ã¢â‚¬â€ reloads workers without dropping requests. Run after every deploy.
- [ ] **State leak detection**: Monitor worker RSS growth. Increase >10% per hour indicates state leak. Set octane:watch during development to detect leaks.
- [ ] **Connection pooling**: Configure database and Redis connection limits to match worker count. Each worker maintains persistent connections.

# Testing Checklist (from 04/06)
- [ ] Worker count configured based on CPU cores and workload profile
- [ ] max_requests set to appropriate value (1000-5000 default)
- [ ] Monitor listen queue and RSS to validate worker count
- [ ] Connection pool limits calculated (N workers Ã— connections)
- [ ] FrankenPHP thread configuration understood (not directly = workers)
- [ ] Swoole task workers configured if needed (background processing)
- [ ] RoadRunner supervisor config reviewed for max_workers limit
- [ ] Worker count correctly calculated based on workload profile, memory budget, and connection limits
- [ ] max_requests calibrated based on observed RSS growth with data-driven rationale
- [ ] Driver-specific settings (task workers, supervisor, threads) correctly configured
- [ ] Listen queue consistently 0 under peak expected traffic
- [ ] Database connections within 80% of max_connections
- [ ] Total worker RSS within 70% of server RAM
- [ ] Graceful reload works correctly with expected worker count
- [ ] Configuration documented in runbook with tuning rationale
- [ ] Workload profile classified as CPU-bound or I/O-bound
- [ ] Worker count calculated based on CPU cores, workload factor, memory, and connections
- [ ] Worker count conservative starting value set (4 or calculated, whichever is lower)
- [ ] max_requests set (1000 default, tuned based on RSS monitoring)
- [ ] Never set max_requests to 0
- [ ] Driver-specific settings configured (RoadRunner supervisor, Swoole task workers, FrankenPHP threads)
- [ ] Listen queue monitored and worker count adjusted accordingly
- [ ] Total persistent connections within database max_connections Ã— 0.8
- [ ] Total worker RSS within server RAM Ã— 0.7
- [ ] `php artisan octane:status` reports expected worker count
- [ ] Graceful reload (`octane:reload`) works correctly
- [ ] Worker configuration documented in runbook

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Worker count formula**: Start at `number_of_CPU_cores`. For I/O-bound workloads (high DB time), increase by 50-100%. For CPU-bound workloads (computation), stay at core count. Monitor listen queue and RSS to validate.
- [ ] **Set max_requests**: 1000-5000 for stable apps. Lower to 300-500 if memory drift is observed. Monitor worker RSS over time to calibrate.
- [ ] **Monitor listen queue**: If requests are queuing, increase worker count. If RSS is too high, decrease worker count.
- [ ] **Account for connection pool limits**: Each worker maintains persistent DB/Redis connections. N workers Ã— M connections â‰¤ database max_connections.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Setting workers = cores for I/O-bound Octane
- [ ] Avoid: Disabling max_requests (max_requests = 0)
- [ ] Avoid: Running FrankenPHP with 1 thread
- [ ] Avoid: Not accounting for DB connections
- [ ] Avoid anti-pattern: **Over-provisioning workers beyond memory capacity**: Each worker consumes 30-80MB RSS. Total RSS must fit in available RAM with headroom.
- [ ] Avoid anti-pattern: **Setting max_requests too low**: max_requests = 100 recycles workers too frequently, wasting CPU on constant worker restarts. Monitor RSS and set accordingly.
- [ ] Avoid anti-pattern: **Ignoring FrankenPHP thread nuances**: Threads are not workers. A FrankenPHP thread handles one request at a time, but threads share memory. Thread count â‰¤ CPU cores.
- [ ] Guard against anti-pattern: Application State Leaking Across Requests
- [ ] Guard against anti-pattern: Not Configuring max_requests for Worker Recycling
- [ ] Guard against anti-pattern: Database Connection Pool Exhaustion
- [ ] Guard against anti-pattern: Running Queue Workers Inside Octane
- [ ] Guard against anti-pattern: Not Using Octane Table for Cross-Worker State
- [ ] No static state
- [ ] Container resets per request

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Health checks**: Configure Octane health endpoint (/octane/health). Monitor via load balancer. Alert if health check fails on any worker.
- [ ] **Graceful reload**: php artisan octane:reload Ã¢â‚¬â€ reloads workers without dropping requests. Run after every deploy.
- [ ] **State leak detection**: Monitor worker RSS growth. Increase >10% per hour indicates state leak. Set octane:watch during development to detect leaks.
- [ ] **Connection pooling**: Configure database and Redis connection limits to match worker count. Each worker maintains persistent connections.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **RoadRunner config** (.rr.yaml): `rpc: { listen: tcp://127.0.0.1:6001 }`, `server: { command: "php artisan octane:start --server=roadrunner" }`, `http: { address: "0.0.0.0:8080", pool: { num_workers: 4, max_jobs: 1000, supervisor: { max_workers: 8 } } }`., **Swoole config** (via PHP): `$server->set(['worker_num' => swoole_cpu_num(), 'max_request' => 1000, 'task_worker_num' => swoole_cpu_num() / 2])`. Octane abstracts this via `config/octane.php`., **FrankenPHP config** (Caddyfile): `php_server { worker { num_threads 4 max_threads 8 } }`. Threads are not directly analogous to workers., **max_request across drivers**: 1000-5000 for stable apps, 300-500 for apps with known leak patterns. Monitor worker RSS to calibrate.
**Decision Trees:** Worker count by driver
**Anti-Patterns:** Application State Leaking Across Requests, Not Configuring max_requests for Worker Recycling, Database Connection Pool Exhaustion, Running Queue Workers Inside Octane, Not Using Octane Table for Cross-Worker State
**Related Topics:** Driver Selection Comparison, Octane Installation and Configuration, FPM Worker vs Octane Worker Differences, Memory Management in Long-Running Processes

