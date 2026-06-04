# 5-19 Schema Version Ledger - Decision Trees

## Central Ledger vs Per-Tenant Migrations Table

---

## Decision Context

Choosing between a central ledger table (all tenant versions in one place) and relying on each tenant's own migrations table for schema version tracking.

---

## Decision Criteria

* performance: central ledger is one query; per-tenant requires N queries
* architectural: central ledger enables drift detection and differential migration
* maintainability: central ledger provides single-pane-of-glass view
* security: ledger in central DB accessible to admin tools

---

## Decision Tree

How to track tenant schema versions?

↓

More than 10 tenants?

YES → Use central ledger table

    ↓
    CREATE TABLE tenant_schema_versions (
        tenant_id BIGINT NOT NULL,
        migration VARCHAR(255) NOT NULL,
        batch INT NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW()
    );
    
    ↓
    Before migration: check ledger for pending migrations
    After migration: insert migration record
    Daily: detect tenants with missing migrations (drift)

NO → Fewer than 10 tenants?

    YES → Each tenant's own migrations table is sufficient
    
        ↓
        Check each tenant's migrations table directly
        Acceptable for small deployments
        
        ↓
        Risk: can't easily see all tenant states without querying each

NO → Shared-table (single database)?

    → Single migrations table — no need for ledger
    All tenants share same schema version
    No drift possible within same database

---

## Recommended Default

**Default:** Central ledger table for any deployment with >10 tenants or schema/DB-per-tenant isolation
**Reason:** The central ledger is the only way to detect schema drift across tenants at a glance. Per-tenant migrations tables become unmanageable at scale.

---

## Canary Migration Rollout

---

## Decision Context

Rolling out migrations to a subset of tenants first (canary) before applying to all tenants, reducing blast radius of failed migrations.

---

## Decision Criteria

* performance: canary adds delay to full rollout
* architectural: must be able to rollback canary tenants independently
* maintainability: ledger enables selective tenant targeting
* security: critical security patches should skip canary

---

## Decision Tree

How to roll out canary migrations?

↓

Migration is a critical security patch?

YES → Skip canary — apply to all tenants immediately

    ↓
    Security patches override normal rollout process
    Apply to all tenants in one batch
    Monitor for errors post-rollout

NO → Standard feature migration?

    YES → Canary 5% of tenants first
        
        ↓
        Select 5% of tenants (by tenant_id mod 20)
        Apply migrations to canary group
        Monitor for errors for 15-30 minutes
        
        ↓
        If errors: rollback canary tenants only
        If clean: promote to remaining 95%

NO → High-risk migration (schema change, data migration)?

    → Canary 1-2 internal/test tenants first
    Manual verification before any customer tenant
    Then 5% → 25% → 100%
    Rollback plan: revert migration per tenant via ledger

---

## Recommended Default

**Default:** Canary 5% → wait → 100% for standard migrations; skip canary for security patches
**Reason:** 5% canary catches most issues while keeping blast radius small. Security patches are time-sensitive enough to skip canary.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Schema Version Ledger
* Implement Migration Orchestration Across Tenants
