# Decomposition: OHLCV Candle Upsert Pattern for Time-Series Data

## Topic Overview
The OHLCV (Open, High, Low, Close, Volume) candle upsert pattern efficiently maintains rolling time-series aggregations in a single database operation. Instead of SELECT+INSERT+UPDATE cycles for each new data point, a single `INSERT ... ON CONFLICT DO UPDATE` (PostgreSQL) or `INSERT ...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k021-ohlcv-candle-upsert/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### OHLCV Candle Upsert Pattern for Time-Series Data
- **Purpose:** The OHLCV (Open, High, Low, Close, Volume) candle upsert pattern efficiently maintains rolling time-series aggregations in a single database operation.
- **Difficulty:** Intermediate
- **Dependencies:** K010 (Reverb WebSocket): Real-time broadcast of candle updates to clients, K016 (ClickHouse Materialized Views): Alternative to upsert for candle aggregation, K026 (Write Amplification): Multi-granularity upsert increases write amplification, K024 (AggregatingMergeTree): State-based aggregation as alternative to upsert

## Dependency Graph
**Depends on:**
- K010 (Reverb WebSocket): Real-time broadcast of candle updates to clients
- K016 (ClickHouse Materialized Views): Alternative to upsert for candle aggregation
- K026 (Write Amplification): Multi-granularity upsert increases write amplification
- K024 (AggregatingMergeTree): State-based aggregation as alternative to upsert

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- OHLCV candle:
- Upsert semantics:
- Time bucketing:
- Rolling window update:
- ReplacingMergeTree (ClickHouse):
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K010 (Reverb WebSocket): Real-time broadcast of candle updates to clients, K016 (ClickHouse Materialized Views): Alternative to upsert for candle aggregation, K026 (Write Amplification): Multi-granularity upsert increases write amplification, K024 (AggregatingMergeTree): State-based aggregation as alternative to upsert

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