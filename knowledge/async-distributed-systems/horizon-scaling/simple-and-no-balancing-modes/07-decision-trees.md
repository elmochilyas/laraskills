# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Horizon Scaling
**Knowledge Unit:** simple-and-no-balancing-modes
**Generated:** 2026-06-03

---

# Decision Inventory

* Simple vs No vs Auto Balancing Mode

---

# Architecture-Level Decision Trees

---

## Simple vs No vs Auto Balancing Mode

---

### Decision Context

Choosing between Horizon's balancing modes: `simple`, `no`, or `auto`.

---

### Decision Criteria

* Number of queues in the supervisor
* Queue load variability
* Minimum/maximum process configuration
* Predictability of workload

---

### Decision Tree

Single queue processed by supervisor?
YES → Use `no` balancing — all workers on the only queue
NO → Multiple queues with variable load?
    YES → Use `auto` balancing — workers assigned based on backlog
NO → Multiple queues with equal, steady load?
    YES → Use `simple` balancing — round-robin worker distribution
NO → Need min/max process limits per supervisor?
    YES → Use `auto` or `simple` — `no` balancing ignores min/max

---

### Rationale

`no` balancing: all workers process all queues in priority order (useful for single queue). `simple`: workers evenly distributed across queues (round-robin). `auto`: workers dynamically assigned based on queue backlog.

---

### Recommended Default

**Default:** Use `auto` balancing for multi-queue supervisors; `no` balancing for single-queue supervisors
**Reason:** Auto balancing optimizes worker allocation for variable loads. No balancing is simplest for single-queue setups.

---

### Risks Of Wrong Choice

- `no` with multiple queues: all workers process queues in order — no load-based distribution
- `simple` with variable load: equal distribution regardless of queue backlog
- `auto` without min/max: processes may scale to zero — no throughput guarantee

---

### Related Rules

- use-separate-supervisors-per-priority-tier

---

### Related Skills

- Configure Horizon Supervisor Settings
