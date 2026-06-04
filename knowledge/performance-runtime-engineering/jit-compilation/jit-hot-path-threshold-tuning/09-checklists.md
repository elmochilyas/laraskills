# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** JIT Compilation
**Knowledge Unit:** JIT Hot Path Threshold Tuning â€” jit_hot_loop, jit_hot_func, and Trigger Configuration
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Lower thresholds for hot paths**: If profiling shows specific loops/functions dominate execution time, lower thresholds to compile them faster.
- [ ] **Raise thresholds for memory conservation**: Higher thresholds reduce the number of compiled functions, saving JIT buffer space.
- [ ] **Profile trigger counters**: Check opcache_get_status()['jit'] to see how many functions are crossing triggers. If count is very high, thresholds may be too low.
- [ ] **Match thresholds to workload**: Loop-heavy workloads benefit from lower jit_hot_loop. Function-call-heavy workloads benefit from lower jit_hot_func.
- [ ] **Pre-warm in persistent workers**: In Octane/RoadRunner/FrankenPHP, execute representative requests at startup to trigger compilation before traffic arrives.
- [ ] Default thresholds tried first (64/100)
- [ ] Workload profile analyzed (loop-heavy vs function-call-heavy)
- [ ] Thresholds adjusted based on workload if needed
- [ ] Buffer utilization monitored after threshold change
- [ ] Warm-up requests configured for latency-sensitive services
- [ ] Hot path thresholds tuned based on workload profiling data
- [ ] Before/after benchmark shows improvement or confirms no regression
- [ ] JIT buffer utilization stays within acceptable range after tuning
- [ ] Threshold configuration documented with rationale
- [ ] Current compiled function count measured
- [ ] Function call frequencies profiled
- [ ] Hot path thresholds adjusted based on workload profile
- [ ] Before/after benchmark completed
- [ ] **Enable JIT gradually**: Start with opcache.jit=1255 (tracing, default optimization) and 128MB buffer. Monitor for increased memory and compilation pauses.
- [ ] **Warm-up period**: JIT requires 1000-10000 requests to reach peak performance. Generate production traffic after deploy before measuring JIT impact.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Tracing vs Function JIT**: Tracing JIT optimizes hot loop paths, ideal for templating, data processing, and iterative algorithms. Function JIT optimizes entire functions, better for method-heavy code with predictable call patterns (ORMs, domain logic). When memory is constrained, Function JIT produces less fragmentation.
- [ ] **JIT buffer sizing**: 64MB minimum, 128MB default, 256MB for large applications. Buffer too small causes frequent compilation of the same hot paths. Buffer too large wastes virtual memory (not physical until used). Monitor jit_buffer_size and jit_buffer_free via opcache_get_status().
- [ ] **Compilation Delay**: With default thresholds (T=5), compilation is delayed by N trigger counts to collect profiling data. This means the first N executions of a hot path run in the interpreter.
- [ ] **Warm-Up Period**: In PHP-FPM with pm.max_requests=500, if jit_hot_func=100, a function called once per request needs 100 requests before it's compiled. The remaining 400 requests benefit from JIT.
- [ ] **Trigger Counter Reset**: After compilation, the trigger counter resets. If compiled code is evicted from the buffer (due to overflow), it won't be re-compiled until the counter reaches the threshold again.
- [ ] **False Positive Avoidance**: PHP 8.3+ improved trigger detection to reduce compiling cold code that happened to be in a hot trace.
- [ ] Document and follow through on architectural decision: jit_hot_loop and jit_hot_func threshold values
- [ ] Document and follow through on architectural decision: Default vs lowered thresholds per runtime
- [ ] Ensure architecture aligns with core concept: **jit_hot_loop**: Number of loop iterations before the loop body is compiled. Lower values (8-16) for loop-heavy workloads; higher (64-128) to avoid compiling loops that run infrequently.
- [ ] Ensure architecture aligns with core concept: **jit_hot_func**: Number of function calls before compilation. Lower values (20-50) for hot function optimization; higher (100-200) for conservative memory usage.
- [ ] Ensure architecture aligns with core concept: **Trigger Type (T in CRTO)**: Determines when compilation starts. T=5 (default) triggers after trigger counter reaches threshold, allowing profiling data collection before compilation.
- [ ] Ensure architecture aligns with core concept: **Trigger Counter**: Tracks how many times a candidate code segment has been encountered. Resets after compilation.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Lower thresholds for hot paths**: If profiling shows specific loops/functions dominate execution time, lower thresholds to compile them faster.
- [ ] **Raise thresholds for memory conservation**: Higher thresholds reduce the number of compiled functions, saving JIT buffer space.
- [ ] **Profile trigger counters**: Check opcache_get_status()['jit'] to see how many functions are crossing triggers. If count is very high, thresholds may be too low.
- [ ] **Match thresholds to workload**: Loop-heavy workloads benefit from lower jit_hot_loop. Function-call-heavy workloads benefit from lower jit_hot_func.
- [ ] **Pre-warm in persistent workers**: In Octane/RoadRunner/FrankenPHP, execute representative requests at startup to trigger compilation before traffic arrives.
- [ ] Profile the application to determine typical function call counts and loop iteration counts for hot paths
- [ ] Check how many functions are currently JIT-compiled: `opcache_get_status(false)['jit']['compiled_funcs']`
- [ ] If compiled_funcs is very low (<100) and the application has thousands of functions, thresholds may be too high
- [ ] Reduce jit_hot_func from 100 to 50 to trigger compilation on more functions
- [ ] Reduce jit_hot_loop from 64 to 32 to trigger compilation on shorter loops
- [ ] Monitor JIT buffer utilization â€” lower thresholds increase the number of compiled functions and buffer usage
- [ ] If buffer free drops below 20%, increase buffer size before reducing thresholds further
- [ ] Benchmark before/after threshold changes to measure the impact on throughput
- [ ] If throughput improves, keep the lower thresholds; if CPU increases due to compilation overhead, revert
- [ ] Document the selected thresholds and the profiling data that justifies them

# Performance Checklist (from 04/06)
- [ ] Lower thresholds improve steady-state throughput but increase warm-up time and compilation memory
- [ ] Higher thresholds reduce JIT memory fragmentation at the cost of missing some optimization opportunities
- [ ] PHP 8.3+ improved trigger detection to reduce false positives
- [ ] In long-running processes, thresholds primarily affect warm-up time, not steady-state performance
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
- [ ] Default thresholds tried first (64/100)
- [ ] Workload profile analyzed (loop-heavy vs function-call-heavy)
- [ ] Thresholds adjusted based on workload if needed
- [ ] Buffer utilization monitored after threshold change
- [ ] Warm-up requests configured for latency-sensitive services
- [ ] Thresholds tuned per runtime (FPM vs Octane) if applicable
- [ ] Hot path thresholds tuned based on workload profiling data
- [ ] Before/after benchmark shows improvement or confirms no regression
- [ ] JIT buffer utilization stays within acceptable range after tuning
- [ ] Threshold configuration documented with rationale
- [ ] Current compiled function count measured
- [ ] Function call frequencies profiled
- [ ] Hot path thresholds adjusted based on workload profile
- [ ] Before/after benchmark completed

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Lower thresholds for hot paths**: If profiling shows specific loops/functions dominate execution time, lower thresholds to compile them faster.
- [ ] **Raise thresholds for memory conservation**: Higher thresholds reduce the number of compiled functions, saving JIT buffer space.
- [ ] **Profile trigger counters**: Check opcache_get_status()['jit'] to see how many functions are crossing triggers. If count is very high, thresholds may be too low.
- [ ] **Match thresholds to workload**: Loop-heavy workloads benefit from lower jit_hot_loop. Function-call-heavy workloads benefit from lower jit_hot_func.
- [ ] **Pre-warm in persistent workers**: In Octane/RoadRunner/FrankenPHP, execute representative requests at startup to trigger compilation before traffic arrives.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Setting thresholds too low
- [ ] Avoid: Not accounting for pm.max_requests
- [ ] Avoid: Ignoring warm-up in latency metrics
- [ ] Avoid: Using same thresholds for all runtimes
- [ ] Avoid anti-pattern: **Tuning thresholds before buffer size**: Buffer thrashing from small buffer is more impactful than threshold tuning. Fix buffer size first.
- [ ] Avoid anti-pattern: **Expecting instant JIT benefit**: JIT needs time to identify and compile hot paths. Warm-up is inherent to the design.
- [ ] Avoid anti-pattern: **Lowering thresholds without monitoring buffer utilization**: More compiled code = more buffer pressure. Ensure buffer can accommodate.
- [ ] Guard against anti-pattern: Setting Thresholds Too Low Without Buffer Monitoring
- [ ] Guard against anti-pattern: Not Accounting for Worker Lifetime in Threshold Tuning
- [ ] Guard against anti-pattern: Expecting Instant JIT Benefit After Process Start
- [ ] Guard against anti-pattern: Tuning Thresholds Before Buffer Size
- [ ] Guard against anti-pattern: Ignoring Warm-Up in Latency Metrics
- [ ] Default thresholds tried first (64/100)
- [ ] Buffer utilization monitored before and after change

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
**Core Concepts:** **jit_hot_loop**: Number of loop iterations before the loop body is compiled. Lower values (8-16) for loop-heavy workloads; higher (64-128) to avoid compiling loops that run infrequently., **jit_hot_func**: Number of function calls before compilation. Lower values (20-50) for hot function optimization; higher (100-200) for conservative memory usage., **Trigger Type (T in CRTO)**: Determines when compilation starts. T=5 (default) triggers after trigger counter reaches threshold, allowing profiling data collection before compilation., **Trigger Counter**: Tracks how many times a candidate code segment has been encountered. Resets after compilation.
**Skills:** JIT Configuration for Production, Workload Benefit Assessment, JIT Buffer Sizing Guidelines
**Decision Trees:** jit_hot_loop and jit_hot_func threshold values, Default vs lowered thresholds per runtime
**Anti-Patterns:** Setting Thresholds Too Low Without Buffer Monitoring, Not Accounting for Worker Lifetime in Threshold Tuning, Expecting Instant JIT Benefit After Process Start, Tuning Thresholds Before Buffer Size, Ignoring Warm-Up in Latency Metrics
**Related Topics:** JIT Configuration for Production, CRTO Bitmask Reference, JIT Buffer Sizing Guidelines, JIT for Long-Running Processes

