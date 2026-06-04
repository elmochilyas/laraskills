# Metadata
Domain: Async & Distributed Systems
Subdomain: Horizon Scaling & Monitoring
Knowledge Unit: Auto Balancing with `time` Strategy
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary
Horizon's `auto` balancing strategy with the `time` scaling algorithm dynamically allocates worker processes to queues based on queue wait time (estimated time to clear all current jobs), not queue depth. This prevents starvation of fast queues by ensuring workers are shifted to queues with the highest processing urgency. The algorithm calculates a "wait time score" for each queue and redistributes processes proportionally. The `balanceMaxShift` and `balanceCooldown` parameters control aggression and oscillation damping.

# Core Concepts
- **`auto` balancing**: Horizon adjusts worker process counts per queue within `minProcesses`/`maxProcesses` bounds.
- **`autoScalingStrategy`**: `time` (default) — scales by estimated time to clear queue. `size` — scales by number of jobs in queue.
- **Wait time calculation**: `estimated_clear_time = queue_size × average_processing_time_per_job`. Metric derived from recent job completions.
- **Process allocation**: Each balancing cycle re-computes the optimal distribution and spawns/kills processes.
- **`balanceMaxShift`**: Maximum number of processes to add or remove per balancing cycle. Prevents oscillation.
- **`balanceCooldown`**: Seconds between balancing cycles. Prevents rapid rebalancing that wastes resources on startups/teardowns.

# Mental Models
- **Traffic light system**: The balancing algorithm is a traffic controller. It measures traffic density (wait time) at each intersection (queue) and adjusts green-light time (worker processes) proportionally. Busy intersections get more time.
- **Hiring temporary workers**: A warehouse has different sections (queues). The manager measures how many hours of work are piled up (wait time) vs picking rate (throughput). Temporary workers are assigned to sections with the most hours of pending work.

# Internal Mechanics
- `AutoScaler` class in Horizon's source reads supervisor config.
- On each balancing cycle (every `balanceCooldown` seconds), `AutoScaler::balance()` executes:
  1. For each queue, compute `waitTime` = estimated seconds to clear.
  2. Calculate total wait time across all queues.
  3. Allocate processes proportionally: `allocated = maxProcesses × (queue_wait_time / total_wait_time)`.
  4. Clamp to `minProcesses` ≤ allocated ≤ `maxProcesses`.
  5. Cap change per cycle at `balanceMaxShift` processes.
  6. Determine add/kill list and execute.
- Workers are added by spawning new processes. Workers are removed by sending SIGTERM to excess workers (they finish current job and exit).
- The `time` strategy uses a rolling average of job execution time (from the metrics store) to estimate wait.
- Metrics for wait time are stored in Redis via the `AutoScaler`'s own tracking.

# Patterns
## Aggressive Scaling for Bursty Workloads
- **Purpose**: Handle rapid queue growth for time-sensitive jobs.
- **Benefit**: Fast response to traffic spikes.
- **Tradeoff**: More process churn; potential overshoot and waste.

## Conservative Scaling for Stable Workloads
- **Purpose**: Minimize process churn and memory usage.
- **Benefit**: Stable worker pool; predictable resource usage.
- **Tradeoff**: Slower response to sudden spikes.

## Queue-Specific Cooldown Tuning
- **Purpose**: Different cooldown per supervisor based on job volatility.
- **Benefit**: Fast-scaling for spike-prone queues; stable for steady queues.
- **Tradeoff**: More configuration to maintain.

# Architectural Decisions
- **Always use `time` strategy over `size`**: `time` accounts for job duration, not just count. A queue with 10 long-running jobs (10 min each) has higher wait time than 10 fast jobs (1 sec each). `size` treats them equally.
- **Set `balanceMaxShift` to 1-2 for most workloads**: Higher values allow faster scaling but risk overshoot.
- **Set `balanceCooldown` to 3-5 seconds**: Frequent rebalancing (1s) is CPU-intensive. Infrequent (10s+) responds slowly.
- **`time` + `maxProcesses` cap**: Always set `maxProcesses` to prevent unbounded scaling that could overwhelm downstream systems.

# Tradeoffs
`time` strategy | Accounts for job duration, prevents starvation | Requires average runtime metric; slower to converge
`size` strategy | Simple (just job count), converges fast | Ignores job duration; misallocates for variable-duration jobs
High `balanceMaxShift` (5+) | Fast scaling, quick response | Process churn; overshoot risk; wasted startup/teardown

# Performance Considerations
- Each balancing cycle reads metrics from Redis and computes allocation. CPU cost: negligible (sub-millisecond).
- Process spawning is expensive (~50-100ms + memory allocation for new PHP process). Frequent spawning (every cycle) is wasteful.
- Worker process memory isn't released until the process dies. Rapid scaling up and down causes memory fragmentation.
- The `time` strategy relies on accurate average runtime data. Chilly start (no metrics yet) may misallocate.

# Production Considerations
- Monitor balancing cycles in Horizon dashboard logs. Verify that process allocation matches expected distribution.
- When `maxProcesses` is hit frequently, the queue needs either higher max or more supervisor capacity.
- `balanceCooldown` impacts how quickly Horizon responds to changes. A spike in queue depth is not addressed until the next balancing cycle.
- The `auto` balancer distributes processes among the supervisor's configured queues. It does NOT distribute across supervisors.
- On multi-server Horizon, each server runs its own balancer independently. Total capacity is per-server, not globally balanced.

# Common Mistakes
- **Using `size` instead of `time`**: Job count alone is misleading. A queue with 100 quick jobs (100ms each) looks busier than one with 2 slow jobs (30s each) by count, but the slow queue has higher total wait time.
- **Setting `balanceCooldown` too low (1)**: Excessive rebalancing — Horizon spends more time scaling than processing jobs.
- **Setting `balanceMaxShift` to `maxProcesses`**: Allows Horizon to go from 1 to 10 processes in one cycle. Usually too aggressive.
- **Expecting the balancer to handle all scenarios**: The auto balancer responds to current queue state, not predicted load. It cannot pre-emptively scale before a known traffic spike.

# Failure Modes
- **Balancing oscillation**: Workers repeatedly added/removed due to tight cooldown + high shift. Destabilizes worker pool.
- **Starvation of short-job queue**: If `time` strategy consistently favors a queue with very long jobs, short-job queues may starve even though they have many time-sensitive items.
- **Balancer inertia during crisis**: If a queue stops processing entirely (downstream system down), wait time for that queue increases, attracting MORE workers — exactly when you want fewer.
- **Cold start misallocation**: No average runtime data → balancer uses defaults → poor initial allocation until metrics accumulate.

# Ecosystem Usage
- **Laravel Horizon**: The auto balancer is implemented in `Horizon\AutoScaler`. Strategy is selected via `autoScalingStrategy`.
- **Laravel Forge**: Forge's Horizon configuration exposes `balance` and `autoScalingStrategy` options.
- **Spatie packages**: Not directly related, but Horizon balancing affects how quickly Spatie webhook jobs are processed.

# Related Knowledge Units
- K041 Horizon Supervisor Configuration (context) | K043 Simple and No Balancing Modes (alternatives) | K044 Horizon Tuning Parameters

## Research Notes
- Horizon's auto-balancing mode uses a scoring algorithm that reassigns worker processes between queues every few seconds — the scoring considers queue backlog depth and processing time to determine worker allocation.
- The alance:auto strategy in Horizon implements a "min/max" approach where each supervisor has a configured minProcesses and maxProcesses — the balancer adjusts within this range based on load.
- Horizon v5 (Laravel 11+) improved Redis cluster support by abstracting queue connections through a consistent hashing layer — jobs are distributed across cluster nodes based on job ID hash.
- The Horizon dashboard authorization gate can be customized via Horizon::auth() — exposing the dashboard without authentication in production is a common security gap.
- Horizon metrics (throughput, runtime, wait time) are stored in Redis with a retention period configured via 	rim — long retention can consume significant Redis memory in high-throughput environments.
- The horizon:snapshot command generates a work-in-progress report of all supervisors, processes, and queue metrics — useful for debugging queue backlogs during incidents.
- Silenced job tags in Horizon prevent specific job types from appearing in the "Completed Jobs" and "Failed Jobs" lists — this is a display-only filter that does not affect job processing or logging.
- Horizon's queue:monitor integration was added in Laravel 12 — it provides a Pulse integration for queue health dashboards beyond Horizon's own UI.
