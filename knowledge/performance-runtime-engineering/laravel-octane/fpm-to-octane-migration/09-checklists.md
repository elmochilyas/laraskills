# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** FPM to Octane Migration â€” Service Provider Audit, Static Property Elimination, State Leak Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Run `grep -rn "static \$\|self::\|static::" app/ --include="*.php"` and refactor all request-scoped static properties to container bindings.
- [ ] Run `grep -rn "function boot\|Event::listen\|Route::" app/Providers/ --include="*.php"` and verify all boot-time side effects are idempotent.
- [ ] Run concurrent request tests (`ab -n 100 -c 10`) with different user parameters and verify no cross-request contamination.
- [ ] Test all third-party packages under Octane in a staging environment.
- [ ] Run `php artisan octane:watch` during a focused testing session to catch state leaks.
- [ ] Application migrated from FPM to Octane with zero state leak incidents in production
- [ ] Post-migration throughput matches or exceeds pre-migration gain estimation (within 20%)
- [ ] Worker RSS stable over 24+ hours of production traffic (<10% growth per hour)
- [ ] Canary rollout completed without incident, rollback not needed
- [ ] All service providers use correct singleton/scoped/deferred patterns
- [ ] Team understands Octane execution model differences and runbook procedures
- [ ] Rollback procedure tested and documented (revert to FPM in <10 minutes)
- [ ] All request-scoped static properties eliminated from app code
- [ ] Vendor package static properties audited and flagged
- [ ] All service providers audited: boot() side effects idempotent
- [ ] Expensive boot() operations moved to lazy initialization
- [ ] Deferred providers applied where appropriate
- [ ] All request-scoped singletons converted to scoped() bindings
- [ ] Concurrent request test passes: no cross-request data contamination
- [ ] `php artisan octane:test` passes with zero warnings

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **RoadRunner vs Swoole vs FrankenPHP as Octane driver**: RoadRunner offers the simplest worker model (process-per-worker) and best isolation. Swoole provides coroutine-based concurrency for I/O-bound workloads. FrankenPHP is easiest to deploy (single binary). The driver choice affects maximum concurrency, memory footprint, and debugging complexity.
- [ ] **Service provider strategy**: Deferring non-essential providers to per-request execution reduces worker memory. Boot essential providers once, defer expensive ones. Audit all providers for request-scoped singletons.
- [ ] **Migration order**: 1) Static property audit and fix, 2) Service provider audit, 3) Singleton â†’ scoped binding migration, 4) Deferred provider optimization, 5) Local Octane testing, 6) Staging deployment with canary traffic, 7) Production rollout.
- [ ] **Provider refactoring strategy**: Split monolithic providers into smaller, focused providers. Each provider should have a single responsibility and be independently auditable.
- [ ] **Static property elimination**: Replace `public static $cache = []` with `app()->instance()` bindings. For caches, use Laravel's cache facade. For request-scoped data, use `scoped()` bindings.
- [ ] **State leak detection infrastructure**: Set up `octane:watch` during development. Monitor worker RSS in staging and production. Alert on >10% RSS growth per hour.
- [ ] Document and follow through on architectural decision: Migration approach from FPM to Octane
- [ ] Ensure architecture aligns with core concept: **Service provider audit**: Check every provider's `register()` and `boot()` methods. Side effects (event listeners, middleware, route registrations) must be idempotent. Database queries in `boot()` should be cached or moved to lazy initialization.
- [ ] Ensure architecture aligns with core concept: **Static property audit**: `grep -r "static \$" app/` and each `/vendor/...` package used. Request-scoped static data must become `scoped()` container bindings. Global state must be eliminated.
- [ ] Ensure architecture aligns with core concept: **State leak testing**: `ab -n 100 -c 10 http://localhost:8000/test?user=A` followed by `.../test?user=B` â€” if response A leaks into response B, a state leak exists.
- [ ] Ensure architecture aligns with core concept: **Package compatibility matrix**: Laravel packages known to work with Octane: Cashier, Horizon, Telescope, Socialite. Known problematic: packages using global state, static caches, or direct `$_SESSION` access.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Follow single responsibility principle
- [ ] Use constructor property promotion where applicable

# Performance Checklist (from 04/06)
- [ ] Octane delivers 2.5â€“20Ã— throughput over PHP-FPM; API endpoints with <50ms response see biggest gains.
- [ ] Each worker uses 30â€“80MB RSS; total memory = workers Ã— per-worker memory.
- [ ] Each worker maintains persistent DB/Redis connections; total = workers Ã— connections-per-worker.
- [ ] Under Octane, database queries become primary bottleneck (bootstrap is eliminated).
- [ ] OpCache preloading further reduces cold-start latency by 2â€“5ms per worker.
- [ ] Migration itself does not improve performance â€” the gain comes from running Octane successfully after migration.
- [ ] Octane vs FPM
- [ ] RoadRunner driver
- [ ] Swoole driver
- [ ] FrankenPHP driver

# Security Checklist (from 04/06 - only if relevant)
- [ ] State leaks can cause data exposure (User A sees User B's data). This is the primary security concern during migration.
- [ ] Static property elimination: request-scoped data stored in static properties becomes visible to all subsequent requests in the same worker.
- [ ] Singleton misuse: services registered as singletons that hold request-scoped data (e.g., `Auth::user()`) cause privilege escalation or data leakage.
- [ ] Session data in Octane: Octane uses Laravel's session drivers (cookie, database, Redis, file). Ensure session driver is configured correctly â€” cookie-based sessions are simplest and avoid shared state.
- [ ] Package audit for security-critical packages: Any package handling authentication, authorization, or encryption must be verified Octane-compatible.

# Reliability Checklist (from 04/05/06)
- [ ] **Memory leak in long-running worker**: Service provider registers listeners on each request without cleanup. Symptom: Worker RSS grows by 1-5MB per request until OOM. Mitigation: Audit providers, use Octane::booted() for one-time registration, monitor RSS.
- [ ] **Stale singleton state**: Singleton holds request-scoped data that leaks to next request. Symptom: User A sees User B's data. Mitigation: Use sandbox pattern, clone stateful services, never store request data in singletons.
- [ ] **Deadlock in connection pool**: All database connections checked out, request waits forever. Symptom: Workers stuck, no requests complete. Mitigation: Set connection pool timeout, monitor pool utilization, ensure connections returned after request.
- [ ] **Health checks**: Configure Octane health endpoint (/octane/health). Monitor via load balancer. Alert if health check fails on any worker.
- [ ] **Graceful reload**: php artisan octane:reload Ã¢â‚¬â€ reloads workers without dropping requests. Run after every deploy.
- [ ] **State leak detection**: Monitor worker RSS growth. Increase >10% per hour indicates state leak. Set octane:watch during development to detect leaks.
- [ ] **Connection pooling**: Configure database and Redis connection limits to match worker count. Each worker maintains persistent connections.

# Testing Checklist (from 04/06)
- [ ] Run `grep -rn "static \$\|self::\|static::" app/ --include="*.php"` and refactor all request-scoped static properties to container bindings.
- [ ] Run `grep -rn "function boot\|Event::listen\|Route::" app/Providers/ --include="*.php"` and verify all boot-time side effects are idempotent.
- [ ] Run concurrent request tests (`ab -n 100 -c 10`) with different user parameters and verify no cross-request contamination.
- [ ] Test all third-party packages under Octane in a staging environment.
- [ ] Run `php artisan octane:watch` during a focused testing session to catch state leaks.
- [ ] Measure worker RSS growth over a 24-hour soak test â€” alert if >10% per hour.
- [ ] Verify graceful reload works: `php artisan octane:reload` does not drop in-flight requests.
- [ ] Configure health check monitoring and alerting before production rollout.
- [ ] Deploy to 10% of servers first; monitor error rates for 24 hours.
- [ ] Document rollback procedure: revert to FPM by switching the process manager configuration.
- [ ] Application migrated from FPM to Octane with zero state leak incidents in production
- [ ] Post-migration throughput matches or exceeds pre-migration gain estimation (within 20%)
- [ ] Worker RSS stable over 24+ hours of production traffic (<10% growth per hour)
- [ ] Canary rollout completed without incident, rollback not needed
- [ ] All service providers use correct singleton/scoped/deferred patterns
- [ ] Team understands Octane execution model differences and runbook procedures
- [ ] Rollback procedure tested and documented (revert to FPM in <10 minutes)
- [ ] All request-scoped static properties eliminated from app code
- [ ] Vendor package static properties audited and flagged
- [ ] All service providers audited: boot() side effects idempotent
- [ ] Expensive boot() operations moved to lazy initialization
- [ ] Deferred providers applied where appropriate
- [ ] All request-scoped singletons converted to scoped() bindings
- [ ] Concurrent request test passes: no cross-request data contamination
- [ ] `php artisan octane:test` passes with zero warnings
- [ ] 24-hour soak test: RSS stable (<10% growth per hour)
- [ ] Graceful reload verified (zero dropped in-flight requests)
- [ ] Canary rollout (10% servers, 24-hour observation) completed without incident
- [ ] Post-migration metrics collected and compared to baseline
- [ ] Rollback procedure documented and tested
- [ ] Operations team trained on Octane runbooks

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Skipping the package audit
- [ ] Avoid: Relying on `$_SESSION` or `$_REQUEST`
- [ ] Avoid: Not testing concurrent requests
- [ ] Avoid: Ignoring `octane:watch` during development
- [ ] Avoid anti-pattern: **Big-bang migration**: Deploying Octane to all servers simultaneously without canary testing. Always roll out to a percentage of servers first.
- [ ] Avoid anti-pattern: **No rollback plan**: Deploying Octane without a quick rollback mechanism. Keep the FPM deployment configuration intact for at least one release cycle.
- [ ] Avoid anti-pattern: **Auditing only app code, not vendor code**: Third-party packages are a major source of static property leaks. Run static analysis on vendor code or at least test known packages.
- [ ] Avoid anti-pattern: **Assuming `php artisan octane:status` shows no leaks**: `octane:status` only shows worker health, not data integrity. You must run explicit state leak tests.
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
**Core Concepts:** **Service provider audit**: Check every provider's `register()` and `boot()` methods. Side effects (event listeners, middleware, route registrations) must be idempotent. Database queries in `boot()` should be cached or moved to lazy initialization., **Static property audit**: `grep -r "static \$" app/` and each `/vendor/...` package used. Request-scoped static data must become `scoped()` container bindings. Global state must be eliminated., **State leak testing**: `ab -n 100 -c 10 http://localhost:8000/test?user=A` followed by `.../test?user=B` â€” if response A leaks into response B, a state leak exists., **Package compatibility matrix**: Laravel packages known to work with Octane: Cashier, Horizon, Telescope, Socialite. Known problematic: packages using global state, static caches, or direct `$_SESSION` access.
**Decision Trees:** Migration approach from FPM to Octane
**Anti-Patterns:** Application State Leaking Across Requests, Not Configuring max_requests for Worker Recycling, Database Connection Pool Exhaustion, Running Queue Workers Inside Octane, Not Using Octane Table for Cross-Worker State
**Related Topics:** State Management and Leak Prevention, Service Provider Optimization, Package Compatibility Matrix, Octane Architecture and Execution Model, Worker Configuration by Driver


