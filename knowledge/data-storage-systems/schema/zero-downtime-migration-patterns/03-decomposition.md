# Decomposition: 1.10 Zero-downtime migration patterns (expand-contract, shadow-table)

## Topic Overview
Zero-downtime migrations allow schema changes on production databases without blocking reads or writes. The expand-contract pattern is the most versatile approach: add columns/ tables, deploy code that uses both old and new, then remove old structures. Shadow-table operations involve creating a new table alongside the old one, migrating data, and swapping.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-10-zero-downtime-migration-patterns/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.10 Zero-downtime migration patterns (expand-contract, shadow-table)
- **Purpose:** Zero-downtime migrations allow schema changes on production databases without blocking reads or writes. The expand-contract pattern is the most versatile approach: add columns/ tables, deploy code that uses both old and new, then remove old structures.
- **Difficulty:** Advanced
- **Dependencies:** 1.11 gh-ost tool, 1.12 pt-online-schema-change, 1.14 pgroll tool, 1.16 MySQL instant DDL, 1.17 PostgreSQL lazy ADD COLUMN DEFAULT

## Dependency Graph
**Depends on:** "1.11 gh-ost tool", "1.12 pt-online-schema-change", "1.14 pgroll tool", "1.16 MySQL instant DDL", "1.17 PostgreSQL lazy ADD COLUMN DEFAULT", "1.18 Expand-contract pattern detailed", "1.19 Data backfill strategies"

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Expand-contract (add, dual-write, backfill, drop)**: Multi-phase pattern where new schema elements are added first, code is updated to write to both, data is backfilled, reads are migrated, and old elements are removed — all across separate deployments.; - **Shadow-table**: Create an exact copy of the table, apply changes to the shadow, migrate data, atomically swap via RENAME TABLE.; - **Online DDL tools**: Third-party tools (gh-ost, pt-online-schema-change, pgroll, Spirit) automate the shadow-table approach for specific operations (ALTER TABLE, index creation).; - **MySQL instant DDL**: `ALGORITHM=INSTANT` for adding columns (8.0.12+) — a metadata-only change with no table copy.; - **PostgreSQL lazy ADD COLUMN DEFAULT**: Adding a column with a non-volatile DEFAULT is metadata-only (no rewrite) since PostgreSQL 11..
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