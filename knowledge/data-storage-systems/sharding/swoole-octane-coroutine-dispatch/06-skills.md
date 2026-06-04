# Skill: Implement Coroutine-Based Shard Queries in Octane/Swoole

## Purpose

Use coroutines to dispatch parallel queries to multiple shards in Octane or Swoole environments, reducing fan-out latency.

## When To Use

- Laravel Octane or Swoole runtime
- Fan-out queries across shards need minimum latency
- Multiple independent queries must run in parallel
- Coroutine support available

## When NOT To Use

- PHP-FPM (no coroutine support)
- Single-shard queries (no parallelism needed)
- Sequential fan-out is acceptable for low-shard counts

## Prerequisites

- Laravel Octane installed (Swoole or RoadRunner driver)
- Understanding of coroutine fundamentals
- Shard connections configured

## Inputs

- List of shard queries to execute
- Query parameters per shard
- Aggregation logic

## Workflow (numbered steps)

1. Identify fan-out queries that can benefit from parallel execution
2. In Octane with Swoole driver, use `Swoole\Coroutine`:
   ```php
   $results = [];
   foreach ($shards as $i => $shard) {
       go(function() use ($shard, &$results, $i) {
           $results[$i] = DB::connection('shard_'.$shard)->select($query);
       });
   }
   ```
3. For Octane with RoadRunner driver, use `Spiral\RoadRunner\KeyValue` or HTTP pooling
4. Implement result aggregation after all coroutines complete
5. Handle partial failures: timeout per coroutine, skip failed shards
6. Ensure connection pool sizing accounts for concurrent coroutine queries

## Validation Checklist

- [ ] Coroutines execute shard queries in parallel
- [ ] Results aggregated correctly
- [ ] Timeouts prevent slow shard from blocking
- [ ] Connection pool not exhausted by concurrent coroutines

## Common Failures

- Coroutine deadlock (all coroutines waiting for same connection)
- Shared state corruption (not using isolated variables per coroutine)
- Connection pool too small — coroutines wait for available connections

## Decision Points

- Swoole coroutines vs RoadRunner HTTP pooling vs parallel PHP extension
- Connection pool sizing for concurrent coroutine queries

## Performance Considerations

- Coroutine fan-out: latency = max(shard_latency)
- Sequential fan-out: latency = sum(shard_latency)
- Connection pool: coroutine count × connections per query

## Security Considerations

- Coroutine-scoped data must not leak between coroutines
- Shared state must be protected

## Related Rules

- 6-16-1: Always Use Coroutines For Parallel Shard Queries
- 6-16-2: Never Share Mutable State Between Coroutines

## Related Skills

- Implement Fan-Out Queries
- Configure Laravel Octane Connections
- Implement Shard Routing

## Success Criteria

- Coroutine-based fan-out completes in max(shard_latency) time
- No deadlocks or connection pool exhaustion
- Results are correctly aggregated

---

# Skill: Configure Connection Pool for Coroutine Shard Queries

## Purpose

Size the Octane connection pool to handle concurrent coroutine queries across multiple shards without exhaustion.

## When To Use

- Octane with coroutine-based parallel shard queries
- Connection pool must support peak concurrent coroutine queries
- Multiple shards queried simultaneously

## When NOT To Use

- Single-shard queries (minimal concurrency)
- Sequential fan-out (one connection at a time)

## Prerequisites

- Octane connection pool config
- Understanding of peak concurrent coroutine count
- Database max_connections limit

## Inputs

- Number of Octane workers
- Maximum concurrent coroutines per worker
- Number of shards queried per fan-out
- Database max_connections

## Workflow (numbered steps)

1. Calculate peak concurrent connections per worker:
   - Max coroutine fan-out queries at once = max_concurrent_coroutines × shards_per_query
   - Pool.max ≥ peak concurrent connections
2. Set `pool.max` higher than normal to account for coroutine concurrency
3. Set `pool.min` to baseline load
4. Account for all workers: total_connections = workers × pool.max
5. Verify total_connections ≤ database max_connections - headroom
6. Test under peak load: verify no connection wait timeouts

## Validation Checklist

- [ ] Pool.max accounts for maximum concurrent coroutine queries
- [ ] Total connections across all workers within database limits
- [ ] No connection wait timeouts under peak load
- [ ] Pool utilization acceptable

## Common Failures

- Pool.max too low — coroutines wait for connections (serialization)
- Pool.max too high — database max_connections exceeded
- Not accounting for other connection consumers (queue workers, admin tools)

## Decision Points

- Per-worker pool vs shared pool
- Queue workers: separate database user with lower max_connections

## Performance Considerations

- Higher pool.max = more concurrent queries = lower latency
- Higher pool.max = more database connections = more memory
- Benchmark to find optimal balance

## Security Considerations

- Pool credentials must be managed securely
- Monitor connection count for unusual patterns

## Related Rules

- 6-16-1: Always Use Coroutines For Parallel Shard Queries

## Related Skills

- Implement Coroutine-Based Shard Queries
- Configure Laravel Octane Connections
- Manage Connection Count

## Success Criteria

- Pool supports peak coroutine fan-out without connection wait
- Total connections within database limits
- P99 query latency acceptable under peak load
