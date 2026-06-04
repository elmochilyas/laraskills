# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.18 Cross-tenant analytics (federated queries, warehouse, CDC pipeline)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Cross-tenant analytics requires aggregating data from all tenants into a single analytical store. Approaches: federated queries across tenant databases (slow, complex), periodic ETL to a data warehouse (standard), CDC pipeline via Debezium or PostgreSQL logical replication (real-time). Each tenant's data is tagged with tenant_id in the warehouse for filtered and aggregate analysis.

---

# Core Concepts

- **Federated query**: Query across all tenant databases using foreign data wrappers (PostgreSQL FDW, MySQL FEDERATED) or Presto/Trino. No data duplication but query performance varies with tenant count.
- **ETL pipeline**: Cron or scheduled job extracts data from each tenant, transforms to common schema, loads to warehouse. Latency: minutes to hours.
- **CDC pipeline**: Database replication streams changes to Kafka/Redpanda → stream processor → warehouse. Real-time, less load on source databases.

---

# Patterns

**Tenant-tagged warehouse tables**: Each row in warehouse has `tenant_id`. Reports filter by tenant or aggregate across all tenants.

**Per-tenant extract jobs**: One queue job per tenant for ETL. Parallel extraction. If one tenant's extract fails, others continue.

---

# Common Mistakes

**Querying tenant databases directly for analytics**: Analytical queries (full table scans, aggregations) degrade OLTP performance. Always use a separate analytical store.

---

# Related Knowledge Units

5.19 Schema version ledger | 5.27 Per-tenant backups
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

