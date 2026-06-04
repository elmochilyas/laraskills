# Anti-Patterns: Shared-Nothing Architecture

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | Shared-Nothing Architecture |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Forcing State Sharing Across FPM Workers | Architecture | Critical |
| 2 | Treating Shared-Nothing as a Performance Feature | Conceptual | High |
| 3 | Using Shared-Nothing for Everything | Strategy | High |
| 4 | Not Optimizing Bootstrap Within the Model | Configuration | High |
| 5 | Fighting the Model with State Workarounds | Implementation | Medium |

## Repository-Wide Anti-Patterns

- **Isolation vs performance blind spot**: Choosing shared-nothing or memory-resident architecture based on familiarity rather than workload profile, failing to recognize that the right choice depends on the trade-off between isolation guarantees and bootstrap overhead.
- **Inconsistent architecture across services**: Running some services in shared-nothing FPM and others in memory-resident Octane without a consistent state management strategy, leading to confusion about which patterns are safe.

---

## Anti-Pattern 1: Forcing State Sharing Across FPM Workers

### Category
Architecture

### Description
Using APCu, shared memory (shmop), file-based locks, or other cross-process communication to share state between PHP-FPM workers — violating the shared-nothing model and introducing race conditions, stale data, and hard-to-debug consistency issues.

### Why It Happens
- Familiarity with stateful languages (Java, Python) where shared state is normal
- Desire for performance: "caching in memory is faster than Redis"
- Existing APCu infrastructure used for one-server deployments
- Unawareness that FPM workers are separate processes with no shared memory by design
- Migration from a stateful framework where singletons and caches were safe
- "It works in development" — single-worker testing doesn't reveal race conditions

### Warning Signs
- APCu used for mutable data that changes between requests
- File-based locks or mutexes for cross-worker synchronization
- Race conditions that appear only under load (multiple workers)
- Data inconsistency between requests handled by different workers
- "Works on one server but breaks with multiple servers" — the same issue at server scale
- APCu cache invalidation bugs that are hard to reproduce
- Custom shared memory implementations (shmop, mmap) in PHP code

### Why Harmful
PHP-FPM is designed as shared-nothing — fighting this introduces fundamental problems:
- FPM workers are independent OS processes with separate memory spaces
- APCu is shared across workers but is not transactional — two workers can write simultaneously
- No atomicity guarantees across multiple APCu operations
- File-based locking introduces I/O latency and deadlock risks
- Cross-worker state sharing breaks when scaling to multiple servers
- The workaround (APCu, file locks) is often slower than using Redis
- Debugging cross-worker state issues is extremely difficult

### Consequences
- Race conditions causing data corruption under load
- Stale or inconsistent data served to users
- Hard-to-reproduce bugs that surface only in production
- Scaling blocked: adding servers makes consistency problems worse
- Emergency rewrites to remove shared state when scaling is needed
- Performance worse than Redis (APCu is not designed for mutable cross-worker state)

### Alternative
Use external services for cross-request/cross-worker state:
- Redis: purpose-built for shared cache, has atomic operations, TTL, pub/sub
- Database: transactional, consistent, supports all data patterns
- Use APCu only for read-only, cache-forever data (config, rarely changed lookups)
- For cache that must be shared across workers and servers, ALWAYS use Redis/Memcached
- For per-worker caches (immutable config, class maps), APCu is safe
- Accept that shared-nothing means no in-process shared state — use the network

### Refactoring Strategy
1. Audit all APCu usage: is the data mutable? Is it shared across workers?
2. For mutable shared data: migrate from APCu to Redis
3. For read-only global data: keep in APCu (safe, fast)
4. For cross-worker coordination: use Redis pub/sub or database locks
5. Test under concurrent load to verify race conditions are eliminated
6. Document: "APCu is for read-only per-worker cache. Redis is for shared mutable state."

### Detection Checklist
- [ ] APCu usage audited — no mutable cross-worker data
- [ ] Redis used for all shared mutable cache
- [ ] File-based locking not used for cross-worker synchronization
- [ ] No custom shared memory implementations
- [ ] Concurrent load testing shows no data consistency issues
- [ ] Multi-server deployment works without state sharing workarounds

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Shared-Nothing Architecture
- 05-rules.md: Use External Services for Shared State
- 07-decision-trees.md: State Storage Decision Tree

---

## Anti-Pattern 2: Treating Shared-Nothing as a Performance Feature

### Category
Conceptual

### Description
Describing PHP-FPM's shared-nothing architecture as a "performance feature" because it provides isolation, confusing safety guarantees with throughput characteristics — shared-nothing is a safety feature, not a performance feature.

### Why It Happens
- "No locks, no shared state = no contention = fast" — intuitive but incomplete reasoning
- FPM's shared-nothing is often contrasted with threaded models (Java, Python) that require synchronization
- The safety benefits (no cross-request interference) are real and valuable
- Unawareness that the per-request bootstrap overhead is a performance cost of shared-nothing
- Confusing architectural simplicity with performance

### Warning Signs
- "FPM is fast because it has no shared state" — shared state has costs, but bootstrap has costs too
- Architecture decisions justified by "shared-nothing is the fastest model"
- No acknowledgment that bootstrap overhead is the trade-off for isolation
- Octane/alternatives dismissed because "shared-nothing is faster" (it's not for fast endpoints)
- No measurement of bootstrap cost to validate the shared-nothing choice
- Performance budget allocated to stay within shared-nothing instead of evaluating alternatives

### Why Harmful
Misclassifying shared-nothing as a performance feature leads to:
- Choosing FPM for high-throughput API workloads where Octane would provide 3-15x gain
- Not measuring bootstrap cost (assuming shared-nothing is always optimal)
- Dismissing memory-resident architectures without evaluation
- Over-engineering FPM optimization (preloading, OpCache tuning) when a model change would help more
- Missing the fundamental insight: safety and performance are traded off in concurrency models

### Consequences
- Suboptimal architecture choice: running FPM for workloads where Octane would be faster
- 3-15x throughput left on the table for API-heavy applications
- Significant engineering effort tuning FPM when a model change would provide more gain
- Team not aware of alternative architectures or their trade-offs
- Architecture decisions based on incomplete understanding of the trade-offs

### Alternative
Understand the actual trade-off:
- Shared-nothing (FPM): Complete isolation at the cost of per-request bootstrap. Best for safety-critical, multi-tenant, mixed-traffic workloads.
- Memory-resident (Octane): Shared state risks at the cost of state management. Best for high-throughput API workloads where bootstrap dominates.
- The choice is NOT "fast vs slow" — it's "safe vs fast for your specific workload"
- Measure bootstrap cost and isolation requirements before choosing
- Consider hybrid: some endpoints on Octane, others on FPM

### Refactoring Strategy
1. Profile bootstrap cost as percentage of total response time
2. Evaluate: is isolation (multi-tenant, security-sensitive) or throughput more important?
3. If isolation is critical: shared-nothing is the right choice — optimize within it
4. If throughput is critical: evaluate memory-resident architecture
5. Document the trade-off reasoning for the architecture choice
6. Revisit periodically as workload and isolation requirements change

### Detection Checklist
- [ ] Architecture choice documented with trade-off analysis
- [ ] Bootstrap cost measured and factored into architecture decision
- [ ] Isolation requirements clearly defined
- [ ] Shared-nothing not assumed to be "faster" — measured against alternatives
- [ ] Team understands the safety vs performance trade-off
- [ ] Alternatives (Octane, Swoole) evaluated if throughput is a priority

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Shared-Nothing Architecture
- 04-standardized-knowledge.md: Memory-Resident Architecture
- 07-decision-trees.md: Architecture Selection Decision Tree

---

## Anti-Pattern 3: Using Shared-Nothing for Everything

### Category
Strategy

### Description
Running ALL applications on PHP-FPM regardless of workload characteristics — including high-throughput API services where the bootstrap overhead dominates response time and a memory-resident architecture would provide 3-15x throughput improvement.

### Why It Happens
- PHP-FPM is the default and most familiar deployment model
- "One size fits all" approach to web serving
- No profiling to distinguish workload types
- Unawareness of Octane, Swoole, RoadRunner, FrankenPHP as alternatives
- Organizational inertia: "we've always used FPM"
- Concern about state management complexity with memory-resident architectures

### Warning Signs
- All applications use PHP-FPM regardless of their workload profile
- API endpoints with sub-50ms response time running on FPM (bootstrap is 60-80% of time)
- No Octane, Swoole, or FrankenPHP evaluation in architecture reviews
- Throughput limited by FPM worker count despite low CPU utilization
- Bootstrap appears as the widest frame in profiling (60%+ of response time)
- Team has never tested an alternative runtime

### Why Harmful
Using FPM for all workloads leaves performance on the table:
- Fast API endpoints (<50ms) bootstrap accounts for 60-80% of response time
- Memory-resident architecture can provide 3-15x throughput for these workloads
- FPM's per-request overhead is the same regardless of endpoint complexity
- The cost increases with more workers (memory, per-process overhead)
- Application workloads vary widely — no single model is optimal for all
- Not evaluating alternatives means the team doesn't know what they're missing

### Consequences
- 3-15x throughput left on the table for fast API endpoints
- Higher infrastructure costs (more servers for same throughput)
- Higher latency than necessary for API workloads
- Team not exposed to alternative architectures or their benefits
- Competitive disadvantage in API response times
- No migration experience when the need eventually arises

### Alternative
Match the architecture to the workload:
1. Classify your applications: API gateway, CRUD web app, admin panel, background processing
2. Profile bootstrap proportion for each category
3. For high-throughput API workloads where bootstrap > 30%: evaluate memory-resident architecture
4. For slow endpoints, admin panels, mixed traffic: FPM is appropriate
5. Run a pilot with one API endpoint on Octane to validate the approach
6. Document the architecture decision per workload category

### Refactoring Strategy
1. Profile 3-5 representative endpoints from the highest-traffic application
2. If bootstrap > 30% for fast endpoints, proceed to evaluation
3. Set up Octane with RoadRunner or FrankenPHP for one API endpoint
4. Benchmark throughput, latency, and memory consumption vs FPM
5. If gains justify the complexity, plan a phased migration for API endpoints
6. Keep FPM for admin panels, background jobs, and slow endpoints

### Detection Checklist
- [ ] Applications classified by workload profile (fast API, slow API, web, admin)
- [ ] Bootstrap proportion measured per workload category
- [ ] Memory-resident architecture evaluated for high-throughput API workloads
- [ ] Pilot migration performed for one API endpoint
- [ ] Architecture decision documented per workload category
- [ ] Not all applications default to FPM — choice is deliberate

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Shared-Nothing Architecture
- 04-standardized-knowledge.md: Memory-Resident Architecture
- 07-decision-trees.md: Architecture Selection Decision Tree

---

## Anti-Pattern 4: Not Optimizing Bootstrap Within the Model

### Category
Configuration

### Description
Accepting the default FPM bootstrap overhead without applying within-model optimizations (OpCache tuning, preloading, Composer optimization, service provider caching) that reduce bootstrap cost even within the shared-nothing architecture.

### Why It Happens
- "Bootstrap overhead is the price of shared-nothing" — accepting it as fixed
- Unawareness of OpCache tuning, preloading, and Composer optimization
- No profiling to measure bootstrap cost and identify optimization opportunities
- Focus on model change (Octane) instead of within-model optimization
- Assumption that "FPM is slow, Octane is fast" without optimizing FPM first

### Warning Signs
- OpCache configured with default values (64MB memory, default file count)
- Preloading not configured or evaluated
- Composer autoloader uses default PSR-4 (not optimized with --classmap-authoritative)
- Service provider discovery not cached (config:cache, route:cache not run)
- Bootstrap cost measured at 60%+ but no within-model optimization applied
- Plan to migrate to Octane without first optimizing FPM performance

### Why Harmful
Within-model optimization provides significant gains:
- OpCache tuning: 2-4x gain vs unoptimized OpCache
- Preloading: reduces cold bootstrap time by 30-50%
- Composer --classmap-authoritative: 10-20% autoload improvement
- Service provider caching (config:cache, route:cache, event:cache): 20-40% bootstrap reduction
- These optimizations apply to ALL FPM requests, not just fast endpoints
- Combining them can reduce bootstrap overhead by 50-70%

### Consequences
- 50-70% of bootstrap overhead needlessly paid on every request
- Higher latency than necessary for ALL endpoints, not just fast ones
- Migration to Octane considered when FPM optimization would solve the problem
- Wasted compute resources on per-request bootstrap
- Team hasn't learned the within-model optimization stack
- Inconsistent optimization across environments

### Alternative
Optimize within the shared-nothing model first:
1. Enable and tune OpCache (memory, file count, validation)
2. Configure preloading for frequently used classes
3. Run Composer optimization (--classmap-authoritative --no-dev)
4. Cache Laravel config, routes, events, and views
5. Profile bootstrap cost reduction from each optimization
6. Only then evaluate whether model change (Octane) is needed for remaining bootstrap cost

### Refactoring Strategy
1. Measure current bootstrap cost with profiling
2. Enable OpCache with appropriate memory and file limits
3. Configure preloading for Laravel framework classes
4. Run composer dump-autoload --classmap-authoritative
5. Run php artisan optimize (or equivalent for non-Laravel)
6. Re-measure bootstrap cost — should be 50-70% lower
7. If remaining bootstrap cost is still significant (>20% of response time), evaluate Octane

### Detection Checklist
- [ ] OpCache properly configured (not default values)
- [ ] Preloading enabled for framework classes
- [ ] Composer autoloader optimized (--classmap-authoritative)
- [ ] Framework service provider caching applied (config, route, event, view)
- [ ] Bootstrap cost reduced by 50%+ from optimizations
- [ ] Within-model optimization applied before evaluating model change

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Shared-Nothing Architecture
- 04-standardized-knowledge.md: OpCache Configuration
- 05-rules.md: Optimize Within Model First

---

## Anti-Pattern 5: Fighting the Model with State Workarounds

### Category
Implementation

### Description
Implementing workarounds (static properties, global variables, singletons) to share state across FPM requests, violating the shared-nothing model and introducing subtle bugs, while missing the point that the model was chosen for isolation in the first place.

### Why It Happens
- Convenience: static property cache is easier than Redis
- Performance: in-memory access is faster than network requests
- Legacy code patterns that predate FPM understanding
- Framework conventions that encourage static singletons
- Unawareness that these workarounds break when scaling to multiple servers
- "It's just for caching, it doesn't need to be consistent"

### Warning Signs
- Static properties used for caching data that changes at runtime
- Singleton services that cache per-request data across requests
- Registry or service locator patterns using global state
- Mixed results: "it works on my machine but not in production"
- Intermittent bugs related to stale or inconsistent cached data
- Code comments like "// This is a hack because FPM doesn't share state"
- Performance improvements from static caches that disappear under multi-server deployment

### Why Harmful
Fighting the shared-nothing model creates problems:
- Static caches work against the model's isolation guarantee
- Inconsistent: data cached in one worker is not visible to others
- Race conditions: two workers can cache different versions of the same data
- Debugging is difficult because state is invisible and non-deterministic
- Scaling to multiple servers exposes all the workarounds at once
- The workaround is often more complex than using the right tool (Redis)

### Consequences
- Intermittent bugs from inconsistent cached state across workers
- Hard-to-diagnose production issues that clear when workers restart (cache flushed)
- Scaling blocked: workarounds prevent multi-server deployment
- Emergency rewrites to remove static state hacks
- Performance worse than Redis when cache invalidation overhead is counted
- Team learns wrong patterns that infect new code

### Alternative
Embrace the shared-nothing model:
- Use the right tool for shared state: Redis, database, or external cache
- Accept that in-memory caches are per-worker and will be cold on each worker
- For per-worker caches (immutable config): safe to use static properties
- For mutable shared data: ALWAYS use external service
- Design for horizontal scaling from the start
- Test with multiple workers to expose state-sharing assumptions

### Refactoring Strategy
1. Find all static properties that store mutable data (not immutable config)
2. For each: decide if the data is per-worker (immutable) or shared (mutable)
3. For mutable shared data: replace static cache with Redis/Memcached/database
4. For immutable per-worker data: keep static cache but ensure it's truly immutable
5. Test under concurrent load with multiple workers
6. Test with multiple servers to confirm no shared state assumptions

### Detection Checklist
- [ ] All static property usage audited
- [ ] No mutable shared state stored in static properties
- [ ] Redis/database used for all shared mutable data
- [ ] Static caches are read-only after worker initialization
- [ ] Concurrent load testing shows no state inconsistency
- [ ] Multi-server testing shows no state assumptions
- [ ] Code review enforces "no mutable shared state in static properties"

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Shared-Nothing Architecture
- 05-rules.md: Use External Services for Shared State
- 07-decision-trees.md: State Storage Decision Tree
