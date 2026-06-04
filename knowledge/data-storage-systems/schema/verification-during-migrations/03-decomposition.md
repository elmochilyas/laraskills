# Decomposition: 11.10 Verification during migrations (data integrity checks)

## Topic Overview
After running a migration + backfill, verify data integrity before switching traffic. Checks: row count match (old vs new), checksum/aggregate match (SUM, MD5), sample comparison (random 1000 rows compared side-by-side), constraint validation (FK, UNIQUE, NOT NULL). Verification catches data corruption, truncation, and mapping errors.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
11-10-verification-during-migrations/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 11.10 Verification during migrations (data integrity checks)
- **Purpose:** After running a migration + backfill, verify data integrity before switching traffic. Checks: row count match (old vs new), checksum/aggregate match (SUM, MD5), sample comparison (random 1000 rows compared side-by-side), constraint validation (FK, UNIQUE, NOT NULL).
- **Difficulty:** Advanced
- **Dependencies:** 11.9 Data backfill, 11.16 Testing migrations in CI

## Dependency Graph
**Depends on:** "11.9 Data backfill", "11.16 Testing migrations in CI"

**Depended on by:** More advanced KUs in Production Schema Operations and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Row count verification**: `SELECT COUNT(*) FROM old_table` vs `SELECT COUNT(*) FROM new_table`. Must match exactly.; - **Checksum verification**: `SELECT MD5(GROUP_CONCAT(column ORDER BY id)) FROM old_table` vs new table. Catches data differences.; - **Constraint verification**: `SELECT * FROM new_table WHERE constraint_column IS NULL` — finds NOT NULL violations. `SELECT orphan_column FROM new_table WHERE NOT EXISTS (SELECT 1 FROM referenced WHERE ...)` — finds FK violations.; - **Null/empty check**: Verify no unexpected NULLs in columns that should be filled..
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