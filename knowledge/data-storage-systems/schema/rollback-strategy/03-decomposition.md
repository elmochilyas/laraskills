# Decomposition: 1.25 Rollback strategy per migration type (additive safe, destructive requires compatibility window)

## Topic Overview
Migration rollback safety depends on the operation type. Additive changes (creating tables, adding columns, adding indexes) are safe to rollback immediately. Destructive changes (dropping tables, dropping columns, removing indexes) require a compatibility window where no code references the dropped structures.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-25-rollback-strategy/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.25 Rollback strategy per migration type (additive safe, destructive requires compatibility window)
- **Purpose:** Migration rollback safety depends on the operation type. Additive changes (creating tables, adding columns, adding indexes) are safe to rollback immediately.
- **Difficulty:** Advanced
- **Dependencies:** 1.18 Expand-contract pattern, 1.24 Schema and data migration separation, 1.10 Zero-downtime migration patterns

## Dependency Graph
**Depends on:** "1.18 Expand-contract pattern", "1.24 Schema and data migration separation", "1.10 Zero-downtime migration patterns"

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Additive operations**: CREATE TABLE, ADD COLUMN, ADD INDEX, ADD FK. Safe to reverse because they don't destroy existing data.; - **Destructive operations**: DROP TABLE, DROP COLUMN, DROP INDEX, ALTER COLUMN TYPE. Irreversible if code still references the dropped structures.; - **Compatibility window**: The period between dropping a structure and ensuring all code (including delayed queue jobs) has stopped referencing it. Typically 24-48 hours.; - **Rename operations**: Neither purely additive nor destructive — they combine both..
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