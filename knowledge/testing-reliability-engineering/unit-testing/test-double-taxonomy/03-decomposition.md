# Decomposition: test double taxonomy

## Topic Overview

Test doubles are stand-in objects that replace real dependencies during testing. The taxonomy—dummies, stubs, spies, mocks, and fakes—defines the purpose and behavior of each double type. Using the correct double type prevents brittle tests, over-specification, and false confidence. Laravel's built-in fakes (Http, Mail, Queue, etc.) are preferred over mocks for most scenarios. Understanding the taxonomy is foundational to writing tests that are both reliable and maintainable.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
test-double-taxonomy/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### test double taxonomy
- **Purpose:** Test doubles are stand-in objects that replace real dependencies during testing. The taxonomy—dummies, stubs, spies, mocks, and fakes—defines the purpose and behavior of each double type. Using the correct double type prevents brittle tests, over-specification, and false confidence. Laravel's built-in fakes (Http, Mail, Queue, etc.) are preferred over mocks for most scenarios. Understanding the taxonomy is foundational to writing tests that are both reliable and maintainable.
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: PHPUnit/Pest fundamentals, Dependency injection principles, **Related Topics**: Laravel fakes, Mockery integration, HTTP Client faking, Mail/Notification fakes, **Advanced Follow-up**: Partial mock strategies, Custom fake development, and Service container binding testing

## Dependency Graph
**Depends on:** **Prerequisites**: PHPUnit/Pest fundamentals, Dependency injection principles, **Related Topics**: Laravel fakes, Mockery integration, HTTP Client faking, Mail/Notification fakes, **Advanced Follow-up**: Partial mock strategies, Custom fake development, and Service container binding testing
**Depended on by:** Knowledge units that leverage or extend test double taxonomy patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for test double taxonomy.
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