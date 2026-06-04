# Rules: Multi-Region ClickHouse Replication and Sharding

## Rule MR-01: Async Cross-Region Replication
Cross-region replication MUST be asynchronous. Synchronous cross-region replication adds unacceptable INSERT latency.

## Rule MR-02: Region-Local Keeper
ClickHouse Keeper MUST be deployed within each region. Cross-region Keeper quorums create latency bottlenecks.

## Rule MR-03: Read from Local Shards
Distributed tables MUST be configured to prefer local replicas (`prefer_localhost_replica = 1`). Cross-region queries add unnecessary latency.

## Rule MR-04: Monitor Replication Lag
Cross-region replication lag MUST be monitored via `system.replicas`. Alert when lag exceeds target RPO.

## Rule MR-05: Right-Size Shard Count
Each shard SHOULD contain 50M-500M rows. Too many shards increases query distribution overhead; too few limits parallelism.

## Rule MR-06: Test Failover Regularly
Multi-region failover MUST be tested at least quarterly. Documentation and automation of the failover process are required.

## Rule MR-07: TLS for Inter-Node Communication
Cross-region ClickHouse communication MUST use TLS. Data travels over public internet or shared infrastructure.

## Rule MR-08: Data Residency Compliance
Sharding and replication MUST respect data residency requirements. Customer data must not leave designated regions.

## Rule MR-09: Shard by User Region
Sharding key SHOULD align with user geographic distribution for data locality. EU users → EU shards.

## Rule MR-10: Intra-Region Quorum
Synchronous quorum MUST be configured only for intra-region replicas. Cross-region quorum is not permitted.
