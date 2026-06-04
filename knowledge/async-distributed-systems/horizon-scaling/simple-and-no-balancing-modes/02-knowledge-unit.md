# Metadata
Domain: Async & Distributed Systems
Subdomain: Horizon Scaling & Monitoring
Knowledge Unit: Simple Balancing and No Balancing Modes
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Beyond `auto` balancing, Horizon offers `simple` and `false` balancing modes. **`simple`** distributes workers evenly across all configured queues (round-robin). **`false`** (no balancing) runs a fixed number of processes per queue, defined by the `processes` setting. `simple` is useful when all queues should get equal attention regardless of depth. `false` is for fixed-capacity workloads where each queue has a dedicated, non-negotiable allocation.

# Core Concepts
- **`simple` balancing**: Workers are evenly distributed among queues. If a supervisor has `minProcesses=4` and 2 queues, each queue gets 2 workers.
- **`false` balancing**: No dynamic scaling. The `processes` setting determines exact worker count per supervisor, shared equally among queues.
- **Fixed vs dynamic**: `simple` still scales total processes within `minProcesses`/`maxProcesses`. `false` is static.
- **`processes`**: Required with `balance: false`. Sets total number of worker processes for that supervisor.
- **Use case**: `simple` for equal-priority queues. `false` for queues with guaranteed throughput requirements.

# Mental Models
- **Round-robin vs dedicated lane**: `simple` = grocery store with N checkout lanes that open/close dynamically but serve all shoppers equally. `false` = dedicated express lane that's always open regardless of demand.
- **Static vs dynamic allocation**: `simple` = automatic adjustment but with even distribution. `false` = fixed resource pool, no adjustment.

# Internal Mechanics
- With `balance: simple`:
  - Horizon starts a total of `minProcesses` workers.
  - Workers are assigned round-robin to configured queues.
  - `maxProcesses` caps total workers. Scaling up adds workers, distributed evenly.
  - Scaling down removes workers from the least-loaded queue first.
- With `balance: false`:
  - Exactly `processes` workers are started. No more, no less.
  - Workers are distributed evenly across queues.
  - No scaling events occur. Workers run until terminated.
- In both modes, each worker polls its assigned queue (not all queues).

# Patterns
## Equal Priority Multi-Tenant
- **Purpose**: Multiple queues with equal business priority.
- **Benefit**: No queue starves — each gets proportional resources.
- **Tradeoff**: Cannot prioritize one queue over another.

## Dedicated Queue Capacity
- **Purpose**: Guarantee minimum throughput for critical queues.
- **Benefit**: Predictable processing capacity regardless of other queues.
- **Tradeoff**: Wasted resources if the queue is idle; cannot borrow from idle queues.

## Hybrid (Multiple Supervisors)
- **Purpose**: Mix strategies per supervisor.
- **Benefit**: Critical queues get `false`, standard queues get `auto`, others get `simple`.
- **Tradeoff**: More supervisors; configuration complexity.

# Architectural Decisions
- **Use `simple` for**: Equal-priority queues, symmetric workloads, fairness-focused allocation.
- **Use `false` for**: SLA-bound queues with guaranteed capacity requirements, queues that should always have minimum throughput.
- **Use `auto` for**: Variable-load queues, priority-aware allocation, most general-purpose workloads.

# Tradeoffs
`simple` | Even distribution, maintains minimum per queue | Can't prioritize busier queues; skewed if job duration varies
`false` | Predictable, guaranteed capacity | Wastes capacity on idle queues; can't handle spikes
`auto` (time) | Optimal distribution, load-aware | Complex configuration; balancer overhead

# Performance Considerations
- `simple`: Process overhead is predictable — always between `minProcesses` and `maxProcesses`.
- `false`: Most predictable resource usage. No scaling events. No cycle overhead.
- `simple` with uneven job duration: One queue's jobs run 10s, another's run 100ms. Even worker allocation wastes capacity — the long-running queue keeps workers busy, short-queue workers idle.
- `false` with idle queue: Workers idle if assigned queue is empty. They can't process other queues' jobs.

# Production Considerations
- `simple` can simulate `false` by setting `minProcesses = maxProcesses`. This is a common pattern when you want even distribution with no scaling.
- `false` mode does NOT support `minProcesses`/`maxProcesses`. Only `processes`.
- Monitoring: `simple` may show unbalanced worker allocation in practice, even though it's even-by-design — because jobs have different durations.
- For SLA-critical queues, prefer `false` with over-provisioned `processes` to guarantee headroom.

# Common Mistakes
- **Using `simple` when queues have unequal priority**: `simple` treats all queues equally. A high-priority queue gets the same resources as a low-priority one.
- **Using `false` without setting `processes`**: `balance: false` requires `processes`. Omission causes Horizon to throw an error.
- **Expecting `simple` to distribute by load**: `simple` distributes by count, not by load. Uneven job duration creates actual allocation skew.
- **Using `simple` with very different job durations**: Fast jobs on one queue consume little time — workers stay available. Slow jobs on another queue lock workers. The fast queue appears under-served even with balanced allocation.

# Failure Modes
- **`false` mode with varying load**: If a queue has no jobs, its dedicated workers idle. Meanwhile, another queue on the same supervisor has backlog but can't use idle workers.
- **`simple` mode starvation under uneven duration**: Long jobs on one queue effectively reduce that queue's worker count. The other queues get more of the workers, but that's by design (workers free up when queue is empty).
- **Process count misconfiguration**: `processes` set too low for actual volume. Backlog builds. Workers can't scale because `false` is static.
- **`simple` + idle queue waste**: Equal allocation means 50% of workers may be idle if one queue is empty. No dynamic redistribution to busy queues.

# Ecosystem Usage
- **Laravel Horizon**: Both modes are documented in Horizon configuration docs.
- **Laravel Forge**: Forge Horizon UI supports selecting balance mode per supervisor.
- **Spatie packages**: Not directly affected, but package users should be aware of how balancing affects their job processing speed.

# Related Knowledge Units
- K041 Horizon Supervisor Configuration | K042 Auto Balancing with `time` Strategy

## Research Notes
- Horizon's auto-balancing mode uses a scoring algorithm that reassigns worker processes between queues every few seconds — the scoring considers queue backlog depth and processing time to determine worker allocation.
- The alance:auto strategy in Horizon implements a "min/max" approach where each supervisor has a configured minProcesses and maxProcesses — the balancer adjusts within this range based on load.
- Horizon v5 (Laravel 11+) improved Redis cluster support by abstracting queue connections through a consistent hashing layer — jobs are distributed across cluster nodes based on job ID hash.
- The Horizon dashboard authorization gate can be customized via Horizon::auth() — exposing the dashboard without authentication in production is a common security gap.
- Horizon metrics (throughput, runtime, wait time) are stored in Redis with a retention period configured via 	rim — long retention can consume significant Redis memory in high-throughput environments.
- The horizon:snapshot command generates a work-in-progress report of all supervisors, processes, and queue metrics — useful for debugging queue backlogs during incidents.
- Silenced job tags in Horizon prevent specific job types from appearing in the "Completed Jobs" and "Failed Jobs" lists — this is a display-only filter that does not affect job processing or logging.
- Horizon's queue:monitor integration was added in Laravel 12 — it provides a Pulse integration for queue health dashboards beyond Horizon's own UI.
