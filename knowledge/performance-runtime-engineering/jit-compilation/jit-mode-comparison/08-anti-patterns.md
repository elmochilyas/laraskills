# Anti-Patterns: JIT Mode Comparison

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | JIT Compilation |
| Knowledge Unit | JIT Mode Comparison |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Using Maximum Optimization (1235) Everywhere | Configuration | High |
| 2 | Changing JIT Mode Frequently Without Restart Planning | Operations | Medium |
| 3 | Assuming Higher CRTO Values Are Always Better | Conceptual | High |
| 4 | Function JIT for Loop-Heavy Workloads | Configuration | Medium |
| 5 | Not Benchmarking Different Modes | Methodology | Medium |

## Repository-Wide Anti-Patterns

- **Mode mismatch penalty**: Using the wrong JIT mode for the workload leaves 10-30% performance on the table and increases JIT memory fragmentation.
- **Maximum-optimization bias**: Assuming the highest optimization level always provides the best performance, ignoring compilation overhead and memory costs.

---

## Anti-Pattern 1: Using Maximum Optimization (1235) Everywhere

### Category
Configuration

### Description
Setting opcache.jit=1235 (On mode with all optimizations) for all applications without considering the workload, compilation overhead, and memory cost — applying the most aggressive JIT mode where a simpler mode would provide equivalent or better real-world performance.

### Why It Happens
- "Higher number = more optimization = faster" assumption
- Copy-paste from performance blogs that focus on maximum synthetic benchmarks
- No understanding of the compilation overhead trade-off
- No latency sensitivity analysis (compilation pauses matter for user-facing services)
- "Set it and forget it" configuration approach

### Warning Signs
- opcache.jit=1235 without workload analysis
- Application is I/O-bound or mixed workload (1235 overhead not justified)
- Latency-sensitive user-facing application using 1235
- Buffer fragmentation is high and compaction events are frequent
- No benchmarking of 1254 vs 1235 to justify the aggressive mode
- Compilation pauses visible in p99 latency traces

### Why Harmful
1235 has costs that may outweigh benefits:
- Highest compilation overhead (50-500µs per hot function, more frequent compilation)
- More aggressive inlining increases JIT buffer pressure and fragmentation
- Compilation pauses during request handling increase latency variance
- For I/O-bound applications, the aggressive CPU optimization provides no benefit
- Memory usage is higher (more compiled code, larger buffer needed)
- The overhead of 1235 can make real-world performance WORSE than 1254 for mixed workloads

### Consequences
- Higher latency variance from compilation pauses
- Increased JIT buffer fragmentation requiring larger buffer
- More CPU time spent compiling (not executing)
- For I/O-bound apps, zero performance benefit with real overhead
- Wasted memory from inlined code that could share compilation units
- Difficulty diagnosing latency spikes caused by JIT compilation pauses

### Alternative
Match JIT mode to workload:
- 1254 (Tracing, reduced optimization): Default for most apps, lowest overhead
- 1255 (Tracing, default optimization): Slightly more aggressive tracing
- 1235 (On, all optimizations): Reserved for CPU-bound batch processing and computation
- Profile first: if JIT compilation overhead > 2% of total CPU, use a less aggressive mode
- For latency-sensitive apps, prefer 1254 to minimize compilation pauses

### Refactoring Strategy
1. Change opcache.jit from 1235 to 1254
2. Benchmark throughput and p50/p95/p99 latency
3. If 1254 performance is equivalent or better, keep it
4. If 1254 is significantly worse for CPU-bound paths, try 1255 before returning to 1235
5. Use 1235 only for specific CPU-bound batch processes (separate configuration)
6. Document: "1254 chosen after benchmarking 1254, 1255, and 1235"

### Detection Checklist
- [ ] JIT mode selected based on workload analysis, not "highest number"
- [ ] 1254 is the default; 1235 used only for CPU-bound batch workloads
- [ ] Compilation overhead measured (< 2% of total CPU)
- [ ] Latency variance reviewed for compilation pause impact
- [ ] Buffer fragmentation lower with chosen mode
- [ ] At least 1254 vs 1235 benchmarked before deciding

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Mode Comparison
- 04-standardized-knowledge.md: CRTO Bitmask Reference
- 05-rules.md: Match JIT Mode to Workload
- 07-decision-trees.md: JIT Mode Selection Decision Tree

---

## Anti-Pattern 2: Changing JIT Mode Frequently Without Restart Planning

### Category
Operations

### Description
Toggling between JIT modes repeatedly to compare performance without coordinating PHP-FPM restarts, or expecting mode changes to take effect without a restart, causing confusion about which mode is active and unnecessary restarts during business hours.

### Why It Happens
- Configuration changes made in php.ini without understanding when they take effect
- Unawareness that JIT mode is read once at PHP-FPM startup
- Expecting opcache_reset() to also reset JIT configuration (it doesn't)
- Development environment works differently (reload on every request)
- No change management process for JIT configuration

### Warning Signs
- JIT mode changed in php.ini but PHP-FPM not restarted
- Confusion about which mode is active (checking opcache_get_status())
- Mode changes during business hours causing production impact
- Multiple mode changes in a short period without clear methodology
- "We tried all the modes and none worked" — likely due to no restart or short run times
- No restart tracking for JIT configuration changes

### Why Harmful
JIT mode changes require a PHP-FPM restart:
- opcache.jit is read at PHP-FPM startup (like most opcache settings)
- Changing it in php.ini without restarting has NO EFFECT
- opcache_reset() clears opcodes but does NOT change JIT mode
- Each restart interrupts request processing (briefly, but noticeable under load)
- Production restarts should be planned and coordinated
- Testing mode changes requires either a dedicated staging environment or planned production restarts

### Consequences
- Configuration changes applied but not active (no restart)
- Incorrect conclusions about mode performance (testing the wrong mode)
- Unnecessary production restarts from unplanned changes
- Extended downtime from restart chains (change → restart → measure → change → restart)
- Team frustration: "we changed the mode but nothing happened"
- Wasted time debugging performance after configuration that wasn't applied

### Alternative
Establish a JIT tuning protocol:
1. Plan all JIT mode changes as part of a maintenance window
2. Change the mode in php.ini
3. Restart PHP-FPM (graceful reload: SIGUSR2 for FPM)
4. Verify the new mode is active via opcache_get_status()
5. Run benchmarks for the planned duration (at least 1 hour of steady-state measurement)
6. Document the mode and restart time

### Refactoring Strategy
1. Document the current JIT mode
2. Plan the mode change with a maintenance window
3. Change opcache.jit in php.ini
4. Gracefully restart PHP-FPM (not during peak traffic)
5. Verify new mode: check opcache_get_status()['jit']['enabled'] and mode bits
6. Run performance benchmarks for at least 1 hour
7. To revert, repeat the same process

### Detection Checklist
- [ ] PHP-FPM restarted after any JIT configuration change
- [ ] JIT mode verified via opcache_get_status() after restart
- [ ] Mode changes planned during maintenance windows
- [ ] Change log maintained for JIT mode changes
- [ ] No mode changes during business hours without emergency justification
- [ ] opcache_reset() not used as a substitute for restart when changing JIT mode

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Mode Comparison
- 05-rules.md: Plan JIT Mode Changes with Restart
- 07-decision-trees.md: JIT Tuning Protocol

---

## Anti-Pattern 3: Assuming Higher CRTO Values Are Always Better

### Category
Conceptual

### Description
Assuming that higher CRTO (Counter, Regenerate, Trigger, Optimization) bitmask values always produce better JIT performance, without understanding that each digit controls a different axis and higher values may increase overhead without benefit.

### Why It Happens
- CRTO bitmasks (1254, 1235, 1205) look like version numbers where higher = newer/better
- Documentation often recommends "1254" without explaining why
- No understanding of the four CRTO axes (Counter, Regenerate, Trigger, Optimization)
- "1235 > 1254" because 1235 > 1254 numerically
- Copy-paste from benchmarks that use 1235 for maximum synthetic scores

### Warning Signs
- JIT mode chosen by comparing numeric values (1235 is "max")
- Team cannot explain what each digit in the CRTO bitmask controls
- 1235 used for all environments regardless of workload
- Higher optimization levels (O=5) used without understanding inlining impact
- Buffer fragmentation high with no understanding of cause
- No mapping between CRTO digits and actual JIT behavior

### Why Harmful
CRTO values are not ordered by performance:
- Each digit controls a different axis: Counter (profile), Regenerate (SSA), Trigger (compilation delay), Optimization (aggressiveness)
- 1254: C=1 (default profile), R=2 (default SSA), T=5 (trigger on threshold), O=4 (tracing, reduced opt)
- 1235: C=1, R=2, T=3 (trigger type), O=5 (all optimizations)
- The "4" in 1254 is NOT less than the "5" in 1235 — they control different things
- Optimization level O=5 (inlining) has memory costs that may not justify the gain
- Trigger type T=3 vs T=5 changes compilation timing, not quality

### Consequences
- JIT mode chosen on incorrect understanding of CRTO values
- Aggressive optimization (O=5) used when tracing (O=4) is sufficient
- Higher memory and CPU overhead from unnecessary inlining
- Difficulty explaining to other team members why a particular mode was chosen
- Incorrect performance optimization decisions based on misunderstanding
- Wasted time tuning the wrong CRTO axis

### Alternative
Understand what each CRTO digit controls:
- C (Counter): Profiling granularity (1 = default, 2 = more detailed)
- R (Regenerate): SSA form regeneration (2 = default)
- T (Trigger): When compilation starts (3 = trigger on type, 5 = trigger on threshold)
- O (Optimization): Compilation aggressiveness (4 = tracing, 5 = all including inlining)
Use the mode names (Tracing, Function, On) rather than raw bitmasks in documentation.
Select based on workload, not numeric value.

### Refactoring Strategy
1. Document what each CRTO digit means for the chosen mode
2. Use mode names (1254 = Tracing, 1205 = Function, 1235 = On) in configuration comments
3. Select mode based on workload profile, not bitmask value
4. Prefer 1254 unless benchmarking proves another mode is significantly better
5. If using O=5 (aggressive inlining), benchmark against O=4 first to justify the memory cost

### Detection Checklist
- [ ] Team can explain the four CRTO axes
- [ ] JIT mode chosen based on workload, not numeric comparison
- [ ] Mode documented with mode name (Tracing/Function/On), not just bitmask
- [ ] O=5 (inlining) justified by benchmarking against O=4
- [ ] No assumption that higher bitmask = better performance
- [ ] Configuration comments remind readers of the CRTO meanings

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: CRTO Bitmask Reference
- 04-standardized-knowledge.md: JIT Mode Comparison
- 05-rules.md: Understand CRTO Before Changing Mode

---

## Anti-Pattern 4: Function JIT for Loop-Heavy Workloads

### Category
Configuration

### Description
Using Function JIT (1205) for applications dominated by loops (templating engines, data processing, array iteration), where Tracing JIT (1254) would provide better optimization and lower memory fragmentation.

### Why It Happens
- No profiling of execution pattern (loop vs function call dominance)
- Defaulting to Function JIT because "it compiles entire functions" sounds more comprehensive
- Copying configuration from another project that happens to be function-call-heavy
- Unawareness that Tracing JIT is better for loop-heavy code
- Not benchmarking different modes to see which is better

### Warning Signs
- Application uses Blade/Twig templating (loop-heavy rendering)
- Data processing pipelines with array iteration
- opcache.jit=1205 for a template-heavy web application
- High JIT buffer fragmentation (Function JIT fragments more)
- Compilation count is high for traces but low for functions
- Benchmarking shows 1205 is slower than 1254 for the workload

### Why Harmful
Function JIT is suboptimal for loop-heavy workloads:
- Function JIT compiles entire functions, including code outside hot loops
- Tracing JIT identifies hot loop traces and optimizes only the repeated path
- For templating engines, the hot path is the loop iteration, not the function call
- Function JIT produces more compiled code (entire functions) → more fragmentation
- Tracing JIT produces tighter, more focused compiled code for loop bodies
- 10-30% performance difference between modes for loop-heavy workloads

### Consequences
- 10-30% lower throughput than Tracing JIT for template/loop-heavy work
- Higher JIT buffer fragmentation (40-50% more than Tracing JIT)
- More compilation overhead (compiling entire functions instead of traces)
- Larger JIT buffer needed to accommodate fragmentation
- Potential for eviction and recompilation cycles (buffer pressure from fragmentation)

### Alternative
Match JIT mode to execution pattern:
- If profiling shows loop execution dominates: Tracing JIT (1254)
- If profiling shows function/method calls dominate: Function JIT (1205)
- For mixed workloads: Tracing JIT (1254) is the safe default
- Profile with opcache_get_status() to see compilation counters
- Benchmark both modes before committing to one

### Refactoring Strategy
1. Profile the application: measure loop iteration count vs function call count
2. If loops dominate: switch to Tracing JIT (1254)
3. Benchmark throughput before and after the mode change
4. Monitor JIT buffer fragmentation (compaction events)
5. If improvement is > 5%, keep Tracing JIT
6. Document: "Loop-heavy workload → Tracing JIT (1254)"

### Detection Checklist
- [ ] Execution pattern profiled (loop vs function call dominance)
- [ ] Templating/loop-heavy apps use Tracing JIT (1254)
- [ ] ORM/function-call-heavy apps use Function JIT (1205)
- [ ] Buffer fragmentation monitored for the chosen mode
- [ ] At least two modes benchmarked before finalizing
- [ ] Tracing JIT is default for mixed/uncertain workloads

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Mode Comparison
- 04-standardized-knowledge.md: JIT Memory Layout and Fragmentation
- 05-rules.md: Match Mode to Execution Pattern
- 07-decision-trees.md: JIT Mode Selection Decision Tree

---

## Anti-Pattern 5: Not Benchmarking Different JIT Modes

### Category
Methodology

### Description
Setting a JIT mode (usually 1254 or 1235 based on a single recommendation) without benchmarking alternative modes to determine which provides the best performance for the specific application workload.

### Why It Happens
- "Default recommendation is good enough" approach
- Time pressure: benchmarking modes takes hours
- No established benchmarking methodology for JIT tuning
- Unawareness that mode performance varies significantly by workload
- Assuming all modes provide similar performance for the application
- Copy-paste from a trusted source (blog, documentation) without verification

### Warning Signs
- JIT mode set to a single value without documenting why
- No record of benchmarking different modes
- Team cannot answer "why did we choose this JIT mode?"
- Performance complaints that might be addressed by a different mode
- JIT mode unchanged since initial PHP 8.0 deployment
- No automated benchmark that compares JIT modes in CI

### Why Harmful
JIT mode performance is highly workload-dependent:
- The same application can see 10-30% throughput differences between modes
- The best mode depends on execution patterns (loops vs function calls), not application size
- Without benchmarking, you don't know if you're leaving performance on the table
- The default recommendation (1254) is right for most but not all applications
- Teams that don't benchmark may conclude "JIT doesn't work" when they chose the wrong mode
- Documentation provides guidance, not answers for your specific workload

### Consequences
- 10-30% potential throughput left on the table
- Team never knows if they chose the optimal mode
- If performance issues arise, mode is never re-evaluated
- Configuration drift: different servers may end up with different modes
- No data to justify mode choices in code review or architecture discussions
- Wasted optimization opportunity for zero ongoing effort

### Alternative
Establish a JIT benchmarking protocol:
1. Set up a reproducible benchmark for the application's primary use case
2. Benchmark with JIT disabled (OpCache only) as baseline
3. Benchmark with Tracing JIT (1254)
4. Benchmark with Tracing + default optimizations (1255)
5. Benchmark with Function JIT (1205)
6. Benchmark with On mode (1235) if workload is CPU-bound
7. Select the mode with the best throughput/latency balance
8. Re-benchmark when the application's execution profile changes significantly

### Refactoring Strategy
1. Create or select a benchmark that represents the application's primary workload
2. Run the benchmark with JIT disabled (baseline)
3. Run with 1254 (Tracing), record results
4. Run with 1205 (Function), record results
5. Run with 1235 (On) if CPU-bound, record results
6. Select the mode with the best combination of throughput and latency stability
7. Document the benchmark results and selection rationale

### Detection Checklist
- [ ] At least two JIT modes benchmarked before finalizing
- [ ] Benchmark represents the primary application workload
- [ ] Results documented with throughput and latency data
- [ ] Rationale for chosen mode documented
- [ ] Re-benchmark scheduled when workload profile changes significantly
- [ ] Team can explain why the current mode was chosen

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Mode Comparison
- 05-rules.md: Benchmark Multiple JIT Modes
- 06-skills.md: JIT Benchmarking Protocol
- 07-decision-trees.md: JIT Mode Selection Decision Tree
