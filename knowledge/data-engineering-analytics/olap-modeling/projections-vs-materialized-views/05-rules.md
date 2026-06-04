# Rules: ClickHouse Projections vs Materialized Views vs Refreshable MVs

## Rule PMV-01: Preference for Projections
Simple aggregation pre-computation MUST use projections by default. MVs are reserved for transformations that projections cannot express (JOINs, subqueries).

## Rule PMV-02: No Cascading MV Chains
Materialized view chains deeper than one hop MUST NOT be created. Each hop increases write amplification and consistency risk.

## Rule PMV-03: Test Projection Selection
Query optimizer projection selection MUST be verified with EXPLAIN. If the optimizer does not select the projection, the query or projection design needs adjustment.

## Rule PMV-04: Monitor MV Lag
Materialized view lag MUST be monitored. Alert when lag exceeds acceptable freshness thresholds.

## Rule PMV-05: Limit Projections on High-Insert Tables
Tables with > 100K inserts/second MUST have at most 2 projections. More projections degrade write throughput.

## Rule PMV-06: Refreshable MVs for Periodic Aggregations
Refreshable MVs MUST be used for periodic, non-real-time aggregations. Trigger-based MVs add unnecessary write amplification for batch-updated data.

## Rule PMV-07: No Duplicate Pre-Computation
The same pre-computation MUST NOT be implemented as both a projection and a materialized view. Choose one mechanism.

## Rule PMV-08: Document Selection Rationale
Every pre-computation decision MUST document why the mechanism (projection, MV, refreshable MV) was chosen and what alternatives were considered.

## Rule PMV-09: Isolate MV Target Lifecycle
MV target tables MUST have independent lifecycle configuration (TTL, partition, codecs). MVs should not inherit source table settings by default.

## Rule PMV-10: Projection for ORDER BY Variant
Alternative sort orders that differ from the main table ORDER BY MUST use projections. MVs add unnecessary complexity for this use case.
