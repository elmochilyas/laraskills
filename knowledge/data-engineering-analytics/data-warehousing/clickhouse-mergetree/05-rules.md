# Rules: ClickHouse MergeTree Engine Configuration

## Rule CMT-01: ORDER BY Matches Query Patterns
The ORDER BY key MUST match the most common query WHERE clauses. Columns used in WHERE filters should be leftmost in ORDER BY.

## Rule CMT-02: Limit Partition Count
Active partitions MUST be kept between 10-200. Too few partitions reduce parallelism; too many cause merge thrashing.

## Rule CMT-03: TTL from Table Creation
TTL MUST be configured at table creation time. Adding TTL later requires data rewrites and disrupts production queries.

## Rule CMT-04: Primary Key for Wide ORDER BY
ORDER BY with more than 4 columns MUST have an explicit PRIMARY KEY specifying the most selective columns to reduce index size.

## Rule CMT-05: Index Granularity Alignment
`index_granularity` SHOULD be adjusted per table based on row width. Wide rows need higher granularity (4096-16384); narrow rows need lower (2048-4096).

## Rule CMT-06: High-Cardinality First
ORDER BY MUST place high-cardinality columns before low-cardinality columns. Low-cardinality first provides minimal index filtering.

## Rule CMT-07: Partition by Date Range
Partitions SHOULD be based on date ranges (monthly or daily). Time-based partitioning enables natural data lifecycle management and query pruning.

## Rule CMT-08: Monitor Part Count
Part count per partition MUST be monitored. A growing part count indicates insufficient merge throughput or overly aggressive insert rate.

## Rule CMT-09: Merge Settings for Production
Production tables MUST configure merge settings: `merge_with_ttl_timeout`, `max_parts_in_total`. Default settings are optimized for development.

## Rule CMT-10: Test ORDER BY Changes
ORDER BY key changes MUST be tested on a copy of the data. Changing ORDER BY on an existing table requires table recreation and data re-insertion.
