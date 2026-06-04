# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 03-etl-elt-pipelines
**Knowledge Unit:** laravel-ingest
**Difficulty:** Foundation
**Category:** Data Import
**Last Updated:** 2026-06-03

---

# Overview

Laravel Ingest is a configuration-driven import framework that handles the "L" in ETL — loading data into Laravel from external sources. Unlike ETL Manifesto (which extracts from Laravel), Laravel Ingest imports into Laravel: CSV/Excel/JSON files, API responses, and database connections.

Its architecture is based on `IngestDefinition` and `IngestConfig` classes that declare the import schema, validation rules, relationship resolution, and failure handling — treating data imports as declarative configurations rather than procedural scripts.

Engineers must care because data import is one of the most error-prone operations in Laravel applications. Files arrive in inconsistent formats, columns have unexpected values, relationships fail to resolve, and partial imports corrupt data. Laravel Ingest provides a structured way to handle these edge cases while maintaining auditability.

---

# Core Concepts

## IngestDefinition

The `IngestDefinition` class declares what data is being imported: the source type (CSV, Excel, JSON, API), the schema (field names, types, constraints), and the target (Eloquent model, database table). It is the blueprint for the import pipeline.

## IngestConfig

The `IngestConfig` class configures how the import executes: chunk size for large files, validation rules per field, relationship resolution rules, error handling strategy (fail-fast vs skip-and-log), and post-import actions.

## Streaming Import

Rather than loading the entire file into memory, streaming import reads records one at a time or in small batches. This is mandatory for files larger than available PHP memory. OpenSpout handles streaming reads for CSV and Excel files.

## Chunked Processing

Chunked processing reads the source in batches, processes each batch through validation and transformation, and inserts records in bulk. This balances memory usage with database write efficiency.

## Validation Pipeline

Each record goes through a validation pipeline before insertion: field-level validation (type, format, required), row-level validation (cross-field constraints), and batch-level validation (uniqueness within batch).

---

# When To Use

- Importing CSV/Excel files from business users
- Batch loading data from external APIs
- Migrating data from legacy systems into Laravel
- Periodic data synchronization with external databases
- Bulk user/entity creation from partner systems
- Data enrichment from external reference datasets

---

# When NOT To Use

- Single record creation from user forms (use Laravel's FormRequest + Eloquent)
- Real-time event ingestion (use queue-based event tracking)
- File uploads that need immediate processing (upload to queue, then ingest)
- Systems with real-time API integration (use direct API calls)
- Very large datasets (> 100M rows) — use dedicated ETL tools

---

# Best Practices

## Validate Before Insert

Run the complete validation pipeline before any database writes. If validation fails, roll back the entire batch. Partial imports are the leading cause of data corruption in import pipelines.

## Use Transactions with Chunks

Wrap each chunk in a database transaction. If a chunk fails, only that chunk is rolled back; previously imported chunks are preserved. This prevents total data loss on large imports.

## Handle Duplicates Declaratively

Define the duplicate resolution strategy in the `IngestConfig`: skip duplicates, update existing records, or fail on duplicates. Do not leave duplicate handling to implicit behavior.

## Log Every Import

Record each import execution with metadata: source file, record count, success count, failure count, duration, and error details. This audit trail is essential for debugging data quality issues.

---

# Architecture Guidelines

## Layer Placement

Laravel Ingest operates in the import layer, between external data sources and the application's domain models. It validates and transforms external data into application-compatible format.

## Pipeline Stages

1. **Source Reading** — Stream/chunk read from file, API, or database
2. **Schema Validation** — Field type and format validation
3. **Relationship Resolution** — Resolve foreign keys, connect related models
4. **Transformation** — Type casting, field mapping, defaults
5. **Storage** — Batch insert with transaction boundaries
6. **Post-Processing** — Webhooks, notifications, cache invalidation

## Error Handling Strategy

Choose between fail-fast (import stops on first error, no partial data) and skip-and-log (bad records are skipped, import continues). Fail-fast for compliance-critical imports; skip-and-log for large bulk imports where partial success is acceptable.

---

# Performance Considerations

- Streaming import memory usage is O(record_size), not O(file_size). Each record is processed and discarded.
- Chunk size should match database write throughput: 100-500 records per chunk for MySQL, 500-2000 for PostgreSQL.
- Relationship resolution adds latency. Cache reference data (lookup tables) in memory during import.
- Validation-heavy imports benefit from parallel validation workers, but database writes must be sequential.

---

# Security Considerations

- Imported data bypasses normal application input paths. Validation rules must be at least as strict as FormRequest validation.
- File uploads must be scanned for malware before processing.
- Imported CSV/Excel files may contain formula injection payloads. Strip leading `=`, `+`, `-`, `@` from string fields.
- API source credentials must be stored securely and scoped to read-only access.

---

# Common Mistakes

## Mistake: Loading Entire File Into Memory

Calling `file_get_contents()` or `Excel::load()` on a 500MB CSV file. PHP runs out of memory, and the import fails with a vague error.

**Better approach:** Use streaming readers (OpenSpout) that process records one at a time.

## Mistake: No Validation Before Insert

Records are inserted into the database and validation failures are discovered later during querying. The imported data corrupts the analytics database.

**Better approach:** Validate all records before any database writes. Use transactions per chunk to ensure atomicity.

## Mistake: Ignoring File Encoding

CSV files from Windows systems use UTF-8 with BOM or ISO-8859-1 encoding. Special characters are garbled in the database.

**Better approach:** Detect and convert file encoding during the source reading stage. Normalize to UTF-8.

---

# Anti-Patterns

## Import-As-User-Submission

Processing imported data through the same code path as user form submissions. Imported data has different trust characteristics and validation requirements than user-submitted data.

**Solution:** Use a dedicated import pipeline with import-specific validation rules, logging, and error handling.

## Zero-Transaction Import

Every record is inserted individually without transactions. When the import fails halfway, the database contains partial data that is inconsistent and unrecoverable.

**Solution:** Wrap batches in database transactions. Use savepoints for very large batches to reduce rollback scope.

## Unattended Imports Without Monitoring

Imports run on cron schedules without success/failure monitoring. An import silently fails for weeks, and the analytics team is working with stale data.

**Solution:** Monitor import execution status. Alert on failures. Track data freshness metrics.

---

# Examples

## IngestDefinition for CSV Import

```php
class CustomerImportDefinition extends IngestDefinition
{
    public function source(): SourceDefinition
    {
        return SourceDefinition::csv()
            ->path(storage_path('imports/customers.csv'))
            ->delimiter(',')
            ->headerRow(1)
            ->encoding('UTF-8');
    }

    public function schema(): SchemaDefinition
    {
        return SchemaDefinition::create()
            ->field('email')->email()->required()->unique()
            ->field('first_name')->string()->required()->max(255)
            ->field('last_name')->string()->required()->max(255)
            ->field('company')->string()->nullable()
            ->field('phone')->string()->nullable()->pattern('/^\+?[1-9]\d{1,14}$/');
    }

    public function target(): TargetDefinition
    {
        return TargetDefinition::model(User::class)
            ->duplicateStrategy(DuplicateStrategy::Update);
    }
}
```

## IngestConfig Configuration

```php
class CustomerImportConfig extends IngestConfig
{
    public function chunkSize(): int
    {
        return 500;
    }

    public function errorStrategy(): ErrorStrategy
    {
        return ErrorStrategy::SkipAndLog();
    }

    public function relationships(): array
    {
        return [
            'company' => RelationshipConfig::belongsTo(Company::class, 'name'),
        ];
    }
}
```

---

# Related Topics

**Prerequisites:**
- Eloquent Model Basics — Target models for imported data

**Closely Related:**
- ETL Manifesto — Complementary export framework (Ingest = import, Manifesto = export)
- CSV/Excel/Parquet Export — Shared file format knowledge
- Medallion Architecture — Ingest feeds the Bronze layer

**Advanced Follow-Up:**
- Data Vault 2.0 — Target schema for ingested data in enterprise data warehouses

**Cross-Domain Connections:**
- API Integration Engineering — API source configuration and authentication
