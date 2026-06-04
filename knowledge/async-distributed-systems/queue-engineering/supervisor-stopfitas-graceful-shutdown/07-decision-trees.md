# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Worker Management
**Knowledge Unit:** Supervisor stopwaitsecs Graceful Shutdown
**Generated:** 2026-06-03

---

# Decision Inventory

* stopwaitsecs Value Selection

---

# Architecture-Level Decision Trees

---

## stopwaitsecs Value Selection

---

### Decision Context

Setting Supervisor's `stopwaitsecs` — the time Supervisor waits for SIGTERM graceful shutdown before sending SIGKILL.

---

### Decision Criteria

* Maximum expected job runtime
* retry_after configuration
* Job loss tolerance
* Deployment timing requirements

---

### Decision Tree

retry_after is configured?
YES → Set stopwaitsecs = retry_after + 10
NO → Maximum job runtime is known?
    YES → Set stopwaitsecs = max job runtime + 10 buffer
NO → Jobs have unknown or variable runtime?
    YES → Set stopwaitsecs = 60 (safe minimum)
NO → Conservative approach?
    YES → Set stopwaitsecs = retry_after + 10

---

### Rationale

When Supervisor sends SIGTERM, the worker finishes its current job before exiting. If `stopwaitsecs` expires before the job finishes, Supervisor sends SIGKILL — the worker dies immediately, the job is lost, and it re-queues after `retry_after` for potential double processing.

---

### Recommended Default

**Default:** `stopwaitsecs = retry_after + 10`
**Reason:** Matches the queue backend's timeout. If `retry_after=90`, `stopwaitsecs=100` gives the worker 100 seconds to finish the current job before SIGKILL.

---

### Risks Of Wrong Choice

- Too short (default 10s): worker SIGKILLed mid-job — job lost, potential double processing
- Too long: deployment pauses waiting for worker shutdown, delays rollouts
- Not matching retry_after: misalignment between timeout systems

---

### Related Rules

- set-stopwaitsecs-appropriately
- always-use-autorestart-true

---

### Related Skills

- Configure Worker Daemon and Process Management
- Configure Supervisor for Queue Workers
