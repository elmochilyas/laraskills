# Skill: Implement Hash-Based Sharding

## Purpose

Distribute data across shards by hashing the shard key, providing even distribution and predictable routing.

## When To Use

- Even data distribution is the primary requirement
- Shard key has high cardinality
- Range queries across shards are rare or acceptable to scatter
- Adding/removing shards is infrequent

## When NOT To Use

- Range queries on the shard key are frequent (hash scatters across shards)
- Shard count changes frequently (modulo N requires full re-shard)
- Data must be physically ordered by the shard key

## Prerequisites

- Shard key selected
- Shard count determined (power of 2 recommended)
- Hash function implementation (CRC32, MD5, custom)

## Inputs

- Shard key value
- Number of shards (N)
- Hash function

## Workflow (numbered steps)

1. Choose hash function: `crc32($key) % N` or `md5($key) % N`
2. For each query: compute `$shardId = ShardRouter::hash($shardKey) % $totalShards`
3. Route query to `DB::connection('shard_'.$shardId)`
4. For writes: insert data with hash-based shard assignment
5. For reads with shard key: compute shard and query directly (no fan-out)
6. For reads without shard key: fan-out to all shards and aggregate

## Validation Checklist

- [ ] Hash function distributes keys evenly (simulate with sample data)
- [ ] Same key always maps to same shard (deterministic)
- [ ] Queries with shard key route to single shard
- [ ] Queries without shard key fan-out correctly

## Common Failures

- Hash function produces collisions (different keys → same shard) — OK
- Modulo N change requires all data to move (when N changes)
- Hash function not deterministic — same key routes to different shards

## Decision Points

- CRC32 vs MD5 vs custom hash function
- Consistent hashing vs modulo hashing

## Performance Considerations

- Hash computation: nanoseconds (CRC32) to microseconds (MD5)
- Modulo N: all keys remap when N changes (full re-shard)
- Consistent hashing: only 1/N keys move when N changes

## Security Considerations

- Hash function should not expose shard key values
- Shard routing should not be predictable by external users

## Related Rules

- 6-2-1: Always Use Deterministic Hash Function
- 6-2-2: Never Use Modulo With Changing Shard Count

## Related Skills

- Select a Shard Key
- Implement Consistent Hashing
- Implement Shard Routing

## Success Criteria

- Data distributed evenly across shards (±10% of uniform)
- All queries with shard key hit exactly one shard
- Hash function is deterministic and fast

---

# Skill: Implement Modulo vs Consistent Hashing

## Purpose

Choose between modulo and consistent hashing strategies based on shard count stability and rebalancing requirements.

## When To Use

- Evaluating hash-based sharding strategies
- Shard count may change over time (favor consistent hashing)
- Shard count is fixed (modulo is simpler)

## When NOT To Use

- Range-based or directory-based sharding already selected
- Consistent hashing adds unnecessary complexity for fixed shard count

## Prerequisites

- Understanding of hash-based sharding
- Knowledge of shard count stability

## Inputs

- Expected shard count growth
- Rebalancing tolerance (data movement limit)
- Operational complexity budget

## Workflow (numbered steps)

1. Modulo hashing (`key % N`):
   - Use when: N is fixed or changes very rarely
   - Tradeoff: adding a shard requires remapping ALL keys (full re-shard)
   - Simpler to implement and understand
2. Consistent hashing (ring-based):
   - Use when: shards may be added or removed
   - Tradeoff: adding a shard remaps only 1/N of keys
   - Requires virtual nodes for even distribution
3. Implement chosen strategy with ShardRouter class
4. Test with simulated shard count changes

## Validation Checklist

- [ ] Strategy matches shard count stability requirements
- [ ] Adding a shard moves correct proportion of data
- [ ] Data distribution is even after rebalancing

## Common Failures

- Using modulo when shard count changes frequently (massive data movement)
- Consistent hashing with too few virtual nodes (uneven distribution)
- Not testing rebalancing with production-like data volume

## Decision Points

- Modulo for fixed shard count vs consistent hashing for dynamic count
- Virtual node count for consistent hashing (100-1000 per physical shard)

## Performance Considerations

- Modulo: O(1) computation, O(N) data movement on change
- Consistent hashing: O(log V) lookup (binary search on ring), O(1/N) data movement

## Security Considerations

- Routing strategy should not leak data distribution information

## Related Rules

- 6-2-1: Always Use Deterministic Hash Function

## Related Skills

- Implement Hash-Based Sharding
- Implement Shard Rebalancing
- Implement Shard Splitting

## Success Criteria

- Strategy correctly handles expected shard count changes
- Data movement on rebalance is within acceptable limit
- Routing performance is acceptable (< 1ms per lookup)
