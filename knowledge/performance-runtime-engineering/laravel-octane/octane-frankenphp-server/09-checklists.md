# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** # Octane FrankenPHP Server â€” Caddy Module, Embedded PHP, Worker Mode
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Run `./frankenphp run --config Caddyfile` and verify the server starts without errors.
- [ ] Verify worker mode is active: check logs for "worker mode enabled" message.
- [ ] Test HTTPS certificate: `curl -I https://localhost:443` â€” verify valid TLS certificate.
- [ ] Load test: `wrk -t4 -c100 -d30s http://localhost:8080/` and verify throughput.
- [ ] Monitor thread memory: observe RSS stability over 1000+ requests.
- [ ] FrankenPHP running in worker mode with correct thread pool configuration
- [ ] GOMEMLIMIT set and verified (no container OOM kills under load)
- [ ] Thread recycling configured (max_requests) and verified
- [ ] Binary secured with non-root user and minimal capabilities
- [ ] Graceful reload (USR2) works with zero dropped requests
- [ ] Health check endpoint responding
- [ ] 103 Early Hints delivering Link headers for supported pages
- [ ] ACME HTTPS certificate provisioned and auto-renewing
- [ ] Thread RSS stable over 24 hours (<10% growth)
- [ ] Container deployment working with official FrankenPHP base image
- [ ] FrankenPHP starts in worker mode (check logs for "worker mode enabled")
- [ ] Caddyfile configured with correct root, php_server, worker block, and file_server
- [ ] Thread pool sized: num_threads = CPU cores, max_threads = 1.5-2Ã— cores
- [ ] max_requests configured (1000 default, tuned based on RSS growth)
- [ ] GOMEMLIMIT set to 80% of container memory limit

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Caddy module**: FrankenPHP registers as a Caddy module (`php_server` directive). Caddy handles HTTP/2, HTTP/3, TLS termination, and static file serving. FrankenPHP handles PHP execution.
- [ ] **Thread pool**: The pool maintains `num_threads` idle threads. When a request arrives, it's dispatched to an idle thread. If all threads are busy, the request waits in a queue.
- [ ] **Request lifecycle**: Caddy receives HTTP request â†’ passes to FrankenPHP module â†’ picks idle thread â†’ thread calls `php_request_startup()` â†’ executes PHP â†’ calls `php_request_shutdown()` â†’ thread returns to pool.
- [ ] **Zend String caching**: FrankenPHP caches `$_SERVER` keys as persistent `zend_string` allocations, reducing per-request string duplication overhead.
- [ ] **Graceful reload**: Sending `USR2` signal to FrankenPHP forces threads to recycle after completing their current request. New threads boot with updated code.
- [ ] **Container orchestration**: In Kubernetes, configure liveness/readiness probes against FrankenPHP's health endpoint. The single-binary model simplifies container image building.
- [ ] Document and follow through on architectural decision: Running Octane with FrankenPHP driver
- [ ] Ensure architecture aligns with core concept: **Single binary**: FrankenPHP compiles PHP, Caddy, and the Go runtime into one executable. No separate PHP-FPM, Nginx, or PHP installation needed.
- [ ] Ensure architecture aligns with core concept: **Custom SAPI**: `frankenphp_sapi_module` implements the full PHP request lifecycle â€” `php_module_startup()`, `php_request_startup()`, `php_request_shutdown()` â€” all within the Go process.
- [ ] Ensure architecture aligns with core concept: **CGO bridge**: Go calls C PHP functions directly via CGO. PHP memory is pinned via Go's `runtime.Pinner` to prevent GC from moving C-accessible pointers.
- [ ] Ensure architecture aligns with core concept: **Worker mode**: PHP code runs in persistent threads. The thread pool maintains idle workers in a "ready" state, picking requests from a shared queue.
- [ ] Ensure architecture aligns with core concept: **Thread state machine**: `Reserved â†’ Booting â†’ Inactive â†’ Ready â†’ Done`. Threads transition through states during startup, request handling, and recycling.
- [ ] Ensure architecture aligns with core concept: **Caddyfile configuration**: Uses `php_server` directive and `worker` block for FrankenPHP-specific settings within Caddy's configuration format.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Follow single responsibility principle
- [ ] Use constructor property promotion where applicable

# Performance Checklist (from 04/06)
- [ ] Worker mode achieves 3â€“5Ã— throughput over PHP-FPM. API endpoints with <50ms response times see the largest gains.
- [ ] Thread-per-request model: each thread handles one request at a time. No coroutine overhead.
- [ ] CGO boundary crossing adds ~5â€“10% overhead over RoadRunner in some benchmarks. The gap is expected to narrow in future releases.
- [ ] Thread memory: each PHP thread uses 20â€“60MB RSS. Total memory = threads Ã— per-thread RSS + Go runtime (~20MB).
- [ ] Thread state transitions (Reserved â†’ Ready) take ~2â€“5s for Laravel bootstrap. Pool warming should be part of startup sequence.
- [ ] 103 Early Hints: sends `Link` headers before the full response, allowing the browser to preload assets. Improves LCP by 100â€“300ms.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] Thread-local state: PHP threads run in the same process. A PHP crash in one thread can potentially affect the entire process. Process-level isolation is weaker than RoadRunner.
- [ ] Automatic HTTPS via ACME: Caddy handles certificate provisioning and renewal automatically. Ensure ACME ports (80/443) are accessible from the internet.
- [ ] File permissions: The single binary should be owned by a non-root user in production. Caddy can bind to privileged ports via `setcap`.
- [ ] Thread safety: All PHP extensions must be ZTS-compatible. Non-ZTS extensions can cause segfaults or memory corruption in threaded environments.
- [ ] Container security: Run FrankenPHP with `--read-only` root filesystem and `--cap-drop=ALL` for defense in depth.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Run `./frankenphp run --config Caddyfile` and verify the server starts without errors.
- [ ] Verify worker mode is active: check logs for "worker mode enabled" message.
- [ ] Test HTTPS certificate: `curl -I https://localhost:443` â€” verify valid TLS certificate.
- [ ] Load test: `wrk -t4 -c100 -d30s http://localhost:8080/` and verify throughput.
- [ ] Monitor thread memory: observe RSS stability over 1000+ requests.
- [ ] Verify graceful reload: send `USR2` signal and observe thread recycling.
- [ ] Test 103 Early Hints: `curl -I https://localhost/` â€” verify `Link` headers are sent.
- [ ] Verify container OOM protection: `GOMEMLIMIT=128MiB ./frankenphp run` under load.
- [ ] Test thread recycling: verify `max_requests` limit causes threads to recycle.
- [ ] Document the Caddyfile configuration and deployment procedure.
- [ ] FrankenPHP running in worker mode with correct thread pool configuration
- [ ] GOMEMLIMIT set and verified (no container OOM kills under load)
- [ ] Thread recycling configured (max_requests) and verified
- [ ] Binary secured with non-root user and minimal capabilities
- [ ] Graceful reload (USR2) works with zero dropped requests
- [ ] Health check endpoint responding
- [ ] 103 Early Hints delivering Link headers for supported pages
- [ ] ACME HTTPS certificate provisioned and auto-renewing
- [ ] Thread RSS stable over 24 hours (<10% growth)
- [ ] Container deployment working with official FrankenPHP base image
- [ ] FrankenPHP starts in worker mode (check logs for "worker mode enabled")
- [ ] Caddyfile configured with correct root, php_server, worker block, and file_server
- [ ] Thread pool sized: num_threads = CPU cores, max_threads = 1.5-2Ã— cores
- [ ] max_requests configured (1000 default, tuned based on RSS growth)
- [ ] GOMEMLIMIT set to 80% of container memory limit
- [ ] FrankenPHP running as non-root user with minimal capabilities
- [ ] Docker container image built with official FrankenPHP base image
- [ ] Graceful reload (USR2 signal) works without dropping requests
- [ ] Health check endpoint responding correctly
- [ ] 103 Early Hints verified (Link headers sent for supported pages)
- [ ] ACME HTTPS certificate provisioned automatically
- [ ] Thread RSS growth trending stable over 24-hour observation

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Running in standard mode instead of worker mode
- [ ] Avoid: Setting `num_threads` too high
- [ ] Avoid: Not setting `GOMEMLIMIT` in containers
- [ ] Avoid: Using glibc build in Alpine containers
- [ ] Avoid: Not warming threads after deployment
- [ ] Avoid anti-pattern: **Using FrankenPHP without Octane for Laravel**: FrankenPHP can run Laravel without Octane (via standard `php_server`), but you lose worker mode and sandbox management. Always use Octane with worker mode for Laravel.
- [ ] Avoid anti-pattern: **Running FrankenPHP as root**: The single binary does not need root. Use a non-root user with `setcap` for privileged port binding.
- [ ] Avoid anti-pattern: **Assuming thread safety means all PHP code is safe**: PHP userland code is thread-safe by design, but extensions and some pattens (global state, static properties) can cause race conditions.
- [ ] Avoid anti-pattern: **Mixing FrankenPHP with external PHP-FPM**: Either use FrankenPHP's embedded PHP or external FPM, not both. Using both defeats the purpose of the single-binary model.
- [ ] Guard against anti-pattern: Application State Leaking Across Requests
- [ ] Guard against anti-pattern: Not Configuring max_requests for Worker Recycling
- [ ] Guard against anti-pattern: Database Connection Pool Exhaustion
- [ ] Guard against anti-pattern: Running Queue Workers Inside Octane
- [ ] Guard against anti-pattern: Not Using Octane Table for Cross-Worker State

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
**Core Concepts:** **Single binary**: FrankenPHP compiles PHP, Caddy, and the Go runtime into one executable. No separate PHP-FPM, Nginx, or PHP installation needed., **Custom SAPI**: `frankenphp_sapi_module` implements the full PHP request lifecycle â€” `php_module_startup()`, `php_request_startup()`, `php_request_shutdown()` â€” all within the Go process., **CGO bridge**: Go calls C PHP functions directly via CGO. PHP memory is pinned via Go's `runtime.Pinner` to prevent GC from moving C-accessible pointers., **Worker mode**: PHP code runs in persistent threads. The thread pool maintains idle workers in a "ready" state, picking requests from a shared queue., **Thread state machine**: `Reserved â†’ Booting â†’ Inactive â†’ Ready â†’ Done`. Threads transition through states during startup, request handling, and recycling.
**Decision Trees:** Running Octane with FrankenPHP driver
**Anti-Patterns:** Application State Leaking Across Requests, Not Configuring max_requests for Worker Recycling, Database Connection Pool Exhaustion, Running Queue Workers Inside Octane, Not Using Octane Table for Cross-Worker State
**Related Topics:** Octane Architecture and Execution Model, Driver Selection Comparison â€” RoadRunner vs Swoole vs FrankenPHP, Worker Configuration by Driver, Container Memory Management for Octane, FPM-to-Octane Migration

