# Skills: Multi-Region ClickHouse Replication and Sharding

## Skill: Configuring Multi-Region ClickHouse
**Purpose:** Set up ClickHouse replication and sharding across multiple regions.
**When to use:** Deploying ClickHouse for multi-region HA or data locality.
**Steps:**
1. Deploy ClickHouse nodes in each region (2-3 replicas per shard)
2. Deploy ClickHouse Keeper per region (3 nodes minimum)
3. Configure `RemoteServers` in `config.xml` for cluster definition
4. Create `ReplicatedMergeTree` tables on each node
5. Create `Distributed` tables with local replica preference
6. Configure cross-region async replication
7. Monitor replication lag and query performance

## Skill: Sharding Strategy Design
**Purpose:** Design a sharding strategy that balances data distribution and query performance.
**When to use:** Scaling ClickHouse horizontally across regions.
**Steps:**
1. Analyze data distribution by user region
2. Select sharding key (consistent hash of user_id or tenant_id)
3. Determine shard count based on data volume (50M-500M rows/shard)
4. Map shards to regions based on data locality
5. Create Distributed table with `sharding_key` expression
6. Test query performance across shards
7. Monitor shard imbalance and rebalance if needed
