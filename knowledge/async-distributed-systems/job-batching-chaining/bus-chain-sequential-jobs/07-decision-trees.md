# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Job Batching & Chaining
**Knowledge Unit:** K013 — Bus::chain Sequential Jobs
**Generated:** 2026-06-03

---

# Decision Inventory

* Bus::chain vs Sequential Single Job for Ordered Processing
* Chain Failure Handling Strategy

---

# Architecture-Level Decision Trees

---

## Bus::chain vs Sequential Single Job for Ordered Processing

---

### Decision Context

Whether to use `Bus::chain` for sequential job execution or implement ordering within a single job.

---

### Decision Criteria

* Number of sequential steps
* Step independence (can they be separate job classes?)
* Step failure isolation
* Step reusability

---

### Decision Tree

Steps are independent operations (different concerns)?
YES → Each step is reusable elsewhere?
    YES → Use Bus::chain — separate job classes
NO → 2-3 simple steps that are always together?
    YES → Single job with sequential logic is simpler
NO → Steps share state extensively?
    YES → Single job — chains pass no shared state
NO → Need failure isolation per step?
    YES → Use Bus::chain with individual catch handling

---

### Rationale

`Bus::chain` dispatches jobs sequentially — each job runs after the previous succeeds. Jobs in a chain are independent classes with their own testing and retry configuration. A single job with sequential steps is simpler for tightly coupled operations.

---

### Recommended Default

**Default:** Use `Bus::chain` for loosely coupled sequential operations; a single job for tightly coupled sequential steps
**Reason:** Chains provide per-step job isolation, independent retry, and testability. Single jobs are simpler for tightly coupled workflows.

---

### Risks Of Wrong Choice

- Chain for tightly coupled steps: unnecessary job overhead, no shared state
- Single job for independent steps: poor isolation, one failure restarts all
- Chain with state dependency: chain jobs cannot share in-memory state — must pass data via payload

---

### Related Rules

- replace-batch-of-chains-with-separate-batches
- implement-watchdog-for-unfinished-batches

---

### Related Skills

- Implement Job Batching and Chaining

---

## Chain Failure Handling Strategy

---

### Decision Context

How to handle failures in a chain — whether subsequent jobs should run after a failure.

---

### Decision Criteria

* Criticality of subsequent steps
* Data consistency requirements
* Compensation mechanism availability

---

### Decision Tree

A job in chain fails — should remaining jobs run?
YES → Implement per-job error handling within each job (try/catch)
NO → All steps must succeed?
    YES → Default chain behavior — abort on failure
NO → Need to run compensation on failure?
    YES → Implement failed() method on chain jobs

---

### Rationale

By default, a chain aborts when any job fails — subsequent jobs never run. This is correct for all-or-nothing workflows. For workflows where partial progress is acceptable, individual jobs should handle their own errors internally.

---

### Recommended Default

**Default:** Let chains abort on failure (default behavior); use individual job error handling only when partial progress is acceptable
**Reason:** Chain failures typically indicate a problem that makes subsequent steps meaningless. Aborting prevents work on invalid state.

---

### Risks Of Wrong Choice

- Not aborting on failure: subsequent jobs operate on incomplete/invalid state
- Aborting when partial progress is acceptable: unnecessary rework when restarted
- No failed() method: no cleanup when chain aborts

---

### Related Rules

- replace-batch-of-chains-with-separate-batches
- implement-watchdog-for-unfinished-batches

---

### Related Skills

- Implement Job Batching and Chaining
- Set Up Queue Failure Handling and Retries
