# Query Optimization Cost

## Metadata
- **ID**: KU-01-QUERY-OPTIMIZATION-COST
- **Subdomain**: database-cost-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Query Optimization Cost
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Optimizing database queries reduces CPU and memory usage on the database server, enabling smaller/cheaper instance sizes and reducing I/O costs. A single unoptimized query can consume 90% of database resources. For Laravel applications, N+1 queries (missing eager loading), missing indexes, and full table scans are the primary culprits. Every query optimized translates directly to lower database tier cost or more capacity on existing hardware.

## Core Concepts
- **N+1 query problem**: 1 query for parent + N queries for children = performance disaster
- **Full table scan**: Query without index scanning entire table; exponential cost for large tables
- **Query execution time**: Directly correlates to database CPU and I/O consumption
- **Slow query log**: MySQL/PostgreSQL log of queries exceeding threshold; primary tool for optimization
- **Query cost units**: Database resources consumed per query (CPU cycles + I/O operations + memory)
- **Laravel Debugbar**: Development tool showing query count and execution time per page load

## When To Use
- Query optimization: Any app with slow page loads, high database CPU, or N+1 queries
- Index optimization: Tables > 10K rows with frequent WHERE, JOIN, or ORDER BY queries
- N+1 detection: Any Eloquent relationship without eager loading in loops
- Slow query log: Production databases with CPU > 50% consistently
- Query monitoring: New Relic, Scout APM, or Laravel Telescope for query time tracking

## When NOT To Use
- Premature optimization: Don't optimize 1-2ms queries on 10-row tables (negligible impact)
- Ignoring application cache: Some queries are better avoided entirely (cache results)
- Over-indexing: Too many indexes slow writes (INSERT/UPDATE/DELETE) and increase storage cost
- Query optimization for reporting: Analytical queries on large datasets may need different approach (materialized views, data warehouse)

## Best Practices
- **Always eager load in loops**: Use `with()` in Blade/API resource to prevent N+1 (WHY: N+1 with 50 parents + 50 children = 51 queries vs 2 queries; each unnecessary query burns database CPU; at 100 req/s, saving 49 queries/req = 4900 fewer queries/sec)
- **Use Laravel Debugbar locally**: Check query count and time on every page during development (WHY: N+1 detection is invisible without tooling; Debugbar catches 90% of N+1 issues before they reach production)
- **Monitor slow query log**: Set `long_query_time = 0.5` (MySQL) or `log_min_duration = 500` (PostgreSQL) (WHY: queries taking >500ms are the 1% that cause 90% of database load; each slow query fixed can reduce database CPU by 20-50%)
- **SELECT only needed columns**: Use `->select(['id', 'name', 'email'])` instead of `select *` (WHY: `SELECT *` transfers all columns; for a table with 50 columns where 3 are needed, 94% of data transferred is wasted; adds I/O and network cost)
- **Use chunks for large datasets**: `User::chunk(100, function($users) { ... })` for batch processing (WHY: loading 100K users in one query consumes 500MB+ PHP memory and database buffer; chunking uses 5MB memory and reduces peak database load)
- **Avoid WHERE IN with subqueries**: Use JOIN or `whereExists` instead (WHY: `WHERE id IN (SELECT ...)` in MySQL is poorly optimized; often creates temporary table; `JOIN` or `EXISTS` performs better)

## Architecture Guidelines
- Set up slow query log on all production databases
- Use Laravel Telescope or Scout APM for query monitoring in production
- Implement database query count budget: < 10 queries per page load (target), < 20 (warning)
- Profile with EXPLAIN on any query taking > 100ms
- Use read replicas for reporting/analytical queries
- Archive old data to reduce table size (smaller tables = faster queries)

## Performance Considerations
- N+1 at 100 parents + 5 children each: 501 queries in 1000ms vs 2 queries in 5ms (200x improvement)
- Missing index on 1M row table: full scan ~500ms vs index scan ~2ms (250x improvement)
- SELECT * instead of needed columns: 5x I/O overhead for typical Laravel table (50 columns, 10 needed)
- Each unnecessary query = database CPU cycle = lower capacity for real traffic

## Security Considerations
- Slow queries can be exploited for denial-of-service (trigger expensive queries)
- Query logging may expose data patterns; mask sensitive query parameters in logs
- Use read replicas for heavy queries to avoid impacting write performance
- Rate limit query-heavy endpoints to prevent accidental database overload

## Common Mistakes
1. **N+1 queries in production**: Loading related models in Blade loop without eager loading (Cause: not checking query count in development; Consequence: 50+ queries per page load; database CPU at 80%+; Better: use Debugbar in dev, monitor query count)
2. **Missing indexes on join columns**: Joining on columns without indexes (Cause: indexes added only on primary/foreign keys; Consequence: full table scan on JOIN tables; Better: add indexes on all columns used in WHERE, JOIN, and ORDER BY clauses)
3. **SELECT * on large tables**: Retrieving all 80 columns when 3 are needed (Cause: Laravel `->get()` defaults to `SELECT *`; Consequence: 10x data transfer, 5x memory usage; Better: use `->select(['id', 'name'])`)

## Anti-Patterns
- **Lazy loading in production**: No caching of repeated queries; each page load queries fresh
- **Over-fetching in API resources**: API Resource loads all relationships even when not requested
- **No pagination on list endpoints**: Loading 100K records into memory for a listing page

## Examples
- **Before**: `$posts = Post::all(); foreach($posts as $post) { echo $post->author->name; }` (N+1)
- **After**: `$posts = Post::with('author')->get(); foreach($posts as $post) { echo $post->author->name; }` (2 queries)
- **Slow query**: `SELECT * FROM posts WHERE YEAR(created_at) = 2023` (no index on YEAR())
- **Optimized**: `SELECT * FROM posts WHERE created_at >= '2023-01-01' AND created_at < '2024-01-01'` (uses index on created_at)

## Related Topics
- Index Tuning Cost (ku-02)
- Read Replicas Cost (ku-05)
- Serverless Database (ku-07)

## AI Agent Notes
- Default: eager load all relationships in loops and Blade
- Default: add indexes on WHERE, JOIN, and ORDER BY columns
- Monitor slow query log; fix queries >500ms first

## Verification
- [ ] No N+1 queries in application (checked with Debugbar)
- [ ] Slow query log enabled (threshold < 500ms)
- [ ] SELECT queries limited to needed columns
- [ ] CHUNK used for large dataset processing
- [ ] Indexes on all WHERE/JOIN/ORDER BY columns
- [ ] Query count < 10 per page load (average)
- [ ] Database CPU < 50% at peak traffic
