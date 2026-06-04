# Anti-Patterns: ClickHouse Materialized View Trigger Model

## POPULATE in Production
MV is created with POPULATE in production. During POPULATE, concurrent inserts go to the source table but are missed by the MV. The target table has a permanent data gap.

**Solution:** Create MVs without POPULATE. Backfill historical data using INSERT INTO target SELECT ... with specific date ranges.

## Cascading MV Chains
Three MVs chained: Source → MV1 → Agg1 → MV2 → Agg2. Every insert generates 3 writes. MV2 lag prevents Agg2 updates even when Agg1 is current.

**Solution:** Flatten MV chains. Use refreshable materialized views for downstream aggregations if real-time consistency is not required.

## MV Target With Source ORDER BY
Source table ORDER BY is (timestamp, event_id). MV target ORDER BY uses the same key. But dashboards query by (site_id, date). Queries against the MV target are slow.

**Solution:** Design target table ORDER BY for dashboard query patterns, not source table patterns.

## No Backfill Plan
MV is created without a backfill process. Historical data before MV creation is never processed. Dashboards have incomplete data.

**Solution:** Create a documented backfill process. Run backfill immediately after MV creation using INSERT INTO target SELECT ... with date range filters.

## Ignoring Write Amplification
Ten MVs are created on a single source table. Each insert generates 10 writes. Write throughput drops to 10%. Parts accumulate faster than merges.

**Solution:** Limit MVs per source table. Consolidate transformations. Monitor write amplification factor.
