# Anti-Patterns: SCD Type 1/2 Dimension Handling in Laravel Star-Schema

## All Columns Type 2
Every dimension attribute uses Type 2 tracking. Phone number changes, address changes, and marketing preference changes all create new dimension versions. The dimension table explodes to 10x the natural key count.

**Solution:** Analyze each attribute's impact on historical reporting. Only Type 2-track attributes that change analytical results.

## No Surrogate Keys with Type 2
Facts store the natural key + effective date instead of a surrogate key. Every fact query requires a BETWEEN join on the effective date range. Queries are slow and complex.

**Solution:** Generate surrogate keys. The fact stores the surrogate key for the dimension version. Joins are simple FK lookups.

## Overlapping Type 2 Rows
ETL creates overlapping effective date ranges for the same natural key. Historical fact attribution is ambiguous — some queries return both rows, some return neither.

**Solution:** Enforce exclusive end dates. Set the previous row's expiry_date = new row's effective_date. No overlap is allowed.

## Type 2 on Rapidly Changing Attributes
Stock prices, real-time inventory levels, or CPU utilization tracked as Type 2. The dimension table grows by millions of rows per day. Query performance degrades.

**Solution:** Move rapidly changing values to fact tables or periodic snapshots. Dimensions are for attributes that change slowly.

## Ignoring SCD During Initial Design
Dimensions are created without SCD planning. After 6 months of production, analysts realize that all historical data has incorrect attribute attribution. A painful backfill project is required.

**Solution:** Plan SCD strategy before building any dimension table. The SCD type for each attribute is a design decision, not an afterthought.
