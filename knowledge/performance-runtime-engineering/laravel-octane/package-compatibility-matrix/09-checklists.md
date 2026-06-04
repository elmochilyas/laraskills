# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Package Compatibility Matrix â€” Known-Compatible and Problematic Packages Under Octane
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Run octane:test before every deploy**: Catches regressions from package updates. Add to CI pipeline.
- [ ] **Use compatibility wrappers**: For packages with static properties, create a decorator using Octane's `scoped()` binding to provide per-request instances.
- [ ] **Test each package in isolation**: Disable all but one package, run under Octane, verify no state leaks. Repeat for each package.
- [ ] **Maintain a compatibility matrix**: Track which packages and versions are Octane-compatible. Update with each dependency change.
- [ ] **Prefer Octane-first packages**: Choose packages explicitly tested under Octane. Check GitHub issues for "octane" label.
- [ ] Package compatibility audit completed for all third-party packages
- [ ] octane:test passes in CI pipeline
- [ ] Compatibility wrappers implemented for incompatible packages
- [ ] Static property audit completed for vendor packages
- [ ] Service provider audit completed for all registered providers
- [ ] Complete compatibility matrix documented and stored in repository
- [ ] All third-party packages classified with status and mitigation approach
- [ ] Incompatible packages wrapped with scoped() bindings or replaced
- [ ] `php artisan octane:test` passes with zero warnings in CI
- [ ] CI pipeline fails on any new Octane incompatibility
- [ ] No cross-request data leaks originating from vendor packages
- [ ] Matrix reviewed and updated after every composer change
- [ ] Team can quickly determine compatibility of any package from the matrix
- [ ] All third-party packages enumerated from composer.json
- [ ] Static property audit completed for each vendor package

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **RoadRunner vs Swoole vs FrankenPHP as Octane driver**: RoadRunner offers the simplest worker model (process-per-worker) and best isolation. Swoole provides coroutine-based concurrency for I/O-bound workloads. FrankenPHP is easiest to deploy (single binary). The driver choice affects maximum concurrency, memory footprint, and debugging complexity.
- [ ] **Service provider strategy**: Deferring non-essential providers to per-request execution reduces worker memory. Boot essential providers once, defer expensive ones. Audit all providers for request-scoped singletons.
- [ ] **Compatibility wrapper pattern**: Wrap the package's global state behind a request-scoped interface using Octane's `scoped()` method. The wrapper creates a fresh instance per request while the package thinks it's using a singleton.
- [ ] **Provider audit**: Every service provider that calls `$this->app->singleton()` must be reviewed. If the singleton stores request-scoped data, it must use `scoped()` or implement `resetState()`.
- [ ] **Static property audit**: Search codebase for `public static` and `protected static` properties in vendor packages. Each must be justified as intentionally shared state.
- [ ] Document and follow through on architectural decision: Package compatibility verification before Octane
- [ ] Ensure architecture aligns with core concept: **Compatible packages**: Laravel ecosystem packages from Taylor Otwell / Laravel team are Octane-aware. Spatie packages generally require `spatie/laravel-octane-compat` or explicit scoped binding config.
- [ ] Ensure architecture aligns with core concept: **Problematic patterns**: 1) `public static $property` for caching, 2) `$_ENV` / `$_SERVER` mutation, 3) Global event bus without listener deduplication, 4) Service container rebinding on every request, 5) Direct `$_SESSION` access.
- [ ] Ensure architecture aligns with core concept: **Testing methodology**: `artisan octane:test` runs a battery of checks. For specific packages, write Pest/PHPUnit tests that run under Octane and verify no cross-request contamination.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Run octane:test before every deploy**: Catches regressions from package updates. Add to CI pipeline.
- [ ] **Use compatibility wrappers**: For packages with static properties, create a decorator using Octane's `scoped()` binding to provide per-request instances.
- [ ] **Test each package in isolation**: Disable all but one package, run under Octane, verify no state leaks. Repeat for each package.
- [ ] **Maintain a compatibility matrix**: Track which packages and versions are Octane-compatible. Update with each dependency change.
- [ ] **Prefer Octane-first packages**: Choose packages explicitly tested under Octane. Check GitHub issues for "octane" label.

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
- [ ] Incompatible packages can cause cross-request data leaks (user A sees user B's data)
- [ ] Static caches in packages may retain sensitive data (PII, tokens) across requests
- [ ] $_SESSION-compatible packages may not work in Octane's stateless model

# Reliability Checklist (from 04/05/06)
- [ ] **Memory leak in long-running worker**: Service provider registers listeners on each request without cleanup. Symptom: Worker RSS grows by 1-5MB per request until OOM. Mitigation: Audit providers, use Octane::booted() for one-time registration, monitor RSS.
- [ ] **Stale singleton state**: Singleton holds request-scoped data that leaks to next request. Symptom: User A sees User B's data. Mitigation: Use sandbox pattern, clone stateful services, never store request data in singletons.
- [ ] **Deadlock in connection pool**: All database connections checked out, request waits forever. Symptom: Workers stuck, no requests complete. Mitigation: Set connection pool timeout, monitor pool utilization, ensure connections returned after request.
- [ ] **Health checks**: Configure Octane health endpoint (/octane/health). Monitor via load balancer. Alert if health check fails on any worker.
- [ ] **Graceful reload**: php artisan octane:reload Ã¢â‚¬â€ reloads workers without dropping requests. Run after every deploy.
- [ ] **State leak detection**: Monitor worker RSS growth. Increase >10% per hour indicates state leak. Set octane:watch during development to detect leaks.
- [ ] **Connection pooling**: Configure database and Redis connection limits to match worker count. Each worker maintains persistent connections.

# Testing Checklist (from 04/06)
- [ ] Package compatibility audit completed for all third-party packages
- [ ] octane:test passes in CI pipeline
- [ ] Compatibility wrappers implemented for incompatible packages
- [ ] Static property audit completed for vendor packages
- [ ] Service provider audit completed for all registered providers
- [ ] Connection pool limits calculated (N workers Ã— M connections)
- [ ] Memory monitoring configured for per-worker RSS tracking
- [ ] Complete compatibility matrix documented and stored in repository
- [ ] All third-party packages classified with status and mitigation approach
- [ ] Incompatible packages wrapped with scoped() bindings or replaced
- [ ] `php artisan octane:test` passes with zero warnings in CI
- [ ] CI pipeline fails on any new Octane incompatibility
- [ ] No cross-request data leaks originating from vendor packages
- [ ] Matrix reviewed and updated after every composer change
- [ ] Team can quickly determine compatibility of any package from the matrix
- [ ] All third-party packages enumerated from composer.json
- [ ] Static property audit completed for each vendor package
- [ ] Compatibility matrix created with all packages classified
- [ ] Each package tested under Octane in isolation
- [ ] `php artisan octane:test` passing in CI pipeline
- [ ] CI fails the build on Octane incompatibility warnings
- [ ] Compatibility matrix stored in repository and version-controlled
- [ ] Package replacement plan created for truly incompatible packages
- [ ] Matrix owner assigned and review cadence established

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Run octane:test before every deploy**: Catches regressions from package updates. Add to CI pipeline.
- [ ] **Use compatibility wrappers**: For packages with static properties, create a decorator using Octane's `scoped()` binding to provide per-request instances.
- [ ] **Test each package in isolation**: Disable all but one package, run under Octane, verify no state leaks. Repeat for each package.
- [ ] **Maintain a compatibility matrix**: Track which packages and versions are Octane-compatible. Update with each dependency change.
- [ ] **Prefer Octane-first packages**: Choose packages explicitly tested under Octane. Check GitHub issues for "octane" label.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Assuming Octane is a drop-in replacement
- [ ] Avoid: Not auditing service providers
- [ ] Avoid: Ignoring connection pool limits
- [ ] Avoid: Running Octane without memory monitoring
- [ ] Avoid: Not configuring opcache.preload
- [ ] Avoid anti-pattern: **Migrating to Octane without a package audit**: The biggest source of Octane failures is third-party packages. Audit first, migrate second.
- [ ] Avoid anti-pattern: **Assuming "works in FPM = works in Octane"**: FPM's process-per-request model masks all state leaks. Octane reveals them immediately.
- [ ] Avoid anti-pattern: **Applying compatibility patches without testing**: A patch might fix one symptom while introducing a different leak. Always test.
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
**Core Concepts:** **Compatible packages**: Laravel ecosystem packages from Taylor Otwell / Laravel team are Octane-aware. Spatie packages generally require `spatie/laravel-octane-compat` or explicit scoped binding config., **Problematic patterns**: 1) `public static $property` for caching, 2) `$_ENV` / `$_SERVER` mutation, 3) Global event bus without listener deduplication, 4) Service container rebinding on every request, 5) Direct `$_SESSION` access., **Testing methodology**: `artisan octane:test` runs a battery of checks. For specific packages, write Pest/PHPUnit tests that run under Octane and verify no cross-request contamination.
**Decision Trees:** Package compatibility verification before Octane
**Anti-Patterns:** Application State Leaking Across Requests, Not Configuring max_requests for Worker Recycling, Database Connection Pool Exhaustion, Running Queue Workers Inside Octane, Not Using Octane Table for Cross-Worker State
**Related Topics:** State Management and Leak Prevention, FPM to Octane Migration, Service Provider Optimization, Static Property Audit Methodology

