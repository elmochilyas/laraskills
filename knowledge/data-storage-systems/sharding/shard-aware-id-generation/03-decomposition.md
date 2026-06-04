# Decomposition: 6.6 Shard-aware ID generation (Snowflake, database sequences, UUID v7)

## Topic Overview
Globally unique, ordered IDs that encode the shard or are shard-predictable are essential for sharded systems. Sequence-based IDs require coordination across shards. Snowflake IDs encode timestamp + shard ID + sequence.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
6-6-shard-aware-id-generation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 6.6 Shard-aware ID generation (Snowflake, database sequences, UUID v7)
- **Purpose:** Globally unique, ordered IDs that encode the shard or are shard-predictable are essential for sharded systems. Sequence-based IDs require coordination across shards.
- **Difficulty:** Advanced
- **Dependencies:** 6.1 Shard key, 6.4 Directory-based sharding, 6.5 Shard routing

## Dependency Graph
**Depends on:** "6.1 Shard key", "6.4 Directory-based sharding", "6.5 Shard routing"

**Depended on by:** More advanced KUs in Database Sharding & Horizontal Scaling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Snowflake**: 64-bit ID: timestamp (41 bits) + shard ID (10 bits) + sequence (12 bits). Shard ID encoded in the ID — no lookup needed to route.; - **UUID v7**: Time-ordered UUID. Monotonically increasing. Globally unique. Does not encode shard ID — requires shard map lookup.; - **Database sequence**: `auto_increment` per shard with offset: shard 1 (1, 5, 9...), shard 2 (2, 6, 10...). Simple but limited..
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