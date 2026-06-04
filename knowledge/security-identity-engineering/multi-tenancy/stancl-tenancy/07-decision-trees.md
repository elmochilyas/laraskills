# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Multi-Tenancy Security
**Knowledge Unit:** stancl/tenancy Package Architecture
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Shared DB vs Database-Per-Tenant in Stancl | Isolation strategy selection | architectural, scale |
| 2 | Bootstrapper Selection | Which tenant-scoped services to enable | performance, isolation |

---

# Architecture-Level Decision Trees

---

## Shared DB vs Database-Per-Tenant in Stancl

---

## Decision Context

Choosing the tenant isolation strategy when using `stancl/tenancy` — shared database with `tenant_id` or dedicated database per tenant.

---

## Decision Criteria

* architectural
* scale

---

## Decision Tree

Does the application require physical data isolation (HIPAA, PCI DSS)?
↓
YES → Database-per-tenant (Stancl supports this natively)
NO → Is the expected tenant count > 1000?
    YES → Shared database (database-per-tenant doesn't scale beyond ~1000 without significant operational pain)
    NO → Shared database (simpler, recommended default)

Are cross-tenant analytics required?
↓
YES → Shared database (cross-DB analytics is complex and slow)
NO → Either approach works

What is the team's operational capacity?
↓
Limited → Shared database (one database to manage)
Dedicated ops team → Database-per-tenant feasible

Will tenants have dedicated database resource requirements?
↓
YES → Database-per-tenant (isolate resource usage per tenant)
NO → Shared database (shared resources, simpler)

---

## Rationale

Stancl supports both patterns with minimal configuration change — the main difference is whether the `DatabaseTenancyBootstrapper` connects to a per-tenant database or adds a tenant_id scope to the shared database. For most applications, the shared database pattern is correct. Database-per-tenant is for compliance or tenant-scale reasons.

---

## Recommended Default

**Default:** Shared database pattern (simpler, more scalable for many tenants); database-per-tenant only for regulatory compliance or dedicated resource requirements
**Reason:** Stancl's shared database pattern uses tenant_id scoping — the same approach as manual global scopes but integrated with the package's tenant lifecycle. Database-per-tenant adds operational complexity without benefit for most applications.

---

## Risks Of Wrong Choice

- Database-per-tenant for 1000+ tenants: 1000 migrations on every deploy
- Shared DB without cache isolation: cross-tenant cache poisoning
- Database-per-tenant without automated migration: tenant databases fall behind
- Wrong storage driver selection: Redis data store loses tenant data on restart

---

## Related Rules

- Use the Package's Built-in Tenant Identification (05-rules.md)
- Use the Tenant Model's Events for Lifecycle Hooks (05-rules.md)
- Use Tenant-Aware Cache, Queue, and Filesystem Prefixing (05-rules.md)

---

## Related Skills

- Configure stancl/tenancy for Multi-Tenant Application Architecture (06-skills.md)

---

## Bootstrapper Selection

---

## Decision Context

Which Stancl bootstrappers to enable — database, cache, filesystem, Redis, queue — and their configuration.

---

## Decision Criteria

* performance
* isolation

---

## Decision Tree

Does the application use database connections?
↓
YES → Enable `DatabaseTenancyBootstrapper` (required for both shared and per-tenant DB)
NO → Disable (no database bootstrapping needed)

Does the application use Laravel cache?
↓
YES → Enable `CacheTenancyBootstrapper` (prevents cross-tenant cache poisoning)
NO → Disable

Does the application store files per tenant?
↓
YES → Enable `FilesystemTenancyBootstrapper` (tenant-scoped storage paths)
NO → Disable

Does the application use Redis directly (beyond cache)?
↓
YES → Enable `RedisTenancyBootstrapper` (tenant-prefixed Redis keys)
NO → Disable

Does the application use queues?
↓
YES → Queue tags handled automatically by package (no separate bootstrapper needed)
NO → No queue configuration needed

What is the performance budget?
↓
Tight → Enable minimum bootstrappers (database only, maybe cache)
Generous → Enable all relevant bootstrappers for full isolation

---

## Rationale

Each bootstrapper adds initialization overhead (~1-5ms per request). Only enable the bootstrappers that are needed — if the application doesn't use Redis or filesystem storage per tenant, those bootstrappers are unnecessary overhead. The database bootstrapper is always required. Cache bootstrapper is strongly recommended for any app using cache.

---

## Recommended Default

**Default:** Enable `DatabaseTenancyBootstrapper` (required) + `CacheTenancyBootstrapper` (strongly recommended); enable `FilesystemTenancyBootstrapper` only if tenant file isolation is needed; `RedisTenancyBootstrapper` only if using Redis directly
**Reason:** Database bootstrapping is the core of tenancy. Cache bootstrapping prevents the most common cross-tenant data leak (serving cached data from one tenant to another). Filesystem and Redis bootstrappers add overhead that is only justified when those services are used per-tenant.

---

## Risks Of Wrong Choice

- No cache bootstrapper: cross-tenant cache poisoning (one tenant's data served to another)
- No database bootstrapper: tenancy doesn't work at all
- All bootstrappers enabled: unnecessary 10-20ms overhead per request
- Filesystem bootstrapper without tenant file storage: extra config with no benefit

---

## Related Rules

- Use Tenant-Aware Cache, Queue, and Filesystem Prefixing (05-rules.md)
- Initialize Tenancy Before Application Boot for Console Commands (05-rules.md)

---

## Related Skills

- Configure stancl/tenancy for Multi-Tenant Application Architecture (06-skills.md)
