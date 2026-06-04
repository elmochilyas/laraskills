# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Worker Management
**Knowledge Unit:** K074 — Worker Memory Management
**Generated:** 2026-06-03

---

# Decision Inventory

* --memory Limit Setting
* Worker Memory Leak Detection Strategy

---

# Architecture-Level Decision Trees

---

## --memory Limit Setting

---

### Decision Context

Setting the `--memory` limit for `queue:work` that kills workers exceeding the threshold.

---

### Decision Criteria

* Baseline worker memory usage (~20MB)
* Per-job memory growth
* PHP memory_limit setting
* Recycling limits already configured

---

### Decision Tree

--max-jobs and --max-time already set?
YES → --memory is a safety net — set to 128MB (default) or higher
NO → --memory is primary defense — set aggressively (64-128MB)
NO → Jobs are memory-intensive (large file processing)?
    YES → Set --memory higher (256-512MB) based on observed RSS

---

### Rationale

`--memory` is checked AFTER each job, not during — a single memory-intensive job can exceed the limit before the check runs. It's a safety net, not primary defense. Primary defense is `--max-jobs` and `--max-time` which trigger proactive recycling.

---

### Recommended Default

**Default:** `--memory=128MB` with `--max-jobs=500` and `--max-time=14400`
**Reason:** 128MB is conservative for most workers. Combined with recycling limits, it provides layered protection against memory leaks.

---

### Risks Of Wrong Choice

- Too low: worker killed after normal memory allocation — unnecessary restarts
- Too high: worker runs until OOM kills the entire PHP process
- No limit: unbounded growth, eventual OOM crash

---

### Related Rules

- set-both-max-jobs-and-max-time
- always-use-queue-work-in-production

---

### Related Skills

- Configure Worker Memory Management
- Configure Worker Daemon and Process Management

---

## Worker Memory Leak Detection Strategy

---

### Decision Context

How to detect and diagnose memory leaks in queue workers.

---

### Decision Criteria

* Observed memory growth pattern
* Job type causing the leak
* Recycling limit effectiveness
* Monitoring tool availability

---

### Decision Tree

Memory grows rapidly (per-job leak)?
YES → Reduce --max-jobs, identify leaky job via process of elimination
NO → Memory grows slowly over hours?
    YES → Set --max-time to recycle before OOM
NO → Memory stabilizes after initial growth?
    YES → Normal behavior — no leak, initial allocation stabilizes
NO → Random OOM with no pattern?
    YES → Check for third-party library leaks, large payload deserialization

---

### Rationale

Worker memory should stabilize after initial connection load. Continuous growth indicates a leak. `--max-jobs` catches rapid leaks by recycling every N jobs. `--max-time` catches slow leaks by recycling after N seconds. Use Horizon metrics or monitoring to track RSS over time.

---

### Recommended Default

**Default:** Monitor RSS via Horizon metrics; set --max-jobs=500 and --max-time=14400 as proactive recycling
**Reason:** Proactive recycling prevents most OOM scenarios. Monitoring identifies jobs that need individual attention.

---

### Risks Of Wrong Choice

- No monitoring: leak goes undetected until OOM crash
- Only relying on --memory: single large job can exceed limit before check
- Ignoring steady growth: slow leak accumulates over hours or days

---

### Related Rules

- set-both-max-jobs-and-max-time

---

### Related Skills

- Configure Worker Memory Management
- Monitor Queue Health and Performance
