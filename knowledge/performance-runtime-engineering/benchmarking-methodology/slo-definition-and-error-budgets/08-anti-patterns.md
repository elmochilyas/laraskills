# Anti-Patterns: Standardized Knowledge: SLO Definition and Error Budgets

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Benchmarking Methodology |
| Knowledge Unit | Standardized Knowledge: SLO Definition and Error Budgets |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Benchmarking Without Warm-Up Rounds | Methodology | High |
| 2 | Reporting Mean Without Percentiles | Methodology | High |
| 3 | Benchmarking on Development Hardware | Methodology | Critical |
| 4 | Single-Request Benchmarks (wrk -c1) | Methodology | Medium |
| 5 | P-Hacking Benchmark Results | Methodology | High |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: Benchmarking Without Warm-Up Rounds

### Category
Methodology

### Description
Reporting results from cold-start runs including OpCache compilation and cache population.

### Why It Happens
Impatience. One-shot benchmarks. Not understanding cold vs warm difference.

### Warning Signs
Results vary wildly. First run significantly slower. No discard of initial iterations.

### Why Harmful
Cold results include one-time costs irrelevant to steady-state performance.

### Consequences
Misleading conclusions. Wrong technology choices based on cold data.

### Alternative
Run warm-up iterations before measuring. Discard first M% of results.

### Refactoring Strategy
1. Add warm-up (100-1000 iterations). 2. Discard warm-up. 3. Report steady-state.

### Detection Checklist
- [ ] Warm-up rounds conducted
- [ ] Steady-state verified
- [ ] Cold vs warm reported

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: SLO Definition and Error Budgets
- 05-rules.md: Always warm up before measuring
- 05-rules.md: Report cold-start separately
- 06-skills.md: Design Benchmark with Proper Warm-Up
- 07-decision-trees.md: Benchmark Warm-Up Strategy

---

## Anti-Pattern 2: Reporting Mean Without Percentiles

### Category
Methodology

### Description
Reporting only average latency without p50, p95, p99, hiding tail latency.

### Why It Happens
Mean is simplest. Lack of percentile analysis tools.

### Warning Signs
Reports only x ms average. Users report occasional slowness but mean looks fine.

### Why Harmful
Averages hide long-tail latency. Users experience the tail not the average.

### Consequences
p99 could be 10x mean. Incorrect capacity planning.

### Alternative
Always report p50, p95, p99, p999. Use latency histograms.

### Refactoring Strategy
1. Configure percentile output. 2. Report p50, p95, p99. 3. Set SLOs on percentiles.

### Detection Checklist
- [ ] Percentiles reported
- [ ] Histogram available
- [ ] SLOs on percentiles

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: SLO Definition and Error Budgets
- 05-rules.md: Always report percentiles
- 05-rules.md: Set SLOs on tail latency
- 06-skills.md: Analyze Percentile Latency in Benchmarks
- 07-decision-trees.md: Latency Metrics Decision

---

## Anti-Pattern 3: Benchmarking on Development Hardware

### Category
Methodology

### Description
Running benchmarks on dev laptops then extrapolating to production.

### Why It Happens
Convenience. No production-like environment available.

### Warning Signs
Results do not match production. Different CPU/RAM/thermal profile.

### Why Harmful
Dev machines have different architecture. Results do not scale linearly.

### Consequences
Wrong production conclusions. Over-optimizing for dev bottlenecks.

### Alternative
Use production-equivalent hardware. Document differences.

### Refactoring Strategy
1. Identify production spec. 2. Match or document delta. 3. Account for virtualization.

### Detection Checklist
- [ ] Prod-hardware-equivalent
- [ ] Differences documented
- [ ] Virtualization accounted

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: SLO Definition and Error Budgets
- 05-rules.md: Benchmark on production-equivalent hardware
- 05-rules.md: Document differences
- 06-skills.md: Set Up Representative Benchmark Environments
- 07-decision-trees.md: Benchmark Environment Decision

---

## Anti-Pattern 4: Single-Request Benchmarks (wrk -c1)

### Category
Methodology

### Description
Benchmarking with single concurrent connection missing realistic contention effects.

### Why It Happens
Simple setup. Not understanding c1 vs c100 differences.

### Warning Signs
Only c1 results. Production has 50-500 concurrent users.

### Why Harmful
c1 misses contention, connection pool behavior, queueing delay.

### Consequences
Selecting libraries that work at c1 but collapse under concurrency.

### Alternative
Benchmark at multiple concurrency levels. Report per-concurrency.

### Refactoring Strategy
1. Determine production concurrency. 2. Test at 1, 10, 50, 100, 500.

### Detection Checklist
- [ ] Multiple concurrency levels tested
- [ ] Production concurrency matched

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: SLO Definition and Error Budgets
- 05-rules.md: Benchmark at production-typical concurrency
- 05-rules.md: Test multiple levels
- 06-skills.md: Design Multi-Concurrency Benchmark Suites
- 07-decision-trees.md: Concurrency Level Selection

---

## Anti-Pattern 5: P-Hacking Benchmark Results

### Category
Methodology

### Description
Running benchmarks until desired result appears then reporting only that run.

### Why It Happens
Confirmation bias. Pressure to show improvement.

### Warning Signs
Only best runs reported. No confidence intervals. Results not reproducible.

### Why Harmful
P-hacking invalidates significance. Decisions based on noise.

### Consequences
Implementing changes that do not actually improve performance.

### Alternative
Pre-register methodology. Fixed trial count. Report all with CIs.

### Refactoring Strategy
1. Pre-define trial count. 2. Run all. 3. Report mean + CI. 4. Compare distributions.

### Detection Checklist
- [ ] Fixed trial count pre-registered
- [ ] All runs reported
- [ ] CIs calculated

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: SLO Definition and Error Budgets
- 05-rules.md: Pre-register trial count
- 05-rules.md: Report all with confidence intervals
- 06-skills.md: Apply Statistical Rigor to Benchmarking
- 07-decision-trees.md: Benchmark Analysis Integrity

---
