# Decomposition: Action / Service Unit Testing

## Boundary Analysis
This KU covers isolated testing of action classes and service classes — business logic, orchestration, event dispatch, and job dispatch with mocked repository boundaries. It excludes controller testing (feature tests) and DTO testing (separate KU). The boundary is "the logic layer between controller and repository."

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
Action/service testing is a single methodology: instantiate with mocked dependencies, call method, assert outcome and side effects. Splitting by action vs service would create redundant KU content (both follow the same pattern).

## Dependency Graph
- **Depends on:** PHPUnit Mocking (expectations, stubs)
- **Depends on:** Laravel Event/Queue faking
- **Depends on:** dto-unit-testing (DTOs as service contracts)
- **Depends on:** layer-isolation-in-tests (isolation rationale)
- **Referenced by:** layer-isolation-in-tests (applies isolation to business logic)

## Follow-up Opportunities
- CQRS command/query bus testing
- Domain event-driven action testing
- Mutation testing for action/service coverage
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization