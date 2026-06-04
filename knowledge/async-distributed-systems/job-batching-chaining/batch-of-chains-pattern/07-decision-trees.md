# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Job Batching & Chaining
**Knowledge Unit:** K014 — Batch of Chains Pattern
**Generated:** 2026-06-03

---

# Decision Inventory

* Batch-of-Chains vs Separate Batches
* Chain Failure Handling in Batch Context

---

# Architecture-Level Decision Trees

---

## Batch-of-Chains vs Separate Batches

---

### Decision Context

Whether to use `Bus::batch([[$a1, $a2], [$b1, $b2]])` (batch-of-chains) or dispatch separate batches.

---

### Decision Criteria

* Need for finally() callback
* Chain failure tolerance
* Monitoring complexity
* Recovery requirements

---

### Decision Tree

Need finally() to run after all chains complete?
YES → Use separate batches — finally() has known bug in batch-of-chains (never fires on mid-chain failure)
NO → Chains must be coordinated under a single batch ID?
    YES → Batch-of-chains acceptable with then()+catch() (avoid finally())
NO → Chains are independent (different business contexts)?
    YES → Separate batches — simpler, more reliable
NO → Default?
    YES → Use separate batches — avoid composition complexity

---

### Rationale

Batch-of-chains combines parallel batch execution with sequential chain execution within each batch. It has a known bug where `finally()` never fires on mid-chain failure. Separate batches avoid this issue entirely and provide clearer failure isolation.

---

### Recommended Default

**Default:** Use separate batches with individual callbacks; avoid batch-of-chains for production-critical workflows
**Reason:** The finally() bug and abandoned-jobs problem make batch-of-chains unreliable. Separate batches are simpler and work correctly.

---

### Risks Of Wrong Choice

- finally() never firing: post-batch cleanup skipped silently
- Abandoned jobs: chain jobs after a failure are never dispatched but count as pending
- Stuck batches: pending_jobs never reaches 0 — batch never finishes

---

### Related Rules

- replace-batch-of-chains-with-separate-batches
- implement-watchdog-for-unfinished-batches

---

### Related Skills

- Implement Job Batching and Chaining

---

## Chain Failure Handling in Batch Context

---

### Decision Context

How to handle a chain job failure within a batch-of-chains.

---

### Decision Criteria

* Chain abort behavior
* Batch failure tracking
* Remaining chain jobs disposition

---

### Decision Tree

A chain job fails mid-chain — should remaining jobs in the same chain run?
YES → Implement manual error handling within each chain job (try/catch)
NO → Chain aborts — should the other chains in the batch continue?
    YES → This is default — other chains proceed independently
NO → All chains must succeed completely?
    YES → Use separate batches with coordinator pattern

---

### Rationale

When a chain job fails, the chain aborts (subsequent jobs in that chain never run). Other chains in the batch continue independently. The abandoned jobs (chain jobs that never ran) remain in the serialized chain structure but never decrement `pending_jobs`.

---

### Recommended Default

**Default:** Accept chain abort behavior in batch-of-chains; use then()+catch() for batch-level notification
**Reason:** Chain abort is default behavior and cannot be changed. The batch tracks the failure correctly even though pending_jobs may be permanently skewed.

---

### Risks Of Wrong Choice

- Not accounting for abandoned jobs: pending_jobs never reaches 0 — batch never finishes
- finally() expecting all jobs ran: never fires due to abandoned jobs
- No watchdog: stuck batches go undetected

---

### Related Rules

- replace-batch-of-chains-with-separate-batches
- implement-watchdog-for-unfinished-batches

---

### Related Skills

- Implement Job Batching and Chaining
