# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Worker Management
**Knowledge Unit:** K058 — max-jobs / max-time Worker Recycling
**Generated:** 2026-06-03

---

# Decision Inventory

* max-jobs Value Selection
* max-time Value Selection

---

# Architecture-Level Decision Trees

---

## max-jobs Value Selection

---

### Decision Context

Choosing the `--max-jobs` value that determines how many jobs a worker processes before recycling.

---

### Decision Criteria

* Per-job memory leak rate
* Job execution time per job
* Desired restart frequency
* Supervisor autorestart reliability

---

### Decision Tree

Jobs have measurable memory growth?
YES → How many jobs until worker exceeds safe memory?
    Set --max-jobs to 50-70% of that number
NO → Jobs are long-running (>30 seconds each)?
    YES → Lower --max-jobs (100-200) to keep recycling cycle reasonable
NO → Jobs are fast (<1 second)?
    YES → Higher --max-jobs (500-1000) — more throughput between recycles
NO → Default safe value?
    YES → --max-jobs=500

---

### Rationale

Each job may leak a small amount of memory. At 1MB per job and a 500MB worker limit, 500 jobs fills the worker. `--max-jobs` sets a ceiling on total memory accumulation from per-job leaks.

---

### Recommended Default

**Default:** `--max-jobs=500` for most workers; lower (100-200) for memory-intensive jobs; higher (1000) for fast, clean jobs
**Reason:** 500 jobs balances throughput with safety. Adjust based on observed memory growth per job.

---

### Risks Of Wrong Choice

- Too high: worker OOMs before limit reached
- Too low: excessive restarts, reduced throughput from constant recycling
- Not set (default): worker runs until OOM — uncontrolled crash

---

### Related Rules

- set-both-max-jobs-and-max-time
- always-use-queue-work-in-production

---

### Related Skills

- Configure Worker Daemon and Process Management

---

## max-time Value Selection

---

### Decision Context

Choosing the `--max-time` value that determines how long a worker runs before recycling.

---

### Decision Criteria

* Slow memory leak rate (MB/hour)
* Daily traffic patterns
* Job execution time distribution
* Desired max worker lifetime

---

### Decision Tree

Slow memory leak present (~10MB/hour)?
YES → Set --max-time such that worker recycles before hitting --memory limit
NO → Jobs accumulate stale state over time (connections, caches)?
    YES → Set --max-time=3600-7200 (1-2 hours)
NO → Jobs are clean, state doesn't accumulate?
    YES → Set --max-time=14400 (4 hours) — standard default
NO → Default safe value?
    YES → --max-time=14400

---

### Rationale

Even without per-job leaks, some PHP extensions and libraries accumulate memory over time. Opcache may hold stale cache entries. Database connections may accumulate prepared statements. `--max-time` ensures the worker is periodically recycled with fresh state.

---

### Recommended Default

**Default:** `--max-time=14400` (4 hours) for most workers; reduce to 3600-7200 if slow leaks are observed
**Reason:** 4 hours catches most slow accumulation patterns without excessive restarts.

---

### Risks Of Wrong Choice

- Too high: slow leak reaches critical level before recycling
- Too low: excessive restarts during peak traffic — queue backlog
- Not set: worker could run for days — stale state, memory accumulation

---

### Related Rules

- set-both-max-jobs-and-max-time
- always-use-queue-work-in-production

---

### Related Skills

- Configure Worker Daemon and Process Management
- Configure Worker Memory Management
