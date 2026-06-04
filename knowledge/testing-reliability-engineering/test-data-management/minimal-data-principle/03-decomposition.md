# Decomposition: minimal data principle

## Topic Overview

The minimal data principle states that tests should create only the minimum data required to verify the specific behavior under test. Instead of creating large, realistic datasets, tests create 1-3 records with precisely the attributes needed. This principle is foundational to Laravel testing best practices: fast tests, focused assertions, and reduced test maintenance. The principle applies to all test types (unit, feature, browser) and is particularly important for test suites that run in pa...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
minimal-data-principle/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### minimal data principle
- **Purpose:** The minimal data principle states that tests should create only the minimum data required to verify the specific behavior under test. Instead of creating large, realistic datasets, tests create 1-3 records with precisely the attributes needed. This principle is foundational to Laravel testing best practices: fast tests, focused assertions, and reduced test maintenance. The principle applies to all test types (unit, feature, browser) and is particularly important for test suites that run in pa...
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: Model factory fundamentals, Database testing lifecycle, Factory states, **Related Topics**: Declarative factory methods, Factory states and sequences, Test suite profiling, **Advanced Follow-up**: Data creation optimization, Test performance budgeting, and Database seeding strategies

## Dependency Graph
**Depends on:** **Prerequisites**: Model factory fundamentals, Database testing lifecycle, Factory states, **Related Topics**: Declarative factory methods, Factory states and sequences, Test suite profiling, **Advanced Follow-up**: Data creation optimization, Test performance budgeting, and Database seeding strategies
**Depended on by:** Knowledge units that leverage or extend minimal data principle patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for minimal data principle.
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