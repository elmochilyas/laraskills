# Standardized Knowledge: DynASM Framework Internals

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | JIT Compilation |
| Knowledge Unit | DynASM Framework Internals |
| Difficulty | Advanced |
| Lifecycle | Analyze, Debug |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

PHP's JIT compiler is built on DynASM (Dynamic Assembler), a LuaJIT-derived framework that generates native machine code at runtime. DynASM takes an intermediate representation (IR) from the Zend opcodes, performs register allocation, and emits executable x86-64 or ARM64 instructions directly into the JIT buffer. Understanding DynASM is essential for debugging JIT behavior and evaluating compilation quality.

## Core Concepts

- **IR Construction**: Zend opcodes → DynASM IR (intermediate operations). Architecture-neutral. PHP 8.4 improved IR generation with better type annotation propagation.
- **Register Allocation**: Maps virtual IR registers to physical CPU registers (x86-64: 16 GPRs, ARM64: 31 GPRs). Uses linear scan or graph coloring strategy.
- **Code Generation**: DynASM emits instruction bytes directly into the pre-allocated JIT buffer. Uses CPU-specific instruction encoding (SSE2, AVX2 for x86-64; NEON for ARM64).
- **Guard Insertion**: Type guards are emitted before optimized code paths. If the guard fails (unexpected type), execution falls back to the Zend VM interpreter (bailout).

## When To Use

- Debugging JIT compilation failures (segfaults, incorrect results)
- Understanding why certain code isn't being JIT-compiled
- Evaluating compilation quality for performance-critical paths
- PHP core development or extension development targeting JIT

## When NOT To Use

- Day-to-day JIT configuration and tuning
- Understanding JIT benefit for application workloads
- Production debugging (use higher-level tools instead)
- Teams without compiler/assembly background

## Best Practices

- **Use JIT debug output**: Set opcache.jit_debug=1 in development to see compilation decisions. Trace output shows which functions are compiled and why.
- **Check for guard failures**: Frequent guard bailouts indicate type instability. Fix type declarations to improve JIT compilation quality.
- **Monitor compilation counters**: opcache_get_status()['jit'] shows how many functions have been compiled. Low counts may indicate high thresholds or type guard failures.
- **ARM64 verification**: Test JIT behavior on ARM64 (Graviton, Apple Silicon) separately. DynASM codegen differs between architectures.

## Architecture Guidelines

- **DynASM vs libgccjit**: PHP chose DynASM for small footprint and tight integration. libgccjit would offer more optimization passes but with higher complexity and slower compilation.
- **SSE2/AVX2 Utilization**: PHP 8.4+ JIT can vectorize certain operations using SIMD instructions, providing additional speedup for array operations and math.
- **IR Pipeline**: Zend opcodes → SSA form → control flow graph → type inference → IR → register allocation → code emission. Each stage can be inspected with debug flags.
- **ARM64 Support**: PHP 8.4 improved ARM64 JIT stability significantly. However, some x86-64 optimizations (AVX2 vectorization) have no ARM64 equivalent.

## Performance Considerations

- JIT compilation time: 50-500µs per hot function depending on optimization level
- Graph coloring register allocation (R=2) produces 5-15% faster code than linear scan (R=1) but compiles 2-3x slower
- Guard failure cost: 1-5µs per failure (bailout to interpreter). Frequent failures negate JIT benefits.
- SSE2/AVX2 utilization: PHP 8.4+ can vectorize array operations, providing 2-4x speedup for numerical code

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Ignoring guard failures | Not monitoring opcache_get_status() | JIT compiles code that always bails out (no benefit) | Fix type declarations to reduce guard failures |
| Expecting identical ARM64/x86-64 behavior | Architecture differences | Surprising performance differences | Test JIT on both architectures separately |
| Debug JIT in production | Enabling debug flags on live servers | Performance overhead from debug output | Use debug mode only in development/staging |
| Assuming register allocation doesn't matter | Not understanding compilation quality | 5-15% performance left on table | Test R=1 vs R=2 for CPU-bound workloads |

## Anti-Patterns

- **Modifying DynASM behavior without deep understanding**: DynASM changes affect all JIT compilation. Only modify in PHP core development context.
- **Debugging JIT by disabling it**: If JIT causes issues, fix the root cause (type guards, buffer size) rather than disabling entirely.
- **Expecting C-level performance**: JIT-compiled PHP is still PHP. Type inference limitations and guard insertion prevent C-level optimization density.

## Examples

```bash
# Enable JIT debug output (development only)
php -d opcache.jit_debug=1 script.php

# Check JIT compilation statistics
php -r 'var_dump(opcache_get_status(false)["jit"]);'
```

## Related Topics

- Type Inference and Guard Elimination
- JIT Memory Layout and Fragmentation
- JIT Configuration for Production
- JIT for Long-Running Processes

## AI Agent Notes

- DynASM is the code generation backend for PHP's JIT. It takes IR and emits native machine code.
- Guard elimination (removing runtime type checks) is the primary source of JIT speedup.
- ARM64 and x86-64 have different DynASM code generators. Test both architectures separately.
- JIT debug output (opcache.jit_debug=1) shows compilation decisions — useful for understanding why code isn't compiled.
- Frequent guard failures neutralize JIT benefits. Fix type declarations to improve compilation quality.

## Verification

- [ ] Guard failure rate monitored (opcache_get_status)
- [ ] Type declarations reviewed for JIT optimization
- [ ] ARM64 JIT tested separately if applicable
- [ ] Debug output used only in development
- [ ] Register allocation mode matches workload priority (speed vs compilation time)
