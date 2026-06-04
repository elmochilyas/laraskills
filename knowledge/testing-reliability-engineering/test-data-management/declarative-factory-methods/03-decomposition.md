# Decomposition: declarative factory methods

## Topic Overview

Declarative factory methods are custom helper methods that encapsulate complex object creation logic behind descriptive names, making test setup readable, self-documenting, and maintainable. Instead of inline factory calls chained with states, sequences, and relationships, declarative methods like `$this->createSubscribedUser()` or `$this->createTeamWithAdminAndMember()` express the test's intent directly. This pattern is a core recommendation in the Laravel testing community for improving te...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
declarative-factory-methods/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### declarative factory methods
- **Purpose:** Declarative factory methods are custom helper methods that encapsulate complex object creation logic behind descriptive names, making test setup readable, self-documenting, and maintainable. Instead of inline factory calls chained with states, sequences, and relationships, declarative methods like `$this->createSubscribedUser()` or `$this->createTeamWithAdminAndMember()` express the test's intent directly. This pattern is a core recommendation in the Laravel testing community for improving te...
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: Model factories (definition, states), PHP class and trait basics, **Related Topics**: Factory states and sequences, Minimal data principle, Test organization patterns, **Advanced Follow-up**: Builder pattern for test data, Domain-specific test DSL, and Test data factory refactoring

## Dependency Graph
**Depends on:** **Prerequisites**: Model factories (definition, states), PHP class and trait basics, **Related Topics**: Factory states and sequences, Minimal data principle, Test organization patterns, **Advanced Follow-up**: Builder pattern for test data, Domain-specific test DSL, and Test data factory refactoring
**Depended on by:** Knowledge units that leverage or extend declarative factory methods patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for declarative factory methods.
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