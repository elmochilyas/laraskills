# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.3 Database-per-tenant (separate DB per tenant)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Each tenant gets their own database. Strongest isolation, simplest backup/restore per tenant, clearest billing attribution. Highest operational cost — N databases to manage, monitor, and migrate. Used for enterprise SaaS with compliance requirements or high-value tenants.

---

# Core Concepts

- **Full isolation**: Tenant A's data never touches Tenant B's database. No possibility of cross-tenant queries.
- **Connection management**: Each tenant has a separate database connection. Connection pooling per tenant or shared pool with dynamic database selection.
- **Operational overhead**: N databases × migrations, backups, monitoring, upgrades.

---

# Patterns

**Dynamic connection**: `config(['database.connections.tenant.database' => 'tenant_'.$tenant->id])` — rebuild connection config per request.

**Backup per tenant**: Each database independently backed up. Restore for a single tenant without affecting others.

**Billing alignment**: Direct correlation between tenant and database — CPU, IOPS, storage costs track to the tenant.

---

# Common Mistakes

**Creating too many connections**: N tenants = N database connections per PHP-FPM worker. Use a connection pool or limit concurrent tenants per server.

---

# Related Knowledge Units

5.1 Shared-table | 5.2 Schema-per-tenant | 5.13 Tenant connection caching
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

