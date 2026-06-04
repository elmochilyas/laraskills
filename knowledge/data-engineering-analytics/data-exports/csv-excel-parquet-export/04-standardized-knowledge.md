# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 07-data-exports
**Knowledge Unit:** csv-excel-parquet-export
**Difficulty:** Intermediate
**Category:** Data Export
**Last Updated:** 2026-06-03

---

# Overview

Data export is the final mile of the analytics pipeline — transforming query results into downloadable files for end users (CSV, Excel) or data lakes (Parquet). The core engineering challenge is memory: naive collection-based exports load all data into PHP memory, causing OOM crashes on datasets > 100K rows. Chunked processing — reading from the database in smaller batches, writing to the output format incrementally — is mandatory for production-scale exports.

Engineers must care because exports are a common Laravel feature that looks deceptively simple. A naive implementation works for 1,000 rows but crashes for 100,000. Production exports must handle millions of rows reliably, with progress feedback, timeout management, and proper memory cleanup.

---

# Core Concepts

## Chunked Query

Using `chunk()` or `lazy()` (cursor-based) to read results in batches of 500-1000 rows instead of loading the entire result set into memory. Each chunk is processed and written to the output before the next chunk is fetched.

## Lazy Collections / Cursors

Laravel's `cursor()` method returns a `LazyCollection` that yields one Eloquent model at a time without loading all results into memory. For exports, `lazy()` is preferred over `chunk()` because it streams rows continuously rather than in fixed batches.

## OpenSpout

The recommended PHP library for writing CSV and XLSX files. OpenSpout writes files incrementally — it does not build the entire file in memory. A single OpenSpout Writer can write millions of rows with constant memory usage (~2-5MB).

## PhpSpreadsheet

The dominant PHP library for complex Excel files (formulas, formatting, charts). PhpSpreadsheet builds the entire file in memory, making it unsuitable for large exports. Use OpenSpout for large datasets and PhpSpreadsheet only for small, formatting-heavy files.

## Parquet

A columnar storage format optimized for analytical queries and data lake storage. Parquet files are compressed, schema-rich, and can be split across multiple row groups. PHP Parquet libraries (such as `flow-php/parquet`) enable writing Parquet files directly from Laravel pipelines.

## Memory Ceiling

The maximum memory available for the export process. PHP's `memory_limit` defines the hard ceiling. Exports must stay below this limit by streaming data and releasing resources after each chunk.

---

# When To Use

- CSV: Universal format for end-user downloads and data interchange
- Excel: Formatting-rich reports for business users
- Parquet: Data lake exports, machine learning pipelines, large-scale analytics

---

# When NOT To Use

- CSV: Not suitable for data with complex formatting or multiple sheets
- Excel: Not suitable for exports over 100,000 rows (use OpenSpout's XLSX for up to 1M rows)
- Parquet: Not suitable for end-user downloads (requires specialized readers)

---

# Best Practices

## Always Use Chunked Processing

Never load all export data into PHP memory. Use `lazy()` (cursor) or `chunk()` for all exports that may exceed 1,000 rows.

## Stream to Disk or Response

For large files, write to a temporary file on disk before sending to the user. Use PHP's output buffering for real-time streaming only for small files.

## Set Timeout for Queue Jobs

Export jobs that run in queues must have appropriate timeouts. A 100K row Excel export may take 30-60 seconds. Set `$timeout` on the job class.

## Compress Large Files

For CSV and Parquet exports, offer gzip compression (`.csv.gz`, `.parquet`). This reduces download size by 5-10x for text data.

---

# Performance Considerations

- CSV: ~1M rows per minute per CPU core with OpenSpout.
- XLSX (OpenSpout): ~500K rows per minute, file size ~50MB per million rows.
- Parquet: ~2M rows per minute, file size ~10MB per million rows (compressed).
- Memory usage: OpenSpout maintains < 5MB for any file size. PhpSpreadsheet uses ~100MB+ for 100K rows.

---

# Common Mistakes

## Mistake: Collection-Based Export

`User::all()` is converted to a Collection, then looped to write CSV. With 200K users, PHP memory usage spikes to 500MB+. The process hits `memory_limit` and crashes.

**Better approach:** Use `User::lazy()` to stream 200K users one at a time. Memory stays under 10MB.

## Mistake: PhpSpreadsheet for Large Files

PhpSpreadsheet is used to export 500K rows. The process runs out of memory because PhpSpreadsheet loads all rows into PHP objects before writing.

**Better approach:** Use OpenSpout for large files. Use PhpSpreadsheet only for files under 10K rows that require complex formatting.

## Mistake: No Progress Feedback for Users

A 5-minute export job has no progress indicator. Users refresh the page thinking it's stuck. The export restarts. The server is overwhelmed.

**Better approach:** Dispatch export to a queue job. Update export progress in a database or cache. Poll progress from the frontend.

## Mistake: Synchronous HTTP Export for Large Files

A 2GB CSV export is streamed synchronously to the HTTP response. PHP's execution timeout kills the process at 30 seconds. The user receives a partial file.

**Better approach:** Queue the export. Generate the file in the background. Send a download link via notification or email.
