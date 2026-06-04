# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.5 Eloquent global scopes for tenant isolation (bootTraits, addGlobalScope)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Eloquent global scopes automatically inject `WHERE tenant_id = ?` into every query for a model. Implemented via `addGlobalScope` or a `Bootable` trait. The foundation of shared-table tenant isolation. Every model that should be tenant-scoped must apply the scope.

---

# Core Concepts

- **addGlobalScope**: `protected static function booted() { static::addGlobalScope('tenant', fn($q) => $q->where('tenant_id', tenant()->id)); }` — applied to all queries on this model.
- **Bootable trait**: Reusable trait `TenantScoped` that applies the scope and defines `tenant_id` column.
- **withoutGlobalScope**: `Model::withoutGlobalScope('tenant')->get()` — bypasses the scope. Use carefully.

---

# Patterns

**TenantScoped trait**: In `App\Traits\TenantScoped` — adds global scope, defines `scopeForTenant`, provides `isTenantScoped()` check.

**BelongsToTenant relationship**: Define `tenant()` relationship on scoped models. Enables `$model->tenant` access.

---

# Common Mistakes

**Forgetting the scope on new models**: Every new tenant-scoped model must use the trait. One unscoped model = cross-tenant data leak.

---

# Related Knowledge Units

5.1 Shared-table | 5.12 withoutGlobalScope guardrails | 2.5 Global/local scopes
## Ecosystem Usage

The stancl/tenancy package dominates Laravel multi-tenancy. Three approaches: shared-table with global scopes, schema-per-tenant, and database-per-tenant. PostgreSQL row-level security offers database-enforced tenant isolation.

## Failure Modes

Cross-tenant data leaks when global scopes are bypassed. Tenant resolution failures expose all tenant data. Connection pool exhaustion from per-tenant connections. Migration drift between tenant databases.

## Performance Considerations

Connection count equals tenant count times connections per tenant. Pooling is essential for database-per-tenant. Shared-table queries must include tenant ID filters.

## Production Considerations

Implement canary rollout for migrations. Monitor noisy neighbor tenants. Use connection health checks. Implement per-tenant backup strategies.

## Research Notes

PostgreSQL schema-per-tenant with RLS is increasingly favored. Connection pooling continues to improve. The community trend is toward database-per-tenant for SaaS.

## Internal Mechanics

stancl/tenancy leverages Laravel's queue and connection management. Tenant resolution happens in middleware by matching hostname against a central database. Global scopes apply to Eloquent queries at model boot time.

## Architectural Decisions

Shared-table: Low isolation, single connection, low complexity. Schema-per-tenant: Medium isolation, single connection, medium complexity. Database-per-tenant: High isolation, N connections, high complexity.

## Tradeoffs

Shared-table simplicity comes with cross-tenant leak risk. Database isolation provides safety but connection overhead. Schema-per-tenant balances isolation and complexity.

## Mental Models

Each tenant is a separate silo. Shared-table = cubicle walls. Schema-per-tenant = office walls. Database-per-tenant = separate buildings. Choose based on tenant trust requirements.

