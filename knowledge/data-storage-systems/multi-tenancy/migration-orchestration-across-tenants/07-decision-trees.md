# 5-9 Migration Orchestration Across Tenants - Decision Trees

## Migration Strategy by Isolation Level

---

## Decision Context

Choosing the migration orchestration approach based on tenant isolation strategy — shared-table runs migrations once, schema-per-tenant loops schemas, database-per-tenant loops databases.

---

## Decision Criteria

* performance: shared-table is one run; schema/DB-per-tenant is N runs
* architectural: schema/DB-per-tenant requires orchestration infrastructure
* maintainability: migration version tracking per tenant prevents drift
* security: migration failures must not expose cross-tenant data

---

## Decision Tree

How to run migrations for your isolation level?

↓

Shared-table (single database)?

YES → Standard migration: `php artisan migrate`

    ↓
    Run once — applies to all tenants
    Single migrations table, single batch
    No tenant orchestration needed
    
    ↓
    Zero-downtime migrations still needed
    Expand-contract pattern for breaking changes

NO → Schema-per-tenant?

    YES → Loop schemas, run migrations per schema
    
        ↓
        Get all tenant schemas
        For each schema: SET search_path → run migrate
        Each schema has its own migrations table
        
        ↓
        Batch: 10-20 schemas at a time
        Track migration batch per schema
        Log failures per tenant

NO → Database-per-tenant?

    → Loop databases, run migrations per database
    Each database has its own migrations table
    Largest orchestration overhead
    
    ↓
    Use queue jobs per tenant for parallel execution
    Central ledger tracks which batch each tenant has applied
    Resume from ledger on re-run

---

## Recommended Default

**Default:** Shared-table → standard migrate; Schema/DB-per-tenant → batch loop with per-tenant tracking
**Reason:** Shared-table needs no orchestration. Schema/DB-per-tenant needs batching to control database load and per-tenant tracking for drift detection.

---

## Central Migration Ledger

---

## Decision Context

Tracking which migration batch each tenant has applied using a central ledger to detect drift, enable differential migration, and resume failed batches.

---

## Decision Criteria

* performance: ledger lookup is a single query per batch operation
* architectural: enables resume, differential migration, drift detection
* maintainability: single source of truth for tenant migration state
* security: ledger must be in central (shared) database

---

## Decision Tree

Need migration version tracking per tenant?

YES → Implement central ledger table

    ↓
    CREATE TABLE tenant_migration_status (
        tenant_id BIGINT PRIMARY KEY,
        last_batch INT,
        last_run_at TIMESTAMP,
        status ENUM('pending', 'running', 'completed', 'failed'),
        error_text TEXT
    );
    
    ↓
    Before migration: insert/update status = 'running'
    After migration: update status = 'completed', last_batch = current
    On failure: update status = 'failed', error_text = message

NO → Few tenants (< 10)?

    → Manual tracking sufficient
    Check each tenant's migrations table directly
    Acceptable only for very small deployments

NO → All tenants always on same version?

    → Ledger not needed
    Run migrations sequentially — all succeed or all fail
    Accept risk: partial failure requires manual fix

---

## Recommended Default

**Default:** Central migration ledger for deployments with >10 tenants or schema/DB-per-tenant isolation
**Reason:** Ledger is the only reliable way to detect drift and resume after partial failures. The overhead of one table is negligible.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Migration Orchestration Across Tenants
* Implement Tenant-Aware Commands
