# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 03-etl-elt-pipelines
**Knowledge Unit:** etl-manifesto
**Difficulty:** Advanced
**Category:** ETL Framework
**Last Updated:** 2026-06-03

---

# Overview

ETL Manifesto is a YAML-driven extract, transform, load framework for Laravel that defines entities, relationships, mappings, and aggregation functions declaratively. It mirrors dbt's "code as configuration" philosophy but operates within Laravel's ecosystem — connecting Eloquent models to output files (CSV, JSON, XLSX) or target databases.

The key engineering insight is treating ETL pipelines as declarative configurations rather than imperative scripts. Instead of writing PHP code to extract data, transform it, and load it, developers write a YAML manifest that describes the data flow. This enables version control, code review, reuse across environments, and automated validation of pipeline definitions.

Engineers must care because ETL Manifesto solves a fundamental tension in Laravel applications: the database schema is optimized for OLTP (normalized, transactional), but analytics and reporting require denormalized, aggregated data. The manifest bridges this gap without requiring a separate ETL tool or custom scripts.

---

# Core Concepts

## YAML Manifest Structure

The manifest defines entities (models), relationships (belongs-to, has-many, etc.), mappings (source field → target field), transformations (aggregate functions, computed columns), and output targets (file format, database, streaming). The manifest is a single source of truth for the ETL pipeline.

## Entity Definition

Entities map to Eloquent models. The manifest specifies the model class, query constraints (scopes, conditions), and the fields to extract. This is the source definition for the ETL pipeline.

## Relationship Extraction

The manifest handles eager loading of relationships, resolving nested data from related models. This enables extraction of denormalized datasets from normalized Eloquent models.

## Transform Mapping

Transformations include field aliasing, type casting, aggregation functions (sum, count, avg), computed columns (expressions based on multiple fields), and conditional transformations (if/then/else based on field values).

## Output Targets

Manifest outputs can target files (CSV for spreadsheet tools, JSON for APIs, XLSX for Excel reports) or databases (target tables in the analytics schema, ClickHouse, Snowflake). Each target has format-specific configuration.

---

# When To Use

- Building data export pipelines from Laravel to analytics systems
- Generating CSV/Excel reports for business users
- Creating denormalized views of Eloquent data for reporting
- Loading aggregated data into ClickHouse or data warehouses
- Auditing and compliance data extraction
- Migrating data between environments with transformations

---

# When NOT To Use

- Real-time event streaming (use Kafka CDC or Reverb)
- Simple eager loading in controllers (use Eloquent relationships directly)
- Complex ETL with multiple external source systems (use dbt or dedicated ETL)
- One-off data exports (use Laravel's built-in collection methods)
- Systems where the ETL logic requires dynamic runtime decisions

---

# Best Practices

## Version Control Manifests

ETL manifests are code. Store them in version control, review changes via pull requests, and tag releases. A manifest change can silently alter analytics outputs.

## Validate Manifests Automatically

Implement manifest validation in CI: verify entity classes exist, relationship methods are defined, field names are correct, and output targets are reachable. Catch errors before deployment.

## Use Environment-Specific Manifests

Define manifest overrides per environment. Development manifests might output to local files; production manifests output to the analytics database. Use YAML anchors and aliases to reduce duplication.

## Test Pipeline Output

Write tests that execute the ETL manifest against a test database and verify output row counts, field values, and aggregation results. This catches regression when models change.

---

# Architecture Guidelines

## Layer Placement

ETL Manifesto operates in the processing layer, consuming data from Eloquent models (domain layer) and producing output for analytics (presentation/export layer). It bridges the domain and analytics layers.

## Pipeline Stages

1. **Manifest Definition** — YAML file defining the pipeline
2. **Extraction** — Eloquent queries with eager-loaded relationships
3. **Transformation** — Field mapping, type casting, aggregation
4. **Output** — File generation or database insert

## Integration with Medallion Architecture

ETL Manifesto extracts from Laravel's OLTP database and can output to any layer of the medallion architecture. For full analytics pipelines, the manifest typically outputs to Bronze or Silver layer, with further transformations happening in dbt.

---

# Performance Considerations

- Large datasets require chunked processing: extract in batches, transform incrementally, write to output in chunks.
- Eager loading in manifests can cause memory issues if relationships are deep. Limit relationship depth to 2-3 levels.
- File outputs for large datasets should use streaming writers (OpenSpout for CSV/Excel).
- Database output targets should use batch inserts with transaction boundaries.
- Monitor PHP memory for large extractions; use cursor-based queries for very large tables.

---

# Security Considerations

- ETL manifests can extract any data accessible by the Eloquent models. Ensure manifests only access data the operator is authorized to export.
- File outputs may contain sensitive data. Set appropriate file permissions and never store exports in public directories.
- Database output targets should use a dedicated analytics user with write-only access to target tables.
- Validate all transformation expressions to prevent injection through computed column definitions.

---

# Common Mistakes

## Mistake: Manifests Without Versioning

The ETL manifest is stored on the server and edited directly. A typo in a field name causes silent data loss for weeks before anyone notices.

**Better approach:** Store manifests in version control. Deploy manifest changes through the same CI/CD pipeline as application code.

## Mistake: Overly Complex Transformations

The manifest attempts to perform complex business logic transformations. The YAML becomes unreadable, untestable, and error-prone.

**Better approach:** Keep transformations in the manifest to field mapping and simple aggregations. Complex business logic belongs in dedicated service classes.

## Mistake: No Output Validation

The ETL pipeline runs without verifying output. A missing relationship silently produces empty columns in the export.

**Better approach:** Implement automated output validation: row count assertions, field presence checks, and data type verification.

---

# Anti-Patterns

## Manifest-As-A-Database

Using ETL manifest outputs as a primary data source for the application. The manifest output is a read-only analytics artifact, not a writable data store.

**Solution:** Keep manifest outputs in the analytics schema. Application code should not read from analytics tables.

## One Giant Manifest

A single manifest file defining all ETL pipelines for the entire application. The file is thousands of lines long, impossible to review, and any change risks breaking unrelated exports.

**Solution:** Split manifests by domain or export purpose. Each manifest should represent a single, well-defined data pipeline.

---

# Examples

## ETL Manifest YAML

```yaml
entities:
  orders:
    model: App\Models\Order
    query:
      with: ['customer', 'items.product', 'payments']
      where:
        - created_at: '>= 2024-01-01'
    fields:
      - order_id: { source: id }
      - customer_name: { source: customer.name }
      - customer_email: { source: customer.email }
      - order_total: { source: total }
      - item_count: { aggregation: count, on: items.id }
      - payment_method: { source: payments.method }
    transformations:
      - order_date: { expression: "DATE(created_at)" }
      - total_formatted: { expression: "CONCAT('$', FORMAT(total, 2))" }

outputs:
  csv_export:
    type: csv
    path: storage/exports/orders.csv
    chunk_size: 1000
  database:
    type: database
    connection: analytics
    table: fact_orders
    strategy: insert_overwrite
```

---

# Related Topics

**Prerequisites:**
- Eloquent Relationships — Source data for manifests
- Queue Dispatching — Queue-based pipeline execution for large exports

**Closely Related:**
- Laravel Ingest — Complementary import framework (ETL Manifesto = extract/export)
- Medallion Architecture — Where manifest outputs land (Bronze/Silver)
- Late-Arriving Dimensions — Handling delayed dimension data in ETL pipelines

**Advanced Follow-Up:**
- dbt Incremental Models — Further transformation of exported data in data warehouse

**Cross-Domain Connections:**
- Data Storage Systems — Database connection management for output targets
