# Rules: Performance Profiling & Bottleneck Detection

## Rule PP-01: Profile before and after every optimization
**Condition:** Before starting any performance optimization work.
**Action:** Capture a baseline profile of the target endpoint under realistic load. After optimization, capture a comparison profile. Verify improvement and check for regressions.
**Consequence:** Every optimization is data-driven and quantified. No changes made without evidence.

## Rule PP-02: Use APM for always-on monitoring; profiling for deep dives
**Condition:** When setting up performance tooling.
**Action:** Keep APM (always-on, <5% overhead) for continuous monitoring. Use profiling (5-15% overhead) for targeted investigations triggered by APM alerts.
**Consequence:** Continuous coverage without continuous overhead.

## Rule PP-03: Profile on production-like infrastructure
**Condition:** When profiling for production performance analysis.
**Action:** Profile on staging hardware that matches production CPU, memory, and storage characteristics. Use production-like data volume and concurrency.
**Consequence:** Profile results accurately reflect production behavior.

## Rule PP-04: Set CI performance budgets with 20% headroom
**Condition:** When configuring CI-based performance regression detection.
**Action:** Set metric thresholds at baseline + 20%. Allow normal variance without false failures. Review and update budgets quarterly.
**Consequence:** CI catches real regressions without flaky failures.

## Rule PP-05: Compare wall-clock time vs CPU time to identify I/O bottlenecks
**Condition:** When analyzing profile results.
**Action:** If wall-clock time significantly exceeds CPU time (>2x), the bottleneck is I/O (database queries, HTTP calls, file system). Shift investigation to query analysis or network tracing.
**Consequence:** Correctly identifies whether the issue is compute-bound or I/O-bound.

## Rule PP-06: Never run instrumenting profilers in production continuously
**Condition:** When profiling in production environments.
**Action:** Use sampling profilers (XHProf, Tideways) for production. Reserve instrumenting profilers (Blackfire full mode) for development and staging.
**Consequence:** Production profiling overhead kept under 3%.

## Rule PP-07: Secure profiling trigger endpoints with admin authentication
**Condition:** When exposing on-demand profiling endpoints.
**Action:** Guard with admin middleware. Require explicit authorization per profiling session. Log all profiling trigger events.
**Consequence:** Profiling access is audited and controlled.

## Rule PP-08: Monitor memory usage during profiling sessions
**Condition:** When running profiler in any environment.
**Action:** Track peak memory usage during profiling. Alert if memory exceeds 80% of available limit.
**Consequence:** Profiler itself does not cause OOM.

## Rule PP-09: Focus optimization on functions with highest inclusive time
**Condition:** When identifying optimization targets from flame graphs.
**Action:** Target functions that appear as widest blocks in the flame graph (highest inclusive time). Micro-optimizing narrow blocks yields negligible improvement.
**Consequence:** Optimization effort focused on highest-impact targets.
