# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP Engine & Version Performance
**Knowledge Unit:** Memory-Resident Architecture â€” Boot-Once, Handle-Many Model
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Profile bootstrap cost first**: If framework bootstrap is <20% of total request time, Octane gains will be modest. Measure before migrating.
- [ ] **Audit service providers**: Static properties, singletons, and deferred providers must be reviewed for cross-request state leaks.
- [ ] **Use connection pooling**: Database and Redis connections must be managed across requests â€” Octane provides built-in pooling.
- [ ] **Set max_requests for recycling**: Even in memory-resident mode, recycle workers after 1000-5000 requests to prevent memory drift.
- [ ] Bootstrap cost measured and confirmed >20% of request time
- [ ] All service providers audited for static property usage
- [ ] Static properties and singletons reviewed for cross-request state leaks
- [ ] Connection pooling configured for database and Redis
- [ ] Worker recycling configured (max_requests = 1000-5000)
- [ ] Memory-resident architecture deployed with stable RSS over 24+ hours
- [ ] Throughput improvement meets or exceeds projections
- [ ] No data leakage between requests detected
- [ ] Rollback capability maintained for at least 2 weeks
- [ ] Team can operate and troubleshoot the new runtime independently
- [ ] Bootstrap time measured and confirmed >20% of request time
- [ ] All service providers audited (no request-scoped singletons)
- [ ] All static properties refactored or confirmed safe
- [ ] 24-hour soak test passed with stable RSS
- [ ] Rollback plan in place with parallel FPM deployment
- [ ] Team trained on runtime operations and debugging

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Shared-nothing architecture** (PHP-FPM): Each request is isolated in a separate OS process. Maximizes fault isolation at the cost of per-request bootstrap overhead. Best for multi-tenant hosting where isolation is prioritized.
- [ ] **Memory-resident architecture** (Octane/Swoole): Boot once, handle many. Reduces latency by 60-90% for framework-heavy applications but introduces state management complexity. Best for dedicated API servers with controlled code deployments.
- [ ] **Event-driven coroutines** (Swoole/FrankenPHP): Single process handles many concurrent requests via coroutine switching. Memory efficiency is high but requires non-blocking I/O for all operations.
- [ ] **Throughput**: 3-15x vs PHP-FPM depending on workload. Sub-50ms endpoints see largest gains.
- [ ] **Memory**: Higher baseline but lower per-request allocation overhead. Baseline 30-80MB per worker.
- [ ] **Complexity**: Requires service provider auditing, static property elimination, connection pooling.
- [ ] **Compatibility**: Some packages (relying on per-request state) require modification.
- [ ] Document and follow through on architectural decision: Whether to migrate from FPM to memory-resident
- [ ] Document and follow through on architectural decision: Which memory-resident runtime to select
- [ ] Ensure architecture aligns with core concept: **Boot-once**: Framework bootstrap (service container, config loading, routing registration) happens once at worker start.
- [ ] Ensure architecture aligns with core concept: **Handle-many**: Each incoming request is dispatched to an already-booted application instance.
- [ ] Ensure architecture aligns with core concept: **State persistence risk**: Static properties, singletons, and global state persist across requests, requiring explicit management.
- [ ] Ensure architecture aligns with core concept: **Memory overhead**: Each worker consumes 30-80MB baseline memory â€” FPM pays per-request, memory-resident pays continuously.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Profile bootstrap cost first**: If framework bootstrap is <20% of total request time, Octane gains will be modest. Measure before migrating.
- [ ] **Audit service providers**: Static properties, singletons, and deferred providers must be reviewed for cross-request state leaks.
- [ ] **Use connection pooling**: Database and Redis connections must be managed across requests â€” Octane provides built-in pooling.
- [ ] **Set max_requests for recycling**: Even in memory-resident mode, recycle workers after 1000-5000 requests to prevent memory drift.
- [ ] Profile the application to measure bootstrap time â€” if <20% of request time, migration benefit is minimal
- [ ] Audit all service providers: ensure no request-scoped singletons â€” change to scoped() bindings
- [ ] Audit all static properties: grep for "static $" â€” refactor to instance properties or container bindings
- [ ] Select target runtime: RoadRunner for default, Swoole for high-latency I/O, FrankenPHP for simplicity
- [ ] Install the runtime and configure Octane (if Laravel): `composer require laravel/octane` then `php artisan octane:install`
- [ ] Configure worker count, max_requests, and connection pooling for the selected runtime
- [ ] Run a 24-hour soak test with production-representative traffic â€” monitor RSS growth every hour
- [ ] If RSS grows >10% per hour, investigate memory leaks and adjust max_requests for more frequent recycling
- [ ] Deploy using blue-green strategy with parallel FPM deployment for instant rollback
- [ ] Monitor production for 48 hours: track RSS, request latency, error rate, and connection pool usage

# Performance Checklist (from 04/06)
- [ ] Shared-nothing (FPM)
- [ ] Memory-resident (Octane)
- [ ] JIT compilation
- [ ] OpCache

# Security Checklist (from 04/06 - only if relevant)
- [ ] Static properties persisting across requests can leak user data between requests
- [ ] Connection pooling requires careful handling of authentication context
- [ ] Memory-resident workers retain residual memory â€” sensitive data may persist until overwritten
- [ ] Regular worker recycling (pm.max_requests equivalent) mitigates data leakage

# Reliability Checklist (from 04/05/06)
- [ ] **Deadlock**: PHP-FPM workers deadlocked on shared resource (file lock, database connection pool). Symptom: active workers plateau at max_children, no requests complete. Mitigation: Set request_terminate_timeout to kill stuck workers.
- [ ] **Memory exhaustion**: PHP worker exceeds memory_limit. Symptom: PHP Fatal error "Allowed memory size exhausted". Mitigation: Increase limit or optimize memory usage. Root cause analysis via memory profiler.
- [ ] **File descriptor exhaustion**: OpCache or PHP worker runs out of file descriptors. Symptom: "Too many open files" errors. Mitigation: Increase ulimit -n in systemd service file.
- [ ] **PHP version lifecycle**: Always run a supported PHP version (currently 8.1+). Each minor version brings 5-15% performance improvement. Upgrade within 3 months of release.
- [ ] **Configuration audit**: Check memory_limit, max_execution_time, max_input_vars, ealpath_cache_size are tuned for your application. Defaults are conservative.
- [ ] **Error handling**: display_errors=Off, log_errors=On, error_reporting=E_ALL. Never show errors to users.

# Testing Checklist (from 04/06)
- [ ] Bootstrap cost measured and confirmed >20% of request time
- [ ] All service providers audited for static property usage
- [ ] Static properties and singletons reviewed for cross-request state leaks
- [ ] Connection pooling configured for database and Redis
- [ ] Worker recycling configured (max_requests = 1000-5000)
- [ ] Deployment pipeline handles graceful worker reload
- [ ] Before/after benchmark confirms expected throughput gain
- [ ] Memory-resident architecture deployed with stable RSS over 24+ hours
- [ ] Throughput improvement meets or exceeds projections
- [ ] No data leakage between requests detected
- [ ] Rollback capability maintained for at least 2 weeks
- [ ] Team can operate and troubleshoot the new runtime independently
- [ ] Bootstrap time measured and confirmed >20% of request time
- [ ] All service providers audited (no request-scoped singletons)
- [ ] All static properties refactored or confirmed safe
- [ ] 24-hour soak test passed with stable RSS
- [ ] Rollback plan in place with parallel FPM deployment
- [ ] Team trained on runtime operations and debugging

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Profile bootstrap cost first**: If framework bootstrap is <20% of total request time, Octane gains will be modest. Measure before migrating.
- [ ] **Audit service providers**: Static properties, singletons, and deferred providers must be reviewed for cross-request state leaks.
- [ ] **Use connection pooling**: Database and Redis connections must be managed across requests â€” Octane provides built-in pooling.
- [ ] **Set max_requests for recycling**: Even in memory-resident mode, recycle workers after 1000-5000 requests to prevent memory drift.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Migrating without state audit
- [ ] Avoid: Expecting gains on slow endpoints
- [ ] Avoid: No worker recycling
- [ ] Avoid: Improper connection management
- [ ] Avoid anti-pattern: **Expecting drop-in replacement**: Memory-resident architectures require significant code auditing. Many Laravel packages break without modification.
- [ ] Avoid anti-pattern: **Migrating the entire application at once**: Start with a single endpoint or service. Validate behavior before expanding.
- [ ] Avoid anti-pattern: **Ignoring deployment differences**: Memory-resident workers need graceful reload for code changes. Plan deployment pipeline accordingly.
- [ ] Guard against anti-pattern: Expecting Drop-In Replacement (No State Audit)
- [ ] Guard against anti-pattern: Migrating Without Profiling Bootstrap Proportion
- [ ] Guard against anti-pattern: No Worker Recycling (Memory Drift)
- [ ] Guard against anti-pattern: Improper Connection Management
- [ ] Guard against anti-pattern: Expecting Gains on Slow Endpoints
- [ ] All service providers audited for static property usage
- [ ] All singletons reviewed for request-scoped cached data

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **PHP version lifecycle**: Always run a supported PHP version (currently 8.1+). Each minor version brings 5-15% performance improvement. Upgrade within 3 months of release.
- [ ] **Configuration audit**: Check memory_limit, max_execution_time, max_input_vars, ealpath_cache_size are tuned for your application. Defaults are conservative.
- [ ] **Error handling**: display_errors=Off, log_errors=On, error_reporting=E_ALL. Never show errors to users.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Boot-once**: Framework bootstrap (service container, config loading, routing registration) happens once at worker start., **Handle-many**: Each incoming request is dispatched to an already-booted application instance., **State persistence risk**: Static properties, singletons, and global state persist across requests, requiring explicit management., **Memory overhead**: Each worker consumes 30-80MB baseline memory â€” FPM pays per-request, memory-resident pays continuously.
**Rules:**
- General: Deploy with Graceful Worker Reload
**Skills:** Octane Architecture and Execution Model, Service Provider Optimization, State Management and Leak Prevention, Worker Configuration by Driver
**Decision Trees:** Whether to migrate from FPM to memory-resident, Which memory-resident runtime to select
**Anti-Patterns:** Expecting Drop-In Replacement (No State Audit), Migrating Without Profiling Bootstrap Proportion, No Worker Recycling (Memory Drift), Improper Connection Management, Expecting Gains on Slow Endpoints
**Related Topics:** Shared-Nothing Architecture, Concurrency Models, Laravel Octane Architecture, Swoole Architecture, RoadRunner Architecture, FrankenPHP Worker Mode

