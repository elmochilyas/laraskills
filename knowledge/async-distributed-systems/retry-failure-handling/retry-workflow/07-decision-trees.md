# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Retry & Failure Handling
**Knowledge Unit:** K024 — Retry Workflow
**Generated:** 2026-06-03

---

# Decision Inventory

* Automated Retry vs Manual Retry Strategy
* queue:retry Specific vs queue:retry all

---

# Architecture-Level Decision Trees

---

## Automated Retry vs Manual Retry Strategy

---

### Decision Context

Whether to implement automated retry pipelines for failed jobs or require manual intervention.

---

### Decision Criteria

* Failure type (transient vs permanent ratio)
* Recovery time requirements
* Root cause investigation needed
* Automated retry safety

---

### Decision Tree

Failures are predominantly transient (network, timeout, 503)?
YES → Automated retry pipeline acceptable — schedule queue:retry hourly
NO → Failures need root cause investigation?
    YES → Manual retry — investigate before retrying
NO → Critical jobs that must recover ASAP?
    YES → Automated retry with immediate notification on repeat failure
NO → Default?
    YES → Manual retry — safer, prevents retry loops

---

### Rationale

Automated retry is useful for transient failures but dangerous for permanent ones — the same exception occurs again, wasting worker time. Manual retry ensures the root cause is investigated first.

---

### Recommended Default

**Default:** Manual retry for most failures; automated retry only for well-understood transient failure patterns
**Reason:** Prevents repeated failure of permanent issues. Automated retry should be opt-in for known transient patterns.

---

### Risks Of Wrong Choice

- Automated retry for permanent failures: infinite failure loop, worker saturation
- Manual retry for time-sensitive transient: unnecessary delay in recovery
- queue:retry all without inspection: floods queue with immediately-failing jobs

---

### Related Rules

- investigate-before-retrying
- test-single-retry-before-retrying-all

---

### Related Skills

- Set Up Queue Failure Handling and Retries

---

## queue:retry Specific vs queue:retry all

---

### Decision Context

Whether to retry specific failed jobs by ID or all failed jobs at once.

---

### Decision Criteria

* Number of failed jobs
* Failure cause uniformity
* Risk of re-failure
* Queue capacity for retry flood

---

### Decision Tree

Failed jobs have different root causes?
YES → Retry specific IDs — investigate each group separately
NO → All failed from same transient cause (e.g., API outage resolved)?
    YES → queue:retry all is safe — root cause resolved
NO → More than 100 failed jobs?
    YES → Retry specific IDs first — test the water before retrying all
NO → Default safe approach?
    YES → Retry specific IDs — one at a time

---

### Rationale

`queue:retry all` dispatches every failed job in the `failed_jobs` table. If the underlying issue isn't resolved, hundreds of jobs fail again immediately, flooding the queue and wasting worker time.

---

### Recommended Default

**Default:** Retry a single job first to confirm the issue is resolved; then retry the rest in batches
**Reason:** A single retry reveals whether the underlying cause is fixed. Batched retry prevents queue flooding from mass re-failure.

---

### Risks Of Wrong Choice

- queue:retry all without testing: flood of immediately-failing jobs
- Retrying without fixing cause: same exception, immediate re-failure
- Not accounting for attempt count: retried job may fail immediately (exceeds $tries)

---

### Related Rules

- test-single-retry-before-retrying-all
- investigate-before-retrying

---

### Related Skills

- Set Up Queue Failure Handling and Retries
