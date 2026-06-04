# Decomposition: 6.23 Pre-sharding vs. progressive sharding strategy

## Topic Overview
Pre-sharding creates many shards from the start (e.g., 256 shards on 4 servers). Progressive sharding starts with few shards and splits as data grows. Pre-sharding avoids future rebalancing but wastes resources on empty shards.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
6-23-pre-sharding-vs-progressive/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 6.23 Pre-sharding vs. progressive sharding strategy
- **Purpose:** Pre-sharding creates many shards from the start (e.g., 256 shards on 4 servers). Progressive sharding starts with few shards and splits as data grows.
- **Difficulty:** Advanced
- **Dependencies:** 6.10 Shard rebalancing, 6.11 Shard splitting

## Dependency Graph
**Depends on:** "6.10 Shard rebalancing", "6.11 Shard splitting"

**Depended on by:** More advanced KUs in Database Sharding & Horizontal Scaling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Pre-sharding**: Create N shards (e.g., 256) with many virtual shards per physical server. As data grows, move virtual shards to new servers without rebalancing.; - **Progressive sharding**: Start with 2-4 shards. Split hot shards as needed. Each split requires double-write + backfill + cutover.; - **Virtual shards in pre-sharding**: 256 logical shards map to 4 physical servers (64 each). Add server → reassign 64 virtual shards. No data movement..
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