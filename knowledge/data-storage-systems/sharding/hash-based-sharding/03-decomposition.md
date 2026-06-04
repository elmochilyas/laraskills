# Decomposition: 6.2 Hash-based sharding (consistent hashing, modulo ring, virtual buckets)

## Topic Overview
Hash-based sharding maps each row to a shard by hashing the shard key. `shard = hash(key) % N`. Consistent hashing reduces data movement when adding/removing shards (only 1/N of keys move instead of all).

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
6-2-hash-based-sharding/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 6.2 Hash-based sharding (consistent hashing, modulo ring, virtual buckets)
- **Purpose:** Hash-based sharding maps each row to a shard by hashing the shard key. `shard = hash(key) % N`.
- **Difficulty:** Advanced
- **Dependencies:** 6.1 Shard key selection, 6.20 Modulus vs consistent hashing

## Dependency Graph
**Depends on:** "6.1 Shard key selection", "6.20 Modulus vs consistent hashing"

**Depended on by:** More advanced KUs in Database Sharding & Horizontal Scaling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Modulo sharding**: `shard_id = crc32(user_id) % 4`. Simple, but adding shard 5 changes the mapping for every key (all data must move).; - **Consistent hashing**: Keys map to a ring. Each shard owns a range of the ring. Adding a shard splits one range; only 1/N of keys move.; - **Virtual buckets**: Divide key space into many virtual buckets (e.g., 4096). Map buckets to physical shards. Rebalancing moves buckets, not individual keys..
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