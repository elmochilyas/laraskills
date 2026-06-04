# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.21 Billing alignment with isolation model (DB-per-tenant for spend correlation)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Billing alignment means resource costs are attributable to specific tenants. DB-per-tenant provides the clearest correlation: each database's CPU, IOPS, storage, and connection count map directly to a tenant. Shared-table requires estimated cost allocation via usage metrics (row count, query count, storage bytes).

---

# Core Concepts

- **Direct attribution (DB-per-tenant)**: Monitor per-database metrics (RDS CloudWatch DBPerfInsights). Costs map 1:1 to tenants. Precise billing.
- **Estimated attribution (shared-table)**: Proxy by storage (bytes per tenant), query count per tenant, API requests. Less precise but sufficient for tiered pricing.
- **Usage metering**: Track per-tenant API requests, storage used, compute time. Bill above plan limits.

---

# Patterns

**Tiered pricing with usage caps**: Tenant pays for tier (e.g., $99/month for 10GB, 100K requests). Overages billed by metered usage. DB cost is below tier price; margin covers shared infrastructure.

**Cloud cost allocation tags**: Tag RDS instances, S3 buckets, cache clusters with `tenant_id`. AWS Cost Explorer attributes spend per tenant.

---

# Common Mistakes

**Flat pricing regardless of usage**: Power users consume 100x resources of light users at same price. Margin erodes. Usage-based pricing aligns cost with revenue.

---

# Related Knowledge Units

5.3 DB-per-tenant | 5.17 Tenant segmentation
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

