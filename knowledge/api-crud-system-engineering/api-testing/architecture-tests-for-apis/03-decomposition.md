# Decomposition: Architecture Tests for APIs

## Boundary Analysis
This KU covers structural codebase enforcement using PestPHP `arch()` testing — namespace rules, inheritance rules, naming conventions, and dependency restrictions. It excludes the testing of actual API behavior (covered by all other KUs) and excludes static analysis (PHPStan). The boundary is "code structure, not code logic."

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
Architecture testing is a single discipline. Splitting by rule type (inheritance vs naming vs dependencies) would create artificial boundaries since they all use the same `arch()` mechanism.

## Dependency Graph
- **Depends on:** PestPHP `arch()` testing API
- **Depends on:** PHP class reflection and namespace autoloading
- **Referenced by:** layer-isolation-in-tests (arch rules enforce layer boundaries)
- **Referenced by:** feature-test-structure (arch rules enforce test conventions)

## Follow-up Opportunities
- Custom arch rule creation for domain-specific patterns
- Combining arch tests with PHPStan for comprehensive enforcement
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization