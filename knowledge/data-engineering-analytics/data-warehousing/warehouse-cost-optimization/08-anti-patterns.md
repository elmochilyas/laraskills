# Anti-Patterns: Snowflake/BigQuery/Redshift Cost Optimization at Scale

## No Cost Monitoring
Monthly warehouse cost is not tracked. The bill has grown 5x over 6 months without anyone noticing. The first sign of a problem is a finance escalation.

**Solution:** Set up cost monitoring dashboards and alerts from day one. Review warehouse costs weekly.

## SELECT * on Large Tables
Eloquent queries without explicit column selection against warehouse tables. A 500-column analytics table is fully scanned on every query. 80% of scanned bytes are for columns never used.

**Solution:** Always use `->select()` to specify required columns. Create model `$select` defaults for warehouse-backed models.

## Leaving Warehouses Running
Development and staging warehouses run 24/7. They are used for 2 hours/day but accumulate credits for 24 hours/day.

**Solution:** Enable auto-suspend (1 minute for dev). Use scheduled start/stop for predictable workloads.

## No Caching on Frequently Accessed Dashboards
A company-wide dashboard showing daily revenue refreshes on every page load. 500 employees view it 5 times/day. The same 5TB aggregation query executes 2500 times/day.

**Solution:** Cache the dashboard result with a short TTL. The warehouse query executes once per TTL period instead of once per user.

## Ignoring Query Result Cache
Snowflake automatically caches query results for 24 hours for identical queries. But each dashboard widget generates a slightly different query (different timestamp, different user context), missing the cache.

**Solution:** Normalize query parameters. Use deterministic date ranges (CURRENT_DATE, CURRENT_MONTH) instead of absolute dates. This maximizes Snowflake result cache hits.
