# Decomposition: 7.5 Replica lag causes (long transactions, DDL, heavy writes, insufficient replica capacity)

## Topic Overview
Replica lag is the delay between a write on the primary and its appearance on the replica. Common causes: long-running transactions holding binlog position, DDL operations (ALTER TABLE) blocking replication, write bursts exceeding replica apply capacity, undersized replicas, and network latency between primary and replica.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
7-5-replica-lag-causes/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 7.5 Replica lag causes (long transactions, DDL, heavy writes, insufficient replica capacity)
- **Purpose:** Replica lag is the delay between a write on the primary and its appearance on the replica. Common causes: long-running transactions holding binlog position, DDL operations (ALTER TABLE) blocking replication, write bursts exceeding replica apply capacity, undersized replicas, and network latency between primary and replica.
- **Difficulty:** Intermediate
- **Dependencies:** 7.6 Lag monitoring, 7.7 Lag-aware read splitting

## Dependency Graph
**Depends on:** "7.6 Lag monitoring", "7.7 Lag-aware read splitting"

**Depended on by:** More advanced KUs in Replication & Read/Write Splitting and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Long transactions**: `BEGIN ... UPDATE ... wait ... COMMIT`. The replica can't apply the transaction until it's committed on primary.; - **DDL operations**: `ALTER TABLE` on the primary runs on the replica after receiving the event. `LOCK=SHARED`, `ALGORITHM=INPLACE` on primary but `ALGORITHM=COPY` on replica.; - **Replica apply capacity**: If write rate on primary exceeds replica's CPU/IO capacity to replay binlog, lag grows indefinitely..
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