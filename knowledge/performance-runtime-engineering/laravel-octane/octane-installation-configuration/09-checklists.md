# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Octane Installation and Configuration — composer require, Driver Setup, config/octane.php
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Optimize service providers after install**: Profile `register()` and `boot()` methods. Heavy work here runs once per worker start, not per request.
- [ ] **Start with 4 workers**: Default of `swoole_cpu_num()` may be too high. Begin with 4 workers, monitor RSS, scale up.
- [ ] **Set max_requests**: 1000-5000 depending on memory stability. Monitor worker RSS growth to determine optimal value.
- [ ] **Use --watch in development**: Enables hot reload for faster iteration. Remove in production.
- [ ] **Test with octane:test**: Run `php artisan octane:test` to verify Octane compatibility before deploying.
- [ ] Octane installed and configured for chosen driver
- [ ] Service providers audited and optimized after install
- [ ] Worker count and max_requests configured based on monitoring
- [ ] Health check endpoint configured (/octane/health)
- [ ] Reverse proxy configured in front of Octane
- [ ] Octane server starts and runs with no fatal errors
- [ ] `php artisan octane:status` reports correct worker count
- [ ] Application responds to requests through reverse proxy with no errors
- [ ] `/octane/health` endpoint returns 200
- [ ] `php artisan octane:test` passes with zero warnings
- [ ] `php artisan octane:reload` completes without dropping in-flight requests
- [ ] OpCache preloading verified and reducing cold-start latency
- [ ] CI pipeline includes and passes `octane:test` on every build
- [ ] `composer require laravel/octane` installed and all commands available
- [ ] `config/octane.php` created with correct driver, worker count, and max_requests

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **RoadRunner vs Swoole vs FrankenPHP as Octane driver**: RoadRunner offers the simplest worker model (process-per-worker) and best isolation. Swoole provides coroutine-based concurrency for I/O-bound workloads. FrankenPHP is easiest to deploy (single binary). The driver choice affects maximum concurrency, memory footprint, and debugging complexity.
- [ ] **Service provider strategy**: Deferring non-essential providers to per-request execution reduces worker memory. Boot essential providers once, defer expensive ones. Audit all providers for request-scoped singletons.
- [ ] **RoadRunner config** (.rr.yaml): `rpc`, `server.command`, `http.pool.num_workers`, `http.pool.max_jobs`, `http.pool.supervisor.max_workers`.
- [ ] **Swoole config**: Worker count via `swoole_cpu_num()`, task worker count at half CPU cores, max_request for recycling.
- [ ] **FrankenPHP config** (Caddyfile): `php_server { worker { num_threads max_threads } }`. Threads are not directly analogous to workers.
- [ ] **max_request across drivers**: 1000-5000 for stable apps, 300-500 for apps with known leak patterns.
- [ ] Document and follow through on architectural decision: Octane server driver selection
- [ ] Document and follow through on architectural decision: Configuration options
- [ ] Ensure architecture aligns with core concept: **Installation steps**: `composer require laravel/octane` â†’ `php artisan octane:install` (selects driver: RoadRunner, Swoole, or FrankenPHP) â†’ download driver binary (RoadRunner: `rr` binary downloaded, FrankenPHP: built-in).
- [ ] Ensure architecture aligns with core concept: **config/octane.php**: `max_requests` (worker recycling), `worker_num` (concurrent workers), `task_worker_num` (Swoole-only for background tasks), `server` (driver binary path), `watch` (file watcher for development).
- [ ] Ensure architecture aligns with core concept: **Server start options**: `--workers=N` sets worker count, `--max-requests=N` sets recycling threshold, `--task-workers=N` (Swoole), `--host` and `--port` for binding.
- [ ] Ensure architecture aligns with core concept: **Development mode**: `--watch` enables hot reload â€” file changes trigger automatic worker restart.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Optimize service providers after install**: Profile `register()` and `boot()` methods. Heavy work here runs once per worker start, not per request.
- [ ] **Start with 4 workers**: Default of `swoole_cpu_num()` may be too high. Begin with 4 workers, monitor RSS, scale up.
- [ ] **Set max_requests**: 1000-5000 depending on memory stability. Monitor worker RSS growth to determine optimal value.
- [ ] **Use --watch in development**: Enables hot reload for faster iteration. Remove in production.
- [ ] **Test with octane:test**: Run `php artisan octane:test` to verify Octane compatibility before deploying.

# Performance Checklist (from 04/06)
- [ ] RoadRunner workers: Default `worker_num` from `swoole_cpu_num()` or config. 4-8 workers typical for most servers.
- [ ] max_requests: 1000-5000 depending on memory stability. Monitor worker RSS growth to determine optimal value.
- [ ] Task workers (Swoole): Isolate blocking operations. Don't set higher than available CPU cores.
- [ ] Each worker maintains persistent database/Redis connections â€” account for connection pool limits.
- [ ] Octane vs FPM
- [ ] RoadRunner driver
- [ ] Swoole driver
- [ ] FrankenPHP driver

# Security Checklist (from 04/06 - only if relevant)
- [ ] Octane exposes an HTTP server â€” ensure it's behind a reverse proxy (Nginx, Caddy) in production
- [ ] Never expose Octane's port directly to the internet
- [ ] Configure health check endpoint (/octane/health) behind firewall

# Reliability Checklist (from 04/05/06)
- [ ] **Memory leak in long-running worker**: Service provider registers listeners on each request without cleanup. Symptom: Worker RSS grows by 1-5MB per request until OOM. Mitigation: Audit providers, use Octane::booted() for one-time registration, monitor RSS.
- [ ] **Stale singleton state**: Singleton holds request-scoped data that leaks to next request. Symptom: User A sees User B's data. Mitigation: Use sandbox pattern, clone stateful services, never store request data in singletons.
- [ ] **Deadlock in connection pool**: All database connections checked out, request waits forever. Symptom: Workers stuck, no requests complete. Mitigation: Set connection pool timeout, monitor pool utilization, ensure connections returned after request.
- [ ] **Health checks**: Configure Octane health endpoint (/octane/health). Monitor via load balancer. Alert if health check fails on any worker.
- [ ] **Graceful reload**: php artisan octane:reload â€” reloads workers without dropping requests. Run after every deploy.
- [ ] **State leak detection**: Monitor worker RSS growth. Increase >10% per hour indicates state leak. Set octane:watch during development to detect leaks.
- [ ] **Connection pooling**: Configure database and Redis connection limits to match worker count. Each worker maintains persistent connections.

# Testing Checklist (from 04/06)
- [ ] Octane installed and configured for chosen driver
- [ ] Service providers audited and optimized after install
- [ ] Worker count and max_requests configured based on monitoring
- [ ] Health check endpoint configured (/octane/health)
- [ ] Reverse proxy configured in front of Octane
- [ ] octane:test run in CI pipeline
- [ ] opcache.preload configured for cold-start reduction
- [ ] Octane server starts and runs with no fatal errors
- [ ] `php artisan octane:status` reports correct worker count
- [ ] Application responds to requests through reverse proxy with no errors
- [ ] `/octane/health` endpoint returns 200
- [ ] `php artisan octane:test` passes with zero warnings
- [ ] `php artisan octane:reload` completes without dropping in-flight requests
- [ ] OpCache preloading verified and reducing cold-start latency
- [ ] CI pipeline includes and passes `octane:test` on every build
- [ ] `composer require laravel/octane` installed and all commands available
- [ ] `config/octane.php` created with correct driver, worker count, and max_requests
- [ ] Worker count set to 4 initially (tuned after 48-hour monitoring)
- [ ] `max_requests` set to 1000 (never 0 in production)
- [ ] Octane bound to `127.0.0.1` behind reverse proxy (not exposed publicly)
- [ ] SSL termination configured at reverse proxy level
- [ ] `/octane/health` endpoint responding and monitored
- [ ] OpCache preloading configured and verified
- [ ] `php artisan octane:test` passing in CI pipeline
- [ ] Production start command documented in deployment runbook
- [ ] Supervisor/systemd service configured for auto-restart
- [ ] `--watch` flag NOT present in production configuration

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Optimize service providers after install**: Profile `register()` and `boot()` methods. Heavy work here runs once per worker start, not per request.
- [ ] **Start with 4 workers**: Default of `swoole_cpu_num()` may be too high. Begin with 4 workers, monitor RSS, scale up.
- [ ] **Set max_requests**: 1000-5000 depending on memory stability. Monitor worker RSS growth to determine optimal value.
- [ ] **Use --watch in development**: Enables hot reload for faster iteration. Remove in production.
- [ ] **Test with octane:test**: Run `php artisan octane:test` to verify Octane compatibility before deploying.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Not optimizing service providers after install
- [ ] Avoid: Setting workers = CPU cores for all workloads
- [ ] Avoid: Running Octane without health checks
- [ ] Avoid: Not testing with octane:test before deploy
- [ ] Avoid anti-pattern: **Running Octane without reverse proxy**: Octane's built-in server is not hardened for direct internet exposure.
- [ ] Avoid anti-pattern: **Disabling max_requests**: Setting max_requests = 0 in production allows unbounded memory drift.
- [ ] Avoid anti-pattern: **Starting with max workers immediately**: Begin with fewer workers and scale up after monitoring RSS.
- [ ] Avoid anti-pattern: **Ignoring opcache.preload**: Preloading reduces cold-start latency by 2-5ms per worker. Configure before production.
- [ ] Guard against anti-pattern: Application State Leaking Across Requests
- [ ] Guard against anti-pattern: Not Configuring max_requests for Worker Recycling
- [ ] Guard against anti-pattern: Database Connection Pool Exhaustion
- [ ] Guard against anti-pattern: Running Queue Workers Inside Octane
- [ ] Guard against anti-pattern: Not Using Octane Table for Cross-Worker State
- [ ] No static state

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Health checks**: Configure Octane health endpoint (/octane/health). Monitor via load balancer. Alert if health check fails on any worker.
- [ ] **Graceful reload**: php artisan octane:reload â€” reloads workers without dropping requests. Run after every deploy.
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
**Core Concepts:** **Installation steps**: `composer require laravel/octane` â†’ `php artisan octane:install` (selects driver: RoadRunner, Swoole, or FrankenPHP) â†’ download driver binary (RoadRunner: `rr` binary downloaded, FrankenPHP: built-in)., **config/octane.php**: `max_requests` (worker recycling), `worker_num` (concurrent workers), `task_worker_num` (Swoole-only for background tasks), `server` (driver binary path), `watch` (file watcher for development)., **Server start options**: `--workers=N` sets worker count, `--max-requests=N` sets recycling threshold, `--task-workers=N` (Swoole), `--host` and `--port` for binding., **Development mode**: `--watch` enables hot reload â€” file changes trigger automatic worker restart.
**Decision Trees:** Octane server driver selection, Configuration options
**Anti-Patterns:** Application State Leaking Across Requests, Not Configuring max_requests for Worker Recycling, Database Connection Pool Exhaustion, Running Queue Workers Inside Octane, Not Using Octane Table for Cross-Worker State
**Related Topics:** Service Provider Optimization, Worker Configuration by Driver, Octane Service Container Lifecycle, FPM to Octane Migration

