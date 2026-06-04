# Skill: Select a Shard Key

## Purpose

Choose a shard key with high cardinality, even distribution, and alignment with the most frequent query patterns to avoid hot shards and fan-out queries.

## When To Use

- Designing a new sharded database architecture
- Evaluating existing shard key for re-sharding
- Before any shard implementation begins

## When NOT To Use

- Non-sharded database architecture
- Post-hoc shard key selection after data is already sharded (very expensive to change)

## Prerequisites

- Understanding of data access patterns (frequent WHERE clauses)
- Data cardinality analysis
- Growth projections

## Inputs

- Query pattern analysis (most frequent WHERE clauses)
- Data distribution analysis (cardinality of candidate keys)
- Growth projections for data volume and throughput

## Workflow (numbered steps)

1. List all frequent query patterns and their WHERE clauses
2. Evaluate candidate shard keys against criteria:
   - High cardinality: many unique values (user_id, tenant_id)
   - Even distribution: each shard gets roughly equal data and throughput
   - Query alignment: most queries include the key in WHERE clause
3. Prefer `user_id` or `tenant_id` for most SaaS applications
4. Consider composite keys: `(tenant_id, user_id)` for multi-tenant sharding
5. Avoid: date-only keys (hot shard), status fields (low cardinality), nullable columns
6. Document shard key decision with rationale and expected distribution

## Validation Checklist

- [ ] Shard key has high cardinality (> 1M unique values)
- [ ] Most frequent queries include the shard key
- [ ] Data distributes evenly across shards (simulate with existing data)
- [ ] Hot shard avoidance confirmed with write pattern analysis

## Common Failures

- Date-only shard key: all writes go to current month's shard
- Low-cardinality key: few shards get all data, rest are empty
- Shard key not in WHERE clause: every query fans out to all shards

## Decision Points

- Simple vs composite shard key
- Natural key (user_id) vs synthetic key (generated ID)

## Performance Considerations

- Fan-out queries: N parallel queries bounded by slowest shard
- Hot shard: one shard handles 80% of traffic, rest idle
- Shard key change requires full data re-shard — choose carefully

## Security Considerations

- Shard key may expose data distribution patterns (e.g., tenant size)
- Shard key should not contain sensitive data

## Related Rules

- 6-1-1: Choose High-Cardinality Shard Key
- 6-1-2: Never Rely On Cross-Shard Transactions

## Related Skills

- Implement Hash-Based Sharding
- Implement Range-Based Sharding
- Implement Directory-Based Sharding

## Success Criteria

- Shard key is used in > 90% of queries
- Data distribution across shards is within ±10% of uniform
- Zero hot shards under normal workload

---

# Skill: Evaluate Shard Key Candidate Using Production Data

## Purpose

Analyze production query patterns and data distribution to validate shard key candidates before implementation.

## When To Use

- Before committing to a shard key
- After significant data growth (re-validate shard key)
- When query patterns change significantly

## When NOT To Use

- New application with no production data (use best-practice defaults)
- Shard key already proven with similar workload

## Prerequisites

- Access to production query logs and data samples
- Scripting capability (Python, SQL) for analysis

## Inputs

- Production query logs (24-72 hours)
- Data distribution statistics
- Write pattern analysis

## Workflow (numbered steps)

1. Extract WHERE clauses from query logs for the past 7 days
2. For each candidate shard key, count:
   - Queries that include the key (coverage %)
   - Unique values (cardinality)
   - Row count per key value (distribution)
3. Simulate shard assignment: group key values into N shards, measure distribution
4. Identify hot keys (key values with disproportionate data or queries)
5. Document findings and recommend shard key

## Validation Checklist

- [ ] Candidate keys evaluated against real query patterns
- [ ] Distribution simulation confirms even spread
- [ ] Hot keys identified and mitigated or accepted
- [ ] Recommendation documented with data

## Common Failures

- Query log sample too small — misses important patterns
- Distribution analysis based on row count but throughput matters more
- Hot key analysis doesn't consider future growth

## Decision Points

- Coverage vs distribution tradeoff (best coverage may not be best distribution)

## Performance Considerations

- Query log analysis: process millions of queries (use sampling if needed)
- Distribution simulation: O(rows) — may need sampling for large datasets

## Security Considerations

- Query logs may contain sensitive data — restrict access
- Anonymize data for analysis

## Related Rules

- 6-1-1: Choose High-Cardinality Shard Key

## Related Skills

- Select a Shard Key
- Implement Hash-Based Sharding

## Success Criteria

- Shard key candidate validated with real data
- Coverage > 90% and distribution within ±10%
- Hot keys identified and documented for monitoring
