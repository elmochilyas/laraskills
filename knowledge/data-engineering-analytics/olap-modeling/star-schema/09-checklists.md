# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 05-olap-modeling
**Knowledge Unit:** star-schema
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Fact table (measurable events) vs dimension table (descriptive attributes) distinction understood
- [ ] Grain of each fact table defined and documented (one row per event/transaction/snapshot)
- [ ] Surrogate key strategy for dimension tables defined (auto-increment or hash-based)
- [ ] Conformed dimensions shared across fact tables for consistent drill-across analysis
- [ ] Degenerate dimensions handled (fact-only attributes without dimension table)
- [ ] laravel-star-schema package fluency for fact/dimension definition evaluated

---

# Architecture Checklist

- [ ] Fact table: measures (numeric, additive), foreign keys to dimensions, date/timestamp
- [ ] Dimension table: surrogate key, natural key, descriptive attributes, date ranges
- [ ] Grain declaration: one row per {event_type, timestamp, dimension_combo} — explicit and documented
- [ ] Surrogate key from auto-increment or hash of natural key — never reuse natural key as PK
- [ ] Conformed dimensions shared across facts with same surrogate key and attributes
- [ ] Degenerate dimensions stored in fact table (e.g., order_number, invoice_id) without separate dimension

---

# Implementation Checklist

- [ ] CREATE TABLE fact_sales (date_id, product_id, customer_id, amount, quantity) ENGINE = MergeTree
- [ ] CREATE TABLE dim_product (id, sku, name, category, price) ENGINE = ReplacingMergeTree
- [ ] CREATE TABLE dim_customer (id, customer_key, name, segment, region) ENGINE = ReplacingMergeTree
- [ ] Fact-Dimension JOIN: SELECT * FROM fact JOIN dim ON fact.dim_id = dim.id
- [ ] laravel-star-schema Fact class defines measures, Dimension class defines attributes
- [ ] Grain documented in fact table comment (e.g., "one row per product sold per transaction")

---

# Performance Checklist

- [ ] Fact table ORDER BY (event_date, dimension_id) — date-first for time-range queries
- [ ] Dimension table surrogate key indexed for high-speed JOIN
- [ ] Conformed dimensions prevent duplicate dimension tables across facts
- [ ] Degenerate dimensions avoid unnecessary JOINs for fact-only attributes
- [ ] ClickHouse MergeTree (K012) columnar storage optimized for star-schema queries
- [ ] AggregatingMergeTree (K024) for pre-aggregated fact rollups

---

# Security Checklist

- [ ] Dimension tables with PII restricted to authorized roles
- [ ] Fact table does not contain directly identifiable information (use dimension keys)
- [ ] Conformed dimension consistent access control across facts
- [ ] Row-level security on dimension tables for multi-tenancy
- [ ] Fact table access pattern audited — query history reviewed for data leakage

---

# Reliability Checklist

- [ ] Referential integrity between fact and dimension checked via dbt test (relationships)
- [ ] Surrogate key generation idempotent — same natural key produces same surrogate key (hash-based)
- [ ] Dimension table upsert handles late-arriving dimension keys (K033)
- [ ] Fact table rejects rows with missing dimension keys (unless placeholder row exists)
- [ ] Grain constraint prevents duplicate fact rows (unique constraint on grain columns)

---

# Testing Checklist

- [ ] Test fact row count matches expected grain — no duplicates
- [ ] Test dimension surrogate key versioning — same natural key mapped correctly
- [ ] Test fact-Dimension JOIN returns correct attributes for each fact key
- [ ] Test conformed dimension used across facts returns same attribute values
- [ ] Test degenerate dimension query without JOIN returns correct value
- [ ] Test star schema query against normalized OLTP equivalent for correctness

---

# Maintainability Checklist

- [ ] Star schema model documented with fact/dimension relationship diagram
- [ ] Fact grain documented in table comment — reviewed when schema changes
- [ ] Conformed dimension list maintained in data catalog
- [ ] Surrogate key generation strategy documented (hash algorithm or sequence)
- [ ] laravel-star-schema config files version-controlled

---

# Anti-Pattern Prevention Checklist

- [ ] Do not use star schema for OLTP writes — star schema is for read/query only
- [ ] Do not store dimension attributes in fact table — normalizes to dimension table
- [ ] Do not use natural keys as fact foreign keys — always use surrogate keys
- [ ] Do not create separate dimension tables for each fact when dimension is conformed
- [ ] Do not skip grain definition — ambiguous grain leads to duplicate or missing fact rows

---

# Production Readiness Checklist

- [ ] Prometheus metrics for fact table growth rate, dimension table row count
- [ ] Logged warning when fact-to-dimension ratio exceeds expected range
- [ ] Alert if referential integrity test detects orphaned fact rows
- [ ] Grain constraint violation alert (duplicate fact rows detected)
- [ ] Deploy checklist includes star schema grain review for new facts
- [ ] Staging star schema queries validated against production data patterns

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: fact/dimension separation, grain definition, surrogate keys, conformed dims
- [ ] Security requirements satisfied: PII in dimension only, row-level security, query auditing
- [ ] Performance requirements satisfied: ORDER BY for query pattern, indexed keys, MergeTree optimization
- [ ] Testing requirements satisfied: row count matches grain, JOIN correctness, conformed dim consistency
- [ ] Anti-pattern checks passed: no OLTP writes, no dimension attributes in fact, surrogate keys always used
- [ ] Production readiness verified: growth metrics, referential integrity alerts, grain enforcement, staging

---

# Related References

- K030 (SCD Dimensions): Specialized handling for dimension attribute changes over time
- K024 (AggregatingMergeTree): ClickHouse-specific pre-aggregation for star schema facts
- K012 (ClickHouse MergeTree): Columnar storage engine for fact tables at scale
- K014 (Medallion Architecture): Bronze-to-Silver-to-Gold pipeline that produces star schemas
