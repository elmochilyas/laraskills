# Skills: CSV/Excel/Parquet Export with Chunked Processing

## Skill: Building a Chunked CSV Export in Laravel
**Purpose:** Export large datasets to CSV without memory issues using chunked processing.
**When to use:** Any CSV export that may exceed 1,000 rows.
**Steps:**
1. Define export query with `lazy()` or `chunk()` for streaming
2. Open OpenSpout Writer for CSV output
3. Iterate over query chunks, writing each row to the Writer
4. Write to temporary file on disk
5. Return download response for completed file
6. Clean up temporary file after download
7. For very large files, queue the export and notify user on completion
