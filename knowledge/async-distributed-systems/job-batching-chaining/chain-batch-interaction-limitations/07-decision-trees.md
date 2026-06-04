# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Job Batching & Chaining
**Knowledge Unit:** K089 — Chain-Batch Interaction Limitations
**Generated:** 2026-06-03

---

# Decision Inventory

* Batch-of-Chains vs Flat Batch with Ordering
* Chain-of-Batches vs Sequential Batches

---

# Architecture-Level Decision Trees

---

## Batch-of-Chains vs Flat Batch with Ordering

---

### Decision Context

Whether to use nested batch-of-chains (`Bus::batch([[$a1, $a2], [$b1, $b2]])`) or a flat batch with ordering constraints handled in job code.

---

### Decision Criteria

* Need for sequential execution within each batch group
* finally() callback reliability
* Monitoring requirements
* Recovery complexity

---

### Decision Tree

Reliable finally() callback needed?
YES → Use flat batch with ordering in job code — avoids the finally() bug entirely
NO → Short sequences (2-3 jobs) within each group?
    YES → Flat batch — flatten chains into individual jobs, handle ordering in job code
NO → Long sequences with strict ordering?
    YES → Separate batches per chain — more reliable than batch-of-chains

---

### Rationale

Batch-of-chains has known bugs: `finally()` never fires on mid-chain failure, abandoned jobs permanently skew `pending_jobs`. Flat batches avoid these issues entirely. For sequential needs, handle ordering within individual job `handle()` methods.

---

### Recommended Default

**Default:** Use flat batch (individual jobs) for parallel work; use separate batches per chain for ordered groups; avoid batch-of-chains in production
**Reason:** Batch-of-chains has unreliable callbacks and abandoned-jobs bugs. Flat batches and per-chain batches work correctly.

---

### Risks Of Wrong Choice

- finally() never fires: cleanup skipped silently
- Abandoned jobs: pending_jobs never reaches 0 — batch stuck permanently
- No monitoring: stuck batches go undetected until manual investigation

---

### Related Rules

- replace-batch-of-chains-with-separate-batches
- implement-watchdog-for-unfinished-batches

---

### Related Skills

- Implement Job Batching and Chaining

---

## Chain-of-Batches vs Sequential Batches

---

### Decision Context

Whether to use `Bus::chain([Bus::batch([$a, $b]), Job2])` (chain-of-batches) or run batches sequentially with a coordinator.

---

### Decision Criteria

* Need for inner batch completion before next step
* Inner batch failure propagation
* Monitoring simplicity

---

### Decision Tree

Next step depends on ALL inner batch jobs completing?
YES → Chain-of-batches works — chain advances after each batch completes
NO → Need inner batch failure to stop the outer chain?
    YES → Chain-of-batches does NOT propagate inner batch failures — manually check batch state in Job2
NO → Simple sequential batches?
    YES → Run batches with coordinator (separate jobs that check and advance)

---

### Rationale

Chain-of-batches advances to the next step when the batch job completes, but a batch job "completes" even when the inner batch has failures. The outer chain only sees the batch job's success/failure status — it doesn't know about partial inner batch failures.

---

### Recommended Default

**Default:** Use sequential batches with a coordinator for production; chain-of-batches only when inner batch failure doesn't affect downstream steps
**Reason:** The chain doesn't propagate inner batch failure context. A coordinator job can check batch state explicitly and decide whether to proceed.

---

### Risks Of Wrong Choice

- Chain-of-batches advancing on partial failure: downstream job processes incomplete data
- allowFailures() not preventing chain advance: outer chain unaware of inner failures
- No explicit batch state check in downstream job: silently processes potentially bad data

---

### Related Rules

- replace-batch-of-chains-with-separate-batches
- implement-watchdog-for-unfinished-batches

---

### Related Skills

- Implement Job Batching and Chaining
