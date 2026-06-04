# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Horizon Scaling & Monitoring
- **Knowledge Unit:** K044 — Horizon Tuning Parameters
- **Knowledge ID:** K044
- **Difficulty Level:** Expert
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Horizon: Configuration
  - Laravel Source — `Laravel\Horizon\AutoScaler`

---

# Overview

Four parameters control the aggression and envelope of Horizon's auto-balancing behavior. `minProcesses` and `maxProcesses` define the floor and ceiling of workers per queue. `balanceMaxShift` caps how many processes can be added or removed in a single balancing cycle. `balanceCooldown` sets the minimum seconds between balancing cycles. Together, these form the tuning knobs that prevent the balancer from over-reacting (oscillation) or under-reacting (starvation) to workload changes.

---

# Core Concepts

- **`minProcesses`:** Minimum worker processes per queue. Guarantees baseline capacity even when queue is empty.
- **`maxProcesses`:** Maximum worker processes per queue. Prevents unbounded scaling.
- **`balanceMaxShift`:** Maximum change in process count per cycle per queue. Dampens scaling aggression.
- **`balanceCooldown`:** Minimum time between balancing cycles. Prevents rapid rebalancing.

---

# When To Use

- Tuning Horizon auto-balancing behavior for specific workload patterns
- Bursty workloads needing aggressive scale-out (high maxShift, low cooldown)
- Steady workloads needing minimal churn (low maxShift, high cooldown)
- Guaranteeing minimum capacity (minProcesses) while preventing runaway scaling (maxProcesses)

---

# When NOT To Use

- `balance: false` mode — these parameters don't apply to no-balance mode
- Single-queue supervisors — with one queue, balancing between queues is meaningless
- Development environments — default values are sufficient

---

# Best Practices

- **Set `minProcesses = 1` for most queues.** Zero minimum means a queue could be completely unprocessed if deprioritized. *Why: A queue with 0 minProcesses may never get a worker allocated during balancing — jobs sit unprocessed indefinitely.*
- **Base `maxProcesses` on available server RAM.** Each worker uses ~20-40MB. `maxProcesses = available_RAM / 40MB`. *Why: Workers consume memory — exceeding available RAM causes swapping or OOM kills.*
- **Use `balanceMaxShift = 1-2` for production.** Higher values cause excessive process churn and memory fragmentation. *Why: Each process spawn costs 20-40MB — spawning 10 workers in one cycle can exhaust memory if the spike is transient.*
- **Use `balanceCooldown = 3-5` seconds.** Fast enough to respond to load changes, slow enough to prevent oscillation. *Why: Quick successive balancing cycles detect transient spikes as persistent load, causing over-allocation.*
- **Set `minProcesses = maxProcesses` to effectively disable balancing.** Creates static allocation. *Why: Equal min and max prevents any scaling — useful for predictable workloads where the balancer adds unnecessary complexity.*

---

# Architecture Guidelines

- On each cycle: compute target allocation → clamp to `[minProcesses, maxProcesses]` → cap delta to `balanceMaxShift` → execute adds/kills.
- `minProcesses` workers are never killed by the balancer.
- `maxProcesses` is a hard cap — even if the algorithm allocates more, it's stopped.
- `balanceCooldown` is measured from cycle START to next cycle START.
- These parameters are per-supervisor, not global.

---

# Performance Considerations

- Each worker spawn costs ~50-100ms + 20-40MB memory.
- Each worker kill (SIGTERM) is graceful — finishes current job (up to `timeout`), then exits.
- `balanceMaxShift` of N means worst-case N processes added/killed per cycle per queue.
- Memory overhead of idle workers at `minProcesses` is constant — budget for it.
- A sawtooth pattern in process counts indicates oscillation — increase cooldown or decrease max shift.

---

# Security Considerations

- No direct security implications. These parameters control process management within Horizon.
- Setting `maxProcesses` too high can exhaust server memory, causing OOM kills across all processes on the server.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| `minProcesses = 0` | Intending to save memory | Queue may get zero workers — jobs stop processing | Set minProcesses = 1 |
| `maxProcesses` too low | Underestimating load | Persistent queue backlog, cap prevents scaling | Monitor and increase |
| `balanceMaxShift = maxProcesses` | No damping | Single cycle goes from 0 to max workers | Cap shift at 1-2 |
| Not tuning per workload | Same config for all queues | Bursty and steady workloads both misconfigured | Tune per supervisor |

---

# Anti-Patterns

- **Ignoring oscillation:** Not monitoring process count graphs — oscillation wastes resources and destabilizes worker pool.
- **`maxProcesses` as a performance lever:** Capping processes too low because "workers cost memory" — queue backlog grows, increasing wait time and attracting more workers under `time` strategy.
- **Copy-paste tuning without validation:** Using tuning parameters from a blog post without testing against actual workload patterns.

---

# Examples

```php
// Aggressive for bursty webhooks
'supervisor-webhooks' => [
    'minProcesses' => 2,
    'maxProcesses' => 10,
    'balanceMaxShift' => 2,
    'balanceCooldown' => 3,
],

// Conservative for email processing
'supervisor-emails' => [
    'minProcesses' => 1,
    'maxProcesses' => 5,
    'balanceMaxShift' => 1,
    'balanceCooldown' => 5,
],

// Static allocation (disabled balancing)
'supervisor-reports' => [
    'balance' => 'simple',
    'minProcesses' => 3,
    'maxProcesses' => 3, // equals minProcesses — static
],
```

---

# Related Topics

- **K041 Horizon Supervisor Configuration (K041)** — Supervisor definition context
- **K042 Auto Balancing with `time` Strategy (K042)** — Balancing algorithm using these parameters
- **K043 Simple and No Balancing Modes (K043)** — Alternatives to auto balancing

---

# AI Agent Notes

- When generating Horizon config, always set `minProcesses` to at least 1 to prevent queue starvation.
- Base `maxProcesses` on available memory — each worker needs ~20-40MB. For a 4GB server, max ~100 workers total across all supervisors.
- For bursty workloads, recommend `balanceMaxShift = 2` and `balanceCooldown = 3`. For steady workloads, `balanceMaxShift = 1` and `balanceCooldown = 5`.
- Warn users about oscillation — if process count shows a sawtooth pattern, increase `balanceCooldown` or decrease `balanceMaxShift`.

---

# Verification

- [ ] `minProcesses` baseline maintained — verify workers never drop below minimum
- [ ] `maxProcesses` cap respected — verify workers never exceed maximum under load
- [ ] `balanceMaxShift` limits per-cycle change — verify delta never exceeds configured value
- [ ] `balanceCooldown` interval respected — verify cycle frequency matches configured cooldown
- [ ] No oscillation — verify process count graph is smooth, not sawtooth
