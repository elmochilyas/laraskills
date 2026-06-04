# Decision Trees: ClickHouse MergeTree Engine Configuration

## Decision: ORDER BY Design

**Q: Which columns appear in WHERE clauses most frequently?**
- Determine top 3-5 filter columns
- Order by selectivity (high to low)
- Result: ORDER BY (most_selective, ..., least_selective, date)

**Q: Does the table have a natural time dimension?**
- Yes → Place time column last in ORDER BY
- No → ORDER BY based entirely on filter columns

## Decision: Partition Strategy

**Q: How much data per day?**
- < 10M rows → Monthly partitions
- 10M - 100M rows → Weekly partitions
- > 100M rows → Daily partitions

**Q: How long is data retained?**
- < 30 days → Daily partitions for easy TTL
- 30-365 days → Monthly partitions
- > 365 days → Monthly partitions with yearly archiving

## Decision: TTL Strategy

**Q: Should old data be deleted or aggregated?**
- Delete → TTL expression with DELETE action
- Aggregate → TTL expression with GROUP BY and TO DISK/VOLUME tiering
- Move to cold storage → TTL TO VOLUME 'cold'

## Decision: Index Granularity

**Q: What is the average row width?**
- < 100 bytes → index_granularity = 4096
- 100-500 bytes → index_granularity = 8192 (default)
- 500-2000 bytes → index_granularity = 16384
- > 2000 bytes → index_granularity = 32768
