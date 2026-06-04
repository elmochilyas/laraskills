# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 03-etl-elt-pipelines
**Knowledge Unit:** medallion-architecture
**Difficulty:** Advanced
**Category:** Data Architecture
**Last Updated:** 2026-06-03

---

# Overview

The Medallion Architecture — also called the "multi-hop" or "Bronze/Silver/Gold" architecture — is a data design pattern that progressively refines raw data through three layers of increasing quality and structure. Originating from Databricks and adopted by dbt as the standard ELT pattern, it maps naturally onto the Laravel analytics pipeline: raw events land in Bronze (append-only, immutable), are cleaned and deduplicated into Silver (staged, validated), and aggregated into Gold (marts, pre-computed for dashboards).

The architecture's key benefit is decoupling data ingestion from consumption. Schema changes at any layer only affect downstream layers, not upstream. This means the Bronze schema can change without breaking Gold dashboards, and Gold can be restructured without re-ingesting raw data.

Engineers must care because the Medallion Architecture is the foundation of modern data engineering. Without it, analytics pipelines are tightly coupled, schema changes break dashboards, and data quality issues propagate silently through the entire system.

---

# Core Concepts

## Bronze Layer (Raw)

The Bronze layer is the landing zone for raw data. Data is stored in its original format with minimal transformation (type coercion, schema enforcement). The layer is append-only and immutable — records are never updated or deleted. This provides an immutable source of truth for reprocessing and audit.

**Characteristics:** Append-only, immutable, original schema, full fidelity, no deduplication.

## Silver Layer (Cleaned)

The Silver layer is where raw data is cleaned, deduplicated, validated, and typed. Records are parsed, standardized, and enriched. This is the layer where data quality issues are resolved. Silver tables represent the "cleaned version of the truth."

**Characteristics:** Deduplicated, validated, typed fields, enriched, queryable.

## Gold Layer (Aggregated)

The Gold layer contains aggregated, denormalized, business-specific data marts optimized for consumption by dashboards, reports, and machine learning. Facts and dimensions for star schemas live here. Gold tables are designed for fast querying, not for data exploration.

**Characteristics:** Aggregated, denormalized, business-specific, query-optimized, refreshable.

## Data Promotion

The process of moving data from one layer to the next. Promotion is always forward: Bronze → Silver → Gold. Never backward. Promotion rules define the transformation logic at each hop.

---

# When To Use

- Analytics pipelines with multiple data sources
- Systems requiring data quality validation before consumption
- Dashboards and reports that need pre-computed aggregations
- Data pipelines where schema evolution is expected
- Multi-team environments where different teams own different layers
- Regulatory environments requiring an immutable data audit trail

---

# When NOT To Use

- Simple analytics with a single data source and no transformation
- Real-time dashboards requiring sub-second latency (medallion adds latency per hop)
- Small data volumes where raw data is directly queryable
- Systems where data is consumed exactly as produced (pass-through analytics)
- Prototype analytics where infrastructure overhead is not justified

---

# Best Practices

## Immutable Bronze Layer

Never update or delete records in Bronze. If a source sends corrected data, append it as a new record with a correction flag. Immutability enables reprocessing, audit, and time travel.

## Data Quality Gates Between Layers

Implement automated quality gates between Bronze and Silver: null rate checks, schema validation, referential integrity, and uniqueness constraints. Data that fails quality gates should be quarantined, not silently dropped.

## Gold Layer Should Be Denormalized

Gold marts are denormalized for query performance. Analysts and dashboards should not need to JOIN tables. Each Gold mart represents a single business concept with all relevant dimensions included.

## Layer Ownership

Different teams can own different layers. The ingestion team owns Bronze. The data engineering team owns Silver. The analytics engineering team owns Gold. This enables parallel work without coordination bottlenecks.

---

# Architecture Guidelines

## Layer Placement

Bronze lives in the raw data storage (ClickHouse, S3, database). Silver and Gold live in the queryable data warehouse. The application never queries Bronze directly.

## Pipeline Architecture

Source → Extract/Load → Bronze → dbt/ETL → Silver → dbt/ETL → Gold → Dashboard

Each hop can use different tools: ETL Manifesto or Laravel Ingest for Bronze, dbt for Silver and Gold transformations.

## Schema Evolution

When a source schema changes:
1. Bronze accommodates the new schema alongside the old (schema-on-read)
2. Silver normalizes the new schema (backfill with dbt)
3. Gold marts remain unchanged until there's a business reason to update them

---

# Performance Considerations

- Bronze layer storage cost is the highest because data is stored with full fidelity. Implement TTL and archival policies.
- Silver layer query performance depends on partitioning and indexing strategy. Use the same partition key as the most common WHERE clause.
- Gold layer should use pre-aggregation tables (AggregatingMergeTree in ClickHouse) for dashboard queries.
- Each medallion hop adds latency. End-to-end from event creation to Gold availability may be minutes to hours.
- Materialized views or dbt incremental models reduce Gold layer refresh time.

---

# Security Considerations

- Bronze layer may contain sensitive raw data (PII, credentials). Apply column-level encryption or masking before promotion to Silver.
- Silver layer is where PII should be anonymized or removed.
- Gold layer should contain only aggregated data that cannot be reverse-engineered to individual records.
- Access control should be per-layer: Bronze (engineers only), Silver (analysts), Gold (dashboard users).

---

# Common Mistakes

## Mistake: Skipping Silver Layer

Data flows directly from Bronze to Gold. All validation and deduplication happens in the Gold layer, which is optimized for query speed, not data quality. Data quality issues are discovered by dashboard users.

**Better approach:** Always maintain a Silver layer for data quality. Gold should only transform pre-cleaned data.

## Mistake: Updating Bronze Records

A source sends corrected data, and the team runs an UPDATE on the Bronze table. The original raw data is lost. There is no way to audit what the original value was.

**Better approach:** Append corrections as new records. Use effective-dating or correction flags to indicate the latest version.

## Mistake: Gold Layer With Joins

Gold marts require JOINs between multiple Gold tables to answer business questions. Analysts complain about slow dashboards and complex queries.

**Better approach:** Denormalize Gold marts to include all dimensions needed for common queries. Each mart should be independently queryable.

---

# Anti-Patterns

## Over-Engineering the Bronze Layer

Applying schema validation, deduplication, and quality checks at the Bronze layer. This defeats the purpose of Bronze as a fast, raw landing zone.

**Solution:** Bronze is write-optimized. Accept data as-is. Move validation to the Bronze → Silver transition.

## Gold Layer as a Cache

Treating Gold tables as simple caches of Silver data that are rebuilt from scratch on every refresh. Without incremental processing, Gold refresh becomes a bottleneck as data grows.

**Solution:** Use incremental models (dbt incremental, materialized views) for Gold layer refresh. Only process new or changed data.

## No Data Lineage

Data moves through the layers without tracking lineage. When a Gold metric is incorrect, there is no way to trace back to the Bronze source record to find the root cause.

**Solution:** Implement data lineage tracking. Add source record IDs, batch IDs, and transformation metadata to each layer.

---

# Examples

## Bronze Table (Raw Events)

```sql
CREATE TABLE bronze.page_views (
    raw_json String,
    ingested_at DateTime DEFAULT now(),
    source_file String,
    batch_id UInt64
) ENGINE = MergeTree
ORDER BY ingested_at;
```

## Silver Table (Cleaned Events)

```sql
CREATE TABLE silver.page_views (
    event_id UUID,
    url String,
    user_id UInt64,
    viewed_at DateTime,
    country String,
    browser String,
    batch_id UInt64
) ENGINE = MergeTree
ORDER BY (viewed_at, event_id);
```

## Gold Table (Aggregated)

```sql
CREATE TABLE gold.daily_page_views (
    date Date,
    url String,
    country String,
    view_count UInt64,
    unique_visitors UInt64
) ENGINE = SummingMergeTree
ORDER BY (date, url, country);
```

---

# Related Topics

**Prerequisites:**
- ETL Manifesto — Extracts from sources → feeds Bronze layer
- Laravel Ingest — Import framework for loading into Bronze

**Closely Related:**
- dbt Incremental Models — Implementation of Silver/Gold transformations
- Star Schema — Gold layer mart design pattern
- Late-Arriving Dimensions — Handling delayed data in Silver layer

**Advanced Follow-Up:**
- Data Vault 2.0 — Alternative to Medallion with Hubs/Links/Satellites
- dbt Project Structure — Organizing transformation code per layer

**Cross-Domain Connections:**
- Data Warehousing — Storage layer for each medallion tier
