# 5-18 Cross Tenant Analytics - Decision Trees

## Analytics Pipeline: Federated vs ETL vs CDC

---

## Decision Context

Choosing the approach for aggregating data across all tenants for analytical queries — balancing real-time needs against operational complexity.

---

## Decision Criteria

* performance: federated queries are slow across many tenants; ETL adds latency; CDC is near-real-time
* architectural: CDC is complex (Kafka/Debezium); ETL is simpler; federated needs no data movement
* maintainability: ETL is easiest to implement and debug
* security: tenant data in warehouse must be tagged with tenant_id

---

## Decision Tree

How to aggregate tenant data for analytics?

↓

Need real-time (< 1 min latency)?

YES → CDC pipeline (Debezium, PostgreSQL logical replication)

    ↓
    Database → Debezium → Kafka → Stream processor → Data warehouse
    Every change streams immediately
    Tenant_id tagged in warehouse
    
    ↓
    Pro: Real-time, minimal load on source DB
    Con: Complex infrastructure (Kafka, connectors)
    Complex: Schema changes must be handled in CDC

NO → Near-real-time acceptable (minutes to hours)?

    YES → ETL pipeline (scheduled job)
    
        ↓
        Per-tenant extract jobs → transform → load to warehouse
        Queue one job per tenant for parallel extraction
        Schedule: every 15-60 minutes
        
        ↓
        Pro: Simple to implement, easy debugging
        Con: Minutes to hours latency
        Con: Extract queries load tenant databases

NO → Occasional analytics only?

    → Federated queries (FDW, Trino/Presto)
    Query tenant databases directly via foreign data wrappers
    No data duplication
    
    ↓
    Pro: No ETL pipeline, always fresh data
    Con: Slow with many tenants, impacts OLTP performance
    Only suitable for low-frequency, low-QPS analytics

---

## Recommended Default

**Default:** ETL pipeline for most SaaS analytics; CDC for real-time requirements
**Reason:** ETL is simpler to implement and maintain. CDC is justified when real-time analytics provides clear business value.

---

## Security: Tenant Isolation in Warehouse

---

## Decision Context

Ensuring cross-tenant analytics doesn't accidentally expose one tenant's data to another through the data warehouse.

---

## Decision Criteria

* performance: row-level filtering adds query overhead
* architectural: warehouse tables must have tenant_id column
* maintainability: warehouse queries should default to filtering by tenant
* security: warehouse access must respect tenant boundaries

---

## Decision Tree

How to isolate tenant data in the warehouse?

↓

All rows tagged with tenant_id?

YES → Implement row-level access control

    ↓
    Every warehouse table has tenant_id column
    Create views or row filters by tenant
    Non-admin users see only their tenant's data
    Admin users can query across tenants
    
    ↓
    Use: Redshift row-level security, BigQuery row-level access
    Or: Application-level filtering (WHERE tenant_id = ?)

NO → Per-tenant warehouse schemas?

    YES → Separate schema/dataset per tenant
        
        ↓
        tenant_analytics_123, tenant_analytics_456
        Physical schema isolation
        No risk of cross-tenant query
        
        ↓
        Pro: Strongest isolation
        Con: More objects to manage, harder cross-tenant queries

NO → Single warehouse for all?

    → Must use app-level filtering
    Risk: forgetting WHERE clause exposes all tenant data
    Mitigation: parameterized queries, query builder that auto-filters

---

## Recommended Default

**Default:** Rows tagged with tenant_id + row-level security in warehouse views
**Reason:** Balance of isolation and query flexibility. Single warehouse with row-level security is simpler than per-tenant warehouses.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Cross-Tenant Analytics
* Implement Per-Tenant Backups and Restore
