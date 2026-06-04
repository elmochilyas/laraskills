# Decomposition: 1.26 MySQL ALGORITHM options (INPLACE, COPY, INSTANT) and LOCK options (NONE, SHARED, EXCLUSIVE, DEFAULT)

## Topic Overview
MySQL's online DDL capability is controlled by ALGORITHM and LOCK options. ALGORITHM determines how the DDL is executed (metadata-only, in-place rebuild, or copy). LOCK controls concurrent DML access during the DDL.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-26-mysql-algorithm-lock-options/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.26 MySQL ALGORITHM options (INPLACE, COPY, INSTANT) and LOCK options (NONE, SHARED, EXCLUSIVE, DEFAULT)
- **Purpose:** MySQL's online DDL capability is controlled by ALGORITHM and LOCK options. ALGORITHM determines how the DDL is executed (metadata-only, in-place rebuild, or copy).
- **Difficulty:** Advanced
- **Dependencies:** None

## Dependency Graph
**Depends on:** Foundational Laravel/DB knowledge.

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - `INSTANT`: Metadata-only change. No table rebuild. No DML blocking. Supported operations: adding columns (8.0.12+), dropping virtual columns, renaming columns (8.0.28+), modifying ENUM values.; - `INPLACE`: Table is rebuilt in-place. Allows concurrent DML (if LOCK=NONE) during the rebuild. Supports most ALTER operations: adding/dropping indexes, changing column types (in some cases), adding FKs.; - `COPY`: Full table copy to a temporary table. Blocks all concurrent DML (writes blocked, reads blocked during copy). Fallback for operations INPLACE can't handle.; - `NONE`: Allows concurrent reads and writes during DDL.; - `SHARED`: Allows concurrent reads but blocks writes..
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