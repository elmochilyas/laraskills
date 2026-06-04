# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 05-olap-modeling
**Knowledge Unit:** star-schema
**Difficulty:** Intermediate
**Category:** Dimensional Modeling
**Last Updated:** 2026-06-03

---

# Overview

Star schema dimensional modeling organizes analytical data into fact tables (measurable events) and dimension tables (descriptive attributes) in a denormalized, query-optimized structure. This is the foundational modeling technique for analytics in Laravel applications, enabling fast aggregations, drill-downs, and period-over-period comparisons that are impractical against normalized OLTP schemas.

The `laravel-star-schema` package provides a fluent API for defining facts and dimensions within Eloquent. The star schema is the most widely used data modeling pattern in analytics because it balances query performance with development simplicity.

Engineers must care because the star schema is the bridge between transactional data (OLTP) and analytical queries (OLAP). Without it, analytics queries run directly against normalized databases, requiring complex JOINs that slow down dashboards and complicate reporting.

---

# Core Concepts

## Fact Table

Stores measurements, metrics, or events. Facts are numeric, additive, and immutable. Examples: order amount, page view count, session duration. Fact tables are deep (many rows) and narrow (few columns). Each fact row is a grain-level event.

## Dimension Table

Stores descriptive attributes that provide context for facts. Dimensions are textual, denormalized, and slowly changing. Examples: customer name, product category, date attributes. Dimension tables are shallow (few rows) and wide (many columns).

## Grain

The grain defines what a single fact row represents. "One row per order line item" vs "one row per order." Grain must be declared before schema design. The grain determines what dimensions can be attached.

## Surrogate Key

An artificial primary key for dimension tables, independent of the source system's natural key. Surrogate keys protect against source system key changes and enable SCD tracking.

## Degenerate Dimension

A dimension attribute stored in the fact table because it does not warrant its own dimension table. Example: order number stored directly in the fact row.

## Conformed Dimension

A dimension that can be used across multiple fact tables, ensuring consistent attributes. Example: a Date dimension used by both Sales and Inventory fact tables.

---

# When To Use

- All analytics reporting and dashboarding use cases
- Data marts for BI tools (Metabase, Tableau, Power BI)
- Aggregation and rollup tables for query performance
- Systems where analytical queries must run quickly against large datasets
- Migration from normalized OLTP schemas to analytics-optimized structures

---

# When NOT To Use

- OLTP transactions (use normalized Eloquent models)
- Real-time event streams (use event-sourced models)
- Machine learning feature stores (feature stores have different schema requirements)
- Systems where data volume is very small (< 1M rows) — normalization overhead is fine

---

# Best Practices

## Declare Grain First

The grain must be defined and documented before any table is created. Changing the grain later requires rebuilding both fact and dimension tables.

## Use Surrogate Keys

Always use surrogate keys for dimension primary keys. Natural keys are subject to change. Surrogate keys decouple the warehouse from source system key management.

## Denormalize Dimensions

Dimensions should include all attributes needed for common queries. A customer dimension should include name, segment, region, and tier — not foreign keys to sub-dimensions.

## Keep Facts Additive

Fact measures should be additive across all dimensions. Non-additive measures (ratios, percentages) should be computed at query time or stored as separate additive components.

---

# Architecture Guidelines

## Layer Placement

Star schemas belong in the Gold layer of the medallion architecture. Facts come from Silver layer processed data. Dimensions are built from Silver layer reference data.

## Fact Table Design

Grain + Dimensions (FK) + Measures (additive) + Degenerate Dimensions + Date. Example: `fact_orders (order_sk, customer_sk, product_sk, date_sk, quantity, revenue, order_number)`.

## Dimension Table Design

Surrogate Key + Natural Key + Attributes + Effective Dates (SCD). Example: `dim_customer (customer_sk, customer_id, name, segment, region, effective_date, expiry_date)`.

---

# Performance Considerations

- Fact tables should be indexed on dimension foreign keys and date.
- Partition fact tables by date for TTL and query pruning.
- Use columnar storage (ClickHouse MergeTree) for large fact tables.
- Dimension tables should be small enough to cache in memory.
- Avoid star joins in application code — use pre-joined Gold marts for dashboards.

---

# Security Considerations

- Dimension tables may contain sensitive attributes (PII). Use separate views or column-level security for restricted attributes.
- Fact tables at low grain (individual transactions) may expose sensitive business data. Aggregate to higher grain for public dashboards.
- Row-level security should be applied to the dimension that determines access scope (customer, region).

---

# Common Mistakes

## Mistake: Snowflake Schema (Too Normalized)

Dimensions are normalized into sub-dimensions (customer → address → city → region). Querying requires 5+ JOINs for simple reports.

**Better approach:** Denormalize dimensions. Include all relevant attributes in each dimension table, even if it means some redundancy.

## Mistake: No Surrogate Keys

Using natural keys (customer ID from CRM) as dimension primary keys. CRM changes the customer ID format, and all historical facts now reference a non-existent dimension row.

**Better approach:** Always use surrogate keys. Map natural keys to surrogate keys during the ETL process.

## Mistake: Facts Without Date Dimension

Fact tables without a date foreign key. "Show me sales by month" requires parsing a timestamp column instead of joining dim_date.

**Better approach:** Every fact table must have a date foreign key referencing `dim_date`. Enable time-based filtering and aggregation through the date dimension.

---

# Anti-Patterns

## Wide Fact Tables
Including descriptive attributes in the fact table instead of dimension references. The fact table has 100+ columns, most of which are dimension attributes that rarely change.

**Solution:** Move descriptive attributes to dimension tables. Facts should contain only measures and dimension foreign keys.

## One Massive Dimension
A single "Customer" dimension with 200+ attributes from multiple source systems. The dimension is rebuilt daily and the ETL process takes hours.

**Solution:** Split into multiple dimensions (Customer Demographics, Customer Contact, Customer Preferences) connected by the same surrogate key.

## Fact Table Without Grain Documentation
The grain is not documented. Different team members have different assumptions about what a fact row represents. Analysis produces inconsistent results.

**Solution:** Document the grain in the fact table's schema YAML or documentation. Include examples of what a single row represents.

## Ignoring Conformed Dimensions
The Date dimension is different in the Sales and Inventory marts. The same date has different attributes in each mart. Cross-mart analysis cannot join on date.

**Solution:** Use a single conformed Date dimension across all marts. All date-related queries reference the same dimension.
