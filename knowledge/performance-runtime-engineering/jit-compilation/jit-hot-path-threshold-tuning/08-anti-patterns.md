# Anti-Patterns: JIT Hot Path Threshold Tuning

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | JIT Compilation |
| Knowledge Unit | JIT Hot Path Threshold Tuning |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Setting Thresholds Too Low Without Buffer Monitoring | Configuration | High |
| 2 | Not Accounting for Worker Lifetime in Threshold Tuning | Configuration | Medium |
| 3 | Expecting Instant JIT Benefit After Process Start | Expectation Management | Medium |
| 4 | Tuning Thresholds Before Buffer Size | Strategy | High |
| 5 | Ignoring Warm-Up in Latency Metrics | Methodology | Medium |

---

## Anti-Pattern 1: Setting Thresholds Too Low Without Buffer Monitoring

### Category
Configuration

### Description
Lowering jit_hot_loop and jit_hot_func thresholds to compile more aggressively without monitoring buffer utilization, causing compilation thrashing and eviction.

### Why It Happens
Default thresholds seem too conservative. Lowering them feels like more optimization. No buffer monitoring in place to detect the impact.

### Warning Signs
Buffer eviction count increases. buffer_free drops rapidly. Throughput decreases after initial warm-up. Compilation count is very high.

### Why Harmful
Lower thresholds cause more code to be compiled, filling the JIT buffer faster. When the buffer overflows, hot code is evicted and must be recompiled, negating JIT benefit.

### Consequences
Compilation thrashing destroys JIT benefit. CPU wasted on recompilation. Hot code runs in interpreter after eviction.

### Alternative
Start with default thresholds (64/100). Lower only if profiling shows specific hot paths need faster compilation. Monitor buffer utilization before and after threshold changes.

### Refactoring Strategy
1. Reset to default thresholds 2. Monitor buffer utilization for 24h 3. If buffer_free > 30%, consider lowering thresholds 4. Re-monitor after each change

### Detection Checklist
- [ ] Default thresholds tried first (64/100)
- [ ] Buffer utilization monitored before and after change
- [ ] No eviction increase after threshold change
- [ ] Compilation count stable

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Hot Path Threshold Tuning
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 2: Not Accounting for Worker Lifetime in Threshold Tuning

### Category
Configuration

### Description
Using the same JIT compilation thresholds for short-lived FPM workers and long-running Octane workers, missing optimization for each context.

### Why It Happens
Thresholds set globally. No awareness that worker lifetime affects JIT warm-up economics. Copy-paste from default configuration.

### Warning Signs
FPM workers never reach JIT steady state before recycling. Octane workers take too long to warm up JIT.

### Why Harmful
In FPM with low max_requests, default thresholds mean workers recycle before JIT reaches steady state. In Octane, default thresholds delay warm-up unnecessarily.

### Consequences
FPM: JIT never benefits before worker recycles. Octane: slow warm-up with unnecessary compilation delay.

### Alternative
Tune per runtime: FPM with low max_requests needs lower thresholds. Octane workers can use default or slightly lower thresholds.

### Refactoring Strategy
1. If FPM with max_requests under 500, lower thresholds by 50% 2. For Octane, keep defaults or lower slightly 3. Benchmark warm-up time

### Detection Checklist
- [ ] Worker lifetime factored into threshold tuning
- [ ] FPM with low max_requests uses lower thresholds
- [ ] Octane/Swoole uses appropriate thresholds
- [ ] Warm-up time benchmarked

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Hot Path Threshold Tuning
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 3: Expecting Instant JIT Benefit After Process Start

### Category
Expectation Management

### Description
Measuring JIT performance immediately after worker start without allowing warm-up, underestimating JIT benefit by including compilation overhead in metrics.

### Why It Happens
Impatience during testing. Not understanding JIT warm-up mechanism. Short benchmark runs that don't reach steady state.

### Warning Signs
Benchmark RPS increases over time. First 30 seconds of benchmark are slower. Compilation counts increase during the run.

### Why Harmful
JIT compiles after thresholds are crossed. Initial requests run in the interpreter. Short benchmarks measure compilation overhead, not JIT-optimized steady state.

### Consequences
JIT benefit underestimated by 10-50% in benchmarks. Incorrect conclusions that JIT doesn't help.

### Alternative
Always warm up workers with 100+ representative requests before measuring JIT performance. Run benchmarks for 60+ seconds.

### Refactoring Strategy
1. Run warm-up phase (100+ requests) 2. Wait for JIT counts to stabilize 3. Measure for 60+ seconds 4. Compare warm vs cold performance

### Detection Checklist
- [ ] Warm-up phase completed before JIT measurement
- [ ] JIT compilation counts stable before measurement
- [ ] Benchmark duration > 60 seconds
- [ ] Cold and warm performance reported separately

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Hot Path Threshold Tuning
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 4: Tuning Thresholds Before Buffer Size

### Category
Strategy

### Description
Adjusting compilation thresholds when buffer thrashing from insufficient buffer size is the actual problem, solving the wrong constraint.

### Why It Happens
Threshold tuning seems more surgical. Buffer size changes require restart. No monitoring to identify buffer pressure as root cause.

### Warning Signs
High eviction count. buffer_free < 20%. Compaction events frequent. All symptoms of insufficient buffer size.

### Why Harmful
Threshold tuning cannot fix buffer starvation. If the buffer is too small, even optimal threshold settings result in eviction and recompilation.

### Consequences
Effort wasted tuning thresholds while root cause (buffer size) remains. Buffer thrashing continues.

### Alternative
Always check buffer utilization first. If buffer_free < 20%, increase buffer size before tuning thresholds.

### Refactoring Strategy
1. Check buffer_free percentage 2. If < 20%, increase jit_buffer_size 3. Only if > 30%, consider threshold tuning 4. Monitor after each change

### Detection Checklist
- [ ] Buffer utilization checked before threshold tuning
- [ ] buffer_free > 30% before threshold tuning
- [ ] Buffer size increased first if buffer pressure exists
- [ ] Threshold tuning justified by profiling data

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Hot Path Threshold Tuning
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 5: Ignoring Warm-Up in Latency Metrics

### Category
Methodology

### Description
Including cold-start JIT latencies in p95/p99 metrics without segmenting cold vs warm requests, making JIT appear less effective.

### Why It Happens
No tagging of requests by cache state. Latency percentiles aggregated across all requests. Not aware cold requests inflate tail latency.

### Warning Signs
p95 higher after deployment. p99 spikes correlate with worker restarts. Latency decreases over time after deploy.

### Why Harmful
Cold requests (first 100+ after worker start) include JIT compilation overhead. Including them in p95/p99 makes JIT appear to increase latency.

### Consequences
JIT benefit hidden in aggregate metrics. Wrong decisions about JIT based on contaminated data.

### Alternative
Tag requests as warm/cold and report separate latency percentiles. Warm-up period measured separately from steady-state.

### Refactoring Strategy
1. Add deployment timestamp tagging 2. Create separate warm/cold dashboards 3. Exclude warm-up from steady-state SLOs 4. Measure warm-up duration

### Detection Checklist
- [ ] Cold and warm latency reported separately
- [ ] Warm-up period excluded from steady-state SLOs
- [ ] JIT benefit measured on warm-steady-state data
- [ ] Warm-up duration tracked as operations metric

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Hot Path Threshold Tuning
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees
