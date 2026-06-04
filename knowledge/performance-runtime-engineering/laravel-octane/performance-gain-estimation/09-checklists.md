# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Performance Gain Estimation Methodology â€” 2.5-3.1x Mixed to 15-20x API Workloads
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Measure, don't guess**: Profile an empty endpoint and a real endpoint. Compute bootstrap proportion. Apply formula.
- [ ] **Use Amdahl's Law**: Octane speeds up only the bootstrap portion. The I/O-bound portion remains unchanged. Benchmark to validate.
- [ ] **Consider concurrent request patterns**: Gains are highest under concurrent load, not single-request latency.
- [ ] **Account for worker overhead**: Each Octane worker consumes 30-80MB RSS. Total gain depends on available memory for worker count.
- [ ] **Estimation process**: 1) Profile empty endpoint = bootstrap, 2) Profile real endpoint = total, 3) Compute bootstrap proportion, 4) Apply speedup formula, 5) Cross-check with published benchmarks.
- [ ] Bootstrap proportion measured (empty endpoint vs real endpoint)
- [ ] Speedup formula applied with measured values
- [ ] I/O-bound proportion assessed to set realistic expectations
- [ ] Pre-migration benchmark completed (PHP-FPM baseline)
- [ ] Concurrent load test planned for post-migration comparison
- [ ] Bootstrap proportion measured with statistical confidence (10+ samples, median reported)
- [ ] Theoretical speedup calculated correctly using Amdahl's Law
- [ ] Resource constraints (memory, connections, CPU) factored into final estimate
- [ ] Gain categorized and documented with clear migration recommendation
- [ ] Post-migration actual gain measured and compared to estimate with variance <30%
- [ ] Estimation methodology refined based on post-migration validation
- [ ] Team has data-driven basis for migration decision (migrate, defer, or skip)
- [ ] Bootstrap time measured from empty endpoint (10+ samples, median)
- [ ] Production-representative endpoint measured (10+ samples, median)
- [ ] Bootstrap proportion calculated correctly

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **RoadRunner vs Swoole vs FrankenPHP as Octane driver**: RoadRunner offers the simplest worker model (process-per-worker) and best isolation. Swoole provides coroutine-based concurrency for I/O-bound workloads. FrankenPHP is easiest to deploy (single binary). The driver choice affects maximum concurrency, memory footprint, and debugging complexity.
- [ ] **Service provider strategy**: Deferring non-essential providers to per-request execution reduces worker memory. Boot essential providers once, defer expensive ones. Audit all providers for request-scoped singletons.
- [ ] **Bootstrap dominance**: For API endpoints returning in <50ms, bootstrap accounts for 60-80% of total time. Octane's gain is highest here.
- [ ] **I/O-bound limits**: If 80% of request time is database queries, maximum theoretical gain is 1/(1-0.2) = 1.25x. Optimize queries first.
- [ ] **Worker scaling**: More workers = more concurrency = more throughput, up to memory or connection pool limits. Each worker adds ~50MB RSS.
- [ ] Document and follow through on architectural decision: Estimating Octane throughput gain
- [ ] Ensure architecture aligns with core concept: **Gain formula**: `speedup = 1 / (1 - bootstrap_proportion)`. If bootstrap is 80% of request time, speedup = 1/(1-0.8) = 5x. If bootstrap is 10%, speedup = 1/(1-0.1) = 1.11x.
- [ ] Ensure architecture aligns with core concept: **Bootstrap measurement**: Profile a request that does minimal work (empty controller, return 200). Time = bootstrap. Full request time = bootstrap + I/O + computation.
- [ ] Ensure architecture aligns with core concept: **I/O impact**: Octane does not make I/O faster â€” database queries take the same time. Octane eliminates the CPU time spent on bootstrap.
- [ ] Ensure architecture aligns with core concept: **Concurrent request scaling**: Octane workers handle requests sequentially within each worker but concurrently across workers. Worker count matters.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Measure, don't guess**: Profile an empty endpoint and a real endpoint. Compute bootstrap proportion. Apply formula.
- [ ] **Use Amdahl's Law**: Octane speeds up only the bootstrap portion. The I/O-bound portion remains unchanged. Benchmark to validate.
- [ ] **Consider concurrent request patterns**: Gains are highest under concurrent load, not single-request latency.
- [ ] **Account for worker overhead**: Each Octane worker consumes 30-80MB RSS. Total gain depends on available memory for worker count.
- [ ] **Estimation process**: 1) Profile empty endpoint = bootstrap, 2) Profile real endpoint = total, 3) Compute bootstrap proportion, 4) Apply speedup formula, 5) Cross-check with published benchmarks.

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
- [ ] Higher throughput means more requests per second hitting the database â€” ensure connection pool limits are respected
- [ ] More workers = more concurrent database connections. Plan for max_connections Ã— workers â‰¤ database max_connections

# Reliability Checklist (from 04/05/06)
- [ ] **Memory leak in long-running worker**: Service provider registers listeners on each request without cleanup. Symptom: Worker RSS grows by 1-5MB per request until OOM. Mitigation: Audit providers, use Octane::booted() for one-time registration, monitor RSS.
- [ ] **Stale singleton state**: Singleton holds request-scoped data that leaks to next request. Symptom: User A sees User B's data. Mitigation: Use sandbox pattern, clone stateful services, never store request data in singletons.
- [ ] **Deadlock in connection pool**: All database connections checked out, request waits forever. Symptom: Workers stuck, no requests complete. Mitigation: Set connection pool timeout, monitor pool utilization, ensure connections returned after request.
- [ ] **Health checks**: Configure Octane health endpoint (/octane/health). Monitor via load balancer. Alert if health check fails on any worker.
- [ ] **Graceful reload**: php artisan octane:reload Ã¢â‚¬â€ reloads workers without dropping requests. Run after every deploy.
- [ ] **State leak detection**: Monitor worker RSS growth. Increase >10% per hour indicates state leak. Set octane:watch during development to detect leaks.
- [ ] **Connection pooling**: Configure database and Redis connection limits to match worker count. Each worker maintains persistent connections.

# Testing Checklist (from 04/06)
- [ ] Bootstrap proportion measured (empty endpoint vs real endpoint)
- [ ] Speedup formula applied with measured values
- [ ] I/O-bound proportion assessed to set realistic expectations
- [ ] Pre-migration benchmark completed (PHP-FPM baseline)
- [ ] Concurrent load test planned for post-migration comparison
- [ ] Memory and connection pool limits calculated for worker count
- [ ] Bootstrap proportion measured with statistical confidence (10+ samples, median reported)
- [ ] Theoretical speedup calculated correctly using Amdahl's Law
- [ ] Resource constraints (memory, connections, CPU) factored into final estimate
- [ ] Gain categorized and documented with clear migration recommendation
- [ ] Post-migration actual gain measured and compared to estimate with variance <30%
- [ ] Estimation methodology refined based on post-migration validation
- [ ] Team has data-driven basis for migration decision (migrate, defer, or skip)
- [ ] Bootstrap time measured from empty endpoint (10+ samples, median)
- [ ] Production-representative endpoint measured (10+ samples, median)
- [ ] Bootstrap proportion calculated correctly
- [ ] Amdahl's Law applied: `1 / (1 - bootstrap_proportion)`
- [ ] Resource constraints accounted: memory, connections, CPU
- [ ] Concurrent load multiplier applied for realistic estimate
- [ ] Gain categorized as High/Moderate/Low with recommendation
- [ ] Pre-migration PHP-FPM benchmark completed for post-migration comparison
- [ ] Post-migration actual gain measured and variance calculated
- [ ] Estimation methodology refined based on actual vs estimated variance

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Measure, don't guess**: Profile an empty endpoint and a real endpoint. Compute bootstrap proportion. Apply formula.
- [ ] **Use Amdahl's Law**: Octane speeds up only the bootstrap portion. The I/O-bound portion remains unchanged. Benchmark to validate.
- [ ] **Consider concurrent request patterns**: Gains are highest under concurrent load, not single-request latency.
- [ ] **Account for worker overhead**: Each Octane worker consumes 30-80MB RSS. Total gain depends on available memory for worker count.
- [ ] **Estimation process**: 1) Profile empty endpoint = bootstrap, 2) Profile real endpoint = total, 3) Compute bootstrap proportion, 4) Apply speedup formula, 5) Cross-check with published benchmarks.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Expecting Octane to speed up database queries
- [ ] Avoid: Guessing bootstrap proportion without profiling
- [ ] Avoid: Ignoring concurrent request scaling
- [ ] Avoid: Applying Amdahl's Law without measuring I/O portion
- [ ] Avoid anti-pattern: **Benchmarking Octane with hello-world endpoints**: Hello-world shows maximum theoretical gain (bootstrap = 100% of time, so 15-20x). Real applications have lower gains.
- [ ] Avoid anti-pattern: **Assuming gain is linear with workers**: Double the workers = double the throughput only until memory or connection pool is exhausted.
- [ ] Avoid anti-pattern: **Migrating to Octane without baseline benchmarks**: Without before/after measurements, you can't quantify the improvement. Always benchmark FPM first.
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
**Core Concepts:** **Gain formula**: `speedup = 1 / (1 - bootstrap_proportion)`. If bootstrap is 80% of request time, speedup = 1/(1-0.8) = 5x. If bootstrap is 10%, speedup = 1/(1-0.1) = 1.11x., **Bootstrap measurement**: Profile a request that does minimal work (empty controller, return 200). Time = bootstrap. Full request time = bootstrap + I/O + computation., **I/O impact**: Octane does not make I/O faster â€” database queries take the same time. Octane eliminates the CPU time spent on bootstrap., **Concurrent request scaling**: Octane workers handle requests sequentially within each worker but concurrently across workers. Worker count matters.
**Decision Trees:** Estimating Octane throughput gain
**Anti-Patterns:** Application State Leaking Across Requests, Not Configuring max_requests for Worker Recycling, Database Connection Pool Exhaustion, Running Queue Workers Inside Octane, Not Using Octane Table for Cross-Worker State
**Related Topics:** Octane Architecture and Execution Model, Driver Selection Comparison, Bottleneck Optimization Strategy, Benchmarking Methodology

