# Decomposition: 1.20 Migration immutability (no editing deployed migrations)

## Topic Overview
Once a migration file has been deployed to any environment (local, staging, production), it must never be edited. The `migrations` table records the filename — editing the file after execution means the change is silently skipped on subsequent `migrate` runs. This is the most important rule of migration management in Laravel.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-20-migration-immutability/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.20 Migration immutability (no editing deployed migrations)
- **Purpose:** Once a migration file has been deployed to any environment (local, staging, production), it must never be edited. The `migrations` table records the filename — editing the file after execution means the change is silently skipped on subsequent `migrate` runs.
- **Difficulty:** Foundation
- **Dependencies:** 1.1 Migration file structure, 1.6 Migration ordering and naming, 1.7 Migration batch tracking

## Dependency Graph
**Depends on:** "1.1 Migration file structure", "1.6 Migration ordering and naming", "1.7 Migration batch tracking"

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **filename-based tracking**: The `migrations` table stores only the migration filename (without `.php`). Laravel compares this list to the filesystem to determine which migrations have run.; - **Silent skip**: If you edit a deployed migration, its filename is already in the `migrations` table. Laravel sees it as "already run" and skips it. The edit is never applied.; - **Rollback implications**: If you edit a deployed migration and then roll it back, the `down()` method reflects the edited version, not the original. The rollback may not correctly reverse the applied change.; - **Team synchronization**: If developer A edits a deployed migration and developer B pulls the change, developer B's `migrations` table (which has the original filename) doesn't match the new content. The edit is silently ignored for developer B..
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