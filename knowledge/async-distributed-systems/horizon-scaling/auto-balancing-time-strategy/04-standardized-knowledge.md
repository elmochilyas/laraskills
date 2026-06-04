# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Horizon Scaling & Monitoring
- **Knowledge Unit:** K042 — Auto Balancing with `time` Strategy
- **Knowledge ID:** K042
- **Difficulty Level:** Expert
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Horizon: Balancing Strategies
  - Laravel Source — `Laravel\Horizon\AutoScaler`

---

# Overview

Horizon's `auto` balancing strategy with the `time` scaling algorithm dynamically allocates worker processes to queues based on queue wait time (estimated time to clear all current jobs), not queue depth. This prevents starvation of fast queues by ensuring workers are shifted to queues with the highest processing urgency. The algorithm calculates a "wait time score" for each queue and redistributes processes proportionally. The `balanceMaxShift` and `balanceCooldown` parameters control aggression and oscillation damping.

---

# Core Concepts

- **`auto` balancing:** Horizon adjusts worker process counts per queue within `minProcesses`/`maxProcesses` bounds.
- **`autoScalingStrategy`:** `time` (default) — scales by estimated time to clear queue. `size` — scales by number of jobs in queue.
- **Wait time calculation:** `estimated_clear_time = queue_size × average_processing_time_per_job`.
- **Process allocation:** Each balancing cycle re-computes optimal distribution and spawns/kills processes.
- **`balanceMaxShift`:** Maximum processes to add/remove per balancing cycle. Prevents oscillation.
- **`balanceCooldown`:** Seconds between balancing cycles. Prevents rapid rebalancing.

---

# When To Use

- Variable-load queues where job volume fluctuates unpredictably
- Queues with different job durations and priority levels
- General-purpose workloads where load-aware allocation is beneficial
- Preventing starvation of fast queues by long-job-heavy queues

---

# When NOT To Use

- Fixed-capacity workloads where each queue needs guaranteed throughput — use `simple` or `false`
- Single queue per supervisor — no balancing is needed
- When process churn (spawning/killing workers) is unacceptable — use static allocation
- Simple round-robin distribution is sufficient — use `simple` mode

---

# Best Practices

- **Always use `time` strategy over `size`.** `time` accounts for job duration, not just count. A queue with 10 long-running jobs has higher wait time than 100 fast jobs — `size` treats them equally. *Why: Job count alone is misleading — wait time is the true measure of processing urgency.*
- **Set `balanceMaxShift` to 1-2 for most workloads.** Higher values allow faster scaling but risk overshoot and process churn. *Why: Each worker spawn takes 50-100ms + 20-40MB — spawning too many at once wastes resources if the spike subsides.*
- **Set `balanceCooldown` to 3-5 seconds.** Frequent rebalancing (1s) is CPU-intensive. Infrequent (10s+) responds slowly to load changes. *Why: Balancing cycles require metric reads from Redis and process management — too frequent adds overhead without benefit.*
- **Always set `maxProcesses` to prevent unbounded scaling.** The balancer can allocate up to `maxProcesses` per queue — without a cap, it may overwhelm downstream systems or exhaust server resources. *Why: A queue with failing jobs may have ever-increasing wait time, attracting more workers — the cap prevents runaway scaling.*

---

# Architecture Guidelines

- The `AutoScaler` class computes wait time from queue metrics stored in Redis.
- Allocation formula: `allocated = maxProcesses × (queue_wait_time / total_wait_time)`, clamped to `[minProcesses, maxProcesses]`.
- Workers are added by spawning new processes. Removed by SIGTERM (finish current job, then exit).
- The `time` strategy uses a rolling average of job execution time for wait estimation.
- Balancing is per-supervisor — it does not distribute across supervisors or across servers.
- Cold start (no metrics yet) may misallocate until job execution data accumulates.

---

# Performance Considerations

- Each balancing cycle reads metrics from Redis — CPU cost is negligible (sub-millisecond).
- Process spawning costs ~50-100ms + memory allocation for a new PHP process.
- Frequent spawning (every cycle) is wasteful — let workers run for multiple cycles before re-evaluating.
- Worker memory is not released until the process dies — rapid scaling up/down causes fragmentation.

---

# Security Considerations

- The auto balancer does not have security implications — it manages process counts based on queue metrics.
- Worker processes inherit the Horizon process user's permissions — ensure appropriate access controls.
- In multi-tenant environments, a tenant with high-volume jobs may attract more workers, potentially reducing capacity for other tenants on the same supervisor.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using `size` instead of `time` | Defaulting to job count | Misallocates workers for variable-duration jobs | Always prefer `time` strategy |
| `balanceCooldown` too low (1s) | Attempting max responsiveness | Horizon spends more time scaling than processing | Set cooldown to 3-5s |
| `balanceMaxShift` = `maxProcesses` | No damping on scaling | Single cycle can go from 0 to max workers | Cap shift at 1-2 |
| Expecting cross-supervisor balancing | Misunderstanding scope | Unbalanced load across supervisors | Each supervisor balances independently |

---

# Anti-Patterns

- **Cold-start metric starvation:** Relying on the time strategy without any baseline metrics. The queue may misallocate until averages stabilize.
- **Ignoring balancing oscillation:** A sawtooth pattern in process counts indicates over-reactive balancing. Increase cooldown or decrease max shift.
- **Infinite worker scaling:** No `maxProcesses` cap — the balancer keeps adding workers as wait time grows, eventually exhausting server resources.

---

# Examples

```php
// Supervisor with time-based auto balancing
'supervisor-webhooks' => [
    'connection' => 'redis',
    'queue' => ['webhooks-high', 'webhooks-normal', 'webhooks-low'],
    'balance' => 'auto',
    'autoScalingStrategy' => 'time',
    'minProcesses' => 2,
    'maxProcesses' => 10,
    'balanceMaxShift' => 2,
    'balanceCooldown' => 3,
    'tries' => 3,
    'timeout' => 60,
],
```

---

# Related Topics

- **K041 Horizon Supervisor Configuration (K041)** — Supervisor definition context
- **K043 Simple and No Balancing Modes (K043)** — Alternative balancing strategies
- **K044 Horizon Tuning Parameters (K044)** — minProcesses, maxProcesses, balanceMaxShift, balanceCooldown

---

# AI Agent Notes

- When generating Horizon config, default to `balance: auto` and `autoScalingStrategy: time` for most workloads. Reserve `simple` and `false` for specific use cases.
- Always include `balanceMaxShift` (1-2) and `balanceCooldown` (3-5) when using `auto` balancing — without them, Horizon uses defaults that may not be optimal.
- Each supervisor balances independently. If generating multi-supervisor config, document that load is not balanced across supervisors.

---

# Verification

- [ ] `auto` balancing active — verify process count changes when queue load varies
- [ ] `time` strategy used — verify wait time metric influences allocation (not just job count)
- [ ] `balanceMaxShift` respected — verify no more than max shift processes are added/removed per cycle
- [ ] `balanceCooldown` respected — verify cycles don't run more frequently than configured
- [ ] `minProcesses`/`maxProcesses` boundaries honored — verify worker count stays within bounds
