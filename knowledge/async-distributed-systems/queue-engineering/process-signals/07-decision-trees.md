# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Worker Management
**Knowledge Unit:** K057 — Process Signals (SIGTERM, SIGQUIT, SIGUSR2, SIGCONT)
**Generated:** 2026-06-03

---

# Decision Inventory

* SIGTERM vs SIGQUIT for Worker Shutdown
* queue:restart vs Per-Server Signal

---

# Architecture-Level Decision Trees

---

## SIGTERM vs SIGQUIT for Worker Shutdown

---

### Decision Context

Which signal to use when stopping a queue worker — SIGTERM (graceful) or SIGQUIT (immediate).

---

### Decision Criteria

* Job loss tolerance
* Time available for shutdown
* Supervisor stopwaitsecs configuration
* pcntl extension availability

---

### Decision Tree

pcntl extension not installed?
YES → Neither signal works — ensure extension is installed
NO → Need graceful shutdown (finish current job)?
    YES → Use SIGTERM — worker finishes current job, then exits
NO → Need immediate shutdown (abort current job)?
    YES → Use SIGQUIT — exits after finishing or aborting
NO → Forced kill (last resort)?
    YES → Use SIGKILL — current job lost, re-queued after retry_after

---

### Rationale

SIGTERM is the standard graceful shutdown — worker finishes its current job and exits. SIGQUIT is for when you need faster termination. SIGKILL should never be used — the worker dies immediately, the current job is lost, and it re-appears after `retry_after` for potential double processing.

---

### Recommended Default

**Default:** Always use SIGTERM for routine worker shutdown (deployments, maintenance)
**Reason:** Workers gracefully finish their current job, preventing job loss and double processing.

---

### Risks Of Wrong Choice

- SIGKILL: job lost mid-processing, risk of double processing on retry_after expiry
- No pcntl: signals ignored, supervisor eventually SIGKILLs
- SIGTERM without accounting for runtime: supervisor stopwaitsecs may expire and SIGKILL

---

### Related Rules

- set-supervisor-stopwaitsecs-appropriately
- ensure-pcntl-extension

---

### Related Skills

- Configure Worker Daemon and Process Management

---

## queue:restart vs Per-Server Signal

---

### Decision Context

Whether to use `queue:restart` (broadcast restart) or send signals directly to individual servers for worker restarts.

---

### Decision Criteria

* Number of servers running workers
* Deployment automation level
* Need for coordinated restart timing

---

### Decision Tree

Multiple servers running workers?
YES → Use queue:restart — broadcasts to all servers via cache
NO → Single server, automated deployment?
    YES → Use queue:restart — integrates with deployment script
NO → Manual single-server restart?
    YES → queue:restart or direct SIGTERM — both work
NO → Need precise restart timing?
    YES → Use queue:restart — workers check cache key every iteration

---

### Rationale

`queue:restart` sets a cache key that all workers check on every loop iteration. This broadcasts restart across all servers simultaneously without SSH access. Direct signals require server-level access and don't coordinate across servers.

---

### Recommended Default

**Default:** Always use `queue:restart` in deployment scripts regardless of server count
**Reason:** Works across any number of servers, integrates cleanly into deployment pipelines, and doesn't require server-level access.

---

### Risks Of Wrong Choice

- Per-server signal on multi-server: some workers may be missed
- No restart after deploy: old workers run old code with new schema — data corruption risk
- queue:restart without verification: workers may take time to drain — verify before deploying new code

---

### Related Rules

- use-queue-restart-after-every-deploy
- ensure-pcntl-extension

---

### Related Skills

- Configure Worker Daemon and Process Management
