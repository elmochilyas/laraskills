# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** # Octane RoadRunner Server â€” Go-Based Application Server, Goridge Binary Protocol
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Run `php artisan octane:start --server=roadrunner` and verify the server starts without errors.
- [ ] Check worker status: `rr workers -i` â€” all workers should show "ready" state.
- [ ] Verify graceful reload: `php artisan octane:reload` â€” observe workers recycling one at a time.
- [ ] Load test: `wrk -t4 -c100 -d30s http://localhost:8080/` and verify throughput and error rate.
- [ ] Monitor worker RSS over time â€” no more than 10% growth per 1000 requests.
- [ ] RoadRunner configured and running with correct worker pool parameters
- [ ] All workers healthy and processing requests
- [ ] RPC interface secured to localhost only
- [ ] Supervisor manages `rr` process with auto-restart
- [ ] Graceful reload (`octane:reload`) works with zero dropped requests
- [ ] Worker count validated against memory budget and connection limits
- [ ] Monitoring in place for worker RSS, listen queue, and `rr` process health
- [ ] Worker crash and `rr` crash scenarios handled automatically
- [ ] Deployment runbook includes RoadRunner-specific commands and procedures
- [ ] `rr` binary installed and runs `php artisan octane:start --server=roadrunner`
- [ ] `.rr.yaml` configured with num_workers, max_jobs, allocate_timeout, supervisor
- [ ] RPC interface bound to 127.0.0.1 only
- [ ] Supervisor/systemd configured to manage `rr` process
- [ ] Worker count tuned based on 24-48 hour monitoring data
- [ ] max_jobs calibrated based on RSS growth rate

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Worker pool**: RoadRunner maintains `num_workers` idle workers. When a request arrives, it picks an idle worker, sends the request via Goridge, waits for the response, and returns the worker to the pool.
- [ ] **Goridge protocol flow**: Go sends `{\"context\": {...}, \"body\": \"...\"}` â†’ PHP worker reads from stdin â†’ processes â†’ writes response to stdout â†’ Go reads and sends HTTP response.
- [ ] **Graceful shutdown**: Sending `SIGTERM` to `rr` tells workers to finish their current request then exit. New requests are routed to remaining workers. Once all workers drain, the process exits.
- [ ] **RPC server**: RoadRunner exposes an RPC server (default `tcp://127.0.0.1:6001`) for administrative commands: `rr reset`, `rr workers`, `rr status`, `rr http:reset`.
- [ ] **Supervisor integration**: Use Supervisor to manage the `rr` binary itself. RoadRunner manages its own worker pool internally â€” Supervisor's role is to restart the Go process if it crashes.
- [ ] **Environment propagation**: Environment variables set in `.rr.yaml` or the system environment are passed to PHP workers. Use this for configuration that varies across environments.
- [ ] Document and follow through on architectural decision: Running Octane with RoadRunner driver
- [ ] Ensure architecture aligns with core concept: **Go process supervisor**: The `rr` binary manages the entire lifecycle â€” worker spawning, health checks, graceful shutdown, and process recycling.
- [ ] Ensure architecture aligns with core concept: **Goridge protocol**: Binary protocol over TCP or stdio pipes. Encodes/decodes PHP values (arrays, strings, integers) between Go and PHP with minimal overhead. Uses byte-level framing for message boundaries.
- [ ] Ensure architecture aligns with core concept: **`.rr.yaml` configuration**: Single YAML file defines server command, HTTP address, worker pool settings, RPC listeners, and plugin configuration.
- [ ] Ensure architecture aligns with core concept: **Worker pool semantics**: `num_workers` defines the baseline worker count. The supervisor maintains this pool, restarting workers that fail or exceed `max_jobs`.
- [ ] Ensure architecture aligns with core concept: **Process isolation**: Each worker is a separate OS process. A crash in one worker does not affect others. Memory leaks are contained within the individual worker process.
- [ ] Ensure architecture aligns with core concept: **Plugin ecosystem**: RoadRunner ships with plugins for gRPC, queues (RabbitMQ, SQS, Beanstalk), WebSocket (Centrifugo), Temporal, metrics (Prometheus), and more.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Follow single responsibility principle
- [ ] Use constructor property promotion where applicable

# Performance Checklist (from 04/06)
- [ ] RoadRunner achieves 41â€“111% throughput improvement over PHP-FPM in benchmarks. The gain is most significant for API endpoints with <50ms response times.
- [ ] Each PHP worker uses 30â€“80MB RSS. Total memory = `num_workers` Ã— per-worker RSS + Go binary baseline (~30MB).
- [ ] Workers maintain persistent database and Redis connections. Total connections = `num_workers` Ã— connections-per-worker. Budget carefully against database `max_connections`.
- [ ] Goridge protocol adds ~0.1â€“0.5ms per request compared to embedded SAPI (FrankenPHP) but offers better process isolation.
- [ ] Go goroutine scheduler handles thousands of concurrent connections efficiently, even with minimal I/O wait.
- [ ] The Go binary itself is stable and does not leak memory. All memory concerns apply to PHP workers.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] RoadRunner workers run as separate OS processes. A crash or compromise in one worker does not affect others.
- [ ] The RPC server should not be exposed publicly. Bind to `127.0.0.1` only.
- [ ] Worker processes inherit environment variables from the `rr` process. Do not store secrets in `.rr.yaml` â€” use environment variables or secret management.
- [ ] File permissions: The `rr` binary and `.rr.yaml` should be readable only by the deploying user.
- [ ] Process isolation: PHP workers cannot access each other's memory. State leaks are contained within a single worker process.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Run `php artisan octane:start --server=roadrunner` and verify the server starts without errors.
- [ ] Check worker status: `rr workers -i` â€” all workers should show "ready" state.
- [ ] Verify graceful reload: `php artisan octane:reload` â€” observe workers recycling one at a time.
- [ ] Load test: `wrk -t4 -c100 -d30s http://localhost:8080/` and verify throughput and error rate.
- [ ] Monitor worker RSS over time â€” no more than 10% growth per 1000 requests.
- [ ] Verify health check: `curl http://localhost:8080/octane/health` returns 200.
- [ ] Test RPC security: `nc -zv 127.0.0.1 6001` works; `nc -zv <public_ip> 6001` should be blocked.
- [ ] Verify database connection budget: workers * connections-per-request < database max_connections.
- [ ] Test `SIGTERM` graceful shutdown: kill the `rr` process and verify in-flight requests complete.
- [ ] Document the `.rr.yaml` configuration and deployment procedure.
- [ ] RoadRunner configured and running with correct worker pool parameters
- [ ] All workers healthy and processing requests
- [ ] RPC interface secured to localhost only
- [ ] Supervisor manages `rr` process with auto-restart
- [ ] Graceful reload (`octane:reload`) works with zero dropped requests
- [ ] Worker count validated against memory budget and connection limits
- [ ] Monitoring in place for worker RSS, listen queue, and `rr` process health
- [ ] Worker crash and `rr` crash scenarios handled automatically
- [ ] Deployment runbook includes RoadRunner-specific commands and procedures
- [ ] `rr` binary installed and runs `php artisan octane:start --server=roadrunner`
- [ ] `.rr.yaml` configured with num_workers, max_jobs, allocate_timeout, supervisor
- [ ] RPC interface bound to 127.0.0.1 only
- [ ] Supervisor/systemd configured to manage `rr` process
- [ ] Worker count tuned based on 24-48 hour monitoring data
- [ ] max_jobs calibrated based on RSS growth rate
- [ ] `php artisan octane:reload` works without dropping requests
- [ ] Worker crash test passed (RoadRunner replaces crashed worker)
- [ ] `rr` crash test passed (Supervisor restarts `rr`)
- [ ] Monitoring configured for worker RSS, listen queue, and `rr` process health
- [ ] Firewall blocks external RPC access
- [ ] Database connection budget validated against worker count
- [ ] Deployment runbook includes RoadRunner-specific procedures

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Setting `num_workers` equal to CPU cores for I/O-bound apps
- [ ] Avoid: Not setting `max_jobs` (or setting to 0)
- [ ] Avoid: Forgetting to configure `supervisor.max_workers`
- [ ] Avoid: Exposing RPC port to the network
- [ ] Avoid anti-pattern: **Using RoadRunner without Octane**: While possible, RoadRunner is designed for Spiral Framework. Octane provides the Laravel integration layer that handles service container bootstrapping, sandbox management, and state leak prevention.
- [ ] Avoid anti-pattern: **Setting `num_workers` too high**: Workers are persistent and each holds database connections. 100 workers Ã— 2 DB connections = 200 DB connections, potentially exceeding database limits.
- [ ] Avoid anti-pattern: **Not configuring process supervision**: If the `rr` binary crashes, all workers go down. Always run `rr` under Supervisor or a container orchestrator.
- [ ] Avoid anti-pattern: **Mixing RoadRunner and FPM environments**: The same codebase may behave differently. Test Octane configuration in a dedicated environment.
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
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Go process supervisor**: The `rr` binary manages the entire lifecycle â€” worker spawning, health checks, graceful shutdown, and process recycling., **Goridge protocol**: Binary protocol over TCP or stdio pipes. Encodes/decodes PHP values (arrays, strings, integers) between Go and PHP with minimal overhead. Uses byte-level framing for message boundaries., **`.rr.yaml` configuration**: Single YAML file defines server command, HTTP address, worker pool settings, RPC listeners, and plugin configuration., **Worker pool semantics**: `num_workers` defines the baseline worker count. The supervisor maintains this pool, restarting workers that fail or exceed `max_jobs`., **Process isolation**: Each worker is a separate OS process. A crash in one worker does not affect others. Memory leaks are contained within the individual worker process.
**Decision Trees:** Running Octane with RoadRunner driver
**Anti-Patterns:** Application State Leaking Across Requests, Not Configuring max_requests for Worker Recycling, Database Connection Pool Exhaustion, Running Queue Workers Inside Octane, Not Using Octane Table for Cross-Worker State
**Related Topics:** Octane Architecture and Execution Model, Driver Selection Comparison â€” RoadRunner vs Swoole vs FrankenPHP, Worker Configuration by Driver, Connection Pooling Strategies, FPM-to-Octane Migration

