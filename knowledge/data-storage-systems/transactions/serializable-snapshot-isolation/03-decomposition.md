# Decomposition: 9.17 Serializable Snapshot Isolation (PostgreSQL SSI, conflict detection)

## Topic Overview
SSI (PostgreSQL SERIALIZABLE) detects serialization anomalies via predicate locking and conflict tracking. Unlike pessimistic SERIALIZABLE (which uses table/index locks), SSI is optimistic — it allows concurrent operations and aborts one transaction if a serialization conflict is detected. SSI provides true serializability with better concurrency than lock-based approaches.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
9-17-serializable-snapshot-isolation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 9.17 Serializable Snapshot Isolation (PostgreSQL SSI, conflict detection)
- **Purpose:** SSI (PostgreSQL SERIALIZABLE) detects serialization anomalies via predicate locking and conflict tracking. Unlike pessimistic SERIALIZABLE (which uses table/index locks), SSI is optimistic — it allows concurrent operations and aborts one transaction if a serialization conflict is detected.
- **Difficulty:** Advanced
- **Dependencies:** 9.3 PostgreSQL isolation specifics, 9.18 Write skew prevention

## Dependency Graph
**Depends on:** "9.3 PostgreSQL isolation specifics", "9.18 Write skew prevention"

**Depended on by:** More advanced KUs in Transaction Management & Concurrency and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **SIREAD locks**: Lightweight predicate locks. Track which data a transaction read (via index keys and page-level tracking). Monitoring for rw-conflicts.; - **Conflict detection**: If transaction T1 reads data that T2 later writes, and T1's read predicate overlaps T2's write, SSI detects a rw-dependency. If this creates a cycle in the dependency graph, one transaction is aborted.; - **Serialization failure (40001)**: Returned when SSI detects a conflict. Application must retry the entire transaction..
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