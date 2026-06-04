# ElastiCache Graviton Savings Rules

## Rule 1: Default to Graviton for All New Deployments
- **Category**: Cost Management
- **Rule**: Always select Graviton node types (m7g/r7g) for new ElastiCache clusters
- **Reason**: Graviton nodes are 20% cheaper than equivalent x86 nodes with identical or better performance for Redis/Valkey workloads; no code changes needed
- **Bad Example**: Selecting m7i.xlarge (x86) for a new ElastiCache cluster, paying 20% more than the equivalent m7g.xlarge (Graviton)
- **Good Example**: Choosing r7g.large from the start, saving 20% with no performance tradeoff
- **Exceptions**: Redis modules or plugins that do not support ARM architecture
- **Consequences Of Violation**: 20% higher cache infrastructure cost for the same performance

## Rule 2: Migrate Existing x86 Clusters During Maintenance Window
- **Category**: Cost Management
- **Rule**: Migrate existing x86 ElastiCache clusters to Graviton during a scheduled maintenance window
- **Reason**: Migration is a single node type modification operation; the cluster is briefly read-only during transition; 20% savings with minimal disruption
- **Bad Example**: Keeping x86 clusters indefinitely because migration "seems risky," paying 20% extra every month
- **Good Example**: Scheduling a maintenance window during low traffic, modifying node type to Graviton, and monitoring after migration
- **Exceptions**: Clusters running Redis versions that do not support Graviton (Redis 5.x or earlier)
- **Consequences Of Violation**: 20% ongoing cost premium for cache infrastructure with no performance benefit

## Rule 3: Re-Evaluate Sizing After Graviton Migration
- **Category**: Performance
- **Rule**: Monitor CPU utilization after Graviton migration and consider downsizing if utilization drops significantly
- **Reason**: Graviton4's better integer performance may handle Redis more efficiently per vCPU, potentially allowing a smaller node size for additional savings
- **Bad Example**: Migrating to Graviton but keeping the same node size; CPU utilization drops from 40% to 20%, indicating over-provisioning
- **Good Example**: After Graviton migration, monitoring CPU for 1 week; if CPU remains below 30%, downsizing to the next smaller node type
- **Exceptions**: Memory-bound workloads where CPU utilization is not the limiting factor
- **Consequences Of Violation**: Missing additional cost savings; paying for over-provisioned CPU capacity

## Rule 4: Graviton Savings Compound Across Replication
- **Category**: Cost Management
- **Rule**: Apply Graviton to all nodes in a replication group (primary + replicas) for maximum savings
- **Reason**: A production cluster with 1 primary + 2 replicas = 3 nodes; Graviton saves 20% on each, compounding the total savings across the entire cache spend
- **Bad Example**: Migrating only the primary to Graviton but keeping replicas on x86, only achieving partial savings
- **Good Example**: Migrating all 3 nodes in a production replication group to Graviton, achieving 20% savings on total cluster cost
- **Exceptions**: Multi-region setups where some regions may not have Graviton available for the required node size
- **Consequences Of Violation**: Leaving 20% savings on the table for replica nodes
