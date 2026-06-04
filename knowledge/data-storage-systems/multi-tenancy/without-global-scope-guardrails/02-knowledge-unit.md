# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.12 withoutGlobalScope guardrails (permitted uses, review requirements)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

`withoutGlobalScope` bypasses tenant isolation — it must be treated as a privileged operation. Every call should have documented justification and explicit approval. Permitted uses: cross-tenant admin reports, tenant provisioning/cleanup, system-wide analytics. Prohibited uses: feature queries, dashboard widgets, user-facing endpoints.

---

# Core Concepts

- **Principle**: Tenant isolation is the default. `withoutGlobalScope` is an explicit opt-out requiring justification.
- **Permitted uses**: Admin panels with proper authorization, tenant provisioning code, data export/import tools, system maintenance commands.
- **Prohibited uses**: Any user-facing controller, API endpoint, or service method that returns data to non-admin users.

---

# Patterns

**Annotations/comments**: Every `withoutGlobalScope` call annotated with `// @tenant-escape: ISSUE-1234, reason`. CI validates annotation exists.

**Custom withoutGlobalScopeFor macro**: Wraps scope bypass with logging, tracks usage in production, alerts on unexpected calls.

---

# Common Mistakes

**withoutGlobalScope in feature queries**: "Just this one time, I need all tenants' data for a dashboard." — Instead, add a dedicated admin query with explicit authorization.

---

# Related Knowledge Units

5.5 Global scopes | 5.11 Cross-tenant leak prevention
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

