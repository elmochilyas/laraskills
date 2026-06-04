# Decomposition: 6.8 Cross-shard join limitations (alternative: denormalization, application-level joins)

## Topic Overview
Database joins across shards are not possible. Data for a join lives on different physical servers. Solutions: force co-location (same shard key), denormalize data, perform application-level joins (N+1 across shards), or use Vitess/Spanner (distributed query engine).

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
6-8-cross-shard-join-limitations/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 6.8 Cross-shard join limitations (alternative: denormalization, application-level joins)
- **Purpose:** Database joins across shards are not possible. Data for a join lives on different physical servers.
- **Difficulty:** Advanced
- **Dependencies:** 6.1 Shard key, 6.7 Fan-out queries, 6.13 Shard groups

## Dependency Graph
**Depends on:** "6.1 Shard key", "6.7 Fan-out queries", "6.13 Shard groups"

**Depended on by:** More advanced KUs in Database Sharding & Horizontal Scaling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Shard key = join key**: If both tables are sharded by `user_id`, a join on `user_id` stays within a shard. Works.; - **Cross-shard join**: Table A sharded by `user_id`, Table B sharded by `order_id`. Join on `user_id` requires fan-out.; - **Denormalization**: Store joined data in the same table/shard. Reduces join needs at the cost of data redundancy..
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