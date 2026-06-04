# Decomposition: Custom ClickHouse Codec Selection (LZ4, ZSTD, Delta, DoubleDelta, Gorilla)

## Topic Overview
ClickHouse allows per-column compression codecs — not just table-level compression. This granular control enables optimizing storage-compression-ratio vs query-speed independently for each column type. Integer timestamps compress well with DoubleDelta (2-5 bytes per value), monetary values with Gorilla (scientific notation pattern), and arbitrary text with ZSTD (best general ratio).

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k035-clickhouse-codecs/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Custom ClickHouse Codec Selection (LZ4, ZSTD, Delta, DoubleDelta, Gorilla)
- **Purpose:** ClickHouse allows per-column compression codecs — not just table-level compression.
- **Difficulty:** Intermediate
- **Dependencies:** K012 (ClickHouse MergeTree): Base table engine where codecs are applied, K024 (AggregatingMergeTree): Codec considerations for pre-aggregated tables, K031 (Projections vs Materialized Views): Codec implications for projection vs base table

## Dependency Graph
**Depends on:**
- K012 (ClickHouse MergeTree): Base table engine where codecs are applied
- K024 (AggregatingMergeTree): Codec considerations for pre-aggregated tables
- K031 (Projections vs Materialized Views): Codec implications for projection vs base table

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- LZ4:
- ZSTD:
- Delta:
- DoubleDelta:
- Gorilla:
- T64:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K012 (ClickHouse MergeTree): Base table engine where codecs are applied, K024 (AggregatingMergeTree): Codec considerations for pre-aggregated tables, K031 (Projections vs Materialized Views): Codec implications for projection vs base table

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