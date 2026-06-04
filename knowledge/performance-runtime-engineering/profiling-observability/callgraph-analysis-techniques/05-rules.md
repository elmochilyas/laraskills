## Always follow the hot path: entry → most expensive child → ... → leaf with high self time
---
Category: Diagnostics
---
Start from the entry point, sort functions by inclusive time descending, double-click the most expensive function, and repeat until you reach a leaf function with high exclusive (self) time — that leaf is your optimization target.
---
Reason: Looking at a callgraph without following the hot path systematically leads to optimizing symptoms rather than root causes. A function at the top may show 80% inclusive time, but 78% of that is spent in a single child function. Without drilling down, you'd optimize the caller and fix 2% of the problem. Following the hot path to the leaf with high self time ensures effort is spent where it provides maximum return.
---
Bad Example:
```text
# Stopping at the first wide frame — optimizing symptoms
getOrderSummary: 450ms incl → "This is slow, optimize it"
# But 440ms is in queryOrders — optimizing getOrderSummary saves 10ms
```

Good Example:
```text
# Follow hot path to leaf
getOrderSummary(450ms) → queryOrders(400ms) → execute(380ms self)
# Optimize execute() — that's where 380ms is actually spent
```
---
Exceptions: When the hot path leads to a framework function that cannot be modified, the optimization target is the caller — reduce how often or how much data the expensive function processes.
---
Consequences Of Violation: Optimization effort misdirected to delegator functions, 10% improvement instead of 80%, wasted engineering time.

## Check call count alongside inclusive time — weighted cost reveals loop-bound bottlenecks
---
Category: Diagnostics
```
View both "Calls" and "Incl. Time" columns in the callgraph — a function with high call count and low per-call cost may dominate total response time through repeated execution.
---
Reason: Inclusive time alone can mislead. A function with 50ms per call called once = 50ms total is less impactful than a function with 5ms per call called 100 times = 500ms total. The weighted cost (cost × call count) reveals loop-bound bottlenecks — database queries in a foreach loop, unnecessary function calls in a hot path, or repeated service container resolutions. These are invisible when looking only at per-call cost.
---
Bad Example:
```text
# Per-call analysis — misses loop-bound bottleneck
strtolower: 0.5ms per call — insignificant
# But called 50,000 times: 25,000ms — 25 seconds!
```

Good Example:
```text
# Weighted cost analysis
strtolower: 0.5ms × 50,000 calls = 25,000ms — TOP priority
PDO::execute: 50ms × 1 call = 50ms — lower priority
```
---
Exceptions: Single-call functions (controllers, services that execute once per request) need not check call count.
---
Consequences Of Violation: Loop-bound bottlenecks overlooked, optimization effort directed at high-per-call-cost-low-call-count functions, suboptimal improvement.

## Use both top-down (call tree) and bottom-up (callee map) views for complete analysis
---
Category: Diagnostics
```
Start with top-down call tree to find the hot path, then switch to bottom-up callee map for each hot leaf to check if it's called from multiple places — this reveals caching and batching opportunities.
---
Reason: The top-down view shows the most expensive code path. The bottom-up view shows all callers of a given function. A slow database query called from one place may be optimized with a better index. The same query called from 10 different places may be better addressed with query caching or a materialized view. The callee map reveals the aggregation pattern that the call tree hides.
---
Bad Example:
```text
# Top-down only — misses aggregation opportunity
# Shows: Controller → slowQuery (100ms)
# You optimize the query — saves 80ms from 1 endpoint
```

Good Example:
```text
# Bottom-up callee map check
# slowQuery(100ms) called from:
#   - Controller A: 40 calls (4000ms) ← called in a loop
#   - Controller B: 1 call (100ms)  ← single call
# Fix the loop in Controller A instead of optimizing the query
```
---
Exceptions: Narrow investigations targeting a single known endpoint may not need the callee map.
---
Consequences Of Violation: Suboptimal optimization — improving a query that should be cached, or caching a query that should be optimized.

## Use the same profiler configuration for before/after comparisons
---
Category: Testing
---
Generate before and after callgraphs using the same profiling tool, the same mode (sampling or instrumentation), and the same sample rate — mixing profilers invalidates the comparison.
---
Reason: Sampling profilers produce statistical callgraphs (approximate counts), while instrumentation profilers produce exact callgraphs. A function showing 45ms in a sampling profiler might show 38ms or 52ms in an instrumentation profiler — not because anything changed, but because the measurement methodology differs. Comparing across profilers introduces systematic error that can show "improvements" or "regressions" that don't exist.
---
Bad Example:
```bash
# Different profilers — invalid comparison
# Before: Xdebug (instrumentation, 200% overhead)
# After: Tideways (sampling, 3% overhead)
# Results not comparable
```

Good Example:
```bash
# Same profiler
# Before: Tideways at 10% sampling
# After: Tideways at 10% sampling — valid comparison
```
---
Exceptions: When migrating profiling tools, establish a 2-week overlap period where both tools run simultaneously to calibrate the baseline.
---
Consequences Of Violation: Invalid before/after comparisons, false conclusions about optimization impact, wasted effort optimizing based on measurement artifacts.

## Profile under realistic load, not a single request in isolation
---
Category: Testing
```
Generate callgraphs under realistic concurrent load (multiple simultaneous requests) — single-request profiling misses contention effects, lock contention, and queuing.
---
Reason: A single request in isolation doesn't experience database connection contention, CPU scheduling competition, or lock waits. The hot path under no load may be entirely different from the hot path under production load. A function that takes 5% of CPU in isolation may take 30% under contention because of lock spinning or connection timeouts. Profile under load to see what performance actually looks like in production.
---
Bad Example:
```bash
# Single request — misses contention effects
# Hot path: Controller → Service → Query (50ms) — clean
```

Good Example:
```bash
# Under concurrent load — reveals contention
# Hot path: Controller → Service → Query (50ms) → Mutex::lock(200ms)
# Lock contention revealed under load
```
---
Exceptions: Profiling to understand basic request flow (not performance) may use single-request callgraphs.
---
Consequences Of Violation: Optimizations based on uncontaminated profiles fail to improve production performance, contention issues remain hidden until they cause incidents.
