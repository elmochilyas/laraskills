# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** JIT Compilation
**Knowledge Unit:** DynASM Framework â€” IR Construction, Register Allocation, Native Code Generation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Use JIT debug output**: Set opcache.jit_debug=1 in development to see compilation decisions. Trace output shows which functions are compiled and why.
- [ ] **Check for guard failures**: Frequent guard bailouts indicate type instability. Fix type declarations to improve JIT compilation quality.
- [ ] **Monitor compilation counters**: opcache_get_status()['jit'] shows how many functions have been compiled. Low counts may indicate high thresholds or type guard failures.
- [ ] **ARM64 verification**: Test JIT behavior on ARM64 (Graviton, Apple Silicon) separately. DynASM codegen differs between architectures.
- [ ] Guard failure rate monitored (opcache_get_status)
- [ ] Type declarations reviewed for JIT optimization
- [ ] ARM64 JIT tested separately if applicable
- [ ] Debug output used only in development
- [ ] Register allocation mode matches workload priority (speed vs compilation time)
- [ ] Understanding of how DynASM fits into the JIT compilation pipeline
- [ ] Ability to identify guard conditions and type stability requirements
- [ ] Refactoring recommendations for type-unstable code documented
- [ ] JIT debug analysis completed in staging environment
- [ ] JIT pipeline understood (opcodes -> SSA -> IR -> DynASM -> native code)
- [ ] Guard conditions identified for the target function
- [ ] Type stability of the function assessed
- [ ] If guard failures frequent, refactoring opportunities identified
- [ ] DynASM's role in code generation understood
- [ ] **Enable JIT gradually**: Start with opcache.jit=1255 (tracing, default optimization) and 128MB buffer. Monitor for increased memory and compilation pauses.
- [ ] **Warm-up period**: JIT requires 1000-10000 requests to reach peak performance. Generate production traffic after deploy before measuring JIT impact.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Tracing vs Function JIT**: Tracing JIT optimizes hot loop paths, ideal for templating, data processing, and iterative algorithms. Function JIT optimizes entire functions, better for method-heavy code with predictable call patterns (ORMs, domain logic). When memory is constrained, Function JIT produces less fragmentation.
- [ ] **JIT buffer sizing**: 64MB minimum, 128MB default, 256MB for large applications. Buffer too small causes frequent compilation of the same hot paths. Buffer too large wastes virtual memory (not physical until used). Monitor jit_buffer_size and jit_buffer_free via opcache_get_status().
- [ ] **DynASM vs libgccjit**: PHP chose DynASM for small footprint and tight integration. libgccjit would offer more optimization passes but with higher complexity and slower compilation.
- [ ] **SSE2/AVX2 Utilization**: PHP 8.4+ JIT can vectorize certain operations using SIMD instructions, providing additional speedup for array operations and math.
- [ ] **IR Pipeline**: Zend opcodes â†’ SSA form â†’ control flow graph â†’ type inference â†’ IR â†’ register allocation â†’ code emission. Each stage can be inspected with debug flags.
- [ ] **ARM64 Support**: PHP 8.4 improved ARM64 JIT stability significantly. However, some x86-64 optimizations (AVX2 vectorization) have no ARM64 equivalent.
- [ ] Document and follow through on architectural decision: Whether to debug JIT compilation at DynASM level
- [ ] Document and follow through on architectural decision: Register allocation mode selection (R in CRTO)
- [ ] Ensure architecture aligns with core concept: **IR Construction**: Zend opcodes â†’ DynASM IR (intermediate operations). Architecture-neutral. PHP 8.4 improved IR generation with better type annotation propagation.
- [ ] Ensure architecture aligns with core concept: **Register Allocation**: Maps virtual IR registers to physical CPU registers (x86-64: 16 GPRs, ARM64: 31 GPRs). Uses linear scan or graph coloring strategy.
- [ ] Ensure architecture aligns with core concept: **Code Generation**: DynASM emits instruction bytes directly into the pre-allocated JIT buffer. Uses CPU-specific instruction encoding (SSE2, AVX2 for x86-64; NEON for ARM64).
- [ ] Ensure architecture aligns with core concept: **Guard Insertion**: Type guards are emitted before optimized code paths. If the guard fails (unexpected type), execution falls back to the Zend VM interpreter (bailout).

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Use JIT debug output**: Set opcache.jit_debug=1 in development to see compilation decisions. Trace output shows which functions are compiled and why.
- [ ] **Check for guard failures**: Frequent guard bailouts indicate type instability. Fix type declarations to improve JIT compilation quality.
- [ ] **Monitor compilation counters**: opcache_get_status()['jit'] shows how many functions have been compiled. Low counts may indicate high thresholds or type guard failures.
- [ ] **ARM64 verification**: Test JIT behavior on ARM64 (Graviton, Apple Silicon) separately. DynASM codegen differs between architectures.
- [ ] Identify the PHP function or trace that is being JIT-compiled
- [ ] Enable JIT debug logging to observe the compilation pipeline: `opcache.jit_debug=1`
- [ ] Trace the pipeline: PHP opcodes -> SSA conversion -> type inference and guard insertion -> IR generation -> DynASM code emission
- [ ] Identify guard conditions: type checks that JIT inserts at compile time and assumes at runtime
- [ ] When a guard fails, JIT bails out to the interpreter â€” analyze which types are unpredictable
- [ ] For type-stable code (predictable types), guards never fail and native code executes continuously
- [ ] Use this analysis to refactor PHP code for type stability, enabling better JIT optimization

# Performance Checklist (from 04/06)
- [ ] JIT compilation time: 50-500Âµs per hot function depending on optimization level
- [ ] Graph coloring register allocation (R=2) produces 5-15% faster code than linear scan (R=1) but compiles 2-3x slower
- [ ] Guard failure cost: 1-5Âµs per failure (bailout to interpreter). Frequent failures negate JIT benefits.
- [ ] SSE2/AVX2 utilization: PHP 8.4+ can vectorize array operations, providing 2-4x speedup for numerical code
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
- [ ] Guard failure rate monitored (opcache_get_status)
- [ ] Type declarations reviewed for JIT optimization
- [ ] ARM64 JIT tested separately if applicable
- [ ] Debug output used only in development
- [ ] Register allocation mode matches workload priority (speed vs compilation time)
- [ ] Understanding of how DynASM fits into the JIT compilation pipeline
- [ ] Ability to identify guard conditions and type stability requirements
- [ ] Refactoring recommendations for type-unstable code documented
- [ ] JIT debug analysis completed in staging environment
- [ ] JIT pipeline understood (opcodes -> SSA -> IR -> DynASM -> native code)
- [ ] Guard conditions identified for the target function
- [ ] Type stability of the function assessed
- [ ] If guard failures frequent, refactoring opportunities identified
- [ ] DynASM's role in code generation understood

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Use JIT debug output**: Set opcache.jit_debug=1 in development to see compilation decisions. Trace output shows which functions are compiled and why.
- [ ] **Check for guard failures**: Frequent guard bailouts indicate type instability. Fix type declarations to improve JIT compilation quality.
- [ ] **Monitor compilation counters**: opcache_get_status()['jit'] shows how many functions have been compiled. Low counts may indicate high thresholds or type guard failures.
- [ ] **ARM64 verification**: Test JIT behavior on ARM64 (Graviton, Apple Silicon) separately. DynASM codegen differs between architectures.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Ignoring guard failures
- [ ] Avoid: Expecting identical ARM64/x86-64 behavior
- [ ] Avoid: Debug JIT in production
- [ ] Avoid: Assuming register allocation doesn't matter
- [ ] Avoid anti-pattern: **Modifying DynASM behavior without deep understanding**: DynASM changes affect all JIT compilation. Only modify in PHP core development context.
- [ ] Avoid anti-pattern: **Debugging JIT by disabling it**: If JIT causes issues, fix the root cause (type guards, buffer size) rather than disabling entirely.
- [ ] Avoid anti-pattern: **Expecting C-level performance**: JIT-compiled PHP is still PHP. Type inference limitations and guard insertion prevent C-level optimization density.
- [ ] Guard against anti-pattern: Treating JIT as a Black Box
- [ ] Guard against anti-pattern: Ignoring JIT Compilation Failures
- [ ] JIT internals understood
- [ ] Debug data collected as needed

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
**Core Concepts:** **IR Construction**: Zend opcodes â†’ DynASM IR (intermediate operations). Architecture-neutral. PHP 8.4 improved IR generation with better type annotation propagation., **Register Allocation**: Maps virtual IR registers to physical CPU registers (x86-64: 16 GPRs, ARM64: 31 GPRs). Uses linear scan or graph coloring strategy., **Code Generation**: DynASM emits instruction bytes directly into the pre-allocated JIT buffer. Uses CPU-specific instruction encoding (SSE2, AVX2 for x86-64; NEON for ARM64)., **Guard Insertion**: Type guards are emitted before optimized code paths. If the guard fails (unexpected type), execution falls back to the Zend VM interpreter (bailout).
**Skills:** Type Inference and Guard Elimination, JIT Concepts and Terminology, Bytecode vs Native Code Assessment
**Decision Trees:** Whether to debug JIT compilation at DynASM level, Register allocation mode selection (R in CRTO)
**Anti-Patterns:** Treating JIT as a Black Box, Ignoring JIT Compilation Failures
**Related Topics:** Type Inference and Guard Elimination, JIT Memory Layout and Fragmentation, JIT Configuration for Production, JIT for Long-Running Processes

