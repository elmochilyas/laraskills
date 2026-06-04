# Decomposition: 6.3 Range-based sharding (key ranges, predictable splits)

## Topic Overview
Range-based sharding assigns contiguous key ranges to each shard: shard 1 (users 1-1M), shard 2 (users 1M-2M), etc. Predictable, supports range scans within a shard, easy to split hot ranges. Risk of uneven distribution if ranges are poorly chosen.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
6-3-range-based-sharding/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 6.3 Range-based sharding (key ranges, predictable splits)
- **Purpose:** Range-based sharding assigns contiguous key ranges to each shard: shard 1 (users 1-1M), shard 2 (users 1M-2M), etc. Predictable, supports range scans within a shard, easy to split hot ranges.
- **Difficulty:** Advanced
- **Dependencies:** 6.1 Shard key, 6.2 Hash-based sharding, 6.10 Shard rebalancing

## Dependency Graph
**Depends on:** "6.1 Shard key", "6.2 Hash-based sharding", "6.10 Shard rebalancing"

**Depended on by:** More advanced KUs in Database Sharding & Horizontal Scaling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Contiguous ranges**: Each shard owns a range of shard key values. `users.id BETWEEN 1 AND 1000000` goes to shard 1.; - **Range scan friendly**: `WHERE id BETWEEN 500 AND 600` targets a single shard. Hash-based sharding scatters the same query across all shards.; - **Hot range**: New users all go to the last shard (monotonically increasing key). Write-heavy shard while others are idle..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization