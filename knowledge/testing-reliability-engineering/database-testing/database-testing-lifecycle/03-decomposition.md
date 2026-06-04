# Decomposition: database testing lifecycle

## Topic Overview

Database testing lifecycle encompasses how database state is managed between tests: setup, migration, data seeding, transaction wrapping, and teardown. Laravel provides three strategies�`RefreshDatabase` (transaction rollback), `DatabaseMigrations` (full migrate/rollback), and `DatabaseTruncation` (table truncation)�each with distinct speed, isolation, and concurrency characteristics. Choosing the wrong strategy leads to slow tests, flaky test failures, or insufficient isolation.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
database-testing-lifecycle/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### database testing lifecycle
- **Purpose:** Database testing lifecycle encompasses how database state is managed between tests: setup, migration, data seeding, transaction wrapping, and teardown. Laravel provides three strategies�`RefreshDatabase` (transaction rollback), `DatabaseMigrations` (full migrate/rollback), and `DatabaseTruncation` (table truncation)�each with distinct speed, isolation, and concurrency characteristics. Choosing the wrong strategy leads to slow tests, flaky test failures, or insufficient isolation.
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: Laravel migrations, Database configuration, Eloquent ORM basics, **Related Topics**: Model factory patterns, Database assertions, Parallel testing, **Advanced Follow-up**: Process-specific database provisioning, Migration strategy design, and Seed data management

## Dependency Graph
**Depends on:** **Prerequisites**: Laravel migrations, Database configuration, Eloquent ORM basics, **Related Topics**: Model factory patterns, Database assertions, Parallel testing, **Advanced Follow-up**: Process-specific database provisioning, Migration strategy design, and Seed data management
**Depended on by:** Knowledge units that leverage or extend database testing lifecycle patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for database testing lifecycle.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization