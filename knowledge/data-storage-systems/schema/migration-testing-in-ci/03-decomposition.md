# Decomposition: 1.28 Migration testing in CI (same engine and version as production)

## Topic Overview
Migrations must be tested in CI using the same database engine AND version as production. MySQL 8.0 behavior differs from MySQL 5.7; PostgreSQL 15 differs from PostgreSQL 16. A migration that works on SQLite (default test DB) may fail on PostgreSQL in production.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-28-migration-testing-in-ci/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.28 Migration testing in CI (same engine and version as production)
- **Purpose:** Migrations must be tested in CI using the same database engine AND version as production. MySQL 8.0 behavior differs from MySQL 5.7; PostgreSQL 15 differs from PostgreSQL 16.
- **Difficulty:** Intermediate
- **Dependencies:** 1.28 Migration testing, 1.8 Migration squashing, 1.7 Migration batch tracking

## Dependency Graph
**Depends on:** "1.28 Migration testing", "1.8 Migration squashing", "1.7 Migration batch tracking"

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Engine mismatch**: Laravel's default test environment uses SQLite. Migrations that use MySQL-specific syntax (e.g., `after()`, `fullText()`) fail silently or produce different schemas.; - **Version-specific DDL**: `ALGORITHM=INSTANT` requires MySQL 8.0.12+. MySQL 5.7 doesn't support it. CI running on 8.0 may not catch 5.7 incompatibilities.; - **SQL mode differences**: MySQL's strict mode affects DDL validation. A migration that creates a column with an invalid default may pass in one SQL mode but fail in another.; - **Schema dump compatibility**: Schema dumps generated on one engine version may not be compatible with another (e.g., MySQL 8.0 dump syntax vs MariaDB)..
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