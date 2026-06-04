# Decomposition: 6.11 Shard splitting (hot shard detected, split into smaller shards)

## Topic Overview
A hot shard receives disproportionate traffic or holds too much data. Split it into two or more shards. Range-based: split the key range.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
6-11-shard-splitting/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 6.11 Shard splitting (hot shard detected, split into smaller shards)
- **Purpose:** A hot shard receives disproportionate traffic or holds too much data. Split it into two or more shards.
- **Difficulty:** Advanced
- **Dependencies:** 6.10 Shard rebalancing, 6.12 Adding new shards, 6.24 Hot shard mitigation

## Dependency Graph
**Depends on:** "6.10 Shard rebalancing", "6.12 Adding new shards", "6.24 Hot shard mitigation"

**Depended on by:** More advanced KUs in Database Sharding & Horizontal Scaling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Detection**: Monitor per-shard CPU, IOPS, query latency, storage. Shard exceeding 70% of any resource metric is a candidate for split.; - **Range split**: Shard owning keys 1M-2M splits into shard A (1M-1.5M) and shard B (1.5M-2M). Update range map.; - **Hash split**: Add shard N+1. Consistent hashing redistributes 1/N of keys. Requires rebalancing..
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