---
Domain: Async & Distributed Systems
Subdomain: Horizon Scaling & Monitoring
Knowledge Unit: K043 — Simple and No Balancing Modes
Knowledge ID: K043
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | `simple` Balancing for Unequal Priority Queues | Architecture | Medium |
| 2 | `false` Mode Without `processes` Setting | Configuration | High |
| 3 | `false` Mode With No Capacity Headroom | Operations | Medium |
| 4 | `simple` Mode With 10+ Queues | Performance | Low |
| 5 | Assuming `simple` Distributes Fairly Under All Conditions | Architecture | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Round-Robin for Priority Queues | Medium — low-priority queues get equal resources | Use `auto` for priority-aware allocation |
| Missing `processes` with `balance: false` | High — Horizon fails to start | Mandatory `processes` setting |
| No Capacity Headroom in `false` Mode | Medium — spike causes backlog | Over-provision `processes` above average throughput |

---

## 1. `simple` Balancing for Unequal Priority Queues

### Category
Architecture

### Description
Using `simple` (round-robin) balancing when queues have different priorities. `simple` distributes workers evenly across all configured queues, regardless of their priority — a low-priority report queue gets the same number of workers as a high-priority webhook queue.

### Why It Happens
- "Simple" sounds simpler — developers reach for it first
- Not understanding the difference between "even" and "fair" allocation
- Assuming all queues have equal priority
- Not reading that `simple` ignores queue depth and wait time
- Copying config from a symmetric workload that used `simple`

### Warning Signs
- All queues get equal workers despite different SLAs
- High-priority queue backs up while low-priority queue has idle workers
- "We have 10 workers but our critical queue is slow" — because it only gets 5
- Manual intervention: operators watch the dashboard and reassign workers
- Priority classification exists but `simple` balancing ignores it

### Why Harmful
`simple` mode splits 10 workers evenly across 3 queues (3, 3, 4). The high-priority webhook queue needs 6 workers, but the low-priority report queue hogs 3 workers it doesn't need. The webhook queue backs up: user-facing features are delayed because workers are tied up processing overnight reports. The system is "balanced" in count but unbalanced in business value.

### Consequences
- High-priority queues starved for workers
- Low-priority queues get more workers than needed
- User-facing delays from priority mismanagement
- Operators manually intervene to compensate
- System appears "balanced" but business priorities are ignored

### Alternative
- Use `auto` with `time` strategy for priority-aware allocation:
  ```php
  'balance' => 'auto',
  'autoScalingStrategy' => 'time', // Load-aware, priority-agnostic
  ```
- Or separate supervisors per priority tier:
  ```php
  'supervisor-webhooks' => ['queue' => ['webhooks'], 'balance' => 'auto', 'maxProcesses' => 10],
  'supervisor-reports' => ['queue' => ['reports'],  'balance' => 'simple', 'maxProcesses' => 3],
  ```

### Refactoring Strategy
1. Identify which queues have priority differences
2. For mixed-priority supervisors: switch to `auto` with `time`
3. Or split into per-priority supervisors with different maxProcesses
4. Remove `simple` from any supervisor with priority-diverse queues
5. Verify high-priority queues get proportionally more workers

### Detection Checklist
- [ ] No supervisor with `simple` balancing has mixed-priority queues
- [ ] High-priority queues have access to more workers than low-priority
- [ ] `auto` with `time` used for priority-diverse workloads
- [ ] Or separate supervisors per priority tier
- [ ] Queue priority documented and matched to balancing strategy

### Related Rules
- prefer-auto-balancing-for-most, avoid-simple-for-unequal-durations

### Related Skills
- Configure Simple and No Balancing Modes

### Related Decision Trees
- Simple vs No vs Auto Balancing Mode

---

## 2. `false` Mode Without `processes` Setting

### Category
Configuration

### Description
Setting `balance: false` without providing the required `processes` option. `false` mode does not support `minProcesses`/`maxProcesses` — it requires explicit `processes` to define the fixed number of workers. Omission causes a configuration error and Horizon fails to start.

### Why It Happens
- Not reading that `false` mode requires `processes`
- Confusing `false` mode with `auto` mode (which uses minProcesses/maxProcesses)
- Copying config from `auto` mode and changing only `balance` value
- Assuming `processes` defaults to a reasonable value (it does not)
- Not testing Horizon start after config change

### Warning Signs
- `php artisan horizon` throws `InvalidArgumentException`
- Error message: "The 'processes' option is required when balancing is disabled"
- Configuration has `balance: false` but no `processes` key
- Copy-pasted config from auto mode with only `balance` changed
- Deployment failed at the Horizon start step

### Why Harmful
Horizon fails to start with `InvalidArgumentException: The "processes" option is required when balancing is disabled.` — the deployment fails, and no workers process any jobs until the config is fixed. If this happens in production, all queue processing stops. The deployment rollback is needed, or a hotfix config change must be deployed.

### Consequences
- Horizon fails to start — zero workers
- Queue processing stops completely
- Deployment pipeline blocked
- Emergency hotfix or rollback needed
- All queues accumulate backlog until fix is deployed
- Time-sensitive jobs (password resets, payment processing) delayed

### Alternative
- Always include explicit `processes` with `balance: false`:
  ```php
  'balance' => false,
  'processes' => 3, // Required for false mode
  ```
- If you want minProcesses/maxProcesses behavior, use `balance: 'simple'` instead
- Never use `balance: false` without `processes`

### Refactoring Strategy
1. Audit all supervisor configs with `balance: false`
2. Ensure each has explicit `processes` set
3. If `processes` is missing, add it (choose value based on workload)
4. Test `php artisan horizon` starts successfully
5. Add validation in CI: check that `balance: false` configs have `processes`

### Detection Checklist
- [ ] All `balance: false` supervisors have explicit `processes`
- [ ] Horizon starts without "processes is required" error
- [ ] CI validates `balance: false` has `processes`
- [ ] No `balance: false` config missing `processes` in git history
- [ ] Team knows `processes` is mandatory with `balance: false`

### Related Rules
- require-processes-with-false

### Related Skills
- Configure Simple and No Balancing Modes

### Related Decision Trees
- Simple vs No vs Auto Balancing Mode

---

## 3. `false` Mode With No Capacity Headroom

### Category
Operations

### Description
Setting `processes` in `balance: false` mode to exactly match average throughput, leaving no headroom for traffic spikes. Any increase in job volume creates an immediate backlog with no ability to scale — `false` mode is fixed and cannot add workers.

### Why It Happens
- Configuring based on average throughput without considering variance
- Trying to minimize resource usage ("we don't want idle workers")
- Not understanding that `false` mode provides no dynamic scaling
- No historical traffic data to determine peak vs average
- Focus on cost savings without considering operational risk

### Warning Signs
- Any traffic spike creates immediate queue backlog
- Queue never recovers from spikes (workers can't scale up)
- Processing latency increases during peak hours
- Workers are always at 100% utilization
- No idle workers to absorb load variation

### Why Harmful
A payment processing supervisor has `processes: 2` — enough for average throughput. At month-end, transaction volume doubles. The 2 workers cannot process the increased load — backlog grows indefinitely. With `balance: false`, there is no scaling mechanism. The team must deploy a config change to increase `processes` or switch to auto-balancing. During the hour this takes, payment processing is delayed.

### Consequences
- Queue backlog during any traffic spike
- No automatic recovery — backlog persists until traffic subsides
- Manual intervention required: config change + deploy to add capacity
- SLA violations during peak periods
- Over-provisioning fear leads to even more conservative (under-provisioned) config

### Alternative
- Over-provision `processes` by 50-100% above average throughput:
  ```php
  // Average throughput: 100 jobs/min, each takes 30s → need ~3 workers
  // Over-provision for spikes:
  'processes' => 5, // ~66% headroom
  ```
- Or use `balance: 'auto'` for dynamic scaling (preferred for variable load)
- Monitor peak-to-average ratio and adjust `processes` accordingly

### Refactoring Strategy
1. Measure average and peak throughput for each fixed-capacity queue
2. Calculate required workers for peak throughput: `peak_jobs_per_min × avg_job_time_sec / 60`
3. Set `processes` to at least peak requirement
4. If peak varies significantly, switch to `auto` balancing instead
5. Monitor backlog during peak periods — should be zero with headroom

### Detection Checklist
- [ ] `processes` set above average throughput (50-100% headroom)
- [ ] No queue backlog during peak traffic periods
- [ ] Workers have idle periods (not 100% utilized constantly)
- [ ] If traffic varies significantly, `auto` balancing is preferred
- [ ] Peak throughput analyzed before setting `processes`

### Related Rules
- use-false-for-sla-critical-queues

### Related Skills
- Configure Simple and No Balancing Modes

### Related Decision Trees
- Simple vs No vs Auto Balancing Mode

---

## 4. `simple` Mode With 10+ Queues

### Category
Performance

### Description
Using `simple` balancing with a large number of queues (10+) in a single supervisor. Worker allocation per queue becomes very small — with 10 queues and 8 max workers, each queue gets less than one worker on average. Some queues may starve.

### Why It Happens
- Convenience: putting all queues in one supervisor
- Not calculating the per-queue worker allocation
- Adding queues over time without revisiting the balancing strategy
- Assuming `simple` handles arbitrary numbers of queues equally
- Not considering that workers must be integers — queues get at most 1 worker each

### Warning Signs
- Supervisor has 10+ queues configured
- Per-queue worker count is 0-1 (workers can't be fractional)
- Some queues never get a worker allocated
- Dashboard shows queues with 0 workers despite having jobs
- "We have 8 workers but 12 queues" — some queues are never touched

### Why Harmful
With 10 queues and `minProcesses=4` workers, `simple` divides 4 workers across 10 queues. In practice, 6 queues get zero workers (only 4 workers exist), and the remaining 4 queues share the workers. The allocation is essentially random — whichever queue's turn it is in the round-robin gets the worker. Queues with persistent work may sit unprocessed while their worker is assigned to a different queue in the cycle.

### Consequences
- Some queues effectively unprocessed (no workers available)
- Processing is unpredictable — which queue gets a worker depends on rotation timing
- Low throughput: total workers are spread too thin
- Monitoring confusion: some queues show progress, others don't
- Team adds more supervisors (workers) — but `simple` still distributes evenly
- Inefficient use of total worker capacity

### Alternative
- Limit `simple` supervisors to 3-5 queues maximum
- For 10+ queues: use `auto` balancing or split into multiple supervisors:
  ```php
  // auto handles many queues better — allocates by need, not by count
  'balance' => 'auto',
  'autoScalingStrategy' => 'time',
  ```
- Or group related queues into per-category supervisors (webhooks, emails, reports)

### Refactoring Strategy
1. Count queues per supervisor
2. If > 5 queues with `simple`: split into grouped supervisors
3. Or switch to `auto` balancing for the combined supervisor
4. Verify each queue can get at least 1 worker under normal conditions
5. Monitor per-queue processing — no queue should starve

### Detection Checklist
- [ ] No supervisor with > 5 queues using `simple` balancing
- [ ] Each queue can get at least 1 worker
- [ ] No queues starved (0 workers regularly)
- [ ] Large numbers of queues use `auto` balancing
- [ ] Multiple supervisors used if queue groups have different profiles

### Related Rules
- prefer-auto-balancing-for-most

### Related Skills
- Configure Simple and No Balancing Modes

### Related Decision Trees
- Simple vs No vs Auto Balancing Mode

---

## 5. Assuming `simple` Distributes Fairly Under All Conditions

### Category
Architecture

### Description
Believing that `simple` balancing provides fair allocation in all conditions because it distributes workers evenly. Job duration variance makes round-robin allocation effectively uneven — fast queues consume less worker time, making their workers appear idle while slow queues saturate their workers.

### Why It Happens
- "Even split" intuitively sounds fair
- Not measuring actual job durations per queue
- Monitoring worker count (even) but not utilization (uneven)
- Not reading the documentation about `simple` mode limitations
- Copying config from homogeneous workloads without checking

### Warning Signs
- Queue A (100ms jobs) and Queue B (10s jobs) have equal workers
- Queue A's workers are idle 90% of the time (finish quickly)
- Queue B has a persistent backlog (workers always busy)
- "Workers are balanced but processing is slow" — allocation is even, utilization is not
- Manual investigation reveals duration mismatch between queues

### Why Harmful
Under `simple`, Queue A's workers finish jobs in 100ms and sit idle for 900ms while Queue B's workers struggle with 10s jobs. The system is 50% utilized on paper (all workers exist), but Queue B has a 5-minute backlog. The round-robin allocation appears fair (3 workers each), but the worker utilization is 10% for A and 100% for B. The system appears balanced but one queue is effectively overwhelmed.

### Consequences
- Some queues appear idle, others saturated (uneven utilization)
- Perceived capacity shortage despite apparent balance
- Wasted workers on fast queues (idle most of the time)
- Backlog on slow queues while fast queues idle
- Confusing metrics: worker count looks balanced, processing is not
- Team adds more workers (to fix the backlog) but fast queues get half

### Alternative
- Don't use `simple` when job durations vary significantly:
  - Separate supervisors per duration profile:
    ```php
    'supervisor-fast'  => ['queue' => ['webhooks', 'api'],   'balance' => 'auto'],
    'supervisor-slow'  => ['queue' => ['reports', 'exports'], 'balance' => 'false', 'processes' => 2],
    ```
  - Or use `auto` with `time` strategy (load-aware allocation)

### Refactoring Strategy
1. Measure job duration per queue — identify fast vs slow
2. If durations vary by > 10x, split into separate supervisors
3. Use `auto` for mixed-duration supervisors
4. Move `simple` out of any mixed-duration supervisor
5. Verify per-queue utilization is now proportional to allocation

### Detection Checklist
- [ ] Job durations measured per queue
- [ ] Queues with similar durations use the same supervisor
- [ ] Fast and slow queues are in separate supervisors or use `auto`
- [ ] Worker utilization is balanced (not one queue saturated, another idle)
- [ ] `simple` only used when job durations are similar

### Related Rules
- avoid-simple-for-unequal-durations

### Related Skills
- Configure Simple and No Balancing Modes

### Related Decision Trees
- Simple vs No vs Auto Balancing Mode
