# Decomposition: 6.13 Shard groups (co-located tables that share shard key for joins)

## Topic Overview
Shard groups co-locate tables that share the same shard key on the same physical shard. Tables in the same shard group support JOINs on the shard key without cross-shard overhead. Essential for relational data models in sharded environments.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
6-13-shard-groups/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 6.13 Shard groups (co-located tables that share shard key for joins)
- **Purpose:** Shard groups co-locate tables that share the same shard key on the same physical shard. Tables in the same shard group support JOINs on the shard key without cross-shard overhead.
- **Difficulty:** Advanced
- **Dependencies:** 6.1 Shard key, 6.8 Cross-shard joins, 6.14 Shard model traits

## Dependency Graph
**Depends on:** "6.1 Shard key", "6.8 Cross-shard joins", "6.14 Shard model traits"

**Depended on by:** More advanced KUs in Database Sharding & Horizontal Scaling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Shared shard key**: `users` and `orders` both sharded by `user_id`. A user's data and their orders are on the same shard. `JOIN users ON orders.user_id = users.id` stays within shard.; - **Co-location**: Elasticsearch term is "routing". Vitess calls it "shard group" or "colocation". Same concept: related data stays together.; - **Cross-group joins**: Tables in different shard groups require fan-out queries. Design groups carefully..
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