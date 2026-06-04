# Decomposition: unit testing patterns

## Topic Overview

Unit tests validate isolated business logic—services, actions, value objects, policies, and custom rules—without booting the full Laravel framework. In a typical Laravel project (~70% feature tests), unit tests cover the remaining 20%: pure domain logic, algorithmic correctness, and calculation-heavy code. The `

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
unit-testing-patterns/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### unit testing patterns
- **Purpose:** Unit tests validate isolated business logic—services, actions, value objects, policies, and custom rules—without booting the full Laravel framework. In a typical Laravel project (~70% feature tests), unit tests cover the remaining 20%: pure domain logic, algorithmic correctness, and calculation-heavy code. The `
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: PHPUnit/Pest basics, Test double taxonomy, Object-oriented design, **Related Topics**: Service container resolution, Mockery integration, Value object design, **Advanced Follow-up**: DTO test factories, Null driver pattern, and Hexagonal architecture testing

## Dependency Graph
**Depends on:** **Prerequisites**: PHPUnit/Pest basics, Test double taxonomy, Object-oriented design, **Related Topics**: Service container resolution, Mockery integration, Value object design, **Advanced Follow-up**: DTO test factories, Null driver pattern, and Hexagonal architecture testing
**Depended on by:** Knowledge units that leverage or extend unit testing patterns patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for unit testing patterns.
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