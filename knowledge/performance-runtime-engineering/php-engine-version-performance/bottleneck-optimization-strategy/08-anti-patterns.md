# Anti-Patterns: Bottleneck Optimization Strategy

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | Bottleneck Optimization Strategy |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Optimizing Without Profiling Data (Guessing) | Methodology | Critical |
| 2 | Premature Optimization at Architecture Level | Architecture | High |
| 3 | Single-Threaded Optimization in I/O-Bound Systems | Resource Allocation | High |
| 4 | Ignoring the Bottleneck Hierarchy (Wrong Layer) | Methodology | High |
| 5 | Local Optimization That Worsens Global Performance | Architecture | Medium |

## Repository-Wide Anti-Patterns

- **Profiling vacuum**: Making optimization decisions across performance subdomains without profiling data leads to effort wasted on non-bottleneck code.
- **Single-metric optimization**: Optimizing for throughput at the expense of latency, or vice versa, without understanding which matters more for the use case.
- **Ignoring the compounding effect**: Small optimizations (5% here, 3% there) compound across layers — but only if the actual bottleneck is addressed first.

---

## Anti-Pattern 1: Optimizing Without Profiling Data (Guessing)

### Category
Methodology

### Description
Making performance optimization decisions based on intuition, code reading, or assumptions rather than empirical profiling data. Common examples: "this function has many loops so it must be slow" or "we should add caching everywhere."

### Why It Happens
- Profiling tools require setup and learning — guessing is faster
- Intuition about what is slow is often wrong (developers consistently misidentify bottlenecks)
- Pressure to "do something" about performance without waiting for proper diagnosis
- Cultural habit of optimizing based on code complexity rather than measured cost

### Warning Signs
- Optimization decisions made during code review without profiling evidence
- Cache layers added to code paths that are not measured as slow
- "This function is complex so it must be slow" reasoning
- Optimizations applied across the board (all queries cached, all loops optimized)
- No flame graphs or profiling data referenced in performance discussions

### Why Harmful
Without profiling data, optimization is random:
- Studies show developers correctly identify bottlenecks <50% of the time by intuition
- Effort spent on code that accounts for <5% of total execution time
- The actual bottleneck remains unaddressed while time is wasted elsewhere
- Added complexity from unnecessary optimizations (caching, memoization, precomputation)
- Performance gains are marginal because the wrong thing was optimized

### Consequences
- Wasted engineering hours on non-bottleneck code
- Actual bottleneck remains unaddressed
- Added code complexity with no performance benefit
- Increased maintenance burden from caching layers, memoization, and workarounds
- Team loses confidence in performance improvement efforts

### Alternative
Follow a profiling-driven optimization workflow:
1. Measure: Profile the system to identify the hottest code paths (inclusive time > 20%)
2. Diagnose: Understand why these paths are slow (I/O, CPU, memory allocation)
3. Optimize: Apply targeted changes to the identified bottleneck
4. Verify: Re-profile to confirm the bottleneck is reduced
5. Repeat: Move to the next bottleneck

### Refactoring Strategy
1. Install a profiling tool (Blackfire, Tideways, SPX, Xdebug for dev)
2. Generate a flame graph of a representative request
3. Identify the widest frames (highest inclusive time)
4. Optimize only the top 3 bottlenecks measured by inclusive time
5. Re-profile after each optimization to confirm improvement

### Detection Checklist
- [ ] Profiling data exists for the optimized code path
- [ ] Optimization targets correspond to profiled hot spots (>10% inclusive time)
- [ ] Before-and-after profiling data confirms improvement
- [ ] Intuition-based optimizations are flagged and require profiling justification
- [ ] No cache layer added without profiling evidence of database bottleneck

### Related Rules, Skills, Trees
- 06-skills.md: Tiered Profiling Workflow
- 07-decision-trees.md: Prioritization Decision Trees

---

## Anti-Pattern 2: Premature Optimization at Architecture Level

### Category
Architecture

### Description
Adopting complex architectural patterns (event sourcing, CQRS, microservices, message queues, distributed caching) for performance reasons before profiling confirms that the simpler architecture is the bottleneck.

### Why It Happens
- Excitement about new architectural patterns
- Assuming that because a pattern is "scalable," it is necessarily faster
- Premature concern about future traffic levels without data
- Belief that complex distributed architectures are inherently more performant
- Over-engineering as a solution to perceived (not measured) bottlenecks

### Warning Signs
- Caching layer added before measuring cache hit rate requirements
- Message queue introduced before profiling confirms synchronous processing is slow
- Microservices extracted for performance before monolith bottleneck is identified
- Event sourcing adopted for speed without comparing to simple CRUD performance
- Architecture decisions justified with "we might need it later" rather than profiling data

### Why Harmful
Complex architectures introduce overhead that often makes performance worse:
- Network calls replaced in-process method calls (adding latency)
- Serialization/deserialization overhead for every operation
- Cache invalidation complexity and stale data bugs
- Operational overhead of running more services
- Distributed debugging and tracing complexity

### Consequences
- Performance gets worse, not better (added network hops, serialization)
- Significantly increased operational complexity
- Higher infrastructure costs (more services to run)
- Debugging and troubleshooting become much harder
- Team productivity decreases due to cognitive load of distributed system
- The actual bottleneck (often a database query or algorithm) remains unfixed

### Alternative
Follow a progression:
1. Profile to find the actual bottleneck in the current architecture
2. Apply the simplest fix first (query optimization, indexing, caching of specific data)
3. Only if profiling confirms the simpler architecture itself is the bottleneck, consider architectural changes
4. When changing architecture, benchmark the new architecture against the old one with realistic workloads
5. Keep the old architecture as a fallback if the new one doesn't improve performance

### Refactoring Strategy
1. Profile the current monolith/simple architecture to identify real bottlenecks
2. Apply all simple optimizations first (query tuning, indexing, OpCache, caching)
3. Re-profile — if the bottleneck is still architecture-level (>50% of time in inter-service coordination), then consider change
4. Prototype the new architecture with a single bounded context
5. Benchmark the prototype against the optimized monolith before committing

### Detection Checklist
- [ ] Architecture change is justified by profiling data, not intuition
- [ ] Simpler optimizations (query tuning, caching) have been exhausted first
- [ ] Benchmark comparison exists between current and proposed architecture
- [ ] The proposed architecture does not add more overhead than it removes
- [ ] Team has capacity to manage the increased operational complexity

### Related Rules, Skills, Trees
- 05-rules.md: Profile Before Architecting
- 07-decision-trees.md: Architecture Selection Decision Tree

---

## Anti-Pattern 3: Single-Threaded Optimization in I/O-Bound Systems

### Category
Resource Allocation

### Description
Optimizing single-request CPU time (algorithmic optimization, micro-optimizations) in systems where throughput is limited by I/O wait (database queries, HTTP calls, file system), ignoring the parallelism and concurrency model.

### Why It Happens
- CPU optimization is familiar and rewarding (visible speedups in benchmarks)
- I/O optimization (async, connection pooling, query batching) requires architectural changes
- Profiling focuses on CPU time rather than wall-clock time breakdown
- Development environment has negligible I/O latency, hiding the real bottleneck

### Warning Signs
- Profiling shows high I/O wait time (>50% of total response time)
- Single-request latency is acceptable, but throughput under concurrency is poor
- CPU utilization is low (<30%) while request latency is high
- Optimizations focus on algorithm efficiency while database queries dominate time
- Async/parallelism not used for concurrent I/O operations

### Why Harmful
For I/O-bound systems, CPU optimization yields minimal throughput improvement:
- If 70% of time is waiting for database, a 50% CPU speedup yields only 15% throughput gain
- Adding concurrency (more workers, async I/O) can provide 2-5x throughput improvement
- CPU optimization adds code complexity for marginal real-world benefit
- The fundamental throughput ceiling (I/O wait) remains unchanged

### Consequences
- Marginal throughput improvement from significant optimization effort
- Low CPU utilization persists (wasted compute capacity)
- System still cannot handle required concurrency levels
- Engineering time wasted on CPU optimization when I/O is the bottleneck
- Need for costly horizontal scaling when vertical optimization fails

### Alternative
First classify the workload:
- CPU-bound (>50% CPU utilization): Optimize algorithms, data structures, and opcodes
- I/O-bound (>50% I/O wait): Optimize concurrency, connection pooling, query batching, caching
- Measure wall-clock time breakdown (CPU vs I/O wait vs lock contention)
- Apply the optimization strategy that matches the workload type

### Refactoring Strategy
1. Profile wall-clock time breakdown: CPU time vs I/O wait vs lock contention
2. If I/O wait > 50%, switch focus to concurrency optimization
3. Implement I/O optimizations: connection pooling, query batching, N+1 elimination, caching
4. Consider async runtime (Swoole, RoadRunner, Octane) if I/O wait dominates
5. Re-profile after each I/O optimization to confirm bottleneck has shifted

### Detection Checklist
- [ ] I/O wait time measured and quantified as percentage of total time
- [ ] CPU utilization measured during production traffic
- [ ] Optimization strategy matches workload type (CPU-bound vs I/O-bound)
- [ ] Concurrency model matches I/O profile
- [ ] Profile shows wall-clock breakdown, not just CPU time

### Related Rules, Skills, Trees
- 06-skills.md: Workload Classification Workflow
- 07-decision-trees.md: CPU-bound vs I/O-bound Decision Tree

---

## Anti-Pattern 4: Ignoring the Bottleneck Hierarchy (Wrong Layer)

### Category
Methodology

### Description
Optimizing at the wrong layer of the stack — for example, tuning PHP-FPM worker counts when the bottleneck is a missing database index, or optimizing application code when the bottleneck is network latency to the database server.

### Why It Happens
- Each team owns their layer and optimizes what they can control
- Lack of end-to-end visibility into where time is actually spent
- Tuning is easier than fixing (changing pm.max_children is easier than optimizing a query)
- Tools focus on specific layers (Blackfire for PHP, pg_stat_statements for Postgres)
- No single tool provides full-stack profiling from browser to database

### Warning Signs
- PHP-FPM worker count increased repeatedly without database query optimization
- Application code micro-optimizations applied while database queries remain unindexed
- Cache layers added to mask, not fix, slow database queries
- Configuration parameters tuned without understanding which layer is the bottleneck
- Optimizations at one layer shift the bottleneck to another without resolving it

### Why Harmful
Optimizing at the wrong layer wastes effort and can make things worse:
- Adding more PHP-FPM workers to mask slow queries increases database connection contention
- Caching hides slow queries behind eventual consistency and invalidation complexity
- Application micro-optimizations provide single-digit gains while database queries are 10x too slow
- The bottleneck shifts but is not resolved — performance ceiling remains

### Consequences
- Effort wasted optimizing non-bottleneck layers
- Masked bottlenecks that degrade under higher load
- Increased complexity (caching, connection pooling) without resolving root cause
- Performance ceiling unchanged despite significant effort
- Team fatigue from optimizing without seeing real improvement

### Alternative
Use a systematic top-down approach:
1. Start at the outermost layer (user-facing latency) and work inward
2. Profile the full request path: web server → PHP → database → external services
3. Identify the single layer contributing the most to total response time
4. Optimize that layer first
5. Re-profile and repeat with the next bottleneck

### Refactoring Strategy
1. Generate a full-request flame graph showing all layers (web server, PHP, database, cache, external services)
2. Identify the layer with the widest frame (highest inclusive time)
3. Optimize that layer exclusively until it is no longer the bottleneck
4. Re-profile and move to the next layer
5. Stop when the application meets its performance SLOs

### Detection Checklist
- [ ] Full-stack profiling data available (browser to database)
- [ ] Bottleneck layer identified before optimization begins
- [ ] Optimizations target the bottleneck layer, not adjacent layers
- [ ] Re-profiling confirms bottleneck has moved before changing focus
- [ ] Layer-specific tools used appropriately for each stack level

### Related Rules, Skills, Trees
- 06-skills.md: Tiered Profiling Workflow
- 07-decision-trees.md: Bottleneck Localization Decision Tree

---

## Anti-Pattern 5: Local Optimization That Worsens Global Performance

### Category
Architecture

### Description
Optimizing a specific component or code path in isolation without considering the system-wide effect, leading to improvements in one area that degrade performance elsewhere (e.g., increasing cache TTL improves read performance but causes memory pressure that slows the entire system).

### Why It Happens
- Teams optimize their own components without cross-team coordination
- Local benchmarks show improvement, but system benchmarks don't
- Interactions between components are complex and not well understood
- No system-wide performance model or end-to-end benchmarks
- Incentives are aligned with local optimization (team metrics) rather than global performance

### Warning Signs
- A component change shows improvement in isolation but degradation in end-to-end tests
- Increased cache hit rate is accompanied by increased memory pressure
- Reduced database query time is accompanied by increased PHP memory usage
- Micro-optimizations in hot paths increase code complexity and reduce maintainability
- Optimization in one service increases latency in downstream services

### Why Harmful
Local optimization without global awareness can degrade overall system performance:
- Aggressive caching improves read latency but causes memory pressure that triggers GC overhead
- Connection pooling reduces connection establishment time but increases memory per worker
- Batching database queries reduces round trips but increases per-query latency for other requests
- Preloading all classes improves first-request latency but increases baseline memory consumption

### Consequences
- Net zero or negative system-level performance improvement
- Increased memory consumption from isolated optimizations
- Harder-to-diagnose emergent performance issues
- Cross-team friction when local optimizations degrade shared resources
- Rollback of well-intentioned changes that passed local benchmarks

### Alternative
Always validate system-wide impact:
1. Measure the component in isolation (microbenchmark)
2. Measure the full system before and after the change (end-to-end benchmark)
3. Monitor system-level metrics (total memory, CPU, throughput, p95 latency)
4. Check resource consumption trade-offs (memory vs CPU, latency vs throughput)
5. Roll out gradually with canary analysis if system impact is uncertain

### Refactoring Strategy
1. Set up end-to-end benchmarks that exercise the full request path
2. Define system-level SLOs that must not be violated (max memory, min throughput)
3. Implement the local optimization
4. Run end-to-end benchmarks and compare against system SLOs
5. If system-level metrics degrade, reject the optimization or find a different approach

### Detection Checklist
- [ ] End-to-end benchmark exists and is run before and after optimization
- [ ] System-level resource metrics (memory, CPU, I/O) tracked during benchmarking
- [ ] Component-level optimization cross-referenced with system-level impact
- [ ] Trade-offs documented (e.g., "improves p50 by 10% but increases memory by 15%")
- [ ] Rollback plan exists if system-level metrics degrade

### Related Rules, Skills, Trees
- 05-rules.md: Validate System-Wide Impact
- 07-decision-trees.md: Optimization Trade-off Decision Tree
