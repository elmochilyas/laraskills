# Cache Tier Selection

## Metadata
- **ID**: KU-01-CACHE-TIER-SELECTION
- **Subdomain**: cache-layer-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Cache Tier Selection
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Choosing the right cache tier (Redis ElastiCache, Memcached, or Laravel memo driver) directly impacts cost and performance. Redis dominates for Laravel due to rich data structures, cache tags, and multi-purpose use (cache + sessions + queues). Memcached is cheaper but limited. The in-memory memo driver (Laravel 13.x) reduces Redis calls at zero cost.

## Core Concepts
- **ElastiCache Redis**: Managed Redis, $12-300+/month depending on node size; Graviton nodes 20% cheaper
- **ElastiCache Memcached**: Simpler, cheaper, but no persistence, no data structures, no cache tags
- **Laravel memo driver**: In-memory within single request; reduces Redis GET calls by 50-80%; zero additional cost
- **Cache tier hierarchy**: L1 (memo/in-process) -> L2 (Redis) -> L3 (database/API)
- **Graviton vs x86**: Always choose Graviton (r7g/m7g) for 20% cost reduction at identical performance

## When To Use
- Redis: Primary cache for production Laravel apps needing cache tags, sessions, queues
- Memcached: Simple key-value cache with no persistence needs; budget-constrained
- Memo driver: Always-enable optimization (Laravel 13.x); reduces Redis load with no configuration

## When NOT To Use
- Redis: Do not use if cache budget is under $15/month (use memo + database query cache instead)
- Memcached: Do not use if you need cache tags, atomic operations, or data persistence
- Memo driver: Not applicable for Laravel < 13.x

## Best Practices
- **Always use Graviton nodes**: 20% cheaper than x86 with identical performance (WHY: ARM Graviton has better price-performance for Redis workloads)
- **Right-size by monitoring**: Track used_memory vs maxmemory; overallocation is the #1 cost driver (WHY: over-provisioning 2x memory doubles cost with zero benefit)
- **Enable memo driver**: In Laravel 13.x, add `memo` cache driver on top of Redis (WHY: reduces Redis GET calls by 50-80%, reducing connection pool pressure and node sizing)
- **Multi-purpose Redis**: Share Redis between cache, sessions, queues using separate DB numbers (WHY: reduces node count; each Redis node can serve multiple purposes safely)

## Architecture Guidelines
- Use Redis for production, Memcached only for simple cache with no persistence needs
- Start with cache.t4g.small ($12/month) for low-traffic apps, scale up as needed
- For apps under 1M requests/day: Redis cache.t4g.micro is sufficient
- For apps over 10M requests/day: cache.r7g.large or cluster mode with multiple shards
- Never run Memcached for cache+queue; use Redis for multi-purpose

## Performance Considerations
- Redis sub-ms latency for hot keys (<1ms); Memcached similar but no data structure overhead
- Memo driver eliminates network round-trip for repeated lookups (0ms vs 1-5ms Redis)
- Cluster mode adds ~1ms overhead for multi-key operations across shards
- Network throughput scales with node size; larger nodes get better bandwidth per GB

## Security Considerations
- Enable encryption in-transit (TLS) for Redis/Memcached; disable in same-VPC-only
- Use IAM authentication for ElastiCache (Redis 7+); avoid password-only auth
- ElastiCache must be in private subnets; never expose to internet
- Separate Redis clusters per environment (dev/staging/prod) to prevent cross-environment data leakage

## Common Mistakes
1. **Over-provisioning memory**: Allocating 2x+ needed memory based on "safety margin" (Cause: not monitoring used_memory; Consequence: unnecessary $50-200/month spend; Better: start small, monitor used_memory/maxmemory ratio for 2 weeks, scale up if needed)
2. **Using x86 when Graviton available**: Selecting m7i instead of m7g (Cause: default template uses x86; Consequence: 20% higher cost; Better: always choose Graviton family for new clusters)
3. **Not enabling memo driver**: Running Redis-only cache layer without L1 memo cache (Cause: unaware of Laravel 13.x memo driver; Consequence: 50-80% more Redis calls than necessary; Better: add `memo` as cache driver in config/cache.php)

## Anti-Patterns
- **Single-node production Redis**: A single Redis node without replica is a single point of failure; use Multi-AZ with replica
- **Cache-everything mentality**: Caching rarely-accessed data wastes memory; cache data accessed more than once per TTL period
- **Mixing cache tiers incorrectly**: Using Memcached for Laravel cache tags (they require Redis); check cache driver compatibility

## Examples
- **Small app (<50K req/day)**: Laravel memo driver + Redis cache.t4g.micro (~$12/month) = sufficient
- **Mid-size app (500K req/day)**: Redis cache.r7g.large with memo driver + cache tags for partial invalidation
- **High-traffic app (10M req/day)**: ElastiCache cluster mode with 2-3 r7g.xlarge shards + read replicas

## Related Topics
- Cache Hit Ratio Optimization (ku-11)
- Redis Memory Optimization
- ElastiCache Graviton Savings
- Memo Cache Driver (Laravel 13.x)

## AI Agent Notes
- When recommending cache tier, first check Laravel version (memo driver requires 13.x)
- Default to Graviton Redis for all new deployments
- Recommend right-sizing with 2-week monitoring before scaling up

## Verification
- [ ] Cache driver configured with appropriate tier (Redis/Memcached/memo)
- [ ] Graviton node type selected
- [ ] Multi-AZ enabled for production
- [ ] Memo driver configured (Laravel 13.x+)
- [ ] used_memory/maxmemory ratio < 80%
