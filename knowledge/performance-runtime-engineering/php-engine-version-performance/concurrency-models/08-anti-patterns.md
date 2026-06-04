# Anti-Patterns: Concurrency Models

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | Concurrency Models |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Treating All Concurrency Models as Equivalent | Conceptual | Critical |
| 2 | Using Process-Based Concurrency for I/O-Bound Workloads | Architecture | High |
| 3 | Ignoring Shared State Mutability in Coroutine Models | State Management | Critical |
| 4 | Assuming More Workers Always Increases Throughput | Capacity | High |
| 5 | Blocking the Event Loop in Async Runtimes | Implementation | Critical |

## Repository-Wide Anti-Patterns

- **Model mismatch**: Using the wrong concurrency model for the workload type (process, thread, coroutine, event-driven) causes severe throughput degradation across the performance stack.
- **State management naivety**: Concurrency models that share state (threads, coroutines) require explicit synchronization, while process-based models (FPM) are state-safe by default.
- **Worker scaling without profiling**: Increasing concurrency (workers, threads, coroutines) without profiling the bottleneck leads to resource exhaustion and performance collapse.

---

## Anti-Pattern 1: Treating All Concurrency Models as Equivalent

### Category
Conceptual

### Description
Viewing PHP-FPM processes, Octane workers, Swoole coroutines, and FrankenPHP threads as interchangeable approaches to concurrency, without understanding their fundamental differences in memory isolation, state sharing, context switch cost, and scalability characteristics.

### Why It Happens
- All models ultimately handle more requests, creating a superficial equivalence
- Marketing materials blur the lines ("10x more throughput!")
- Lack of systems programming background to distinguish process, thread, and coroutine models
- PHP's long history of hiding concurrency complexity from developers
- Tutorials that focus on setup steps rather than architectural differences

### Warning Signs
- "We use Octane for concurrency" without specifying process or coroutine mode
- Swoole and FPM compared as "fast vs slow" rather than "shared-nothing vs shared-state"
- FrankenPHP threads assumed to have the same isolation properties as FPM processes
- Concurrency model chosen based on the highest benchmark number without architectural analysis
- No discussion of state management, memory isolation, or fault containment

### Why Harmful
Concurrency models have fundamental architectural differences:
- Processes: Complete isolation, high context-switch cost, no shared state, simple
- Threads: Shared memory, medium isolation, medium context-switch cost, synchronization needed
- Coroutines: Cooperative multitasking, shared state within a thread, very low switch cost
- Event-driven: Single-threaded, non-blocking I/O, no parallelism, maximum throughput for I/O
Choosing the wrong model for the workload and team expertise leads to degraded performance, state corruption, and operational complexity that cannot be fixed by tuning.

### Consequences
- Unrecoverable architecture choice (rewriting from FPM to coroutines is expensive)
- Performance 10x below what the right model would provide
- State corruption bugs that are non-deterministic and hard to reproduce
- Team struggling with unfamiliar concurrency primitives (mutexes, locks, channels)
- Debugging complexity far beyond the team's ability to manage
- Wasted migration effort when the current model was adequate

### Alternative
Classify by workload and team capability:
- Simple CRUD, limited traffic, small team: FPM processes (safe, simple, well-understood)
- High-throughput API, experienced team: Octane/RoadRunner workers (shared-nothing within worker)
- Maximum concurrency, I/O-heavy, expert team: Swoole coroutines (cooperative multitasking)
- Container-native, operational simplicity: FrankenPHP threads (ZTS, embedded SAPI)
- Match the model to both the workload profile and the team's ability to manage the complexity

### Refactoring Strategy
1. Characterize the workload: CPU-bound vs I/O-bound, request latency, concurrency requirements
2. Assess team expertise: experience with threads, coroutines, event loops, shared state
3. Select the simplest model that meets performance requirements
4. Prototype with a single endpoint before committing to a model change
5. Benchmark the new model against the current one with realistic workloads

### Detection Checklist
- [ ] Concurrency model choice documented with rationale
- [ ] Workload profile (CPU/I/O ratio) informs model selection
- [ ] Team expertise considered in model selection
- [ ] Prototype and benchmark performed before architecture migration
- [ ] Isolation and state management requirements documented
- [ ] Fallback plan exists if the chosen model doesn't deliver expected gains

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Shared-Nothing Architecture
- 04-standardized-knowledge.md: Memory-Resident Architecture
- 04-standardized-knowledge.md: Swoole Architecture
- 07-decision-trees.md: Concurrency Model Selection Decision Tree

---

## Anti-Pattern 2: Using Process-Based Concurrency for I/O-Bound Workloads

### Category
Architecture

### Description
Using PHP-FPM (process-per-request, shared-nothing) for applications where the workload is dominated by I/O wait (database queries, HTTP API calls, file system operations), requiring many processes to maintain throughput and wasting system memory on idle processes.

### Why It Happens
- PHP-FPM is the default and most familiar model
- "It works" — the application runs correctly, just not efficiently
- No profiling to distinguish CPU and I/O wait time
- The cost of idle processes is not visible until memory pressure causes OOM
- No experience with async/coroutine models to compare against

### Warning Signs
- 100+ FPM workers configured to maintain throughput
- FPM worker CPU utilization < 20% (most time spent waiting for I/O)
- Database query time accounts for >50% of total request time
- High memory consumption (worker RSS × worker count)
- FPM processes in "Idle" state most of the time
- OOM kills occur during traffic spikes despite adequate average memory

### Why Harmful
Process-based concurrency is inefficient for I/O-bound workloads:
- Each process consumes 30-80MB RSS, even when waiting for I/O
- A process waiting for a 50ms database query consumes memory but does no useful work
- Maintaining throughput requires N processes where N = concurrent I/O operations
- For 200 concurrent I/O operations, 200 processes × 50MB = 10GB RAM
- Context-switching overhead between many processes wastes CPU cycles
- Maximum throughput limited by number of processes, not I/O throughput

### Consequences
- 2-10x more memory consumed than necessary
- Memory pressure and OOM under peak load
- CPU wasted on process context switching
- Scaling limited by server memory (can't add more workers)
- Higher cloud costs for larger instances
- Poor throughput per GB of memory compared to async alternatives

### Alternative
For I/O-bound workloads with significant throughput requirements:
- Evaluate Swoole (coroutine-based, async I/O hooks) for maximum concurrency per process
- Consider Octane with RoadRunner (shared-nothing but bootstrap-once) for moderate gains
- Implement connection pooling and query batching to reduce I/O wait time
- Use async I/O only if I/O wait is >10ms per operation and concurrency requirements are high
- For low-concurrency I/O-bound apps, FPM is acceptable — profile before migrating

### Refactoring Strategy
1. Profile I/O wait vs CPU time to quantify the problem
2. If I/O wait > 50% and concurrency requirements exceed FPM capacity:
3. Prototype Octane with RoadRunner (lowest migration effort)
4. Benchmark throughput per GB of memory vs FPM
5. If still insufficient, evaluate Swoole for coroutine-based I/O concurrency

### Detection Checklist
- [ ] I/O wait vs CPU time profiled
- [ ] FPM worker count and utilization reviewed
- [ ] Memory consumption per worker measured
- [ ] Throughput per GB of memory calculated
- [ ] Alternative models evaluated if process-based concurrency is insufficient
- [ ] Async model selected based on I/O profile, not general advice

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Sync vs Async I/O
- 07-decision-trees.md: Concurrency Model Selection Decision Tree
- 05-rules.md: Profile I/O Before Scaling Workers

---

## Anti-Pattern 3: Ignoring Shared State Mutability in Coroutine Models

### Category
State Management

### Description
Using coroutine-based concurrency (Swoole, amphp) with the same shared-nothing assumptions as FPM, introducing shared mutable state through static properties, singletons, or global variables that are visible across coroutines within the same process.

### Why It Happens
- Developers trained on FPM's shared-nothing model carry the same patterns to coroutine-based runtimes
- Static properties and singletons are idiomatic in many PHP frameworks and packages
- Race conditions in coroutines are non-deterministic and may not appear during development
- No mental model of cooperative multitasking and shared state within a process
- Existing code written for FPM is assumed to be safe in any runtime

### Warning Signs
- Intermittent, non-reproducible bugs that "fixed themselves" on retry
- Static properties used for caching without awareness of coroutine concurrency
- Singleton service instances that store per-request state
- Race conditions that appear only under load, not in single-request testing
- Shared state mutation without mutex, lock, or channel synchronization
- Existing FPM codebase migrated to Swoole without state audit

### Why Harmful
Coroutine concurrency within a process means:
- Multiple coroutines execute within the same memory space
- Static properties and globals are visible to all coroutines in that process
- Without synchronization, two coroutines can mutate the same property simultaneously
- Race conditions cause data corruption, incorrect results, and hard-to-diagnose bugs
- A crash in one coroutine can corrupt state for all coroutines in the process
- Non-deterministic failures that pass local testing but fail in production

### Consequences
- Data corruption: double-counting, skipped updates, inconsistent state
- Non-deterministic bugs that cannot be reliably reproduced in development
- Production incidents that appear and disappear without explanation
- Emergency rollbacks when corruption is detected
- Emergency code audit to identify all shared state and add synchronization
- Team spending time on race conditions instead of feature development

### Alternative
For coroutine-based concurrency:
- Treat static properties as shared state that requires synchronization
- Use Swoole's channel, mutex, or atomic operations for cross-coroutine state
- Prefer coroutine-local storage for per-request state
- Avoid mutable global state entirely — use immutable configuration loaded at startup
- Audit all service providers for static property usage before migrating from FPM
- Add integration tests that exercise concurrent requests to the same worker

### Refactoring Strategy
1. Audit all static properties, singletons, and global variables in the codebase
2. Classify each as: truly global (immutable config), per-coroutine state, or shared mutable
3. For shared mutable state: add synchronization (Swoole channel, mutex, or lock)
4. For per-coroutine state: use coroutine-local storage or pass explicitly
5. For immutable global state: ensure initialization before worker starts handling requests
6. Test with concurrent request patterns to verify race condition elimination

### Detection Checklist
- [ ] All static properties audited for coroutine safety
- [ ] Singleton instances reviewed for per-request state storage
- [ ] Service providers audited for shared mutable state
- [ ] Synchronization primitives used where shared state is necessary
- [ ] Concurrent test patterns validate race condition freedom
- [ ] Migration from FPM includes state audit as a prerequisite

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: State Management in Octane
- 05-rules.md: Audit Static Properties Before Octane Migration
- 07-decision-trees.md: State Management Strategy Decision Tree
- S07-laravel-octane: State Management and Leak Prevention KU

---

## Anti-Pattern 4: Assuming More Workers Always Increases Throughput

### Category
Capacity

### Description
Continuously increasing the number of FPM workers or Octane worker processes expecting linear throughput gains, without considering memory constraints, database connection limits, CPU contention, and context-switching overhead.

### Why It Happens
- Intuitive but wrong: "more workers = more throughput"
- Memory appears available (free RAM is visible), but database connection pool limits are invisible
- Lack of understanding of Amdahl's Law and the diminishing returns of parallelization
- Quick fix for perceived slowness without profiling the underlying bottleneck
- Worker counts increased in response to traffic without recalibrating other limits

### Warning Signs
- Throughput plateaus or decreases as worker count increases
- Database connection pool exhaustion errors appear
- CPU utilization reaches 100% but throughput is not increasing
- FPM status page shows many processes in "Running" state but waiting for I/O
- Memory usage is high but swaps or OOMs occur
- Queueing theory: latency increases faster than throughput

### Why Harmful
There is an optimal worker count for any system; beyond it:
- Context switching overhead increases non-linearly as more workers compete for CPU cores
- Memory consumption increases linearly (each worker has fixed RSS overhead)
- Database connection pools reach limits, causing connection queueing and timeouts
- File descriptor limits can be exhausted
- CPU cache thrashing as more processes compete for L1/L2/L3 cache
- The system enters "thrashing" mode where adding workers reduces total throughput

### Consequences
- Throughput decreases as worker count increases (negative scaling)
- OOM kills due to memory exhaustion
- Database connection pool exhaustion and timeouts
- Higher latency due to CPU contention and context switching
- Increased operational incidents during traffic spikes
- Higher cloud costs for larger instances that provide no benefit

### Alternative
Find the optimal worker count empirically:
1. Measure system throughput (RPS) and latency at different worker counts
2. Start at worker count = CPU cores and increase in steps
3. The optimal count is where RPS plateaus or latency increases >5%
4. The constraint is typically: min(CPU cores × 2, memory / worker RSS, DB connection pool / 2)
5. Use the plateau point, not the maximum possible count
6. Monitor key indicators: FPM listen queue, CPU utilization, DB connection count

### Refactoring Strategy
1. Profile the bottleneck: CPU, memory, or database connections
2. Calculate theoretical max: memory ceiling, DB connection ceiling, CPU ceiling
3. Set worker count to the most restrictive ceiling
4. Load test at the calculated count and verify RPS and latency targets are met
5. Monitor and adjust: track FPM listen queue length as the primary indicator

### Detection Checklist
- [ ] Throughput vs worker count curve established (plateau identified)
- [ ] Database connection pool limits known and factored into worker count
- [ ] Worker RSS measured and used for memory ceiling calculation
- [ ] CPU utilization profile (kernel vs user, idle) reviewed
- [ ] FPM listen queue monitored for worker starvation
- [ ] Optimal worker count documented and configured
- [ ] Monitoring alerts for worker count approaching scaling limits

### Related Rules, Skills, Trees
- 05-rules.md: Determine Optimal Worker Count Empirically
- 07-decision-trees.md: Worker Scaling Decision Tree
- S05-php-fpm-worker-management: Pool Sizing Formula KU

---

## Anti-Pattern 5: Blocking the Event Loop in Async Runtimes

### Category
Implementation

### Description
Calling synchronous blocking operations (sleep(), file_get_contents(), PDO queries without async hooking) inside an event loop or coroutine context, blocking the entire event loop and defeating the purpose of async concurrency.

### Why It Happens
- Existing PHP code uses blocking I/O functions by default (PDO, file_get_contents, curl_exec)
- Developers don't realize that Swoole's auto-hooking only covers specific functions
- sleep(), usleep(), and time-consuming CPU operations are not hookable
- Third-party libraries used inside coroutines may use blocking I/O internally
- No linting or static analysis to detect blocking calls in async contexts

### Warning Signs
- Throughput does not improve after migrating to Swoole/async runtime
- One slow request blocks all other requests handled by the same worker/event loop
- P95 latency equals the sum of all blocking operations in the request
- Event loop metrics show high "tick duration" or "blocked time"
- Micro-pauses observed in latency traces that correspond to blocking operations
- Code uses sleep() for rate limiting or delays inside coroutines

### Why Harmful
Blocking the event loop destroys the async concurrency advantage:
- In a coroutine runtime, a blocking call suspends the entire event loop, not just the coroutine
- All other coroutines in that process are blocked until the operation completes
- Throughput drops to the same as synchronous FPM (or worse, due to async overhead)
- The system loses all benefit of non-blocking I/O and coroutine scheduling
- Different processes/workers remain available, but within-process concurrency is nullified

### Consequences
- Async runtime throughput no better than (or worse than) FPM
- Blocking operations create cascading delays across all requests sharing the event loop
- Debugging blocking operations is difficult — they appear as mysterious latency spikes
- Team confidence in async runtime erodes when expected gains don't materialize
- Emergency migration back to FPM when async performance is worse

### Alternative
In async/coroutine contexts:
- Use only non-blocking I/O operations: Swoole's async PDO, MySQLi, Redis, and curl hooks
- Replace sleep() with Swoole\Coroutine::sleep() or equivalent
- For CPU-heavy operations, use Swoole's task worker or process pool to offload
- Audit all third-party libraries for blocking I/O before using in coroutines
- Use PDO and other sync APIs only in task workers or process pools
- Prefer file_get_contents() with stream wrappers and non-blocking mode

### Refactoring Strategy
1. Audit all I/O operations in coroutine contexts
2. Replace blocking calls: PDO → Swoole\Coroutine\MySQL, Redis → Swoole\Coroutine\Redis, curl → Swoole\Coroutine\Http\Client
3. Replace sleep() → Swoole\Coroutine::sleep() or event loop timer
4. For CPU-heavy operations: offload to task worker via Swoole\Server->task()
5. Add runtime detection of blocking calls during development (Swoole\Coroutine::exists())
6. Verify with event loop monitoring that no blocking operations remain

### Detection Checklist
- [ ] All database operations use async-hooked drivers in coroutine context
- [ ] sleep() replaced with coroutine-safe alternative
- [ ] Third-party libraries audited for blocking I/O
- [ ] CPU-heavy operations delegated to task workers
- [ ] Event loop monitoring confirms zero blocking calls
- [ ] Throughput comparison confirms async benefit over FPM
- [ ] Team educated on blocking vs non-blocking distinctions

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Sync vs Async I/O
- 05-rules.md: Never Block the Event Loop
- 07-decision-trees.md: Synchronous vs Asynchronous Decisions
- S06-alternative-runtimes: Swoole Architecture KU
