# Anti-Patterns: Write Amplification in ClickHouse MV Chains

## Ignoring Amplification
MVs and projections are added without tracking write amplification. Insert throughput degrades over time. The cause is invisible because amplification is not monitored.

**Solution:** Measure and track write amplification. Alert on thresholds. Budget amplification per table.

## Cascading MV Chain of Three
Three MVs in sequence: Source → MV1 → Agg1 → MV2 → Agg2 → MV3 → Agg3. Amplification factor: 3x (MVs) × 3x (replication) = 9x. Insert throughput is 10% of baseline.

**Solution:** Flatten to one MV. Use refreshable MVs or scheduled jobs for downstream aggregations.

## Five MVs on One Source Table
A source table has 5 materialized views for different aggregation patterns. Each insert generates 5 target table writes. Amplification: 5x + replication.

**Solution:** Consolidate MVs. Create one MV with all aggregation columns. Use different SELECT patterns in queries.

## Using MVs for Alternative Sort Orders
Two MVs created just to have data sorted differently. Projections would achieve the same with ~30% lower amplification.

**Solution:** Replace MVs with projections for alternative sort orders. Projections are synchronously maintained with lower overhead.

## No Monitoring of Merge Queue
Amplification creates excessive small parts. Merge queue grows. Parts accumulate. Query performance degrades. Storage usage increases due to uncompacted parts.

**Solution:** Monitor `system.merges` and part counts. Increase merge threads if merges fall behind.
