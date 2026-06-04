# Skill: Estimate Octane Performance Gain Using Bootstrap Proportion Methodology

## Purpose
Calculate the maximum theoretical throughput gain from migrating a Laravel application to Octane by measuring the bootstrap proportion of request time, applying Amdahl's Law, and accounting for resource constraints — producing a realistic gain estimate for migration decision-making.

## When To Use
- Evaluating whether to migrate a Laravel application from PHP-FPM to Octane
- Building a business case with projected throughput improvements
- Setting performance targets for Octane migration
- Comparing expected vs actual gains after migration
- Deciding whether Octane is worth the migration investment for a specific application

## When NOT To Use
- When the decision to migrate to Octane has already been made (move directly to migration)
- When the application has known Octane-incompatible packages that block migration
- When database queries dominate >80% of request time (optimize queries first)
- As a substitute for actual post-migration benchmarking (always measure after migration)

## Prerequisites
- PHP-FPM application running in a production-representative environment
- Access to application profiling tools (Laravel Debugbar, Clockwork, Xdebug, or Blackfire)
- Ability to create a minimal endpoint with no business logic for bootstrap measurement
- Understanding of Amdahl's Law and its application to throughput estimation
- Basic knowledge of the application's request profile (average response time, I/O characteristics)

## Inputs
- Baseline PHP-FPM performance metrics (RPS, p95 latency, average response time)
- Application's typical request profile (API-heavy, mixed, UI-heavy)
- Average response times for the most frequently used endpoints
- Server specifications (CPU cores, RAM, database connection pool limits)
- Worker memory budget estimate (30-80MB RSS per worker)

## Workflow

### 1. Profile Bootstrap Time with an Empty Endpoint
- Create a minimal route or controller that performs no business logic (return a 200 response immediately)
- Ensure all middleware that applies to real endpoints also applies to this endpoint (auth, session, CSRF)
- Profile this endpoint under FPM using Laravel Debugbar or a profiling tool
- Record the total response time — this is the bootstrap cost (service container construction, provider registration, route loading, middleware stack initialization)
- Example command: `curl -w "%{time_total}" http://fpm-app.dev/empty-endpoint`
- Run 10+ samples and take the median to account for variance

### 2. Profile a Production-Representative Endpoint
- Select your most frequently requested endpoint that exercises real business logic
- This must include database queries, API calls, view rendering — the full request lifecycle
- Profile this endpoint under FPM with the same profiling tool
- Record the total response time
- Run 10+ samples and take the median
- Compare against the bootstrap time from Step 1

### 3. Calculate Bootstrap Proportion
- Compute: `bootstrap_proportion = bootstrap_time / real_endpoint_time`
- Examples:
  - Empty endpoint: 40ms, Real endpoint: 50ms → `40/50 = 0.80` (80%)
  - Empty endpoint: 40ms, Real endpoint: 500ms → `40/500 = 0.08` (8%)
- If bootstrap proportion > 0.5 (50%): Octane will provide substantial gain (3-20×)
- If bootstrap proportion < 0.2 (20%): Octane will provide modest gain (<1.5×) — consider optimizing I/O first

### 4. Apply Amdahl's Law for Theoretical Speedup
- Compute: `theoretical_speedup = 1 / (1 - bootstrap_proportion)`
- Examples:
  - 80% bootstrap: `1/(1-0.8) = 5×` theoretical maximum
  - 50% bootstrap: `1/(1-0.5) = 2×`
  - 20% bootstrap: `1/(1-0.2) = 1.25×`
  - 8% bootstrap: `1/(1-0.08) = 1.09×`
- This is the per-worker throughput multiplier, not the total system gain

### 5. Account for Resource Constraints
- Calculate how many Octane workers your server can support:
  - Per-worker RSS: estimate 30-80MB (measure from similar Octane deployments or use 50MB as midpoint)
  - Total memory budget: available server RAM minus OS and service overhead (2GB for OS+DB+Redis typical)
  - Max workers from memory: `(total_RAM - overhead) / per_worker_RSS`
  - Max workers from connections: `database_max_connections / connections_per_worker`
  - Effective max workers: `min(workers_from_memory, workers_from_connections, CPU_cores)`
- Compare to current FPM worker capacity:
  - FPM also has per-process memory overhead, typically lower because processes are short-lived
  - If Octane workers < FPM workers, apply the worker ratio: `effective_gain = speedup × (octane_workers / fpm_workers)`

### 6. Estimate Gain Under Concurrent Load
- Single-request gain underestimates Octane's benefit
- Under concurrent load, Octane benefits from persistent worker reuse and connection pooling
- Apply a concurrency multiplier: for API-heavy workloads, multiply single-request gain by 2-3× for concurrent estimate
- Example: 5× single-request gain × 2× concurrency multiplier ≈ 10× under concurrent load
- Validate concurrency multiplier with published benchmarks for your workload type

### 7. Document the Gain Estimate
- Record: bootstrap time, real endpoint time, bootstrap proportion, theoretical speedup, resource-constrained gain, concurrent load estimate
- Categorize the estimate: `[High Gain]` (3×+), `[Moderate Gain]` (1.5-3×), `[Low Gain]` (<1.5×)
- Include the decision recommendation:
  - High Gain: strong candidate for migration
  - Moderate Gain: migrate if operational benefits (health checks, graceful reload) also valued
  - Low Gain: optimize I/O first, then re-evaluate; or skip Octane

### 8. Validate Post-Migration Against Estimate
- After migration, benchmark the same endpoints under Octane
- Compare actual gain to estimated gain
- Report variance: `variance = (actual_gain - estimated_gain) / estimated_gain × 100%`
- Feed variance back into estimation methodology for future accuracy
- If actual gain is significantly lower than estimate, investigate: worker count constraints, connection pool limits, memory pressure

## Validation Checklist
- [ ] Bootstrap time measured from empty endpoint (10+ samples, median)
- [ ] Production-representative endpoint measured (10+ samples, median)
- [ ] Bootstrap proportion calculated correctly
- [ ] Amdahl's Law applied: `1 / (1 - bootstrap_proportion)`
- [ ] Resource constraints accounted: memory, connections, CPU
- [ ] Concurrent load multiplier applied for realistic estimate
- [ ] Gain categorized as High/Moderate/Low with recommendation
- [ ] Pre-migration PHP-FPM benchmark completed for post-migration comparison
- [ ] Post-migration actual gain measured and variance calculated
- [ ] Estimation methodology refined based on actual vs estimated variance

## Common Failures

| Failure | Symptom | Root Cause | Mitigation |
|---------|---------|------------|------------|
| Overestimated gain | Actual gain 1.5× vs estimated 5× | Used hello-world endpoint instead of realistic endpoint | Always use production-representative endpoints for estimation |
| Underestimated gain | Actual gain 8× vs estimated 2× | Ignored concurrent load benefit | Apply concurrency multiplier for concurrent load estimate |
| Resource constraint surprise | Cannot fit enough workers | Ignored per-worker RSS and connection overhead | Always account for resource constraints in estimate |
| Wrong workload categorization | API estimated as mixed workload | Misclassifying application profile | Profile endpoint distribution to determine workload type |
| Post-migration gain lower | Octane slower than expected | Memory pressure from too many workers | Benchmark with correct worker count based on resource budget |

## Decision Points

| Decision | How To Decide |
|----------|---------------|
| Migrate to Octane vs optimize I/O first | Migrate if bootstrap proportion >30% AND gain >2×. Optimize I/O first if bootstrap proportion <20% |
| Include concurrency multiplier | Include for throughput-focused applications; exclude for latency-sensitive applications |
| Trust theoretical vs resource-constrained estimate | Use resource-constrained estimate for capacity planning; use theoretical for understanding maximum potential |
| Use empty vs realistic endpoint | Always use realistic endpoint for estimation; empty endpoint shows theoretical maximum only |

## Performance Considerations
- Octane eliminates bootstrap time only — I/O (database, API) takes the same time as FPM
- Fast endpoints (<50ms) with 60-80% bootstrap see 5-15× gains — these are the best Octane candidates
- Slow endpoints (500ms+) with <10% bootstrap see 10-20% gains — optimize I/O before considering Octane
- Each worker uses 30-80MB RSS — fewer workers may fit than FPM pools; account for this
- Under Octane, database queries become the primary bottleneck — query optimization becomes more important
- OpCache preloading adds 2-5ms reduction to cold-start latency, improving the gain further

## Security Considerations
- Higher throughput means more requests hitting the database per second — ensure connection pool limits are respected
- Gain estimation does not account for security boundary differences between FPM (process isolation) and Octane (shared worker)
- If estimate shows high gain, ensure the application's security posture is compatible with Octane before migrating
- Resource-constrained worker count must not compromise connection pool isolation between application tiers

## Related Rules

| Rule | File | Application |
|------|------|-------------|
| Estimate Octane gain using bootstrap proportion formula before migrating | `05-rules.md:1` | Steps 1-4: measurement and calculation |
| Never estimate gain using hello-world endpoints | `05-rules.md:27` | Step 2: use production-representative endpoints |
| Benchmark under concurrent load, not single-request latency | `05-rules.md:52` | Steps 6, 8: concurrent load benefit |
| Account for worker overhead when estimating total system capacity | `05-rules.md:77` | Step 5: resource constraint accounting |

## Related Skills

| Skill | Relation |
|-------|----------|
| Perform FPM-to-Octane Migration | Follows this skill — migration decision is based on gain estimate |
| Audit and Adapt Application for Octane's Persistent Execution Model | Prerequisite work that affects migration cost estimation |
| Select the Optimal Octane Driver | Driver selection affects achievable throughput (Swoole may add coroutine benefit) |
| Configure Octane Workers by Driver | Worker count configuration affects resource-constrained gain |

## Success Criteria
- Bootstrap proportion measured with statistical confidence (10+ samples, median reported)
- Theoretical speedup calculated correctly using Amdahl's Law
- Resource constraints (memory, connections, CPU) factored into final estimate
- Gain categorized and documented with clear migration recommendation
- Post-migration actual gain measured and compared to estimate with variance <30%
- Estimation methodology refined based on post-migration validation
- Team has data-driven basis for migration decision (migrate, defer, or skip)
