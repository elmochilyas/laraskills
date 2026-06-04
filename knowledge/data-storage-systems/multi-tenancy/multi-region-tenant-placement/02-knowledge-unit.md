# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.23 Multi-region tenant placement (data residency requirements)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Multi-region tenant placement ensures tenant data resides in a specific geographic region to satisfy data residency laws (GDPR, LGPD, CCPA, PIPL). Each region has independent infrastructure (database, storage, cache). Tenant provisioning creates resources in the required region. Cross-region data transfer is restricted or prohibited.

---

# Core Concepts

- **Region assignment**: Tenant signup captures region requirement (based on IP, billing address, or tenant selection). Provisioning pipeline creates resources in that region's infrastructure.
- **Regional infrastructure**: Per-region database cluster, S3 bucket, cache, queue. Independent failure domains.
- **Cross-region restrictions**: Block cross-region queries. Use CDC (Kafka MirrorMaker) for global analytics if needed.

---

# Patterns

**Region-aware connection resolution**: `config(['database.connections.tenant.database' => $tenant->region.'_'.$tenant->id])` — region prefix in database name. Route to correct cluster.

**Latency-optimized routing**: Route users to nearest region for read. Writes always go to home region. Replicate reads cross-region.

---

# Common Mistakes

**Single-region deployment for global SaaS**: GDPR fine of 4% of global revenue for storing EU data outside EU. Multi-region is not optional for EU customers.

---

# Related Knowledge Units

5.10 Tenant provisioning | 5.22 Compliance-driven isolation
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

