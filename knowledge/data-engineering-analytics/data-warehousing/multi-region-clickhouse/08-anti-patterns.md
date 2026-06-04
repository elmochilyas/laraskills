# Anti-Patterns: Multi-Region ClickHouse Replication and Sharding

## Synchronous Cross-Region Inserts
Every INSERT must be acknowledged by replicas in all regions. Cross-region latency (50-200ms) is added to every write. Throughput drops from thousands/sec to tens/sec.

**Solution:** Use async replication for cross-region. Synchronous quorum is for intra-region only.

## Single Keeper Across Regions
A single 5-node Keeper cluster spans 3 regions. Keeper leader election must communicate across regions. Every CREATE TABLE, ALTER, and DDL operation waits for cross-region Keeper quorum.

**Solution:** Deploy separate Keeper clusters per region. Use per-region DDL processing.

## No Locality-Based Query Routing
The application connects to ClickHouse in one region and queries the Distributed table, which distributes queries to shards in all regions. Cross-region query latency is added to every user request.

**Solution:** Configure Distributed tables with local replica preference. Route user queries to their nearest ClickHouse region.

## Uneven Sharding
Sharding by `rand()` distributes data evenly but scatters one user's data across all shards. A dashboard query for one user must query all shards and merge results.

**Solution:** Shard by user_id or tenant_id. All data for one user lives on one shard, enabling single-shard queries for user-specific dashboards.
