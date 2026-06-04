# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Octane Architecture and Execution Model — Persistent Application, Boot-Once Handle-Many
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Run `php artisan octane:status` to verify workers are running and accepting requests.
- [ ] Test that `php artisan octane:reload` gracefully restarts workers without dropping in-flight requests.
- [ ] Run concurrent request tests (`ab -n 100 -c 10`) and verify no cross-request data contamination.
- [ ] Audit all service providers: ensure no request-scoped data is bound as singletons.
- [ ] Audit static properties: run `grep -rn "static \$" app/ --include="*.php"` and refactor as needed.
- [ ] Application runs under Octane for 24+ hours with zero state leak incidents
- [ ] `php artisan octane:test` passes with no warnings
- [ ] Worker RSS remains stable (<10% growth over 24 hours)
- [ ] No static properties used for request-scoped state in the entire application
- [ ] All service providers use `scoped()` or `singleton()` correctly based on state nature
- [ ] Team can explain the boot-once handle-many model and the audit requirements
- [ ] All service providers audited and no request-scoped singletons remain
- [ ] All mutable static properties eliminated or properly isolated
- [ ] `max_requests` configured between 500â€“1000 (initial value)
- [ ] No direct superglobal access (`$_GET`, `$_POST`, `$_SESSION`)
- [ ] `php artisan octane:test` passes with zero warnings
- [ ] Concurrent request test shows no cross-request data contamination
- [ ] Graceful reload (`octane:reload`) completes without dropping requests
- [ ] Per-worker RSS stable (<10% growth per hour) over 24-hour soak test
- [ ] Health check endpoint configured and responding

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **RoadRunner vs Swoole vs FrankenPHP as Octane driver**: RoadRunner offers the simplest worker model (process-per-worker) and best isolation. Swoole provides coroutine-based concurrency for I/O-bound workloads. FrankenPHP is easiest to deploy (single binary). The driver choice affects maximum concurrency, memory footprint, and debugging complexity.
- [ ] **Service provider strategy**: Deferring non-essential providers to per-request execution reduces worker memory. Boot essential providers once, defer expensive ones. Audit all providers for request-scoped singletons.
- [ ] **Boot once, handle many**: The worker boot sequence runs once: Application constructed â†’ providers registered â†’ providers booted â†’ routes/facades registered â†’ event loop begins. Each request then clones the booted application.
- [ ] **Sandbox isolation**: Octane intercepts `$app->terminate()` and replaces it with sandbox reset logic. Per-request services (DB connections, session, auth) are fresh each request while shared services (config, events, logging) persist.
- [ ] **State leak detection**: Octane tracks static property modifications via a callback registered in `zend_execute_data`. When `octane:watch` is enabled, it detects leaks at runtime.
- [ ] **Driver abstraction layer**: Octane provides a unified API regardless of the underlying runtime (RoadRunner, Swoole, FrankenPHP). Octane-specific code goes behind `Octane::driver()` checks.
- [ ] **Graceful reload**: `php artisan octane:reload` restarts workers one at a time without dropping in-flight requests. New workers boot with the latest code while old workers finish existing requests.
- [ ] Document and follow through on architectural decision: Understanding Octane's execution model
- [ ] Ensure architecture aligns with core concept: **Boot sequence**: `artisan octane:start` â†’ worker starts â†’ bootstrap (kernel boot, providers register, routes load) â†’ loop: wait for request â†’ dispatch â†’ response â†’ cleanup.
- [ ] Ensure architecture aligns with core concept: **Per-request dispatch**: Octane creates a fresh Laravel application instance per request using `Illuminate\Foundation\Application` cloned from the booted template. Service providers that boot once per worker retain state; per-request providers run fresh.
- [ ] Ensure architecture aligns with core concept: **Sandbox pattern**: Octane uses a sandbox container. Application-level services are cloned per request; framework-level services (config, events, logging) are shared.
- [ ] Ensure architecture aligns with core concept: **Driver abstraction**: `Octane\Octane::driver()` returns the active runtime driver. All runtime-specific code is behind this interface.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Follow single responsibility principle
- [ ] Use constructor property promotion where applicable

# Performance Checklist (from 04/06)
- [ ] Benchmark ranges: 2.5â€“3.1Ã— (mixed workloads) to 15â€“20Ã— (API workloads) over PHP-FPM.
- [ ] The largest gain comes from API endpoints with <50ms response times.
- [ ] For endpoints with >500ms I/O wait, the relative gain is 20â€“40% (bootstrap was proportionally smaller).
- [ ] Per-request Application cloning overhead: 0.5â€“2ms â€” negligible compared to the 10â€“40ms bootstrap it replaces.
- [ ] OpCache preloading reduces cold-start latency by 2â€“5ms per worker.
- [ ] Octane throughput drops 40â€“60% when memory pressure triggers swap â€” ensure adequate RAM.
- [ ] Octane vs FPM
- [ ] RoadRunner driver
- [ ] Swoole driver
- [ ] FrankenPHP driver

# Security Checklist (from 04/06 - only if relevant)
- [ ] State leaks between requests can expose User A's data to User B. This is the most critical security concern with Octane.
- [ ] Singleton misuse: Services registered as singletons that hold request-scoped data cause privilege escalation or data leakage. Always use `scoped()` for request-scoped services.
- [ ] Sandbox isolation is not guaranteed for statics: Static properties bypass the sandbox and persist across requests. Any code using `public static $var` can leak data.
- [ ] Session data must use Laravel's session drivers â€” do not rely on `$_SESSION` which persists across requests in the worker.
- [ ] Third-party packages that use global state can introduce data integrity vulnerabilities without any application code changes.

# Reliability Checklist (from 04/05/06)
- [ ] **Memory leak in long-running worker**: Service provider registers listeners on each request without cleanup. Symptom: Worker RSS grows by 1-5MB per request until OOM. Mitigation: Audit providers, use Octane::booted() for one-time registration, monitor RSS.
- [ ] **Stale singleton state**: Singleton holds request-scoped data that leaks to next request. Symptom: User A sees User B's data. Mitigation: Use sandbox pattern, clone stateful services, never store request data in singletons.
- [ ] **Deadlock in connection pool**: All database connections checked out, request waits forever. Symptom: Workers stuck, no requests complete. Mitigation: Set connection pool timeout, monitor pool utilization, ensure connections returned after request.
- [ ] **Health checks**: Configure Octane health endpoint (/octane/health). Monitor via load balancer. Alert if health check fails on any worker.
- [ ] **Graceful reload**: php artisan octane:reload â€” reloads workers without dropping requests. Run after every deploy.
- [ ] **State leak detection**: Monitor worker RSS growth. Increase >10% per hour indicates state leak. Set octane:watch during development to detect leaks.
- [ ] **Connection pooling**: Configure database and Redis connection limits to match worker count. Each worker maintains persistent connections.

# Testing Checklist (from 04/06)
- [ ] Run `php artisan octane:status` to verify workers are running and accepting requests.
- [ ] Test that `php artisan octane:reload` gracefully restarts workers without dropping in-flight requests.
- [ ] Run concurrent request tests (`ab -n 100 -c 10`) and verify no cross-request data contamination.
- [ ] Audit all service providers: ensure no request-scoped data is bound as singletons.
- [ ] Audit static properties: run `grep -rn "static \$" app/ --include="*.php"` and refactor as needed.
- [ ] Verify all third-party packages work correctly under Octane.
- [ ] Run `php artisan octane:watch` during development to detect state leaks.
- [ ] Measure worker memory (RSS) over a 24-hour soak test â€” alert if >10% growth per hour.
- [ ] Configure health check endpoint and load balancer integration.
- [ ] Document the Octane architecture decision and execution model for the team.
- [ ] Application runs under Octane for 24+ hours with zero state leak incidents
- [ ] `php artisan octane:test` passes with no warnings
- [ ] Worker RSS remains stable (<10% growth over 24 hours)
- [ ] No static properties used for request-scoped state in the entire application
- [ ] All service providers use `scoped()` or `singleton()` correctly based on state nature
- [ ] Team can explain the boot-once handle-many model and the audit requirements
- [ ] All service providers audited and no request-scoped singletons remain
- [ ] All mutable static properties eliminated or properly isolated
- [ ] `max_requests` configured between 500â€“1000 (initial value)
- [ ] No direct superglobal access (`$_GET`, `$_POST`, `$_SESSION`)
- [ ] `php artisan octane:test` passes with zero warnings
- [ ] Concurrent request test shows no cross-request data contamination
- [ ] Graceful reload (`octane:reload`) completes without dropping requests
- [ ] Per-worker RSS stable (<10% growth per hour) over 24-hour soak test
- [ ] Health check endpoint configured and responding
- [ ] Team documentation written covering execution model differences

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Assuming Octane is a drop-in replacement
- [ ] Avoid: Storing request data in singletons
- [ ] Avoid: Not using `Octane::booted()` for one-time setup
- [ ] Avoid: Forgetting connection pool limits
- [ ] Avoid anti-pattern: **Treating Octane like a faster FPM**: Octane's execution model is fundamentally different. FPM-safe code (using statics, singletons, globals) is often Octane-unsafe. A mindset shift is required.
- [ ] Avoid anti-pattern: **Setting `max_requests` too low**: If workers are recycled every 50 requests, the bootstrap cost is paid too frequently, negating Octane's benefit. Aim for 500â€“1000 requests per worker.
- [ ] Avoid anti-pattern: **Using `$_SESSION`, `$_GET`, `$_POST` directly**: Superglobals persist across requests in the same worker. Always use Laravel's request and session facades.
- [ ] Avoid anti-pattern: **Blindly trusting all packages**: Even well-known Laravel packages may have Octane-incompatible patterns (static caches, global state). Test every package.
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
**Core Concepts:** **Boot sequence**: `artisan octane:start` â†’ worker starts â†’ bootstrap (kernel boot, providers register, routes load) â†’ loop: wait for request â†’ dispatch â†’ response â†’ cleanup., **Per-request dispatch**: Octane creates a fresh Laravel application instance per request using `Illuminate\Foundation\Application` cloned from the booted template. Service providers that boot once per worker retain state; per-request providers run fresh., **Sandbox pattern**: Octane uses a sandbox container. Application-level services are cloned per request; framework-level services (config, events, logging) are shared., **Driver abstraction**: `Octane\Octane::driver()` returns the active runtime driver. All runtime-specific code is behind this interface.
**Decision Trees:** Understanding Octane's execution model
**Anti-Patterns:** Application State Leaking Across Requests, Not Configuring max_requests for Worker Recycling, Database Connection Pool Exhaustion, Running Queue Workers Inside Octane, Not Using Octane Table for Cross-Worker State
**Related Topics:** Driver Selection Comparison â€” FrankenPHP, Swoole, RoadRunner, Service Provider Optimization, State Management and Leak Prevention, Worker Configuration by Driver, FPM-to-Octane Migration

