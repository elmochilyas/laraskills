# Skill: Configure block_for to Optimize Redis Queue Polling

## Purpose
Set the `block_for` Redis queue option to reduce polling traffic during idle periods, lowering Redis CPU and network round-trips.

## When To Use
Low-volume queues where workers spend significant time idle; production Redis queue connections.

## When NOT To Use
High-throughput queues (jobs always available); Redis Cluster deployments (BRPOP unreliable across nodes); when using Predis with `block_for > 10`.

## Prerequisites
- Redis queue connection configured
- Knowledge of queue volume pattern (idle vs constant)
- phpredis extension preferred over Predis

## Inputs
- Queue connection name in `config/queue.php`
- Average idle time between job dispatches
- Redis driver (phpredis or Predis)
- Number of worker processes

## Workflow
1. Assess queue volume: if queue is idle >50% of time, blocking will help
2. In `config/queue.php` for Redis connection, set `'block_for' => 5`
3. Set `--sleep=0` on worker command (redundant with block_for)
4. Ensure phpredis connection pool >= max worker count
5. For Redis Cluster: set `'block_for' => null` (disable blocking)
6. For Predis: keep `block_for <= 10` to avoid signal unresponsiveness
7. Restart workers: `sudo supervisorctl restart laravel-worker:*`

## Validation Checklist
- [ ] `block_for` configured in queue.php Redis connection
- [ ] `block_for` value appropriately chosen (5-10 for low volume)
- [ ] `--sleep=0` set on worker (redundant with block_for)
- [ ] phpredis pool size >= worker count
- [ ] Redis Cluster: block_for set to null
- [ ] Predis: block_for <= 10
- [ ] Redis CPU usage reduced during idle periods

## Common Failures
- `block_for` with Redis Cluster — BRPOP blocks on one node only
- `block_for > 10` with Predis — worker unresponsive to SIGTERM
- Both `block_for` and `--sleep` set — worker idle time doubled
- Connection pool too small — other Redis operations queue up

## Decision Points
- Low volume queue: set `block_for=5-10`
- High throughput queue: set `block_for=null` (no benefit)
- Redis Cluster: always set `block_for=null`

## Performance Considerations
- Without block_for: ~20 Redis round-trips/min/worker at --sleep=3
- With block_for=5: ~12 round-trips/min/worker
- Blocking BRPOP doesn't consume Redis CPU — event-driven wait

## Security Considerations
- Blocking connections hold Redis connections longer — exhausts pool
- Monitor connection count on Redis server

## Related Rules
- Rule 1: set-block-for-low-volume
- Rule 2: no-block-for-redis-cluster
- Rule 3: avoid-long-block-with-predis
- Rule 4: account-for-blocking-connections
- Rule 5: remove-sleep-with-block-for

## Related Skills
- Configure Queue Driver Architecture (Redis Connection)
- Configure --max-jobs and --max-time for Worker Recycling

## Success Criteria
Idle workers block on BRPOP instead of polling, Redis CPU usage drops during idle periods, no jobs missed, and workers remain responsive to signals.
