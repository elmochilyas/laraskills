# Rules: Laravel Ingest Configuration Classes

## Rule LI-01: Stream Large Files
Files larger than available PHP memory MUST be processed using streaming readers (OpenSpout). Loading entire files into memory causes OOM failures.

## Rule LI-02: Validate Before Any Insert
The complete validation pipeline MUST run before any database writes within a chunk. Partial validation followed by partial inserts creates data corruption.

## Rule LI-03: Transaction Per Chunk
Each processing chunk MUST be wrapped in a database transaction. If a chunk fails, only that chunk's work is rolled back.

## Rule LI-04: Declarative Duplicate Handling
Duplicate resolution strategy MUST be explicitly configured in IngestConfig. Implicit duplicate behavior (silent skip, double insert) is not acceptable.

## Rule LI-05: Log Every Import Execution
Every import run MUST be logged with source, record count, success/failure counts, duration, and error details. Imports without audit trails cannot be debugged.

## Rule LI-06: Dedicated Import Validation Rules
Import validation rules MUST be at least as strict as FormRequest validation for the same data. Import data bypasses normal application input paths.

## Rule LI-07: Strip Formula Injection
CSV and Excel imports MUST strip leading `=`, `+`, `-`, `@` characters from string fields to prevent formula injection attacks.

## Rule LI-08: Detect and Normalize Encoding
Source file encoding MUST be detected and normalized to UTF-8 before processing. Encoding mismatches corrupt text data silently.

## Rule LI-09: Cache Reference Data During Import
Relationship reference data (lookup tables) SHOULD be cached in memory during the import to avoid repeated database queries per record.

## Rule LI-10: Monitor Import Freshness
Import execution status MUST be monitored. Failed or skipped imports must be alerted. Historical import logs must be retained for audit.
