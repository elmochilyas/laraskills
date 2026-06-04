## Read flame graphs bottom-up — focus on wide frames
---
Category: Performance
---
Analyze flame graphs by reading the bottom (most frequent callers) upward. Focus optimization effort on the widest frames at every level.
---
Reason: The bottom of the flame graph shows the functions that are actively consuming CPU. Wide frames at the top show which high-level operations are slow. The width of each frame is proportional to time spent. Narrow frames at the top are unlikely optimization targets.
---
Bad Example:
```php
// Optimizing a narrow frame at the top (1% of width)
// While a wide frame at the bottom (40% of width) is the real target
```

Good Example:
```bash
# Identify the widest frames in the flame graph
# These represent the functions consuming the most CPU time
# Optimize those first
```
---
Exceptions: Memory profiling flame graphs where allocation frequency (not CPU width) is the metric.
---
Consequences Of Violation: Optimization effort on low-impact functions, real bottleneck unaddressed.

## Differentiate inclusive vs exclusive time before optimizing
---
Category: Performance
---
Always distinguish between inclusive time (function + all callees) and exclusive time (function body only) when analyzing profiles.
---
Reason: A function with high inclusive time may be slow because its callees are slow, not because the function itself is inefficient. Optimizing the function's own code when the cost is in its children is wasted effort. Exclusive time reveals the function's own CPU cost.
---
Bad Example:
```php
// Optimizing render() because inclusive time is high
// Problem was actually in the database query render() calls
```

Good Example:
```php
// Exclusive time shows render() is 5ms but DB::query() is 45ms
// Optimize the query, not render()
```
---
Exceptions: Functions with no callees where inclusive and exclusive time are the same.
---
Consequences Of Violation: Wasted optimization effort on functions whose cost is entirely in their callees.
