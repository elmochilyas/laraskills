# Rules: CSV/Excel/Parquet Export with Chunked Processing

## Rule EXP-01: Chunked Processing Required
All exports that MAY exceed 1,000 rows MUST use `lazy()` (cursor) or `chunk()` for database reads. Collection-based full-load exports are forbidden.

## Rule EXP-02: Use OpenSpout for Large Files
Excel exports exceeding 10,000 rows MUST use OpenSpout. PhpSpreadsheet is only permitted for files under 10,000 rows requiring complex formatting.

## Rule EXP-03: Queue Long-Running Exports
Exports expected to take more than 30 seconds MUST be dispatched to a queue job. Synchronous HTTP exports for large files are forbidden.

## Rule EXP-04: Set Job Timeout
Export queue jobs MUST have appropriate `$timeout` set based on expected export size and complexity.

## Rule EXP-05: Provide Progress Feedback
Queue-based exports MUST provide progress feedback (polling endpoint or WebSocket update) so users know the export is progressing.

## Rule EXP-06: Clean Up Temporary Files
Export temporary files MUST be cleaned up after download or on a scheduled cleanup task. Temporary files must not accumulate on disk.

## Rule EXP-07: Compress Large Text Exports
CSV and Parquet exports exceeding 100MB MUST be compressed (gzip) before delivery to reduce bandwidth and download time.

## Rule EXP-08: Test Export Memory Usage
Export performance MUST be tested with maximum expected data volume. Memory usage must stay below 50% of PHP `memory_limit`.

## Rule EXP-09: Document Export Format Limitations
Each export format's row limits, file size limits, and formatting capabilities MUST be documented for end users.

## Rule EXP-10: Handle Export Cancellation
Long-running exports MUST support cancellation. Partially written files must be cleaned up on cancellation.
