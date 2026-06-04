# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 07-data-exports
**Knowledge Unit:** csv-excel-parquet-export
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Chunked querying configured to prevent OOM on large datasets (cursor or chunk)
- [ ] Lazy collections or cursor() used for memory-efficient row streaming
- [ ] OpenSpout library chosen for CSV/Excel export (best memory profile)
- [ ] PhpSpreadsheet evaluated for advanced Excel formatting (styling, formulas)
- [ ] Parquet export evaluated for data lake integration (columnar format)
- [ ] Queue-based export (K002) configured for large file generation off request thread

---

# Architecture Checklist

- [ ] Chunked query with cursor() replaces all() for memory-safe large dataset reading
- [ ] OpenSpout writes rows one at a time to file stream — no in-memory collection
- [ ] Export format chosen by file size: CSV < 100MB, Excel < 50MB, Parquet for data lake
- [ ] Export processing dispatched to queue (K002) for datasets > 10K rows
- [ ] Export file stored outside webroot and served via signed URL
- [ ] ETL Manifesto (K004) used for scheduled/recurring exports

---

# Implementation Checklist

- [ ] Cursor query: Model::cursor() or DB::cursor() for lazy row loading
- [ ] OpenSpout writer: WriterMultiSheets for Excel, WriterCSV for CSV
- [ ] Chunk write: writer->addRow($row) called per batch of 1000 rows
- [ ] Parquet writer: flow-php/etl or openspout-parquet extension
- [ ] Queue job: App\Jobs\ExportJob handles export, stores result, notifies user
- [ ] Signed URL for download: temporary URL with expiration (Storage::temporaryUrl)

---

# Performance Checklist

- [ ] Memory ceiling measured — cursor + streaming write stays under configurable limit
- [ ] Chunk size tuned per export type (1000 rows/Chunk for wide rows, 5000 for narrow)
- [ ] Export job queue worker concurrency limited to avoid disk I/O contention
- [ ] Streamed download enabled for large files — file not fully buffered before response
- [ ] Parquet compression ratio measured for columnar storage efficiency
- [ ] Export duration measured and tracked — alert if exceeding expected time

---

# Security Checklist

- [ ] Export file stored in private storage (not public disk) until user downloads
- [ ] Download access controlled via signed URL with configurable TTL
- [ ] Exported data filtered based on user permissions (row-level or column-level)
- [ ] Temporary export files cleaned up by scheduled job
- [ ] Export job user identity logged for audit trail

---

# Reliability Checklist

- [ ] Chunked export resumable — failed at row N, continues from row N+ checkpoint
- [ ] Export job retries on failure with exponential backoff
- [ ] Disk space checked before export starts — fail early if insufficient
- [ ] Export file integrity verified with checksum after writing
- [ ] Temporary partial export files cleaned up on job failure

---

# Testing Checklist

- [ ] Test export with 100K rows does not exceed memory limit
- [ ] Test CSV export opens correctly in Excel/Google Sheets
- [ ] Test Excel export has correct formatting and multiple sheets
- [ ] Test Parquet export loads correctly in Python/Spark
- [ ] Test queue job export creates file and sends notification
- [ ] Test signed URL download expires correctly after TTL

---

# Maintainability Checklist

- [ ] Export classes in App\Exports\ directory with format-specific subclasses
- [ ] Export configuration in config/exports.php (chunk sizes, format defaults, storage disk)
- [ ] Export format decision documented per use case
- [ ] Export job naming: Export\{Entity}Export (e.g., Export\OrdersExport)
- [ ] Export templates (column selection, header mapping) in separate config section

---

# Anti-Pattern Prevention Checklist

- [ ] Do not use all() or get() for export queries — memory exhaustion guaranteed > 10K rows
- [ ] Do not block HTTP response for large exports — use queue and notify
- [ ] Do not store export files in public disk — exposes data without authentication
- [ ] Do not recreate entire file on partial failure — use chunk checkpoint
- [ ] Do not skip file format validation — corrupted export worse than no export

---

# Production Readiness Checklist

- [ ] Prometheus metrics for export count, export file size, export duration
- [ ] Logged warning when export duration exceeds 2x expected baseline
- [ ] Alert if export job failure rate exceeds 5%
- [ ] Export storage cleaned by scheduled job (files older than 24h)
- [ ] Deploy checklist includes export format compatibility test
- [ ] Staging export test with production-scale row count validates memory limits

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: cursor/chunked query, OpenSpout streaming, format choice, queue offloading
- [ ] Security requirements satisfied: private storage, signed URLs, permission filtering, audit trail
- [ ] Performance requirements satisfied: memory ceiling, chunk tuning, streamed download, Parquet compression
- [ ] Testing requirements satisfied: large dataset, CSV/Excel/Parquet correctness, queue job, URL expiry
- [ ] Anti-pattern checks passed: no all()/get() for exports, queue for large, private storage, partial failure handling
- [ ] Production readiness verified: export metrics, duration alerts, failure monitoring, cleanup job, staging

---

# Related References

- K004 (ETL Manifesto): Export-oriented ETL — the export framework equivalent of this KU
- K005 (Laravel Ingest): Import framework — reverse of export flow
- K002 (Queue Dispatching): Queue-based exports for large file generation
