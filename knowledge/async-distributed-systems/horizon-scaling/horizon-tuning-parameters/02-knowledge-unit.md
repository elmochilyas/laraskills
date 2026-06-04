# Metadata
Domain: Async & Distributed Systems
Subdomain: Horizon Scaling & Monitoring
Knowledge Unit: `minProcesses`, `maxProcesses`, `balanceMaxShift`, `balanceCooldown`
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary
Four parameters control the aggression and envelope of Horizon's auto-balancing behavior. `minProcesses` and `maxProcesses` define the floor and ceiling of workers per queue. `balanceMaxShift` caps how many processes can be added or removed in a single balancing cycle. `balanceCooldown` sets the minimum seconds between balancing cycles. Together, these form the tuning knobs that prevent the balancer from over-reacting (oscillation) or under-reacting (starvation) to workload changes.

# Core Concepts
- **`minProcesses`**: Minimum worker processes per queue. Guarantees baseline capacity even when queue is empty.
- **`maxProcesses`**: Maximum worker processes per queue. Prevents unbounded scaling that could overwhelm downstream or exhaust server resources.
- **`balanceMaxShift`**: Maximum change in process count per cycle per queue. Dampens scaling aggression.
- **`balanceCooldown`**: Minimum time between balancing cycles. Prevents rapid rebalancing.

# Mental Models
- **Thermostat**: `minProcesses` = minimum temperature (always on). `maxProcesses` = maximum temperature (never exceed). `balanceMaxShift` = adjustment per cycle (can't change by 20 degrees at once). `balanceCooldown` = time between thermostat readings.
- **Car accelerator**: `minProcesses` = idle RPM. `maxProcesses` = redline. `balanceMaxShift` = how much you push the pedal per second. `balanceCooldown` = how often you adjust the pedal.

# Internal Mechanics
- On each balancing cycle (every `balanceCooldown` seconds):
  1. Compute target allocation for each queue (1 to N).
  2. For each queue, `newCount = clamp(target, minProcesses, maxProcesses)`.
  3. `delta = newCount - currentCount`. If `|delta| > balanceMaxShift`, clamp.
  4. Execute adds/kills up to `balanceMaxShift` per queue.
- `balanceCooldown` is measured from the START of one cycle to the start of the next. If the cycle takes 100ms and cooldown is 3s, cycles run every 3s.
- `minProcesses` workers are always running — they're never killed by the balancer.
- `maxProcesses` is a hard cap. Even if the balancer would allocate more, it's stopped at `maxProcesses`.

# Patterns
## Minimum Baseline with Burst Capacity
- **Purpose**: Guarantee minimum throughput but allow scaling during peaks.
- **Benefit**: No queue is ever completely starved; peaks are handled.
- **Tradeoff**: Baseline workers idle during low volume; memory overhead.

## Aggressive Scale-Out for Spike-Prone Queues
- **Purpose**: Use high `balanceMaxShift` to quickly add workers during traffic spikes.
- **Benefit**: Fast response to sudden load.
- **Tradeoff**: Risk of overshoot; system overhead from rapid process creation.

## Conservative Scaling for Stable Workloads
- **Purpose**: Use low `balanceMaxShift` and high `balanceCooldown`.
- **Benefit**: Minimal process churn; predictable resource usage.
- **Tradeoff**: Slow to respond to sudden load changes.

# Architectural Decisions
- **`minProcesses = 1` for most queues**: Zero minimum means a queue could be completely unprocessed if the balancer deprioritizes it. 1 guarantees at least some processing.
- **`maxProcesses` based on server RAM**: Each worker uses ~20-40MB. `maxProcesses = available_RAM / 40MB`.
- **`balanceMaxShift = 1-2` for production**: Higher values (5+) cause too much process churn.
- **`balanceCooldown = 3-5`**: Fast enough to respond to load changes, slow enough to prevent oscillation.
- **`minProcesses = maxProcesses` effectively disables balancing**: Static allocation, like `balance: false`.

# Tradeoffs
High `balanceMaxShift` (5+) | Fast scaling, responds quickly | High process churn; overshoot; wasted memory
Low `balanceMaxShift` (1) | Smooth scaling, minimal churn | Slow response; may not keep up with spikes
Short `balanceCooldown` (1s) | Frequent rebalancing, responsive | CPU overhead; oscillation risk
Long `balanceCooldown` (10s) | Stable, low overhead | Slow to respond; backlog builds during cooldown

# Performance Considerations
- Each worker spawn adds ~50-100ms and ~20-40MB memory. Spawning 10 workers in one cycle = 200-400ms + 200-400MB.
- Each worker kill via SIGTERM is graceful — worker finishes current job (up to `timeout`) then exits. Kill latency depends on job length.
- `balanceMaxShift` of N means worst-case N processes added/killed per cycle per queue. For 5 queues, that's up to 5N processes per cycle.
- Memory overhead of idle workers (at `minProcesses`) is constant — budget for it.

# Production Considerations
- Monitor process count per supervisor to verify tuning. A supervisor hitting `maxProcesses` frequently may need higher cap or more supervisors.
- Watch for oscillation: process count graph showing sawtooth pattern (up, down, up, down). Increase `balanceCooldown` or decrease `balanceMaxShift`.
- `maxProcesses * queue_count * servers` = maximum system-wide workers. Ensure the system can handle this many processes.
- Setting `minProcesses` too high wastes memory during low volume. Monitor idle worker ratio.
- Process creation/destruction logging appears in Horizon dashboard logs. Check for excessive scaling events.

# Common Mistakes
- **Setting `minProcesses = 0`**: The queue may get zero workers allocated during balancing, effectively stopping processing until the next cycle.
- **Setting `maxProcesses` too low relative to load**: Queue backlog persists. The cap prevents scaling to meet demand.
- **Setting `balanceMaxShift` equal to `maxProcesses`**: Single balancing cycle can go from 0 to max. Extremely aggressive.
- **Not tuning per workload**: Webhooks (bursty) and emails (steady) should have different tuning parameters.
- **Ignoring `balanceCooldown` for auto balance**: Without cooldown (or 0), Horizon rebalances continuously, creating CPU churn and process oscillation.

# Failure Modes
- **Overshoot on scale-up**: High `balanceMaxShift` adds 10 workers. Load drops 10 seconds later. 10 workers are now idle, consuming memory.
- **Under-allocation during cooldown**: Queue spikes immediately after a balancing cycle. The next cycle is `balanceCooldown` seconds away. During that gap, the queue builds backlog.
- **`minProcesses` death spiral**: If a queue's jobs consistently fail and the process keeps retrying, `minProcesses` guarantee means those failed jobs keep consuming resources.
- **Balancer interference with supervisor restart**: `horizon:terminate` followed by `horizon:start` resets all counters. The balancer starts from `minProcesses` and scales up.

# Ecosystem Usage
- **Laravel Horizon**: All four parameters are part of the supervisor config in `config/horizon.php`.
- **Laravel Forge**: Forge Horizon UI exposes these parameters as advanced tuning options.
- **Spatie packages**: Not directly affected, but package users who run high-volume queues should tune these parameters.

# Related Knowledge Units
- K041 Horizon Supervisor Configuration | K042 Auto Balancing with `time` Strategy | K043 Simple and No Balancing Modes

## Research Notes
- Horizon's auto-balancing mode uses a scoring algorithm that reassigns worker processes between queues every few seconds — the scoring considers queue backlog depth and processing time to determine worker allocation.
- The alance:auto strategy in Horizon implements a "min/max" approach where each supervisor has a configured minProcesses and maxProcesses — the balancer adjusts within this range based on load.
- Horizon v5 (Laravel 11+) improved Redis cluster support by abstracting queue connections through a consistent hashing layer — jobs are distributed across cluster nodes based on job ID hash.
- The Horizon dashboard authorization gate can be customized via Horizon::auth() — exposing the dashboard without authentication in production is a common security gap.
- Horizon metrics (throughput, runtime, wait time) are stored in Redis with a retention period configured via 	rim — long retention can consume significant Redis memory in high-throughput environments.
- The horizon:snapshot command generates a work-in-progress report of all supervisors, processes, and queue metrics — useful for debugging queue backlogs during incidents.
- Silenced job tags in Horizon prevent specific job types from appearing in the "Completed Jobs" and "Failed Jobs" lists — this is a display-only filter that does not affect job processing or logging.
- Horizon's queue:monitor integration was added in Laravel 12 — it provides a Pulse integration for queue health dashboards beyond Horizon's own UI.
