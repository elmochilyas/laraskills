# Anti-Patterns: Memory-Resident Architecture

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | Memory-Resident Architecture |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Expecting Drop-In Replacement (No State Audit) | Migration | Critical |
| 2 | Migrating Without Profiling Bootstrap Proportion | Methodology | Critical |
| 3 | No Worker Recycling (Memory Drift) | Operations | High |
| 4 | Improper Connection Management | Configuration | High |
| 5 | Expecting Gains on Slow Endpoints | Expectation Management | High |

## Repository-Wide Anti-Patterns

- **State leak cascade**: Static properties and singletons that work safely in FPM's shared-nothing model persist across requests in memory-resident architectures, causing cross-request data leakage that is difficult to detect without explicit state audit.
- **Deployment pipeline neglect**: Memory-resident workers require graceful reload and cache invalidation strategies that differ fundamentally from FPM's process-per-request model — applying FPM deployment patterns causes service disruption.

---

## Anti-Pattern 1: Expecting Drop-In Replacement (No State Audit)

### Category
Migration

### Description
Migrating a Laravel application to Octane (memory-resident) without auditing service providers, static properties, singletons, and global state — assuming the application will work identically because no code changes were made.

### Why It Happens
- FPM's shared-nothing model hides state management issues because state is reset per request
- Developers are unaware that static properties persist across requests in memory-resident mode
- "It works in development" — because single-request testing doesn't reveal cross-request state leaks
- Documentation often emphasizes the performance gains, not the state audit requirements
- No tooling exists to automatically detect all state leaks

### Warning Signs
- User A sees User B's data after both make concurrent requests
- Cart contents, session data, or authentication state appears to "bleed" between requests
- Intermittent data corruption that cannot be reproduced in single-request testing
- Service providers that store per-request state in static properties
- Singletons that cache request-scoped data
- "It works on FPM but breaks on Octane" reports

### Why Harmful
State leaks in memory-resident architectures corrupt data across requests:
- A static property set during Request A is still present when Request B arrives
- User A's authentication context is visible to User B
- Singleton services built for per-request use (e.g., current user, request-scoped cache) retain stale state
- Data corruption is non-deterministic and extremely hard to diagnose
- Production incidents from cross-request contamination are among the hardest to debug

### Consequences
- Cross-request data leakage: User A sees User B's data (privacy violation)
- Hard-to-diagnose production bugs that are non-reproducible
- Emergency rollback to FPM after Octane migration
- Wasted days debugging state leaks
- Loss of team confidence in memory-resident architecture
- Privacy/compliance violations from cross-request data exposure

### Alternative
Before migrating, conduct a thorough state audit:
1. Audit all service providers for static property usage
2. Review all singletons for request-scoped cached data
3. Identify global variables and class-level static arrays
4. Check third-party packages for static state (use `composer why` to find)
5. Test with concurrent request patterns to reveal leaks
6. Use Octane's sandbox mode or scoped containers for safety
7. Replace static properties with request-scoped storage where needed

### Refactoring Strategy
1. Search codebase for `static::` and `self::` property access patterns
2. Review each static property: is it truly global (configuration) or request-scoped?
3. For request-scoped static state: move to request container or pass explicitly
4. For global state: ensure it's immutable after worker initialization
5. Test with concurrent requests (use k6 or custom script) to verify no leaks
6. Enable Octane and run the full test suite under concurrent load

### Detection Checklist
- [ ] All service providers audited for static property usage
- [ ] All singletons reviewed for request-scoped cached data
- [ ] Third-party packages audited for static state
- [ ] Concurrent request testing performed with no state leaks detected
- [ ] Octane's scoped container or sandbox mode considered for safety
- [ ] Rollback plan to FPM prepared before Octane deployment

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Memory-Resident Architecture
- 05-rules.md: Audit Static Properties Before Octane Migration
- 06-skills.md: Octane Migration State Audit
- 07-decision-trees.md: Octane Readiness Decision Tree
- S07-laravel-octane: State Management KU

---

## Anti-Pattern 2: Migrating Without Profiling Bootstrap Proportion

### Category
Methodology

### Description
Choosing to migrate to a memory-resident architecture (Octane, RoadRunner, FrankenPHP) without first profiling the application to determine what proportion of response time is spent on framework bootstrap — the key metric that determines whether gains will be significant.

### Why It Happens
- "Octane is faster" is assumed to apply uniformly to all applications
- No profiling tooling in place to measure bootstrap time
- Belief that eliminating bootstrap is always beneficial, regardless of proportion
- Marketing benchmarks showing 3-15x gains that may not apply to the specific workload
- Decision made at architecture level without data from the actual application

### Warning Signs
- Bootstrap proportion not measured before migration
- Application has slow endpoints (>500ms) dominated by database queries, not bootstrap
- Migration decision based on general Octane benchmarks, not application-specific data
- No before-and-after benchmark with realistic workload planned
- Team cannot answer "what percentage of our response time is bootstrap?"

### Why Harmful
Memory-resident architecture gains are proportional to bootstrap cost:
- If bootstrap is 10% of response time, max gain is ~11% (1/0.9 - 1) before overhead
- If bootstrap is 80% of response time, max gain is ~400% (1/0.2 - 1)
- Most slow endpoints (>500ms) are dominated by database queries, not bootstrap
- Migrating when bootstrap is <20% yields marginal gains for significant effort
- Deployment complexity, state audit, and operational overhead may not be justified

### Consequences
- Disappointing performance improvement (5-15% instead of expected 3-5x)
- Significant migration effort for marginal gain
- Increased operational complexity without commensurate benefit
- Team energy consumed by state leak debugging for little payoff
- Leader disappointment and loss of confidence in performance team
- Wasted infrastructure investment for new runtime

### Alternative
Profile before deciding:
1. Profile a representative request and measure framework bootstrap time
2. Calculate bootstrap percentage: bootstrap_time / total_response_time
3. Estimate max gain: 1 / (1 - bootstrap_percentage) - 1
4. If bootstrap > 20%, migration may be worthwhile (est. gain > 25%)
5. If bootstrap < 10%, migration is likely not justified (est. gain < 11%)
6. Compare estimated gain against migration effort and operational complexity

### Refactoring Strategy
1. Install a profiler (Blackfire, Tideways, SPX) and profile 5-10 representative endpoints
2. Measure time from request start to first application code (bootstrap), and total response time
3. Calculate bootstrap percentage for each endpoint
4. Estimate Octane gain for each endpoint category
5. Only proceed with migration if the weighted-average gain > 25%
6. If not justified, optimize within FPM first (OpCache, preloading, Composer optimization)

### Detection Checklist
- [ ] Bootstrap proportion measured for representative endpoints
- [ ] Migration decision based on application-specific profiling
- [ ] Estimated gain calculated from bootstrap proportion
- [ ] Minimum gain threshold defined (e.g., > 25% improvement)
- [ ] Slow endpoints analyzed separately (they may not benefit)
- [ ] Decision documented with profiling evidence

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Memory-Resident Architecture
- 05-rules.md: Profile Bootstrap Before Octane Migration
- 07-decision-trees.md: Octane Investment Decision Tree

---

## Anti-Pattern 3: No Worker Recycling (Memory Drift)

### Category
Operations

### Description
Running memory-resident workers indefinitely without recycling (max_requests setting), allowing worker RSS to grow unbounded through memory fragmentation, residual allocations, and slow leaks that accumulate over thousands of requests.

### Why It Happens
- FPM mindset: workers are recycled per-request, so memory drift doesn't accumulate
- Default Octane configuration may not set max_requests, or set it very high
- "Uptime" culture: longer worker lifetime seems better for performance
- Memory drift is gradual (bytes per request) and invisible until OOM
- No monitoring for per-worker RSS growth over time

### Warning Signs
- Worker RSS increases steadily over time (tracked per-worker)
- OOM killer activates after days or weeks of uptime
- Total system memory consumption increases without corresponding traffic increase
- Workers need to be restarted manually to recover memory
- Octane status shows increasing memory usage per worker with age
- No max_requests configured in Octane configuration

### Why Harmful
Memory drift is inevitable in long-running PHP processes:
- Each request allocates memory that may not be fully freed by GC
- Fragmentation increases over time as variable-sized allocations interleave
- Class definitions, string interning, and JIT buffers can grow over time
- Residual references in static properties prevent garbage collection
- Memory accumulates linearly with request count until OOM
- Without recycling, every worker eventually exhausts system memory

### Consequences
- Unbounded memory growth in each worker
- OOM kills during traffic spikes (when more workers are active)
- Production incidents requiring emergency worker restarts
- Cascading failures when one worker OOM kills adjacent processes
- Performance degrades as workers approach memory limits (GC overhead increases)
- Capacity planning impossible because memory consumption is unbounded

### Alternative
Always configure worker recycling:
- Set max_requests = 1000-5000 (adjust based on memory growth rate)
- Set max_requests = N where N is lower than the count that causes OOM
- Monitor per-worker RSS and set max_requests to recycle before 80% of memory ceiling
- Balance recycling frequency: too frequent defeats memory-resident benefit, too rare risks OOM
- Use Octane's built-in worker lifecycle hooks for graceful recycling

### Refactoring Strategy
1. Measure per-worker RSS growth rate (MB per 1000 requests)
2. Calculate time to reach 80% of available memory per worker
3. Set max_requests to recycle before the 80% threshold
4. Monitor RSS after recycling to confirm full recovery
5. Tune max_requests up/down based on monitoring data
6. Alert on worker RSS exceeding 70% of the configured ceiling

### Detection Checklist
- [ ] max_requests configured for worker recycling
- [ ] Worker RSS growth rate measured and tracked
- [ ] Recycling frequency balanced (not too fast, not too slow)
- [ ] Monitoring alerts on per-worker RSS approaching limits
- [ ] RSS recovery confirmed after recycling
- [ ] Documentation includes memory drift monitoring procedure

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Memory-Resident Architecture
- 05-rules.md: Always Configure Worker Recycling
- 07-decision-trees.md: Recycling Frequency Decision Tree
- S05-php-fpm-worker-management: pm.max-requests Tuning KU

---

## Anti-Pattern 4: Improper Connection Management

### Category
Configuration

### Description
Using per-request connection patterns (open → use → close) in memory-resident architectures, causing connection churn, exhausting connection pools, and missing the benefits of persistent connections in long-running workers.

### Why It Happens
- FPM's per-request lifecycle means connections are naturally created and destroyed per request
- No connection pooling configured for Octane workers
- Default PHP database drivers (PDO, mysqli) create new connections unless explicitly pooled
- Unawareness that Octane provides built-in connection pooling
- Existing code that manually opens and closes database connections each request

### Warning Signs
- Database connections spike to the same level as PHP-FPM (many short-lived connections)
- "Too many connections" database errors under load
- Connection establishment time appears as a significant portion of response time
- Redis connections timing out or being refused
- Manual PDO/mysqli connection creation in request lifecycle hooks
- Database server shows high connection rate but low active connection count

### Why Harmful
Poor connection management in memory-resident workers:
- Opening a database connection per request (even in a persistent worker) wastes 5-20ms
- Closing and reopening connections every request defeats the persistent worker advantage
- Without pooling, connection establishment time adds to every request's latency
- Database servers spend CPU on connection handling (accept, SSL, auth) instead of queries
- Connection limits are exhausted by connection churn, not active queries

### Consequences
- 5-20ms added to every request for connection establishment
- Database server CPU wasted on connection handling
- "Too many connections" errors during traffic spikes
- Redis timeout errors from connection pool exhaustion
- Persistent worker benefit partially nullified by per-request connection churn
- Infrastructure costs higher (need more DB capacity for connection handling)

### Alternative
Use connection pooling:
- Octane provides built-in database and Redis connection pooling for persistent workers
- Configure `octane.database.pool` and `octane.redis.pool` for connection reuse
- For non-Octane memory-resident runtimes, implement manual connection pooling
- Reuse connections across requests within the same worker
- Monitor pool utilization and tune pool size per worker
- Set connection idle timeout to recycle stale connections

### Refactoring Strategy
1. Review database connection handling in all request lifecycle code
2. Enable Octane's connection pooling by configuring pool sizes in octane config
3. Remove manual connection open/close code (pool handles lifecycle)
4. Set pool size to approximate max concurrent database operations per worker
5. Monitor pool hit rate and connection wait time
6. Tune pool sizes based on monitoring data

### Detection Checklist
- [ ] Connection pooling configured for all database drivers (MySQL, Postgres, Redis)
- [ ] Manual connection open/close code removed from request lifecycle
- [ ] Pool utilization monitored and tuned
- [ ] Connection establishment time reduced from before pooling
- [ ] Connection-related errors decreased under load
- [ ] Pool size configured per worker, not globally

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Memory-Resident Architecture
- 05-rules.md: Use Connection Pooling in Persistent Workers
- 07-decision-trees.md: Pool Sizing Decision Tree
- S07-laravel-octane: Connection Pooling KU

---

## Anti-Pattern 5: Expecting Gains on Slow Endpoints

### Category
Expectation Management

### Description
Expecting memory-resident architecture (Octane) to provide significant throughput improvements for slow endpoints (>500ms database queries), where dataset query dominates response time and bootstrap elimination provides marginal benefit.

### Why It Happens
- "Octane = faster" is treated as a universal truth, not workload-dependent
- No profiling to distinguish fast endpoints (bootstrap-dominated) from slow ones (query-dominated)
- All endpoints are migrated together without individual assessment
- Marketing focuses on the best-case benchmarks (sub-50ms API endpoints)
- Slow endpoint times are still reduced by a small absolute amount, but the gain percentage is low

### Warning Signs
- Application has endpoints with >500ms total response time
- Database query time accounts for >70% of total response time
- Profiling shows bootstrap is <10% of total response time
- Expected gains from Octane migration are quoted as "3-5x" but not based on application data
- Octane migration effort focused on slow, query-heavy endpoints
- Post-migration benchmarks show <10% improvement for slow endpoints

### Why Harmful
Memory-resident architecture benefits are inversely proportional to response time:
- Fast endpoints (<50ms): bootstrap is 60-80% of time → 3-15x potential gain
- Slow endpoints (>500ms): bootstrap is <10% of time → <10% potential gain
- Migration effort, state audit, and deployment complexity are the same for both
- Fixing slow queries (indexing, caching, query optimization) provides 10-100x gains
- Octane migration effort would be better spent on database optimization for slow endpoints

### Consequences
- Disappointing 5-10% improvement on slow endpoints after significant migration effort
- Team morale drops when high expectations are not met
- Effort misallocated: Octane migration when database optimization was the real need
- Slow endpoints remain slow even after migration (they were never bootstrap-bound)
- Management questions the value of the Octane investment

### Alternative
Segment endpoints by response time profile:
- Fast endpoints (<50ms, bootstrap-dominated): primary candidates for Octane migration
- Medium endpoints (50-200ms): evaluate individually based on bootstrap percentage
- Slow endpoints (>200ms, query-dominated): optimize database first, then evaluate Octane benefit
- For slow endpoints: invest in query optimization, indexing, caching, and read replicas
- Measure bootstrap percentage for each endpoint category before deciding

### Refactoring Strategy
1. Profile all major endpoint groups to classify as fast, medium, or slow
2. For fast endpoints: proceed with Octane migration for maximum gain
3. For slow endpoints: optimize database queries before considering Octane
4. After database optimization, re-profile slow endpoints — they may now be fast enough for Octane
5. Only migrate endpoint categories where bootstrap > 20% of response time
6. Report Octane gains separately per endpoint category

### Detection Checklist
- [ ] Endpoints segmented by response time profile
- [ ] Bootstrap percentage measured per endpoint category
- [ ] Fast endpoints prioritized for Octane migration
- [ ] Slow endpoints optimized for database before considering Octane
- [ ] Expected gains set per endpoint category, not uniformly
- [ ] Post-migration benchmarks reported per endpoint category
- [ ] Message: "Octane makes fast endpoints faster; slow endpoints need query fixes"

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Memory-Resident Architecture
- 05-rules.md: Segment Endpoints by Bootstrap Proportion
- 07-decision-trees.md: Octane Investment Decision Tree
