# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Worker Management
**Knowledge Unit:** Deployment Restart Strategies
**Generated:** 2026-06-03

---

# Decision Inventory

* Pre-Deploy vs Post-Deploy Worker Restart
* Drain-and-Deploy vs Deploy-and-Restart

---

# Architecture-Level Decision Trees

---

## Pre-Deploy vs Post-Deploy Worker Restart

---

### Decision Context

Whether to restart queue workers before deploying new code (pre-drain) or after (post-deploy restart).

---

### Decision Criteria

* Schema migration requirements
* Job code version compatibility
* Deployment downtime tolerance
* Queue draining verification capability

---

### Decision Tree

Deployment includes database schema changes?
YES → Pre-deploy restart required — old workers may write incompatible data
NO → Job code changed (handle() method modified)?
    YES → Pre-deploy restart required — old workers run old code
NO → Only infrastructure/config changes?
    YES → Post-deploy restart acceptable
NO → Default safe approach?
    YES → Always pre-deploy restart + drain wait

---

### Rationale

Workers are long-lived daemons — they boot the framework once and never reload code. After deployment, old workers run old code against new schema, potentially causing data corruption. `queue:restart` before deployment drains old workers gracefully.

---

### Recommended Default

**Default:** Always run `queue:restart` before deployment, wait for drain, deploy, then verify new workers are running
**Reason:** Prevents code/schema incompatibility. Old workers finish their current job (not processing new ones) while new code is deployed.

---

### Risks Of Wrong Choice

- No restart after schema change: old code writes incompatible data format
- No drain wait: old workers still running when new code deploys — version mismatch
- Post-deploy restart only: gap where old code processes new data

---

### Related Rules

- use-queue-restart-after-every-deploy
- set-supervisor-stopwaitsecs-appropriately

---

### Related Skills

- Configure Worker Daemon and Process Management

---

## Drain-and-Deploy vs Deploy-and-Restart

---

### Decision Context

The timing and sequence of worker draining relative to code deployment.

---

### Decision Criteria

* Job criticality (can jobs wait?)
* Worker drain time (longest job runtime)
* Supervisor autorestart configuration
* Deployment automation maturity

---

### Decision Tree

Workers are managed by Supervisor with autorestart=true?
YES → Pre-deploy queue:restart → wait for drain → deploy → supervisor auto-restarts workers
NO → Workers are containerized (Kubernetes)?
    YES → Use pod lifecycle hooks for pre-stop drain
NO → Manual process management?
    YES → Pre-deploy queue:restart → monitor drain → deploy → start workers manually

---

### Rationale

With Supervisor `autorestart=true`, workers automatically restart after exit. `queue:restart` signals graceful exit — workers finish current jobs and exit. Supervisor detects the exit and spawns fresh workers with the new code. This is the standard zero-downtime pattern.

---

### Recommended Default

**Default:** `queue:restart` → wait (max job runtime) → deploy → Supervisor auto-restarts fresh workers
**Reason:** Zero-downtime worker deployment. Old workers drain gracefully; new workers pick up after deployment with no manual intervention.

---

### Risks Of Wrong Choice

- Deploy without drain: old code processes new data
- Not waiting for drain: old workers still running when deploy completes
- No autorestart: workers exit on queue:restart and never restart — queue stops

---

### Related Rules

- use-queue-restart-after-every-deploy
- always-use-autorestart-true

---

### Related Skills

- Configure Worker Daemon and Process Management
- Set Up Production Queue Topology
