# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Service Provider Optimization for Persistence â€” Singleton Scoping, Deferred Providers
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **State audit**: Review every service provider. If `register()` or `boot()` does a database query, API call, or file read, ensure it's cached or deferred. These run on every worker start, not per request.
- [ ] **Use scoped() for request-dependent services**: Auth, session, database connections â€” anything that varies per request must be scoped().
- [ ] **Defer heavy providers**: Providers that only register container bindings should be deferred. They're loaded only when the bound service is first requested.
- [ ] **Avoid side effects in boot()**: Event listeners registered in boot() persist across all requests. Don't capture request-scoped state in closures registered during boot().
- [ ] All service providers audited for Octane compatibility
- [ ] singleton() vs scoped() used correctly for each binding
- [ ] Heavy providers deferred where appropriate
- [ ] No request-scoped state captured in boot()-registered closures
- [ ] Event listener deduplication confirmed (no duplicate registrations)
- [ ] All service providers use correct singleton/scoped/deferred patterns for Octane
- [ ] Zero singleton bindings hold request-scoped state
- [ ] All boot() side effects are idempotent or moved to Octane::booted()
- [ ] All expensive boot() operations use lazy initialization
- [ ] Deferred providers correctly reduce worker start time and RSS
- [ ] No duplicate event listener registrations
- [ ] `php artisan octane:test` passes with zero warnings
- [ ] Worker RSS at idle is measurably lower after optimization
- [ ] All service providers cataloged and audited
- [ ] Singleton bindings with request-scoped state converted to scoped()
- [ ] All stateless services remain singleton (appropriate optimization)

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **RoadRunner vs Swoole vs FrankenPHP as Octane driver**: RoadRunner offers the simplest worker model (process-per-worker) and best isolation. Swoole provides coroutine-based concurrency for I/O-bound workloads. FrankenPHP is easiest to deploy (single binary). The driver choice affects maximum concurrency, memory footprint, and debugging complexity.
- [ ] **Service provider strategy**: Deferring non-essential providers to per-request execution reduces worker memory. Boot essential providers once, defer expensive ones. Audit all providers for request-scoped singletons.
- [ ] **singleton vs scoped**: singleton() = one instance for all requests in a worker. scoped() = one instance per request, reset at request boundary. Choose based on whether the service holds request-scoped state.
- [ ] **Deferred provider pattern**: Move `register()` calls for expensive but rarely-used services to deferred providers. Saves worker startup time and memory.
- [ ] **Provider boot memoization**: Instead of initializing expensive services in boot(), register a singleton closure that lazy-initializes on first access: `$this->app->singleton(Service::class, fn() => new Service(...))`.
- [ ] Document and follow through on architectural decision: Service provider registration strategy for Octane
- [ ] Ensure architecture aligns with core concept: **Singleton persistence**: `$this->app->singleton(Service::class)` creates one instance shared across all requests within a worker. Ideal for services with no request-scoped state (logging, configuration, caching).
- [ ] Ensure architecture aligns with core concept: **Scoped bindings**: `$this->app->scoped(Service::class)` creates one instance per request. Resets at each request boundary. Use for services that depend on request context (auth, session).
- [ ] Ensure architecture aligns with core concept: **Deferred providers**: Providers that only register service container bindings can be deferred (not loaded until the bound service is requested). `$this->app->registerDeferredProvider(HeavyProvider::class)`.
- [ ] Ensure architecture aligns with core concept: **Provider boot() optimization**: Move heavy operations from `boot()` to lazy initialization. Use memoization: `$this->app->singleton(Service::class, fn() => $this->initializeExpensiveService())`.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **State audit**: Review every service provider. If `register()` or `boot()` does a database query, API call, or file read, ensure it's cached or deferred. These run on every worker start, not per request.
- [ ] **Use scoped() for request-dependent services**: Auth, session, database connections â€” anything that varies per request must be scoped().
- [ ] **Defer heavy providers**: Providers that only register container bindings should be deferred. They're loaded only when the bound service is first requested.
- [ ] **Avoid side effects in boot()**: Event listeners registered in boot() persist across all requests. Don't capture request-scoped state in closures registered during boot().

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
- [ ] Singletons that cache user data can leak data between requests â€” always use scoped() for user-dependent services
- [ ] Provider boot() running once per worker start means configuration errors affect all subsequent requests

# Reliability Checklist (from 04/05/06)
- [ ] **Memory leak in long-running worker**: Service provider registers listeners on each request without cleanup. Symptom: Worker RSS grows by 1-5MB per request until OOM. Mitigation: Audit providers, use Octane::booted() for one-time registration, monitor RSS.
- [ ] **Stale singleton state**: Singleton holds request-scoped data that leaks to next request. Symptom: User A sees User B's data. Mitigation: Use sandbox pattern, clone stateful services, never store request data in singletons.
- [ ] **Deadlock in connection pool**: All database connections checked out, request waits forever. Symptom: Workers stuck, no requests complete. Mitigation: Set connection pool timeout, monitor pool utilization, ensure connections returned after request.
- [ ] **Health checks**: Configure Octane health endpoint (/octane/health). Monitor via load balancer. Alert if health check fails on any worker.
- [ ] **Graceful reload**: php artisan octane:reload Ã¢â‚¬â€ reloads workers without dropping requests. Run after every deploy.
- [ ] **State leak detection**: Monitor worker RSS growth. Increase >10% per hour indicates state leak. Set octane:watch during development to detect leaks.
- [ ] **Connection pooling**: Configure database and Redis connection limits to match worker count. Each worker maintains persistent connections.

# Testing Checklist (from 04/06)
- [ ] All service providers audited for Octane compatibility
- [ ] singleton() vs scoped() used correctly for each binding
- [ ] Heavy providers deferred where appropriate
- [ ] No request-scoped state captured in boot()-registered closures
- [ ] Event listener deduplication confirmed (no duplicate registrations)
- [ ] Database connections use scoped() or implement per-request reset
- [ ] Provider boot() memoizes or defers expensive operations
- [ ] All service providers use correct singleton/scoped/deferred patterns for Octane
- [ ] Zero singleton bindings hold request-scoped state
- [ ] All boot() side effects are idempotent or moved to Octane::booted()
- [ ] All expensive boot() operations use lazy initialization
- [ ] Deferred providers correctly reduce worker start time and RSS
- [ ] No duplicate event listener registrations
- [ ] `php artisan octane:test` passes with zero warnings
- [ ] Worker RSS at idle is measurably lower after optimization
- [ ] All service providers cataloged and audited
- [ ] Singleton bindings with request-scoped state converted to scoped()
- [ ] All stateless services remain singleton (appropriate optimization)
- [ ] boot() side effects moved to Octane::booted() where non-idempotent
- [ ] Expensive boot() operations replaced with lazy initialization
- [ ] No request-scoped variables captured in boot()-registered closures
- [ ] Deferred providers applied (DeferrableProvider interface, provides() method)
- [ ] Non-deferred deferred providers that needed event listeners fixed
- [ ] Worker start time measured and improved from optimization
- [ ] RSS at idle lower after deferring heavy providers
- [ ] All endpoints tested and working correctly

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **State audit**: Review every service provider. If `register()` or `boot()` does a database query, API call, or file read, ensure it's cached or deferred. These run on every worker start, not per request.
- [ ] **Use scoped() for request-dependent services**: Auth, session, database connections â€” anything that varies per request must be scoped().
- [ ] **Defer heavy providers**: Providers that only register container bindings should be deferred. They're loaded only when the bound service is first requested.
- [ ] **Avoid side effects in boot()**: Event listeners registered in boot() persist across all requests. Don't capture request-scoped state in closures registered during boot().

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Registering event listeners per-request in a provider
- [ ] Avoid: Using singleton() for all bindings
- [ ] Avoid: Not deferring heavy providers
- [ ] Avoid: Heavy work in boot() without caching
- [ ] Avoid anti-pattern: **Registering the same listener multiple times in boot()**: Provider boot() runs once, but nested boot() calls (from other providers) may duplicate registrations. Use event listener deduplication.
- [ ] Avoid anti-pattern: **Using singleton() for database connections**: Database connections are inherently request-scoped (transaction state). Use scoped() or ensure connection reset per request.
- [ ] Avoid anti-pattern: **Loading all deferred providers eagerly**: The point of deferred providers is lazy loading. Don't trigger them in another provider's boot().
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
**Core Concepts:** **Singleton persistence**: `$this->app->singleton(Service::class)` creates one instance shared across all requests within a worker. Ideal for services with no request-scoped state (logging, configuration, caching)., **Scoped bindings**: `$this->app->scoped(Service::class)` creates one instance per request. Resets at each request boundary. Use for services that depend on request context (auth, session)., **Deferred providers**: Providers that only register service container bindings can be deferred (not loaded until the bound service is requested). `$this->app->registerDeferredProvider(HeavyProvider::class)`., **Provider boot() optimization**: Move heavy operations from `boot()` to lazy initialization. Use memoization: `$this->app->singleton(Service::class, fn() => $this->initializeExpensiveService())`.
**Decision Trees:** Service provider registration strategy for Octane
**Anti-Patterns:** Application State Leaking Across Requests, Not Configuring max_requests for Worker Recycling, Database Connection Pool Exhaustion, Running Queue Workers Inside Octane, Not Using Octane Table for Cross-Worker State
**Related Topics:** State Management and Leak Prevention, Deferred Providers and Pre-Resolved Bindings, Octane Service Container Lifecycle, FPM to Octane Migration

