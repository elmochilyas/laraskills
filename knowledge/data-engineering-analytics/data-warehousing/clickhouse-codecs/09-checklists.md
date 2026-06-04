# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 04-data-warehousing
**Knowledge Unit:** clickhouse-codecs
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Per-column codec selection understood — not just table-level compression
- [ ] Codec chosen per data type: LZ4 for speed, ZSTD for ratio, DoubleDelta for timestamps, Gorilla for floats
- [ ] Integer timestamp columns use DoubleDelta (2-5 bytes per value)
- [ ] Monetary/float columns use Gorilla (scientific notation pattern)
- [ ] Arbitrary text columns use ZSTD (best general compression ratio)
- [ ] T64 codec evaluated for monotonically increasing integer sequences

---

# Architecture Checklist

- [ ] Codec selection optimized per column based on data type and access pattern
- [ ] MergeTree base engine where codecs are applied (K012 integration)
- [ ] AggregatingMergeTree codec considerations pre-aggregated tables (K024)
- [ ] Projection table codecs match or exceed base table codec ratio (K031)
- [ ] Codec decisions documented per table in ClickHouse schema repository
- [ ] Codec tested on realistic data volume before production deployment

---

# Implementation Checklist

- [ ] CREATE TABLE statement includes per-column CODEC clause, not ENGINE-level default
- [ ] Timestamp column defined with CODEC(DoubleDelta, LZ4) for high-compression temporal data
- [ ] Float/decimal column defined with CODEC(Gorilla, LZ4) for monetary/sensor data
- [ ] String column defined with CODEC(ZSTD) for variable-length text
- [ ] Integer key column with T64 for sequential IDs or monotonically increasing values
- [ ] LZ4 applied as fallback wrapper codec after specialized codec for all columns

---

# Performance Checklist

- [ ] Codec ratio (uncompressed / compressed) measured per column on representative data
- [ ] DoubleDelta vs LZ4-only benchmarked for timestamp columns
- [ ] Gorilla vs ZSTD benchmarked for float columns
- [ ] Read performance penalty measured — high compression reduces scan speed
- [ ] Write performance penalty measured — DoubleDelta/Gorilla use more CPU on insert
- [ ] Codec chosen balances storage savings against query speed per column access pattern

---

# Security Checklist

- [ ] Compressed column data not accessible in plaintext through ClickHouse file access
- [ ] Codec choice does not affect column-level access controls
- [ ] Sensitive columns compressed with at least LZ4 baseline (no plaintext storage)
- [ ] ClickHouse data encryption at rest applied independently of codec selection
- [ ] Codec configuration version-controlled and reviewed

---

# Reliability Checklist

- [ ] Codec change tested on replica before production — column ALTER validated
- [ ] Rollback plan for codec change if performance degrades (ALTER MODIFY CODEC)
- [ ] Codec compatibility verified across ClickHouse version upgrades
- [ ] Projection table codecs rebuild after codec change on base table
- [ ] Merge behavior unaffected by codec (merge works on compressed blocks)

---

# Testing Checklist

- [ ] Test codec compression ratio matches expectations on production-like data
- [ ] Test codec read performance (SELECT speed) vs uncompressed baseline
- [ ] Test codec write performance (INSERT throughput) vs uncompressed baseline
- [ ] Test ALTER MODIFY CODEC succeeds without data loss
- [ ] Test projection codec matches base table after rebuild
- [ ] Test data round-trip through codec — decompression produces identical original

---

# Maintainability Checklist

- [ ] Codec selection documented in table schema comments
- [ ] Codec benchmark results archived alongside table DDL
- [ ] Codec changes reviewed and tested in staging before production ALTER
- [ ] Table creation script templates include recommended codecs per data type
- [ ] Codec best practices referenced in data modeling onboarding documentation

---

# Anti-Pattern Prevention Checklist

- [ ] Do not apply ZSTD to every column — LZ4 is faster for frequently scanned columns
- [ ] Do not use Gorilla on non-float data — only works well with scientific notation pattern
- [ ] Do not skip benchmarking — codecs behave differently on different data distributions
- [ ] Do not change codec on production without staging validation
- [ ] Do not forget fallback codec — DoubleDelta needs LZ4 or ZSTD as outer layer

---

# Production Readiness Checklist

- [ ] Prometheus metric for compression ratio per table (system.parts column_data_compressed_bytes)
- [ ] Logged warning if compression ratio drops >20% after codec change
- [ ] Alert if query scan speed degrades by >25% after codec change
- [ ] Codec change runbook documented with ALTER MODIFY CODEC syntax
- [ ] Deploy checklist includes codec validation step on staging data
- [ ] MergeTree table compression monitored in ClickHouse dashboard

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: per-column codecs, MergeTree/AggregatingMergeTree alignment, projection consistency
- [ ] Security requirements satisfied: column compression prevents plaintext, access controls independent of codec
- [ ] Performance requirements satisfied: codec ratio measured per column, read/write penalty benchmarked
- [ ] Testing requirements satisfied: compression ratio, read/write speed, ALTER MODIFY, round-trip integrity
- [ ] Anti-pattern checks passed: no blanket ZSTD, no Gorilla on ints, benchmarking done, fallback codec present
- [ ] Production readiness verified: compression ratio metrics, query speed alerts, codec change runbook

---

# Related References

- K012 (ClickHouse MergeTree): Base table engine where codecs are applied
- K024 (AggregatingMergeTree): Codec considerations for pre-aggregated tables
- K031 (Projections vs Materialized Views): Codec implications for projection vs base table
