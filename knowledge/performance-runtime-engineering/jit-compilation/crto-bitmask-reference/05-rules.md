## Use standard CRTO presets — never create arbitrary combinations
---
Category: Configuration
---
Always use standard CRTO presets (1254, 1255, 1205, 1235). Custom CRTO values are rarely needed and can produce invalid combinations.
---
Reason: Each CRTO digit (C, R, T, O) selects from enumerated options. Not all combinations make sense. Standard presets have been tested across thousands of deployments. Custom values risk disabling JIT entirely (e.g., 0 in trigger position).
---
Bad Example:
```ini
; Arbitrary CRTO — may disable JIT
opcache.jit=0205 ; Trigger=0 = never trigger JIT
```

Good Example:
```ini
; Standard presets cover 95% of use cases
opcache.jit=1254 ; Tracing, general purpose
```
---
Exceptions: Workloads with specific requirements that have been benchmarked against standard presets.
---
Consequences Of Violation: JIT disabled unintentionally, suboptimal compilation behavior.

## Use graph coloring (R=2) for CPU-bound, linear scan (R=1) for balanced
---
Category: Performance
---
Select register allocation mode based on workload: R=2 (graph coloring) for CPU-heavy, R=1 (linear scan) for balanced.
---
Reason: Graph coloring produces 5-15% faster native code but compiles 2-3x slower than linear scan. For CPU-bound workloads, the faster output justifies compilation time. For mixed workloads, linear scan is sufficient.
---
Bad Example:
```ini
; Graph coloring on a latency-sensitive API
opcache.jit=1254 ; R=2 by default
; Compilation pauses impact request latency
```

Good Example:
```ini
; Linear scan for latency-sensitive workloads
opcache.jit=1251 ; CPU=1, Register=2, Trigger=5, Optimize=1
```
---
Exceptions: Standard 1254 is fine for most use cases. Only customize R value when compilation time is a measured concern.
---
Consequences Of Violation: 2-3x slower compilation with graph coloring, unnecessary for non-CPU-bound workloads.
