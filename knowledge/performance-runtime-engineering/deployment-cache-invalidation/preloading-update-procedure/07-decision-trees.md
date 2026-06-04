# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Deployment and Cache Invalidation
**Knowledge Unit:** Preloading Update Procedure
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Preload file update on deployment | Operations | Deploy |

---

# Architecture-Level Decision Trees

---

## Decision: Preload Update Procedure

---

## Decision Context

Preloaded classes are resolved at worker start. After deployment with class changes, preload script must be regenerated and workers restarted.

---

## Decision Criteria

* **performance** — preloading old classes causes fatal errors
* **operations** — preload must be atomic with deployment
* **maintainability** — preload script should be auto-generated

---

## Decision Tree

Did class definitions change (added, removed, modified)?
↓
**YES** — Regenerate preload script and restart workers.
**NO** — Preload is valid. No action needed.

---

Is the preload script auto-generated?
↓
**YES** — Add regeneration to deployment pipeline.
**NO** — Switch to auto-generated. Manual preload is error-prone.

---

Are workers restarted after preload regeneration?
↓
**YES** — Preloaded classes are reloaded.
**NO** — Workers still have old preloaded classes. Must restart.

---

Is the restart graceful?
↓
**YES** — No dropped requests.
**NO** — Plan for brief disruption.

---

## Recommended Default

**Default:** Regenerate preload script in deployment pipeline. Restart workers gracefully post-deployment.
**Reason:** Atomic update prevents class definition mismatches.

---

## Risks Of Wrong Choice

* Not regenerating preload: old preloaded classes, fatal errors
* Regenerating without restart: no effect until worker restart

---

## Related Skills

* Preloading Update Procedure
