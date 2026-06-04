# ETL Manifesto

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 03-etl-elt-pipelines
- **Knowledge Unit:** etl-manifesto
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

ETL Manifesto is a YAML-driven extract, transform, load framework for Laravel that defines entities, relationships, mappings, and aggregation functions declaratively — mirroring dbt's "code as configuration" philosophy within Laravel's ecosystem. It solves the fundamental tension between OLTP-optimized database schemas and analytics/reporting needs by bridging the gap without requiring a separate ETL tool or custom scripts.

---

## Core Concepts

- **YAML Manifest Structure:** Defines entities (models), relationships (belongs-to, has-many), mappings (source → target field), transformations (aggregate functions, computed columns), and output targets (file format, database)
- **Entity Definition:** Maps to Eloquent models with query constraints (scopes, conditions) and fields to extract — the source definition for the pipeline
- **Relationship Extraction:** Handles eager loading of relationships, resolving nested data from related models to create denormalized datasets
- **Transform Mapping:** Field aliasing, type casting, aggregation functions (sum, count, avg), computed columns, and conditional transformations
- **Output Targets:** Files (CSV, JSON, XLSX) or databases (analytics schema, ClickHouse, Snowflake) with format-specific configuration

---

## Mental Models

- **Manifest as Blueprint:** The YAML manifest is like an architectural blueprint — it describes what to build, not how to build it. The ETL Manifesto engine reads the blueprint and executes the construction. Changes are made to the blueprint, not the construction process.
- **ETL Manifesto as Export Pipeline:** Think of it as a data export pipeline from Laravel's OLTP world to the analytics world — it extracts from Eloquent models (normalized, transactional) and produces denormalized, aggregated outputs for analytics consumption.

---

## Internal Mechanics

The pipeline executes in stages: Manifest Definition (YAML file) → Extraction (Eloquent queries with eager-loaded relationships) → Transformation (field mapping, type casting, aggregation) → Output (file generation or database insert). Large datasets use chunked processing — extract in batches, transform incrementally, write to output in chunks. Eloquent relationships are resolved during extraction using eager loading. Output strategies include streaming writers (OpenSpout for CSV/Excel) and batch database inserts with transaction boundaries.

---

## Patterns

- **Version Control Manifests:** ETL manifests are code — store in version control, review via pull requests, tag releases — a manifest change can silently alter analytics outputs
- **Environment-Specific Manifests:** Define manifest overrides per environment — development manifests output to local files, production to analytics database — use YAML anchors and aliases to reduce duplication
- **Test Pipeline Output:** Write tests that execute the ETL manifest against a test database and verify output row counts, field values, and aggregation results — catches regressions when models change

---

## Architectural Decisions

Use ETL Manifesto for data export pipelines from Laravel to analytics systems, CSV/Excel report generation, and loading aggregated data into ClickHouse or data warehouses. Do not use for real-time event streaming (use Kafka CDC or Reverb) or for complex ETL with multiple external source systems (use dbt). Keep transformations in the manifest to field mapping and simple aggregations — complex business logic belongs in dedicated service classes.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Declarative pipeline definition | YAML can become unreadable for complex logic | Keep to field mapping and simple aggregations |
| Version-controlled ETL logic | Requires CI validation of manifests | Prevent silent data corruption |
| Environment-specific configurations | Manifest management overhead | YAML anchors reduce duplication |
| Tests prevent regression | Requires test database with known data | Catches problems before deployment |

---

## Performance Considerations

Large datasets require chunked processing — extract in batches, transform incrementally, write to output in chunks. Eager loading can cause memory issues for deep relationships — limit to 2-3 levels. File outputs should use streaming writers (OpenSpout). Database outputs should use batch inserts with transaction boundaries. Monitor PHP memory for large extractions — use cursor-based queries for very large tables.

---

## Production Considerations

ETL manifests can extract any data accessible by Eloquent models — ensure manifests only access authorized data. File outputs may contain sensitive data — set appropriate file permissions, never store exports in public directories. Database output targets should use a dedicated analytics user with write-only access. Validate all transformation expressions to prevent injection through computed column definitions.

---

## Common Mistakes

- **Manifests Without Versioning:** Stored on the server and edited directly — a typo in a field name causes silent data loss. Better: store in version control, deploy through CI/CD.
- **Overly Complex Transformations:** Manifest attempts complex business logic — YAML becomes unreadable, untestable, error-prone. Better: keep to field mapping and simple aggregations, use dedicated service classes for complex logic.
- **No Output Validation:** Pipeline runs without verifying output — a missing relationship produces empty columns silently. Better: implement automated output validation with row count assertions and field presence checks.

---

## Failure Modes

- **Manifest-As-A-Database:** Using manifest outputs as a primary data source for the application — manifest output is a read-only analytics artifact. Mitigation: keep outputs in analytics schema, application code should not read from analytics tables.
- **One Giant Manifest:** A single manifest file defining all ETL pipelines — thousands of lines, impossible to review, any change risks unrelated exports. Mitigation: split by domain or export purpose.
- **Memory Exhaustion on Large Exports:** Loading all data into memory before writing output — OOM crash on large datasets. Mitigation: use chunked processing and streaming writers.

---

## Ecosystem Usage

ETL Manifesto is the complementary export framework to Laravel Ingest (import). Where Ingest loads data into Laravel from external sources, ETL Manifesto extracts data from Laravel to external targets. The framework integrates with Eloquent models, queue jobs, and Laravel's storage system. It can output to ClickHouse, Snowflake, or any database connection configured in Laravel.

---

## Related Knowledge Units

### Prerequisites
- Eloquent Relationships — Source data for manifests
- Queue Dispatching — Queue-based pipeline execution for large exports

### Related Topics
- Laravel Ingest — Complementary import framework (ETL Manifesto = export)
- Medallion Architecture — Where manifest outputs land (Bronze/Silver)
- Late-Arriving Dimensions — Handling delayed dimension data in ETL pipelines

### Advanced Follow-up Topics
- dbt Incremental Models — Further transformation of exported data in data warehouse

---

## Research Notes

ETL Manifesto treats ETL pipelines as declarative configurations rather than imperative scripts, following the same philosophy as dbt. This approach enables version control, code review, reuse across environments, and automated validation. The framework is particularly useful for Laravel applications where the database schema is optimized for OLTP but analytics requires denormalized data — bridging the gap without requiring separate ETL infrastructure.
