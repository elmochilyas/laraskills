# Decomposition: database assertions

## Topic Overview

Database assertion methods verify database state after test actions: record existence, field values, soft deletes, counts, and absence. Laravel provides `assertDatabaseHas()`, `assertDatabaseMissing()`, `assertSoftDeleted()`, `assertModelExists()`, `assertDatabaseCount()`, and `assertDatabaseEmpty()`. These assertions serve as the primary mechanism for verifying side effects of write operations (create, update, delete) in feature tests.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
database-assertions/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### database assertions
- **Purpose:** Database assertion methods verify database state after test actions: record existence, field values, soft deletes, counts, and absence. Laravel provides `assertDatabaseHas()`, `assertDatabaseMissing()`, `assertSoftDeleted()`, `assertModelExists()`, `assertDatabaseCount()`, and `assertDatabaseEmpty()`. These assertions serve as the primary mechanism for verifying side effects of write operations (create, update, delete) in feature tests.
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: Database testing lifecycle, Model factory patterns, Eloquent ORM basics, **Related Topics**: Query count expectations, Migration testing, Seed data management, **Advanced Follow-up**: Raw SQL assertion patterns, Multi-tenant database assertions, and Complex query verification

## Dependency Graph
**Depends on:** **Prerequisites**: Database testing lifecycle, Model factory patterns, Eloquent ORM basics, **Related Topics**: Query count expectations, Migration testing, Seed data management, **Advanced Follow-up**: Raw SQL assertion patterns, Multi-tenant database assertions, and Complex query verification
**Depended on by:** Knowledge units that leverage or extend database assertions patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for database assertions.
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