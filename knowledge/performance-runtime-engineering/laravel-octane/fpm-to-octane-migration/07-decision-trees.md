# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** FPM to Octane Migration
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Migration approach from FPM to Octane | Architecture | Plan |

---

# Architecture-Level Decision Trees

---

## Decision: Migration Approach

---

## Decision Context

Moving from FPM to Octane requires state audit, service provider review, and package compatibility check. Incremental migration reduces risk.

---

## Decision Criteria

* **performance** — gain from bootstrap elimination
* **architectural** — state management changes required
* **operations** — migration risk vs reward

---

## Decision Tree

Has a state audit been performed?
↓
**YES** — Proceed with migration.
**NO** — Perform audit first. Deploy without audit risks state leaks.

---

Are all service providers compatible (no deferred singletons with per-request state)?
↓
**YES** — Standard migration.
**NO** — Refactor providers that hold request-scoped state.

---

Are statics and globals used extensively?
↓
**YES** — Octane compatibility pass required. Refactor or wrap in request-scoped reset.
**NO** — Lower migration risk.

---

Is the Octane compatibility checker run?
↓
**YES** — Use Larastan or Octane check:list command to identify issues.
**NO** — Run it before production deployment.

---

What is the rollback plan?
↓
**FPM still running** — Deploy Octane alongside FPM, test, then switch.
**Replace FPM** — Ensure quick rollback to FPM config.

---

## Recommended Default

**Default:** Incremental migration: state audit → provider review → compatibility check → staging test → production deploy with 1 hour rollback window.
**Reason:** Systematic migration catches state issues before production.

---

## Risks Of Wrong Choice

* Direct cutover without audit: state corruption in production
* No rollback plan: extended outage if migration fails

---

## Related Skills

* FPM to Octane Migration
