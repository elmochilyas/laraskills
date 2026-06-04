# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Worker Management
**Knowledge Unit:** systemd Service Workers
**Generated:** 2026-06-03

---

# Decision Inventory

* systemd vs Supervisor for Worker Management

---

# Architecture-Level Decision Trees

---

## systemd vs Supervisor for Worker Management

---

### Decision Context

Whether to manage queue workers with systemd services or Supervisord.

---

### Decision Criteria

* Existing infrastructure (Supervisor vs systemd preference)
* Multi-process management needs
* Logging and monitoring requirements
* Deployment automation compatibility

---

### Decision Tree

Already using Supervisor for other services?
YES → Use Supervisor for consistency
NO → Using containerized deployment (Docker/K8s)?
    YES → Use container orchestration (not systemd or Supervisor)
NO → Single worker process per queue?
    YES → systemd is sufficient and simpler
NO → Need multiple worker processes per queue (numprocs)?
    YES → Supervisor is easier for multi-process management
NO → Team familiarity?
    YES → Use what the team knows best

---

### Rationale

Supervisor is purpose-built for process management with features like `numprocs` (multi-process), `stopwaitsecs` (graceful shutdown timing), and `autorestart`. systemd can manage single worker processes but lacks the convenience of multi-process per-config management.

---

### Recommended Default

**Default:** Use Supervisor for queue workers; systemd only when Supervisor is not available or for single-process setups
**Reason:** Supervisor provides purpose-built features for worker management (numprocs, autorestart, stopwaitsecs) that systemd requires more manual configuration to replicate.

---

### Risks Of Wrong Choice

- systemd without proper restart config: worker exits on max-jobs, never restarted
- systemd with too-short TimeoutStopSec: worker SIGKILLed mid-job
- No process manager at all: worker dies from OOM/max-jobs — queue stops permanently

---

### Related Rules

- always-use-autorestart-true
- set-stopwaitsecs-appropriately

---

### Related Skills

- Configure Supervisor for Queue Workers
- Configure Worker Daemon and Process Management
