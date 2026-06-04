# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.27 Per-tenant database backups and restore
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Per-tenant backup/restore is essential for DB-per-tenant isolation model and compliance (GDPR right to deletion, customer data export). Each tenant's database is backed up independently. Restore for one tenant doesn't affect others. Snapshots, pg_dump per database, or automated backup scheduling per tenant.

---

# Core Concepts

- **Snapshot per database**: RDS automated snapshots per DB instance. For multi-tenant (shared DB), this backs up all tenants together — not per-tenant.
- **Per-tenant dump**: `pg_dump -d tenant_db_name` or `mysqldump tenant_db_name`. Individual backup files. Restorable independently.
- **GDPR delete**: For shared-table, deleting tenant data means `DELETE FROM orders WHERE tenant_id = ?` across all tables. For DB-per-tenant, drop the entire database.

---

# Patterns

**Backup schedule per tier**: Enterprise tenants (DB-per-tenant): hourly snapshots, 30-day retention. Standard tenants: daily snapshots, 7-day retention.

**Self-service restore**: Enterprise tenants can trigger restore from UI. Standard tenants require support ticket.

---

# Common Mistakes

**Using only shared database snapshots**: Snapshot contains all tenants' data. Restoring for one tenant requires restoring all tenants. Use per-tenant dumps for independent restore.

---

# Related Knowledge Units

5.3 DB-per-tenant | 5.10 Tenant lifecycle | 5.22 Compliance-driven isolation
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

