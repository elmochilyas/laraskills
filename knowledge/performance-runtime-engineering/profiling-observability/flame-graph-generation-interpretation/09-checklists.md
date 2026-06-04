# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Profiling & Observability
**Knowledge Unit:** Flame Graph Generation and Interpretation â€” Wide-Frame Identification, Tall-Stack Analysis
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Always compare p50 vs p95**: The difference reveals what breaks under load. Wide frames in p95 that don't exist in p50 are the investigation target.
- [ ] **Generate 10,000+ samples**: For reliable p95 analysis, profile for at least 60 seconds at 100 Hz. Fewer samples produce noisy flame graphs.
- [ ] **Use color to identify type**: Red/orange = CPU-bound (optimize the algorithm). Blue/teal = I/O-bound (optimize the query/cache/network call). Gray = waiting (optimize the dependency).
- [ ] **Look for plateaus**: A flat, wide top indicates a tight loop or repeated operation. Follow the stack below to find the calling code path.
- [ ] **Correlate with deployments**: Store flame graphs alongside deploy events to catch regressions immediately. A sudden new wide frame after a deploy points to the problematic change.
- [ ] Flame graph generated for the target endpoint (60+ seconds at 100 Hz)
- [ ] p50 and p95 flame graphs both generated and compared
- [ ] Widest top frame identified and traced to source code
- [ ] Color checked to determine CPU vs I/O vs wait type
- [ ] Optimization applied and after-flame graph compared to before-flame graph
- [ ] Flame graphs generated with 10,000+ samples using production-safe profiler
- [ ] p50 vs p95 comparison reveals load-dependent bottlenecks
- [ ] Wide top frames identified and traced to source code
- [ ] Optimization validated with before/after differential flame graph
- [ ] Flame graphs stored and correlated with deployment timeline
- [ ] Production-safe profiler selected (eBPF or sampling)
- [ ] 10,000+ stack traces collected (60+ seconds at 100 Hz)
- [ ] p50 and p95 flame graphs compared
- [ ] Wide top frames identified as self-time hotspots
- [ ] Color used to determine CPU vs I/O vs wait type

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Sampling vs Instrumentation**: Sampling profilers (Xdebug, Tideways, eBPF) have low overhead (1-3%) and are safe for production but provide statistical approximation. Instrumented profilers (Blackfire, Xdebug trace mode) provide exact measurements but have 10-30% overhead Ã¢â‚¬â€ development/staging only.
- [ ] **Production vs Staging profiling**: Profile in production for authentic results but with sampling only. Use heavier instrumentation in staging with production-like traffic. The production profile is the ground truth Ã¢â‚¬â€ always validate staging findings against production.
- [ ] **Sampling pipeline**: Timer signal (SIGPROF at 49-100 Hz) â†’ interrupt PHP execution â†’ capture execute_data stack trace â†’ aggregate samples â†’ render SVG.
- [ ] **Profiling tiers**: Production monitoring (APM) â†’ identify slow endpoints â†’ flame graph generation â†’ wide-frame identification â†’ call graph analysis â†’ source-level profiling â†’ fix â†’ verify with same flame graph comparison.
- [ ] **Flame graph tools**: Brendan Gregg's FlameGraph (perl scripts), SPX (built-in), Blackfire (built-in), Tideways (built-in), Xdebug + KCacheGrind. Each has different SVG output format.
- [ ] **Differential flame graphs**: Two flame graphs overlaid â€” red = new or wider frames (regression), blue = narrower frames (improvement). Color-coded before/after comparison.
- [ ] Document and follow through on architectural decision: Flame graph generation method
- [ ] Ensure architecture aligns with core concept: **Generation**: Stack samples collected at 49-100 Hz (SIGPROF timer), aggregated by stack trace, sorted by frequency, rendered as SVG with color representing CPU (red) vs I/O (blue) vs wait (gray).
- [ ] Ensure architecture aligns with core concept: **Wide-frame interpretation**: Wide top frame = self-time hotspot (optimize the function). Wide bottom frame with many children = architectural delegation (optimize the children).
- [ ] Ensure architecture aligns with core concept: **Tall-stack interpretation**: Stacks >20 frames indicate deep call chains â€” common in framework-heavy applications (Laravel middleware â†’ controller â†’ service â†’ repository â†’ Eloquent â†’ PDO).
- [ ] Ensure architecture aligns with core concept: **p50 vs p95 comparison**: Generate separate flame graphs for fast vs slow requests. Difference reveals queue buildup, GC spikes, lock contention, and cache misses under load.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Always compare p50 vs p95**: The difference reveals what breaks under load. Wide frames in p95 that don't exist in p50 are the investigation target.
- [ ] **Generate 10,000+ samples**: For reliable p95 analysis, profile for at least 60 seconds at 100 Hz. Fewer samples produce noisy flame graphs.
- [ ] **Use color to identify type**: Red/orange = CPU-bound (optimize the algorithm). Blue/teal = I/O-bound (optimize the query/cache/network call). Gray = waiting (optimize the dependency).
- [ ] **Look for plateaus**: A flat, wide top indicates a tight loop or repeated operation. Follow the stack below to find the calling code path.
- [ ] **Correlate with deployments**: Store flame graphs alongside deploy events to catch regressions immediately. A sudden new wide frame after a deploy points to the problematic change.

# Performance Checklist (from 04/06)
- [ ] Sampling overhead: Xdebug 3-5%, Blackfire 10-25% (staging only), Tideways/SPX 1-5% (production-safe), eBPF <1% (production ideal)
- [ ] SVG file size: 100KB-5MB depending on sample count and stack depth
- [ ] Generation time: ~1-5 seconds for 60 seconds of profiling data
- [ ] Rendering: Modern browsers handle flame graph SVGs smoothly up to ~10MB
- [ ] Differential flame graphs: require two profile datasets (before/after) â€” no additional runtime cost
- [ ] Xdebug (sampling)
- [ ] Blackfire
- [ ] Tideways
- [ ] eBPF

# Security Checklist (from 04/06 - only if relevant)
- [ ] Flame graphs expose internal code paths, function names, and file paths â€” restrict access to authorized personnel
- [ ] Production profiling data should be stored with the same sensitivity as application logs
- [ ] Never expose raw flame graph SVG files on public endpoints or dashboards
- [ ] eBPF profiling requires CAP_BPF or root â€” restrict access accordingly
- [ ] Differential flame graphs may reveal which optimizations were applied â€” could leak business strategy

# Reliability Checklist (from 04/05/06)
- [ ] **Observer effect**: Profiling overhead alters application behavior. Symptom: Production profiling with heavy tools shows different performance profile than normal. Mitigation: Use low-overhead (<3%) profilers for production. Accept statistical approximation.
- [ ] **Profiling bias**: Timing signals in sampling profilers correlate with application intervals. Symptom: Under- or over-representation of certain code paths. Mitigation: Use random sampling intervals, vary sampling frequency.
- [ ] **Flame graph misinterpretation**: Wide bottom frames misidentified as bottlenecks. Symptom: Optimizing the wrong function. Mitigation: Always check whether width is self-time or inclusive. Wide bottom frame with many children = potentially architectural.
- [ ] **Production profiling safety**: Use sampling profilers (1-3% overhead) in production. Never use instrumentation profilers on live traffic. eBPF is ideal for production-zero overhead.
- [ ] **Alert-driven profiling**: Trigger flame graph capture automatically when latency crosses threshold. Store profiles for post-mortem analysis.
- [ ] **Profiling cadence**: Continuous profiling (Tideways/Blackfire) for baseline. On-demand deep profiling (Xdebug) for specific investigations.
- [ ] **Data retention**: Store flame graphs for 30 days minimum. Correlate with deploy events to identify performance regressions.

# Testing Checklist (from 04/06)
- [ ] Flame graph generated for the target endpoint (60+ seconds at 100 Hz)
- [ ] p50 and p95 flame graphs both generated and compared
- [ ] Widest top frame identified and traced to source code
- [ ] Color checked to determine CPU vs I/O vs wait type
- [ ] Optimization applied and after-flame graph compared to before-flame graph
- [ ] Differential flame graph generated (before/after overlay) for clear validation
- [ ] Flame graph SVGs stored with restricted access (not publicly accessible)
- [ ] Production profiling overhead measured and within acceptable range (<3%)
- [ ] Flame graphs generated with 10,000+ samples using production-safe profiler
- [ ] p50 vs p95 comparison reveals load-dependent bottlenecks
- [ ] Wide top frames identified and traced to source code
- [ ] Optimization validated with before/after differential flame graph
- [ ] Flame graphs stored and correlated with deployment timeline
- [ ] Production-safe profiler selected (eBPF or sampling)
- [ ] 10,000+ stack traces collected (60+ seconds at 100 Hz)
- [ ] p50 and p95 flame graphs compared
- [ ] Wide top frames identified as self-time hotspots
- [ ] Color used to determine CPU vs I/O vs wait type
- [ ] Flame graphs correlated with deployment timeline

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Always compare p50 vs p95**: The difference reveals what breaks under load. Wide frames in p95 that don't exist in p50 are the investigation target.
- [ ] **Generate 10,000+ samples**: For reliable p95 analysis, profile for at least 60 seconds at 100 Hz. Fewer samples produce noisy flame graphs.
- [ ] **Use color to identify type**: Red/orange = CPU-bound (optimize the algorithm). Blue/teal = I/O-bound (optimize the query/cache/network call). Gray = waiting (optimize the dependency).
- [ ] **Look for plateaus**: A flat, wide top indicates a tight loop or repeated operation. Follow the stack below to find the calling code path.
- [ ] **Correlate with deployments**: Store flame graphs alongside deploy events to catch regressions immediately. A sudden new wide frame after a deploy points to the problematic change.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Focusing only on wide top frames
- [ ] Avoid: Insufficient samples
- [ ] Avoid: Ignoring p95 flame graphs
- [ ] Avoid: Misinterpreting bottom-wide frames
- [ ] Avoid: Using Xdebug in production
- [ ] Avoid anti-pattern: **Profiling without a hypothesis**: Generate flame graphs with a specific question (e.g., "why is /api/reports slow under load?"). Exploratory flame graph browsing is less productive.
- [ ] Avoid anti-pattern: **Over-relying on a single flame graph**: Application behavior changes with load, cache state, and code paths. Profile multiple endpoints at multiple traffic levels.
- [ ] Avoid anti-pattern: **Tuning based on flame graphs alone**: Flame graphs show where time is spent, not why. Combine with source code analysis, query logs, and cache metrics for root cause.
- [ ] Avoid anti-pattern: **Ignoring the Y-axis**: Tall stacks aren't always bad, but consistently tall stacks across the graph indicate framework overhead. Consider middleware reduction or service consolidation.
- [ ] Guard against anti-pattern: Production Profiling Without Overhead Control
- [ ] Guard against anti-pattern: Firefighting Without Flame Graphs
- [ ] Guard against anti-pattern: Observability Without Traces
- [ ] Guard against anti-pattern: Dashboards Without Actionable Alerts
- [ ] Guard against anti-pattern: Ignoring Memory Profiling (CPU-Only Focus)

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Production profiling safety**: Use sampling profilers (1-3% overhead) in production. Never use instrumentation profilers on live traffic. eBPF is ideal for production-zero overhead.
- [ ] **Alert-driven profiling**: Trigger flame graph capture automatically when latency crosses threshold. Store profiles for post-mortem analysis.
- [ ] **Profiling cadence**: Continuous profiling (Tideways/Blackfire) for baseline. On-demand deep profiling (Xdebug) for specific investigations.
- [ ] **Data retention**: Store flame graphs for 30 days minimum. Correlate with deploy events to identify performance regressions.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Generation**: Stack samples collected at 49-100 Hz (SIGPROF timer), aggregated by stack trace, sorted by frequency, rendered as SVG with color representing CPU (red) vs I/O (blue) vs wait (gray)., **Wide-frame interpretation**: Wide top frame = self-time hotspot (optimize the function). Wide bottom frame with many children = architectural delegation (optimize the children)., **Tall-stack interpretation**: Stacks >20 frames indicate deep call chains â€” common in framework-heavy applications (Laravel middleware â†’ controller â†’ service â†’ repository â†’ Eloquent â†’ PDO)., **p50 vs p95 comparison**: Generate separate flame graphs for fast vs slow requests. Difference reveals queue buildup, GC spikes, lock contention, and cache misses under load.
**Skills:** Inclusive vs Exclusive Time Analysis, Callgraph Analysis Techniques, eBPF PHP Profiling, Production Guardrails and Profiling Cost
**Decision Trees:** Flame graph generation method
**Anti-Patterns:** Production Profiling Without Overhead Control, Firefighting Without Flame Graphs, Observability Without Traces, Dashboards Without Actionable Alerts, Ignoring Memory Profiling (CPU-Only Focus)
**Related Topics:** Inclusive vs Exclusive Time Analysis, Callgraph Analysis Techniques, eBPF PHP Profiling, Production Guardrails and Profiling Cost, Performance Regression Detection

