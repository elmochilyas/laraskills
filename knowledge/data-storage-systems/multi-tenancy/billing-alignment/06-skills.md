# Skill: Align Tenant Resources with Billing

## Purpose

Attribute database resource costs to specific tenants for accurate billing, chargeback, and usage-based pricing.

## When To Use

- Usage-based billing (per-storage, per-query, per-API-call)
- Enterprise tenants needing usage reports
- Cost allocation across business units
- Showback/chargeback to internal teams

## When NOT To Use

- Flat-rate pricing with no usage component
- Single-tenant application
- Costs too small to justify metering infrastructure

## Prerequisites

- Per-tenant resource monitoring
- Usage data collection pipeline
- Billing system integration

## Inputs

- Per-tenant resource metrics (storage, IOPS, connections, query count)
- Billing rate card (price per GB, per 1000 queries, etc.)
- Tenant plan information

## Workflow (numbered steps)

1. For DB-per-tenant: collect per-database metrics from RDS/CloudWatch or PostgreSQL `pg_stat_database`
2. For shared-table: estimate usage via proxy metrics: rows per tenant, query count per tenant, storage bytes per tenant
3. Collect API request counts per tenant (from application logs or middleware)
4. Transform raw metrics into billable units: GB-months, million queries, API calls
5. Apply rate card to calculate usage cost per tenant
6. Generate billing reports and push to billing system
7. Allow tenants to view their usage via dashboard

## Validation Checklist

- [ ] Usage data collected for all tenants
- [ ] Cost attribution is accurate (±5% for shared, ±1% for dedicated)
- [ ] Billing reports generated on schedule
- [ ] Tenants can view their usage in dashboard

## Common Failures

- Shared-table attribution is inaccurate (all tenants share same pool)
- Monitoring misses some tenant activity (queue jobs, CLI commands)
- Usage data delayed — billing cycle misses current period

## Decision Points

- Direct attribution (DB-per-tenant) vs estimated attribution (shared-table)
- Collection frequency: daily vs hourly vs real-time
- Rate card: flat per-resource vs tiered pricing

## Performance Considerations

- Collection queries impact database — schedule during low traffic
- Aggregation queries run on analytical store, not production
- Rate card updates must reprocess current billing period

## Security Considerations

- Tenant usage data is sensitive — restrict access
- Billing reports must not expose other tenants' data
- Usage data retention matches billing audit requirements

## Related Rules

- 5-21-1: Always Attribute Costs Per Tenant
- 5-21-2: Never Expose Per-Tenant Costs To Other Tenants

## Related Skills

- Implement Tenant Billing and Metering
- Implement Per-Tenant Scaling
- Implement Tenant Segmentation

## Success Criteria

- Cost attribution accuracy > 95% for shared, > 99% for dedicated
- Billing reports generated within 24 hours of period end
- Tenants can view up-to-date usage data

---

# Skill: Meter Per-Tenant Database Usage

## Purpose

Collect and aggregate per-tenant database usage metrics (storage, IOPS, query count, connection time) for billing and capacity planning.

## When To Use

- Usage-based billing for database resources
- Capacity planning per tenant
- Identifying inefficient tenants (high IOPS for low value)

## When NOT To Use

- Flat-rate pricing
- Infrastructure costs trivial compared to subscription revenue

## Prerequisites

- Database monitoring tools (Performance Schema, pg_stat_statements)
- Tenant identification on database connections
- Metrics storage (time-series DB or data warehouse)

## Inputs

- Database performance metrics
- Tenant-to-connection mapping
- Collection schedule

## Workflow (numbered steps)

1. Enable `pg_stat_statements` (PostgreSQL) or `performance_schema` (MySQL) with tenant tags
2. Collect per-tenant metrics: storage bytes, rows read/written, query count, IOPS
3. For shared-table: `SELECT COUNT(*), SUM(storage) FROM tables GROUP BY tenant_id`
4. Store aggregated metrics in time-series database
5. Calculate billable units: GB-hours, million-query-units
6. Generate daily usage summary per tenant

## Validation Checklist

- [ ] All tenants have usage metrics collected
- [ ] Metrics include all access paths (API, queue, CLI)
- [ ] Storage metrics are accurate to within 1%
- [ ] Query count metrics are accurate to within 5%

## Common Failures

- Queue job queries not tagged with tenant — missing from per-tenant metrics
- Storage metrics for shared-table don't account for index overhead
- Collection queries impact production database performance

## Decision Points

- Real-time streaming vs batch collection
- Store raw metrics vs pre-aggregated summaries
- Retention period for raw metrics

## Performance Considerations

- `pg_stat_statements` adds 2-5% CPU overhead
- Collection queries should run on replica (not primary)
- Aggregation period: 1-minute granularity for billing, 1-hour for capacity planning

## Security Considerations

- Usage metrics may reveal business activity patterns
- Metrics storage must have access controls
- Retention and deletion policies must match data privacy requirements

## Related Rules

- 5-21-1: Always Attribute Costs Per Tenant

## Related Skills

- Implement Billing Alignment
- Implement Tenant Resource Limits
- Implement Tenant Monitoring and Observability

## Success Criteria

- Per-tenant usage data available within 5 minutes of activity
- Storage and query metrics accurate within 5%
- Metrics data retained for full billing audit period
