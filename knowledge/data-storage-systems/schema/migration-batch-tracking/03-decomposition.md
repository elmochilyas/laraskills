# Decomposition: 1.7 Migration batch tracking and the migrations table

## Topic Overview
The `migrations` table is Laravel's internal ledger of executed schema changes. Each row records a migration filename and its batch number. The batch number enables rollback grouping — `migrate:rollback` undoes the most recent batch.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-7-migration-batch-tracking/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.7 Migration batch tracking and the migrations table
- **Purpose:** The `migrations` table is Laravel's internal ledger of executed schema changes. Each row records a migration filename and its batch number.
- **Difficulty:** Foundation
- **Dependencies:** 1.1 Migration file structure, 1.6 Migration ordering, 1.25 Rollback strategy

## Dependency Graph
**Depends on:** "1.1 Migration file structure", "1.6 Migration ordering", "1.25 Rollback strategy"

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **migrations table**: Two columns — `migration` (filename stem without `.php`) and `batch` (integer).; - **Batch grouping**: All migrations run in a single `migrate` command get the same batch number.; - **Rollback granularity**: `migrate:rollback` undoes the highest batch. `--step=N` rolls back N batches.; - **migrate:refresh**: Rolls back ALL batches (calls `down()` on every migration), then re-runs all migrations.; - **migrate:fresh**: Drops all tables directly (skips `down()`), then re-runs all migrations. Faster but doesn't test rollback paths..
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