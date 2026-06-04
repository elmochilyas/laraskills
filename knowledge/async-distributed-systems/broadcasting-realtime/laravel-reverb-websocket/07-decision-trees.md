# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Broadcasting & Real-Time
**Knowledge Unit:** K031 — Laravel Reverb WebSocket Server
**Generated:** 2026-06-03

---

# Decision Inventory

* Single vs Multi-Process Reverb Scaling
* Reverb Supervisor Configuration

---

# Architecture-Level Decision Trees

---

## Single vs Multi-Process Reverb Scaling

---

### Decision Context

Whether to run a single Reverb process or multiple processes for scaling.

---

### Decision Criteria

* Expected concurrent WebSocket connections
* Available CPU cores
* Redis pub/sub setup for cross-process state
* Load balancer capabilities

---

### Decision Tree

Expected connections < 1,000?
YES → Single Reverb process is sufficient
NO → Connections 1,000-10,000?
    YES → Multiple processes (one per core) + Redis pub/sub + load balancer
NO → Connections > 10,000?
    YES → Multi-server Reverb cluster — dedicated servers + shared Redis

---

### Rationale

A single Reverb process handles ~1,000 concurrent connections. Beyond that, use multiple processes behind a load balancer. Each process needs Redis pub/sub to share state across processes (presence channels, channel subscriptions).

---

### Recommended Default

**Default:** Start with one Reverb process per core; add Redis pub/sub for multi-process coordination
**Reason:** One process per core maximizes throughput per server. Redis pub/sub ensures cross-process state synchronization.

---

### Risks Of Wrong Choice

- Single process for >1,000 connections: file descriptor exhaustion, performance degradation
- Multi-process without Redis pub/sub: clients on different processes can't see each other's events
- Multi-process without load balancer: clients must be distributed manually

---

### Related Rules

- increase-ulimit-for-websocket-connections
- always-run-reverb-under-supervisor

---

### Related Skills

- Configure Laravel Reverb WebSocket Server
- Scale Reverb for Production

---

## Reverb Supervisor Configuration

---

### Decision Context

Configuring Supervisor (or alternative) to manage Reverb processes.

---

### Decision Criteria

* Process count needed
* Auto-restart requirements
* Graceful shutdown needs
* Resource isolation

---

### Decision Tree

Running Reverb on dedicated server?
YES → One Supervisor program per Reverb process, autorestart=true
NO → Running Reverb with other services?
    YES → Dedicated Supervisor program, isolate resource limits
NO → Containerized (Docker)?
    YES → Use container orchestration (not Supervisor)

---

### Rationale

Reverb is a long-lived PHP process that must be managed by a process supervisor. If it crashes (OOM, unhandled exception), all WebSocket connections drop. Supervisor's `autorestart` ensures it comes back.

---

### Recommended Default

**Default:** Run Reverb under Supervisor with `autorestart=true`, `numprocs` = CPU cores, separate from PHP-FPM workers
**Reason:** Ensures automatic recovery from crashes. Dedicated servers prevent resource contention with HTTP workloads.

---

### Risks Of Wrong Choice

- Reverb without Supervisor: crash = extended WebSocket downtime
- Reverb on same server as PHP-FPM: resource contention, both degrade
- No memory monitoring: OOM kills Reverb, all connections drop

---

### Related Rules

- increase-ulimit-for-websocket-connections
- always-run-reverb-under-supervisor

---

### Related Skills

- Configure Laravel Reverb WebSocket Server
- Configure Supervisor for Queue Workers
