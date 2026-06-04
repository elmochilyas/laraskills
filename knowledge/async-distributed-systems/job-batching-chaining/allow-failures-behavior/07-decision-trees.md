# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Job Batching & Chaining
**Knowledge Unit:** K012 — allowFailures Behavior
**Generated:** 2026-06-03

---

# Decision Inventory

* allowFailures() vs Default Batch Failure Behavior

---

# Architecture-Level Decision Trees

---

## allowFailures() vs Default Batch Failure Behavior

---

### Decision Context

Whether to call `allowFailures()` on a batch, allowing some jobs to fail while others continue.

---

### Decision Criteria

* Job independence within the batch
* Criticality of each job to the overall result
* Need for partial success tolerance

---

### Decision Tree

A single job failure should not cancel other jobs?
YES → Use allowFailures() — independent work units
NO → All jobs must succeed for the batch to be useful?
    YES → Default behavior — first failure cancels remaining jobs
NO → Mixed — some failures acceptable, some not?
    YES → Use allowFailures() + manual checking in callbacks

---

### Rationale

Without `allowFailures()`, a single job failure cancels the entire batch — remaining jobs never run. With `allowFailures()`, other jobs continue after a failure. The `catch()` callback fires when the batch finishes with at least one failure.

---

### Recommended Default

**Default:** Call `allowFailures()` when batch jobs are truly independent (one image processing failure shouldn't cancel others); don't call it when all jobs are required
**Reason:** Independent work units should not be coupled by failure handling. One failed email should not prevent other emails from sending.

---

### Risks Of Wrong Choice

- Not calling allowFailures() for independent jobs: single failure cancels all remaining work
- Calling allowFailures() for dependent jobs: downstream jobs process incomplete data
- catching failures without allowFailures(): catch fires but remaining jobs are already cancelled

---

### Related Rules

- use-allow-failures-for-partial-success

---

### Related Skills

- Implement Job Batching and Chaining
