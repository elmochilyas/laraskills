# Decomposition: 6.17 Read replica per shard (shard-level read scaling)

## Topic Overview
Each shard can have its own read replicas for read scaling within the shard. Write-heavy shards get more or larger replicas. Read replicas per shard provide shard-level read capacity independent of other shards.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
6-17-read-replica-per-shard/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 6.17 Read replica per shard (shard-level read scaling)
- **Purpose:** Each shard can have its own read replicas for read scaling within the shard. Write-heavy shards get more or larger replicas.
- **Difficulty:** Advanced
- **Dependencies:** 6.1 Shard key, 7.2 Read/write splitting, 7.10 Replica lag

## Dependency Graph
**Depends on:** "6.1 Shard key", "7.2 Read/write splitting", "7.10 Replica lag"

**Depended on by:** More advanced KUs in Database Sharding & Horizontal Scaling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Shard-level read replica**: Shard 1 has 2 replicas, Shard 2 has 1 replica, Shard 3 has 3 replicas (based on read load per shard).; - **Asymmetric replica count**: Hot shards get more replicas. Cold shards get fewer. More cost-effective than symmetric replicas.; - **Read routing per shard**: `ShardRouter::connection($shardId, 'read')` returns a random replica connection for that shard..
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