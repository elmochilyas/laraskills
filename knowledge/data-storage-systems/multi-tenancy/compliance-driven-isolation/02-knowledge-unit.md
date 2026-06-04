# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.22 Compliance-driven isolation (GDPR, HIPAA, SOC 2)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Regulatory compliance (GDPR, HIPAA, SOC 2, PCI-DSS) may mandate specific tenant isolation levels. GDPR requires data separation and the right to deletion. HIPAA requires strict access controls and audit trails. SOC 2 requires logical access controls. The isolation model must satisfy the strictest regulation among tenants.

---

# Core Concepts

- **GDPR**: Right to deletion requires the ability to delete all data for a specific user/tenant. DB-per-tenant: drop the database. Shared-table: delete rows across all tables (harder).
- **HIPAA**: Requires audit of all PHI access. Per-tenant audit logs. BAA required with infrastructure providers.
- **SOC 2**: Logical access controls — tenant isolation via application and database. RBAC scoped to tenant. Regular penetration testing for cross-tenant access.

---

# Patterns

**Isolation by regulation tier**: Shared-table for non-sensitive tenants. Schema-per-tenant for GDPR-only tenants. DB-per-tenant for HIPAA/PCI tenants. Compliance tier maps to isolation tier.

**Audit trail per tenant**: Log every data access with tenant_id. Central audit log with tenant filter. Required for HIPAA and SOC 2.

**Data residency**: For GDPR, EU tenant data must stay in EU region. DB-per-tenant enables region-specific placement.

---

# Common Mistakes

**Single isolation for all tenants**: If 95% of tenants don't need HIPAA compliance, don't force them into DB-per-tenant. Map isolation to compliance requirement.

---

# Related Knowledge Units

5.17 Tenant segmentation | 5.23 Multi-region placement
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

