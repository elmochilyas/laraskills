# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Job Batching & Chaining
**Knowledge Unit:** K009 — Batch State Tracking with Locking
**Generated:** 2026-06-03

---

# Decision Inventory

* Fresh vs Cached Batch State Reads
* Row Lock Contention Mitigation

---

# Architecture-Level Decision Trees

---

## Fresh vs Cached Batch State Reads

---

### Decision Context

Whether to call `$batch->fresh()` (re-read from DB) or use the cached batch object for state checks.

---

### Decision Criteria

* Time since batch was retrieved
* Need for accurate counters
* Database query overhead

---

### Decision Tree

Need accurate pending/failed job counts?
YES → Call $batch->fresh() — re-read from DB
NO → Just checking if batch exists?
    YES → Cached batch is sufficient
NO → Batch may have been updated by another job?
    YES → Call fresh() — cached batch has stale counts

---

### Rationale

The `Batch` object is immutable — it captures state at read time. `fresh()` re-reads from the database to get current counts. For progress reporting, always use `fresh()` to get accurate numbers.

---

### Recommended Default

**Default:** Call `$batch->fresh()` whenever accurate state is needed; cached batch only for simple existence checks
**Reason:** Batch state changes after every job completion. Cached data is immediately stale.

---

### Risks Of Wrong Choice

- Using cached state for decisions: acting on stale counts (e.g., thinking batch is done when it's not)
- Calling fresh() unnecessarily: extra DB query per check — acceptable for human-facing updates, optimize for high-frequency checks

---

### Related Rules

- keep-batch-sizes-under-10000
- prune-old-batches-regularly

---

### Related Skills

- Implement Job Batching and Chaining

---

## Row Lock Contention Mitigation

---

### Decision Context

How to mitigate row lock contention on the `job_batches` table at high concurrency.

---

### Decision Criteria

* Number of concurrent batch jobs
* Batch size
* Completion callback processing time
* Database engine (MySQL, PostgreSQL)

---

### Decision Tree

High concurrency (>100 concurrent jobs completing per second)?
YES → Reduce batch size (<1000) to reduce lock frequency
NO → Each job completion is fast?
    YES → Standard approach — row lock duration is negligible
NO → Batch jobs do expensive post-completion work?
    YES → Move post-completion work to callbacks (not job completion handler)

---

### Rationale

Each job completion updates the `job_batches` row with a `lockForUpdate()` transaction. At high concurrency, these serialize on the single DB row. Smaller batches or spreading across multiple batch rows reduces contention.

---

### Recommended Default

**Default:** Keep batches under 10,000 for standard workloads; under 1,000 for high-concurrency workloads
**Reason:** Smaller batches reduce the number of lock acquisitions per second. High-concurrency workloads need tighter limits.

---

### Risks Of Wrong Choice

- Large batch with high concurrency: lock contention serializes job completions, throughput collapses
- No index on job_batches table: row-level locking scans full table
- Long-running on-completion logic: holds row lock longer, increasing contention

---

### Related Rules

- keep-batch-sizes-under-10000

---

### Related Skills

- Implement Job Batching and Chaining
