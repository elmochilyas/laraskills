# Standardized Knowledge: Inclusive vs Exclusive Time Analysis — Self vs Total Memory in Call Graphs

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Profiling & Observability |
| Knowledge Unit | Inclusive vs Exclusive Time Analysis — Self vs Total Memory in Call Graphs |
| Difficulty | Intermediate |
| Lifecycle | Diagnose, Optimize |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Inclusive time = time a function takes including all functions it calls. Exclusive time = time spent only inside the function itself (not in callees). Inclusive identifies bottlenecks; exclusive identifies optimization targets. A function with high inclusive but low exclusive time is a caller that delegates — optimize the callees. A function with high exclusive time is doing the work directly — optimize that function.

## Core Concepts

- **Inclusive time**: Total wall time from function entry to exit. Includes all nested calls. Example: `getUserData()` = 200ms inclusive, 5ms exclusive (195ms spent in sub-calls: query, transform, cache).
- **Exclusive time (self time)**: Time spent executing the function's own instructions, excluding called functions. The true measure of a function's own work.
- **Call count**: How many times a function is called. High call count with low per-call cost can still be significant. Example: `strtolower()` called 10,000 times at 0.5µs each = 5ms total.
- **Memory metrics**: Inclusive memory = memory allocated by function + callees. Exclusive memory = memory allocated by function only. High inclusive + low exclusive = leaking in callees.

## When To Use

- Determining whether to optimize a function or its callees
- Identifying the true root cause of a bottleneck (not just the symptom)
- Evaluating whether a wide frame in a flame graph is self-time or delegation
- Comparing before/after optimization to verify the fix addresses the right target
- Profiling memory allocation to trace where memory is actually consumed

## When NOT To Use

- When profiling data is not available (need a call graph or flame graph with inclusive/exclusive breakdown)
- When the profiler does not distinguish inclusive from exclusive time (some basic profilers only show total)
- As a replacement for business logic understanding — inclusive/exclusive ratios guide investigation but the fix depends on context

## Best Practices

- **Apply the 20% heuristic**: If exclusive > 20% of inclusive, optimize the function itself. If exclusive < 20%, optimize its callees. This is a starting point — validate with source code analysis.
- **Always check call count**: A function with 50ms inclusive called once is less impactful than a function with 10ms called 1000 times. Use weighted cost (cost × call count) to identify loop-bound bottlenecks.
- **Compare inclusive vs exclusive for memory too**: High inclusive memory with low exclusive memory = memory allocated in callees (database results, collection transformations). Optimize the data volume, not the caller.
- **Look at the ratio, not just the absolute**: A controller with 500ms inclusive and 5ms exclusive (1% self) is purely a delegator. Optimize its children. A low-level utility with 5ms inclusive and 4ms exclusive (80% self) is worth optimizing directly.

## Architecture Guidelines

- **Call graph structure**: Root (entry point) → layers of delegation → leaf functions. Inclusive time accumulates from leaves to root. Exclusive time is measured only at each node.
- **Flame graph correspondence**: In flame graphs, the width of each frame represents inclusive time (self + children). A wide frame at the bottom with many children = delegator (high inclusive, low exclusive). A wide tip frame = high self-time (high exclusive).
- **Memory profiling parallel**: The same inclusive/exclusive distinction applies to memory. A service that fetches large datasets and passes them through has high inclusive memory but low exclusive memory — the problem is the query, not the service.

## Performance Considerations

- Inclusive/exclusive time calculation is a post-processing step — no runtime overhead
- Sampling profilers approximate inclusive/exclusive based on sample counts; more samples = more accurate
- Instrumentation profilers (Blackfire) measure exact inclusive/exclusive times
- Flame graphs show inclusive time visually — must check tooltip data for exclusive breakdown
- Cachegrind files store both metrics; most viewers can display either or both

## Security

- Inclusive/exclusive analysis does not introduce new security concerns beyond those of the profiler used
- Function-level timing data may reveal business logic paths — restrict access to authorized personnel
- Memory allocation patterns can reveal data volume and potentially sensitive data processing

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Optimizing functions with high inclusive but low exclusive | Assuming width = self-time | Wasting effort rewriting a delegator function | Check exclusive time; if <20% of inclusive, optimize the callees |
| Ignoring call count | Focusing only on per-call cost | Missing loop-bound bottlenecks | View weighted cost (cost × call count) |
| Optimizing a leaf function with low exclusive | Not checking if the leaf is a delegator too | Improving 2% of total time instead of 80% | Follow the hot path to the leaf with highest exclusive time |
| Interpreting inclusive time as self-time in flame graphs | Visual bias toward wide frames | Optimizing the wrong architectural layer | Hover over each flame graph frame to check self vs inclusive time |

## Anti-Patterns

- **Exclusive-only focus**: Exclusive time identifies optimization targets, but ignoring inclusive time means you miss identifying which code paths are bottlenecks. Always use both.
- **Per-call optimization without call count**: A 1ms optimization to a function called once saves 1ms. The same optimization to a function called 10,000 times saves 10 seconds. Prioritize by weighted impact.
- **Ignoring the framework's inclusive time**: Framework functions (service providers, middleware) often have high inclusive time. They are delegators — optimize what they call, not the framework itself.

## Examples

```bash
# In KCacheGrind, view Inclusive vs Exclusive:
# 1. Open cachegrind file
# 2. "Flat Profile" tab shows both metrics
# 3. Sort by "Incl. Time" to find bottlenecks
# 4. Check "Self Time" column — if Self < 20% of Incl, look deeper

# Example analysis:
# Function            Incl Time    Self Time    Calls    Self/Incl
# getOrderSummary     450ms        5ms          1        1.1%
#   ├─ queryOrders    400ms        10ms         1        2.5%    ← optimize this
#   │  └─ execute     380ms        380ms        1        100%    ← real target
#   ├─ transform      40ms         15ms         1        37.5%
#   └─ cache          5ms          5ms          1        100%

# Optimization decision:
# getOrderSummary:     450ms incl, 5ms self → optimize callees (queryOrders)
# queryOrders:         400ms incl, 10ms self → optimize callees (execute)
# execute:             380ms incl, 380ms self → OPTIMIZE THIS FUNCTION
```

## Related Topics

- Callgraph Analysis Techniques
- Flame Graph Generation and Interpretation
- Slow Query Identification from SQL
- Xdebug Profiling Setup and Analysis
- Production Guardrails and Profiling Cost

## AI Agent Notes

- Inclusive = bottleneck identification; Exclusive = optimization target
- Heuristic: if self/inclusive < 20%, optimize callees; if > 20%, optimize the function
- Always check call count — weighted cost reveals loop-bound issues
- Flame graph width = inclusive time, not self-time — check tooltip for exclusive breakdown
- The same inclusive/exclusive pattern applies to memory allocation analysis

## Verification

- [ ] Cachegrind or equivalent data generated for the target endpoint
- [ ] Functions sorted by inclusive time descending (bottleneck identification)
- [ ] Self time checked for each top function (optimization target identification)
- [ ] 20% heuristic applied: self/inclusive ratio calculated for top 5 functions
- [ ] Call count reviewed to identify loop-bound bottlenecks
- [ ] Optimization target identified (leaf function with highest self/inclusive ratio)
- [ ] Fix applied and verified with new profile showing reduced exclusive time in target function
