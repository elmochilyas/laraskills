# Decomposition: 1.8 Migration squashing (schema:dump, database/schema directory)

## Topic Overview
Migration squashing consolidates hundreds of individual migration files into a single SQL schema file using `php artisan schema:dump`. This dramatically reduces migration time for fresh installs (CI, new developers) by executing one SQL file instead of hundreds of PHP classes. Squashing is safe because Laravel only uses the schema dump when no migrations have been executed — existing environments are unaffected.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-8-migration-squashing/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.8 Migration squashing (schema:dump, database/schema directory)
- **Purpose:** Migration squashing consolidates hundreds of individual migration files into a single SQL schema file using `php artisan schema:dump`. This dramatically reduces migration time for fresh installs (CI, new developers) by executing one SQL file instead of hundreds of PHP classes.
- **Difficulty:** Intermediate
- **Dependencies:** 1.6 Migration ordering, 1.7 Migration batch tracking, 1.20 Migration immutability

## Dependency Graph
**Depends on:** "1.6 Migration ordering", "1.7 Migration batch tracking", "1.20 Migration immutability"

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **schema:dump command**: Generates `database/schema/{connection}.sql` containing the full CREATE TABLE SQL for the schema.; - **Execution order**: On a fresh database, Laravel executes the schema dump SQL first, then runs any remaining migration files not included in the dump.; - **Safety**: The schema dump is only used when the `migrations` table is empty. Existing environments continue to run individual migrations.; - **Per-connection dumps**: `php artisan schema:dump` generates separate dump files per database connection.; - **Git management**: The schema dump file should be committed to version control..
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