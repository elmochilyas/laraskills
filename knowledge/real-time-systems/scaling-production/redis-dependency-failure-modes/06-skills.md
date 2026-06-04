# Skill: Manage Redis Dependency and Failure Modes for Reverb

## Purpose
Configure, monitor, and operate Redis for Reverb horizontal scaling with resilience to network partitions, OOM conditions, failover events, and pub/sub limitations.

## When To Use
- Multi-server Reverb deployments requiring Redis for horizontal scaling
- Presence channel state management across instances
- Queue backend for broadcast event processing
- Cache backend for authorization decisions

## When NOT To Use
- Single-server deployments (Laravel 13's database scaling driver is simpler)
- Managed WebSocket services (Pusher, Ably) that handle scaling
- Environments where Redis cannot be operated reliably

## Prerequisites
- Redis installed and configured
- Reverb configured with Redis scaling
- Laravel queue configured with Redis driver
- Monitoring access to Redis (memory, connections, pub/sub)

## Inputs
- Redis instance configuration (port, password, persistence)
- Reverb Redis scaling environment variables
- Queue Redis configuration
- Presence channel TTL settings

## Workflow
1. Provision a dedicated Redis instance for Reverb pub/sub (separate from cache/queue)
2. Configure `requirepass` and bind to internal IP with firewall
3. Set `maxmemory-policy noeviction` for Reverb and queue Redis; `allkeys-lru` for cache Redis
4. Enable AOF persistence for queue Redis (`appendonly yes`, `appendfsync everysec`)
5. Configure TTL on presence channel member keys via `REVERB_ACTIVITY_TIMEOUT`
6. Deploy Redis Sentinel or Cluster for automatic failover
7. Configure Reverb connection retry with backoff for Redis disconnections
8. Set up monitoring: Redis memory, connected clients, pub/sub message rate
9. Update Reverb to v1.7.0+ (CVE-2026-23524 fix)
10. Test failure scenarios: Redis restart, network partition, OOM condition

## Validation Checklist
- [ ] Dedicated Redis instance for Reverb pub/sub (separate from cache/queue)
- [ ] Redis authentication configured (`requirepass`)
- [ ] Redis bound to internal IP with firewall
- [ ] `maxmemory-policy` set appropriately per instance (noeviction for queue/Reverb)
- [ ] AOF persistence enabled for queue Redis
- [ ] TTL set on presence channel member keys
- [ ] Redis Sentinel or Cluster configured for HA
- [ ] Reverb connection retry with backoff configured
- [ ] Reverb updated to v1.7.0+
- [ ] Redis memory usage monitored

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Reverb instances stop coordinating | Shared Redis instance overwhelmed by cache/queue | Provision dedicated Redis for Reverb pub/sub |
| Queued broadcast events lost on restart | AOF persistence not enabled | Enable `appendonly yes` on queue Redis |
| CVE-2026-23524 vulnerability | No Redis auth or public bind | Set `requirepass`, bind to internal IP, upgrade Reverb |
| Unbounded Redis memory growth | No TTL on presence keys | Set `REVERB_ACTIVITY_TIMEOUT` |
| Queued events dropped under memory pressure | Wrong `maxmemory-policy` on queue Redis | Set `maxmemory-policy noeviction` |
| Complete broadcasting failure on Redis outage | No Redis HA | Deploy Sentinel or Cluster |

## Decision Points
- **Dedicated vs shared Redis**: Dedicated for Reverb pub/sub limits blast radius; shared is acceptable for single-server or development
- **Sentinel vs Cluster**: Sentinel for replication with automatic failover; Cluster for sharding across many instances
- **AOF vs RDB**: AOF for queue persistence (append-only, fsync everysec); RDB for cache where some loss is acceptable

## Performance/Security Considerations
- Redis pub/sub is fire-and-forget — messages are not queued for disconnected subscribers
- Separate Redis instances prevent cross-component failure cascades
- Redis must not be exposed to the public internet
- Monitor Redis memory, connected clients, and pub/sub rates
- Each Reverb instance uses two Redis connections (subscribe + publish)

## Related Rules (from 05-rules.md)
- Always Use a Dedicated Redis Instance for Reverb Pub/Sub
- Always Configure Redis Authentication and Network Isolation
- Always Set TTL on Presence Channel Keys
- Always Enable AOF Persistence for Queue Redis
- Always Use Redis Sentinel or Cluster for High Availability
- Never Use Default Redis `maxmemory-policy` Without Consideration

## Related Skills
- Deploy and Operate a Dedicated Reverb Fleet
- Monitor Reverb Metrics with Laravel Pulse

## Success Criteria
- Reverb instances coordinate correctly over dedicated Redis pub/sub
- Queued broadcast events survive Redis restarts (AOF persistence)
- Presence channel data has bounded memory growth (TTL configured)
- Redis failure does not cause permanent data loss or extended outage
- Automatic failover restores service within acceptable window
