# Decomposition: 6.1 Shard key selection principles (high cardinality, even distribution, query alignment)

## Topic Overview
Shard key is the single most important decision in sharding. A good shard key has high cardinality, distributes data evenly across shards, and aligns with the most frequent query patterns. A bad shard key creates hot shards, uneven data distribution, and fan-out queries on every read.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
6-1-shard-key-selection-principles/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 6.1 Shard key selection principles (high cardinality, even distribution, query alignment)
- **Purpose:** Shard key is the single most important decision in sharding. A good shard key has high cardinality, distributes data evenly across shards, and aligns with the most frequent query patterns.
- **Difficulty:** Advanced
- **Dependencies:** 6.2 Hash-based sharding, 6.3 Range-based sharding, 6.13 Shard groups

## Dependency Graph
**Depends on:** "6.2 Hash-based sharding", "6.3 Range-based sharding", "6.13 Shard groups"

**Depended on by:** More advanced KUs in Database Sharding & Horizontal Scaling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **High cardinality**: Many unique values. `user_id` is high cardinality (millions of values). `status` is low cardinality (few values) — terrible shard key.; - **Even distribution**: Each shard holds roughly equal data volume and throughput.; - **Query alignment**: Most queries include the shard key in WHERE clause. Queries without shard key require fan-out to all shards..
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