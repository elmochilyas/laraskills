# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-22 Migration Version Ledger Per Tenant
**Generated:** 2026-06-03

---

# Decision Inventory

* Central ledger vs per-database migrations table
* Ledger update timing: before vs after successful migration
* Staggered rollout phases via ledger

---

# Architecture-Level Decision Trees

---

## Tenant Schema Version Tracking

---

## Decision Context

Choosing the strategy for tracking which schema version each tenant's database has in a multi-tenant environment.

---

## Decision Criteria

* performance: ledger table is a hot path for 1000+ tenants; index on (tenant_id, batch)
* architectural: central ledger enables per-tenant rollback and canary rollout
* maintainability: drift detection requires periodic ledger-to-database reconciliation
* security: tenant data isolation

---

## Decision Tree

Running migrations across many tenant databases?
↓
Is a central schema version ledger needed?
YES → Create schema_versions table in control database
    ↓
    When to update the ledger?
    → UPDATE AFTER migration succeeds
    → NEVER update before — a failed migration would show incorrect state
    → Use transactional writes for ledger updates
NO → Use per-database migrations table only
    → Acceptable for < 10 tenants
    → No aggregated view of all tenant schema states
↓
Staggered rollout needed?
YES → Phase tenants in the ledger
    → Phase 1 (5%): Internal/canary tenants
    → Phase 2 (25%): Early adopters
    → Phase 3 (100%): Full rollout
    → Ledger tracks which tenants are in which phase
NO → Apply to all tenants at once

---

## Rationale

A central ledger transforms multi-tenant migration management from "unknown state per tenant" to "known, queryable state per tenant." It enables staggered rollouts, canary testing, drift detection, and per-tenant rollback. The ledger must only be updated after successful migration to maintain accuracy.

---

## Recommended Default

**Default:** Central schema_versions ledger for any multi-tenant setup with > 10 tenants
**Reason:** Provides visibility into per-tenant schema state, enables staggered rollouts and drift detection.

---

## Risks Of Wrong Choice

* No ledger: after 6 months, no one knows which tenants are on which schema version
* Updating ledger before migration: ledger shows "migrated" but migration failed
* Ledger drift: manual migration applied outside orchestrator creates inconsistency
* Race condition: two processes update same tenant's ledger simultaneously

---

## Related Rules

* Update the central ledger only after migration succeeds on the tenant database
* Index the ledger on (tenant_id, batch) for query performance

---

## Related Skills

* Track schema versions per tenant with migration ledger
