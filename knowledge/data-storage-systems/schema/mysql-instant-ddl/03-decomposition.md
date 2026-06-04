# Decomposition: 1.16 MySQL instant DDL (ALGORITHM=INSTANT, 64-version limit)

## Topic Overview
MySQL 8.0.12 introduced `ALGORITHM=INSTANT` for DDL operations, enabling certain schema changes (primarily adding columns) to be performed as metadata-only operations — no table copy, no significant lock duration. However, each table has a 64-version limit on INSTANT operations, after which it must use INPLACE or COPY. Understanding INSTANT DDL is critical for zero-downtime migration strategies in MySQL-based Laravel applications.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-16-mysql-instant-ddl/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.16 MySQL instant DDL (ALGORITHM=INSTANT, 64-version limit)
- **Purpose:** MySQL 8.0.12 introduced `ALGORITHM=INSTANT` for DDL operations, enabling certain schema changes (primarily adding columns) to be performed as metadata-only operations — no table copy, no significant lock duration. However, each table has a 64-version limit on INSTANT operations, after which it must use INPLACE or COPY.
- **Difficulty:** Advanced
- **Dependencies:** None

## Dependency Graph
**Depends on:** Foundational Laravel/DB knowledge.

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **INSTANT operations**: Add columns (8.0.12+), add/drop virtual columns, add/drop/alter column defaults, rename column (8.0.28+), modify column ENUM values.; - **No table rebuild**: INSTANT modifies only metadata. The operation completes in milliseconds regardless of table size.; - **64-version limit**: Each INSTANT operation increments an internal version counter. After 64, further DDL must use INPLACE or COPY.; - **Row format**: INSTANT operations use the "instant" row format, which stores version information per row..
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