# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Monitoring Octane Status â€” php artisan octane:status, octane:profile-memory
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Run `php artisan octane:status` and verify all workers show expected count and status.
- [ ] Configure health check endpoint (`/octane/health`) and verify it returns correct worker state.
- [ ] Add health check to load balancer configuration.
- [ ] Set up monitoring alerts for: worker count drops, RSS >150% of expected, worker crash events in logs.
- [ ] Add worker PID to log context for all log channels.
- [ ] Health check endpoint operational and integrated with load balancer
- [ ] Worker PID included in all log entries for correlation
- [ ] `octane:status` collected every 60s with metrics in monitoring system
- [ ] RSS baseline established and alerting on anomalies (>150% threshold)
- [ ] Worker recycling frequency monitored and within expected range
- [ ] Worker crashes detected within 60 seconds and alerted
- [ ] APM tool showing Octane-specific metrics and distributed traces
- [ ] Log aggregation dashboards enable per-worker debugging
- [ ] Alert thresholds tuned and actionable
- [ ] Operations team trained on Octane monitoring runbook
- [ ] /octane/health endpoint registered and returning correct worker state
- [ ] Health check endpoint is lightweight (no database queries)
- [ ] Worker PID added to all log entries via Log::shareContext()
- [ ] octane:status runs on schedule (every minute) with metrics collected
- [ ] RSS baseline established and alert thresholds configured (150%, 200%)

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **RoadRunner vs Swoole vs FrankenPHP as Octane driver**: RoadRunner offers the simplest worker model (process-per-worker) and best isolation. Swoole provides coroutine-based concurrency for I/O-bound workloads. FrankenPHP is easiest to deploy (single binary). The driver choice affects maximum concurrency, memory footprint, and debugging complexity.
- [ ] **Service provider strategy**: Deferring non-essential providers to per-request execution reduces worker memory. Boot essential providers once, defer expensive ones. Audit all providers for request-scoped singletons.
- [ ] **Health check endpoint**: Configure `/octane/health` returning `{ "status": "ok", "workers": 4, "active_requests": 2, "uptime_seconds": 3600 }`. Use in load balancer health checks. Worker crashes are detected when health check fails.
- [ ] **Metrics collection strategy**: Collect at three levels: 1) Application metrics (OctaneStatus facade in code), 2) System metrics (RSS per PID via Prometheus node exporter), 3) APM traces (request duration, database query time).
- [ ] **Alerting thresholds**: Worker count drops below expected â†’ critical alert. Any worker RSS >150% of average â†’ warning. Any worker with >10k requests without recycling â†’ warning.
- [ ] **Log aggregation**: Forward Laravel logs with Octane worker context (PID, request ID) to a centralized logging system (ELK, Datadog, Grafana Loki).
- [ ] Document and follow through on architectural decision: Octane metrics to monitor
- [ ] Document and follow through on architectural decision: Alert thresholds
- [ ] Ensure architecture aligns with core concept: **octane:status**: Lists all workers with PID, status (busy/idle), request count, and uptime. Dead workers indicate crashes â€” investigate error logs.
- [ ] Ensure architecture aligns with core concept: **octane:profile-memory (Swoole)**: Shows per-worker memory breakdown. Detect workers with RSS significantly above the average â€” a leak indicator.
- [ ] Ensure architecture aligns with core concept: **Log monitoring**: Octane logs worker events (start, stop, crash) to Laravel's log. Monitor for `Worker stopped` with non-zero exit codes.
- [ ] Ensure architecture aligns with core concept: **APM integration**: Octane works with Tideways, Blackfire, and New Relic. Ensure distributed tracing works across Octane workers to identify slow endpoints.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Follow single responsibility principle
- [ ] Use constructor property promotion where applicable

# Performance Checklist (from 04/06)
- [ ] `octane:status` is a near-zero-cost command â€” safe to run frequently.
- [ ] `octane:profile-memory` has moderate overhead on Swoole â€” avoid running more than once per minute.
- [ ] Health check endpoint should be lightweight â€” avoid database queries or expensive operations in the health check handler.
- [ ] Logging from Octane workers is asynchronous (queued) â€” high-volume logging can fill the queue. Be selective about log levels in production.
- [ ] Each worker uses 30â€“80MB RSS; monitoring should aggregate metrics across all workers for total memory usage.
- [ ] Octane vs FPM
- [ ] RoadRunner driver
- [ ] Swoole driver
- [ ] FrankenPHP driver

# Security Checklist (from 04/06 - only if relevant)
- [ ] Health check endpoints should not expose sensitive application data. Return only server status, not user data or configuration.
- [ ] `octane:status` output includes PIDs â€” restrict access to this command in production (admin-only).
- [ ] APM tools capture request payloads â€” ensure sensitive data (passwords, tokens, PII) is excluded from APM traces.
- [ ] Log aggregation systems must be secured â€” Octane worker logs may contain request details.
- [ ] Do not expose the Octane health endpoint publicly â€” restrict to internal network or VPN.

# Reliability Checklist (from 04/05/06)
- [ ] **Memory leak in long-running worker**: Service provider registers listeners on each request without cleanup. Symptom: Worker RSS grows by 1-5MB per request until OOM. Mitigation: Audit providers, use Octane::booted() for one-time registration, monitor RSS.
- [ ] **Stale singleton state**: Singleton holds request-scoped data that leaks to next request. Symptom: User A sees User B's data. Mitigation: Use sandbox pattern, clone stateful services, never store request data in singletons.
- [ ] **Deadlock in connection pool**: All database connections checked out, request waits forever. Symptom: Workers stuck, no requests complete. Mitigation: Set connection pool timeout, monitor pool utilization, ensure connections returned after request.
- [ ] **Health checks**: Configure Octane health endpoint (/octane/health). Monitor via load balancer. Alert if health check fails on any worker.
- [ ] **Graceful reload**: php artisan octane:reload Ã¢â‚¬â€ reloads workers without dropping requests. Run after every deploy.
- [ ] **State leak detection**: Monitor worker RSS growth. Increase >10% per hour indicates state leak. Set octane:watch during development to detect leaks.
- [ ] **Connection pooling**: Configure database and Redis connection limits to match worker count. Each worker maintains persistent connections.

# Testing Checklist (from 04/06)
- [ ] Run `php artisan octane:status` and verify all workers show expected count and status.
- [ ] Configure health check endpoint (`/octane/health`) and verify it returns correct worker state.
- [ ] Add health check to load balancer configuration.
- [ ] Set up monitoring alerts for: worker count drops, RSS >150% of expected, worker crash events in logs.
- [ ] Add worker PID to log context for all log channels.
- [ ] Integrate Octane metrics with APM tool (Tideways, Blackfire, or New Relic).
- [ ] Run `octane:profile-memory` (Swoole) to verify even memory distribution across workers.
- [ ] Test that `octane:reload` works and does not drop in-flight requests.
- [ ] Verify log aggregation system receives and indexes Octane worker logs.
- [ ] Review worker recycling frequency and adjust `max_requests` if needed.
- [ ] Health check endpoint operational and integrated with load balancer
- [ ] Worker PID included in all log entries for correlation
- [ ] `octane:status` collected every 60s with metrics in monitoring system
- [ ] RSS baseline established and alerting on anomalies (>150% threshold)
- [ ] Worker recycling frequency monitored and within expected range
- [ ] Worker crashes detected within 60 seconds and alerted
- [ ] APM tool showing Octane-specific metrics and distributed traces
- [ ] Log aggregation dashboards enable per-worker debugging
- [ ] Alert thresholds tuned and actionable
- [ ] Operations team trained on Octane monitoring runbook
- [ ] /octane/health endpoint registered and returning correct worker state
- [ ] Health check endpoint is lightweight (no database queries)
- [ ] Worker PID added to all log entries via Log::shareContext()
- [ ] octane:status runs on schedule (every minute) with metrics collected
- [ ] RSS baseline established and alert thresholds configured (150%, 200%)
- [ ] Worker recycling frequency monitored with alerts for anomalies
- [ ] Worker crash alerts configured (count drop, health check failures, exit codes)
- [ ] APM tool integrated with Octane distributed tracing
- [ ] Log aggregation dashboards created with worker PID filters
- [ ] Alert thresholds reviewed and tuned based on observed patterns
- [ ] Monitoring configuration documented for operations team

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Not monitoring Octane workers in production
- [ ] Avoid: Ignoring `octane:profile-memory` until OOM
- [ ] Avoid: Heavy health check endpoint
- [ ] Avoid: Not correlating logs with worker PIDs
- [ ] Avoid anti-pattern: **Monitoring only at the process level**: System-level monitoring (CPU, memory) is necessary but insufficient. You need application-level metrics (request count per worker, recycling frequency) to detect leaks before they cause system issues.
- [ ] Avoid anti-pattern: **Setting `max_requests` too low to avoid leaks**: If you set `max_requests` to a very low value (e.g., 100), you lose most of Octane's performance advantage. Fix the root cause instead.
- [ ] Avoid anti-pattern: **Relying only on `octane:status`**: `octane:status` shows worker state at a point in time but does not detect data integrity issues (state leaks). You need explicit data-integrity tests.
- [ ] Avoid anti-pattern: **Running `octane:profile-memory` in production on a schedule**: On Swoole, this command has overhead. Run it on-demand when investigating suspected leaks, not as a continuous monitor.
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
**Core Concepts:** **octane:status**: Lists all workers with PID, status (busy/idle), request count, and uptime. Dead workers indicate crashes â€” investigate error logs., **octane:profile-memory (Swoole)**: Shows per-worker memory breakdown. Detect workers with RSS significantly above the average â€” a leak indicator., **Log monitoring**: Octane logs worker events (start, stop, crash) to Laravel's log. Monitor for `Worker stopped` with non-zero exit codes., **APM integration**: Octane works with Tideways, Blackfire, and New Relic. Ensure distributed tracing works across Octane workers to identify slow endpoints.
**Decision Trees:** Octane metrics to monitor, Alert thresholds
**Anti-Patterns:** Application State Leaking Across Requests, Not Configuring max_requests for Worker Recycling, Database Connection Pool Exhaustion, Running Queue Workers Inside Octane, Not Using Octane Table for Cross-Worker State
**Related Topics:** Worker Configuration by Driver, State Management and Leak Prevention, FPM Status Page vs Octane Status, Profiling and Observability, Performance Gain Estimation

