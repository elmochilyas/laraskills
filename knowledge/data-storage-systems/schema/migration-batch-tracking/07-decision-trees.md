# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-7 Migration Batch Tracking
**Generated:** 2026-06-03

---

# Decision Inventory

* migrate with step vs without step
* migrate:refresh vs migrate:fresh
* Rollback granularity strategy

---

# Architecture-Level Decision Trees

---

## Migration Batch Strategy

---

## Decision Context

Choosing the batch mode for migration execution that balances deployment speed against rollback granularity.

---

## Decision Criteria

* performance: --step writes one DB row per migration vs one row per batch
* architectural: batch grouping determines rollback scope
* maintainability: single-batch rollback is simpler but all-or-nothing
* security: no impact

---

## Decision Tree

Running migrations in production?
↓
Do you need per-migration rollback granularity?
YES → Use --step flag
    ↓
    Is this a large deploy (> 50 migrations)?
    YES → --step adds overhead but enables targeted rollback
    → Each migration gets its own batch number
    NO → --step is the default recommendation
NO → Without --step, all migrations share one batch
    → Rollback undoes ALL migrations in the deploy
    → Acceptable for small deploys with low rollback risk
↓
For local development, which reset strategy?
→ migrate:fresh (drops all tables, re-runs) for daily development
→ migrate:refresh (calls down() on all) for testing rollback paths

---

## Rationale

--step provides fine-grained rollback control at the cost of slightly more DB writes. For production, the rollback granularity justifies the overhead. In development, migrate:fresh is significantly faster because it skips down() method execution.

---

## Recommended Default

**Default:** --step for production, migrate:fresh for local development
**Reason:** Production needs per-migration rollback safety. Local development benefits from the speed of schema drop and rebuild.

---

## Risks Of Wrong Choice

* migrate:fresh on shared databases: drops all data with no recovery path
* No --step on production: rollback requires undoing ALL migrations in the batch
* Missing down() on any migration in the batch: rollback fails mid-batch, leaving partial state

---

## Related Rules

* Use --step for production deployments
* Never use migrate:fresh on shared/staging databases

---

## Related Skills

* Execute and manage migration batches
