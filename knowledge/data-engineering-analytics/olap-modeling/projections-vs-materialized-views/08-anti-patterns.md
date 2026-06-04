# Anti-Patterns: ClickHouse Projections vs Materialized Views

## MV for Simple ORDER BY Change
A materialized view is created to sort data by a different column. The MV adds write amplification, separate storage, and requires manual query routing. A projection would do this automatically.

**Solution:** Use projections for alternative sort orders. They are maintained synchronously and automatically used by the optimizer.

## Cascading MV Chains
MV1 → TableA, MV2 (on TableA) → TableB. Each insert triggers MV1 write, then MV2 write. Write amplification is 3x+.

**Solution:** Flatten the chain. Create a single MV that does both transformations, or use projections for the first hop.

## Both Projection and MV for Same Aggregation
A projection aggregates by hour and a separate MV also aggregates by hour. Storage is consumed twice. Query optimizer behavior is unpredictable.

**Solution:** Choose one mechanism. Remove the other. Document which was kept and why.

## Projections Without EXPLAIN Verification
A projection is created but the query optimizer never uses it. Queries continue scanning the full table. The projection consumes storage without providing any performance benefit.

**Solution:** Always run `EXPLAIN SELECT ...` after creating a projection. Verify the optimizer selects the projection for the target query pattern.

## Ignoring WAL-Backed MVs
Using trigger-based MVs on ClickHouse versions that support WAL-backed MVs. Write amplification is unnecessarily high.

**Solution:** Upgrade ClickHouse and migrate to WAL-backed MVs for new transformations. WAL-backed MVs reduce write amplification by 50%+.
