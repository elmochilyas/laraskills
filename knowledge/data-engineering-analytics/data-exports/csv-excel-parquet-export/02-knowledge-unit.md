# CSV, Excel, Parquet Export

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 07-data-exports
- **Knowledge Unit:** csv-excel-parquet-export
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Data export is the final mile of the analytics pipeline — transforming query results into downloadable files for end users (CSV, Excel) or data lakes (Parquet). The core engineering challenge is memory management: naive collection-based exports load all data into PHP memory, causing OOM crashes on datasets > 100K rows. Chunked processing, streaming writers, and queue-backed generation are mandatory for production-scale exports.

---

## Core Concepts

- **Chunked Query:** Using `chunk()` or `lazy()` (cursor-based) to read results in batches of 500-1000 rows — each chunk processed and written before the next is fetched
- **Lazy Collections / Cursors:** Laravel's `cursor()` returns `LazyCollection` yielding one model at a time — `lazy()` is preferred over `chunk()` for streaming continuous rows
- **OpenSpout:** Recommended PHP library for writing CSV and XLSX files — writes incrementally without building entire file in memory — constant memory usage (~2-5MB) for any file size
- **PhpSpreadsheet:** Dominant PHP library for complex Excel files (formulas, formatting, charts) — builds entire file in memory — unsuitable for large exports (use only for < 10K rows with formatting)
- **Parquet:** Columnar storage format optimized for analytical queries and data lakes — compressed, schema-rich, splittable across row groups — PHP libraries like `flow-php/parquet` enable direct writing from Laravel

---

## Mental Models

- **Export as Assembly Line:** Chunked export is like an assembly line — each batch of parts (rows) arrives at the workstation, gets processed, and moves to packaging (file write). The workstation never holds all parts at once. Naive collection export is like trying to bring every part to the workstation before starting work — the floor overflows.
- **Memory as Water Glass:** PHP memory is a water glass. A collection-based export fills the glass with data. A streaming export (lazy/cursor) is like drinking from a fountain — you take small sips (chunks), never filling the glass completely. OpenSpout is a fountain for writing — you sip data and write it out immediately.

---

## Internal Mechanics

The export pipeline: query the database using `lazy()` or `chunk()` to get batches of rows → for each batch, transform data as needed → write to the file using OpenSpout (addRow for CSV/XLSX) or Parquet writer (append row group). OpenSpout flushes data to disk after each row or batch, maintaining constant memory. For queue-backed exports, the job updates progress in a database table or cache, which the frontend polls. After all rows are written, the file is closed, compressed (optional), and made available for download.

---

## Patterns

- **Always Use Chunked Processing:** Never load all export data into PHP memory — use `lazy()` (cursor) or `chunk()` for all exports that may exceed 1,000 rows
- **Stream to Disk or Response:** For large files, write to temporary file on disk before sending — use PHP's output buffering for real-time streaming only for small files
- **Set Timeout for Queue Jobs:** Export jobs in queues must have appropriate timeouts — a 100K row Excel export may take 30-60 seconds — set `$timeout` on the job class

---

## Architectural Decisions

Use CSV for universal end-user downloads and data interchange. Use Excel (OpenSpout XLSX) for formatting-rich reports for business users (up to 1M rows). Use Parquet for data lake exports and machine learning pipelines. Never use PhpSpreadsheet for exports over 10K rows — it builds the entire file in memory. Use OpenSpout for all CSV and simple XLSX exports. Use `flow-php/parquet` for Parquet generation.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| CSV: universal, simple, fast | No formatting, single sheet | Best for raw data interchange |
| Excel: rich formatting, business-friendly | File size larger, slower to generate | OpenSpout handles up to 1M rows |
| Parquet: compressed, schema-rich, columnar | Requires specialized readers | Best for data lake/ML pipelines |
| OpenSpout: constant memory (5MB) | Limited formatting support | Sufficient for most export use cases |

---

## Performance Considerations

CSV: ~1M rows per minute per CPU core with OpenSpout. XLSX (OpenSpout): ~500K rows per minute, ~50MB per million rows. Parquet: ~2M rows per minute, ~10MB per million rows (compressed). OpenSpout memory: < 5MB for any file size. PhpSpreadsheet memory: ~100MB+ for 100K rows.

---

## Production Considerations

Offer gzip compression for CSV and Parquet exports (`.csv.gz`, `.parquet`) — reduces download size by 5-10x for text data. Provide progress feedback for long-running exports — dispatch to queue job, update progress in cache, poll from frontend. Never stream large files synchronously in HTTP response — PHP execution timeout kills the process.

---

## Common Mistakes

- **Collection-Based Export:** `User::all()` converted to Collection, then looped for CSV — with 200K users, PHP memory spikes to 500MB+, hits `memory_limit` and crashes. Better: use `User::lazy()` to stream rows one at a time, memory stays under 10MB.
- **PhpSpreadsheet for Large Files:** PhpSpreadsheet used for 500K row export — runs out of memory loading all rows into PHP objects before writing. Better: use OpenSpout for large files, PhpSpreadsheet only under 10K rows.
- **No Progress Feedback:** 5-minute export job with no progress indicator — users refresh page thinking it's stuck, export restarts, server overwhelmed. Better: dispatch to queue, update progress, poll from frontend.

---

## Failure Modes

- **Synchronous HTTP Export for Large Files:** 2GB CSV streamed synchronously — PHP execution timeout kills process at 30 seconds, user receives partial file. Mitigation: queue the export, generate in background, send download link via notification.
- **Memory Exhaustion on Multi-MB Rows:** Rows with large text fields (10KB+ each) — even chunked, memory usage spikes. Mitigation: select only needed columns, use cursor-based lazy loading.
- **File Encoding Issues:** CSV written with wrong encoding — special characters garbled for users with different locale settings. Mitigation: always write UTF-8 with BOM for Excel compatibility.

---

## Ecosystem Usage

Laravel's storage system (local, S3, SFTP) provides the file destination for exports. The queue system handles background generation. OpenSpout is available via `openspout/openspout` Composer package. `flow-php/parquet` provides Parquet support. ETL Manifesto can use these libraries for its file output targets.

---

## Related Knowledge Units

### Prerequisites
- Eloquent Query Builder — Chunked and lazy query patterns
- Queue Dispatching — Queue-backed export job execution

### Related Topics
- Laravel Ingest — Import framework (complementary to export)
- ETL Manifesto — Declarative export pipeline configuration

### Advanced Follow-up Topics
- Dashboard Widget Provider — Export functionality integrated into dashboards
- Warehouse Cost Optimization — Cost comparison of export storage formats

---

## Research Notes

Data export is a deceptively simple feature that fails at production scale without proper memory management. The combination of lazy queries (cursor) and streaming writers (OpenSpout) is the only reliable approach for large exports. The choice between CSV, Excel, and Parquet depends on the consumer — business users need Excel, data engineers need Parquet, and the universal format is CSV. Queue-backed generation with progress feedback is the production standard.
