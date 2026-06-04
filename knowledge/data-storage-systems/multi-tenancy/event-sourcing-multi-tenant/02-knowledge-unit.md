# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.26 Event sourcing in multi-tenant contexts (per-tenant event streams)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Event sourcing in multi-tenant systems requires per-tenant event streams. Each tenant's events are isolated — either in separate tables, separate schemas, or tagged with tenant_id in a shared event store. Projections must be tenant-aware. Event replay must scope to a single tenant.

---

# Core Concepts

- **Shared event store with tenant_id**: Single `stored_events` table partitioned by `tenant_id`. Most practical. Queries always filter by tenant.
- **Per-tenant event store**: Separate event store schema/database per tenant. Strongest isolation. Most complex projection management.
- **Tenant-scoped projections**: Projection rebuild scoped to one tenant's events. Not the entire event store.

---

# Patterns

**Tenant-aware projectors**: Projector receives `$event` with `$event->tenantId`. Updates only the tenant's read model.

**Tenant-scoped replay**: `Projectionist::replay(SomeProjector::class, tenantId: $tenantId)` — replays only events for that tenant.

---

# Common Mistakes

**Global event replay across tenants**: Rebuilding projections from all events overwrites one tenant's read model with another's. Always scope replay to tenant.

---

# Related Knowledge Units

14.1 Event store | 14.6 Projection building
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

