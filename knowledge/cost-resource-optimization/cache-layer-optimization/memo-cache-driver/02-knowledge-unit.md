# K49: Memo Cache Driver

## Metadata
- **ID**: K49
- **Subdomain**: Cache Layer Optimization
- **Topic**: Laravel Memo Cache Driver
- **Source**: Laravel Documentation 13.x, Laravel Blog
- **Reliability**: High

## Executive Summary
Laravel 13.x's memo cache driver stores cached values in memory within a single request, reducing Redis calls by 50-80% for repeated cache lookups. When the same cached value is accessed multiple times during a request (e.g., config, settings, user permissions), memo serves it from local memory instead of querying Redis. This is a zero-configuration optimization that reduces Redis load and network overhead.

## Core Concepts
- **In-memory cache**: Stores values in PHP array for duration of request
- **Redis call reduction**: 50-80% fewer Redis GET commands for repeated lookups
- **Zero config**: Works automatically when configured as cache driver
- **Request-scoped**: Cleared at end of each request (safe for Octane with proper sandboxing)

## Mental Models
- **Memo as notepad**: Jot down information you'll need again in the next few minutes rather than calling the library each time
- **Request-scoped L1 cache**: Like a local cache in front of the distributed cache

## Ecosystem Usage

- **Laravel cache driver**: Redis driver uses phpredis or predis; Cache::tags() stores related keys in Redis hashes internally\n- **Laravel Horizon**: Uses Redis for queue monitoring, job status, and metrics; each Horizon process maintains persistent Redis connection\n- **Laravel Reverb**: WebSocket broadcasting via Redis pub/sub; requires dedicated Redis node for pub/sub workloads\n- **Laravel Octane**: Each Octane worker maintains persistent Redis connection; pool sizing must account for max connections

## Performance Considerations

- Graviton3/4 offers 25-30% better integer performance than Graviton2 at same vCPU count\n- Data tiering latency: hot keys (RAM) <1ms, cold keys (SSD) 1-5ms; acceptable for cache workloads\n- Cluster mode adds ~1ms overhead for multi-key operations across shards\n- Network throughput scales with node size; larger nodes get better bandwidth per GB of memory

## Production Considerations

- Enable auto-failover with Multi-AZ (additional standby node cost, required for production SLA)\n- Monitor Evictions, CacheHits, and CurrConnections metrics; set CloudWatch alarms\n- Use tags for cost allocation per environment/team/application\n- Configure backup retention for DR (additional S3 cost for snapshot storage)\n- Plan for data warming after failover: 5-15 minutes of degraded performance

## Failure Modes

- Eviction storm: sudden traffic surge causes massive key eviction and cache miss avalanche; set maxmemory-policy to allkeys-lru\n- Replication lag: cross-region async replication can lag 1-30 seconds; design for stale reads\n- Split-brain in cluster: network partition creates inconsistent shards; monitor cluster health\n- Backup restore failure: corrupted RDB/AOF file causes failed restore; test restore procedure

## Architectural Decisions

- Choose Graviton nodes over x86 for all new deployments; migrate existing where supported\n- Use data tiering for read-heavy workloads with access skew >80/20\n- Cluster mode vs standalone: cluster mode costs more but scales horizontally\n- Reserved instances for steady-state caches; on-demand for variable or growing workloads

## Tradeoffs

- **Graviton vs x86**: 20% cheaper but may have minor compatibility edge cases with some Redis modules\n- **Data tiering vs all-memory**: 80% cost reduction for cold data but 2-10x latency increase for tiered keys\n- **Cluster mode vs standalone**: Linear scalability but more complex key distribution and cross-slot operations\n- **Reserved vs on-demand**: 55% savings for 3-year commitment vs flexibility to change node types

## Patterns

- Right-size by monitoring used_memory vs allocated: overallocation is the #1 cost driver\n- Use Graviton node types (r7g, r6g) for 20% cost reduction over x86\n- Enable data tiering for workloads with hot/cold access patterns (>50GB datasets)\n- Batch Redis commands in MULTI/EXEC to reduce network round-trips and Lambda invocation costs

## Internal Mechanics

ElastiCache and Redis cost models are driven by node type (graviton vs x86), memory capacity, and data transfer. Redis cluster mode distributes data across shards; each shard is a separate node cost. Reserved nodes offer up to 55% discount over on-demand. Data tiering (Redis 7.4+) automatically moves cold keys to SSD at 1/5th the memory cost.

## Common Mistakes

- Over-provisioning memory for cache workloads (monitor used_memory vs maxmemory)\n- Not enabling data tiering for large datasets (>50GB) where access is skewed\n- Using cluster mode without understanding cross-slot limitations\n- Forgetting to configure reserved instances for steady-state workloads\n- Not monitoring network throughput costs for cross-AZ replication

## Related Knowledge Units
- K15: Redis Memory Optimization
- K38: Laravel Octane Throughput

## Research Notes
The memo driver is available in Laravel 13.x (2025+). It wraps an underlying cache driver (e.g., Redis) with an in-memory layer. For Octane applications, ensure memo state is properly sandboxed per request (Laravel handles this automatically in 13.x). The memo driver reduces Redis connection pool pressure, which is especially beneficial for Fargate/Lambda workers with limited connection counts.
