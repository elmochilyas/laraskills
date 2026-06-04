# Decomposition: ClickHouse Materialized View Trigger Model

## Topic Overview
ClickHouse materialized views are trigger-based data transformation pipelines, not traditional SQL views. A `TO` materialized view captures data blocks as they're inserted into a source table (MergeTree), applies a transformation query, and writes the results to a separate target table. This enables real-time ETL: raw event data is automatically aggregated, filtered, or transformed into analytics-optimized tables at insert time without batch jobs, making it the backbone of real-time analytics in Laravel + ClickHouse architectures.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k016-clickhouse-materialized-views/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### ClickHouse Materialized View Trigger Model
- **Purpose:** ClickHouse materialized views are trigger-based data transformation pipelines, not traditional SQL views.
- **Difficulty:** Intermediate
- **Dependencies:** K024 (AggregatingMergeTree): Commonly used as MV target for state-based aggregation, K026 (Write Amplification): MVs are the primary source of write amplification, K031 (Projections vs MVs): Alternative to MVs for certain pre-aggregation patterns, K017 (Kafka CDC): Kafka feeds raw event tables that MVs consume, K021 (OHLCV Candle Upsert): Real-time aggregation pattern using upsert instead of MVs

## Dependency Graph
**Depends on:**
- K024 (AggregatingMergeTree): Commonly used as MV target for state-based aggregation
- K026 (Write Amplification): MVs are the primary source of write amplification
- K031 (Projections vs MVs): Alternative to MVs for certain pre-aggregation patterns
- K017 (Kafka CDC): Kafka feeds raw event tables that MVs consume
- K021 (OHLCV Candle Upsert): Real-time aggregation pattern using upsert instead of MVs

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- TO (Target) Materialized View:
- POPULATE clause:
- Block-level triggers:
- Transform-on-write:
- Cascading MVs:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K024 (AggregatingMergeTree): Commonly used as MV target for state-based aggregation, K026 (Write Amplification): MVs are the primary source of write amplification, K031 (Projections vs MVs): Alternative to MVs for certain pre-aggregation patterns, K017 (Kafka CDC): Kafka feeds raw event tables that MVs consume, K021 (OHLCV Candle Upsert): Real-time aggregation pattern using upsert instead of MVs

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