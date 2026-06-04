# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** JIT Compilation
**Knowledge Unit:** JIT Mode Comparison â€” Tracing (1254), Function (1205), On (1235), Disabled (0)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Start with 1254**: Tracing with reduced optimization is the safest production starting point. Compilation overhead is minimal.
- [ ] **Benchmark before switching modes**: The difference between modes is workload-specific. Profile your application with each mode.
- [ ] **Monitor buffer fragmentation**: Function JIT (1205) fragments more than Tracing JIT (1254). If compaction count is high, switch to tracing.
- [ ] **Use 1235 only for CPU-bound batch processing**: The compilation overhead and memory cost of 1235 are only justified when CPU-bound work dominates.
- [ ] JIT mode selected based on workload profile
- [ ] Default starting point is 1254 (tracing)
- [ ] Alternative modes benchmarked if workload is function-heavy or CPU-bound
- [ ] Buffer fragmentation monitored daily for first week
- [ ] Mode change coordinated with PHP-FPM restart
- [ ] All JIT modes benchmarked on the same workload with same buffer size
- [ ] Optimal mode selected based on benchmark data
- [ ] Buffer utilization acceptable for selected mode
- [ ] Mode selection rationale documented
- [ ] Workload profiled for loop vs function-call characteristics
- [ ] Baseline benchmark without JIT completed
- [ ] Tracing JIT (1254) benchmark completed
- [ ] Function JIT (1205) benchmark completed
- [ ] Max JIT (1235) benchmark completed (if applicable)
- [ ] Buffer utilization compared across modes
- [ ] Optimal mode selected with documented rationale

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Tracing vs Function JIT**: Tracing JIT optimizes hot loop paths, ideal for templating, data processing, and iterative algorithms. Function JIT optimizes entire functions, better for method-heavy code with predictable call patterns (ORMs, domain logic). When memory is constrained, Function JIT produces less fragmentation.
- [ ] **JIT buffer sizing**: 64MB minimum, 128MB default, 256MB for large applications. Buffer too small causes frequent compilation of the same hot paths. Buffer too large wastes virtual memory (not physical until used). Monitor jit_buffer_size and jit_buffer_free via opcache_get_status().
- [ ] **Tracing JIT**: Identifies hot loop traces and compiles them. Optimizes loops, branches, and repeated execution paths. Better for templating, data processing, and iterative algorithms.
- [ ] **Function JIT**: Compiles entire functions when they cross the hot threshold. Better for code with many method calls and predictable call patterns.
- [ ] **On Mode (1235)**: Enables all optimizations including inlining. Higher compilation overhead but potentially higher peak performance.
- [ ] Document and follow through on architectural decision: Which JIT mode to use for production
- [ ] Document and follow through on architectural decision: When to use aggressive JIT modes (1235)
- [ ] Ensure architecture aligns with core concept: **1255 (Tracing + default)**: Tracing JIT with default optimization. Best general-purpose setting. PHP 8.0 default.
- [ ] Ensure architecture aligns with core concept: **1254 (Tracing)**: Tracing JIT with reduced optimization. Lower compilation overhead. Good for mixed workloads.
- [ ] Ensure architecture aligns with core concept: **1205 (Function)**: Function JIT with default optimization. Better for method-heavy code with many function calls.
- [ ] Ensure architecture aligns with core concept: **1235 (On)**: Tracing JIT with all optimizations. Highest potential gain but highest compilation overhead and memory usage.
- [ ] Ensure architecture aligns with core concept: **0 (Disable)**: No JIT compilation. Use when JIT overhead exceeds benefit or when memory is constrained.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Start with 1254**: Tracing with reduced optimization is the safest production starting point. Compilation overhead is minimal.
- [ ] **Benchmark before switching modes**: The difference between modes is workload-specific. Profile your application with each mode.
- [ ] **Monitor buffer fragmentation**: Function JIT (1205) fragments more than Tracing JIT (1254). If compaction count is high, switch to tracing.
- [ ] **Use 1235 only for CPU-bound batch processing**: The compilation overhead and memory cost of 1235 are only justified when CPU-bound work dominates.
- [ ] Profile the workload to determine if it is loop-heavy (tracing preferred) or function-call-heavy (function JIT preferred)
- [ ] Disable JIT and run a benchmark to establish baseline without JIT
- [ ] Enable tracing JIT (opcache.jit=1254) and run the same benchmark
- [ ] Enable function JIT (opcache.jit=1205) and run the same benchmark
- [ ] If buffer allows, enable max JIT (opcache.jit=1235) and run the same benchmark
- [ ] Compare throughput, latency, and error rate across all modes for the same workload
- [ ] Check JIT buffer utilization after each mode â€” max mode compiles more aggressively and may use more buffer
- [ ] If all JIT modes provide similar improvement (<5% difference), stay with tracing (1254) â€” it has the lowest compilation overhead
- [ ] If function JIT provides >5% better throughput than tracing for function-heavy workloads, switch to function mode
- [ ] Document the comparison results and selected mode with rationale

# Performance Checklist (from 04/06)
- [ ] Tracing JIT compiles traces (loop paths) â€” good for loop-heavy workloads
- [ ] Function JIT compiles entire functions â€” good for method-call-heavy code
- [ ] On mode (1235) has highest compilation overhead â€” test before using in production
- [ ] Buffer fragmentation differs: Tracing JIT fragments 40-50% less than Function JIT
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
- [ ] JIT mode selected based on workload profile
- [ ] Default starting point is 1254 (tracing)
- [ ] Alternative modes benchmarked if workload is function-heavy or CPU-bound
- [ ] Buffer fragmentation monitored daily for first week
- [ ] Mode change coordinated with PHP-FPM restart
- [ ] All JIT modes benchmarked on the same workload with same buffer size
- [ ] Optimal mode selected based on benchmark data
- [ ] Buffer utilization acceptable for selected mode
- [ ] Mode selection rationale documented
- [ ] Workload profiled for loop vs function-call characteristics
- [ ] Baseline benchmark without JIT completed
- [ ] Tracing JIT (1254) benchmark completed
- [ ] Function JIT (1205) benchmark completed
- [ ] Max JIT (1235) benchmark completed (if applicable)
- [ ] Buffer utilization compared across modes
- [ ] Optimal mode selected with documented rationale

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Start with 1254**: Tracing with reduced optimization is the safest production starting point. Compilation overhead is minimal.
- [ ] **Benchmark before switching modes**: The difference between modes is workload-specific. Profile your application with each mode.
- [ ] **Monitor buffer fragmentation**: Function JIT (1205) fragments more than Tracing JIT (1254). If compaction count is high, switch to tracing.
- [ ] **Use 1235 only for CPU-bound batch processing**: The compilation overhead and memory cost of 1235 are only justified when CPU-bound work dominates.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using 1235 in latency-sensitive environments
- [ ] Avoid: Function JIT for template-heavy apps
- [ ] Avoid: Not testing different modes
- [ ] Avoid: Disabling JIT entirely
- [ ] Avoid anti-pattern: **Changing JIT mode frequently**: Mode changes require full OpCache reset (PHP-FPM restart). Pick a mode and stick with it.
- [ ] Avoid anti-pattern: **Using maximum optimization everywhere**: 1235 has costs (compilation time, memory). Use targeted optimization for specific workloads.
- [ ] Avoid anti-pattern: **Assuming higher CRTO values are always better**: Higher optimization levels compile more aggressively, which can increase latency variance.
- [ ] Guard against anti-pattern: Using Maximum Optimization (1235) Everywhere
- [ ] Guard against anti-pattern: Changing JIT Mode Frequently Without Restart Planning
- [ ] Guard against anti-pattern: Assuming Higher CRTO Values Are Always Better
- [ ] Guard against anti-pattern: Function JIT for Loop-Heavy Workloads
- [ ] Guard against anti-pattern: Not Benchmarking Different Modes
- [ ] JIT mode selected based on workload analysis, not "highest number"
- [ ] 1254 is the default; 1235 used only for CPU-bound batch workloads

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
**Core Concepts:** **1255 (Tracing + default)**: Tracing JIT with default optimization. Best general-purpose setting. PHP 8.0 default., **1254 (Tracing)**: Tracing JIT with reduced optimization. Lower compilation overhead. Good for mixed workloads., **1205 (Function)**: Function JIT with default optimization. Better for method-heavy code with many function calls., **1235 (On)**: Tracing JIT with all optimizations. Highest potential gain but highest compilation overhead and memory usage., **0 (Disable)**: No JIT compilation. Use when JIT overhead exceeds benefit or when memory is constrained.
**Skills:** CRTO Bitmask Reference, JIT Configuration for Production, Workload Benefit Assessment, Type Inference and Guard Elimination
**Decision Trees:** Which JIT mode to use for production, When to use aggressive JIT modes (1235)
**Anti-Patterns:** Using Maximum Optimization (1235) Everywhere, Changing JIT Mode Frequently Without Restart Planning, Assuming Higher CRTO Values Are Always Better, Function JIT for Loop-Heavy Workloads, Not Benchmarking Different Modes
**Related Topics:** JIT Concepts and Terminology, CRTO Bitmask Reference, JIT Configuration for Production, JIT Buffer Sizing Guidelines

