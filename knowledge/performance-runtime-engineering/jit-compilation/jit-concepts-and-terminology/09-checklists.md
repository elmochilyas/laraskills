# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** JIT Compilation
**Knowledge Unit:** JIT Concepts and Terminology — Tracing vs Function JIT, Hot Paths, Guard Elimination
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Enable JIT universally, then benchmark**: JIT is harmless for I/O-bound workloads (0-2% overhead) and beneficial for any CPU-bound path. Enable it and measure.
- [ ] **Profile before deciding**: Measure the CPU-bound proportion of request time. If PHP execution >30% of wall time, JIT will likely help.
- [ ] **Use tracing (1254) as default**: Tracing mode is the best general-purpose setting. Switch to function mode only for function-heavy workloads.
- [ ] **Monitor buffer utilization**: If buffer usage >80%, increase jit_buffer_size. Compilation thrashing negates JIT benefits.
- [ ] JIT concepts understood (tracing, function, guard elimination, hot paths)
- [ ] OpCache enabled before JIT configuration
- [ ] Workload CPU-bound proportion assessed
- [ ] Initial JIT configuration applied (default: 1254, 128MB)
- [ ] Buffer utilization monitored after deployment
- [ ] JIT concepts (tracing, function, guard elimination, hot path, DynASM) understood by team
- [ ] OpCache confirmed as prerequisite and configured correctly
- [ ] JIT enabled with appropriate mode for the workload
- [ ] Before/after benchmark quantifies JIT benefit (or confirms minimal impact)
- [ ] Documentation created for JIT configuration rationale
- [ ] PHP version confirmed >= 8.0
- [ ] OpCache configured and hit rate >99% before JIT enablement
- [ ] CPU-bound proportion measured
- [ ] JIT enabled with tracing mode (1254) and 128MB buffer
- [ ] Before/after benchmark completed
- [ ] JIT concepts documented for the team

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Tracing vs Function JIT**: Tracing JIT optimizes hot loop paths, ideal for templating, data processing, and iterative algorithms. Function JIT optimizes entire functions, better for method-heavy code with predictable call patterns (ORMs, domain logic). When memory is constrained, Function JIT produces less fragmentation.
- [ ] **JIT buffer sizing**: 64MB minimum, 128MB default, 256MB for large applications. Buffer too small causes frequent compilation of the same hot paths. Buffer too large wastes virtual memory (not physical until used). Monitor jit_buffer_size and jit_buffer_free via opcache_get_status().
- [ ] **JIT Pipeline**: Zend opcodes â†’ SSA form â†’ IR â†’ native code via DynASM. The pipeline runs at runtime for hot code only.
- [ ] **OpCache Dependency**: JIT reads opcodes from OpCache shared memory. OpCache must be enabled and properly sized.
- [ ] **Compilation Triggers**: JIT doesn't compile everything â€” only hot code that crosses threshold counters. Cold code runs in the Zend VM.
- [ ] **Guard Failures**: When type guards fail (unexpected type), JIT bails out to the interpreter for that code path. Subsequent calls don't re-compile.
- [ ] Document and follow through on architectural decision: Whether to enable JIT for a given workload
- [ ] Document and follow through on architectural decision: Tracing vs Function JIT mode selection
- [ ] Ensure architecture aligns with core concept: **Tracing JIT (opcache.jit=1254)**: Profiles execution, identifies hot traces (loop paths), compiles trace to native code. Better for loops and iterative computation.
- [ ] Ensure architecture aligns with core concept: **Function JIT (opcache.jit=1205)**: Compiles entire functions when they cross the hot threshold. Better for function-call-heavy workloads.
- [ ] Ensure architecture aligns with core concept: **Hot Path**: Code executed frequently enough to trigger JIT compilation. Controlled by jit_hot_loop (default 64 iterations) and jit_hot_func (default 100 calls).
- [ ] Ensure architecture aligns with core concept: **Guard Elimination**: JIT removes type checks when types are inferred at compile time â€” the primary source of JIT's speedup.
- [ ] Ensure architecture aligns with core concept: **DynASM**: Dynamic assembler framework used by PHP's JIT to generate native code at runtime.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Enable JIT universally, then benchmark**: JIT is harmless for I/O-bound workloads (0-2% overhead) and beneficial for any CPU-bound path. Enable it and measure.
- [ ] **Profile before deciding**: Measure the CPU-bound proportion of request time. If PHP execution >30% of wall time, JIT will likely help.
- [ ] **Use tracing (1254) as default**: Tracing mode is the best general-purpose setting. Switch to function mode only for function-heavy workloads.
- [ ] **Monitor buffer utilization**: If buffer usage >80%, increase jit_buffer_size. Compilation thrashing negates JIT benefits.
- [ ] Verify PHP version is 8.0+ and JIT is available: `php -i | grep jit`
- [ ] Determine the workload's CPU-bound proportion from profiling data
- [ ] If CPU-bound proportion >30%, JIT will likely provide significant benefit (5-95% depending on type stability)
- [ ] If CPU-bound proportion <30%, JIT still provides 0-5% gain for web requests and significant gain for background jobs
- [ ] Enable JIT with tracing mode (opcache.jit=1254) and 128MB buffer
- [ ] Benchmark before/after enabling JIT to measure the actual impact
- [ ] For loop-heavy CPU workloads, tracing JIT (1254) provides the best results
- [ ] For function-call-heavy workloads, test function JIT (1205) as an alternative
- [ ] Document the JIT concepts relevant to the application: mode, buffer size, type stability, guard elimination

# Performance Checklist (from 04/06)
- [ ] Tracing JIT: 61-95% gain for CPU-bound code, 0-5% for I/O-bound
- [ ] JIT buffer: 128MB default, 64MB minimum, 256MB for large applications
- [ ] Compilation overhead: 50-500Âµs per hot function, amortized over thousands of calls
- [ ] PHP 8.4 JIT: ~8-10% additional gain over PHP 8.3 for CPU-bound benchmarks
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
- [ ] **Memory commitment**: JIT buffer is committed as virtual memory â€” ensure swap is configured if buffer is large.
- [ ] **Monitoring**: Check opcache_get_status()['jit'] for uffer_size, uffer_free. If buffer utilization > 80%, increase jit_buffer_size.

# Testing Checklist (from 04/06)
- [ ] JIT concepts understood (tracing, function, guard elimination, hot paths)
- [ ] OpCache enabled before JIT configuration
- [ ] Workload CPU-bound proportion assessed
- [ ] Initial JIT configuration applied (default: 1254, 128MB)
- [ ] Buffer utilization monitored after deployment
- [ ] Before/after benchmark results reviewed
- [ ] JIT concepts (tracing, function, guard elimination, hot path, DynASM) understood by team
- [ ] OpCache confirmed as prerequisite and configured correctly
- [ ] JIT enabled with appropriate mode for the workload
- [ ] Before/after benchmark quantifies JIT benefit (or confirms minimal impact)
- [ ] Documentation created for JIT configuration rationale
- [ ] PHP version confirmed >= 8.0
- [ ] OpCache configured and hit rate >99% before JIT enablement
- [ ] CPU-bound proportion measured
- [ ] JIT enabled with tracing mode (1254) and 128MB buffer
- [ ] Before/after benchmark completed
- [ ] JIT concepts documented for the team

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Enable JIT universally, then benchmark**: JIT is harmless for I/O-bound workloads (0-2% overhead) and beneficial for any CPU-bound path. Enable it and measure.
- [ ] **Profile before deciding**: Measure the CPU-bound proportion of request time. If PHP execution >30% of wall time, JIT will likely help.
- [ ] **Use tracing (1254) as default**: Tracing mode is the best general-purpose setting. Switch to function mode only for function-heavy workloads.
- [ ] **Monitor buffer utilization**: If buffer usage >80%, increase jit_buffer_size. Compilation thrashing negates JIT benefits.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Enabling JIT expecting universal speedup
- [ ] Avoid: Not enabling JIT at all
- [ ] Avoid: Confusing tracing and function modes
- [ ] Avoid: Undersized JIT buffer
- [ ] Avoid anti-pattern: **Disabling JIT because it doesn't help web requests**: JIT still benefits cron jobs, queue workers, and batch processing. Enable for all processes.
- [ ] Avoid anti-pattern: **Expecting JIT to fix I/O bottlenecks**: JIT optimizes CPU execution, not I/O wait. Fix I/O bottlenecks with better queries, caching, or concurrency.
- [ ] Avoid anti-pattern: **Tuning JIT before OpCache**: OpCache provides 2-4x throughput gain. JIT adds 0-95% on top. Prioritize OpCache configuration first.
- [ ] Guard against anti-pattern: Disabling JIT Because It Does Not Help Web Requests
- [ ] Guard against anti-pattern: Expecting JIT to Fix I/O Bottlenecks
- [ ] Guard against anti-pattern: Tuning JIT Before OpCache
- [ ] Guard against anti-pattern: Enabling JIT Without Understanding Tracing vs Function Modes
- [ ] Guard against anti-pattern: Disabling JIT Entirely Due to Marginal Web Benefit
- [ ] JIT enabled on all PHP SAPI environments
- [ ] Non-web PHP processes profiled for JIT benefit

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Enable JIT gradually**: Start with opcache.jit=1255 (tracing, default optimization) and 128MB buffer. Monitor for increased memory and compilation pauses.
- [ ] **Warm-up period**: JIT requires 1000-10000 requests to reach peak performance. Generate production traffic after deploy before measuring JIT impact.
- [ ] **Memory commitment**: JIT buffer is committed as virtual memory â€” ensure swap is configured if buffer is large.
- [ ] **Monitoring**: Check opcache_get_status()['jit'] for uffer_size, uffer_free. If buffer utilization > 80%, increase jit_buffer_size.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Tracing JIT (opcache.jit=1254)**: Profiles execution, identifies hot traces (loop paths), compiles trace to native code. Better for loops and iterative computation., **Function JIT (opcache.jit=1205)**: Compiles entire functions when they cross the hot threshold. Better for function-call-heavy workloads., **Hot Path**: Code executed frequently enough to trigger JIT compilation. Controlled by jit_hot_loop (default 64 iterations) and jit_hot_func (default 100 calls)., **Guard Elimination**: JIT removes type checks when types are inferred at compile time â€” the primary source of JIT's speedup., **DynASM**: Dynamic assembler framework used by PHP's JIT to generate native code at runtime.
**Skills:** JIT Configuration for Production, JIT Mode Comparison, Workload Benefit Assessment, Bytecode vs Native Code Assessment
**Decision Trees:** Whether to enable JIT for a given workload, Tracing vs Function JIT mode selection
**Anti-Patterns:** Disabling JIT Because It Does Not Help Web Requests, Expecting JIT to Fix I/O Bottlenecks, Tuning JIT Before OpCache, Enabling JIT Without Understanding Tracing vs Function Modes, Disabling JIT Entirely Due to Marginal Web Benefit
**Related Topics:** JIT Mode Comparison, CRTO Bitmask Reference, JIT Configuration for Production, Workload Benefit Assessment

