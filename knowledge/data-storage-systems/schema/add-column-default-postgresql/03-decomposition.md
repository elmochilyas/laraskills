# Decomposition: 11.7 ADD COLUMN with default in PostgreSQL (no lock, metadata-only)

## Topic Overview
PostgreSQL 11+: `ALTER TABLE ... ADD COLUMN ... DEFAULT ...` is metadata-only — no table rewrite, no row lock.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
11-7-add-column-default-postgresql/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 11.7 ADD COLUMN with default in PostgreSQL (no lock, metadata-only)
- **Purpose:** PostgreSQL 11+: `ALTER TABLE ... ADD COLUMN ...
- **Difficulty:** Advanced
- **Dependencies:** 11.1 Zero-downtime taxonomy, 11.8 MySQL ALGORITHM options

## Dependency Graph
**Depends on:** "11.1 Zero-downtime taxonomy", "11.8 MySQL ALGORITHM options"

**Depended on by:** More advanced KUs in Production Schema Operations and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Metadata-only column addition**: PostgreSQL stores the default value in `pg_attrdef`. Rows are not updated. `SELECT` reads the default from catalog for old rows.; - **No lock**: `ADD COLUMN ... DEFAULT (non-volatile)` takes only `ACCESS EXCLUSIVE` lock (blocks writes but is held briefly).; - **NOT NULL consideration**: Adding `NOT NULL` requires a full table scan (or PostgreSQL 11+ `NOT VALID` + VALIDATE)..
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