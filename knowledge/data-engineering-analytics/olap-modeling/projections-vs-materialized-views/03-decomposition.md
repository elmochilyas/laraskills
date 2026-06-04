# Decomposition: ClickHouse Projections vs Materialized Views vs Refreshable MVs

## Topic Overview
ClickHouse offers three mechanisms for pre-computed data transformations: Projections (inline, table-scoped, synchronously maintained), Materialized Views (separate table, asynchronously maintained via trigger), and Refreshable Materialized Views (periodically rebuilt from SELECT query). Each solves a similar problem — reduce query time by pre-computing aggregations or transformations — with fundamentally different consistency, maintenance, and storage tradeoffs. Choosing between them is a critical architectural decision in ClickHouse-powered Laravel analytics pipelines.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k031-projections-vs-materialized-views/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### ClickHouse Projections vs Materialized Views vs Refreshable MVs
- **Purpose:** ClickHouse offers three mechanisms for pre-computed data transformations: Projections (inline, table-scoped, synchronously maintained), Materialized Views (separate table, asynchronously maintained via trigger), and Refreshable Materialized Views (periodically rebuilt from SELECT query).
- **Difficulty:** Intermediate
- **Dependencies:** K024 (AggregatingMergeTree): The primary target table type for TO MVs, K016 (ClickHouse Materialized Views): Trigger-based MV mechanics in detail, K026 (Write Amplification): MVs and projections are primary contributors, K012 (ClickHouse MergeTree): Base engine understanding required for all three mechanisms

## Dependency Graph
**Depends on:**
- K024 (AggregatingMergeTree): The primary target table type for TO MVs
- K016 (ClickHouse Materialized Views): Trigger-based MV mechanics in detail
- K026 (Write Amplification): MVs and projections are primary contributors
- K012 (ClickHouse MergeTree): Base engine understanding required for all three mechanisms

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Projection:
- Materialized View (TO):
- Refreshable Materialized View (2024+):
- WAL-backed Materialized View (2025+):
- Query optimization:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K024 (AggregatingMergeTree): The primary target table type for TO MVs, K016 (ClickHouse Materialized Views): Trigger-based MV mechanics in detail, K026 (Write Amplification): MVs and projections are primary contributors, K012 (ClickHouse MergeTree): Base engine understanding required for all three mechanisms

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