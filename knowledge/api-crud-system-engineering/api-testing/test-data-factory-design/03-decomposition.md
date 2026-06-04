# Decomposition: Test Data Factory Design

## Boundary Analysis
This KU covers Laravel model factory design — definitions, states, sequences, relationships, afterCreating callbacks, and factory organization. It excludes test structure (feature-test-structure) and specific test patterns (happy-path, validation-failure, etc.). The boundary is "how test data is created, not how it's used."

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
Factory design is a single data-creation concern. Splitting by factory feature (states vs relationships vs sequences) would create fragments that can't stand independently — each aspect of factory design is learned together.

## Dependency Graph
- **Depends on:** Laravel Eloquent Models (schema knowledge)
- **Depends on:** FakerPHP Library (fake data generation)
- **Referenced by:** All feature-test KUs (factories provide test data)
- **Referenced by:** happy-path-testing (factory-created data for assertions)
- **Referenced by:** validation-failure-testing (factory raw() for request bodies)

## Follow-up Opportunities
- Builder-pattern test data factories (decoupled from Eloquent)
- Factory collections and custom collection methods
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization