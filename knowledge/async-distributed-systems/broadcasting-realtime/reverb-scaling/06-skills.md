# Skill: Scale Reverb via Multiple Processes

## Purpose
Scale Laravel Reverb horizontally by running multiple processes (one per CPU core) behind a load balancer with Redis pub/sub for cross-process state sharing.

## When To Use
Beyond ~1,000 concurrent WebSocket connections; multiple CPU cores available; horizontal scaling across multiple servers for >10K connections.

## When NOT To Use
Low-traffic apps (<1K connections) — single process simpler; single-core servers (no benefit); development; when Redis is unavailable.

## Prerequisites
- Reverb production deployment with Nginx + Supervisor (baseline)
- Redis instance for pub/sub
- Load balancer (Nginx upstream)

## Inputs
- CPU core count for `numprocs`
- Redis connection details
- Load balancer algorithm

## Workflow
1. Set `numprocs` in Supervisor to match CPU core count
2. Configure Redis pub/sub in `config/reverb.php`: `'scaling' => ['enabled' => true, ...]`
3. Configure load balancer with sticky sessions (IP hash) or no stickiness with Redis pub/sub
4. Adjust `reserved_list_memory` per process (lower default for scaled setups)
5. Monitor Redis pub/sub throughput separately from other Redis usage
6. Use dedicated Redis instance for Reverb if possible (avoid queue competition)
7. Implement health checks on Reverb process (not just TCP port)
8. Monitor per-process connection distribution for imbalance

## Validation Checklist
- [ ] `numprocs` = CPU core count (no over-provisioning)
- [ ] Redis pub/sub enabled in `reverb.php` config
- [ ] Load balancer sticky sessions configured (or Redis pub/sub handles state)
- [ ] Cross-process broadcast works — events reach all clients
- [ ] Process crash handling — clients reconnect to other processes
- [ ] Connection distribution roughly even across processes
- [ ] Redis pub/sub throughput monitored
- [ ] Dedicated Redis for Reverb (if volume justifies)

## Common Failures
- No Redis pub/sub — processes isolated from each other
- More processes than CPU cores — context switching overhead
- No sticky sessions — presence state fragmented, online users inconsistent
- Not monitoring Redis pub/sub — bottleneck at scale
- Assuming durable messages — Redis pub/sub is fire-and-forget, no replay

## Decision Points
- Single-server multi-process: Nginx + Supervisor
- Multi-server: add dedicated Redis pub/sub
- Sticky sessions: IP hash for simple setups

## Related Rules
- Rule 1: scale-reverb-via-process-count
- Rule 2: reduce-reserved-listener-memory
- Rule 3: enable-redis-pubsub-for-multi-process
- Rule 4: load-balance-with-sticky-session-less

## Related Skills
- Deploy Reverb to Production
- Set Up Laravel Echo Client-Side Consumption
- Configure Channel Types — Public, Private, Presence

## Success Criteria
Reverb scales linearly with CPU cores, Redis pub/sub coordinates cross-process state, load balancer distributes connections evenly, and per-process memory is optimized.
