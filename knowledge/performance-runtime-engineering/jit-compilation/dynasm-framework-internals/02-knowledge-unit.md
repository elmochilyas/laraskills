# Metadata

Domain: Performance & Runtime Engineering
Subdomain: JIT Compilation
Knowledge Unit: DynASM Framework — IR Construction, Register Allocation, Native Code Generation
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

PHP's JIT compiler is built on **DynASM** (Dynamic Assembler), a LuaJIT-derived framework that generates native machine code at runtime. DynASM takes an intermediate representation (IR) from the Zend opcodes, performs register allocation, and emits executable x86-64 or ARM64 instructions directly into the JIT buffer. Understanding DynASM is essential for debugging JIT behavior and evaluating compilation quality.

---

# Core Concepts

- **IR construction**: Zend opcodes ? DynASM IR (intermediate operations). The IR is architecture-neutral at this stage. PHP 8.4 improved IR generation with better type annotation propagation.
- **Register allocation**: Maps virtual IR registers to physical CPU registers (x86-64: 16 GPRs, ARM64: 31 GPRs). Uses linear scan (CRTO R=1) or graph coloring (CRTO R=2) strategy.
- **Code generation**: DynASM emits instruction bytes directly into the pre-allocated JIT buffer. Uses CPU-specific instruction encoding (SSE2, AVX2 for x86-64; NEON for ARM64).
- **Guard insertion**: Type guards are emitted before optimized code paths. If the guard fails (unexpected type), execution falls back to the Zend VM interpreter (bailout).

---

# Architectural Decisions

- **DynASM vs libgccjit**: PHP chose DynASM for its small footprint and tight integration with the JIT buffer. `libgccjit` would have offered more optimization passes but with higher complexity and slower compilation.
- **SSE2/AVX2 utilization**: PHP 8.4+ JIT can vectorize certain operations using SIMD instructions, providing additional speedup for array operations and math.

---

# Performance Considerations

- JIT compilation time: 50-500µs per hot function depending on optimization level. Amortized over thousands of calls.
- Bailouts (guard failures) are expensive: ~1-5µs to fall back to interpreter. Excessive bailouts indicate poor type inference.

---

# Common Mistakes

- Enabling JIT for I/O-bound workloads: JIT only benefits CPU-bound code; for framework-heavy apps with DB/API latency, JIT adds overhead without benefit
- Setting JIT buffer too small: insufficient buffer causes compilation thrash; monitor opcache_get_status()['jit']
- Not warming up JIT before benchmarking: cold JIT produces misleading results; send 2000+ requests first
- Using JIT with PHP-FPM: JIT benefit is minimal in FPM since each request is a separate process
- Ignoring memory overhead: JIT buffer + profiling consumes 128-256MB RSS; account in capacity planning

---

# Related Knowledge Units

Type Inference and Guard Elimination | JIT Memory Layout and Fragmentation | CRTO Bitmask Reference

---

## Mental Models

**Interpreter vs translator model**: Without JIT, PHP is a human interpreter reading each sentence aloud one at a time. JIT is a translator who watches for repeated phrases, memorizes them in the local dialect, and speaks them fluently. The warm-up period is the translator learning which phrases are common.

---

## Internal Mechanics

PHP's JIT compiles hot opcodes into native machine code through multiple IR representations. The pipeline: PHP opcodes â†’ SSA (Static Single Assignment) form â†’ IR (Intermediate Representation) â†’ native code emission via DynASM. Control flow graph construction identifies basic blocks and loops. Type inference uses SSA to track variable types across the graph, enabling guard elimination where runtime type checks are removed. Register allocation assigns x86-64 registers to SSA variables. The JIT buffer is an mmap'd region with read-execute permissions where emitted code lives. Side exits from compiled traces fall back to the VM interpreter.

---

## Patterns

**Profile-then-enable**: 1) Profile application to measure CPU time in PHP execution vs I/O wait, 2) If PHP execution is >30% of wall time, enable JIT, 3) Benchmark p50/p99 latency with/without JIT, 4) If improvement <5%, disable JIT to reclaim memory (128MB buffer).

---

## Architectural Decisions

- **Tracing vs Function JIT**: Tracing JIT optimizes hot loop paths, ideal for templating, data processing, and iterative algorithms. Function JIT optimizes entire functions, better for method-heavy code with predictable call patterns (ORMs, domain logic). When memory is constrained, Function JIT produces less fragmentation.
- **JIT buffer sizing**: 64MB minimum, 128MB default, 256MB for large applications. Buffer too small causes frequent compilation of the same hot paths. Buffer too large wastes virtual memory (not physical until used). Monitor jit_buffer_size and jit_buffer_free via opcache_get_status().

---

## Tradeoffs

| Tradeoff | Benefit | Cost |
|----------|---------|------|
| JIT enabled | CPU-bound code speedup (10-95%) | 128MB memory reservation, warmup period |
| Tracing mode | Best loop optimization | Higher fragmentation, more memory |
| Function mode | Less fragmentation, predictable | Lower peak throughput for loop-heavy code |
| Large buffer (256MB) | More hot paths compiled | 256MB committed to virtual memory |

---

## Production Considerations

- **Enable JIT gradually**: Start with opcache.jit=1255 (tracing, default optimization) and 128MB buffer. Monitor for increased memory and compilation pauses.
- **Warm-up period**: JIT requires 1000-10000 requests to reach peak performance. Generate production traffic after deploy before measuring JIT impact.
- **Memory commitment**: JIT buffer is committed as virtual memory â€” ensure swap is configured if buffer is large.
- **Monitoring**: Check opcache_get_status()['jit'] for uffer_size, uffer_free. If buffer utilization > 80%, increase jit_buffer_size.

---

## Failure Modes

- **JIT buffer exhaustion**: Buffer utilization reaches 100%. Symptom: JIT compilation stalls, hot paths revert to interpreter. Mitigation: Increase jit_buffer_size, monitor jit_buffer_free.
- **Segfault on native code execution**: JIT produces incorrect native code (rare, fixed in updates). Symptom: PHP-FPM worker crashes with SIGSEGV. Mitigation: Disable JIT, upgrade PHP, file bug report.
- **Compilation pause spikes**: JIT compilation during request causes latency spikes. Symptom: Occasional p99 latency spikes (10-100ms). Mitigation: Use less aggressive JIT mode (1254 vs 1235), increase trigger thresholds.
- **Type guard failures**: Incorrect type guard elimination causes wrong computation results. Symptom: Silent data corruption in JIT-compiled code. Mitigation: Keep PHP updated, report as PHP bug.

---

## Ecosystem Usage

- **Laravel**: JIT provides modest 3-8% gain for typical Laravel CRUD apps (I/O bound). Higher gains (15-30%) for Laravel apps with significant computation (reporting, batch processing, PDF generation).
- **Symfony**: Similar profile to Laravel. Symfony Messenger consumers (long-running processes) benefit most from JIT as repeated handler execution triggers hot path compilation.
- **Composer/Math libraries**: JIT excels at numerical computing. Libraries like rick/math, phpunit, and image processing benefit most (50-200% speedups).
- **PHPBench**: JIT provides 61-95% improvement on PHPBench CPU-bound benchmarks â€” the upper bound of what JIT can achieve.

---

## Research Notes

- PHP 8.4 JIT improvements: Better register allocation, reduced compilation overhead. ~8-10% additional gain over PHP 8.3 for CPU-bound benchmarks.
- PHP 8.5 JIT roadmap: Multi-tier compilation (interpret â†’ JIT â†’ optimized JIT), improved type inference for generics, and AOT compilation experiments.
- DynASM replacement: The PHP team explores replacing DynASM with a simpler code generator to reduce maintenance burden and improve portability to ARM/RISC-V.
- Type specialization research: PHP's type system prevents many JIT optimizations available in compiled languages. Stricter typing in PHP 8.x+ may unlock further JIT gains.
