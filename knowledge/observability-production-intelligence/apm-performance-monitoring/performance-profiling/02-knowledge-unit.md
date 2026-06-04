# Performance Profiling & Bottleneck Detection

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 03-apm-performance-monitoring
- **Knowledge Unit:** performance-profiling
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Performance profiling goes beyond APM's request-level tracing to identify exactly which functions, queries, and I/O operations consume CPU time and memory. While APM shows that an endpoint is slow, profiling shows why at the function level. Blackfire is the dominant tool in the Laravel ecosystem, providing flame graphs, call graphs, and CI-enforced performance budgets.

---

## Core Concepts

- **Flame Graph:** Visualization where each block is a function call, width corresponds to inclusive time — wide blocks at the top are the hottest code paths
- **Call Graph:** Directed graph showing function call relationships with timing — exclusive time (function body) vs inclusive time (function + children)
- **Sampling Profiler:** Periodically samples CPU instruction pointer — low overhead (1-3%), statistical, may miss short-duration functions
- **Instrumenting Profiler:** Hooks every function call/return — high overhead (10-50%), 100% accurate
- **Wall-Clock Time vs CPU Time:** High wall-clock with low CPU time indicates I/O-bound performance (queries, network, disk)
- **Memory Profiling:** Tracking allocations, peak usage, and GC activity — essential for long-running processes
- **Performance Budget:** Defined threshold for execution time, memory, or query count enforced in CI

---

## Mental Models

- **Microscope Model:** APM is a macroscope (shows the forest), profiling is a microscope (shows individual cells). You need the macroscope to find which tree to examine
- **Pareto Model:** 20% of code causes 80% of latency. Profiling identifies that 20% so you optimize what matters, not what you guess matters
- **Before/After Model:** Profiling only has value in comparison. Without a "before" baseline, an "after" profile cannot quantify improvement

---

## Internal Mechanics

Profiling tools instrument the PHP runtime by hooking into function calls or periodically sampling the execution stack. Blackfire uses a hybrid approach — sampling with lightweight instrumentation. The profiler collects call stacks, timing, and memory data, then sends it to a backend for visualization. Flame graphs render function call stacks where the x-axis is alphabetically sorted (not chronological), and block width represents inclusive time. Wall-clock vs CPU time comparison reveals whether bottlenecks are CPU-bound or I/O-bound.

---

## Patterns

- **CI Performance Budget Enforcement:** Automate regression detection by failing CI if p99 latency increases >10% or memory exceeds threshold. Benefit: prevents performance regrations before deployment. Tradeoff: budgets must allow 10-20% headroom to avoid flaky failures.
- **On-Demand Production Profiling:** Trigger profiling in response to APM alerts using sampling profilers only. Benefit: deep-dive analysis without continuous overhead. Tradeoff: limited to sampling profilers (1-3% overhead).
- **Load-Testing Profiles:** Profile under concurrent load generation, not single requests. Benefit: reveals contention, connection pool exhaustion, GC patterns. Tradeoff: requires load testing infrastructure.

---

## Architectural Decisions

**Use APM for always-on monitoring, profiling for on-demand deep dives.** APM identifies which endpoints are slow; profiling explains why at the function level. The combination provides complete performance visibility.

**Never use instrumenting profilers in production.** Instrumenting profilers add 10-50% overhead and are for development/staging only. Sampling profilers (1-3% overhead) are production-safe.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Identifies exact slow functions | 5-15% overhead with Blackfire | Enable on-demand, not continuous |
| CI performance budgets prevent regression | Flaky CI failures if budget too tight | Allow 10-20% headroom |
| Memory profiling detects leaks | 10-50MB additional memory during profiling | Acceptable for short profiling sessions |

---

## Performance Considerations

Sampling profilers add 1-3% overhead — production-safe. Instrumenting profilers add 10-50% overhead — development/staging only. A single request profile is 50-500KB. CI profiles for a test suite can be 50-500MB. Profiling tools allocate additional memory for call stack tracking — expect 10-50MB additional usage.

---

## Production Considerations

Flame graphs may show file paths, class names, function arguments, and SQL queries with bound parameters — restrict access. On-demand profiling trigger endpoints must be secured with admin-only access. CI profile uploads require authentication tokens. Production profiling should require explicit approval due to overhead and data exposure.

---

## Common Mistakes

**Profiling in development, extrapolating to production** — development hardware and workload differ significantly from production. Profile on production-like infrastructure.

**Profiling without load** — a single request under no load misses contention, connection pool exhaustion, and GC patterns.

**Focusing on exclusive time only** — exclusive time misses the cost of called functions. Use inclusive time (flame graph width) to identify root cause.

**No baseline comparison** — profiling after optimization without a "before" profile cannot quantify improvement.

**CI budget too tight** — setting performance budgets too aggressively causes flaky CI failures from normal variance.

---

## Failure Modes

**Profiler overhead causing performance issue:** The profiler itself adds enough overhead to trigger the issue you're investigating. Detection: profile data shows unexpected patterns. Mitigation: use sampling profiler; compare with APM data.

**Flame graph misinterpretation:** Wide blocks at the top are hottest paths, but deeper towers may indicate over-abstraction rather than slowness. Detection: misleading optimization targets. Mitigation: combine flame graph with call graph for cross-reference.

**Profile data leakage:** Flame graphs containing PII or internal paths exposed to unauthorized viewers. Detection: compliance audit. Mitigation: restrict access to profiling data; implement data masking.

---

## Ecosystem Usage

Blackfire is the dominant Laravel profiling tool with the best CI integration. XHProf and Tideways are alternatives for PHP profiling. Scout APM includes basic profiling capabilities. Blackfire's CI integration enforces performance budgets via `.blackfire.yaml` configuration. Profiling complements Laravel Pulse, Telescope, and APM tools in the performance toolchain.

---

## Related Knowledge Units

### Prerequisites
- APM Tool Integration & Comparison (complementary always-on monitoring)

### Related Topics
- N+1 Query Detection (common Laravel bottleneck found via profiling)
- OpenTelemetry PHP SDK (OTel profiling signal, emerging)

### Advanced Follow-up Topics
- Blackfire CI Integration
- XHProf/Tideways configuration

---

## Research Notes

Profiling and APM are complementary — APM finds what is slow, profiling explains why. Blackfire is the dominant Laravel profiling tool with best CI integration. Always profile before and after optimization to measure impact. Flame graph width = inclusive time (time in function + children). Wall-clock vs CPU time comparison reveals I/O vs CPU bottlenecks. Sampling profilers (1-3% overhead) are production-safe; instrumenting profilers (>10%) are not.
