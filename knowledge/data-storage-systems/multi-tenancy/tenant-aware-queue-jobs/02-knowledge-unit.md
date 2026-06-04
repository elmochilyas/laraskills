# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.7 Tenant-aware queue jobs (tenant_id in payload, re-bind context in handle)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Queue jobs must know which tenant they belong to. Tenant ID is serialized into the job payload. On `handle()`, the tenant context is re-bound before business logic runs. Without this, queued tasks run in the wrong tenant context or no context at all.

---

# Core Concepts

- **Serialized tenant ID**: `public $tenantId` on the job class. Serialized when pushed to queue, deserialized when handled.
- **Context rebind**: `handle()` reads `$this->tenantId`, sets `app(CurrentTenant::class)`, reconfigures connection. Business logic then runs in correct context.
- **Horizon tags**: Tag jobs with tenant ID for per-tenant monitoring. `$this->tags = ['tenant:'.$this->tenantId]`.

---

# Patterns

**TenantAware job base class**: Abstract job with `$tenantId` property and `rebindTenantContext()` method. All tenant-aware jobs extend it.

**queue:work per tenant (high isolation)**: Separate `horizon` instances per tenant queue. Each worker configured for one tenant.

---

# Common Mistakes

**Forgetting to rebind context**: Job runs but queries are unscoped or in wrong database. Hardest-to-detect cross-tenant leak.

---

# Related Knowledge Units

5.8 Tenant-aware commands | 5.11 Cross-tenant leak prevention
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

