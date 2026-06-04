# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 06-real-time-analytics
**Knowledge Unit:** ohlcv-candle-upsert
**Difficulty:** Intermediate
**Category:** Time-Series Data
**Last Updated:** 2026-06-03

---

# Overview

The OHLCV (Open, High, Low, Close, Volume) candle upsert pattern efficiently maintains rolling time-series aggregations in a single database operation. Instead of SELECT+INSERT+UPDATE cycles for each new data point, a single `INSERT ... ON CONFLICT DO UPDATE` (PostgreSQL) or `ReplacingMergeTree` (ClickHouse) merges new data points into the correct time bucket, updating the open/high/low/close/volume values as needed. This is the standard pattern for financial charting, IoT sensor aggregation, and any application requiring bucketed time-series aggregates.

Engineers must care because OHLCV is the canonical example of time-series data modeling. Understanding the upsert pattern — time bucketing, rolling window updates, and idempotent merge semantics — transfers to any time-series aggregation problem.

---

# Core Concepts

## OHLCV Candle

A time-bucketed aggregate of a financial or sensor data stream. Each candle represents:
- **Open:** First value in the time bucket
- **High:** Maximum value in the time bucket
- **Low:** Minimum value in the time bucket
- **Close:** Last value in the time bucket
- **Volume:** Total count/quantity in the time bucket

## Upsert Semantics

PostgreSQL's `INSERT ... ON CONFLICT (bucket_time, symbol) DO UPDATE` allows a single SQL statement to either create a new candle or update an existing one. This avoids race conditions between SELECT-then-UPDATE operations.

## Time Bucketing

Data points are assigned to time buckets by truncating the timestamp to the desired granularity (1m, 5m, 1h, 1d). The bucket boundaries determine which candle each data point updates.

## Rolling Window Update

Each new data point within the bucket updates the OHLCV values:
- Open: unchanged (first value recorded)
- High: MAX(high, new_price)
- Low: MIN(low, new_price)
- Close: new_price (always overwritten with latest)
- Volume: SUM(volume, new_volume)

## ReplacingMergeTree (ClickHouse)

ClickHouse's `ReplacingMergeTree` engine handles upsert semantics using a version column. Rows with the same sorting key are deduplicated during merge, keeping only the row with the highest version. This is the ClickHouse-native approach for OHLCV patterns.

---

# When To Use

- Financial candlestick charting
- IoT sensor data bucketing (temperature, pressure, humidity per hour)
- Performance metrics (request latency p50/p95/p99 per minute)
- Any time-series data that needs rolling-window aggregation
- Multi-granularity time-series (same data at 1m, 5m, 1h, 1d)

---

# When NOT To Use

- Point-in-time data that is never aggregated (use raw time-series storage)
- Analytical queries that need full resolution then aggregate at query time
- Data that is inserted once and never updated (simple INSERT is cheaper)

---

# Best Practices

## Choose Bucket Boundaries Carefully

Use UTC-based bucket boundaries aligned to standard intervals (start of minute, hour, day). Avoid server-local time zones. Bucket alignment affects query patterns and cache locality.

## Handle Late-Arriving Data

Data points arriving after their time bucket has been queried and cached need to update the candle. Implement a staleness window — allow updates up to N minutes after bucket end.

## Multi-Granularity Update Cascade

When a data point arrives, update the 1m, 5m, 1h, and 1d candles in a single transaction (PostgreSQL) or batch write (ClickHouse). This ensures consistency across granularities.

## Use ReplacingMergeTree for ClickHouse

For ClickHouse, use `ReplacingMergeTree` with a `version` column based on event timestamp. The merge process deduplicates candles, keeping the most recent version.

---

# Performance Considerations

- PostgreSQL upsert is efficient for single-point updates but scales poorly to batch updates.
- ClickHouse ReplacingMergeTree is optimized for batch inserts — best performance at 1000+ rows per batch.
- Multi-granularity inserts multiply write load: 1 data point → 4 writes (1m, 5m, 1h, 1d) = 4x write amplification.
- Materialized views can reduce write amplification by computing granularities at write time.

---

# Common Mistakes

## Mistake: Per-Point Single Granularity Upsert

Each data point triggers a single upsert to the 1m candles table. Dashboard needs 1h candles. The 1h candles must be computed by querying 1m candles at query time.

**Better approach:** Upsert to all granularities at write time. The additional write cost is small compared to query-time aggregation overhead.

## Mistake: Using Non-Aligned Buckets

Bucket boundaries are aligned to the first data point's timestamp, not to standard time intervals. Queries with date range filters produce inconsistent results because buckets don't align to clock boundaries.

**Better approach:** Use `date_bin` (PostgreSQL 14+) or `toStartOfInterval` (ClickHouse) to align buckets to UTC clock boundaries.

## Mistake: No Idempotency

Duplicate data points from retries cause incorrect OHLCV values (double-counted volume, incorrect close). The upsert does not have deduplication logic.

**Better approach:** Include a unique event ID in the conflict resolution. For volume, use `COALESCE(SUM(volume, EXCLUDED.volume), 0)` with event-level deduplication.

## Mistake: Race Conditions in PostgreSQL

Multiple workers update the same candle simultaneously without row-level locking. Lost updates cause incorrect OHLCV values.

**Better approach:** Use `INSERT ... ON CONFLICT DO UPDATE` (single atomic statement). Avoid SELECT-then-UPDATE patterns.
