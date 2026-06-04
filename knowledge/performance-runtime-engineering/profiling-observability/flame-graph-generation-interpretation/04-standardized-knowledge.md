# Standardized Knowledge: Flame Graph Generation and Interpretation — Wide-Frame Identification, Tall-Stack Analysis

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Profiling & Observability |
| Knowledge Unit | Flame Graph Generation and Interpretation — Wide-Frame Identification, Tall-Stack Analysis |
| Difficulty | Intermediate |
| Lifecycle | Diagnose, Optimize |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Flame graphs visualize stack traces as a flame-like SVG: X-axis spans stack frequency (width = time proportion), Y-axis spans stack depth (call chain depth). Wide frames at the top indicate time sinks (functions consuming CPU/IO). Tall stacks indicate deep call chains (indirection overhead). Compare p50 vs p95 flame graphs to identify what changes under load saturation.

## Core Concepts

- **Generation**: Stack samples collected at 49-100 Hz (SIGPROF timer), aggregated by stack trace, sorted by frequency, rendered as SVG with color representing CPU (red) vs I/O (blue) vs wait (gray).
- **Wide-frame interpretation**: Wide top frame = self-time hotspot (optimize the function). Wide bottom frame with many children = architectural delegation (optimize the children).
- **Tall-stack interpretation**: Stacks >20 frames indicate deep call chains — common in framework-heavy applications (Laravel middleware → controller → service → repository → Eloquent → PDO).
- **p50 vs p95 comparison**: Generate separate flame graphs for fast vs slow requests. Difference reveals queue buildup, GC spikes, lock contention, and cache misses under load.

## When To Use

- Diagnosing production latency regressions
- Identifying CPU hotspots vs I/O wait patterns
- Comparing fast vs slow request profiles to find what breaks under load
- Validating optimization impact with before/after flame graphs
- Onboarding to an unfamiliar codebase — identify the most expensive code paths visually

## When NOT To Use

- As a replacement for APM transaction traces (flame graphs show aggregate, not individual requests)
- On systems without sampling profiler access (requires SIGPROF, eBPF, or instrumentation profiler)
- When profiling overhead (1-5%) is unacceptable during peak hours
- Without enough samples (<1000 stacks produces noisy, unreliable visualization)
- For per-request debugging — use callgraph analysis instead

## Best Practices

- **Always compare p50 vs p95**: The difference reveals what breaks under load. Wide frames in p95 that don't exist in p50 are the investigation target.
- **Generate 10,000+ samples**: For reliable p95 analysis, profile for at least 60 seconds at 100 Hz. Fewer samples produce noisy flame graphs.
- **Use color to identify type**: Red/orange = CPU-bound (optimize the algorithm). Blue/teal = I/O-bound (optimize the query/cache/network call). Gray = waiting (optimize the dependency).
- **Look for plateaus**: A flat, wide top indicates a tight loop or repeated operation. Follow the stack below to find the calling code path.
- **Correlate with deployments**: Store flame graphs alongside deploy events to catch regressions immediately. A sudden new wide frame after a deploy points to the problematic change.

## Architecture Guidelines

- **Sampling pipeline**: Timer signal (SIGPROF at 49-100 Hz) → interrupt PHP execution → capture execute_data stack trace → aggregate samples → render SVG.
- **Profiling tiers**: Production monitoring (APM) → identify slow endpoints → flame graph generation → wide-frame identification → call graph analysis → source-level profiling → fix → verify with same flame graph comparison.
- **Flame graph tools**: Brendan Gregg's FlameGraph (perl scripts), SPX (built-in), Blackfire (built-in), Tideways (built-in), Xdebug + KCacheGrind. Each has different SVG output format.
- **Differential flame graphs**: Two flame graphs overlaid — red = new or wider frames (regression), blue = narrower frames (improvement). Color-coded before/after comparison.

## Performance Considerations

- Sampling overhead: Xdebug 3-5%, Blackfire 10-25% (staging only), Tideways/SPX 1-5% (production-safe), eBPF <1% (production ideal)
- SVG file size: 100KB-5MB depending on sample count and stack depth
- Generation time: ~1-5 seconds for 60 seconds of profiling data
- Rendering: Modern browsers handle flame graph SVGs smoothly up to ~10MB
- Differential flame graphs: require two profile datasets (before/after) — no additional runtime cost

## Security

- Flame graphs expose internal code paths, function names, and file paths — restrict access to authorized personnel
- Production profiling data should be stored with the same sensitivity as application logs
- Never expose raw flame graph SVG files on public endpoints or dashboards
- eBPF profiling requires CAP_BPF or root — restrict access accordingly
- Differential flame graphs may reveal which optimizations were applied — could leak business strategy

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Focusing only on wide top frames | Assuming all width is self-time | Miss architectural issues in deep call chains | Check whether width is self-time or inclusive |
| Insufficient samples | Impatience, short profiling window | Noisy, unreliable flame graphs | Profile for 60+ seconds at 100 Hz (6000+ samples) |
| Ignoring p95 flame graphs | Only looking at average traffic | Missing saturation effects (GC, queue buildup) | Always generate and compare p50 vs p95 flame graphs |
| Misinterpreting bottom-wide frames | Assuming wide = important to optimize | Optimizing delegation pattern instead of actual work | Wide bottom with children = check children, not parent |
| Using Xdebug in production | Convenience, familiarity | 50-200% slowdown, altered profile | Use sampling profilers (<5% overhead) for production |

## Anti-Patterns

- **Profiling without a hypothesis**: Generate flame graphs with a specific question (e.g., "why is /api/reports slow under load?"). Exploratory flame graph browsing is less productive.
- **Over-relying on a single flame graph**: Application behavior changes with load, cache state, and code paths. Profile multiple endpoints at multiple traffic levels.
- **Tuning based on flame graphs alone**: Flame graphs show where time is spent, not why. Combine with source code analysis, query logs, and cache metrics for root cause.
- **Ignoring the Y-axis**: Tall stacks aren't always bad, but consistently tall stacks across the graph indicate framework overhead. Consider middleware reduction or service consolidation.

## Examples

```bash
# Generate flame graph data with Xdebug 3
php -d xdebug.mode=profile -d xdebug.output_dir=/tmp script.php
# Convert to flame graph SVG using FlameGraph tools
stackcollapse-xdebug /tmp/cachegrind.out.* > /tmp/out.folded
flamegraph.pl /tmp/out.folded > /tmp/flame.svg

# SPX built-in flame graph
# Navigate to SPX UI → select profile → click "Flame Graph" tab

# eBPF flame graph with bpftrace
bpftrace -e 'profile:hz:99 { @[ustack(100)] = count(); }'
# Process output with FlameGraph tools

# Triage steps:
# 1. Identify widest top frame → self-time hotspot
# 2. Follow stack below → which code path calls it
# 3. Check color → CPU (red) or I/O (blue) or wait (gray)
# 4. Compare p50 vs p95 → what appears in p95 that's not in p50
# 5. Target function identified → open source code → optimize
```

## Related Topics

- Inclusive vs Exclusive Time Analysis
- Callgraph Analysis Techniques
- eBPF PHP Profiling
- Production Guardrails and Profiling Cost
- Performance Regression Detection

## AI Agent Notes

- Wide top frame = self-time hotspot (optimization target)
- Wide bottom frame = architectural delegation (optimize children)
- Tall stack = framework indirection overhead
- p50 vs p95 comparison is the most powerful diagnostic technique — reveals what breaks under load
- Red = CPU-bound, Blue = I/O-bound, Gray = wait
- Always correlate flame graphs with deployment timeline to catch regressions
- eBPF is preferred for production profiling (zero overhead, no configuration)

## Verification

- [ ] Flame graph generated for the target endpoint (60+ seconds at 100 Hz)
- [ ] p50 and p95 flame graphs both generated and compared
- [ ] Widest top frame identified and traced to source code
- [ ] Color checked to determine CPU vs I/O vs wait type
- [ ] Optimization applied and after-flame graph compared to before-flame graph
- [ ] Differential flame graph generated (before/after overlay) for clear validation
- [ ] Flame graph SVGs stored with restricted access (not publicly accessible)
- [ ] Production profiling overhead measured and within acceptable range (<3%)
