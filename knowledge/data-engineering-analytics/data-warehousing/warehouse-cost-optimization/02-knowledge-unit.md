# Warehouse Cost Optimization

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 04-data-warehousing
- **Knowledge Unit:** warehouse-cost-optimization
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Cloud data warehouse costs can grow super-linearly with bad query patterns, misconfigured warehouses, and lack of governance — the difference between well-optimized and naive queries can be 10-100x. Since warehouse costs are directly tied to query patterns that Laravel developers control — Eloquent queries, caching strategy, and materialization approach — cost optimization is a critical engineering concern.

---

## Core Concepts

- **Snowflake Pricing:** Charges per credit (compute + storage) — credits consumed per warehouse per hour based on size (X-Small = 1 credit/hr, 2X-Large = 32 credits/hr) — storage charged separately per TB/month
- **BigQuery Pricing:** Charges per byte scanned for queries (on-demand) or per slot (flat-rate) — first 1TB/month free, then $5/TB scanned — partitioning and clustering reduce bytes scanned
- **Redshift Pricing:** Charges per node-hour — reserved instances offer 30-60% discounts — Spectrum queries charged per byte scanned from S3
- **Bytes Scanned vs Credits Burned:** BigQuery cost determined by query data volume; Snowflake cost determined by warehouse runtime — fundamentally different pricing models require different optimization strategies

---

## Mental Models

- **Warehouse Costs as Utility Bill:** Snowflake is like paying for a generator rental (cost for time running, regardless of how much power you use). BigQuery is like paying for electricity per kilowatt-hour (cost for actual data processed). Different meters, different conservation strategies.
- **Query Cost as Shopping Spree:** Every `SELECT *` on BigQuery is like buying everything in the store without looking at prices. Partitioning and clustering are like using a shopping list — you only buy what you need. Materialized views are like buying in bulk — cheaper per unit if you use it often.

---

## Internal Mechanics

Snowflake charges per credit consumed by running warehouses. Every second a warehouse is active consumes credits proportional to its size. Auto-suspend stops the warehouse when idle, stopping credit consumption. BigQuery charges per byte scanned by each query — `SELECT *` on a 1TB table scans 1TB (cost: $5). Partition pruning and clustering reduce scanned bytes. Result caching means identical queries in 24h cost zero for both Snowflake (result cache) and BigQuery (cached results).

---

## Patterns

- **Cache Before the Warehouse:** Implement Redis or application-level caching for dashboard queries — 10-second cache TTL reduces warehouse queries by 99% for frequently accessed dashboards
- **Use Materialized Views:** Pre-compute common aggregations — dashboard queries against materialized views scan MB instead of GB — reduces both Snowflake compute time and BigQuery bytes scanned
- **Set Query Budgets:** Configure resource monitors (Snowflake) or cost controls (BigQuery) per project/warehouse — alert when costs exceed thresholds

---

## Architectural Decisions

Right-size Snowflake warehouses per workload — X-Small for dashboards, Large for ETL. Implement auto-suspend on all warehouses (1 minute interactive, 5 minutes ETL). For BigQuery, always partition tables by date and include date filters in every query. Use clustering on high-cardinality filter columns. Implement data lifecycle management with TTL for raw data and aggregated rollups for historical.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| 99% query reduction with caching | Cache staleness: data not real-time | Acceptable for most dashboards (within TTL) |
| 90%+ scan reduction with partitioning | Requires schema design upfront | Must choose partition keys carefully |
| Auto-suspend stops idle costs | Warehouse resume latency: 5-30s | Keep interactive warehouses running during hours |
| Materialized views reduce scan | Storage cost for pre-computed data | Tradeoff between compute and storage |

---

## Performance Considerations

BigQuery: partition pruning can reduce scan by 90%+ — always filter on partition columns. Snowflake: result caching means identical queries in 24h window cost zero credits. Redshift: sort keys determine query performance and Spectrum costs. The most expensive query pattern: SELECT * without filters.

---

## Production Considerations

Cost monitoring dashboards may expose query patterns and data volumes — restrict access. Query tagging for cost attribution should not leak sensitive information. Warehouse cost data is business-sensitive — do not expose per-customer costs through analytics APIs. Set up cost monitoring from day one using Snowflake's ACCOUNT_USAGE views or BigQuery's INFORMATION_SCHEMA.

---

## Common Mistakes

- **No Cost Monitoring:** Warehouse costs not tracked — monthly bill increases 5x over 6 months, no one notices until finance escalates. Better: set up cost monitoring from day one.
- **SELECT * Everywhere:** Eloquent models without explicit column selection generate `SELECT *` — on a 200-column table, scans 10x more data than needed. Better: always select only required columns.
- **No Auto-Suspend:** Snowflake warehouse runs 24/7 with auto-suspend disabled — development warehouse used for 2 hours, left running for 6 months, cost $5,000+ for zero-value queries. Better: enable auto-suspend on all warehouses.

---

## Failure Modes

- **Over-Provisioned Warehouses:** X-Large warehouse for all queries including simple dashboard aggregations — costs 16x more than necessary. Mitigation: right-size warehouses per workload.
- **Unlimited Query Scans:** BigQuery queries written without considering bytes scanned — monthly dashboard scans 5TB every load, costs $25 per view. Mitigation: partition by date, always include date filters.
- **No Result Caching:** Identical queries execute against warehouse on every page load — 100 users load same dashboard, warehouse executes same complex query 100 times. Mitigation: cache dashboard results in Redis, use Snowflake's result cache.

---

## Ecosystem Usage

Cost optimization is primarily a data engineering concern, but Laravel application code directly impacts costs. Eloquent queries determine BigQuery bytes scanned. Queue job design determines Snowflake warehouse runtime. Caching strategy determines warehouse query frequency. Laravel's cache system (Redis) is the primary cost optimization tool — one line of `Cache::remember()` can reduce warehouse costs by 99% for frequently accessed queries.

---

## Related Knowledge Units

### Prerequisites
- Snowflake/BigQuery Drivers — Understanding warehouse connection and query patterns
- Snowflake Warehouse Switching — Right-sizing warehouses for cost optimization

### Related Topics
- ClickHouse Codecs — Storage optimization through column compression
- Medallion Architecture — Data lifecycle management for cost-effective storage

### Advanced Follow-up Topics
- Multi-Region ClickHouse — Cross-region data transfer cost considerations
- AI-Assisted OLAP Modeling — Automated query pattern analysis for cost optimization

---

## Research Notes

The most impactful and simplest cost optimization is caching — a 10-second cache TTL on dashboard results reduces warehouse queries by 99% for views. The second most impactful change is adding `->select()` to Eloquent queries to avoid `SELECT *`. Snowflake auto-suspend and BigQuery partition pruning are warehouse-specific optimizations that can reduce costs by 80%+ each.
