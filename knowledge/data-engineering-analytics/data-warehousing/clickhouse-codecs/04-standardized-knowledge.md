# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 04-data-warehousing
**Knowledge Unit:** clickhouse-codecs
**Difficulty:** Intermediate
**Category:** Storage Optimization
**Last Updated:** 2026-06-03

---

# Overview

ClickHouse allows per-column compression codecs — not just table-level compression. This granular control enables optimizing storage-compression-ratio vs query-speed independently for each column type. Integer timestamps compress well with DoubleDelta (2-5 bytes per value), monetary values with Gorilla (scientific notation pattern), and arbitrary text with ZSTD (best general ratio).

The engineering insight is that column compression in ClickHouse is not just about saving disk space — it directly impacts query performance. A well-chosen codec reduces the amount of data that must be read from disk during a query, making scans faster. A poorly chosen codec increases CPU decompression time without meaningful space savings.

Engineers must care because storage costs for analytics pipelines grow linearly with data retention. Choosing the right codec mix can reduce storage by 60-80% while improving query performance.

---

# Core Concepts

## LZ4

The default codec. Extremely fast compression and decompression with moderate compression ratios (2-3x). Best for columns that are queried frequently where decompression speed matters more than storage ratio.

## ZSTD

Best general-purpose compression ratio (3-8x) with configurable compression level (1-22). Higher levels compress better but use more CPU during insert. Decompression speed is comparable to LZ4 for levels 1-3. Best for columns that are stored but rarely scanned.

## Delta

Stores the difference between consecutive values rather than the values themselves. Works well for monotonically increasing values (timestamps, auto-increment IDs). Typically combined with LZ4 or ZSTD.

## DoubleDelta

Stores the delta of deltas for timestamp columns. Compresses sequential timestamps to 2-5 bytes per value. Best for regularly-spaced timestamps. Irregular timestamps may not benefit.

## Gorilla

Optimized for floating-point values that change slowly (monitoring metrics, financial data). Based on Facebook's Gorilla TSDB compression. Stores floating-point values as XOR of consecutive values.

---

# When To Use

- High-volume analytics tables where storage cost is a concern
- Tables with long data retention periods (multiple years)
- Columns with predictable data patterns (timestamps, counters, enums)
- Tables with infrequently queried historical data
- Cost-optimization initiatives in ClickHouse deployments

---

# When NOT To Use

- Small tables (< 1M rows) — codec overhead exceeds benefit
- Columns that are always used in WHERE clauses — decompression cost may exceed I/O savings
- Random/uncompressed data — compression may increase size
- Prototype/development environments — default LZ4 is sufficient

---

# Best Practices

## Test Before Deploying

Always test codec combinations on a representative data sample before deploying to production. Compare compressed size, insert speed, and query speed.

## Combine Delta with LZ4 or ZSTD

Delta codecs should be combined with a compression codec: `CODEC(DoubleDelta, LZ4)` for timestamps. Delta reduces value range; the compression codec compresses the result.

## Use LZ4 for Hot Data, ZSTD for Cold

Frequently queried columns should use LZ4 (fast decompression). Historical/archival columns can use ZSTD level 3-6 (better compression, acceptable decompression speed).

## Apply Codecs in CREATE TABLE

Define codecs at table creation time. Changing codecs on existing tables requires `ALTER TABLE MODIFY COLUMN ... CODEC` which rewrites the column data.

---

# Architecture Guidelines

## Codec Selection by Data Type

| Data Type | Recommended Codec | Alternative |
|-----------|------------------|-------------|
| DateTime / Date | DoubleDelta, LZ4 | Delta, ZSTD |
| Integer (auto-increment) | Delta, LZ4 | ZSTD |
| Integer (arbitrary) | LZ4 | ZSTD |
| Float / Decimal | Gorilla, LZ4 | ZSTD |
| String (short) | LZ4 | ZSTD |
| String (long) | ZSTD | LZ4 |
| Enum / LowCardinality | LZ4 | ZSTD |
| UUID | LZ4 | ZSDT |

## Storage Tier Strategy

Implement tiered codec strategy: LZ4 for recent partitions (hot), ZSTD level 3 for medium-age partitions, ZSTD level 6 for old partitions (cold). Use TTL + `ALTER TABLE MODIFY COLUMN` to transition codecs as data ages.

---

# Performance Considerations

- LZ4 decompression is ~2.5 GB/s/core; ZSTD decompression is ~1 GB/s/core.
- DoubleDelta on regular timestamps: 2-5 bytes/value vs 8 bytes uncompressed.
- Gorilla on stable floats: 4-8 bytes/value vs 8 bytes uncompressed.
- Higher ZSTD levels (10+) are rarely worth the insert-time CPU cost in analytics pipelines.
- Codec decompression happens during query, not during insert. Insert performance impact is usually acceptable.

---

# Security Considerations

- Compression is not encryption. Data stored with any codec is not protected from unauthorized disk access.
- Codecs operate transparently — application code does not need to know which codec is used.
- Custom codecs are not supported in ClickHouse. Use only built-in codecs.

---

# Common Mistakes

## Mistake: ZSTD Level 22 on All Columns

Using maximum ZSTD compression on every column. Insert throughput drops 10x. Storage savings over ZSTD level 3 are marginal (5-10%). Decompression speed is significantly slower.

**Better approach:** Use ZSTD level 1-3 for most columns. Reserve higher levels for archival partitions only.

## Mistake: Gorilla on Integer Columns

Applying Gorilla codec to integer columns. Gorilla is optimized for XOR of floating-point values. For integers, Delta + LZ4 compresses better and decompresses faster.

**Better approach:** Use Delta + LZ4 for integer sequences, Gorilla only for Float/Float64 columns.

## Mistake: No Codecs on Timestamps

Leaving timestamps with default LZ4 codec. A DateTime column with DoubleDelta compresses to 2-5 bytes/value instead of 8 bytes — a 40-60% space savings with identical query performance.

**Better approach:** Always apply DoubleDelta or Delta codec to timestamp columns.

---

# Anti-Patterns

## Single Codec for the Entire Table
Applying the same codec to every column. Text columns get the same codec as timestamps and identifiers. Storage optimization is left on the table.

**Solution:** Analyze each column's data pattern and select codec individually.

## Codecs on Primary Key Columns
Applying heavy compression (ZSTD level 6+) to ORDER BY key columns. ClickHouse reads these columns first for index analysis. Decompression overhead slows down every query.

**Solution:** Use LZ4 or no codec on ORDER BY key columns. Reserve ZSTD for non-key columns.

## No Codec at All
Using the default table-level compression with no per-column codec optimization. Storage costs are 40-60% higher than necessary. Query performance is not optimized for column access patterns.

**Solution:** Review column types and apply appropriate codecs at table creation.
