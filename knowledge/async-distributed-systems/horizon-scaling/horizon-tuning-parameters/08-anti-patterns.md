---
Domain: Async & Distributed Systems
Subdomain: Horizon Scaling & Monitoring
Knowledge Unit: K044 — Horizon Tuning Parameters
Knowledge ID: K044
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | `minProcesses = 0` — Queue Starvation | Operations | Critical |
| 2 | `maxProcesses` Too High — Server OOM | Operations | Critical |
| 3 | `balanceMaxShift = maxProcesses` — No Damping | Performance | Medium |
| 4 | Ignoring Oscillation (Sawtooth Pattern) | Performance | Medium |
| 5 | Copy-Paste Tuning Without Validation | Operations | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Unbounded Worker Scaling | Critical — memory exhaustion | Always cap `maxProcesses` to available RAM / 40MB |
| Zero Minimum Workers | Critical — queue stops processing | Always set `minProcesses >= 1` |
| Sawtooth Oscillation | Medium — wasted spawn/kill cycles | Monitor process count graphs; tune cooldown/maxShift |
| Untuned Configuration | Medium — not per-workload tuning | Tune per supervisor, not copy-pasted |

---

## 1. `minProcesses = 0` — Queue Starvation

### Category
Operations

### Description
Setting `minProcesses = 0` on a supervisor, intending to save memory when the queue is idle. Under auto-balancing, a queue with 0 minimum processes may never get a worker allocated — the balancer prioritizes queues with higher minimums or more urgent wait times.

### Why It Happens
- Intention is "queue only gets workers when there's work"
- Not understanding that `minProcesses = 0` means the balancer can completely ignore the queue
- Trying to maximize server capacity by not wasting workers on empty queues
- Copying a config that uses `minProcesses = 0` from a non-production environment
- Not testing what happens when the queue has jobs but no workers

### Warning Signs
- A queue with jobs sits unprocessed for extended periods
- Workers are allocated to other queues while this queue has a backlog
- Dashboard shows "0 workers" for a queue with pending jobs
- No apparent reason for processing delay (other queues are fine)
- `minProcesses = 0` in supervisor config

### Why Harmful
The auto-balancer may deprioritize a queue with `minProcesses = 0` — no workers are assigned, jobs accumulate indefinitely, and the queue effectively stops processing. The balancer assigns workers to queues with higher urgency (longer wait time) — but without any worker to measure wait time for this queue, wait time stays at zero, and the balancer never allocates workers.

### Consequences
- Queue stops processing entirely — zero workers allocated
- Jobs accumulate indefinitely without processing
- Operators manually intervene: force-restart Horizon, override worker allocation
- Silent failure: no alert for "queue has 0 workers" (Horizon doesn't alert on this by default)
- Critical business processes backed by this queue halt until manual intervention

### Alternative
- Always set `minProcesses >= 1`:
  ```php
  'minProcesses' => 1, // Guarantee at least one worker
  ```
- If memory is a concern, use a single worker at minimum (20-40MB is negligible for a processing guarantee)

### Refactoring Strategy
1. Audit all supervisor configs for `minProcesses = 0`
2. Change all to `minProcesses >= 1`
3. Verify workers are now allocated to all queues
4. Monitor queue processing — no queues should be stuck
5. If memory is impacted, reduce `maxProcesses` instead of setting `minProcesses = 0`

### Detection Checklist
- [ ] All supervisors have `minProcesses >= 1`
- [ ] No queue has 0 workers allocated
- [ ] All queues with jobs are processing
- [ ] No queues silently unprocessed
- [ ] Memory budget accounts for `minProcesses` × supervisors

### Related Rules
- set-min-processes-to-at-least-one

### Related Skills
- Tune Horizon minProcesses, maxProcesses, balanceMaxShift, balanceCooldown

### Related Decision Trees
- Horizon Memory and Performance Tuning

---

## 2. `maxProcesses` Too High — Server OOM

### Category
Operations

### Description
Setting `maxProcesses` without considering available server RAM. The auto-balancer scales workers to the configured maximum — if each worker uses 20-40MB and maxProcesses exceeds the server's memory capacity, the result is swapping, OOM kills, and server instability.

### Why It Happens
- Not knowing per-worker memory consumption (~20-40MB)
- Setting arbitrarily high maxProcesses "just in case"
- Not calculating: `total_workers × 40MB > available_RAM`
- Not load-testing at max worker count
- Assuming OS handles memory pressure gracefully (it does not)

### Warning Signs
- Worker count reaches maxProcesses under load
- System memory usage exceeds 90% during peak
- Swap usage increases when workers scale up
- OOM killer terminates Horizon workers (or other processes)
- Server responsiveness degrades as workers scale up

### Why Harmful
Auto-balancer scales to 50 workers on a 1GB server — each worker uses 40MB = 2GB total. The OS starts swapping to disk, all workers slow to a crawl, and eventually an OOM killer terminates random processes. The crash may kill the Horizon master process itself, taking down all queue processing. Recovery requires manual restart, and the cycle repeats when workers scale up again.

### Consequences
- Server OOM crash — all workers die, all queues stop
- Cascading failure: OOM may kill unrelated processes (web server, database)
- Data loss risk: jobs in progress are terminated mid-processing
- Emergency incident requiring server restart
- OOM kills may corrupt Redis data (if Redis runs on the same server)

### Alternative
- Base `maxProcesses` on available RAM:
  ```php
  'maxProcesses' => (int) floor($availableRAM / 40), // Conservative: 40MB per worker
  ```
- Account for other processes on the same server (web server, Redis, database)
- Monitor actual per-worker memory usage and tune the 40MB estimate

### Refactoring Strategy
1. Calculate available RAM for workers: `total_RAM - other_processes_RAM`
2. Set `maxProcesses = available_RAM / 40` (or lower)
3. Deploy and monitor memory usage at peak worker count
4. If actual per-worker memory is lower, increase maxProcesses
5. Add memory monitoring alerts: memory > 80% for > 5 minutes

### Detection Checklist
- [ ] `maxProcesses` is within memory budget
- [ ] No OOM kills from excessive worker count
- [ ] Swap usage is zero during peak worker scaling
- [ ] Memory monitoring in place
- [ ] Per-worker memory consumption measured and accounted for

### Related Rules
- base-max-processes-on-ram

### Related Skills
- Tune Horizon minProcesses, maxProcesses, balanceMaxShift, balanceCooldown

### Related Decision Trees
- Horizon Memory and Performance Tuning

---

## 3. `balanceMaxShift = maxProcesses` — No Damping

### Category
Performance

### Description
Setting `balanceMaxShift` equal to `maxProcesses`, removing any damping on per-cycle process changes. The balancer can add or remove all workers in a single cycle — causing massive process churn in response to transient load spikes.

### Why It Happens
- Not understanding what `balanceMaxShift` does
- Not setting `balanceMaxShift` at all (defaults to `maxProcesses`)
- Wanting "maximum responsiveness" without understanding the cost
- Copying config where maxShift is tied to maxProcesses logic
- Not monitoring process count graphs for oscillation

### Warning Signs
- Process count jumps from min to max in a single balancing cycle
- Process count drops from max to min in the next cycle
- Workers are spawned and killed rapidly
- Memory usage spikes as workers are allocated then freed
- Horizon log shows frequent scale-up/scale-down events

### Why Harmful
Each process spawn costs 20-40MB memory allocation plus CPU for process creation. When the balancer can go from 0 to 50 workers in one cycle, memory jumps from 0MB to 2GB instantly — if the spike is transient, the workers are killed in the next cycle, and the memory is freed and reallocated. This oscillation wastes resources and can cause memory pressure spikes even when average load is low.

### Consequences
- Massive memory and CPU waste from constant spawn/kill cycles
- Workers never stabilize — always being created or destroyed
- Actual job processing time reduced by overhead
- Memory fragmentation from repeated allocation/deallocation
- Dashboard shows sawtooth process count (confusing operators)
- Workers may be killed before completing meaningful work

### Alternative
- Set `balanceMaxShift = 1-2`:
  ```php
  'balanceMaxShift' => 2, // Add/remove at most 2 workers per cycle
  ```
- Start with 2 for bursty workloads, 1 for steady workloads
- Only increase if the balancer is too slow to respond to genuine load increases

### Refactoring Strategy
1. Check current `balanceMaxShift` value
2. If it equals `maxProcesses` or is not set, change to 1-2
3. Monitor process count graphs — expect smooth changes
4. Verify that load spikes are still addressed (just more gradually)
5. If response is too slow, increase by 1 and re-monitor

### Detection Checklist
- [ ] `balanceMaxShift` set to 1-2 (not equal to maxProcesses)
- [ ] Process count changes are gradual (not instant max→min)
- [ ] No sawtooth oscillation in process count graphs
- [ ] Workers stabilize for minutes at a time (not constant churn)
- [ ] Memory usage is stable (not spiking with each balancing cycle)

### Related Rules
- detect-oscillation-sawtooth

### Related Skills
- Tune Horizon minProcesses, maxProcesses, balanceMaxShift, balanceCooldown

### Related Decision Trees
- Horizon Memory and Performance Tuning

---

## 4. Ignoring Oscillation (Sawtooth Pattern)

### Category
Performance

### Description
Not monitoring process count graphs for the sawtooth oscillation pattern. The balancer repeatedly overshoots and corrects — spawning workers when wait time increases, then killing them when wait time drops, creating a continuous cycle of allocation and deallocation.

### Why It Happens
- Not looking at process count graphs in the Horizon dashboard
- Not knowing what a "sawtooth" pattern looks like
- Assuming process count changes are normal and harmless
- No monitoring for oscillation
- Settling on a config that "works" without checking for efficiency

### Warning Signs
- Process count graph shows regular up-down-up-down pattern
- Workers are spawned, then killed minutes later
- CPU usage shows regular spikes corresponding to worker creation
- Memory usage oscillates with process count
- Dashboard shows "workers" count constantly changing (never stable)

### Why Harmful
The sawtooth pattern spawns and kills 6 workers every 10 seconds — each cycle costs 20-40MB per worker. Memory bandwidth is consumed by allocation/deallocation, not actual job processing. Over an hour, the system spends more resources on process management than job execution. The oscillation can be subtle — a small sawtooth (2→4→2) that persists indefinitely, wasting 10-20% of server capacity.

### Consequences
- 10-20% reduction in effective throughput (wasted on process management)
- Memory fragmentation degrades performance over time
- Workers don't run long enough to amortize the spawn cost
- Higher cloud costs (need more servers to compensate for wasted capacity)
- Confusing dashboard: process count never settles, operators don't know "normal"

### Alternative
- Monitor process count graphs specifically for sawtooth patterns
- If oscillation detected:
  - Increase `balanceCooldown` (e.g., from 3 to 5)
  - Decrease `balanceMaxShift` (e.g., from 2 to 1)
  - Or switch to `minProcesses = maxProcesses` (static allocation)

### Refactoring Strategy
1. Check Horizon dashboard process count graph for 24h period
2. Identify sawtooth patterns (regular up-down cycles)
3. Increase `balanceCooldown` by 2 seconds
4. Decrease `balanceMaxShift` by 1
5. Monitor for 24h — sawtooth should reduce or disappear
6. If persistent, consider static allocation for that queue type

### Detection Checklist
- [ ] Process count graph monitored for sawtooth patterns
- [ ] No regular oscillation in worker count
- [ ] Worker count stabilizes for minutes between changes
- [ ] CPU usage is stable (no regular spawn/kill spikes)
- [ ] Memory usage is stable (no oscillation)
- [ ] BalanceCooldown and balanceMaxShift tuned

### Related Rules
- detect-oscillation-sawtooth

### Related Skills
- Tune Horizon minProcesses, maxProcesses, balanceMaxShift, balanceCooldown

### Related Decision Trees
- Horizon Memory and Performance Tuning

---

## 5. Copy-Paste Tuning Without Validation

### Category
Operations

### Description
Using Horizon tuning parameters (minProcesses, maxProcesses, balanceMaxShift, balanceCooldown) copied from a blog post, tutorial, or another project without validating against the actual workload patterns. The parameters don't match the application's queue characteristics.

### Why It Happens
- Convenience: "this config worked for someone else"
- Not having time to tune parameters properly
- Assuming all workloads respond similarly to the same settings
- Not understanding what each parameter does
- No load testing or validation process for Horizon config changes

### Warning Signs
- All supervisors have identical tuning parameters despite different workload types
- Config matches a known blog post or tutorial exactly
- No documentation of why specific values were chosen
- Tuning parameters never changed from initial setup
- Queues show poor performance but tuning hasn't been adjusted

### Why Harmful
A blog post recommending `balanceMaxShift = 5` and `balanceCooldown = 1` for bursty webhook processing is applied to a steady email queue. The email queue oscillates violently — workers are spawned and killed every second, wasting resources. The application's specific workload characteristics (job duration variance, arrival pattern, queue depth cycle) are not reflected in the tuning, so the balancer responds inappropriately.

### Consequences
- Poor queue performance (oscillation or slow response to load)
- Wasted server resources from inappropriate tuning
- Debugging time wasted: "the config is from a blog post, it should work"
- Team doesn't understand tuning parameters well enough to fix issues
- Performance problems attributed to "Horizon having issues" rather than misconfiguration

### Alternative
- Tune parameters based on actual workload:
  - Measure job duration, arrival rate, and queue depth patterns
  - Start with conservative values (maxShift=1, cooldown=5)
  - Adjust based on observed behavior (oscillation, slow response)
  - Validate under load test before production
  - Tune per supervisor, not one-size-fits-all

### Refactoring Strategy
1. Document each queue's workload characteristics (bursty/steady, job duration, arrival rate)
2. Remove copy-pasted tuning parameters
3. Set conservative starting values per supervisor
4. Monitor process count graphs for oscillation
5. Adjust per supervisor based on observed behavior
6. Document why each parameter was chosen

### Detection Checklist
- [ ] Tuning parameters are different per supervisor (where workload differs)
- [ ] Values are justified by workload characteristics, not copy-pasted
- [ ] No exact match to a tutorial/blog post config without validation
- [ ] Tuning parameters have been adjusted from initial setup
- [ ] Load testing validates tuning parameters
- [ ] Documentation explains why values were chosen

### Related Rules
- set-min-processes-to-at-least-one, base-max-processes-on-ram

### Related Skills
- Tune Horizon minProcesses, maxProcesses, balanceMaxShift, balanceCooldown

### Related Decision Trees
- Horizon Memory and Performance Tuning
