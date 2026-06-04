# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.28 Deployment stamp pattern (full infrastructure per tenant group)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

The deployment stamp pattern provisions a complete, independent copy of the infrastructure stack per tenant group (or enterprise tenant). Each stamp includes database, cache, queue, application servers, and load balancer. Used for maximum isolation, data residency compliance, and dedicated SLAs.

---

# Core Concepts

- **Full stack per stamp**: One stamp = 1+ app servers + 1 database + 1 cache + 1 queue + 1 load balancer. Completely independent of other stamps.
- **Tenant group assignment**: Enterprise tenants get a dedicated stamp. Groups of smaller tenants share a stamp (e.g., 50 tenants per stamp for medium tier).
- **Stamp deployment via IaC**: Terraform/Pulumi/Bicep modules define a stamp. Deploy new stamp = run IaC with new configuration.

---

# Patterns

**Stamp sizing**: Determine max tenants per stamp based on expected load. Reserve 20% headroom for traffic spikes. When a stamp approaches capacity, split tenant group across two stamps.

**Stamp distribution across regions**: Enterprise stamps can be deployed in the tenant's preferred region. Regional stamps for data residency.

---

# Common Mistakes

**Under-provisioned stamp resources**: Each stamp needs enough headroom for traffic spikes. Under-provisioning causes noisy neighbor within the stamp.

---

# Related Knowledge Units

5.3 DB-per-tenant | 5.23 Multi-region placement | 5.16 Per-tenant scaling
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

