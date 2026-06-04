---
Domain: Async & Distributed Systems
Subdomain: Horizon Scaling & Monitoring
Knowledge Unit: K042 — Auto Balancing with `time` Strategy
Knowledge ID: K042
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Using `size` Instead of `time` Strategy | Performance | Medium |
| 2 | No `maxProcesses` Bound — Unbounded Scaling | Operations | Critical |
| 3 | `balanceMaxShift` Set Too High (Oscillation) | Performance | Medium |
| 4 | `balanceCooldown` Set Too Low (CPU Waste) | Performance | Low |
| 5 | Expecting Cross-Supervisor Balancing | Architecture | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| size Strategy for Variable-Duration Jobs | Medium — misallocates workers, slow queues starve | Always prefer `time` strategy |
| Infinite Worker Scaling | Critical — server memory exhaustion from unbounded process allocation | Mandatory `maxProcesses` cap on every supervisor |
| Balancing Oscillation (sawtooth pattern) | Medium — wasted spawn/kill cycles, memory fragmentation | Increase `balanceCooldown`, decrease `balanceMaxShift` |

---

## 1. Using `size` Instead of `time` Strategy

### Category
Performance

### Description
Configuring Horizon's auto balancing with `autoScalingStrategy: 'size'` instead of `'time'`. The `size` strategy allocates workers based on job count only, ignoring job duration — queues with few long-running jobs get less capacity than queues with many fast jobs.

### Why It Happens
- Not knowing `time` strategy exists (default was `size` in earlier Horizon versions)
- Assuming job count is the right metric for worker allocation
- Not profiling job execution times to see duration variance
- Copying old Horizon config templates that use `size`
- Not reading Horizon balancing documentation

### Warning Signs
- Queues with slow jobs (API calls, file processing) grow large regardless of workers
- Queues with fast jobs have more workers than needed
- Worker allocation doesn't reduce queue wait times proportionally
- Manual intervention: operators manually move workers to slow queues
- Dashboard shows high wait time on some queues despite low job count

### Why Harmful
- A queue with 10 slow jobs (10s each) gets fewer workers than a queue with 100 fast jobs (10ms each)
- The slow queue has 100 seconds of work, the fast queue has 1 second
- `size` treats them equally — allocates more workers to the fast queue with higher count
- Slow queues starve while fast queues are over-provisioned
- Wait time is the true measure of urgency — `size` ignores it completely

### Consequences
- Uneven processing — some queues have high latency while others are idle
- Operators manually override balancing (defeating automation)
- Customer-facing features backed by slow queues experience delays
- Worker resources misallocated despite sufficient total capacity
- Hard to diagnose — "workers are busy but queues are growing"

### Alternative
- Always use `autoScalingStrategy: 'time'`:
  ```php
  'balance' => 'auto',
  'autoScalingStrategy' => 'time',
  ```
- Only use `size` when all jobs have identical, predictable duration

### Refactoring Strategy
1. Change `autoScalingStrategy` from `'size'` to `'time'`
2. Restart Horizon
3. Monitor wait times — expect reduction on slow queues
4. Verify fast queues don't starve (they should still get proportional capacity)
5. Adjust `minProcesses`/`maxProcesses` if needed

### Detection Checklist
- [ ] `autoScalingStrategy` is `'time'` (not `'size'`)
- [ ] Queue wait times are balanced across queues
- [ ] No queue starves while others idle
- [ ] Worker allocation correlates with job duration, not just count
- [ ] Profile confirms job execution times vary across queues

### Related Rules
- use-time-strategy-over-size

### Related Skills
- Tune Auto Balancing with `time` Strategy

### Related Decision Trees
- Balance Time Window Selection

---

## 2. No `maxProcesses` Bound — Unbounded Scaling

### Category
Operations

### Description
Configuring auto balancing without setting `maxProcesses` per queue. The balancer can allocate unlimited workers to a queue as wait time grows — a queue with persistently failing jobs attracts more and more workers until server resources are exhausted.

### Why It Happens
- Not understanding that auto balancing can scale indefinitely
- Assuming Horizon defaults to a reasonable cap (it doesn't — no default cap)
- Focusing only on `minProcesses` for guaranteed capacity
- Copying config that omits `maxProcesses`
- Not load-testing failure scenarios

### Warning Signs
- Worker count for a queue grows continuously under load
- Process count exceeds available RAM on the server
- Horizon dashboard shows workers being spawned without limit
- Server OOM kills Horizon workers
- Queue has failing jobs but ever-increasing process allocation

### Why Harmful
- The balancer sees increasing wait time (failing jobs aren't completed) and adds more workers
- Each worker consumes 20-40MB of memory
- Workers spawn until server memory is exhausted
- OOM kills affect all processes, not just the runaway queue
- Entire server becomes unstable (swap, OOM, process crashes)

### Consequences
- Server OOM crash — all workers die, all queues stop
- Cascading failure: other supervisors on the same server also crash
- Production incident from "too many workers"
- Emergency Horizon restart to reset process counts
- Hours of downtime while processes restart

### Alternative
- Always set `maxProcesses` on every supervisor configuration:
  ```php
  'supervisor-webhooks' => [
      'minProcesses' => 2,
      'maxProcesses' => 10, // Hard cap — prevents runaway scaling
  ],
  ```
- Calculate `maxProcesses` based on: `available_memory / per_worker_memory`

### Refactoring Strategy
1. Add `maxProcesses` to all supervisor configs
2. Set to: `available_memory_mb / 40` (conservative, 40MB per worker)
3. Add memory monitoring for Horizon workers
4. Test failure scenario: poison job that always fails — verify worker count stays bounded
5. Alert if any supervisor approaches `maxProcesses` for extended periods

### Detection Checklist
- [ ] `maxProcesses` set on every supervisor
- [ ] Worker count never exceeds `maxProcesses`
- [ ] OOM incidents from excessive workers are zero
- [ ] Memory monitoring in place
- [ ] Failure scenario tested: poison job doesn't trigger unbounded scaling
- [ ] Capacity planning includes max process × per-worker memory

### Related Rules
- always-set-max-processes-bound

### Related Skills
- Tune Auto Balancing with `time` Strategy

### Related Decision Trees
- Balance Time Window Selection

---

## 3. `balanceMaxShift` Set Too High (Oscillation)

### Category
Performance

### Description
Setting `balanceMaxShift` to a high value (or default) allowing the balancer to add/remove many workers in a single cycle. Transient load spikes cause large swings in worker count, creating a sawtooth pattern of spawning and killing processes.

### Why It Happens
- Default `balanceMaxShift` may be too high for the workload
- Not understanding that each spawn/kill cycle costs memory and CPU
- Aiming for "maximum responsiveness" without considering the cost
- Not monitoring process count graphs for sawtooth patterns
- Copying config from high-burst workloads that legitimately need fast scaling

### Warning Signs
- Process count graph shows a sawtooth pattern (up-down-up-down)
- Workers spawn, a transient spike subsides, workers are killed
- Memory usage oscillates with process count
- Horizon log shows frequent spawn and kill events
- Workers are killed before they process a meaningful number of jobs

### Why Harmful
- Each worker spawn costs 50-100ms + 20-40MB memory allocation
- Each worker kill releases memory but causes fragmentation
- Workers don't run long enough to amortize the spawn cost
- CPU is wasted on process management instead of job processing
- Memory fragmentation degrades performance over time

### Consequences
- Reduced throughput — Horizon spends more time managing processes than processing jobs
- Higher memory usage from fragmentation
- Workers killed before they complete jobs (if timeout occurs during kill)
- Confusing dashboard — process count constantly changing
- Inefficient use of server resources

### Alternative
- Set `balanceMaxShift` to 1-2:
  ```php
  'balanceMaxShift' => 2, // Gradual — only adds/removes 2 workers per cycle
  ```
- Increase `balanceCooldown` to allow workers to settle between cycles
- Monitor process count graphs — should show smooth changes, not sawtooth

### Refactoring Strategy
1. Check current `balanceMaxShift` value
2. Set to 1-2 for most workloads (2 for bursty, 1 for steady)
3. Verify `balanceCooldown` is 3-5 seconds
4. Monitor process count graph for 24 hours
5. If sawtooth persists, increase cooldown further

### Detection Checklist
- [ ] `balanceMaxShift` set to 1-2
- [ ] Process count graph shows smooth changes (no sawtooth)
- [ ] No workers killed within 30 seconds of spawn
- [ ] Memory usage is stable (not oscillating)
- [ ] Worker spawn/kill events are infrequent compared to job processing

### Related Rules
- cap-balance-max-shift

### Related Skills
- Tune Auto Balancing with `time` Strategy

### Related Decision Trees
- Balance Time Window Selection

---

## 4. `balanceCooldown` Set Too Low (CPU Waste)

### Category
Performance

### Description
Setting `balanceCooldown` to 1 second, causing Horizon to rebalance every second. Each rebalancing cycle reads queue metrics from Redis and may spawn/kill workers — at 60 cycles per minute, overhead exceeds benefit for most workloads.

### Why It Happens
- Developer wants "instant" response to load changes
- Not measuring the CPU cost of rebalancing cycles
- Copying config from demo applications with trivial workloads
- Assuming faster rebalancing is always better
- Not understanding that 1s rebalancing doesn't help with jobs that take 30+ seconds

### Warning Signs
- Horizon supervisor CPU usage is high (10-20%) during idle periods
- Redis `GET` operations for queue metrics are high frequency
- Rebalancing cycles produce no changes most of the time (CPU wasted)
- Process count graph has high-frequency noise (small changes every second)
- Horizon log shows rebalancing events at 1-second intervals

### Why Harmful
- Each cycle reads metrics from Redis — 60 reads/second for the supervisor
- CPU is consumed by the rebalancing calculation
- Workers are spawned/killed too frequently
- Most cycles detect no meaningful change — work is wasted
- Thrashes Redis with metric reads

### Consequences
- 10-20% CPU overhead from rebalancing alone
- More Redis operations than necessary
- No meaningful improvement in worker allocation (load doesn't change that fast)
- Reduced throughput from overhead
- Higher infrastructure costs for the compute wasted

### Alternative
- Set `balanceCooldown` to 3-5 seconds:
  ```php
  'balanceCooldown' => 3, // 20 cycles/minute — reasonable responsiveness
  ```
- For steady workloads: 5 seconds
- For bursty workloads: 3 seconds
- Never set below 3 seconds

### Refactoring Strategy
1. Change `balanceCooldown` from 1 to 3-5 seconds
2. Monitor supervisor CPU — expect reduction
3. Verify responsiveness is still adequate — load spikes still addressed within seconds
4. Further increase cooldown if CPU is still high

### Detection Checklist
- [ ] `balanceCooldown` set to 3-5 seconds
- [ ] Supervisor CPU utilization is under 5% from rebalancing
- [ ] Redis metric read rate is proportional to cooldown value
- [ ] Load spikes are still addressed within acceptable time
- [ ] No visible degradation in worker allocation

### Related Rules
- set-balance-cooldown

### Related Skills
- Tune Auto Balancing with `time` Strategy

### Related Decision Trees
- Balance Time Window Selection

---

## 5. Expecting Cross-Supervisor Balancing

### Category
Architecture

### Description
Believing that Horizon's auto balancing distributes workers across multiple supervisors or across multiple servers. Auto balancing operates independently per supervisor — each supervisor balances only its own processes across its assigned queues.

### Why It Happens
- Not reading that balancing is per-supervisor
- Assuming a global scheduler optimizes across all supervisors
- Multiple supervisors with overlapping queue names but no coordination
- Expecting horizontally scaled supervisors to share worker allocation
- Not testing load distribution across supervisors

### Warning Signs
- One supervisor is overloaded while another has idle workers
- Adding a second supervisor doesn't help (they're independent)
- Both supervisors allocate workers to the same queue independently
- Total workers exceed expected (each supervisor allocates independently)
- No load sharing — a queue on supervisor A is backlogged while supervisor B is idle

### Why Harmful
- Each supervisor balances independently, not globally
- Supervisor A may have 8 workers on `high` queue and 2 on `default`
- Supervisor B may have 5 workers on `high` queue and 5 on `default`
- No coordination — both may starve the same queue or over-provision
- Adding supervisors doesn't guarantee balanced load (depends on queue assignment)

### Consequences
- Uneven load distribution across servers
- Overloaded supervisor causes processing delays
- Idle supervisors waste resources
- Capacity planning is complex (must account for independent balancing)
- Operators manually move queues between supervisors

### Alternative
- Design supervisors to own disjoint queue sets
- Or accept that each supervisor balances independently and plan capacity accordingly
- Use a single supervisor with more processes instead of multiple supervisors for the same queue
- Monitor per-supervisor load and adjust queue assignments

### Refactoring Strategy
1. Review all supervisor configurations — identify overlapping queue assignments
2. Redesign: each queue should be owned by one supervisor (or one group)
3. If horizontal scaling is needed: partition queues across supervisors
4. Monitor per-supervisor utilization
5. Document that balancing is per-supervisor

### Detection Checklist
- [ ] Each supervisor has a distinct set of queues (no overlap)
- [ ] No expectation of cross-supervisor balancing
- [ ] Load is balanced by queue assignment, not by supervisor coordination
- [ ] Operators understand per-supervisor balancing scope
- [ ] Documentation clarifies balancing boundaries

### Related Rules
- use-time-strategy-over-size

### Related Skills
- Tune Auto Balancing with `time` Strategy

### Related Decision Trees
- Balance Time Window Selection
