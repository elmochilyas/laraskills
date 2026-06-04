# Skill: Choose Between Partitioning and Sharding

## Purpose

Decide whether to use partitioning (within a single server) or sharding (across servers) based on data size, write throughput, query patterns, and operational complexity.

## When To Use

- Designing data architecture for scale
- Evaluating whether partitioning alone is sufficient
- Considering sharding for cross-server scale-out
- Migrating from single-server to distributed data

## When NOT To Use

- Single-server solution is sufficient for the foreseeable future
- Decision already made (partitioning or sharding chosen)
- Simpler alternatives (indexing, caching, replicas) haven't been exhausted

## Prerequisites

- Understanding of data size (current and projected)
- Understanding of write throughput (peak and average)
- Query pattern analysis (which keys in WHERE)
- Operational capabilities (sharding requires more ops expertise)

## Inputs

- Current data size
- Projected growth (1 year, 3 years, 5 years)
- Peak write throughput (TPS/QPS)
- Query patterns (single-key lookups vs range scans vs aggregates)
- Budget for infrastructure

## Decision Framework (numbered steps)

1. Evaluate data size:
   - Data fits on one server (< 500GB): **partitioning** is sufficient
   - Data may exceed one server (> 1TB): consider **sharding**
   - Data will always fit on one server: **partitioning** (simpler)

2. Evaluate write throughput:
   - Write throughput fits a single server (< 10K writes/sec): **partitioning**
   - Write throughput exceeds single server: **sharding**
   - Partition count can distribute writes: **composite partitioning** (hash + range)

3. Evaluate query patterns:
   - Queries always include a partition key (date): **partitioning** works well
   - Queries include a shard key (user_id, tenant_id): **sharding** works well
   - Cross-shard queries needed: **partitioning** (simpler) or **sharding** with fan-out

4. Evaluate operational complexity:
   - Small team, limited ops: **partitioning** (simpler)
   - Team has distributed sys exp: **sharding** possible
   - Need archival/lifecycle management: **partitioning** (DROP PARTITION)

5. Decision summary:
   - **Choose partitioning** when: data fits one server, lifecycle management needed, queries include partition key
   - **Choose sharding** when: data exceeds one server, write throughput exceeds one server, geographic distribution needed
   - **Combine both**: shard by user_id across servers, partition by month within each shard

## Validation Checklist

- [ ] Data size fits single server (partitioning) or requires multiple servers (sharding)
- [ ] Write throughput within single server capability (partitioning)
- [ ] Query patterns support partition pruning (partitioning) or shard key routing (sharding)
- [ ] Operational team can handle chosen complexity
- [ ] Migration path exists from partitioning to sharding (if data grows)
- [ ] Cost model supports the chosen approach

## Common Failures

- Premature sharding: 100GB table on 2TB-capable server — unnecessary complexity
- Partitioning too late: data already exceeds single server, migration painful
- Sharding without collocation: cross-shard transactions fail frequently
- Both approaches together without clear separation of concerns
- Choosing sharding without cross-shard query strategy

## Decision Points

- Partitioning-first approach (start with partitioning, migrate to sharding if needed)
- Cost: sharding requires more servers (hardware or cloud instances)
- Team skills: partitioning is simpler, sharding requires distributed systems knowledge
- Future growth: partitioning accommodates moderate growth, sharding scales horizontally

## Performance Considerations

- Partitioning: query within one server, partition pruning reduces scan
- Sharding: data distributed, query routed to specific shard or all shards (fan-out)
- Partitioning: DROP PARTITION for instant archival
- Sharding: resharding for data redistribution (costly)
- Combined: best of both — shard for scale, partition for lifecycle

## Security Considerations

- Partitioning: all data on one server, single access control
- Sharding: data distributed, access controls per shard
- Combined: more complex security model, consistent policies needed
- Both: encryption in transit/replication between nodes

## Related Rules

- 8-18-1: Start With Partitioning Before Sharding
- 8-18-2: Choose Sharding Only When Data Exceeds Single Server

## Related Skills

- Implement Range Partitioning
- Implement Horizontal Sharding
- Implement Shard Key Selection

## Success Criteria

- Decision between partitioning and sharding based on data size and throughput
- Partitioning-first approach when possible (simpler, adequate for most cases)
- Sharding chosen only when data exceeds single server capacity
- Migration plan from partitioning to sharding documented (if needed)
- Combined approach used when both lifecycle management and horizontal scale needed
