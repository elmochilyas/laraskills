# Decision Trees: OHLCV Candle Upsert Pattern for Time-Series Data

## Decision: PostgreSQL vs ClickHouse for OHLCV

**Q: What is the data volume?**
- < 10M candles per day → PostgreSQL upsert (simpler, ACID)
- > 10M candles per day → ClickHouse ReplacingMergeTree (analyical performance)

## Decision: Upsert vs Materialized View

**Q: Does the application need real-time candle updates?**
- Yes, real-time → Upsert pattern (immediate update on data arrival)
- No, near-real-time → ClickHouse materialized view (batched aggregation)

## Decision: Single vs Multi-Granularity

**Q: How many granularities are needed for dashboards?**
- 1-2 granularities → Compute directly from raw data (simpler)
- 3+ granularities → Pre-compute all at write time (avoid query-time aggregation)
