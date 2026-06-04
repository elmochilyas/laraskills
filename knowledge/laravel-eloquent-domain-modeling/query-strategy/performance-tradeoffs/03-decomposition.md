# Decomposition: Performance Tradeoffs

## Knowledge Unit Breakdown

### 1. Hydration Overhead
- 1.1 Per-row CPU cost breakdown
- 1.2 Model constructor and trait booting
- 1.3 Attribute casting cost (date, JSON, enum, custom)
- 1.4 `$appends` accessor cost on serialization
- 1.5 `retrieved` event cost
- 1.6 Comparison: stdClass vs Model memory footprint

### 2. Query Count Impact
- 2.1 N+1: cause, detection, prevention
- 2.2 Eager loading: `with()`, `load()`, `loadCount()`
- 2.3 Eager loading combined queries (`with('posts.comments')`)
- 2.4 Lazy eager loading (`load()` after initial query)
- 2.5 Subquery selects as query-count optimization

### 3. Eager Loading vs Join Performance
- 3.1 Separate query approach (eager loading)
- 3.2 Single query approach (join + deduplication)
- 3.3 Row duplication cost with joins
- 3.4 Data transfer size comparison
- 3.5 Hydration deduplication overhead

### 4. Memory Management
- 4.1 Per-model memory footprint breakdown
- 4.2 Collection memory vs array memory
- 4.3 Lazy collection memory behavior
- 4.4 Memory growth with chunked processing
- 4.5 Garbage collection considerations

### 5. Query Compilation Cost
- 5.1 Builder chain to SQL compilation time
- 5.2 Grammar-specific compilation costs
- 5.3 Binding management overhead
- 5.4 SQL cache (database-level query cache)
- 5.5 Raw SQL vs builder chains

### 6. Database Connection Behavior
- 6.1 Buffered queries (default MySQL behavior)
- 6.2 Unbuffered queries (`PDO::MYSQL_ATTR_USE_BUFFERED_QUERY`)
- 6.3 Connection saturation during cursor iteration
- 6.4 Transaction duration impact
- 6.5 Read/write connection separation

### 7. Caching Strategies
- 7.1 Full query result caching (`Cache::remember`)
- 7.2 Fragment caching (cache specific subqueries)
- 7.3 Model caching (cache hydrated models)
- 7.4 Cache invalidation with model events
- 7.5 Database query cache vs application cache

### 8. Benchmarking Methodology
- 8.1 Microbenchmarking vs realistic load testing
- 8.2 Profiling tools (Debugbar, Telescope, Xdebug, Blackfire)
- 8.3 Creating performance regression tests
- 8.4 Isolating hydration cost from query cost
- 8.5 Measuring with `DB::listen()` timing

### 9. Optimization Strategies by Context
- 9.1 API endpoints (1-50 rows)
- 9.2 Admin dashboards (50-500 rows)
- 9.3 Reports and exports (1000-1M rows)
- 9.4 Background jobs (variable)
- 9.5 Real-time features

### 10. Monitoring and Alerts
- 10.1 Slow query logging
- 10.2 N+1 detection in CI
- 10.3 Memory usage monitoring
- 10.4 Query count budgets per request
- 10.5 Setting performance budgets in tests
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization