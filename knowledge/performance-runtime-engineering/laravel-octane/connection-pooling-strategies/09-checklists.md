# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Connection Pooling Strategies â€” Database, Redis Across Workers
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Calculate total persistent connections: `worker_count Ã— connections_per_worker` and ensure database `max_connections` has 20% headroom.
- [ ] Verify that all custom query code properly commits or rolls back transactions (no open transactions at request boundary).
- [ ] Configure connection pool timeouts in database configuration for all environments.
- [ ] Set up monitoring alerts for database connection utilization exceeding 80%.
- [ ] Test with `php artisan octane:status` to verify worker health after connection configuration changes.
- [ ] Total persistent connections within 80% of database max_connections
- [ ] Connection timeouts configured and verified (workers return 503 on pool exhaustion)
- [ ] Read/write splitting configured and routing correctly
- [ ] All transaction code uses try/catch/finally for proper commit/rollback
- [ ] Connection utilization monitoring alerts at 60% (warning) and 80% (critical)
- [ ] Load test confirms connections plateau at calculated budget
- [ ] Connection exhaustion scenario handled gracefully (no application hang)
- [ ] Connection budget documented with rationale for capacity planning
- [ ] All persistent connections per worker enumerated
- [ ] Total connection budget calculated: `worker_count Ã— connections_per_worker`
- [ ] Budget within 80% of database max_connections: `total â‰¤ max_connections Ã— 0.8`
- [ ] Read/write splitting configured (read replicas for SELECT, primary for writes)
- [ ] Connection timeouts configured (PDO::ATTR_TIMEOUT = 5s or equivalent)
- [ ] All transaction handling uses try/catch/finally with commit/rollback
- [ ] Connection utilization monitoring configured at 60% warning, 80% critical

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **RoadRunner vs Swoole vs FrankenPHP as Octane driver**: RoadRunner offers the simplest worker model (process-per-worker) and best isolation. Swoole provides coroutine-based concurrency for I/O-bound workloads. FrankenPHP is easiest to deploy (single binary). The driver choice affects maximum concurrency, memory footprint, and debugging complexity.
- [ ] **Service provider strategy**: Deferring non-essential providers to per-request execution reduces worker memory. Boot essential providers once, defer expensive ones. Audit all providers for request-scoped singletons.
- [ ] **Connection pool health monitoring**: Track database connection count per worker. Alert when utilization exceeds 80% of `max_connections`.
- [ ] **Read/write splitting architecture**: Use separate read replicas for read queries to avoid exhausting write-primary connection pool. Configure `config/database.php` with `read` and `write` hosts.
- [ ] **Graceful degradation**: When connection pool is exhausted, implement queue-based fallback or return a 503 with Retry-After header instead of letting workers hang.
- [ ] **Per-driver considerations**: RoadRunner (process-per-worker) has the simplest connection model. Swoole coroutines can share connections across coroutines within the same worker, reducing total connection count. FrankenPHP follows the same model as RoadRunner.
- [ ] Document and follow through on architectural decision: Database connection pooling in Octane
- [ ] Ensure architecture aligns with core concept: **Persistent connections in Octane**: Octane creates connections at worker start. Each request within the same worker reuses the same PDO/Redis connection â€” no TCP handshake per request.
- [ ] Ensure architecture aligns with core concept: **Transaction safety**: Octane resets connections after each request (rolls back open transactions, releases locks). Framework handles this automatically, but custom queries outside Eloquent may bypass the reset.
- [ ] Ensure architecture aligns with core concept: **Connection budgeting**: `worker_count Ã— connections_per_worker = database_max_connections Ã— 0.8`. With 8 workers and 3 connections each (MySQL + Redis + HTTP), you need 24 DB connections.
- [ ] Ensure architecture aligns with core concept: **Read/write splitting**: Separate read and write connections. Read replicas serve more concurrent queries without exhausting the write-primary connection pool.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Follow single responsibility principle
- [ ] Use constructor property promotion where applicable

# Performance Checklist (from 04/06)
- [ ] Octane delivers 2.5â€“20x throughput over PHP-FPM; API endpoints with <50ms response see biggest gains.
- [ ] Each worker uses 30â€“80MB RSS; total memory = workers Ã— per-worker memory.
- [ ] Each worker maintains persistent DB/Redis connections; total = workers Ã— connections-per-worker.
- [ ] Under Octane, database queries become primary bottleneck (bootstrap is eliminated).
- [ ] OpCache preloading further reduces cold-start latency by 2â€“5ms per worker.
- [ ] Connection establishment overhead saved: ~0.5â€“2ms per request per connection.
- [ ] Octane vs FPM
- [ ] RoadRunner driver
- [ ] Swoole driver
- [ ] FrankenPHP driver

# Security Checklist (from 04/06 - only if relevant)
- [ ] Transaction leakage can expose data from one request to another. Octane's sandbox reset handles this, but always verify custom queries properly commit or rollback.
- [ ] Connection pooling does not authenticate per-request â€” authentication happens at worker start. Ensure the database user has minimal required privileges.
- [ ] Monitor for connection exhaustion attacks â€” when all connections are consumed, new requests cannot reach the database. Use connection pool limits and connection timeouts as guardrails.

# Reliability Checklist (from 04/05/06)
- [ ] **Memory leak in long-running worker**: Service provider registers listeners on each request without cleanup. Symptom: Worker RSS grows by 1-5MB per request until OOM. Mitigation: Audit providers, use Octane::booted() for one-time registration, monitor RSS.
- [ ] **Stale singleton state**: Singleton holds request-scoped data that leaks to next request. Symptom: User A sees User B's data. Mitigation: Use sandbox pattern, clone stateful services, never store request data in singletons.
- [ ] **Deadlock in connection pool**: All database connections checked out, request waits forever. Symptom: Workers stuck, no requests complete. Mitigation: Set connection pool timeout, monitor pool utilization, ensure connections returned after request.
- [ ] **Health checks**: Configure Octane health endpoint (/octane/health). Monitor via load balancer. Alert if health check fails on any worker.
- [ ] **Graceful reload**: php artisan octane:reload Ã¢â‚¬â€ reloads workers without dropping requests. Run after every deploy.
- [ ] **State leak detection**: Monitor worker RSS growth. Increase >10% per hour indicates state leak. Set octane:watch during development to detect leaks.
- [ ] **Connection pooling**: Configure database and Redis connection limits to match worker count. Each worker maintains persistent connections.

# Testing Checklist (from 04/06)
- [ ] Calculate total persistent connections: `worker_count Ã— connections_per_worker` and ensure database `max_connections` has 20% headroom.
- [ ] Verify that all custom query code properly commits or rolls back transactions (no open transactions at request boundary).
- [ ] Configure connection pool timeouts in database configuration for all environments.
- [ ] Set up monitoring alerts for database connection utilization exceeding 80%.
- [ ] Test with `php artisan octane:status` to verify worker health after connection configuration changes.
- [ ] Verify read/write splitting configuration routes SELECT queries to read replicas.
- [ ] Run load test to confirm connection count does not exceed database limits under peak traffic.
- [ ] Total persistent connections within 80% of database max_connections
- [ ] Connection timeouts configured and verified (workers return 503 on pool exhaustion)
- [ ] Read/write splitting configured and routing correctly
- [ ] All transaction code uses try/catch/finally for proper commit/rollback
- [ ] Connection utilization monitoring alerts at 60% (warning) and 80% (critical)
- [ ] Load test confirms connections plateau at calculated budget
- [ ] Connection exhaustion scenario handled gracefully (no application hang)
- [ ] Connection budget documented with rationale for capacity planning
- [ ] All persistent connections per worker enumerated
- [ ] Total connection budget calculated: `worker_count Ã— connections_per_worker`
- [ ] Budget within 80% of database max_connections: `total â‰¤ max_connections Ã— 0.8`
- [ ] Read/write splitting configured (read replicas for SELECT, primary for writes)
- [ ] Connection timeouts configured (PDO::ATTR_TIMEOUT = 5s or equivalent)
- [ ] All transaction handling uses try/catch/finally with commit/rollback
- [ ] Connection utilization monitoring configured at 60% warning, 80% critical
- [ ] Connection exhaustion test passes (503 returned, workers don't hang)
- [ ] Connection budget documented for capacity planning

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Octane + transactions across requests
- [ ] Avoid: Underestimating connection count
- [ ] Avoid: No connection pool timeout
- [ ] Avoid anti-pattern: **Single shared connection across all workers**: Using one database connection for all workers creates a bottleneck and eliminates the benefit of persistent connections. Each worker should maintain its own connection pool.
- [ ] Avoid anti-pattern: **Opening new connections per request inside Octane**: Defeats the purpose of Octane's persistent worker model. Always use the framework's connection resolver, which returns the worker's persistent connection.
- [ ] Avoid anti-pattern: **Ignoring transaction state across requests**: Assuming the connection is clean for each request without verifying. Custom raw queries (DB::statement, PDO direct) can leave uncommitted transactions.
- [ ] Guard against anti-pattern: Application State Leaking Across Requests
- [ ] Guard against anti-pattern: Not Configuring max_requests for Worker Recycling
- [ ] Guard against anti-pattern: Database Connection Pool Exhaustion
- [ ] Guard against anti-pattern: Running Queue Workers Inside Octane
- [ ] Guard against anti-pattern: Not Using Octane Table for Cross-Worker State
- [ ] No static state
- [ ] Container resets per request
- [ ] Concurrent request tests pass

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
**Core Concepts:** **Persistent connections in Octane**: Octane creates connections at worker start. Each request within the same worker reuses the same PDO/Redis connection â€” no TCP handshake per request., **Transaction safety**: Octane resets connections after each request (rolls back open transactions, releases locks). Framework handles this automatically, but custom queries outside Eloquent may bypass the reset., **Connection budgeting**: `worker_count Ã— connections_per_worker = database_max_connections Ã— 0.8`. With 8 workers and 3 connections each (MySQL + Redis + HTTP), you need 24 DB connections., **Read/write splitting**: Separate read and write connections. Read replicas serve more concurrent queries without exhausting the write-primary connection pool.
**Decision Trees:** Database connection pooling in Octane
**Anti-Patterns:** Application State Leaking Across Requests, Not Configuring max_requests for Worker Recycling, Database Connection Pool Exhaustion, Running Queue Workers Inside Octane, Not Using Octane Table for Cross-Worker State
**Related Topics:** State Management and Leak Prevention, Worker Configuration by Driver, Capacity Planning Safety Margins, Database Query Optimization, Redis Connection Management

