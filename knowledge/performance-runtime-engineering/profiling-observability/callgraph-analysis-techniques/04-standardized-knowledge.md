# Standardized Knowledge: Callgraph Analysis Techniques — Call Tree, Callee Map, Hot Path Identification

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Profiling & Observability |
| Knowledge Unit | Callgraph Analysis Techniques — Call Tree, Callee Map, Hot Path Identification |
| Difficulty | Intermediate |
| Lifecycle | Diagnose, Optimize |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Callgraph analysis visualizes the tree of function calls with cost annotations. Primary views: call tree (top-down from entry point, showing parent→child relationships with inclusive time), callee map (bottom-up, showing which functions call a given function and how much they cost), and hot path (the most expensive code path from entry to leaf). Together they answer "what is slow?" and "why is it slow?"

## Core Concepts

- **Call tree (top-down)**: Start at entry point (index.php / artisan / controller). Expand children by inclusive time. The most expensive child is the hot path. A 500ms request showing `index.php → Kernel::handle → Router::dispatch → UserController::show → User::get() → Builder::first() → PDO::query()` (450ms) reveals the bottleneck clearly.
- **Callee map (bottom-up)**: Start at a leaf function (e.g., `PDOStatement::execute`). Show all callers, each with its cost contribution. Reveals if a slow query is called from multiple places.
- **Hot path identification**: The single most expensive path from entry to leaf. Follow the most expensive child at each level. Usually reveals the root cause within 3-5 clicks.
- **Weighted cost**: A function with 50ms called once is less significant than a function with 10ms called 1000 times (10,000ms total). Always account for call frequency.

## When To Use

- Investigating a specific slow endpoint identified by APM monitoring
- Determining whether a bottleneck is database-bound, application-bound, or I/O-bound
- Comparing before/after optimization impact
- Onboarding to an unfamiliar codebase — identify the most expensive code paths quickly
- Validating that a fix addresses the root cause and not a symptom

## When NOT To Use

- As a replacement for flame graphs (flame graphs show aggregate across requests; callgraphs show per-request detail)
- When the slow endpoint is not reproducible (callgraph data is only as good as the profiling run)
- Without a specific hypothesis — exploratory callgraph analysis is less productive than hypothesis-driven investigation
- When profiling overhead alters the performance profile enough to change the hot path

## Best Practices

- **Always follow the hot path**: Sort by inclusive time descending, double-click the most expensive function, repeat until you reach a leaf with high exclusive time. That leaf is your optimization target.
- **Check call count**: A function with high inclusive time called once is different from one called in a loop. Weighted cost (cost × call count) reveals loop-bound bottlenecks.
- **Use both top-down and bottom-up**: Top-down finds the hot path. Bottom-up reveals if a slow leaf is called from multiple places — a sign that caching or batching could help.
- **Combine with flame graphs**: Use flame graphs for aggregate overview across requests. Use callgraph analysis for per-request, detailed investigation of specific endpoints.
- **Profile under realistic load**: Callgraph analysis of a single request under no load may miss contention effects visible only under saturation.

## Architecture Guidelines

- **Tooling**: KCacheGrind (Linux), QCacheGrind (cross-platform), WebGrind (web-based) for Xdebug cachegrind files. Blackfire and Tideways provide built-in callgraph views in their dashboards.
- **Callgraph data pipeline**: Profiler → cachegrind file / API → callgraph viewer → hot path identification → source code → fix → re-profile
- **Sampling vs instrumentation callgraphs**: Sampling profilers produce statistical callgraphs (approximate counts). Instrumentation profilers produce exact callgraphs (precise counts but higher overhead).
- **Integration with CI**: Blackfire SDK can compare callgraphs in CI pipelines — fail a build if a hot path exceeds a threshold.

## Performance Considerations

- Callgraph generation is a post-processing step — no runtime overhead beyond the profiler itself
- Large callgraphs (thousands of unique functions) may take 5-30 seconds to render in KCacheGrind/QCacheGrind
- Cachegrind file size: 100KB-10MB depending on profile duration and call complexity
- Instrumentation-based callgraphs (Blackfire) have 10-25% overhead — staging only
- Sampling-based callgraphs (Xdebug 3, Tideways, SPX) have 1-5% overhead — production-safe

## Security

- Callgraphs expose full function names, file paths, and call arguments — restrict access to authorized personnel
- Cachegrind files should be stored with the same sensitivity as application logs
- Never expose callgraph viewer endpoints (WebGrind) without authentication
- Production profiling data may reveal proprietary business logic paths

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Ignoring call count in callgraph | Focusing only on inclusive time per call | Miss loop-bound bottlenecks where small cost × many calls dominates | Always view weighted cost (cost × call count) |
| Stopping at the first expensive function | Assuming widest frame is the root cause | Optimizing a symptom instead of the root cause | Follow the hot path: expand children until you reach a leaf with high exclusive time |
| Using callgraphs without flame graphs | Tunnel vision on one request | Missing aggregate patterns visible only across many requests | Use flame graphs for aggregate overview, callgraphs for detailed investigation |
| Comparing callgraphs from different profilers | Mixing sampling vs instrumentation data | Incomparable metrics (statistical vs exact) | Always use the same profiler and configuration for before/after comparisons |

## Anti-Patterns

- **Callgraph fishing**: Opening a callgraph and randomly clicking functions without a hypothesis. Always start with the slowest endpoint and follow the hot path systematically.
- **Ignoring the framework layer**: Framework functions (Laravel service providers, middleware) often appear as wide frames. Don't dismiss them — they represent real overhead that may be cacheable or deferrable.
- **Single-request analysis**: One request's callgraph may not represent typical behavior. Profile the same endpoint multiple times under different conditions (cache warm, cache cold, under load).

## Examples

```bash
# Generate cachegrind file with Xdebug 3
php -d xdebug.mode=profile -d xdebug.output_dir=/tmp script.php

# Open in KCacheGrind
kcachegrind /tmp/cachegrind.out.*

# Hot path exploration steps:
# 1. Open call tree tab
# 2. Sort by "Incl. Time" descending
# 3. Double-click the top function
# 4. Repeat until leaf function has high "Self Time"
# 5. That function is your optimization target

# Check weighted cost in KCacheGrind:
# Right-click column header → enable "Called" and "Avg. Cost"
# Calculate weighted cost = Called × Avg. Cost
```

## Related Topics

- Inclusive vs Exclusive Time Analysis
- Flame Graph Generation and Interpretation
- Slow Query Identification from SQL
- Xdebug Profiling Setup and Analysis
- Blackfire Installation and Triggered Profiling

## AI Agent Notes

- Hot path = follow the most expensive child at each level until you hit a leaf with high self time
- Call count is critical — a fast function called 10,000 times may be the real bottleneck
- Always use the same profiler for before/after comparisons
- For framework-heavy applications (Laravel), expect deep call stacks — don't stop at the framework layer
- Combine callgraph analysis with flame graph overview for comprehensive understanding

## Verification

- [ ] Cachegrind file generated for the slow endpoint under investigation
- [ ] Call tree viewed in KCacheGrind/QCacheGrind or equivalent tool
- [ ] Hot path identified: entry → most expensive child → ... → leaf with high self time
- [ ] Call count checked to identify loop-bound bottlenecks (weighted cost)
- [ ] Callee map used to check if slow leaf is called from multiple places
- [ ] Optimization applied and new callgraph compared to baseline
- [ ] Hot path confirmed eliminated or significantly reduced in new profile
- [ ] Before/after callgraphs generated with same profiler configuration
