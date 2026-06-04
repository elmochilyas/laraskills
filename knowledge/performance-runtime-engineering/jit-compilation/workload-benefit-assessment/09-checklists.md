# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** JIT Compilation
**Knowledge Unit:** JIT Workload Benefit Assessment â€” 0-5% I/O-Bound vs 61-95% CPU-Bound
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **JIT assessment checklist**: Profile a representative request, calculate CPU-time ratio (PHP execution / total wall time), if >30% enable JIT and benchmark. Compare p50 and p95 pre/post.
- [ ] **Benchmark specific endpoints**: Different endpoints have different CPU-bound proportions. Measure the most critical few, not just the average.
- [ ] **Include background jobs**: Cron tasks, queue workers, and batch processing are often more CPU-bound than web requests. Don't assess only web traffic.
- [ ] **Use sampling profilers**: Xdebug adds 50-200% overhead, distorting CPU-time measurement. Use sampling profilers (Blackfire, Tideways, SPX) for accurate assessment.
- [ ] **Reassess after changes**: Application changes affect CPU-bound proportion. Re-run the assessment after major feature releases or framework upgrades.
- [ ] Representative request profiled (CPU vs I/O time)
- [ ] CPU-bound proportion calculated
- [ ] JIT enabled if CPU > 15% (or universally)
- [ ] Before/after benchmark completed
- [ ] Background workloads included in assessment
- [ ] Workload CPU-bound proportion accurately measured
- [ ] JIT benefit quantified with before/after benchmark
- [ ] Assessment documented with profiling data
- [ ] Decision made: prioritize JIT tuning, enable with defaults, or confirm minimal impact
- [ ] PHP execution vs I/O wait measured
- [ ] Execution type characterized (computation, object-heavy, mixed)
- [ ] Baseline benchmark without JIT completed
- [ ] Benchmark with tracing JIT completed
- [ ] JIT benefit quantified as percentage improvement
- [ ] Decision documented: enable, keep enabled, or prioritize tuning

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Tracing vs Function JIT**: Tracing JIT optimizes hot loop paths, ideal for templating, data processing, and iterative algorithms. Function JIT optimizes entire functions, better for method-heavy code with predictable call patterns (ORMs, domain logic). When memory is constrained, Function JIT produces less fragmentation.
- [ ] **JIT buffer sizing**: 64MB minimum, 128MB default, 256MB for large applications. Buffer too small causes frequent compilation of the same hot paths. Buffer too large wastes virtual memory (not physical until used). Monitor jit_buffer_size and jit_buffer_free via opcache_get_status().
- [ ] **CPU-Time Ratio Formula**: CPU_time / (CPU_time + I/O_wait_time) = CPU-bound proportion. I/O wait time = total wall time - CPU time - network latency.
- [ ] **Typical Ratios**: Laravel CRUD API: 20-40% CPU-bound (framework bootstrap + template rendering). Image processing: 80-95% CPU-bound. Static page: <10% CPU-bound.
- [ ] **JIT Break-Even**: Below 15% CPU-bound, JIT overhead (compilation, buffer management) exceeds benefit. Above 30%, JIT provides meaningful gains.
- [ ] **Workload Mix Impact**: Even if average API request is I/O-bound, specific endpoints (report generation, data export) may benefit significantly.
- [ ] Document and follow through on architectural decision: Whether JIT will benefit a specific workload
- [ ] Document and follow through on architectural decision: How to measure JIT impact before/after
- [ ] Ensure architecture aligns with core concept: **CPU-Bound Proportion**: Time spent in PHP opcode execution / total request time. Template rendering, data transformation, encryption, image processing are CPU-bound.
- [ ] Ensure architecture aligns with core concept: **I/O-Bound Proportion**: Time waiting for external resources. Database queries, HTTP API calls, file reads, session storage are I/O-bound.
- [ ] Ensure architecture aligns with core concept: **Break-Even Point**: JIT becomes net-positive when CPU-bound time > ~15% of total request time (including JIT compilation overhead).
- [ ] Ensure architecture aligns with core concept: **Workload Categories**: API endpoints (mixed), cron jobs (often CPU-bound), queue workers (mixed), report generation (CPU-bound), static page serving (I/O-bound).

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **JIT assessment checklist**: Profile a representative request, calculate CPU-time ratio (PHP execution / total wall time), if >30% enable JIT and benchmark. Compare p50 and p95 pre/post.
- [ ] **Benchmark specific endpoints**: Different endpoints have different CPU-bound proportions. Measure the most critical few, not just the average.
- [ ] **Include background jobs**: Cron tasks, queue workers, and batch processing are often more CPU-bound than web requests. Don't assess only web traffic.
- [ ] **Use sampling profilers**: Xdebug adds 50-200% overhead, distorting CPU-time measurement. Use sampling profilers (Blackfire, Tideways, SPX) for accurate assessment.
- [ ] **Reassess after changes**: Application changes affect CPU-bound proportion. Re-run the assessment after major feature releases or framework upgrades.
- [ ] Profile the workload to determine PHP execution time as a percentage of total wall time
- [ ] If PHP execution <20% of wall time: JIT benefit is minimal (0-5%) â€” proceed to step 8 to confirm
- [ ] If PHP execution 20-50%: moderate JIT benefit potential (5-20%)
- [ ] If PHP execution >50%: high JIT benefit potential (20-95%)
- [ ] Characterize the PHP execution type: computation-heavy (algorithms, data processing), object-heavy (framework bootstrap), or mixed
- [ ] Disable JIT and run a benchmark to establish baseline
- [ ] Enable tracing JIT (1254) and re-run the same benchmark
- [ ] Compare throughput and latency â€” if improvement >5%, JIT is beneficial for this workload
- [ ] If improvement is <5% but the workload runs on background workers (queue, cron), still enable JIT â€” improvement compounds over thousands of executions
- [ ] Document the assessment results for future reference

# Performance Checklist (from 04/06)
- [ ] JIT enabled universally is harmless (0-2% overhead on I/O-bound paths) and beneficial for cron/queue/batch workloads
- [ ] CPU-bound example: Image processing pipeline â†’ 80% throughput increase with JIT
- [ ] I/O-bound example: Standard CRUD API with 200ms DB queries â†’ 3-5% throughput increase with JIT
- [ ] Break-even point: JIT becomes net-positive when CPU-bound time > ~15%
- [ ] JIT enabled
- [ ] Tracing mode
- [ ] Function mode
- [ ] Large buffer (256MB)

# Security Checklist (from 04/06 - only if relevant)
- [ ] Review for security implications of implementation choices
- [ ] Validate input boundaries and type safety

# Reliability Checklist (from 04/05/06)
- [ ] **JIT buffer exhaustion**: Buffer utilization reaches 100%. Symptom: JIT compilation stalls, hot paths revert to interpreter. Mitigation: Increase jit_buffer_size, monitor jit_buffer_free.
- [ ] **Segfault on native code execution**: JIT produces incorrect native code (rare, fixed in updates). Symptom: PHP-FPM worker crashes with SIGSEGV. Mitigation: Disable JIT, upgrade PHP, file bug report.
- [ ] **Compilation pause spikes**: JIT compilation during request causes latency spikes. Symptom: Occasional p99 latency spikes (10-100ms). Mitigation: Use less aggressive JIT mode (1254 vs 1235), increase trigger thresholds.
- [ ] **Type guard failures**: Incorrect type guard elimination causes wrong computation results. Symptom: Silent data corruption in JIT-compiled code. Mitigation: Keep PHP updated, report as PHP bug.
- [ ] **Enable JIT gradually**: Start with opcache.jit=1255 (tracing, default optimization) and 128MB buffer. Monitor for increased memory and compilation pauses.
- [ ] **Warm-up period**: JIT requires 1000-10000 requests to reach peak performance. Generate production traffic after deploy before measuring JIT impact.
- [ ] **Memory commitment**: JIT buffer is committed as virtual memory Ã¢â‚¬â€ ensure swap is configured if buffer is large.
- [ ] **Monitoring**: Check opcache_get_status()['jit'] for uffer_size, uffer_free. If buffer utilization > 80%, increase jit_buffer_size.

# Testing Checklist (from 04/06)
- [ ] Representative request profiled (CPU vs I/O time)
- [ ] CPU-bound proportion calculated
- [ ] JIT enabled if CPU > 15% (or universally)
- [ ] Before/after benchmark completed
- [ ] Background workloads included in assessment
- [ ] Sampling profiler used (not Xdebug)
- [ ] Assessment re-run after significant application changes
- [ ] Workload CPU-bound proportion accurately measured
- [ ] JIT benefit quantified with before/after benchmark
- [ ] Assessment documented with profiling data
- [ ] Decision made: prioritize JIT tuning, enable with defaults, or confirm minimal impact
- [ ] PHP execution vs I/O wait measured
- [ ] Execution type characterized (computation, object-heavy, mixed)
- [ ] Baseline benchmark without JIT completed
- [ ] Benchmark with tracing JIT completed
- [ ] JIT benefit quantified as percentage improvement
- [ ] Decision documented: enable, keep enabled, or prioritize tuning

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **JIT assessment checklist**: Profile a representative request, calculate CPU-time ratio (PHP execution / total wall time), if >30% enable JIT and benchmark. Compare p50 and p95 pre/post.
- [ ] **Benchmark specific endpoints**: Different endpoints have different CPU-bound proportions. Measure the most critical few, not just the average.
- [ ] **Include background jobs**: Cron tasks, queue workers, and batch processing are often more CPU-bound than web requests. Don't assess only web traffic.
- [ ] **Use sampling profilers**: Xdebug adds 50-200% overhead, distorting CPU-time measurement. Use sampling profilers (Blackfire, Tideways, SPX) for accurate assessment.
- [ ] **Reassess after changes**: Application changes affect CPU-bound proportion. Re-run the assessment after major feature releases or framework upgrades.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Assuming JIT helps all requests
- [ ] Avoid: Testing only web requests
- [ ] Avoid: Using Xdebug for CPU-time measurement
- [ ] Avoid: Not benchmarking after JIT enablement
- [ ] Avoid anti-pattern: **Disabling JIT because web requests don't benefit**: Background processing may see 50%+ gains. Enable JIT at the server level; individual SAPI configs can disable if needed.
- [ ] Avoid anti-pattern: **Expecting linear scaling**: JIT benefit doesn't scale linearly with CPU proportion. Other factors (cache misses, compilation overhead) affect the relationship.
- [ ] Avoid anti-pattern: **Micro-benchmarking JIT**: PHPBench JIT benchmarks (61-95% gains) represent the upper bound. Real application gains are typically 3-15% for mixed workloads.
- [ ] Guard against anti-pattern: Assuming JIT Helps All Requests Uniformly
- [ ] Guard against anti-pattern: Testing Only Web Requests for JIT Assessment
- [ ] Guard against anti-pattern: Using Xdebug for CPU-Time Measurement
- [ ] Guard against anti-pattern: Microbenchmarking JIT with Synthetic Tests
- [ ] Guard against anti-pattern: Not Reassessing After Major Application Changes
- [ ] Multiple endpoint types profiled
- [ ] JIT expectations set per workload category

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Enable JIT gradually**: Start with opcache.jit=1255 (tracing, default optimization) and 128MB buffer. Monitor for increased memory and compilation pauses.
- [ ] **Warm-up period**: JIT requires 1000-10000 requests to reach peak performance. Generate production traffic after deploy before measuring JIT impact.
- [ ] **Memory commitment**: JIT buffer is committed as virtual memory Ã¢â‚¬â€ ensure swap is configured if buffer is large.
- [ ] **Monitoring**: Check opcache_get_status()['jit'] for uffer_size, uffer_free. If buffer utilization > 80%, increase jit_buffer_size.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **CPU-Bound Proportion**: Time spent in PHP opcode execution / total request time. Template rendering, data transformation, encryption, image processing are CPU-bound., **I/O-Bound Proportion**: Time waiting for external resources. Database queries, HTTP API calls, file reads, session storage are I/O-bound., **Break-Even Point**: JIT becomes net-positive when CPU-bound time > ~15% of total request time (including JIT compilation overhead)., **Workload Categories**: API endpoints (mixed), cron jobs (often CPU-bound), queue workers (mixed), report generation (CPU-bound), static page serving (I/O-bound).
**Skills:** JIT Configuration for Production, JIT Mode Comparison, Bytecode vs Native Code Assessment, Profiling vs Monitoring
**Decision Trees:** Whether JIT will benefit a specific workload, How to measure JIT impact before/after
**Anti-Patterns:** Assuming JIT Helps All Requests Uniformly, Testing Only Web Requests for JIT Assessment, Using Xdebug for CPU-Time Measurement, Microbenchmarking JIT with Synthetic Tests, Not Reassessing After Major Application Changes
**Related Topics:** JIT Concepts and Terminology, JIT Configuration for Production, Profiling Observability, Benchmarking Methodology

