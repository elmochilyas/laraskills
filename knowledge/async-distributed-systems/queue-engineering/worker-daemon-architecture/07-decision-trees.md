# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Worker Management
**Knowledge Unit:** K056 — Worker Daemon Architecture
**Generated:** 2026-06-03

---

# Decision Inventory

* queue:work vs queue:listen
* Worker Recycling Limits: max-jobs vs max-time

---

# Architecture-Level Decision Trees

---

## queue:work vs queue:listen

---

### Decision Context

Whether to use `queue:work` (daemon mode) or `queue:listen` (per-job process) for running queue workers.

---

### Decision Criteria

* Performance requirements
* Memory leak tolerance
* Development vs production environment
* State accumulation handling

---

### Decision Tree

Production environment?
YES → Use queue:work — daemon is 5-10x faster
NO → Development environment?
    YES → queue:listen acceptable (simpler, resets state per job)
NO → Debugging memory issues?
    YES → Temporarily use queue:listen to isolate per-job state

---

### Rationale

`queue:work` boots Laravel once and processes jobs in an infinite loop — ~10x faster than `queue:listen` which reboots the framework per job. However, daemon workers accumulate memory and stale state, requiring recycling via `--max-jobs` and `--max-time`.

---

### Recommended Default

**Default:** Always use `queue:work` in production with recycling limits; `queue:listen` only for local development
**Reason:** Daemon mode is dramatically more efficient. Recycling handles the memory accumulation trade-off.

---

### Risks Of Wrong Choice

- queue:listen in production: 5-10x slower, unnecessary framework boot overhead per job
- queue:work without recycling: unbounded memory growth, eventual OOM
- queue:work without supervisor: worker exits on max-jobs with no restart

---

### Related Rules

- always-use-queue-work-in-production
- set-both-max-jobs-and-max-time

---

### Related Skills

- Configure Worker Daemon and Process Management

---

## Worker Recycling Limits: max-jobs vs max-time

---

### Decision Context

Setting `--max-jobs` and `--max-time` limits for worker recycling to prevent memory leaks and stale state.

---

### Decision Criteria

* Per-job memory leak rate
* Job execution time distribution
* Desired recycling frequency
* Supervisor autorestart configuration

---

### Decision Tree

Jobs have measurable memory growth per iteration?
YES → Set --max-jobs aggressively (500) to catch rapid leaks
NO → Jobs have slow, steady memory growth?
    YES → Set --max-time (3600-14400) to catch slow leaks
NO → Both types of memory pressure exist?
    YES → Set BOTH --max-jobs AND --max-time for defense in depth
NO → Default safety?
    YES → Set both at standard values: --max-jobs=500 --max-time=14400

---

### Rationale

`--max-jobs` catches rapid memory accumulation (leaky job that grows 1MB per iteration). `--max-time` catches slow leaks (1MB per hour). Setting both provides defense in depth — the first limit reached triggers recycling.

---

### Recommended Default

**Default:** `--max-jobs=500` and `--max-time=14400` (4 hours) on all production workers
**Reason:** Catches both rapid and slow memory leaks. 500 jobs covers most memory accumulation scenarios; 4 hours catches long-term drift.

---

### Risks Of Wrong Choice

- Only --max-jobs: slow leaks accumulate over hours, OOM before limit reached
- Only --max-time: rapid accumulations cause OOM before time expires
- No limits at all: unbounded memory growth, eventual OOM crash
- Limits too high: worker runs until OOM anyway

---

### Related Rules

- set-both-max-jobs-and-max-time
- always-use-queue-work-in-production

---

### Related Skills

- Configure Worker Daemon and Process Management
- Configure Worker Memory Management
