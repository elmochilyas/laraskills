# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP Engine & Version Performance
**Knowledge Unit:** Bottleneck Location Determines Optimization Strategy (CPU vs I/O vs Memory)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Diagnose before optimizing**: Measure p50 vs p95 latency gap (I/O variability), check CPU utilization during peak (CPU vs I/O bound), monitor RSS growth across requests (memory leak), profile a representative request.
- [ ] **JIT for CPU-bound, not I/O-bound**: JIT provides 61-95% gain for CPU-bound workloads but 0-5% for I/O-bound. Enable JIT universally (harmless overhead) but don't expect gains for database-heavy apps.
- [ ] **Octane for framework-bound, not CPU-bound**: Octane eliminates bootstrap overhead for fast APIs but provides minimal gain if the bottleneck is CPU computation.
- [ ] **Right-size workers, don't over-size**: More FPM workers for CPU-bound workloads degrades performance due to context switching overhead.
- [ ] CPU utilization measured during peak load to classify workload
- [ ] p50 vs p95 latency gap analyzed for I/O variability
- [ ] Worker RSS monitored for memory drift
- [ ] Representative request profiled before optimization
- [ ] Optimization selected matches bottleneck type
- [ ] Bottleneck correctly identified and classified
- [ ] Optimization produces measurable improvement (>=10% reduction in p95 latency or >=10% increase in throughput)
- [ ] No regressions introduced in other parts of the system
- [ ] Improvement sustained in production over 48-hour observation window
- [ ] Slowest endpoints identified and prioritized by user impact
- [ ] Profiling completed before optimization (baseline capture)
- [ ] Bottleneck classified as CPU, I/O, or memory-bound
- [ ] Optimization strategy matched to bottleneck type
- [ ] Before/after benchmark shows measurable improvement
- [ ] APM data confirms improvement in production within 48 hours
- [ ] No regressions in other endpoints or system metrics

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Shared-nothing architecture** (PHP-FPM): Each request is isolated in a separate OS process. Maximizes fault isolation at the cost of per-request bootstrap overhead. Best for multi-tenant hosting where isolation is prioritized.
- [ ] **Memory-resident architecture** (Octane/Swoole): Boot once, handle many. Reduces latency by 60-90% for framework-heavy applications but introduces state management complexity. Best for dedicated API servers with controlled code deployments.
- [ ] **Event-driven coroutines** (Swoole/FrankenPHP): Single process handles many concurrent requests via coroutine switching. Memory efficiency is high but requires non-blocking I/O for all operations.
- [ ] **Bottleneck diagnosis hierarchy**: 1) Measure p50 vs p95 latency gap, 2) Check CPU utilization during peak, 3) Monitor RSS growth across requests, 4) Profile a representative request.
- [ ] **Bottleneck-first approach**: Profile to find bottleneck. If CPU-bound: optimize loops, enable JIT, cache results. If I/O-bound: reduce query count, add Redis cache, implement async processing.
- [ ] Document and follow through on architectural decision: Which optimization to apply for a given bottleneck
- [ ] Document and follow through on architectural decision: Bottleneck classification from symptoms
- [ ] Ensure architecture aligns with core concept: **CPU-bound bottleneck**: Heavy computation, image processing, encryption, complex algorithms. Lever: JIT compilation, algorithmic improvements, opcode reduction.
- [ ] Ensure architecture aligns with core concept: **I/O-bound bottleneck**: Database queries, HTTP API calls, file reads, network waits. Lever: Coroutines (Swoole), persistent workers (Octane), connection pooling, caching.
- [ ] Ensure architecture aligns with core concept: **Memory-bound bottleneck**: Large object graphs, data set processing, memory leaks. Lever: GC tuning, memory_limit, OpCache sizing, pm.max_requests.
- [ ] Ensure architecture aligns with core concept: **Framework overhead bottleneck**: Bootstrap cost dominating fast requests. Lever: Octane/persistent workers, preloading, Composer optimization.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Diagnose before optimizing**: Measure p50 vs p95 latency gap (I/O variability), check CPU utilization during peak (CPU vs I/O bound), monitor RSS growth across requests (memory leak), profile a representative request.
- [ ] **JIT for CPU-bound, not I/O-bound**: JIT provides 61-95% gain for CPU-bound workloads but 0-5% for I/O-bound. Enable JIT universally (harmless overhead) but don't expect gains for database-heavy apps.
- [ ] **Octane for framework-bound, not CPU-bound**: Octane eliminates bootstrap overhead for fast APIs but provides minimal gain if the bottleneck is CPU computation.
- [ ] **Right-size workers, don't over-size**: More FPM workers for CPU-bound workloads degrades performance due to context switching overhead.
- [ ] Identify the slowest endpoints from APM data â€” sort by p95 latency Ã— request frequency (biggest user impact first)
- [ ] Profile the candidate endpoint in isolation using triggered profiling (X-Blackfire-Profile header)
- [ ] Analyze the call graph to determine where wall time is spent: bootstrap, framework, database, external API, or rendering
- [ ] Classify the bottleneck type: CPU-bound (computation, loops), I/O-bound (database, network), or memory-bound (allocation, GC)
- [ ] Apply the appropriate optimization strategy: OpCache/preloading for bootstrap, query optimization for database, caching for external APIs, algorithm improvement for CPU
- [ ] Implement the fix in a staging environment and re-profile to confirm improvement
- [ ] Run a before/after benchmark comparison using the methodology from the benchmark skill
- [ ] If improvement meets target (e.g., p95 latency reduced by 20%), deploy to production
- [ ] Monitor APM data for 24-48 hours post-deployment to confirm improvement holds under real traffic
- [ ] Document the bottleneck, analysis, fix, and improvement metrics

# Performance Checklist (from 04/06)
- [ ] Shared-nothing (FPM)
- [ ] Memory-resident (Octane)
- [ ] JIT compilation
- [ ] OpCache

# Security Checklist (from 04/06 - only if relevant)
- [ ] Bottleneck misclassification can lead to wrong optimization investments, creating security debt
- [ ] Performance optimizations (e.g., disabling validate_timestamps) have security implications
- [ ] Always verify that security controls are not the bottleneck before changing them

# Reliability Checklist (from 04/05/06)
- [ ] **Deadlock**: PHP-FPM workers deadlocked on shared resource (file lock, database connection pool). Symptom: active workers plateau at max_children, no requests complete. Mitigation: Set request_terminate_timeout to kill stuck workers.
- [ ] **Memory exhaustion**: PHP worker exceeds memory_limit. Symptom: PHP Fatal error "Allowed memory size exhausted". Mitigation: Increase limit or optimize memory usage. Root cause analysis via memory profiler.
- [ ] **File descriptor exhaustion**: OpCache or PHP worker runs out of file descriptors. Symptom: "Too many open files" errors. Mitigation: Increase ulimit -n in systemd service file.
- [ ] **PHP version lifecycle**: Always run a supported PHP version (currently 8.1+). Each minor version brings 5-15% performance improvement. Upgrade within 3 months of release.
- [ ] **Configuration audit**: Check memory_limit, max_execution_time, max_input_vars, ealpath_cache_size are tuned for your application. Defaults are conservative.
- [ ] **Error handling**: display_errors=Off, log_errors=On, error_reporting=E_ALL. Never show errors to users.

# Testing Checklist (from 04/06)
- [ ] CPU utilization measured during peak load to classify workload
- [ ] p50 vs p95 latency gap analyzed for I/O variability
- [ ] Worker RSS monitored for memory drift
- [ ] Representative request profiled before optimization
- [ ] Optimization selected matches bottleneck type
- [ ] Before/after measurement confirms improvement
- [ ] Bottleneck correctly identified and classified
- [ ] Optimization produces measurable improvement (>=10% reduction in p95 latency or >=10% increase in throughput)
- [ ] No regressions introduced in other parts of the system
- [ ] Improvement sustained in production over 48-hour observation window
- [ ] Slowest endpoints identified and prioritized by user impact
- [ ] Profiling completed before optimization (baseline capture)
- [ ] Bottleneck classified as CPU, I/O, or memory-bound
- [ ] Optimization strategy matched to bottleneck type
- [ ] Before/after benchmark shows measurable improvement
- [ ] APM data confirms improvement in production within 48 hours
- [ ] No regressions in other endpoints or system metrics

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Diagnose before optimizing**: Measure p50 vs p95 latency gap (I/O variability), check CPU utilization during peak (CPU vs I/O bound), monitor RSS growth across requests (memory leak), profile a representative request.
- [ ] **JIT for CPU-bound, not I/O-bound**: JIT provides 61-95% gain for CPU-bound workloads but 0-5% for I/O-bound. Enable JIT universally (harmless overhead) but don't expect gains for database-heavy apps.
- [ ] **Octane for framework-bound, not CPU-bound**: Octane eliminates bootstrap overhead for fast APIs but provides minimal gain if the bottleneck is CPU computation.
- [ ] **Right-size workers, don't over-size**: More FPM workers for CPU-bound workloads degrades performance due to context switching overhead.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Enabling JIT for I/O-bound app
- [ ] Avoid: Migrating to Octane for CPU-bound app
- [ ] Avoid: Increasing workers for CPU-bound workload
- [ ] Avoid: Tuning OpCache when bottleneck is I/O
- [ ] Avoid anti-pattern: **Applying the same optimization to every bottleneck**: Each bottleneck type requires a different lever. JIT won't fix I/O, and Octane won't fix CPU.
- [ ] Avoid anti-pattern: **Optimizing without measurement**: Guessing the bottleneck leads to wasted effort. Always profile first.
- [ ] Avoid anti-pattern: **Chasing the easy optimization**: OpCache tuning is easy but irrelevant if the bottleneck is database queries. Prioritize by impact, not convenience.
- [ ] Guard against anti-pattern: Optimizing Without Profiling Data (Guessing)
- [ ] Guard against anti-pattern: Premature Optimization at Architecture Level
- [ ] Guard against anti-pattern: Single-Threaded Optimization in I/O-Bound Systems
- [ ] Guard against anti-pattern: Ignoring the Bottleneck Hierarchy (Wrong Layer)
- [ ] Guard against anti-pattern: Local Optimization That Worsens Global Performance
- [ ] Profiling data exists for the optimized code path
- [ ] Optimization targets correspond to profiled hot spots (>10% inclusive time)

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
**Core Concepts:** **CPU-bound bottleneck**: Heavy computation, image processing, encryption, complex algorithms. Lever: JIT compilation, algorithmic improvements, opcode reduction., **I/O-bound bottleneck**: Database queries, HTTP API calls, file reads, network waits. Lever: Coroutines (Swoole), persistent workers (Octane), connection pooling, caching., **Memory-bound bottleneck**: Large object graphs, data set processing, memory leaks. Lever: GC tuning, memory_limit, OpCache sizing, pm.max_requests., **Framework overhead bottleneck**: Bootstrap cost dominating fast requests. Lever: Octane/persistent workers, preloading, Composer optimization.
**Rules:**
- General: Fix Obvious Bottlenecks Before Classifying
**Skills:** Flame Graph Generation and Interpretation, Slow Query Identification, JIT Workload Benefit Assessment
**Decision Trees:** Which optimization to apply for a given bottleneck, Bottleneck classification from symptoms
**Anti-Patterns:** Optimizing Without Profiling Data (Guessing), Premature Optimization at Architecture Level, Single-Threaded Optimization in I/O-Bound Systems, Ignoring the Bottleneck Hierarchy (Wrong Layer), Local Optimization That Worsens Global Performance
**Related Topics:** Profiling vs Monitoring, JIT Workload Benefit Assessment, Engine Version Performance Deltas, CPU vs I/O Bound Worker Ratios, Profiling Tools Comparison

