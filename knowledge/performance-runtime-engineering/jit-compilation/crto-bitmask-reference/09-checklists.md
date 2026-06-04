# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** JIT Compilation
**Knowledge Unit:** CRTO Bitmask â€” CPU Optimization, Register Allocation, Trigger Type, Optimization Level
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Use standard presets first**: 1254, 1255, or 1205 cover 95% of use cases. Custom CRTO values are rarely needed.
- [ ] **CPU optimization (C)**: Enable (1) when deployment environment has consistent CPU architecture. Disable (0) for maximum portability.
- [ ] **Register allocation (R)**: Use 2 (graph coloring) for CPU-bound workloads, 1 (linear scan) for balanced workloads. Graph coloring compiles slower but produces faster code.
- [ ] **Trigger type (T)**: 5 (hot after N triggers) is the best default. It collects profiling data before compilation.
- [ ] **Optimization level (O)**: 4 (with inlining) is good for most workloads. 5 (recursive inlining) increases compilation overhead and memory usage significantly.
- [ ] CRTO bitmask understood (C, R, T, O meanings)
- [ ] Standard preset selected (1254, 1255, 1205, or 1235)
- [ ] Custom CRTO combination tested with before/after benchmarks
- [ ] CPU optimization level matches deployment architecture
- [ ] Buffer utilization monitored with chosen optimization level
- [ ] CRTO bitmask rationale documented for the selected mode
- [ ] Workload profile (loop vs function) guides compile mode selection
- [ ] Before/after benchmark confirms mode provides benefit
- [ ] JIT buffer utilization stays below 80% with selected mode
- [ ] CRTO bitmask decoded and understood for current configuration
- [ ] Workload profile (loop vs function heavy) matched to compile mode
- [ ] Before/after benchmark completed for each tested mode
- [ ] Selected mode documented with performance data
- [ ] JIT buffer utilization monitored after mode change
- [ ] **Enable JIT gradually**: Start with opcache.jit=1255 (tracing, default optimization) and 128MB buffer. Monitor for increased memory and compilation pauses.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Tracing vs Function JIT**: Tracing JIT optimizes hot loop paths, ideal for templating, data processing, and iterative algorithms. Function JIT optimizes entire functions, better for method-heavy code with predictable call patterns (ORMs, domain logic). When memory is constrained, Function JIT produces less fragmentation.
- [ ] **JIT buffer sizing**: 64MB minimum, 128MB default, 256MB for large applications. Buffer too small causes frequent compilation of the same hot paths. Buffer too large wastes virtual memory (not physical until used). Monitor jit_buffer_size and jit_buffer_free via opcache_get_status().
- [ ] **Bitmask Structure**: opcache.jit = CRTO where C=digit1, R=digit2, T=digit3, O=digit4. Each digit is independent â€” they combine for the full strategy.
- [ ] **CPU Optimization (C)**: Controls whether CPU-specific instruction selection is used. On x86-64, enables SSE2/AVX2 usage. On ARM64, enables NEON.
- [ ] **Register Allocation (R)**: Graph coloring (2) is more aggressive and produces better code but takes longer to compile. Linear scan (1) is faster to compile.
- [ ] **Trigger Type (T)**: 5 collects profiling data on first N encounters then compiles. 4 compiles immediately when hot threshold is crossed. 3 compiles all hot code at script end.
- [ ] **Optimization Level (O)**: Each level adds optimization passes. Inlining (4,5) copies function body into caller, removing call overhead.
- [ ] Document and follow through on architectural decision: Standard preset vs custom CRTO value
- [ ] Document and follow through on architectural decision: Register allocation mode (R digit) selection
- [ ] Ensure architecture aligns with core concept: **C (CPU optimization, 0-1)**: 0=no CPU-specific optimizations, 1=enable CPU-specific (use if target CPU is known/fixed)
- [ ] Ensure architecture aligns with core concept: **R (Register allocation, 0-2)**: 0=no register allocation (pessimistic), 1=linear scan (balanced), 2=graph coloring (aggressive, best performance)
- [ ] Ensure architecture aligns with core concept: **T (Trigger type, 0-5)**: 0=never trigger, 1=at script end (all), 2=on request (function), 3=at script end (hot), 4=on request (hot), 5=after N triggers (hot, default)
- [ ] Ensure architecture aligns with core concept: **O (Optimization level, 0-5)**: 0=none, 1=minimal (type inference only), 2=cast optimization, 3=full optimizations, 4=with inlining, 5=with recursive inlining

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Use standard presets first**: 1254, 1255, or 1205 cover 95% of use cases. Custom CRTO values are rarely needed.
- [ ] **CPU optimization (C)**: Enable (1) when deployment environment has consistent CPU architecture. Disable (0) for maximum portability.
- [ ] **Register allocation (R)**: Use 2 (graph coloring) for CPU-bound workloads, 1 (linear scan) for balanced workloads. Graph coloring compiles slower but produces faster code.
- [ ] **Trigger type (T)**: 5 (hot after N triggers) is the best default. It collects profiling data before compilation.
- [ ] **Optimization level (O)**: 4 (with inlining) is good for most workloads. 5 (recursive inlining) increases compilation overhead and memory usage significantly.
- [ ] Document the current JIT CRTO bitmask value (e.g., opcache.jit=1254)
- [ ] Decode the four digits: Compile (1=tracing, 2=function), Register (2=default), Trigger (5=PGO threshold), Optimize (4=useSSA)
- [ ] For loop-heavy CPU-bound workloads: compile mode 1 (tracing) captures loop patterns better
- [ ] For method/function-call-heavy workloads: compile mode 2 (function) compiles entire functions
- [ ] For maximum optimization (at higher compile cost): optimize flag 5 (use all optimizations including SSA)
- [ ] Apply the new bitmask and run a before/after benchmark comparison
- [ ] If throughput improves >5%, keep the new mode; otherwise revert to 1254
- [ ] Document the selected bitmask and the rationale based on workload characteristics

# Performance Checklist (from 04/06)
- [ ] Register allocation: graph coloring (R=2) produces 5-15% faster code than linear scan (R=1) but compiles 2-3x slower
- [ ] Inlining (O=4,5) increases compiled code size â€” requires larger JIT buffer
- [ ] Recursive inlining (O=5) can cause exponential code growth for deeply recursive functions
- [ ] Hot trigger (T=5) delays compilation by N triggers, allowing better profiling data collection
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
- [ ] CRTO bitmask understood (C, R, T, O meanings)
- [ ] Standard preset selected (1254, 1255, 1205, or 1235)
- [ ] Custom CRTO combination tested with before/after benchmarks
- [ ] CPU optimization level matches deployment architecture
- [ ] Buffer utilization monitored with chosen optimization level
- [ ] CRTO bitmask rationale documented for the selected mode
- [ ] Workload profile (loop vs function) guides compile mode selection
- [ ] Before/after benchmark confirms mode provides benefit
- [ ] JIT buffer utilization stays below 80% with selected mode
- [ ] CRTO bitmask decoded and understood for current configuration
- [ ] Workload profile (loop vs function heavy) matched to compile mode
- [ ] Before/after benchmark completed for each tested mode
- [ ] Selected mode documented with performance data
- [ ] JIT buffer utilization monitored after mode change

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Use standard presets first**: 1254, 1255, or 1205 cover 95% of use cases. Custom CRTO values are rarely needed.
- [ ] **CPU optimization (C)**: Enable (1) when deployment environment has consistent CPU architecture. Disable (0) for maximum portability.
- [ ] **Register allocation (R)**: Use 2 (graph coloring) for CPU-bound workloads, 1 (linear scan) for balanced workloads. Graph coloring compiles slower but produces faster code.
- [ ] **Trigger type (T)**: 5 (hot after N triggers) is the best default. It collects profiling data before compilation.
- [ ] **Optimization level (O)**: 4 (with inlining) is good for most workloads. 5 (recursive inlining) increases compilation overhead and memory usage significantly.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using CRTO without understanding each digit
- [ ] Avoid: Graph coloring on memory-constrained systems
- [ ] Avoid: Recursive inlining for all workloads
- [ ] Avoid: CPU optimization enabled on unknown target
- [ ] Avoid anti-pattern: **Creating arbitrary CRTO combinations**: Not all combinations make sense. 0205 (CPU=0, Register=2, Trigger=0, Optimization=5) has trigger=0 which disables JIT entirely. Use standard presets.
- [ ] Avoid anti-pattern: **Tweaking CRTO without before/after benchmarking**: Each digit change affects performance. Always benchmark to validate improvement.
- [ ] Avoid anti-pattern: **Assuming higher digit values are always better**: Register allocation 2 is better than 1 for some workloads but worse for others due to compilation time tradeoff.
- [ ] Guard against anti-pattern: Treating CRTO Bitmask as Magic Numbers
- [ ] Guard against anti-pattern: Not Logging CRTO Value for Debugging
- [ ] CRTO bits documented
- [ ] Changes based on profile
- [ ] Benchmark verified

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
**Core Concepts:** **C (CPU optimization, 0-1)**: 0=no CPU-specific optimizations, 1=enable CPU-specific (use if target CPU is known/fixed), **R (Register allocation, 0-2)**: 0=no register allocation (pessimistic), 1=linear scan (balanced), 2=graph coloring (aggressive, best performance), **T (Trigger type, 0-5)**: 0=never trigger, 1=at script end (all), 2=on request (function), 3=at script end (hot), 4=on request (hot), 5=after N triggers (hot, default), **O (Optimization level, 0-5)**: 0=none, 1=minimal (type inference only), 2=cast optimization, 3=full optimizations, 4=with inlining, 5=with recursive inlining
**Skills:** JIT Mode Comparison, JIT Configuration for Production, Workload Benefit Assessment
**Decision Trees:** Standard preset vs custom CRTO value, Register allocation mode (R digit) selection
**Anti-Patterns:** Treating CRTO Bitmask as Magic Numbers, Not Logging CRTO Value for Debugging
**Related Topics:** JIT Mode Comparison, JIT Configuration for Production, JIT Hot Path Threshold Tuning, JIT Concepts and Terminology

