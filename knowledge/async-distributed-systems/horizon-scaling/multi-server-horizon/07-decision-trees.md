# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Horizon Scaling
**Knowledge Unit:** multi-server-horizon
**Generated:** 2026-06-03

---

# Decision Inventory

* Single-Server vs Multi-Server Horizon

---

# Architecture-Level Decision Trees

---

## Single-Server vs Multi-Server Horizon

---

### Decision Context

Whether to run Horizon on a single server or distribute across multiple servers.

---

### Decision Criteria

* Worker capacity requirements
* High availability needs
* Server resource constraints
* Budget for additional servers

---

### Decision Tree

Single server can handle peak queue load?
YES → Single server is simpler — no Redis replication needed
NO → Need high availability (survive server failure)?
    YES → Multi-server — workers on multiple servers provide redundancy
NO → Server has sufficient CPU/memory for all queues?
    YES → Single server — simpler operations
NO → Need to isolate workloads (CPU vs I/O queues)?
    YES → Multi-server — dedicated servers per workload type
NO → Default?
    YES → Single server — simpler, sufficient for most apps

---

### Rationale

Multi-server Horizon distributes workers across servers for redundancy and capacity. All servers connect to the same Redis instance. A server failure means fewer workers but queue processing continues on remaining servers.

---

### Recommended Default

**Default:** Single server for most applications; multi-server for HA requirements or when single server can't handle peak load
**Reason:** Single server is simpler to manage. Multi-server adds Redis configuration, deployment coordination, and monitoring complexity.

---

### Risks Of Wrong Choice

- Single server at capacity: queue backlog during peak, slow processing
- Multi-server without shared Redis: each server has isolated state — workers conflict
- No Redis replication: single Redis instance is single point of failure
- Inconsistent supervisor config: different process counts across servers

---

### Related Rules

- use-separate-supervisors-per-priority-tier

---

### Related Skills

- Configure Multi-Server Horizon
- Configure Horizon Supervisor Settings
