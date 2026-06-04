# Laravel Ingest

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 03-etl-elt-pipelines
- **Knowledge Unit:** laravel-ingest
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary

Laravel Ingest is a configuration-driven import framework that handles the "L" in ETL — loading data into Laravel from external sources (CSV/Excel/JSON files, API responses, database connections) using declarative `IngestDefinition` and `IngestConfig` classes. It provides structured handling for the most error-prone operation in Laravel applications: data import, where inconsistent formats, unexpected values, and relationship resolution failures can corrupt data without structured validation.

---

## Core Concepts

- **IngestDefinition:** Declares what data is being imported — source type (CSV, Excel, JSON, API), schema (field names, types, constraints), and target (Eloquent model, database table)
- **IngestConfig:** Configures how the import executes — chunk size, validation rules, relationship resolution, error handling strategy (fail-fast vs skip-and-log), post-import actions
- **Streaming Import:** Reads records one at a time or in small batches instead of loading entire file into memory — mandatory for files larger than available PHP memory
- **Chunked Processing:** Reads source in batches, processes each through validation and transformation, inserts in bulk — balances memory with database write efficiency
- **Validation Pipeline:** Each record goes through field-level (type, format, required), row-level (cross-field constraints), and batch-level (uniqueness) validation

---

## Mental Models

- **Ingest as Quality Control Gate:** Think of Laravel Ingest as a quality control checkpoint at a factory entrance. Every incoming item (record) is inspected (validated), sorted (transformed), and routed (stored). Items that fail inspection are either rejected (fail-fast) or set aside for review (skip-and-log).
- **Import Pipeline as Assembly Line:** Source → Validate → Transform → Store — each station on the assembly line does one job. The pipeline can stop the line (fail-fast) or flag bad items and continue (skip-and-log).

---

## Internal Mechanics

The pipeline stages are: Source Reading (stream/chunk from file, API, or database) → Schema Validation (field type and format) → Relationship Resolution (resolve foreign keys, connect related models) → Transformation (type casting, field mapping, defaults) → Storage (batch insert with transaction boundaries) → Post-Processing (webhooks, notifications, cache invalidation). Each chunk is wrapped in a database transaction — if a chunk fails, only that chunk is rolled back. The validation pipeline runs completely before any database writes to prevent partial imports.

---

## Patterns

- **Validate Before Insert:** Run complete validation pipeline before any database writes — if validation fails, roll back the entire chunk — partial imports are the leading cause of data corruption
- **Transactions with Chunks:** Wrap each chunk in a database transaction — if a chunk fails, only that chunk is rolled back, previously imported chunks preserved
- **Declarative Duplicate Handling:** Define the duplicate resolution strategy in `IngestConfig` — skip duplicates, update existing records, or fail on duplicates

---

## Architectural Decisions

Choose fail-fast strategy for compliance-critical imports where no partial data is acceptable. Choose skip-and-log for large bulk imports where partial success is acceptable and bad records can be reviewed later. Use streaming import for any file that may exceed PHP memory. Use chunked processing with transaction boundaries for all production imports. Never process imported data through the same code path as user form submissions.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Structured import pipeline | Configuration overhead for simple imports | Use FormRequest + Eloquent for single record creation |
| Streaming prevents OOM crashes | Streaming adds complexity for small files | Small files can use simple loading |
| Validation prevents data corruption | Validation rules must be as strict as FormRequest | Import data has different trust characteristics |
| Transaction-per-chunk safety | Larger transactions lock tables longer | Balance chunk size with concurrency needs |

---

## Performance Considerations

Streaming import memory usage is O(record_size), not O(file_size) — each record processed and discarded. Chunk size should match database write throughput: 100-500 per chunk for MySQL, 500-2000 for PostgreSQL. Relationship resolution adds latency — cache reference data (lookup tables) in memory during import. Validation-heavy imports benefit from parallel validation workers, but database writes must be sequential.

---

## Production Considerations

Import data bypasses normal application input paths — validation must be at least as strict as FormRequest. File uploads must be scanned for malware before processing. CSV/Excel files may contain formula injection payloads — strip leading `=`, `+`, `-`, `@` from string fields. API source credentials must be stored securely and scoped to read-only. Log every import with source file, record count, success/failure counts, duration, and error details.

---

## Common Mistakes

- **Loading Entire File Into Memory:** `file_get_contents()` or `Excel::load()` on a 500MB CSV file — PHP runs out of memory, import fails with vague error. Better: use streaming readers (OpenSpout).
- **No Validation Before Insert:** Records inserted into database, validation failures discovered later during querying — corrupted analytics database. Better: validate all records before any writes, use transactions per chunk.
- **Ignoring File Encoding:** CSV files from Windows use UTF-8 with BOM or ISO-8859-1 — special characters garbled in database. Better: detect and convert file encoding during source reading, normalize to UTF-8.

---

## Failure Modes

- **Import-As-User-Submission:** Processing imported data through the same code path as user form submissions — import data has different trust characteristics. Mitigation: use dedicated import pipeline with import-specific validation and error handling.
- **Zero-Transaction Import:** Every record inserted individually without transactions — import fails halfway, database has partial inconsistent data. Mitigation: wrap batches in transactions, use savepoints for very large batches.
- **Unattended Imports Without Monitoring:** Imports run on cron without success/failure monitoring — import silently fails for weeks, analytics team works with stale data. Mitigation: monitor import execution status, alert on failures, track data freshness.

---

## Ecosystem Usage

Laravel Ingest is part of the Laravel ecosystem alongside ETL Manifesto (export). It integrates with OpenSpout for streaming file reads, Eloquent for model targeting, and the queue system for asynchronous processing. The `IngestDefinition` and `IngestConfig` classes follow Laravel's configuration-driven pattern, similar to how `FormRequest` handles validation.

---

## Related Knowledge Units

### Prerequisites
- Eloquent Model Basics — Target models for imported data

### Related Topics
- ETL Manifesto — Complementary export framework (Ingest = import, Manifesto = export)
- CSV/Excel/Parquet Export — Shared file format knowledge
- Medallion Architecture — Ingest feeds the Bronze layer

### Advanced Follow-up Topics
- Data Vault 2.0 — Target schema for ingested data in enterprise data warehouses

---

## Research Notes

Data import is one of the most error-prone operations in Laravel applications because files arrive in inconsistent formats and partial imports corrupt data. Laravel Ingest's declarative approach addresses this by treating data imports as configurations rather than procedural scripts. The streaming import pattern (using OpenSpout) is mandatory for production-scale imports, and the validation-before-insert principle prevents the most common data corruption scenarios.
