# Standardized Knowledge: Flame Graphs

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Profiling & Observability |
| Knowledge Unit | Flame Graphs |
| Difficulty | Intermediate |
| Lifecycle | Diagnose, Optimize |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Flame graphs visualize stack traces as a flame-like SVG where the X-axis spans stack frequency (width = time proportion) and Y-axis spans stack depth (call chain depth). Wide frames at the top indicate time sinks. Tall stacks indicate deep call chains and indirection overhead. Comparing p50 vs p95 flame graphs reveals what changes under load saturation.

## Core Concepts

- **Generation**: Stack samples collected at 49-100 Hz, aggregated by stack trace, sorted by frequency, rendered as SVG with color representing CPU (red) vs I/O (blue) vs wait.
- **Wide-frame interpretation**: A wide bottom frame means the function and all its children consume significant time. A wide top frame means the function itself is doing the work (self time).
- **Tall-stack interpretation**: Stacks >20 frames indicate deep call chains — common in framework-heavy applications (Laravel middleware → controller → service → repository → Eloquent → PDO).
- **p50 vs p95 comparison**: Separate flame graphs for fast vs slow requests reveal queue buildup, garbage collection spikes, and lock contention under load.

## When To Use

- Diagnosing production latency regressions
- Identifying CPU hotspots and I/O wait patterns
- Comparing fast vs slow request profiles
- Validating optimization impact before/after
- Onboarding to an unfamiliar codebase

## When NOT To Use

- As a replacement for APM transaction traces (flame graphs show aggregate, not individual requests)
- On systems without sampling profiler access (requires SIGPROF or eBPF)
- When profiling overhead (1-5%) is unacceptable during peak hours
- Without enough samples (<1000 stacks produces unreliable visualization)

## Best Practices

- **Always compare p50 vs p95**: The difference reveals what breaks under load. Identify wide frames in p95 that don't exist in p50.
- **Use sampling profilers for production**: Xdebug (3-5% overhead) for staging only. Blackfire (10-25%) for on-demand. Tideways/SPX (1-5%) for continuous. eBPF (<1%) for zero-overhead production.
- **Collect 10,000+ samples**: For reliable p95 analysis, run profiling for at least 60 seconds at 100 Hz. Fewer samples produce noisy flame graphs.
- **Correlate with deployments**: Store flame graphs alongside deploy events to catch regressions immediately.

## Architecture Guidelines

- **Sampling pipeline**: Timer signal (SIGPROF at 49-100 Hz) → interrupt PHP execution → capture execute_data stack trace → aggregate samples → render SVG.
- **Profiling tiers**: Production monitoring (APM) → identify slow endpoints → flame graph generation → wide-frame identification → call graph analysis → source-level profiling → fix → verify with same flame graph comparison.
- **eBPF profiling**: Attaches kprobes to Zend VM dispatch functions from kernel space — zero PHP configuration, kernel-level accuracy, but Linux-only.

## Performance Considerations

- Sampling overhead: Xdebug 3-5%, Blackfire 10-25%, Tideways/SPX 1-5%, eBPF <1%
- SVG files: 100K-5MB depending on sample count and stack depth
- Generation time: ~1-5 seconds for 60 seconds of profiling data
- Differential flame graphs (before/after) provide the clearest optimization validation

## Security

- Flame graphs may expose internal code paths and function names — restrict access to authorized personnel
- Production profiling data should be stored with the same sensitivity as logs
- Never expose raw flame graph SVG files on public endpoints
- eBPF profiling requires CAP_BPF or root — restrict access accordingly

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Focusing only on wide top frames | Assuming all width is self-time | Miss architectural issues in deep call chains | Check whether width is self-time or inclusive |
| Using Xdebug in production | Convenience, familiarity | 50-200% slowdown, altered performance profile | Use sampling profilers (<5% overhead) for production |
| Insufficient samples | Impatience, short profiling window | Noisy, unreliable flame graphs | Profile for 60+ seconds at 100 Hz (6000+ samples) |
| Ignoring p95 flame graphs | Only looking at average | Missing saturation effects (GC, queue buildup) | Always generate and compare p50 vs p95 flame graphs |

## Anti-Patterns

- **Profiling without a hypothesis**: Generate flame graphs with a specific question (e.g., "why is /api/reports slow under load?"). Exploratory profiling is less productive.
- **Over-relying on a single flame graph**: Application behavior changes with load, cache state, and code paths. Profile multiple endpoints at multiple traffic levels.
- **Tuning based on flame graphs alone**: Flame graphs show where time is spent, not why. Combine with source code analysis, query logs, and cache metrics for root cause.

## Examples

```bash
# Generate flame graph with Xdebug
php -d xdebug.mode=profile -d xdebug.output_dir=/tmp script.php
# Use KCacheGrind or WebGrind to visualize

# Generate flame graph with SPX (web UI at /?SPX_KEY=profile)
# Navigate to SPX UI, select endpoint, click profile

# eBPF with bpftrace
bpftrace -e 'profile:hz:99 { @[ustack(100)] = count(); }'
```

## Related Topics

- Inclusive vs Exclusive Time Analysis
- Callgraph Analysis Techniques
- eBPF PHP Profiling
- Production Guardrails and Profiling Cost
- Performance Regression Detection

## AI Agent Notes

- Wide top frames = optimization targets (self time hotspots)
- Wide bottom frames = architectural issues (expensive sub-trees)
- Tall stacks = indirection overhead (framework abstraction cost)
- p50 vs p95 comparison is the most powerful diagnostic technique
- eBPF is preferred for production profiling (zero overhead, no configuration)
- Always correlate flame graphs with deployment timeline

## Verification

- [ ] Flame graph generation tooling installed and configured (SPX/Tideways/Blackfire)
- [ ] p50 and p95 flame graphs generated for at least one slow endpoint
- [ ] Wide top frames identified and traced to source code
- [ ] Optimization applied and before/after flame graphs compared
- [ ] Production profiling overhead measured and within acceptable range (<3%)
- [ ] Profiling data access restricted to authorized personnel
