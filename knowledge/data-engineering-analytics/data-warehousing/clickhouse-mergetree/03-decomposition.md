# Decomposition: ClickHouse MergeTree Engine Configuration

## Topic Overview
ClickHouse's MergeTree engine family is the foundation of its analytical performance. Unlike MySQL/PostgreSQL B-tree indexes optimized for point lookups, MergeTree uses a columnar storage format with sparse primary indexes, partition pruning, and merge sort-based compaction. Configuration of `ORDER BY`, `PARTITION BY`, `PRIMARY KEY`, `TTL`, and `SETTINGS` (granularity, compression) directly determines query performance, storage efficiency, and write throughput.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k012-clickhouse-mergetree/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### ClickHouse MergeTree Engine Configuration
- **Purpose:** ClickHouse's MergeTree engine family is the foundation of its analytical performance.
- **Difficulty:** Foundation
- **Dependencies:** K006 (Star Schema): ClickHouse table design for star-schema patterns, K016 (ClickHouse Materialized Views): MVs on MergeTree tables, K024 (AggregatingMergeTree): Advanced MergeTree variant for pre-aggregation, K035 (ClickHouse Codecs): Compression codec selection with MergeTree

## Dependency Graph
**Depends on:**
- K006 (Star Schema): ClickHouse table design for star-schema patterns
- K016 (ClickHouse Materialized Views): MVs on MergeTree tables
- K024 (AggregatingMergeTree): Advanced MergeTree variant for pre-aggregation
- K035 (ClickHouse Codecs): Compression codec selection with MergeTree

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- MergeTree table:
- ORDER BY key:
- PARTITION BY:
- PRIMARY KEY:
- Merge behavior:
- TTL (Time-To-Live):
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K006 (Star Schema): ClickHouse table design for star-schema patterns, K016 (ClickHouse Materialized Views): MVs on MergeTree tables, K024 (AggregatingMergeTree): Advanced MergeTree variant for pre-aggregation, K035 (ClickHouse Codecs): Compression codec selection with MergeTree

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization