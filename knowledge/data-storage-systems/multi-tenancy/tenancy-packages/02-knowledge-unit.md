# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.24 Packages: stancl/tenancy, spatie/laravel-multitenancy
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

stancl/tenancy is the most mature multi-tenancy package for Laravel (6K+ stars). Supports all isolation models, queue tenant-awareness, Redis tenant isolation, filesystem isolation. spatie/laravel-multitenancy is simpler, more opinionated, focused on shared-table with global scopes. Both handle tenant resolution, connection switching, and migration orchestration.

---

# Core Concepts

- **stancl/tenancy**: Full-featured. Supports single DB, schema, DB-per-tenant. Built-in tenant middleware, commands, queue awareness. Central database for tenant management. Customizable identification via domain, subdomain, path, header, or UUID.
- **spatie/laravel-multitenancy**: Lightweight. Shared-table model with global scopes. Tenant via authenticated user. Minimal configuration. Good for simple SaaS where every user belongs to a tenant.

---

# Patterns

**stancl/tenancy for complex isolation**: Needs schema-per-tenant, DB-per-tenant, custom domain support, or per-tenant Redis. The package handles migration orchestration and queue context.

**spatie/multitenancy for simple SaaS**: Each user is in one tenant. Shared-table isolation. No custom domains. Minimal learning curve.

---

# Common Mistakes

**stancl/tenancy without understanding the internals**: "The package handles everything" — but without understanding how tenant resolution, connection switching, and scope application work, debugging leaks is impossible.

---

# Related Knowledge Units

5.1 Shared-table | 5.2 Schema-per-tenant | 5.3 DB-per-tenant
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

