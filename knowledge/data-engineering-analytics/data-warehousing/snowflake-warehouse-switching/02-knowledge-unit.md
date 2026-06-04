# Snowflake Warehouse Switching

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 04-data-warehousing
- **Knowledge Unit:** snowflake-warehouse-switching
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Snowflake's separation of compute (warehouses) from storage enables independent scaling and cost optimization — a single Laravel application can execute dashboard queries on a small warehouse, ETL workloads on a large warehouse, and admin queries on a separate warehouse, all from the same codebase with connection-level granularity. Warehouse configuration directly determines query cost and performance — running a dashboard query on an XL warehouse costs 16x more than on an X-Small with minimal performance improvement for simple queries.

---

## Core Concepts

- **Warehouse:** A cluster of compute resources in Snowflake — sizes range from X-Small to 6X-Large (and multi-cluster) — each warehouse has its own compute cost per credit
- **Role:** Determines data access permissions — hierarchical, can be switched within a session to access different data or enable different operations
- **Database/Schema:** Snowflake organizes data into databases and schemas — switching enables a single Laravel connection to work with multiple environments or data domains
- **Data Sharing:** Snowflake Data Sharing allows sharing data between Snowflake accounts without copying — the Laravel driver can query shared data as if it were local

---

## Mental Models

- **Warehouses as Different Vehicles:** Using an X-Small warehouse for a dashboard query is like driving a compact car to the grocery store. Using an X-Large warehouse for the same query is like driving a semi-truck — it works but costs much more and doesn't get you there faster for simple trips.
- **Warehouse Switching as Garage Selection:** The application has a garage of warehouses of different sizes. Before each trip (query), you choose which vehicle to take based on the cargo (query complexity). Simple aggregations get the compact car. Complex ETL gets the truck.

---

## Internal Mechanics

Multiple Snowflake connections are configured in `config/database.php` — one per warehouse. Switching between them uses Laravel's `DB::connection('snowflake_small')` method. A `WarehouseRouter` service determines the appropriate warehouse based on query characteristics: estimated row count, complexity, user role, and time budget. Each warehouse has its own auto-suspend setting — interactive warehouses suspend after 1 minute idle, ETL warehouses after 10 minutes. When a query hits a suspended warehouse, Snowflake auto-resumes it (5-30 seconds startup time).

---

## Patterns

- **Warehouse Per Workload Type:** Create at least three warehouses: `analytics_small` (dashboard queries), `analytics_medium` (reports), `analytics_large` (ETL, backfills, complex aggregations)
- **Switch at the Query Level:** Implement a service layer that selects warehouse based on query type — not at the model level — the same model should be queryable via different warehouses depending on use case
- **Auto-Suspend Configuration:** Configure auto-suspend based on expected idle time — 1 minute for interactive warehouses (cost savings), 10 minutes for ETL warehouses (avoid interruption of batch jobs)

---

## Architectural Decisions

Create separate warehouses for each workload type with appropriate sizing. Use X-Small for interactive dashboard queries (sufficient performance, minimum cost). Use Medium for scheduled reports. Use Large for complex ETL and backfills. Configure multiple Snowflake connections and switch with `DB::connection()` rather than per-query warehouse switching. Tag queries with warehouse names for cost tracking.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Cost optimization (right-size per query) | Connection management complexity | Multiple warehouse connections to maintain |
| Performance isolation between workloads | Warehouse resume latency (5-30s) | Keep interactive warehouses running during hours |
| Independent auto-suspend per workload | Switch overhead | Group queries by type, avoid per-query switching |
| Per-tenant warehouse isolation | Multi-cluster configuration complexity | Best for high-concurrency multi-tenant setups |

---

## Performance Considerations

Warehouse startup time: 5-30 seconds if suspended — keep interactive warehouses running during business hours. Smaller warehouses (X-Small, Small) are sufficient for most dashboard queries. Larger warehouses benefit complex ETL and large aggregations. Multi-cluster warehouses automatically scale out for concurrent queries — configure `max_cluster_count` based on expected concurrency.

---

## Production Considerations

Warehouse switching must not bypass access controls — switching to a larger warehouse should not grant access to additional data. Role switching is a security boundary — the Laravel application must manage role state carefully to prevent privilege escalation. Each warehouse connection should use the minimum permissions required for its workload.

---

## Common Mistakes

- **Single Warehouse for Everything:** All queries on the same X-Large warehouse — dashboard queries fast but 16x more expensive than needed. Better: use smaller warehouses for simple queries, reserve large for complex.
- **Warehouse Switching Without Auto-Suspend:** ETL warehouse left running 24/7 — accumulates credits even when idle, monthly costs increase by 5x. Better: configure auto-suspend (5-10 min for ETL, 1 min for interactive).
- **Connection Leak from Switching:** Every query creates new warehouse connection without reusing — connection count grows unbounded. Better: use Laravel's connection pooling, reuse connections, close when switching.

---

## Failure Modes

- **Switching Warehouse Per Query:** Switching on every Eloquent query — each switch adds connection overhead and warehouse resume latency. Mitigation: group queries by type, execute in batches per warehouse.
- **Ignoring Warehouse Resume Time:** Switching to suspended warehouse and expecting sub-second response — warehouse takes 10 seconds to resume, API call times out. Mitigation: pre-warm warehouses, set appropriate timeouts.
- **Shared Warehouse Across Tenants:** All tenants share the same warehouse — one tenant's complex query consumes all resources, degrading performance for others. Mitigation: use per-tenant warehouses or resource monitors.

---

## Ecosystem Usage

The `foundry-co/laravel-snowflake` package supports warehouse switching through the connection configuration. Multiple connections are defined in `config/database.php` with different warehouse names. The application switches between them using `DB::connection('snowflake_small')` or by configuring models with `protected $connection`. A custom `WarehouseRouter` service can encapsulate the switching logic.

---

## Related Knowledge Units

### Prerequisites
- Snowflake/BigQuery Drivers — Eloquent driver for Snowflake connection

### Related Topics
- Warehouse Cost Optimization — Cost management through right-sizing warehouses
- Multi-Tenancy Analytics — Per-tenant warehouse isolation patterns

### Advanced Follow-up Topics
- Multi-Region ClickHouse — Cross-region warehouse distribution (Snowflake multi-region)

---

## Research Notes

Snowflake's warehouse architecture enables cost optimization through workload-specific sizing. The most impactful optimization is right-sizing — X-Small for interactive queries that typically scan filtered data, larger warehouses for complex aggregations that scan more data. Auto-suspend is the second most important configuration — preventing warehouses from running when idle saves significant costs.
