# Anti-Patterns: JIT Concepts and Terminology

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | JIT Compilation |
| Knowledge Unit | JIT Concepts and Terminology |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Disabling JIT Because It Does Not Help Web Requests | Strategy | High |
| 2 | Expecting JIT to Fix I/O Bottlenecks | Expectation Management | Critical |
| 3 | Tuning JIT Before OpCache | Strategy | High |
| 4 | Enabling JIT Without Understanding Tracing vs Function Modes | Configuration | High |
| 5 | Disabling JIT Entirely Due to Marginal Web Benefit | Maintenance | Medium |

## Repository-Wide Anti-Patterns

- **JIT expectation mismatch**: Confusing JIT's domain (CPU-bound optimization) with OpCache's (compilation elimination) leads to incorrect performance expectations and configuration priorities across the entire performance stack.
- **Universal enablement fear**: Avoiding JIT entirely because of marginal web benefit, missing significant gains for cron jobs, queue workers, and batch processing.

---

## Anti-Pattern 1: Disabling JIT Because It Does Not Help Web Requests

### Category
Strategy

### Description
Disabling JIT entirely after observing minimal or no improvement for web request latency, ignoring that JIT provides 61-95% gain for CPU-bound code paths in cron jobs, queue workers, batch processing, and background tasks.

### Why It Happens
- Web request performance is the primary observation point
- No profiling of CLI scripts, queue workers, or batch jobs
- "If it doesn't help the web, it's useless" mindset
- JIT benefit on web requests is 0-5% for typical I/O-bound applications
- No separate benchmarking of non-web PHP processes

### Warning Signs
- JIT disabled in php.ini because "benchmarks showed no improvement for web requests"
- Queue workers and cron jobs run without JIT
- No profiling of CLI/PHP processes for CPU-bound code
- Batch processing jobs are slower than they could be
- JIT benefit only evaluated on web endpoints, not on other PHP processes
- "JIT doesn't work for our application" stated without benchmarking non-web workloads

### Why Harmful
JIT's primary benefit is for CPU-bound code that runs repeatedly:
- Queue workers processing large datasets get 61-95% throughput improvement
- Cron jobs and scheduled tasks with computational work benefit significantly
- Batch import/export jobs see dramatic speedups
- Report generation and data aggregation jobs run faster
- These non-web workloads are often more CPU-bound than web requests
- Disabling JIT globally means ALL PHP processes lose optimization, not just web workers

### Consequences
- Queue workers running at half the throughput they could achieve
- Batch jobs taking 2-10x longer than necessary
- Cron jobs consuming more CPU than needed
- Higher infrastructure costs for background processing
- Missed optimization opportunity that requires zero code changes
- Incorrect conclusion about JIT's value for the organization

### Alternative
Evaluate JIT benefit per SAPI context:
1. Profile web workers separately from CLI/queue processes
2. Benchmark queue worker throughput with and without JIT
3. Benchmark cron job execution time with and without JIT
4. Enable JIT globally if any significant CPU-bound workload benefits
5. If web-only consideration, keep JIT enabled (0-5% overhead is negligible)
6. Document: "JIT benefits: web = 2%, queue = 65%, cron = 40%"

### Refactoring Strategy
1. Enable JIT globally (opcache.jit=1254, jit_buffer_size=128M)
2. Benchmark queue worker throughput before and after
3. Benchmark cron job execution time before and after
4. Benchmark web request latency before and after
5. If any workload shows >5% improvement, keep JIT enabled for all
6. Document the measured benefit per workload type

### Detection Checklist
- [ ] JIT enabled on all PHP SAPI environments
- [ ] Non-web PHP processes profiled for JIT benefit
- [ ] Queue workers benchmarked with and without JIT
- [ ] Batch/cron jobs benchmarked with and without JIT
- [ ] JIT benefit quantified per workload type
- [ ] Decision to keep or disable JIT based on comprehensive profiling

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Concepts and Terminology
- 04-standardized-knowledge.md: Workload Benefit Assessment
- 05-rules.md: Enable JIT Universally
- 07-decision-trees.md: JIT Investment Decision Tree

---

## Anti-Pattern 2: Expecting JIT to Fix I/O Bottlenecks

### Category
Expectation Management

### Description
Expecting JIT compilation to improve performance for applications where the bottleneck is I/O wait (database queries, HTTP API calls, file system operations), despite JIT only optimizing CPU-bound PHP execution.

### Why It Happens
- Marketing around JIT ("PHP 8.0 is 2x faster!") creates universal expectations
- No profiling to distinguish CPU time from I/O wait time
- Confusing throughput improvements from OpCache (2-4x) with JIT
- Hope that a simple configuration change will fix performance issues
- Unawareness that JIT optimizes CPU execution, not I/O or network latency

### Warning Signs
- Application spending >50% of time waiting for database queries
- JIT enabled but p95 latency unchanged
- Profiling shows I/O wait time dominates (>70% of total)
- "We enabled JIT and it didn't help" — without profiling the bottleneck first
- Expected throughput improvement quoted from synthetic benchmarks, not workload-specific
- Trying different JIT modes to fix I/O-bound performance

### Why Harmful
JIT optimizes CPU execution, not I/O:
- For I/O-bound applications, total response time is dominated by I/O wait (database, cache, external APIs)
- JIT optimizes the CPU portion: PHP opcode execution, function calls, property access
- If only 30% of time is CPU, even a 50% CPU improvement yields only 15% total improvement
- Effort spent configuring and tuning JIT for I/O bottlenecks delays real fixes
- Team misdiagnoses the problem as "PHP is slow" instead of "database is slow"

### Consequences
- JIT provides 0-5% improvement for I/O-bound applications
- Effort wasted tuning JIT when database optimization would provide 10-100x gain
- False conclusion: "PHP 8.0 JIT is useless" (incorrect — JIT works, wrong bottleneck)
- Database query performance degrades while team focuses on JIT
- Real issue (N+1 queries, missing indexes, slow queries) remains unaddressed
- Team learns the wrong lesson: avoid JIT rather than fix the actual bottleneck

### Alternative
Fix I/O bottlenecks first, then evaluate JIT:
1. Profile to measure CPU time vs I/O wait time
2. If I/O wait > 50%, focus on database optimization, caching, and query improvement
3. After I/O is optimized, re-profile to see if CPU time has become the dominant factor
4. If CPU time > 30% of remaining time, JIT will help
5. Enable JIT and measure the incremental improvement over I/O-optimized baseline

### Refactoring Strategy
1. Profile a representative request — measure CPU vs I/O wait time
2. If I/O wait dominates, create a list of slow queries and missing indexes
3. Optimize the top 3 I/O bottlenecks (query tuning, caching, connection pooling)
4. Re-profile after I/O optimization
5. If CPU time is now significant (>30%), enable and tune JIT
6. Document: "JIT provides X% gain after I/O bottlenecks are resolved"

### Detection Checklist
- [ ] CPU vs I/O wait time measured
- [ ] I/O bottlenecks identified and prioritized before JIT tuning
- [ ] JIT benefit assessed after I/O optimization, not before
- [ ] No expectation that JIT fixes slow database queries
- [ ] Team understands JIT's domain: CPU-bound execution optimization
- [ ] Performance roadmap prioritizes I/O optimization before JIT tuning

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Concepts and Terminology
- 05-rules.md: Fix I/O Bottlenecks Before JIT Tuning
- 07-decision-trees.md: Workload Benefit Assessment Decision Tree

---

## Anti-Pattern 3: Tuning JIT Before OpCache

### Category
Strategy

### Description
Spending time configuring and tuning JIT parameters while OpCache is misconfigured (undersized memory, low hit rate, disabled), missing the 2-4x throughput gain that proper OpCache configuration provides as a prerequisite to JIT.

### Why It Happens
- JIT is newer and more exciting than OpCache
- "More optimization = better" applied to JIT before basic OpCache is verified
- Copy-paste of JIT-focused configuration from online guides
- Unawareness that JIT compiles OpCache's opcodes — without OpCache, JIT has nothing to compile
- OpCache is "installed by default" so assumed to be correctly configured

### Warning Signs
- JIT parameters tuned (mode, buffer size, thresholds) but OpCache is at default settings
- opcache.memory_consumption = 64 (default for small apps, insufficient for large)
- opcache.max_accelerated_files at default (too low for many PHP files)
- opcache_get_status() shows cache full, cache misses, or low hit rate
- Compilation time still visible in profiling (OpCache should eliminate it)
- JIT buffer sized at 256MB but OpCache memory is only 64MB

### Why Harmful
OpCache is the foundation JIT builds on:
- JIT reads opcodes from OpCache shared memory
- If OpCache is misconfigured (cache full, files not cached, low hit rate), JIT has fewer opcodes to compile
- OpCache provides 2-4x throughput gain with proper configuration (memory, files, preloading)
- JIT provides 0-95% on top of OpCache — it amplifies OpCache's benefit
- Tuning JIT before OpCache is like tuning a race car's engine while the tires are flat
- The majority of performance gain comes from OpCache, not JIT

### Consequences
- JIT benefit limited because OpCache is not caching all files
- OpCache thrashing (cache full — files evicted and recompiled) wastes CPU
- OpCache hit rate below 99% means compilation overhead on some requests
- JIT buffer sized correctly but OpCache is bottleneck
- Performance left on the table from both OpCache AND JIT
- Effort misallocated to advanced tuning when basic configuration is missing

### Alternative
Configure in order: OpCache first, then JIT:
1. Enable OpCache (opcache.enable=1)
2. Set OpCache memory (memory_consumption=256, or more for large apps)
3. Set file count (max_accelerated_files to cover all PHP files)
4. Verify OpCache hit rate > 99%
5. Configure preloading for cold-start optimization
6. THEN enable and tune JIT on top of properly configured OpCache

### Refactoring Strategy
1. Check OpCache status: is it enabled? What's the hit rate?
2. Fix OpCache first: set memory, file count, validation strategy
3. Verify opcache_get_status() shows > 99% hit rate and sufficient free memory
4. Only after OpCache is verified, enable JIT
5. Set JIT buffer size considering OpCache memory budget
6. Benchmark the combined gain

### Detection Checklist
- [ ] OpCache properly configured before JIT tuning
- [ ] OpCache hit rate > 99% (cache misses < 1%)
- [ ] OpCache memory not exhausted (hits_ratio > 99%)
- [ ] JIT buffer sized considering total OpCache + JIT memory budget
- [ ] Profiling shows zero compilation time (OpCache working correctly)
- [ ] JIT benefit assessed on top of working OpCache

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: OpCache Configuration
- 04-standardized-knowledge.md: JIT Concepts and Terminology
- 05-rules.md: Configure OpCache Before JIT
- 07-decision-trees.md: Optimization Priority Decision Tree

---

## Anti-Pattern 4: Enabling JIT Without Understanding Tracing vs Function Modes

### Category
Configuration

### Description
Setting opcache.jit to a random bitmask value or copying a mode from an online guide without understanding the difference between tracing JIT (loop optimization) and function JIT (method optimization), resulting in suboptimal performance for the specific workload.

### Why It Happens
- JIT mode bitmasks (1254, 1205, 1235) look like opaque magic numbers
- Copy-paste from tutorials without understanding the differences
- "Higher number = better optimization" assumption
- No profiling to determine whether the workload is loop-heavy or function-call-heavy
- Setting opcache.jit=1235 (maximum) thinking it's always best

### Warning Signs
- opcache.jit=1235 set "for maximum performance" without workload analysis
- Application is ORM-heavy (many method calls) but using tracing mode (1254)
- Application is template-heavy (loops) but using function mode (1205)
- No comparison of different JIT modes in benchmarking
- Profiling shows JIT is compiling but not the right code paths
- Buffer fragmentation high because mode is mismatched to workload

### Why Harmful
Using the wrong JIT mode misses optimization opportunities:
- Tracing JIT (1254/1255) optimizes loop execution — ideal for templating, data processing, array iteration
- Function JIT (1205) optimizes function/method calls — ideal for ORM, domain logic, service layers
- Using tracing mode for a function-call-heavy workload compiles traces that span function boundaries
- Using function mode for a loop-heavy workload misses loop optimization opportunities
- The wrong mode can increase JIT memory fragmentation (function JIT fragments more)
- Benchmark differences between modes can be 10-30% for mismatched workloads

### Consequences
- 10-30% lower performance than the right mode would provide
- Higher JIT memory fragmentation (wrong mode produces more compiled code segments)
- JIT buffer fills faster with less useful compiled code
- Warm-up time may be longer (wrong mode compiles the wrong paths first)
- Team may conclude JIT doesn't work when the issue is wrong mode
- Repeated mode changes requiring PHP-FPM restarts

### Alternative
Select JIT mode based on workload profile:
1. Profile the application: is execution dominated by loops or function calls?
2. For loop-heavy workloads (templating, ETL, data processing): Tracing JIT (1254)
3. For function-call-heavy workloads (ORM, domain services, API controllers): Function JIT (1205)
4. For mixed workloads or uncertainty: Default to Tracing JIT (1254) — it's the best general-purpose mode
5. Benchmark at least two modes before finalizing
6. Document the chosen mode and the profiling that led to the decision

### Refactoring Strategy
1. Profile the application's execution pattern: loop count vs function call count
2. Start with Tracing JIT (1254) as the baseline
3. Benchmark throughput and latency
4. Switch to Function JIT (1205) and re-benchmark
5. If difference < 5%, keep Tracing JIT (more stable, less fragmentation)
6. If Function JIT is > 10% better, use 1205 for the workload

### Detection Checklist
- [ ] JIT mode selected based on workload profile (not random bitmask)
- [ ] Tracing vs Function mode understood by the team
- [ ] Workload classified as loop-heavy or function-call-heavy
- [ ] At least two modes benchmarked before finalizing
- [ ] Default mode is 1254 (Tracing) for mixed/uncertain workloads
- [ ] Mode change coordinated with PHP-FPM restart
- [ ] Buffer fragmentation monitored after mode change

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Mode Comparison
- 04-standardized-knowledge.md: CRTO Bitmask Reference
- 05-rules.md: Select Mode Based on Workload Profile
- 07-decision-trees.md: JIT Mode Selection Decision Tree

---

## Anti-Pattern 5: Disabling JIT Entirely Due to Marginal Web Benefit

### Category
Maintenance

### Description
Disabling JIT globally after observing 0-5% improvement for web requests, ignoring that JIT has 0-2% overhead when not beneficial and provides significant gains for non-web PHP processes (queue workers, cron, batch jobs).

### Why It Happens
- Web performance is the only metric tracked
- JIT overhead (buffer memory, compilation CPU) appears wasteful for no web benefit
- "If it doesn't help the web, disable it" — reasonable but short-sighted
- No monitoring of non-web PHP process performance
- JIT buffer memory (128MB) seen as waste for marginal benefit

### Warning Signs
- JIT disabled because "it didn't help our web application"
- Queue workers and cron jobs run without JIT
- No measurement of queue worker throughput with/without JIT
- Batch processing times haven't been benchmarked
- Infrastructure costs for background processing not tracked
- "We're saving 128MB per worker by disabling JIT" — but workers don't all run concurrently

### Why Harmful
JIT's memory cost is small relative to its potential benefit:
- 128MB per JIT buffer is virtual memory (not physical until used)
- In FPM with 50 workers, JIT buffers consume virtual address space but minimal physical memory until compiled code is generated
- Queue workers processing large datasets can see 61-95% throughput improvement
- A 50% improvement in queue worker throughput means fewer workers needed (saving more memory than JIT uses)
- The overhead of keeping JIT enabled (0-2% CPU) is negligible compared to the potential gain

### Consequences
- Queue workers running at half their potential throughput
- Batch jobs taking 2-10x longer than necessary
- Higher infrastructure costs for background processing (more workers, longer run times)
- Missed optimization that requires zero code changes
- False sense of optimization (saving memory) while wasting compute
- Inability to quantify missed opportunity (no baseline with JIT enabled)

### Alternative
Keep JIT enabled universally and measure per-workload benefit:
1. Enable JIT globally (1254, 128MB) — the overhead is negligible
2. Benchmark web latency before and after (expect 0-5% improvement or neutral)
3. Benchmark queue worker throughput before and after (expect 20-95% improvement)
4. Benchmark cron job execution time before and after
5. Quantify the total benefit across all PHP workloads
6. The memory overhead (128MB virtual) is almost always worth the benefit

### Refactoring Strategy
1. Re-enable JIT globally (opcache.jit=1254, jit_buffer_size=128M)
2. Benchmark queue worker throughput before and after
3. Benchmark batch job execution time before and after
4. Calculate the infrastructure cost savings from JIT
5. Compare JIT memory cost vs infrastructure savings
6. Document the net benefit of keeping JIT enabled

### Detection Checklist
- [ ] JIT enabled on all production PHP processes
- [ ] Non-web PHP workloads benchmarked with and without JIT
- [ ] Net benefit (gains minus overhead) calculated
- [ ] JIT memory overhead quantified (virtual vs physical)
- [ ] Decision to enable/disable JIT based on total benefit, not web-only metric
- [ ] JIT benefit reviewed periodically as workload changes
- [ ] JIT overhead measured and confirmed < 2% CPU for any workload

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Concepts and Terminology
- 04-standardized-knowledge.md: Workload Benefit Assessment
- 05-rules.md: Keep JIT Enabled Universally
- 07-decision-trees.md: JIT Investment Decision Tree
