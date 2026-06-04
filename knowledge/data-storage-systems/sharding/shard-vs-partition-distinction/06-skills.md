# Skill: Distinguish Sharding from Partitioning

## Purpose

Understand the architectural differences between sharding (horizontal scaling across servers) and partitioning (data organization within a server) to choose the right approach.

## When To Use

- Evaluating data distribution strategies
- Designing database architecture for scale
- Deciding between partitioning and sharding
- Explaining the difference to stakeholders

## When NOT To Use

- Already committed to one approach
- Scale requirements are clear and simple

## Prerequisites

- Understanding of database architecture options
- Data volume and throughput projections

## Inputs

- Current data volume and growth projections
- Performance requirements (latency, throughput)
- Operational complexity budget

## Workflow (numbered steps)

1. Define partitioning: splitting a table within a single database server for lifecycle management and query optimization
2. Define sharding: splitting data across multiple database servers for horizontal scale
3. Compare characteristics:
   - Partitioning: single server, global indexes (PG), partition pruning, DDL per partition
   - Sharding: multiple servers, cross-shard queries, distributed transactions impossible, rebalancing needed
4. Choose partitioning when:
   - Data fits on one server
   - Lifecycle management (archival, retention) is primary driver
   - Queries consistently include partition key
5. Choose sharding when:
   - Data exceeds single server capacity
   - Write throughput exceeds single server
   - Geographic distribution needed
6. Consider combining: shard across servers, partition within each shard

## Validation Checklist

- [ ] Decision between partitioning and sharding is documented with rationale
- [ ] Chosen approach meets data volume and performance requirements
- [ ] Operational complexity is acceptable

## Common Failures

- Choosing sharding when partitioning would suffice (unnecessary complexity)
- Choosing partitioning when sharding is needed (data won't fit on one server)
- Not considering combining both approaches

## Decision Points

- Partitioning vs sharding vs combined
- Future growth: will partitioning suffice for 2-3 years?

## Performance Considerations

- Partitioning: faster queries (pruning), instant DROP for archival
- Sharding: horizontal scale, fan-out queries, cross-shard overhead
- Combined: best of both, most operational complexity

## Security Considerations

- Both approaches must maintain data access controls
- Sharding adds cross-server security considerations

## Related Rules

- 6-22-1: Always Choose Simpler Approach First
- 6-22-2: Never Assume Partitioning Provides Horizontal Scale

## Related Skills

- Implement Range Partitioning
- Implement Hash-Based Sharding
- Implement Partitioning vs Sharding Decision Framework

## Success Criteria

- Chosen approach meets data volume and throughput requirements
- Decision documented with clear rationale
- Team understands the chosen approach

---

# Skill: Decide Between Partitioning and Sharding

## Purpose

Use a decision framework to determine whether partitioning, sharding, or a combination is appropriate for the application's data volume, throughput, and query patterns.

## When To Use

- Designing new database architecture
- Existing database approaching capacity limits
- Evaluating scalability options

## When NOT To Use

- Application is single-server with no scale concerns
- Architecture decision already made and implemented

## Prerequisites

- Current and projected data volume
- Current and projected throughput (QPS, write volume)
- Query pattern analysis (partition key usage, range scans)

## Inputs

- Data volume (current + 2-year projection)
- Write throughput (current + 2-year projection)
- Query patterns (partition key in WHERE, range scan frequency)
- Retention requirements (archival, deletion)

## Workflow (numbered steps)

1. Assess data volume: does it fit on a single server (now and in 2 years)?
   - Yes → consider partitioning
   - No → consider sharding
2. Assess write throughput: does it exceed single server capacity?
   - Yes → consider sharding
   - No → consider partitioning or single node
3. Assess query patterns:
   - Frequent range scans with partition key → partitioning
   - Random access with high cardinality key → sharding or hash partitioning
4. Assess operational requirements:
   - Retention/archival → partitioning helps (DROP PARTITION)
   - Geographic distribution → sharding
5. Combine if needed: shard by user_id, partition by date within each shard
6. Document decision with supporting data

## Validation Checklist

- [ ] Data volume and throughput assessed
- [ ] Query patterns analyzed
- [ ] Decision documented with rationale
- [ ] Growth projections factored in

## Common Failures

- Underestimating data growth — partitioning chosen but data overflows server
- Overestimating complexity — sharding chosen when partitioning would suffice
- Not considering combined approach

## Decision Points

- Partitioning vs sharding vs combined
- Timeframe for reevaluation (revisit decision in 12 months)

## Performance Considerations

- Partitioning: efficient queries with partition key, instant archival
- Sharding: horizontal scale, fan-out queries, rebalancing
- Combined: operational complexity, best of both worlds

## Security Considerations

- Both approaches require consistent security controls
- Sharding adds network security considerations

## Related Rules

- 6-22-1: Always Choose Simpler Approach First

## Related Skills

- Distinguish Sharding from Partitioning
- Implement Range Partitioning
- Implement Hash-Based Sharding
- Implement Partitioning vs Sharding Framework

## Success Criteria

- Chosen approach meets all requirements for 2+ years
- Decision documented and understood by team
- Migration path exists if future growth requires different approach
