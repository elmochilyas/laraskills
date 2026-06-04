# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Retry & Failure Handling
**Knowledge Unit:** K020 — failed_jobs Storage
**Generated:** 2026-06-03

---

# Decision Inventory

* failed_jobs Table vs Custom Failed Job Storage
* Failed Job Retention Strategy

---

# Architecture-Level Decision Trees

---

## failed_jobs Table vs Custom Failed Job Storage

---

### Decision Context

Whether to use the default `failed_jobs` database table or implement custom failed job storage.

---

### Decision Criteria

* Volume of failed jobs
* Query/filter requirements
* Retention/compliance requirements
* Integration with external systems

---

### Decision Tree

Need to store failed jobs beyond the database's practical retention (>90 days)?
YES → Custom storage (S3, external service) — database is not archival storage
NO → Need advanced querying (full-text search, complex filters)?
    YES → Custom storage with dedicated indexing
NO → Need to integrate with external monitoring/alerting system?
    YES → Custom storage with webhook integration
NO → Standard use case (<10K failed jobs/day)?
    YES → Default failed_jobs table is sufficient

---

### Rationale

The `failed_jobs` table is a simple database store. For small to moderate failure volumes, it works well. For high volume, long retention, or complex query needs, custom storage (or offloading to an external service) is more appropriate.

---

### Recommended Default

**Default:** Use the default `failed_jobs` table for standard applications; custom storage only for high volume or special requirements
**Reason:** The default storage integrates seamlessly with `queue:retry` and Horizon. Custom storage adds operational complexity.

---

### Risks Of Wrong Choice

- Default table for high volume: DB table grows large, backup/restore slow
- Custom storage without queue:retry compatibility: must implement retry from custom store
- No pruning: failed_jobs table grows unbounded, slows queries

---

### Related Rules

- investigate-before-retrying

---

### Related Skills

- Set Up Queue Failure Handling and Retries

---

## Failed Job Retention Strategy

---

### Decision Context

How long to retain failed jobs and when to prune them.

---

### Decision Criteria

* Compliance/audit requirements
* Debugging/reference window
* Storage capacity
- Retry viability after retention period

---

### Decision Tree

Compliance requires specific retention period?
YES → Prune according to compliance schedule (e.g., 90 days)
NO → Failed jobs remain actionable (retry possible)?
    YES → Retain 7-30 days — retry window is reasonable
NO → Reference only (investigation, not retry)?
    YES → Retain 30-90 days — long enough for post-mortem analysis
NO → No need to retain at all?
    YES → Prune daily — only keep recent failures for debugging

---

### Rationale

Failed job payloads reference data at dispatch time. After extended periods, the referenced data may no longer exist, making retry meaningless. Regular pruning prevents unbounded table growth.

---

### Recommended Default

**Default:** Prune failed jobs older than 30 days via `queue:prune-failed` scheduler
**Reason:** Provides adequate time for investigation and retry. Jobs older than 30 days likely reference stale data. Regular pruning controls table size.

---

### Risks Of Wrong Choice

- Never pruning: failed_jobs grows unbounded — slow queries, large backups
- Too short retention: jobs deleted before investigation
- Too long retention: payloads reference deleted data — retry meaningless

---

### Related Rules

- investigate-before-retrying

---

### Related Skills

- Set Up Queue Failure Handling and Retries
