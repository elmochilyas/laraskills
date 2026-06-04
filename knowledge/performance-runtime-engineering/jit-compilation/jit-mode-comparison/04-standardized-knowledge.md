# Standardized Knowledge: JIT Mode Comparison

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | JIT Compilation |
| Knowledge Unit | JIT Mode Comparison |
| Difficulty | Foundation |
| Lifecycle | Evaluate, Configure |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

PHP JIT supports four principal modes configured via opcache.jit. The mode determines compilation strategy, memory layout, and optimization aggressiveness. Tracing (1254) and Function (1205) are the most common production modes. On (1235) provides tracing with trace-level optimization. Disabled (0) turns JIT off entirely.

## Core Concepts

- **1255 (Tracing + default)**: Tracing JIT with default optimization. Best general-purpose setting. PHP 8.0 default.
- **1254 (Tracing)**: Tracing JIT with reduced optimization. Lower compilation overhead. Good for mixed workloads.
- **1205 (Function)**: Function JIT with default optimization. Better for method-heavy code with many function calls.
- **1235 (On)**: Tracing JIT with all optimizations. Highest potential gain but highest compilation overhead and memory usage.
- **0 (Disable)**: No JIT compilation. Use when JIT overhead exceeds benefit or when memory is constrained.

## When To Use

- **1254/1255**: Default choice for most production applications
- **1205**: Code with many function calls, ORMs, domain logic
- **1235**: CPU-bound maximum throughput scenarios (batch processing, computation)
- **0**: Memory-constrained environments, I/O-only workloads

## When NOT To Use

- 1235 in latency-sensitive environments (compilation pauses)
- Function mode for loop-heavy code like templating engines
- Disabled (0) when any CPU-bound batch work exists
- Aggressive modes on ARM64 (PHP 8.4+ stability, but test first)

## Best Practices

- **Start with 1254**: Tracing with reduced optimization is the safest production starting point. Compilation overhead is minimal.
- **Benchmark before switching modes**: The difference between modes is workload-specific. Profile your application with each mode.
- **Monitor buffer fragmentation**: Function JIT (1205) fragments more than Tracing JIT (1254). If compaction count is high, switch to tracing.
- **Use 1235 only for CPU-bound batch processing**: The compilation overhead and memory cost of 1235 are only justified when CPU-bound work dominates.

## Architecture Guidelines

- **Tracing JIT**: Identifies hot loop traces and compiles them. Optimizes loops, branches, and repeated execution paths. Better for templating, data processing, and iterative algorithms.
- **Function JIT**: Compiles entire functions when they cross the hot threshold. Better for code with many method calls and predictable call patterns.
- **On Mode (1235)**: Enables all optimizations including inlining. Higher compilation overhead but potentially higher peak performance.

## Performance Considerations

- Tracing JIT compiles traces (loop paths) — good for loop-heavy workloads
- Function JIT compiles entire functions — good for method-call-heavy code
- On mode (1235) has highest compilation overhead — test before using in production
- Buffer fragmentation differs: Tracing JIT fragments 40-50% less than Function JIT

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using 1235 in latency-sensitive environments | Seeking maximum performance | Compilation pauses cause latency spikes | Use 1254 for lower compilation overhead |
| Function JIT for template-heavy apps | Not matching mode to workload | Lower throughput than tracing mode | Default to tracing (1254) for most apps |
| Not testing different modes | Assuming one mode fits all | Suboptimal performance for specific workload | Benchmark with 1254, 1205, and 1235 |
| Disabling JIT entirely | False assumption it doesn't help | Missed optimization opportunities | Enable at 1254 and measure impact |

## Anti-Patterns

- **Changing JIT mode frequently**: Mode changes require full OpCache reset (PHP-FPM restart). Pick a mode and stick with it.
- **Using maximum optimization everywhere**: 1235 has costs (compilation time, memory). Use targeted optimization for specific workloads.
- **Assuming higher CRTO values are always better**: Higher optimization levels compile more aggressively, which can increase latency variance.

## Examples

```ini
; Tracing JIT — recommended starting point
opcache.jit=1254
opcache.jit_buffer_size=128M

; Function JIT — for ORM-heavy applications
opcache.jit=1205
opcache.jit_buffer_size=128M

; Maximum optimization — CPU-bound workloads
opcache.jit=1235
opcache.jit_buffer_size=256M

; Disabled — memory-constrained environments
opcache.jit=0
```

## Related Topics

- JIT Concepts and Terminology
- CRTO Bitmask Reference
- JIT Configuration for Production
- JIT Buffer Sizing Guidelines

## AI Agent Notes

- 1254 (tracing) is the best general-purpose production setting. 1255 is similar but with default optimizations.
- 1205 (function) is for method-call-heavy code. It compiles entire functions rather than loop traces.
- 1235 (on) enables all optimizations but has higher compilation overhead and memory pressure.
- Tracing JIT produces more uniform code segments, reducing fragmentation.

## Verification

- [ ] JIT mode selected based on workload profile
- [ ] Default starting point is 1254 (tracing)
- [ ] Alternative modes benchmarked if workload is function-heavy or CPU-bound
- [ ] Buffer fragmentation monitored daily for first week
- [ ] Mode change coordinated with PHP-FPM restart
