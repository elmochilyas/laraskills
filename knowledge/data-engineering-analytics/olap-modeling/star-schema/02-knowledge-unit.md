# Star Schema

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 05-olap-modeling
- **Knowledge Unit:** star-schema
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Star schema dimensional modeling organizes analytical data into fact tables (measurable events) and dimension tables (descriptive attributes) in a denormalized, query-optimized structure — the foundational modeling technique for analytics in Laravel applications. It enables fast aggregations, drill-downs, and period-over-period comparisons that are impractical against normalized OLTP schemas, serving as the bridge between transactional data and analytical queries.

---

## Core Concepts

- **Fact Table:** Stores measurements, metrics, or events — numeric, additive, and immutable — examples: order amount, page view count, session duration — deep (many rows) and narrow (few columns)
- **Dimension Table:** Stores descriptive attributes providing context for facts — textual, denormalized, slowly changing — examples: customer name, product category, date attributes — shallow (few rows) and wide (many columns)
- **Grain:** Defines what a single fact row represents — "one row per order line item" vs "one row per order" — must be declared before schema design — determines what dimensions can be attached
- **Surrogate Key:** Artificial primary key for dimension tables, independent of source system's natural key — protects against source system key changes and enables SCD tracking
- **Degenerate Dimension:** Dimension attribute stored in the fact table because it doesn't warrant its own dimension table — example: order number stored directly in fact row
- **Conformed Dimension:** Dimension usable across multiple fact tables ensuring consistent attributes — example: Date dimension used by both Sales and Inventory fact tables

---

## Mental Models

- **Star Schema as Solar System:** The fact table is the sun at the center — massive, bright, attracting everything. Dimension tables are planets orbiting around it — each planet provides context (time, customer, product) for the gravitational center (facts).
- **Star Schema as Restaurant Menu:** Facts are the prices (numeric, measurable). Dimensions are the descriptors (appetizer/entree/dessert, cuisine type, spice level). You don't look up a price and then ask "what category was this?" — the category is attached to the menu item.

---

## Internal Mechanics

Fact tables contain foreign keys to dimension tables and numeric measure columns. A query joins the fact table to dimension tables using surrogate keys, then groups and aggregates the measures by dimension attributes. The denormalized structure means fewer JOINs than normalized schemas — typically 3-5 JOINs instead of 10+. The grain is enforced at insert time — every fact row must have exactly one value for each dimension foreign key. Partitioning by date enables efficient TTL and query pruning. Indexes on dimension foreign keys and date column accelerate common query patterns.

---

## Patterns

- **Declare Grain First:** The grain must be defined and documented before any table is created — changing the grain later requires rebuilding both fact and dimension tables
- **Use Surrogate Keys:** Always use surrogate keys for dimension primary keys — natural keys are subject to change — surrogate keys decouple the warehouse from source system key management
- **Keep Facts Additive:** Fact measures should be additive across all dimensions — non-additive measures (ratios, percentages) should be computed at query time or stored as separate additive components

---

## Architectural Decisions

Star schemas belong in the Gold layer of the medallion architecture. Facts come from Silver layer processed data. Dimensions are built from Silver layer reference data. Every fact table must have a date foreign key — enable time-based filtering and aggregation through the date dimension. Denormalize dimensions to include all relevant attributes — avoid snowflake schemas that require 5+ JOINs.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Fast query performance (fewer JOINs) | Data redundancy in dimensions | Storage cost vs query speed tradeoff |
| Intuitive for business users | More complex ETL process | Must manage SCD and surrogate keys |
| Flexible drill-down and aggregation | Grain must be fixed at design time | Changing grain requires schema rebuild |
| Conformed dimensions enable cross-mart analysis | Requires coordination across teams | Date dimension must be shared |

---

## Performance Considerations

Fact tables should be indexed on dimension foreign keys and date. Partition fact tables by date for TTL and query pruning. Use columnar storage (ClickHouse MergeTree) for large fact tables. Dimension tables should be small enough to cache in memory. Avoid star joins in application code — use pre-joined Gold marts for dashboards.

---

## Production Considerations

Dimension tables may contain sensitive attributes (PII) — use separate views or column-level security for restricted attributes. Fact tables at low grain may expose sensitive business data — aggregate to higher grain for public dashboards. Row-level security should be applied to the dimension that determines access scope (customer, region).

---

## Common Mistakes

- **Snowflake Schema (Too Normalized):** Dimensions normalized into sub-dimensions (customer → address → city → region) — querying requires 5+ JOINs for simple reports. Better: denormalize dimensions with all relevant attributes.
- **No Surrogate Keys:** Using natural keys as dimension primary keys — CRM changes customer ID format, all historical facts reference non-existent dimension row. Better: always use surrogate keys.
- **Facts Without Date Dimension:** Fact tables without date foreign key — "Show me sales by month" requires parsing timestamp instead of joining dim_date. Better: every fact table must have a date foreign key.

---

## Failure Modes

- **Wide Fact Tables:** Including descriptive attributes in fact table instead of dimension references — 100+ columns, most of which are dimension attributes. Mitigation: move descriptive attributes to dimension tables, facts contain only measures and foreign keys.
- **One Massive Dimension:** Single "Customer" dimension with 200+ attributes from multiple source systems — rebuild takes hours. Mitigation: split into multiple dimensions (Demographics, Contact, Preferences) connected by same surrogate key.
- **Ignoring Conformed Dimensions:** Date dimension different in Sales and Inventory marts — same date has different attributes, cross-mart analysis cannot join on date. Mitigation: use single conformed Date dimension across all marts.

---

## Ecosystem Usage

The `laravel-star-schema` package provides a fluent API for defining facts and dimensions within Eloquent. Star schemas live in the analytics schema or ClickHouse, separate from the operational database. Dashboard widget providers query star schema Gold marts for fast data retrieval. ETL Manifesto can define transformations that produce star schema outputs.

---

## Related Knowledge Units

### Prerequisites
- Medallion Architecture — Star schemas are Gold layer artifacts
- OLAP vs OLTP Fundamentals — Why star schema is needed

### Related Topics
- SCD Dimensions — Dimension management within star schema
- Late-Arriving Dimensions — Handling delayed dimension data
- Dashboard Widget Provider — Querying star schema for dashboards

### Advanced Follow-up Topics
- Data Vault 2.0 — Alternative enterprise data modeling approach
- AI-Assisted OLAP Modeling — Optimizing star schema design with AI

---

## Research Notes

Star schema is the most widely used data modeling pattern in analytics because it balances query performance with development simplicity. The `laravel-star-schema` package brings this pattern to Laravel with a fluent API. The key design rule that every fact table must have a date dimension foreign key is universally applicable. The grain declaration is the single most important design decision — it must be documented and enforced at insert time.
