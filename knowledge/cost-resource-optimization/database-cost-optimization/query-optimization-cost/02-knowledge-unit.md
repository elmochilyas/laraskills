# KU-01-QUERY-OPTIMIZATION-COST: Query Optimization Cost

## Metadata
- **ID**: KU-01-QUERY-OPTIMIZATION-COST
- **Subdomain**: Database Cost Optimization
- **Topic**: Query Optimization Cost
- **Source**: Database Cost Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Optimizing database queries reduces CPU and memory usage on the database server, enabling smaller/cheaper instance sizes and reducing I/O costs. A single unoptimized query can consume 90% of database resources. For Laravel applications, N+1 queries (missing eager loading), missing indexes, and full table scans are the primary culprits. Every query optimized translates directly to lower database tier cost or more capacity on existing hardware.

## Core Concepts
- **N+1 query problem**: 1 query for parent + N queries for children = performance disaster
- **Full table scan**: Query without index scanning entire table; exponential cost for large tables
- **Query execution time**: Directly correlates to database CPU and I/O consumption
- **Slow query log**: MySQL/PostgreSQL log of queries exceeding threshold; primary tool for optimization
- **Query cost units**: Database resources consumed per query (CPU cycles + I/O operations + memory)
- **Laravel Debugbar**: Development tool showing query count and execution time per page load

## Mental Models
- Default: eager load all relationships in loops and Blade
- Default: add indexes on WHERE, JOIN, and ORDER BY columns
- Monitor slow query log; fix queries >500ms first

## Internal Mechanics
- N+1 at 100 parents + 5 children each: 501 queries in 1000ms vs 2 queries in 5ms (200x improvement)
- Missing index on 1M row table: full scan ~500ms vs index scan ~2ms (250x improvement)
- SELECT * instead of needed columns: 5x I/O overhead for typical Laravel table (50 columns, 10 needed)
- Each unnecessary query = database CPU cycle = lower capacity for real traffic

## Patterns
- Always eager load in loops
- Use Laravel Debugbar locally
- Monitor slow query log
- SELECT only needed columns
- Use chunks for large datasets
- Avoid WHERE IN with subqueries

## Architectural Decisions
- Set up slow query log on all production databases
- Use Laravel Telescope or Scout APM for query monitoring in production
- Implement database query count budget: < 10 queries per page load (target), < 20 (warning)
- Profile with EXPLAIN on any query taking > 100ms
- Use read replicas for reporting/analytical queries
- Archive old data to reduce table size (smaller tables = faster queries)

## Tradeoffs
**When To Use:**
- Query optimization: Any app with slow page loads, high database CPU, or N+1 queries
- Index optimization: Tables > 10K rows with frequent WHERE, JOIN, or ORDER BY queries
- N+1 detection: Any Eloquent relationship without eager loading in loops
- Slow query log: Production databases with CPU > 50% consistently
- Query monitoring: New Relic, Scout APM, or Laravel Telescope for query time tracking

**When NOT To Use:**
- Premature optimization: Don't optimize 1-2ms queries on 10-row tables (negligible impact)
- Ignoring application cache: Some queries are better avoided entirely (cache results)
- Over-indexing: Too many indexes slow writes (INSERT/UPDATE/DELETE) and increase storage cost
- Query optimization for reporting: Analytical queries on large datasets may need different approach (materialized views, data warehouse)

## Performance Considerations
- N+1 at 100 parents + 5 children each: 501 queries in 1000ms vs 2 queries in 5ms (200x improvement)
- Missing index on 1M row table: full scan ~500ms vs index scan ~2ms (250x improvement)
- SELECT * instead of needed columns: 5x I/O overhead for typical Laravel table (50 columns, 10 needed)
- Each unnecessary query = database CPU cycle = lower capacity for real traffic

## Production Considerations
- Slow queries can be exploited for denial-of-service (trigger expensive queries)
- Query logging may expose data patterns; mask sensitive query parameters in logs
- Use read replicas for heavy queries to avoid impacting write performance
- Rate limit query-heavy endpoints to prevent accidental database overload

## Common Mistakes
- **N+1 queries in production**: Loading related models in Blade loop without eager loading (Cause: not checking query count in development; Consequence: 50+ queries per page load; database CPU at 80%+; Better: use Debugbar in dev, monitor query count)
- **Missing indexes on join columns**: Joining on columns without indexes (Cause: indexes added only on primary/foreign keys; Consequence: full table scan on JOIN tables; Better: add indexes on all columns used in WHERE, JOIN, and ORDER BY clauses)
- **SELECT * on large tables**: Retrieving all 80 columns when 3 are needed (Cause: Laravel `->get()` defaults to `SELECT *`; Consequence: 10x data transfer, 5x memory usage; Better: use `->select(['id', 'name'])`)

## Failure Modes
- **Lazy loading in production**: No caching of repeated queries; each page load queries fresh
- **Over-fetching in API resources**: API Resource loads all relationships even when not requested
- **No pagination on list endpoints**: Loading 100K records into memory for a listing page

## Ecosystem Usage
- **Before**: `$posts = Post::all(); foreach($posts as $post) { echo $post->author->name; }` (N+1)
- **After**: `$posts = Post::with('author')->get(); foreach($posts as $post) { echo $post->author->name; }` (2 queries)
- **Slow query**: `SELECT * FROM posts WHERE YEAR(created_at) = 2023` (no index on YEAR())
- **Optimized**: `SELECT * FROM posts WHERE created_at >= '2023-01-01' AND created_at < '2024-01-01'` (uses index on created_at)

## Related Knowledge Units
- Index Tuning Cost (ku-02)
- Read Replicas Cost (ku-05)
- Serverless Database (ku-07)

## Research Notes
Derived from Database Cost Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.