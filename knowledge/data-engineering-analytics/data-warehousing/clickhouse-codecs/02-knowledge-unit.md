# ClickHouse Codecs

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 04-data-warehousing
- **Knowledge Unit:** clickhouse-codecs
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

ClickHouse allows per-column compression codecs — not just table-level compression — enabling granular optimization of storage-compression-ratio vs query-speed independently for each column type. A well-chosen codec reduces storage by 60-80% while improving query performance by reducing the amount of data read from disk, making codec selection one of the most impactful optimizations in any ClickHouse-based analytics pipeline.

---

## Core Concepts

- **LZ4:** Default codec — extremely fast compression/decompression, moderate ratios (2-3x) — best for frequently queried columns where decompression speed matters more than storage ratio
- **ZSTD:** Best general-purpose ratio (3-8x) with configurable level (1-22) — decompression speed comparable to LZ4 at levels 1-3 — best for stored but rarely scanned columns
- **Delta:** Stores difference between consecutive values — works for monotonically increasing values (timestamps, auto-increment IDs) — typically combined with LZ4 or ZSTD
- **DoubleDelta:** Stores delta of deltas for timestamp columns — compresses sequential timestamps to 2-5 bytes per value — best for regularly-spaced timestamps
- **Gorilla:** Optimized for floating-point values that change slowly — based on Facebook's Gorilla TSDB — stores XOR of consecutive values

---

## Mental Models

- **Codecs as Wardrobe Organization:** LZ4 is like everyday hangers — fast to access, good for clothes you wear daily. ZSTD is like vacuum storage bags — great for seasonal clothes (time-consuming to pack/unpack but saves space). Delta is like organizing by color — efficient when items are already similar.
- **Compression as Translation:** Each codec is a different language for expressing the same data. DoubleDelta speaks "timestamp" natively and does it in 2-5 characters. Gorilla speaks "float" efficiently. ZSTD is a general-purpose translator. Using the wrong codec is like writing a novel in a language with no vowels.

---

## Internal Mechanics

Codecs are applied per-column at table creation time using `CODEC(type1, type2)` syntax — e.g., `CODEC(DoubleDelta, LZ4)`. During INSERT, the codec transforms raw values into compressed representation. During SELECT, decompression happens on-the-fly as column data is read from disk. Combined codecs chain: Delta reduces value range, then LZ4 or ZSTD compresses the result. Changing codecs on existing tables requires `ALTER TABLE MODIFY COLUMN ... CODEC` which rewrites the column data. Codec selection affects both storage size and query performance — heavier compression reduces I/O but increases CPU decompression time.

---

## Patterns

- **Combine Delta with Compression:** Delta codecs combined with a compression codec — `CODEC(DoubleDelta, LZ4)` for timestamps — Delta reduces value range, compression codec compresses the result
- **LZ4 for Hot Data, ZSTD for Cold:** Frequently queried columns use LZ4 (fast decompression), historical/archival columns use ZSTD level 3-6 (better compression, acceptable speed)
- **Tiered Codec Strategy:** LZ4 for recent partitions (hot), ZSTD level 3 for medium-age, ZSTD level 6 for old (cold) — use TTL + `ALTER TABLE MODIFY COLUMN` to transition as data ages

---

## Architectural Decisions

Apply codecs at table creation time — adding later requires column rewrite. Use LZ4 for ORDER BY key columns (frequently read for index analysis). Use ZSTD for non-key columns with rarely-accessed data. Use DoubleDelta for all timestamp columns — 40-60% space savings with identical query performance. Use Gorilla only for Float/Float64 columns. Avoid ZSTD levels above 6 — marginal compression gain is not worth insert-time CPU cost.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| 60-80% storage reduction | CPU overhead for compression/decompression | LZ4 is negligible, high ZSTD levels add latency |
| Column-level optimization granularity | Must analyze each column's data pattern | Wrong codec can increase size |
| Improved query performance (less I/O) | Codec changes require column rewrite | Plan codec strategy at table creation |
| Tiered codecs optimize hot/cold data | More complex table management | TTL + ALTER for automated transitions |

---

## Performance Considerations

LZ4 decompression is ~2.5 GB/s/core; ZSTD decompression is ~1 GB/s/core. DoubleDelta on regular timestamps: 2-5 bytes/value vs 8 bytes uncompressed. Gorilla on stable floats: 4-8 bytes/value vs 8 bytes uncompressed. Higher ZSTD levels (10+) are rarely worth insert-time CPU cost. Codec decompression happens during query, not insert — insert performance impact is usually acceptable.

---

## Production Considerations

Compression is not encryption — data with any codec is not protected from unauthorized disk access. Codecs operate transparently — application code does not need to know which codec is used. Only use built-in codecs (custom codecs not supported). Test codec combinations on a representative data sample before deploying to production — compare compressed size, insert speed, and query speed.

---

## Common Mistakes

- **ZSTD Level 22 on All Columns:** Maximum compression on every column — insert throughput drops 10x, storage savings over level 3 are marginal (5-10%). Better: use ZSTD level 1-3 for most columns, reserve higher levels for archival partitions.
- **Gorilla on Integer Columns:** Gorilla optimized for XOR of floating-point values — for integers, Delta + LZ4 compresses better and decompresses faster. Better: use Delta + LZ4 for integers, Gorilla only for Float/Float64.
- **No Codecs on Timestamps:** Leaving timestamps with default LZ4 — DoubleDelta compresses to 2-5 bytes/value vs 8 bytes (40-60% savings). Better: always apply DoubleDelta or Delta codec to timestamp columns.

---

## Failure Modes

- **Single Codec for Entire Table:** Same codec applied to every column — storage optimization left on the table. Mitigation: analyze each column's data pattern and select codec individually.
- **Codecs on Primary Key Columns:** Heavy compression on ORDER BY key columns — ClickHouse reads these first for index analysis, decompression overhead slows all queries. Mitigation: use LZ4 or no codec on ORDER BY key columns.
- **No Codec at All:** Default table-level compression with no per-column optimization — storage costs 40-60% higher than necessary. Mitigation: review column types and apply appropriate codecs at table creation.

---

## Ecosystem Usage

ClickHouse codec configuration is set at the database schema level, not in Laravel application code. When using `laravel-clickhouse` or `pg_clickhouse` FDW, codecs are configured in ClickHouse CREATE TABLE statements. The ETL Manifesto or dbt models define the ClickHouse schema including codec selections. Codec optimization is typically done by the data engineering team managing the ClickHouse instance.

---

## Related Knowledge Units

### Prerequisites
- ClickHouse MergeTree — The table engine where codecs are configured

### Related Topics
- AggregatingMergeTree — Codec optimization for pre-aggregated tables
- Warehouse Cost Optimization — Storage cost reduction through codec selection

### Advanced Follow-up Topics
- Projections vs Materialized Views — Impact of projections on storage and codec strategy

---

## Research Notes

ClickHouse's per-column codec granularity is unique among analytical databases — most systems only offer table-level compression. The ability to combine codecs (e.g., DoubleDelta + LZ4) enables optimized storage for specific data patterns. The most impactful optimization is applying DoubleDelta to timestamp columns and using ZSTD for rarely-queried data while keeping LZ4 for hot-path columns.
