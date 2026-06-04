# K16: ElastiCache Graviton Savings

## Metadata
- **ID**: K16
- **Subdomain**: Cache Layer Optimization
- **Topic**: ElastiCache Graviton Savings
- **Source**: AWS Documentation, AWS Blog (2023)
- **Reliability**: High

## Executive Summary
ElastiCache Graviton nodes (m7g/r7g) are 20% cheaper than equivalent x86 nodes (m7i/r7i) with identical or better performance for Redis/Valkey workloads. Migration is a simple scaling operation during maintenance window. For a production ElastiCache cluster with replication, this translates to 20% direct cost reduction on cache infrastructure.

## Core Concepts
- **Savings**: 20% vs x86 equivalent
- **Performance**: Equal or better for Redis/Valkey workloads
- **Migration**: Modify cluster node type; done during maintenance window
- **Available sizes**: large to 16xlarge
- **Redis compatibility**: Redis 6+ and Valkey fully support ARM

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
- K26: Graviton Price-Performance

## Research Notes
ElastiCache Graviton pricing is 5% lower list price than previous-gen x86 (m6g vs m5), but the real savings come from comparing to current-gen x86 (m7i) where Graviton is 20% cheaper. The 25% memory reservation for non-data overhead (RSS, buffers, replication backlog) applies to both Graviton and x86 equally. For Redis replication, the 3x overhead factor (1 primary + 2 replicas) means Graviton savings compound across the entire cluster.

## Mental Models

- **Cost as a metric**: Treat cloud cost as a first-class operational metric alongside latency, error rate, and throughput. Track cost per request, cost per user, and cost per feature.
- **Provisioning vs. consumption**: Reserved capacity buys a discount in exchange for commitment. On-demand pays full price for flexibility. Choose based on workload predictability.
- **Waste as debt**: Over-provisioned resources, unused instances, and orphaned storage are cost debt that compounds monthly. Regular cost audits identify and eliminate waste.
- **Economies of scale**: Larger instances, savings plans, and reserved capacity reduce per-unit costs. Consolidate workloads to benefit from volume discounts.
