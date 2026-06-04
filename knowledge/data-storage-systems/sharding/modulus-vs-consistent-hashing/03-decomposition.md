# Decomposition: 6.20 Modulus vs. consistent hashing for rebalancing efficiency

## Topic Overview
Modulus sharding (`hash(key) % N`) moves all keys when N changes. Consistent hashing moves only 1/N of keys (expected). For elastic sharding (adding/removing shards over time), consistent hashing is orders of magnitude more efficient.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
6-20-modulus-vs-consistent-hashing/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 6.20 Modulus vs. consistent hashing for rebalancing efficiency
- **Purpose:** Modulus sharding (`hash(key) % N`) moves all keys when N changes. Consistent hashing moves only 1/N of keys (expected).
- **Difficulty:** Advanced
- **Dependencies:** 6.2 Hash-based sharding, 6.10 Shard rebalancing, 6.12 Adding new shards

## Dependency Graph
**Depends on:** "6.2 Hash-based sharding", "6.10 Shard rebalancing", "6.12 Adding new shards"

**Depended on by:** More advanced KUs in Database Sharding & Horizontal Scaling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Modulus movement on resize**: Going from 4 to 5 shards: every key's `hash % 4 ≠ hash % 5`. All keys must move. 100% data migration.; - **Consistent hashing movement**: Adding shard 5 to a 4-shard ring: each of the 4 existing shards gives up ~20% of its keys. Total: 25% of keys move.; - **Virtual nodes**: Each physical shard represented by multiple virtual nodes on the ring. Better distribution, finer-grained rebalancing..
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