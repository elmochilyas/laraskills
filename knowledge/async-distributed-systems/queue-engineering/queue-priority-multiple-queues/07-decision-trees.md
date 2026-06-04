# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** K077 — Queue Priority via Multiple Queues
**Generated:** 2026-06-03

---

# Decision Inventory

* Number of Priority Tiers
* Dedicated vs Shared Supervisor per Tier
* SQS Priority Handling vs Redis

---

# Architecture-Level Decision Trees

---

## Number of Priority Tiers

---

### Decision Context

How many priority queue tiers to define. Too few causes head-of-line blocking; too many creates operational overhead with diminishing returns.

---

### Decision Criteria

* Distinct latency requirements across job types
* Operational complexity per tier
* Worker configuration overhead
* Monitoring and alerting granularity

---

### Decision Tree

Number of distinct latency tiers in application?
1 → Single queue — no priority needed
2 → critical + default — minimum viable priority
3 → critical + default + bulk — optimal balance
4+ → 3 tiers sufficient — consolidate
    Exception: extreme workload diversity may justify 4

---

### Rationale

3 tiers (critical, default, bulk) covers the vast majority of applications. Critical = user-facing (<5s), Default = standard (<30s), Bulk = batch (<1h). Beyond 3, operational complexity increases faster than benefits.

---

### Recommended Default

**Default:** 3 priority tiers: critical, default, bulk
**Reason:** Covers user-facing, standard, and background workloads with clear boundaries. Beyond 3, complexity exceeds benefit.

---

### Risks Of Wrong Choice

- Too few (1): slow batch jobs block time-sensitive operations
- Too many (>3): worker config explosion, monitoring overload, unclear assignment

---

### Related Rules

- name-queues-by-workload-characteristic
- define-topology-before-deploying

---

### Related Skills

- Configure Queue Priority via Multiple Queue Names
- Design Queue Topology with Connections and Queues

---

## Dedicated vs Shared Supervisor per Tier

---

### Decision Context

Whether to use one shared Horizon supervisor for all priority tiers or dedicated supervisors per tier.

---

### Decision Criteria

* Workload isolation requirements
* Resource allocation per tier
* Failure domain boundaries
* CPU-bound vs I/O-bound job mix

---

### Decision Tree

CPU-intensive jobs exist alongside latency-sensitive jobs?
YES → Separate supervisors per tier required
NO → High throughput on any tier (>1000 jobs/hour)?
    YES → Separate supervisors recommended
    NO → Shared supervisor acceptable with priority ordering

---

### Rationale

Shared supervisors mean a single worker pool serves all queues — a flood of high-priority jobs can starve low-priority ones, and CPU-heavy jobs block latency-sensitive ones. Separate supervisors guarantee minimum throughput per tier.

---

### Recommended Default

**Default:** Dedicated Horizon supervisor per priority tier
**Reason:** Independent minProcesses/maxProcesses and balance settings per tier, preventing starvation and workload interference.

---

### Risks Of Wrong Choice

- Shared supervisor: priority flood starves lower tiers
- CPU-bound + latency-sensitive on same supervisor: blocking issues
- No minimum processes for critical tier: processing delays during low load

---

### Related Rules

- name-queues-by-workload-characteristic

---

### Related Skills

- Configure Queue Priority via Multiple Queue Names
- Configure Horizon for Production

---

## SQS Priority Handling vs Redis

---

### Decision Context

How to implement queue priority when using SQS vs Redis as the queue driver. SQS has fundamental limitations that change the priority architecture.

---

### Decision Criteria

* Driver type (SQS vs Redis)
* Number of priority tiers
* Worker management overhead
* Infrastructure cost

---

### Decision Tree

Driver is SQS?
YES → Create separate SQS queue URLs per priority tier
    Assign dedicated worker processes per URL
NO → Driver is Redis?
    YES → Use comma-separated --queue=critical,default,bulk on workers
NO → Other driver?
    YES → Check driver's multi-queue support

---

### Rationale

SQS does not support multiple logical queues on one URL. Each priority level requires a separate SQS queue URL and separate workers. Redis supports comma-separated `--queue=` for priority ordering within a single connection.

---

### Recommended Default

**Default:** Redis with comma-separated `--queue=critical,default,bulk` for priority
**Reason:** Simple, zero-infrastructure priority ordering. SQS requires dedicated URLs and workers per tier, increasing operational overhead.

---

### Risks Of Wrong Choice

- SQS with `--queue=high,default`: only first queue is ever processed
- Assuming preemptive priority: current job finishes before priority takes effect
- Same workers for CPU + latency-sensitive: blocking issues

---

### Related Rules

- name-queues-by-workload-characteristic
- define-topology-before-deploying

---

### Related Skills

- Configure Queue Priority via Multiple Queue Names
- Select and Configure the Right Queue Driver
