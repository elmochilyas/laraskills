# Anti-Patterns: Laravel Ingest Configuration Classes

## Loading Entire File Into Memory
The import reads the entire CSV file into memory before processing. A 2GB file causes PHP memory exhaustion. The import fails with an OOM error after consuming significant time and resources.

**Solution:** Use streaming readers that process records one at a time. OpenSpout and similar libraries handle files of any size with constant memory usage.

## Validation After Insert
Records are inserted into the database and then validated in a post-processing step. Invalid records are already in the database and must be cleaned up. This corrupts the analytics data.

**Solution:** Validate all records before any insert. Use pre-processing validation that fails the entire chunk if any record is invalid.

## Ignoring Relationship Failure
An imported record references a related entity that doesn't exist (e.g., a customer import references a non-existent region ID). The record is inserted with a null foreign key, and referential integrity is broken.

**Solution:** Resolve relationships during import. If a relationship cannot be resolved, skip the record or insert a placeholder reference.

## Single Transaction for Million-Row Import
The entire 1M row import is wrapped in a single database transaction. If the import fails at row 950,000, all 950K previous inserts are rolled back, and the entire import must restart.

**Solution:** Use chunked transactions. Each chunk (500-2000 rows) is its own transaction. Failed chunks can be retried without losing previously imported data.

## Import Logs Without Context
Import logs record "500 records imported" without source filename, timestamp, user who triggered the import, or error details. When a user reports incorrect data, there is no way to trace which import caused it.

**Solution:** Log full import context: source identifier, start/end timestamps, triggering user, record counts, error details, and checksum of source data.
