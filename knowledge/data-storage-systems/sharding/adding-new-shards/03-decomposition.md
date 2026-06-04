# Decomposition: 6.12 Adding new shards (rehashing, double-writing during transition)

## Topic Overview
Adding a new shard increases cluster capacity. The transition period requires double-writing to both old and new shards until data is fully redistributed. Consistent hashing minimizes data movement (only 1/N moves).

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
6-12-adding-new-shards/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 6.12 Adding new shards (rehashing, double-writing during transition)
- **Purpose:** Adding a new shard increases cluster capacity. The transition period requires double-writing to both old and new shards until data is fully redistributed.
- **Difficulty:** Advanced
- **Dependencies:** 6.10 Shard rebalancing, 6.11 Shard splitting, 6.20 Consistent hashing

## Dependency Graph
**Depends on:** "6.10 Shard rebalancing", "6.11 Shard splitting", "6.20 Consistent hashing"

**Depended on by:** More advanced KUs in Database Sharding & Horizontal Scaling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Double-write**: Every write goes to both old shard(s) and new shard for the duration of migration. Read from old shard until cutover.; - **Backfill**: Copy existing data from old shard to new shard. `INSERT ... SELECT` with batch processing. Rate-limited.; - **Cutover**: Update shard map to route reads to new shard. Stop double-writing..
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