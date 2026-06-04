# Decomposition: test organization patterns

## Topic Overview

Test organization patterns define how test files are structured, named, and grouped to maximize readability, maintainability, and reliability. In the Laravel ecosystem, two primary organizational approaches exist: grouping by feature (e.g., `tests/Feature/Invoice/InvoiceSubmissionTest.php`) or by type (e.g., `tests/Feature/Controllers/`, `tests/Feature/Services/`). The community standard in 2026 favors feature-based organization, with tests serving dual purposes as both validation and living ...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
test-organization-patterns/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### test organization patterns
- **Purpose:** Test organization patterns define how test files are structured, named, and grouped to maximize readability, maintainability, and reliability. In the Laravel ecosystem, two primary organizational approaches exist: grouping by feature (e.g., `tests/Feature/Invoice/InvoiceSubmissionTest.php`) or by type (e.g., `tests/Feature/Controllers/`, `tests/Feature/Services/`). The community standard in 2026 favors feature-based organization, with tests serving dual purposes as both validation and living ...
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: Pest/PHPUnit test writing, AAA pattern, Feature vs unit test distinction, **Related Topics**: Declarative factory methods, Flaky test prevention, Test naming conventions, **Advanced Follow-up**: Test suite refactoring strategies, Test coverage analysis, and Living documentation practices

## Dependency Graph
**Depends on:** **Prerequisites**: Pest/PHPUnit test writing, AAA pattern, Feature vs unit test distinction, **Related Topics**: Declarative factory methods, Flaky test prevention, Test naming conventions, **Advanced Follow-up**: Test suite refactoring strategies, Test coverage analysis, and Living documentation practices
**Depended on by:** Knowledge units that leverage or extend test organization patterns patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for test organization patterns.
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