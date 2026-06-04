# Skill: Log and Analyze Queries with DB::Listen

## Purpose

Use `DB::listen` to capture every executed query (SQL, bindings, time, connection), `enableQueryLog`/`getQueryLog` for in-memory query storage, and slow query alerting — for debugging, performance analysis, and test assertions.

## When To Use

- Debugging query behavior during development
- Asserting query counts in tests
- Alerting on slow queries in production
- Analyzing query patterns for optimization

## When NOT To Use

- Production monitoring (use dedicated tools like Telescope, New Relic)
- Long-running processes (memory growth from query log)

## Prerequisites

- Understanding of SQL queries and bindings
- Knowledge of query execution lifecycle

## Inputs

- Query SQL string
- Parameter bindings
- Execution time in milliseconds
- Connection name

## Workflow

1. For slow query alerting: `DB::listen(fn($q) => $q->time > 100 && Log::warning(...))`
2. For test assertions: `DB::enableQueryLog(); // execute; $this->assertCount(2, DB::getQueryLog())`
3. For debugging: register DB::listen in AppServiceProvider or a middleware
4. Clean up in long-running processes: `DB::disableQueryLog()`

## Validation Checklist

- [ ] Query logging is disabled in production (unless specific monitoring)
- [ ] getQueryLog() is followed by disableQueryLog() to clear memory
- [ ] Slow query threshold is appropriate (typically 100-200ms)
- [ ] Test assertions correctly verify expected query count

## Common Failures

### Leaving query logging enabled in production
`getQueryLog()` stores all queries in memory per request. On high-traffic endpoints, this exhausts PHP memory.

### Using getQueryLog() without disableQueryLog()
Queries accumulate. After retrieving, call `disableQueryLog()` to clear.

## Decision Points

### DB::listen vs Telescope?
DB::listen for custom alerting and test assertions. Telescope for comprehensive development profiling.

### enableQueryLog vs DB::listen?
enableQueryLog for simple query counting in tests. DB::listen for event-driven reactions (logging, alerting).

## Performance Considerations

DB::listen adds minimal overhead per query. enableQueryLog stores all queries in memory — don't leave enabled in production. Slow query alerting in production should be async.

## Security Considerations

Query logs may contain parameter values with user data. Don't log query bindings in production without sanitization. Use threshold-based alerting instead.

## Related Rules

- Disable query logging in production
- Clean up query log after retrieval in long-running processes
- Use DB::listen for slow query alerting

## Related Skills

- Detect and Eliminate N+1 Query Problems
- Process Large Datasets with Chunk and Cursor
- Build Complex Queries with the Fluent Query Builder

## Success Criteria

- DB::listen properly captures and logs queries
- Test assertions verify query counts correctly
- Slow query alerts fire at the configured threshold
- Query logging is not enabled in production
