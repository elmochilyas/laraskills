# Anti-Patterns: Workload Benefit Assessment

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | JIT Compilation |
| Knowledge Unit | Workload Benefit Assessment |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Assuming JIT Helps All Requests Uniformly | Expectation Management | Critical |
| 2 | Testing Only Web Requests for JIT Assessment | Methodology | High |
| 3 | Using Xdebug for CPU-Time Measurement | Methodology | Medium |
| 4 | Microbenchmarking JIT with Synthetic Tests | Methodology | Medium |
| 5 | Not Reassessing After Major Application Changes | Methodology | Low |

---

## Anti-Pattern 1: Assuming JIT Helps All Requests Uniformly

### Category
Expectation Management

### Description
Enabling JIT and expecting universal gains without profiling CPU-bound proportion of different request types.

### Why It Happens
Marketing creates monolithic expectations. No profiling infrastructure. Different endpoints assumed same profile.

### Warning Signs
JIT enabled without profiling. Mixed results across endpoints. Some improve, others don't. No endpoint CPU/I/O breakdown.

### Why Harmful
JIT benefit proportional to CPU-bound time. Fast API endpoints with 10% CPU see 0-5% gain. Report generation with 80% CPU sees 61-95% gain.

### Consequences
Disappointment when web endpoints don't improve. False conclusion JIT doesn't work. Missed optimization for background tasks.

### Alternative
Profile 3+ endpoints for CPU/I/O ratio. Segment expectations by type. Evaluate benefit per workload category.

### Refactoring Strategy
1. Profile 5 endpoints covering different types 2. Calculate CPU proportion 3. Set expectations per category 4. Prioritize over 30% CPU

### Detection Checklist
- [ ] Multiple endpoint types profiled
- [ ] JIT expectations set per workload category
- [ ] CPU-bound endpoints (>30%) identified
- [ ] JIT benefit measured per category

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Workload Benefit Assessment
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 2: Testing Only Web Requests for JIT Assessment

### Category
Methodology

### Description
Assessing JIT only on web API latency, ignoring queues, cron, and batch where JIT provides 61-95% gain.

### Why It Happens
Web is most visible. Background jobs not benchmarked. No performance monitoring of non-web PHP.

### Warning Signs
Assessment only covers web. Queue throughput not measured. Cron duration not tracked. JIT disabled for marginal web gain.

### Why Harmful
Queue workers processing data are often CPU-bound (61-95% JIT gain). Excluding them misses highest-ROI application.

### Consequences
JIT disabled across all workloads based on web-only data. Queue workers at 50% potential. Higher costs.

### Alternative
Include queue workers, cron, and batch in assessment. Benchmark throughput with/without JIT.

### Refactoring Strategy
1. Benchmark queue throughput JIT off 2. Enable JIT and re-benchmark 3. Benchmark cron run times 4. Document benefit per type

### Detection Checklist
- [ ] Non-web PHP included in assessment
- [ ] Queue workers benchmarked with/without JIT
- [ ] Cron/batch jobs benchmarked
- [ ] JIT decision based on total assessment

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Workload Benefit Assessment
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 3: Using Xdebug for CPU-Time Measurement

### Category
Methodology

### Description
Using Xdebug (50-200% overhead) to measure CPU vs I/O time for JIT assessment, distorting results.

### Why It Happens
Xdebug is most familiar. No production-safe profiler available. Unawareness Xdebug overhead distorts ratios.

### Warning Signs
Xdebug used for profiling. CPU time appears inflated. I/O wait percentage lower than actual. Overhead over 50%.

### Why Harmful
Xdebug adds 50-200% overhead non-uniformly. CPU operations appear much slower proportionally.

### Consequences
JIT benefit overestimated. Wrong investment decision for I/O-bound workloads.

### Alternative
Use sampling profilers (Blackfire, Tideways, SPX) with 1-5% overhead for JIT assessment.

### Refactoring Strategy
1. Install SPX or Blackfire 2. Profile endpoints 3. Extract actual CPU/I/O ratio 4. Use data for assessment

### Detection Checklist
- [ ] Sampling profiler used (not Xdebug)
- [ ] Profiling overhead < 5%
- [ ] CPU/I/O ratio from accurate measurement
- [ ] JIT assessment based on undistorted data

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Workload Benefit Assessment
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 4: Microbenchmarking JIT with Synthetic Tests

### Category
Methodology

### Description
Using PHPBench to predict application-level JIT benefit, overestimating real gains by 5-10x.

### Why It Happens
Microbenchmarks are easy with clean numbers. Published PHPBench shows 61-95% JIT gains. Unawareness they're CPU-bound by design.

### Warning Signs
JIT benefit estimated from PHPBench. Real gain much lower. Team confused by discrepancy. Synthetic benchmarks cited.

### Why Harmful
Microbenchmarks test CPU-bound arithmetic exclusively. Real apps include I/O, framework, and mixed workloads.

### Consequences
Unrealistic expectations. Disappointment when real gains are 3-15% vs 61-95%. JIT deemed useless.

### Alternative
Benchmark with real application endpoints and production-like workloads including DB, templates, middleware.

### Refactoring Strategy
1. Create application-level benchmark 2. Run with JIT on/off 3. Compare application vs synthetic gain 4. Use app-level data for decisions

### Detection Checklist
- [ ] JIT assessed with real application workloads
- [ ] Synthetic benchmarks labeled non-representative
- [ ] App-level gain used for ROI decisions
- [ ] Expectation gap understood

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Workload Benefit Assessment
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 5: Not Reassessing After Major Application Changes

### Category
Methodology

### Description
Assessing JIT benefit once at initial deployment and never re-evaluating after workload changes.

### Why It Happens
JIT configured once and forgotten. Assessment not part of change management. No automated regression testing.

### Warning Signs
JIT unchanged since initial setup. No re-assessment after major releases. Workload may have shifted.

### Why Harmful
As apps evolve, CPU-bound proportion changes. Adding image processing increases CPU. Adding API calls increases I/O.

### Consequences
JIT config may be suboptimal for current workload. Missed optimization for new CPU features.

### Alternative
Re-assess JIT benefit after significant changes: major upgrades, new CPU-intensive features, workload shifts.

### Refactoring Strategy
1. Add JIT re-assessment to release checklist 2. Re-profile CPU/I/O after significant changes 3. Adjust JIT config 4. Document trend

### Detection Checklist
- [ ] JIT benefit re-assessed after major changes
- [ ] CPU/I/O ratio re-profiled quarterly
- [ ] JIT config adjusted for workload changes
- [ ] Benefit trend documented

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Workload Benefit Assessment
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees
