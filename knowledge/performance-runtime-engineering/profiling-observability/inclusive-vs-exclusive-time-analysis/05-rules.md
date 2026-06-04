## Apply the 20% heuristic: if exclusive time is <20% of inclusive, optimize the callees; if >20%, optimize the function itself
---
Category: Diagnostics
---
Calculate the self/inclusive time ratio for each candidate function: if self time is less than 20% of inclusive time, the function delegates most of its work — optimize its children. If self time exceeds 20%, the function does meaningful work directly — optimize it.
---
Reason: The ratio tells you where the work is actually happening. A controller with 500ms inclusive and 5ms self (1%) is purely a delegator — optimizing it saves at most 5ms. Its children contain 495ms of work. A utility function with 50ms inclusive and 40ms self (80%) is doing the work directly — optimizing it saves up to 40ms. Without the ratio, you waste effort on delegator functions that can only provide marginal improvement.
---
Bad Example:
```text
# Wasted effort — optimizing a delegator
getOrderSummary: 450ms incl, 5ms self (1.1%)
# Spent 2 hours optimizing — saved 3ms
```

Good Example:
```text
# Targeted effort — optimizing the real bottleneck
execute: 380ms incl, 380ms self (100%)
# Spent 1 hour optimizing the query — saved 300ms
```
---
Exceptions: If a delegator function is called 1000 times in a loop, its aggregated cost may justify optimization even with low self/inclusive ratio.
---
Consequences Of Violation: Optimization effort wasted on delegator functions, sub-5% improvement instead of 50-80%, frustration from investing time with no visible results.

## Always check call count — weighted cost reveals loop-bound bottlenecks
---
Category: Diagnostics
---
View the "Calls" column alongside inclusive and exclusive time — multiply cost by call count to identify functions whose total impact is from repeated execution, not per-call duration.
---
Reason: A function with 50ms inclusive and 40ms self appears significant, but called once it contributes 50ms total. A function with 1ms inclusive and 0.5ms self appears trivial, but called 10,000 times it contributes 10,000ms — 200x more. Per-call analysis without call count systematically undervalues loop-bound bottlenecks, which are among the most common and impactful optimization targets in PHP applications (N+1 queries, repeated service resolution, redundant calculations).
---
Bad Example:
```text
# Per-call analysis — misleading priorities
PDO::execute: 50ms incl × 1 call = 50ms — high priority
strtolower: 0.5ms incl × 1 call = 0.5ms — low priority
```

Good Example:
```text
# Weighted cost analysis — correct priorities
strtolower: 0.5ms incl × 10,000 calls = 5,000ms — HIGH PRIORITY
PDO::execute: 50ms incl × 1 call = 50ms — lower priority
```
---
Exceptions: Functions called exactly once per request (controllers, entry points) need not check call count.
---
Consequences Of Violation: Optimization effort misdirected from loop-bound bottlenecks to single-call functions, suboptimal improvement from ignoring repeated execution.

## Use inclusive time for bottleneck identification, exclusive time for optimization targeting
---
Category: Diagnostics
---
Sort by inclusive time descending to identify which code paths are slowest (bottleneck identification). Then check exclusive time for each candidate to determine whether to optimize the function or its callees (optimization targeting).
---
Reason: These are two distinct questions requiring two different metrics. Inclusive time answers "what is slow overall" — it identifies the branches of the call tree that consume the most total time. Exclusive time answers "where is the work done" — it identifies the leaf functions that actually consume CPU or I/O. Using inclusive time for targeting (optimizing a delegator because it shows high inclusive time) wastes effort. Using exclusive time for identification (only looking at leaf functions) misses architectural issues in deep call trees.
---
Bad Example:
```text
# Using inclusive time for targeting — wrong
# Sort by exclusive: PDO::execute (380ms) — optimize this
# Miss that getOrderSummary (450ms incl) is the bottleneck to investigate
```

Good Example:
```text
# Inclusive for identification, exclusive for targeting
# Step 1: Sort by inclusive → getOrderSummary (450ms) — bottleneck
# Step 2: Check self/inclusive → 1.1% — delegate, drill into children
# Step 3: Follow hot path → PDO::execute (380ms self) — optimization target
```
---
Exceptions: When profiling a single known function (not exploring), start with exclusive time for direct targeting.
---
Consequences Of Violation: Optimizing the wrong thing — either micro-optimizing a leaf that isn't the bottleneck or rewriting a delegator that spends 1% of its time in its own code.

## Compare inclusive vs exclusive for memory profiling too
---
Category: Diagnostics
```
Apply the same inclusive/exclusive analysis to memory allocation data: high inclusive memory with low exclusive memory = memory allocated in callees (database results, collection transformations) — reduce the data volume, not the caller.
---
Reason: Memory profiling has the same pattern as time profiling. A service that shows 200MB inclusive memory but 2MB exclusive memory is not allocating memory itself — it's fetching large datasets and passing them through. Optimizing the service reduces 2MB. Optimizing the query (the callee) to return fewer rows reduces 200MB. The inclusive/exclusive distinction prevents optimizing the symptom instead of the root cause.
---
Bad Example:
```text
# Memory: optimizing the service that fetches data
ReportService: 200MB incl, 2MB self (1%)
# Optimized ReportService to use less memory — saved 2MB
```

Good Example:
```text
# Memory: optimizing the query that returns too much data
ReportService: 200MB incl, 2MB self (1%)
# → Query returns 500,000 rows unnecessarily
# Added LIMIT and pagination — saved 180MB
```
---
Exceptions: CPU-focused profiling investigations may skip memory inclusive/exclusive analysis.
---
Consequences Of Violation: Memory optimization effort misdirected to services that pass data through, root cause (large query results, unaggregated data) left unaddressed.
