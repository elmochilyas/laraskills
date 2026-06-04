# Decomposition: phpunit compatibility

## Topic Overview

Pest compiles to PHPUnit under the hood. This means all PHPUnit assertions, annotations, and extensions remain accessible from Pest test files. Understanding the compatibility layer is essential for: (1) gradually migrating existing PHPUnit test suites to Pest, (2) using PHPUnit-only features (like `@depends` or custom assertions) from Pest, and (3) debugging Pest failures by understanding the transpiled output. Laravel 13 ships with Pest by default but PHPUnit 12 remains fully supported.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
phpunit-compatibility/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### phpunit compatibility
- **Purpose:** Pest compiles to PHPUnit under the hood. This means all PHPUnit assertions, annotations, and extensions remain accessible from Pest test files. Understanding the compatibility layer is essential for: (1) gradually migrating existing PHPUnit test suites to Pest, (2) using PHPUnit-only features (like `@depends` or custom assertions) from Pest, and (3) debugging Pest failures by understanding the transpiled output. Laravel 13 ships with Pest by default but PHPUnit 12 remains fully supported.
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: PHPUnit lifecycle (setUp, tearDown, data providers, test order), Composer autoloading, **Related Topics**: Pest fundamentals, Test suite profiling, Parallel test execution, **Advanced Follow-up**: Custom PHPUnit extension development, and Pest plugin architecture

## Dependency Graph
**Depends on:** **Prerequisites**: PHPUnit lifecycle (setUp, tearDown, data providers, test order), Composer autoloading, **Related Topics**: Pest fundamentals, Test suite profiling, Parallel test execution, **Advanced Follow-up**: Custom PHPUnit extension development, and Pest plugin architecture
**Depended on by:** Knowledge units that leverage or extend phpunit compatibility patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for phpunit compatibility.
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