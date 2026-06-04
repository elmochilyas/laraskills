# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Profiling & Observability
**Knowledge Unit:** Inclusive vs Exclusive Time Analysis â€” Self vs Total Memory in Call Graphs
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Apply the 20% heuristic**: If exclusive > 20% of inclusive, optimize the function itself. If exclusive < 20%, optimize its callees. This is a starting point â€” validate with source code analysis.
- [ ] **Always check call count**: A function with 50ms inclusive called once is less impactful than a function with 10ms called 1000 times. Use weighted cost (cost Ã— call count) to identify loop-bound bottlenecks.
- [ ] **Compare inclusive vs exclusive for memory too**: High inclusive memory with low exclusive memory = memory allocated in callees (database results, collection transformations). Optimize the data volume, not the caller.
- [ ] **Look at the ratio, not just the absolute**: A controller with 500ms inclusive and 5ms exclusive (1% self) is purely a delegator. Optimize its children. A low-level utility with 5ms inclusive and 4ms exclusive (80% self) is worth optimizing directly.
- [ ] Cachegrind or equivalent data generated for the target endpoint
- [ ] Functions sorted by inclusive time descending (bottleneck identification)
- [ ] Self time checked for each top function (optimization target identification)
- [ ] 20% heuristic applied: self/inclusive ratio calculated for top 5 functions
- [ ] Call count reviewed to identify loop-bound bottlenecks
- [ ] Top bottlenecks identified by inclusive time
- [ ] Optimization target identified by self/inclusive >20% ratio
- [ ] Loop-bound bottlenecks surfaced via weighted cost
- [ ] Memory analysis applied when profiling memory allocation
- [ ] Fix verified with before/after profile showing reduced exclusive time
- [ ] Functions sorted by inclusive time descending
- [ ] Self/inclusive ratio calculated for top 5 functions
- [ ] 20% heuristic applied â€” target identified
- [ ] Call count checked for loop-bound bottlenecks
- [ ] Hot path followed to leaf with highest self time
- [ ] Memory inclusive/exclusive analyzed if relevant

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Sampling vs Instrumentation**: Sampling profilers (Xdebug, Tideways, eBPF) have low overhead (1-3%) and are safe for production but provide statistical approximation. Instrumented profilers (Blackfire, Xdebug trace mode) provide exact measurements but have 10-30% overhead Ã¢â‚¬â€ development/staging only.
- [ ] **Production vs Staging profiling**: Profile in production for authentic results but with sampling only. Use heavier instrumentation in staging with production-like traffic. The production profile is the ground truth Ã¢â‚¬â€ always validate staging findings against production.
- [ ] **Call graph structure**: Root (entry point) â†’ layers of delegation â†’ leaf functions. Inclusive time accumulates from leaves to root. Exclusive time is measured only at each node.
- [ ] **Flame graph correspondence**: In flame graphs, the width of each frame represents inclusive time (self + children). A wide frame at the bottom with many children = delegator (high inclusive, low exclusive). A wide tip frame = high self-time (high exclusive).
- [ ] **Memory profiling parallel**: The same inclusive/exclusive distinction applies to memory. A service that fetches large datasets and passes them through has high inclusive memory but low exclusive memory â€” the problem is the query, not the service.
- [ ] Document and follow through on architectural decision: Inclusive vs exclusive time for optimization
- [ ] Ensure architecture aligns with core concept: **Inclusive time**: Total wall time from function entry to exit. Includes all nested calls. Example: `getUserData()` = 200ms inclusive, 5ms exclusive (195ms spent in sub-calls: query, transform, cache).
- [ ] Ensure architecture aligns with core concept: **Exclusive time (self time)**: Time spent executing the function's own instructions, excluding called functions. The true measure of a function's own work.
- [ ] Ensure architecture aligns with core concept: **Call count**: How many times a function is called. High call count with low per-call cost can still be significant. Example: `strtolower()` called 10,000 times at 0.5Âµs each = 5ms total.
- [ ] Ensure architecture aligns with core concept: **Memory metrics**: Inclusive memory = memory allocated by function + callees. Exclusive memory = memory allocated by function only. High inclusive + low exclusive = leaking in callees.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Apply the 20% heuristic**: If exclusive > 20% of inclusive, optimize the function itself. If exclusive < 20%, optimize its callees. This is a starting point â€” validate with source code analysis.
- [ ] **Always check call count**: A function with 50ms inclusive called once is less impactful than a function with 10ms called 1000 times. Use weighted cost (cost Ã— call count) to identify loop-bound bottlenecks.
- [ ] **Compare inclusive vs exclusive for memory too**: High inclusive memory with low exclusive memory = memory allocated in callees (database results, collection transformations). Optimize the data volume, not the caller.
- [ ] **Look at the ratio, not just the absolute**: A controller with 500ms inclusive and 5ms exclusive (1% self) is purely a delegator. Optimize its children. A low-level utility with 5ms inclusive and 4ms exclusive (80% self) is worth optimizing directly.

# Performance Checklist (from 04/06)
- [ ] Inclusive/exclusive time calculation is a post-processing step â€” no runtime overhead
- [ ] Sampling profilers approximate inclusive/exclusive based on sample counts; more samples = more accurate
- [ ] Instrumentation profilers (Blackfire) measure exact inclusive/exclusive times
- [ ] Flame graphs show inclusive time visually â€” must check tooltip data for exclusive breakdown
- [ ] Cachegrind files store both metrics; most viewers can display either or both
- [ ] Xdebug (sampling)
- [ ] Blackfire
- [ ] Tideways
- [ ] eBPF

# Security Checklist (from 04/06 - only if relevant)
- [ ] Inclusive/exclusive analysis does not introduce new security concerns beyond those of the profiler used
- [ ] Function-level timing data may reveal business logic paths â€” restrict access to authorized personnel
- [ ] Memory allocation patterns can reveal data volume and potentially sensitive data processing

# Reliability Checklist (from 04/05/06)
- [ ] **Observer effect**: Profiling overhead alters application behavior. Symptom: Production profiling with heavy tools shows different performance profile than normal. Mitigation: Use low-overhead (<3%) profilers for production. Accept statistical approximation.
- [ ] **Profiling bias**: Timing signals in sampling profilers correlate with application intervals. Symptom: Under- or over-representation of certain code paths. Mitigation: Use random sampling intervals, vary sampling frequency.
- [ ] **Flame graph misinterpretation**: Wide bottom frames misidentified as bottlenecks. Symptom: Optimizing the wrong function. Mitigation: Always check whether width is self-time or inclusive. Wide bottom frame with many children = potentially architectural.
- [ ] **Production profiling safety**: Use sampling profilers (1-3% overhead) in production. Never use instrumentation profilers on live traffic. eBPF is ideal for production-zero overhead.
- [ ] **Alert-driven profiling**: Trigger flame graph capture automatically when latency crosses threshold. Store profiles for post-mortem analysis.
- [ ] **Profiling cadence**: Continuous profiling (Tideways/Blackfire) for baseline. On-demand deep profiling (Xdebug) for specific investigations.
- [ ] **Data retention**: Store flame graphs for 30 days minimum. Correlate with deploy events to identify performance regressions.

# Testing Checklist (from 04/06)
- [ ] Cachegrind or equivalent data generated for the target endpoint
- [ ] Functions sorted by inclusive time descending (bottleneck identification)
- [ ] Self time checked for each top function (optimization target identification)
- [ ] 20% heuristic applied: self/inclusive ratio calculated for top 5 functions
- [ ] Call count reviewed to identify loop-bound bottlenecks
- [ ] Optimization target identified (leaf function with highest self/inclusive ratio)
- [ ] Fix applied and verified with new profile showing reduced exclusive time in target function
- [ ] Top bottlenecks identified by inclusive time
- [ ] Optimization target identified by self/inclusive >20% ratio
- [ ] Loop-bound bottlenecks surfaced via weighted cost
- [ ] Memory analysis applied when profiling memory allocation
- [ ] Fix verified with before/after profile showing reduced exclusive time
- [ ] Functions sorted by inclusive time descending
- [ ] Self/inclusive ratio calculated for top 5 functions
- [ ] 20% heuristic applied â€” target identified
- [ ] Call count checked for loop-bound bottlenecks
- [ ] Hot path followed to leaf with highest self time
- [ ] Memory inclusive/exclusive analyzed if relevant
- [ ] Fix validated with before/after profile

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Apply the 20% heuristic**: If exclusive > 20% of inclusive, optimize the function itself. If exclusive < 20%, optimize its callees. This is a starting point â€” validate with source code analysis.
- [ ] **Always check call count**: A function with 50ms inclusive called once is less impactful than a function with 10ms called 1000 times. Use weighted cost (cost Ã— call count) to identify loop-bound bottlenecks.
- [ ] **Compare inclusive vs exclusive for memory too**: High inclusive memory with low exclusive memory = memory allocated in callees (database results, collection transformations). Optimize the data volume, not the caller.
- [ ] **Look at the ratio, not just the absolute**: A controller with 500ms inclusive and 5ms exclusive (1% self) is purely a delegator. Optimize its children. A low-level utility with 5ms inclusive and 4ms exclusive (80% self) is worth optimizing directly.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Optimizing functions with high inclusive but low exclusive
- [ ] Avoid: Ignoring call count
- [ ] Avoid: Optimizing a leaf function with low exclusive
- [ ] Avoid: Interpreting inclusive time as self-time in flame graphs
- [ ] Avoid anti-pattern: **Exclusive-only focus**: Exclusive time identifies optimization targets, but ignoring inclusive time means you miss identifying which code paths are bottlenecks. Always use both.
- [ ] Avoid anti-pattern: **Per-call optimization without call count**: A 1ms optimization to a function called once saves 1ms. The same optimization to a function called 10,000 times saves 10 seconds. Prioritize by weighted impact.
- [ ] Avoid anti-pattern: **Ignoring the framework's inclusive time**: Framework functions (service providers, middleware) often have high inclusive time. They are delegators â€” optimize what they call, not the framework itself.
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
**Core Concepts:** **Inclusive time**: Total wall time from function entry to exit. Includes all nested calls. Example: `getUserData()` = 200ms inclusive, 5ms exclusive (195ms spent in sub-calls: query, transform, cache)., **Exclusive time (self time)**: Time spent executing the function's own instructions, excluding called functions. The true measure of a function's own work., **Call count**: How many times a function is called. High call count with low per-call cost can still be significant. Example: `strtolower()` called 10,000 times at 0.5Âµs each = 5ms total., **Memory metrics**: Inclusive memory = memory allocated by function + callees. Exclusive memory = memory allocated by function only. High inclusive + low exclusive = leaking in callees.
**Skills:** Callgraph Analysis Techniques, Flame Graph Generation and Interpretation, Slow Query Identification from SQL, Xdebug Profiling Setup and Analysis
**Decision Trees:** Inclusive vs exclusive time for optimization
**Anti-Patterns:** Production Profiling Without Overhead Control, Firefighting Without Flame Graphs, Observability Without Traces, Dashboards Without Actionable Alerts, Ignoring Memory Profiling (CPU-Only Focus)
**Related Topics:** Callgraph Analysis Techniques, Flame Graph Generation and Interpretation, Slow Query Identification from SQL, Xdebug Profiling Setup and Analysis, Production Guardrails and Profiling Cost

