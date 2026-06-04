# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Worker Management
**Knowledge Unit:** K059 — Supervisor Configuration for Queue Workers
**Generated:** 2026-06-03

---

# Decision Inventory

* Supervisor vs Horizon for Process Management
* numprocs Concurrency Setting

---

# Architecture-Level Decision Trees

---

## Supervisor vs Horizon for Process Management

---

### Decision Context

Whether to manage queue workers with Supervisor directly or use Laravel Horizon (which is its own process manager).

---

### Decision Criteria

* Redis queue driver requirement
* Monitoring and dashboard needs
* Auto-balancing requirements
* Multi-server deployment

---

### Decision Tree

Using Redis queue driver?
YES → Need monitoring dashboard, auto-balancing, metrics?
    YES → Use Horizon (includes process management)
NO → Using SQS or other driver?
    YES → Use Supervisor + queue:work
NO → Single queue with simple needs?
    YES → Supervisor + queue:work is sufficient
NO → Multi-server with automatic scaling?
    YES → Horizon (multi-server mode with Redis)

---

### Rationale

Horizon is its own process supervisor and includes auto-balancing, monitoring dashboard, metrics, and notifications. However, it only works with Redis. Supervisor is the universal approach that works with any driver but provides no monitoring dashboard.

---

### Recommended Default

**Default:** Use Horizon for Redis queues (includes process management); Supervisor for SQS or non-Redis drivers
**Reason:** Horizon provides built-in monitoring, auto-balancing, and process management. Supervisor is the fallback for non-Redis drivers.

---

### Risks Of Wrong Choice

- Supervisor without autorestart: worker exits on max-jobs, queue stops forever
- Horizon without Redis: not supported — Horizon requires Redis
- Manual monitoring without Horizon: no dashboard — must use alternative monitoring

---

### Related Rules

- always-use-autorestart-true
- set-stopwaitsecs-appropriately

---

### Related Skills

- Configure Horizon for Production
- Configure Worker Daemon and Process Management

---

## numprocs Concurrency Setting

---

### Decision Context

How many worker processes (`numprocs`) to run per Supervisor configuration.

---

### Decision Criteria

* CPU core count
* Workload type (CPU-bound vs I/O-bound)
* Memory budget per worker
* Job type characteristics

---

### Decision Tree

Workload is CPU-bound (image processing, PDF generation)?
YES → numprocs <= CPU core count (e.g., 4 cores = 4 workers)
NO → Workload is I/O-bound (API calls, HTTP requests)?
    YES → numprocs = 2-3x CPU core count
NO → Mixed workload?
    YES → Start at CPU core count, monitor and adjust
NO → Default?
    YES → numprocs = CPU core count

---

### Rationale

CPU-bound jobs benefit from at most one worker per core — more causes context switching overhead without throughput gain. I/O-bound jobs spend most time waiting (HTTP, DB) — more workers utilize idle CPU time.

---

### Recommended Default

**Default:** `numprocs = number of CPU cores` for mixed workloads; adjust up for I/O-bound, down for CPU-bound
**Reason:** Provides balanced baseline performance. I/O-bound workloads can safely oversubscribe; CPU-bound workloads cannot.

---

### Risks Of Wrong Choice

- Too many workers for CPU-bound: context switching overhead reduces throughput
- Too few workers for I/O-bound: CPU sits idle while workers wait for I/O
- Not accounting for memory: each worker uses ~20-40MB — 20 workers = 400-800MB

---

### Related Rules

- always-use-autorestart-true
- set-stopwaitsecs-appropriately

---

### Related Skills

- Configure Worker Daemon and Process Management
