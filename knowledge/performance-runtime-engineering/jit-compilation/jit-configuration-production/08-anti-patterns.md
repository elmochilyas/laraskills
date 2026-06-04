# Anti-Patterns: JIT Configuration for Production

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | JIT Compilation |
| Knowledge Unit | JIT Configuration for Production |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Tuning JIT Before OpCache is Properly Configured | Configuration | Critical |
| 2 | Setting jit_buffer_size Excessively Large | Configuration | Medium |
| 3 | No JIT Blacklist Usage for Guard-Failure-Prone Functions | Configuration | High |
| 4 | JIT Disabled on Queue Workers While Enabled on Web Workers | Configuration | High |
| 5 | No Pre-Warming JIT in Long-Running Processes | Operations | Medium |

Repository-wide: OpCache-first neglect, per-SAPI inconsistency, lack of JIT pre-warming in persistent workers.

---

## Anti-Pattern 1: Tuning JIT Before OpCache is Properly Configured

### Category
Configuration

### Description
Starting advanced JIT configuration (mode, buffer size, thresholds) before ensuring OpCache is correctly configured with adequate memory, file count, and >99% hit rate. JIT compiles opcodes from OpCache shared memory — without proper OpCache, JIT has nothing optimal to compile.

### Why It Happens
- JIT is newer and more interesting than OpCache tuning
- Configuration guides often include JIT settings without checking OpCache first
- OpCache is enabled by default, creating a false sense of correct configuration
- No monitoring of OpCache hit rate or cache utilization

### Warning Signs
- JIT buffer sized at 256MB but OpCache memory_consumption is default 64MB
- opcache_get_status() shows cache full or low hit rate
- Compilation time visible in profiling (OpCache not caching effectively)
- Team can describe JIT settings but not OpCache hit rate

### Why Harmful
OpCache provides 2-4x throughput gain with proper configuration. JIT adds 0-95% on top of OpCache. If OpCache is undersized, files are evicted and recompiled, wasting CPU. JIT compiles from OpCache's opcodes — if OpCache is thrashing, JIT compiles incomplete or evicted code. Fixing OpCache first provides the majority of the performance gain with less effort.

### Consequences
- OpCache hit rate below 99% means compilation overhead on some requests
- JIT benefit limited by OpCache thrashing
- Performance left on the table from both OpCache AND JIT
- Effort misallocated to advanced tuning when basic configuration is missing
- False conclusion that JIT doesn't work

### Alternative
Configure in order: OpCache first, then JIT. Verify OpCache is enabled (opcache.enable=1), set memory_consumption and max_accelerated_files appropriately, check hit rate > 99% via opcache_get_status(). Only after OpCache is verified, enable JIT with 1254 and 128MB buffer.

### Refactoring Strategy
1. Check OpCache status: enabled, memory, file count, hit rate
2. Fix OpCache: increase memory_consumption, set max_accelerated_files, configure preloading
3. Verify OpCache hit rate > 99% over 24 hours
4. Enable JIT with opcache.jit=1254 and jit_buffer_size=128M
5. Benchmark the combined gain over OpCache-only baseline

### Detection Checklist
- [ ] OpCache properly configured before JIT tuning
- [ ] OpCache hit rate > 99% (cache misses < 1%)
- [ ] JIT buffer sized considering total OpCache + JIT memory budget
- [ ] Profiling shows zero compilation time (OpCache working)
- [ ] JIT benefit assessed on top of working OpCache

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Configuration for Production
- 05-rules.md: Progressively enable OpCache then JIT
- 07-decision-trees.md: Optimization Priority Decision Tree

---
## Anti-Pattern 2: Setting jit_buffer_size Excessively Large
### Category
Configuration
### Description
Allocating 1GB+ JIT buffers for small applications where 128MB would suffice, wasting virtual address space without performance benefit.
### Why It Happens
- Assuming bigger buffer always equals better performance
- Not monitoring actual buffer utilization
- Confusing virtual memory with physical memory commitment
### Warning Signs
- jit_buffer_size > 512MB for an application with < 500K LOC
- buffer_free > 80% at steady state
- No buffer utilization monitoring configured
### Why Harmful
JIT buffer is pre-allocated virtual memory. While physical memory is allocated on demand, large reservations waste virtual address space (especially in 32-bit environments or containers with address space limits). The buffer size does not affect JIT compilation quality — it only affects capacity for compiled code.
### Consequences
- Wasted virtual address space
- Potential issues in memory-constrained containers
- No performance benefit from oversized buffer
### Alternative
Start with 128MB. Monitor buffer_free via opcache_get_status(). Increase only if buffer_free drops below 20% at steady state.
### Refactoring Strategy
1. Set jit_buffer_size=128M
2. Run for 24-48 hours with production traffic
3. Check buffer_free percentage
4. Increase only if buffer_free < 20%
### Detection Checklist
- [ ] Buffer utilization monitored before resizing
- [ ] buffer_free > 20% at steady state
- [ ] Buffer size justified by actual utilization data
---
## Anti-Pattern 3: No JIT Blacklist Usage for Guard-Failure-Prone Functions
### Category
Configuration
### Description
Not using opcache_jit_blacklist() (PHP 8.5+) to exclude functions that cause frequent guard failures, produce excessive compiled code, or trigger compilation issues — wasting buffer space and compilation time.
### Why It Happens
- Unawareness of the blacklist feature (PHP 8.5+)
- No monitoring of guard failure rates or compilation issues
- Not correlating JIT buffer pressure with specific functions
### Warning Signs
- High guard failure rate in opcache_get_status()
- Frequent buffer evictions for specific code paths
- Functions that produce large compiled code segments disproportionately
### Why Harmful
Functions with frequent guard failures cause JIT to bail out to the interpreter, wasting compilation effort. Functions that produce large compiled code fill the JIT buffer quickly, causing eviction of other hot code. The blacklist allows excluding these problematic functions to preserve JIT buffer for code that actually benefits.
### Consequences
- JIT buffer wasted on functions that don't benefit
- Eviction of hot code due to buffer pressure from bad candidates
- Compilation CPU wasted on guard-failure-prone functions
### Alternative
Monitor guard failure counts. Identify functions with high failure-to-compilation ratios. Use opcache_jit_blacklist() to exclude them (PHP 8.5+).
### Refactoring Strategy
1. Monitor opcache_get_status() for guard failure counts
2. Identify functions with highest failure rates
3. Add them to JIT blacklist
4. Monitor buffer utilization improvement
### Detection Checklist
- [ ] Guard failure rate monitored
- [ ] Blacklist used for guard-failure-prone functions (PHP 8.5+)
- [ ] Buffer utilization improvement confirmed after blacklisting
---
## Anti-Pattern 4: JIT Disabled on Queue Workers While Enabled on Web Workers
### Category
Configuration
### Description
Enabling JIT for web workers but disabling it for queue workers, cron jobs, and batch processing — missing the 61-95% throughput improvement that JIT provides for CPU-bound background tasks.
### Why It Happens
- JIT benefit measured only on web endpoints (which are I/O-bound)
- Separate PHP configurations per SAPI not reviewed holistically
- Queue workers configured with different php.ini that has JIT disabled
### Warning Signs
- Queue workers use php.ini with opcache.jit=0
- Web workers and queue workers have different JIT settings
- Batch jobs take longer than expected given server specs
### Why Harmful
Queue workers process batches of data, iterating over collections, transforming data, and executing business logic — these are CPU-bound operations where JIT provides 61-95% throughput improvement. Disabling JIT on queue workers means they run at half speed for no benefit.
### Consequences
- Queue workers processing at 50-60% of potential throughput
- More queue workers needed (higher infrastructure costs)
- Batch jobs taking twice as long
### Alternative
Use a single php.ini for all SAPI environments. If separate configurations are needed, ensure JIT is enabled in all of them.
### Refactoring Strategy
1. Audit JIT configuration across all SAPI environments
2. Enable JIT (1254, 128MB) in queue worker php.ini
3. Benchmark queue worker throughput before and after
4. Document the improvement achieved
### Detection Checklist
- [ ] JIT enabled in all SAPI configurations (FPM, CLI, queue)
- [ ] Queue workers benchmarked with and without JIT
- [ ] Configuration consistency enforced across environments
---
## Anti-Pattern 5: No Pre-Warming JIT in Long-Running Processes
### Category
Operations
### Description
Not executing representative requests at worker startup in Octane/Swoole/FrankenPHP to trigger JIT compilation, causing the first 100-500 requests per worker to run in the interpreter without JIT optimization.
### Why It Happens
- Assuming JIT compiles on first execution (it doesn't — it needs threshold)
- No warm-up implementation in deployment pipeline
- Not aware of the JIT warm-up requirement for persistent workers
### Warning Signs
- Latency decreases noticeably over the first 100+ requests after worker start
- JIT compilation counts increase during the first minutes of worker lifetime
- No warm-up script runs after worker deployment
### Why Harmful
JIT compilation triggers only after hot-path thresholds are crossed (default: 100 function calls, 64 loop iterations). Without pre-warming, the first 100-500 requests on each worker execute entirely in the Zend interpreter, missing JIT's 20-95% speedup for CPU-bound paths.
### Consequences
- First 100-500 requests on each worker are unoptimized
- Higher latency variance after worker restarts
- Deployment events cause performance degradation during warm-up
### Alternative
Implement JIT pre-warming: after worker start, execute 50-100 representative requests (health check, common API endpoints) to trigger JIT compilation before accepting production traffic.
### Refactoring Strategy
1. Identify 5-10 representative endpoints that cover hot code paths
2. Create a warm-up script that hits each endpoint 10-20 times
3. Execute the warm-up script after worker start but before accepting traffic
4. Verify JIT compilation counts increase after warm-up
### Detection Checklist
- [ ] JIT pre-warming implemented for long-running workers
- [ ] Warm-up requests cover hot code paths
- [ ] JIT compilation state verified after warm-up
- [ ] Cold-start latency measured and improved
