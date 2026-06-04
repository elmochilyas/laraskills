# Decomposition: 1.9 Migration isolation (isolated option, cache lock)

## Topic Overview
The `--isolated` option prevents multiple servers from running migrations concurrently. It acquires an atomic cache lock — only the first server acquires the lock; subsequent attempts exit gracefully. This is essential for load-balanced, multi-server deployments where concurrent migration execution causes race conditions, partial migration states, and deployment failures.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-9-migration-isolation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.9 Migration isolation (isolated option, cache lock)
- **Purpose:** The `--isolated` option prevents multiple servers from running migrations concurrently. It acquires an atomic cache lock — only the first server acquires the lock; subsequent attempts exit gracefully.
- **Difficulty:** Intermediate
- **Dependencies:** 1.7 Migration batch tracking, 1.25 Rollback strategy, 1.21 Multi-tenant migration orchestration

## Dependency Graph
**Depends on:** "1.7 Migration batch tracking", "1.25 Rollback strategy", "1.21 Multi-tenant migration orchestration"

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Problem**: In multi-server deployments, all servers may attempt `php artisan migrate` simultaneously. Both servers apply the same migration, causing duplicate schema errors.; - **Solution**: `php artisan migrate --isolated` uses the application's cache driver to acquire an atomic lock before executing migrations.; - **Lock timeout**: The lock is held for the migration duration. Configurable via `MIGRATION_LOCK_TIMEOUT` (default 30 seconds).; - **Exit behavior**: Servers that fail to acquire the lock exit with success code (0) — they don't fail the deployment..
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