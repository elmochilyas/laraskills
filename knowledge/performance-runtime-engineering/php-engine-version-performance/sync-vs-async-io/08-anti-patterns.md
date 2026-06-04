# Anti-Patterns: Synchronous vs Asynchronous I/O

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | Synchronous vs Asynchronous I/O |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Applying Async Everywhere Without I/O Profile Analysis | Strategy | Critical |
| 2 | Blocking the Event Loop in Async Contexts | Implementation | Critical |
| 3 | Using Async for CPU-Bound Workloads | Architecture | High |
| 4 | Expecting Async Gains with Sub-Millisecond I/O | Expectation Management | High |
| 5 | Ignoring io_uring Kernel Compatibility | Operations | Medium |

## Repository-Wide Anti-Patterns

- **I/O profile ignorance**: Choosing sync or async I/O models without profiling the I/O wait time per operation, leading to a model mismatch that wastes resources or adds complexity for no benefit.
- **Auto-hooking over-reliance**: Assuming that Swoole's auto-hooking covers all I/O operations, missing blocking calls from third-party libraries or non-standard stream wrappers that defeat the async advantage.

---

## Anti-Pattern 1: Applying Async Everywhere Without I/O Profile Analysis

### Category
Strategy

### Description
Adopting async I/O (Swoole, amphp, ReactPHP) for all workloads without first measuring I/O wait time per operation, applying the most complex concurrency model where it provides no benefit or makes performance worse.

### Why It Happens
- "Async is faster" is treated as a universal truth, not workload-dependent
- Success stories from high-concurrency systems (Node.js, Go) create "async envy"
- No profiling infrastructure to measure I/O vs CPU time
- Architectural decisions made in planning, not based on data
- Unawareness that async adds overhead (event loop, coroutine switching, auto-hooking)
- "Future-proofing" for traffic that may never materialize

### Warning Signs
- Async runtime adopted without profiling I/O wait time
- Application is database-heavy with sub-millisecond query times
- No measurement of sync vs async throughput under realistic workload
- Team is new to async programming and unfamiliar with its pitfalls
- Async added "because it's modern" rather than for a measured bottleneck
- Production incidents from async-specific bugs (blocking, race conditions)

### Why Harmful
Async is not always faster:
- Async overhead (event loop, coroutine scheduling, auto-hooking) adds 5-15% CPU
- For sub-millisecond I/O (local Redis, fast database on same host), sync is faster
- Async complexity (state management, blocking prevention, error handling) is significant
- Team expertise must match the complexity — async bugs are harder to diagnose
- The benefit is proportional to I/O wait time: 50ms+ operations benefit; 0.5ms operations don't

### Consequences
- Worse performance than FPM for low-latency I/O workloads (async overhead > benefit)
- Significant engineering investment for zero or negative performance gain
- Team struggling with async debugging and state management
- Production incidents from blocking calls, race conditions, or memory leaks
- Eventual migration back to FPM when async benefits don't materialize
- Wasted opportunity to optimize the actual bottleneck (database queries)

### Alternative
Match I/O model to workload:
1. Profile: measure I/O wait time for database, cache, and external service calls
2. If average I/O wait > 10ms per operation and concurrency is high: async may help (2-5x)
3. If average I/O wait < 1ms: async overhead exceeds benefit — stay with FPM
4. If I/O wait is 1-10ms: evaluate case by case, measure before committing
5. For mixed workloads: segment — use async for high-latency I/O paths, sync for the rest

### Refactoring Strategy
1. Profile 3-5 representative request paths and measure I/O wait time per operation
2. Calculate weighted average I/O wait across all operations
3. If > 10ms average I/O wait: prototype async with one endpoint
4. Benchmark: async vs FPM throughput and latency for that endpoint
5. If async shows < 25% improvement over optimized FPM, don't proceed
6. If async shows significant improvement (> 50%), plan phased migration

### Detection Checklist
- [ ] I/O wait time measured per operation type
- [ ] Sync vs async benchmark performed before deciding
- [ ] Async adoption justified by data, not general advice
- [ ] Team has async expertise or is prepared to build it
- [ ] Fallback plan exists if async doesn't deliver expected gains
- [ ] I/O profile measured periodically as workload changes

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Sync vs Async I/O
- 05-rules.md: Profile I/O Before Choosing Async
- 07-decision-trees.md: I/O Model Selection Decision Tree

---

## Anti-Pattern 2: Blocking the Event Loop in Async Contexts

### Category
Implementation

### Description
Calling synchronous blocking operations (sleep(), PDO queries without async hooks, file_get_contents, curl_exec) inside coroutines or the async event loop, blocking all coroutines sharing that event loop and defeating the async concurrency advantage.

### Why It Happens
- Existing PHP code uses blocking I/O functions by default
- Developers assume Swoole/amphp auto-hooks all I/O operations (it doesn't)
- sleep() is a common pattern for rate limiting or delays
- Third-party libraries called inside coroutines may use blocking I/O internally
- No static analysis or runtime detection of blocking calls
- Team is new to async and not aware of what hooks are available

### Warning Signs
- Throughput does not improve after async migration (or gets worse)
- One slow request blocks all other requests sharing the same worker
- P95 latency equals the sum of all blocking operations in a single request
- Event loop monitoring shows high "tick duration" or "blocked time"
- sleep() or usleep() used in coroutine context
- PDO used (not Swoole\Coroutine\MySQL) in Swoole context
- file_get_contents(), curl_exec(), or stream operations without async wrappers

### Why Harmful
Blocking the event loop destroys the async advantage:
- In coroutine runtimes, a blocking call suspends the ENTIRE event loop, not just the coroutine
- All other coroutines in that process/event loop are blocked until the operation completes
- Throughput drops to the same as synchronous FPM (or worse, due to async overhead)
- The system loses all benefit of non-blocking I/O and coroutine scheduling
- Latency becomes unpredictable — a user request may be blocked by another user's database query
- Debugging blocking calls is difficult — they appear as mysterious latency spikes

### Consequences
- Async runtime throughput no better than (or worse than) FPM
- Cascading latency: one blocked request delays all coroutines in the event loop
- High p95 and p99 latency from occasional blocking operations
- Team confidence in async runtime erodes when expected gains don't materialize
- Difficult debugging: blocking calls are hard to identify in profiling
- Emergency migration back to FPM when async performance is worse

### Alternative
Ensure all I/O in coroutine context is non-blocking:
- Use async hooks: Swoole\Coroutine\MySQL, Swoole\Coroutine\Redis, Swoole\Coroutine\Http\Client
- Replace sleep() with Swoole\Coroutine::sleep() or amphp's delay()
- For CPU-heavy operations: offload to task workers or process pools
- Audit third-party libraries for blocking I/O before using in coroutines
- Enable Swoole's blocking call detection (SWOOLE_HOOK_ALL except flags that cause issues)
- Use Swoole's defer() and onException for coroutine lifecycle management

### Refactoring Strategy
1. Audit all I/O operations in coroutine context
2. Replace PDO with Swoole\Coroutine\MySQL or Swoole's database pool
3. Replace Redis with Swoole\Coroutine\Redis
4. Replace curl with Swoole\Coroutine\Http\Client
5. Replace sleep() with Swoole\Coroutine::sleep()
6. Add runtime detection: Swoole\Coroutine::exists() to detect coroutine context
7. Test with concurrent requests and monitor event loop health

### Detection Checklist
- [ ] All database operations use async-hooked drivers in coroutine context
- [ ] sleep() replaced with coroutine-safe alternative
- [ ] Third-party libraries audited for blocking I/O
- [ ] CPU-heavy operations delegated to task workers
- [ ] Swoole blocking call detection enabled and tested
- [ ] Event loop monitoring shows no blocking operations
- [ ] Concurrent throughput confirms async benefit over FPM

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Sync vs Async I/O
- 05-rules.md: Never Block the Event Loop
- 07-decision-trees.md: Blocking Detection Decision Tree
- S06-alternative-runtimes: Swoole Architecture KU

---

## Anti-Pattern 3: Using Async for CPU-Bound Workloads

### Category
Architecture

### Description
Adopting async I/O (Swoole, amphp, ReactPHP) for CPU-bound workloads where the bottleneck is computation, not I/O wait — async provides no benefit for CPU-bound tasks and introduces unnecessary complexity.

### Why It Happens
- Misunderstanding what async optimizes: I/O wait, not CPU time
- One-size-fits-all approach to architecture
- Excitement about async without understanding its domain
- CPU-bound workload assumed to be I/O-bound due to poor profiling
- "Async is modern" — adopting for cultural rather than technical reasons
- Confusing asynchronous execution with parallelism

### Warning Signs
- CPU utilization is at 100% under load (no I/O wait to optimize)
- Application performs image processing, PDF generation, data transformation
- Profiling shows < 10% I/O wait time
- Async runtime shows no throughput improvement over FPM
- Event loop is always busy (CPU-bound coroutines don't yield)
- All coroutine slots are occupied by CPU-heavy operations, blocking I/O coroutines

### Why Harmful
Async does not help CPU-bound workloads:
- Async I/O optimizes I/O wait time by allowing other coroutines to run during I/O
- CPU-bound operations don't wait for I/O — they continuously consume CPU
- No I/O wait means no opportunity for coroutine switching
- The async overhead (event loop, coroutine scheduling) is pure waste for CPU-bound tasks
- CPU-bound coroutines block the event loop just like any other long-running operation
- Parallelism (multiple workers/processes) is needed for CPU-bound work, not async I/O

### Consequences
- Async overhead paid with no throughput improvement
- CPU-bound coroutines blocking event loop, degrading I/O performance
- Team invested in complex async infrastructure for no benefit
- Wasted opportunity: the CPU-bound workload needs parallel processing, not async I/O
- Worse performance than FPM (async overhead > benefit for CPU-bound)
- Misdiagnosis of performance issues (still CPU-bound, just with more overhead)

### Alternative
For CPU-bound workloads:
- Use parallelism, not async: multiple FPM workers, process pools, or Swoole task workers
- Consider Swoole's process pool (Swoole\Process\Pool) for CPU-bound parallel tasks
- Evaluate horizontal scaling (more servers) for CPU-bound web workloads
- For long-running CPU tasks: use queue workers (separate from web serving)
- Async I/O is the wrong tool for CPU-bound work — don't use it

### Refactoring Strategy
1. Profile CPU vs I/O time to confirm CPU-bound classification
2. If CPU-bound: disable async, return to FPM or use process-pool parallelism
3. For parallel CPU processing: use Swoole task workers or PHP-FPM with more workers
4. For long CPU tasks: move to queue workers (separate process, no async)
5. Benchmark: measure throughput improvement from parallelism, not async
6. Document: "Workload is CPU-bound. Async is not applicable."

### Detection Checklist
- [ ] CPU vs I/O time profiled to classify workload
- [ ] Async only used for I/O-bound workloads (CPU < 50%)
- [ ] CPU-bound workloads use parallelism (process pools), not async
- [ ] Long CPU tasks delegated to queue workers
- [ ] Async overhead measured and found acceptable only for I/O-bound workloads
- [ ] Architecture decision documented with workload classification

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Sync vs Async I/O
- 05-rules.md: Match I/O Model to Workload Type
- 07-decision-trees.md: CPU-bound vs I/O-bound Decision Tree

---

## Anti-Pattern 4: Expecting Async Gains with Sub-Millisecond I/O

### Category
Expectation Management

### Description
Adopting async I/O when the application has sub-millisecond database query times (local database, cached queries, simple lookups), where the async overhead (event loop, coroutine scheduling, auto-hooking instrumentation) exceeds the I/O wait time being optimized.

### Why It Happens
- General advice "async improves throughput" applied without workload-specific analysis
- Development environment has artificially high I/O latency (remote database) masking local DB speed
- No profiling to measure actual I/O wait time in production
- Unawareness that async has fixed overhead per coroutine/operation
- Success stories from apps with 50ms+ I/O applied to apps with <1ms I/O

### Warning Signs
- Average database query time is < 1ms in production
- Database is on the same host or local network with very low latency
- Cached queries (Redis, APCu) dominate the I/O profile
- Benchmarking shows async runtime is slower than FPM
- Profiling shows async overhead (coroutine creation, event loop tick) > I/O wait time
- Concurrency per worker is low because I/O operations complete instantly

### Why Harmful
Async overhead can exceed benefit for fast I/O:
- Coroutine creation: ~100-500ns per coroutine
- Event loop tick: ~50-200ns per iteration
- Auto-hooking instrumentation: adds overhead to every I/O call
- Context switching between coroutines: ~10-100ns per switch
- For sub-millisecond I/O, the overhead of async operations can equal or exceed the I/O time
- The throughput gain from overlapping I/O is minimal when I/O is already near-instant
- FPM's simple blocking model has zero async overhead

### Consequences
- Async runtime 5-15% slower than FPM for sub-millisecond I/O workloads
- Increased latency from async overhead
- Higher CPU usage (event loop, coroutine management)
- Complex async infrastructure for worse performance
- Team misdiagnosing the issue as configuration and wasting time tuning
- Eventual migration back to FPM when async cannot match its performance

### Alternative
For sub-millisecond I/O workloads:
- Stay with FPM: it's simpler and faster for fast I/O
- If throughput is limited by FPM worker count, address the root cause (cache queries, optimize DB)
- Consider Octane (not async I/O) for bootstrap elimination if that's the real bottleneck
- Only use async when I/O wait time > 10ms per operation AND concurrency is high
- Measure I/O wait time in PRODUCTION before deciding on async

### Refactoring Strategy
1. Measure production I/O wait time: database, cache, external service calls
2. If average I/O wait < 1ms: async is not the right solution
3. Focus on the actual bottleneck: is it bootstrap (Octane), query optimization (indexing), or caching?
4. If FPM worker count is the limit with fast I/O, optimize workers per server (more workers, less memory per worker)
5. If still insufficient, evaluate Octane for bootstrap elimination, not async for I/O overlap
6. Re-evaluate async only if I/O wait time increases (new services, remote databases)

### Detection Checklist
- [ ] Production I/O wait time measured per operation type
- [ ] Average I/O wait time documented (should be > 10ms for async to be beneficial)
- [ ] FPM vs async benchmark performed with production I/O profile
- [ ] If I/O wait < 1ms: async dismissed, FPM or Octane preferred
- [ ] Async decision based on production I/O data, not development environment
- [ ] I/O profile reviewed periodically as architecture changes

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Sync vs Async I/O
- 05-rules.md: Measure Production I/O Before Async Decision
- 07-decision-trees.md: I/O Model Selection Decision Tree

---

## Anti-Pattern 5: Ignoring io_uring Kernel Compatibility

### Category
Operations

### Description
Enabling io_uring (Swoole 6.2+, Linux kernel async I/O interface) without verifying kernel version compatibility (requires Linux 5.19+), causing runtime errors, degraded performance, or silent fallback to older syscall mechanisms.

### Why It Happens
- Excitement about io_uring's performance benefits
- Assumption that "Linux" means all kernel versions support the feature
- Development environment on a modern kernel (6.x), production on an older one (5.10)
- Container environments with different kernel versions than the host
- Disabling compatibility checks in Swoole configuration
- Unawareness of io_uring's kernel version requirements

### Warning Signs
- Swoole configured with io_uring enabled but kernel < 5.19
- Runtime errors: "io_uring_setup() failed: Function not implemented"
- Swoole silently falling back to epoll (performance not as expected)
- Production performance doesn't match development benchmarks
- Application crashes on older kernels with io_uring enabled
- Docker containers on hosts with kernel < 5.19 show io_uring errors
- CI/CD pipeline doesn't check kernel version compatibility

### Why Harmful
io_uring on incompatible kernels causes problems:
- Function not implemented: Swoole cannot initialize io_uring — falls back to epoll (or crashes)
- Silent fallback means expected performance gains (io_uring reduces syscall overhead) are not realized
- If configuration forces io_uring (no fallback), Swoole fails to start
- Debugging io_uring issues takes time because the error message may be unclear
- Development and production environments behave differently
- io_uring's batch submission/completion model is incompatible with older kernel I/O subsystems

### Consequences
- Swoole fails to start on production due to io_uring configuration
- Emergency rollback to epoll configuration
- Performance degradation: expecting io_uring but running on epoll
- Development-to-production performance discrepancies
- Waste of time debugging kernel compatibility issues
- Kernel upgrade required, which may have its own compatibility implications

### Alternative
Always verify kernel compatibility before enabling io_uring:
1. Check kernel version: `uname -r` (must be >= 5.19)
2. Verify io_uring support: check /sys/kernel/mm/transparent_hugepage/enabled (related feature)
3. Test io_uring in the target production environment before deployment
4. Configure Swoole with graceful fallback: prefer io_uring but allow epoll
5. Check Docker container host kernel (NOT container kernel, which shares host kernel)
6. Document kernel requirements in deployment checklist
7. Monitor actual I/O syscall mechanism used (io_uring vs epoll) in production

### Refactoring Strategy
1. Check kernel version on all production servers and container hosts
2. If kernel < 5.19: plan kernel upgrade or disable io_uring and use epoll
3. If kernel >= 5.19: test io_uring in staging with production workload
4. Configure Swoole to prefer io_uring but fall back to epoll
5. Monitor which I/O engine Swoole is using in production
6. After confirming io_uring works, benchmark the performance improvement
7. Document kernel requirements in runbook and deployment checklist

### Detection Checklist
- [ ] Kernel version verified on all production servers (>= 5.19 for io_uring)
- [ ] Docker container host kernel checked (containers share host kernel)
- [ ] Swoole configured with io_uring fallback (does not hard-require io_uring)
- [ ] Production monitoring confirms which I/O engine is active
- [ ] Development and production kernel versions are consistent
- [ ] Deployment checklist includes kernel version verification
- [ ] Performance benchmarks confirm io_uring benefit over epoll for the workload

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Sync vs Async I/O
- 04-standardized-knowledge.md: Swoole io_uring Integration
- 05-rules.md: Verify Kernel Compatibility Before Enabling io_uring
- 07-decision-trees.md: I/O Engine Selection Decision Tree
