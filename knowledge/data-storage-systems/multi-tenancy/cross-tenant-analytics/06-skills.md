# Skill: Implement Cross-Tenant Analytics Pipeline

## Purpose

Aggregate data from all tenant databases into a central analytical store for platform-wide reporting, monitoring, and business intelligence.

## When To Use

- Platform-wide analytics across all tenants
- Business intelligence and reporting
- Product usage analytics and trend analysis
- Chargeback and billing metering

## When NOT To Use

- Per-tenant analytics within their own database
- Real-time operational queries (query tenant databases directly)
- Simple aggregations that can use federated queries

## Prerequisites

- Data warehouse or analytical database (BigQuery, Snowflake, Redshift, ClickHouse)
- ETL pipeline infrastructure
- Schema version knowledge for each tenant

## Inputs

- Tenant database connection details
- Analytical schema definition
- Pipeline schedule (hourly, daily)

## Workflow (numbered steps)

1. Choose pipeline approach:
   - ETL: scheduled extraction from each tenant, transform to common schema, load to warehouse
   - CDC: Debezium/Logical replication streams changes to Kafka → transform → warehouse
   - Federated: PostgreSQL FDW or Presto/Trino query across tenant databases
2. Tag each record with `tenant_id` in the warehouse
3. Transform tenant-specific schemas to a unified analytical schema
4. Schedule pipeline: CDC (continuous) or ETL (hourly/daily)
5. Validate data completeness: compare warehouse row counts against source
6. Implement access controls: per-tenant data visible only to tenant, aggregate data visible to platform

## Validation Checklist

- [ ] All tenant data present in analytical store
- [ ] `tenant_id` correctly tagged on all records
- [ ] Schema transformation is correct (no data loss)
- [ ] Pipeline latency within SLA (real-time: < 1min, ETL: < 1hr)
- [ ] Cross-tenant analytics does not expose individual tenant data

## Common Failures

- ETL misses newly created tenant databases
- CDC pipeline falls behind during peak traffic
- Schema differences between tenants cause transformation errors
- Federated query performance degrades as tenant count grows

## Decision Points

- ETL vs CDC vs federated queries
- Hourly vs daily vs real-time pipeline
- Warehouse schema design: per-tenant tables vs single unified table with tenant_id

## Performance Considerations

- ETL pipeline load on tenant databases: monitor for impact
- CDC pipeline overhead: Debezium adds minimal load (reads WAL/binlog)
- Warehouse query performance: partition by tenant_id for filtered queries

## Security Considerations

- Warehouse must enforce per-tenant data access (RLS or separate tables)
- Platform team access to aggregate data only (no raw tenant data without approval)
- Pipeline credentials must be rotated regularly

## Related Rules

- 5-18-1: Always Tag Tenant Data In Warehouse
- 5-18-2: Never Expose Cross-Tenant Aggregate Data As Per-Tenant Data

## Related Skills

- Implement Cross-Tenant Data Isolation
- Implement Tenant Billing and Metering
- Implement Schema Version Ledger

## Success Criteria

- Cross-tenant analytics data is complete and up-to-date
- Per-tenant data access is isolated in the warehouse
- Pipeline operates within resource budget and SLA

---

# Skill: Build a Federated Cross-Tenant Query System

## Purpose

Execute queries across all tenant databases in real-time without data duplication, using foreign data wrappers or distributed query engines.

## When To Use

- Real-time cross-tenant queries needed (no ETL latency tolerance)
- Relatively small number of tenants (< 100)
- Dynamic schema per tenant (frequent changes make ETL complex)

## When NOT To Use

- More than 100 tenants (performance degrades)
- High query frequency per second
- Complex analytical queries (use ETL to warehouse instead)

## Prerequisites

- PostgreSQL FDW, MySQL FEDERATED, Presto/Trino, or ClickHouse
- Tenant database accessible from query engine

## Inputs

- Tenant database connection list
- Federated query SQL template
- Query timeout configuration

## Workflow (numbered steps)

1. Configure foreign server per tenant database
2. Create foreign table wrappers mapping tenant tables
3. Write federated queries that UNION ALL across tenant foreign tables
4. Implement query timeout per tenant (slow tenant doesn't stall entire query)
5. Cache frequently used query results
6. Monitor query performance and error rates per tenant

## Validation Checklist

- [ ] Foreign servers configured for all tenant databases
- [ ] Federated queries return correct aggregated results
- [ ] Query timeout prevents slow tenants from blocking results
- [ ] Results are tagged with tenant_id

## Common Failures

- Query timeout too short — results incomplete
- Foreign server connection fails — partial results
- Network latency between query engine and tenant databases

## Decision Points

- PostgreSQL FDW vs Presto/Trino vs custom application-level queries
- Synchronous vs async query execution

## Performance Considerations

- Latency = max(per-tenant latency). One slow tenant delays all results
- Query engine must handle N parallel connections
- Cache heavily used queries to reduce tenant database load

## Security Considerations

- Federated query engine must enforce tenant data access controls
- Query logs must not expose tenant credentials
- Connection credentials to tenant databases must be encrypted

## Related Rules

- 5-18-1: Always Tag Tenant Data In Warehouse

## Related Skills

- Implement Cross-Tenant Analytics
- Implement Cross-Tenant Data Isolation

## Success Criteria

- Federated queries return correct results across all tenants
- Query timeout prevents slow tenants from blocking results
- System handles up to 100 tenants with < 10s query time
