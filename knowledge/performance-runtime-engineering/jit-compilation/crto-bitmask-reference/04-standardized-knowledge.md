# Standardized Knowledge: CRTO Bitmask Reference

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | JIT Compilation |
| Knowledge Unit | CRTO Bitmask Reference |
| Difficulty | Intermediate |
| Lifecycle | Configure, Tune |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

The opcache.jit value is a 4-digit CRTO bitmask controlling compilation strategy: C (CPU optimization level), R (Register allocation mode), T (Trigger type — what triggers compilation), and O (Optimization level). Each digit selects from enumerated options, making 1254 a specific combination of CPU(1), Register(2), Trigger(5), Optimization(4).

## Core Concepts

- **C (CPU optimization, 0-1)**: 0=no CPU-specific optimizations, 1=enable CPU-specific (use if target CPU is known/fixed)
- **R (Register allocation, 0-2)**: 0=no register allocation (pessimistic), 1=linear scan (balanced), 2=graph coloring (aggressive, best performance)
- **T (Trigger type, 0-5)**: 0=never trigger, 1=at script end (all), 2=on request (function), 3=at script end (hot), 4=on request (hot), 5=after N triggers (hot, default)
- **O (Optimization level, 0-5)**: 0=none, 1=minimal (type inference only), 2=cast optimization, 3=full optimizations, 4=with inlining, 5=with recursive inlining

## When To Use

- Understanding what opcache.jit values actually mean
- Tuning JIT for specific workload patterns
- Debugging JIT behavior (why certain code isn't being compiled)
- Creating custom JIT configurations beyond standard presets

## When NOT To Use

- Most production deployments (standard presets 1254, 1255, 1205 suffice)
- When the standard CRTO documentation isn't needed for day-to-day operations
- For teams without deep understanding of compiler optimization concepts

## Best Practices

- **Use standard presets first**: 1254, 1255, or 1205 cover 95% of use cases. Custom CRTO values are rarely needed.
- **CPU optimization (C)**: Enable (1) when deployment environment has consistent CPU architecture. Disable (0) for maximum portability.
- **Register allocation (R)**: Use 2 (graph coloring) for CPU-bound workloads, 1 (linear scan) for balanced workloads. Graph coloring compiles slower but produces faster code.
- **Trigger type (T)**: 5 (hot after N triggers) is the best default. It collects profiling data before compilation.
- **Optimization level (O)**: 4 (with inlining) is good for most workloads. 5 (recursive inlining) increases compilation overhead and memory usage significantly.

## Architecture Guidelines

- **Bitmask Structure**: opcache.jit = CRTO where C=digit1, R=digit2, T=digit3, O=digit4. Each digit is independent — they combine for the full strategy.
- **CPU Optimization (C)**: Controls whether CPU-specific instruction selection is used. On x86-64, enables SSE2/AVX2 usage. On ARM64, enables NEON.
- **Register Allocation (R)**: Graph coloring (2) is more aggressive and produces better code but takes longer to compile. Linear scan (1) is faster to compile.
- **Trigger Type (T)**: 5 collects profiling data on first N encounters then compiles. 4 compiles immediately when hot threshold is crossed. 3 compiles all hot code at script end.
- **Optimization Level (O)**: Each level adds optimization passes. Inlining (4,5) copies function body into caller, removing call overhead.

## Performance Considerations

- Register allocation: graph coloring (R=2) produces 5-15% faster code than linear scan (R=1) but compiles 2-3x slower
- Inlining (O=4,5) increases compiled code size — requires larger JIT buffer
- Recursive inlining (O=5) can cause exponential code growth for deeply recursive functions
- Hot trigger (T=5) delays compilation by N triggers, allowing better profiling data collection

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using CRTO without understanding each digit | Copying settings from blogs | Suboptimal configuration for workload | Understand C, R, T, O independently |
| Graph coloring on memory-constrained systems | Seeking maximum performance | Longer compilation, more memory pressure | Use linear scan (R=1) for balanced workloads |
| Recursive inlining for all workloads | Assuming higher = better | JIT buffer overflow, code explosion | Use O=4 (inline) instead of O=5 (recursive inline) |
| CPU optimization enabled on unknown target | Cross-platform deployment | Illegal instruction errors on CPUs without SSE2/AVX2 | Disable C=0 for portable builds |

## Anti-Patterns

- **Creating arbitrary CRTO combinations**: Not all combinations make sense. 0205 (CPU=0, Register=2, Trigger=0, Optimization=5) has trigger=0 which disables JIT entirely. Use standard presets.
- **Tweaking CRTO without before/after benchmarking**: Each digit change affects performance. Always benchmark to validate improvement.
- **Assuming higher digit values are always better**: Register allocation 2 is better than 1 for some workloads but worse for others due to compilation time tradeoff.

## Examples

```
CRTO Quick Reference:
+-----+----------------+--------------+--------------+-------------------+
| Dig | C (CPU Opt)    | R (Register) | T (Trigger)  | O (Opt Level)     |
+-----+----------------+--------------+--------------+-------------------+
| 0   | None           | None         | Never        | None              |
| 1   | Enable         | Linear scan  | Script end   | Type inference    |
| 2   | -              | Graph color  | On request   | Cast optimization |
| 3   | -              | -            | Script end H | Full optimizations |
| 4   | -              | -            | On request H | With inlining     |
| 5   | -              | -            | After N (H)  | Recursive inline  |
+-----+----------------+--------------+--------------+-------------------+
```

## Related Topics

- JIT Mode Comparison
- JIT Configuration for Production
- JIT Hot Path Threshold Tuning
- JIT Concepts and Terminology

## AI Agent Notes

- The CRTO bitmask has four independent digits for CPU opt, Register allocation, Trigger, and Optimization.
- Standard presets: 1255 (tracing+default), 1254 (tracing), 1205 (function), 1235 (max), 0 (off).
- Trigger type 5 (hot after N triggers) is the best default — it collects profiling data before compilation.
- Inlining (O=4,5) significantly increases code size and memory usage. Test before enabling.

## Verification

- [ ] CRTO bitmask understood (C, R, T, O meanings)
- [ ] Standard preset selected (1254, 1255, 1205, or 1235)
- [ ] Custom CRTO combination tested with before/after benchmarks
- [ ] CPU optimization level matches deployment architecture
- [ ] Buffer utilization monitored with chosen optimization level
