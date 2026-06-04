# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** State Management and Leak Prevention â€” Static Property Avoidance, Singleton Scoping
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Static property audit**: Search codebase for `static` properties. Each must be justified as intentionally shared state or eliminated. `grep -r "static \$\|public static\b" app/` â€” expect zero results for request-scoped data.
- [ ] **Use scoped() for per-request services**: Auth, session, database, request â€” anything that varies per request must use `$this->app->scoped()`.
- [ ] **Implement resetState() for stateful singletons**: If a singleton must hold request-scoped state, implement a `resetState()` method called by Octane's on each request end.
- [ ] **Monitor RSS growth**: Track per-worker RSS. Increase >10% per hour indicates a state leak. Use `php artisan octane:watch` during development.
- [ ] **Test with ordered requests**: Send requests as User A, User B, User A. If User B's data appears in User A's second request, you have a state leak.
- [ ] Static property audit completed across entire codebase
- [ ] All request-scoped services use scoped() bindings
- [ ] resetState() implemented for stateful singletons
- [ ] Octane ordered-request test passed (A, B, A â€” no contamination)
- [ ] RSS monitoring configured with alert for >10% per hour growth
- [ ] Zero cross-request state leaks detected in production or staging
- [ ] All request-scoped static properties eliminated from app code
- [ ] All request-scoped container bindings use `scoped()`
- [ ] Ordered-request test (A, B, A) passes consistently with zero contamination
- [ ] Per-worker RSS stable (<10% growth over 24 hours)
- [ ] `php artisan octane:test` and `php artisan octane:watch` produce zero warnings
- [ ] CI pipeline prevents introduction of new static property leaks
- [ ] Team can identify, investigate, and fix state leaks within 1 hour of detection
- [ ] Static property audit completed across app and vendor code
- [ ] All request-scoped static properties eliminated or wrapped with per-request reset

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **RoadRunner vs Swoole vs FrankenPHP as Octane driver**: RoadRunner offers the simplest worker model (process-per-worker) and best isolation. Swoole provides coroutine-based concurrency for I/O-bound workloads. FrankenPHP is easiest to deploy (single binary). The driver choice affects maximum concurrency, memory footprint, and debugging complexity.
- [ ] **Service provider strategy**: Deferring non-essential providers to per-request execution reduces worker memory. Boot essential providers once, defer expensive ones. Audit all providers for request-scoped singletons.
- [ ] **Sandbox pattern**: Octane creates a sandbox by cloning the application instance per request. Request-specific services are fresh per request. Config, events, and logging singletons are shared.
- [ ] **Reset mechanism**: Octane intercepts `$app->terminate()` and replaces it with sandbox reset logic. Services with `$resetOnStart` property are automatically re-initialized.
- [ ] **Static property tracking**: Octane can detect static property modifications via a callback registered in `zend_execute_data`. Enable in development for early leak detection.
- [ ] Document and follow through on architectural decision: State management strategy for Octane
- [ ] Document and follow through on architectural decision: Identifying and fixing state leaks
- [ ] Ensure architecture aligns with core concept: **Static property leak**: `public static $user = null;` â€” if Request A sets it, Request B inherits it. Debugging is extremely difficult because behavior depends on request ordering.
- [ ] Ensure architecture aligns with core concept: **Singleton scoping**: Bindings registered as `singleton()` persist. Bindings registered as `scoped()` reset per request. Always use `scoped()` for session, auth, request, and database-bound services.
- [ ] Ensure architecture aligns with core concept: **Octane's reset API**: `Octane::resetState()` clears scoped instances at request end. Services implementing `ResetServiceProvider` or using `$resetOnStart` property automatically reset.
- [ ] Ensure architecture aligns with core concept: **Connection pooling**: Database/Redis connections are typically singleton (persistent). In Octane, connection pooling requires explicit configuration â€” persistent connections must not leak transaction state.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Static property audit**: Search codebase for `static` properties. Each must be justified as intentionally shared state or eliminated. `grep -r "static \$\|public static\b" app/` â€” expect zero results for request-scoped data.
- [ ] **Use scoped() for per-request services**: Auth, session, database, request â€” anything that varies per request must use `$this->app->scoped()`.
- [ ] **Implement resetState() for stateful singletons**: If a singleton must hold request-scoped state, implement a `resetState()` method called by Octane's on each request end.
- [ ] **Monitor RSS growth**: Track per-worker RSS. Increase >10% per hour indicates a state leak. Use `php artisan octane:watch` during development.
- [ ] **Test with ordered requests**: Send requests as User A, User B, User A. If User B's data appears in User A's second request, you have a state leak.

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
- [ ] State leaks are a security vulnerability: user A can see user B's data, orders, or personal information
- [ ] Static caches in packages may retain sensitive data across requests
- [ ] Auth state leaking between requests bypasses authentication entirely

# Reliability Checklist (from 04/05/06)
- [ ] **Memory leak in long-running worker**: Service provider registers listeners on each request without cleanup. Symptom: Worker RSS grows by 1-5MB per request until OOM. Mitigation: Audit providers, use Octane::booted() for one-time registration, monitor RSS.
- [ ] **Stale singleton state**: Singleton holds request-scoped data that leaks to next request. Symptom: User A sees User B's data. Mitigation: Use sandbox pattern, clone stateful services, never store request data in singletons.
- [ ] **Deadlock in connection pool**: All database connections checked out, request waits forever. Symptom: Workers stuck, no requests complete. Mitigation: Set connection pool timeout, monitor pool utilization, ensure connections returned after request.
- [ ] **Health checks**: Configure Octane health endpoint (/octane/health). Monitor via load balancer. Alert if health check fails on any worker.
- [ ] **Graceful reload**: php artisan octane:reload Ã¢â‚¬â€ reloads workers without dropping requests. Run after every deploy.
- [ ] **State leak detection**: Monitor worker RSS growth. Increase >10% per hour indicates state leak. Set octane:watch during development to detect leaks.
- [ ] **Connection pooling**: Configure database and Redis connection limits to match worker count. Each worker maintains persistent connections.

# Testing Checklist (from 04/06)
- [ ] Static property audit completed across entire codebase
- [ ] All request-scoped services use scoped() bindings
- [ ] resetState() implemented for stateful singletons
- [ ] Octane ordered-request test passed (A, B, A â€” no contamination)
- [ ] RSS monitoring configured with alert for >10% per hour growth
- [ ] Third-party package compatibility tested under Octane
- [ ] Octane::watch enabled in development for leak detection
- [ ] Zero cross-request state leaks detected in production or staging
- [ ] All request-scoped static properties eliminated from app code
- [ ] All request-scoped container bindings use `scoped()`
- [ ] Ordered-request test (A, B, A) passes consistently with zero contamination
- [ ] Per-worker RSS stable (<10% growth over 24 hours)
- [ ] `php artisan octane:test` and `php artisan octane:watch` produce zero warnings
- [ ] CI pipeline prevents introduction of new static property leaks
- [ ] Team can identify, investigate, and fix state leaks within 1 hour of detection
- [ ] Static property audit completed across app and vendor code
- [ ] All request-scoped static properties eliminated or wrapped with per-request reset
- [ ] All request-scoped container bindings use `scoped()` (not `singleton()`)
- [ ] Ordered-request test (A, B, A) passes with zero data contamination
- [ ] `php artisan octane:watch` detects zero leaks during development testing
- [ ] `php artisan octane:test` passes with zero warnings
- [ ] Per-worker RSS monitoring configured with 10% growth alert
- [ ] CI gate for static properties implemented
- [ ] State leak incident response runbook documented
- [ ] All team members trained on Octane state management patterns

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Static property audit**: Search codebase for `static` properties. Each must be justified as intentionally shared state or eliminated. `grep -r "static \$\|public static\b" app/` â€” expect zero results for request-scoped data.
- [ ] **Use scoped() for per-request services**: Auth, session, database, request â€” anything that varies per request must use `$this->app->scoped()`.
- [ ] **Implement resetState() for stateful singletons**: If a singleton must hold request-scoped state, implement a `resetState()` method called by Octane's on each request end.
- [ ] **Monitor RSS growth**: Track per-worker RSS. Increase >10% per hour indicates a state leak. Use `php artisan octane:watch` during development.
- [ ] **Test with ordered requests**: Send requests as User A, User B, User A. If User B's data appears in User A's second request, you have a state leak.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using static properties for caching
- [ ] Avoid: Not testing third-party packages
- [ ] Avoid: Singleton for database connection
- [ ] Avoid: No state leak monitoring
- [ ] Avoid: Forgetting resetState() in custom services
- [ ] Avoid anti-pattern: **Guessing about state leaks**: "This property is probably safe" is the root cause of Octane production incidents. Audit everything.
- [ ] Avoid anti-pattern: **Fixing leaks with pm.max_requests = 100**: Low max_requests masks leaks by recycling workers frequently but wastes CPU on constant restarts.
- [ ] Avoid anti-pattern: **Blindly replacing static with singleton**: A singleton is still persistent across requests. Use scoped() for per-request data.
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
**Core Concepts:** **Static property leak**: `public static $user = null;` â€” if Request A sets it, Request B inherits it. Debugging is extremely difficult because behavior depends on request ordering., **Singleton scoping**: Bindings registered as `singleton()` persist. Bindings registered as `scoped()` reset per request. Always use `scoped()` for session, auth, request, and database-bound services., **Octane's reset API**: `Octane::resetState()` clears scoped instances at request end. Services implementing `ResetServiceProvider` or using `$resetOnStart` property automatically reset., **Connection pooling**: Database/Redis connections are typically singleton (persistent). In Octane, connection pooling requires explicit configuration â€” persistent connections must not leak transaction state.
**Decision Trees:** State management strategy for Octane, Identifying and fixing state leaks
**Anti-Patterns:** Application State Leaking Across Requests, Not Configuring max_requests for Worker Recycling, Database Connection Pool Exhaustion, Running Queue Workers Inside Octane, Not Using Octane Table for Cross-Worker State
**Related Topics:** Service Provider Optimization, Connection Pooling Strategies, Static Property Audit Methodology, FPM to Octane Migration

