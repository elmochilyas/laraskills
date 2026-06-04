# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Deferred Providers and Pre-Resolved Bindings â€” Service Container Optimization
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Audit all custom service providers â€” mark each as deferrable or non-deferrable based on boot-time side effects.
- [ ] Verify deferred providers implement both `DeferrableProvider` and define `provides()` returning an array of service bindings.
- [ ] Confirm non-deferred providers have boot-time side effects that justify their exclusion from deferral.
- [ ] Run `php artisan optimize` and verify the container cache file is generated.
- [ ] Benchmark worker start time before and after pre-resolution changes.
- [ ] All eligible custom providers implement DeferrableProvider
- [ ] Worker boot time measurably reduced (10-50% improvement, depending on provider count)
- [ ] First-request latency does not increase (or improves from strategic pre-resolution)
- [ ] `php artisan optimize` integrated into deployment pipeline
- [ ] No missing event listeners, middleware, or route model bindings from improperly deferred providers
- [ ] Pre-resolved list does not contain rarely-used services
- [ ] Provider tier configuration documented and understood by the team
- [ ] `php artisan octane:test` passes with zero warnings
- [ ] All custom providers audited for deferrability
- [ ] Deferrable providers implement `DeferrableProvider` and `provides()` method
- [ ] Non-deferred providers have documented justifications (boot side effects)
- [ ] Providers with mixed concerns split into deferred + non-deferred
- [ ] Custom pre-resolved bindings limited to services used in >50% of requests
- [ ] Worker boot time measured before and after changes
- [ ] First-request latency measured before and after changes

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **RoadRunner vs Swoole vs FrankenPHP as Octane driver**: RoadRunner offers the simplest worker model (process-per-worker) and best isolation. Swoole provides coroutine-based concurrency for I/O-bound workloads. FrankenPHP is easiest to deploy (single binary). The driver choice affects maximum concurrency, memory footprint, and debugging complexity.
- [ ] **Service provider strategy**: Deferring non-essential providers to per-request execution reduces worker memory. Boot essential providers once, defer expensive ones. Audit all providers for request-scoped singletons.
- [ ] **Tiered provider strategy**: Boot essential providers once at worker start, defer expensive or rarely-used providers to per-request execution.
- [ ] **Pre-resolution profiling**: Benchmark worker start time with and without additional pre-resolved bindings. Add bindings only when first-request latency improvement outweighs boot time increase.
- [ ] **Provider dependency awareness**: If provider A depends on a binding from provider B, ensure B is either pre-resolved or A and B are both deferred to avoid resolution order issues.
- [ ] **Separation of concerns**: Use deferred providers for infrastructure concerns (caching, queue, mail) and non-deferred for request-specific behavior (session, auth, middleware).
- [ ] Document and follow through on architectural decision: Service provider deferral strategy for Octane
- [ ] Ensure architecture aligns with core concept: **Deferred providers**: A service provider implementing `DeferrableProvider` / `getProvides()` is NOT loaded at worker start. It's loaded only when one of its bound services is resolved. Saves memory and startup time.
- [ ] Ensure architecture aligns with core concept: **Pre-resolved bindings**: In `config/octane.php`: `'pre_resolved' => ['auth', 'cache', 'config', 'db', 'encrypter', 'events', 'files', 'log', 'queue', 'redirect', 'router', 'session', 'validator', 'view']` â€” resolved once, shared across requests.
- [ ] Ensure architecture aligns with core concept: **Container compile (Laravel 10+)**: `artisan optimize` compiles service container definitions into a cached file, reducing provider resolution time.
- [ ] Ensure architecture aligns with core concept: **Boot time vs request time tradeoff**: Pre-resolving more services increases worker boot time (worker start latency) but reduces first-request latency.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Follow single responsibility principle
- [ ] Use constructor property promotion where applicable

# Performance Checklist (from 04/06)
- [ ] Octane delivers 2.5â€“20x throughput over PHP-FPM; API endpoints with <50ms response see biggest gains.
- [ ] Deferred providers save memory and startup time by loading only when their bound services are requested.
- [ ] Pre-resolved bindings reduce first-request latency but increase worker boot time. Each additional pre-resolved service adds ~1â€“5ms to boot time.
- [ ] Container compile (`artisan optimize`) reduces provider resolution overhead by caching container definitions.
- [ ] Default pre-resolved bindings in Laravel cover the most common services â€” avoid adding niche services to the pre-resolved list.
- [ ] Octane vs FPM
- [ ] RoadRunner driver
- [ ] Swoole driver
- [ ] FrankenPHP driver

# Security Checklist (from 04/06 - only if relevant)
- [ ] Deferred providers should not handle authentication or authorization logic that must be present for every request.
- [ ] If a deferred provider registers middleware that blocks unauthorized access, deferring it could leave a window where the middleware is not yet registered.
- [ ] Pre-resolved bindings are shared across all requests in a worker â€” never store user-specific data in pre-resolved singletons.
- [ ] Validate that deferred providers do not expose sensitive services prematurely by loading on unexpected triggers.

# Reliability Checklist (from 04/05/06)
- [ ] **Memory leak in long-running worker**: Service provider registers listeners on each request without cleanup. Symptom: Worker RSS grows by 1-5MB per request until OOM. Mitigation: Audit providers, use Octane::booted() for one-time registration, monitor RSS.
- [ ] **Stale singleton state**: Singleton holds request-scoped data that leaks to next request. Symptom: User A sees User B's data. Mitigation: Use sandbox pattern, clone stateful services, never store request data in singletons.
- [ ] **Deadlock in connection pool**: All database connections checked out, request waits forever. Symptom: Workers stuck, no requests complete. Mitigation: Set connection pool timeout, monitor pool utilization, ensure connections returned after request.
- [ ] **Health checks**: Configure Octane health endpoint (/octane/health). Monitor via load balancer. Alert if health check fails on any worker.
- [ ] **Graceful reload**: php artisan octane:reload Ã¢â‚¬â€ reloads workers without dropping requests. Run after every deploy.
- [ ] **State leak detection**: Monitor worker RSS growth. Increase >10% per hour indicates state leak. Set octane:watch during development to detect leaks.
- [ ] **Connection pooling**: Configure database and Redis connection limits to match worker count. Each worker maintains persistent connections.

# Testing Checklist (from 04/06)
- [ ] Audit all custom service providers â€” mark each as deferrable or non-deferrable based on boot-time side effects.
- [ ] Verify deferred providers implement both `DeferrableProvider` and define `provides()` returning an array of service bindings.
- [ ] Confirm non-deferred providers have boot-time side effects that justify their exclusion from deferral.
- [ ] Run `php artisan optimize` and verify the container cache file is generated.
- [ ] Benchmark worker start time before and after pre-resolution changes.
- [ ] Test that deferred providers load correctly when their services are first requested.
- [ ] Verify no middleware or event listeners are missing after deferring providers.
- [ ] Check that pre-resolved bindings do not store request-scoped data in shared singletons.
- [ ] All eligible custom providers implement DeferrableProvider
- [ ] Worker boot time measurably reduced (10-50% improvement, depending on provider count)
- [ ] First-request latency does not increase (or improves from strategic pre-resolution)
- [ ] `php artisan optimize` integrated into deployment pipeline
- [ ] No missing event listeners, middleware, or route model bindings from improperly deferred providers
- [ ] Pre-resolved list does not contain rarely-used services
- [ ] Provider tier configuration documented and understood by the team
- [ ] `php artisan octane:test` passes with zero warnings
- [ ] All custom providers audited for deferrability
- [ ] Deferrable providers implement `DeferrableProvider` and `provides()` method
- [ ] Non-deferred providers have documented justifications (boot side effects)
- [ ] Providers with mixed concerns split into deferred + non-deferred
- [ ] Custom pre-resolved bindings limited to services used in >50% of requests
- [ ] Worker boot time measured before and after changes
- [ ] First-request latency measured before and after changes
- [ ] `php artisan optimize` run and cached files generated
- [ ] Deferred providers resolve correctly on first request
- [ ] Deferred providers work after `octane:reload`
- [ ] Provider tier configuration documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Pre-resolving everything
- [ ] Avoid: Deferring providers with boot-time side effects
- [ ] Avoid: Not running container compile
- [ ] Avoid anti-pattern: **Deferring all providers indiscriminately**: Providers that set up event listeners, middleware, or route models must be loaded at boot. Deferring them causes these registrations to never happen.
- [ ] Avoid anti-pattern: **Pre-resolving services used in <1% of requests**: Wastes memory and increases boot time for services that are rarely needed. Let them resolve lazily.
- [ ] Avoid anti-pattern: **Mixing deferred and non-deferred logic in the same provider**: Splits provider concerns and makes it unclear which services are available at boot time vs request time. Use separate providers.
- [ ] Avoid anti-pattern: **Ignoring Octane's sandbox reset after deferred provider resolution**: Deferred providers loaded mid-request run in the sandbox context. Their bindings must be properly cleaned up for the next request.
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
**Core Concepts:** **Deferred providers**: A service provider implementing `DeferrableProvider` / `getProvides()` is NOT loaded at worker start. It's loaded only when one of its bound services is resolved. Saves memory and startup time., **Pre-resolved bindings**: In `config/octane.php`: `'pre_resolved' => ['auth', 'cache', 'config', 'db', 'encrypter', 'events', 'files', 'log', 'queue', 'redirect', 'router', 'session', 'validator', 'view']` â€” resolved once, shared across requests., **Container compile (Laravel 10+)**: `artisan optimize` compiles service container definitions into a cached file, reducing provider resolution time., **Boot time vs request time tradeoff**: Pre-resolving more services increases worker boot time (worker start latency) but reduces first-request latency.
**Decision Trees:** Service provider deferral strategy for Octane
**Anti-Patterns:** Application State Leaking Across Requests, Not Configuring max_requests for Worker Recycling, Database Connection Pool Exhaustion, Running Queue Workers Inside Octane, Not Using Octane Table for Cross-Worker State
**Related Topics:** Service Provider Optimization, State Management and Leak Prevention, Octane Service Container Lifecycle, OpCache Preloading for Cold-Start Optimization, Worker Configuration by Driver

