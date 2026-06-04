# Anti-Patterns: ClickHouse MergeTree Engine Configuration

## ORDER BY With No Query Pattern Analysis
ORDER BY is set to whatever the developer thought was reasonable without analyzing actual query patterns. Queries are 100x slower than they could be because the ORDER BY does not match the WHERE clauses.

**Solution:** Analyze `system.query_log` to identify the most common filter columns. Redesign ORDER BY to match actual usage.

## Daily Partitioning for Low-Volume Tables
A table receiving 1000 rows/day is partitioned by day. After a year, there are 365 partitions. Each background merge handles tiny partitions independently. Merge overhead dominates system resources.

**Solution:** Partition by month for low-volume tables. Daily partitioning is only justified for high-volume tables (> 10M rows/day).

## No TTL, Infinite Data Growth
A MergeTree table accumulates data for 3 years without TTL. Storage costs are 10x the necessary amount. Query performance degrades because the table scans years of irrelevant data.

**Solution:** Configure TTL from table creation. Default: 90 days for raw events, 2 years for monthly aggregates.

## PRIMARY KEY Larger Than ORDER BY
`PRIMARY KEY (col1, col2, col3, col4, col5)` with `ORDER BY (col1, col2)`. The primary key adds index overhead for columns that don't provide additional filtering benefit.

**Solution:** PRIMARY KEY should be a subset of ORDER BY. Only include columns that provide meaningful index skipping.

## Low-Cardinality Column First in ORDER BY
`ORDER BY (status, date)` where `status` has 3 values. ClickHouse cannot skip many granules based on status alone. The date column provides better filtering but is second.

**Solution:** Place high-cardinality columns first. Move low-cardinality dimensions right in the ORDER BY.
