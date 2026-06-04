# 5-21 Billing Alignment - Decision Trees

## Cost Attribution Model

---

## Decision Context

Choosing how to attribute database infrastructure costs to tenants — direct (DB-per-tenant) or estimated (shared-table with usage metrics).

---

## Decision Criteria

* performance: monitoring costs are negligible vs infrastructure costs
* architectural: DB-per-tenant enables direct cost mapping
* maintainability: estimated attribution requires usage metering infrastructure
* security: cost data is sensitive — tenant should only see own costs

---

## Decision Tree

How to attribute costs to tenants?

↓

Database-per-tenant architecture?

YES → Direct cost attribution

    ↓
    Each tenant has dedicated RDS instance / database
    CloudWatch metrics per DB: CPU, IOPS, storage, connections
    Cost = instance cost + storage cost + data transfer
    
    ↓
    Use AWS Cost Explorer tags on RDS instances
    tenant_id tag on each resource
    Automated billing report per tenant

NO → Shared-table or schema-per-tenant?

    YES → Estimated attribution via usage metrics
        
        ↓
        Proxy metrics:
        - Storage: bytes owned per tenant (row count × avg row size)
        - Compute: query count per tenant, slow query count
        - IOPS: estimated from query patterns
        
        ↓
        Simpler: tiered pricing covers estimated costs
        Usage caps prevent extreme cost variance
        Less precise but sufficient for most SaaS

NO → Hybrid (mixed isolation)?

    → Direct for enterprise tenants; estimated for shared
    Enterprise tenants (DB-per-tenant): direct billing
    Free/Pro tenants (shared): tiered pricing

---

## Recommended Default

**Default:** Direct attribution for DB-per-tenant; tiered pricing for shared-table/schema
**Reason:** Direct attribution is precise but only possible with DB-per-tenant. Tiered pricing with usage caps is simpler and sufficient for shared infrastructure.

---

## Usage Metering for Overages

---

## Decision Context

Tracking per-tenant usage beyond plan limits to charge overages and prevent resource abuse.

---

## Decision Criteria

* performance: metering adds ~1ms per request to record usage
* architectural: metering must be tenant-scoped and near-real-time
* maintainability: automated metering removes manual billing work
* security: metering data must be append-only to prevent tampering

---

## Decision Tree

How to meter tenant usage?

↓

Track per API request?

YES → Meter in middleware

    ↓
    Middleware records: tenant_id, endpoint, timestamp, response_bytes
    Aggregate: daily usage per tenant
    Compare against plan limits
    
    ↓
    Store in Redis with daily TTL
    Flush to persistent store at end of day
    Check limits before allowing requests

NO → Track storage usage?

    YES → Scheduled job (nightly)
        
        ↓
        Per-tenant: sum(row_sizes) or S3 bucket sizes
        If > plan limit: notify, upsell, or throttle
        
    NO → Track compute (query count)?
    
        → Database metrics per tenant
        pg_stat_statements or performance_schema per tenant
        Export to billing system

---

## Recommended Default

**Default:** API request metering + nightly storage usage check
**Reason:** API request volume is the primary cost driver for most SaaS. Storage is the secondary driver. Both are cheap to meter.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Billing Alignment
* Implement Tenant Segmentation
