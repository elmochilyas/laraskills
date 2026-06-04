# Rules: ClickHouse Materialized View Trigger Model

## Rule CMV-01: Target Table First
MV target tables MUST be created before the MV. The target table's schema, partition key, ORDER BY, and codecs must be explicitly defined.

## Rule CMV-02: No POPULATE in Production
Materialized views MUST NOT use POPULATE in production. Backfill historical data separately after MV creation.

## Rule CMV-03: One MV Chain Deep
Cascading MVs (MV → Table → MV) MUST be avoided. Each cascade doubles write amplification.

## Rule CMV-04: Target ORDER BY for Query Patterns
MV target table ORDER BY MUST be designed for the target's query patterns, not inherited from the source table.

## Rule CMV-05: Monitor Target Part Count
MV target table part count MUST be monitored. Each MV insert creates a part. Excessive parts indicate merge lag.

## Rule CMV-06: Test MV Query Performance
MV SELECT queries MUST be tested with EXPLAIN. Slow MV queries block source table inserts.

## Rule CMV-07: Document MV Source and Target
Every MV MUST document its source table, target table, transformation logic, and lifecycle management plan.

## Rule CMV-08: Handle Source Table Changes
MV definitions that reference specific column names MUST be updated when source table schema changes.

## Rule CMV-09: Consider WAL-Backed MVs
ClickHouse 24.8+ SHOULD use WAL-backed MVs for new transformations to reduce write amplification.

## Rule CMV-10: MV Doesn't Backfill
MVs only process data inserted after creation. Historical data must be backfilled separately as a documented process.
