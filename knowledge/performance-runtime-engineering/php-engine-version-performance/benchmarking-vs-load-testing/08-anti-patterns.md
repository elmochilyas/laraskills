# Anti-Patterns: Benchmarking vs Load Testing

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | Benchmarking vs Load Testing |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Benchmarking with Hello World Endpoints | Methodology | Critical |
| 2 | Reporting Only Average Latency | Metrics | High |
| 3 | No Warm-Up Period Before Measurement | Methodology | High |
| 4 | Closed-Loop Under Saturation (Coordinated Omission) | Methodology | Critical |
| 5 | Single-Run Conclusions Without Baseline | Statistical | Medium |

## Repository-Wide Anti-Patterns

- **Synthetic workload bias**: Using simplified endpoints (health checks, empty controllers) for benchmarking across all subdomains produces results 10-100x better than production, hiding real bottlenecks in database queries, template rendering, and middleware.
- **Missing resource correlation**: Benchmarking throughput/latency without capturing CPU, memory, and I/O metrics leaves performance changes unexplained and non-actionable.
- **Environment mismatch**: Benchmarking in development or staging environments that lack production-like data volume, concurrency, and caching behavior invalidates all results.

---

## Anti-Pattern 1: Benchmarking with Hello World Endpoints

### Category
Methodology

### Description
Using simplified synthetic endpoints (empty health checks, "Hello World" responses, or endpoints without database queries, template rendering, or middleware) for benchmarking that is intended to inform production capacity planning or performance comparison.

### Why It Happens
- Convenience and speed of setup — synthetic endpoints require no test data, no database, and minimal configuration
- Unawareness of how dramatically framework bootstrap, database queries, and template rendering dominate production response time
- Copy-paste from online examples that use trivial endpoints for demonstration purposes

### Warning Signs
- Benchmark results show 50,000+ RPS for what is a typical production API (1,000-5,000 RPS)
- p95 latency under 5ms for an application that feels slow in production
- No database, cache, or external service calls in the benchmarked endpoint
- Benchmark results are cited without describing the endpoint complexity

### Why Harmful
Benchmarking with synthetic endpoints produces results 10-100x better than production, leading to:
- Grossly overestimated capacity planning (provisioning too few servers)
- False confidence in performance before deployment
- Optimization effort wasted on parts of the stack that are not the bottleneck
- Inability to reproduce benchmark results in production

### Consequences
- Overestimated capacity by 10-100x
- Insufficient hardware provisioned for production traffic
- Production performance degrades unexpectedly compared to benchmarks
- SLA violations discovered post-deployment
- Wasted engineering hours optimizing non-bottleneck code

### Alternative
Always benchmark with production-representative workloads including:
- Full framework bootstrap (can be eliminated via Octane, but measure it)
- Realistic database queries with production-like data volume
- Template rendering or API response formatting
- Same middleware stack as production
- Authentication and session handling overhead
- Caching layer interaction (Redis, APCu) with realistic hit rates

### Refactoring Strategy
1. Identify 3-5 endpoints that represent your production traffic profile (read-heavy, write-heavy, mixed)
2. Create or restore a staging database with production-like data volume (anonymized)
3. Configure the staging environment to mirror production infrastructure (same PHP version, OpCache, web server)
4. Benchmark these representative endpoints, not a synthetic health check
5. Cross-validate results between staging and production using APM data

### Detection Checklist
- [ ] Benchmarked endpoint includes database query execution
- [ ] Benchmarked endpoint includes template or JSON response rendering
- [ ] Benchmarked endpoint passes through full middleware stack
- [ ] Test data volume is within 10x of production data size
- [ ] Benchmark RPS is within 2x of observed production throughput
- [ ] Results include endpoint description, not just tool output

### Related Rules, Skills, Trees
- 05-rules.md: Benchmark with Realistic Workloads, Not Synthetic Endpoints
- 06-skills.md: Design and Execute a Benchmark vs Load Test Campaign
- 07-decision-trees.md: Decision 1 — Benchmark vs Load Testing Approach

---

## Anti-Pattern 2: Reporting Only Average Latency

### Category
Metrics

### Description
Reporting only the mean (average) latency from benchmark or load test results, omitting percentile distributions (p50, p95, p99, max), which hides tail latency issues caused by I/O variability, garbage collection, saturation effects, or background processes.

### Why It Happens
- Average is the default output in many tools (Apache Bench, wrk default output)
- Simplicity of reporting a single number
- Lack of understanding that average latency can mask severe tail latency problems
- Pressure to show "good numbers" — average is easier to keep low than p99

### Warning Signs
- Benchmark reports only "Average: 45ms" without mentioning p95 or p99
- p95/p99 values are not collected or stored in CI performance regression dashboards
- The average-to-p99 ratio exceeds 3x (healthy systems have p99 < 3x p50)
- SLO violations happen in production despite benchmark averages looking good

### Why Harmful
Average latency is statistically meaningless for performance characterization because:
- A system can show 45ms average while 5% of requests take 450ms (10x worse)
- The average is heavily influenced by outliers, but also hides them in aggregate
- SLOs are defined on percentiles (e.g., p99 < 200ms), not averages
- Capacity planning based on averages underestimates resource requirements for tail requests

### Consequences
- Missed tail latency problems discovered only in production
- SLO violations despite passing benchmark acceptance criteria
- Incorrect capacity planning (not enough headroom for p95/p99 traffic)
- User-facing slow experiences hidden from engineering visibility
- Wrong optimization targets (optimizing average while tail gets worse)

### Alternative
Always report the full latency distribution:
- p50 (median) — typical user experience
- p95 — the slowest 5% of requests
- p99 — the slowest 1% of requests
- Max — absolute worst case
- Average — informational only, never as primary metric
- Standard deviation or variance — indicates stability

### Refactoring Strategy
1. Configure benchmarking tools to output percentile distributions (wrk2 with `--latency`, k6 with `summaryTrendStats`)
2. Store all percentiles in CI performance regression databases, not just average
3. Set SLOs on p95 and p99 latency, not average
4. Create dashboards showing the full latency distribution over time
5. Alert on p95 degradation, not average degradation

### Detection Checklist
- [ ] Benchmark output includes p50, p95, p99 values
- [ ] CI performance regression checks p95, not just average
- [ ] SLOs defined on percentile metrics, not average
- [ ] Latency distribution dashboard exists and is monitored
- [ ] Average never used as the primary comparison metric
- [ ] p95:p50 ratio reviewed as a stability indicator

### Related Rules, Skills, Trees
- 05-rules.md: Report Both p50 and p95/p99 Latency, Not Just Average
- 06-skills.md: Design and Execute a Benchmark vs Load Test Campaign
- 07-decision-trees.md: Decision 3 — What to Measure and Report

---

## Anti-Pattern 3: No Warm-Up Period Before Measurement

### Category
Methodology

### Description
Starting benchmark measurements immediately (cold start) without a warm-up phase, so results include compilation time (OpCache cold), JIT warm-up latency, and connection establishment overhead that does not exist in steady-state operation.

### Why It Happens
- Impatience — warm-up adds 30-60 seconds to total benchmark time
- Unawareness that PHP OpCache and JIT require warm-up to reach steady state
- Copy-paste of one-line benchmark commands that don't include warm-up
- Misunderstanding that the first request is representative of typical performance

### Warning Signs
- Benchmark results are not reproducible across runs (varies by >10%)
- First run is significantly slower than subsequent runs
- p50 latency decreases noticeably over the duration of a single benchmark run
- Benchmark documentation does not mention warm-up procedure
- Results include deployment or cache-clearing events immediately before measurement

### Why Harmful
Cold cache results include compilation time that does not exist in steady-state operation, producing:
- Non-reproducible results (cold cache state varies by deployment and timing)
- Overestimated latency (compilation adds 20-50% overhead on first requests)
- Incorrect baselines for regression detection
- Wasted optimization effort on phantom issues that only exist on cold cache

### Consequences
- Non-reproducible benchmark results
- Overestimated latency by 20-50% in early measurements
- Incorrect baselines leading to chasing phantom regressions
- Wasted effort optimizing code that is only slow during cold start
- Inability to compare results across different benchmark sessions

### Alternative
Always run a warm-up phase before recording benchmark metrics:
- Minimum 30 seconds of continuous traffic at target concurrency
- Use the same endpoint, same concurrency, and same tool for warm-up and measurement
- Discard warm-up data entirely (do not include in averages or percentiles)
- For JIT workloads, extend warm-up to 60+ seconds to allow JIT compilation to stabilize
- Document warm-up duration in benchmark methodology

### Refactoring Strategy
1. Run warm-up traffic at target concurrency for 30+ seconds before recording
2. Verify that RPS and latency stabilize during warm-up (monitor live)
3. Begin measurement phase and run for at least 60 seconds
4. Compare warm-up vs measurement data to verify stabilization (RPS should be within 2%)
5. Store warm-up duration as part of benchmark metadata for reproducibility

### Detection Checklist
- [ ] Warm-up phase explicitly included in benchmark script
- [ ] Warm-up duration is at least 30 seconds
- [ ] Warm-up traffic uses the same endpoint and concurrency as measurement
- [ ] Warm-up data is discarded, not averaged into results
- [ ] RPS and latency are stable within 2% between warm-up end and measurement start
- [ ] JIT workloads have extended warm-up (60+ seconds)
- [ ] Methodology documentation includes warm-up procedure

### Related Rules, Skills, Trees
- 05-rules.md: Warm Up Before Measuring
- 06-skills.md: Design and Execute a Benchmark vs Load Test Campaign
- 07-decision-trees.md: Decision 2 — Open-Loop vs Closed-Loop Model

---

## Anti-Pattern 4: Closed-Loop Under Saturation (Coordinated Omission)

### Category
Methodology

### Description
Using closed-loop load generation tools (e.g., wrk, Apache Bench) that issue the next request only after the previous completes, which underestimates tail latency by 2-5x under saturation because the tool excludes queuing time from measurement and artificially paces request rate to match system throughput.

### Why It Happens
- wrk and ab are the most commonly used benchmarking tools and both use closed-loop by default
- Coordinated omission is subtle and not widely understood — most tutorials and examples use wrk/ab without mentioning the bias
- Closed-loop results look better (lower tail latency) than reality, so they are less likely to be questioned
- Open-loop tools (wrk2, constant-rate) are less familiar and require a target rate parameter

### Warning Signs
- Tail latency decreases or stays flat as concurrency increases (counterintuitive — should increase)
- Throughput (RPS) remains constant regardless of target concurrency
- Benchmark uses wrk or ab without specifying constant rate or open-loop mode
- Results show improbably low p99 latency under high concurrency conditions
- Production latency is consistently worse than benchmark predictions

### Why Harmful
Coordinated omission produces a systematically biased view of system performance:
- Tail latency is underestimated by 2-5x under saturation
- The system appears to handle load better than it actually does
- Queue buildup, which is the primary cause of tail latency in production, is hidden
- Capacity planning is based on optimistic latency numbers that cannot be achieved under real traffic

### Consequences
- Tail latency underestimated by 2-5x
- Production SLA violations despite passing benchmarks
- Unnoticed saturation effects until production incidents
- Incorrect capacity planning (overestimating how much load the system can handle)
- Performance regressions missed because biased baseline hides the true latency

### Alternative
Use open-loop (constant-rate) load generation for tail latency measurement:
- wrk2 with `-R` parameter to specify constant request rate
- k6 with `constant-arrival-rate` executor
- Ensure the request rate exceeds expected system capacity to test saturation behavior
- For capacity planning, use the open-loop result, not the closed-loop result
- Cross-validate with closed-loop for max throughput ceiling, but use open-loop for latency

### Refactoring Strategy
1. Replace wrk with wrk2, or add `-R` parameter to wrk to enable constant-rate mode
2. Set the target rate to exceed expected production peak traffic by 2x
3. Run the benchmark and capture full latency distribution
4. Compare closed-loop vs open-loop results — the gap reveals coordinated omission bias
5. Use open-loop (higher, more realistic) tail latency for SLO validation and capacity planning

### Detection Checklist
- [ ] Benchmark tool configured in open-loop mode (constant rate) for latency measurement
- [ ] Target rate parameter explicitly set in benchmark configuration
- [ ] Closed-loop tools (wrk, ab) used only for max throughput ceiling, not tail latency
- [ ] Coordinated omission acknowledged and mitigated in methodology documentation
- [ ] Cross-validation performed between closed-loop and open-loop results
- [ ] Production latency correlated with open-loop benchmark results

### Related Rules, Skills, Trees
- 05-rules.md: Use Open-Loop Models for Tail Latency
- 06-skills.md: Design and Execute a Benchmark vs Load Test Campaign
- 07-decision-trees.md: Decision 2 — Open-Loop vs Closed-Loop Model

---

## Anti-Pattern 5: Single-Run Conclusions Without Baseline

### Category
Statistical

### Description
Drawing conclusions from a single benchmark run without establishing a baseline, performing multiple runs to assess variance, or checking statistical significance — leading to false positives from system noise, background processes, or environmental variation.

### Why It Happens
- Time pressure — running one benchmark and declaring success is faster
- Lack of statistical training — assuming a single measurement is sufficient
- Tools that default to single-run output without multiple-run comparison
- Overconfidence in the change being measured ("this optimization is obviously good")
- No established process for benchmarking methodology

### Warning Signs
- Benchmark results presented as a single number without error bounds or variance
- No baseline run before the change was applied
- Different benchmark runs of the same configuration produce different results
- Decisions to deploy or revert based on a single benchmark comparison
- No mention of environment stability or system noise during the benchmark

### Why Harmful
A single benchmark run cannot distinguish signal from noise:
- System noise (GC, background cron, network jitter, other tenants) causes 5-15% variance
- A 5% improvement might be entirely within normal variance
- Decision to deploy a "3% improvement" that is actually noise
- Decision to revert a "2% regression" that was also noise
- Wasted engineering time chasing phantom improvements or regressions

### Consequences
- False positives — deploying changes that have no real performance benefit
- False negatives — reverting changes that are actually neutral or beneficial
- Wasted engineering hours on phantom improvements
- Inability to trust benchmark results for decision-making
- Performance regressions deployed because noise masked the regression

### Alternative
Establish a statistically rigorous benchmark protocol:
- Run at least 3-5 baseline measurements before any change
- Run 3-5 post-change measurements under identical conditions
- Report mean and standard deviation for both baseline and post-change
- Require improvement > 2 standard deviations to declare a real change
- Use the same environment, same time of day, same load generator
- Randomize run order (baseline/change/baseline/change) to control for temporal effects

### Refactoring Strategy
1. Establish a baseline: run the benchmark 5 times, record mean and standard deviation
2. Apply the change and run the benchmark 5 more times under identical conditions
3. Compare means: improvement must exceed 2x the pooled standard deviation
4. If improvement is less than the noise floor, the change is not measurable
5. Automate this protocol in CI with statistical comparison built into the pipeline

### Detection Checklist
- [ ] Baseline measurements exist before any change is applied
- [ ] Minimum 3 runs performed per configuration
- [ ] Standard deviation or variance reported alongside mean
- [ ] Improvement threshold defined (e.g., > 2 standard deviations)
- [ ] Same environment used for baseline and post-change runs
- [ ] Run order randomized to control for temporal effects
- [ ] CI pipeline implements statistical comparison, not single-run comparison

### Related Rules, Skills, Trees
- 05-rules.md: Benchmark Against a Known Baseline
- 06-skills.md: Design and Execute a Benchmark vs Load Test Campaign
- 07-decision-trees.md: Decision 1 — Benchmark vs Load Testing Approach
