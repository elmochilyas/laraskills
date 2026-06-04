# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Horizon Scaling
**Knowledge Unit:** silenced-jobs-tags
**Generated:** 2026-06-03

---

# Decision Inventory

* Silencing Jobs vs Filtering in Horizon Dashboard

---

# Architecture-Level Decision Trees

---

## Silencing Jobs vs Filtering in Horizon Dashboard

---

### Decision Context

Whether to use Horizon's job silencing feature or filter jobs in the dashboard.

---

### Decision Criteria

* Dashboard clutter concerns
* Need to see silenced jobs occasionally
* Silencing criteria stability

---

### Decision Tree

High-volume job that clutters the dashboard?
YES → Silence the job — remove from default view
NO → Need to occasionally check silenced jobs?
    YES → Silence — silenced jobs are still accessible via filter toggle
NO → Silencing criteria may change frequently?
    YES → Filter in dashboard — more flexible than code-level silencing
NO → Default?
    YES → Don't silence — keep all jobs visible unless dashboard is too cluttered

---

### Rationale

Horizon's silencing feature hides specific job classes from the default dashboard view. Silenced jobs are still processed normally and can be viewed by toggling the "Include Silenced Jobs" filter.

---

### Recommended Default

**Default:** Silence only high-frequency jobs (heartbeat, metrics) that add noise to the dashboard
**Reason:** Keeps the dashboard focused on actionable items while still allowing access to silenced jobs when needed.

---

### Risks Of Wrong Choice

- Silencing too many jobs: dashboard shows incomplete picture
- Silencing jobs that need monitoring: processing issues go unnoticed
- Never silencing high-frequency jobs: dashboard is cluttered and hard to read

---

### Related Rules

- monitor-queue-depth-as-leading-indicator

---

### Related Skills

- Configure Horizon Supervisor Settings
