# Anti-Patterns: OHLCV Candle Upsert Pattern for Time-Series Data

## SELECT-Then-UPDATE Pattern
Two workers read the current candle, compute new values, and UPDATE. Both workers read the same Open value. Worker 2's UPDATE overwrites Worker 1's changes. High and Close from Worker 1 are lost.

**Solution:** Use a single `INSERT ... ON CONFLICT DO UPDATE` statement. The database handles atomicity inside the statement.

## No Deduplication Logic
Data is replayed after a pipeline failure. Each data point is inserted twice. Volume is double-counted. Close values are correct (overwritten), but volume is wrong.

**Solution:** Include event ID in the upsert. Use `EXCLUDED.event_id` deduplication or maintain a separate dedup table.

## Non-Standard Bucket Alignment
Buckets start at the first data point's timestamp. Candle 1m-1: 10:03:27 to 10:04:27. Dashboards expect standard 10:00:00 to 10:01:00 buckets. Queries produce misaligned candles.

**Solution:** Always align to clock boundaries: `date_bin('1 minute', timestamp, '1970-01-01')` for PostgreSQL.

## Query-Time Multi-Granularity
1m candles are stored. 1h candles are computed by query-time aggregation of 1m candles. A dashboard viewing 30 days of 1h candles aggregates 43,200 1m rows for every query.

**Solution:** Pre-compute 1h candles at write time. The storage cost of an additional table is trivial compared to query performance.
