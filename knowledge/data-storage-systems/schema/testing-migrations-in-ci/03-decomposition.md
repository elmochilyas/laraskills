# Decomposition: 11.16 Testing migrations in CI (syntax checks, dry runs, data integrity)

## Topic Overview
Migrations should be tested in CI: syntax check (PHP lint on migration files), dry run (run `migrate --pretend` against CI database), forward/rollback test (migrate then rollback, verify reversibility), and data integrity test (seed data, run migration, verify data). Prevents migration failures during deployment.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
11-16-testing-migrations-in-ci/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 11.16 Testing migrations in CI (syntax checks, dry runs, data integrity)
- **Purpose:** Migrations should be tested in CI: syntax check (PHP lint on migration files), dry run (run `migrate --pretend` against CI database), forward/rollback test (migrate then rollback, verify reversibility), and data integrity test (seed data, run migration, verify data). Prevents migration failures during deployment.
- **Difficulty:** Advanced
- **Dependencies:** 11.15 Canary, 11.10 Verification

## Dependency Graph
**Depends on:** "11.15 Canary", "11.10 Verification"

**Depended on by:** More advanced KUs in Production Schema Operations and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Syntax check**: `php -l database/migrations/*.php`. Catches PHP syntax errors in migration files.; - **Dry run**: `php artisan migrate --pretend --database=testing`. Outputs SQL without executing. Catches syntax errors in raw SQL.; - **Forward/rollback**: `php artisan migrate` then `php artisan migrate:rollback` in CI. Verifies `down()` works.; - **Seed + migrate + verify**: Seed test data, run migration, verify data integrity (row counts, column values)..
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