# Decomposition: ClickHouse AggregatingMergeTree + State/Merge Functions

## Topic Overview
ClickHouse's AggregatingMergeTree engine pre-aggregates data at insert time by storing intermediate aggregation states (not final values) and merging them during background merges. Combined with `-State` and `-Merge` combinator functions, this enables continuous, incremental aggregation without data loss or duplicate counting — ideal for real-time dashboards, rollup tables, and time-series analytics where raw data arrives continuously and queries must return instantly.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k024-aggregating-mergetree/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### ClickHouse AggregatingMergeTree + State/Merge Functions
- **Purpose:** ClickHouse's AggregatingMergeTree engine pre-aggregates data at insert time by storing intermediate aggregation states (not final values) and merging them during background merges.
- **Difficulty:** Intermediate
- **Dependencies:** K016 (ClickHouse Materialized Views): The MV mechanism that feeds AggregatingMergeTree tables, K026 (Write Amplification): AMT background merges contribute to write amplification in MV chains, K031 (Projections vs MVs): Projections as an alternative to MVs + AMT for pre-aggregation, K012 (ClickHouse MergeTree): Base engine that AMT extends

## Dependency Graph
**Depends on:**
- K016 (ClickHouse Materialized Views): The MV mechanism that feeds AggregatingMergeTree tables
- K026 (Write Amplification): AMT background merges contribute to write amplification in MV chains
- K031 (Projections vs MVs): Projections as an alternative to MVs + AMT for pre-aggregation
- K012 (ClickHouse MergeTree): Base engine that AMT extends

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- AggregatingMergeTree (AMT):
- State combinator:
- Merge combinator:
- Materialized view + AMT pattern:
- Idempotent merges:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K016 (ClickHouse Materialized Views): The MV mechanism that feeds AggregatingMergeTree tables, K026 (Write Amplification): AMT background merges contribute to write amplification in MV chains, K031 (Projections vs MVs): Projections as an alternative to MVs + AMT for pre-aggregation, K012 (ClickHouse MergeTree): Base engine that AMT extends

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