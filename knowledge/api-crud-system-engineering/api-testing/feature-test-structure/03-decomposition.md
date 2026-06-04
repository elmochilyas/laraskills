# Decomposition: Feature Test Structure

## Boundary Analysis
This KU covers the physical and logical organization of feature test files — naming, directory layout, class structure, setUp patterns, and test method anatomy. It intentionally excludes specific assertion types (status code, JSON shape, headers) which belong in their own KUs. It also excludes test data creation (factories, seeders) covered in test-data-factory-design.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
The concept of "how to physically structure a feature test file" is foundational and cohesive — splitting would require every subsequent KU to repeat the setup patterns.

## Dependency Graph
- **Depends on:** PHPUnit/PestPHP test runner mechanics
- **Depends on:** Laravel TestCase base class conventions
- **Referenced by:** All assertion-focused KUs (happy-path, validation-failure, auth-failure, etc.)
- **Referenced by:** architecture-tests-for-apis (directory mirroring patterns)

## Follow-up Opportunities
- PestPHP `arch()` testing for enforcing directory structure conventions
- Automatic test generation based on route registrations
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization