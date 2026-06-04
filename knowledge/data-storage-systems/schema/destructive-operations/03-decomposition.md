# Decomposition: 11.13 Destructive operations (DROP COLUMN, DROP TABLE, TRUNCATE) safety

## Topic Overview
Destructive DDL operations should never be the first step. Always: backup data → verify no references → run in expand-contract → wait for old-column usage to drop to zero → drop. DROP COLUMN is irreversible.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
11-13-destructive-operations/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 11.13 Destructive operations (DROP COLUMN, DROP TABLE, TRUNCATE) safety
- **Purpose:** Destructive DDL operations should never be the first step. Always: backup data → verify no references → run in expand-contract → wait for old-column usage to drop to zero → drop.
- **Difficulty:** Advanced
- **Dependencies:** 11.11 Rollback planning, 11.6 Expand-contract

## Dependency Graph
**Depends on:** "11.11 Rollback planning", "11.6 Expand-contract"

**Depended on by:** More advanced KUs in Production Schema Operations and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **DROP COLUMN risk**: Dropped column data is gone (MySQL) or requires VACUUM FULL to reclaim space (PostgreSQL). Restore from backup only.; - **DROP TABLE risk**: Table and all its data gone. FK constraints referencing this table will fail.; - **TRUNCATE risk**: All rows deleted. Cannot roll back (DDL, not DML, in some contexts). Faster than DELETE but irreversible..
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