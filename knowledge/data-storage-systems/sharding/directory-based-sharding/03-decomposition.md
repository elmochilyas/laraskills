# Decomposition: 6.4 Directory-based sharding (lookup table, flexible but extra hop)

## Topic Overview
Directory-based sharding uses a lookup table (shard map) to track which keys are on which shard. Most flexible — keys can move between shards without changing the shard key. Adds a lookup hop for every query.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
6-4-directory-based-sharding/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 6.4 Directory-based sharding (lookup table, flexible but extra hop)
- **Purpose:** Directory-based sharding uses a lookup table (shard map) to track which keys are on which shard. Most flexible — keys can move between shards without changing the shard key.
- **Difficulty:** Advanced
- **Dependencies:** 6.5 Shard mapping, 6.1 Shard key selection

## Dependency Graph
**Depends on:** "6.5 Shard mapping", "6.1 Shard key selection"

**Depended on by:** More advanced KUs in Database Sharding & Horizontal Scaling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Shard map table**: `shard_map(key_hash, shard_id, created_at)`. Query: `SELECT shard_id FROM shard_map WHERE key_hash = ?`. Route query to that shard.; - **Extra hop overhead**: Every query requires a lookup. Cache the shard map aggressively (Redis, local cache).; - **Flexible rebalancing**: Move a key from shard 1 to shard 2 by updating the shard map. No data movement needed at the map level (data still moves)..
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