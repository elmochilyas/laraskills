# Skill: Choose Between Modulus and Consistent Hashing

## Purpose

Select the appropriate hash-based sharding strategy based on shard count stability and rebalancing requirements.

## When To Use

- Evaluating hash-based sharding approaches
- Shard count may change over time
- Need to minimize data movement during rebalancing

## When NOT To Use

- Non-hash-based sharding (range, directory)
- Shard count is fixed and will not change
- Simpler approach (modulo) meets requirements

## Prerequisites

- Understanding of hash-based sharding
- Knowledge of shard count stability
- Data movement tolerance assessment

## Inputs

- Expected shard count changes
- Data movement cost (time, bandwidth, risk)
- Operational complexity budget

## Workflow (numbered steps)

1. Evaluate modulo hashing (`key % N`):
   - All keys remap when N changes — full data rebalancing
   - Simple to implement and reason about
   - Use when: shard count fixed or changes very rarely
   - Not suitable for: dynamic scaling, frequent rebalancing
2. Evaluate consistent hashing (ring-based):
   - Only 1/N of keys move when N changes
   - More complex to implement
   - Use when: shard count changes, rebalancing is frequent
   - Not suitable for: simple use cases where modulo is sufficient
3. Choose based on:
   - Shard count stability: stable → modulo; changing → consistent
   - Data volume: large → consistent (less data movement)
   - Team expertise: experienced → consistent; less experienced → modulo
4. Implement chosen approach with appropriate tuning
5. Test with shard count changes to validate data movement

## Validation Checklist

- [ ] Strategy aligns with shard count stability requirements
- [ ] Data movement on shard change is as expected
- [ ] Routing is deterministic
- [ ] Implementation is correct and testable

## Common Failures

- Using modulo when shard count changes — massive data movement
- Consistent hashing with too few virtual nodes — uneven distribution
- Not testing rebalancing scenario — surprises in production

## Decision Points

- Modulo for fixed shard count vs consistent hashing for dynamic
- Virtual node count for consistent hashing
- Hash function choice

## Performance Considerations

- Modulo: O(1) routing, O(N) data movement on change
- Consistent hashing: O(log V) routing, O(1/N) data movement
- Data movement cost: bandwidth, time, risk of inconsistency

## Security Considerations

- Neither approach exposes data contents
- Routing information should be internal only

## Related Rules

- 6-20-1: Always Test Shard Count Change Impact
- 6-20-2: Never Use Modulo If Shard Count Changes Frequently

## Related Skills

- Implement Hash-Based Sharding
- Implement Consistent Hashing
- Implement Shard Rebalancing

## Success Criteria

- Chosen strategy meets data movement requirements
- Adding/removing shards moves correct proportion of data
- Routing remains correct during and after rebalancing

---

# Skill: Implement Consistent Hashing

## Purpose

Implement a consistent hashing ring that distributes keys across shards with minimal data movement when shards are added or removed.

## When To Use

- Shard count changes over time
- Minimizing data movement during rebalancing is critical
- Need for dynamic scaling (add/remove shards without full re-shard)

## When NOT To Use

- Shard count is fixed (modulo is simpler)
- Implementation complexity is a concern
- Virtual node management is too complex

## Prerequisites

- Understanding of consistent hashing concepts (ring, virtual nodes)
- Hash function selection
- Shard routing infrastructure

## Inputs

- List of physical shards
- Virtual node count per shard
- Hash function (MD5, SHA1, or custom)

## Workflow (numbered steps)

1. Create hash ring data structure (sorted array of (hash, shard_id) pairs)
2. Assign each physical shard V virtual nodes with different hash positions
3. To route a key: compute its hash, find the next hash on the ring (clockwise), return shard
4. To add a shard: assign its V virtual nodes to ring positions, redistribute data for affected keys
5. To remove a shard: reassign its virtual nodes' keys to next shard on ring
6. Ensure even distribution: V >= 100 per physical shard
7. Implement ring persistence (config or database)

## Validation Checklist

- [ ] Keys route consistently to same shard
- [ ] Adding a shard moves only ~1/N of keys
- [ ] Removing a shard redistributes only its keys
- [ ] Virtual nodes provide even distribution

## Common Failures

- Too few virtual nodes — distribution is uneven
- Hash function collisions — keys map to different positions
- Ring not persisted — routing changes after restart

## Decision Points

- Virtual node count: more = better distribution, more memory
- Hash function: MD5 (fast, good distribution) vs SHA1 (slower, better)

## Performance Considerations

- Routing: O(log V) with binary search (V = total virtual nodes)
- Memory: V × (hash + shard_id) bytes (e.g., 1000 × 12 bytes = 12KB)
- Adding/removing shard: O(V log V) to rebuild sorted ring

## Security Considerations

- Hash ring structure is internal — should not be exposed
- Hash function choice does not affect security

## Related Rules

- 6-20-1: Always Test Shard Count Change Impact

## Related Skills

- Choose Between Modulus and Consistent Hashing
- Implement Hash-Based Sharding
- Implement Shard Rebalancing

## Success Criteria

- Adding or removing a shard moves exactly ~1/N of keys
- Distribution across shards is within ±10% of uniform
- Routing is deterministic and fast (< 1ms)
