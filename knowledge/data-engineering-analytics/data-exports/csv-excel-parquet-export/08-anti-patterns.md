# Anti-Patterns: CSV/Excel/Parquet Export with Chunked Processing

## Collection-Based Full Load
`User::all()` returns 500K Eloquent models as a Collection. The export loop iterates over the collection. PHP memory usage exceeds 1GB. The process crashes with an OOM error.

**Solution:** Use `User::lazy()` (cursor) to stream rows one at a time. Memory stays under 10MB regardless of result set size.

## PhpSpreadsheet for Large Exports
PhpSpreadsheet exports 200K rows to Excel. PhpSpreadsheet builds the entire spreadsheet in memory before writing to disk. Memory usage spikes to 2GB. The export fails.

**Solution:** Use OpenSpout for exports over 10K rows. OpenSpout writes incrementally without building the file in memory.

## Synchronous Export for Gigabyte Files
A 2GB CSV export is streamed synchronously to the browser response. PHP's 30-second max_execution_time kills the process after 500MB. The user receives a truncated file.

**Solution:** Queue the export as a background job. Generate the file on disk. Send the download link via notification or email.

## No Temporary File Cleanup
Export temporary files are created in `storage/app/exports/` and never deleted. After 6 months, 50GB of temporary export files consume server disk space.

**Solution:** Schedule an Artisan command to delete temporary files older than 24 hours. Clean up after each download using the file's destructor or deferred cleanup.
