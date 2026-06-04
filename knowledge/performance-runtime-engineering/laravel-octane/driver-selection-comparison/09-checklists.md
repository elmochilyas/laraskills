# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Driver Selection Comparison â€” FrankenPHP, Swoole, RoadRunner
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Benchmark all three drivers with your application's actual workload in a staging environment before selecting one.
- [ ] Verify that the chosen driver is compatible with all third-party packages in use (especially for Swoole's coroutine model).
- [ ] Configure the reverse proxy (Nginx/Caddy) for SSL termination, static file serving, and rate limiting.
- [ ] Set up health check monitoring for the Octane health endpoint.
- [ ] Test graceful reload with `php artisan octane:reload` for the chosen driver.
- [ ] Driver selected with documented rationale based on application workload, team expertise, and operational requirements
- [ ] All three drivers benchmarked with the application's actual workload (not synthetic tests)
- [ ] 24-hour soak test completed with no memory leaks or state corruption
- [ ] Package compatibility verified for the chosen driver
- [ ] Driver-specific configuration created, tested, and deployed
- [ ] Graceful reload verified for the chosen driver
- [ ] Selection decision recorded in architecture decision record for future reference
- [ ] Workload characterized as CPU-bound, I/O-bound, or mixed with latency data
- [ ] All three drivers benchmarked in staging with application's actual workload
- [ ] 24-hour soak test completed with top candidate drivers
- [ ] Swoole package compatibility verified (if Swoole is a candidate)
- [ ] FrankenPHP ZTS extension compatibility verified (if FrankenPHP is a candidate)
- [ ] Driver selection documented with benchmark data and rationale
- [ ] Driver-specific configuration created and tested
- [ ] Graceful reload (`octane:reload`) verified for chosen driver

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **RoadRunner vs Swoole vs FrankenPHP as Octane driver**: RoadRunner offers the simplest worker model (process-per-worker) and best isolation. Swoole provides coroutine-based concurrency for I/O-bound workloads. FrankenPHP is easiest to deploy (single binary). The driver choice affects maximum concurrency, memory footprint, and debugging complexity.
- [ ] **Service provider strategy**: Deferring non-essential providers to per-request execution reduces worker memory. Boot essential providers once, defer expensive ones. Audit all providers for request-scoped singletons.
- [ ] **RoadRunner architecture**: Process-per-worker model with simple isolation. One PHP process per worker â€” a crash affects only that worker. Best for applications with complex state that benefit from strong process isolation.
- [ ] **Swoole architecture**: Event-loop with coroutines. Multiple coroutines run within a single PHP process, sharing memory but requiring non-blocking code. Best for I/O-heavy workloads where coroutine concurrency reduces total worker count.
- [ ] **FrankenPHP architecture**: Single binary containing PHP embedded with Caddy. Process-per-worker model similar to RoadRunner but with automatic HTTPS, HTTP/3, and zero-config setup.
- [ ] **Nginx reverse proxy**: All three drivers benefit from an Nginx reverse proxy for SSL termination, static file serving, rate limiting, and load balancing across Octane servers.
- [ ] Document and follow through on architectural decision: Octane driver selection

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Follow single responsibility principle
- [ ] Use constructor property promotion where applicable

# Performance Checklist (from 04/06)
- [ ] **RoadRunner (low I/O)**: 2.1Ã— vs FPM. Best for CPU-bound or low-latency database workloads.
- [ ] **Swoole (high I/O)**: 3.2Ã— vs FPM. Best when backend services add 50ms+ latency per request.
- [ ] **FrankenPHP (high I/O)**: 2.5Ã— vs FPM. Strong performance with simpler operational model.
- [ ] Each worker uses 30â€“80MB RSS; total memory = workers Ã— per-worker memory.
- [ ] Each worker maintains persistent DB/Redis connections; total = workers Ã— connections-per-worker.
- [ ] Swoole coroutines can reduce total worker count because a single worker handles multiple concurrent requests.
- [ ] Octane throughput drops 40â€“60% when memory pressure triggers swap â€” ensure adequate RAM.
- [ ] Octane vs FPM
- [ ] RoadRunner driver
- [ ] Swoole driver
- [ ] FrankenPHP driver

# Security Checklist (from 04/06 - only if relevant)
- [ ] **RoadRunner**: Process-per-worker isolation ensures a memory corruption or crash affects only one worker. No cross-request state leakage due to process boundaries.
- [ ] **Swoole**: Coroutines share the same process â€” a memory corruption can affect all coroutines in that worker. Coroutine-unsafe code can leak state between requests. Requires careful audit.
- [ ] **FrankenPHP**: Same process-per-worker model as RoadRunner. Single binary reduces attack surface (no separate web server process).
- [ ] All drivers: Configure health endpoints, rate limiting, and request timeouts at the reverse proxy level.

# Reliability Checklist (from 04/05/06)
- [ ] **Memory leak in long-running worker**: Service provider registers listeners on each request without cleanup. Symptom: Worker RSS grows by 1-5MB per request until OOM. Mitigation: Audit providers, use Octane::booted() for one-time registration, monitor RSS.
- [ ] **Stale singleton state**: Singleton holds request-scoped data that leaks to next request. Symptom: User A sees User B's data. Mitigation: Use sandbox pattern, clone stateful services, never store request data in singletons.
- [ ] **Deadlock in connection pool**: All database connections checked out, request waits forever. Symptom: Workers stuck, no requests complete. Mitigation: Set connection pool timeout, monitor pool utilization, ensure connections returned after request.
- [ ] **Health checks**: Configure Octane health endpoint (/octane/health). Monitor via load balancer. Alert if health check fails on any worker.
- [ ] **Graceful reload**: php artisan octane:reload Ã¢â‚¬â€ reloads workers without dropping requests. Run after every deploy.
- [ ] **State leak detection**: Monitor worker RSS growth. Increase >10% per hour indicates state leak. Set octane:watch during development to detect leaks.
- [ ] **Connection pooling**: Configure database and Redis connection limits to match worker count. Each worker maintains persistent connections.

# Testing Checklist (from 04/06)
- [ ] Benchmark all three drivers with your application's actual workload in a staging environment before selecting one.
- [ ] Verify that the chosen driver is compatible with all third-party packages in use (especially for Swoole's coroutine model).
- [ ] Configure the reverse proxy (Nginx/Caddy) for SSL termination, static file serving, and rate limiting.
- [ ] Set up health check monitoring for the Octane health endpoint.
- [ ] Test graceful reload with `php artisan octane:reload` for the chosen driver.
- [ ] Verify worker count and connection budget calculations match database and Redis limits.
- [ ] Run a 24-hour soak test to detect any memory leaks or state corruption specific to the chosen driver.
- [ ] Document the driver choice and rationale in the project's architecture decision record.
- [ ] Driver selected with documented rationale based on application workload, team expertise, and operational requirements
- [ ] All three drivers benchmarked with the application's actual workload (not synthetic tests)
- [ ] 24-hour soak test completed with no memory leaks or state corruption
- [ ] Package compatibility verified for the chosen driver
- [ ] Driver-specific configuration created, tested, and deployed
- [ ] Graceful reload verified for the chosen driver
- [ ] Selection decision recorded in architecture decision record for future reference
- [ ] Workload characterized as CPU-bound, I/O-bound, or mixed with latency data
- [ ] All three drivers benchmarked in staging with application's actual workload
- [ ] 24-hour soak test completed with top candidate drivers
- [ ] Swoole package compatibility verified (if Swoole is a candidate)
- [ ] FrankenPHP ZTS extension compatibility verified (if FrankenPHP is a candidate)
- [ ] Driver selection documented with benchmark data and rationale
- [ ] Driver-specific configuration created and tested
- [ ] Graceful reload (`octane:reload`) verified for chosen driver
- [ ] Reverse proxy configured for chosen driver (all drivers benefit from one)
- [ ] Deployment pipeline updated with driver-specific start command

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Assuming Octane is a drop-in replacement
- [ ] Avoid: Not auditing service providers
- [ ] Avoid: Forgetting connection pool limits
- [ ] Avoid: Running Octane without memory monitoring
- [ ] Avoid: Choosing Swoole without benchmarking
- [ ] Avoid anti-pattern: **Jumping to Swoole without due diligence**: Swoole requires coroutine-safe code, which many PHP packages are not. The debugging complexity often outweighs the performance benefit for typical CRUD applications.
- [ ] Avoid anti-pattern: **Running Octane without a reverse proxy**: Even with FrankenPHP (which includes Caddy), placing Octane directly on the internet without a proper reverse proxy exposes workers to slow HTTP attacks, connection floods, and SSL termination overhead.
- [ ] Avoid anti-pattern: **Mixing Octane drivers**: Running some workers under RoadRunner and others under Swoole adds operational complexity without benefit. Choose one driver per environment.
- [ ] Avoid anti-pattern: **Defaulting to FrankenPHP for multi-server deployments**: FrankenPHP's single-binary advantage diminishes in multi-server setups where configuration management and orchestration tools standardize the deployment process anyway.
- [ ] Guard against anti-pattern: Application State Leaking Across Requests
- [ ] Guard against anti-pattern: Not Configuring max_requests for Worker Recycling
- [ ] Guard against anti-pattern: Database Connection Pool Exhaustion
- [ ] Guard against anti-pattern: Running Queue Workers Inside Octane
- [ ] Guard against anti-pattern: Not Using Octane Table for Cross-Worker State

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
**Decision Trees:** Octane driver selection
**Anti-Patterns:** Application State Leaking Across Requests, Not Configuring max_requests for Worker Recycling, Database Connection Pool Exhaustion, Running Queue Workers Inside Octane, Not Using Octane Table for Cross-Worker State
**Related Topics:** Octane Architecture and Execution Model, Performance Gain Estimation, Runtime Selection Decision Tree, Worker Configuration by Driver, FPM-to-Octane Migration

