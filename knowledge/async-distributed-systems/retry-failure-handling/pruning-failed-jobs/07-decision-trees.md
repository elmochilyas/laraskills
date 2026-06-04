# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Retry & Failure Handling
**Knowledge Unit:** pruning-failed-jobs
**Generated:** 2026-06-03

---

# Decision Inventory

* Pruning Frequency and Retention Period

---

# Architecture-Level Decision Trees

---

## Pruning Frequency and Retention Period

---

### Decision Context

How often to prune failed jobs and how long to retain them.

---

### Decision Criteria

* Failed job volume
* Investigation turnaround time
* Compliance requirements
* Database size constraints

---

### Decision Tree

High failed job volume (>1000/day)?
YES → Prune daily — retain 7 days max
NO → Standard volume (<100/day)?
    YES → Prune weekly — retain 30 days
NO → Compliance requires longer retention?
    YES → Prune per compliance schedule — use archive before delete
NO → Low volume (<10/day)?
    YES → Prune monthly — retain 90 days

---

### Rationale

Failed job pruning balances investigation needs with database size. Higher volumes need more aggressive pruning to prevent table bloat. Lower volumes can retain longer for post-mortem analysis.

---

### Recommended Default

**Default:** `queue:prune-failed --days=30` in the scheduler, running daily
**Reason:** 30 days provides ample time for investigation. Daily pruning keeps the table manageable. Adjust retention based on volume and compliance needs.

---

### Risks Of Wrong Choice

- Never pruning: unbounded table growth, slow queries, backup bloat
- Too aggressive pruning: jobs deleted before investigation possible
- Pruning without review: missed pattern detection opportunity

---

### Related Rules

- investigate-before-retrying

---

### Related Skills

- Set Up Queue Failure Handling and Retries
