# ElastiCache Graviton Savings

## Metadata
- **ID**: KU-16-ELASTICACHE-GRAVITON
- **Subdomain**: cache-layer-optimization
- **Domain**: cost-resource-optimization
- **Topic**: ElastiCache Graviton Savings
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
ElastiCache Graviton nodes (m7g/r7g) are 20% cheaper than equivalent x86 nodes (m7i/r7i) with identical or better performance for Redis/Valkey workloads. Migration is a simple scaling operation during maintenance window. For a production ElastiCache cluster with replication, this translates to 20% direct cost reduction on cache infrastructure.

## Core Concepts
- **Savings**: 20% vs x86 equivalent
- **Performance**: Equal or better for Redis/Valkey workloads
- **Migration**: Modify cluster node type; done during maintenance window
- **Available sizes**: large to 16xlarge
- **Redis compatibility**: Redis 6+ and Valkey fully support ARM

## Best Practices
- **Default to Graviton for all new ElastiCache deployments**: 20% savings with identical performance (WHY: Graviton nodes are the same API, same Redis compatibility, same features; the only difference is 20% lower cost; no code changes needed; migration is a single scaling operation)
- **Migrate existing x86 clusters during maintenance window**: Scale operation with minimal impact (WHY: ElastiCache supports in-place node type modification; briefly read-only during transition; schedule during low traffic; monitor after modification)
- **Re-evaluate cluster sizing after Graviton migration**: Graviton may handle Redis better per-vCPU (WHY: Graviton4's better integer performance may allow smaller node size after migration; monitor CPU utilization; if CPU drops significantly, consider downsizing for additional savings)
- **Graviton savings compound across replication**: Primary + replicas all save 20% (WHY: a production cluster with 1 primary + 2 replicas = 3 nodes; Graviton saves 20% on each; total savings = 20% of total cache spend)

## Related Topics
- Redis Memory Optimization (ku-15)
- Graviton Price-Performance (ku-26)
- Cache Tier Selection (ku-??)

## AI Agent Notes
- Default: use Graviton for all ElastiCache clusters
- Migration is simple node type modification; no code changes
- Savings compound across replication (primary + replicas)
- Monitor CPU after migration; may enable further downsizing
