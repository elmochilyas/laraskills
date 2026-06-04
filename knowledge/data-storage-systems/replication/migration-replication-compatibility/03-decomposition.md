# Decomposition: 7.20 Migration replication compatibility (DDL impact on replicas)

## Topic Overview
DDL operations (ALTER TABLE, CREATE INDEX) on the primary replicate to replicas. Some DDL operations block replication until they complete on the replica. `ALGORITHM=INSTANT` DDL replicates instantly.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
7-20-migration-replication-compatibility/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 7.20 Migration replication compatibility (DDL impact on replicas)
- **Purpose:** DDL operations (ALTER TABLE, CREATE INDEX) on the primary replicate to replicas. Some DDL operations block replication until they complete on the replica.
- **Difficulty:** Advanced
- **Dependencies:** 11.2 Online DDL, 11.6 ALTER TABLE strategies, 7.5 Replica lag

## Dependency Graph
**Depends on:** "11.2 Online DDL", "11.6 ALTER TABLE strategies", "7.5 Replica lag"

**Depended on by:** More advanced KUs in Replication & Read/Write Splitting and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **DDL replication**: DDL statements are written to binlog and replayed on replicas. Long-running DDL (e.g., `ALTER TABLE ... ALGORITHM=COPY`) blocks replica apply thread.; - **Replica lock during DDL**: The replica executes the DDL sequentially (single-threaded for DDL). While DDL runs, no other events from primary are applied. Lag increases.; - **Migration strategies**: Use `ALGORITHM=INSTANT` or `INPLACE` for online DDL. Avoid long-running `COPY` during peak hours..
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