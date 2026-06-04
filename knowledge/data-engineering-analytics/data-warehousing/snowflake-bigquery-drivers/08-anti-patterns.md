# Anti-Patterns: Snowflake/BigQuery Eloquent Driver Setup and Migration Support

## Eloquent all() on Warehouse
Calling `Model::all()` on a Snowflake/BigQuery-backed model with millions of rows. Every row is fetched into PHP memory. The query scans gigabytes of data and costs $10-100+.

**Solution:** Always use LIMIT, WHERE, and explicit column selection. Never call `all()` on warehouse-backed models without filters.

## Single-Row INSERT Loop
Writing individual events via `Event::create($data)` inside a foreach loop. Each iteration issues a separate INSERT statement. 100K events = 100K warehouse queries.

**Solution:** Use `Model::insert($batch)` for batch inserts or use the warehouse's streaming ingestion API directly.

## Lazy Loading Relationships
A dashboard loads 100 users and then iterates `$user->orders` to display order counts. 101 warehouse queries: 1 for users, 100 for orders. Each orders query scans the full orders table.

**Solution:** Eager load with `User::withCount('orders')` or use a subquery to compute counts in a single query.

## No Caching for Dashboards
Every dashboard page load executes 5-10 warehouse queries. A dashboard with 100 daily active users generates 500-1000 warehouse queries per day. Monthly warehouse costs are unexpectedly high.

**Solution:** Cache dashboard results. Use Redis with 60-300 second TTL for active dashboards. Pre-compute overnight for daily reports.

## Cross-Connection Eloquent Relationships
`WarehouseOrder` belongsTo `LocalCustomer` across Snowflake and PostgreSQL connections. Lazy loading attempts to query Snowflake first and PostgreSQL second, but the connections don't coordinate.

**Solution:** Query the warehouse for order data, collect customer IDs, batch-query PostgreSQL for customer data, and merge in application code.
