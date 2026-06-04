## Always compare p50 vs p95 flame graphs — the difference reveals what breaks under load
---
Category: Diagnostics
---
Generate separate flame graphs for p50 (fast) and p95 (slow) requests and compare them — new wide frames in the p95 graph that don't exist in the p50 graph reveal the root cause of latency degradation under load.
---
Reason: Fast requests and slow requests often follow different code paths or experience different conditions. The p50 flame graph shows normal operation. The p95 flame graph shows what happens when the system is under stress. Comparing them reveals load-dependent issues: garbage collection spikes that only trigger under memory pressure, lock contention that only appears under concurrency, queuing that only builds up when workers are saturated, and database connection waits that only happen when the pool is exhausted.
---
Bad Example:
```text
# p50-only analysis — misses load-dependent issues
# p50: Controller → Query (45ms) — looks fine
```

Good Example:
```text
# p50 vs p95 comparison
# p50: Controller → Query (45ms)
# p95: Controller → Query (50ms) → GC::collect(300ms)
# GC spike triggers only at p95 — revealed by comparison
```
---
Exceptions: Single-user applications (CLI tools) where load variance doesn't apply need only one flame graph.
---
Consequences Of Violation: Load-dependent bottlenecks (GC, lock contention, queuing) remain invisible until they cause production incidents.

## Use sampling profilers (<3% overhead) for production flame graphs — never Xdebug in production
---
Category: Monitoring
---
Select Tideways, SPX, or eBPF (<3% overhead) for production flame graph generation — never use Xdebug's instrumentation mode in production (50-200% overhead).
---
Reason: Xdebug profiling instruments every function call, recording entry and exit times. This 50-200% overhead fundamentally alters the application's performance profile — code paths that are normally fast appear relatively faster compared to the inflated baseline, while I/O wait appears proportionally smaller. The flame graph from Xdebug in production shows Xdebug's impact, not the application's performance. Sampling profilers approximate the same data with 1-5% overhead, providing production-realistic flame graphs.
---
Bad Example:
```bash
# Xdebug in production — 50-200% overhead, unreliable profile
php -d xdebug.mode=profile script.php
```

Good Example:
```bash
# Production-safe profilers
# Tideways: 1-5% overhead, continuous sampling
# SPX: <5% overhead, on-demand
# eBPF: <0.5% overhead, kernel-level
```
---
Exceptions: Development and staging environments where overhead is acceptable may use Xdebug for its detailed instrumentation data.
---
Consequences Of Violation: Production performance profile from Xdebug is unreliable, shows Xdebug's overhead not application performance, leads to incorrect optimization decisions.

## Collect 10,000+ samples (60 seconds at 100 Hz) for reliable flame graphs
---
Category: Testing
```
Profile for a minimum of 60 seconds at 100 Hz sampling frequency to collect at least 6000 stack traces before generating production flame graphs.
---
Reason: Flame graphs are stack trace distribution visualizations. With too few samples, the distribution is noisy — rare but important code paths may not appear at all, and the width of common frames is imprecise. A 5-second profile at 100 Hz collects 500 traces — functions that execute once per 100 requests have a 99.3% chance of being missed entirely. At 60 seconds and 6000+ traces, the distribution stabilizes and even 1% paths are reliably represented.
---
Bad Example:
```bash
# 5-second profile — noisy, unreliable
# Rare but important code paths missed entirely
```

Good Example:
```bash
# 60+ seconds at 100 Hz — stable results
# 6000+ samples, even 1% code paths represented
```
---
Exceptions: Investigating a transient issue that lasts <30 seconds may require matching the profile duration to the event duration.
---
Consequences Of Violation: Noisy flame graphs with missing code paths, unreliable width proportions, optimization decisions based on incomplete data.

## Wide top frames = self-time optimization targets; wide bottom frames = architectural issues
---
Category: Diagnostics
```
Interpret flame graph frame width by position: wide frames at the top (tips) indicate functions with high self time — optimize these directly. Wide frames at the bottom (roots) indicate expensive call subtrees — optimize the children, not the root.
---
Reason: In a flame graph, the Y-axis is stack depth. A wide frame at the top is a leaf function that does significant work — it's a direct optimization target (faster algorithm, caching, fewer calls). A wide frame at the bottom is a root function with many children — its width represents inclusive time from all descendants. Optimizing a wide bottom frame (a delegator) saves only its self time; most savings come from its children.
---
Bad Example:
```text
# Optimizing a wide bottom frame — limited impact
# Wide bottom: Router::dispatch (80% CPU)
# Optimized dispatch logic — saved 2% of CPU
```

Good Example:
```text
# Optimizing wide top frames — maximum impact
# Wide top: PDO::execute (40% CPU) — optimize query
# Wide top: json_encode (20% CPU) — reduce response size
# Together: save 50%+ of CPU
```
---
Exceptions: When a wide bottom frame has significant self time (not shown as a separate top frame), it may need direct optimization.
---
Consequences Of Violation: Optimization effort misdirected to wide root frames with limited savings; real high-self-time targets at the top missed.

## Correlate flame graphs with deployment timeline to catch regressions immediately
---
Category: Monitoring
```
Store flame graphs alongside deployment events and compare the before/after flame graph for every production deployment to detect performance regressions within minutes.
---
Reason: A deployment that adds a slow query, introduces a memory leak, or changes a hot code path causes immediate changes in the flame graph. Without a before/after comparison, the regression may not be noticed until users report slow responses or error rates increase days later. Storing flame graphs with deployment metadata enables automated comparison — if a new wide frame appears after deployment, the deployment is the root cause.
---
Bad Example:
```bash
# No deployment correlation
# Flame graph shows regression — but which deployment caused it?
```

Good Example:
```bash
# Deployment-correlated flame graphs
# Deploy v2.4.1 at 10:00
# Flame graph 10:05 shows new wide frame in QueryBuilder
# Rollback immediately — root cause identified in 5 minutes
```
---
Exceptions: Applications without regular deployments (frozen code) may not need deployment-correlated flame graphs.
---
Consequences Of Violation: Performance regressions from deployments go undetected for days, root cause is lost in the noise of multiple changes, delayed rollback.
