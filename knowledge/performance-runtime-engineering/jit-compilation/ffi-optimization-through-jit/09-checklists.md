# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** JIT Compilation
**Knowledge Unit:** FFI Optimization Through JIT â€” Reduced Syscall Overhead and Better Caching
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Enable JIT for FFI-heavy code**: Without JIT, FFI performance is acceptable for occasional calls but prohibitive for hot loops. JIT transforms FFI into a viable option.
- [ ] **Minimize FFI calls in hot paths**: Even with JIT, each FFI call has overhead. Batch operations where possible to reduce call count.
- [ ] **Use typed FFI declarations**: Full type declarations enable JIT guard elimination. Incomplete type information forces marshaling overhead.
- [ ] **Combine with preloading**: Preload FFI C headers at startup to avoid runtime parsing overhead. Use FFI::load() in preload scripts.
- [ ] **Profile FFI + JIT performance**: Benchmark FFI operations with and without JIT to quantify the benefit for your specific use case.
- [ ] JIT enabled for FFI-heavy workloads
- [ ] FFI type declarations complete (no incomplete signatures)
- [ ] FFI headers preloaded via opcache.preload
- [ ] FFI + JIT benchmarked against pure PHP and C extension alternatives
- [ ] FFI usage minimized to necessary call sites
- [ ] FFI call overhead measured and documented
- [ ] JIT configuration optimized for FFI-heavy workload
- [ ] Before/after benchmark shows improvement in FFI call performance
- [ ] JIT buffer utilization within acceptable range (<80%)
- [ ] FFI call overhead measured as percentage of hot-path wall time
- [ ] Baseline benchmark with JIT disabled completed
- [ ] Benchmark with tracing JIT (1254) completed
- [ ] Benchmark with function JIT (1205) completed if applicable
- [ ] JIT buffer utilization monitored after configuration
- [ ] Optimal JIT mode for FFI workload selected and documented

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Tracing vs Function JIT**: Tracing JIT optimizes hot loop paths, ideal for templating, data processing, and iterative algorithms. Function JIT optimizes entire functions, better for method-heavy code with predictable call patterns (ORMs, domain logic). When memory is constrained, Function JIT produces less fragmentation.
- [ ] **JIT buffer sizing**: 64MB minimum, 128MB default, 256MB for large applications. Buffer too small causes frequent compilation of the same hot paths. Buffer too large wastes virtual memory (not physical until used). Monitor jit_buffer_size and jit_buffer_free via opcache_get_status().
- [ ] **Performance Spectrum**: Native C extension (fastest) > FFI + JIT (3-5x slower than C) > FFI without JIT (10-20x slower than C) > Pure PHP (50-100x slower than C for compute-heavy operations).
- [ ] **FFI Safety**: FFI is inherently unsafe â€” memory corruption in C code can crash PHP. Use FFI sparingly and wrap in defensive PHP code.
- [ ] **JIT Inlining**: When JIT inlines an FFI call, it eliminates the call overhead entirely. The C function body executes directly, with argument passing handled by native register conventions.
- [ ] **Marshaling Cost Breakdown**: Type validation (40%), argument conversion (30%), call dispatch (20%), cleanup (10%). JIT eliminates type validation and argument conversion in optimized paths.
- [ ] Document and follow through on architectural decision: Whether to use FFI with JIT for native code integration
- [ ] Document and follow through on architectural decision: FFI vs C extension vs pure PHP for performance-critical paths
- [ ] Ensure architecture aligns with core concept: **FFI without JIT**: Each FFI call requires type marshaling, argument conversion, and callback dispatch â€” ~200-500ns overhead per call.
- [ ] Ensure architecture aligns with core concept: **FFI with JIT**: JIT can inline FFI functions, pre-compute argument layouts, and eliminate runtime marshaling â€” ~30-50ns overhead per call (4-10x reduction).
- [ ] Ensure architecture aligns with core concept: **FFI Call Guard Elimination**: When JIT can statically determine C function signatures, it eliminates signature validation guards.
- [ ] Ensure architecture aligns with core concept: **Use Cases**: Image processing (libpng, libjpeg), scientific computing (BLAS, LAPACK), system calls, hardware interaction.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Enable JIT for FFI-heavy code**: Without JIT, FFI performance is acceptable for occasional calls but prohibitive for hot loops. JIT transforms FFI into a viable option.
- [ ] **Minimize FFI calls in hot paths**: Even with JIT, each FFI call has overhead. Batch operations where possible to reduce call count.
- [ ] **Use typed FFI declarations**: Full type declarations enable JIT guard elimination. Incomplete type information forces marshaling overhead.
- [ ] **Combine with preloading**: Preload FFI C headers at startup to avoid runtime parsing overhead. Use FFI::load() in preload scripts.
- [ ] **Profile FFI + JIT performance**: Benchmark FFI operations with and without JIT to quantify the benefit for your specific use case.
- [ ] Profile the FFI-heavy code path to measure total time spent in FFI calls vs PHP execution
- [ ] Disable JIT (opcache.jit=0) and run a benchmark of the FFI-heavy path to establish baseline
- [ ] Enable tracing JIT (opcache.jit=1254) and re-run the same benchmark
- [ ] If FFI call overhead drops >10%, JIT is effectively inlining or optimizing the FFI call sequence
- [ ] For maximum FFI optimization, enable function JIT (opcache.jit=1205) if FFI calls are made from many functions
- [ ] Monitor JIT buffer utilization â€” FFI-heavy code may require larger buffer due to compiled C bindings
- [ ] If buffer free space <20%, increase jit_buffer_size by 50%
- [ ] Document the JIT configuration that provides the best FFI call performance

# Performance Checklist (from 04/06)
- [ ] JIT + FFI enables PHP for performance-sensitive tasks previously requiring C extensions
- [ ] FFI + JIT is ~3-5x slower than native C but 10-50x faster than pure PHP for compute-heavy operations
- [ ] PHP 8.4 FFI improvements with JIT: reduced cache misses from better code locality
- [ ] Each FFI call without JIT: ~200-500ns overhead. With JIT: ~30-50ns overhead
- [ ] JIT enabled
- [ ] Tracing mode
- [ ] Function mode
- [ ] Large buffer (256MB)

# Security Checklist (from 04/06 - only if relevant)
- [ ] FFI bypasses PHP's memory safety guarantees. Memory corruption in C code can lead to arbitrary code execution.
- [ ] Only use FFI with trusted, well-tested C libraries. Never pass unsanitized user input to FFI calls.
- [ ] FFI functions run with PHP process privileges. Isolate FFI-heavy code in separate workers if possible.
- [ ] PHP 8.4+ improved FFI security with better argument validation. Keep PHP updated.

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
- [ ] JIT enabled for FFI-heavy workloads
- [ ] FFI type declarations complete (no incomplete signatures)
- [ ] FFI headers preloaded via opcache.preload
- [ ] FFI + JIT benchmarked against pure PHP and C extension alternatives
- [ ] FFI usage minimized to necessary call sites
- [ ] Security review completed for FFI code paths
- [ ] FFI call overhead measured and documented
- [ ] JIT configuration optimized for FFI-heavy workload
- [ ] Before/after benchmark shows improvement in FFI call performance
- [ ] JIT buffer utilization within acceptable range (<80%)
- [ ] FFI call overhead measured as percentage of hot-path wall time
- [ ] Baseline benchmark with JIT disabled completed
- [ ] Benchmark with tracing JIT (1254) completed
- [ ] Benchmark with function JIT (1205) completed if applicable
- [ ] JIT buffer utilization monitored after configuration
- [ ] Optimal JIT mode for FFI workload selected and documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Enable JIT for FFI-heavy code**: Without JIT, FFI performance is acceptable for occasional calls but prohibitive for hot loops. JIT transforms FFI into a viable option.
- [ ] **Minimize FFI calls in hot paths**: Even with JIT, each FFI call has overhead. Batch operations where possible to reduce call count.
- [ ] **Use typed FFI declarations**: Full type declarations enable JIT guard elimination. Incomplete type information forces marshaling overhead.
- [ ] **Combine with preloading**: Preload FFI C headers at startup to avoid runtime parsing overhead. Use FFI::load() in preload scripts.
- [ ] **Profile FFI + JIT performance**: Benchmark FFI operations with and without JIT to quantify the benefit for your specific use case.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using FFI without JIT in hot paths
- [ ] Avoid: Incomplete FFI type declarations
- [ ] Avoid: FFI for simple operations
- [ ] Avoid: Not preloading FFI headers
- [ ] Avoid anti-pattern: **FFI in security-critical code**: FFI bypasses PHP's safety mechanisms. Avoid for authentication, encryption, or input processing.
- [ ] Avoid anti-pattern: **Replacing working C extensions with FFI**: C extensions are faster and better integrated. Only use FFI when no extension exists.
- [ ] Avoid anti-pattern: **FFI inside tight loops without JIT**: Each call pays marshaling overhead. Use JIT or batch operations.
- [ ] Guard against anti-pattern: Using FFI for Simple Operations Better Done in PHP
- [ ] Guard against anti-pattern: FFI Without JIT - Missing Full Benefit
- [ ] FFI vs PHP benchmarked
- [ ] Decision documented
- [ ] Overhead measured

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
**Core Concepts:** **FFI without JIT**: Each FFI call requires type marshaling, argument conversion, and callback dispatch â€” ~200-500ns overhead per call., **FFI with JIT**: JIT can inline FFI functions, pre-compute argument layouts, and eliminate runtime marshaling â€” ~30-50ns overhead per call (4-10x reduction)., **FFI Call Guard Elimination**: When JIT can statically determine C function signatures, it eliminates signature validation guards., **Use Cases**: Image processing (libpng, libjpeg), scientific computing (BLAS, LAPACK), system calls, hardware interaction.
**Skills:** JIT Configuration for Production, Bytecode vs Native Code Assessment, Type Inference and Guard Elimination
**Decision Trees:** Whether to use FFI with JIT for native code integration, FFI vs C extension vs pure PHP for performance-critical paths
**Anti-Patterns:** Using FFI for Simple Operations Better Done in PHP, FFI Without JIT - Missing Full Benefit
**Related Topics:** JIT Configuration for Production, Type Inference and Guard Elimination, JIT Workload Benefit Assessment, Preloading Configuration

