---
## Rule Name

Diagnose Before Optimizing

## Category

Performance

## Rule

Never apply any performance optimization without first profiling to classify the bottleneck as CPU-bound, I/O-bound, memory-bound, or framework-bound.

## Reason

Each bottleneck type requires a different lever. JIT helps CPU-bound workloads (61-95% gain) but does almost nothing for I/O-bound. Octane eliminates bootstrap overhead but not CPU computation. Applying the wrong optimization yields zero or negative results.

## Bad Example

```php
// Enabled JIT for an I/O-bound database-heavy API
// Result: 0-2% gain, wasted 128MB RAM
```

## Good Example

```php
// 1. Measure p50 vs p95 gap — wide gap indicates I/O variability
// 2. Check CPU utilization during peak — low indicates I/O-bound
// 3. Profile a representative request to confirm
// 4. Choose optimization: caching + connection pooling (I/O-bound)
```

## Exceptions

Universal best practices (enable OpCache, use typed properties) that are safe regardless of bottleneck type.

## Consequences Of Violation

Wasted engineering effort, zero measurable improvement, false conclusion that "optimization doesn't work," misallocation of performance budget.

---

## Rule Name

Do Not Expect JIT Gains for I/O-Bound Workloads

## Category

Performance

## Rule

Never allocate significant engineering time to JIT tuning for applications that are primarily database-query-heavy, API-call-heavy, or file-I/O-heavy.

## Reason

JIT eliminates CPU dispatch overhead but cannot reduce the wall-clock time spent waiting for I/O. Web applications typically spend 80-90% of request time on database queries and external API calls — JIT optimizes only the remaining 10-20%.

## Bad Example

```bash
# Spent 2 days tuning JIT parameters for a CRUD API
# Throughput improved 1% — database queries are the bottleneck
```

## Good Example

```bash
# Identified I/O-bound: database queries consume 85% of time
# Optimized: added query caching + N+1 reduction -> 3x throughput
```

## Exceptions

Hybrid workloads where a significant sub-path (e.g., report generation, image processing) is CPU-bound and benefits from JIT.

## Consequences Of Violation

Wasted tuning effort, false expectation of performance gains, neglect of real I/O bottlenecks.

---

## Rule Name

Prefer Octane Only When Bootstrap Dominates

## Category

Architecture

## Rule

Do not migrate to Laravel Octane or other memory-resident architectures unless profiling confirms that framework bootstrap exceeds 20% of total request time.

## Reason

Octane eliminates per-request bootstrap overhead. If the bottleneck is database queries (I/O-bound) or computation (CPU-bound), Octane provides minimal gain while adding state management complexity.

## Bad Example

```bash
# Migrated to Octane for a CPU-bound report generation endpoint
# Bootstrap was 5% of 2000ms request time -> 2.5% gain
```

## Good Example

```bash
# Profiled: 50ms request, 35ms bootstrap (70%)
# Octane target: reduce to 15ms -> 3.3x throughput
```

## Exceptions

Greenfield projects where Octane is chosen upfront for its architecture model and the team is willing to accept marginal gains on some endpoints.

## Consequences Of Violation

Complex migration with disappointing performance gain, added operational burden for memory-resident management.

---

## Rule Name

Right-Size Workers According to Bottleneck, Do Not Oversize

## Category

Scalability

## Rule

Never increase FPM worker count beyond the optimal point without confirming that the workload is I/O-bound. For CPU-bound workloads, more workers degrade performance.

## Reason

CPU-bound workers compete for CPU time — adding more workers increases context-switching overhead without increasing throughput. I/O-bound workers benefit from more workers because they spend most of their time waiting for I/O.

## Bad Example

```ini
; CPU-bound image processing — 100 workers on 4 cores
pm.max_children = 100  # Heavy context switching overload
```

## Good Example

```ini
; CPU-bound: workers = CPU cores + 1-2
pm.max_children = 6     # 4 cores + 2 for I/O waits
; I/O-bound: workers = (avg I/O wait / avg CPU time) * cores
```

## Exceptions

No common exceptions. Always profile CPU utilization to determine worker sizing.

## Consequences Of Violation

Degraded throughput under load, increased p95 latency, CPU thrashing, inability to serve requests efficiently.

---

## Rule Name

Fix Obvious Bottlenecks Before Classifying

## Category

Performance

## Rule

Always fix obvious performance issues (missing indexes, no OpCache, unbuffered queries) before performing bottleneck classification and advanced optimization.

## Reason

Obvious bottlenecks distort profiling results and make the system appear to be in a different bottleneck class. Fixing them first reveals the true bottleneck location.

## Bad Example

```bash
# Profiled: CPU at 100% — classified as CPU-bound
# Actual root cause: missing index causing full table scan -> 100% CPU
# After adding index: CPU dropped to 15% — truly I/O-bound
```

## Good Example

```bash
# 1. Fix obvious issues: missing indexes, OpCache disabled
# 2. Re-profile with fixed baseline
# 3. Classify bottleneck
# 4. Apply targeted optimization
```

## Exceptions

No common exceptions. Always resolve known common issues first.

## Consequences Of Violation

Misclassification of bottleneck, wasted optimization on the wrong layer, unresolved root cause.
