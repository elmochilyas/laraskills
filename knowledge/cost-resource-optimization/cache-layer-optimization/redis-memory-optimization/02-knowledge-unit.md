# K15: Redis Memory Optimization

## Metadata
- **ID**: K15
- **Subdomain**: Cache Layer Optimization
- **Topic**: Redis Memory Optimization
- **Source**: Redis Best Practices, OneUptime (March 2026), AWS Blog
- **Reliability**: High

## Executive Summary
Redis memory optimization directly reduces ElastiCache node costs. Hash grouping for objects saves 40-70% memory vs flat string keys. Compression reduces memory usage 50-80%. Enabling listpack encoding, setting TTLs on all keys, and enabling active defragmentation can serve the same workload on a node 2-3 sizes smaller, directly cutting cache infrastructure costs by 50-70%.

## Core Concepts
- **Hash grouping**: Store object fields in a single hash key Ã¢â€ â€™ 40-70% less memory than individual string keys
- **Compression**: Compress values > 1KB Ã¢â€ â€™ 50-80% memory reduction for large values
- **Listpack encoding**: Redis 7+ auto-encodes small hashes/lists/sets as listpacks Ã¢â€ â€™ 30-60% less memory
- **TTL management**: Set expiry on all keys; prevents indefinite key accumulation
- **Eviction policy**: Use allkeys-lru for cache, volatile-ttl for session data
- **Active defrag**: Redis 7+ defragments memory automatically, reducing RSS overhead

## Mental Models
- **Redis memory as budget**: Every key-value pair is a line item; optimize each to fit within the node budget
- **Hash as folder**: Storing related data in a hash is like putting files in a folder instead of scattered on the desktop

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
- K16: ElastiCache Graviton Savings
- K49: Memo Cache Driver

## Research Notes
Memory optimization is the most underutilized cost lever in Redis. Most Laravel teams treat Redis as a black box. Key actionable steps: (1) Use Laravel's built-in cache tags with Redis Ã¢â‚¬â€ they automatically use hash structures; (2) Compress cached view fragments and API responses; (3) Monitor used_memory vs used_memory_rss ratio Ã¢â‚¬â€ high fragmentation indicates need for active defrag; (4) Use `redis-cli --big-keys` to find largest memory consumers. A well-optimized Redis can serve the same workload on 2-3 sizes smaller node.
