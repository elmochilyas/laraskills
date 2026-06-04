# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Horizon Scaling
**Knowledge Unit:** job-tags-filtering
**Generated:** 2026-06-03

---

# Decision Inventory

* Job Tagging Strategy for Horizon Filtering

---

# Architecture-Level Decision Trees

---

## Job Tagging Strategy for Horizon Filtering

---

### Decision Context

How to tag jobs in Horizon for monitoring and filtering.

---

### Decision Criteria

* Monitoring granularity requirements
* Search/filter use cases
* Tag maintenance overhead

---

### Decision Tree

Need to filter jobs by entity (user, order, team)?
YES → Add entity ID tags: `tags()` returns `['user:'.$this->userId]`
NO → Need to filter by job type or queue?
    YES → Auto-tags suffice — Horizon adds queue and class name
NO → Need custom grouping for metrics?
    YES → Add custom group tags: `['batch:'.$batchId]`
NO → Need to search for specific jobs in Horizon dashboard?
    YES → Add searchable tags: meaningful identifiers

---

### Rationale

Horizon automatically tags jobs with queue name and class. Custom tags in the `tags()` method enable entity-level filtering and monitoring in the Horizon dashboard.

---

### Recommended Default

**Default:** Add entity ID tags (user ID, order ID) for filtering; let Horizon auto-tag queue and class
**Reason:** Entity tags enable searching for all jobs related to a specific entity. Auto-tags provide queue and class filtering without boilerplate.

---

### Risks Of Wrong Choice

- No tags: can't filter/search jobs by entity in Horizon
- Too many tags: performance overhead, cluttered dashboard
- Card-sensitive data in tags: tags are visible in Horizon — avoid PII

---

### Related Rules

- monitor-queue-depth-as-leading-indicator

---

### Related Skills

- Configure Horizon Supervisor Settings
- Monitor Queue Health and Performance
