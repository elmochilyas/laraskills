# Anti-Patterns: Custom ClickHouse Codec Selection

## ZSTD Level 22 on Everything
Maximum compression applied to all columns. Insert throughput drops by 10x. CPU usage spikes during ingestion. Storage savings over ZSTD level 3 are negligible (3-7%).

**Solution:** Use ZSTD level 1-3 for most columns. Higher levels only for archival partitions with heavy compression requirements.

## Heavy Codec on Primary Key
ORDER BY key columns use ZSTD level 6. ClickHouse must decompress the entire key column before it can start index-based filtering. Every query is slowed by unnecessary decompression.

**Solution:** Keep primary key columns with LZ4 or no codec. Index-read-first, then decompress the matching rows' other columns.

## No Codec Strategy
All columns use the default table-level LZ4 codec. Timestamps are stored at 8 bytes instead of 2-5. Strings use LZ4's moderate compression instead of ZSTD's superior ratio.

**Solution:** Review column types and apply appropriate codecs. Default LZ4 is not optimal for most analytics workloads.

## Codecs on Always-Queried Columns
A column that appears in every query's WHERE clause uses ZSTD level 6. Every query pays decompression cost for this column, reducing overall performance.

**Solution:** Columns in WHERE clauses benefit from LZ4's fast decompression. Move heavy compression to columns that are selected but not filtered.
