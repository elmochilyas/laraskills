# ECC Anti-Patterns — Search Performance Benchmarking
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Search UX and Analytics | Knowledge Unit | Search Performance Benchmarking | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Benchmarking with Non-Realistic Data
2. Measuring Average Latency Instead of Percentiles
3. Single-Thread Benchmarking Without Concurrency
4. No Warm-Up Period Before Measurement
5. Not Documenting Benchmark Conditions
---
## Repository-Wide Anti-Patterns
- Only benchmarking before production, not continuously
- Not benchmarking both search and indexing paths
- Comparing benchmarks across different hardware/conditions
---
## Anti-Pattern 1: Benchmarking with Non-Realistic Data
### Category
Data Quality | Performance
### Description
Running performance benchmarks with too little data, wrong data distribution, or synthetic queries that don't reflect production usage patterns.
### Why It Happens
Production-scale data is hard to obtain (privacy, size). Teams use whatever data is available.
### Warning Signs
- Benchmarks with < 10% of production data volume
- Query distribution different from production logs
- Test data doesn't have production's cardinality or skew
- Benchmark results don't match production performance
### Why Harmful
Small datasets fit in memory and cache, producing unrealistic latency results. Search engines and databases perform differently at scale. Benchmarks on small data give false confidence.
### Consequences
- Performance surprises in production
- Capacity planning based on wrong data
- Optimizations that work on small data fail at scale
- Production degradation despite passing benchmarks
### Alternative
Use production-scale data (or representative sample) with realistic query distributions for benchmarking.
### Refactoring Strategy
1. Extract production query log (anonymized if needed)
2. Generate benchmark dataset matching production volume
3. Replay production query patterns (frequency, distribution)
4. Compare benchmark results with production monitoring
5. Document data size and query mix in benchmark report
### Detection Checklist
- [ ] Benchmark data volume matches production scale
- [ ] Query distribution matches production patterns
- [ ] Results correlate with production monitoring
- [ ] Data provenance documented in benchmarks
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: Measuring Average Latency Instead of Percentiles
### Category
Performance | Data Quality
### Description
Reporting only average (mean) latency, hiding tail latency issues that affect real user experience.
### Why It Happens
Average latency is simple to calculate and understand. Developers may not know about percentile metrics.
### Warning Signs
- Performance reports show only "average latency: 45ms"
- No P95 or P99 metrics tracked
- Average looks good but users complain about slowness
- Latency spikes hidden in the average
### Why Harmful
Mean latency is misleading because a few very fast queries can mask many slow ones. P95 and P99 latency directly measures the experience of the slowest users who are most likely to abandon.
### Consequences
- False confidence in search performance
- Slow users don't complain, they just leave
- Capacity planning misses tail latency issues
- Optimization efforts focused on wrong metrics
### Alternative
Always measure and report P50, P95, and P99 latency. Target P95 < 200ms for web search.
### Refactoring Strategy
1. Add percentile calculation to benchmark tool
2. Report P50, P95, P99 in all benchmark results
3. Set P95 and P99 SLOs
4. Monitor percentiles continuously (not just during benchmarks)
5. Optimize for P95/P99, not mean
### Detection Checklist
- [ ] P50, P95, P99 latency measured
- [ ] Average latency not used as primary metric
- [ ] P95 SLO defined and tracked
- [ ] Tail latency optimized
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: Single-Thread Benchmarking Without Concurrency
### Category
Performance | Data Quality
### Description
Testing latency with single-threaded sequential queries, not reflecting real-world concurrent load.
### Why It Happens
Simple benchmark scripts loop through queries sequentially. Concurrent testing requires more complex tooling.
### Warning Signs
- Benchmark uses simple `foreach` loop
- Only one query executing at a time
- No concurrency parameter in benchmark setup
- Results don't match production latency under load
### Why Harmful
Single-threaded benchmarks miss contention issues. Many search engines handle single queries fast but degrade under concurrent load due to resource contention, connection pooling, and queueing.
### Consequences
- Performance degradation under real-world load
- Unexpected latency spikes during peak traffic
- Capacity planning underestimates resource needs
- Benchmark results don't predict production behavior
### Alternative
Benchmark at expected concurrency levels using tools like k6, artillery, or JMeter.
### Refactoring Strategy
1. Determine expected concurrent query load from production (e.g., 50 QPS)
2. Set up k6 or artillery benchmark with concurrent virtual users
3. Test at 1x, 2x, 3x expected concurrency
4. Measure latency at each concurrency level
5. Document throughput vs latency curve
### Detection Checklist
- [ ] Concurrent load testing implemented
- [ ] Tested at expected production concurrency
- [ ] Throughput vs latency curve documented
- [ ] Degradation pattern under load understood
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 4: No Warm-Up Period Before Measurement
### Category
Performance | Data Quality
### Description
Starting latency measurements immediately without warming up the system, measuring cold-cache performance as representative.
### Why It Happens
Benchmark scripts start measurement on the first query without a warm-up phase.
### Warning Signs
- First queries in benchmark much slower than later ones
- Cache hit ratio starts at 0% and rises during benchmark
- No warm-up phase in benchmark script
- Cold-start latency used in performance SLOs
### Why Harmful
Cold-cache performance is significantly worse than steady-state. Production systems operate with warm caches. Using cold-start data gives misleading performance estimates and sets incorrect expectations.
### Consequences
- Overestimated infrastructure costs (provisioning for cold-start)
- Incorrect latency SLOs
- Benchmarks not reproducible over time
- Optimization effort spent on cold-start issues
### Alternative
Run warm-up queries before measurement period. Start measurement after cache is populated.
### Refactoring Strategy
1. Add warm-up phase: 100+ queries before measurement
2. Verify cache hit ratio stabilizes before measuring
3. Document warm-up procedure
4. Report both cold-start and steady-state latency
5. Monitor cache hit ratio during benchmark
### Detection Checklist
- [ ] Warm-up phase included in benchmark
- [ ] Cache hit ratio stable before measurement
- [ ] Warm-up and measurement phases separated
- [ ] Cold vs steady-state latency documented
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: Not Documenting Benchmark Conditions
### Category
Maintainability | Process
### Description
Running benchmarks without recording the conditions (hardware, data size, query mix, configuration), making results non-reproducible and non-comparable.
### Why It Happens
Benchmarks are run informally. Documentation is an afterthought.
### Warning Signs
- Benchmark results without environment details
- Cannot reproduce a benchmark from 3 months ago
- Different team members get different results with no explanation
- Benchmark reports don't include configuration
### Why Harmful
Undocumented benchmarks are useless for trend analysis. You cannot compare results across time, environments, or configuration changes because you don't know what changed between runs.
### Consequences
- Inability to track performance trends
- Benchmark comparison across time impossible
- Wasted effort re-running benchmarks to establish context
- Decisions made on incomparable data
### Alternative
Document benchmark conditions: hardware specs, data volume, query distribution, configuration parameters, date, tool version.
### Refactoring Strategy
1. Create benchmark report template including conditions
2. Automatically capture environment details in benchmark script
3. Store benchmark results with metadata
4. Version benchmark configuration
5. Review and compare results with identical conditions
### Detection Checklist
- [ ] Benchmark conditions documented
- [ ] Automated environment capture in benchmark script
- [ ] Results stored with metadata
- [ ] Year-over-year comparison possible
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
