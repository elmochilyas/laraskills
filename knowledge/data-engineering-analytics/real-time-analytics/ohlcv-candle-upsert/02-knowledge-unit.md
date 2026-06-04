# OHLCV Candle Upsert

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 06-real-time-analytics
- **Knowledge Unit:** ohlcv-candle-upsert
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

The OHLCV (Open, High, Low, Close, Volume) candle upsert pattern efficiently maintains rolling time-series aggregations in a single database operation — a single `INSERT ... ON CONFLICT DO UPDATE` (PostgreSQL) or `ReplacingMergeTree` (ClickHouse) merges new data points into the correct time bucket. This is the standard pattern for financial charting, IoT sensor aggregation, and any application requiring bucketed time-series aggregates.

---

## Core Concepts

- **OHLCV Candle:** Time-bucketed aggregate — Open (first value), High (maximum), Low (minimum), Close (last value), Volume (total count/quantity) in the time bucket
- **Upsert Semantics:** PostgreSQL `INSERT ... ON CONFLICT (bucket_time, symbol) DO UPDATE` — single SQL statement creates a new candle or updates an existing one — avoids race conditions between SELECT-then-UPDATE
- **Time Bucketing:** Data points assigned to time buckets by truncating timestamp to desired granularity (1m, 5m, 1h, 1d) — bucket boundaries determine which candle each data point updates
- **Rolling Window Update:** Each new data point updates: Open (unchanged, first value), High (MAX), Low (MIN), Close (overwrite with latest), Volume (SUM)
- **ReplacingMergeTree (ClickHouse):** Handles upsert semantics using a version column — rows with same sorting key deduplicated during merge, keeping only highest version row

---

## Mental Models

- **Candles as Buckets Being Filled:** Each time bucket is a bucket being filled with water drops (data points). The Open is the level when you started filling. High/Low are the highest/lowest levels reached. Close is the current level. Volume is the total number of drops. A new drop may raise High, lower Low, or update Close — but Open never changes.
- **OHLCV as Race Lap:** Think of each time bucket as a lap in a race. Open is the starting time. High is the fastest speed. Low is the slowest speed. Close is the finishing speed. Volume is the total distance covered. A new data point mid-lap updates High, Low, Close, and Volume — but the Open stays the same.

---

## Internal Mechanics

In PostgreSQL, the OHLCV update pattern is: `INSERT INTO candles (bucket_time, symbol, open, high, low, close, volume) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (bucket_time, symbol) DO UPDATE SET high = GREATEST(candles.high, EXCLUDED.high), low = LEAST(candles.low, EXCLUDED.low), close = EXCLUDED.close, volume = candles.volume + EXCLUDED.volume`. In ClickHouse, ReplacingMergeTree stores rows with the same sorting key and uses a version column (typically the event timestamp) — during merge, only the row with the highest version is kept, effectively deduplicating updates.

---

## Patterns

- **Multi-Granularity Update Cascade:** When a data point arrives, update 1m, 5m, 1h, and 1d candles in a single transaction (PostgreSQL) or batch write (ClickHouse) — ensures consistency across granularities
- **Use ReplacingMergeTree for ClickHouse:** Use `ReplacingMergeTree` with a `version` column based on event timestamp — merge process deduplicates candles, keeping most recent version
- **Choose Bucket Boundaries Carefully:** Use UTC-based bucket boundaries aligned to standard intervals (start of minute, hour, day) — avoid server-local time zones — affects query patterns and cache locality

---

## Architectural Decisions

Use OHLCV upsert for any time-series data that needs rolling-window aggregation — financial charting, IoT sensor bucketing, performance metrics (p50/p95/p99 per minute). Do not use for point-in-time data never aggregated, or for data inserted once and never updated. Use PostgreSQL upsert for single-point updates, ClickHouse ReplacingMergeTree for batch inserts of 1000+ rows.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Single atomic operation (upsert) | 4x write amplification for multi-granularity | 1 data point → 4 candle updates (1m, 5m, 1h, 1d) |
| Race-condition free | PostgreSQL upsert scales poorly to batch | 1000+ rows better suited to ClickHouse |
| Idempotent by design (ReplacingMergeTree) | Duplicate points can cause incorrect values | Must include event ID for deduplication |
| Real-time bucketed aggregates | Late-arriving data needs staleness window | Allow updates N minutes after bucket end |

---

## Performance Considerations

PostgreSQL upsert is efficient for single-point updates but scales poorly to batch updates. ClickHouse ReplacingMergeTree is optimized for batch inserts — best performance at 1000+ rows per batch. Multi-granularity inserts multiply write load: 1 data point → 4 writes (1m, 5m, 1h, 1d) = 4x write amplification.

---

## Production Considerations

Handle late-arriving data by implementing a staleness window — allow updates up to N minutes after bucket end. Include a unique event ID in conflict resolution for deduplication. Use `date_bin` (PostgreSQL 14+) or `toStartOfInterval` (ClickHouse) for clock-aligned bucket boundaries. Test with concurrent writers to verify no race conditions or lost updates.

---

## Common Mistakes

- **Per-Point Single Granularity Upsert:** Each data point triggers single upsert to 1m candles — dashboard needs 1h candles, must compute from 1m at query time. Better: upsert to all granularities at write time.
- **Using Non-Aligned Buckets:** Bucket boundaries aligned to first data point's timestamp, not standard time intervals — queries with date range filters produce inconsistent results. Better: use `date_bin` (PostgreSQL 14+) or `toStartOfInterval` (ClickHouse) for UTC clock alignment.
- **No Idempotency:** Duplicate data points from retries cause incorrect OHLCV values (double-counted volume, incorrect close). Better: include unique event ID in conflict resolution, use event-level deduplication.

---

## Failure Modes

- **Race Conditions in PostgreSQL:** Multiple workers update same candle simultaneously without row-level locking — lost updates cause incorrect OHLCV values. Mitigation: use `INSERT ... ON CONFLICT DO UPDATE` single atomic statement, avoid SELECT-then-UPDATE.
- **ClickHouse ReplacingMergeTree Not Immediately Accurate:** Final deduplication happens during merge — queries before merge see duplicate rows. Mitigation: use `FINAL` modifier or `ORDER BY version DESC LIMIT 1 BY sort_key`.
- **Late-Arriving Data Beyond Staleness Window:** Data point arrives after staleness window — candle is already finalized and cached. Mitigation: implement configurable staleness window, document the tradeoff between freshness and correction tolerance.

---

## Ecosystem Usage

The OHLCV pattern is used in financial analytics packages and IoT data pipelines built on Laravel. PostgreSQL upsert is implemented through Eloquent's `upsert()` method or raw DB statements. ClickHouse integration uses `laravel-clickhouse` with `ReplacingMergeTree` engine configuration. The pattern is commonly used with dashboard widget providers that display time-series charts.

---

## Related Knowledge Units

### Prerequisites
- PostgreSQL UPSERT or ClickHouse ReplacingMergeTree Fundamentals
- Time-Series Data Concepts

### Related Topics
- AggregatingMergeTree — Alternative pre-aggregation approach for time-series
- Write Amplification — Impact of multi-granularity OHLCV on write amplification

### Advanced Follow-up Topics
- ClickHouse Materialized Views — Automating multi-granularity cascade
- CDC Sub-Second Replication — Feeding real-time data into OHLCV candles

---

## Research Notes

The OHLCV upsert pattern is the canonical example of time-series data modeling. The key engineering insight is the rolling window update — each new data point within the bucket updates High, Low, Close, and Volume but preserves Open. This requires atomic upsert semantics that PostgreSQL's `INSERT ... ON CONFLICT` and ClickHouse's `ReplacingMergeTree` provide. The multi-granularity cascade (updating 1m, 5m, 1h, 1d simultaneously) is essential for consistent time-series analytics.
