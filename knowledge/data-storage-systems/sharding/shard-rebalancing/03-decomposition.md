# Decomposition: 6.10 Shard rebalancing: data movement, downtime vs. online migration

## Topic Overview
Shard rebalancing moves data between shards when the cluster is unbalanced (one shard has 40% of data) or when shards are added/removed. Approaches: offline (downtime, simpler), online (no downtime, complex). Online rebalancing uses double-write + backfill + cutover or consistent hashing with virtual bucket migration.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
6-10-shard-rebalancing/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 6.10 Shard rebalancing: data movement, downtime vs. online migration
- **Purpose:** Shard rebalancing moves data between shards when the cluster is unbalanced (one shard has 40% of data) or when shards are added/removed. Approaches: offline (downtime, simpler), online (no downtime, complex).
- **Difficulty:** Advanced
- **Dependencies:** 6.11 Shard splitting, 6.12 Adding new shards, 6.20 Consistent hashing

## Dependency Graph
**Depends on:** "6.11 Shard splitting", "6.12 Adding new shards", "6.20 Consistent hashing"

**Depended on by:** More advanced KUs in Database Sharding & Horizontal Scaling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Offline rebalancing**: Stop writes, dump all data, reload with new shard config. Simple but requires downtime proportional to data volume.; - **Online rebalancing (double-write)**: Write new data to both old and new shard. Backfill existing data. Atomic cutover via shard map update. No downtime.; - **Virtual bucket migration**: Move buckets (not individual keys) between physical shards. Less granular but simpler than per-key migration..
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