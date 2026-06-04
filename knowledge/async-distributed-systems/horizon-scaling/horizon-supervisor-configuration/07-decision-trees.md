# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Horizon Scaling
**Knowledge Unit:** horizon-supervisor-configuration
**Generated:** 2026-06-03

---

# Decision Inventory

* Horizon Supervisor Process Count and Balance Strategy

---

# Architecture-Level Decision Trees

---

## Horizon Supervisor Process Count and Balance Strategy

---

### Decision Context

Configuring `minProcesses` and `maxProcesses` for Horizon supervisors.

---

### Decision Criteria

* Workload type (CPU-bound vs I/O-bound)
* Minimum throughput requirements
* Traffic variability
* Available server resources

---

### Decision Tree

Workload is I/O-bound (API calls, HTTP requests)?
YES → Higher maxProcesses (10-20) — workers spend time waiting for I/O
NO → Workload is CPU-bound (image processing, PDF generation)?
    YES → Lower maxProcesses (2-6) — one per core, avoid context switching
NO → Traffic varies significantly (peak vs off-peak)?
    YES → Use auto-balancing with wide range (min=1, max=10)
NO → Steady, predictable traffic?
    YES → Fixed process count (min=max=numProcs) — no auto-scaling needed

---

### Rationale

CPU-bound jobs benefit from at most one process per core. I/O-bound jobs can have higher concurrency. Auto-balancing adjusts process counts based on queue load — useful for variable traffic patterns.

---

### Recommended Default

**Default:** `minProcesses=1, maxProcesses=8` with `auto` balance for mixed workloads; adjust based on observed CPU utilization
**Reason:** Provides baseline throughput while allowing auto-scaling during traffic spikes. Auto-balance distributes workers across queues based on need.

---

### Risks Of Wrong Choice

- Too many CPU-bound processes: context switching overhead reduces throughput
- minProcesses too high: idle workers consume memory during off-peak
- maxProcesses too low: can't handle traffic spikes

---

### Related Rules

- use-separate-supervisors-per-priority-tier

---

### Related Skills

- Configure Horizon for Production
- Configure Horizon Supervisor Settings

---

## Auto-Balancing vs Fixed Process Count

---

### Decision Context

Whether to use Horizon's auto-balancing or fixed process count per supervisor.

---

### Decision Criteria

* Traffic pattern variability
* Queue workload diversity
* Predictability of resource needs

---

### Decision Tree

Traffic varies significantly by time of day?
YES → Use auto-balancing — adjusts processes based on queue load
NO → Multiple queues with different workload profiles?
    YES → Use auto-balancing — assigns more workers to busier queues
NO → Single queue with steady traffic?
    YES → Fixed process count is simpler and sufficient
NO → Default?
    YES → Use auto-balancing — adapts to changing conditions

---

### Rationale

Auto-balancing dynamically assigns workers to queues based on backlog. Busy queues get more workers; empty queues get fewer. Fixed process counts are simpler for steady-state workloads.

---

### Recommended Default

**Default:** Use auto-balancing for multi-queue setups; fixed process count for single-queue steady-state workloads
**Reason:** Auto-balancing optimizes worker allocation across diverse queues. Fixed counts are simpler when workload is predictable.

---

### Risks Of Wrong Choice

- Fixed with variable traffic: idle workers during off-peak, under-provisioned during peak
- Auto with single queue: unnecessary overhead, no benefit
- Auto without balance timeout tuning: workers change queues too frequently

---

### Related Rules

- use-separate-supervisors-per-priority-tier

---

### Related Skills

- Configure Horizon Supervisor Settings
