# Skill: Configure Octane Workers by Driver for Optimal Throughput

## Purpose
Configure worker count, max_requests, and driver-specific settings (task workers, thread pools, supervisor limits) for RoadRunner, Swoole, and FrankenPHP drivers — tuned to workload profile, memory budget, and database connection pool limits.

## When To Use
- Deploying Octane to production for the first time
- Tuning worker configuration based on monitoring data (listen queue, RSS, connection utilization)
- Switching between Octane drivers (new driver may need different worker configuration)
- After infrastructure changes (more RAM, more CPU cores, larger database connection pool)
- When troubleshooting worker-related performance issues (slow response, listen queue growing)

## When NOT To Use
- For single-worker development environments (defaults are fine)
- Without first monitoring listen queue and RSS (tuning without data is guessing)
- When the bottleneck is clearly database queries or external API latency, not worker count
- For FrankenPHP without understanding the thread-vs-worker distinction

## Prerequisites
- Octane installed and configured with chosen driver (RoadRunner, Swoole, or FrankenPHP)
- Server specifications: CPU core count, total RAM, database max_connections
- Workload profile classification: CPU-bound or I/O-bound
- Monitoring infrastructure for listen queue depth, per-worker RSS, and database connection utilization
- Baseline metrics from the current worker configuration

## Inputs
- Octane driver (RoadRunner, Swoole, or FrankenPHP)
- CPU core count and total server RAM
- Database max_connections and current connection utilization
- Workload profile (CPU-bound: >50% CPU time; I/O-bound: >50% I/O wait time)
- Current listen queue depth (average and peak)
- Current per-worker RSS (idle and under load)
- max_requests current value and RSS growth rate per 100 requests

## Workflow

### 1. Determine Workload Profile
- Measure CPU vs I/O wait time using server monitoring tools
- If CPU utilization > 50% under load: CPU-bound workload
- If I/O wait > 50% under load: I/O-bound workload
- If mixed: classify based on the dominant characteristic
- CPU-bound: worker count = CPU cores (no benefit from more)
- I/O-bound: worker count = CPU cores × 1.5-2.0 (workers wait on I/O, CPU can serve others)

### 2. Calculate Worker Count
- **RoadRunner**: `num_workers = CPU_cores × workload_factor`
  - CPU-bound: workload_factor = 1.0 → num_workers = CPU_cores
  - I/O-bound: workload_factor = 1.5-2.0 → num_workers = CPU_cores × 2
  - Constrain by memory: `num_workers × 50MB (avg RSS) ≤ RAM × 0.7`
  - Constrain by connections: `num_workers × connections_per_worker ≤ database_max_connections × 0.8`
- **Swoole**: `worker_num = CPU_cores` (coroutines handle concurrency within each worker)
  - Swoole coroutines share a worker — each worker handles many concurrent requests
  - Set `task_worker_num = CPU_cores / 2` for background task processing
  - Constrain by memory and connections (same formula as RoadRunner)
- **FrankenPHP**: `num_threads = CPU_cores` (threads, not processes)
  - `max_threads = CPU_cores × 1.5-2.0` for I/O-bound workloads
  - Threads share memory — per-thread overhead is lower (~10-20MB)
  - Never set num_threads > CPU_cores × 3 (thread contention degrades performance)

### 3. Start with Conservative Values and Monitor
- Begin with calculated worker count or 4 (whichever is lower) as safe starting point
- Run for 24-48 hours under production traffic
- Monitor: listen queue depth (primary signal), per-worker RSS, database connection utilization
- If listen queue is consistently 0: workers are sufficient — may be able to reduce to save memory
- If listen queue is growing: insufficient workers — increase by 25-50%
- If RSS > 80% of memory budget: too many workers — reduce by 25%

### 4. Configure max_requests
- Set initial value: 1000 (safe default for most applications)
- Monitor RSS growth per 100 requests:
  - RSS growth < 5% per 1000 requests: stable — increase max_requests to 5000
  - RSS growth 5-20% per 1000 requests: moderate — keep at 1000
  - RSS growth > 20% per 1000 requests: leak detected — lower to 300-500 and investigate
- Never set max_requests to 0 (unbounded growth guaranteed)
- For RoadRunner: `max_jobs` in `.rr.yaml`
- For Swoole: `max_request` in config/octane.php
- For FrankenPHP: worker recycling configured via Caddyfile (max_requests not directly available — use `max_wait_time` or implement custom health check)

### 5. Configure Driver-Specific Settings

**RoadRunner**:
- `.rr.yaml` `http.pool.supervisor.max_workers`: set to num_workers × 2 (allows one replacement while worker is recycling)
- `.rr.yaml` `http.pool.supervisor.watch_ticks`: 10 (checks worker health every 10 seconds)
- `.rr.yaml` `http.pool.max_jobs`: same as max_requests
- RPC: `tcp://127.0.0.1:6001` for management commands

**Swoole**:
- `task_worker_num`: CPU_cores / 2 for background tasks
- `max_coroutine`: 100000 (default is usually sufficient)
- `buffer_output_size`: 4MB (increase if serving large responses)
- `package_max_length`: 2MB (increase if handling large uploads)

**FrankenPHP**:
- Caddyfile `worker.num_threads`: CPU cores
- Caddyfile `worker.max_threads`: CPU cores × 1.5-2.0 for I/O-bound
- Caddyfile `worker.max_wait_time`: 30s (timeout for thread to become available)
- Understand: threads are NOT workers — they share memory and OpCache within a single PHP process

### 6. Validate Configuration
- Start Octane with the configured worker settings
- Verify worker count: `php artisan octane:status` should show expected number
- Run load test: confirm listen queue stays at zero under peak expected traffic
- Verify database connections: total connections ≤ max_connections × 0.8
- Verify RSS: total worker RSS ≤ server RAM × 0.7
- Run graceful reload test: `php artisan octane:reload` — confirm workers restart correctly

### 7. Document and Create Runbook
- Record final worker configuration per driver
- Document the rationale for each setting (workload profile, monitoring data, constraints)
- Create runbook entries: how to check worker count, how to adjust, what metrics to monitor
- Document the relationship between worker count, database connections, and memory budget

## Validation Checklist
- [ ] Workload profile classified as CPU-bound or I/O-bound
- [ ] Worker count calculated based on CPU cores, workload factor, memory, and connections
- [ ] Worker count conservative starting value set (4 or calculated, whichever is lower)
- [ ] max_requests set (1000 default, tuned based on RSS monitoring)
- [ ] Never set max_requests to 0
- [ ] Driver-specific settings configured (RoadRunner supervisor, Swoole task workers, FrankenPHP threads)
- [ ] Listen queue monitored and worker count adjusted accordingly
- [ ] Total persistent connections within database max_connections × 0.8
- [ ] Total worker RSS within server RAM × 0.7
- [ ] `php artisan octane:status` reports expected worker count
- [ ] Graceful reload (`octane:reload`) works correctly
- [ ] Worker configuration documented in runbook

## Common Failures

| Failure | Symptom | Root Cause | Mitigation |
|---------|---------|------------|------------|
| Listen queue growing | Requests queue up, latency increases | Not enough workers for I/O-bound workload | Increase worker count by 50% |
| Database connection exhaustion | Connection refused errors | Too many workers × connections | Reduce worker count or increase max_connections |
| High context switching | CPU at 100%, throughput low | Too many workers for CPU-bound workload | Reduce worker count to CPU cores |
| Workers OOM after hours | RSS exceeds budget | Too many workers for available RAM | Reduce worker count, increase max_requests recycling |
| FrankenPHP thread contention | Throughput drops with more threads | Thread count exceeds CPU cores × 2 | Reduce num_threads to CPU cores, max_threads to 1.5× |
| Swoole coroutine exhaustion | Requests hang or fail | max_coroutine too low for concurrent requests | Increase max_coroutine, verify coroutine-safe code |

## Decision Points

| Decision | How To Decide |
|----------|---------------|
| CPU-bound vs I/O-bound factor | CPU-bound: factor 1.0. I/O-bound: factor 1.5-2.0. Mixed: start at 1.5, tune based on listen queue |
| Increase workers vs increase max_requests | Increase workers if listen queue growing. Increase max_requests if RSS stable and fewer recycles desired |
| Swoole vs RoadRunner worker count | Swoole uses CPU_cores (coroutines handle concurrency). RoadRunner uses CPU_cores × workload_factor |
| FrankenPHP threads vs other drivers | Threads share memory (lower per-unit cost) but weaker isolation. Not directly comparable to worker count |
| max_requests value | Start at 1000. Lower if RSS grows >20% per 1000 requests. Raise to 5000 if RSS grows <5% per 1000 requests |

## Performance Considerations
- Each worker adds 30-80MB RSS — total must fit in RAM with 30% headroom for OS and services
- Each worker adds persistent database connections — total must fit within 80% of max_connections
- I/O-bound workloads benefit from more workers (workers block on I/O, CPU can serve others)
- CPU-bound workloads gain nothing from more workers than cores (context switching overhead)
- Swoole coroutines reduce per-worker memory by handling many requests in one process
- FrankenPHP threads share memory — per-thread overhead is lower but isolation is weaker
- Setting max_requests too low adds unnecessary bootstrap overhead — calibrate based on RSS data

## Security Considerations
- More workers = more database connections with the same credentials — ensure the database user has minimal privileges
- FrankenPHP threads share memory — a thread crash can affect all threads in the same process
- RoadRunner process isolation provides the strongest security boundary per worker
- When max_requests recycling happens, ensure the new worker initializes with clean state
- Database connection pooling must not share transaction state between requests (Octane handles this)

## Related Rules

| Rule | File | Application |
|------|------|-------------|
| Start worker count at CPU core count, increase 50-100% for I/O-bound | `05-rules.md:1` | Step 2: worker count calculation |
| Set max_requests to 1000-5000 and calibrate based on RSS growth | `05-rules.md:27` | Step 4: max_requests tuning |
| Monitor listen queue to validate worker count | `05-rules.md:53` | Step 3: listen queue monitoring |
| Account for FrankenPHP thread nuances | `05-rules.md:79` | Step 5: FrankenPHP thread configuration |
| Never set max_requests to 0 in any Octane driver | `05-rules.md:108` | Step 4: mandatory max_requests |

## Related Skills

| Skill | Relation |
|-------|----------|
| Select the Optimal Octane Driver | Driver selection determines which worker configuration approach to use |
| Install and Configure Octane for a Laravel Project | Prerequisite — Octane must be installed before worker tuning |
| Manage and Prevent Octane State Leaks | RSS monitoring for state leaks overlaps with worker tuning |
| Calculate Connection Budget for Octane Workers | Connection budget calculation constrains max worker count |
| Perform FPM-to-Octane Migration | Production worker configuration is finalized during migration Phase 5 |

## Success Criteria
- Worker count correctly calculated based on workload profile, memory budget, and connection limits
- max_requests calibrated based on observed RSS growth with data-driven rationale
- Driver-specific settings (task workers, supervisor, threads) correctly configured
- Listen queue consistently 0 under peak expected traffic
- Database connections within 80% of max_connections
- Total worker RSS within 70% of server RAM
- Graceful reload works correctly with expected worker count
- Configuration documented in runbook with tuning rationale
