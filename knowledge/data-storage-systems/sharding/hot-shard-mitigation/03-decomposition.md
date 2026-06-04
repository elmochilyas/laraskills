# Decomposition: 6.24 Hot shard mitigation (split, move tenants, rebalance)

## Topic Overview
Hot shard receives disproportionate load (e.g., a viral tenant on a multi-tenant shard). Mitigation: split the shard (smaller ranges), move hot keys to a less loaded shard, or rebalance the entire cluster. Detection via per-shard CPU, IOPS, and connection monitoring.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
6-24-hot-shard-mitigation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 6.24 Hot shard mitigation (split, move tenants, rebalance)
- **Purpose:** Hot shard receives disproportionate load (e.g., a viral tenant on a multi-tenant shard). Mitigation: split the shard (smaller ranges), move hot keys to a less loaded shard, or rebalance the entire cluster.
- **Difficulty:** Advanced
- **Dependencies:** 6.11 Shard splitting, 6.10 Shard rebalancing

## Dependency Graph
**Depends on:** "6.11 Shard splitting", "6.10 Shard rebalancing"

**Depended on by:** More advanced KUs in Database Sharding & Horizontal Scaling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Causes**: Poor shard key distribution, viral user/tenant on one shard, time-based shard on current period.; - **Split**: Divide the hot shard's range into two shards. Reduces per-shard load by half.; - **Move keys**: Relocate specific hot keys (e.g., viral tenant) to a dedicated shard. Requires double-write + cutover..
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