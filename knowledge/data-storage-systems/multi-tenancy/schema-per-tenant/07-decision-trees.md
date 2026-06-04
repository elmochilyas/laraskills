# 5-2 Schema Per Tenant - Decision Trees

## Schema-Per-Tenant vs Database-Per-Tenant Isolation Level

---

## Decision Context

Choosing between schema-per-tenant (shared database, separate schemas) and database-per-tenant (separate databases) based on isolation requirements, operational capacity, and database engine.

---

## Decision Criteria

* performance: schema-per-tenant uses single connection pool; database-per-tenant requires N connections
* architectural: PostgreSQL supports true schemas; MySQL schemas are databases — only suitable for PostgreSQL
* security: schema-per-tenant provides medium isolation; database-per-tenant provides full isolation
* maintainability: schema-per-tenant needs single migration pipeline; database-per-tenant needs N migrations

---

## Decision Tree

Which isolation strategy?

↓

Using PostgreSQL?

YES → Schema-per-tenant viable

    ↓
    CREATE SCHEMA tenant_123;
    SET search_path TO tenant_123;
    Single connection per worker — low overhead
    Medium isolation, medium complexity
    
    ↓
    Need higher isolation (compliance)?
    → Database-per-tenant instead
    Schema-per-tenant cannot prevent superuser cross-tenant access

NO → Using MySQL?

    YES → Schema-per-tenant NOT viable
    
        ↓
    MySQL schemas = databases
    Schema-per-tenant on MySQL = database-per-tenant
    Use shared-table (simpler) or database-per-tenant (stronger isolation)
    
    NO → Choose isolation level based on compliance
    → HIPAA/SOC2: database-per-tenant
    → Standard SaaS: shared-table or schema-per-tenant (PG only)

---

## Recommended Default

**Default:** Schema-per-tenant for PostgreSQL; shared-table for MySQL (unless compliance requires database-per-tenant)
**Reason:** Schema-per-tenant offers the best balance of isolation and operational simplicity on PostgreSQL. MySQL does not support true schema-per-tenant.

---

## Migration Strategy: Single vs Per-Schema

---

## Decision Context

Managing database migrations across multiple tenant schemas — applying schema changes to all tenants without drift.

---

## Decision Criteria

* performance: per-schema migration loops through all tenants (N queries per migration)
* architectural: schemas may diverge if migrations fail on some tenants
* maintainability: single migration pipeline is simpler; per-schema allows tenant-specific versions
* security: migration must never expose cross-tenant data

---

## Decision Tree

How to run migrations for schema-per-tenant?

↓

All tenants on same schema version?

YES → Loop through tenants, run single migration set

    ↓
    Get list of all tenant schemas
    For each tenant: SET search_path → run migrations
    Single migration batch per tenant
    
    ↓
    Use Artisan command with --tenant option
    Track migration state per schema (migrations table in each schema)
    Log failures per tenant, don't stop on first error

NO → Tenants on different versions?

    YES → Per-tenant migration ledger
    
        ↓
    Track migration version per tenant
    Only apply pending migrations for each tenant
    Enable gradual rollout — migrate tenants in batches
    
    NO → New tenant creation?
    
        → Run all migrations on new schema
        Use a fresh migrations command for provisioning

---

## Recommended Default

**Default:** Loop through tenant schemas with single migration batch, track per-schema in migration tables
**Reason:** Simple and reliable for most SaaS applications. Per-tenant ledger adds complexity only needed for gradual rollouts.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Schema-Per-Tenant Multi-Tenancy
