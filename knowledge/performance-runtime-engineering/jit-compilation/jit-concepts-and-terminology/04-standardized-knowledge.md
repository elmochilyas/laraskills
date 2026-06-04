# Standardized Knowledge: JIT Concepts and Terminology

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | JIT Compilation |
| Knowledge Unit | JIT Concepts and Terminology |
| Difficulty | Foundation |
| Lifecycle | Evaluate, Configure |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

PHP 8.0 introduced a JIT (Just-In-Time) compiler that translates frequently executed opcodes into native machine code at runtime. Two modes exist: tracing JIT (profile-guided, optimizes hot loop paths) and function JIT (compiles entire functions). JIT provides 61-95% gains for CPU-bound code but 0-5% for typical I/O-bound web applications.

## Core Concepts

- **Tracing JIT (opcache.jit=1254)**: Profiles execution, identifies hot traces (loop paths), compiles trace to native code. Better for loops and iterative computation.
- **Function JIT (opcache.jit=1205)**: Compiles entire functions when they cross the hot threshold. Better for function-call-heavy workloads.
- **Hot Path**: Code executed frequently enough to trigger JIT compilation. Controlled by jit_hot_loop (default 64 iterations) and jit_hot_func (default 100 calls).
- **Guard Elimination**: JIT removes type checks when types are inferred at compile time — the primary source of JIT's speedup.
- **DynASM**: Dynamic assembler framework used by PHP's JIT to generate native code at runtime.

## When To Use

- Understanding JIT fundamentals before configuring it
- Determining whether JIT benefits a specific workload
- Planning a migration to PHP 8.0+ with JIT enabled
- Evaluating JIT modes for a given application profile

## When NOT To Use

- When OpCache is not enabled (JIT requires OpCache)
- For pure I/O-bound applications without any CPU-bound work
- When memory is severely constrained (128MB+ JIT buffer)
- On PHP versions below 8.0 (JIT not available)

## Best Practices

- **Enable JIT universally, then benchmark**: JIT is harmless for I/O-bound workloads (0-2% overhead) and beneficial for any CPU-bound path. Enable it and measure.
- **Profile before deciding**: Measure the CPU-bound proportion of request time. If PHP execution >30% of wall time, JIT will likely help.
- **Use tracing (1254) as default**: Tracing mode is the best general-purpose setting. Switch to function mode only for function-heavy workloads.
- **Monitor buffer utilization**: If buffer usage >80%, increase jit_buffer_size. Compilation thrashing negates JIT benefits.

## Architecture Guidelines

- **JIT Pipeline**: Zend opcodes → SSA form → IR → native code via DynASM. The pipeline runs at runtime for hot code only.
- **OpCache Dependency**: JIT reads opcodes from OpCache shared memory. OpCache must be enabled and properly sized.
- **Compilation Triggers**: JIT doesn't compile everything — only hot code that crosses threshold counters. Cold code runs in the Zend VM.
- **Guard Failures**: When type guards fail (unexpected type), JIT bails out to the interpreter for that code path. Subsequent calls don't re-compile.

## Performance Considerations

- Tracing JIT: 61-95% gain for CPU-bound code, 0-5% for I/O-bound
- JIT buffer: 128MB default, 64MB minimum, 256MB for large applications
- Compilation overhead: 50-500µs per hot function, amortized over thousands of calls
- PHP 8.4 JIT: ~8-10% additional gain over PHP 8.3 for CPU-bound benchmarks

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Enabling JIT expecting universal speedup | Assuming JIT helps all workloads | 0-5% gain for typical web apps, wasted expectation | Profile first to determine CPU-bound proportion |
| Not enabling JIT at all | Fear of overhead | Missing free performance gain on CPU-bound paths | Enable JIT universally and measure |
| Confusing tracing and function modes | Not reading documentation | Wrong mode for workload pattern | Default to tracing (1254); switch if function-heavy |
| Undersized JIT buffer | Not monitoring utilization | Compilation thrashing, eviction, recompilation | Monitor jit_buffer_free; increase if <20% free |

## Anti-Patterns

- **Disabling JIT because it doesn't help web requests**: JIT still benefits cron jobs, queue workers, and batch processing. Enable for all processes.
- **Expecting JIT to fix I/O bottlenecks**: JIT optimizes CPU execution, not I/O wait. Fix I/O bottlenecks with better queries, caching, or concurrency.
- **Tuning JIT before OpCache**: OpCache provides 2-4x throughput gain. JIT adds 0-95% on top. Prioritize OpCache configuration first.

## Examples

```ini
; php.ini — Basic JIT configuration
opcache.enable=1
opcache.jit=1254
opcache.jit_buffer_size=128M
```

## Related Topics

- JIT Mode Comparison
- CRTO Bitmask Reference
- JIT Configuration for Production
- Workload Benefit Assessment

## AI Agent Notes

- JIT benefit is workload-dependent: 61-95% for CPU-bound, 0-5% for I/O-bound.
- The primary source of JIT speedup is guard elimination (removing runtime type checks).
- JIT is harmless on I/O-bound paths (0-2% overhead) — enable universally.
- Always configure OpCache before JIT. OpCache is the foundation JIT builds on.

## Verification

- [ ] JIT concepts understood (tracing, function, guard elimination, hot paths)
- [ ] OpCache enabled before JIT configuration
- [ ] Workload CPU-bound proportion assessed
- [ ] Initial JIT configuration applied (default: 1254, 128MB)
- [ ] Buffer utilization monitored after deployment
- [ ] Before/after benchmark results reviewed
