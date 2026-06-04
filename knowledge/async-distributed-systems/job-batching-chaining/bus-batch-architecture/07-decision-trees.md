# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Job Batching & Chaining
**Knowledge Unit:** K008 — Bus::batch Architecture
**Generated:** 2026-06-03

---

# Decision Inventory

* Batch vs Sequential Dispatch
* Batch Size Limit

---

# Architecture-Level Decision Trees

---

## Batch vs Sequential Dispatch

---

### Decision Context

Whether to use `Bus::batch` (parallel orchestration) or sequential dispatch for independent jobs.

---

### Decision Criteria

* Job independence (can jobs run in parallel?)
* Need for completion tracking
* Job count (small vs large numbers)
* State management requirements

---

### Decision Tree

Jobs are independent and can run in parallel?
YES → Need completion notification (then/catch/finally)?
    YES → Use Bus::batch
NO → Fewer than 5 jobs?
    YES → Direct dispatch is simpler
NO → More than 5 jobs?
    YES → Use Bus::batch for tracking
NO → Jobs must run sequentially?
    YES → Use Bus::chain
NO → Jobs need shared state?
    YES → Batch is not suitable — jobs are independent
        Use single job that handles all state

---

### Rationale

Batch dispatches all jobs in parallel and tracks completion via a database row. It's ideal for scatter-gather patterns where independent work units run in parallel and a callback fires when all complete. For small numbers of jobs, direct dispatch is simpler.

---

### Recommended Default

**Default:** Use `Bus::batch` for parallel independent work with completion tracking; direct dispatch for <5 jobs without tracking needs
**Reason:** Batches provide progress tracking, completion callbacks, and failure handling that direct dispatch lacks.

---

### Risks Of Wrong Choice

- Batch for <5 jobs: unnecessary overhead (DB row, lock contention)
- Sequential dispatch for parallel work: order-of-magnitude slower completion
- Batch for sequential work: race conditions, ordering not guaranteed

---

### Related Rules

- keep-batch-sizes-under-10000
- use-allow-failures-for-partial-success

---

### Related Skills

- Implement Job Batching and Chaining

---

## Batch Size Limit

---

### Decision Context

Choosing the maximum number of jobs in a single batch.

---

### Decision Criteria

* job_batches row lock contention
* failed_job_ids JSON column growth
* Callback serialization payload size
* Worker capacity

---

### Decision Tree

Batch size < 10,000 jobs?
YES → Standard case — proceed
NO → Need larger batch?
    YES → Split into multiple batches with coordinator
NO → Each job completion triggers progress callback?
    YES → Keep batch under 1,000 — reduce callback overhead
NO → Default?
    YES → Keep batches under 10,000

---

### Rationale

Each job completion acquires a row lock on the `job_batches` table. At high concurrency, this serializes on a single DB row. The `failed_job_ids` JSON column grows with each failed job. Batches over 10,000 experience measurable lock contention and storage bloat.

---

### Recommended Default

**Default:** Keep batch sizes under 10,000 jobs; split larger workloads into multiple coordinated batches
**Reason:** Avoids row lock contention and failed_job_ids column bloat. Multiple batches can run in parallel with a coordinator.

---

### Risks Of Wrong Choice

- Batch >10,000: lock contention serializes all job completion, throughput drops
- Batch >10,000 with many failures: failed_job_ids JSON column grows large, slow DB operations
- No pruning: job_batches table grows unbounded without queue:prune-batches

---

### Related Rules

- keep-batch-sizes-under-10000
- prune-old-batches-regularly

---

### Related Skills

- Implement Job Batching and Chaining
