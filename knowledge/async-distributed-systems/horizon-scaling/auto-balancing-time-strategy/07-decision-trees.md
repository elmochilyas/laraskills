# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Horizon Scaling
**Knowledge Unit:** auto-balancing-time-strategy
**Generated:** 2026-06-03

---

# Decision Inventory

* Balance Time Window Selection

---

# Architecture-Level Decision Trees

---

## Balance Time Window Selection

---

### Decision Context

Choosing the `balanceTime` and `balanceTimeCooldown` parameters for Horizon's auto-balancing.

---

### Decision Criteria

* Job execution time distribution
* Queue depth fluctuation frequency
* Worker rebalancing overhead tolerance
* Traffic pattern characteristics

---

### Decision Tree

Jobs are fast (<5 seconds)?
YES → Shorter balance time (5-10s) — rebalance quickly to match demand
NO → Jobs are long-running (>30 seconds)?
    YES → Longer balance time (30-60s) — avoid rebalancing mid-job
NO → Traffic has frequent, short spikes?
    YES → Moderate balance time (10-20s) — react without thrashing
NO → Steady, predictable traffic?
    YES → Longer balance time (30s+) — minimize rebalancing overhead

---

### Rationale

`balanceTime` controls how often Horizon evaluates queue loads and reassigns workers. Too short causes thrashing; too long leaves workers on empty queues while other queues have backlogs.

---

### Recommended Default

**Default:** `balanceTime=10` for fast jobs; `balanceTime=30` for long-running jobs
**Reason:** Fast jobs need quick rebalancing to match demand. Long jobs need infrequent rebalancing to avoid interrupting mid-job processing.

---

### Risks Of Wrong Choice

- Too short: workers thrash — frequent reassignment overhead, reduced throughput
- Too long: workers stuck on empty queues while other queues backlog
- No cooldown: rebalance too frequently, no settling time

---

### Related Rules

- use-separate-supervisors-per-priority-tier

---

### Related Skills

- Configure Horizon Supervisor Settings
- Tune Horizon Performance Parameters
