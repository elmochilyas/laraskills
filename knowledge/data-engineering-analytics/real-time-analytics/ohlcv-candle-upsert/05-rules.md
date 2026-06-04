# Rules: OHLCV Candle Upsert Pattern for Time-Series Data

## Rule OCU-01: Use Single Atomic Upsert
OHLCV candles MUST be updated using a single atomic `INSERT ... ON CONFLICT DO UPDATE` statement. SELECT-then-UPDATE patterns are forbidden due to race conditions.

## Rule OCU-02: Align to UTC Clock Boundaries
Time buckets MUST be aligned to UTC clock boundaries using `date_bin` (PostgreSQL) or `toStartOfInterval` (ClickHouse).

## Rule OCU-03: Write to All Granularities
Data points MUST be upserted to all configured granularities (1m, 5m, 1h, 1d) at write time. Query-time aggregation across granularities is forbidden for production dashboards.

## Rule OCU-04: Include Event-Level Deduplication
OHLCV upserts MUST include event-level deduplication. Volume calculations must account for duplicate events from retries.

## Rule OCU-05: Define Staleness Window
A staleness window MUST be defined and documented for late-arriving data. Updates outside the staleness window must be rejected or audited.

## Rule OCU-06: Use ReplacingMergeTree in ClickHouse
ClickHouse OHLCV tables MUST use ReplacingMergeTree with a version column based on event timestamp.

## Rule OCU-07: Document Bucket Boundaries
Bucket alignment strategy MUST be documented. Include UTC offset, standard interval alignment, and how DST transitions are handled.

## Rule OCU-08: Monitor Late-Arriving Data
Late-arriving data rates MUST be monitored. A spike in late data indicates upstream pipeline issues.

## Rule OCU-09: Test With Duplicate Events
OHLCV upsert logic MUST be tested with duplicate events. Verify idempotency: replaying events must produce identical candle values.

## Rule OCU-10: Row-Level Locking Not Required
PostgreSQL's `INSERT ... ON CONFLICT` provides atomic upsert semantics without explicit row-level locking. Explicit locks MUST NOT be added.
