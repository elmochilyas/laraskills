# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Horizon Scaling
**Knowledge Unit:** horizon-tuning-parameters
**Generated:** 2026-06-03

---

# Decision Inventory

* Horizon Memory and Performance Tuning

---

# Architecture-Level Decision Trees

---

## Horizon Memory and Performance Tuning

---

### Decision Context

Tuning Horizon's `memory`, `wait`, and `tries` parameters for optimal performance.

---

### Decision Criteria

* Available server memory
* Worker per-process memory footprint
* Acceptable job wait time
* Retry policy requirements

---

### Decision Tree

Available memory per worker is constrained (<128MB)?
YES → Set `memory` limit per worker (e.g., 64MB)
NO → Workers run memory-intensive jobs?
    YES → Set higher `memory` limit (256MB+)
NO → Need to limit job wait time for fresh data?
    YES → Set `wait` timeout shorter than data validity window
NO → Default?
    YES → Use Horizon defaults (128MB memory, 60s wait)

---

### Rationale

The `memory` setting controls per-worker memory limit (checked after each job). `wait` controls how long Horizon waits between job polling iterations. Tuning these balances worker longevity with throughput.

---

### Recommended Default

**Default:** `memory=128`, `wait=60` for standard workloads; adjust based on observed RSS and latency requirements
**Reason:** 128MB is conservative for most workers. 60s wait balances polling overhead with job discovery latency.

---

### Risks Of Wrong Choice

- memory too low: worker killed despite normal memory usage
- memory too high: worker runs until OOM — process crash
- wait too short: excessive polling overhead, CPU waste
- wait too long: jobs wait unnecessarily before processing

---

### Related Rules

- set-both-max-jobs-and-max-time

---

### Related Skills

- Tune Horizon Performance Parameters
- Configure Horizon Supervisor Settings
