# Anti-Patterns: PHP Execution Lifecycle

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | PHP Execution Lifecycle |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Disabling OpCache in Production | Configuration | Critical |
| 2 | Measuring Only Execution Time Without Accounting for Compilation | Methodology | High |
| 3 | Ignoring Cold vs Warm Request Behavior | Methodology | High |
| 4 | Tuning Execution Without Optimizing Compilation | Strategy | High |
| 5 | Confusing the Pipeline Stage Being Optimized | Conceptual | Medium |

## Repository-Wide Anti-Patterns

- **Pipeline blindness**: Not understanding which phase of the execution pipeline (lexing, parsing, compilation, execution) an optimization targets leads to applying wrong fixes and misattributing results.
- **Cold-cache benchmarking**: Measuring performance immediately after deployment without accounting for OpCache/JIT warm-up produces results that are not representative of steady-state operation.

---

## Anti-Pattern 1: Disabling OpCache in Production

### Category
Configuration

### Description
Disabling or misconfiguring OpCache in production environments, forcing every request to re-lex, re-parse, and re-compile all PHP source files, resulting in 2-4x throughput loss compared to OpCache-enabled operation.

### Why It Happens
- Development habit: OpCache is often disabled in dev for instant code changes
- Copying php.ini from development to production without modification
- Troubleshooting "weird" behavior by disabling OpCache (and forgetting to re-enable)
- Using `opcache.enable=0` as a debugging step without clean-up
- Docker/container configurations that default to OpCache disabled
- Composer install or cache clear commands that inadvertently disable OpCache

### Warning Signs
- `opcache.enable=0` in production php.ini
- No OpCache status information available (opcache_get_status() returns false)
- All requests showing file mtime checks or compilation overhead in profiling
- CPU utilization higher than expected without corresponding throughput increase
- First request after deployment shows no improvement from subsequent requests (no caching)
- `opcache_get_status()` shows zero cache hits or cache is empty

### Why Harmful
Without OpCache, every request re-executes the entire compilation pipeline:
- Lexing: source code → tokens (I/O intensive, reads all PHP files from disk)
- Parsing: tokens → AST (CPU intensive, builds syntax tree)
- Compilation: AST → opcodes (CPU intensive, generates Zend VM instructions)
- These three phases take 2-4x the time of pure execution for typical web applications
- OpCache eliminates all three phases for cached files, serving pre-compiled opcodes from shared memory
- The throughput difference between OpCache-enabled and OpCache-disabled is typically 2-4x

### Consequences
- 2-4x throughput loss compared to OpCache-enabled state
- CPU utilization 2-4x higher than necessary
- Higher latency under load (compilation phases consume CPU that could serve requests)
- Higher infrastructure costs (need more servers for same throughput)
- Unfair performance comparisons ("our app is slow" when the issue is OpCache disabled)
- Inability to diagnose other performance issues (OpCache overhead masks everything)

### Alternative
Always enable OpCache in production:
- `opcache.enable=1` in production php.ini
- `opcache.enable_cli=0` (keep CLI fast, use `opcache.enable_cli=1` only for specific scripts)
- Configure memory: `opcache.memory_consumption=256` (or more for large applications)
- Configure file count: `opcache.max_accelerated_files` set to approximate count of PHP files
- For deployment, use `opcache_reset()` or graceful reload instead of disabling
- Set `opcache.validate_timestamps=0` for maximum performance (manage via deploy pipeline)

### Refactoring Strategy
1. Verify OpCache status: run `php -r "print_r(opcache_get_status(false));"` on production
2. If disabled: enable in php.ini, restart PHP-FPM
3. Configure memory and file limits based on application size
4. Verify cache is populated after restart (opcache_get_status() shows hits)
5. Compare throughput before and after enabling to measure the gain
6. Add monitoring: alert if OpCache status shows zero hits or disabled state

### Detection Checklist
- [ ] `opcache.enable=1` in production php.ini
- [ ] `opcache_get_status()` returns valid cache data with hits
- [ ] OpCache cache hit ratio > 99%
- [ ] No `opcache.enable=0` in any production configuration file
- [ ] Deployment process includes cache reset or graceful reload
- [ ] Docker/container images have OpCache enabled by default
- [ ] Monitoring alerts on OpCache disabled status or zero hits

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: PHP Execution Lifecycle
- 04-standardized-knowledge.md: OpCache Purpose and Mechanics
- 05-rules.md: Always Enable OpCache in Production
- 07-decision-trees.md: OpCache Configuration Decision Tree

---

## Anti-Pattern 2: Measuring Only Execution Time Without Accounting for Compilation

### Category
Methodology

### Description
Benchmarking or profiling only the execution phase of the PHP lifecycle, ignoring the compilation time that occurs on cold cache (after deployment, restart, or cache reset) — leading to performance conclusions that are only valid for warm cache states.

### Why It Happens
- Profiling tools typically measure execution time starting after compilation
- Cold vs warm differentiation requires explicit methodology
- Most benchmarks are run after warm-up, masking cold performance
- Deployment performance (cold cache) is rarely benchmarked
- Focus on steady-state performance without considering what users experience after deployment

### Warning Signs
- Benchmark methodology doesn't mention cold vs warm cache state
- All benchmarks are run after "warming up" without reporting cold performance
- Deployment process involves a `opcache_reset()` that creates a cold cache period
- User reports of slowness after deployments that aren't reflected in benchmarks
- No distinction between "deployment performance" and "steady-state performance" in SLIs
- Preloading not used to mitigate cold-start latency

### Why Harmful
Cold cache performance matters because:
- Every deployment triggers a cold cache (opcache_reset, file change timestamps, pod restart)
- Cold requests during the warm-up window (seconds to minutes depending on traffic) have 2-4x latency
- Users hitting the application during or immediately after deployment experience this latency
- SLIs that only measure warm performance miss deployment-related degradation
- Capacity planning based on warm performance underestimates cold-start resource needs

### Consequences
- SLO violations during deployment windows not caught by warm-only benchmarks
- Users experiencing slow responses after every deployment
- Incorrect capacity planning: warm benchmarks underestimate cold-start resource requirements
- Performance during deployment windows invisible in dashboards
- Preloading and cache warm-up strategies not evaluated or implemented
- False confidence in deployment performance

### Alternative
Measure and report both cold and warm performance:
1. Cold benchmark: immediately after cache reset, measure the first N requests (N = requests to steady state)
2. Warm benchmark: after steady state is reached (OpCache populated, JIT compiled)
3. Report both in performance dashboards: cold latency, warm-up duration, warm latency
4. Set internal SLOs for both cold and warm performance
5. Use preloading and cache warm-up scripts to reduce cold cache impact
6. Monitor cold cache duration in production (time from deployment to steady state)

### Refactoring Strategy
1. Design a benchmark protocol that includes cold cache state
2. Run cold benchmark: reset OpCache, immediately start measurement
3. Run warm benchmark: warm up for 30+ seconds, then measure
4. Document the cold→warm transition: latency over time from cold to steady state
5. Implement cache warm-up in deployment pipeline
6. Track cold cache duration as an operations metric

### Detection Checklist
- [ ] Cold cache performance measured and reported separately
- [ ] Warm cache performance measured and reported separately
- [ ] Cold→warm warm-up duration tracked (time to steady state)
- [ ] Preloading or cache warm-up used to reduce cold cache impact
- [ ] SLOs or internal targets set for cold performance
- [ ] Production dashboards show both cold and warm performance

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: PHP Execution Lifecycle
- 05-rules.md: Measure Both Cold and Warm Performance
- 07-decision-trees.md: Cold vs Warm Benchmark Decision Tree

---

## Anti-Pattern 3: Ignoring Cold vs Warm Request Behavior

### Category
Methodology

### Description
Treating all requests as having the same execution lifecycle cost, ignoring that first requests after deployment, cache reset, or JIT warm-up have significantly higher latency than steady-state requests due to compilation and optimization phases.

### Why It Happens
- Default monitoring tools aggregate all requests regardless of cache state
- Cold requests are a small fraction of total requests and get lost in averages
- No instrumentation to tag requests as "cold" or "warm"
- Deployment monitoring focuses on error rate and basic latency, not cache state
- Understanding cache state requires knowledge of PHP internals that many teams lack

### Warning Signs
- Average latency metric is stable but deployment-related latency spikes are visible
- Monitoring dashboards don't distinguish between cold and warm request latency
- Post-deployment latency is higher than baseline but no one investigates why
- OpCache reset events are not tracked or correlated with performance data
- Requests after deployment have higher error rates (timeouts from slow cold responses)
- No preloading or cache warm-up script exists in the deployment pipeline

### Why Harmful
Cold requests behave fundamentally differently:
- Cold requests include compilation time (lexing, parsing, opcode compilation) — 2-4x normal time
- JIT requires hundreds of requests to reach optimal performance
- A deployment creates a window of degraded performance that users experience
- If not isolated and measured, cold request latency contaminates aggregate metrics
- Teams may deploy performance optimizations based on warm data that don't help cold requests

### Consequences
- Aggregate latency metrics are misleading (include cold data in averages)
- Post-deployment latency degradation goes unnoticed or unmeasured
- Users experience slow responses after each deployment
- No data to evaluate cache warm-up strategy effectiveness
- Deployment pipeline improvements that reduce cold impact are not prioritized
- Incorrect conclusions about performance improvements (measured warm, deployed cold)

### Alternative
Tag and segment requests by cache state:
1. Tag requests as "cold" (within N seconds of deployment/cache reset) or "warm"
2. Report separate latency metrics for cold and warm requests
3. Measure warm-up duration: time from deployment to steady-state latency
4. Set a budget for warm-up duration (e.g., "latency normalizes within 60s of deploy")
5. Monitor cold request ratio: percentage of requests served with cold cache
6. Optimize cold performance independently from warm performance

### Refactoring Strategy
1. Add deployment timestamp tracking to the application (env var or config)
2. Tag requests within the first N seconds of deployment as "cold"
3. Create separate dashboards for cold and warm latency
4. Measure warm-up duration (time for latency to return to baseline)
5. Evaluate preloading and cache warm-up to reduce cold impact
6. Set SLOs for both cold and warm performance

### Detection Checklist
- [ ] Requests tagged as cold or warm based on cache state
- [ ] Cold and warm latency reported separately in dashboards
- [ ] Warm-up duration measured and tracked over time
- [ ] Preloading evaluated for cold-start latency reduction
- [ ] Cache warm-up implemented in deployment pipeline
- [ ] Cold request ratio monitored and kept below threshold
- [ ] SLOs defined for both cold and warm performance

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: PHP Execution Lifecycle
- 05-rules.md: Segment Metrics by Cache State
- 07-decision-trees.md: Cold vs Warm Analysis Decision Tree

---

## Anti-Pattern 4: Tuning Execution Without Optimizing Compilation

### Category
Strategy

### Description
Focusing all optimization effort on execution phase improvements (JIT tuning, opcode micro-optimizations, algorithm improvements) while ignoring the compilation phase, which OpCache addresses with 2-4x gains for zero code changes.

### Why It Happens
- Execution optimization is more interesting (algorithms, data structures, JIT)
- OpCache is "already installed" and assumed to be correctly configured
- Execution improvements are visible in microbenchmarks and feel more "engineery"
- Compilation optimization (OpCache tuning) is seen as a one-time config task
- OpCache misconfiguration is not checked before starting execution optimization

### Warning Signs
- JIT tuning is the primary performance activity without verifying OpCache configuration
- OpCache memory_consumption is at default value (64MB or 128MB) for a large application
- `opcache_get_status()` shows cache full, cache misses, or low hit rate
- Compilation appears as a significant time in profiling (should be near zero with OpCache)
- Performance improvements from code changes are <5% when OpCache could provide 2-4x
- No OpCache configuration review in the performance optimization checklist

### Why Harmful
Optimizing execution without compilation is inefficient:
- OpCache provides 2-4x throughput gain with zero code changes and minimal configuration
- Execution micro-optimizations typically provide 1-10% gain with significant code changes
- A 5% execution improvement is invisible if OpCache is disabled (2-4x baseline hole)
- OpCache tuning is a one-time effort; execution optimization requires ongoing maintenance
- The order matters: first eliminate the 2-4x compilation overhead, then fine-tune execution

### Consequences
- Hours spent on execution micro-optimizations when OpCache could provide 2-4x gain
- Performance team effort wasted on marginal gains
- OpCache misconfiguration silently losing throughput
- Baseline throughput is 2-4x below what it should be, making other optimizations look worse
- Team becomes discouraged ("our optimizations only improved things by 2%")

### Alternative
Optimize the pipeline in order:
1. First: enable and tune OpCache (compilation phase) — 2-4x gain, zero code changes
2. Second: enable and tune JIT if workload is CPU-bound (execution phase) — 5-20% additional gain
3. Third: application-level optimizations (algorithms, caching, queries) — variable gains
4. Fourth: micro-optimizations (opcode reduction, typed properties) — 1-5% gains
5. Skip any step if the gain from the previous step is not realized

### Refactoring Strategy
1. Check OpCache status: enabled, memory proper, hit rate > 99%
2. If OpCache is disabled or misconfigured, fix it first (highest ROI)
3. After OpCache is verified, evaluate JIT if workload is CPU-bound
4. Only then optimize application code
5. Measure the cumulative gain from each step
6. Document the optimization stack and verify each layer

### Detection Checklist
- [ ] OpCache enabled and properly configured
- [ ] OpCache hit rate > 99% (cache misses < 1%)
- [ ] OpCache memory is not exhausted (check hits_ratio)
- [ ] Compilation time in profiling is near zero
- [ ] Execution optimization only pursued after compilation optimization is verified
- [ ] Optimization hierarchy (compile → execute → application) followed

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: PHP Execution Lifecycle
- 04-standardized-knowledge.md: OpCache Configuration
- 05-rules.md: Optimize Compilation Before Execution
- 07-decision-trees.md: Optimization Priority Decision Tree

---

## Anti-Pattern 5: Confusing the Pipeline Stage Being Optimized

### Category
Conceptual

### Description
Misidentifying which phase of the execution pipeline (lexing, parsing, compilation, execution, JIT) an optimization targets, leading to incorrect attribution of results and applying optimizations that don't address the actual bottleneck.

### Why It Happens
- The pipeline phases are abstract and invisible in normal development
- Monitoring tools don't break down time into pipeline phases
- Documentation often groups phases vaguely (e.g., "PHP processing time")
- Teams lack understanding of where OpCache, JIT, and preloading operate in the pipeline
- The phases are sequential and the output of one is input to the next, making it hard to isolate

### Warning Signs
- "We enabled JIT but first request is still slow" (JIT doesn't affect compilation — OpCache does)
- "We tuned OpCache memory but execution is still slow" (OpCache doesn't affect execution)
- "Preloading didn't make requests faster" (preloading affects first-request bootstrap, not all requests)
- "Our database optimization didn't help the compilation time" (database optimization affects execution only)
- Performance discussions conflate "compilation" and "execution" improvements
- Optimization results are attributed to the wrong pipeline stage

### Why Harmful
Pipeline confusion leads to:
- Wrong configuration: tuning JIT when OpCache is the problem
- Wrong tool selection: using a code optimizer when the issue is execution time
- Wasted effort: preloading classes that are not loaded during warm-up
- Incorrect results attribution: claiming "JIT improved by 20%" when it was actually OpCache tuning
- Inability to diagnose performance issues systematically
- Performance optimizations applied to the wrong stage of the pipeline

### Consequences
- Configuration tuned for wrong pipeline stage (e.g., JIT buffer sized instead of OpCache memory)
- Performance issues misdiagnosed and unfixed
- Optimization results incorrectly attributed (bad data for future decisions)
- Effort wasted on tools and techniques that target the wrong phase
- Team learning the wrong mental model of PHP performance
- Inconsistent configuration across environments due to misunderstanding

### Alternative
Map each optimization to its pipeline phase:
- Lexing/Parsing: OpCache file cache (pre-compiled files), code splitting (fewer files)
- Compilation: OpCache (shared memory opcodes), optimization level bitmask, preloading
- Execution: Typed properties, JIT, algorithm optimization, data structure selection
- All phases: Reduce code complexity, eliminate dead code, use fewer files
- Know which phase you are optimizing and verify the result in that phase's metrics

### Refactoring Strategy
1. Draw the pipeline: Lex → Parse → Compile → Execute → (JIT → Native)
2. For each optimization, write which phase it targets
3. Before optimizing, profile to identify which phase is the bottleneck
4. Apply the optimization that targets that phase
5. Verify by re-profiling: did the target phase's time decrease?
6. Document: "Optimization X targets phase Y, confirmed by Z metric"

### Detection Checklist
- [ ] Pipeline phases understood and distinguished by the team
- [ ] Each optimization mapped to its target pipeline phase
- [ ] Profiling identifies which phase is the bottleneck before optimizing
- [ ] Optimization results verified in the target phase's metrics
- [ ] No confusion between OpCache (compilation) and JIT (execution) optimizations
- [ ] Team can explain what each configuration option targets

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: PHP Execution Lifecycle
- 04-standardized-knowledge.md: OpCache Purpose and Mechanics
- 04-standardized-knowledge.md: JIT Concepts and Terminology
- 07-decision-trees.md: Pipeline Phase Diagnosis Decision Tree
