# Medallion Architecture

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 03-etl-elt-pipelines
- **Knowledge Unit:** medallion-architecture
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

The Medallion Architecture (Bronze/Silver/Gold) progressively refines raw data through three layers of increasing quality and structure — raw events land in Bronze (append-only, immutable), are cleaned into Silver (deduplicated, validated), and aggregated into Gold (marts, pre-computed for dashboards). Its key benefit is decoupling ingestion from consumption — schema changes at any layer only affect downstream, not upstream, enabling schema evolution without breaking dashboards.

---

## Core Concepts

- **Bronze Layer (Raw):** Landing zone for raw data — stored in original format with minimal transformation, append-only and immutable, provides immutable source of truth for reprocessing and audit
- **Silver Layer (Cleaned):** Raw data cleaned, deduplicated, validated, typed, and enriched — represents the "cleaned version of the truth" with resolved data quality issues
- **Gold Layer (Aggregated):** Aggregated, denormalized, business-specific data marts optimized for consumption by dashboards and reports — facts and dimensions for star schemas
- **Data Promotion:** Process of moving data from one layer to the next — always forward (Bronze → Silver → Gold), never backward — promotion rules define transformation logic at each hop

---

## Mental Models

- **Medallion as Water Filtration:** Bronze is raw river water (full of sediment). Silver is filtered water (clean but not yet bottled). Gold is bottled water (ready for consumption). Each filtration stage removes impurities and adds quality. You never put bottled water back in the river.
- **Layers as Kitchen Prep Stations:** Bronze is the receiving dock — take delivery of raw ingredients. Silver is the prep kitchen — wash, peel, chop, measure. Gold is the plating station — arrange beautifully for service. Each station has its own tools, staff, and quality standards.

---

## Internal Mechanics

Data flows through the layers via ETL/ELT processes. Bronze receives data from source systems (ETL Manifesto, Laravel Ingest, Kafka CDC) with minimal transformation — just enough to parse the format. dbt or custom ETL reads from Bronze, applies validation and deduplication, and writes to Silver tables. Another transformation pass reads from Silver, applies business logic and aggregation, and writes to Gold marts. Each layer has its own storage (Bronze: raw storage like S3; Silver/Gold: queryable data warehouse). Quality gates between layers enforce null rate checks, schema validation, referential integrity, and uniqueness.

---

## Patterns

- **Immutable Bronze Layer:** Never update or delete records in Bronze — append corrections as new records with correction flags — enables reprocessing, audit, and time travel
- **Data Quality Gates Between Layers:** Automated quality gates between Bronze and Silver — null rate checks, schema validation, referential integrity, uniqueness constraints — failing data quarantined, not silently dropped
- **Layer Ownership:** Different teams can own different layers — ingestion team owns Bronze, data engineering owns Silver, analytics engineering owns Gold — enables parallel work

---

## Architectural Decisions

Bronze lives in raw data storage (ClickHouse, S3, database) — the application never queries Bronze directly. Silver and Gold live in the queryable data warehouse. Implement incremental processing for Silver and Gold layers — only process new or changed data. Use the medallion architecture for any analytics pipeline with multiple data sources, data quality validation needs, or schema evolution requirements.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Decoupled ingestion and consumption | Multiple transformation hops | End-to-end latency: minutes to hours |
| Immutable audit trail in Bronze | Highest storage cost (full fidelity) | Implement TTL and archival policies |
| Independent layer ownership | Coordination across teams needed | Quality gates between layers |
| Schema evolution without breakage | More complex pipeline infrastructure | Silver normalizes, Gold unchanged until business need |

---

## Performance Considerations

Bronze storage cost is highest — implement TTL and archival policies. Silver query performance depends on partitioning and indexing — use same partition key as most common WHERE clause. Gold should use pre-aggregation tables (AggregatingMergeTree) for dashboard queries. Each medallion hop adds latency — end-to-end from event creation to Gold availability may be minutes to hours. Materialized views or dbt incremental models reduce Gold refresh time.

---

## Production Considerations

Bronze may contain sensitive raw data (PII, credentials) — apply column-level encryption or masking before promotion to Silver. Silver is where PII should be anonymized or removed. Gold should contain only aggregated data that cannot be reverse-engineered to individual records. Access control should be per-layer: Bronze (engineers only), Silver (analysts), Gold (dashboard users).

---

## Common Mistakes

- **Skipping Silver Layer:** Data flows directly from Bronze to Gold — all validation and deduplication in Gold layer optimized for speed not quality — data quality issues discovered by dashboard users. Better: always maintain a Silver layer.
- **Updating Bronze Records:** Source sends corrected data and team runs UPDATE on Bronze — original raw data lost, no way to audit original value. Better: append corrections as new records with effective-dating or correction flags.
- **Gold Layer With Joins:** Gold marts require JOINs between multiple tables to answer business questions — analysts complain about slow dashboards. Better: denormalize Gold marts to include all needed dimensions.

---

## Failure Modes

- **Over-Engineering the Bronze Layer:** Applying schema validation, deduplication, and quality checks at Bronze — defeats purpose of fast, raw landing zone. Mitigation: Bronze is write-optimized, accept data as-is, move validation to Bronze → Silver transition.
- **Gold Layer as a Cache:** Gold tables rebuilt from scratch on every refresh — without incremental processing, Gold refresh becomes bottleneck. Mitigation: use incremental models for Gold refresh, only process new or changed data.
- **No Data Lineage:** Data moves through layers without tracking lineage — when Gold metric is incorrect, no way to trace back to Bronze source. Mitigation: add source record IDs, batch IDs, and transformation metadata to each layer.

---

## Ecosystem Usage

The medallion architecture is the foundation of modern data engineering and maps naturally to Laravel analytics pipelines. ETL Manifesto and Laravel Ingest feed the Bronze layer. dbt (running alongside Laravel) transforms Bronze → Silver → Gold. The architecture is tool-agnostic — Bronze could be ClickHouse MergeTree, Silver could be a PostgreSQL analytics schema, Gold could be AggregatingMergeTree tables.

---

## Related Knowledge Units

### Prerequisites
- ETL Manifesto — Extracts from sources → feeds Bronze layer
- Laravel Ingest — Import framework for loading into Bronze

### Related Topics
- dbt Incremental Models — Implementation of Silver/Gold transformations
- Star Schema — Gold layer mart design pattern
- Late-Arriving Dimensions — Handling delayed data in Silver layer

### Advanced Follow-up Topics
- Data Vault 2.0 — Alternative to Medallion with Hubs/Links/Satellites
- dbt Project Structure — Organizing transformation code per layer

---

## Research Notes

The Medallion Architecture originated from Databricks and was adopted by dbt as the standard ELT pattern. Its key insight is that decoupling ingestion from consumption enables schema evolution without breaking downstream consumers. The three-layer pattern has become the default architecture for modern data platforms, replacing older monolithic data warehouse designs.
