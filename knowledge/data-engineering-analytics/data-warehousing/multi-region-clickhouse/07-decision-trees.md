# Decision Trees: Multi-Region ClickHouse Replication and Sharding

## Decision: Replication Strategy

**Q: What is the RPO requirement?**
- < 1 second → Synchronous intra-region, async cross-region
- < 1 minute → Async cross-region with low-lag config
- < 1 hour → Async cross-region with batch replication

**Q: How many regions?**
- 2 → Primary + DR (async replication to DR)
- 3+ → Active-active with sharding per region

## Decision: Sharding Strategy

**Q: Do users access data specific to their region?**
- Yes → Shard by user region (data locality)
- No → Shard by hash of primary key (balanced distribution)

**Q: What is the expected data growth?**
- < 1TB/year → 1-2 shards
- 1-10TB/year → 2-4 shards
- 10TB+/year → 4-16 shards
