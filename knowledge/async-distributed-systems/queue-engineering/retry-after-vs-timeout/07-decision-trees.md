# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Worker Management
**Knowledge Unit:** retry-after-vs-timeout
**Generated:** 2026-06-03

---

# Decision Inventory

* retry_after vs --timeout Configuration

---

# Architecture-Level Decision Trees

---

## retry_after vs --timeout Configuration

---

### Decision Context

Setting `retry_after` (queue backend timeout) vs `--timeout` (worker timeout) — two separate timeout mechanisms that interact.

---

### Decision Criteria

* Job execution time distribution
* SQS visibility timeout (for SQS driver)
* Worker SIGALRM behavior
* Double-processing tolerance

---

### Decision Tree

Driver is Redis?
YES → --timeout must be <= retry_after - 15 (safety margin)
NO → Driver is SQS?
    YES → retry_after must be <= SQS visibility timeout - 5
        --timeout must be <= retry_after - 10
NO → Driver is database?
    YES → --timeout must be <= retry_after

---

### Rationale

`retry_after` controls when the queue backend releases a reserved job for another worker. `--timeout` controls how long the worker lets a job run before killing it. `--timeout` must always be shorter than `retry_after` to prevent the backend from releasing a job while the worker is still processing it.

---

### Recommended Default

**Default:** `retry_after=90`, `--timeout=60` for Redis (30s safety margin)
**Reason:** 60-second worker timeout covers most jobs; 90-second retry_after provides 30s buffer before backend releases the job.

---

### Risks Of Wrong Choice

- --timeout > retry_after: worker killed by SIGALRM, but backend already released job — double processing
- retry_after > SQS visibility timeout: SQS releases message before Laravel considers job failed — double processing
- No --timeout set: worker runs forever on stuck job, never recycles

---

### Related Rules

- retry-after-exceeds-longest-job
- set-timeout-less-than-retry_after

---

### Related Skills

- Configure Worker Daemon and Process Management
- Set Up Queue Failure Handling and Retries
