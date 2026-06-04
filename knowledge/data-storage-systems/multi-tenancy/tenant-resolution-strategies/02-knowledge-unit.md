# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.4 Tenant resolution strategies (domain, subdomain, header, token, authenticated user)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Tenant resolution identifies which tenant the current request belongs to. Strategies: domain (acme.app.com), subdomain (acme.saas.com), header (X-Tenant-ID), token (JWT claim), or authenticated user relationship. Chosen at middleware level, resolved once per request.

---

# Core Concepts

- **Subdomain resolution**: Parse `$request->getHost()`, extract subdomain. Match against tenants table. Fast, DNS-driven routing.
- **Domain resolution**: Custom domain per tenant. Requires domain verification (DNS record). CNAME or A record pointing to platform.
- **Header/token resolution**: For API-first SaaS. `X-Tenant-ID` header or tenant embedded in JWT. No DNS dependency.
- **Auth resolution**: Tenant derived from `auth()->user()->tenant_id`. Simplest for single-tenant-per-user models.

---

# Patterns

**Middleware chain**: `IdentifyTenant` middleware resolves tenant, sets `app(CurrentTenant)`, scopes all subsequent queries.

**Caching resolution**: Resolved tenant cached in request scope. Not persisted between requests.

---

# Common Mistakes

**Resolving tenant in service layer**: Tenant resolution belongs in middleware. Resolving in controllers or services leads to duplication and inconsistent scoping.

---

# Related Knowledge Units

5.5 Global scopes | 5.6 Tenant-aware middleware
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

