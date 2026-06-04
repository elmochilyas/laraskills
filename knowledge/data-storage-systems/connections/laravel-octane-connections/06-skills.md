# Skill: Configure Octane Connection Pool

## Purpose

Configure `pool.min`, `pool.max`, and `pool.ttl` in Laravel's database config for Octane to prevent per-request connection creation and enable persistent connection reuse across requests within a worker.

## When To Use

- Every Octane application — the pool config is mandatory, not optional
- Read/write separated connections with different pool sizes per connection type
- Worker-per-core or worker-per-N-requests Octane configurations

## When NOT To Use

- PHP-FPM deployments (Octane pool config has no effect)
- Long-running daemon processes performing sequential work
- Serverless environments (Vapor)

## Prerequisites

- Octane installed and configured
- Understanding of connection lifecycle (10-1)
- Understanding of pool architecture (10-2)
- Knowledge of database max_connections

## Inputs

- Number of Octane workers
- Expected baseline concurrent requests per worker
- Expected peak concurrent requests per worker
- Database max_connections setting

## Workflow (numbered steps)

1. Add pool config to each database connection in `config/database.php`:
   ```php
   'mysql' => [
       'pool' => [
           'min' => 2,
           'max' => 10,
           'ttl' => 60,
       ],
   ],
   ```

2. Size pool.min to baseline concurrency per worker:
   - If a worker handles 4 concurrent requests at baseline, set `min = 4`
   - Pre-warms connections so first requests don't pay connection latency

3. Size pool.max to peak concurrency per worker + buffer:
   - If peak is 8 concurrent requests per worker, set `max = 10`
   - Buffer of 2 handles temporary spikes without queuing

4. Calculate total potential connections: `workers × pool.max`
   - With 8 workers × pool.max=10 = 80 connections
   - Ensure database `max_connections` > total + 10 admin reserved

5. Separate pool configs for read vs write connections:
   - Read pool: `min=4, max=12` (more read requests)
   - Write pool: `min=2, max=4` (fewer write requests)

6. Configure pool.ttl (default 60s):
   - Lower for dynamic environments (auto-scaling)
   - Higher for stable workloads

7. Pre-warm connections in a ServiceProvider boot() method:
   ```php
   if ($this->app->bound('octane')) {
       DB::connection('mysql')->select('SELECT 1');
   }
   ```

## Validation Checklist

- [ ] `pool` config array exists in all database connections used by Octane
- [ ] `pool.min` <= `pool.max` for all connections
- [ ] Total potential connections (workers × pool.max) < database `max_connections`
- [ ] No connection wait times in Octane dashboard during peak load
- [ ] Read and write connections have separate pool configurations
- [ ] Pool utilization stays under 80% at peak traffic
- [ ] Connection pre-warming works on worker boot

## Common Failures

- No pool config — every request creates a new connection (no pooling benefit)
- pool.max too high — 8 workers × 100 max = 800 connections, database crash
- pool.min = pool.max — no room for traffic spikes
- Same pool config for all connections — read pool starves, write pool wastes
- Not monitoring pool utilization — silent connection starvation

## Decision Points

- Pool min: expected baseline vs 0 (lazy connection allocation)
- Pool max: P95 concurrency + buffer vs P99 concurrency
- Separate pools for read/write vs single merged pool
- PgBouncer co-existence vs standalone Octane pool

## Performance Considerations

- Pool hit: ~0.01ms overhead
- Pool miss (create new): ~1–50ms depending on network and SSL
- Without pool config: every request pays connection overhead
- Total DB connections = workers × pool.max
- pool.ttl = 60s default; adjust per workload stability

## Security Considerations

- Each pooled connection holds database credentials in memory
- Rotate credentials: after rotation, restart Octane workers or use DB::purge + reconnect
- Pool does not encrypt connections — configure TLS at the driver level

## Related Rules

- 10-4-1: Always Configure Pool Settings for Database Connections in Octane
- 10-4-2: Deploy PgBouncer for PHP-FPM Deployments

## Related Skills

- Configure Pool Architecture
- Manage Connection Count
- Manage Connection Lifecycle

## Success Criteria

- Pool config exists and is sized correctly for traffic
- No connection exhaustion under peak load
- Read and write pools have independent sizing
- Pool utilization stays below 80%
