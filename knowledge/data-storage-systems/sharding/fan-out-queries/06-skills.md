# Skill: Implement Fan-Out Queries Across Shards

## Purpose

Execute a query across all shards in parallel and aggregate results when the shard key is not available in the WHERE clause.

## When To Use

- Queries without the shard key (global searches, admin reports, aggregations)
- Cross-shard data analysis
- When shard key is unknown

## When NOT To Use

- Query includes shard key (route directly to single shard)
- Real-time queries requiring consistent snapshots across shards
- Frequently executed queries (cache or denormalize instead)

## Prerequisites

- List of all shard connections
- Parallel execution mechanism (Swoole coroutines, parallel PHP, async HTTP)
- Result aggregation logic

## Inputs

- Query to fan-out
- Query parameter(s)
- Shard connection list

## Workflow (numbered steps)

1. Identify queries that must fan-out (no shard key in WHERE clause)
2. Dispatch query to all shards in parallel:
   - Octane: use concurrent HTTP requests or `Swoole\Coroutine`
   - PHP-FPM: use parallel PHP extension or sequential with timeout per shard
   - `Http::pool()` for parallel API calls if using proxy-based routing
3. Implement timeout per shard: if a shard doesn't respond in time, skip it (partial results)
4. Aggregate results: merge sorted lists, sum counts, combine sets
5. Handle partial failures: log failed shard, return partial results with warning

## Validation Checklist

- [ ] Parallel execution works across all shards
- [ ] Result aggregation is correct (merge, sum, combine)
- [ ] Timeout prevents slow shard from blocking entire result
- [ ] Partial failures are handled gracefully

## Common Failures

- Sequential fan-out (query shards one by one) — slowest shard × N
- No timeout — one slow shard blocks entire response
- Aggregation duplicates or misses data
- Parallel execution exhausts connection pool

## Decision Points

- Parallel vs sequential fan-out
- Timeout per shard vs total timeout for fan-out
- Fail-fast (all shards must respond) vs partial results

## Performance Considerations

- Latency = max(shard_latency) for parallel execution
- Latency = sum(shard_latency) for sequential execution
- Connection count = N shards × connections per shard during fan-out

## Security Considerations

- Fan-out queries must respect tenant isolation
- Aggregated results must not expose individual tenant data
- Query cache per shard to reduce repeated fan-out overhead

## Related Rules

- 6-7-1: Always Use Parallel Execution For Fan-Out
- 6-7-2: Never Allow Fan-Out Without Timeout

## Related Skills

- Implement Cross-Shard Queries
- Implement Shard Routing
- Implement Shard-Aware Model Traits

## Success Criteria

- Fan-out queries return complete results within acceptable latency
- Slow shard doesn't block entire query (timeout works)
- Partial failures don't cause application errors

---

# Skill: Build a Fan-Out Query Executor

## Purpose

Create a reusable fan-out query executor that dispatches queries to all shards, aggregates results, and handles partial failures.

## When To Use

- Multiple queries need fan-out execution
- Consistent fan-out behavior needed across features
- Caching fan-out results for repeated queries

## When NOT To Use

- Single fan-out query with simple implementation
- Proxy-level routing handles fan-out transparently

## Prerequisites

- Queries to fan-out identified
- Shard connections configured
- Parallel execution mechanism available

## Inputs

- Query callback (per shard)
- Shard connection list
- Aggregation strategy (sum, merge, combine)
- Timeout configuration

## Workflow (numbered steps)

1. Create `FanOutQueryExecutor` class:
   - `execute(callable $queryBuilder, string $aggregationStrategy): mixed`
   - `queryBuilder` receives shard connection, returns query results
   - `aggregationStrategy`: 'merge' (sorted lists), 'sum' (counts), 'combine' (sets)
2. Execute callback on all shards in parallel using concurrency mechanism
3. Apply per-shard timeout: if timeout exceeded, log warning, skip shard
4. Aggregate results according to strategy
5. Cache aggregated results if the query is repeated frequently

## Validation Checklist

- [ ] Executor dispatches to all shards in parallel
- [ ] Aggregation strategies work correctly
- [ ] Timeout works per shard
- [ ] Partial results handled correctly

## Common Failures

- Executor holds connections for too long (timeout too long)
- Aggregation produces incorrect results (duplicate or missing data)
- Executor not reusable for different query types

## Decision Points

- Parallel vs sequential vs batching (process in groups)
- Result caching: TTL vs cache invalidation event

## Performance Considerations

- Pool connections for fan-out to avoid exhaustion
- Cache results for frequent queries
- Monitor fan-out query frequency and optimize

## Security Considerations

- Executor must respect data access controls
- Cache must be tenant-aware if applicable

## Related Rules

- 6-7-1: Always Use Parallel Execution For Fan-Out

## Related Skills

- Implement Fan-Out Queries
- Implement Cross-Shard Queries
- Implement Shard Routing

## Success Criteria

- Fan-out executor returns complete results
- Timeout prevents slow shard from blocking
- Executor is reusable across all fan-out queries in the application
