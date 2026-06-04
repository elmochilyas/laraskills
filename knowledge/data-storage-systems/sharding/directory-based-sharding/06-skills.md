# Skill: Implement Directory-Based Sharding

## Purpose

Use a lookup table (shard map) to track which keys are on which shard, providing flexible routing and easy rebalancing at the cost of an extra lookup hop.

## When To Use

- Maximum flexibility in key-to-shard mapping is needed
- Keys need to move between shards without changing the shard key
- Rebalancing is frequent or unpredictable
- Shard key selection is uncertain (can change mapping later)

## When NOT To Use

- Extra lookup hop adds unacceptable latency
- Lookup table becomes a bottleneck or SPOF
- Simpler hashing (modulo or consistent) meets requirements
- More than 100 million unique keys (directory size too large)

## Prerequisites

- Highly available lookup table (Redis, MySQL cluster, DynamoDB)
- Cache for hot shard map entries
- Shard key selection

## Inputs

- Shard key value
- Shard map storage (Redis, DB, etc.)
- Cache configuration

## Workflow (numbered steps)

1. Create shard map: `shard_map(key_hash, shard_id, created_at)`
2. On write: insert key-to-shard mapping, then write data to shard
3. On read: lookup shard_id from map, then query shard
4. Cache shard map entries aggressively (Redis, local memory)
5. On rebalance: update shard map, migrate data, then update map again (point reads to new shard)
6. Handle cache misses: fall back to lookup table, populate cache

## Validation Checklist

- [ ] Shard map lookup returns correct shard_id
- [ ] Cache hit rate > 99% for shard map queries
- [ ] Shard map is highly available (replicated, failover tested)
- [ ] Rebalance updates mapping correctly

## Common Failures

- Shard map is single point of failure (use HA cluster)
- Cache miss causes thundering herd (all requests hit lookup table)
- Map updated before data migration (reads go to wrong shard)
- Map size grows unbounded (archive old entries)

## Decision Points

- Lookup table: Redis vs MySQL vs DynamoDB
- Cache: local memory vs Redis vs both
- Mapping granularity: per-key vs per-range within directory

## Performance Considerations

- Extra hop: 1-5ms for Redis lookup, 5-20ms for DB lookup
- Cache hit: < 1ms
- Map size: N unique keys × ~50 bytes per entry

## Security Considerations

- Shard map may reveal data distribution — restrict access
- Map updates must be authenticated
- Cache poisoning must not redirect queries

## Related Rules

- 6-4-1: Always Cache Shard Map Lookups
- 6-4-2: Never Allow Stale Map Entries After Migration

## Related Skills

- Select a Shard Key
- Implement Shard Routing
- Implement Shard Rebalancing

## Success Criteria

- Shard map lookup completes in < 2ms (with cache)
- Map HA ensures zero downtime for lookup table
- Rebalancing is transparent (update map, migrate data, done)

---

# Skill: Build a Highly Available Shard Map

## Purpose

Ensure the shard map lookup table is always available with low latency, preventing it from becoming a single point of failure.

## When To Use

- Directory-based sharding in production
- Shard map is critical path for every database query
- High availability requirements for the application

## When NOT To Use

- Hash-based or range-based sharding (no directory needed)
- Shard map can tolerate brief downtime

## Prerequisites

- HA database cluster (Redis Sentinel, MySQL cluster, DynamoDB)
- Cache layer (local + Redis)
- Connection failover configuration

## Inputs

- Shard map storage configuration
- Cache topology
- Failover test plan

## Workflow (numbered steps)

1. Deploy shard map storage with HA:
   - Redis: Sentinel or Cluster mode
   - MySQL: replication with failover
   - DynamoDB: auto-managed HA
2. Configure multi-layer cache: local (LRU, 1s TTL) → Redis (cluster, 60s TTL) → DB
3. Implement circuit breaker: if lookup table is down, use cached entries (risk: stale)
4. Test failover: kill primary lookup instance, verify application continues working
5. Monitor shard map latency and availability

## Validation Checklist

- [ ] Lookup table is deployed with HA configuration
- [ ] Multi-layer cache works correctly
- [ ] Failover test passes without application errors
- [ ] Map latency is within SLA

## Common Failures

- Cache stampede on map miss (all requests hit DB simultaneously)
- Failover causes write loss (async replication: recent writes lost)
- Circuit breaker too aggressive — returns stale data for too long

## Decision Points

- In-memory cache TTL vs staleness tolerance
- Circuit breaker: fail open (use stale cache) vs fail closed (return error)

## Performance Considerations

- Local cache: 0.1ms hit, 1-5ms Redis miss
- Redis cluster: auto-failover < 10s
- Circuit breaker: slight latency increase during degraded mode

## Security Considerations

- Shard map may contain sensitive routing information
- Cache must be encrypted in multi-tenant environments

## Related Rules

- 6-4-1: Always Cache Shard Map Lookups

## Related Skills

- Implement Directory-Based Sharding
- Implement Shard Routing
- Implement Failover Connection Behavior

## Success Criteria

- Shard map availability > 99.99%
- P99 lookup latency < 5ms
- Failover completes without application-visible errors
