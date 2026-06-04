# Decomposition: 6.9 Cross-shard transaction impossibility (distributed transaction complexity)

## Topic Overview
ACID transactions across shards are not possible with standard database transactions. Distributed transactions require two-phase commit (2PC), which has high coordination overhead and failure modes. Most sharded systems avoid cross-shard transactions entirely by designing shard key and data model so that all transactionally-related data lives on the same shard.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
6-9-cross-shard-transaction-impossibility/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 6.9 Cross-shard transaction impossibility (distributed transaction complexity)
- **Purpose:** ACID transactions across shards are not possible with standard database transactions. Distributed transactions require two-phase commit (2PC), which has high coordination overhead and failure modes.
- **Difficulty:** Advanced
- **Dependencies:** 9.1 Database transactions, 6.1 Shard key, 6.13 Shard groups

## Dependency Graph
**Depends on:** "9.1 Database transactions", "6.1 Shard key", "6.13 Shard groups"

**Depended on by:** More advanced KUs in Database Sharding & Horizontal Scaling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **2PC (two-phase commit)**: Prepare phase (all shards agree to commit) → Commit phase (all shards commit). If any shard fails during prepare, all shards abort.; - **Coordinator failure**: If the coordinator crashes after prepare but before commit, shards hold locks indefinitely (in-doubt transactions).; - **Compensating transactions (Saga)**: For distributed operations, use Saga pattern: execute local transactions per shard, run compensating actions on failure..
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