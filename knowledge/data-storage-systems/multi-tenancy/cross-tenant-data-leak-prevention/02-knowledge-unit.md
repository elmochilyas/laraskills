# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.11 Cross-tenant data leak prevention (testing, code review, bypass gating)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Cross-tenant data leaks are the most serious security vulnerability in multi-tenant systems. Prevention requires multiple layers: automated tests that verify tenant isolation, code review checklists for any scope bypass, and access control gating for `withoutGlobalScope`. Every new feature and every query must be assumed to leak until proven isolated.

---

# Core Concepts

- **Isolation tests**: Create two tenants with overlapping data. Assert Tenant A can never access Tenant B's data through any endpoint or command.
- **Scope bypass audit**: Every `withoutGlobalScope()` call must be reviewed and justified. Tag with a reason comment.
- **Penetration testing**: Automated cross-tenant access attempts. Try tenant_id manipulation in requests, headers, parameters.

---

# Patterns

**TenantPair test helper**: Creates two tenants with deliberately similar data (same names, dates, statuses). Tests that all endpoints return only current tenant's data.

**withoutGlobalScope gate**: Custom macro that logs the caller and reason. CI enforces that every bypass has an associated issue number.

---

# Common Mistakes

**Assuming global scope covers all queries**: Raw queries, query builder without model, and relationship queries may bypass scopes. Test every data access path.

---

# Related Knowledge Units

5.5 Global scopes | 5.12 withoutGlobalScope guardrails
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

