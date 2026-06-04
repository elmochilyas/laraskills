# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 03-etl-elt-pipelines
**Knowledge Unit:** laravel-ingest
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Laravel Ingest vs ETL Manifesto roles understood (Ingest = import/load, Manifesto = extract/export)
- [ ] IngestDefinition and IngestConfig classes created for each import source
- [ ] Streaming import configured for large files to avoid memory exhaustion
- [ ] Chunked processing configured with batch size per import type
- [ ] Validation pipeline defined for data quality checks on import
- [ ] Auto-resolve relationships configured for foreign key matching during import

---

# Architecture Checklist

- [ ] IngestDefinition class declares import schema and expected columns per source format
- [ ] IngestConfig class defines validation rules, relationship resolution, and failure handling
- [ ] Streaming import used for CSV/JSON files > 10MB to prevent memory overflow
- [ ] Chunked processing writes to DB in batches, not single INSERT per row
- [ ] Validation pipeline runs before write to catch malformed records early
- [ ] Ingest feeds the Bronze layer of Medallion architecture (raw, unmodified data)

---

# Implementation Checklist

- [ ] IngestDefinition class created with column list, types, and required flags
- [ ] IngestConfig class created with batch size, validation rules, and relationship mapping
- [ ] Streaming reader configured to process file in chunks without loading entire file
- [ ] Validation rules added for required columns, data types, and value ranges
- [ ] Auto-resolve relationships defined (map incoming foreign_key to existing DB FK)
- [ ] Failure handling strategy configured (skip-and-log vs stop-on-error)

---

# Performance Checklist

- [ ] Batch size tuned per table — large enough for throughput, small enough for transaction log
- [ ] Streaming import processes rows without holding entire file in memory
- [ ] Relationship resolution uses bulk lookup (cached/loaded in memory), not per-row query
- [ ] Disk writes minimized by batching before DB INSERT
- [ ] Import throughput benchmarked against target DB write capacity

---

# Security Checklist

- [ ] Imported file uploaded to restricted directory outside webroot before processing
- [ ] Uploaded file type validated against MIME type and extension, not just extension
- [ ] CSV/JSON column values sanitized against SQL injection during dynamic column mapping
- [ ] Relationship resolution does not expose internal keys — uses validated mapping
- [ ] Import temporary files cleaned up after processing complete

---

# Reliability Checklist

- [ ] Import transaction wraps per-chunk so partial failure rolls back only current batch
- [ ] Skip-and-log strategy configured for import — malformed rows logged, good rows imported
- [ ] Import idempotency via unique key checking — re-importing same file does not duplicate
- [ ] Import status tracked in database (in_progress, completed, failed) for resumability
- [ ] File processed in chunks survives worker restart (queue job per chunk)

---

# Testing Checklist

- [ ] Test CSV import with valid data loads correct row count
- [ ] Test streaming import with large file (>100MB) does not hit memory limit
- [ ] Test validation rejects malformed rows with informative error log
- [ ] Test auto-resolve relationship matches incoming keys to existing records
- [ ] Test chunked failure rolls back only current batch, not entire file
- [ ] Test re-importing same file is idempotent (no duplicates)

---

# Maintainability Checklist

- [ ] IngestDefinition classes organized in app/Ingest/Definitions/ per source
- [ ] IngestConfig classes organized in app/Ingest/Config/ per strategy
- [ ] Validation rules documented per column in IngestDefinition comments
- [ ] Relationship resolution mapping documented in project wiki for data stewards
- [ ] Import pipeline configuration in config/ingest.php for batch sizes and timeouts

---

# Anti-Pattern Prevention Checklist

- [ ] Do not use Laravel Ingest for exports — ETL Manifesto is the export framework
- [ ] Do not process imports on HTTP request thread — use queue jobs
- [ ] Do not skip validation for performance — bad data in Bronze corrupts all downstream layers
- [ ] Do not load entire file into memory — always stream/chunk
- [ ] Do not auto-resolve relationships without validating referential integrity

---

# Production Readiness Checklist

- [ ] Prometheus metrics for import duration, row count, batch size, and error count
- [ ] Logged warning when import detects unexpected column count mismatch
- [ ] Alert when import failure rate exceeds 5% of total rows
- [ ] Import file archive retained for reconciliation (S3/Blob with retention policy)
- [ ] Deploy checklist includes import definition update for source schema changes
- [ ] Import job scheduled during low-write window to reduce DB contention

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: Definition/Config separation, streaming, chunking, validation pipeline
- [ ] Security requirements satisfied: restricted upload dir, MIME validation, SQL injection prevention
- [ ] Performance requirements satisfied: chunked writes, streaming, bulk relationship lookup, throughput benchmarking
- [ ] Testing requirements satisfied: CSV loading, large file streaming, validation, idempotency, chunk rollback
- [ ] Anti-pattern checks passed: no exports, no request-thread processing, validation not skipped, streaming always used
- [ ] Production readiness verified: metrics, column-mismatch warning, failure alerts, file archive, deploy checklist

---

# Related References

- K004 (ETL Manifesto): Complementary export framework (Ingest = import, Manifesto = export)
- K009 (CSV/Excel/Parquet Export): Shared file format knowledge
- K014 (Medallion Architecture): Ingest feeds the Bronze layer
