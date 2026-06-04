## Start with tracing JIT (1254) for all production deployments
---
Category: Configuration
---
Always begin with opcache.jit=1254 (tracing JIT, reduced optimization) as the production starting point. Only switch modes after benchmarking.
---
Reason: Tracing JIT with reduced optimization (1254) has minimal compilation overhead and produces 40-50% less buffer fragmentation than Function JIT. It is the best general-purpose setting.
---
Bad Example:
```ini
opcache.jit=1235 ; Max mode from day one — unnecessary compilation overhead
```

Good Example:
```ini
opcache.jit=1254 ; Tracing JIT — safe starting point
opcache.jit_buffer_size=128M
```
---
Exceptions: Applications known to be function-call-heavy (ORM-heavy, extensive domain logic) may start with 1205.
---
Consequences Of Violation: Higher compilation overhead, increased latency variance, wasted memory from aggressive optimization.

## Never change JIT mode without before/after benchmarking
---
Category: Performance
---
Always benchmark with each JIT mode before adopting it. The difference between 1254, 1205, and 1235 is workload-specific and cannot be predicted.
---
Reason: What works for one application may be worse for another. Mode changes require full OpCache reset. Only change based on measured performance data.
---
Bad Example:
```ini
; Switching to 1235 because "higher is better"
opcache.jit=1235
; No benchmark — might be slower due to compilation overhead
```

Good Example:
```ini
; Benchmark each mode before committing
; 1254: baseline
; 1205: +5% throughput, switch
; 1235: -2% throughput, stay at 1205
```
---
Exceptions: Known CPU-bound homogeneous workloads where industry benchmarks clearly favor a specific mode.
---
Consequences Of Violation: Performance regression, wasted time on suboptimal configuration.

## Use Function JIT (1205) only for method-call-heavy code
---
Category: Performance
---
Prefer Function JIT (1205) exclusively for applications where method calls and function dispatch dominate execution time. Avoid it for loop-heavy workloads.
---
Reason: Function JIT compiles entire functions. For ORM-heavy code with many method calls, this is beneficial. For loop-heavy code (templating, data processing), Tracing JIT produces better results and less fragmentation.
---
Bad Example:
```ini
; Function JIT for Blade template rendering (loop-heavy)
opcache.jit=1205 ; Suboptimal for loops
```

Good Example:
```ini
; Tracing JIT for loop-heavy workloads
opcache.jit=1254 ; Better for templating
```
---
Exceptions: Mixed workloads where both loops and function calls are significant — benchmark to determine the winner.
---
Consequences Of Violation: Lower throughput than possible, 40-50% higher buffer fragmentation.
