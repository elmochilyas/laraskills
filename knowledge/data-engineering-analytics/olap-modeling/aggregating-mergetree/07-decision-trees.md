# Decision Trees: ClickHouse AggregatingMergeTree + State/Merge Functions

## Decision: AMT vs Query-Time Aggregation

**Q: What is the raw data volume per day?**
- < 10M rows → Query-time aggregation is acceptable
- 10M-100M rows → AMT beneficial for frequent queries
- 100M+ rows → AMT recommended for all dashboard queries

**Q: How frequently is the aggregation queried?**
- Every minute → AMT required for performance
- Hourly → AMT recommended
- Daily → Query-time aggregation may be sufficient

## Decision: Granularity Selection

**Q: What is the finest time granularity needed?**
- Per minute → AMT with minute-level granularity
- Per hour → Hourly AMT table
- Per day → Daily AMT table (raw data can be aggregated at query time)
