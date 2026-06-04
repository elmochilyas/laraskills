# Decomposition: mockery integration

## Topic Overview

Mockery is the de facto mocking framework in the Laravel ecosystem, providing `mock()`, `partialMock()`, and `spy()` helpers integrated into Laravel's base TestCase. While Laravel's native fakes are preferred for framework services, Mockery is used for custom interfaces, third-party SDKs, and scenarios requiring precise call verification. Understanding Mockery patterns is essential for testing service boundaries where fakes don't exist.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
mockery-integration/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### mockery integration
- **Purpose:** Mockery is the de facto mocking framework in the Laravel ecosystem, providing `mock()`, `partialMock()`, and `spy()` helpers integrated into Laravel's base TestCase. While Laravel's native fakes are preferred for framework services, Mockery is used for custom interfaces, third-party SDKs, and scenarios requiring precise call verification. Understanding Mockery patterns is essential for testing service boundaries where fakes don't exist.
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: Test double taxonomy, Service container, Dependency injection, **Related Topics**: Laravel fakes, HTTP Client faking, Partial mock patterns, Spy patterns, **Advanced Follow-up**: Custom Mockery matchers, Mockery configuration, and Partial mock vs extraction refactoring

## Dependency Graph
**Depends on:** **Prerequisites**: Test double taxonomy, Service container, Dependency injection, **Related Topics**: Laravel fakes, HTTP Client faking, Partial mock patterns, Spy patterns, **Advanced Follow-up**: Custom Mockery matchers, Mockery configuration, and Partial mock vs extraction refactoring
**Depended on by:** Knowledge units that leverage or extend mockery integration patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for mockery integration.
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