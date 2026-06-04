# Skill: Configure Octane Connection Pool for Read Replicas

## Purpose

Configure Laravel Octane's `PDOConnectionPool` to maintain persistent read replica connections across requests, reducing connection churn and controlling connection count per worker.

## When To Use

- Laravel Octane is the application server (Swoole, RoadRunner, FrankenPHP)
- Application uses multiple read replicas
- Need to limit concurrent connections per worker to avoid replica overload

## When NOT To Use

- PHP-FPM (connections are per-request, pool has different semantics)
- Single database node (no read replicas to pool)
- Octane without pooling (default creates new connections per request — no benefit)

## Prerequisites

- Laravel Octane installed and configured
- Read replicas configured in `config/database.php`
- Octane 2.x+ (supports `PDOConnectionPool`)

## Inputs

- Worker count (e.g., 8 Octane workers)
- Replica count and `max_connections` per replica
- Average concurrent requests per worker
- Burst capacity requirement

## Workflow (numbered steps)

1. In `config/database.php`, add pool config to read replica connection:
   ```php
   'pool' => [
       'min' => 2,  // average concurrent requests per worker
       'max' => 10, // burst capacity
   ],
   ```
2. Set `min` to expected average concurrent requests per worker (e.g., worker handles 4 concurrent requests → min=4)
3. Set `max` to burst capacity (e.g., 2x-3x of min)
4. Configure total pool across all workers: workers × max ≤ replica `max_connections`
5. Test under load: verify pool utilization and connection count to replicas
6. Monitor Octane connection pool stats via Laravel debug bar or custom metrics

## Validation Checklist

- [ ] Pool config applied to read replica connection in `database.php`
- [ ] Octane workers reuse connections across requests (confirmed via `SHOW PROCESSLIST`)
- [ ] Replica `max_connections` not exceeded during peak load
- [ ] Pool idle connections returned to pool (no connection leaks)
- [ ] Fallback behavior works when pool is exhausted (queue or error)

## Common Failures

- No pool config: Octane creates new connection per request, same overhead as PHP-FPM
- Pool too large: `max` x workers > replica `max_connections` → connection errors
- Pool too small: requests queue waiting for available connection
- Mixing pool config with persistent connection option (conflicts)

## Decision Points

- Pool `min`: start with average concurrent requests/worker, adjust based on monitoring
- Pool `max`: allow 2x-3x burst, but keep total (workers × max) ≤ 80% of replica `max_connections`
- Connection per replica pool vs single shared pool: replica-specific pools are more predictable

## Performance Considerations

- Pooled connections eliminate per-request connect/disconnect (~5-20ms savings per request)
- Total connections reduced from workers × replicas to pool_max per worker
- Pool overhead is negligible (<0.1ms per query)

## Security Considerations

- Pooled connections retain authentication — ensure pool doesn't leak across users
- Connection encryption (TLS) configured at pool level
- Octane worker environment must not expose connection credentials

## Related Rules

- 7-14-1: Always Configure Pool for Octane Replica Connections
- 7-14-2: Ensure Workers × Pool Max ≤ Replica max_connections

## Related Skills

- Configure Connection Pooling for Read Replicas
- Configure Laravel Read/Write Connections
- Monitor Octane Worker Health

## Success Criteria

- Zero per-request database connection overhead
- Replica connection count stays below `max_connections` at peak
- Pool utilization between 40-80% under normal load
- No connection timeout errors under burst traffic

---

# Skill: Size Octane Connection Pool for Read Replicas

## Purpose

Determine optimal pool `min` and `max` values based on worker count, concurrency, and replica capacity to balance performance against resource utilization.

## When To Use

- Configuring Octane connection pool for the first time
- Observing pool exhaustion or underutilization in production
- Scaling replica count or instance size

## When NOT To Use

- PHP-FPM (no persistent pool)
- Single replica under light load (default pool settings suffice)

## Prerequisites

- Octane worker count configured
- Replica `max_connections` known
- Average and peak concurrent requests per worker measured

## Inputs

- Number of Octane workers (e.g., 8)
- Replica `max_connections` (e.g., 150 per replica)
- Average concurrency per worker (e.g., 3 concurrent requests)
- Peak concurrency per worker (e.g., 8 concurrent requests)
- Number of read replicas (e.g., 3)

## Workflow (numbered steps)

1. Calculate total available connections: replicas × max_connections (e.g., 3 × 150 = 450)
2. Reserve headroom: use up to 80% max → 360 connections available
3. Set pool `min` per connection per worker: average_concurrency / replicas (e.g., 3 / 3 = 1 connection per worker per replica)
4. Set pool `max` per connection per worker: peak_concurrency / replicas (e.g., 8 / 3 ≈ 3 connections per worker per replica)
5. Validate total: workers × pool_max × replicas ≤ available_connections (8 × 3 × 3 = 72 ≤ 360 ✓)
6. Monitor and adjust: increase `min` if queue wait observed, decrease `max` if connections idle
7. Document pool sizing for future scaling events

## Validation Checklist

- [ ] Pool min per worker × workers × replicas < replica max_connections × 0.8
- [ ] Pool max per worker × workers × replicas < replica max_connections × 0.9
- [ ] Queue wait time < 5ms at peak traffic
- [ ] Idle connections < 20% of total pool (good utilization)

## Common Failures

- Underestimating peak concurrency: pool exhaustion during traffic spikes
- Overestimating: too many idle connections wasting resources
- Not recalculating after scaling workers or replicas
- Ignoring replica individual limits: pool may be fine overall but one replica overloaded

## Decision Points

- Conservative sizing: higher `min` for predictable burst handling
- Aggressive sizing: lower `min`, higher `max` for cost efficiency
- Per-replica vs uniform pool sizing: use uniform unless replicas have different max_connections

## Performance Considerations

- Larger pool = faster burst handling but more replica connections
- Idle connections cost very little CPU but consume memory (~1-2MB per connection)
- Pool exhaustion forces queuing or fallback to primary — both are expensive

## Security Considerations

- Pool sizing doesn't affect security directly, but exhaustion can trigger fallback which changes auth paths
- Ensure fallback connections (primary) use the same encryption and auth standards

## Related Rules

- 7-14-3: Always Size Pool Within Replica Capacity

## Related Skills

- Configure Octane Connection Pool for Read Replicas
- Size Read Replicas
- Monitor Octane Worker Health

## Success Criteria

- Pool exhaustion events = 0 per day
- Idle connection ratio < 20%
- Average queue wait < 2ms
