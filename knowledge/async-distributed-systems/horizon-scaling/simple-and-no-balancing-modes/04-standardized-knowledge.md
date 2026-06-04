# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Horizon Scaling & Monitoring
- **Knowledge Unit:** K043 — Simple and No Balancing Modes
- **Knowledge ID:** K043
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Horizon: Balancing Strategies
  - Laravel Source — `Laravel\Horizon\Supervisor`

---

# Overview

Beyond `auto` balancing, Horizon offers `simple` and `false` balancing modes. **`simple`** distributes workers evenly across all configured queues (round-robin). **`false`** (no balancing) runs a fixed number of processes per queue, defined by the `processes` setting. `simple` is useful when all queues should get equal attention regardless of depth. `false` is for fixed-capacity workloads where each queue has a dedicated, non-negotiable allocation.

---

# Core Concepts

- **`simple` balancing:** Workers are evenly distributed among queues. If a supervisor has `minProcesses=4` and 2 queues, each gets 2 workers.
- **`false` balancing:** No dynamic scaling. The `processes` setting determines exact worker count per supervisor, shared equally among queues.
- **Fixed vs dynamic:** `simple` still scales total processes within `minProcesses`/`maxProcesses`. `false` is static.
- **`processes`:** Required with `balance: false`. Sets total number of worker processes for that supervisor.

---

# When To Use

- **`simple`:** Equal-priority queues, symmetric workloads, fairness-focused allocation
- **`false`:** SLA-bound queues with guaranteed capacity requirements, queues needing predictable minimum throughput
- Hybrid approach via multiple supervisors mixing strategies for different queue groups

---

# When NOT To Use

- Variable-load queues needing priority-aware allocation — use `auto` with `time` strategy
- Queues with very different job durations — `simple` distributes by count, not by load
- Dynamic scaling requirements — `false` provides no scaling; `simple` only scales within min/max bounds

---

# Best Practices

- **Set `minProcesses = maxProcesses` with `simple` to simulate `false` with even distribution.** No scaling events, but distributed evenly. *Why: This pattern gives you even distribution without the overhead of scaling cycles.*
- **Prefer `false` for SLA-critical queues with over-provisioned `processes`.** Guarantee headroom for critical job throughput. *Why: `false` mode guarantees dedicated capacity — no other queue can borrow workers.*
- **Avoid `simple` when job durations vary significantly.** One queue's 10s jobs lock workers while another queue's 100ms jobs complete quickly — even allocation becomes effectively uneven. *Why: Round-robin allocation doesn't account for job duration — fast jobs on one queue consume little time, making workers appear idle.*
- **Use `auto` for most general-purpose workloads.** `simple` and `false` are special cases. *Why: `auto` with `time` strategy provides load-aware allocation that adapts to real-time conditions.*

---

# Architecture Guidelines

- `simple` starts at `minProcesses` workers, distributes round-robin, and scales up to `maxProcesses`.
- `false` starts exactly `processes` workers — no more, no less. No scaling events.
- In both modes, each worker polls its assigned queue (not all queues).
- `simple` scales down by removing workers from the least-loaded queue first.
- `false` mode does NOT support `minProcesses`/`maxProcesses` — only `processes`.

---

# Performance Considerations

- `simple`: Process overhead is predictable — always between `minProcesses` and `maxProcesses`.
- `false`: Most predictable resource usage. No scaling events, no cycle overhead.
- `simple` with uneven job durations can waste capacity — one queue's long jobs keep workers busy while short-queue workers idle.
- `false` with idle queue: Workers idle if assigned queue is empty. They cannot process other queues' jobs.

---

# Security Considerations

- Neither mode has direct security implications. Both manage process allocation within configured bounds.
- Over-provisioning workers with `false` mode can exhaust server resources if not carefully configured.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| `simple` for unequal priority queues | Expecting load-aware distribution | All queues get equal resources regardless of priority | Use `auto` with `time` strategy |
| `false` without `processes` | Omitting required setting | Horizon configuration error | Always set `processes` with `balance: false` |
| Expecting load-based distribution from `simple` | Misunderstanding algorithm | Uneven actual allocation due to varying job durations | Use `auto` if load awareness is needed |
| `simple` with very different job durations | Same worker count for fast and slow queues | Fast queue workers appear idle, slow queue workers saturated | Use separate supervisors per duration profile |

---

# Anti-Patterns

- **`false` mode with no capacity headroom:** Setting `processes` exactly matching average throughput — any spike creates backlog with no scaling ability.
- **`simple` mode with 10+ queues:** Worker allocation per queue becomes very small (2 workers for 10 queues = ~0.2 workers/queue effectively).
- **Assuming `simple` distributes fairly under all conditions:** Job duration variance makes round-robin allocation effectively uneven.

---

# Examples

```php
// Simple balancing — even distribution
'supervisor-notifications' => [
    'connection' => 'redis',
    'queue' => ['emails', 'push', 'sms'],
    'balance' => 'simple',
    'minProcesses' => 3,
    'maxProcesses' => 6,
    'tries' => 3,
    'timeout' => 60,
],

// No balancing — fixed capacity
'supervisor-reports' => [
    'connection' => 'redis',
    'queue' => ['reports'],
    'balance' => false,
    'processes' => 2,
    'tries' => 1,
    'timeout' => 600,
],

// Simulating false with even distribution (no scaling)
'supervisor-background' => [
    'connection' => 'redis',
    'queue' => ['cleanup', 'analytics'],
    'balance' => 'simple',
    'minProcesses' => 4,
    'maxProcesses' => 4, // same as min — no scaling
    'tries' => 1,
    'timeout' => 300,
],
```

---

# Related Topics

- **K041 Horizon Supervisor Configuration (K041)** — Supervisor definition context
- **K042 Auto Balancing with `time` Strategy (K042)** — Auto balancing alternative
- **K044 Horizon Tuning Parameters (K044)** — minProcesses, maxProcesses detailed tuning

---

# AI Agent Notes

- When generating config for SLA-critical queues, use `balance: false` with explicit `processes` count.
- For simple round-robin requirements, generate `balance: simple` with `minProcesses` and `maxProcesses`.
- Document that `simple` distributes by count, not by load — fast and slow jobs are treated equally in allocation.
- `false` mode requires `processes` — omitting it causes a configuration error.

---

# Verification

- [ ] `simple` mode distributes workers evenly — verify each configured queue has expected worker count
- [ ] `false` mode uses fixed `processes` — verify worker count never changes under load
- [ ] No scaling events in `false` mode — verify Horizon logs show no scaling events for that supervisor
- [ ] `simple` scales within `minProcesses`/`maxProcesses` — verify bounds are respected
