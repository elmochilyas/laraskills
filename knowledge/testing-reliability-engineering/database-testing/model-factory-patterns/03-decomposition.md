# Decomposition: model factory patterns

## Topic Overview

Model factories create Eloquent model instances with consistent defaults, enabling readable and maintainable test data setup. Laravel's factory system supports `definition()` methods, named states, sequences, relationships, and `afterCreating()`/`afterMaking()` callbacks. Well-designed factories are the foundation of all database tests�they determine test readability, setup time, and data consistency. Poorly designed factories lead to slow tests, flaky assertions, and unreadable test setup.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
model-factory-patterns/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### model factory patterns
- **Purpose:** Model factories create Eloquent model instances with consistent defaults, enabling readable and maintainable test data setup. Laravel's factory system supports `definition()` methods, named states, sequences, relationships, and `afterCreating()`/`afterMaking()` callbacks. Well-designed factories are the foundation of all database tests�they determine test readability, setup time, and data consistency. Poorly designed factories lead to slow tests, flaky assertions, and unreadable test setup.
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: Eloquent relationships, Database migrations, Seeder patterns, **Related Topics**: Database testing lifecycle, Database assertions, Test data management, **Advanced Follow-up**: DTO test factories, Factory trait organization, and Declarative factory patterns

## Dependency Graph
**Depends on:** **Prerequisites**: Eloquent relationships, Database migrations, Seeder patterns, **Related Topics**: Database testing lifecycle, Database assertions, Test data management, **Advanced Follow-up**: DTO test factories, Factory trait organization, and Declarative factory patterns
**Depended on by:** Knowledge units that leverage or extend model factory patterns patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for model factory patterns.
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