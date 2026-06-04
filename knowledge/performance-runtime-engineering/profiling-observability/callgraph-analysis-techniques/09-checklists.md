# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Profiling & Observability
**Knowledge Unit:** Callgraph Analysis Techniques â€” Call Tree, Callee Map, Hot Path Identification
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Always follow the hot path**: Sort by inclusive time descending, double-click the most expensive function, repeat until you reach a leaf with high exclusive time. That leaf is your optimization target.
- [ ] **Check call count**: A function with high inclusive time called once is different from one called in a loop. Weighted cost (cost Ã— call count) reveals loop-bound bottlenecks.
- [ ] **Use both top-down and bottom-up**: Top-down finds the hot path. Bottom-up reveals if a slow leaf is called from multiple places â€” a sign that caching or batching could help.
- [ ] **Combine with flame graphs**: Use flame graphs for aggregate overview across requests. Use callgraph analysis for per-request, detailed investigation of specific endpoints.
- [ ] **Profile under realistic load**: Callgraph analysis of a single request under no load may miss contention effects visible only under saturation.
- [ ] Cachegrind file generated for the slow endpoint under investigation
- [ ] Call tree viewed in KCacheGrind/QCacheGrind or equivalent tool
- [ ] Hot path identified: entry â†’ most expensive child â†’ ... â†’ leaf with high self time
- [ ] Call count checked to identify loop-bound bottlenecks (weighted cost)
- [ ] Callee map used to check if slow leaf is called from multiple places
- [ ] Hot path traced from entry to leaf with high self time
- [ ] Weighted cost calculated for all candidate functions
- [ ] Loop-bound bottlenecks identified via call count
- [ ] Callee map reveals multi-caller patterns
- [ ] Optimization target confirmed with source annotation
- [ ] Before/after profile validates the fix
- [ ] Call tree opened and sorted by inclusive time
- [ ] Hot path followed to leaf with high self time (3-5 clicks)
- [ ] Call count checked for loop-bound bottlenecks
- [ ] Callee map used for multi-caller analysis

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Sampling vs Instrumentation**: Sampling profilers (Xdebug, Tideways, eBPF) have low overhead (1-3%) and are safe for production but provide statistical approximation. Instrumented profilers (Blackfire, Xdebug trace mode) provide exact measurements but have 10-30% overhead Ã¢â‚¬â€ development/staging only.
- [ ] **Production vs Staging profiling**: Profile in production for authentic results but with sampling only. Use heavier instrumentation in staging with production-like traffic. The production profile is the ground truth Ã¢â‚¬â€ always validate staging findings against production.
- [ ] **Tooling**: KCacheGrind (Linux), QCacheGrind (cross-platform), WebGrind (web-based) for Xdebug cachegrind files. Blackfire and Tideways provide built-in callgraph views in their dashboards.
- [ ] **Callgraph data pipeline**: Profiler â†’ cachegrind file / API â†’ callgraph viewer â†’ hot path identification â†’ source code â†’ fix â†’ re-profile
- [ ] **Sampling vs instrumentation callgraphs**: Sampling profilers produce statistical callgraphs (approximate counts). Instrumentation profilers produce exact callgraphs (precise counts but higher overhead).
- [ ] **Integration with CI**: Blackfire SDK can compare callgraphs in CI pipelines â€” fail a build if a hot path exceeds a threshold.
- [ ] Document and follow through on architectural decision: Callgraph analysis approach
- [ ] Ensure architecture aligns with core concept: **Call tree (top-down)**: Start at entry point (index.php / artisan / controller). Expand children by inclusive time. The most expensive child is the hot path. A 500ms request showing `index.php â†’ Kernel::handle â†’ Router::dispatch â†’ UserController::show â†’ User::get() â†’ Builder::first() â†’ PDO::query()` (450ms) reveals the bottleneck clearly.
- [ ] Ensure architecture aligns with core concept: **Callee map (bottom-up)**: Start at a leaf function (e.g., `PDOStatement::execute`). Show all callers, each with its cost contribution. Reveals if a slow query is called from multiple places.
- [ ] Ensure architecture aligns with core concept: **Hot path identification**: The single most expensive path from entry to leaf. Follow the most expensive child at each level. Usually reveals the root cause within 3-5 clicks.
- [ ] Ensure architecture aligns with core concept: **Weighted cost**: A function with 50ms called once is less significant than a function with 10ms called 1000 times (10,000ms total). Always account for call frequency.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Always follow the hot path**: Sort by inclusive time descending, double-click the most expensive function, repeat until you reach a leaf with high exclusive time. That leaf is your optimization target.
- [ ] **Check call count**: A function with high inclusive time called once is different from one called in a loop. Weighted cost (cost Ã— call count) reveals loop-bound bottlenecks.
- [ ] **Use both top-down and bottom-up**: Top-down finds the hot path. Bottom-up reveals if a slow leaf is called from multiple places â€” a sign that caching or batching could help.
- [ ] **Combine with flame graphs**: Use flame graphs for aggregate overview across requests. Use callgraph analysis for per-request, detailed investigation of specific endpoints.
- [ ] **Profile under realistic load**: Callgraph analysis of a single request under no load may miss contention effects visible only under saturation.

# Performance Checklist (from 04/06)
- [ ] Callgraph generation is a post-processing step â€” no runtime overhead beyond the profiler itself
- [ ] Large callgraphs (thousands of unique functions) may take 5-30 seconds to render in KCacheGrind/QCacheGrind
- [ ] Cachegrind file size: 100KB-10MB depending on profile duration and call complexity
- [ ] Instrumentation-based callgraphs (Blackfire) have 10-25% overhead â€” staging only
- [ ] Sampling-based callgraphs (Xdebug 3, Tideways, SPX) have 1-5% overhead â€” production-safe
- [ ] Xdebug (sampling)
- [ ] Blackfire
- [ ] Tideways
- [ ] eBPF

# Security Checklist (from 04/06 - only if relevant)
- [ ] Callgraphs expose full function names, file paths, and call arguments â€” restrict access to authorized personnel
- [ ] Cachegrind files should be stored with the same sensitivity as application logs
- [ ] Never expose callgraph viewer endpoints (WebGrind) without authentication
- [ ] Production profiling data may reveal proprietary business logic paths

# Reliability Checklist (from 04/05/06)
- [ ] **Observer effect**: Profiling overhead alters application behavior. Symptom: Production profiling with heavy tools shows different performance profile than normal. Mitigation: Use low-overhead (<3%) profilers for production. Accept statistical approximation.
- [ ] **Profiling bias**: Timing signals in sampling profilers correlate with application intervals. Symptom: Under- or over-representation of certain code paths. Mitigation: Use random sampling intervals, vary sampling frequency.
- [ ] **Flame graph misinterpretation**: Wide bottom frames misidentified as bottlenecks. Symptom: Optimizing the wrong function. Mitigation: Always check whether width is self-time or inclusive. Wide bottom frame with many children = potentially architectural.
- [ ] **Production profiling safety**: Use sampling profilers (1-3% overhead) in production. Never use instrumentation profilers on live traffic. eBPF is ideal for production-zero overhead.
- [ ] **Alert-driven profiling**: Trigger flame graph capture automatically when latency crosses threshold. Store profiles for post-mortem analysis.
- [ ] **Profiling cadence**: Continuous profiling (Tideways/Blackfire) for baseline. On-demand deep profiling (Xdebug) for specific investigations.
- [ ] **Data retention**: Store flame graphs for 30 days minimum. Correlate with deploy events to identify performance regressions.

# Testing Checklist (from 04/06)
- [ ] Cachegrind file generated for the slow endpoint under investigation
- [ ] Call tree viewed in KCacheGrind/QCacheGrind or equivalent tool
- [ ] Hot path identified: entry â†’ most expensive child â†’ ... â†’ leaf with high self time
- [ ] Call count checked to identify loop-bound bottlenecks (weighted cost)
- [ ] Callee map used to check if slow leaf is called from multiple places
- [ ] Optimization applied and new callgraph compared to baseline
- [ ] Hot path confirmed eliminated or significantly reduced in new profile
- [ ] Before/after callgraphs generated with same profiler configuration
- [ ] Hot path traced from entry to leaf with high self time
- [ ] Weighted cost calculated for all candidate functions
- [ ] Loop-bound bottlenecks identified via call count
- [ ] Callee map reveals multi-caller patterns
- [ ] Optimization target confirmed with source annotation
- [ ] Before/after profile validates the fix
- [ ] Call tree opened and sorted by inclusive time
- [ ] Hot path followed to leaf with high self time (3-5 clicks)
- [ ] Call count checked for loop-bound bottlenecks
- [ ] Callee map used for multi-caller analysis
- [ ] Source annotation viewed for exact line-level cost
- [ ] Fix applied and verified with new profile

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Always follow the hot path**: Sort by inclusive time descending, double-click the most expensive function, repeat until you reach a leaf with high exclusive time. That leaf is your optimization target.
- [ ] **Check call count**: A function with high inclusive time called once is different from one called in a loop. Weighted cost (cost Ã— call count) reveals loop-bound bottlenecks.
- [ ] **Use both top-down and bottom-up**: Top-down finds the hot path. Bottom-up reveals if a slow leaf is called from multiple places â€” a sign that caching or batching could help.
- [ ] **Combine with flame graphs**: Use flame graphs for aggregate overview across requests. Use callgraph analysis for per-request, detailed investigation of specific endpoints.
- [ ] **Profile under realistic load**: Callgraph analysis of a single request under no load may miss contention effects visible only under saturation.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Ignoring call count in callgraph
- [ ] Avoid: Stopping at the first expensive function
- [ ] Avoid: Using callgraphs without flame graphs
- [ ] Avoid: Comparing callgraphs from different profilers
- [ ] Avoid anti-pattern: **Callgraph fishing**: Opening a callgraph and randomly clicking functions without a hypothesis. Always start with the slowest endpoint and follow the hot path systematically.
- [ ] Avoid anti-pattern: **Ignoring the framework layer**: Framework functions (Laravel service providers, middleware) often appear as wide frames. Don't dismiss them â€” they represent real overhead that may be cacheable or deferrable.
- [ ] Avoid anti-pattern: **Single-request analysis**: One request's callgraph may not represent typical behavior. Profile the same endpoint multiple times under different conditions (cache warm, cache cold, under load).
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
**Core Concepts:** **Call tree (top-down)**: Start at entry point (index.php / artisan / controller). Expand children by inclusive time. The most expensive child is the hot path. A 500ms request showing `index.php â†’ Kernel::handle â†’ Router::dispatch â†’ UserController::show â†’ User::get() â†’ Builder::first() â†’ PDO::query()` (450ms) reveals the bottleneck clearly., **Callee map (bottom-up)**: Start at a leaf function (e.g., `PDOStatement::execute`). Show all callers, each with its cost contribution. Reveals if a slow query is called from multiple places., **Hot path identification**: The single most expensive path from entry to leaf. Follow the most expensive child at each level. Usually reveals the root cause within 3-5 clicks., **Weighted cost**: A function with 50ms called once is less significant than a function with 10ms called 1000 times (10,000ms total). Always account for call frequency.
**Skills:** Inclusive vs Exclusive Time Analysis, Flame Graph Generation and Interpretation, Slow Query Identification from SQL, Xdebug Profiling Setup and Analysis
**Decision Trees:** Callgraph analysis approach
**Anti-Patterns:** Production Profiling Without Overhead Control, Firefighting Without Flame Graphs, Observability Without Traces, Dashboards Without Actionable Alerts, Ignoring Memory Profiling (CPU-Only Focus)
**Related Topics:** Inclusive vs Exclusive Time Analysis, Flame Graph Generation and Interpretation, Slow Query Identification from SQL, Xdebug Profiling Setup and Analysis, Blackfire Installation and Triggered Profiling

