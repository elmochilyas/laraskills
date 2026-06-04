# Skill: Design SP-GiST Indexes for Skewed Data Distributions

## Purpose

Use PostgreSQL SP-GiST indexes for data that can be naturally partitioned into non-overlapping regions — quadtrees for 2D points, radix trees for string prefixes, and k-d trees for multi-dimensional data — when data distribution is highly skewed and B-Tree or GiST struggle.

## When To Use

- Geographic point data with highly non-uniform distribution
- String prefix search (autocomplete, dictionary lookup)
- IP address network containment queries
- Skewed data distributions

## When NOT To Use

- Uniformly distributed data (B-Tree or GiST is simpler)
- Simple equality or range queries on scalar types

## Prerequisites

- Confirmation that data distribution is skewed
- Understanding of space-partitioning concepts

## Inputs

- Data type (point, text, inet)
- Data distribution characteristics
- Query pattern (nearest-neighbor, prefix, containment)

## Workflow

1. Confirm data has skewed distribution (most values in few regions)
2. Choose SP-GiST over GiST only for specific skewed cases
3. Create index: `DB::statement('CREATE INDEX ON locations USING SPGIST (point_col)')`
4. For text: `CREATE INDEX ON dictionary USING SPGIST (word text_ops)`
5. Verify with EXPLAIN

## Validation Checklist

- [ ] Data distribution is meaningfully skewed
- [ ] GiST is insufficient for the query pattern
- [ ] SP-GiST operator class supports the query operators

## Common Failures

### Using SP-GiST when GiST suffices
GiST is more general and better tested for most spatial workloads. SP-GiST is only better for specific skewed distributions.

## Decision Points

### SP-GiST vs GiST?
GiST for general spatial workloads. SP-GiST for skewed distributions where space partitioning provides better pruning.

### SP-GiST vs B-Tree for text?
SP-GiST radix tree for prefix search. B-Tree for equality and ordering.

## Performance Considerations

SP-GiST handles skewed data efficiently by partitioning by data density. It's more specialized than GiST and may not be as well-optimized for all workloads.

## Security Considerations

SP-GiST indexes don't affect security. Ensure appropriate access controls on the indexed data.

## Related Rules

- Use SP-GiST only when GiST doesn't suffice for skewed data
- Choose appropriate operator class for the data type
- Verify with EXPLAIN

## Related Skills

- Design GiST Indexes for Geospatial and Range Queries
- Design GIN Indexes for JSONB and Full-Text
- Apply Spatial Indexes for Geospatial Queries

## Success Criteria

- Data distribution confirmed as meaningfully skewed
- SP-GiST provides performance improvement over GiST
- EXPLAIN confirms index usage
- Operator class matches query operators
