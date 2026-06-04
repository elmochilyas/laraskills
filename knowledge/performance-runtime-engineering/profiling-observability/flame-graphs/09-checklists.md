# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Profiling & Observability
**Knowledge Unit:** Flame Graphs
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Always compare p50 vs p95**: The difference reveals what breaks under load. Identify wide frames in p95 that don't exist in p50.
- [ ] **Use sampling profilers for production**: Xdebug (3-5% overhead) for staging only. Blackfire (10-25%) for on-demand. Tideways/SPX (1-5%) for continuous. eBPF (<1%) for zero-overhead production.
- [ ] **Collect 10,000+ samples**: For reliable p95 analysis, run profiling for at least 60 seconds at 100 Hz. Fewer samples produce noisy flame graphs.
- [ ] **Correlate with deployments**: Store flame graphs alongside deploy events to catch regressions immediately.
- [ ] Flame graph generation tooling installed and configured (SPX/Tideways/Blackfire)
- [ ] p50 and p95 flame graphs generated for at least one slow endpoint
- [ ] Wide top frames identified and traced to source code
- [ ] Optimization applied and before/after flame graphs compared
- [ ] Production profiling overhead measured and within acceptable range (<3%)
- [ ] Flame graphs generated with 10,000+ samples using production-safe profiler
- [ ] p50 vs p95 comparison reveals load-dependent bottlenecks
- [ ] Wide frames correctly interpreted by position (top = self, bottom = delegation)
- [ ] Flame graphs correlated with deployment timeline
- [ ] Optimization validated with before/after comparison
- [ ] Production-safe profiler selected (<3% overhead)
- [ ] 10,000+ samples collected (60+ seconds at 100 Hz)
- [ ] p50 and p95 flame graphs generated and compared
- [ ] Wide top frames identified as self-time hotspots
- [ ] Before/after optimization flame graphs show improvement
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Sampling pipeline**: Timer signal (SIGPROF at 49-100 Hz) â†’ interrupt PHP execution â†’ capture execute_data stack trace â†’ aggregate samples â†’ render SVG.
- [ ] **Profiling tiers**: Production monitoring (APM) â†’ identify slow endpoints â†’ flame graph generation â†’ wide-frame identification â†’ call graph analysis â†’ source-level profiling â†’ fix â†’ verify with same flame graph comparison.
- [ ] **eBPF profiling**: Attaches kprobes to Zend VM dispatch functions from kernel space â€” zero PHP configuration, kernel-level accuracy, but Linux-only.
- [ ] Document and follow through on architectural decision: When to use flame graphs
- [ ] Ensure architecture aligns with core concept: **Generation**: Stack samples collected at 49-100 Hz, aggregated by stack trace, sorted by frequency, rendered as SVG with color representing CPU (red) vs I/O (blue) vs wait.
- [ ] Ensure architecture aligns with core concept: **Wide-frame interpretation**: A wide bottom frame means the function and all its children consume significant time. A wide top frame means the function itself is doing the work (self time).
- [ ] Ensure architecture aligns with core concept: **Tall-stack interpretation**: Stacks >20 frames indicate deep call chains â€” common in framework-heavy applications (Laravel middleware â†’ controller â†’ service â†’ repository â†’ Eloquent â†’ PDO).
- [ ] Ensure architecture aligns with core concept: **p50 vs p95 comparison**: Separate flame graphs for fast vs slow requests reveal queue buildup, garbage collection spikes, and lock contention under load.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Always compare p50 vs p95**: The difference reveals what breaks under load. Identify wide frames in p95 that don't exist in p50.
- [ ] **Use sampling profilers for production**: Xdebug (3-5% overhead) for staging only. Blackfire (10-25%) for on-demand. Tideways/SPX (1-5%) for continuous. eBPF (<1%) for zero-overhead production.
- [ ] **Collect 10,000+ samples**: For reliable p95 analysis, run profiling for at least 60 seconds at 100 Hz. Fewer samples produce noisy flame graphs.
- [ ] **Correlate with deployments**: Store flame graphs alongside deploy events to catch regressions immediately.

# Performance Checklist (from 04/06)
- [ ] Sampling overhead: Xdebug 3-5%, Blackfire 10-25%, Tideways/SPX 1-5%, eBPF <1%
- [ ] SVG files: 100K-5MB depending on sample count and stack depth
- [ ] Generation time: ~1-5 seconds for 60 seconds of profiling data
- [ ] Differential flame graphs (before/after) provide the clearest optimization validation
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] Flame graphs may expose internal code paths and function names â€” restrict access to authorized personnel
- [ ] Production profiling data should be stored with the same sensitivity as logs
- [ ] Never expose raw flame graph SVG files on public endpoints
- [ ] eBPF profiling requires CAP_BPF or root â€” restrict access accordingly

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Flame graph generation tooling installed and configured (SPX/Tideways/Blackfire)
- [ ] p50 and p95 flame graphs generated for at least one slow endpoint
- [ ] Wide top frames identified and traced to source code
- [ ] Optimization applied and before/after flame graphs compared
- [ ] Production profiling overhead measured and within acceptable range (<3%)
- [ ] Profiling data access restricted to authorized personnel
- [ ] Flame graphs generated with 10,000+ samples using production-safe profiler
- [ ] p50 vs p95 comparison reveals load-dependent bottlenecks
- [ ] Wide frames correctly interpreted by position (top = self, bottom = delegation)
- [ ] Flame graphs correlated with deployment timeline
- [ ] Optimization validated with before/after comparison
- [ ] Production-safe profiler selected (<3% overhead)
- [ ] 10,000+ samples collected (60+ seconds at 100 Hz)
- [ ] p50 and p95 flame graphs generated and compared
- [ ] Wide top frames identified as self-time hotspots
- [ ] Before/after optimization flame graphs show improvement

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Always compare p50 vs p95**: The difference reveals what breaks under load. Identify wide frames in p95 that don't exist in p50.
- [ ] **Use sampling profilers for production**: Xdebug (3-5% overhead) for staging only. Blackfire (10-25%) for on-demand. Tideways/SPX (1-5%) for continuous. eBPF (<1%) for zero-overhead production.
- [ ] **Collect 10,000+ samples**: For reliable p95 analysis, run profiling for at least 60 seconds at 100 Hz. Fewer samples produce noisy flame graphs.
- [ ] **Correlate with deployments**: Store flame graphs alongside deploy events to catch regressions immediately.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Focusing only on wide top frames
- [ ] Avoid: Using Xdebug in production
- [ ] Avoid: Insufficient samples
- [ ] Avoid: Ignoring p95 flame graphs
- [ ] Avoid anti-pattern: **Profiling without a hypothesis**: Generate flame graphs with a specific question (e.g., "why is /api/reports slow under load?"). Exploratory profiling is less productive.
- [ ] Avoid anti-pattern: **Over-relying on a single flame graph**: Application behavior changes with load, cache state, and code paths. Profile multiple endpoints at multiple traffic levels.
- [ ] Avoid anti-pattern: **Tuning based on flame graphs alone**: Flame graphs show where time is spent, not why. Combine with source code analysis, query logs, and cache metrics for root cause.
- [ ] Guard against anti-pattern: Production Profiling Without Overhead Control
- [ ] Guard against anti-pattern: Firefighting Without Flame Graphs
- [ ] Guard against anti-pattern: Observability Without Traces
- [ ] Guard against anti-pattern: Dashboards Without Actionable Alerts
- [ ] Guard against anti-pattern: Ignoring Memory Profiling (CPU-Only Focus)
- [ ] Sampling rate <= 10%
- [ ] Profiler CPU < 3%

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Generation**: Stack samples collected at 49-100 Hz, aggregated by stack trace, sorted by frequency, rendered as SVG with color representing CPU (red) vs I/O (blue) vs wait., **Wide-frame interpretation**: A wide bottom frame means the function and all its children consume significant time. A wide top frame means the function itself is doing the work (self time)., **Tall-stack interpretation**: Stacks >20 frames indicate deep call chains â€” common in framework-heavy applications (Laravel middleware â†’ controller â†’ service â†’ repository â†’ Eloquent â†’ PDO)., **p50 vs p95 comparison**: Separate flame graphs for fast vs slow requests reveal queue buildup, garbage collection spikes, and lock contention under load.
**Skills:** Inclusive vs Exclusive Time Analysis, Callgraph Analysis Techniques, eBPF PHP Profiling, Production Guardrails and Profiling Cost
**Decision Trees:** When to use flame graphs
**Anti-Patterns:** Production Profiling Without Overhead Control, Firefighting Without Flame Graphs, Observability Without Traces, Dashboards Without Actionable Alerts, Ignoring Memory Profiling (CPU-Only Focus)
**Related Topics:** Inclusive vs Exclusive Time Analysis, Callgraph Analysis Techniques, eBPF PHP Profiling, Production Guardrails and Profiling Cost, Performance Regression Detection

