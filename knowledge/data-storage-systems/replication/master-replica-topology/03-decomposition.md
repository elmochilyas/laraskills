# Decomposition: 7.1 Master-replica topology (async, semi-sync, sync replication)

## Topic Overview
Master-replica topology: one primary (write) node and one or more replica (read) nodes. Replication modes: asynchronous (default MySQL, low latency, possible data loss), semi-synchronous (at least one replica confirms), synchronous (all replicas confirm, highest durability). The mode determines data loss risk on primary failure.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
7-1-master-replica-topology/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 7.1 Master-replica topology (async, semi-sync, sync replication)
- **Purpose:** Master-replica topology: one primary (write) node and one or more replica (read) nodes. Replication modes: asynchronous (default MySQL, low latency, possible data loss), semi-synchronous (at least one replica confirms), synchronous (all replicas confirm, highest durability).
- **Difficulty:** Intermediate
- **Dependencies:** 7.2 Laravel read/write config, 7.5 Replica lag causes

## Dependency Graph
**Depends on:** "7.2 Laravel read/write config", "7.5 Replica lag causes"

**Depended on by:** More advanced KUs in Replication & Read/Write Splitting and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Async replication**: Primary commits without waiting for replicas. Fastest writes. Risk: if primary fails before replica receives the write, data is lost.; - **Semi-sync replication**: Primary waits for at least one replica to confirm receipt. Zero data loss if configured with `rpl_semi_sync_master_wait_point=AFTER_SYNC`.; - **Sync replication**: Primary waits for all replicas to confirm. Slowest writes. Rarely used in production (Galera, PostgreSQL synchronous_commit)..
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