# Anti-Patterns: Bytecode vs Native Code

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | Bytecode vs Native Code |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Expecting JIT to Solve All Performance Problems | Expectation Management | Critical |
| 2 | Confusing Bytecode Caching (OpCache) with JIT Compilation | Conceptual | High |
| 3 | Measuring JIT Performance with Cold Cache Benchmarks | Methodology | High |
| 4 | Enabling JIT Without CPU-bound Workload Verification | Tuning | High |
| 5 | Ignoring JIT Compilation Overhead in Short-Lived Processes | Architecture | Medium |

## Repository-Wide Anti-Patterns

- **Abstraction layer ignorance**: Confusing the different compilation layers (source → AST → opcodes → native) leads to misattributing performance gains and applying wrong optimizations.
- **Benchmark methodology gaps**: Performance comparisons between bytecode and native code are invalid without accounting for warm-up, JIT thresholds, and workload characteristics.
- **Configuration without profiling**: Enabling or disabling JIT based on general advice rather than profiling the specific workload.

---

## Anti-Pattern 1: Expecting JIT to Solve All Performance Problems

### Category
Expectation Management

### Description
Believing that enabling PHP's JIT compilation will automatically provide dramatic performance improvements for all PHP applications, without understanding that JIT primarily benefits CPU-bound workloads with tight loops and repeated execution.

### Why It Happens
- Marketing hype around JIT (PHP 8.0 release, comparisons to V8/HHVM)
- Hearing success stories from other languages (JavaScript V8, Java JVM)
- Assuming "compiled = faster" without considering workload characteristics
- Not separating the concept of OpCache (bytecode caching) from JIT (native code compilation)
- Using synthetic benchmarks that show impressive JIT gains but don't reflect real workloads

### Warning Signs
- JIT enabled without profiling the workload to confirm CPU-bound nature
- Application is database-heavy or I/O-heavy (most Laravel apps)
- Microsecond-level CPU optimizations are irrelevant when waiting 50ms for database queries
- "Enable JIT" is the first performance recommendation without diagnosing actual bottlenecks
- P95 latency does not improve after enabling JIT (because I/O dominates)

### Why Harmful
JIT is not a silver bullet:
- JIT primarily optimizes CPU-bound PHP code (tight loops, numeric computation, array manipulation)
- Most web applications are I/O-bound (database queries, HTTP calls, file system) — JIT helps little
- JIT adds compilation overhead (~0.1-0.5ms per hot function) and memory consumption (per-process buffers)
- Enabling JIT without understanding the workload wastes resources and adds complexity
- Disappointment with JIT's real-world performance leads to abandoning other useful optimizations

### Consequences
- Minimal or zero throughput improvement for I/O-bound Laravel applications
- Increased memory consumption from JIT buffers (per-process, scales with worker count)
- Added configuration complexity (opcache.jit, jit_buffer_size, jit_warmup)
- Potential performance degradation if JIT configuration is wrong (trampoline limit, buffer overflow)
- Wasted time debugging JIT configuration issues for no benefit

### Alternative
Match the optimization strategy to the workload:
- Profile first: measure CPU time vs I/O wait time
- For I/O-bound apps: optimize database queries, add caching, use Octane/Swoole
- For CPU-bound apps: enable JIT with appropriate mode (opcache.jit=1255 for max optimization)
- Verify JIT effectiveness: compare RPS and p95 latency before and after enabling
- If JIT provides <5% improvement, disable it and focus on I/O optimization

### Refactoring Strategy
1. Profile a representative request to measure CPU time vs I/O wait
2. If CPU time < 30% of total time, JIT will provide marginal gains — focus on I/O optimization
3. If CPU time > 50%, enable JIT with opcache.jit=1255 (max optimization, tracing mode)
4. Benchmark with realistic workload (with database, cache, template rendering)
5. Compare RPS and p95 latency before and after — expect 5-15% gain for CPU-heavy apps
6. If gain < 5%, disable JIT to save memory and complexity

### Detection Checklist
- [ ] Workload profiled to determine CPU vs I/O ratio
- [ ] JIT enabled only if CPU time exceeds 50% of total request time
- [ ] Before/after benchmark with realistic workload confirms JIT benefit
- [ ] Memory impact of JIT buffers measured
- [ ] JIT disabled if gain is < 5% to save resources

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Concepts and Terminology
- 05-rules.md: Profile Before Enabling JIT
- 07-decision-trees.md: Workload Benefit Assessment Decision Tree

---

## Anti-Pattern 2: Confusing Bytecode Caching (OpCache) with JIT Compilation

### Category
Conceptual

### Description
Treating OpCache (which caches compiled bytecode/opcodes) as equivalent to or interchangeable with JIT (which compiles hot opcodes to native machine code), leading to incorrect configuration and missing the distinct benefits of each.

### Why It Happens
- Both are caching/compilation mechanisms with "cache" or "compiler" in their names
- Both are configured in php.ini opcache section, blurring the conceptual boundary
- Both need to be enabled for maximum performance, but serve different purposes
- Documentation sometimes describes them together, causing confusion
- Developers new to PHP performance tuning learn both concepts simultaneously

### Warning Signs
- "We have OpCache, we don't need JIT" or vice versa
- JIT buffers sized as if they replace OpCache memory settings
- opcache.jit enabled but opcache.enable is disabled (OpCache must be on for JIT to work)
- Confusion about why enabling JIT didn't reduce first-request latency (that's OpCache's job)
- References to "compilation" without specifying which type (opcode vs native machine code)

### Why Harmful
OpCache and JIT serve different pipeline stages:
- OpCache caches opcodes (skips lexing, parsing, compilation on subsequent requests)
- JIT compiles hot opcodes to native machine code (replaces VM dispatch with direct CPU execution)
- OpCache provides 2-4x throughput gain for ALL PHP applications by eliminating re-compilation
- JIT provides 5-20% additional gain for CPU-bound workloads with repeated hot paths
- Disabling or misconfiguring either one misses their distinct (and multiplicative) benefits

### Consequences
- OpCache disabled or misconfigured because JIT was the focus (losing 2-4x throughput)
- JIT expected to provide OpCache-level gains and deemed "useless" when it doesn't
- Buffer sizing conflicts: JIT buffer taken from OpCache memory or vice versa
- Performance testing invalidated because OpCache was disabled during JIT benchmarks
- Inability to diagnose which compiler layer is causing a performance issue

### Alternative
Understand and apply both correctly:
- OpCache: ALWAYS enable in production. Compiles PHP→opcodes. Saves them in shared memory. 2-4x gain.
- JIT: Enable selectively for CPU-bound workloads. Compiles hot opcodes→native. 5-20% additional gain.
- Configure independently: OpCache memory (opcache.memory_consumption), JIT buffer (jit_buffer_size)
- OpCache must be enabled for JIT to work (JIT compiles opcodes, not source code)

### Refactoring Strategy
1. Ensure OpCache is always enabled in production (opcache.enable=1, opcache.memory_consumption=256M)
2. Evaluate JIT separately: benchmark with OpCache enabled, then add JIT
3. Configure JIT buffer independently (jit_buffer_size=128M, not drawn from OpCache memory)
4. Measure the contribution of each layer independently
5. Document the configuration for each layer with its purpose

### Detection Checklist
- [ ] OpCache enabled in all production environments
- [ ] JIT configuration distinguished from OpCache configuration
- [ ] Understanding demonstrated of which layer each optimization targets
- [ ] Benchmark methodology measures OpCache and JIT contributions independently
- [ ] OpCache memory and JIT buffer sized independently
- [ ] First-request latency improvements attributed to OpCache, not JIT

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: PHP Execution Lifecycle
- 04-standardized-knowledge.md: OpCache Purpose and Mechanics
- 04-standardized-knowledge.md: JIT Concepts and Terminology
- 05-rules.md: Configure OpCache Before JIT

---

## Anti-Pattern 3: Measuring JIT Performance with Cold Cache Benchmarks

### Category
Methodology

### Description
Benchmarking JIT performance without a proper warm-up phase that allows JIT to identify hot paths, compile them to native code, and reach steady-state — leading to results that understate JIT's benefit (cold) or overstate it (comparing cold-no-JIT vs warm-with-JIT).

### Why It Happens
- Same warm-up issues as general benchmarking, but exacerbated by JIT's multi-stage warm-up
- JIT requires not just OpCache warm (one request per file) but repeated execution to trigger compilation
- Unawareness that JIT uses counters (hotness counters) per opcode and only compiles after threshold
- Short benchmark durations (<30 seconds) that don't allow JIT to reach steady state
- Comparing cold-JIT runs against warm-OpCache-only runs (unfair comparison)

### Warning Signs
- Latency decreases continuously during the benchmark run (JIT is still warming up)
- Short benchmark durations (<60 seconds) for JIT comparison
- No warm-up period mentioned in JIT benchmark methodology
- Synthetic endpoints used that don't exercise the same code paths repeatedly
- Different trends in first-half vs second-half of benchmark results

### Why Harmful
JIT's performance profile is different from OpCache:
- OpCache reaches steady state after ~1 request per file (caches opcodes)
- JIT reaches steady state after N requests to the same code path (N determined by opcache.jit_hot_func_threshold)
- Cold JIT benchmarks measure compilation overhead, not execution benefit
- Short benchmarks miss the warm state where JIT provides its gains
- Without proper warm-up, JIT appears to hurt performance (due to compilation overhead) or provide minimal gain

### Consequences
- JIT incorrectly deemed ineffective because benchmarks didn't allow warm-up
- JIT compilation overhead counted in latency measurements (should be amortized)
- Incorrect production configuration decisions based on cold-benchmark data
- Wasted resources if JIT enabled based on cold data that shows minimal gain
- Wasted opportunity if JIT could help but cold benchmarks show no benefit

### Alternative
Design JIT benchmarks with extended warm-up:
1. Warm up OpCache: send 1 request per endpoint to load PHP files
2. Warm up JIT: send 100+ requests to the same endpoint (or until RPS stabilizes)
3. JIT warm-up is complete when RPS stops increasing and latency stabilizes (typically 30-60 seconds)
4. Run measurement phase for 60+ seconds after warm-up completes
5. Report both cold and warm results to show JIT's warm-up trajectory

### Refactoring Strategy
1. Run a 60-second warm-up phase with the target endpoint
2. Monitor RPS in real-time — JIT warm-up completes when RPS plateaus
3. Begin 60-second measurement phase after plateau is confirmed
4. Compare measurement against an OpCache-only baseline with identical warm-up
5. Report JIT benefit as the steady-state improvement over OpCache-only

### Detection Checklist
- [ ] JIT warm-up duration extended beyond OpCache warm-up (minimum 60 seconds)
- [ ] RPS and latency stable before measurement begins
- [ ] OpCache-only baseline uses identical warm-up methodology
- [ ] Benchmark duration sufficient for JIT to reach steady state
- [ ] Cold and warm results reported separately
- [ ] JIT compilation overhead excluded from steady-state measurements

### Related Rules, Skills, Trees
- 05-rules.md: Benchmark with Warm-Up
- 07-decision-trees.md: Decision: Is the workload suitable for JIT?
- 08-benchmarking-methodology: Warm-Up and Sample Size KU

---

## Anti-Pattern 4: Enabling JIT Without CPU-bound Workload Verification

### Category
Tuning

### Description
Enabling JIT compilation as a default or "just in case" optimization without profiling the workload to confirm it is CPU-bound, wasting memory and adding complexity for no performance benefit.

### Why It Happens
- "More optimization is better" mindset without measuring
- Copy-paste configuration from online guides that recommend JIT for all setups
- Default PHP configurations that enable JIT in recent PHP versions
- Assumption that because JIT works for PHP benchmarks, it works for all PHP apps
- Lack of understanding of JIT's workload requirements

### Warning Signs
- opcache.jit enabled but no profiling data exists for the application
- Application is a typical Laravel web app with database, caching, and template rendering
- No CPU profiling done before enabling JIT
- JIT buffers consuming memory but not being utilized (low jit counter values)
- No measurable performance difference before and after enabling JIT

### Why Harmful
JIT has non-trivial costs:
- Memory: 128MB+ per JIT buffer per process (with multiple workers, this multiplies)
- CPU: JIT compilation itself consumes CPU during warm-up and throughout execution
- Complexity: Additional configuration surface area (mode, threshold, buffer size, trigger)
- Code size: Compiled native code adds to process memory footprint
- Pause time: JIT compilation can cause micro-pauses during execution

### Consequences
- 128MB+ memory per worker consumed with no performance benefit
- Increased memory pressure causing OOM or swapping
- No performance improvement despite configuration effort
- False attribution: other changes happening simultaneously credited to JIT
- Wasted time tuning JIT parameters that will never help the workload

### Alternative
Verify workload characteristics before enabling JIT:
1. Profile a representative request: measure CPU time vs I/O wait time
2. If CPU time is < 30% of total, JIT will provide minimal benefit
3. If CPU time is > 50%, JIT may provide 5-15% improvement
4. Run a JIT vs no-JIT benchmark with realistic workload
5. Only keep JIT enabled if improvement > 5% and memory impact is acceptable

### Refactoring Strategy
1. Profile the application to measure CPU utilization during peak traffic
2. If CPU < 30%, disable JIT to save memory and configuration complexity
3. If CPU > 50%, enable JIT (opcache.jit=1255 for tracing mode)
4. Benchmark with realistic workload (warm both OpCache and JIT)
5. If improvement < 5%, disable JIT — the overhead outweighs the benefit

### Detection Checklist
- [ ] CPU utilization profiled during production traffic
- [ ] Web application classified as CPU-bound or I/O-bound
- [ ] JIT configuration decision documented with profiling evidence
- [ ] Memory impact of JIT buffers measured and acceptable
- [ ] Before/after benchmark with realistic workload confirms JIT benefit
- [ ] JIT disabled if workload is I/O-bound or benefit is marginal

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Workload Benefit Assessment
- 05-rules.md: Profile Before Enabling JIT
- 07-decision-trees.md: Decision: Is the workload suitable for JIT?

---

## Anti-Pattern 5: Ignoring JIT Compilation Overhead in Short-Lived Processes

### Category
Architecture

### Description
Enabling JIT for CLI scripts, short-lived workers, or processes that execute for less time than the JIT compilation threshold, resulting in the process running entirely in interpreted mode while paying the memory and initialization cost of JIT.

### Why It Happens
- Uniform configuration across all SAPI environments (php.ini applied globally)
- Not distinguishing between long-running (FPM workers, Octane) and short-lived (CLI, cron) processes
- Assuming JIT benefits any PHP execution regardless of lifetime
- Not understanding that JIT requires repeated execution of the same code to trigger compilation

### Warning Signs
- JIT enabled for CLI scripts that run once and exit
- JIT enabled for queue workers that process a single job then exit
- Short-lived processes not reaching the function hotness threshold (opcache.jit_hot_func_threshold)
- JIT counters remain near zero in short-lived process environments
- Memory consumption increased for CLI processes due to JIT buffer allocation

### Why Harmful
JIT imposes costs without benefit for short-lived processes:
- JIT buffer (64-128MB) allocated per-process even if never used for compilation
- JIT initialization time (loading profiling data, allocating counters) adds to process startup
- The process exits before any function counters reach the hotness threshold
- Every process pays the overhead; none benefit from native code execution
- In worker-per-task architectures (FPM, queue workers), every request pays JIT initialization cost

### Consequences
- Increased memory consumption for CLI and short-lived processes
- Slightly longer startup time for every short-lived process
- No native code compilation benefit (process exits before threshold)
- Wasted memory that could be used for OpCache or application data
- Confusion when "JIT is enabled" but doesn't appear to do anything

### Alternative
Configure JIT by SAPI context:
- FPM/Octane workers (long-running, repeated execution): Enable JIT with appropriate mode
- CLI/cron scripts (single execution, exit): Disable JIT, rely on OpCache only
- Queue workers (single-job or batch processing): Evaluate based on job duration and repetition
- Use per-SAPI php.ini configuration or runtime disabling in CLI scripts

### Refactoring Strategy
1. Identify all SAPI environments: FPM, CLI, queue workers, cron jobs
2. For long-running processes (FPM workers, Octane workers): keep JIT enabled if workload is CPU-bound
3. For short-lived processes (CLI, cron, single-job queue workers): disable JIT
4. Use php.ini per-SAPI sections or environment-specific configuration
5. Monitor memory savings after disabling JIT in short-lived contexts

### Detection Checklist
- [ ] JIT configuration differentiated by SAPI context
- [ ] CLI and cron scripts have JIT disabled
- [ ] Short-lived queue workers evaluated for JIT suitability
- [ ] FPM/Octane workers evaluated separately for JIT benefit
- [ ] Memory consumption compared between JIT-enabled and JIT-disabled short processes
- [ ] Process lifespan measured and compared to JIT hotness threshold

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Hot Path Threshold Tuning
- 05-rules.md: Configure JIT Per-SAPI
- 07-decision-trees.md: Process Lifetime and JIT Suitability Decision Tree
