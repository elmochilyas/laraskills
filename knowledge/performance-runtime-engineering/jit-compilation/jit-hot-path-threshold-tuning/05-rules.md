## Use default JIT thresholds (64/100) for initial configuration
---
Category: Configuration
---
Start with default jit_hot_loop=64 and jit_hot_func=100. Only adjust after profiling confirms a need.
---
Reason: Default thresholds are balanced for most workloads. Lowering thresholds increases compilation overhead and buffer pressure. Raising them delays hot-path optimization. Profile before changing.
---
Bad Example:
```ini
; Arbitrarily lowered thresholds without profiling
jit_hot_loop=4
jit_hot_func=10 ; Excessive compilation, buffer thrashing
```

Good Example:
```ini
; Default thresholds first
; jit_hot_loop=64 (default)
; jit_hot_func=100 (default)
```
---
Exceptions: High-turnover FPM environments (low pm.max_requests) where workers recycle before JIT reaches steady state.
---
Consequences Of Violation: Excessive compilation, buffer thrashing, increased latency from compilation pauses.

## Lower thresholds in long-running processes for faster warm-up
---
Category: Performance
---
Use lower jit_hot_func and jit_hot_loop values in Octane, Swoole, or FrankenPHP to accelerate JIT warm-up.
---
Reason: In persistent workers, the one-time compilation cost is amortized over thousands of requests. Lower thresholds mean faster warm-up with negligible long-term cost.
---
Bad Example:
```ini
; Same thresholds for FPM and Octane
jit_hot_func=100 ; Octane worker takes 100 requests to warm up
```

Good Example:
```ini
; Lower thresholds for Octane workers
jit_hot_func=50  ; Half the warm-up time
jit_hot_loop=16  ; Faster loop compilation
```
---
Exceptions: PHP-FPM with low pm.max_requests where compilation cost is never amortized.
---
Consequences Of Violation: 100+ cold requests per worker before JIT reaches steady state.
